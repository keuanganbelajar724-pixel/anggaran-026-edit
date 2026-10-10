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

questions = []
cur_num = 1551

def add_topic(topic, reg, mudah, sedang, analisis):
    global cur_num, questions
    for it in mudah:
        questions.append(q(cur_num, topic, "MUDAH", it[0], it[1], it[2], it[3], it[4], it[5], it[6], reg))
        cur_num += 1
    for it in sedang:
        questions.append(q(cur_num, topic, "SEDANG", it[0], it[1], it[2], it[3], it[4], it[5], it[6], reg))
        cur_num += 1
    for it in analisis:
        questions.append(q(cur_num, topic, "ANALISIS", it[0], it[1], it[2], it[3], it[4], it[5], it[6], reg))
        cur_num += 1
    print(f"Added {topic}, current count: {len(questions)}")

# ============================================================================
# TOPIC 11: Tuntutan Perbendaharaan & Tuntutan Ganti Rugi (TP/TGR) (1551 - 1600)
# ============================================================================
t11 = "Tuntutan Perbendaharaan & Tuntutan Ganti Rugi (TP/TGR)"
reg11 = "UU No. 1/2004 tentang Perbendaharaan Negara jo PP No. 38/2016 jo BPK RI tentang Tata Cara TP/TGR"

