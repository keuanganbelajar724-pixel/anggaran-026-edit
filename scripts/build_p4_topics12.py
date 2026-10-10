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
cur_num = 1601

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
    print(f"Added {topic}, current total in this batch: {len(questions)}")

# ============================================================================
# TOPIC 12: Pengelolaan Dana Hibah & SBSN Proyek Terpadu (1601 - 1650)
# ============================================================================
reg12 = "PMK No. 99/PMK.05/2017 jo PMK No. 129/PMK.05/2020 jo PP No. 56/2011 tentang Pembiayaan Proyek Melalui SBSN"
t12 = "Pengelolaan Dana Hibah & SBSN Proyek Terpadu"

t12_items = []
# 17 MUDAH
t12_items.extend([
    ("MUDAH", "Berdasarkan PMK No. 99/PMK.05/2017, hibah pemerintah yang diterima langsung oleh Kementerian/Lembaga dalam bentuk uang wajib disahkan ke KPPN melalui dokumen:",
     "Surat Perintah Pengesahan Hibah Langsung (SP2HL)", "Surat Perintah Membayar Langsung (SPM-LS)", "Surat Perintah Pengesahan Pendapatan dan Belanja (SP3B)", "Surat Bukti Penerimaan Negara (BPN)", "A",
     "Penerimaan hibah langsung dalam bentuk uang disahkan ke KPPN menggunakan Surat Perintah Pengesahan Hibah Langsung (SP2HL) dan diterbitkan SPHL oleh KPPN."),
    ("MUDAH", "Surat Pengesahan Hibah Langsung (SPHL) yang diterbitkan oleh KPPN berfungsi sebagai dokumen:",
     "Pengesahan pembukuan penerimaan pendapatan hibah dan/atau belanja hibah ke dalam sistem akuntansi pemerintah pusat", "Bukti pencairan uang tunai dari kas negara ke kas bank komersial", "Surat teguran kepada pemberi hibah karena terlambat menyetor dana", "Izin pembukaan kantor perwakilan donor di Indonesia", "A",
     "SPHL berfungsi mencatat pendapatan hibah dan belanja hibah ke dalam pembukuan LKPP tanpa adanya transfer fisik kas dari Kas Negara."),
    ("MUDAH", "Surat Berharga Syariah Negara (SBSN) Proyek diterbitkan oleh pemerintah pusat bertujuan khusus untuk:",
     "Membiayai proyek pembangunan infrastruktur prioritas nasional pada Kementerian/Lembaga", "Membayar gaji ke-13 dan THR seluruh ASN", "Menambal defisit APBD pemerintah daerah tertinggal", "Membeli obligasi korporasi swasta di bursa efek", "A",
     "SBSN Proyek (Project Financing Sukuk) diterbitkan untuk membiayai proyek infrastruktur fisik spesifik kementerian/lembaga yang dialokasikan dalam APBN."),
    ("MUDAH", "Berdasarkan PP No. 10/2011, hibah yang bersumber dari luar negeri dapat berasal dari:",
     "Negara asing, lembaga multilateral, lembaga keuangan asing, dan lembaga non-pemerintah asing", "Hanya dari bank sentral Amerika Serikat (The Fed)", "Hanya dari perkumpulan diaspora Indonesia di luar negeri", "Perusahaan swasta nasional yang memiliki cabang di luar negeri", "A",
     "Hibah luar negeri dapat bersumber dari negara donor (bilateral), lembaga multilateral (World Bank, ADB, IsDB), atau lembaga internasional resmi."),
    ("MUDAH", "Dalam pengelolaan SBSN Proyek, dokumen perencanaan awal proyek infrastruktur yang diajukan ke Bappenas dan Kemenkeu dinamakan:",
     "Daftar Rencana Proyek SBSN (DRP-SBSN)", "DIPA Petikan Induk Satker Daerah", "Rencana Penarikan Dana Harian Darurat", "Surat Keterangan Bebas Bea Cukai", "A",
     "K/L mengusulkan proyek prioritas ke dalam Daftar Rencana Proyek SBSN (DRP-SBSN) sebelum ditetapkan dalam DIPA alokasi pembiayaan SBSN."),
    ("MUDAH", "Penerimaan hibah dalam bentuk barang atau jasa (in-kind) disahkan ke KPPN menggunakan dokumen:",
     "Surat Perintah Pengesahan Pendapatan dan Belanja Hibah Bentuk Barang/Jasa/Surat Berharga (SP3HL-BJS)", "SPM Uang Persediaan (SPM-UP)", "Surat Permintaan Pembayaran Langsung (SPP-LS)", "Faktur Pajak Standar Pembelian Barang", "A",
     "Hibah bentuk barang, jasa, atau surat berharga dilaporkan dan disahkan melalui SP3HL-BJS ke KPPN mitra kerja untuk diterbitkan LP3HL-BJS."),
    ("MUDAH", "Sebelum menerima hibah langsung berupa uang, Kementerian/Lembaga wajib mengajukan permohonan pembukaan Rekening Hibah kepada:",
     "Kuasa BUN Pusat / Ditjen Perbendaharaan (melalui KPPN/KPPN Khusus)", "Pimpinan Dewan Perwakilan Rakyat (DPR)", "Badan Pemeriksa Keuangan (BPK)", "Gubernur Bank Indonesia secara pribadi", "A",
     "Pembukaan rekening pemerintah termasuk rekening penampungan hibah langsung wajib mendapat persetujuan tertulis dari Kuasa BUN (Kemenkeu DJPb)."),
    ("MUDAH", "Aset fisik infrastruktur yang dibangun menggunakan pembiayaan SBSN Proyek secara hukum berstatus sebagai:",
     "Barang Milik Negara (BMN) dan dapat menjadi underlying asset penerbitan sukuk", "Milik swasta rekanan pemenang tender", "Milik investor pemegang sertifikat sukuk secara mutlak", "Milik pemerintah daerah tempat infrastruktur berdiri", "A",
     "Proyek SBSN menghasilkan BMN yang dicatat dalam neraca pemerintah dan sekaligus berfungsi sebagai underlying asset penerbitan SBSN."),
    ("MUDAH", "Prinsip dasar penerimaan hibah oleh Pemerintah Republik Indonesia menurut peraturan perundangan adalah:",
     "Tidak mengikat, tidak merugikan kedaulatan NKRI, dan mendukung program pembangunan nasional", "Wajib disertai konsesi politik dan pemberian izin tambang kepada donor", "Harus disimpan di rekening pribadi Menteri penerima hibah", "Boleh digunakan secara bebas tanpa perlu dicatat dalam APBN", "A",
     "Hibah pemerintah tidak boleh mengikat secara politis, tidak boleh mengurangi kedaulatan, dan wajib dicatat secara transparan dalam APBN."),
    ("MUDAH", "Mekanisme penarikan dana SBSN Proyek dari Rekening Khusus SBSN ke rekening penyedia barang/jasa dilakukan melalui penerbitan:",
     "SPM-LS SBSN yang diajukan satker ke KPPN Khusus / KPPN mitra kerja", "Pengambilan tunai menggunakan cek kasir giro kantor pos", "Transfer antar dompet digital bendahara pengeluaran", "Nota debet manual tanpa dokumen pendukung", "A",
     "Pencairan dana SBSN proyek ke kontraktor dilakukan melalui penerbitan SPM-LS SBSN satker ke KPPN berdasarkan prestasi pekerjaan fisik terverifikasi."),
    ("MUDAH", "Lembaga penjamin atau wali amanat dalam penerbitan Surat Berharga Syariah Negara dipegang oleh:",
     "Perusahaan Penerbit SBSN Indonesia (PP SBSN) yang dibentuk berdasarkan UU SBSN", "Konsorsium asuransi swasta multinasional", "Kamar Dagang dan Industri (KADIN)", "Otoritas Jasa Keuangan secara independen", "A",
     "Pemerintah mendirikan Perusahaan Penerbit SBSN Indonesia sebagai Special Purpose Vehicle (SPV) berbadan hukum untuk menerbitkan sukuk negara."),
    ("MUDAH", "Perjanjian Hibah antara Pemerintah Indonesia dan Donor Asing dituangkan dalam dokumen resmi bernama:",
     "Grant Agreement (Naskah Perjanjian Hibah)", "Surat Perintah Kerja (SPK)", "Memorandum of Purchase (MoP)", "Kwitansi Tanda Terima Sementara", "A",
     "Pemberian hibah mengikat secara hukum melalui Grant Agreement / Naskah Perjanjian Hibah (NPH) bilateral atau multilateral."),
    ("MUDAH", "Register Hibah yang diterbitkan oleh Ditjen Pengelolaan Pembiayaan dan Risiko (DJPPR) berfungsi untuk:",
     "Memberikan identitas nomor registrasi sah pinjaman/hibah dalam sistem administrasi utang dan hibah negara", "Membatalkan seluruh klausul perjanjian bantuan luar negeri", "Membebaskan penerima hibah dari kewajiban membuat laporan keuangan", "Mengalihkan dana hibah ke rekening tabungan sukarela", "A",
     "Nomor Register Hibah dari DJPPR adalah syarat mutlak pembukaan rekening hibah dan pengesahan SP2HL di KPPN."),
    ("MUDAH", "Monitoring proyek infrastruktur yang dibiayai SBSN dilaksanakan secara berkala oleh DJPPR dan DJPb untuk memastikan:",
     "Kesesuaian progres fisik di lapangan dengan realisasi penyerapan dana sukuk", "Kenaikan harga saham kontraktor pelaksana di bursa efek", "Kecepatan kontraktor membagikan dividen proyek", "Jumlah keuntungan bunga bank yang dapat dinikmati satker", "A",
     "Pemantauan on-site dan sistem monitoring SBSN memastikan ketepatan waktu penyelesaian fisik serta kepatuhan realisasi keuangan proyek."),
    ("MUDAH", "Bunga atau imbalan yang dibayarkan pemerintah kepada investor pemegang SBSN Proyek bersumber dari alokasi:",
     "Belanja Bunga Utang pada Bagian Anggaran Bendahara Umum Negara (BA-BUN)", "Uang saku harian para pegawai di satker pelaksana", "Pemotongan honorarium guru dan dosen", "Dana simpanan abadi bencana alam daerah", "A",
     "Kewajiban imbalan sukuk negara dialokasikan dan dibayar melalui DIPA BA-BUN Pengelolaan Utang Negara."),
    ("MUDAH", "Satker penerima hibah langsung wajib merevisi DIPA satker ke Kanwil DJPb apabila:",
     "Belanja yang bersumber dari hibah langsung belum tertampung dalam pagu DIPA berjalan", "Nilai hibah kurang dari Rp 100.000", "Donor meminta penambahan waktu jam kerja kantor", "Semua pegawai satker telah setuju secara aklamasi", "A",
     "Agar belanja hibah memiliki dasar hukum pengeluaran negara, pagu belanja hibah harus dituangkan dalam DIPA melalui mekanisme revisi anggaran."),
    ("MUDAH", "Sisa saldo dana hibah terikat (earmarked) yang masih ada di rekening penampungan setelah proyek selesai wajib:",
     "Dikembalikan kepada donor atau disetor ke kas negara sesuai klausul Naskah Perjanjian Hibah", "Dibagikan merata sebagai bonus prestasi pegawai satker", "Disimpan diam-diam untuk biaya rekreasi kantor akhir tahun", "Ditransfer ke rekening pribadi pimpinan proyek", "A",
     "Perlakuan sisa dana hibah wajib mengikuti NPH; jika donor meminta pengembalian maka direstitusi, jika tidak maka disetor ke Kas Negara sebagai PNBP.")
])

