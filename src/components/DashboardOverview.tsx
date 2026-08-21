import React, { useState, useEffect } from 'react';
import { SatkerIKPA, IKPAPredikat, DashboardConfig, AppTheme } from '../types';
import { exportSatkersToExcel, exportSatkersToPDF } from '../utils/exportUtils';
import { IndicatorAnalysisModal, IndicatorAnalysisModalData } from './IndicatorAnalysisModal';
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
  Zap,
  Target,
  Briefcase,
  Coins,
  FileEdit,
  Search,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
  Layers
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
  const [filterIssue, setFilterIssue] = useState<string>(() => {
    return (dashboardConfig?.defaultFilter && dashboardConfig.defaultFilter !== 'BELUM_OUTPUT') 
      ? dashboardConfig.defaultFilter 
      : 'ALL';
  });

  // Sync defaultFilter when dashboardConfig updates
  useEffect(() => {
    if (dashboardConfig?.defaultFilter && dashboardConfig.defaultFilter !== 'BELUM_OUTPUT') {
      setFilterIssue(dashboardConfig.defaultFilter);
    }
  }, [dashboardConfig?.defaultFilter]);

  // State for 7 Indicators Diagnostic Assistance Module (Capaian Output dipisah di menu/modal khusus)
  const [selectedIndicatorKey, setSelectedIndicatorKey] = useState<
    'revisiDipa' | 'deviasiHal3Dipa' | 'penyerapanAnggaran' | 'belanjaKontraktual' | 
    'penyelesaianTagihan' | 'pengelolaanUpTup' | 'dispensasiSpm'
  >('deviasiHal3Dipa');
  const [indicatorPredikatFilter, setIndicatorPredikatFilter] = useState<'ALL' | 'KURANG' | 'CUKUP' | 'BAIK' | 'SANGAT_BAIK'>('KURANG');
  const [indicatorSearch, setIndicatorSearch] = useState<string>('');
  const [indicatorPage, setIndicatorPage] = useState<number>(1);
  const [isDiagnosticExpanded, setIsDiagnosticExpanded] = useState<boolean>(true);
  const [indicatorAnalysisModalData, setIndicatorAnalysisModalData] = useState<IndicatorAnalysisModalData | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Period Filter State (Defaults directly to the latest available month, e.g. Juli)
  const [selectedMonthPeriod, setSelectedMonthPeriod] = useState<string>('');

  const isDark = theme === 'dark';

  const ALL_MONTHS_LIST = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Calculated Stats (Only include satkers that actually have IKPA data for IKPA dashboard)
  const satkersWithIKPA = satkers.filter(s => s.hasIKPAData === true || (s.hasIKPAData !== false && (s.nilaiTotalIKPA > 0 || s.paguAnggaran > 0)));
  const hasAnyIKPA = satkersWithIKPA.length > 0 && !dashboardConfig?.hideIKPAWhenOnlyCapaianOutput;

  // Extract all uploaded months from satkers history (hanya bulan data IKPA, bukan Capaian Output)
  const availableUploadedMonths = React.useMemo(() => {
    const set = new Set<string>();
    satkersWithIKPA.forEach(s => {
      if (s.riwayatBulanan && s.riwayatBulanan.length > 0) {
        s.riwayatBulanan.forEach(r => {
          // Hanya bulan yang memiliki nilai IKPA murni (> 0)
          if (r.bulan && typeof r.nilaiIKPA === 'number' && r.nilaiIKPA > 0) {
            const match = ALL_MONTHS_LIST.find(m => r.bulan.toLowerCase().includes(m.toLowerCase()));
            if (match) set.add(match);
          }
        });
      }
    });

    // Jika belum ada di riwayat, cari dari periode IKPA
    if (set.size === 0) {
      satkersWithIKPA.forEach(s => {
        if (s.hasIKPAData === true && s.periodeUpdate && !s.periodeUpdate.toLowerCase().includes('capaian')) {
          const match = ALL_MONTHS_LIST.find(m => s.periodeUpdate.toLowerCase().includes(m.toLowerCase()));
          if (match) set.add(match);
        }
      });
    }

    const res = ALL_MONTHS_LIST.filter(m => set.has(m));
    return res.length > 0 ? res : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli'];
  }, [satkersWithIKPA]);

  const latestMonthName = availableUploadedMonths[availableUploadedMonths.length - 1] || 'Juli';
  const latestUploadedMonth = `s.d. ${latestMonthName} 2026`;
  const activeMonthPeriod = selectedMonthPeriod && availableUploadedMonths.includes(selectedMonthPeriod)
    ? selectedMonthPeriod
    : latestMonthName;

  // Auto-sync selected month when available months change
  useEffect(() => {
    if (availableUploadedMonths.length > 0 && (!selectedMonthPeriod || !availableUploadedMonths.includes(selectedMonthPeriod))) {
      setSelectedMonthPeriod(availableUploadedMonths[availableUploadedMonths.length - 1]);
    }
  }, [availableUploadedMonths, selectedMonthPeriod]);

  // Dynamically map satker data strictly based on the selected period month
  const effectiveSatkers = React.useMemo(() => {
    const targetMonth = (activeMonthPeriod || latestMonthName).toLowerCase();
    return satkersWithIKPA.map(s => {
      const hist = s.riwayatBulanan?.find(r => r && r.bulan && r.bulan.toLowerCase().includes(targetMonth));
      if (!hist) return s;
      const cur = s.indikator;
      const histIKPA = typeof hist.nilaiIKPA === 'number' && hist.nilaiIKPA > 0 ? hist.nilaiIKPA : s.nilaiTotalIKPA;
      let histPredikat = s.predikat;
      if (histIKPA >= 95.0) histPredikat = 'Sangat Baik';
      else if (histIKPA >= 89.0) histPredikat = 'Baik';
      else if (histIKPA >= 70.0) histPredikat = 'Cukup';
      else histPredikat = 'Kurang';

      return {
        ...s,
        nilaiTotalIKPA: histIKPA,
        predikat: histPredikat,
        indikator: {
          revisiDipa: hist.revisiDipa ?? cur.revisiDipa,
          deviasiHal3Dipa: hist.deviasiHal3Dipa ?? cur.deviasiHal3Dipa,
          penyerapanAnggaran: hist.penyerapanAnggaran ?? cur.penyerapanAnggaran,
          belanjaKontraktual: hist.belanjaKontraktual ?? cur.belanjaKontraktual,
          penyelesaianTagihan: hist.penyelesaianTagihan ?? cur.penyelesaianTagihan,
          pengelolaanUpTup: hist.pengelolaanUpTup ?? cur.pengelolaanUpTup,
          dispensasiSpm: hist.dispensasiSpm ?? cur.dispensasiSpm,
          capaianOutput: hist.capaianOutput ?? cur.capaianOutput,
        },
        periodeUpdate: `s.d. ${activeMonthPeriod} 2026`
      };
    });
  }, [satkersWithIKPA, activeMonthPeriod, latestMonthName]);

  const totalSatker = effectiveSatkers.length;

  const currentDisplayPeriodLabel = `s.d. ${activeMonthPeriod} 2026`;

  const avgIKPA = hasAnyIKPA 
    ? (effectiveSatkers.reduce((acc, s) => acc + s.nilaiTotalIKPA, 0) / (effectiveSatkers.length || 1)).toFixed(2)
    : '0.00';

  const totalPagu = effectiveSatkers.reduce((acc, s) => acc + s.paguAnggaran, 0);
  const totalRealisasi = effectiveSatkers.reduce((acc, s) => acc + s.realisasiAnggaran, 0);
  const totalPersenPenyerapan = totalPagu > 0 
    ? ((totalRealisasi / totalPagu) * 100).toFixed(2) 
    : '0.00';

  // 4 Kategori Resmi IKPA (PER-5/PB/2024 / Standar DJPb)
  const satkerSangatBaik = hasAnyIKPA ? effectiveSatkers.filter(s => s.nilaiTotalIKPA >= 95.0) : [];
  const satkerBaik = hasAnyIKPA ? effectiveSatkers.filter(s => s.nilaiTotalIKPA >= 89.0 && s.nilaiTotalIKPA < 95.0) : [];
  const satkerCukup = hasAnyIKPA ? effectiveSatkers.filter(s => s.nilaiTotalIKPA >= 70.0 && s.nilaiTotalIKPA < 89.0) : [];
  const satkerKurang = hasAnyIKPA ? effectiveSatkers.filter(s => s.nilaiTotalIKPA < 70.0) : [];
  const satkerPenyerapanRendah = hasAnyIKPA ? effectiveSatkers.filter(s => s.indikator.penyerapanAnggaran < 85) : [];

  // Filter & Sort Logic for IKPA Satkers
  const filteredSatkers = effectiveSatkers.filter(s => {
    // Filter Predikat Dropdown
    if (filterPredikat !== 'ALL') {
      if (filterPredikat === 'Kurang' || filterPredikat === 'Sangat Perlu Perhatian') {
        if (s.nilaiTotalIKPA >= 70) return false;
      } else if (filterPredikat === 'Cukup') {
        if (s.nilaiTotalIKPA < 70 || s.nilaiTotalIKPA >= 89) return false;
      } else if (filterPredikat === 'Baik') {
        if (s.nilaiTotalIKPA < 89 || s.nilaiTotalIKPA >= 95) return false;
      } else if (filterPredikat === 'Sangat Baik') {
        if (s.nilaiTotalIKPA < 95) return false;
      }
    }
    // Filter Card Interactive Focus
    if (filterIssue === 'IKPA_SANGAT_BAIK' && s.nilaiTotalIKPA < 95.0) {
      return false;
    }
    if (filterIssue === 'IKPA_BAIK' && (s.nilaiTotalIKPA < 89.0 || s.nilaiTotalIKPA >= 95.0)) {
      return false;
    }
    if (filterIssue === 'IKPA_CUKUP' && (s.nilaiTotalIKPA < 70.0 || s.nilaiTotalIKPA >= 89.0)) {
      return false;
    }
    if (filterIssue === 'IKPA_KURANG' && s.nilaiTotalIKPA >= 70.0) {
      return false;
    }
    if (filterIssue === 'PENYERAPAN_RENDAH' && s.indikator.penyerapanAnggaran >= 85) {
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
    // Sorting by Total Nilai IKPA terendah (satker perlu perhatian di awal)
    return a.nilaiTotalIKPA - b.nilaiTotalIKPA;
  });

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPredikat, filterIssue, selectedMonthPeriod, effectiveSatkers.length]);

  const totalPages = Math.max(1, Math.ceil(filteredSatkers.length / (pageSize > 0 ? pageSize : filteredSatkers.length || 1)));
  const paginatedSatkers = pageSize === -1 
    ? filteredSatkers 
    : filteredSatkers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Calculate Indicator Averages for Progress Bars
  const avgIndicators = {
    revisiDipa: totalSatker > 0 ? (effectiveSatkers.reduce((acc, s) => acc + s.indikator.revisiDipa, 0) / totalSatker).toFixed(1) : '0.0',
    deviasiHal3Dipa: totalSatker > 0 ? (effectiveSatkers.reduce((acc, s) => acc + s.indikator.deviasiHal3Dipa, 0) / totalSatker).toFixed(1) : '0.0',
    penyerapanAnggaran: totalSatker > 0 ? (effectiveSatkers.reduce((acc, s) => acc + s.indikator.penyerapanAnggaran, 0) / totalSatker).toFixed(1) : '0.0',
    belanjaKontraktual: totalSatker > 0 ? (effectiveSatkers.reduce((acc, s) => acc + s.indikator.belanjaKontraktual, 0) / totalSatker).toFixed(1) : '0.0',
    penyelesaianTagihan: totalSatker > 0 ? (effectiveSatkers.reduce((acc, s) => acc + s.indikator.penyelesaianTagihan, 0) / totalSatker).toFixed(1) : '0.0',
    pengelolaanUpTup: totalSatker > 0 ? (effectiveSatkers.reduce((acc, s) => acc + s.indikator.pengelolaanUpTup, 0) / totalSatker).toFixed(1) : '0.0',
    dispensasiSpm: totalSatker > 0 ? (effectiveSatkers.reduce((acc, s) => acc + s.indikator.dispensasiSpm, 0) / totalSatker).toFixed(1) : '0.0',
    capaianOutput: totalSatker > 0 ? (effectiveSatkers.reduce((acc, s) => acc + s.indikator.capaianOutput, 0) / totalSatker).toFixed(1) : '0.0',
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
    if (nilai >= 95.0) {
      return (
        <span className={`font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border ${
          isDark 
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
        }`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/> Sangat Baik ({nilai})
        </span>
      );
    }
    if (nilai >= 89.0) {
      return (
        <span className={`font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border ${
          isDark 
            ? 'bg-sky-950/80 text-sky-300 border-sky-800' 
            : 'bg-sky-100 text-sky-800 border-sky-300'
        }`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400"/> Baik ({nilai})
        </span>
      );
    }
    if (nilai >= 70.0) {
      return (
        <span className={`font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border ${
          isDark 
            ? 'bg-amber-950/80 text-amber-300 border-amber-800' 
            : 'bg-amber-100 text-amber-900 border-amber-300'
        }`}>
          <Clock className="w-3.5 h-3.5 text-amber-400"/> Cukup ({nilai})
        </span>
      );
    }
    return (
      <span className={`font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border ${
        isDark 
          ? 'bg-rose-950/80 text-rose-300 border-rose-800' 
          : 'bg-rose-100 text-rose-900 border-rose-300'
      }`}>
        <AlertCircle className="w-3.5 h-3.5 text-rose-500"/> Kurang ({nilai})
      </span>
    );
  };

  // Compute active IKPA period from satker records
  const activeIKPAPeriod = satkersWithIKPA.find(s => s.periodeUpdate)?.periodeUpdate || 's.d. Januari 2026';

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

              {/* Interactive Period Filter Selector in Banner */}
              <div className="inline-flex items-center gap-1.5 bg-emerald-950/90 text-emerald-200 border border-emerald-500/60 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                <CalendarRange className="w-3.5 h-3.5 text-emerald-400" />
                <span>Posisi Periode:</span>
                <select
                  value={activeMonthPeriod}
                  onChange={(e) => setSelectedMonthPeriod(e.target.value)}
                  className="bg-emerald-900/90 text-white font-extrabold text-xs rounded-md px-2 py-0.5 border border-emerald-400/50 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  {availableUploadedMonths.map(m => (
                    <option key={m} value={m} className="bg-slate-900 text-white font-semibold">
                      s.d. {m} 2026 {m === latestMonthName ? '✓' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-slate-800/80 text-slate-300 border border-slate-700/80 px-3 py-1 rounded-full text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Update Terakhir: <strong className="text-white">{dashboardConfig?.updateDates?.dashboard || '18 Agustus 2026'}</strong></span>
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
          {/* KPI Summary Cards: 4 Kategori Resmi IKPA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Sangat Baik (>= 95) */}
            <div 
              onClick={() => {
                if (filterIssue === 'IKPA_SANGAT_BAIK') {
                  setFilterIssue('ALL');
                  setFilterPredikat('ALL');
                } else {
                  setFilterIssue('IKPA_SANGAT_BAIK');
                  setFilterPredikat('ALL');
                }
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                filterIssue === 'IKPA_SANGAT_BAIK' 
                  ? (isDark ? 'bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500 shadow-lg' : 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500 shadow-md') 
                  : (isDark ? 'bg-slate-900 border-slate-800 hover:border-emerald-700/60' : 'bg-white border-emerald-200/80 shadow-xs hover:shadow-md hover:border-emerald-300')
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                <span className="font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  SANGAT BAIK (≥ 95.00)
                </span>
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {satkerSangatBaik.length}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Satker
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs border-t border-emerald-100 dark:border-emerald-900/50 pt-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                <span>Porsi Satker:</span>
                <span className="bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded text-[10px] font-extrabold">
                  {filterIssue === 'IKPA_SANGAT_BAIK' ? '✓ Filter Aktif' : `${((satkerSangatBaik.length / (totalSatker || 1)) * 100).toFixed(0)}% Dari Total`}
                </span>
              </div>
            </div>

            {/* Card 2: Baik (89 <= IKPA < 95) */}
            <div 
              onClick={() => {
                if (filterIssue === 'IKPA_BAIK') {
                  setFilterIssue('ALL');
                  setFilterPredikat('ALL');
                } else {
                  setFilterIssue('IKPA_BAIK');
                  setFilterPredikat('ALL');
                }
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                filterIssue === 'IKPA_BAIK' 
                  ? (isDark ? 'bg-sky-950/70 border-sky-500 ring-2 ring-sky-500 shadow-lg' : 'bg-sky-50 border-sky-400 ring-2 ring-sky-500 shadow-md') 
                  : (isDark ? 'bg-slate-900 border-slate-800 hover:border-sky-700/60' : 'bg-white border-sky-200/80 shadow-xs hover:shadow-md hover:border-sky-300')
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                <span className="font-black text-sky-600 dark:text-sky-400 uppercase tracking-wide">
                  BAIK (89.00 ≤ IKPA &lt; 95.00)
                </span>
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-sky-600 dark:text-sky-400">
                  {satkerBaik.length}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Satker
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs border-t border-sky-100 dark:border-sky-900/50 pt-2 text-sky-700 dark:text-sky-300 font-semibold">
                <span>Porsi Satker:</span>
                <span className="bg-sky-100 dark:bg-sky-900/80 text-sky-800 dark:text-sky-200 px-2 py-0.5 rounded text-[10px] font-extrabold">
                  {filterIssue === 'IKPA_BAIK' ? '✓ Filter Aktif' : `${((satkerBaik.length / (totalSatker || 1)) * 100).toFixed(0)}% Dari Total`}
                </span>
              </div>
            </div>

            {/* Card 3: Cukup (70 <= IKPA < 89) */}
            <div 
              onClick={() => {
                if (filterIssue === 'IKPA_CUKUP') {
                  setFilterIssue('ALL');
                  setFilterPredikat('ALL');
                } else {
                  setFilterIssue('IKPA_CUKUP');
                  setFilterPredikat('ALL');
                }
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                filterIssue === 'IKPA_CUKUP' 
                  ? (isDark ? 'bg-amber-950/70 border-amber-500 ring-2 ring-amber-500 shadow-lg' : 'bg-amber-50 border-amber-400 ring-2 ring-amber-500 shadow-md') 
                  : (isDark ? 'bg-slate-900 border-slate-800 hover:border-amber-700/60' : 'bg-white border-amber-200/80 shadow-xs hover:shadow-md hover:border-amber-300')
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                <span className="font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  CUKUP (70.00 ≤ IKPA &lt; 89.00)
                </span>
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                  {satkerCukup.length}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Satker
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs border-t border-amber-100 dark:border-amber-900/50 pt-2 text-amber-700 dark:text-amber-300 font-semibold">
                <span>Porsi Satker:</span>
                <span className="bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded text-[10px] font-extrabold">
                  {filterIssue === 'IKPA_CUKUP' ? '✓ Filter Aktif' : `${((satkerCukup.length / (totalSatker || 1)) * 100).toFixed(0)}% Dari Total`}
                </span>
              </div>
            </div>

            {/* Card 4: Kurang (< 70) */}
            <div 
              onClick={() => {
                if (filterIssue === 'IKPA_KURANG') {
                  setFilterIssue('ALL');
                  setFilterPredikat('ALL');
                } else {
                  setFilterIssue('IKPA_KURANG');
                  setFilterPredikat('ALL');
                }
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                filterIssue === 'IKPA_KURANG' 
                  ? (isDark ? 'bg-rose-950/70 border-rose-500 ring-2 ring-rose-500 shadow-lg' : 'bg-rose-50 border-rose-400 ring-2 ring-rose-500 shadow-md') 
                  : (isDark ? 'bg-slate-900 border-slate-800 hover:border-rose-700/60' : 'bg-white border-rose-200/80 shadow-xs hover:shadow-md hover:border-rose-300')
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                <span className="font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                  KURANG (IKPA &lt; 70.00)
                </span>
                <div className="p-2 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                  {satkerKurang.length}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Satker
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs border-t border-rose-100 dark:border-rose-900/50 pt-2 text-rose-700 dark:text-rose-300 font-semibold">
                <span>Porsi Satker:</span>
                <span className="bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded text-[10px] font-extrabold">
                  {filterIssue === 'IKPA_KURANG' ? '✓ Filter Aktif' : `${((satkerKurang.length / (totalSatker || 1)) * 100).toFixed(0)}% Dari Total`}
                </span>
              </div>
            </div>
          </div>

      {/* PUSAT ANALISIS & DIAGNOSTIK 8 INDIKATOR IKPA (BANTUAN PEMBINAAN KPPN) */}
      <div className={`p-6 rounded-3xl border shadow-xs space-y-5 transition-all ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 px-3 py-1 rounded-full text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              PUSAT ANALISIS &amp; DIAGNOSTIK 8 INDIKATOR IKPA (KPPN SMG I)
            </div>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <span>Evaluasi Kinerja Per-Indikator &amp; Early Warning Satker</span>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-bold border border-slate-200 dark:border-slate-700">
                PER-5/PB/2024
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Klik salah satu kartu indikator di bawah untuk melihat rincian satker yang nilainya <strong>Kurang (&lt; 70)</strong>, <strong>Cukup</strong>, <strong>Baik</strong>, maupun <strong>Sangat Baik</strong> beserta rekomendasi pembinaan taktis.
            </p>
          </div>

          <button
            onClick={() => setIsDiagnosticExpanded(!isDiagnosticExpanded)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            {isDiagnosticExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{isDiagnosticExpanded ? 'Sembunyikan Panel' : 'Buka Analisis Indikator'}</span>
          </button>
        </div>

        {/* 7 Indikator IKPA Interactive Selection Grid (Capaian Output dipisah di Dashboard khusus & Detail) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {[
            { key: 'revisiDipa' as const, label: 'Revisi DIPA', bobot: '10%', icon: FileEdit, avg: avgIndicators.revisiDipa },
            { key: 'deviasiHal3Dipa' as const, label: 'Deviasi Hal III', bobot: '10%', icon: BarChart3, avg: avgIndicators.deviasiHal3Dipa },
            { key: 'penyerapanAnggaran' as const, label: 'Penyerapan', bobot: '20%', icon: TrendingUp, avg: avgIndicators.penyerapanAnggaran },
            { key: 'belanjaKontraktual' as const, label: 'Kontraktual', bobot: '10%', icon: Briefcase, avg: avgIndicators.belanjaKontraktual },
            { key: 'penyelesaianTagihan' as const, label: 'Tagihan SPM', bobot: '10%', icon: FileCheck, avg: avgIndicators.penyelesaianTagihan },
            { key: 'pengelolaanUpTup' as const, label: 'UP & TUP', bobot: '10%', icon: Coins, avg: avgIndicators.pengelolaanUpTup },
            { key: 'dispensasiSpm' as const, label: 'Dispensasi', bobot: '5%', icon: AlertCircle, avg: avgIndicators.dispensasiSpm },
          ].map((item) => {
            const isSelected = selectedIndicatorKey === item.key;
            const IconComp = item.icon;
            const avgNum = parseFloat(item.avg) || 0;
            
            // Hitung satker yang nilainya kurang (< 70) pada indikator ini sesuai periode aktif
            const satkerKurangCount = effectiveSatkers.filter(s => (s.indikator[item.key] || 0) < 70).length;
            const satkerSangatBaikCount = effectiveSatkers.filter(s => (s.indikator[item.key] || 0) >= 95).length;

            return (
              <button
                key={item.key}
                onClick={() => {
                  setSelectedIndicatorKey(item.key);
                  setIndicatorPage(1);
                  if (!isDiagnosticExpanded) setIsDiagnosticExpanded(true);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                  isSelected
                    ? (isDark 
                        ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500 shadow-md' 
                        : 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-500 shadow-sm')
                    : (isDark 
                        ? 'bg-slate-800/60 border-slate-700 hover:border-slate-600 hover:bg-slate-800' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80')
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      isSelected 
                        ? 'bg-amber-500 text-white' 
                        : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.bobot}
                    </span>
                    <IconComp className={`w-4 h-4 ${
                      isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 group-hover:text-slate-600'
                    }`} />
                  </div>

                  <div className={`text-xs font-black truncate ${
                    isSelected 
                      ? 'text-amber-900 dark:text-amber-200' 
                      : isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {item.label}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-baseline justify-between">
                  <span className={`font-mono text-sm font-black ${
                    avgNum >= 95 ? 'text-emerald-600 dark:text-emerald-400' :
                    avgNum >= 89 ? 'text-sky-600 dark:text-sky-400' :
                    avgNum >= 70 ? 'text-amber-600 dark:text-amber-400' :
                    'text-rose-600 dark:text-rose-400'
                  }`}>
                    {item.avg}
                  </span>

                  {satkerKurangCount > 0 ? (
                    <span className="text-[9px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-1.5 py-0.2 rounded" title={`${satkerKurangCount} satker bernilai kurang (<70)`}>
                      ⚠️ {satkerKurangCount}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-1 rounded" title="Semua satker aman">
                      ✓ Optimal
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Drilldown Panel for Selected Indicator */}
        {isDiagnosticExpanded && (() => {
          const indicatorMetaMap = {
            revisiDipa: {
              name: 'Revisi DIPA',
              bobot: '10%',
              desc: 'Frekuensi revisi DIPA dalam kewenangan Kanwil DJPb / DJA (maksimal 1 kali per triwulan).',
              masalah: 'Satker terlalu sering melakukan revisi anggaran operasional atau keterlambatan penerbitan revisi DIPA petikan.',
              solusi: 'KPPN mengarahkan Satker menyusun Rencana Kerja Anggaran secara komprehensif (single window revision) agar revisi tidak melebihi kuota triwulanan.'
            },
            deviasiHal3Dipa: {
              name: 'Deviasi Halaman III DIPA',
              bobot: '10%',
              desc: 'Kesesuaian antara Rencana Penarikan Dana (RPD) bulanan pada Halaman III DIPA dengan realisasi SPM.',
              masalah: 'Realisasi anggaran bulanan meleset dari target RPD yang telah ditetapkan pada awal triwulan (deviasi > 15%).',
              solusi: 'KPPN mengingatkan Satker untuk melakukan pemutakhiran RPD Halaman III DIPA pada 10 hari kerja pertama awal triwulan di aplikasi SAKTI.'
            },
            penyerapanAnggaran: {
              name: 'Penyerapan Anggaran',
              bobot: '20%',
              desc: 'Realisasi penyerapan anggaran belanja terhadap pagu DIPA sesuai target proporsional triwulan berjalan.',
              masalah: 'Penyerapan anggaran lambat akibat lelang tertunda, blokir anggaran (automatic adjustment), atau pengajuan SPM non-kontraktual menumpuk di akhir periode.',
              solusi: 'KPPN mendorong percepatan penerbitan SPM-LS dan monitoring realisasi per jenis belanja (Belanja Pegawai, Barang, Modal, Bansos).'
            },
            belanjaKontraktual: {
              name: 'Belanja Kontraktual',
              bobot: '10%',
              desc: 'Pendaftaran kontrak ke KPPN maksimal 3 hari kerja dan percepatan pelaksanaan tender dini (pra-DIPA).',
              masalah: 'Data komitmen/kontrak baru didaftarkan ke KPPN melebihi batas waktu 3 hari kerja setelah penandatanganan SPK/kontrak.',
              solusi: 'Sosialisasi SOP pendaftaran kontrak dan percepatan input SPK pada Modul Komitmen SAKTI begitu kontrak ditandatangani PPK.'
            },
            penyelesaianTagihan: {
              name: 'Penyelesaian Tagihan (SPM-LS)',
              bobot: '10%',
              desc: 'Ketepatan waktu penerbitan SPM-LS Kontraktual non-pihak ketiga (maksimal 17 hari kerja sejak BAST).',
              masalah: 'SPM-LS diajukan ke KPPN melewati 17 hari kerja sejak tanggal Berita Acara Serah Terima (BAST) / penerimaan barang/jasa.',
              solusi: 'KPPN memonitor aging BAST pada Modul Komitmen SAKTI dan mendorong PPK segera memproses SPP setelah pekerjaan selesai.'
            },
            pengelolaanUpTup: {
              name: 'Pengelolaan UP dan TUP',
              bobot: '10%',
              desc: 'Ketepatan revolving GUP (minimal 1 kali per bulan sebesar 50%) dan pertanggungjawaban TUP tepat waktu.',
              masalah: 'Satker tidak melakukan revolving GUP dalam tempo 30 hari atau keterlambatan pengembalian sisa TUP ke Kas Negara.',
              solusi: 'KPPN menerbitkan surat pengingat revolving UP otomatis sebelum hari ke-30 dan monitoring saldo kas bendahara pengeluaran.'
            },
            dispensasiSpm: {
              name: 'Dispensasi SPM',
              bobot: '5%',
              desc: 'Pengendalian pengajuan dispensasi penerbitan SPM yang melampaui batas waktu reguler / akhir tahun anggaran.',
              masalah: 'Satker terlambat menyampaikan SPM sehingga membutuhkan persetujuan dispensasi dari Kepala KPPN / Kanwil DJPb.',
              solusi: 'Penerapan disiplin jadwal Langkah-Langkah Akhir Tahun (LLAT) dan penjadwalan penerbitan SPM sejak awal bulan.'
            },
            capaianOutput: {
              name: 'Capaian Output SAKTI',
              bobot: '25%',
              desc: 'Ketepatan pelaporan dan pencapaian target Keluaran Rincian Output (RO) pada modul Komitmen/Pelaporan SAKTI.',
              masalah: 'Satker belum melakukan input progres fisik dan capaian RO pada SAKTI sebelum cut-off period, atau nilai masih 0%.',
              solusi: 'KPPN melakukan rekonsiliasi berkala dan pendampingan intensif pengisian Capaian Output SAKTI sebelum tanggal 5 tiap bulan.'
            }
          }[selectedIndicatorKey];

          // Hitung satker per kategori pada indikator terpilih sesuai periode aktif
          const indSatkers = effectiveSatkers.map(s => {
            const val = s.indikator[selectedIndicatorKey] ?? 0;
            let kategori: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang' = 'Kurang';
            if (val >= 95) kategori = 'Sangat Baik';
            else if (val >= 89) kategori = 'Baik';
            else if (val >= 70) kategori = 'Cukup';
            return {
              ...s,
              indicatorValue: val,
              indicatorKategori: kategori
            };
          });

          const countSangatBaik = indSatkers.filter(s => s.indicatorKategori === 'Sangat Baik').length;
          const countBaik = indSatkers.filter(s => s.indicatorKategori === 'Baik').length;
          const countCukup = indSatkers.filter(s => s.indicatorKategori === 'Cukup').length;
          const countKurang = indSatkers.filter(s => s.indicatorKategori === 'Kurang').length;

          // Filter data berdasarkan kategori & search
          const filteredIndSatkers = indSatkers.filter(s => {
            if (indicatorPredikatFilter === 'SANGAT_BAIK' && s.indicatorKategori !== 'Sangat Baik') return false;
            if (indicatorPredikatFilter === 'BAIK' && s.indicatorKategori !== 'Baik') return false;
            if (indicatorPredikatFilter === 'CUKUP' && s.indicatorKategori !== 'Cukup') return false;
            if (indicatorPredikatFilter === 'KURANG' && s.indicatorKategori !== 'Kurang') return false;
            
            if (indicatorSearch.trim()) {
              const q = indicatorSearch.toLowerCase();
              return s.namaSatker.toLowerCase().includes(q) || s.kodeSatker.includes(q);
            }
            return true;
          }).sort((a, b) => a.indicatorValue - b.indicatorValue); // Nilai terendah di awal

          const indPageSize = 8;
          const indTotalPages = Math.max(1, Math.ceil(filteredIndSatkers.length / indPageSize));
          const pagedIndSatkers = filteredIndSatkers.slice((indicatorPage - 1) * indPageSize, indicatorPage * indPageSize);

          return (
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
            }`}>
              {/* Indicator Detail Header & Advice */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-amber-500 flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      ANALISIS DETAIL INDIKATOR: {indicatorMetaMap.name.toUpperCase()} ({indicatorMetaMap.bobot})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {indicatorMetaMap.desc}
                  </p>
                  <div className="pt-1 text-[11px] space-y-1 text-slate-500 dark:text-slate-400">
                    <p><strong>🚨 Akar Masalah Umum:</strong> {indicatorMetaMap.masalah}</p>
                    <p><strong>💡 Rekomendasi KPPN:</strong> {indicatorMetaMap.solusi}</p>
                  </div>
                </div>

                {/* 4 Predicate Mini Breakdown Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
                  <button
                    onClick={() => { setIndicatorPredikatFilter('KURANG'); setIndicatorPage(1); }}
                    className={`px-3 py-2 rounded-xl border text-center transition-all cursor-pointer ${
                      indicatorPredikatFilter === 'KURANG'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500'
                        : isDark ? 'bg-slate-900 border-slate-800 hover:border-rose-800' : 'bg-white border-rose-200 hover:border-rose-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block">Kurang (&lt;70)</span>
                    <span className="text-base font-black text-rose-600 dark:text-rose-400">{countKurang} Satker</span>
                  </button>

                  <button
                    onClick={() => { setIndicatorPredikatFilter('CUKUP'); setIndicatorPage(1); }}
                    className={`px-3 py-2 rounded-xl border text-center transition-all cursor-pointer ${
                      indicatorPredikatFilter === 'CUKUP'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500'
                        : isDark ? 'bg-slate-900 border-slate-800 hover:border-amber-800' : 'bg-white border-amber-200 hover:border-amber-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">Cukup (70-88.9)</span>
                    <span className="text-base font-black text-amber-600 dark:text-amber-400">{countCukup} Satker</span>
                  </button>

                  <button
                    onClick={() => { setIndicatorPredikatFilter('BAIK'); setIndicatorPage(1); }}
                    className={`px-3 py-2 rounded-xl border text-center transition-all cursor-pointer ${
                      indicatorPredikatFilter === 'BAIK'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300 ring-2 ring-sky-500'
                        : isDark ? 'bg-slate-900 border-slate-800 hover:border-sky-800' : 'bg-white border-sky-200 hover:border-sky-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block">Baik (89-94.9)</span>
                    <span className="text-base font-black text-sky-600 dark:text-sky-400">{countBaik} Satker</span>
                  </button>

                  <button
                    onClick={() => { setIndicatorPredikatFilter('SANGAT_BAIK'); setIndicatorPage(1); }}
                    className={`px-3 py-2 rounded-xl border text-center transition-all cursor-pointer ${
                      indicatorPredikatFilter === 'SANGAT_BAIK'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500'
                        : isDark ? 'bg-slate-900 border-slate-800 hover:border-emerald-800' : 'bg-white border-emerald-200 hover:border-emerald-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">Sangat Baik (≥95)</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{countSangatBaik} Satker</span>
                  </button>
                </div>
              </div>

              {/* Indicator Satker Table Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 mr-1">Filter List:</span>
                  {(['ALL', 'KURANG', 'CUKUP', 'BAIK', 'SANGAT_BAIK'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => { setIndicatorPredikatFilter(tab); setIndicatorPage(1); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        indicatorPredikatFilter === tab
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                          : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {tab === 'ALL' && `Semua (${indSatkers.length})`}
                      {tab === 'KURANG' && `🔴 Kurang (${countKurang})`}
                      {tab === 'CUKUP' && `🟡 Cukup (${countCukup})`}
                      {tab === 'BAIK' && `🔵 Baik (${countBaik})`}
                      {tab === 'SANGAT_BAIK' && `🟢 Sangat Baik (${countSangatBaik})`}
                    </button>
                  ))}
                </div>

                {/* Search in Indicator Table */}
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={indicatorSearch}
                    onChange={(e) => { setIndicatorSearch(e.target.value); setIndicatorPage(1); }}
                    placeholder="Cari nama / kode satker..."
                    className={`w-full text-xs rounded-xl pl-9 pr-3 py-1.5 border transition-all ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Indicator Satker List Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className={`${isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-700'} font-bold uppercase text-[10px]`}>
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">No</th>
                      <th className="py-2.5 px-4">Satuan Kerja</th>
                      <th className="py-2.5 px-3 text-center">Kategori</th>
                      <th className="py-2.5 px-3 text-center">
                        <div className="flex flex-col items-center">
                          <span>Nilai {indicatorMetaMap.name}</span>
                          <span className="text-[9px] font-semibold text-amber-500 normal-case tracking-normal">
                            (Bobot: {indicatorMetaMap.bobot})
                          </span>
                        </div>
                      </th>
                      <th className="py-2.5 px-4 text-center">Analisis &amp; Rekomendasi</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {pagedIndSatkers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 font-medium">
                          Tidak ada data Satker yang sesuai dengan kriteria filter.
                        </td>
                      </tr>
                    ) : (
                      pagedIndSatkers.map((satker, idx) => {
                        const rowNo = (indicatorPage - 1) * indPageSize + idx + 1;
                        const val = satker.indicatorValue;
                        const isRed = val < 70;

                        return (
                          <tr 
                            key={satker.id} 
                            className={`transition-colors ${
                              isDark ? 'hover:bg-slate-900/60' : 'hover:bg-white'
                            } ${isRed ? (isDark ? 'bg-rose-950/20' : 'bg-rose-50/40') : ''}`}
                          >
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                              {rowNo}
                            </td>

                            <td className="py-2.5 px-4">
                              <div className="font-extrabold text-slate-900 dark:text-white">
                                {satker.namaSatker}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                Kode: {satker.kodeSatker} • {satker.kodeBa ? `BA ${satker.kodeBa}` : (satker.unitEselon1 || 'KPPN Semarang I')}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                satker.indicatorKategori === 'Sangat Baik' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                satker.indicatorKategori === 'Baik' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' :
                                satker.indicatorKategori === 'Cukup' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}>
                                {satker.indicatorKategori}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <div className="flex flex-col items-center">
                                <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-lg border ${
                                  val >= 95 
                                    ? (isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200') :
                                  val >= 89 
                                    ? (isDark ? 'bg-sky-950/60 text-sky-300 border-sky-800/60' : 'bg-sky-50 text-sky-700 border-sky-200') :
                                  val >= 70 
                                    ? (isDark ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-800 border-amber-200') :
                                    (isDark ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-800 border-rose-200')
                                }`}>
                                  {val.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5" title={`Total IKPA Kumulatif: ${satker.nilaiTotalIKPA.toFixed(2)}`}>
                                  Total IKPA: {satker.nilaiTotalIKPA.toFixed(2)}
                                </span>
                              </div>
                            </td>

                            <td className="py-2.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setIndicatorAnalysisModalData({
                                    satker,
                                    indicatorKey: selectedIndicatorKey,
                                    value: val,
                                    category: satker.indicatorKategori,
                                    periodLabel: currentDisplayPeriodLabel
                                  })}
                                  className={`px-3 py-1.5 rounded-xl border text-xs font-black inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                                    val < 70
                                      ? (isDark 
                                          ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-300 hover:scale-105' 
                                          : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-700 hover:scale-105')
                                      : val < 89
                                      ? (isDark 
                                          ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300 hover:scale-105' 
                                          : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800 hover:scale-105')
                                      : (isDark 
                                          ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300 hover:scale-105' 
                                          : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 hover:scale-105')
                                  }`}
                                  title={`Buka Analisis Diagnostik & Solusi Taktis untuk ${satker.namaSatker}`}
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Analisis &amp; Rekomendasi</span>
                                </button>

                                <button
                                  onClick={() => onSelectSatker(satker)}
                                  className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                                    isDark 
                                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' 
                                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                                  }`}
                                  title="Buka Profil Lengkap & Histori Satker"
                                >
                                  <Eye className="w-3.5 h-3.5" />
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

              {/* Indicator Table Pagination */}
              {indTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-slate-500 font-medium">
                    Halaman {indicatorPage} dari {indTotalPages} ({filteredIndSatkers.length} Satker)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIndicatorPage(Math.max(1, indicatorPage - 1))}
                      disabled={indicatorPage === 1}
                      className="px-2.5 py-1 rounded-lg border text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Sebelumnya
                    </button>
                    <button
                      onClick={() => setIndicatorPage(Math.min(indTotalPages, indicatorPage + 1))}
                      disabled={indicatorPage === indTotalPages}
                      className="px-2.5 py-1 rounded-lg border text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
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
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Periode: {currentDisplayPeriodLabel}</span> | Menampilkan {filteredSatkers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, filteredSatkers.length)} dari total {filteredSatkers.length} Satker ({hasAnyIKPA ? 'Fokus Nilai & Indikator IKPA' : 'Fokus Pelaporan Capaian Output SAKTI'})
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

            {/* Period Filter Dropdown in Table Toolbar */}
            <div className={`flex items-center gap-1.5 text-xs rounded-xl px-3 py-1.5 border shadow-2xs ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <CalendarRange className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Periode:</span>
              <select
                value={selectedMonthPeriod}
                onChange={(e) => setSelectedMonthPeriod(e.target.value)}
                className={`bg-transparent font-bold focus:outline-none cursor-pointer ${
                  isDark ? 'text-emerald-400 bg-slate-900' : 'text-emerald-700'
                }`}
              >
                <option value="LATEST" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>⭐ Terbaru ({latestMonthName} 2026)</option>
                {availableUploadedMonths.map(m => (
                  <option key={m} value={m} className={isDark ? 'bg-slate-900 text-slate-100' : ''}>s.d. {m} 2026</option>
                ))}
              </select>
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
                <option value="Sangat Baik" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>Sangat Baik (≥ 95.00)</option>
                <option value="Baik" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>Baik (89.00 - 94.99)</option>
                <option value="Cukup" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>Cukup (70.00 - 88.99)</option>
                <option value="Kurang" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>Kurang (&lt; 70.00)</option>
              </select>
            </div>

            <div className={`flex items-center gap-1.5 text-xs rounded-xl px-3 py-1.5 border shadow-2xs ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Filter Kategori IKPA:</span>
              <select
                value={filterIssue}
                onChange={(e) => setFilterIssue(e.target.value)}
                className={`bg-transparent font-medium focus:outline-none cursor-pointer ${
                  isDark ? 'text-slate-100 bg-slate-900' : 'text-slate-800'
                }`}
              >
                <option value="ALL" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>Semua Satker IKPA</option>
                <option value="IKPA_SANGAT_BAIK" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>⭐ Sangat Baik (≥ 95.00)</option>
                <option value="IKPA_BAIK" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>🟢 Baik (89.00 - 94.99)</option>
                <option value="IKPA_CUKUP" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>🟡 Cukup (70.00 - 88.99)</option>
                <option value="IKPA_KURANG" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>🔴 Kurang (&lt; 70.00)</option>
                <option value="PENYERAPAN_RENDAH" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>📉 Penyerapan Anggaran &lt; 85%</option>
                <option value="DEVIASI_TINGGI" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>📊 Deviasi Hal III DIPA &lt; 85%</option>
                <option value="DISPENSASI_SPM" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>⚠️ Ada Dispensasi SPM</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content (Desktop View) */}
        <div className="hidden md:block overflow-x-auto">
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            <thead className={`${isDark ? 'bg-slate-950/80 text-slate-300 border-slate-800' : 'bg-slate-100/80 text-slate-600 border-slate-200'} font-bold uppercase tracking-wider border-b`}>
              <tr>
                <th className="py-3.5 px-3 text-center w-12">No</th>
                <th className="py-3.5 px-4 min-w-[220px]">Kode &amp; Satuan Kerja</th>
                <th className="py-3.5 px-3 text-center">Periode Terakhir</th>
                <th className="py-3.5 px-4 min-w-[340px]">8 Indikator Kinerja IKPA</th>
                <th className="py-3.5 px-4 text-center">Nilai Akhir (Kolom U)</th>
                <th className="py-3.5 px-4 text-center">Predikat</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/80' : 'divide-slate-200'}`}>
              {filteredSatkers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
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
                paginatedSatkers.map((satker, idx) => {
                  const isRedFlag = satker.nilaiTotalIKPA < 87.5;
                  const rowNumber = (currentPage - 1) * (pageSize > 0 ? pageSize : 0) + idx + 1;
                  const ind = satker.indikator;
                  
                  return (
                    <tr 
                      key={satker.id} 
                      className={`transition-colors ${
                        isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                      } ${
                        isRedFlag ? (isDark ? 'bg-rose-950/30' : 'bg-rose-50/20') : ''
                      }`}
                    >
                      {/* No */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400">
                        {rowNumber}
                      </td>

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
                          <span className={isDark ? 'text-slate-300' : 'text-slate-500'}>
                            • {satker.kodeBa ? `BA ${satker.kodeBa}` : (satker.unitEselon1 || 'KPPN Semarang I')}
                          </span>
                        </div>
                      </td>

                      {/* Periode Terakhir */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-1 rounded-lg border ${
                          isDark 
                            ? 'bg-slate-800/80 text-sky-300 border-slate-700' 
                            : 'bg-sky-50 text-sky-800 border-sky-200'
                        }`}>
                          <Calendar className="w-3 h-3 text-sky-500" />
                          {satker.periodeUpdate || latestUploadedMonth}
                        </span>
                      </td>

                      {/* 8 Indikator Kinerja IKPA */}
                      <td className="py-3 px-3">
                        <div className="grid grid-cols-4 gap-1.5 min-w-[340px] max-w-[420px]">
                          {/* Revisi DIPA */}
                          <div className={`px-2 py-1 rounded-lg border flex items-center justify-between transition-all ${
                            ind.revisiDipa >= 95 ? (isDark ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-800 border-emerald-200') :
                            ind.revisiDipa >= 80 ? (isDark ? 'bg-amber-950/30 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-800 border-amber-200') :
                            (isDark ? 'bg-rose-950/30 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-800 border-rose-200')
                          }`} title="Revisi DIPA (Bobot 10%)">
                            <span className="text-[10px] font-semibold text-slate-400">Revisi</span>
                            <span className="font-mono text-[11px] font-extrabold">{ind.revisiDipa}</span>
                          </div>

                          {/* Deviasi Halaman III DIPA */}
                          <div className={`px-2 py-1 rounded-lg border flex items-center justify-between transition-all ${
                            ind.deviasiHal3Dipa >= 85 ? (isDark ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-800 border-emerald-200') :
                            ind.deviasiHal3Dipa >= 70 ? (isDark ? 'bg-amber-950/30 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-800 border-amber-200') :
                            (isDark ? 'bg-rose-950/30 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-800 border-rose-200')
                          }`} title="Deviasi Halaman III DIPA (Bobot 10%)">
                            <span className="text-[10px] font-semibold text-slate-400">Deviasi</span>
                            <span className="font-mono text-[11px] font-extrabold">{ind.deviasiHal3Dipa}</span>
                          </div>

                          {/* Penyerapan Anggaran */}
                          <div className={`px-2 py-1 rounded-lg border flex items-center justify-between transition-all ${
                            ind.penyerapanAnggaran >= 85 ? (isDark ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-800 border-emerald-200') :
                            ind.penyerapanAnggaran >= 70 ? (isDark ? 'bg-amber-950/30 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-800 border-amber-200') :
                            (isDark ? 'bg-rose-950/30 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-800 border-rose-200')
                          }`} title="Penyerapan Anggaran (Bobot 20%)">
                            <span className="text-[10px] font-semibold text-slate-400">Serap</span>
                            <span className="font-mono text-[11px] font-extrabold">{ind.penyerapanAnggaran}</span>
                          </div>

                          {/* Belanja Kontraktual */}
                          <div className={`px-2 py-1 rounded-lg border flex items-center justify-between transition-all ${
                            ind.belanjaKontraktual >= 90 ? (isDark ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-800 border-emerald-200') :
                            ind.belanjaKontraktual >= 70 ? (isDark ? 'bg-amber-950/30 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-800 border-amber-200') :
                            (isDark ? 'bg-rose-950/30 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-800 border-rose-200')
                          }`} title="Belanja Kontraktual (Bobot 10%)">
                            <span className="text-[10px] font-semibold text-slate-400">Kontrak</span>
                            <span className="font-mono text-[11px] font-extrabold">{ind.belanjaKontraktual}</span>
                          </div>

                          {/* Penyelesaian Tagihan SPM */}
                          <div className={`px-2 py-1 rounded-lg border flex items-center justify-between transition-all ${
                            ind.penyelesaianTagihan >= 90 ? (isDark ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-800 border-emerald-200') :
                            ind.penyelesaianTagihan >= 70 ? (isDark ? 'bg-amber-950/30 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-800 border-amber-200') :
                            (isDark ? 'bg-rose-950/30 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-800 border-rose-200')
                          }`} title="Penyelesaian Tagihan SPM (Bobot 10%)">
                            <span className="text-[10px] font-semibold text-slate-400">Tagihan</span>
                            <span className="font-mono text-[11px] font-extrabold">{ind.penyelesaianTagihan}</span>
                          </div>

                          {/* Pengelolaan UP dan TUP */}
                          <div className={`px-2 py-1 rounded-lg border flex items-center justify-between transition-all ${
                            ind.pengelolaanUpTup >= 90 ? (isDark ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-800 border-emerald-200') :
                            ind.pengelolaanUpTup >= 70 ? (isDark ? 'bg-amber-950/30 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-800 border-amber-200') :
                            (isDark ? 'bg-rose-950/30 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-800 border-rose-200')
                          }`} title="Pengelolaan UP dan TUP (Bobot 10%)">
                            <span className="text-[10px] font-semibold text-slate-400">UP/TUP</span>
                            <span className="font-mono text-[11px] font-extrabold">{ind.pengelolaanUpTup}</span>
                          </div>

                          {/* Dispensasi SPM */}
                          <div className={`px-2 py-1 rounded-lg border flex items-center justify-between transition-all ${
                            ind.dispensasiSpm >= 95 ? (isDark ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-800 border-emerald-200') :
                            (isDark ? 'bg-rose-950/30 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-800 border-rose-200')
                          }`} title="Dispensasi SPM (Bobot 5% Pengurangan)">
                            <span className="text-[10px] font-semibold text-slate-400">Dispen</span>
                            <span className="font-mono text-[11px] font-extrabold">{ind.dispensasiSpm}</span>
                          </div>

                          {/* Capaian Output SAKTI */}
                          <div className={`px-2 py-1 rounded-lg border flex items-center justify-between transition-all ${
                            ind.capaianOutput >= 95 ? (isDark ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/60' : 'bg-emerald-50 text-emerald-800 border-emerald-200') :
                            ind.capaianOutput > 0 ? (isDark ? 'bg-amber-950/30 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-800 border-amber-200') :
                            (isDark ? 'bg-rose-950/30 text-rose-300 border-rose-800/60' : 'bg-rose-50 text-rose-800 border-rose-200')
                          }`} title="Capaian Output SAKTI (Bobot 25%)">
                            <span className="text-[10px] font-semibold text-slate-400">Output</span>
                            <span className="font-mono text-[11px] font-extrabold">{ind.capaianOutput}</span>
                          </div>
                        </div>
                      </td>

                      {/* Nilai Akhir IKPA (Kolom U) */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`font-mono text-base font-black px-3.5 py-1 rounded-xl border shadow-xs ${
                            satker.nilaiTotalIKPA >= 95 
                              ? (isDark ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600 shadow-emerald-500/10' : 'bg-emerald-100 text-emerald-950 border-emerald-400') :
                            satker.nilaiTotalIKPA >= 87.5 
                              ? (isDark ? 'bg-blue-950/90 text-blue-300 border-blue-600' : 'bg-blue-100 text-blue-950 border-blue-400') :
                            satker.nilaiTotalIKPA >= 70 
                              ? (isDark ? 'bg-amber-950/90 text-amber-300 border-amber-600' : 'bg-amber-100 text-amber-950 border-amber-400') :
                              (isDark ? 'bg-rose-950/90 text-rose-300 border-rose-600' : 'bg-rose-100 text-rose-950 border-rose-400')
                          }`}>
                            {satker.nilaiTotalIKPA.toFixed(2)}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 mt-1">Kolom U</span>
                        </div>
                      </td>

                      {/* Predikat */}
                      <td className="py-3 px-3 text-center">
                        {getPredikatBadge(satker.predikat, satker.nilaiTotalIKPA, satker.hasIKPAData)}
                      </td>

                      {/* Aksi Detail & Evaluasi */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onSelectSatker(satker)}
                          className={`px-3 py-2 rounded-xl border transition-all cursor-pointer inline-flex items-center gap-1.5 font-extrabold text-xs shadow-xs active:scale-95 ${
                            isDark 
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-300' 
                              : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                          }`}
                          title="Buka Histori Bulanan & Evaluasi Kinerja PER-5/PB/2024"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-500" />
                          <span>Detail &amp; Histori</span>
                        </button>
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
            filteredSatkers.map((satker, idx) => {
              const isRedFlag = satker.nilaiTotalIKPA < 87.5;
              const ind = satker.indikator;
              return (
                <div key={satker.id} className={`p-4 space-y-3 ${
                  isRedFlag 
                    ? (isDark ? 'bg-rose-950/20' : 'bg-rose-50/20') 
                    : (isDark ? 'bg-slate-900' : 'bg-white')
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[11px] px-2 py-0.5 rounded-md font-extrabold border ${
                          isDark ? 'bg-sky-950/80 text-sky-300 border-sky-700/80' : 'bg-slate-200 text-slate-800 border-slate-300'
                        }`}>
                          {satker.kodeSatker}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isDark ? 'bg-slate-800 text-sky-300 border-slate-700' : 'bg-sky-50 text-sky-800 border-sky-200'
                        }`}>
                          {satker.periodeUpdate || latestUploadedMonth}
                        </span>
                      </div>
                      <h4 className={`font-extrabold text-sm mt-1 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {satker.namaSatker}
                      </h4>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-base font-black text-amber-500">
                        {satker.nilaiTotalIKPA.toFixed(2)}
                      </div>
                      {getPredikatBadge(satker.predikat, satker.nilaiTotalIKPA, satker.hasIKPAData)}
                    </div>
                  </div>

                  {/* 8 Indicators Grid Mini */}
                  <div className="grid grid-cols-4 gap-1 text-[10px] pt-1">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-center">
                      <span className="block text-[8px] text-slate-400">Revisi</span>
                      <span className="font-mono font-bold">{ind.revisiDipa}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-center">
                      <span className="block text-[8px] text-slate-400">Deviasi</span>
                      <span className="font-mono font-bold">{ind.deviasiHal3Dipa}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-center">
                      <span className="block text-[8px] text-slate-400">Serap</span>
                      <span className="font-mono font-bold">{ind.penyerapanAnggaran}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-center">
                      <span className="block text-[8px] text-slate-400">Kontrak</span>
                      <span className="font-mono font-bold">{ind.belanjaKontraktual}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-center">
                      <span className="block text-[8px] text-slate-400">Tagihan</span>
                      <span className="font-mono font-bold">{ind.penyelesaianTagihan}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-center">
                      <span className="block text-[8px] text-slate-400">UP/TUP</span>
                      <span className="font-mono font-bold">{ind.pengelolaanUpTup}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-center">
                      <span className="block text-[8px] text-slate-400">Dispen</span>
                      <span className="font-mono font-bold">{ind.dispensasiSpm}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-center">
                      <span className="block text-[8px] text-slate-400">Output</span>
                      <span className="font-mono font-bold">{ind.capaianOutput}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => onSelectSatker(satker)}
                      className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl border text-center min-h-[42px] flex items-center justify-center gap-1.5 active:scale-98 transition-transform cursor-pointer ${
                        isDark ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      <Eye className="w-4 h-4 text-amber-500" />
                      Detail &amp; Histori Bulanan
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

      {/* Interactive Indicator Analysis & Tactical Recommendation Modal */}
      <IndicatorAnalysisModal
        data={indicatorAnalysisModalData}
        onClose={() => setIndicatorAnalysisModalData(null)}
        onSelectSatker={onSelectSatker}
        onOpenReminder={onOpenReminder}
        theme={theme}
      />

    </div>
  );
};
