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
cur_num = 1951

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
# TOPIC 19: Standar Biaya Masukan (SBM 2026), Efisiensi Belanja Operasional & Value for Money (1951 - 2000)
# ============================================================================
reg19 = "PMK tentang Standar Biaya Masukan (SBM) TA 2025/2026 jo PMK Standar Biaya Keluaran (SBK) jo UU Keuangan Negara"
t19 = "Standar Biaya Masukan (SBM 2026), Efisiensi Belanja Operasional & Value for Money"

t19_items = []
# 17 MUDAH
t19_items.extend([
    ("MUDAH", "Berdasarkan regulasi Kementerian Keuangan, Standar Biaya Masukan (SBM) berfungsi sebagai:",
     "Batas tertinggi (ceiling) atau estimasi dalam perencanaan dan pelaksanaan anggaran belanja kementerian negara/lembaga", "Tarif pajak baru yang wajib dipungut dari masyarakat", "Besaran gaji pokok minimum bagi seluruh buruh pabrik", "Daftar harga diskon barang di pasar swalayan", "A",
     "SBM berfungsi ganda: sebagai batas tertinggi yang tidak boleh dilampaui, atau sebagai estimasi prakiraan biaya dalam penyusunan RKA-K/L."),
    ("MUDAH", "SBM yang berfungsi sebagai 'Batas Tertinggi' memiliki konsekuensi hukum perbendaharaan bahwa:",
     "Realisasi pembayaran belanja tidak boleh melebihi tarif yang ditetapkan dalam SBM; kelebihan bayar merupakan kerugian negara", "Satker wajib membayar tepat sebesar tarif SBM meskipun harga riil di pasar lebih murah", "Satker boleh melampaui tarif asalkan disetujui staf bendahara", "Tarif tersebut dapat dinaikkan sepuluh kali lipat saat akhir tahun", "A",
     "Sebagai batas tertinggi, pembayaran yang melampaui tarif SBM berstatus kelebihan bayar yang wajib disetorkan kembali ke Kas Negara."),
    ("MUDAH", "SBM yang berfungsi sebagai 'Estimasi' memiliki karakteristik perbendaharaan bahwa:",
     "Tarif dalam SBM merupakan prakiraan biaya yang realisasi pembayarannya didasarkan pada bukti pengeluaran riil (at cost)", "Satker tidak perlu melampirkan kuitansi belanja riil", "Uang belanja sisa estimasi boleh dibawa pulang oleh pejabat", "Tarif estimasi mengikat mutlak seperti undang-undang pidana", "A",
     "Sebagai estimasi, besaran dalam SBM adalah patokan pagu; pembayarannya dilakukan berbasis bukti pengeluaran riil (at cost / riil expenditure)."),
    ("MUDAH", "Satuan biaya uang harian perjalanan dinas dalam negeri menurut ketentuan SBM dibedakan berdasarkan:",
     "Provinsi tujuan perjalanan dinas dan jenis kegiatan (luar kota, dalam kota > 8 jam, diklat)", "Nama marga pejabat yang melakukan perjalanan", "Warna koper yang dibawa oleh pegawai", "Merek tiket maskapai penerbangan yang dibeli", "A",
     "Uang harian perjalanan dinas dalam negeri distandarisasi berbasis lokasi provinsi tujuan dan kriteria durasi/tipe penugasan."),
    ("MUDAH", "Uang representasi dalam perjalanan dinas jabatan hanya diberikan kepada:",
     "Pejabat Negara, Pejabat Eselon I, dan Pejabat Eselon II", "Seluruh pegawai tanpa memandang jabatan atau golongan", "Hanya kepada supir kendaraan dinas", "Masyarakat yang ikut menonton rapat kementerian", "A",
     "Uang representasi perdis hanya dialokasikan untuk Pejabat Negara dan Pejabat Struktural Eselon I dan II sesuai ketentuan SBM."),
    ("MUDAH", "Standar biaya konsumsi rapat (snack dan makan) dalam SBM disyaratkan hanya dapat dibayarkan apabila rapat diselenggarakan:",
     "Melibatkan peserta dari luar unit kerja penyelenggara atau eselon II lainnya dengan durasi rapat memenuhi batas minimum", "Hanya dihadiri oleh staf satu ruangan yang sedang mengobrol santai", "Pada hari libur akhir pekan di tempat rekreasi pribadi", "Di rumah tinggal pribadi pimpinan kantor", "A",
     "Biaya konsumsi rapat dinas mensyaratkan adanya peserta lintas unit kerja/eselon dan durasi rapat kerja efektif (minimal 2 jam)."),
    ("MUDAH", "Honorarium Narasumber/Pakar/Praktisi dari luar kementerian dapat dibayarkan dengan ketentuan:",
     "Berdasarkan satuan jam pelajaran (OJ) dan narasumber memberikan materi keahlian di luar tugas pokok fungsinya", "Setiap pegawai yang berbicara dalam rapat rutin mingguan", "Diberikan kepada pejabat yang memimpin rapat internal stafnya sendiri", "Diberikan secara tunai tanpa tanda tangan bukti penerimaan", "A",
     "Honor narasumber diberikan kepada pakar eksternal atas transfer keahlian formal berdasarkan jam pelajaran (OJ), bukan rapat internal."),
    ("MUDAH", "Penerapan prinsip 'Value for Money' dalam pengelolaan belanja operasional APBN mencakup tiga dimensi utama (3E), yaitu:",
     "Ekonomi (kehematan), Efisiensi (daya guna), dan Efektivitas (hasil guna)", "Egois, Emosional, dan Eksklusif", "Elegan, Eksotis, dan Ekstrim", "Ekspansi, Eksploitasi, dan Ekstraksi", "A",
     "Prinsip 3E (Ekonomi, Efisiensi, Efektivitas) menjamin setiap rupiah belanja negara memberikan output dan outcome maksimal dengan input terukur."),
    ("MUDAH", "Standar Biaya Keluaran (SBK) berbeda dari Standar Biaya Masukan (SBM) karena SBK berfokus pada:",
     "Standar biaya yang menghasilkan satu satuan keluaran (output) kegiatan utuh spesifik Kementerian/Lembaga", "Biaya per lembar kertas fotokopi di pasar", "Honorarium bulanan supir dan satpam kantor", "Tarif tiket taksi bandara internasional", "A",
     "SBK menetapkan plafon biaya per unit output terintegrasi (misal biaya per sertifikasi tanah, per diklat, per penyusunan perda)."),
    ("MUDAH", "Biaya penginapan/hotel dalam perjalanan dinas jabatan dipertanggungjawabkan dengan prinsip:",
     "Bukti riil (at cost) setinggi-tingginya sebesar tarif batas tertinggi kelas hotel jabatan dalam SBM", "Lumpsum tanpa kuitansi hotel asli", "Boleh memakai kuitansi toko pakaian", "Membayar hotel termewah bintang 7 untuk semua golongan pegawai", "A",
     "Biaya hotel dipertanggungjawabkan at cost berbasis kuitansi/bill hotel riil dengan batas plafon tertinggi sesuai jenjang jabatan di SBM."),
    ("MUDAH", "Apabila pelaksana perjalanan dinas tidak menginap di hotel (misal menginap di rumah keluarga), yang bersangkutan diberikan fasilitas:",
     "Biaya penginapan sebesar 30% dari tarif hotel batas tertinggi yang tercantum dalam SBM (lumpsum 30%)", "Penginapan gratis bintang lima", "Penggantian uang belanja pakaian baru", "Tiket bioskop gratis sekeluarga", "A",
     "Pelaksana perdis yang tidak menginap di hotel berhak mendapat kompensasi 30% dari tarif plafon hotel tanpa kuitansi hotel."),
    ("MUDAH", "Honorarium Pengelola Keuangan (KPA, PPK, PPSPM, Bendahara) dibayarkan setiap bulan dengan besaran yang ditentukan oleh:",
     "Besaran pagu dana DIPA yang dikelola oleh satuan kerja bersangkutan sesuai tabel tarif SBM", "Jumlah anak kandung masing-masing pejabat", "Tingkat keramahan senyum pejabat saat melayani tamu", "Warna gedung kantor satuan kerja", "A",
     "Besaran honorarium bulanan pengelola keuangan berjenjang berdasarkan rentang pagu DIPA yang dikelola satker."),
    ("MUDAH", "Kebijakan efisiensi belanja operasional aparatur (konsumsi rapat, cetak dokumen, ATK) diarahkan melalui gerakan:",
     "Digitalisasi perkantoran (paperless office) dan penyelenggaraan rapat koordinasi daring (virtual meetings)", "Mewajibkan pegawai mencetak dokumen sebanyak sepuluh rangkap", "Membagikan makanan mewah tiga kali sehari untuk seluruh staf", "Membeli mesin fotokopi baru untuk setiap meja kerja", "A",
     "Efisiensi belanja operasional ditekan via digitalisasi naskah dinas elektronik (paperless) dan rapat virtual hemat anggaran."),
    ("MUDAH", "Pengadaan kendaraan dinas operasional jabatan kementerian saat ini diprioritaskan beralih menggunakan:",
     "Kendaraan Bermotor Listrik Berbasis Baterai (KBLBB) atau skema sewa kendaraan (car rental) untuk efisiensi pemeliharaan", "Mobil sport mewah impor bertenaga bensin boros", "Kendaraan lapis baja militer bersenjata berat", "Kereta kencana tradisional berkuda", "A",
     "Inpres KBLBB dan regulasi SBM mendorong konversi ke kendaraan listrik dinas serta efisiensi sewa kendaraan operasional."),
    ("MUDAH", "Biaya sewa ruang rapat di luar kantor (hotel) hanya diperkenankan apabila:",
     "Ruang rapat internal kantor instansi penyelenggara atau kementerian mitra tidak mencukupi daya tampung peserta rapat", "Pegawai merasa bosan dengan suasana kantor sendiri", "Pimpinan ingin menikmati kolam renang hotel berbintang", "Pihak hotel menawarkan voucher diskon pribadi", "A",
     "Sewa ruang pertemuan hotel diatur ketat: hanya boleh bila gedung pertemuan kedinasan penuh/tidak memenuhi kapasitas peserta."),
    ("MUDAH", "Pembayaran uang lembur dan uang makan lembur ASN didasarkan pada dokumen pertanggungjawaban berupa:",
     "Surat Perintah Lembur dari atasan yang berwenang, daftar hadir lembur (absensi sidik jari/elektronik), dan laporan hasil kerja lembur", "Cerita lisan dari pegawai yang bersangkutan", "Tangkapan layar postingan foto di media sosial malam hari", "Surat keterangan izin keluar malam dari keluarga", "A",
     "Uang lembur wajib didukung Surat Tugas Lembur resmi, absensi elektronik kehadiran lembur minimal 2 jam, dan output capaian kerja."),
    ("MUDAH", "Honorarium Panitia Pengadaan Barang/Jasa (Pokja Pemilihan / Pejabat Pengadaan) dibayarkan berdasarkan:",
     "Nilai pagu paket pengadaan barang/jasa yang ditenderkan sesuai ketentuan tabel SBM", "Banyaknya sanggahan tender yang ditolak panitia", "Berapa lama panitia berbicara di ruang lelang", "Jumlah rekanan yang mendaftar lelang", "A",
     "Honorarium Pokja Pemilihan diberikan per paket pengadaan berbasis nilai pagu paket pekerjaan yang berhasil ditenderkan.")
])

