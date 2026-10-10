# -*- coding: utf-8 -*-
import json
import os

def make_q(num, topic, diff, q_text, a, b, c, d, ans, exp, reg):
    pts = 5 if diff == 'MUDAH' else (10 if diff == 'SEDANG' else 15)
    return {
        "id": f"mbq_{num}",
        "number": num,
        "topic": topic,
        "difficulty": diff,
        "questionText": q_text,
        "optionA": a,
        "optionB": b,
        "optionC": c,
        "optionD": d,
        "correctAnswer": ans,
        "explanation": exp,
        "referenceRegulation": reg,
        "points": pts
    }

questions = []
cur_num = 1851

def add_topic(topic, reg, items):
    global cur_num, questions
    for it in items:
        diff = it[0]
        q_text = it[1]
        a = it[2]
        b = it[3]
        c = it[4]
        d = it[5]
        ans = it[6]
        exp = it[7]
        questions.append(make_q(cur_num, topic, diff, q_text, a, b, c, d, ans, exp, reg))
        cur_num += 1
    print(f"Added {topic}, current count: {len(questions)}")

# ============================================================================
# TOPIC 17: Pengelolaan Rekening Pemerintah & Virtual Account (RPL/RPS/RPN) (1851 - 1900)
# ============================================================================
reg17 = "PMK No. 183/PMK.05/2019 jo PMK No. 182/PMK.05/2017 tentang Pengelolaan Rekening Milik Satuan Kerja K/L"
t17 = "Pengelolaan Rekening Pemerintah & Virtual Account (RPL/RPS/RPN)"

t17_items = []
# 17 MUDAH
t17_items.extend([
    ("MUDAH", "Berdasarkan PMK No. 183/PMK.05/2019, setiap pembukaan Rekening Milik Kementerian Negara/Lembaga wajib mendapatkan persetujuan tertulis dari:",
     "Kuasa Bendahara Umum Negara (BUN) Pusat / Ditjen Perbendaharaan atau Kepala KPPN atas nama Kuasa BUN", "Pimpinan partai politik pemenang pemilu", "Kepala Kepolisian Daerah setempat", "Camat wilayah domisili kantor satuan kerja", "A",
     "Pembukaan seluruh rekening pemerintah wajib memperoleh izin tertulis persetujuan Kuasa BUN (Kemenkeu) untuk mencegah rekening liar."),
    ("MUDAH", "Rekening Kas Negara yang dibuka tanpa persetujuan Kuasa BUN dikategorikan sebagai:",
     "Rekening Liar (Rekening Tidak Sah) yang wajib ditutup dan saldonya disita ke Kas Negara", "Rekening rahasia yang sah untuk operasional darurat", "Rekening tabungan pribadi bendahara yang dilindungi", "Rekening amal kemanusiaan satker", "A",
     "Rekening tanpa izin Kuasa BUN berstatus rekening ilegal/liar, dikenai sanksi penutupan dan pemindahan seluruh saldo ke kas negara."),
    ("MUDAH", "Tiga kelompok utama Rekening Milik Kementerian Negara/Lembaga adalah:",
     "Rekening Penerimaan, Rekening Pengeluaran, dan Rekening Lainnya", "Rekening Deposito, Rekening Saham, dan Rekening Kripto", "Rekening Pribadi, Rekening Keluarga, dan Rekening Teman", "Rekening Bisnis, Rekening Hiburan, dan Rekening Rekreasi", "A",
     "PMK 183 membagi rekening K/L dalam 3 jenis: Rekening Penerimaan, Rekening Pengeluaran, dan Rekening Lainnya."),
    ("MUDAH", "Rekening Virtual (Virtual Account) pada rekening pengeluaran atau penerimaan kementerian/lembaga berfungsi untuk:",
     "Mengidentifikasi transaksi penerimaan dan pengeluaran secara otomatis serta mengkonsolidasikan saldo ke rekening induk tanpa dana mengendap", "Menyembunyikan mutasi kas dari pengawasan KPPN", "Membuat nama pemilik rekening menjadi anonim di bank", "Menghindari pemotongan pajak penghasilan", "A",
     "Virtual Account mengotomatiskan rekonsiliasi transaksi kas dan memastikan dana terpusat dalam kerangka Treasury Single Account (TSA)."),
    ("MUDAH", "Aplikasi resmi Kementerian Keuangan yang digunakan untuk penatausahaan, perizinan, dan pemantauan seluruh rekening pemerintah di Indonesia adalah:",
     "Aplikasi Sprint (Sistem Perizinan dan Informasi Rekening Pemerintah)", "Aplikasi Game Daring Nasional", "Platform Pemesanan Ojek Daring", "Kamera CCTV kantor cabang bank", "A",
     "Aplikasi Sprint (Sistem Pengelolaan Rekening Terintegrasi) adalah portal tunggal pendaftaran dan monitoring rekening pemerintah se-Indonesia."),
    ("MUDAH", "Ketentuan penutupan Rekening Milik K/L yang sudah tidak digunakan lagi (misalnya kegiatan proyek telah selesai) wajib dilakukan dalam jangka waktu:",
     "Paling lambat 30 hari kerja setelah kegiatan selesai atau izin pembukaan rekening berakhir", "100 tahun setelah kantor dibubarkan", "Kapan saja jika bendahara ingat", "Tidak perlu ditutup dan dibiarkan pasif selamanya", "A",
     "Rekening yang telah habis masa berlakunya atau tujuannya telah selesai wajib segera ditutup satker dan dilaporkan ke Kuasa BUN."),
    ("MUDAH", "Rekening Penerimaan Kementerian/Lembaga memiliki karakteristik perbendaharaan yang ketat, yaitu:",
     "Saldo rekening wajib disetorkan seluruhnya ke Kas Negara setiap akhir hari kerja (bersaldo nihil) dan dilarang digunakan untuk belanja langsung", "Dapat digunakan untuk membayar makan siang pegawai kantor", "Boleh dipinjamkan kepada pihak ketiga yang membutuhkan modal", "Dibiarkan menumpuk hingga akhir tahun anggaran", "A",
     "Rekening Penerimaan menerapkan prinsip saldo nihil harian; seluruh uang masuk disetor ke RKUN via MPN dan dilarang ditarik untuk belanja."),
    ("MUDAH", "Jasa giro atau bunga bank yang diperoleh atas saldo Rekening Milik Satker Pemerintah Pusat berstatus sebagai:",
     "Hak Kas Negara dan wajib disetorkan penuh ke Kas Negara sebagai PNBP BUN", "Uang saku tambahan bagi kepala satuan kerja", "Bonus prestasi bagi manajer bank cabang mitra", "Uang kas kecil untuk membeli cemilan rapat", "A",
     "Seluruh bunga bank atau jasa giro atas rekening pemerintah merupakan hak negara yang disetor ke kas negara sebagai PNBP."),
    ("MUDAH", "Nama resmi Rekening Pengeluaran milik Satker pada bank umum wajib mencantumkan format standar:",
     "Jabatan satuan kerja (misal RPL [Kode Satker] [Nama Satker] Bendahara Pengeluaran), bukan nama pribadi pejabat", "Nama lengkap pribadi bendahara beserta gelar adat", "Nama samaran keren pimpinan kantor", "Nama perusahaan rekanan pemenang tender", "A",
     "Nama rekening dinas wajib menggunakan nomenklatur jabatan satker resmi, dilarang mencantumkan nama orang pribadi."),
    ("MUDAH", "Ketentuan saldo kas tunai pada brankas Bendahara Pengeluaran dibatasi maksimal sebesar:",
     "Rp 50.000.000 (lima puluh juta rupiah) atau batasan limit kas brankas yang ditetapkan regulasi pada akhir hari kerja", "Rp 10 Triliun tunai", "Tidak ada batas, boleh menimbun uang sebanyak-banyaknya", "Rp 1.000 saja", "A",
     "Untuk mitigasi risiko pencurian dan idle cash, penyimpanan uang tunai di brankas bendahara dibatasi limit kas brankas harian."),
    ("MUDAH", "Treasury Single Account (TSA) pada rekening penerimaan pemerintah diimplementasikan melalui mekanisme:",
     "Penyapuan saldo otomatis (automatic sweeping) harian dari bank persepsi ke Rekening Kas Umum Negara di Bank Indonesia", "Pengiriman uang tunai memakai mobil pos keliling seminggu sekali", "Penyimpanan kas di lemari besi kantor pajak", "Penitipan saldo kas ke koperasi pegawai", "A",
     "TSA Penerimaan menyapu seluruh saldo penerimaan di bank persepsi secara harian ke rekening BUN di Bank Sentral."),
    ("MUDAH", "Rekening Lainnya pada Satker K/L dibuka untuk menampung dana yang bukan penerimaan negara dan bukan belanja APBN, antara lain:",
     "Uang titipan jaminan lelang, uang titipan perkara pengadilan, dan dana perwakilan RI di luar negeri", "Uang sumbangan kampanye partai politik", "Uang arisan keluarga para staf kantor", "Uang hasil bisnis sampingan pejabat", "A",
     "Rekening Lainnya menampung dana pihak ketiga (titipan perkara pengadilan, jaminan lelang, dana titipan pemilu) yang sah."),
    ("MUDAH", "Bank umum yang dapat dipilih oleh Satker untuk membuka rekening pemerintah adalah bank umum yang:",
     "Telah ditetapkan sebagai Bank Mitra Operasional Kemenkeu dan menandatangani Perjanjian Kerja Sama (PKS) TSA", "Menawarkan undian mobil mewah bagi bendahara", "Merupakan bank gelap tak berizin di luar negeri", "Memiliki kantor cabang paling dekat dengan rumah bendahara", "A",
     "Rekening dinas hanya boleh dibuka pada Bank Umum mitra kerja sama resmi pemerintah yang terhubung dengan sistem perbendaharaan."),
    ("MUDAH", "Surat Izin Pembukaan Rekening yang diterbitkan oleh KPPN/Kuasa BUN memuat data identitas berupa:",
     "Nomor izin, nama rekening dinas, nama bank mitra, kode satker, dan tujuan penggunaan rekening", "Daftar seluruh kerabat keluarga bendahara", "Nomor sepatu pimpinan kantor satker", "Ramalan cuaca di wilayah satuan kerja", "A",
     "Surat persetujuan Kuasa BUN menetapkan batas identitas, kodefikasi rekening resmi, dan tujuan spesifik rekening pemerintah."),
    ("MUDAH", "Apabila Satker membuka rekening pemerintah tanpa izin dan ditemukan dalam audit BPK, sanksi administratifnya adalah:",
     "Rekening diblokir, uang dipindahkan ke kas negara, dan satker dikenai sanksi penurunan kinerja tata kelola", "Satker diberikan piala kejujuran perbendaharaan", "KPPN membebaskan satker dari pembuatan laporan keuangan", "Uang rekening dibagi dua dengan pemeriksa BPK", "A",
     "Rekening tidak sah memicu pemblokiran langsung oleh Kemenkeu, penutupan rekening, dan penjatuhan sanksi administratif kepegawaian."),
    ("MUDAH", "Rekonsiliasi rekening koran bank dengan Buku Kas Umum (BKU) bendahara pengeluaran wajib dilakukan setiap:",
     "Setiap akhir bulan atau secara harian melalui fasilitas Cash Management System (CMS) perbankan", "Setiap sepuluh tahun sekali", "Hanya jika bendahara kehilangan brankas", "Tidak perlu rekonsiliasi jika saldo bank cocok dengan ingatan", "A",
     "Rekonsiliasi bank wajib dilakukan berkala (bulanan/harian) untuk memastikan keselarasan catatan kas BKU dengan mutasi rekening koran."),
    ("MUDAH", "Penggunaan fasilitas Cash Management System (CMS) Perbankan oleh Bendahara Pengeluaran bertujuan untuk:",
     "Melakukan transaksi transfer non-tunai perbankan secara aman, akuntabel, dan transparan dari komputer dinas satker", "Bermain gim daring saat jam istirahat kantor", "Membeli saham spekulatif di pasar modal internasional", "Mengirim pesan berantai ke kontak ponsel pribadi", "A",
     "CMS perbankan mendigitalkan penatausahaan kas bendahara dengan pengamanan berlapis (maker, checker, signer) tanpa kontak uang tunai.")
])

