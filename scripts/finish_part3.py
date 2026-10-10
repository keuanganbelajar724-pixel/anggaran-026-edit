# -*- coding: utf-8 -*-
import json
import os

def q(num, topic, diff, q_text, a, b, c, d, ans, exp, reg):
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

# Load first 400 questions
with open("scripts/p3_topics1_to_8.json", "r", encoding="utf-8") as f:
    part3_questions = json.load(f)

print(f"Loaded existing {len(part3_questions)} questions.")
cur_num = 1451

def add_topic(topic, reg, mudah, sedang, analisis):
    global cur_num, part3_questions
    for it in mudah:
        part3_questions.append(q(cur_num, topic, "MUDAH", it[0], it[1], it[2], it[3], it[4], it[5], it[6], reg))
        cur_num += 1
    for it in sedang:
        part3_questions.append(q(cur_num, topic, "SEDANG", it[0], it[1], it[2], it[3], it[4], it[5], it[6], reg))
        cur_num += 1
    for it in analisis:
        part3_questions.append(q(cur_num, topic, "ANALISIS", it[0], it[1], it[2], it[3], it[4], it[5], it[6], reg))
        cur_num += 1
    print(f"Added {topic}, current count: {len(part3_questions)}")

# ============================================================================
# TOPIC 9: Pengelolaan Keuangan Badan Layanan Umum (BLU) (1451 - 1500)
# ============================================================================
t9 = "Pengelolaan Keuangan Badan Layanan Umum (BLU)"
reg9 = "PP No. 23/2005 jo PP No. 74/2012 tentang Pengelolaan Keuangan BLU jo PMK No. 129/PMK.05/2020"

