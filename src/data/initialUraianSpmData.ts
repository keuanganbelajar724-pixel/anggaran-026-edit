import { UraianSpmSaktiItem } from '../types';

export const INITIAL_URAIAN_SPM_SAKTI_LIST: UraianSpmSaktiItem[] = [
  // =========================================================================
  // 1. KELOMPOK UANG PERSEDIAAN (UP), GUP, TUP, PTUP (KODE 3XX)
  // =========================================================================
  {
    id: 'spm-up-311',
    kodeSpp: '311',
    jenisSpm: 'SPM-UP (Penyediaan Uang Persediaan Tunai RM / PNBP)',
    kategoriPembayaran: 'UANG_PERSEDIAAN_TUP',
    sifatPembayaran: 'Uang Persediaan (UP)',
    jenisBelanja: '82 (Kas UP di Bendahara Pengeluaran)',
    formatBakuUraian: 'Penyediaan Uang Persediaan Rupiah Murni Satker [Nama Satker] Tahun Anggaran [TA] sesuai Surat Keputusan KPA Nomor [No SK KPA] tanggal [Tgl SK]',
    contohUraian: 'Penyediaan Uang Persediaan Rupiah Murni Satker Balai Diklat Keuangan Semarang Tahun Anggaran 2026 sesuai Surat Keputusan KPA Nomor KEP-01/WPB.14/BD.02/2026 tanggal 05 Januari 2026.',
    placeholderGuide: '[Nama Satker] = Nama lengkap satker; [TA] = Tahun Anggaran berjalan; [No SK KPA] = Nomor SK KPA tentang penetapan UP; [Tgl SK] = Tanggal penetapan SK KPA.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: true,
    isActive: true,
    order: 1,
    dokumenPendukung: []
  },
  {
    id: 'spm-up-kkp-312',
    kodeSpp: '312',
    jenisSpm: 'SPM-UP KKP (Porsi Kartu Kredit Pemerintah 40%)',
    kategoriPembayaran: 'UANG_PERSEDIAAN_TUP',
    sifatPembayaran: 'Uang Persediaan (UP)',
    jenisBelanja: '82 (Limit Kartu Kredit Pemerintah)',
    formatBakuUraian: 'Penyediaan Uang Persediaan Kartu Kredit Pemerintah (UP-KKP) Satker [Nama Satker] TA [TA] Porsi [Persentase]% sesuai PKS Bank [Nama Bank Himbara]',
    contohUraian: 'Penyediaan Uang Persediaan Kartu Kredit Pemerintah (UP-KKP) Satker Pengadilan Negeri Semarang TA 2026 Porsi 40% sesuai PKS Bank Mandiri Nomor PKS-04/PN.SMG/2026 tanggal 08 Januari 2026.',
    placeholderGuide: '[Nama Satker] = Nama Satker; [TA] = Tahun Anggaran; [Persentase] = Minimal 40% (atau sesuai persetujuan dispensasi proporsi KKP dari KPPN); [Nama Bank Himbara] = Bank Penerbit KKP.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: true,
    isActive: true,
    order: 2,
    dokumenPendukung: []
  },
  {
    id: 'spm-gup-313',
    kodeSpp: '313',
    jenisSpm: 'SPM-GUP (Penggantian Uang Persediaan Tunai Belanja Operasional)',
    kategoriPembayaran: 'UANG_PERSEDIAAN_TUP',
    sifatPembayaran: 'GUP Tunai',
    jenisBelanja: '52 (Belanja Barang) / 53 (Belanja Modal non-kontraktual)',
    formatBakuUraian: 'Penggantian Uang Persediaan (GUP) untuk Keperluan Belanja Operasional Satker [Nama Satker] sesuai DIPA TA [TA] Berdasarkan SPP No. [No SPP] Tgl [Tgl SPP]',
    contohUraian: 'Penggantian Uang Persediaan (GUP) untuk Keperluan Belanja Operasional Satker Politeknik Ilmu Pelayaran Semarang sesuai DIPA TA 2026 Berdasarkan SPP No. 00042 Tgl 18 Februari 2026.',
    placeholderGuide: '[Nama Satker] = Nama satker; [TA] = Tahun Anggaran; [No SPP] = Nomor SPP GUP di SAKTI; [Tgl SPP] = Tanggal terbit SPP GUP.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: true,
    isActive: true,
    order: 3,
    dokumenPendukung: []
  },
  {
    id: 'spm-gup-kkp-316',
    kodeSpp: '316',
    jenisSpm: 'SPM-GUP KKP (Penggantian UP Tagihan Kartu Kredit Pemerintah)',
    kategoriPembayaran: 'UANG_PERSEDIAAN_TUP',
    sifatPembayaran: 'GUP KKP',
    jenisBelanja: '52 (Belanja Barang Operasional / Perjadin via KKP)',
    formatBakuUraian: 'Penggantian Uang Persediaan KKP (GUP KKP) atas Tagihan KKP Bank [Nama Bank] Bulan [Bulan] TA [TA] SPP No. [No SPP] Satker [Nama Satker]',
    contohUraian: 'Penggantian Uang Persediaan KKP (GUP KKP) atas Tagihan KKP Bank BRI Bulan Januari TA 2026 SPP No. 00015 Satker BPS Provinsi Jawa Tengah.',
    placeholderGuide: '[Nama Bank] = Bank Penerbit KKP; [Bulan] = Bulan tagihan berjalan; [TA] = Tahun Anggaran; [No SPP] = Nomor SPP SAKTI; [Nama Satker] = Nama Satker.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: true,
    isActive: true,
    order: 4,
    dokumenPendukung: []
  },
  {
    id: 'spm-tup-321',
    kodeSpp: '321',
    jenisSpm: 'SPM-TUP (Penyediaan Tambahan Uang Persediaan Tunai)',
    kategoriPembayaran: 'UANG_PERSEDIAAN_TUP',
    sifatPembayaran: 'Tambahan Uang Persediaan (TUP)',
    jenisBelanja: '52 (Barang) / 53 (Modal)',
    formatBakuUraian: 'Penyediaan Tambahan Uang Persediaan (TUP) Satker [Nama Satker] TA [TA] sesuai Surat Persetujuan Kepala KPPN Nomor [No Surat Persetujuan KPPN] tanggal [Tgl Surat]',
    contohUraian: 'Penyediaan Tambahan Uang Persediaan (TUP) Satker Balai Diklat Keagamaan Semarang TA 2026 sesuai Surat Persetujuan Kepala KPPN Nomor S-215/KPN.1401/2026 tanggal 12 Maret 2026.',
    placeholderGuide: '[Nama Satker] = Nama lengkap satker; [TA] = Tahun Anggaran; [No Surat Persetujuan KPPN] = Nomor Surat Persetujuan TUP dari KPPN; [Tgl Surat] = Tanggal surat persetujuan KPPN.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: true,
    isActive: true,
    order: 5,
    dokumenPendukung: []
  },
  {
    id: 'spm-gup-nihil-314',
    kodeSpp: '314',
    jenisSpm: 'SPM-GUP Nihil (Penggantian Uang Persediaan Nihil / Akhir Tahun)',
    kategoriPembayaran: 'UANG_PERSEDIAAN_TUP',
    sifatPembayaran: 'GUP Nihil',
    jenisBelanja: '52 (Belanja Barang) / 53 (Belanja Modal)',
    formatBakuUraian: 'Penggantian Uang Persediaan Nihil (GUP Nihil) untuk Pertanggungjawaban Sisa Belanja UP Satker [Nama Satker] TA [TA] SPP No. [No SPP] Tgl [Tgl SPP]',
    contohUraian: 'Penggantian Uang Persediaan Nihil (GUP Nihil) untuk Pertanggungjawaban Sisa Belanja UP Satker Balai Karantina Hewan Ikan Tumbuhan Jawa Tengah TA 2026 SPP No. 00125 Tgl 15 Desember 2026.',
    placeholderGuide: '[Nama Satker] = Nama Satker; [TA] = Tahun Anggaran; [No SPP] = Nomor SPP SAKTI; [Tgl SPP] = Tanggal SPP.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: false,
    isActive: true,
    order: 6,
    dokumenPendukung: []
  },
  {
    id: 'spm-ptup-315',
    kodeSpp: '315',
    jenisSpm: 'SPM-PTUP (Pertanggungjawaban Tambahan Uang Persediaan Nihil)',
    kategoriPembayaran: 'UANG_PERSEDIAAN_TUP',
    sifatPembayaran: 'PTUP Nihil',
    jenisBelanja: '52 (Barang) / 53 (Modal)',
    formatBakuUraian: 'Pertanggungjawaban Tambahan Uang Persediaan (PTUP) Satker [Nama Satker] atas Persetujuan TUP KPPN No. [No Surat Persetujuan] TA [TA] SPP No. [No SPP]',
    contohUraian: 'Pertanggungjawaban Tambahan Uang Persediaan (PTUP) Satker BPKP Perwakilan Provinsi Jawa Tengah atas Persetujuan TUP KPPN No. S-215/KPN.1401/2026 TA 2026 SPP No. 00088.',
    placeholderGuide: '[Nama Satker] = Nama Satker; [No Surat Persetujuan] = Nomor Surat Persetujuan TUP; [TA] = Tahun Anggaran; [No SPP] = Nomor SPP.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: false,
    isActive: true,
    order: 7,
    dokumenPendukung: []
  },

  // =========================================================================
  // 2. KELOMPOK BELANJA PEGAWAI (KODE 21X, 22X)
  // =========================================================================
  {
    id: 'spm-gaji-induk-211',
    kodeSpp: '211',
    jenisSpm: 'SPM Gaji Induk PNS / TNI / Polri / PPPK',
    kategoriPembayaran: 'BELANJA_PEGAWAI',
    sifatPembayaran: 'Pembayaran Langsung (LS)',
    jenisBelanja: '51 (Belanja Pegawai)',
    formatBakuUraian: 'Pembayaran Belanja Pegawai Gaji Induk Bulan [Bulan] [Tahun] untuk [Jumlah Pegawai] Pegawai Satker [Nama Satker] sesuai DIPA TA [Tahun]',
    contohUraian: 'Pembayaran Belanja Pegawai Gaji Induk Bulan Maret 2026 untuk 142 Pegawai Satker Balai Diklat Keuangan Semarang sesuai DIPA TA 2026.',
    placeholderGuide: '[Bulan] = Bulan gaji berkenaan; [Tahun] = Tahun Anggaran; [Jumlah Pegawai] = Jumlah total pegawai dalam daftar gaji; [Nama Satker] = Nama Satker.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: true,
    isActive: true,
    order: 8,
    dokumenPendukung: []
  },
  {
    id: 'spm-gaji-susulan-212',
    kodeSpp: '212',
    jenisSpm: 'SPM Gaji Susulan PNS / PPPK',
    kategoriPembayaran: 'BELANJA_PEGAWAI',
    sifatPembayaran: 'Pembayaran Langsung (LS)',
    jenisBelanja: '51 (Belanja Pegawai)',
    formatBakuUraian: 'Pembayaran Belanja Pegawai Gaji Susulan Bulan [Bulan] [Tahun] Pegawai a.n. [Nama Pegawai / NIP] Satker [Nama Satker] sesuai SK [No SK]',
    contohUraian: 'Pembayaran Belanja Pegawai Gaji Susulan Bulan Februari 2026 Pegawai a.n. Ahmad Fauzi / NIP 199205142020121004 Satker Pengadilan Negeri Semarang sesuai SK KEP-12/PN/2026.',
    placeholderGuide: '[Bulan] = Bulan gaji susulan; [Tahun] = Tahun Anggaran; [Nama Pegawai / NIP] = Identitas pegawai; [Nama Satker] = Nama Satker; [No SK] = Nomor SK pengangkatan/mutasi.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: false,
    isActive: true,
    order: 9,
    dokumenPendukung: []
  },
  {
    id: 'spm-kekurangan-gaji-213',
    kodeSpp: '213',
    jenisSpm: 'SPM Kekurangan Gaji PNS / PPPK',
    kategoriPembayaran: 'BELANJA_PEGAWAI',
    sifatPembayaran: 'Pembayaran Langsung (LS)',
    jenisBelanja: '51 (Belanja Pegawai)',
    formatBakuUraian: 'Pembayaran Kekurangan Gaji Periode [Bulan Awal] s.d. [Bulan Akhir] [Tahun] untuk [Jumlah Pegawai] Pegawai Satker [Nama Satker] sesuai SK [No SK]',
    contohUraian: 'Pembayaran Kekurangan Gaji Periode Januari s.d. Maret 2026 untuk 8 Pegawai Satker BPS Provinsi Jawa Tengah sesuai SK Kenaikan Pangkat Nomor 014/BPS/KP/2026.',
    placeholderGuide: '[Bulan Awal s.d Akhir] = Rentang waktu selisih gaji; [Jumlah Pegawai] = Total penerima; [Nama Satker] = Nama Satker; [No SK] = Nomor SK dasar kenaikan pangkat/gaji berkala.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: false,
    isActive: true,
    order: 10,
    dokumenPendukung: []
  },
  {
    id: 'spm-gaji-13-thr-215',
    kodeSpp: '215',
    jenisSpm: 'SPM Gaji Ketiga Belas / Tunjangan Hari Raya (THR)',
    kategoriPembayaran: 'BELANJA_PEGAWAI',
    sifatPembayaran: 'Pembayaran Langsung (LS)',
    jenisBelanja: '51 (Belanja Pegawai)',
    formatBakuUraian: 'Pembayaran Belanja Pegawai Gaji Ketiga Belas / THR Tahun [Tahun] untuk [Jumlah Pegawai] Pegawai Satker [Nama Satker] berdasarkan PP No. [No PP]',
    contohUraian: 'Pembayaran Belanja Pegawai Tunjangan Hari Raya (THR) Tahun 2026 untuk 142 Pegawai Satker Balai Diklat Keuangan Semarang berdasarkan PP No. 14 Tahun 2026.',
    placeholderGuide: '[Tahun] = Tahun berkenaan; [Jumlah Pegawai] = Jumlah penerima; [Nama Satker] = Nama satker; [No PP] = Nomor Peraturan Pemerintah dasar THR/Gaji 13.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: false,
    isActive: true,
    order: 11,
    dokumenPendukung: []
  },
  {
    id: 'spm-lembur-221',
    kodeSpp: '221',
    jenisSpm: 'SPM Uang Lembur dan Uang Makan Lembur',
    kategoriPembayaran: 'BELANJA_PEGAWAI',
    sifatPembayaran: 'Pembayaran Langsung (LS)',
    jenisBelanja: '51 (Belanja Pegawai - Akun Lembur)',
    formatBakuUraian: 'Pembayaran Uang Lembur dan Uang Makan Lembur Bulan [Bulan] [Tahun] bagi [Jumlah Pegawai] Pegawai Satker [Nama Satker] sesuai Surat Perintah Lembur No. [No SPL]',
    contohUraian: 'Pembayaran Uang Lembur dan Uang Makan Lembur Bulan Januari 2026 bagi 24 Pegawai Satker Politeknik Ilmu Pelayaran Semarang sesuai Surat Perintah Lembur No. SPL-02/PIP/01/2026.',
    placeholderGuide: '[Bulan] = Bulan lembur; [Tahun] = Tahun Anggaran; [Jumlah Pegawai] = Jumlah pegawai lembur; [Nama Satker] = Nama satker; [No SPL] = Nomor Surat Perintah Lembur.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: false,
    isActive: true,
    order: 12,
    dokumenPendukung: []
  },
  {
    id: 'spm-uang-makan-222',
    kodeSpp: '222',
    jenisSpm: 'SPM Uang Makan PNS / Uang Lauk Pauk TNI/Polri',
    kategoriPembayaran: 'BELANJA_PEGAWAI',
    sifatPembayaran: 'Pembayaran Langsung (LS)',
    jenisBelanja: '51 (Belanja Pegawai - Akun Uang Makan)',
    formatBakuUraian: 'Pembayaran Uang Makan PNS Bulan [Bulan] [Tahun] untuk [Jumlah Pegawai] Pegawai Satker [Nama Satker] berdasarkan Daftar Hadir Kerja Elektronik',
    contohUraian: 'Pembayaran Uang Makan PNS Bulan Januari 2026 untuk 118 Pegawai Satker Pengadilan Negeri Semarang berdasarkan Daftar Hadir Kerja Elektronik.',
    placeholderGuide: '[Bulan] = Bulan berkenaan; [Tahun] = Tahun Anggaran; [Jumlah Pegawai] = Jumlah penerima; [Nama Satker] = Nama satker.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: false,
    isActive: true,
    order: 13,
    dokumenPendukung: []
  },
  {
    id: 'spm-honorarium-225',
    kodeSpp: '225',
    jenisSpm: 'SPM Honorarium Operasional / Tim Kegiatan / Narasumber',
    kategoriPembayaran: 'BELANJA_PEGAWAI',
    sifatPembayaran: 'Pembayaran Langsung (LS)',
    jenisBelanja: '51 (Honorarium Tetap) / 52 (Honor Output Kegiatan / Narasumber)',
    formatBakuUraian: 'Pembayaran Honorarium Tim Pelaksana Kegiatan [Nama Kegiatan] Bulan [Bulan] [Tahun] Satker [Nama Satker] sesuai SK KPA No. [No SK]',
    contohUraian: 'Pembayaran Honorarium Tim Pengelola Keuangan dan SAKTI Bulan Januari 2026 Satker Balai Diklat Keagamaan Semarang sesuai SK KPA No. KEP-05/BDK/2026.',
    placeholderGuide: '[Nama Kegiatan] = Nama tim / kegiatan; [Bulan] = Periode pembayaran; [Tahun] = Tahun Anggaran; [Nama Satker] = Nama satker; [No SK] = Nomor SK KPA penetapan tim.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: false,
    isActive: true,
    order: 14,
    dokumenPendukung: []
  },

  // =========================================================================
  // 3. KELOMPOK PENGHASILAN PPNPN & PERJALANAN DINAS (KODE 237, 238)
  // =========================================================================
  {
    id: 'spm-ppnpn-237',
    kodeSpp: '237',
    jenisSpm: 'SPM Penghasilan PPNPN (Gaji / Honorarium PPNPN)',
    kategoriPembayaran: 'PPNPN',
    sifatPembayaran: 'Pembayaran Langsung (LS)',
    jenisBelanja: '52 (Belanja Jasa Lainnya / Belanja Barang Operasional)',
    formatBakuUraian: 'Pembayaran Penghasilan PPNPN Bulan [Bulan] [Tahun] untuk [Jumlah Orang] Tenaga PPNPN Satker [Nama Satker] sesuai SPK No. [No SPK] tgl [Tgl SPK]',
    contohUraian: 'Pembayaran Penghasilan PPNPN Bulan Januari 2026 untuk 18 Tenaga PPNPN Satker Balai Karantina Hewan Ikan Tumbuhan Jawa Tengah sesuai SPK No. SPK-01/KRT/2026 tgl 02 Januari 2026.',
    placeholderGuide: '[Bulan] = Bulan berjalan; [Tahun] = Tahun Anggaran; [Jumlah Orang] = Jumlah tenaga satpam, pengemudi, pramubakti, dll; [Nama Satker] = Satker; [No SPK] = Nomor Perjanjian Kerja.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: true,
    isActive: true,
    order: 15,
    dokumenPendukung: []
  },
  {
    id: 'spm-perjadin-238',
    kodeSpp: '238',
    jenisSpm: 'SPM Perjalanan Dinas Biasa / Luar Kota / Paket Meeting',
    kategoriPembayaran: 'PERJALANAN_DINAS',
    sifatPembayaran: 'Pembayaran Langsung (LS)',
    jenisBelanja: '524111 (Perjadin Biasa) / 524113 (Perjadin Dalam Kota) / 524114 (Paket Meeting)',
    formatBakuUraian: 'Pembayaran Biaya Perjalanan Dinas Dalam Rangka [Nama Kegiatan] ke [Kota Tujuan] Satker [Nama Satker] ST No. [No ST] Tgl [Tgl ST] DIPA TA [TA]',
    contohUraian: 'Pembayaran Biaya Perjalanan Dinas Dalam Rangka Monitoring Evaluasi SAKTI ke Solo Satker BPS Provinsi Jawa Tengah ST No. 042/BPS/ST/02/2026 Tgl 10 Februari 2026 DIPA TA 2026.',
    placeholderGuide: '[Nama Kegiatan] = Kegiatan kedinasan; [Kota Tujuan] = Tempat tujuan perjalanan dinas; [Nama Satker] = Nama satker; [No ST] = Nomor Surat Tugas; [Tgl ST] = Tanggal Surat Tugas; [TA] = Tahun Anggaran.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: true,
    isActive: true,
    order: 16,
    dokumenPendukung: []
  },

  // =========================================================================
  // 4. KELOMPOK BELANJA KONTRAKTUAL (KODE 111, 115, 116)
  // =========================================================================
  {
    id: 'spm-kontraktual-termin-111',
    kodeSpp: '111',
    jenisSpm: 'SPM Non Gaji Kontraktual (Termin Kontrak Belanja Barang / Modal)',
    kategoriPembayaran: 'BELANJA_MODAL',
    sifatPembayaran: 'Pembayaran Langsung (LS Kontraktual)',
    jenisBelanja: '53 (Belanja Modal) / 52 (Belanja Barang Kontraktual)',
    formatBakuUraian: 'Pembayaran Termin ke-[X] Kontrak Pengadaan [Nama Pekerjaan] sesuai BAST No. [No BAST] tgl [Tgl BAST] dan BAP No. [No BAP] DIPA Satker [Nama Satker] TA [TA]',
    contohUraian: 'Pembayaran Termin ke-2 Kontrak Renovasi Gedung Kantor sesuai BAST No. 018/BAST/BDK/2026 tgl 14 Maret 2026 dan BAP No. 018/BAP/2026 DIPA Satker Balai Diklat Keagamaan Semarang TA 2026.',
    placeholderGuide: '[X] = Nomor urut termin (contoh: ke-1, ke-2, atau Final); [Nama Pekerjaan] = Nama pengadaan sesuai SPK/Kontrak; [No BAST & Tgl] = Berita Acara Serah Terima; [No BAP] = Berita Acara Pembayaran; [Nama Satker] = Nama satker; [TA] = Tahun Anggaran.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: true,
    isActive: true,
    order: 17,
    dokumenPendukung: []
  },
  {
    id: 'spm-uang-muka-kontrak-115',
    kodeSpp: '115',
    jenisSpm: 'SPM Uang Muka Kontrak Pengadaan Barang / Jasa',
    kategoriPembayaran: 'BELANJA_MODAL',
    sifatPembayaran: 'Pembayaran Langsung (LS Kontraktual)',
    jenisBelanja: '53 (Modal) / 52 (Barang)',
    formatBakuUraian: 'Pembayaran Uang Muka Kontrak Pengadaan [Nama Pekerjaan] sebesar [Persen]% sesuai SPK/Kontrak No. [No Kontrak] tgl [Tgl Kontrak] DIPA Satker [Nama Satker] TA [TA]',
    contohUraian: 'Pembayaran Uang Muka Kontrak Pengadaan Perangkat Server SAKTI sebesar 20% sesuai Kontrak No. 004/KTR/PIP/2026 tgl 05 Februari 2026 DIPA Satker PIP Semarang TA 2026.',
    placeholderGuide: '[Nama Pekerjaan] = Nama pengadaan; [Persen] = Persentase uang muka (maksimal 20% atau 30% untuk usaha kecil); [No Kontrak] = Nomor Kontrak; [Nama Satker] = Satker; [TA] = Tahun Anggaran.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: false,
    isActive: true,
    order: 18,
    dokumenPendukung: []
  },
  {
    id: 'spm-retensi-kontrak-116',
    kodeSpp: '116',
    jenisSpm: 'SPM Pelepasan Retensi Kontrak (Setelah Masa Pemeliharaan)',
    kategoriPembayaran: 'BELANJA_MODAL',
    sifatPembayaran: 'Pembayaran Langsung (LS Kontraktual)',
    jenisBelanja: '53 (Belanja Modal) / 52 (Barang)',
    formatBakuUraian: 'Pembayaran Retensi Pemeliharaan Kontrak [Nama Pekerjaan] sebesar [Persen]% sesuai BAST Akhir Pekerjaan No. [No BAST Akhir] tgl [Tgl] DIPA Satker [Nama Satker]',
    contohUraian: 'Pembayaran Retensi Pemeliharaan Kontrak Renovasi Aula Kantor sebesar 5% sesuai BAST Akhir Pekerjaan No. 09/BAST-F/BDK/2026 tgl 20 Maret 2026 DIPA Satker Balai Diklat Keagamaan Semarang.',
    placeholderGuide: '[Nama Pekerjaan] = Nama pekerjaan; [Persen] = Persentase retensi (biasanya 5%); [No BAST Akhir] = Nomor BAST Akhir selesai masa pemeliharaan; [Nama Satker] = Satker.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: false,
    isActive: true,
    order: 19,
    dokumenPendukung: []
  },

  // =========================================================================
  // 5. KELOMPOK NON GAJI NON KONTRAKTUAL (KODE 231)
  // =========================================================================
  {
    id: 'spm-nonkontraktual-dayajasa-231',
    kodeSpp: '231',
    jenisSpm: 'SPM Non Gaji Non Kontraktual (Langganan Daya & Jasa PLN / Telkom / PDAM)',
    kategoriPembayaran: 'BELANJA_BARANG',
    sifatPembayaran: 'Pembayaran Langsung (LS Non Kontraktual)',
    jenisBelanja: '522111 (Listrik) / 522112 (Telepon) / 522113 (Air) / 522114 (Internet)',
    formatBakuUraian: 'Pembayaran Langganan Daya dan Jasa [Jenis Jasa: Listrik/Telepon/Air/Internet] Bulan [Bulan] [Tahun] Satker [Nama Satker] Berdasarkan Tagihan No. [No Invoice]',
    contohUraian: 'Pembayaran Langganan Daya dan Jasa Listrik PLN Bulan Januari 2026 Satker Balai Diklat Keuangan Semarang Berdasarkan Tagihan Rekening PLN IDPEL 52100889210.',
    placeholderGuide: '[Jenis Jasa] = Listrik PLN / Telkom Internet / PDAM; [Bulan] = Bulan tagihan; [Tahun] = Tahun Anggaran; [Nama Satker] = Satker; [No Invoice] = Nomor ID Pelanggan / Nomor Rekening Tagihan.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: true,
    isActive: true,
    order: 20,
    dokumenPendukung: []
  },
  {
    id: 'spm-pengadaan-langsung-231',
    kodeSpp: '231',
    jenisSpm: 'SPM Non Gaji Non Kontraktual (Pengadaan Langsung s.d. 50 Juta)',
    kategoriPembayaran: 'BELANJA_BARANG',
    sifatPembayaran: 'Pembayaran Langsung (LS Pihak Ketiga)',
    jenisBelanja: '52 (Belanja Barang Operasional / Non Operasional)',
    formatBakuUraian: 'Pembayaran Belanja [Nama Barang / Jasa] Satker [Nama Satker] sesuai Kuitansi / Bukti Pembelian No. [No Kuitansi] tgl [Tgl] DIPA TA [TA]',
    contohUraian: 'Pembayaran Belanja Pemeliharaan AC dan Peralatan Kantor Satker Pengadilan Agama Semarang sesuai Kuitansi No. 012/PA.SMG/02/2026 tgl 20 Februari 2026 DIPA TA 2026.',
    placeholderGuide: '[Nama Barang / Jasa] = Deskripsi barang atau pekerjaan jasa; [Nama Satker] = Nama Satker; [No Kuitansi] = Nomor kuitansi / nota; [Tgl] = Tanggal kuitansi; [TA] = Tahun Anggaran.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: false,
    isActive: true,
    order: 21,
    dokumenPendukung: []
  },

  // =========================================================================
  // 6. KELOMPOK RESTITUSI, PAJAK, & PENGESAHAN BLU/HIBAH (KODE 233, 241, 242)
  // =========================================================================
  {
    id: 'spm-restitusi-pajak-233',
    kodeSpp: '233',
    jenisSpm: 'SPM Pengembalian / Restitusi Kelebihan Pembayaran Pajak (SPMKP)',
    kategoriPembayaran: 'RESTITUSI_PAJAK',
    sifatPembayaran: 'Pembayaran Langsung (LS Khusus)',
    jenisBelanja: '81 (Pengembalian Pendapatan Perpajakan)',
    formatBakuUraian: 'Pengembalian Kelebihan Pembayaran Pajak Wajib Pajak [Nama WP/NPWP] sesuai SKKPP KPP [Nama KPP] No. [No SKKPP] tgl [Tgl SKKPP] SPMKP No. [No SPMKP]',
    contohUraian: 'Pengembalian Kelebihan Pembayaran Pajak Wajib Pajak PT Maju Makmur Mandiri / NPWP 01.234.567.8-508.000 sesuai SKKPP KPP Pratama Semarang Candisari No. KEP-0012/WPJ.10/KP.08/2026 tgl 05 Februari 2026.',
    placeholderGuide: '[Nama WP/NPWP] = Nama Wajib Pajak & NPWP 16 digit; [Nama KPP] = Nama Kantor Pelayanan Pajak; [No SKKPP] = Nomor Surat Keputusan; [Tgl SKKPP] = Tanggal SKKPP.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: false,
    isActive: true,
    order: 22,
    dokumenPendukung: []
  },
  {
    id: 'spm-sp3b-blu-241',
    kodeSpp: '241',
    jenisSpm: 'SPM Pengesahan Pendapatan & Belanja BLU (SP3B BLU)',
    kategoriPembayaran: 'PENGESAHAN_HIBAH_BLU',
    sifatPembayaran: 'Pengesahan (SP2D Pengesahan)',
    jenisBelanja: 'Akun Belanja BLU (52 & 53 sumber dana PNBP BLU)',
    formatBakuUraian: 'Pengesahan Pendapatan dan Belanja BLU Triwulan [TW] TA [TA] Satker BLU [Nama Satker BLU] sesuai SP3B BLU No. [No SP3B] tgl [Tgl SP3B]',
    contohUraian: 'Pengesahan Pendapatan dan Belanja BLU Triwulan I TA 2026 Satker BLU Politeknik Ilmu Pelayaran Semarang sesuai SP3B BLU No. SP3B-01/PIP/BLU/2026 tgl 31 Maret 2026.',
    placeholderGuide: '[TW] = Triwulan I/II/III/IV; [TA] = Tahun Anggaran; [Nama Satker BLU] = Satker BLU; [No SP3B] = Nomor SP3B BLU; [Tgl SP3B] = Tanggal pengesahan.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: false,
    isActive: true,
    order: 23,
    dokumenPendukung: []
  },
  {
    id: 'spm-hibah-langsung-242',
    kodeSpp: '242',
    jenisSpm: 'SPM Pengesahan Hibah Langsung (Barang / Jasa / Uang)',
    kategoriPembayaran: 'PENGESAHAN_HIBAH_BLU',
    sifatPembayaran: 'Pengesahan (SP2D Pengesahan)',
    jenisBelanja: '52 (Barang) / 53 (Modal) sumber Hibah Terencana / Langsung',
    formatBakuUraian: 'Pengesahan Hibah Langsung Bentuk [Uang/Barang/Jasa] dari [Pemberi Hibah] Satker [Nama Satker] sesuai Nomor Register Hibah [No Register] SP2HL No. [No SP2HL]',
    contohUraian: 'Pengesahan Hibah Langsung Bentuk Barang dari UNICEF Satker Balai Diklat Keagamaan Semarang sesuai Nomor Register Hibah REG-HIB-8821 SP2HL No. 001/HL/2026.',
    placeholderGuide: '[Uang/Barang/Jasa] = Bentuk hibah; [Pemberi Hibah] = Nama instansi/lembaga donor; [Nama Satker] = Satker; [No Register] = Nomor register dari DJPPR; [No SP2HL] = Nomor SP2HL.',
    karakterMaks: 255,
    keterangan: '',
    isPinned: false,
    isActive: true,
    order: 24,
    dokumenPendukung: []
  }
];