# 17 SEDANG
t19_items.extend([
    ("SEDANG", "Perbedaan konsep antara Standar Biaya Masukan yang Berfungsi Sebagai Batas Tertinggi dengan Standar Biaya Masukan yang Berfungsi Sebagai Estimasi adalah:",
     "Batas tertinggi tidak boleh dilampaui sama sekali dalam realisasi belanja, sedangkan estimasi merupakan patokan prakiraan yang dapat disesuaikan berbasis bukti riil pasar (at cost)", "Batas tertinggi hanya berlaku untuk kementerian luar negeri sedangkan estimasi untuk daerah", "Estimasi tidak memerlukan bukti pertanggungjawaban apapun", "Keduanya dapat dilanggar secara bebas tanpa konsekuensi hukum", "A",
     "Karakteristik batas tertinggi mengunci angka plafon maksimal, sedangkan estimasi membolehkan fleksibilitas at cost sesuai dinamika pasar riil."),
    ("SEDANG", "Dalam pertanggungjawaban perjalanan dinas jabatan, penggunaan tiket pesawat udara kelas bisnis (Business Class) hanya diizinkan untuk:",
     "Menteri, Pejabat Setingkat Menteri, Ketua Lembaga Negara, dan Pejabat Eselon I tertentu sesuai batasan SBM", "Seluruh pegawai golongan III dan IV yang ingin duduk nyaman", "Tenaga honorer pramubakti yang baru bertugas", "Keluarga rekanan kontraktor yang ikut bepergian", "A",
     "Fasilitas tiket pesawat kelas bisnis dibatasi ketat hanya untuk Pejabat Negara dan Pejabat Pimpinan Tinggi Madya (Eselon I) sesuai PMK SBM."),
    ("SEDANG", "Apabila dalam suatu kegiatan rapat di hotel 'Fullboard' (paket menginap dan makan disediakan panitia), uang harian yang dibayarkan kepada peserta adalah:",
     "Uang Harian Paket Fullboard (yang tarifnya lebih kecil dari uang harian perjalanan dinas biasa karena konsumsi dan hotel ditanggung penuh)", "Uang harian penuh ditambah uang makan tiga kali lipat", "Uang belanja pakaian bebas pajak", "Nol rupiah tanpa uang saku sama sekali", "A",
     "Paket rapat fullboard hotel menyediakan kamar dan makan lengkap, sehingga uang harian peserta disesuaikan menjadi tarif uang harian paket meeting."),
    ("SEDANG", "Pembatasan pemberian honorarium tim pelaksana kegiatan diatur dalam SBM dengan ketentuan:",
     "Pejabat/pegawai dibatasi maksimal menerima sejumlah honorarium tim per bulan (misal maksimal 2-3 tim) untuk mencegah perburuan rente honor", "Setiap pegawai boleh menjadi anggota 100 tim kegiatan sekaligus", "Honor tim diberikan tanpa perlu menghasilkan dokumen laporan kegiatan", "Honor tim dibayarkan secara tunai di luar slip gaji resmi", "A",
     "Regulasi SBM membatasi jumlah keikutsertaan tim kerja per orang per bulan guna memitigasi inefisiensi anggaran dan perburuan honorarium."),
    ("SEDANG", "Biaya operasional pemeliharaan gedung kantor pemerintah diatur dalam SBM dengan standar perhitungan berbasis:",
     "Tarif per meter persegi luas lantai bangunan gedung per tahun yang disesuaikan dengan kondisi bertingkat atau tidak bertingkat", "Jumlah jendela kaca yang ada di kantor", "Harga sewa ruko komersial di kawasan elit", "Warna cat tembok dinding kantor", "A",
     "Standar pemeliharaan gedung kantor dikalkulasi menggunakan rumus tarif per meter persegi (m2) luas lantai fisik gedung terdata di BMN."),
    ("SEDANG", "Penerapan konsep 'Spending Review' oleh Kementerian Keuangan pada belanja barang operasional K/L bertujuan untuk:",
     "Mengidentifikasi inefisiensi, duplikasi program antar instansi, pemborosan belanja seremonial, dan merelokasi ruang fiskal ke program prioritas nasional", "Menghapus seluruh gaji pokok para pegawai negeri sipil", "Mengharuskan instansi pemerintah meminjam modal dari luar negeri", "Membuat belanja kementerian menjadi lebih boros dan tidak terarah", "A",
     "Spending review menganalisis kualitas belanja negara untuk memangkas anggaran 'inefisiensi seremonial' dan merealokasi ke belanja produktif."),
    ("SEDANG", "Pembayaran biaya transportasi lokal dalam kota untuk penugasan kedinasan diatur dengan mekanisme:",
     "Diberikan secara at cost berbasis bukti tiket transportasi umum resmi atau tarif standar taksi/angkot per hari jika tidak tersedia kendaraan dinas", "Diberikan uang sewa helikopter pribadi untuk setiap staf", "Diberikan biaya pembelian sepeda motor baru", "Dibayar tanpa surat tugas dari atasan langsung", "A",
     "Transport lokal diberikan at cost / standar SBM harian untuk membiayai mobilitas tugas dinas dalam kota tanpa penyediaan mobil dinas."),
    ("SEDANG", "Dalam hal kementerian/lembaga membutuhkan standar biaya khusus yang belum diatur dalam PMK SBM, K/L bersangkutan wajib:",
     "Mengajukan usulan persetujuan Standar Biaya Masukan Lainnya (SBML) kepada Menteri Keuangan c.q. Direktur Jenderal Anggaran", "Menetapkan tarif sendiri secara sepihak melalui surat keputusan kepala bagian", "Memungut sumbangan dari peserta acara untuk menutupi biaya", "Mengambil uang kas dari brankas bendahara penerimaan", "A",
     "Kebutuhan biaya spesifik non-standar wajib diusulkan dan disetujui Menteri Keuangan via penetapan Standar Biaya Masukan Lainnya (SBML)."),
    ("SEDANG", "Perlakuan terhadap sisa anggaran akibat efisiensi pengadaan belanja operasional (misal lelang ATK menghasilkan efisiensi 20%) adalah:",
     "Efisiensi anggaran dapat dialihkan untuk kegiatan produktif prioritas lain melalui mekanisme revisi anggaran yang sah atau menjadi sisa hemat DIPA", "Dibagikan langsung kepada panitia lelang sebagai hadiah keberhasilan", "Digunakan untuk pesta syukuran makan malam mewah pejabat", "Dihilangkan dari pembukuan neraca kantor", "A",
     "Hasil efisiensi tender dikembalikan ke kas negara atau dioptimalisasikan pada program prioritas via revisi anggaran resmi."),
    ("SEDANG", "Penggunaan fasilitas 'Corporate Card' KKP untuk belanja operasional sehari-hari membantu pengendalian kepatuhan SBM karena:",
     "Setiap tagihan transaksi tercatat rinci oleh bank mitra (merchant name, nominal, waktu) sehingga mempermudah verifikasi kepatuhan tarif SBM oleh PPK", "Membebaskan pejabat dari audit kepatuhan oleh BPK", "Memperbolehkan pembelian barang pribadi tanpa pengawasan", "Meniadakan kebutuhan pembuatan Surat Pertanggungjawaban (SPJ)", "A",
     "Transparansi jejak audit digital transaksi kartu kredit pemerintah membatasi moral hazard penggelembungan nota belanja manual."),
    ("SEDANG", "Standar biaya konsumsi makanan penambah daya tahan tubuh (seperti susu, suplemen, vitamin) dalam SBM diperuntukkan bagi:",
     "Pegawai yang melakukan pekerjaan tertentu yang berisiko tinggi terhadap kesehatan (seperti petugas radiologi, laboratorium kuman, penyelam, operator server malam)", "Seluruh staf administrasi yang duduk di ruang kantor ber-AC", "Keluarga pegawai yang sedang sakit di rumah", "Tamu undangan pernikahan di gedung kantor", "A",
     "Makanan penambah daya tahan tubuh hanya dialokasikan untuk tugas kedinasan spesifik berisiko paparan bahaya kesehatan lingkungan."),
    ("SEDANG", "Ketentuan tentang sewa bus pariwisata untuk kegiatan kedinasan rombongan staf mensyaratkan:",
     "Diperbolehkan jika lebih ekonomis dibanding menggunakan banyak kendaraan pribadi/dinas terpisah dan didukung perbandingan tarif wajar SBM", "Dilarang sama sekali dalam situasi apapun", "Wajib menyewa bus paling mahal dari luar negeri", "Harus disertai pengawalan helikopter militer", "A",
     "Sewa angkutan rombongan diizinkan atas dasar analisis kehematan biaya komparatif (value for money) dibanding biaya transportasi individual."),
    ("SEDANG", "Biaya bantuan beasiswa pendidikan tugas belajar PNS yang diatur dalam SBM mencakup komponen standar biaya:",
     "Biaya hidup (living allowance), biaya buku, biaya operasional penelitian/tesis, dan biaya pendidikan resmi perguruan tinggi", "Biaya pembelian mobil mewah bagi mahasiswa", "Biaya liburan keliling dunia bersama keluarga", "Biaya pesta wisuda kelulusan pribadi", "A",
     "SBM beasiswa menstandarisasi komponen biaya pendidikan, tunjangan buku, riset tugas akhir, dan biaya hidup layak mahasiswa tugas belajar."),
    ("SEDANG", "Penerapan analisis 'Total Cost of Ownership' (TCO) dalam pengadaan aset kendaraan atau perangkat IT pemerintah berarti:",
     "Menghitung tidak hanya harga beli awal, namun seluruh biaya operasional, listrik/bahan bakar, pemeliharaan suku cadang, dan nilai residu selama siklus hidup aset", "Hanya melihat harga beli termurah tanpa memperhitungkan biaya kerusakan", "Membeli barang bekas yang tidak memiliki garansi resmi", "Mengabaikan biaya perawatan tahunan aset", "A",
     "TCO memitigasi jebakan barang murah yang boros perawatan, memastikan aset yang dibeli efisien sepanjang siklus pakainya."),
    ("SEDANG", "Pertanggungjawaban belanja perjalanan dinas jabatan fiktif (tidak pernah berangkat namun kuitansi dibuat lengkap) merupakan tindak pidana:",
     "Korupsi pemalsuan dokumen dan penggelapan uang negara yang merugikan keuangan negara, pelakunya dituntut pidana dan pengembalian uang", "Pelanggaran etika ringan yang cukup diselesaikan dengan teguran lisan", "Tindakan wajar yang lumrah dilakukan pegawai negeri", "Bukan pelanggaran jika uangnya digunakan untuk sedekah", "A",
     "Perjalanan dinas fiktif adalah tindak pidana korupsi materiil; manipulasi manifes/boarding pass berujung sanksi pemecatan dan pidana penjara."),
    ("SEDANG", "Standar biaya honorarium rohaniwan pada pengambilan sumpah jabatan ASN diatur dalam SBM dengan satuan:",
     "Orang/Kali penugasan pengambilan sumpah jabatan secara resmi", "Persentase dari gaji pokok pegawai yang disumpah", "Satu unit rumah dinas dinas", "Bebas ditentukan oleh panitia tanpa batasan", "A",
     "Honorarium rohaniwan distandarisasi berbasis satuan orang/kali kegiatan pengambilan sumpah resmi sesuai ketetapan SBM."),
    ("SEDANG", "Ketentuan pemberian uang saku rapat di dalam kantor bagi peserta internal satuan kerja penyelenggara menyatakan:",
     "Dilarang keras membayarkan uang saku kepada peserta internal satker sendiri untuk rapat kerja dalam jam dinas kantor", "Wajib diberikan uang saku minimal Rp 1 juta per jam", "Diberikan uang saku dalam bentuk mata uang asing", "Dibayar menggunakan anggaran dana bantuan sosial", "A",
     "SBM melarang tegas pembayaran uang saku/transport bagi pegawai internal satker sendiri pada rapat dinas di lingkungan kantor sendiri.")
])

