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
cur_num = 1651

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
# TOPIC 13: Perencanaan Kas, RPD Harian & Cash Forecasting Modern (1651 - 1700)
# ============================================================================
reg13 = "PMK No. 197/PMK.05/2017 tentang Rencana Penarikan Dana, Rencana Penerimaan Dana, dan Perencanaan Kas jo Perdirjen Perbendaharaan"
t13 = "Perencanaan Kas, RPD Harian & Cash Forecasting Modern"

t13_items = []
# 17 MUDAH
t13_items.extend([
    ("MUDAH", "Berdasarkan PMK No. 197/PMK.05/2017, instrumen utama yang wajib disampaikan oleh Satker kepada KPPN untuk memproyeksikan kebutuhan likuiditas kas negara harian adalah:",
     "Rencana Penarikan Dana (RPD) Harian", "Kartu Pengawasan Kredit Pegawai", "Kwitansi Tanda Pembayaran Sementara", "Buku Kas Pembantu Pajak", "A",
     "RPD Harian adalah rencana penarikan kebutuhan kas harian yang disampaikan satker ke KPPN sebagai dasar penyediaan likuiditas kas BUN."),
    ("MUDAH", "Tujuan utama pengelolaan kas negara modern (Modern Treasury Cash Management) oleh Bendahara Umum Negara (BUN) adalah:",
     "Memastikan ketersediaan likuiditas pada saat dibutuhkan dengan biaya seminimal mungkin dan meniadakan dana menganggur (idle cash)", "Menimbun uang tunai sebanyak mungkin di brankas kantor tanpa diinvestasikan", "Membiarkan kas negara mengalami defisit likuiditas setiap awal pekan", "Membagikan uang tunai kepada masyarakat secara acak", "A",
     "Cash management modern bertujuan: 'minimizing cost of fund, maximizing yield on idle cash, and ensuring cash availability at the right time'."),
    ("MUDAH", "Batas nilai nominal penarikan dana SPM-LS yang mewajibkan satker menyampaikan RPD Harian Tingkat Satker ke KPPN sesuai ketentuan umum perbendaharaan adalah:",
     "Transaksi pembayaran dengan nilai nominal Rp 1 Miliar ke atas (atau sesuai ambang batas klasifikasi A/B/C)", "Transaksi pembayaran mulai dari Rp 10.000", "Hanya pembayaran di atas Rp 10 Triliun", "Semua jenis pembayaran tanpa batas nilai nominal", "A",
     "Penyampaian RPD Harian diwajibkan untuk SPM bernilai besar (kategori klasifikasi A, B, C mulai dari Rp 1 miliar ke atas) sesuai PMK 197/PMK.05/2017."),
    ("MUDAH", "Jangka waktu penyampaian RPD Harian untuk kategori penarikan dana bernilai sangat besar (misalnya di atas Rp 1 Triliun) umumnya diatur paling lambat:",
     "15 hari kerja sebelum SPM diajukan ke KPPN", "5 menit sebelum loket KPPN ditutup", "Satu hari setelah SP2D diterbitkan bank", "Tidak perlu menyampaikan jika kenal dengan pimpinan KPPN", "A",
     "Penarikan dana bernilai jumbo (skala ratusan miliar hingga triliunan) membutuhkan waktu pemberitahuan awal lebih panjang (5 hingga 15 hari kerja) agar BUN dapat menyiapkan likuiditas."),
    ("MUDAH", "Treasury Single Account (TSA) yang diterapkan Kementerian Keuangan Republik Indonesia memiliki prinsip dasar:",
     "Seluruh saldo kas pemerintah terkonsolidasi dalam satu rekening terpadu di Bank Indonesia untuk pengelolaan likuiditas terpusat", "Setiap pegawai negeri memiliki satu rekening tabungan pribadi tanpa pajak", "Semua kementerian menyimpan kas negara di brankas besi masing-masing", "Rekening kas negara disebarkan ke ratusan bank swasta tanpa pengawasan", "A",
     "Prinsip TSA mengkonsolidasikan seluruh penerimaan dan pengeluaran kas negara ke dalam rekening tunggal BUN di Bank Sentral."),
    ("MUDAH", "Dampak negatif dari penarikan dana kas negara dalam jumlah masif tanpa pemberitahuan RPD Harian adalah:",
     "Dapat memicu guncangan likuiditas pada kas BUN dan volatilitas suku bunga pasar uang antar bank", "Membuat pegawai bank menjadi lebih bersemangat bekerja lembur", "Meningkatkan cadangan devisa negara secara tiba-tiba", "Menurunkan harga beras di pasar tradisional secara instan", "A",
     "Penarikan dana jumbo mendadak tanpa RPD memaksa BUN mencari likuiditas darurat berbiaya tinggi dan mengganggu stabilitas pasar uang domestik."),
    ("MUDAH", "Dalam aplikasi SAKTI, modul yang digunakan untuk merekam dan memutakhirkan jadwal Rencana Penarikan Dana Harian adalah:",
     "Modul Pembayaran (submodul RPD Harian)", "Modul Aset Tetap", "Modul Piutang Lancar", "Modul Konfirmasi Faktur Pajak", "A",
     "Perekaman dan pemutakhiran jadwal jatuh tempo RPD Harian di SAKTI diproses melalui Modul Pembayaran."),
    ("MUDAH", "Konsep 'Idle Cash' dalam manajemen kas perbendaharaan merujuk pada:",
     "Saldo uang kas pemerintah yang mengendap tanpa menghasilkan imbal hasil dan tidak segera digunakan untuk belanja produktif", "Uang kas palsu yang beredar di masyarakat", "Uang saku perjalanan dinas yang habis terpakai", "Gaji pegawai yang dipotong untuk iuran pensiun", "A",
     "Idle cash adalah dana pemerintah yang menganggur di rekening tanpa optimalisasi imbal hasil atau tanpa kepastian jadwal belanja."),
    ("MUDAH", "Instrumen penempatan kas negara untuk optimalisasi saldo kas menganggur (idle cash) jangka pendek oleh Ditjen Perbendaharaan meliputi:",
     "Penempatan kas pada Bank Indonesia (Reverse Repo) dan deposito pasar uang pada bank umum terpercaya", "Pembelian koin kripto yang sedang viral", "Pinjaman tanpa bunga kepada perusahaan rintisan daring", "Penyimpanan uang tunai di bawah kasur kantor", "A",
     "Kemenkeu mengoptimalkan idle cash melalui penempatan di instrumen berisiko rendah seperti Reverse Repo BI dan penempatan deposito bank mitra."),
    ("MUDAH", "Apabila Satker mengajukan SPM bernilai besar ke KPPN tanpa didahului penyampaian RPD Harian atau tidak sesuai jadwal RPD, tindakan KPPN adalah:",
     "Menolak atau menunda proses penerbitan SP2D sampai jatuh tempo RPD yang sah terpenuhi", "Langsung membakar berkas SPM di hadapan pengantar", "Mencairkan dana dua kali lipat sebagai kompensasi", "Mengalihkan pencairan dana ke rekening kepala satker pribadi", "A",
     "KPPN menerapkan kontrol sistem berupa penolakan atau penundaan tanggal jatuh tempo SP2D jika SPM tidak sesuai jadwal RPD yang telah didaftarkan."),
    ("MUDAH", "Peramalan Kas (Cash Forecasting) tingkat Kuasa BUN Pusat dilakukan untuk memproyeksikan arus kas masuk dan keluar dalam horizon waktu:",
     "Harian, mingguan, bulanan, hingga tahunan", "Setiap satu abad sekali", "Hanya untuk 10 menit ke depan", "Hanya pada hari libur nasional", "A",
     "Cash forecasting BUN memproyeksikan arus kas secara berjenjang dari horizon harian (tactical) hingga tahunan (strategic)."),
    ("MUDAH", "Deviasi antara RPD Harian yang disampaikan satker dengan realisasi SPM aktual berpengaruh langsung terhadap:",
     "Penilaian Indikator Kinerja Pelaksanaan Anggaran (IKPA) satker pada indikator Deviasi RPD Harian", "Kenaikan pangkat otomatis seluruh pegawai satker", "Jumlah cuti tahunan pejabat perbendaharaan", "Besaran tunjangan kinerja menteri teknis", "A",
     "Ketepatan dan akurasi RPD satker dinilai secara kuantitatif dalam komponen indikator IKPA Perbendaharaan."),
    ("MUDAH", "Rekening Kas Umum Negara (RKUN) berlokasi di:",
     "Bank Indonesia sebagai bank sentral Republik Indonesia", "Bank perkreditan rakyat di tingkat kecamatan", "Lembaga pegadaian swasta nasional", "Koperasi simpan pinjam desa", "A",
     "RKUN adalah rekening tempat penyimpanan uang negara yang dibuka oleh Menteri Keuangan di Bank Indonesia."),
    ("MUDAH", "Pemberitahuan perubahan (pemutakhiran) RPD Harian oleh Satker ke KPPN dapat dilakukan dengan ketentuan:",
     "Diajukan sebelum batas waktu cut-off pemutakhiran sesuai jenjang klasifikasi nominal penarikan dana", "Boleh diubah secara lisan setelah uang ditransfer bank", "Dilarang diubah sama sekali dalam kondisi apapun", "Hanya boleh diubah oleh presiden secara langsung", "A",
     "Pemutakhiran data RPD dapat dilakukan satker dengan mematuhi batas waktu (cut-off) perubahan sebelum SPM diajukan."),
    ("MUDAH", "Prinsip 'Just-In-Time' (JIT) dalam sistem pencairan dana perbendaharaan berarti:",
     "Dana kas negara disalurkan ke rekening penerima tepat pada saat kewajiban pembayaran jatuh tempo untuk meminimalkan penumpukan kas", "Dana dicairkan berbulan-bulan sebelum pekerjaan dimulai dan disimpan di brankas", "Dana dibayarkan setahun setelah pekerjaan selesai tanpa kompensasi", "Dana ditarik sekaligus di awal tahun anggaran tanpa rencana belanja", "A",
     "Prinsip JIT menjamin dana tersedia tepat waktu saat tagihan jatuh tempo tanpa membiarkan kas mengendap terlalu lama."),
    ("MUDAH", "Rencana Penerimaan Dana (Revenue Forecasting) oleh satker pemungut PNBP diperlukan BUN untuk:",
     "Mengantisipasi pasokan likuiditas kas masuk yang akan mengimbangi kebutuhan belanja kas keluar", "Menentukan jumlah sumbangan sukarela pegawai satker", "Membeli cinderamata bagi tamu kenegaraan", "Memotong otomatis saldo tabungan nasabah bank umum", "A",
     "Proyeksi penerimaan dana membantu BUN menghitung 'net cash position' harian dalam rangka menjaga keseimbangan likuiditas kas negara."),
    ("MUDAH", "Sistem elektronik yang mengintegrasikan penyampaian RPD satker dengan jadwal pencairan SP2D KPPN secara otomatis adalah:",
     "Sistem Aplikasi Keuangan Tingkat Instansi (SAKTI) dan SPAN (Sistem Perbendaharaan dan Anggaran Negara)", "Aplikasi pesan singkat media sosial gratis", "Surel manual tanpa tanda tangan elektronik", "Papan pengumuman kayu di lobi kantor", "A",
     "Integrasi antara SAKTI satker dan SPAN KPPN memastikan validasi otomatis antara RPD Harian terdaftar dan SPM yang masuk.")
])

