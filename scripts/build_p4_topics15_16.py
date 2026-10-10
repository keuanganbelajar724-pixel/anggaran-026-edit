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
cur_num = 1751

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
# TOPIC 15: Langkah-Langkah Akhir Tahun Anggaran (LLAT) & Penutupan Buku (1751 - 1800)
# ============================================================================
reg15 = "Perdirjen Perbendaharaan tentang Pedoman Pelaksanaan Penerimaan dan Pengeluaran Negara pada Akhir Tahun Anggaran (LLAT)"
t15 = "Langkah-Langkah Akhir Tahun Anggaran (LLAT) & Penutupan Buku"

t15_items = []
# 17 MUDAH
t15_items.extend([
    ("MUDAH", "Tujuan diterbitkannya Peraturan Direktur Jenderal Perbendaharaan tentang Langkah-Langkah Akhir Tahun Anggaran (LLAT) setiap tahun adalah:",
     "Mengatur jadwal cut-off penerimaan, pengeluaran, penatausahaan kas, dan pelaporan keuangan agar tutup buku APBN berjalan tertib dan lancar", "Mempercepat pembagian tunjangan hari raya bagi pejabat eselon I", "Menghentikan seluruh layanan perbankan di seluruh Indonesia selama sebulan", "Menghapus kewajiban pembayaran pajak bagi seluruh wajib pajak", "A",
     "Perdirjen LLAT mengatur batas waktu (cut-off) pengajuan SPM, pendaftaran kontrak, penyetoran sisa kas UP/TUP, dan pelaporan akhir tahun anggaran."),
    ("MUDAH", "Batas waktu (cut-off date) penyampaian data kontrak baru atau perubahan kontrak akhir tahun ke KPPN pada masa LLAT bertujuan untuk:",
     "Memastikan komitmen belanja terdaftar tepat waktu dalam sistem perbendaharaan sebelum batas akhir penerbitan SP2D", "Menghambat kontraktor menyelesaikan pekerjaan fisik", "Memungut biaya pendaftaran kontrak tambahan dari rekanan", "Menyita jaminan pelaksanaan kontrak ke kas daerah", "A",
     "Cut-off pendaftaran kontrak memastikan seluruh komitmen belanja tercatat dalam SPAN sebelum jendela pembayaran akhir tahun ditutup."),
    ("MUDAH", "Sisa dana Uang Persediaan (UP) dan Tambahan Uang Persediaan (TUP) yang masih ada di rekening bendahara pengeluaran pada akhir tahun anggaran wajib:",
     "Disetorkan kembali seluruhnya ke Kas Negara sebelum batas akhir penutupan buku tahun anggaran berjalan", "Dibagikan kepada seluruh staf kantor sebagai uang pesangon akhir tahun", "Disimpan diam-diam untuk uang kas awal tahun anggaran berikutnya", "Dibelikan voucher belanja supermarket untuk inventaris kantor", "A",
     "Seluruh sisa dana UP/TUP yang tidak terpakai wajib disetorkan kembali ke Kas Negara paling lambat pada tanggal batas akhir LLAT."),
    ("MUDAH", "Rekening Penampungan Akhir Tahun Anggaran (RPATA) dibentuk oleh Kementerian Keuangan dengan tujuan untuk:",
     "Menampung dana pembayaran atas pekerjaan kontraktual yang belum selesai 100% pada akhir tahun anggaran dengan jaminan pemeliharaan/penyelesaian", "Menyimpan uang kas cadangan pensiun menteri keuangan", "Menampung sumbangan sukarela pegawai satker", "Membayar dividen perusahaan swasta nasional", "A",
     "RPATA menampung dana kontrak yang belum selesai 100% pada batas akhir tahun anggaran guna menjamin kepastian pembayaran kepada rekanan saat pekerjaan rampung."),
    ("MUDAH", "Mekanisme pembayaran pekerjaan kontraktual akhir tahun yang belum selesai 100% menggunakan fasilitas Bank Garansi akhir tahun mensyaratkan:",
     "Penyampaian Jaminan Pembayaran Akhir Tahun Anggaran (Bank Garansi) sebesar nilai pekerjaan yang belum diselesaikan", "Surat pernyataan lisan dari direktur kontraktor tanpa jaminan bank", "Kwitansi tanda terima uang muka kosong bertanda tangan materai", "Penyerahan sertifikat tanah milik keluarga kepala satker", "A",
     "Pencairan dana atas pekerjaan yang belum rampung 100% wajib dijamin dengan Garansi Bank / Surat Jaminan sebesar sisa pekerjaan."),
    ("MUDAH", "Jika pekerjaan fisik yang dijamin Bank Garansi akhir tahun ternyata gagal diselesaikan oleh kontraktor sampai batas waktu toleransi, tindakan KPPN/PPK adalah:",
     "Mencairkan Jaminan Pembayaran Akhir Tahun Anggaran (Bank Garansi) dan menyetorkannya ke Kas Negara sebagai penerimaan pengembalian belanja", "Mengikhlaskan uang negara yang telah dicairkan hilang begitu saja", "Menyuruh kontraktor berlibur ke luar negeri sampai situasi aman", "Memotong gaji bulanan staf honorer satker", "A",
     "PPK wajib segera melakukan klaim pencairan jaminan bank ke bank penerbit garansi dan menyetorkan uangnya kembali ke Kas Negara."),
    ("MUDAH", "Penyampaian SPM Gaji Induk untuk bulan Januari tahun anggaran berikutnya diajukan satker ke KPPN pada bulan Desember dengan mekanisme:",
     "Pengajuan SPM Gaji Induk Januari sebelum cut-off LLAT Desember dengan SP2D diberi tanggal buku awal Januari tahun berikutnya", "Pengajuan SPM Gaji Januari baru boleh dibuat pada akhir Februari", "Pembayaran gaji Januari ditiadakan dan diganti kupon sembako", "Gaji dibayar tunai oleh bendahara dari uang saku pribadi", "A",
     "Regulasi LLAT memfasilitasi pengajuan SPM Gaji Induk Januari lebih awal di bulan Desember agar PNS/TNI/Polri menerima gaji tepat waktu pada 2 Januari."),
    ("MUDAH", "Rekonsiliasi Laporan Keuangan Tingkat Satker akhir tahun (unaudited) bersama KPPN dilakukan melalui aplikasi:",
     "MonSAKTI (Monitoring SAKTI) / Modul Pelaporan SAKTI", "Aplikasi media sosial pesan grup", "Buku besar tulisan tangan di kertas folio bergaris", "Portal berita daring komersial", "A",
     "Rekonsiliasi eksternal satker dengan KPPN dilakukan secara elektronik melalui aplikasi MonSAKTI untuk menerbitkan Surat Keterangan Rekonsiliasi (SKR)."),
    ("MUDAH", "Konsep 'Penutupan Buku' (Book Closing) pada tanggal 31 Desember berarti:",
     "Mengakhiri seluruh pencatatan transaksi anggaran pendapatan dan belanja untuk periode tahun anggaran berkenaan", "Menutup gedung kantor dan mengunci pintu gerbang selama setahun", "Membakar seluruh buku kas dan arsip kuitansi kantor", "Menghapus nama satuan kerja dari sistem kementerian", "A",
     "Penutupan buku mengunci jurnal transaksi LRA tahun anggaran bersangkutan sehingga tidak ada lagi mutasi realisasi anggaran baru."),
    ("MUDAH", "Dokumen Berita Acara Kemajuan Pekerjaan (BAKP) akhir tahun dibuat oleh PPK dan konsultan pengawas untuk:",
     "Menyatakan persentase fisik riil pekerjaan yang telah diselesaikan kontraktor per tanggal cut-off akhir tahun", "Mencatat daftar hadir rapat makan siang bersama rekanan", "Menilai kepribadian pimpinan proyek kontraktor", "Menghitung jumlah kendaraan dinas yang parkir di lokasi proyek", "A",
     "BAKP menjadi dasar penentuan porsi pekerjaan yang sah dibayar murni dan porsi yang wajib dijamin dengan Garansi Bank/RPATA."),
    ("MUDAH", "Batas waktu penyetoran penerimaan negara (pajak dan PNBP) pada hari kerja terakhir tahun anggaran biasanya diperpanjang sampai dengan:",
     "Pukul 24.00 waktu setempat melalui sistem perbankan/persepsi MPN G3", "Pukul 08.00 pagi hari sebelum jam kantor dimulai", "Pukul 12.00 siang hari sebelumnya", "Tidak ada batas waktu, boleh disetor tahun depan", "A",
     "Pada hari kerja terakhir tahun anggaran, loket perbankan dan channel elektronik MPN dibuka hingga tengah malam untuk menampung seluruh setoran negara."),
    ("MUDAH", "Pengesahan Surat Perintah Pengesahan Pendapatan dan Belanja BLU (SP3B BLU) triwulan IV / akhir tahun diajukan ke KPPN paling lambat:",
     "Sesuai batas waktu cut-off LLAT di bulan Desember/awal Januari tahun anggaran berikutnya", "Pada pertengahan tahun anggaran dua tahun berikutnya", "Kapan saja jika pimpinan BLU memiliki waktu luang", "Tidak perlu disahkan jika BLU berstatus mandiri", "A",
     "SP3B BLU triwulan IV wajib diajukan sesuai jadwal LLAT agar seluruh pendapatan dan belanja BLU tersaji lengkap dalam LKPP."),
    ("MUDAH", "Jika terdapat Surat Perintah Pencairan Dana (SP2D) yang mengalami retur pada akhir tahun anggaran, penanganannya dilakukan dengan:",
     "Menerbitkan Surat Ralat/Penggantian rekening retur oleh KPPN sebelum batas akhir penutupan rekening penampungan retur", "Membiarkan uang retur tersimpan di bank komersial selamanya", "Membagi uang retur kepada pegawai KPPN yang bertugas lembur", "Menghapus nomor kontrak pekerjaan dari basis data", "A",
     "Retur SP2D akhir tahun harus segera diselesaikan dengan konfirmasi rekening baru agar hak penyedia terbayar dan tidak menjadi utang belanja lama."),
    ("MUDAH", "Istilah 'Tanggal Buku' dalam penerbitan SP2D pada masa transisi akhir tahun mengacu pada:",
     "Tanggal pencatatan transaksi kas dalam pembukuan Bendahara Umum Negara (BUN)", "Tanggal hari ulang tahun Kepala KPPN yang menjabat", "Tanggal percetakan kertas nota dinas kantor", "Tanggal kalender kuno romawi", "A",
     "Tanggal buku menentukan tahun anggaran pembebanan anggaran kas negara (apakah masuk buku TA berjalan atau TA berikutnya)."),
    ("MUDAH", "Persediaan barang habis pakai (seperti ATK, obat-obatan, amunisi) yang masih tersisa di gudang satker pada tanggal 31 Desember wajib dihitung melalui kegiatan:",
     "Inventarisasi Fisik Persediaan (Stock Opname) Akhir Tahun", "Pelelangan terbuka kepada masyarakat sekitar", "Pembakaran barang sisa agar gudang menjadi bersih", "Pengabaian fisik barang tanpa pencatatan", "A",
     "Stock opname akhir tahun wajib dilakukan untuk menyajikan nilai saldo Persediaan yang akurat di Neraca satker per 31 Desember."),
    ("MUDAH", "Akun 'Uang Muka Belanja' pada akhir tahun anggaran mencatat kondisi di mana:",
     "Kas telah dikeluarkan kepada pihak ketiga namun barang/jasa belum diterima sepenuhnya hingga 31 Desember", "Kas belum dibayar tetapi barang sudah dipakai habis", "Pegawai meminjam uang kantor untuk membeli rumah pribadi", "Pemerintah menerima hibah uang dari negara tetangga", "A",
     "Uang Muka Belanja timbul jika kas telah dicairkan (misal uang muka kontrak) namun prestasi barang/jasa belum selesai diserahterimakan."),
    ("MUDAH", "Penyusunan Laporan Keuangan Tingkat Kuasa Pengguna Anggaran (LK-KPA) Unaudited Akhir Tahun disampaikan kepada Menteri/Pimpinan Lembaga untuk:",
     "Dikonsolidasikan menjadi Laporan Keuangan Kementerian/Lembaga (LKKL) sebelum diserahkan ke BPK untuk diaudit", "Dibuang ke tempat daur ulang kertas", "Disimpan di brankas tanpa dibaca oleh pihak manapun", "Diberikan kepada kontraktor sebagai cinderamata kenang-kenangan", "A",
     "LK-KPA unaudited akhir tahun merupakan bahan konsolidasi berjenjang hingga menjadi LKKL yang diajukan ke BPK untuk pemeriksaan LKPP.")
])