# 16 ANALISIS
t19_items.extend([
    ("ANALISIS", "Analisis Kasus Manipulasi Bukti Tiket Pesawat Perjalanan Dinas (Mark-Up Boarding Pass): Staf mengubah harga tiket pesawat ekonomi dari Rp 1,2 juta menjadi plafon tertinggi SBM Rp 2,8 juta menggunakan program edit gambar PDF. Analisis delik dan sistem verifikasinya adalah:",
     "Merupakan tindak pidana korupsi pemalsuan dokumen bukti belanja; KPPN dan PPK dapat memvalidasi keabsahan data tiket langsung via kode PNR (Booking Code) maskapai penerbangan", "Tindakan cerdas mengoptimalkan penyerapan pagu perjalanan dinas satker", "Bukan pelanggaran karena harga yang ditagihkan masih di bawah batas SBM", "Cukup diselesaikan dengan mengganti tiket dengan kuitansi hotel", "A",
     "Penggelembungan harga tiket melanggar prinsip at-cost; verifikasi kode booking (PNR) pada sistem maskapai membuktikan manipulasi mark-up secara seketika."),
    ("ANALISIS", "Analisis Efektivitas Kebijakan 'Green Public Procurement' Terhadap Efisiensi APBN Jangka Panjang: Mengapa belanja barang ramah lingkungan (hemat energi dan tahan lama) lebih efisien meski harga belinya sedikit lebih mahal?",
     "Menghemat biaya tagihan listrik dan penggantian suku cadang hingga 50% selama masa pakai 10 tahun, sekaligus mendukung komitmen dekarbonisasi nasional", "Supaya kementerian terlihat keren di majalah internasional", "Untuk menghabiskan pagu belanja modal satker secepatnya", "Membuat kantor kementerian menjadi dingin dan beku", "A",
     "Pengadaan hijau mengedepankan efisiensi biaya siklus hidup (life-cycle cost efficiency) dan menekan belanja operasional daya/jasa jangka panjang."),
    ("ANALISIS", "Analisis Kasus Pemberian Honorarium Narasumber kepada Pejabat Eselon II yang Memberikan Arahan Rapat Rutin Internal: Bendahara mencairkan honor narasumber Rp 3 juta kepada Kepala Kantor atas pidato pengarahan apel pagi. Temuan BPK dan koreksinya adalah:",
     "Tindakan tersebut melanggar ketentuan SBM; pengarahan pimpinan internal merupakan tugas pokok fungsi jabatan dinas yang melekat dan tidak berhak menerima honor narasumber", "Tindakan bendahara sangat terpuji dan wajib dilestarikan", "Honor narasumber seharusnya dinaikkan menjadi Rp 30 juta", "Kepala kantor berhak menerima honor dari seluruh kegiatan kantornya", "A",
     "Tupoksi struktural internal tidak dapat dibayari honor narasumber; pembayaran honor ilegal tersebut wajib disetor kembali ke Kas Negara via NTPN."),
    ("ANALISIS", "Analisis Kasus Paket Rapat Hotel Fiktif (Hotel Kickback Fraud): PPK memesan paket meeting hotel Rp 100 juta namun yang terealisasi hanya Rp 40 juta, sementara Rp 60 juta dikembalikan pihak hotel kepada oknum panitia dalam bentuk uang tunai (kickback). Delik hukumnya adalah:",
     "Merupakan persekongkolan tindak pidana korupsi (Pasal 2 dan 3 UU Tipikor) yang merugikan keuangan negara Rp 60 juta; pelakunya diancam pidana penjara minimal 4 tahun", "Tindakan wirausaha perhotelan yang saling menguntungkan kedua pihak", "Bukan pelanggaran hukum karena hotel telah menerbitkan kuitansi lunas", "Uang kickback sah menjadi uang kas kecil kantor", "A",
     "Penerimaan cash back/kickback dari selisih pemesanan hotel fiktif adalah korupsi nyata persekongkolan belanja negara fiktif."),
    ("ANALISIS", "Analisis Peran 'Targeted Zero-Based Budgeting' (ZBB) dalam Menghapus Belanja Inersia Satker: Mengapa penyusunan RKA-K/L berbasis ZBB lebih unggul dibanding metode 'incremental budgeting' (tambah 10% setiap tahun)?",
     "Memaksa setiap program kerja membuktikan relevansi output dan justifikasi kebutuhan biayanya dari nol, mengeliminasi kegiatan seremonial usang yang terus diulang otomatis", "Membuat seluruh kementerian tidak memiliki anggaran kerja sama sekali", "Mengharuskan pegawai bekerja tanpa menerima tunjangan gaji", "Mempersulit perencanaan anggaran sehingga program terhenti", "A",
     "Zero-based budgeting membedah kewajaran anggaran dari akar kebutuhan riil, menghentikan inersia pengulangan pos belanja mubazir warisan tahun-tahun lalu."),
    ("ANALISIS", "Analisis Kasus Pembelian Barang Inventaris Mewah yang Melampaui Standar Kelayakan BMN: Satker membeli kursi kerja pimpinan berbalut kulit impor seharga Rp 45 juta per unit menggunakan pagu belanja barang operasional. Analisis kewajaran belanja dan audit BPKP adalah:",
     "Merupakan pemborosan keuangan negara (extravagant spending) yang melanggar standar kelayakan BMN dan asas kepatutan pengelolaan keuangan negara; selisih harga dituntut ganti rugi", "Tindakan sah demi menjaga wibawa dan harga diri pimpinan kementerian", "Bukan masalah selama pagu DIPA mencukupi untuk membayar kursi", "Kursi tersebut otomatis menjadi cagar budaya nasional", "A",
     "Prinsip kepatutan dan kepantasan membatasi kemewahan berlebih; pengadaan aset di luar standar kelayakan BMN merupakan kerugian pemborosan kas negara."),
    ("ANALISIS", "Analisis Dampak Pembatasan Frekuensi Perjalanan Dinas Luar Negeri Terhadap Kinerja Diplomasi dan Ruang Fiskal APBN: Bagaimana Kemenkeu menyaring urgensi permohonan dinas luar negeri K/L?",
     "Mewajibkan izin persetujuan tertulis Kementerian Sekretariat Negara dan Kemenkeu dengan membuktikan urgensi strategis substansi dan membatasi delegasi maksimal 3-5 orang", "Mengizinkan seluruh pejabat bepergian ke luar negeri bersama rombongan keluarga", "Melarang seluruh aktivitas hubungan luar negeri secara permanen", "Menyuruh pejabat berenang menyeberangi samudra", "A",
     "Penyaringan ketat perdis luar negeri via Setneg-Kemenkeu memangkas turisme birokrasi dan mengamankan devisa anggaran untuk belanja domestik prioritas."),
    ("ANALISIS", "Analisis Kasus Pemecahan SPK Pengadaan Konsumsi Rapat untuk Menghindari Pajak Restoran / PPh: Satker memecah pemesanan konsumsi rapat Rp 50 juta menjadi 25 kuitansi masing-masing Rp 2 juta untuk rekanan warung yang sama. Analisis kepatuhan perpajakan dan perbendaharaannya adalah:",
     "Merupakan modus penghindaran pemotongan pajak dan pemecahan pengadaan (smurfing); PPK wajib menggabungkan transaksi dan memotong kewajiban perpajakan yang sah", "Tindakan cerdas dan terpuji yang membantu pedagang kecil", "Diperbolehkan oleh undang-undang perpajakan nasional", "Bukan urusan satker karena yang bayar pajak adalah warung", "A",
     "Pemecahan transaksi untuk menghindari batasan pajak dan regulasi pengadaan adalah pelanggaran kepatuhan yang berakibat tuntutan kekurangan setor pajak."),
    ("ANALISIS", "Analisis Penerapan Indeks Biaya Kemahalan Konstruksi (IKK) pada SBM Belanja Modal di Daerah Terpencil: Mengapa standar biaya pembangunan gedung di pedalaman Papua lebih tinggi dibanding di Pulau Jawa?",
     "Memperhitungkan faktor disparitas harga logistik angkutan udara, keterbatasan rantai pasok material, dan kondisi geografis ekstrem secara ilmiah dan objektif", "Supaya kontraktor di papua menjadi kaya raya mendadak", "Karena kementerian keuangan ingin menghabiskan uang APBN", "Sebagai bentuk diskriminasi harga yang tidak berdasar", "A",
     "Indeks Kemahalan Konstruksi (IKK) BPS mengalibrasi disparitas harga riil regional sehingga alokasi anggaran pembangunan di wilayah 3T adil dan realistis."),
    ("ANALISIS", "Analisis Efektivitas Pembayaran Uang Harian Perjalanan Dinas Secara Non-Tunai Langsung ke Rekening Pelaksana (Direct Payroll): Mengapa uang harian dilarang dibagikan secara tunai oleh bendahara pengeluaran?",
     "Mencegah pemotongan liar (sunat uang saku) oleh oknum atasan, memastikan hak pegawai diterima utuh, dan meninggalkan jejak audit elektronik perbankan yang bersih", "Supaya bendahara tidak perlu bekerja menghitung uang kertas", "Agar pegawai kesulitan mengambil uang sakunya", "Karena uang tunai dilarang beredar di kantor pemerintah", "A",
     "Transfer langsung ke rekening pelaksana menjamin perlindungan hak pegawai dari pungutan liar internal dan membuktikan keaslian penyaluran belanja perdis."),
    ("ANALISIS", "Analisis Kebijakan 'Paperless Administration' Terhadap Penghematan Belanja Penggandaan dan Cetak: Satker menghemat Rp 150 juta per tahun dengan beralih ke naskah dinas elektronik Srikandi dan TTE. Evaluasi kinerja anggaran (EKA) Kemenkeu adalah:",
     "Satker dinilai memiliki efisiensi belanja tinggi, indeks kinerja anggaran meningkat, dan ruang fiskal efisiensi dapat dialihkan untuk belanja layanan masyarakat", "Satker dihukum karena tidak membelanjakan uang kertas", "Toko fotokopi berhak menggugat kepala satker ke pengadilan", "Satker wajib mengembalikan seluruh laptop kantor ke kementerian", "A",
     "Digitalisasi persuratan memangkas belanja konsumtif kertas/toner, menaikkan skor EKA satker dan menciptakan tata kelola ramah lingkungan."),
    ("ANALISIS", "Analisis Kasus Keterlambatan Pengajuan SPJ Perjalanan Dinas Melewati Batas 5 Hari Kerja: Pejabat baru menyerahkan kuitansi perjalanan dinas 3 bulan setelah kegiatan selesai. Tindakan administratif Pejabat Pembuat Komitmen (PPK) adalah:",
     "Menolak memproses ganti rugi uang muka atau menangguhkan perjalanan dinas berikutnya hingga SPJ sebelumnya dinyatakan lengkap dan terverifikasi sah", "Langsung memberikan uang saku tambahan sebagai hadiah keterlambatan", "Membuat kuitansi palsu baru dengan tanggal hari ini", "Menghapus nama pejabat dari daftar kepegawaian kantor", "A",
     "Disiplin SPJ perdis maksimal 5 hari kerja pasca penugasan mutlak ditegakkan; kelalaian berakibat penangguhan penugasan baru dan sanksi pengembalian uang muka."),
    ("ANALISIS", "Analisis Peran 'Forensic Accounting' dalam Mengungkap Penggelembungan Biaya Sewa Kendaraan Dinas: Auditor menemukan harga sewa mobil Avanza dinas dianggarkan Rp 25 juta per bulan padahal harga pasar wajar hanya Rp 7 juta per bulan. Metode pembuktian kerugian negaranya adalah:",
     "Melakukan survei harga pasar wajar independen (benchmark pricing), membandingkan kontrak sewa perusahaan sejenis, dan menghitung selisih kelebihan bayar sebagai total loss", "Menanyakan pendapat sopir taksi di pinggir jalan", "Membeli mobil baru untuk membuktikan harga aslinya", "Menutup mata karena kontrak sudah ditandatangani", "A",
     "Audit forensik membuktikan kerugian negara dari selisih kontrak mark-up terhadap harga pasar wajar (fair market value) terverifikasi."),
    ("ANALISIS", "Analisis Evaluasi Efektivitas Belanja Operasional Melalui 'Citizen Satisfaction Index': Mengapa survei kepuasan masyarakat terhadap layanan publik dijadikan tolok ukur akhir keberhasilan belanja kementerian?",
     "Untuk memastikan anggaran ratusan triliun yang dibelanjakan menghasilkan dampak nyata perbaikan kualitas hidup dan kemudahan layanan yang dirasakan langsung oleh rakyat", "Hanya sebagai konten promosi di media sosial humas kementerian", "Supaya kementerian dapat memungut biaya tambahan dari warga", "Sebagai syarat formalitas agar pegawai dapat naik gaji", "A",
     "Outcome akhir 'Value for Money' adalah kepuasan dan manfaat riil masyarakat pemanfaat layanan publik, melampaui sekadar serapan anggaran 100% di atas kertas."),
    ("ANALISIS", "Analisis Kasus Pejabat Menolak Mengembalikan Sisa Uang Muka Perjalanan Dinas yang Dibatalkan: Pejabat batal berangkat ke luar kota karena sakit mendadak namun menolak mengembalikan uang muka Rp 5 juta dengan alasan uang sudah terpakai. Penegakan hukum perbendaharaannya adalah:",
     "Sisa uang muka wajib disetorkan kembali ke Kas Negara seketika; jika menolak, dilakukan pemotongan otomatis dari gaji bulanan/tukin atau diproses sidang TP/TGR", "Uang muka diikhlaskan hilang demi rasa solidaritas kantor", "Meminta keluarga pejabat berutang ke rentenir gelap", "Menyuruh pejabat lain berangkat tanpa surat tugas", "A",
     "Pembatalan dinas mewajibkan pengembalian 100% uang muka yang belum menjadi hak riil; pemotongan gaji/tunjangan sah dilakukan untuk memulihkan kas negara."),
    ("ANALISIS", "Analisis Masa Depan Standar Biaya Berbasis 'Dynamic Algorithmic Benchmarking': Bagaimana teknologi AI dapat memperbarui tarif SBM secara otomatis dan adaptif mengikuti inflasi riil per daerah setiap bulan?",
     "Mengintegrasikan data real-time harga pasar daring (e-commerce, maskapai, perhotelan) sehingga plafon biaya dinamis, adil, mencegah mark-up, dan mencerminkan harga pasar riil", "Membuat tarif biaya berubah setiap detik secara membingungkan", "Menghapus peran kementerian keuangan dalam penetapan standar biaya", "Mewajibkan seluruh kementerian berbelanja hanya di pasar gelap", "A",
     "Dynamic benchmarking AI menciptakan standar biaya presisi tinggi yang adaptif terhadap inflasi regional tanpa celah pemborosan anggaran publik.")
])

