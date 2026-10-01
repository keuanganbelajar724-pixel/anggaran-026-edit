import path from 'path';
import fs from 'fs';

export interface TelegramServerConfig {
  botToken: string;
  botUsername?: string;
  botName?: string;
  defaultChatId?: string;
  channelOrGroupId?: string;
  parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  testChatId?: string;
  updatedAt?: string;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), 'telegram_config_generated.json');

// Initialize configuration from JSON file or environment variables
export function loadTelegramConfig(): TelegramServerConfig {
  let fileConfig: Partial<TelegramServerConfig> = {};
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));
    }
  } catch (err) {
    console.warn('Could not load telegram_config_generated.json:', err);
  }

  const botToken = fileConfig.botToken || process.env.TELEGRAM_BOT_TOKEN || '';
  const botUsername = fileConfig.botUsername || process.env.TELEGRAM_BOT_USERNAME || '';
  const botName = fileConfig.botName || process.env.TELEGRAM_BOT_NAME || 'KPPN Semarang I Bot';
  const defaultChatId = fileConfig.defaultChatId || process.env.TELEGRAM_DEFAULT_CHAT_ID || '';
  const channelOrGroupId = fileConfig.channelOrGroupId || process.env.TELEGRAM_CHANNEL_ID || '';
  const parseMode = (fileConfig.parseMode || 'HTML') as 'HTML' | 'MarkdownV2' | 'Markdown';
  const testChatId = fileConfig.testChatId || process.env.TELEGRAM_TEST_CHAT_ID || defaultChatId;

  return {
    botToken,
    botUsername,
    botName,
    defaultChatId,
    channelOrGroupId,
    parseMode,
    testChatId,
    updatedAt: fileConfig.updatedAt || new Date().toISOString()
  };
}

export function saveTelegramConfig(config: TelegramServerConfig): TelegramServerConfig {
  try {
    const dataToSave = {
      ...config,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(dataToSave, null, 2), 'utf8');
    return dataToSave;
  } catch (err) {
    console.error('Failed to save telegram_config_generated.json:', err);
    return config;
  }
}

export function getPublicTelegramStatus(config: TelegramServerConfig) {
  const isConfigured = Boolean(config.botToken && config.botToken.trim().length > 10 && config.botToken.includes(':'));
  
  let maskedToken = '';
  if (config.botToken && config.botToken.length > 10) {
    const parts = config.botToken.split(':');
    if (parts.length === 2) {
      maskedToken = `${parts[0]}:••••••••${parts[1].slice(-4)}`;
    } else {
      maskedToken = `${config.botToken.slice(0, 4)}••••••••${config.botToken.slice(-4)}`;
    }
  }

  return {
    isConfigured,
    botUsername: config.botUsername,
    botName: config.botName,
    defaultChatId: config.defaultChatId,
    channelOrGroupId: config.channelOrGroupId,
    parseMode: config.parseMode || 'HTML',
    testChatId: config.testChatId,
    botTokenMasked: maskedToken,
    updatedAt: config.updatedAt
  };
}

/**
 * Verify Bot Token with Telegram getMe API
 */
export async function verifyTelegramBot(botToken: string): Promise<{ ok: boolean; result?: any; error?: string }> {
  try {
    const cleanToken = botToken.trim();
    if (!cleanToken || !cleanToken.includes(':')) {
      return { ok: false, error: 'Format Bot Token tidak valid. Token harus memiliki format 123456789:ABC...' };
    }

    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
    const data = await res.json();
    if (data.ok && data.result) {
      return {
        ok: true,
        result: {
          id: data.result.id,
          username: data.result.username ? `@${data.result.username}` : '',
          firstName: data.result.first_name || '',
          canJoinGroups: data.result.can_join_groups,
          canReadAllGroupMessages: data.result.can_read_all_group_messages
        }
      };
    } else {
      return { ok: false, error: data.description || 'Gagal memverifikasi token bot ke Telegram API.' };
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Gagal menghubungi server Telegram API.' };
  }
}

/**
 * Send message via Telegram Bot API
 */
export async function sendTelegramMessage(
  config: TelegramServerConfig,
  params: {
    chatId: string;
    text: string;
    parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
    disableWebPagePreview?: boolean;
  }
): Promise<{ success: boolean; message: string; messageId?: number | string; error?: string }> {
  try {
    const botToken = config.botToken ? config.botToken.trim() : '';
    if (!botToken) {
      return { success: false, error: 'Telegram Bot Token belum dikonfigurasi di pengaturan gateway.', message: 'Token kosong' };
    }

    const targetChatId = (params.chatId || config.defaultChatId || '').trim();
    if (!targetChatId) {
      return { success: false, error: 'Chat ID / Username Telegram tujuan tidak boleh kosong.', message: 'Chat ID kosong' };
    }

    const payload: any = {
      chat_id: targetChatId,
      text: params.text,
      parse_mode: params.parseMode || config.parseMode || 'HTML',
      disable_web_page_preview: params.disableWebPagePreview ?? true
    };

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.ok && data.result) {
      return {
        success: true,
        message: `Pesan Telegram berhasil terkirim ke ${targetChatId}!`,
        messageId: data.result.message_id
      };
    } else {
      // If error is about parse_mode (e.g. invalid HTML tags), retry without parse mode as plain text
      if (data.description && (data.description.includes('can\'t parse entities') || data.description.includes('tag'))) {
        try {
          const retryRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: targetChatId,
              text: params.text.replace(/<[^>]*>?/gm, ''), // strip html tags
              disable_web_page_preview: true
            })
          });
          const retryData = await retryRes.json();
          if (retryData.ok && retryData.result) {
            return {
              success: true,
              message: `Pesan Telegram berhasil terkirim ke ${targetChatId} (mode teks biasa)!`,
              messageId: retryData.result.message_id
            };
          }
        } catch {
          // ignore retry failure
        }
      }

      return {
        success: false,
        error: data.description || 'Telegram API menolak pengiriman pesan.',
        message: data.description || 'Gagal mengirim pesan Telegram'
      };
    }
  } catch (e: any) {
    return {
      success: false,
      error: e?.message || 'Gagal menghubungi Telegram Bot API.',
      message: 'Kesalahan jaringan'
    };
  }
}
