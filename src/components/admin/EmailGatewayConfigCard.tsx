import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Key, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Server, 
  ShieldCheck, 
  HelpCircle, 
  Sparkles,
  Zap,
  Globe,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { EmailGatewayConfig, EmailProvider, EmailGatewayPublicStatus } from '../../types/email';
import { getEmailGatewayStatus, saveEmailGatewayConfig, testSendEmail } from '../../services/emailGatewayService';
import { useToast } from '../ToastNotification';

interface EmailGatewayConfigCardProps {
  currentUserEmail?: string;
  theme?: 'light' | 'dark';
}

export const EmailGatewayConfigCard: React.FC<EmailGatewayConfigCardProps> = ({
  currentUserEmail = '',
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [status, setStatus] = useState<EmailGatewayPublicStatus | null>(null);

  // Form State
  const [provider, setProvider] = useState<EmailProvider>('brevo');
  const [senderName, setSenderName] = useState<string>('KPPN Semarang I - Sistem ANGKASA');
  const [senderEmail, setSenderEmail] = useState<string>('kppn026.semarang@gmail.com');
  const [brevoApiKey, setBrevoApiKey] = useState<string>('');
  const [resendApiKey, setResendApiKey] = useState<string>('');
  const [smtpHost, setSmtpHost] = useState<string>('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState<number>(465);
  const [smtpSecure, setSmtpSecure] = useState<boolean>(true);
  const [smtpUser, setSmtpUser] = useState<string>('');
  const [smtpPass, setSmtpPass] = useState<string>('');

  // Visibility Toggles
  const [showBrevoKey, setShowBrevoKey] = useState<boolean>(false);
  const [showResendKey, setShowResendKey] = useState<boolean>(false);
  const [showSmtpPass, setShowSmtpPass] = useState<boolean>(false);

  // Test Email State
  const [testRecipient, setTestRecipient] = useState<string>(currentUserEmail || 'mybabo.official@gmail.com');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; provider?: string } | null>(null);

  // Guide accordion
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Load configuration from server
  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const data = await getEmailGatewayStatus();
      if (data && data.status) {
        setStatus(data.status);
        setProvider(data.status.provider || 'brevo');
        setSenderName(data.status.senderName || 'KPPN Semarang I - Sistem ANGKASA');
        setSenderEmail(data.status.senderEmail || 'kppn026.semarang@gmail.com');
        setSmtpHost(data.status.smtpHost || 'smtp.gmail.com');
        setSmtpPort(data.status.smtpPort || 465);
        setSmtpUser(data.status.smtpUser || '');
        if (data.status.brevoApiKeyMasked) {
          setBrevoApiKey(data.status.brevoApiKeyMasked);
        }
        if (data.status.resendApiKeyMasked) {
          setResendApiKey(data.status.resendApiKeyMasked);
        }
        if (data.status.smtpPassMasked) {
          setSmtpPass(data.status.smtpPassMasked);
        }
      }
    } catch (err: any) {
      console.warn('Gagal memuat konfigurasi email gateway:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (currentUserEmail && !testRecipient) {
      setTestRecipient(currentUserEmail);
    }
  }, [currentUserEmail]);

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTestResult(null);

    const payload: EmailGatewayConfig = {
      provider,
      senderName: senderName.trim(),
      senderEmail: senderEmail.trim(),
      brevoApiKey: brevoApiKey.trim(),
      resendApiKey: resendApiKey.trim(),
      smtpHost: smtpHost.trim(),
      smtpPort: Number(smtpPort),
      smtpSecure,
      smtpUser: smtpUser.trim(),
      smtpPass: smtpPass.trim()
    };

    try {
      const res = await saveEmailGatewayConfig(payload);
      if (res.success) {
        showToast('Konfigurasi Gateway Email berhasil disimpan!', 'success');
        await loadConfig();
      } else {
        showToast(res.message || 'Gagal menyimpan konfigurasi email.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Test Send
  const handleTestSend = async () => {
    if (!testRecipient || !testRecipient.includes('@')) {
      showToast('Masukkan alamat email tujuan uji coba yang valid.', 'error');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testSendEmail({
        testRecipient: testRecipient.trim(),
        configOverride: {
          provider,
          senderName: senderName.trim(),
          senderEmail: senderEmail.trim(),
          brevoApiKey: brevoApiKey.trim(),
          resendApiKey: resendApiKey.trim(),
          smtpHost: smtpHost.trim(),
          smtpPort: Number(smtpPort),
          smtpSecure,
          smtpUser: smtpUser.trim(),
          smtpPass: smtpPass.trim()
        }
      });

      setTestResult(res);
      if (res.success) {
        showToast(`Email uji coba berhasil dikirim ke ${testRecipient}!`, 'success');
      } else {
        showToast(`Gagal mengirim: ${res.message}`, 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Terjadi kesalahan jaringan saat mengirim email uji coba.'
      });
      showToast('Gagal mengirim email uji coba.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
        status?.isConfigured
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            status?.isConfigured
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
          }`}>
            {status?.isConfigured ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                status?.isConfigured
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
              }`}>
                {status?.isConfigured ? 'Gateway Aktif & Terhubung' : 'Gateway Belum Dikonfigurasi'}
              </span>
              <span className="text-[11px] font-mono text-slate-500 uppercase">
                Provider: {provider}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {status?.isConfigured 
                ? `Email OTP akan dikirimkan otomatis ke kotak masuk pegawai melalui ${status.provider.toUpperCase()} (${status.senderEmail}).`
                : 'Kode verifikasi reset sandi saat ini memerlukan konfigurasi API Brevo, Resend, atau Gmail SMTP agar dapat terkirim ke email penerima.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadConfig}
          disabled={isLoading}
          className="self-end sm:self-auto text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
        
        {/* Section 1: Choose Provider */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
            Pilih Layanan Pengirim Email (Email Gateway Provider)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* Option 1: Brevo */}
            <div
              onClick={() => setProvider('brevo')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                provider === 'brevo'
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                    B
                  </div>
                  <div>
                    <span className="font-black text-sm text-slate-900 dark:text-white block">Brevo (Sendinblue)</span>
                    <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Direkomendasikan</span>
                  </div>
                </div>
                {provider === 'brevo' && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Gratis <strong>300 email/hari</strong>. Sangat stabil, terkirim langsung ke Gmail &amp; Kemenkeu tanpa butuh domain khusus.
              </p>
            </div>

            {/* Option 2: Resend */}
            <div
              onClick={() => setProvider('resend')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                provider === 'resend'
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                    R
                  </div>
                  <div>
                    <span className="font-black text-sm text-slate-900 dark:text-white block">Resend API</span>
                    <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">REST API Modern</span>
                  </div>
                </div>
                {provider === 'resend' && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pengiriman email transaksional ultra-cepat dengan API Key. Mendukung domain custom maupun pengujian instan.
              </p>
            </div>

            {/* Option 3: Gmail SMTP */}
            <div
              onClick={() => setProvider('smtp')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                provider === 'smtp'
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-sm">
                    G
                  </div>
                  <div>
                    <span className="font-black text-sm text-slate-900 dark:text-white block">Gmail SMTP</span>
                    <span className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider">Google App Password</span>
                  </div>
                </div>
                {provider === 'smtp' && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Kirim langsung dari akun Gmail KPPN dengan 16-karakter Sandi Aplikasi Google (App Password) via port 465.
              </p>
            </div>

          </div>
        </div>

        {/* Section 2: Sender Details (General) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Pengirim (Sender Name)
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. KPPN Semarang I - Sistem ANGKASA"
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Nama yang tampil sebagai subjek/identitas pengirim di kotak masuk.</span>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Alamat Email Pengirim (Sender Address)
            </label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="e.g. kppn026.semarang@gmail.com"
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Alamat email terdaftar pada akun Brevo / Resend / Gmail Anda.</span>
          </div>
        </div>

        {/* Section 3: Provider Specific Credentials */}
        {provider === 'brevo' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Brevo API Key (xkeysib-...)
                </label>
              </div>
              <a
                href="https://app.brevo.com/settings/keys/api"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
              >
                <span>Dapatkan API Key di Brevo &rarr;</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showBrevoKey ? 'text' : 'password'}
                value={brevoApiKey}
                onChange={(e) => setBrevoApiKey(e.target.value)}
                placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl pl-3.5 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowBrevoKey(!showBrevoKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showBrevoKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              💡 Buka akun <strong>Brevo.com</strong> &rarr; Menu <strong>SMTP &amp; API</strong> &rarr; Klik <strong>Generate a new API key</strong>.
            </p>
          </div>
        )}

        {provider === 'resend' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Resend API Key (re_...)
                </label>
              </div>
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
              >
                <span>Dapatkan API Key di Resend &rarr;</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showResendKey ? 'text' : 'password'}
                value={resendApiKey}
                onChange={(e) => setResendApiKey(e.target.value)}
                placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl pl-3.5 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowResendKey(!showResendKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showResendKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              💡 Buka <strong>Resend.com</strong> &rarr; Menu <strong>API Keys</strong> &rarr; Klik <strong>Create API Key</strong>. Jika belum memiliki domain custom, gunakan sender default <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded font-mono">onboarding@resend.dev</code> untuk pengiriman ke email akun Anda.
            </p>
          </div>
        )}

        {provider === 'smtp' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-red-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Konfigurasi Gmail SMTP Relay
                </span>
              </div>
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline"
              >
                <span>Buat Sandi Aplikasi Google &rarr;</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  placeholder="465"
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Akun Gmail (Username)
                </label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="e.g. kppn026.semarang@gmail.com"
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Google App Password (16 Karakter)
                </label>
                <div className="relative">
                  <input
                    type={showSmtpPass ? 'text' : 'password'}
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl pl-3 pr-10 py-2 border border-slate-300 dark:border-slate-700"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              ⚠️ Gunakan <strong>Sandi Aplikasi (App Password)</strong> dari akun Google Anda, bukan kata sandi login biasa. Aktifkan Verifikasi 2 Langkah terlebih dahulu di akun Google.
            </p>
          </div>
        )}

        {/* Section 4: Action Buttons (Save & Test) */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-6 py-3 rounded-2xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan ke Server...' : 'Simpan Konfigurasi Gateway'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-1.5 cursor-pointer py-2"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Panduan Dapatkan API Key</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </form>

      {/* Guide Accordion */}
      {showGuide && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 animate-fadeIn text-xs">
          <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Petunjuk Langkah Demi Langkah Mendapatkan API Key</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-2">
              <strong className="text-blue-800 dark:text-blue-300 font-black block">1. Brevo (Sendinblue) - 300 Email/Hari Gratis</strong>
              <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                <li>Buka <a href="https://www.brevo.com" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">brevo.com</a> dan buat akun gratis.</li>
                <li>Setelah verifikasi email akun, klik nama profil di pojok kanan atas &rarr; pilih <strong>SMTP &amp; API</strong>.</li>
                <li>Pada tab <strong>API Keys</strong>, klik tombol <strong>Generate a new API key</strong>.</li>
                <li>Beri nama key (misal: "ANGKASA KPPN"), lalu salin key yang berawalan <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded font-mono">xkeysib-...</code> ke formulir di atas.</li>
                <li>Pastikan email pengirim yang Anda masukkan di atas sesuai dengan email akun Brevo yang terverifikasi.</li>
              </ol>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <strong className="text-slate-900 dark:text-white font-black block">2. Gmail SMTP (Google App Password)</strong>
              <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                <li>Buka <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">Keamanan Akun Google</a>.</li>
                <li>Pastikan <strong>Verifikasi 2 Langkah</strong> sudah aktif pada akun Google Anda.</li>
                <li>Cari menu <strong>Sandi Aplikasi (App passwords)</strong> atau buka langsung <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">tautan ini</a>.</li>
                <li>Ketik nama aplikasi "ANGKASA KPPN", lalu klik <strong>Buat</strong>.</li>
                <li>Google akan menampilkan 16 karakter sandi (misal: <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded font-mono">abcd efgh ijkl mnop</code>). Salin sandi tersebut ke kolom password di atas.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Test Send Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-1">
              <Zap className="w-3 h-3" />
              <span>PENGUJIAN KONEKSI REAL-TIME</span>
            </div>
            <h3 className="text-lg font-black tracking-tight">
              Uji Coba Pengiriman Email Gateway
            </h3>
            <p className="text-slate-300 text-xs">
              Kirimkan email uji coba ke alamat email Anda untuk memastikan API Key / Sandi SMTP berfungsi dengan sempurna.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative w-full sm:flex-1">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="Masukkan email tujuan (e.g. mybabo.official@gmail.com)"
              className="w-full bg-slate-950/80 text-white text-xs font-bold rounded-2xl pl-10 pr-4 py-3 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="button"
            onClick={handleTestSend}
            disabled={isTesting}
            className="w-full sm:w-auto shrink-0 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Mengirim Email...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-slate-950" />
                <span>Kirim Email Uji Coba</span>
              </>
            )}
          </button>
        </div>

        {/* Live Test Result Banner */}
        {testResult && (
          <div className={`p-4 rounded-2xl border text-xs animate-fadeIn ${
            testResult.success
              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/60 text-rose-200'
          }`}>
            <div className="flex items-start gap-2.5">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <span className="font-black text-sm block">
                  {testResult.success ? 'Pengiriman Email Berhasil! ✅' : 'Pengiriman Email Gagal! ❌'}
                </span>
                <p className="leading-relaxed font-mono text-[11px]">
                  {testResult.message}
                </p>
                {testResult.provider && (
                  <span className="inline-block px-2 py-0.5 rounded bg-black/40 text-[10px] font-bold text-slate-300 mt-1">
                    Gateway: {testResult.provider.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