# 17 SEDANG
t17_items.extend([
    ("SEDANG", "Mekanisme pengamanan transaksi pada CMS Perbankan Satker menerapkan prinsip 'Segregation of Duties' yang melibatkan tiga lapis peran, yaitu:",
     "Maker (operator pembuat draft transfer), Checker (pemeriksa/verifikator data), dan Signer/Approver (bendahara/pejabat penyetuju transfer)", "Satu orang pegawai memegang seluruh kata sandi dan token sekaligus", "Menyerahkan proses transfer kepada teller bank secara lisan", "Menggunakan komputer warnet umum tanpa pengamanan sandi", "A",
     "Segregation of duties pada CMS bank memastikan otorisasi bertingkat (maker, checker, signer) untuk mencegah penyelewengan kas tunggal."),
    ("SEDANG", "Perlakuan terhadap rekening penampungan dana titipan lelang di KPKNL (Rekening Lainnya) saat peserta lelang kalah tender adalah:",
     "Uang jaminan lelang wajib dikembalikan 100% secara utuh tanpa potongan ke rekening peserta yang kalah dalam batas waktu regulasi", "Uang jaminan dipotong 50% untuk biaya lelah panitia lelang", "Uang jaminan disita menjadi hak milik pribadi juru lelang", "Uang jaminan dialihkan untuk membeli makanan rapat kantor", "A",
     "Dana titipan jaminan lelang peserta yang tidak menang tender wajib direstitusi utuh tanpa potongan via sistem perbankan terintegrasi."),
    ("SEDANG", "Jika sebuah rekening Satker tidak pernah mengalami mutasi transaksi debet maupun kredit selama 6 bulan berturut-turut (Rekening Pasif/Dormant), Kuasa BUN berwenang:",
     "Menerbitkan surat peringatan dan meminta bank mitra menutup rekening serta memindahkan saldo sisa ke Kas Negara", "Mendiamkan rekening tersebut sampai seratus tahun", "Menaikkan batas saldo rekening menjadi tak terbatas", "Mengalihkan rekening ke atas nama pimpinan bank cabang", "A",
     "Rekening dormant/pasif berisiko disalahgunakan; Kuasa BUN melakukan pembersihan rekening berkala melalui surat perintah penutupan rekening."),
    ("SEDANG", "Penerapan rekening induk dan sub-rekening virtual (Virtual Account Pooling) pada rumah sakit pemerintah berstatus BLU menghasilkan manfaat:",
     "Seluruh pendapatan dari puluhan instalasi/poli rumah sakit langsung terkonsolidasi ke rekening induk secara real-time dengan rincian sumber transaksi jelas", "Poli rumah sakit bebas menyimpan uang tunai di laci meja dokter", "Dokter dan perawat dilarang menerima pembayaran dari pasien", "Kasir rumah sakit harus mencatat transaksi di buku kertas besar", "A",
     "VA pooling mengidentifikasi secara otomatis rincian asal transaksi pasien/layanan sekaligus memusatkan saldo ke rekening utama BLU."),
    ("SEDANG", "Ketentuan tentang rekening penyaluran Bantuan Sosial (Bansos) pemerintah mensyaratkan rekening penerima manfaat dibuat dengan fitur:",
     "Rekening inklusif 'Basic Saving Account' (tanpa biaya administrasi bulanan dan saldo mengendap minimum nol rupiah)", "Rekening koran korporasi dengan setoran awal Rp 10 juta", "Rekening valas bersaldo minimum USD 1,000", "Rekening kartu kredit bunga tinggi", "A",
     "Penyaluran bansos menggunakan rekening inklusif nirbiaya (BSA) agar bantuan sosial diterima masyarakat miskin utuh tanpa potongan."),
    ("SEDANG", "Dalam aplikasi SPRINT, proses rekonsiliasi data rekening antara Kementerian Keuangan dan Kantor Pusat Bank Umum dilakukan setiap:",
     "Secara berkala setiap semester/triwulan untuk mencocokkan seluruh rekening K/L yang terdaftar di bank dengan database persetujuan Kuasa BUN", "Setiap satu abad sekali", "Hanya bila terjadi gempa bumi tektonik", "Tidak pernah dilakukan karena percaya data bank", "A",
     "Rekonsiliasi rekening nasional via SPRINT mencocokkan data bank mitra dengan database Kemenkeu untuk menjaring rekening tak berizin."),
    ("SEDANG", "Dampak hukum bagi bank umum yang membuka rekening atas nama instansi pemerintah tanpa meminta Surat Izin Persetujuan Kuasa BUN adalah:",
     "Bank umum melanggar PKS rekening pemerintah dan dapat dikenai sanksi penangguhan kerja sama operasional atau denda administratif", "Bank umum diberikan piagam kemitraan teladan", "Bank umum berhak menyita seluruh aset kementerian", "Bank umum diangkat menjadi pemilik sah kantor satker", "A",
     "Bank mitra operasional terikat PKS; membuka rekening dinas tanpa izin Kuasa BUN merupakan pelanggaran kontraktual yang berujung sanksi pemutusan PKS."),
    ("SEDANG", "Pengelolaan Rekening Khusus (Special Account) untuk penyaluran Pinjaman/Hibah Luar Negeri diatur dengan ketentuan:",
     "Dibuka oleh Menteri Keuangan di Bank Indonesia atau bank mitra yang disetujui donor untuk menampung dana penarikan awal (initial deposit)", "Dikelola bebas oleh konsultan asing di negara asalnya", "Disimpan di rekening tabungan staf bagian pengadaan", "Digunakan untuk spekulasi jual beli emas digital", "A",
     "Rekening Khusus dibuka di Bank Sentral/bank mitra yang disetujui untuk mengelola penarikan pinjaman/hibah luar negeri secara transparan."),
    ("SEDANG", "Berdasarkan PMK 183/PMK.05/2019, pejabat yang berwenang menandatangani spesimen pembukaan rekening satker pada bank adalah:",
     "KPA bersama Bendahara Pengeluaran / Bendahara Penerimaan yang diangkat secara sah dengan Surat Keputusan (SK)", "Staf honorer yang bertugas sebagai pengemudi kendaraan", "Satpam kantor yang bertugas jaga malam", "Petugas kebersihan ruang kerja pimpinan", "A",
     "Spesimen tanda tangan rekening dinas wajib ditandatangani oleh pejabat resmi (KPA dan Bendahara bersertifikat) berbasis SK pengangkatan."),
    ("SEDANG", "Saldo bunga atas Rekening Pengeluaran Satker pada bank umum operasional yang menganut sistem TSA dihitung dan disetor dengan mekanisme:",
     "Bank menghitung bunga giro harian dan menyetorkannya langsung ke Kas Negara secara otomatis (interbank settlement) atas nama PNBP BUN", "Bunga dibagikan secara tunai kepada seluruh staf keuangan kantor", "Bunga dipotong untuk membeli tiket mudik pejabat", "Bunga dibiarkan hilang tanpa pencatatan akuntansi", "A",
     "Dalam skema TSA, bunga saldo rekening pemerintah disetor langsung oleh sistem bank ke RKUN sebagai pendapatan PNBP BUN secara berkala."),
    ("SEDANG", "Penggunaan Kartu Debit Rekening Bendahara Pengeluaran dibatasi dengan regulasi ketat, yaitu:",
     "Hanya untuk keperluan kedinasan yang mendesak sesuai plafon UP, dilarang untuk transaksi pribadi, dan bukti EDC wajib disimpan untuk SPJ", "Boleh dipakai belanja kebutuhan keluarga bendahara saat akhir pekan", "Boleh dipinjamkan kepada tetangga untuk belanja online", "Dilarang meminta bukti struk pembayaran belanja", "A",
     "Kartu debit dinas hanya instrumen substitusi kas tunai untuk transaksi belanja kedinasan sah; penyalahgunaan pribadi berakibat sanksi disiplin berat."),
    ("SEDANG", "Perlakuan terhadap rekening milik Satuan Kerja yang mengalami likuidasi/penggabungan kementerian (kementerian merger) adalah:",
     "KPA satker lama wajib menutup seluruh rekening, memindahkan saldo kas ke kas negara atau rekening satker baru, dan melapor ke KPPN via SPRINT", "Membagi sisa uang di rekening kepada pejabat kementerian lama", "Membiarkan rekening tetap aktif tanpa pejabat yang bertanggung jawab", "Mengganti nama rekening menjadi rekening pribadi mantan menteri", "A",
     "Restrukturisasi kementerian mewajibkan penutupan rekening eks-satker lama dan migrasi saldo ke entitas baru dengan izin persetujuan Kuasa BUN."),
    ("SEDANG", "Dalam hal Bendahara Pengeluaran meninggal dunia atau dimutasi, prosedur administratif mutasi rekening dinas ke bendahara baru adalah:",
     "Menerbitkan Berita Acara Serah Terima Kas dan mengajukan perubahan spesimen tanda tangan rekening ke bank mitra dengan melampirkan SK pengangkatan baru", "Menguras seluruh isi rekening dan membagikannya ke keluarga", "Menutup kantor satker dan membubarkan seluruh organisasi", "Menunggu hingga 5 tahun baru mengganti nama rekening", "A",
     "Pergantian bendahara segera diikuti serah terima kas resmi, kas opname, dan pemutakhiran spesimen tanda tangan di bank mitra."),
    ("SEDANG", "Penyimpanan kas negara pada bank perkreditan rakyat (BPR) atau koperasi simpan pinjam oleh Satker pemerintah berstatus:",
     "Dilarang keras oleh peraturan perundangan karena rekening pemerintah hanya boleh dibuka pada Bank Umum terpercaya mitra perbendaharaan", "Sangat dianjurkan demi mendapatkan suku bunga tinggi", "Diperbolehkan asalkan pemilik BPR adalah teman akrab KPA", "Wajib dilakukan untuk seluruh anggaran belanja modal", "A",
     "Regulasi keuangan negara melarang keras penempatan dana pemerintah di lembaga non-bank umum demi menjaga keamanan kas negara."),
    ("SEDANG", "Pemeriksaan berkala atas fisik rekening (rekonsiliasi BKU dan saldo bank) oleh KPA sekurang-kurangnya dilakukan:",
     "Satu kali dalam satu bulan yang dituangkan dalam Berita Acara Pemeriksaan Kas Bulanan", "Satu kali dalam 10 tahun", "Hanya jika bendahara berniat mengundurkan diri", "Tidak perlu diperiksa karena bendahara sudah jujur", "A",
     "KPA wajib melakukan pemeriksaan kas bendahara (kas opname dan rekonsiliasi bank) minimal 1 kali sebulan sebagai bentuk pengawasan melekat."),
    ("SEDANG", "Penyaluran dana Uang Persediaan (UP) ke rekening Virtual Account sub-satker/kantor cabang pembantu diatur dengan plafon yang:",
     "Ditetapkan oleh KPA dengan mempertimbangkan kebutuhan operasional riil dan batas maksimum UP DIPA satker induk", "Bebas ditarik tanpa batasan nilai nominal", "Hanya boleh bernilai maksimal Rp 500 per hari", "Harus berupa transfer ke rekening pribadi staf", "A",
     "Plafon sub-VA kantor unit pembantu ditetapkan secara proporsional oleh KPA induk agar tidak melampaui toleransi limit kas DIPA."),
    ("SEDANG", "Penerapan sistem BI-FAST pada CMS perbankan pemerintah memberikan keunggulan perbendaharaan berupa:",
     "Biaya transfer antarbank yang sangat murah, transaksi seketika (real-time) 24/7, dan pelacakan transaksi instan bagi bendahara pengeluaran", "Pembebasan kewajiban membayar utang bagi seluruh nasabah", "Pencairan uang tunai di luar mesin ATM secara gratis", "Penghapusan nomor rekening penerima transfer", "A",
     "BI-FAST mempercepat operasionalisasi belanja non-tunai satker dengan tarif efisien dan penyelesaian seketika setiap saat.")
])

