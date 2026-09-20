import React, { useState, useMemo } from 'react';
import {
  SPMGajiRecord,
  SPMGajiUploadBatch,
  GajiSatkerBulanan,
  GajiIndukSummary,
  GajiIndukJenis,
  MasterSatker
} from '../../types';
import {
  aggregateGajiSatkerBulanan,
  calculateGajiIndukSummary,
  formatPeriodeGaji,
  formatDisplayDate
} from '../../utils/gajiIndukExcelParser';
import {
  formatRupiahGaji,
  exportPdfSatkerBelumGaji,
  exportPdfRekapitulasiGaji,
  exportPdfPerubahanJumlahSpm,
  exportPdfHistorySatkerGaji,
  exportGajiIndukExcel
} from '../../utils/gajiIndukExportHelper';
import {
  Coins,
  Search,
  Filter,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  Calendar,
  History,
  Info,
  ChevronRight,
  Eye,
  FileText,
  Clock,
  Layers,
  Sparkles,
  ArrowUpDown,
  X
} from 'lucide-react';

interface GajiIndukDashboardProps {
  records: SPMGajiRecord[];
  uploads: SPMGajiUploadBatch[];
  masterSatkers: MasterSatker[];
  isAdminAuthenticated?: boolean;
  isDark?: boolean;
  onGoToAdminUpload?: () => void;
}

