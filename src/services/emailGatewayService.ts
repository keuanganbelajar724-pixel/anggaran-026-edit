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

/**
 * Get current Email Gateway configuration status (Server + Firestore fallback)
 */
export async function getEmailGatewayStatus(): Promise<{ config: EmailGatewayConfig; status: EmailGatewayPublicStatus }> {
  let serverConfig: EmailGatewayPublicStatus | null = null;

  try {
    const res = await fetch('/api/email/config');
    if (res.ok) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data.status === 'ok' && data.config) {
          serverConfig = data.config;
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
            // Re-seed backend server with cloud data
            try {
              const seedRes = await fetch('/api/email/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cloudData)
              });
              if (seedRes.ok) {
                const seedText = await seedRes.text();
                try {
                  const seedData = JSON.parse(seedText);
                  if (seedData?.config) {
                    serverConfig = seedData.config;
                  }
                } catch {}
              }
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

  if (serverConfig) {
    // Cache local backup
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverConfig));
    } catch {
      // ignore
    }
    return {
      config: serverConfig as any,
      status: serverConfig
    };
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
 * Save Email Gateway configuration to server, Firestore, and local backup
 */
export async function saveEmailGatewayConfig(config: EmailGatewayConfig): Promise<{ success: boolean; message: string; savedConfig?: EmailGatewayConfig }> {
  try {
    const dataToSave: EmailGatewayConfig = {
      ...config,
      updatedAt: new Date().toISOString()
    };

    // 1. ALWAYS persist to LocalStorage first (instant UI update & offline reliability)
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
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
    let returnConfig = dataToSave;
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
            returnConfig = data.config;
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
      savedConfig: returnConfig
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
    const res = await fetch('/api/email/test', {
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
    const res = await fetch('/api/email/send', {
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

