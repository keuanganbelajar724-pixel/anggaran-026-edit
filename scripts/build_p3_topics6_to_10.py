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

# Load first 250 questions
with open("scripts/p3_all_done.json", "r", encoding="utf-8") as f:
    part3_questions = json.load(f)

print(f"Loaded existing {len(part3_questions)} questions.")
cur_num = 1301

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
# TOPIC 6: Perpajakan Bendahara Pengeluaran & Instansi Pemerintah (1301 - 1350)
# ============================================================================
t6 = "Perpajakan Bendahara Pengeluaran & Instansi Pemerintah"
reg6 = "PMK No. 59/PMK.03/2022 jo UU Harmonisasi Peraturan Perpajakan (HPP)"

t6_m = [
    ("Batas nominal belanja barang yang dibebaskan dari pemotongan PPh Pasal 22 oleh Bendahara Pemerintah adalah:", 
     "Paling banyak Rp 2.000.000 (tidak termasuk PPN)", "Paling banyak Rp 1.000.000", "Paling banyak Rp 5.000.000", "Paling banyak Rp 10.000.000", "A", 
     "Sesuai PMK 59/PMK.03/2022, pembayaran belanja barang s.d. Rp 2.000.000 tidak dipungut PPh Pasal 22 sepanjang bukan pemecahan transaksi.", reg6),
    ("Batas nilai pembayaran belanja kena PPN yang tidak dipungut PPN oleh instansi pemerintah adalah:", 
     "Paling banyak Rp 2.000.000 termasuk PPN", "Paling banyak Rp 1.000.000", "Paling banyak Rp 10.000.000", "Bebas tanpa batas", "A", 
     "Pembayaran paling banyak Rp 2.000.000 termasuk PPN tidak dipungut PPN oleh instansi pemerintah dan disetor sendiri oleh PKP rekanan.", reg6),
    ("Tarif umum pemungutan PPh Pasal 22 atas pembelian barang oleh bendahara pemerintah dari rekanan ber-NPWP adalah:", 
     "1,5% dari harga pembelian sebelum PPN", "0,5%", "2%", "5%", "A", 
     "Tarif PPh Pasal 22 bendahara pemerintah adalah 1,5% dari dasar pengenaan pajak (harga jual sebelum PPN).", reg6),
    ("Tarif pemotongan PPh Pasal 23 atas imbalan jasa katering, jasa kebersihan, dan jasa konsultan non-konstruksi adalah:", 
     "2% dari jumlah bruto tidak termasuk PPN", "1,5%", "5%", "10%", "A", 
     "Tarif PPh Pasal 23 atas jasa teknik, manajemen, katering, dan jasa lainnya adalah 2% bagi yang ber-NPWP.", reg6),
    ("Jika rekanan penyedia jasa tidak memiliki NPWP, maka tarif pemotongan PPh Pasal 23 dinaikkan sebesar:", 
     "100% lebih tinggi (menjadi 4%)", "50% lebih tinggi", "20% lebih tinggi", "Dikenakan sanksi denda kurungan", "A", 
     "Bagi rekanan yang tidak memiliki NPWP dikenakan tarif 100% lebih tinggi dari tarif normal PPh Pasal 23.", reg6),
    ("Pemotongan PPh Pasal 21 atas honorarium narasumber PNS Golongan IV yang dibebankan pada APBN adalah bersifat:", 
     "Final dengan tarif 15%", "Final dengan tarif 5%", "Final dengan tarif 0%", "Tidak dipotong pajak", "A", 
     "Honorarium PNS Golongan IV dari APBN/APBD dikenakan PPh 21 Final sebesar 15% (PP 80/2010).", reg6),
    ("Pemotongan PPh Pasal 21 atas honorarium PNS Golongan III adalah:", 
     "Final dengan tarif 5%", "Final dengan tarif 15%", "Final dengan tarif 0%", "Bebas pajak", "A", 
     "Honorarium PNS Golongan III dikenakan PPh Pasal 21 Final sebesar 5%.", reg6),
    ("Pemotongan PPh Pasal 21 atas honorarium PNS Golongan I dan II adalah:", 
     "Final dengan tarif 0%", "Final dengan tarif 5%", "Final dengan tarif 15%", "Dipotong 2,5%", "A", 
     "Sesuai PP 80/2010, honorarium PNS Golongan I dan Golongan II dikenakan tarif PPh Pasal 21 Final sebesar 0%.", reg6),
    ("Aplikasi pelaporan dan pembuatan bukti potong pajak terpadu instansi pemerintah yang disediakan Ditjen Pajak adalah:", 
     "e-Bupot Instansi Pemerintah (DJP Online)", "e-Faktur Swasta", "Kring Pajak Desktop", "SIMPONI Pajak", "A", 
     "Instansi pemerintah wajib menggunakan aplikasi e-Bupot Unifikasi Instansi Pemerintah untuk pembuatan bukti potong dan SPT Masa.", reg6),
    ("Batas waktu penyetoran pajak yang dipungut oleh Bendahara Pengeluaran atas transaksi UP adalah:", 
     "Paling lambat 7 hari setelah tanggal pembayaran", "Paling lambat akhir tahun", "Paling lambat tanggal 10 bulan berikutnya", "Paling lambat 30 hari kalender", "A", 
     "Sesuai PMK 59/2022, bendahara wajib menyetorkan pajak yang dipungut paling lambat 7 hari setelah tanggal pembayaran atas beban kas UP.", reg6),
    ("Batas waktu pelaporan SPT Masa Unifikasi Instansi Pemerintah adalah paling lambat:", 
     "Tanggal 20 bulan berikutnya setelah masa pajak berakhir", "Tanggal 10 bulan berikutnya", "Tanggal 15 bulan berikutnya", "Akhir tahun anggaran", "A", 
     "Pelaporan SPT Masa Unifikasi instansi pemerintah wajib disampaikan paling lambat tanggal 20 bulan berikutnya.", reg6),
    ("Faktur Pajak elektronik (e-Faktur) yang diterbitkan oleh rekanan PKP wajib diverifikasi kode transaksinya untuk bendahara pemerintah yaitu:", 
     "Kode Transaksi 02 (Penyerahan kepada Pemungut Bendahara Pemerintah)", "Kode Transaksi 01", "Kode Transaksi 04", "Kode Transaksi 08", "A", 
     "Faktur pajak atas transaksi belanja pemerintah menggunakan kode faktur 02 sebagai penanda bendahara pemungut.", reg6),
    ("Pembayaran sewa tanah dan/atau bangunan kantor oleh bendahara pemerintah dikenakan:", 
     "PPh Final Pasal 4 ayat (2) dengan tarif 10%", "PPh Pasal 23 sebesar 2%", "PPh Pasal 22 sebesar 1,5%", "Bebas pajak", "A", 
     "Sewa tanah dan/atau bangunan dikenakan PPh Final Pasal 4 ayat (2) sebesar 10% dari jumlah bruto nilai persewaan.", reg6),
    ("Tarif PPh Final atas pekerjaan jasa pelaksana konstruksi dengan kualifikasi usaha kecil adalah:", 
     "1,75%", "2,65%", "4%", "6%", "A", 
     "Sesuai PP 9/2022, jasa pelaksana konstruksi kualifikasi kecil dikenakan tarif PPh Final 1,75%.", reg6),
    ("Nomor Pokok Wajib Pajak (NPWP) Instansi Pemerintah diterbitkan berdasarkan:", 
     "Surat Keputusan penunjukan bendahara atau pembentukan instansi pemerintah", "KTP pribadi bendahara semata", "Akta notaris pendirian kantor cabang", "Izin mendirikan bangunan", "A", 
     "NPWP Instansi Pemerintah mengidentifikasi entitas satker/instansi pemerintah sebagai subjek pemungut pajak negara.", reg6),
    ("Dokumen yang digunakan bendahara untuk menyetorkan pajak ke kas negara adalah:", 
     "Surat Setoran Pajak (SSP) atau Kode Billing Penerimaan Negara", "Kuitansi pembelian", "Tiket tanda masuk", "Surat jalan ekspedisi", "A", 
     "Penyetoran pajak dilakukan melalui e-Billing dengan Kode Billing SSP Instansi Pemerintah ke bank persepsi/pos.", reg6),
    ("Penerimaan Negara Bukan Pajak (PNBP) atas jasa layanan pemerintah diadministrasikan melalui sistem penerimaan negara:", 
     "SIMPONI (Sistem Informasi PNBP Online)", "DJP Online", "Katalog LKPP", "e-Court MA", "A", 
     "SIMPONI adalah modul sistem penerimaan negara yang mengelola kode billing penerimaan bukan pajak (PNBP).", reg6)
]

