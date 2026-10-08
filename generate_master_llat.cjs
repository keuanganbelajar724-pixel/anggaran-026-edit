const fs = require('fs');

const categories = [
  { id: 'cat-retur', nama: 'Penyelesaian Retur dan Ketentuan Lain-Lain', deskripsi: 'Penyelesaian surat terkait retur/SPPK dan batas akhir penerbitan SP2D retur', warna: '#f97316', is_active: true },
  { id: 'cat-cash-forecasting', nama: 'Perencanaan Kas / Cash Forecasting', deskripsi: 'Penyusunan proyeksi penerimaan dan pengeluaran satker, BLU, dan CPIN', warna: '#0ea5e9', is_active: true },
  { id: 'cat-kontrak', nama: 'Pendaftaran Data Kontrak', deskripsi: 'Pendaftaran kontrak baru dan addendum berdasarkan periode penandatanganan', warna: '#8b5cf6', is_active: true },
  { id: 'cat-gaji', nama: 'Gaji Induk, Gaji PPPK, dan PPNPN Jan 2027', deskripsi: 'Pengajuan SPM-LS Gaji Induk, PPPK, PPNPN, Satker PPP, dan Tukin Januari 2027', warna: '#10b981', is_active: true },
  { id: 'cat-spm-nonkontraktual', nama: 'SPM-LS Nonkontraktual', deskripsi: 'Uang makan/lembur Nov-Des 2026, honor, tunjangan, SPM-KP/KB/KC/IB/PP, tilang', warna: '#3b82f6', is_active: true },
  { id: 'cat-spm-kontraktual', nama: 'SPM-LS Kontraktual', deskripsi: 'SPM kontraktual berdasarkan periode BAST/BAPP/Jaminan tahap I s.d. akhir tahun', warna: '#6366f1', is_active: true },
  { id: 'cat-uptup', nama: 'Pengajuan SPM-UP/GUP/TUP', deskripsi: 'Permohonan persetujuan TUP Tunai/KKP dan pengajuan SPM-UP/GUP/TUP', warna: '#f59e0b', is_active: true },
  { id: 'cat-penyelesaian-up', nama: 'Penyelesaian Uang Persediaan', deskripsi: 'SPM TUP di atas UP, GUP Nihil, penyetoran sisa kas, dan rekonsiliasi kas bendahara', warna: '#ef4444', is_active: true },
  { id: 'cat-kkp', nama: 'Kartu Kredit Pemerintah (KKP)', deskripsi: 'Batas transaksi KKP/KPP domestik, SPM-GUP/TUP KKP, dan pembayaran bank penerbit', warna: '#ec4899', is_active: true },
  { id: 'cat-kas-bendahara', nama: 'Penyetoran Sisa Dana Kas Bendahara Satker', deskripsi: 'Penyetoran sisa dana UP/TUP, LS bendahara, sisa PNBP, dan daftar pengecualian', warna: '#dc2626', is_active: true },
  { id: 'cat-ba-bun', nama: 'Belanja DIPA BA BUN TA 2026', deskripsi: 'SPM transfer ke daerah dan kelompok belanja BA BUN sampai akhir TA 2026', warna: '#14b8a6', is_active: true },
  { id: 'cat-ba-bun-lintas-27', nama: 'Belanja BA BUN Disahkan pada TA 2027', deskripsi: 'Pengesahan BM-DTP, P-DTP, penambahan investasi BLU, dan hibah luar negeri', warna: '#0d9488', is_active: true },
  { id: 'cat-ba-bun-jan27-bayar26', nama: 'Belanja BA BUN 2027 Dibayar Akhir TA 2026', deskripsi: 'SPM-LS DHI, belanja pensiun, utang dalam negeri, dan utang luar negeri valuta Jan 2027', warna: '#0284c7', is_active: true },
  { id: 'cat-pengendalian', nama: 'Pengendalian Belanja', deskripsi: 'Ketentuan operasional pengendalian belanja, penolakan NRK/SPM, dan mekanisme tunggakan', warna: '#e11d48', is_active: true },
  { id: 'cat-spm-akhir-tahun', nama: 'SPM Akhir Tahun dan Biaya Pemeliharaan', deskripsi: 'SPM penampungan (kode 171) darurat bencana dan retensi pemeliharaan fisik', warna: '#b45309', is_active: true },
  { id: 'cat-proyeksi-blu', nama: 'Proyeksi Penerimaan & Pengeluaran BLU', deskripsi: 'Jadwal bulanan penyampaian dan pemutakhiran proyeksi kas Satker BLU Okt-Des 2026', warna: '#84cc16', is_active: true },
  { id: 'cat-pengesahan-blu', nama: 'Pengesahan Pendapatan dan Belanja BLU', deskripsi: 'Penyampaian SP3B-BLU dan penyelesaian SP2B-BLU periode Oktober s.d. Desember 2026', warna: '#65a30d', is_active: true },
  { id: 'cat-pengesahan-pembiayaan-blu', nama: 'Pengesahan Belanja & Pembiayaan Nonanggaran BLU', deskripsi: 'Belanja modal tanah PSN, belanja BP BDLH, dan pengesahan investasi saldo kas BLU', warna: '#4d7c0f', is_active: true },
  { id: 'cat-pnbp-blu', nama: 'Penyelesaian Sisa Dana PNBP BLU', deskripsi: 'Penyetoran sisa dana PNBP BLU ke kas operasional dan rekonsiliasi kas bendahara BLU', warna: '#06b6d4', is_active: true },
  { id: 'cat-hibah-langsung', nama: 'Penyelesaian Administrasi Hibah Langsung', deskripsi: 'Izin buka rekening dan revisi anggaran hibah uang kelompok A & B', warna: '#d946ef', is_active: true },
  { id: 'cat-hibah-lanjutan', nama: 'Administrasi Hibah Langsung Lanjutan', deskripsi: 'Pengesahan SP2HL, SP4HL, dan MPHL-BJS realisasi s.d. akhir tahun', warna: '#c026d3', is_active: true },
  { id: 'cat-phln-pdn', nama: 'Penarikan PHLN dan PDN', deskripsi: 'Surat penarikan dana direct payment/pembiayaan pendahuluan ke KPPN KPH', warna: '#7c3aed', is_active: true },
  { id: 'cat-akuntansi-pelaporan', nama: 'Akuntansi dan Pelaporan', deskripsi: 'Monitoring kualitas data lapkeu, rekonsiliasi internal/eksternal, dan LPJ Bendahara', warna: '#4338ca', is_active: true },
  { id: 'cat-jam-layanan', nama: 'Pengaturan Jam Layanan KPPN Desember 2026', deskripsi: 'Ketentuan jam layanan 08.00-17.00 WIB dan mekanisme dispensasi luar jam kerja', warna: '#475569', is_active: true },
  { id: 'cat-critical-point', nama: 'Critical Point & Keberlangsungan Layanan', deskripsi: 'Strategi mitigasi risiko lonjakan SPM, RPATA, simulasi dan kesiapsiagaan layanan', warna: '#334155', is_active: true }
];

console.log("Categories initialized:", categories.length);

const events = [];

// Helper to push event
function addEvent(ev) {
  events.push({
    llat_id: ev.llat_id || `llat-2026-${String(events.length + 1).padStart(3, '0')}`,
    tahun_anggaran: 2026,
    tahun_kalender_tenggat: ev.tahun_kalender_tenggat || (ev.tanggal_batas && ev.tanggal_batas.startsWith('2027') ? 2027 : 2026),
    kode_kegiatan: ev.kode_kegiatan,
    nama_kegiatan: ev.nama_kegiatan,
    kategori: ev.kategori,
    deskripsi: ev.deskripsi,
    periode_transaksi: ev.periode_transaksi || '-',
    jenis_dokumen: ev.jenis_dokumen || '-',
    jenis_tenggat: ev.jenis_tenggat,
    tanggal_mulai: ev.tanggal_mulai || '2026-10-01',
    tanggal_batas: ev.tanggal_batas || '',
    jam_batas: ev.jam_batas || '17:00',
    timezone: ev.timezone || 'WIB',
    tanggal_tenggat: ev.tanggal_batas || '',
    jam_tenggat: ev.jam_batas || '17:00',
    aturan_rel_tenggat: ev.aturan_rel_tenggat || '',
    tanggal_penerimaan: ev.tanggal_penerimaan || (ev.jenis_tenggat.includes('Penerimaan') || ev.jenis_tenggat.includes('Diterima') || ev.jenis_tenggat.includes('Pendaftaran') || ev.jenis_tenggat.includes('Pengajuan') ? ev.tanggal_batas : undefined),
    jam_penerimaan: ev.jam_penerimaan || ev.jam_batas || '17:00',
    tanggal_penyelesaian: ev.tanggal_penyelesaian,
    jam_penyelesaian: ev.jam_penyelesaian || '17:00',
    ketentuan: ev.ketentuan || ev.deskripsi,
    ketentuan_waktu: ev.ketentuan_waktu || 'HARI_KERJA',
    ketentuan_khusus: ev.ketentuan_khusus || '',
    dasar_hukum: ev.dasar_hukum || 'Materi Sosialisasi LLAT TA 2026 KPPN Semarang I',
    nomor_peraturan: ev.nomor_peraturan || 'Sosialisasi LLAT 2026',
    nama_file_sumber: 'sosialisasi LLAT 2026 ga full.pdf',
    file_sumber: 'sosialisasi LLAT 2026 ga full.pdf',
    halaman_sumber: ev.halaman_sumber,
    status_verifikasi: ev.status_verifikasi || 'TERVERIFIKASI',
    status_penyelesaian: 'BELUM_SELESAI',
    is_tanggal_pasti: ev.is_tanggal_pasti !== undefined ? ev.is_tanggal_pasti : true,
    aturan_relatif: ev.aturan_relatif || ev.aturan_rel_tenggat || '',
    sub_deadlines: ev.sub_deadlines || [],
    status: 'BERJALAN',
    status_mode: 'AUTO',
    prioritas: ev.prioritas || 'PENTING',
    target_pengguna: ev.target_pengguna || ['SEMUA_SATKER'],
    catatan: ev.catatan || '',
    urutan: events.length + 1,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-08T15:00:00Z',
    version: 2
  });
}