# 17 SEDANG
t13_items.extend([
    ("SEDANG", "Klasifikasi RPD Harian dibagi dalam beberapa kategori nominal (misalnya Tipe A > Rp 500 Miliar, Tipe B Rp 100 M - Rp 500 M, Tipe C Rp 5 M - Rp 100 M). Alasan pembagian zona waktu jatuh tempo bertingkat ini adalah:",
     "Semakin besar nominal penarikan dana, semakin besar dampak terhadap likuiditas BUN sehingga membutuhkan lead time persiapan kas yang lebih panjang", "Untuk mempersulit satker kecil agar tidak sering berbelanja", "Untuk memungut biaya administrasi pendaftaran RPD yang lebih tinggi", "Sebagai formalitas tanpa dasar pertimbangan manajemen kas", "A",
     "Skala penarikan berjenjang memberikan kepastian waktu bagi BUN untuk merencanakan sumber pendanaan (financing mix) tanpa tekanan likuiditas mendadak."),
    ("SEDANG", "Apabila Satker terlambat mengajukan SPM pada tanggal yang telah ditetapkan dalam RPD Harian (misal RPD jatuh tempo tanggal 10, namun SPM baru masuk tanggal 14), akibat hukum dan administrasinya adalah:",
     "RPD kedaluwarsa (expired), SPM ditolak oleh sistem SPAN/KPPN, dan satker wajib memutakhirkan kembali RPD dengan jeda waktu baru", "KPPN otomatis menerbitkan SP2D secara paksa ke rekening rekanan", "Satker dikenai denda uang tunai Rp 100 juta per hari", "Seluruh anggaran satker disita oleh KPPN", "A",
     "SPM yang diajukan melewati tanggal RPD yang telah didaftarkan akan tertolak oleh sistem validasi SPAN karena ketidaksesuaian jadwal likuiditas."),
    ("SEDANG", "Dalam peramalan kas modern, model kuantitatif yang mengkombinasikan pola historis musiman (seasonal trend) belanja K/L dengan data anomali hari libur nasional bertujuan untuk:",
     "Meningkatkan akurasi proyeksi saldo kas harian RKUN sehingga penempatan investasi jangka pendek (reverse repo) menghasilkan imbal hasil optimal", "Menghitung jumlah lembar uang kertas yang harus dicetak oleh Perum Peruri", "Memperkirakan cuaca hujan di kantor pusat Kementerian Keuangan", "Menghindari audit Badan Pemeriksa Keuangan", "A",
     "Model peramalan berbasis data historis dan tren kalender memperkecil error deviasi proyeksi kas harian BUN."),
    ("SEDANG", "Pengelolaan Rekening Sub-RKUN di Bank Indonesia oleh Kuasa BUN Pusat bertujuan untuk:",
     "Memisahkan aliran kas peruntukan khusus (seperti sub-rekening gaji, sub-rekening SBSN, dan sub-rekening operasional) dalam kerangka arsitektur TSA tunggal", "Menyembunyikan dana kas negara dari pantauan publik", "Memberikan fasilitas kartu kredit tanpa batas bagi pejabat eselon I", "Membuka kantor cabang Kemenkeu di luar negeri", "A",
     "Sub-RKUN merupakan bagian integral TSA yang memfasilitasi segmentasi transaksi operasional perbendaharaan tanpa memecah konsolidasi kas."),
    ("SEDANG", "Ketika terjadi pengetatan likuiditas kas negara (cash constraint) akibat perlambatan penerimaan pajak triwulanan, strategi Cash Rationing yang dilakukan BUN adalah:",
     "Memprioritaskan pencairan belanja mengikat (gaji, subsidi pangan/energi, kewajiban utang) dan menjadwal ulang belanja diskresioner/barang non-prioritas", "Menghentikan seluruh operasional rumah sakit dan puskesmas", "Menutup kantor KPPN di seluruh Indonesia selama 3 bulan", "Mencetak uang kertas baru tanpa persetujuan undang-undang", "A",
     "Cash rationing memprioritaskan belanja 'mandatory spending' dan 'fixed obligations' dengan merelaksasi jadwal belanja barang dan modal diskresioner."),
    ("SEDANG", "Kompensasi atau renumerasi saldo kas pemerintah (interest on government deposits) yang ditempatkan pada Bank Indonesia diatur dengan mekanisme:",
     "Pemberian remunerasi bunga oleh Bank Indonesia kepada RKUN berdasarkan formula suku bunga acuan pasar uang yang disepakati", "Bank Indonesia membebankan denda bunga negatif kepada pemerintah", "BI menyita 50% dari total saldo simpanan pemerintah", "Remunerasi diserahkan dalam bentuk emas batangan fisik ke kantor menteri", "A",
     "BI memberikan remunerasi atas saldo kas pemerintah di RKUN yang dihitung berdasarkan formula suku bunga kesepakatan Kemenkeu dan BI."),
    ("SEDANG", "Ketentuan dispensasi RPD Harian dapat diberikan oleh Kepala KPPN kepada Satker hanya dalam kondisi darurat, antara lain:",
     "Bencana alam, penanganan wabah penyakit darurat, pembayaran putusan pengadilan inkracht yang mendesak, atau kegiatan strategis presiden", "KPA lupa mengajukan SPM karena pergi berlibur ke luar kota", "Staf keuangan satker terlambat bangun pagi", "Rekanan menuntut uang muka untuk membeli mobil mewah baru", "A",
     "Dispensasi RPD hanya diberikan atas dasar keadaan darurat yang sah (force majeure, bencana, putusan mendesak) dengan persetujuan Kepala KPPN/Kanwil."),
    ("SEDANG", "Peran Artificial Intelligence dan Machine Learning dalam cash forecasting Ditjen Perbendaharaan era digital adalah:",
     "Menganalisis jutaan transaksi historis SP2D satker untuk memprediksi pola penyerapan riil harian secara otomatis dan mendeteksi anomali penarikan", "Menggantikan peran Presiden dalam menetapkan APBN", "Menghapus utang luar negeri secara otomatis dari basis data", "Mengirimkan pesan promosi belanja ke ponsel masyarakat", "A",
     "Teknologi machine learning membaca pola musiman dan karakteristik perilaku belanja tiap satker untuk menghasilkan proyeksi kas harian presisi tinggi."),
    ("SEDANG", "Dalam konsep Cash Flow Mismatch, risiko utama yang dihadapi pengelola kas negara adalah:",
     "Ketidaksesuaian waktu antara arus masuk penerimaan pajak/PNBP dengan waktu puncak pengeluaran belanja negara (misal belanja membengkak di akhir tahun)", "Selisih kurs mata uang rupiah terhadap koin kripto swasta", "Perbedaan jumlah hari dalam kalender masehi dan hijriah", "Kehilangan kuitansi belanja makan siang rapat", "A",
     "Mismatch terjadi saat penerimaan menumpuk di waktu tertentu sementara belanja melonjak di waktu lain, memerlukan instrumen pembiayaan jangka pendek."),
    ("SEDANG", "Penggunaan instrumen Surat Perbendaharaan Negara (SPN) tenor pendek (kurang dari 12 bulan) oleh pemerintah berfungsi sebagai:",
     "Instrumen pengelolaan likuiditas kas jangka pendek (cash management bills) untuk menutup defisit kas musiman dalam tahun anggaran berjalan", "Alat pembayaran gaji pokok bulanan guru sekolah dasar", "Surat bukti kepemilikan tanah gedung balai diklat", "Jaminan pinjaman kredit usaha rakyat bagi satker", "A",
     "SPN / Treasury Bills digunakan pemerintah untuk menutup kebutuhan likuiditas kas jangka pendek dan memperdalam pasar uang negara."),
    ("SEDANG", "Integrasi sistem SAKTI dengan Bank Indonesia Real Time Gross Settlement (BI-RTGS) dan SKNBI melalui SPAN memungkinkan:",
     "Penyelesaian pembayaran SP2D bernilai di atas Rp 1 Miliar berlangsung seketika secara elektronik ke rekening penyedia di bank mitra", "Pencairan uang tunai di kantor KPPN tanpa melalui rekening bank", "Pengiriman uang tunai menggunakan kurir bersepeda motor", "Pembayaran gaji PNS menggunakan valuta asing yen Jepang", "A",
     "SPAN terhubung langsung dengan BI-RTGS untuk setelmen transaksi bernilai besar secara aman, instan, dan terdokumentasi elektronik."),
    ("SEDANG", "Indikator deviasi Hal III DIPA dalam IKPA memiliki kaitan konseptual erat dengan RPD Harian karena:",
     "Hal III DIPA mencerminkan rencana penarikan bulanan, sedangkan RPD Harian merupakan operasionalisasi taktikal penarikan kas pada hari pelaksanaan", "Keduanya sama sekali tidak memiliki hubungan dalam tata kelola anggaran", "Deviasi Hal III DIPA hanya berlaku untuk belanja pegawai saja", "RPD Harian dibuat tanpa perlu melihat pagu dan jadwal DIPA", "A",
     "Hal III DIPA menetapkan baseline distribusi kas bulanan, dan RPD Harian mengeksekusi penarikan kas harian secara disiplin."),
    ("SEDANG", "Kebijakan Treasury Dealing Room (TDR) pada Ditjen Perbendaharaan bertugas melaksanakan:",
     "Aktivitas transaksi penempatan dana kas negara dan optimalisasi imbal hasil investasi jangka pendek di pasar uang dengan mitigasi risiko", "Ruang tempat istirahat dan makan siang para bendahara kementerian", "Loket pelayanan pengaduan masyarakat atas pungutan liar", "Ruang sidang penjatuhan sanksi disiplin pegawai", "A",
     "TDR adalah unit transaksi modern di DJPb yang mengelola penempatan kelebihan kas negara (investasi jangka pendek) secara profesional."),
    ("SEDANG", "Analisis 'Cash Buffer' (Saldo Kas Minimum) yang ditetapkan oleh BUN bertujuan untuk:",
     "Menjaga batas aman likuiditas harian kas negara guna mengantisipasi pengeluaran tak terduga tanpa harus menerbitkan utang darurat berbiaya mahal", "Menyediakan uang bonus akhir tahun bagi pengelola keuangan", "Menjamin keuntungan bagi bank-bank swasta asing", "Menghabiskan pagu belanja modal satker secepatnya", "A",
     "Cash buffer adalah saldo cadangan likuiditas minimum di RKUN untuk menyerap ketidakpastian arus kas harian tanpa mengganggu stabilitas."),
    ("SEDANG", "Penyampaian Rencana Penerimaan Dana (Ren-PNP) oleh BUMN pembayar dividen dan Satker BLU kepada Kemenkeu diperlukan agar:",
     "BUN dapat mengkalibrasi jadwal penerbitan Surat Berharga Negara (SBN) sehingga tidak terjadi 'over-borrowing' yang membebani APBN", "Dividen BUMN dapat langsung dibagikan kepada anggota dewan", "BUMN tidak perlu membayar pajak penghasilan badan", "Uang penerimaan dapat dialihkan ke rekening bank luar negeri", "A",
     "Kepastian penerimaan kas besar (dividen/PNBP) mencegah pemerintah menerbitkan utang berlebih saat kas negara sebenarnya tercukupi."),
    ("SEDANG", "Jika SPM diajukan satker pada tanggal yang bertepatan dengan cut-off akhir tahun anggaran tanpa RPD yang valid, sistem SAKTI/SPAN akan:",
     "Melakukan penolakan otomatis (hard edit) sesuai regulasi Langkah-Langkah Akhir Tahun Anggaran (LLAT)", "Meneruskan SPM ke rekening pribadi pejabat pembuat komitmen", "Mencairkan dana secara otomatis tanpa pengecekan saldo pagu", "Menghapus data DIPA satker dari pangkalan data nasional", "A",
     "Pada masa LLAT, sistem menerapkan validasi ketat (hard edit) atas tanggal RPD untuk mencegah lonjakan penarikan kas tak terkendali di akhir Desember."),
    ("SEDANG", "Penerapan rekening virtual (Virtual Account) pada pengelolaan pengeluaran kas satker mendukung cash forecasting BUN karena:",
     "Memungkinkan pemantauan saldo dan mutasi kas satker secara real-time tersentralisasi tanpa membiarkan saldo mengendap di bank umum", "Membuat buku tabungan fisik bendahara menjadi tebal", "Menghilangkan kewajiban bendahara membuat laporan pertanggungjawaban (LPJ)", "Memperbolehkan penarikan uang kas di mesin ATM tanpa batas nominal", "A",
     "Virtual Account mengkonsolidasikan data transaksi satker ke sistem pusat BUN secara transparan, meniadakan 'hidden cash' di rekening terdesentralisasi.")
])

