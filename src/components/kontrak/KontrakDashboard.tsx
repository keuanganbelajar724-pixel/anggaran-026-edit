import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
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
  Users,
  X
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

export type KontrakKpiFilterType =
  | 'ALL'
  | 'NILAI_KONTRAK'
  | 'PEMBAYARAN'
  | 'SISA_KONTRAK'
  | 'SELESAI'
  | 'SELESAI_TEPAT_WAKTU'
  | 'SELESAI_TERLAMBAT'
  | 'BELUM_SELESAI'
  | 'BELUM_SELESAI_MURNI'
  | 'BELUM_SELESAI_TERLAMBAT'
  | 'TERLAMBAT'
  | 'NRK_PERLU_PENYESUAIAN';

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

  // Compute 8 Summary Cards (always calculated from full visible records for stability)
  const summary: KontrakSummary = useMemo(() => {
    return computeKontrakSummary(visibleRecords);
  }, [visibleRecords]);

  // Interactive KPI card filter state (makes all 8 cards clickable)
  const [activeKpiFilter, setActiveKpiFilter] = useState<KontrakKpiFilterType>('ALL');

  const handleCardClick = (filterType: KontrakKpiFilterType) => {
    setActiveKpiFilter(prev => (prev === filterType ? 'ALL' : filterType));
    setTimeout(() => {
      const el = document.getElementById('kontrak-table-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Filter records for table view based on clicked KPI card
  const tableRecords = useMemo(() => {
    if (activeKpiFilter === 'ALL') {
      return visibleRecords;
    }
    switch (activeKpiFilter) {
      case 'NILAI_KONTRAK':
        return [...visibleRecords].sort((a, b) => (b.nilai_kontrak || 0) - (a.nilai_kontrak || 0));
      case 'PEMBAYARAN':
        return visibleRecords
          .filter(r => (r.nilai_pembayaran || 0) > 0)
          .sort((a, b) => (b.nilai_pembayaran || 0) - (a.nilai_pembayaran || 0));
      case 'SISA_KONTRAK':
        return visibleRecords
          .filter(r => (r.sisa_kontrak || 0) > 0)
          .sort((a, b) => (b.sisa_kontrak || 0) - (a.sisa_kontrak || 0));
      case 'SELESAI':
        return visibleRecords.filter(
          r =>
            r.status_progress_kontrak === 'SELESAI TEPAT WAKTU' ||
            r.status_progress_kontrak === 'SELESAI TERLAMBAT'
        );
      case 'SELESAI_TEPAT_WAKTU':
        return visibleRecords.filter(r => r.status_progress_kontrak === 'SELESAI TEPAT WAKTU');
      case 'SELESAI_TERLAMBAT':
        return visibleRecords.filter(r => r.status_progress_kontrak === 'SELESAI TERLAMBAT');
      case 'BELUM_SELESAI':
        return visibleRecords.filter(
          r =>
            r.status_progress_kontrak === 'BELUM SELESAI' ||
            r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
            r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT'
        );
      case 'BELUM_SELESAI_MURNI':
        return visibleRecords.filter(r => r.status_progress_kontrak === 'BELUM SELESAI');
      case 'BELUM_SELESAI_TERLAMBAT':
        return visibleRecords.filter(
          r =>
            r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
            r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT'
        );
      case 'TERLAMBAT':
        return visibleRecords.filter(
          r =>
            r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
            r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT' ||
            r.status_progress_kontrak === 'SELESAI TERLAMBAT'
        );
      case 'NRK_PERLU_PENYESUAIAN':
        return visibleRecords.filter(r => r.status_nrk === 'SESUAIKAN DENGAN NRK SPAN');
      default:
        return visibleRecords;
    }
  }, [visibleRecords, activeKpiFilter]);

  // Info for active card filter banner
  const activeKpiInfo = useMemo(() => {
    switch (activeKpiFilter) {
      case 'NILAI_KONTRAK':
        return {
          title: 'Nilai Kontrak Tertinggi',
          desc: 'Menampilkan seluruh kontrak diurutkan dari nilai kontrak terbesar ke terkecil.',
          color: 'blue'
        };
      case 'PEMBAYARAN':
        return {
          title: 'Kontrak dengan Realisasi Pembayaran',
          desc: 'Menampilkan kontrak yang telah memiliki realisasi pembayaran (Nilai Pembayaran > Rp 0).',
          color: 'emerald'
        };
      case 'SISA_KONTRAK':
        return {
          title: 'Kontrak dengan Sisa Belum Terbayar',
          desc: 'Menampilkan kontrak yang masih memiliki sisa dana belum terealisasi (Sisa Kontrak > Rp 0).',
          color: 'amber'
        };
      case 'SELESAI':
        return {
          title: 'Semua Kontrak Selesai',
          desc: 'Menampilkan seluruh kontrak yang sudah selesai (Tepat Waktu maupun Terlambat).',
          color: 'emerald'
        };
      case 'SELESAI_TEPAT_WAKTU':
        return {
          title: 'Kontrak Selesai Tepat Waktu',
          desc: 'Menampilkan kontrak yang telah selesai tepat waktu sesuai jadwal.',
          color: 'emerald'
        };
      case 'SELESAI_TERLAMBAT':
        return {
          title: 'Kontrak Selesai Terlambat',
          desc: 'Menampilkan kontrak yang sudah selesai namun melewati jadwal kontrak awal.',
          color: 'rose'
        };
      case 'BELUM_SELESAI':
        return {
          title: 'Semua Kontrak Belum Selesai',
          desc: 'Menampilkan kontrak aktif yang masih dalam masa pelaksanaan (Murni maupun Terlambat).',
          color: 'amber'
        };
      case 'BELUM_SELESAI_MURNI':
        return {
          title: 'Kontrak Belum Selesai (Murni / Lancar)',
          desc: 'Menampilkan kontrak berjalan yang belum melewati masa jatuh tempo.',
          color: 'amber'
        };
      case 'BELUM_SELESAI_TERLAMBAT':
        return {
          title: 'Kontrak Belum Selesai (Terlambat Termin / Batas Waktu)',
          desc: 'Menampilkan kontrak aktif yang sudah melewati batas termin atau tanggal selesai.',
          color: 'rose'
        };
      case 'TERLAMBAT':
        return {
          title: '⚠️ Seluruh Kontrak Terlambat / Kritis',
          desc: 'Menampilkan seluruh kontrak dengan status keterlambatan termin atau lewat tanggal selesai.',
          color: 'rose'
        };
      case 'NRK_PERLU_PENYESUAIAN':
        return {
          title: 'NRK Perlu Penyesuaian SPAN',
          desc: 'Menampilkan kontrak yang nomor NRK pada SAKTI dan SPAN belum sesuai.',
          color: 'blue'
        };
      default:
        return null;
    }
  }, [activeKpiFilter]);

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

              {/* 8 SUMMARY CARDS (INTERAKTIF & BISA DIPENCET UNTUK FILTER TABEL) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-extrabold flex items-center gap-1.5">
                    <span>💡 Klik salah satu kotak di bawah untuk memfilter data pada tabel kontrak secara otomatis:</span>
                  </span>
                  {activeKpiFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setActiveKpiFilter('ALL')}
                      className="font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Hapus Filter Kotak</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Kontrak - Indigo/Slate Theme */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCardClick('ALL')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick('ALL');
                      }
                    }}
                    className={`rounded-3xl border shadow-sm transition-all duration-200 cursor-pointer select-none group relative overflow-hidden flex flex-col justify-between ${
                      activeKpiFilter === 'ALL'
                        ? 'ring-2 ring-indigo-500 border-indigo-500 bg-gradient-to-br from-indigo-100/90 via-white to-indigo-50 dark:from-indigo-950/70 dark:via-slate-900 dark:to-indigo-950/40 shadow-lg scale-[1.01]'
                        : isDark
                        ? 'bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border-indigo-900/60 hover:border-indigo-500 hover:-translate-y-1 hover:shadow-md'
                        : 'bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border-indigo-200/90 hover:border-indigo-400 hover:-translate-y-1 hover:shadow-md'
                    }`}
                    title="Klik untuk memfilter: Tampilkan seluruh kontrak"
                  >
                    <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-purple-600" />
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-300 mb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span>TOTAL KONTRAK</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {activeKpiFilter === 'ALL' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white shadow-xs">
                                ✓ Aktif
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100/80 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                Klik 👆
                              </span>
                            )}
                            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                              <FileText className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <strong className="text-2xl sm:text-3xl font-mono font-black text-indigo-950 dark:text-white block">
                          {formatNumber(summary.totalKontrak)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-indigo-100/80 dark:border-indigo-900/40">
                        <span>Kontrak terdaftar periode ini</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          Semua Data
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Total Nilai Kontrak - Deep Royal Blue Theme */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCardClick('NILAI_KONTRAK')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick('NILAI_KONTRAK');
                      }
                    }}
                    className={`rounded-3xl border shadow-sm transition-all duration-200 cursor-pointer select-none group relative overflow-hidden flex flex-col justify-between ${
                      activeKpiFilter === 'NILAI_KONTRAK'
                        ? 'ring-2 ring-blue-500 border-blue-500 bg-gradient-to-br from-blue-100/90 via-white to-blue-50 dark:from-blue-950/70 dark:via-slate-900 dark:to-blue-950/40 shadow-lg scale-[1.01]'
                        : isDark
                        ? 'bg-gradient-to-br from-slate-900 via-blue-950/25 to-slate-900 border-blue-900/60 hover:border-blue-500 hover:-translate-y-1 hover:shadow-md'
                        : 'bg-gradient-to-br from-blue-50/70 via-white to-sky-50 border-blue-200/90 hover:border-blue-400 hover:-translate-y-1 hover:shadow-md'
                    }`}
                    title="Klik untuk mengurutkan kontrak dari nilai terbesar"
                  >
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-sky-500" />
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-blue-900 dark:text-blue-300 mb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>NILAI KONTRAK</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {activeKpiFilter === 'NILAI_KONTRAK' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-xs">
                                ✓ Tertinggi
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-950 text-blue-700 dark:text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                Urut 👆
                              </span>
                            )}
                            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                              <DollarSign className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <strong className="text-xl sm:text-2xl font-mono font-black text-blue-700 dark:text-blue-400 block truncate">
                          {formatRupiah(summary.totalNilaiKontrak)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-blue-100/80 dark:border-blue-900/40">
                        <span className="truncate">SUM(NILAI KONTRAK) seluruh rekanan</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">
                          Pagu
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Nilai Pembayaran - Vibrant Emerald Theme */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCardClick('PEMBAYARAN')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick('PEMBAYARAN');
                      }
                    }}
                    className={`rounded-3xl border shadow-sm transition-all duration-200 cursor-pointer select-none group relative overflow-hidden flex flex-col justify-between ${
                      activeKpiFilter === 'PEMBAYARAN'
                        ? 'ring-2 ring-emerald-500 border-emerald-500 bg-gradient-to-br from-emerald-100/90 via-white to-emerald-50 dark:from-emerald-950/70 dark:via-slate-900 dark:to-emerald-950/40 shadow-lg scale-[1.01]'
                        : isDark
                        ? 'bg-gradient-to-br from-slate-900 via-emerald-950/25 to-slate-900 border-emerald-900/60 hover:border-emerald-500 hover:-translate-y-1 hover:shadow-md'
                        : 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50 border-emerald-200/90 hover:border-emerald-400 hover:-translate-y-1 hover:shadow-md'
                    }`}
                    title="Klik untuk memfilter: Kontrak dengan realisasi pembayaran"
                  >
                    <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-300 mb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>PEMBAYARAN</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {activeKpiFilter === 'PEMBAYARAN' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs">
                                ✓ Difilter
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                Filter 👆
                              </span>
                            )}
                            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <strong className="text-xl sm:text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 block truncate">
                          {formatRupiah(summary.totalNilaiPembayaran)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 mt-2 pt-2 border-t border-emerald-100/80 dark:border-emerald-900/40">
                        <span className="font-extrabold flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 font-black">
                            {summary.persenRealisasiPembayaran !== null
                              ? `${summary.persenRealisasiPembayaran.toFixed(1)}%`
                              : '0%'}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">Realisasi</span>
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          Terealisasi
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Sisa Kontrak - Warm Amber/Golden Theme */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCardClick('SISA_KONTRAK')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick('SISA_KONTRAK');
                      }
                    }}
                    className={`rounded-3xl border shadow-sm transition-all duration-200 cursor-pointer select-none group relative overflow-hidden flex flex-col justify-between ${
                      activeKpiFilter === 'SISA_KONTRAK'
                        ? 'ring-2 ring-amber-500 border-amber-500 bg-gradient-to-br from-amber-100/90 via-white to-amber-50 dark:from-amber-950/70 dark:via-slate-900 dark:to-amber-950/40 shadow-lg scale-[1.01]'
                        : isDark
                        ? 'bg-gradient-to-br from-slate-900 via-amber-950/25 to-slate-900 border-amber-900/60 hover:border-amber-500 hover:-translate-y-1 hover:shadow-md'
                        : 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50 border-amber-200/90 hover:border-amber-400 hover:-translate-y-1 hover:shadow-md'
                    }`}
                    title="Klik untuk memfilter: Kontrak dengan sisa dana belum terbayar"
                  >
                    <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-amber-900 dark:text-amber-300 mb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>SISA KONTRAK</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {activeKpiFilter === 'SISA_KONTRAK' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white shadow-xs">
                                ✓ Difilter
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-950 text-amber-800 dark:text-amber-300 group-hover:bg-amber-600 group-hover:text-white transition-all">
                                Filter 👆
                              </span>
                            )}
                            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs group-hover:scale-105 transition-transform">
                              <Clock className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <strong className="text-xl sm:text-2xl font-mono font-black text-amber-600 dark:text-amber-400 block truncate">
                          {formatRupiah(summary.totalSisaKontrak)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-300 mt-2 pt-2 border-t border-amber-100/80 dark:border-amber-900/40">
                        <span className="font-extrabold flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 font-black">
                            {summary.persenSisaKontrak !== null ? `${summary.persenSisaKontrak.toFixed(1)}%` : '0%'}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">Belum Cair</span>
                        </span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          Sisa Dana
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Kontrak Selesai - Vibrant Teal/Mint Theme */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCardClick('SELESAI')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick('SELESAI');
                      }
                    }}
                    className={`rounded-3xl border shadow-sm transition-all duration-200 cursor-pointer select-none group relative overflow-hidden flex flex-col justify-between ${
                      activeKpiFilter === 'SELESAI' ||
                      activeKpiFilter === 'SELESAI_TEPAT_WAKTU' ||
                      activeKpiFilter === 'SELESAI_TERLAMBAT'
                        ? 'ring-2 ring-teal-500 border-teal-500 bg-gradient-to-br from-teal-100/90 via-white to-emerald-50 dark:from-teal-950/70 dark:via-slate-900 dark:to-emerald-950/40 shadow-lg scale-[1.01]'
                        : isDark
                        ? 'bg-gradient-to-br from-slate-900 via-teal-950/25 to-slate-900 border-teal-900/60 hover:border-teal-500 hover:-translate-y-1 hover:shadow-md'
                        : 'bg-gradient-to-br from-teal-50/70 via-white to-emerald-50 border-teal-200/90 hover:border-teal-400 hover:-translate-y-1 hover:shadow-md'
                    }`}
                    title="Klik untuk memfilter: Seluruh kontrak selesai"
                  >
                    <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 to-emerald-600" />
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-teal-900 dark:text-teal-300 mb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-teal-500" />
                            <span>KONTRAK SELESAI</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {activeKpiFilter === 'SELESAI' ||
                            activeKpiFilter === 'SELESAI_TEPAT_WAKTU' ||
                            activeKpiFilter === 'SELESAI_TERLAMBAT' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white shadow-xs">
                                {activeKpiFilter === 'SELESAI_TEPAT_WAKTU'
                                  ? '✓ Tepat Waktu'
                                  : activeKpiFilter === 'SELESAI_TERLAMBAT'
                                  ? '✓ Terlambat'
                                  : '✓ Selesai'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100/80 dark:bg-teal-950 text-teal-700 dark:text-teal-300 group-hover:bg-teal-600 group-hover:text-white transition-all">
                                Filter 👆
                              </span>
                            )}
                            <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <strong className="text-2xl sm:text-3xl font-mono font-black text-teal-700 dark:text-teal-400 block">
                          {formatNumber(summary.totalSelesai)}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] mt-2 pt-2 border-t border-teal-100/80 dark:border-teal-900/40 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick('SELESAI_TEPAT_WAKTU');
                          }}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                            activeKpiFilter === 'SELESAI_TEPAT_WAKTU'
                              ? 'bg-teal-600 text-white shadow-2xs'
                              : 'bg-teal-100/80 dark:bg-teal-950 text-teal-800 dark:text-teal-200 hover:bg-teal-200'
                          }`}
                          title="Klik khusus filter Tepat Waktu"
                        >
                          Tepat waktu: {summary.selesaiTepatWaktu}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick('SELESAI_TERLAMBAT');
                          }}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                            activeKpiFilter === 'SELESAI_TERLAMBAT'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'bg-rose-100/80 dark:bg-rose-950 text-rose-800 dark:text-rose-200 hover:bg-rose-200'
                          }`}
                          title="Klik khusus filter Selesai Terlambat"
                        >
                          Terlambat: {summary.selesaiTerlambat}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 6: Kontrak Belum Selesai - Sunflower/Orange Theme */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCardClick('BELUM_SELESAI')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick('BELUM_SELESAI');
                      }
                    }}
                    className={`rounded-3xl border shadow-sm transition-all duration-200 cursor-pointer select-none group relative overflow-hidden flex flex-col justify-between ${
                      activeKpiFilter === 'BELUM_SELESAI' ||
                      activeKpiFilter === 'BELUM_SELESAI_MURNI' ||
                      activeKpiFilter === 'BELUM_SELESAI_TERLAMBAT'
                        ? 'ring-2 ring-orange-500 border-orange-500 bg-gradient-to-br from-orange-100/90 via-white to-amber-50 dark:from-orange-950/70 dark:via-slate-900 dark:to-orange-950/40 shadow-lg scale-[1.01]'
                        : isDark
                        ? 'bg-gradient-to-br from-slate-900 via-orange-950/25 to-slate-900 border-orange-900/60 hover:border-orange-500 hover:-translate-y-1 hover:shadow-md'
                        : 'bg-gradient-to-br from-orange-50/70 via-white to-amber-50 border-orange-200/90 hover:border-orange-400 hover:-translate-y-1 hover:shadow-md'
                    }`}
                    title="Klik untuk memfilter: Seluruh kontrak belum selesai"
                  >
                    <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 to-amber-500" />
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-orange-900 dark:text-orange-300 mb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                            <span>BELUM SELESAI</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {activeKpiFilter === 'BELUM_SELESAI' ||
                            activeKpiFilter === 'BELUM_SELESAI_MURNI' ||
                            activeKpiFilter === 'BELUM_SELESAI_TERLAMBAT' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-600 text-white shadow-xs">
                                {activeKpiFilter === 'BELUM_SELESAI_MURNI'
                                  ? '✓ Murni'
                                  : activeKpiFilter === 'BELUM_SELESAI_TERLAMBAT'
                                  ? '✓ Terlambat'
                                  : '✓ Belum Selesai'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100/80 dark:bg-orange-950 text-orange-800 dark:text-orange-300 group-hover:bg-orange-600 group-hover:text-white transition-all">
                                Filter 👆
                              </span>
                            )}
                            <div className="p-2 rounded-xl bg-orange-500 text-white shadow-xs group-hover:scale-105 transition-transform">
                              <Clock className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <strong className="text-2xl sm:text-3xl font-mono font-black text-orange-600 dark:text-orange-400 block">
                          {formatNumber(summary.totalBelumSelesai)}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] mt-2 pt-2 border-t border-orange-100/80 dark:border-orange-900/40 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick('BELUM_SELESAI_MURNI');
                          }}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                            activeKpiFilter === 'BELUM_SELESAI_MURNI'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-amber-100/80 dark:bg-amber-950 text-amber-800 dark:text-amber-200 hover:bg-amber-200'
                          }`}
                          title="Klik filter Belum Selesai Murni"
                        >
                          Murni: {summary.belumSelesaiMurni}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick('BELUM_SELESAI_TERLAMBAT');
                          }}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                            activeKpiFilter === 'BELUM_SELESAI_TERLAMBAT'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'bg-rose-100/80 dark:bg-rose-950 text-rose-800 dark:text-rose-200 hover:bg-rose-200'
                          }`}
                          title="Klik filter Belum Selesai Terlambat"
                        >
                          Terlambat: {summary.belumSelesaiTerlambatTermin + summary.belumSelesaiTerlambat}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 7: Kontrak Terlambat - Crimson/Rose Warning Theme */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCardClick('TERLAMBAT')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick('TERLAMBAT');
                      }
                    }}
                    className={`rounded-3xl border shadow-sm transition-all duration-200 cursor-pointer select-none group relative overflow-hidden flex flex-col justify-between ${
                      activeKpiFilter === 'TERLAMBAT'
                        ? 'ring-2 ring-rose-500 border-rose-500 bg-gradient-to-br from-rose-100/90 via-white to-red-50 dark:from-rose-950/70 dark:via-slate-900 dark:to-rose-950/40 shadow-lg scale-[1.01]'
                        : isDark
                        ? 'bg-gradient-to-br from-slate-900 via-rose-950/30 to-slate-900 border-rose-900/60 hover:border-rose-500 hover:-translate-y-1 hover:shadow-md'
                        : 'bg-gradient-to-br from-rose-50/70 via-white to-red-50 border-rose-300/90 hover:border-rose-500 hover:-translate-y-1 hover:shadow-md'
                    }`}
                    title="Klik untuk memfokuskan tabel ke seluruh kontrak terlambat / bermasalah"
                  >
                    <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-red-600 animate-pulse" />
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-rose-900 dark:text-rose-300 mb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                            <span>⚠️ TERLAMBAT</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {activeKpiFilter === 'TERLAMBAT' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs">
                                ✓ Fokus Kritis
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100/80 dark:bg-rose-950 text-rose-800 dark:text-rose-300 group-hover:bg-rose-600 group-hover:text-white transition-all">
                                Kritis 👆
                              </span>
                            )}
                            <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <strong className="text-2xl sm:text-3xl font-mono font-black text-rose-600 dark:text-rose-400 block">
                          {formatNumber(summary.totalTerlambat)}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] mt-2 pt-2 border-t border-rose-100/80 dark:border-rose-900/40 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-rose-100/80 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold">
                          Termin: {summary.belumSelesaiTerlambatTermin}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-100/80 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold">
                          Terlambat: {summary.belumSelesaiTerlambat + summary.selesaiTerlambat}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 8: NRK Perlu Penyesuaian - Royal Purple Theme */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCardClick('NRK_PERLU_PENYESUAIAN')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick('NRK_PERLU_PENYESUAIAN');
                      }
                    }}
                    className={`rounded-3xl border shadow-sm transition-all duration-200 cursor-pointer select-none group relative overflow-hidden flex flex-col justify-between ${
                      activeKpiFilter === 'NRK_PERLU_PENYESUAIAN'
                        ? 'ring-2 ring-purple-500 border-purple-500 bg-gradient-to-br from-purple-100/90 via-white to-purple-50 dark:from-purple-950/70 dark:via-slate-900 dark:to-purple-950/40 shadow-lg scale-[1.01]'
                        : isDark
                        ? 'bg-gradient-to-br from-slate-900 via-purple-950/25 to-slate-900 border-purple-900/60 hover:border-purple-500 hover:-translate-y-1 hover:shadow-md'
                        : 'bg-gradient-to-br from-purple-50/70 via-white to-violet-50 border-purple-200/90 hover:border-purple-400 hover:-translate-y-1 hover:shadow-md'
                    }`}
                    title="Klik untuk memfilter: Kontrak yang nomor NRK-nya perlu disesuaikan dengan SPAN"
                  >
                    <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 to-violet-600" />
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-purple-900 dark:text-purple-300 mb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            <span>NRK PERLU SESUAI</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {activeKpiFilter === 'NRK_PERLU_PENYESUAIAN' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white shadow-xs">
                                ✓ Difilter
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100/80 dark:bg-purple-950 text-purple-700 dark:text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                Filter 👆
                              </span>
                            )}
                            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                              <FileCheck className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <strong className="text-2xl sm:text-3xl font-mono font-black text-purple-600 dark:text-purple-400 block">
                          {formatNumber(summary.nrkPerluPenyesuaian)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-purple-100/80 dark:border-purple-900/40">
                        <span className="truncate">Status: SESUAIKAN DENGAN NRK SPAN</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0">
                          Sinkron
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE KPI FILTER BANNER (MUNCUL KETIKA SALAH SATU KOTAK DIKLIK) */}
              {activeKpiInfo && (
                <div
                  className={`p-4 rounded-3xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 ${
                    activeKpiInfo.color === 'blue'
                      ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                      : activeKpiInfo.color === 'emerald'
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : activeKpiInfo.color === 'amber'
                      ? 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-2xl text-white shadow-xs shrink-0 ${
                        activeKpiInfo.color === 'blue'
                          ? 'bg-blue-600'
                          : activeKpiInfo.color === 'emerald'
                          ? 'bg-emerald-600'
                          : activeKpiInfo.color === 'amber'
                          ? 'bg-amber-600'
                          : 'bg-rose-600'
                      }`}
                    >
                      <Filter className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm">{activeKpiInfo.title}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white dark:bg-slate-800 border shadow-2xs">
                          {formatNumber(tableRecords.length)} dari {formatNumber(summary.totalKontrak)} Kontrak
                        </span>
                      </div>
                      <p className="text-[11px] opacity-85 mt-0.5 font-medium">
                        {activeKpiInfo.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('kontrak-table-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-current/20 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>Ke Tabel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveKpiFilter('ALL')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5 text-rose-500" />
                      <span>Reset Filter (Semua)</span>
                    </button>
                  </div>
                </div>
              )}

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
                records={tableRecords}
                isDark={isDark}
                userRole={userRole}
                userSatkerCode={userSatkerCode}
                activeKpiFilter={activeKpiFilter}
                onClearKpiFilter={() => setActiveKpiFilter('ALL')}
                kpiFilterLabel={activeKpiInfo?.title}
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