# 17 SEDANG
t12_items.extend([
    ("SEDANG", "Apabila Satker menerima hibah langsung berupa uang pada bulan Maret namun baru mengajukan pengesahan SP2HL ke KPPN pada bulan November, dampak administratif dan akuntansinya adalah:",
     "Terjadi keterlambatan pencatatan realisasi pendapatan dan belanja pada LRA periode berjalan sehingga LK K/L tidak menyajikan posisi kas hibah secara riil", "KPPN otomatis membatalkan seluruh dana hibah yang telah dibelanjakan", "Donor asing akan dikenai denda keterlambatan oleh KPPN", "Satker wajib mengganti uang hibah dengan uang pribadi bendahara", "A",
     "Keterlambatan pengesahan SP2HL mengakibatkan saldo kas di bendahara pengeluaran/rekening hibah tidak terlaporkan dalam LK K/L triwulanan."),
    ("SEDANG", "Dalam skema SBSN Proyek, jika kontraktor mengalami deviasi minus progres fisik lebih dari 10% (kontrak kritis), langkah mitigasi Kuasa Pengguna Anggaran (KPA) adalah:",
     "Menerbitkan Surat Peringatan (SCM - Show Cause Meeting) dan menyusun uji coba pembuktian percepatan pekerjaan (Show Cause Meeting I/II/III)", "Langsung membayar lunas sisa kontrak sebelum tahun anggaran berakhir", "Menyetujui perpanjangan kontrak tanpa evaluasi teknis konsultan pengawas", "Membiarkan kontraktor mangkrak karena dana SBSN aman di kas negara", "A",
     "Penanganan kontrak kritis pada proyek infrastruktur SBSN wajib melalui mekanisme SCM untuk membuktikan komitmen kapasitas kontraktor."),
    ("SEDANG", "Perbedaan utama perlakuan akuntansi antara Hibah Terencana (Planned Grant) dan Hibah Langsung (Direct Grant) adalah:",
     "Hibah terencana dituangkan sejak awal dalam DIPA sebelum TA berjalan dan ditarik via KPPN, sedangkan hibah langsung diterima satker tanpa melalui Kas Negara dan disahkan kemudian", "Hibah terencana tidak perlu diaudit BPK sedangkan hibah langsung wajib diaudit BPK", "Hibah terencana hanya berupa barang sedangkan hibah langsung selalu berupa uang tunai", "Hibah terencana dibiayai dari pinjaman perbankan lokal sedangkan hibah langsung bebas syarat", "A",
     "Hibah terencana dicairkan melalui mekanisme APBN biasa (KPPN), sedangkan hibah langsung diterima langsung di rekening satker lalu disahkan (SP2HL)."),
    ("SEDANG", "Mekanisme Luncuran SBSN Proyek (Lanjutan Pelaksanaan Proyek SBSN ke Tahun Anggaran Berikutnya) diatur dengan ketentuan:",
     "Diberikan persetujuan oleh Menteri Keuangan cq Dirjen Anggaran/DJPPR berdasarkan evaluasi progres fisik minimum dan sisa dana dialokasikan kembali pada DIPA TA berikutnya", "Dapat diputuskan sendiri oleh PPK cukup dengan membuat nota dinas internal", "Hanya berlaku untuk proyek yang progres fisiknya masih di bawah 5%", "Mengharuskan satker meminjam uang ke bank swasta untuk menalangi sisa proyek", "A",
     "Luncuran SBSN memerlukan persetujuan Menteri Keuangan dengan menuangkan kembali sisa dana pagu proyek pada DIPA tahun anggaran berikutnya."),
    ("SEDANG", "Pada proyek pembangunan gedung balai latihan kerja yang didanai SBSN, konsultan manajemen konstruksi (MK) memiliki peran penting dalam:",
     "Memverifikasi keabsahan progres fisik mingguan/bulanan sebagai dasar PPK menerbitkan SPP-LS SBSN", "Menandatangani SP2D atas nama Kepala KPPN", "Mengelola rekening giro operasional proyek di bank", "Menjual sertifikat sukuk kepada investor ritel di mall", "A",
     "Sertifikat pembayaran bulanan (MC - Monthly Certificate) diverifikasi oleh konsultan pengawas/MK sebelum PPK memproses pembayaran SPP-LS."),
    ("SEDANG", "Dalam pengelolaan hibah luar negeri, istilah 'No Objection Letter' (NOL) dari donor memiliki arti hukum:",
     "Surat persetujuan resmi dari pihak donor atas tahapan proses pengadaan atau dokumen kontrak sebelum kontrak ditandatangani", "Surat penolakan donor untuk mentransfer sisa komitmen dana bantuan", "Pernyataan bebas pajak dari Direktorat Jenderal Pajak untuk konsultan asing", "Surat izin bepergian ke luar negeri bagi tim pengelola hibah satker", "A",
     "NOL merupakan prasyarat kontraktual dalam pedoman pengadaan donor multilateral/bilateral untuk menjamin kepatuhan prosedur pengadaan."),
    ("SEDANG", "Ketentuan pembukaan rekening penampungan dana hibah langsung bentuk uang di bank umum menyatakan bahwa:",
     "Rekening atas nama jabatan satuan kerja dan saldo giro hibah wajib dimasukkan ke dalam sistem Treasury Single Account (TSA) melalui mekanisme sweep/pelaporan", "Rekening harus diatasnamakan pribadi bendahara pengeluaran agar fleksibel", "Satker boleh membuka rekening di luar negeri tanpa izin Menteri Keuangan", "Rekening hibah tidak boleh dikenakan biaya administrasi maupun bunga bank", "A",
     "Rekening hibah dibuka atas nama jabatan satker dengan izin Kuasa BUN dan saldo bunganya disetor ke Kas Negara sebagai PNBP kecuali diperjanjikan lain."),
    ("SEDANG", "Apabila pekerjaan SBSN Proyek telah selesai 100% dan masa pemeliharaan (warranty period) berlangsung selama 6 bulan, jaminan pemeliharaan yang diserahkan kontraktor bernilai:",
     "5% dari nilai kontrak kerja konstruksi dalam bentuk Bank Garansi atau Surety Bond", "50% dari nilai laba bersih perusahaan kontraktor", "100% dari total nilai kontrak proyek fisik", "Gratis tanpa jaminan karena proyek pemerintah", "A",
     "Jaminan pemeliharaan konstruksi sebesar 5% dari nilai kontrak diserahkan saat Serah Terima Pertama (PHO) sebelum uang retensi dicairkan."),
    ("SEDANG", "Pencatatan pendapatan hibah langsung bentuk barang yang diterima dari Kedutaan Besar Jepang oleh Satker Balai Arkeologi dijurnal dengan akun:",
     "Pendapatan Hibah Luar Negeri Langsung Bentuk Barang (kredit) dan Aset Tetap/Persediaan (debet)", "Belanja Modal Fisik (kredit) dan Utang Luar Negeri (debet)", "Penerimaan Pembiayaan Utang (kredit) dan Kas di Bendahara (debet)", "Beban Penyusutan Aset (kredit) dan Piutang Lancar (debet)", "A",
     "Pengesahan barang hibah membukukan Aset Tetap/Persediaan di sisi debet dan Pendapatan Hibah Langsung Bentuk Barang di sisi kredit."),
    ("SEDANG", "Klausul 'Counterpart Fund' (Dana Pendamping) dalam perjanjian hibah atau pinjaman luar negeri berarti:",
     "Kewajiban Pemerintah Indonesia mengalokasikan porsi anggaran rupiah murni pendamping dalam APBN untuk mendukung operasional proyek", "Kewajiban donor menduplikasi jumlah bantuan jika target pembangunan tercapai", "Larangan bagi satker menerima dana dari sumber lain selain donor tunggal", "Dana cadangan devisa Bank Indonesia yang dibekukan di bank internasional", "A",
     "Dana pendamping (counterpart fund / Rupiah Pendamping) merupakan kontribusi pemerintah mitra yang dialokasikan dalam APBN/DIPA satker."),
    ("SEDANG", "Jika dalam perjanjian hibah disyaratkan pembentukan Rekening Khusus (Special Account), penatausahaan rekening tersebut tunduk pada:",
     "Ketentuan pedoman donor yang diselaraskan dengan regulasi pengelolaan rekening pemerintah di bawah pengawasan Kuasa BUN Pusat", "Hukum adat setempat tempat lokasi proyek hibah berada", "Peraturan internal kantor konsultan pemenang tender manajemen proyek", "Kebebasan bendahara pengeluaran tanpa intervensi pemerintah", "A",
     "Rekening khusus dikelola sesuai MoU/NPH dengan tetap memenuhi regulasi Kuasa BUN atas rekening pemerintah."),
    ("SEDANG", "Dokumen SP2HL yang ditolak oleh KPPN saat pengajuan verifikasi biasanya disebabkan oleh kesalahan teknis:",
     "Nomor Register Hibah tidak cocok dengan database DJPPR, atau pagu DIPA hibah belum mencukupi untuk mengesahkan belanja", "KPPN kehabisan uang tunai di brankas kas daerah", "Pemberi hibah belum menyerahkan foto profil seluruh staf kementerian", "Surat pengantar tidak ditandatangani oleh seluruh pegawai satker", "A",
     "Penolakan SP2HL umumnya terjadi karena ketidakcocokan Register Hibah DJPPR, DIPA revisi hibah belum terbit, atau kesalahan format pengesahan."),
    ("SEDANG", "Pada SBSN Proyek, pembiayaan pengadaan tanah untuk lokasi infrastruktur umumnya dibebankan pada:",
     "Anggaran Rupiah Murni Satker / LMAN (Lembaga Manajemen Aset Negara), bukan dari dana penerbitan SBSN", "Dana penerbitan SBSN Proyek secara menyeluruh", "Sumbangan sukarela masyarakat sekitar lokasi proyek", "Giro kas kecil bendahara penerimaan kantor desa", "A",
     "Penyediaan tanah 'clean and clear' merupakan komitmen awal K/L (sering via APBN Rupiah Murni atau LMAN) sebelum proyek fisik SBSN dimulai."),
    ("SEDANG", "Evaluasi efisiensi pengadaan proyek SBSN yang menghasilkan sisa lelang (efisiensi anggaran lelang) menghasilkan kebijakan:",
     "Sisa dana tender SBSN Proyek tidak dapat digunakan secara otomatis untuk paket pekerjaan baru kecuali atas izin optimalisasi Menteri Keuangan", "Sisa tender langsung dibagikan kepada anggota panitia lelang satker", "Sisa tender hangus dan langsung diserahkan kepada kontraktor penawar terendah", "Satker wajib menghabiskan sisa tender untuk pesta peresmian gedung", "A",
     "Efisiensi tender SBSN Proyek dikembalikan ke Kas Negara atau dioptimalisasikan pada proyek SBSN lain setelah mendapat izin tertulis Menteri Keuangan."),
    ("SEDANG", "Kewajiban perpajakan atas penerimaan hibah luar negeri yang diatur dalam perjanjian internasional adalah:",
     "Diberikan fasilitas pembebasan bea masuk dan/atau Pajak Dalam Rangka Impor (PDRI) sesuai ketentuan Surat Keterangan Bebas (SKB)", "Wajib dikenakan tarif pajak penghasilan berganda maksimal 50%", "Semua barang hibah otomatis disita Bea Cukai untuk dilelang", "Pajak ditagihkan kepada warga sekitar penerima bantuan hibah", "A",
     "Barang impor bantuan hibah pemerintah luar negeri dapat memperoleh fasilitas pembebasan bea masuk dan PPN/PPh impor dengan rekomendasi Kemenkeu."),
    ("SEDANG", "Dalam aplikasi SAKTI, modul yang digunakan untuk merekam Berita Acara Serah Terima (BAST) hibah barang/jasa sebelum pengesahan adalah:",
     "Modul Komitmen dan Modul Aset Tetap/Persediaan", "Modul Pembayaran SP2D Kasir", "Modul Piutang dan Modul Pelaporan Manual", "Modul Kas Harian Bendahara Pengeluaran", "A",
     "Perekaman BAST hibah BJS dilakukan pada Modul Komitmen dan diintegrasikan ke Modul Aset/Persediaan sebelum diajukan SP3HL-BJS."),
    ("SEDANG", "Laporan triwulanan pelaksanaan proyek SBSN yang disampaikan KPA kepada Menteri Keuangan sekurang-kurangnya memuat informasi:",
     "Perkembangan realisasi fisik konstruksi, realisasi penyerapan dana sukuk, permasalahan kendala lapangan, dan rencana aksi tindak lanjut", "Daftar menu makanan katering rapat pekerja harian", "Jumlah followers media sosial kontraktor pelaksana", "Nama seluruh keluarga staf perencana balai teknis", "A",
     "Laporan pemantauan triwulanan SBSN Proyek memuat capaian fisik, serapan anggaran, hambatan teknis, dan rencana akselerasi penyelesaian.")
])

