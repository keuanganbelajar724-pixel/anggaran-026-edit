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

# Load first 450 questions
with open("scripts/p3_topics1_to_9.json", "r", encoding="utf-8") as f:
    part3_questions = json.load(f)

print(f"Loaded existing {len(part3_questions)} questions.")
cur_num = 1501

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
# TOPIC 10: Integritas, Pengendalian Intern (SPIP) & Zona Integritas (1501 - 1550)
# ============================================================================
t10 = "Integritas, Pengendalian Intern (SPIP) & Zona Integritas"
reg10 = "PP No. 60/2008 tentang Sistem Pengendalian Intern Pemerintah (SPIP) jo PermenPAN-RB No. 90/2021 tentang Pembangunan ZI-WBK/WBBM"

t10_m = [
    ("Unsur pertama dan paling fundamental dalam Sistem Pengendalian Intern Pemerintah (SPIP) adalah:", 
     "Lingkungan Pengendalian", "Penilaian Risiko", "Kegiatan Pengendalian", "Informasi dan Komunikasi", "A", 
     "Lingkungan Pengendalian adalah fondasi dari 5 unsur SPIP yang menciptakan disiplin dan struktur integritas organisasi.", reg10),
    ("Predikat Zona Integritas (ZI) tahap pertama yang dianugerahkan KemenPAN-RB kepada unit kerja berintegritas tinggi adalah:", 
     "Wilayah Bebas dari Korupsi (WBK)", "Wilayah Birokrasi Bersih dan Melayani (WBBM)", "Kantor Pelayanan Terpadu", "Satker Bebas Utang", "A", 
     "Tahapan ZI: WBK (Wilayah Bebas dari Korupsi) diraih terlebih dahulu sebelum dapat diusulkan menuju WBBM.", reg10),
    ("Pemberian uang, barang, rabat, komisi, tiket perjalanan, atau fasilitas lain kepada pegawai negeri yang berhubungan dengan jabatannya disebut:", 
     "Gratifikasi", "Gaji Ketiga Belas", "Uang Lelah Lembur", "Hadiah Persahabatan Pribadi", "A", 
     "Pasal 12B UU Tipikor mendefinisikan gratifikasi sebagai pemberian dalam arti luas kepada ASN/Penyelenggara Negara terkait jabatan.", reg10),
    ("Batas waktu pelaporan penerimaan gratifikasi kepada Komisi Pemberantasan Korupsi (KPK) agar terbebas dari delik suap adalah:", 
     "Paling lambat 30 hari kerja sejak tanggal penerimaan", "Paling lambat 7 hari kalender", "Paling lambat akhir tahun", "Tidak perlu dilaporkan", "A", 
     "Pelaporan gratifikasi dalam tempo maksimal 30 hari kerja ke KPK membebaskan penerima dari ancaman pidana suap.", reg10),
    ("Sistem penanganan pengaduan dugaan tindak pidana korupsi dan pelanggaran integritas secara rahasia disebut:", 
     "Whistleblowing System (WBS)", "Kotak Saran Terbuka", "Surat Kaleng Dinas", "Buku Tamu Publik", "A", 
     "WBS menjamin kerahasiaan identitas pelapor (whistleblower) dan perlindungan hukum saat melaporkan indikasi fraud.", reg10),
    ("Unit internal di kementerian/lembaga yang bertugas menerima, memverifikasi, dan menyalurkan laporan gratifikasi adalah:", 
     "Unit Pengendalian Gratifikasi (UPG)", "Unit Layanan Pengadaan", "Seksi Pembayaran KPPN", "Koperasi Karyawan", "A", 
     "UPG dibentuk di setiap K/L untuk mengoordinasikan penanganan pelaporan gratifikasi bersama KPK.", reg10),
    ("Benturan Kepentingan (Conflict of Interest) terjadi apabila:", 
     "Keputusan dinas seorang pejabat dipengaruhi oleh kepentingan pribadi, keluarga, atau relasi bisnisnya di luar tugas dinas", "Pejabat memiliki dua hobi berbeda", "Dua pegawai kantor menyukai makanan yang sama", "Ada perbedaan pendapat ilmiah dalam rapat", "A", 
     "Benturan kepentingan adalah situasi di mana penyelenggara negara memiliki kepentingan privat yang dapat mempengaruhi netralitas jabatannya.", reg10),
    ("Surat pernyataan resmi yang ditandatangani oleh pejabat perbendaharaan untuk menolak segala bentuk suap dan korupsi disebut:", 
     "Pakta Integritas", "Surat Izin Mengemudi", "Akta Kelahiran", "Surat Keterangan Sehat", "A", 
     "Pakta integritas mengikat moral dan hukum pejabat perbendaharaan untuk menjunjung tinggi kejujuran dan anti-korupsi.", reg10),
    ("Berapakah jumlah area perubahan utama dalam kerangka pembangunan Zona Integritas (ZI)?", 
     "6 Area Perubahan", "4 Area Perubahan", "8 Area Perubahan", "10 Area Perubahan", "A", 
     "Pembangunan ZI mencakup 6 area: Manajemen Perubahan, Penataan Tatalaksana, Penataan SDM, Penguatan Akuntabilitas, Penguatan Pengawasan, dan Peningkatan Kualitas Pelayanan Publik.", reg10),
    ("Aparat Pengawasan Intern Pemerintah (APIP) pada tingkat kementerian pusat dijalankan oleh:", 
     "Inspektorat Jenderal (Itjen)", "Badan Pemeriksa Keuangan (BPK)", "Komisi Yudisial", "Mahkamah Konstitusi", "A", 
     "Inspektorat Jenderal bertindak sebagai APIP kementerian yang mengawal audit intern, reviu LK, dan pengawasan integritas.", reg10),
    ("Pelaporan Harta Kekayaan Penyelenggara Negara (LHKPN) wajib disampaikan setiap tahun secara elektronik kepada:", 
     "Komisi Pemberantasan Korupsi (KPK)", "Dinas Kependudukan", "Bank Indonesia", "Kantor Pos Indonesia", "A", 
     "LHKPN wajib disampaikan oleh pejabat negara dan pejabat strategis (termasuk KPA/PPK) kepada KPK via e-LHKPN.", reg10),
    ("Bagi pegawai ASN non-penyelenggara negara, kewajiban pelaporan kekayaan dilakukan melalui:", 
     "LHKASN / SPT Tahunan Pajak yang terintegrasi", "Buku tabungan dinas", "Catatan warisan keluarga", "Surat pernyataan di kelurahan", "A", 
     "LHKASN mengadministrasikan kepatuhan pelaporan harta kekayaan seluruh aparatur sipil negara non-wajib LHKPN.", reg10),
    ("Tindakan pejabat yang mengalokasikan anggaran untuk menyewa mobil dari perusahaan miliknya sendiri merupakan contoh:", 
     "Pelanggaran benturan kepentingan (self-dealing)", "Efisiensi anggaran negara", "Bentuk kemandirian pegawai", "Inovasi pengadaan", "A", 
     "Self-dealing (transaksi dengan diri sendiri/afiliasi) adalah penyalahgunaan jabatan yang dilarang keras dalam tata kelola publik.", reg10),
    ("Kanal pengaduan masyarakat terintegrasi nasional yang terhubung dengan Kantor Staf Presiden, KemenPAN-RB, dan Ombudsman adalah:", 
     "SP4N-LAPOR!", "Twitter Humas", "Kotak Pos 5000", "Layanan Panggilan Darurat 112", "A", 
     "SP4N-LAPOR! adalah platform nasional aspirasi dan pengaduan pelayanan publik seluruh instansi pemerintah di Indonesia.", reg10),
    ("Tujuan utama penerapan manajemen risiko dalam Sistem Pengendalian Intern Pemerintah (SPIP) adalah:", 
     "Mengidentifikasi, menganalisis, dan memitigasi potensi risiko kegagalan pencapaian tujuan organisasi dan fraud", "Menghilangkan semua pekerjaan staf", "Mencari kambing hitam jika terjadi kegagalan", "Menghindari audit auditor eksternal", "A", 
     "Manajemen risiko memetakan risiko strategis, operasional, dan kepatuhan serta merancang kegiatan pengendalian dini.", reg10),
    ("Survei Penilaian Integritas (SPI) yang diselenggarakan setiap tahun oleh KPK mengukur:", 
     "Tingkat risiko korupsi internal dan eksternal pada kementerian/lembaga/pemda", "Kecepatan internet di kantor", "Tingkat kesegaran jasmani pegawai", "Nilai tes wawasan kebangsaan staf", "A", 
     "Survei Penilaian Integritas (SPI) KPK memetakan persepsi dan pengalaman pegawai/pengguna layanan terhadap integritas instansi.", reg10),
    ("Konsep 'Three Lines of Defense' (Tiga Lini Pertahanan) dalam pengendalian internal menempatkan Lini Pertama pada:", 
     "Manajemen operasional dan seluruh pegawai unit kerja pemilik risiko (Satker)", "Auditor Inspektorat Jenderal (APIP)", "Badan Pemeriksa Keuangan (BPK)", "Aparat Penegak Hukum (KPK/Polri)", "A", 
     "Lini pertama pertahanan adalah manajemen operasional sehari-hari satker yang bertugas mendeteksi dan mencegah kesalahan langsung.", reg10)
]

