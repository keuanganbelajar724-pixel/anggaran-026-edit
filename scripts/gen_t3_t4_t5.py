# -*- coding: utf-8 -*-
import json

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
cur_num = 1151

# ============================================================================
# TOPIC 3: Mekanisme Pembayaran APBN & SP2D Elektronik (1151 - 1200)
# ============================================================================
t3 = "Mekanisme Pembayaran APBN & SP2D Elektronik"
reg3 = "PMK No. 190/PMK.05/2012 jo PMK No. 210/PMK.05/2022 tentang Tata Cara Pembayaran APBN"

t3_mudah = [
    ("Dokumen pelaksanaan anggaran yang menjadi dasar penerbitan SPM oleh PPSPM adalah:", 
     "DIPA (Daftar Isian Pelaksanaan Anggaran)", "Buku Tabungan Satker", "Surat Izin Usaha Perdagangan", "Faktur Penjualan Toko", "A", 
     "DIPA adalah dokumen pelaksanaan anggaran yang memuat alokasi pagu belanja dan rencana penarikan kas yang sah.", reg3),
    ("Penerbitan Surat Perintah Pencairan Dana (SP2D) merupakan kewenangan mutlak dari:", 
     "Kantor Pelayanan Perbendaharaan Negara (KPPN) selaku Kuasa BUN", "Pejabat Pembuat Komitmen (PPK)", "Badan Pemeriksa Keuangan (BPK)", "Bank Indonesia Pusat", "A", 
     "KPPN bertindak sebagai Kuasa Bendahara Umum Negara (BUN) yang berwenang menerbitkan SP2D atas SPM yang diajukan satker.", reg3),
    ("Berapa batas waktu penerbitan SP2D oleh KPPN setelah SPM dinyatakan benar dan lengkap sesuai SPMT?", 
     "Maksimal 1 jam untuk SPM gaji/UP dan 1 hari kerja untuk SPM non-gaji", "Paling lambat 7 hari kerja", "Paling lambat 14 hari kalender", "Paling lambat 30 hari kerja", "A", 
     "KPPN menerapkan standar pelayanan prima penerbitan SP2D dalam hitungan jam (same day service) jika dokumen lengkap dan valid.", reg3),
    ("Dokumen pengujian belanja yang diterbitkan oleh PPK kepada PPSPM disebut:", 
     "Surat Permintaan Pembayaran (SPP)", "Surat Perintah Membayar (SPM)", "Surat Perintah Pencairan Dana (SP2D)", "Kuitansi Pembelian", "A", 
     "PPK menguji tagihan dan menerbitkan SPP; PPSPM menguji SPP dan menerbitkan SPM.", reg3),
    ("Pembayaran langsung (LS) kepada pihak ketiga wajib digunakan untuk pembayaran belanja yang bernilai:", 
     "Di atas batas maksimal Uang Persediaan atau pengadaan kontraktual", "Berapapun nominalnya asalkan tunai", "Hanya belanja di bawah Rp 1 juta", "Khusus belanja valuta asing", "A", 
     "Mekanisme LS diprioritaskan untuk belanja kontraktual dan tagihan kepada pihak ketiga di atas batas nominal UP.", reg3),
    ("SP2D elektronik ditandatangani secara digital oleh Seksi Pencairan Dana KPPN menggunakan:", 
     "Tanda Tangan Elektronik (TTE) tersertifikasi", "Stempel basah tinta ungu", "Cap jempol petugas loket", "Barcode barcode acak tanpa sertifikat", "A", 
     "SP2D elektronik disahkan dengan TTE tersertifikasi dari Penyelenggara Sertifikasi Elektronik (PSrE) instansi pemerintah.", reg3),
    ("Retur SP2D terjadi apabila pencairan dana APBN mengalami kegagalan transfer karena:", 
     "Nomor rekening atau nama penerima di bank tujuan salah atau rekening pasif (dormant)", "Penyedia barang menolak menerima uang", "KPPN kehabisan persediaan uang kertas", "Menteri Keuangan membatalkan DIPA", "A", 
     "Retur SP2D terjadi saat bank operasional menolak kredit dana akibat perbedaan nama/nomor rekening tujuan yang tidak valid.", reg3),
    ("Surat Pemberitahuan Retur SP2D diterbitkan oleh:", 
     "Bank Operasional Mitra KPPN kepada KPPN", "Satker kepada penyedia barang", "Auditor BPK kepada Presiden", "Kantor Pos kepada kelurahan", "A", 
     "Bank Operasional penerbit SP2D menyampaikan konfirmasi retur kepada KPPN selambat-lambatnya hari kerja berikutnya.", reg3),
    ("Jangka waktu penyelesaian retur SP2D oleh satker sejak diterbitkannya surat pemberitahuan dari KPPN adalah:", 
     "Paling lambat 7 hari kerja", "Paling lambat 30 hari kerja", "Paling lambat 3 bulan", "Tidak ada batas waktu", "A", 
     "Satker wajib menyampaikan surat ralat/revisi rekening retur paling lambat 7 hari kerja setelah menerima surat pemberitahuan.", reg3),
    ("Untuk pembayaran gaji induk bulanan PNS/TNI/Polri, SPM Gaji Induk wajib diajukan ke KPPN paling lambat:", 
     "Tanggal 15 bulan sebelum bulan pembayaran", "Tanggal 1 bulan pembayaran", "Tanggal 25 bulan berjalan", "Tanggal 5 hari kerja sebelum akhir tahun", "A", 
     "SPM Gaji Induk diajukan paling lambat tanggal 15 bulan sebelum bulan pembayaran (misal gaji Februari diajukan maksimal 15 Januari).", reg3),
    ("SPM Penggantian Uang Persediaan (GUP) diajukan oleh PPSPM kepada KPPN untuk:", 
     "Mengganti uang persediaan kas yang telah dibelanjakan oleh bendahara pengeluaran", "Menambah pagu anggaran DIPA", "Membayar denda keterlambatan proyek", "Membeli valuta asing untuk cadangan devisa", "A", 
     "GUP bertujuan merevolving saldo kas UP bendahara yang telah sah dibelanjakan agar kembali ke pagu awal UP.", reg3),
    ("Dokumen Berita Acara Serah Terima (BAST) pekerjaan pengadaan barang/jasa ditandatangani oleh:", 
     "Pejabat Pembuat Komitmen (PPK) dan Penyedia Barang/Jasa", "Bendahara dan Petugas Satpam", "Kepala KPPN dan Direktur Bank", "Petugas Loket dan Supir Dinas", "A", 
     "BAST adalah bukti perdata penyelesaian prestasi kerja yang disepakati dan ditandatangani oleh PPK dan penyedia barang/jasa.", reg3),
    ("Batas waktu pengajuan SPM Penolakan (SPM Perbaikan) yang ditolak KPPN adalah:", 
     "Segera setelah dilakukan perbaikan data dukung atau perbaikan akun", "Harus menunggu tahun anggaran berikutnya", "Otomatis gugur dan tidak dapat diajukan lagi", "Dibatalkan secara permanen oleh pengadilan", "A", 
     "SPM yang ditolak dapat diperbaiki dan diajukan kembali ke KPPN segera setelah kesalahan substansi/administrasi dibetulkan.", reg3),
    ("Kode Bagian Anggaran (BA) Kementerian Keuangan dalam struktur Bagan Akun Standar (BAS) adalah:", 
     "BA 015", "BA 025", "BA 035", "BA 060", "A", 
     "Kode Bagian Anggaran 015 adalah kode resmi Kementerian Keuangan Republik Indonesia.", reg3),
    ("Mekanisme pembayaran honorarium narasumber internal atau staf non-pegawai dapat dibayarkan melalui:", 
     "Mekanisme LS Pembayaran ke Rekening masing-masing atau Uang Persediaan (UP)", "Hanya boleh dibayar tunai di muka", "Menggunakan cek giro swasta", "Mengambil uang kas dari kasir bandara", "A", 
     "Pembayaran honorarium dapat melalui SP2D LS langsung ke rekening masing-masing penerima atau melalui kas UP bendahara.", reg3),
    ("Sistem kliring perbankan nasional yang digunakan Bank Indonesia untuk mentransfer dana SP2D bernilai besar secara seketika adalah:", 
     "BI-RTGS (Real Time Gross Settlement)", "Sistem Wesel Pos", "Kliring Cek Manual Warkat", "Western Union Pemerintah", "A", 
     "BI-RTGS digunakan untuk transfer dana bernilai besar dan transaksi prioritas perbendaharaan negara secara seketika.", reg3),
    ("SKPP (Surat Keterangan Penghentian Pembayaran) diterbitkan apabila seorang PNS:", 
     "Pindah instansi, pensiun, atau meninggal dunia", "Mengambil cuti tahunan selama 3 hari", "Mendapat kenaikan pangkat pilihan", "Mengikuti pelatihan diklat teknis", "A", 
     "SKPP diterbitkan sebagai bukti penghentian pembayaran gaji pada satker lama agar tidak terjadi pembayaran ganda pada satker baru.", reg3)
]

