import React, { useState, useMemo } from 'react';
import { 
  Presentation, 
  Download, 
  Printer, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Award, 
  AlertTriangle, 
  BarChart3, 
  CheckCircle2, 
  Bot, 
  Flame, 
  Clock, 
  FileText,
  Filter,
  Layers,
  Building2,
  CheckSquare,
  Square,
  TrendingUp,
  TrendingDown,
  Scale,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Compass,
  FileSpreadsheet,
  CheckCheck,
  Target,
  BookOpen,
  Info
} from 'lucide-react';
import pptxgen from 'pptxgenjs';
import { SatkerIKPA, DashboardConfig } from '../../types';

interface IKPAPresentationDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  satkers: SatkerIKPA[];
  dashboardConfig: DashboardConfig;
  isDark?: boolean;
  onAskGeminiForTopic?: (topicPrompt: string) => void;
}

export type PeriodScope = 'TW1' | 'TW2' | 'TW3' | 'TW4' | 'BULANAN' | 'TAHUNAN';
export type SlideCategory = 
  | 'ALL' 
  | 'PEMBUKA' 
  | 'MAKRO' 
  | 'INDIKATOR_DETAIL' 
  | 'SATKER_RANKING' 
  | 'DIAGNOSA_RISIKO' 
  | 'KEMENTERIAN' 
  | 'DIGITALISASI' 
  | 'REGULASI_HOT_TOPIC' 
  | 'REKOMENDASI_AKSI' 
  | 'PENUTUP';

export interface DetailedSlideContent {
  id: number;
  category: SlideCategory;
  title: string;
  subtitle: string;
  badge: string;
  statsHighlight?: { label: string; value: string; note?: string; color?: string }[];
  analysisPoints: string[];
  recommendation: string;
  regulationRef?: string;
  tableData?: { headers: string[]; rows: string[][] };
}

