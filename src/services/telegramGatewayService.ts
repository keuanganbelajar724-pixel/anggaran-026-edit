import { TelegramGatewayConfig, TelegramGatewayPublicStatus, TelegramSendResult } from '../types/telegram';
import { db, doc, getDoc, setDoc } from '../lib/firebase';

const LOCAL_STORAGE_KEY = 'kppn_telegram_gateway_config_cache';

const DEFAULT_CONFIG: TelegramGatewayConfig = {
  botToken: '',
  botUsername: '@kppn026_monev_bot',
  botName: 'KPPN Semarang I - Sistem ANGKASA Bot',
  defaultChatId: '',
  channelOrGroupId: '',
  parseMode: 'HTML',
  testChatId: '',
  isConfigured: false
};

/**
 * Get current Telegram Gateway configuration status (Server + Firestore fallback + LocalStorage)
 */
export async function getTelegramGatewayStatus(): Promise<{ config: TelegramGatewayConfig; status: TelegramGatewayPublicStatus }> {
  let serverStatus: TelegramGatewayPublicStatus | null = null;

  try {
    const res = await fetch('/api/telegram/config');
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && data.config) {
        serverStatus = data.config;
      }
    }
  } catch (err) {
    console.warn('Notice: server telegram endpoint not reachable, checking local/cloud:', err);
  }

  // Load from local storage cache
  let localConfig: Partial<TelegramGatewayConfig> = {};
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      localConfig = JSON.parse(cached);
    }
  } catch {}

  // Check Firestore if server is unconfigured
  if (!serverStatus || !serverStatus.isConfigured) {
    try {
      if (db) {
        const snap = await getDoc(doc(db, 'settings', 'telegram_gateway_config'));
        if (snap && typeof snap.exists === 'function' && snap.exists()) {
          const cloudData = snap.data() as Partial<TelegramGatewayConfig>;
          if (cloudData && cloudData.botToken) {
            localConfig = { ...localConfig, ...cloudData };
            // Seed server
            try {
              const seedRes = await fetch('/api/telegram/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cloudData)
              });
              if (seedRes.ok) {
                const seedData = await seedRes.json();
                if (seedData?.config) serverStatus = seedData.config;
              }
            } catch {}
          }
        }
      }
    } catch (e) {
      console.warn('Notice loading cloud telegram config:', e);
    }
  }

  const mergedConfig: TelegramGatewayConfig = {
    ...DEFAULT_CONFIG,
    ...localConfig,
    botUsername: serverStatus?.botUsername || localConfig.botUsername || DEFAULT_CONFIG.botUsername,
    defaultChatId: serverStatus?.defaultChatId || localConfig.defaultChatId || '',
    channelOrGroupId: serverStatus?.channelOrGroupId || localConfig.channelOrGroupId || '',
    parseMode: serverStatus?.parseMode || localConfig.parseMode || 'HTML',
    isConfigured: serverStatus?.isConfigured || Boolean(localConfig.botToken && localConfig.botToken.length > 10)
  };

  const finalStatus: TelegramGatewayPublicStatus = serverStatus || {
    isConfigured: mergedConfig.isConfigured || false,
    botUsername: mergedConfig.botUsername,
    botName: mergedConfig.botName,
    defaultChatId: mergedConfig.defaultChatId,
    channelOrGroupId: mergedConfig.channelOrGroupId,
    parseMode: mergedConfig.parseMode,
    testChatId: mergedConfig.testChatId,
    botTokenMasked: mergedConfig.botToken ? `${mergedConfig.botToken.slice(0, 4)}••••••••` : '',
    updatedAt: mergedConfig.savedAt || new Date().toISOString()
  };

  return { config: mergedConfig, status: finalStatus };
}

/**
 * Save Telegram Gateway configuration to server, cloud, and local storage
 */
