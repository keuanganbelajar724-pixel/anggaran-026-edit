import { EmailGatewayConfig, EmailGatewayPublicStatus, EmailSendResult } from '../types/email';

const DEFAULT_CONFIG: EmailGatewayConfig = {
  provider: 'brevo',
  senderName: 'KPPN Semarang I - Sistem ANGKASA',
  senderEmail: 'kppn026.semarang@gmail.com',
  brevoApiKey: '',
  resendApiKey: '',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: '',
  smtpPass: '',
  isConfigured: false
};

const LOCAL_STORAGE_KEY = 'kppn_email_gateway_config_cache';

/**
 * Get current Email Gateway configuration status
 */
export async function getEmailGatewayStatus(): Promise<{ config: EmailGatewayConfig; status: EmailGatewayPublicStatus }> {
  try {
    const res = await fetch('/api/email/config');
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && data.config) {
        // Cache local backup
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.config));
        } catch {
          // ignore
        }
        return {
          config: data.config,
          status: data.config
        };
      }
    }
  } catch (err) {
    console.warn('Could not fetch email config from server, falling back to local cache', err);
  }

  // Fallback to local storage
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      return { config: parsed, status: parsed };
    }
  } catch {
    // ignore
  }

  return { config: DEFAULT_CONFIG, status: { ...DEFAULT_CONFIG, isConfigured: false } };
}

/**
 * Save Email Gateway configuration to server and local backup
 */
export async function saveEmailGatewayConfig(config: EmailGatewayConfig): Promise<{ success: boolean; message: string; savedConfig?: EmailGatewayConfig }> {
  try {
    const res = await fetch('/api/email/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    const data = await res.json();
    if (res.ok && data.status === 'ok') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.config || config));
      } catch {
        // ignore
      }
      return {
        success: true,
        message: 'Konfigurasi Email Gateway berhasil disimpan ke server.',
        savedConfig: data.config || config
      };
    }

    return {
      success: false,
      message: data.message || 'Gagal menyimpan konfigurasi email ke server.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Terjadi kesalahan jaringan saat menyimpan konfigurasi.'
    };
  }
}

/**
 * Test send email through the configured or pending email gateway
 */
export async function testSendEmail(params: {
  testRecipient: string;
  configOverride?: Partial<EmailGatewayConfig>;
}): Promise<EmailSendResult> {
  try {
    const res = await fetch('/api/email/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || 'Email uji coba berhasil dikirim! Silakan periksa inbox / spam.',
        provider: data.provider,
        messageId: data.messageId
      };
    }

    return {
      success: false,
      message: data.error || data.message || 'Gagal mengirim email uji coba. Periksa API key atau pengaturan pengirim.',
      error: data.error
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Terjadi kesalahan jaringan saat mencoba mengirim email uji coba.',
      error: err.message
    };
  }
}

/**
 * Send Password Reset OTP to user's registered email
 */
export async function sendPasswordResetEmailOtp(params: {
  userId: string;
  email: string;
  displayName: string;
  username: string;
  otp: string;
}): Promise<EmailSendResult> {
  try {
    const res = await fetch('/api/send-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || 'Kode OTP telah berhasil dikirimkan ke email Anda.',
        provider: data.provider
      };
    }

    return {
      success: false,
      message: data.error || data.message || 'Gagal mengirim email OTP verifikasi.',
      error: data.error
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Terjadi kendala jaringan saat menghubungi server pengirim email.',
      error: err.message
    };
  }
}