t6_s = [
    ("Satker membayar belanja fotokopi dan cetak formulir sebesar Rp 1.500.000 kepada CV Cetak (PKP). Bagaimanakah kewajiban perpajakan bendahara?", 
     "Tidak memungut PPh 22 maupun PPN karena nilai transaksi di bawah Rp 2.000.000; rekanan menyetor PPN sendiri", "Memotong PPh 22 sebesar 1,5% dan PPN 11%", "Memotong PPh 23 sebesar 10%", "Membebaskan rekanan dari segala kewajiban", "A", 
     "Transaksi belanja di bawah Rp 2 juta dibebaskan dari kewajiban pemungutan bendahara (PPh 22 & PPN diproses sendiri oleh rekanan).", reg6),
    ("Bendahara membayar jasa perbaikan AC kantor senilai Rp 11.100.000 (termasuk PPN) kepada penyedia ber-NPWP. Berapakah DPP dan PPh 23 yang wajib dipotong?", 
     "DPP = Rp 10.000.000, PPh Pasal 23 = Rp 200.000 (2% x Rp 10 juta)", "DPP = Rp 11.100.000, PPh 23 = Rp 222.000", "DPP = Rp 10.000.000, PPh 23 = Rp 150.000", "Bebas PPh 23", "A", 
     "DPP sebelum PPN adalah Rp 11,1 juta / 1,11 = Rp 10 juta. PPh 23 = 2% x Rp 10 juta = Rp 200.000.", reg6),
    ("Bagaimanakah perlakuan pajak atas pembelian beras dan bahan pangan pokok untuk logistik asrama pemerintah?", 
     "Bebas PPN sesuai UU HPP karena kebutuhan pokok tidak terutang PPN, namun terutang PPh 22 jika nilai belanja > Rp 2 juta", "Dikenakan PPN 11% dan PPh 22 sebesar 5%", "Dikenakan pajak bumi dan bangunan", "Dilarang dibeli dengan uang APBN", "A", 
     "Barang kebutuhan pokok esensial bebas dari pengenaan PPN sesuai UU HPP; PPh 22 tetap berlaku jika di atas batas nominal threshold.", reg6),
    ("Dalam hal rekanan memiliki Surat Keterangan PP 23 / PP 55 (PPh Final UMKM 0,5%), maka bendahara pemerintah wajib:", 
     "Memotong PPh Final 0,5% dari jumlah bruto transaksi penjualan barang/jasa dan tidak memungut PPh 22/23", "Tetap memotong tarif normal 1,5%", "Menolak melakukan transaksi dengan UMKM", "Memotong pajak sebesar 10%", "A", 
     "Suket UMKM PP 55/2022 mewajibkan bendahara memotong PPh Final 0,5% sebagai insentif tarif afirmatif bagi usaha kecil.", reg6),
    ("Apabila bendahara terlambat menyampaikan SPT Masa Unifikasi melampaui tanggal 20 bulan berikutnya, sanksi administrasi perpajakan yang timbul adalah:", 
     "Denda administrasi keterlambatan SPT Masa sebesar Rp 100.000 per masa pajak yang dibebankan kepada pejabat terkait", "Gedung kantor disita kantor pajak", "Semua pegawai kantor dipotong gaji 50%", "DIPA satker dibatalkan oleh menteri", "A", 
     "Keterlambatan penyampaian SPT Masa PPh/PPN dikenakan sanksi denda administrasi Pasal 7 UU KUP sebesar Rp 100.000 per SPT.", reg6),
    ("Apa kewajiban bendahara jika rekanan menyerahkan faktur pajak yang tidak dapat divalidasi di DJP Online (faktur pajak fiktif)?", 
     "Menolak melakukan pembayaran, meminta faktur pajak sah yang ter-generate resmi di sistem e-Faktur DJP, dan melapor ke KPA", "Membayar lunas tanpa memedulikan faktur", "Membuat faktur pajak buatan sendiri", "Memberi uang tip kepada pengantar faktur", "A", 
     "Faktur pajak tidak valid/fiktif adalah pelanggaran hukum berat; bendahara dilarang mencairkan pembayaran atas dokumen tidak valid.", reg6),
    ("Pembayaran honorarium narasumber pakar non-ASN (tenaga ahli independen) sebesar Rp 10.000.000 dikenakan PPh Pasal 21 sebesar:", 
     "5% x 50% x Rp 10.000.000 = Rp 250.000 (tarif Pasal 17 atas 50% penghasilan bruto bukan pegawai)", "5% x Rp 10.000.000 = Rp 500.000", "15% x Rp 10.000.000 = Rp 1.500.000", "Bebas PPh 21", "A", 
     "PPh 21 bukan pegawai non-berkesinambungan dihitung dari 50% penghasilan bruto dikalikan tarif progresif Pasal 17 UU PPh.", reg6),
    ("Dalam belanja melalui platform marketplace resmi pengadaan (Digipay Satu), pihak yang bertindak memungut dan menyetor PPN serta PPh adalah:", 
     "Sistem marketplace / Bank Operasional persepsi secara otomatis terintegrasi e-billing", "Bendahara manual membawa uang ke kantor pajak", "Kurir pengantar paket", "Kepala satker secara pribadi", "A", 
     "Ekosistem digital marketplace pemerintah memfasilitasi pemungutan dan penyetoran pajak otomatis secara realtime.", reg6),
    ("Apakah pembayaran sewa kendaraan bermotor (mobil dinas operasional) kepada perusahaan rental mobil dipotong pajak?", 
     "Dipotong PPh Pasal 23 sebesar 2% dari nilai sewa sebelum PPN dan dipungut PPN 11% jika nilai > Rp 2 juta", "Bebas dari segala jenis pajak", "Hanya dikenakan pajak bea balik nama", "Dipotong PPh 21 sebesar 15%", "A", 
     "Sewa alat transportasi darat dikenakan PPh Pasal 23 atas sewa harta selain tanah/bangunan sebesar 2% plus pemungutan PPN.", reg6),
    ("Jika satker melakukan transaksi belanja modal komputer senilai Rp 55,5 juta kepada PKP rekanan ber-NPWP, berapakah rincian PPh 22 dan PPN yang dipotong pada SPM-LS?", 
     "DPP = Rp 50 juta; PPN 11% = Rp 5,5 juta; PPh 22 (1,5%) = Rp 750.000", "PPN = Rp 500.000; PPh 22 = Rp 100.000", "Hanya PPh 22 sebesar Rp 2 juta", "Bebas pajak karena belanja modal", "A", 
     "DPP = Rp 55,5 jt / 1,11 = Rp 50 jt. PPN 11% = Rp 5,5 jt. PPh 22 = 1,5% x Rp 50 jt = Rp 750.000. Potongan tercantum pada SPM-LS.", reg6),
    ("Batas waktu penerbitan Bukti Pemotongan Pajak Formulir 1721-A2 bagi ASN oleh Bendahara Pengeluaran adalah:", 
     "Paling lambat akhir bulan Januari tahun anggaran berikutnya", "Paling lambat 31 Desember tahun berjalan", "Paling lambat bulan Juni tahun berikutnya", "Tidak wajib diterbitkan", "A", 
     "Formulir 1721-A2 (bukti potong tahunan gaji ASN) wajib diterbitkan paling lambat bulan Januari untuk keperluan pelaporan SPT Tahunan Orang Pribadi.", reg6),
    ("Bagaimanakah perlakuan pajak terhadap uang harian dan biaya transportasi perjalanan dinas pegawai negeri sipil?", 
     "Dikecualikan dari objek pemotongan PPh Pasal 21 sepanjang sesuai standar biaya masukan (SBM) dan didukung SPD riil", "Dipotong PPh 21 sebesar 15% dari total uang saku", "Dipotong PPN sebesar 11%", "Dikenakan pajak hiburan", "A", 
     "Biaya perjalanan dinas jabatan berdasarkan sistem at-cost dan lumpsum resmi SBM bukan merupakan objek PPh Pasal 21 pegawai.", reg6),
    ("Apakah instansi pemerintah wajib memungut Bea Meterai atas kuitansi pembayaran belanja negara?", 
     "Wajib menggunakan meterai elektronik (e-Meterai) atau meterai fisik Rp 10.000 untuk transaksi dengan nilai nominal uang di atas Rp 5.000.000", "Wajib bermeterai untuk semua belanja di atas Rp 100.000", "Bebas meterai tanpa syarat", "Meterai hanya untuk surat nikah", "A", 
     "UU Bea Meterai menetapkan dokumen yang menyatakan jumlah uang di atas Rp 5.000.000 terutang Bea Meterai Rp 10.000.", reg6),
    ("Dalam hal terjadi kelebihan penyetoran pajak oleh bendahara ke kas negara, mekanisme pemulihan uang kas tersebut dapat dilakukan melalui:", 
     "Permohonan Pengembalian Kelebihan Pembayaran Pajak yang Seharusnya Tidak Terutang (Pemindahbukuan / Pbk) ke Kantor Pelayanan Pajak (KPP)", "Mengambil uang kas dari brankas secara diam-diam", "Meminta KPPN memotong pajak rekanan lain", "Membiarkan saja karena uang masuk ke negara", "A", 
     "Prosedur Pbk (Pemindahbukuan) diajukan resmi ke KPP domisili untuk mengalihkan kelebihan setoran ke masa pajak lain atau pengembalian restitusi.", reg6),
    ("Apakah jasa pengiriman dokumen oleh PT Pos Indonesia atau kurir logistik dipungut PPN oleh bendahara?", 
     "Ya, jasa pengiriman paket dikenakan PPN dengan besaran tertentu sesuai ketentuan perpajakan logistik", "Bebas PPN selamanya", "Dikenakan tarif pajak 50%", "Dilarang menggunakan jasa kurir", "A", 
     "Jasa pengiriman pos dan logistik terutang PPN dengan tarif efektif tertentu yang disesuaikan dalam regulasi perpajakan.", reg6),
    ("Rekanan menyerahkan Surat Keterangan Bebas (SKB) PPh Pasal 22 yang diterbitkan Kantor Pelayanan Pajak. Tindakan bendahara adalah:", 
     "Tidak melakukan pemungutan PPh Pasal 22 dan melampirkan fotokopi/scan SKB yang masih berlaku pada bukti pertanggungjawaban belanja", "Merobek SKB dan tetap memotong pajak 1,5%", "Menggandakan SKB untuk rekanan lain", "Meminta bayaran uang jasa kepada rekanan", "A", 
     "SKB yang sah dan masih berlaku membebaskan rekanan dari pemotongan PPh 22; bendahara wajib mengarsipkannya sebagai bukti pengurang.", reg6),
    ("Bagaimanakah tata cara pembetulan SPT Masa Unifikasi jika bendahara menemukan kesalahan pencatatan nomor NPWP rekanan?", 
     "Membuat SPT Pembetulan pada aplikasi e-Bupot Unifikasi dan menyampaikan pembetulan tersebut secara online ke DJP", "Membuat satker baru dengan nama berbeda", "Menghubungi polisi untuk membatalkan SPT", "Mengubah tulisan dengan tipe-x pada lembar arsip", "A", 
     "Pembetulan SPT Masa dapat dilakukan kapan saja sebelum pemeriksaan pajak melalui mekanisme SPT Pembetulan resmi di DJP Online.", reg6)
]