export const KATEGORI_PEMBAYARAN_OPTIONS: {
  value: string;
  label: string;
  badgeColor: string;
  activeColor: string;
  inactiveColor: string;
  countBg: string;
}[] = [
  {
    value: 'ALL',
    label: 'Semua Kategori Pembayaran',
    badgeColor: 'bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-200 border-blue-300',
    activeColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/50',
    inactiveColor: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700',
    countBg: 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
  },
  {
    value: 'UANG_PERSEDIAAN_TUP',
    label: 'Uang Persediaan & TUP (UP/GUP/TUP)',
    badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 border-amber-300',
    activeColor: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-400/50',
    inactiveColor: 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50',
    countBg: 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
  },
  {
    value: 'BELANJA_PEGAWAI',
    label: 'Belanja Pegawai (Gaji/Lembur/Uang Makan)',
    badgeColor: 'bg-purple-100 text-purple-900 dark:bg-purple-900/50 dark:text-purple-200 border-purple-300',
    activeColor: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30 ring-2 ring-purple-400/50',
    inactiveColor: 'bg-purple-50/70 dark:bg-purple-950/30 text-purple-900 dark:text-purple-300 border border-purple-300/80 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50',
    countBg: 'bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200'
  },
  {
    value: 'PPNPN',
    label: 'Penghasilan PPNPN',
    badgeColor: 'bg-pink-100 text-pink-900 dark:bg-pink-900/50 dark:text-pink-200 border-pink-300',
    activeColor: 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/30 ring-2 ring-pink-400/50',
    inactiveColor: 'bg-pink-50/70 dark:bg-pink-950/30 text-pink-900 dark:text-pink-300 border border-pink-300/80 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900/50',
    countBg: 'bg-pink-200 text-pink-900 dark:bg-pink-900 dark:text-pink-200'
  },
  {
    value: 'PERJALANAN_DINAS',
    label: 'Perjalanan Dinas (LS)',
    badgeColor: 'bg-sky-100 text-sky-900 dark:bg-sky-900/50 dark:text-sky-200 border-sky-300',
    activeColor: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30 ring-2 ring-sky-400/50',
    inactiveColor: 'bg-sky-50/70 dark:bg-sky-950/30 text-sky-900 dark:text-sky-300 border border-sky-300/80 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/50',
    countBg: 'bg-sky-200 text-sky-900 dark:bg-sky-900 dark:text-sky-200'
  },
  {
    value: 'BELANJA_MODAL',
    label: 'Belanja Modal & Kontraktual',
    badgeColor: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200 border-emerald-300',
    activeColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/50',
    inactiveColor: 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
    countBg: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
  },
  {
    value: 'BELANJA_BARANG',
    label: 'Belanja Barang Non-Kontraktual',
    badgeColor: 'bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-200 border-blue-300',
    activeColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/50',
    inactiveColor: 'bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border border-blue-300/80 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50',
    countBg: 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
  },
  {
    value: 'RESTITUSI_PAJAK',
    label: 'Restitusi Pajak / Bea Cukai',
    badgeColor: 'bg-rose-100 text-rose-900 dark:bg-rose-900/50 dark:text-rose-200 border-rose-300',
    activeColor: 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-400/50',
    inactiveColor: 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50',
    countBg: 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200'
  },
  {
    value: 'PENGESAHAN_HIBAH_BLU',
    label: 'Pengesahan BLU & Hibah',
    badgeColor: 'bg-teal-100 text-teal-900 dark:bg-teal-900/50 dark:text-teal-200 border-teal-300',
    activeColor: 'bg-gradient-to-r from-teal-600 to-cyan-700 text-white shadow-md shadow-teal-500/30 ring-2 ring-teal-400/50',
    inactiveColor: 'bg-teal-50/70 dark:bg-teal-950/30 text-teal-900 dark:text-teal-300 border border-teal-300/80 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/50',
    countBg: 'bg-teal-200 text-teal-900 dark:bg-teal-900 dark:text-teal-200'
  }
];

