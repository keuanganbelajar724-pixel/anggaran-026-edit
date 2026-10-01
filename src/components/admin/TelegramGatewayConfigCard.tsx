import React, { useState, useEffect } from 'react';
import { 
  SendHorizontal, 
  Key, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  ShieldCheck, 
  HelpCircle, 
  Sparkles,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Users
} from 'lucide-react';
import { TelegramGatewayConfig, TelegramGatewayPublicStatus } from '../../types/telegram';
import { getTelegramGatewayStatus, saveTelegramGatewayConfig, testSendTelegram } from '../../services/telegramGatewayService';
import { useToast } from '../ToastNotification';

interface TelegramGatewayConfigCardProps {
  theme?: 'light' | 'dark';
  onConfigSaved?: () => void;
}

export const TelegramGatewayConfigCard: React.FC<TelegramGatewayConfigCardProps> = ({
  theme = 'light',
  onConfigSaved
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [status, setStatus] = useState<TelegramGatewayPublicStatus | null>(null);

  // Form State
  const [botToken, setBotToken] = useState<string>('');
  const [botUsername, setBotUsername] = useState<string>('@kppn026_monev_bot');
  const [botName, setBotName] = useState<string>('KPPN Semarang I - Sistem ANGKASA Bot');
  const [defaultChatId, setDefaultChatId] = useState<string>('');
  const [channelOrGroupId, setChannelOrGroupId] = useState<string>('');
  const [parseMode, setParseMode] = useState<'HTML' | 'MarkdownV2' | 'Markdown'>('HTML');

  // Visibility Toggle
  const [showToken, setShowToken] = useState<boolean>(false);

  // Test Telegram State
  const [testChatId, setTestChatId] = useState<string>('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Guide accordion
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Load config
  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const data = await getTelegramGatewayStatus();
      if (data && data.config) {
        setStatus(data.status);
        setBotUsername(data.config.botUsername || '@kppn026_monev_bot');
        setBotName(data.config.botName || 'KPPN Semarang I - Sistem ANGKASA Bot');
        setDefaultChatId(data.config.defaultChatId || '');
        setChannelOrGroupId(data.config.channelOrGroupId || '');
        setParseMode(data.config.parseMode || 'HTML');
        setTestChatId(data.config.testChatId || data.config.defaultChatId || '');
        // Leave raw input empty if already configured to avoid confusing masked strings
        if (data.config.botToken && !data.config.botToken.includes('••••')) {
          setBotToken(data.config.botToken);
        }
      }
    } catch (err: any) {
      console.warn('Gagal memuat konfigurasi Telegram Gateway:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const configToSave: TelegramGatewayConfig = {
        botToken: botToken.trim(),
        botUsername: botUsername.trim(),
        botName: botName.trim(),
        defaultChatId: defaultChatId.trim(),
        channelOrGroupId: channelOrGroupId.trim(),
        parseMode,
        testChatId: testChatId.trim(),
        isConfigured: Boolean(botToken.trim().length > 10)
      };

      const result = await saveTelegramGatewayConfig(configToSave);
      if (result.success) {
        showToast(result.message, 'success');
        if (result.status) setStatus(result.status);
        onConfigSaved?.();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Gagal menyimpan pengaturan.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSend = async () => {
    const targetChat = testChatId.trim() || defaultChatId.trim();
    if (!targetChat) {
      showToast('Masukkan Chat ID atau Channel tujuan uji coba terlebih dahulu!', 'warning');
      return;
    }

    if (!botToken && (!status || !status.isConfigured)) {
      showToast('Masukkan Bot Token Telegram terlebih dahulu!', 'warning');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testSendTelegram(targetChat, {
        botToken: botToken.trim() || undefined,
        parseMode
      });

      setTestResult(res);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.error || res.message, 'error');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Gagal mengirim pesan uji coba.' });
      showToast('Terjadi kesalahan pengiriman uji coba.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const isConfigured = status?.isConfigured || Boolean(botToken.length > 10);

  return (
    <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-sky-950/40 to-slate-900 border-sky-800/80 text-white' 
        : 'bg-gradient-to-br from-white via-sky-50/50 to-blue-50/60 border-sky-200 text-slate-950'
    }`}>
      {/* Background Decorative Blur */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-200 dark:border-sky-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-md">
              <SendHorizontal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>Telegram Bot API Gateway</span>
                  <span className="bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-400/40 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase">
                    Resmi • Tanpa Biaya
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                Integrasi Bot Telegram resmi untuk penyiaran pesan masif ke grup satker, kanal informasi KPPN, maupun chat PIC.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Status Connection Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border shadow-2xs ${
              isConfigured
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/50'
                : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/50'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isConfigured ? '🟢 Bot Telegram Terhubung' : '🟡 Belum Dikonfigurasi'}</span>
            </div>

            <button
              type="button"
              onClick={loadConfig}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Segarkan Status"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Tutorial Accordion */}
        <div className={`rounded-2xl border transition-all ${
          isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white/80 border-sky-200'
        }`}>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full p-3.5 flex items-center justify-between text-left text-xs font-black text-sky-800 dark:text-sky-300 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>Cara Mendapatkan Bot Token Telegram Gratis dalam 1 Menit (Panduan @BotFather)</span>
            </span>
            {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showGuide && (
            <div className="px-4 pb-4 pt-1 border-t border-sky-100 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] font-medium">
                <li>Buka aplikasi Telegram dan cari bot resmi <strong>@BotFather</strong> (atau klik <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-600 underline font-bold">t.me/BotFather</a>).</li>
                <li>Ketik perintah <code>/newbot</code> lalu ikuti instruksi (masukkan nama bot dan username berakhiran <em>_bot</em>).</li>
                <li>Salin <strong>HTTP API Token</strong> yang diberikan (contoh: <code>7123456789:AAFlmN...</code>) lalu tempelkan pada kolom <strong>Bot Token</strong> di bawah.</li>
                <li>Untuk siaran grup/channel: masukkan bot tersebut sebagai <em>Administrator</em> di grup/channel Anda, lalu isi kolom <strong>Default Chat ID / Channel</strong> dengan username channel (contoh: <code>@kppn026_monev</code>) atau ID grup.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Main Input Form */}
        <form onSubmit={handleSaveConfig} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Bot Token Input */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-black flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-sky-600" />
                  <span>1. Telegram Bot Token (*)</span>
                </span>
                {status?.botTokenMasked && (
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    Tersimpan: {status.botTokenMasked}
                  </span>
                )}
              </label>

              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder={status?.botTokenMasked ? 'Ketik token baru jika ingin mengganti...' : 'Contoh: 7123456789:AAFlmN-xyz123abc456...'}
                  className={`w-full pr-10 pl-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 2. Bot Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-black flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                <span>2. Username Bot Telegram</span>
              </label>
              <input
                type="text"
                value={botUsername}
                onChange={(e) => setBotUsername(e.target.value)}
                placeholder="Contoh: @kppn026_monev_bot"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* 3. Default Chat ID / Channel */}
            <div className="space-y-1.5">
              <label className="text-xs font-black flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>3. Default Channel / Grup Satker (Opsional)</span>
              </label>
              <input
                type="text"
                value={channelOrGroupId}
                onChange={(e) => setChannelOrGroupId(e.target.value)}
                placeholder="Contoh: @kppnsemarang1_monev atau -10012345678"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* 4. Parse Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-black block">
                4. Format Teks Pesan (Parse Mode):
              </label>
              <select
                value={parseMode}
                onChange={(e) => setParseMode(e.target.value as any)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="HTML">HTML (Mendukung &lt;b&gt;, &lt;i&gt;, &lt;code&gt; - Direkomendasikan)</option>
                <option value="Markdown">Markdown Standar (*tebal*, _miring_)</option>
              </select>
            </div>

            {/* 5. Nama Pengirim Bot */}
            <div className="space-y-1.5">
              <label className="text-xs font-black block">
                5. Nama Label Bot:
              </label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="Contoh: KPPN Semarang I - Sistem ANGKASA"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

          </div>

          {/* Test Send Strip */}
          <div className="pt-3 border-t border-sky-200 dark:border-sky-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-sky-500/10 dark:bg-sky-950/40 p-3.5 rounded-2xl">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 shrink-0">
                Uji Kirim Telegram:
              </span>
              <input
                type="text"
                value={testChatId}
                onChange={(e) => setTestChatId(e.target.value)}
                placeholder="Masukkan Chat ID atau @username Anda (contoh: @namauser / 12345678)"
                className={`flex-1 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTestSend}
                disabled={isTesting}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
                <span>{isTesting ? 'Mengirim Uji Coba...' : 'Kirim Pesan Tes'}</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
              </button>
            </div>
          </div>

          {/* Test Result Message Box */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs font-bold animate-fadeIn ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
            }`}>
              {testResult.success ? '✅ ' : '❌ '}
              {testResult.message}
            </div>
          )}

        </form>

      </div>
    </div>
  );
};
