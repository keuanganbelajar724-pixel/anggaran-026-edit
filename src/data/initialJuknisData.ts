import { JuknisBlangkoItem } from '../types';

export const INITIAL_JUKNIS_BLANGKO_LIST: JuknisBlangkoItem[] = [
  // ==========================================
  // 1. APLIKASI DIGIT
  // ==========================================
  {
    id: 'jb-digit-01',
    namaBlangko: 'Panduan Pendaftaran Aplikasi DIGIT',
    kategoriAplikasi: 'APLIKASI DIGIT',
    tahunRilis: '2023',
    linkDownload: 'https://digit.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Panduan aktivasi SSO Kemenkeu & pendaftaran user baru DIGIT',
    isActive: true,
    order: 1
  },

  // ==========================================
  // 2. HAI CSO PADA MONSAKTI
  // ==========================================
  {
    id: 'jb-cso-01',
    namaBlangko: 'Manual HAI CSO pada MonSAKTI level SATKER',
    kategoriAplikasi: 'HAI CSO PADA MONSAKTI',
    tahunRilis: '2024',
    linkDownload: 'https://monsakti.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Panduan pembuatan tiket kendala perbendaharaan dan konsultasi HAI CSO MonSAKTI',
    isActive: true,
    order: 2
  },

  // ==========================================
  // 3. APLIKASI TREASURY BILLING SYSTEM (TBS)
  // ==========================================
  {
    id: 'jb-tbs-01',
    namaBlangko: 'Panduan Pembuatan Billing pada Aplikasi TBS versi 2',
    kategoriAplikasi: 'APLIKASI TREASURY BILLING SYSTEM (TBS)',
    tahunRilis: '2023',
    linkDownload: 'https://tbs.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Panduan pembuatan kode billing penyetoran PNBP dan pengembalian belanja',
    isActive: true,
    order: 3
  },

  // ==========================================
  // 4. APLIKASI GAJI WEB
  // ==========================================
  {
    id: 'jb-gaji-01',
    namaBlangko: 'Panduan Pengguna Gaji Perekaman e-SKPP (Perekaman Layanan Pensiun Pertama)',
    kategoriAplikasi: 'APLIKASI GAJI WEB',
    tahunRilis: '2024',
    linkDownload: 'https://gaji.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Petunjuk pembuatan SKPP digital untuk pensiun dan mutasi PNS/PPPK',
    isActive: true,
    order: 4
  },
  {
    id: 'jb-gaji-02',
    namaBlangko: 'Panduan Penyesuaian Gaji Pokok 2024 dan Kekurangan Gaji (Rekam SK Kolektif)',
    kategoriAplikasi: 'APLIKASI GAJI WEB',
    tahunRilis: '-',
    linkDownload: 'https://gaji.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Tata cara perbaikan SK dan rapel kekurangan gaji pegawai ASN',
    isActive: true,
    order: 5
  },
  {
    id: 'jb-gaji-03',
    namaBlangko: 'Panduan Implementasi NPWP 16 Digit',
    kategoriAplikasi: 'APLIKASI GAJI WEB',
    tahunRilis: '2024',
    linkDownload: 'https://gaji.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Panduan pemutakhiran NIK menjadi NPWP 16 Digit pada modul Gaji Web',
    isActive: true,
    order: 6
  },
  {
    id: 'jb-gaji-04',
    namaBlangko: 'Panduan Pembuatan ADK eTukin untuk aplikasi Gaji Web',
    kategoriAplikasi: 'APLIKASI GAJI WEB',
    tahunRilis: '2023',
    linkDownload: 'https://gaji.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Mekanisme ekspor & impor ADK Tunjangan Kinerja pegawai instansi',
    isActive: true,
    order: 7
  },
  {
    id: 'jb-gaji-05',
    namaBlangko: 'Panduan Registrasi User Aplikasi Gaji Web',
    kategoriAplikasi: 'APLIKASI GAJI WEB',
    tahunRilis: '2023',
    linkDownload: 'https://gaji.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Pendaftaran PPABP dan pejabat pengelola belanja pegawai',
    isActive: true,
    order: 8
  },
  {
    id: 'jb-gaji-06',
    namaBlangko: 'Panduan Upload Backup GPP ke Aplikasi Gaji Web user PPABP (satker Non POLRI)',
    kategoriAplikasi: 'APLIKASI GAJI WEB',
    tahunRilis: '2023',
    linkDownload: 'https://gaji.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Sinkronisasi database GPP desktop ke cloud Gaji Web terpusat',
    isActive: true,
    order: 9
  },
  {
    id: 'jb-gaji-07',
    namaBlangko: 'Panduan Aplikasi Gaji Web (GPP Terpusat) bagi semua satker PNS Pusat (baru)',
    kategoriAplikasi: 'APLIKASI GAJI WEB',
    tahunRilis: '2021',
    linkDownload: 'https://gaji.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Overview modul gaji terpusat Kementerian/Lembaga',
    isActive: true,
    order: 10
  },
  {
    id: 'jb-gaji-08',
    namaBlangko: 'Panduan Aplikasi Gaji Web (GPP Terpusat) bagi semua satker PNS Pusat',
    kategoriAplikasi: 'APLIKASI GAJI WEB',
    tahunRilis: '2021',
    linkDownload: 'https://gaji.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Buku panduan lengkap operasional pembuatan daftar gaji bulanan',
    isActive: true,
    order: 11
  },
  {
    id: 'jb-gaji-09',
    namaBlangko: 'Panduan Proses Pembuatan Gaji Induk pada Gaji Web (semua satker PNS Pusat)',
    kategoriAplikasi: 'APLIKASI GAJI WEB',
    tahunRilis: '2023',
    linkDownload: 'https://gaji.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Prosedur cut-off dan pengiriman SPM Gaji Induk setiap tanggal 1-10',
    isActive: true,
    order: 12
  },
  {
    id: 'jb-gaji-10',
    namaBlangko: 'Template Excel untuk Upload Tunkin ke Gaji Web',
    kategoriAplikasi: 'APLIKASI GAJI WEB',
    tahunRilis: '2023',
    linkDownload: 'https://gaji.kemenkeu.go.id',
    fileFormat: 'XLSX',
    keterangan: 'Format excel resmi template tunjangan kinerja kementerian/lembaga',
    isActive: true,
    order: 13
  },
  {
    id: 'jb-gaji-11',
    namaBlangko: 'Panduan Pembuatan SKPP pada Gaji Web (semua satker PNS Pusat)',
    kategoriAplikasi: 'APLIKASI GAJI WEB',
    tahunRilis: '2023',
    linkDownload: 'https://gaji.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Surat Keterangan Penghentian Pembayaran (SKPP) mutasi/pensiun',
    isActive: true,
    order: 14
  },
  {
    id: 'jb-gaji-12',
    namaBlangko: 'Panduan Pembuatan Uang Makan dan Lembur pada Aplikasi Gaji Web',
    kategoriAplikasi: 'APLIKASI GAJI WEB',
    tahunRilis: '2022',
    linkDownload: 'https://gaji.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Perhitungan daftar uang makan PNS dan uang lembur ASN',
    isActive: true,
    order: 15
  },
  {
    id: 'jb-gaji-13',
    namaBlangko: 'Template ADK Uang Makan dan Uang Lembur untuk Impor di Gaji Web',
    kategoriAplikasi: 'APLIKASI GAJI WEB',
    tahunRilis: '2023',
    linkDownload: 'https://gaji.kemenkeu.go.id',
    fileFormat: 'CSV',
    keterangan: 'Format ADK/CSV import daftar hadir makan & lembur',
    isActive: true,
    order: 16
  },

  // ==========================================
  // 5. APLIKASI GPP DESKTOP
  // ==========================================
  {
    id: 'jb-gpp-01',
    namaBlangko: 'Panduan Upload Backup GPP ke Aplikasi Gaji Web user PPABP (satker Non Kemenag)',
    kategoriAplikasi: 'APLIKASI GPP DESKTOP',
    tahunRilis: '2023',
    linkDownload: 'https://djpb.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Proses konversi data backup .gpp ke Gaji Web SAKTI',
    isActive: true,
    order: 17
  },
  {
    id: 'jb-gpp-02',
    namaBlangko: 'Panduan Upload ADK GPP ke Aplikasi Gaji Web (satker POLRI/TNI)',
    kategoriAplikasi: 'APLIKASI GPP DESKTOP',
    tahunRilis: '2023',
    linkDownload: 'https://djpb.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Panduan integrasi gaji ADK satker jajaran POLRI dan TNI ke KPPN',
    isActive: true,
    order: 18
  },
  {
    id: 'jb-gpp-03',
    namaBlangko: 'Panduan Perekaman SKPP Desktop (khusus satker POLRI/TNI)',
    kategoriAplikasi: 'APLIKASI GPP DESKTOP',
    tahunRilis: '2023',
    linkDownload: 'https://djpb.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Juknis teknis SKPP untuk personil militer dan kepolisian',
    isActive: true,
    order: 19
  },
  {
    id: 'jb-gpp-04',
    namaBlangko: 'Panduan Perekaman SKPP menggunakan Aplikasi GPP (khusus satker POLRI/TNI)',
    kategoriAplikasi: 'APLIKASI GPP DESKTOP',
    tahunRilis: '2022',
    linkDownload: 'https://djpb.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Manual teknis verifikasi data keluarga dan tunjangan jabatan personil',
    isActive: true,
    order: 20
  },
  {
    id: 'jb-gpp-05',
    namaBlangko: 'Panduan SKPP Kolektif dan Kirim-Terima ADK Pindah (khusus satker POLRI/TNI)',
    kategoriAplikasi: 'APLIKASI GPP DESKTOP',
    tahunRilis: '2022',
    linkDownload: 'https://djpb.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Mekanisme transfer data gaji personil mutasi massal',
    isActive: true,
    order: 21
  },
  {
    id: 'jb-gpp-06',
    namaBlangko: 'Panduan Perekaman Gaji PPPK (Pegawai Pemerintah dengan Perjanjian Kerja)',
    kategoriAplikasi: 'APLIKASI GPP DESKTOP',
    tahunRilis: '2022',
    linkDownload: 'https://djpb.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Standar penggajian PPPK dan tunjangan fungsional',
    isActive: true,
    order: 22
  },
  {
    id: 'jb-gpp-07',
    namaBlangko: 'Panduan Perekaman Keluarga Lain untuk Pemotongan BPJS 1%',
    kategoriAplikasi: 'APLIKASI GPP DESKTOP',
    tahunRilis: '2022',
    linkDownload: 'https://djpb.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Iuran tambahan anggota keluarga ke-4 dan seterusnya',
    isActive: true,
    order: 23
  },

  // ==========================================
  // 6. APLIKASI PPNPN WEB
  // ==========================================
  {
    id: 'jb-ppnpn-01',
    namaBlangko: 'Panduan 1 (satu) User PPNPN Web yang mengelola Beberapa DIPA',
    kategoriAplikasi: 'APLIKASI PPNPN WEB',
    tahunRilis: '2022',
    linkDownload: 'https://djpb.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Setting multi-DIPA dalam satu profil operator PPNPN',
    isActive: true,
    order: 24
  },
  {
    id: 'jb-ppnpn-02',
    namaBlangko: 'Panduan Pendaftaran User PPNPN Web level SATKER',
    kategoriAplikasi: 'APLIKASI PPNPN WEB',
    tahunRilis: '2021',
    linkDownload: 'https://djpb.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Pembuatan akun operator dan pejabat pembuat komitmen PPNPN',
    isActive: true,
    order: 25
  },
  {
    id: 'jb-ppnpn-03',
    namaBlangko: 'Panduan Aplikasi PPNPN Web level SATKER',
    kategoriAplikasi: 'APLIKASI PPNPN WEB',
    tahunRilis: '2022',
    linkDownload: 'https://djpb.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Perekaman kontrak PPNPN, presensi, dan penerbitan SPP/SPM PPNPN',
    isActive: true,
    order: 26
  },

  // ==========================================
  // 7. APLIKASI DIGIPAY SATU
  // ==========================================
  {
    id: 'jb-digipay-01',
    namaBlangko: '1. Pendaftaran User DIGIPAYSATU & Permintaan Hak Akses',
    kategoriAplikasi: 'APLIKASI DIGIPAY SATU',
    tahunRilis: '2023',
    linkDownload: 'https://digipaysatu.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Panduan pendaftaran Admin, Pemesan, Pejabat Pengadaan, PPK, dan Bendahara di Digipay Satu',
    isActive: true,
    order: 27
  },
  {
    id: 'jb-digipay-02',
    namaBlangko: '2. Juknis Khusus Vendor (Penjual)',
    kategoriAplikasi: 'APLIKASI DIGIPAY SATU',
    tahunRilis: '2023',
    linkDownload: 'https://digipaysatu.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Panduan pendaftaran merchant UMKM rekanan pemerintah & katalog produk',
    isActive: true,
    order: 28
  },
  {
    id: 'jb-digipay-03',
    namaBlangko: '3. Juknis Khusus Satker (Pemesanan & Pengiriman Barang)',
    kategoriAplikasi: 'APLIKASI DIGIPAY SATU',
    tahunRilis: '2023',
    linkDownload: 'https://digipaysatu.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Proses checkout belanja pemerintah, verifikasi BAST, dan settlement VA/KKP',
    isActive: true,
    order: 29
  },

  // ==========================================
  // 8. JUKNIS TTE SAKTI
  // ==========================================
  {
    id: 'jb-tte-01',
    namaBlangko: 'Juknis TTE pada SAKTI & Panther versi 3.2',
    kategoriAplikasi: 'JUKNIS TTE SAKTI',
    tahunRilis: '2023',
    linkDownload: 'https://sakti.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Tata cara tanda tangan elektronik tersertifikasi BSrE pada SAKTI & installer Panther',
    isActive: true,
    order: 30
  },
  {
    id: 'jb-tte-02',
    namaBlangko: 'Juknis DS pada SAKTI',
    kategoriAplikasi: 'JUKNIS TTE SAKTI',
    tahunRilis: '2022',
    linkDownload: 'https://sakti.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Panduan Digital Signature (DS) pada modul pembayaran dan komitmen',
    isActive: true,
    order: 31
  },

  // ==========================================
  // 9. JUKNIS SAKTI KHUSUS SATKER BLU
  // ==========================================
  {
    id: 'jb-blu-01',
    namaBlangko: 'Juknis Lengkap semua Modul SAKTI khusus Satker BLU',
    kategoriAplikasi: 'JUKNIS SAKTI KHUSUS SATKER BLU',
    tahunRilis: '2022',
    linkDownload: 'https://sakti.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Buku panduan lengkap tata kelola keuangan Badan Layanan Umum (BLU)',
    isActive: true,
    order: 32
  },
  {
    id: 'jb-blu-02',
    namaBlangko: 'Juknis Perekaman SPM 511 - SP3B BLU',
    kategoriAplikasi: 'JUKNIS SAKTI KHUSUS SATKER BLU',
    tahunRilis: '2022',
    linkDownload: 'https://sakti.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Perekaman Surat Perintah Pengesahan Pendapatan & Belanja BLU (SP3B BLU)',
    isActive: true,
    order: 33
  },

  // ==========================================
  // 10. SAKTI MODUL KOMITMEN & KONTRAK
  // ==========================================
  {
    id: 'jb-kom-01',
    namaBlangko: 'Juknis Perekaman Kontrak & Pendaftaran Supplier SAKTI (Batas 5 HK)',
    kategoriAplikasi: 'SAKTI MODUL KOMITMEN & KONTRAK',
    tahunRilis: '2024',
    linkDownload: 'https://sakti.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Pedoman pendaftaran CAN/NRK kontrak ke KPPN maksimal 5 hari kerja setelah penandatanganan',
    isActive: true,
    order: 34
  },
  {
    id: 'jb-kom-02',
    namaBlangko: 'Format Template Surat Permohonan Buka Kunci / Dispensasi Kontrak',
    kategoriAplikasi: 'SAKTI MODUL KOMITMEN & KONTRAK',
    tahunRilis: '2024',
    linkDownload: 'https://sakti.kemenkeu.go.id',
    fileFormat: 'DOCX',
    keterangan: 'Blangko resmi permohonan dispensasi pendaftaran kontrak ke KPPN',
    isActive: true,
    order: 35
  },

  // ==========================================
  // 11. SAKTI MODUL PEMBAYARAN & SP2D
  // ==========================================
  {
    id: 'jb-byr-01',
    namaBlangko: 'Juknis Penyelesaian Tagihan Kontraktual Maksimal 17 Hari Kerja',
    kategoriAplikasi: 'SAKTI MODUL PEMBAYARAN & SP2D',
    tahunRilis: '2024',
    linkDownload: 'https://sakti.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Pengendalian indikator penyelesaian tagihan 17 hari kerja sejak BAST',
    isActive: true,
    order: 36
  },
  {
    id: 'jb-byr-02',
    namaBlangko: 'Format Surat Permohonan Dispensasi Pengajuan SPM Melewati Batas Waktu',
    kategoriAplikasi: 'SAKTI MODUL PEMBAYARAN & SP2D',
    tahunRilis: '2024',
    linkDownload: 'https://sakti.kemenkeu.go.id',
    fileFormat: 'DOCX',
    keterangan: 'Blangko resmi dispensasi SPM ke Kepala KPPN sesuai PER-5/PB/2024',
    isActive: true,
    order: 37
  },

  // ==========================================
  // 12. SAKTI MODUL BENDAHARA & LPJ
  // ==========================================
  {
    id: 'jb-ben-01',
    namaBlangko: 'Juknis Perekaman LPJ Bendahara Pengeluaran & Rekonsiliasi Bank',
    kategoriAplikasi: 'SAKTI MODUL BENDAHARA & LPJ',
    tahunRilis: '2024',
    linkDownload: 'https://sakti.kemenkeu.go.id',
    fileFormat: 'PDF',
    keterangan: 'Penyusunan LPJ Bendahara, berita acara kas, dan upload ke SAKTI/My Intress',
    isActive: true,
    order: 38
  },
  {
    id: 'jb-ben-02',
    namaBlangko: 'Template Berita Acara Rekonsiliasi & Pemeriksaan Kas Bendahara',
    kategoriAplikasi: 'SAKTI MODUL BENDAHARA & LPJ',
    tahunRilis: '2024',
    linkDownload: 'https://sakti.kemenkeu.go.id',
    fileFormat: 'DOCX',
    keterangan: 'Format resmi pemeriksaan kas bendahara pengeluaran secara periodik',
    isActive: true,
    order: 39
  }
];

export const JUKNIS_APPLICATION_CATEGORIES: string[] = [
  'APLIKASI DIGIT',
  'HAI CSO PADA MONSAKTI',
  'APLIKASI TREASURY BILLING SYSTEM (TBS)',
  'APLIKASI GAJI WEB',
  'APLIKASI GPP DESKTOP',
  'APLIKASI PPNPN WEB',
  'APLIKASI DIGIPAY SATU',
  'JUKNIS TTE SAKTI',
  'JUKNIS SAKTI KHUSUS SATKER BLU',
  'SAKTI MODUL KOMITMEN & KONTRAK',
  'SAKTI MODUL PEMBAYARAN & SP2D',
  'SAKTI MODUL BENDAHARA & LPJ',
  'SAKTI MODUL PELAPORAN & CAPAIAN OUTPUT',
  'BLANGKO & SURAT BEBAS / PERMOHONAN RESMI'
];
