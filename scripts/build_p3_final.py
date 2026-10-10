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

all_part3 = []

# Load topics 1 to 4
for p in ["p3_part1.json", "p3_part2.json", "p3_part3.json", "p3_part4.json"]:
    with open(f"scripts/{p}", "r", encoding="utf-8") as f:
        data = json.load(f)
        all_part3.extend(data)

print(f"Loaded topics 1 to 4: total {len(all_part3)} questions.")
cur_num = 1251

def add_topic(topic, reg, mudah, sedang, analisis):
    global cur_num, all_part3
    for it in mudah:
        all_part3.append(q(cur_num, topic, "MUDAH", it[0], it[1], it[2], it[3], it[4], it[5], it[6], reg))
        cur_num += 1
    for it in sedang:
        all_part3.append(q(cur_num, topic, "SEDANG", it[0], it[1], it[2], it[3], it[4], it[5], it[6], reg))
        cur_num += 1
    for it in analisis:
        all_part3.append(q(cur_num, topic, "ANALISIS", it[0], it[1], it[2], it[3], it[4], it[5], it[6], reg))
        cur_num += 1
    print(f"Added {topic}, current count: {len(all_part3)}")

# ============================================================================
# TOPIC 5: Pengadaan Barang/Jasa Pemerintah & e-Katalog V6 (1251 - 1300)
# ============================================================================
t5 = "Pengadaan Barang/Jasa Pemerintah & e-Katalog V6"
reg5 = "Perpres No. 16/2018 jo Perpres No. 12/2021 jo Perlem LKPP No. 12/2021 tentang PBJ Pemerintah"

