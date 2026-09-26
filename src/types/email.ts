export type EmailProvider = 'brevo' | 'resend' | 'smtp';

export interface EmailGatewayConfig {
  provider: EmailProvider;
  senderName: string;
  senderEmail: string;
  // Brevo
  brevoApiKey?: string;
  // Resend
  resendApiKey?: string;
  // SMTP / Gmail
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  
  updatedAt?: string;
  isConfigured?: boolean;
}

export interface EmailGatewayPublicStatus {
  provider: EmailProvider;
  senderName: string;
  senderEmail: string;
  isConfigured: boolean;
  brevoApiKeyMasked?: string;
  resendApiKeyMasked?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassMasked?: string;
  updatedAt?: string;
}

export interface EmailSendResult {
  success: boolean;
  message: string;
  provider?: string;
  messageId?: string;
  error?: string;
}
