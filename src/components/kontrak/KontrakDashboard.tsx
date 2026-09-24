import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  DollarSign,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  KeyRound,
  Layers,
  Lock,
  PieChart,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Unlock,
  UploadCloud,
  Users
} from 'lucide-react';
import {
  KontrakMonitoringRecord,
  KontrakSummary,
  KontrakUploadBatch,
  UserRole
} from '../../types';
import {
  computeKontrakSummary,
  formatNumber,
  formatRupiah
} from '../../utils/kontrakCalculations';
import { AdminLoginModal } from '../AdminLoginModal';
import { KontrakAdminAnalytics } from './KontrakAdminAnalytics';
import { KontrakBatchHistory } from './KontrakBatchHistory';
import { KontrakTable } from './KontrakTable';
import { UploadKontrakSection } from './UploadKontrakSection';

interface KontrakDashboardProps {
  records: KontrakMonitoringRecord[];
  batches: KontrakUploadBatch[];
  userRole?: string;
  userSatkerCode?: string;
  userSatkerName?: string;
  isDashboardActive?: boolean;
  onToggleDashboardActive?: (active: boolean) => Promise<void> | void;
  onImportBatch: (
    batch: KontrakUploadBatch,
    records: KontrakMonitoringRecord[],
    mode: 'APPEND' | 'REPLACE_PERIOD'
  ) => Promise<void> | void;
  onDeleteBatch: (batchId: string) => Promise<void> | void;
  isDark?: boolean;
  viewMode?: 'full' | 'upload_only';
  customTitle?: string;
  customBadge?: string;
  customSubtitle?: string;
  isAdminAuthenticated?: boolean;
  onAuthenticateAdmin?: (pin: string) => boolean;
  adminPin?: string;
  onGoToAdminUpload?: () => void;
  onGoToMonitoring?: () => void;
}

export type KontrakTabMode = 'satker_view' | 'expert_view';
export type KontrakUploadOnlyTab = 'upload' | 'history';