# 16 ANALISIS
t12_items.extend([
    ("ANALISIS", "Analisis Kasus Keterlambatan Pengesahan Hibah Luar Negeri Lintas Tahun: Satker menerima hibah uang tunai Rp 2 miliar pada November TA 2025 dan membelanjakannya untuk renovasi laboratorium tanpa merevisi DIPA dan tanpa SP2HL hingga TA 2026. Analisis temuan BPK dan solusi akuntansinya adalah:",
     "Merupakan pelanggaran asas universalitas APBN; satker wajib menyusun Laporan Keuangan Koreksi, mengajukan DIPA Pengesahan Hibah Lanjutan ke Kanwil DJPb, dan menerbitkan SP2HL Pengesahan Lintas Tahun", "Cukup membuat surat pernyataan damai dengan auditor BPK tanpa perlu mencatat uang Rp 2 miliar", "Uang Rp 2 miliar dianggap hilang dan dihapusbukukan tanpa pertanggungjawaban", "Laboratorium harus dihancurkan kembali agar pembukuan neraca seimbang", "A",
     "Penerimaan dan belanja hibah tanpa DIPA/SP2HL menjadi temuan material ketidakpatuhan; solusinya adalah revisi DIPA pengesahan hibah susulan dan pembukuan penyesuaian."),
    ("ANALISIS", "Analisis Kasus Kontraktor SBSN Proyek Mengalami Pailit Menjelang Batas Akhir Kontrak: Kontraktor proyek jembatan SBSN senilai Rp 100 miliar diputus pailit oleh pengadilan saat progres fisik mencapai 70%. Tindakan mitigasi hukum dan perbendaharaan yang wajib diambil KPA adalah:",
     "Memutus kontrak sepihak, mencairkan Jaminan Pelaksanaan ke kas negara, mengamankan aset lokasi proyek, dan mengajukan luncuran/tender ulang sisa pekerjaan 30% sesuai PMK SBSN", "Menyerahkan kelanjutan jembatan kepada kurator kepailitan kontraktor untuk dijual lelang", "Membayar lunas sisa 30% uang proyek kepada keluarga direktur kontraktor", "Menyuruh pekerja buruh melanjutkan proyek tanpa kontrak dan tanpa pengawasan", "A",
     "KPA wajib memutus kontrak, menyita Jaminan Pelaksanaan, menginventarisasi hasil pekerjaan 70%, dan mengusulkan tender ulang sisa pekerjaan via revisi pembiayaan SBSN."),
    ("ANALISIS", "Analisis Risiko Fluktuasi Nilai Tukar Valuta Asing pada Hibah Uang dalam Mata Uang USD: Satker menerima hibah langsung sebesar USD 500,000 di rekening hibah bank umum. Saat penarikan untuk belanja lokal dalam rupiah terjadi selisih kurs. Perlakuan akuntansi atas keuntungan/kerugian selisih kurs tersebut adalah:",
     "Dicatat sebagai Keuntungan/Kerugian Selisih Kurs Valuta Asing pada Laporan Operasional (LO) sesuai Standar Akuntansi Pemerintahan (SAP)", "Disembunyikan di rekening tabungan pribadi staf bagian keuangan", "Dijadikan uang tips tambahan bagi teller bank devisa", "Dihilangkan dari catatan bank agar saldo buku tetap USD 500,000", "A",
     "Berdasarkan SAP PP 71/2010, transaksi valuta asing dijurnal menggunakan kurs transaksi dan selisih kurs saat realisasi diakui dalam Laporan Operasional."),
    ("ANALISIS", "Analisis Kasus Perbedaan Spesifikasi Barang Hibah Donor dengan Standar BMN Nasional: Satker Litbang menerima hibah alat uji sensorik dari institusi Jerman yang tegangan listriknya 110V dan membutuhkan bahan bakar khusus yang dilarang di Indonesia. Keputusan manajerial yang tepat sebelum menandatangani BAST hibah adalah:",
     "Melakukan uji kelayakan teknis dan meminta donor menyertakan trafo konverter daya serta komitmen pasokan consumable resmi yang legal, atau menolak hibah jika membahayakan keselamatan", "Langsung menandatangani BAST agar donor senang meskipun alat tidak pernah dapat digunakan", "Menjual alat sensorik ke tukang rongsokan pasar loak untuk uang kas kantor", "Membiarkan alat disimpan di gudang sampai hancur berkarat tanpa dicatat", "A",
     "Penerimaan BMN hibah wajib mempertimbangkan manfaat ekonomis, kompatibilitas infrastruktur pendukung, dan aspek keselamatan nasional."),
    ("ANALISIS", "Analisis Kasus Optimalisasi Dana Sisa SBSN Proyek: Setelah tender proyek gedung perpustakaan SBSN selesai, terdapat efisiensi sisa tender sebesar Rp 15 miliar dari pagu Rp 80 miliar. KPA ingin menggunakan Rp 15 miliar untuk menambah mebeler dan laboratorium komputer. Prosedur perbendaharaan yang wajib dilalui adalah:",
     "Mengajukan usulan optimalisasi SBSN kepada Kementerian Keuangan (DJPPR & DJA) dengan persetujuan Bappenas sebelum menerbitkan revisi DIPA", "Langsung menunjuk rekanan mebeler tanpa persetujuan pihak manapun", "Membagikan Rp 15 miliar kepada dosen dan mahasiswa perpustakaan", "Menyimpan Rp 15 miliar di deposito bank atas nama rektor", "A",
     "Pemanfaatan sisa dana lelang SBSN untuk pekerjaan penunjang (optimalisasi) wajib mendapat izin Menteri Keuangan dan Bappenas."),
    ("ANALISIS", "Analisis Kasus Bencana Alam yang Mengakibatkan Kerusakan Konstruksi SBSN Sedang Berjalan: Gempa bumi berkekuatan 7 SR meruntuhkan sebagian struktur gedung kuliah SBSN yang sedang dibangun (kondisi Force Majeure). Tanggung jawab perbaikan dan pembiayaannya adalah:",
     "Klaim asuransi konstruksi (CAR - Contractor's All Risks) menanggung perbaikan kerusakan fisik, dan KPA menyusun Berita Acara Keadaan Kahar untuk penyesuaian jadwal pelaksanaan", "Kontraktor wajib menanggung seluruh kerugian dengan harta pribadi tanpa asuransi", "Proyek dihentikan total dan uang yang sudah dicairkan dituntut kembali dari kontraktor", "Pegawai satker wajib patungan gaji bulanan untuk membangun gedung kembali", "A",
     "Proyek infrastruktur strategis SBSN dipersyaratkan memiliki asuransi konstruksi (CAR) untuk memitigasi risiko finansial bencana kahar."),
    ("ANALISIS", "Analisis Kasus Hibah Langsung Berupa Saham Perusahaan Go-Public: Kementerian BUMN menerima hibah saham korporasi dari yayasan filantropi luar negeri. Mengapa penatausahaan hibah surat berharga ini tidak dapat disahkan melalui SP2HL biasa?",
     "Karena surat berharga memiliki mekanisme valuasi pasar wajar, hak dividen, dan penitipan efek kustodian yang wajib disahkan via instrumen SP3HL-BJS dan dikelola DJKN/DJPPR", "Karena saham dilarang dimiliki oleh lembaga pemerintah Republik Indonesia", "Karena saham harus langsung dicairkan menjadi uang kertas tunai di pasar gelap", "Karena KPPN menolak segala bentuk investasi non-tunai", "A",
     "Pengesahan hibah surat berharga diatur melalui SP3HL-BJS dan penatausahaan hak kepemilikan modal negara dikoordinasikan dengan DJKN."),
    ("ANALISIS", "Analisis Perbedaan Resiko Fiskal antara Pinjaman Luar Negeri (Loan) dan Hibah Luar Negeri (Grant): Mengapa Kementerian Keuangan mendorong K/L memprioritaskan hibah daripada pinjaman komersial luar negeri?",
     "Karena hibah tidak menimbulkan kewajiban pembayaran kembali pokok dan bunga di masa depan sehingga tidak menambah beban rasio utang pemerintah terhadap PDB", "Karena hibah tidak memerlukan laporan pertanggungjawaban apapun", "Karena pinjaman luar negeri selalu membawa sanksi boikot ekonomi", "Karena proses penarikan hibah tidak memerlukan pemeriksaan BPK", "A",
     "Hibah merupakan penerimaan tanpa kewajiban pengembalian, menjaga kesinambungan fiskal jangka panjang dibanding pinjaman utang luar negeri."),
    ("ANALISIS", "Analisis Kasus Perselisihan Pembayaran Retensi SBSN Proyek: Kontraktor menuntut pencairan uang retensi 5% setelah masa pemeliharaan selesai, namun KPA menemukan retakan dinding yang belum diperbaiki. Sikap yuridis yang sah bagi KPA/PPK adalah:",
     "Menolak pencairan retensi / mencairkan Bank Garansi pemeliharaan untuk membiayai perbaikan cacat mutu oleh pihak ketiga jika kontraktor wanprestasi", "Segera mencairkan uang retensi agar kontraktor tidak marah di media", "Menuntut kontraktor dengan pidana penjara seumur hidup tanpa surat peringatan", "Menyuruh mahasiswa memperbaiki retakan dinding secara gotong royong", "A",
     "Jaminan pemeliharaan/retensi berfungsi menjamin pemulihan cacat mutu; PPK berhak menahan retensi atau mencairkan garansi bank untuk memperbaiki kerusakan."),
    ("ANALISIS", "Analisis Dampak Pembatalan Komitmen Hibah Luar Negeri secara Sepihak oleh Donor (Donor Default): Donor menghentikan program hibah air bersih di tengah jalan karena pergantian rezim politik di negara asalnya. Langkah mitigasi strategis K/L dan DJPPR adalah:",
     "Mengevaluasi sisa pekerjaan krusial dan mengusulkan alokasi dana talangan Rupiah Murni dalam revisi DIPA agar infrastruktur dasar air bersih tidak terbengkalai", "Menuntut perang militer terhadap negara donor di pengadilan internasional", "Menjual seluruh pipa air yang telah dipasang kepada masyarakat", "Menutup mata dan membiarkan sumur air terbengkalai tanpa koordinasi", "A",
     "Pemerintah menjaga kesinambungan layanan publik vital dengan menutup celah pembiayaan yang ditinggalkan donor melalui pembiayaan APBN alternatif."),
    ("ANALISIS", "Analisis Kasus Bunga Rekening Penampungan Dana Hibah yang Digunakan untuk Operasional Satker: Bendahara menggunakan bunga bank atas saldo hibah sebesar Rp 45 juta untuk membeli tiket pesawat pimpinan satker. Temuan pemeriksa dan perbaikan regulasinya adalah:",
     "Penggunaan langsung bunga rekening pemerintah melanggar UU Keuangan Negara; bunga bank wajib disetor ke kas negara sebagai PNBP kecuali diizinkan eksplisit dalam NPH", "Tindakan bendahara sah karena bunga bank adalah hak mutlak kantor satker", "Bunga bank seharusnya disumbangkan ke yayasan panti asuhan tanpa kuitansi", "Pimpinan satker berhak membagikan bunga bank kepada keluarga", "A",
     "Bunga atas rekening pemerintah berstatus uang negara yang wajib disetor ke Kas Negara sebagai PNBP BUN, dilarang digunakan langsung."),
    ("ANALISIS", "Analisis Skema Multi-Tranche pada Penarikan SBSN Proyek: Mengapa pencairan dana SBSN proyek bertahap (multi-tranche) berbasis MC lebih aman dibanding uang muka 100%?",
     "Mencegah risiko moral hazard kontraktor membawa lari kas negara dan memastikan negara hanya membayar hasil pekerjaan fisik yang nyata-nyata telah terverifikasi", "Membuat kontraktor kesulitan kas sehingga proyek terlambat selesai", "Menambah keuntungan suku bunga bagi bank umum penyalur dana", "Mempersulit tugas staf administrasi KPPN dan PPK", "A",
     "Sistem pembayaran bertahap berbasis prestasi kerja riil melindungi keuangan negara dari risiko wanprestasi dan hilangnya likuiditas publik."),
    ("ANALISIS", "Analisis Keterlambatan Serah Terima BMN SBSN Proyek kepada Pengguna Akhir (End-User): Balai Kementerian PUPR membangun gedung asrama haji SBSN dan telah selesai, namun lambat diserahterimakan kepada Kemenag selama 2 tahun sehingga gedung terbengkalai. Dampak hukum dan tata kelolanya adalah:",
     "Terjadi inefisiensi pemanfaatan aset negara, potensi penurunan nilai fisik BMN, dan ketidakpastian unit pengelola operasional pemeliharaan aset", "Gedung asrama otomatis menjadi milik pribadi kepala balai PUPR", "Kemenag berhak menuntut ganti rugi uang sewa gedung kepada PUPR", "Gedung harus dirobohkan kembali karena tidak ada yang mengurus", "A",
     "Aset BMN SBSN wajib segera dialihkan/diserahterimakan status penggunaannya kepada K/L pengguna akhir agar terpelihara dan memberikan manfaat publik."),
    ("ANALISIS", "Analisis Pengendalian Mutu Proyek SBSN Melalui Forensic Engineering: Dalam proyek jembatan SBSN yang retak sebelum diresmikan, peran audit teknis teknik sipil independen bagi Kuasa BUN adalah:",
     "Menentukan apakah kegagalan struktur diakibatkan oleh kelalaian desain konsultan atau pengurangan material oleh kontraktor untuk penetapan tuntutan ganti rugi kerugian negara", "Menentukan siapa artis yang boleh menyanyi saat peresmian jembatan", "Mengusulkan kenaikan tarif tol jembatan kepada masyarakat", "Menghentikan seluruh aktivitas penerbitan sukuk di pasar modal", "A",
     "Audit forensik engineering memberikan bukti ilmiah independen atas kegagalan bangunan guna penetapan tanggung jawab ganti rugi para pihak."),
    ("ANALISIS", "Analisis Kasus Hibah Barang Berupa Mobil Patroli dari Perusahaan Swasta Tanpa Naskah Hibah Resmi: Perusahaan tambang menyerahkan 5 unit mobil patroli kepada Polres setempat hanya dengan serah terima lisan. Konsekuensi yuridis dan perbendaharaannya adalah:",
     "Mobil tersebut berstatus titipan tanpa dasar hukum kepemilikan yang sah, berisiko gratifikasi ilegal, dan tidak dapat dicatat dalam SIMAK BMN sebelum ada NPH resmi dan SP3HL", "Mobil otomatis sah menjadi milik pribadi Kapolres yang menjabat", "Polres boleh menjual mobil tersebut ke dealer mobil bekas", "Tidak ada konsekuensi apapun karena tujuannya baik untuk pengamanan", "A",
     "Penerimaan aset dari korporasi tanpa NPH berpotensi benturan kepentingan/gratifikasi dan tidak memiliki dasar pengesahan legal BMN."),
    ("ANALISIS", "Analisis Kinerja SBSN Proyek sebagai Instrumen Pendalaman Pasar Keuangan Syariah: Bagaimana penerbitan SBSN proyek infrastruktur memperkuat stabilitas makroekonomi nasional?",
     "Menyediakan instrumen investasi syariah yang aman bagi dana haji/pensiun/masyarakat sekaligus membiayai aset produktif riil tanpa ketergantungan utang valuta asing", "Menaikkan suku bunga pinjaman bank umum menjadi sangat tinggi", "Menurunkan nilai tukar rupiah terhadap dolar secara drastis", "Menghapuskan kewajiban pembayaran pajak bagi seluruh rakyat", "A",
     "SBSN proyek menjembatani likuiditas pembiayaan syariah domestik dengan pembangunan aset fisik riil, menekan risiko 'currency mismatch' utang luar negeri.")
])

add_topic(t12, reg12, t12_items)

# Save intermediate json for topic 12
with open("scripts/p4_topics12.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)
print("Topic 12 successfully written!")