# 17 SEDANG
t15_items.extend([
    ("SEDANG", "Perbedaan perlakuan perbendaharaan antara mekanisme Bank Garansi Akhir Tahun konvensional dengan Rekening Penampungan Akhir Tahun Anggaran (RPATA) adalah:",
     "Pada RPATA dana kas dipindahkan ke rekening penampungan pemerintah dan dicairkan sesuai prestasi riil tanpa kontraktor dibebani biaya komisi bank garansi yang mahal", "RPATA mengharuskan kontraktor membayar bunga pinjaman 20% kepada KPPN", "Bank Garansi akhir tahun dilarang digunakan di seluruh wilayah Indonesia", "RPATA hanya berlaku untuk proyek pengadaan mebeler kantor bernilai di bawah Rp 10 juta", "A",
     "RPATA merupakan inovasi treasury modern yang menampung kas di rekening BUN khusus sehingga rekanan tidak terbebani fee bank garansi yang tinggi."),
    ("SEDANG", "Apabila pekerjaan konstruksi yang menggunakan skema Bank Garansi akhir tahun mengalami keterlambatan penyelesaian hingga melewati 31 Desember (diberikan kesempatan 50 hari kalender), kontraktor dikenai sanksi:",
     "Denda keterlambatan sebesar 1 permil (1/1000) per hari dari nilai kontrak atau bagian kontrak sebelum PPN, yang disetor ke kas negara", "Hukuman kurungan penjara selama masa keterlambatan berlangsung", "Kewajiban menghibahkan seluruh peralatan proyek kepada satker", "Penghapusan seluruh hak pembayaran prestasi yang telah dikerjakan", "A",
     "Pemberian kesempatan penyelesaian pekerjaan melewati tahun anggaran mewajibkan pengenaan denda keterlambatan 1/1000 per hari sesuai perpres pengadaan."),
    ("SEDANG", "Pada masa LLAT, pengajuan SPM Non-Kontraktual (seperti pembayaran honorarium narasumber, biaya langganan daya dan jasa bulan Desember) diatur dengan batas cut-off:",
     "Ditetapkan lebih awal (biasanya minggu kedua/ketiga Desember) agar verifikator KPPN dapat memprioritaskan penyelesaian beban tagihan kontraktual bernilai besar", "Boleh diajukan kapan saja hingga bulan Maret tahun berikutnya", "Dilarang diajukan sama sekali dan dialihkan menjadi utang tak tertagih", "Hanya boleh dibayar menggunakan koin emas tunai", "A",
     "Jadwal cut-off bertingkat LLAT memisahkan batas waktu SPM rutin/operasional dari SPM kontraktual guna meratakan beban antrean sistem SPAN."),
    ("SEDANG", "Perlakuan terhadap sisa dana Tambahan Uang Persediaan (TUP) yang terlambat disetorkan ke Kas Negara hingga melewati batas akhir tanggal buku 31 Desember adalah:",
     "Menjadi temuan ketidakpatuhan kas di bendahara (Kas Lainnya di Bendahara Pengeluaran), memicu surat teguran KPPN, dan menurunkan skor IKPA satker", "Otomatis diputihkan dan menjadi hak milik sah bendahara pengeluaran", "Uang kas disita oleh kepala cabang bank umum tempat rekening dibuka", "Bendahara otomatis dinaikkan pangkatnya menjadi kepala kantor", "A",
     "Keterlambatan setor sisa TUP mencemari neraca akhir tahun dengan saldo kas mengendap yang tidak sah dan menjatuhkan nilai IKPA satker."),
    ("SEDANG", "Dalam proses rekonsiliasi akhir tahun, indikasi 'Transaksi Unregistered' (TDK / Transaksi Dalam Konfirmasi) pada aplikasi MonSAKTI harus diselesaikan dengan cara:",
     "Melakukan penelusuran dokumen sumber, perbaikan perekaman nomor register/SP2D di modul terkait SAKTI, dan rekonsiliasi ulang hingga status TDK menjadi nihil", "Menghapus paksa baris data transaksi dari database server satker", "Menunggu auditor BPK datang untuk menyelesaikan rekonsiliasi", "Membuat kuitansi fiktif baru agar angka neraca seimbang", "A",
     "Status TDK pada MonSAKTI menandakan selisih data antara satker dan SPAN KPPN yang wajib dituntaskan hingga terbit Surat Keterangan Rekonsiliasi (SKR) bersih."),
    ("SEDANG", "Pencatatan 'Beban Penyusutan Aset Tetap' pada penutupan buku tahun anggaran dilakukan oleh Modul Aset Tetap SAKTI dengan metode:",
     "Perhitungan amortisasi/penyusutan otomatis menggunakan metode garis lurus (straight line method) berdasarkan masa manfaat aset sesuai regulasi PMK", "Penebakan angka acak oleh staf pengelola barang milik negara", "Menghitung selisih harga jual mobil bekas di pasar otomotif", "Menyusutkan nilai seluruh gedung menjadi nol rupiah setiap akhir tahun", "A",
     "SAKTI menghitung penyusutan periodik aset secara otomatis berbasis masa manfaat standar akuntansi pemerintahan (SAP garis lurus)."),
    ("SEDANG", "Kewajiban penyampaian Laporan Pertanggungjawaban (LPJ) Bendahara Penerimaan dan Bendahara Pengeluaran bulan Desember ke KPPN memiliki batas waktu khusus LLAT, yaitu:",
     "Diajukan lebih awal di awal bulan Januari (biasanya tanggal 5-8 Januari) untuk memastikan keandalan saldo kas penutupan buku LKPP", "Boleh diserahkan pada akhir bulan Desember tahun berikutnya", "Tidak perlu diserahkan jika satker tidak memiliki saldo kas lebih dari Rp 1 juta", "Cukup dikirimkan melalui foto di status media sosial", "A",
     "Cut-off LPJ Bendahara bulan Desember dimajukan guna mencocokkan saldo kas fisik di brankas/bank dengan saldo kas di neraca LKPP penutupan buku."),
    ("SEDANG", "Penerbitan Surat Dispensasi Keterlambatan SPM oleh Kepala Kanwil Ditjen Perbendaharaan pada masa LLAT dapat diberikan dengan pertimbangan:",
     "Adanya kendala force majeure yang sah, penanganan bencana alam, atau alasan teknis sistem perbankan nasional yang di luar kendali satker", "KPA terlambat bangun tidur di hari batas akhir pengajuan SPM", "Pegawai satker lupa bahwa bulan Desember hanya sampai tanggal 31", "Kontraktor meminta perpanjangan waktu untuk berlibur", "A",
     "Dispensasi LLAT merupakan instrumen diskresi ketat Kanwil DJPb untuk mengantisipasi keadaan darurat yang sah tanpa mengorbankan integritas tutup buku."),
    ("SEDANG", "Pengakuan 'Pendapatan Diterima di Muka' pada penutupan buku satker pengelola PNBP (misal sewa gedung aula untuk 2 tahun ke depan) dicatat dengan perlakuan:",
     "Porsi sewa tahun berikutnya diakui sebagai Kewajiban Jangka Pendek (Pendapatan Diterima di Muka) di Neraca, bukan pendapatan penuh pada Laporan Operasional tahun ini", "Seluruh uang sewa diakui sebagai keuntungan pribadi kepala satker", "Uang sewa dikembalikan kepada penyewa aula", "Uang sewa disembunyikan dari pembukuan akuntansi", "A",
     "Sesuai asas akrual SAP, penerimaan kas yang masa manfaat layanannya melintasi tahun anggaran berikutnya diakui sebagai kewajiban pendapatan diterima di muka."),
    ("SEDANG", "Perlakuan terhadap Tagihan Belanja Barang/Jasa Tahun Anggaran Lalu yang terlambat diajukan dan tidak sempat dibayar hingga tutup buku adalah:",
     "Dicatat sebagai Kewajiban/Utang Beban di Neraca akhir tahun dan dibayarkan pada TA berikutnya melalui alokasi belanja tunggakan setelah revisi DIPA/audit BPKP", "Tagihan tersebut otomatis hangus dan rekanan dilarang menuntut uangnya", "Dibayar menggunakan uang saku kepala KPPN", "Satker meminjam dana kas desa terdekat untuk melunasi tagihan", "A",
     "Tagihan tertunggak lintas tahun yang sah diakui sebagai utang jangka pendek dan dialokasikan pembayarannya pada DIPA tahun berikutnya via mekanisme tunggakan."),
    ("SEDANG", "Penyelesaian Uang Muka Perjalanan Dinas Luar Negeri yang belum dipertanggungjawabkan hingga 31 Desember dilakukan dengan ketentuan:",
     "Pegawai bersangkutan wajib menyetorkan kembali sisa uang muka ke kas negara dan menyampaikan bukti kuitansi riil selambat-lambatnya sebelum penutupan buku LLAT", "Uang muka perjalanan dinas otomatis dianggap hadiah yang tidak perlu di-SPJ-kan", "Pegawai boleh mengabaikan kuitansi tiket pesawat dan hotel", "Kuitansi diganti dengan surat keterangan kelakuan baik", "A",
     "Pertanggungjawaban uang muka perdis wajib tuntas sebelum cut-off LLAT; sisa uang muka kas yang belum terserap disetor ke kas negara."),
    ("SEDANG", "Penerbitan Surat Edaran Bersama (SEB) antara Kemenkeu dan Kementerian PPN/Bappenas terkait batas akhir revisi anggaran akhir tahun menetapkan:",
     "Batas akhir persetujuan revisi anggaran DIPA (biasanya akhir November/awal Desember) untuk menjaga stabilitas pagu belanja saat eksekusi LLAT", "Revisi anggaran boleh diajukan sampai tanggal 31 Desember pukul 23.59", "Seluruh satker dilarang mengubah rencana penarikan dana sejak bulan Januari", "Revisi DIPA hanya boleh dilakukan oleh kontraktor pemenang lelang", "A",
     "Cut-off revisi anggaran ditetapkan lebih awal agar K/L fokus pada penyerapan dan KPPN tidak terbebani perubahan pagu di saat lonjakan SPM akhir tahun."),
    ("SEDANG", "Pemeriksaan Kas (Kas Opname) pada brankas bendahara pengeluaran per 31 Desember wajib dituangkan dalam dokumen resmi bernama:",
     "Berita Acara Pemeriksaan Kas dan Rekonsiliasi Bank Penutupan Buku Akhir Tahun yang ditandatangani KPA dan Bendahara", "Surat Izin Mengemudi Bendahara Kantor", "Daftar Riwayat Hidup Staf Keuangan", "Sertifikat Tanah Bangunan Kantor Satker", "A",
     "Berita Acara Pemeriksaan Kas per 31 Desember membuktikan keberadaan fisik uang tunai di brankas dan saldo rekening koran bank secara sah bagi auditor."),
    ("SEDANG", "Dalam kerangka LLAT, perlakuan terhadap Garansi Bank Jaminan Akhir Tahun Anggaran yang diterbitkan oleh Bank Penerbit yang mengalami likuidasi/pailit adalah:",
     "PPK wajib segera meminta kontraktor mengganti Garansi Bank dari bank umum sehat lain yang kredibel sebelum batas cut-off pencairan jaminan", "Menerima nasib kerugian negara tanpa melakukan tindakan apapun", "Menuntut nasabah bank yang tidak bersalah", "Menghapus catatan tagihan dari neraca satker", "A",
     "PPK wajib memitigasi risiko solvabilitas bank penerbit garansi dengan meminta penggantian jaminan bank sehat untuk melindungi keuangan negara."),
    ("SEDANG", "Pencatatan Transaksi Jurnal Penyesuaian (Adjusting Entries) akhir tahun pada Modul Akuntansi SAKTI berfungsi untuk:",
     "Mengakui pos akrual seperti beban yang masih harus dibayar, pendapatan yang masih harus diterima, penyusutan aset, dan koreksi kesalahan pencatatan", "Menghapus transaksi belanja yang tidak disukai oleh pimpinan unit", "Menggandakan angka saldo kas agar satker terlihat kaya", "Mengubah nama penerima bantuan sosial menjadi nama pegawai", "A",
     "Jurnal penyesuaian akhir tahun menyelaraskan pembukuan berbasis kas menjadi laporan keuangan berbasis akrual penuh sesuai SAP PP 71/2010."),
    ("SEDANG", "Konsekuensi keterlambatan penerbitan Surat Keterangan Rekonsiliasi (SKR) akhir tahun bagi Satker adalah:",
     "Satker dapat dikenai sanksi administratif berupa penundaan penerbitan SP2D Uang Persediaan (UP) tahun anggaran berikutnya oleh KPPN", "Gedung kantor satker disegel oleh petugas kepolisian", "Seluruh aset satker disita oleh kementerian dalam negeri", "Pegawai satker dilarang menggunakan seragam dinas", "A",
     "Keterlambatan rekonsiliasi dan tidak terbitnya SKR memicu sanksi pembekuan/penundaan pencairan UP TA berikutnya sesuai PMK Rekonsiliasi."),
    ("SEDANG", "Pada penutupan buku tahun anggaran, saldo akun 'Ekuitas Akhir' pada Laporan Perubahan Ekuitas (LPE) wajib bernilai sama dengan:",
     "Nilai pos Ekuitas pada Neraca pemerintah per 31 Desember tahun anggaran berkenaan", "Total pagu DIPA awal tahun sebelum revisi anggaran", "Jumlah kas tunai di brankas bendahara penerimaan", "Nilai pagu pinjaman luar negeri yang belum dicairkan", "A",
     "Artikulasi laporan keuangan pemerintah mensyaratkan saldo Ekuitas Akhir di LPE identik dengan pos Ekuitas di Neraca per 31 Desember.")
])