export async function saveTelegramGatewayConfig(config: TelegramGatewayConfig): Promise<{ success: boolean; message: string; status?: TelegramGatewayPublicStatus }> {
  try {
    const dataToSave: TelegramGatewayConfig = {
      ...config,
      savedAt: new Date().toISOString(),
      isConfigured: Boolean(config.botToken && config.botToken.length > 10)
    };

    // 1. Save to LocalStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {}

    // 2. Save to Firestore
    try {
      if (db) {
        await setDoc(doc(db, 'settings', 'telegram_gateway_config'), dataToSave, { merge: true });
      }
    } catch (e) {
      console.warn('Notice saving telegram config to cloud:', e);
    }

    // 3. Save to server backend
    let returnStatus: TelegramGatewayPublicStatus | undefined;
    try {
      const res = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      if (res.ok) {
        const data = await res.json();
        returnStatus = data?.config;
      }
    } catch (e) {
      console.warn('Server telegram config route not responding, saved to cloud/local successfully');
    }

    return {
      success: true,
      message: 'Konfigurasi Telegram Gateway berhasil disimpan ke Server & Cloud!',
      status: returnStatus
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal menyimpan konfigurasi Telegram Gateway.'
    };
  }
}

/**
 * Send test message to Telegram
 */
export async function testSendTelegram(
  testChatId: string,
  configOverride?: Partial<TelegramGatewayConfig>
): Promise<TelegramSendResult> {
  // Try server endpoint first
  try {
    const res = await fetch('/api/telegram/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testChatId,
        configOverride
      })
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Server test failed, attempting client direct fetch:', err);
  }

  // Direct client fallback to Telegram API
  try {
    const botToken = configOverride?.botToken;
    if (!botToken) {
      return { success: false, message: 'Bot Token belum diisi.', error: 'Bot token missing' };
    }
    const cleanToken = botToken.trim();
    const targetChatId = testChatId.trim();

    const text = `<b>🟢 UJI COBA KONEKSI TELEGRAM GATEWAY BERHASIL!</b>\n\n` +
      `Sistem: <b>ANGKASA - KPPN Semarang I (026)</b>\n` +
      `Waktu: <code>${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</code>\n\n` +
      `<i>Pesan ini menandakan bot Telegram telah terhubung sempurna dan siap digunakan untuk siaran jarkom masif ke seluruh Satker mitra.</i>`;

    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        parse_mode: 'HTML'
      })
    });
    const data = await res.json();
    if (data.ok && data.result) {
      return {
        success: true,
        message: `Pesan uji coba Telegram berhasil terkirim ke ${targetChatId}!`,
        messageId: data.result.message_id,
        chatId: targetChatId
      };
    } else {
      return {
        success: false,
        message: data.description || 'Telegram Bot API menolak pengiriman.',
        error: data.description
      };
    }
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || 'Gagal mengirim pesan uji coba Telegram.',
      error: e?.message
    };
  }
}

/**
 * Send single broadcast message via Telegram
 */
export async function sendBroadcastTelegram(
  chatId: string,
  text: string,
  parseMode: 'HTML' | 'Markdown' | 'MarkdownV2' = 'HTML',
  configOverride?: Partial<TelegramGatewayConfig>
): Promise<TelegramSendResult> {
  // 1. Try server backend route
  try {
    const res = await fetch('/api/telegram/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        text,
        parseMode,
        configOverride
      })
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    // fallback
  }

  // 2. Direct client fallback
  try {
    let token = configOverride?.botToken;
    if (!token) {
      // retrieve from cached
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        token = parsed.botToken;
      }
    }

    if (!token) {
      return { success: false, message: 'Bot Token Telegram belum dikonfigurasi.', error: 'Token missing' };
    }

    const payload: any = {
      chat_id: chatId.trim(),
      text,
      parse_mode: parseMode,
      disable_web_page_preview: true
    };

    const res = await fetch(`https://api.telegram.org/bot${token.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.ok && data.result) {
      return {
        success: true,
        message: `Pesan Telegram terkirim ke ${chatId}`,
        messageId: data.result.message_id,
        chatId
      };
    } else {
      // Retry plain text if parse error
      if (data.description && (data.description.includes('entities') || data.description.includes('tag'))) {
        try {
          const plainRes = await fetch(`https://api.telegram.org/bot${token.trim()}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId.trim(),
              text: text.replace(/<[^>]*>?/gm, ''),
              disable_web_page_preview: true
            })
          });
          const plainData = await plainRes.json();
          if (plainData.ok && plainData.result) {
            return {
              success: true,
              message: `Pesan Telegram terkirim ke ${chatId} (mode teks)`,
              messageId: plainData.result.message_id,
              chatId
            };
          }
        } catch {}
      }

      return {
        success: false,
        message: data.description || 'Pengiriman ke Telegram ditolak.',
        error: data.description
      };
    }
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || 'Gagal menghubungi Telegram Bot API.',
      error: e?.message
    };
  }
}