# 16 ANALISIS
t17_items.extend([
    ("ANALISIS", "Analisis Kasus Penggelapan Kas Melalui Rekening Penampungan Gelap (Shadow Account): Oknum bendahara membuat rekening giro bank atas nama 'Satker Humas Bagian Kreatif' tanpa izin SPRINT dan membelokkan dana sisa pengembalian belanja ke rekening tersebut senilai Rp 800 juta. Delik pidana dan pembuktiannya adalah:",
     "Merupakan tindak pidana korupsi penggelapan dalam jabatan (UU Tipikor) dan pembukaan rekening liar (UU No. 1/2004); dibuktikan via rekonsiliasi data SPRINT dan audit BPKP", "Tindakan perbankan inovatif yang mempermudah kerja tim kreatif satker", "Bukan pelanggaran karena nama rekening mencantumkan instansi pemerintah", "Cukup diselesaikan dengan permintaan maaf di media sosial", "A",
     "Pembukaan rekening satker tanpa izin SPRINT untuk menampung kas negara adalah kejahatan korupsi penggelapan kas publik secara terencana."),
    ("ANALISIS", "Analisis Kasus Pembobolan Rekening Bendahara Melalui Serangan Social Engineering (Phishing CMS): Bendahara menyerahkan OTP CMS kepada penipu yang mengaku sebagai petugas IT bank via telepon, sehingga kas satker Rp 1,2 miliar terkuras. Tanggung jawab hukum perbendaharaannya adalah:",
     "Merupakan kelalaian berat bendahara dalam pengamanan kredensial kedinasan; bendahara dituntut ganti rugi penuh melalui sidang TP/TGR dan dikenai sanksi disiplin", "KPPN wajib mengganti uang yang hilang dengan mencetak uang baru", "Kerugian negara dianggap sebagai takdir musibah yang tidak perlu diganti", "Bank otomatis dinyatakan bangkrut oleh pengadilan", "A",
     "Kelalaian mengamankan token OTP kedinasan merupakan kelalaian fatal pejabat bendahara; kerugian wajib dipulihkan melalui penetapan SKTJM/TGR."),
    ("ANALISIS", "Analisis Dampak Arsitektur Multi-Virtual Account Terhadap Pencegahan 'Lapping Fraud': Bagaimana pencatatan setoran retribusi melalui Virtual Account per unit usaha mencegah kasir menunda penyetoran kas?",
     "Setiap pembayaran debitur langsung menghasilkan jurnal elektronik real-time dan notifikasi sistem, menghilangkan celah kasir menahan uang tunai untuk dipakai sendiri", "Memperbolehkan kasir mengambil 20% uang setoran sebagai tips", "Membuat pembukuan kantor menjadi lebih rumit dan lambat", "Meniadakan kebutuhan pengawasan oleh inspektorat", "A",
     "Virtual Account mengeliminasi kontak fisik uang tunai di loket penerimaan, mematikan modus lapping fraud (menutup utang lama dengan setoran baru)."),
    ("ANALISIS", "Analisis Kasus Pemblokiran Rekening Satker Pemerintah oleh Jurusita Pajak Daerah Akibat Sengketa PBB: Rekening Pengeluaran Satker dibekukan sepihak oleh bank atas perintah Kantor Pajak Daerah. Sikap yuridis yang wajib diambil Kemenkeu adalah:",
     "Menolak pemblokiran dan meminta pembukaan segera berdasarkan asas imunitas kas negara (Pasal 50 UU No. 1/2004) bahwa uang negara/rekening kas APBN tidak dapat disita", "Menyetujui pemblokiran dan membiarkan operasional kementerian lumpuh", "Menyerahkan seluruh gedung kantor kepada dinas pajak daerah", "Meminjam uang ke bank gelap untuk membayar gaji pegawai", "A",
     "Pasal 50 UU No. 1/2004 menegaskan asas imunitas kas negara; pihak manapun (termasuk jurusita pajak) dilarang menyita rekening kas milik negara."),
    ("ANALISIS", "Analisis Efektivitas 'Sweep Account' Otomatis pada Rekening Penyaluran Bantuan Operasional Sekolah (BOS): Mengapa sisa dana BOS yang tidak terserap di rekening sekolah ditarik otomatis ke Kas Negara di akhir batas waktu?",
     "Menjaga disiplin fiskal agar dana publik tidak mengendap sia-sia di ribuan rekening sekolah dan dialokasikan kembali secara akuntabel pada APBN tahun berikutnya", "Untuk menghukum sekolah yang berprestasi baik", "Supaya guru honorer tidak mendapatkan gaji mengajar", "Untuk membiayai renovasi gedung kementerian pendidikan", "A",
     "Sweeping otomatis sisa bansos/BOS mengamankan likuiditas kas negara dari risiko pengendapan liar dan penyelewengan di tingkat pelaksana akar rumput."),
    ("ANALISIS", "Analisis Kasus Bunga Rekening Khusus Proyek Donor yang Didebet Sepihak oleh Bank untuk Biaya Administrasi: Bank komersial memotong USD 5,000 dari rekening hibah donor untuk biaya administrasi bulanan. Langkah proteksi yang wajib dilakukan Kuasa BUN adalah:",
     "Menegur bank mitra berdasarkan PKS bahwa rekening dinas pemerintah bebas biaya administrasi bulanan dan menuntut pengembalian saldo debet secara penuh", "Membiarkan bank memotong dana hibah sampai habis", "Mengurangi jumlah pekerjaan proyek hibah di lapangan", "Menyetujui pemotongan sebagai sedekah kantor", "A",
     "PKS rekening pemerintah mewajibkan fasilitas 'zero admin fee' dan remunerasi bunga positif; pemotongan sepihak melanggar klausul PKS dan wajib direstitusi."),
    ("ANALISIS", "Analisis Risiko 'Single Point of Failure' pada Token Fisik CMS Bendahara: Token fisik CMS bendahara jatuh ke selokan air saat hujan deras dan rusak total menjelang batas akhir pembayaran gaji. Rencana kontinjensi (Business Continuity Plan) KPPN dan Bank adalah:",
     "Mengaktifkan mekanisme penerbitan token darurat bank mitra dengan verifikasi biometrik cepat dan pendaftaran ulang user key dalam 24 jam kerja", "Menunda pembayaran gaji pegawai selama 3 bulan", "Menyuruh bendahara menyelam ke selokan untuk mencari serpihan token", "Mencairkan gaji menggunakan uang tunai dari pinjaman online", "A",
     "SOP kontinjensi perbankan mitra perbendaharaan menyediakan penerbitan credential/token darurat bersertifikasi untuk menjamin kelangsungan pembayaran negara."),
    ("ANALISIS", "Analisis Peran Sistem Open API Perbankan (SNAP BI) dalam Integrasi SAKTI dengan Bank Mitra: Bagaimana standardisasi API perbankan meningkatkan keamanan transfer belanja APBN?",
     "Menyediakan enkripsi end-to-end terstandarisasi, validasi nama pemilik rekening tujuan secara otomatis sebelum transfer, dan mengeliminasi kesalahan transfer salah sasaran", "Membuat data rekening seluruh pejabat negara tersebar di internet", "Menghapus kebutuhan tanda tangan persetujuan pembayaran", "Memperlambat koneksi internet di kantor kementerian", "A",
     "Standar Nasional Open API Pembayaran (SNAP) menjamin interoperabilitas aman, verifikasi instan identitas rekening tujuan, dan memotong risiko human error."),
    ("ANALISIS", "Analisis Penanganan Rekening Gaji Pegawai yang Berstatus 'Rekening Pasif' (In-Active Payroll Account): Gaji seorang PNS gagal masuk karena rekening banknya ditutup sepihak oleh bank karena tidak pernah ada transaksi selama setahun. Mitigasi bendahara pengeluaran adalah:",
     "Menerbitkan surat pemberitahuan pemutakhiran rekening aktif, meminta SPM ralat rekening ke KPPN, dan mengedukasi pegawai atas ketentuan dormant bank", "Mengambil uang gaji pegawai tersebut untuk dibelanjakan sendiri", "Memecat pegawai bersangkutan dari status pegawai negeri", "Menghentikan seluruh pembayaran gaji pegawai lainnya di kantor", "A",
     "Kegagalan transfer gaji akibat dormant account diselesaikan via ralat rekening resmi di KPPN dan koordinasi perbankan guna pemulihan rekening dinas pegawai."),
    ("ANALISIS", "Analisis Kasus Keterlambatan Penutupan Rekening Ad-Hoc Pemilu: KPU Kabupaten belum menutup rekening operasional ad-hoc PPK/PPS selama 1 tahun pasca pemilu selesai. Dampak audit dan risiko perbendaharaannya adalah:",
     "Terjadi temuan material BPK atas rekening tak bertuan, potensi penyalahgunaan sisa bunga kas, dan sanksi pemblokiran pembukaan rekening baru pada pemilu berikutnya", "KPU otomatis mendapatkan bonus anggaran tambahan dari APBN", "Tidak ada masalah karena pemilu pasti akan diadakan lagi 5 tahun kemudian", "Rekening otomatis beralih menjadi milik kepala desa", "A",
     "Rekening badan ad-hoc wajib ditutup tuntas pasca tahapan pemilu selesai; pembiaran rekening terbuka berisiko penyelewengan dana sisa dan temuan BPK."),
    ("ANALISIS", "Analisis Keamanan Siber Rekening Pemerintah Terhadap Ancaman Malware 'Man-in-the-Middle' (MitM): Bagaimana penggunaan VPN terenkripsi khusus perbendaharaan dan sertifikat digital SSL/TLS memproteksi transfer kas negara?",
     "Mencegah intersepsi data paket perbankan di jalur internet publik sehingga nomor rekening tujuan dan nominal transfer tidak dapat diubah oleh peretas jahat", "Membuat komputer kantor menjadi lambat dan cepat panas", "Menghapus seluruh file data anggaran satker secara permanen", "Mengizinkan peretas luar negeri melihat mutasi kas negara", "A",
     "Protokol enkripsi kuat dan jaringan privat virtual (VPN) perbendaharaan mengamankan data integritas perintah transfer kas dari sabotase siber MitM."),
    ("ANALISIS", "Analisis Efektivitas 'Cash Concentration' Rekening Kementerian Luar Negeri pada Bank Perwakilan Luar Negeri: Mengapa saldo kas Kedutaan Besar RI di berbagai negara dikonsolidasikan dalam skema pooling valuta asing terpusat?",
     "Mengoptimalkan manajemen likuiditas devisa pemerintah, meminimalkan biaya konversi valuta asing ganda, dan mempermudah pengawasan Kuasa BUN Pusat", "Supaya para diplomat dapat berbelanja barang mewah bebas pajak di luar negeri", "Untuk menyembunyikan cadangan devisa dari pengawasan Bank Indonesia", "Sebagai syarat formalitas protokol hubungan diplomatik internasional", "A",
     "Pooling devisa perwakilan luar negeri menjaga efisiensi konversi mata uang asing dan visibilitas saldo kas devisa negara di seluruh dunia."),
    ("ANALISIS", "Analisis Sengketa Klaim Biaya Kliring Transaksi Rekening Pengeluaran: Bank mitra mencoba membebankan biaya fee transaksi SKNBI/RTGS sebesar Rp 50 juta kepada satker. Landasan hukum satker untuk menolak tagihan tersebut adalah:",
     "Klausul PKS antara Ditjen Perbendaharaan dan Kantor Pusat Bank Mitra menetapkan bahwa seluruh biaya transaksi pembayaran APBN dibebaskan (zero-fee) bagi satker", "Satker tidak memiliki uang kas untuk membayar tagihan bank", "Kepala satker tidak menyukai pimpinan cabang bank bersangkutan", "Undang-undang melarang bank umum mencari keuntungan", "A",
     "Perjanjian Kerja Sama Induk Kemenkeu-Bank menjamin pembebasan seluruh biaya transaksi layanan pengeluaran kas negara (zero-fee facility)."),
    ("ANALISIS", "Analisis Kasus Rekening Satker yang Digunakan untuk Menampung Uang Sumbangan Bencana dari Pihak Ketiga: Satker membuka rekening bank baru tanpa izin untuk menampung bantuan bencana gempa dari masyarakat. Tata cara perbaikan agar tidak menjadi rekening liar adalah:",
     "Segera mengajukan izin pembukaan 'Rekening Lainnya' ke KPPN/DJPb dengan melampirkan dasar bencana darurat dan menyusun laporan pertanggungjawaban khusus", "Menyimpan uang sumbangan di rumah bendahara sampai bencana selesai", "Menolak seluruh bantuan kemanusiaan yang masuk dari masyarakat", "Menghapus nomor rekening dari papan pengumuman kantor", "A",
     "Penerimaan dana darurat kemanusiaan wajib segera dilegalkan via izin Rekening Lainnya ke Kuasa BUN agar pengelolaan donasi publik transparan dan sah."),
    ("ANALISIS", "Analisis Dampak Integrasi Aplikasi SPRINT dengan Database Pusat Pelaporan dan Analisis Transaksi Keuangan (PPATK): Mengapa profiling rekening dinas pemerintah secara digital mempersempit ruang gerak pencucian uang?",
     "Mendeteksi anomali transfer masuk-keluar yang tidak sesuai pola profil satker secara otomatis (red-flagging) dan memicu audit investigatif seketika", "Membuat bendahara satker merasa tidak nyaman bekerja di kantor", "Menyebarkan data pribadi seluruh pegawai negeri ke publik", "Menaikkan tarif pajak penghasilan pejabat satker", "A",
     "Integrasi intelijen keuangan mengidentifikasi transaksi mencurigakan (suspicious financial transactions) pada rekening publik sedini mungkin."),
    ("ANALISIS", "Analisis Transformasi Menuju 'Smart Contract Escrow Accounts' pada Perbendaharaan Masa Depan: Bagaimana arsitektur escrow digital berbasis blockchain dapat menggantikan rekening penampungan akhir tahun manual?",
     "Dana otomatis terkunci dalam protokol cerdas dan baru cair ke rekanan seketika sensor IoT memverifikasi penyelesaian fisik proyek tanpa intervensi birokrasi manual", "Membuat seluruh uang negara hilang dalam jaringan internet terdesentralisasi", "Menghapuskan peran menteri keuangan dan presiden republik indonesia", "Mewajibkan rekanan bertransaksi menggunakan mata uang asing", "A",
     "Smart contract escrow menjamin eksekusi pembayaran otomatis yang tidak dapat diutak-atik (tamper-proof) begitu parameter capaian fisik tervalidasi riil.")
])

