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
cur_num = 1201

def add_items(topic, reg, mudah, sedang, analisis):
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
# TOPIC 4: Pengelolaan UP, TUP, KKP Domestik & Digipay Satu (1201 - 1250)
# ============================================================================
t4 = "Pengelolaan UP, TUP, KKP Domestik & Digipay Satu"
reg4 = "PMK No. 196/PMK.05/2018 jo PMK No. 210/PMK.05/2022 jo Petunjuk Teknis Digipay Satu Kemenkeu"

t4_mudah = [
    ("Uang Persediaan (UP) adalah uang muka kerja dalam jumlah tertentu yang diberikan kepada Bendahara Pengeluaran untuk:", 
     "Membiayai pengeluaran operasional sehari-hari satker yang tidak dapat dilakukan dengan pembayaran LS", "Disimpan sebagai tabungan pensiun pegawai", "Membayar proyek fisik multi-years", "Dipinjamkan kepada pihak ketiga dengan bunga", "A", 
     "UP berfungsi sebagai uang muka kerja untuk membiayai kebutuhan operasional rutin yang tidak efisien jika melalui mekanisme LS.", reg4),
    ("Porsi pembagian Uang Persediaan (UP) antara UP Tunai dan UP Kartu Kredit Pemerintah (KKP) pada ketentuan umum adalah:", 
     "60% UP Tunai dan 40% UP KKP", "50% UP Tunai dan 50% UP KKP", "75% UP Tunai dan 25% UP KKP", "100% UP Tunai tanpa KKP", "A", 
     "Sesuai regulasi KKP, proporsi default UP satker adalah 60% berupa UP Tunai dan 40% berupa UP KKP, kecuali satker memperoleh persetujuan dispensasi proporsi.", reg4),
    ("Berapa batas maksimal pembayaran transaksi belanja per penerima/rekanan menggunakan UP Tunai?", 
     "Rp 20.000.000", "Rp 50.000.000", "Rp 100.000.000", "Rp 200.000.000", "B", 
     "Batas maksimal pembayaran belanja operasional dengan UP Tunai kepada satu rekanan adalah Rp 50.000.000 (lima puluh juta rupiah).", reg4),
    ("Batas maksimal pembayaran belanja barang/operasional menggunakan Kartu Kredit Pemerintah (KKP) per transaksi adalah:", 
     "Rp 50.000.000", "Rp 100.000.000", "Rp 200.000.000", "Rp 500.000.000", "C", 
     "Pembayaran dengan KKP diperkenankan hingga Rp 200.000.000 per transaksi belanja barang dan operasional.", reg4),
    ("Platform marketplace resmi pengadaan barang/jasa pemerintah yang mengintegrasikan sistem pembayaran SAKTI dan perbankan adalah:", 
     "Digipay Satu", "Shopee Satker", "Tokopedia Pemerintah", "Bukalapak APBN", "A", 
     "Digipay Satu adalah ekosistem marketplace pengadaan pemerintah yang mengintegrasikan satker, UMKM/vendor, perbankan HIMBARA, dan SAKTI.", reg4),
    ("Kartu Kredit Pemerintah (KKP) Domestik menggunakan mekanisme pemrosesan transaksi berbasis:", 
     "Gerbang Pembayaran Nasional (GPN) dan QRIS", "Kartu kredit internasional non-resmi", "Kupon kertas belanja kantor", "Cek pos giro swasta", "A", 
     "KKP Domestik memfasilitasi transaksi non-tunai berbasis GPN dan QRIS untuk kemandirian sistem pembayaran nasional.", reg4),
    ("Masa berlaku Tambahan Uang Persediaan (TUP) terhitung sejak tanggal terbitnya SP2D adalah:", 
     "15 hari kalender", "30 hari kalender", "60 hari kalender", "90 hari kalender", "B", 
     "TUP wajib dipertanggungjawabkan (PTUP) atau disetor sisanya selambat-lambatnya 30 hari kalender sejak SP2D terbit.", reg4),
    ("Siapakah pejabat perbendaharaan yang berwenang memegang Kartu Kredit Pemerintah (KKP)?", 
     "Pemegang Kartu Kredit Pemerintah (PKKP) yang ditunjuk oleh KPA/PPK", "Semua staf honorer kantor", "Istri dari kepala satker", "Penyedia barang pihak ketiga", "A", 
     "KKP hanya dipegang oleh pejabat/pegawai yang secara resmi ditetapkan sebagai PKKP oleh Kuasa Pengguna Anggaran (KPA).", reg4),
    ("Surat Permintaan Pembayaran Ganti Uang Persediaan (SPP-GUP) Nihil diajukan pada saat:", 
     "Akhir tahun anggaran untuk mempertanggungjawabkan sisa belanja UP sebelum penutupan buku", "Awal tahun untuk meminta modal kerja", "Setiap kali bendahara cuti melahirkan", "Ketika ada pemeriksaan BPK saja", "A", 
     "GUP Nihil diajukan di akhir tahun anggaran untuk mengesahkan belanja UP terakhir tanpa meminta penggantian uang kas baru.", reg4),
    ("Dalam transaksi Digipay Satu, pihak yang menanggung biaya merchant discount rate (MDR) adalah:", 
     "Sesuai kesepakatan perbankan HIMBARA dan ketentuan pengadaan tanpa membebani keuangan negara", "Dipotong dari gaji kepala KPPN", "Dibayar tunai oleh kasir kantor pos", "Dihapus tanpa dasar hukum", "A", 
     "Skema Digipay Satu diatur agar tarif layanan kompetitif dan transparan tanpa melanggar prinsip efisiensi belanja negara.", reg4),
    ("Berapakah besaran batas pagu UP untuk satker dengan pagu DIPA sampai dengan Rp 900 juta?", 
     "Maksimal Rp 50.000.000", "Maksimal Rp 100.000.000", "Maksimal Rp 200.000.000", "Maksimal Rp 500.000.000", "B", 
     "Sesuai PMK 190, pagu DIPA s.d. Rp 900 juta memperoleh pagu UP maksimal Rp 100.000.000.", reg4),
    ("Berapakah pagu UP untuk satker dengan pagu belanja operasional Rp 900 juta s.d. Rp 2,4 miliar?", 
     "Maksimal Rp 100.000.000", "Maksimal Rp 200.000.000", "Maksimal Rp 500.000.000", "Maksimal Rp 1 miliar", "B", 
     "Pagu DIPA di atas Rp 900 juta s.d. Rp 2,4 miliar dapat diberikan UP maksimal Rp 200.000.000.", reg4),
    ("Untuk satker dengan pagu belanja di atas Rp 6 miliar, besaran pagu UP awal maksimal adalah:", 
     "Rp 200.000.000", "Rp 500.000.000", "Rp 1.000.000.000", "Rp 2.000.000.000", "B", 
     "Pagu belanja operasional di atas Rp 6 miliar diberikan besaran UP maksimal Rp 500.000.000 (kecuali ada dispensasi Kepala Kanwil DJPb).", reg4),
    ("Dokumen penagihan dari bank penerbit KKP kepada satker atas transaksi KKP yang telah dilakukan disebut:", 
     "Daftar Tagihan Sementara / Lembar Tagihan (Billing Statement)", "Surat Perintah Kerja Fisik", "Kwitansi Tanda Terima Barang", "Buku Tabungan Nasabah", "A", 
     "Bank penerbit KKP mengirimkan Billing Statement yang memuat rincian transaksi belanja KKP untuk diverifikasi oleh PPK.", reg4),
    ("Pembayaran tagihan KKP kepada bank penerbit dilakukan oleh Bendahara Pengeluaran menggunakan mekanisme:", 
     "SPM-GUP KKP ke rekening penampungan KKP bank penerbit", "Membayar uang koin di teller bank", "Transfer ATM pribadi bendahara", "Menyerahkan cek mundur tanpa saldo", "A", 
     "Pelunasan billing KKP diproses melalui penerbitan SPM-GUP KKP oleh PPSPM ke rekening bank penerbit sebelum jatuh tempo.", reg4),
    ("Jangka waktu masa tenggang pembayaran (grace period) tagihan KKP tanpa dikenakan bunga denda adalah:", 
     "Sekitar 20 sampai 30 hari kalender sejak tanggal cetak tagihan", "Hanya 24 jam", "Selama 6 bulan kalender", "Tidak ada batas waktu selamanya", "A", 
     "KKP memiliki masa tenggang bunga (interest-free period); satker wajib melunasi sebelum jatuh tempo agar tidak timbul biaya bunga.", reg4),
    ("Uang Persediaan tidak boleh digunakan untuk membiayai jenis belanja:", 
     "Belanja Pegawai (gaji/tunjangan) dan Belanja Modal Pengadaan Tanah", "Belanja perjalanan dinas dalam kota", "Belanja alat tulis kantor", "Belanja konsumsi rapat", "A", 
     "Belanja pegawai (gaji induk) dan belanja tanah wajib menggunakan mekanisme LS, dilarang dibayar menggunakan kas UP.", reg4)
]

