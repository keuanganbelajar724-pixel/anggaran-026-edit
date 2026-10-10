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

# Load first 300 questions
with open("scripts/p3_topics1_to_6.json", "r", encoding="utf-8") as f:
    part3_questions = json.load(f)

print(f"Loaded existing {len(part3_questions)} questions.")
cur_num = 1351

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
# TOPIC 7: Akuntansi Pemerintahan SAP PP 71/2010 & Pelaporan BMN (1351 - 1400)
# ============================================================================
t7 = "Akuntansi Pemerintahan SAP PP 71/2010 & Pelaporan BMN"
reg7 = "PP No. 71/2010 tentang Standar Akuntansi Pemerintahan (SAP) jo PMK No. 181/PMK.05/2016 tentang Penatausahaan BMN"

t7_m = [
    ("Basis akuntansi yang digunakan dalam penyusunan Neraca dan Laporan Operasional (LO) pemerintah adalah:", 
     "Basis Akrual (Accrual Basis)", "Basis Kas Murni (Cash Basis)", "Basis Nilai Pasar", "Basis Estimasi Bebas", "A", 
     "SAP berbasis akrual mengakui pendapatan, beban, aset, kewajiban, dan ekuitas saat terjadinya transaksi ekonomi tanpa memandang kas diterima/dikeluarkan.", reg7),
    ("Laporan keuangan pokok yang disusun menggunakan Basis Kas adalah:", 
     "Laporan Realisasi Anggaran (LRA) dan Laporan Perubahan Saldo Anggaran Lebih (LPSAL)", "Neraca dan Laporan Operasional", "Laporan Perubahan Ekuitas", "Catatan atas Laporan Keuangan", "A", 
     "LRA dan LPSAL disusun menggunakan basis kas untuk membandingkan realisasi pendapatan dan belanja terhadap target DIPA/APBN.", reg7),
    ("Batas nilai minimum (kapitalisasi) untuk pengakuan suatu pengeluaran sebagai Aset Tetap Peralatan dan Mesin umumnya adalah:", 
     "Rp 1.000.000 (atau sesuai kebijakan akuntansi Kemenkeu)", "Rp 100.000", "Rp 50.000.000", "Rp 500.000.000", "A", 
     "Pengeluaran barang per unit di atas batas nilai kapitalisasi (kebijakan akuntansi Kemenkeu) dibukukan sebagai penambah Aset Tetap.", reg7),
    ("Barang Milik Negara (BMN) yang diperoleh dan tidak dapat disusutkan nilainya sepanjang masa adalah:", 
     "Tanah", "Gedung dan Bangunan", "Kendaraan Bermotor", "Komputer PC", "A", 
     "Tanah pemerintah tidak mengalami penyusutan (kecuali tanah yang memiliki batas waktu hak pakai atau mengalami penurunan fisik permanen).", reg7),
    ("Komponen Laporan Keuangan Pemerintah yang menyajikan posisi aset, kewajiban, dan ekuitas pada tanggal tertentu adalah:", 
     "Neraca", "Laporan Operasional", "Laporan Arus Kas", "Laporan Realisasi Anggaran", "A", 
     "Neraca menyajikan posisi keuangan entitas pemerintah mengenai aset, kewajiban, dan ekuitas dana pada tanggal pelaporan.", reg7),
    ("Persamaan dasar akuntansi neraca pemerintah yang benar adalah:", 
     "Aset = Kewajiban + Ekuitas", "Aset = Pendapatan - Belanja", "Ekuitas = Aset + Utang", "Kas = Belanja x Pajak", "A", 
     "Persamaan neraca: Total Aset pemerintah selalu seimbang dengan penjumlahan Total Kewajiban dan Total Ekuitas.", reg7),
    ("Metode penyusutan aset tetap yang paling umum digunakan dalam akuntansi instansi pemerintah pusat adalah:", 
     "Metode Garis Lurus (Straight Line Method)", "Metode Saldo Menurun Ganda", "Metode Jumlah Angka Tahun", "Metode Taksiran Pasar", "A", 
     "Metode garis lurus mengalokasikan beban penyusutan dalam jumlah yang sama setiap tahun selama masa manfaat aset.", reg7),
    ("Pengelolaan dan penetapan status penggunaan Barang Milik Negara (BMN) berada di bawah wewenang Pengelola Barang yaitu:", 
     "Menteri Keuangan Republik Indonesia", "Menteri Dalam Negeri", "Kepala Bappenas", "Gubernur Bank Indonesia", "A", 
     "Menteri Keuangan bertindak sebagai Pengelola Barang Milik Negara, sedangkan para Menteri/Pimpinan Lembaga adalah Pengguna Barang.", reg7),
    ("Pencatatan persediaan barang konsumsi kantor yang belum digunakan pada akhir periode dilaporkan dalam Neraca sebagai:", 
     "Aset Lancar (Persediaan)", "Aset Tetap", "Beban Operasional", "Kewajiban Jangka Pendek", "A", 
     "Sisa persediaan fisik pada akhir periode dibukukan sebagai Aset Lancar di Neraca berdasarkan hasil inventarisasi fisik (stock opname).", reg7),
    ("Opini tertinggi yang diberikan oleh Badan Pemeriksa Keuangan (BPK) atas Laporan Keuangan Kementerian/Lembaga adalah:", 
     "Wajar Tanpa Pengecualian (WTP)", "Wajar Dengan Pengecualian (WDP)", "Tidak Menyatakan Pendapat (Disclaimer)", "Tidak Wajar (Adverse)", "A", 
     "WTP (Unqualified Opinion) menyatakan bahwa laporan keuangan menyajikan secara wajar seluruh hal material sesuai SAP.", reg7),
    ("Laporan yang menyajikan surplus/defisit operasional dari kegiatan operasional pemerintah dalam satu periode adalah:", 
     "Laporan Operasional (LO)", "Laporan Arus Kas (LAK)", "Laporan Perubahan Ekuitas (LPE)", "Neraca Saldo", "A", 
     "Laporan Operasional menyajikan ikhtisar pendapatan-LO dan beban-LO yang menghasilkan surplus atau defisit operasional.", reg7),
    ("Catatan atas Laporan Keuangan (CaLK) berfungsi untuk:", 
     "Memberikan penjelasan naratif, analisis, dan rincian detail atas pos-pos yang tercantum dalam lembar muka laporan keuangan", "Menyimpan foto pegawai kantor", "Mencatat absensi harian staf akuntansi", "Menulis puisi sejarah berdirinya kantor", "A", 
     "CaLK memuat pengungkapan kebijakan fiskal, basis akuntansi, rincian akun, dan peristiwa penting (subsequent events).", reg7),
    ("Penghapusan BMN dari Buku Inventaris dan Neraca satker dapat dilakukan setelah terbit:", 
     "Surat Keputusan Persetujuan Penghapusan BMN dari Pengelola Barang / Pengguna Barang", "Izin lisan dari satpam kantor", "Surat tilang kepolisian", "Berita acara rapat staf", "A", 
     "Penghapusan BMN memerlukan penetapan surat keputusan penghapusan resmi dari pejabat yang berwenang sesuai limitasi nilai BMN.", reg7),
    ("Pemanfaatan BMN dalam bentuk Sewa menghasilkan penerimaan yang wajib disetor ke Kas Negara sebagai:", 
     "Penerimaan Negara Bukan Pajak (PNBP)", "Pendapatan Pajak Penghasilan", "Dana Hibah Luar Negeri", "Uang Kas Bendahara", "A", 
     "Hasil sewa BMN merupakan hak fiskal negara yang wajib disetorkan utuh ke Kas Negara sebagai PNBP.", reg7),
    ("Buku Besar Akuntansi (General Ledger) berisi:", 
     "Kumpulan akun-akun neraca dan laporan operasional yang memuat mutasi debet, kredit, dan saldo akhir transaksi", "Catatan nomor telepon rekanan", "Daftar hadir apel pagi", "Buku tamu dinas harian", "A", 
     "Buku besar merangkum seluruh jurnal transaksi keuangan per bagan akun standar untuk penyusunan laporan keuangan.", reg7),
    ("Koreksi kesalahan pencatatan transaksi belanja tahun anggaran yang telah ditutup dan diaudit dilaporkan pada akun:", 
     "Koreksi Ekuitas / Akun Ekuitas Neraca", "Beban Belanja Pegawai tahun berjalan", "Pendapatan Hibah", "Kas di Bank", "A", 
     "Sesuai SAP, koreksi kesalahan mendasar periode lalu yang telah diaudit dicatat langsung pada pos Ekuitas.", reg7),
    ("Rekonsiliasi eksternal Laporan Keuangan Kementerian/Lembaga dilakukan secara periodik dengan:", 
     "Ditjen Perbendaharaan (BUN) melalui KPPN dan Kanwil DJPb", "Kementerian Ketenagakerjaan", "Kantor Urusan Agama", "Dinas Pasar Tradisional", "A", 
     "Rekonsiliasi eksternal memadukan data transaksi satker dengan data pencatatan BUN pada Sistem Perbendaharaan dan Anggaran Negara.", reg7)
]

