import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

export type EmailProvider = 'brevo' | 'resend' | 'smtp';

export interface EmailConfig {
  provider: EmailProvider;
  senderName: string;
  senderEmail: string;
  brevoApiKey: string;
  resendApiKey: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  updatedAt?: string;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), 'email_config_generated.json');

// Initialize configuration from JSON file or environment variables
export function loadEmailConfig(): EmailConfig {
  let fileConfig: Partial<EmailConfig> = {};
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));
    }
  } catch (err) {
    console.warn('Could not load email_config_generated.json:', err);
  }

  const provider = (fileConfig.provider || process.env.EMAIL_GATEWAY_PROVIDER || 'brevo') as EmailProvider;
  const brevoApiKey = fileConfig.brevoApiKey || process.env.BREVO_API_KEY || '';
  const resendApiKey = fileConfig.resendApiKey || process.env.RESEND_API_KEY || '';
  const smtpHost = fileConfig.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(fileConfig.smtpPort || process.env.SMTP_PORT || 465);
  const smtpSecure = fileConfig.smtpSecure ?? (smtpPort === 465);
  const smtpUser = fileConfig.smtpUser || process.env.SMTP_USER || '';
  const smtpPass = fileConfig.smtpPass || process.env.SMTP_PASS || '';
  const senderName = fileConfig.senderName || process.env.EMAIL_SENDER_NAME || 'KPPN Semarang I - Sistem ANGKASA';
  const senderEmail = fileConfig.senderEmail || process.env.EMAIL_SENDER_ADDRESS || (smtpUser || 'kppn026.semarang@gmail.com');

  return {
    provider,
    senderName,
    senderEmail,
    brevoApiKey,
    resendApiKey,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    updatedAt: fileConfig.updatedAt || new Date().toISOString()
  };
}

export function saveEmailConfig(config: EmailConfig): EmailConfig {
  const updated: EmailConfig = {
    ...config,
    updatedAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed to save email_config_generated.json:', err);
  }

  return updated;
}

export function maskString(str: string): string {
  if (!str) return '';
  const clean = str.trim();
  if (clean.length <= 4) return '****';
  return `${clean.slice(0, 3)}••••••••${clean.slice(-4)}`;
}

export function getPublicEmailStatus(config: EmailConfig) {
  const isBrevoConfigured = Boolean(config.brevoApiKey && config.brevoApiKey.trim().length > 10);
  const isResendConfigured = Boolean(config.resendApiKey && config.resendApiKey.trim().length > 10);
  const isSmtpConfigured = Boolean(config.smtpUser && config.smtpPass);

  const isConfigured = 
    (config.provider === 'brevo' && isBrevoConfigured) ||
    (config.provider === 'resend' && isResendConfigured) ||
    (config.provider === 'smtp' && isSmtpConfigured);

  return {
    provider: config.provider,
    senderName: config.senderName,
    senderEmail: config.senderEmail,
    isConfigured,
    brevoApiKeyMasked: config.brevoApiKey ? maskString(config.brevoApiKey) : '',
    resendApiKeyMasked: config.resendApiKey ? maskString(config.resendApiKey) : '',
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort,
    smtpUser: config.smtpUser,
    smtpPassMasked: config.smtpPass ? '••••••••••••••••' : '',
    updatedAt: config.updatedAt
  };
}

/**
 * Sends an email using Brevo (Sendinblue) REST API v3
 */
async function sendViaBrevo(
  apiKey: string,
  senderName: string,
  senderEmail: string,
  toEmail: string,
  toName: string,
  subject: string,
  htmlContent: string
): Promise<{ messageId?: string }> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('API Key Brevo belum diisi. Harap masukkan API Key Brevo di menu Manajemen User Admin Super.');
  }

  const endpoint = 'https://api.brevo.com/v3/smtp/email';
  const payload = {
    sender: {
      name: senderName || 'KPPN Semarang I - Sistem ANGKASA',
      email: senderEmail || 'kppn026.semarang@gmail.com'
    },
    to: [
      {
        email: toEmail,
        name: toName || toEmail
      }
    ],
    subject,
    htmlContent
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey.trim(),
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let jsonRes: any = {};
  try {
    jsonRes = JSON.parse(responseText);
  } catch {
    // ignore
  }

  if (!response.ok) {
    const errorMsg = jsonRes?.message || jsonRes?.error || responseText || `HTTP ${response.status}`;
    throw new Error(`Gagal mengirim via Brevo (${response.status}): ${errorMsg}`);
  }

  return { messageId: jsonRes?.messageId || jsonRes?.id || 'brevo-sent' };
}

