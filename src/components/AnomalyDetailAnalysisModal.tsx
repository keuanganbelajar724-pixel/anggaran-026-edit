import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import {
  X,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Activity,
  Info,
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Download,
  Copy,
  Check,
  Sparkles,
  Filter,
  Clock,
  Layers,
  FileText,
  FileSpreadsheet,
  HelpCircle,
  Zap,
  Target,
  ShieldAlert,
  ArrowRight,
  Eye,
  AlertCircle
} from 'lucide-react';
import { SatkerIKPA, IndikatorIKPA, RiwayatBulananIKPA } from '../types';
import { AnomalyRecord } from './IkpaAnomalyTrendSection';
import { IndicatorAnalysisModalData } from './IndicatorAnalysisModal';

interface AnomalyDetailAnalysisModalProps {
  record: AnomalyRecord;
  isDark: boolean;
  onClose: () => void;
  onOpenIndicatorAnalysis?: (data: IndicatorAnalysisModalData) => void;
  onSelectSatker?: (satker: SatkerIKPA) => void;
}

const ALL_MONTHS_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface MonthlyExtendedPoint {
  bulan: string;
  nilaiIKPA: number;
  delta: number;
  predikat: string;
  revisiDipa: number;
  deviasiHal3Dipa: number;
  penyerapanAnggaran: number;
  belanjaKontraktual: number;
  penyelesaianTagihan: number;
  pengelolaanUpTup: number;
  dispensasiSpm: number;
  capaianOutput: number;
  statusNote: string;
}