// -------------------------------------------------------------
// 1. PENYELESAIAN RETUR DAN KETENTUAN LAIN-LAIN (Hal 2)
// -------------------------------------------------------------
addEvent({
  kode_kegiatan: 'LLAT-01.1A',
  nama_kegiatan: 'Batas Akhir Penerimaan Surat Terkait Retur/SPPK oleh KPPN',
  kategori: 'Penyelesaian Retur dan Ketentuan Lain-Lain',
  halaman_sumber: 'Halaman 2',
  jenis_dokumen: 'Surat Terkait Retur / SPPK',
  jenis_tenggat: 'Batas Diterima KPPN',
  tanggal_mulai: '2026-12-01',
  tanggal_batas: '2026-12-21',
  jam_batas: '17:00',
  deskripsi: 'Batas akhir penerimaan surat terkait retur/SPPK oleh KPPN Semarang I untuk proses penyelesaian retur SP2D TA 2026.',
  ketentuan: 'Apabila surat terkait retur/SPPK tidak dapat disampaikan sampai 21 Desember 2026, surat dapat diajukan pada hari kerja berikutnya paling lambat 22 Januari 2027.',
  catatan: 'Simpan kedua tanggal sebagai ketentuan yang berbeda. Jangan menyimpulkan seluruh retur otomatis memperoleh perpanjangan tanpa konteks slide.',
  prioritas: 'KRITIS',
  target_pengguna: ['BENDAHARA', 'PPSPM']
});

addEvent({
  kode_kegiatan: 'LLAT-01.1B',
  nama_kegiatan: 'Batas Paling Lambat Pengajuan Lanjutan Surat Terkait Retur/SPPK',
  kategori: 'Penyelesaian Retur dan Ketentuan Lain-Lain',
  halaman_sumber: 'Halaman 2',
  jenis_dokumen: 'Surat Terkait Retur / SPPK (Lanjutan)',
  jenis_tenggat: 'Batas Pengajuan',
  tahun_kalender_tenggat: 2027,
  tanggal_mulai: '2026-12-22',
  tanggal_batas: '2027-01-22',
  jam_batas: '17:00',
  deskripsi: 'Batas paling lambat pengajuan surat terkait retur/SPPK bagi satker yang tidak dapat menyampaikan sampai dengan 21 Desember 2026.',
  ketentuan: 'Diajukan pada hari kerja berikutnya paling lambat 22 Januari 2027 sebagai penyelesaian retur terkait TA 2026.',
  prioritas: 'PENTING',
  target_pengguna: ['BENDAHARA', 'PPSPM']
});

addEvent({
  kode_kegiatan: 'LLAT-01.2',
  nama_kegiatan: 'Batas Akhir Penerbitan SP2D Retur oleh KPPN',
  kategori: 'Penyelesaian Retur dan Ketentuan Lain-Lain',
  halaman_sumber: 'Halaman 2',
  jenis_dokumen: 'SP2D Retur',
  jenis_tenggat: 'Batas Penerbitan',
  tanggal_mulai: '2026-12-01',
  tanggal_batas: '2026-12-23',
  jam_batas: '17:00',
  tanggal_penyelesaian: '2026-12-23',
  deskripsi: 'Batas akhir penerbitan SP2D Pengganti atas retur oleh KPPN Semarang I.',
  ketentuan: 'Tampilkan terpisah dari batas penyampaian surat terkait retur.',
  prioritas: 'KRITIS',
  target_pengguna: ['ADMIN', 'BENDAHARA']
});

addEvent({
  kode_kegiatan: 'LLAT-01.OPS',
  nama_kegiatan: 'Koordinasi Mitra Kerja & Tim Bersama Pengawasan Akhir Tahun',
  kategori: 'Penyelesaian Retur dan Ketentuan Lain-Lain',
  halaman_sumber: 'Halaman 2',
  jenis_dokumen: 'Ketentuan Koordinasi Operasional',
  jenis_tenggat: 'Ketentuan Operasional',
  tanggal_mulai: '2026-10-01',
  tanggal_batas: '2026-12-31',
  is_tanggal_pasti: false,
  aturan_rel_tenggat: 'Operasional berkelanjutan selama periode akhir tahun',
  deskripsi: 'Kanwil DJPb dan KPPN melakukan koordinasi dengan mitra kerja, termasuk Bank Indonesia, collecting agent, Kanwil Pajak, dan Kanwil Bea Cukai.',
  ketentuan: 'Jika terdapat perubahan layanan BI-RTGS atau pengeluaran negara atas beban BA BUN, dilakukan penyesuaian ketentuan batas waktu.',
  prioritas: 'NORMAL',
  target_pengguna: ['ADMIN', 'SEMUA_SATKER']
});

console.log("Section 1 added. Total events:", events.length);

// -------------------------------------------------------------
// 2. PERENCANAAN KAS / CASH FORECASTING (Hal 3)
// -------------------------------------------------------------
addEvent({
  kode_kegiatan: 'LLAT-02.1',
  nama_kegiatan: 'Penyusunan & Pemutakhiran Proyeksi Pengeluaran Bulanan Satker (Okt - Des 2026)',
  kategori: 'Perencanaan Kas / Cash Forecasting',
  halaman_sumber: 'Halaman 3',
  jenis_dokumen: 'Proyeksi Pengeluaran Satker',
  jenis_tenggat: 'Ketentuan Relatif',
  is_tanggal_pasti: false,
  aturan_rel_tenggat: 'Paling lambat hari kerja kesepuluh bulan terkait (Oktober, November, Desember 2026)',
  tanggal_mulai: '2026-10-01',
  tanggal_batas: '2026-12-14',
  deskripsi: 'Satker menyusun dan memutakhirkan proyeksi pengeluaran bulanan paling lambat hari kerja kesepuluh bulan terkait.',
  ketentuan: 'Proyeksi penerimaan dan pengeluaran harus dimutakhirkan paling lambat hari kerja kesepuluh bulan berkenaan sesuai materi.',
  prioritas: 'PENTING',
  target_pengguna: ['PPK', 'PPSPM']
});

addEvent({
  kode_kegiatan: 'LLAT-02.2',
  nama_kegiatan: 'Penyusunan Proyeksi Penerimaan dan Pengeluaran Satker BLU',
  kategori: 'Perencanaan Kas / Cash Forecasting',
  halaman_sumber: 'Halaman 3 & 19',
  jenis_dokumen: 'Proyeksi Kas BLU',
  jenis_tenggat: 'Ketentuan Relatif',
  is_tanggal_pasti: false,
  aturan_rel_tenggat: 'Paling lambat hari kerja kesepuluh bulan terkait (Oktober - Desember 2026)',
  tanggal_mulai: '2026-10-01',
  tanggal_batas: '2026-12-14',
  deskripsi: 'Satker BLU menyusun proyeksi penerimaan dan pengeluaran bulanan Oktober sampai Desember 2026.',
  ketentuan: 'Batas pemutakhiran paling lambat hari kerja kesepuluh bulan terkait. Rincian tanggal kalender khusus terdapat pada Halaman 19.',
  prioritas: 'PENTING',
  target_pengguna: ['BLU', 'BENDAHARA']
});

addEvent({
  kode_kegiatan: 'LLAT-02.3',
  nama_kegiatan: 'Batas Penyusunan & Pemutakhiran Proyeksi oleh Tim Koordinasi (CPIN)',
  kategori: 'Perencanaan Kas / Cash Forecasting',
  halaman_sumber: 'Halaman 3',
  jenis_dokumen: 'Proyeksi Tim Koordinasi / CPIN',
  jenis_tenggat: 'Batas Koordinasi / Penyusunan Proyeksi',
  tanggal_mulai: '2026-11-01',
  tanggal_batas: '2026-11-30',
  jam_batas: '17:00',
  status_verifikasi: 'PERLU_PEMERIKSAAN_MANUAL',
  deskripsi: 'Tim Koordinasi (Cash Planning Information Network / CPIN) melakukan pemutakhiran proyeksi penerimaan dan pengeluaran.',
  ketentuan: 'Batas penyusunan proyeksi yang disebut dalam materi: 30 November 2026. Perlu verifikasi kembali konteks tanggal 30 November terhadap slide asli.',
  catatan: 'Status: PERLU PEMERIKSAAN MANUAL untuk mencocokkan konteks 30 November terhadap slide asli sebelum publikasi.',
  prioritas: 'PENTING',
  target_pengguna: ['ADMIN']
});

// -------------------------------------------------------------
// 3. PENDAFTARAN DATA KONTRAK (Hal 4)
// -------------------------------------------------------------
const contractRows = [
  { p: 'Sampai dengan 30 September 2026', d: '2026-10-09' },
  { p: '1–31 Oktober 2026', d: '2026-11-06' },
  { p: '1–30 November 2026', d: '2026-12-07' },
  { p: '1–5 Desember 2026', d: '2026-12-07' },
  { p: '6–12 Desember 2026', d: '2026-12-14' },
  { p: '13–17 Desember 2026', d: '2026-12-21' },
  { p: '18–22 Desember 2026', d: '2026-12-23' }
];

contractRows.forEach((row, idx) => {
  addEvent({
    kode_kegiatan: `LLAT-03.${idx + 1}`,
    nama_kegiatan: `Pendaftaran Data Kontrak Periode Penandatanganan ${row.p}`,
    kategori: 'Pendaftaran Data Kontrak',
    halaman_sumber: 'Halaman 4',
    periode_transaksi: row.p,
    jenis_dokumen: 'Data Kontrak / Perubahan Kontrak (SPM-LS)',
    jenis_tenggat: 'Batas Diterima KPPN',
    tanggal_batas: row.d,
    jam_batas: '17:00',
    deskripsi: `Penyampaian pendaftaran data kontrak atau perubahan data kontrak (addendum) yang ditandatangani periode ${row.p} ke KPPN Semarang I.`,
    ketentuan: 'Disampaikan paling lambat 5 hari kerja setelah kontrak ditandatangani. Melewati 5 hari kerja masih dapat diterima sepanjang tidak melewati batas waktu dalam tabel dengan melampirkan surat pernyataan keterlambatan.',
    prioritas: idx >= 4 ? 'KRITIS' : 'PENTING',
    target_pengguna: ['PPK', 'PPSPM']
  });
});

addEvent({
  kode_kegiatan: 'LLAT-03.NRK',
  nama_kegiatan: 'Ketentuan Penerbitan Nomor Register Kontrak (NRK) oleh KPPN',
  kategori: 'Pendaftaran Data Kontrak',
  halaman_sumber: 'Halaman 4',
  jenis_dokumen: 'Nomor Register Kontrak (NRK)',
  jenis_tenggat: 'Ketentuan Relatif',
  is_tanggal_pasti: false,
  aturan_rel_tenggat: 'Paling lama dua hari kerja setelah data kontrak diterima lengkap oleh KPPN',
  tanggal_mulai: '2026-10-01',
  tanggal_batas: '2026-12-23',
  status_verifikasi: 'PERLU_PEMERIKSAAN_MANUAL',
  deskripsi: 'NRK diterbitkan oleh KPPN paling lama dua hari kerja setelah kontrak diterima. Untuk periode tertentu akhir tahun terdapat batas paling lambat sesuai tabel materi.',
  ketentuan: 'Aturan relatif dengan pemicu tanggal penerimaan kontrak. Tandai tanggal penerbitan NRK akhir tahun yang perlu pencocokan lebih lanjut sebagai PERLU VERIFIKASI.',
  prioritas: 'PENTING',
  target_pengguna: ['ADMIN', 'PPK']
});