/**
 * Sends an email using Resend REST API
 */
async function sendViaResend(
  apiKey: string,
  senderName: string,
  senderEmail: string,
  toEmail: string,
  subject: string,
  htmlContent: string
): Promise<{ messageId?: string }> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('API Key Resend belum diisi. Harap masukkan API Key Resend di menu Manajemen User Admin Super.');
  }

  const endpoint = 'https://api.resend.com/emails';
  // Resend default verified testing sender if user doesn't have custom domain
  const fromAddress = senderEmail && !senderEmail.includes('gmail.com') 
    ? `${senderName || 'KPPN Semarang I'} <${senderEmail}>`
    : `${senderName || 'KPPN Semarang I'} <onboarding@resend.dev>`;

  const payload = {
    from: fromAddress,
    to: [toEmail],
    subject,
    html: htmlContent
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let jsonRes: any = {};
  try {
    jsonRes = JSON.parse(responseText);
  } catch {
    // ignore
  }

  if (!response.ok) {
    const errorMsg = jsonRes?.message || jsonRes?.error || responseText || `HTTP ${response.status}`;
    throw new Error(`Gagal mengirim via Resend (${response.status}): ${errorMsg}`);
  }

  return { messageId: jsonRes?.id || 'resend-sent' };
}

/**
 * Sends an email using SMTP / Gmail App Password
 */
async function sendViaSmtp(
  smtpHost: string,
  smtpPort: number,
  smtpSecure: boolean,
  smtpUser: string,
  smtpPass: string,
  senderName: string,
  senderEmail: string,
  toEmail: string,
  subject: string,
  htmlContent: string
): Promise<{ messageId?: string }> {
  if (!smtpUser || !smtpPass) {
    throw new Error('Kredensial SMTP / Gmail belum lengkap. Masukkan Username Email dan App Password di menu Manajemen User.');
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost || 'smtp.gmail.com',
    port: Number(smtpPort) || 465,
    secure: smtpSecure ?? (Number(smtpPort) === 465),
    auth: {
      user: smtpUser.trim(),
      pass: smtpPass.trim()
    }
  });

  const info = await transporter.sendMail({
    from: `"${senderName || 'KPPN Semarang I - Sistem ANGKASA'}" <${senderEmail || smtpUser}>`,
    to: toEmail,
    subject,
    html: htmlContent
  });

  return { messageId: info.messageId };
}

/**
 * Unified email sending dispatcher based on configuration
 */
export async function sendEmail(
  config: EmailConfig,
  params: {
    toEmail: string;
    toName?: string;
    subject: string;
    htmlContent: string;
  }
): Promise<{ success: boolean; messageId?: string; provider: string }> {
  const { toEmail, toName = '', subject, htmlContent } = params;

  if (!toEmail || !toEmail.includes('@')) {
    throw new Error(`Alamat email penerima tidak valid: ${toEmail}`);
  }

  const provider = config.provider || 'brevo';

  if (provider === 'brevo') {
    const res = await sendViaBrevo(
      config.brevoApiKey,
      config.senderName,
      config.senderEmail,
      toEmail,
      toName,
      subject,
      htmlContent
    );
    return { success: true, messageId: res.messageId, provider: 'brevo' };
  }

  if (provider === 'resend') {
    const res = await sendViaResend(
      config.resendApiKey,
      config.senderName,
      config.senderEmail,
      toEmail,
      subject,
      htmlContent
    );
    return { success: true, messageId: res.messageId, provider: 'resend' };
  }

  if (provider === 'smtp') {
    const res = await sendViaSmtp(
      config.smtpHost,
      config.smtpPort,
      config.smtpSecure,
      config.smtpUser,
      config.smtpPass,
      config.senderName,
      config.senderEmail,
      toEmail,
      subject,
      htmlContent
    );
    return { success: true, messageId: res.messageId, provider: 'smtp' };
  }

  throw new Error(`Provider email tidak dikenali: ${provider}`);
}