add_topic(t17, reg17, t17_items)

# ============================================================================
# TOPIC 18: Pengadaan Barang/Jasa Lanjutan, Kontrak Tahun Jamak (MYC) & Mitigasi Risiko Kegagalan Kontrak (1901 - 1950)
# ============================================================================
reg18 = "Perpres No. 16/2018 jo Perpres No. 12/2021 jo PMK No. 93/PMK.02/2020 tentang Persetujuan Kontrak Tahun Jamak (Multi-Years Contract)"
t18 = "Pengadaan Barang/Jasa Lanjutan, Kontrak Tahun Jamak (MYC) & Mitigasi Risiko Kegagalan Kontrak"

t18_items = []
# 17 MUDAH
t18_items.extend([
    ("MUDAH", "Berdasarkan PMK No. 93/PMK.02/2020, Kontrak Tahun Jamak (Multi-Years Contract / MYC) adalah kontrak pengadaan barang/jasa yang membebani DIPA:",
     "Lebih dari 1 (satu) Tahun Anggaran dan wajib mendapatkan persetujuan pejabat berwenang sebelum proses lelang dimulai", "Hanya selama 1 bulan kalender kerja", "Kurang dari 1 hari kerja dinas", "Sepanjang masa jabatan presiden yang menjabat", "A",
     "Kontrak Tahun Jamak adalah kontrak yang pelaksanaan pekerjaannya membebani lebih dari 1 tahun anggaran dengan izin persetujuan tertulis."),
    ("MUDAH", "Pejabat yang berwenang memberikan persetujuan Kontrak Tahun Jamak untuk proyek bernilai di atas Rp 100 Miliar pada Kementerian/Lembaga adalah:",
     "Menteri Keuangan Republik Indonesia", "Kepala Desa tempat lokasi proyek", "Ketua Rukun Warga (RW) setempat", "Direktur Utama bank komersial rekanan", "A",
     "Berdasarkan PMK 93/2020, persetujuan MYC untuk kontrak di atas Rp 100 Miliar merupakan kewenangan mutlak Menteri Keuangan."),
    ("MUDAH", "Untuk kontrak tahun jamak bernilai sampai dengan Rp 100 Miliar yang kegiatan dan dananya telah direncanakan sebelumnya, persetujuan dapat diberikan oleh:",
     "Menteri/Pimpinan Lembaga yang bersangkutan setelah mendapat pertimbangan teknis", "Kepala Satpam kantor satuan kerja", "Teller loket bank penerima setoran", "Rekan sesama kontraktor pengadaan", "A",
     "Menteri/Pimpinan Lembaga memiliki kewenangan menyetujui MYC bernilai sampai dengan Rp 100 Miliar sesuai kriteria yang diatur PMK."),
    ("MUDAH", "Salah satu kriteria utama pekerjaan yang dapat disetujui sebagai Kontrak Tahun Jamak (MYC) adalah:",
     "Pekerjaan yang penyelesaiannya secara teknis membutuhkan waktu lebih dari 12 bulan (seperti pembangunan waduk, jalan tol, pelabuhan, kapal perang)", "Pembelian alat tulis kantor (kertas HVS dan tinta printer)", "Pengadaan konsumsi rapat makan siang pegawai kantor", "Sewa kendaraan dinas pejabat untuk 1 hari kerja", "A",
     "Kriteria MYC mensyaratkan pekerjaan konstruksi/pengadaan kompleks yang secara teknologi/teknis mustahil diselesaikan dalam satu tahun anggaran."),
    ("MUDAH", "Klausul 'Penyesuaian Harga' (Price Escalation) pada kontrak pekerjaan konstruksi pemerintah hanya dapat diberikan untuk:",
     "Kontrak Tahun Jamak (MYC) dengan masa pelaksanaan lebih dari 18 bulan yang tata cara perhitungannya dicantumkan dalam dokumen lelang", "Kontrak pengadaan langsung bernilai Rp 5 juta", "Pengadaan makan minum rapat harian", "Kontrak pembelian sepeda motor dinas 1 unit", "A",
     "Penyesuaian harga (eskalasi) hanya diperkenankan untuk kontrak tahun jamak dengan durasi > 18 bulan berbasis formula indeks inflasi BPS."),
    ("MUDAH", "Jaminan Pelaksanaan (Performance Bond) yang diserahkan oleh penyedia barang/jasa sebelum penandatanganan kontrak bernilai sebesar:",
     "5% (lima persen) dari nilai kontrak, atau 5% dari HPS jika nilai penawaran di bawah 80% HPS", "50% dari seluruh kekayaan pemegang saham rekanan", "100% dari total nilai APBN", "Gratis tanpa jaminan apapun", "A",
     "Jaminan Pelaksanaan bernilai 5% dari nilai kontrak (atau 5% HPS bila penawaran di bawah 80% HPS) untuk menjamin pemenuhan kewajiban kontrak."),
    ("MUDAH", "Apabila penyedia mengundurkan diri setelah dinyatakan sebagai pemenang tender sebelum menandatangani kontrak, sanksi yang dijatuhkan adalah:",
     "Pencairan Jaminan Penawaran ke Kas Negara dan pengenaan sanksi Daftar Hitam (Blacklist) selama 1 tahun", "Pemberian hadiah hiburan uang tunai", "Penawaran kontrak paket lain yang lebih mahal", "Pembebasan dari seluruh kewajiban tanpa catatan", "A",
     "Pengunduran diri pemenang lelang tanpa alasan sah berakibat pencairan jaminan penawaran ke kas negara dan sanksi daftar hitam."),
    ("MUDAH", "Dalam pengadaan barang/jasa pemerintah, status 'Kontrak Kritis' pada pekerjaan konstruksi terjadi apabila:",
     "Realisasi fisik pekerjaan mengalami deviasi minus yang melampaui toleransi batas waktu terhadap target rencana kerja mingguan", "Kontraktor kehabisan kopi di barak pekerja", "Pekerja proyek menolak mendengarkan musik saat bekerja", "Konsultan pengawas lupa membawa payung saat hujan", "A",
     "Kontrak kritis adalah kondisi di mana keterlambatan fisik pekerjaan melampaui ambang batas deviasi minus (misal deviasi > 10% atau 15%)."),
    ("MUDAH", "Rapat Pembuktian Kualifikasi Keterlambatan Kontrak Kritis dikenal dalam istilah standar manajemen konstruksi sebagai:",
     "Show Cause Meeting (SCM) Tingkat I, II, dan III", "Pesta Syukuran Proyek Baru", "Rapat Anggota Tahunan Koperasi", "Sidang Tilang Pelanggaran Lalu Lintas", "A",
     "SCM (Show Cause Meeting) adalah forum pembuktian kontraktual berjenjang untuk menguji kapasitas kontraktor mengejar ketertinggalan progres."),
    ("MUDAH", "Pemberian kesempatan penyelesaian pekerjaan melewati tahun anggaran (maksimal 50 hari kalender) diatur dalam Perpres Pengadaan dengan syarat:",
     "PPK meyakini penyedia memiliki kemampuan menyelesaikan pekerjaan dan penyedia bersedia dikenai denda keterlambatan 1 permil per hari", "Penyedia menolak membayar denda apapun kepada pemerintah", "Penyedia diberikan tambahan uang muka tanpa jaminan bank", "Pekerjaan dihentikan total dan dibiarkan terbengkalai", "A",
     "PPK dapat memberikan perpanjangan 50 hari kalender jika dinilai penyedia sanggup merampungkan pekerjaan dengan pengenaan denda harian."),
    ("MUDAH", "Tindakan hukum PPK dalam hal penyedia pekerjaan konstruksi terbukti melakukan wanprestasi total dan tidak mampu menyelesaikan pekerjaan adalah:",
     "Pemutusan Kontrak sepihak, pencairan Jaminan Pelaksanaan ke Kas Negara, pengenaan sanksi Blacklist 2 tahun, dan klaim sisa uang muka", "Mengajak kontraktor berdamai dan menghapus sisa pekerjaan", "Membayar lunas seluruh nilai kontrak di awal tahun", "Menyuruh kontraktor mencari profesi pekerjaan lain", "A",
     "Wanprestasi total memicu sanksi pemutusan kontrak, sita jaminan pelaksanaan, blacklist 2 tahun, dan pengembalian sisa uang muka kas negara."),
    ("MUDAH", "Masa Pemeliharaan (Defect Liability Period) pada pekerjaan konstruksi permanen umumnya ditetapkan paling singkat selama:",
     "6 (enam) bulan terhitung sejak tanggal Serah Terima Pertama Pekerjaan (Provisional Hand Over / PHO)", "1 hari kalender kerja", "100 tahun penuh", "Tanpa masa pemeliharaan", "A",
     "Masa pemeliharaan konstruksi permanen minimal 6 bulan pasca PHO untuk memastikan kontraktor memperbaiki setiap cacat mutu."),
    ("MUDAH", "Surat Jaminan (Bank Garansi) yang digunakan dalam pengadaan barang/jasa pemerintah wajib memiliki sifat:",
     "Bersifat tanpa syarat (unconditional) dan tidak dapat ditarik kembali (irrevocable) oleh bank penerbit jaminan", "Hanya dapat dicairkan jika disetujui oleh kontraktor", "Dapat dibatalkan secara lisan kapan saja", "Berlaku hanya selama 5 menit sejak diterbitkan", "A",
     "Jaminan pengadaan wajib 'unconditional and irrevocable' agar KPPN/PPK dapat mencairkannya ke kas negara seketika tanpa halangan."),
    ("MUDAH", "Pemberian Uang Muka (Advance Payment) pada pekerjaan konstruksi skala besar dapat diberikan kepada penyedia paling tinggi sebesar:",
     "20% (dua puluh persen) dari nilai kontrak untuk usaha non-kecil, dengan menyerahkan Jaminan Uang Muka 100%", "90% dari nilai kontrak tanpa jaminan bank", "100% tunai di muka sebelum lelang dimulai", "Gratis tanpa potongan termin berikutnya", "A",
     "Uang muka non-kecil maksimal 20% nilai kontrak dan wajib dijamin 100% oleh Garansi Bank, serta dipotong proporsional pada tiap termin."),
    ("MUDAH", "Penetapan Sanksi Daftar Hitam (Blacklist) kepada penyedia barang/jasa nakal dipublikasikan secara nasional melalui portal:",
     "Inaproc / Portal Pengadaan Nasional yang dikelola oleh Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah (LKPP)", "Koran kuning kriminalitas daerah", "Grup percakapan ponsel keluarga pejabat", "Papan pengumuman di terminal bus antarkota", "A",
     "Daftar Hitam Nasional dipublikasikan transparan di portal Inaproc LKPP sehingga berlaku mengikat bagi seluruh instansi pemerintah se-Indonesia."),
    ("MUDAH", "Pekerjaan Tambah Kurang (Change Order / Contract Change Order - CCO) pada kontrak pengadaan barang/jasa dibatasi maksimal sebesar:",
     "10% (sepuluh persen) dari nilai kontrak awal dan wajib didasarkan pada justifikasi teknis yang disetujui PPK", "100% dari pagu belanja seluruh kementerian", "Tidak ada batas, boleh dinaikkan hingga seribu kali lipat", "Hanya Rp 100 saja", "A",
     "Amandemen tambah kurang (CCO) dibatasi maksimal 10% dari nilai kontrak awal dan tidak boleh mengubah substansi rancangan pokok."),
    ("MUDAH", "Dokumen Berita Acara Serah Terima Akhir Pekerjaan (Final Hand Over / FHO) ditandatangani oleh PPK dan penyedia setelah:",
     "Masa pemeliharaan selesai dan seluruh cacat mutu/kerusakan fisik telah diperbaiki tuntas oleh penyedia", "Tender pertama kali diumumkan di website", "Uang muka proyek berhasil ditransfer oleh bank", "Peletakan batu pertama oleh pejabat pimpinan", "A",
     "FHO ditandatangani setelah masa pemeliharaan berakhir tuntas dan seluruh kewajiban perbaikan cacat mutu telah dipenuhi rekanan.")
])

