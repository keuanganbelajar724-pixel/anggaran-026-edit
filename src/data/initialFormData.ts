import { KppnForm, FormResponseRecord } from '../types/form';

export const INITIAL_OFFICIAL_FORMS: KppnForm[] = [
  {
    id: 'form_survei_kepuasan_2026',
    title: 'Survei Kepuasan Layanan & Persepsi Korupsi KPPN Semarang I 2026',
    description: 'Survei evaluasi berkala untuk mengukur indeks kepuasan mitra kerja Satker terhadap layanan perbendaharaan, penerbitan SP2D, bimbingan CSO & IKPA, serta komitmen Wilayah Birokrasi Bersih dan Melayani (WBBM).',
    category: 'SURVEI_LAYANAN',
    targetAudience: 'satker',
    isActive: true,
    isPublicStatsVisible: true,
    allowMultipleSubmissions: false,
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
    fields: [
      {
        id: 'f_rating_cso',
        type: 'RATING',
        label: 'Tingkat Keramahan & Kecepatan Layanan Petugas Front Office / CSO',
        description: 'Beri penilaian 1 (Kurang) hingga 5 (Sangat Memuaskan)',
        required: true,
        minRating: 1,
        maxRating: 5,
        minRatingLabel: '1 (Kurang)',
        maxRatingLabel: '5 (Sangat Puas)'
      },
      {
        id: 'f_rating_spm',
        type: 'RATING',
        label: 'Ketepatan Waktu Penerbitan SP2D atas SPM yang Diajukan Satker',
        description: 'Sesuai norma waktu layanan SOP penerbitan SP2D 1 jam kerja',
        required: true,
        minRating: 1,
        maxRating: 5,
        minRatingLabel: '1 (Terlambat)',
        maxRatingLabel: '5 (Sangat Tepat Waktu)'
      },
      {
        id: 'f_rating_konsultasi_ikpa',
        type: 'RATING',
        label: 'Kejelasan Bimbingan Konsultasi Teknis IKPA, SAKTI & Deviasi Hal III',
        description: 'Efektivitas solusi bimbingan teknis perbendaharaan yang diberikan para pembina satker',
        required: true,
        minRating: 1,
        maxRating: 5,
        minRatingLabel: '1 (Kurang Jelas)',
        maxRatingLabel: '5 (Sangat Jelas & Solutif)'
      },
      {
        id: 'f_integritas_gratifikasi',
        type: 'YES_NO',
        label: 'Apakah Anda pernah diminta atau menemukan adanya praktik pungli / gratifikasi oleh pegawai KPPN?',
        description: 'Komitmen transparansi Zona Integritas WBK / WBBM KPPN Semarang I',
        required: true
      },
      {
        id: 'f_kanal_konsultasi_favorit',
        type: 'MULTIPLE_CHOICE',
        label: 'Saluran Konsultasi yang Paling Efektif & Sering Digunakan oleh Satker Anda',
        required: true,
        options: [
          { id: 'opt_wa', label: 'WhatsApp Helpdesk / Jarkom Masif KPPN' },
          { id: 'opt_tatap_muka', label: 'Tatap Muka di CSO KPPN Semarang I' },
          { id: 'opt_zoom', label: 'Bimtek Online / Zoom Meeting' },
          { id: 'opt_portal', label: 'Portal Web Monitoring ANGKASA' },
          { id: 'opt_haicso', label: 'Tiket Resmi HAI CSO Kemenkeu' }
        ]
      },
      {
        id: 'f_saran_perbaikan',
        type: 'PARAGRAPH',
        label: 'Kritik, Saran & Usulan Inovasi untuk Peningkatan Kualitas Layanan KPPN',
        placeholder: 'Tuliskan masukan konstruktif Anda untuk kemajuan KPPN Semarang I...',
        required: false
      }
    ]
  },
  {
    id: 'form_evaluasi_bimtek_sakti',
    title: 'Evaluasi & Kebutuhan Bimbingan Teknis SAKTI & Akselerasi IKPA',
    description: 'Kuesioner penyerapan aspirasi Satker mengenai topik bimbingan teknis yang paling mendesak dibutuhkan serta preferensi metode pembelajaran interaktif.',
    category: 'PENDAFTARAN_BIMTEK',
    targetAudience: 'satker',
    isActive: true,
    isPublicStatsVisible: true,
    allowMultipleSubmissions: true,
    createdAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-02-01T08:00:00.000Z',
    fields: [
      {
        id: 'f_peran_peserta',
        type: 'DROPDOWN',
        label: 'Peran Pejabat Perbendaharaan Satker',
        required: true,
        options: [
          { id: 'opt_kpa', label: 'Kuasa Pengguna Anggaran (KPA)' },
          { id: 'opt_ppk', label: 'Pejabat Pembuat Komitmen (PPK)' },
          { id: 'opt_ppspm', label: 'Pejabat Penandatangan SPM (PPSPM)' },
          { id: 'opt_bendahara', label: 'Bendahara Pengeluaran / Penerimaan' },
          { id: 'opt_operator', label: 'Operator SAKTI (Komitmen/Pembayaran/Pelaporan)' }
        ]
      },
      {
        id: 'f_topik_prioritas',
        type: 'MULTIPLE_CHOICE',
        label: 'Topik Bimtek yang Paling Diperlukan Satker Saat Ini',
        required: true,
        options: [
          { id: 'topik_deviasi', label: 'Akurasi Deviasi Halaman III DIPA & RPD Bulanan' },
          { id: 'topik_caput', label: 'Penginputan Capaian Output & Validasi Anomali Data' },
          { id: 'topik_up_kkp', label: 'Optimalisasi KKP, Digipay & Revolving UP/TUP' },
          { id: 'topik_lpj', label: 'Rekonsiliasi LPJ Bendahara & Kepatuhan Saldo Kas' },
          { id: 'topik_kontraktual', label: 'Pendaftaran Kontrak & Ketepatan SPM LS Kontraktual' }
        ]
      },
      {
        id: 'f_rating_manfaat',
        type: 'RATING',
        label: 'Kemanfaatan Aplikasi Dashboard ANGKASA dalam Membantu Tugas Satker',
        description: 'Beri nilai 1 (Kurang Bermanfaat) hingga 5 (Sangat Bermanfaat)',
        required: true,
        minRating: 1,
        maxRating: 5,
        minRatingLabel: '1 (Kurang)',
        maxRatingLabel: '5 (Sangat Bermanfaat)'
      },
      {
        id: 'f_saran_bimtek',
        type: 'PARAGRAPH',
        label: 'Masukan Terkait Jadwal & Pola Pelaksanaan Bimtek',
        placeholder: 'Contoh: Sebaiknya diadakan sesi bedah kasus praktis per kementerian...',
        required: false
      }
    ]
  }
];