t4_sedang = [
    ("Bagaimanakah alur verifikasi transaksi belanja Kartu Kredit Pemerintah (KKP) dari penggunaan hingga pelunasan tagihan?", 
     "PKKP belanja -> Serahkan bukti kuitansi ke PPK -> PPK verifikasi & terbitkan SPP-GUP KKP -> PPSPM terbitkan SPM-GUP KKP -> KPPN terbitkan SP2D pelunasan ke bank", "PKKP belanja -> Bank otomatis memotong gaji PKKP -> Tidak perlu kuitansi", "Bendahara membayar langsung secara tunai ke kasir bank tanpa SPP", "KPPN membayar sebelum transaksi belanja dilakukan", "A", 
     "Alur KKP: Transaksi oleh PKKP -> Pengujian berkas kuitansi oleh PPK -> Penerbitan SPP-GUP KKP -> SPM disahkan PPSPM -> SP2D melunasi bank penerbit.", reg4),
    ("Satker ingin mengubah proporsi UP menjadi 80% Tunai dan 20% KKP karena lokasi satker berada di daerah terpencil minim mesin EDC. Langkah administratif yang sah adalah:", 
     "Mengajukan permohonan dispensasi perubahan proporsi UP kepada Kepala Kanwil DJPb dengan melampirkan kajian kondisi geografis dan perbankan", "Mengubah proporsi sendiri di aplikasi SAKTI tanpa persetujuan", "Menutup akun KKP dan menolak menggunakan kartu kredit", "Meminjam mesin EDC dari toko swasta tanpa izin", "A", 
     "Kewenangan persetujuan dispensasi perubahan proporsi UP (tunai vs KKP) berada pada Kepala Kantor Wilayah Ditjen Perbendaharaan.", reg4),
    ("Apa yang terjadi apabila Bendahara Pengeluaran terlambat melunasi billing statement KKP melampaui tanggal jatuh tempo (due date)?", 
     "Bank penerbit akan membebankan bunga dan denda keterlambatan yang TIDAK BISA dibebankan ke APBN, melainkan menjadi tanggung jawab pribadi pejabat yang lalai", "APBN akan otomatis membayar denda 100%", "KPPN akan menghapus denda bank tersebut", "Bank penerbit akan menyita mobil dinas satker", "A", 
     "Denda dan bunga keterlambatan akibat kelalaian pemrosesan tagihan KKP menjadi beban pribadi pejabat perbendaharaan terkait.", reg4),
    ("Bagaimanakah mekanisme pemotongan dan penyetoran pajak atas transaksi belanja pengadaan barang melalui Digipay Satu?", 
     "Perhitungan dan pemungutan pajak terintegrasi secara otomatis dalam sistem Digipay dan disetorkan via e-billing", "Penyedia barang dibebaskan dari seluruh jenis pajak", "Bendahara wajib mendatangi kantor pajak secara fisik membawa uang tunai", "Pajak dibayarkan oleh pembeli secara sukarela", "A", 
     "Digipay Satu mengotomatiskan pembuatan kode billing dan pemotongan pajak penerimaan negara sesuai ketentuan perpajakan belanja pemerintah.", reg4),
    ("Dalam hal satker memerlukan Uang Persediaan tambahan melampaui batas maksimal pagu UP yang diatur PMK 190, persetujuan dispensasi harus diajukan kepada:", 
     "Kepala Kantor Wilayah Ditjen Perbendaharaan (Kanwil DJPb)", "Kepala Dinas Pendapatan Daerah", "Bupati/Walikota setempat", "Direktur Utama Bank HIMBARA", "A", 
     "Persetujuan kenaikan besaran UP melampaui batas pagu normal merupakan wewenang administratif Kepala Kanwil DJPb.", reg4),
    ("Syarat pengajuan Tambahan Uang Persediaan (TUP) yang wajib dipenuhi oleh KPA kepada KPPN adalah:", 
     "Rincian rencana penggunaan dana, kebutuhan mendesak yang habis dalam 1 bulan, dan sisa UP tidak mencukupi", "Surat keterangan warisan pejabat", "Bukti kepemilikan saham perusahaan", "Janji lisan bendahara tanpa dokumen", "A", 
     "Permohonan TUP ke KPPN wajib disertai rincian rencana pengeluaran (kebutuhan riil), justifikasi kemendesakan, dan habis digunakan dalam tempo 30 hari.", reg4),
    ("Apabila selama 30 hari kalender dana TUP baru terpakai 70%, maka sisa dana 30% wajib diperlakukan sebagai berikut:", 
     "Disetorkan kembali ke Kas Negara menggunakan formulir Surat Setoran Bukan Pajak (SSBP) paling lambat hari kerja terakhir masa berlaku TUP", "Disimpan di rekening bendahara untuk belanja tahun depan", "Digunakan untuk piknik dinas pegawai kantor", "Diberikan kepada penyedia sebagai uang tip", "A", 
     "Sisa dana TUP yang tidak terserap wajib disetorkan kembali ke Rekening Kas Umum Negara sebelum batas waktu 30 hari berakhir.", reg4),
    ("Apa fungsi dari Surat Pernyataan UP/TUP yang ditandatangani oleh KPA pada saat pengajuan UP awal tahun?", 
     "Menyatakan kesanggupan mengelola UP secara akuntabel dan menyetorkan seluruh sisa kas UP pada akhir tahun anggaran", "Menyatakan bahwa bendahara berhak mengambil bunga rekening", "Menjamin seluruh pegawai mendapat pinjaman uang kas kantor", "Membebaskan satker dari audit aparat pengawas", "A", 
     "Surat pernyataan KPA mengikat komitmen tata kelola UP: kepatuhan penggunaan, revolving tertib, dan penyetoran sisa kas nihil di akhir tahun.", reg4),
    ("Dalam transaksi KKP, batas maksimal nilai belanja untuk pengadaan tiket perjalanan dinas (travel expenditure) adalah:", 
     "Sesuai batas pagu kartu kredit belanja perjalanan dinas yang disetujui KPA dan tidak dibatasi Rp 50 juta", "Maksimal Rp 5.000.000", "Maksimal Rp 10.000.000", "Bebas tanpa batas pagu DIPA", "A", 
     "Pagu KKP untuk perjalanan dinas disesuaikan dengan plafon kartu kredit operasional yang ditetapkan KPA berdasarkan kebutuhan riil tiket/hotel.", reg4),
    ("Bagaimanakah tata cara rekonsiliasi belanja Digipay Satu antara sistem satker dan rekening koran bendahara?", 
     "Memadankan mutasi debet rekening operasional dengan daftar pesanan sukses (order checkout) dan invoice Digipay Satu pada menu Bendahara SAKTI", "Menghitung selisih uang receh di laci meja bendahara", "Menelepon kurir pengantar barang setiap sore", "Mencatat secara estimasi di papan tulis kantor", "A", 
     "Pencocokan dilakukan antara histori mutasi rekening bank kas belanja dengan bukti invoice digital dan receipt pembayaran platform Digipay Satu.", reg4),
    ("Apakah bukti kuitansi manual toko konvensional diakui sebagai bukti pertanggungjawaban belanja KKP?", 
     "Wajib disertai struk EDC / sales draft perbankan dan bukti tagihan rincian barang yang sah", "Cukup kuitansi kosong bermaterai", "Hanya butuh foto toko dari kejauhan", "Struk EDC tidak diperlukan sama sekali", "A", 
     "Pengujian belanja KKP mewajibkan keterikatan antara sales draft EDC/bukti debet elektronik dengan bukti perincian barang/kuitansi pembelian.", reg4),
    ("Dalam pengelolaan kas UP tunai, batas maksimal uang tunai yang boleh disimpan di brankas bendahara pada akhir hari kerja (overnight limit) diatur oleh:", 
     "Keputusan Kuasa Pengguna Anggaran (KPA) dengan mempertimbangkan batas keamanan brankas dan asuransi kas", "Kepala Kepolisian setempat", "Petugas sekuriti gedung kantor", "Petugas kebersihan kantor", "A", 
     "KPA menetapkan limit penyimpanan uang tunai di brankas kantor demi keamanan fisik kas dan pencegahan risiko pencurian.", reg4),
    ("Apa yang dimaksud dengan mekanisme Pertanggungjawaban TUP (PTUP)?", 
     "Pengajuan bukti-bukti pengeluaran sah atas penggunaan dana TUP kepada KPPN untuk memverifikasi bahwa dana telah dibelanjakan sesuai peruntukan", "Pengajuan permohonan pinjaman modal baru", "Penggantian uang kas yang hilang", "Pembelian aset kendaraan dinas", "A", 
     "PTUP adalah proses penyampaian SPP/SPM pertanggungjawaban belanja TUP ke KPPN tanpa pencairan dana baru untuk menghapus saldo TUP.", reg4),
    ("Apabila satker memiliki 2 PPK, bagaimanakah pengelolaan kas Uang Persediaan diatur oleh Bendahara Pengeluaran?", 
     "Bendahara Pengeluaran menyalurkan uang muka kerja kepada masing-masing PPK/BPP melalui transfer atau uang muka bertanda terima resmi", "Bendahara membiarkan masing-masing PPK mengambil uang sendiri di ATM bank", "Masing-masing PPK memiliki buku tabungan atas nama pribadi", "Uang kas dibagi dua secara tunai tanpa catatan", "A", 
     "Bendahara mengelola saldo UP pusat dan dapat mendistribusikan uang muka kas kerja ke BPP/PPK dengan kartu pengawasan uang muka.", reg4),
    ("Mengapa transaksi belanja pemerintah melalui Digipay Satu dinilai mampu memberdayakan Usaha Mikro, Kecil, dan Menengah (UMKM)?", 
     "Karena memberikan kepastian pasar belanja APBN, proses pembayaran nontunai yang cepat, dan rekam jejak keuangan digital bagi UMKM mitra", "Karena UMKM diberikan pinjaman cuma-cuma tanpa bayar", "Karena harga barang UMKM dinaikkan 200%", "Karena pemerintah mengambil alih kepemilikan toko UMKM", "A", 
     "Digipay Satu membuka akses vendor UMKM lokal menjadi rekanan resmi satker K/L dengan kepastian pembayaran langsung via ekosistem perbankan.", reg4),
    ("Jika kartu KKP hilang atau dicuri, tindakan kedaruratan pertama yang wajib diambil oleh Pemegang KKP adalah:", 
     "Segera menghubungi call center bank penerbit untuk pemblokiran kartu dan melapor tertulis kepada PPK/KPA", "Menunggu hingga akhir bulan untuk lapor", "Membiarkan saja karena kartu milik negara", "Meminjam kartu kredit milik rekan kerja", "A", 
     "Prosedur kehilangan kartu kredit: pemblokiran seketika ke bank penerbit guna menghentikan transaksi liar dan penerbitan Berita Acara Kehilangan.", reg4),
    ("Dokumen pengawasan internal yang mencatat sisa plafon, tanggal transaksi, dan nama pemegang KKP disebut:", 
     "Kartu Pengawasan Penggunaan KKP (Karwas KKP)", "Buku Catatan Pelanggaran Disiplin", "Kartu Tanda Anggota Pegawai", "Surat Izin Mengemudi Dinas", "A", 
     "PPK wajib menyelenggarakan Karwas KKP untuk memonitor limit belanja, tanggal transaksi, jatuh tempo pembayaran, dan kepatuhan penyampaian kuitansi.", reg4)
]