t7_s = [
    ("Bagaimanakah perlakuan akuntansi terhadap Aset Tak Berwujud (ATB) seperti software aplikasi sistem informasi yang dikembangkan satker?", 
     "Diamortisasi setiap tahun selama masa manfaat software dan dicatat pada pos Aset Lainnya di Neraca", "Disusutkan seperti tanah tanpa batas", "Dihapus seketika saat pembelian", "Dicatat sebagai utang jangka panjang", "A", 
     "Aset Tak Berwujud (software/lisensi) diakui di Aset Lainnya dan dialokasikan bebannya melalui amortisasi tahunan.", reg7),
    ("Dalam hal satker menerima hibah BMN berupa 5 unit mobil ambulans dari pemerintah daerah, jurnal akrual yang dicatat pada SAKTI adalah:", 
     "Debet: Aset Tetap Peralatan dan Mesin, Kredit: Pendapatan Hibah-LO", "Debet: Kas di Bendahara, Kredit: Utang Hibah", "Debet: Beban Hibah, Kredit: Piutang", "Tidak perlu dicatat karena barang bekas", "A", 
     "Penerimaan hibah aset non-kas menambah nilai Aset Tetap di Neraca dan diakui sebagai Pendapatan Hibah pada Laporan Operasional (LO).", reg7),
    ("Apa perbedaan perlakuan akuntansi antara Belanja Modal dan Belanja Barang Operasional?", 
     "Belanja Modal menghasilkan aset tetap yang masa manfaatnya > 12 bulan dan melebihi nilai kapitalisasi; Belanja Barang habis pakai dikonsumsi dalam 1 periode", "Belanja Modal dibayar dengan valuta asing, belanja barang dengan rupiah", "Belanja Modal tidak perlu diaudit BPK", "Belanja Barang selalu bernilai di atas Rp 1 miliar", "A", 
     "Belanja Modal dikapitalisasi ke Neraca menjadi Aset Tetap, sedangkan Belanja Barang diakui langsung sebagai Beban Persediaan/Jasa pada LO.", reg7),
    ("Bagaimanakah prosedur pemindahtanganan BMN melalui mekanisme Lelang Penjualan?", 
     "Penilaian nilai wajar BMN oleh Penilai Pemerintah -> Persetujuan Pengelola Barang -> Pelaksanaan lelang terbuka melalui KPKNL -> Penyetoran hasil lelang ke Kas Negara", "Pejabat langsung menjual ke pedagang rongsokan di pinggir jalan", "Membagikan BMN kepada keluarga pegawai", "Menukar BMN dengan beras", "A", 
     "Penjualan BMN wajib melalui lelang resmi di Kantor Pelayanan Kekayaan Negara dan Lelang (KPKNL) dengan harga limit penilaian wajar.", reg7),
    ("Apakah yang dimaksud dengan 'Konstruksi Dalam Pengerjaan' (KDP) pada Neraca pemerintah?", 
     "Aset tetap yang proses pembangunannya masih berlangsung pada tanggal neraca dan belum selesai 100% sehingga belum dapat disusutkan", "Gedung yang sudah runtuh", "Tanah yang disengketakan di pengadilan", "Jembatan yang tidak pernah dibangun", "A", 
     "KDP mencatat akumulasi biaya fisik proyek konstruksi yang belum selesai/belum BAST final pada tanggal penutupan laporan keuangan.", reg7),
    ("Jika barang persediaan obat-obatan di rumah sakit pemerintah telah kedaluwarsa, jurnal akuntansi yang tepat adalah:", 
     "Beban Persediaan Usang/Kedaluwarsa (LO) pada Persediaan Obat (Neraca), disertai Berita Acara Pemusnahan", "Mencatat sebagai pendapatan lain-lain", "Menambah nilai aset tetap tanah", "Menghapus catatan komputer tanpa berita acara", "A", 
     "Persediaan usang/rusak dikeluarkan dari neraca melalui pengakuan Beban Persediaan Usang didukung dokumen Berita Acara Pemusnahan/Karantina.", reg7),
    ("Dalam penyusunan Laporan Keuangan, apa yang dimaksud dengan 'Peristiwa Setelah Tanggal Pelaporan' (Subsequent Events)?", 
     "Peristiwa material yang terjadi antara tanggal neraca (31 Desember) dan tanggal penerbitan laporan keuangan yang memerlukan pengungkapan di CaLK", "Rapat evaluasi kerja tahun depan", "Pergantian menteri di masa depan", "Hari ulang tahun kantor", "A", 
     "Subsequent events (seperti bencana alam atau putusan inkracht pasca 31 Desember) wajib diungkapkan di CaLK jika mempengaruhi posisi keuangan.", reg7),
    ("Mengapa transaksi piutang macet PNBP wajib dibentuk 'Penyisihan Piutang Tak Tertagih' di Neraca?", 
     "Untuk menyajikan nilai bersih piutang yang realistis dapat ditagih (net realizable value) sesuai prinsip kehati-hatian akuntansi", "Agar pegawai tidak perlu menagih utang", "Supaya uang kas negara bertambah", "Untuk membebaskan debitur dari kewajiban", "A", 
     "Penyisihan piutang tak tertagih adalah estimasi penurunan nilai piutang agar neraca tidak menyajikan aset yang over-stated.", reg7),
    ("Bagaimanakah tata cara perlakuan BMN yang status fisiknya 'Hilang' akibat pencurian?", 
     "Menerbitkan Laporan Polisi, memproses Sidang Tuntutan Ganti Rugi (TP/TGR), menghentikan penyusutan, dan mengusulkan penghapusan aset", "Membeli barang palsu sebagai pengganti diam-diam", "Menuduh rekan kerja tanpa bukti", "Menghapus akun aset dari komputer tanpa jejak", "A", 
     "Barang hilang memerlukan pelaporan kepolisian, proses ganti rugi pejabat penanggung jawab, reklasifikasi ke aset lainnya, dan penghapusan resmi.", reg7),
    ("Apa fungsi dari aplikasi SIMAN (Sistem Informasi Manajemen Aset Negara)?", 
     "Mengelola siklus perencanaan, penggunaan, pemanfaatan, pemeliharaan, dan penghapusan BMN secara digital berbasis database DJKN", "Membeli tiket pesawat dinas", "Membayar pajak penghasilan", "Mengirim pesan instan antar-pegawai", "A", 
     "SIMAN adalah platform digital Ditjen Kekayaan Negara (DJKN) untuk standardisasi master aset dan tata kelola BMN nasional.", reg7),
    ("Dalam hal terjadi selisih antara LRA (basis kas) dan LO (basis akrual), penjelasan rekonsiliasi wajib disajikan pada:", 
     "Catatan atas Laporan Keuangan (CaLK) dalam Laporan Rekonsiliasi Realisasi Anggaran dan Laporan Operasional", "Buku harian satpam", "Kwitansi tanda terima belanja", "Surat kabar harian", "A", 
     "CaLK memuat tabel rekonsiliasi yang menjembatani selisih antara surplus/defisit LRA (kas) dengan surplus/defisit LO (akrual).", reg7),
    ("Apakah BMN yang berada dalam status 'Pemanfaatan Kerjasama Pemanfaatan (KSP)' tetap disusutkan oleh satker?", 
     "Ya, aset KSP tetap disusutkan oleh entitas pengguna barang selama masa pemanfaatan sesuai masa manfaatnya", "Tidak disusutkan sama sekali", "Penyusutan dibebankan ke mitra swasta", "Aset dihapus dari neraca", "A", 
     "BMN yang dimanfaatkan melalui KSP tetap menjadi milik negara dan dicatat serta disusutkan oleh pengguna barang di neraca.", reg7),
    ("Kapan suatu entitas pemerintah wajib menyusun Laporan Perubahan Ekuitas (LPE)?", 
     "Setiap periode pelaporan semesteran dan tahunan untuk menyajikan kenaikan/penurunan ekuitas akibat surplus/defisit LO dan koreksi", "Hanya 5 tahun sekali", "Ketika kantor akan ditutup", "Hanya saat satker mengalami kebangkrutan", "A", 
     "LPE adalah laporan keuangan pokok yang wajib disusun setiap periode pelaporan untuk merefleksikan perubahan kekayaan bersih negara.", reg7),
    ("Dalam inventarisasi BMN (sensus aset), berapa frekuensi pelaksanaan sensus BMN yang diwajibkan regulasi?", 
     "Paling sedikit 1 kali dalam 5 (lima) tahun untuk seluruh BMN yang dikuasai satker", "Setiap hari kerja", "Setiap 20 tahun sekali", "Tidak pernah diwajibkan", "A", 
     "Sensus BMN wajib diselenggarakan oleh pengguna barang minimal sekali dalam lima tahun guna mencocokkan fisik dan pembukuan.", reg7),
    ("Apa yang dimaksud dengan 'Aset Kemitraan dengan Pihak Ketiga' berupa Bangun Guna Serah (BGS / BOT)?", 
     "Pemanfaatan tanah BMN oleh mitra dengan mendirikan bangunan, digunakan mitra selama masa konsesi, lalu diserahkan utuh kepada pemerintah", "Penyewaan tanah untuk tempat pesta", "Penjualan tanah secara angsuran", "Pemberian tanah gratis kepada swasta", "A", 
     "BGS adalah skema Build-Operate-Transfer di mana fasilitas gedung yang dibangun swasta akan beralih menjadi BMN setelah masa konsesi berakhir.", reg7),
    ("Bagaimanakah perlakuan terhadap BMN Bersejarah (Heritage Assets) seperti museum atau gedung proklamasi?", 
     "Diungkapkan dalam CaLK mengenai kuantitas dan kondisi fisiknya, dan tidak disusutkan nilainya", "Dihancurkan untuk dibangun ruko", "Dilelang kepada pihak asing", "Disusutkan sampai nilainya nol", "A", 
     "Aset bersejarah diakui di neraca atau diungkapkan dalam CaLK tanpa penyusutan karena nilai kultural/historisnya yang tak ternilai.", reg7),
    ("Dokumen sumber yang menjadi dasar pengakuan Beban Pegawai pada Laporan Operasional (LO) adalah:", 
     "Daftar Gaji Induk dan Surat Perintah Membayar (SPM) Belanja Pegawai yang telah terbit hak tagihnya", "Kartu nama pejabat", "Surat lamaran kerja", "Ijazah sarjana", "A", 
     "Beban pegawai diakui saat timbulnya kewajiban pemerintah untuk membayar hak gaji/tunjangan ASN berdasarkan daftar gaji yang sah.", reg7)
]