# 16 ANALISIS
t15_items.extend([
    ("ANALISIS", "Analisis Kasus Moral Hazard Penyerapan Anggaran Semu (Window Dressing) Akhir Tahun: Pada 28 Desember, PPK menerbitkan SPP-LS 100% untuk pengadaan 50 unit laptop padahal barang belum dikirim oleh rekanan, dengan dalih 'akan diserahkan minggu depan'. Analisis delik hukum dan perbendaharaannya adalah:",
     "Merupakan tindak pidana pemalsuan dokumen otentik dan pembayaran fiktif (Pasal 9 UU Tipikor jo UU No. 1/2004); PPK dan PPSPM bertanggung jawab pidana dan ganti rugi", "Tindakan inovatif yang terpuji demi menyelamatkan nilai IKPA penyerapan anggaran satker", "Diperbolehkan oleh regulasi LLAT sepanjang rekanan berjanji secara lisan", "Bukan pelanggaran karena laptop pasti akan dikirim suatu saat nanti", "A",
     "Pencairan dana APBN 100% tanpa prestasi barang riil (tanpa jaminan bank sah LLAT/RPATA) adalah tindak pidana korupsi pembayaran fiktif."),
    ("ANALISIS", "Analisis Risiko Likuiditas dan Antrean Sistem SPAN pada Tanggal Cut-Off Terakhir Penerbitan SP2D: Pada tanggal 31 Desember pukul 17.00, sistem perbendaharaan SPAN menerima lonjakan 150.000 SPM serentak dari seluruh Indonesia. Strategi mitigasi operasional Ditjen Perbendaharaan adalah:",
     "Menerapkan load-balancing server terdistribusi, perpanjangan jam kerja operasional kliring kas BI, dan prioritas antrean berbasis validasi otomatis AI", "Mematikan server SPAN secara sengaja agar pegawai KPPN dapat pulang cepat", "Menolak seluruh 150.000 SPM secara otomatis tanpa diverifikasi", "Menyuruh petugas loket bank mencatat transaksi secara manual di buku tulis", "A",
     "Mitigasi beban puncak SPAN melibatkan skalabilitas komputasi awan, perpanjangan window kliring BI, dan pengawalan command center 24 jam di DJPb."),
    ("ANALISIS", "Analisis Kasus Bank Garansi Jaminan Akhir Tahun Bodong / Palsu: Kontraktor menyerahkan Bank Garansi senilai Rp 5 miliar yang diterbitkan oleh oknum cabang bank tanpa tercatat dalam sistem bank induk (garansi palsu). Prosedur verifikasi KPPN/PPK yang gagal dan solusinya adalah:",
     "PPK wajib melakukan konfirmasi keabsahan tertulis langsung ke kantor pusat bank penerbit garansi sebelum SPM diajukan; jika palsu, kontrak diputus dan dilaporkan ke kepolisian", "Cukup memeriksa keindahan stempel dan tanda tangan pada kertas garansi", "Tidak perlu konfirmasi karena percaya pada integritas kontraktor", "Menyerahkan urusan keabsahan surat kepada supir kantor", "A",
     "Verifikasi keabsahan bank garansi akhir tahun mutlak dilakukan secara langsung ke bank penerbit guna menghindari kerugian negara akibat jaminan bodong."),
    ("ANALISIS", "Analisis Kasus Keterlambatan Serah Terima Pekerjaan Melewati Batas 50 Hari Kalender Toleransi: Kontraktor yang memanfaatkan fasilitas Bank Garansi akhir tahun belum menyelesaikan gedung hingga 50 hari kalender (pertengahan Februari). Tindakan yuridis yang wajib diambil KPA adalah:",
     "Memutus kontrak secara resmi, mencairkan Bank Garansi ke Kas Negara, mengenakan sanksi Blacklist 2 tahun kepada rekanan, dan mengaudit progres fisik riil", "Memberikan perpanjangan waktu gratis selama 5 tahun lagi tanpa sanksi denda", "Menyerahkan gedung yang belum jadi kepada rekanan sebagai hadiah", "Membayar bonus keterlambatan kepada kontraktor", "A",
     "Batas maksimal kesempatan 50 hari kalender adalah batas akhir hukum; kegagalan penyelesaian berakibat pemutusan kontrak, sita garansi, dan sanksi daftar hitam."),
    ("ANALISIS", "Analisis Dampak Rekening Penampungan Akhir Tahun Anggaran (RPATA) Terhadap Manajemen Piutang dan Utang Negara: Mengapa sistem RPATA lebih unggul dalam menjaga kredibilitas fiskal pemerintah dibanding mekanisme carry-over utang konvensional?",
     "Menjamin ketersediaan alokasi kas bagi kontraktor tanpa membebani DIPA tahun anggaran berikutnya dengan beban utang belanja masa lalu (carry-over arrears)", "Membuat kementerian keuangan tidak perlu lagi menyusun APBN tahun depan", "Menghapuskan kewajiban kontraktor menyelesaikan pekerjaan konstruksi", "Menaikkan suku bunga perbankan komersial nasional", "A",
     "RPATA menyelesaikan hak bayar rekanan menggunakan pagu anggaran tahun berkenaan yang diamankan di rekening escrow negara, meniadakan akumulasi utang tunggakan."),
    ("ANALISIS", "Analisis Kasus Kesalahan Akun Belanja (Misklasifikasi Beban Modal menjadi Beban Barang) yang Ditemukan Saat Tutup Buku: Satker membeli mesin genset Rp 500 juta menggunakan akun Belanja Barang Non-Operasional (521211) bukan Belanja Modal Peralatan Mesin (532111). Prosedur koreksi jurnal pada masa LLAT adalah:",
     "Melakukan Jurnal Reklasifikasi / Koreksi Akun Pembukuan di SAKTI dan perbaikan SPM koreksi ke KPPN sebelum penutupan buku permanen LRA/LKPP", "Membiarkan kesalahan tersebut karena yang penting genset sudah berfungsi", "Menjual kembali genset tersebut agar tidak menjadi temuan BPK", "Mengganti nama mesin genset menjadi 'kertas HVS kantor'", "A",
     "Salah akun belanja wajib dikoreksi melalui mekanisme ralat/koreksi pembukuan agar LRA dan Neraca menyajikan Aset Tetap secara akurat."),
    ("ANALISIS", "Analisis Risiko Pembengkakan Sisa Lebih Pembiayaan Anggaran (SiLPA) Akibat Keterlambatan Realisasi Proyek Strategis Nasional (PSN): Mengapa rendahnya penyerapan belanja modal di akhir tahun berdampak buruk pada pertumbuhan ekonomi riil makro?",
     "Terjadi 'fiscal drag' di mana uang APBN yang seharusnya mengalir menggerakkan sektor industri konstruksi dan membuka lapangan kerja justru mengendap pasif di kas negara", "Membantu menaikkan nilai tukar mata uang dolar amerika secara drastis", "Menurunkan angka kemiskinan dan pengangguran secara instan", "Membuat seluruh kementerian mendapatkan penghargaan internasional", "A",
     "Penyerapan anggaran yang lambat menahan stimulus fiskal pemerintah, mengurangi dampak multiplier effect APBN bagi pertumbuhan ekonomi masyarakat."),
    ("ANALISIS", "Analisis Akuntansi atas Penerimaan Setoran Pengembalian Belanja Setelah Tutup Buku 31 Desember: Satker menyetorkan kelebihan bayar gaji TA 2025 pada tanggal 15 Januari TA 2026. Pencatatan akun setoran pengembalian belanja tersebut adalah:",
     "Disetor menggunakan formulir SSBP akun Penerimaan Kembali Belanja Tahun Anggaran Yang Lalu (Pendapatan Lain-lain PNBP BUN), bukan mengurangi belanja TA berjalan", "Disetor untuk mengurangi belanja gaji bulan Januari TA 2026", "Disimpan di saku celana bendahara sebagai dana cadangan", "Diserahkan secara tunai kepada pimpinan KPPN", "A",
     "Pengembalian belanja yang disetor melintasi tahun anggaran diakui sebagai PNBP Pendapatan Pengembalian Belanja Tahun Lalu, bukan pengurang belanja tahun berjalan."),
    ("ANALISIS", "Analisis Pengendalian Internal Terhadap Transaksi Pembayaran Gaji Induk Januari yang Dijalankan di Bulan Desember: Mengapa KPPN menerapkan verifikasi ketat terhadap daftar nominatif gaji induk Januari yang diajukan lebih awal?",
     "Mencegah pembayaran gaji kepada pegawai yang telah pensiun, meninggal dunia, atau mutasi per 1 Januari tahun berikutnya yang memicu kerugian kelebihan bayar", "Supaya pegawai tidak dapat mengambil uang gajinya di mesin ATM", "Untuk menunda pembayaran hak gaji pegawai selama 6 bulan", "Sebagai syarat agar bank mitra dapat memotong biaya transfer ganda", "A",
     "Validasi daftar nominatif mutasi pegawai per 1 Januari krusial untuk mencegah kelebihan bayar gaji yang sulit ditarik kembali."),
    ("ANALISIS", "Analisis Penanganan Kontrak Tahun Jamak (Multi-Years Contract) yang Berakhir Tepat pada 31 Desember: Proyek pembangunan bendungan MYC 3 tahun senilai Rp 1 Triliun memasuki tahap akhir penutupan buku. KPA wajib memastikan kelengkapan dokumen penutupan:",
     "Berita Acara Serah Terima Pertama (PHO), Berita Acara Penyelesaian Akhir Kontrak, uji fungsi teknis (commissioning test), dan pencatatan BMN induk bendungan", "Cukup bersalaman dengan direktur kontraktor di warung kopi", "Membakar seluruh berkas kontrak tahun-tahun sebelumnya", "Meminta perpanjangan kontrak 10 tahun tanpa dasar alasan teknis", "A",
     "Penutupan kontrak MYC membutuhkan serah terima menyeluruh, uji fungsi komprehensif, dan kapitalisasi total aset ke SIMAK BMN."),
    ("ANALISIS", "Analisis Kasus Keterlambatan Pengesahan Belanja Dana Desa / DAK Fisik pada Masa LLAT: Pemda terlambat menyampaikan laporan realisasi DAK Fisik Tahap III hingga melewati batas waktu cut-off LLAT. Dampak yuridis penyalurannya adalah:",
     "Sisa DAK Fisik yang belum salur tidak dapat disalurkan kembali (hangus), dan pembiayaan sisa proyek fisik menjadi beban mutlak APBD pemerintah daerah", "Kemenkeu mentransfer sisa uang secara sukarela tanpa laporan pertanggungjawaban", "Pemda berhak menggugat presiden ke mahkamah internasional", "Proyek fisik otomatis diselesaikan oleh staf kementerian keuangan", "A",
     "Keterlambatan pemenuhan syarat salur DAK Fisik melewati cut-off LLAT berakibat hangusnya penyaluran sisa dana dari RKUN ke RKUD."),
    ("ANALISIS", "Analisis Keandalan Laporan Keuangan Pemerintah Pusat (LKPP) Terhadap Temuan 'Jurnal Tidak Wajar' (Unusual Journal Entries) pada Akhir Tahun: Auditor BPK menemukan ribuan jurnal manual tanpa dokumen sumber di akhir Desember. Dampak opini audit LKPP adalah:",
     "Dapat memicu penurunan opini pemeriksaan BPK dari Wajar Tanpa Pengecualian (WTP) menjadi Wajar Dengan Pengecualian (WDP) atau Tidak Memberikan Pendapat (Disclaimer)", "Membuat laporan keuangan pemerintah dipuji oleh seluruh dunia", "BPK otomatis memberikan medali emas kepada menteri keuangan", "Tidak berpengaruh apapun terhadap hasil pemeriksaan keuangan", "A",
     "Jurnal manual akhir tahun tanpa underlying document otentik mengindikasikan kelemahan SPI berat dan manipulasi angka neraca."),
    ("ANALISIS", "Analisis Kebijakan 'Cut-Off Time' Kliring Bank Indonesia pada Malam Tutup Tahun: Mengapa toleransi perpanjangan cut-off kliring RTGS/SKNBI di malam pergantian tahun memiliki batas maksimal pukul 24.00?",
     "Untuk menjaga integritas tanggal buku tahun fiskal Bank Sentral dan kepastian setelmen likuiditas sistem perbankan nasional sebelum kalender berganti", "Supaya para teller bank dapat segera merayakan pesta kembang api", "Karena satelit komunikasi bank dimatikan secara otomatis setiap tahun baru", "Untuk mencegah masuknya uang palsu dari luar negeri", "A",
     "Batas pukul 24.00 adalah cut-off legal batas akhir tahun anggaran APBN; transaksi melewati tengah malam otomatis masuk tahun anggaran baru."),
    ("ANALISIS", "Analisis Kasus Hilangnya Bukti Kuitansi Pengeluaran Riil saat Penyusunan SPJ Akhir Tahun: Bendahara pengeluaran kehilangan map berisi kuitansi belanja ATK Rp 80 juta akibat banjir di ruang kantor pada 30 Desember. Prosedur darurat pembuktian yang sah adalah:",
     "Membuat Berita Acara Kehilangan akibat bencana, meminta salinan faktur/kuitansi berlegalisir dari rekanan penjual, dan meminta penetapan pengesahan KPA", "Membuat kuitansi palsu sendiri dengan memalsukan tanda tangan toko", "Menutupi kehilangan dengan uang kas setoran pajak masyarakat", "Mengabaikan pembukuan belanja dan membiarkan kas selisih", "A",
     "Kehilangan dokumen bukti belanja akibat keadaan kahar ditangani dengan Berita Acara Kahar dan rekonsiliasi faktur legalisir pihak ketiga rekanan."),
    ("ANALISIS", "Analisis Peran 'Dashboard Command Center LLAT' Ditjen Perbendaharaan: Bagaimana visualisasi real-time antrean SPM di seluruh Indonesia membantu pimpinan Kemenkeu mengambil keputusan taktikal?",
     "Mendeteksi secara dini satker atau KPPN yang mengalami 'bottleneck' antrean SPM sehingga bantuan teknis server atau perpanjangan jam kerja dapat segera diarahkan", "Menghitung jumlah makanan ringan yang dikonsumsi oleh pegawai loket", "Merekam percakapan pribadi para bendahara satker", "Menentukan siapa menteri yang berhak diwawancarai oleh media", "A",
     "Command Center LLAT memberikan visibilitas end-to-end atas jutaan transaksi kas akhir tahun untuk intervensi mitigasi secara presisi."),
    ("ANALISIS", "Analisis Efektivitas Evaluasi Pasca-LLAT (Post-Mortem Review) bagi Penyempurnaan Regulasi Tahun Anggaran Berikutnya: Mengapa Ditjen Perbendaharaan selalu merevisi perdirjen LLAT setiap tahun berdasarkan evaluasi pelaksanaan sebelumnya?",
     "Mengakomodasi dinamika sistem teknologi perbendaharaan baru (SAKTI, SPAN, TTE), menutup celah moral hazard yang ditemukan, dan meningkatkan kenyamanan layanan satker", "Hanya untuk menghabiskan anggaran pencetakan buku peraturan baru", "Supaya para pengelola keuangan satker terus merasa bingung", "Karena diwajibkan oleh lembaga donor internasional", "A",
     "Continuous improvement regulasi LLAT merespon evaluasi empiris, digitalisasi proses, dan memitigasi kendala operasional tutup buku masa lalu.")
])