export function getCategoryTheme(kategori: string) {
  switch (kategori) {
    case 'UANG_PERSEDIAAN_TUP':
      return {
        rowBorder: 'border-l-4 border-l-amber-500',
        badgeGradient: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-orange-500/30',
        sifatBadge: 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700',
        cardHighlight: 'border-amber-200 dark:border-amber-800/60',
        glow: 'text-amber-600'
      };
    case 'BELANJA_PEGAWAI':
      return {
        rowBorder: 'border-l-4 border-l-purple-500',
        badgeGradient: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/30',
        sifatBadge: 'bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-700',
        cardHighlight: 'border-purple-200 dark:border-purple-800/60',
        glow: 'text-purple-600'
      };
    case 'PPNPN':
      return {
        rowBorder: 'border-l-4 border-l-pink-500',
        badgeGradient: 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-sm shadow-pink-500/30',
        sifatBadge: 'bg-pink-100 text-pink-900 border border-pink-300 dark:bg-pink-950/60 dark:text-pink-200 dark:border-pink-700',
        cardHighlight: 'border-pink-200 dark:border-pink-800/60',
        glow: 'text-pink-600'
      };
    case 'PERJALANAN_DINAS':
      return {
        rowBorder: 'border-l-4 border-l-sky-500',
        badgeGradient: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-500/30',
        sifatBadge: 'bg-sky-100 text-sky-900 border border-sky-300 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-700',
        cardHighlight: 'border-sky-200 dark:border-sky-800/60',
        glow: 'text-sky-600'
      };
    case 'BELANJA_MODAL':
      return {
        rowBorder: 'border-l-4 border-l-emerald-500',
        badgeGradient: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/30',
        sifatBadge: 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700',
        cardHighlight: 'border-emerald-200 dark:border-emerald-800/60',
        glow: 'text-emerald-600'
      };
    case 'BELANJA_BARANG':
      return {
        rowBorder: 'border-l-4 border-l-blue-500',
        badgeGradient: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/30',
        sifatBadge: 'bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700',
        cardHighlight: 'border-blue-200 dark:border-blue-800/60',
        glow: 'text-blue-600'
      };
    case 'RESTITUSI_PAJAK':
      return {
        rowBorder: 'border-l-4 border-l-rose-500',
        badgeGradient: 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm shadow-rose-500/30',
        sifatBadge: 'bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700',
        cardHighlight: 'border-rose-200 dark:border-rose-800/60',
        glow: 'text-rose-600'
      };
    case 'PENGESAHAN_HIBAH_BLU':
      return {
        rowBorder: 'border-l-4 border-l-teal-500',
        badgeGradient: 'bg-gradient-to-r from-teal-600 to-cyan-700 text-white shadow-sm shadow-teal-500/30',
        sifatBadge: 'bg-teal-100 text-teal-900 border border-teal-300 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-700',
        cardHighlight: 'border-teal-200 dark:border-teal-800/60',
        glow: 'text-teal-600'
      };
    default:
      return {
        rowBorder: 'border-l-4 border-l-slate-400',
        badgeGradient: 'bg-gradient-to-r from-slate-700 to-slate-900 text-white',
        sifatBadge: 'bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
        cardHighlight: 'border-slate-200 dark:border-slate-800',
        glow: 'text-slate-600'
      };
  }
}
