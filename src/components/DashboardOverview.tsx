import React, { useState, useEffect } from 'react';
import { SatkerIKPA, IKPAPredikat, DashboardConfig, AppTheme } from '../types';
import { getKPPNMonthlyAggregate } from '../utils/analysisEngine';
import { exportSatkersToExcel, exportSatkersToPDF } from '../utils/exportUtils';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  Building2, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  Eye, 
  Send, 
  Filter, 
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  PieChart,
  Megaphone,
  SlidersHorizontal,
  Activity,
  Calendar,
  CalendarRange,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Zap
} from 'lucide-react';

interface DashboardOverviewProps {
  satkers: SatkerIKPA[];
  onSelectSatker: (satker: SatkerIKPA) => void;
  onOpenReminder: (satker: SatkerIKPA) => void;
  onGoToUpload: () => void;
  onGoToCapaianOutput?: () => void;
  dashboardConfig?: DashboardConfig;
  theme?: AppTheme;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  satkers,
  onSelectSatker,
  onOpenReminder,
  onGoToUpload,
  onGoToCapaianOutput,
  dashboardConfig,
  theme = 'light'
}) => {
  const [filterPredikat, setFilterPredikat] = useState<string>('ALL');
  const [filterIssue, setFilterIssue] = useState<string>(dashboardConfig?.defaultFilter || 'ALL');

  // Sync defaultFilter when dashboardConfig updates
  useEffect(() => {
    if (dashboardConfig?.defaultFilter) {
      setFilterIssue(dashboardConfig.defaultFilter);
    }
  }, [dashboardConfig?.defaultFilter]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const isDark = theme === 'dark';

  const ALL_INDONESIAN_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Calculated Stats (Only include satkers that actually have IKPA data for IKPA dashboard)
  const satkersWithIKPA = satkers.filter(s => s.hasIKPAData === true || (s.hasIKPAData !== false && (s.nilaiTotalIKPA > 0 || s.paguAnggaran > 0)));
  const hasAnyIKPA = satkersWithIKPA.length > 0 && !dashboardConfig?.hideIKPAWhenOnlyCapaianOutput;
  const totalSatker = satkersWithIKPA.length;

  // Compute KPPN overall monthly aggregate data based on satkersWithIKPA
  const kppnMonthlyDataAll = getKPPNMonthlyAggregate(satkersWithIKPA);
  const availableMonths = kppnMonthlyDataAll.map(d => d.bulan);
  const firstUploadedMonth = availableMonths[0] || 'Januari';
  const latestUploadedMonth = availableMonths[availableMonths.length - 1] || 'Januari';

  const [filterStartMonth, setFilterStartMonth] = useState<string>(firstUploadedMonth);
  const [filterEndMonth, setFilterEndMonth] = useState<string>(latestUploadedMonth);

  useEffect(() => {
    if (availableMonths.length > 0) {
      setFilterStartMonth(availableMonths[0]);
      setFilterEndMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths.join(',')]);

  // Sliced monthly data based on start and end month filters
  const startIdx = ALL_INDONESIAN_MONTHS.indexOf(filterStartMonth);
  const endIdx = ALL_INDONESIAN_MONTHS.indexOf(filterEndMonth);

  const kppnMonthlyData = kppnMonthlyDataAll.filter(item => {
    const idx = ALL_INDONESIAN_MONTHS.indexOf(item.bulan);
    if (startIdx !== -1 && endIdx !== -1) {
      return idx >= startIdx && idx <= endIdx;
    }
    return true;
  });

  const displayMonthlyData = kppnMonthlyData.length > 0 ? kppnMonthlyData : kppnMonthlyDataAll;
  const firstMonthData = displayMonthlyData[0];
  const lastMonthData = displayMonthlyData[displayMonthlyData.length - 1];

  const deltaIKPANum = lastMonthData && firstMonthData ? Number((lastMonthData.avgIKPA - firstMonthData.avgIKPA).toFixed(2)) : 0;
  const deltaPenyerapanNum = lastMonthData && firstMonthData ? Number((lastMonthData.avgPenyerapan - firstMonthData.avgPenyerapan).toFixed(1)) : 0;
  const deltaOutputNum = lastMonthData && firstMonthData ? Number((lastMonthData.avgCapaianOutput - firstMonthData.avgCapaianOutput).toFixed(1)) : 0;

  const avgIKPA = hasAnyIKPA 
    ? (satkersWithIKPA.reduce((acc, s) => acc + s.nilaiTotalIKPA, 0) / satkersWithIKPA.length).toFixed(2)
    : '0.00';

  const totalPagu = satkersWithIKPA.reduce((acc, s) => acc + s.paguAnggaran, 0);
  const totalRealisasi = satkersWithIKPA.reduce((acc, s) => acc + s.realisasiAnggaran, 0);
  const totalPersenPenyerapan = totalPagu > 0 
    ? ((totalRealisasi / totalPagu) * 100).toFixed(2) 
    : '0.00';

  const satkerPerluPerhatian = hasAnyIKPA ? satkersWithIKPA.filter(s => s.nilaiTotalIKPA < 87.5) : [];
  const satkerBelumCapaian = satkersWithIKPA.filter(s => s.statusCapaianOutput !== 'Sudah Terlaporkan' || s.indikator.capaianOutput === 0);
  const satkerSudahCapaian = satkersWithIKPA.filter(s => s.statusCapaianOutput === 'Sudah Terlaporkan' && s.indikator.capaianOutput > 0);
  const satkerPenyerapanRendah = hasAnyIKPA ? satkersWithIKPA.filter(s => s.persenPenyerapan < 70) : [];
  const avgCapaianOutputScore = totalSatker > 0 ? (satkersWithIKPA.reduce((acc, s) => acc + s.indikator.capaianOutput, 0) / totalSatker).toFixed(1) : '0.0';

  // Filter & Sort Logic for IKPA Satkers
  const filteredSatkers = satkersWithIKPA.filter(s => {
    // Filter Predikat
    if (filterPredikat !== 'ALL' && s.predikat !== filterPredikat) {
      return false;
    }
    // Filter Issue Focus
    if (filterIssue === 'BELUM_OUTPUT' && !(s.statusCapaianOutput === 'Belum Terlaporkan' || s.indikator.capaianOutput === 0)) {
      return false;
    }
    if (filterIssue === 'SUDAH_OUTPUT' && !(s.statusCapaianOutput === 'Sudah Terlaporkan' && s.indikator.capaianOutput > 0)) {
      return false;
    }
    if (filterIssue === 'IKPA_KURANG' && s.nilaiTotalIKPA >= 87.5) {
      return false;
    }
    if (filterIssue === 'PENYERAPAN_RENDAH' && s.persenPenyerapan >= 70) {
      return false;
    }
    if (filterIssue === 'DEVIASI_TINGGI' && s.indikator.deviasiHal3Dipa >= 85) {
      return false;
    }
    if (filterIssue === 'DISPENSASI_SPM' && s.indikator.dispensasiSpm >= 100) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    // Primary Priority: Satker belum menyampaikan Capaian Output (0% / Belum Terlaporkan) selalu di Paling Atas
    const aBelum = a.statusCapaianOutput === 'Belum Terlaporkan' || a.indikator.capaianOutput === 0;
    const bBelum = b.statusCapaianOutput === 'Belum Terlaporkan' || b.indikator.capaianOutput === 0;

    if (aBelum && !bBelum) return -1;
    if (!aBelum && bBelum) return 1;

    // Secondary Priority: Total Nilai IKPA terendah
    return a.nilaiTotalIKPA - b.nilaiTotalIKPA;
  });

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPredikat, filterIssue, satkersWithIKPA.length]);

  const totalPages = Math.max(1, Math.ceil(filteredSatkers.length / (pageSize > 0 ? pageSize : filteredSatkers.length || 1)));
  const paginatedSatkers = pageSize === -1 
    ? filteredSatkers 
    : filteredSatkers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Calculate Indicator Averages for Progress Bars
  const avgIndicators = {
    revisiDipa: totalSatker > 0 ? (satkersWithIKPA.reduce((acc, s) => acc + s.indikator.revisiDipa, 0) / totalSatker).toFixed(1) : '0.0',
    deviasiHal3Dipa: totalSatker > 0 ? (satkersWithIKPA.reduce((acc, s) => acc + s.indikator.deviasiHal3Dipa, 0) / totalSatker).toFixed(1) : '0.0',
    penyerapanAnggaran: totalSatker > 0 ? (satkersWithIKPA.reduce((acc, s) => acc + s.indikator.penyerapanAnggaran, 0) / totalSatker).toFixed(1) : '0.0',
    belanjaKontraktual: totalSatker > 0 ? (satkersWithIKPA.reduce((acc, s) => acc + s.indikator.belanjaKontraktual, 0) / totalSatker).toFixed(1) : '0.0',
    penyelesaianTagihan: totalSatker > 0 ? (satkersWithIKPA.reduce((acc, s) => acc + s.indikator.penyelesaianTagihan, 0) / totalSatker).toFixed(1) : '0.0',
    pengelolaanUpTup: totalSatker > 0 ? (satkersWithIKPA.reduce((acc, s) => acc + s.indikator.pengelolaanUpTup, 0) / totalSatker).toFixed(1) : '0.0',
    dispensasiSpm: totalSatker > 0 ? (satkersWithIKPA.reduce((acc, s) => acc + s.indikator.dispensasiSpm, 0) / totalSatker).toFixed(1) : '0.0',
    capaianOutput: totalSatker > 0 ? (satkersWithIKPA.reduce((acc, s) => acc + s.indikator.capaianOutput, 0) / totalSatker).toFixed(1) : '0.0',
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getPredikatBadge = (predikat: IKPAPredikat, nilai: number, hasIKPAData?: boolean) => {
    if (hasIKPAData === false || nilai === 0) {
      return (
        <span className={`font-semibold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border ${
          isDark 
            ? 'bg-slate-800 text-slate-400 border-slate-700' 
            : 'bg-slate-100 text-slate-600 border-slate-300'
        }`}>
          <Clock className="w-3.5 h-3.5 text-slate-400"/> Belum Upload IKPA
        </span>
      );
    }
    switch (predikat) {
      case 'Sangat Baik':
        return (
          <span className={`font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border ${
            isDark 
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/> Sangat Baik ({nilai})
          </span>
        );
      case 'Baik':
        return (
          <span className={`font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border ${
            isDark 
              ? 'bg-sky-950/80 text-sky-300 border-sky-800' 
              : 'bg-sky-100 text-sky-800 border-sky-300'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400"/> Baik ({nilai})
          </span>
        );
      case 'Cukup':
        return (
          <span className={`font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border ${
            isDark 
              ? 'bg-amber-950/80 text-amber-300 border-amber-800' 
              : 'bg-amber-100 text-amber-900 border-amber-300'
          }`}>
            <Clock className="w-3.5 h-3.5 text-amber-400"/> Cukup ({nilai})
          </span>
        );
      case 'Sangat Perlu Perhatian':
      default:
        return (
          <span className={`font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border ${
            isDark 
              ? 'bg-rose-950/80 text-rose-300 border-rose-800' 
              : 'bg-rose-100 text-rose-900 border-rose-300'
          }`}>
            <AlertCircle className="w-3.5 h-3.5 text-rose-500"/> Perlu Perhatian ({nilai})
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 rounded-3xl border border-slate-800 text-white shadow-xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                {dashboardConfig?.customTexts?.dashboardBadge || 'Sistem Pembina Keuangan & Monitoring IKPA KPPN Semarang I'}
              </div>
              <div className="inline-flex items-center gap-1.5 bg-slate-800/80 text-slate-300 border border-slate-700/80 px-3 py-1 rounded-full text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Data Diperbarui: <strong className="text-white">{dashboardConfig?.updateDates?.dashboard || '07 Agustus 2026 - 09:00 WIB'}</strong></span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {dashboardConfig?.customTexts?.dashboardTitle || 'Monitoring Real-Time IKPA Satker Lingkup KPPN Semarang I'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {dashboardConfig?.customTexts?.dashboardSubtitle || 'Sistem pembina keuangan digital untuk pemantauan 8 indikator IKPA, deteksi dini deviasi Halaman III DIPA, dan percepatan penyelesaian laporan Capaian Output SAKTI.'}
            </p>
          </div>

          {/* Key Executive Tag */}
          <div className="shrink-0 bg-slate-800/90 border border-slate-700 p-4 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mitra Kerja</div>
              <div className="text-xl font-extrabold text-white">{totalSatker} Satuan Kerja</div>
              <div className="text-[11px] text-emerald-400 font-medium">KPPN Semarang I (026)</div>
            </div>
          </div>
        </div>

        {/* Custom Admin Announcement Banner */}
        {dashboardConfig?.customAnnouncement && (
          <div className="relative z-10 bg-amber-500/20 border border-amber-400/40 p-3.5 rounded-2xl text-amber-200 text-xs sm:text-sm flex items-start gap-3">
            <Megaphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-extrabold text-amber-300 uppercase tracking-wider text-[11px] block">PENGUMUMAN RESMI ADMINISTRATOR KPPN:</span>
              <p className="text-slate-100 font-medium leading-relaxed">{dashboardConfig.customAnnouncement}</p>
            </div>
          </div>
        )}

        {/* Active Admin Preset Indicator */}
        {filterIssue !== 'ALL' && (
          <div className="relative z-10 bg-slate-800/90 border border-slate-700/80 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Mode Tampilan Admin Aktif:</strong> {
                  filterIssue === 'BELUM_OUTPUT' ? '🔴 Menampilkan Satker Belum Upload Capaian Output (0% Data)' :
                  filterIssue === 'SUDAH_OUTPUT' ? '🟢 Menampilkan Satker Sudah Kirim Capaian Output' :
                  filterIssue === 'IKPA_KURANG' ? '⚠️ Menampilkan Satker IKPA Kurang (<87.50)' :
                  filterIssue === 'PENYERAPAN_RENDAH' ? '📉 Menampilkan Penyerapan Rendah (<70%)' :
                  '📊 Deviasi Hal III DIPA Tinggi'
                }
              </span>
            </div>
            <button
              onClick={() => setFilterIssue('ALL')}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline text-[11px] cursor-pointer"
            >
              Reset Tampilkan Semua Satker
            </button>
          </div>
        )}
      </div>

      {/* Clean Slate / Capaian Output Active Notice Banner */}
      {!hasAnyIKPA ? (
        <div className={`p-8 sm:p-12 rounded-3xl border text-center shadow-lg space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto border shadow-inner ${
            isDark ? 'bg-slate-800/80 text-emerald-400 border-slate-700' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>
            <BarChart3 className="w-10 h-10" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {satkers.length > 0 ? 'DATA CAPAIAN OUTPUT AKTIF (TERISOLASI)' : 'BELUM ADA DATA IKPA'}
            </span>
            <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {satkers.length > 0 ? 'Dashboard IKPA Kosong (Terisolasi dari Capaian Output)' : 'Dashboard IKPA Belum Memiliki Data'}
            </h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {satkers.length > 0
                ? `Anda telah mengunggah Laporan Capaian Output SAKTI (${satkers.length} Satker). Data tersebut diproses dan dipantau secara penuh di tab "Capaian Output SAKTI" tanpa memengaruhi atau mencemari Dashboard IKPA ini. Dashboard IKPA akan terisi otomatis saat Anda mengunggah File Excel IKPA KPPN (8 Indikator).`
                : 'Belum ada data Satker yang diunggah ke sistem. Silakan unggah file Excel IKPA untuk memuat data evaluasi dan monitoring 8 indikator.'}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {satkers.length > 0 && onGoToCapaianOutput && (
              <button
                onClick={onGoToCapaianOutput}
                className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Buka Tab Capaian Output SAKTI ({satkers.length} Satker) &rarr;</span>
              </button>
            )}

            <button
              onClick={onGoToUpload}
              className={`px-6 py-3 rounded-2xl font-bold text-sm border flex items-center gap-2 transition-all cursor-pointer ${
                satkers.length === 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-600/30'
                  : isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Upload File Excel IKPA (8 Indikator)</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Satker & Avg Score */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                <span>RATA-RATA IKPA KPPN SMG I</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{avgIKPA}</span>
                <span className="text-xs font-semibold text-slate-500">/ 100</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2 text-slate-600">
                <span>Total Satker Dipantau:</span>
                <span className="font-bold text-slate-900">{totalSatker} Satker</span>
              </div>
            </div>

            {/* Card 2: Satker Perlu Perhatian */}
            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                <span>NILAI IKPA &lt; 87.50 (KURANG)</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-600">{satkerPerluPerhatian.length}</span>
                <span className="text-xs font-semibold text-rose-500">Satker</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2 text-slate-600">
                <span>Perlu Evaluasi Khusus:</span>
                <span className="font-bold text-rose-700">
                  {`${((satkerPerluPerhatian.length / (totalSatker || 1)) * 100).toFixed(0)}% Dari Total`}
                </span>
              </div>
            </div>

            {/* Card 3: Belum Capaian Output / 0% Data Masuk */}
            <div 
              onClick={() => setFilterIssue(filterIssue === 'BELUM_OUTPUT' ? 'ALL' : 'BELUM_OUTPUT')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                filterIssue === 'BELUM_OUTPUT' 
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500 shadow-md' 
                  : 'bg-white border-amber-200 shadow-xs hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                <span className="font-extrabold text-rose-700">BELUM CAPAIAN OUTPUT (0% DATA)</span>
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-600">{satkerBelumCapaian.length}</span>
                <span className="text-xs font-semibold text-rose-500">Satker (0% Masuk)</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs border-t border-rose-100 pt-2 text-rose-700 font-semibold">
                <span>Klik Untuk Filter Tampil:</span>
                <span className="bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded text-[10px] font-bold">
                  {filterIssue === 'BELUM_OUTPUT' ? '✓ Aktif' : 'Tampilkan'}
                </span>
              </div>
            </div>

            {/* Card 4: Realisasi & Penyerapan Pagu */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                <span>PENYERAPAN ANGGARAN</span>
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{totalPersenPenyerapan}%</span>
                <span className="text-xs font-semibold text-sky-600">Terrealisasi</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2 text-slate-600 truncate">
                <span>Realisasi / Pagu:</span>
                <span className="font-bold text-slate-900 truncate">
                  {totalPagu > 0 ? formatRupiah(totalRealisasi) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* OVERALL KPPN MONTHLY TREND CHART WITH MONTH RANGE FILTER */}
          <div className={`p-6 rounded-3xl border shadow-xs space-y-6 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
        {/* Header & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold mb-1.5">
              <Activity className="w-3.5 h-3.5" />
              ANALISIS TREN PERIODIK (JANUARI s.d. EXCEL TERUPLOAD)
            </div>
            <h3 className="text-xl font-black tracking-tight flex flex-wrap items-center gap-2">
              <span>Grafik Progress IKPA KPPN Semarang I</span>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                Periode Terupload: {latestUploadedMonth} 2026
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Filter dan analisis perkembangan nilai IKPA, penyerapan anggaran, serta capaian output dari bulan Januari sampai bulan Excel terbaru.
            </p>
          </div>

          {/* Month Range Filter Bar */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <CalendarRange className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Filter Periode:</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500 font-semibold">Dari:</span>
                <select
                  value={filterStartMonth}
                  onChange={(e) => setFilterStartMonth(e.target.value)}
                  className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border transition-all cursor-pointer ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {availableMonths.map(m => (
                    <option key={`start-${m}`} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <span className="text-slate-400 font-bold text-xs">s.d.</span>

              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500 font-semibold">Sampai:</span>
                <select
                  value={filterEndMonth}
                  onChange={(e) => setFilterEndMonth(e.target.value)}
                  className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border transition-all cursor-pointer ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {availableMonths.map(m => (
                    <option key={`end-${m}`} value={m}>
                      {m} {m === latestUploadedMonth ? '(Excel Terbaru)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Month Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] mr-1">Preset Cepat:</span>
          <button
            onClick={() => { setFilterStartMonth('Januari'); setFilterEndMonth(latestUploadedMonth); }}
            className={`px-3 py-1 rounded-xl font-bold transition-all border text-[11px] cursor-pointer ${
              filterStartMonth === 'Januari' && filterEndMonth === latestUploadedMonth
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            Full Period (Jan - {latestUploadedMonth})
          </button>
          <button
            onClick={() => { setFilterStartMonth('Januari'); setFilterEndMonth('Maret'); }}
            className={`px-3 py-1 rounded-xl font-bold transition-all border text-[11px] cursor-pointer ${
              filterStartMonth === 'Januari' && filterEndMonth === 'Maret'
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            Triwulan I (Jan-Mar)
          </button>
          <button
            onClick={() => { setFilterStartMonth('April'); setFilterEndMonth('Juni'); }}
            className={`px-3 py-1 rounded-xl font-bold transition-all border text-[11px] cursor-pointer ${
              filterStartMonth === 'April' && filterEndMonth === 'Juni'
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            Triwulan II (Apr-Jun)
          </button>
          <button
            onClick={() => { setFilterStartMonth('Juli'); setFilterEndMonth(latestUploadedMonth); }}
            className={`px-3 py-1 rounded-xl font-bold transition-all border text-[11px] cursor-pointer ${
              filterStartMonth === 'Juli' && filterEndMonth === latestUploadedMonth
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            Awal TW III (Jul-{latestUploadedMonth})
          </button>
        </div>

        {/* Recharts Area / Line Chart */}
        <div className="h-64 sm:h-72 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIkpa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis 
                dataKey="bulan" 
                tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} 
              />
              <YAxis 
                domain={[50, 100]} 
                tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
              
              <Area 
                type="monotone" 
                dataKey="avgIKPA" 
                name="Rata-Rata Nilai IKPA KPPN" 
                stroke="#f59e0b" 
                fillOpacity={1} 
                fill="url(#colorIkpa)" 
                strokeWidth={3} 
              />
              <Area 
                type="monotone" 
                dataKey="avgCapaianOutput" 
                name="Rata-Rata Capaian Output" 
                stroke="#38bdf8" 
                fillOpacity={1} 
                fill="url(#colorOutput)" 
                strokeWidth={2} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Period Progress Analysis Dashboard Card */}
        <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
          isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              RINGKASAN ANALISIS PROGRESS ({filterStartMonth.toUpperCase()} s.d. {filterEndMonth.toUpperCase()})
            </span>
            <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
              Evaluasi Rentang {displayMonthlyData.length} Bulan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Metric 1 */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              deltaIKPANum >= 0 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Rata-Rata IKPA</span>
                <div className="text-lg font-black mt-0.5">
                  {lastMonthData?.avgIKPA || 0} <span className="text-xs font-normal">/ 100</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center text-xs font-black px-2 py-0.5 rounded-md ${
                  deltaIKPANum >= 0 ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' : 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                }`}>
                  {deltaIKPANum >= 0 ? `+${deltaIKPANum}` : deltaIKPANum} Poin
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">vs {filterStartMonth} ({firstMonthData?.avgIKPA})</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-300 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Rasio Penyerapan</span>
                <div className="text-lg font-black mt-0.5">
                  {lastMonthData?.avgPenyerapan || 0}%
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center text-xs font-black px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200">
                  {deltaPenyerapanNum >= 0 ? `+${deltaPenyerapanNum}%` : `${deltaPenyerapanNum}%`}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">vs {filterStartMonth} ({firstMonthData?.avgPenyerapan}%)</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Capaian Output</span>
                <div className="text-lg font-black mt-0.5">
                  {lastMonthData?.avgCapaianOutput || 0}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center text-xs font-black px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                  {deltaOutputNum >= 0 ? `+${deltaOutputNum}` : `${deltaOutputNum}`} Poin
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">vs {filterStartMonth} ({firstMonthData?.avgCapaianOutput})</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium pt-1">
            💡 <strong>Analisis Progress Tren:</strong> Pada periode <strong>{filterStartMonth} s.d. {filterEndMonth} 2026</strong>, performa nilai IKPA KPPN Semarang I {deltaIKPANum >= 0 ? 'mengalami peningkatan' : 'mengalami penyesuaian'} sebesar <strong>{deltaIKPANum >= 0 ? `+${deltaIKPANum}` : deltaIKPANum} poin</strong>. Akselerasi penyerapan anggaran berada pada tingkat {lastMonthData?.avgPenyerapan}%, sementara Indikator Capaian Output berada pada rata-rata {lastMonthData?.avgCapaianOutput}.
          </p>
        </div>

        {/* Insight note under chart */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Klik tombol <strong>"Detail"</strong> pada tabel Satker di bawah untuk melihat grafik individual &amp; analisis penyebab per Satker.</span>
          </div>
          <button
            onClick={onGoToUpload}
            className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>+ Upload File Excel Bulan Berikutnya</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Rata-Rata Indikator Performance Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                Rata-Rata Performa 8 Indikator IKPA (Lingkup KPPN Semarang I)
              </h3>
            </div>
            <span className="text-xs text-slate-500">Target Ideal: ≥ 87.50</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Revisi DIPA (10%)</span>
                <span className="text-slate-900">{avgIndicators.revisiDipa}</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, Number(avgIndicators.revisiDipa))}%` }}></div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Deviasi Hal III DIPA (10%)</span>
                <span className={Number(avgIndicators.deviasiHal3Dipa) < 75 ? 'text-amber-600 font-bold' : 'text-slate-900'}>
                  {avgIndicators.deviasiHal3Dipa}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${Number(avgIndicators.deviasiHal3Dipa) < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${Math.min(100, Number(avgIndicators.deviasiHal3Dipa))}%` }}
                ></div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Penyerapan Anggaran (20%)</span>
                <span className="text-slate-900">{avgIndicators.penyerapanAnggaran}</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, Number(avgIndicators.penyerapanAnggaran))}%` }}></div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Belanja Kontraktual (10%)</span>
                <span className="text-slate-900">{avgIndicators.belanjaKontraktual}</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, Number(avgIndicators.belanjaKontraktual))}%` }}></div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Penyelesaian Tagihan (10%)</span>
                <span className="text-slate-900">{avgIndicators.penyelesaianTagihan}</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, Number(avgIndicators.penyelesaianTagihan))}%` }}></div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Pengelolaan UP/TUP (10%)</span>
                <span className="text-slate-900">{avgIndicators.pengelolaanUpTup}</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, Number(avgIndicators.pengelolaanUpTup))}%` }}></div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Dispensasi SPM (5%)</span>
                <span className="text-slate-900">{avgIndicators.dispensasiSpm}</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, Number(avgIndicators.dispensasiSpm))}%` }}></div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Capaian Output (25%)</span>
                <span className={Number(avgIndicators.capaianOutput) < 70 ? 'text-rose-600 font-bold' : 'text-slate-900'}>
                  {avgIndicators.capaianOutput}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${Number(avgIndicators.capaianOutput) < 70 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${Math.min(100, Number(avgIndicators.capaianOutput))}%` }}
                ></div>
              </div>
            </div>

          </div>
        </div>

      {/* Satker Main Table Section */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Table Filters & Export Header */}
        <div className={`p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/50 border-slate-200'
        }`}>
          <div>
            <h3 className={`text-base font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Building2 className="w-5 h-5 text-emerald-500" />
              <span>{hasAnyIKPA ? 'Daftar Nilai IKPA Satker Mitra KPPN Semarang I' : 'Daftar Monitoring Capaian Output Satker Mitra KPPN Semarang I'}</span>
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
              Menampilkan {filteredSatkers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, filteredSatkers.length)} dari total {filteredSatkers.length} Satker ({hasAnyIKPA ? 'Fokus Nilai & Indikator IKPA' : 'Fokus Pelaporan Capaian Output SAKTI'})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export Buttons */}
            <div className="flex items-center gap-1.5 mr-2">
              <button
                onClick={() => exportSatkersToExcel(filteredSatkers)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Ekspor seluruh data IKPA ke file Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => exportSatkersToPDF(filteredSatkers, 'Laporan Monitoring Nilai IKPA KPPN Semarang I')}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Ekspor seluruh data IKPA ke file PDF (.pdf)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>

            {/* Quick Filter Controls */}
            <div className={`flex items-center gap-1.5 text-xs rounded-xl px-3 py-1.5 border shadow-2xs ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <Filter className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
              <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Predikat:</span>
              <select
                value={filterPredikat}
                onChange={(e) => setFilterPredikat(e.target.value)}
                className={`bg-transparent font-medium focus:outline-none cursor-pointer ${
                  isDark ? 'text-slate-100 bg-slate-900' : 'text-slate-800'
                }`}
              >
                <option value="ALL" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>Semua Predikat</option>
                <option value="Sangat Baik" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>Sangat Baik (≥95)</option>
                <option value="Baik" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>Baik (87.5-95)</option>
                <option value="Cukup" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>Cukup (70-87.5)</option>
                <option value="Sangat Perlu Perhatian" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>Perlu Perhatian (&lt;70)</option>
              </select>
            </div>

            <div className={`flex items-center gap-1.5 text-xs rounded-xl px-3 py-1.5 border shadow-2xs ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Masalah IKPA:</span>
              <select
                value={filterIssue}
                onChange={(e) => setFilterIssue(e.target.value)}
                className={`bg-transparent font-medium focus:outline-none cursor-pointer ${
                  isDark ? 'text-slate-100 bg-slate-900' : 'text-slate-800'
                }`}
              >
                <option value="BELUM_OUTPUT" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>🔴 Belum Upload Capaian Output (0% Data)</option>
                <option value="ALL" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>Semua Kondisi IKPA</option>
                <option value="SUDAH_OUTPUT" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>🟢 Sudah Kirim Capaian Output (&gt;0%)</option>
                <option value="IKPA_KURANG" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>⚠️ Nilai IKPA &lt; 87.50 (Perlu Perhatian)</option>
                <option value="PENYERAPAN_RENDAH" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>📉 Penyerapan Anggaran &lt; 70%</option>
                <option value="DEVIASI_TINGGI" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>📊 Deviasi Hal III DIPA Tinggi</option>
                <option value="DISPENSASI_SPM" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>🔴 Ada Dispensasi SPM</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content (Desktop View) */}
        <div className="hidden md:block overflow-x-auto">
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            <thead className={`${isDark ? 'bg-slate-950/80 text-slate-300 border-slate-800' : 'bg-slate-100/80 text-slate-600 border-slate-200'} font-bold uppercase tracking-wider border-b`}>
              <tr>
                <th className="py-3.5 px-4">Kode & Satker</th>
                <th className="py-3.5 px-4">Kementerian / Lembaga</th>
                <th className="py-3.5 px-4">Penyerapan / Pagu</th>
                <th className="py-3.5 px-4">Nilai Total IKPA</th>
                <th className="py-3.5 px-4">Catatan / Poin Masalah IKPA</th>
                <th className="py-3.5 px-4 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/80' : 'divide-slate-200'}`}>
              {filteredSatkers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                        isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Building2 className="w-6 h-6" />
                      </div>
                      <p className={`font-extrabold text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {satkers.length === 0 ? 'Belum Ada Data Satker (0 Satker)' : 'Tidak Ada Satker Sesuai Filter'}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {satkers.length === 0 
                          ? 'Seluruh data dummy telah dikosongkan. Silakan unggah file Excel IKPA asli Anda.'
                          : 'Coba ubah kata kunci pencarian atau sesuaikan filter predikat/masalah.'}
                      </p>
                      {satkers.length === 0 && (
                        <button
                          onClick={onGoToUpload}
                          className="mt-2 inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
                        >
                          <FileCheck className="w-4 h-4" />
                          <span>Upload File Excel Sekarang</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSatkers.map((satker) => {
                  const isRedFlag = satker.nilaiTotalIKPA < 87.5;
                  
                  return (
                    <tr 
                      key={satker.id} 
                      className={`transition-colors ${
                        isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                      } ${
                        isRedFlag ? (isDark ? 'bg-rose-950/30' : 'bg-rose-50/20') : ''
                      }`}
                    >
                      {/* Kode & Satker */}
                      <td className="py-3.5 px-4">
                        <div className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {satker.namaSatker}
                        </div>
                        <div className={`flex items-center gap-2 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-500'} mt-1`}>
                          <span className={`font-mono px-2 py-0.5 rounded-md font-extrabold border ${
                            isDark 
                              ? 'bg-sky-950/80 text-sky-300 border-sky-700/80 shadow-xs' 
                              : 'bg-slate-200 text-slate-800 border-slate-300'
                          }`}>
                            {satker.kodeSatker}
                          </span>
                          <span className={isDark ? 'text-slate-300' : 'text-slate-500'}>• {satker.unitEselon1 || 'KPPN Semarang I'}</span>
                        </div>
                      </td>

                      {/* Kementerian */}
                      <td className={`py-3.5 px-4 max-w-[180px] truncate font-medium ${isDark ? 'text-amber-200/90' : 'text-slate-700'}`} title={satker.kementerianLembaga}>
                        {satker.kementerianLembaga}
                      </td>

                      {/* Penyerapan / Pagu */}
                      <td className="py-3.5 px-4 min-w-[150px]">
                        {satker.hasIKPAData === false || (satker.paguAnggaran === 0 && satker.realisasiAnggaran === 0) ? (
                          <div className="py-1">
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Belum ada data IKPA
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-600 block mt-0.5">
                              (Hanya Capaian Output)
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between font-bold mb-1">
                              <span className={`text-xs ${
                                satker.persenPenyerapan >= 85 
                                  ? (isDark ? 'text-emerald-400 font-black' : 'text-emerald-700') 
                                  : satker.persenPenyerapan >= 70 
                                  ? (isDark ? 'text-amber-300 font-black' : 'text-amber-700') 
                                  : (isDark ? 'text-rose-400 font-black' : 'text-rose-700')
                              }`}>
                                {satker.persenPenyerapan}% Penyerapan
                              </span>
                              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                                {formatRupiah(satker.realisasiAnggaran)}
                              </span>
                            </div>
                            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800 border border-slate-700/60' : 'bg-slate-200'}`}>
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  satker.persenPenyerapan >= 85 ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' :
                                  satker.persenPenyerapan >= 70 ? 'bg-amber-500 shadow-xs shadow-amber-500/50' : 'bg-rose-500 shadow-xs shadow-rose-500/50'
                                }`}
                                style={{ width: `${Math.min(100, satker.persenPenyerapan)}%` }}
                              ></div>
                            </div>
                            <div className={`text-[10px] mt-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              Pagu: {formatRupiah(satker.paguAnggaran)}
                            </div>
                          </>
                        )}
                      </td>

                      {/* Nilai Total IKPA & Predikat */}
                      <td className="py-3.5 px-4">
                        {getPredikatBadge(satker.predikat, satker.nilaiTotalIKPA, satker.hasIKPAData)}
                      </td>

                      {/* Issues / Keterangan Masalah IKPA */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        {satker.issues.length === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                            ✓ Seluruh Indikator IKPA Maksimal
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {satker.issues.slice(0, 2).map((iss, idx) => (
                              <div key={idx} className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold leading-tight flex items-start gap-1">
                                <span className="shrink-0">•</span>
                                <span>{iss}</span>
                              </div>
                            ))}
                            {satker.issues.length > 2 && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                + {satker.issues.length - 2} catatan indikator lagi
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectSatker(satker)}
                            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer inline-flex items-center gap-1.5 font-bold text-xs ${
                              isDark 
                                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                            }`}
                            title="Buka Rincian Indikator & Nilai Satker"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-500" />
                            <span>Detail</span>
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

        {/* Pagination Bar Controls */}
        {filteredSatkers.length > 0 && (
          <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
            isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50/80 border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center gap-2">
              <span>Tampilkan per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg border font-bold focus:outline-none cursor-pointer ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value={10}>10 Satker</option>
                <option value={25}>25 Satker</option>
                <option value={50}>50 Satker</option>
                <option value={-1}>Semua ({filteredSatkers.length})</option>
              </select>
            </div>

            {pageSize > 0 && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`p-1.5 rounded-lg border transition-all ${
                    currentPage === 1 
                      ? 'opacity-40 cursor-not-allowed' 
                      : (isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 cursor-pointer')
                  }`}
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-bold">
                  Halaman {currentPage} dari {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-1.5 rounded-lg border transition-all ${
                    currentPage === totalPages 
                      ? 'opacity-40 cursor-not-allowed' 
                      : (isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 cursor-pointer')
                  }`}
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mobile Card View (Visible on small screens) */}
        <div className={`block md:hidden divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
          {filteredSatkers.length === 0 ? (
            <div className="py-10 px-4 text-center text-slate-500">
              <p className="font-semibold text-sm">Tidak ada Satker yang sesuai dengan filter.</p>
              <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau reset filter.</p>
            </div>
          ) : (
            filteredSatkers.map((satker) => {
              const isRedFlag = satker.nilaiTotalIKPA < 87.5 || satker.statusCapaianOutput !== 'Sudah Terlaporkan';
              return (
                <div key={satker.id} className={`p-4 space-y-3 ${
                  isRedFlag 
                    ? (isDark ? 'bg-rose-950/20' : 'bg-rose-50/20') 
                    : (isDark ? 'bg-slate-900' : 'bg-white')
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className={`font-mono text-[11px] px-2 py-0.5 rounded-md font-extrabold border ${
                        isDark ? 'bg-sky-950/80 text-sky-300 border-sky-700/80' : 'bg-slate-200 text-slate-800 border-slate-300'
                      }`}>
                        {satker.kodeSatker}
                      </span>
                      <h4 className={`font-extrabold text-sm mt-1 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {satker.namaSatker}
                      </h4>
                      <p className={`text-xs truncate font-medium mt-0.5 ${isDark ? 'text-amber-200/90' : 'text-slate-600'}`}>
                        {satker.kementerianLembaga}
                      </p>
                    </div>
                    <div className="shrink-0">{getPredikatBadge(satker.predikat, satker.nilaiTotalIKPA, satker.hasIKPAData)}</div>
                  </div>

                  <div className={`grid grid-cols-2 gap-2 text-xs pt-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/60'}`}>
                      <span className={`text-[10px] block font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>Penyerapan Anggaran</span>
                      {satker.hasIKPAData === false || (satker.paguAnggaran === 0 && satker.realisasiAnggaran === 0) ? (
                        <div className="mt-0.5">
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic block font-semibold">Belum ada IKPA</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-600 block">(Capaian Output)</span>
                        </div>
                      ) : (
                        <>
                          <span className={`font-black text-sm ${
                            satker.persenPenyerapan >= 85 
                              ? (isDark ? 'text-emerald-400' : 'text-emerald-700') 
                              : satker.persenPenyerapan >= 70 
                              ? (isDark ? 'text-amber-300' : 'text-amber-700') 
                              : (isDark ? 'text-rose-400' : 'text-rose-700')
                          }`}>{satker.persenPenyerapan}%</span>
                          <span className={`text-[10px] block truncate font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatRupiah(satker.realisasiAnggaran)}</span>
                        </>
                      )}
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/60'}`}>
                      <span className={`text-[10px] block font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>Capaian Output</span>
                      {satker.statusCapaianOutput === 'Sudah Terlaporkan' && satker.indikator.capaianOutput > 0 ? (
                        <span className="font-bold text-emerald-500 text-xs block mt-0.5">✓ {satker.indikator.capaianOutput}%</span>
                      ) : (
                        <span className="font-bold text-rose-500 text-[11px] block mt-0.5 animate-pulse">🔴 0% (Belum)</span>
                      )}
                    </div>
                  </div>

                  {satker.issues.length > 0 && (
                    <div className={`p-2.5 rounded-xl text-xs space-y-1 border ${
                      isDark ? 'bg-rose-950/40 border-rose-800/60 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}>
                      <span className="font-extrabold block text-[10px] uppercase">Catatan Perhatian:</span>
                      <ul className="space-y-0.5">
                        {satker.issues.map((iss, i) => (
                          <li key={i} className="text-[11px] font-medium flex items-start gap-1">
                            <span className="text-rose-500">•</span>
                            <span>{iss}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      onClick={() => onSelectSatker(satker)}
                      className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl border text-center min-h-[42px] flex items-center justify-center gap-1.5 active:scale-98 transition-transform cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      <Eye className="w-4 h-4 text-sky-500" />
                      Lihat Detail Satker
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
        </>
      )}

    </div>
  );
};