add_topic(t15, reg15, t15_items)

# ============================================================================
# TOPIC 16: Pengelolaan PNBP, Simponi & Tata Kelola Piutang Negara (1801 - 1850)
# ============================================================================
reg16 = "UU No. 9/2018 tentang PNBP jo PP No. 58/2020 jo PMK Pengelolaan Piutang Negara & Simponi MPN G3"
t16 = "Pengelolaan PNBP, Simponi & Tata Kelola Piutang Negara"

t16_items = []
# 17 MUDAH
t16_items.extend([
    ("MUDAH", "Berdasarkan Undang-Undang No. 9 Tahun 2018, Penerimaan Negara Bukan Pajak (PNBP) dikelompokkan ke dalam objek penerimaan:",
     "Pemanfaatan Sumber Daya Alam, Pelayanan, Pengelolaan Kekayaan Negara Dipisahkan, Pengelolaan BMN, Pengelolaan Dana, dan Hak Negara Lainnya", "Pajak Penghasilan, Pajak Pertambahan Nilai, dan Pajak Penjualan Barang Mewah", "Sumbangan sukarela masyarakat dan hasil lelang amal", "Tarif tilang lalu lintas yang dibayar langsung kepada polisi di jalan", "A",
     "UU No. 9/2018 Pasal 4 membagi objek PNBP ke dalam 6 klaster utama penerimaan negara bukan pajak."),
    ("MUDAH", "Sistem Informasi PNBP Online (SIMPONI) yang dikembangkan Kementerian Keuangan berfungsi untuk:",
     "Menghasilkan Kode Billing pembayaran PNBP/Penerimaan Non-Anggaran yang dapat dibayarkan wajib bayar melalui berbagai kanal perbankan/fintech", "Mencetak uang kertas pecahan baru", "Menghitung tarif pajak ekspor minyak bumi secara manual", "Memesan tiket bioskop dan transportasi umum", "A",
     "SIMPONI memfasilitasi pembuatan Kode Billing penerimaan negara terpadu yang terhubung dengan Modul Penerimaan Negara (MPN)."),
    ("MUDAH", "Masa berlaku (expired time) Kode Billing pembayaran PNBP yang diterbitkan melalui aplikasi SIMPONI umumnya berlaku selama:",
     "Jangka waktu tertentu (misal 3 hingga 7 hari kalender) sesuai jenis tarif dan pengaturan kementerian/lembaga terkait", "Satu abad penuh tanpa batas kedaluwarsa", "Hanya 5 detik sejak tombol cetak ditekan", "Selamanya meskipun nomor billing telah terbayar", "A",
     "Kode billing memiliki masa aktif tertentu (standar beberapa hari hingga beberapa pekan) sebelum kedaluwarsa jika tidak dibayar."),
    ("MUDAH", "Berdasarkan UU No. 9/2018, seluruh PNBP yang dipungut oleh instansi pemerintah wajib:",
     "Disetorkan seluruhnya secara bruto ke Kas Negara pada waktunya tanpa dipotong langsung untuk biaya operasional", "Dipotong langsung 50% untuk uang makan pegawai kantor", "Disimpan di rekening tabungan pribadi bendahara penerimaan", "Digunakan langsung untuk membiayai renovasi rumah kepala kantor", "A",
     "Asas bruto perbendaharaan mewajibkan seluruh penerimaan PNBP disetor penuh ke Kas Negara tanpa pemotongan kompensasi biaya apapun."),
    ("MUDAH", "Pengecualian penggunaan langsung sebagian PNBP oleh instansi pemerintah hanya dimungkinkan apabila:",
     "Instansi bersangkutan telah ditetapkan secara resmi sebagai Badan Layanan Umum (BLU) atau memiliki izin penggunaan PNBP berdasarkan regulasi sah", "Kepala satker merasa gaji pegawainya terlalu kecil", "Kantor satker kehabisan uang kas kecil di brankas", "Seluruh staf satker sepakat membagi uang PNBP", "A",
     "Hanya satker yang memiliki pola pengelolaan BLU atau persetujuan izin penggunaan PNBP yang dapat menggunakan pendapatannya untuk belanja."),
    ("MUDAH", "Bukti sah bahwa pembayaran PNBP telah berhasil masuk ke Rekening Kas Umum Negara adalah:",
     "Nomor Transaksi Penerimaan Negara (NTPN) dan Nomor Transaksi Bank (NTB) pada Bukti Penerimaan Negara (BPN)", "Nota kuitansi pasar yang ditulis dengan pensil", "Surat pernyataan lisan dari teller bank mitra", "Tangkapan layar obrolan pesan di aplikasi ponsel", "A",
     "NTPN yang diterbitkan oleh sistem MPN Kemenkeu merupakan bukti yuridis mutlak setoran telah masuk ke kas negara."),
    ("MUDAH", "Instansi pemerintah yang berwenang mengurus dan menyelesaikan Piutang Negara yang telah macet pada tingkat pusat dan daerah adalah:",
     "Panitia Urusan Piutang Negara (PUPN) dan Direktorat Jenderal Kekayaan Negara (DJKN)", "Badan Pengawas Pemilu (Bawaslu)", "Komisi Yudisial", "Dinas Kependudukan dan Catatan Sipil", "A",
     "PUPN bersama DJKN Kemenkeu bertugas mengurus pengurusan piutang macet negara dan menerbitkan Surat Paksa/Pernyataan Bersama."),
    ("MUDAH", "Piutang Negara timbul akibat adanya:",
     "Jumlah uang yang wajib dibayar kepada Pemerintah Pusat/Daerah berdasarkan perjanjian, peraturan perundang-undangan, atau sebab sah lainnya", "Janji sukarela teman sekantor untuk mentraktir makan siang", "Sewa rumah pribadi yang belum dibayar oleh tetangga", "Pembelian barang kredit antar perusahaan swasta", "A",
     "Piutang Negara adalah hak tagih finansial pemerintah atas kewajiban pihak ketiga berdasarkan perikatan hukum yang sah."),
    ("MUDAH", "Dokumen administratif penetapan tarif PNBP pada suatu Kementerian/Lembaga ditetapkan dengan instrumen hukum:",
     "Peraturan Pemerintah (PP) tentang Jenis dan Tarif atas Jenis PNBP yang Berlaku pada K/L bersangkutan", "Keputusan rapat kepala desa setempat", "Surat edaran pimpinan organisasi masyarakat", "Nota kesepakatan antar rekanan tender", "A",
     "Jenis dan tarif PNBP wajib diatur dengan Peraturan Pemerintah (PP) atau Peraturan Menteri Keuangan (PMK) untuk tarif tertentu."),
    ("MUDAH", "Keringanan PNBP dapat diberikan kepada Wajib Bayar dalam bentuk:",
     "Pengurangan tarif, pembebasan tarif, atau penundaan/pengangsuran pembayaran sesuai ketentuan peraturan perundang-undangan", "Pemberian uang tunai cuma-cuma dari kas negara", "Pembebasan dari seluruh hukum pidana yang berlaku", "Pemberian gelar kehormatan bangsawan", "A",
     "UU PNBP mengakomodasi skema keringanan tarif (pengurangan, pembebasan, pengangsuran) bagi masyarakat tidak mampu, mahasiswa, atau kondisi kahar."),
    ("MUDAH", "Penyelesaian Piutang Negara melalui mekanisme Penghapusan Secara Mutlak (Absolute Write-Off) berakibat hukum:",
     "Hak tagih negara atas piutang tersebut hapus secara permanen dari aspek perdata dan akuntansi neraca", "Debitur wajib membayar denda sepuluh kali lipat ke pengadilan", "Debitur dipenjara seumur hidup tanpa putusan hakim", "Piutang dialihkan menjadi utang warisan keluarga menteri", "A",
     "Penghapusan mutlak membatalkan hak tagih negara secara hukum perdata setelah upaya penagihan optimal terbukti tidak menghasilkan hasil."),
    ("MUDAH", "Tahapan awal pengurusan Piutang Negara oleh Satker sebelum menyerahkan pengurusan kepada PUPN adalah:",
     "Melakukan penagihan optimal mandiri melalui penerbitan Surat Tagihan I, II, dan III secara tertulis kepada penanggung utang", "Langsung menyita rumah dan tanah debitur tanpa surat peringatan", "Menyewa penagih utang swasta bersenjata", "Mengumumkan nama debitur di spanduk jalan raya", "A",
     "Satker wajib melakukan penagihan internal secara patut (Surat Peringatan 1, 2, 3) sebelum menyatakan macet dan menyerahkan ke PUPN."),
    ("MUDAH", "Penetapan Kualitas Piutang Negara dalam Laporan Keuangan dikelompokkan ke dalam 4 kategori kualitas, yaitu:",
     "Lancar, Kurang Lancar, Diragukan, dan Macet", "Emas, Perak, Perunggu, dan Tembaga", "Murah, Sedang, Mahal, dan Sangat Mahal", "Penting, Biasa, Santai, dan Terabaikan", "A",
     "Berdasarkan PMK Kualitas Piutang, kolektibilitas piutang negara diklasifikasikan: Lancar, Kurang Lancar, Diragukan, dan Macet."),
    ("MUDAH", "Penyisihan Piutang Tidak Tertagih (Allowance for Impairment) yang dibentuk pada neraca pemerintah bertujuan untuk:",
     "Menyajikan nilai bersih piutang negara yang diperkirakan dapat direalisasikan (Net Realizable Value) secara wajar dan konservatif", "Menghambur-hamburkan uang kas negara ke rekening debitur", "Menghapus nama-nama koruptor dari catatan kepolisian", "Menambah keuntungan dividen bank sentral", "A",
     "Penyisihan piutang merupakan pos kontra-aset di Neraca guna menyajikan nilai piutang yang realistis dapat ditagih sesuai kaidah akuntansi akrual."),
    ("MUDAH", "Saluran pembayaran Kode Billing SIMPONI saat ini dapat dilakukan masyarakat melalui:",
     "ATM, Mobile Banking, Internet Banking, Teller Bank/Pos, EDC, serta platform e-commerce dan dompet digital mitra MPN", "Hanya melalui loket brankas kantor Kementerian Keuangan di Jakarta", "Pengiriman amplop berisi uang kertas via pos darat", "Penitipan uang tunai kepada supir angkutan umum", "A",
     "MPN G3 mengintegrasikan billing SIMPONI ke berbagai kanal pembayaran perbankan dan fintech digital terkemuka."),
    ("MUDAH", "Surat Paksa (Grosse Akte) yang diterbitkan oleh Ketua PUPN memiliki kekuatan hukum eksekutorial yang setara dengan:",
     "Putusan Pengadilan Perdata yang telah berkekuatan hukum tetap (inkracht van gewijsde)", "Surat tilang polisi biasa", "Kwitansi tanda terima belanja toko kelontong", "Surat izin keramaian kelurahan", "A",
     "Surat Paksa PUPN memiliki kekuatan eksekutorial sama dengan vonis pengadilan inkracht, dapat langsung menjadi dasar penyitaan aset debitur."),
    ("MUDAH", "Penyerahan berkas pengurusan Piutang Negara ke PUPN dilakukan dengan menerbitkan dokumen:",
     "Surat Penyerahan Pengurusan Piutang Negara (SP3N) disertai resume dokumen dasar terjadinya piutang", "Surat Kuasa Membeli Barang Lelang", "Daftar Hadir Rapat Kerja Satker", "Kartu Tanda Penduduk Debitur", "A",
     "Penyerahan berkas piutang macet ke PUPN dilakukan via SP3N dengan melampirkan berkas perikatan, rincian utang, dan bukti penagihan gagal.")
])