// -------------------------------------------------------------
// 4. GAJI INDUK, GAJI PPPK, DAN PENGHASILAN PPNPN JAN 2027 (Hal 5)
// -------------------------------------------------------------
addEvent({
  kode_kegiatan: 'LLAT-04.1',
  nama_kegiatan: 'Batas Penerimaan SPM-LS Gaji Induk / PPPK / PPNPN Januari 2027',
  kategori: 'Gaji Induk, Gaji PPPK, dan PPNPN Jan 2027',
  halaman_sumber: 'Halaman 5',
  jenis_dokumen: 'SPM-LS Gaji Induk / PPPK / PPNPN Januari 2027',
  jenis_tenggat: 'Batas Diterima KPPN',
  tanggal_mulai: '2026-12-01',
  tanggal_batas: '2026-12-08',
  jam_batas: '17:00',
  deskripsi: 'Batas paling lambat penerimaan SPM-LS Gaji Induk, Gaji PPPK, dan penghasilan PPNPN bulan Januari 2027 oleh KPPN Semarang I.',
  ketentuan: 'Rekonsiliasi gaji induk Januari 2027 dapat dilakukan sampai batas akhir penyampaian SPM-LS gaji induk ke KPPN.',
  prioritas: 'KRITIS',
  target_pengguna: ['PPSPM', 'BENDAHARA']
});

addEvent({
  kode_kegiatan: 'LLAT-04.2',
  nama_kegiatan: 'Batas Penerimaan Gaji Induk Jan 2027 Satker Platform Pembayaran Pemerintah (PPP)',
  kategori: 'Gaji Induk, Gaji PPPK, dan PPNPN Jan 2027',
  halaman_sumber: 'Halaman 5',
  jenis_dokumen: 'SPM-LS Gaji Induk Platform Pembayaran Pemerintah',
  jenis_tenggat: 'Batas Diterima KPPN',
  tanggal_mulai: '2026-12-01',
  tanggal_batas: '2026-12-15',
  jam_batas: '17:00',
  deskripsi: 'Batas paling lambat penerimaan SPM-LS Gaji Induk Januari 2027 khusus bagi Satker Platform Pembayaran Pemerintah (PPP).',
  ketentuan: 'Dipertahankan sebagai kegiatan tersendiri sesuai materi sosialisasi.',
  prioritas: 'PENTING',
  target_pengguna: ['PPSPM', 'OPERATOR']
});

addEvent({
  kode_kegiatan: 'LLAT-04.3',
  nama_kegiatan: 'Batas Penerimaan SPM-LS Tunjangan Kinerja Januari 2027',
  kategori: 'Gaji Induk, Gaji PPPK, dan PPNPN Jan 2027',
  halaman_sumber: 'Halaman 5',
  jenis_dokumen: 'SPM-LS Tunjangan Kinerja Januari 2027',
  jenis_tenggat: 'Batas Diterima KPPN',
  tanggal_mulai: '2026-12-01',
  tanggal_batas: '2026-12-21',
  jam_batas: '17:00',
  deskripsi: 'Batas paling lambat penerimaan SPM-LS Tunjangan Kinerja Januari 2027 oleh KPPN.',
  ketentuan: 'Tunjangan kinerja yang dibayarkan tanggal 1 Januari 2027 dengan DIPA TA 2027.',
  prioritas: 'PENTING',
  target_pengguna: ['PPSPM', 'BENDAHARA']
});

addEvent({
  kode_kegiatan: 'LLAT-04.4',
  nama_kegiatan: 'Batas Akhir Penyelesaian SP2D Gaji Induk Januari 2027 oleh KPPN',
  kategori: 'Gaji Induk, Gaji PPPK, dan PPNPN Jan 2027',
  halaman_sumber: 'Halaman 5',
  jenis_dokumen: 'SP2D Gaji Induk Januari 2027',
  jenis_tenggat: 'Batas Penyelesaian',
  tanggal_mulai: '2026-12-08',
  tanggal_batas: '2026-12-30',
  jam_batas: '17:00',
  tanggal_penyelesaian: '2026-12-30',
  deskripsi: 'Batas akhir penyelesaian penerbitan SP2D Gaji Induk Januari 2027 oleh KPPN Semarang I.',
  ketentuan: 'Tampilkan sebagai tenggat penyelesaian terpisah dari batas penerimaan dokumen.',
  prioritas: 'KRITIS',
  target_pengguna: ['ADMIN']
});

console.log("Sections 2, 3, 4 added. Total events:", events.length);

// -------------------------------------------------------------
// 5. SPM-LS NONKONTRAKTUAL (Hal 6–7)
// -------------------------------------------------------------
const nonContractData = [
  { k: '5.1', n: 'Uang Makan dan Uang Lembur November 2026', ter: '2026-12-11', sel: '2026-12-14', doc: 'SPM-LS Uang Makan & Lembur Nov 2026' },
  { k: '5.2', n: 'Uang Makan dan Uang Lembur Desember 2026', ter: '2026-12-23', sel: '2026-12-29', doc: 'SPM-LS Uang Makan & Lembur Des 2026' },
  { k: '5.3', n: 'Honorarium, Tunjangan, Vakasi, dan Penghasilan PPNPN', ter: '2026-12-14', sel: '2026-12-16', doc: 'SPM-LS Honorarium/Tunjangan/Vakasi/PPNPN' },
  { k: '5.4', n: 'SPM-LS Nonkontraktual Lainnya', ter: '2026-12-22', sel: '2026-12-29', doc: 'SPM-LS Nonkontraktual Lainnya' },
  { k: '5.5', n: 'SPM-KP, SPM-KB, SPM-KC, SPM-IB, dan SPM-PP', ter: '2026-12-17', sel: '2026-12-22', doc: 'SPM Pengembalian Pajak / Bea / Cukai / IB / PP' },
  { k: '5.6', n: 'SPM-PB PNBP (Denda Tilang)', ter: '2027-01-08', sel: '2027-01-12', doc: 'SPM-PB PNBP (Denda Tilang)', thn: 2027 }
];

nonContractData.forEach((row) => {
  // Record 1: Penerimaan Dokumen
  addEvent({
    kode_kegiatan: `LLAT-${row.k}A`,
    nama_kegiatan: `Batas Diterima KPPN: ${row.n}`,
    kategori: 'SPM-LS Nonkontraktual',
    halaman_sumber: 'Halaman 6–7',
    jenis_dokumen: row.doc,
    jenis_tenggat: 'Batas Diterima KPPN',
    tahun_kalender_tenggat: row.thn || 2026,
    tanggal_batas: row.ter,
    jam_batas: '17:00',
    tanggal_penyelesaian: row.sel,
    deskripsi: `Batas akhir penerimaan dokumen ${row.n} oleh KPPN Semarang I.`,
    ketentuan: 'SPM-LS nonkontraktual untuk pembayaran Desember 2026 dapat diajukan pada bulan berkenaan dengan melampirkan SPTJM sepanjang tidak melampaui batas waktu penyampaian yang ditentukan.',
    sub_deadlines: [
      { id: `sub-${row.k}-1`, label: 'Batas Penerimaan SPM oleh KPPN', tanggal: row.ter, jam: '17:00', jenis: 'Batas Diterima KPPN' },
      { id: `sub-${row.k}-2`, label: 'Batas Akhir Penyelesaian SP2D', tanggal: row.sel, jam: '17:00', jenis: 'Batas Penyelesaian' }
    ],
    prioritas: 'KRITIS',
    target_pengguna: ['PPSPM', 'BENDAHARA']
  });

  // Record 2: Batas Penyelesaian SP2D (terpisah sesuai Aturan Master)
  addEvent({
    kode_kegiatan: `LLAT-${row.k}B`,
    nama_kegiatan: `Batas Penyelesaian SP2D: ${row.n}`,
    kategori: 'SPM-LS Nonkontraktual',
    halaman_sumber: 'Halaman 6–7',
    jenis_dokumen: `SP2D ${row.doc}`,
    jenis_tenggat: 'Batas Penyelesaian',
    tahun_kalender_tenggat: row.thn || 2026,
    tanggal_batas: row.sel,
    jam_batas: '17:00',
    tanggal_penyelesaian: row.sel,
    deskripsi: `Batas akhir penyelesaian penerbitan SP2D oleh KPPN untuk ${row.n}.`,
    ketentuan: `Tenggat penyelesaian proses internal KPPN Semarang I atas penerimaan berkas tanggal ${row.ter}.`,
    prioritas: 'PENTING',
    target_pengguna: ['ADMIN']
  });
});

// -------------------------------------------------------------
// 6. SPM-LS KONTRAKTUAL (Hal 8)
// -------------------------------------------------------------
const spmKontrakData = [
  { p: 'Sampai dengan 30 September 2026', d: '2026-10-09' },
  { p: '1–31 Oktober 2026', d: '2026-11-06' },
  { p: '1–15 November 2026', d: '2026-11-20' },
  { p: '16–30 November 2026', d: '2026-12-07' },
  { p: '1–7 Desember 2026', d: '2026-12-09' },
  { p: '8–14 Desember 2026', d: '2026-12-16' },
  { p: '15–18 Desember 2026', d: '2026-12-23' }
];

spmKontrakData.forEach((row, idx) => {
  addEvent({
    kode_kegiatan: `LLAT-06.${idx + 1}`,
    nama_kegiatan: `SPM-LS Kontraktual Periode BAST/BAPP/Jaminan ${row.p}`,
    kategori: 'SPM-LS Kontraktual',
    halaman_sumber: 'Halaman 8',
    periode_transaksi: row.p,
    jenis_dokumen: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan Bank)',
    jenis_tenggat: 'Batas Diterima KPPN',
    tanggal_batas: row.d,
    jam_batas: '17:00',
    deskripsi: `Batas penyampaian SPM-LS Kontraktual ke KPPN Semarang I untuk periode BAST/BAPP/Jaminan ${row.p}.`,
    ketentuan: 'Penyelesaian mengikuti prosedur standar operasional dan norma waktu yang ditetapkan apabila tidak terdapat tanggal penyelesaian khusus.',
    prioritas: idx >= 4 ? 'KRITIS' : 'PENTING',
    target_pengguna: ['PPK', 'PPSPM']
  });
});

