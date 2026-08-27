import React, { useState, useMemo } from 'react';
import { DeviasiHal3Record } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Sliders, 
  Search, 
  Building2, 
  ArrowRight,
  Sparkles,
  Info,
  Coins,
  FileSpreadsheet,
  ChevronRight,
  Filter
} from 'lucide-react';

interface DeviasiHal3OverviewWidgetProps {
  records?: DeviasiHal3Record[];
  isVisible: boolean;
  onToggleVisibility: (visible: boolean) => void;
  onGoToFullDashboard?: () => void;
  onGoToUpload?: () => void;
  isDark?: boolean;
}

export const DeviasiHal3OverviewWidget: React.FC<DeviasiHal3OverviewWidgetProps> = ({
  records = [],
  isVisible,
  onToggleVisibility,
  onGoToFullDashboard,
  onGoToUpload,
  isDark = false
}) => {
  const [selectedPeriode, setSelectedPeriode] = useState<string>('ALL');
  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'WARNING' | 'BLOKIR' | 'SAFE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  // Extract all available periods
  const availablePeriodes = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.periodeFormatted) set.add(r.periodeFormatted);
      else if (r.periodeBulan) set.add(r.periodeBulan);
      else if (r.periodeAngka) set.add(`Periode ${r.periodeAngka}`);
    });
    return Array.from(set).sort();
  }, [records]);

  // Filter records by selected period
  const periodFilteredRecords = useMemo(() => {
    if (selectedPeriode === 'ALL') return records;
    return records.filter(r => 
      (r.periodeFormatted && r.periodeFormatted === selectedPeriode) ||
      (r.periodeBulan && r.periodeBulan === selectedPeriode) ||
      (r.periodeAngka && `Periode ${r.periodeAngka}` === selectedPeriode)
    );
  }, [records, selectedPeriode]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCount = periodFilteredRecords.length;
    let tertibCount = 0;
    let warningCount = 0;
    let fullBlokirCount = 0;
    let totalRpd = 0;
    let totalRealisasi = 0;
    let totalDeviasiNominal = 0;

    // Per akun stats
    let totalDev51 = 0, sumPersen51 = 0, count51 = 0;
    let totalDev52 = 0, sumPersen52 = 0, count52 = 0;
    let totalDev53 = 0, sumPersen53 = 0, count53 = 0;
    let totalDev57 = 0, sumPersen57 = 0, count57 = 0;

    periodFilteredRecords.forEach(r => {
      const devPersen = r.persenDeviasiTotal ?? (
        r.rpdTotal > 0 ? (Math.abs((r.realisasiTotal || 0) - r.rpdTotal) / r.rpdTotal) * 100 : 0
      );
      const devNominal = r.deviasiNominalTotal ?? Math.abs((r.realisasiTotal || 0) - (r.rpdTotal || 0));

      totalRpd += (r.rpdTotal || 0);
      totalRealisasi += (r.realisasiTotal || 0);
      totalDeviasiNominal += devNominal;

      if (devPersen <= 5.0) {
        tertibCount++;
      } else {
        warningCount++;
      }

      const kUpper = (r.klasifikasiSatker || '').toUpperCase();
      if (kUpper.includes('FULL BLOKIR') && !kUpper.startsWith('NON')) {
        fullBlokirCount++;
      }

      // Akun 51
      const b51 = r.rincianJenisBelanja?.belanja51 || r.rincianJenisBelanja?.belanjaPegawai;
      if (b51 && (b51.rpd > 0 || b51.realisasi > 0)) {
        count51++;
        totalDev51 += (b51.deviasiNominal || 0);
        sumPersen51 += (b51.persenDeviasi || 0);
      }

      // Akun 52
      const b52 = r.rincianJenisBelanja?.belanja52 || r.rincianJenisBelanja?.belanjaBarang;
      if (b52 && (b52.rpd > 0 || b52.realisasi > 0)) {
        count52++;
        totalDev52 += (b52.deviasiNominal || 0);
        sumPersen52 += (b52.persenDeviasi || 0);
      }

      // Akun 53
      const b53 = r.rincianJenisBelanja?.belanja53 || r.rincianJenisBelanja?.belanjaModal;
      if (b53 && (b53.rpd > 0 || b53.realisasi > 0)) {
        count53++;
        totalDev53 += (b53.deviasiNominal || 0);
        sumPersen53 += (b53.persenDeviasi || 0);
      }

      // Akun 57
      const b57 = r.rincianJenisBelanja?.belanja57 || r.rincianJenisBelanja?.belanjaBansos;
      if (b57 && (b57.rpd > 0 || b57.realisasi > 0)) {
        count57++;
        totalDev57 += (b57.deviasiNominal || 0);
        sumPersen57 += (b57.persenDeviasi || 0);
      }
    });

    const avgDeviasiOverall = totalRpd > 0 ? (totalDeviasiNominal / totalRpd) * 100 : 0;

    return {
      totalCount,
      tertibCount,
      tertibPercent: totalCount > 0 ? (tertibCount / totalCount) * 100 : 0,
      warningCount,
      warningPercent: totalCount > 0 ? (warningCount / totalCount) * 100 : 0,
      fullBlokirCount,
      totalRpd,
      totalRealisasi,
      totalDeviasiNominal,
      avgDeviasiOverall,
      akun51: { count: count51, totalDev: totalDev51, avgPersen: count51 > 0 ? sumPersen51 / count51 : 0 },
      akun52: { count: count52, totalDev: totalDev52, avgPersen: count52 > 0 ? sumPersen52 / count52 : 0 },
      akun53: { count: count53, totalDev: totalDev53, avgPersen: count53 > 0 ? sumPersen53 / count53 : 0 },
      akun57: { count: count57, totalDev: totalDev57, avgPersen: count57 > 0 ? sumPersen57 / count57 : 0 },
    };
  }, [periodFilteredRecords]);

  // Tab & Search filtered records for the mini table
  const displayedSatkers = useMemo(() => {
    return periodFilteredRecords
      .filter(r => {
        const devPersen = r.persenDeviasiTotal ?? (
          r.rpdTotal > 0 ? (Math.abs((r.realisasiTotal || 0) - r.rpdTotal) / r.rpdTotal) * 100 : 0
        );
        const kUpper = (r.klasifikasiSatker || '').toUpperCase();
        const isFullBlokir = kUpper.includes('FULL BLOKIR') && !kUpper.startsWith('NON');

        if (activeFilterTab === 'WARNING' && devPersen <= 5.0) return false;
        if (activeFilterTab === 'SAFE' && devPersen > 5.0) return false;
        if (activeFilterTab === 'BLOKIR' && !isFullBlokir) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = (r.kodeSatker || '').toLowerCase().includes(q);
          const matchName = (r.namaSatker || '').toLowerCase().includes(q);
          const matchKl = (r.kementerianLembaga || '').toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchKl) return false;
        }

        return true;
      })
      .sort((a, b) => (b.persenDeviasiTotal || 0) - (a.persenDeviasiTotal || 0));
  }, [periodFilteredRecords, activeFilterTab, searchQuery]);

  const totalPages = Math.ceil(displayedSatkers.length / pageSize) || 1;
  const paginatedSatkers = displayedSatkers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatRupiah = (num: number) => {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
  };

  const formatRupiahSingkat = (num: number) => {
    if (!num) return 'Rp 0';
    if (Math.abs(num) >= 1_000_000_000) {
      return `Rp ${(num / 1_000_000_000).toFixed(2)} M`;
    }
    if (Math.abs(num) >= 1_000_000) {
      return `Rp ${(num / 1_000_000).toFixed(1)} Jt`;
    }
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const renderKlasifikasiBadge = (klasifikasi?: string) => {
    if (!klasifikasi) return null;
    const kUpper = klasifikasi.toUpperCase();
    const isFullBlokir = kUpper.includes('FULL BLOKIR') && !kUpper.startsWith('NON');
    const isNonFullBlokir = kUpper.startsWith('NON') || kUpper.includes('NON FULL');

    if (isFullBlokir) {
      return (
        <span 
          title="Satker dengan status FULL BLOKIR pada Halaman III DIPA"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 text-[10px] font-black border border-rose-300 dark:border-rose-800 shadow-2xs whitespace-nowrap"
        >
          <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{klasifikasi}</span>
        </span>
      );
    }

    if (isNonFullBlokir) {
      return (
        <span 
          title="Satker Non Full Blokir"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800/80 whitespace-nowrap"
        >
          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{klasifikasi}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 whitespace-nowrap">
        {klasifikasi}
      </span>
    );
  };

  // -------------------------------------------------------------
  // RENDER: Collapsed State Banner (When deactivated)
  // -------------------------------------------------------------
  if (!isVisible) {
    return (
      <div className={`rounded-2xl border p-4 transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Widget Monitoring Deviasi Halaman III DIPA
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                  Status: Nonaktif
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                Widget dinonaktifkan di Beranda. Aktifkan untuk memantau selisih RPD vs Realisasi dan peringatan satker deviasi &gt; 5%.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onGoToFullDashboard && (
              <button
                type="button"
                onClick={onGoToFullDashboard}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Buka Menu Lengkap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onToggleVisibility(true)}
              className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Aktifkan Widget Deviasi</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Full Active Widget
  // -------------------------------------------------------------
  return (
    <div className={`rounded-3xl border shadow-md overflow-hidden transition-all ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
    }`}>
      {/* Widget Header */}
      <div className={`p-5 sm:p-6 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
        isDark 
          ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border-slate-800' 
          : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-950'
      }`}>
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-black">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              RADAR DEVIASI HAL III DIPA (OMSPAN)
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              Bobot IKPA 10% (Toleransi Deviasi ≤ 5.00%)
            </span>
            {stats.fullBlokirCount > 0 && (
              <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-200 border border-rose-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-black animate-pulse">
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                {stats.fullBlokirCount} Satker Full Blokir
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Monitoring &amp; Deteksi Dini Deviasi Halaman III DIPA</span>
          </h3>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Ringkasan keselarasan Rencana Penarikan Dana (RPD) vs Realisasi SP2D per jenis belanja (51, 52, 53, 57). 
            Satker tertib memiliki rata-rata deviasi ≤ 5.00% untuk mengamankan nilai IKPA maksimal 100.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
          {/* Period Selector */}
          {availablePeriodes.length > 0 && (
            <div className="inline-flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-200">
              <span className="text-[11px] text-slate-400 font-semibold">Periode:</span>
              <select
                value={selectedPeriode}
                onChange={(e) => {
                  setSelectedPeriode(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">Semua Periode ({records.length} data)</option>
                {availablePeriodes.map(p => (
                  <option key={p} value={p} className="bg-slate-900 text-white">
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Full Dashboard Link */}
          {onGoToFullDashboard && (
            <button
              type="button"
              onClick={onGoToFullDashboard}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Buka Menu Lengkap</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Toggle Widget Switch Button */}
          <button
            type="button"
            onClick={() => onToggleVisibility(false)}
            title="Sembunyikan / Nonaktifkan Widget Deviasi dari Beranda"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <EyeOff className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Nonaktifkan Widget</span>
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-800">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Data Deviasi Halaman III DIPA Belum Diunggah
          </h4>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} max-w-md mx-auto`}>
            Unggah file Excel laporan Deviasi Hal III DIPA dari OMSPAN melalui Portal Admin untuk menampilkan analisis radar realisasi dan status blokir satker.
          </p>
          {onGoToUpload && (
            <button
              onClick={onGoToUpload}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unggah Data Deviasi di Admin &rarr;</span>
            </button>
          )}
        </div>
      ) : (
        <div className="p-5 sm:p-6 space-y-5">
          {/* Executive Radar Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Card 1: Total Satker & Pagu RPD */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-bold uppercase tracking-wider text-[10px]">Total Satker RPD</span>
                <Building2 className="w-4 h-4 text-indigo-500" />
              </div>
              <div className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats.totalCount} <span className="text-xs font-normal text-slate-400">Satker</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono font-medium">
                RPD: <strong>{formatRupiahSingkat(stats.totalRpd)}</strong>
              </div>
            </div>

            {/* Card 2: Deviasi Tertib <= 5% */}
            <div 
              onClick={() => {
                setActiveFilterTab(activeFilterTab === 'SAFE' ? 'ALL' : 'SAFE');
                setCurrentPage(1);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeFilterTab === 'SAFE'
                  ? (isDark ? 'bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500' : 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400')
                  : (isDark ? 'bg-slate-800/60 border-slate-700/80 hover:border-emerald-700' : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300')
              }`}
            >
              <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                <span className="font-black uppercase tracking-wider text-[10px]">Tertib RPD (≤ 5%)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.tertibCount} <span className="text-xs font-semibold">({stats.tertibPercent.toFixed(1)}%)</span>
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300/80 mt-1">
                Nilai IKPA maksimal (100)
              </div>
            </div>

            {/* Card 3: Deviasi Perhatian > 5% */}
            <div 
              onClick={() => {
                setActiveFilterTab(activeFilterTab === 'WARNING' ? 'ALL' : 'WARNING');
                setCurrentPage(1);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeFilterTab === 'WARNING'
                  ? (isDark ? 'bg-rose-950/70 border-rose-500 ring-2 ring-rose-500' : 'bg-rose-50 border-rose-400 ring-2 ring-rose-400')
                  : (isDark ? 'bg-slate-800/60 border-slate-700/80 hover:border-rose-700' : 'bg-rose-50/50 border-rose-200 hover:border-rose-300')
              }`}
            >
              <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 mb-1">
                <span className="font-black uppercase tracking-wider text-[10px]">Perhatian (&gt; 5%)</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                {stats.warningCount} <span className="text-xs font-semibold">({stats.warningPercent.toFixed(1)}%)</span>
              </div>
              <div className="text-[11px] text-rose-700 dark:text-rose-300/80 mt-1">
                Perlu revisi / penyesuaian RPD
              </div>
            </div>

            {/* Card 4: Full Blokir (Kolom Y) */}
            <div 
              onClick={() => {
                setActiveFilterTab(activeFilterTab === 'BLOKIR' ? 'ALL' : 'BLOKIR');
                setCurrentPage(1);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeFilterTab === 'BLOKIR'
                  ? (isDark ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500' : 'bg-rose-100 border-rose-400 ring-2 ring-rose-500')
                  : (isDark ? 'bg-slate-800/60 border-slate-700/80 hover:border-rose-800' : 'bg-slate-50 border-slate-200 hover:border-rose-300')
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-black uppercase tracking-wider text-[10px] text-rose-600 dark:text-rose-400">Full Blokir (Y)</span>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                {stats.fullBlokirCount} <span className="text-xs font-normal text-slate-400">Satker</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Seluruh pagu belum ditarik
              </div>
            </div>

            {/* Card 5: Total Deviasi Nominal */}
            <div className={`col-span-2 sm:col-span-1 p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-bold uppercase tracking-wider text-[10px]">Deviasi Nominal (Rp)</span>
                <Coins className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                {formatRupiahSingkat(stats.totalDeviasiNominal)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Rata-rata: <strong>{stats.avgDeviasiOverall.toFixed(2)}%</strong>
              </div>
            </div>
          </div>

          {/* Mini Radar Belanja Breakdown (51, 52, 53, 57) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Rata-rata Deviasi per Jenis Belanja:</span>
              </span>
              <span className="text-[11px] text-slate-400">Target batas deviasi ideal: ≤ 5.00%</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: '51 - Pegawai', data: stats.akun51, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60' },
                { label: '52 - Barang', data: stats.akun52, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60' },
                { label: '53 - Modal', data: stats.akun53, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60' },
                { label: '57 - Bansos', data: stats.akun57, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60' },
              ].map(item => (
                <div key={item.label} className={`p-3 rounded-2xl border flex items-center justify-between ${item.bg}`}>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">{item.label}</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={`text-base font-black font-mono ${item.color}`}>
                        {item.data.avgPersen.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block font-semibold">{item.data.count} Satker</span>
                    <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                      {formatRupiahSingkat(item.data.totalDev)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Table / Satker Warning List */}
          <div className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/60 border-slate-200'
          }`}>
            {/* Filter Bar */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'ALL' as const, label: `Semua Satker (${periodFilteredRecords.length})` },
                  { id: 'WARNING' as const, label: `🔴 Deviasi > 5% (${stats.warningCount})` },
                  { id: 'BLOKIR' as const, label: `🔒 Full Blokir (${stats.fullBlokirCount})` },
                  { id: 'SAFE' as const, label: `🟢 Tertib ≤ 5% (${stats.tertibCount})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveFilterTab(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeFilterTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isDark
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Mini Search */}
              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari satker deviasi..."
                  className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none font-medium transition-all ${
                    isDark 
                      ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                  }`}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`text-[11px] uppercase font-bold border-b ${
                  isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3">Satuan Kerja</th>
                    <th className="py-2.5 px-2">Periode</th>
                    <th className="py-2.5 px-2">Klasifikasi</th>
                    <th className="py-2.5 px-3 text-right">RPD (Rp)</th>
                    <th className="py-2.5 px-3 text-right">Realisasi (Rp)</th>
                    <th className="py-2.5 px-3 text-right">Deviasi (Rp)</th>
                    <th className="py-2.5 px-3 text-center">% Deviasi</th>
                    <th className="py-2.5 px-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedSatkers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 text-xs">
                        Tidak ada data satker yang sesuai dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedSatkers.map(r => {
                      const devPersen = r.persenDeviasiTotal ?? (
                        r.rpdTotal > 0 ? (Math.abs((r.realisasiTotal || 0) - r.rpdTotal) / r.rpdTotal) * 100 : 0
                      );
                      const devNominal = r.deviasiNominalTotal ?? Math.abs((r.realisasiTotal || 0) - (r.rpdTotal || 0));

                      return (
                        <tr key={r.id} className={`hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 transition-colors ${
                          devPersen > 5.0 ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                        }`}>
                          <td className="py-2.5 px-3 font-medium">
                            <div className="font-mono font-bold text-slate-900 dark:text-white">
                              {r.kodeSatker}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[220px]">
                              {r.namaSatker}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 font-semibold whitespace-nowrap">
                            {r.periodeFormatted || r.periodeBulan || `Periode ${r.periodeAngka}`}
                          </td>
                          <td className="py-2.5 px-2 whitespace-nowrap">
                            {renderKlasifikasiBadge(r.klasifikasiSatker)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300 font-medium">
                            {formatRupiah(r.rpdTotal || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatRupiah(r.realisasiTotal || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                            {formatRupiah(devNominal)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-black border ${
                              devPersen <= 5.0
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                                : devPersen <= 10.0
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300'
                                : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300'
                            }`}>
                              {devPersen.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center whitespace-nowrap">
                            {onGoToFullDashboard && (
                              <button
                                type="button"
                                onClick={onGoToFullDashboard}
                                className="p-1 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 font-bold transition-all inline-flex items-center gap-1"
                                title="Buka Detail di Tab Deviasi Hal III"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, displayedSatkers.length)} dari {displayedSatkers.length} Satker
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                  >
                    &larr; Prev
                  </button>
                  <span className="px-2 font-bold font-mono text-slate-800 dark:text-slate-200">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
