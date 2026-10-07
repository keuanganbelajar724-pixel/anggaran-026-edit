import { LLATCategory, LLATEvent, LLATSettings, LLATStatus, LLATPrioritas } from '../types/llat';

export const DEFAULT_LLAT_CATEGORIES: LLATCategory[] = [
  { id: 'cat-gaji', nama: 'Gaji', deskripsi: 'Pembayaran Gaji Induk, Susulan, Uang Makan, Lembur, dan Tunjangan Kinerja', warna: '#10b981', is_active: true },
  { id: 'cat-spm', nama: 'SPM', deskripsi: 'Penerbitan SPM-LS Non Kontraktual, SPM Nihil, dan SPM Pengesahan', warna: '#3b82f6', is_active: true },
  { id: 'cat-kontrak', nama: 'Kontrak', deskripsi: 'Pendaftaran Data Kontrak BAST/BAPP, Jaminan Akhir Tahun, dan SPM Kontraktual', warna: '#8b5cf6', is_active: true },
  { id: 'cat-uptup', nama: 'UP/TUP', deskripsi: 'Persetujuan TUP Akhir Tahun, SPM-GUP, dan Penyetoran Sisa Kas UP/TUP', warna: '#f59e0b', is_active: true },
  { id: 'cat-penerimaan', nama: 'Penerimaan', deskripsi: 'Penyetoran Kas Penerimaan Negara Akhir Tahun', warna: '#06b6d4', is_active: true },
  { id: 'cat-pnbp', nama: 'PNBP', deskripsi: 'Maksimum Pencairan (MP) PNBP dan Penggunaan Dana PNBP', warna: '#14b8a6', is_active: true },
  { id: 'cat-hibah', nama: 'Hibah', deskripsi: 'Pengesahan Hibah Langsung Uang/Barang (SPHL/SP3HL/MPHL-BJS)', warna: '#ec4899', is_active: true },
  { id: 'cat-rekon', nama: 'Rekonsiliasi', deskripsi: 'Rekonsiliasi Eksternal MonSAKTI, Todolist, dan Penyelesaian Transaksi Gantung', warna: '#6366f1', is_active: true },
  { id: 'cat-laporan', nama: 'Pelaporan', deskripsi: 'Penyampaian LPJ Bendahara dan Laporan Keuangan Tahunan (Unaudited)', warna: '#0ea5e9', is_active: true },
  { id: 'cat-bmn', nama: 'BMN', deskripsi: 'Inventarisasi Aset, Rekonsiliasi Internal BMN & Keuangan, Tutup Periode', warna: '#84cc16', is_active: true },
  { id: 'cat-akuntansi', nama: 'Akuntansi', deskripsi: 'Jurnal Penyesuaian Akhir Tahun dan Penutupan Buku Akuntansi', warna: '#a855f7', is_active: true },
  { id: 'cat-perbendaharaan', nama: 'Perbendaharaan', deskripsi: 'Pendaftaran User SAKTI, Sertifikasi Pejabat, dan Administrasi Rekening', warna: '#f97316', is_active: true },
  { id: 'cat-lainnya', nama: 'Lainnya', deskripsi: 'Kegiatan khusus, evaluasi akhir tahun, dan koordinasi KPPN', warna: '#64748b', is_active: true }
];

export const DEFAULT_LLAT_SETTINGS: LLATSettings = {
  is_active: true,
  menu_title: 'Monitoring LLAT',
  menu_description: 'Monitoring kalender dan batas waktu Langkah-Langkah dalam Menghadapi Akhir Tahun.',
  menu_icon: '📅',
  tahun_aktif: 2026,
  version: 1,
  reminder: {
    reminder_h7: true,
    reminder_h3: true,
    reminder_h1: true,
    reminder_h0: true
  }
};