// Rich, authentic sample responses for form_survei_kepuasan_2026 from 24 real KPPN Semarang I Satkers
export const INITIAL_OFFICIAL_RESPONSES: FormResponseRecord[] = [
  {
    id: 'resp_demo_01',
    formId: 'form_survei_kepuasan_2026',
    formTitle: 'Survei Kepuasan Layanan & Persepsi Korupsi KPPN Semarang I 2026',
    respondentName: 'Bambang Irawan, S.E.',
    respondentSatker: 'POLDA JAWA TENGAH',
    respondentSatkerKode: '651046',
    respondentEmail: 'keuangan.polda.jateng@polri.go.id',
    respondentNoHp: '081229871101',
    submittedAt: '2026-02-15T09:12:00.000Z',
    answers: [
      { fieldId: 'f_rating_cso', fieldLabel: 'Tingkat Keramahan & Kecepatan Layanan Petugas Front Office / CSO', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_spm', fieldLabel: 'Ketepatan Waktu Penerbitan SP2D atas SPM yang Diajukan Satker', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_konsultasi_ikpa', fieldLabel: 'Kejelasan Bimbingan Konsultasi Teknis IKPA, SAKTI & Deviasi Hal III', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_integritas_gratifikasi', fieldLabel: 'Apakah Anda pernah diminta atau menemukan adanya praktik pungli / gratifikasi oleh pegawai KPPN?', fieldType: 'YES_NO', value: 'Tidak' },
      { fieldId: 'f_kanal_konsultasi_favorit', fieldLabel: 'Saluran Konsultasi yang Paling Efektif & Sering Digunakan oleh Satker Anda', fieldType: 'MULTIPLE_CHOICE', value: 'WhatsApp Helpdesk / Jarkom Masif KPPN' },
      { fieldId: 'f_saran_perbaikan', fieldLabel: 'Kritik, Saran & Usulan Inovasi untuk Peningkatan Kualitas Layanan KPPN', fieldType: 'PARAGRAPH', value: 'Pelayanan KPPN Semarang I luar biasa cepat dan responsif. Penerbitan SP2D selalu tepat waktu kurang dari 1 jam. Pertahankan!' }
    ]
  },
  {
    id: 'resp_demo_02',
    formId: 'form_survei_kepuasan_2026',
    formTitle: 'Survei Kepuasan Layanan & Persepsi Korupsi KPPN Semarang I 2026',
    respondentName: 'Siti Rahmawati, S.Sos.',
    respondentSatker: 'KANWIL KEMENKUMHAM JAWA TENGAH',
    respondentSatkerKode: '408892',
    respondentEmail: 'keuangan.kemenkumham.jateng@gmail.com',
    respondentNoHp: '081325449920',
    submittedAt: '2026-02-15T10:45:00.000Z',
    answers: [
      { fieldId: 'f_rating_cso', fieldLabel: 'Tingkat Keramahan & Kecepatan Layanan Petugas Front Office / CSO', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_spm', fieldLabel: 'Ketepatan Waktu Penerbitan SP2D atas SPM yang Diajukan Satker', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_konsultasi_ikpa', fieldLabel: 'Kejelasan Bimbingan Konsultasi Teknis IKPA, SAKTI & Deviasi Hal III', fieldType: 'RATING', value: 4 },
      { fieldId: 'f_integritas_gratifikasi', fieldLabel: 'Apakah Anda pernah diminta atau menemukan adanya praktik pungli / gratifikasi oleh pegawai KPPN?', fieldType: 'YES_NO', value: 'Tidak' },
      { fieldId: 'f_kanal_konsultasi_favorit', fieldLabel: 'Saluran Konsultasi yang Paling Efektif & Sering Digunakan oleh Satker Anda', fieldType: 'MULTIPLE_CHOICE', value: 'Portal Web Monitoring ANGKASA' },
      { fieldId: 'f_saran_perbaikan', fieldLabel: 'Kritik, Saran & Usulan Inovasi untuk Peningkatan Kualitas Layanan KPPN', fieldType: 'PARAGRAPH', value: 'Inovasi aplikasi ANGKASA sangat membantu kami dalam memantau deviasi Hal III DIPA secara mandiri sebelum jatuh tempo.' }
    ]
  },
  {
    id: 'resp_demo_03',
    formId: 'form_survei_kepuasan_2026',
    formTitle: 'Survei Kepuasan Layanan & Persepsi Korupsi KPPN Semarang I 2026',
    respondentName: 'Agus Purnomo, M.Si.',
    respondentSatker: 'BPKP PERWAKILAN JAWA TENGAH',
    respondentSatkerKode: '015112',
    respondentEmail: 'bpkp.jateng@bpkp.go.id',
    respondentNoHp: '08112708341',
    submittedAt: '2026-02-16T08:30:00.000Z',
    answers: [
      { fieldId: 'f_rating_cso', fieldLabel: 'Tingkat Keramahan & Kecepatan Layanan Petugas Front Office / CSO', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_spm', fieldLabel: 'Ketepatan Waktu Penerbitan SP2D atas SPM yang Diajukan Satker', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_konsultasi_ikpa', fieldLabel: 'Kejelasan Bimbingan Konsultasi Teknis IKPA, SAKTI & Deviasi Hal III', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_integritas_gratifikasi', fieldLabel: 'Apakah Anda pernah diminta atau menemukan adanya praktik pungli / gratifikasi oleh pegawai KPPN?', fieldType: 'YES_NO', value: 'Tidak' },
      { fieldId: 'f_kanal_konsultasi_favorit', fieldLabel: 'Saluran Konsultasi yang Paling Efektif & Sering Digunakan oleh Satker Anda', fieldType: 'MULTIPLE_CHOICE', value: 'WhatsApp Helpdesk / Jarkom Masif KPPN' },
      { fieldId: 'f_saran_perbaikan', fieldLabel: 'Kritik, Saran & Usulan Inovasi untuk Peningkatan Kualitas Layanan KPPN', fieldType: 'PARAGRAPH', value: 'Integritas seluruh pegawai KPPN Semarang I terbukti bersih tanpa pungli. Sangat layak memperoleh predikat WBBM!' }
    ]
  },
  {
    id: 'resp_demo_04',
    formId: 'form_survei_kepuasan_2026',
    formTitle: 'Survei Kepuasan Layanan & Persepsi Korupsi KPPN Semarang I 2026',
    respondentName: 'Tri Haryanto, S.T.',
    respondentSatker: 'BBWS PEMALI JUANA',
    respondentSatkerKode: '498211',
    respondentEmail: 'satker.bbws.pj@pu.go.id',
    respondentNoHp: '082138902144',
    submittedAt: '2026-02-16T11:10:00.000Z',
    answers: [
      { fieldId: 'f_rating_cso', fieldLabel: 'Tingkat Keramahan & Kecepatan Layanan Petugas Front Office / CSO', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_spm', fieldLabel: 'Ketepatan Waktu Penerbitan SP2D atas SPM yang Diajukan Satker', fieldType: 'RATING', value: 4 },
      { fieldId: 'f_rating_konsultasi_ikpa', fieldLabel: 'Kejelasan Bimbingan Konsultasi Teknis IKPA, SAKTI & Deviasi Hal III', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_integritas_gratifikasi', fieldLabel: 'Apakah Anda pernah diminta atau menemukan adanya praktik pungli / gratifikasi oleh pegawai KPPN?', fieldType: 'YES_NO', value: 'Tidak' },
      { fieldId: 'f_kanal_konsultasi_favorit', fieldLabel: 'Saluran Konsultasi yang Paling Efektif & Sering Digunakan oleh Satker Anda', fieldType: 'MULTIPLE_CHOICE', value: 'Tatap Muka di CSO KPPN Semarang I' },
      { fieldId: 'f_saran_perbaikan', fieldLabel: 'Kritik, Saran & Usulan Inovasi untuk Peningkatan Kualitas Layanan KPPN', fieldType: 'PARAGRAPH', value: 'Petugas CSO selalu ramah ketika kami konsultasi pendaftaran kontrak multiyears. Sangat membantu.' }
    ]
  },
  {
    id: 'resp_demo_05',
    formId: 'form_survei_kepuasan_2026',
    formTitle: 'Survei Kepuasan Layanan & Persepsi Korupsi KPPN Semarang I 2026',
    respondentName: 'Nurul Hidayah, S.H.',
    respondentSatker: 'PENGADILAN TINGGI SEMARANG',
    respondentSatkerKode: '099034',
    respondentEmail: 'keuangan.ptsmg@mahkamahagung.go.id',
    respondentNoHp: '085740112349',
    submittedAt: '2026-02-16T14:20:00.000Z',
    answers: [
      { fieldId: 'f_rating_cso', fieldLabel: 'Tingkat Keramahan & Kecepatan Layanan Petugas Front Office / CSO', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_spm', fieldLabel: 'Ketepatan Waktu Penerbitan SP2D atas SPM yang Diajukan Satker', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_konsultasi_ikpa', fieldLabel: 'Kejelasan Bimbingan Konsultasi Teknis IKPA, SAKTI & Deviasi Hal III', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_integritas_gratifikasi', fieldLabel: 'Apakah Anda pernah diminta atau menemukan adanya praktik pungli / gratifikasi oleh pegawai KPPN?', fieldType: 'YES_NO', value: 'Tidak' },
      { fieldId: 'f_kanal_konsultasi_favorit', fieldLabel: 'Saluran Konsultasi yang Paling Efektif & Sering Digunakan oleh Satker Anda', fieldType: 'MULTIPLE_CHOICE', value: 'WhatsApp Helpdesk / Jarkom Masif KPPN' },
      { fieldId: 'f_saran_perbaikan', fieldLabel: 'Kritik, Saran & Usulan Inovasi untuk Peningkatan Kualitas Layanan KPPN', fieldType: 'PARAGRAPH', value: 'Layanan konsultasi melalui WhatsApp sangat cepat dibalas, solusi yang diberikan sangat taktis.' }
    ]
  },
  {
    id: 'resp_demo_06',
    formId: 'form_survei_kepuasan_2026',
    formTitle: 'Survei Kepuasan Layanan & Persepsi Korupsi KPPN Semarang I 2026',
    respondentName: 'Mayor Laut (S) Joko Widodo',
    respondentSatker: 'LANAL SEMARANG',
    respondentSatkerKode: '345112',
    respondentEmail: 'keuangan.lanal.smg@tni-al.mil.id',
    respondentNoHp: '081228001923',
    submittedAt: '2026-02-17T09:05:00.000Z',
    answers: [
      { fieldId: 'f_rating_cso', fieldLabel: 'Tingkat Keramahan & Kecepatan Layanan Petugas Front Office / CSO', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_spm', fieldLabel: 'Ketepatan Waktu Penerbitan SP2D atas SPM yang Diajukan Satker', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_konsultasi_ikpa', fieldLabel: 'Kejelasan Bimbingan Konsultasi Teknis IKPA, SAKTI & Deviasi Hal III', fieldType: 'RATING', value: 4 },
      { fieldId: 'f_integritas_gratifikasi', fieldLabel: 'Apakah Anda pernah diminta atau menemukan adanya praktik pungli / gratifikasi oleh pegawai KPPN?', fieldType: 'YES_NO', value: 'Tidak' },
      { fieldId: 'f_kanal_konsultasi_favorit', fieldLabel: 'Saluran Konsultasi yang Paling Efektif & Sering Digunakan oleh Satker Anda', fieldType: 'MULTIPLE_CHOICE', value: 'Bimtek Online / Zoom Meeting' },
      { fieldId: 'f_saran_perbaikan', fieldLabel: 'Kritik, Saran & Usulan Inovasi untuk Peningkatan Kualitas Layanan KPPN', fieldType: 'PARAGRAPH', value: 'Mohon bimtek teknis modul komitmen dan pembayaran SAKTI terus dijadwalkan secara daring.' }
    ]
  },
  {
    id: 'resp_demo_07',
    formId: 'form_survei_kepuasan_2026',
    formTitle: 'Survei Kepuasan Layanan & Persepsi Korupsi KPPN Semarang I 2026',
    respondentName: 'Dra. Endang Kusuma, Apt.',
    respondentSatker: 'BALAI BESAR POM DI SEMARANG',
    respondentSatkerKode: '527810',
    respondentEmail: 'keuangan.bbpomsmg@pom.go.id',
    respondentNoHp: '081390118833',
    submittedAt: '2026-02-17T11:40:00.000Z',
    answers: [
      { fieldId: 'f_rating_cso', fieldLabel: 'Tingkat Keramahan & Kecepatan Layanan Petugas Front Office / CSO', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_spm', fieldLabel: 'Ketepatan Waktu Penerbitan SP2D atas SPM yang Diajukan Satker', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_konsultasi_ikpa', fieldLabel: 'Kejelasan Bimbingan Konsultasi Teknis IKPA, SAKTI & Deviasi Hal III', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_integritas_gratifikasi', fieldLabel: 'Apakah Anda pernah diminta atau menemukan adanya praktik pungli / gratifikasi oleh pegawai KPPN?', fieldType: 'YES_NO', value: 'Tidak' },
      { fieldId: 'f_kanal_konsultasi_favorit', fieldLabel: 'Saluran Konsultasi yang Paling Efektif & Sering Digunakan oleh Satker Anda', fieldType: 'MULTIPLE_CHOICE', value: 'WhatsApp Helpdesk / Jarkom Masif KPPN' },
      { fieldId: 'f_saran_perbaikan', fieldLabel: 'Kritik, Saran & Usulan Inovasi untuk Peningkatan Kualitas Layanan KPPN', fieldType: 'PARAGRAPH', value: 'Seluruh petugas sangat profesional. Ruang layanan CSO sangat nyaman dan representatif.' }
    ]
  },
  {
    id: 'resp_demo_08',
    formId: 'form_survei_kepuasan_2026',
    formTitle: 'Survei Kepuasan Layanan & Persepsi Korupsi KPPN Semarang I 2026',
    respondentName: 'Ahmad Fauzi, S.E.',
    respondentSatker: 'BALAI BESAR PELAKSANAAN JALAN NASIONAL JATENG-DIY',
    respondentSatkerKode: '499012',
    respondentEmail: 'keuangan.bbpjn.jateng@pu.go.id',
    respondentNoHp: '081229334411',
    submittedAt: '2026-02-18T10:15:00.000Z',
    answers: [
      { fieldId: 'f_rating_cso', fieldLabel: 'Tingkat Keramahan & Kecepatan Layanan Petugas Front Office / CSO', fieldType: 'RATING', value: 4 },
      { fieldId: 'f_rating_spm', fieldLabel: 'Ketepatan Waktu Penerbitan SP2D atas SPM yang Diajukan Satker', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_konsultasi_ikpa', fieldLabel: 'Kejelasan Bimbingan Konsultasi Teknis IKPA, SAKTI & Deviasi Hal III', fieldType: 'RATING', value: 4 },
      { fieldId: 'f_integritas_gratifikasi', fieldLabel: 'Apakah Anda pernah diminta atau menemukan adanya praktik pungli / gratifikasi oleh pegawai KPPN?', fieldType: 'YES_NO', value: 'Tidak' },
      { fieldId: 'f_kanal_konsultasi_favorit', fieldLabel: 'Saluran Konsultasi yang Paling Efektif & Sering Digunakan oleh Satker Anda', fieldType: 'MULTIPLE_CHOICE', value: 'Portal Web Monitoring ANGKASA' },
      { fieldId: 'f_saran_perbaikan', fieldLabel: 'Kritik, Saran & Usulan Inovasi untuk Peningkatan Kualitas Layanan KPPN', fieldType: 'PARAGRAPH', value: 'Semoga fitur notifikasi WhatsApp reminder jatuh tempo terus ditingkatkan agar satker tidak terlambat kirim SPM.' }
    ]
  },
  {
    id: 'resp_demo_09',
    formId: 'form_survei_kepuasan_2026',
    formTitle: 'Survei Kepuasan Layanan & Persepsi Korupsi KPPN Semarang I 2026',
    respondentName: 'Sri Wahyuni, S.Akun.',
    respondentSatker: 'BPS PROVINSI JAWA TENGAH',
    respondentSatkerKode: '427189',
    respondentEmail: 'keuangan.bpsjateng@bps.go.id',
    respondentNoHp: '081329009941',
    submittedAt: '2026-02-18T13:25:00.000Z',
    answers: [
      { fieldId: 'f_rating_cso', fieldLabel: 'Tingkat Keramahan & Kecepatan Layanan Petugas Front Office / CSO', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_spm', fieldLabel: 'Ketepatan Waktu Penerbitan SP2D atas SPM yang Diajukan Satker', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_konsultasi_ikpa', fieldLabel: 'Kejelasan Bimbingan Konsultasi Teknis IKPA, SAKTI & Deviasi Hal III', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_integritas_gratifikasi', fieldLabel: 'Apakah Anda pernah diminta atau menemukan adanya praktik pungli / gratifikasi oleh pegawai KPPN?', fieldType: 'YES_NO', value: 'Tidak' },
      { fieldId: 'f_kanal_konsultasi_favorit', fieldLabel: 'Saluran Konsultasi yang Paling Efektif & Sering Digunakan oleh Satker Anda', fieldType: 'MULTIPLE_CHOICE', value: 'WhatsApp Helpdesk / Jarkom Masif KPPN' },
      { fieldId: 'f_saran_perbaikan', fieldLabel: 'Kritik, Saran & Usulan Inovasi untuk Peningkatan Kualitas Layanan KPPN', fieldType: 'PARAGRAPH', value: 'Pelayanan cepat, transparan, dan tidak ada biaya apapun. Bravo KPPN Semarang I.' }
    ]
  },
  {
    id: 'resp_demo_10',
    formId: 'form_survei_kepuasan_2026',
    formTitle: 'Survei Kepuasan Layanan & Persepsi Korupsi KPPN Semarang I 2026',
    respondentName: 'Kompol Hendra Setiawan',
    respondentSatker: 'POLRESTABES SEMARANG',
    respondentSatkerKode: '651110',
    respondentEmail: 'keuangan.polrestabes.smg@polri.go.id',
    respondentNoHp: '081225789012',
    submittedAt: '2026-02-19T08:50:00.000Z',
    answers: [
      { fieldId: 'f_rating_cso', fieldLabel: 'Tingkat Keramahan & Kecepatan Layanan Petugas Front Office / CSO', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_spm', fieldLabel: 'Ketepatan Waktu Penerbitan SP2D atas SPM yang Diajukan Satker', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_konsultasi_ikpa', fieldLabel: 'Kejelasan Bimbingan Konsultasi Teknis IKPA, SAKTI & Deviasi Hal III', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_integritas_gratifikasi', fieldLabel: 'Apakah Anda pernah diminta atau menemukan adanya praktik pungli / gratifikasi oleh pegawai KPPN?', fieldType: 'YES_NO', value: 'Tidak' },
      { fieldId: 'f_kanal_konsultasi_favorit', fieldLabel: 'Saluran Konsultasi yang Paling Efektif & Sering Digunakan oleh Satker Anda', fieldType: 'MULTIPLE_CHOICE', value: 'WhatsApp Helpdesk / Jarkom Masif KPPN' },
      { fieldId: 'f_saran_perbaikan', fieldLabel: 'Kritik, Saran & Usulan Inovasi untuk Peningkatan Kualitas Layanan KPPN', fieldType: 'PARAGRAPH', value: 'Sangat mengapresiasi kecepatan proses rekonsiliasi dan verifikasi LPJ Bendahara.' }
    ]
  },
  {
    id: 'resp_demo_11',
    formId: 'form_survei_kepuasan_2026',
    formTitle: 'Survei Kepuasan Layanan & Persepsi Korupsi KPPN Semarang I 2026',
    respondentName: 'Hadi Prasetyo, S.Kom.',
    respondentSatker: 'KANTOR WILAYAH DJBC JAWA TENGAH DAN D.I.Y.',
    respondentSatkerKode: '411201',
    respondentEmail: 'keuangan.kanwildjbc.jateng@kemenkeu.go.id',
    respondentNoHp: '08112509887',
    submittedAt: '2026-02-19T11:00:00.000Z',
    answers: [
      { fieldId: 'f_rating_cso', fieldLabel: 'Tingkat Keramahan & Kecepatan Layanan Petugas Front Office / CSO', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_spm', fieldLabel: 'Ketepatan Waktu Penerbitan SP2D atas SPM yang Diajukan Satker', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_konsultasi_ikpa', fieldLabel: 'Kejelasan Bimbingan Konsultasi Teknis IKPA, SAKTI & Deviasi Hal III', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_integritas_gratifikasi', fieldLabel: 'Apakah Anda pernah diminta atau menemukan adanya praktik pungli / gratifikasi oleh pegawai KPPN?', fieldType: 'YES_NO', value: 'Tidak' },
      { fieldId: 'f_kanal_konsultasi_favorit', fieldLabel: 'Saluran Konsultasi yang Paling Efektif & Sering Digunakan oleh Satker Anda', fieldType: 'MULTIPLE_CHOICE', value: 'Portal Web Monitoring ANGKASA' },
      { fieldId: 'f_saran_perbaikan', fieldLabel: 'Kritik, Saran & Usulan Inovasi untuk Peningkatan Kualitas Layanan KPPN', fieldType: 'PARAGRAPH', value: 'Aplikasi ANGKASA inovasi yang sangat jempolan! Memudahkan satker merekonsiliasi deviasi dan IKPA.' }
    ]
  },
  {
    id: 'resp_demo_12',
    formId: 'form_survei_kepuasan_2026',
    formTitle: 'Survei Kepuasan Layanan & Persepsi Korupsi KPPN Semarang I 2026',
    respondentName: 'Dewi Kartika, S.E.',
    respondentSatker: 'UNIVERSITAS NEGERI SEMARANG',
    respondentSatkerKode: '677521',
    respondentEmail: 'keuangan.unnes@mail.unnes.ac.id',
    respondentNoHp: '081326117723',
    submittedAt: '2026-02-19T14:15:00.000Z',
    answers: [
      { fieldId: 'f_rating_cso', fieldLabel: 'Tingkat Keramahan & Kecepatan Layanan Petugas Front Office / CSO', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_rating_spm', fieldLabel: 'Ketepatan Waktu Penerbitan SP2D atas SPM yang Diajukan Satker', fieldType: 'RATING', value: 4 },
      { fieldId: 'f_rating_konsultasi_ikpa', fieldLabel: 'Kejelasan Bimbingan Konsultasi Teknis IKPA, SAKTI & Deviasi Hal III', fieldType: 'RATING', value: 5 },
      { fieldId: 'f_integritas_gratifikasi', fieldLabel: 'Apakah Anda pernah diminta atau menemukan adanya praktik pungli / gratifikasi oleh pegawai KPPN?', fieldType: 'YES_NO', value: 'Tidak' },
      { fieldId: 'f_kanal_konsultasi_favorit', fieldLabel: 'Saluran Konsultasi yang Paling Efektif & Sering Digunakan oleh Satker Anda', fieldType: 'MULTIPLE_CHOICE', value: 'WhatsApp Helpdesk / Jarkom Masif KPPN' },
      { fieldId: 'f_saran_perbaikan', fieldLabel: 'Kritik, Saran & Usulan Inovasi untuk Peningkatan Kualitas Layanan KPPN', fieldType: 'PARAGRAPH', value: 'Terima kasih atas pendampingan Capaian Output BLU yang sangat jelas dan solutif.' }
    ]
  }
];