t5_m = [
    ("Metode pengadaan barang/pekerjaan konstruksi/jasa lainnya melalui aplikasi katalog elektronik disebut:", 
     "E-purchasing", "Tender Terbuka", "Pengadaan Langsung", "Seleksi Cepat", "A", 
     "E-purchasing adalah tata cara pembelian barang/jasa melalui katalog elektronik LKPP.", reg5),
    ("Batas nilai pengadaan langsung barang/jasa lainnya oleh Pejabat Pengadaan adalah bernilai paling banyak:", 
     "Rp 50.000.000", "Rp 100.000.000", "Rp 200.000.000", "Rp 500.000.000", "C", 
     "Pengadaan langsung barang/pekerjaan konstruksi/jasa lainnya bernilai paling banyak Rp 200 juta.", reg5),
    ("Pejabat yang bertugas menetapkan rancangan kontrak dan menandatangani kontrak PBJ adalah:", 
     "Pejabat Pembuat Komitmen (PPK)", "Pejabat Pengadaan", "Pokja Pemilihan", "Bendahara Pengeluaran", "A", 
     "PPK berwenang menyusun rancangan kontrak, menandatangani SPK/kontrak, dan mengendalikan pelaksanaan kontrak.", reg5),
    ("Platform digital katalog elektronik versi terbaru yang mengadopsi user experience e-commerce modern adalah:", 
     "e-Katalog Versi 6 (Inaproc)", "LPSE Versi 1", "Sistem SiRUP Lama", "Bursa Efek Indonesia", "A", 
     "e-Katalog Versi 6 LKPP menghadirkan fitur belanja modern, pembayaran terintegrasi, dan transparansi harga produk UMKM.", reg5),
    ("Tingkat Komponen Dalam Negeri (TKDN) diwajibkan dalam pengadaan pemerintah apabila produk memiliki nilai TKDN ditambah BMP paling sedikit:", 
     "10%", "25%", "40%", "70%", "C", 
     "Kewajiban penggunaan produk dalam negeri berlaku jika terdapat produk ber-TKDN ditambah BMP minimal 40%.", reg5),
    ("Dokumen perencanaan pengadaan yang memuat paket-paket pengadaan dan diumumkan secara terbuka oleh PA/KPA disebut:", 
     "Rencana Umum Pengadaan (RUP) pada aplikasi SiRUP", "Daftar Kehadiran Pegawai", "Laporan Pajak Tahunan", "Buku Tamu Dinas", "A", 
     "SiRUP (Sistem Informasi Rencana Umum Pengadaan) menampung dan mempublikasikan seluruh RUP kementerian/lembaga/pemda.", reg5),
    ("Batas maksimal uang muka kerja bagi penyedia usaha mikro dan kecil pada pengadaan barang/jasa adalah:", 
     "Paling tinggi 50% dari nilai kontrak", "Paling tinggi 20% dari nilai kontrak", "Paling tinggi 10% dari nilai kontrak", "Tidak boleh diberikan uang muka", "A", 
     "Perpres 12/2021 memberi afirmatif uang muka paling tinggi 50% bagi usaha mikro dan kecil untuk mendukung permodalan.", reg5),
    ("Jaminan Pelaksanaan tidak diperlukan untuk pengadaan barang/jasa dengan nilai kontrak:", 
     "Di bawah Rp 200.000.000", "Di atas Rp 10.000.000.000", "Khusus pekerjaan konstruksi jalan", "Semua jenis pengadaan", "A", 
     "Jaminan Pelaksanaan hanya disyaratkan untuk kontrak pengadaan bernilai di atas Rp 200 juta.", reg5),
    ("Besaran nilai Jaminan Pelaksanaan untuk nilai penawaran terkoreksi antara 80% sampai 100% dari HPS adalah:", 
     "5% dari nilai kontrak", "5% dari nilai HPS", "10% dari nilai pagu", "20% dari nilai penawaran", "A", 
     "Besaran jaminan pelaksanaan normal adalah 5% dari nilai kontrak.", reg5),
    ("Jika penawaran penyedia di bawah 80% dari HPS, besaran Jaminan Pelaksanaan yang wajib diserahkan adalah:", 
     "5% dari nilai total HPS", "5% dari nilai penawaran", "10% dari pagu DIPA", "1% dari nilai kontrak", "A", 
     "Untuk penawaran di bawah 80% HPS, jaminan pelaksanaan dinaikkan menjadi 5% dari nilai HPS guna mengantisipasi wanprestasi.", reg5),
    ("Jenis kontrak pengadaan yang pembayarannya didasarkan pada kepastian harga total keluaran pekerjaan adalah:", 
     "Kontrak Lumsum (Lump Sum)", "Kontrak Harga Satuan", "Kontrak Waktu Penugasan", "Kontrak Payung", "A", 
     "Kontrak Lumsum digunakan untuk ruang lingkup dan output pekerjaan yang telah terdefinisi secara pasti dan terukur.", reg5),
    ("Kontrak Harga Satuan tepat digunakan untuk pengadaan pekerjaan yang:", 
     "Volume atau kuantitas pekerjaannya belum dapat ditentukan secara pasti pada saat kontrak ditandatangani", "Nilainya di bawah Rp 10 juta", "Dikerjakan oleh pegawai sendiri", "Dilakukan di luar negeri", "A", 
     "Kontrak harga satuan mengikat harga per satuan unit, sedangkan volume riil diukur berdasarkan hasil opname di lapangan.", reg5),
    ("Bentuk kontrak untuk pengadaan barang bernilai di atas Rp 50 juta sampai dengan Rp 200 juta adalah:", 
     "Surat Perintah Kerja (SPK)", "Surat Perjanjian Resmi", "Kuitansi Sederhana", "Bukti Pembelian Kas", "A", 
     "Rentang nilai Rp 50 juta sampai dengan Rp 200 juta menggunakan bentuk kontrak Surat Perintah Kerja (SPK).", reg5),
    ("Tindakan memasukkan penyedia barang ke dalam Daftar Hitam (Blacklist) berakibat sanksi larangan mengikuti tender selama:", 
     "1 tahun atau 2 tahun tergantung jenis pelanggarannya", "Selamanya tanpa batas waktu", "Hanya 1 minggu", "Hanya 1 bulan", "A", 
     "Sanksi daftar hitam berlaku selama 1 tahun (pelanggaran kontraktual) atau 2 tahun (pemalsuan dokumen/KKN).", reg5),
    ("Lembaga pemerintah non-kementerian yang bertugas mengembangkan dan merumuskan kebijakan pengadaan nasional adalah:", 
     "LKPP (Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah)", "BPK RI", "Bank Indonesia", "Otoritas Jasa Keuangan", "A", 
     "LKPP adalah regulator pengadaan barang dan jasa pemerintah di Indonesia.", reg5),
    ("Pengadaan barang/jasa dalam penanganan keadaan darurat bencana alam dapat dilakukan melalui metode:", 
     "Penunjukan Langsung atau Pengadaan Darurat tanpa proses tender normal", "Tender Internasional selama 6 bulan", "Sayembara desain publik", "Menunggu tahun anggaran depan", "A", 
     "Penanganan darurat bencana menggunakan prosedur darurat: penunjukan langsung penyedia terdekat untuk mitigasi korban seketika.", reg5),
    ("Sanksi denda keterlambatan penyelesaian pekerjaan pengadaan barang/jasa per hari keterlambatan adalah:", 
     "1 permil (1/1000) dari nilai kontrak atau bagian kontrak yang belum diselesaikan", "1% per hari", "10% per minggu", "50% dari keuntungan penyedia", "A", 
     "Denda keterlambatan ditetapkan sebesar 1/1000 per hari keterlambatan sebelum PPN sesuai klausul kontrak.", reg5)
]