export const DEFAULT_LLAT_EVENTS_2026: LLATEvent[] = [
  {
    llat_id: 'llat-2026-001',
    tahun_anggaran: 2026,
    kode_kegiatan: 'LLAT-01',
    nama_kegiatan: 'Batas Pendaftaran Data Kontrak Tahap I (BAST/BAPP s.d. 30 November)',
    kategori: 'Kontrak',
    deskripsi: 'Penyampaian data perjanjian/kontrak dan perubahan data perjanjian/kontrak ke KPPN Semarang I untuk pekerjaan yang diselesaikan s.d. akhir November 2026.',
    tanggal_mulai: '2026-11-20',
    tanggal_batas: '2026-12-04',
    jam_batas: '17:00',
    timezone: 'WIB',
    status: 'BERJALAN',
    status_mode: 'AUTO',
    prioritas: 'PENTING',
    target_pengguna: ['SEMUA_SATKER', 'PPK', 'OPERATOR'],
    dasar_hukum: 'Peraturan Direktur Jenderal Perbendaharaan tentang Pedoman Pelaksanaan Penerimaan dan Pengeluaran Negara pada Akhir Tahun Anggaran 2026',
    nomor_peraturan: 'PER-17/PB/2025 & Juknis LLAT 2026',
    sumber_url: 'https://djpb.kemenkeu.go.id/kppn/semarang1',
    catatan: 'Pastikan NRK (Nomor Register Kontrak) dari SPAN sudah terbit sebelum mengajukan SPM Kontraktual.',
    warna: '#8b5cf6',
    urutan: 1,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    version: 1
  },
  {
    llat_id: 'llat-2026-002',
    tahun_anggaran: 2026,
    kode_kegiatan: 'LLAT-02',
    nama_kegiatan: 'Batas Pengajuan Persetujuan Tambahan Uang Persediaan (TUP) Tunai Akhir Tahun',
    kategori: 'UP/TUP',
    deskripsi: 'Penyampaian surat permohonan persetujuan TUP Tunai dan rincian rencana kebutuhan riil ke Kepala KPPN Semarang I untuk kebutuhan mendesak akhir tahun.',
    tanggal_mulai: '2026-11-25',
    tanggal_batas: '2026-12-07',
    jam_batas: '15:00',
    timezone: 'WIB',
    status: 'BERJALAN',
    status_mode: 'AUTO',
    prioritas: 'PENTING',
    target_pengguna: ['KPA', 'PPK', 'BENDAHARA'],
    dasar_hukum: 'Peraturan Menteri Keuangan Tata Cara Pembayaran atas Beban APBN & Perdirjen LLAT 2026',
    nomor_peraturan: 'PMK 62/2023 & PER-17/PB/2025',
    sumber_url: 'https://djpb.kemenkeu.go.id',
    catatan: 'Wajib melampirkan SPTJM KPA, rincian pengeluaran per akun, dan memastikan sisa pagu DIPA mencukupi.',
    warna: '#f59e0b',
    urutan: 2,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    version: 1
  },
  {
    llat_id: 'llat-2026-003',
    tahun_anggaran: 2026,
    kode_kegiatan: 'LLAT-03',
    nama_kegiatan: 'Batas Pengajuan SPM-LS Gaji Induk Bulan Januari 2027',
    kategori: 'Gaji',
    deskripsi: 'Penyampaian SPM-LS Gaji Induk PNS/TNI/Polri/PPPK beserta ADK GPP/PNS dan lampiran lengkap untuk pembayaran tanggal 1 Januari 2027.',
    tanggal_mulai: '2026-12-01',
    tanggal_batas: '2026-12-08',
    jam_batas: '17:00',
    timezone: 'WIB',
    status: 'BERJALAN',
    status_mode: 'AUTO',
    prioritas: 'KRITIS',
    target_pengguna: ['SEMUA_SATKER', 'PPSPM', 'BENDAHARA'],
    dasar_hukum: 'Petunjuk Teknis Pembayaran Gaji Induk Awal Tahun Anggaran DJPb',
    nomor_peraturan: 'PER-17/PB/2025 Lampiran II',
    sumber_url: 'https://djpb.kemenkeu.go.id',
    catatan: 'SP2D akan diberi tanggal valuta 2 Januari 2027 (hari kerja pertama). Jangan terlambat agar gaji pegawai cair tepat waktu.',
    warna: '#ef4444',
    urutan: 3,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    version: 1
  },
  {
    llat_id: 'llat-2026-004',
    tahun_anggaran: 2026,
    kode_kegiatan: 'LLAT-04',
    nama_kegiatan: 'Batas Pengajuan SPM-LS Non Kontraktual (Honor, Perjadin & Uang Makan/Lembur Nov)',
    kategori: 'SPM',
    deskripsi: 'Penyampaian SPM-LS Non-Kontraktual untuk pembayaran honorarium operasional satker, perjalanan dinas rampung, serta uang makan dan uang lembur bulan November 2026.',
    tanggal_mulai: '2026-12-01',
    tanggal_batas: '2026-12-11',
    jam_batas: '17:00',
    timezone: 'WIB',
    status: 'BERJALAN',
    status_mode: 'AUTO',
    prioritas: 'NORMAL',
    target_pengguna: ['PPK', 'PPSPM', 'OPERATOR'],
    dasar_hukum: 'Pedoman Pelaksanaan Penerimaan dan Pengeluaran Negara Akhir Tahun',
    nomor_peraturan: 'PER-17/PB/2025 Bab III',
    sumber_url: 'https://djpb.kemenkeu.go.id',
    catatan: 'Kelengkapan daftar nominatif dan bukti potong pajak harus valid di aplikasi SAKTI.',
    warna: '#3b82f6',
    urutan: 4,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    version: 1
  },
  {
    llat_id: 'llat-2026-005',
    tahun_anggaran: 2026,
    kode_kegiatan: 'LLAT-05',
    nama_kegiatan: 'Batas Pengajuan SPM-TUP Tunai / Penggantian UP (SPM-GUP) Akhir Tahun',
    kategori: 'UP/TUP',
    deskripsi: 'Penyampaian SPM TUP Tunai atas surat persetujuan TUP yang telah diterbitkan Kepala KPPN, serta SPM-GUP pengisian kembali UP operasional satker.',
    tanggal_mulai: '2026-12-05',
    tanggal_batas: '2026-12-15',
    jam_batas: '17:00',
    timezone: 'WIB',
    status: 'BERJALAN',
    status_mode: 'AUTO',
    prioritas: 'KRITIS',
    target_pengguna: ['PPSPM', 'PPK', 'BENDAHARA'],
    dasar_hukum: 'Peraturan Pengelolaan Kas dan UP Satker Akhir Tahun DJPb',
    nomor_peraturan: 'PER-17/PB/2025 Bab IV',
    sumber_url: 'https://djpb.kemenkeu.go.id',
    catatan: 'TUP yang tidak dipertanggungjawabkan tepat waktu harus disetor kembali ke Kas Negara.',
    warna: '#f59e0b',
    urutan: 5,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    version: 1
  },
  {
    llat_id: 'llat-2026-006',
    tahun_anggaran: 2026,
    kode_kegiatan: 'LLAT-06',
    nama_kegiatan: 'Batas Pendaftaran Data Kontrak Tahap II (BAST s.d. 15 Desember)',
    kategori: 'Kontrak',
    deskripsi: 'Pendaftaran kontrak baru, addendum nilai kontrak, atau jadwal termin pembayaran untuk kontrak yang penyelesaian pekerjaannya s.d. 15 Desember 2026.',
    tanggal_mulai: '2026-12-08',
    tanggal_batas: '2026-12-18',
    jam_batas: '16:30',
    timezone: 'WIB',
    status: 'BERJALAN',
    status_mode: 'AUTO',
    prioritas: 'PENTING',
    target_pengguna: ['PPK', 'PPSPM'],
    dasar_hukum: 'Peraturan Tata Kelola Belanja Kontraktual Akhir Tahun DJPb',
    nomor_peraturan: 'PER-17/PB/2025',
    sumber_url: 'https://djpb.kemenkeu.go.id',
    catatan: 'Pastikan validasi supplier dan line item kontrak sesuai DIPA sebelum batas waktu.',
    warna: '#8b5cf6',
    urutan: 6,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    version: 1
  },
  {
    llat_id: 'llat-2026-007',
    tahun_anggaran: 2026,
    kode_kegiatan: 'LLAT-07',
    nama_kegiatan: 'Batas Pengajuan SPM-LS Kontraktual dengan Jaminan / Garansi Bank (Bank Garansi)',
    kategori: 'Kontrak',
    deskripsi: 'Penyampaian SPM-LS Kontraktual untuk pekerjaan yang belum selesai 100% per 21 Desember 2026 namun dijamin dengan Garansi Bank/Asuransi yang telah diverifikasi KPPN.',
    tanggal_mulai: '2026-12-10',
    tanggal_batas: '2026-12-21',
    jam_batas: '17:00',
    timezone: 'WIB',
    status: 'BERJALAN',
    status_mode: 'AUTO',
    prioritas: 'KRITIS',
    target_pengguna: ['PPK', 'PPSPM', 'KPA'],
    dasar_hukum: 'Ketentuan Penyerahan Jaminan Pembayaran Akhir Tahun DJPb',
    nomor_peraturan: 'PMK 109/2023 & PER-17/PB/2025',
    sumber_url: 'https://djpb.kemenkeu.go.id',
    catatan: 'Asli Surat Jaminan Pembayaran (Bank Garansi) wajib diserahkan fisik dan diverifikasi ke Seksi Pencairan Dana KPPN Semarang I.',
    warna: '#ef4444',
    urutan: 7,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    version: 1
  },
  {
    llat_id: 'llat-2026-008',
    tahun_anggaran: 2026,
    kode_kegiatan: 'LLAT-08',
    nama_kegiatan: 'Batas Pengajuan SPM-LS Honorarium & Tunjangan Kinerja Bulan Desember',
    kategori: 'Gaji',
    deskripsi: 'Penyampaian SPM-LS untuk Tukin bulan Desember, kekurangan gaji, honor output kegiatan, dan lembur Desember 2026.',
    tanggal_mulai: '2026-12-14',
    tanggal_batas: '2026-12-22',
    jam_batas: '17:00',
    timezone: 'WIB',
    status: 'BERJALAN',
    status_mode: 'AUTO',
    prioritas: 'PENTING',
    target_pengguna: ['PPK', 'PPSPM', 'BENDAHARA'],
    dasar_hukum: 'Pedoman Pembayaran Belanja Pegawai Non-Gaji Akhir Tahun',
    nomor_peraturan: 'PER-17/PB/2025',
    sumber_url: 'https://djpb.kemenkeu.go.id',
    catatan: 'Perhitungan estimasi hari kerja s.d. akhir bulan harus sesuai dengan ketentuan jam kerja dinas.',
    warna: '#10b981',
    urutan: 8,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    version: 1
  },
  {
    llat_id: 'llat-2026-009',
    tahun_anggaran: 2026,
    kode_kegiatan: 'LLAT-09',
    nama_kegiatan: 'Batas Pengajuan SPM Pengesahan Hibah (SP3HL / SPHL / MPHL-BJS) Triwulan IV',
    kategori: 'Hibah',
    deskripsi: 'Penyampaian SPM Pengesahan atas realisasi hibah langsung uang, barang, atau jasa yang diterima Satker selama Triwulan IV 2026.',
    tanggal_mulai: '2026-12-15',
    tanggal_batas: '2026-12-23',
    jam_batas: '15:00',
    timezone: 'WIB',
    status: 'BERJALAN',
    status_mode: 'AUTO',
    prioritas: 'NORMAL',
    target_pengguna: ['KPA', 'PPK', 'PPSPM'],
    dasar_hukum: 'Pengelolaan Hibah Pemerintah & Peraturan Pengesahan Akhir Tahun',
    nomor_peraturan: 'PMK 99/PMK.05/2017 & PER-17/PB/2025',
    sumber_url: 'https://djpb.kemenkeu.go.id',
    catatan: 'Pastikan nomor register hibah telah diterbitkan oleh Ditjen Pengelolaan Pembiayaan dan Risiko (DJPPR).',
    warna: '#ec4899',
    urutan: 9,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    version: 1
  },
  {
    llat_id: 'llat-2026-010',
    tahun_anggaran: 2026,
    kode_kegiatan: 'LLAT-10',
    nama_kegiatan: 'Batas Penyetoran Sisa Kas UP / TUP Tunai ke Rekening Kas Negara (NTPN/SBSN)',
    kategori: 'UP/TUP',
    deskripsi: 'Penyetoran seluruh sisa uang persediaan (UP/TUP) yang berada pada Bendahara Pengeluaran ke Kas Negara melalui bank persepsi atau POS.',
    tanggal_mulai: '2026-12-21',
    tanggal_batas: '2026-12-28',
    jam_batas: '17:00',
    timezone: 'WIB',
    status: 'BERJALAN',
    status_mode: 'AUTO',
    prioritas: 'KRITIS',
    target_pengguna: ['BENDAHARA', 'KPA', 'UAKPA'],
    dasar_hukum: 'Kewajiban Penutupan Saldo Kas Akhir Tahun Anggaran DJPb',
    nomor_peraturan: 'PER-17/PB/2025 Bab V',
    sumber_url: 'https://djpb.kemenkeu.go.id',
    catatan: 'Gunakan kode akun penerimaan pengembalian UP (815111/815511) dan input NTPN ke aplikasi SAKTI sebelum tutup buku.',
    warna: '#ef4444',
    urutan: 10,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    version: 1
  },
  {
    llat_id: 'llat-2026-011',
    tahun_anggaran: 2026,
    kode_kegiatan: 'LLAT-11',
    nama_kegiatan: 'Batas Pengajuan SPM Pertanggungjawaban TUP (SPM-PTUP) & SPM Nihil Akhir Tahun',
    kategori: 'SPM',
    deskripsi: 'Penyampaian SPM Pengesahan/Pertanggungjawaban TUP (PTUP Nihil) dan SPM Pengesahan Akhir Tahun lainnya ke KPPN Semarang I.',
    tanggal_mulai: '2026-12-22',
    tanggal_batas: '2026-12-30',
    jam_batas: '17:00',
    timezone: 'WIB',
    status: 'BERJALAN',
    status_mode: 'AUTO',
    prioritas: 'KRITIS',
    target_pengguna: ['PPSPM', 'PPK', 'BENDAHARA'],
    dasar_hukum: 'Penyelesaian SP2D Hari Terakhir Tahun Anggaran 2026',
    nomor_peraturan: 'PER-17/PB/2025 Bab VI',
    sumber_url: 'https://djpb.kemenkeu.go.id',
    catatan: 'Batas akhir penerbitan SP2D oleh sistem SPAN Kemenkeu untuk Tahun Anggaran 2026.',
    warna: '#ef4444',
    urutan: 11,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    version: 1
  },
  {
    llat_id: 'llat-2026-012',
    tahun_anggaran: 2026,
    kode_kegiatan: 'LLAT-12',
    nama_kegiatan: 'Batas Rekonsiliasi Eksternal MonSAKTI Periode Final TA 2026 & Penerbitan SHR',
    kategori: 'Rekonsiliasi',
    deskripsi: 'Penyelesaian todolist rekonsiliasi SAKTI-SPAN, penandatanganan Berita Acara Rekonsiliasi (BAR), dan penerbitan Surat Hasil Rekonsiliasi (SHR) Final 2026.',
    tanggal_mulai: '2027-01-04',
    tanggal_batas: '2027-01-15',
    jam_batas: '17:00',
    timezone: 'WIB',
    status: 'BELUM_DIMULAI',
    status_mode: 'AUTO',
    prioritas: 'PENTING',
    target_pengguna: ['OPERATOR', 'UAKPA', 'KPA'],
    dasar_hukum: 'Pedoman Rekonsiliasi Eksternal dan Pelaporan Keuangan Pemerintah Pusat',
    nomor_peraturan: 'PMK 217/PMK.05/2022 & Juknis Rekon',
    sumber_url: 'https://monsakti.kemenkeu.go.id',
    catatan: 'Pastikan tidak ada selisih Kas di Bendahara, Pengesahan Hibah, atau Jurnal Penyesuaian yang belum disetujui.',
    warna: '#6366f1',
    urutan: 12,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    version: 1
  },
  {
    llat_id: 'llat-2026-013',
    tahun_anggaran: 2026,
    kode_kegiatan: 'LLAT-13',
    nama_kegiatan: 'Penyampaian LPJ Bendahara Pengeluaran & Penerimaan Bulan Desember 2026',
    kategori: 'Pelaporan',
    deskripsi: 'Penyampaian LPJ Bendahara periode Desember 2026 (termasuk LPJ Nihil/Final) ke KPPN Semarang I melalui aplikasi SAKTI.',
    tanggal_mulai: '2027-01-04',
    tanggal_batas: '2027-01-18',
    jam_batas: '17:00',
    timezone: 'WIB',
    status: 'BELUM_DIMULAI',
    status_mode: 'AUTO',
    prioritas: 'PENTING',
    target_pengguna: ['BENDAHARA', 'KPA'],
    dasar_hukum: 'Peraturan Tata Kelola Pertanggungjawaban Bendahara dan LPJ DJPb',
    nomor_peraturan: 'PER-3/PB/2014 & PER-17/PB/2025',
    sumber_url: 'https://djpb.kemenkeu.go.id',
    catatan: 'Saldo kas pada LPJ akhir tahun harus bernilai Nihil (Rp0) kecuali satker yang memiliki izin khusus saldo rekening.',
    warna: '#0ea5e9',
    urutan: 13,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    version: 1
  },
  {
    llat_id: 'llat-2026-014',
    tahun_anggaran: 2026,
    kode_kegiatan: 'LLAT-14',
    nama_kegiatan: 'Tutup Periode SAKTI Modul Aset & Persediaan Semester II / Unaudited TA 2026',
    kategori: 'BMN',
    deskripsi: 'Penyelesaian inventarisasi fisik BMN, reklasifikasi aset, penyusutan semesteran, dan tutup buku modul Persediaan serta Aset Tetap.',
    tanggal_mulai: '2027-01-08',
    tanggal_batas: '2027-01-22',
    jam_batas: '17:00',
    timezone: 'WIB',
    status: 'BELUM_DIMULAI',
    status_mode: 'AUTO',
    prioritas: 'NORMAL',
    target_pengguna: ['OPERATOR', 'UAKPA', 'BENDAHARA'],
    dasar_hukum: 'Petunjuk Teknis Akuntansi dan Pelaporan BMN Akhir Tahun DJPb-DJKN',
    nomor_peraturan: 'PMK 181/PMK.06/2016 & Modul SAKTI BMN',
    sumber_url: 'https://sakti.kemenkeu.go.id',
    catatan: 'Modul GLP (General Ledger & Pelaporan) hanya dapat ditutup setelah modul Aset & Persediaan selesai ditutup.',
    warna: '#84cc16',
    urutan: 14,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
    version: 1
  }
];