# 17 SEDANG
t16_items.extend([
    ("SEDANG", "Perbedaan antara Surat Tagihan PNBP (STPNBP) dengan Surat Ketetapan PNBP Kurang Bayar (SKPNBP-KB) adalah:",
     "STPNBP diterbitkan untuk menagih kewajiban PNBP terutang rutin dan/atau sanksi denda keterlambatan, sedangkan SKPNBP-KB diterbitkan berdasarkan hasil pemeriksaan kepatuhan PNBP", "STPNBP hanya berlaku untuk warga negara asing sedangkan SKPNBP-KB untuk warga lokal", "Keduanya tidak memiliki kekuatan hukum menagih uang negara", "STPNBP diterbitkan oleh bank umum sedangkan SKPNBP-KB oleh kepolisian", "A",
     "STPNBP diterbitkan atas kewajiban jatuh tempo/denda rutin, sedangkan SKPNBP-KB terbit pasca audit/pemeriksaan PNBP yang menemukan kekurangan setor."),
    ("SEDANG", "Sanksi denda keterlambatan pembayaran PNBP yang diatur dalam UU No. 9/2018 dikenakan sebesar:",
     "2% (dua persen) per bulan dari jumlah PNBP terutang, untuk paling lama 24 (dua puluh empat) bulan", "50% per hari dari total kekayaan debitur", "100% per detik tanpa batas waktu", "Gratis tanpa sanksi denda apapun", "A",
     "UU PNBP menetapkan denda keterlambatan sebesar 2% per bulan dari pokok terutang dengan batas maksimal 24 bulan."),
    ("SEDANG", "Dalam tata kelola Piutang Negara, mekanisme 'Penghapusan Secara Bersyarat' (Conditional Write-Off) memiliki arti:",
     "Piutang dihapusbukukan dari catatan pos Neraca aktif, namun hak tagih negara secara hukum perdata tetap dipertahankan dan dicatat ekstra-komptabel", "Seluruh utang debitur dimaafkan dan dokumen perjanjian dibakar", "Debitur dibebaskan dari kewajiban membayar selamanya", "Uang kas negara disita untuk mengganti piutang yang hilang", "A",
     "Penghapusan bersyarat (write-off) mengeluarkan piutang dari neraca tanpa menghapuskan hak tagih perdata negara (dicatat dalam memori/ekstrakomptabel)."),
    ("SEDANG", "Kewenangan persetujuan penghapusan mutlak piutang negara bernilai di atas Rp 100 Miliar per penanggung utang berada pada:",
     "Presiden Republik Indonesia setelah mendapat pertimbangan Dewan Perwakilan Rakyat (DPR)", "Kepala Satuan Kerja tingkat kecamatan", "Bendahara Penerimaan Satker secara lisan", "Teller bank penerima setoran PNBP", "A",
     "Penghapusan piutang negara bernilai jumbo (> Rp 100 miliar) memerlukan persetujuan Presiden dengan pertimbangan DPR RI."),
    ("SEDANG", "Penggunaan sebagian dana PNBP oleh Kementerian/Lembaga penghasil diatur melalui mekanisme pencairan APBN, yaitu:",
     "Melalui penerbitan DIPA Alokasi PNBP Satker dan pencairan via SPM-LS / SPM-UP PNBP yang disahkan oleh KPPN mitra", "Mengambil uang tunai langsung dari kotak kasir sebelum disetor ke bank", "Menyetorkan uang PNBP ke rekening tabungan pribadi kepala satker", "Membeli barang di e-katalog menggunakan uang tunai tanpa kuitansi", "A",
     "Belanja bersumber PNBP tetap wajib ditarik melalui DIPA APBN dan diuji KPPN berbasis realisasi setoran kas PNBP yang telah terkonfirmasi."),
    ("SEDANG", "Pemeriksaan PNBP (Audit PNBP) oleh Badan Pengawas Keuangan dan Pembangunan (BPKP) atau Ditjen Anggaran bertujuan untuk:",
     "Menguji kepatuhan pemenuhan kewajiban PNBP oleh Wajib Bayar serta kepatuhan instansi pengelola dalam memungut dan menyetor PNBP", "Menghitung jumlah kendaraan dinas yang dimiliki kementerian", "Menilai kebersihan toilet gedung kantor satker", "Memeriksa menu makan siang para pegawai negeri", "A",
     "Audit PNBP memastikan akurasi perhitungan kewajiban Wajib Bayar (self-assessment) dan ketertiban penyetoran ke kas negara oleh instansi."),
    ("SEDANG", "Mekanisme Crash Program Keringanan Utang yang diselenggarakan oleh DJKN Kemenkeu bertujuan untuk:",
     "Memberikan relaksasi pemotongan sisa bunga/denda dan pokok utang piutang negara macet bagi debitur kecil/UMKM guna percepatan pemulihan ekonomi", "Membantu korporasi konglomerat menghindar dari pembayaran utang ratusan triliun", "Menghapus seluruh piutang negara tanpa persyaratan dokumen apapun", "Menghukum debitur kecil dengan penyitaan seluruh pakaian pribadinya", "A",
     "Crash Program Keringanan Utang menyasar debitur kecil (pasien rumah sakit, mahasiswa, UMKM) dengan diskon pokok dan bunga untuk penyelesaian cepat."),
    ("SEDANG", "Penyitaan barang jaminan Piutang Negara oleh Jurusita Piutang Negara dilakukan dengan menerbitkan dokumen resmi:",
     "Berita Acara Penyitaan Barang Jaminan yang disaksikan sekurang-kurangnya oleh 2 orang saksi dan lurah/kepala desa setempat", "Kwitansi pembelian barang bekas pasar malam", "Nota dinas peminjaman kendaraan operasional", "Surat keterangan izin mendirikan bangunan", "A",
     "Penyitaan aset oleh Jurusita PUPN wajib dituangkan dalam Berita Acara Sita resmi berkekuatan hukum dengan saksi resmi pemerintah lokal."),
    ("SEDANG", "Dalam aplikasi SAKTI, pencatatan transaksi piutang PNBP dari penetapan Surat Tagihan hingga penyetoran pelunasan dicatat pada:",
     "Modul Piutang dan terintegrasi otomatis dengan Modul Pembukuan/Pelaporan", "Modul Persediaan Barang Bergerak", "Modul Penggajian Pegawai Negeri", "Modul Arsip Surat Masuk", "A",
     "Modul Piutang SAKTI merekam timbulnya piutang (penetapan), penyisihan piutang, pelunasan (via billing SIMPONI), hingga jurnal saldo neraca."),
    ("SEDANG", "Ketentuan pengembalian kelebihan pembayaran PNBP kepada Wajib Bayar diatur bahwa:",
     "Wajib Bayar berhak mengajukan permohonan pengembalian kelebihan bayar yang diverifikasi oleh instansi pengelola dan dibayarkan melalui SPM-Pengembalian Pendapatan KPPN", "Kelebihan pembayaran otomatis hangus dan menjadi milik kasir kantor", "Kelebihan pembayaran diserahkan dalam bentuk barang inventaris bekas", "Wajib bayar dilarang meminta kembali uang kelebihannya", "A",
     "Wajib Bayar dilindungi hak restitusi kelebihan bayar PNBP melalui pengujian administratif dan pencairan SPM Pengembalian Pendapatan di KPPN."),
    ("SEDANG", "Dalam hal Wajib Bayar menolak hasil penetapan Surat Ketetapan PNBP Kurang Bayar, upaya hukum administratif yang dapat ditempuh adalah:",
     "Mengajukan Keberatan tertulis kepada Pimpinan Instansi Pengelola PNBP dalam jangka waktu yang ditentukan oleh peraturan perundang-undangan", "Melakukan aksi perusakan kantor instansi pemerintah pengelola", "Menolak membayar pajak dan PNBP seumur hidup", "Menyebarkan fitnah di media sosial tanpa dasar bukti", "A",
     "Wajib Bayar memiliki hak mengajukan Keberatan administratif atas penetapan SKPNBP-KB dengan menyertakan bukti perhitungan tandingan yang sah."),
    ("SEDANG", "Peran Pejabat Pengelola Penerimaan Negara Bukan Pajak pada Kementerian/Lembaga meliputi:",
     "Menyusun rencana PNBP, melakukan pemungutan/penagihan, penatausahaan, penyetoran ke kas negara, dan penyusunan laporan pertanggungjawaban PNBP", "Menghitung tarif bunga pinjaman bank komersial luar negeri", "Menandatangani kontrak lelang persenjataan militer", "Membeli saham properti di bursa efek internasional", "A",
     "Pengelola PNBP instansi bertanggung jawab penuh atas perencanaan target, collection, rekonsiliasi billing, dan kepatuhan penyetoran ke Kas Negara."),
    ("SEDANG", "Penjualan Lelang Eksekusi PUPN atas barang jaminan piutang negara yang disita dilaksanakan melalui perantara:",
     "Kantor Pelayanan Kekayaan Negara dan Lelang (KPKNL) melalui portal lelang resmi pemerintah (lelang.go.id)", "Pasar loak pinggir jalan tanpa sertifikat kepemilikan", "Toko daring media sosial milik pribadi bendahara", "Pemberian gratis kepada tetangga debitur", "A",
     "Eksekusi aset sitaan PUPN wajib dilelang secara transparan dan akuntabel melalui KPKNL via portal lelang.go.id."),
    ("SEDANG", "Piutang PNBP yang telah diserahkan pengurusannya kepada PUPN dicatat dalam Neraca Satker sebagai:",
     "Pos Piutang Macet yang disisihkan 100% dan dipindahkan pengawasannya ke akun aset lainnya/ekstrakomptabel", "Penambahan pendapatan kas secara tunai", "Penghapusan seluruh beban belanja pegawai kantor", "Pengurangan utang luar negeri pemerintah pusat", "A",
     "Piutang yang diserahkan ke PUPN diklasifikasikan berstatus Macet, disisihkan penuh 100% di neraca, dan dicatat pengurusannya di KPKNL."),
    ("SEDANG", "Tarif PNBP sampai dengan Rp 0,00 (nol rupiah) atau 0% (nol persen) dapat ditetapkan untuk pertimbangan tertentu, seperti:",
     "Kegiatan keagamaan, kegiatan kenegaraan, penanganan bencana alam, masyarakat miskin/tidak mampu, dan mahasiswa berprestasi", "Perusahaan tambang multinasional yang meraup untung besar", "Pejabat tinggi kementerian yang ingin berlibur ke luar negeri", "Rekanan tender yang memenangkan proyek pemerintah", "A",
     "UU PNBP Pasal 8 memungkinkan penerapan tarif Rp 0 (pembebasan) atas dasar pertimbangan sosial, kemanusiaan, bencana, dan dukungan UMKM/pendidikan."),
    ("SEDANG", "Keterkaitan antara nomor registrasi NTPN pada bukti setoran PNBP dengan laporan keuangan satker adalah:",
     "NTPN menjadi kunci rekonsiliasi data elektronik antara modul bank persepsi MPN, SPAN KPPN, dan modul penerimaan SAKTI", "NTPN hanya berfungsi sebagai nomor undian berhadiah kementerian", "NTPN tidak memiliki arti penting dalam sistem akuntansi negara", "NTPN dapat diubah-ubah secara bebas oleh staf satker", "A",
     "NTPN mengunci integritas setoran kas negara dan menjadi basis pencocokan otomatis penerimaan pada rekonsiliasi MonSAKTI."),
    ("SEDANG", "Jika debitur Piutang Negara melarikan diri ke luar negeri atau tidak diketahui lagi tempat tinggalnya, PUPN menerbitkan dokumen:",
     "Panggilan Melalui Surat Kabar / Pengumuman Terbuka dan dapat menerbitkan Pernyataan Piutang Negara Sementara Belum Dapat Diselesaikan (PSBDT)", "Surat ucapan selamat jalan kepada debitur yang kabur", "Penghapusan utang tanpa berita acara penelusuran", "Pencabutan kewarganegaraan debitur secara sepihak", "A",
     "Penelusuran debitur yang hilang dipublikasikan via media massa resmi; jika tetap nihil diterbitkan dokumen PSBDT sebagai dasar hapus buku.")
])

