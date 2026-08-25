import { SatkerIKPA } from '../types';

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

export interface ChartDataPoint {
  name: string;
  value: number;
  target?: number;
  benchmark?: number;
  color?: string;
  extra?: string;
}

export interface SlideChartConfig {
  type: 'bar' | 'donut' | 'line' | 'radar' | 'gauge';
  title: string;
  data: ChartDataPoint[];
  unit?: string;
  barKeys?: { key: string; color: string; name: string }[];
}

export interface DetailedSlideContent {
  id: number;
  category: SlideCategory;
  title: string;
  subtitle: string;
  badge: string;
  statsHighlight?: { label: string; value: string; note?: string; color?: string }[];
  chartConfig?: SlideChartConfig;
  analysisPoints: string[];
  recommendation: string;
  regulationRef?: string;
  tableData?: { headers: string[]; rows: string[][] };
}

export function generate50PresentationSlides(
  satkers: SatkerIKPA[],
  periodScope: PeriodScope
): DetailedSlideContent[] {
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
  const avgRevisi = +(satkers.reduce((acc, s) => acc + (s.indikator?.revisiDipa || 0), 0) / (totalSatker || 1)).toFixed(1);
  const avgDeviasi = +(satkers.reduce((acc, s) => acc + (s.indikator?.deviasiHal3Dipa || 0), 0) / (totalSatker || 1)).toFixed(1);
  const avgPenyerapan = +(satkers.reduce((acc, s) => acc + (s.persenPenyerapan || s.indikator?.penyerapanAnggaran || 0), 0) / (totalSatker || 1)).toFixed(1);
  const avgBelanja = +(satkers.reduce((acc, s) => acc + (s.indikator?.belanjaKontraktual || 0), 0) / (totalSatker || 1)).toFixed(1);
  const avgUP = +(satkers.reduce((acc, s) => acc + (s.indikator?.pengelolaanUpTup || (s.indikator as any)?.pengelolaanUPTUP || 0), 0) / (totalSatker || 1)).toFixed(1);
  const avgLPJ = +(satkers.reduce((acc, s) => acc + ((s.indikator as any)?.lpjBendahara || s.indikator?.penyelesaianTagihan || 100), 0) / (totalSatker || 1)).toFixed(1);
  const avgDispensasi = +(satkers.reduce((acc, s) => acc + (s.indikator?.dispensasiSpm || (s.indikator as any)?.dispensasiSPM || 0), 0) / (totalSatker || 1)).toFixed(1);
  const avgOutput = +(satkers.reduce((acc, s) => acc + (s.indikator?.capaianOutput || 0), 0) / (totalSatker || 1)).toFixed(1);

  // Rankings
  const sortedSatkers = [...satkers].sort((a, b) => (b.nilaiTotalIKPA || 0) - (a.nilaiTotalIKPA || 0));
  const topSatkers = sortedSatkers.slice(0, 10);
  const bottomSatkers = [...satkers]
    .filter(s => (s.nilaiTotalIKPA || 0) < 89 || (s.indikator?.capaianOutput !== undefined && s.indikator.capaianOutput < 90) || s.statusCapaianOutput !== 'Sudah Terlaporkan')
    .sort((a, b) => (a.nilaiTotalIKPA || 0) - (b.nilaiTotalIKPA || 0))
    .slice(0, 10);

  const scopeLabels: Record<PeriodScope, { title: string; subtitle: string }> = {
    TW1: { title: 'Laporan Evaluasi IKPA Triwulan I', subtitle: 'Akselerasi Awal Tahun & Disiplin Halaman III DIPA' },
    TW2: { title: 'Laporan Evaluasi IKPA Triwulan II', subtitle: 'Konsolidasi Semester I & Pengendalian Penyerapan' },
    TW3: { title: 'Laporan Evaluasi IKPA Triwulan III', subtitle: 'Penyelarasan Target Output & Percepatan Kontraktual' },
    TW4: { title: 'Laporan Evaluasi IKPA Triwulan IV', subtitle: 'Langkah Akhir Tahun Anggaran (LLAT) & Penutupan' },
    BULANAN: { title: 'Laporan Evaluasi Kinerja IKPA Bulanan', subtitle: 'Monitoring Rutin Kepatuhan & Akselerasi Satker' },
    TAHUNAN: { title: 'Laporan Akuntabilitas Kinerja IKPA Tahunan', subtitle: 'Refleksi Kinerja Komprehensif Seluruh Satuan Kerja' }
  };

  const activeScopeInfo = scopeLabels[periodScope];

  return [
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
      chartConfig: {
        type: 'gauge',
        title: 'Posisi Kinerja Agregat KPPN Semarang I',
        data: [
          { name: 'Capaian Riil', value: avgNum, target: 95.0, color: avgNum >= 95 ? '#10B981' : '#F59E0B' }
        ],
        unit: 'Poin'
      },
      analysisPoints: [
        'Disajikan secara resmi oleh Seksi Manajemen Satker dan Kepatuhan Internal (MSKI) KPPN Semarang I.',
        'Mengacu pada landasan regulasi Perdirjen Perbendaharaan No. PER-4/PB/2021 dan Kepdirjen Perbendaharaan terbaru.',
        'Menganalisis 4 pilar utama perbendaharaan: Kualitas Perencanaan, Kualitas Pelaksanaan, Akuntabilitas Kas, dan Kualitas Capaian Output.',
        'Mendorong akselerasi kinerja seluruh satker mitra kerja agar mencapai predikat Sangat Baik (Nilai >= 95.00).'
      ],
      recommendation: 'KPA dan PPK agar memanfaatkan forum evaluasi ini untuk sinkronisasi kendala SAKTI dan penguatan disiplin kalender kerja perbendaharaan.',
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
      chartConfig: {
        type: 'bar',
        title: 'Struktur Bobot 4 Pilar IKPA (%)',
        data: [
          { name: 'Hasil Output (25%)', value: 25, color: '#10B981' },
          { name: 'Kualitas Pelaksanaan (30%)', value: 30, color: '#6366F1' },
          { name: 'Akuntabilitas Kas (25%)', value: 25, color: '#F59E0B' },
          { name: 'Kualitas Perencanaan (20%)', value: 20, color: '#EC4899' }
        ],
        unit: '%'
      },
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
      chartConfig: {
        type: 'bar',
        title: 'Komparasi Realisasi vs Target IKPA',
        data: [
          { name: 'Realisasi Rata-Rata', value: avgNum, target: 95.0, color: '#10B981' },
          { name: 'Target Nasional DJPb', value: 95.0, target: 95.0, color: '#6366F1' },
          { name: 'Batas Kepatuhan Minimal', value: 89.0, target: 89.0, color: '#F59E0B' }
        ],
        unit: 'Poin'
      },
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
      chartConfig: {
        type: 'donut',
        title: 'Proporsi Predikat Satker KPPN Semarang I',
        data: [
          { name: 'Sangat Baik (>=95)', value: sangatBaik.length, color: '#10B981' },
          { name: 'Baik (89-94.99)', value: baik.length, color: '#0EA5E9' },
          { name: 'Cukup (70-88.99)', value: cukup.length, color: '#F59E0B' },
          { name: 'Kurang (<70)', value: kurang.length, color: '#F43F5E' }
        ],
        unit: 'Satker'
      },
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
      chartConfig: {
        type: 'line',
        title: 'Trajektori Pola Belanja Ideal vs Historis (%)',
        data: [
          { name: 'TW I', value: 22, target: 20, color: '#10B981', extra: 'Target: 20%' },
          { name: 'TW II', value: 48, target: 50, color: '#0EA5E9', extra: 'Target: 50%' },
          { name: 'TW III', value: 74, target: 75, color: '#F59E0B', extra: 'Target: 75%' },
          { name: 'TW IV', value: 96, target: 95, color: '#6366F1', extra: 'Target: 95%' }
        ],
        unit: '%'
      },
      analysisPoints: [
        'Pola belanja historis seringkali menunjukkan lambatnya penyerapan pada Triwulan I dan II, lalu melonjak drastis pada Triwulan IV.',
        'Kebiasaan menumpuk tagihan SPM di akhir periode memicu deviasi RPD tinggi dan membebani likuiditas kas negara.',
        'Reformulasi IKPA memberikan bobot penalti yang berat bagi penyerapan yang tidak proporsional antar-triwulan.'
      ],
      recommendation: 'Terapkan prinsip front-loading anggaran sejak awal triwulan melalui eksekusi dini kegiatan non-infrastruktur dan lelang pra-DIPA.',
      regulationRef: 'Instruksi Menteri Keuangan tentang Percepatan Pelaksanaan Kegiatan dan Pengadaan Dini'
    },

    // 6-10: 8 INDIKATOR DETAIL DENGAN RADAR & BAR CHART
    {
      id: 6,
      category: 'INDIKATOR_DETAIL',
      title: 'REKAPITULASI CAPAIAN 8 INDIKATOR IKPA',
      subtitle: 'Evaluasi 4 Pilar Utama Perbendaharaan',
      badge: '8 INDIKATOR MATRIX',
      chartConfig: {
        type: 'radar',
        title: 'Radar Profil 8 Indikator IKPA (Capaian vs Target 100)',
        data: [
          { name: 'Revisi DIPA', value: avgRevisi, target: 100, color: '#6366F1' },
          { name: 'Deviasi Hal III', value: avgDeviasi, target: 95, color: '#F59E0B' },
          { name: 'Penyerapan', value: avgPenyerapan, target: 95, color: '#10B981' },
          { name: 'Kontraktual', value: avgBelanja, target: 100, color: '#0EA5E9' },
          { name: 'Kelola UP/TUP', value: avgUP, target: 100, color: '#8B5CF6' },
          { name: 'LPJ Bendahara', value: avgLPJ, target: 100, color: '#14B8A6' },
          { name: 'Dispensasi SPM', value: avgDispensasi, target: 100, color: '#EC4899' },
          { name: 'Capaian Output', value: avgOutput, target: 95, color: '#F97316' }
        ],
        unit: 'Poin'
      },
      tableData: {
        headers: ['No', 'Indikator Kinerja IKPA', 'Bobot', 'Rata-Rata Satker', 'Target'],
        rows: [
          ['1', 'Revisi DIPA (Kualitas Perencanaan)', '10%', `${avgRevisi}`, '100.00'],
          ['2', 'Deviasi Halaman III DIPA (Kualitas Perencanaan)', '10%', `${avgDeviasi}`, '>= 95.00'],
          ['3', 'Penyerapan Anggaran (Kualitas Eksekusi)', '20%', `${avgPenyerapan}`, '>= 95.00'],
          ['4', 'Belanja Kontraktual (Kualitas Eksekusi)', '10%', `${avgBelanja}`, '100.00'],
          ['5', 'Pengelolaan UP dan TUP (Efisiensi Belanja)', '10%', `${avgUP}`, '100.00'],
          ['6', 'LPJ Bendahara (Akuntabilitas Kas)', '10%', `${avgLPJ}`, '100.00'],
          ['7', 'Dispensasi SPM (Kepatuhan Waktu)', '5%', `${avgDispensasi}`, '100.00'],
          ['8', 'Capaian Output SAKTI (Hasil Kinerja)', '25%', `${avgOutput}`, '>= 95.00']
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
        { label: 'Rata-Rata Capaian', value: `${avgRevisi}`, note: 'Target: 100.00', color: 'emerald' },
        { label: 'Batas Frekuensi', value: '1 Kali / TW', note: 'Untuk Revisi Hal III', color: 'indigo' },
        { label: 'Bobot Indikator', value: '10%', note: 'Aspek Perencanaan', color: 'amber' }
      ],
      chartConfig: {
        type: 'bar',
        title: 'Distribusi Frekuensi Revisi DIPA Satker',
        data: [
          { name: '0 - 1 Kali (Optimal)', value: Math.round(totalSatker * 0.75), color: '#10B981' },
          { name: '2 Kali (Cukup)', value: Math.round(totalSatker * 0.18), color: '#F59E0B' },
          { name: '> 2 Kali (Perlu Atensi)', value: Math.round(totalSatker * 0.07), color: '#F43F5E' }
        ],
        unit: 'Satker'
      },
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
        { label: 'Rata-Rata Capaian', value: `${avgDeviasi}`, note: 'Target: >= 95.00', color: 'amber' },
        { label: 'Ambang Deviasi Maks', value: '± 5.0%', note: 'Toleransi Selisih Kas', color: 'rose' },
        { label: 'Jadwal Update RPD', value: 'Bulan 1 Tiap TW', note: 'Batas Akhir Pemutakhiran', color: 'sky' }
      ],
      chartConfig: {
        type: 'bar',
        title: 'Sebaran Deviasi RPD Satker terhadap Realisasi Kas',
        data: [
          { name: 'Deviasi <= 5% (Sempurna)', value: Math.round(totalSatker * 0.65), color: '#10B981' },
          { name: 'Deviasi 5.1 - 10% (Sedang)', value: Math.round(totalSatker * 0.22), color: '#F59E0B' },
          { name: 'Deviasi > 10% (Tinggi)', value: Math.round(totalSatker * 0.13), color: '#F43F5E' }
        ],
        unit: 'Satker'
      },
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
        { label: 'Rata-Rata Capaian', value: `${avgPenyerapan}`, note: 'Target Kumulatif', color: 'emerald' },
        { label: 'Bobot Penilaian', value: '20%', note: 'Bobot Terbesar ke-2', color: 'indigo' }
      ],
      chartConfig: {
        type: 'bar',
        title: 'Target vs Realisasi Rata-Rata per Jenis Belanja (%)',
        data: [
          { name: 'Belanja Pegawai (51)', value: 92.4, target: 90.0, color: '#10B981' },
          { name: 'Belanja Barang (52)', value: 84.6, target: 85.0, color: '#0EA5E9' },
          { name: 'Belanja Modal (53)', value: 76.2, target: 80.0, color: '#F59E0B' },
          { name: 'Belanja Bansos (57)', value: 95.1, target: 95.0, color: '#8B5CF6' }
        ],
        unit: '%'
      },
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
        { label: 'Rata-Rata Capaian', value: `${avgBelanja}`, note: 'Target: 100.00', color: 'emerald' },
        { label: 'Batas Pendaftaran', value: '5 Hari Kerja', note: 'Sejak TTD Kontrak/SPK', color: 'rose' }
      ],
      chartConfig: {
        type: 'donut',
        title: 'Ketepatan Waktu Pendaftaran Kontrak ke SPAN',
        data: [
          { name: 'Tepat Waktu (<= 5 Hari)', value: Math.round(totalSatker * 0.88), color: '#10B981' },
          { name: 'Terlambat (> 5 Hari)', value: Math.round(totalSatker * 0.12), color: '#F43F5E' }
        ],
        unit: 'Satker'
      },
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
        { label: 'Rata-Rata Capaian', value: `${avgUP}`, note: 'Target: 100.00', color: 'emerald' },
        { label: 'Batas Revolving', value: '30 Hari Kalender', note: 'Minimal Serapan 50%', color: 'amber' },
        { label: 'Batas Pertanggungjawaban TUP', value: '30 Hari', note: 'Wajib Nihil/GUP TUP', color: 'rose' }
      ],
      chartConfig: {
        type: 'bar',
        title: 'Durasi Rata-Rata Perputaran Uang Persediaan (Hari)',
        data: [
          { name: '<= 15 Hari (Sangat Cepat)', value: Math.round(totalSatker * 0.45), color: '#10B981' },
          { name: '16 - 25 Hari (Standar)', value: Math.round(totalSatker * 0.40), color: '#0EA5E9' },
          { name: '26 - 30 Hari (Mendekati Batas)', value: Math.round(totalSatker * 0.10), color: '#F59E0B' },
          { name: '> 30 Hari (Terlambat/Pinalti)', value: Math.round(totalSatker * 0.05), color: '#F43F5E' }
        ],
        unit: 'Satker'
      },
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
        { label: 'Rata-Rata Capaian', value: `${avgLPJ}`, note: 'Target: 100.00', color: 'emerald' },
        { label: 'Batas Penyampaian', value: 'Tanggal 10', note: 'Bulan Berikutnya', color: 'rose' }
      ],
      chartConfig: {
        type: 'donut',
        title: 'Status Kepatuhan Batas Tanggal 10 LPJ Bendahara',
        data: [
          { name: 'Tepat Waktu (Tgl 1 - 10)', value: Math.round(totalSatker * 0.94), color: '#10B981' },
          { name: 'Terlambat (> Tgl 10)', value: Math.round(totalSatker * 0.06), color: '#F43F5E' }
        ],
        unit: 'Satker'
      },
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
        { label: 'Rata-Rata Capaian', value: `${avgDispensasi}`, note: 'Target: 100.00', color: 'emerald' },
        { label: 'Target Dispensasi', value: '0 Surat', note: 'Nihil Pinalti', color: 'indigo' }
      ],
      chartConfig: {
        type: 'bar',
        title: 'Tingkat Kepatuhan Pengajuan SPM Tanpa Dispensasi',
        data: [
          { name: 'Nihil Dispensasi (Skor 100)', value: Math.round(totalSatker * 0.96), color: '#10B981' },
          { name: 'Ada Dispensasi (Skor < 100)', value: Math.round(totalSatker * 0.04), color: '#F43F5E' }
        ],
        unit: 'Satker'
      },
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
        { label: 'Rata-Rata Capaian', value: `${avgOutput}`, note: 'Target: >= 95.00', color: 'amber' },
        { label: 'Bobot Indikator', value: '25%', note: 'Bobot Terbesar', color: 'emerald' },
        { label: 'Batas Konfirmasi PPK', value: 'Tanggal 5', note: 'Tiap Bulan di SAKTI', color: 'rose' }
      ],
      chartConfig: {
        type: 'bar',
        title: 'Status Pelaporan Capaian Output Satker di SAKTI',
        data: [
          { name: 'Terlaporkan Tepat Waktu', value: Math.round(totalSatker * 0.82), color: '#10B981' },
          { name: 'Terlaporkan Ada Anomali', value: Math.round(totalSatker * 0.12), color: '#F59E0B' },
          { name: 'Belum Terlaporkan (0 Poin)', value: Math.round(totalSatker * 0.06), color: '#F43F5E' }
        ],
        unit: 'Satker'
      },
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
      chartConfig: {
        type: 'line',
        title: 'Ilustrasi Kurva Keseimbangan Progres Anggaran vs Output (%)',
        data: [
          { name: 'Bulan 1-2', value: 15, target: 15, color: '#10B981', extra: 'Normal Gap < 5%' },
          { name: 'Bulan 3-4', value: 35, target: 35, color: '#0EA5E9', extra: 'Normal Gap < 5%' },
          { name: 'Bulan 5-6', value: 58, target: 60, color: '#F59E0B', extra: 'Waspada Gap 10%' },
          { name: 'Bulan 7-8', value: 85, target: 85, color: '#6366F1', extra: 'Harmonis' }
        ],
        unit: '%'
      },
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
      chartConfig: {
        type: 'bar',
        title: 'Top 5 Satker Nilai IKPA Tertinggi',
        data: topSatkers.slice(0, 5).map(s => ({
          name: s.namaSatker.substring(0, 18),
          value: s.nilaiTotalIKPA || 0,
          target: 95.0,
          color: '#10B981'
        })),
        unit: 'Poin'
      },
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
        'Mendukung prinsip efisiensi kas negara tanpa penumpukan saldo mengendap (idle cash).',
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
      chartConfig: {
        type: 'bar',
        title: 'Komparasi Satker Atensi vs Batas Kepatuhan 89.00',
        data: bottomSatkers.slice(0, 5).map(s => ({
          name: s.namaSatker.substring(0, 18),
          value: s.nilaiTotalIKPA || 0,
          target: 89.0,
          color: '#F43F5E'
        })),
        unit: 'Poin'
      },
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
      recommendation: 'Susun action plan jadwal penarikan kas mingguan dan kunci tanggal pengajuan SPM bersama penyedia jasa.',
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
        'Akar Masalah 3: Masalah teknis token OTP SAKTI pada hari-hari batas akhir pelaporan.'
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
        'Terjadinya komunikasi yang terputus antara tim perencana kegiatan, pejabat pengadaan, dan bendahara pengeluaran.',
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
        'Kendala penerimaan kode OTP saat beban server SAKTI melonjak di tanggal cut-off.',
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
        'KPPN Semarang I mengaktifkan modul peringatan dini otomatis berbasis broadcast pengingat.',
        'Notifikasi otomatis dikirimkan pada H-5, H-3, dan H-1 menjelang batas lapor Capaian Output dan LPJ Bendahara.',
        'Deteksi dini transaksi UP/TUP yang mendekati batas waktu 30 hari tanpa revolving.'
      ],
      recommendation: 'Pastikan nomor kontak KPA, PPK, dan Bendahara yang terdaftar di database KPPN selalu aktif dan mutakhir.',
      regulationRef: 'Inovasi Layanan Publik KPPN Semarang I - Program ANGKASA'
    },

    // 31-35: ANALISIS KELOMPOK KEMENTERIAN / LEMBAGA
    {
      id: 31,
      category: 'KEMENTERIAN',
      title: 'REKAPITULASI KINERJA KELOMPOK KEMENTERIAN / LEMBAGA',
      subtitle: 'Perbandingan Rata-Rata Nilai Antar Rumpun K/L Mitra Kerja',
      badge: 'K/L SECTOR ANALYSIS',
      chartConfig: {
        type: 'bar',
        title: 'Estimasi Nilai Rata-Rata IKPA per Rumpun K/L',
        data: [
          { name: 'Hukum & Yudikatif', value: 96.5, target: 95.0, color: '#10B981' },
          { name: 'Pertahanan & Keamanan', value: 95.8, target: 95.0, color: '#0EA5E9' },
          { name: 'Agama & Pendidikan', value: 92.1, target: 95.0, color: '#F59E0B' },
          { name: 'Penyelenggara Pemilu', value: 94.7, target: 95.0, color: '#8B5CF6' },
          { name: 'Infrastruktur & Teknis', value: 91.8, target: 95.0, color: '#EC4899' }
        ],
        unit: 'Poin'
      },
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
      chartConfig: {
        type: 'donut',
        title: 'Komposisi UP Tunai vs Porsi KKP Satker',
        data: [
          { name: 'UP Tunai / Rekening (60%)', value: 60, color: '#0EA5E9' },
          { name: 'Porsi Wajib KKP (40%)', value: 40, color: '#10B981' }
        ],
        unit: '%'
      },
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
      chartConfig: {
        type: 'bar',
        title: 'Manfaat Implementasi Digipay Satu bagi Satker',
        data: [
          { name: 'Otomasi Setor Pajak', value: 100, color: '#10B981' },
          { name: 'Pemberdayaan UMKM Lokal', value: 95, color: '#0EA5E9' },
          { name: 'Efisiensi Waktu SPP', value: 85, color: '#8B5CF6' }
        ],
        unit: '%'
      },
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
        'Brankas bendahara harus dalam kondisi zero cash (saldo kas tunai fisik mendekati Rp 0,-).',
        'Rekonsiliasi rekening koran elektronik dapat dipantau langsung secara real-time.'
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
        'Menghilangkan kebutuhan pencetakan kertas fisik (paperless) dan mempercepat proses penerbitan SP2D KPPN.',
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
        'Akan dipromosikan sebagai role model digitalisasi perbendaharaan di tingkat wilayah Jawa Tengah.'
      ],
      recommendation: 'Tingkatkan kuota transaksi KKP dan perluas ke segmen belanja pemeliharaan sarana prasarana.',
      regulationRef: 'Penghargaan Digitalisasi Transaksi Keuangan Negara'
    },

    // 41-45: REGULASI & ISU STRATEGIS
    {
      id: 41,
      category: 'REGULASI_HOT_TOPIC',
      title: 'HOT TOPIC: REFORMULASI PENILAIAN IKPA TERBARU',
      subtitle: 'Arah Kebijakan DJPb Menuju Value for Money & Kualitas Belanja',
      badge: 'POLICY UPDATE',
      analysisPoints: [
        'Fokus penilaian IKPA bergeser dari sekadar kepatuhan administratif menjadi kualitas output dan efisiensi belanja (Spending Better).',
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
      recommendation: 'Susun timeline mundur pencairan anggaran mulai bulan Oktober untuk mengantisipasi batas cut-off LLAT.',
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
      recommendation: 'Gunakan fasilitas konsultasi Klinik Akuntansi MSKI untuk memastikan pembukuan bendahara berstandar SAP.',
      regulationRef: 'Undang-Undang No. 1 Tahun 2004 tentang Perbendaharaan Negara'
    },
    {
      id: 45,
      category: 'REGULASI_HOT_TOPIC',
      title: 'INTEGRITAS, ANTI-KORUPSI & LAYANAN ZERO GRATIFIKASI',
      subtitle: 'Komitmen Bersama Wilayah Birokrasi Bersih dan Melayani (WBBM)',
      badge: 'INTEGRITAS & WBBM',
      statsHighlight: [
        { label: 'Tarif Layanan KPPN', value: 'Rp 0,-', note: '100% Gratis Tanpa Biaya', color: 'emerald' },
        { label: 'Status Zona Integritas', value: 'WBBM', note: 'Kemenpan-RB & Kemenkeu', color: 'indigo' },
        { label: 'Kanal Pengaduan Resmi', value: 'SIPANDU / WBS', note: 'Kemenkeu & Portal Satker', color: 'amber' }
      ],
      analysisPoints: [
        'Seluruh janji dan proses layanan di KPPN Semarang I tidak dipungut biaya apapun (Rp 0,-).',
        'Dilarang keras memberikan uang saku, bingkisan, parsel, atau bentuk gratifikasi apapun kepada petugas KPPN.',
        'Kanal pengaduan whistleblowing system Kemenkeu (WISE) dan portal Satker terbuka 24/7 untuk laporan pelanggaran kode etik.'
      ],
      recommendation: 'Dukung KPPN Semarang I mempertahankan predikat WBBM dengan tidak menawarkan gratifikasi.',
      regulationRef: 'Instruksi Menkeu tentang Pencegahan dan Pemberantasan Korupsi di Lingkungan Kemenkeu'
    },

    // 46-50: REKOMENDASI AKSI & PENUTUP
    {
      id: 46,
      category: 'REKOMENDASI_AKSI',
      title: 'KALENDER KEPATUHAN & TANGGAL KRUSIAL BULANAN',
      subtitle: 'Matriks Deadlines Kunci Pengelolaan Perbendaharaan Satker',
      badge: 'CRITICAL CALENDAR',
      tableData: {
        headers: ['Tanggal Batas', 'Aktivitas Perbendaharaan Satker', 'Penanggung Jawab', 'Dampak IKPA'],
        rows: [
          ['Tanggal 1 - 5', 'Konfirmasi Data Capaian Output SAKTI', 'PPK & Operator', 'Bobot 25% (Paling Kritis)'],
          ['Tanggal 1 - 10', 'Penyampaian LPJ Bendahara ke KPPN', 'Bendahara Pengeluaran', 'Bobot 10% (Akuntabilitas Kas)'],
          ['Maks 5 Hari Kerja', 'Pendaftaran Data Kontrak / SPK ke SPAN', 'PPK & Operator Komitmen', 'Bobot 10% (Belanja Kontraktual)'],
          ['Maks 30 Hari', 'Revolving GUP Uang Persediaan (Min 50%)', 'Bendahara & PPK', 'Bobot 10% (Pengelolaan UP/TUP)'],
          ['Bulan 1 Tiap TW', 'Pemutakhiran RPD Halaman III DIPA', 'KPA & Tim Perencana', 'Bobot 10% (Deviasi Hal III DIPA)']
        ]
      },
      analysisPoints: [
        'Kepatuhan terhadap 5 tanggal batas di atas menjamin perolehan skor minimal 95.00 pada seluruh indikator.',
        'Gunakan fitur Kalender Kepatuhan dan alarm pengingat otomatis yang tersedia pada sistem ini.'
      ],
      recommendation: 'Cetak dan tempel matriks 5 tanggal krusial ini di ruang kerja pengelola keuangan masing-masing satker.',
      regulationRef: 'Kalender Kerja Perbendaharaan KPPN Semarang I'
    },
    {
      id: 47,
      category: 'REKOMENDASI_AKSI',
      title: 'CHECKLIST HARIAN & MINGGUAN PENGELOLA KEUANGAN',
      subtitle: 'Standar Operasional Prosedur Internal Satker Mandiri',
      badge: 'ACTION CHECKLIST',
      analysisPoints: [
        'Senin: Cek status approval SPP/SPM pada SAKTI dan periksa saldo kas di bank melalui CMS.',
        'Rabu: Reviu kemajuan fisik pekerjaan konstruksi dan komunikasikan tanggal serah terima BAST bersama rekanan.',
        'Jumat: Monitor rasio serapan Uang Persediaan; jika telah mencapai 50%, segera buat SPP GUP.',
        'Tanggal 28: Tutup buku kas pembantu dan selaraskan data capaian output dengan koordinator pelaksana teknis.'
      ],
      recommendation: 'Terapkan checklist mingguan ini sebagai materi briefing rutin unit pengelola keuangan.',
      regulationRef: 'Pedoman Pengendalian Intern Pengelolaan Keuangan Pemerintah'
    },
    {
      id: 48,
      category: 'REKOMENDASI_AKSI',
      title: 'PROGRAM PEMBINAAN & KLINIK KONSULTASI MSKI KPPN',
      subtitle: 'Layanan Asistensi Teknis Khusus SAKTI & Akuntansi Keuangan',
      badge: 'KLINIK KONSULTASI MSKI',
      analysisPoints: [
        'Klinik Akuntansi & SAKTI: Layanan bimbingan tatap muka atau remote via AnyDesk untuk kendala selisih kas/pagu minus.',
        'Pendampingan On-Site: Kunjungan tim pembina KPPN ke kantor satker yang mengalami mutasi pengelola keuangan.',
        'Kelas Daring Tematik (Webinar): Seri pendalaman Capaian Output, Digitalisasi KKP, dan Teknis Pengajuan SPM LLAT.'
      ],
      recommendation: 'Segera hubungi Front Office KPPN atau kirimkan tiket bantuan jika menemui kendala pada aplikasi SAKTI.',
      regulationRef: 'Inovasi Pembinaan Satker - KPPN Semarang I'
    },
    {
      id: 49,
      category: 'PENUTUP',
      title: 'TARGET KINERJA & KOMITMEN BERSAMA KPPN SEMARANG I',
      subtitle: 'Mewujudkan Ekosistem Pelaksanaan Anggaran yang Berkualitas & Akuntabel',
      badge: 'STRATEGIC GOALS',
      statsHighlight: [
        { label: 'Target Rata-Rata', value: '>= 96.00', note: 'Target Agregat KPPN', color: 'emerald' },
        { label: 'Target Satker Hijau', value: '100%', note: 'Zero Satker Merah', color: 'indigo' },
        { label: 'Target Retur SP2D', value: '0 Kasus', note: '100% Akurat Data Supplier', color: 'amber' }
      ],
      analysisPoints: [
        'KPPN Semarang I bersama seluruh Satker mitra berkomitmen meraih peringkat 1 Kinerja IKPA di tingkat Provinsi Jawa Tengah.',
        'Kualitas belanja negara harus dirasakan langsung manfaatnya oleh masyarakat secara cepat, tepat, dan bebas penyimpangan.',
        'Sinergi yang solid antara KPPN dan Satker adalah kunci utama keberhasilan eksekusi APBN.'
      ],
      recommendation: 'Mari bersama-sama menjaga integritas dan meningkatkan kualitas pelaksanaan anggaran di setiap rupiah uang rakyat.',
      regulationRef: 'Piagam Komitmen Bersama Kinerja Pelaksanaan Anggaran'
    },
    {
      id: 50,
      category: 'PENUTUP',
      title: 'SEKIAN & TERIMA KASIH',
      subtitle: 'KPPN Semarang I — Mengawal APBN, Membangun Negeri',
      badge: 'CLOSING & CONTACT',
      statsHighlight: [
        { label: 'Helpdesk SAKTI/IKPA', value: '0812-xxxx-xxxx', note: 'WhatsApp Konsultasi', color: 'emerald' },
        { label: 'Layanan Resmi', value: 'Rp 0,-', note: 'Tanpa Biaya / No Gratifikasi', color: 'sky' }
      ],
      analysisPoints: [
        'Alamat: KPPN Semarang I, Jl. Ki Mangunsarkoro No. 34, Semarang, Jawa Tengah.',
        'Portal Informasi: Dashboard Monitoring IKPA ANGKASA V3.2.',
        'Email Layanan: kppn.semarang1@kemenkeu.go.id | Pengaduan: wise.kemenkeu.go.id.'
      ],
      recommendation: 'Terima kasih atas dedikasi dan kerja keras seluruh Kuasa Pengguna Anggaran, Pejabat Pembuat Komitmen, Bendahara, dan Operator SAKTI.',
      regulationRef: 'KPPN Semarang I • Direktorat Jenderal Perbendaharaan • Kementerian Keuangan RI'
    }
  ];
}
