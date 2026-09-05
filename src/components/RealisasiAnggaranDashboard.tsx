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
  Calculator,
  Lock
} from 'lucide-react';
import { 
  MyIntressRecord, 
  TriwulanKey, 
  TargetTriwulanRule, 
  RealisasiAnggaranConfig, 
  DashboardConfig, 
  DashboardCustomTexts,
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
import { RealisasiDefisitMatrixView } from './RealisasiDefisitMatrixView';
import { RealisasiSatkerPublicDashboard } from './RealisasiSatkerPublicDashboard';
import { RealisasiPilarAnalyticsView } from './RealisasiPilarAnalyticsView';
import { AdminLoginModal } from './AdminLoginModal';
import * as XLSX from 'xlsx';

interface RealisasiAnggaranDashboardProps {
  records: MyIntressRecord[];
  config?: RealisasiAnggaranConfig;
  dashboardConfig?: DashboardConfig;
  customTexts?: DashboardCustomTexts;
  updateDate?: string;
  onUpdateConfig?: (newConfig: RealisasiAnggaranConfig) => void;
  onUploadExcel?: (file: File) => void;
  onResetDefaultData?: () => void;
  isAdminAuthenticated?: boolean;
  onAuthenticateAdmin?: (pin: string) => boolean;
  onLogoutAdmin?: () => void;
  onOpenAdminAuth?: () => void;
  theme?: AppTheme;
  isDark?: boolean;
}

export const RealisasiAnggaranDashboard: React.FC<RealisasiAnggaranDashboardProps> = ({
  records = [],
  config,
  dashboardConfig,
  customTexts,
  updateDate,
  onUpdateConfig,
  onUploadExcel,
  onResetDefaultData,
  isAdminAuthenticated = false,
  onAuthenticateAdmin,
  onLogoutAdmin,
  onOpenAdminAuth,
  theme = 'light',
  isDark = false
}) => {
  // Selected Triwulan for evaluation (defaults to config's activeTriwulan or 'Tw III')
  const [selectedTw, setSelectedTw] = useState<TriwulanKey>(
    config?.activeTriwulan || 'Tw III'
  );

  // Portal View Role Switcher: 'INTERNAL_KPPN' (Admin/Pejabat) vs 'SATKER_PUBLIC' (Khusus Satker / Non-Nominal)
  // STRICT USER INTENT: Di dashboard biasa HANYA ada tampilan SATKER_PUBLIC.
  // INTERNAL_KPPN HANYA ada atau bisa dibuka oleh Admin KPPN!
  const [portalRole, setPortalRole] = useState<'INTERNAL_KPPN' | 'SATKER_PUBLIC'>(() => {
    return isAdminAuthenticated ? 'INTERNAL_KPPN' : 'SATKER_PUBLIC';
  });

  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);

  // Sinkronisasi status autentikasi admin: jika bukan admin, selalu kunci ke SATKER_PUBLIC
  React.useEffect(() => {
    if (isAdminAuthenticated) {
      setPortalRole('INTERNAL_KPPN');
    } else {
      setPortalRole('SATKER_PUBLIC');
    }
  }, [isAdminAuthenticated]);

  // Pro View Mode: 'TABEL' | 'MATRIX_DEFISIT' | 'PILAR_ANALYSIS' | 'GROUP_KL' | 'GROUP_CLUSTER' | 'LEADERBOARD'
  const [viewMode, setViewMode] = useState<'TABEL' | 'MATRIX_DEFISIT' | 'PILAR_ANALYSIS' | 'GROUP_KL' | 'GROUP_CLUSTER' | 'LEADERBOARD'>('TABEL');

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BELUM_SESUAI' | 'SESUAI'>('ALL');
  const [paguClusterFilter, setPaguClusterFilter] = useState<PaguClusterType>('ALL');
  const [conditionFilter, setConditionFilter] = useState<'ALL' | 'PRIORITAS_1' | 'MODAL_TERTINGGAL' | 'ZERO_REAL' | 'GAP_KRITIS' | 'PUNYA_MODAL' | 'PUNYA_BANSOS'>('ALL');
  const [belanjaFilter, setBelanjaFilter] = useState<
    | 'ALL' 
    | 'pegawai' 
    | 'barang' 
    | 'modal' 
    | 'bansos' 
    | '51_KURANG' 
    | '51_BERLEBIH' 
    | '52_KURANG' 
    | '52_BERLEBIH' 
    | '53_KURANG' 
    | '53_BERLEBIH' 
    | '57_KURANG' 
    | '57_BERLEBIH'
  >('ALL');
  const [klFilter, setKlFilter] = useState<string>('ALL');
  const [deficitScaleFilter, setDeficitScaleFilter] = useState<'ALL' | 'JUMBO' | 'BESAR' | 'SEDANG' | 'QUICK_WIN' | 'SURPLUS'>('ALL');
  const [gapRangeFilter, setGapRangeFilter] = useState<'ALL' | 'GAP_EXTREME' | 'GAP_MODERATE' | 'GAP_SLIGHT' | 'GAP_SURPLUS'>('ALL');
  const [sortBy, setSortBy] = useState<'PERSEN_ASC' | 'PERSEN_DESC' | 'KEKURANGAN_DESC' | 'KEKURANGAN_ASC' | 'TARGET_DESC' | 'GAP_ASC' | 'PAGU_DESC' | 'KODE_ASC'>('KEKURANGAN_DESC');
  const [tableDisplayMode, setTableDisplayMode] = useState<'STANDAR' | 'TARGET_LANGSUNG'>('TARGET_LANGSUNG');
  const [quickLookupSatkerId, setQuickLookupSatkerId] = useState<string>('');
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modals
  const [selectedSatkerForDetail, setSelectedSatkerForDetail] = useState<EvaluatedSatkerRealisasi | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [selectedSatkerForCalculator, setSelectedSatkerForCalculator] = useState<string | null>(null);

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

      // Jenis belanja tertinggal & berlebih filter (51, 52, 53, 57)
      if ((belanjaFilter === 'pegawai' || belanjaFilter === '51_KURANG') && s.pegawai.status !== 'BELUM_MEMENUHI') return false;
      if (belanjaFilter === '51_BERLEBIH' && (!s.pegawai.hasPagu || s.pegawai.status !== 'MEMENUHI')) return false;

      if ((belanjaFilter === 'barang' || belanjaFilter === '52_KURANG') && s.barang.status !== 'BELUM_MEMENUHI') return false;
      if (belanjaFilter === '52_BERLEBIH' && (!s.barang.hasPagu || s.barang.status !== 'MEMENUHI')) return false;

      if ((belanjaFilter === 'modal' || belanjaFilter === '53_KURANG') && s.modal.status !== 'BELUM_MEMENUHI') return false;
      if (belanjaFilter === '53_BERLEBIH' && (!s.modal.hasPagu || s.modal.status !== 'MEMENUHI')) return false;

      if ((belanjaFilter === 'bansos' || belanjaFilter === '57_KURANG') && s.bansos.status !== 'BELUM_MEMENUHI') return false;
      if (belanjaFilter === '57_BERLEBIH' && (!s.bansos.hasPagu || s.bansos.status !== 'MEMENUHI')) return false;

      // KL Filter
      if (klFilter !== 'ALL' && s.kementerianLembaga !== klFilter) return false;

      // Defisit Scale Filter (Skala Kebutuhan / Kurang Nominal Target)
      if (deficitScaleFilter === 'JUMBO' && s.totalKekuranganNominal < 1_000_000_000) return false;
      if (deficitScaleFilter === 'BESAR' && (s.totalKekuranganNominal < 250_000_000 || s.totalKekuranganNominal >= 1_000_000_000)) return false;
      if (deficitScaleFilter === 'SEDANG' && (s.totalKekuranganNominal < 50_000_000 || s.totalKekuranganNominal >= 250_000_000)) return false;
      if (deficitScaleFilter === 'QUICK_WIN' && (s.totalKekuranganNominal <= 0 || (s.totalKekuranganNominal >= 50_000_000 && Math.abs(s.gapPersenLangsung) >= 5))) return false;
      if (deficitScaleFilter === 'SURPLUS' && s.totalKekuranganNominal > 0) return false;

      // Rentang Gap Persen Langsung Filter
      if (gapRangeFilter === 'GAP_EXTREME' && s.gapPersenLangsung > -20) return false;
      if (gapRangeFilter === 'GAP_MODERATE' && (s.gapPersenLangsung <= -20 || s.gapPersenLangsung > -10)) return false;
      if (gapRangeFilter === 'GAP_SLIGHT' && (s.gapPersenLangsung <= -10 || s.gapPersenLangsung >= 0)) return false;
      if (gapRangeFilter === 'GAP_SURPLUS' && s.gapPersenLangsung < 0) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'PERSEN_ASC') return a.totalPersen - b.totalPersen;
      if (sortBy === 'PERSEN_DESC') return b.totalPersen - a.totalPersen;
      if (sortBy === 'KEKURANGAN_DESC') return b.totalKekuranganNominal - a.totalKekuranganNominal;
      if (sortBy === 'KEKURANGAN_ASC') return a.totalKekuranganNominal - b.totalKekuranganNominal;
      if (sortBy === 'TARGET_DESC') return b.targetPersenLangsung - a.targetPersenLangsung;
      if (sortBy === 'GAP_ASC') return a.gapPersenLangsung - b.gapPersenLangsung;
      if (sortBy === 'PAGU_DESC') return b.totalPagu - a.totalPagu;
      if (sortBy === 'KODE_ASC') return a.kodeSatker.localeCompare(b.kodeSatker);
      return 0;
    });
  }, [evaluatedList, searchQuery, statusFilter, paguClusterFilter, conditionFilter, belanjaFilter, klFilter, deficitScaleFilter, gapRangeFilter, sortBy]);

  // Grouped by K/L
  const groupedKLList = useMemo<GroupedKLSummary[]>(() => {
    return groupSatkersByKL(filteredSatkers);
  }, [filteredSatkers]);

  // Grouped by Pagu Cluster
  const groupedClusterList = useMemo<GroupedClusterSummary[]>(() => {
    return groupSatkersByCluster(filteredSatkers);
  }, [filteredSatkers]);

  // Top 3 Satkers with largest nominal deficit
  const topDeficitSatkers = useMemo(() => {
    return [...evaluatedList]
      .filter(s => s.totalKekuranganNominal > 0)
      .sort((a, b) => b.totalKekuranganNominal - a.totalKekuranganNominal)
      .slice(0, 4);
  }, [evaluatedList]);

  // Top 3 Quick Wins satkers (deficit > 0 but < 50 million or gap < 5%)
  const topQuickWinSatkers = useMemo(() => {
    return [...evaluatedList]
      .filter(s => s.totalKekuranganNominal > 0 && (s.totalKekuranganNominal < 50_000_000 || Math.abs(s.gapPersenLangsung) < 5))
      .sort((a, b) => a.totalKekuranganNominal - b.totalKekuranganNominal)
      .slice(0, 4);
  }, [evaluatedList]);

  // 51, 52, 53, 57 Defisit & Surplus Satker Counts
  const pilarCounts = useMemo(() => {
    let k51 = 0, b51 = 0;
    let k52 = 0, b52 = 0;
    let k53 = 0, b53 = 0;
    let k57 = 0, b57 = 0;

    evaluatedList.forEach(s => {
      if (s.pegawai.hasPagu) {
        if (s.pegawai.status === 'BELUM_MEMENUHI') k51++;
        else if (s.pegawai.status === 'MEMENUHI') b51++;
      }
      if (s.barang.hasPagu) {
        if (s.barang.status === 'BELUM_MEMENUHI') k52++;
        else if (s.barang.status === 'MEMENUHI') b52++;
      }
      if (s.modal.hasPagu) {
        if (s.modal.status === 'BELUM_MEMENUHI') k53++;
        else if (s.modal.status === 'MEMENUHI') b53++;
      }
      if (s.bansos.hasPagu) {
        if (s.bansos.status === 'BELUM_MEMENUHI') k57++;
        else if (s.bansos.status === 'MEMENUHI') b57++;
      }
    });

    return {
      k51, b51,
      k52, b52,
      k53, b53,
      k57, b57
    };
  }, [evaluatedList]);

  // Quick lookup satker
  const quickLookupSatker = useMemo(() => {
    if (!quickLookupSatkerId) return null;
    return evaluatedList.find(s => s.id === quickLookupSatkerId || s.kodeSatker === quickLookupSatkerId) || null;
  }, [evaluatedList, quickLookupSatkerId]);

  // Copy WA notification for individual satker row
  const handleCopyWaRow = (satker: EvaluatedSatkerRealisasi, e: React.MouseEvent) => {
    e.stopPropagation();
    let text = `*PEMBERITAHUAN KEBUTUHAN TARGET ANGGARAN ${selectedTw.toUpperCase()}*\n`;
    text += `Satker: *${satker.namaSatker}* (${satker.kodeSatker})\n`;
    text += `Target Komposit Satker : *${satker.targetPersenLangsung}%* (${formatRupiahCompact(satker.targetNominalTotal)})\n`;
    text += `Realisasi Saat Ini      : *${satker.totalPersen}%* (${formatRupiahCompact(satker.totalRealisasi)})\n`;

    if (satker.totalKekuranganNominal > 0) {
      text += `🚨 *KEKURANGAN TARGET : ${formatRupiah(satker.totalKekuranganNominal)} (Gap: ${satker.gapPersenLangsung}%)*\n\n`;
      text += `Rincian Belanja:\n`;
      if (satker.pegawai.hasPagu) text += `• B. Pegawai : ${satker.pegawai.persen}% (Target ${satker.pegawai.targetPersen}%) ${satker.pegawai.status === 'MEMENUHI' ? '✅' : `❌ Kurang ${formatRupiah(satker.pegawai.kekuranganNominal)}`}\n`;
      if (satker.barang.hasPagu) text += `• B. Barang  : ${satker.barang.persen}% (Target ${satker.barang.targetPersen}%) ${satker.barang.status === 'MEMENUHI' ? '✅' : `❌ Kurang ${formatRupiah(satker.barang.kekuranganNominal)}`}\n`;
      if (satker.modal.hasPagu) text += `• B. Modal   : ${satker.modal.persen}% (Target ${satker.modal.targetPersen}%) ${satker.modal.status === 'MEMENUHI' ? '✅' : `❌ Kurang ${formatRupiah(satker.modal.kekuranganNominal)}`}\n`;
      if (satker.bansos.hasPagu) text += `• B. Bansos  : ${satker.bansos.persen}% (Target ${satker.bansos.targetPersen}%) ${satker.bansos.status === 'MEMENUHI' ? '✅' : `❌ Kurang ${formatRupiah(satker.bansos.kekuranganNominal)}`}\n`;
      text += `\nMohon segera mengajukan SPM ke KPPN Semarang I sebelum batas akhir triwulan.`;
    } else {
      text += `✅ *STATUS: TELAH MEMENUHI TARGET TRIWULAN ${selectedTw.toUpperCase()}!*\nTerima kasih atas kepatuhan akselerasi penyerapan anggaran.`;
    }

    navigator.clipboard.writeText(text);
    setCopiedRowId(satker.id);
    setTimeout(() => setCopiedRowId(null), 2000);
  };

  // Check if any pro filter is active
  const hasActiveFilters = searchQuery.trim() !== '' || 
    statusFilter !== 'ALL' || 
    paguClusterFilter !== 'ALL' || 
    conditionFilter !== 'ALL' || 
    belanjaFilter !== 'ALL' || 
    klFilter !== 'ALL' ||
    deficitScaleFilter !== 'ALL' ||
    gapRangeFilter !== 'ALL';

  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPaguClusterFilter('ALL');
    setConditionFilter('ALL');
    setBelanjaFilter('ALL');
    setKlFilter('ALL');
    setDeficitScaleFilter('ALL');
    setGapRangeFilter('ALL');
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

  const waktuTarikan = updateDate || config?.waktuUnduh || dashboardConfig?.updateDates?.realisasiAnggaran || '24/10/2024 10:28:44';
  const periodeLabel = config?.periodeLabel || 'Data Realisasi Belanja My InTress';
  const badgeText = customTexts?.realisasiAnggaranBadge || dashboardConfig?.customTexts?.realisasiAnggaranBadge || 'My InTress DJPb';
  const titleText = customTexts?.realisasiAnggaranTitle || dashboardConfig?.customTexts?.realisasiAnggaranTitle || 'Dashboard Realisasi Anggaran & Monitoring Target';
  const subtitleText = customTexts?.realisasiAnggaranSubtitle || dashboardConfig?.customTexts?.realisasiAnggaranSubtitle || 'Monitoring kepatuhan target penyerapan anggaran per jenis belanja (Pegawai, Barang, Modal, dan Bansos) sesuai regulasi target triwulanan DJPb untuk mendeteksi dini satker yang belum memenuhi target.';

  return (
    <div className={`space-y-6 pb-12 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* TOP PORTAL ROLE SWITCHER: KHUSUS TAMPIL JIKA TEROTENTIKASI SEBAGAI ADMIN KPPN */}
      {isAdminAuthenticated && (
        <div className={`p-3.5 sm:p-4 rounded-3xl border transition-all shadow-sm ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800' 
            : 'bg-white border-slate-200/80 shadow-slate-100'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                SESI ADMIN KPPN AKTIF
              </span>
              <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setPortalRole('INTERNAL_KPPN')}
                  className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    portalRole === 'INTERNAL_KPPN'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>🏛️ Internal KPPN (Lengkap & Nominal)</span>
                </button>
                <button
                  onClick={() => setPortalRole('SATKER_PUBLIC')}
                  className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    portalRole === 'SATKER_PUBLIC'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>🏢 Pratinjau Tampilan Satker</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline-block">
                {portalRole === 'INTERNAL_KPPN' 
                  ? 'Akses Internal: Nominal Rupiah, SPM, Matriks Defisit & 4 Pilar Aktif'
                  : 'Mode Pratinjau: Melihat persis apa yang tampil untuk Satker'}
              </span>
              {onLogoutAdmin && (
                <button
                  onClick={onLogoutAdmin}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center gap-1.5"
                  title="Keluar dari sesi Admin KPPN dan kunci dashboard ke mode satker biasa"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kunci / Keluar Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* JIKA BUKAN ADMIN ATAU MEMILIH PREVIEW SATKER -> TAMPILKAN DASHBOARD SATKER */}
      {(!isAdminAuthenticated || portalRole === 'SATKER_PUBLIC') ? (
        <RealisasiSatkerPublicDashboard
          evaluatedList={evaluatedList}
          triwulan={selectedTw}
          activeRule={activeRule}
          updateDate={waktuTarikan}
          isDark={isDark}
          isAdminAuthenticated={isAdminAuthenticated}
          onOpenAdminAuth={() => setShowAdminLoginModal(true)}
          onSwitchToInternal={() => setPortalRole('INTERNAL_KPPN')}
        />
      ) : (
        <>
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
                {badgeText}
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
              {titleText}
            </h1>
            <p className={`text-sm max-w-3xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {subtitleText}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* TOOLS KEBUTUHAN TARGET & KALKULATOR SATKER */}
            <button
              onClick={() => {
                setSelectedSatkerForCalculator(null);
                setShowCalculatorModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm shadow-emerald-600/20"
              title="Hitung satker kurang berapa dari nominal target & target % langsung"
            >
              <Calculator className="w-4 h-4" />
              <span>Tools Kebutuhan Target</span>
            </button>

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
            onClick={() => setViewMode('MATRIX_DEFISIT')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              viewMode === 'MATRIX_DEFISIT'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            Matriks Defisit & Quick Wins
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              {summary.satkerBelumSesuaiCount} Belum
            </span>
          </button>

          <button
            onClick={() => setViewMode('PILAR_ANALYSIS')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              viewMode === 'PILAR_ANALYSIS'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-blue-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
            Analisis 51, 52, 53 & 57 (Kurang vs Berlebih)
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              4 Pilar Belanja
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

          {/* Skala Defisit Nominal */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Skala Defisit:</span>
            <select
              value={deficitScaleFilter}
              onChange={(e) => {
                setDeficitScaleFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold outline-none ${
                deficitScaleFilter !== 'ALL'
                  ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/70 dark:border-rose-800 dark:text-rose-200'
                  : isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">Semua Skala Defisit</option>
              <option value="JUMBO">🔴 Defisit Jumbo (&gt; Rp 1 Miliar)</option>
              <option value="BESAR">🟠 Defisit Besar (Rp 250Jt - 1M)</option>
              <option value="SEDANG">🟡 Defisit Sedang (Rp 50Jt - 250Jt)</option>
              <option value="QUICK_WIN">⚡ Quick Wins (&lt; Rp 50Jt / Gap &lt; 5%)</option>
              <option value="SURPLUS">🟢 Sudah Memenuhi / Surplus</option>
            </select>
          </div>

          {/* Rentang Gap Persen Langsung */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Gap % Langsung:</span>
            <select
              value={gapRangeFilter}
              onChange={(e) => {
                setGapRangeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium outline-none ${
                gapRangeFilter !== 'ALL'
                  ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/70 dark:border-amber-800 dark:text-amber-200'
                  : isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">Semua Gap Persen</option>
              <option value="GAP_EXTREME">📉 Gap Kritis (&gt; 20% di bawah target)</option>
              <option value="GAP_MODERATE">⚠️ Gap Sedang (10% - 20% di bawah target)</option>
              <option value="GAP_SLIGHT">⏳ Gap Tipis (&lt; 10% - Dikit Lagi!)</option>
              <option value="GAP_SURPLUS">✅ Surplus / Di Atas Target</option>
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
              <option value="KEKURANGAN_ASC">Kekurangan Terkecil (Quick Wins)</option>
              <option value="TARGET_DESC">Target % Langsung Tertinggi</option>
              <option value="GAP_ASC">Gap Negatif Terdalam</option>
              <option value="PERSEN_ASC">Persentase Realisasi Terendah</option>
              <option value="PERSEN_DESC">Persentase Realisasi Tertinggi</option>
              <option value="PAGU_DESC">Pagu Anggaran Terbesar</option>
              <option value="KODE_ASC">Kode Satker (0-9)</option>
            </select>
          </div>
        </div>

        {/* QUICK PILAR 51, 52, 53, 57 FILTER CHIPS (ANALISIS CEPAT KURANG & BERLEBIH) */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
            Saring Cepat Belanja (51, 52, 53, 57):
          </span>

          {/* 51 Pegawai */}
          <button
            onClick={() => {
              setBelanjaFilter(prev => prev === '51_KURANG' ? 'ALL' : '51_KURANG');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              belanjaFilter === '51_KURANG'
                ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/30'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100'
            }`}
            title="Tampilkan satker dengan Belanja Pegawai (51) di bawah target"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>51 Kurang: {pilarCounts.k51}</span>
          </button>

          <button
            onClick={() => {
              setBelanjaFilter(prev => prev === '51_BERLEBIH' ? 'ALL' : '51_BERLEBIH');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              belanjaFilter === '51_BERLEBIH'
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/30'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100'
            }`}
            title="Tampilkan satker dengan Belanja Pegawai (51) memenuhi atau melampaui target"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>51 Berlebih: {pilarCounts.b51}</span>
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* 52 Barang */}
          <button
            onClick={() => {
              setBelanjaFilter(prev => prev === '52_KURANG' ? 'ALL' : '52_KURANG');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              belanjaFilter === '52_KURANG'
                ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/30'
                : 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100'
            }`}
            title="Tampilkan satker dengan Belanja Barang (52) di bawah target"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>52 Kurang: {pilarCounts.k52}</span>
          </button>

          <button
            onClick={() => {
              setBelanjaFilter(prev => prev === '52_BERLEBIH' ? 'ALL' : '52_BERLEBIH');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              belanjaFilter === '52_BERLEBIH'
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/30'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100'
            }`}
            title="Tampilkan satker dengan Belanja Barang (52) memenuhi atau melampaui target"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>52 Berlebih: {pilarCounts.b52}</span>
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* 53 Modal */}
          <button
            onClick={() => {
              setBelanjaFilter(prev => prev === '53_KURANG' ? 'ALL' : '53_KURANG');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              belanjaFilter === '53_KURANG'
                ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/30'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100'
            }`}
            title="Tampilkan satker dengan Belanja Modal (53) di bawah target"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>53 Kurang: {pilarCounts.k53}</span>
          </button>

          <button
            onClick={() => {
              setBelanjaFilter(prev => prev === '53_BERLEBIH' ? 'ALL' : '53_BERLEBIH');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              belanjaFilter === '53_BERLEBIH'
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/30'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100'
            }`}
            title="Tampilkan satker dengan Belanja Modal (53) memenuhi atau melampaui target"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>53 Berlebih: {pilarCounts.b53}</span>
          </button>

          {/* 57 Bansos (jika ada) */}
          {(pilarCounts.k57 > 0 || pilarCounts.b57 > 0) && (
            <>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
              <button
                onClick={() => {
                  setBelanjaFilter(prev => prev === '57_KURANG' ? 'ALL' : '57_KURANG');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  belanjaFilter === '57_KURANG'
                    ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/30'
                    : 'bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>57 Kurang: {pilarCounts.k57}</span>
              </button>
              <button
                onClick={() => {
                  setBelanjaFilter(prev => prev === '57_BERLEBIH' ? 'ALL' : '57_BERLEBIH');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  belanjaFilter === '57_BERLEBIH'
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/30'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>57 Berlebih: {pilarCounts.b57}</span>
              </button>
            </>
          )}

          {belanjaFilter !== 'ALL' && (
            <button
              onClick={() => {
                setBelanjaFilter('ALL');
                setCurrentPage(1);
              }}
              className="ml-auto text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40"
            >
              <X className="w-3 h-3" />
              Reset Filter Pilar
            </button>
          )}
        </div>
      </div>

      {/* DYNAMIC VIEW CONTAINER */}
      {viewMode === 'MATRIX_DEFISIT' ? (
        <RealisasiDefisitMatrixView
          evaluatedList={evaluatedList}
          triwulan={selectedTw}
          activeRule={activeRule}
          onSelectSatker={setSelectedSatkerForDetail}
          onOpenCalculator={(satkerId) => {
            setSelectedSatkerForCalculator(satkerId);
            setShowCalculatorModal(true);
          }}
          isDark={isDark}
        />
      ) : viewMode === 'PILAR_ANALYSIS' ? (
        <RealisasiPilarAnalyticsView
          evaluatedList={evaluatedList}
          triwulan={selectedTw}
          activeRule={activeRule}
          onSelectSatker={setSelectedSatkerForDetail}
          onOpenCalculator={(satkerId) => {
            setSelectedSatkerForCalculator(satkerId);
            setShowCalculatorModal(true);
          }}
          isDark={isDark}
        />
      ) : viewMode === 'GROUP_KL' ? (
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
          onOpenCalculator={(satkerId) => {
            setSelectedSatkerForCalculator(satkerId);
            setShowCalculatorModal(true);
          }}
          isDark={isDark}
        />
      ) : (
        /* STANDARD TABLE VIEW */
        <div className="space-y-4">
          {/* TOOLS LIVE TRACKER DEFISIT & TARGET NOMINAL SATKER */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-gradient-to-r from-white via-slate-50 to-emerald-50/40 border-slate-200 shadow-sm'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    Tools Cepat Defisit & Target Nominal Satker
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Live Pro Tracker
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pilih satker untuk melihat seketika target berapa persen langsung & kurang berapa dari nominal target
                  </p>
                </div>
              </div>

              {/* Satker Quick Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={quickLookupSatkerId}
                  onChange={(e) => setQuickLookupSatkerId(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none max-w-[280px] sm:max-w-[340px] truncate ${
                    quickLookupSatkerId
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
                      : isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="">-- Pilih Satker untuk Analisis Langsung --</option>
                  {evaluatedList.map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.kodeSatker}] {s.namaSatker} {s.totalKekuranganNominal > 0 ? `(Kurang ${formatRupiahCompact(s.totalKekuranganNominal)})` : '(✅ Lulus)'}
                    </option>
                  ))}
                </select>

                {quickLookupSatkerId && (
                  <button
                    onClick={() => setQuickLookupSatkerId('')}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Tutup preview cepat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Lookup Satker Card (If Selected) */}
            {quickLookupSatker && (
              <div className={`mt-3 p-3.5 rounded-xl border animate-in fade-in duration-200 ${
                quickLookupSatker.overallStatus === 'SESUAI'
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-emerald-600">
                        {quickLookupSatker.kodeSatker}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {quickLookupSatker.namaSatker}
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        ({quickLookupSatker.kementerianLembaga})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2.5 text-xs">
                      <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Pagu DIPA:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {formatRupiahCompact(quickLookupSatker.totalPagu)}
                        </span>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Target Langsung Satker:</span>
                        <span className="font-extrabold text-blue-600 dark:text-blue-400">
                          🎯 {quickLookupSatker.targetPersenLangsung}% ({formatRupiahCompact(quickLookupSatker.targetNominalTotal)})
                        </span>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Realisasi Saat Ini:</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          📊 {quickLookupSatker.totalPersen}% ({formatRupiahCompact(quickLookupSatker.totalRealisasi)})
                        </span>
                      </div>
                      <div className={`p-2 rounded-lg border ${
                        quickLookupSatker.overallStatus === 'SESUAI'
                          ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-200'
                          : 'bg-rose-100/70 border-rose-300 text-rose-900 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-200'
                      }`}>
                        <span className="text-[10px] block font-bold uppercase tracking-wider">
                          {quickLookupSatker.overallStatus === 'SESUAI' ? 'Status Capaian:' : 'Kurang Nominal Target:'}
                        </span>
                        <span className="font-black text-xs">
                          {quickLookupSatker.overallStatus === 'SESUAI'
                            ? `✅ Lulus (${quickLookupSatker.surplusNominal > 0 ? `Surplus ${formatRupiahCompact(quickLookupSatker.surplusNominal)}` : 'Sesuai'})`
                            : `🚨 Kurang ${formatRupiah(quickLookupSatker.totalKekuranganNominal)} (Gap: ${quickLookupSatker.gapPersenLangsung}%)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Quick Lookup Satker */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedSatkerForCalculator(quickLookupSatker.id);
                        setShowCalculatorModal(true);
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Simulasi di Kalkulator</span>
                    </button>
                    <button
                      onClick={(e) => handleCopyWaRow(quickLookupSatker, e)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      {copiedRowId === quickLookupSatker.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRowId === quickLookupSatker.id ? 'Tersalin!' : 'Salin WA'}</span>
                    </button>
                    <button
                      onClick={() => setSelectedSatkerForDetail(quickLookupSatker)}
                      className="px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                      title="Detail Satker"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Clickable Chips: Top Deficit & Quick Wins */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500 font-bold text-[11px] flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  Defisit Tertinggi:
                </span>
                {topDeficitSatkers.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setQuickLookupSatkerId(s.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 text-[11px] font-semibold border border-rose-200 dark:border-rose-900 transition-colors"
                    title={`Pagu: ${formatRupiahCompact(s.totalPagu)} | Realisasi: ${s.totalPersen}%`}
                  >
                    <span>{s.kodeSatker}</span>
                    <span className="font-extrabold">-{formatRupiahCompact(s.totalKekuranganNominal)}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500 font-bold text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Quick Wins (Segera Lulus):
                </span>
                {topQuickWinSatkers.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setQuickLookupSatkerId(s.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] font-semibold border border-amber-200 dark:border-amber-900 transition-colors"
                    title={`Pagu: ${formatRupiahCompact(s.totalPagu)} | Realisasi: ${s.totalPersen}%`}
                  >
                    <span>{s.kodeSatker}</span>
                    <span className="font-extrabold">&lt; {formatRupiahCompact(s.totalKekuranganNominal)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE DISPLAY MODE TOGGLE BAR */}
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="text-xs text-slate-500">
              Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{filteredSatkers.length}</span> satker
            </div>
            <div className="inline-flex p-0.5 rounded-xl border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setTableDisplayMode('TARGET_LANGSUNG')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  tableDisplayMode === 'TARGET_LANGSUNG'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                🎯 Mode Target Langsung (Pro)
              </button>
              <button
                onClick={() => setTableDisplayMode('STANDAR')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  tableDisplayMode === 'STANDAR'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                📋 Mode 4 Pilar Belanja
              </button>
            </div>
          </div>

          <div className={`rounded-2xl border overflow-hidden shadow-sm transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {tableDisplayMode === 'TARGET_LANGSUNG' ? (
                  /* PRO TARGET & DEFICIT TABLE HEADER */
                  <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                    isDark ? 'bg-slate-850/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Satker / K/L & Klaster</th>
                    <th className="py-3 px-4 text-right">Pagu DIPA Total</th>
                    <th className="py-3 px-4 text-right">
                      Target Langsung
                      <span className="block text-[9px] text-blue-500 normal-case font-semibold">% Komposit & Nominal</span>
                    </th>
                    <th className="py-3 px-4 text-right">
                      Realisasi Saat Ini
                      <span className="block text-[9px] text-emerald-600 normal-case font-semibold">% Serapan & Nominal</span>
                    </th>
                    <th className="py-3 px-4 text-right">
                      Kurang dari Target
                      <span className="block text-[9px] text-rose-500 normal-case font-semibold">Nominal Defisit & Gap %</span>
                    </th>
                    <th className="py-3 px-3 text-center">4 Belanja</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Aksi Cepat</th>
                  </tr>
                ) : (
                  /* STANDARD 4-PILLAR TABLE HEADER */
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
                    <th className="py-3 px-4 text-right">
                      Kekurangan Target
                      <span className="block text-[9px] text-slate-400 normal-case font-normal">Nominal (Rp) & % Langsung</span>
                    </th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {paginatedSatkers.length === 0 ? (
                  <tr>
                    <td colSpan={tableDisplayMode === 'TARGET_LANGSUNG' ? 9 : 10} className="py-12 text-center text-slate-400">
                      Tidak ada data satker yang sesuai dengan kriteria filter pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedSatkers.map((s, idx) => {
                    const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                    const isCompliant = s.overallStatus === 'SESUAI';
                    const hasCopied = copiedRowId === s.id;

                    if (tableDisplayMode === 'TARGET_LANGSUNG') {
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
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {s.clusterLabel}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                              {s.kementerianLembaga}
                            </div>
                          </td>

                          {/* Pagu Total */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {formatRupiahCompact(s.totalPagu)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Sisa: {formatRupiahCompact(s.totalSisa)}
                            </div>
                          </td>

                          {/* Target Langsung Satker */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="font-extrabold text-blue-600 dark:text-blue-400">
                              🎯 {s.targetPersenLangsung}%
                            </div>
                            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              {formatRupiahCompact(s.targetNominalTotal)}
                            </div>
                          </td>

                          {/* Realisasi Saat Ini */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className={`font-extrabold ${s.totalPersen >= s.targetPersenLangsung ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                              📊 {s.totalPersen}%
                            </div>
                            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              {formatRupiahCompact(s.totalRealisasi)}
                            </div>
                          </td>

                          {/* Kurang dari Target (Nominal Defisit & Gap) */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {s.totalKekuranganNominal > 0 ? (
                              <button
                                onClick={() => {
                                  setSelectedSatkerForCalculator(s.id);
                                  setShowCalculatorModal(true);
                                }}
                                className="text-right group block ml-auto focus:outline-none"
                                title="Buka kalkulator SPM satker ini"
                              >
                                <div className="font-extrabold text-rose-600 dark:text-rose-400 group-hover:underline flex items-center justify-end gap-1">
                                  <Calculator className="w-3 h-3 text-rose-500 opacity-70 group-hover:opacity-100" />
                                  Kurang {formatRupiahCompact(s.totalKekuranganNominal)}
                                </div>
                                <div className="text-[10px] text-rose-500 font-bold">
                                  Gap: {s.gapPersenLangsung}% langsung
                                </div>
                              </button>
                            ) : (
                              <div className="text-right">
                                <span className="text-emerald-600 font-extrabold text-[11px] inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Lulus Target
                                </span>
                                <div className="text-[10px] text-emerald-500 font-medium">
                                  {s.surplusNominal > 0 ? `+${formatRupiahCompact(s.surplusNominal)}` : 'Tepat'}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* 4 Pilar Mini Summary */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="grid grid-cols-4 gap-0.5 max-w-[120px] mx-auto text-[9px] font-bold">
                              <span className={`p-0.5 rounded ${!s.pegawai.hasPagu ? 'text-slate-300' : s.pegawai.status === 'MEMENUHI' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                                P
                              </span>
                              <span className={`p-0.5 rounded ${!s.barang.hasPagu ? 'text-slate-300' : s.barang.status === 'MEMENUHI' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                                B
                              </span>
                              <span className={`p-0.5 rounded ${!s.modal.hasPagu ? 'text-slate-300' : s.modal.status === 'MEMENUHI' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                                M
                              </span>
                              <span className={`p-0.5 rounded ${!s.bansos.hasPagu ? 'text-slate-300' : s.bansos.status === 'MEMENUHI' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                                S
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isCompliant ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
                                <CheckCircle2 className="w-3 h-3" />
                                Sesuai
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300/40">
                                <AlertTriangle className="w-3 h-3" />
                                Belum
                              </span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedSatkerForCalculator(s.id);
                                  setShowCalculatorModal(true);
                                }}
                                className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1 shadow-xs"
                                title="Hitung satker kurang berapa dari target nominal & simulasi SPM"
                              >
                                <Calculator className="w-3 h-3" />
                                <span>Hitung</span>
                              </button>
                              <button
                                onClick={(e) => handleCopyWaRow(s, e)}
                                className={`p-1 rounded-lg border text-xs transition-colors ${
                                  hasCopied
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                                title="Salin pesan WA kebutuhan target satker"
                              >
                                {hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => setSelectedSatkerForDetail(s)}
                                className="p-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                                title="Detail DIPA Satker"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    /* STANDARD VIEW ROW */
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
                            Target: {s.targetPersenLangsung}% ({formatRupiahCompact(s.targetNominalTotal)})
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

                        {/* Kekurangan Realisasi (Nominal & Target Langsung) */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {s.totalKekuranganNominal > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedSatkerForCalculator(s.id);
                                setShowCalculatorModal(true);
                              }}
                              className="text-right group block ml-auto focus:outline-none"
                              title="Klik untuk membuka kalkulator kebutuhan nominal satker ini"
                            >
                              <div className="font-extrabold text-rose-600 dark:text-rose-400 group-hover:underline flex items-center justify-end gap-1">
                                <Calculator className="w-3 h-3 text-rose-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                                {formatRupiah(s.totalKekuranganNominal)}
                              </div>
                              <div className="text-[10px] text-rose-500 font-semibold">
                                Gap: {s.gapPersenLangsung}% langsung
                              </div>
                            </button>
                          ) : (
                            <div className="text-right">
                              <span className="text-emerald-600 font-bold text-[11px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Tercapai
                              </span>
                              <div className="text-[10px] text-emerald-500">
                                {s.surplusNominal > 0 ? `+${formatRupiahCompact(s.surplusNominal)}` : '100% Memenuhi'}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Aksi Button */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedSatkerForCalculator(s.id);
                                setShowCalculatorModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1 shadow-xs"
                              title="Hitung satker kurang berapa dari nominal target & target % langsung"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                              <span>Hitung Target</span>
                            </button>
                            <button
                              onClick={(e) => handleCopyWaRow(s, e)}
                              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                hasCopied
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                              title="Salin pesan WA kebutuhan target satker"
                            >
                              {hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setSelectedSatkerForDetail(s)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                            >
                              Detail
                            </button>
                          </div>
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
      </div>
      )}

      {/* DETAIL MODAL SATKER */}
      {selectedSatkerForDetail && (
        <SatkerDetailModal
          satker={selectedSatkerForDetail}
          triwulan={selectedTw}
          onClose={() => setSelectedSatkerForDetail(null)}
          onOpenCalculator={(satkerId) => {
            setSelectedSatkerForDetail(null);
            setSelectedSatkerForCalculator(satkerId);
            setShowCalculatorModal(true);
          }}
          isDark={isDark}
        />
      )}

      {/* TOOLS KEBUTUHAN TARGET & KALKULATOR SATKER MODAL */}
      <RealisasiTargetCalculatorModal
        isOpen={showCalculatorModal}
        onClose={() => {
          setShowCalculatorModal(false);
          setSelectedSatkerForCalculator(null);
        }}
        satkers={evaluatedList}
        initialSatkerId={selectedSatkerForCalculator}
        triwulan={selectedTw}
        activeRule={activeRule}
        isDark={isDark}
      />

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
        </>
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

      {/* ADMIN AUTHENTICATION LOGIN MODAL */}
      {showAdminLoginModal && (
        <AdminLoginModal
          isOpen={showAdminLoginModal}
          onClose={() => setShowAdminLoginModal(false)}
          onAuthenticateAdmin={(pin) => {
            if (onAuthenticateAdmin) {
              const success = onAuthenticateAdmin(pin);
              if (success) {
                setShowAdminLoginModal(false);
                setPortalRole('INTERNAL_KPPN');
              }
              return success;
            }
            return false;
          }}
          theme={theme}
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
  onOpenCalculator?: (satkerId: string) => void;
  isDark?: boolean;
}

function SatkerDetailModal({ satker, triwulan, onClose, onOpenCalculator, isDark }: SatkerDetailModalProps) {
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
                    <th className="py-2.5 px-3 text-right">Target Nominal</th>
                    <th className="py-2.5 px-3 text-right">Realisasi</th>
                    <th className="py-2.5 px-3 text-right">Sisa Pagu</th>
                    <th className="py-2.5 px-2 text-center">Target %</th>
                    <th className="py-2.5 px-2 text-center">Realisasi %</th>
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
                          <td colSpan={8} className="py-2.5 px-3 text-center italic">Tidak ada alokasi pagu</td>
                          <td className="py-2.5 px-3 text-right">-</td>
                        </tr>
                      );
                    }

                    const isPass = detail.status === 'MEMENUHI';
                    const targetNominal = Math.round((detail.pagu * detail.targetPersen) / 100);

                    return (
                      <tr key={detail.label} className={!isPass ? 'bg-rose-50/20' : ''}>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                          {detail.label}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatRupiahCompact(detail.pagu)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {formatRupiahCompact(targetNominal)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">{formatRupiahCompact(detail.realisasi)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatRupiahCompact(detail.sisaPagu)}</td>
                        <td className="py-2.5 px-2 text-center text-slate-500 font-bold">{detail.targetPersen}%</td>
                        <td className="py-2.5 px-2 text-center font-bold">{detail.persen}%</td>
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
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          {onOpenCalculator && (
            <button
              onClick={() => {
                onClose();
                onOpenCalculator(satker.id);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm transition-all"
            >
              <Calculator className="w-4 h-4" />
              <span>Buka di Tools Target & Kalkulator</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors ml-auto"
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