t3_sedang = [
    ("Bagaimanakah alur pengujian dokumen tagihan belanja APBN yang dilakukan oleh PPSPM sebelum menerbitkan SPM?", 
     "Menguji kelengkapan dokumen tagihan, kebenaran perhitungan matematis, ketersediaan pagu dana, dan keabsahan hak tagih", "Hanya memeriksa apakah kwitansi bermaterai", "Meminta persetujuan lisan dari kepala seksi", "Menyerahkan tagihan langsung ke bank tanpa diperiksa", "A", 
     "PPSPM wajib melakukan pengujian substantif dan formal tagihan: kelengkapan berkas, kebenaran hak tagih, ketersediaan pagu, dan kesesuaian output.", reg3),
    ("Dalam hal terjadi penolakan SPM oleh KPPN karena data rekening supplier belum terdaftar di SPAN, tindakan yang benar adalah:", 
     "PPK mendaftarkan data supplier ke SPAN KPPN terlebih dahulu melalui SAKTI hingga terbit NRS, kemudian PPSPM mengajukan kembali SPM", "PPSPM memaksa KPPN menerbitkan SP2D secara manual", "Bendahara membayar tagihan dengan uang kas pribadi", "Menghapus nomor rekening pada lembar SPM", "A", 
     "NRS (Nomor Register Supplier) adalah prasyarat mutlak SPAN untuk memproses pembayaran elektronik; satker wajib meregistrasi supplier terlebih dahulu.", reg3),
    ("Apabila tagihan belanja non-kontraktual memiliki nilai Rp 75 juta, manakah mekanisme pembayaran yang paling tepat dan efisien?", 
     "SPM-LS ke rekening penyedia barang/jasa", "Membayar tunai bertahap dengan memecah kuitansi menjadi 15 lembar", "Menunggu akhir tahun anggaran untuk dibayar sekaligus", "Meminjam uang kas koperasi kantor", "A", 
     "Pembayaran non-kontraktual di atas batas toleransi UP diarahkan menggunakan SPM-LS non-kontraktual langsung ke rekening penerima hak.", reg3),
    ("Bagaimanakah mekanisme penyelesaian transaksi Retur SP2D yang disebabkan oleh penutupan rekening bank pihak ketiga?", 
     "Satker meminta surat keterangan rekening aktif baru dari penyedia, menerbitkan Surat Ralat Rekening, dan KPPN menerbitkan SP2D Ralat Rekening Retur", "Uang retur otomatis menjadi hak bendahara pengeluaran", "Satker membatalkan kegiatan dan menarik barang yang sudah diterima", "Penyedia barang dikenakan sanksi denda 50%", "A", 
     "Penyelesaian retur: Satker mengonfirmasi nomor rekening baru penyedia, mengirim surat ralat ke KPPN, dan KPPN memproses penyaluran kembali dari rekening retur.", reg3),
    ("Berapa batas waktu penolakan SPM oleh KPPN jika dokumen yang diajukan tidak memenuhi persyaratan formal dan material?", 
     "Paling lambat 1 hari kerja setelah SPM diterima secara elektronik", "Paling lambat 14 hari kalender", "Paling lambat 30 hari kerja", "Tidak terbatas", "A", 
     "KPPN wajib memberikan kepastian hukum dengan menerbitkan Surat Penolakan SPM maksimal 1 hari kerja disertai alasan penolakan yang jelas.", reg3),
    ("Apakah yang dimaksud dengan dokumen Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) pada pengajuan SPM?", 
     "Pernyataan legal dari PA/KPA/PPK bahwa seluruh pengeluaran belanja telah diuji dan menjadi tanggung jawab penuh pejabat penandatangan", "Surat izin bepergian dinas ke luar negeri", "Jaminan asuransi dari bank swasta", "Surat keterangan bebas narkoba", "A", 
     "SPTJM menegaskan tanggung jawab hukum formal dan material atas kebenaran tagihan berada sepenuhnya pada pihak satker penerbit SPM.", reg3),
    ("Dalam pembayaran pengadaan tanah untuk kepentingan umum, mekanisme pembayaran yang diwajibkan oleh regulasi adalah:", 
     "SPM-LS langsung ke rekening pihak yang berhak (pemilik tanah) atau konsinyasi di pengadilan", "Membawa uang tunai di koper oleh bendahara", "Membayar kepada calo tanah perantara", "Menggunakan cek kosong yang dicairkan bertahap", "A", 
     "Pembayaran ganti rugi tanah wajib ditransfer langsung ke rekening pemilik tanah yang sah atau dititipkan di Pengadilan Negeri (konsinyasi).", reg3),
    ("Kapan satker diperkenankan mengajukan SPM Tambahan Uang Persediaan (TUP)?", 
     "Ketika satker menghadapi kebutuhan belanja mendesak yang tidak cukup dibiayai dengan sisa dana UP dan habis digunakan dalam waktu 1 bulan kalender", "Kapan saja satker ingin menyimpan uang lebih di brankas", "Setiap kali bendahara ingin bepergian ke luar kota", "Hanya boleh diajukan di bulan Januari saja", "A", 
     "TUP diberikan untuk kebutuhan sangat mendesak/khusus yang melampaui pagu UP dan wajib dipertanggungjawabkan habis dalam tempo 1 bulan.", reg3),
    ("Apabila terdapat kesalahan pembebanan akun pada SPM yang telah terbit SP2D-nya, mekanisme perbaikannya adalah:", 
     "Mengajukan Surat Permintaan Koreksi Transaksi/Koreksi Pembukuan ke KPPN sepanjang tidak mengubah total nominal rupiah SP2D", "Menghapus lembar SP2D asli", "Meminta KPPN mentransfer ulang uang belanja", "Mencatat transaksi secara manual di buku saku", "A", 
     "Koreksi akun pada SP2D yang telah cair diproses melalui mekanisme ralat/koreksi pembukuan di KPPN dan modul akuntansi SAKTI.", reg3),
    ("Dalam mekanisme pembayaran belanja pegawai, apa dasar perhitungan tunjangan keluarga (suami/istri dan anak)?", 
     "Data Kartu Keluarga dan Surat Keterangan Untuk Mendapatkan Pembayaran Tunjangan Keluarga (Model KP4) yang dimutakhirkan secara berkala", "Jumlah teman di media sosial", "Hasil musyawarah antar-pegawai", "Status kepemilikan rumah dinas", "A", 
     "Tunjangan keluarga dibayarkan berdasarkan KP4 yang diverifikasi dengan akta nikah, akta kelahiran anak, dan batas usia anak yang sah.", reg3),
    ("Jika batas waktu pengajuan SPM jatuh pada hari libur nasional atau cuti bersama, maka batas akhir pengajuan SPM bergeser ke:", 
     "Hari kerja terakhir sebelum hari libur berkenaan", "Hari kerja pertama setelah hari libur", "Tujuh hari kalender setelah libur", "Gugur dan tidak dapat diajukan lagi", "B", 
     "Batas waktu jatuh tempo administratif yang bertepatan dengan hari libur dialihkan ke hari kerja berikutnya sesuai asas hukum perbendaharaan.", reg3),
    ("Apa fungsi dari Surat Kuasa Pengambilan SP2D pada era perbendaharaan digital saat ini?", 
     "Tidak diperlukan lagi karena seluruh SP2D diterbitkan secara elektronik dan terdistribusi via database terintegrasi SPAN-SAKTI", "Wajib dibawa setiap hari ke loket KPPN", "Harus dilegalisir notaris setiap minggu", "Ditempel di pintu masuk kantor satker", "A", 
     "Digitalisasi treasury dan TTE telah menghapuskan pengambilan fisik lembar SP2D di loket KPPN; dokumen mengalir secara paperless.", reg3),
    ("Bagaimana perlakuan terhadap sisa dana UP pada rekening bendahara pengeluaran saat tahun anggaran berakhir?", 
     "Wajib disetorkan seluruhnya ke Kas Negara paling lambat hari kerja terakhir tahun anggaran berkenaan", "Boleh disimpan untuk belanja modal tahun depan", "Dibagikan sebagai bonus natal/tahun baru pegawai", "Dibelikan barang inventaris secara mendadak", "A", 
     "Asas tahunan anggaran mewajibkan saldo kas UP bernilai nihil pada akhir tahun anggaran melalui setoran sisa kas ke Kas Negara.", reg3),
    ("Pada pembayaran belanja modal gedung yang memiliki jaminan masa pemeliharaan (retensi), berapa besaran dana yang ditahan hingga masa retensi berakhir?", 
     "Umumnya sebesar 5% dari nilai kontrak (atau diganti dengan Jaminan Pemeliharaan bank)", "Sebesar 50% dari nilai kontrak", "Sebesar nilai keuntungan penyedia", "Tidak ada dana yang ditahan", "A", 
     "Uang retensi sebesar 5% ditahan atau penyedia menyerahkan Jaminan Pemeliharaan bank/asuransi bernilai 5% sebelum pembayaran 100% dicairkan.", reg3),
    ("Kriteria dokumen tagihan yang dinyatakan 'Kedaluwarsa' (Verjaring) untuk ditagihkan ke kas negara adalah:", 
     "Hak tagih yang tidak diajukan dalam jangka waktu 5 (lima) tahun sejak timbulnya hak sesuai UU No. 1/2004", "Tagihan yang tidak dibayar dalam 1 bulan", "Tagihan yang dibuat pada hari Sabtu", "Tagihan yang kuitansinya sobek sebagian", "A", 
     "Pasal 40 UU No. 1/2004 menetapkan hak tagih atas beban APBN kedaluwarsa setelah 5 tahun sejak hak tersebut timbul.", reg3),
    ("Dokumen pengeluaran kas yang diterbitkan oleh Bendahara Pengeluaran untuk membayarkan uang persediaan kepada pelaksana kegiatan disebut:", 
     "Kuitansi UP / Bukti Pembayaran Kas", "Surat Keputusan Menteri", "Akta Perjanjian Sewa", "Izin Operasional Kendaraan", "A", 
     "Kuitansi pengeluaran kas ditandatangani oleh penerima uang, diverifikasi PPK, dan dibayarkan oleh Bendahara Pengeluaran.", reg3),
    ("Apakah pembayaran uang muka kerja (DP) kepada penyedia barang/jasa konstruksi diperkenankan dalam APBN?", 
     "Diperkenankan maksimal 20% - 30% sesuai kualifikasi usaha dan wajib menyerahkan Jaminan Uang Muka bernilai sama", "Dilarang keras dalam kondisi apapun", "Diperkenankan 100% di muka tanpa jaminan", "Hanya boleh diberikan dalam bentuk barang bekas", "A", 
     "Uang muka kerja dapat diberikan sesuai Perpres 16/2018 dengan kewajiban penyedia menyerahkan Jaminan Uang Muka sebesar nilai uang muka yang diterima.", reg3)
]

