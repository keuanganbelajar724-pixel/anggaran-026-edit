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

# Load first 350 questions
with open("scripts/p3_topics1_to_7.json", "r", encoding="utf-8") as f:
    part3_questions = json.load(f)

print(f"Loaded existing {len(part3_questions)} questions.")
cur_num = 1401

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
# TOPIC 8: Tata Kelola Kas Negara, Rekening Pemerintah & SPRINT (1401 - 1450)
# ============================================================================
t8 = "Tata Kelola Kas Negara, Rekening Pemerintah & SPRINT"
reg8 = "PMK No. 182/PMK.05/2017 jo PMK No. 183/PMK.05/2019 tentang Rekening Milik Satuan Kerja K/L"

t8_m = [
    ("Sistem rekening kas terpusat milik Bendahara Umum Negara di Bank Indonesia disebut:", 
     "Treasury Single Account (TSA)", "Rekening Giro Swasta", "Tabungan Bersama Kementerian", "Deposito Berjangka K/L", "A", 
     "TSA (Treasury Single Account) adalah rekening tunggal perbendaharaan negara untuk konsolidasi seluruh kas pemerintah di Bank Indonesia.", reg8),
    ("Setiap pembukaan rekening dinas milik Kementerian/Lembaga pada bank umum wajib mendapatkan persetujuan tertulis dari:", 
     "Kuasa Bendahara Umum Negara (KPPN / Dirjen Perbendaharaan)", "Kepala Dinas Pasar", "Camat setempat", "Manajer Cabang Bank Mandiri", "A", 
     "Pasal 2 PMK 182/2017 mewajibkan izin pembukaan rekening pemerintah diterbitkan oleh Kuasa BUN (KPPN/DJPb).", reg8),
    ("Aplikasi sistem informasi milik Ditjen Perbendaharaan yang digunakan untuk pengelolaan dan perizinan rekening pemerintah adalah:", 
     "SPRINT (Sistem Pengelolaan Rekening Terintegrasi)", "DJP Online", "SIMPONI", "e-Katalog LKPP", "A", 
     "SPRINT memfasilitasi perizinan, pelaporan saldo harian, dan penutupan rekening dinas satker secara terintegrasi.", reg8),
    ("Rekening pemerintah yang digunakan untuk menampung uang persediaan kas operasional disebut:", 
     "Rekening Pengeluaran", "Rekening Penerimaan", "Rekening Penampungan Pajak", "Rekening Dana Abadi", "A", 
     "Rekening Pengeluaran digunakan bendahara pengeluaran untuk menampung dana UP dan dana pembayaran SP2D.", reg8),
    ("Saldo kas pada Rekening Penerimaan instansi pemerintah pada akhir hari kerja wajib disetorkan ke Kas Negara dengan saldo akhir (nihil balance):", 
     "Rp 0 (nihil) atau dipindahkan ke rekening TSA pusat secara otomatis (sweeping)", "Maksimal Rp 50 juta", "Maksimal Rp 100 juta", "Bebas mengendap berapa saja", "A", 
     "Prinsip zero balance rekening penerimaan mewajibkan saldo harian disetor/disweep utuh ke rekening Kas Negara.", reg8),
    ("Jasa giro / bunga bank yang diperoleh dari rekening dinas pemerintah wajib:", 
     "Disetorkan seluruhnya ke Kas Negara sebagai PNBP", "Dibagikan ke pegawai satker sebagai insentif", "Disimpan di brankas bendahara", "Dibelikan oleh-oleh kantor", "A", 
     "Seluruh bunga atau jasa giro rekening dinas adalah hak penerimaan negara dan wajib disetorkan ke Kas Negara.", reg8),
    ("Rekening pemerintah yang tidak memiliki transaksi mutasi debet/kredit dalam jangka waktu tertentu disebut:", 
     "Rekening Pasif (Dormant)", "Rekening Aktif", "Rekening Premium", "Rekening Rahasia", "A", 
     "Rekening dormant adalah rekening yang tidak aktif dan berpotensi disalahgunakan sehingga wajib ditutup atau ditertibkan.", reg8),
    ("Pejabat yang berwenang mengajukan permohonan persetujuan pembukaan rekening dinas ke KPPN adalah:", 
     "Kuasa Pengguna Anggaran (KPA)", "Bendahara Pengeluaran saja", "Staf arsip kantor", "Penyedia barang rekanan", "A", 
     "Permohonan izin pembukaan rekening ke Kuasa BUN ditandatangani oleh KPA instansi.", reg8),
    ("Pemberian persetujuan pembukaan rekening oleh KPPN diterbitkan dalam bentuk dokumen resmi:", 
     "Surat Persetujuan Pembukaan Rekening", "Kuitansi Pembelian", "Faktur Pajak", "Buku Cek Tunai", "A", 
     "KPPN menerbitkan Surat Persetujuan Pembukaan Rekening dengan kode register resmi yang terhubung ke perbankan.", reg8),
    ("Batas waktu pelaporan pembukaan rekening ke KPPN setelah rekening berhasil dibuka di bank adalah paling lambat:", 
     "20 hari kerja sejak tanggal persetujuan KPPN", "60 hari kalender", "1 tahun kalender", "Tidak wajib dilaporkan", "A", 
     "Satker wajib melaporkan nomor rekening resmi ke KPPN via SPRINT paling lambat 20 hari kerja setelah surat persetujuan.", reg8),
    ("Rekening dinas yang dibuka tanpa izin dari Kuasa BUN dikategorikan sebagai:", 
     "Rekening Liar / Rekening Ilegal", "Rekening Cadangan Darurat", "Rekening Simpanan Koperasi", "Rekening Kebajikan", "A", 
     "Rekening dinas tanpa izin BUN melanggar UU No. 1/2004 dan dikategorikan sebagai rekening liar yang wajib ditutup dan disita kasnya.", reg8),
    ("Rekening Lainnya pada satker pemerintah digunakan untuk menampung dana:", 
     "Uang titipan pihak ketiga, dana jaminan lelang, atau dana titipan yang belum menjadi hak negara", "Uang belanja operasional kantor", "Uang gaji pegawai bulanan", "Uang bonus akhir tahun", "A", 
     "Rekening Lainnya menampung dana non-APBN seperti uang jaminan, titipan pengadilan, atau dana perwakilan.", reg8),
    ("Penutupan rekening dinas pemerintah yang sudah tidak digunakan lagi wajib dilaporkan ke KPPN dalam waktu:", 
     "Paling lambat 10 hari kerja setelah tanggal penutupan di bank", "Paling lambat 30 hari kalender", "Paling lambat 6 bulan", "Tidak perlu melapor", "A", 
     "Laporan penutupan rekening wajib disampaikan ke KPPN via SPRINT selambat-lambatnya 10 hari kerja setelah penutupan bank.", reg8),
    ("Layanan perbankan digital berbasis internet yang diwajibkan bagi bendahara pengeluaran dalam bertransaksi kas adalah:", 
     "Cash Management System (CMS) Perbankan", "ATM bersama konvensional", "SMS banking reguler", "Aplikasi pinjaman online", "A", 
     "CMS perbankan pemerintah menyediakan fasilitas multi-otorisasi (maker, checker, approver) untuk tata kelola kas non-tunai.", reg8),
    ("Dalam struktur CMS perbankan pemerintah, peran Approver yang menyetujui transaksi transfer kas dipegang oleh:", 
     "Kuasa Pengguna Anggaran (KPA) atau Pejabat yang Diberi Kuasa", "Staf magang kantor", "Petugas parkir", "Satpam jaga malam", "A", 
     "Hierarki CMS: Operator/Maker (staf/bendahara), Checker (verifikator), dan Approver (KPA/PPK) untuk segregasi tugas.", reg8),
    ("Konfirmasi keabsahan rekening bendahara dilakukan oleh auditor BPK secara independen melalui mekanisme:", 
     "Surat Konfirmasi Saldo Bank (Bank Confirmation Letter) langsung ke kantor pusat bank", "Melihat foto buku tabungan", "Menanyakan secara lisan ke bendahara", "Memeriksa postingan media sosial", "A", 
     "Auditor eksternal mengirim konfirmasi saldo langsung ke kantor pusat bank untuk verifikasi independen atas seluruh rekening dinas.", reg8),
    ("Rekening Khusus (Reksus) dalam perbendaharaan negara dibuka di Bank Indonesia untuk menampung dana:", 
     "Pinjaman dan/atau Hibah Luar Negeri (PHLN)", "Pajak kendaraan bermotor", "Iuran pensiun pegawai swasta", "Hasil penjualan tanah sitaan", "A", 
     "Rekening Khusus menampung penarikan dana pinjaman/hibah luar negeri sebelum disalurkan untuk pembiayaan proyek.", reg8)
]