// -------------------------------------------------------------
// 7. PENGAJUAN SPM-UP/GUP/TUP (Hal 9)
// -------------------------------------------------------------
const uptupData = [
  { k: '7.1', n: 'Permohonan Persetujuan TUP Tunai', ter: '2026-11-11', sel: '2026-11-13', doc: 'Surat Permohonan TUP Tunai' },
  { k: '7.2', n: 'Permohonan Persetujuan UP/TUP KKP', ter: '2026-12-03', sel: '2026-12-04', doc: 'Surat Permohonan UP/TUP KKP' },
  { k: '7.3', n: 'SPM-TUP Tunai (Lampirkan Surat Persetujuan TUP)', ter: '2026-11-16', sel: '2026-11-18', doc: 'SPM-TUP Tunai' },
  { k: '7.4', n: 'SPM-UP Tunai, SPM-TUP KKP, dan SPM-GUP', ter: '2026-12-07', sel: '2026-12-09', doc: 'SPM-UP Tunai / SPM-TUP KKP / SPM-GUP' }
];

uptupData.forEach((row) => {
  addEvent({
    kode_kegiatan: `LLAT-${row.k}A`,
    nama_kegiatan: `Batas Diterima KPPN: ${row.n}`,
    kategori: 'Pengajuan SPM-UP/GUP/TUP',
    halaman_sumber: 'Halaman 9',
    jenis_dokumen: row.doc,
    jenis_tenggat: 'Batas Diterima KPPN',
    tanggal_batas: row.ter,
    jam_batas: '17:00',
    tanggal_penyelesaian: row.sel,
    deskripsi: `Batas penerimaan berkas ${row.n} oleh KPPN Semarang I.`,
    ketentuan: 'Permohonan TUP Tunai dilampiri rincian rencana penggunaan yang ditandatangani KPA dan SPTJM KPA.',
    sub_deadlines: [
      { id: `sub-${row.k}-1`, label: 'Batas Penerimaan Berkas', tanggal: row.ter, jam: '17:00', jenis: 'Batas Diterima KPPN' },
      { id: `sub-${row.k}-2`, label: 'Batas Penyelesaian SP2D / Persetujuan', tanggal: row.sel, jam: '17:00', jenis: 'Batas Penyelesaian' }
    ],
    prioritas: 'KRITIS',
    target_pengguna: ['KPA', 'BENDAHARA', 'PPSPM']
  });

  addEvent({
    kode_kegiatan: `LLAT-${row.k}B`,
    nama_kegiatan: `Batas Penyelesaian: ${row.n}`,
    kategori: 'Pengajuan SPM-UP/GUP/TUP',
    halaman_sumber: 'Halaman 9',
    jenis_dokumen: `Penyelesaian ${row.doc}`,
    jenis_tenggat: 'Batas Penyelesaian',
    tanggal_batas: row.sel,
    jam_batas: '17:00',
    tanggal_penyelesaian: row.sel,
    deskripsi: `Batas akhir penyelesaian permohonan/SP2D oleh KPPN untuk ${row.n}.`,
    ketentuan: `Tenggat penyelesaian internal KPPN Semarang I atas pengajuan tanggal ${row.ter}.`,
    prioritas: 'PENTING',
    target_pengguna: ['ADMIN']
  });
});

console.log("Sections 5, 6, 7 added. Total events:", events.length);

// -------------------------------------------------------------
// 8. PENYELESAIAN UANG PERSEDIAAN (Hal 10)
// -------------------------------------------------------------
const upData = [
  { k: '8.1', n: 'SPM TUP di Atas UP Tunai', ter: '2026-12-16', sel: '2026-12-18', doc: 'SPM TUP di atas UP Tunai' },
  { k: '8.2', n: 'SPM GUP Nihil atas UP Tunai', ter: '2027-01-11', sel: '2027-01-13', doc: 'SPM GUP Nihil atas UP Tunai', thn: 2027 },
  { k: '8.3', n: 'SPM GUP Nihil dan TUP KKP (Penutupan 31 Des)', ter: '2026-12-29', sel: '2026-12-30', doc: 'SPM GUP Nihil & TUP KKP' }
];

upData.forEach((row) => {
  addEvent({
    kode_kegiatan: `LLAT-${row.k}A`,
    nama_kegiatan: `Batas Diterima KPPN: ${row.n}`,
    kategori: 'Penyelesaian Uang Persediaan',
    halaman_sumber: 'Halaman 10',
    jenis_dokumen: row.doc,
    jenis_tenggat: 'Batas Diterima KPPN',
    tahun_kalender_tenggat: row.thn || 2026,
    tanggal_batas: row.ter,
    jam_batas: '17:00',
    tanggal_penyelesaian: row.sel,
    deskripsi: `Batas penerimaan dokumen ${row.n} oleh KPPN Semarang I.`,
    ketentuan: 'Penyelesaian pertanggungjawaban uang persediaan akhir tahun anggaran 2026.',
    sub_deadlines: [
      { id: `sub-${row.k}-1`, label: 'Batas Penerimaan SPM', tanggal: row.ter, jam: '17:00', jenis: 'Batas Diterima KPPN' },
      { id: `sub-${row.k}-2`, label: 'Batas Penyelesaian SP2D', tanggal: row.sel, jam: '17:00', jenis: 'Batas Penyelesaian' }
    ],
    prioritas: 'KRITIS',
    target_pengguna: ['BENDAHARA', 'PPSPM']
  });

  addEvent({
    kode_kegiatan: `LLAT-${row.k}B`,
    nama_kegiatan: `Batas Penyelesaian: ${row.n}`,
    kategori: 'Penyelesaian Uang Persediaan',
    halaman_sumber: 'Halaman 10',
    jenis_dokumen: `Penyelesaian ${row.doc}`,
    jenis_tenggat: 'Batas Penyelesaian',
    tahun_kalender_tenggat: row.thn || 2026,
    tanggal_batas: row.sel,
    jam_batas: '17:00',
    tanggal_penyelesaian: row.sel,
    deskripsi: `Batas akhir penyelesaian penerbitan SP2D ${row.n} oleh KPPN Semarang I.`,
    ketentuan: `Penyelesaian oleh KPPN atas berkas tanggal ${row.ter}.`,
    prioritas: 'PENTING',
    target_pengguna: ['ADMIN']
  });
});

addEvent({
  kode_kegiatan: 'LLAT-08.4',
  nama_kegiatan: 'Batas Penyetoran Sisa UP/TUP Tunai ke Kas Negara (Pukul 22.00 Waktu Setempat)',
  kategori: 'Penyelesaian Uang Persediaan',
  halaman_sumber: 'Halaman 10',
  jenis_dokumen: 'Bukti Penerimaan Negara (BPN) Sisa UP/TUP',
  jenis_tenggat: 'Batas Penyetoran',
  tanggal_mulai: '2026-12-01',
  tanggal_batas: '2026-12-31',
  jam_batas: '22:00',
  timezone: 'WIB',
  deskripsi: 'Batas penyetoran sisa dana UP/TUP Tunai ke Kas Negara melalui sistem penerimaan negara secara elektronik (NTPN).',
  ketentuan: 'Penyetoran dilakukan paling lambat pukul 22.00 waktu setempat (WIB). Simpan jam 15.00 sebagai batas rekonsiliasi dan jam 22.00 sebagai batas penyetoran.',
  prioritas: 'KRITIS',
  target_pengguna: ['BENDAHARA']
});

addEvent({
  kode_kegiatan: 'LLAT-08.5',
  nama_kegiatan: 'Batas Rekonsiliasi Posisi Kas Sisa UP/TUP Bendahara via SAKTI (Pukul 15.00 Waktu Setempat)',
  kategori: 'Penyelesaian Uang Persediaan',
  halaman_sumber: 'Halaman 10',
  jenis_dokumen: 'Data Rekonsiliasi Kas SAKTI',
  jenis_tenggat: 'Batas Rekonsiliasi',
  tanggal_mulai: '2026-12-01',
  tanggal_batas: '2026-12-31',
  jam_batas: '15:00',
  timezone: 'WIB',
  deskripsi: 'Bendahara Pengeluaran melakukan pencocokan data sisa UP/TUP dengan KPPN melalui SAKTI posisi pukul 15.00 WIB.',
  ketentuan: 'Posisi kas dipotong pukul 15.00 WIB untuk rekonsiliasi sisa UP/TUP sebelum batas akhir setor malam hari.',
  prioritas: 'KRITIS',
  target_pengguna: ['BENDAHARA', 'OPERATOR']
});

addEvent({
  kode_kegiatan: 'LLAT-08.6',
  nama_kegiatan: 'Penyampaian Surat Penjelasan Sisa UP/TUP yang Belum Dipertanggungjawabkan',
  kategori: 'Penyelesaian Uang Persediaan',
  halaman_sumber: 'Halaman 10',
  jenis_dokumen: 'Surat Penjelasan Sisa UP/TUP ke Kepala KPPN',
  jenis_tenggat: 'Batas Pelaporan',
  tahun_kalender_tenggat: 2027,
  tanggal_mulai: '2027-01-02',
  tanggal_batas: '2027-01-12',
  jam_batas: '17:00',
  deskripsi: 'Batas penyampaian surat penjelasan kepada Kepala KPPN mengenai sisa UP/TUP yang belum dipertanggungjawabkan.',
  ketentuan: 'Berlaku pada kondisi khusus apabila satker tidak memperoleh DIPA tahun berikutnya dan masih terdapat sisa UP/TUP yang belum dipertanggungjawabkan. Jangan diterapkan kepada seluruh satker tanpa syarat ini.',
  prioritas: 'PENTING',
  target_pengguna: ['KPA', 'BENDAHARA']
});

// -------------------------------------------------------------
// 9. KARTU KREDIT PEMERINTAH (KKP) (Hal 11)
// -------------------------------------------------------------
addEvent({
  kode_kegiatan: 'LLAT-09.1',
  nama_kegiatan: 'Batas Penggunaan Transaksi KKP / KPP Domestik',
  kategori: 'Kartu Kredit Pemerintah (KKP)',
  halaman_sumber: 'Halaman 11',
  jenis_dokumen: 'Transaksi Kartu Kredit Pemerintah',
  jenis_tenggat: 'Batas Transaksi',
  tanggal_mulai: '2026-10-01',
  tanggal_batas: '2026-12-16',
  jam_batas: '23:59',
  deskripsi: 'Batas akhir satker melakukan transaksi belanja menggunakan KKP dan KPP Domestik TA 2026.',
  ketentuan: 'Transaksi melalui KKP/KPP domestik hanya dapat digunakan sampai tanggal 16 Desember 2026 sesuai materi.',
  prioritas: 'KRITIS',
  target_pengguna: ['BENDAHARA', 'PPK']
});

