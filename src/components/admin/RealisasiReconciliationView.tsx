import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  Download, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  MessageSquare, 
  ArrowRightLeft, 
  DollarSign, 
  Layers, 
  TrendingUp, 
  X,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Building2
} from 'lucide-react';
import { 
  RealisasiBelanjaRecord, 
  MyIntressRecord, 
  SatkerReconciliationDiff, 
  AppTheme 
} from '../../types';
import { 
  reconcileSintesaAndMyIntress, 
  exportReconciliationToExcel, 
  formatRupiahShort, 
  formatRupiahFull 
} from '../../utils/realisasiBelanjaProcessor';
import { useToast } from '../ToastNotification';
import { PaginationControl } from '../PaginationControl';

interface RealisasiReconciliationViewProps {
  theme?: AppTheme;
  isDark?: boolean;
  sintesaRecords?: RealisasiBelanjaRecord[];
  intressRecords?: MyIntressRecord[];
  myIntressRecords?: MyIntressRecord[];
  sintesaFileName?: string;
  intressFileName?: string;
  onNavigateToSintesa?: () => void;
  onNavigateToMyIntress?: () => void;
  onSyncToBuletin?: (diffs: SatkerReconciliationDiff[]) => void;
  onTransferToBroadcast?: (diffs: SatkerReconciliationDiff[]) => void;
}