t9_m = [
    ("Tujuan utama dibentuknya Badan Layanan Umum (BLU) pada instansi pemerintah adalah:", 
     "Meningkatkan pelayanan publik melalui fleksibilitas pengelolaan keuangan berbasis praktik bisnis yang sehat tanpa mengutamakan mencari keuntungan", "Mencari laba dividen sebesar-besarnya untuk pemegang saham", "Menghindari pemeriksaan Badan Pemeriksa Keuangan", "Memotong gaji seluruh pegawai negeri", "A", 
     "BLU bertujuan memberikan pelayanan publik yang efisien dan efektif dengan fleksibilitas pengelolaan keuangan tanpa tujuan profit semata.", reg9),
    ("Pendapatan yang diperoleh dari jasa layanan BLU dapat:", 
     "Digunakan langsung untuk membiayai belanja operasional BLU tanpa harus disetorkan terlebih dahulu ke kas negara", "Dibagikan ke pejabat daerah secara tunai", "Dibelikan valas untuk disimpan pribadi", "Diberikan kepada kontraktor swasta secara cuma-cuma", "A", 
     "Fleksibilitas utama BLU adalah hak penggunaan langsung (direct spending) atas pendapatan fungsional layanan untuk operasional.", reg9),
    ("Dokumen pengesahan pendapatan dan belanja BLU yang diajukan secara berkala ke KPPN adalah:", 
     "Surat Pengesahan Pendapatan dan Belanja BLU (SP3B-BLU / SP2B-BLU)", "Kuitansi pembelian biasa", "Faktur pajak masukan", "Daftar hadir pasien rumah sakit", "A", 
     "SP3B-BLU mengesahkan pendapatan dan belanja BLU agar terbukukan secara resmi dalam Laporan Keuangan BUN.", reg9),
    ("Berdasarkan pengesahan SP3B-BLU, KPPN menerbitkan dokumen perbendaharaan resmi berupa:", 
     "Surat Pengesahan Pendapatan dan Belanja (SP2D Pengesahan / SP4B)", "Cek tunai perbankan", "Tiket perjalanan dinas", "Buku tabungan baru", "A", 
     "KPPN menerbitkan SP2D Pengesahan untuk mengakui realisasi pendapatan dan belanja BLU dalam sistem SPAN.", reg9),
    ("Dokumen rencana bisnis dan anggaran tahunan yang disusun oleh pimpinan BLU disebut:", 
     "Rencana Bisnis dan Anggaran (RBA)", "Rencana Kerja Pemerintah (RKP)", "Daftar Isian Proyek", "Proposal Bantuan Modal", "A", 
     "RBA memuat rencana pendapatan, belanja, investasi, pembiayaan, dan target kinerja operasional BLU selama satu tahun anggaran.", reg9),
    ("Remunerasi pejabat pengelola dan pegawai BLU ditetapkan oleh:", 
     "Menteri Keuangan berdasarkan usulan Menteri/Pimpinan Lembaga teknis", "Kepala desa setempat", "Manajer cabang bank swasta", "Organisasi buruh internasional", "A", 
     "Menteri Keuangan menetapkan standar remunerasi BLU berdasarkan indikator kinerja, kontinuitas layanan, dan kemampuan finansial BLU.", reg9),
    ("Dewan yang bertugas melakukan pengawasan internal terhadap pengelolaan dan tata kelola BLU adalah:", 
     "Dewan Pengawas BLU", "Dewan Kelurahan", "Dewan Kesenian Daerah", "Dewan Pembina Yayasan", "A", 
     "Dewan Pengawas bertugas mengawasi pengelolaan BLU dan memberikan masukan strategis kepada pejabat pengelola.", reg9),
    ("Surplus anggaran operasional BLU pada akhir tahun anggaran dapat:", 
     "Digunakan kembali pada tahun anggaran berikutnya sebagai Saldo Awal Kas BLU", "Wajib disita seluruhnya oleh bank swasta", "Dibagi habis sebagai uang pesangon", "Dihapus dari catatan pembukuan", "A", 
     "Saldo kas surplus BLU dapat diakumulasikan dan digunakan kembali untuk membiayai layanan tahun anggaran berikutnya.", reg9),
    ("Fleksibilitas belanja BLU mengizinkan realisasi belanja melampaui pagu DIPA awal dengan syarat:", 
     "Didukung oleh realisasi pendapatan yang melampaui target dan berada dalam batas ambang fleksibilitas (flexibility threshold) yang ditetapkan DIPA", "Mendapat izin dari kepolisian", "Mengurangi gaji dokter spesialis", "Tanpa laporan pertanggungjawaban", "A", 
     "Belanja BLU dapat melampaui pagu DIPA sepanjang pendapatan bertambah dan berada dalam ambang batas fleksibilitas RBA.", reg9),
    ("Satuan pengawasan internal yang dibentuk di lingkungan BLU untuk audit kepatuhan operasional adalah:", 
     "Satuan Pengawasan Intern (SPI)", "Komisi Disiplin Mahasiswa", "Regu Ronda Malam", "Tim Sukses Pimpinan", "A", 
     "SPI berkedudukan langsung di bawah Pemimpin BLU untuk menjalankan fungsi audit internal dan evaluasi sistem kendali intern.", reg9),
    ("Pengelolaan kas BLU mengizinkan penempatan kas menganggur (idle cash) jangka pendek pada instrumen:", 
     "Deposito berjangka pada bank umum yang sehat atau Surat Berharga Negara (SBN)", "Investasi saham gorengan spekulatif", "Membeli mata uang kripto", "Meminjamkan ke rentenir pasar", "A", 
     "BLU diberikan wewenang optimalisasi kas jangka pendek (deposito bank sehat/SBN) dengan prinsip likuiditas dan keamanan modal.", reg9),
    ("Tarif layanan BLU diatur dan ditetapkan oleh:", 
     "Peraturan Menteri Keuangan (PMK) berdasarkan usulan kementerian teknis", "Peraturan Ketua RT", "Kesepakatan lisan perawat", "Hasil lelang terbuka di pasar", "A", 
     "Tarif layanan BLU ditetapkan melalui PMK dengan mempertimbangkan kontinuitas layanan, daya beli masyarakat, dan pemulihan biaya.", reg9),
    ("Pencabutan status BLU pada suatu instansi pemerintah dapat dilakukan apabila:", 
     "BLU tidak lagi memenuhi persyaratan substantif, teknis, atau kinerja keuangannya memburuk secara permanen", "Gedung kantor dicat warna biru", "Kepala kantor pensiun dini", "Pegawai mengikuti lomba lari", "A", 
     "Menteri Keuangan berwenang mencabut status BLU dan mengembalikannya menjadi satker biasa jika tata kelolanya tidak lagi layak.", reg9),
    ("Laporan Keuangan BLU diaudit secara independen oleh:", 
     "Kantor Akuntan Publik (KAP) independen dan Badan Pemeriksa Keuangan (BPK)", "Dinas Pendapatan Daerah", "Lembaga Swadaya Masyarakat lokal", "Pihak sponsor obat swasta", "A", 
     "Laporan keuangan BLU diaudit oleh KAP untuk audit kinerja tahunan dan dikonsolidasi dalam audit LKKL oleh BPK RI.", reg9),
    ("Ambang Batas Fleksibilitas (Flexibility Threshold) belanja BLU dihitung berdasarkan:", 
     "Persentase tertentu dari target pendapatan layanan yang tercantum dalam lembar pengesahan DIPA", "Jumlah seluruh pegawai honorer", "Luas area tanah kampus/rumah sakit", "Kapasitas tempat tidur pasien", "A", 
     "Ambang fleksibilitas berupa persentase toleransi belanja atas lonjakan pendapatan riil yang disahkan dalam DIPA BLU.", reg9),
    ("BLU diperkenankan melakukan utang jangka pendek untuk keperluan:", 
     "Menutup defisit kas operasional sehari-hari dengan jangka waktu pelunasan paling lama 1 tahun anggaran", "Membeli helikopter pribadi direktur", "Membayar dividen pejabat", "Membeli valuta asing di pasar gelap", "A", 
     "Pinjaman jangka pendek BLU hanya untuk likuiditas operasional dan wajib dilunasi dalam tahun anggaran berjalan.", reg9),
    ("Pengadaan barang/jasa pada BLU diatur dengan:", 
     "Peraturan Pemimpin BLU yang berpedoman pada prinsip efisiensi, transparansi, dan praktik bisnis yang sehat (Perpres PBJ)", "Bebas tanpa aturan pengadaan sama sekali", "Hukum perdagangan internasional saja", "Sistem arisan mingguan", "A", 
     "Pemimpin BLU berwenang menetapkan peraturan pengadaan internal yang fleksibel namun tetap mengedepankan value for money.", reg9)
]