addEvent({
  kode_kegiatan: 'LLAT-09.2A',
  nama_kegiatan: 'Batas Diterima KPPN: SPM-GUP KKP / SPM-TUP KKP',
  kategori: 'Kartu Kredit Pemerintah (KKP)',
  halaman_sumber: 'Halaman 11',
  jenis_dokumen: 'SPM-GUP KKP / SPM-TUP KKP',
  jenis_tenggat: 'Batas Diterima KPPN',
  tanggal_batas: '2026-12-18',
  jam_batas: '17:00',
  tanggal_penyelesaian: '2026-12-22',
  deskripsi: 'Batas penerimaan SPM-GUP KKP dan SPM-TUP KKP berdasarkan billing statement oleh KPPN Semarang I.',
  ketentuan: 'Pengajuan berdasarkan e-billing statement dari bank penerbit KKP.',
  sub_deadlines: [
    { id: 'sub-09-1', label: 'Batas Diterima KPPN', tanggal: '2026-12-18', jam: '17:00', jenis: 'Batas Diterima KPPN' },
    { id: 'sub-09-2', label: 'Batas Penyelesaian SP2D', tanggal: '2026-12-22', jam: '17:00', jenis: 'Batas Penyelesaian' }
  ],
  prioritas: 'KRITIS',
  target_pengguna: ['BENDAHARA', 'PPSPM']
});

addEvent({
  kode_kegiatan: 'LLAT-09.2B',
  nama_kegiatan: 'Batas Penyelesaian SP2D SPM-GUP KKP / SPM-TUP KKP',
  kategori: 'Kartu Kredit Pemerintah (KKP)',
  halaman_sumber: 'Halaman 11',
  jenis_dokumen: 'SP2D GUP KKP / TUP KKP',
  jenis_tenggat: 'Batas Penyelesaian',
  tanggal_batas: '2026-12-22',
  jam_batas: '17:00',
  tanggal_penyelesaian: '2026-12-22',
  deskripsi: 'Batas akhir penyelesaian SP2D penggantian kartu kredit pemerintah oleh KPPN Semarang I.',
  ketentuan: 'Tenggat penyelesaian atas berkas tanggal 18 Desember 2026.',
  prioritas: 'PENTING',
  target_pengguna: ['ADMIN']
});

addEvent({
  kode_kegiatan: 'LLAT-09.3',
  nama_kegiatan: 'Pembayaran kepada Bank Penerbit KKP / KPP',
  kategori: 'Kartu Kredit Pemerintah (KKP)',
  halaman_sumber: 'Halaman 11',
  jenis_dokumen: 'Pembayaran Tagihan Bank KKP',
  jenis_tenggat: 'Batas Pembayaran',
  tanggal_batas: '2026-12-31',
  jam_batas: '17:00',
  status_verifikasi: 'PERLU_PEMERIKSAAN_MANUAL',
  deskripsi: 'Tanggal pembayaran kepada bank penerbit yang tertera dalam diagram alur materi.',
  ketentuan: 'Status: PERLU PEMERIKSAAN MANUAL untuk memastikan keterkaitan tanggal dengan jenis transaksi sebelum publikasi resmi.',
  catatan: 'Perlu pemeriksaan manual terhadap diagram slide halaman 11.',
  prioritas: 'PENTING',
  target_pengguna: ['BENDAHARA']
});

// -------------------------------------------------------------
// 10. PENYETORAN SISA DANA KAS BENDAHARA SATKER (Hal 12)
// -------------------------------------------------------------
addEvent({
  kode_kegiatan: 'LLAT-10.1',
  nama_kegiatan: 'Batas Penyetoran Sisa Dana UP/TUP dan Dana Pembayaran Langsung Bendahara',
  kategori: 'Penyetoran Sisa Dana Kas Bendahara Satker',
  halaman_sumber: 'Halaman 12',
  jenis_dokumen: 'Penyetoran Kas Negara Sisa UP/TUP/LS',
  jenis_tenggat: 'Batas Penyetoran',
  tanggal_batas: '2026-12-31',
  jam_batas: '22:00',
  deskripsi: 'Bendahara menyetorkan seluruh sisa dana UP/TUP dan dana yang berasal dari pembayaran langsung kepada bendahara, baik tunai maupun di rekening bank, ke Kas Negara.',
  ketentuan: 'Pengecualian berlaku bagi kelompok satker tertentu: Perwakilan RI di luar negeri, satker tugas luar negeri, satker penanganan RI 1/RI 2, satker dana siaga bencana melewati TA, dan intelijen.',
  prioritas: 'KRITIS',
  target_pengguna: ['BENDAHARA']
});

addEvent({
  kode_kegiatan: 'LLAT-10.2',
  nama_kegiatan: 'Batas Penyetoran Seluruh Sisa PNBP pada Bendahara Penerimaan',
  kategori: 'Penyetoran Sisa Dana Kas Bendahara Satker',
  halaman_sumber: 'Halaman 12',
  jenis_dokumen: 'Penyetoran Sisa Kas PNBP',
  jenis_tenggat: 'Batas Penyetoran',
  tanggal_batas: '2026-12-31',
  jam_batas: '22:00',
  deskripsi: 'Sisa penerimaan negara yang masih berada pada bendahara penerimaan sampai dengan 31 Desember TA 2026 wajib disetorkan seluruhnya ke Kas Negara.',
  ketentuan: 'Penyetoran ke Kas Negara menggunakan kode akun penerimaan yang sesuai sebelum tutup buku 31 Desember 2026.',
  prioritas: 'KRITIS',
  target_pengguna: ['BENDAHARA']
});

console.log("Sections 8, 9, 10 added. Total events:", events.length);

// -------------------------------------------------------------
// 11. BELANJA DIPA BA BUN TA 2026 (Hal 13–14)
// -------------------------------------------------------------
addEvent({
  kode_kegiatan: 'LLAT-11.1',
  nama_kegiatan: 'Batas SPM Transfer ke Daerah TA 2026',
  kategori: 'Belanja DIPA BA BUN TA 2026',
  halaman_sumber: 'Halaman 13–14',
  jenis_dokumen: 'SPM Transfer ke Daerah',
  jenis_tenggat: 'Batas Diterima KPPN',
  tanggal_batas: '2026-12-23',
  jam_batas: '17:00',
  tanggal_penyelesaian: '2026-12-31',
  deskripsi: 'Batas penerimaan SPM Transfer ke Daerah oleh KPPN Semarang I dengan penyelesaian sampai dengan 31 Desember 2026.',
  ketentuan: 'Cakupan belanja BA BUN TA 2026: Utang LN/DN, Subsidi, Hibah LN, TKD, Pinjaman Pemerintah, Perjanjian Internasional, KUR, Investasi Pemerintah.',
  prioritas: 'KRITIS',
  target_pengguna: ['ADMIN', 'PPSPM']
});

addEvent({
  kode_kegiatan: 'LLAT-11.2',
  nama_kegiatan: 'Batas SPM Transfer ke Daerah Tenggat Pukul 15.00 WIB (31 Desember 2026)',
  kategori: 'Belanja DIPA BA BUN TA 2026',
  halaman_sumber: 'Halaman 13–14',
  jenis_dokumen: 'SPM Transfer ke Daerah Akhir Tahun',
  jenis_tenggat: 'Batas Diterima KPPN',
  tanggal_batas: '2026-12-31',
  jam_batas: '15:00',
  timezone: 'WIB',
  tanggal_penyelesaian: '2026-12-31',
  deskripsi: 'Batas akhir penerimaan SPM Transfer ke Daerah hari terakhir kerja TA 2026 dengan tenggat jam 15.00 WIB.',
  ketentuan: 'Penyelesaian SP2D selesai pada hari yang sama tanggal 31 Desember 2026.',
  prioritas: 'KRITIS',
  target_pengguna: ['ADMIN', 'PPSPM']
});

// -------------------------------------------------------------
// 12. BELANJA DIPA BA BUN TA 2026 YANG DISAHKAN PADA TA 2027 (Hal 15)
// -------------------------------------------------------------
const baBun27Data = [
  { k: '12.1', n: 'Pengesahan BM-DTP dan P-DTP', ter: '2027-01-29', doc: 'SPM Pengesahan BM-DTP & P-DTP', rel: '2 hari kerja setelah SPM diterima (tanggal SPM 31 Des 2026)' },
  { k: '12.2', n: 'Pengesahan Penambahan Investasi Pemerintah dari Saldo Kas BLU', ter: '2027-01-13', doc: 'SPM Pengesahan Investasi Saldo BLU', rel: '2 hari kerja setelah SPM diterima' },
  { k: '12.3', n: 'Pengesahan Hibah kepada Pemerintah/Lembaga Asing', ter: '2027-01-19', doc: 'SPM Pengesahan Hibah Luar Negeri', rel: '2 hari kerja setelah SPM diterima' }
];

baBun27Data.forEach((row) => {
  addEvent({
    kode_kegiatan: `LLAT-${row.k}`,
    nama_kegiatan: `Batas Penerimaan: ${row.n}`,
    kategori: 'Belanja BA BUN Disahkan pada TA 2027',
    halaman_sumber: 'Halaman 15',
    jenis_dokumen: row.doc,
    jenis_tenggat: 'Batas Diterima KPPN',
    tahun_kalender_tenggat: 2027,
    tanggal_batas: row.ter,
    jam_batas: '17:00',
    deskripsi: `Batas SPM diterima KPPN untuk ${row.n} yang merupakan pengesahan beban TA 2026 pada awal TA 2027.`,
    ketentuan: `Penyelesaian: ${row.rel}. Tanggal penerimaan dan tanggal penyelesaian ditampilkan terpisah karena tanggal pasti penyelesaian mengikuti norma hari kerja.`,
    aturan_rel_tenggat: row.rel,
    prioritas: 'PENTING',
    target_pengguna: ['ADMIN', 'PPSPM']
  });
});

// -------------------------------------------------------------
// 13. BELANJA DIPA BA BUN TA 2027 DIBAYARKAN AKHIR TA 2026 (Hal 16)
// -------------------------------------------------------------
const baBunBayar26 = [
  { k: '13.1', n: 'SPM-LS DHI Januari 2027', ter: '2026-12-23', sel: '2026-12-31', ket: 'Diberikan tanggal 4 Januari 2027 sesuai materi', doc: 'SPM-LS DHI Jan 2027' },
  { k: '13.2', n: 'SPM-LS Belanja Pensiun Januari 2027', ter: '2026-12-23', sel: '2026-12-31', ket: 'Diberikan tanggal 4 Januari 2027 sesuai materi', doc: 'SPM-LS Belanja Pensiun Jan 2027' },
  { k: '13.3', n: 'SPM-LS Utang Dalam Negeri Tagihan 4 Januari 2027', ter: '2026-12-29', sel: '2027-01-04', ket: 'Penyelesaian SP2D tanggal 4 Januari 2027', doc: 'SPM-LS Utang DN Tagihan 4 Jan' },
  { k: '13.4', n: 'SPM-LS Utang Dalam Negeri Tagihan 6 Januari 2027', ter: '2026-12-30', sel: '2027-01-06', ket: 'Penyelesaian SP2D tanggal 6 Januari 2027', doc: 'SPM-LS Utang DN Tagihan 6 Jan' },
  { k: '13.5', n: 'SPM-LS Utang Luar Negeri Valuta 4 Januari 2027', ter: '2026-12-23', sel: '2026-12-30', ket: 'Diberikan tanggal 4 Januari 2027 sesuai catatan', doc: 'SPM-LS Utang LN Valuta 4 Jan' },
  { k: '13.6', n: 'SPM-LS Utang Luar Negeri Valuta 6 Januari 2027', ter: '2026-12-28', sel: '2026-12-30', ket: 'Diberikan tanggal 6 Januari 2027 sesuai catatan', doc: 'SPM-LS Utang LN Valuta 6 Jan' }
];

