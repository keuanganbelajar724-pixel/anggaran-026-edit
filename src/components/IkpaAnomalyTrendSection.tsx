import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Sparkles, 
  Search, 
  Download, 
  Eye, 
  Calendar, 
  Building2, 
  FileSpreadsheet,
  Target,
  BarChart3,
  Activity,
  RefreshCw,
  User,
  Zap
} from 'lucide-react';
import { SatkerIKPA, RiwayatBulananIKPA, IndikatorIKPA } from '../types';
import { IndicatorAnalysisModalData } from './IndicatorAnalysisModal';
import { AnomalyDetailAnalysisModal } from './AnomalyDetailAnalysisModal';

export type AnomalyType = 'DROP_TAJAM' | 'TREN_MENURUN' | 'INDIKATOR_TIMPANG' | 'ANOMALI_POSITIF';
export type UrgencyLevel = 'DARURAT' | 'PRIORITAS_TINGGI' | 'WASPADA' | 'APRESIASI';

export interface AnomalyRecord {
  satker: SatkerIKPA;
  type: AnomalyType;
  urgency: UrgencyLevel;
  currentScore: number;
  previousScore: number;
  deltaScore: number;
  currentMonth: string;
  previousMonth: string;
  consecutiveDropCount: number;
  historySummary: { bulan: string; score: number }[];
  pemicuUtama: {
    indicatorKey: keyof IndikatorIKPA;
    name: string;
    bobot: string;
    currentVal: number;
    prevVal?: number;
    deltaVal: number;
    reason: string;
    solution: string;
  }[];
  narasiRingkas: string;
  langkahTaktis: string[];
}

interface IkpaAnomalyTrendSectionProps {
  satkers: SatkerIKPA[];
  currentPeriodLabel: string;
  activeMonth: string;
  isDark: boolean;
  onSelectSatker: (satker: SatkerIKPA) => void;
  onOpenIndicatorAnalysis?: (data: IndicatorAnalysisModalData) => void;
}

const MONTHS_ORDER = [
  'januari', 'februari', 'maret', 'april', 'mei', 'juni',
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
];