export const IKPAPresentationDeckModal: React.FC<IKPAPresentationDeckModalProps> = ({
  isOpen,
  onClose,
  satkers,
  dashboardConfig,
  isDark = false,
  onAskGeminiForTopic
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [periodScope, setPeriodScope] = useState<PeriodScope>('TW1');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<SlideCategory>('ALL');
  const [selectedSlideIds, setSelectedSlideIds] = useState<number[]>(
    Array.from({ length: 50 }, (_, i) => i + 1)
  );
  const [isExportingPPT, setIsExportingPPT] = useState<boolean>(false);

  if (!isOpen) return null;

  // Key Calculations from real satker dataset
  const totalSatker = satkers.length;
  const totalNilai = satkers.reduce((acc, s) => acc + (s.nilaiTotalIKPA || 0), 0);
  const avgIKPA = totalSatker > 0 ? (totalNilai / totalSatker).toFixed(2) : '0.00';
  const avgNum = parseFloat(avgIKPA);

  // Distribution
  const sangatBaik = satkers.filter(s => (s.nilaiTotalIKPA || 0) >= 95);
  const baik = satkers.filter(s => (s.nilaiTotalIKPA || 0) >= 89 && (s.nilaiTotalIKPA || 0) < 95);
  const cukup = satkers.filter(s => (s.nilaiTotalIKPA || 0) >= 70 && (s.nilaiTotalIKPA || 0) < 89);
  const kurang = satkers.filter(s => (s.nilaiTotalIKPA || 0) < 70);

  // Indicators Average
  const avgRevisi = (satkers.reduce((acc, s) => acc + (s.indikator?.revisiDipa || 0), 0) / (totalSatker || 1)).toFixed(2);
  const avgDeviasi = (satkers.reduce((acc, s) => acc + (s.indikator?.deviasiHal3Dipa || 0), 0) / (totalSatker || 1)).toFixed(2);
  const avgPenyerapan = (satkers.reduce((acc, s) => acc + (s.persenPenyerapan || s.indikator?.penyerapanAnggaran || 0), 0) / (totalSatker || 1)).toFixed(2);
  const avgBelanja = (satkers.reduce((acc, s) => acc + (s.indikator?.belanjaKontraktual || 0), 0) / (totalSatker || 1)).toFixed(2);
  const avgUP = (satkers.reduce((acc, s) => acc + (s.indikator?.pengelolaanUPTUP || 0), 0) / (totalSatker || 1)).toFixed(2);
  const avgLPJ = (satkers.reduce((acc, s) => acc + (s.indikator?.lpjBendahara || 0), 0) / (totalSatker || 1)).toFixed(2);
  const avgDispensasi = (satkers.reduce((acc, s) => acc + (s.indikator?.dispensasiSPM || 0), 0) / (totalSatker || 1)).toFixed(2);
  const avgOutput = (satkers.reduce((acc, s) => acc + (s.indikator?.capaianOutput || 0), 0) / (totalSatker || 1)).toFixed(2);

  // Rankings
  const sortedSatkers = [...satkers].sort((a, b) => (b.nilaiTotalIKPA || 0) - (a.nilaiTotalIKPA || 0));
  const topSatkers = sortedSatkers.slice(0, 10);
  const bottomSatkers = [...satkers]
    .filter(s => (s.nilaiTotalIKPA || 0) < 89 || (s.indikator?.capaianOutput !== undefined && s.indikator.capaianOutput < 90) || s.statusCapaianOutput !== 'Sudah Terlaporkan')
    .sort((a, b) => (a.nilaiTotalIKPA || 0) - (b.nilaiTotalIKPA || 0))
    .slice(0, 10);

  // Scope Labels
  const scopeLabels: Record<PeriodScope, { title: string; subtitle: string; periodLabel: string }> = {
    TW1: { title: 'Laporan Evaluasi IKPA Triwulan I', subtitle: 'Akselerasi Awal Tahun & Disiplin Halaman III DIPA', periodLabel: 'Triwulan I (Q1)' },
    TW2: { title: 'Laporan Evaluasi IKPA Triwulan II', subtitle: 'Konsolidasi Semester I & Pengendalian Penyerapan', periodLabel: 'Triwulan II (Q2 / Semester I)' },
    TW3: { title: 'Laporan Evaluasi IKPA Triwulan III', subtitle: 'Penyelarasan Target Output & Percepatan Kontraktual', periodLabel: 'Triwulan III (Q3)' },
    TW4: { title: 'Laporan Evaluasi IKPA Triwulan IV', subtitle: 'Langkah Akhir Tahun Anggaran (LLAT) & Penutupan', periodLabel: 'Triwulan IV (Q4 / Tahunan)' },
    BULANAN: { title: 'Laporan Evaluasi Kinerja IKPA Bulanan', subtitle: 'Monitoring Rutin Kepatuhan & Akselerasi Satker', periodLabel: 'Periode Bulanan Berjalan' },
    TAHUNAN: { title: 'Laporan Akuntabilitas Kinerja IKPA Tahunan', subtitle: 'Refleksi Kinerja Komprehensif Seluruh Satuan Kerja', periodLabel: 'Tahun Anggaran Berjalan' }
  };

  const activeScopeInfo = scopeLabels[periodScope];

  // 50 FULLY STRUCTURED, IN-DEPTH PRESENTATION SLIDES
  const all50Slides: DetailedSlideContent[] = useMemo(() => [
    // 1-5: PEMBUKA & MAKRO
    {
      id: 1,
      category: 'PEMBUKA',
      title: 'PAPARAN EVALUASI KINERJA PELAKSANAAN ANGGARAN (IKPA)',
      subtitle: `${activeScopeInfo.title} • KPPN SEMARANG I (026)`,
      badge: 'OFFICIAL OPENING DECK',
      statsHighlight: [
        { label: 'Rata-Rata IKPA', value: avgIKPA, note: 'Target Nasional: 95.00', color: 'emerald' },
        { label: 'Total Satker Mitra', value: `${totalSatker} Satker`, note: 'Aktif Kelola DIPA', color: 'indigo' },
        { label: 'Tingkat Kepatuhan', value: `${totalSatker > 0 ? (((sangatBaik.length + baik.length) / totalSatker) * 100).toFixed(1) : 0}%`, note: 'Nilai >= 89.00', color: 'amber' }
      ],
      analysisPoints: [
        'Disajikan oleh Seksi Manajemen Satker dan Kepatuhan Internal (MSKI) KPPN Semarang I.',
        'Mengacu pada regulasi Perdirjen Perbendaharaan Nomor PER-4/PB/2021 dan Kepdirjen Perbendaharaan terbaru.',
        'Fokus utama: Evaluasi realisasi belanja, akuntabilitas pertanggungjawaban kas, dan kualitas capaian output.',
        'Mendorong seluruh Satker mitra mencapai predikat Sangat Baik (Nilai IKPA >= 95.00).'
      ],
      recommendation: 'Jadikan forum evaluasi ini sebagai media sinkronisasi kendala teknis SAKTI dan penguatan disiplin kalender kerja perbendaharaan.',
      regulationRef: 'Perdirjen Perbendaharaan No. PER-4/PB/2021 tentang Petunjuk Teknis Penilaian IKPA'
    },
    {
      id: 2,
      category: 'PEMBUKA',
      title: 'AGENDA & SISTEMATIKA PEMBAHASAN RAPAT EVALUASI',
      subtitle: 'Struktur Alur Presentasi Eksekutif Kinerja Anggaran',
      badge: 'RUNDOWN & FRAMEWORK',
      analysisPoints: [
        '1. Gambaran Kinerja Makro & Distribusi Nilai IKPA KPPN Semarang I.',
        '2. Bedah Komprehensif 8 Indikator IKPA dalam 4 Pilar Perbendaharaan.',
        '3. Apresiasi Satker Berkinerja Terbaik (Top Tier) & Best Practices.',
        '4. Diagnosa Satker Atensi (Perhatian Khusus) & Peta Risiko Kepatuhan.',
        '5. Akselerasi Digitalisasi Keuangan Negara (KKP, Digipay Satu, CMS, & TTE).',
        '6. Isu Strategis, Regulasi Terkini, dan Matriks Rencana Aksi Konkret.'
      ],
      recommendation: 'Setiap KPA dan Pejabat Perbendaharaan diharapkan menyimak poin rekomendasi teknis per indikator yang relevan dengan satkernya.',
      regulationRef: 'Kepdirjen Perbendaharaan tentang Standar Tata Kelola Evaluasi Pelaksanaan Anggaran'
    },
    {
      id: 3,
      category: 'MAKRO',
      title: 'CAPAIAN AGREGAT NILAI IKPA KPPN SEMARANG I',
      subtitle: `Rapor Kolektif ${totalSatker} Satker Mitra KPPN Semarang I`,
      badge: 'MAKRO OVERVIEW',
      statsHighlight: [
        { label: 'Capaian Rata-Rata', value: avgIKPA, note: avgNum >= 95 ? 'Sangat Baik' : 'Perlu Akselerasi', color: 'emerald' },
        { label: 'Target DJPb', value: '95.00', note: 'Standar Pelayanan Prima', color: 'indigo' },
        { label: 'Gap Terhadap Target', value: `${(avgNum - 95.0).toFixed(2)}`, note: avgNum >= 95 ? 'Melampaui Target' : 'Di Bawah Target', color: avgNum >= 95 ? 'emerald' : 'rose' }
      ],
      tableData: {
        headers: ['Parameter Makro', 'Realisasi KPPN', 'Standar / Target', 'Kategori Kinerja'],
        rows: [
          ['Nilai Rata-Rata IKPA', avgIKPA, '>= 95.00', avgNum >= 95 ? 'Sangat Baik (Optimal)' : 'Baik (Perlu Peningkatan)'],
          ['Satker Nilai >= 95 (Sangat Baik)', `${sangatBaik.length} Satker`, 'Min 70% Satker', `${totalSatker > 0 ? ((sangatBaik.length / totalSatker) * 100).toFixed(1) : 0}% Terpenuhi`],
          ['Satker Nilai 89 - 94.99 (Baik)', `${baik.length} Satker`, 'Kategori Aman', 'Kepatuhan Standar'],
          ['Satker Atensi (< 89.00)', `${bottomSatkers.length} Satker`, '0 Satker (Zero Red)', 'Wajib Pendampingan Khusus']
        ]
      },
      analysisPoints: [
        `Terdapat ${sangatBaik.length + baik.length} Satker (${totalSatker > 0 ? (((sangatBaik.length + baik.length) / totalSatker) * 100).toFixed(1) : 0}%) yang telah memenuhi batas standar minimal kepatuhan (89.00).`,
        'Pilar Perencanaan dan Pilar Kualitas Hasil Output menjadi penentu utama pergeseran nilai agregat.',
        'KPPN Semarang I menargetkan seluruh satuan kerja berada pada kuadran Sangat Baik pada akhir tahun.'
      ],
      recommendation: 'Lakukan intervensi asistensi intensif 1-on-1 bagi satker yang masih memiliki nilai di bawah ambang batas 89.00.',
      regulationRef: 'Nota Dinas Direktur PA DJPb perihal Monitoring Evaluasi IKPA Berkala'
    },
    {
      id: 4,
      category: 'MAKRO',
      title: 'DISTRIBUSI KATEGORI PREDIKAT KINERJA SATKER',
      subtitle: 'Komposisi Kategori Nilai Seluruh Satuan Kerja Mitra',
      badge: 'DISTRIBUSI PREDIKAT',
      statsHighlight: [
        { label: 'Sangat Baik (>=95)', value: `${sangatBaik.length} Satker`, note: `${totalSatker > 0 ? ((sangatBaik.length / totalSatker) * 100).toFixed(1) : 0}% Total Satker`, color: 'emerald' },
        { label: 'Baik (89 - 94.99)', value: `${baik.length} Satker`, note: `${totalSatker > 0 ? ((baik.length / totalSatker) * 100).toFixed(1) : 0}% Total Satker`, color: 'sky' },
        { label: 'Cukup (70 - 88.99)', value: `${cukup.length} Satker`, note: 'Zona Perhatian', color: 'amber' },
        { label: 'Kurang (< 70)', value: `${kurang.length} Satker`, note: 'Zona Merah / Bahaya', color: 'rose' }
      ],
      analysisPoints: [
        'Mayoritas satker terkonsentrasi pada predikat Baik dan Sangat Baik.',
        'Satker pada predikat Cukup umumnya terkendala deviasi halaman III DIPA yang melebihi ambang batas 5% atau keterlambatan lapor output.',
        'Satker predikat Kurang memerlukan audit administrasi cepat dari pimpinan unit kerja untuk membedah hambatan operasional.'
      ],
      recommendation: 'Bagi Satker berpredikat Cukup dan Kurang, wajib menghadiri sesi klinik khusus akuntansi dan konsultasi di KPPN.',
      regulationRef: 'Pedoman Penilaian Kinerja Pelaksanaan Anggaran DJPb'
    },
    {
      id: 5,
      category: 'MAKRO',
      title: 'ANALISIS TREN & POLA SIKLUS PELAKSANAAN ANGGARAN',
      subtitle: 'Mitigasi Fenomena Penumpukan Belanja Akhir Periode',
      badge: 'TREND ANALYSIS',
      analysisPoints: [
        'Pola belanja historis seringkali menunjukkan lambatnya penyerapan pada Triwulan I dan II, lalu melonjak drastis pada Triwulan IV.',
        'Kebiasaan menumpuk tagihan SPM di akhir periode memicu deviasi RPD tinggi dan membebani likuiditas kas negara.',
        'Reformulasi IKPA memberikan bobot penalti yang berat bagi penyerapan yang tidak proporsional antar-triwulan.'
      ],
      recommendation: 'Terapkan prinsip *front-loading* anggaran sejak awal triwulan melalui eksekusi dini kegiatan non-infrastruktur dan lelang pra-DIPA.',
      regulationRef: 'Instruksi Menteri Keuangan tentang Percepatan Pelaksanaan Kegiatan dan Pengadaan Dini'
    },

    // 6-10: 8 INDIKATOR DETAIL
    {
      id: 6,
      category: 'INDIKATOR_DETAIL',
      title: 'REKAPITULASI CAPAIAN 8 INDIKATOR IKPA',
      subtitle: 'Evaluasi 4 Pilar Utama Perbendaharaan',
      badge: '8 INDIKATOR MATRIX',
      tableData: {
        headers: ['No', 'Indikator Kinerja IKPA', 'Bobot', 'Rata-Rata Satker', 'Target'],
        rows: [
          ['1', 'Revisi DIPA (Kualitas Perencanaan)', '10%', avgRevisi, '100.00'],
          ['2', 'Deviasi Halaman III DIPA (Kualitas Perencanaan)', '10%', avgDeviasi, '>= 95.00'],
          ['3', 'Penyerapan Anggaran (Kualitas Eksekusi)', '20%', avgPenyerapan, '>= 95.00'],
          ['4', 'Belanja Kontraktual (Kualitas Eksekusi)', '10%', avgBelanja, '100.00'],
          ['5', 'Pengelolaan UP dan TUP (Efisiensi Belanja)', '10%', avgUP, '100.00'],
          ['6', 'LPJ Bendahara (Akuntabilitas Kas)', '10%', avgLPJ, '100.00'],
          ['7', 'Dispensasi SPM (Kepatuhan Waktu)', '5%', avgDispensasi, '100.00'],
          ['8', 'Capaian Output SAKTI (Hasil Kinerja)', '25%', avgOutput, '>= 95.00']
        ]
      },
      analysisPoints: [
        'Indikator Capaian Output (25%) dan Penyerapan Anggaran (20%) memegang kontribusi terbesar (45% dari total bobot).',
        'Indikator Deviasi Halaman III DIPA menjadi area paling rentan mengalami penurunan nilai akibat perubahan jadwal kegiatan yang tidak dimutakhirkan.',
        'Indikator LPJ Bendahara dan Pengelolaan UP menunjukkan tingkat kepatuhan tinggi berkat digitalisasi perbankan.'
      ],
      recommendation: 'Prioritaskan pemantauan harian pada indikator Capaian Output dan Deviasi RPD Halaman III DIPA.',
      regulationRef: 'PMK Nomor 195/PMK.05/2018 tentang Tata Cara Monitoring dan Evaluasi Kinerja Anggaran'
    },
    {
      id: 7,
      category: 'INDIKATOR_DETAIL',
      title: 'PILAR 1: INDIKATOR REVISI DIPA (BOBOT 10%)',
      subtitle: 'Pengendalian Frekuensi dan Efektivitas Revisi Anggaran',
      badge: 'PILAR PERENCANAAN',
      statsHighlight: [
        { label: 'Rata-Rata Capaian', value: avgRevisi, note: 'Target: 100.00', color: 'emerald' },
        { label: 'Batas Frekuensi', value: '1 Kali / TW', note: 'Untuk Revisi Hal III', color: 'indigo' },
        { label: 'Bobot Indikator', value: '10%', note: 'Aspek Perencanaan', color: 'amber' }
      ],
      analysisPoints: [
        'Dihitung berdasarkan frekuensi revisi anggaran yang disahkan oleh Kanwil DJPb atau DJA.',
        'Revisi yang dihitung adalah revisi reguler kewenangan Kanwil DJPb/DJA yang mengubah alokasi belanja atau target output.',
        'Revisi administratif (kesalahan akun minor tanpa ubah pagu) tidak mengurangi nilai jika menggunakan mekanisme ralat rincian akun.'
      ],
      recommendation: 'Lakukan konsolidasi seluruh kebutuhan perubahan anggaran dalam 1 paket revisi per triwulan agar tidak menggerus poin IKPA.',
      regulationRef: 'PMK Tata Cara Revisi Anggaran Tahun Berjalan'
    },
    {
      id: 8,
      category: 'INDIKATOR_DETAIL',
      title: 'PILAR 1: INDIKATOR DEVIASI HALAMAN III DIPA (BOBOT 10%)',
      subtitle: 'Disiplin Rencana Penarikan Dana (RPD) Bulanan',
      badge: 'PILAR PERENCANAAN',
      statsHighlight: [
        { label: 'Rata-Rata Capaian', value: avgDeviasi, note: 'Target: >= 95.00', color: 'amber' },
        { label: 'Ambang Deviasi Maks', value: '± 5.0%', note: 'Toleransi Selisih Kas', color: 'rose' },
        { label: 'Jadwal Update RPD', value: 'Bulan 1 Tiap TW', note: 'Batas Akhir Pemutakhiran', color: 'sky' }
      ],
      analysisPoints: [
        'Menghitung keselarasan antara realisasi penarikan kas bulanan dengan rencana pada Halaman III DIPA.',
        'Toleransi deviasi maksimal yang diperkenankan agar nilai tetap sempurna adalah 5%.',
        'Satker diberikan kesempatan melakukan pemutakhiran RPD pada 10 hari kerja pertama pada bulan awal tiap triwulan.'
      ],
      recommendation: 'PPK wajib menyelaraskan jadwal penagihan rekanan dengan pagu bulanan pada Halaman III DIPA sebelum mengajukan SPM.',
      regulationRef: 'Perdirjen Perbendaharaan tentang Tata Cara Penyusunan RPD Bulanan Satker'
    },
    {
      id: 9,
      category: 'INDIKATOR_DETAIL',
      title: 'PILAR 2: INDIKATOR PENYERAPAN ANGGARAN (BOBOT 20%)',
      subtitle: 'Kepatuhan Target Realisasi Belanja Triwulanan',
      badge: 'PILAR EKSEKUSI',
      statsHighlight: [
        { label: 'Rata-Rata Capaian', value: avgPenyerapan, note: 'Target Kumulatif', color: 'emerald' },
        { label: 'Bobot Penilaian', value: '20%', note: 'Bobot Terbesar ke-2', color: 'indigo' }
      ],
      tableData: {
        headers: ['Jenis Belanja', 'Target TW I', 'Target TW II', 'Target TW III', 'Target TW IV'],
        rows: [
          ['Belanja Pegawai (51)', '20%', '50%', '75%', '95%'],
          ['Belanja Barang (52)', '15%', '50%', '70%', '90%'],
          ['Belanja Modal (53)', '10%', '40%', '70%', '90%'],
          ['Belanja Bansos (57)', '25%', '50%', '75%', '95%']
        ]
      },
      analysisPoints: [
        'Penilaian dihitung per jenis belanja (51, 52, 53, 57) kemudian dibobotkan terhadap total pagu satker.',
        'Keterlambatan serapan pada Belanja Modal (53) menjadi penyebab utama anjloknya nilai penyerapan satker proyek.',
        'Realisasi belanja modal harus didorong melalui percepatan uang muka dan termin kemajuan fisik konstruksi.'
      ],
      recommendation: 'Lakukan reviu berkala paket pengadaan fisik dan pastikan BAST segera diterbitkan setelah pekerjaan selesai.',
      regulationRef: 'Target Penyerapan Anggaran Triwulanan DJPb Kemenkeu'
    },
    {
      id: 10,
      category: 'INDIKATOR_DETAIL',
      title: 'PILAR 2: INDIKATOR BELANJA KONTRAKTUAL (BOBOT 10%)',
      subtitle: 'Ketertiban Pendaftaran Data Perjanjian / Kontrak',
      badge: 'PILAR EKSEKUSI',
      statsHighlight: [
        { label: 'Rata-Rata Capaian', value: avgBelanja, note: 'Target: 100.00', color: 'emerald' },
        { label: 'Batas Pendaftaran', value: '5 Hari Kerja', note: 'Sejak TTD Kontrak/SPK', color: 'rose' }
      ],
      analysisPoints: [
        'Mengukur rasio ketepatan waktu pendaftaran Data Kontrak (NRK) ke SPAN melalui modul Komitmen SAKTI.',
        'Batas waktu pendaftaran adalah maksimal 5 (lima) hari kerja sejak tanggal kontrak ditandatangani.',
        'Kontrak yang terlambat didaftarkan akan menerima penalti nilai dan berisiko tertolaknya penerbitan CAN.'
      ],
      recommendation: 'Operator Komitmen harus langsung mengunggah ADK Kontrak ke SAKTI pada hari yang sama saat SPK/Kontrak ditandatangani PPK.',
      regulationRef: 'PMK No. 190/PMK.05/2012 tentang Tata Cara Pembayaran dalam Rangka Pelaksanaan APBN'
    },

    // 11-15: PILAR KAS & OUTPUT
    {
      id: 11,
      category: 'INDIKATOR_DETAIL',
      title: 'PILAR 3: PENGELOLAAN UANG PERSEDIAAN & TUP (BOBOT 10%)',
      subtitle: 'Kecepatan Perputaran (Revolving) Kas Operasional Satker',
      badge: 'PILAR KAS',
      statsHighlight: [
        { label: 'Rata-Rata Capaian', value: avgUP, note: 'Target: 100.00', color: 'emerald' },
        { label: 'Batas Revolving', value: '30 Hari Kalender', note: 'Minimal Serapan 50%', color: 'amber' },
        { label: 'Batas Pertanggungjawaban TUP', value: '30 Hari', note: 'Wajib Nihil/GUP TUP', color: 'rose' }
      ],
      analysisPoints: [
        'Satker wajib melakukan revolving GUP minimal 50% dari besaran pagu UP dalam jangka waktu 1 bulan (30 hari).',
        'Dana TUP yang disetujui harus dipertanggungjawabkan habis dalam 1 bulan dan sisa dana wajib disetor ke kas negara.',
        'Dana kas UP yang mengendap di rekening bendahara tanpa perputaran akan dikenakan penalti pemotongan UP otomatis.'
      ],
      recommendation: 'Bendahara agar membiasakan mengajukan SPM GUP bertahap (minimal 2x dalam sebulan) tanpa menunggu batas 30 hari.',
      regulationRef: 'PMK Pengelolaan Kas dan Uang Persediaan DJPb'
    },
    {
      id: 12,
      category: 'INDIKATOR_DETAIL',
      title: 'PILAR 3: KEPATUHAN PENYAMPAIAN LPJ BENDAHARA (BOBOT 10%)',
      subtitle: 'Akuntabilitas Rekonsiliasi Pembukuan Kas Bendahara',
      badge: 'PILAR KAS',
      statsHighlight: [
        { label: 'Rata-Rata Capaian', value: avgLPJ, note: 'Target: 100.00', color: 'emerald' },
        { label: 'Batas Penyampaian', value: 'Tanggal 10', note: 'Bulan Berikutnya', color: 'rose' }
      ],
      analysisPoints: [
        'Mengukur ketepatan waktu penyampaian LPJ Bendahara Pengeluaran dan LPJ Bendahara Penerimaan ke KPPN.',
        'Batas akhir penyampaian LPJ adalah tanggal 10 bulan berikutnya (atau hari kerja sebelumnya jika libur).',
        'Penyampaian LPJ harus telah melalui verifikasi rekonsiliasi internal modul Bendahara dan Akuntansi SAKTI.'
      ],
      recommendation: 'Lakukan tutup buku kas bendahara pada hari kerja terakhir setiap bulan dan kirimkan LPJ pada tanggal 1-5.',
      regulationRef: 'Perdirjen Perbendaharaan tentang Pedoman Penyusunan dan Penyampaian LPJ Bendahara'
    },
    {
      id: 13,
      category: 'INDIKATOR_DETAIL',
      title: 'PILAR 3: DISPENSASI PENGAJUAN SPM (BOBOT 5%)',
      subtitle: 'Kepatuhan Pengajuan Tagihan Sesuai Jam Layanan Normal',
      badge: 'PILAR KAS',
      statsHighlight: [
        { label: 'Rata-Rata Capaian', value: avgDispensasi, note: 'Target: 100.00', color: 'emerald' },
        { label: 'Target Dispensasi', value: '0 Surat', note: 'Nihil Pinalti', color: 'indigo' }
      ],
      analysisPoints: [
        'Menghitung jumlah surat dispensasi pengajuan SPM yang diterbitkan oleh Kepala KPPN atau Kanwil DJPb.',
        'Dispensasi umumnya terjadi akibat keterlambatan penyampaian SPM di luar batas waktu normal atau pada akhir tahun anggaran.',
        'Setiap lembar dispensasi yang diterbitkan akan mengurangi nilai indikator ini secara progresif.'
      ],
      recommendation: 'Rencanakan pengajuan SPM jauh-jauh hari sebelum tanggal cut-off langkah-langkah akhir tahun (LLAT).',
      regulationRef: 'Perdirjen Penilaian IKPA Sub Indikator Dispensasi SPM'
    },
    {
      id: 14,
      category: 'INDIKATOR_DETAIL',
      title: 'PILAR 4: KINERJA CAPAIAN OUTPUT SAKTI (BOBOT 25%)',
      subtitle: 'Pilar Tertinggi Penentu Nilai Akhir IKPA Satuan Kerja',
      badge: 'PILAR OUTPUT (25%)',
      statsHighlight: [
        { label: 'Rata-Rata Capaian', value: avgOutput, note: 'Target: >= 95.00', color: 'amber' },
        { label: 'Bobot Indikator', value: '25%', note: 'Bobot Terbesar', color: 'emerald' },
        { label: 'Batas Konfirmasi PPK', value: 'Tanggal 5', note: 'Tiap Bulan di SAKTI', color: 'rose' }
      ],
      analysisPoints: [
        'Merupakan indikator dengan bobot tertinggi dalam IKPA (25% dari total nilai komposit).',
        'Mengukur 3 komponen: Ketepatan waktu pelaporan data capaian output, Capaian Rincian Output (CRO), dan Kewajaran gap PCRO vs RVRO.',
        'Batas waktu final konfirmasi PPK pada modul Komitmen SAKTI adalah tanggal 5 bulan berikutnya.'
      ],
      recommendation: 'PPK wajib memverifikasi dan menandatangani elektronik konfirmasi output paling lambat tanggal 3 setiap bulannya.',
      regulationRef: 'Kepdirjen Perbendaharaan tentang Petunjuk Teknis Pengukuran Capaian Output Satker SAKTI'
    },
    {
      id: 15,
      category: 'INDIKATOR_DETAIL',
      title: 'ANALISIS GAP PROGRES FISIK VS ANGGARAN (PCRO VS RVRO)',
      subtitle: 'Pencegahan Anomali dan Deviasi Kualitas Data Output',
      badge: 'PILAR OUTPUT',
      analysisPoints: [
        'PCRO (Progress Capaian Rincian Output) menggambarkan persentase kemajuan fisik output riil.',
        'RVRO (Realisasi Volume Rincian Output) menggambarkan jumlah kuantitas fisik output yang telah selesai diserahterimakan.',
        'Anomali terjadi jika serapan anggaran belanja telah mencapai 90% namun PCRO masih di bawah 30%, atau sebaliknya.',
        'Gap deviasi di atas 20% antara progres keuangan dan fisik akan menurunkan skor kualitas data output satker.'
      ],
      recommendation: 'Lakukan reviu mingguan antara pejabat teknis pembuat output dengan PPK untuk menyelaraskan kurva S proyek dengan serapan kas.',
      regulationRef: 'Buku Saku Monev Capaian Output DJPb'
    },

    // 16-20: RANKING SATKER (TOP 10)
    {
      id: 16,
      category: 'SATKER_RANKING',
      title: 'DAFTAR TOP 10 SATKER BERKINERJA TERBAIK',
      subtitle: 'Satuan Kerja dengan Perolehan Nilai IKPA Tertinggi',
      badge: 'HALL OF FAME',
      tableData: {
        headers: ['Rank', 'Kode', 'Nama Satuan Kerja', 'Nilai IKPA', 'Predikat'],
        rows: topSatkers.slice(0, 8).map((s, idx) => [
          `#${idx + 1}`,
          s.kodeSatker,
          s.namaSatker.substring(0, 32),
          (s.nilaiTotalIKPA || 0).toFixed(2),
          (s.nilaiTotalIKPA || 0) >= 95 ? 'Sangat Baik' : 'Baik'
        ])
      },
      analysisPoints: [
        'Satker dalam jajaran Top 10 berhasil mengoptimalkan seluruh 8 indikator dengan nilai mendekati sempurna (100.00).',
        'Ciri khas satker peringkat atas adalah tidak memiliki catatan deviasi RPD dan selalu mengonfirmasi output sebelum tanggal 3.',
        'Perlu diberikan piagam penghargaan apresiasi pada acara stakeholder day KPPN Semarang I.'
      ],
      recommendation: 'Pertahankan tata kelola yang sudah sangat baik ini dan jadikan satker rujukan benchmarking bagi satker lainnya.',
      regulationRef: 'Kriteria Pemberian Penghargaan Kinerja Pelaksanaan Anggaran KPPN'
    },
    {
      id: 17,
      category: 'SATKER_RANKING',
      title: 'PROFIL & KIAT SUKSES SATKER PERINGKAT 1 - 3',
      subtitle: 'Best Practices Tata Kelola Anggaran Satker Juara',
      badge: 'TOP 3 CHAMPIONS',
      analysisPoints: [
        `Peringkat 1 (${topSatkers[0]?.namaSatker || 'Satker Juara 1'} - ${topSatkers[0]?.nilaiTotalIKPA?.toFixed(2) || '100'}): Disiplin mutlak jadwal penagihan dan monitoring harian SAKTI.`,
        `Peringkat 2 (${topSatkers[1]?.namaSatker || 'Satker Juara 2'} - ${topSatkers[1]?.nilaiTotalIKPA?.toFixed(2) || '99.50'}): Koordinasi intensif mingguan antara KPA, PPK, dan bendahara.`,
        `Peringkat 3 (${topSatkers[2]?.namaSatker || 'Satker Juara 3'} - ${topSatkers[2]?.nilaiTotalIKPA?.toFixed(2) || '99.00'}): Pemanfaatan transaksi non-tunai KKP dan Digipay 100%.`
      ],
      recommendation: 'Satker lain dapat mengadopsi checklist kerja harian yang diterapkan oleh satker peringkat 1-3.',
      regulationRef: 'Best Practice Framework DJPb Kemenkeu'
    },
    {
      id: 18,
      category: 'SATKER_RANKING',
      title: 'KONSISTENSI SATKER PERINGKAT 4 - 10',
      subtitle: 'Ketahanan Mutu Administrasi dan Nol Penolakan SPM',
      badge: 'TOP TIER ACHIEVER',
      analysisPoints: [
        'Menunjukkan konsistensi dalam ketepatan waktu pengajuan SPM tanpa retur SP2D.',
        'Pengelolaan kas UP sangat efisien dengan perputaran di bawah 20 hari kerja.',
        'Data capaian output terisi lengkap dengan narasi penjelasan kendala yang akurat.'
      ],
      recommendation: 'Tingkatkan sedikit akselerasi pada penyerapan belanja modal untuk menembus 3 besar terbaik.',
      regulationRef: 'Standard Operating Procedure Pengelolaan Perbendaharaan'
    },
    {
      id: 19,
      category: 'SATKER_RANKING',
      title: 'SATKER TERCEPAT LAPOR CAPAIAN OUTPUT SAKTI',
      subtitle: 'Apresiasi Kepatuhan Pelaporan Sebelum Tanggal 3',
      badge: 'SPEED & TIMELINESS',
      analysisPoints: [
        'Apresiasi khusus diberikan kepada satker yang berhasil menyelesaikan konfirmasi PPK sebelum tanggal 3 setiap bulannya.',
        'Pelaporan dini memberikan waktu yang cukup bagi petugas pembina KPPN untuk memverifikasi kewajaran data.',
        'Nihil risiko kegagalan submit akibat beban puncak (traffic peak) server SAKTI pada tanggal 5.'
      ],
      recommendation: 'Budayakan pelaporan data output segera setelah tutup buku kas bulanan pada tanggal 1.',
      regulationRef: 'Surat Edaran KPPN tentang Percepatan Pengisian Capaian Output'
    },
    {
      id: 20,
      category: 'SATKER_RANKING',
      title: 'SATKER TERTIB REVOLVING UANG PERSEDIAAN (UP)',
      subtitle: 'Perputaran Kas Operasional Tercepat dan Efisien',
      badge: 'CASH VELOCITY',
      analysisPoints: [
        'Satker dengan rata-rata perputaran revolving UP di bawah 15 hari kalender.',
        'Mendukung prinsip efisiensi kas negara tanpa penumpukan saldo mengendap (*idle cash*).',
        'Pemanfaatan CMS Bank dan KKP mempercepat proses penyusunan SPP/SPM GUP.'
      ],
      recommendation: 'Pertahankan ritme revolving kas minimal 2x dalam sebulan demi likuiditas optimal.',
      regulationRef: 'Kebijakan Modernisasi Manajemen Kas DJPb'
    },

    // 21-25: PEMETAAN SATKER PERHATIAN
    {
      id: 21,
      category: 'DIAGNOSA_RISIKO',
      title: 'DAFTAR SATKER DALAM PERHATIAN KHUSUS (ATENSI MERAH)',
      subtitle: 'Satker dengan Nilai IKPA di Bawah 89.00 / Terkendala Output',
      badge: 'RED ATTENTION ZONE',
      tableData: {
        headers: ['No', 'Kode', 'Nama Satker', 'Deviasi', 'Output', 'Nilai Total'],
        rows: bottomSatkers.slice(0, 8).map((s, idx) => [
          String(idx + 1),
          s.kodeSatker,
          s.namaSatker.substring(0, 30),
          (s.indikator?.deviasiHal3Dipa || 100).toFixed(1),
          (s.indikator?.capaianOutput || 100).toFixed(1),
          (s.nilaiTotalIKPA || 0).toFixed(2)
        ])
      },
      analysisPoints: [
        `Terdapat ${bottomSatkers.length} Satuan Kerja yang memerlukan pendampingan intensif dari Seksi MSKI.`,
        'Mayoritas satker atensi mengalami anjloknya nilai pada indikator Capaian Output dan Deviasi Halaman III DIPA.',
        'Dibutuhkan surat atensi resmi dari Kepala KPPN kepada Kuasa Pengguna Anggaran (KPA) terkait.'
      ],
      recommendation: 'KPA satker bersangkutan wajib menjadwalkan konsultasi khusus bersama pembina satker KPPN minggu ini.',
      regulationRef: 'Surat Peringatan & Pembinaan Kinerja Anggaran DJPb'
    },
    {
      id: 22,
      category: 'DIAGNOSA_RISIKO',
      title: 'DIAGNOSA KENDALA: TINGGINYA DEVIASI HALAMAN III DIPA',
      subtitle: 'Analisis Akar Masalah Gap Rencana Penarikan Dana',
      badge: 'ROOT CAUSE ANALYSIS',
      analysisPoints: [
        'Akar Masalah 1: Kegiatan diundur atau dimajukan tanpa melakukan pemutakhiran RPD pada awal triwulan.',
        'Akar Masalah 2: Rekanan menagih terlambat atau menumpuk beberapa SPK dalam satu pengajuan tagihan.',
        'Akar Masalah 3: Kurangnya koordinasi antara pejabat pembuat komitmen dengan pengelola keuangan mengenai kalender kegiatan.'
      ],
      recommendation: 'Susun *action plan* jadwal penarikan kas mingguan dan kunci tanggal pengajuan SPM bersama penyedia jasa.',
      regulationRef: 'Pedoman Pengendalian RPD Halaman III DIPA'
    },
    {
      id: 23,
      category: 'DIAGNOSA_RISIKO',
      title: 'DIAGNOSA KENDALA: KETERLAMBATAN CAPAIAN OUTPUT SAKTI',
      subtitle: 'Analisis Akar Masalah Keterlambatan Konfirmasi PPK',
      badge: 'ROOT CAUSE ANALYSIS',
      analysisPoints: [
        'Akar Masalah 1: Operator teknis belum mengumpulkan bukti dukung fisik/laporan kegiatan.',
        'Akar Masalah 2: Pejabat Pembuat Komitmen (PPK) terlambat melakukan approval OTP pada modul komitmen.',
        'Akar Masalah 3: Masalah teknis lupa PIN/token OTP SAKTI pada hari-hari batas akhir pelaporan.'
      ],
      recommendation: 'Tunjuk PIC khusus pengumpul bukti dukung output dan lakukan konfirmasi berjenjang mulai tanggal 1.',
      regulationRef: 'SOP Monitoring dan Pengisian Capaian Output SAKTI'
    },
    {
      id: 24,
      category: 'DIAGNOSA_RISIKO',
      title: 'DIAGNOSA KENDALA: SIKLUS PERPUTARAN UP MELEWATI 30 HARI',
      subtitle: 'Analisis Kas Mengendap dan Keterlambatan GUP',
      badge: 'ROOT CAUSE ANALYSIS',
      analysisPoints: [
        'Akar Masalah 1: Penumpukan kuitansi kecil yang belum diverifikasi oleh PPK/Bendahara.',
        'Akar Masalah 2: Pagu UP terlalu besar dibandingkan kebutuhan riil operasional bulanan satker.',
        'Akar Masalah 3: Bendahara menunggu kuitansi terkumpul 100% baru memproses SPP GUP.'
      ],
      recommendation: 'Segera ajukan GUP begitu serapan mencapai 50% tanpa menunggu kuitansi menumpuk di akhir bulan.',
      regulationRef: 'Pedoman Penyesuaian Besaran UP Satuan Kerja'
    },
    {
      id: 25,
      category: 'DIAGNOSA_RISIKO',
      title: 'MATRIKS KUADRAN RISIKO KEPATUHAN SATKER',
      subtitle: 'Pemetaan Satker Berdasarkan Risiko Kinerja & Kepatuhan',
      badge: 'RISK MATRIX',
      analysisPoints: [
        'Kuadran I (Unggul): Kepatuhan Tinggi, Kinerja Sangat Baik (Pertahankan & Beri Apresiasi).',
        'Kuadran II (Potensial): Kepatuhan Tinggi, Serapan Rendah (Dorong Eksekusi Kegiatan).',
        'Kuadran III (Rentan): Serapan Tinggi, Administrasi & Output Terlambat (Benahi Disiplin Pelaporan).',
        'Kuadran IV (Kritis): Serapan Rendah, Nilai IKPA < 80 (Intervensi Khusus & Audit Tata Kelola).'
      ],
      recommendation: 'Seksi MSKI fokus mengawal satker pada Kuadran III dan IV untuk naik ke Kuadran I.',
      regulationRef: 'Manajemen Risiko Pelaksanaan Anggaran Kemenkeu'
    },

    // 26-30: DIAGNOSA AKAR MASALAH & EWS
    {
      id: 26,
      category: 'DIAGNOSA_RISIKO',
      title: 'DIAGNOSA ASPEK SDM & SERTIFIKASI PEJABAT PERBENDAHARAAN',
      subtitle: 'Ketersediaan dan Kompetensi Pejabat Pengelola Keuangan',
      badge: 'SDM & KOMPETENSI',
      analysisPoints: [
        'Tingginya mutasi pejabat perbendaharaan (PPK/PPSPM/Bendahara) tanpa transfer pengetahuan yang memadai.',
        'Kewajiban kepemilikan Sertifikat Bendahara (BNT) dan Sertifikat PPK/PPSPM (PNT/SNT) yang harus diperbarui.',
        'Kebutuhan bimbingan teknis modul SAKTI bagi pejabat dan operator yang baru dilantik.'
      ],
      recommendation: 'Satker yang mengalami mutasi pejabat wajib segera mengajukan pendaftaran user SAKTI dan mengikuti coaching clinic KPPN.',
      regulationRef: 'PMK Sertifikasi Bendahara dan Pejabat Perbendaharaan'
    },
    {
      id: 27,
      category: 'DIAGNOSA_RISIKO',
      title: 'DIAGNOSA PROSES PENGADAAN BARANG & JASA (PBJ)',
      subtitle: 'Kendala Lelang dan Keterlambatan Pelaksanaan Kontrak',
      badge: 'PENGADAAN & KONTRAK',
      analysisPoints: [
        'Keterlambatan proses lelang/tender pada unit kerja pengadaan (UKPBJ).',
        'Terjadinya tender ulang (gagal lelang) yang menggeser jadwal pelaksanaan fisik.',
        'Adendum kontrak yang mengubah jadwal termin pembayaran tanpa sinkronisasi ke Halaman III DIPA.'
      ],
      recommendation: 'Laksanakan tender dini pra-DIPA untuk pekerjaan kontraktual tahun depan.',
      regulationRef: 'Perpres Pengadaan Barang dan Jasa Pemerintah'
    },
    {
      id: 28,
      category: 'DIAGNOSA_RISIKO',
      title: 'DIAGNOSA KOORDINASI INTERNAL & POLA KOMUNIKASI SATKER',
      subtitle: 'Sinergi Kuasa Pengguna Anggaran, PPK, dan Bagian Perencanaan',
      badge: 'INTERNAL GOVERNANCE',
      analysisPoints: [
        'Terjadinya *silo* komunikasi antara tim perencana kegiatan, pejabat pengadaan, dan bendahara pengeluaran.',
        'KPA belum memimpin rapat evaluasi internal berkala sebelum batas akhir pelaporan.',
        'Ketiadaan kalender kerja terpadu pelaksanaan anggaran pada tingkat satuan kerja.'
      ],
      recommendation: 'KPA wajib mengadakan rapat evaluasi internal bulanan paling lambat tanggal 28 setiap bulannya.',
      regulationRef: 'Prinsip Good Governance Pengelolaan Keuangan Negara'
    },
    {
      id: 29,
      category: 'DIAGNOSA_RISIKO',
      title: 'DIAGNOSA ASPEK SISTEM & INFRASTRUKTUR IT SAKTI',
      subtitle: 'Kesiapan Jaringan, Token OTP, dan Validasi User Role',
      badge: 'SYSTEM & IT INFRASTRUCTURE',
      analysisPoints: [
        'Kendala penerimaan kode OTP SMS/WhatsApp saat beban server SAKTI melonjak di tanggal cut-off.',
        'Perubahan kewenangan user role yang belum di-mapping secara sempurna pada MonSAKTI.',
        'Kebutuhan pemutakhiran sertifikat digital Tanda Tangan Elektronik (TTE) yang telah kadaluarsa.'
      ],
      recommendation: 'Lakukan validasi user dan uji coba pengiriman data SAKTI minimal 3 hari sebelum batas akhir.',
      regulationRef: 'Petunjuk Teknis Keamanan Informasi & User Role SAKTI'
    },
    {
      id: 30,
      category: 'DIAGNOSA_RISIKO',
      title: 'EARLY WARNING SYSTEM (EWS) KPPN SEMARANG I',
      subtitle: 'Mekanisme Notifikasi Dini Otomatis Sebelum Jatuh Tempo',
      badge: 'EARLY WARNING SYSTEM',
      analysisPoints: [
        'KPPN Semarang I mengaktifkan modul peringatan dini otomatis berbasis WhatsApp broadcast.',
        'Notifikasi otomatis dikirimkan pada H-5, H-3, dan H-1 menjelang batas lapor Capaian Output dan LPJ Bendahara.',
        'Deteksi dini transaksi UP/TUP yang mendekati batas waktu 30 hari tanpa revolving.'
      ],
      recommendation: 'Pastikan nomor WhatsApp KPA, PPK, dan Bendahara yang terdaftar di database KPPN selalu aktif dan mutakhir.',
      regulationRef: 'Inovasi Layanan Publik KPPN Semarang I - Program ANGKASA'
    },

    // 31-35: ANALISIS KELOMPOK KEMENTERIAN / LEMBAGA
    {
      id: 31,
      category: 'KEMENTERIAN',
      title: 'REKAPITULASI KINERJA KELOMPOK KEMENTERIAN / LEMBAGA',
      subtitle: 'Perbandingan Rata-Rata Nilai Antar Rumpun K/L Mitra Kerja',
      badge: 'K/L SECTOR ANALYSIS',
      analysisPoints: [
        'Rumpun Lembaga Penegak Hukum & Kehakiman: Kinerja kas dan kepatuhan LPJ sangat baik.',
        'Rumpun Kementerian Agama & Pendidikan: Memerlukan perhatian khusus pada serapan dana bantuan dan pelaporan output madrasah.',
        'Rumpun Kementerian Teknis & Infrastruktur: Fokus pada percepatan belanja modal dan pendaftaran kontrak.',
        'Rumpun Lembaga Penyelenggara Pemilu (KPU/Bawaslu): Tertib pertanggungjawaban anggaran tahapan ad-hoc.'
      ],
      recommendation: 'Lakukan forum koordinasi tematik per rumpun K/L untuk membahas kendala spesifik sektoral.',
      regulationRef: 'Laporan Kinerja Sektoral DJPb'
    },
    {
      id: 32,
      category: 'KEMENTERIAN',
      title: 'EVALUASI KHUSUS SATKER KEMENAG & PENDIDIKAN',
      subtitle: 'Karakteristik Penyaluran BOS, PIP, & Operasional Pendidikan',
      badge: 'SEKTOR PENDIDIKAN',
      analysisPoints: [
        'Penyaluran Bantuan Operasional Sekolah (BOS) dan Program Indonesia Pintar (PIP) harus tepat sasaran dan tepat waktu.',
        'Data capaian output madrasah/satker pendidikan wajib menggambarkan jumlah siswa penerima manfaat riil.',
        'Hindari penumpukan pencairan tunjangan profesi guru di akhir semester.'
      ],
      recommendation: 'Sinkronkan data EMIS/Dapodik dengan target volume rincian output di modul Komitmen SAKTI.',
      regulationRef: 'Petunjuk Operasional Penyaluran Dana Pendidikan Kemenkeu-Kemenag'
    },
    {
      id: 33,
      category: 'KEMENTERIAN',
      title: 'EVALUASI KHUSUS SATKER POLRI & HUKUM/HAM',
      subtitle: 'Belanja Barang Operasional, Harkamtibmas, & Penegakan Hukum',
      badge: 'SEKTOR HUKUM & KEAMANAN',
      analysisPoints: [
        'Pengelolaan dana operasional penegakan hukum dan pemeliharaan keamanan harus tertib administrasi kuitansi.',
        'Optimalisasi pemanfaatan KKP untuk belanja bahan bakar, ransum, dan pergeseran pasukan.',
        'Penyampaian LPJ Bendahara rutin menempati urutan tercepat di KPPN Semarang I.'
      ],
      recommendation: 'Tingkatkan implementasi marketplace Digipay untuk pengadaan perlengkapan kantor dinas.',
      regulationRef: 'Juknis Pengelolaan Anggaran Sektor Pertahanan & Keamanan'
    },
    {
      id: 34,
      category: 'KEMENTERIAN',
      title: 'EVALUASI KHUSUS SATKER KPU & BAWASLU',
      subtitle: 'Tata Kelola Anggaran Tahapan Pemilu & Pengawasan Ad-Hoc',
      badge: 'SEKTOR PENYELENGGARA PEMILU',
      analysisPoints: [
        'Pengelolaan dana hibah dan pagu DIPA tahapan pemilu/pilkada memerlukan akuntabilitas ekstra.',
        'Penyelesaian pertanggungjawaban kas badan ad-hoc (PPK, PPS, Panwascam) harus tepat waktu.',
        'Rekonsiliasi rekening penampung dana pemilu wajib diselesaikan sebelum penutupan tahun anggaran.'
      ],
      recommendation: 'Lakukan audit kepatuhan internal berkala pada transaksi belanja badan ad-hoc.',
      regulationRef: 'PMK Tata Cara Pelaksanaan Anggaran Tahapan Pemilu'
    },
    {
      id: 35,
      category: 'KEMENTERIAN',
      title: 'EVALUASI KHUSUS KEMENTERIAN TEKNIS & INFRASTRUKTUR',
      subtitle: 'Akselerasi Belanja Modal Strategis & Padat Karya',
      badge: 'SEKTOR INFRASTRUKTUR',
      analysisPoints: [
        'Satker PUPR, Perhubungan, Pertanian, dan Lingkungan Hidup memegang alokasi belanja modal terbesar.',
        'Progres fisik proyek konstruksi harus sejalan dengan penerbitan BAST termin pembayaran.',
        'Mitigasi risiko keterlambatan pekerjaan yang melampaui tahun anggaran melalui mekanisme bank garansi.'
      ],
      recommendation: 'Pastikan seluruh jaminan pelaksanaan dan jaminan uang muka rekanan terverifikasi keabsahannya.',
      regulationRef: 'Pedoman Pelaksanaan Anggaran Belanja Modal Strategis Nasional'
    },

    // 36-40: DIGITALISASI KEUANGAN NEGARA
    {
      id: 36,
      category: 'DIGITALISASI',
      title: 'AKSELERASI IMPLEMENTASI KARTU KREDIT PEMERINTAH (KKP)',
      subtitle: 'Ketentuan Proporsi Belanja Non-Tunai dan Efisiensi Kas',
      badge: 'DIGITAL PAYMENT (KKP)',
      statsHighlight: [
        { label: 'Ketentuan Proporsi', value: '40% UP', note: 'Porsi Minimal KKP', color: 'indigo' },
        { label: 'Bebas Biaya Surcharge', value: '0 Rupiah', note: 'Bebas Bunga & Biaya Admin', color: 'emerald' },
        { label: 'Keamanan Transaksi', value: '100% Aman', note: 'Zero Risiko Pembobolan Kas', color: 'sky' }
      ],
      analysisPoints: [
        'Satker wajib mengalokasikan porsi KKP minimal 40% dari total pagu Uang Persediaan.',
        'KKP meminimalisir risiko uang hilang, uang palsu, dan kebocoran dana operasional.',
        'Pembayaran tagihan KKP melalui mekanisme SPM GUP KKP tepat waktu sebelum tanggal jatuh tempo bank.'
      ],
      recommendation: 'PPK agar menginstruksikan seluruh staf pelaksana perjalanan dinas dan belanja operasional untuk menggunakan KKP.',
      regulationRef: 'PMK Nomor 196/PMK.05/2018 tentang Tata Cara Pembayaran dan Penggunaan KKP'
    },
    {
      id: 37,
      category: 'DIGITALISASI',
      title: 'OPTIMALISASI MARKETPLACE PENGADAAN DIGIPAY SATU',
      subtitle: 'Pemberdayaan UMKM Mitra Kerja dan Pembukuan Otomatis',
      badge: 'MARKETPLACE DIGIPAY',
      analysisPoints: [
        'Digipay Satu mengintegrasikan pemesanan belanja barang, verifikasi penerimaan, pemotongan pajak otomatis, dan pembayaran.',
        'Membantu perputaran ekonomi UMKM lokal mitra kerja di wilayah Kota Semarang dan sekitarnya.',
        'Menghilangkan beban bendahara dalam menyetorkan pajak secara manual berkat integrasi sistem perbankan Himbara.'
      ],
      recommendation: 'Daftarkan minimal 3 UMKM rekanan langganan satker ke dalam sistem Digipay Satu KPPN Semarang I.',
      regulationRef: 'Perdirjen Perbendaharaan tentang Implementasi Marketplace Pengadaan Barang Jasa DJPb'
    },
    {
      id: 38,
      category: 'DIGITALISASI',
      title: 'CASH MANAGEMENT SYSTEM (CMS) & VIRTUAL ACCOUNT',
      subtitle: 'Penerapan 100% Transaksi Perbankan Elektronik Tanpa Kas Fisik',
      badge: 'CASHLESS SOCIETY',
      analysisPoints: [
        'Seluruh pembayaran honorarium, perjalanan dinas, dan pembelian barang wajib melalui CMS Bank.',
        'Brankas bendahara harus dalam kondisi *zero cash* (saldo kas tunai fisik mendekati Rp 0,-).',
        'Rekonsiliasi rekening koran elektronik dapat dipantau langsung secara *real-time*.'
      ],
      recommendation: 'Hindari penarikan uang tunai di teller bank untuk pembayaran pihak ketiga.',
      regulationRef: 'PMK Pengelolaan Rekening Pengeluaran Satker Berbasis Elektronik'
    },
    {
      id: 39,
      category: 'DIGITALISASI',
      title: 'DIGITALISASI DOKUMEN & TANDA TANGAN ELEKTRONIK (TTE)',
      subtitle: 'Pemanfaatan TTE Tersertifikasi BSrE pada SAKTI dan SPAN',
      badge: 'PAPERLESS GOVERNANCE',
      analysisPoints: [
        'Seluruh dokumen SPM, SPP, dan SPTJM telah mengadopsi Tanda Tangan Elektronik tersertifikasi.',
        'Menghilangkan kebutuhan pencetakan kertas fisik (*paperless*) dan mempercepat proses penerbitan SP2D KPPN.',
        'Keaslian dokumen terjamin dengan kode QR verifikasi integritas digital.'
      ],
      recommendation: 'Pastikan sertifikat digital TTE KPA, PPK, dan PPSPM selalu aktif dan diperbarui sebelum masa berlaku habis.',
      regulationRef: 'Peraturan BSSN & DJPb tentang Penerapan Sertifikat Elektronik Keuangan Negara'
    },
    {
      id: 40,
      category: 'DIGITALISASI',
      title: 'DAFTAR SATKER CHAMPION TRANSAKSI NON-TUNAI',
      subtitle: 'Apresiasi Satuan Kerja Teraktif Pengguna KKP & Digipay',
      badge: 'DIGITAL PIONEER',
      analysisPoints: [
        'Apresiasi diberikan kepada satker dengan frekuensi dan nominal transaksi non-tunai tertinggi.',
        'Satker champion membuktikan bahwa digitalisasi belanja mempercepat pertanggungjawaban kas hingga 50%.',
        'Akan dipromosikan sebagai *role model* digitalisasi perbendaharaan di tingkat wilayah Jawa Tengah.'
      ],
      recommendation: 'Tingkatkan kuota transaksi KKP dan perluas ke segmen belanja pemeliharaan sarana prasarana.',
      regulationRef: 'Penghargaan Digitalisasi Transaksi Keuangan Negara'
    },

    // 41-45: REGULASI & ISU STRATEGIS
    {
      id: 41,
      category: 'REGULASI_HOT_TOPIC',
      title: 'HOT TOPIC: REFORMULASI PENILAIAN IKPA TERBARU',
      subtitle: 'Arah Kebijakan DJPb Menuju *Value for Money* & Kualitas Belanja',
      badge: 'POLICY UPDATE',
      analysisPoints: [
        'Fokus penilaian IKPA bergeser dari sekadar kepatuhan administratif menjadi kualitas output dan efisiensi belanja (*Spending Better*).',
        'Pengetatan formula deviasi penarikan kas dan penajaman bobot capaian output menjadi 25%.',
        'Penguatan sinergi antara perencanaan DIPA awal tahun dengan eksekusi realisasi kas riil.'
      ],
      recommendation: 'Pelajari secara mendalam matriks reformulasi IKPA agar tidak kehilangan poin krusial.',
      regulationRef: 'Kepdirjen Perbendaharaan tentang Reformulasi Kebijakan IKPA Nasional'
    },
    {
      id: 42,
      category: 'REGULASI_HOT_TOPIC',
      title: 'HOT TOPIC: INTEGRASI NPWP 16 DIGIT & NIK REKANAN',
      subtitle: 'Validasi Master Supplier SPAN dan Pemotongan Pajak DJP',
      badge: 'TAX & SPAN SYNC',
      analysisPoints: [
        'Pemberlakuan NIK sebagai NPWP 16 digit pada transaksi pengeluaran keuangan negara.',
        'Master Supplier pada SPAN KPPN wajib tervalidasi dengan sistem perpajakan DJP untuk mencegah penolakan SP2D.',
        'PPK wajib memutakhirkan data rekanan/penyedia jasa sebelum menerbitkan SPM LS.'
      ],
      recommendation: 'Lakukan validasi NPWP 16 digit rekanan pada modul Komitmen SAKTI sebelum pendaftaran kontrak.',
      regulationRef: 'PMK Nomor 112/PMK.03/2022 tentang Penerapan NPWP Format Baru'
    },
    {
      id: 43,
      category: 'REGULASI_HOT_TOPIC',
      title: 'PEDOMAN LANGKAH-LANGKAH AKHIR TAHUN (LLAT)',
      subtitle: 'Jadwal Batas Akhir Penerimaan SPM dan Penutupan Kas',
      badge: 'YEAR-END GUIDELINES',
      analysisPoints: [
        'Pemberlakuan batas waktu (cut-off) pengajuan SPM Kontraktual, Non-Kontraktual, GUP, dan SPM Nihil.',
        'Mekanisme rekening penampungan akhir tahun (RPATA) untuk pekerjaan kontraktual yang belum selesai 100%.',
        'Dispensasi keterlambatan SPM pada akhir tahun akan langsung memotong nilai IKPA tahunan satker.'
      ],
      recommendation: 'Susun *timeline* mundur pencairan anggaran mulai bulan Oktober untuk mengantisipasi batas cut-off LLAT.',
      regulationRef: 'Perdirjen Perbendaharaan tentang Pedoman Pelaksanaan Penerimaan dan Pengeluaran Akhir Tahun'
    },
    {
      id: 44,
      category: 'REGULASI_HOT_TOPIC',
      title: 'LITERASI HUKUM & AKUNTABILITAS BENDAHARA PENGELUARAN',
      subtitle: 'Mitigasi Risiko Temuan Pemeriksaan BPK & Kepatuhan Pajak',
      badge: 'LEGAL & AUDIT MITIGATION',
      analysisPoints: [
        'Pencegahan potensi temuan audit: Pengeluaran tanpa bukti kuitansi sah, keterlambatan setor pajak, dan saldo kas minus.',
        'Tanggung jawab pribadi bendahara atas kerugian negara akibat kelalaian penyimpanan kas.',
        'Pentingnya rekonsiliasi internal bulanan antara pengelola persediaan, aset BMN, dan kas.'
      ],
      recommendation: 'Gunakan fasilitas konsultasi Klinik Akuntansi MSKI untuk memastikan pembukuan telah sesuai standar SAP.',
      regulationRef: 'Undang-Undang No. 1 Tahun 2004 tentang Perbendaharaan Negara'
    },
    {
      id: 45,
      category: 'REGULASI_HOT_TOPIC',
      title: 'INTEGRITAS & PROGRAM ZERO GRATIFIKASI KPPN SEMARANG I',
      subtitle: 'Layanan PASTI: Profesional, Akuntabel, Sinergi, Transparan, Integritas',
      badge: 'INTEGRITY & WBBM',
      statsHighlight: [
        { label: 'Tarif Layanan KPPN', value: 'Rp 0,-', note: '100% Gratis & Bebas Biaya', color: 'emerald' },
        { label: 'Komitmen Gratifikasi', value: 'TOLAK & LAPOR', note: 'Zero Toleransi Suap/Pungli', color: 'rose' },
        { label: 'Saluran Pengaduan', value: 'WISE & Portal', note: 'Kerahasiaan Pelapor Terjamin', color: 'indigo' }
      ],
      analysisPoints: [
        'Seluruh proses pencairan dana, konsultasi, penerbitan SKPP, dan bimbingan teknis di KPPN Semarang I adalah Rp 0,- (Nol Rupiah).',
        'Dilarang keras memberikan uang, bingkisan, konsumsi, atau gratifikasi dalam bentuk apapun kepada pegawai KPPN.',
        'KPPN Semarang I menyediakan saluran pengaduan resmi dan Whistleblowing System (WISE Kemenkeu).'
      ],
      recommendation: 'Dukung penuh pembangunan Zona Integritas KPPN Semarang I menuju Wilayah Birokrasi Bersih dan Melayani (WBBM).',
      regulationRef: 'Permenpan-RB Pembangunan Zona Integritas WBK/WBBM & Kode Etik Kemenkeu'
    },

    // 46-50: REKOMENDASI & PENUTUP
    {
      id: 46,
      category: 'REKOMENDASI_AKSI',
      title: 'KALENDER & TIMELINE BATAS WAKTU KRUSIAL BULANAN',
      subtitle: 'Jadwal Wajib Kepatuhan Seluruh Satuan Kerja Mitra',
      badge: 'CRITICAL CALENDAR',
      tableData: {
        headers: ['Tanggal / Periode', 'Agenda & Kewajiban Satker', 'PIC Satker', 'Indikator Terkait'],
        rows: [
          ['Tanggal 1 - 5', 'Konfirmasi Capaian Output di SAKTI', 'PPK & Operator Komitmen', 'Capaian Output (25%)'],
          ['Tanggal 1 - 10', 'Penyampaian LPJ Bendahara ke KPPN', 'Bendahara Pengeluaran', 'LPJ Bendahara (10%)'],
          ['Maksimal 30 Hari', 'Revolving GUP minimal 50% Pagu UP', 'Bendahara & PPK', 'Pengelolaan UP (10%)'],
          ['Maksimal 5 Hari Kerja', 'Pendaftaran SPK/Kontrak ke KPPN', 'PPK & Operator Komitmen', 'Belanja Kontraktual (10%)'],
          ['Bulan 1 Tiap Triwulan', 'Pemutakhiran RPD Halaman III DIPA', 'KPA & Tim Perencana', 'Deviasi Hal III (10%)']
        ]
      },
      analysisPoints: [
        'Kunci utama perolehan nilai IKPA 100 adalah kepatuhan pada 5 batas waktu krusial di atas.',
        'Keterlambatan 1 hari saja akan langsung mengunci penalti nilai sistem yang tidak dapat diperbaiki secara manual.'
      ],
      recommendation: 'Cetak dan tempelkan kalender batas waktu ini di ruang kerja pengelola keuangan satuan kerja.',
      regulationRef: 'Standar Kalender Kerja Pelaksanaan Anggaran DJPb'
    },
    {
      id: 47,
      category: 'REKOMENDASI_AKSI',
      title: 'CHECKLIST TINDAKAN TEKNIS PENGELOLA ANGGARAN',
      subtitle: 'Panduan Aksi Mingguan Kuasa Pengguna Anggaran (KPA) & PPK',
      badge: 'ACTION CHECKLIST',
      analysisPoints: [
        'Minggu I: Konfirmasi data capaian output bulan lalu & kirimkan LPJ Bendahara.',
        'Minggu II: Reviu realisasi belanja terhadap RPD Halaman III DIPA & percepat penyusunan SPP belanja non-operasional.',
        'Minggu III: Eksekusi revolving GUP kas persediaan & pastikan kontrak baru telah terdaftar di KPPN.',
        'Minggu IV: Rapat evaluasi internal KPA bersama seluruh PPK & persiapan tutup buku kas.'
      ],
      recommendation: 'Jadikan 4 tahapan mingguan ini sebagai SOP internal pelaksanaan anggaran di unit kerja.',
      regulationRef: 'Framework Monitoring Internal KPA Satker'
    },
    {
      id: 48,
      category: 'REKOMENDASI_AKSI',
      title: 'PROGRAM ASISTENSI & KLINIK KONSULTASI MSKI KPPN',
      subtitle: 'Fasilitas Pendampingan Teknis dan Bimbingan 1-on-1',
      badge: 'CONSULTATION & CLINIC',
      analysisPoints: [
        'Klinik Akuntansi & Pelaporan Keuangan (Setiap Hari Kerja di Front Office / Daring Zoom).',
        'Coaching Clinic Modul SAKTI (Komitmen, Bendahara, Pembayaran, dan Akuntansi).',
        'Asistensi Remote via AnyDesk bagi satker yang mengalami kendala teknis validasi data.',
        'Asisten Analis AI Gemini 24 Jam pada Portal ANGKASA KPPN Semarang I.'
      ],
      recommendation: 'Segera hubungi tim pembina Seksi MSKI begitu menemukan kendala teknis tanpa menunggu tanggal batas akhir.',
      regulationRef: 'Program Inovasi Layanan Konsultasi KPPN Semarang I'
    },
    {
      id: 49,
      category: 'REKOMENDASI_AKSI',
      title: 'TARGET KINERJA BERSAMA PERIODE SELANJUTNYA',
      subtitle: 'Komitmen KPPN Semarang I & Satker Menuju Peringkat 1 Nasional',
      badge: 'SHARED GOALS',
      statsHighlight: [
        { label: 'Target Nilai Agregat', value: '>= 96.00', note: 'Kategori Sangat Baik', color: 'emerald' },
        { label: 'Target Satker Sangat Baik', value: '>= 85%', note: 'Mayoritas Mutlak', color: 'indigo' },
        { label: 'Target Pinalti Nilai', value: '0 Kasus', note: 'Zero Keterlambatan', color: 'rose' }
      ],
      analysisPoints: [
        'Mendorong KPPN Semarang I dan seluruh satker mitra menjadi rujukan tata kelola perbendaharaan terbaik nasional.',
        'Mewujudkan belanja negara yang berkualitas, tepat waktu, tepat sasaran, dan memberikan dampak nyata bagi masyarakat (*Value for Money*).',
        'Memperkuat sinergi dan transparansi antara KPPN sebagai Kuasa BUN Daerah dengan Satker Pengelola DIPA.'
      ],
      recommendation: 'Mari bersama-sama kita wujudkan akuntabilitas perbendaharaan yang unggul dan berintegritas tinggi.',
      regulationRef: 'Kontrak Kinerja Pimpinan Kemenkeu & DJPb'
    },
    {
      id: 50,
      category: 'PENUTUP',
      title: 'KESIMPULAN, KOMITMEN BERSAMA & KONTAK LAYANAN',
      subtitle: 'Terima Kasih Atas Sinergi & Dedikasi Pengelolaan APBN',
      badge: 'CLOSING & CONTACT',
      statsHighlight: [
        { label: 'WhatsApp Helpdesk', value: dashboardConfig.helpdeskPhone || '0812-3456-7890', note: 'Respon Cepat Jam Kerja', color: 'emerald' },
        { label: 'Portal Layanan', value: 'PORTAL ANGKASA', note: 'Monitoring IKPA Realtime', color: 'indigo' },
        { label: 'Email Resmi', value: 'kppn026@kemenkeu.go.id', note: 'Seksi MSKI KPPN Semarang I', color: 'sky' }
      ],
      analysisPoints: [
        'Kinerja IKPA yang optimal mencerminkan disiplin, transparansi, dan integritas seluruh pengelola anggaran.',
        'Seksi MSKI KPPN Semarang I senantiasa siap memberikan pendampingan terbaik tanpa dipungut biaya apapun (Rp 0,-).',
        'Portal ANGKASA terus dikembangkan untuk memudahkan monitoring harian dan pengambilan keputusan strategis satker.'
      ],
      recommendation: 'Simpan kontak resmi KPPN dan manfaatkan Portal ANGKASA sebagai *dashboard* utama pemantauan kinerja harian Anda.',
      regulationRef: 'Seksi Manajemen Satker dan Kepatuhan Internal (MSKI) • KPPN Semarang I (026)'
    }
  ], [
    activeScopeInfo,
    avgIKPA,
    avgNum,
    totalSatker,
    sangatBaik.length,
    baik.length,
    cukup.length,
    kurang.length,
    avgRevisi,
    avgDeviasi,
    avgPenyerapan,
    avgBelanja,
    avgUP,
    avgLPJ,
    avgDispensasi,
    avgOutput,
    topSatkers,
    bottomSatkers,
    dashboardConfig.helpdeskPhone
  ]);

  // Filtered slide list for display
  const displayedSlides = useMemo(() => {
    if (selectedCategoryFilter === 'ALL') return all50Slides;
    return all50Slides.filter(s => s.category === selectedCategoryFilter);
  }, [all50Slides, selectedCategoryFilter]);

  const currentSlide = all50Slides[currentSlideIndex] || all50Slides[0];

  // Selection Toggles
  const toggleSlideSelection = (id: number) => {
    setSelectedSlideIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllSlides = () => {
    setSelectedSlideIds(all50Slides.map(s => s.id));
  };

  const deselectAllSlides = () => {
    setSelectedSlideIds([]);
  };

  // Export Selected Slides to PPTX (Deep, Fully-Structured, Rich Styling)
  const handleExportSelectedPPTX = async () => {
    if (selectedSlideIds.length === 0) {
      alert('Pilih minimal 1 slide untuk diunduh ke PowerPoint!');
      return;
    }

    setIsExportingPPT(true);
    try {
      const pptx = new pptxgen();
      pptx.layout = 'LAYOUT_16x9';
      pptx.author = 'KPPN Semarang I';
      pptx.company = 'DJPb Kementerian Keuangan RI';
      pptx.title = `${activeScopeInfo.title} - KPPN Semarang I (${selectedSlideIds.length} Slide)`;

      // Filter slides to include
      const slidesToExport = all50Slides.filter(s => selectedSlideIds.includes(s.id));

      slidesToExport.forEach((slideItem, index) => {
        const slide = pptx.addSlide();
        slide.background = { color: '0F172A' }; // Dark Slate Executive Background

        // Top Header Bar
        slide.addText('KEMENTERIAN KEUANGAN RI  •  DITJEN PERBENDAHARAAN  •  KPPN SEMARANG I (026)', {
          x: 0.6,
          y: 0.4,
          w: 7.0,
          h: 0.3,
          fontSize: 9,
          color: '818CF8',
          bold: true,
          fontFace: 'Arial'
        });

        slide.addText(`SLIDE ${index + 1} / ${slidesToExport.length}  |  ${slideItem.badge}`, {
          x: 7.6,
          y: 0.4,
          w: 5.1,
          h: 0.3,
          fontSize: 9,
          color: '94A3B8',
          align: 'right',
          bold: true,
          fontFace: 'Arial'
        });

        // Slide Title & Subtitle
        slide.addText(slideItem.title, {
          x: 0.6,
          y: 0.8,
          w: 12.0,
          h: 0.6,
          fontSize: 18,
          color: 'FFFFFF',
          bold: true,
          fontFace: 'Arial'
        });

        slide.addText(slideItem.subtitle, {
          x: 0.6,
          y: 1.35,
          w: 12.0,
          h: 0.35,
          fontSize: 11,
          color: '38BDF8',
          fontFace: 'Arial'
        });

        let currentY = 1.85;

        // Stats Highlight Cards if available
        if (slideItem.statsHighlight && slideItem.statsHighlight.length > 0) {
          const cardWidth = Math.min(3.6, (12.0 - (slideItem.statsHighlight.length - 1) * 0.25) / slideItem.statsHighlight.length);
          slideItem.statsHighlight.forEach((stat, sIdx) => {
            const cardX = 0.6 + sIdx * (cardWidth + 0.25);
            slide.addShape(pptx.ShapeType.roundRect, {
              x: cardX,
              y: currentY,
              w: cardWidth,
              h: 0.95,
              fill: { color: '1E293B' },
              line: { color: '334155', width: 1 }
            });
            slide.addText(stat.label.toUpperCase(), {
              x: cardX + 0.15,
              y: currentY + 0.1,
              w: cardWidth - 0.3,
              h: 0.2,
              fontSize: 8,
              color: '94A3B8',
              bold: true
            });
            slide.addText(stat.value, {
              x: cardX + 0.15,
              y: currentY + 0.3,
              w: cardWidth - 0.3,
              h: 0.35,
              fontSize: 16,
              color: stat.color === 'emerald' ? '34D399' : stat.color === 'rose' ? 'FB7185' : stat.color === 'amber' ? 'FBBF24' : '60A5FA',
              bold: true
            });
            if (stat.note) {
              slide.addText(stat.note, {
                x: cardX + 0.15,
                y: currentY + 0.68,
                w: cardWidth - 0.3,
                h: 0.2,
                fontSize: 8,
                color: 'CBD5E1'
              });
            }
          });
          currentY += 1.15;
        }

        // Table Data if available
        if (slideItem.tableData && slideItem.tableData.rows.length > 0) {
          const formattedTableRows: any = [
            slideItem.tableData.headers.map(h => ({
              text: h,
              options: { bold: true, fill: { color: '312E81' }, color: 'FFFFFF', fontSize: 9 }
            }))
          ];

          slideItem.tableData.rows.forEach(row => {
            formattedTableRows.push(
              row.map(cell => ({
                text: String(cell),
                options: { fill: { color: '1E293B' }, color: 'E2E8F0', fontSize: 8.5 }
              }))
            );
          });

          (slide as any).addTable(formattedTableRows, {
            x: 0.6,
            y: currentY,
            w: 12.0,
            autoPage: false
          });

          currentY += Math.min(2.2, 0.35 + slideItem.tableData.rows.length * 0.28);
        }

        // Deep Analysis Bullet Points
        if (slideItem.analysisPoints && slideItem.analysisPoints.length > 0) {
          const bulletText = slideItem.analysisPoints.map(p => `• ${p}`).join('\n');
          slide.addText('Kajian Strategis & Fakta Pelaksanaan Anggaran:', {
            x: 0.6,
            y: currentY,
            w: 12.0,
            h: 0.3,
            fontSize: 10.5,
            color: 'FBBF24',
            bold: true
          });

          slide.addText(bulletText, {
            x: 0.6,
            y: currentY + 0.3,
            w: 12.0,
            h: Math.min(1.8, slideItem.analysisPoints.length * 0.35),
            fontSize: 9.5,
            color: 'E2E8F0',
            lineSpacing: 16
          });

          currentY += 0.35 + Math.min(1.8, slideItem.analysisPoints.length * 0.35);
        }

        // Actionable Recommendation Box
        if (slideItem.recommendation && currentY < 6.4) {
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.6,
            y: Math.min(5.7, currentY + 0.05),
            w: 12.0,
            h: 0.75,
            fill: { color: '1E1B4B' },
            line: { color: '6366F1', width: 1 }
          });

          slide.addText(`REKOMENDASI TINDAKAN: ${slideItem.recommendation}`, {
            x: 0.8,
            y: Math.min(5.75, currentY + 0.1),
            w: 11.6,
            h: 0.6,
            fontSize: 9,
            color: 'C7D2FE',
            bold: true
          });
        }

        // Footer Bar
        slide.addText('Portal ANGKASA V3.2  •  Seksi MSKI KPPN Semarang I  •  Layanan Bebas Biaya (Rp 0,-)', {
          x: 0.6,
          y: 6.8,
          w: 8.0,
          h: 0.3,
          fontSize: 8,
          color: '64748B'
        });

        if (slideItem.regulationRef) {
          slide.addText(slideItem.regulationRef, {
            x: 8.6,
            y: 6.8,
            w: 4.1,
            h: 0.3,
            fontSize: 7.5,
            color: '64748B',
            align: 'right'
          });
        }
      });

      const fileName = `Paparan_IKPA_${periodScope}_50Slide_KPPN_Semarang_I.pptx`;
      await pptx.writeFile({ fileName });
    } catch (err) {
      console.error(err);
      alert('Gagal menghasilkan file PowerPoint: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsExportingPPT(false);
    }
  };

  // Render Slide Stage Content (Rich Visual Preview)
  const renderSlideStage = (slide: DetailedSlideContent) => {
    return (
      <div className="h-full flex flex-col justify-between p-5 sm:p-7 bg-slate-900 text-white relative overflow-y-auto">
        {/* Ambient Backlight */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Slide Header */}
        <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-black uppercase">
              {slide.category.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400 font-mono">Slide {slide.id} / 50</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSlideSelection(slide.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedSlideIds.includes(slide.id)
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {selectedSlideIds.includes(slide.id) ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Dipilih untuk PPTX</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Tidak Dipilih</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Slide Body */}
        <div className="my-auto py-3 space-y-3.5 relative z-10">
          
          {/* Titles */}
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest mb-1">
              <Target className="w-3 h-3 text-amber-400" />
              <span>{slide.badge}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
              {slide.title}
            </h2>
            <p className="text-xs text-sky-400 font-semibold mt-0.5">
              {slide.subtitle}
            </p>
          </div>

          {/* Stats Highlight Cards */}
          {slide.statsHighlight && slide.statsHighlight.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {slide.statsHighlight.map((stat, sIdx) => (
                <div key={sIdx} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">{stat.label}</span>
                  <span className={`text-xl font-black block mt-0.5 ${
                    stat.color === 'emerald' ? 'text-emerald-400' :
                    stat.color === 'rose' ? 'text-rose-400' :
                    stat.color === 'amber' ? 'text-amber-400' : 'text-sky-400'
                  }`}>
                    {stat.value}
                  </span>
                  {stat.note && <span className="text-[9px] text-slate-400 block mt-0.5">{stat.note}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Table Data if available */}
          {slide.tableData && slide.tableData.rows.length > 0 && (
            <div className="rounded-xl border border-slate-700/80 overflow-hidden bg-slate-950/60 max-h-[160px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-indigo-950/80 text-indigo-200 uppercase font-black text-[10px] sticky top-0">
                  <tr>
                    {slide.tableData.headers.map((h, hIdx) => (
                      <th key={hIdx} className="p-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-[11px]">
                  {slide.tableData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/50">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 text-slate-200">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Deep Analysis Bullet Points */}
          {slide.analysisPoints && slide.analysisPoints.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-black text-[11px] uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kajian Strategis &amp; Fakta Perbendaharaan:</span>
              </div>
              <ul className="space-y-1 text-slate-200 text-[11px] leading-relaxed">
                {slide.analysisPoints.map((point, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-1.5">
                    <span className="text-indigo-400 font-bold shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation Box */}
          {slide.recommendation && (
            <div className="p-2.5 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-[11px] text-indigo-200 flex items-start gap-2">
              <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-amber-300 mr-1">Rekomendasi Tindakan:</span>
                <span>{slide.recommendation}</span>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Slide Footer */}
        <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between text-xs text-slate-400 relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span>KPPN Semarang I (026) • Seksi MSKI</span>
            {slide.regulationRef && (
              <span className="hidden sm:inline text-[10px] text-slate-500 font-mono truncate max-w-xs">
                | {slide.regulationRef}
              </span>
            )}
          </div>
          {onAskGeminiForTopic && (
            <button
              onClick={() => onAskGeminiForTopic(`Tolong buatkan kajian narasi mendalam, naskah pidato KPA, dan rekomendasi teknis untuk topik: ${slide.title} (${slide.subtitle}) berdasarkan regulasi perbendaharaan terbaru.`)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Perdalam Materi Ini dengan AI</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-7xl h-[94vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Top Navigation & Control Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Presentation className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full mb-0.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>EXECUTIVE 50-SLIDE PPT STUDIO</span>
              </div>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>Bank Paparan &amp; Analisis Komprehensif (50 Slide)</span>
                <span className="text-amber-400 text-xs font-mono font-bold">({periodScope})</span>
              </h3>
            </div>
          </div>

          {/* Period Scope Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['TW1', 'TW2', 'TW3', 'TW4', 'BULANAN', 'TAHUNAN'] as PeriodScope[]).map(scope => (
              <button
                key={scope}
                onClick={() => setPeriodScope(scope)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  periodScope === scope 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {scope}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSelectedPPTX}
              disabled={isExportingPPT || selectedSlideIds.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-black shadow-lg shadow-amber-950/40 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50 border border-amber-300/40"
              title="Unduh File PowerPoint (.pptx) Sesuai Slide yang Dipilih"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPPT ? 'Menyiapkan PPTX...' : `Unduh PPTX (${selectedSlideIds.length} Slide)`}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              title="Cetak ke PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Topik:</span>
            </span>
            {[
              { key: 'ALL', label: 'Semua (50)' },
              { key: 'PEMBUKA', label: 'Pembuka' },
              { key: 'MAKRO', label: 'Makro' },
              { key: 'INDIKATOR_DETAIL', label: '8 Indikator' },
              { key: 'SATKER_RANKING', label: 'Ranking' },
              { key: 'DIAGNOSA_RISIKO', label: 'Diagnosa & Risiko' },
              { key: 'KEMENTERIAN', label: 'K/L Mitra' },
              { key: 'DIGITALISASI', label: 'Digitalisasi' },
              { key: 'REGULASI_HOT_TOPIC', label: 'Hot Topic' },
              { key: 'REKOMENDASI_AKSI', label: 'Rekomendasi' },
              { key: 'PENUTUP', label: 'Penutup' }
            ].map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategoryFilter(cat.key as SlideCategory)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryFilter === cat.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 text-[11px]">
            <button
              onClick={selectAllSlides}
              className="text-emerald-400 hover:underline font-bold cursor-pointer"
            >
              Pilih Semua (50)
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={deselectAllSlides}
              className="text-rose-400 hover:underline font-bold cursor-pointer"
            >
              Kosongkan
            </button>
          </div>
        </div>

        {/* Main Stage & Thumbnails Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
          
          {/* Left Thumbnails Strip (Scrollable List of 50 Slides) */}
          <div className="hidden md:flex flex-col w-72 bg-slate-900/90 border-r border-slate-800 p-2 overflow-y-auto space-y-1.5 shrink-0">
            <div className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 flex items-center justify-between">
              <span>Pilih Slide Paparan</span>
              <span className="text-amber-400 font-mono font-bold">
                {selectedSlideIds.length} / 50 Terpilih
              </span>
            </div>

            {displayedSlides.map((slide) => {
              const actualIdx = all50Slides.findIndex(s => s.id === slide.id);
              const isCurrent = currentSlideIndex === actualIdx;
              const isChecked = selectedSlideIds.includes(slide.id);

              return (
                <div
                  key={slide.id}
                  className={`w-full p-2 rounded-xl border transition-all flex items-center gap-2 ${
                    isCurrent 
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-md scale-102' 
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/80'
                  }`}
                >
                  <button
                    onClick={() => toggleSlideSelection(slide.id)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    title={isChecked ? 'Batalkan pilihan' : 'Pilih slide ini untuk diunduh'}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </button>

                  <button
                    onClick={() => setCurrentSlideIndex(actualIdx)}
                    className="flex-1 text-left flex items-center gap-2 truncate cursor-pointer"
                  >
                    <span className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                      isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {slide.id}
                    </span>
                    <div className="truncate">
                      <span className={`text-[11px] block truncate ${isCurrent ? 'font-black text-white' : 'font-medium text-slate-300'}`}>
                        {slide.title}
                      </span>
                      <span className="text-[9px] text-slate-500 block truncate">
                        {slide.badge}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Center Presentation Stage */}
          <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-5 overflow-hidden relative">
            <div className="w-full max-w-4xl aspect-[16/9] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative flex flex-col justify-between">
              {renderSlideStage(currentSlide)}
            </div>
          </div>
        </div>

        {/* Bottom Navigator Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Slide {currentSlide.id} dari 50:</span>
            <span className="text-slate-300 font-medium truncate max-w-xs">{currentSlide.title}</span>
            <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-mono">
              {currentSlide.badge}
            </span>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
              disabled={currentSlideIndex === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <button
              onClick={() => setCurrentSlideIndex(prev => Math.min(all50Slides.length - 1, prev + 1))}
              disabled={currentSlideIndex === all50Slides.length - 1}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