baBunBayar26.forEach((row) => {
  addEvent({
    kode_kegiatan: `LLAT-${row.k}`,
    nama_kegiatan: `${row.n}`,
    kategori: 'Belanja BA BUN 2027 Dibayar Akhir TA 2026',
    halaman_sumber: 'Halaman 16',
    jenis_dokumen: row.doc,
    jenis_tenggat: 'Batas Diterima KPPN',
    tanggal_batas: row.ter,
    jam_batas: '17:00',
    tanggal_penyelesaian: row.sel,
    deskripsi: `Batas diterima SPM oleh KPPN: ${row.ter}, batas penyelesaian: ${row.sel}. ${row.ket}.`,
    ketentuan: row.ket,
    sub_deadlines: [
      { id: `sub-${row.k}-1`, label: 'Batas Diterima KPPN', tanggal: row.ter, jam: '17:00', jenis: 'Batas Diterima KPPN' },
      { id: `sub-${row.k}-2`, label: 'Batas Penyelesaian SP2D', tanggal: row.sel, jam: '17:00', jenis: 'Batas Penyelesaian' }
    ],
    status_verifikasi: row.n.includes('DHI') ? 'PERLU_PEMERIKSAAN_MANUAL' : 'TERVERIFIKASI',
    prioritas: 'KRITIS',
    target_pengguna: ['ADMIN', 'PPSPM']
  });
});

// -------------------------------------------------------------
// 14. PENGENDALIAN BELANJA (Hal 17)
// -------------------------------------------------------------
addEvent({
  kode_kegiatan: 'LLAT-14.OPS',
  nama_kegiatan: 'Kebijakan Pengendalian Belanja & Mekanisme Tunggakan Akhir Tahun',
  kategori: 'Pengendalian Belanja',
  halaman_sumber: 'Halaman 17',
  jenis_dokumen: 'Kebijakan Pengendalian Belanja Menkeu / Dirjen Perbendaharaan',
  jenis_tenggat: 'Ketentuan Operasional',
  is_tanggal_pasti: false,
  aturan_rel_tenggat: 'Ketentuan kebijakan operasional akhir tahun',
  tanggal_mulai: '2026-10-01',
  tanggal_batas: '2026-12-31',
  deskripsi: 'Ditjen Perbendaharaan melaksanakan pengendalian belanja. KPPN dapat diminta melakukan penolakan penerbitan NRK, penolakan SPM belum SP2D, pembatalan SP2D.',
  ketentuan: 'Jika terdapat pengendalian belanja, pembayaran dapat dilakukan melalui mekanisme tunggakan sesuai aturan perencanaan, pelaksanaan, serta akuntansi pelaporan.',
  prioritas: 'PENTING',
  target_pengguna: ['KPA', 'PPK', 'PPSPM', 'ADMIN']
});

// -------------------------------------------------------------
// 15. SPM AKHIR TAHUN DAN BIAYA PEMELIHARAAN PEKERJAAN (Hal 18)
// -------------------------------------------------------------
addEvent({
  kode_kegiatan: 'LLAT-15.1',
  nama_kegiatan: 'Batas SPM Akhir Tahun Penampungan (Kode 171) Darurat Bencana',
  kategori: 'SPM Akhir Tahun dan Biaya Pemeliharaan',
  halaman_sumber: 'Halaman 18',
  jenis_dokumen: 'SPM Penampungan Kode 171 (Darurat Bencana)',
  jenis_tenggat: 'Batas Diterima KPPN',
  periode_transaksi: 'BAST Pekerjaan 19–31 Desember 2026',
  tanggal_batas: '2026-12-23',
  jam_batas: '17:00',
  deskripsi: 'BAST untuk pekerjaan kontraktual dan nonkontraktual terkait keadaan darurat bencana periode 19–31 Desember 2026.',
  ketentuan: 'Batas paling lambat penerimaan SPM oleh KPPN: 23 Desember 2026 dengan kode SPM penampungan 171 sebesar nilai perkiraan pekerjaan yang diselesaikan s.d. 31 Des 2026.',
  prioritas: 'KRITIS',
  target_pengguna: ['PPK', 'PPSPM']
});

addEvent({
  kode_kegiatan: 'LLAT-15.2',
  nama_kegiatan: 'Ketentuan Biaya Pemeliharaan Pekerjaan / Retensi Melewati TA 2026',
  kategori: 'SPM Akhir Tahun dan Biaya Pemeliharaan',
  halaman_sumber: 'Halaman 18',
  jenis_dokumen: 'Jaminan Pemeliharaan / SPM Retensi',
  jenis_tenggat: 'Ketentuan Operasional',
  is_tanggal_pasti: false,
  aturan_rel_tenggat: 'Pekerjaan fisik harus telah selesai 100%',
  tanggal_mulai: '2026-11-01',
  tanggal_batas: '2026-12-31',
  deskripsi: 'Ketentuan pembayaran biaya pemeliharaan/retensi pekerjaan yang masa pemeliharaannya melewati akhir tahun anggaran 2026.',
  ketentuan: 'Pekerjaan fisik selesai 100%. Retensi dapat dibayar pada TA 2026 jika disertai jaminan pemeliharaan/pembayaran yang dapat dicairkan pada TA 2027. Penatausahaan jaminan oleh PPSPM.',
  prioritas: 'PENTING',
  target_pengguna: ['PPK', 'PPSPM']
});

console.log("Sections 11 to 15 added. Total events:", events.length);

// -------------------------------------------------------------
// 16. PROYEKSI PENERIMAAN DAN PENGELUARAN BLU (Hal 19)
// -------------------------------------------------------------
const bluProyeksiData = [
  { bln: 'Oktober 2026', ter: '2026-10-07', mut: '2026-10-14' },
  { bln: 'November 2026', ter: '2026-11-06', mut: '2026-11-13' },
  { bln: 'Desember 2026', ter: '2026-12-07', mut: '2026-12-14' }
];

bluProyeksiData.forEach((row, idx) => {
  addEvent({
    kode_kegiatan: `LLAT-16.${idx + 1}A`,
    nama_kegiatan: `Penyampaian Proyeksi Kas BLU Bulan ${row.bln}`,
    kategori: 'Proyeksi Penerimaan & Pengeluaran BLU',
    halaman_sumber: 'Halaman 19',
    periode_transaksi: `Bulan ${row.bln}`,
    jenis_dokumen: 'Proyeksi Penerimaan dan Pengeluaran BLU',
    jenis_tenggat: 'Batas Penyampaian',
    tanggal_batas: row.ter,
    jam_batas: '17:00',
    tanggal_penyelesaian: row.mut,
    deskripsi: `Batas penyampaian proyeksi penerimaan dan pengeluaran Satker BLU bulan ${row.bln} ke Direktorat PPK BLU.`,
    ketentuan: 'Proyeksi digunakan untuk memperkirakan kebutuhan belanja layanan, mengantisipasi potensi kekurangan likuiditas, dan optimalisasi saldo kas.',
    sub_deadlines: [
      { id: `sub-16-${idx}-1`, label: 'Batas Penyampaian Proyeksi', tanggal: row.ter, jam: '17:00', jenis: 'Batas Penyampaian' },
      { id: `sub-16-${idx}-2`, label: 'Batas Pemutakhiran Proyeksi', tanggal: row.mut, jam: '17:00', jenis: 'Batas Pemutakhiran' }
    ],
    prioritas: 'PENTING',
    target_pengguna: ['BLU', 'BENDAHARA']
  });

  addEvent({
    kode_kegiatan: `LLAT-16.${idx + 1}B`,
    nama_kegiatan: `Batas Pemutakhiran Proyeksi Kas BLU Bulan ${row.bln}`,
    kategori: 'Proyeksi Penerimaan & Pengeluaran BLU',
    halaman_sumber: 'Halaman 19',
    periode_transaksi: `Bulan ${row.bln}`,
    jenis_dokumen: 'Pemutakhiran Proyeksi Kas BLU',
    jenis_tenggat: 'Batas Pemutakhiran',
    tanggal_batas: row.mut,
    jam_batas: '17:00',
    deskripsi: `Batas pemutakhiran proyeksi penerimaan dan pengeluaran Satker BLU bulan ${row.bln}.`,
    ketentuan: `Pemutakhiran berkala atas proyeksi yang diajukan pada tanggal ${row.ter}.`,
    prioritas: 'PENTING',
    target_pengguna: ['BLU', 'BENDAHARA']
  });
});

// -------------------------------------------------------------
// 17. PENGESAHAN PENDAPATAN DAN BELANJA BLU (Hal 20)
// -------------------------------------------------------------
const bluPengesahan = [
  { k: '17.1', p: '5–31 Oktober 2026', ter: '2026-11-02', sel: 'Norma Waktu SOP SP2B', doc: 'SP3B-BLU 5–31 Oktober 2026' },
  { k: '17.2', p: '1–30 November 2026', ter: '2026-12-03', sel: 'Norma Waktu SOP SP2B', doc: 'SP3B-BLU 1–30 November 2026' },
  { k: '17.3', p: '1–14 Desember 2026', ter: '2026-12-21', sel: '2026-12-28', doc: 'SP3B-BLU 1–14 Desember 2026' },
  { k: '17.4', p: '15–31 Desember 2026', ter: '2027-01-07', sel: '2027-01-12', doc: 'SP3B-BLU 15–31 Desember 2026', thn: 2027 }
];