export const GajiIndukDashboard: React.FC<GajiIndukDashboardProps> = ({
  records,
  uploads,
  masterSatkers,
  isAdminAuthenticated = false,
  isDark = false,
  onGoToAdminUpload
}) => {
  // State Filter Utama
  const [selectedPeriode, setSelectedPeriode] = useState<string>('2026-08');
  const [selectedJenisGaji, setSelectedJenisGaji] = useState<'ALL' | GajiIndukJenis>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'SUDAH' | 'BELUM' | 'BERUBAH'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'semua' | 'belum' | 'berubah' | 'tren'>('semua');

  // Modal State
  const [selectedSatkerDetail, setSelectedSatkerDetail] = useState<GajiSatkerBulanan | null>(null);
  const [selectedSpmDetail, setSelectedSpmDetail] = useState<SPMGajiRecord | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Daftar periode yang tersedia dari data atau default 3 bulan
  const availablePeriods = useMemo(() => {
    const periodSet = new Set<string>(['2026-08', '2026-07', '2026-06']);
    records.forEach(r => {
      if (r.periodeKey) periodSet.add(r.periodeKey);
    });
    return Array.from(periodSet).sort().reverse();
  }, [records]);

  // Agregasi Bulanan untuk periode aktif
  const aggregatedData = useMemo(() => {
    return aggregateGajiSatkerBulanan(
      records,
      masterSatkers,
      selectedPeriode,
      selectedJenisGaji
    );
  }, [records, masterSatkers, selectedPeriode, selectedJenisGaji]);

  // Ringkasan KPI
  const summary: GajiIndukSummary = useMemo(() => {
    return calculateGajiIndukSummary(records, masterSatkers, selectedPeriode);
  }, [records, masterSatkers, selectedPeriode]);

  // Filtered List berdasarkan Search & Status
  const filteredData = useMemo(() => {
    return aggregatedData.filter(item => {
      // Filter status
      if (selectedStatus === 'SUDAH' && item.statusPengiriman !== 'SUDAH_MENGIRIM') return false;
      if (selectedStatus === 'BELUM' && item.statusPengiriman !== 'BELUM_MENGIRIM') return false;
      if (selectedStatus === 'BERUBAH' && (item.arahPerubahan !== 'NAIK' && item.arahPerubahan !== 'TURUN')) return false;

      // Filter tab
      if (activeTab === 'belum' && item.statusPengiriman !== 'BELUM_MENGIRIM') return false;
      if (activeTab === 'berubah' && item.arahPerubahan !== 'NAIK' && item.arahPerubahan !== 'TURUN') return false;

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchSatker = item.kodeSatker.toLowerCase().includes(q) || item.namaSatker.toLowerCase().includes(q);
      const matchSpm = item.records.some(r =>
        (r.noSpp && r.noSpp.toLowerCase().includes(q)) ||
        (r.uraian && r.uraian.toLowerCase().includes(q)) ||
        (r.sp2d && r.sp2d.toLowerCase().includes(q))
      );
      return matchSatker || matchSpm;
    });
  }, [aggregatedData, selectedStatus, activeTab, searchQuery]);

  // Daftar Satker Belum Mengirim
  const satkerBelumList = useMemo(() => {
    return aggregatedData.filter(s => s.statusPengiriman === 'BELUM_MENGIRIM');
  }, [aggregatedData]);

  // Daftar Satker Perubahan SPM
  const satkerBerubahList = useMemo(() => {
    return aggregatedData.filter(s => s.arahPerubahan === 'NAIK' || s.arahPerubahan === 'TURUN');
  }, [aggregatedData]);

  return (
    <div className={`space-y-6 pb-12 transition-colors duration-200 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Coins className="w-3.5 h-3.5" />
              <span>Monitoring Proses SPM Gaji Induk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Monitoring Gaji Induk PNS &amp; PPPK
            </h1>
            <p className="text-sm text-emerald-100/80 max-w-2xl">
              Pantau kepatuhan penyampaian SPM Gaji Induk per Satker, deteksi satker belum mengirim,
              analisis riwayat dan perubahan jumlah SPM antarbulan Juni, Juli, hingga Agustus secara akurat.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {isAdminAuthenticated && onGoToAdminUpload && (
              <button
                onClick={onGoToAdminUpload}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md cursor-pointer"
                title="Buka menu Admin untuk mengunggah file Excel Gaji Induk baru"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Upload Excel (Admin)</span>
              </button>
            )}
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all shadow-sm backdrop-blur-md cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span>Cetak PDF</span>
            </button>
            <button
              onClick={() => exportGajiIndukExcel(aggregatedData, selectedPeriode)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Periode */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Periode SPM
            </label>
            <div className="relative">
              <select
                value={selectedPeriode}
                onChange={e => setSelectedPeriode(e.target.value)}
                className={`w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                }`}
              >
                {availablePeriods.map(p => (
                  <option key={p} value={p}>
                    {formatPeriodeGaji(p)}
                  </option>
                ))}
              </select>
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Jenis Gaji */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Jenis Gaji
            </label>
            <div className="relative">
              <select
                value={selectedJenisGaji}
                onChange={e => setSelectedJenisGaji(e.target.value as any)}
                className={`w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                }`}
              >
                <option value="ALL">Semua Jenis Gaji</option>
                <option value="PNS">Gaji Induk PNS</option>
                <option value="PPPK">Gaji Induk PPPK/P3K</option>
              </select>
              <Coins className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Status Pengiriman */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Status Pengiriman
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value as any)}
                className={`w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                }`}
              >
                <option value="ALL">Semua Status</option>
                <option value="SUDAH">Sudah Mengirim</option>
                <option value="BELUM">Belum Mengirim</option>
                <option value="BERUBAH">Jumlah SPM Berubah</option>
              </select>
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Pencarian Satker / SPM
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari Satker / No SPP / SP2D..."
                className={`w-full pl-9 pr-8 py-2.5 rounded-xl border text-sm transition-all ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                }`}
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI STAT CARDS (CLICKABLE) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Satker Wajib */}
        <div
          onClick={() => { setSelectedStatus('ALL'); setActiveTab('semua'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'semua' && selectedStatus === 'ALL'
              ? 'ring-2 ring-emerald-500 shadow-md'
              : 'hover:shadow-md'
          } ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Satker Wajib
            </span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {summary.totalSatkerWajib}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {summary.totalSpm} SPM Terbit ({formatRupiahGaji(summary.totalPembayaran)})
          </div>
        </div>

        {/* Sudah Mengirim */}
        <div
          onClick={() => { setSelectedStatus('SUDAH'); setActiveTab('semua'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'SUDAH'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
              : 'hover:shadow-md'
          } ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Sudah Mengirim
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {summary.sudahKirim}
          </div>
          <div className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
            {summary.totalSatkerWajib > 0 ? Math.round((summary.sudahKirim / summary.totalSatkerWajib) * 100) : 0}% Tingkat Penyampaian
          </div>
        </div>

        {/* Belum Mengirim */}
        <div
          onClick={() => { setSelectedStatus('BELUM'); setActiveTab('belum'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'belum' || selectedStatus === 'BELUM'
              ? 'ring-2 ring-rose-500 bg-rose-50/50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
              : 'hover:shadow-md'
          } ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Belum Mengirim
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            {summary.belumKirim}
          </div>
          <div className="mt-1 text-xs text-rose-700/80 dark:text-rose-400/80">
            {summary.belumKirim > 0 ? 'Perlu Segera Diingatkan KPPN' : 'Semua Satker Telah Mengirim'}
          </div>
        </div>

        {/* Jumlah SPM Berubah */}
        <div
          onClick={() => { setSelectedStatus('BERUBAH'); setActiveTab('berubah'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'berubah' || selectedStatus === 'BERUBAH'
              ? 'ring-2 ring-amber-500 bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
              : 'hover:shadow-md'
          } ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Jumlah SPM Berubah
            </span>
            <ArrowUpDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {satkerBerubahList.length}
          </div>
          <div className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/80">
            Perlu Pantau Perubahan Volume
          </div>
        </div>
      </div>

      {/* RINCIAN PER JENIS GAJI (PNS vs PPPK) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card PNS */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                Gaji Induk PNS
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
              {summary.pnsTotalSpm} SPM
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div className="text-[11px] text-slate-500 font-medium">Satker Wajib</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{summary.pnsWajib}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">Sudah Kirim</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{summary.pnsSudah}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40">
              <div className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">Belum Kirim</div>
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">{summary.pnsBelum}</div>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-right">
            Total Pembayaran: <strong className="text-slate-700 dark:text-slate-200">{formatRupiahGaji(summary.pnsTotalPembayaran)}</strong>
          </div>
        </div>

        {/* Card PPPK */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                Gaji Induk PPPK / P3K
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-300">
              {summary.pppkTotalSpm} SPM
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div className="text-[11px] text-slate-500 font-medium">Satker Wajib</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{summary.pppkWajib}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">Sudah Kirim</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{summary.pppkSudah}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40">
              <div className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">Belum Kirim</div>
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">{summary.pppkBelum}</div>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-right">
            Total Pembayaran: <strong className="text-slate-700 dark:text-slate-200">{formatRupiahGaji(summary.pppkTotalPembayaran)}</strong>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS DALAM DASHBOARD */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('semua')}
          className={`pb-3 px-4 font-bold text-sm transition-all whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'semua'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Daftar Seluruh Satker ({aggregatedData.length})
        </button>

        <button
          onClick={() => setActiveTab('belum')}
          className={`pb-3 px-4 font-bold text-sm transition-all whitespace-nowrap cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'belum'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400 dark:border-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span>🚨 Belum Mengirim</span>
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
            {satkerBelumList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('berubah')}
          className={`pb-3 px-4 font-bold text-sm transition-all whitespace-nowrap cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'berubah'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 dark:border-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span>📊 Perubahan Jumlah SPM</span>
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
            {satkerBerubahList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tren')}
          className={`pb-3 px-4 font-bold text-sm transition-all whitespace-nowrap cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'tren'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span>📈 Riwayat &amp; Tren Bulanan</span>
        </button>
      </div>

      {/* TAB CONTENT: TABEL BELUM MENGIRIM */}
      {activeTab === 'belum' && (
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-rose-900 dark:text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>🚨 Daftar Satker Belum Menyampaikan Gaji Induk Periode {formatPeriodeGaji(selectedPeriode)}</span>
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                Satker-satker berikut tercatat belum memproses SPM Gaji Induk. Klik baris untuk melihat riwayat bulan sebelumnya.
              </p>
            </div>
            <button
              onClick={() => exportPdfSatkerBelumGaji(aggregatedData, selectedPeriode, selectedJenisGaji)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Daftar Belum Kirim (PDF)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3.5 text-center">No</th>
                  <th className="py-3 px-3.5">Kode Satker</th>
                  <th className="py-3 px-3.5">Nama Satuan Kerja</th>
                  <th className="py-3 px-3.5 text-center">KPPN</th>
                  <th className="py-3 px-3.5 text-center">Jenis Gaji</th>
                  <th className="py-3 px-3.5 text-center">Periode</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5 text-center">SPM Bulan Ini</th>
                  <th className="py-3 px-3.5 text-center">SPM Bulan Lalu</th>
                  <th className="py-3 px-3.5 text-center">Perubahan</th>
                  <th className="py-3 px-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {satkerBelumList.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-bold text-slate-600 dark:text-slate-300">Hebat! Seluruh Satker telah menyampaikan Gaji Induk pada periode ini.</p>
                    </td>
                  </tr>
                ) : (
                  satkerBelumList.map((item, idx) => (
                    <tr
                      key={`${item.kodeSatker}-${item.jenisGaji}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-3.5 text-center text-xs text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3.5 font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">
                        {item.kodeSatker}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-200">
                        {item.namaSatker}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono text-xs">{item.kodeKppn}</td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          item.jenisGaji === 'PPPK'
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {item.jenisGaji === 'PPPK' ? 'Gaji PPPK' : 'Gaji PNS'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center text-xs">{item.periodeFormatted}</td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          BELUM MENGIRIM
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-rose-600">
                        {item.jumlahSpm}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono text-slate-500">
                        {item.jumlahSpmBulanLalu !== null ? item.jumlahSpmBulanLalu : '-'}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold">
                        {item.selisihSpm !== null ? (
                          <span className="text-rose-600">{item.selisihSpm}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={() => setSelectedSatkerDetail(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <History className="w-3 h-3" />
                          <span>History</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TABEL PERUBAHAN JUMLAH SPM */}
      {activeTab === 'berubah' && (
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-100 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-amber-600" />
                <span>📊 Analisis Perubahan Jumlah SPM Antarbulan ({formatPeriodeGaji(selectedPeriode)})</span>
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Mendeteksi satker yang volume SPM-nya naik atau turun dibandingkan bulan sebelumnya untuk pemantauan KPPN.
              </p>
            </div>
            <button
              onClick={() => exportPdfPerubahanJumlahSpm(aggregatedData, selectedPeriode)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Perubahan SPM (PDF)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3.5 text-center">No</th>
                  <th className="py-3 px-3.5">Kode Satker</th>
                  <th className="py-3 px-3.5">Nama Satuan Kerja</th>
                  <th className="py-3 px-3.5 text-center">Jenis Gaji</th>
                  <th className="py-3 px-3.5 text-center">SPM Bulan Lalu</th>
                  <th className="py-3 px-3.5 text-center">SPM Bulan Ini</th>
                  <th className="py-3 px-3.5 text-center">Selisih</th>
                  <th className="py-3 px-3.5 text-center">Arah Perubahan</th>
                  <th className="py-3 px-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {satkerBerubahList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      <p className="font-bold">Tidak ada perubahan jumlah SPM antara periode ini dengan bulan sebelumnya.</p>
                    </td>
                  </tr>
                ) : (
                  satkerBerubahList.map((item, idx) => (
                    <tr
                      key={`${item.kodeSatker}-${item.jenisGaji}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-3.5 text-center text-xs text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3.5 font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">
                        {item.kodeSatker}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-200">
                        {item.namaSatker}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          item.jenisGaji === 'PPPK'
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {item.jenisGaji === 'PPPK' ? 'PPPK' : 'PNS'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold">
                        {item.jumlahSpmBulanLalu}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold">
                        {item.jumlahSpm}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-black">
                        {item.selisihSpm !== null && item.selisihSpm > 0 ? (
                          <span className="text-emerald-600">+{item.selisihSpm}</span>
                        ) : (
                          <span className="text-rose-600">{item.selisihSpm}</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {item.arahPerubahan === 'NAIK' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <TrendingUp className="w-3 h-3" />
                            <span>NAIK</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            <TrendingDown className="w-3 h-3" />
                            <span>TURUN</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={() => setSelectedSatkerDetail(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TABEL SEMUA SATKER */}
      {activeTab === 'semua' && (
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Daftar Monitoring Penyampaian Gaji Induk
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Menampilkan <strong>{filteredData.length}</strong> data Satker periode {formatPeriodeGaji(selectedPeriode)}. Klik baris atau tombol detail untuk rincian SPM.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Aktif:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold">
                {selectedJenisGaji === 'ALL' ? 'Semua Jenis' : selectedJenisGaji}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3 text-center">No</th>
                  <th className="py-3 px-3">Kode Satker</th>
                  <th className="py-3 px-4">Nama Satuan Kerja</th>
                  <th className="py-3 px-3 text-center">Jenis</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Jumlah SPM</th>
                  <th className="py-3 px-3 text-right">Total Pembayaran</th>
                  <th className="py-3 px-3 text-center">SP2D Terakhir</th>
                  <th className="py-3 px-3 text-center">Status SP2D</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400">
                      <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600 dark:text-slate-400">Tidak ada data Satker yang cocok dengan filter pencarian.</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <tr
                      key={`${item.kodeSatker}-${item.jenisGaji}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-xs text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">
                        {item.kodeSatker}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {item.namaSatker}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          item.jenisGaji === 'PPPK'
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {item.jenisGaji === 'PPPK' ? 'PPPK' : 'PNS'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.statusPengiriman === 'SUDAH_MENGIRIM' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>SUDAH</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            <AlertTriangle className="w-3 h-3" />
                            <span>BELUM</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                        <button
                          onClick={() => setSelectedSatkerDetail(item)}
                          className="hover:underline text-emerald-600 dark:text-emerald-400 cursor-pointer font-extrabold"
                          title="Klik untuk melihat rincian record SPM"
                        >
                          {item.jumlahSpm} SPM
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                        {formatRupiahGaji(item.totalPembayaran)}
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-slate-500">
                        {item.tglSp2dTerakhir ? formatDisplayDate(item.tglSp2dTerakhir) : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          item.statusSp2dSummary === 'SP2D ADA'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.statusSp2dSummary === 'SPM ADA'
                            ? 'bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                            : item.statusSp2dSummary === 'SP2D BELUM ADA'
                            ? 'bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.statusSp2dSummary}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedSatkerDetail(item)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: RIWAYAT & TREN BULANAN */}
      {activeTab === 'tren' && (
        <div className={`rounded-2xl border shadow-sm p-6 space-y-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Perbandingan &amp; Tren Volume SPM Bulanan (Juni, Juli, Agustus 2026)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Visualisasi perbandingan jumlah SPM dan satker aktif antarperiode pelaporan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['2026-06', '2026-07', '2026-08'].map(pKey => {
              const pSummary = calculateGajiIndukSummary(records, masterSatkers, pKey);
              const isCurrent = pKey === selectedPeriode;
              return (
                <div
                  key={pKey}
                  onClick={() => setSelectedPeriode(pKey)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'hover:shadow-md'
                  } ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                      {formatPeriodeGaji(pKey)}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                        Aktif
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mt-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total SPM:</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">{pSummary.totalSpm} SPM</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gaji Induk PNS:</span>
                      <strong className="font-mono">{pSummary.pnsTotalSpm} SPM ({pSummary.pnsSudah} Satker)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gaji Induk PPPK:</span>
                      <strong className="font-mono">{pSummary.pppkTotalSpm} SPM ({pSummary.pppkSudah} Satker)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Satker Belum:</span>
                      <strong className="font-mono text-rose-600">{pSummary.belumKirim} Satker</strong>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500">Total Nominal:</span>
                      <strong className="font-mono text-slate-800 dark:text-slate-200">{formatRupiahGaji(pSummary.totalPembayaran)}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DETAIL & RIWAYAT SATKER */}
      {selectedSatkerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/10 border border-white/20">
                  <Building2 className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold leading-tight">
                    {selectedSatkerDetail.namaSatker}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-emerald-200/90 mt-0.5 font-mono">
                    <span>Kode Satker: {selectedSatkerDetail.kodeSatker}</span>
                    <span>•</span>
                    <span>KPPN: {selectedSatkerDetail.kodeKppn} Semarang I</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSatkerDetail(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* 1. Riwayat Antar-Bulan Satker */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>Riwayat Bulanan Pengiriman SPM Gaji Induk (Database Aktual)</span>
                </h4>
                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Bulan</th>
                        <th className="py-2.5 px-3 text-center">Gaji PNS</th>
                        <th className="py-2.5 px-3 text-center">SPM PNS</th>
                        <th className="py-2.5 px-3 text-center">Gaji PPPK</th>
                        <th className="py-2.5 px-3 text-center">SPM PPPK</th>
                        <th className="py-2.5 px-3 text-right">Total Pembayaran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                      {['2026-06', '2026-07', '2026-08'].map(pKey => {
                        const pnsRecs = records.filter(
                          r => r.kodeSatker === selectedSatkerDetail.kodeSatker && r.periodeKey === pKey && r.jenisGaji === 'PNS'
                        );
                        const pppkRecs = records.filter(
                          r => r.kodeSatker === selectedSatkerDetail.kodeSatker && r.periodeKey === pKey && r.jenisGaji === 'PPPK'
                        );
                        const totalBayar = [...pnsRecs, ...pppkRecs].reduce((acc, r) => acc + (r.jmlPembayaran || 0), 0);

                        return (
                          <tr key={pKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-bold">{formatPeriodeGaji(pKey)}</td>
                            <td className="py-2.5 px-3 text-center">
                              {pnsRecs.length > 0 ? (
                                <span className="px-2 py-0.5 rounded text-emerald-700 bg-emerald-50 dark:bg-emerald-950 font-bold">Ada</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-rose-700 bg-rose-50 dark:bg-rose-950 font-bold">Belum</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold">{pnsRecs.length}</td>
                            <td className="py-2.5 px-3 text-center">
                              {pppkRecs.length > 0 ? (
                                <span className="px-2 py-0.5 rounded text-teal-700 bg-teal-50 dark:bg-teal-950 font-bold">Ada</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold">{pppkRecs.length}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                              {totalBayar > 0 ? formatRupiahGaji(totalBayar) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Rincian Record SPM Bulan Berjalan */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Rincian Record SPM Periode {selectedSatkerDetail.periodeFormatted} ({selectedSatkerDetail.records.length} SPM)</span>
                  </h4>
                </div>

                {selectedSatkerDetail.records.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed text-center text-slate-400 text-xs">
                    Belum ada record SPM untuk periode ini.
                  </div>
                ) : (
                  <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold uppercase">
                        <tr>
                          <th className="py-2.5 px-3">No</th>
                          <th className="py-2.5 px-3">No SPP</th>
                          <th className="py-2.5 px-3">Jenis SPP</th>
                          <th className="py-2.5 px-3">Tgl SPM</th>
                          <th className="py-2.5 px-3 text-right">Jumlah Pembayaran</th>
                          <th className="py-2.5 px-3 text-center">No SP2D</th>
                          <th className="py-2.5 px-3 text-center">Status SPAN</th>
                          <th className="py-2.5 px-3 text-center">Rincian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                        {selectedSatkerDetail.records.map((r, sIdx) => (
                          <tr key={r.id || sIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 text-slate-400">{sIdx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">{r.noSpp}</td>
                            <td className="py-2.5 px-3">{r.jenisSpp}</td>
                            <td className="py-2.5 px-3 text-slate-500">{formatDisplayDate(r.tglCetakSpm)}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">{formatRupiahGaji(r.jmlPembayaran)}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-[11px]">{r.sp2d || '-'}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                {r.statusSpan || r.statusSpm || 'PROSES'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => setSelectedSpmDetail(r)}
                                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[11px] font-bold cursor-pointer"
                              >
                                Lihat
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <button
                onClick={() => exportPdfHistorySatkerGaji(selectedSatkerDetail, records)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Riwayat Satker (PDF)</span>
              </button>

              <button
                onClick={() => setSelectedSatkerDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL LENGKAP RECORD SPM (48 FIELD) */}
      {selectedSpmDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Detail Record SPM: {selectedSpmDetail.noSpp} ({selectedSpmDetail.jenisSpp})</span>
              </h3>
              <button
                onClick={() => setSelectedSpmDetail(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div><strong>Kode Satker:</strong> {selectedSpmDetail.kodeSatker}</div>
                <div><strong>Nama Satker:</strong> {selectedSpmDetail.namaSatker}</div>
                <div><strong>Kode KPPN:</strong> {selectedSpmDetail.kodeKppn}</div>
                <div><strong>Jenis Gaji:</strong> {selectedSpmDetail.jenisGaji === 'PPPK' ? 'PPPK/P3K' : 'PNS'}</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <strong className="block text-slate-500 mb-1">Uraian Pembayaran:</strong>
                <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {selectedSpmDetail.uraian || '-'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40">
                  <div className="text-slate-500">Pengeluaran:</div>
                  <strong className="text-sm font-mono">{formatRupiahGaji(selectedSpmDetail.jmlPengeluaran)}</strong>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40">
                  <div className="text-slate-500">Potongan:</div>
                  <strong className="text-sm font-mono text-rose-600">{formatRupiahGaji(selectedSpmDetail.jmlPotongan)}</strong>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                  <div className="text-slate-500">Pembayaran Bersih:</div>
                  <strong className="text-sm font-mono text-emerald-600">{formatRupiahGaji(selectedSpmDetail.jmlPembayaran)}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div><span className="text-slate-500">Tgl Cetak SPP:</span> <div>{formatDisplayDate(selectedSpmDetail.tglCetakSpp)}</div></div>
                <div><span className="text-slate-500">Tgl Cetak SPM:</span> <div>{formatDisplayDate(selectedSpmDetail.tglCetakSpm)}</div></div>
                <div><span className="text-slate-500">No SP2D:</span> <div className="font-mono font-bold">{selectedSpmDetail.sp2d || '-'}</div></div>
                <div><span className="text-slate-500">Tgl SP2D:</span> <div>{formatDisplayDate(selectedSpmDetail.tglSp2d)}</div></div>
                <div><span className="text-slate-500">Status KPPN:</span> <div>{selectedSpmDetail.statusKppn || '-'}</div></div>
                <div><span className="text-slate-500">Status SPAN:</span> <div>{selectedSpmDetail.statusSpan || '-'}</div></div>
                <div><span className="text-slate-500">No File ADK:</span> <div className="font-mono">{selectedSpmDetail.noFileAdk || '-'}</div></div>
                <div><span className="text-slate-500">Nama Petugas:</span> <div>{selectedSpmDetail.petugas || '-'}</div></div>
                <div><span className="text-slate-500">NIP PPSPM:</span> <div>{selectedSpmDetail.nipPpspm || '-'}</div></div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedSpmDetail(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CETAK PDF PILIHAN */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-extrabold text-base text-emerald-600">
                <Printer className="w-5 h-5" />
                <span>Pusat Cetak Dokumen Resmi Gaji Induk</span>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 my-4">
              Pilih format dokumen resmi yang ingin Anda cetak atau unduh dalam format PDF:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  exportPdfSatkerBelumGaji(aggregatedData, selectedPeriode, selectedJenisGaji);
                  setIsPdfModalOpen(false);
                }}
                className="w-full p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <strong className="block text-sm text-rose-900 dark:text-rose-200">
                    1. Daftar Satker Belum Mengirim Gaji Induk
                  </strong>
                  <span className="text-xs text-rose-700 dark:text-rose-300">
                    Mencetak seluruh satker yang belum menyampaikan SPM ({satkerBelumList.length} Satker)
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-rose-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  exportPdfPerubahanJumlahSpm(aggregatedData, selectedPeriode);
                  setIsPdfModalOpen(false);
                }}
                className="w-full p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <strong className="block text-sm text-amber-900 dark:text-amber-200">
                    2. Daftar Satker dengan Perubahan Volume SPM
                  </strong>
                  <span className="text-xs text-amber-700 dark:text-amber-300">
                    Analisis satker yang jumlah SPM-nya naik atau turun dibanding bulan lalu
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  exportPdfRekapitulasiGaji(aggregatedData, summary, selectedPeriode);
                  setIsPdfModalOpen(false);
                }}
                className="w-full p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <strong className="block text-sm text-emerald-900 dark:text-emerald-200">
                    3. Rekapitulasi Lengkap Seluruh Satuan Kerja
                  </strong>
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">
                    Ringkasan eksekutif seluruh satker beserta nominal belanja dan status SP2D
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
