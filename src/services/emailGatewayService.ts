import { EmailGatewayConfig, EmailGatewayPublicStatus, EmailSendResult } from '../types/email';
import { db, doc, getDoc, setDoc } from '../lib/firebase';

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

function maskApiKey(key?: string): string {
  if (!key) return '';
  const clean = key.trim();
  if (clean.length <= 6) return '****';
  return `${clean.slice(0, 3)}••••••••${clean.slice(-4)}`;
}

export function buildPublicEmailStatus(cfg: Partial<EmailGatewayConfig>): EmailGatewayPublicStatus {
  const provider = cfg.provider || 'brevo';
  const cleanBrevo = (cfg.brevoApiKey || '').trim();
  const cleanResend = (cfg.resendApiKey || '').trim();
  const cleanSmtpUser = (cfg.smtpUser || '').trim();
  const cleanSmtpPass = (cfg.smtpPass || '').trim();

  const isBrevoConfigured = Boolean(cleanBrevo.length > 8 && !cleanBrevo.includes('test-12345678') && !cleanBrevo.includes('••••'));
  const isResendConfigured = Boolean(cleanResend.length > 8 && !cleanResend.includes('••••'));
  const isSmtpConfigured = Boolean(cleanSmtpUser && cleanSmtpPass && !cleanSmtpPass.includes('••••'));

  const isConfigured = 
    (provider === 'brevo' && isBrevoConfigured) ||
    (provider === 'resend' && isResendConfigured) ||
    (provider === 'smtp' && isSmtpConfigured);

  return {
    provider,
    senderName: cfg.senderName || 'KPPN Semarang I - Sistem ANGKASA',
    senderEmail: cfg.senderEmail || 'kppn026.semarang@gmail.com',
    isConfigured,
    brevoApiKeyMasked: isBrevoConfigured ? maskApiKey(cleanBrevo) : '',
    resendApiKeyMasked: isResendConfigured ? maskApiKey(cleanResend) : '',
    smtpHost: cfg.smtpHost || 'smtp.gmail.com',
    smtpPort: cfg.smtpPort || 465,
    smtpUser: cfg.smtpUser || '',
    smtpPassMasked: isSmtpConfigured ? '••••••••••••••••' : '',
    updatedAt: cfg.updatedAt || new Date().toISOString()
  };
}

/**
 * Get current Email Gateway configuration status (Server + Firestore fallback)
 */