# 16 ANALISIS
t13_items.extend([
    ("ANALISIS", "Analisis Kasus Moral Hazard Satker Memecah SPM untuk Menghindari RPD Harian: Satker memiliki kewajiban pembayaran kontrak Rp 4,5 miliar kepada satu rekanan pada hari yang sama. PPK menerbitkan 5 SPM masing-masing Rp 900 juta agar tidak terkena kewajiban RPD Harian Rp 1 miliar. Analisis kepatuhan dan dampaknya adalah:",
     "Merupakan pelanggaran tata kelola perbendaharaan (smurfing/splitting SPM) untuk memanipulasi kepatuhan; KPPN berhak menolak berkas dan menurunkan nilai IKPA satker", "Tindakan cerdas dan sah yang patut dicontoh oleh satker lain untuk mempercepat proses", "Tindakan yang dianjurkan oleh peraturan menteri keuangan demi efisiensi", "Tidak ada masalah karena yang penting total uang yang dibayar sama", "A",
     "Pemecahan SPM (splitting) dengan sengaja untuk menghindari ambang batas regulasi merupakan fraud administratif yang melanggar ketentuan PMK RPD."),
    ("ANALISIS", "Analisis Risiko Likuiditas Saat Terjadi Lonjakan Penarikan Dana Serentak di Akhir Tahun (Year-End Cash Rush): Pada minggu ketiga Desember, 20.000 satker serentak mencairkan tagihan belanja modal bernilai puluhan triliun rupiah. Strategi pengelolaan likuiditas Kuasa BUN Pusat untuk mencegah default kas adalah:",
     "Mengaktifkan fasilitas Standing Liquidity Facility di BI, mengoptimalkan penarikan pinjaman siaga, dan menerapkan penjadwalan ketat antrean SP2D berbasis RPD LLAT", "Menolak mencairkan semua tagihan dan membatalkan proyek-proyek fisik", "Meminjam uang tunai dari kas daerah pemerintah provinsi secara sepihak", "Meminta rekanan menunggu pembayaran pada tahun anggaran 5 tahun berikutnya", "A",
     "BUN memitigasi 'year-end cash rush' melalui orkestrasi instrumen likuiditas pasar uang, fasilitas repo BI, dan penjadwalan antrean SP2D terjadwal."),
    ("ANALISIS", "Analisis Dampak Deviasi RPD Harian Terhadap 'Cost of Fund' Negara: Satker mendaftarkan RPD penarikan kas Rp 2 Triliun pada hari Senin. BUN menyiapkan likuiditas dengan menerbitkan SPN berbunga, namun satker baru mengajukan SPM pada hari Jumat. Dampak kerugian finansial negara adalah:",
     "Negara menanggung beban bunga dana pinjaman siaga selama 4 hari tanpa dana tersebut digunakan (cost of idle liquidity) yang membebani kas APBN", "Negara mendapatkan keuntungan bunga berlipat ganda dari bank", "Tidak ada dampak finansial karena uang kas negara tidak terbatas", "Satker mendapatkan hadiah penghargaan dari kementerian keuangan", "A",
     "Penyediaan kas bernilai jumbo memerlukan biaya dana (cost of funds); deviasi waktu pencairan menimbulkan inefisiensi bunga pinjaman kas siaga."),
    ("ANALISIS", "Analisis Kasus Kegagalan Setelmen SP2D Akibat Gangguan Koneksi Jaringan BI-RTGS: Pada pukul 15.00 saat batas akhir transfer RPD Rp 500 miliar, sistem jaringan BI-RTGS mengalami down teknis. Tindakan mitigasi Business Continuity Plan (BCP) yang sah bagi KPPN Khusus/DJPb adalah:",
     "Mengaktifkan prosedur manual darurat BCP yang disepakati dengan BI dan mengomunikasikan penundaan setelmen kepada bank operasional mitra", "Menyerahkan uang kas tunai dalam karung kepada rekanan di halaman kantor", "Membatalkan seluruh kontrak proyek dan memutus hubungan kerja dengan rekanan", "Menyalahkan satker atas rusaknya jaringan satelit perbankan", "A",
     "Protokol BCP perbendaharaan mengatur prosedur fallback darurat antara DJPb dan Bank Indonesia untuk menjamin kepastian setelmen tanpa melanggar kepatuhan."),
    ("ANALISIS", "Analisis Pengaruh Penerapan Kartu Kredit Pemerintah (KKP) dan CMS terhadap Akurasi Cash Forecasting: Mengapa pergeseran dari pembayaran uang muka tunai (cash advance) ke KKP meningkatkan akurasi manajemen kas negara?",
     "Menghilangkan penumpukan kas menganggur (idle cash) di brankas bendahara pengeluaran satker karena kas negara baru keluar saat pelunasan tagihan bank (charge on due date)", "Membuat bendahara pengeluaran bebas dari kewajiban membuat kuitansi belanja", "Memperbolehkan satker membeli barang pribadi pejabat secara gratis", "Menaikkan suku bunga utang luar negeri pemerintah", "A",
     "KKP menunda pengeluaran kas riil dari RKUN sampai tanggal jatuh tempo tagihan bank, mengeliminasi idle cash di rekening bendahara dan menaikkan kepastian cash flow."),
    ("ANALISIS", "Analisis Penerapan Algoritma Prediktif dalam Mengidentifikasi 'False RPD': Sistem perbendaharaan mendeteksi pola satker X selalu mendaftarkan RPD Rp 5 miliar setiap hari Jumat namun 90% dibatalkan pada hari Senin. Respon sistemik pengawasan Ditjen Perbendaharaan adalah:",
     "Sistem memberikan peringatan 'High Volatility Flag', mengunci dispensasi RPD satker, dan Kanwil DJPb melakukan asistensi pembinaan perencanaan kas", "Memberikan piala penghargaan atas kerajinan satker mendaftarkan RPD", "Menghapus satker X dari daftar instansi pemerintah republik indonesia", "Menaikkan anggaran satker X menjadi sepuluh kali lipat", "A",
     "Early warning system pada analisis data perbendaharaan mendeteksi pola pendaftaran RPD fiktif/tidak disiplin untuk mencegah distorsi likuiditas BUN."),
    ("ANALISIS", "Analisis Efektivitas Kebijakan Zero Balance Account (ZBA) pada Rekening Pengeluaran KPPN di Bank Operasional: Mengapa saldo rekening KPPN di bank umum setiap sore hari wajib bernilai Rp 0 (Nihil)?",
     "Untuk memastikan tidak ada sepeserpun dana kas negara yang mengendap di bank komersial dan seluruh saldo likuiditas terkonsolidasi kembali ke RKUN di BI", "Supaya bank umum mitra KPPN mengalami kerugian finansial", "Karena bank umum dilarang melayani transaksi pemerintah di atas pukul 12 siang", "Agar pegawai KPPN dapat membawa pulang saldo kas ke rumah masing-masing", "A",
     "Prinsip Rekening Pengeluaran Bersaldo Nihil (ZBA) menjamin dana ditarik dari BI hanya sejumlah SP2D yang dicairkan hari itu, menjaga integritas TSA."),
    ("ANALISIS", "Analisis Kasus Keterlambatan Transfer Dana Bagi Hasil (DBH) ke Pemerintah Daerah Akibat Ketidaksiapan Cash Forecasting Daerah: Kas negara siap mentransfer DBH Rp 10 Triliun, namun Pemda belum menyampaikan syarat salur. Evaluasi risiko fiskal bagi BUN adalah:",
     "BUN mengalami ketidakpastian penempatan likuiditas jangka pendek karena dana Rp 10 Triliun harus tetap siaga (standby) dan tidak dapat diinvestasikan secara optimal", "BUN otomatis mengalihkan dana Rp 10 Triliun untuk membangun bandara baru", "Pemda otomatis dibubarkan oleh Kementerian Keuangan", "Masyarakat daerah dibebaskan dari kewajiban membayar pajak", "A",
     "Ketidaksiapan penyaluran transfer ke daerah menciptakan 'idle liquidity' di BUN yang seharusnya dapat dioptimalkan jika ada jadwal salur presisi."),
    ("ANALISIS", "Analisis Peran 'Cash Management Regulations' dalam Menjaga Nilai Tukar Rupiah: Mengapa perencanaan kas belanja valuta asing K/L (misal pembelian alutsista impor bernilai USD 2 Miliar) wajib dikoordinasikan ketat dengan Bank Indonesia?",
     "Mencegah pembelian valas mendadak dalam volume besar di pasar spot domestik yang dapat menekan depresiasi kurs rupiah terhadap mata uang asing", "Supaya kementerian pertahanan dapat menimbun uang dolar tunai di brankas", "Untuk membuat kurs rupiah melemah secara sengaja demi keuntungan eksportir", "Sebagai syarat formalitas agar pejabat Kemenkeu diundang rapat di BI", "A",
     "Penarikan kas valas skala masif wajib dimitigasi bersama Bank Sentral untuk menjaga stabilitas moneter dan nilai tukar rupiah di pasar valuta asing."),
    ("ANALISIS", "Analisis Dampak Rekonsiliasi Bank Harian Otomatis (Daily Automated Bank Reconciliation) pada Sistem SPAN: Bagaimana rekonsiliasi harian antara mutasi RKUN BI dan pembukuan SPAN memitigasi risiko pembobolan kas negara?",
     "Mendeteksi secara seketika (real-time) setiap transaksi gantung (unreconciled items), selisih debet-kredit, atau transaksi debet tidak sah tanpa dasar SP2D", "Menghapus kebutuhan pencatatan akuntansi pada akhir tahun anggaran", "Membuat bank mitra KPPN bebas dari kewajiban mematuhi undang-undang", "Menggantikan peran seluruh pemeriksa Badan Pemeriksa Keuangan", "A",
     "Rekonsiliasi harian otomatis mencegah penyimpangan kas dan mendeteksi anomali mutasi rekening bank negara secara dini sebelum terjadi kerugian fatal."),
    ("ANALISIS", "Analisis Kebijakan 'Consolidation of Cash and Debt Management': Mengapa Ditjen Perbendaharaan dan Ditjen Pengelolaan Pembiayaan dan Risiko menyatukan koordinasi posisi kas dan penerbitan SBN?",
     "Agar penerbitan surat utang negara hanya dilakukan saat posisi proyeksi kas benar-benar defisit, menghindari penerbitan utang berlebih saat kas berlimpah (cash-buffer efficiency)", "Supaya biaya cetak surat utang dapat dibagi dua antar direktorat", "Untuk memperbanyak jumlah pinjaman luar negeri yang tidak terpakai", "Agar pejabat kedua direktorat dapat bergantian melakukan perjalanan dinas", "A",
     "Sinergi Cash & Debt Management memastikan penerbitan utang selaras dengan kebutuhan likuiditas riil kas negara, menekan beban bunga utang nasional."),
    ("ANALISIS", "Analisis Kasus Klaim Tagihan Kontrak Akhir Tahun yang Mengalami Over-Forecasting: K/L memproyeksikan penyerapan belanja modal Rp 50 Triliun pada Desember, namun realisasi riil hanya Rp 30 Triliun karena cuaca buruk. Dampak makroekonominya adalah:",
     "Pemerintah terlanjur menyiapkan likuiditas pembiayaan yang berlebih (over-financing) sehingga sisa lebih pembiayaan anggaran (SiLPA) membengkak tidak produktif", "Perekonomian nasional otomatis mengalami hiperinflasi", "Seluruh kontraktor pelaksana dipenjara tanpa proses pengadilan", "APBN tahun berikutnya otomatis dinyatakan tidak berlaku", "A",
     "Over-forecasting belanja mengakibatkan SiLPA tinggi yang tidak terserap di sektor riil, menciptakan biaya kesempatan (opportunity cost) dana publik."),
    ("ANALISIS", "Analisis Mekanisme 'Cash Sweeping' pada Rekening Satker BLU: Mengapa saldo kas pada rekening operasional BLU wajib disapu (sweep) ke rekening induk konsolidasi pada akhir hari kerja?",
     "Untuk mengoptimalkan imbal hasil saldo kas BLU secara agregat (pooling fund) dan mencegah idle cash tersebar di ribuan rekening cabang tanpa kendali", "Supaya pimpinan BLU tidak dapat membayar gaji dokter dan perawat", "Untuk menyita seluruh pendapatan BLU menjadi milik pejabat KPPN", "Sebagai formalitas perbankan tanpa manfaat finansial nyata", "A",
     "Cash sweeping mengkonsolidasikan likuiditas BLU ke dalam pooling fund terpusat guna meraih bunga optimal dan visibilitas kas menyeluruh."),
    ("ANALISIS", "Analisis Stres-Testing Likuiditas Kas Negara Menghadapi Kejadian Luar Biasa (Krisis Finansial Global): Bagaimana simulasi stress test cash buffer membantu Menteri Keuangan menentukan ketahanan fiskal darurat?",
     "Menguji apakah saldo cadangan likuiditas RKUN mampu bertahan membayar belanja wajib minimal 3 bulan jika seluruh penerimaan pajak anjlok 50%", "Menghitung berapa banyak emas batangan yang dapat dibeli oleh pejabat negara", "Menentukan kapan kantor kementerian keuangan harus dijual lelang", "Membatalkan seluruh undang-undang keuangan negara secara permanen", "A",
     "Stress-testing kas negara mengukur resiliensi likuiditas pemerintah dalam skenario terburuk guna memastikan kelangsungan operasional negara."),
    ("ANALISIS", "Analisis Efektivitas Pengendalian Retur SP2D Melalui Validasi Nomor Rekening Terpusat: Mengapa kegagalan transfer SP2D akibat rekening rekanan pasif/salah nomor merusak cash forecasting KPPN?",
     "Karena kas yang telah didebet dari kas negara kembali mengambang (float) dan membutuhkan proses administratif retur serta penerbitan SP2D pengganti", "Karena uang retur otomatis disita oleh direktur bank komersial", "Karena bank komersial berhak menaikkan tagihan retur kepada KPPN", "Karena satker penerima retur otomatis dibebaskan dari pembuatan LPJ", "A",
     "Retur SP2D menciptakan distorsi pencatatan kas keluar-masuk kembali dan menunda kepastian hak rekanan, merusak akurasi data likuiditas harian."),
    ("ANALISIS", "Analisis Transformasi Cash Management Berbasis 'Real-Time Gross Settlement 24/7' di Masa Depan: Dampak kesiapan perbendaharaan Indonesia menyongsong sistem pembayaran perbendaharaan tanpa henti (non-stop treasury):",
     "Pengelolaan kas negara beralih ke dynamic automated liquidity balance dengan algoritma AI yang mengatur investasi dan penarikan secara otonom setiap detik", "Pegawai KPPN harus bekerja di kantor selama 24 jam penuh tanpa tidur", "Sistem perbendaharaan manual dengan buku kas folio kembali digunakan", "Pencairan SP2D dibatasi hanya boleh dilakukan pada malam hari", "A",
     "Modernisasi treasury 24/7 membutuhkan sistem peramalan kas otonom berkecepatan tinggi dengan integrasi API perbankan dan Bank Sentral.")
])