bluPengesahan.forEach((row) => {
  addEvent({
    kode_kegiatan: `LLAT-${row.k}`,
    nama_kegiatan: `Pengesahan Pendapatan & Belanja BLU Periode ${row.p}`,
    kategori: 'Pengesahan Pendapatan dan Belanja BLU',
    halaman_sumber: 'Halaman 20',
    periode_transaksi: `Realisasi ${row.p}`,
    jenis_dokumen: row.doc,
    jenis_tenggat: 'Batas Diterima KPPN',
    tahun_kalender_tenggat: row.thn || 2026,
    tanggal_batas: row.ter,
    jam_batas: '17:00',
    tanggal_penyelesaian: row.sel.includes('-') ? row.sel : undefined,
    deskripsi: `Batas SP3B diterima KPPN Semarang I untuk realisasi periode ${row.p}. Batas penyelesaian SP2B: ${row.sel}.`,
    ketentuan: 'Oktober & November: pengesahan minimal 1 kali sebulan. Desember: minimal 2 kali. KPPN melakukan rekonsiliasi rekening transito pada tanggal penerbitan SP2B.',
    sub_deadlines: [
      { id: `sub-${row.k}-1`, label: 'Batas SP3B Diterima KPPN', tanggal: row.ter, jam: '17:00', jenis: 'Batas Diterima KPPN' },
      ...(row.sel.includes('-') ? [{ id: `sub-${row.k}-2`, label: 'Batas Penyelesaian SP2B', tanggal: row.sel, jam: '17:00', jenis: 'Batas Penyelesaian' }] : [])
    ],
    prioritas: 'KRITIS',
    target_pengguna: ['BLU', 'BENDAHARA', 'PPSPM']
  });
});

// -------------------------------------------------------------
// 18. PENGESAHAN BELANJA, PEMBIAYAAN, DAN PENERIMAAN NONANGGARAN BLU (Hal 21)
// -------------------------------------------------------------
addEvent({
  kode_kegiatan: 'LLAT-18.1',
  nama_kegiatan: 'Batas Pengesahan Belanja Modal Tanah PSN Satker BLU',
  kategori: 'Pengesahan Belanja & Pembiayaan Nonanggaran BLU',
  halaman_sumber: 'Halaman 21',
  jenis_dokumen: 'SPM Belanja Modal Tanah PSN BLU',
  jenis_tenggat: 'Batas Diterima KPPN',
  tahun_kalender_tenggat: 2027,
  tanggal_batas: '2027-01-19',
  jam_batas: '17:00',
  tanggal_penyelesaian: '2027-01-21',
  deskripsi: 'SPM diterima KPPN tanggal 19 Januari 2027, SP2D diselesaikan paling lambat 21 Januari 2027.',
  ketentuan: 'Kegiatan pengesahan belanja modal tanah Proyek Strategis Nasional (PSN) oleh Satker BLU terkait TA 2026.',
  prioritas: 'PENTING',
  target_pengguna: ['BLU', 'ADMIN']
});

addEvent({
  kode_kegiatan: 'LLAT-18.2',
  nama_kegiatan: 'Batas Pengesahan Belanja Barang/Modal oleh BP BDLH',
  kategori: 'Pengesahan Belanja & Pembiayaan Nonanggaran BLU',
  halaman_sumber: 'Halaman 21',
  jenis_dokumen: 'SPM Belanja BP BDLH',
  jenis_tenggat: 'Batas Diterima KPPN',
  tahun_kalender_tenggat: 2027,
  tanggal_batas: '2027-01-08',
  jam_batas: '17:00',
  tanggal_penyelesaian: '2027-01-12',
  deskripsi: 'SPM diterima KPPN tanggal 8 Januari 2027, SP2D diselesaikan paling lambat 12 Januari 2027.',
  ketentuan: 'Pengesahan belanja barang dan/atau belanja modal oleh Badan Pengelola Dana Lingkungan Hidup (BP BDLH).',
  prioritas: 'PENTING',
  target_pengguna: ['BLU', 'ADMIN']
});

addEvent({
  kode_kegiatan: 'LLAT-18.3',
  nama_kegiatan: 'Pengesahan Penambahan Investasi Pemerintah dari Saldo Kas BLU',
  kategori: 'Pengesahan Belanja & Pembiayaan Nonanggaran BLU',
  halaman_sumber: 'Halaman 21',
  jenis_dokumen: 'SPM & SP2D Pengesahan Investasi BLU',
  jenis_tenggat: 'Batas Penyampaian di Satker',
  tahun_kalender_tenggat: 2027,
  tanggal_batas: '2027-01-07',
  jam_batas: '17:00',
  deskripsi: 'SPM disampaikan di Satker tanggal 7 Januari 2027 dengan ketentuan SPM dan SP2D diberi tanggal 31 Desember 2026 sesuai materi.',
  ketentuan: 'Jangan menyamakan tanggal penyampaian di satker dengan tanggal dokumen pengesahan (tanggal dokumen 31 Desember 2026).',
  prioritas: 'PENTING',
  target_pengguna: ['BLU', 'BENDAHARA']
});

// -------------------------------------------------------------
// 19. PENYELESAIAN SISA DANA PNBP BLU (Hal 22)
// -------------------------------------------------------------
addEvent({
  kode_kegiatan: 'LLAT-19.1',
  nama_kegiatan: 'Batas Penyetoran Sisa Dana PNBP BLU ke Rekening Operasional',
  kategori: 'Penyelesaian Sisa Dana PNBP BLU',
  halaman_sumber: 'Halaman 22',
  jenis_dokumen: 'Penyetoran Kas PNBP BLU',
  jenis_tenggat: 'Batas Penyetoran',
  tanggal_batas: '2026-12-31',
  jam_batas: '22:00',
  deskripsi: 'Seluruh uang tunai PNBP BLU wajib disetor ke rekening operasional penerimaan sesuai peruntukannya paling lambat 31 Desember 2026.',
  ketentuan: 'Memastikan saldo kas tunai pada bendahara BLU nihil pada akhir tahun anggaran.',
  prioritas: 'KRITIS',
  target_pengguna: ['BLU', 'BENDAHARA']
});

addEvent({
  kode_kegiatan: 'LLAT-19.2',
  nama_kegiatan: 'Batas Rekonsiliasi Sisa Dana PNBP Satker BLU',
  kategori: 'Penyelesaian Sisa Dana PNBP BLU',
  halaman_sumber: 'Halaman 22',
  jenis_dokumen: 'Berita Acara Rekonsiliasi Kas BLU',
  jenis_tenggat: 'Batas Rekonsiliasi',
  tahun_kalender_tenggat: 2027,
  tanggal_batas: '2027-01-06',
  jam_batas: '17:00',
  deskripsi: 'Bendahara penerimaan dan pengeluaran melakukan rekonsiliasi transaksi dengan rekening bank paling lambat 6 Januari 2027.',
  ketentuan: 'Bedakan secara tegas: 1. Uang tunai penerimaan BLU, 2. Sisa dana operasional/belum dibelanjakan, 3. Uang muka, titipan, donasi, hibah yang belum diakui.',
  prioritas: 'PENTING',
  target_pengguna: ['BLU', 'BENDAHARA']
});

// -------------------------------------------------------------
// 20. PENYELESAIAN ADMINISTRASI HIBAH LANGSUNG (Hal 23)
// -------------------------------------------------------------
const hibahA = [
  { k: '20.1', n: 'Kelompok A: Izin Buka Rekening Hibah (Realisasi s.d. 21 Des)', ter: '2026-12-21', sel: '2026-12-28', doc: 'Permohonan Izin Pembukaan Rekening Hibah' },
  { k: '20.2', n: 'Kelompok A: Usulan Revisi Anggaran Hibah (Pukul 13.00 WIB)', ter: '2026-12-29', jam: '13:00', sel: '2026-12-29', doc: 'Usulan Revisi Anggaran Hibah' }
];

const hibahB = [
  { k: '20.3', n: 'Kelompok B: Izin Buka Rekening Hibah Uang (Realisasi setelah 21 Des)', ter: '2026-12-30', sel: '2026-12-30', doc: 'Permohonan Izin Rekening Hibah Kelompok B' },
  { k: '20.4', n: 'Kelompok B: Usulan Revisi Anggaran Hibah Uang', ter: '2026-12-30', sel: '2026-12-30', doc: 'Usulan Revisi Anggaran Hibah Kelompok B' }
];

[...hibahA, ...hibahB].forEach((row) => {
  addEvent({
    kode_kegiatan: `LLAT-${row.k}`,
    nama_kegiatan: `${row.n}`,
    kategori: 'Penyelesaian Administrasi Hibah Langsung',
    halaman_sumber: 'Halaman 23',
    jenis_dokumen: row.doc,
    jenis_tenggat: 'Batas Pengajuan',
    tanggal_batas: row.ter,
    jam_batas: row.jam || '17:00',
    tanggal_penyelesaian: row.sel,
    deskripsi: `Batas pengajuan permohonan ke KPPN Semarang I: ${row.ter} (pukul ${row.jam || '17:00'} WIB). Batas penyelesaian: ${row.sel}.`,
    ketentuan: 'Pertahankan pemisahan hibah uang dan hibah barang/jasa/surat berharga, serta pemisahan waktu realisasi s.d. 21 Des vs setelah 21 Des.',
    sub_deadlines: [
      { id: `sub-${row.k}-1`, label: 'Batas Pengajuan', tanggal: row.ter, jam: row.jam || '17:00', jenis: 'Batas Pengajuan' },
      { id: `sub-${row.k}-2`, label: 'Batas Penyelesaian', tanggal: row.sel, jam: '17:00', jenis: 'Batas Penyelesaian' }
    ],
    prioritas: 'KRITIS',
    target_pengguna: ['BENDAHARA', 'PPK']
  });
});

console.log("Sections 16 to 20 added. Total events:", events.length);

// -------------------------------------------------------------
// 21. ADMINISTRASI HIBAH LANGSUNG LANJUTAN (Hal 24)
// -------------------------------------------------------------
const hibahLanjutan = [
  { k: '21.1', n: 'SP2HL/SP4HL Transaksi 1 Jan–21 Des 2026', ter: '2027-01-08', sel: '2027-01-12', doc: 'SP2HL/SP4HL Transaksi s.d. 21 Des', ket: 'Dokumen diberi tanggal 31 Desember 2026 sesuai materi' },
  { k: '21.2', n: 'SP2HL/SP4HL Transaksi Tahun Anggaran yang Lalu', ter: '2027-01-08', sel: '2027-01-12', doc: 'SP2HL/SP4HL Transaksi TA Lalu', ket: 'Pengesahan transaksi hibah langsung tahun lalu' },
  { k: '21.3', n: 'SP2HL/SP4HL Transaksi Setelah 21 Desember 2026', ter: '2027-01-08', sel: '2027-01-13', doc: 'SP2HL/SP4HL Transaksi setelah 21 Des', ket: 'Batas penyelesaian SP2D: 13 Januari 2027' },
  { k: '21.4', n: 'MPHL-BJS Realisasi sampai dengan 31 Desember 2026', ter: '2027-01-08', sel: '2027-01-13', doc: 'MPHL-BJS Realisasi s.d. 31 Des', ket: 'Batas penyelesaian SP2D: 13 Januari 2027' }
];