t10_s = [
    ("Bagaimanakah alur penanganan laporan gratifikasi oleh Unit Pengendalian Gratifikasi (UPG) hingga terbit SK Penetapan KPK?", 
     "Penerima lapor ke UPG/KPK dalam 30 hari -> UPG verifikasi dan teruskan ke KPK -> KPK analisis status -> Terbit SK KPK: Menjadi Milik Negara (disetor ke kas negara) atau Milik Penerima", "Penerima langsung memakan makanan gratifikasi bersama teman kantor", "UPG menjual barang dan uangnya dibagi ke staf", "KPK langsung memenjarakan penerima tanpa analisis", "A", 
     "Proses gratifikasi: Pelaporan mandiri -> Kajian legal KPK -> Penetapan status kepemilikan SK KPK (menjadi milik negara atau milik penerima).", reg10),
    ("Satker ingin meraih predikat Wilayah Birokrasi Bersih dan Melayani (WBBM). Syarat mutlak kelayakan pengusulan adalah:", 
     "Telah berpredikat WBK minimal 1 tahun, opini Laporan Keuangan WTP minimal 2 tahun berturut-turut, dan nilai SAKIP minimal 'BB'", "Memiliki gedung kantor berlantai sepuluh", "Semua pegawai memiliki mobil dinas", "Mendapat sumbangan dana dari perusahaan swasta", "A", 
     "KemenPAN-RB menetapkan syarat ketat pengusulan WBBM: telah meraih WBK, opini WTP bersih, nilai akuntabilitas SAKIP tinggi, dan nihil kasus korupsi aktif.", reg10),
    ("Dalam audit investigasi atas dugaan korupsi, perbedaan mendasar antara 'Audit Kepatuhan' dan 'Audit Investigatif' adalah:", 
     "Audit kepatuhan menguji kesesuaian prosedur formal; Audit investigatif bertujuan mengumpulkan bukti hukum (evidence) untuk membuktikan tindak pidana korupsi", "Audit kepatuhan dilakukan oleh polisi, investigatif oleh dokter", "Audit kepatuhan memeriksa uang tunai, investigatif memeriksa barang antik", "Tidak ada perbedaan", "A", 
     "Audit investigatif berorientasi pembuktian delik perbuatan melawan hukum, kerugian negara, dan niat jahat (mens rea) untuk ranah litigasi.", reg10),
    ("Apa langkah mitigasi yang wajib diambil oleh seorang PPK jika ditawarkan parcel hari raya senilai Rp 5 juta oleh rekanan pemenang lelang?", 
     "Menolak secara tegas dan santun; jika parcel terlanjur diantar ke rumah tanpa sepengetahuan, segera lapor ke UPG/KPK dalam tempo ≤ 30 hari kerja", "Menerima parcel dan membalas dengan memberi proyek baru", "Menjual parcel ke tetangga", "Menyimpan parcel di bawah meja kerja", "A", 
     "Prinsip gratifikasi: tolak di awal; jika dalam kondisi tertentu tidak dapat ditolak (dikirim ke rumah), wajib dilaporkan ke UPG/KPK.", reg10),
    ("Bagaimanakah penerapan inovasi pelayanan publik yang berdampak pada penilaian Area Pelayanan Publik Zona Integritas?", 
     "Membangun inovasi berbasis teknologi yang memangkas waktu layanan, meniadakan biaya pungli, transparan, dan dapat direplikasi oleh unit lain", "Membuat baliho foto kepala kantor berukuran raksasa", "Mengganti seragam kantor setiap bulan", "Membagikan bingkisan makanan kepada pengunjung", "A", 
     "Inovasi WBK/WBBM dievaluasi dari dampak nyata (outcome) kemudahan pengguna layanan, kepuasan masyarakat, dan eliminasi pungutan liar.", reg10),
    ("Dalam Sistem Pengendalian Intern Pemerintah (SPIP), kegiatan 'Fraud Risk Assessment' (FRA) bertujuan untuk:", 
     "Mengidentifikasi skenario kecurangan yang mungkin terjadi pada proses bisnis pengadaan, pembayaran, dan perpajakan serta merancang kontrol pencegahannya", "Mencari kesalahan kecil pegawai honorer", "Menghitung laba keuntungan kantor", "Memperkirakan harga saham bursa", "A", 
     "FRA secara proaktif membedah titik-titik rawan kecurangan (fraud prone areas) di satker untuk menutup celah korupsi sebelum terjadi.", reg10),
    ("Apa fungsi dari Ruang Konsultasi Terbuka (Open Consultation Room) transparan di KPPN percontohan WBBM?", 
     "Menghilangkan ruangan tertutup yang berpotensi menjadi ajang negosiasi gelap, memastikan seluruh interaksi petugas dan satker terpantau kamera CCTV", "Tempat bermain anak-anak pengunjung", "Ruang tidur siang bagi petugas loket", "Tempat menyimpan arsip kertas lama", "A", 
     "Open space dan CCTV transparan adalah arsitektur fisik anti-korupsi untuk mencegah kontak personal yang rawan gratifikasi dan pemerasan.", reg10),
    ("Apabila pengaduan masyarakat melalui Whistleblowing System (WBS) terbukti benar melibatkan KPA, tindakan APIP Itjen adalah:", 
     "Melakukan Audit Investigasi mendalam, menyusun Laporan Hasil Audit Investigasi (LHAI), dan merekomendasikan sanksi berat serta pelimpahan ke APH", "Membocorkan identitas pelapor ke KPA", "Menghapus pesan pengaduan dari server", "Meminta uang suap kepada KPA agar kasus ditutup", "A", 
     "Laporan WBS yang valid ditindaklanjuti audit forensik independen; pelapor dilindungi kerahasiaannya dan rekomendasi sanksi diterbitkan resmi.", reg10),
    ("Dalam evaluasi Tingkat Maturitas SPIP, level maturitas tertinggi (Level 5) menunjukkan bahwa:", 
     "Pengendalian intern telah terintegrasi penuh, adaptif, berbasis continuous improvement, dan mengantisipasi risiko masa depan secara otomatis", "Organisasi tidak memerlukan aturan tertulis lagi", "Tidak ada staf yang melakukan kesalahan selamanya", "Semua pekerjaan diserahkan kepada robot", "A", 
     "Maturitas SPIP Level 5 (Optimum) mencerminkan budaya risiko yang matang, inovasi pengendalian berkelanjutan, dan kepemimpinan berintegritas tinggi.", reg10),
    ("Dokumen Analisis Risiko Keuangan Negara pada Satker Perbendaharaan memuat komponen:", 
     "Konteks risiko, Identifikasi risiko, Analisis probabilitas dan dampak, Evaluasi toleransi risiko, dan Rencana Aksi Mitigasi (RTP)", "Daftar menu makanan rapat", "Nama-nama artis favorit pegawai", "Jadwal pertandingan sepak bola", "A", 
     "Register risiko memetakan profil risiko secara kuantitatif/kualitatif dan menetapkan Rencana Tindak Pengendalian (RTP) terukur.", reg10),
    ("Bagaimanakah penanganan pegawai yang menolak melaporkan LHKPN/LHKASN meskipun telah diberi peringatan tertulis?", 
     "Dijatuhi sanksi hukuman disiplin ASN (pemotongan tunjangan kinerja hingga pencopotan dari jabatan struktural) sesuai PP Disiplin PNS", "Diberikan penghargaan pegawai teladan", "Dinaikkan pangkatnya secara kilat", "Dibiarkan karena pelaporan bersifat sukarela", "A", 
     "Kepatuhan LHKPN adalah kewajiban hukum penyelenggara negara; pengabaian berakibat penahanan tunjangan kinerja dan sanksi hukuman disiplin.", reg10),
    ("Apa yang dimaksud dengan 'Tone at the Top' dalam pembangunan budaya integritas organisasi publik?", 
     "Komitmen keteladanan nyata dari pimpinan tertinggi dalam menegakkan etika moral, menolak suap, dan tidak memberikan toleransi pada kecurangan", "Suara pimpinan saat bernyanyi di panggung", "Pimpinan berbicara keras dengan pengeras suara", "Pimpinan yang selalu marah-marah kepada staf", "A", 
     "Tone at the top adalah keteladanan moral para pimpinan puncak yang menjadi cermin dan teladan integritas bagi seluruh jajaran pegawai.", reg10),
    ("Dalam hal terjadi anomali pengeluaran kas yang mengarah pada penyelewengan, instrumen audit internal yang digunakan adalah:", 
     "Pemeriksaan Khusus (Pemsus) dengan teknik Audit Forensik dan Pemeriksaan Fisik Kas Mendadak (Surprise Cash Audit)", "Wawancara santai di kafe", "Meminta pegawai mengisi kuis majalah", "Menunggu hingga akhir masa jabatan presiden", "A", 
     "Pemsus dan surprise cash audit membedah pembukuan secara mendadak untuk membuktikan ketekoran kas dan manipulasi buku kas umum.", reg10),
    ("Apakah pemberian cinderamata plakat akrilik berlogo instansi pada acara kunjungan dinas resmi dianggap sebagai gratifikasi terlarang?", 
     "Bukan gratifikasi terlarang sepanjang nilainya wajar sesuai standar kedinasan dan diperlakukan sebagai inventaris kantor resmi instansi", "Selalu merupakan tindak pidana korupsi", "Wajib disita KPK dan dihancurkan", "Penerima harus dipenjara 5 tahun", "A", 
     "Cinderamata kedinasan resmi antar-lembaga berlogo instansi dikecualikan dari gratifikasi terlarang dan dicatat sebagai aset/inventaris kantor.", reg10),
    ("Dalam rangka menjaga netralitas ASN menjelang pemilu, aturan integritas melarang pegawai perbendaharaan untuk:", 
     "Menghadiri deklarasi politik, berfoto dengan pose terafiliasi partai politik, atau menggunakan fasilitas kantor untuk kepentingan kampanye", "Membaca berita koran politik", "Menggunakan hak pilih di bilik suara", "Membayar pajak penghasilan", "A", 
     "Netralitas ASN diatur ketat dalam UU ASN: larangan keterlibatan aktif, politik praktis, dan penggunaan fasilitas negara demi imparsialitas birokrasi.", reg10),
    ("Dokumen Rencana Tindak Pengendalian (RTP) dalam implementasi SPIP wajib dimonitor kemajuannya setiap:", 
     "Triwulanan oleh Tim Manajemen Risiko Satker dan dilaporkan ke Inspektorat", "Sepuluh tahun sekali", "Hanya saat kantor diperiksa BPK", "Setiap pergantian tahun masehi saja", "A", 
     "Monitoring RTP diselenggarakan berkala (triwulan) untuk memastikan efektivitas tindakan mitigasi atas risiko-risiko prioritas organisasi.", reg10),
    ("Mengapa saluran pengaduan publik SP4N-LAPOR! wajib dikelola dengan Service Level Agreement (SLA) tindak lanjut yang cepat?", 
     "Menjamin kepastian respon kepada masyarakat, memulihkan kepercayaan publik, dan mencegah keluhan viral di media sosial", "Supaya staf kantor tidak mengantuk", "Agar server website tidak kepenuhan", "Menghindari tagihan internet bulanan", "A", 
     "SLA respon cepat membuktikan komitmen birokrasi responsif, melayani, dan menghargai partisipasi pengawasan warga negara.", reg10)
]