t5_s = [
    ("Bagaimanakah alur penetapan pemenang pengadaan barang melalui e-Purchasing pada e-Katalog V6?", 
     "PPK/Pejabat Pengadaan memilih produk terdaftar -> Negosiasi harga/ongkos kirim di sistem -> Penerbitan Surat Pesanan digital -> Konfirmasi penyedia -> Pengiriman & BAST digital", "Membuat surat lelang di koran -> Pembukaan amplop fisik -> Kemenkeu memilih vendor", "Mengundi kupon belanja -> Pemenang dihubungi via telepon", "Penyedia datang ke KPPN membawa sampel barang", "A", 
     "Alur e-purchasing berlangsung paperless dalam sistem: pemilihan produk, negosiasi daring, penerbitan surat pesanan, serah terima, dan feedback.", reg5),
    ("Dalam hal terjadi sanggah banding pada tender pekerjaan konstruksi, jaminan sanggah banding wajib diserahkan peserta lelang sebesar:", 
     "1% dari nilai total HPS", "5% dari nilai penawaran", "10% dari pagu anggaran", "Rp 1.000.000 tunai", "A", 
     "Jaminan Sanggah Banding konstruksi ditetapkan sebesar 1% dari nilai HPS yang dicairkan ke kas negara jika sanggah banding ditolak.", reg5),
    ("Apakah PPK diperkenankan menandatangani kontrak pengadaan barang bernilai Rp 5 miliar jika DIPA satker belum terbit?", 
     "Dilarang keras, penandatanganan kontrak wajib didasarkan pada DIPA/DPA yang telah disahkan dan dialokasikan pagunya secara sah", "Boleh, asalkan penyedia bersedia menunggu uang", "Boleh, dengan jaminan lisan dari bupati", "Boleh, asal kontrak dibuat mundur", "A", 
     "Pasal 52 Perpres 16/2018 menegaskan penandatanganan kontrak dilakukan setelah DIPA disahkan; dilarang mengikat negara tanpa kepastian anggaran.", reg5),
    ("Bagaimanakah prosedur pemutusan kontrak secara sepihak oleh PPK terhadap kontraktor yang terlambat menyelesaikan pekerjaan?", 
     "Memberikan Surat Peringatan 1, 2, 3 berturut-turut, melakukan rapat pembuktian keterlambatan (Show Cause Meeting/SCM), dan jika gagal dilakukan pemutusan kontrak disertai pencairan Jaminan Pelaksanaan", "Langsung mengusir kontraktor tanpa surat apapun", "Melaporkan kontraktor ke polisi militer", "Menyerahkan proyek ke kontraktor lain tanpa memutus kontrak lama", "A", 
     "Pemutusan kontrak sepihak mewajibkan SOP kontrak kritis (SCM 1, 2, 3), uji kemampuan kerja, pencairan jaminan bank, dan pengusulan sanksi daftar hitam.", reg5),
    ("Dalam penyusunan Harga Perkiraan Sendiri (HPS), sumber data yang sah dan dapat dipertanggungjawabkan meliputi:", 
     "Harga pasar setempat yang telah dikonfirmasi, harga kontrak sejenis masa lalu, daftar harga e-katalog, dan standar biaya resmi", "Perkiraan mimpi pejabat perbendaharaan", "Kutipan harga dari blog pribadi di internet", "Harga tertinggi yang diminta rekanan keluarga", "A", 
     "HPS disusun secara akuntabel oleh PPK berbasis survei pasar, riwayat kontrak masa lalu, e-katalog, dan data inflasi terkini.", reg5),
    ("Apa perbedaan mendasar antara metode pengadaan Seleksi dan Tender?", 
     "Seleksi digunakan untuk Pengadaan Jasa Konsultansi, sedangkan Tender digunakan untuk Pengadaan Barang, Pekerjaan Konstruksi, dan Jasa Lainnya", "Seleksi untuk pengadaan di atas Rp 100 miliar, tender untuk di bawah Rp 100 juta", "Seleksi dilakukan oleh bendahara, tender dilakukan oleh auditor", "Tidak ada perbedaan sama sekali", "A", 
     "Perpres PBJ membedakan terminologi: Seleksi khusus untuk Jasa Konsultansi (penilaian keahlian intelektual), sedangkan Tender untuk fisik/barang.", reg5),
    ("Apabila terjadi perubahan spesifikasi di lapangan pada kontrak pekerjaan konstruksi, instrumen legal yang wajib dibuat adalah:", 
     "Addendum Kontrak / Perubahan Kontrak yang didahului Berita Acara Pemeriksaan Bersama (Field Mutual Check / MC-0)", "Perjanjian bawah tangan tanpa tanggal", "Catatan memo pribadi pengawas", "Kuitansi tambahan yang ditulis tangan", "A", 
     "Perubahan volume atau spesifikasi pekerjaan wajib dituangkan dalam Adendum Kontrak resmi berdasarkan justifikasi teknis pemeriksaan bersama.", reg5),
    ("Batas maksimal penambahan nilai kontrak pekerjaan konstruksi melalui mekanisme addendum pekerjaan tambah/kurang adalah:", 
     "Paling tinggi 10% dari nilai kontrak awal dan tersedia alokasi anggarannya", "Paling tinggi 50% dari nilai kontrak", "Bebas tanpa batas maksimal", "Maksimal Rp 50 juta saja", "A", 
     "Pasal 54 Perpres 16/2018 membatasi pekerjaan tambah paling tinggi 10% dari nilai kontrak awal serta wajib didukung ketersediaan pagu.", reg5),
    ("Apakah fungsi dari Uji Coba Fisik (Commissioning Test) sebelum penandatanganan BAST pada pengadaan alat laboratorium?", 
     "Memastikan alat berfungsi secara sempurna sesuai spesifikasi teknis dan parameter kinerja yang diperjanjikan sebelum diterima secara resmi", "Hanya formalitas untuk memfoto alat", "Mencari-cari alasan untuk menolak bayar", "Membuat video promosi di media sosial", "A", 
     "Commissioning test adalah pengujian performa fungsi alat secara operasional guna menjamin negara tidak menerima barang rusak/cacat mutu.", reg5),
    ("Dalam e-Katalog V6, apa yang dimaksud dengan fitur 'Mini-Kompetisi'?", 
     "Fitur kompetisi harga antar-penyedia yang terdaftar dalam katalog elektronik untuk produk yang sama guna mendapatkan harga terbaik bagi negara", "Lomba cerdas cermat antar-staf satker", "Sayembara karya tulis ilmiah pengadaan", "Pertandingan olahraga antar-vendor", "A", 
     "Mini-kompetisi e-katalog memfasilitasi penawaran harga bersaing antar-distributor/reseller produk terdaftar agar satker memperoleh harga paling efisien.", reg5),
    ("Kapan Jaminan Pemeliharaan diserahkan oleh penyedia kepada PPK?", 
     "Pada saat serah terima pertama pekerjaan (Provisional Hand Over / PHO) untuk masa pemeliharaan konstruksi", "Pada saat mendaftar lelang", "Setelah gedung runtuh", "Setelah 10 tahun pemakaian", "A", 
     "Jaminan Pemeliharaan (atau retensi 5%) diserahkan saat PHO untuk menjamin perbaikan kerusakan selama masa garansi pemeliharaan.", reg5),
    ("Jika seorang PPK menerima gratifikasi tiket pesawat dan hotel dari calon pemenang lelang, sanksi hukum yang dihadapi adalah:", 
     "Pidana tindak pidana korupsi (gratifikasi/suap), pemberhentian tidak dengan hormat, dan pembatalan hasil pengadaan", "Teguran lisan dari teman sejawat", "Kenaikan gaji berkala", "Hadiah promosi jabatan", "A", 
     "Penerimaan fasilitas dari rekanan adalah delik suap/gratifikasi UU Tipikor yang membatalkan keabsahan proses pengadaan dan berimplikasi pidana.", reg5),
    ("Bagaimana perlakuan terhadap pengadaan barang impor jika barang sejenis buatan dalam negeri telah memiliki nilai TKDN ≥ 25%?", 
     "PPK dilarang membeli barang impor dan wajib memilih produk dalam negeri sesuai instruksi afirmasi P3DN", "Bebas membeli barang impor karena lebih bergengsi", "Barang impor diberikan diskon pajak 100%", "Meminta izin kepada duta besar negara produsen", "A", 
     "Instruksi Presiden tentang P3DN mewajibkan satker memprioritaskan produk dalam negeri dan melarang belanja produk impor jika PDN tersedia.", reg5),
    ("Dokumen pengadaan yang memuat kriteria evaluasi, jadwal, spesifikasi, dan draf kontrak yang disusun Pokja Pemilihan disebut:", 
     "Dokumen Pemilihan (Dokmil)", "Dokumen Rahasia Negara", "Laporan Realisasi Anggaran", "Surat Keputusan Menteri Keuangan", "A", 
     "Dokumen Pemilihan adalah panduan lengkap bagi peserta tender dalam menyiapkan dokumen penawaran yang kompetitif dan sah.", reg5),
    ("Apakah pegawai ASN yang tidak memiliki sertifikat keahlian pengadaan diperkenankan menjadi Pejabat Pembuat Komitmen (PPK)?", 
     "Dapat ditunjuk dalam masa transisi dengan penetapan KPA, namun wajib memiliki Sertifikat Kompetensi Kerja PPK sesuai batas waktu regulasi", "Dilarang menjadi ASN selamanya", "Boleh menjabat tanpa syarat apapun selamanya", "Hanya boleh jika memiliki gelar insinyur luar negeri", "A", 
     "Regulasi mewajibkan standardisasi kompetensi pengadaan bagi seluruh personil pengadaan (PPK/Pokja) bersertifikat resmi LKPP.", reg5),
    ("Dalam hal penyedia wanprestasi dan dilakukan pemutusan kontrak, dana pencairan Jaminan Pelaksanaan wajib disetorkan ke:", 
     "Kas Negara sebagai Penerimaan Negara Bukan Pajak (PNBP)", "Rekening pribadi PPK", "Kas RT setempat", "Dibagikan ke staf kantor", "A", 
     "Pencairan bank garansi jaminan pelaksanaan akibat wanprestasi merupakan hak keuangan negara dan wajib disetor utuh ke kas negara via SSBP.", reg5),
    ("Apa fungsi dari Berita Acara Hasil Pemilihan (BAHP) yang diterbitkan Pokja Pemilihan?", 
     "Menyampaikan hasil evaluasi kualifikasi, teknis, dan harga serta usulan pemenang lelang kepada PPK", "Mengumumkan nama-nama peserta lelang yang gugur di koran", "Menagih uang pendaftaran lelang", "Meminta sumbangan sukarela kepada penyedia", "A", 
     "BAHP mendokumentasikan seluruh tahapan evaluasi penawaran dan merekomendasikan calon pemenang lelang yang memenuhi syarat.", reg5)
]

