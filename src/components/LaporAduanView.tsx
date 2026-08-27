import { safeLocalStorageSet } from '../utils/safeStorage';
import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Phone, 
  ExternalLink, 
  Lock, 
  EyeOff, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck, 
  Mail, 
  ArrowRight,
  Search,
  Clock,
  Activity,
  XCircle,
  Copy,
  Check,
  Building2,
  User,
  Sparkles,
  MessageSquare,
  HelpCircle,
  FileText
} from 'lucide-react';
import { AppTheme, DashboardConfig, AduanSatkerRecord, AduanKategori, AduanStatus } from '../types';

interface LaporAduanViewProps {
  theme?: AppTheme;
  helpdeskPhone?: string;
  helpdeskJamLayanan?: string;
  dashboardConfig?: DashboardConfig;
  onUpdateDashboardConfig?: (newConfig: DashboardConfig) => void;
}

export const LaporAduanView: React.FC<LaporAduanViewProps> = ({
  theme = 'light',
  helpdeskPhone: propPhone,
  helpdeskJamLayanan: propJam,
  dashboardConfig,
  onUpdateDashboardConfig
}) => {
  const isDark = theme === 'dark';

  // Config values
  const activeHelpdeskPhone = dashboardConfig?.helpdeskPhone || propPhone || '081234567890';
  const activeHelpdeskJam = dashboardConfig?.helpdeskJamLayanan || propJam || 'Senin - Jumat (08:00 - 16:00 WIB)';
  const activePicName = dashboardConfig?.helpdeskPicName || 'Seksi Kepatuhan Internal & Seksi MSKI';
  const activeEmail = dashboardConfig?.helpdeskEmail || 'kppn.semarang1@kemenkeu.go.id';

  // Sub tab: 'tiket-dashboard' | 'chat-wa' | 'tracking'
  const [activeSubTab, setActiveSubTab] = useState<'tiket-dashboard' | 'chat-wa' | 'tracking'>('tiket-dashboard');

  // Format clean phone number for WhatsApp link
  const rawDigits = activeHelpdeskPhone.replace(/\D/g, '');
  const cleanWaPhone = rawDigits.startsWith('0') ? '62' + rawDigits.slice(1) : rawDigits;

  // Form State for Ticket Submission to Dashboard
  const [formData, setFormData] = useState<{
    aliasPelapor: string;
    namaSatker: string;
    kodeSatker: string;
    kontakHp: string;
    emailPelapor: string;
    kategori: AduanKategori;
    judulAduan: string;
    deskripsi: string;
    urgensi: 'BIASA' | 'PENTING' | 'SANGAT_SEGERA';
    isAnonim: boolean;
  }>({
    aliasPelapor: '',
    namaSatker: '',
    kodeSatker: '',
    kontakHp: '',
    emailPelapor: '',
    kategori: 'Kendala Teknis SAKTI & Rekonsiliasi',
    judulAduan: '',
    deskripsi: '',
    urgensi: 'BIASA',
    isAnonim: true
  });

  // Submission Result State
  const [createdTicketCode, setCreatedTicketCode] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Tracking State
  const [trackingInput, setTrackingInput] = useState<string>('');
  const [trackedTicket, setTrackedTicket] = useState<AduanSatkerRecord | null | 'NOT_FOUND'>(null);

  // Submit Ticket Directly to Admin Dashboard
  const handleSubmitToDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judulAduan.trim() || !formData.deskripsi.trim()) {
      alert('Mohon isi Judul Aduan dan Rincian Permasalahan.');
      return;
    }

    const now = new Date();
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const newTicketNomor = `TKT-${randNum}`;
    const formattedDate = `${now.getDate()} ${now.toLocaleString('id-ID', { month: 'short' })} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    const newRecord: AduanSatkerRecord = {
      id: `adu-${Date.now()}`,
      tiketNomor: newTicketNomor,
      tanggal: formattedDate,
      createdAt: now.toISOString(),
      aliasPelapor: formData.isAnonim 
        ? (formData.aliasPelapor.trim() ? `Anonim (${formData.aliasPelapor.trim()})` : 'Anonim / Rahasia') 
        : (formData.aliasPelapor.trim() || 'Pengelola Satker'),
      namaSatker: formData.isAnonim 
        ? (formData.namaSatker.trim() || 'Anonim / Dirahasiakan') 
        : (formData.namaSatker.trim() || 'Satker Mitra KPPN Semarang I'),
      kodeSatker: formData.isAnonim ? '-' : (formData.kodeSatker.trim() || '-'),
      kontakHp: formData.kontakHp.trim() || '',
      emailPelapor: formData.emailPelapor.trim() || '',
      kategori: formData.kategori,
      judulAduan: formData.judulAduan.trim(),
      deskripsi: formData.deskripsi.trim(),
      status: 'MENUNGGU',
      urgensi: formData.urgensi,
      sumber: 'DASHBOARD_FORM',
      riwayatTindakLanjut: [
        {
          id: `rwy-${Date.now()}`,
          waktu: formattedDate,
          petugas: 'Sistem Tiket Online',
          catatan: 'Tiket berhasil dibuat dari formulir Dashboard Satker. Menunggu verifikasi admin.',
          statusSebelumnya: 'MENUNGGU',
          statusBaru: 'MENUNGGU'
        }
      ]
    };

    // Update state & persistence
    const currentList = dashboardConfig?.aduanList || [];
    const updatedList = [newRecord, ...currentList];

    if (onUpdateDashboardConfig && dashboardConfig) {
      onUpdateDashboardConfig({
        ...dashboardConfig,
        aduanList: updatedList
      });
    }

    // Also persist to localStorage
    try {
      const saved = localStorage.getItem('kppn_dashboard_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.aduanList = updatedList;
        safeLocalStorageSet('kppn_dashboard_config', JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Error persisting aduan:', e);
    }

    setCreatedTicketCode(newTicketNomor);
  };

  // Direct WhatsApp Report Handler
  const handleDirectWaReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deskripsi.trim()) {
      alert('Mohon isi rincian atau ringkasan aduan penyimpangan.');
      return;
    }

    const pelaporInfo = formData.isAnonim ? 'Anonim (Rahasia 100%)' : (formData.aliasPelapor || 'Pengelola Satker');
    const satkerInfo = formData.isAnonim ? 'Dirahasiakan' : (formData.namaSatker || '-');

    const textMsg = encodeURIComponent(
      `*Lapor Pengaduan / Konsultasi KPPN Semarang I (026)*\n\n` +
      `*Pelapor:* ${pelaporInfo}\n` +
      `*Satker:* ${satkerInfo}\n` +
      `*Kategori:* ${formData.kategori}\n` +
      `*Judul:* ${formData.judulAduan || '-'}\n` +
      `*Rincian Kendala:* ${formData.deskripsi}\n\n` +
      `_(Dikirim melalui Kanal Aduan Dashboard KPPN Semarang I)_`
    );

    window.open(`https://wa.me/${cleanWaPhone}?text=${textMsg}`, '_blank');
  };

  // Search/Track Ticket
  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;

    const currentList = dashboardConfig?.aduanList || [];
    const query = trackingInput.trim().toUpperCase();

    const match = currentList.find(a => a.tiketNomor?.toUpperCase() === query || a.id?.toUpperCase() === query);
    if (match) {
      setTrackedTicket(match);
    } else {
      setTrackedTicket('NOT_FOUND');
    }
  };

  // Copy Ticket Code
  const handleCopyTicketCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Custom texts
  const badgeText = dashboardConfig?.customTexts?.aduanBadge || 'Helpdesk & Layanan Pengaduan Satker KPPN Semarang I';
  const titleText = dashboardConfig?.customTexts?.aduanTitle || 'Kanal Layanan Konsultasi & Pengaduan Satker';
  const subtitleText = dashboardConfig?.customTexts?.aduanSubtitle || 'Sampaikan kendala teknis SAKTI, pengajuan dispensasi, rekonsiliasi laporan, atau pengaduan layanan secara langsung ke tim pembina KPPN Semarang I.';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Banner Header */}
      <div className={`${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border-slate-800' 
          : 'bg-gradient-to-r from-slate-900 via-rose-900 to-rose-950'
      } p-6 sm:p-8 rounded-3xl border text-white shadow-xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-72 h-72 bg-rose-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              {badgeText}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {titleText}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {subtitleText} Komitmen penuh KPPN Semarang I mewujudkan Wilayah Bebas dari Korupsi (WBK) &amp; WBBM. Layanan bersifat <strong className="text-white">GRATIS (Rp 0,-)</strong>.
            </p>
          </div>

          <div className="shrink-0 bg-slate-800/90 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider">Jaminan Kerahasiaan</div>
              <div className="text-lg font-black text-white">100% Anonim &amp; Aman</div>
              <div className="text-[11px] text-slate-400 font-medium">Bebas Pungli &amp; Gratifikasi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('tiket-dashboard');
            setCreatedTicketCode(null);
          }}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'tiket-dashboard'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1. Kirim Tiket Aduan ke Dashboard Admin</span>
          <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Online</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('chat-wa')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'chat-wa'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>2. Chat Langsung WhatsApp CS ({activeHelpdeskPhone})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tracking')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'tracking'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>3. Lacak Status Tiket Aduan Satker</span>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active SubTab Content */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Sub-Tab 1: Kirim Tiket ke Dashboard Admin */}
          {activeSubTab === 'tiket-dashboard' && (
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            } space-y-5`}>
              
              <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">
                      Formulir Tiket Pengaduan &amp; Konsultasi Dashboard
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Aduan masuk langsung ke panel admin KPPN untuk ditindaklanjuti secara resmi
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                  Tiket Resmi KPPN
                </span>
              </div>

              {/* Success Result Modal / Banner */}
              {createdTicketCode ? (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border-2 border-emerald-500/40 text-slate-900 dark:text-white space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500 text-white rounded-xl">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-emerald-800 dark:text-emerald-300">
                        Tiket Aduan Berhasil Dibuat!
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Pengaduan Anda telah terkirim ke dashboard Admin KPPN Semarang I.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Nomor Tiket Aduan Anda:
                      </span>
                      <span className="font-mono text-2xl font-black text-rose-600 dark:text-rose-400">
                        {createdTicketCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyTicketCode(createdTicketCode)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      <span>{isCopied ? 'Tersalin!' : 'Salin Kode'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    💡 <strong>Tips:</strong> Simpan kode tiket di atas. Anda dapat mengecek perkembangan respon atau arahan admin kapan saja melalui tab <strong>"3. Lacak Status Tiket Aduan Satker"</strong>.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTrackingInput(createdTicketCode);
                        setActiveSubTab('tracking');
                        // trigger search
                        const currentList = dashboardConfig?.aduanList || [];
                        const match = currentList.find(a => a.tiketNomor === createdTicketCode);
                        if (match) setTrackedTicket(match);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Search className="w-4 h-4" />
                      <span>Pantau Status Tiket Ini Sekarang</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCreatedTicketCode(null);
                        setFormData({
                          aliasPelapor: '',
                          namaSatker: '',
                          kodeSatker: '',
                          kontakHp: '',
                          emailPelapor: '',
                          kategori: 'Kendala Teknis SAKTI & Rekonsiliasi',
                          judulAduan: '',
                          deskripsi: '',
                          urgensi: 'BIASA',
                          isAnonim: true
                        });
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                    >
                      Buat Aduan Baru Lainnya
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitToDashboard} className="space-y-4 text-xs">
                  
                  {/* Anonymous Switcher */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white block">Mode Anonim / Rahasia</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Identitas dan nama satker disamarkan</span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isAnonim}
                        onChange={(e) => setFormData({ ...formData, isAnonim: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* Pelapor & Satker Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-black text-slate-900 dark:text-slate-200 mb-1">
                        Nama Pelapor / Inisial:
                      </label>
                      <input
                        type="text"
                        value={formData.aliasPelapor}
                        onChange={(e) => setFormData({ ...formData, aliasPelapor: e.target.value })}
                        placeholder={formData.isAnonim ? "Anonim / Rahasia (Opsional)" : "Contoh: Budi Santoso"}
                        className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block font-black text-slate-900 dark:text-slate-200 mb-1">
                        Nama Satuan Kerja:
                      </label>
                      <input
                        type="text"
                        value={formData.namaSatker}
                        onChange={(e) => setFormData({ ...formData, namaSatker: e.target.value })}
                        placeholder={formData.isAnonim ? "Dirahasiakan / Opsional" : "Contoh: Polrestabes Semarang"}
                        className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block font-black text-slate-900 dark:text-slate-200 mb-1">
                        Nomor HP / WhatsApp (Opsional untuk balasan cepat):
                      </label>
                      <input
                        type="text"
                        value={formData.kontakHp}
                        onChange={(e) => setFormData({ ...formData, kontakHp: e.target.value })}
                        placeholder="Contoh: 081234567890"
                        className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block font-black text-slate-900 dark:text-slate-200 mb-1">
                        Kategori Permasalahan:
                      </label>
                      <select
                        value={formData.kategori}
                        onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                        className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="Kendala Teknis SAKTI & Rekonsiliasi">Kendala Teknis SAKTI &amp; Rekonsiliasi</option>
                        <option value="Permintaan Konsultasi / Pendampingan">Permintaan Konsultasi / Pendampingan</option>
                        <option value="Pengaduan Gratifikasi / Imbalan">Pengaduan Gratifikasi / Pungli (WBBM)</option>
                        <option value="Pelanggaran Kode Etik / Sikap Petugas">Pelanggaran Kode Etik / Sikap Petugas</option>
                        <option value="Pengaduan Layanan / Disiplin">Pengaduan Layanan / Keterlambatan</option>
                        <option value="Indikasi Fraud / Penyimpangan">Indikasi Fraud / Penyimpangan</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-slate-900 dark:text-slate-200 mb-1">
                      Judul / Pokok Permasalahan: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.judulAduan}
                      onChange={(e) => setFormData({ ...formData, judulAduan: e.target.value })}
                      placeholder="Contoh: Kendala Gagal Upload ADK Capaian Output Bulan Juli"
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-900 dark:text-slate-200 mb-1">
                      Rincian Lengkap &amp; Kronologi Aduan / Pertanyaan: <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.deskripsi}
                      onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                      placeholder="Tuliskan kronologi masalah, pesan error pada SAKTI, atau bentuk penyimpangan layanan yang ingin disampaikan..."
                      className={`w-full p-3 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 hover:brightness-110 cursor-pointer transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim Tiket Aduan ke Dashboard Admin KPPN</span>
                  </button>

                </form>
              )}

            </div>
          )}

          {/* Sub-Tab 2: Chat Langsung WhatsApp CS */}
          {activeSubTab === 'chat-wa' && (
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            } space-y-5`}>
              
              <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">
                      Konsultasi &amp; Aduan Cepat via WhatsApp
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Hubungi langsung petugas pembina dan Helpdesk KPPN Semarang I
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                  Respon Cepat
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Nomor WhatsApp CS / Pengaduan:</span>
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{activeHelpdeskPhone}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Jam Operasional Layanan:</span>
                  <span>{activeHelpdeskJam}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Unit Pengelola:</span>
                  <span>{activePicName}</span>
                </div>
              </div>

              <form onSubmit={handleDirectWaReport} className="space-y-4 text-xs">
                <div>
                  <label className="block font-black text-slate-900 dark:text-slate-200 mb-1">
                    Pesan / Ringkasan Konsultasi atau Aduan: <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    placeholder="Tuliskan pertanyaan atau kendala yang ingin dikonsultasikan langsung melalui chat WhatsApp..."
                    className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer group"
                >
                  <Phone className="w-5 h-5" />
                  <span>Kirim Pesan ke WhatsApp KPPN ({activeHelpdeskPhone})</span>
                  <ExternalLink className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>

            </div>
          )}

          {/* Sub-Tab 3: Lacak Status Tiket Aduan Satker */}
          {activeSubTab === 'tracking' && (
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            } space-y-5`}>
              
              <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-sky-500/10 text-sky-500 rounded-xl">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">
                      Lacak Status Respon &amp; Tindak Lanjut Tiket Aduan
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Masukkan Nomor Tiket (contoh: TKT-8921) untuk melihat status penanganan admin
                    </p>
                  </div>
                </div>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearchTracking} className="flex gap-2 text-xs">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Masukkan Nomor Tiket (Contoh: TKT-8921)"
                    className={`w-full pl-9 pr-3 py-3 rounded-xl border text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Cek Status</span>
                </button>
              </form>

              {/* Tracking Result View */}
              {trackedTicket === 'NOT_FOUND' && (
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                  <div className="font-black flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Tiket Tidak Ditemukan</span>
                  </div>
                  <p>Nomor tiket <strong>{trackingInput}</strong> belum terdaftar di sistem. Mohon periksa kembali nomor tiket Anda.</p>
                </div>
              )}

              {trackedTicket && trackedTicket !== 'NOT_FOUND' && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <span className="font-mono text-xl font-black text-rose-600 dark:text-rose-400">
                        {trackedTicket.tiketNomor}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Dibuat pada: {trackedTicket.tanggal}
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black self-start sm:self-center ${
                      trackedTicket.status === 'MENUNGGU' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300' :
                      trackedTicket.status === 'DIPROSES' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300' :
                      trackedTicket.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {trackedTicket.status === 'MENUNGGU' && <Clock className="w-3.5 h-3.5" />}
                      {trackedTicket.status === 'DIPROSES' && <Activity className="w-3.5 h-3.5" />}
                      {trackedTicket.status === 'SELESAI' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {trackedTicket.status === 'DITOLAK' && <XCircle className="w-3.5 h-3.5" />}
                      <span>Status: {trackedTicket.status}</span>
                    </span>
                  </div>

                  <div className="text-xs space-y-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-rose-500">
                        {trackedTicket.kategori}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                        {trackedTicket.judulAduan}
                      </h4>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                      {trackedTicket.deskripsi}
                    </div>
                  </div>

                  {/* Admin Follow-up Response Card */}
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5">
                    <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Respon / Catatan Tindak Lanjut Admin KPPN:
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
                      {trackedTicket.catatanAdmin || 'Tiket telah diterima dan sedang dalam antrean verifikasi oleh petugas pembina KPPN Semarang I.'}
                    </p>
                    {trackedTicket.petugasPenyelesai && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                        Petugas Penanggung Jawab: <strong className="text-slate-700 dark:text-slate-300">{trackedTicket.petugasPenyelesai}</strong>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* Right Column: Official Kemenkeu Integrity Channels */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className={`p-5 sm:p-6 rounded-3xl border space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className="text-sm font-black uppercase tracking-wider text-rose-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Kanal Pengaduan Resmi Kemenkeu
            </h3>
            <p className="text-xs text-slate-950 dark:text-slate-200 font-bold leading-relaxed">
              Anda juga dapat menyampaikan pengaduan pelanggaran, penyalahgunaan wewenang, maupun indikasi korupsi secara terpusat melalui saluran independen Kementerian Keuangan RI:
            </p>
          </div>

          <div className="space-y-3">
            
            {/* SIPUMA */}
            <div className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/20">
                  SIPUMA Kemenkeu
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                Sistem Pengaduan Utama Kementerian Keuangan
              </h4>
              <p className="text-[11px] text-slate-950 dark:text-slate-300 font-bold leading-relaxed">
                Kanal resmi pengaduan pelayanan publik, pelanggaran kode etik, dan penyalahgunaan wewenang.
              </p>
              <a
                href="https://sipuma.kemenkeu.go.id"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline pt-1"
              >
                Akses sipuma.kemenkeu.go.id <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* WISE Kemenkeu */}
            <div className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-indigo-500 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                  WISE Kemenkeu
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                Whistleblowing System (WISE Kemenkeu)
              </h4>
              <p className="text-[11px] text-slate-950 dark:text-slate-300 font-bold leading-relaxed">
                Aplikasi pengaduan bagi pelapor yang memiliki informasi perbuatan berindikasi pelanggaran atau fraud.
              </p>
              <a
                href="https://wise.kemenkeu.go.id"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline pt-1"
              >
                Akses wise.kemenkeu.go.id <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* SP4N LAPOR */}
            <div className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-sky-500 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                  SP4N LAPOR!
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                Layanan Aspirasi &amp; Pengaduan Online Rakyat
              </h4>
              <p className="text-[11px] text-slate-950 dark:text-slate-300 font-bold leading-relaxed">
                Kanal pengaduan pelayanan publik nasional terintegrasi untuk seluruh instansi pemerintah.
              </p>
              <a
                href="https://www.lapor.go.id"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:underline pt-1"
              >
                Akses lapor.go.id <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Email KPPN */}
            <div className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                  Surel Resmi
                </span>
                <Mail className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                Email Seksi Kepatuhan Internal KPPN Semarang I
              </h4>
              <p className="text-[11px] text-slate-950 dark:text-slate-300 font-bold leading-relaxed">
                Kirimkan laporan bersurat atau dokumen langsung ke surel pengaduan KPPN.
              </p>
              <a
                href={`mailto:${activeEmail}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:underline pt-1"
              >
                {activeEmail} <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