t10_a = [
    ("Analisis Kasus Pemerasan Terselubung Petugas Loket Perbendaharaan: Petugas loket sengaja memperlambat verifikasi SPM satker dan baru mempercepatnya jika satker memberikan amplop 'uang kopi' Rp 200.000. Analisis delik hukum Tipikor atas perbuatan petugas loket adalah:", 
     "Tindak pidana pemerasan dalam jabatan (Pasal 12 huruf e UU Tipikor) atau suap pasif, dijatuhi hukuman pidana penjara minimal 4 tahun dan pemecatan ASN", "Bukan pelanggaran karena nominal uang kecil", "Merupakan kearifan lokal pelayanan publik", "Tindakan wajar karena gaji petugas loket kurang", "A", 
     "Meminta imbalan untuk mempercepat layanan kedinasan yang merupakan kewajibannya adalah delik pemerasan dalam jabatan (pungli) dalam UU Tipikor.", reg10),
    ("Analisis Kegagalan Meraih Predikat WBK Akibat Indeks Persepsi Korupsi Rendah: Satker telah melengkapi 100% dokumen Lembar Kerja Evaluasi (LKE) ZI, namun saat survei misteri shopper oleh Tim Penilai Nasional (TPN) ditemukan praktik percaloan tiket antrean. Keputusan TPN yang sah adalah:", 
     "Menggugurkan usulan predikat WBK satker tersebut karena pembangunan ZI berorientasi pada integritas perilaku riil di lapangan, bukan sekadar kelengkapan berkas formalitas", "Tetap meluluskan WBK karena berkasnya lengkap", "Menangkap seluruh pengguna layanan yang disurvei", "Memberikan predikat WBK dengan syarat berjanji tidak mengulangi", "A", 
     "Predikat WBK menitikberatkan pada 'clean from corruption' yang terbukti nyata di lapangan; keberadaan pungli/calo seketika menggugurkan kelulusan.", reg10),
    ("Analisis Kasus Perlindungan Whistleblower dari Tindakan Balas Dendam Pimpinan: Pegawai staf melaporkan rekayasa BAST fiktif yang dilakukan oleh KPA kepada Inspektorat Jenderal. KPA membalas dengan memutasi staf tersebut ke gudang dan memotong tunjangan kinerjanya. Tindakan perlindungan hukum yang wajib ditegakkan adalah:", 
     "APIP dan LPSK wajib membatalkan mutasi sepihak tersebut, memulihkan hak-hak staf, memberikan perlindungan karir, dan memeriksa KPA atas pelanggaran obstruction of justice", "Menyarankan staf tersebut mengundurkan diri dari ASN", "Mendukung KPA karena pimpinan memiliki hak prerogatif mutlak", "Memindahkan staf ke kementerian lain", "A", 
     "UU Perlindungan Saksi dan Korban serta regulasi WBS melarang segala bentuk tindakan pembalasan administratif terhadap pelapor kecurangan dinas.", reg10),
    ("Analisis Kasus Keterlibatan Keluarga Pejabat dalam Pengadaan Barang Dinas: Suami dari Kepala Satker menjabat sebagai Direktur Utama perusahaan yang memenangkan lelang renovasi gedung kantor satker berkenaan. Analisis potensi benturan kepentingan dan keabsahan kontrak adalah:", 
     "Kontrak pengadaan cacat hukum karena terdapat benturan kepentingan kekeluargaan langsung; Kepala Satker wajib mendeklarasikan benturan kepentingan dan menolak perikatan", "Tindakan legal karena suami-istri berhak saling tolong-menolong", "Kontrak sah asalkan harga yang ditawarkan murah", "Bukan urusan kantor melainkan urusan rumah tangga", "A", 
     "Benturan kepentingan hubungan perkawinan dalam pengadaan publik merusak persaingan adil dan berpotensi delik korupsi Pasal 12 huruf i UU Tipikor.", reg10),
    ("Studi Kasus Gratifikasi Pernikahan Anak Pejabat Perbendaharaan: Pejabat eselon II mengundang para rekanan penyedia jasa perbendaharaan pada resepsi pernikahan anaknya dan menerima amplop uang total Rp 300 juta. Kewajiban pelaporan gratifikasi yang benar adalah:", 
     "Wajib melaporkan seluruh penerimaan amplop dari pihak rekanan kedinasan ke KPK dalam waktu 30 hari kerja untuk ditetapkan statusnya apakah menjadi milik negara", "Boleh diambil seluruhnya karena merupakan hadiah hajatan adat", "Uang kas disembunyikan di rekening luar negeri", "Cukup dibagikan sebagian ke panti asuhan tanpa lapor KPK", "A", 
     "Hadiah pernikahan dari pihak yang memiliki hubungan jabatan diwajibkan lapor ke KPK untuk menguji batas kewajaran dan mencegah suap terselubung.", reg10),
    ("Analisis Penerapan Digital Forensics pada Penelusuran Jejak Korupsi Pembayaran APBN: Mengapa log audit digital pada aplikasi SAKTI (waktu login, IP address, stempel digital TTE) menjadi bukti kunci yang tidak terbantahkan di persidangan Pengadilan Tipikor?", 
     "Karena sistem digital mencatat audit trail permanen dengan enkripsi kriptografi yang membuktikan identitas pengguna (non-repudiation) dan kronologi waktu transaksi riil", "Karena hakim selalu mempercayai komputer dibanding saksi manusia", "Karena file digital tidak dapat dihapus oleh siapapun di dunia", "Karena komputer dibuat oleh pemerintah", "A", 
     "Non-repudiation pada TTE dan audit trail SAKTI memberikan kepastian hukum pembuktian siapa yang menekan tombol persetujuan pencairan uang negara.", reg10),
    ("Analisis Kasus Rekayasa Nilai Survei Kepuasan Masyarakat (SKM) Fiktif: Untuk mengejar nilai evaluasi Zona Integritas, staf satker mengisi kuesioner SKM sendiri secara massal menggunakan nomor HP palsu. Dampak etika dan konsekuensi audit atas rekayasa ini adalah:", 
     "Pelanggaran moralitas birokrasi berat; nilai survei dianulir menjadi nol, usulan WBK dibatalkan, dan pejabat yang memerintahkan dijatuhi hukuman disiplin berat", "Tindakan cerdas untuk membantu institusi mencapai target", "Praktik yang lumrah dan diperbolehkan dalam administrasi", "Staf diberikan penghargaan atas loyalitasnya", "A", 
     "Integritas adalah kejujuran; memalsukan kepuasan publik adalah kebohongan institusional yang mencederai esensi reformasi birokrasi bersih dan melayani.", reg10),
    ("Analisis Efektivitas Pengendalian Intern Kasus Pemisahan Otorisasi CMS Perbankan: Mengapa jika token Operator (Maker) dan token Pejabat (Approver) dipegang oleh satu orang staf yang sama, sistem pengendalian intern seketika runtuh (Internal Control Breakdown)?", 
     "Menghilangkan fungsi pengawasan silang (four-eyes principle), membuka peluang satu orang mencairkan uang kas negara ke rekening pribadinya tanpa terdeteksi", "Karena laptop akan kehabisan daya baterai", "Karena bank menolak transaksi yang terlalu cepat", "Karena nama pegawai akan terhapus dari absensi", "A", 
     "Pemisahan Maker-Approver adalah pilar kendali kas; penggabungan kedua peran melenyapkan checks and balances dan memicu penggelapan kas instan.", reg10),
    ("Analisis Kasus Keterlibatan Oknum Auditor APIP dalam Menerima Fasilitas Mewah Saat Audit Lapangan: Tim auditor Itjen menerima akomodasi hotel bintang lima dan uang saku harian dari satker yang sedang diaudit. Evaluasi objektivitas dan independensi auditor adalah:", 
     "Independensi auditor terkompromi (impaired independence); melanggar Standar Audit APIP dan Kode Etik, serta hasil audit dinyatakan bias dan tidak sah", "Tindakan wajar sebagai bentuk keramahan tuan rumah", "Diperbolehkan asalkan laporan audit tetap obyektif", "Bentuk sinergi positif antar-pegawai kementerian", "A", 
     "Menerima fasilitas dari auditee merusak independensi audit dan melanggar kode etik; akomodasi auditor wajib dibiayai penuh oleh DIPA Inspektorat.", reg10),
    ("Analisis Kasus Penggelapan Uang Pajak oleh Staf Pembantu Bendahara: Staf mencetak kode billing pajak, memungut uang tunai dari rekanan, namun uangnya digunakan judi online dan menyetor billing dengan struk ATM editan. Tindakan pengendalian preventif yang lalai diterapkan bendahara adalah:", 
     "Bendahara lalai melakukan validasi NTPN (Nomor Transaksi Penerimaan Negara) pada Modul Penerimaan Negara (MPN) untuk memastikan uang benar-benar telah masuk kas negara", "Bendahara tidak meminjamkan uang pribadinya", "Bendahara tidak mengawasi rekening media sosial staf", "Bendahara terlalu sering cuti", "A", 
     "Validasi NTPN di sistem perbendaharaan adalah konfirmasi mutlak bahwa kas telah disetor ke kas negara; struk kertas tanpa NTPN valid rawan dipalsukan.", reg10),
    ("Analisis Peran Whistleblower Eksternal dalam Pemberantasan Mafia Anggaran: Mengapa saluran pengaduan eksternal yang mudah diakses masyarakat luas mampu membongkar praktik suap perizinan yang rapi di lingkungan instansi publik?", 
     "Menembus dinding kebisuan internal (code of silence), memberikan informasi langsung dari pihak korban pemerasan, dan menciptakan efek jera bagi oknum birokrat", "Karena masyarakat memiliki intelijen pribadi", "Karena masyarakat tidak menyukai pegawai negeri", "Karena laporan eksternal selalu dibayar dengan hadiah uang tunai", "A", 
     "Partisipasi publik meruntuhkan solidaritas kejahatan internal birokrasi; laporan eksternal menjadi sumber intelijen paling sahih bagi aparat pengawas.", reg10),
    ("Analisis Kasus 'Revolving Door' (Mantan Pejabat Menjadi Rekanan Satker Lama): Mantan Kepala Satker yang baru pensiun 2 bulan mendirikan CV dan langsung memenangkan tender pengadaan di kantor lamanya karena kedekatan dengan mantan bawahan. Analisis kepatuhan etik dan risiko tata kelolanya adalah:", 
     "Pelanggaran prinsip cooling-off period etika pengadaan publik; menimbulkan persepsi favoritisme, perlakuan istimewa, dan mengorbankan persaingan usaha yang sehat", "Langkah wirausaha yang mulia yang patut dicontoh", "Bentuk bakti mantan pejabat kepada kantor lamanya", "Tindakan legal tanpa cacat moral apapun", "A", 
     "Praktik revolving door tanpa masa jeda etik (cooling-off) memicu perlakuan diskriminatif terhadap pelaku usaha lain dan merusak integritas tender.", reg10),
    ("Analisis Evaluasi Budaya 'No Gift Policy' (Kebijakan Tolak Hadiah) Menjelang Hari Raya Idul Fitri: Mengapa penempelan spanduk dan pengumuman resmi 'Kami Tidak Menerima Parsel/Hadiah Apapun' melindungi martabat seluruh pejabat perbendaharaan?", 
     "Menghilangkan beban psikologis dan ewuh-pakewuh pejabat untuk melayani secara adil tanpa terikat utang budi kepada rekanan manapun", "Karena kantor tidak memiliki tempat untuk menaruh parsel", "Supaya kurir pengantar barang tidak capek", "Menunjukkan bahwa pegawai perbendaharaan sudah kaya raya", "A", 
     "Kebijakan No Gift Policy meniadakan relasi utang budi emosional, memastikan seluruh satker dan rekanan dilayani dengan standar keadilan yang setara.", reg10),
    ("Analisis Kasus Sanksi Pemecatan Tidak Dengan Hormat (PTDH) terhadap ASN Terpidana Korupsi: Mengapa ASN yang dijatuhi vonis pidana penjara berkekuatan hukum tetap (inkracht) atas kasus korupsi wajib diberhentikan tidak dengan hormat?", 
     "Amanat tegas UU Aparatur Sipil Negara (UU No. 20/2023) yang menerapkan zero tolerance terhadap tindak pidana jabatan/korupsi demi marwah kehormatan negara", "Supaya negara tidak perlu membayar uang pensiun lagi", "Menuruti permintaan demonstrasi masyarakat", "Karena penjara tidak memiliki akses internet kantor", "A", 
     "Pasal pemberhentian ASN menetapkan vonis pidana korupsi yang inkracht berakibat hukum pemecatan tidak dengan hormat tanpa diskresi pimpinan.", reg10),
    ("Analisis Transformasi Budaya Kerja Melalui Manajemen Perubahan (Change Management) ZI: Mengapa resistensi pegawai terhadap sistem presensi digital dan pengawasan kinerja online harus diatasi dengan dialog dan role model pimpinan?", 
     "Mengubah mindset birokrasi zona nyaman menuju kultur akuntabilitas kinerja, integritas waktu, dan pelayanan berorientasi hasil yang terukur", "Memaksa pegawai bekerja tanpa istirahat", "Menghukum staf yang tidak mahir menggunakan smartphone", "Supaya pimpinan terlihat modern", "A", 
     "Manajemen perubahan mengubah pola pikir dan budaya kerja dari feodalisme pasif menjadi birokrasi modern yang adaptif, bersih, dan profesional.", reg10),
    ("Analisis Dampak Pembangunan Zona Integritas terhadap Kepuasan Pengguna Layanan Perbendaharaan: Mengapa predikat WBK dan WBBM di KPPN terbukti mempercepat SLA pencairan SP2D dan mendekatkan indeks kepuasan satker ke angka 100%?", 
     "Menghapus pungutan liar, menstandarkan proses bisnis transparan, membangun etos pelayanan prima, dan menyediakan kanal pengaduan yang ditindaklanjuti nyata", "Karena KPPN memberikan pinjaman uang gratis kepada satker", "Karena staf KPPN selalu membagikan souvenir mewah", "Karena ujian sertifikasi dihapuskan", "A", 
     "WBK/WBBM mentransformasikan KPPN menjadi institusi pelayanan berkelas dunia: proses cepat, bebas pungli, transparan, dan berpusat pada kepuasan pelanggan.", reg10)
]

add_topic(t10, reg10, t10_m, t10_s, t10_a)

print(f"Total Part 3 questions assembled: {len(part3_questions)}")

# Write to src/data/masterQuizBankDataPart3.ts
target_file = "src/data/masterQuizBankDataPart3.ts"
with open(target_file, "w", encoding="utf-8") as f:
    f.write("import { MasterBankQuestion } from '../types/quiz';\n\n")
    f.write("export const MASTER_QUIZ_BANK_PART3: MasterBankQuestion[] = [\n")
    for i, item in enumerate(part3_questions):
        f.write(json.dumps(item, indent=2, ensure_ascii=False))
        if i < len(part3_questions) - 1:
            f.write(",\n")
        else:
            f.write("\n")
    f.write("];\n")

print(f"Successfully wrote {len(part3_questions)} questions to {target_file}!")
