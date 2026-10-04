import { QuestionBankItem, QuestionTopicMeta } from '../types/questionBank';

export const QUESTION_TOPIC_METAS: QuestionTopicMeta[] = [
  {
    topic: 'IKPA_ANGGARAN',
    name: 'IKPA & Pelaksanaan Anggaran',
    description: 'Indikator Kinerja Pelaksanaan Anggaran, Deviasi Halaman III DIPA, Penyerapan, & Capaian Output',
    iconName: 'TrendingUp',
    colorClass: 'emerald'
  },
  {
    topic: 'SP2D_KAS',
    name: 'SP2D, SPM & Manajemen Kas',
    description: 'Penerbitan Surat Perintah Pencairan Dana, Pengujian SPM, Rekening Retur & UP/TUP',
    iconName: 'Receipt',
    colorClass: 'sky'
  },
  {
    topic: 'REGULASI_KEUANGAN',
    name: 'Regulasi Keuangan & Perbendaharaan',
    description: 'UU Keuangan Negara No. 17/2003, UU Perbendaharaan Negara No. 1/2004 & PMK Terkait',
    iconName: 'Scale',
    colorClass: 'indigo'
  },
  {
    topic: 'IKM_PELAYANAN',
    name: 'IKM & Standar Pelayanan Publik',
    description: '9 Unsur SKM Permenpan-RB 14/2017, Nilai Rata-rata Tertimbang (NRR) & Mutu Layanan KPPN',
    iconName: 'Star',
    colorClass: 'amber'
  },
  {
    topic: 'SAKTI_DIGITAL',
    name: 'SAKTI & Digital Treasury',
    description: 'Sistem Aplikasi Keuangan Tingkat Instansi, Modul Anggaran, Komitmen, Pembayaran, Bendahara & GLP',
    iconName: 'Laptop',
    colorClass: 'blue'
  },
  {
    topic: 'INTEGRITAS_WBS',
    name: 'Integritas & Anti-Gratifikasi',
    description: 'Zona Integritas WBK/WBBM, Pengendalian Gratifikasi Kemenkeu, Whistleblowing System (WISE)',
    iconName: 'ShieldCheck',
    colorClass: 'rose'
  },
  {
    topic: 'AKUNTANSI_LPJ',
    name: 'Akuntansi Pemerintah & LPJ',
    description: 'Laporan Pertanggungjawaban Bendahara, Rekonsiliasi MonSAKTI, Saldo Kas & Koreksi Akuntansi',
    iconName: 'FileCheck',
    colorClass: 'teal'
  },
  {
    topic: 'PBJ_KONTRAK',
    name: 'Pengadaan Barang/Jasa & Kontrak',
    description: 'Pendaftaran Kontrak, Jaminan Pelaksanaan, Pembayaran Bertahap & BAST Fisik',
    iconName: 'Briefcase',
    colorClass: 'purple'
  }
];