t8_s = [
    ("Bagaimanakah prosedur legal penutupan rekening dinas satker yang telah berstatus pasif (dormant)?", 
     "KPA mengajukan surat penutupan ke bank mitra -> Sisa saldo kas disetor utuh ke Kas Negara -> Bank menerbitkan bukti penutupan -> Satker lapor ke KPPN via SPRINT", "Meninggalkan rekening begitu saja dengan saldo nol", "Menyerahkan buku tabungan ke pihak ketiga", "Mengubah nama pemilik rekening menjadi nama pribadi staf", "A", 
     "Penutupan rekening dormant: penyetoran saldo sisa ke Kas Negara, penutupan administratif di bank, dan update status di SPRINT KPPN.", reg8),
    ("Satker membuka rekening pengeluaran baru di Bank X tanpa mengajukan permohonan izin ke KPPN. Dampak yuridis dan sanksinya adalah:", 
     "Rekening tersebut dinyatakan ilegal, KPPN memerintahkan pemblokiran dan penutupan rekening, dan saldo disita ke kas negara", "Satker diberikan hadiah piagam", "Bank X dipuji oleh menteri", "Tidak ada konsekuensi hukum", "A", 
     "Pembukaan rekening liar melanggar UU Perbendaharaan Negara; Kuasa BUN berwenang memblokir dan menyita saldo ke kas umum negara.", reg8),
    ("Dalam hal terjadi pergantian Bendahara Pengeluaran, perubahan spesimen tanda tangan rekening dinas di bank wajib dilengkapi:", 
     "SK Penetapan Bendahara baru oleh KPA, Surat Kuasa Pengoperasian Rekening, dan Surat Pemberitahuan ke KPPN", "KTP teman bendahara", "Surat keterangan izin dari RT setempat", "Janji setia lisan di hadapan teller", "A", 
     "Perubahan spesimen rekening dinas memerlukan SK KPA resmi dan pemutakhiran data penandatangan rekening pada database bank dan KPPN.", reg8),
    ("Bagaimanakah mekanisme pengelolaan rekening virtual (Virtual Account) pada sistem penerimaan negara instansi pemerintah?", 
     "Setiap wajib bayar/nasabah diberikan nomor VA unik yang otomatis mengidentifikasi transaksi dan memindahbukukan penerimaan ke kas negara", "VA digunakan untuk menyimpan uang pribadi pejabat", "Nomor VA diundi setiap hari Jumat", "VA tidak terhubung dengan sistem perbankan", "A", 
     "Virtual Account mengotomatiskan identifikasi setoran penerimaan secara realtime dan menyederhanakan rekonsiliasi kas pemerintah.", reg8),
    ("Berapa batas waktu satker wajib menyampaikan laporan saldo seluruh rekening dinas setiap bulannya ke KPPN melalui SPRINT?", 
     "Paling lambat tanggal 10 bulan berikutnya", "Paling lambat tanggal 25 bulan berikutnya", "Paling lambat akhir tahun", "Setiap minggu sekali", "A", 
     "PMK 182 mewajibkan pelaporan saldo bulanan seluruh rekening dinas via SPRINT paling lambat tanggal 10 bulan berikutnya.", reg8),
    ("Mengapa penempatan kas pemerintah pada bank umum dilarang dalam bentuk Deposito Berjangka oleh Satker biasa?", 
     "Karena kewenangan investasi jangka pendek dan optimalisasi kas negara merupakan monopoli BUN (Menteri Keuangan), bukan satker biasa", "Karena deposito tidak memiliki bunga", "Karena bank umum menolak uang pemerintah", "Karena deposito dilarang oleh undang-undang kesehatan", "A", 
     "Satker pengguna anggaran dilarang mendepositokan kas dinas; manajemen penempatan kas BUN adalah kewenangan eksklusif Bendahara Umum Negara.", reg8),
    ("Apa fungsi dari fitur 'Sweeping Otomatis' (Automatic Cash Sweeping) pada rekening penerimaan K/L?", 
     "Memindahkan seluruh saldo penerimaan dari bank operasional ke rekening TSA di Bank Indonesia secara terjadwal setiap sore", "Menghapus catatan korupsi", "Membagi-bagikan uang kas ke rekening staf", "Membayar tagihan listrik kantor secara otomatis", "A", 
     "Cash sweeping menjamin likuiditas kas negara terpusat di TSA Bank Indonesia setiap hari kerja untuk pencegahan idle cash perbankan.", reg8),
    ("Dalam hal satker menerima dana titipan jaminan lelang pengadaan barang, rekening yang sah untuk menampung dana tersebut adalah:", 
     "Rekening Lainnya (Penampungan Jaminan) yang telah memperoleh izin pembukaan dari KPPN", "Rekening pribadi panitia lelang", "Rekening kas kecil bendahara", "Rekening giro yayasan sosial", "A", 
     "Uang jaminan lelang adalah titipan pihak ketiga yang wajib ditempatkan pada Rekening Lainnya resmi berizin Kuasa BUN.", reg8),
    ("Apa perbedaan perlakuan bunga/jasa giro antara rekening Satker Biasa dengan rekening Satker Badan Layanan Umum (BLU)?", 
     "Satker biasa wajib menyetor bunga ke Kas Negara sebagai PNBP umum; Satker BLU mengelola pendapatan bunga sebagai pendapatan operasional BLU", "Satker biasa boleh mengambil bunganya untuk rekreasi", "Satker BLU dilarang menerima bunga bank", "Tidak ada perbedaan", "A", 
     "Fleksibilitas BLU mengizinkan pendapatan bunga rekening dinas dikelola langsung sebagai pendapatan BLU untuk pembiayaan layanan.", reg8),
    ("Bagaimanakah prosedur perizinan perpanjangan izin rekening dinas yang masa berlakunya telah berakhir?", 
     "KPA mengajukan surat permohonan perpanjangan izin rekening ke KPPN melalui SPRINT dengan melampirkan justifikasi kebutuhan berkelanjutan", "Rekening dibiarkan aktif tanpa izin", "Membuat nama rekening baru di bank swasta", "Menghubungi polisi perbankan", "A", 
     "Perpanjangan masa operasional rekening dinas wajib disetujui kembali oleh Kuasa BUN (KPPN) melalui permohonan resmi di SPRINT.", reg8),
    ("Jika bank mitra tempat pembukaan rekening dinas dicabut izin usahanya (dilikuidasi) oleh OJK, tindakan pengamanan dana negara adalah:", 
     "KPA segera berkoordinasi dengan Lembaga Penjamin Simpanan (LPS) dan KPPN untuk pengalihan dan klaim penyelamatan saldo kas negara", "Membiarkan uang kas negara hangus", "Menuntut pegawai teller bank secara pribadi", "Menyerahkan kasus ke pengadilan agama", "A", 
     "Penyelamatan kas negara pada bank likuidasi diproses melalui klaim prioritas LPS dan koordinasi intensif Kuasa BUN.", reg8),
    ("Apakah penarikan uang tunai dalam jumlah besar di bank operasional oleh Bendahara Pengeluaran memerlukan pengawalan kepolisian?", 
     "Wajib meminta pengawalan aparat kepolisian demi keselamatan jiwa bendahara dan pengamanan fisik uang negara dari ancaman perampokan", "Dilarang karena polisi sibuk", "Cukup dikawal oleh anak magang kantor", "Hanya jika bendahara merasa lapar", "A", 
     "SOP keamanan perbendaharaan mewajibkan pengawalan kepolisian untuk penarikan kas fisik bernilai besar guna mitigasi risiko kejahatan jalanan.", reg8),
    ("Dokumen yang wajib dicocokkan oleh bendahara saat melakukan rekonsiliasi kas bank bulanan adalah:", 
     "Rekening Koran Bank, Buku Pembantu Bank, dan Buku Kas Umum (BKU)", "Buku harian keluarga", "Kuitansi pembelian pulsa pribadi", "Daftar menu katering", "A", 
     "Rekonsiliasi bank membandingkan mutasi rekening koran dengan buku pembantu bank untuk mendeteksi selisih debet/kredit yang belum tercatat.", reg8),
    ("Kapan satker diperkenankan membuka Rekening Operasional dalam bentuk valuta asing (valas)?", 
     "Hanya untuk satker perwakilan luar negeri (KBRI/KJRI) atau satker yang memiliki mandat pembayaran devisa resmi dengan izin persetujuan Menteri Keuangan", "Kapan saja jika bendahara ingin menabung dollar", "Setiap kali kurs dollar naik", "Untuk membeli barang impor ilegal", "A", 
     "Rekening valas dinas hanya diizinkan untuk kebutuhan diplomatik luar negeri atau mandat perbendaharaan khusus dengan persetujuan BUN.", reg8),
    ("Apa fungsi dari Berita Acara Rekonsiliasi Rekening yang diterbitkan KPPN?", 
     "Memverifikasi keabsahan data jumlah rekening aktif, rekening pasif, dan saldo kas seluruh satker dalam wilayah kerja KPPN", "Menghukum kepala satker yang malas", "Membagikan doorprize perbankan", "Menagih uang kas ke rumah bendahara", "A", 
     "BAR Rekening memadukan basis data rekening KPPN, bank mitra, dan satker untuk memastikan tidak ada rekening dinas yang tidak terdaftar.", reg8),
    ("Dalam hal bendahara menggunakan fitur CMS Bank untuk transfer belanja, sistem autentikasi transaksi wajib menerapkan:", 
     "Hard Token / Soft Token dan verifikasi kata sandi dinamis (Two-Factor Authentication)", "Password tunggal yang ditulis di kertas meja", "Tanda tangan basah di layar HP", "Foto selfie tanpa password", "A", 
     "Keamanan CMS perbankan pemerintah disyaratkan menggunakan token kriptografi (2FA) untuk persetujuan setiap instruksi pemindahbukuan.", reg8),
    ("Apakah bunga bank/jasa giro yang disetorkan ke Kas Negara dapat ditarik kembali oleh satker sebagai uang persediaan?", 
     "Tidak dapat, bunga bank telah menjadi penerimaan umum kas negara yang dialokasikan kembali melalui mekanisme penganggaran resmi DIPA", "Boleh diambil langsung di KPPN", "Boleh ditransfer balik ke rekening kasir", "Dapat ditarik melalui ATM", "A", 
     "Pendapatan bunga giro adalah penerimaan BUN yang menyatu dalam kas umum negara dan tidak dapat diambil kembali secara sepihak oleh satker.", reg8)
]