add_topic(t13, reg13, t13_items)

# ============================================================================
# TOPIC 14: Jabatan Fungsional Perbendaharaan (PKN & APK APBN) (1701 - 1750)
# ============================================================================
reg14 = "PermenPAN-RB No. 53/2018 (JF PKN) jo PermenPAN-RB No. 54/2018 (JF APK APBN) jo PermenPAN-RB No. 1/2023 tentang Jabatan Fungsional"
t14 = "Jabatan Fungsional Perbendaharaan (PKN & APK APBN)"

t14_items = []
# 17 MUDAH
t14_items.extend([
    ("MUDAH", "Berdasarkan PermenPAN-RB No. 53/2018 dan 54/2018, dua Jabatan Fungsional di bidang perbendaharaan negara pada Kementerian/Lembaga adalah:",
     "Pranata Keuangan APBN (PKN) dan Analis Pengelolaan Keuangan APBN (APK APBN)", "Hakim Peradilan Pajak dan Panitera Pengganti", "Auditor Forensik BPK dan Penyelidik KPK", "Diplomat Madya dan Konsul Jenderal", "A",
     "Dua rumpun jabatan fungsional pengelola keuangan APBN di K/L adalah Pranata Keuangan APBN (kategori keterampilan) dan Analis Pengelolaan Keuangan APBN (kategori keahlian)."),
    ("MUDAH", "Jenjang kualifikasi pendidikan untuk Jabatan Fungsional Analis Pengelolaan Keuangan APBN (APK APBN) adalah kategori:",
     "Jabatan Fungsional Keahlian (Ahli Pertama, Ahli Muda, Ahli Madya, Ahli Utama)", "Jabatan Fungsional Keterampilan (Pemula, Terampil, Mahir, Penyelia)", "Jabatan Struktural Eselon I", "Pegawai Harian Lepas Tanpa Kualifikasi", "A",
     "APK APBN adalah Jabatan Fungsional Kategori Keahlian yang mensyaratkan kualifikasi pendidikan sarjana/diploma IV ke atas."),
    ("MUDAH", "Jenjang kualifikasi untuk Jabatan Fungsional Pranata Keuangan APBN (PKN) adalah kategori:",
     "Jabatan Fungsional Keterampilan (Terampil, Mahir, Penyelia)", "Jabatan Fungsional Keahlian Ahli Utama", "Tenaga Honorer Kategori II", "Pejabat Pimpinan Tinggi Madya", "A",
     "Pranata Keuangan APBN (PKN) merupakan Jabatan Fungsional Kategori Keterampilan yang berfokus pada eksekusi teknis perbendaharaan."),
    ("MUDAH", "Instansi Pembina teknis untuk Jabatan Fungsional PKN dan APK APBN di seluruh Kementerian/Lembaga Republik Indonesia adalah:",
     "Kementerian Keuangan c.q. Direktorat Jenderal Perbendaharaan (DJPb)", "Badan Kepegawaian Negara (BKN) secara mandiri", "Kementerian Dalam Negeri", "Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah (LKPP)", "A",
     "Ditjen Perbendaharaan Kementerian Keuangan bertindak sebagai Instansi Pembina teknis nasional bagi JF PKN dan JF APK APBN."),
    ("MUDAH", "Tugas pokok Jabatan Fungsional Analis Pengelolaan Keuangan APBN (APK APBN) berfokus pada:",
     "Perikatan dan pengujian komitmen, analisis perencanaan kas, penyiapan dokumen pembayaran, dan analisis pelaporan keuangan", "Mengantar surat fisik menggunakan sepeda motor dinas", "Menjaga pos pintu gerbang keamanan kantor satker", "Mencuci piring dan membersihkan ruang rapat", "A",
     "Tugas APK APBN meliputi pengelolaan komitmen belanja, analisis likuiditas kas, pengujian tagihan, dan analisis akuntansi pertanggungjawaban APBN."),
    ("MUDAH", "Tugas pokok Jabatan Fungsional Pranata Keuangan APBN (PKN) berfokus pada:",
     "Pengelolaan administrasi kas, penatausahaan dokumen pembayaran/SPP, pembukuan kebendaharaan, dan administrasi rekening", "Memutuskan sengketa pilkada serentak di Mahkamah Konstitusi", "Menerbitkan surat izin mengemudi bagi masyarakat umum", "Menetapkan besaran tarif cukai rokok nasional", "A",
     "Tugas PKN berfokus pada penatausahaan teknis kebendaharaan, administrasi pengujian dokumen pembayaran, dan pembukuan kas satker."),
    ("MUDAH", "Berdasarkan PermenPAN-RB No. 1/2023, penilaian kinerja pejabat fungsional (termasuk PKN dan APK APBN) kini dinilai berdasarkan:",
     "Predikat Kinerja Periodik dan Tahunan (Sasaran Kinerja Pegawai - SKP) yang dikonversi ke dalam Angka Kredit", "Pengumpulan berkas butir kegiatan fisik dan daftar usulan angka kredit (DUPAK) manual", "Banyaknya kuitansi belanja yang ditandatangani setiap malam", "Tingkat kedekatan personal dengan keluarga atasan langsung", "A",
     "PermenPAN-RB 1/2023 menghapus sistem DUPAK tradisional; Angka Kredit diperoleh dari konversi Predikat Kinerja SKP tahunan."),
    ("MUDAH", "Untuk dapat diangkat pertama kali ke dalam Jabatan Fungsional APK APBN Ahli Pertama, seorang PNS wajib berpendidikan paling rendah:",
     "Sarjana (S-1) atau Diploma IV bidang relevan", "Sekolah Menengah Pertama (SMP)", "Pendidikan Anak Usia Dini (PAUD)", "Tidak dipersyaratkan ijazah formal", "A",
     "Kualifikasi minimal pengangkatan pertama JF APK APBN Kategori Keahlian adalah Sarjana (S-1) / D-IV yang relevan."),
    ("MUDAH", "Uji Kompetensi (Ukom) yang diselenggarakan oleh Ditjen Perbendaharaan wajib diikuti oleh pejabat fungsional perbendaharaan dalam hal:",
     "Pengangkatan melalui perpindahan dari jabatan lain, penyesuaian (inpassing), dan kenaikan jenjang jabatan setingkat lebih tinggi", "Setiap kali pegawai mengambil cuti melahirkan", "Setiap pergantian hari kerja di kantor satker", "Hanya jika pegawai melakukan pelanggaran disiplin berat", "A",
     "Uji Kompetensi perbendaharaan disyaratkan untuk perpindahan jabatan, penyetaraan, serta promosi kenaikan jenjang jabatan fungsional."),
    ("MUDAH", "Pejabat fungsional APK APBN dapat ditugaskan untuk menjalankan peran pejabat perbendaharaan pada satker, yaitu:",
     "Pejabat Pembuat Komitmen (PPK) atau Pejabat Penandatangan SPM (PPSPM)", "Kepala Kepolisian Resor daerah", "Direktur Utama Badan Usaha Milik Swasta", "Pemeriksa Keuangan BPK", "A",
     "Kompetensi JF APK APBN dirancang selaras dengan peran Pejabat Pembuat Komitmen (PPK) dan Pejabat Penandatangan SPM (PPSPM)."),
    ("MUDAH", "Pejabat fungsional Pranata Keuangan APBN (PKN) sangat cocok ditugaskan menjalankan peran perbendaharaan sebagai:",
     "Bendahara Pengeluaran, Bendahara Penerimaan, atau Staf Pengelola Keuangan/Verifikator SPP", "Ketua Mahkamah Agung", "Panglima Komando Daerah Militer", "Menteri Koordinator Bidang Perekonomian", "A",
     "JF PKN memiliki kompetensi yang sangat selaras dengan tugas teknis Bendahara Pengeluaran, Bendahara Penerimaan, dan staf PPK/PPSPM."),
    ("MUDAH", "Sertifikat Kompetensi Perbendaharaan (misal Sertifikat PPK / PPSPM / BNT) yang diterbitkan Ditjen Perbendaharaan berfungsi sebagai:",
     "Bukti pengakuan formal atas kompetensi standar pengelolaan perbendaharaan negara", "Kartu diskon belanja di supermarket nasional", "Tiket masuk gratis ke tempat wisata daerah", "Surat bebas tilang kendaraan bermotor dinas", "A",
     "Sertifikat kompetensi membuktikan pemenuhan standar kompetensi kerja nasional bidang perbendaharaan negara."),
    ("MUDAH", "Pemberhentian dari Jabatan Fungsional perbendaharaan dapat dilakukan oleh Pejabat Pembina Kepegawaian apabila pejabat bersangkutan:",
     "Dijatuhi hukuman disiplin tingkat berat yang berkekuatan hukum tetap atau mengundurkan diri", "Menyelesaikan seluruh target kinerja sebelum akhir tahun", "Mendapatkan predikat kinerja Sangat Baik selama 5 tahun berturut-turut", "Lulus pendidikan magister dengan predikat cum laude", "A",
     "Pemberhentian dari JF terjadi karena hukuman disiplin berat, pengunduran diri, cuti di luar tanggungan negara, atau tidak memenuhi syarat jabatan."),
    ("MUDAH", "Pengembangan kompetensi bagi pejabat fungsional PKN dan APK APBN sekurang-kurangnya dilaksanakan melalui:",
     "Pelatihan teknis perbendaharaan, e-learning Kemenkeu Learning Center (KLC), seminar, dan bimbingan teknis berkala", "Menonton tayangan hiburan daring saat jam kerja", "Tidur siang di ruang arsip kantor", "Membeli buku novel fiksi populer", "A",
     "Instansi pembina menyediakan jalur pengembangan kompetensi via Pusdiklat Anggaran dan Perbendaharaan serta platform KLC."),
    ("MUDAH", "Organisasi profesi resmi bagi para pejabat fungsional perbendaharaan di Indonesia yang diakui regulasi bertujuan untuk:",
     "Memelihara kode etik, meningkatkan profesionalisme, dan memperjuangkan aspirasi profesi pengelola keuangan negara", "Menentukan tarif pajak baru bagi masyarakat", "Mengatur harga jual saham di bursa efek", "Mengorganisir mogok kerja massal pegawai kementerian", "A",
     "Organisasi profesi JF perbendaharaan bertugas menegakkan kode etik profesi dan meningkatkan kapasitas anggotanya secara berkesinambungan."),
    ("MUDAH", "Predikat kinerja tahunan 'Sangat Baik' yang diperoleh seorang APK APBN menghasilkan konversi Angka Kredit sebesar:",
     "150% dari koefisien angka kredit tahunan jenjang jabatannya", "0% tanpa angka kredit apapun", "10% dari gaji pokok bulanan", "1000 kali lipat pagu DIPA satker", "A",
     "Berdasarkan PermenPAN-RB 1/2023, predikat kinerja 'Sangat Baik' dikonversi menjadi 150% dari koefisien Angka Kredit tahunan."),
    ("MUDAH", "Koefisien angka kredit tahunan untuk jenjang Analis Pengelolaan Keuangan APBN Ahli Muda dengan predikat 'Baik' adalah:",
     "25 angka kredit per tahun (100% dari koefisien 25)", "100 angka kredit per hari", "1 angka kredit per 10 tahun", "Gratis tanpa batasan", "A",
     "Koefisien dasar tahunan JF Keahlian: Ahli Pertama = 12.5, Ahli Muda = 25, Ahli Madya = 37.5, Ahli Utama = 50 pada predikat kinerja 'Baik'.")
])

