import { RawQuestion } from './questionsIkpa';

export const akuntansiQuestions: RawQuestion[] = [
  // 1-15: Standar Akuntansi Pemerintahan (SAP), Basis Akrual, LKKL
  {
    topic: 'Akuntansi & Pelaporan Keuangan',
    difficulty: 'MUDAH',
    questionText: 'Apakah standar resmi penyusunan dan penyajian Laporan Keuangan Pemerintah Pusat (LKPP) dan Laporan Keuangan Kementerian/Lembaga (LKKL) di Indonesia?',
    optionA: 'Standar Akuntansi Pemerintahan (SAP) yang diatur dalam Peraturan Pemerintah Nomor 71 Tahun 2010',
    optionB: 'Standar Akuntansi Keuangan Entitas Tanpa Akuntabilitas Publik (SAK ETAP)',
    optionC: 'Standar Akuntansi Perbankan Syariah',
    optionD: 'Standar Akuntansi Pajak Daerah',
    correctAnswer: 'A',
    explanation: 'PP No. 71 Tahun 2010 menetapkan Standar Akuntansi Pemerintahan (SAP) berbasis akrual sebagai pedoman baku pelaporan keuangan sektor publik di Indonesia.',
    referenceRegulation: 'PP No. 71 Tahun 2010 tentang Standar Akuntansi Pemerintahan'
  },
  {
    topic: 'Akuntansi & Pelaporan Keuangan',
    difficulty: 'SEDANG',
    questionText: 'Bagaimanakah penerapan basis akuntansi pada laporan keuangan pemerintah menurut SAP Akrual PP 71/2010?',
    optionA: 'Basis Kas untuk Laporan Realisasi Anggaran (LRA) dan Basis Akrual untuk Neraca, Laporan Operasional (LO), serta Laporan Perubahan Ekuitas (LPE)',
    optionB: 'Seluruh laporan menggunakan basis kas murni',
    optionC: 'Seluruh laporan menggunakan basis taksiran',
    optionD: 'Basis kas hanya untuk neraca',
    correctAnswer: 'A',
    explanation: 'Pemerintah menerapkan basis kas untuk penyusunan LRA (mengikuti UU APBN berbasis kas) dan menerapkan basis akrual penuh untuk pengakuan aset, kewajiban, ekuitas (Neraca), serta pendapatan dan beban (LO).',
    referenceRegulation: 'PP No. 71 Tahun 2010 Kerangka Konseptual SAP'
  },
  {
    topic: 'Akuntansi & Pelaporan Keuangan',
    difficulty: 'ANALISIS',
    questionText: 'Satker menerima tagihan listrik bulan Desember sebesar Rp15.000.000 pada tanggal 28 Desember, namun pembayaran SP2D baru dilakukan pada 5 Januari tahun anggaran berikutnya. Bagaimanakah perlakuan akuntansinya pada Laporan Keuangan per 31 Desember?',
    optionA: 'Diakui sebagai Beban Jasa pada Laporan Operasional (LO) dan diakui sebagai Utang Beban (Kewajiban Jangka Pendek) pada Neraca per 31 Desember',
    optionB: 'Tidak perlu dicatat karena uang kas belum keluar',
    optionC: 'Dicatat sebagai piutang satker di neraca',
    optionD: 'Dihapuskan dari pembukuan',
    correctAnswer: 'A',
    explanation: 'Sesuai asas akrual, manfaat listrik telah dinikmati pada bulan Desember, sehingga timbul kewajiban/utang yang wajib diakui sebagai beban di LO dan utang di Neraca akhir tahun.',
    referenceRegulation: 'PSAP No. 02 & PSAP No. 12 tentang Beban Akrual'
  },
  {
    topic: 'Akuntansi & Pelaporan Keuangan',
    difficulty: 'MUDAH',
    questionText: 'Manakah komponen Laporan Keuangan pokok Satuan Kerja Kementerian/Lembaga (LKKL) tingkat UAKPA?',
    optionA: 'Laporan Realisasi Anggaran (LRA), Neraca, Laporan Operasional (LO), Laporan Perubahan Ekuitas (LPE), dan Catatan atas Laporan Keuangan (CaLK)',
    optionB: 'Buku Tabungan, Kuitansi, dan Surat Tugas',
    optionC: 'Daftar Gaji, Kartu Kendali, dan Denah Kantor',
    optionD: 'Struk Belanja Toko dan Kartu Nama',
    correctAnswer: 'A',
    explanation: 'Komponen laporan keuangan entitas akuntansi/pelaporan pemerintah terdiri atas LRA, Neraca, LO, LPE, dan CaLK yang memuat penjelasan terperinci pos-pos laporan.',
    referenceRegulation: 'PP No. 71 Tahun 2010 PSAP No. 01'
  },
  {
    topic: 'Akuntansi & Pelaporan Keuangan',
    difficulty: 'SEDANG',
    questionText: 'Apa fungsi utama Catatan atas Laporan Keuangan (CaLK) dalam laporan keuangan instansi pemerintah?',
    optionA: 'Menyajikan penjelasan naratif, rincian angka, kebijakan akuntansi, pengungkapan peristiwa penting, dan analisis kinerja anggaran entitas',
    optionB: 'Menuliskan biodata pribadi seluruh staf satker',
    optionC: 'Menyimpan puisi dan karya seni pegawai',
    optionD: 'Mencatat nomor telepon rekanan pengadaan',
    correctAnswer: 'A',
    explanation: 'CaLK memberikan penjelasan kualitatif dan kuantitatif atas angka-angka yang tersaji pada LRA, Neraca, LO, dan LPE guna memenuhi asas pengungkapan penuh (full disclosure).',
    referenceRegulation: 'PP No. 71/2010 PSAP No. 04 Catatan atas Laporan Keuangan'
  },

  // 16-30: Rekonsiliasi SAKTI-SPAN & LPJ Bendahara
  {
    topic: 'Akuntansi & Pelaporan Keuangan',
    difficulty: 'MUDAH',
    questionText: 'Proses pencocokan data transaksi keuangan antara Satuan Kerja (aplikasi SAKTI) dengan Bendahara Umum Negara / KPPN (sistem SPAN) disebut...',
    optionA: 'Rekonsiliasi Keuangan Eksternal',
    optionB: 'Negosiasi Harga Barang',
    optionC: 'Sensus Penduduk',
    optionD: 'Uji Coba Jaringan Listrik',
    correctAnswer: 'A',
    explanation: 'Rekonsiliasi eksternal adalah proses verifikasi dan pencocokan data transaksi keuangan antara Satker (SAKTI) dan KPPN/BUN (SPAN) untuk menjamin validitas laporan keuangan.',
    referenceRegulation: 'PMK No. 104/PMK.05/2017 tentang Pedoman Rekonsiliasi dalam rangka Penyusunan Laporan Keuangan Pemerintah'
  },
  {
    topic: 'Akuntansi & Pelaporan Keuangan',
    difficulty: 'SEDANG',
    questionText: 'Dokumen elektronik resmi yang diterbitkan melalui aplikasi MonSAKTI sebagai bukti sah bahwa satker telah menyelesaikan rekonsiliasi bulanan dengan KPPN tanpa selisih adalah...',
    optionA: 'Surat Keterangan Rekonsiliasi (SKR)',
    optionB: 'Sertifikat Tanah Hak Milik',
    optionC: 'Surat Izin Usaha Perdagangan',
    optionD: 'Faktur Pengiriman Paket',
    correctAnswer: 'A',
    explanation: 'Surat Keterangan Rekonsiliasi (SKR) terbit otomatis di MonSAKTI apabila data penerimaan, pengeluaran, saldo kas, dan pagu antara SAKTI dan SPAN dinyatakan cocok (match) 100%.',
    referenceRegulation: 'PMK No. 104/PMK.05/2017 & Juknis MonSAKTI'
  },
  {
    topic: 'Akuntansi & Pelaporan Keuangan',
    difficulty: 'ANALISIS',
    questionText: 'Pada hasil rekonsiliasi MonSAKTI bulan Juli ditemukan Terdapat Selisih Belanja Pegawai (Akun 51) sebesar Rp4.500.000 antara SAKTI dengan SPAN. Analisis penyebab apa yang paling sering memicu selisih tersebut?',
    optionA: 'Terdapat SP2D Gaji susulan yang sudah disahkan SPAN namun belum dicatat/dijurnal pada Modul Pembayaran/GLP SAKTI Satker',
    optionB: 'KPPN menaikkan tarif pajak secara diam-diam',
    optionC: 'Mata uang rupiah mengalami devaluasi',
    optionD: 'Pegawai satker pindah domisili',
    correctAnswer: 'A',
    explanation: 'Selisih belanja pada rekonsiliasi biasanya terjadi karena adanya SP2D yang terbit di SPAN namun satker belum melakukan penerimaan/pencatatan SP2D di aplikasi SAKTI.',
    referenceRegulation: 'Troubleshooting Rekonsiliasi Data MonSAKTI DJPb'
  },
  {
    topic: 'Akuntansi & Pelaporan Keuangan',
    difficulty: 'MUDAH',
    questionText: 'Kapan batas waktu penyampaian Laporan Pertanggungjawaban (LPJ) Bendahara Pengeluaran ke KPPN setiap bulannya?',
    optionA: 'Paling lambat tanggal 10 (sepuluh) bulan berikutnya atau hari kerja pertama setelah tanggal 10 jika hari libur',
    optionB: 'Paling lambat tanggal 25 akhir bulan',
    optionC: 'Hanya disampaikan 1 kali setahun di bulan Desember',
    optionD: 'Bebas disampaikan kapan saja',
    correctAnswer: 'A',
    explanation: 'Sesuai PMK 162/PMK.05/2013, LPJ Bendahara wajib disampaikan ke KPPN paling lambat tanggal 10 bulan berikutnya.',
    referenceRegulation: 'PMK No. 162/PMK.05/2013 Pasal 35 ayat (1)'
  },
  {
    topic: 'Akuntansi & Pelaporan Keuangan',
    difficulty: 'SEDANG',
    questionText: 'Apa konsekuensi / sanksi yang dijatuhkan oleh KPPN apabila Satuan Kerja terlambat menyampaikan LPJ Bendahara melampaui batas waktu tanggal 10?',
    optionA: 'Penerbitan Surat Peringatan dan pengenaan sanksi penundaan penerbitan SP2D atas SPM yang diajukan satker (kecuali SPM Gaji)',
    optionB: 'Pemutusan aliran listrik kantor satker',
    optionC: 'Penjualan aset gedung satker',
    optionD: 'Penyitaan kendaraan dinas kepala kantor',
    correctAnswer: 'A',
    explanation: 'Keterlambatan penyampaian LPJ Bendahara berakibat pada pengenaan sanksi penundaan pencairan dana (penerbitan SP2D dihentikan sementara sampai LPJ disahkan).',
    referenceRegulation: 'PMK No. 162/PMK.05/2013 Pasal 36'
  },
  {
    topic: 'Akuntansi & Pelaporan Keuangan',
    difficulty: 'ANALISIS',
    questionText: 'Dalam verifikasi LPJ Bendahara Pengeluaran bulan September, KPPN mendapati bahwa saldo kas menurut BKU adalah Rp15.000.000, sedangkan fisik uang di brankas Rp5.000.000 dan saldo bank Rp8.000.000 (total riil Rp13.000.000). Terdapat selisih kas Rp2.000.000. Dokumen apa yang wajib dilampirkan bendahara?',
    optionA: 'Berita Acara Pemeriksaan Kas yang memuat penjelasan penyebab selisih kas dan pernyataan tanggung jawab bendahara untuk menuntaskan selisih',
    optionB: 'Surat klaim santunan asuransi',
    optionC: 'Nota kosong bertanda tangan toko',
    optionD: 'Daftar menu makan siang rapat',
    correctAnswer: 'A',
    explanation: 'Setiap selisih kas antara pembukuan BKU dengan keadaan fisik kas (brankas + bank) wajib diungkapkan secara transparan dalam Berita Acara Pemeriksaan Kas dan CaLK.',
    referenceRegulation: 'PMK No. 162/PMK.05/2013 & Juknis Verifikasi LPJ Bendahara DJPb'
  },
  {
    topic: 'Akuntansi & Pelaporan Keuangan',
    difficulty: 'MUDAH',
    questionText: 'Opini audit tertinggi yang diberikan oleh Badan Pemeriksa Keuangan (BPK) atas Laporan Keuangan Kementerian/Lembaga adalah...',
    optionA: 'Wajar Tanpa Pengecualian (WTP)',
    optionB: 'Wajar Dengan Pengecualian (WDP)',
    optionC: 'Tidak Wajar (Adverse)',
    optionD: 'Menolak Memberikan Opini (Disclaimer)',
    correctAnswer: 'A',
    explanation: 'Opini WTP (Unqualified Opinion) menyatakan bahwa laporan keuangan telah disajikan secara wajar dalam semua hal yang material sesuai dengan SAP.',
    referenceRegulation: 'UU No. 15 Tahun 2004 tentang Pemeriksaan Pengelolaan dan Tanggung Jawab Keuangan Negara'
  },
  {
    topic: 'Akuntansi & Pelaporan Keuangan',
    difficulty: 'SEDANG',
    questionText: 'Penyusutan (depresiasi) atas aset tetap gedung dan bangunan pemerintah dalam SAP Akrual menggunakan metode standar...',
    optionA: 'Metode Garis Lurus (Straight Line Method)',
    optionB: 'Metode Saldo Menurun Ganda',
    optionC: 'Metode Jumlah Angka Tahun',
    optionD: 'Metode Taksiran Acak',
    correctAnswer: 'A',
    explanation: 'SAP Akrual pemerintah menetapkan metode garis lurus sebagai metode baku penyusutan aset tetap BMN berdasarkan masa manfaat yang ditetapkan dalam regulasi BMN.',
    referenceRegulation: 'PMK No. 1/PMK.06/2013 tentang Penyusutan Barang Milik Negara'
  },
  {
    topic: 'Akuntansi & Pelaporan Keuangan',
    difficulty: 'ANALISIS',
    questionText: 'Satker melakukan pembelian printer seharga Rp1.800.000 menggunakan dana belanja barang operasional (Akun 521111). Batasan minimum kapitalisasi BMN peralatan dan mesin adalah Rp1.000.000. Bagaimanakah perlakuan akuntansi BMN di neraca?',
    optionA: 'Karena nilainya Rp1.800.000 (> Rp1.000.000), printer tersebut wajib dikapitalisasi dan dicatat sebagai Aset Tetap Peralatan dan Mesin di Neraca',
    optionB: 'Dicatat sebagai barang habis pakai persediaan',
    optionC: 'Tidak perlu dicatat karena dibeli dari akun 52',
    optionD: 'Diakui sebagai piutang pegawai',
    correctAnswer: 'A',
    explanation: 'Aset yang memenuhi nilai perolehan di atas batas minimum kapitalisasi (satuan minimum Rp1 juta untuk peralatan mesin) wajib dicatat dan disajikan sebagai Aset Tetap di Neraca.',
    referenceRegulation: 'PMK No. 181/PMK.06/2016 tentang Penatausahaan BMN'
  },
  {
    topic: 'Akuntansi & Pelaporan Keuangan',
    difficulty: 'MUDAH',
    questionText: 'Aplikasi pengelolaan dan master database Barang Milik Negara (BMN) berbasis web yang dikembangkan oleh Direktorat Jenderal Kekayaan Negara (DJKN) adalah...',
    optionA: 'SIMAN (Sistem Informasi Manajemen Aset Negara)',
    optionB: 'SIMPATIKA',
    optionC: 'SIMBADA Daerah',
    optionD: 'Dukcapil Online',
    correctAnswer: 'A',
    explanation: 'SIMAN (Sistem Informasi Manajemen Aset Negara) adalah aplikasi pengelolaan siklus BMN terpusat yang dikelola oleh Ditjen Kekayaan Negara Kementerian Keuangan.',
    referenceRegulation: 'PMK tentang Tata Kelola Sistem Informasi Manajemen Aset Negara'
  }
];