export const IkpaAnomalyTrendSection: React.FC<IkpaAnomalyTrendSectionProps> = ({
  satkers,
  currentPeriodLabel,
  activeMonth,
  isDark,
  onSelectSatker,
  onOpenIndicatorAnalysis
}) => {
  // Filter & Search states
  const [filterType, setFilterType] = useState<string>('ALL'); // ALL, ALL_NEGATIVE, DROP_TAJAM, TREN_MENURUN, INDIKATOR_TIMPANG, ANOMALI_POSITIF
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'DROP_DESC' | 'GAIN_DESC' | 'SCORE_ASC' | 'URGENCY'>('DROP_DESC');
  
  // Detail Analysis Modal state
  const [selectedAnomalyForModal, setSelectedAnomalyForModal] = useState<AnomalyRecord | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // 1. ANOMALY & TREND DETECTION ENGINE
  const anomalyRecords = useMemo(() => {
    const records: AnomalyRecord[] = [];
    const targetMonthClean = (activeMonth || 'juli').toLowerCase();

    satkers.forEach(s => {
      // Sort monthly history if exists
      const rawHist = Array.isArray(s.riwayatBulanan) ? [...s.riwayatBulanan] : [];
      rawHist.sort((a, b) => {
        const aIdx = MONTHS_ORDER.findIndex(m => (a.bulan || '').toLowerCase().includes(m));
        const bIdx = MONTHS_ORDER.findIndex(m => (b.bulan || '').toLowerCase().includes(m));
        return (aIdx !== -1 ? aIdx : 0) - (bIdx !== -1 ? bIdx : 0);
      });

      const validHist = rawHist.filter(h => typeof h.nilaiIKPA === 'number' && h.nilaiIKPA > 0);
      const currentScore = Number.isFinite(s.nilaiTotalIKPA) ? Number(s.nilaiTotalIKPA) : 0;

      // Extract current vs previous values
      let previousScore = currentScore;
      let deltaScore = 0;
      let currentMonthName = activeMonth || 'Juli';
      let previousMonthName = 'Bulan Lalu';
      let consecutiveDropCount = 0;

      // Indicators
      const curInd = s.indikator || {
        revisiDipa: 100, deviasiHal3Dipa: 100, penyerapanAnggaran: 100,
        belanjaKontraktual: 100, penyelesaianTagihan: 100, pengelolaanUpTup: 100,
        dispensasiSpm: 100, capaianOutput: 100
      };

      let prevHistMatch: RiwayatBulananIKPA | null = null;

      if (validHist.length >= 2) {
        // Find index of current month in history
        const curIdx = validHist.findIndex(h => (h.bulan || '').toLowerCase().includes(targetMonthClean));
        const latestIdx = curIdx !== -1 ? curIdx : validHist.length - 1;
        const curHist = validHist[latestIdx];
        
        if (latestIdx > 0) {
          prevHistMatch = validHist[latestIdx - 1];
          previousScore = prevHistMatch.nilaiIKPA;
          currentMonthName = curHist.bulan;
          previousMonthName = prevHistMatch.bulan;
          deltaScore = Number((currentScore - previousScore).toFixed(2));
        }

        // Calculate consecutive drop backwards
        for (let i = latestIdx; i > 0; i--) {
          const cVal = validHist[i].nilaiIKPA;
          const pVal = validHist[i - 1].nilaiIKPA;
          if (cVal < pVal) {
            consecutiveDropCount++;
          } else {
            break;
          }
        }
      } else if (validHist.length === 1) {
        currentMonthName = validHist[0].bulan;
      }

      // Check indicator-level shifts
      const pemicuList: AnomalyRecord['pemicuUtama'] = [];

      const checkInd = (
        key: keyof IndikatorIKPA,
        name: string,
        bobot: string,
        curVal: number,
        prevVal: number | undefined,
        reason: string,
        solution: string
      ) => {
        const indDelta = prevVal !== undefined ? Number((curVal - prevVal).toFixed(2)) : (curVal < 70 ? -30 : 0);
        if (indDelta <= -5 || curVal < 70 || (curVal === 0 && (s.nilaiTotalIKPA || 0) > 60)) {
          pemicuList.push({
            indicatorKey: key,
            name,
            bobot,
            currentVal: curVal,
            prevVal,
            deltaVal: indDelta,
            reason,
            solution
          });
        }
      };

      checkInd(
        'belanjaKontraktual',
        'Belanja Kontraktual',
        '10%',
        curInd.belanjaKontraktual ?? 0,
        prevHistMatch?.belanjaKontraktual,
        'Pendaftaran kontrak ke KPPN melebihi batas waktu 3 hari kerja sejak penandatanganan SPK / belum diinput di SAKTI.',
        'Sosialisasi SOP pendaftaran kontrak maks 3 hari kerja dan monitoring Modul Komitmen sebelum tanggal cut-off.'
      );

      checkInd(
        'deviasiHal3Dipa',
        'Deviasi Halaman III DIPA',
        '10%',
        curInd.deviasiHal3Dipa ?? 0,
        prevHistMatch?.deviasiHal3Dipa,
        'Realisasi anggaran bulanan meleset dari Rencana Penarikan Dana (RPD) pada Hal III DIPA (> 15% deviasi).',
        'Lakukan pemutakhiran RPD Halaman III DIPA pada 10 hari kerja pertama awal triwulan di aplikasi SAKTI.'
      );

      checkInd(
        'capaianOutput',
        'Capaian Output SAKTI',
        '25%',
        curInd.capaianOutput ?? 0,
        prevHistMatch?.capaianOutput,
        'Belum melakukan input progres fisik dan capaian rincian output (RO) pada modul Pelaporan SAKTI.',
        'Segera lakukan rekonsiliasi data dan pengisian Capaian Output SAKTI serta konfirmasi PPK sebelum tanggal 5 tiap bulan.'
      );

      checkInd(
        'penyerapanAnggaran',
        'Penyerapan Anggaran',
        '20%',
        curInd.penyerapanAnggaran ?? 0,
        prevHistMatch?.penyerapanAnggaran,
        'Realisasi belanja belum memenuhi target proporsional triwulanan.',
        'Akselerasi pengajuan SPM belanja barang/modal ke KPPN dan koordinasikan kegiatan tertunda.'
      );

      checkInd(
        'pengelolaanUpTup',
        'Pengelolaan UP & TUP',
        '10%',
        curInd.pengelolaanUpTup ?? 0,
        prevHistMatch?.pengelolaanUpTup,
        'Keterlambatan revolving GUP melebihi tempo 30 hari atau pertanggungjawaban sisa TUP belum tuntas.',
        'Lakukan revolving GUP minimal 1 kali per bulan (minimal 50%) dan setorkan sisa TUP sebelum batas waktu.'
      );

      checkInd(
        'penyelesaianTagihan',
        'Penyelesaian Tagihan (SPM-LS)',
        '10%',
        curInd.penyelesaianTagihan ?? 0,
        prevHistMatch?.penyelesaianTagihan,
        'SPM-LS diajukan ke KPPN melewati 17 hari kerja sejak tanggal Berita Acara Serah Terima (BAST).',
        'Pantau aging BAST pada Modul Komitmen SAKTI dan segera terbitkan SPP begitu pekerjaan selesai.'
      );

      checkInd(
        'revisiDipa',
        'Revisi DIPA',
        '10%',
        curInd.revisiDipa ?? 0,
        prevHistMatch?.revisiDipa,
        'Frekuensi revisi DIPA pada kewenangan Kanwil DJPb melebihi batas 1 kali per triwulan.',
        'Terapkan single-window revision secara komprehensif pada awal triwulan agar revisi tetap terkendali.'
      );

      checkInd(
        'dispensasiSpm',
        'Dispensasi SPM',
        '5%',
        curInd.dispensasiSpm ?? 0,
        prevHistMatch?.dispensasiSpm,
        'Terdapat pengajuan dispensasi penerbitan SPM yang melampaui batas waktu reguler KPPN.',
        'Hindari penerbitan SPM di masa batas akhir (LLAT) dan jadwalkan administrasi pembayaran lebih awal.'
      );

      // Sort pemicu by largest negative impact
      pemicuList.sort((a, b) => a.deltaVal - b.deltaVal || a.currentVal - b.currentVal);

      // 2. CLASSIFY ANOMALY TYPE
      let detectedType: AnomalyType | null = null;
      let urgency: UrgencyLevel = 'WASPADA';
      let narasi = '';
      const langkahTaktis: string[] = [];

      // A. ANOMALI POSITIF (Lonjakan Kinerja)
      if (deltaScore >= 4.0 || (previousScore < 89 && currentScore >= 95)) {
        detectedType = 'ANOMALI_POSITIF';
        urgency = 'APRESIASI';
        narasi = `Kinerja IKPA ${s.namaSatker} mengalami lonjakan signifikan sebesar +${deltaScore.toFixed(2)} poin (dari ${previousScore.toFixed(2)} pada ${previousMonthName} menjadi ${currentScore.toFixed(2)} pada ${currentMonthName}).`;
        langkahTaktis.push('Berikan apresiasi resmi atas peningkatan kinerja yang luar biasa.');
        langkahTaktis.push('Dokumentasikan best practice percepatan indikator sebagai percontohan bagi satker lain.');
      }
      // B. DROP TAJAM (Anjlok Drastis)
      else if (deltaScore <= -4.0 || (previousScore >= 89 && currentScore < 85) || (previousScore >= 95 && currentScore < 89)) {
        detectedType = 'DROP_TAJAM';
        if (deltaScore <= -8.0 || currentScore < 70) {
          urgency = 'DARURAT';
        } else {
          urgency = 'PRIORITAS_TINGGI';
        }
        narasi = `Kinerja IKPA ${s.namaSatker} drop tajam sebesar ${deltaScore.toFixed(2)} poin dari ${previousScore.toFixed(2)} (${previousMonthName}) menjadi ${currentScore.toFixed(2)} (${currentMonthName}).`;
        langkahTaktis.push('Lakukan pemanggilan/asistensi prioritas oleh Seksi MSKI KPPN Semarang I.');
        langkahTaktis.push(`Fokus pendampingan segera pada indikator pemicu utama: ${pemicuList.slice(0, 2).map(p => `${p.name} (${p.currentVal.toFixed(1)})`).join(', ')}.`);
      }
      // C. TREN MENURUN BERUNTUN (Makin menurun terus)
      else if (consecutiveDropCount >= 2 || (deltaScore <= -1.5 && validHist.length >= 3)) {
        detectedType = 'TREN_MENURUN';
        if (consecutiveDropCount >= 3 || currentScore < 75) {
          urgency = 'DARURAT';
        } else {
          urgency = 'PRIORITAS_TINGGI';
        }
        narasi = `Kinerja IKPA ${s.namaSatker} mengalami tren penurunan berturut-turut selama ${consecutiveDropCount} bulan berturut-turut dengan skor terkini ${currentScore.toFixed(2)}.`;
        langkahTaktis.push('Kirimkan surat pengingat early warning tren penurunan kinerja sebelum penutupan triwulan.');
        langkahTaktis.push('Identifikasi kendala struktural yang dihadapi PPK/Bendahara dalam siklus bulanan.');
      }
      // D. INDIKATOR TIMPANG (Blindspot Bahaya)
      else if (currentScore >= 75 && pemicuList.some(p => p.currentVal === 0 || p.currentVal < 50)) {
        detectedType = 'INDIKATOR_TIMPANG';
        urgency = 'WASPADA';
        const brokenInd = pemicuList.find(p => p.currentVal === 0 || p.currentVal < 50);
        narasi = `Meskipun nilai total IKPA berada pada posisi ${currentScore.toFixed(2)}, terdapat anomali nilai anjlok ekstrem pada indikator ${brokenInd?.name} (${brokenInd?.currentVal.toFixed(1)}).`;
        langkahTaktis.push(`Kawal khusus penyelesaian bottleneck indikator ${brokenInd?.name} agar tidak menurunkan predikat triwulanan.`);
        langkahTaktis.push('Konfirmasi kendala teknis SAKTI pada modul terkait.');
      }
      // E. JIKA SATKER NILAI KURANG (< 70) tanpa riwayat bulan lengkap
      else if (currentScore < 70) {
        detectedType = 'DROP_TAJAM';
        urgency = 'DARURAT';
        narasi = `Nilai IKPA ${s.namaSatker} berada pada kategori Kurang (< 70) sebesar ${currentScore.toFixed(2)}, membutuhkan intervensi dan bimbingan teknis KPPN segera.`;
        langkahTaktis.push('Agendakan asistensi one-on-one antara Pembina MSKI dan Pengelola Keuangan Satker.');
      }

      if (detectedType) {
        // Collect history summary
        const historySummary = validHist.map(h => ({
          bulan: h.bulan,
          score: Number(h.nilaiIKPA.toFixed(2))
        }));

        records.push({
          satker: s,
          type: detectedType,
          urgency,
          currentScore,
          previousScore,
          deltaScore,
          currentMonth: currentMonthName,
          previousMonth: previousMonthName,
          consecutiveDropCount,
          historySummary,
          pemicuUtama: pemicuList,
          narasiRingkas: narasi,
          langkahTaktis: langkahTaktis.length > 0 ? langkahTaktis : ['Lakukan pemantauan berkala pada data transaksi SAKTI.']
        });
      }
    });

    return records;
  }, [satkers, activeMonth]);

  // Summary counts
  const countTotalAnomali = anomalyRecords.length;
  const countDropTajam = anomalyRecords.filter(r => r.type === 'DROP_TAJAM').length;
  const countTrenMenurun = anomalyRecords.filter(r => r.type === 'TREN_MENURUN').length;
  const countIndikatorTimpang = anomalyRecords.filter(r => r.type === 'INDIKATOR_TIMPANG').length;
  const countAnomaliPositif = anomalyRecords.filter(r => r.type === 'ANOMALI_POSITIF').length;
  const countNegativeTotal = countDropTajam + countTrenMenurun + countIndikatorTimpang;

  // Filtered and Sorted Records
  const filteredRecords = useMemo(() => {
    return anomalyRecords.filter(r => {
      // Type Filter
      if (filterType === 'ALL_NEGATIVE') {
        if (r.type === 'ANOMALI_POSITIF') return false;
      } else if (filterType !== 'ALL') {
        if (r.type !== filterType) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.satker.namaSatker.toLowerCase().includes(q);
        const matchCode = r.satker.kodeSatker.toLowerCase().includes(q);
        const matchKL = (r.satker.kementerianLembaga || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchKL) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'DROP_DESC') {
        return a.deltaScore - b.deltaScore; // Nilai delta paling minus di paling atas
      } else if (sortBy === 'GAIN_DESC') {
        return b.deltaScore - a.deltaScore; // Nilai delta paling tinggi di paling atas
      } else if (sortBy === 'SCORE_ASC') {
        return a.currentScore - b.currentScore;
      } else if (sortBy === 'URGENCY') {
        const rank = { DARURAT: 1, PRIORITAS_TINGGI: 2, WASPADA: 3, APRESIASI: 4 };
        return rank[a.urgency] - rank[b.urgency];
      }
      return 0;
    });
  }, [anomalyRecords, filterType, searchQuery, sortBy]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const pagedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Handle Export CSV
  const handleExportAnomalyCSV = () => {
    const headers = [
      'No',
      'Kode Satker',
      'Nama Satker',
      'Kementerian/Lembaga',
      'Tipe Anomali',
      'Tingkat Urgensi',
      'Nilai Sebelumnya',
      'Nilai Terkini',
      'Delta Nilai',
      'Periode',
      'Indikator Pemicu Terbesar',
      'Rekomendasi Taktis KPPN'
    ];

    const rows = filteredRecords.map((r, idx) => {
      const topPemicu = r.pemicuUtama[0] ? `${r.pemicuUtama[0].name} (${r.pemicuUtama[0].currentVal.toFixed(1)})` : '-';
      const cleans = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

      return [
        idx + 1,
        cleans(r.satker.kodeSatker),
        cleans(r.satker.namaSatker),
        cleans(r.satker.kementerianLembaga || '-'),
        cleans(r.type),
        cleans(r.urgency),
        r.previousScore.toFixed(2),
        r.currentScore.toFixed(2),
        r.deltaScore.toFixed(2),
        cleans(`${r.previousMonth} -> ${r.currentMonth}`),
        cleans(topPemicu),
        cleans(r.langkahTaktis[0] || '-')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Monitoring_Anomali_IKPA_KPPN_026_${activeMonth}_2026.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE KPI SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Total Anomali Negatif / Butuh Pendampingan */}
        <button
          type="button"
          onClick={() => { setFilterType('ALL_NEGATIVE'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
            filterType === 'ALL_NEGATIVE'
              ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500 shadow-md'
              : isDark 
              ? 'bg-slate-800/80 border-slate-700 hover:border-rose-800 hover:bg-slate-800' 
              : 'bg-rose-50/60 border-rose-200 hover:border-rose-300 hover:bg-rose-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Butuh Pendampingan Segera
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 dark:bg-rose-950 text-rose-900 dark:text-rose-300">
              Negatif
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {countNegativeTotal}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Satker Teridentifikasi
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
            Gabungan satker drop tajam, tren konsisten menurun, dan indikator kritis.
          </p>
        </button>

        {/* Card 2: Drop Tajam / Anjlok Drastis */}
        <button
          type="button"
          onClick={() => { setFilterType('DROP_TAJAM'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
            filterType === 'DROP_TAJAM'
              ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500 shadow-md'
              : isDark 
              ? 'bg-slate-800/80 border-slate-700 hover:border-amber-700 hover:bg-slate-800' 
              : 'bg-amber-50/60 border-amber-200 hover:border-amber-300 hover:bg-amber-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-amber-500" />
              Drop Tajam / Anjlok
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-300">
              &le; -4.0 Poin
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {countDropTajam}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Satker Terjun Bebas
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
            Satker yang nilainya anjlok drastis atau turun predikat dari baik ke jeblok.
          </p>
        </button>

        {/* Card 3: Tren Menurun Terus */}
        <button
          type="button"
          onClick={() => { setFilterType('TREN_MENURUN'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
            filterType === 'TREN_MENURUN'
              ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500 shadow-md'
              : isDark 
              ? 'bg-slate-800/80 border-slate-700 hover:border-purple-700 hover:bg-slate-800' 
              : 'bg-purple-50/60 border-purple-200 hover:border-purple-300 hover:bg-purple-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-purple-500" />
              Tren Menurun Beruntun
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 dark:bg-purple-950 text-purple-900 dark:text-purple-300">
              &ge; 2 Bulan Turun
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {countTrenMenurun}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Satker Degradasi
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
            Nilai IKPA konsisten menurun berturut-turut belum menunjukkan rebound.
          </p>
        </button>

        {/* Card 4: Anomali Positif / Lonjakan Kinerja */}
        <button
          type="button"
          onClick={() => { setFilterType('ANOMALI_POSITIF'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
            filterType === 'ANOMALI_POSITIF'
              ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500 shadow-md'
              : isDark 
              ? 'bg-slate-800/80 border-slate-700 hover:border-emerald-700 hover:bg-slate-800' 
              : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Anomali Positif (Lonjakan)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300">
              &ge; +4.0 Poin
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {countAnomaliPositif}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Satker Melesat
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
            Satker yang berhasil rebound spektakuler, bahan apresiasi dan best practice.
          </p>
        </button>

      </div>

      {/* 2. FILTER TABS, SEARCH, SORT, & EXPORT ACTIONS */}
      <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Tampilkan:</span>
          
          <button
            onClick={() => { setFilterType('ALL'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            Semua Terdeteksi ({countTotalAnomali})
          </button>

          <button
            onClick={() => { setFilterType('ALL_NEGATIVE'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'ALL_NEGATIVE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>Butuh Pendampingan ({countNegativeTotal})</span>
          </button>

          <button
            onClick={() => { setFilterType('DROP_TAJAM'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'DROP_TAJAM'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-100'
            }`}
          >
            <TrendingDown className="w-3 h-3 text-amber-600" />
            <span>Drop Tajam ({countDropTajam})</span>
          </button>

          <button
            onClick={() => { setFilterType('TREN_MENURUN'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'TREN_MENURUN'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900 hover:bg-purple-100'
            }`}
          >
            <RefreshCw className="w-3 h-3 text-purple-600" />
            <span>Tren Menurun ({countTrenMenurun})</span>
          </button>

          <button
            onClick={() => { setFilterType('INDIKATOR_TIMPANG'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'INDIKATOR_TIMPANG'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900 hover:bg-sky-100'
            }`}
          >
            <Zap className="w-3 h-3 text-sky-600" />
            <span>Indikator Timpang ({countIndikatorTimpang})</span>
          </button>

          <button
            onClick={() => { setFilterType('ANOMALI_POSITIF'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'ANOMALI_POSITIF'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span>Anomali Positif ({countAnomaliPositif})</span>
          </button>
        </div>

        {/* Right Search, Sort, & Download */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          
          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Cari nama / kode satker..."
              className={`w-full text-xs rounded-xl pl-9 pr-3 py-1.5 border transition-all ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`text-xs rounded-xl px-3 py-1.5 border font-bold transition-all cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="DROP_DESC">🔻 Drop Paling Tajam</option>
            <option value="GAIN_DESC">🔺 Lonjakan Paling Tinggi</option>
            <option value="URGENCY">🚨 Tingkat Urgensi Tertinggi</option>
            <option value="SCORE_ASC">📉 Nilai IKPA Terendah</option>
          </select>

          {/* Download CSV Button */}
          <button
            onClick={handleExportAnomalyCSV}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Unduh Rekapitulasi Data Anomali &amp; Tren IKPA (.CSV)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

        </div>

      </div>

      {/* 3. ANOMALY SATKER TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className={`${isDark ? 'bg-slate-900/90 text-slate-300' : 'bg-slate-100 text-slate-700'} font-bold uppercase text-[10px]`}>
            <tr>
              <th className="py-3 px-3 text-center w-12">No</th>
              <th className="py-3 px-4">Satuan Kerja &amp; K/L</th>
              <th className="py-3 px-3 text-center">Status Anomali</th>
              <th className="py-3 px-3 text-center">Tingkat Urgensi</th>
              <th className="py-3 px-4 text-center">Perkembangan Nilai &amp; Delta</th>
              <th className="py-3 px-4">Pemicu Utama Penurunan / Bottleneck</th>
              <th className="py-3 px-4 text-center w-48">Detail Analisis &amp; Tren</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
            {pagedRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 font-medium space-y-2">
                  <div className="text-3xl">🎯</div>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                    Tidak Ditemukan Satker Sesuai Kriteria Filter
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Seluruh satker memiliki kinerja normal atau tidak ada anomali kinerja yang terdeteksi pada filter saat ini.
                  </p>
                </td>
              </tr>
            ) : (
              pagedRecords.map((rec, idx) => {
                const rowNo = (currentPage - 1) * pageSize + idx + 1;
                const isPositive = rec.type === 'ANOMALI_POSITIF';
                const isUrgentDanger = rec.urgency === 'DARURAT';
                const isHighPriority = rec.urgency === 'PRIORITAS_TINGGI';

                return (
                  <tr
                    key={rec.satker.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-slate-850' : 'hover:bg-slate-50/80'
                    } ${
                      isUrgentDanger
                        ? isDark ? 'bg-rose-950/20' : 'bg-rose-50/40'
                        : isPositive
                        ? isDark ? 'bg-emerald-950/20' : 'bg-emerald-50/40'
                        : ''
                    }`}
                  >
                    {/* No */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                      {rowNo}
                    </td>

                    {/* Satuan Kerja */}
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 dark:text-white leading-snug">
                        {rec.satker.namaSatker}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono mt-1">
                        <span>Kode: <strong className="text-slate-800 dark:text-slate-200">{rec.satker.kodeSatker}</strong></span>
                        <span>•</span>
                        <span className="truncate max-w-[200px]" title={rec.satker.kementerianLembaga}>
                          {rec.satker.kodeBa ? `BA ${rec.satker.kodeBa}` : rec.satker.kementerianLembaga}
                        </span>
                      </div>
                      {rec.satker.namaPic && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-amber-500" />
                          <span>PIC: {rec.satker.namaPic} {rec.satker.noHpPic ? `(${rec.satker.noHpPic})` : ''}</span>
                        </div>
                      )}
                    </td>

                    {/* Tipe Anomali Badge */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {rec.type === 'DROP_TAJAM' && (
                          <span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-black px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1">
                            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                            <span>Drop Tajam</span>
                          </span>
                        )}
                        {rec.type === 'TREN_MENURUN' && (
                          <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-black px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1">
                            <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                            <span>Tren Turun ({rec.consecutiveDropCount}x)</span>
                          </span>
                        )}
                        {rec.type === 'INDIKATOR_TIMPANG' && (
                          <span className="bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-black px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-sky-600" />
                            <span>Indikator Anjlok</span>
                          </span>
                        )}
                        {rec.type === 'ANOMALI_POSITIF' && (
                          <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-black px-2.5 py-1 rounded-lg text-[10px] inline-flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Anomali Positif</span>
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 font-medium">
                          {isPositive ? 'Lonjakan Kinerja' : 'Butuh Pendampingan'}
                        </span>
                      </div>
                    </td>

                    {/* Tingkat Urgensi */}
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs ${
                        rec.urgency === 'DARURAT'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : rec.urgency === 'PRIORITAS_TINGGI'
                          ? 'bg-amber-500 text-slate-950'
                          : rec.urgency === 'WASPADA'
                          ? 'bg-sky-100 text-sky-900 border border-sky-300 dark:bg-sky-950 dark:text-sky-200'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {rec.urgency === 'DARURAT' && '🚨 Darurat / Segera'}
                        {rec.urgency === 'PRIORITAS_TINGGI' && '⚠️ Prioritas Tinggi'}
                        {rec.urgency === 'WASPADA' && '⚡ Waspada'}
                        {rec.urgency === 'APRESIASI' && '🌟 Apresiasi'}
                      </span>
                    </td>

                    {/* Nilai & Delta */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-black">
                          <span className="text-slate-400 line-through text-[11px]">
                            {rec.previousScore.toFixed(2)}
                          </span>
                          <span className="text-slate-400">&rarr;</span>
                          <span className={
                            rec.currentScore >= 95 ? 'text-emerald-600 dark:text-emerald-400 font-black' :
                            rec.currentScore >= 89 ? 'text-sky-600 dark:text-sky-400 font-black' :
                            rec.currentScore >= 70 ? 'text-amber-600 dark:text-amber-400 font-black' :
                            'text-rose-600 dark:text-rose-400 font-black'
                          }>
                            {rec.currentScore.toFixed(2)}
                          </span>
                        </div>

                        {/* Delta Pill */}
                        <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-black inline-flex items-center gap-0.5 ${
                          rec.deltaScore > 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : rec.deltaScore <= -8
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {rec.deltaScore > 0 ? `+${rec.deltaScore.toFixed(2)}` : `${rec.deltaScore.toFixed(2)}`}
                          {rec.deltaScore > 0 ? ' ▲' : ' ▼'}
                        </span>

                        {/* Mini Month Sparkline Chips */}
                        {rec.historySummary.length >= 2 && (
                          <div className="flex items-center gap-1 mt-1 text-[9px] font-mono text-slate-400">
                            {rec.historySummary.slice(-3).map((h, hIdx) => (
                              <span key={hIdx} className="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800">
                                {h.bulan.slice(0, 3)}: {h.score.toFixed(0)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Indikator Pemicu & Akar Masalah */}
                    <td className="py-3 px-4">
                      {rec.pemicuUtama.length > 0 ? (
                        <div className="space-y-1.5">
                          {rec.pemicuUtama.slice(0, 2).map((p, pIdx) => (
                            <div key={pIdx} className="text-xs">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                  {p.name}
                                </span>
                                <span className={`font-mono text-[11px] font-black px-1.5 py-0.2 rounded ${
                                  p.currentVal < 70 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                  {p.currentVal.toFixed(1)} {p.deltaVal !== 0 ? `(${p.deltaVal > 0 ? `+${p.deltaVal.toFixed(1)}` : p.deltaVal.toFixed(1)})` : ''}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                {p.reason}
                              </p>
                            </div>
                          ))}
                          {rec.pemicuUtama.length > 2 && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                              +{rec.pemicuUtama.length - 2} indikator pemicu lainnya
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          {rec.narasiRingkas}
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col gap-1.5">
                        
                        {/* 1. Detail Analisis Kausalitas & Tren Kinerja */}
                        <button
                          onClick={() => setSelectedAnomalyForModal(rec)}
                          className={`px-3 py-1.5 rounded-xl font-black text-xs inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                            isPositive
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                              : isUrgentDanger
                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                          }`}
                          title="Buka Detail Analisis Kausalitas, Tren Grafik Bulan Pertama s.d. Terakhir, & Justifikasi Pembinaan KPPN"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>Detail Analisis &amp; Tren</span>
                        </button>

                        {/* Secondary Button Row */}
                        <div className="flex items-center justify-center gap-1">
                          {onOpenIndicatorAnalysis && rec.pemicuUtama[0] && (
                            <button
                              onClick={() => {
                                onOpenIndicatorAnalysis({
                                  satker: rec.satker,
                                  indicatorKey: rec.pemicuUtama[0].indicatorKey as any,
                                  value: rec.pemicuUtama[0].currentVal,
                                  category: rec.satker.predikat,
                                  periodLabel: currentPeriodLabel
                                });
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Buka Analisis Solusi Indikator SAKTI"
                            >
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>Diagnosa</span>
                            </button>
                          )}

                          <button
                            onClick={() => onSelectSatker(rec.satker)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Buka Profil Satker Lengkap"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Profil</span>
                          </button>
                        </div>

                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. PAGINATION */}
      {filteredRecords.length > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div>
            Menampilkan {((currentPage - 1) * pageSize) + 1} s.d. {Math.min(currentPage * pageSize, filteredRecords.length)} dari {filteredRecords.length} Satker Anomali
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              &larr; Sebelumnya
            </button>
            <span className="font-bold">
              Hal {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Selanjutnya &rarr;
            </button>
          </div>
        </div>
      )}

      {/* 5. DEDICATED IN-DEPTH ANOMALY & TREND ANALYSIS MODAL */}
      {selectedAnomalyForModal && (
        <AnomalyDetailAnalysisModal
          record={selectedAnomalyForModal}
          isDark={isDark}
          onClose={() => setSelectedAnomalyForModal(null)}
          onOpenIndicatorAnalysis={onOpenIndicatorAnalysis}
          onSelectSatker={onSelectSatker}
        />
      )}

    </div>
  );
};