# 16 ANALISIS
t16_items.extend([
    ("ANALISIS", "Analisis Kasus Pengendapan Uang PNBP di Rekening Penampungan Satker: Bendahara Penerimaan menampung dana PNBP pelayanan sertifikasi Rp 500 juta di rekening giro bank umum selama 3 bulan untuk mendapatkan bunga bank sebelum disetor ke Kas Negara. Analisis delik hukum dan sanksinya adalah:",
     "Merupakan pelanggaran berat asas bruto UU Perbendaharaan dan UU PNBP; berpotensi delik korupsi penahanan uang negara; dikenai sanksi pengembalian bunga dan pidana", "Tindakan cerdas manajemen keuangan yang menghasilkan pendapatan bunga bagi kantor", "Diperbolehkan oleh undang-undang keuangan negara selama uang tidak hilang", "Bukan pelanggaran karena uang disimpan di bank umum nasional terpercaya", "A",
     "Penundaan penyetoran PNBP ke kas negara melanggar asas bruto dan kewajiban penyetoran tepat waktu; penikmatan bunga tanpa hak adalah tindak pidana korupsi."),
    ("ANALISIS", "Analisis Kasus Pembatalan Sepihak Tagihan Piutang Negara oleh Kepala Satker Tanpa Prosedur PUPN: KPA menghapuskan catatan piutang sewa ruko BMN senilai Rp 1,5 miliar kepada rekanan swasta hanya atas dasar nota kesepakatan damai internal. Analisis aspek hukumnya adalah:",
     "Tindakan tersebut tidak sah dan batal demi hukum; penghapusan piutang negara wajib melalui tata cara PP Pengelolaan Piutang Negara dan persetujuan pejabat berwenang (Menteri Keuangan/Presiden)", "Tindakan KPA sah karena KPA adalah penguasa anggaran tertinggi di kantornya", "Penghapusan piutang cukup disetujui oleh lurah tempat ruko berada", "Rekanan swasta bebas dari segala kewajiban pembayaran selamanya", "A",
     "KPA tidak memiliki wewenang sepihak menghapuskan piutang negara; penghapusan mutlak/bersyarat wajib mengikuti limitasi kewenangan Menkeu/Presiden via PUPN."),
    ("ANALISIS", "Analisis Risiko Fraud Penerbitan Kode Billing PNBP Fiktif: Oknum petugas loket membuat kode billing SIMPONI di aplikasi latihan (training mode) lalu menyerahkannya kepada masyarakat dan menerima uang tunai secara langsung. Langkah mitigasi sistemik Kemenkeu adalah:",
     "Mewajibkan masyarakat memvalidasi NTPN via portal resmi MPN, meniadakan pembayaran tunai di loket (cashless society), dan penguncian tanda air sistem", "Mengizinkan pembayaran tunai tanpa bukti pembayaran elektronik", "Menghapus aplikasi SIMPONI dan kembali ke kuitansi kertas karbon kuno", "Membiarkan masyarakat ditipu karena kelalaian sendiri", "A",
     "Pemberantasan billing bodong dilakukan melalui cashless payment mutlak, edukasi verifikasi mandiri NTPN, dan integrasi API antar sistem instansi."),
    ("ANALISIS", "Analisis Efektivitas Program 'Automatic Blocking System' (ABS) Antara DJKN, DJP, dan DJA Terhadap Penunggak PNBP/Piutang: Wajib Bayar yang memiliki utang PNBP macet Rp 20 miliar secara otomatis diblokir dari layanan ekspor dan akses perizinan berusaha. Dampak kepatuhan kebijakan ini adalah:",
     "Menciptakan efek jera finansial yang sangat kuat sehingga debitur terdorong segera melunasi tunggakan negara demi memulihkan operasional bisnisnya", "Membuat perusahaan debitur langsung bangkrut dan membakar pabriknya", "Merugikan negara karena pemerintah dituntut ganti rugi oleh debitur", "Tidak memiliki dampak kepatuhan apapun di lapangan", "A",
     "Automatic Blocking System (ABS) menyandera akses layanan publik krusial debitur (bea cukai, pajak, perizinan) hingga kewajiban kas negara diselesaikan."),
    ("ANALISIS", "Analisis Sengketa Penetapan Tarif Royalti Sumber Daya Alam (PNBP SDA Migas): Perusahaan migas menggugat SKPNBP-KB perhitungan lifting minyak bumi di Pengadilan Pajak. Kedudukan Kementerian Keuangan dan instansi teknis (Kementerian ESDM) dalam persidangan adalah:",
     "Menyajikan bukti rekonsiliasi data lifting terverifikasi, kontrak kerja sama bagi hasil, dan dasar perhitungan tarif PP PNBP yang sah di hadapan majelis hakim", "Menyerah kalah tanpa memberikan argumen hukum pembelaan", "Membatalkan seluruh undang-undang minyak dan gas bumi", "Meminta majelis hakim membagi dua uang royalti yang disengketakan", "A",
     "Pengadilan Pajak memeriksa sengketa banding penetapan PNBP; pemerintah mempertahankan hak fiskal negara berbasis kontrak PSC dan audit kepatuhan."),
    ("ANALISIS", "Analisis Perlakuan Akuntansi atas Piutang Negara yang Diputus Pailit oleh Pengadilan Niaga: Debitur piutang negara Rp 10 miliar dinyatakan pailit dan harta boedel pailit hanya mampu membayar 10% (Rp 1 miliar). Tindakan penyelesaian sisa piutang Rp 9 miliar adalah:",
     "Menerima pelunasan Rp 1 miliar sesuai putusan kepailitan, dan mengajukan usulan penghapusan mutlak atas sisa Rp 9 miliar yang tidak dapat dipulihkan lagi", "Menuntut hakim niaga membayar sisa Rp 9 miliar dari kantong pribadinya", "Memaksa mantan buruh pabrik debitur berutang untuk melunasi sisa Rp 9 miliar", "Membiarkan sisa piutang tetap tercatat sebagai piutang lancar di neraca", "A",
     "Sisa piutang negara yang tidak tertutupi harta pailit (insolvensi total) diusulkan penghapusan mutlak berdasarkan putusan pengadilan niaga yang berkekuatan inkracht."),
    ("ANALISIS", "Analisis Kebijakan Penggunaan PNBP untuk Peningkatan Kualitas Layanan Publik (Earmarked PNBP): Mengapa sebagian kementerian diperbolehkan menggunakan kembali PNBP-nya (misal PNBP paspor pada Ditjen Imigrasi)?",
     "Untuk membiayai pengadaan blangko paspor, pemeliharaan sistem biometrik, dan peningkatan kualitas kenyamanan layanan publik tanpa membebani rupiah murni APBN", "Supaya para petugas imigrasi dapat menerima uang tips tambahan dari pemohon", "Untuk membeli mobil mewah bagi seluruh pejabat kantor imigrasi", "Agar kantor imigrasi dapat memisahkan diri dari negara kesatuan republik indonesia", "A",
     "Izin penggunaan PNBP mengikat pendapatan dengan peningkatan mutu sarana prasarana layanan publik bersangkutan (cost-recovery paradigm)."),
    ("ANALISIS", "Analisis Dampak Fluktuasi Harga Komoditas Global Terhadap Target Penerimaan PNBP: Ketika harga batubara dan nikel dunia anjlok 40%, bagaimana Kementerian Keuangan memitigasi defisit target PNBP SDA dalam APBN?",
     "Mengoptimalkan intensifikasi PNBP non-SDA (layanan kementerian, dividen BUMN, pemanfaatan BMN), serta pengetatan audit royalti dan kepatuhan wajib bayar", "Memaksa rakyat membayar iuran bulanan wajib baru secara paksa", "Mencetak uang kertas baru tanpa dasar perhitungan cadangan devisa", "Menutup seluruh tambang batubara dan nikel di indonesia", "A",
     "Volatilitas harga komoditas global dimitigasi melalui diversifikasi sumber PNBP non-komoditas dan pengawasan kepatuhan volume produksi tambang."),
    ("ANALISIS", "Analisis Kasus Piutang Uang Pengganti Tindak Pidana Korupsi: Kejaksaan Negeri mengelola piutang uang pengganti korupsi Rp 50 miliar dari terpidana yang tidak memiliki aset lagi dan telah menjalani pidana kurungan subsidair. Penatausahaan perbendaharaannya adalah:",
     "Setelah masa pidana badan subsidair selesai dijalani secara sah, piutang uang pengganti diusulkan penghapusan mutlak dengan melampirkan berkas eksekusi putusan pidana", "Tetap menagih keluarga anak cucu terpidana hingga tujuh turunan", "Menyandera fisik anak terpidana di kantor kejaksaan", "Menghapus berkas kasus dari arsip negara secara diam-diam", "A",
     "Pelaksanaan pidana kurungan pengganti (subsidair) menghapuskan kewajiban pembayaran uang pengganti korupsi, menjadi dasar legal pengusulan hapus buku piutang."),
    ("ANALISIS", "Analisis Efektivitas 'Penyitaan Harta Kekayaan di Luar Barang Jaminan' oleh PUPN: Debitur memiliki utang macet Rp 15 miliar dengan jaminan tanah senilai Rp 5 miliar. Apakah PUPN berhak menyita aset debitur lainnya yang tidak dijaminkan?",
     "Berhak, berdasarkan asas hukum perdata Pasal 1131 KUHPerdata bahwa seluruh harta debitur baik bergerak maupun tidak bergerak menjadi jaminan atas segala utangnya", "Tidak berhak, karena penyitaan hanya boleh dilakukan atas barang yang tercantum dalam akad awal", "Hanya berhak jika debitur memberikan izin secara sukarela", "Tidak berhak karena melanggar hak asasi kepemilikan tanah warga", "A",
     "Berdasarkan Pasal 1131 KUHPerdata dan UU Piutang Negara, seluruh harta kekayaan debitur merupakan jaminan utang umum yang dapat disita eksekusi oleh PUPN."),
    ("ANALISIS", "Analisis Penerapan Digital Forensics dalam Melacak Aset Tersembunyi (Hidden Assets) Penanggung Utang Negara: DJKN bekerja sama dengan PPATK melacak aliran kas debitur macet ke rekening nominee di luar negeri. Nilai strategis audit forensik ini adalah:",
     "Menembus rekayasa kepemilikan aset fiktif dan membuktikan itikad tidak baik debitur guna penetapan sita eksekusi dan pencegahan bepergian ke luar negeri", "Membuat debitur dipuji sebagai pengusaha sukses oleh masyarakat", "Membantu debitur menyembunyikan uangnya di bank Swiss", "Menghapus seluruh catatan utang debitur dari basis data nasional", "A",
     "Sinergi intelijen keuangan mengungkap transaksi pencucian uang dan penyembunyian aset debitur guna pemulihan kerugian hak tagih negara."),
    ("ANALISIS", "Analisis Dampak Penetapan Status Badan Layanan Umum (BLU) Terhadap Fleksibilitas Pengelolaan PNBP Rumah Sakit Pemerintah: Bagaimana fleksibilitas BLU meningkatkan mutu penanganan pasien darurat?",
     "Pendapatan jasa medis dapat langsung dibelanjakan hari itu juga untuk membeli obat-obatan darurat dan oksigen tanpa harus menyetor dan menunggu SP2D KPPN", "Direktur rumah sakit bebas memungut biaya pengobatan setinggi-tingginya dari pasien miskin", "Rumah sakit tidak perlu lagi diaudit oleh Badan Pemeriksa Keuangan", "Dokter dan perawat dibebaskan dari kewajiban mematuhi standar medis", "A",
     "Pola fleksibilitas BLU memotong birokrasi pencairan kas, memungkinkan respon cepat pengadaan logistik medis vital secara mandiri."),
    ("ANALISIS", "Analisis Keterkaitan Antara Target PNBP dalam DIPA dengan Indikator Kinerja Pelaksanaan Anggaran (IKPA): Pada satker yang memiliki target pendapatan PNBP, ketidaksesuaian target dengan realisasi berdampak pada:",
     "Evaluasi kinerja perencanaan anggaran satker dan kepastian pendanaan belanja yang dibiayai dari sumber dana PNBP berkenaan", "Pemecatan langsung kepala satuan kerja oleh dewan perwakilan rakyat", "Penutupan seluruh akses internet di kantor satker bersangkutan", "Penghapusan nomor pokok wajib pajak seluruh pegawai", "A",
     "Deviasi penerimaan PNBP dari target DIPA mempengaruhi likuiditas belanja operasional satker dan akurasi perencanaan pendapatan negara."),
    ("ANALISIS", "Analisis Kasus Keringanan Utang Berupa Moratorium Pembayaran Bunga Bagi Debitur Bencana Gempa: Pemerintah menerbitkan kebijakan pembekuan bunga piutang bagi petani korban bencana alam selama 2 tahun. Dasar pertimbangan keadilan sosialnya adalah:",
     "Memberikan ruang pemulihan ekonomi bagi korban bencana agar tidak terjerumus kemiskinan ekstrem sebelum kewajiban finansial ditagihkan kembali", "Mendorong petani untuk berhenti bertani dan pindah ke kota besar", "Menghukum petani karena terkena musibah bencana alam", "Menghabiskan dana cadangan darurat kementerian keuangan", "A",
     "Moratorium dan relaksasi utang bencana merupakan wujud kehadiran negara dalam melindungi resiliensi sosio-ekonomi masyarakat terdampak bencana."),
    ("ANALISIS", "Analisis Peran 'Sistem Validasi Pajak dan PNBP' di Pelabuhan Internasional (Inaportnet): Mengapa kapal kargo asing dilarang berlayar meninggalkan pelabuhan sebelum NTPN billing PNBP jasa labuh tambat terkonfirmasi?",
     "Mencegah kapal asing kabur meninggalkan wilayah perairan Indonesia tanpa melunasi kewajiban PNBP negara (pencegahan default piutang maritim)", "Supaya awak kapal asing betah tinggal di indonesia selamanya", "Untuk memaksa kapal asing menjual seluruh muatan barangnya secara murah", "Sebagai bentuk penghormatan adat istiadat setempat", "A",
     "Validasi NTPN terintegrasi dengan Surat Persetujuan Berlayar (Port Clearance) mencegah risiko kerugian negara dari debitur asing lintas batas."),
    ("ANALISIS", "Analisis Masa Depan Tata Kelola PNBP Menuju 'Smart Revenue Governance': Bagaimana integrasi Big Data dan AI dalam sistem SIMPONI generasi berikutnya mendeteksi potensi kebocoran penerimaan negara?",
     "Menganalisis anomali data transaksi layanan secara real-time, memprediksi penerimaan optimal tiap satker, dan mendeteksi under-invoicing secara otomatis", "Menggantikan seluruh pegawai kementerian keuangan dengan robot fisik", "Menghapuskan mata uang rupiah dan menggantinya dengan barter barang", "Membuat seluruh rakyat tidak perlu lagi membayar biaya layanan pemerintah", "A",
     "Pemanfaatan big data analytics dan AI pada ekosistem penerimaan negara menutup kebocoran under-reporting dan memperluas basis penerimaan fiskal secara adil.")
])

add_topic(t16, reg16, t16_items)

# Save intermediate json for topic 15 and 16
with open("scripts/p4_topics15_16.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)
print("Topic 15 & 16 successfully written!")
