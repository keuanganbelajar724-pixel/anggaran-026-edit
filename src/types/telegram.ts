export interface TelegramGatewayConfig {
  botToken: string;
  botUsername?: string;
  botName?: string;
  defaultChatId?: string;
  channelOrGroupId?: string;
  parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  testChatId?: string;
  statusConnection?: 'CONNECTED' | 'DISCONNECTED' | 'CHECKING';
  lastPingTime?: string;
  savedAt?: string;
  isConfigured?: boolean;
}

export interface TelegramGatewayPublicStatus {
  botUsername?: string;
  botName?: string;
  defaultChatId?: string;
  channelOrGroupId?: string;
  parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  isConfigured: boolean;
  botTokenMasked?: string;
  statusConnection?: string;
  lastPingTime?: string;
  updatedAt?: string;
}

export interface TelegramSendResult {
  success: boolean;
  message: string;
  messageId?: number | string;
  chatId?: string;
  error?: string;
}