# 17 SEDANG
t18_items.extend([
    ("SEDANG", "Dalam permohonan persetujuan Kontrak Tahun Jamak (MYC) kepada Menteri Keuangan, dokumen telaah teknis yang wajib dilampirkan antara lain:",
     "Studi Kelayakan (Feasibility Study), Desain Teknis (DED), Analisis Dampak Lingkungan (AMDAL), Kesiapan Lahan Clean & Clear, dan Jadwal Alokasi Dana per Tahun", "Daftar menu katering pekerja proyek di lapangan", "Foto bersama seluruh keluarga staf panitia lelang", "Brosur iklan properti komersial luar negeri", "A",
     "Pengajuan MYC ke Menkeu mensyaratkan dokumen kesiapan komprehensif (FS, DED, AMDAL, pembebasan tanah tuntas, dan profil alokasi anggaran tahunan)."),
    ("SEDANG", "Perhitungan Penyesuaian Harga (Eskalasi) pada Kontrak Tahun Jamak dihitung menggunakan formula matematika perbendaharaan yang didasarkan pada:",
     "Perubahan Indeks Harga Perdagangan Besar (IHPB) komponen bahan, alat, dan upah yang diterbitkan resmi oleh Badan Pusat Statistik (BPS)", "Taksiran perasaan subjektif staf pengawas lapangan", "Kenaikan harga emas di toko perhiasan pasar tradisional", "Nilai suku bunga pinjaman rentenir swasta", "A",
     "Formula eskalasi harga kontrak resmi mengacu pada indeks BPS atas komponen biaya riil (material, peralatan, tenaga kerja) per tanggal pelaksanaan."),
    ("SEDANG", "Apabila alokasi anggaran Kontrak Tahun Jamak pada tahun anggaran kedua mengalami pemotongan (fiskal defisit APBN), langkah kontraktual yang ditempuh PPK adalah:",
     "Melakukan penyesuaian jadwal pelaksanaan (re-scheduling) atau pengurangan lingkup pekerjaan melalui adendum kontrak atas kesepakatan kedua pihak", "Membiarkan kontraktor bangkrut tanpa kepastian hukum", "Memaksa kontraktor menalangi kekurangan dana dengan uang pribadi", "Membatalkan seluruh hasil pekerjaan yang telah berdiri kokoh", "A",
     "Penurunan pagu tahunan diselesaikan melalui amandemen penyesuaian jadwal (reprofiling) atau rasionalisasi lingkup pekerjaan secara sah."),
    ("SEDANG", "Prosedur penanganan keterlambatan pada Kontrak Kritis Tahap I (SCM I) mewajibkan penyedia membuktikan kemampuannya dengan:",
     "Mencapai target kemajuan fisik uji coba (test period) yang ditetapkan dalam Berita Acara SCM I dalam jangka waktu tertentu (misal 1-2 minggu)", "Memberikan janji lisan tanpa menambah alat dan pekerja di lokasi", "Membayar uang damai kepada pimpinan satuan kerja", "Mengganti nama perusahaan kontraktor di akta notaris", "A",
     "Uji coba SCM I menuntut kontraktor mendatangkan alat berat tambahan, menambah jam kerja (lembur), dan membuktikan progres fisik riil."),
    ("SEDANG", "Dalam skema Kontrak Terintegrasi Rancang dan Bangun (Design and Build), pembagian risiko antara pemilik proyek (PPK) dan kontraktor diatur:",
     "Penyedia bertanggung jawab atas risiko kegagalan perencanaan detail sekaligus pelaksanaan konstruksi fisik sesuai standar kinerja yang ditetapkan PPK", "PPK menanggung seluruh risiko kesalahan gambar yang dibuat kontraktor", "Konsultan perencana dibebaskan dari segala tuntutan hukum", "Masyarakat sekitar diwajibkan menanggung biaya perbaikan gedung", "A",
     "Design and build mengalihkan risiko integrasi desain dan konstruksi kepada kontraktor tunggal guna menjamin efisiensi waktu dan mutu hasil."),
    ("SEDANG", "Penyitaan Jaminan Uang Muka pada saat pemutusan kontrak wanprestasi dilakukan dengan perhitungan:",
     "Sejumlah sisa uang muka yang belum dikembalikan/diperhitungkan dengan prestasi pekerjaan yang telah sah dibayarkan", "Sejumlah seluruh nilai pagu anggaran DIPA kementerian", "Dua kali lipat dari harga rumah direktur kontraktor", "Nol rupiah karena uang muka dianggap hadiah", "A",
     "Klaim jaminan uang muka dicairkan bank ke kas negara sebesar saldo sisa uang muka yang belum terlunasi pemotongan terminnya."),
    ("SEDANG", "Klausul Keadaan Kahar (Force Majeure) dalam kontrak pemerintah hanya dapat diklaim apabila memenuhi syarat hukum:",
     "Kejadian di luar kendali para pihak (gempa bumi, banjir bandang dahsyat, perang, huru-hara) yang dinyatakan secara resmi oleh instansi pemerintah berwenang", "Hujan rintik-rintik biasa di musim penghujan", "Kenaikan harga semen sebesar 1% di toko bangunan", "Karyawan kontraktor terlambat datang karena macet di jalan", "A",
     "Kahar mensyaratkan kondisi bencana/peristiwa luar biasa di luar kendali wajar yang dinyatakan resmi oleh otoritas yang berwenang."),
    ("SEDANG", "Apabila kontraktor dikenai Sanksi Daftar Hitam (Blacklist), implikasi yuridis terhadap keikutsertaannya dalam pengadaan pemerintah adalah:",
     "Dilarang mengikuti seluruh proses tender pengadaan barang/jasa di seluruh Kementerian, Lembaga, dan Pemerintah Daerah di wilayah Indonesia", "Hanya dilarang ikut tender di satu kantor satker yang mem-blacklist", "Boleh ikut tender menggunakan nama adik kandung direktur", "Dilarang makan siang di kantin kantor pemerintah", "A",
     "Blacklist berlaku secara agregat nasional di seluruh K/L/Pemda se-Indonesia melalui pangkalan data terpadu Inaproc LKPP."),
    ("SEDANG", "Keterlibatan Tim Pengawal dan Pengaman Pemerintah dan Pembangunan (TP4/Pendampingan Hukum Kejaksaan dan BPKP) dalam proyek MYC bertujuan untuk:",
     "Memberikan mitigasi risiko hukum preventif dan pengawasan tata kelola transparansi sejak perencanaan tender hingga serah terima pekerjaan", "Membela kontraktor agar kebal dari pemeriksaan korupsi", "Menghapus kewajiban pembayaran pajak rekanan", "Menentukan siapa pemenang tender sebelum lelang diumumkan", "A",
     "Pendampingan audit dan hukum preventif BPKP/Kejaksaan memastikan kepatuhan regulasi dan memitigasi penyimpangan sejak dini pada mega proyek."),
    ("SEDANG", "Ketentuan tentang pembayaran atas pekerjaan konstruksi yang diputus kontrak sebelum selesai 100% (Termination for Convenience / Default) menyatakan:",
     "Penyedia hanya berhak menerima pembayaran atas bagian pekerjaan yang nyata-nyata telah diselesaikan dan dinilai bermanfaat oleh PPK", "Penyedia berhak meminta pembayaran lunas 100% penuh", "PPK wajib menyita seluruh uang tabungan keluarga kontraktor", "Pemerintah dilarang membayar sepeserpun hasil pekerjaan yang ada", "A",
     "Pembayaran pemutusan kontrak murni berbasis 'quantum meruit' (nilai hasil fisik riil yang telah terpasang dan dapat dimanfaatkan negara)."),
    ("SEDANG", "Peran Konsultan Manajemen Konstruksi (MK) dalam memitigasi risiko kegagalan struktur pada mega proyek bendungan/gedung bertingkat adalah:",
     "Melakukan reviu desain teknis, pengujian laboratorium mutu beton/baja berkala, dan penolakan material yang tidak memenuhi spesifikasi teknis", "Mengambil uang suap dari pemasok semen oplosan", "Menghapus laporan retakan struktur dari berkas pengawasan", "Menyerahkan pengawasan proyek kepada mandor tukang bangunan", "A",
     "Konsultan MK bertindak sebagai mata dan telinga PPK untuk menjamin kepatuhan spesifikasi teknis, uji laboratorium, dan keselamatan struktur."),
    ("SEDANG", "Penerapan Sistem Manajemen Keselamatan Konstruksi (SMKK) pada proyek APBN berskala besar mewajibkan kontraktor untuk:",
     "Menyediakan anggaran khusus K3 konstruksi, alat pelindung diri (APD), ahli keselamatan kerja, dan rencana manajemen risiko kecelakaan", "Membiarkan pekerja bekerja tanpa helm pengaman di ketinggian", "Menghemat biaya dengan meniadakan jaring pengaman gedung", "Menyuruh pekerja menanggung biaya pengobatan kecelakaan kerja sendiri", "A",
     "SMKK mewajibkan kepatuhan standar K3 untuk mencegah kecelakaan fatal (zero fatal accidents) dan menjaga keselamatan jiwa pekerja proyek."),
    ("SEDANG", "Dalam hal terjadi sengketa kontrak antara PPK dan Penyedia barang/jasa, jalur penyelesaian yang diutamakan sebelum pengadilan adalah:",
     "Musyawarah mufakat, mediasi, konsiliasi, atau penyelesaian melalui Dewan Sengketa Konstruksi (Dispute Board) / Arbitrase BANI", "Aksi demonstrasi anarkis di depan gedung kantor kementerian", "Perang fisik antar kelompok pekerja dan pegawai kantor", "Penyebaran fitnah di platform media daring", "A",
     "Sengketa kontrak konstruksi modern memprioritaskan Alternative Dispute Resolution (ADR) via Dewan Sengketa atau Arbitrase untuk keputusan ahli yang cepat."),
    ("SEDANG", "Kewajiban penggunaan Produk Dalam Negeri (Tingkat Komponen Dalam Negeri - TKDN) pada kontrak pengadaan barang/jasa pemerintah mensyaratkan:",
     "Penyedia memenuhi komitmen persentase minimum TKDN yang disyaratkan dalam dokumen lelang dan diverifikasi oleh surveyor independen resmi", "Seluruh barang harus diimpor dari luar negeri tanpa kecuali", "Penyedia bebas memalsukan label buatan indonesia pada barang impor", "TKDN hanya formalitas yang boleh diabaikan begitu kontrak ditandatangani", "A",
     "Verifikasi capaian TKDN oleh surveyor independen (Sucofindo/SI) memastikan komitmen penggunaan material domestik terealisasi nyata."),
    ("SEDANG", "Mitigasi risiko likuiditas penyedia melalui fasilitas 'Supply Chain Financing' (SCF) perbankan pada kontrak pemerintah memungkinkan:",
     "Penyedia mendapatkan talangan kas jangka pendek dari bank mitra atas tagihan kontrak SPP-LS yang telah terverifikasi oleh PPK", "Kontraktor meminjam uang tanpa kewajiban mengembalikan pokok pinjaman", "PPK menaikkan nilai kontrak menjadi dua kali lipat", "Bank menyita proyek pemerintah sebelum selesai", "A",
     "SCF perbankan menyuntik likuiditas modal kerja kontraktor berbasis hak tagih tagihan yang sah, mencegah kontraktor macet di tengah jalan."),
    ("SEDANG", "Penyesuaian waktu pelaksanaan (Time Extension) pada kontrak pengadaan hanya sah diberikan oleh PPK apabila:",
     "Terdapat perubahan desain teknis atas perintah PPK, keterlambatan penyerahan lahan oleh pemerintah, atau keadaan kahar yang sah", "Kontraktor beralasan pekerja sedang malas bekerja", "Direktur kontraktor sedang sibuk mengurus bisnis pribadinya yang lain", "Sebagai hadiah ulang tahun bagi perusahaan rekanan", "A",
     "Perpanjangan waktu hanya sah jika keterlambatan bersumber dari tindakan kompensasi pemilik proyek (employer's delay) atau kahar yang terbukti."),
    ("SEDANG", "Pengujian Fungsi Beban (Commissioning Test) pada pengadaan mesin pembangkit listrik atau instalasi medis sebelum BAST bertujuan untuk:",
     "Memastikan seluruh sistem beroperasi normal pada kapasitas beban penuh sesuai spesifikasi output yang dijanjikan dalam kontrak", "Menghitung berapa banyak bahan bakar yang dapat dihabiskan dalam sehari", "Melihat apakah mesin mengeluarkan suara bising yang menghibur", "Sebagai formalitas foto bersama di depan mesin", "A",
     "Commissioning test membuktikan keandalan operasional mekanikal/elektrikal sebelum aset diserahterimakan penuh kepada negara.")
])

