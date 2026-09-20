import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileText,
  Building2,
  ChevronDown,
  Info,
  Layers,
  ChevronLeft,
  ChevronRight,
  Send,
  Printer,
  MousePointerClick,
  X,
  CreditCard,
  User,
  ShieldCheck,
  Check,
  PhoneCall,
  Sparkles
} from 'lucide-react';
import {
  MonitoringLPJRecord,
  LPJUploadBatch,
  LPJBatchSummary,
  MasterSatker,
  LPJStatusType,
  LPJJenisBendahara
} from '../../types';
import {
  formatRupiah,
  computeLPJSummary,
  generateSampleLPJWorkbookBytes
} from '../../utils/lpjExcelParser';
import { exportLPJExcel, exportLPJPDF } from '../../utils/lpjExportHelper';
import { DetailSatkerLPJModal } from './DetailSatkerLPJModal';
import { CetakLPJPdfModal } from './CetakLPJPdfModal';

interface LPJDashboardProps {
  records: MonitoringLPJRecord[];
  uploads: LPJUploadBatch[];
  masterSatkers?: MasterSatker[];
  isAdminAuthenticated: boolean;
  isDark: boolean;
}

export type LPJKpiFilter = 'ALL' | 'SUDAH_KIRIM' | 'BELUM_KIRIM' | 'PENGELUARAN' | 'PENERIMAAN' | 'KLOP';