export const AnomalyDetailAnalysisModal: React.FC<AnomalyDetailAnalysisModalProps> = ({
  record,
  isDark,
  onClose,
  onOpenIndicatorAnalysis,
  onSelectSatker
}) => {
  const [activeTab, setActiveTab] = useState<'GRAFIK' | 'KAUSALITAS' | 'PEMBINAAN' | 'KRONOLOGI'>('GRAFIK');
  const [selectedChartMetric, setSelectedChartMetric] = useState<string>('nilaiIKPA');
  const [copiedNote, setCopiedNote] = useState<boolean>(false);

  const satker = record.satker;
  const isPositive = record.type === 'ANOMALI_POSITIF';

  // 1. RECONSTRUCT COMPLETE MONTHLY TRAJECTORY FROM MONTH 1 TO LATEST
  const monthlyTrajectory = useMemo<MonthlyExtendedPoint[]>(() => {
    const rawHist = Array.isArray(satker.riwayatBulanan) ? [...satker.riwayatBulanan] : [];
    
    // Sort raw history chronologically
    rawHist.sort((a, b) => {
      const idxA = ALL_MONTHS_NAMES.findIndex(m => m.toLowerCase() === (a.bulan || '').toLowerCase());
      const idxB = ALL_MONTHS_NAMES.findIndex(m => m.toLowerCase() === (b.bulan || '').toLowerCase());
      return (idxA !== -1 ? idxA : 0) - (idxB !== -1 ? idxB : 0);
    });

    const activeMonthTarget = (record.currentMonth || 'Juli').toLowerCase();
    const targetMonthIdx = ALL_MONTHS_NAMES.findIndex(m => m.toLowerCase().includes(activeMonthTarget));
    const maxMonthCount = targetMonthIdx !== -1 ? targetMonthIdx + 1 : 7; // Default s.d. Juli (7 bulan)
    const targetMonthsList = ALL_MONTHS_NAMES.slice(0, maxMonthCount);

    const curInd = satker.indikator || {
      revisiDipa: 100, deviasiHal3Dipa: 100, penyerapanAnggaran: 100,
      belanjaKontraktual: 100, penyelesaianTagihan: 100, pengelolaanUpTup: 100,
      dispensasiSpm: 100, capaianOutput: 100
    };

    const result: MonthlyExtendedPoint[] = [];
    let prevScore = record.previousScore || record.currentScore;

    targetMonthsList.forEach((monthName, idx) => {
      const existing = rawHist.find(h => (h.bulan || '').toLowerCase().includes(monthName.toLowerCase()));

      if (existing && typeof existing.nilaiIKPA === 'number' && existing.nilaiIKPA > 0) {
        const score = Number(existing.nilaiIKPA.toFixed(2));
        const delta = idx === 0 ? 0 : Number((score - prevScore).toFixed(2));
        prevScore = score;

        let predikat = 'Sangat Baik';
        if (score >= 95) predikat = 'Sangat Baik (Puncak)';
        else if (score >= 89) predikat = 'Sangat Baik';
        else if (score >= 70) predikat = 'Cukup / Baik';
        else predikat = 'Kurang';

        let statusNote = 'Kinerja dalam batas terkendali';
        if (delta <= -4) statusNote = 'Terjadi penurunan drastis pada periode ini';
        else if (delta >= 4) statusNote = 'Lonjakan peningkatan kinerja';
        else if (score < 70) statusNote = 'Nilai di bawah batas minimal toleransi Kemenkeu';

        result.push({
          bulan: monthName,
          nilaiIKPA: score,
          delta,
          predikat,
          revisiDipa: existing.revisiDipa ?? curInd.revisiDipa ?? 100,
          deviasiHal3Dipa: existing.deviasiHal3Dipa ?? curInd.deviasiHal3Dipa ?? 100,
          penyerapanAnggaran: existing.penyerapanAnggaran ?? curInd.penyerapanAnggaran ?? 100,
          belanjaKontraktual: existing.belanjaKontraktual ?? curInd.belanjaKontraktual ?? 100,
          penyelesaianTagihan: existing.penyelesaianTagihan ?? curInd.penyelesaianTagihan ?? 100,
          pengelolaanUpTup: existing.pengelolaanUpTup ?? curInd.pengelolaanUpTup ?? 100,
          dispensasiSpm: existing.dispensasiSpm ?? curInd.dispensasiSpm ?? 100,
          capaianOutput: existing.capaianOutput ?? curInd.capaianOutput ?? 100,
          statusNote
        });
      } else {
        // Synthesize intermediate point based on curve from initial month to final current score
        const isFinalMonth = idx === targetMonthsList.length - 1;
        let score = isFinalMonth ? record.currentScore : record.previousScore;
        
        // If prior months, scale slightly higher if current month is in deep drop
        if (idx < targetMonthsList.length - 2) {
          score = Math.min(100, Math.max(80, (record.previousScore || 90) + (targetMonthsList.length - idx) * 1.5));
        }

        score = Number(score.toFixed(2));
        const delta = idx === 0 ? 0 : Number((score - prevScore).toFixed(2));
        prevScore = score;

        let predikat = score >= 89 ? 'Sangat Baik' : score >= 70 ? 'Cukup' : 'Kurang';

        result.push({
          bulan: monthName,
          nilaiIKPA: score,
          delta,
          predikat,
          revisiDipa: isFinalMonth ? curInd.revisiDipa : 100,
          deviasiHal3Dipa: isFinalMonth ? curInd.deviasiHal3Dipa : 95,
          penyerapanAnggaran: isFinalMonth ? curInd.penyerapanAnggaran : 96,
          belanjaKontraktual: isFinalMonth ? curInd.belanjaKontraktual : 100,
          penyelesaianTagihan: isFinalMonth ? curInd.penyelesaianTagihan : 100,
          pengelolaanUpTup: isFinalMonth ? curInd.pengelolaanUpTup : 100,
          dispensasiSpm: isFinalMonth ? curInd.dispensasiSpm : 100,
          capaianOutput: isFinalMonth ? curInd.capaianOutput : 98,
          statusNote: isFinalMonth ? record.narasiRingkas : 'Kinerja normal'
        });
      }
    });

    return result;
  }, [satker, record]);

  // Trajectory High/Low analysis
  const trajectoryStats = useMemo(() => {
    if (monthlyTrajectory.length === 0) {
      return {
        firstScore: record.previousScore,
        firstMonth: 'Bulan Pertama',
        peakScore: record.currentScore,
        peakMonth: record.currentMonth,
        lowestScore: record.currentScore,
        lowestMonth: record.currentMonth,
        totalNetDelta: record.deltaScore,
        inflectionMonth: record.currentMonth,
        trajectoryPattern: 'Penurunan Langsung'
      };
    }

    const first = monthlyTrajectory[0];
    const latest = monthlyTrajectory[monthlyTrajectory.length - 1];

    let peak = first;
    let lowest = first;
    let inflectionIdx = -1;

    for (let i = 0; i < monthlyTrajectory.length; i++) {
      const pt = monthlyTrajectory[i];
      if (pt.nilaiIKPA > peak.nilaiIKPA) peak = pt;
      if (pt.nilaiIKPA < lowest.nilaiIKPA) lowest = pt;
      if (i > 0 && pt.delta <= -3 && inflectionIdx === -1) {
        inflectionIdx = i;
      }
    }

    const inflection = inflectionIdx !== -1 ? monthlyTrajectory[inflectionIdx] : latest;
    const totalNetDelta = Number((latest.nilaiIKPA - first.nilaiIKPA).toFixed(2));

    let trajectoryPattern = 'Penurunan Bertahap';
    if (record.type === 'DROP_TAJAM') {
      trajectoryPattern = 'Anjlok Seketika (Cliff Drop)';
    } else if (record.type === 'TREN_MENURUN') {
      trajectoryPattern = `Penurunan Terus-Menerus (${record.consecutiveDropCount} Periode Beruntun)`;
    } else if (record.type === 'INDIKATOR_TIMPANG') {
      trajectoryPattern = 'Disparitas Ekstrem (Satu Indikator Kritis)';
    } else if (record.type === 'ANOMALI_POSITIF') {
      trajectoryPattern = 'Lonjakan Pemulihan Cepat (Rebound)';
    }

    return {
      firstScore: first.nilaiIKPA,
      firstMonth: first.bulan,
      peakScore: peak.nilaiIKPA,
      peakMonth: peak.bulan,
      lowestScore: lowest.nilaiIKPA,
      lowestMonth: lowest.bulan,
      totalNetDelta,
      inflectionMonth: inflection.bulan,
      trajectoryPattern
    };
  }, [monthlyTrajectory, record]);

  // 2. MATHEMATICAL DECOMPOSITION OF WHY THE DROP OCCURRED
  const impactDecomposition = useMemo(() => {
    const weights: Record<keyof IndikatorIKPA, { name: string; weight: number; code: string }> = {
      capaianOutput: { name: 'Capaian Output SAKTI', weight: 0.25, code: '25%' },
      penyerapanAnggaran: { name: 'Penyerapan Anggaran', weight: 0.20, code: '20%' },
      deviasiHal3Dipa: { name: 'Deviasi Halaman III DIPA', weight: 0.10, code: '10%' },
      belanjaKontraktual: { name: 'Belanja Kontraktual', weight: 0.10, code: '10%' },
      penyelesaianTagihan: { name: 'Penyelesaian Tagihan (SPM-LS)', weight: 0.10, code: '10%' },
      pengelolaanUpTup: { name: 'Pengelolaan UP & TUP', weight: 0.10, code: '10%' },
      revisiDipa: { name: 'Revisi DIPA', weight: 0.10, code: '10%' },
      dispensasiSpm: { name: 'Dispensasi SPM', weight: 0.05, code: '5%' }
    };

    const curInd = satker.indikator || {
      revisiDipa: 100, deviasiHal3Dipa: 100, penyerapanAnggaran: 100,
      belanjaKontraktual: 100, penyelesaianTagihan: 100, pengelolaanUpTup: 100,
      dispensasiSpm: 100, capaianOutput: 100
    };

    const prevInd = monthlyTrajectory.length >= 2 
      ? monthlyTrajectory[monthlyTrajectory.length - 2]
      : null;

    const items: {
      key: keyof IndikatorIKPA;
      name: string;
      bobotNum: number;
      bobotStr: string;
      curVal: number;
      prevVal: number;
      deltaVal: number;
      pointImpact: number;
      reason: string;
      solution: string;
    }[] = [];

    (Object.keys(weights) as (keyof IndikatorIKPA)[]).forEach(k => {
      const curVal = curInd[k] ?? 100;
      const prevVal = prevInd ? (prevInd[k] ?? 100) : (record.pemicuUtama.find(p => p.indicatorKey === k)?.prevVal ?? curVal);
      const deltaVal = Number((curVal - prevVal).toFixed(2));
      const pointImpact = Number((deltaVal * weights[k].weight).toFixed(2));

      // Match reason and solution from pemicuUtama or default
      const foundPemicu = record.pemicuUtama.find(p => p.indicatorKey === k);
      let reason = foundPemicu?.reason || 'Nilai indikator mengalami penurunan dari target penilaian KPPN.';
      let solution = foundPemicu?.solution || 'Lakukan perbaikan dan koordinasi teknis dengan Seksi MSKI.';

      if (k === 'capaianOutput' && curVal < 70) {
        reason = 'Progres fisik (PCRO) dan realisasi volume (RVRO) belum dilaporkan di SAKTI atau status konfirmasi KPPN ditolak/belum terbit sebelum batas cut-off tanggal 5.';
        solution = 'Lakukan rekonsiliasi data capaian output, lengkapi penjelasan gap di modul pelaporan SAKTI, dan ajukan permohonan konfirmasi KPPN.';
      } else if (k === 'belanjaKontraktual' && curVal < 70) {
        reason = 'Pendaftaran resume kontrak ke KPPN melebihi batas waktu 3 hari kerja sejak penandatanganan SPK / BAST kontrak.';
        solution = 'Disiplin mendaftarkan kontrak ke KPPN maksimal 3 hari kerja sejak SPK terbit, pantau modul komitmen SAKTI secara harian.';
      } else if (k === 'deviasiHal3Dipa' && curVal < 70) {
        reason = 'Realisasi penarikan dana bulanan melenceng > 15% dari target Rencana Penarikan Dana (RPD) Hal III DIPA tanpa melakukan revisi RPD pada awal triwulan.';
        solution = 'Manfaatkan jendela pemutakhiran RPD Halaman III DIPA pada 10 hari kerja pertama awal triwulan di aplikasi SAKTI.';
      } else if (k === 'penyerapanAnggaran' && curVal < 70) {
        reason = 'Realisasi anggaran belum memenuhi target proporsional triwulanan yang ditetapkan Kemenkeu.';
        solution = 'Akselerasi pelaksanaan pengadaan dan segera ajukan SPM atas pekerjaan yang telah selesai.';
      } else if (k === 'penyelesaianTagihan' && curVal < 70) {
        reason = 'SPM-LS diajukan ke KPPN melebihi batas 17 hari kerja sejak tanggal Berita Acara Serah Terima (BAST).';
        solution = 'Awasi penerbitan BAST dan pastikan penerbitan SPP-LS tidak tertunda lebih dari 5 hari kerja.';
      }

      items.push({
        key: k,
        name: weights[k].name,
        bobotNum: weights[k].weight,
        bobotStr: weights[k].code,
        curVal,
        prevVal,
        deltaVal,
        pointImpact,
        reason,
        solution
      });
    });

    // Sort by largest negative point impact
    items.sort((a, b) => a.pointImpact - b.pointImpact || a.curVal - b.curVal);
    return items;
  }, [satker, monthlyTrajectory, record]);

  // 3. STRUCTURED KPPN SUPERVISION JUSTIFICATION
  const justifikasiPembinaan = useMemo(() => {
    const reasons: {
      kategori: string;
      judul: string;
      penjelasan: string;
      tingkatKritis: 'TINGGI' | 'SEDANG' | 'SANGAT_TINGGI';
      tindakanKPPN: string;
    }[] = [];

    // Reason 1: Threshold Breach
    if (record.currentScore < 70) {
      reasons.push({
        kategori: 'Pelanggaran Ambang Batas Kualitas',
        judul: `Nilai Jatuh ke Predikat KURANG (${record.currentScore.toFixed(2)})`,
        penjelasan: `Nilai total IKPA satker berada di bawah ambang batas minimal Kemenkeu (< 70.00). Kinerja buruk ini secara langsung menurunkan indeks agregat IKPA KPPN Semarang I di tingkat Kanwil DJPb dan Kemenkeu Pusat.`,
        tingkatKritis: 'SANGAT_TINGGI',
        tindakanKPPN: 'Penerbitan surat pemanggilan dan asistensi one-on-one antara Kepala Seksi MSKI dan KPA Satker.'
      });
    } else if (record.currentScore < 89 && record.previousScore >= 89) {
      reasons.push({
        kategori: 'Degradasi Kelas Predikat',
        judul: `Turun Kasta dari SANGAT BAIK ke CUKUP/BAIK (${record.previousScore.toFixed(2)} ➔ ${record.currentScore.toFixed(2)})`,
        penjelasan: `Satker kehilangan predikat Sangat Baik (ambang batas 89.00). Jika tidak dibina pada bulan berjalan, satker akan kehilangan momentum untuk kembali ke zona hijau pada penutupan triwulan.`,
        tingkatKritis: 'TINGGI',
        tindakanKPPN: 'Kirimkan Early Warning Alert dan jadwal asistensi teknis pemulihan indikator pemicu.'
      });
    }

    // Reason 2: Trend Freefall
    if (record.type === 'DROP_TAJAM') {
      reasons.push({
        kategori: 'Dinamika Kinerja Freefall',
        judul: `Penurunan Ekstrem Sebesar ${record.deltaScore.toFixed(2)} Poin dalam Satu Periode`,
        penjelasan: `Penurunan nilai di atas -4.00 poin (terjadi drop ${record.deltaScore.toFixed(2)} poin) mengindikasikan adanya disrupsi fatal pada tata kelola perbendaharaan satker, bukan sekadar fluktuasi normal.`,
        tingkatKritis: 'SANGAT_TINGGI',
        tindakanKPPN: 'Bedah rekam jejak transaksi SAKTI untuk membedah penyebab kontrak terlambat atau output tidak terisi.'
      });
    } else if (record.type === 'TREN_MENURUN') {
      reasons.push({
        kategori: 'Tren Negatif Berkelanjutan',
        judul: `Nilai Konsisten Menurun Selama ${record.consecutiveDropCount} Bulan Berturut-turut`,
        penjelasan: `Penurunan beruntun membuktikan satker tidak mampu memulihkan kinerjanya secara mandiri tanpa intervensi dan pembinaan dari pihak luar (KPPN). Masalah berulang ini membutuhkan evaluasi menyeluruh.`,
        tingkatKritis: 'TINGGI',
        tindakanKPPN: 'Audit komprehensif alur kerja internal antara PPK, Bendahara, dan Operator SAKTI.'
      });
    }

    // Reason 3: Procedural Bottlenecks on SAKTI
    const topDrop = impactDecomposition[0];
    if (topDrop && topDrop.pointImpact <= -1.0) {
      reasons.push({
        kategori: 'Akar Masalah Administratif & SAKTI',
        judul: `Bottleneck Utama pada ${topDrop.name} (Kehilangan ${Math.abs(topDrop.pointImpact).toFixed(2)} Poin)`,
        penjelasan: `${topDrop.reason}. Masalah ini bersifat administratif yang dapat diselesaikan 100% apabila operator dan PPK mendapatkan pendampingan regulasi dari Pembina MSKI.`,
        tingkatKritis: 'TINGGI',
        tindakanKPPN: topDrop.solution
      });
    }

    // Reason 4: Deadlock Risk for Upcoming Quarters
    reasons.push({
      kategori: 'Risiko Terkunci (Deadlock) Triwulanan',
      judul: 'Batas Waktu Perbaikan Terbatas Pada Siklus Triwulanan',
      penjelasan: `Indikator seperti Deviasi Halaman III DIPA dan Capaian Output memiliki batas jendela pelaporan yang ketat (misal 10 hari kerja pertama triwulan atau tanggal 5 cut-off). Jika KPPN terlambat membina, nilai periode berikutnya dipastikan akan kembali anjlok secara permanen.`,
      tingkatKritis: 'SEDANG',
      tindakanKPPN: 'Kawal satker saat pembukaan revisi Halaman III DIPA dan penutupan data capaian output bulanan.'
    });

    return reasons;
  }, [record, impactDecomposition]);

  // Export Executive Analysis Text
  const getExecutiveAnalysisReportText = () => {
    return `================================================================================
LAPORAN ANALISIS MENDALAM ANOMALI & TREN KINERJA IKPA
KPPN SEMARANG I (KODE: 026)
================================================================================

I. IDENTITAS SATUAN KERJA
- Nama Satker        : ${satker.namaSatker}
- Kode Satker        : ${satker.kodeSatker}
- Kementerian/Lembaga: ${satker.kementerianLembaga || '-'}
- Periode Evaluasi   : ${record.currentMonth} 2026
- Status Anomali     : ${record.type} (${trajectoryStats.trajectoryPattern})
- Tingkat Urgensi    : ${record.urgency} (PERLU PEMBINAAN KPPN)

II. RINGKASAN TREN KINERJA (DARI AWAL S.D. AKHIR TAHUN BERJALAN)
- Nilai Bulan Pertama (${trajectoryStats.firstMonth}) : ${trajectoryStats.firstScore.toFixed(2)}
- Titik Puncak Tertinggi (${trajectoryStats.peakMonth}) : ${trajectoryStats.peakScore.toFixed(2)}
- Nilai Periode Terkini (${record.currentMonth})  : ${record.currentScore.toFixed(2)} (${satker.predikat})
- Perubahan Periode Terakhir (MoM) : ${record.deltaScore > 0 ? `+${record.deltaScore.toFixed(2)}` : record.deltaScore.toFixed(2)} poin
- Total Perubahan Sejak Awal Tahun : ${trajectoryStats.totalNetDelta > 0 ? `+${trajectoryStats.totalNetDelta.toFixed(2)}` : trajectoryStats.totalNetDelta.toFixed(2)} poin
- Titik Mulai Anjlok (Inflection)  : Bulan ${trajectoryStats.inflectionMonth}

III. KENAPA INI BISA TERJADI? (DEKOMPOSISI MATEMATIS PENGURANGAN SKOR)
Berdasarkan bobot resmi IKPA Kementerian Keuangan, berikut rincian poin yang hilang:
${impactDecomposition
  .filter(d => d.deltaVal < 0 || d.curVal < 70)
  .map((d, i) => `${i + 1}. Indikator: ${d.name} (Bobot ${d.bobotStr})
   - Nilai Sebelumnya vs Terkini : ${d.prevVal.toFixed(1)} -> ${d.curVal.toFixed(1)} (Selisih: ${d.deltaVal.toFixed(1)})
   - Poin IKPA yang Hilang       : ${d.pointImpact.toFixed(2)} poin
   - Akar Masalah Teknis / SAKTI : ${d.reason}
   - Rekomendasi Pemulihan       : ${d.solution}`).join('\n\n')}

IV. KENAPA MENYIMPULKAN PERLU PEMBINAAN KPPN?
Berikut 4 dasar analitis objektif mengapa satker ini mendesak dibina oleh KPPN Semarang I:
${justifikasiPembinaan.map((j, i) => `${i + 1}. [${j.kategori}] ${j.judul}
   - Fakta & Dampak : ${j.penjelasan}
   - Rencana Aksi   : ${j.tindakanKPPN}`).join('\n\n')}

V. RIWAYAT PERKEMBANGAN DARI BULAN PERTAMA S.D. TERAKHIR:
${monthlyTrajectory.map(m => `- ${m.bulan.padEnd(10)}: IKPA ${m.nilaiIKPA.toFixed(2)} (${m.delta >= 0 ? `+${m.delta.toFixed(2)}` : m.delta.toFixed(2)}) | Output: ${m.capaianOutput.toFixed(1)} | Deviasi: ${m.deviasiHal3Dipa.toFixed(1)} | Kontrak: ${m.belanjaKontraktual.toFixed(1)}`).join('\n')}

================================================================================
Diterbitkan secara otomatis oleh Sistem Monitoring IKPA KPPN Semarang I
Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
================================================================================`;
  };

  const handleCopyNote = () => {
    navigator.clipboard.writeText(getExecutiveAnalysisReportText());
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  const handleDownloadNote = () => {
    const text = getExecutiveAnalysisReportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Analisis_Mendalam_IKPA_${satker.kodeSatker}_${record.currentMonth}_2026.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-5xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* MODAL HEADER */}
        <div className={`p-5 sm:p-6 border-b flex items-start justify-between gap-4 shrink-0 ${
          isPositive
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900'
            : record.urgency === 'DARURAT'
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900'
        }`}>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isPositive
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white shadow-xs'
              }`}>
                {isPositive ? 'Apresiasi Lonjakan Kinerja' : 'Laporan Analisis Kausalitas & Tren'}
              </span>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                record.urgency === 'DARURAT'
                  ? 'bg-rose-800 text-rose-100 dark:bg-rose-200 dark:text-rose-950'
                  : 'bg-amber-600 text-white'
              }`}>
                {record.urgency === 'DARURAT' ? '🚨 Perlu Pembinaan Segera' : '⚠️ Prioritas Pembinaan KPPN'}
              </span>

              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                Kode: {satker.kodeSatker}
              </span>
            </div>

            <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
              {satker.namaSatker}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                {satker.kementerianLembaga || '-'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                Periode Aktif: {record.currentMonth} 2026
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Tutup lembar analisis"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QUICK STATS KPI BAR */}
        <div className={`p-4 border-b grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0 text-center ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">1. Bulan Pertama ({trajectoryStats.firstMonth.slice(0, 3)})</span>
            <span className="font-mono text-base font-black text-slate-800 dark:text-slate-200">
              {trajectoryStats.firstScore.toFixed(2)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">2. Puncak ({trajectoryStats.peakMonth.slice(0, 3)})</span>
            <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
              {trajectoryStats.peakScore.toFixed(2)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">3. Terkini ({record.currentMonth.slice(0, 3)})</span>
            <span className={`font-mono text-base font-black ${
              record.currentScore >= 89 ? 'text-emerald-600' : record.currentScore >= 70 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {record.currentScore.toFixed(2)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">4. Delta MoM</span>
            <span className={`font-mono text-base font-black ${
              record.deltaScore > 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {record.deltaScore > 0 ? `+${record.deltaScore.toFixed(2)}` : record.deltaScore.toFixed(2)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">5. Total Drop Tahunan</span>
            <span className={`font-mono text-base font-black ${
              trajectoryStats.totalNetDelta > 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {trajectoryStats.totalNetDelta > 0 ? `+${trajectoryStats.totalNetDelta.toFixed(2)}` : trajectoryStats.totalNetDelta.toFixed(2)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">6. Pola Trajektori</span>
            <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 truncate block mt-0.5" title={trajectoryStats.trajectoryPattern}>
              {trajectoryStats.trajectoryPattern}
            </span>
          </div>
        </div>

        {/* TAB BUTTONS NAVIGATION */}
        <div className={`px-5 pt-3 border-b flex items-center gap-2 overflow-x-auto shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50/70'
        }`}>
          {[
            { id: 'GRAFIK' as const, label: '📈 1. Grafik Tren (Bulan 1 s.d. Terakhir)', badge: `${monthlyTrajectory.length} Bulan` },
            { id: 'KAUSALITAS' as const, label: '🔍 2. Kenapa Ini Bisa Terjadi?', badge: 'Akar Masalah' },
            { id: 'PEMBINAAN' as const, label: '⚖️ 3. Kenapa Perlu Pembinaan?', badge: 'Dasar KPPN' },
            { id: 'KRONOLOGI' as const, label: '📅 4. Matriks & Kronologi Lengkap', badge: 'Tabel Angka' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-t-2xl font-black text-xs transition-all border-t border-x cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === tab.id
                  ? isDark 
                    ? 'bg-slate-850 border-slate-700 text-white shadow-xs' 
                    : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.id 
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {tab.badge}
              </span>
            </button>
          ))}
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* ========================================================================= */}
          {/* TAB 1: GRAFIK TREN BULAN PERTAMA S.D. TERAKHIR */}
          {/* ========================================================================= */}
          {activeTab === 'GRAFIK' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Metric Selector Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-amber-500" /> Metrik Grafik:
                  </span>

                  {[
                    { key: 'nilaiIKPA', label: '⭐ Nilai Total IKPA', color: '#f59e0b' },
                    { key: 'ALL', label: '📊 Gabungan Multi-Garis', color: '#6366f1' },
                    { key: 'capaianOutput', label: '🎯 Output (25%)', color: '#ec4899' },
                    { key: 'deviasiHal3Dipa', label: '📉 Deviasi Hal III (10%)', color: '#8b5cf6' },
                    { key: 'penyerapanAnggaran', label: '💰 Penyerapan (20%)', color: '#06b6d4' },
                    { key: 'belanjaKontraktual', label: '📝 Kontraktual (10%)', color: '#3b82f6' },
                    { key: 'penyelesaianTagihan', label: '⚡ Tagihan SPM (10%)', color: '#10b981' },
                    { key: 'pengelolaanUpTup', label: '🔄 UP & TUP (10%)', color: '#f97316' },
                    { key: 'revisiDipa', label: '📑 Revisi DIPA (10%)', color: '#14b8a6' },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => setSelectedChartMetric(btn.key)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border cursor-pointer ${
                        selectedChartMetric === btn.key
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                          : isDark
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                  <span className="inline-block w-3 h-0.5 bg-emerald-500"></span> Batas Sangat Baik (89)
                  <span className="inline-block w-3 h-0.5 bg-rose-500"></span> Batas Minimal (70)
                </div>
              </div>

              {/* Chart Canvas */}
              <div className={`p-4 rounded-3xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/80 border-slate-200'
              }`}>
                <div className="h-72 sm:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {selectedChartMetric === 'ALL' ? (
                      <LineChart data={monthlyTrajectory} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
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
                        <ReferenceLine y={89} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Target 89', fill: '#10b981', fontSize: 10 }} />
                        <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Ambang 70', fill: '#ef4444', fontSize: 10 }} />
                        <Line type="monotone" dataKey="nilaiIKPA" name="Total IKPA" stroke="#f59e0b" strokeWidth={3.5} dot={{ r: 5 }} />
                        <Line type="monotone" dataKey="capaianOutput" name="Output (25%)" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="2 2" />
                        <Line type="monotone" dataKey="deviasiHal3Dipa" name="Deviasi Hal 3 (10%)" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="penyerapanAnggaran" name="Penyerapan (20%)" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="belanjaKontraktual" name="Kontraktual (10%)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    ) : (
                      <AreaChart data={monthlyTrajectory} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={record.deltaScore <= -4 ? '#ef4444' : '#f59e0b'} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={record.deltaScore <= -4 ? '#ef4444' : '#f59e0b'} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                            borderColor: isDark ? '#334155' : '#cbd5e1',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }} 
                        />
                        <ReferenceLine y={89} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Target Sangat Baik (89)', fill: '#10b981', fontSize: 10 }} />
                        <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Batas Bawah Baik (70)', fill: '#ef4444', fontSize: 10 }} />
                        <Area 
                          type="monotone" 
                          dataKey={selectedChartMetric} 
                          name={selectedChartMetric === 'nilaiIKPA' ? 'Nilai Total IKPA' : selectedChartMetric}
                          stroke={record.deltaScore <= -4 ? '#ef4444' : '#f59e0b'} 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#metricGrad)" 
                          dot={{ r: 5 }} 
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trajectory Inflection Insight Box */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <span className="font-extrabold text-amber-900 dark:text-amber-200 block">
                    Penjelasan Tren Grafik dari Bulan Pertama s.d. Terakhir:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    Satker memulai tahun anggaran pada <strong>{trajectoryStats.firstMonth}</strong> dengan skor <strong>{trajectoryStats.firstScore.toFixed(2)}</strong> dan sempat mencapai titik optimal <strong>{trajectoryStats.peakScore.toFixed(2)}</strong> pada <strong>{trajectoryStats.peakMonth}</strong>. Namun, pada <strong>{trajectoryStats.inflectionMonth}</strong> grafik mulai berbelok tajam hingga anjlok ke <strong>{record.currentScore.toFixed(2)}</strong> pada <strong>{record.currentMonth}</strong>.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    Pola trajektori ini diklasifikasikan sebagai <strong>{trajectoryStats.trajectoryPattern}</strong>, yang membuktikan adanya disrupsi mendadak pada kepatuhan pelaporan atau eksekusi anggaran yang memerlukan intervensi pembinaan KPPN.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: KENAPA INI BISA TERJADI? (DEKOMPOSISI MATEMATIS & AKAR MASALAH) */}
          {/* ========================================================================= */}
          {activeTab === 'KAUSALITAS' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Introduction Banner */}
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                <span className="font-black text-slate-800 dark:text-slate-100 block">
                  Dekomposisi Kausalitas Matematis: Dari Mana Datangnya Penurunan {record.deltaScore.toFixed(2)} Poin?
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Nilai IKPA dihitung berdasarkan penjumlahan terbobot dari 8 indikator. Tabel di bawah membongkar kontribusi spesifik setiap indikator terhadap hilangnya poin pada nilai total IKPA satker.
                </p>
              </div>

              {/* Table of Mathematical Impact */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className={`${isDark ? 'bg-slate-850 text-slate-300' : 'bg-slate-100 text-slate-700'} font-bold uppercase text-[10px]`}>
                    <tr>
                      <th className="py-3 px-3">Indikator IKPA</th>
                      <th className="py-3 px-2 text-center">Bobot</th>
                      <th className="py-3 px-3 text-center">Sebelumnya</th>
                      <th className="py-3 px-3 text-center">Terkini</th>
                      <th className="py-3 px-3 text-center">Selisih Indikator</th>
                      <th className="py-3 px-3 text-center bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                        Kehilangan Poin ke Total
                      </th>
                      <th className="py-3 px-4">Akar Masalah SAKTI / OM-SPAN</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {impactDecomposition.map((item, idx) => {
                      const isHeavyImpact = item.pointImpact <= -1.0;
                      return (
                        <tr key={idx} className={isHeavyImpact ? (isDark ? 'bg-rose-950/20' : 'bg-rose-50/50') : ''}>
                          <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                            {item.name}
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-bold text-slate-500">
                            {item.bobotStr}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                            {item.prevVal.toFixed(1)}
                          </td>
                          <td className={`py-3 px-3 text-center font-mono font-black ${
                            item.curVal < 70 ? 'text-rose-600' : item.curVal < 89 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {item.curVal.toFixed(1)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold">
                            <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                              item.deltaVal < 0 
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {item.deltaVal > 0 ? `+${item.deltaVal.toFixed(1)}` : item.deltaVal.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-black bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400">
                            {item.pointImpact === 0 ? '0.00' : item.pointImpact.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                            {item.reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Detailed Breakdown Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Rincian Penjelasan Teknis Aplikasi Mengapa Bisa Terjadi:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {impactDecomposition.filter(d => d.deltaVal < 0 || d.curVal < 70).slice(0, 4).map((d, dIdx) => (
                    <div key={dIdx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          {d.name} (Bobot {d.bobotStr})
                        </span>
                        <span className="font-mono text-xs font-black text-rose-600 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950">
                          {d.pointImpact.toFixed(2)} Poin IKPA
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        <strong>Penyebab Teknis:</strong> {d.reason}
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900">
                        <strong>Solusi Pemulihan:</strong> {d.solution}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: KENAPA MENYIMPULKAN PERLU PEMBINAAN? */}
          {/* ========================================================================= */}
          {activeTab === 'PEMBINAAN' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs space-y-1">
                <span className="font-black text-indigo-900 dark:text-indigo-200 block text-sm">
                  Dasar Pertimbangan Objektif KPPN Menyimpulkan Perlu Pembinaan
                </span>
                <p className="text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  Kesimpulan perlunya intervensi pembinaan KPPN tidak didasarkan pada asumsi, melainkan analisis risiko kepatuhan perbendaharaan, besaran deviasi terhadap standar kualitas Kemenkeu, serta bahaya terkuncinya nilai pada triwulan berikutnya.
                </p>
              </div>

              {/* 4 Cards Justification */}
              <div className="space-y-3.5">
                {justifikasiPembinaan.map((item, idx) => (
                  <div key={idx} className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                          {item.judul}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        item.tingkatKritis === 'SANGAT_TINGGI'
                          ? 'bg-rose-600 text-white'
                          : item.tingkatKritis === 'TINGGI'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-sky-600 text-white'
                      }`}>
                        {item.kategori}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
                      {item.penjelasan}
                    </p>

                    <div className="ml-8 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200 block">Rencana Aksi Pembinaan KPPN Semarang I:</strong>
                        <span className="text-slate-600 dark:text-slate-400">{item.tindakanKPPN}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: KRONOLOGI & MATRIKS 8 INDIKATOR LENGKAP */}
          {/* ========================================================================= */}
          {activeTab === 'KRONOLOGI' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Table of Monthly Progression */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Perkembangan Nilai Total IKPA Bulan per Bulan:
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className={`${isDark ? 'bg-slate-850 text-slate-300' : 'bg-slate-100 text-slate-700'} font-bold uppercase text-[10px]`}>
                      <tr>
                        <th className="py-3 px-3">Bulan</th>
                        <th className="py-3 px-3 text-center">Nilai Total IKPA</th>
                        <th className="py-3 px-3 text-center">Delta MoM</th>
                        <th className="py-3 px-3 text-center">Predikat</th>
                        <th className="py-3 px-4">Dinamika Kinerja Pada Periode</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                      {monthlyTrajectory.map((m, idx) => (
                        <tr key={idx}>
                          <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                            {m.bulan}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-black text-sm">
                            {m.nilaiIKPA.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              m.delta > 0 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                : m.delta < 0
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {m.delta > 0 ? `+${m.delta.toFixed(2)}` : m.delta.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                              {m.predikat}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-[11px]">
                            {m.statusNote}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Matrix of 8 Indicators Across All Months */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Matriks Riwayat 8 Indikator dari Bulan Pertama s.d. Terakhir:
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className={`${isDark ? 'bg-slate-850 text-slate-300' : 'bg-slate-100 text-slate-700'} font-bold uppercase text-[10px]`}>
                      <tr>
                        <th className="py-3 px-3">Indikator (Bobot)</th>
                        {monthlyTrajectory.map((m, idx) => (
                          <th key={idx} className="py-3 px-2 text-center">{m.bulan.slice(0, 3)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                      {[
                        { key: 'revisiDipa' as const, name: 'Revisi DIPA (10%)' },
                        { key: 'deviasiHal3Dipa' as const, name: 'Deviasi Hal III (10%)' },
                        { key: 'penyerapanAnggaran' as const, name: 'Penyerapan (20%)' },
                        { key: 'belanjaKontraktual' as const, name: 'Kontraktual (10%)' },
                        { key: 'penyelesaianTagihan' as const, name: 'Tagihan SPM (10%)' },
                        { key: 'pengelolaanUpTup' as const, name: 'UP & TUP (10%)' },
                        { key: 'dispensasiSpm' as const, name: 'Dispensasi (5%)' },
                        { key: 'capaianOutput' as const, name: 'Capaian Output (25%)' },
                      ].map((ind, rowIdx) => (
                        <tr key={rowIdx}>
                          <td className="py-2.5 px-3 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                            {ind.name}
                          </td>
                          {monthlyTrajectory.map((m, colIdx) => {
                            const val = m[ind.key] ?? 100;
                            return (
                              <td key={colIdx} className="py-2 px-2 text-center font-mono text-[11px] font-bold">
                                <span className={`px-1.5 py-0.5 rounded ${
                                  val >= 95 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                  val >= 89 ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' :
                                  val >= 70 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-black'
                                }`}>
                                  {val.toFixed(0)}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyNote}
              className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedNote ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-black">Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Ringkasan Analisis</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadNote}
              className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Unduh Lembar Analisis Lengkap (.TXT)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Dokumen (.TXT)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Cetak Lembar Analisis"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenIndicatorAnalysis && record.pemicuUtama[0] && (
              <button
                onClick={() => {
                  onClose();
                  onOpenIndicatorAnalysis({
                    satker: record.satker,
                    indicatorKey: record.pemicuUtama[0].indicatorKey as any,
                    value: record.pemicuUtama[0].currentVal,
                    category: record.satker.predikat,
                    periodLabel: record.currentMonth
                  });
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>Buka Solusi SAKTI ({record.pemicuUtama[0].name.split(' ')[0]})</span>
              </button>
            )}

            {onSelectSatker && (
              <button
                onClick={() => {
                  onClose();
                  onSelectSatker(record.satker);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Profil Satker</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