t11_m = [
    ("Proses penuntutan ganti rugi keuangan negara yang dikenakan secara khusus kepada Bendahara disebut:", 
     "Tuntutan Perbendaharaan (TP)", "Tuntutan Ganti Rugi (TGR)", "Gugatan Perdata Biasa", "Sanksi Moral Adat", "A", 
     "Tuntutan Perbendaharaan (TP) dikenakan kepada Bendahara, sedangkan Tuntutan Ganti Rugi (TGR) dikenakan kepada pegawai non-bendahara/pejabat lain.", reg11),
    ("Tuntutan Ganti Rugi (TGR) dikenakan kepada:", 
     "Pegawai Negeri Sipil atau pejabat bukan bendahara yang melakukan perbuatan melawan hukum/kelalaian yang merugikan keuangan negara", "Masyarakat umum pengguna jalan", "Warga negara asing yang berlibur", "Pedagang kaki lima di luar kantor", "A", 
     "TGR diberlakukan bagi ASN/pejabat bukan bendahara yang perbuatannya mengakibatkan kerugian negara.", reg11),
    ("Lembaga yang berwenang menetapkan Surat Keputusan Pembebanan Penggantian Kerugian Negara bagi Bendahara adalah:", 
     "Badan Pemeriksa Keuangan (BPK RI)", "Dinas Ketenagakerjaan", "Kantor Pos Pusat", "Bank Indonesia", "A", 
     "Pasal 62 UU 1/2004 menetapkan BPK berwenang menetapkan pembebanan penggantian kerugian negara terhadap bendahara.", reg11),
    ("Dokumen pengakuan utang sukarela yang ditandatangani oleh pegawai yang merugikan keuangan negara disebut:", 
     "Surat Keterangan Tanggung Jawab Mutlak (SKTJM)", "Kwitansi tanda terima uang", "Akta pendirian usaha", "Surat izin cuti tahunan", "A", 
     "SKTJM adalah surat pernyataan legal kesediaan mengganti kerugian negara secara sukarela dan mengikat jaminan kebendaan.", reg11),
    ("Jangka waktu maksimal pelunasan kerugian negara melalui mekanisme SKTJM adalah:", 
     "Paling lama 24 (dua puluh empat) bulan sejak ditandatangani", "Paling lama 1 bulan", "Paling lama 10 tahun", "Seumur hidup", "A", 
     "Pelunasan kerugian negara via SKTJM wajib diselesaikan paling lambat 24 bulan (2 tahun) dan dijamin dengan agunan yang sah.", reg11),
    ("Majelis internal di lingkungan kementerian/lembaga yang menyidangkan kasus kerugian negara non-bendahara disebut:", 
     "Majelis Pertimbangan Tuntutan Ganti Rugi (MP-TGR)", "Majelis Kehormatan Guru", "Sidang Pleno Partai", "Dewan Keamanan PBB", "A", 
     "MP-TGR dibentuk pimpinan instansi untuk memeriksa fakta kerugian negara dan merekomendasikan pembebanan ganti rugi.", reg11),
    ("Kekurangan uang, surat berharga, atau barang yang nyata dan pasti jumlahnya sebagai akibat perbuatan melawan hukum disebut:", 
     "Kerugian Keuangan Negara", "Surplus Belanja Operasional", "Investasi Jangka Panjang", "Hadiah Kinerja Fiskal", "A", 
     "Pasal 1 angka 22 UU 1/2004 mendefinisikan Kerugian Negara sebagai kekurangan uang/barang nyata dan pasti akibat kelalaian/perbuatan melawan hukum.", reg11),
    ("Apabila pihak yang bersalah menolak menandatangani SKTJM, langkah hukum penuntutan yang diterbitkan adalah:", 
     "Surat Keputusan Pembebanan Penggantian Kerugian Sementara (SKP2KS) atau SK Pembebanan Final", "Memberikan pengampunan cuma-cuma", "Membiarkan kasus kedaluwarsa", "Menghapus nama pegawai dari daftar hadir", "A", 
     "Penolakan SKTJM memicu penerbitan SK Pembebanan sepihak yang berkekuatan eksekutorial untuk penyitaan aset penjamin.", reg11),
    ("Harta benda milik pegawai yang dapat dijadikan agunan/jaminan dalam SKTJM meliputi:", 
     "Sertifikat tanah, Bukti Kepemilikan Kendaraan Bermotor (BPKB), atau aset bernilai setara", "Foto keluarga besar", "Ijazah taman kanak-kanak", "Koleksi buku komik", "A", 
     "Agunan SKTJM wajib berupa aset riil bernilai likuid yang dinilai cukup untuk menutupi total nominal kerugian negara.", reg11),
    ("Penyetoran cicilan pelunasan kerugian negara disetorkan ke:", 
     "Kas Negara sebagai Penerimaan Negara Bukan Pajak (PNBP) dengan akun TGR", "Rekening tabungan kepala kantor", "Brankas kas kecil bendahara", "Dompet pribadi pemeriksa", "A", 
     "Setoran ganti rugi negara disetor via e-Billing ke Rekening Kas Umum Negara dengan kode akun penerimaan pengembalian kerugian negara.", reg11),
    ("Apakah pengembalian kerugian keuangan negara melalui TP/TGR secara otomatis menghapus tuntutan pidana korupsi?", 
     "Tidak menghapuskan pidana jika terbukti ada unsur kesengajaan perbuatan melawan hukum (Pasal 4 UU Tipikor)", "Ya, pidana langsung gugur 100%", "Semua kasus korupsi langsung ditutup", "Tergantung keputusan lurah", "A", 
     "Pasal 4 UU Tipikor menegaskan pengembalian kerugian keuangan negara tidak menghapuskan dipidananya pelaku tindak pidana korupsi.", reg11),
    ("Kewajiban pelaporan berkala perkembangan penyelesaian TP/TGR disampaikan oleh pimpinan instansi kepada:", 
     "Badan Pemeriksa Keuangan (BPK) dan Menteri Keuangan", "Kantor Kelurahan setempat", "Lembaga Sensor Film", "Asosiasi Pedagang Pasar", "A", 
     "Pimpinan instansi wajib melaporkan progres penagihan dan pemulihan kerugian negara semesteran kepada BPK RI dan Kemenkeu.", reg11),
    ("Jika pegawai penanggung jawab TGR meninggal dunia sebelum melunasi ganti rugi, kewajiban pelunasan:", 
     "Beralih kepada ahli waris sebatas harta warisan yang ditinggalkan oleh yang bersangkutan", "Gugur dan dianggap lunas seketika", "Ditanggung oleh seluruh rekan kerja sekantor", "Ditagihkan ke tetangga sebelah rumah", "A", 
     "Kewajiban perdata ganti rugi beralih kepada ahli waris sebatas nilai harta peninggalan/warisan yang diterima ahli waris.", reg11),
    ("Jangka waktu kedaluwarsa penuntutan ganti rugi perbendaharaan negara adalah:", 
     "Gugur setelah 5 (lima) tahun sejak diketahui adanya kerugian negara atau 20 (dua puluh) tahun sejak terjadinya perbuatan", "Gugur setelah 6 bulan", "Tidak pernah kedaluwarsa selamanya", "Gugur saat tahun berganti", "A", 
     "Pasal 65 UU 1/2004 mengatur batas kedaluwarsa kewajiban bendahara/pegawai mengganti kerugian negara.", reg11),
    ("Informasi mengenai kerugian negara dapat bersumber dari:", 
     "Hasil Pemeriksaan BPK, Pengawasan APIP (Inspektorat), atau Laporan Hasil Pemeriksaan Kas Atasan Langsung", "Gosip di warung kopi", "Komentar anonim media sosial", "Surat tanpa identitas", "A", 
     "Sumber resmi kerugian negara berasal dari LHP BPK, LHA Inspektorat Jenderal, verifikasi atasan langsung, atau pengakuan tertulis.", reg11),
    ("Surat tanda lunas atas penyelesaian ganti rugi negara diterbitkan oleh:", 
     "Pimpinan Kementerian/Lembaga atau BPK setelah seluruh kewajiban kerugian disetor lunas ke Kas Negara", "Petugas parkir bank", "Kepala seksi logistik", "Bendahara pengeluaran secara lisan", "A", 
     "Surat Keterangan Lunas (SKL) resmi memulihkan nama baik dan mengembalikan dokumen agunan yang diserahkan dalam SKTJM.", reg11),
    ("Pemberhentian penyitaan agunan atau penghapusan mutlak piutang TGR dapat dilakukan apabila:", 
     "Debitur telah melunasi seluruh kewajibannya atau telah dinyatakan pailit dan tidak memiliki harta warisan apapun sesuai PMK", "Debitur pindah agama", "Debitur berganti nama", "Debitur mencalonkan diri sebagai anggota dewan", "A", 
     "Penghapusan mutlak hanya dapat diproses setelah melalui upaya penagihan maksimal dan pembuktian kemiskinan/ketiadaan harta waris.", reg11)
]