t6_a = [
    ("Analisis Kasus Keterlambatan Penyetoran Pajak Kas UP Selama 4 Bulan: Hasil audit BPK menemukan Bendahara Pengeluaran memotong PPh dan PPN sebesar Rp 85 juta dari transaksi belanja UP sejak bulan Januari, namun uang pajak mengendap di brankas dan baru disetor bulan Mei. Analisis risiko hukum atas perbuatan bendahara adalah:", 
     "Pelanggaran disiplin berat dan indikasi tindak pidana perpajakan (penggelapan uang pajak negara), serta pengenaan sanksi bunga bunga keterlambatan per bulan", "Tindakan yang sah karena uang masih utuh di brankas", "Inovasi pengamanan kas yang patut diapresiasi", "Tidak ada masalah karena disetor pada tahun yang sama", "A", 
     "Uang pajak yang telah dipungut wajib disetor maksimal 7 hari; mengendapkan pajak di brankas berimplikasi sanksi pidana perpajakan dan kerugian kas.", reg6),
    ("Analisis Kasus Pembayaran Konsultan Konstruksi Perorangan Tanpa Sertifikat Badan Usaha (SBU): Satker mengontrak insinyur sipil perorangan yang memiliki SKA Ahli Utama untuk perencanaan gedung senilai Rp 80 juta. Skema pemotongan pajak penghasilan yang benar adalah:", 
     "Dikenakan PPh Final Jasa Konstruksi (kualifikasi perorangan) sebesar 4% atau PPh Pasal 21 tenaga ahli tergantung status kontrak formal perikatan kerja", "Bebas pajak karena dilakukan oleh individu", "Dikenakan pajak bumi dan bangunan", "Dipotong pajak penghasilan luar negeri 50%", "A", 
     "Jasa konsultansi konstruksi tunduk pada regulasi PPh Final Konstruksi (PP 9/2022) bagi pemegang sertifikat keahlian kerja jasa konstruksi.", reg6),
    ("Studi Kasus Pajak atas Transaksi Perjalanan Dinas Paket Pertemuan (Fullboard Meeting): Satker mengadakan konsinyering di hotel senilai Rp 120 juta yang mencakup sewa ruang rapat, kamar tidur, dan makan minum. Aspek perpajakan hotel yang benar sesuai UU HKPD dan UU HPP adalah:", 
     "Jasa perhotelan dan konsumsi hotel merupakan objek Pajak Daerah (PB1 / Pajak Barang dan Jasa Tertentu), sehingga TIDAK dipungut PPN oleh bendahara APBN", "Wajib dipungut PPN 11% dan disetor ke kas negara", "Dipotong PPh 22 sebesar 1,5%", "Bebas dari seluruh pajak pusat dan daerah", "A", 
     "UU Hubungan Keuangan Pemerintah Pusat dan Daerah (HKPD) menetapkan jasa hotel & restoran sebagai objek Pajak Daerah, bukan objek PPN pusat.", reg6),
    ("Analisis Kasus Pemotongan PPh 21 Pegawai Pemerintah Non Pegawai Negeri (PPNPN): Satker mempekerjakan 10 orang tenaga administrasi PPNPN dengan upah bulanan Rp 4.500.000 per orang. Jika status mereka tidak kawin dan tanpa tanggungan (TK/0), berapakah PPh 21 terutang per bulan sesuai tarif TER?", 
     "PPh 21 nihil (Rp 0) karena penghasilan bulanan Rp 4,5 juta masih berada di bawah batas PTKP bulanan (kategori TER A tarif 0%)", "Dipotong PPh 21 sebesar 5% x Rp 4,5 juta = Rp 225.000", "Dipotong 15% x Rp 4,5 juta", "Dipotong denda pajak", "A", 
     "Penghasilan bruto s.d. Rp 5,4 juta per bulan masuk kategori Tarif Efektif Rata-rata (TER) 0% sehingga tidak terutang PPh Pasal 21 bulanan.", reg6),
    ("Analisis Kasus Pengadaan Barang Impor Langsung oleh Satker Penelitian: Satker mengimpor mikroskop elektron dari Jepang seharga US$ 50.000 menggunakan Masterlist bebas bea masuk dan bebas pajak impor dari Kemenkeu. Kewajiban bendahara saat pencairan SPM adalah:", 
     "Melampirkan Surat Keterangan Bebas (SKB) Pajak Impor dan dokumen Pemberitahuan Impor Barang (PIB) resmi agar tidak dipotong PPh 22 Impor", "Tetap memotong PPh 22 Impor sebesar 7,5%", "Membayar pajak dengan uang tunai yen Jepang", "Meminta kedutaan besar Jepang melunasi pajak", "A", 
     "Barang impor riset/pemerintah dengan fasilitas pembebasan fiskal sah dibebaskan dari pungutan impor dengan dokumen Masterlist dan SKB resmi.", reg6),
    ("Analisis Kasus Rekanan Berstatus PKP Menggunakan Faktur Pajak Diganti (Pembatalan Faktur): Setelah SP2D cair, rekanan membatalkan faktur pajak nomor 020 karena ada kesalahan deskripsi barang dan menerbitkan faktur pengganti. Dampak administratif pada pelaporan SPT Masa Bendahara adalah:", 
     "Bendahara melakukan penyesuaian pada e-Bupot Unifikasi dengan merekam data faktur pajak pengganti tanpa mengubah nominal setoran pajak yang telah masuk kas negara", "Semua barang belanja harus dikembalikan ke toko", "Bendahara wajib dipenjara 1 bulan", "KPPN menarik kembali uang SP2D dari rekening rekanan", "A", 
     "Faktur pengganti diselaraskan pada aplikasi e-Bupot untuk menjaga kesesuaian administrasi pelaporan tanpa mempengaruhi hak pencairan belanja yang sah.", reg6),
    ("Analisis Penanganan Pajak atas Pengadaan Tanah untuk Kepentingan Umum: Pemerintah mencairkan ganti rugi pembebasan tanah jalan tol kepada warga sebesar Rp 2 miliar. Pemotongan PPh yang wajib dipungut oleh instansi adalah:", 
     "PPh Final Pengalihan Hak atas Tanah dan/atau Bangunan sebesar 2,5% dari jumlah bruto nilai pengalihan", "Dipotong PPh 21 progresif 35%", "Dipotong PPN sebesar 11%", "Bebas pajak tanpa syarat apapun", "A", 
     "Pengalihan tanah untuk kepentingan umum dikenakan PPh Final Pasal 4 ayat (2) dengan tarif 2,5% sesuai PP 34/2016.", reg6),
    ("Analisis Kasus Transaksi Split Bill untuk Menghindari Ambang Batas PPh 22: Pejabat memecah pembelian kertas kantor Rp 8 juta menjadi 5 nota belanja masing-masing Rp 1,6 juta dalam hari yang sama di toko yang sama. Penilaian auditor pajak atas transaksi ini adalah:", 
     "Merupakan satu kesatuan transaksi ekonomi yang utuh (artificial splitting); bendahara tetap wajib memungut PPh Pasal 22 dan PPN atas nilai kumulatif Rp 8 juta", "Tindakan legal yang cerdas dan efisien", "Bentuk bantuan sosial bagi pemilik toko kertas", "Tidak perlu diaudit karena bernilai kecil", "A", 
     "Penetapan pajak mengedepankan asas substance over form; pemecahan transaksi buatan tidak menggugurkan kewajiban pemungutan pajak negara.", reg6),
    ("Analisis Kasus Pajak Hadiah dan Penghargaan Lomba Inovasi Pelayanan Publik: Satker memberikan hadiah uang tunai Rp 50 juta kepada tim inovator masyarakat non-pegawai. Aspek perpajakan yang wajib dipotong adalah:", 
     "PPh Pasal 21 Final sebesar 25% (jika undian) atau PPh Pasal 21 non-final tarif Pasal 17 (jika penghargaan perlombaan/prestasi kerja)", "Bebas pajak karena hadiah pemerintah", "Dipotong PPh Pasal 22 sebesar 1,5%", "Dipotong bea cukai ekspor", "A", 
     "Hadiah perlombaan/penghargaan kepada masyarakat dikenakan PPh Pasal 21 sesuai ketentuan pemajakan atas hadiah dan penghargaan DJP.", reg6),
    ("Analisis Pembayaran Jasa Pengolahan Sampah B3 Medis Rumah Sakit Pemerintah: Satker rumah sakit membayar jasa pemusnahan limbah medis sebesar Rp 40 juta kepada PT Limbah Hijau. Potongan pajak yang tepat adalah:", 
     "PPh Pasal 23 atas jasa pengolahan limbah sebesar 2% (Rp 800.000) dan pungutan PPN 11% (Rp 4,4 juta)", "Bebas pajak karena limbah berbahaya", "Dipotong PPh 21 pegawai", "Dipotong pajak daerah reklame", "A", 
     "Jasa pengelolaan dan pemusnahan limbah B3 adalah objek jasa kena PPh Pasal 23 (2%) dan penyerahan jasa kena PPN.", reg6),
    ("Analisis Yuridis Tanggung Jawab Renteng Pajak antara Bendahara dan Rekanan: Apabila bendahara telah memotong PPN dari rekanan namun lalai menyetorkannya ke Kas Negara hingga bendahara meninggal dunia, bagaimanakah status utang pajak tersebut?", 
     "Utang pajak tetap menjadi tanggung jawab instansi pemerintah penanggung jawab pemungut pajak, bukan tanggung jawab rekanan yang telah dipotong haknya", "Rekanan dipaksa membayar pajak untuk kedua kalinya", "Utang pajak dihapus otomatis", "Keluarga rekanan disita hartanya", "A", 
     "Jika rekanan memegang bukti potong yang sah, tanggung jawab hukum penyetoran beralih sepenuhnya kepada instansi pemerintah pemungut.", reg6),
    ("Analisis Kasus Pengadaan Makanan Minuman Harian Pasien Rumah Sakit Jiwa: Satker mengontrak katering penyedia makanan khusus pasien senilai Rp 500 juta. Apakah penyerahan makanan ini terutang PPN pusat atau Pajak Restoran daerah?", 
     "Tergantung klausul penyediaan: jika katering memenuhi kriteria jasa boga/katering maka tunduk pada Pajak Daerah PB1, kecuali katering institusional tertentu yang diatur dalam regulasi daerah", "Selalu terutang PPN 11% tanpa kecuali", "Dikenakan pajak bumi dan bangunan", "Dilarang memungut pajak apapun dari orang sakit", "A", 
     "Karakteristik jasa katering diuji batas kompetensi fiskal antara Pajak Daerah (PB1) dan PPN Pusat sesuai ketentuan UU HKPD dan UU PPN.", reg6),
    ("Analisis Penggunaan Nomor Induk Kependudukan (NIK) sebagai NPWP pada Pembayaran Honorarium APBN: Bagaimana validasi data pemotongan PPh 21 pada e-Bupot jika penerima honorarium belum melakukan pemadanan NIK-NPWP?", 
     "Sistem DJP mengintegrasikan NIK 16 digit yang telah terverifikasi Dukcapil sebagai basis NPWP orang pribadi dalam pembuatan bukti potong resmi", "Pembayaran honorarium dibatalkan sepihak", "Penerima honor dikenakan denda kurungan 1 tahun", "Uang honor dikembalikan ke menteri keuangan", "A", 
     "Integrasi NIK menjadi NPWP 16 digit memungkinkan validasi instan identitas wajib pajak orang pribadi secara elektronik pada sistem pajak nasional.", reg6),
    ("Analisis Kasus Pengenaan PPh Pasal 22 atas Belanja Bahan Bakar Minyak (BBM) Kapal Riset: Satker membeli BBM industri solar senilai Rp 200 juta langsung dari PT Pertamina Patra Niaga. Apakah bendahara memungut PPh 22?", 
     "Tidak memungut PPh Pasal 22 karena pembelian bahan bakar minyak dan gas dari produsen/badan usaha BUMN migas dikecualikan dari pemungutan bendahara", "Wajib memotong 1,5% dari total belanja solar", "Wajib memotong PPh 23 sebesar 2%", "Dikenakan denda pencemaran laut", "A", 
     "Pasal 3 PMK 59/2022 mengecualikan pemungutan PPh 22 atas pembayaran BBM, gas, pelumas, dan listrik dari badan usaha penyedia energi.", reg6),
    ("Analisis Kasus PPh 26 atas Penyelenggaraan Ujian Sertifikasi Internasional Daring: Satker membayar biaya ujian sertifikasi profesi pegawai sebesar US$ 10.000 kepada lembaga sertifikasi di Amerika Serikat. Dokumen yang membebaskan atau mengurangi pemotongan PPh 26 adalah:", 
     "Certificate of Domicile (Form DGT) yang sah dari otoritas pajak Amerika Serikat berdasarkan Perjanjian Penghindaran Pajak Berganda (P3B/Tax Treaty)", "Surat keterangan izin dari menteri pendidikan", "Ijazah kelulusan ujian bahasa Inggris", "Foto gedung kantor di Washington", "A", 
     "Tax treaty (P3B) dan Form DGT resmi memberikan kepastian tarif pajak preferensial atau pembebasan pajak atas penghasilan royalti/jasa luar negeri.", reg6),
    ("Analisis Evaluasi Efektivitas e-Bupot Unifikasi terhadap Tata Kelola Kemenkeu: Mengapa integrasi pelaporan pajak ke dalam satu pintu SPT Unifikasi meningkatkan maturitas kepatuhan perpajakan instansi pemerintah?", 
     "Menghilangkan fragmentasi bukti potong manual, mencegah duplikasi setoran pajak, memastikan audit trail digital terintegrasi, dan meminimalisir risiko sanksi denda", "Karena pegawai kantor pajak tidak perlu memeriksa SPT lagi", "Karena tarif pajak otomatis turun 50%", "Karena kertas di kantor menjadi habis", "A", 
     "e-Bupot Unifikasi menyatukan seluruh jenis PPh (21, 22, 23, 4 ayat 2, 26) dan PPN dalam satu platform tunggal yang transparan dan akuntabel.", reg6)
]

add_topic(t6, reg6, t6_m, t6_s, t6_a)

with open("scripts/p3_topics1_to_6.json", "w", encoding="utf-8") as f:
    json.dump(part3_questions, f, indent=2, ensure_ascii=False)