# 17 SEDANG
t13_items.extend([])  # clear
t14_items.extend([
    ("SEDANG", "Dalam skema pengalihan jabatan (inpassing / penyesuaian) ke dalam JF APK APBN, PNS yang menduduki jabatan struktural eselon IV/pengawas disetarakan ke jenjang:",
     "Analis Pengelolaan Keuangan APBN Ahli Muda", "Analis Pengelolaan Keuangan APBN Ahli Utama", "Pranata Keuangan APBN Pemula", "Tenaga Keamanan Kantor", "A",
     "Kebijakan penyetaraan jabatan birokrasi mengalihkan pejabat pengawas (eselon IV) ke jenjang fungsional Ahli Muda."),
    ("SEDANG", "Peran strategis APK APBN Ahli Madya pada unit eselon I Kementerian/Lembaga mencakup kewenangan analitis berupa:",
     "Menyusun kajian telaah kebijakan fiskal sektoral, mitigasi risiko anggaran, evaluasi kinerja anggaran belanja, dan perumusan rekomendasi perbaikan tata kelola keuangan", "Mengecap stempel pada kuitansi fotokopi", "Membayar tagihan listrik satker di loket pos", "Membeli perlengkapan alat tulis kantor di toko ritel", "A",
     "Jenjang Ahli Madya dituntut memberikan analisis tingkat lanjut, rekomendasi strategis, dan evaluasi efektivitas kebijakan anggaran K/L."),
    ("SEDANG", "Apabila seorang Pranata Keuangan APBN Penyelia telah mencapai batas pangkat puncak pada golongannya dan memiliki ijazah S-1 Akuntansi, ia dapat beralih ke JF Keahlian melalui:",
     "Perpindahan antar kategori jabatan dari JF Keterampilan ke JF Keahlian (APK APBN) dengan mengikuti dan lulus Uji Kompetensi", "Pengangkatan otomatis tanpa tes apapun cukup dengan melampirkan ijazah", "Membayar biaya administrasi ke panitia kepegawaian", "Mengganti nama di kartu tanda penduduk", "A",
     "Perpindahan dari kategori keterampilan ke keahlian wajib memenuhi syarat kualifikasi ijazah dan lulus Uji Kompetensi yang diadakan Instansi Pembina."),
    ("SEDANG", "Kode etik dan kode perilaku Jabatan Fungsional Perbendaharaan mewajibkan pejabat fungsional menjaga independensi profesional, yang berarti:",
     "Menolak segala bentuk intervensi yang bertentangan dengan peraturan perundangan keuangan negara meskipun diperintahkan secara lisan oleh atasan", "Selalu menuruti semua kemauan rekanan demi menjaga keharmonisan kerja", "Menerima gratifikasi sepanjang tidak diketahui oleh auditor BPK", "Menyerahkan password dan user SAKTI kepada pihak ketiga", "A",
     "Independensi profesional menuntut pejabat perbendaharaan berpegang teguh pada regulasi dan menolak perintah yang melanggar hukum keuangan negara."),
    ("SEDANG", "Berdasarkan PermenPAN-RB No. 1/2023, mekanisme kenaikan jenjang jabatan fungsional setingkat lebih tinggi mensyaratkan:",
     "Memenuhi Angka Kredit Kumulatif minimal, lulus Uji Kompetensi, dan tersedianya formasi/kebutuhan jabatan pada unit kerja", "Hanya menunggu masa kerja 4 tahun tanpa melihat kinerja", "Mendapat persetujuan dari seluruh rekanan tender satker", "Membayar uang pelicin kepada pejabat pembina kepegawaian", "A",
     "Syarat kenaikan jenjang JF: angka kredit kumulatif mencukupi, lulus ukom jenjang, dan terdapat formasi yang lowong dalam anjab/ABK."),
    ("SEDANG", "Tanggung jawab hukum seorang APK APBN yang bertindak sebagai Pejabat Pembuat Komitmen (PPK) berbeda dengan pejabat struktural biasa karena:",
     "PPK memikul tanggung jawab perikatan perdata dan kebenaran materiil pengeluaran kas negara yang dapat dituntut ganti rugi finansial secara pribadi jika lalai", "PPK kebal hukum dan tidak dapat diperiksa oleh aparat penegak hukum", "PPK tidak bertanggung jawab atas isi kontrak yang ditandatanganinya", "Tanggung jawab PPK otomatis dialihkan ke menteri keuangan jika terjadi korupsi", "A",
     "PPK bertanggung jawab secara materiil dan formal atas perikatan belanja yang dibuatnya; kelalaian yang merugikan negara menimbulkan tanggung jawab pribadi."),
    ("SEDANG", "Instansi Pembina (DJPb) menyelenggarakan pemantauan dan evaluasi berkala terhadap pejabat fungsional perbendaharaan di seluruh Indonesia melalui:",
     "Sistem Informasi Manajemen Jabatan Fungsional Perbendaharaan (e-JFP) dan integrasi data kinerja di SAKTI", "Pemeriksaan fisik tas kerja setiap hari senin", "Pemberian tugas piket malam di kantor pusat kemenkeu", "Penyadapan telepon seluler seluruh keluarga pegawai", "A",
     "Aplikasi e-JFP memfasilitasi penatausahaan data profil, kompetensi, sertifikasi, formasi, dan pemantauan kinerja JF perbendaharaan secara nasional."),
    ("SEDANG", "Dalam hal seorang pejabat fungsional PKN ditugaskan sebagai Bendahara Pengeluaran pada satker terpencil, perlindungan profesi yang berhak diperoleh adalah:",
     "Bimbingan teknis berkala, pendampingan hukum kedinasan dalam menjalankan tugas sah, serta fasilitas sarana pengamanan penyimpanan kas negara", "Kekebalan mutlak dari segala bentuk audit pemeriksa", "Izin membawa pulang uang brankas kantor tanpa dicatat", "Pembebasan dari kewajiban membuat Surat Pertanggungjawaban (SPJ)", "A",
     "Pejabat fungsional berhak mendapat perlindungan profesi, bantuan hukum atas tindakan kedinasan yang sah, dan standar sarana kerja yang aman."),
    ("SEDANG", "Keterkaitan antara penilaian kinerja berbasis SKP (PermenPAN-RB 1/2023) dengan Indikator Kinerja Pelaksanaan Anggaran (IKPA) satker bagi APK APBN adalah:",
     "Capaian nilai IKPA satker (komitmen, pembayaran, perencanaan) dapat dijadikan Indikator Kinerja Individu (IKI) dalam SKP pejabat bersangkutan", "Nilai IKPA tidak boleh dimasukkan dalam penilaian kinerja PNS", "IKPA hanya dinilai untuk instansi pusat di kementerian keuangan", "IKPA otomatis menggantikan seluruh gaji dan tunjangan jabatan", "A",
     "Target IKPA satker diturunkan (cascading) menjadi target kinerja individu PPK/PPSPM fungsional dalam matriks peran hasil SKP."),
    ("SEDANG", "Apabila formasi jenjang Ahli Madya pada sebuah Kementerian belum tersedia lowong, seorang APK APBN Ahli Muda yang telah lulus Uji Kompetensi dan cukup angka kredit:",
     "Belum dapat diangkat ke jenjang Ahli Madya sampai tersedianya formasi lowong yang ditetapkan MenPAN-RB, namun tetap menerima angka kredit", "Dapat mengangkat dirinya sendiri menjadi Ahli Madya tanpa izin", "Otomatis dipecat dari status pegawai negeri sipil", "Wajib berpindah instansi ke kantor swasta di luar negeri", "A",
     "Kenaikan jenjang jabatan fungsional mutlak dibatasi oleh ketersediaan formasi kebutuhan jabatan (Anjab/ABK) yang disetujui MenPAN-RB."),
    ("SEDANG", "Batas Usia Pensiun (BUP) bagi Pejabat Fungsional Ahli Pertama dan Ahli Muda adalah 58 tahun, sedangkan bagi Ahli Madya adalah:",
     "60 tahun, dan bagi Ahli Utama adalah 65 tahun", "50 tahun", "75 tahun", "80 tahun", "A",
     "Sesuai regulasi ASN, BUP JF Ahli Pertama & Muda adalah 58 tahun, Ahli Madya 60 tahun, dan Ahli Utama 65 tahun."),
    ("SEDANG", "Kewajiban perpanjangan Sertifikat Kompetensi Bendahara (BNT / Sertifikat PPK) diatur dengan mekanisme:",
     "Penyegaran (refreshment) kompetensi secara berkala atau pemenuhan jam pelatihan berkelanjutan (PPL) sebelum masa berlaku sertifikat habis (5 tahun)", "Membayar uang iuran tahunan kepada bank sentral", "Mengikuti ujian nasional tertulis di stadion olahraga", "Sertifikat berlaku selamanya tanpa perlu pembaruan", "A",
     "Sertifikat kompetensi perbendaharaan memiliki masa berlaku 5 tahun dan diperpanjang via program Pengembangan Keprofesian Berkelanjutan (PPL / Refreshment)."),
    ("SEDANG", "Penugasan rangkap jabatan bagi pejabat fungsional perbendaharaan yang dilarang keras oleh peraturan perundangan adalah:",
     "Merangkap jabatan sebagai Bendahara Pengeluaran dan Pejabat Penandatangan SPM (PPSPM) pada satker yang sama", "Menjabat sebagai anggota koperasi kantor", "Menjadi pengurus RT di lingkungan tempat tinggal pribadi", "Mengikuti kegiatan bakti sosial di hari libur", "A",
     "Pemisahan fungsi 'ordonnateur' (penguji/penerbit SPM) dan 'comptable' (bendahara pembayar) adalah asas fundamental; dilarang keras dirangkap orang yang sama."),
    ("SEDANG", "Berdasarkan PermenPAN-RB No. 1/2023, pejabat fungsional yang memperoleh predikat kinerja 'Kurang' atau 'Sangat Kurang' akan:",
     "Diberikan pembinaan kinerja, konseling, dan hanya memperoleh konversi Angka Kredit 50% (Kurang) atau 25% (Sangat Kurang)", "Langsung dijatuhi hukuman kurungan penjara seumur hidup", "Dipotong seluruh gaji pokoknya menjadi nol rupiah", "Diberhentikan seketika tanpa hak membela diri", "A",
     "Predikat kinerja 'Kurang' menghasilkan 50% angka kredit, sedangkan 'Sangat Kurang' 25%, disertai pembinaan kinerja oleh atasan langsung."),
    ("SEDANG", "Peran APK APBN dalam penyusunan Laporan Pertanggungjawaban (LPJ) Keuangan Satker meliputi:",
     "Melakukan analisis rekonsiliasi antara data transaksi kas Modul Bendahara/Pembayaran dengan Modul Akuntansi Pelaporan di SAKTI", "Menandatangani laporan tanpa memeriksa kebenaran angka", "Menghapus selisih minus transaksi dari basis data aplikasi", "Menyalahkan KPPN apabila laporan satker terlambat", "A",
     "APK APBN bertugas menganalisis integritas data antar modul (pembayaran, kas, aset, akuntansi) guna memastikan keandalan LPJ satker."),
    ("SEDANG", "Dampak positif kebijakan jabatan fungsional perbendaharaan terhadap jenjang karir ASN pengelola keuangan adalah:",
     "Memberikan kepastian jalur karir berbasis meritokrasi keahlian teknis perbendaharaan tanpa harus bergantung pada ketersediaan jabatan struktural manajerial", "Mengharuskan pegawai bekerja tanpa menerima tunjangan jabatan", "Menghilangkan hak pegawai untuk mengambil cuti tahunan", "Membuat pegawai tidak dapat naik pangkat seumur hidup", "A",
     "Jabatan fungsional membuka peluang kenaikan pangkat dan jenjang karir mandiri berbasis capaian kinerja keahlian profesional."),
    ("SEDANG", "Uji Kompetensi kenaikan jenjang JF Perbendaharaan mencakup pengujian terhadap 3 dimensi kompetensi utama, yaitu:",
     "Kompetensi Teknis Perbendaharaan, Kompetensi Manajerial, dan Kompetensi Sosial Kultural", "Kekuatan fisik angkat besi, kecepatan lari sprint, dan renang", "Pengetahuan ramalan astrologi, seni melukis, dan bernyanyi", "Jumlah kekayaan pribadi, merek kendaraan, dan luas rumah", "A",
     "Sesuai standar ASN dan MenPAN-RB, ukom menguji kompetensi Teknis (keuangan/perbendaharaan), Manajerial, dan Sosial Kultural.")
])