add_topic(t19, reg19, t19_items)

# ============================================================================
# TOPIC 20: Digital Treasury, AI in Treasury, Tanda Tangan Elektronik Tersertifikasi & Keamanan Siber Keuangan (2001 - 2050)
# ============================================================================
reg20 = "UU ITE No. 1/2024 jo UU Perlindungan Data Pribadi No. 27/2022 jo Kepdirjen Perbendaharaan tentang SPBE & Keamanan Siber Kemenkeu"
t20 = "Digital Treasury, AI in Treasury, TTE Tersertifikasi & Keamanan Siber Keuangan"

t20_items = []
# 17 MUDAH
t20_items.extend([
    ("MUDAH", "Berdasarkan UU ITE dan regulasi SPBE Kementerian Keuangan, Tanda Tangan Elektronik (TTE) Tersertifikasi yang sah pada aplikasi SAKTI diterbitkan oleh:",
     "Balai Sertifikasi Elektronik (BSrE) - Badan Siber dan Sandi Negara (BSSN) atau Penyelenggara Sertifikasi Elektronik (PSrE) resmi terdaftar", "Aplikasi pembuat tanda tangan coretan kuas di ponsel", "Foto tanda tangan basah di atas kertas yang ditempel di file PDF", "Pimpinan percetakan stempel pasar tradisional", "A",
     "TTE sah berkekuatan hukum otentik wajib diterbitkan oleh PSrE Indonesia resmi (seperti BSrE BSSN untuk instansi pemerintah)."),
    ("MUDAH", "Prinsip nirsangkal (Non-Repudiation) pada Tanda Tangan Elektronik Tersertifikasi dalam penerbitan SPP dan SPM menjamin bahwa:",
     "Penandatangan tidak dapat menyangkal bahwa dialah yang menandatangani dokumen transaksi perbendaharaan berkenaan", "Dokumen transaksi dapat diubah-ubah oleh siapa saja tanpa terdeteksi", "Tanda tangan dapat dibatalkan secara lisan kapan saja oleh penandatangan", "Tanda tangan elektronik hanya berlaku jika dicetak di atas kertas", "A",
     "Non-repudiation menjamin pembuktian otentik bahwa penandatangan tidak dapat mengelak atas perbuatan hukum penandatanganan dokumen digital."),
    ("MUDAH", "Integritas data (Data Integrity) pada dokumen digital SP2D elektronik yang ditandatangani secara digital dibuktikan melalui fitur:",
     "Kriptografi Hash dan Verifikasi Segel Digital yang akan rusak/invalid jika terdapat perubahan satu karakter pun pada isi dokumen", "Pemberian stempel cap basah berwarna biru", "Penjilidan dokumen dengan pita benang emas", "Penyimpanan dokumen di lemari besi anti api", "A",
     "Algoritma kriptografi (hash function) mendeteksi setiap modifikasi mikro pada dokumen; jika data diubah, verifikasi segel digital seketika invalid."),
    ("MUDAH", "One-Time Password (OTP) yang dikirimkan ke ponsel pejabat perbendaharaan saat persetujuan SPM di SAKTI berfungsi sebagai:",
     "Faktor Otentikasi Ganda (Two-Factor Authentication - 2FA) untuk memastikan otorisasi sah oleh pemilik akun yang berhak", "Kode kupon diskon belanja online kantor", "Nomor undian berhadiah dari kementerian keuangan", "Pesan promosi pulsa operator telekomunikasi", "A",
     "OTP mengamankan proses sign-off dengan otentikasi lapis kedua (2FA) guna memitigasi risiko pembajakan akun dan password."),
    ("MUDAH", "Kewajiban pejabat perbendaharaan terhadap kerahasiaan Kata Sandi (Password), Token OTP, dan Passphrase TTE adalah:",
     "Wajib dijaga kerahasiaannya secara pribadi dan dilarang keras dibagikan kepada staf, rekan kerja, maupun pihak ketiga manapun", "Boleh ditulis di kertas memo tempel dan ditempelkan di monitor komputer", "Boleh diberitahukan kepada seluruh pegawai di grup obrolan media sosial", "Harus diumumkan saat apel pagi kantor", "A",
     "Kredensial TTE bersifat personal dan melekat mutlak pada individu pemegang sertifikat; pembocoran sandi merupakan pelanggaran disiplin berat."),
    ("MUDAH", "Berdasarkan UU Perlindungan Data Pribadi (UU PDP No. 27/2022), data keuangan pribadi pegawai (nomor rekening bank, gaji, NIK) diklasifikasikan sebagai:",
     "Data Pribadi yang Bersifat Spesifik yang wajib dilindungi dengan standar keamanan enkripsi tingkat tinggi", "Data publik yang bebas disebarkan di papan pengumuman jalan", "Informasi rahasia militer pertahanan negara", "Data tidak penting yang boleh dihapus kapan saja", "A",
     "Data keuangan pribadi adalah Data Pribadi Spesifik yang dilindungi undang-undang dari akses tidak sah dan kebocoran informasi publik."),
    ("MUDAH", "Penerapan Artificial Intelligence (AI) dalam pengawasan perbendaharaan modern pada SPAN/SAKTI bertujuan untuk:",
     "Mendeteksi anomali pola transaksi (anomaly detection), pencegahan fraud pembayaran dini, dan otomasi verifikasi dokumen rutin", "Menggantikan peran Presiden dan Menteri Keuangan", "Menghapus seluruh catatan penerimaan pajak", "Menghukum staf yang datang terlambat secara otomatis", "A",
     "AI di bidang treasury memindai jutaan transaksi secara seketika untuk mendeteksi deviasi anomali belanja dan potensi kecurangan pembayaran."),
    ("MUDAH", "Situs resmi Kementerian Keuangan yang digunakan untuk memverifikasi keaslian dokumen perbendaharaan ber-TTE adalah:",
     "Layanan Verifikasi TTE Kominfo/BSSN (seperti tte.kemenkeu.go.id atau verifikasitte.bssn.go.id)", "Portal pencarian video daring gratis", "Situs jejaring sosial komersial", "Laman toko belanja daring", "A",
     "Keabsahan sertifikat dan integritas file dokumen digital diverifikasi resmi melalui portal verifikasi TTE Kemenkeu / BSrE BSSN."),
    ("MUDAH", "Serangan siber berupa 'Phishing' yang sering mengincar bendahara pengeluaran dilakukan dengan modus:",
     "Mengirimkan surel atau tautan pesan palsu yang menyerupai portal resmi SAKTI/Bank untuk mencuri username, password, dan OTP pejabat", "Melemparkan batu ke kaca jendela kantor KPPN", "Merusak kabel jaringan internet menggunakan gunting", "Mematikan aliran listrik gedung kantor secara sengaja", "A",
     "Phishing adalah rekayasa sosial manipulatif via surel/tautan palsu untuk memancing korban menyerahkan kredensial login rahasia perbendaharaan."),
    ("MUDAH", "Pusat Operasi Keamanan Siber Kementerian Keuangan yang bertugas memantau dan menangani insiden siber sistem keuangan negara dikenal sebagai:",
     "Computer Security Incident Response Team (CSIRT Kemenkeu)", "Tim Patroli Jalan Raya Kepolisian", "Regu Pemadam Kebakaran Kota", "Posko Satpam Gerbang Depan", "A",
     "Kemenkeu-CSIRT adalah tim tanggap insiden keamanan siber resmi yang memitigasi serangan siber pada infrastruktur perbendaharaan negara."),
    ("MUDAH", "Standar protokol jaringan aman yang wajib digunakan saat mengakses portal aplikasi keuangan negara SAKTI adalah:",
     "HTTPS dengan sertifikat SSL/TLS enkripsi kuat (gembok hijau/aman pada peramban)", "HTTP biasa tanpa enkripsi", "Protokol transmisi radio amatir", "Jaringan nirkabel (Wi-Fi) publik gratis tanpa kata sandi", "A",
     "Akses aplikasi perbendaharaan wajib terenkripsi via HTTPS TLS modern untuk mencegah penyadapan data transmisi di jaringan."),
    ("MUDAH", "Dampak hukum dari penggunaan Tanda Tangan Elektronik berupa tempelan gambar (scan barcode/gambar tanda tangan tanpa sertifikat digital) adalah:",
     "Tidak memiliki kekuatan pembuktian hukum yang kuat dan mudah disangkal keabsahannya di pengadilan (bukan TTE tersertifikasi sah)", "Memiliki kekuatan hukum lebih tinggi daripada sertifikat digital", "Otomatis diakui oleh Mahkamah Internasional", "Membuat dokumen kebal dari segala macam tuntutan hukum", "A",
     "Scan tanda tangan gambar biasa tidak memenuhi syarat UU ITE sebagai TTE tersertifikasi dan tidak menjamin integritas nirkutik dokumen."),
    ("MUDAH", "Pembaruan (Renewal) Sertifikat Elektronik TTE pejabat perbendaharaan wajib dilakukan sebelum:",
     "Masa berlaku sertifikat elektronik berakhir (biasanya berlaku selama 1 hingga 2 tahun)", "Masa pensiun 30 tahun yang akan datang", "Komputer kantor dimatikan di sore hari", "Satu abad sejak diterbitkan", "A",
     "Sertifikat digital TTE memiliki masa kedaluwarsa berkala (1-2 tahun) dan wajib diperpanjang sebelum expired agar tidak menghentikan penerbitan SPM."),
    ("MUDAH", "Pencadangan Data (Data Backup) secara berkala pada sistem perbendaharaan digital bertujuan untuk:",
     "Menjamin pemulihan data transaksi keuangan negara secara utuh apabila terjadi kerusakan perangkat keras, bencana alam, atau serangan malware", "Membuat kapasitas hard disk komputer kantor cepat penuh", "Membagikan data rahasia kepada hacker luar negeri", "Memperlambat kinerja aplikasi perbendaharaan", "A",
     "Prosedur Disaster Recovery Backup menjamin kelangsungan bisnis (business continuity) dan restorasi data kas negara pasca insiden fatal."),
    ("MUDAH", "Istilah 'Ransomware' dalam ancaman keamanan siber perbendaharaan merujuk pada:",
     "Malware jahat yang mengenkripsi seluruh file data keuangan dan meminta uang tebusan untuk membuka kunci enkripsi", "Aplikasi pengingat waktu salat otomatis", "Program antivirus gratis buatan kementerian", "Layanan pesan singkat kedinasan", "A",
     "Ransomware menyandera database dan sistem komputer melalui enkripsi ilegal untuk memeras tebusan finansial."),
    ("MUDAH", "Audit Jejak Rekam Digital (Audit Trail / Log Activity) pada aplikasi SAKTI mencatat informasi penting berupa:",
     "Waktu transaksi (timestamp), identitas pengguna (user ID), alamat IP komputer, serta jenis tindakan perubahan data yang dilakukan", "Daftar lagu favorit operator komputer satker", "Menu makan malam staf keuangan di rumah", "Foto selfie pengguna saat bekerja", "A",
     "Audit log merekam histori setiap aksi transaksi secara forensik, menjadi bukti digital tak terbantahkan dalam investigasi internal."),
    ("MUDAH", "Konsep 'Smart Treasury' dalam arah transformasi digital Ditjen Perbendaharaan mencakup pilar utama:",
     "Interoperabilitas sistem terintegrasi, pembayaran tanpa uang tunai (cashless), analitik prediktif berbasis data, dan automasi layanan perbendaharaan", "Pengembalian seluruh sistem ke buku kas folio kertas bertinta cina", "Penutupan seluruh kantor KPPN di daerah", "Penggunaan mata uang asing dalam seluruh belanja APBN", "A",
     "Smart Treasury mengintegrasikan otomasi end-to-end, analitik data canggih, dan pembayaran instan nir-kertas untuk layanan publik presisi.")
])