export function calculateEventStatus(event: LLATEvent, referenceDate: Date = new Date()): LLATStatus {
  if (event.status_mode === 'MANUAL' && event.manual_status) {
    return event.manual_status;
  }

  const now = new Date(referenceDate);
  const nowYear = now.getFullYear();
  const nowMonth = String(now.getMonth() + 1).padStart(2, '0');
  const nowDate = String(now.getDate()).padStart(2, '0');
  const todayStr = `${nowYear}-${nowMonth}-${nowDate}`;

  const deadlineStr = event.tanggal_batas;
  const startStr = event.tanggal_mulai;

  if (deadlineStr === todayStr) {
    return 'HARI_INI';
  }

  if (todayStr > deadlineStr) {
    // Already past deadline
    return 'TERLEWAT';
  }

  if (todayStr < startStr) {
    return 'BELUM_DIMULAI';
  }

  // Calculate days difference to deadline
  const dToday = new Date(todayStr + 'T00:00:00');
  const dDeadline = new Date(deadlineStr + 'T00:00:00');
  const diffDays = Math.ceil((dDeadline.getTime() - dToday.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 7 && diffDays > 0) {
    return 'SEGERA';
  }

  return 'BERJALAN';
}

export function getCountdownInfo(event: LLATEvent, referenceDate: Date = new Date()): {
  text: string;
  badgeClass: string;
  borderClass: string;
  isPast: boolean;
  isToday: boolean;
  daysRemaining: number;
} {
  const now = new Date(referenceDate);
  const deadlineStr = `${event.tanggal_batas}T${event.jam_batas || '23:59'}:00`;
  const deadline = new Date(deadlineStr);
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs < 0) {
    const daysPast = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    return {
      text: daysPast === 0 ? 'TERLEWAT HARI INI' : `TERLEWAT ${daysPast} HARI`,
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
      borderClass: 'border-rose-400',
      isPast: true,
      isToday: false,
      daysRemaining: -daysPast
    };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days === 0) {
    return {
      text: hours > 0 ? `⏳ ${hours} JAM ${minutes} MENIT LAGI` : `⏳ ${minutes} MENIT LAGI`,
      badgeClass: 'bg-rose-600 text-white animate-pulse',
      borderClass: 'border-rose-500 shadow-rose-200 shadow-sm',
      isPast: false,
      isToday: true,
      daysRemaining: 0
    };
  }

  if (days <= 3) {
    return {
      text: `🔴 ${days} HARI ${hours} JAM LAGI`,
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 font-extrabold',
      borderClass: 'border-rose-300',
      isPast: false,
      isToday: false,
      daysRemaining: days
    };
  }

  if (days <= 7) {
    return {
      text: `🟡 ${days} HARI LAGI`,
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 font-extrabold',
      borderClass: 'border-amber-300',
      isPast: false,
      isToday: false,
      daysRemaining: days
    };
  }

  return {
    text: `🔵 ${days} HARI LAGI`,
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-200',
    borderClass: 'border-sky-300',
    isPast: false,
    isToday: false,
    daysRemaining: days
  };
}