export const INITIAL_QUESTION_BANK: QuestionBankItem[] = [
  // ==========================================
  // LEVEL 1: GAMPANG (PEMAHAMAN DASAR & KONSEPTUAL)
  // ==========================================
  {
    id: 'qb_easy_001',
    code: 'REG-G01',
    title: 'Pemisahan Kewenangan Pejabat Perbendaharaan',
    difficulty: 'GAMPANG',
    topic: 'REGULASI_KEUANGAN',
    question: 'Pejabat yang memiliki kewenangan menerbitkan Surat Perintah Membayar (SPM) dan bertindak sebagai penguji atas tagihan yang diajukan oleh Pejabat Pembuat Komitmen (PPK) adalah...',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: 'Kuasa Pengguna Anggaran (KPA)' },
      { id: 'opt_b', label: 'Pejabat Penandatangan SPM (PPSPM)', isCorrect: true },
      { id: 'opt_c', label: 'Bendahara Pengeluaran' },
      { id: 'opt_d', label: 'Petugas Front Office KPPN' }
    ],
    correctAnswerId: 'opt_b',
    correctAnswerLabel: 'Pejabat Penandatangan SPM (PPSPM)',
    explanation: 'Sesuai dengan prinsip checks and balances dalam UU No. 1 Tahun 2004 dan PMK No. 190/PMK.05/2012 jo PMK 210/PMK.05/2022, terdapat pemisahan tugas yang tegas: PPK bertugas membuat komitmen dan menguji kebenaran materiil tagihan serta menerbitkan SPP; PPSPM bertugas melakukan pengujian formal dan substantif atas SPP beserta dokumen pendukung sebelum menerbitkan Surat Perintah Membayar (SPM) ke KPPN.',
    legalBasis: 'UU No. 1 Tahun 2004 Pasal 10 & 12; PMK No. 190/PMK.05/2012 jo PMK No. 210/PMK.05/2022 tentang Tata Cara Pembayaran dalam Rangka Pelaksanaan APBN.',
    keyTakeaways: [
      'PPK menguji tagihan materiil & menerbitkan SPP',
      'PPSPM menguji formalitas SPP & menerbitkan SPM ke KPPN',
      'KPPN bertindak sebagai Kuasa BUN yang menguji SPM & menerbitkan SP2D'
    ],
    tags: ['Regulasi', 'PPSPM', 'PPK', 'Pemisahan Kewenangan', 'Gampang'],
    isOfficial: true
  },
  {
    id: 'qb_easy_002',
    code: 'SP2D-G02',
    title: 'Standar Waktu Penerbitan SP2D Non-Gaji',
    difficulty: 'GAMPANG',
    topic: 'SP2D_KAS',
    question: 'Berapakah standar Service Level Agreement (SLA) penerbitan SP2D Non-Gaji di KPPN sejak SPM dinyatakan lengkap dan benar secara sistem elektronik?',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: '1 Jam Kerja (60 Menit)', isCorrect: true },
      { id: 'opt_b', label: '3 Jam Kerja' },
      { id: 'opt_c', label: '1 Hari Kerja (24 Jam)' },
      { id: 'opt_d', label: '3 Hari Kerja' }
    ],
    correctAnswerId: 'opt_a',
    correctAnswerLabel: '1 Jam Kerja (60 Menit)',
    explanation: 'Berdasarkan Janji Layanan Ditjen Perbendaharaan dan SOP KPPN tipe A1/A2, penerbitan SP2D Non-Gaji dengan dokumen lengkap dan data yang tervalidasi di SPAN/SAKTI diselesaikan dalam waktu maksimal 1 (satu) jam kerja sejak SPM diterima oleh Seksi Pencairan Dana. Ini merupakan komitmen pelayanan prima DJPb kepada seluruh satuan kerja.',
    legalBasis: 'Keputusan Direktur Jenderal Perbendaharaan tentang Standar Operasional Prosedur (SOP) KPPN; PMK No. 190/PMK.05/2012 jo PMK 210/PMK.05/2022.',
    keyTakeaways: [
      'SLA penerbitan SP2D Non-Gaji: 1 Jam Kerja setelah SPM tervalidasi lengkap',
      'Semua proses dilakukan tanpa biaya (Rp0,-) dan bebas pungli',
      'Keterlambatan sistem dipantau melalui aplikasi monitoring SPAN'
    ],
    tags: ['SP2D', 'SLA', 'Layanan KPPN', 'Gampang'],
    isOfficial: true
  },
  {
    id: 'qb_easy_003',
    code: 'IKM-G03',
    title: 'Jumlah Unsur Standar SKM Permenpan-RB 14/2017',
    difficulty: 'GAMPANG',
    topic: 'IKM_PELAYANAN',
    question: 'Berapa jumlah unsur minimal yang wajib dinilai dalam Survei Kepuasan Masyarakat (SKM) sesuai Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi Nomor 14 Tahun 2017?',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: '5 Unsur Pelayanan' },
      { id: 'opt_b', label: '7 Unsur Pelayanan' },
      { id: 'opt_c', label: '9 Unsur Pelayanan', isCorrect: true },
      { id: 'opt_d', label: '12 Unsur Pelayanan' }
    ],
    correctAnswerId: 'opt_c',
    correctAnswerLabel: '9 Unsur Pelayanan',
    explanation: 'Permenpan-RB No. 14 Tahun 2017 menetapkan 9 (sembilan) unsur pelayanan publik yang wajib diukur dalam SKM, yaitu: (1) Persyaratan, (2) Prosedur, (3) Waktu Pelayanan, (4) Biaya/Tarif, (5) Produk Spesifikasi Jenis Pelayanan, (6) Kompetensi Pelaksana, (7) Perilaku Pelaksana, (8) Penanganan Pengaduan/Saran/Masukan, dan (9) Sarana dan Prasarana.',
    legalBasis: 'Peraturan Menteri PAN-RB No. 14 Tahun 2017 tentang Pedoman Penyusunan Survei Kepuasan Masyarakat Unit Penyelenggara Pelayanan Publik.',
    keyTakeaways: [
      'Ada 9 unsur wajib Permenpan-RB No. 14/2017',
      'Bobot tiap unsur adalah sama (1/9 atau ~0.111)',
      'Rentang nilai konversi IKM adalah 25 - 100 dengan mutu A, B, C, atau D'
    ],
    tags: ['IKM', 'Permenpan-RB', '9 Unsur', 'Survei', 'Gampang'],
    isOfficial: true
  },
  {
    id: 'qb_easy_004',
    code: 'INTEG-G04',
    title: 'Tindakan Menghadapi Tawaran Parsel / Hadiah',
    difficulty: 'GAMPANG',
    topic: 'INTEGRITAS_WBS',
    question: 'Jika seorang pegawai KPPN menerima bingkisan atau parsel hari raya dari satuan kerja yang berhubungan langsung dengan tugas kedinasannya, tindakan wajib yang harus diambil adalah...',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: 'Menerima bingkisan selama harganya di bawah Rp 1.000.000,-' },
      { id: 'opt_b', label: 'Membagikan bingkisan kepada seluruh rekan di kantor tanpa melapor' },
      { id: 'opt_c', label: 'Menolak secara santun, dan jika tidak memungkinkan menolak, wajib melaporkan kepada Unit Pengendalian Gratifikasi (UPG) KPPN', isCorrect: true },
      { id: 'opt_d', label: 'Menyimpan bingkisan sebagai cinderamata pribadi' }
    ],
    correctAnswerId: 'opt_c',
    correctAnswerLabel: 'Menolak secara santun, dan jika tidak memungkinkan menolak, wajib melaporkan kepada Unit Pengendalian Gratifikasi (UPG) KPPN',
    explanation: 'Sesuai regulasi antikorupsi dan PMK No. 227/PMK.09/2021 tentang Pengendalian Gratifikasi di Lingkungan Kementerian Keuangan, setiap pegawai wajib menolak pemberian gratifikasi yang berhubungan dengan jabatan atau berlawanan dengan kewajiban. Jika dalam kondisi tertentu penolakan tidak dapat dilakukan (misal dikirim ke rumah tanpa identitas atau mudah busuk), penerima wajib melaporkan kepada UPG dalam waktu maksimal 10 hari kerja atau KPK dalam 30 hari kerja.',
    legalBasis: 'UU No. 20 Tahun 2001 Pasal 12B; PMK No. 227/PMK.09/2021 tentang Pengendalian Gratifikasi di Lingkungan Kemenkeu.',
    keyTakeaways: [
      'Prinsip Utama: Tolak secara santun di awal',
      'Bila terpaksa diterima: Laporkan segera ke UPG KPPN / SiGol KPK',
      'Seluruh layanan KPPN berbiaya Rp0,- (Nol Rupiah)'
    ],
    tags: ['Integritas', 'Gratifikasi', 'UPG', 'Kemenkeu', 'Gampang'],
    isOfficial: true
  },
  {
    id: 'qb_easy_005',
    code: 'AKUN-G05',
    title: 'Batas Waktu Penyampaian LPJ Bendahara ke KPPN',
    difficulty: 'GAMPANG',
    topic: 'AKUNTANSI_LPJ',
    question: 'Kapan batas akhir penyampaian Laporan Pertanggungjawaban (LPJ) Bendahara Pengeluaran setiap bulannya ke KPPN?',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: 'Paling lambat tanggal 5 bulan berikutnya' },
      { id: 'opt_b', label: 'Paling lambat tanggal 10 bulan berikutnya', isCorrect: true },
      { id: 'opt_c', label: 'Paling lambat tanggal 20 bulan berikutnya' },
      { id: 'opt_d', label: 'Pada akhir tahun anggaran' }
    ],
    correctAnswerId: 'opt_b',
    correctAnswerLabel: 'Paling lambat tanggal 10 bulan berikutnya',
    explanation: 'Berdasarkan Peraturan Direktur Jenderal Perbendaharaan tentang Penatausahaan dan Penyusunan LPJ Bendahara, LPJ Bendahara Pengeluaran maupun Bendahara Penerimaan wajib disampaikan ke KPPN paling lambat tanggal 10 bulan berikutnya. Jika tanggal 10 jatuh pada hari libur, maka batas akhir bergeser ke hari kerja sebelumnya.',
    legalBasis: 'PMK No. 162/PMK.05/2013 jo PMK No. 230/PMK.05/2016; Perdirjen Perbendaharaan No. PER-03/PB/2014.',
    keyTakeaways: [
      'Batas akhir LPJ Bendahara: Tanggal 10 bulan berikutnya',
      'Keterlambatan penyampaian LPJ berdampak pada sanksi penundaan penerbitan SP2D UP/TUP',
      'LPJ disusun setelah diverifikasi oleh KPA/PPK dan cocok dengan saldo bank/kas'
    ],
    tags: ['LPJ', 'Bendahara', 'Akuntansi', 'Batas Waktu', 'Gampang'],
    isOfficial: true
  },
  {
    id: 'qb_easy_006',
    code: 'IKPA-G06',
    title: 'Indikator Utama IKPA pada Aspek Kepatuhan',
    difficulty: 'GAMPANG',
    topic: 'IKPA_ANGGARAN',
    question: 'Manakah dari indikator berikut yang termasuk dalam aspek Kepatuhan terhadap Regulasi dalam penilaian IKPA Satker?',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: 'Capaian Output Kegiatan' },
      { id: 'opt_b', label: 'Pengelolaan Uang Persediaan (UP) dan TUP', isCorrect: true },
      { id: 'opt_c', label: 'Realisasi Anggaran per Akun' },
      { id: 'opt_d', label: 'Revisi Anggaran Halaman I' }
    ],
    correctAnswerId: 'opt_b',
    correctAnswerLabel: 'Pengelolaan Uang Persediaan (UP) dan TUP',
    explanation: 'IKPA reformulasi mengelompokkan indikator ke dalam 3 aspek: (1) Kualitas Perencanaan Anggaran (Revisi DIPA, Deviasi Halaman III DIPA), (2) Kualitas Pelaksanaan Anggaran (Penyerapan Anggaran, Belanja Kontraktual, Penyelesaian Tagihan, Pengelolaan UP dan TUP, Dispensasi SPM), dan (3) Kualitas Hasil Pelaksanaan Anggaran (Capaian Output). Pengelolaan UP dan TUP termasuk dalam aspek pelaksanaan dan kepatuhan perputaran kas.',
    legalBasis: 'Perdirjen Perbendaharaan No. PER-5/PB/2022 jo PER-4/PB/2023 tentang Petunjuk Teknis Penilaian Indikator Kinerja Pelaksanaan Anggaran (IKPA).',
    keyTakeaways: [
      'IKPA memiliki 3 aspek utama evaluasi',
      'Pengelolaan UP/TUP mengukur kedisiplinan revolving dan pertanggungjawaban dana',
      'Revolving UP minimal 1 kali dalam sebulan atau pertanggungjawaban minimal 50%'
    ],
    tags: ['IKPA', 'UP', 'TUP', 'Perencanaan', 'Gampang'],
    isOfficial: true
  },

  // ==========================================
  // LEVEL 2: SEDANG (APLIKASI & PROSEDURAL)
  // ==========================================
  {
    id: 'qb_med_001',
    code: 'IKPA-M01',
    title: 'Mekanisme Pemutakhiran RPD Halaman III DIPA',
    difficulty: 'SEDANG',
    topic: 'IKPA_ANGGARAN',
    question: 'Satuan kerja ingin memperbaiki deviasi antara rencana penarikan dana bulanan dengan realisasi kas agar nilai IKPA Deviasi Halaman III DIPA maksimal. Kapan batas waktu terakhir pengajuan pemutakhiran RPD Halaman III DIPA triwulanan?',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: 'Setiap hari kerja pada bulan bersangkutan secara fleksibel' },
      { id: 'opt_b', label: 'Paling lambat 10 hari kerja pertama pada awal triwulan bersangkutan (Triwulan I, II, III, IV)', isCorrect: true },
      { id: 'opt_c', label: 'Paling lambat akhir triwulan setelah semua belanja terealisasi' },
      { id: 'opt_d', label: 'Hanya bisa dilakukan satu kali saja pada bulan Desember' }
    ],
    correctAnswerId: 'opt_b',
    correctAnswerLabel: 'Paling lambat 10 hari kerja pertama pada awal triwulan bersangkutan (Triwulan I, II, III, IV)',
    explanation: 'Berdasarkan Perdirjen Perbendaharaan tentang penilaian IKPA, penyesuaian Rencana Penarikan Dana (RPD) pada Halaman III DIPA diberikan kesempatan pemutakhiran reguler pada setiap awal triwulan (paling lambat 10 hari kerja pertama awal triwulan). Satker wajib memetakan jadwal pengeluaran riil agar deviasi antara rencana dan realisasi tidak melebihi batas toleransi 5%.',
    legalBasis: 'Perdirjen Perbendaharaan No. PER-5/PB/2022 Pasal 5; Petunjuk Teknis Penilaian IKPA Kemenkeu.',
    keyTakeaways: [
      'Pemutakhiran RPD Halaman III dibuka pada 10 hari kerja awal tiap triwulan',
      'Batas toleransi deviasi per jenis belanja adalah maksimal 5%',
      'Satker yang disiplin re-proyeksi dapat mengamankan nilai IKPA 100 untuk indikator ini'
    ],
    tags: ['IKPA', 'Deviasi Halaman III', 'RPD', 'DIPA', 'Sedang'],
    isOfficial: true
  },
  {
    id: 'qb_med_002',
    code: 'SP2D-M02',
    title: 'Penanganan Retur SP2D Akibat Rekening Pasif/Dormant',
    difficulty: 'SEDANG',
    topic: 'SP2D_KAS',
    question: 'KPPN menerima Surat Pemberitahuan Penolakan (Retur) dari Bank Operasional atas SP2D yang telah diterbitkan karena rekening penerima berstatus dormant (pasif). Prosedur yang benar untuk menyelesaikan kasus retur ini adalah...',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: 'KPPN langsung membatalkan SP2D dan uang ditarik kembali tanpa konfirmasi' },
      { id: 'opt_b', label: 'KPPN menerbitkan Surat Pemberitahuan Retur ke Satker, dan Satker wajib menyampaikan Surat Ralat Rekening (SPRR) beserta rekening aktif yang telah diverifikasi', isCorrect: true },
      { id: 'opt_c', label: 'Satker menerbitkan SPM baru dengan nomor yang sama tanpa surat ralat' },
      { id: 'opt_d', label: 'Uang diserahkan secara tunai kepada penerima di loket KPPN' }
    ],
    correctAnswerId: 'opt_b',
    correctAnswerLabel: 'KPPN menerbitkan Surat Pemberitahuan Retur ke Satker, dan Satker wajib menyampaikan Surat Ralat Rekening (SPRR) beserta rekening aktif yang telah diverifikasi',
    explanation: 'Sesuai PMK No. 197/PMK.05/2017 tentang Pengelolaan Penerimaan dan Pengeluaran Negara pada Akhir Tahun Anggaran serta aturan penatausahaan rekening retur, KPPN akan menampung dana retur pada Rekening Penampungan Retur KPPN dan menerbitkan surat pemberitahuan ke Satker. Satker kemudian mengonfirmasi kepada bank dan penerima, lalu menyampaikan Surat Permintaan Ralat Rekening (SPRR) yang dilampiri rekening koran aktif agar KPPN menerbitkan SP2D Pengganti.',
    legalBasis: 'PMK No. 197/PMK.05/2017; Perdirjen Perbendaharaan No. PER-9/PB/2018 tentang Tata Cara Penyelesaian Retur SP2D.',
    keyTakeaways: [
      'Dana retur diamankan di Rekening Penampungan Retur KPPN',
      'Satker memproses SPRR (Surat Permintaan Ralat Rekening) via SAKTI',
      'KPPN menerbitkan SP2D Pengganti tanpa mengurangi pagu DIPA satker'
    ],
    tags: ['SP2D', 'Retur', 'SPRR', 'Rekening Dormant', 'Sedang'],
    isOfficial: true
  },
  {
    id: 'qb_med_003',
    code: 'SAKTI-M03',
    title: 'Validasi OTP Pejabat Penandatangan SPM di SAKTI',
    difficulty: 'SEDANG',
    topic: 'SAKTI_DIGITAL',
    question: 'Dalam aplikasi SAKTI, proses penerbitan SPM yang sah dan dapat dikirimkan ke KPPN wajib melalui otorisasi digital berupa One Time Password (OTP). Siapakah pejabat yang berwenang men-generate dan menginput OTP SPM?',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: 'Staf Operator Pembayaran' },
      { id: 'opt_b', label: 'Pejabat Pembuat Komitmen (PPK)' },
      { id: 'opt_c', label: 'Pejabat Penandatangan SPM (PPSPM) yang telah terdaftar spesimen sertifikat digitalnya', isCorrect: true },
      { id: 'opt_d', label: 'Kepala Kantor Wilayah DJPb' }
    ],
    correctAnswerId: 'opt_c',
    correctAnswerLabel: 'Pejabat Penandatangan SPM (PPSPM) yang telah terdaftar spesimen sertifikat digitalnya',
    explanation: 'Pada modul pembayaran SAKTI, persetujuan dan pengiriman SPM ke KPPN menggunakan Tanda Tangan Elektronik (TTE) tersertifikasi atau OTP resmi yang hanya dikirimkan ke nomor ponsel resmi milik PPSPM yang terdaftar di database Kementerian Keuangan. Penggunaan OTP oleh selain pejabat berwenang merupakan pelanggaran berat tata kelola keamanan digital perbendaharaan.',
    legalBasis: 'PMK No. 210/PMK.05/2022 tentang Tata Cara Pembayaran dalam Rangka Pelaksanaan APBN; Petunjuk Teknis Implementasi TTE/OTP SAKTI DJPb.',
    keyTakeaways: [
      'OTP/TTE SPM melekat secara personal pada PPSPM',
      'Kode OTP tidak boleh didelegasikan atau dibagikan kepada staf operator',
      'Validasi OTP membuktikan tanggung jawab pengujian komitmen dan keabsahan dokumen'
    ],
    tags: ['SAKTI', 'OTP', 'PPSPM', 'Keamanan Digital', 'Sedang'],
    isOfficial: true
  },
  {
    id: 'qb_med_004',
    code: 'PBJ-M04',
    title: 'Batas Pendaftaran Data Kontrak ke KPPN',
    difficulty: 'SEDANG',
    topic: 'PBJ_KONTRAK',
    question: 'Pejabat Pembuat Komitmen (PPK) telah menandatangani Surat Perjanjian Kontrak Pengadaan Komputer dengan nilai Rp 450.000.000,- pada tanggal 3 Maret 2026. Kapan batas waktu maksimal PPK mendaftarkan data kontrak tersebut ke KPPN agar tidak terkena penalti IKPA Data Kontrak?',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: '3 hari kalender setelah tanda tangan' },
      { id: 'opt_b', label: 'Paling lambat 5 hari kerja setelah kontrak ditandatangani', isCorrect: true },
      { id: 'opt_c', label: '14 hari kerja setelah barang diterima lengkap' },
      { id: 'opt_d', label: 'Bersamaan dengan saat pengajuan SPM termin pertama' }
    ],
    correctAnswerId: 'opt_b',
    correctAnswerLabel: 'Paling lambat 5 hari kerja setelah kontrak ditandatangani',
    explanation: 'Sesuai PMK No. 190/PMK.05/2012 dan PMK No. 210/PMK.05/2022, data kontrak beserta Nomor Register Kontrak (NRK) wajib disampaikan ke KPPN paling lambat 5 (lima) hari kerja setelah kontrak ditandatangani. Keterlambatan pendaftaran kontrak menyebabkan satker tidak dapat mengajukan SPM dan menurunkan nilai IKPA indikator Pengelolaan Kontrak.',
    legalBasis: 'PMK No. 190/PMK.05/2012 Pasal 38; PMK No. 210/PMK.05/2022; Perdirjen Perbendaharaan No. PER-5/PB/2022.',
    keyTakeaways: [
      'Deadline pendaftaran kontrak: 5 HARI KERJA sejak TTD Kontrak',
      'Pendaftaran kontrak menghasilkan NRK (Nomor Register Kontrak)',
      'SPM Kontraktual tidak bisa diproses KPPN jika data kontrak belum tercatat di SPAN'
    ],
    tags: ['Kontrak', 'PPK', 'PBJ', '5 Hari Kerja', 'IKPA', 'Sedang'],
    isOfficial: true
  },
  {
    id: 'qb_med_005',
    code: 'IKM-M05',
    title: 'Konversi Nilai Indeks Kepuasan Masyarakat (IKM)',
    difficulty: 'SEDANG',
    topic: 'IKM_PELAYANAN',
    question: 'Sebuah KPPN memperoleh Nilai Rata-rata Tertimbang (NRR) dari 9 unsur SKM sebesar 3.65 (skala 4). Berapakah Nilai IKM Konversi (skala 25 - 100) dan predikat mutu pelayanan yang diperoleh?',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: '80.00 - Mutu B (Baik)' },
      { id: 'opt_b', label: '91.25 - Mutu A (Sangat Baik)', isCorrect: true },
      { id: 'opt_c', label: '88.50 - Mutu B (Baik)' },
      { id: 'opt_d', label: '95.00 - Mutu A (Sangat Baik)' }
    ],
    correctAnswerId: 'opt_b',
    correctAnswerLabel: '91.25 - Mutu A (Sangat Baik)',
    explanation: 'Sesuai rumus Permenpan-RB No. 14 Tahun 2017:\nIKM Konversi = NRR Tertimbang x 25\n= 3.65 x 25 = 91.25.\nBerdasarkan tabel interval mutu SKM Permenpan-RB:\n- 25.00 - 64.99: D (Tidak Baik)\n- 65.00 - 76.60: C (Kurang Baik)\n- 76.61 - 88.30: B (Baik)\n- 88.31 - 100.00: A (Sangat Baik).\nKarena 91.25 berada di atas 88.30, maka predikatnya adalah A (Sangat Baik).',
    legalBasis: 'Permenpan-RB No. 14 Tahun 2017 Lampiran Pedoman Teknis Pengolahan Data SKM.',
    keyTakeaways: [
      'Rumus IKM Konversi = NRR Tertimbang x 25',
      'Ambang batas predikat Mutu A (Sangat Baik) adalah skor >= 88.31',
      'Hasil konversi wajib dipublikasikan secara transparan ke publik'
    ],
    tags: ['IKM', 'Perhitungan IKM', 'NRR', 'Permenpan-RB', 'Sedang'],
    isOfficial: true
  },

  // ==========================================
  // LEVEL 3: ANALISIS & KASUS HOTS (HIGH ORDER THINKING)
  // ==========================================
  {
    id: 'qb_hots_001',
    code: 'HOTS-01',
    title: 'Analisis Keterlambatan Fisik Kontraktual Akhir Tahun & Rekening RPK-BUN',
    difficulty: 'ANALISIS_HOTS',
    topic: 'IKPA_ANGGARAN',
    scenario: 'Menjelang akhir tahun anggaran (15 Desember 2026), Satker Pengadilan Negeri memiliki kontrak pekerjaan renovasi gedung senilai Rp 1,2 Miliar dengan penyedia PT Bangun Mandiri. Realisasi fisik pekerjaan baru mencapai 85%, sementara batas akhir penerbitan SPM-LS Kontraktual telah tiba sesuai Peraturan Langkah-Langkah Akhir Tahun (LLAT). PPK dan Penyedia sepakat pekerjaan sisa 15% dapat diselesaikan paling lambat 28 Desember.',
    question: 'Berdasarkan regulasi Pedoman LLAT Ditjen Perbendaharaan, langkah solutif dan legal yang wajib dilakukan oleh PPK dan PPSPM agar pembayaran tidak melanggar hukum dan anggaran tidak hangus adalah...',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: 'Menerbitkan BAST fiktif 100% dan mencairkan seluruh dana langsung ke rekening penyedia sebelum barang selesai' },
      { id: 'opt_b', label: 'Membatalkan sisa kontrak 15% sehingga dana sisa hangus dan penyedia tidak dibayar' },
      { id: 'opt_c', label: 'Mengajukan SPM-LS dengan mekanisme pembayaran ke Rekening Penampungan Akhir Tahun Anggaran (RPK-BUN) sebesar sisa pekerjaan (15%) yang wajib dilampiri Surat Jaminan/Bank Garansi penyelesaian pekerjaan yang masih berlaku', isCorrect: true },
      { id: 'opt_d', label: 'Mengalihkan sisa pembayaran pekerjaan menjadi pembayaran Uang Muka tahun anggaran berikutnya' }
    ],
    correctAnswerId: 'opt_c',
    correctAnswerLabel: 'Mengajukan SPM-LS dengan mekanisme pembayaran ke Rekening Penampungan Akhir Tahun Anggaran (RPK-BUN) sebesar sisa pekerjaan (15%) yang wajib dilampiri Surat Jaminan/Bank Garansi penyelesaian pekerjaan yang masih berlaku',
    explanation: 'ANALISIS KASUS MENDALAM:\n1. Menerbitkan BAST 100% padahal fisik baru 85% merupakan tindak pidana korupsi/pemalsuan dokumen negara.\n2. Berdasarkan Peraturan Dirjen Perbendaharaan tentang LLAT (Langkah-Langkah Akhir Tahun), pemerintah menyediakan solusi Rekening Penampungan Akhir Tahun Anggaran (RPK-BUN / Rekening Penampungan Kontraktual KPPN).\n3. Pembayaran fisik yang telah selesai (85%) dibayarkan langsung ke rekening penyedia.\n4. Sisa pekerjaan 15% (yang belum selesai namun dijamin dapat diselesaikan sebelum batas toleransi akhir tahun) diajukan dengan SPM Penampungan ke Rekening Penampungan BUN, dengan syarat wajib menyerahkan Surat Jaminan Pemeliharaan/Penyelesaian Pekerjaan (Bank Garansi) dari Bank Umum yang telah dikonfirmasi keabsahannya oleh PPK ke pihak bank penerbit.\n5. Setelah pekerjaan riil mencapai 100% dibuktikan dengan BAST final, barulah KPPN menyalurkan dana dari rekening penampungan ke rekening penyedia.',
    legalBasis: 'Perdirjen Perbendaharaan tentang Pedoman Penerimaan dan Pengeluaran Negara pada Akhir Tahun Anggaran (Regulasi LLAT tahunan); PMK No. 197/PMK.05/2017 jo PMK No. 210/PMK.05/2022.',
    keyTakeaways: [
      'Pekerjaan belum 100% di akhir tahun: Gunakan mekanisme Rekening Penampungan BUN + Bank Garansi',
      'Haram hukumnya membuat BAST 100% jika fisik riil belum selesai (risiko tipikor/TPK)',
      'Bank Garansi wajib diverifikasi keasliannya secara tertulis kepada bank penerbit'
    ],
    tags: ['HOTS', 'LLAT', 'Akhir Tahun', 'Bank Garansi', 'Kontraktual', 'Analisis'],
    isOfficial: true
  },
  {
    id: 'qb_hots_002',
    code: 'HOTS-02',
    title: 'Analisis Lonjakan Deviasi RPD & Strategi Penyelamatan Nilai IKPA',
    difficulty: 'ANALISIS_HOTS',
    topic: 'IKPA_ANGGARAN',
    scenario: 'Satker Balai Diklat Kementerian pada awal Triwulan III memproyeksikan penarikan dana belanja modal sebesar Rp 3.000.000.000,- pada bulan Agustus. Namun, terjadi sanggah banding pada proses lelang di Pokja Pengadaan yang mengakibatkan penandatanganan kontrak tertunda hingga Oktober. Akibatnya realisasi belanja modal di bulan Agustus menjadi Rp 0,- (deviasi 100%).',
    question: 'Jika kondisi ini dibiarkan, nilai IKPA Deviasi Halaman III DIPA satker akan jatuh drastis. Berdasarkan juknis IKPA terkini, analisis tindakan mitigasi paling tepat yang harus segera diambil oleh tim perencana anggaran satker adalah...',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: 'Membiarkan saja karena kegagalan lelang berada di luar tanggung jawab KPA' },
      { id: 'opt_b', label: 'Segera melakukan revisi administratif DIPA pada periode pemutakhiran Halaman III DIPA triwulan bersangkutan atau mengajukan pemutakhiran RPD pada 10 hari kerja pertama triwulan IV untuk memetakan ulang penarikan ke bulan Oktober-November', isCorrect: true },
      { id: 'opt_c', label: 'Mencairkan dana belanja modal secara tunai ke rekening bendahara pengeluaran agar penyerapan tetap 100%' },
      { id: 'opt_d', label: 'Mengajukan surat pengaduan sengketa lelang ke KPPN' }
    ],
    correctAnswerId: 'opt_b',
    correctAnswerLabel: 'Segera melakukan revisi administratif DIPA pada periode pemutakhiran Halaman III DIPA triwulan bersangkutan atau mengajukan pemutakhiran RPD pada 10 hari kerja pertama triwulan IV untuk memetakan ulang penarikan ke bulan Oktober-November',
    explanation: 'ANALISIS KASUS MENDALAM:\n1. Indikator Deviasi Halaman III DIPA dihitung bulanan secara kumulatif tiap triwulan dengan membandingkan realisasi SP2D terhadap RPD Halaman III.\n2. Deviasi sebesar Rp 3 Miliar (dari rencana Rp 3 M ke realisasi Rp 0) akan memberikan skor 0 pada bulan bersangkutan untuk belanja modal.\n3. Cara mitigasi: Menggunakan periode pemutakhiran RPD (Re-proyeksi DIPA) yang dibuka pada sistem SAKTI/SPAN. Satker memindahkan target penarikan belanja modal tersebut dari Triwulan III ke Triwulan IV (Oktober/November) sesuai timeline kontrak yang baru.\n4. Penarikan kas fiktif ke rekening bendahara (Opsi C) merupakan perbuatan melanggar hukum berat (penyalahgunaan kas negara).',
    legalBasis: 'Perdirjen Perbendaharaan No. PER-5/PB/2022 Lampiran II tentang Tata Cara Penghitungan Deviasi Halaman III DIPA.',
    keyTakeaways: [
      'Deviasi dihitung per jenis belanja (Pegawai, Barang, Modal, Bansos)',
      'Kunci nilai IKPA tinggi adalah keselarasan antara jadwal kegiatan dan cash planning',
      'Manfaatkan window pemutakhiran RPD triwulanan secara proaktif'
    ],
    tags: ['HOTS', 'IKPA', 'Deviasi Halaman III', 'Mitigasi', 'Cash Planning', 'Analisis'],
    isOfficial: true
  },
  {
    id: 'qb_hots_003',
    code: 'HOTS-03',
    title: 'Analisis Gap Kepuasan Satker: SLA Tercapai Namun Nilai Kecepatan Rendah',
    difficulty: 'ANALISIS_HOTS',
    topic: 'IKM_PELAYANAN',
    scenario: 'Hasil evaluasi Survei Kepuasan Masyarakat (IKM) KPPN Triwulan I menunjukkan nilai IKM Konversi 89.4 (Mutu A). Namun pada rincian 9 unsur, Unsur U3 (Kecepatan Waktu Pelayanan) hanya memperoleh NRR 3.12 (terendah dibandingkan unsur lainnya). Padahal, data internal KPPN menunjukkan SLA penerbitan SP2D mencapai 100% tepat waktu (di bawah 1 jam) dan antrian FO rata-rata 12 menit.',
    question: 'Dari perspektif manajemen mutu pelayanan publik ISO 9001:2015 dan Permenpan-RB 14/2017, analisis penyebab gap psikologis ini dan rekomendasi perbaikan (Corrective Action) yang paling efektif adalah...',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: 'Mengabaikan hasil survei karena data teknis sistem SP2D sudah 100% tepat waktu' },
      { id: 'opt_b', label: 'Menyalahkan satker karena tidak memahami SLA resmi KPPN' },
      { id: 'opt_c', label: 'Terdapat Information Gap (ketidakpastian status berkas): Satker merasa menunggu lama karena tidak mengetahui progres SPM mereka di Seksi Verifikasi/Pencairan Dana. Solusinya: Mengaktifkan notifikasi real-time via WhatsApp bot / ANGKASA Tracking status SP2D dan display antrian digital transparan', isCorrect: true },
      { id: 'opt_d', label: 'Menghapus unsur Kecepatan Waktu Layanan dari kuesioner survei berikutnya' }
    ],
    correctAnswerId: 'opt_c',
    correctAnswerLabel: 'Terdapat Information Gap (ketidakpastian status berkas): Satker merasa menunggu lama karena tidak mengetahui progres SPM mereka di Seksi Verifikasi/Pencairan Dana. Solusinya: Mengaktifkan notifikasi real-time via WhatsApp bot / ANGKASA Tracking status SP2D dan display antrian digital transparan',
    explanation: 'ANALISIS KASUS MENDALAM:\n1. Teori Psikologi Pelayanan (David Maister - The Psychology of Waiting Lines): "Unexplained waits and uncertain waits feel much longer than explained or known waits" (Waktu tunggu yang tidak pasti dan tanpa informasi terasa jauh lebih lama dibanding waktu tunggu riil).\n2. Meskipun KPPN menyelesaikan SP2D dalam 45 menit (memenuhi SLA < 60 menit), jika satker di ruang tunggu atau di kantornya tidak tahu apakah SPM-nya sedang diperiksa FO, diverifikasi Middle Office, atau sedang diparaf Kepala Seksi, satker merasa gelisah dan mempersepsikan layanan lambat.\n3. Corrective Action: Transparansi alur dengan sistem live tracking status (seperti fitur Tracking SP2D di aplikasi ANGKASA KPPN), broadcast WhatsApp status "SPM Diterima -> Sedang Diverifikasi -> SP2D Terbit", serta digital queue display.',
    legalBasis: 'Permenpan-RB No. 14 Tahun 2017 Bab IV Analisis dan Rencana Tindak Lanjut Hasil SKM; Standar Manajemen Mutu ISO 9001:2015 Klausul 9.1.2 Kepuasan Pelanggan.',
    keyTakeaways: [
      'Persepsi kepuasan dipengaruhi oleh kejelasan informasi status layanan',
      'Gunakan sistem notifikasi otomatis untuk menghilangkan kecemasan satker',
      'Tindak lanjut IKM harus berorientasi pada akar masalah psikologis dan proses'
    ],
    tags: ['HOTS', 'IKM', 'Gap Analysis', 'Pelayanan Prima', 'Tracking', 'Analisis'],
    isOfficial: true
  },
  {
    id: 'qb_hots_004',
    code: 'HOTS-04',
    title: 'Dilema Etika & Integritas: Kemitraan vs Benturan Kepentingan Gratifikasi',
    difficulty: 'ANALISIS_HOTS',
    topic: 'INTEGRITAS_WBS',
    scenario: 'Sebuah satker mitra kerja menyerahkan amplop berisi uang transport dan cinderamata bernilai Rp 500.000,- kepada staf KPPN yang hadir sebagai narasumber Sosialisasi Pengajuan SPM di kantor satker tersebut. Satker berargumen bahwa uang tersebut merupakan honorarium resmi dari DIPA satker yang sah secara akun belanja.',
    question: 'Berdasarkan PMK Pengendalian Gratifikasi dan Kode Etik Pegawai Kementerian Keuangan, bagaimana analisis legalitas penerimaan tersebut dan tindakan yang benar dari pegawai KPPN?',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: 'Boleh diterima langsung tanpa lapor karena sumber dananya resmi dari DIPA satker' },
      { id: 'opt_b', label: 'Pegawai KPPN DILARANG menerima honorarium narasumber dari satker mitra kerja binaan KPPN karena tugas asistensi/sosialisasi merupakan tugas fungsi pokok pembinaan perbendaharaan yang telah dibiayai oleh DIPA KPPN (potensi benturan kepentingan)', isCorrect: true },
      { id: 'opt_c', label: 'Boleh diterima asalkan dipotong pajak penghasilan PPh 21 sebesar 15%' },
      { id: 'opt_d', label: 'Boleh diterima asalkan disumbangkan ke panti asuhan tanpa tanda terima' }
    ],
    correctAnswerId: 'opt_b',
    correctAnswerLabel: 'Pegawai KPPN DILARANG menerima honorarium narasumber dari satker mitra kerja binaan KPPN karena tugas asistensi/sosialisasi merupakan tugas fungsi pokok pembinaan perbendaharaan yang telah dibiayai oleh DIPA KPPN (potensi benturan kepentingan)',
    explanation: 'ANALISIS KASUS MENDALAM:\n1. Berdasarkan PMK No. 227/PMK.09/2021 dan Keputusan Menteri Keuangan tentang Standar Biaya Masukan (SBM), pejabat/pegawai DJPb dilarang menerima honorarium narasumber dari satuan kerja mitra kerja dalam wilayah kerjanya.\n2. Memberikan edukasi, bimbingan teknis, dan asistensi kepada satker adalah tugas pokok dan fungsi (Tupoksi) KPPN dalam kapasitasnya sebagai Kuasa Bendahara Umum Negara (BUN).\n3. Pelaksanaan tugas tersebut sudah melekat pada gaji dan remunerasi pegawai, serta dibiayai dari DIPA KPPN. Menerima honorarium dari satker binaan menciptakan benturan kepentingan (conflict of interest) dan merusak independensi pengujian SPM satker bersangkutan.',
    legalBasis: 'PMK No. 227/PMK.09/2021 tentang Pengendalian Gratifikasi di Lingkungan Kemenkeu; KMK No. 423/KMK.01/2021 tentang Pedoman Penerapan Tata Kelola Terintegrasi.',
    keyTakeaways: [
      'Aparatur perbendaharaan tidak boleh menerima honor narasumber dari satker binaan wilayah kerjanya',
      'Asistensi dan bimtek satker adalah kewajiban layanan gratis KPPN',
      'Mencegah benturan kepentingan adalah benteng pertahanan integritas WBK/WBBM'
    ],
    tags: ['HOTS', 'Integritas', 'Benturan Kepentingan', 'Gratifikasi', 'SBM', 'Analisis'],
    isOfficial: true
  },
  {
    id: 'qb_hots_005',
    code: 'HOTS-05',
    title: 'Analisis Risiko Kas Mengendap di Rekening Bendahara Melewati Batas Waktu',
    difficulty: 'ANALISIS_HOTS',
    topic: 'AKUNTANSI_LPJ',
    scenario: 'Dalam pemeriksaan rekonsiliasi LPJ Bendahara Pengeluaran bulan November 2026, petugas verifikasi KPPN menemukan saldo kas di rekening bank bendahara satker sebesar Rp 85.000.000,- yang berasal dari sisa dana Tambahan Uang Persediaan (TUP) yang diterbitkan pada bulan September 2026 dan belum dipertanggungjawabkan atau disetor ke kas negara.',
    question: 'Berdasarkan regulasi tata cara penatausahaan Uang Persediaan dan TUP dalam PMK 190/PMK.05/2012 jo PMK 210/PMK.05/2022, analisis pelanggaran yang terjadi dan konsekuensi administratif yang akan dijatuhkan KPPN kepada satker adalah...',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: 'Tidak ada pelanggaran karena sisa TUP boleh disimpan sampai tahun anggaran berakhir' },
      { id: 'opt_b', label: 'Pelanggaran batas waktu TUP (maksimal 1 bulan): Sisa TUP yang tidak habis wajib disetor ke Kas Negara dengan bukti SSPB. KPPN berwenang menolak permohonan TUP berikutnya dan membekukan persetujuan SPM satker bersangkutan', isCorrect: true },
      { id: 'opt_c', label: 'Uang tersebut otomatis menjadi kas cadangan satker tanpa perlu konfirmasi' },
      { id: 'opt_d', label: 'KPPN menyita rekening bendahara secara sepihak tanpa surat teguran' }
    ],
    correctAnswerId: 'opt_b',
    correctAnswerLabel: 'Pelanggaran batas waktu TUP (maksimal 1 bulan): Sisa TUP yang tidak habis wajib disetor ke Kas Negara dengan bukti SSPB. KPPN berwenang menolak permohonan TUP berikutnya dan membekukan persetujuan SPM satker bersangkutan',
    explanation: 'ANALISIS KASUS MENDALAM:\n1. Sesuai Pasal 48 PMK 190/PMK.05/2012 jo PMK 210/PMK.05/2022, dana TUP harus habis digunakan dan dipertanggungjawabkan (SPM-PTUP) paling lambat 1 (satu) bulan sejak tanggal SP2D diterbitkan, kecuali mendapat perpanjangan waktu dari Kepala KPPN.\n2. Jika dana TUP tidak habis dalam waktu 1 bulan, sisa dana TUP WAJIB disetorkan kembali ke Kas Negara melalui Surat Setoran Pengembalian Belanja (SSPB).\n3. Mengendapkan saldo kas TUP dari September hingga November tanpa izin resmi perpanjangan merupakan pelanggaran disiplin kas negara dan dapat menjadi temuan BPK serta memicu sanksi pembekuan fasilitas UP/TUP satker.',
    legalBasis: 'PMK No. 190/PMK.05/2012 jo PMK No. 210/PMK.05/2022 Pasal 48 & 49; PMK No. 182/PMK.05/2017 tentang Pengelolaan Rekening Milik Satker.',
    keyTakeaways: [
      'Masa berlaku TUP: Maksimal 1 BULAN sejak SP2D terbit',
      'Sisa TUP tidak terpakai wajib disetor ke Kas Negara via SSPB',
      'Pelanggaran mengakibatkan penolakan pengajuan TUP berikutnya'
    ],
    tags: ['HOTS', 'TUP', 'SSPB', 'Kas Mengendap', 'Akuntansi', 'Analisis'],
    isOfficial: true
  },
  {
    id: 'qb_hots_006',
    code: 'HOTS-06',
    title: 'Analisis Penolakan SPM Akibat Pagu Minus pada SAKTI & SPAN',
    difficulty: 'ANALISIS_HOTS',
    topic: 'SAKTI_DIGITAL',
    scenario: 'PPSPM Satker Kepolisian mengajukan SPM-LS Gaji Susulan sebesar Rp 42.000.000,- ke KPPN pada tanggal 20. Saat diproses di sistem SPAN KPPN, muncul notifikasi penolakan sistemik: "PAGU BELANJA MINUS PADA AKUN 511119". Operator Satker bingung karena di cetakan DIPA petikan mereka merasa pagu masih cukup.',
    question: 'Sebagai analisis teknis perbendaharaan, apakah penyebab utama kasus pagu minus ini dan bagaimana langkah penyelesaian struktural yang harus dilakukan oleh satker?',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt_a', label: 'Kesalahan server KPPN dan satker cukup menunggu 24 jam sampai sistem pulih' },
      { id: 'opt_b', label: 'Terdapat realisasi SP2D lain atau SPM yang sedang antri (in-flight) yang telah memotong pagu komitmen, atau terdapat revisi POK yang belum di-submit ke DJA/Kanwil. Solusi: Satker wajib melakukan revisi anggaran pergeseran antar subkomponen/akun belanja pegawai atau revisi pemutakhiran POK sebelum mengajukan SPM ulang', isCorrect: true },
      { id: 'opt_c', label: 'Memaksa petugas KPPN untuk bypass pagu minus secara manual' },
      { id: 'opt_d', label: 'Mengganti kode akun belanja pegawai dengan akun belanja modal agar bisa cair' }
    ],
    correctAnswerId: 'opt_b',
    correctAnswerLabel: 'Terdapat realisasi SP2D lain atau SPM yang sedang antri (in-flight) yang telah memotong pagu komitmen, atau terdapat revisi POK yang belum di-submit ke DJA/Kanwil. Solusi: Satker wajib melakukan revisi anggaran pergeseran antar subkomponen/akun belanja pegawai atau revisi pemutakhiran POK sebelum mengajukan SPM ulang',
    explanation: 'ANALISIS KASUS MENDALAM:\n1. SPAN dan SAKTI bekerja dengan prinsip Fund Reservation & Real-time Budget Checking. Sistem tidak akan pernah menerbitkan SP2D jika saldo pagu akun belanja bernilai minus.\n2. Seringkali satker hanya melihat cetakan DIPA fisik lama tanpa memperhitungkan SPM yang masih berjalan (in-flight) atau tagihan otomatis tunjangan kinerja/gaji induk yang sudah menyerap pagu akun 511119.\n3. Memaksa bypass manual tidak mungkin dilakukan pada SPAN (desain sistem strict control).\n4. Mengganti akun belanja pegawai ke belanja modal (Opsi D) adalah kejahatan anggaran.\n5. Solusi yang sah: Lakukan revisi anggaran administratif (pergeseran anggaran belanja pegawai dalam satu program/satker ke akun yang minus) melalui Kanwil DJPb / SAKTI Modul Penganggaran.',
    legalBasis: 'PMK No. 199/PMK.02/2021 tentang Tata Cara Revisi Anggaran; PMK No. 210/PMK.05/2022 tentang Tata Cara Pembayaran APBN.',
    keyTakeaways: [
      'Pagu minus menyebabkan penolakan otomatis pada SPAN/SAKTI',
      'Solusi tunggal yang legal: Revisi pergeseran pagu anggaran',
      'Selalu cek ketersediaan sisa pagu di menu FA Detail / Monitoring SAKTI sebelum menerbitkan SPM'
    ],
    tags: ['HOTS', 'SAKTI', 'SPAN', 'Pagu Minus', 'Revisi Anggaran', 'Analisis'],
    isOfficial: true
  }
];