t8_a = [
    ("Analisis Kasus Rekening Liar Satker Rumah Sakit: BPK menemukan rekening giro atas nama 'Komite Medis RS Pemerintah' di Bank Swasta Y yang menampung dana sponsorship farmasi Rp 2,5 miliar tanpa izin KPPN. Analisis konsekuensi hukum dan tindak lanjutnya adalah:", 
     "Rekening tersebut dinyatakan ilegal, seluruh dana disita dan disetorkan ke Kas Negara sebagai PNBP, rekening ditutup, dan pejabat terkait diperiksa atas dugaan gratifikasi", "Rekening disahkan secara surut tanpa sanksi", "Uang kas dibagikan ke dokter rumah sakit", "Bank swasta diberikan penghargaan", "A", 
     "Rekening dinas tanpa izin melanggar UU 1/2004; dana penampungan ilegal wajib disita ke kas negara dan pejabat diproses delik gratifikasi.", reg8),
    ("Analisis Kasus Kegagalan Cash Sweeping Harian Rekening Penerimaan Bandara: Bank operasional mitra satker terlambat melakukan sweeping kas penerimaan jasa pendaratan pesawat senilai Rp 8 miliar ke TSA Bank Indonesia selama 5 hari berturut-turut. Hak tagih yang dapat dikenakan BUN kepada bank mitra adalah:", 
     "BUN berhak mengenakan sanksi denda kompensasi bunga atas keterlambatan pelimpahan kas negara sesuai perjanjian kerja sama operasional perbankan", "BUN menutup bandara internasional", "BUN memecat direktur jenderal perhubungan", "Tidak ada hak tagih apapun", "A", 
     "Perjanjian penyaluran/penerimaan BUN mengenakan penalti denda bunga harian atas dana penerimaan negara yang mengendap (idle) di bank umum.", reg8),
    ("Analisis Kasus Pencurian Dana Rekening Dinas Melalui Pembajakan Akun CMS Perbankan: Laptop bendahara terkena malware trojan sehingga token CMS disusupi dan terjadi transfer ilegal Rp 400 juta ke rekening pihak tak dikenal. Evaluasi pertanggungjawaban hukum kas negara adalah:", 
     "Bendahara dan pejabat pemegang approver bertanggung jawab atas kelalaian pengamanan kredensial token, wajib memulihkan kerugian negara melalui TP/TGR, serta lapor siber Polri", "Bank mitra menanggung seluruh kerugian tanpa syarat", "Kerugian dihapuskan otomatis dari neraca negara", "Pegawai kantor patungan uang kas", "A", 
     "Kelalaian mengamankan kredensial token CMS menimbulkan tanggung jawab perdata/ganti rugi perbendaharaan bagi pejabat yang lalai menjaga akses perbankan.", reg8),
    ("Analisis Penerapan Treasury Single Account (TSA) terhadap Efisiensi Fiskal Makro: Mengapa sentralisasi seluruh saldo rekening pemerintah ke dalam satu sistem rekening tunggal TSA di Bank Indonesia menurunkan biaya penerbitan Surat Utang Negara (SUN)?", 
     "Mengeliminasi fenomena 'idle cash' di ribuan satker, memaksimalkan likuiditas kas BUN, dan mengurangi kebutuhan pemerintah untuk meminjam uang melalui penerbitan obligasi", "Karena BI mencetak uang rupiah baru tanpa batas", "Karena bank komersial menjadi bangkrut", "Karena semua pegawai negeri dilarang berbelanja", "A", 
     "TSA mengonsolidasi seluruh likuiditas negara secara realtime sehingga BUN mengetahui posisi kas harian secara presisi dan meminimalkan biaya utang (cost of fund).", reg8),
    ("Analisis Kasus Pemblokiran Rekening Dinas oleh Pengadilan Negeri Akibat Kasus Perdata: Rekening pengeluaran satker diblokir jurusita pengadilan karena sengketa ganti rugi tanah warga. Tindakan hukum perbendaharaan yang wajib diajukan KPA adalah:", 
     "Mengajukan perlawanan hukum (derden verzet) ke pengadilan dengan dasar Pasal 50 UU No. 1/2004 tentang Imunitas Aset/Uang Negara dari Sita Eksekusi", "Menerima pemblokiran dan membiarkan kantor tutup", "Membuka rekening baru di bank lain secara sembunyi-sembunyi", "Menyuap panitera pengadilan", "A", 
     "Pasal 50 UU 1/2004 menegaskan uang dan aset milik negara/daerah memiliki hak imunitas (kekebalan) yang tidak dapat disita oleh pengadilan.", reg8),
    ("Analisis Kasus Rekening Dormant yang Menyimpan Sisa Kas Bantuan Sosial: Rekening bantuan sosial satker memiliki sisa saldo Rp 1,2 miliar yang tidak terserap dan tidak bergerak selama 2 tahun. Prosedur penertiban rekening yang wajib dilakukan adalah:", 
     "Menutup rekening penampungan bansos dan menyetorkan seluruh sisa dana Rp 1,2 miliar ke Rekening Kas Umum Negara sebagai penerimaan pengembalian belanja", "Membagi sisa bansos ke panitia kantor", "Menggunakan uang bansos untuk merenovasi ruang kerja KPA", "Membiarkan rekening sampai uangnya habis dimakan biaya admin bank", "A", 
     "Sisa dana bansos yang tidak tersalurkan dan rekeningnya dormant wajib disetorkan kembali ke Rekening Kas Umum Negara via penutupan rekening resmi.", reg8),
    ("Analisis Mitigasi Risiko Rekening Penampungan Akhir Tahun (RPATA): Mengapa penempatan dana kontraktual yang belum selesai pada RPATA di Bank Indonesia lebih aman dibanding menempatkannya di bank swasta?", 
     "Karena RPATA di Bank Indonesia dijamin 100% bebas dari risiko likuiditas dan kebangkrutan perbankan serta terkontrol langsung dalam sistem pembukuan BUN", "Karena Bank Indonesia memberikan bunga deposito tertinggi di dunia", "Karena penyedia barang dilarang mencairkan uangnya", "Karena pegawai BI bekerja 24 jam non-stop", "A", 
     "RPATA merupakan instrumen perbendaharaan terpusat di bank sentral untuk mengamankan hak penyedia tanpa risiko gagal bayar perbankan umum.", reg8),
    ("Analisis Kasus Penggunaan Rekening Pribadi Bendahara untuk Menampung Uang Dinas Kantor: Bendahara meminta rekanan mentransfer uang sisa belanja ke rekening BCA pribadi bendahara dengan alasan mempermudah pembayaran kas kecil. Penilaian auditor Itjen atas tindakan ini adalah:", 
     "Pelanggaran fatal larangan percampuran kas dinas dan pribadi (commingling funds), berindikasi penggelapan kas negara, dan bendahara wajib dicopot seketika", "Praktik fleksibilitas yang sangat dianjurkan di era modern", "Tindakan cerdas untuk menghindari potongan pajak", "Bukan pelanggaran asalkan bendahara jujur", "A", 
     "Pencampuran uang negara ke rekening pribadi dilarang mutlak dalam regulasi perbendaharaan dan merupakan pintu masuk utama tindak pidana korupsi.", reg8),
    ("Analisis Evaluasi Efektivitas Aplikasi SPRINT dalam Mencegah Rekening Liar: Mengapa integrasi API antara aplikasi SPRINT Kemenkeu dan kantor pusat perbankan nasional menutup celah satker membuka rekening rahasia?", 
     "Bank umum secara otomatis menolak permohonan pembukaan rekening atas nama instansi pemerintah jika tidak melampirkan izin elektronik tervalidasi dari SPRINT", "Karena teller bank dilarang menerima uang tunai", "Karena nomor rekening bank di Indonesia dibatasi", "Karena satker tidak boleh memiliki nama kantor", "A", 
     "Interkoneksi perbankan-SPRINT mewajibkan validasi izin Kuasa BUN sebelum sistem core banking bank menerbitkan nomor rekening dinas baru.", reg8),
    ("Analisis Kasus Biaya Administrasi Bank yang Mengikis Saldo Rekening Pengeluaran: Rekening kas pengeluaran satker terpotong biaya administrasi bulanan Rp 25.000 sehingga timbul saldo minus kas pembantu. Penyelesaian yang tepat sesuai ketentuan adalah:", 
     "Sesuai PKS BUN, rekening dinas pemerintah dibebaskan dari biaya administrasi bank; KPA berhak meminta bank mengkreditkan kembali potongan ilegal tersebut", "Bendahara mengganti dengan uang receh pribadi", "Mencatat biaya admin sebagai beban belanja pegawai", "Menutup rekening dinas", "A", 
     "Kerjasama BUN dan bank persepsi/operasional menetapkan fasilitas zero monthly admin fee bagi seluruh rekening dinas resmi pemerintah.", reg8),
    ("Analisis Kasus Bunga Rekening Khusus Pinjaman Luar Negeri (Project Account): Rekening proyek bantuan Bank Dunia menghasilkan jasa giro Rp 150 juta. Bagaimanakah perlakuan penerimaan bunga tersebut sesuai naskah Loan Agreement?", 
     "Disetorkan ke Kas Negara atau disetor ke rekening donor tergantung klausul spesifik naskah perjanjian pinjaman/hibah luar negeri berkenaan", "Dibagikan ke konsultan asing", "Dibelikan mobil dinas baru", "Dihapus dari catatan pembukuan", "A", 
     "Perlakuan bunga pinjaman/hibah luar negeri terikat naskah Loan/Grant Agreement: dapat menjadi hak penerimaan kas negara atau dikembalikan ke donor.", reg8),
    ("Analisis Kasus Pemalsuan Surat Persetujuan Pembukaan Rekening KPPN: Staf memalsukan tanda tangan Kepala KPPN dan cap dinas untuk membuka rekening gelap di bank guna menampung dana pungutan liar. Tanggung jawab hukum bank dan staf adalah:", 
     "Staf dipidana pemalsuan dokumen negara dan korupsi; Bank dapat dijatuhi sanksi administratif perbankan karena lalai memverifikasi kode register SPRINT ke KPPN", "Bank dibebaskan dari segala tuntutan", "Staf hanya diminta meminta maaf di apel pagi", "Kasus diselesaikan secara musyawarah kekeluargaan", "A", 
     "Kelalaian perbankan dalam memverifikasi keabsahan izin rekening pemerintah melanggar ketentuan perbendaharaan dan kepatuhan anti-fraud perbankan.", reg8),
    ("Analisis Pengelolaan Kas Berlebih (Excess Cash) pada Rekening Operasional: Apa dampak negatif bagi perekonomian jika kementerian menahan kas operasional triliunan rupiah di rekening giro bank umum tanpa dibelanjakan?", 
     "Menyebabkan uang menganggur (idle cash), mengurangi likuiditas kas negara untuk program prioritas, dan menurunkan stimulus pertumbuhan ekonomi riil", "Membuat rupiah menguat secara drastis", "Membuat inflasi menjadi nol persen", "Membantu bank swasta menjadi kaya raya", "A", 
     "Penahanan kas berlebih tanpa perputaran produktif mengikis efisiensi likuiditas fiskal dan memperlambat perputaran stimulus ekonomi APBN.", reg8),
    ("Analisis Kasus Penutupan Satker Akibat Penggabungan Kementerian: Saat kementerian dibubarkan, terdapat 50 rekening dinas yang masih aktif. Rencana aksi penertiban rekening yang wajib dieksekusi Tim Likuidasi adalah:", 
     "Melakukan penutupan serentak seluruh rekening, mentransfer seluruh sisa saldo kas ke Rekening Kas Umum Negara, dan mengunggah bukti penutupan di SPRINT", "Membiarkan rekening tetap aktif untuk kenang-kenangan", "Membagi sisa uang kas ke seluruh mantan pegawai", "Mengalihkan kepemilikan rekening ke yayasan swasta", "A", 
     "Proses likuidasi mewajibkan zero out saldo kas ke BUN dan penutupan administratif seluruh rekening satker terlikuidasi pada sistem perbankan dan SPRINT.", reg8),
    ("Analisis Kasus Keterlambatan Laporan Saldo Rekening di SPRINT (Penalti Kepatuhan): Satker tidak pernah melaporkan saldo rekening selama 3 bulan berturut-turut. Sanksi perbendaharaan yang dapat dijatuhkan oleh KPPN adalah:", 
     "KPPN berwenang menerbitkan Surat Peringatan dan menangguhkan penerbitan SP2D Uang Persediaan (UP) satker sampai kewajiban pelaporan dipenuhi", "KPPN memutus aliran listrik kantor satker", "KPPN memenjarakan seluruh staf satker", "KPPN menyita gedung kantor satker", "A", 
     "Ketidakpatuhan pelaporan saldo rekening memicu sanksi administratif treasury: penundaan pencairan SPM UP/TUP satker hingga data saldo dilaporkan tertib.", reg8),
    ("Analisis Modernisasi Pengelolaan Kas Negara Menuju Realtime Treasury: Mengapa transisi menuju otomasi pelaporan saldo rekening secara realtime (host-to-host SPRINT) krusial bagi ketahanan fiskal Indonesia?", 
     "Menyediakan data posisi kas negara detik demi detik (realtime cash visibility), mempercepat perumusan kebijakan moneter-fiskal, dan mengoptimalkan return kas negara", "Karena komputer Kemenkeu membutuhkan banyak data", "Supaya staf perbendaharaan tidak perlu tidur", "Untuk memamerkan teknologi canggih ke negara lain", "A", 
     "Realtime cash visibility adalah puncak modernisasi perbendaharaan untuk memastikan tidak ada kas negara yang mengendap tanpa termonitor.", reg8)
]

add_topic(t8, reg8, t8_m, t8_s, t8_a)

with open("scripts/p3_topics1_to_8.json", "w", encoding="utf-8") as f:
    json.dump(part3_questions, f, indent=2, ensure_ascii=False)
