import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  CreditCard,
  Building2,
  TrendingUp,
  Search,
  Download,
  Calendar,
  Layers,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Trophy,
  Award,
  Wallet,
  Receipt,
  Store,
  Landmark,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { DigipayRecord, MasterSatker, DigipaySatkerSummary } from '../types';
import { aggregateDigipayRecords } from '../data/initialDigipayData';
import { exportDigipayToExcel, downloadDigipayTemplate } from '../utils/modularExcelProcessors';

interface TransaksiDigipayDashboardProps {
  records: DigipayRecord[];
  masterSatkers?: MasterSatker[];
  lastUpdateDate?: string;
  theme?: 'light' | 'dark';
  onNavigateToAdmin?: () => void;
  onGoToAdmin?: () => void;
  onApplyRecords?: (newRecords: DigipayRecord[]) => void;
  isAdminAuthenticated?: boolean;
}

export const TransaksiDigipayDashboard: React.FC<TransaksiDigipayDashboardProps> = ({
  records = [],
  masterSatkers = [],
  lastUpdateDate,
  theme = 'light',
  onNavigateToAdmin,
  onGoToAdmin,
  onApplyRecords,
  isAdminAuthenticated
}) => {
  const isDark = theme === 'dark';
  const handleGoToAdmin = onGoToAdmin || onNavigateToAdmin;

  // Sub-view state
  const [activeSubTab, setActiveSubTab] = useState<'rekap' | 'va' | 'kkp' | 'ekosistem'>('rekap');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [bankFilter, setBankFilter] = useState<string>('ALL');
  const [rankSortBy, setRankSortBy] = useState<'count' | 'nominal'>('count');
  
  // Selected Satker for Detailed Modal
  const [selectedSatkerSummary, setSelectedSatkerSummary] = useState<DigipaySatkerSummary | null>(null);

  // Pagination for tables
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Format Currency
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Summaries per Satker
  const satkerSummaries = useMemo(() => {
    return aggregateDigipayRecords(records);
  }, [records]);

  // Total Statistics
  const stats = useMemo(() => {
    const totalTransactions = records.length;
    const totalNominal = records.reduce((acc, r) => acc + (r.nominalTransaksi || 0), 0);

    const vaRecords = records.filter(r => r.tipePembayaran === 'VA');
    const totalVA = vaRecords.length;
    const nominalVA = vaRecords.reduce((acc, r) => acc + (r.nominalTransaksi || 0), 0);

    const kkpRecords = records.filter(r => r.tipePembayaran === 'KKP');
    const totalKKP = kkpRecords.length;
    const nominalKKP = kkpRecords.reduce((acc, r) => acc + (r.nominalTransaksi || 0), 0);

    const uniqueSatkersWithTx = satkerSummaries.length;
    const totalMasterCount = masterSatkers.filter(m => m.isActive !== false).length || 125;

    // Unique vendors
    const vendorSet = new Set<string>();
    records.forEach(r => {
      if (r.namaVendor) vendorSet.add(r.namaVendor.trim());
    });

    return {
      totalTransactions,
      totalNominal,
      totalVA,
      nominalVA,
      totalKKP,
      nominalKKP,
      uniqueSatkersWithTx,
      totalMasterCount,
      uniqueVendorsCount: vendorSet.size
    };
  }, [records, satkerSummaries, masterSatkers]);

  // Unique Banks in data
  const availableBanks = useMemo(() => {
    const banks = new Set<string>();
    records.forEach(r => {
      if (r.namaBank) banks.add(r.namaBank.trim());
    });
    return Array.from(banks);
  }, [records]);

  // Filtered Satker Summaries
  const filteredSummaries = useMemo(() => {
    return satkerSummaries.filter(s => {
      const matchSearch =
        searchQuery === '' ||
        s.kodeSatker.includes(searchQuery) ||
        s.namaSatker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.kementerianLembaga && s.kementerianLembaga.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === 'ALL' ||
        s.statusKeaktifan === statusFilter;

      const matchBank =
        bankFilter === 'ALL' ||
        (s.bankTerbanyak && s.bankTerbanyak.toLowerCase().includes(bankFilter.toLowerCase()));

      return matchSearch && matchStatus && matchBank;
    }).sort((a, b) => {
      if (rankSortBy === 'count') {
        return b.totalSemuaTransaksi - a.totalSemuaTransaksi || b.totalSemuaNominal - a.totalSemuaNominal;
      } else {
        return b.totalSemuaNominal - a.totalSemuaNominal || b.totalSemuaTransaksi - a.totalSemuaTransaksi;
      }
    });
  }, [satkerSummaries, searchQuery, statusFilter, bankFilter, rankSortBy]);

  // Top 3 Satkers
  const topSatkers = useMemo(() => {
    const list = [...satkerSummaries].sort((a, b) => {
      if (rankSortBy === 'count') {
        return b.totalSemuaTransaksi - a.totalSemuaTransaksi || b.totalSemuaNominal - a.totalSemuaNominal;
      } else {
        return b.totalSemuaNominal - a.totalSemuaNominal || b.totalSemuaTransaksi - a.totalSemuaTransaksi;
      }
    });
    return list.slice(0, 3);
  }, [satkerSummaries, rankSortBy]);

  // Filtered Raw Records for VA / KKP tabs
  const filteredRawRecords = useMemo(() => {
    const targetType = activeSubTab === 'va' ? 'VA' : activeSubTab === 'kkp' ? 'KKP' : null;
    return records.filter(r => {
      if (targetType && r.tipePembayaran !== targetType) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.kodeSatker.includes(q) ||
        r.namaSatker.toLowerCase().includes(q) ||
        (r.namaVendor && r.namaVendor.toLowerCase().includes(q)) ||
        (r.noTransaksi && r.noTransaksi.toLowerCase().includes(q)) ||
        (r.uraianBarang && r.uraianBarang.toLowerCase().includes(q))
      );
    }).sort((a, b) => (b.nominalTransaksi || 0) - (a.nominalTransaksi || 0));
  }, [records, activeSubTab, searchQuery]);

  // Ecosystem Vendor Breakdown
  const topVendors = useMemo(() => {
    const vMap = new Map<string, { nama: string; totalTx: number; totalNom: number; satkers: Set<string> }>();
    records.forEach(r => {
      if (!r.namaVendor) return;
      const v = r.namaVendor.trim();
      const existing = vMap.get(v) || { nama: v, totalTx: 0, totalNom: 0, satkers: new Set() };
      existing.totalTx += 1;
      existing.totalNom += r.nominalTransaksi || 0;
      existing.satkers.add(r.kodeSatker);
      vMap.set(v, existing);
    });
    return Array.from(vMap.values()).sort((a, b) => b.totalNom - a.totalNom).slice(0, 8);
  }, [records]);

  // Ecosystem Bank Breakdown
  const bankBreakdown = useMemo(() => {
    const bMap = new Map<string, { nama: string; totalTx: number; totalNom: number }>();
    records.forEach(r => {
      const b = r.namaBank || 'Bank Lainnya';
      const existing = bMap.get(b) || { nama: b, totalTx: 0, totalNom: 0 };
      existing.totalTx += 1;
      existing.totalNom += r.nominalTransaksi || 0;
      bMap.set(b, existing);
    });
    return Array.from(bMap.values()).sort((a, b) => b.totalNom - a.totalNom);
  }, [records]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. HERO HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 p-6 sm:p-8 text-white shadow-2xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
              <span>DIGIPAY SATU KEMENKEU • KPPN SEMARANG I</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Monitoring Transaksi Digipay
              <span className="text-xs sm:text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
                VA &amp; KKP Terpadu
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Pemantauan transaksi digitalisasi belanja operasional Satuan Kerja melalui modul pembayaran <strong>Virtual Account (VA CMS)</strong> dan <strong>Kartu Kredit Pemerintah (KKP)</strong> terintegrasi ekosistem marketplace Digipay Satu Kemenkeu.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Posisi: <strong>Agustus 2026</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Update: <strong>{lastUpdateDate || '18 Agustus 2026 - 15:30 WIB'}</strong>
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-row md:flex-col gap-2.5 sm:self-start">
            <button
              onClick={() => exportDigipayToExcel(records)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Rekap Excel</span>
            </button>
            <button
              onClick={downloadDigipayTemplate}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span>Template Format Excel</span>
            </button>
            {handleGoToAdmin && (
              <button
                onClick={handleGoToAdmin}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Upload Excel Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Transaksi Digipay */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Transaksi Digipay
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.totalTransactions} <span className="text-sm font-semibold text-slate-500">Transaksi</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold">
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                VA: {stats.totalVA}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                KKP: {stats.totalKKP}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Nominal Belanja */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Nominal Belanja (Rp)
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
              {formatRupiah(stats.totalNominal)}
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between font-medium">
              <span>VA: {formatRupiah(stats.nominalVA)}</span>
              <span>KKP: {formatRupiah(stats.nominalKKP)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Satker Terlibat */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Satker Aktif Digipay
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.uniqueSatkersWithTx} <span className="text-sm font-semibold text-slate-500">/ {stats.totalMasterCount} Satker</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (stats.uniqueSatkersWithTx / stats.totalMasterCount) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                {((stats.uniqueSatkersWithTx / stats.totalMasterCount) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Vendor & Merchant UMKM */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Vendor UMKM Terdaftar
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.uniqueVendorsCount} <span className="text-sm font-semibold text-slate-500">Mitra UMKM</span>
            </div>
            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ekosistem UMKM Lokal Semarang</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PODIUM / APRESIASI TOP 3 SATKER DIGIPAY TERBANYAK */}
      <div className={`p-6 sm:p-7 rounded-3xl border ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-gradient-to-br from-white to-slate-50 border-slate-200/80 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider mb-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>Peringkat 1, 2, &amp; 3 Transaksi Digipay Terbanyak</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Apresiasi Satuan Kerja Pelopor Digitalisasi Belanja
            </h2>
          </div>

          {/* Toggle Sort: By Count vs By Nominal */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start">
            <button
              onClick={() => setRankSortBy('count')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                rankSortBy === 'count'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              📈 Jumlah Transaksi
            </button>
            <button
              onClick={() => setRankSortBy('nominal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                rankSortBy === 'nominal'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              💰 Nominal Rupiah
            </button>
          </div>
        </div>

        {/* Top 3 Cards Grid / Empty State */}
        {topSatkers.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Belum Ada Data Transaksi Digipay
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Dashboard siap menampilkan monitoring dan peringkat transaksi Digipay (VA &amp; KKP). Silakan unggah laporan transaksi Excel melalui menu Admin Panel.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {handleGoToAdmin && (
                <button
                  type="button"
                  onClick={handleGoToAdmin}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  <span>Buka Admin Upload Digipay</span>
                </button>
              )}
              <button
                type="button"
                onClick={downloadDigipayTemplate}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Unduh Format Template</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
            {topSatkers.map((satker, idx) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;

              const badgeColor = isFirst
                ? 'from-amber-400 to-amber-600 text-slate-950 ring-amber-400/40'
                : isSecond
                ? 'from-slate-300 to-slate-400 text-slate-950 ring-slate-400/40'
                : 'from-amber-700 to-amber-900 text-white ring-amber-700/40';

              const borderColor = isFirst
                ? 'border-amber-400/60 dark:border-amber-500/40'
                : isSecond
                ? 'border-slate-300/80 dark:border-slate-700'
                : 'border-amber-700/40 dark:border-amber-900/50';

              return (
                <div
                  key={satker.kodeSatker}
                  className={`relative p-5 rounded-2xl border transition-all hover:shadow-lg flex flex-col justify-between ${borderColor} ${
                    isDark ? 'bg-slate-950/70' : 'bg-white'
                  }`}
                >
                  {/* Badge Rank */}
                  <div className="flex items-start justify-between gap-3">
                    <div className={`px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r ${badgeColor} shadow-md ring-2 flex items-center gap-1.5`}>
                      <Award className="w-3.5 h-3.5" />
                      <span>Peringkat {idx + 1}</span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      {satker.kodeSatker}
                    </span>
                  </div>

                  {/* Satker Name & KL */}
                  <div className="mt-4 mb-4">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2" title={satker.namaSatker}>
                      {satker.namaSatker}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {satker.kementerianLembaga}
                    </p>
                  </div>

                  {/* Key Numbers */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Total Belanja:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatRupiah(satker.totalSemuaNominal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Total Frekuensi:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {satker.totalSemuaTransaksi} Transaksi
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                      <span>VA: <strong>{satker.totalTransaksiVA}x</strong> ({formatRupiah(satker.totalNominalVA)})</span>
                      <span>KKP: <strong>{satker.totalTransaksiKKP}x</strong></span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 flex items-center">
                    <button
                      onClick={() => setSelectedSatkerSummary(satker)}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Lihat Rincian Transaksi</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. SUB-TAB SWITCHER & FILTER CONTROLS */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Sub tabs */}
          <div className="flex items-center overflow-x-auto gap-2 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700">
            <button
              onClick={() => { setActiveSubTab('rekap'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'rekap'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>1. Rekapitulasi Per Satker</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black">
                {satkerSummaries.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveSubTab('va'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'va'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>2. Pembayaran VA (Virtual Account)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black">
                {stats.totalVA}
              </span>
            </button>

            <button
              onClick={() => { setActiveSubTab('kkp'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'kkp'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>3. Pembayaran KKP Digipay</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black">
                {stats.totalKKP}
              </span>
            </button>

            <button
              onClick={() => { setActiveSubTab('ekosistem'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'ekosistem'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>4. Ekosistem Vendor &amp; Bank</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Cari kode/nama satker/vendor..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 shadow-sm"
            />
          </div>
        </div>

        {/* Secondary filters for Rekap Tab */}
        {activeSubTab === 'rekap' && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Status:</span>
            </div>
            {['ALL', 'Sangat Aktif', 'Aktif', 'Perlu Akselerasi'].map(st => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                {st === 'ALL' ? 'Semua Status' : st}
              </button>
            ))}

            {availableBanks.length > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Bank:</span>
                <select
                  value={bankFilter}
                  onChange={(e) => { setBankFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs rounded-lg px-2.5 py-1 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">Semua Bank</option>
                  {availableBanks.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. MAIN CONTENT TABLE / CARDS BASED ON ACTIVE SUB-TAB */}
      {activeSubTab === 'rekap' && (
        <div className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 text-center w-12">No</th>
                  <th className="py-3.5 px-4 w-28">Kode</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Nama Satuan Kerja</th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Pembayaran VA</th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Pembayaran KKP</th>
                  <th className="py-3.5 px-4 text-right min-w-[160px]">
                    <div className="flex items-center justify-end gap-1">
                      <span>Total Belanja (Rp)</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Status Keaktifan</th>
                  <th className="py-3.5 px-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <ShoppingBag className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
                      <p className="font-semibold">Tidak ditemukan data transaksi Digipay yang cocok dengan pencarian.</p>
                    </td>
                  </tr>
                ) : (
                  filteredSummaries
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((s, idx) => {
                      const rowNum = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr
                          key={s.kodeSatker}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                            {rowNum}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                              {s.kodeSatker}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {s.namaSatker}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {s.kementerianLembaga}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-black text-blue-600 dark:text-blue-400">
                              {s.totalTransaksiVA}x
                            </span>
                            <div className="text-[11px] text-slate-500">
                              {formatRupiah(s.totalNominalVA)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-black text-purple-600 dark:text-purple-400">
                              {s.totalTransaksiKKP}x
                            </span>
                            <div className="text-[11px] text-slate-500">
                              {formatRupiah(s.totalNominalKKP)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                              {formatRupiah(s.totalSemuaNominal)}
                            </div>
                            <div className="text-[11px] font-bold text-slate-500">
                              {s.totalSemuaTransaksi} Transaksi
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                              s.statusKeaktifan === 'Sangat Aktif'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : s.statusKeaktifan === 'Aktif'
                                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}>
                              {s.statusKeaktifan}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => setSelectedSatkerSummary(s)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                              title="Lihat Detail Transaksi"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Detail</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredSummaries.length > pageSize && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredSummaries.length)} dari {filteredSummaries.length} Satker
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-bold"
                >
                  Sebelumnya
                </button>
                <span className="px-3 py-1.5 font-bold text-slate-900 dark:text-white">
                  Hal {currentPage} / {Math.ceil(filteredSummaries.length / pageSize)}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredSummaries.length / pageSize), p + 1))}
                  disabled={currentPage >= Math.ceil(filteredSummaries.length / pageSize)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-bold"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. RAW TRANSACTIONS LIST FOR TAB VA OR TAB KKP */}
      {(activeSubTab === 'va' || activeSubTab === 'kkp') && (
        <div className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
              {activeSubTab === 'va' ? (
                <>
                  <Receipt className="w-4 h-4 text-blue-500" />
                  <span>Daftar Transaksi Belanja via Virtual Account (VA CMS)</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-purple-500" />
                  <span>Daftar Transaksi Belanja via Kartu Kredit Pemerintah (KKP)</span>
                </>
              )}
            </div>
            <span className="text-xs font-bold text-slate-500">
              Total {filteredRawRecords.length} Invoice / Pesanan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[130px]">No Order / ID</th>
                  <th className="py-3.5 px-4 min-w-[110px]">Tanggal</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Satuan Kerja</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Rekanan / Vendor UMKM</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Bank Mitra</th>
                  <th className="py-3.5 px-4 text-right min-w-[140px]">Nominal (Rp)</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Uraian Pengadaan / Belanja</th>
                  <th className="py-3.5 px-4 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRawRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold">Tidak ada data transaksi yang sesuai.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRawRecords
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((r, idx) => {
                      const rowNum = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                            {rowNum}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                            {r.noTransaksi || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {r.tglTransaksi}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {r.namaSatker}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {r.kodeSatker}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {r.namaVendor || 'Merchant UMKM'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">
                            {r.namaBank}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(r.nominalTransaksi)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                            <span className="line-clamp-2" title={r.uraianBarang}>
                              {r.uraianBarang || 'Pengadaan barang/jasa operasional'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              {r.statusTransaksi || 'Selesai'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredRawRecords.length > pageSize && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredRawRecords.length)} dari {filteredRawRecords.length} Transaksi
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-bold"
                >
                  Sebelumnya
                </button>
                <span className="px-3 py-1.5 font-bold text-slate-900 dark:text-white">
                  Hal {currentPage} / {Math.ceil(filteredRawRecords.length / pageSize)}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredRawRecords.length / pageSize), p + 1))}
                  disabled={currentPage >= Math.ceil(filteredRawRecords.length / pageSize)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 font-bold"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. EKOSISTEM VENDOR & BANK MITRA TAB */}
      {activeSubTab === 'ekosistem' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendor UMKM Teraktif */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Mitra Vendor UMKM Teraktif (Digipay Satu)
              </h3>
            </div>
            <div className="space-y-3">
              {topVendors.map((v, idx) => (
                <div
                  key={v.nama}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {v.nama}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Melayani {v.satkers.size} Satuan Kerja • {v.totalTx} Transaksi
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(v.totalNom)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sebaran Bank Mitra */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Landmark className="w-5 h-5 text-indigo-500" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Sebaran Transaksi Perbankan Mitra Himbara
              </h3>
            </div>
            <div className="space-y-4">
              {bankBreakdown.map((b) => {
                const percent = stats.totalNominal > 0 ? (b.totalNom / stats.totalNominal) * 100 : 0;
                return (
                  <div key={b.nama} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{b.nama}</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(b.totalNom)} ({percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 text-right">
                      {b.totalTx} Transaksi Berhasil
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL DETAIL TRANSAKSI SATKER TERPILIH */}
      {selectedSatkerSummary && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-3xl p-6 sm:p-7 border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg">
                  {selectedSatkerSummary.kodeSatker}
                </span>
                <h3 className="text-lg font-black mt-2 text-slate-900 dark:text-white">
                  {selectedSatkerSummary.namaSatker}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedSatkerSummary.kementerianLembaga}
                </p>
              </div>
              <button
                onClick={() => setSelectedSatkerSummary(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats Summary Modal */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs">
                <span className="text-slate-500">Total Belanja:</span>
                <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatRupiah(selectedSatkerSummary.totalSemuaNominal)}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs">
                <span className="text-slate-500">Total Transaksi:</span>
                <div className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {selectedSatkerSummary.totalSemuaTransaksi} Transaksi
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs col-span-2 sm:col-span-1">
                <span className="text-slate-500">Status Keaktifan:</span>
                <div className="text-sm font-black text-cyan-600 dark:text-cyan-400 mt-1">
                  {selectedSatkerSummary.statusKeaktifan}
                </div>
              </div>
            </div>

            {/* List Transactions of This Satker */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Riwayat Transaksi Satker Ini:
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {records
                  .filter(r => r.kodeSatker === selectedSatkerSummary.kodeSatker)
                  .map(r => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            r.tipePembayaran === 'VA'
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                              : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                          }`}>
                            {r.tipePembayaran === 'VA' ? 'Virtual Account' : 'KKP Digipay'}
                          </span>
                          <span className="font-mono font-bold text-slate-500">{r.noTransaksi}</span>
                          <span className="text-slate-400">• {r.tglTransaksi}</span>
                        </div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                          {r.namaVendor} ({r.namaBank})
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {r.uraianBarang}
                        </div>
                      </div>
                      <div className="text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatRupiah(r.nominalTransaksi)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setSelectedSatkerSummary(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs cursor-pointer shadow-sm transition-all"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