export function getPriorityBadge(prioritas: LLATPrioritas): { label: string; badgeClass: string; dotClass: string } {
  switch (prioritas) {
    case 'KRITIS':
      return {
        label: 'KRITIS',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-200 border border-rose-300 dark:border-rose-800',
        dotClass: 'bg-rose-500'
      };
    case 'PENTING':
      return {
        label: 'PENTING',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-200 border border-amber-300 dark:border-amber-800',
        dotClass: 'bg-amber-500'
      };
    case 'NORMAL':
    default:
      return {
        label: 'NORMAL',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/90 dark:text-blue-200 border border-blue-300 dark:border-blue-800',
        dotClass: 'bg-blue-500'
      };
  }
}

export function getStatusBadge(status: LLATStatus): { label: string; badgeClass: string; dotClass: string } {
  switch (status) {
    case 'HARI_INI':
      return {
        label: 'HARI INI',
        badgeClass: 'bg-red-600 text-white font-extrabold shadow-xs animate-pulse',
        dotClass: 'bg-white'
      };
    case 'SEGERA':
      return {
        label: 'SEGERA JATUH TEMPO',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-300 border border-amber-300 font-extrabold',
        dotClass: 'bg-amber-500'
      };
    case 'BERJALAN':
      return {
        label: 'BERJALAN',
        badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/90 dark:text-indigo-300 border border-indigo-300',
        dotClass: 'bg-indigo-500'
      };
    case 'BELUM_DIMULAI':
      return {
        label: 'BELUM DIMULAI',
        badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300',
        dotClass: 'bg-slate-400'
      };
    case 'SELESAI':
      return {
        label: 'SELESAI',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border border-emerald-300',
        dotClass: 'bg-emerald-500'
      };
    case 'TERLEWAT':
      return {
        label: 'TERLEWAT',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border border-rose-300 font-extrabold',
        dotClass: 'bg-rose-500'
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-100 text-slate-700',
        dotClass: 'bg-slate-400'
      };
  }
}