hibahLanjutan.forEach((row) => {
  addEvent({
    kode_kegiatan: `LLAT-${row.k}`,
    nama_kegiatan: `Pengesahan Hibah: ${row.n}`,
    kategori: 'Administrasi Hibah Langsung Lanjutan',
    halaman_sumber: 'Halaman 24',
    jenis_dokumen: row.doc,
    jenis_tenggat: 'Batas Diterima KPPN',
    tahun_kalender_tenggat: 2027,
    tanggal_batas: row.ter,
    jam_batas: '17:00',
    tanggal_penyelesaian: row.sel,
    deskripsi: `Batas dokumen diterima KPPN: ${row.ter}. Batas penyelesaian oleh KPPN: ${row.sel}. ${row.ket}.`,
    ketentuan: 'Penyampaian SP2HL/SP4HL/MPHL-BJS kepada KPPN dilakukan secara periodik minimal 1 kali sebulan untuk transaksi Okt dan Nov 2026.',
    sub_deadlines: [
      { id: `sub-${row.k}-1`, label: 'Batas Diterima KPPN', tanggal: row.ter, jam: '17:00', jenis: 'Batas Diterima KPPN' },
      { id: `sub-${row.k}-2`, label: 'Batas Penyelesaian SP2D', tanggal: row.sel, jam: '17:00', jenis: 'Batas Penyelesaian' }
    ],
    prioritas: 'KRITIS',
    target_pengguna: ['BENDAHARA', 'PPK', 'PPSPM']
  });
});

// -------------------------------------------------------------
// 22. PENARIKAN PHLN DAN PDN (Hal 25)
// -------------------------------------------------------------
addEvent({
  kode_kegiatan: 'LLAT-22.1',
  nama_kegiatan: 'Pengajuan Surat Penarikan Dana (Direct Payment / Pembiayaan Pendahuluan)',
  kategori: 'Penarikan PHLN dan PDN',
  halaman_sumber: 'Halaman 25',
  jenis_dokumen: 'Surat Penarikan Dana PHLN/PDN',
  jenis_tenggat: 'Ketentuan Relatif',
  is_tanggal_pasti: false,
  aturan_rel_tenggat: 'Paling lambat diterima KPPN KPH dua hari kerja sebelum batas yang ditentukan pemberi pinjaman',
  tanggal_mulai: '2026-10-01',
  tanggal_batas: '2026-11-30',
  deskripsi: 'Satker mengajukan surat penarikan dana melalui mekanisme pembayaran langsung atau pembiayaan pendahuluan kepada KPPN KPH.',
  ketentuan: 'Ini adalah ketentuan relatif dua hari kerja sebelum batas pemberi pinjaman. Jika realisasi direct payment/LC melebihi pagu, satker dapat mengajukan revisi anggaran dengan sumber dana sama.',
  prioritas: 'PENTING',
  target_pengguna: ['PPK', 'PPSPM']
});

addEvent({
  kode_kegiatan: 'LLAT-22.2',
  nama_kegiatan: 'Penarikan Dana Tanpa Batas Waktu Khusus dari Pemberi Pinjaman',
  kategori: 'Penarikan PHLN dan PDN',
  halaman_sumber: 'Halaman 25',
  jenis_dokumen: 'Surat Penarikan Dana PHLN/PDN (Reguler)',
  jenis_tenggat: 'Batas Diterima KPPN KPH',
  tanggal_mulai: '2026-10-01',
  tanggal_batas: '2026-11-30',
  jam_batas: '17:00',
  deskripsi: 'Batas penerimaan KPPN KPH: 30 November 2026 pada hari kerja jika pemberi PHLN dan/atau PDN tidak menentukan batas waktu khusus.',
  ketentuan: 'Berlaku jika pemberi PHLN/PDN tidak menetapkan batas khusus.',
  prioritas: 'PENTING',
  target_pengguna: ['PPK', 'PPSPM']
});

// -------------------------------------------------------------
// 23. AKUNTANSI DAN PELAPORAN (Hal 26–27)
// -------------------------------------------------------------
const lapkeuData = [
  { p: 'Sampai dengan 30 September 2026', d: '2026-10-15' },
  { p: 'Sampai dengan 31 Oktober 2026', d: '2026-11-16' },
  { p: 'Sampai dengan 30 November 2026', d: '2026-12-15' },
  { p: 'Sampai dengan 31 Desember 2026', d: '2027-01-25', thn: 2027 }
];

lapkeuData.forEach((row, idx) => {
  addEvent({
    kode_kegiatan: `LLAT-23.1${String.fromCharCode(65 + idx)}`,
    nama_kegiatan: `Monitoring Kualitas Data Laporan Keuangan Periode ${row.p}`,
    kategori: 'Akuntansi dan Pelaporan',
    halaman_sumber: 'Halaman 26–27',
    periode_transaksi: row.p,
    jenis_dokumen: 'Data Transaksi & Koreksi MonSAKTI',
    jenis_tenggat: 'Batas Pelaporan / Rekonsiliasi',
    tahun_kalender_tenggat: row.thn || 2026,
    tanggal_batas: row.d,
    jam_batas: '17:00',
    deskripsi: `Batas penerimaan data/koreksi laporan keuangan untuk transaksi ${row.p} pada MonSAKTI.`,
    ketentuan: 'Rekonsiliasi internal (UP/TUP dengan bendahara, UAKPA vs UAKBUN, UAKPA vs piutang) dan rekonsiliasi eksternal (UAKPA/UAKPA BUN dengan KPPN).',
    prioritas: 'KRITIS',
    target_pengguna: ['UAKPA', 'BENDAHARA']
  });
});

addEvent({
  kode_kegiatan: 'LLAT-23.2',
  nama_kegiatan: 'Penyampaian LPJ Bendahara dan Alur Rekonsiliasi Akhir Tahun',
  kategori: 'Akuntansi dan Pelaporan',
  halaman_sumber: 'Halaman 26–27',
  jenis_dokumen: 'LPJ Bendahara Penerimaan & Pengeluaran',
  jenis_tenggat: 'Ketentuan Relatif',
  is_tanggal_pasti: false,
  aturan_rel_tenggat: 'Ketentuan waktu dalam hari kerja sebelum/sesudah batas penyampaian LPJ sesuai alur Satker - KPPN - Kanwil - PKN',
  tanggal_mulai: '2026-12-01',
  tanggal_batas: '2027-01-18',
  deskripsi: 'Alur penyampaian LPJ Bendahara melalui Satuan Kerja, KPPN Semarang I, Kanwil DJPb Jateng, dan Direktorat PKN.',
  ketentuan: 'Aturan relatif berdasarkan pihak pengirim dan penerima. Satker segera menyelesaikan transaksi keuangan dan transaksi BMN secara rutin.',
  prioritas: 'KRITIS',
  target_pengguna: ['BENDAHARA', 'UAKPA']
});

// -------------------------------------------------------------
// 24. PENGATURAN JAM LAYANAN DESEMBER 2026 (Hal 29)
// -------------------------------------------------------------
addEvent({
  kode_kegiatan: 'LLAT-24.OPS',
  nama_kegiatan: 'Ketentuan Jam Layanan KPPN Semarang I Desember 2026',
  kategori: 'Pengaturan Jam Layanan KPPN Desember 2026',
  halaman_sumber: 'Halaman 29',
  jenis_dokumen: 'Keputusan Jam Layanan & Dispensasi',
  jenis_tenggat: 'Ketentuan Operasional',
  is_tanggal_pasti: false,
  aturan_rel_tenggat: 'Jam Layanan Reguler 08.00–17.00 WIB (Dispensasi jika diperlukan)',
  tanggal_mulai: '2026-12-01',
  tanggal_batas: '2026-12-31',
  deskripsi: 'KPPN membuka layanan pukul 08.00–17.00 WIB. Layanan di luar jam kerja/hari libur nasional/Sabtu-Minggu dapat diatur setelah memperoleh dispensasi dari Kepala Kanwil DJPb.',
  ketentuan: 'Dispensasi diajukan setelah koordinasi dengan satker untuk kebutuhan mendesak dan tambahan waktu verifikasi SPM beserta dokumen pendukung.',
  prioritas: 'NORMAL',
  target_pengguna: ['SEMUA_SATKER', 'ADMIN']
});

// -------------------------------------------------------------
// 25. CRITICAL POINT & KEBERLANGSUNGAN LAYANAN (Hal 30–31)
// -------------------------------------------------------------
addEvent({
  kode_kegiatan: 'LLAT-25.OPS',
  nama_kegiatan: 'Critical Point & Strategi Keberlangsungan Layanan Akhir Tahun',
  kategori: 'Critical Point & Keberlangsungan Layanan',
  halaman_sumber: 'Halaman 30–31',
  jenis_dokumen: 'Standar Operasional Prosedur Darurat & Mitigasi Risiko',
  jenis_tenggat: 'Ketentuan Operasional',
  is_tanggal_pasti: false,
  aturan_rel_tenggat: 'Mitigasi risiko dan kesiapsiagaan layanan berkelanjutan',
  tanggal_mulai: '2026-10-01',
  tanggal_batas: '2027-01-31',
  deskripsi: 'Pengendalian belanja, mitigasi potensi peningkatan lonjakan SPM, penggunaan RPATA, dan kesiapan SDM, infrastruktur, dan jaringan sistem.',
  ketentuan: 'Internalisasi pegawai, transfer pengetahuan langkah akhir tahun, pemetaan peran peran, sosialisasi stakeholder, dan simulasi kesiapsiagaan operasional.',
  prioritas: 'PENTING',
  target_pengguna: ['SEMUA_SATKER', 'ADMIN']
});

console.log("ALL 25 SECTIONS COMPLETE! Total master events:", events.length);

// Save to llat_generated.json
const payload = {
  events,
  categories,
  settings: {
    is_active: true,
    menu_title: 'Monitoring LLAT',
    menu_description: 'Pusat Pengendalian Jadwal & Langkah-Langkah Akhir Tahun (LLAT) KPPN Semarang I TA 2026.',
    menu_icon: '📅',
    tahun_aktif: 2026,
    version: 2,
    reminder: {
      reminder_h7: true,
      reminder_h3: true,
      reminder_h1: true,
      reminder_h0: true
    }
  },
  auditLogs: [
    {
      id: `audit-${Date.now()}-init`,
      user: 'Administrator KPPN Semarang I',
      action: 'IMPORT_MASTER_LLAT_2026',
      timestamp: new Date().toISOString(),
      details: 'Pengisian awal Data Master LLAT TA 2026 dari materi sosialisasi resmi (Bagian 1-25).'
    }
  ],
  updatedAt: new Date().toISOString()
};

fs.writeFileSync('llat_generated.json', JSON.stringify(payload, null, 2), 'utf8');
console.log("Successfully wrote llat_generated.json!");

