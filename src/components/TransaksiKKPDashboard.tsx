import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Trophy,
  Award,
  Search,
  Download,
  Filter,
  ShieldCheck,
  Building2,
  TrendingUp,
  Sparkles,
  DollarSign,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Info,
  Copy,
  Check,
  Send,
  Lock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { TransaksiKKPRecord, MasterSatker } from '../types';
import { INITIAL_KKP_RECORDS } from '../data/initialKKPData';

interface TransaksiKKPDashboardProps {
  records?: TransaksiKKPRecord[];
  masterSatkers?: MasterSatker[];
  userRole?: 'ADMIN' | 'PESERTA' | 'GUEST';
  userSatkerCode?: string;
  onOpenUploadModal?: () => void;
  onGoToAdmin?: () => void;
  onOpenBroadcastLibrary?: () => void;
  isDark?: boolean;
  isAdminAuthenticated?: boolean;
  customTexts?: any;
  showToast?: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
}

export const TransaksiKKPDashboard: React.FC<TransaksiKKPDashboardProps> = ({
  records,
  masterSatkers = [],
  userRole = 'GUEST',
  userSatkerCode,
  onOpenUploadModal,
  onGoToAdmin,
  onOpenBroadcastLibrary,
  isDark = false,
  isAdminAuthenticated = false,
  customTexts,
  showToast
}) => {
  const activeRecords = useMemo(() => {
    return (records && records.length > 0) ? records : INITIAL_KKP_RECORDS;
  }, [records]);

  // Filters & State
  const [rankingCategory, setRankingCategory] = useState<'transaksi' | 'nominal'>('transaksi');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKl, setSelectedKl] = useState('ALL');
  const [selectedBank, setSelectedBank] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSatkerDetail, setSelectedSatkerDetail] = useState<TransaksiKKPRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active Master Satker Map for enrichment
  const activeSatkerMap = useMemo(() => {
    const map = new Map<string, MasterSatker>();
    if (masterSatkers && masterSatkers.length > 0) {
      masterSatkers.forEach(m => {
        if (m.kodeSatker && m.isActive !== false) {
          map.set(m.kodeSatker.trim(), m);
        }
      });
    }
    return map;
  }, [masterSatkers]);

  // Base enriched records
  const baseEnrichedRecords = useMemo(() => {
    let list = [...activeRecords];

    if (userRole === 'PESERTA' && userSatkerCode) {
      list = list.filter(r => r.kodeSatker === userSatkerCode);
    }

    // Enrich missing satker names from masterSatkers if available
    return list.map(item => {
      const master = activeSatkerMap.get(item.kodeSatker);
      return {
        ...item,
        namaSatker: master?.namaSatker || item.namaSatker,
        kementerianLembaga: master?.kementerianLembaga || item.kementerianLembaga || 'KEMENTERIAN / LEMBAGA MITRA'
      };
    });
  }, [activeRecords, userRole, userSatkerCode, activeSatkerMap]);

  // Top 3 for Transaksi Terbanyak
  const topByTransaksi = useMemo(() => {
    return [...baseEnrichedRecords].sort((a, b) => {
      if (b.jumlahTransaksi !== a.jumlahTransaksi) return b.jumlahTransaksi - a.jumlahTransaksi;
      return b.totalNominal - a.totalNominal;
    });
  }, [baseEnrichedRecords]);

  // Top 3 for Nominal Terbanyak
  const topByNominal = useMemo(() => {
    return [...baseEnrichedRecords].sort((a, b) => {
      if (b.totalNominal !== a.totalNominal) return b.totalNominal - a.totalNominal;
      return b.jumlahTransaksi - a.jumlahTransaksi;
    });
  }, [baseEnrichedRecords]);

  // Active sorted records based on active ranking category tab
  const sortedRecords = useMemo(() => {
    return rankingCategory === 'nominal' ? topByNominal : topByTransaksi;
  }, [rankingCategory, topByNominal, topByTransaksi]);

  // Unique Filter Options
  const klList = useMemo(() => {
    const kls = new Set<string>();
    sortedRecords.forEach(r => {
      if (r.kementerianLembaga) kls.add(r.kementerianLembaga);
    });
    return Array.from(kls).sort();
  }, [sortedRecords]);

  const bankList = useMemo(() => {
    const banks = new Set<string>();
    sortedRecords.forEach(r => {
      if (r.bankPenerbit) banks.add(r.bankPenerbit);
    });
    return Array.from(banks).sort();
  }, [sortedRecords]);

  // Filtered Records for Table
  const filteredRecords = useMemo(() => {
    return sortedRecords.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        item.kodeSatker.toLowerCase().includes(q) ||
        item.namaSatker.toLowerCase().includes(q) ||
        (item.kementerianLembaga && item.kementerianLembaga.toLowerCase().includes(q)) ||
        (item.bankPenerbit && item.bankPenerbit.toLowerCase().includes(q));

      const matchKl = selectedKl === 'ALL' || item.kementerianLembaga === selectedKl;
      const matchBank = selectedBank === 'ALL' || item.bankPenerbit === selectedBank;
      const matchStatus = selectedStatus === 'ALL' || item.statusKeaktifan === selectedStatus;

      return matchSearch && matchKl && matchBank && matchStatus;
    });
  }, [sortedRecords, searchTerm, selectedKl, selectedBank, selectedStatus]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalSatker = sortedRecords.length;
    const totalTransaksi = sortedRecords.reduce((acc, r) => acc + (r.jumlahTransaksi || 0), 0);
    const totalNominal = sortedRecords.reduce((acc, r) => acc + (r.totalNominal || 0), 0);
    const avgNominalPerSatker = totalSatker > 0 ? Math.round(totalNominal / totalSatker) : 0;
    const avgNominalPerTransaksi = totalTransaksi > 0 ? Math.round(totalNominal / totalTransaksi) : 0;

    // Bank proportions
    const bankCounts: Record<string, number> = {};
    sortedRecords.forEach(r => {
      const b = r.bankPenerbit || 'Lainnya';
      bankCounts[b] = (bankCounts[b] || 0) + (r.jumlahTransaksi || 0);
    });

    let topBank = '-';
    let topBankCount = 0;
    Object.entries(bankCounts).forEach(([b, c]) => {
      if (c > topBankCount) {
        topBank = b;
        topBankCount = c;
      }
    });

    return {
      totalSatker,
      totalTransaksi,
      totalNominal,
      avgNominalPerSatker,
      avgNominalPerTransaksi,
      topBank,
      topBankCount
    };
  }, [sortedRecords]);

  // Top 3 Satkers (Podium)
  const top1 = sortedRecords[0];
  const top2 = sortedRecords[1];
  const top3 = sortedRecords[2];

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredRecords.map((r, idx) => ({
      'Peringkat': idx + 1,
      'Kode Satker': r.kodeSatker,
      'Nama Satker': r.namaSatker,
      'Kementerian / Lembaga': r.kementerianLembaga || '-',
      'Bank Penerbit KKP': r.bankPenerbit || '-',
      'Jumlah Transaksi (SP2D)': r.jumlahTransaksi,
      'Total Nominal Transaksi (Rp)': r.totalNominal,
      'Status Keaktifan': r.statusKeaktifan || 'Aktif',
      'Periode': r.periode || 'Agustus 2026'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi_KKP_GUP');
    XLSX.writeFile(wb, `Monitoring_Transaksi_KKP_KPPN026_${new Date().toISOString().slice(0, 10)}.xlsx`);

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Berhasil Diekspor',
        message: `Data monitoring transaksi KKP (${filteredRecords.length} Satker) telah diunduh.`
      });
    }
  };

  const handleCopyRow = (r: TransaksiKKPRecord) => {
    const text = `[MONITORING TRANSAKSI KKP - KPPN SEMARANG I]\nSatker: ${r.namaSatker} (${r.kodeSatker})\nJumlah Transaksi KKP: ${r.jumlahTransaksi} SP2D\nTotal Nominal: Rp ${r.totalNominal.toLocaleString('id-ID')}\nBank Mitra: ${r.bankPenerbit || '-'}\nStatus: ${r.statusKeaktifan || 'Aktif'}\nPortal: https://anggaran-026.my.id`;
    navigator.clipboard.writeText(text);
    setCopiedId(r.id);
    setTimeout(() => setCopiedId(null), 2500);

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Data Disalin! 📋',
        message: `Ringkasan transaksi KKP Satker ${r.kodeSatker} siap di-share ke WhatsApp.`
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-amber-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-500/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-xs">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                {customTexts?.transaksiKkpBadge || 'LEADERBOARD TRANSAKSI KKP & GUP'}
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-500/40">
                <CreditCard className="w-3.5 h-3.5" />
                Kartu Kredit Pemerintah 2026
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {customTexts?.transaksiKkpTitle || 'Dashboard Monitoring & Apresiasi Transaksi KKP'}
            </h2>

            <p className="text-indigo-200/80 text-xs sm:text-sm leading-relaxed">
              {customTexts?.transaksiKkpSubtitle ||
                'Peringkat keaktifan Satuan Kerja mitra KPPN Semarang I dalam mengoptimalkan penggunaan Kartu Kredit Pemerintah (KKP) dan percepatan revolving GUP KKP secara akuntabel dan non-tunai (cashless).'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isAdminAuthenticated && onOpenBroadcastLibrary && (
              <button
                type="button"
                onClick={onOpenBroadcastLibrary}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4 text-slate-950" />
                <span>Template Broadcast KKP</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel ({filteredRecords.length})</span>
            </button>

            {isAdminAuthenticated && onOpenUploadModal && (
              <button
                type="button"
                onClick={onOpenUploadModal}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs px-4 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Upload Excel KKP</span>
              </button>
            )}
          </div>
        </div>

        {/* 🔒 Privacy Compliance Notice Banner */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-start sm:items-center gap-3 bg-slate-950/40 rounded-2xl p-3.5 border border-indigo-500/20 text-xs">
          <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl shrink-0 mt-0.5 sm:mt-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="flex-1 text-[11px] text-slate-300 leading-relaxed">
            <strong className="text-emerald-400 font-bold">Standard Perlindungan Privasi Finansial Terpenuhi:</strong> Informasi rahasia seperti nomor rekening perbankan, identitas penerima individu, NPWP, dan detail nota rekening (Kolom C s.d. I laporan transaksi) <strong>dikecualikan secara otomatis</strong> dari dashboard publik untuk menjaga kerahasiaan data Satker.
          </div>
        </div>
      </div>

      {/* 2. Top 1, 2, 3 Ranking Section dengan Pemilihan Kategori (Transaksi Terbanyak vs Nominal Terbanyak) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                Peringkat 1, 2 & 3 Transaksi KKP
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apresiasi komitmen Satker mitra kerja KPPN Semarang I dalam akselerasi digitalisasi pembayaran
              </p>
            </div>
          </div>

          {/* Category Toggle Switch: Transaksi Terbanyak vs Nominal Terbanyak */}
          <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setRankingCategory('transaksi')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                rankingCategory === 'transaksi'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Jumlah Transaksi Terbanyak</span>
            </button>
            <button
              type="button"
              onClick={() => setRankingCategory('nominal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                rankingCategory === 'nominal'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Nominal Rupiah Terbanyak</span>
            </button>
          </div>
        </div>

        {/* Top 1, 2, 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          
          {/* PERINGKAT 2 */}
          {top2 && (
            <div className="order-2 md:order-1 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800/90 dark:to-slate-900 rounded-3xl p-5 border-2 border-slate-300 dark:border-slate-700 shadow-md relative overflow-hidden transition-all hover:scale-102 flex flex-col justify-between">
              <div className="absolute top-3 right-3 text-slate-300 dark:text-slate-700 font-black text-4xl opacity-50 select-none">
                #2
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black shadow-sm text-base border border-slate-300 dark:border-slate-600">
                    🥈
                  </div>
                  <div>
                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Peringkat 2 ({rankingCategory === 'transaksi' ? 'Transaksi Terbanyak' : 'Nominal Terbanyak'})
                    </span>
                    <div className="font-mono text-xs font-bold text-slate-500 mt-0.5">
                      Kode: {top2.kodeSatker}
                    </div>
                  </div>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 min-h-[40px]" title={top2.namaSatker}>
                  {top2.namaSatker}
                </h4>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {top2.kementerianLembaga}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Jumlah Transaksi:</span>
                  <span className={`font-black font-mono px-2 py-0.5 rounded-md border ${
                    rankingCategory === 'transaksi'
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                      : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                  }`}>
                    {top2.jumlahTransaksi} SP2D
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Total Nominal KKP:</span>
                  <span className={`font-black font-mono ${
                    rankingCategory === 'nominal'
                      ? 'text-emerald-600 dark:text-emerald-400 text-sm'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}>
                    Rp {top2.totalNominal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                  <span>Bank Mitra:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{top2.bankPenerbit || 'BRI'}</span>
                </div>
              </div>
            </div>
          )}

          {/* PERINGKAT 1 (Highlighted) */}
          {top1 && (
            <div className="order-1 md:order-2 bg-gradient-to-b from-indigo-50/80 via-white to-indigo-50/40 dark:from-indigo-950/50 dark:via-slate-900 dark:to-slate-900 rounded-3xl p-6 border-2 border-indigo-500/50 dark:border-indigo-500 shadow-xl relative overflow-hidden transition-all hover:scale-102 flex flex-col justify-between ring-2 ring-indigo-400/20">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white font-black text-[10px] px-3.5 py-1 rounded-bl-2xl shadow-sm uppercase tracking-wider">
                ⭐ PERINGKAT 1
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center font-black shadow-md text-xl border border-amber-300">
                    🥇
                  </div>
                  <div>
                    <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Peringkat 1 ({rankingCategory === 'transaksi' ? 'Transaksi Terbanyak' : 'Nominal Terbanyak'})
                    </span>
                    <div className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 mt-0.5">
                      Kode: {top1.kodeSatker}
                    </div>
                  </div>
                </div>

                <h4 className="font-black text-base text-slate-900 dark:text-white line-clamp-2 min-h-[44px]" title={top1.namaSatker}>
                  {top1.namaSatker}
                </h4>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                  {top1.kementerianLembaga}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-900/60 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 dark:text-slate-300 text-xs font-bold">Jumlah Transaksi:</span>
                  <span className={`font-black font-mono px-2.5 py-1 rounded-lg border text-sm ${
                    rankingCategory === 'transaksi'
                      ? 'bg-indigo-600 text-white border-indigo-700'
                      : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                  }`}>
                    {top1.jumlahTransaksi} SP2D
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 dark:text-slate-300 text-xs font-bold">Total Nominal KKP:</span>
                  <span className={`font-black font-mono ${
                    rankingCategory === 'nominal'
                      ? 'text-emerald-600 dark:text-emerald-400 text-base'
                      : 'text-indigo-700 dark:text-indigo-300 text-sm'
                  }`}>
                    Rp {top1.totalNominal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>Bank Penerbit:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{top1.bankPenerbit || 'BRI'}</span>
                </div>
              </div>
            </div>
          )}

          {/* PERINGKAT 3 */}
          {top3 && (
            <div className="order-3 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800/90 dark:to-slate-900 rounded-3xl p-5 border-2 border-slate-300 dark:border-slate-700 shadow-md relative overflow-hidden transition-all hover:scale-102 flex flex-col justify-between">
              <div className="absolute top-3 right-3 text-slate-300 dark:text-slate-700 font-black text-4xl opacity-50 select-none">
                #3
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-black shadow-sm text-base border border-amber-200 dark:border-amber-800">
                    🥉
                  </div>
                  <div>
                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Peringkat 3 ({rankingCategory === 'transaksi' ? 'Transaksi Terbanyak' : 'Nominal Terbanyak'})
                    </span>
                    <div className="font-mono text-xs font-bold text-slate-500 mt-0.5">
                      Kode: {top3.kodeSatker}
                    </div>
                  </div>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 min-h-[40px]" title={top3.namaSatker}>
                  {top3.namaSatker}
                </h4>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {top3.kementerianLembaga}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Jumlah Transaksi:</span>
                  <span className={`font-black font-mono px-2 py-0.5 rounded-md border ${
                    rankingCategory === 'transaksi'
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                      : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                  }`}>
                    {top3.jumlahTransaksi} SP2D
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Total Nominal KKP:</span>
                  <span className={`font-black font-mono ${
                    rankingCategory === 'nominal'
                      ? 'text-emerald-600 dark:text-emerald-400 text-sm'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}>
                    Rp {top3.totalNominal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                  <span>Bank Mitra:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{top3.bankPenerbit || 'Mandiri'}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 3. Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Satker Aktif KKP</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {stats.totalSatker}
            <span className="text-xs text-slate-400 font-sans font-bold ml-1.5">Satker</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            🟢 Memiliki Riwayat SP2D KKP
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Transaksi (SP2D)</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {stats.totalTransaksi}
            <span className="text-xs text-slate-400 font-sans font-bold ml-1.5">SP2D GUP</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Rata-rata: <strong>{Math.round(stats.totalTransaksi / (stats.totalSatker || 1))}</strong> per Satker
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Nilai Transaksi</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono truncate" title={`Rp ${stats.totalNominal.toLocaleString('id-ID')}`}>
            Rp {(stats.totalNominal / 1000000).toFixed(1)} Jt
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            Rata-rata: Rp {(stats.avgNominalPerTransaksi / 1000000).toFixed(2)} Jt / Transaksi
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Bank Penerbit Teraktif</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate" title={stats.topBank}>
            {stats.topBank.split('(')[0].trim()}
          </div>
          <div className="text-[11px] text-slate-500">
            Porsi Transaksi Terbesar ({stats.topBankCount} SP2D)
          </div>
        </div>

      </div>

      {/* 4. Interactive Monitoring Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-6 space-y-5">
        
        {/* Table Title & Search / Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              Tabel Monitoring Transaksi GUP KKP Seluruh Satker
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Menampilkan data pemanfaatan KKP yang terverifikasi (bebas kolom rahasia). Urutkan dan filter berdasarkan kebutuhan.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-slate-500">Menampilkan:</span>
            <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 px-2.5 py-1 rounded-xl font-mono">
              {filteredRecords.length} dari {sortedRecords.length} Satker
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Kode / Nama Satker / SP2D..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter K/L */}
          <div>
            <select
              value={selectedKl}
              onChange={(e) => setSelectedKl(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">-- Semua K/L ({klList.length}) --</option>
              {klList.map(kl => (
                <option key={kl} value={kl}>
                  {kl.slice(0, 32)}...
                </option>
              ))}
            </select>
          </div>

          {/* Filter Bank Penerbit */}
          <div>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">-- Semua Bank Penerbit ({bankList.length}) --</option>
              {bankList.map(bank => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status Keaktifan */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">-- Semua Status Keaktifan --</option>
              <option value="Sangat Aktif">🟢 Sangat Aktif</option>
              <option value="Aktif">🔵 Aktif</option>
              <option value="Perlu Akselerasi">🟡 Perlu Akselerasi</option>
            </select>

            {(searchTerm || selectedKl !== 'ALL' || selectedBank !== 'ALL' || selectedStatus !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedKl('ALL');
                  setSelectedBank('ALL');
                  setSelectedStatus('ALL');
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-800 shrink-0 cursor-pointer"
                title="Reset Semua Filter"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3.5 text-center w-14">Rank</th>
                <th className="py-3 px-4 min-w-[220px]">Satuan Kerja</th>
                <th className="py-3 px-4 min-w-[180px]">Kementerian / Lembaga</th>
                <th className="py-3 px-3 text-center min-w-[120px]">Frekuensi Transaksi</th>
                <th className="py-3 px-4 text-right min-w-[160px]">Total Nilai KKP (Rp)</th>
                <th className="py-3 px-3 min-w-[150px]">Bank Penerbit</th>
                <th className="py-3 px-3 text-center min-w-[110px]">Status</th>
                <th className="py-3 px-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Tidak ada satker yang cocok dengan filter atau pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const isTop1 = idx === 0 && selectedKl === 'ALL' && selectedBank === 'ALL' && !searchTerm;
                  const isTop2 = idx === 1 && selectedKl === 'ALL' && selectedBank === 'ALL' && !searchTerm;
                  const isTop3 = idx === 2 && selectedKl === 'ALL' && selectedBank === 'ALL' && !searchTerm;

                  return (
                    <tr
                      key={r.id}
                      className={`transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        isTop1 ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      {/* Peringkat */}
                      <td className="py-3 px-3.5 text-center font-mono font-black">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black shadow-xs">
                            🥇
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black shadow-xs">
                            🥈
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black shadow-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 text-xs">
                            #{idx + 1}
                          </span>
                        )}
                      </td>

                      {/* Satker */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1" title={r.namaSatker}>
                          {r.namaSatker}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          Kode: <strong className="text-indigo-600 dark:text-indigo-400">{r.kodeSatker}</strong>
                        </div>
                      </td>

                      {/* K/L */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[11px] line-clamp-1" title={r.kementerianLembaga}>
                        {r.kementerianLembaga || '-'}
                      </td>

                      {/* Jumlah Transaksi */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          {r.jumlahTransaksi} SP2D
                        </span>
                      </td>

                      {/* Total Nominal */}
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                        Rp {r.totalNominal.toLocaleString('id-ID')}
                      </td>

                      {/* Bank Penerbit */}
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                        {r.bankPenerbit || 'BRI / Mandiri'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          r.statusKeaktifan === 'Sangat Aktif'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                            : r.statusKeaktifan === 'Aktif'
                            ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-300'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300'
                        }`}>
                          {r.statusKeaktifan || 'Aktif'}
                        </span>
                      </td>

                      {/* Aksi Copy / Detail */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyRow(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
                            title="Salin ringkasan transaksi satker ini"
                          >
                            {copiedId === r.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedSatkerDetail(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 cursor-pointer"
                            title="Lihat Detail Transaksi KKP"
                          >
                            <Info className="w-3.5 h-3.5" />
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

      </div>

      {/* 5. Modal Detail Transaksi Satker */}
      {selectedSatkerDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  DETAIL TRANSAKSI KKP SATKER
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {selectedSatkerDetail.namaSatker}
                </h4>
                <div className="text-xs font-mono text-slate-500 mt-0.5">
                  Kode Satker: <strong>{selectedSatkerDetail.kodeSatker}</strong>
                </div>
              </div>
              <button
                onClick={() => setSelectedSatkerDetail(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kementerian / Lembaga:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-right">{selectedSatkerDetail.kementerianLembaga || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Penerbit Kartu:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedSatkerDetail.bankPenerbit || 'BRI'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total SP2D GUP KKP:</span>
                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{selectedSatkerDetail.jumlahTransaksi} Transaksi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Nominal Belanja:</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">Rp {selectedSatkerDetail.totalNominal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {selectedSatkerDetail.catatan && (
                <div className="bg-amber-50 dark:bg-amber-950/60 p-3 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-medium">
                  💡 {selectedSatkerDetail.catatan}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleCopyRow(selectedSatkerDetail)}
                className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Data WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