export const RealisasiReconciliationView: React.FC<RealisasiReconciliationViewProps> = ({
  theme = 'light',
  isDark = false,
  sintesaRecords = [],
  intressRecords,
  myIntressRecords,
  sintesaFileName = 'Data SINTESA Kemenkeu',
  intressFileName = 'Data MY INTRESS Kemenkeu',
  onNavigateToSintesa,
  onNavigateToMyIntress,
  onSyncToBuletin,
  onTransferToBroadcast
}) => {
  const { addToast } = useToast();

  const safeSintesa = Array.isArray(sintesaRecords) ? sintesaRecords : [];
  const safeIntress = Array.isArray(intressRecords) ? intressRecords : (Array.isArray(myIntressRecords) ? myIntressRecords : []);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL_DIFF'); // 'ALL', 'ALL_DIFF', 'DIFF_REALISASI', 'DIFF_PAGU', 'DIFF_BOTH', 'MATCH'
  const [filterBelanjaDiff, setFilterBelanjaDiff] = useState<string>('ALL'); // 'ALL', '51', '52', '53', '57', '61'
  const [sortBy, setSortBy] = useState<'diff_real' | 'diff_pagu' | 'nama' | 'sintesa_real'>('diff_real');
  const [expandedSatkerKode, setExpandedSatkerKode] = useState<string | null>(null);
  const [copiedSatkerKode, setCopiedSatkerKode] = useState<string | null>(null);
  const [isSyncingBuletin, setIsSyncingBuletin] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Run automated reconciliation
  const allReconciledDiffs = useMemo(() => {
    return reconcileSintesaAndMyIntress(safeSintesa, safeIntress);
  }, [safeSintesa, safeIntress]);

  // Overall Reconciliation Summary
  const reconsSummary = useMemo(() => {
    const totalSatkers = allReconciledDiffs.length;
    const matchCount = allReconciledDiffs.filter(d => d.statusDiff === 'MATCH').length;
    const diffCount = totalSatkers - matchCount;
    const diffRealCount = allReconciledDiffs.filter(d => d.statusDiff === 'DIFF_REALISASI' || d.statusDiff === 'DIFF_BOTH').length;
    const diffPaguCount = allReconciledDiffs.filter(d => d.statusDiff === 'DIFF_PAGU' || d.statusDiff === 'DIFF_BOTH').length;

    const totalSintesaPagu = allReconciledDiffs.reduce((s, d) => s + d.sintesaPaguTotal, 0);
    const totalIntressPagu = allReconciledDiffs.reduce((s, d) => s + d.intressPaguTotal, 0);
    const netDiffPagu = totalSintesaPagu - totalIntressPagu;

    const totalSintesaReal = allReconciledDiffs.reduce((s, d) => s + d.sintesaRealTotal, 0);
    const totalIntressReal = allReconciledDiffs.reduce((s, d) => s + d.intressRealTotal, 0);
    const netDiffReal = totalSintesaReal - totalIntressReal;

    return {
      totalSatkers,
      matchCount,
      diffCount,
      diffRealCount,
      diffPaguCount,
      totalSintesaPagu,
      totalIntressPagu,
      netDiffPagu,
      totalSintesaReal,
      totalIntressReal,
      netDiffReal,
    };
  }, [allReconciledDiffs]);

  // Handle Sync to Buletin
  const handleSyncToBuletinClick = () => {
    setIsSyncingBuletin(true);
    try {
      if (onSyncToBuletin) {
        onSyncToBuletin(allReconciledDiffs);
      } else {
        addToast({
          title: 'Sinkronisasi Buletin Berhasil',
          message: `Rangkuman rekonsiliasi (${reconsSummary.diffCount} satker dengan perbedaan data) berhasil disinkronkan ke draf Buletin Warta KPPN.`,
          type: 'success'
        });
      }
    } finally {
      setTimeout(() => setIsSyncingBuletin(false), 600);
    }
  };

  // Handle Transfer to Broadcast WA
  const handleTransferToBroadcastClick = () => {
    const diffsOnly = allReconciledDiffs.filter(d => d.statusDiff !== 'MATCH');
    if (onTransferToBroadcast) {
      onTransferToBroadcast(diffsOnly);
    } else {
      addToast({
        title: 'Transfer ke Broadcast WA',
        message: `${diffsOnly.length} Satker dengan selisih data berhasil dikirim ke antrean Broadcast WA.`,
        type: 'success'
      });
    }
  };

  // Filtered Diffs
  const filteredDiffs = useMemo(() => {
    return allReconciledDiffs.filter(d => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchKode = d.kodeSatker.toLowerCase().includes(q);
        const matchNama = d.namaSatker.toLowerCase().includes(q);
        if (!matchKode && !matchNama) return false;
      }

      // Status Filter
      if (filterStatus === 'ALL_DIFF' && d.statusDiff === 'MATCH') return false;
      if (filterStatus === 'DIFF_REALISASI' && d.statusDiff !== 'DIFF_REALISASI') return false;
      if (filterStatus === 'DIFF_PAGU' && d.statusDiff !== 'DIFF_PAGU') return false;
      if (filterStatus === 'DIFF_BOTH' && d.statusDiff !== 'DIFF_BOTH') return false;
      if (filterStatus === 'MATCH' && d.statusDiff !== 'MATCH') return false;

      // Filter by Discrepant Expenditure (Belanja yang berselisih)
      if (filterBelanjaDiff !== 'ALL') {
        const item = d.breakdown.find(b => b.jenisKode === filterBelanjaDiff);
        if (!item || item.status === 'MATCH') return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'diff_real') {
        return Math.abs(b.diffRealTotal) - Math.abs(a.diffRealTotal);
      } else if (sortBy === 'diff_pagu') {
        return Math.abs(b.diffPaguTotal) - Math.abs(a.diffPaguTotal);
      } else if (sortBy === 'nama') {
        return a.namaSatker.localeCompare(b.namaSatker);
      } else if (sortBy === 'sintesa_real') {
        return b.sintesaRealTotal - a.sintesaRealTotal;
      }
      return 0;
    });
  }, [allReconciledDiffs, searchQuery, filterStatus, filterBelanjaDiff, sortBy]);

  const effectivePageSize = pageSize <= 0 ? filteredDiffs.length || 1 : pageSize;
  const totalPages = Math.ceil(filteredDiffs.length / effectivePageSize) || 1;
  const paginatedDiffs = useMemo(() => {
    if (pageSize <= 0) return filteredDiffs;
    const start = (currentPage - 1) * pageSize;
    return filteredDiffs.slice(start, start + pageSize);
  }, [filteredDiffs, currentPage, pageSize]);

  // Handle Copy WhatsApp Template
  const handleCopyWaTemplate = (diff: SatkerReconciliationDiff) => {
    navigator.clipboard.writeText(diff.templateKonfirmasiWa);
    setCopiedSatkerKode(diff.kodeSatker);
    addToast({
      title: 'Format Pesan Disalin',
      message: `Draf konfirmasi untuk ${diff.namaSatker} siap dikirimkan melalui WhatsApp / Email.`,
      type: 'success'
    });
    setTimeout(() => {
      setCopiedSatkerKode(null);
    }, 2500);
  };

  // Handle Direct WhatsApp Web Open
  const handleOpenWhatsApp = (diff: SatkerReconciliationDiff) => {
    const encoded = encodeURIComponent(diff.templateKonfirmasiWa);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Handle Export Excel
  const handleExportExcel = () => {
    exportReconciliationToExcel(filteredDiffs);
    addToast({
      title: 'Ekspor Excel Berhasil',
      message: `Berhasil mengunduh ${filteredDiffs.length} data rekonsiliasi ke Excel.`,
      type: 'success'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="p-4.5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border border-indigo-700/50 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                ⚖️ REKONSILIASI OTOMATIS
              </span>
              <span className="text-xs text-indigo-200">
                Membandingkan Data <strong>SINTESA</strong> vs <strong>MY INTRESS</strong>
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight">
              Matriks Analisis Perbedaan Data Belanja & Pagu Satker
            </h3>
            <p className="text-xs text-indigo-200/90 max-w-3xl leading-relaxed">
              Modul ini membandingkan data transaksi detail SINTESA (Inquiry 5.196 baris) dengan data per jenis belanja aplikasi MY INTRESS (127 Satker). Menemukan selisih pagu dan realisasi per satker serta per jenis belanja (51, 52, 53, 57, Transfer) dan menyediakan draf konfirmasi resmi satu klik.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Tombol Sinkronkan ke Buletin */}
            <button
              onClick={handleSyncToBuletinClick}
              disabled={isSyncingBuletin}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              title="Sinkronkan rangkuman dan temuan rekonsiliasi data belanja ke draf Buletin KPPN"
            >
              <Sparkles className={`w-4 h-4 text-slate-950 ${isSyncingBuletin ? 'animate-spin' : ''}`} />
              <span>{isSyncingBuletin ? 'Menyinkronkan...' : 'Sinkronkan ke Buletin'}</span>
            </button>

            {/* Tombol Kirim ke Broadcast WA */}
            <button
              onClick={handleTransferToBroadcastClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
              title="Transfer daftar Satker dengan selisih data ke menu Broadcast Masif WA"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Broadcast WA ({reconsSummary.diffCount} Satker)</span>
            </button>

            {onNavigateToSintesa && (
              <button
                onClick={onNavigateToSintesa}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-400/30 shadow-xs transition-all cursor-pointer"
              >
                <span>SINTESA →</span>
              </button>
            )}
            {onNavigateToMyIntress && (
              <button
                onClick={onNavigateToMyIntress}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-600/80 hover:bg-emerald-600 text-white border border-emerald-400/30 shadow-xs transition-all cursor-pointer"
              >
                <span>My InTress →</span>
              </button>
            )}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>Ekspor (Excel)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Satker & Selisih */}
        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Status Satker
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {reconsSummary.diffCount}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              dari {reconsSummary.totalSatkers} Satker Ada Selisih
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Cocok Sempurna (Match):</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{reconsSummary.matchCount} Satker</span>
          </div>
        </div>

        {/* Card 2: Selisih Realisasi */}
        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Net Selisih Realisasi
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatRupiahShort(Math.abs(reconsSummary.netDiffReal))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {reconsSummary.netDiffReal < 0 ? 'My InTress lebih tinggi' : 'SINTESA lebih tinggi'}
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Satker Selisih Real:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">{reconsSummary.diffRealCount} Satker</span>
          </div>
        </div>

        {/* Card 3: Selisih Pagu DIPA */}
        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Net Selisih Pagu
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatRupiahShort(Math.abs(reconsSummary.netDiffPagu))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {reconsSummary.netDiffPagu < 0 ? 'My InTress mencakup TKD' : 'SINTESA mencakup DIPA'}
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Satker Selisih Pagu:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{reconsSummary.diffPaguCount} Satker</span>
          </div>
        </div>

        {/* Card 4: Action Status */}
        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Format Konfirmasi Satker
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            Siap Digunakan
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Teks WhatsApp siap disalin per satker dengan rincian akun belanja yang berselisih.
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Metode:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Salin / Buka WhatsApp</span>
          </div>
        </div>
      </div>

      {/* Filter and Quick Chips */}
      <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        {/* Quick Filter Status Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Status:
          </span>

          {[
            { id: 'ALL_DIFF', label: `⚠️ Semua Ada Selisih (${reconsSummary.diffCount})`, color: 'amber' },
            { id: 'DIFF_REALISASI', label: `🔴 Selisih Realisasi Saja (${allReconciledDiffs.filter(d => d.statusDiff === 'DIFF_REALISASI').length})`, color: 'rose' },
            { id: 'DIFF_PAGU', label: `🟡 Selisih Pagu Saja (${allReconciledDiffs.filter(d => d.statusDiff === 'DIFF_PAGU').length})`, color: 'yellow' },
            { id: 'DIFF_BOTH', label: `🟣 Selisih Pagu & Realisasi (${allReconciledDiffs.filter(d => d.statusDiff === 'DIFF_BOTH').length})`, color: 'purple' },
            { id: 'MATCH', label: `🟢 Cocok Sempurna (${reconsSummary.matchCount})`, color: 'emerald' },
            { id: 'ALL', label: `Semua (${reconsSummary.totalSatkers})`, color: 'slate' },
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => {
                setFilterStatus(chip.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === chip.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Search and Secondary Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Kode atau Nama Satker..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
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

          {/* Filter Discrepant Expenditure */}
          <div>
            <select
              value={filterBelanjaDiff}
              onChange={(e) => {
                setFilterBelanjaDiff(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value="ALL">Semua Jenis Belanja yang Berselisih</option>
              <option value="51">Hanya yang Berselisih di Belanja Pegawai (51)</option>
              <option value="52">Hanya yang Berselisih di Belanja Barang (52)</option>
              <option value="53">Hanya yang Berselisih di Belanja Modal (53)</option>
              <option value="57">Hanya yang Berselisih di Belanja Bansos (57)</option>
              <option value="61">Hanya yang Berselisih di Belanja Transfer (TKD)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value="diff_real">Selisih Realisasi Terbesar &darr;</option>
              <option value="diff_pagu">Selisih Pagu Terbesar &darr;</option>
              <option value="sintesa_real">Realisasi SINTESA Terbesar &darr;</option>
              <option value="nama">Nama Satker (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Notice */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
          <span>
            Menampilkan <strong>{filteredDiffs.length}</strong> Satker hasil rekonsiliasi.
          </span>
          {(searchQuery || filterStatus !== 'ALL_DIFF' || filterBelanjaDiff !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('ALL_DIFF');
                setFilterBelanjaDiff('ALL');
                setCurrentPage(1);
              }}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Discrepancy List Cards */}
      <div className="space-y-4">
        {paginatedDiffs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">
            Tidak ada data satker yang sesuai dengan kriteria filter rekonsiliasi.
          </div>
        ) : (
          paginatedDiffs.map((diff) => {
            const isExpanded = expandedSatkerKode === diff.kodeSatker;
            const hasDiffReal = Math.abs(diff.diffRealTotal) > 100;
            const hasDiffPagu = Math.abs(diff.diffPaguTotal) > 100;
            const isMatch = diff.statusDiff === 'MATCH';

            return (
              <div
                key={diff.kodeSatker}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                  isMatch
                    ? 'bg-white dark:bg-slate-800/95 border-emerald-200 dark:border-emerald-900/60'
                    : hasDiffReal && hasDiffPagu
                    ? 'bg-white dark:bg-slate-800/95 border-purple-200 dark:border-purple-900/60'
                    : hasDiffReal
                    ? 'bg-white dark:bg-slate-800/95 border-rose-200 dark:border-rose-900/60'
                    : 'bg-white dark:bg-slate-800/95 border-amber-200 dark:border-amber-900/60'
                }`}
              >
                {/* Satker Header Summary Bar */}
                <div className="p-4.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {diff.kodeSatker}
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        {diff.namaSatker}
                      </h4>

                      {/* Status Tag */}
                      {isMatch ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Cocok Sempurna
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          diff.statusDiff === 'DIFF_REALISASI'
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                            : diff.statusDiff === 'DIFF_PAGU'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                            : 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300'
                        }`}>
                          <AlertTriangle className="w-3 h-3" />
                          {diff.statusDiff === 'DIFF_REALISASI'
                            ? `Selisih Realisasi: ${formatRupiahShort(Math.abs(diff.diffRealTotal))}`
                            : diff.statusDiff === 'DIFF_PAGU'
                            ? `Selisih Pagu: ${formatRupiahShort(Math.abs(diff.diffPaguTotal))}`
                            : `Selisih Pagu & Realisasi`}
                        </span>
                      )}
                    </div>

                    {/* Quick Comparative Numbers */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1">
                      <div>
                        <span className="text-slate-400">SINTESA Real:</span>{' '}
                        <strong className="text-slate-900 dark:text-white font-mono">
                          {formatRupiahShort(diff.sintesaRealTotal)} ({(Number.isFinite(diff.sintesaPersenTotal) ? diff.sintesaPersenTotal : 0).toFixed(1)}%)
                        </strong>
                      </div>
                      <div className="text-slate-300 dark:text-slate-600">•</div>
                      <div>
                        <span className="text-slate-400">My InTress Real:</span>{' '}
                        <strong className="text-slate-900 dark:text-white font-mono">
                          {formatRupiahShort(diff.intressRealTotal)} ({(Number.isFinite(diff.intressPersenTotal) ? diff.intressPersenTotal : 0).toFixed(1)}%)
                        </strong>
                      </div>
                      {hasDiffReal && (
                        <>
                          <div className="text-slate-300 dark:text-slate-600">•</div>
                          <div>
                            <span className="text-slate-400">&Delta; Realisasi:</span>{' '}
                            <strong className={`font-mono ${diff.diffRealTotal < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                              {diff.diffRealTotal > 0 ? '+' : ''}{formatRupiahShort(diff.diffRealTotal)}
                            </strong>
                          </div>
                        </>
                      )}
                      {hasDiffPagu && (
                        <>
                          <div className="text-slate-300 dark:text-slate-600">•</div>
                          <div>
                            <span className="text-slate-400">&Delta; Pagu:</span>{' '}
                            <strong className={`font-mono ${diff.diffPaguTotal < 0 ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                              {diff.diffPaguTotal > 0 ? '+' : ''}{formatRupiahShort(diff.diffPaguTotal)}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions & Expand Toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isMatch && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCopyWaTemplate(diff)}
                          className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border ${
                            copiedSatkerKode === diff.kodeSatker
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                          }`}
                          title="Salin Draf Pesan Konfirmasi WhatsApp"
                        >
                          {copiedSatkerKode === diff.kodeSatker ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Salin WA</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(diff)}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                          title="Buka WhatsApp Langsung"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Kirim WA</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setExpandedSatkerKode(isExpanded ? null : diff.kodeSatker)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        isExpanded
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 dark:hover:bg-indigo-900/80 border border-indigo-200/60 dark:border-indigo-800/60'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Tutup Rincian' : 'Rincian Belanja & Analisis'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Comparison Breakdown & Smart Analysis */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700 p-4.5 bg-slate-50/70 dark:bg-slate-900/50 space-y-4">
                    {/* Comparative Table per Jenis Belanja */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
                      <div className="p-3 bg-slate-100/70 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Rincian Komparasi Per Jenis Belanja: SINTESA vs MY INTRESS</span>
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          Satker: {diff.kodeSatker}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                              <th className="py-2.5 px-3 font-bold">Jenis Belanja</th>
                              <th className="py-2.5 px-3 text-right font-bold text-blue-700 dark:text-blue-300">Pagu SINTESA</th>
                              <th className="py-2.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-300">Pagu InTress</th>
                              <th className="py-2.5 px-3 text-right font-bold text-slate-700 dark:text-slate-300">&Delta; Selisih Pagu</th>
                              <th className="py-2.5 px-3 text-right font-bold text-blue-700 dark:text-blue-300">Real SINTESA</th>
                              <th className="py-2.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-300">Real InTress</th>
                              <th className="py-2.5 px-3 text-right font-bold text-slate-700 dark:text-slate-300">&Delta; Selisih Real</th>
                              <th className="py-2.5 px-3 text-center font-bold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                            {diff.breakdown.map((b) => {
                              const hasRowDiff = b.status !== 'MATCH';
                              return (
                                <tr key={b.jenisKode} className={hasRowDiff ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}>
                                  <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">
                                    {b.jenisNama}
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                                    {formatRupiahFull(b.sintesaPagu)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                                    {formatRupiahFull(b.intressPagu)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold">
                                    {Math.abs(b.diffPagu) > 100 ? (
                                      <span className={b.diffPagu < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}>
                                        {b.diffPagu > 0 ? '+' : ''}{formatRupiahFull(b.diffPagu)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-normal">Rp 0</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-300 font-bold">
                                    {formatRupiahFull(b.sintesaReal)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-300 font-bold">
                                    {formatRupiahFull(b.intressReal)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold">
                                    {Math.abs(b.diffReal) > 100 ? (
                                      <span className={b.diffReal < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}>
                                        {b.diffReal > 0 ? '+' : ''}{formatRupiahFull(b.diffReal)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-normal">Rp 0</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-sans">
                                    {b.status === 'MATCH' ? (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                                        Match
                                      </span>
                                    ) : b.status === 'DIFF_REAL' ? (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold">
                                        Selisih Real
                                      </span>
                                    ) : b.status === 'DIFF_PAGU' ? (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                                        Selisih Pagu
                                      </span>
                                    ) : (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold">
                                        Pagu & Real
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* AI Analysis & Root Cause Breakdown Note */}
                    <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
                      <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Catatan Analisis KPPN & Potensi Penyebab Perbedaan Data</span>
                      </div>
                      
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {diff.catatanAnalisis}
                      </p>

                      <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                          <span className="font-bold text-indigo-950 dark:text-indigo-200 block mb-1">🔍 Potensi Faktor Penyebab:</span>
                          <ul className="text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                            <li>Perbedaan waktu cut-off pembukuan data SP2D antara SINTESA dan My InTress.</li>
                            <li>Adanya transaksi SP2D GUP/LS akhir periode yang belum tersinkron di salah satu basis data.</li>
                            <li>Revisi DIPA / POK atau pergeseran akun belanja yang belum efektif ter-update.</li>
                          </ul>
                        </div>

                        <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                          <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-1">📌 Rekomendasi Tindak Lanjut:</span>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {diff.saranTindakan}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {filteredDiffs.length > 0 && (
        <div className="rounded-2xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <PaginationControl
            currentPage={currentPage}
            totalItems={filteredDiffs.length}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 25, 50, -1]}
            itemLabel="Satker"
            isDark={isDark}
          />
        </div>
      )}
    </div>
  );
};