t3_analisis = [
    ("Analisis Kasus Keterlambatan Penerbitan SP2D oleh KPPN: Satker mengajukan SPM LS kontraktual tanggal 20 Desember pukul 09.00, namun SP2D baru terbit tanggal 22 Desember sore. Setelah diaudit, penyebabnya adalah antrean lonjakan transaksi di akhir tahun dan adanya anomali data rekening bank rekanan. Evaluasi risiko fiskal dari keterlambatan ini adalah:", 
     "Risiko gagal bayar hak penyedia pada tahun berjalan, memicu retur SP2D, dan terganggunya pencatatan realisasi belanja pada Neraca LKPP", "Satker wajib menggugat KPPN ke pengadilan niaga", "Rekanan berhak menyita gedung kantor KPPN", "KPPN otomatis dibekukan operasionalnya oleh Bank Indonesia", "A", 
     "Keterlambatan SP2D di akhir tahun berisiko melampaui batas cut-off perbankan, memicu gagal bayar pihak ketiga, dan menahan penyelesaian kontrak negara.", reg3),
    ("Analisis Kasus Ralat SP2D Akibat Retur Berulang (Recurring Return): Rekening penyedia barang mengalami retur 2 kali berturut-turut karena bank penyedia sedang melakukan merger sistem dan mengubah kode kliring. Upaya manajerial KPA untuk menyelesaikan tagihan tanpa melanggar prinsip kepatutan anggaran adalah:", 
     "Meminta konfirmasi tertulis resmi dari kantor cabang bank mitra penyedia mengenai validitas nomor rekening baru, memperbarui Karwas Supplier, dan memproses SPM Pengganti Retur", "Membayarkan dana retur secara tunai melalui kas bendahara kantor", "Mengalihkan uang retur ke rekening pribadi PPK untuk diteruskan ke penyedia", "Menyatakan kontrak batal dan meminta barang dikembalikan", "A", 
     "Penyelesaian retur berulang membutuhkan bukti otentik perbankan dan pemutakhiran data supplier pada SPAN agar transfer ulang dana APBN tepat sasaran.", reg3),
    ("Analisis Pembayaran Prestasi Kerja Konstruksi Berbasis Fisik 100% dengan Jaminan Pembayaran Akhir Tahun: Pada 15 Desember pekerjaan baru mencapai 90%, namun diajukan SPM 100% dengan melampirkan Bank Garansi. Pada 31 Desember ternyata fisik hanya 95%. Tindakan hukum administratif yang wajib dilakukan KPA adalah:", 
     "Mencairkan jaminan pembayaran bank garansi sebesar 5% sisa pekerjaan yang belum selesai dan menyetorkannya ke Kas Negara sebagai penerimaan negara", "Memaafkan kontraktor dan mengabaikan sisa pekerjaan 5%", "Memperpanjang proyek tanpa dasar hukum hingga tahun depan", "Menyerahkan uang jaminan kepada pengawas lapangan", "A", 
     "Sesuai regulasi akhir tahun (PER LLAT), jaminan bank atas sisa pekerjaan wajib dicairkan dan disetor ke kas negara jika kontraktor gagal menuntaskan 100%.", reg3),
    ("Analisis Kasus Penolakan SPM Akibat Ketidakcocokan Matriks RPD Harian: Satker mengajukan SPM bernilai Rp 20 miliar pada hari Selasa tanpa menyampaikan konfirmasi RPD harian 5 hari kerja sebelumnya ke KPPN. Dasar regulasi KPPN menolak memproses SPM tersebut pada hari yang sama adalah:", 
     "PMK Kas Forecasting: Penarikan kas bernilai besar (di atas batas ambang batas tertentu) wajib menyampaikan RPD harian terjadwal demi menjaga likuiditas kas BUN", "KPPN tidak menyukai satker yang bersangkutan", "Bank sentral melarang transaksi di atas Rp 1 miliar", "Uang di kas negara sedang dipinjamkan ke luar negeri", "A", 
     "Transaksi bernilai besar wajib mematuhi ketentuan RPD harian (cash forecasting) agar BUN dapat mengalokasikan likuiditas kas negara di Bank Indonesia.", reg3),
    ("Studi Kasus Fraud Split Bill Tagihan untuk Menghindari Pengujian LS: PPK memecah pengadaan komputer kantor senilai Rp 120 juta menjadi 6 kuitansi masing-masing Rp 20 juta agar dapat dibayar melalui kas UP bendahara tanpa SP2D LS. Penilaian auditor Itjen atas tindakan ini adalah:", 
     "Pelanggaran sengaja terhadap hierarki pengadaan dan mekanisme pembayaran (split payment) untuk menghindari uji kepatuhan formal KPPN dan pajak LS", "Tindakan efisiensi birokrasi yang patut dicontoh", "Inovasi manajemen kas bendahara yang cerdas", "Tindakan yang sah sesuai kebebasan manajerial PPK", "A", 
     "Pemecahan transaksi belanja (splitting) untuk menghindari mekanisme pengadaan langsung/tender atau menghindari pembayaran LS adalah pelanggaran disiplin anggaran.", reg3),
    ("Analisis Kasus Keterlambatan Pembayaran Hak Pegawai (SPM Gaji Susulan): Seorang pegawai baru pindah tugas bulan Maret namun SPM Gaji Susulan baru diproses bulan Oktober (terlambat 7 bulan). Evaluasi tanggung jawab administratif internal satker yang tepat adalah:", 
     "Kelalaian operator pembayaran dan verifikator dalam menindaklanjuti SKPP pegawai, mengakibatkan pelanggaran asas ketepatan pemenuhan hak ASN", "Kesalahan pegawai karena pindah tugas", "KPPN bersalah karena tidak mengingatkan satker", "Wajar karena sistem komputer membutuhkan waktu 1 tahun untuk adaptasi", "A", 
     "Keterlambatan penyelesaian SKPP dan SPM Gaji Susulan merugikan hak normatif pegawai dan mencerminkan buruknya tata kelola administrasi kepegawaian satker.", reg3),
    ("Analisis Konsekuensi Hukum Terbitnya SP2D Berdasarkan Bukti Fiktif: KPPN menerbitkan SP2D atas SPM yang dilampiri BAST fiktif yang direkayasa oleh PPK dan rekanan. Siapakah pihak yang memikul tanggung jawab hukum pidana dan perdata atas kerugian keuangan negara?", 
     "PPK, PPSPM (jika lalai menguji berkas), dan rekanan; KPPN dibebaskan dari tanggung jawab materil karena KPPN hanya menguji kesesuaian formal SPM", "Kepala KPPN memikul seluruh tanggung jawab pidana", "Hanya petugas resepsionis satker", "Menteri Keuangan secara pribadi", "A", 
     "Pasal 18 PMK 190 menetapkan KPA/PPK/PPSPM bertanggung jawab penuh atas kebenaran material tagihan; pengujian KPPN bersifat formal administratif.", reg3),
    ("Analisis Kasus Pembayaran Uang Persediaan Melebihi Kebutuhan Riil (Idle Cash): Satker mempertahankan saldo kas UP Rp 100 juta di rekening sepanjang tahun namun perputaran belanja rata-rata hanya Rp 5 juta per bulan. Rekomendasi perbendaharaan yang wajib diterbitkan KPPN adalah:", 
     "Menerbitkan surat peringatan dan menurunkan besaran pagu UP satker secara sepihak untuk mencegah terjadinya penumpukan kas menganggur (idle cash)", "Menambah pagu UP menjadi Rp 500 juta", "Membiarkan saja karena itu hak satker", "Menutup satker secara permanen", "A", 
     "Kas yang mengendap tanpa revolving aktif merugikan likuiditas Kas Negara; KPPN berwenang mengevaluasi dan memotong besaran pagu UP satker yang pasif.", reg3),
    ("Analisis Kasus Kegagalan Interkoneksi SPAN dan Bank Indonesia (RTGS Failure): Terjadi pemadaman listrik massal yang mengganggu saluran transmisi data antara SPAN Kemenkeu dan BI RTGS tepat di hari terakhir tahun anggaran. Tindakan kontingensi treasury BUN adalah:", 
     "Mengaktifkan Disaster Recovery Center (DRC) Kemenkeu, perpanjangan waktu cut-off kliring BI, dan penyelesaian settlement transaksi tertunda secara prioritas", "Membatalkan seluruh pembayaran belanja negara tahun berkenaan", "Menyuruh penyedia datang ke istana negara", "Membayar transaksi menggunakan mata uang kripto", "A", 
     "Kemenkeu dan Bank Indonesia memiliki protokol mitigasi DRC dan perpanjangan cut-off settlement BI untuk memastikan seluruh transaksi SP2D akhir tahun terselesaikan.", reg3),
    ("Analisis Kasus Beban Biaya Administrasi Perbankan pada Rekening Penerima: Penyedia barang mengeluh bahwa dana SP2D yang diterima terpotong biaya transfer antar-bank sebesar Rp 6.500. Dasar hukum penyelesaian keluhan ini adalah:", 
     "Sesuai kontrak BUN, pembayaran SP2D ke bank mitra operasional bebas biaya transfer; potongan hanya terjadi jika rekening penerima berada pada bank non-mitra operasional sesuai tarif kliring", "Satker wajib mengganti uang potongan tersebut dari kas kantor", "Penyedia berhak menuntut pembatalan kontrak pekerjaan", "KPPN wajib mengembalikan potongan biaya tersebut secara tunai", "A", 
     "Pemerintah menanggung biaya transmisi SP2D pada bank operasional BUN; biaya transfer antar-bank swasta non-mitra mengikuti ketentuan kliring perbankan nasional.", reg3),
    ("Analisis Kasus Pembayaran Tagihan Berdasarkan Putusan Pengadilan yang Berkekuatan Hukum Tetap (Inkracht): Pemerintah kalah dalam sengketa ganti rugi perdata dan diwajibkan membayar Rp 5 miliar. Mekanisme pembayaran APBN yang sah adalah:", 
     "Mengajukan alokasi pagu belanja putusan pengadilan melalui revisi DIPA Bagian Anggaran BUN/K/L dan menerbitkan SPM-LS ke rekening penggugat", "KPA mengambil uang dari brankas kas kecil kantor secara diam-diam", "Menolak putusan pengadilan karena APBN tidak boleh digunakan untuk ganti rugi", "Membayar dengan aset tanah dinas tanpa izin menteri", "A", 
     "Eksekusi putusan inkracht memerlukan dasar pagu DIPA yang sah (melalui BA BUN atau revisi DIPA kementerian teknis) dan dicairkan via SPM-LS.", reg3),
    ("Analisis Kasus Kehilangan Dokumen Fisik SPM dan BAST oleh Verifikator: Setelah SP2D terbit, dokumen fisik BAST dan SPP hilang saat renovasi ruangan. Langkah pengamanan akuntabilitas arsip keuangan negara yang wajib ditempuh adalah:", 
     "Membuat Berita Acara Kehilangan, meminta salinan legalisir dokumen resmi dari penyedia dan arsip digital SAKTI/MonSAKTI yang memiliki hash valid", "Membuat dokumen palsu dengan tanda tangan tiruan", "Menghapus catatan transaksi dari modul pembukuan", "Menyuruh staf yang merenovasi ruangan mengundurkan diri", "A", 
     "Penanganan dokumen hilang: pembuatan Berita Acara resmi, penarikan arsip digital SAKTI bertanda tangan elektronik (TTE) yang sah, dan legalisasi salinan sah.", reg3),
    ("Analisis Kasus Keterlambatan Penyetoran Pajak oleh Rekanan pada SPM-LS: Pada SPM-LS pihak ketiga, potongan PPh dan PPN dipotong langsung saat penerbitan SP2D oleh KPPN. Mengapa mekanisme ini jauh lebih aman bagi penerimaan negara dibanding pembayaran via bendahara?", 
     "Karena potongan pajak langsung disetorkan ke rekening kas penerimaan negara (BUN) secara realtime otomatis tanpa risiko uang pajak dibawa kabur oleh penyedia/bendahara", "Karena penyedia barang tidak perlu membuat faktur pajak", "Karena tarif pajak menjadi lebih murah 50%", "Karena KPPN tidak perlu mencatat transaksi belanja", "A", 
     "Pemotongan pajak otomatis pada SP2D menjamin kepastian penerimaan pajak negara (zero tax leakage) dan menyederhanakan kewajiban penyetoran bendahara.", reg3),
    ("Analisis Kasus Pembayaran Belanja Jasa Konsultan Warga Negara Asing (WNA): KPA mengontrak konsultan asing untuk proyek riset. Dokumen pendukung krusial yang wajib dilampirkan pada pengujian SPM selain kontrak dan BAST adalah:", 
     "Tax Treaty / Certificate of Domicile (Form DGT) untuk penentuan tarif PPh Pasal 26 dan paspor/visa izin kerja yang sah", "Surat keterangan lahir di luar negeri", "Kartu anggota partai politik negara asal", "Foto paspor keluarga besar konsultan", "A", 
     "Pembayaran subjek pajak luar negeri wajib dilengkapi Surat Keterangan Domisili (CoD) pajak untuk menghindari pengenaan pajak ganda (P3B/Tax Treaty).", reg3),
    ("Analisis Kasus Penolakan Pembayaran oleh Bank Indonesia atas SP2D Valuta Asing: KPPN Khusus Pinjaman dan Hibah menerbitkan SP2D dalam mata uang Dollar AS (USD), namun ditolak kliring BI karena rekening bank koresponden di New York sedang libur nasional. Tindakan mitigasi waktu jatuh tempo tagihan adalah:", 
     "Menyesuaikan value date pencairan pada hari kerja berikutnya yang aktif di negara tempat bank koresponden berada sesuai konvensi perbankan internasional", "Mengubah valuta asing menjadi rupiah secara sepihak", "Membatalkan seluruh perjanjian pinjaman luar negeri", "Mengirim uang melalui titipan bagasi pesawat komersial", "A", 
     "Transaksi devisa tunduk pada kalender operasional bank sentral negara mitra (currency holiday); penyesuaian value date adalah standar perbankan devisa.", reg3),
    ("Analisis Efektivitas Digitalisasi SP2D terhadap Pemberantasan Korupsi: Mengapa peralihan dari cek giral/warkat kertas ke SP2D elektronik menutup peluang gratifikasi petugas perbendaharaan?", 
     "Menghilangkan interaksi tatap muka langsung (contactless service), mempercepat SLA layanan, dan menghilangkan diskresi penentuan antrean pencairan uang", "Karena komputer tidak membutuhkan listrik", "Karena pegawai bank dilarang berbicara dengan nasabah", "Karena nilai mata uang rupiah meningkat", "A", 
     "Sistem paperless nir-tatap muka dan otomasi antrean FIFO (First In First Out) di SPAN menutup celah pemerasan, gratifikasi percepatan, dan suap.", reg3)
]

for item in t3_mudah:
    questions.append(q(cur_num, t3, "MUDAH", item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7]))
    cur_num += 1
for item in t3_sedang:
    questions.append(q(cur_num, t3, "SEDANG", item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7]))
    cur_num += 1
for item in t3_analisis:
    questions.append(q(cur_num, t3, "ANALISIS", item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7]))
    cur_num += 1

print(f"Topic 3 completed. Total questions so far: {len(questions)}")

with open("scripts/p3_part3.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)