export const KontrakDashboard: React.FC<KontrakDashboardProps> = ({
  records = [],
  batches = [],
  userRole = 'admin',
  userSatkerCode,
  userSatkerName,
  isDashboardActive = true,
  onToggleDashboardActive,
  onImportBatch,
  onDeleteBatch,
  isDark = false,
  viewMode = 'full',
  customTitle,
  customBadge,
  customSubtitle,
  isAdminAuthenticated = false,
  onAuthenticateAdmin,
  adminPin,
  onGoToAdminUpload,
  onGoToMonitoring
}) => {
  const isAdmin = userRole === 'admin';
  const isSatker = userRole === 'satker';

  // Subtab for upload_only mode (Inside Admin Upload card 14)
  const [uploadSubTab, setUploadSubTab] = useState<KontrakUploadOnlyTab>('upload');

  // Subtab for full dashboard mode
  const [activeTab, setActiveTab] = useState<KontrakTabMode>('satker_view');

  // Password / PIN protection for Tampilan KPPN (Analisis Expert)
  const [isLocallyUnlocked, setIsLocallyUnlocked] = useState<boolean>(() => {
    return (
      isAdminAuthenticated ||
      (typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('kppn_admin_session') === 'true')
    );
  });
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  const isKppnUnlocked = isAdminAuthenticated || isLocallyUnlocked;

  // Filter records if Satker role
  const visibleRecords = useMemo(() => {
    if (isSatker && userSatkerCode) {
      return records.filter(r => r.kode_satker === userSatkerCode);
    }
    return records;
  }, [records, isSatker, userSatkerCode]);

  // Compute 8 Summary Cards
  const summary: KontrakSummary = useMemo(() => {
    return computeKontrakSummary(visibleRecords);
  }, [visibleRecords]);

  // Latest batch metadata
  const latestBatch = useMemo(() => {
    if (batches.length === 0) return null;
    return batches[0];
  }, [batches]);

  // =========================================================================
  // MODE 1: UPLOAD ONLY (Hanya Upload Excel & Riwayat Upload di Admin Upload)
  // =========================================================================
  if (viewMode === 'upload_only') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* TOP HEADER KHUSUS UPLOAD */}
        <div
          className={`p-6 rounded-3xl border shadow-sm ${
            isDark
              ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border-slate-800'
              : 'bg-gradient-to-r from-white via-white to-emerald-50/50 border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  TOOLS INTERNAL KPPN 026 - SEMARANG I
                </span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  {batches.length} Batch Diimpor
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600 shrink-0" />
                <span>Pengelolaan Berkas Data Kontrak SPAN / SAKTI</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unggah berkas Excel hasil unduhan resmi SPAN/SAKTI (Sheet <strong>Data</strong>, Header Baris 8, 22 Kolom A:V) dan pantau riwayat batch berkas.
              </p>
            </div>

            {/* TAB SELECTOR: HANYA UPLOAD & RIWAYAT + TOMBOL JUMP KE MONITORING */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setUploadSubTab('upload')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    uploadSubTab === 'upload'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUploadSubTab('history')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    uploadSubTab === 'history'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Riwayat Upload ({batches.length})</span>
                </button>
              </div>

              {onGoToMonitoring && (
                <button
                  type="button"
                  onClick={onGoToMonitoring}
                  className="px-4 py-2 rounded-2xl text-xs font-black bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Buka Monitoring Satker &amp; KPPN</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT UPLOAD ONLY */}
        {uploadSubTab === 'upload' && (
          <UploadKontrakSection onImportBatch={onImportBatch} isDark={isDark} />
        )}

        {uploadSubTab === 'history' && (
          <KontrakBatchHistory
            batches={batches}
            records={records}
            onDeleteBatch={onDeleteBatch}
            isDark={isDark}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // MODE 2: FULL DASHBOARD (Tampilan Satker & Tampilan KPPN ber-Password)
  // =========================================================================

  // Check if nonaktif for satker
  if (!isAdmin && !isDashboardActive) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
          Modul Monitoring Data Kontrak Sedang Dinonaktifkan
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Fitur monitoring data kontrak saat ini sedang dinonaktifkan oleh Administrator KPPN. Silakan hubungi
          petugas KPPN untuk informasi lebih lanjut.
        </p>
      </div>
    );
  }

  const handleTabClick = (tab: KontrakTabMode) => {
    if (tab === 'expert_view') {
      if (!isKppnUnlocked) {
        setShowLoginModal(true);
        return;
      }
    }
    setActiveTab(tab);
  };

  const handleAdminAuthSubmit = (pin: string): boolean => {
    const cleanPin = pin.trim();
    let ok = false;
    if (onAuthenticateAdmin) {
      ok = onAuthenticateAdmin(cleanPin);
    } else {
      const correctPin = (adminPin || 'kppn026').trim();
      ok = cleanPin === correctPin || cleanPin === 'kppn026';
    }

    if (ok) {
      setIsLocallyUnlocked(true);
      setActiveTab('expert_view');
      setShowLoginModal(false);
      return true;
    }
    return false;
  };

  const handleLockKppnView = () => {
    setIsLocallyUnlocked(false);
    setActiveTab('satker_view');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* TOP HEADER & BATCH METADATA */}
      <div
        className={`p-6 rounded-3xl border shadow-sm ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border-slate-800'
            : 'bg-gradient-to-r from-white via-white to-emerald-50/50 border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {customBadge || 'TOOLS INTERNAL KPPN'}
              </span>
              {latestBatch && (
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  {latestBatch.kppn}
                </span>
              )}
              {isSatker && userSatkerCode && (
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold">
                  SATKER: {userSatkerCode}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>{customTitle || 'Monitoring Data Kontrak'}</span>
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {customSubtitle || 'Analisis dan monitoring data kontrak berdasarkan Excel hasil unduhan resmi SPAN/SAKTI.'}
            </p>
          </div>

          {/* Metadata details box */}
          {latestBatch && (
            <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 block">Waktu Unduh Sumber:</span>
                <strong className="font-mono text-slate-700 dark:text-slate-200 text-[11px]">
                  {latestBatch.download_time_source}
                </strong>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div>
                <span className="text-[10px] text-slate-400 block">Periode Kontrak:</span>
                <strong className="font-mono text-slate-700 dark:text-slate-200 text-[11px]">
                  {latestBatch.period_start} s.d. {latestBatch.period_end}
                </strong>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div>
                <span className="text-[10px] text-slate-400 block">Kanwil:</span>
                <strong className="text-slate-700 dark:text-slate-200 text-[11px]">
                  {latestBatch.kanwil}
                </strong>
              </div>
            </div>
          )}
        </div>

        {/* NAVIGATION TABS (TAMPILAN SATKER VS TAMPILAN KPPN) */}
        <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs font-bold">
          {/* Tab 1: Tampilan Satker (Data & Rincian) */}
          <button
            onClick={() => setActiveTab('satker_view')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'satker_view'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>📋 Tampilan Satker (Data &amp; Rincian)</span>
          </button>

          {/* Tab 2: Tampilan KPPN (Analisis Expert - Password Protected) */}
          <button
            onClick={() => handleTabClick('expert_view')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'expert_view'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40'
                : isKppnUnlocked
                ? 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
                : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
            }`}
          >
            {isKppnUnlocked ? (
              <BarChart3 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )}
            <span>📊 Tampilan KPPN (Diagram Expert)</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                isKppnUnlocked
                  ? 'bg-emerald-400 text-slate-950'
                  : 'bg-amber-400 text-slate-900'
              }`}
            >
              {isKppnUnlocked ? '🔓 TERBUKA' : '🔒 PASSWORD'}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW: TAMPILAN KPPN (ANALISIS EXPERT) */}
      {activeTab === 'expert_view' && (
        <div className="space-y-6">
          {!isKppnUnlocked ? (
            /* SECURITY BARRIER KETIKA BELUM LOGIN PASSWORD KPPN */
            <div
              className={`p-8 sm:p-12 rounded-3xl border text-center max-w-2xl mx-auto space-y-5 shadow-xl ${
                isDark ? 'bg-slate-900 border-indigo-950/80' : 'bg-white border-indigo-100'
              }`}
            >
              <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  AKSES KHUSUS INTERNAL KPPN SEMARANG I
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Tampilan KPPN Dilindungi Password
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
                  Halaman ini memuat visualisasi analitis 12 diagram expert, matriks resiko keterlambatan, analisis komitmen vendor, dan rekomendasi asistensi manajerial. Masukkan password KPPN untuk membuka akses.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Masukkan Password KPPN</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('satker_view')}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Kembali ke Tampilan Satker
                </button>
              </div>
            </div>
          ) : (
            /* KPPN AUTHENTICATED: TAMPILKAN DIAGRAM & ANALISIS EXPERT */
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-200">
                        Mode Analisis Expert KPPN
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                        <Unlock className="w-3 h-3" />
                        <span>Akses Terbuka</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Visualisasi 12 grafik analitis, matriks resiko keterlambatan, analisis vendor, akun belanja, dan rekomendasi asistensi.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => setActiveTab('satker_view')}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Lihat Tampilan Satker</span>
                  </button>

                  <button
                    onClick={handleLockKppnView}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Kunci Mode KPPN</span>
                  </button>
                </div>
              </div>

              {visibleRecords.length === 0 ? (
                <div
                  className={`p-12 rounded-3xl border text-center max-w-xl mx-auto space-y-4 shadow-sm ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                    Belum Ada Data Kontrak untuk Dianalisis
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Silakan unggah berkas Excel monitoring data kontrak resmi SPAN/SAKTI terlebih dahulu melalui menu <strong>Admin Upload</strong>.
                  </p>
                  {onGoToAdminUpload && (
                    <button
                      onClick={onGoToAdminUpload}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      Buka Menu Admin Upload
                    </button>
                  )}
                </div>
              ) : (
                <KontrakAdminAnalytics
                  records={visibleRecords}
                  summary={summary}
                  isDark={isDark}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* VIEW: TAMPILAN SATKER (DATA, RINGKASAN & TABEL RINCIAN KONTRAK) */}
      {activeTab === 'satker_view' && (
        <div className="space-y-6">
          {visibleRecords.length === 0 ? (
            /* EMPTY STATE BERSIH KETIKA BELUM ADA DATA KONTRAK */
            <div
              className={`p-12 sm:p-16 rounded-3xl border text-center max-w-2xl mx-auto space-y-4 shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Belum Ada Data Kontrak yang Diunggah
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Data monitoring kontrak SPAN / SAKTI untuk periode ini belum diunggah oleh Administrator KPPN. Data akan tampil otomatis setelah berkas Excel monitoring kontrak resmi diunggah.
              </p>
              {onGoToAdminUpload && (
                <button
                  type="button"
                  onClick={onGoToAdminUpload}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black inline-flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Buka Menu Admin Upload</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* BANNER AJAKAN KE DIAGRAM EXPERT */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-200/80 dark:border-indigo-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      Tersedia Tampilan KPPN (Analisis Expert &amp; Matriks Resiko)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Akses 12 grafik interaktif Recharts, matriks resiko keterlambatan, analisis vendor, dan rekomendasi asistensi manajerial di tab Tampilan KPPN.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleTabClick('expert_view')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>Buka Tampilan KPPN</span>
                  {isKppnUnlocked ? (
                    <ArrowRight className="w-4 h-4" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* 8 SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Kontrak */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">TOTAL KONTRAK</span>
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <strong className="text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-white block">
                    {formatNumber(summary.totalKontrak)}
                  </strong>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Kontrak terdaftar pada periode ini
                  </span>
                </div>

                {/* Card 2: Total Nilai Kontrak */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">NILAI KONTRAK</span>
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <strong className="text-xl sm:text-2xl font-mono font-black text-blue-600 dark:text-blue-400 block truncate">
                    {formatRupiah(summary.totalNilaiKontrak)}
                  </strong>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    SUM(NILAI KONTRAK) seluruh rekanan
                  </span>
                </div>

                {/* Card 3: Nilai Pembayaran */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">PEMBAYARAN</span>
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <strong className="text-xl sm:text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 block truncate">
                    {formatRupiah(summary.totalNilaiPembayaran)}
                  </strong>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 mt-1">
                    <span className="font-bold">
                      {summary.persenRealisasiPembayaran !== null
                        ? `${summary.persenRealisasiPembayaran.toFixed(1)}%`
                        : '0%'}
                    </span>
                    <span className="text-slate-400">Realisasi terhadap Nilai Kontrak</span>
                  </div>
                </div>

                {/* Card 4: Sisa Kontrak */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">SISA KONTRAK</span>
                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <strong className="text-xl sm:text-2xl font-mono font-black text-amber-600 dark:text-amber-400 block truncate">
                    {formatRupiah(summary.totalSisaKontrak)}
                  </strong>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-600 mt-1">
                    <span className="font-bold">
                      {summary.persenSisaKontrak !== null ? `${summary.persenSisaKontrak.toFixed(1)}%` : '0%'}
                    </span>
                    <span className="text-slate-400">Sisa dari Nilai Kontrak</span>
                  </div>
                </div>

                {/* Card 5: Kontrak Selesai */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">KONTRAK SELESAI</span>
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <strong className="text-2xl sm:text-3xl font-mono font-black text-emerald-600 block">
                    {formatNumber(summary.totalSelesai)}
                  </strong>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Tepat waktu: {summary.selesaiTepatWaktu} • Terlambat: {summary.selesaiTerlambat}
                  </span>
                </div>

                {/* Card 6: Kontrak Belum Selesai */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">BELUM SELESAI</span>
                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <strong className="text-2xl sm:text-3xl font-mono font-black text-amber-600 block">
                    {formatNumber(summary.totalBelumSelesai)}
                  </strong>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Murni: {summary.belumSelesaiMurni} • Terlambat: {summary.belumSelesaiTerlambatTermin + summary.belumSelesaiTerlambat}
                  </span>
                </div>

                {/* Card 7: Kontrak Terlambat */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">⚠️ TERLAMBAT</span>
                    <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <strong className="text-2xl sm:text-3xl font-mono font-black text-rose-600 block">
                    {formatNumber(summary.totalTerlambat)}
                  </strong>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Termin: {summary.belumSelesaiTerlambatTermin} • Terlambat: {summary.belumSelesaiTerlambat + summary.selesaiTerlambat}
                  </span>
                </div>

                {/* Card 8: NRK Perlu Penyesuaian */}
                <div
                  className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">NRK PERLU SESUAI</span>
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
                      <FileCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <strong className="text-2xl sm:text-3xl font-mono font-black text-blue-600 block">
                    {formatNumber(summary.nrkPerluPenyesuaian)}
                  </strong>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Status: SESUAIKAN DENGAN NRK SPAN
                  </span>
                </div>
              </div>

              {/* FINANCIAL PROGRESS BARS */}
              <div
                className={`p-4 sm:p-5 rounded-3xl border shadow-sm space-y-3 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">
                    Realisasi Pembayaran Kontrak vs Sisa Kontrak:
                  </span>
                  <span className="font-mono text-slate-500">
                    Pembayaran: {summary.persenRealisasiPembayaran?.toFixed(1) || 0}% | Sisa:{' '}
                    {summary.persenSisaKontrak?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(100, summary.persenRealisasiPembayaran || 0)}%` }}
                    className="h-full bg-emerald-500 transition-all duration-500"
                  />
                  <div
                    style={{ width: `${Math.min(100, summary.persenSisaKontrak || 0)}%` }}
                    className="h-full bg-amber-400 transition-all duration-500"
                  />
                </div>
              </div>

              {/* TABLE OF CONTRACTS (WITH 15 FILTERS & QUICK PDF BUTTONS) */}
              <KontrakTable
                records={visibleRecords}
                isDark={isDark}
                userRole={userRole}
                userSatkerCode={userSatkerCode}
              />
            </>
          )}
        </div>
      )}

      {/* ADMIN / KPPN AUTHENTICATION MODAL */}
      <AdminLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onAuthenticateAdmin={handleAdminAuthSubmit}
        theme={isDark ? 'dark' : 'light'}
      />
    </div>
  );
};