# 16 ANALISIS
t14_items.extend([
    ("ANALISIS", "Analisis Benturan Kepentingan Penugasan Fungsional: Seorang APK APBN Ahli Muda ditugaskan sebagai PPK proyek gedung, sementara kakak kandungnya adalah direktur utama rekanan kontraktor yang memenangkan lelang secara sah. Tindakan etika profesi yang wajib diambil oleh pejabat fungsional adalah:",
     "Melaporkan potensi benturan kepentingan secara tertulis kepada KPA dan mengundurkan diri dari penetapan sebagai PPK pada paket pekerjaan tersebut", "Tetap menjadi PPK dan meloloskan seluruh tagihan kakaknya tanpa pengujian fisik", "Meminta komisi sukses 10% dari kakaknya untuk ditabung di bank luar negeri", "Membuat surat kontrak palsu dengan menggunakan nama orang lain", "A",
     "Prinsip integritas perbendaharaan mewajibkan pejabat mendeklarasikan benturan kepentingan keluarga dan menarik diri dari kewenangan penetapan komitmen/pembayaran."),
    ("ANALISIS", "Analisis Kasus Perintah Atasan yang Bertentangan dengan Hukum Pengeluaran Negara: KPA memerintahkan secara lisan kepada pejabat fungsional PPSPM untuk menyetujui SPM-LS proyek tanpa lampiran Berita Acara Pemeriksaan Pekerjaan (BAPP). Sikap profesional yang wajib ditunjukkan PPSPM adalah:",
     "Menolak menandatangani SPM, menyampaikan dasar regulasi PMK pembayaran, dan meminta perintah tersebut dituangkan secara tertulis jika KPA tetap memaksakan kehendak", "Segera menyetujui SPM agar tidak dimusuhi oleh atasan", "Menandatangani SPM lalu melarikan diri ke luar kota", "Menghapus file DIPA dari aplikasi SAKTI kantor", "A",
     "Berdasarkan UU No. 1/2004, penguji SPM wajib menolak tagihan yang tidak lengkap bukti pengeluarannya; bila dipaksa tertulis, tanggung jawab beralih ke pemberi perintah."),
    ("ANALISIS", "Analisis Kebutuhan Formasi Jabatan Fungsional (Anjab/ABK) di Lingkungan Satker Baru: Satker balai riset baru dibentuk dengan DIPA Rp 150 miliar dan 1.200 transaksi per tahun. Bagaimana metode penghitungan kebutuhan formasi ideal JF PKN dan APK APBN?",
     "Menghitung beban kerja tahunan (volume transaksi SPP/SPM, kontrak, pengujian, rekonsiliasi, pembukuan kas) dibagi norma waktu penyelesaian standar per jabatan", "Menentukan jumlah formasi berdasarkan jumlah kamar kosong di gedung kantor", "Menyamakan jumlah formasi dengan jumlah mobil dinas yang tersedia", "Meminta rekomendasi dari dukun setempat", "A",
     "Analisis Beban Kerja (ABK) perbendaharaan mengkalkulasi volume transaksi riil tahunan terhadap waktu standar penyelesaian tugas jabatan fungsional."),
    ("ANALISIS", "Analisis Kegagalan Transformasi Penilaian Kinerja Pasca PermenPAN-RB No. 1/2023: Pejabat fungsional perbendaharaan masih sibuk mengumpulkan kuitansi fisik dan fotokopi lembar SP2D untuk bukti DUPAK. Evaluasi dan koreksi pembinaan yang tepat dari Instansi Pembina adalah:",
     "Menyosialisasikan bahwa DUPAK telah resmi dihapus; penilaian murni berbasis ekspektasi hasil kerja dan perilaku dalam SKP berkala yang disepakati dengan pimpinan", "Memberikan hukuman push-up 100 kali kepada pejabat bersangkutan", "Mewajibkan pejabat mengumpulkan kuitansi dua kali lipat lebih banyak", "Menghapus tunjangan kinerja pegawai selama satu tahun penuh", "A",
     "PermenPAN-RB 1/2023 menyederhanakan birokrasi dengan meniadakan pengumpulan butir kegiatan DUPAK, bergeser ke dialog kinerja SKP dan kontribusi riil organisasi."),
    ("ANALISIS", "Analisis Peran APK APBN Ahli Madya dalam Pengendalian Defisit Anggaran: Pada satker kementerian yang mengalami pemotongan anggaran (automatic adjustment) Rp 50 miliar, peran analitis yang harus dilakukan fungsional keuangan adalah:",
     "Melakukan 'spending review' komprehensif, memetakan belanja operasional non-esensial (rapat hotel, perdis), dan merekomendasikan realokasi ke belanja prioritas layanan publik", "Memotong gaji seluruh tenaga honorer secara sepihak", "Mengajukan pinjaman uang ke rentenir gelap", "Menghentikan seluruh program kerja satker tanpa evaluasi", "A",
     "Fungsional keahlian madya berperan melakukan spending review dan 'value for money audit' internal untuk menjaga efisiensi di tengah restrukturisasi fiskal."),
    ("ANALISIS", "Analisis Perlindungan Hukum Fungsional Pejabat Perbendaharaan dalam Sengketa Tata Usaha Negara (PTUN): Rekanan yang digugurkan dalam pencairan SPM menggugat PPSPM ke PTUN. Bentuk pendampingan hukum kedinasan yang wajib diberikan instansi adalah:",
     "Biro Hukum K/L bersama Instansi Pembina memberikan pendampingan hukum dan saksi ahli perbendaharaan selama tindakan PPSPM terbukti sesuai SOP regulasi", "Membiarkan PPSPM membayar pengacara swasta sendiri dari uang gaji pribadi", "Meminta rekanan untuk memukul PPSPM secara fisik di luar kantor", "Memaksa PPSPM mengakui kesalahan yang tidak dilakukannya", "A",
     "Negara wajib memberikan advokasi dan bantuan hukum bagi ASN yang menghadapi tuntutan hukum akibat pelaksanaan tugas kedinasan yang sah dan sesuai SOP."),
    ("ANALISIS", "Analisis Mitigasi Risiko Pembajakan Kredensial Digital (Digital Signature Fraud) pada Pejabat Fungsional PPSPM: PPSPM meminjamkan token OTP dan passphrase tanda tangan digital SAKTI kepada staf honorer untuk mempercepat penerbitan SPM. Analisis delik dan sanksinya adalah:",
     "Merupakan pelanggaran berat keamanan informasi SPBE; PPSPM bertanggung jawab mutlak atas setiap dokumen yang ditandatangani dan dikenai sanksi disiplin berat", "Tindakan pendelegasian wewenang cerdas yang patut diberi penghargaan", "Hal wajar yang diperbolehkan oleh undang-undang informasi transaksi elektronik", "Tidak memiliki konsekuensi hukum apapun", "A",
     "Passphrase dan TTE bersifat personal dan tidak dapat dialihkan; peminjaman kredensial melanggar UU ITE dan regulasi SPBE Kemenkeu, membatalkan dalih lepas tanggung jawab."),
    ("ANALISIS", "Analisis Dampak Pembentukan Jabatan Fungsional Terhadap Penyerapan Anggaran Satker: Mengapa satker yang seluruh pengelola keuangannya telah berstatus fungsional tersertifikasi memiliki nilai IKPA lebih stabil dibanding satker tanpa fungsional?",
     "Karena terdapat profesionalisme terstandarisasi, pemahaman regulasi mutakhir, dan kontinuitas pengawalan anggaran tanpa terganggu pergantian jabatan struktural", "Karena satker fungsional otomatis diberikan uang tambahan oleh bank", "Karena KPPN memberikan perlakuan istimewa dan bebas audit bagi fungsional", "Karena aplikasi SAKTI hanya dapat dibuka oleh pejabat fungsional", "A",
     "Standardisasi kompetensi berkelanjutan dan kontinuitas tugas JF meminimalisasi kesalahan administrasi, retur SP2D, dan keterlambatan realisasi anggaran."),
    ("ANALISIS", "Analisis Strategi Peningkatan Kinerja Fungsional Melalui 'Community of Practice' (CoP): Bagaimana forum komunikasi pejabat fungsional perbendaharaan antar K/L di tingkat wilayah menyelesaikan kebuntuan teknis aplikasi SAKTI?",
     "Memfasilitasi knowledge-sharing silang instansi, membahas studi kasus transaksi rumit (hibah, SBSN, BLU), dan merumuskan solusi kolektif bersama Kanwil DJPb", "Menggalang aksi protes bersama menolak regulasi kementerian keuangan", "Membuat arisan uang bulanan antar kementerian", "Mengadakan pertandingan sepak bola setiap jam kerja dinas", "A",
     "Community of Practice (CoP) menumbuhkan ekosistem belajar bersama untuk memecahkan problematika implementasi sistem keuangan negara di lapangan."),
    ("ANALISIS", "Analisis Dampak Penilaian Kinerja Berjenjang (Cascading) dari Renstra K/L ke SKP Pejabat Fungsional: Mengapa setiap butir ekspektasi kinerja dalam SKP APK APBN wajib memiliki tautan langsung ke Perjanjian Kinerja (PK) pimpinan unit?",
     "Untuk memastikan setiap rupiah anggaran yang dikelola fungsional berkontribusi nyata pada pencapaian sasaran strategis kementerian, bukan sekadar rutinitas administratif", "Supaya format dokumen SKP terlihat tebal dan rapi di mata pemeriksa BKN", "Agar pimpinan unit dapat membebankan seluruh pekerjaan pribadinya ke staf", "Sebagai syarat formalitas agar pegawai dapat berlibur akhir tahun", "A",
     "Penyelarasan sasaran (alignment) menjamin peran fungsional perbendaharaan secara langsung menggerakkan indikator output strategis kementerian."),
    ("ANALISIS", "Analisis Kasus Kenaikan Jenjang Jabatan Fungsional yang Terhambat Akibat Nilai Ukom Tidak Memenuhi Passing Grade: Seorang PKN Mahir gagal dalam Ukom kenaikan ke Penyelia pada materi audit rekonsiliasi kas. Tindakan pengembangan diri yang tepat adalah:",
     "Mengikuti bimbingan teknis perbaikan di Balai Diklat Keuangan (BDK), memanfaatkan modul microlearning KLC, dan mengulang Ukom pada periode berikutnya", "Mengancam panitia penyelenggara ukom dengan tuntutan hukum", "Menggunakan sertifikat palsu yang dibeli dari internet", "Berhenti bekerja dan menolak masuk kantor selama 6 bulan", "A",
     "Kegagalan ukom harus disikapi dengan pemetaan gap kompetensi dan penguatan materi via pembelajaran mandiri resmi (KLC/BDK) sebelum retake ukom."),
    ("ANALISIS", "Analisis Risiko 'Burnout' dan 'Turnover' Pejabat Pengelola Keuangan Negara: Di akhir tahun anggaran, pejabat fungsional perbendaharaan sering mengalami beban kerja ekstrem selama LLAT. Kebijakan manajerial instansi untuk memitigasi risiko kesehatan dan human-error adalah:",
     "Menerapkan rotasi shift verifikasi, penyediaan fasilitas pendukung kerja lembur yang layak, serta 'wellness program' dan apresiasi kinerja", "Memaksa pegawai bekerja 48 jam nonstop tanpa makan dan istirahat", "Mengurangi gaji pegawai yang mengeluh lelah di akhir tahun", "Menyerahkan proses verifikasi pembayaran kepada pihak luar tanpa kontrak", "A",
     "Manajemen human capital yang bijak mengelola beban kerja puncak akhir tahun via mitigasi kelelahan kerja guna menghindari human error fatal pada verifikasi SPM."),
    ("ANALISIS", "Analisis Kedudukan JF Perbendaharaan dalam Arsitektur Sistem Pengendalian Intern Pemerintah (SPIP): Dalam model 'Three Lines of Defense', pejabat fungsional pengelola keuangan (PPK, PPSPM, Bendahara) berada pada posisi:",
     "Lini Pertama Pertahanan (First Line of Defense) yang langsung mengidentifikasi, mengendalikan, dan memitigasi risiko operasional keuangan harian", "Lini Kedua Pertahanan yang dipegang oleh Inspektorat Jenderal", "Lini Ketiga Pertahanan yang dipegang oleh BPK", "Luar sistem pertahanan negara", "A",
     "Pengelola keuangan di level satker bertindak sebagai Lini Pertama Pertahanan yang mengeksekusi kontrol internal preventif atas transaksi pengeluaran."),
    ("ANALISIS", "Analisis Kasus Rangkap Jabatan Fungsional dengan Jabatan Pengurus Partai Politik: Seorang APK APBN secara rahasia terdaftar sebagai pengurus harian partai politik di tingkat kabupaten. Konsekuensi yuridis kepegawaian ASN yang wajib diberlakukan adalah:",
     "Diberhentikan tidak dengan hormat sebagai PNS sesuai UU Aparatur Sipil Negara karena melanggar asas netralitas mutlak ASN", "Dipromosikan menjadi staf khusus menteri keuangan", "Diberikan kenaikan pangkat luar biasa", "Dibiarkan saja karena hak asasi berpolitik dilindungi", "A",
     "UU ASN dan regulasi kepegawaian melarang keras PNS menjadi anggota atau pengurus partai politik; pelanggaran berujung pemberhentian sebagai ASN."),
    ("ANALISIS", "Analisis Masa Depan Jabatan Fungsional Perbendaharaan di Era Otomasi Keuangan (Hyperautomation): Ketika proses pembuatan kuitansi dan input data otomatis digantikan oleh sistem bot AI, pergeseran peran strategis pejabat fungsional perbendaharaan adalah:",
     "Beralih dari 'data entry operator' menjadi 'financial strategic advisor', fokus pada data analytics, evaluasi efektivitas belanja, dan mitigasi fraud fiskal", "Seluruh pejabat fungsional dirumahkan tanpa pekerjaan", "Kembali menggunakan mesin ketik manual dan nota kertas kuno", "Beralih profesi menjadi supir kendaraan operasional kantor", "A",
     "Otomasi membebaskan pejabat fungsional dari tugas klerikal rutin, meningkatkan peran mereka sebagai analis kebijakan pembiayaan dan penasihat keuangan strategis."),
    ("ANALISIS", "Analisis Hubungan Kerja Kemitraan Antara Pejabat Fungsional Keuangan Satker dengan Pembina Perbendaharaan KPPN: Bagaimana sinergi konsultatif (Customer Oriented Treasury) menyelesaikan kendala revisi pagu minus DIPA satker?",
     "KPPN menyediakan helpdesk Financial Advisor (CSO) untuk menganalisis akar masalah pagu minus bersama fungsional satker dan merumuskan revisi pergeseran akun yang sah", "KPPN langsung menutup pintu pelayanan dan menolak satker masuk", "Satker membiarkan pagu minus terbengkalai sampai tahun depan", "KPPN membebankan denda uang tunai kepada pegawai satker", "A",
     "Paradigma KPPN modern sebagai Financial Advisor membimbing fungsional satker dalam mitigasi kendala eksekusi anggaran secara solutif dan terarah.")
])

add_topic(t14, reg14, t14_items)

# Save intermediate json for topic 13 and 14
with open("scripts/p4_topics13_14.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)
print("Topic 13 & 14 successfully written!")