/**
 * Professional HTML template for OTP Password Reset
 */
export function buildOtpEmailHtml(params: {
  displayName: string;
  username: string;
  otp: string;
  expiryMinutes?: number;
}): string {
  const { displayName, username, otp, expiryMinutes = 15 } = params;

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode OTP Reset Kata Sandi - ANGKASA KPPN Semarang I</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #042f2e 100%); padding: 32px 28px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 9999px; padding: 6px 16px; margin-bottom: 12px;">
                      <span style="color: #fbbf24; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">KPPN SEMARANG I (026)</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 20px; font-weight: 900; margin: 0 0 6px 0; letter-spacing: -0.5px;">ANGKASA KPPN 026</h1>
                    <p style="color: #94a3b8; font-size: 12px; margin: 0; font-weight: 500;">Aplikasi Navigasi &amp; Kinerja Akuntabel Satker</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h2 style="color: #0f172a; font-size: 18px; font-weight: 800; margin: 0 0 16px 0;">Permintaan Kode Verifikasi OTP</h2>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                      Yth. <strong>${displayName}</strong> (<span style="color: #4f46e5; font-family: monospace;">@${username}</span>),
                    </p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                      Kami menerima permintaan pengaturan ulang kata sandi akun Anda di sistem <strong>ANGKASA KPPN Semarang I</strong>. Gunakan 6-digit kode verifikasi resmi di bawah ini untuk melanjutkan:
                    </p>

                    <!-- Big OTP Box -->
                    <div style="background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); border: 2px dashed #6366f1; border-radius: 16px; padding: 24px 16px; text-align: center; margin: 24px 0;">
                      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 8px;">KODE VERIFIKASI OTP RESMI</div>
                      <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #4338ca; text-indent: 12px;">${otp}</div>
                      <div style="font-size: 12px; color: #64748b; margin-top: 10px; font-weight: 600;">
                        ⏳ Berlaku selama <strong>${expiryMinutes} menit</strong>
                      </div>
                    </div>

                    <!-- Security Alert -->
                    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px; margin: 24px 0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td>
                            <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: 700; line-height: 1.5;">
                              🛡️ PERINGATAN KEAMANAN:
                            </p>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: #78350f; line-height: 1.5;">
                              Jangan pernah membagikan kode OTP ini kepada siapa pun, termasuk pihak yang mengaku pegawai atau administrator IT KPPN. Petugas kami tidak pernah meminta kode OTP Anda.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 20px 0 0 0;">
                      Jika Anda tidak pernah meminta perubahan kata sandi ini, silakan abaikan email ini atau segera laporkan ke Super Administrator Seksi MSKI KPPN Semarang I.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0; font-weight: 600;">
                KPPN Tipe A1 Semarang I • Seksi Manajemen Satker dan Kepatuhan Internal (MSKI)
              </p>
              <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
                Jl. Ki Mangunsarkoro No. 34, Semarang 50241 • Telepon (024) 8414441
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Professional HTML template for Test Email Verification
 */
export function buildTestEmailHtml(params: {
  provider: string;
  senderEmail: string;
  senderName: string;
  testedAt: string;
}): string {
  const { provider, senderEmail, senderName, testedAt } = params;

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Uji Coba Email Gateway ANGKASA KPPN Semarang I</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 28px; text-align: center; color: #ffffff;">
              <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 800;">✅ Tes Koneksi Email Gateway Berhasil!</h2>
              <p style="margin: 0; font-size: 13px; color: #d1fae5;">Sistem ANGKASA KPPN Semarang I (026)</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 28px;">
              <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                Halo Administrator,
              </p>
              <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                Email ini merupakan konfirmasi bahwa konfigurasi <strong>Gateway Pengiriman Email</strong> pada portal ANGKASA KPPN Semarang I telah terhubung dengan baik dan siap digunakan untuk pengiriman kode OTP verifikasi kata sandi pegawai.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Layanan Gateway:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 800; text-transform: uppercase;">${provider}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Nama Pengirim:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${senderName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Email Pengirim:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${senderEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Waktu Pengujian:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${testedAt}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center; color: #94a3b8; font-size: 11px;">
              KPPN Tipe A1 Semarang I • Seksi MSKI
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