# 17 SEDANG
t20_items.extend([
    ("SEDANG", "Mekanisme kerja Kriptografi Kunci Publik (Asymmetric Public Key Cryptography) pada TTE pejabat PPSPM bekerja dengan cara:",
     "Dokumen di-hash dan dienkripsi menggunakan Kunci Privat (Private Key) pejabat, dan siapa pun dapat memverifikasi keabsahannya menggunakan Kunci Publik (Public Key) pejabat", "Dokumen dikunci dengan kata sandi rahasia yang sama antara pengirim dan penerima", "Kunci privat dibagikan secara bebas ke seluruh staf kantor", "Dokumen diubah menjadi kode morse manual", "A",
     "Asymmetric cryptography menggunakan pasangan Kunci Privat (rahasia pemegang tanda tangan) untuk menandatangani dan Kunci Publik untuk memvalidasi."),
    ("SEDANG", "Apabila pejabat perbendaharaan pemegang sertifikat TTE kehilangan perangkat ponsel yang berisi aplikasi otentikator OTP, langkah pengamanan daruratnya adalah:",
     "Segera melapor ke Administrator SAKTI / CSIRT untuk melakukan revocasi sertifikat darurat dan mereset token akun guna mencegah akses ilegal", "Mendiamkan saja dan membeli ponsel baru tanpa melapor", "Meminjam ponsel rekan kerja untuk login akun lama", "Menyuruh pencuri ponsel untuk menandatangani SPM", "A",
     "Revokasi sertifikat darurat dan penonaktifan sesi login wajib segera dilakukan untuk mencegah penyalahgunaan kredensial oleh pihak penemu ponsel."),
    ("SEDANG", "Penerapan algoritma 'Machine Learning Fraud Detection' pada gateway pembayaran KPPN mendeteksi transaksi mencurigakan melalui indikator:",
     "Frekuensi penarikan dana di luar jam kerja wajar, anomali lonjakan nilai pembayaran ke rekening baru, dan duplikasi tagihan kuitansi identik", "Tingkat kesopanan gaya bahasa penulisan nota dinas", "Berapa banyak huruf vokal yang terdapat pada uraian SPM", "Warna kertas map berkas yang diantar ke kantor KPPN", "A",
     "Sistem deteksi fraud cerdas memantau anomali waktu transaksi (tengah malam), rekening penerima berisiko tinggi, dan duplikasi invoice otomatis."),
    ("SEDANG", "Ketentuan tentang pengamanan fisik ruang server dan infrastruktur jaringan lokal pada Satuan Kerja perbendaharaan mewajibkan:",
     "Pembatasan akses masuk hanya untuk petugas berwenang (akses biometrik/kartu), suhu ruang pendingin terkontrol, dan suplai daya UPS anti mati listrik", "Ruang server boleh dijadikan tempat makan siang dan merokok", "Pintu ruang server dibiarkan terbuka lebar untuk umum", "Kabel server dibiarkan berserakan di lorong jalan", "A",
     "Standar keamanan fisik ruang server (ISO 27001) mewajibkan kontrol akses fisik ketat, pendingin stabil, dan redundansi daya UPS."),
    ("SEDANG", "Dalam kerangka UU Perlindungan Data Pribadi (UU PDP), pelanggaran berupa kelalaian pembocoran database rekening pegawai oleh pengelola keuangan diancam sanksi:",
     "Sanksi administratif denda, ganti rugi perdata kepada korban, hingga hukuman pidana penjara bagi oknum yang sengaja memperjualbelikan data pribadi", "Diberikan pujian karena membagikan informasi secara transparan", "Pembebasan dari seluruh tugas kedinasan tanpa sanksi", "Diberikan hadiah komputer jinjing baru", "A",
     "UU PDP mengenakan sanksi denda finansial berat dan pidana penjara atas kelalaian atau kesengajaan pembocoran data pribadi finansial masyarakat/ASN."),
    ("SEDANG", "Penerapan konsep 'Zero Trust Architecture' pada jaringan intranet perbendaharaan digital Kementerian Keuangan menganut prinsip dasar:",
     "\"Never Trust, Always Verify\" - setiap perangkat, pengguna, dan aliran data wajib diautentikasi dan diotorisasi secara terus-menerus tanpa memandang lokasi jaringan", "Percaya penuh pada semua pengguna yang sudah berhasil masuk gedung kantor", "Meniadakan seluruh kata sandi dan firewall pengaman jaringan", "Hanya mencurigai pegawai baru yang masih berstatus honorer", "A",
     "Zero Trust tidak mempercayai entitas apapun secara default; setiap permintaan akses data finansial diverifikasi ketat berbasis konteks dan hak akses minimum."),
    ("SEDANG", "Proses penonaktifan (Revocation) Sertifikat Elektronik TTE seorang pejabat PPK wajib segera diproses dalam sistem saat:",
     "Pejabat bersangkutan mutasi tugas, pensiun, diberhentikan dari jabatan PPK, atau kunci privatnya terindikasi telah bocor ke pihak lain", "Pejabat berhasil menyelesaikan pekerjaan proyek tepat waktu", "Pejabat merayakan hari ulang tahun pernikahan", "Pejabat mengikuti seminar ilmiah di luar kota", "A",
     "Revokasi sertifikat digital memutus keabsahan TTE seketika saat pejabat berhenti memangku jabatan atau saat terjadi insiden keamanan kredensial."),
    ("SEDANG", "Pencegahan serangan siber 'Man-In-The-Middle' (MitM) pada komunikasi data antara aplikasi SAKTI satker dan SPAN KPPN dilakukan dengan teknik:",
     "Enkripsi kanal komunikasi End-to-End dengan protokol mTLS (Mutual Transport Layer Security) dan pinning sertifikat digital", "Mengirimkan data melalui pesan singkat radio panggil", "Mencatat nomor SPM di papan tulis kantor", "Memperbolehkan proxy internet gratis menyadap jalur komunikasi", "A",
     "mTLS memverifikasi identitas kedua sisi (klien dan server) secara resiprokal via sertifikat digital, mengeliminasi risiko pembelokan data di tengah jalan."),
    ("SEDANG", "Keterlibatan teknologi 'Optical Character Recognition' (OCR) berbasis AI dalam verifikasi tagihan belanja di SAKTI memfasilitasi:",
     "Pembacaan dan ekstraksi otomatis data kuitansi, faktur pajak, dan rincian nominal pembayaran dari pindaian PDF ke dalam modul pembayaran tanpa input manual", "Pencetakan kuitansi palsu dalam jumlah ribuan lembar", "Pengubahan angka nominal tagihan menjadi lebih mahal", "Penghapusan nomor rekening rekanan dari sistem", "A",
     "OCR cerdas membaca teks dokumen tagihan/faktur secara presisi, memangkas waktu ketik manual dan memvalidasi keaslian angka tagihan."),
    ("SEDANG", "Penanganan insiden siber infeksi malware pada komputer dinas operator SAKTI di satker wajib mengikuti protokol tanggap darurat:",
     "Mengisolasi komputer terinfeksi dari jaringan lokal (cabut kabel LAN/matikan Wi-Fi), melapor ke CSIRT, dan melakukan pemindaian menyeluruh", "Meneruskan transaksi pembayaran perbendaharaan secepatnya", "Menyalin virus malware ke komputer rekan kerja lain", "Membanting monitor komputer ke lantai kantor", "A",
     "Isolasi perangkat terinfeksi seketika menghentikan pergerakan lateral (lateral movement) malware sebelum merambat ke sistem perbendaharaan pusat."),
    ("SEDANG", "Penerapan 'Role-Based Access Control' (RBAC) pada aplikasi perbendaharaan digital membatasi bahwa:",
     "Setiap pengguna hanya memiliki hak akses menu yang sesuai persis dengan peran tugasnya (misal operator komitmen tidak dapat mengakses menu persetujuan SPM)", "Semua pengguna memiliki hak akses super-admin tanpa batasan", "Pimpinan kantor dapat mengubah kode program server secara langsung", "Staf honorer dapat menyetujui SP2D tanpa batas pagu", "A",
     "RBAC menegakkan pemisahan fungsi tugas (segregation of duties) secara digital; otorisasi sistem terkunci presisi sesuai surat keputusan jabatan."),
    ("SEDANG", "Penggunaan tanda tangan digital berbasis 'Cloud HSM' (Hardware Security Module) tersertifikasi FIPS 140-2 Level 3 menjamin bahwa:",
     "Kunci privat TTE disimpan dalam modul perangkat keras tahan tamper berstandar militer dan tidak dapat diekstraksi/dicuri secara digital oleh hacker", "Tanda tangan digital dapat digandakan secara bebas di warnet", "Kunci pengaman terbuat dari plastik daur ulang biasa", "Data keuangan disimpan di flashdisk murah tanpa sandi", "A",
     "Hardware Security Module (HSM) adalah benteng fisik penyimpanan kunci kriptografi berstandar internasional tertinggi yang kebal dari peretasan siber."),
    ("SEDANG", "Dalam audit forensik digital investigasi kecurangan perbendaharaan, prinsip 'Chain of Custody' alat bukti digital mensyaratkan:",
     "Dokumentasi kronologis yang tidak terputus atas pengamanan, penyitaan, pemindahan, dan analisis bukti digital agar sah diakui di persidangan pidana", "Penyerahan bukti flashdisk tanpa tanda terima resmi", "Penghapusan tanggal pembuatan file pada berkas bukti", "Pencampuran bukti digital dengan barang rongsokan kantor", "A",
     "Chain of custody menjamin integritas hukum barang bukti digital (tidak terkontaminasi atau dimanipulasi) sejak disita hingga diuji di hadapan hakim."),
    ("SEDANG", "Penerapan teknologi 'Automated Reconciliation Bot' pada sistem perbendaharaan Ditjen Perbendaharaan menghasilkan efisiensi:",
     "Pencocokan ratusan ribu transaksi kas masuk MPN dan kas keluar SP2D terhadap rekening koran BI selesai dalam hitungan detik tanpa campur tangan manusia", "Mewajibkan pegawai lembur setiap malam hingga pagi hari", "Menimbulkan banyak selisih angka pembukuan akuntansi", "Menghapus transparansi laporan keuangan pemerintah", "A",
     "Robotic Process Automation (RPA) merekonsiliasi jutaan mutasi debit-kredit secara otonom dan presisi, membebaskan staf dari beban klerikal masif."),
    ("SEDANG", "Kebijakan 'Clean Desk and Clear Screen Policy' pada kantor pelayanan perbendaharaan KPPN mewajibkan pegawai untuk:",
     "Mengunci layar komputer (Windows Lock) saat meninggalkan meja kerja dan tidak meninggalkan dokumen keuangan rahasia tergeletak di atas meja", "Membiarkan komputer menyala tanpa sandi saat makan siang", "Menaruh tumpukan berkas SPM di lantai lobi kantor", "Menempelkan stiker kata sandi di kaca loket pelayanan", "A",
     "Clean desk & clear screen memitigasi bahaya penglihatan ilegal (shoulder surfing) dan pencurian fisik dokumen berstatus rahasia negara."),
    ("SEDANG", "Uji Penetrasi Keamanan Siber (Penetration Testing / Ethical Hacking) yang dilakukan berkala pada sistem SPAN dan SAKTI bertujuan untuk:",
     "Menemukan celah kerentanan keamanan (vulnerabilities) sistem secara proaktif sebelum dieksploitasi oleh peretas jahat di internet", "Merusak database kementerian keuangan secara permanen", "Mencuri uang kas negara untuk kepentingan tim penguji", "Memperlambat koneksi internet di seluruh indonesia", "A",
     "Penetration test menyimulasikan serangan peretas secara etis guna mengidentifikasi celah keamanan kode/arsitektur sebelum dieksploitasi musuh."),
    ("SEDANG", "Keterkaitan antara penerapan Tanda Tangan Elektronik dengan efisiensi anggaran belanja APBN tercermin nyata pada:",
     "Penghematan triliunan rupiah biaya kertas, tinta cetak, jasa kurir pengiriman dokumen fisik SPP/SPM, serta percepatan pencairan dana dari hari ke menit", "Peningkatan pembelian kertas HVS secara besar-besaran", "Kewajiban membeli mesin cetak offset untuk setiap satker", "Penambahan jam kerja kantor menjadi 24 jam nonstop", "A",
     "TTE mengeliminasi biaya logistik kertas (paperless) secara radikal dan memangkas waktu proses SPM-SP2D menjadi nyaris seketika.")
])