export async function getEmailGatewayStatus(): Promise<{ config: EmailGatewayConfig; status: EmailGatewayPublicStatus }> {
  let serverConfig: EmailGatewayPublicStatus | null = null;
  let rawConfig: EmailGatewayConfig | null = null;

  try {
    const res = await fetch('/api/email/config');
    if (res.ok) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data.status === 'ok' && data.config) {
          // If server returns dummy test key from old cache, ignore it
          if (!data.config.brevoApiKeyMasked?.endsWith('5678') || data.config.brevoApiKeyMasked?.length > 15) {
            serverConfig = data.config;
          }
        }
      } catch {}
    }
  } catch (err) {
    console.warn('Could not fetch email config from server:', err);
  }

  // If server is not configured or lost config after container restart, try retrieving from Firestore
  if (!serverConfig || !serverConfig.isConfigured) {
    try {
      if (db) {
        const snap = await getDoc(doc(db, 'settings', 'email_gateway_config'));
        if (snap && typeof snap.exists === 'function' && snap.exists()) {
          const cloudData = snap.data() as Partial<EmailGatewayConfig>;
          if (cloudData && (cloudData.brevoApiKey || cloudData.resendApiKey || (cloudData.smtpUser && cloudData.smtpPass))) {
            // Build verified public status directly from cloud database
            serverConfig = buildPublicEmailStatus(cloudData);
            rawConfig = { ...DEFAULT_CONFIG, ...cloudData };

            // Re-seed backend server with cloud data in background
            try {
              fetch('/api/email/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cloudData)
              }).catch(() => {});
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (e) {
      console.warn('Notice loading cloud email gateway config:', e);
    }
  }

  // Fallback to local storage
  if (!serverConfig || !serverConfig.isConfigured) {
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.brevoApiKey || parsed.resendApiKey || (parsed.smtpUser && parsed.smtpPass)) {
          serverConfig = buildPublicEmailStatus(parsed);
          rawConfig = { ...DEFAULT_CONFIG, ...parsed };
        } else if (parsed.isConfigured && (parsed.brevoApiKeyMasked || parsed.smtpPassMasked)) {
          serverConfig = parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  if (serverConfig) {
    // Cache local backup
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverConfig));
    } catch {
      // ignore
    }
    return {
      config: (rawConfig || serverConfig) as any,
      status: serverConfig
    };
  }

  return { config: DEFAULT_CONFIG, status: { ...DEFAULT_CONFIG, isConfigured: false } };
}

/**
 * Save Email Gateway configuration to server, Firestore, and local backup
 */
export async function saveEmailGatewayConfig(config: EmailGatewayConfig): Promise<{ success: boolean; message: string; savedConfig?: EmailGatewayConfig }> {
  try {
    // Discard any dummy test key so it never gets saved
    const cleanBrevo = (config.brevoApiKey || '').trim();
    const finalBrevo = cleanBrevo.includes('test-12345678') ? '' : cleanBrevo;

    const dataToSave: EmailGatewayConfig = {
      ...config,
      brevoApiKey: finalBrevo,
      updatedAt: new Date().toISOString()
    };

    const publicStatus = buildPublicEmailStatus(dataToSave);

    // 1. ALWAYS persist to LocalStorage first (instant UI update & offline reliability)
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(publicStatus));
      localStorage.setItem('email_gateway_raw_config', JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('LocalStorage save notice:', e);
    }

    // 2. ALWAYS persist to Firestore Settings (cloud database accessible anywhere)
    try {
      if (db) {
        await setDoc(
          doc(db, 'settings', 'email_gateway_config'),
          dataToSave,
          { merge: true }
        );
      }
    } catch (cloudErr) {
      console.warn('Firestore email config save notice:', cloudErr);
    }

    // 3. Attempt to save to backend server (in a safe try/catch that NEVER crashes if the server returns HTML or is sleeping)
    let returnStatus: any = publicStatus;
    try {
      const res = await fetch('/api/email/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data.status === 'ok' && data.config) {
            returnStatus = data.config;
          }
        } catch {
          // not json, ignore
        }
      }
    } catch (serverErr) {
      console.warn('Backend server api/email/config notice:', serverErr);
    }

    return {
      success: true,
      message: 'Konfigurasi Email Gateway berhasil disimpan ke Cloud Firestore & Server!',
      savedConfig: returnStatus
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal menyimpan konfigurasi email.'
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
    let override = params.configOverride;
    if (!override) {
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          override = JSON.parse(local);
        }
      } catch {}
    }

    const res = await fetch('/api/email/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        configOverride: override
      })
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        message: 'Server sedang memuat atau tidak dapat dihubungi. Silakan coba sesaat lagi.'
      };
    }

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

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        message: 'Server tidak dapat dihubungi saat mengirim kode verifikasi OTP.'
      };
    }

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

/**
 * Send official Jarkom / Broadcast Email to Satker or Pejabat
 */
export async function sendBroadcastEmail(params: {
  toEmail: string;
  toName?: string;
  subject: string;
  messageText: string;
  htmlContent?: string;
  satkerNama?: string;
  satkerKode?: string;
  roleLabel?: string;
  configOverride?: Partial<EmailGatewayConfig>;
}): Promise<EmailSendResult> {
  try {
    let override = params.configOverride;
    if (!override) {
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          override = JSON.parse(local);
        }
      } catch {}
    }

    const payload = {
      ...params,
      configOverride: override
    };

    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        message: 'Server sedang memuat atau tidak dapat dihubungi.'
      };
    }

    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || 'Email siaran / jarkom berhasil terkirim!',
        provider: data.provider,
        messageId: data.messageId
      };
    }

    return {
      success: false,
      message: data.error || data.message || 'Gagal mengirim email jarkom.',
      error: data.error
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Terjadi kesalahan jaringan saat mengirim email.',
      error: err.message
    };
  }
}

