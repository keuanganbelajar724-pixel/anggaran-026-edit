import { KnowledgeItem } from '../types';

export const INITIAL_KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: 'kn-001',
    title: 'Panduan Penyelamatan Nilai IKPA: Rekonsiliasi RPD Halaman III DIPA pada SAKTI',
    category: 'JUKNIS_SAKTI',
    summary: 'Langkah-langkah taktis penyesuaian Rencana Penarikan Dana (RPD) bulanan pada Modul Penganggaran SAKTI sebelum cut-off awal triwulan guna mencegah deviasi melebihi 5%.',
    contentMarkdown: `### 🎯 Urgensi Indikator Deviasi Halaman III DIPA
Berdasarkan PER-5/PB/2024, indikator Deviasi Halaman III DIPA memiliki bobot signifikan dalam penilaian IKPA Satker. Deviasi dihitung berdasarkan selisih antara Rencana Penarikan Dana (RPD) bulanan dengan realisasi riil SP2D.

### 📋 Tahapan Pelaksanaan pada Aplikasi SAKTI:
1. **Modul Penganggaran:**
   - Masuk sebagai Operator Penganggaran.
   - Buka menu *Revisi Anggaran* > *Pemutakhiran RPD Halaman III DIPA*.
   - Sesuaikan target penarikan kas pada bulan berjalan dan 2 bulan berikutnya sesuai jadwal lelang, pengadaan, dan kontrak yang riil.
2. **Validasi & Persetujuan KPA:**
   - Login sebagai KPA pada SAKTI.
   - Masuk ke menu *Persetujuan Revisi* dan kirim data ke DJPb/KPPN sebelum batas akhir 10 hari kerja pertama triwulan berjalan.
3. **Sinkronisasi & Monitoring:**
   - Pantau status persetujuan pada aplikasi My Intress.
   - Pastikan deviasi bulanan tetap di bawah ambang toleransi (< 5%).`,
    steps: [
      {
        stepNumber: 1,
        title: 'Review Rencana Kegiatan Bulanan',
        description: 'Kumpulkan data rencana pengadaan dari PPK dan jadwal pembayaran termin kontrak.',
        importantNotes: 'Hindari memasang rencana penarikan fiktif di awal tahun.'
      },
      {
        stepNumber: 2,
        title: 'Input RPD pada Modul Penganggaran SAKTI',
        description: 'Buka menu Pemutakhiran RPD Triwulanan dan masukkan angka per bulan per akun belanja (51, 52, 53).',
        importantNotes: 'Batas revisi otomatis terbuka pada 10 hari kerja pertama awal triwulan.'
      },
      {
        stepNumber: 3,
        title: 'Persetujuan KPA & Konfirmasi ke KPPN',
        description: 'KPA menyetujui ADK revisi dan kirim ke portal My Intress/SAKTI.',
        importantNotes: 'Pastikan notifikasi persetujuan dari KPPN berstatus Sukses.'
      }
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    downloadUrl: 'https://sakti.kemenkeu.go.id',
    referenceUrl: 'https://djpb.kemenkeu.go.id',
    author: 'Seksi MSKI KPPN Semarang I',
    date: '15 Januari 2026',
    isPinned: true,
    tags: ['RPD Hal III DIPA', 'Revisi Anggaran', 'SAKTI Penganggaran', 'IKPA 2026']
  },
  {
    id: 'kn-002',
    title: 'SOP Pendaftaran Kontrak & Karwas Batas Waktu 5 Hari Kerja',
    category: 'LAYANAN_PD_KONTRAK',
    summary: 'Petunjuk teknis pendaftaran Kontrak Komitmen Tahunan & Multi-years pada Modul Komitmen SAKTI dan penerbitan Nomor Register Kontrak (NRK) dari KPPN.',
    contentMarkdown: `### 📜 Ketentuan Pendaftaran Kontrak
Sesuai Perdirjen Perbendaharaan, setiap perikatan/kontrak dengan nilai di atas Rp50 Juta wajib didaftarkan ke KPPN maksimal **5 (lima) hari kerja** terhitung setelah tanggal penandatanganan kontrak.

### ⚠️ Konsekuensi Keterlambatan:
- Satker akan terkena penalti nilai pada indikator *Belanja Kontraktual* IKPA.
- Memerlukan surat permohonan dispensasi resmi ke Kepala KPPN sebelum SP2D dapat diproses.`,
    steps: [
      {
        stepNumber: 1,
        title: 'Perekaman Supplier & Data Kontrak',
        description: 'Rekam identitas rekanan penyedia, rekening bank, NPWP, dan klausul kontrak pada Modul Komitmen.',
        importantNotes: 'Pastikan Nomor Rekening telah aktif dan terdaftar di master supplier KPPN.'
      },
      {
        stepNumber: 2,
        title: 'Perekaman Jadwal Pembayaran (Termin)',
        description: 'Input rencana termin pembayaran dan distribusi alokasi COA belanja barang/modal.',
        importantNotes: 'Jumlah total nominal termin harus sama persis dengan nilai kontrak.'
      },
      {
        stepNumber: 3,
        title: 'Kirim ADK Kontrak ke KPPN (Max HK-5)',
        description: 'Generate ADK kontrak oleh PPK dan kirim secara elektronik ke SPAN / My Intress.',
        importantNotes: 'Cek penerbitan Nomor Register Kontrak (NRK) / CAN pada Modul Komitmen.'
      }
    ],
    downloadUrl: 'https://sakti.kemenkeu.go.id',
    author: 'Seksi Pencairan Dana (PD) KPPN Semarang I',
    date: '10 Februari 2026',
    isPinned: true,
    tags: ['Kontrak', 'Modul Komitmen', 'NRK', 'Dispensasi Kontrak', 'BAST']
  },
  {
    id: 'kn-003',
    title: 'Panduan Pelaporan Capaian Output (RVRO & PCRO) pada SAKTI',
    category: 'PELAPORAN_SAKTI',
    summary: 'Tata cara input capaian Rincian Output (RO), Progres Capaian Rincian Output (PCRO), dan Realisasi Volume Rincian Output (RVRO) sebelum batas tanggal 5 bulan berikutnya.',
    contentMarkdown: `### 📊 Pengisian Capaian Output Bulanan
Pelaporan capaian output merupakan salah satu indikator vital IKPA dengan bobot 25%. Satker wajib mengisi progres output setiap bulan melalui Modul Komitmen/Pelaporan SAKTI paling lambat **Hari Kerja ke-5 (HK-5)** bulan berikutnya.

### 🔍 Indikator Penilaian:
1. **Ketepatan Waktu Pelaporan (Skor 100 / 0)**
2. **Ketercapaian Output (Rasio PCRO vs Target RO)**
3. **Anomali Data (Deviasi antara realisasi anggaran vs fisik)**`,
    steps: [
      {
        stepNumber: 1,
        title: 'Buka Modul Komitmen > Capaian Output',
        description: 'Login sebagai Operator Komitmen SAKTI, pilih menu Monitoring > Capaian Output.',
        importantNotes: 'Periksa seluruh RO yang berstatus belum terisi progres.'
      },
      {
        stepNumber: 2,
        title: 'Input Nilai PCRO & RVRO',
        description: 'Masukkan persentase progres fisik (PCRO) dan jumlah volume riil yang telah selesai (RVRO). Tambahkan keterangan penjelasan yang memadai.',
        importantNotes: 'Jika anggaran terserap tetapi fisik 0%, berikan penjelasan kendala yang jelas pada kolom keterangan.'
      },
      {
        stepNumber: 3,
        title: 'Konfirmasi PPK & Kirim ke SAKTI Pusat',
        description: 'PPK memvalidasi isian data dan melakukan kirim data capaian output sebelum tanggal batas waktu.',
        importantNotes: 'Pastikan status pada My Intress berubah menjadi "Terkonfirmasi".'
      }
    ],
    author: 'Seksi MSKI KPPN Semarang I',
    date: '20 Februari 2026',
    isPinned: false,
    tags: ['Capaian Output', 'RVRO', 'PCRO', 'HK-5', 'Modul Komitmen']
  },
  {
    id: 'kn-004',
    title: 'Panduan Reset User & Troubleshooting Sertifikat Digital TTE SAKTI',
    category: 'ADMINISTRATOR_SAKTI',
    summary: 'Solusi teknis penanganan error tanda tangan elektronik (DS/TTE), instalasi aplikasi Panther 3.2, perpanjangan passphrase BSrE, dan pengelolaan user SAKTI.',
    contentMarkdown: `### 🔑 Kendala Umum TTE pada SAKTI:
1. **Passphrase Kedaluwarsa:** Lakukan reset melalui portal BSrE atau hubungi administrator KPPN.
2. **Panther Tidak Terdeteksi:** Pastikan service *Panther 3.2* berjalan di background Windows.
3. **Perubahan Pejabat (PPK/PPSPM):** Lakukan perekaman pejabat baru pada Modul Administrator dan laporkan spesimen tanda tangan ke Seksi Pencairan Dana KPPN.`,
    steps: [
      {
        stepNumber: 1,
        title: 'Cek Status Service Panther di Task Manager',
        description: 'Buka Task Manager, pastikan proses panther.exe atau service TTE SAKTI aktif.',
        importantNotes: 'Jika belum terinstall, unduh installer Panther versi 3.2 resmi dari portal SAKTI.'
      },
      {
        stepNumber: 2,
        title: 'Pengujian Sertifikat Digital BSrE',
        description: 'Lakukan uji coba tanda tangan dokumen pada menu Pengaturan User SAKTI.',
        importantNotes: 'Jika muncul notifikasi certificate expired, segera ajukan perpanjangan ke helpdesk KPPN.'
      }
    ],
    downloadUrl: 'https://sakti.kemenkeu.go.id',
    author: 'Tim Helpdesk IT KPPN Semarang I',
    date: '01 Maret 2026',
    isPinned: false,
    tags: ['TTE SAKTI', 'Panther 3.2', 'BSrE', 'Admin SAKTI', 'Troubleshooting']
  },
  {
    id: 'kn-005',
    title: 'Tutorial Video: Tata Cara Transaksi Marketplace Digipay Satu & Kartu Kredit Pemerintah (KKP)',
    category: 'VIDEO_TUTORIAL',
    summary: 'Video bimbingan teknis langkah-demi-langkah penggunaan Digipay Satu bagi Pejabat Pengadaan, Pemesan Satker, PPK, dan rekanan UMKM lokal.',
    contentMarkdown: `### 🎥 Video Bimbingan Teknis Digipay Satu Kemenkeu
Pelajari alur transaksi belanja pengadaan langsung non-tunai melalui platform *Digipay Satu*:
- Pendaftaran akun satker & vendor UMKM.
- Pembuatan keranjang belanja dan negosiasi harga.
- Penerbitan Surat Pesanan & Berita Acara Serah Terima (BAST).
- Pembayaran via Virtual Account (VA) Bank atau Kartu Kredit Pemerintah (KKP).`,
    videoUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    downloadUrl: 'https://digipaysatu.kemenkeu.go.id',
    author: 'Seksi Bank & MSKI KPPN Semarang I',
    date: '10 Maret 2026',
    isPinned: false,
    tags: ['Digipay Satu', 'KKP', 'Cashless', 'Belanja UMKM', 'Video Tutorial']
  }
];