# 16 ANALISIS
t20_items.extend([
    ("ANALISIS", "Analisis Kasus Pencurian Kunci Privat TTE Melalui Trojan Horse pada Laptop Pribadi Pejabat: Pejabat PPSPM membawa pulang sertifikat TTE di laptop pribadi yang terinfeksi trojan, sehingga peretas menerbitkan 10 SPM fiktif senilai Rp 15 miliar. Analisis tanggung jawab hukum adalah:",
     "Pejabat bertanggung jawab mutlak atas kelalaian pengamanan kunci privat (Pasal 12 UU ITE); sertifikat segera dicabut, transaksi dibatalkan via bank freeze, dan diproses pidana", "Tanggung jawab sepenuhnya ada pada pembuat laptop komersial", "Negara wajib mengikhlaskan uang Rp 15 miliar yang dicuri peretas", "Bukan kesalahan pejabat karena peretas sangat pintar", "A",
     "Pasal 12 UU ITE menegaskan penandatangan bertanggung jawab atas kelalaian menjaga kerahasiaan sarana penandatanganan elektronik miliknya."),
    ("ANALISIS", "Analisis Serangan Siber 'Advanced Persistent Threat' (APT) yang Menyusup Diam-Diam ke Pangkalan Data SPAN: Kelompok peretas negara asing menanam 'backdoor' di server anggaran untuk memata-matai rencana belanja alutsista pertahanan. Strategi 'Threat Hunting' Kemenkeu-CSIRT adalah:",
     "Menganalisis anomali lalu lintas jaringan keluar (exfiltration traffic), audit integritas biner kernel server, dan pembersihan sistem via isolasi micro-segmentation", "Mematikan seluruh jaringan listrik nasional selama satu tahun", "Meminta izin kepada peretas untuk berbagi informasi rahasia", "Mengabaikan ancaman karena peretas tidak mencuri uang kas", "A",
     "Threat hunting proaktif melacak jejak indikator kompromi (IoC) dan anomali eksfiltrasi data intelijen pertahanan sebelum terjadi kebocoran strategis."),
    ("ANALISIS", "Analisis Kasus Pemalsuan Dokumen PDF Ber-TTE Melalui Serangan 'Shadow Attack': Peretas memanipulasi tampilan PDF SPM sehingga yang tampak di layar pejabat berbeda dengan layer teks yang dibaca oleh sistem penagihan. Langkah penangkal kriptografi BSSN adalah:",
     "Menerapkan standarisasi format PDF/A dan validasi ketat visual conformance serta digital signature encapsulation sebelum proses approval TTE", "Melarang penggunaan format PDF dan beralih ke foto polaroid", "Menyuruh pejabat membaca dokumen menggunakan kaca pembesar fisik", "Menghapus seluruh sistem verifikasi digital", "A",
     "Mitigasi Shadow Attack mewajibkan validasi arsitektur PDF terenkapsulasi dan pembacaan hash seragam antara lapisan visual dan lapisan data sistem."),
    ("ANALISIS", "Analisis Risiko 'Deepfake Audio/Video' Pejabat Tinggi Negara yang Memerintahkan Transfer Kas Darurat: Direktur KPPN menerima panggilan video deepfake yang menyerupai Menteri Keuangan memerintahkan transfer Rp 200 miliar ke rekening darurat. Protokol pertahanan perbendaharaan yang sah adalah:",
     "Menolak perintah lisan/video apapun dan menegaskan bahwa pengeluaran kas negara HANYA sah melalui dokumen perbendaharaan digital terotentikasi TTE di sistem resmi", "Segera mentransfer uang kas negara karena takut dimarahi menteri", "Mengirim uang kas tunai menggunakan taksi online", "Menyerahkan brankas kantor KPPN kepada kurir", "A",
     "Perbendaharaan negara kebal dari manipulasi lisan/deepfake karena pembayaran mutlak berbasis dokumen elektronik sah bertanda tangan digital tersertifikasi."),
    ("ANALISIS", "Analisis Dampak Serangan 'Distributed Denial of Service' (DDoS) Berskala 2 Terabit/detik pada Gerbang MPN di Hari Batas Akhir Pembayaran Pajak: Wajib pajak tidak dapat mengakses SIMPONI untuk membayar pajak. Tindakan Business Continuity Plan Kemenkeu adalah:",
     "Mengaktifkan layanan Cloud DDoS Scrubbing Center, perpanjangan batas waktu pembayaran (grace period) resmi via siaran pers Kemenkeu, dan mitigasi DNS anycast", "Membiarkan wajib pajak terkena denda keterlambatan secara tidak adil", "Membatalkan seluruh penerimaan pajak tahun berjalan", "Menutup bank persepsi di seluruh indonesia", "A",
     "Mitigasi DDoS skala masif melibatkan pembersihan trafik scrubbing awan serta diskresi regulasi fiskal perpanjangan batas waktu setoran demi keadilan wajib bayar."),
    ("ANALISIS", "Analisis Penerapan Algoritma 'Explainable AI' (XAI) dalam Penolakan Otomatis Tagihan SPM oleh Sistem: Mengapa bot AI perbendaharaan diwajibkan memberikan alasan penolakan yang transparan dan logis bagi satker?",
     "Menjamin asas keterbukaan dan keadilan tata kelola perbendaharaan, mencegah bias algoritma 'black-box', dan membimbing satker melakukan perbaikan data yang sah", "Supaya bot AI terlihat memiliki perasaan manusia", "Untuk mempersulit satker memperbaiki kesalahan dokumen", "Agar programmer kementerian keuangan dapat beristirahat santai", "A",
     "Explainable AI (XAI) memastikan keputusan sistem otomatis dapat dipertanggungjawabkan secara hukum dan dipahami secara transparan oleh pengguna."),
    ("ANALISIS", "Analisis Risiko Kebocoran Kredensial Akibat 'Keylogger Malware' di Komputer Warnet Publik yang Digunakan Staf Satker: Operator satker membuka SAKTI di warnet umum saat dinas luar kota dan password akunnya terekam keylogger. Pelanggaran standar SOP dan mitigasinya:",
     "Pelanggaran fatal SOP keamanan informasi (dilarang keras login di perangkat publik non-dinas); sistem mendeteksi IP asing mencurigakan dan memblokir sesi login seketika", "Tindakan diperbolehkan asalkan operator menghapus riwayat peramban", "Bukan pelanggaran karena operator sedang bekerja keras", "Warnet umum resmi diangkat menjadi kantor cabang satker", "A",
     "Penggunaan komputer publik melanggar SOP keamanan informasi; sistem mitigasi memblokir akses dari IP non-rekanan dan mereset kredensial terancam kompromi."),
    ("ANALISIS", "Analisis Masa Depan 'Quantum Computing Threat' Terhadap Kriptografi RSA Sistem Perbendaharaan: Komputer kuantum masa depan diprediksi mampu memecahkan enkripsi RSA 2048-bit dalam hitungan detik. Kesiapan Ditjen Perbendaharaan menuju era Post-Quantum Cryptography (PQC):",
     "Melakukan migrasi bertahap ke algoritma kriptografi pasca-kuantum (seperti Lattice-based Cryptography) yang direkomendasikan BSSN/NIST untuk menjaga kerahasiaan kas negara", "Menghapus seluruh sistem digital dan kembali ke zaman batu", "Menghentikan seluruh penggunaan komputer di kementerian keuangan", "Membiarkan data negara dipecahkan oleh hacker kuantum", "A",
     "PQC Crypto-Agility memastikan infrastruktur keamanan informasi perbendaharaan beradaptasi dengan algoritma matematis baru yang kebal dari dekripsi komputer kuantum."),
    ("ANALISIS", "Analisis Kasus Manipulasi Nomor Rekening Bank Rekanan pada File SPM Sebelum Masuk ke SPAN: Oknum orang dalam (insider threat) berusaha mengubah nomor rekening rekanan di database lokal SAKTI menjadi rekening pribadinya. Penolakannya oleh sistem terjadi karena:",
     "Integritas TTE pejabat PPK/PPSPM terkunci pada konten data nomor rekening awal; perubahan satu digit nomor rekening membatalkan validitas segel digital SPM seketika", "Sistem bank akan menelepon direktur rekanan untuk menanyakan kebenaran nomor", "Sistem memperbolehkan perubahan nomor rekening jika dilakukan oleh staf senior", "Nomor rekening secara otomatis kembali ke nomor rekening presiden", "A",
     "Kriptografi tanda tangan digital mengikat seluruh isi payload transaksi; modifikasi liar pada basis data otomatis memicu peringatan signature invalid di SPAN."),
    ("ANALISIS", "Analisis Tata Kelola 'Data Sovereignty' (Kedaulatan Data Keuangan Negara): Mengapa seluruh pangkalan data transaksi kas negara (SAKTI, SPAN, MPN) wajib ditempatkan di Pusat Data Nasional (PDN) di dalam negeri?",
     "Menjaga kedaulatan fiskal yurisdiksi hukum Indonesia, mencegah intervensi intelijen asing, dan mematuhi UU Keuangan Negara serta UU Sistem Elektronik", "Supaya biaya sewa server di luar negeri tidak membebani APBN", "Karena kabel internet bawah laut internasional tidak dapat dipercaya", "Agar pejabat kementerian dapat melihat fisik server setiap hari", "A",
     "Kedaulatan data finansial negara mutlak dilindungi di dalam wilayah yurisdiksi hukum nasional guna menjamin kerahasiaan dan keamanan fiskal tertinggi."),
    ("ANALISIS", "Analisis Efektivitas Penggunaan 'Behavioral Biometrics' dalam Mengidentifikasi Akun Perbendaharaan yang Diretas: Sistem mendeteksi kecepatan mengetik dan gerakan mouse akun PPSPM berbeda drastis dari pola harian biasanya. Tindakan proteksi otonom sistem:",
     "Memicu langkah 'Step-Up Authentication' (permintaan verifikasi biometrik wajah instan/OTP ulang) dan membekukan sementara hak persetujuan transaksi bernilai besar", "Mematikan layar komputer secara permanen", "Mengirimkan pesan ancaman ke nomor ponsel pengetik", "Menghapus akun pejabat dari daftar kepegawaian", "A",
     "Biometrik perilaku (behavioral analytics) mendeteksi pengambilalihan akun secara halus dan menantang pengguna dengan verifikasi identitas tingkat lanjut."),
    ("ANALISIS", "Analisis Sengketa Pembuktian di Pengadilan Tipikor atas Transaksi Pembayaran yang Disahkan Menggunakan TTE: Jaksa menghadirkan saksi ahli digital forensik untuk membuktikan bahwa terdakwa secara sadar menandatangani SPM fiktif. Nilai pembuktian log digital adalah:",
     "Log kriptografi dan sertifikat digital dari PSrE berstatus alat bukti elektronik otentik yang sah dan mengikat (Pasal 5 UU ITE), membuktikan perbuatan materiil terdakwa", "Log digital dianggap hanya coretan tulisan yang tidak memiliki nilai hukum", "Hakim menolak seluruh bukti yang berasal dari komputer", "Terdakwa bebas dari segala tuduhan karena tanda tangan tidak menggunakan pena", "A",
     "Alat bukti elektronik TTE tersertifikasi memiliki kekuatan hukum pembuktian sempurna (alat bukti otentik) di hadapan majelis hakim pengadilan tindak pidana korupsi."),
    ("ANALISIS", "Analisis Keamanan Integrasi Antara Sistem Pengadaan (e-Katalog LKPP) dengan Pembayaran Digital (SAKTI): Bagaimana 'Single Sign-On' (SSO) berbasis protokol SAML/OAuth2 mengamankan data transaksi pengadaan ke pembayaran?",
     "Mengeliminasi kebutuhan banyak kata sandi terpisah, mengenkripsi token otentikasi lintas lembaga, dan memastikan pertukaran data BAST ke SPP berlangsung tanpa manipulasi pihak ketiga", "Membuat data transaksi bocor ke seluruh pengguna internet", "Memperlambat koneksi aplikasi belanja pemerintah", "Mewajibkan pengguna mendaftar akun baru setiap hari", "A",
     "SSO terstandarisasi mengamankan pertukaran data BAST digital langsung ke draft pembayaran SPP, menutup celah pemalsuan invoice manual."),
    ("ANALISIS", "Analisis Kasus Karyawan Pensiun yang Kredensial Akun Perbendaharaannya Belum Dihapus (Orphan Account): Mantan operator satker yang telah pensiun 6 bulan masih dapat login ke SAKTI dari rumahnya. Risiko keamanan dan prosedur perbaikannya adalah:",
     "Risiko kebocoran data strategis atau transaksi liar tanpa wewenang; perbaikannya adalah audit akun berkala terintegrasi database kepegawaian BKN (otomatis de-provisioning)", "Mantan pegawai berhak membantu pekerjaan kantor secara sukarela dari rumah", "Bukan risiko keamanan selama mantan pegawai orang baik", "Akun dibiarkan aktif sebagai kenang-kenangan masa bakti", "A",
     "Akun yatim (orphan accounts) merupakan celah kerentanan serius; integrasi lifecycle HR dengan manajemen identitas (IAM) mencabut akses seketika saat pegawai mutasi/pensiun."),
    ("ANALISIS", "Analisis Penanganan Insiden Kebocoran Kode Sumber (Source Code Leak) Aplikasi Keuangan Negara di Forum Peretas Gelap: Sikap proaktif Ditjen Perbendaharaan dan BSSN dalam 24 jam pertama adalah:",
     "Melakukan audit kode menyeluruh (SAST/DAST) untuk menemukan potensi kerentanan, merotasi seluruh kunci API dan kredensial database, serta melacak pelaku via penegak hukum siber", "Mengabaikan kebocoran karena kode program hanyalah teks biasa", "Membayar uang tebusan kepada forum peretas gelap", "Menghapus seluruh aplikasi dan tidak lagi menggunakan sistem digital", "A",
     "Respons darurat kebocoran source code mencakup rotasi rahasia keras (API keys/secrets), patching kerentanan segera, dan investigasi siber proaktif."),
    ("ANALISIS", "Analisis Visi 'Autonomous Treasury Management' Indonesia 2045: Bagaimana perpaduan AI, Smart Contracts, dan Digital ID berdaulat mentransformasi fungsi perbendaharaan negara menjadi sepenuhnya otonom, presisi, dan nir-korupsi?",
     "Seluruh siklus perencanaan, pengadaan, verifikasi barang via IoT, dan pencairan kas SP2D berjalan otomatis dan transparan tanpa celah intervensi suap manusia, mengawal kemakmuran rakyat", "Meniadakan peran pemerintah dan menyerahkan keuangan negara kepada korporasi swasta", "Menghapuskan mata uang rupiah dan menggantinya dengan koin permainan daring", "Mewajibkan seluruh warga negara bekerja sebagai programmer komputer", "A",
     "Autonomous treasury masa depan mewujudkan pengelolaan keuangan negara yang transparan, instan, berbasis bukti kinerja riil terverifikasi IoT/AI, dan sepenuhnya bersih dari korupsi.")
])

add_topic(t20, reg20, t20_items)

# Save intermediate json for topic 19 and 20
with open("scripts/p4_topics19_20.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)
print("Topic 19 & 20 successfully written!")