t11_s = [
    ("Bagaimanakah alur penanganan kerugian negara akibat ketekoran kas bendahara yang ditemukan oleh auditor BPK?", 
     "BPK menerbitkan LHP -> Atasan langsung meminta klarifikasi -> Jika ada kerugian, diterbitkan SKTJM atau diteruskan ke BPK untuk terbit SK Pembebanan TP", "Bendahara langsung dipecat tanpa pemeriksaan", "Uang kas kantor ditutup dengan dana talangan bank swasta", "Menunggu hingga 10 tahun untuk diaudit ulang", "A", 
     "Alur TP: Temuan LHP BPK -> Klarifikasi fakta dan uji materiil -> Upaya damai SKTJM -> Sidang penetapan pembebanan TP oleh BPK RI.", reg11),
    ("Bendahara pembantu kehilangan uang kas perjalanan dinas Rp 30 juta di mobil dinas karena kaca mobil dipecah perampok. Langkah administratif pertama adalah:", 
     "Melaporkan peristiwa perampokan ke kantor kepolisian terdekat untuk Berita Acara Pemeriksaan (BAP) dan melapor tertulis ke KPA/PPK dalam 1x24 jam", "Menutup mulut dan pura-pura tidak tahu", "Mengganti dengan uang palsu", "Menjual laptop kantor secara diam-diam", "A", 
     "Kehilangan kas akibat kejahatan wajib segera dilaporkan ke Kepolisian guna pembuktian force majeure atau kelalaian dalam sidang MP-TGR.", reg11),
    ("Dalam hal penanggung jawab TGR menyepakati SKTJM dengan cicilan pemotongan gaji bulanan, batas maksimal potongan gaji ASN per bulan adalah:", 
     "Maksimal 50% dari total penghasilan bersih bulanan agar tetap menjamin kebutuhan dasar hidup pegawai bersangkutan", "Dipotong 100% tanpa sisa", "Dipotong 90%", "Hanya dipotong uang makan saja", "A", 
     "Prinsip pemotongan penghasilan untuk pelunasan TGR dibatasi maksimal 50% agar pegawai tetap memiliki nafkah layak keluarga.", reg11),
    ("Bagaimanakah penyelesaian kasus jika pegawai yang menandatangani SKTJM wanprestasi (menunggak cicilan lebih dari 3 bulan)?", 
     "Instansi menyerahkan pengurusan penagihan piutang negara kepada Panitia Urusan Piutang Negara (PUPN) / KPKNL untuk eksekusi sita agunan", "Membiarkan penunggak cicilan hidup bebas", "Menyewa penagih utang preman jalanan", "Menghapus sisa utang secara diam-diam", "A", 
     "SKTJM macet diserahkan ke PUPN/KPKNL yang memiliki surat paksa eksekusi dan kewenangan lelang sita jaminan kebendaan.", reg11),
    ("Apa perbedaan perlakuan hukum antara 'Kelalaian Berat' (Gross Negligence) dan 'Unsur Kesengajaan' (Intentional Malice) dalam kerugian negara?", 
     "Kelalaian berat diselesaikan via pemulihan ganti rugi perdata administratif; Unsur kesengajaan/korupsi wajib dilimpahkan ke Aparat Penegak Hukum (APH)", "Kelalaian berat dihukum mati, kesengajaan dimaafkan", "Tidak ada perbedaan", "Keduanya diselesaikan di pengadilan agama", "A", 
     "Kelalaian murni tanpa niat jahat ditangani via mekanisme TP/TGR, sedangkan niat jahat/fraud wajib diproses hukum pidana tipikor.", reg11),
    ("Dalam kasus hilangnya laptop dinas yang dipegang oleh staf administrasi saat bertugas, penetapan nilai ganti rugi didasarkan pada:", 
     "Nilai buku / nilai wajar laptop pada saat terjadinya kehilangan sesuai penilaian penilai pemerintah, bukan nilai beli baru awal", "Harga laptop termahal di toko elektronik", "Harga perkiraan mimpi bendahara", "Nol rupiah karena barang bekas", "A", 
     "Ganti rugi barang didasarkan pada nilai sisa buku atau nilai pasar wajar saat barang hilang dengan mempertimbangkan depresiasi fisik.", reg11),
    ("Siapakah yang memimpin sidang Majelis Pertimbangan Tuntutan Ganti Rugi (MP-TGR) di kementerian?", 
     "Sekretaris Jenderal / Sekretaris Utama kementerian sebagai Ketua Majelis dengan Inspektur Jenderal sebagai Wakil Ketua", "Staf arsip kantor", "Ketua RT tempat kantor berada", "Penyedia barang pihak ketiga", "A", 
     "MP-TGR dipimpin pejabat eselon I (Sekjen) didampingi Itjen dan Biro Hukum untuk menjamin kepastian dan wibawa keputusan hukum majelis.", reg11),
    ("Apakah penjamin (guarantor) pribadi dapat dituntut jika pegawai penanggung jawab TGR melarikan diri?", 
     "Dapat dituntut apabila pihak penjamin telah menandatangani surat pernyataan kesanggupan menanggung kerugian secara tertulis di hadapan notaris/pejabat", "Tidak bisa karena utang tidak boleh dialihkan", "Penjamin otomatis masuk penjara", "Hanya jika penjamin memiliki hubungan saudara", "A", 
     "Surat jaminan pihak ketiga (borgtocht) mengikat penjamin secara hukum perdata untuk melunasi kewajiban debitur yang ingkar janji.", reg11),
    ("Dalam pemeriksaan kas (kas opname) akhir tahun, ditemukan ketekoran kas di brankas bendahara sebesar Rp 15 juta. Tindakan seketika yang wajib diambil KPA adalah:", 
     "Membuat Berita Acara Pemeriksaan Kas, memerintahkan bendahara menyetor uang tekor ke Kas Negara dalam 1x24 jam, dan mencopot sementara hak kelola kasnya", "Meminjamkan uang kantor lain tanpa kwitansi", "Mengabaikan selisih karena nilainya kecil", "Mengubah angka di pembukuan menjadi klop", "A", 
     "Ketekoran kas brankas adalah bukti pelanggaran material yang mewajibkan penyetoran ganti rugi seketika dan penonaktifan akses kas.", reg11),
    ("Bagaimanakah status hukum Barang Jaminan (Agunan SKTJM) selama masa angsuran cicilan berlangsung?", 
     "Dokumen kepemilikan asli disimpan di brankas kantor instansi/KPKNL dan dibebani hak tanggungan/fidusia sampai cicilan lunas 100%", "Diserahkan kembali kepada debitur untuk dijual", "Digadaikan ke pihak swasta", "Dibuang ke laut", "A", 
     "Agunan asli ditahan resmi dan diikat hak jaminan hukum untuk mencegah debitur memindahtangankan aset jaminan selama proses cicilan.", reg11),
    ("Jika seorang PNS menolak putusan pembebanan TGR yang ditetapkan oleh Pimpinan Instansi, upaya hukum yang dapat ditempuh adalah:", 
     "Mengajukan gugatan keberatan ke Pengadilan Tata Usaha Negara (PTUN) sesuai ketentuan hukum administrasi negara", "Membakar kantor instansi", "Mengadu ke media sosial pribadi", "Menolak masuk kerja selamanya", "A", 
     "SK Pembebanan TGR adalah Keputusan Tata Usaha Negara (KTUN) yang dapat diuji keabsahannya melalui gugatan administratif di PTUN.", reg11),
    ("Apakah BPK berwenang melakukan sita eksekusi langsung atas aset bendahara yang merugikan negara?", 
     "BPK menyerahkan eksekusi pembebanan kepada instansi yang bersangkutan dan Panitia Urusan Piutang Negara (PUPN) untuk penagihan dan penyitaan", "BPK menyita sendiri menggunakan mobil pribadi auditor", "BPK menembak jatuh debitur", "BPK tidak berwenang meminta ganti rugi", "A", 
     "Eksekusi penyitaan fisik aset perbendaharaan dilaksanakan melalui instrumen PUPN/KPKNL berdasarkan surat paksa berirah-irah 'Demi Keadilan'.", reg11),
    ("Dalam kasus pembayaran fiktif honorarium kegiatan senilai Rp 50 juta yang dinikmati bersama oleh 5 orang staf, penetapan ganti rugi adalah:", 
     "Masing-masing staf dibebani kewajiban ganti rugi secara proporsional sesuai jumlah uang haram yang dinikmati atau tanggung renteng", "Hanya staf paling junior yang memikul seluruh ganti rugi", "Dihapuskan karena dinikmati bersama", "Kepala kantor yang harus membayar seluruhnya", "A", 
     "Tanggung jawab pengembalian dibebankan proporsional kepada para penerima manfaat atau secara tanggung renteng (hoofdelijk) jika bersengkongkol.", reg11),
    ("Kapan Surat Keterangan Tanggung Jawab Mutlak (SKTJM) dinyatakan batal demi hukum?", 
     "Apabila terbukti dibuat di bawah ancaman fisik/paksaan atau objek agunan yang diserahkan ternyata milik orang lain tanpa kuasa sah", "Jika debitur tidak suka pada menteri", "Jika hari hujan deras", "Setelah 1 minggu penandatanganan", "A", 
     "Perjanjian perdata SKTJM tunduk pada syarat sah perjanjian Pasal 1320 KUHPerdata: bebas dari paksaan, penipuan, dan memiliki kausa halal.", reg11),
    ("Bagaimanakah pencatatan akuntansi atas timbulnya tagihan TP/TGR pada Laporan Keuangan instansi?", 
     "Dicatat sebagai Piutang Tuntutan Perbendaharaan / Piutang Tuntutan Ganti Rugi pada pos Aset di Neraca berdasarkan SKTJM / SK Pembebanan sah", "Dicatat sebagai Beban Hibah di LO", "Dicatat sebagai modal saham", "Tidak perlu dicatat sampai uangnya lunas", "A", 
     "Piutang TP/TGR diakui sebagai aset lancar (jatuh tempo < 1 tahun) atau aset lainnya (jatuh tempo > 1 tahun) di Neraca instansi.", reg11),
    ("Dokumen yang diterbitkan oleh Tim Pengawas setelah memverifikasi kepatuhan pengembalian uang kas negara adalah:", 
     "Berita Acara Rekonsiliasi Pelunasan TGR yang dilampiri bukti setor Nomor Transaksi Penerimaan Negara (NTPN)", "Surat ucapan terima kasih", "Kwitansi kosong", "Foto uang tunai", "A", 
     "Konfirmasi pelunasan dibuktikan secara sah dengan NTPN bank persepsi dan Berita Acara Rekonsiliasi resmi pengawas keuangan.", reg11),
    ("Apakah uang hasil pelunasan TGR dapat digunakan langsung oleh instansi untuk membelanjai kegiatan baru?", 
     "Dilarang, setoran ganti rugi disetor ke Rekening Kas Umum Negara sebagai penerimaan negara dan tidak dapat langsung dibelanjakan (asas bruto)", "Boleh langsung dipakai jalan-jalan dinas", "Boleh dibagi ke pegawai sebagai bonus", "Boleh dibelikan emas batangan", "A", 
     "Asas universalitas/bruto perbendaharaan melarang kompensasi langsung penerimaan negara; uang wajib masuk ke BUN secara utuh.", reg11)
]

