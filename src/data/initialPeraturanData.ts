import { PeraturanPerbendaharaanItem } from '../types';

/**
 * Default initial list is now empty as requested by user ("tidak usah ada data dummy biar diisi sendiri").
 * Admin can add regulations manually or click "Muat Contoh Regulasi" if needed.
 */
export const INITIAL_PERATURAN_LIST: PeraturanPerbendaharaanItem[] = [];

export const DUMMY_REGULATION_IDS = new Set<string>([
  'reg-pmk-62-2023',
  'reg-pmk-210-2022',
  'reg-pmk-89-2023',
  'reg-pmk-109-2023',
  'reg-pmk-178-2022',
  'reg-pmk-39-2024',
  'reg-pmk-49-2023',
  'reg-pmk-181-2022',
  'reg-pmk-213-2022',
  'reg-pmk-119-2023',
  'reg-per-13-2024',
  'reg-per-5-2024',
  'reg-per-1-2023',
  'reg-per-8-2023',
  'reg-per-21-2022',
  'reg-uu-1-2004',
  'reg-pp-45-2013',
  'reg-se-35-2023',
  'reg-pmk-190-2012',
  'reg-per-5-2022'
]);

export const SAMPLE_PERATURAN_LIST: PeraturanPerbendaharaanItem[] = [
  {
    id: 'reg-pmk-62-2023',
    nomor: 'PMK No. 62 Tahun 2023',
    tahun: 2023,
    judul: 'Perencanaan Anggaran, Pelaksanaan Anggaran, serta Akuntansi dan Pelaporan Keuangan',
    kategori: 'PMK',
    topik: ['Perencanaan & Pelaksanaan Anggaran', 'Revisi DIPA', 'Deviasi Halaman III', 'Pelaporan Keuangan'],
    tanggalDitetapkan: '2023-06-12',
    tanggalBerlaku: '2023-06-12',
    status: 'Berlaku',
    keteranganStatus: 'Mengatur simplifikasi proses bisnis perencanaan hingga pertanggungjawaban APBN berbasis digital (SAKTI).',
    ringkasan: 'Peraturan Menteri Keuangan yang menyatukan dan menyelaraskan siklus anggaran mulai dari perencanaan, pelaksanaan, penatausahaan kas, hingga akuntansi dan pelaporan keuangan kementerian/lembaga secara terintegrasi.',
    poinPenting: [
      'Penyusunan Rencana Penarikan Dana (RPD) pada Halaman III DIPA dimutakhirkan secara triwulanan dan menjadi tolok ukur IKPA Deviasi Hal III DIPA.',
      'Simplifikasi revisi anggaran kewenangan KPA satker tanpa harus persetujuan Ditjen Anggaran untuk pergeseran dalam satu output.',
      'Kewajiban penggunaan tanda tangan elektronik (TTE) tersertifikasi BSrE pada seluruh dokumen pelaksanaan anggaran di SAKTI.',
      'Ketentuan rekonsiliasi laporan keuangan berbasis MonSAKTI dan penerbitan SP2S sebagai prasyarat pertanggungjawaban APBN.'
    ],
    fileUrl: 'https://jdih.kemenkeu.go.id/download/PMK-62-2023.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/pmk-no-62-tahun-2023',
    penyusun: 'Kementerian Keuangan RI',
    isFeatured: true,
    palingSeringDicari: true,
    implikasiSatker: {
      kpa: 'Menetapkan RPD akurat dan mengendalikan deviasi realisasi bulanan di bawah deviasi toleransi 5%.',
      ppk: 'Menyusun jadwal penarikan dana per perikatan kontrak dan mengunggah dokumen SPM tepat waktu.',
      ppspm: 'Memverifikasi kesesuaian alokasi pagu belanja dan ketersediaan dana sebelum menerbitkan SPM.',
      bendahara: 'Memastikan penatausahaan kas dan pembukuan BKU selaras dengan tanggal SP2D penerbitan KPPN.'
    },
    saktiModulTerkait: ['Penganggaran', 'Komitmen', 'Pembayaran', 'Pelaporan']
  },
  {
    id: 'reg-pmk-210-2022',
    nomor: 'PMK No. 210/PMK.05/2022',
    tahun: 2022,
    judul: 'Tata Cara Pembayaran Dalam Rangka Pelaksanaan Anggaran Pendapatan dan Belanja Negara',
    kategori: 'PMK',
    topik: ['Tata Cara Pembayaran', 'SPM & SP2D', 'Uang Persediaan (UP)', 'Pembayaran Langsung (LS)'],
    tanggalDitetapkan: '2022-12-28',
    tanggalBerlaku: '2023-01-01',
    status: 'Berlaku',
    keteranganStatus: 'Mencabut PMK No. 190/PMK.05/2012 tentang Tata Cara Pembayaran Dalam Rangka Pelaksanaan APBN.',
    ringkasan: 'Regulasi fundamental pembayaran APBN terkini yang memodernisasi tata kelola pembayaran, penggunaan dokumen elektronik (e-SPM), otentikasi TTE, mekanisme rekening virtual, dan penyelesaian tagihan negara secara realtime.',
    poinPenting: [
      'Penyampaian SPM ke KPPN sepenuhnya dilakukan secara paperless melalui sistem aplikasi SAKTI dengan pengesahan digital TTE KPA/PPSPM.',
      'Batas pengujian tagihan oleh PPK maksimal 5 (lima) hari kerja setelah dokumen tagihan diterima lengkap dan benar.',
      'Batas penerbitan dan pengujian SPM oleh PPSPM maksimal 5 (lima) hari kerja setelah SPP diterima dari PPK.',
      'Pengaturan hak retensi termin pembayaran penyedia barang/jasa dan batas pendaftaran resume kontrak maksimal 3 hari kerja.'
    ],
    fileUrl: 'https://jdih.kemenkeu.go.id/download/PMK-210-PMK.05-2022.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/pmk-no-210pmk052022',
    penyusun: 'Kementerian Keuangan RI / Ditjen Perbendaharaan',
    isFeatured: true,
    palingSeringDicari: true,
    implikasiSatker: {
      kpa: 'Menunjuk pejabat perbendaharaan dan memastikan kelayakan sarana prasarana TTE SAKTI.',
      ppk: 'Wajib menerbitkan SPP dalam batas waktu 5 hari kerja setelah BAST/BAP ditandatangani.',
      ppspm: 'Wajib melakukan validasi kelengkapan dokumen pendukung dan pengujian formal/material sebelum TTE SPM.',
      bendahara: 'Memantau status penerbitan SP2D oleh KPPN di SAKTI dan segera membukukan kas.'
    },
    saktiModulTerkait: ['Pembayaran', 'Komitmen', 'Bendahara']
  },
  {
    id: 'reg-per-5-2024',
    nomor: 'PER-5/PB/2024',
    tahun: 2024,
    judul: 'Petunjuk Teknis Penilaian Indikator Kinerja Pelaksanaan Anggaran (IKPA) Belanja Kementerian Negara/Lembaga Tahun 2024',
    kategori: 'PER-DJPb',
    topik: ['IKPA', 'Deviasi Hal III', 'Capaian Output', 'Dispensasi SPM', 'Penyerapan Anggaran'],
    tanggalDitetapkan: '2024-03-27',
    tanggalBerlaku: '2024-01-01',
    status: 'Berlaku',
    keteranganStatus: 'Memutakhirkan PER-5/PB/2022 dengan penajaman formula Deviasi Hal III DIPA, batas waktu penginputan Capaian Output, dan bobot indikator.',
    ringkasan: 'Petunjuk teknis resmi Ditjen Perbendaharaan yang menjadi pedoman utama perhitungan dan evaluasi nilai kinerja pelaksanaan anggaran (IKPA) satker dan K/L pada 8 (delapan) indikator utama.',
    poinPenting: [
      'Penilaian Deviasi Halaman III DIPA dihitung per jenis belanja (51, 52, 53, 57) dengan toleransi deviasi 5% per bulan.',
      'Penginputan data Capaian Output SAKTI wajib diselesaikan maksimal hari kerja ke-5 bulan berikutnya dan konfirmasi KPPN hari kerja ke-10.',
      'Sanksi pengurang nilai IKPA untuk permohonan dispensasi penyampaian SPM di luar batas waktu normal.',
      'Target penyerapan anggaran triwulanan satker: Belanja Pegawai (20%, 50%, 75%, 95%), Belanja Barang (15%, 50%, 70%, 90%), Belanja Modal (10%, 40%, 70%, 90%).'
    ],
    fileUrl: 'https://perbendaharaan.kemenkeu.go.id/download/PER-5-PB-2024.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/per-5-pb-2024',
    penyusun: 'Direktorat Jenderal Perbendaharaan',
    isFeatured: true,
    palingSeringDicari: true,
    implikasiSatker: {
      kpa: 'Menjadwalkan monev rutin mingguan capaian 8 indikator IKPA bersama PPK dan staf perencana.',
      ppk: 'Memonitor realisasi per jenis belanja agar tepat sasaran sesuai proyeksi Hal III DIPA.',
      ppspm: 'Menolak SPP yang berpotensi kadaluarsa atau diajukan mendekati cut-off tanpa izin dispensasi.',
      bendahara: 'Menjaga revolving UP minimal 100% per bulan kalender agar nilai IKPA Pengelolaan UP sempurna (100).'
    },
    saktiModulTerkait: ['Penganggaran', 'Komitmen', 'Pembayaran', 'Capaian Output']
  },
  {
    id: 'reg-pmk-39-2024',
    nomor: 'PMK No. 39 Tahun 2024',
    tahun: 2024,
    judul: 'Standar Biaya Masukan (SBM) Tahun Anggaran 2025',
    kategori: 'PMK',
    topik: ['Standar Biaya Masukan (SBM)', 'Honorarium', 'Perjalanan Dinas', 'Uang Saku', 'Konsumsi Rapat'],
    tanggalDitetapkan: '2024-06-28',
    tanggalBerlaku: '2025-01-01',
    status: 'Berlaku',
    keteranganStatus: 'Berlaku untuk penyusunan dan pelaksanaan RKA-K/L Tahun Anggaran 2025.',
    ringkasan: 'Satuan biaya berupa harga satuan, tarif, dan indeks yang ditetapkan untuk menghasilkan biaya komponen keluaran dalam penyusunan rencana kerja anggaran dan batas tertinggi pembayaran belanja operasional/non-operasional satker.',
    poinPenting: [
      'Menetapkan batas tertinggi honorarium narasumber, moderator, panitia kegiatan seminar/sosialisasi/FGD.',
      'Penyesuaian tarif uang harian perjalanan dinas dalam negeri per provinsi (biaya makan, transport lokal, dan uang saku).',
      'Pengaturan batas maksimal biaya penginapan hotel perjalanan dinas berdasarkan eselonisasi dan golongan PNS/PPPK.',
      'Ketentuan biaya konsumsi rapat (snack & makan) di dalam kantor maupun paket meeting luar kantor (fullboard/fullday/halfday).'
    ],
    fileUrl: 'https://jdih.kemenkeu.go.id/download/PMK-39-2024.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/pmk-no-39-tahun-2024',
    penyusun: 'Kementerian Keuangan RI',
    isFeatured: true,
    palingSeringDicari: true,
    implikasiSatker: {
      kpa: 'Memastikan seluruh belanja kegiatan tidak melampaui plafon pagu dan pagu unit cost SBM.',
      ppk: 'Menguji bukti kuitansi pertanggungjawaban perjalanan dinas dan honorarium agar tidak melebihi pagu batas tertinggi.',
      ppspm: 'Memeriksa keabsahan lampiran daftar hadir dan kuitansi sesuai tarif SBM provinsi yang berlaku.',
      bendahara: 'Memungut dan menyetorkan PPh Pasal 21 atas honorarium narasumber/pegawai sesuai ketentuan pajak.'
    },
    saktiModulTerkait: ['Pembayaran', 'Komitmen', 'Bendahara']
  },
  {
    id: 'reg-pmk-49-2023',
    nomor: 'PMK No. 49 Tahun 2023',
    tahun: 2023,
    judul: 'Standar Biaya Masukan (SBM) Tahun Anggaran 2024',
    kategori: 'PMK',
    topik: ['Standar Biaya Masukan (SBM)', 'Perjalanan Dinas', 'Honorarium', 'Uang Makan Lembur'],
    tanggalDitetapkan: '2023-04-28',
    tanggalBerlaku: '2024-01-01',
    status: 'Berlaku',
    keteranganStatus: 'Dasar pelaksanaan pembayaran anggaran belanja satker selama TA 2024.',
    ringkasan: 'Standar biaya masukan yang menjadi acuan penyusunan dan pengujian kewajaran pertanggungjawaban belanja satker untuk Tahun Anggaran 2024.',
    poinPenting: [
      'Tarif uang harian perjalanan dinas Jawa Tengah dan sekitarnya serta batas penginapan dinas.',
      'Ketentuan uang makan dan uang lembur bagi ASN, TNI, POLRI, dan tenaga non-ASN.',
      'Satuan biaya sewa kendaraan dinas pejabat dan kendaraan operasional satker.',
      'Honorarium pengelola keuangan satker (KPA, PPK, PPSPM, Bendahara Pengeluaran, Pejabat Pengadaan).'
    ],
    fileUrl: 'https://jdih.kemenkeu.go.id/download/PMK-49-2023.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/pmk-no-49-tahun-2023',
    penyusun: 'Kementerian Keuangan RI',
    isFeatured: false,
    palingSeringDicari: false,
    implikasiSatker: {
      ppk: 'Memedomani standar tarif SBM TA 2024 dalam setiap penerbitan surat tugas dan kuitansi.',
      bendahara: 'Melakukan pembayaran sesuai bukti riil atau lumpsum sesuai kategori belanja SBM.'
    },
    saktiModulTerkait: ['Pembayaran', 'Bendahara']
  },
  {
    id: 'reg-pmk-178-2018',
    nomor: 'PMK No. 178/PMK.05/2018 jo PMK 43/PMK.05/2020',
    tahun: 2020,
    judul: 'Mekanisme Pelaksanaan Pembayaran atas Beban APBN dengan Menggunakan Uang Persediaan (UP)',
    kategori: 'PMK',
    topik: ['Uang Persediaan (UP)', 'Revolving UP (GUP)', 'Tambahan UP (TUP)', 'Batas Waktu 30 Hari'],
    tanggalDitetapkan: '2020-04-24',
    tanggalBerlaku: '2020-04-24',
    status: 'Berlaku',
    keteranganStatus: 'Mengatur formula besaran UP, kewajiban revolving bulanan, dan proporsi KKP (60% KKP dan 40% Tunai).',
    ringkasan: 'Ketentuan dasar pemberian dan pertanggungjawaban Uang Persediaan (UP) dan Tambahan UP (TUP) bagi satker pengguna APBN melalui KPPN mitra.',
    poinPenting: [
      'Besaran UP satker maksimal 1/12 pagu belanja operasional (dapat sampai Rp 100 juta s.d. Rp 500 juta sesuai jenjang pagu).',
      'Kewajiban revolving UP (pengajuan SPM GUP) minimal 1 (satu) kali dalam 1 (satu) bulan kalender.',
      'Sanksi pemotongan saldo UP sebesar 25% atau 50% jika satker tidak melakukan GUP selama lebih dari 30 (tiga puluh) hari kalender berturut-turut.',
      'TUP wajib habis digunakan dan dipertanggungjawabkan (SPM Pertanggungjawaban TUP / PTUP) maksimal 30 hari kalender sejak SP2D terbit.'
    ],
    fileUrl: 'https://jdih.kemenkeu.go.id/download/PMK-178-PMK.05-2018.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/pmk-no-178pmk052018',
    penyusun: 'Kementerian Keuangan RI',
    isFeatured: true,
    palingSeringDicari: true,
    implikasiSatker: {
      kpa: 'Menetapkan besaran alokasi UP dan mengawasi agar revolving tidak melampaui batas 30 hari.',
      ppk: 'Segera menguji kuitansi pengeluaran UP dari bendahara agar SPP GUP dapat diterbitkan cepat.',
      bendahara: 'Memantau saldo kas tunai/bank UP dan tidak membiarkan dana idle mengendap lebih dari 30 hari kalender.'
    },
    saktiModulTerkait: ['Bendahara', 'Pembayaran']
  },
  {
    id: 'reg-pmk-196-2018',
    nomor: 'PMK No. 196/PMK.05/2018 jo PMK 97/PMK.05/2021',
    tahun: 2021,
    judul: 'Tata Cara Pembayaran dan Penggunaan Kartu Kredit Pemerintah (KKP)',
    kategori: 'PMK',
    topik: ['Kartu Kredit Pemerintah (KKP)', 'Transaksi Cashless', 'GUP KKP', 'Batas Belanja KKP'],
    tanggalDitetapkan: '2021-07-27',
    tanggalBerlaku: '2021-07-27',
    status: 'Berlaku',
    keteranganStatus: 'Memperluas fleksibilitas plafon KKP, KKP Domestik (QRIS), dan tata cara penyelesaian tagihan KKP melalui Bank Penerbit.',
    ringkasan: 'Panduan operasional penggunaan KKP untuk keperluan belanja operasional barang/jasa dan perjalanan dinas jabatan guna meminimalkan penggunaan uang tunai (cashless society).',
    poinPenting: [
      'Porsi UP KKP ditetapkan sebesar 40% dari total UP satker (dapat dimohonkan penyesuaian porsi kepada Kepala KPPN).',
      'Penggunaan KKP mencakup belanja barang operasional s.d. Rp 50 juta dan perjalanan dinas jabatan tiket/hotel.',
      'Pemegang KKP wajib menyampaikan Surat Tagihan Sementara dan bukti belanja kepada PPK maksimal 2 hari kerja.',
      'SPM-GUP KKP diterbitkan langsung ke rekening penampungan Bank Penerbit KKP sebelum jatuh tempo e-Billing (bebas bunga & denda).'
    ],
    fileUrl: 'https://jdih.kemenkeu.go.id/download/PMK-196-PMK.05-2018.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/pmk-no-196pmk052018',
    penyusun: 'Kementerian Keuangan RI',
    isFeatured: true,
    palingSeringDicari: true,
    implikasiSatker: {
      ppk: 'Meneliti kesesuaian transaksi KKP dengan daftar tagihan e-statement bank mitra satker.',
      bendahara: 'Melakukan monitoring berkala tagihan KKP dan memproses SPM GUP KKP sebelum tanggal jatuh tempo tagihan bank.'
    },
    saktiModulTerkait: ['Bendahara', 'Pembayaran', 'Komitmen']
  },
  {
    id: 'reg-pmk-58-2022',
    nomor: 'PMK No. 58/PMK.03/2022',
    tahun: 2022,
    judul: 'Penunjukan Pihak Lain Sebagai Pemungut Pajak dan Tata Cara Pemungutan, Penyetoran, dan Pelaporan Pajak Melalui Sistem Pengadaan Pemerintah (Digipay)',
    kategori: 'PMK',
    topik: ['Digipay Satu', 'Pajak Pengadaan', 'Marketplace Pemerintah', 'Pajak Otomatis'],
    tanggalDitetapkan: '2022-03-30',
    tanggalBerlaku: '2022-05-01',
    status: 'Berlaku',
    keteranganStatus: 'Memberikan kepastian hukum perpajakan transaksi UMKM melalui Digipay Satu Kemenkeu.',
    ringkasan: 'Regulasi penunjukan sistem marketplace Digipay Satu sebagai pemungut dan penyetor PPh Pasal 22 dan PPN secara otomatis atas transaksi belanja barang pemerintah dengan UMKM mitra.',
    poinPenting: [
      'Transaksi belanja APBN melalui Digipay otomatis dipotong dan disetorkan pajaknya oleh sistem perbankan mitra.',
      'Satker dibebaskan dari kewajiban membuat bukti potong manual PPh dan PPN pada transaksi Digipay yang sudah tervalidasi.',
      'Mendorong optimalisasi belanja produk dalam negeri (P3DN) dan pemberdayaan pelaku UMKM lokal di wilayah kerja KPPN.'
    ],
    fileUrl: 'https://jdih.kemenkeu.go.id/download/PMK-58-PMK.03-2022.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/pmk-no-58pmk032022',
    penyusun: 'Kementerian Keuangan RI',
    isFeatured: false,
    palingSeringDicari: true,
    implikasiSatker: {
      ppk: 'Mengalokasikan paket belanja pengadaan non-tender di bawah Rp 50 juta/Rp 200 juta melalui platform Digipay Satu.',
      bendahara: 'Memantau mutasi Virtual Account Digipay dan memastikan pendebetan kas berjalan lancar.'
    },
    saktiModulTerkait: ['Bendahara', 'Pembayaran']
  },
  {
    id: 'reg-pmk-211-2019',
    nomor: 'PMK No. 211/PMK.05/2019 jo PMK 216/PMK.05/2022',
    tahun: 2022,
    judul: 'Tata Cara Penilaian Kompetensi bagi Pejabat Pembuat Komitmen (PPK) dan Pejabat Penandatangan Surat Perintah Membayar (PPSPM)',
    kategori: 'PMK',
    topik: ['Sertifikasi Pejabat', 'Kompetensi PPK', 'Kompetensi PPSPM', 'Sertifikat PTP / BNT'],
    tanggalDitetapkan: '2022-12-30',
    tanggalBerlaku: '2023-01-01',
    status: 'Berlaku',
    keteranganStatus: 'Mengatur relaksasi dan batas waktu kewajiban kepemilikan Sertifikat Kompetensi bagi PPK dan PPSPM satker APBN.',
    ringkasan: 'Standar kompetensi resmi Kementerian Keuangan yang mewajibkan seluruh pejabat perbendaharaan (PPK dan PPSPM) memiliki sertifikat keahlian dari Ditjen Perbendaharaan / BPPK guna menjamin akuntabilitas pengeluaran negara.',
    poinPenting: [
      'PPK wajib memiliki sertifikat kompetensi PPK (SNT-PPK atau PTP-PPK).',
      'PPSPM wajib memiliki sertifikat kompetensi PPSPM (SNT-PPSPM atau PTP-PPSPM).',
      'Ketentuan pengalihan sertifikasi melalui jalur penyetaraan pelatihan dan uji kompetensi berkala.',
      'Sanksi penolakan pengajuan SPM oleh KPPN apabila pejabat yang menerbitkan belum bersertifikat kompetensi sesuai jadwal transisi regulasi.'
    ],
    fileUrl: 'https://jdih.kemenkeu.go.id/download/PMK-211-PMK.05-2019.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/pmk-no-211pmk052019',
    penyusun: 'Kementerian Keuangan RI',
    isFeatured: true,
    palingSeringDicari: false,
    implikasiSatker: {
      kpa: 'Mendaftarkan pejabat PPK dan PPSPM yang belum bersertifikat untuk mengikuti diklat & sertifikasi resmi di Kemenkeu Learning Center (KLC).',
      ppk: 'Menyelesaikan perpanjangan masa berlaku sertifikat kompetensi tepat waktu.',
      ppspm: 'Menyimpan dan mengunggah dokumen nomor registrasi sertifikat pada data master pejabat SAKTI.'
    },
    saktiModulTerkait: ['Administrasi', 'Komitmen', 'Pembayaran']
  },
  {
    id: 'reg-pmk-162-2013',
    nomor: 'PMK No. 162/PMK.05/2013 jo PMK 230/PMK.05/2016',
    tahun: 2016,
    judul: 'Kedudukan dan Tanggung Jawab Bendahara pada Satuan Kerja Pengelola Anggaran Pendapatan dan Belanja Negara',
    kategori: 'PMK',
    topik: ['Tanggung Jawab Bendahara', 'Laporan Pertanggungjawaban (LPJ)', 'BKU & Kas', 'Batas Tanggal 10'],
    tanggalDitetapkan: '2016-12-30',
    tanggalBerlaku: '2017-01-01',
    status: 'Berlaku',
    keteranganStatus: 'Pedoman utama penatausahaan kas, pembukuan buku kas umum (BKU), dan penyusunan LPJ Bendahara Pengeluaran & Penerimaan.',
    ringkasan: 'Regulasi pokok mengenai tugas, kewenangan, larangan, penatausahaan uang negara di kas bendahara, rekonsiliasi internal dengan PPK, dan penyampaian LPJ Bendahara ke KPPN.',
    poinPenting: [
      'Penyampaian LPJ Bendahara ke KPPN wajib dilakukan paling lambat tanggal 10 (sepuluh) bulan berikutnya.',
      'LPJ Bendahara disusun berdasarkan BKU, Buku Pembantu Kas, Buku Pembantu Bank, Buku Pembantu Pajak, dan Berita Acara Pemeriksaan Kas.',
      'Sanksi pengenaan Surat Peringatan (SP) dan penundaan penerbitan SP2D UP/GUP/TUP jika satker terlambat menyampaikan LPJ.',
      'Larangan menyimpan uang APBN dalam rekening pribadi atau rekening selain yang telah mendapatkan izin resmi Kementerian Keuangan.'
    ],
    fileUrl: 'https://jdih.kemenkeu.go.id/download/PMK-162-PMK.05-2013.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/pmk-no-162pmk052013',
    penyusun: 'Kementerian Keuangan RI',
    isFeatured: true,
    palingSeringDicari: true,
    implikasiSatker: {
      kpa: 'Melakukan pemeriksaan kas (cash opname) berkala sekurang-kurangnya 1 (satu) kali dalam sebulan.',
      bendahara: 'Menutup BKU setiap akhir bulan, melakukan rekonsiliasi rekening bank, dan mengunggah ADK LPJ ke SAKTI sebelum tanggal 10.'
    },
    saktiModulTerkait: ['Bendahara']
  },
  {
    id: 'reg-pmk-128-2021',
    nomor: 'PMK No. 128/PMK.05/2021',
    tahun: 2021,
    judul: 'Pedoman Rekonsiliasi dan Penyusunan Laporan Keuangan Lingkup Bendahara Umum Negara dan Kementerian Negara/Lembaga',
    kategori: 'PMK',
    topik: ['Rekonsiliasi', 'MonSAKTI', 'Laporan Keuangan', 'Surat Keterangan Rekonsiliasi (SP2S)'],
    tanggalDitetapkan: '2021-09-24',
    tanggalBerlaku: '2021-09-24',
    status: 'Berlaku',
    keteranganStatus: 'Mengatur tata cara rekonsiliasi elektronik bulanan secara otomatis melalui aplikasi MonSAKTI.',
    ringkasan: 'Pedoman resmi pelaksanaan rekonsiliasi data transaksi keuangan antara UAKPA dengan KPPN selaku Kuasa BUN, penyelesaian to-do list MonSAKTI, dan penerbitan Surat Hasil Rekonsiliasi (SP2S/SP3S).',
    poinPenting: [
      'Rekonsiliasi data transaksi keuangan dilakukan secara elektronik (e-Rekon) melalui aplikasi MonSAKTI.',
      'Batas waktu penyelesaian rekonsiliasi bulanan ditetapkan setiap bulan sesuai jadwal kalender kerja DJPb.',
      'Satker yang tidak menyelesaikan rekonsiliasi tepat waktu diterbitkan Surat Pemberitahuan Pengenaan Sanksi (SP3S) berupa pemblokiran penerbitan SP2D.',
      'Kewajiban pencocokan saldo kas, realisasi anggaran belanja, pengembalian belanja, dan persediaan/aset tetap.'
    ],
    fileUrl: 'https://jdih.kemenkeu.go.id/download/PMK-128-PMK.05-2021.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/pmk-no-128pmk052021',
    penyusun: 'Kementerian Keuangan RI',
    isFeatured: false,
    palingSeringDicari: false,
    implikasiSatker: {
      kpa: 'Menandatangani Berita Acara Rekonsiliasi dan Laporan Keuangan Semesteran/Tahunan.',
      bendahara: 'Memastikan saldo kas di bendahara pengeluaran sama persis dengan saldo kas yang dilaporkan pada neraca GLP SAKTI.'
    },
    saktiModulTerkait: ['Pelaporan', 'Bendahara', 'Aset Tetap', 'Persediaan']
  },
  {
    id: 'reg-per-13-2024',
    nomor: 'PER-13/PB/2024',
    tahun: 2024,
    judul: 'Pedoman Pelaksanaan Penerimaan dan Pengeluaran Negara pada Akhir Tahun Anggaran 2024',
    kategori: 'PER-DJPb',
    topik: ['Langkah-langkah Akhir Tahun (LLAT)', 'Batas Waktu SPM Akhir Tahun', 'Bank Garansi', 'RPD Harian'],
    tanggalDitetapkan: '2024-09-18',
    tanggalBerlaku: '2024-09-18',
    status: 'Berlaku',
    keteranganStatus: 'Pedoman LLAT yang berlaku wajib bagi seluruh satker mitra kerja KPPN pada triwulan IV TA 2024.',
    ringkasan: 'Peraturan Direktur Jenderal Perbendaharaan yang mengatur jadwal batas akhir penerimaan dokumen pendaftaran kontrak, pengajuan SPM-LS Kontraktual, SPM Non-Kontraktual, pengajuan TUP, dan penatausahaan sisa kas UP/TUP akhir tahun.',
    poinPenting: [
      'Batas akhir penyampaian data kontrak baru yang berakhir masa pelaksanaannya pada bulan Desember.',
      'Pengajuan SPM-LS dengan jaminan bank garansi / asuransi untuk pekerjaan kontraktual yang belum rampung 100% pada cut-off.',
      'Jadwal cut-off penyampaian SPM GUP Nihil dan penyetoran sisa kas UP/TUP ke kas negara melalui MPN paling lambat 31 Desember.',
      'Ketentuan penerbitan Rencana Penarikan Dana (RPD) Harian untuk SPM dengan nominal besar di atas Rp 5 Miliar / Rp 10 Miliar.'
    ],
    fileUrl: 'https://perbendaharaan.kemenkeu.go.id/download/PER-13-PB-2024.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/per-13-pb-2024',
    penyusun: 'Direktorat Jenderal Perbendaharaan',
    isFeatured: true,
    palingSeringDicari: true,
    implikasiSatker: {
      kpa: 'Menyusun time-schedule pelaksanaan kegiatan akhir tahun dan berkoordinasi intensif dengan seksi pencairan dana KPPN.',
      ppk: 'Menyelesaikan penilaian progres fisik lapangan pekerjaan kontraktual sebelum tanggal cut-off LLAT.',
      ppspm: 'Memastikan SPM akhir tahun diajukan sebelum jam loket ditutup untuk menghindari penolakan sistem.',
      bendahara: 'Menyetor seluruh sisa kas UP/TUP ke kas negara sebelum tahun anggaran berakhir.'
    },
    saktiModulTerkait: ['Pembayaran', 'Komitmen', 'Bendahara']
  },
  {
    id: 'reg-per-3-2024',
    nomor: 'PER-3/PB/2024',
    tahun: 2024,
    judul: 'Petunjuk Teknis Pembayaran Penghasilan bagi Pegawai Pemerintah dengan Perjanjian Kerja (PPPK)',
    kategori: 'PER-DJPb',
    topik: ['Gaji Induk PPPK', 'Penghasilan PPPK', 'SPM Gaji', 'Rekonsiliasi Gaji'],
    tanggalDitetapkan: '2024-02-15',
    tanggalBerlaku: '2024-02-15',
    status: 'Berlaku',
    keteranganStatus: 'Standar baku pemrosesan belanja pegawai PPPK pada aplikasi GPP/SAKTI.',
    ringkasan: 'Petunjuk teknis resmi mengenai tata cara pengujian, pembuatan Surat Perintah Membayar (SPM) Gaji Induk dan Gaji Susulan PPPK, pemotongan iuran BPJS Kesehatan dan Taspen, serta batas waktu penyampaian SPM ke KPPN.',
    poinPenting: [
      'SPM Gaji Induk PPPK wajib diajukan ke KPPN paling lambat tanggal 15 bulan sebelum bulan pembayaran.',
      'Komponen penghasilan PPPK mencakup gaji pokok, tunjangan keluarga, tunjangan pangan, tunjangan jabatan/umum, dan tunjangan lainnya.',
      'Kewajiban pemotongan iuran jaminan kesehatan 5% dan program jaminan hari tua sesuai ketentuan perundang-undangan.',
      'Prosedur rekonsiliasi data kepegawaian PPPK antara aplikasi instansi dengan modul pembayaran SAKTI.'
    ],
    fileUrl: 'https://perbendaharaan.kemenkeu.go.id/download/PER-3-PB-2024.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/per-3-pb-2024',
    penyusun: 'Direktorat Jenderal Perbendaharaan',
    isFeatured: false,
    palingSeringDicari: true,
    implikasiSatker: {
      ppk: 'Memastikan SK pengangkatan PPPK dan perjanjian kerja sudah terekam sempurna pada modul komitmen & GPP.',
      ppspm: 'Menerbitkan SPM Gaji Induk PPPK tepat waktu sebelum tanggal 15 setiap bulannya.'
    },
    saktiModulTerkait: ['Pembayaran', 'Komitmen']
  },
  {
    id: 'reg-pp-45-2013',
    nomor: 'PP No. 45 Tahun 2013 jo PP 50 Tahun 2018',
    tahun: 2018,
    judul: 'Tata Cara Pelaksanaan Anggaran Pendapatan dan Belanja Negara (APBN)',
    kategori: 'PP / UU',
    topik: ['Pelaksanaan APBN', 'Kewenangan KPA', 'PPK & PPSPM', 'Pengujian Tagihan'],
    tanggalDitetapkan: '2018-12-07',
    tanggalBerlaku: '2018-12-07',
    status: 'Berlaku',
    keteranganStatus: 'Peraturan Pemerintah payung hukum tertinggi tata kelola perbendaharaan negara di tingkat operasional.',
    ringkasan: 'Peraturan Pemerintah yang mengatur prinsip pemisahan kewenangan administratif dan perbendaharaan (ordenator dan comptable), hierarki tugas KPA, PPK, PPSPM, Bendahara Pengeluaran, hak tagih atas negara, dan tanggung jawab hukum pengelolaan keuangan negara.',
    poinPenting: [
      'Pemisahan tegas fungsi pembuat komitmen (PPK) dengan pejabat yang melakukan verifikasi dan penandatangan SPM (PPSPM).',
      'Kewajiban pengujian aspek teknis, administratif, dan ketersediaan anggaran sebelum perintah bayar diterbitkan.',
      'Ketentuan masa kedaluwarsa tagihan atas beban APBN selama 5 (lima) tahun sejak timbulnya hak tagih.',
      'Tanggung jawab pribadi pejabat pengelola perbendaharaan atas kerugian negara yang timbul akibat kelalaian atau kesengajaan.'
    ],
    fileUrl: 'https://jdih.kemenkeu.go.id/download/PP-45-2013.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/pp-no-45-tahun-2013',
    penyusun: 'Presiden Republik Indonesia',
    isFeatured: true,
    palingSeringDicari: false,
    implikasiSatker: {
      kpa: 'Menjalankan fungsi pengawasan dan pengendalian internal atas seluruh pengeluaran anggaran di satkernya.',
      ppk: 'Memastikan seluruh perikatan dan kontrak pengadaan didukung dana yang cukup dalam DIPA.',
      ppspm: 'Melakukan pengujian kebenaran materiil dan formal atas tagihan yang diajukan oleh PPK.'
    },
    saktiModulTerkait: ['Penganggaran', 'Komitmen', 'Pembayaran', 'Bendahara']
  },
  {
    id: 'reg-uu-1-2004',
    nomor: 'Undang-Undang No. 1 Tahun 2004',
    tahun: 2004,
    judul: 'Perbendaharaan Negara',
    kategori: 'PP / UU',
    topik: ['Undang-Undang Pokok', 'Perbendaharaan Negara', 'BUN & Kuasa BUN', 'Kas Negara'],
    tanggalDitetapkan: '2004-01-14',
    tanggalBerlaku: '2004-01-14',
    status: 'Berlaku',
    keteranganStatus: 'Undang-Undang pilar utama reformasi manajemen keuangan dan perbendaharaan negara Republik Indonesia.',
    ringkasan: 'Undang-Undang yang mengatur ruang lingkup perbendaharaan negara, asas umum penatausahaan uang dan barang milik negara, kedudukan Menteri Keuangan selaku Bendahara Umum Negara (BUN), serta kedudukan KPPN sebagai Kuasa BUN di daerah.',
    poinPenting: [
      'Prinsip satu rekening kas umum negara (Treasury Single Account / TSA).',
      'Kewenangan Kuasa BUN (KPPN) dalam menerbitkan Surat Perintah Pencairan Dana (SP2D) atas beban Kas Negara.',
      'Larangan penyitaan terhadap uang dan barang milik negara.',
      'Ketentuan ganti rugi negara atas perbuatan melanggar hukum yang merugikan keuangan negara.'
    ],
    fileUrl: 'https://jdih.kemenkeu.go.id/download/UU-1-2004.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/uu-no-1-tahun-2004',
    penyusun: 'Dewan Perwakilan Rakyat & Presiden RI',
    isFeatured: true,
    palingSeringDicari: false,
    implikasiSatker: {
      kpa: 'Memegang tanggung jawab hukum dan manajerial atas pengelolaan anggaran kementerian/lembaga.',
      bendahara: 'Bertanggung jawab secara pribadi atas uang negara yang berada dalam pengelolaannya.'
    },
    saktiModulTerkait: ['Semua Modul SAKTI']
  },
  {
    id: 'reg-se-10-2024',
    nomor: 'SE-10/PB/2024',
    tahun: 2024,
    judul: 'Petunjuk Operasional Batas Waktu Penerimaan dan Pemrosesan SPM pada KPPN',
    kategori: 'KEP / SE',
    topik: ['Surat Edaran', 'Dispensasi SPM', 'Jam Layanan KPPN', 'Batas Waktu Pengajuan'],
    tanggalDitetapkan: '2024-05-10',
    tanggalBerlaku: '2024-05-10',
    status: 'Berlaku',
    keteranganStatus: 'Panduan operasional harian bagi Front Office dan Seksi Pencairan Dana KPPN.',
    ringkasan: 'Surat Edaran Direktur Jenderal Perbendaharaan yang memberikan pedoman detail mengenai penanganan permohonan dispensasi SPM yang terlambat, batasan toleransi kesalahan formal, dan waktu pemrosesan SP2D.',
    poinPenting: [
      'Pengajuan dispensasi SPM hanya dapat diakomodasi untuk kondisi force majeure atau kendala sistem sentral yang telah terkonfirmasi.',
      'Ketentuan waktu penerbitan SP2D maksimal 1 jam untuk SPM Gaji Induk dan maksimal 1 hari kerja untuk SPM reguler.',
      'Pemberitahuan penolakan SPM oleh KPPN wajib disertai alasan yuridis dan teknis yang jelas dalam sistem SAKTI/SPAN.'
    ],
    fileUrl: 'https://perbendaharaan.kemenkeu.go.id/download/SE-10-PB-2024.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/se-10-pb-2024',
    penyusun: 'Direktorat Jenderal Perbendaharaan',
    isFeatured: false,
    palingSeringDicari: true,
    implikasiSatker: {
      ppspm: 'Memastikan SPM diajukan sebelum jam batas cut-off harian KPPN (pukul 15.00 WIB) agar terbit SP2D pada hari berkenaan.'
    },
    saktiModulTerkait: ['Pembayaran']
  },
  {
    id: 'reg-per-8-2023',
    nomor: 'PER-8/PB/2023',
    tahun: 2023,
    judul: 'Tata Cara Penggunaan dan Penatausahaan Rekening Virtual Pengeluaran dan Pembayaran dengan Digipay',
    kategori: 'PER-DJPb',
    topik: ['Rekening Virtual', 'Digipay', 'Cashless', 'Bendahara Pengeluaran'],
    tanggalDitetapkan: '2023-08-14',
    tanggalBerlaku: '2023-08-14',
    status: 'Berlaku',
    keteranganStatus: 'Standar penatausahaan rekening Virtual Account (VA) satker terhubung perbankan mitra Kemenkeu.',
    ringkasan: 'Petunjuk teknis pembukaan, penggunaan, pemantauan saldo, serta pelaporan rekening virtual pengeluaran untuk mendukung sistem pembayaran digital pemerintah (Digipay Satu).',
    poinPenting: [
      'Pemberian sub-rekening virtual kepada pemegang uang persediaan dan user pemesan barang di satker.',
      'Proses pemindahbukuan otomatis (auto-sweep) dari rekening induk pengeluaran ke VA transaksi.',
      'Integrasi monitoring saldo kas virtual dengan laporan buku kas pembantu bendahara di aplikasi SAKTI.'
    ],
    fileUrl: 'https://perbendaharaan.kemenkeu.go.id/download/PER-8-PB-2023.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/per-8-pb-2023',
    penyusun: 'Direktorat Jenderal Perbendaharaan',
    isFeatured: false,
    palingSeringDicari: false,
    implikasiSatker: {
      bendahara: 'Melakukan rekonsiliasi saldo virtual account harian dan mencatat transaksi ke dalam BKU SAKTI.'
    },
    saktiModulTerkait: ['Bendahara']
  },
  {
    id: 'reg-per-5-2022',
    nomor: 'PER-5/PB/2022',
    tahun: 2022,
    judul: 'Petunjuk Teknis Penilaian Indikator Kinerja Pelaksanaan Anggaran (IKPA) Belanja K/L Tahun 2022-2023',
    kategori: 'PER-DJPb',
    topik: ['IKPA', 'Reformulasi IKPA', 'Historis Regulasi', 'Evaluasi Anggaran'],
    tanggalDitetapkan: '2022-03-31',
    tanggalBerlaku: '2022-01-01',
    status: 'Mengubah',
    keteranganStatus: 'Diperbarui dan dimutakhirkan dengan PER-5/PB/2024.',
    ringkasan: 'Tonggak reformulasi IKPA yang menyederhanakan indikator pelaksanaan anggaran dari 13 indikator menjadi 8 indikator kinerja terpadu dengan fokus pada kualitas belanja dan kepatuhan waktu.',
    poinPenting: [
      'Penyederhanaan klaster indikator menjadi 3 aspek: Kualitas Perencanaan, Kualitas Pelaksanaan, dan Kualitas Hasil Belanja.',
      'Penetapan 8 indikator kinerja: Revisi DIPA, Deviasi Hal III DIPA, Penyerapan Anggaran, Belanja Kontraktual, Penyelesaian Tagihan, Pengelolaan UP/TUP, Dispensasi SPM, dan Capaian Output.'
    ],
    fileUrl: 'https://perbendaharaan.kemenkeu.go.id/download/PER-5-PB-2022.pdf',
    jdihUrl: 'https://jdih.kemenkeu.go.id/in/dokumen/peraturan/per-5-pb-2022',
    penyusun: 'Direktorat Jenderal Perbendaharaan',
    isFeatured: false,
    palingSeringDicari: false,
    saktiModulTerkait: ['Penganggaran', 'Komitmen', 'Pembayaran', 'Capaian Output']
  }
];