t4_analisis = [
    ("Analisis Kasus Tagihan Siluman pada Billing KKP (Fraudulent Charges): Pada billing statement bulanan KKP Satker X, muncul transaksi belanja online luar negeri sebesar Rp 15 juta yang tidak pernah dilakukan oleh PKKP. Tindakan hukum dan administratif yang wajib diambil KPA adalah:", 
     "Mengajukan surat sanggahan transaksi (dispute transaction) ke bank penerbit KKP, meminta investigasi forensik kartu, dan menolak membayarkan tagihan tersebut dari dana UP", "Membayar tagihan tersebut menggunakan uang kas kantor agar tidak kena denda", "Menyuruh pemegang KKP membayar dengan uang tabungan pribadinya", "Menutup kantor satker sementara waktu", "A", 
     "Transaksi ilegal (fraud) wajib disanggah resmi ke bank penerbit sebelum batas jatuh tempo dan tidak boleh dibayarkan dengan anggaran negara.", reg4),
    ("Analisis Kegagalan Revolving UP (Stagnant Revolving Rate): Satker Kehutanan memiliki pagu UP Rp 200 juta, namun selama Triwulan II hanya melakukan GUP sebesar Rp 30 juta (15%). Analisis dampak perbendaharaan dan sanksi manajerial yang tepat adalah:", 
     "Timbulnya idle cash kas negara yang merugikan likuiditas BUN; KPPN berwenang memotong pagu UP satker sebesar 50% untuk periode berikutnya", "Satker diberikan tambahan dana hibah", "Bendahara pengeluaran dinaikkan pangkatnya", "Seluruh pegawai kantor dipindahkan ke luar pulau", "A", 
     "Revolving UP di bawah 50% menunjukkan inefisiensi pengelolaan kas muka kerja; regulasi memberi wewenang KPPN menurunkan besaran UP satker pasif.", reg4),
    ("Analisis Kasus Keterlambatan Pertanggungjawaban TUP Melebihi 30 Hari: Satker Penanggulangan Bencana tidak mengajukan SPM PTUP hingga hari ke-45 pasca SP2D TUP terbit karena staf lapangan lambat mengumpulkan kuitansi. Konsekuensi sanksi sistemik dari KPPN adalah:", 
     "KPPN menerbitkan Surat Peringatan dan menolak permohonan TUP berikutnya serta menolak SPM GUP sebelum TUP lama tuntas dipertanggungjawabkan", "KPPN menghapus pagu anggaran bencana satker", "Penyedia barang diwajibkan mengembalikan barang bantuan", "Kepala satker diberhentikan tanpa pemeriksaan", "A", 
     "Keterlambatan PTUP melampaui 30 hari memicu pembekuan pengajuan TUP berikutnya dan penahanan SPM GUP satker hingga saldo TUP dipertanggungjawabkan sah.", reg4),
    ("Studi Kasus Pembagian Beban Pajak pada Transaksi Belanja E-Commerce Pemerintah: Satker membeli laptop melalui marketplace Digipay Satu seharga Rp 22 juta (termasuk PPN). Penjual menolak dipotong PPh Pasal 22 dengan dalih harga di aplikasi adalah harga pas. Evaluasi kepatuhan hukum bendahara adalah:", 
     "Tetap memotong PPh Pasal 22 dan PPN sesuai ketentuan perpajakan instansi pemerintah karena transaksi belanja negara wajib memungut pajak sesuai UU Perpajakan", "Menuruti permintaan penjual dan menanggung pajak dari kantong pribadi bendahara", "Membatalkan pemungutan pajak untuk semua transaksi belanja", "Mengubah status barang menjadi barang bekas bebas pajak", "A", 
     "Transaksi belanja pemerintah tunduk pada kewajiban pemotongan pajak bendahara/sistem marketplace yang mengikat secara hukum publik.", reg4),
    ("Analisis Kasus Penggunaan KKP untuk Keperluan Pribadi Pegawai: Pemegang KKP secara sengaja menggunakan kartu kredit dinas untuk belanja kebutuhan belanja keluarga di supermarket sebesar Rp 5 juta, dengan niat mengganti uangnya saat gajian. Penilaian hukum atas perbuatan tersebut adalah:", 
     "Pelanggaran disiplin berat dan penyalahgunaan wewenang keuangan negara (maladministrasi) yang dapat dikategorikan sebagai tindak pidana korupsi/penggelapan dana dinas", "Boleh dilakukan asalkan uang diganti sebelum tanggal cetak tagihan", "Merupakan hak fasilitas tambahan bagi pejabat perbendaharaan", "Tindakan wajar yang tidak memerlukan sanksi apapun", "A", 
     "KKP adalah instrumen pembayaran khusus pengeluaran dinas negara; penggunaan untuk kepentingan privat adalah pelanggaran integritas dan penyalahgunaan fasilitas negara.", reg4),
    ("Analisis Kasus Selisih Kurs pada Transaksi KKP untuk Perjalanan Dinas Luar Negeri: Pejabat menggunakan KKP untuk akomodasi delegasi di Swiss. Terjadi selisih kurs konversi valas saat billing statement diterbitkan yang melampaui estimasi awal SBM. Solusi penyelesaian akuntansi yang sah adalah:", 
     "Membayarkan selisih kurs riil yang tercantum pada billing statement bank penerbit sesuai bukti tagihan resmi dan mencatatnya pada akun belanja perjalanan dinas luar negeri", "Memotong gaji pejabat yang berangkat ke Swiss", "Menolak membayar tagihan bank penerbit", "Meminta kedutaan besar Swiss mengganti selisih kurs", "A", 
     "Selisih kurs konversi kartu kredit luar negeri diakui sebagai beban riil perjalanan dinas sepanjang didukung billing statement resmi dan batas pagu DIPA mencukupi.", reg4),
    ("Analisis Kasus Merchant Menolak Transaksi KKP Domestik karena Tidak Memiliki Mesin EDC GPN: Satker ingin membeli konsumsi rapat di katering lokal, namun katering hanya menerima uang tunai atau QRIS. Solusi digital perbendaharaan yang paling tepat adalah:", 
     "Menggunakan fitur QRIS KKP Domestik yang terintegrasi pada mobile banking/aplikasi KKP satker untuk scan barcode QRIS statis/dinamis milik katering", "Membatalkan rapat dinas", "Memaksa katering membeli mesin EDC mahal", "Mengambil uang kas pribadi peserta rapat", "A", 
     "KKP Domestik memfasilitasi transaksi non-tunai berbasis QRIS, memungkinkan satker bertransaksi dengan UMKM lokal yang hanya memiliki barcode QRIS.", reg4),
    ("Analisis Kasus Keterlambatan Pengesahan Belanja UP pada Akhir Tahun Anggaran (GUP Nihil Terlambat): Satker mengajukan SPM GUP Nihil pada tanggal 2 Januari tahun anggaran berikutnya. Dampak hukum terhadap penutupan buku kas negara adalah:", 
     "Belanja tersebut tidak dapat disahkan pada tahun lalu, sisa kas UP menjadi temuan tekor kas pada Neraca, dan KPA wajib menyetorkan seluruh nominal UP ke kas negara", "KPPN akan memundurkan tanggal kalender secara manual", "Uang belanja otomatis diputihkan oleh sistem", "Satker dibubarkan oleh Kementerian Keuangan", "A", 
     "GUP Nihil yang melewati batas cut-off akhir tahun menolak pengesahan belanja tahun berjalan, mengakibatkan kas tekor yang wajib disetor tunai kembali ke kas negara.", reg4),
    ("Analisis Efisiensi Penggunaan Cashless Society di Satker Pemerintah: Mengapa migrasi dari kas tunai brankas ke kombinasi KKP, CMS (Cash Management System), dan Digipay Satu menurunkan risiko fraud bendahara secara signifikan?", 
     "Menghilangkan kontak uang fisik (cashless), menghasilkan jejak digital audit (audit trail) per detik, dan mencegah percampuran uang dinas dengan uang pribadi", "Karena bendahara tidak perlu lagi bekerja di kantor", "Karena bank menanggung seluruh biaya operasional satker", "Karena harga barang menjadi gratis di semua toko", "A", 
     "Cashless ecosystem menutup peluang penggelapan kas fisik (tekor kas brankas), memperkuat transparansi, dan menyediakan rekaman mutasi perbankan yang tidak dapat dimanipulasi.", reg4),
    ("Analisis Kasus Pembebanan Biaya Bunga Tagihan KKP Akibat Keterlambatan Persetujuan SPM oleh PPSPM: SPP telah diverifikasi tepat waktu, namun PPSPM lupa melakukan inject TTE SPM selama 2 minggu hingga melewati due date. Siapakah yang wajib menanggung beban bunga dan denda bank?", 
     "PPSPM secara pribadi, karena kelalaian menjalankan kewenangan jabatannya menyebabkan timbulnya kerugian denda finansial", "Bendahara Pengeluaran kantor", "Pihak bank penerbit KKP", "Dibebankan pada mata anggaran belanja lain-lain DIPA", "A", 
     "Denda finansial keterlambatan KKP yang timbul akibat kelalaian pejabat memproses dokumen tagihan menjadi tanggung jawab pribadi pejabat yang lalai.", reg4),
    ("Analisis Kasus Satker Tanpa Mitra Bank HIMBARA di Lokasi Pelosok: Satker di pedalaman hanya memiliki akses ke Bank Pembangunan Daerah (BPD) yang belum terkoneksi Digipay Satu. Langkah kebijakan treasury yang tepat untuk memfasilitasi belanja satker adalah:", 
     "Satker mengoptimalkan pembukaan rekening operasional pada bank mitra persepsi terdekat, memanfaatkan CMS perbankan, atau mengajukan dispensasi khusus ke Kanwil DJPb", "Satker berhenti beroperasi sampai bank BUMN membuka cabang", "Satker mencetak mata uang sendiri untuk belanja", "Kepala satker meminta dana tunai dari APBD pemerintah daerah", "A", 
     "Kemenkeu mengakomodasi kondisi perbankan daerah melalui perizinan rekening khusus, pembukaan CMS, dan kerja sama interkoneksi bank daerah.", reg4),
    ("Analisis Evaluasi Proporsi UP KKP yang Tidak Pernah Digunakan: Satker memiliki plafon KKP Rp 80 juta namun sepanjang tahun transaksi KKP bernilai Rp 0. Evaluasi yang wajib dilakukan oleh Kanwil DJPb saat monitoring evaluasi adalah:", 
     "Mengevaluasi kompetensi pemegang KKP, mengidentifikasi hambatan merchant di wilayah satker, dan mencabut dispensasi atau mengenakan penalti IKPA indikator UP/KKP", "Memberikan hadiah liburan ke luar negeri bagi pemegang kartu", "Menambah plafon KKP menjadi Rp 500 juta", "Menghapus kewajiban penggunaan KKP bagi seluruh instansi", "A", 
     "Ketidakaktifan KKP mencerminkan resistensi modernisasi non-tunai; Kanwil berwenang mengevaluasi satker dan memberikan rekomendasi pembinaan intensif.", reg4),
    ("Analisis Kasus Pengadaan Barang Habis Pakai Mendadak di Luar Jam Kerja: Pejabat harus membeli obat-obatan darurat untuk karantina malam hari senilai Rp 8 juta. Mekanisme pembayaran instan yang paling tepat dan akuntabel adalah:", 
     "Menggunakan Kartu Kredit Pemerintah (KKP) dinas dan meminta struk rincian belanja serta bukti pembayaran pada saat transaksi", "Meminta penyedia berutang tanpa jaminan apapun", "Mengambil uang kas masjid terdekat", "Menyerahkan sertifikat tanah dinas sebagai jaminan", "A", 
     "KKP dirancang untuk fleksibilitas pembayaran kebutuhan operasional mendesak kapan saja tanpa ketergantungan jam kerja perbankan.", reg4),
    ("Analisis Rekonsiliasi Saldo Kas UP di Akhir Bulan: Hasil audit internal menunjukkan saldo fisik kas di brankas Rp 12 juta, saldo rekening koran bank Rp 35 juta, dan kuitansi belanja yang belum di-GUP-kan Rp 53 juta. Berapakah total posisi Uang Persediaan satker jika pagu UP adalah Rp 100 juta?", 
     "Rp 100 juta (Posisi kas lengkap: Rp 12 jt fisik + Rp 35 jt bank + Rp 53 jt kuitansi = Rp 100 juta, nihil tekor kas)", "Rp 47 juta saja", "Rp 88 juta", "Telah terjadi kehilangan kas sebesar Rp 50 juta", "A", 
     "Uji petik kas (cash opname): Total UP = Kas Fisik + Saldo Bank + Kuitansi Belanja Sah. Jumlah total Rp 100 juta menunjukkan kas dalam keadaan tertib dan klop.", reg4),
    ("Analisis Kasus Pembelian Barang Inventaris Aset Tetap Menggunakan Kas UP Tunai: Satker membeli 1 unit drone pemetaan seharga Rp 45 juta menggunakan uang kas UP tunai. Apakah transaksi ini sah dan bagaimana pencatatan asetnya?", 
     "Sah secara nominal (< Rp 50 juta), namun wajib segera diregister ke Modul Komitmen dan Modul Aset Tetap SAKTI agar tidak terjadi selisih aset belum diregister", "Tidak sah dan bendahara harus dipenjara", "Sah, tetapi barang tidak boleh dicatat sebagai milik negara", "Dilarang karena drone bukan barang operasional", "A", 
     "Belanja modal/aset dapat dibayar via UP sepanjang di bawah batas Rp 50 juta; kewajiban mutlaknya adalah meregistrasi BMN tersebut ke subledger Aset SAKTI.", reg4),
    ("Analisis Peran Dashboard Digipay Satu dalam Pencegahan Vendor Fiktif: Mengapa belanja melalui katalog Digipay Satu memitigasi risiko penyedia fiktif dan kuitansi palsu?", 
     "Karena seluruh vendor telah melalui verifikasi legalitas usaha (NIB, NPWP, rekening bank terdaftar) dan setiap transaksi terekam otomatis dalam database perbankan dan perpajakan", "Karena pembeli tidak perlu memeriksa barang yang datang", "Karena harga barang di Digipay Satu disubsidi pemerintah 100%", "Karena toko fisik vendor dijaga oleh polisi militer", "A", 
     "Sistem onboarding vendor Digipay Satu mensyaratkan verifikasi identitas hukum dan perbankan yang ketat, menutup peluang pembuatan kuitansi fiktif.", reg4)
]

add_items(t4, reg4, t4_mudah, t4_sedang, t4_analisis)

with open("scripts/p3_part4.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)