t9_s = [
    ("Bagaimanakah alur pengesahan pendapatan dan belanja BLU pada aplikasi SAKTI hingga terbit SP2D Pengesahan dari KPPN?", 
     "Satker merekam SP3B-BLU di SAKTI -> Upload ke SPAN -> KPPN verifikasi kesesuaian pagu dan saldo kas -> Terbit SP2D Pengesahan", "Direktur menyerahkan kuitansi ke kantor pos -> Kantor pos mengirim uang ke bank", "KPPN mencairkan uang tunai ke rekening pribadi bendahara", "Bank Indonesia mentransfer saldo langsung ke kasir rumah sakit", "A", 
     "Alur SP3B: Perekaman pendapatan/belanja di Modul Pembayaran SAKTI -> Kirim ADK SP3B ke KPPN -> KPPN terbitkan SP2D Pengesahan elektronik.", reg9),
    ("Rumah Sakit BLU memperoleh lonjakan pendapatan layanan 130% dari target awal DIPA. Bagaimana mekanisme penyerapan belanja tambahan melampaui pagu?", 
     "Belanja dapat langsung dibelanjakan sepanjang masih dalam ambang batas fleksibilitas DIPA; jika melampaui ambang batas, wajib mengajukan revisi DIPA pengesahan ke Kanwil DJPb", "Tidak boleh dibelanjakan dan pasien harus ditolak", "Uang kas wajib diserahkan kepada yayasan sosial swasta", "Belanja dibayar secara sembunyi-sembunyi", "A", 
     "Belanja di atas ambang batas fleksibilitas wajib disahkan melalui revisi DIPA penambahan pagu belanja dari pendapatan BLU ke Kanwil DJPb.", reg9),
    ("Dalam hal BLU ingin melakukan investasi jangka panjang berupa penyertaan modal atau pembangunan gedung komersial, izin wajib diperoleh dari:", 
     "Menteri Keuangan Republik Indonesia", "Kepala Dinas Perizinan Kota", "Direktur Rumah Sakit tetangga", "Dewan Kehormatan Etik Medis", "A", 
     "Investasi jangka panjang BLU melibatkan kekayaan negara yang dipisahkan sehingga merupakan kewenangan persetujuan Menteri Keuangan.", reg9),
    ("Bagaimanakah perlakuan akuntansi atas aset tetap yang dibeli menggunakan dana swakelola pendapatan BLU (non-rupiah murni)?", 
     "Dicatat dan dilaporkan sebagai Aset Tetap Barang Milik Negara (BMN) pada Neraca BLU dan Neraca LKKL kementerian pembina", "Dicatat sebagai aset pribadi direktur", "Tidak boleh dicatat di neraca manapun", "Dicatat sebagai barang titipan swasta", "A", 
     "Seluruh aset yang dibeli dengan pendapatan operasional BLU adalah sah berstatus Barang Milik Negara (BMN).", reg9),
    ("Apa fungsi dari Key Performance Indicators (KPI) yang dituangkan dalam Kontrak Kinerja Pemimpin BLU dengan Menteri?", 
     "Mengukur capaian target mutu layanan publik, efisiensi operasional, kemandirian keuangan, dan kepatuhan tata kelola setiap tahun", "Menentukan besaran denda tilang kendaraan", "Menghitung jumlah hari libur pejabat", "Menggantikan ujian dinas ASN", "A", 
     "Kontrak kinerja pimpinan BLU memuat indikator layanan dan finansial yang menjadi dasar evaluasi status dan remunerasi pimpinan.", reg9),
    ("Bagaimanakah mekanisme pemanfaatan aset BMN pada BLU untuk disewakan kepada gerai ATM atau minimarket?", 
     "Pemimpin BLU menetapkan tarif sewa berdasarkan prinsip pasar wajar, menandatangani perjanjian sewa, dan hasil sewa dibukukan sebagai pendapatan BLU", "Uang sewa dibagi-bagikan ke staf administrasi", "KPKNL menyita gedung ATM tersebut", "Tanah BMN diberikan hak milik kepada pemilik minimarket", "A", 
     "Fleksibilitas BLU mengizinkan optimalisasi pemanfaatan BMN untuk layanan penunjang; hasilnya menjadi pendapatan operasional BLU.", reg9),
    ("Dalam hal BLU mengalami defisit kas likuiditas sementara di pertengahan tahun, solusi perbendaharaan internal yang sah adalah:", 
     "Memanfaatkan Saldo Kas Awal (silpa tahun lalu) atau mengajukan pinjaman jangka pendek antar-rekening BLU sesuai RBA", "Meminjam dana rentenir dengan bunga tinggi", "Menjual sertifikat tanah kantor", "Menghentikan seluruh layanan gawat darurat", "A", 
     "Likuiditas jangka pendek ditutup menggunakan cadangan kas operasional (saldo kas awal) atau pinjaman jangka pendek yang sah.", reg9),
    ("Mengapa laporan keuangan BLU wajib menyajikan Standar Akuntansi Keuangan (SAK) dan dikonversi ke Standar Akuntansi Pemerintahan (SAP)?", 
     "SAK digunakan untuk transparansi akuntabilitas korporasi bisnis layanan; konversi SAP diperlukan untuk konsolidasi ke LK Kementerian dan LKPP", "Supaya staf akuntansi memiliki dua pekerjaan sekaligus", "Karena auditor eksternal tidak memahami SAP", "Agar pembayaran pajak menjadi nihil", "A", 
     "BLU menerapkan 'dual reporting': laporan SAK untuk manajerial bisnis sehat, dan konversi SAP untuk konsolidasi neraca pemerintah pusat.", reg9),
    ("Apakah pejabat pengelola BLU dari kalangan profesional non-PNS berhak menerima remunerasi?", 
     "Berhak menerima remunerasi yang diatur dalam PMK Remunerasi BLU berkenaan dan diangkat berdasarkan perjanjian kerja kontrak", "Dilarang menerima gaji apapun", "Hanya diberikan uang makan siang", "Wajib bekerja secara sukarela tanpa imbalan", "A", 
     "BLU dapat merekrut tenaga profesional non-PNS yang menerima remunerasi setara sesuai keahlian dan kontrak kerja yang disahkan menteri.", reg9),
    ("Bagaimanakah prosedur penghapusan piutang macet pasien tidak mampu pada Rumah Sakit BLU?", 
     "Pemimpin BLU melakukan penagihan optimal, menetapkan kriteria piutang macet, dan memproses penghapusan bersyarat/mutlak sesuai limit kewenangan regulasi perbendaharaan", "Memaksa keluarga pasien berutang ke bank swasta", "Menahan jenazah pasien di ruang jenazah", "Menghapus catatan piutang tanpa berita acara", "A", 
     "Penghapusan piutang macet BLU diatur berjenjang (Pemimpin BLU, Menkeu) dengan verifikasi ketidakmampuan debitur secara humanis dan legal.", reg9),
    ("Apa yang dimaksud dengan Rekening Dana Kelolaan pada Satker BLU Pendidikan (Universitas)?", 
     "Rekening yang menampung dana abadi (endowment fund), dana riset kemitraan, atau dana beasiswa yang penggunaannya terikat tujuan khusus", "Rekening simpan pinjam dosen", "Rekening judi online kampus", "Rekening arisan mahasiswa", "A", 
     "Dana kelolaan menampung dana perikatan khusus (endowment/beasiswa) yang dipisahkan penatausahaannya dari kas operasional rutin.", reg9),
    ("Apakah Pemimpin BLU berwenang membuka rekening bank operasional baru tanpa izin KPPN?", 
     "Tetap wajib mendapatkan persetujuan pembukaan rekening dari Kuasa BUN (KPPN) dan dilaporkan dalam aplikasi SPRINT", "Bebas membuka rekening di bank manapun tanpa izin siapapun", "Cukup izin dari lurah setempat", "Boleh jika bank memberi bunga tinggi", "A", 
     "Meskipun fleksibel, seluruh rekening bank BLU tetap merupakan rekening pemerintah yang wajib memperoleh izin Kuasa BUN.", reg9),
    ("Bagaimanakah perlakuan atas kerugian usaha yang dialami oleh unit bisnis komersial BLU?", 
     "Dievaluasi oleh Dewan Pengawas dan Auditor Independen; jika akibat risiko bisnis wajar ditutup dari cadangan surplus, namun jika akibat kelalaian diproses ganti rugi", "Langsung diganti dengan uang APBN rupiah murni", "Kepala satker diberhentikan tanpa pembuktian", "Gedung unit bisnis dibakar", "A", 
     "Risiko bisnis BLU dikelola dengan cadangan risiko operasional; kelalaian penyelewengan ditindaklanjuti dengan sidang pertanggungjawaban.", reg9),
    ("Dalam audit kinerja tahunan BLU, aspek yang dievaluasi mencakup:", 
     "Kinerja Keuangan (rasio likuiditas, kemandirian) dan Kinerja Layanan (standar pelayanan minimal, kepuasan masyarakat)", "Hanya jumlah laba uang tunai yang terkumpul", "Jumlah mobil mewah yang dimiliki direktur", "Banyaknya spanduk promosi di jalan", "A", 
     "Maturitas BLU dinilai dari skor gabungan kinerja keuangan dan kinerja pelayanan publik (Standar Pelayanan Minimal / SPM).", reg9),
    ("Dokumen pengadaan yang menjadi pedoman pengadaan barang/jasa khusus di lingkungan BLU adalah:", 
     "Peraturan Direktur/Pemimpin BLU tentang Pedoman Pengadaan Barang/Jasa yang telah diselaraskan dengan LKPP", "Buku petunjuk toko online swasta", "Aturan lelang barang antik", "Buku teks hukum perdata Belanda", "A", 
     "Peraturan Pemimpin BLU mengatur proses bisnis PBJ yang adaptif terhadap kecepatan pelayanan (misal pengadaan obat darurat).", reg9),
    ("Apakah pendapatan hibah terikat (earmarked grant) yang diterima BLU dapat dialihkan untuk membiayai belanja lain?", 
     "Dilarang keras, hibah terikat wajib digunakan secara konsisten sesuai naskah perjanjian hibah dan dicatat terpisah", "Boleh dialihkan untuk rekreasi pejabat", "Boleh digunakan untuk membiayai pilkada", "Bebas digunakan untuk apa saja", "A", 
     "Hibah terikat wajib memenuhi asas peruntukan donor dan tidak boleh dicampuradukkan dengan belanja operasional umum.", reg9),
    ("Kapan Laporan Keuangan audited BLU wajib disampaikan kepada Menteri teknis dan Menteri Keuangan?", 
     "Paling lambat akhir bulan Februari tahun anggaran berikutnya untuk konsolidasi LKPP", "Boleh disampaikan 5 tahun kemudian", "Hanya jika BLU mengalami keuntungan", "Tidak wajib disampaikan", "A", 
     "LK auditan KAP wajib selesai tepat waktu pada triwulan I untuk keperluan konsolidasi laporan keuangan kementerian pembina.", reg9)
]

