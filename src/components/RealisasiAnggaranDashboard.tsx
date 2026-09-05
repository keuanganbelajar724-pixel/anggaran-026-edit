import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Search, 
  Download, 
  SlidersHorizontal, 
  HelpCircle, 
  Info, 
  ExternalLink, 
  Building2, 
  ArrowUpDown, 
  DollarSign, 
  X, 
  RotateCcw, 
  Upload, 
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  LayoutGrid,
  ListFilter,
  BarChart3,
  FileText,
  Copy,
  Check,
  ShieldAlert,
  AlertOctagon,
  Award,
  Flame,
  Briefcase,
  Calculator
} from 'lucide-react';
import { 
  MyIntressRecord, 
  TriwulanKey, 
  TargetTriwulanRule, 
  RealisasiAnggaranConfig, 
  DashboardConfig, 
  AppTheme 
} from '../types';
import { 
  DEFAULT_TARGET_TRIWULAN, 
  TRIWULAN_OPTIONS, 
  evaluateSatkerTriwulan, 
  computeSummaryRealisasiTriwulan, 
  EvaluatedSatkerRealisasi, 
  formatRupiah, 
  formatRupiahCompact,
  groupSatkersByKL,
  groupSatkersByCluster,
  GroupedKLSummary,
  GroupedClusterSummary,
  PaguClusterType,
  PriorityRiskType
} from '../utils/targetTriwulanProcessor';
import { PaginationControl } from './PaginationControl';
import { RealisasiKLView } from './RealisasiKLView';
import { RealisasiClusterView } from './RealisasiClusterView';
import { RealisasiLeaderboardView } from './RealisasiLeaderboardView';
import { RealisasiBriefingModal } from './RealisasiBriefingModal';
import { RealisasiTargetCalculatorModal } from './RealisasiTargetCalculatorModal';
import * as XLSX from 'xlsx';

interface RealisasiAnggaranDashboardProps {
  records: MyIntressRecord[];
  config?: RealisasiAnggaranConfig;
  dashboardConfig?: DashboardConfig;
  onUpdateConfig?: (newConfig: RealisasiAnggaranConfig) => void;
  onUploadExcel?: (file: File) => void;
  onResetDefaultData?: () => void;
  isAdminAuthenticated?: boolean;
  onOpenAdminAuth?: () => void;
  theme?: AppTheme;
  isDark?: boolean;
}