t7_a = [
    ("Analisis Kasus Proyek Gedung Mangkrak (Konstruksi Dalam Pengerjaan Bermasalah): Pembangunan laboratorium mangkrak sejak 3 tahun lalu akibat kontraktor pailit (progres fisik 60%, nilai KDP Rp 12 miliar). Rekomendasi akuntansi dan hukum BMN yang wajib diambil KPA adalah:", 
     "Melakukan audit teknis konstruksi oleh BPKP/Kementerian PU, menuntaskan pemutusan kontrak, dan jika gedung tidak dapat dilanjutkan diusulkan penghapusan KDP dari neraca", "Membiarkan nilai KDP mengendap di neraca selamanya tanpa penjelasan", "Mengubah status KDP menjadi persediaan alat tulis", "Menjual besi tua bangunan tanpa izin lelang", "A", 
     "KDP mangkrak memerlukan audit kelayakan teknis; jika tidak dapat dilanjutkan, aset dihentikan dari penggunaan aktif dan diproses penghapusannya.", reg7),
    ("Analisis Temuan BPK 'Aset Tetap Tidak Diketahui Keberadaannya' (Untraceable Assets): BPK menemukan aset peralatan kantor senilai Rp 800 juta tercatat di neraca namun fisiknya tidak ditemukan di ruangan. Evaluasi langkah penertiban aset satker yang benar adalah:", 
     "Melakukan pelacakan inventaris fisik menyeluruh, memproses sidang ganti rugi (TP/TGR) bagi penanggung jawab ruangan, dan mereklasifikasi ke Aset Lainnya Rusak Berat/Hilang", "Menghapus data di aplikasi SIMAN secara diam-diam", "Meminjam barang dari satker tetangga saat BPK datang", "Membuat kuitansi pembelian palsu", "A", 
     "Aset hilang memerlukan investigasi fisik, penetapan tanggung jawab perdata/ganti rugi, penghentian pencatatan aktif, dan usul penghapusan legal.", reg7),
    ("Analisis Perbedaan Pengakuan Pendapatan LRA vs Pendapatan LO pada Sewa BMN Multi-Tahun: Satker menyewakan aula gedung selama 3 tahun senilai total Rp 300 juta yang dibayar tunai di muka tahun 2026. Pencatatan akuntansi yang benar pada tahun 2026 adalah:", 
     "Pendapatan LRA 2026 diakui penuh Rp 300 juta (basis kas); Pendapatan LO 2026 diakui Rp 100 juta dan sisanya Rp 200 juta dicatat sebagai Pendapatan Diterima di Muka (Kewajiban)", "LO diakui penuh Rp 300 juta dan LRA Rp 0", "Seluruh uang dicatat sebagai laba pribadi KPA", "Tidak dicatat di laporan manapun", "A", 
     "Basis kas mengakui pendapatan saat kas masuk (LRA Rp 300 jt); basis akrual mengakui pendapatan sesuai periode manfaatnya (LO Rp 100 jt per tahun).", reg7),
    ("Analisis Kasus Kapitalisasi Pengeluaran Pemeliharaan Gedung (Renovasi Besar): Satker merenovasi atap dan menambah 2 lantai gedung kantor senilai Rp 2 miliar. Mengapa pengeluaran ini wajib dikapitalisasi ke nilai aset tetap gedung, bukan dibebankan sebagai biaya pemeliharaan rutin?", 
     "Karena renovasi tersebut menambah masa manfaat, kapasitas, dan nilai ekonomis gedung secara signifikan melampaui batas nilai kapitalisasi kebijakan akuntansi", "Karena belanja pemeliharaan tidak ada pagunya", "Supaya gedung terlihat mewah di laporan", "Karena kontraktor meminta agar dicatat sebagai modal", "A", 
     "Pengeluaran yang memperpanjang masa manfaat atau meningkatkan kapasitas/mutu aset tetap wajib dikapitalisasi menambah nilai perolehan aset.", reg7),
    ("Analisis Kasus Tukar Menukar BMN (Ruislag Tanah Kantor): Pemerintah menukar tanah kantor lama di pusat kota dengan gedung baru di lokasi strategis yang dibangun pihak swasta. Syarat utama keabsahan akuntansi dan hukum ruislag adalah:", 
     "Mendapat persetujuan Presiden/DPR (jika melampaui limitasi nilai tertentu), penilaian wajar oleh Penilai Pemerintah, dan nilai aset pengganti minimal setara dengan aset negara yang dilepas", "Persetujuan lisan dari kepala desa setempat", "Mitra swasta memberikan uang pelicin kepada panitia", "Tanah kantor lama ditinggalkan begitu saja", "A", 
     "Tukar menukar BMN diatur ketat dalam PP Pengelolaan BMN: wajib menguntungkan negara, didukung kajian teknis, penilaian wajar, dan persetujuan otoritas tertinggi.", reg7),
    ("Analisis Implikasi Temuan Opini BPK 'Wajar Dengan Pengecualian' (WDP) Akibat Masalah Persediaan: Mengapa ketidakakuratan sensus fisik persediaan bahan logistik senilai miliaran rupiah dapat menjatuhkan opini LK Kementerian dari WTP menjadi WDP?", 
     "Karena ketidakpastian nilai persediaan mempengaruhi kewajaran saldo Aset Lancar di Neraca dan Beban Persediaan di LO secara material melampaui ambang batas salah saji BPK", "Karena auditor BPK tidak menyukai menteri terkait", "Karena persediaan barang tidak boleh disimpan di gudang", "Karena persediaan selalu dianggap sebagai tindak korupsi", "A", 
     "Persediaan yang tidak teruji validitas fisiknya menimbulkan salah saji material pada Neraca dan LO yang merusak kewajaran penyajian laporan keuangan.", reg7),
    ("Analisis Kasus Hibah Aset Pasca Proyek Kerjasama Luar Negeri: Proyek bantuan donor luar negeri selesai dan menyerahkan 20 unit kendaraan bermotor kepada kementerian. Mengapa aset ini dilarang digunakan sebelum status penetapannya disahkan?", 
     "Wajib dilakukan proses Berita Acara Serah Terima (BAST) hibah, registrasi BMN di SIMAN/SAKTI, dan penetapan status penggunaan (PSP) oleh Pengelola Barang agar sah secara hukum kekayaan negara", "Karena mobil hibah harus dicat ulang terlebih dahulu", "Karena plat nomor mobil luar negeri tidak berlaku di jalan", "Supaya mobil tidak cepat rusak", "A", 
     "Penggunaan BMN tanpa PSP melanggar tertib administrasi aset negara; hibah wajib dibukukan dan ditetapkan status penggunaannya secara resmi.", reg7),
    ("Analisis Penanganan BMN yang Berada di Luar Wilayah Satker (Idle Assets / Aset Menganggur): Satker memiliki gedung kantor di daerah yang tidak digunakan lagi pasca reorganisasi kantor. Kewajiban hukum Pengguna Barang atas aset menganggur tersebut adalah:", 
     "Menyerahkan BMN menganggur kepada Pengelola Barang (Menteri Keuangan c.q. DJKN) agar dapat dialihkan penggunaannya ke satker lain atau dimanfaatkan", "Membiarkan gedung lapuk dan diserobot warga", "Menyewakan gedung secara ilegal dan uangnya dibagi ke staf", "Menjual gedung tanpa persetujuan menteri", "A", 
     "Pasal 42 PP 27/2014 mewajibkan BMN yang tidak digunakan untuk tugas fungsi (idle) diserahkan kepada Pengelola Barang untuk optimalisasi aset negara.", reg7),
    ("Analisis Kasus Sengketa Kepemilikan Tanah Kantor Tanpa Sertifikat: Tanah kantor pengadilan seluas 2.000 m2 digugat warga karena belum bersertifikat atas nama Pemerintah RI. Langkah mitigasi hukum perbendaharaan dan pengamanan aset negara adalah:", 
     "Melakukan program pensertipikatan tanah BMN bekerjasama dengan Kementerian ATR/BPN, mengamankan bukti riwayat perolehan fisik, dan menyajikan pengungkapan sengketa di CaLK", "Menyerahkan tanah langsung kepada penggugat", "Membongkar kantor pengadilan di malam hari", "Membayar uang damai tanpa dasar hukum", "A", 
     "Pengamanan BMN meliputi aspek fisik, administratif, dan hukum: percepatan sertifikasi tanah atas nama Pemerintah RI dan litigasi pembuktian hak.", reg7),
    ("Analisis Penerapan Penyusutan BMN terhadap Perhitungan Fiskal Biaya Pelayanan Publik: Mengapa pencatatan beban penyusutan di Laporan Operasional (LO) penting dalam mengukur total biaya pelayanan publik (cost of public services)?", 
     "Menyajikan konsumsi nilai ekonomi aset riil yang terpakai dalam memberikan layanan, memungkinkan perhitungan unit cost layanan secara akurat dan transparan", "Supaya laba pemerintah terlihat kecil", "Untuk mengurangi setoran pajak perusahaan swasta", "Menambah anggaran belanja modal satker", "A", 
     "Beban penyusutan merefleksikan depresiasi fisik fasilitas publik; esensial untuk penetapan tarif layanan berbasis pemulihan biaya (cost recovery).", reg7),
    ("Analisis Dampak Rekonsiliasi Internal SIMAN-SAKTI terhadap Akurasi Laporan Keuangan: Mengapa ketidakcocokan data antara master aset SIMAN dan modul aset SAKTI menimbulkan anomali pada LKKL?", 
     "Menimbulkan ketidaksinkronan data buku pembantu BMN dengan neraca keuangan, memicu temuan kelemahan Sistem Pengendalian Intern (SPI) oleh auditor eksternal", "Membuat server internet kementerian terputus", "Menghapus nomor rekening bank bendahara", "Membatalkan seluruh sertifikat tanah kantor", "A", 
     "Integrasi SIMAN dan SAKTI memastikan single source of truth data kekayaan negara antara pengelola barang dan akuntansi perbendaharaan.", reg7),
    ("Analisis Kasus Pemanfaatan BMN Bangun Serah Guna (BSG) yang Mengalami Default: Mitra swasta pengembang hotel di atas tanah BMN berhenti beroperasi karena krisis finansial di tahun ke-5 dari 20 tahun kontrak. Hak dan langkah hukum pemerintah adalah:", 
     "Membatalkan perjanjian BSG, menyita seluruh bangunan hotel yang telah berdiri menjadi BMN utuh, dan mencairkan Jaminan Pelaksanaan mitra ke Kas Negara", "Membayar utang-utang perusahaan mitra swasta", "Meminta maaf kepada direktur mitra", "Membiarkan tanah dikuasai bank pemberi kredit mitra", "A", 
     "Klausul default perjanjian pemanfaatan BMN memberikan hak mutlak negara mengambil alih kepemilikan bangunan fasilitas tanpa kompensasi kerugian.", reg7),
    ("Analisis Kasus Pembebanan Biaya Perolehan Aset Tetap secara Lumsum: Satker membeli sebidang tanah beserta bangunan gedung tua di atasnya dengan satu harga gelondongan Rp 5 miliar. Cara pemisahan nilai perolehan kedua aset tersebut di Neraca adalah:", 
     "Mengalokasikan nilai perolehan berdasarkan perbandingan nilai wajar/nilai NJOP masing-masing aset (tanah vs bangunan) dari hasil penilaian appraisal", "Mencatat semuanya sebagai nilai tanah saja", "Mencatat semuanya sebagai nilai gedung saja", "Membagi dua sama rata masing-masing Rp 2,5 miliar tanpa dasar penilaian", "A", 
     "Pembelian lumsum mewajibkan alokasi nilai berbasis proporsi nilai wajar appraisal independen/NJOP agar perlakuan penyusutan bangunan tepat.", reg7),
    ("Analisis Pengakuan Kewajiban Estimasi Penuntasan Lingkungan (Decommissioning / Environmental Liability): Satker pertambangan nuklir memiliki reaktor riset. Mengapa biaya restorasi dan pembersihan lingkungan di masa depan wajib diakui sebagai kewajiban di Neraca saat ini?", 
     "Prinsip akrual SAP mewajibkan pengakuan liabilitas kontinjensi/estimasi atas dampak lingkungan yang timbul dari pengoperasian aset publik saat ini", "Supaya kementerian terlihat ramah lingkungan di koran", "Karena diperintahkan oleh bank swasta", "Agar pegawai mendapatkan tunjangan bahaya radiasi", "A", 
     "Kewajiban lingkungan adalah komitmen legal masa depan akibat aktivitas operasi saat ini; wajib disajikan sebagai provisi/liabilitas di neraca.", reg7),
    ("Analisis Kasus Penyerahan Aset Eks BPPN / Eks BLBI kepada Kementerian/Lembaga (Penetapan Status): Satker menerima kompleks perkantoran sitaan Satgas BLBI. Mengapa penerimaan ini dicatat sebagai transaksi Penerimaan Aset dari BUN, bukan pendapatan belanja modal?", 
     "Karena aset diperoleh dari penyelesaian hak tagih negara oleh BUN dan dialokasikan melalui mekanisme penetapan status penggunaan antar-entitas pemerintah pusat", "Karena satker membeli gedung tersebut dari dana APBN", "Karena gedung tersebut dibangun oleh pegawai satker", "Karena mantan pemilik tanah menyumbangkan secara sukarela", "A", 
     "Aset sitaan BLBI adalah aset kelolaan BUN; pengalihan ke K/L dibukukan sebagai transfer masuk internal pemerintah pusat tanpa aliran kas belanja.", reg7),
    ("Analisis Evaluasi Efektivitas Digitalisasi Pengelolaan BMN terhadap Transparansi Fiskal: Mengapa sertifikasi tanah BMN dan pemindaian QR-Code barcode fisik aset menurunkan angka sengketa tanah negara?", 
     "Memberikan kepastian hukum alas hak kepemilikan negara, memudahkan audit fisik BPK, dan mencegah okupasi ilegal atau mafia tanah", "Karena stiker QR-Code memiliki kekuatan magis", "Karena harga tanah otomatis turun", "Supaya sertifikat tanah dapat digadaikan ke bank", "A", 
     "Sertifikasi dan digital barcode mengamankan kepemilikan yuridis dan fisik aset negara dari klaim pihak ketiga dan penyerobotan liar.", reg7)
]

add_topic(t7, reg7, t7_m, t7_s, t7_a)

with open("scripts/p3_topics1_to_7.json", "w", encoding="utf-8") as f:
    json.dump(part3_questions, f, indent=2, ensure_ascii=False)