# 16 ANALISIS
t18_items.extend([
    ("ANALISIS", "Analisis Kasus Runtuhnya Struktur Jembatan Gantung Sebelum Serah Terima (Kegagalan Bangunan): Jembatan gantung APBN runtuh ke sungai saat uji beban akibat kontraktor mengurangi mutu baja kabel penahan. Analisis tanggung jawab hukum dan perbendaharaannya adalah:",
     "Merupakan tindak pidana korupsi mutu dan kegagalan konstruksi berat; kontraktor dan konsultan pengawas bertanggung jawab pidana, ganti rugi total, dan daftar hitam seumur hidup", "Bukan kesalahan kontraktor karena jembatan memang berat", "Cukup meminta maaf dan membangun jembatan bambu darurat", "Negara wajib membayar bonus kompensasi kepada kontraktor", "A",
     "Pengurangan spesifikasi material vital yang meruntuhkan bangunan memicu delik korupsi Pasal 7 UU Tipikor dan kewajiban ganti rugi kerugian negara penuh."),
    ("ANALISIS", "Analisis Kasus Kenaikan Harga Bahan Bakar Minyak Drastis (Lonjakan Inflasi Global) Terhadap Kelangsungan Mega Proyek MYC: Harga aspal dan solar industri melonjak 80% akibat konflik global, membuat kontraktor terancam bangkrut jika menyelesaikan proyek. Solusi regulasi pemerintah adalah:",
     "Menerbitkan kebijakan relaksasi eskalasi harga khusus berbasis regulasi Menteri Keuangan atau restrukturisasi amandemen lingkup pekerjaan yang adil (hardship clause)", "Membiarkan seluruh kontraktor infrastruktur gulung tikar dan proyek mangkrak", "Memaksa direktur kontraktor menjual ginjal pribadinya untuk modal proyek", "Menghapuskan proyek dari daftar pembangunan nasional secara sepihak", "A",
     "Pemerintah merespons guncangan inflasi makro ekstrem melalui instrumen penyesuaian regulasi eskalasi harga terukur demi menyelamatkan aset publik strategis."),
    ("ANALISIS", "Analisis Sengketa Klaim Pembayaran Pekerjaan Tambah (CCO) yang Dilakukan Tanpa Adendum Tertulis: Kontraktor menambah panjang saluran drainase 200 meter atas perintah lisan kepala dinas tanpa adendum kontrak resmi, lalu menuntut bayaran Rp 400 juta. Kedudukan PPK menurut regulasi adalah:",
     "Menolak pembayaran karena tidak ada perikatan tertulis yang sah mendahului pekerjaan; pembayaran tanpa dasar adendum kontrak melanggar hukum perbendaharaan", "Langsung membayar Rp 400 juta dari uang kas brankas kantor", "Menyuruh warga desa patungan membayar kontraktor", "Mengajukan pinjaman ke bank gelap untuk membayar saluran", "A",
     "Setiap perubahan volume/biaya wajib dituangkan dalam adendum kontrak sah sebelum dikerjakan; perintah lisan tidak mengikat keuangan negara."),
    ("ANALISIS", "Analisis Kasus Kegagalan Pembebasan Lahan pada Proyek Multi-Years Contract: Dari 50 km rencana jalan tol MYC, 10 km lahan masih diblokir warga karena sengketa ganti rugi hingga tahun kedua. Tindakan mitigasi PPK dan KPA adalah:",
     "Menitipkan uang ganti kerugian ke Pengadilan Negeri setempat (konsinyasi) sesuai UU Pengadaan Tanah dan mereprofiling jadwal kerja kontraktor ke segmen yang telah bebas", "Menyerang warga dengan kekerasan fisik senjata", "Menghentikan seluruh pembangunan jalan tol di seluruh indonesia", "Menyerahkan uang ganti rugi kepada calo tanah tanpa sertifikat", "A",
     "Mekanisme konsinyasi pengadilan menyelesaikan kebuntuan ganti rugi tanah secara legal sementara kontraktor mengoptimalkan pekerjaan pada segmen tanah bebas."),
    ("ANALISIS", "Analisis Moral Hazard Penggunaan Sub-Kontraktor Ilegal (Menjual Proyek): Kontraktor pemenang lelang menyerahkan 100% pelaksanaan pekerjaan utama kepada perusahaan lain dengan mengambil komisi perantara 15% (subkontrak ilegal). Sanksi hukum yang wajib dijatuhkan PPK adalah:",
     "Memutus kontrak sepihak, menyita Jaminan Pelaksanaan, mengenakan sanksi Blacklist 2 tahun kepada pemenang lelang, dan tidak mengakui subkontraktor ilegal", "Memuji kepandaian kontraktor dalam berbisnis perantara", "Menaikkan nilai kontrak sebesar 15% untuk mengganti biaya komisi", "Mengangkat direktur kontraktor menjadi penasihat kementerian", "A",
     "Pengalihan seluruh pekerjaan utama kepada pihak ketiga (menjual proyek) melanggar prinsip pengadaan; wajib diputus kontrak dan dikenai sanksi hitam."),
    ("ANALISIS", "Analisis Mitigasi Risiko 'Bid Rigging' (Persekongkolan Tender) pada Pengadaan Skala Besar: Pokja Pemilihan menemukan 3 peserta lelang menyampaikan dokumen penawaran dari alamat IP yang sama, kesalahan pengetikan yang identik, dan jaminan bank dari cabang yang sama. Tindakan Pokja adalah:",
     "Menyatakan tender gagal, menggugurkan seluruh peserta yang bersekongkol, mengenakan sanksi Blacklist, dan melaporkan ke Komisi Pengawas Persaingan Usaha (KPPU)", "Memilih salah satu dari ketiga peserta sebagai pemenang lelang", "Membagi proyek menjadi tiga bagian sama rata", "Mendiamkan persekongkolan karena lelang berjalan lancar", "A",
     "Indikasi kesamaan IP, metadata dokumen, dan kolusi penawaran membuktikan persekongkolan tender horisontal; tender digagalkan dan peserta diblacklist serta dilaporkan ke KPPU."),
    ("ANALISIS", "Analisis Kasus Pembayaran Uang Muka yang Disalahgunakan Kontraktor untuk Proyek Lain: Kontraktor mencairkan uang muka Rp 10 miliar untuk proyek rumah sakit, namun uang tersebut digunakan untuk melunasi utang proyek di tempat lain sehingga proyek rumah sakit terlantar. Respon hukum PPK adalah:",
     "Mencairkan Jaminan Uang Muka 100% ke Kas Negara melalui bank penerbit garansi, memutus kontrak, dan melaporkan tindak pidana penipuan/penggelapan ke kepolisian", "Menunggu dengan sabar sampai kontraktor mendapatkan uang dari tempat lain", "Memberikan pinjaman tambahan Rp 10 miliar lagi dari kas negara", "Menghapus proyek rumah sakit dari rencana kementerian", "A",
     "Penyalahgunaan uang muka memicu eksekusi seketika garansi bank jaminan uang muka dan tuntutan pidana penggelapan aset finansial negara."),
    ("ANALISIS", "Analisis Peran 'Independent Oversight Consultant' pada Proyek Infrastruktur Berskala Triliunan: Mengapa Kementerian Keuangan mensyaratkan adanya pengawas independen selain konsultan pengawas reguler pada proyek SBSN mega-infrastruktur?",
     "Untuk memberikan jaminan mutu independen lapis kedua (second opinion), memverifikasi kebenaran progres fisik secara objektif, dan mencegah kolusi antara kontraktor dan konsultan lokal", "Supaya banyak konsultan asing dapat berlibur di indonesia", "Untuk menghabiskan anggaran belanja konsultan satker", "Sebagai formalitas tanpa laporan tertulis apapun", "A",
     "Pengawasan independen pihak ketiga mencegah konflik kepentingan dan mengawal kualitas teknis serta keselarasan pencairan dana sukuk publik."),
    ("ANALISIS", "Analisis Kasus Keterlambatan Serah Terima Kapal Patroli Akibat Embargo Suku Cadang Luar Negeri: Galangan kapal dalam negeri terlambat menyelesaikan kapal militer karena mesin diesel dari negara Eropa terkena embargo senjata. Analisis klausul kahar atau kompensasi kontrak adalah:",
     "Jika embargo merupakan tindakan sepihak pemerintah luar negeri yang di luar kendali wajar penyedia, peristiwa tersebut dikategorikan Keadaan Kahar / Kompensasi dengan pemberian perpanjangan waktu tanpa denda", "Kontraktor wajib dihukum penjara seumur hidup karena gagal membeli mesin", "PPK langsung membakar kapal yang belum jadi", "Penyedia dipaksa membuat mesin diesel sendiri dengan tangan", "A",
     "Embargo geopolitik tak terduga memenuhi unsur keadaan kahar/kejadian di luar kemampuan kendali para pihak, membenarkan perpanjangan jadwal tanpa sanksi denda."),
    ("ANALISIS", "Analisis Efektivitas 'Building Information Modelling' (BIM) dalam Pengawasan Kontrak Konstruksi Modern: Bagaimana implementasi teknologi BIM level 7D memitigasi risiko pembengkakan biaya (cost overrun)?",
     "Mendeteksi benturan desain (clash detection) secara digital sebelum konstruksi fisik dimulai, menyinkronkan volume bahan secara presisi, dan memantau biaya pemeliharaan siklus hidup gedung", "Membuat gambar gedung menjadi lukisan seni abstrak", "Menggantikan seluruh tenaga kerja kuli bangunan dengan animasi kartun", "Menghapus kebutuhan pengawasan oleh konsultan teknik", "A",
     "BIM mendeteksi kesalahan benturan pipa-struktur sedini mungkin di model digital, mengeliminasi pekerjaan bongkar-pasang yang memicu cost-overrun di lapangan."),
    ("ANALISIS", "Analisis Kasus Jaminan Pemeliharaan yang Habis Masa Berlakunya Sebelum Audit Akhir Selesai: Kontraktor menolak memperpanjang Bank Garansi Pemeliharaan saat audit fisik BPK masih berlangsung dan ditemukan retakan jembatan. Sikap yuridis PPK adalah:",
     "Sebelum masa berlaku garansi berakhir, PPK wajib mengajukan klaim pencairan jaminan pemeliharaan ke bank jika kontraktor menolak memperpanjang jaminan atau menolak memperbaiki kerusakan", "Membiarkan masa garansi kedaluwarsa sehingga negara menanggung biaya perbaikan sendiri", "Mengemis kepada kontraktor agar berbaik hati memperbaiki jembatan", "Menutup jembatan untuk umum selamanya", "A",
     "PPK wajib mengantisipasi masa kedaluwarsa garansi bank; jika perbaikan belum tuntas atau audit berlangsung, jaminan dicairkan sebelum expired."),
    ("ANALISIS", "Analisis Penanganan Pekerjaan Peninggalan Kontraktor Pailit (Tender Ulang Sisa Pekerjaan): Kontraktor putus kontrak di progres 65%. Bagaimana PPK menyusun HPS dan dokumen lelang untuk menenderkan sisa 35% pekerjaan?",
     "Melakukan inventarisasi dan audit teknis bersama ahli independen untuk menetapkan volume pekerjaan yang benar-benar tersisa, serta menyusun HPS baru berbasis harga pasar terkini", "Menunjuk sembarang tukang bangunan untuk meneruskan sisa pekerjaan tanpa kontrak", "Membayar kontraktor baru dengan harga yang sama persis dengan kontrak lama", "Membiarkan bangunan terbengkalai tanpa dilanjutkan", "A",
     "Tender kelanjutan pekerjaan konstruksi mangkrak memerlukan audit cut-off progres fisik riil untuk menentukan baseline HPS sisa pekerjaan secara presisi."),
    ("ANALISIS", "Analisis Kasus Penyedia Menolak Menandatangani Adendum Penyesuaian Harga Turun: Akibat penurunan harga minyak bumi dunia, indeks eskalasi menghasilkan nilai negatif (de-eskalasi harga) sehingga nilai kontrak seharusnya turun Rp 2 miliar, namun penyedia menolak. Langkah PPK adalah:",
     "Menerapkan penyesuaian harga turun secara sepihak sesuai formula dokumen kontrak yang mengikat dan memotong nilai pembayaran pada termin berikutnya", "Mengalah pada penyedia dan tetap membayar dengan harga lama yang mahal", "Memberikan bonus tambahan kepada penyedia", "Membatalkan seluruh klausul formula eskalasi di kontrak", "A",
     "Klausul eskalasi bersifat dua arah (bisa naik bisa turun); PPK berhak mengeksekusi de-eskalasi negatif secara kontraktual pada saat penerbitan SPP-LS."),
    ("ANALISIS", "Analisis Pengaruh Sertifikasi Ahli Pengadaan (PBJ Level 1 / Kompetensi) Terhadap Kualitas Dokumen Kontrak: Mengapa penyusunan Spesifikasi Teknis dan Kerangka Acuan Kerja (KAK) oleh PPK tersertifikasi meminimalisasi adendum kontrak bermasalah?",
     "Karena menghasilkan dokumen pengadaan yang berbasis kinerja (output-based), memuat kriteria penerimaan yang terukur, dan memitigasi ambiguitas penafsiran antara pemilik dan penyedia", "Supaya PPK dapat memamerkan sertifikat di ruang tamu", "Untuk memperlambat proses pengadaan barang dan jasa", "Agar kontraktor tidak berani mengajukan penawaran harga", "A",
     "Spesifikasi teknis yang matang dan terukur mencegah deviasi persepsi lapangan, mengurangi potensi sengketa klaim variasi pekerjaan (CCO)."),
    ("ANALISIS", "Analisis Mitigasi Risiko 'Over-Design' oleh Konsultan Perencana yang Memboroskan Anggaran APBN: Konsultan perencana mendesain gedung kantor standar kabupaten dengan fondasi super-mewah setara gedung pencakar langit 100 lantai yang tidak perlu. Instrumen pengendalian PPK adalah:",
     "Menerapkan evaluasi 'Value Engineering' (VE) bersama tim ahli teknik untuk mengeliminasi pemborosan desain berlebih tanpa mengurangi standar keselamatan dan fungsi gedung", "Menerima desain tersebut agar gedung terlihat megah di mata dunia", "Membayar biaya perencanaan dua kali lipat lebih mahal", "Menghentikan seluruh pembangunan kantor pemerintah", "A",
     "Value Engineering menyisir desain berlebih (over-design) untuk mencapai efisiensi biaya optimal (value for money) tanpa mengorbankan integritas struktural."),
    ("ANALISIS", "Analisis Penerapan Klausul 'Dispute Avoidance and Adjudication Board' (DAAB) Standar FIDIC pada Kontrak Konstruksi Internasional Pemerintah: Bagaimana kehadiran dewan sengketa di lokasi proyek mencegah berhentinya pekerjaan fisik?",
     "DAAB memantau proyek secara berkala sejak hari pertama dan memberikan rekomendasi/keputusan mengikat sementara atas sengketa teknis harian sehingga proyek tetap jalan tanpa menunggu putusan pengadilan", "DAAB berhak membatalkan undang-undang keuangan negara", "DAAB menggantikan seluruh tugas para insinyur proyek", "DAAB memaksa pemerintah meminjam dana dari bank internasional", "A",
     "Dewan sengketa (DAAB) menyelesaikan perselisihan teknis seketika di lapangan (real-time dispute resolution), mencegah penghentian pekerjaan fisik konstruksi.")
])

add_topic(t18, reg18, t18_items)

# Save intermediate json for topic 17 and 18
with open("scripts/p4_topics17_18.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)
print("Topic 17 & 18 successfully written!")