t5_a = [
    ("Analisis Kasus Sanggah Banding yang Ditolak pada Tender Rumah Sakit: Peserta lelang PT Maju mengajukan sanggah banding atas penetapan pemenang lelang senilai Rp 80 miliar, namun ditolak oleh KPA karena dalil tidak berdasar. Akibat hukum terhadap jaminan sanggah banding adalah:", 
     "Jaminan Sanggah Banding sebesar Rp 800 juta (1% HPS) dicairkan dan disetorkan seluruhnya ke Rekening Kas Umum Negara sebagai PNBP", "Jaminan dikembalikan utuh kepada PT Maju", "Jaminan dibagi dua antara PT Maju dan KPA", "Jaminan hangus dan uangnya disimpan oleh bank penjamin", "A", 
     "Penolakan sanggah banding berakibat hukum pencairan jaminan sanggah banding sebesar 1% dari nilai HPS ke kas negara sesuai regulasi LKPP.", reg5),
    ("Analisis Kasus Keterlambatan Serah Terima Kapal Patroli Akibat Force Majeure: Pembuatan kapal patroli terlambat 40 hari karena galangan kapal dilanda badai topan ekstrem yang diakui pemerintah daerah sebagai bencana alam resmi. Penilaian perpanjangan waktu kontrak yang sah adalah:", 
     "Pemberian perpanjangan waktu pelaksanaan kontrak melalui adendum tanpa dikenakan denda keterlambatan atas dasar klausul force majeure yang sah", "Penyedia tetap didenda 1 permil per hari", "Kontrak langsung diputus dan direktur dipenjara", "Kapal yang setengah jadi ditenggelamkan ke laut", "A", 
     "Keadaan kahar (force majeure) yang dibuktikan dengan pernyataan resmi otoritas berwenang memberikan hak perpanjangan masa kontrak bebas denda.", reg5),
    ("Studi Kasus Pembelian Barang e-Katalog di Atas Harga Pasar Wajar (Mark-Up): Auditor BPK menemukan satker membeli 500 unit printer di e-katalog seharga Rp 8 juta/unit, padahal harga pasar wajar adalah Rp 4 juta/unit. Penyedia terbukti bersekongkol menaikkan harga tayang. Tanggung jawab hukum PPK adalah:", 
     "PPK bertanggung jawab atas kelalaian melakukan negosiasi harga dan verifikasi kewajaran harga pasar, wajib memulihkan kerugian negara bersama penyedia", "PPK bebas dari tanggung jawab karena harga sudah tayang di sistem resmi pemerintah", "Hanya pihak LKPP yang bertanggung jawab", "Printer harus dihancurkan", "A", 
     "Harga tayang di e-katalog tidak menghilangkan kewajiban PPK untuk melakukan negosiasi harga dan memastikan efisiensi belanja APBN.", reg5),
    ("Analisis Kasus Kegagalan Penyelesaian Pekerjaan pada Akhir Tahun Anggaran (Pemberian Kesempatan 50 Hari): Proyek gedung sekolah belum tuntas pada 31 Desember (progres 85%). PPK menilai penyedia mampu menyelesaikan dalam 50 hari ke depan. Prosedur hukum anggaran yang wajib ditempuh adalah:", 
     "Pemberian kesempatan menyelesaikan pekerjaan maksimal 50 hari kalender dengan mengenakan denda keterlambatan 1/1000 per hari dan pencairan jaminan akhir tahun ke RPATA", "Menutup proyek dan membiarkan gedung mangkrak", "Membayar 100% di muka tanpa jaminan bank", "Mengubah tanggal kalender menjadi tahun lalu", "A", 
     "Pemberian kesempatan melampaui akhir tahun (maks 50-90 HK) mewajibkan pengenaan denda keterlambatan harian dan jaminan bank penampungan RPATA.", reg5),
    ("Analisis Benturan Kepentingan pada Pengadaan Jasa Katering: Pejabat Pembuat Komitmen (PPK) menunjuk perusahaan katering milik adik kandungnya sendiri untuk kegiatan konsumsi diklat senilai Rp 180 juta tanpa deklarasi benturan kepentingan. Implikasi hukum atas kontrak ini adalah:", 
     "Kontrak cacat hukum karena melanggar etika pengadaan dan pakta integritas, berpotensi dibatalkan, dan PPK dijatuhi sanksi disiplin serta pidana konflik kepentingan", "Tindakan terpuji karena membantu ekonomi keluarga", "Sah asalkan rasa makanannya enak", "Diperbolehkan asal mendapat izin lisan dari staf kantor", "A", 
     "Pasal 7 Perpres 16/2018 melarang keras benturan kepentingan afiliasi keluarga; transaksi tersebut melanggar asas persaingan sehat dan etika birokrasi.", reg5),
    ("Analisis Kasus Dokumen Kualifikasi Palsu oleh Pemenang Tender: Setelah kontrak berjalan 50%, terbukti bahwa sertifikat ISO dan pengalaman kerja yang diunggah pemenang tender adalah dokumen palsu. Tindakan hukum represif yang wajib diambil KPA adalah:", 
     "Pemutusan kontrak sepihak, pencairan Jaminan Pelaksanaan ke kas negara, penetapan sanksi Daftar Hitam selama 2 tahun, dan pelaporan tindak pidana pemalsuan ke penegak hukum", "Melanjutkan proyek sampai selesai tanpa teguran", "Meminta penyedia membuat sertifikat baru yang asli", "Memberikan bonus uang kepada direktur perusahaan", "A", 
     "Pemalsuan dokumen kualifikasi membatalkan hak kontrak penyedia, mewajibkan sanksi blacklist maksimal (2 tahun), sita jaminan, dan proses pidana.", reg5),
    ("Analisis Kasus Pemecahan Paket Pekerjaan untuk Menghindari Tender (Tender Splitting): PPK memecah renovasi pagar kantor senilai Rp 800 juta menjadi 5 paket pekerjaan pengadaan langsung masing-masing Rp 160 juta dengan waktu dan lokasi yang sama. Analisis kepatuhan hukum pengadaan atas kasus ini adalah:", 
     "Pelanggaran terang-terangan terhadap Pasal 20 Perpres 16/2018 yang melarang memecah pengadaan barang/jasa untuk menghindari proses tender/seleksi", "Strategi percepatan belanja yang sah", "Bentuk kebaikan hati PPK kepada kontraktor lokal", "Efisiensi administrasi yang tidak merugikan siapapun", "A", 
     "Memecah pengadaan untuk menghindari kewajiban tender terbuka adalah pelanggaran berat kepatuhan hukum yang menimbulkan temuan audit kepatuhan.", reg5),
    ("Analisis Evaluasi Kewajaran Harga (Abnormally Low Bid): Dalam tender pengadaan mebel senilai HPS Rp 1 miliar, PT Kayu menawarkan harga Rp 650 juta (65% HPS). Langkah teknis Pokja Pemilihan sebelum menetapkan pemenang adalah:", 
     "Melakukan klarifikasi dan evaluasi kewajaran harga secara mendalam; jika harga dinilai tidak wajar dan tidak dapat dipertanggungjawabkan teknisnya, penawaran dinyatakan gugur", "Langsung menetapkan PT Kayu sebagai pemenang tanpa klarifikasi", "Memaksa PT Kayu menaikkan harga menjadi Rp 1 miliar", "Menolak penawaran tanpa alasan tertulis", "A", 
     "Penawaran di bawah 80% HPS wajib melalui uji kewajaran harga untuk memastikan penyedia tidak melakukan predatory pricing yang berujung proyek mangkrak.", reg5),
    ("Analisis Kasus Keterlambatan Pengiriman Barang e-Katalog Akibat Kelangkaan Chip Global: Distributor komputer di e-katalog terlambat menyerahkan 200 server selama 3 minggu karena pabrik global mengalami krisis semikonduktor. Sikap PPK yang berkepastian hukum adalah:", 
     "Memeriksa bukti resmi kelangkaan dari pabrikan manufaktur, jika disepakati dilakukan adendum jadwal pengiriman atau pengenaan denda sesuai klausul kontrak", "Membeli chip sendiri di pasar gelap", "Membakar kantor distributor", "Menyita komputer pribadi milik karyawan distributor", "A", 
     "Hambatan rantai pasok global dapat dipertimbangkan dalam adendum kontrak jika didukung bukti otentik pabrikan resmi atau penerapan kompensasi keterlambatan.", reg5),
    ("Analisis Yuridis Pengadaan Barang/Jasa Melalui Swakelola Tipe IV: Satker mengontrak kelompok masyarakat nelayan (Pokmas) untuk rehabilitasi terumbu karang. Syarat utama pertanggungjawaban keuangan Swakelola Tipe IV adalah:", 
     "Pekerjaan direncanakan dan diawasi oleh PPK, dilaksanakan oleh Pokmas berdasarkan kontrak swakelola, dan bukti pengeluaran riil dipertanggungjawabkan secara transparan", "Pokmas diberikan uang tunai tanpa laporan pertanggungjawaban", "Nelayan diwajibkan menjadi pegawai negeri sipil terlebih dahulu", "Uang belanja dibagi rata ke seluruh warga desa", "A", 
     "Swakelola Tipe IV memberdayakan ormas/kelompok masyarakat; akuntabilitas diukur dari kesesuaian output fisik dan laporan pengeluaran kas riil.", reg5),
    ("Analisis Kasus Kenaikan Harga Ekstrem (Penyesuaian Harga / Price Adjustment): Kontrak pekerjaan jalan multi-years tahun ke-2 mengalami lonjakan harga aspal dunia sebesar 60%. Klausul penyesuaian harga dapat diberlakukan apabila:", 
     "Kontrak bersifat tahun jamak (multi-years) dengan masa pelaksanaan lebih dari 18 bulan dan klausul penyesuaian harga dicantumkan dalam dokumen kontrak awal", "Kontrak bernilai di bawah Rp 200 juta", "Proyek dikerjakan dalam waktu 3 bulan saja", "Menteri Keuangan berganti orang", "A", 
     "Penyesuaian harga resmi diatur dalam Perpres PBJ untuk kontrak tahun jamak > 18 bulan dengan formula indeks harga BPS yang disepakati di awal kontrak.", reg5),
    ("Analisis Kasus Penyedia Tidak Mampu Memperbaiki Kerusakan pada Masa Garansi: Kontraktor gedung menolak memperbaiki atap bocor selama masa pemeliharaan 6 bulan. Langkah eksekusi perlindungan aset negara oleh PPK adalah:", 
     "Mencairkan Jaminan Pemeliharaan di bank penjamin dan menggunakan uang tersebut untuk menunjuk penyedia lain guna memperbaiki kerusakan atap", "Membiarkan gedung rusak sampai runtuh", "Meminta sumbangan dari murid sekolah", "Mengancam kontraktor dengan senjata", "A", 
     "Jaminan Pemeliharaan berfungsi melindungi hak negara; jika kontraktor abai pada masa retensi, garansi bank dicairkan untuk membiayai perbaikan pihak ketiga.", reg5),
    ("Analisis Risiko Konsolidasi Pengadaan pada Pengadaan Laptop Nasional: Pemerintah menggabungkan kebutuhan laptop seluruh K/L menjadi satu paket tender raksasa senilai Rp 2 triliun. Manfaat fiskal dan potensi risiko persaingannya adalah:", 
     "Manfaat: economies of scale menghasilkan harga satuan jauh lebih murah; Risiko: membatasi partisipasi pelaku UMKM lokal jika paket tidak dibagi per zona wilayah", "Laptop akan menjadi lambat karena dibeli bersamaan", "Semua sekolah akan kehabisan listrik", "Penyedia asing akan mengambil alih pemerintahan", "A", 
     "Konsolidasi pengadaan memaksimalkan daya tawar harga negara, namun wajib dirancang berzona agar tidak mematikan kesempatan pelaku usaha kecil.", reg5),
    ("Analisis Kasus Sengketa Pembayaran Klaim Tambahan Biaya (Claims for Extra Cost): Kontraktor menagih tambahan biaya Rp 500 juta karena tanah proyek mengandung batu keras tak terduga yang tidak ada di gambar sondir perencana. Prosedur penyelesaian sengketa kontrak adalah:", 
     "Melakukan audit teknis kondisi tanah oleh tim ahli independen; jika terbukti perbedaan kondisi fisik tak terduga (differing site condition), dibuat CCO/Adendum anggaran", "PPK langsung membayar dari saku pribadinya", "Menyuruh kontraktor menggali batu dengan tangan kosong", "Membatalkan seluruh sertifikat tanah negara", "A", 
     "Klausul differing site conditions melindungi keadilan kontrak melalui pembuktian uji forensik geologi tim ahli dan penyesuaian biaya secara legal.", reg5),
    ("Analisis Penerapan Green Procurement (Pengadaan Berkelanjutan) pada Belanja APBN: Mengapa PPK diwajibkan mencantumkan kriteria ramah lingkungan (eco-label, efisiensi energi) pada spesifikasi teknis barang?", 
     "Mengurangi jejak karbon pemerintah, mendukung target emisi nol bersih (net-zero), dan mendorong industri manufaktur beralih ke proses produksi hijau berkelanjutan", "Karena barang ramah lingkungan harganya selalu lebih murah", "Supaya gedung kantor terlihat berwarna hijau", "Menuruti permintaan donatur asing semata", "A", 
     "Sustainable Public Procurement mengarahkan kekuatan belanja belanja negara (APBN) untuk memacu transformasi industri hijau dan perlindungan iklim.", reg5),
    ("Analisis Pencegahan Praktik Kartel / Persekongkolan Tender (Bid Rigging): Tiga peserta tender konstruksi memasukkan penawaran dari alamat IP yang sama dan memiliki jaminan bank dari kantor cabang yang identik. Kewajiban hukum Pokja Pemilihan adalah:", 
     "Menyatakan ketiga penawaran gugur karena terbukti indikasi persekongkolan horisontal, mengenakan sanksi daftar hitam, dan melaporkan ke KPPU", "Mengundi pemenang secara acak dari ketiga vendor", "Mengizinkan mereka mengerjakan proyek bersama-sama", "Menutup mata karena tender sudah kuorum 3 peserta", "A", 
     "Kesamaan alamat IP, dokumen identik, dan jaminan sama adalah bukti kuat kartel/kolusi penawaran yang mewajibkan diskualifikasi total dan sanksi hukum.", reg5)
]

add_topic(t5, reg5, t5_m, t5_s, t5_a)

with open("scripts/p3_all_done.json", "w", encoding="utf-8") as f:
    json.dump(all_part3, f, indent=2, ensure_ascii=False)