export const RealisasiAnggaranDashboard: React.FC<RealisasiAnggaranDashboardProps> = ({
  records = [],
  config,
  dashboardConfig,
  onUpdateConfig,
  onUploadExcel,
  onResetDefaultData,
  isAdminAuthenticated = false,
  onOpenAdminAuth,
  theme = 'light',
  isDark = false
}) => {
  // Selected Triwulan for evaluation (defaults to config's activeTriwulan or 'Tw III')
  const [selectedTw, setSelectedTw] = useState<TriwulanKey>(
    config?.activeTriwulan || 'Tw III'
  );

  // Pro View Mode: 'TABEL' | 'GROUP_KL' | 'GROUP_CLUSTER' | 'LEADERBOARD'
  const [viewMode, setViewMode] = useState<'TABEL' | 'GROUP_KL' | 'GROUP_CLUSTER' | 'LEADERBOARD'>('TABEL');

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BELUM_SESUAI' | 'SESUAI'>('ALL');
  const [paguClusterFilter, setPaguClusterFilter] = useState<PaguClusterType>('ALL');
  const [conditionFilter, setConditionFilter] = useState<'ALL' | 'PRIORITAS_1' | 'MODAL_TERTINGGAL' | 'ZERO_REAL' | 'GAP_KRITIS' | 'PUNYA_MODAL' | 'PUNYA_BANSOS'>('ALL');
  const [belanjaFilter, setBelanjaFilter] = useState<'ALL' | 'pegawai' | 'barang' | 'modal' | 'bansos'>('ALL');
  const [klFilter, setKlFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'PERSEN_ASC' | 'PERSEN_DESC' | 'KEKURANGAN_DESC' | 'PAGU_DESC' | 'KODE_ASC'>('KEKURANGAN_DESC');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modals
  const [selectedSatkerForDetail, setSelectedSatkerForDetail] = useState<EvaluatedSatkerRealisasi | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBriefingModal, setShowBriefingModal] = useState(false);

  // Active target rule for current triwulan (allow custom target override if configured)
  const activeRule = useMemo<TargetTriwulanRule>(() => {
    if (config?.customTargets && config.customTargets[selectedTw]) {
      return config.customTargets[selectedTw]!;
    }
    return DEFAULT_TARGET_TRIWULAN[selectedTw] || DEFAULT_TARGET_TRIWULAN['Tw III'];
  }, [config, selectedTw]);

  // Evaluated Satkers
  const evaluatedList = useMemo<EvaluatedSatkerRealisasi[]>(() => {
    return records.map(r => evaluateSatkerTriwulan(r, selectedTw, activeRule));
  }, [records, selectedTw, activeRule]);

  // Summary Metrics
  const summary = useMemo(() => {
    return computeSummaryRealisasiTriwulan(evaluatedList, selectedTw, activeRule);
  }, [evaluatedList, selectedTw, activeRule]);

  // Unique K/L list for filtering
  const uniqueKLs = useMemo(() => {
    const set = new Set<string>();
    evaluatedList.forEach(s => {
      if (s.kementerianLembaga) set.add(s.kementerianLembaga);
    });
    return Array.from(set).sort();
  }, [evaluatedList]);

  // Filtered and Sorted Satkers
  const filteredSatkers = useMemo(() => {
    return evaluatedList.filter(s => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = s.kodeSatker.toLowerCase().includes(q);
        const matchName = s.namaSatker.toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }

      // Status
      if (statusFilter === 'BELUM_SESUAI' && s.overallStatus !== 'BELUM_SESUAI') return false;
      if (statusFilter === 'SESUAI' && s.overallStatus !== 'SESUAI') return false;

      // Pagu Cluster
      if (paguClusterFilter !== 'ALL' && s.paguCluster !== paguClusterFilter) return false;

      // Condition Filter (Pro Analysis)
      if (conditionFilter === 'PRIORITAS_1' && s.priorityRisk !== 'PRIORITAS_1_KRITIS') return false;
      if (conditionFilter === 'MODAL_TERTINGGAL' && !(s.modal.hasPagu && s.modal.status === 'BELUM_MEMENUHI')) return false;
      if (conditionFilter === 'ZERO_REAL' && !s.hasZeroRealization) return false;
      if (conditionFilter === 'GAP_KRITIS' && s.maxNegativeGap < 20) return false;
      if (conditionFilter === 'PUNYA_MODAL' && !s.modal.hasPagu) return false;
      if (conditionFilter === 'PUNYA_BANSOS' && !s.bansos.hasPagu) return false;

      // Jenis belanja tertinggal filter
      if (belanjaFilter === 'pegawai' && s.pegawai.status !== 'BELUM_MEMENUHI') return false;
      if (belanjaFilter === 'barang' && s.barang.status !== 'BELUM_MEMENUHI') return false;
      if (belanjaFilter === 'modal' && s.modal.status !== 'BELUM_MEMENUHI') return false;
      if (belanjaFilter === 'bansos' && s.bansos.status !== 'BELUM_MEMENUHI') return false;

      // KL Filter
      if (klFilter !== 'ALL' && s.kementerianLembaga !== klFilter) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'PERSEN_ASC') return a.totalPersen - b.totalPersen;
      if (sortBy === 'PERSEN_DESC') return b.totalPersen - a.totalPersen;
      if (sortBy === 'KEKURANGAN_DESC') return b.totalKekuranganNominal - a.totalKekuranganNominal;
      if (sortBy === 'PAGU_DESC') return b.totalPagu - a.totalPagu;
      if (sortBy === 'KODE_ASC') return a.kodeSatker.localeCompare(b.kodeSatker);
      return 0;
    });
  }, [evaluatedList, searchQuery, statusFilter, paguClusterFilter, conditionFilter, belanjaFilter, klFilter, sortBy]);

  // Grouped by K/L
  const groupedKLList = useMemo<GroupedKLSummary[]>(() => {
    return groupSatkersByKL(filteredSatkers);
  }, [filteredSatkers]);

  // Grouped by Pagu Cluster
  const groupedClusterList = useMemo<GroupedClusterSummary[]>(() => {
    return groupSatkersByCluster(filteredSatkers);
  }, [filteredSatkers]);

  // Check if any pro filter is active
  const hasActiveFilters = searchQuery.trim() !== '' || 
    statusFilter !== 'ALL' || 
    paguClusterFilter !== 'ALL' || 
    conditionFilter !== 'ALL' || 
    belanjaFilter !== 'ALL' || 
    klFilter !== 'ALL';

  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPaguClusterFilter('ALL');
    setConditionFilter('ALL');
    setBelanjaFilter('ALL');
    setKlFilter('ALL');
    setCurrentPage(1);
  };

  // Paginated Satkers
  const paginatedSatkers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSatkers.slice(start, start + pageSize);
  }, [filteredSatkers, currentPage, pageSize]);

  // Handle Multi-Sheet Pro Export to Excel
  const handleExportExcel = () => {
    // Sheet 1: Rincian Satker
    const exportDataSatker = filteredSatkers.map((s, idx) => ({
      'No': idx + 1,
      'Kode Satker': s.kodeSatker,
      'Nama Satker': s.namaSatker,
      'Kementerian/Lembaga': s.kementerianLembaga || '-',
      'Klaster Pagu': s.clusterLabel,
      'Prioritas Intervensi': s.priorityRisk === 'PRIORITAS_1_KRITIS' ? 'PRIORITAS 1 (KRITIS)' : s.priorityRisk === 'PERHATIAN_MODAL' ? 'ATENSI MODAL' : s.priorityRisk === 'PRIORITAS_2_MODERAT' ? 'PRIORITAS 2' : 'AMAN',
      'Pagu Total (Rp)': s.totalPagu,
      'Realisasi Total (Rp)': s.totalRealisasi,
      '% Realisasi Total': s.totalPersen,
      'Pagu Pegawai (Rp)': s.pegawai.pagu,
      'Real Pegawai (Rp)': s.pegawai.realisasi,
      '% Pegawai': s.pegawai.persen,
      'Target Pegawai %': s.pegawai.targetPersen,
      'Status Pegawai': s.pegawai.status,
      'Kekurangan Pegawai (Rp)': s.pegawai.kekuranganNominal,
      'Pagu Barang (Rp)': s.barang.pagu,
      'Real Barang (Rp)': s.barang.realisasi,
      '% Barang': s.barang.persen,
      'Target Barang %': s.barang.targetPersen,
      'Status Barang': s.barang.status,
      'Kekurangan Barang (Rp)': s.barang.kekuranganNominal,
      'Pagu Modal (Rp)': s.modal.pagu,
      'Real Modal (Rp)': s.modal.realisasi,
      '% Modal': s.modal.persen,
      'Target Modal %': s.modal.targetPersen,
      'Status Modal': s.modal.status,
      'Kekurangan Modal (Rp)': s.modal.kekuranganNominal,
      'Pagu Bansos (Rp)': s.bansos.pagu,
      'Real Bansos (Rp)': s.bansos.realisasi,
      '% Bansos': s.bansos.persen,
      'Target Bansos %': s.bansos.targetPersen,
      'Status Bansos': s.bansos.status,
      'Kekurangan Bansos (Rp)': s.bansos.kekuranganNominal,
      'Status Kepatuhan Triwulan': s.overallStatus === 'SESUAI' ? 'SESUAI TARGET' : 'BELUM SESUAI TARGET',
      'Total Kekurangan Realisasi (Rp)': s.totalKekuranganNominal,
      'Catatan Belum Memenuhi': s.belumMemenuhiList.map(b => `${b.jenis} (Gap ${b.gap}%)`).join(', ') || 'Memenuhi Semua Target'
    }));

    // Sheet 2: Rekap K/L
    const exportDataKL = groupedKLList.map((g, idx) => ({
      'No': idx + 1,
      'Kementerian / Lembaga': g.klName,
      'Jumlah Satker': g.totalSatker,
      'Satker Sesuai Target': g.satkerSesuaiCount,
      'Satker Belum Sesuai': g.satkerBelumSesuaiCount,
      '% Kepatuhan Satker': `${g.persenSesuai}%`,
      'Total Pagu (Rp)': g.totalPagu,
      'Total Realisasi (Rp)': g.totalRealisasi,
      '% Realisasi K/L': `${g.persenRealisasi}%`,
      'Total Kekurangan Realisasi (Rp)': g.totalKekuranganRp,
      'Isu Belanja Modal': g.hasModalIssue ? 'Ada Belanja Modal Tertinggal' : 'Aman'
    }));

    // Sheet 3: Rekap Klaster Pagu
    const exportDataCluster = groupedClusterList.map((c, idx) => ({
      'No': idx + 1,
      'Klaster Skala Pagu': c.label,
      'Kriteria Pagu': c.rangeDesc,
      'Jumlah Satker': c.totalSatker,
      'Satker Sesuai': c.satkerSesuaiCount,
      'Satker Belum Sesuai': c.satkerBelumSesuaiCount,
      '% Kepatuhan': `${c.persenSesuai}%`,
      'Total Pagu (Rp)': c.totalPagu,
      'Total Realisasi (Rp)': c.totalRealisasi,
      '% Realisasi Klaster': `${c.persenRealisasi}%`,
      'Total Kekurangan (Rp)': c.totalKekuranganRp
    }));

    const wb = XLSX.utils.book_new();
    const wsSatker = XLSX.utils.json_to_sheet(exportDataSatker);
    const wsKL = XLSX.utils.json_to_sheet(exportDataKL);
    const wsCluster = XLSX.utils.json_to_sheet(exportDataCluster);

    XLSX.utils.book_append_sheet(wb, wsSatker, `Rincian_Satker_${selectedTw}`);
    XLSX.utils.book_append_sheet(wb, wsKL, `Rekap_KemenLembaga`);
    XLSX.utils.book_append_sheet(wb, wsCluster, `Rekap_Klaster_Pagu`);

    const filename = `Monitoring_Realisasi_MyInTress_${selectedTw.replace(' ', '_')}_KPPN_Semarang_I.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const waktuTarikan = config?.waktuUnduh || '24/10/2024 10:28:44';
  const periodeLabel = config?.periodeLabel || 'Data Realisasi Belanja My InTress';

  return (
    <div className={`space-y-6 pb-12 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* TOP HEADER BANNER */}
      <div className={`rounded-2xl p-6 border transition-all shadow-sm ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900' 
          : 'bg-white border-slate-200/80 bg-gradient-to-r from-emerald-50/40 via-white to-sky-50/40 shadow-slate-100'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <PieChart className="w-3.5 h-3.5" />
                My InTress DJPb
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                Posisi Tarikan: <strong className="font-bold">{waktuTarikan}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                <Building2 className="w-3.5 h-3.5" />
                {records.length} Satker KPPN Semarang I
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard Realisasi Anggaran & Monitoring Target
            </h1>
            <p className={`text-sm max-w-3xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Monitoring kepatuhan target penyerapan anggaran per jenis belanja (Pegawai, Barang, Modal, dan Bansos) sesuai regulasi target triwulanan DJPb untuk mendeteksi dini satker yang belum memenuhi target.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowBriefingModal(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                isDark 
                  ? 'bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border-sky-800/80' 
                  : 'bg-sky-50 hover:bg-sky-100/80 text-sky-800 border-sky-200 shadow-sm'
              }`}
            >
              <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Memo Eksekutif & WA
            </button>

            <button
              onClick={() => setShowRuleModal(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-emerald-500" />
              Tabel Aturan Target
            </button>

            <button
              onClick={handleExportExcel}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                isDark 
                  ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/80' 
                  : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border-emerald-200 shadow-sm'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Ekspor Multi-Sheet
            </button>

            {isAdminAuthenticated ? (
              <button
                onClick={() => setShowSettingsModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Pengaturan Tarikan Data
              </button>
            ) : onOpenAdminAuth ? (
              <button
                onClick={onOpenAdminAuth}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                  isDark ? 'border-slate-750 text-slate-400 hover:text-slate-200' : 'border-slate-200 text-slate-500 hover:text-slate-700'
                }`}
                title="Login Admin untuk mengatur data"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Kelola Data
              </button>
            ) : null}
          </div>
        </div>

        {/* TRIWULAN SELECTOR BAR */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-emerald-500" />
              Evaluasi Target:
            </span>
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {TRIWULAN_OPTIONS.map(opt => {
                const isSelected = selectedTw === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSelectedTw(opt.key);
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {opt.key}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE RULE BADGES */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Target {selectedTw}:
            </span>
            <span className="px-2.5 py-1 rounded-md font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              B. Pegawai: {activeRule.pegawai}%
            </span>
            <span className="px-2.5 py-1 rounded-md font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
              B. Barang: {activeRule.barang}%
            </span>
            <span className="px-2.5 py-1 rounded-md font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              B. Modal: {activeRule.modal}%
            </span>
            <span className="px-2.5 py-1 rounded-md font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
              B. Bansos: {activeRule.bansos}%
            </span>
          </div>
        </div>
      </div>

      {/* 4 EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pagu & Realisasi KPPN */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Realisasi KPPN</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight">{summary.persenTotal}%</span>
            <span className="text-xs text-slate-500">dari Total Pagu</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Realisasi:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiahCompact(summary.totalRealisasi)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pagu Total:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{formatRupiahCompact(summary.totalPagu)}</span>
            </div>
          </div>
        </div>

        {/* Satker Sesuai Semua Target */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/80 border-emerald-900/40' : 'bg-white border-emerald-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span>Sesuai Aturan Target</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {summary.satkerSesuaiCount}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ({summary.persenSesuai}%)
            </span>
            <span className="text-xs text-slate-500">Satker</span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Seluruh jenis belanja yang dialokasikan telah memenuhi target {selectedTw}.
          </p>
        </div>

        {/* Satker Belum Sesuai (Perlu Perhatian) */}
        <div 
          onClick={() => {
            setStatusFilter('BELUM_SESUAI');
            setCurrentPage(1);
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
            isDark ? 'bg-slate-900/80 border-rose-900/50 hover:border-rose-700' : 'bg-rose-50/40 border-rose-200 hover:border-rose-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-semibold">
            <span>Belum Sesuai (Perlu Perhatian)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
              {summary.satkerBelumSesuaiCount}
            </span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              ({summary.persenBelumSesuai}%)
            </span>
            <span className="text-xs text-slate-500">Satker</span>
          </div>
          <p className="mt-3 text-xs text-rose-600/80 dark:text-rose-400/80 font-medium flex items-center gap-1">
            Klik untuk menyaring satker tertinggal
            <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </div>

        {/* Total Kekurangan Realisasi KPPN */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/80 border-amber-900/40' : 'bg-amber-50/40 border-amber-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-semibold">
            <span>Kekurangan Realisasi Target</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-black tracking-tight text-amber-700 dark:text-amber-400">
              {formatRupiahCompact(summary.totalKekuranganKppn)}
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Estimasi akumulasi anggaran yang perlu segera diserap untuk mencapai target {selectedTw}.
          </p>
        </div>
      </div>

      {/* 4 PILLARS PER JENIS BELANJA CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[summary.pegawai, summary.barang, summary.modal, summary.bansos].map((pillar) => {
          const isCompliant = pillar.statusKppn === 'MEMENUHI';
          const gap = Math.round((pillar.persen - pillar.targetPersen) * 100) / 100;
          return (
            <div
              key={pillar.label}
              className={`p-4.5 rounded-2xl border transition-all ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{pillar.label}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isCompliant
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {isCompliant ? 'Memenuhi' : 'Di Bawah Target'}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black tracking-tight">{pillar.persen}%</span>
                  <span className="text-xs text-slate-500 ml-1.5">/ Target {pillar.targetPersen}%</span>
                </div>
                <span className={`text-xs font-bold ${gap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {gap >= 0 ? `+${gap}%` : `${gap}%`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompliant ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, pillar.persen)}%` }}
                />
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Realisasi / Pagu:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatRupiahCompact(pillar.realisasi)} / {formatRupiahCompact(pillar.pagu)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kepatuhan Satker:</span>
                  <span className="font-medium">
                    <span className="text-emerald-600 font-bold">{pillar.satkerMemenuhiCount} Memenuhi</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-rose-600 font-bold">{pillar.satkerBelumMemenuhiCount} Belum</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PRO VIEW MODE SWITCHER TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="inline-flex p-1 rounded-2xl border bg-slate-100/80 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm max-w-full overflow-x-auto">
          <button
            onClick={() => setViewMode('TABEL')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              viewMode === 'TABEL'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-500" />
            Tabel Satker
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {filteredSatkers.length}
            </span>
          </button>

          <button
            onClick={() => setViewMode('GROUP_KL')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              viewMode === 'GROUP_KL'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-sky-500" />
            Pengelompokan K/L
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {groupedKLList.length} K/L
            </span>
          </button>

          <button
            onClick={() => setViewMode('GROUP_CLUSTER')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              viewMode === 'GROUP_CLUSTER'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            Klaster Pagu
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              4 Klaster
            </span>
          </button>

          <button
            onClick={() => setViewMode('LEADERBOARD')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              viewMode === 'LEADERBOARD'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
            Analitik & Peringkat
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Top & Gap
            </span>
          </button>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetAllFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 transition-colors border border-rose-200 dark:border-rose-900/50 w-fit"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filter ({filteredSatkers.length} Satker)
          </button>
        )}
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode satker atau nama satker..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border outline-none transition-all ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
              }`}
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

          {/* Quick Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Semua ({evaluatedList.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('BELUM_SESUAI');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'BELUM_SESUAI'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Belum Sesuai ({summary.satkerBelumSesuaiCount})
            </button>
            <button
              onClick={() => {
                setStatusFilter('SESUAI');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'SESUAI'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Sesuai Aturan ({summary.satkerSesuaiCount})
            </button>
          </div>
        </div>

        {/* SECONDARY FILTER ROW (PRO FILTERS) */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2.5 text-xs">
          {/* Klaster Pagu */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Klaster Pagu:</span>
            <select
              value={paguClusterFilter}
              onChange={(e) => {
                setPaguClusterFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium outline-none ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">Semua Klaster (Jumbo s.d Kecil)</option>
              <option value="JUMBO">Klaster Jumbo (≥ Rp 50 Miliar)</option>
              <option value="BESAR">Klaster Besar (Rp 10M - Rp 50M)</option>
              <option value="SEDANG">Klaster Sedang (Rp 2M - Rp 10M)</option>
              <option value="KECIL">Klaster Kecil (&lt; Rp 2 Miliar)</option>
            </select>
          </div>

          {/* Kondisi Khusus / Analisis Pro */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Kondisi Spesifik:</span>
            <select
              value={conditionFilter}
              onChange={(e) => {
                setConditionFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold outline-none ${
                conditionFilter === 'PRIORITAS_1'
                  ? 'bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200 font-bold'
                  : isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">Semua Kondisi Analisis</option>
              <option value="PRIORITAS_1">🚨 Prioritas 1: Kritis (Pagu Jumbo/Besar Belum Sesuai)</option>
              <option value="MODAL_TERTINGGAL">⚠️ Belanja Modal Belum Memenuhi Target</option>
              <option value="ZERO_REAL">⚠️ Serapan 0% Terdeteksi (Zero Realization)</option>
              <option value="GAP_KRITIS">📉 Gap Negatif Kritis (&gt; 20% di bawah target)</option>
              <option value="PUNYA_MODAL">🏢 Satker dengan Pagu Belanja Modal</option>
              <option value="PUNYA_BANSOS">🤝 Satker dengan Pagu Belanja Bansos</option>
            </select>
          </div>

          {/* Jenis Belanja Tertinggal */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Belanja Tertinggal:</span>
            <select
              value={belanjaFilter}
              onChange={(e) => {
                setBelanjaFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium outline-none ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">Semua Jenis Belanja</option>
              <option value="pegawai">Belanja Pegawai Belum Sesuai</option>
              <option value="barang">Belanja Barang Belum Sesuai</option>
              <option value="modal">Belanja Modal Belum Sesuai</option>
              <option value="bansos">Belanja Bansos Belum Sesuai</option>
            </select>
          </div>

          {/* K/L Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">K/L:</span>
            <select
              value={klFilter}
              onChange={(e) => {
                setKlFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium outline-none max-w-[200px] truncate ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">Semua Kementerian / Lembaga</option>
              {uniqueKLs.map(kl => (
                <option key={kl} value={kl}>{kl}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-500 font-medium">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium outline-none ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="KEKURANGAN_DESC">Kekurangan Realisasi Terbesar</option>
              <option value="PERSEN_ASC">Persentase Realisasi Terendah</option>
              <option value="PERSEN_DESC">Persentase Realisasi Tertinggi</option>
              <option value="PAGU_DESC">Pagu Anggaran Terbesar</option>
              <option value="KODE_ASC">Kode Satker (0-9)</option>
            </select>
          </div>
        </div>
      </div>

      {/* DYNAMIC VIEW CONTAINER */}
      {viewMode === 'GROUP_KL' ? (
        <RealisasiKLView
          groupedKLList={groupedKLList}
          onSelectSatker={setSelectedSatkerForDetail}
          isDark={isDark}
        />
      ) : viewMode === 'GROUP_CLUSTER' ? (
        <RealisasiClusterView
          groupedClusterList={groupedClusterList}
          onSelectSatker={setSelectedSatkerForDetail}
          isDark={isDark}
        />
      ) : viewMode === 'LEADERBOARD' ? (
        <RealisasiLeaderboardView
          evaluatedList={evaluatedList}
          summary={summary}
          onSelectSatker={setSelectedSatkerForDetail}
          isDark={isDark}
        />
      ) : (
        /* STANDARD TABLE VIEW */
        <div className={`rounded-2xl border overflow-hidden shadow-sm transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'bg-slate-850/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Satker / K/L</th>
                  <th className="py-3 px-4 text-right">Pagu & Realisasi Total</th>
                  <th className="py-3 px-3 text-center">
                    B. Pegawai
                    <span className="block text-[9px] text-slate-400 normal-case font-normal">(Target {activeRule.pegawai}%)</span>
                  </th>
                  <th className="py-3 px-3 text-center">
                    B. Barang
                    <span className="block text-[9px] text-slate-400 normal-case font-normal">(Target {activeRule.barang}%)</span>
                  </th>
                  <th className="py-3 px-3 text-center">
                    B. Modal
                    <span className="block text-[9px] text-slate-400 normal-case font-normal">(Target {activeRule.modal}%)</span>
                  </th>
                  <th className="py-3 px-3 text-center">
                    B. Bansos
                    <span className="block text-[9px] text-slate-400 normal-case font-normal">(Target {activeRule.bansos}%)</span>
                  </th>
                  <th className="py-3 px-4 text-center">Status Kepatuhan</th>
                  <th className="py-3 px-4 text-right">Kekurangan Realisasi</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {paginatedSatkers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Tidak ada data satker yang sesuai dengan kriteria filter pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedSatkers.map((s, idx) => {
                    const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                    const isCompliant = s.overallStatus === 'SESUAI';

                    return (
                      <tr 
                        key={s.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${
                          !isCompliant && s.totalKekuranganNominal > 0 ? 'bg-rose-50/10' : ''
                        }`}
                      >
                        {/* No */}
                        <td className="py-3 px-4 text-center text-slate-400 font-medium">
                          {globalIdx}
                        </td>

                        {/* Satker & KL */}
                        <td className="py-3 px-4 max-w-[260px]">
                          <div className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                            {s.namaSatker}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                              {s.kodeSatker}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              s.paguCluster === 'JUMBO'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : s.paguCluster === 'BESAR'
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                  : s.paguCluster === 'SEDANG'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {s.clusterLabel}
                            </span>
                            {s.priorityRisk === 'PRIORITAS_1_KRITIS' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300/60">
                                <ShieldAlert className="w-3 h-3 text-rose-600" />
                                Prioritas 1
                              </span>
                            )}
                            {s.hasZeroRealization && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Serapan 0%
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {s.kementerianLembaga}
                          </div>
                        </td>

                        {/* Pagu & Realisasi Total */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100">
                            {s.totalPersen}%
                          </div>
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {formatRupiahCompact(s.totalRealisasi)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Pagu: {formatRupiahCompact(s.totalPagu)}
                          </div>
                        </td>

                        {/* B. Pegawai */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <PillarPill detail={s.pegawai} />
                        </td>

                        {/* B. Barang */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <PillarPill detail={s.barang} />
                        </td>

                        {/* B. Modal */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <PillarPill detail={s.modal} />
                        </td>

                        {/* B. Bansos */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <PillarPill detail={s.bansos} />
                        </td>

                        {/* Overall Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isCompliant ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Sesuai Target
                            </span>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300/40">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Belum Sesuai
                              </span>
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                                {s.belumMemenuhiList.length} jenis belanja
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Kekurangan Realisasi (Nominal) */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {s.totalKekuranganNominal > 0 ? (
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              {formatRupiah(s.totalKekuranganNominal)}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold text-[11px]">
                              Tercapai
                            </span>
                          )}
                        </td>

                        {/* Aksi Button */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedSatkerForDetail(s)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <PaginationControl
              currentPage={currentPage}
              totalItems={filteredSatkers.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 15, 25, 50, 100]}
              itemLabel="Satker"
              isDark={isDark}
            />
          </div>
        </div>
      )}

      {/* DETAIL MODAL SATKER */}
      {selectedSatkerForDetail && (
        <SatkerDetailModal
          satker={selectedSatkerForDetail}
          triwulan={selectedTw}
          onClose={() => setSelectedSatkerForDetail(null)}
          isDark={isDark}
        />
      )}

      {/* BRIEFING & MEMO EKSEKUTIF MODAL */}
      {showBriefingModal && (
        <RealisasiBriefingModal
          evaluatedList={evaluatedList}
          summary={summary}
          triwulan={selectedTw}
          posisiWaktu={waktuTarikan}
          onFilterPrioritas1={() => {
            setConditionFilter('PRIORITAS_1');
            setViewMode('TABEL');
            setCurrentPage(1);
          }}
          onClose={() => setShowBriefingModal(false)}
          isDark={isDark}
        />
      )}

      {/* RULE MODAL TABLE (SESUAI ATURAN GAMBAR RESMI) */}
      {showRuleModal && (
        <RuleModal
          onClose={() => setShowRuleModal(false)}
          isDark={isDark}
        />
      )}

      {/* ADMIN SETTINGS MODAL */}
      {showSettingsModal && (
        <SettingsModal
          config={config}
          onUpdateConfig={onUpdateConfig}
          onUploadExcel={onUploadExcel}
          onResetDefaultData={onResetDefaultData}
          onClose={() => setShowSettingsModal(false)}
          isDark={isDark}
        />
      )}
    </div>
  );
};

// =============================================================
// SUB-COMPONENT: PILLAR PILL
// =============================================================
function PillarPill({ detail }: { detail: any }) {
  if (!detail.hasPagu) {
    return <span className="text-slate-400 text-[11px]">-</span>;
  }

  const isMemenuhi = detail.status === 'MEMENUHI';
  return (
    <div className="inline-flex flex-col items-center">
      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
        isMemenuhi
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
      }`}>
        {detail.persen}%
      </span>
      <span className={`text-[9px] font-semibold mt-0.5 ${
        isMemenuhi ? 'text-emerald-600' : 'text-rose-600'
      }`}>
        {detail.gapPersen >= 0 ? `+${detail.gapPersen}%` : `${detail.gapPersen}%`}
      </span>
    </div>
  );
}

// =============================================================
// SUB-COMPONENT: MODAL DETAIL SATKER
// =============================================================
interface SatkerDetailModalProps {
  satker: EvaluatedSatkerRealisasi;
  triwulan: TriwulanKey;
  onClose: () => void;
  isDark?: boolean;
}

function SatkerDetailModal({ satker, triwulan, onClose, isDark }: SatkerDetailModalProps) {
  const isCompliant = satker.overallStatus === 'SESUAI';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-3xl rounded-2xl shadow-2xl border overflow-hidden max-h-[90vh] flex flex-col ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-300/40">
                {satker.kodeSatker}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {satker.kementerianLembaga}
              </span>
            </div>
            <h2 className="text-lg font-black mt-1 leading-snug">
              {satker.namaSatker}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isCompliant 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {isCompliant ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {isCompliant ? `Sesuai Target ${triwulan}` : `Belum Memenuhi Target ${triwulan}`}
              </span>
              <span className="text-xs text-slate-500">
                Realisasi Total: <strong>{satker.totalPersen}%</strong> ({formatRupiah(satker.totalRealisasi)})
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Table Breakdown */}
          <div>
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              Rincian Per Jenis Belanja vs Target {triwulan}
            </h3>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? 'bg-slate-850 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    <th className="py-2.5 px-3">Jenis Belanja</th>
                    <th className="py-2.5 px-3 text-right">Pagu</th>
                    <th className="py-2.5 px-3 text-right">Realisasi</th>
                    <th className="py-2.5 px-3 text-right">Sisa Pagu</th>
                    <th className="py-2.5 px-2 text-center">Realisasi %</th>
                    <th className="py-2.5 px-2 text-center">Target %</th>
                    <th className="py-2.5 px-2 text-center">Gap %</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Kekurangan (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[satker.pegawai, satker.barang, satker.modal, satker.bansos].map(detail => {
                    if (!detail.hasPagu) {
                      return (
                        <tr key={detail.label} className="text-slate-400">
                          <td className="py-2.5 px-3 font-semibold">{detail.label}</td>
                          <td colSpan={7} className="py-2.5 px-3 text-center italic">Tidak ada alokasi pagu</td>
                          <td className="py-2.5 px-3 text-right">-</td>
                        </tr>
                      );
                    }

                    const isPass = detail.status === 'MEMENUHI';
                    return (
                      <tr key={detail.label} className={!isPass ? 'bg-rose-50/20' : ''}>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                          {detail.label}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatRupiahCompact(detail.pagu)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">{formatRupiahCompact(detail.realisasi)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatRupiahCompact(detail.sisaPagu)}</td>
                        <td className="py-2.5 px-2 text-center font-bold">{detail.persen}%</td>
                        <td className="py-2.5 px-2 text-center text-slate-500 font-semibold">{detail.targetPersen}%</td>
                        <td className={`py-2.5 px-2 text-center font-bold ${detail.gapPersen >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {detail.gapPersen >= 0 ? `+${detail.gapPersen}%` : `${detail.gapPersen}%`}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPass
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {isPass ? 'Memenuhi' : 'Belum'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                          {detail.kekuranganNominal > 0 ? formatRupiah(detail.kekuranganNominal) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rekomendasi Aksi */}
          {satker.belumMemenuhiList.length > 0 ? (
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-rose-950/20 border-rose-900/60' : 'bg-rose-50/60 border-rose-200'
            }`}>
              <h4 className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 text-xs mb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Rekomendasi Langkah Percepatan Penyerapan Anggaran:
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                {satker.belumMemenuhiList.some(b => b.jenis === 'Belanja Modal') && (
                  <li>
                    <strong>Belanja Modal:</strong> Lakukan percepatan penyelesaian pekerjaan fisik/kontrak pihak ketiga, percepat verifikasi BAST, dan segera ajukan SPM-LS Kontraktual ke KPPN Semarang I sebelum batas akhir triwulan.
                  </li>
                )}
                {satker.belumMemenuhiList.some(b => b.jenis === 'Belanja Barang') && (
                  <li>
                    <strong>Belanja Barang:</strong> Segera ajukan tagihan pembayaran kegiatan operasional/perjalanan dinas/honorarium yang telah selesai dilaksanakan, serta percepat revolving Uang Persediaan (GUP/TUP).
                  </li>
                )}
                {satker.belumMemenuhiList.some(b => b.jenis === 'Belanja Pegawai') && (
                  <li>
                    <strong>Belanja Pegawai:</strong> Pastikan pengajuan SPM Gaji Induk, Gaji Susulan, Uang Makan, dan Lembur diajukan tepat waktu sesuai jadwal pembayaran.
                  </li>
                )}
                {satker.belumMemenuhiList.some(b => b.jenis === 'Belanja Bansos') && (
                  <li>
                    <strong>Belanja Bansos:</strong> Koordinasikan kelengkapan data penerima bantuan dan percepat tahapan penyaluran bantuan sosial.
                  </li>
                )}
                <li>
                  Total kekurangan penyerapan anggaran yang harus dikejar satker ini adalah <strong>{formatRupiah(satker.totalKekuranganNominal)}</strong>.
                </li>
              </ul>
            </div>
          ) : (
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-emerald-950/20 border-emerald-900/60' : 'bg-emerald-50/60 border-emerald-200'
            }`}>
              <h4 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Performa Optimal: Satker telah memenuhi seluruh target triwulanan yang ditetapkan!
              </h4>
              <p className="mt-1 text-slate-600 dark:text-slate-400 text-[11px]">
                Pertahankan ritme penyerapan anggaran sesuai rencana penarikan dana (RPD Halaman III DIPA) untuk menyongsong triwulan berikutnya.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// SUB-COMPONENT: RULE MODAL (ATURAN RESMI GAMBAR USER)
// =============================================================
function RuleModal({ onClose, isDark }: { onClose: () => void; isDark?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="font-extrabold text-base">Aturan Target Triwulanan Realisasi Belanja</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Pedoman persentase target penyerapan anggaran per jenis belanja sesuai ketentuan Direktorat Jenderal Perbendaharaan (DJPb):
          </p>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className={`border-b font-bold ${
                  isDark ? 'bg-slate-850 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="py-3 px-4 text-left">Jenis Belanja</th>
                  <th className="py-3 px-3">Tw I</th>
                  <th className="py-3 px-3">Tw II</th>
                  <th className="py-3 px-3">Tw III</th>
                  <th className="py-3 px-3">Tw IV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-2.5 px-4 text-left font-bold">B. Pegawai</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-600">20%</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-600">50%</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-600">75%</td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-600">95%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-left font-bold">B. Barang</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-600">15%</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-600">50%</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-600">70%</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-600">90%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-left font-bold">B. Modal</td>
                  <td className="py-2.5 px-3 font-semibold text-amber-600">10%</td>
                  <td className="py-2.5 px-3 font-semibold text-amber-600">40%</td>
                  <td className="py-2.5 px-3 font-semibold text-amber-600">70%</td>
                  <td className="py-2.5 px-3 font-semibold text-amber-600">90%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-left font-bold">B. Bansos</td>
                  <td className="py-2.5 px-3 font-semibold text-purple-600">25%</td>
                  <td className="py-2.5 px-3 font-semibold text-purple-600">50%</td>
                  <td className="py-2.5 px-3 font-semibold text-purple-600">75%</td>
                  <td className="py-2.5 px-3 font-semibold text-purple-600">95%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-500 space-y-1">
            <p><strong>Ketentuan Evaluasi:</strong></p>
            <p>• Satker dievaluasi pada jenis belanja yang dialokasikan (pagu &gt; 0).</p>
            <p>• Satker dinyatakan <strong>Sesuai Target</strong> apabila seluruh jenis belanja berpagu mencapai atau melampaui target persentase triwulan berkenaan.</p>
            <p>• Satker dinyatakan <strong>Belum Sesuai</strong> apabila ada satu atau lebih jenis belanja yang realisasinya masih di bawah target.</p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// SUB-COMPONENT: SETTINGS MODAL (PENGATURAN TARIKAN DATA ADMIN)
// =============================================================
interface SettingsModalProps {
  config?: RealisasiAnggaranConfig;
  onUpdateConfig?: (newConfig: RealisasiAnggaranConfig) => void;
  onUploadExcel?: (file: File) => void;
  onResetDefaultData?: () => void;
  onClose: () => void;
  isDark?: boolean;
}

function SettingsModal({
  config,
  onUpdateConfig,
  onUploadExcel,
  onResetDefaultData,
  onClose,
  isDark
}: SettingsModalProps) {
  const [waktuTarikan, setWaktuTarikan] = useState(config?.waktuUnduh || '24/10/2024 10:28:44');
  const [periodeLabel, setPeriodeLabel] = useState(config?.periodeLabel || 'Data Realisasi Belanja My InTress');
  const [activeTw, setActiveTw] = useState<TriwulanKey>(config?.activeTriwulan || 'Tw III');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (onUpdateConfig) {
      onUpdateConfig({
        ...config,
        waktuUnduh: waktuTarikan.trim() || '24/10/2024 10:28:44',
        periodeLabel: periodeLabel.trim(),
        activeTriwulan: activeTw
      });
    }
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadExcel) {
      onUploadExcel(file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-500" />
            <h3 className="font-extrabold text-base">Pengaturan Tarikan Data My InTress</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Tarikan Data per Kapan */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Waktu & Tanggal Tarikan Data (Posisi Data):
            </label>
            <input
              type="text"
              value={waktuTarikan}
              onChange={(e) => setWaktuTarikan(e.target.value)}
              placeholder="Contoh: 24/10/2024 10:28:44 atau 31 Oktober 2024"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Keterangan ini akan ditampilkan pada label &apos;Posisi Tarikan Data&apos; di dashboard Satker.
            </p>
          </div>

          {/* Label Periode */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Label / Judul Laporan:
            </label>
            <input
              type="text"
              value={periodeLabel}
              onChange={(e) => setPeriodeLabel(e.target.value)}
              placeholder="Contoh: Data Realisasi Belanja My InTress"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {/* Default Active Triwulan */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Triwulan Aktif Standar:
            </label>
            <select
              value={activeTw}
              onChange={(e) => setActiveTw(e.target.value as any)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="Tw I">Triwulan I (Pegawai 20%, Barang 15%, Modal 10%, Bansos 25%)</option>
              <option value="Tw II">Triwulan II (Pegawai 50%, Barang 50%, Modal 40%, Bansos 50%)</option>
              <option value="Tw III">Triwulan III (Pegawai 75%, Barang 70%, Modal 70%, Bansos 75%)</option>
              <option value="Tw IV">Triwulan IV (Pegawai 95%, Barang 90%, Modal 90%, Bansos 95%)</option>
            </select>
          </div>

          {/* Excel File Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Perbarui Data My InTress dari Excel:
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Excel My InTress Baru
              </button>

              {onResetDefaultData && (
                <button
                  onClick={() => {
                    onResetDefaultData();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Pulihkan 127 Satker Standar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
          >
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
}
