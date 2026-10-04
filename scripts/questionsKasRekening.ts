import { RawQuestion } from './questionsIkpa';

export const kasRekeningQuestions: RawQuestion[] = [
  // 1-15: Pengelolaan Kas Negara, Rekening Satker PMK 182/2017 & TSA
  {
    topic: 'Pengelolaan Kas & Rekening Pemerintah',
    difficulty: 'MUDAH',
    questionText: 'Prinsip pengelolaan kas negara terpusat di mana seluruh penerimaan dan pengeluaran negara dihimpun dalam satu rekening kas umum negara disebut...',
    optionA: 'Treasury Single Account (TSA) / Rekening Kas Umum Negara Bersatu',
    optionB: 'Multi Bank System',
    optionC: 'Rekening Bebas Pajak',
    optionD: 'Kas Beranting Mandiri',
    correctAnswer: 'A',
    explanation: 'Treasury Single Account (TSA) adalah struktur rekening terpadu perbendaharaan negara untuk memusatkan saldo kas dan meminimalkan biaya pinjaman serta mengeliminasi idle cash.',
    referenceRegulation: 'UU No. 1/2004 tentang Perbendaharaan Negara Pasal 12 & PMK Rekening Pemerintah'
  },
  {
    topic: 'Pengelolaan Kas & Rekening Pemerintah',
    difficulty: 'MUDAH',
    questionText: 'Siapakah pejabat yang berwenang memberikan izin pembukaan rekening milik Kementerian Negara / Lembaga pada bank umum?',
    optionA: 'Kuasa Bendahara Umum Negara (Kuasa BUN) di Daerah / KPPN / Kanwil DJPb atas nama Menteri Keuangan',
    optionB: 'Pimpinan cabang bank setempat secara lisan',
    optionC: 'Bupati atau Walikota',
    optionD: 'Ketua Asosiasi Bank Swasta',
    correctAnswer: 'A',
    explanation: 'Sesuai PMK 182/PMK.05/2017, pembukaan rekening dinas milik instansi pemerintah wajib memperoleh izin tertulis terlebih dahulu dari Kuasa BUN (KPPN/Kanwil DJPb).',
    referenceRegulation: 'PMK No. 182/PMK.05/2017 tentang Pengelolaan Rekening Milik K/L Pasal 4'
  },
  {
    topic: 'Pengelolaan Kas & Rekening Pemerintah',
    difficulty: 'SEDANG',
    questionText: 'Manakah jenis rekening dinas yang diperbolehkan dibuka oleh Satuan Kerja kementerian/lembaga pengelola APBN?',
    optionA: 'Rekening Pengeluaran, Rekening Penerimaan, dan Rekening Lainnya (seperti rekening penampungan hibah / dana titipan)',
    optionB: 'Rekening Investasi Saham Gorengan',
    optionC: 'Rekening Deposito Pribadi Pejabat',
    optionD: 'Rekening Arisan Keluarga Pegawai',
    correctAnswer: 'A',
    explanation: 'PMK 182/2017 mengklasifikasikan rekening pemerintah menjadi Rekening Pengeluaran, Rekening Penerimaan, dan Rekening Lainnya yang seluruhnya wajib terdaftar resmi.',
    referenceRegulation: 'PMK No. 182/PMK.05/2017 Pasal 3'
  },
  {
    topic: 'Pengelolaan Kas & Rekening Pemerintah',
    difficulty: 'ANALISIS',
    questionText: 'Sebuah satker membuka rekening giro di bank umum untuk menampung dana kerja sama tanpa mengajukan permohonan persetujuan kepada Kuasa BUN di KPPN. Bagaimanakah status rekening tersebut?',
    optionA: 'Merupakan Rekening Liar (Ilegal) yang melanggar hukum perbendaharaan dan wajib segera ditutup serta dananya disetor ke Kas Negara',
    optionB: 'Sah selama digunakan untuk kepentingan kantor',
    optionC: 'Boleh jika saldonya di bawah Rp100 juta',
    optionD: 'Diperbolehkan atas izin kepala seksi satker',
    correctAnswer: 'A',
    explanation: 'Rekening dinas yang dibuka tanpa izin Kuasa BUN dikategorikan sebagai rekening tidak berizin/liar dan melanggar hukum perbendaharaan negara serta wajib ditutup.',
    referenceRegulation: 'UU No. 1/2004 & PMK No. 182/PMK.05/2017 Bab Penertiban Rekening'
  },
  {
    topic: 'Pengelolaan Kas & Rekening Pemerintah',
    difficulty: 'SEDANG',
    questionText: 'Apakah nama aplikasi resmi milik Ditjen Perbendaharaan yang digunakan untuk memonitor, mendaftarkan, dan menertibkan seluruh rekening pemerintah se-Indonesia secara online?',
    optionA: 'Sprint (Sistem Pengelolaan Rekening Terintegrasi)',
    optionB: 'Aplikasi OVO',
    optionC: 'Aplikasi WhatsApp',
    optionD: 'Aplikasi Google Drive',
    correctAnswer: 'A',
    explanation: 'Aplikasi SPRINT (sprint.kemenkeu.go.id) adalah sistem sentral Ditjen Perbendaharaan untuk pendaftaran, izin pembukaan, laporan saldo bulanan, dan penutupan rekening pemerintah.',
    referenceRegulation: 'Perdirjen Perbendaharaan tentang Penggunaan Aplikasi SPRINT'
  },
  {
    topic: 'Pengelolaan Kas & Rekening Pemerintah',
    difficulty: 'MUDAH',
    questionText: 'Kapan batas waktu penyampaian Laporan Saldo Rekening bulanan oleh Satker ke KPPN melalui aplikasi SPRINT?',
    optionA: 'Paling lambat tanggal 10 (sepuluh) setiap bulan berikutnya',
    optionB: 'Paling lambat akhir tahun anggaran',
    optionC: 'Hanya jika diminta oleh BPK',
    optionD: 'Tidak wajib dilaporkan',
    correctAnswer: 'A',
    explanation: 'Satker wajib melaporkan posisi saldo seluruh rekening dinas yang dimilikinya ke KPPN via SPRINT paling lambat tanggal 10 setiap bulan.',
    referenceRegulation: 'PMK No. 182/PMK.05/2017 Pasal 22'
  },
  {
    topic: 'Pengelolaan Kas & Rekening Pemerintah',
    difficulty: 'ANALISIS',
    questionText: 'KPA menutup salah satu rekening penampungan dana titipan karena proyek kerja sama telah berakhir. Berapa hari kerja batas waktu bagi KPA untuk menyampaikan laporan penutupan rekening tersebut ke KPPN?',
    optionA: 'Paling lambat 5 (lima) hari kerja sejak tanggal penutupan rekening oleh pihak bank',
    optionB: 'Paling lambat 30 hari kalender',
    optionC: 'Paling lambat 1 tahun kemudian',
    optionD: 'Tidak perlu dilaporkan ke KPPN',
    correctAnswer: 'A',
    explanation: 'Penutupan rekening pemerintah wajib dilaporkan secara tertulis kepada Kuasa BUN / KPPN dengan melampirkan surat bukti penutupan dari bank paling lambat 5 hari kerja.',
    referenceRegulation: 'PMK No. 182/PMK.05/2017 Pasal 20'
  },
  {
    topic: 'Pengelolaan Kas & Rekening Pemerintah',
    difficulty: 'SEDANG',
    questionText: 'Apa yang dimaksud dengan Rekening Virtual (Virtual Account) dalam pengelolaan rekening induk pengeluaran/penerimaan pemerintah?',
    optionA: 'Sub-rekening tanpa buku fisik yang terafiliasi dengan rekening induk untuk mengidentifikasi setoran atau memudahkan segregasi transaksi tanpa perlu membuka banyak rekening giro baru',
    optionB: 'Rekening palsu di internet',
    optionC: 'Rekening mata uang kripto',
    optionD: 'Rekening simulasi game komputer',
    correctAnswer: 'A',
    explanation: 'Virtual Account memfasilitasi konsolidasi kas dan simplifikasi rekening, sehingga transaksi kas terpantau real-time pada rekening induk tanpa pembengkakan jumlah rekening fisik.',
    referenceRegulation: 'PMK No. 183/PMK.05/2019 tentang Penerapan Pengelolaan Kas Terpadu Melalui Virtual Account'
  },
  {
    topic: 'Pengelolaan Kas & Rekening Pemerintah',
    difficulty: 'MUDAH',
    questionText: 'Rekening kas bendahara yang tidak pernah mengalami transaksi mutasi debit atau kredit selama lebih dari 6 bulan berturut-turut diklasifikasikan oleh sistem perbankan sebagai...',
    optionA: 'Rekening Pasif (Dormant Account)',
    optionB: 'Rekening Emas',
    optionC: 'Rekening Berbunga Tinggi',
    optionD: 'Rekening Spesial',
    correctAnswer: 'A',
    explanation: 'Rekening pasif (dormant) adalah rekening tanpa mutasi aktif yang rentan retur SP2D dan penyalahgunaan, sehingga menjadi sasaran monitoring penertiban Kuasa BUN.',
    referenceRegulation: 'Ketentuan Perbankan Bank Indonesia & PMK 182/2017'
  },
  {
    topic: 'Pengelolaan Kas & Rekening Pemerintah',
    difficulty: 'ANALISIS',
    questionText: 'Sebuah rekening dinas pemerintah memiliki sisa saldo kas yang telah menjadi rekening pasif selama bertahun-tahun dan tidak dapat dihubungi pengelolanya. Kebijakan apa yang dapat diambil Kuasa BUN?',
    optionA: 'Memerintahkan pihak bank untuk memblokir, menutup rekening, dan memindahkan sisa saldo kas ke Rekening Kas Umum Negara',
    optionB: 'Menyerahkan saldo kas kepada nasabah bank lainnya',
    optionC: 'Mendiamkannya selamanya',
    optionD: 'Membagikan dana kepada staf bank',
    correctAnswer: 'A',
    explanation: 'Kuasa BUN berwenang secara hukum memerintahkan bank mitra untuk menutup rekening pasif tidak bertuan dan menyetorkan seluruh sisa dananya ke Kas Umum Negara.',
    referenceRegulation: 'UU No. 1/2004 & PMK No. 182/PMK.05/2017'
  }
];