t9_a = [
    ("Analisis Kasus Keterlambatan Pengajuan SP3B-BLU Selama 3 Triwulan: Rumah Sakit BLU membelanjakan Rp 80 miliar dari pendapatan pasien namun tidak pernah mengajukan SP3B-BLU ke KPPN hingga bulan Oktober. Dampak fatal terhadap pembukuan keuangan negara adalah:", 
     "Realisasi pendapatan dan belanja negara tidak tercatat di SPAN (under-stated ratusan miliar), mendistorsi LRA APBN, dan KPPN berwenang menangguhkan layanan persetujuan penarikan kas", "Uang belanja otomatis disita polisi", "Dokter dilarang melakukan operasi medis", "Pasien rumah sakit dipulangkan paksa", "A", 
     "SP3B wajib diajukan tertib triwulanan; pengabaian pengesahan menyebabkan pembukuan kas negara salah saji masif dan sanksi penundaan layanan perbendaharaan.", reg9),
    ("Analisis Kasus Pembelian Alat Medis Canggih di Luar Rencana Bisnis dan Anggaran (RBA): Direktur RS BLU membeli alat MRI senilai Rp 25 miliar yang tidak pernah tercantum dalam RBA definitif dan melampaui batas ambang fleksibilitas. Penilaian auditor Itjen atas transaksi ini adalah:", 
     "Pelanggaran disiplin anggaran berat; belanja modal di luar RBA tanpa revisi DIPA pengesahan adalah belanja tanpa dasar otorisasi anggaran yang berindikasi kerugian negara", "Inovasi kepemimpinan yang luar biasa dan patut ditiru", "Tindakan legal karena rumah sakit memiliki banyak uang kas", "Bukan pelanggaran asalkan alatnya berguna", "A", 
     "RBA adalah batas legal otorisasi belanja BLU; belanja di luar RBA tanpa revisi DIPA melanggar prinsip kepatutan dan tata kelola keuangan negara.", reg9),
    ("Studi Kasus Pembagian Remunerasi Berdasarkan Laba Tanpa Memperhatikan Mutu Layanan: Universitas BLU membagikan bonus remunerasi Rp 15 miliar dari efisiensi kas, namun mutu akreditasi program studi anjlok dan banyak keluhan mahasiswa. Evaluasi Dewan Pengawas yang tepat adalah:", 
     "Remunerasi BLU tidak boleh dihitung semata dari saldo kas (profit), melainkan wajib dikaitkan berbobot dengan pemenuhan Standar Pelayanan Minimal (SPM) dan kepuasan publik", "Remunerasi dinaikkan dua kali lipat agar dosen senang", "Mahasiswa yang mengeluh dikeluarkan dari kampus", "Menutup jurusan yang akreditasinya turun", "A", 
     "Filosofi remunerasi BLU memadukan kinerja finansial dan indeks mutu layanan publik; membagikan bonus di atas kemunduran mutu melanggar esensi BLU.", reg9),
    ("Analisis Kasus Investasi Dana Abadi BLU pada Produk Investasi Bodong Berisiko Tinggi: Manajer investasi universitas menempatkan Rp 50 miliar dana abadi pada produk reksadana swasta tanpa izin dan mengalami kerugian total 80%. Implikasi hukum pertanggungjawaban adalah:", 
     "Pelanggaran berat larangan spekulasi keuangan negara; pengelola bertanggung jawab pribadi secara pidana korupsi dan perdata memulihkan total kerugian kas negara", "Kerugian dihapuskan sebagai sedekah pendidikan", "Kementerian Keuangan menanggung kerugian tersebut", "Dosen dan mahasiswa dipotong uang sakunya", "A", 
     "Optimalisasi kas BLU dibatasi mutlak pada instrumen bebas risiko pasar modal (risk-free assets); investasi spekulatif melanggar UU Keuangan Negara.", reg9),
    ("Analisis Kasus Sengketa Tarif Layanan Kesehatan Tanpa Penetapan PMK: Satker BLU menaikkan tarif rawat inap 50% hanya berdasarkan Surat Keputusan Direktur RS tanpa PMK Tarif dari Menteri Keuangan. Gugatan masyarakat di pengadilan tata usaha negara akan berakibat:", 
     "Kenaikan tarif dibatalkan demi hukum karena pungutan kepada masyarakat oleh instansi pemerintah wajib memiliki dasar hukum delegasi undang-undang (PMK Tarif)", "Masyarakat yang menggugat diwajibkan membayar denda", "Direktur rumah sakit diangkat menjadi menteri kesehatan", "Tarif otomatis disahkan oleh pengadilan", "A", 
     "Pasal 9 PP 23/2005 menetapkan tarif layanan BLU ditetapkan oleh Menteri Keuangan; penarikan tarif tanpa PMK adalah pungutan liar non-prosedural.", reg9),
    ("Analisis Kasus Penutupan Unit Usaha Komersial BLU yang Merugi Terus Menerus: Unit percetakan komersial milik BLU merugi Rp 500 juta per tahun selama 4 tahun berturut-turut. Rekomendasi strategis Dewan Pengawas kepada Pemimpin BLU adalah:", 
     "Melakukan restrukturisasi bisnis menyeluruh atau menutup/menghentikan operasional unit komersial agar tidak menggerus dana subsidi layanan publik pokok", "Meminjam uang kas rumah sakit untuk menutup kerugian", "Menaikkan harga cetak 1000%", "Meminta sumbangan dari pasien", "A", 
     "Unit bisnis BLU wajib berprinsip mandiri dan efisien; unit komersial yang defisit kronis wajib ditutup agar tidak membebani tugas pelayanan utama.", reg9),
    ("Analisis Kasus Penggunaan Rekening Pribadi Pejabat untuk Penampungan Biaya Pendaftaran Mahasiswa Baru: Panitia penerimaan mahasiswa baru menampung uang seleksi Rp 3 miliar di rekening Mandiri pribadi ketua panitia. Analisis hukum perbendaharaan adalah:", 
     "Pelanggaran hukum berat pemungutan penerimaan negara di luar rekening resmi berizin, berindikasi tindak pidana korupsi/penggelapan dana publik", "Tindakan efisiensi agar uang pendaftaran tidak terpotong pajak", "Diperbolehkan asal panitia bersumpah tidak korupsi", "Praktik yang sah dalam dunia pendidikan tinggi", "A", 
     "Seluruh penerimaan BLU wajib disetor ke Rekening Penerimaan BLU berizin Kuasa BUN; penampungan di rekening privat adalah delik korupsi serius.", reg9),
    ("Analisis Dampak Reklasifikasi Satker Biasa Menjadi Satker BLU terhadap Manajemen Belanja: Mengapa fleksibilitas direct spending BLU memangkas birokrasi pengadaan obat darurat rumah sakit dibanding satker APBN biasa?", 
     "Rumah sakit dapat langsung membayar tagihan farmasi seketika dari penerimaan loket tanpa harus menunggu proses penerbitan SP2D KPPN yang memakan waktu", "Karena rumah sakit tidak perlu membayar tagihan obat sama sekali", "Karena pabrik farmasi memberikan obat gratis kepada BLU", "Karena dokter boleh memproduksi obat sendiri", "A", 
     "Direct spending memotong rantai birokrasi perbendaharaan, menjamin pasokan obat darurat tidak terputus demi keselamatan nyawa pasien.", reg9),
    ("Analisis Kasus Pinjaman Jangka Panjang BLU untuk Membangun Gedung Rawat Inap: RS BLU ingin meminjam Rp 100 miliar ke bank umum dengan tenor 10 tahun. Syarat mutlak kelayakan perbendaharaan yang wajib dipenuhi adalah:", 
     "Mendapat persetujuan tertulis dari Menteri Keuangan dengan kajian rasio kecukupan arus kas pelunasan utang (Debt Service Coverage Ratio / DSCR) yang memadai", "Persetujuan dari kepala dinas kebersihan", "Menyerahkan sertifikat gedung rumah sakit sebagai jaminan gadai", "Janji lisan dari direktur perbankan", "A", 
     "Pinjaman jangka panjang BLU melibatkan komitmen multi-tahun yang mewajibkan izin Menkeu berbasis analisis kelayakan finansial DSCR.", reg9),
    ("Analisis Kasus Surplus Anggaran BLU yang Mengendap Tanpa Utilisasi (Excess Cash Stagnation): BLU memiliki cadangan kas Rp 300 miliar di rekening giro bank selama 5 tahun tanpa rencana investasi. Kebijakan Menteri Keuangan yang dapat diambil adalah:", 
     "Menarik sebagian saldo kas menganggur tersebut ke Rekening Kas Umum Negara (clawback) atau memerintahkan penempatan pada SBN untuk optimalisasi fiskal nasional", "Membiarkan bank komersial menikmati keuntungan uang gratis", "Membagikan dana kas kepada seluruh warga kota", "Membubarkan universitas secara mendadak", "A", 
     "Menteri Keuangan berwenang melakukan optimalisasi kas atas idle cash BLU yang stagnan untuk mendukung prioritas pembiayaan pembangunan nasional.", reg9),
    ("Analisis Peran Satuan Pengawasan Intern (SPI) dalam Mencegah Fraud Pengadaan Alat Kesehatan BLU: Mengapa auditor SPI harus terlibat dalam review spesifikasi teknis dan HPS sebelum lelang alat medis dimulai?", 
     "Mencegah penguncian spesifikasi (lock-in spec) yang mengarah ke vendor tertentu dan mendeteksi potensi mark-up harga sejak tahap perencanaan awal", "Supaya anggota SPI mendapat komisi dari distributor alat", "Untuk memperlambat jalannya proyek rumah sakit", "Agar dokter tidak dapat memilih alat medis yang bagus", "A", 
     "Probity audit oleh SPI pada tahap perencanaan memitigasi risiko kartel alat kesehatan dan memastikan persaingan usaha yang sehat dan efisien.", reg9),
    ("Analisis Kasus Pasien Gagal Bayar Akibat Krisis Finansial pada Rumah Sakit Pemerintah: Bagaimana mekanisme akuntansi pengakuan beban kerugian penurunan nilai piutang pada laporan keuangan BLU berbasis SAK?", 
     "Membentuk cadangan kerugian penurunan nilai (CKPN) piutang berdasarkan matriks probabilitas gagal bayar dan menyajikan beban CKPN di Laporan Operasional", "Menagih uang ke rumah keluarga pasien dengan kekerasan", "Menghapus nama pasien dari catatan rekam medis", "Mencatat piutang sebagai aset lancar abadi tanpa koreksi", "A", 
     "SAK mewajibkan impairment testing atas piutang usaha; pembentukan cadangan kerugian piutang menyajikan aset lancar secara jujur dan konservatif.", reg9),
    ("Analisis Kasus Penghentian Dewan Pengawas BLU Akibat Benturan Kepentingan: Seorang anggota Dewan Pengawas ternyata merupakan pemilik mayoritas perusahaan distributor obat utama rumah sakit berkenaan. Tindakan Menteri teknis yang berkepastian hukum adalah:", 
     "Memberhentikan anggota Dewan Pengawas tersebut seketika karena melanggar larangan benturan kepentingan dan etika tata kelola BLU", "Menunjuk anggota tersebut menjadi direktur utama rumah sakit", "Menaikkan honorarium dewan pengawas 100%", "Membiarkan karena itu urusan pribadi", "A", 
     "Dewan Pengawas wajib independen; kepemilikan bisnis yang bertransaksi dengan BLU adalah benturan kepentingan terlarang yang mewajibkan pemberhentian.", reg9),
    ("Analisis Evaluasi Kemandirian Finansial BLU (Cost Recovery Rate / CRR): Apa makna strategis jika angka rasio kemandirian sebuah politeknik BLU mencapai 85%?", 
     "Politeknik mampu membiayai 85% dari total kebutuhan operasionalnya dari pendapatan jasa layanan mandiri, mengurangi ketergantungan pada subsidi APBN rupiah murni", "Politeknik sudah berubah menjadi universitas swasta", "Biaya kuliah mahasiswa dinaikkan 85 kali lipat", "Semua dosen kehilangan status pegawai negeri", "A", 
     "Cost Recovery Rate mengukur tingkat kemandirian operasional BLU dalam menopang layanannya dari pendapatan fungsional tanpa membebani kas umum negara.", reg9),
    ("Analisis Kasus Pemanfaatan Lahan Tidur BLU Melalui Skema Bangun Guna Serah (BGS): Universitas BLU bekerjasama dengan BUMN membangun hotel edukasi di atas tanah BMN. Mengapa perjanjian BGS wajib disetujui Pengelola Barang?", 
     "Karena tanah berstatus BMN kekayaan negara yang tunduk pada UU Pengelolaan Barang Milik Negara dan jangka waktu konsesi mengikat aset publik jangka panjang", "Karena dekan universitas tidak boleh menandatangani kontrak", "Supaya hotel tersebut bebas dari pajak daerah", "Agar mahasiswa dapat menginap gratis selamanya", "A", 
     "Pemanfaatan BMN skema BGS di lingkungan BLU tetap berada dalam koridor hukum pengelolaan aset negara yang memerlukan otorisasi Pengelola Barang.", reg9),
    ("Analisis Transformasi Tata Kelola BLU Menuju World Class Public Service Agency: Mengapa digitalisasi sistem informasi manajemen rumah sakit (SIMRS) yang terintegrasi SAKTI meningkatkan akuntabilitas publik?", 
     "Menghubungkan rekam medis, billing kasir, inventaris obat, dan pelaporan keuangan secara realtime, menghilangkan kebocoran pendapatan loket dan antrean panjang", "Supaya rumah sakit tidak perlu mempekerjakan dokter", "Karena teknologi komputer dapat menyembuhkan penyakit secara gaib", "Untuk menaikkan tarif rawat inap secara sepihak", "A", 
     "Integrasi SIMRS dan sistem perbendaharaan digital menutup celah kebocoran kasir, mempercepat verifikasi klaim BPJS, dan memastikan transparansi keuangan publik.", reg9)
]

add_topic(t9, reg9, t9_m, t9_s, t9_a)

with open("scripts/p3_topics1_to_9.json", "w", encoding="utf-8") as f:
    json.dump(part3_questions, f, indent=2, ensure_ascii=False)