t11_a = [
    ("Analisis Kasus Penggelapan Kas UP oleh Bendahara yang Melarikan Diri: Bendahara Satker X kabur membawa uang kas UP sebesar Rp 450 juta. Upaya hukum dan perbendaharaan simultan yang wajib dilakukan KPA adalah:", 
     "Melaporkan tindak pidana korupsi/penggelapan ke Kepolisian/Kejaksaan, meminta pemblokiran rekening bank pribadi pelaku, memproses sidang TP di BPK, dan mengamankan aset pelaku", "Menunggu bendahara kembali dengan sukarela tanpa lapor siapapun", "Menghapus akun kas bendahara dari sistem pembukuan SAKTI", "Menutup kantor satker agar tidak ketahuan", "A", 
     "Langkah terpadu: Litigasi pidana pengejaran buron, pemblokiran aset perbankan, pelaporan TP ke BPK, dan pengamanan pemulihan kerugian kas negara.", reg11),
    ("Analisis Kasus Kematian Penanggung Jawab TGR yang Menolak Diakui oleh Ahli Waris: Pejabat penanggung jawab TGR Rp 200 juta meninggal dunia meninggalkan rumah senilai Rp 1 miliar. Ahli waris menolak melunasi cicilan TGR dengan alasan bukan utang mereka. Eksekusi hukum yang benar adalah:", 
     "Pemerintah berhak menuntut pelunasan dari harta peninggalan almarhum (boedel waris); penolakan ahli waris dapat diselesaikan via gugatan perdata eksekusi warisan", "Pemerintah tidak berhak menyentuh rumah warisan", "Pemerintah memenjarakan anak almarhum", "Utang dianggap lunas tanpa syarat", "A", 
     "Harta warisan yang ditinggalkan debitur terbebani kewajiban pelunasan utang almarhum kepada negara sebelum warisan dapat dibagi bersih kepada ahli waris.", reg11),
    ("Studi Kasus Kebakaran Gudang Logistik BMN Akibat Sambaran Petir: Gudang penyimpanan beras bulog terbakar habis senilai Rp 10 miliar akibat petir ekstrem yang membakar trafo listrik. Hasil investigasi forensik Polri menyatakan murni kecelakaan alam tanpa kelalaian manusia. Keputusan MP-TGR yang tepat adalah:", 
     "Membebaskan Kepala Gudang dari tuntutan ganti rugi (bebas TP/TGR) karena peristiwa terbukti force majeure murni, dan memproses penghapusan BMN rusak", "Menghukum kepala gudang membayar Rp 10 miliar", "Menjual tanah gudang kepada pengembang swasta", "Menyuruh warga sekitar mengganti beras yang terbakar", "A", 
     "Ketiadaan unsur kelalaian dan pembuktian sah keadaan kahar (force majeure) membebaskan pengelola dari pembebanan tuntutan ganti rugi.", reg11),
    ("Analisis Kasus Fraud Kolusi Pengadaan yang Diselesaikan Melalui TGR Sepihak: PPK dan Rekanan terbukti merekayasa volume aspal jalan fiktif Rp 2 miliar. PPK memohon agar kasus diselesaikan lewat SKTJM cicilan 2 tahun tanpa diproses ke pengadilan. Sikap APIP Itjen yang patut adalah:", 
     "Menolak permohonan SKTJM sebagai penyelesaian tunggal; mewajibkan pengembalian uang negara DAN melimpahkan berkas perkara ke penegak hukum karena terdapat delik korupsi berencana", "Menerima permohonan SKTJM dan merahasiakan kasus dari jaksa", "Meminta komisi 10% agar kasus ditutup", "Membiarkan proyek jalan mangkrak", "A", 
     "Delik pidana korupsi dengan niat jahat (mens rea) tidak dapat diputihkan semata-mata dengan mencicil uang; hukum pidana tetap berjalan independen.", reg11),
    ("Analisis Perbedaan Wewenang Eksekusi Piutang Negara antara KPKNL dan Pengadilan: Mengapa instrumen Surat Paksa Panitia Urusan Piutang Negara (PUPN) memiliki kekuatan eksekutorial yang setara dengan Putusan Pengadilan Inkracht?", 
     "UU No. 49 Prp 1960 memberikan hak parate eksekusi kepada PUPN dengan irah-irah 'Demi Keadilan Berdasarkan Ketuhanan YME' untuk menyita dan melelang aset tanpa gugatan perdata panjang", "Karena pegawai KPKNL memiliki seragam militer", "Karena bank sentral memberikan izin penyitaan", "Karena hakim pengadilan menyerahkan jabatannya ke KPKNL", "A", 
     "Surat Paksa PUPN memiliki kekuatan titel eksekutorial resmi untuk mengeksekusi aset debitur macet secara cepat demi pengamanan keuangan negara.", reg11),
    ("Analisis Kasus Agunan SKTJM yang Ternyata Bersertifikat Hak Milik Ganda (Sengketa): Pegawai menjaminkan sertifikat tanah yang ternyata sedang dalam sengketa kepemilikan di pengadilan dan diblokir BPN. Tindakan preventif MP-TGR yang lalai dijalankan adalah:", 
     "Majelis lalai melakukan uji tuntas (due diligence) dan konfirmasi keabsahan sertifikat (clearing) ke Kantor Pertanahan BPN sebelum menerima agunan", "Majelis tidak meminta foto selfie pegawai di tanah tersebut", "Majelis tidak mengukur tanah dengan tali", "Majelis terlalu ramah kepada pegawai", "A", 
     "Uji tuntas yuridis (clean and clear) ke BPN mutlak wajib dilakukan sebelum dokumen tanah diterima sebagai agunan pengikatan SKTJM kerugian negara.", reg11),
    ("Analisis Kasus Wanprestasi Pembayaran Ganti Rugi oleh Mantan Pejabat yang Berpindah Instansi: Pejabat yang terkena TGR Rp 100 juta pindah tugas ke kementerian lain dan berhenti membayar cicilan. Mekanisme pemotongan antar-instansi pemerintah yang sah adalah:", 
     "Instansi lama menerbitkan surat tagihan resmi kepada pimpinan instansi baru untuk melakukan pemotongan tunjangan kinerja/gaji bulanan secara langsung", "Melaporkan pejabat tersebut ke satpol PP", "Meminta pegawai kantor lama memukuli pejabat tersebut", "Membiarkan cicilan macet", "A", 
     "Kewajiban TGR mengikat personil ASN di manapun bertugas; koordinasi resmi antar-K/L memfasilitasi pemotongan payroll gaji pada entitas baru.", reg11),
    ("Analisis Kasus Kerugian Negara Akibat Pembelian Software Fiktif oleh Pejabat Pembuat Komitmen: PPK mencairkan Rp 500 juta untuk lisensi software yang ternyata tidak pernah ada. Hasil audit BPKP menetapkan Total Loss. Tanggung jawab pengembalian kerugian negara dibebankan kepada:", 
     "PPK dan Vendor secara tanggung renteng, serta PPSPM jika terbukti lalai menguji berkas formal tanpa memverifikasi keberadaan BAST riil", "Staf IT yang baru masuk kerja", "Pihak pembuat komputer di luar negeri", "Kepala dinas pendidikan", "A", 
     "Pencairan belanja fiktif membebankan pertanggungjawaban kerugian materiil kepada PPK, vendor penerima uang, dan pejabat penguji tagihan yang lalai.", reg11),
    ("Analisis Dampak Pencatatan Piutang TP/TGR terhadap Opini Laporan Keuangan Kementerian: Mengapa saldo piutang TP/TGR yang menumpuk bertahun-tahun tanpa upaya penagihan aktif dapat menjadi temuan pengecualian (WDP) oleh BPK?", 
     "Menunjukkan kelemahan pengendalian intern penagihan piutang dan ketidakpastian nilai wajar aset di Neraca akibat tidak dibentuknya penyisihan piutang tak tertagih secara memadai", "Karena piutang TP/TGR dilarang dicatat di neraca", "Karena BPK tidak suka ada pegawai yang berutang", "Supaya kementerian tidak menerima dana DIPA", "A", 
     "Piutang macet yang dibiarkan tanpa penagihan aktif atau penghapusan legal mendistorsi kewajaran Neraca dan mencerminkan kelemahan SPI penagihan.", reg11),
    ("Analisis Kasus Rekening Pribadi Debitur TGR yang Berada di Luar Negeri (Cross-Border Asset Recovery): Pejabat yang korupsi melarikan diri ke Singapura dan menempatkan dana hasil kejahatan di bank asing. Instrumen hukum internasional yang digunakan untuk pemulihan kerugian kas negara adalah:", 
     "Mutual Legal Assistance (MLA) in Criminal Matters dan instrumen Asset Recovery Konvensi PBB Anti Korupsi (UNCAC) melalui Kementerian Hukum dan HAM", "Mengirim surat pos kilat biasa", "Meminta izin dari kedutaan besar Singapura untuk mengambil uang tunai", "Menghubungi manajer restoran di Singapura", "A", 
     "Pemulihan aset lintas batas negara (cross-border asset recovery) memanfaatkan perjanjian MLA dan konvensi UNCAC untuk penyitaan dan repatriasi kas ke BUN.", reg11),
    ("Analisis Kasus Kesalahan Penjumlahan Matematis pada Pembayaran Tagihan Kontrak (Overpayment): Staf verifikasi salah menghitung rumus Excel sehingga kontraktor menerima kelebihan bayar Rp 80 juta. Cara tercepat pemulihan uang kas negara tanpa proses sidang yang panjang adalah:", 
     "Menyampaikan surat konfirmasi kelebihan bayar kepada rekanan dan rekanan menyetorkan kembali kelebihan Rp 80 juta ke Rekening Kas Negara via SSBP pengembalian belanja", "Meminta kontraktor membelanjakan uang tersebut untuk traktiran", "Memotong gaji staf verifikasi selama 10 tahun", "Mengubah nilai kontrak awal menjadi naik Rp 80 juta", "A", 
     "Kelebihan bayar administratif dapat segera dipulihkan melalui penyetoran sukarela pengembalian belanja tahun berjalan/tahun lalu ke kas negara via NTPN.", reg11),
    ("Analisis Kasus Kehilangan Senjata Api Dinas oleh Petugas Keamanan: Petugas sipir penjara kehilangan senjata dinas saat bertugas malam. Mengapa nilai ganti rugi barang yang ditetapkan MP-TGR dapat ditambah sanksi denda administratif?", 
     "Karena senjata api adalah barang inventaris khusus strategis berisiko tinggi terhadap keamanan publik, sehingga kelalaian pengamanan dijatuhi sanksi maksimal", "Karena harga senjata api murah", "Supaya petugas membeli senjata baru di pasar gelap", "Sebagai formalitas semata", "A", 
     "Barang inventaris khusus pertahanan dan keamanan memiliki standar tanggung jawab ketat; kehilangan senjata memicu tuntutan ganti rugi fisik dan pidana militer/sipil.", reg11),
    ("Analisis Yuridis Penghentian Tuntutan Ganti Rugi Melalui Mekanisme Restitusi Korban Korupsi: Pengadilan Tipikor memvonis terpidana membayar Uang Pengganti Rp 5 miliar yang disetor ke Kas Negara. Apakah instansi masih berhak menagih TGR untuk kasus yang sama?", 
     "Tidak berhak menagih ganti rugi ganda atas objek dan nilai yang sama (asas ne bis in idem dalam pemulihan kerugian finansial negara)", "Instansi berhak menagih Rp 5 miliar tambahan untuk kas kantor", "Uang pengganti dibagi dua dengan pegawai kantor", "Terpidana wajib membayar sepuluh kali lipat", "A", 
     "Pembayaran uang pengganti yang telah inkracht dan disetor ke kas negara memulihkan kerugian negara berkenaan, meniadakan tuntutan ganti rugi ganda.", reg11),
    ("Analisis Kasus Debitur TGR yang Mengalami Cacat Total Akibat Kecelakaan Kerja: Pegawai penanggung jawab TGR tertimpa musibah stroke permanen dan tidak berpenghasilan lagi. Prosedur perbendaharaan yang berkeprikemanusiaan dan sah adalah:", 
     "Mengusulkan penghapusan piutang negara secara bersyarat atau mutlak kepada Menteri Keuangan berdasarkan kajian ketidakmampuan finansial total", "Tetap menyita kursi roda debitur", "Memaksa anak debitur berhenti sekolah untuk bekerja melunasi", "Menjebloskan debitur ke penjara", "A", 
     "Regulasi penghapusan piutang negara mengakomodasi kondisi debitur yang mengalami ketidakmampuan fisik/finansial permanen melalui mekanisme penghapusan sah.", reg11),
    ("Analisis Kasus Keterlambatan Setor Dana Titipan Lelang oleh Bendahara Penerimaan: Bendahara menahan uang jaminan lelang Rp 200 juta selama 6 bulan untuk diputar dalam usaha ternak pribadinya sebelum dikembalikan ke peserta. Analisis delik hukum dan sanksinya adalah:", 
     "Merupakan tindak pidana korupsi penggelapan uang titipan dalam jabatan (Pasal 8 UU Tipikor) dan bunga/keuntungan usaha pribadi disita sebagai milik negara", "Tindakan wirausaha cerdas yang menguntungkan", "Bukan pelanggaran karena pokok uang jaminan akhirnya dikembalikan", "Cukup diselesaikan dengan teguran lisan", "A", 
     "Memanfaatkan uang titipan dinas untuk keuntungan privat adalah penggelapan dalam jabatan; pengembalian uang pokok tidak menghapuskan tindak pidana korupsi.", reg11),
    ("Analisis Efektivitas Sidang MP-TGR dalam Menumbuhkan Efek Jera (Deterrence Effect) di Lingkungan Instansi Pemerintah: Mengapa publikasi ringkasan putusan MP-TGR di internal kementerian meningkatkan kepatuhan tata kelola perbendaharaan?", 
     "Menunjukkan kepastian penegakan hukum internal tanpa pandang bulu, mengingatkan seluruh pengelola anggaran atas konsekuensi finansial kelalaian, dan memperkuat budaya integritas", "Untuk mempermalukan keluarga pegawai yang bersalah di koran", "Supaya pegawai lain takut bekerja dan menolak mengelola anggaran", "Menunjukkan kelemahan kementerian kepada publik", "A", 
     "Transparansi penegakan sanksi ganti rugi internal membangun kesadaran kolektif bahwa setiap rupiah kelalaian pengelolaan APBN pasti dituntut pertanggungjawabannya.", reg11)
]

add_topic(t11, reg11, t11_m, t11_s, t11_a)

with open("scripts/p4_topics11.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)