export const LPJDashboard: React.FC<LPJDashboardProps> = ({
  records,
  uploads,
  masterSatkers = [],
  isAdminAuthenticated,
  isDark
}) => {
  // Theme styling
  const bgCard = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const bgSubtle = isDark ? 'bg-slate-800/60' : 'bg-slate-50';

  // State: Filter Interaktif (Dapat diklik masing-masing)
  const [selectedPeriode, setSelectedPeriode] = useState<string>('ALL');
  const [kpiFilter, setKpiFilter] = useState<LPJKpiFilter>('ALL');
  const [filterJenis, setFilterJenis] = useState<string>('SEMUA');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');
  const [filterVerifikasi, setFilterVerifikasi] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State: Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // State: Modals
  const [selectedSatkerForDetail, setSelectedSatkerForDetail] = useState<MonitoringLPJRecord | null>(null);
  const [isCetakPdfModalOpen, setIsCetakPdfModalOpen] = useState<boolean>(false);

  // Available periodes from data
  const availablePeriodes = useMemo(() => {
    const setP = new Set(records.map(r => r.periodeFormatted));
    return Array.from(setP).filter(Boolean);
  }, [records]);

  // Active records by Periode tab
  const periodFilteredRecords = useMemo(() => {
    if (selectedPeriode === 'ALL') return records;
    return records.filter(r => r.periodeFormatted === selectedPeriode);
  }, [records, selectedPeriode]);

  // Dynamic summary for current period view
  const currentSummary = useMemo(() => {
    return computeLPJSummary(periodFilteredRecords);
  }, [periodFilteredRecords]);

  // Full filtered records based on all active filters
  const filteredRecords = useMemo(() => {
    return periodFilteredRecords.filter(r => {
      // 1. KPI quick filter
      if (kpiFilter === 'SUDAH_KIRIM' && r.statusPengiriman !== 'SUDAH_KIRIM') return false;
      if (kpiFilter === 'BELUM_KIRIM' && r.statusPengiriman !== 'BELUM_KIRIM') return false;
      if (kpiFilter === 'PENGELUARAN' && r.jenisBendahara !== 'PENGELUARAN') return false;
      if (kpiFilter === 'PENERIMAAN' && r.jenisBendahara !== 'PENERIMAAN') return false;
      if (kpiFilter === 'KLOP' && r.statusKlopKas !== 'KLOP') return false;

      // 2. Jenis Bendahara dropdown
      if (filterJenis !== 'SEMUA') {
        if (filterJenis === 'PENGELUARAN' && r.jenisBendahara !== 'PENGELUARAN') return false;
        if (filterJenis === 'PENERIMAAN' && r.jenisBendahara !== 'PENERIMAAN') return false;
      }

      // 3. Status Pengiriman dropdown
      if (filterStatus !== 'SEMUA') {
        if (filterStatus === 'SUDAH_KIRIM' && r.statusPengiriman !== 'SUDAH_KIRIM') return false;
        if (filterStatus === 'BELUM_KIRIM' && r.statusPengiriman !== 'BELUM_KIRIM') return false;
      }

      // 4. Status Verifikasi dropdown
      if (filterVerifikasi !== 'SEMUA') {
        if (filterVerifikasi === 'TERVERIFIKASI' && (r.statusVerifikasi !== 'TERVERIFIKASI' && r.statusVerifikasi !== 'DISETUJUI')) return false;
        if (filterVerifikasi === 'BELUM_KIRIM' && r.statusVerifikasi !== 'BELUM_KIRIM') return false;
        if (filterVerifikasi === 'MENUNGGU_VERIFIKASI' && r.statusVerifikasi !== 'MENUNGGU_VERIFIKASI') return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchKode = r.kodeSatker.toLowerCase().includes(q);
        const matchNama = r.namaSatker.toLowerCase().includes(q);
        const matchBendahara = r.namaBendahara.toLowerCase().includes(q);
        const matchNoLpj = (r.nomorLpj || '').toLowerCase().includes(q);
        const matchNoHp = (r.noHpBendahara || '').toLowerCase().includes(q);
        if (!matchKode && !matchNama && !matchBendahara && !matchNoLpj && !matchNoHp) {
          return false;
        }
      }

      return true;
    });
  }, [
    periodFilteredRecords,
    kpiFilter,
    filterJenis,
    filterStatus,
    filterVerifikasi,
    searchQuery
  ]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriode, kpiFilter, filterJenis, filterStatus, filterVerifikasi, searchQuery]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;

  // Direct PDF Print Helpers
  const handlePrintBelumKirim = () => {
    const belumKirimRecords = records.filter(r => r.statusPengiriman === 'BELUM_KIRIM' && (selectedPeriode === 'ALL' || r.periodeFormatted === selectedPeriode));
    const sum = computeLPJSummary(belumKirimRecords);
    exportLPJPDF(belumKirimRecords, sum, selectedPeriode === 'ALL' ? 'Semua Periode' : selectedPeriode, {
      customTitle: 'DAFTAR SATKER YANG BELUM MENYAMPAIKAN LPJ BENDAHARA',
      filterLabel: 'Satker Status Belum Mengirimkan LPJ',
      filenamePrefix: 'Daftar-Satker-Belum-Kirim-LPJ',
      themeColor: [225, 29, 72]
    });
  };

  const handlePrintSudahKirim = () => {
    const sudahKirimRecords = records.filter(r => r.statusPengiriman === 'SUDAH_KIRIM' && (selectedPeriode === 'ALL' || r.periodeFormatted === selectedPeriode));
    const sum = computeLPJSummary(sudahKirimRecords);
    exportLPJPDF(sudahKirimRecords, sum, selectedPeriode === 'ALL' ? 'Semua Periode' : selectedPeriode, {
      customTitle: 'DAFTAR SATKER YANG SUDAH MENYAMPAIKAN LPJ BENDAHARA LENGKAP',
      filterLabel: 'Satker Status Terverifikasi / Selesai',
      filenamePrefix: 'Daftar-Satker-Lengkap-LPJ',
      themeColor: [16, 185, 129]
    });
  };

  const handleExportExcel = () => {
    exportLPJExcel(filteredRecords, currentSummary, selectedPeriode === 'ALL' ? 'Semua Periode' : selectedPeriode);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Banner Executive Header */}
      <div className={`p-6 rounded-2xl border shadow-sm ${bgCard} relative overflow-hidden`}>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                MONITORING LPJ BENDAHARA
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                • SAKTI &amp; KPPN 026 Semarang
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Dashboard Monitoring Kepatuhan LPJ Bendahara
            </h1>
            <p className={`text-sm ${textMuted} mt-1 max-w-3xl`}>
              Pantau kepatuhan penyampaian Laporan Pertanggungjawaban (LPJ) Bendahara Pengeluaran &amp; Penerimaan.
              Cek satker yang sudah mengirimkan berkas lengkap serta tindak lanjuti satker yang belum mengirimkan sebelum batas waktu.
            </p>
          </div>

          {/* Action Buttons: CETAK PDF & Export Excel */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsCetakPdfModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 hover:scale-[1.02] transition-all"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen PDF
            </button>

            <button
              onClick={handlePrintBelumKirim}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              title="Cetak PDF khusus satker yang belum kirim"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Cetak Belum Kirim PDF
            </button>

            <button
              onClick={handleExportExcel}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow-xs transition-all ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor Excel
            </button>
          </div>
        </div>

        {/* Periode Tab Filter Bar (Agustus vs September vs Semua) */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Pilih Periode LPJ:
            </span>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <button
                onClick={() => setSelectedPeriode('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriode === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua Periode ({records.length})
              </button>

              {availablePeriodes.map(p => {
                const count = records.filter(r => r.periodeFormatted === p).length;
                const isAgustus = p.includes('Agustus');
                const isSeptember = p.includes('September');

                return (
                  <button
                    key={p}
                    onClick={() => setSelectedPeriode(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedPeriode === p
                        ? isAgustus
                          ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                          : isSeptember
                          ? 'bg-rose-600 text-white shadow-xs shadow-rose-600/30'
                          : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{p}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      selectedPeriode === p
                        ? 'bg-white/20 text-white'
                        : isAgustus
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : isSeptember
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isAgustus ? 'Lengkap (100%)' : isSeptember ? 'Belum Kirim (0%)' : count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Batas Penyampaian LPJ: <strong>Tanggal 10 Bulan Berikutnya</strong></span>
          </div>
        </div>
      </div>

      {/* Interactive KPI Summary Cards - "Masing-masing filternya bisa di klik dong" */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-indigo-500" />
            Ringkasan Status LPJ • Klik Kartu KPI untuk Filter Otomatis
          </span>
          {kpiFilter !== 'ALL' && (
            <button
              onClick={() => setKpiFilter('ALL')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Reset Filter KPI ({kpiFilter})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Total Satker Terdaftar */}
          <div
            onClick={() => setKpiFilter('ALL')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer select-none group relative overflow-hidden ${
              kpiFilter === 'ALL'
                ? isDark ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg' : 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400/20 shadow-md'
                : `${bgCard} hover:border-indigo-300 dark:hover:border-indigo-700`
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Total Satker
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {currentSummary.totalSatker}
              </span>
              <span className="text-xs font-medium text-slate-500">Satuan Kerja</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
              <span>{currentSummary.bendaharaPengeluaranCount} Pengeluaran</span>
              <span>•</span>
              <span>{currentSummary.bendaharaPenerimaanCount} Penerimaan</span>
            </p>
          </div>

          {/* KPI 2: Sudah Mengirimkan LPJ (Lengkap) */}
          <div
            onClick={() => setKpiFilter('SUDAH_KIRIM')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer select-none group relative overflow-hidden ${
              kpiFilter === 'SUDAH_KIRIM'
                ? isDark ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg' : 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                : `${bgCard} hover:border-emerald-300 dark:hover:border-emerald-700`
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sudah Mengirimkan
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {currentSummary.persenKepatuhan}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {currentSummary.sudahKirim}
              </span>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Satker Lengkap
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
              <span>Status Terverifikasi KPPN</span>
              {kpiFilter === 'SUDAH_KIRIM' && <span className="font-bold text-emerald-600">(Aktif)</span>}
            </p>
          </div>

          {/* KPI 3: Belum Mengirimkan LPJ */}
          <div
            onClick={() => setKpiFilter('BELUM_KIRIM')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer select-none group relative overflow-hidden ${
              kpiFilter === 'BELUM_KIRIM'
                ? isDark ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30 shadow-lg' : 'bg-rose-50/90 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                : `${bgCard} hover:border-rose-300 dark:hover:border-rose-700`
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Belum Mengirimkan
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                {currentSummary.totalSatker ? 100 - currentSummary.persenKepatuhan : 0}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                {currentSummary.belumKirim}
              </span>
              <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                Satker Menunggak
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
              <span>Perlu Teguran / Tagihan ADK</span>
              {kpiFilter === 'BELUM_KIRIM' && <span className="font-bold text-rose-600">(Aktif)</span>}
            </p>
          </div>

          {/* KPI 4: Posisi Saldo Kas & Rekonsiliasi Kas */}
          <div
            onClick={() => setKpiFilter('KLOP')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer select-none group relative overflow-hidden ${
              kpiFilter === 'KLOP'
                ? isDark ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30 shadow-lg' : 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                : `${bgCard} hover:border-blue-300 dark:hover:border-blue-700`
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-500" /> Saldo Kas Klop
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Rp 0 Selisih
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 truncate">
                {formatRupiah(currentSummary.totalSaldoKas)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Total kas terverifikasi klop pada bank/brankas
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Search Bar */}
      <div className={`p-4 rounded-2xl border shadow-xs ${bgCard} space-y-3`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Kode Satker, Nama Satker, Nama Bendahara, No LPJ..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
              } focus:outline-hidden focus:ring-2 focus:ring-emerald-500`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Status Pengiriman */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              } focus:outline-hidden focus:ring-2 focus:ring-emerald-500`}
            >
              <option value="SEMUA">Status Kirim: Semua</option>
              <option value="SUDAH_KIRIM">Sudah Mengirimkan</option>
              <option value="BELUM_KIRIM">Belum Mengirimkan</option>
            </select>

            {/* Filter Jenis Bendahara */}
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              } focus:outline-hidden focus:ring-2 focus:ring-emerald-500`}
            >
              <option value="SEMUA">Tipe: Pengeluaran &amp; Penerimaan</option>
              <option value="PENGELUARAN">Bendahara Pengeluaran</option>
              <option value="PENERIMAAN">Bendahara Penerimaan</option>
            </select>

            {/* Filter Status Verifikasi */}
            <select
              value={filterVerifikasi}
              onChange={(e) => setFilterVerifikasi(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              } focus:outline-hidden focus:ring-2 focus:ring-emerald-500`}
            >
              <option value="SEMUA">Verifikasi: Semua</option>
              <option value="TERVERIFIKASI">Terverifikasi / Selesai</option>
              <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
              <option value="BELUM_KIRIM">Belum Kirim ADK</option>
            </select>

            {/* Reset All Filters Button */}
            {(kpiFilter !== 'ALL' || filterJenis !== 'SEMUA' || filterStatus !== 'SEMUA' || filterVerifikasi !== 'SEMUA' || searchQuery) && (
              <button
                onClick={() => {
                  setKpiFilter('ALL');
                  setFilterJenis('SEMUA');
                  setFilterStatus('SEMUA');
                  setFilterVerifikasi('SEMUA');
                  setSearchQuery('');
                }}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <span>Menampilkan:</span>
          <strong className="text-slate-800 dark:text-slate-200">{filteredRecords.length}</strong>
          <span>dari total {records.length} satker</span>
          {kpiFilter !== 'ALL' && (
            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
              Filter KPI: {kpiFilter}
            </span>
          )}
          {selectedPeriode !== 'ALL' && (
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
              Periode: {selectedPeriode}
            </span>
          )}
        </div>
      </div>

      {/* Main Table: Level Column-Row Probis Lengkap */}
      <div className={`rounded-2xl border shadow-sm ${bgCard} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800 bg-slate-800/60 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                <th className="py-3 px-3 text-center font-bold w-12">No</th>
                <th className="py-3 px-3 font-bold w-24">Kode</th>
                <th className="py-3 px-4 font-bold min-w-[220px]">Nama Satuan Kerja</th>
                <th className="py-3 px-3 font-bold text-center w-28">Tipe</th>
                <th className="py-3 px-3 font-bold text-center w-28">Periode</th>
                <th className="py-3 px-3 font-bold text-center min-w-[150px]">Status LPJ</th>
                <th className="py-3 px-3 font-bold text-center w-32">Tgl Kirim</th>
                <th className="py-3 px-3 font-bold min-w-[170px]">No LPJ / Berkas</th>
                <th className="py-3 px-3 font-bold text-center w-28">Verifikasi</th>
                <th className="py-3 px-3 font-bold text-right min-w-[120px]">Total Kas</th>
                <th className="py-3 px-3 font-bold text-center w-24">Selisih</th>
                <th className="py-3 px-4 font-bold min-w-[170px]">Bendahara &amp; WA</th>
                <th className="py-3 px-3 text-center font-bold w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
                    <p className="font-semibold text-sm">Tidak ada data satker yang sesuai dengan kriteria filter.</p>
                    <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian atau ubah filter periode.</p>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, idx) => {
                  const absoluteIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isSudah = r.statusPengiriman === 'SUDAH_KIRIM';
                  const isKlop = r.statusKlopKas === 'KLOP';

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        !isSudah ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-500">
                        {absoluteIdx}
                      </td>

                      {/* Kode Satker */}
                      <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {r.kodeSatker}
                      </td>

                      {/* Nama Satker */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white leading-snug">
                          {r.namaSatker}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          KPPN: {r.kodeKppn} • BA: {r.kodeBa || '015'}
                        </div>
                      </td>

                      {/* Tipe Bendahara */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.jenisBendahara === 'PENERIMAAN'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {r.jenisBendahara === 'PENERIMAAN' ? 'Penerimaan' : 'Pengeluaran'}
                        </span>
                      </td>

                      {/* Periode */}
                      <td className="py-3 px-3 text-center font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {r.periodeFormatted}
                      </td>

                      {/* Status LPJ Badge */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-2xs ${
                          isSudah
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse'
                        }`}>
                          {isSudah ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              Sudah Mengirimkan
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              Belum Mengirimkan
                            </>
                          )}
                        </span>
                      </td>

                      {/* Tanggal Kirim */}
                      <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {r.tanggalKirim || '-'}
                      </td>

                      {/* Nomor LPJ Dokumen */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {r.nomorLpj || '-'}
                      </td>

                      {/* Status Verifikasi */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.statusVerifikasi === 'TERVERIFIKASI' || r.statusVerifikasi === 'DISETUJUI'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {r.statusVerifikasi}
                        </span>
                      </td>

                      {/* Total Kas */}
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {formatRupiah(r.totalSaldoKas)}
                      </td>

                      {/* Selisih Kas Status */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isKlop
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {isKlop ? 'Klop' : isSudah ? 'Selisih' : '-'}
                        </span>
                      </td>

                      {/* Bendahara & WA */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                          {r.namaBendahara}
                        </div>
                        {r.noHpBendahara && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                            <PhoneCall className="w-2.5 h-2.5" />
                            {r.noHpBendahara}
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedSatkerForDetail(r)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto transition-colors"
                          title="Lihat rincian berkas & probis LPJ"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Pagination */}
        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} flex flex-col sm:flex-row items-center justify-between gap-3 text-xs`}>
          <div className="flex items-center gap-2 text-slate-500">
            <span>Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong></span>
            <span>•</span>
            <span>Total {filteredRecords.length} Data Satker</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 font-semibold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </button>

            {/* Page buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg font-bold transition-all ${
                    currentPage === page
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 font-semibold transition-colors"
            >
              Selanjutnya <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedSatkerForDetail && (
        <DetailSatkerLPJModal
          record={selectedSatkerForDetail}
          masterSatker={masterSatkers.find(m => m.kodeSatker === selectedSatkerForDetail.kodeSatker)}
          isDark={isDark}
          onClose={() => setSelectedSatkerForDetail(null)}
        />
      )}

      {isCetakPdfModalOpen && (
        <CetakLPJPdfModal
          isOpen={isCetakPdfModalOpen}
          onClose={() => setIsCetakPdfModalOpen(false)}
          allRecords={records}
          currentFilteredRecords={filteredRecords}
          currentPeriode={selectedPeriode}
          isDark={isDark}
        />
      )}
    </div>
  );
};
