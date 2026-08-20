import { TemplateMessage } from '../types';

export const REMINDER_TEMPLATES: TemplateMessage[] = [
  // 1. CAPAIAN OUTPUT SAKTI
  {
    id: 'temp-capaian-output',
    jenis: 'Capaian Output',
    judul: '🔴 [URGENT] Peringatan Terlambat / Belum Konfirmasi Capaian Output SAKTI',
    subjekEmail: '[PENTING - KPPN SEMARANG I] Percepatan Pelaporan Data Capaian Output Satker {KODE_SATKER}',
    isiWa: `*PEMBERITAHUAN RESMI - KPPN SEMARANG I*
*SEKSI MANAJEMEN SATKER DAN KEPATUHAN INTERNAL (MSKI)*

Yth. Kuasa Pengguna Anggaran (KPA) / PPK / Operator Capaian Output
*Satker:* {NAMA_SATKER} (Kode: *{KODE_SATKER}*)

Berdasarkan monitoring Aplikasi SAKTI & OM-SPAN per hari ini, Satker Bapak/Ibu tercatat *BELUM / TERLAMBAT* menyelesaikan konfirmasi pelaporan *Data Capaian Output* periode berjalan.

📊 *Detail Rekapitulasi Data:*
• Kode Satker : *{KODE_SATKER}*
• Nama Satker : {NAMA_SATKER}
• Status Laporan : *{STATUS_OUTPUT}*
• Realisasi Output : *{CAPAIAN_OUTPUT}%*
• Bobot Penilaian IKPA : *25.00%* (Komponen Terbesar IKPA)

⚠️ *Langkah Tindak Lanjut Segera:*
1. Buka Aplikasi SAKTI (Modul Komitmen / Pelaporan).
2. Lakukan perekaman progres capaian rincian output (RO) dan volume realisasi secara akurat.
3. Lakukan konfirmasi dan finalisasi sebelum *{BATAS_WAKTU} pukul 17.00 WIB*.

🔗 *Monitoring Mandiri & Bahan Bimtek:*
Silakan pantau status capaian output satker dan unduh juknis panduan pada portal resmi KPPN:
👉 *https://anggaran-026.my.id*

Terima kasih atas kerja sama dan sinergi yang baik.

_Seksi MSKI - KPPN Semarang I_`,
    isiSurat: `SURAT HIMBAUAN DAN PERINGATAN
Nomor: {NO_SURAT}
Hal: Himbauan Percepatan Penyampaian Data Capaian Output dan Penyelesaian IKPA

Yth. Kuasa Pengguna Anggaran (KPA)
{NAMA_SATKER} (Kode Satker: {KODE_SATKER})
di Tempat

Sehubungan dengan hasil monitoring pelaksanaan anggaran pada KPPN Semarang I sampai dengan periode ini, dengan ini disampaikan beberapa hal sebagai berikut:

1. Berdasarkan Peraturan Direktur Jenderal Perbendaharaan mengenai Indikator Kinerja Pelaksanaan Anggaran (IKPA), setiap Satuan Kerja diwajibkan menyampaikan Data Capaian Output secara akurat dan tepat waktu melalui Aplikasi SAKTI.
2. Hasil pengolahan data menunjukkan bahwa Satker {NAMA_SATKER} ({KODE_SATKER}) memiliki status:
   - Capaian Output: {CAPAIAN_OUTPUT}% (Status: Belum Terlaporkan / Terlambat)
   - Total Nilai IKPA Sementara: {NILAI_IKPA} ({PREDIKAT})
   - Kendala Utama: {MASALAH_LIST}
3. Berkenaan dengan hal tersebut, kami menghimbau agar KPA segera memerintahkan Pejabat/Operator terkait untuk menyelesaikan konfirmasi Capaian Output sebelum {BATAS_WAKTU}.
4. Status perkembangan berkala dapat dipantau melalui portal monitoring KPPN di alamat https://anggaran-026.my.id.

Demikian disampaikan, atas perhatian dan kerja samanya diucapkan terima kasih.

Kepala Kantor Pelayanan Perbendaharaan Negara Semarang I`
  },

  // 2. EVALUASI IKPA & SATKER DALAM PERHATIAN
  {
    id: 'temp-ikpa-rendah',
    jenis: 'IKPA Rendah',
    judul: '📉 [EVALUASI] Notifikasi Nilai IKPA di Bawah Target KPPN Semarang I (< 87.50)',
    subjekEmail: '[EVALUASI IKPA - KPPN SEMARANG I] Evaluasi & Pendampingan Nilai IKPA Satker {KODE_SATKER}',
    isiWa: `*KPPN SEMARANG I - NOTIFIKASI EVALUASI IKPA & SATKER PERHATIAN*

Yth. Kuasa Pengguna Anggaran & Pengelola Keuangan
*Satker:* {NAMA_SATKER} (Kode: *{KODE_SATKER}*)

Disampaikan bahwa berdasarkan hasil pemantauan terpadu KPPN Semarang I, Nilai IKPA Satker Bapak/Ibu saat ini berada pada angka *{NILAI_IKPA}* dengan predikat *"{PREDIKAT}"*, yang mana masih *di bawah target minimal KPPN Semarang I (≥ 87,50)*.

📌 *Rincian Kinerja Indikator Utama:*
• Nilai Total IKPA : *{NILAI_IKPA}*
• Predikat Capaian : *{PREDIKAT}*
• Penyerapan Anggaran : *{PENYERAPAN}%*
• Deviasi Hal III DIPA : *{DEVIASI_HAL3}%*
• Capaian Output : *{CAPAIAN_OUTPUT}%*
• Catatan Permasalahan : {MASALAH_LIST}

💡 *Rekomendasi Akselerasi KPPN:*
1. Segera selesaikan tagihan pihak ketiga dan ajukan SPM untuk perbaikan penyerapan belanja.
2. Lakukan penyesuaian Rencana Penarikan Dana (RPD) Halaman III DIPA pada awal triwulan.
3. KPPN Semarang I membuka layanan konsultasi *Asistensi IKPA & Coaching Clinic* setiap hari kerja tanpa dipungut biaya (Rp0).

🌐 *Cek Analisis Rinci Kinerja Satker Anda:*
👉 *https://anggaran-026.my.id* (Pilih Tab Dashboard IKPA / Satker Dalam Perhatian)

Terima kasih atas perhatian dan komitmen perbaikan kinerja Satker.

_Seksi MSKI - KPPN Semarang I_`,
    isiSurat: `SURAT EVALUASI KINERJA PELAKSANAAN ANGGARAN
Nomor: {NO_SURAT}
Hal: Evaluasi dan Pembinaan Nilai IKPA Satker KPPN Semarang I

Yth. Kepala / Kuasa Pengguna Anggaran
{NAMA_SATKER} ({KODE_SATKER})
di Semarang

Sehubungan dengan hasil pembinaan dan monitoring KPPN Semarang I, disampaikan evaluasi kinerja pelaksanaan anggaran Satker {NAMA_SATKER} (Kode {KODE_SATKER}) sebagai berikut:

1. Nilai IKPA Satker Anda periode berjalan adalah sebesar {NILAI_IKPA} dengan kategori "{PREDIKAT}".
2. Beberapa komponen indikator yang memerlukan perhatian khusus meliputi:
   {MASALAH_LIST}
3. KPPN Semarang I membuka layanan pendampingan dan konsultasi langsung (Asistensi IKPA) setiap hari kerja untuk membantu menyelesaikan kendala administrasi keuangan pada Satker Bapak/Ibu.
4. Rincian komparasi dan rekomendasi lengkap dapat diakses secara mandiri pada portal https://anggaran-026.my.id.

Diharapkan langkah konkrit perbaikan dapat direalisasikan sebelum {BATAS_WAKTU}.

Demikian surat evaluasi ini disampaikan untuk ditindaklanjuti.

Kepala KPPN Semarang I`
  },

  // 3. PENGELOLAAN UP / TUP & REVOLVING GUP
  {
    id: 'temp-pengelolaan-up',
    jenis: 'Pengelolaan UP/TUP',
    judul: '💳 [PENGELOLAAN UP/TUP] Pengingat Batas Waktu Revolving GUP (1 Bulan / Min 50%)',
    subjekEmail: '[PENGELOLAAN UP - KPPN SEMARANG I] Pengingat Revolving Uang Persediaan Satker {KODE_SATKER}',
    isiWa: `*KPPN SEMARANG I - MONITORING REVOLVING UP & TUP*

Yth. Kuasa Pengguna Anggaran & Bendahara Pengeluaran
*Satker:* {NAMA_SATKER} (Kode: *{KODE_SATKER}*)

Mengingatkan kembali ketentuan *Perdirjen Perbendaharaan mengenai Pengelolaan UP/TUP*:
1. Satker pemegang Uang Persediaan (UP) wajib melakukan penggantian/revolving (GUP) sekurang-kurangnya *1 (satu) kali dalam 1 (satu) bulan* dengan minimal revolving *50%* dari besaran UP.
2. Bagi Satker dengan Tambahan UP (TUP), pertanggungjawaban wajib diselesaikan paling lambat *1 (satu) bulan* sejak SP2D TUP terbit.

📌 *Catatan Satker {KODE_SATKER}:*
• Status Revolving : *Perlu Percepatan Pengajuan GUP*
• Sisa Hari Batas Waktu : *{BATAS_WAKTU}*
• Rekomendasi : Segera rekam SPP/SPM GUP pada Aplikasi SAKTI sebelum masa revolving terlewati guna menghindari pemotongan atau penolakan revolving berikutnya.

📱 *Pantau Batas Waktu UP/TUP Satker Real-time:*
👉 *https://anggaran-026.my.id* (Menu Pengelolaan UP/TUP)

Salam Integritas,
_Seksi Pencairan Dana & MSKI KPPN Semarang I_`,
    isiSurat: `SURAT PEMBERITAHUAN PENGELOLAAN UP/TUP
Nomor: {NO_SURAT}
Hal: Pengingat Batas Waktu Revolving GUP dan Pertanggungjawaban TUP

Yth. Kuasa Pengguna Anggaran
{NAMA_SATKER} ({KODE_SATKER})
di Tempat

Sehubungan dengan kepatuhan perputaran kas dan revolving Uang Persediaan (UP), kami sampaikan:
1. Satker diwajibkan melakukan revolving sekurang-kurangnya 1 (satu) kali dalam sebulan minimal 50%.
2. Mengingat batas waktu revolving Satker Anda mendekati jatuh tempo ({BATAS_WAKTU}), kami mohon agar Bendahara Pengeluaran dan PPK segera memproses pengajuan SPM GUP ke KPPN Semarang I.
3. Seluruh jadwal dan status jatuh tempo dapat dicek pada web https://anggaran-026.my.id.

Terima kasih atas kerja sama yang baik.

Kepala KPPN Semarang I`
  },

  // 4. SERTIFIKASI PEJABAT PERBENDAHARAAN (PPK / PPSPM / BENDAHARA)
  {
    id: 'temp-sertifikasi-pejabat',
    jenis: 'Sertifikasi Pejabat',
    judul: '🎓 [SERTIFIKASI PEJABAT] Pemutakhiran Sertifikat PPK/PPSPM/Bendahara (SIMASPATI)',
    subjekEmail: '[SERTIFIKASI PEJABAT - KPPN SEMARANG I] Himbauan Sertifikasi & Perpanjangan SIMASPATI Satker {KODE_SATKER}',
    isiWa: `*KPPN SEMARANG I - PEMUTAKHIRAN SERTIFIKASI PEJABAT PERBENDAHARAAN*

Yth. Kuasa Pengguna Anggaran & Pejabat Perbendaharaan
*Satker:* {NAMA_SATKER} (Kode: *{KODE_SATKER}*)

Sesuai PMK mengenai Standarisasi Kompetensi Pejabat Perbendaharaan Negara (PPK, PPSPM, dan Bendahara Pengeluaran), disampaikan hasil monitoring status sertifikasi pejabat pada Satker Anda:

📌 *Data Pejabat Satker:*
• Kode Satker : *{KODE_SATKER}*
• Nama Satker : {NAMA_SATKER}
• Status Teridentifikasi : *Terdapat Pejabat Belum Bersertifikat / Masa Berlaku Mendekati Kadaluarsa*

📋 *Langkah Tindak Lanjut:*
1. Bagi PPK/PPSPM/Bendahara yang *belum bersertifikat*: Segera ikuti program sertifikasi/perekaman usulan pada Aplikasi *SIMASPATI* (https://simaspati.kemenkeu.go.id).
2. Bagi pejabat dengan *sertifikat yang akan kadaluarsa*: Segera ajukan perpanjangan masa berlaku sertifikat (Penyegaran/CPE) minimal 30-60 hari sebelum tanggal berakhir.
3. Pastikan data SK pengangkatan pejabat telah terdaftar dan valid pada SAKTI & OM-SPAN.

🔍 *Cek Daftar Pejabat & Tanggal Kadaluarsa Satker Anda:*
👉 *https://anggaran-026.my.id* (Menu Sertifikasi Pejabat)

_Seksi MSKI - KPPN Semarang I_`,
    isiSurat: `SURAT HIMBAUAN SERTIFIKASI KOMPETENSI PEJABAT PERBENDAHARAAN
Nomor: {NO_SURAT}
Hal: Pemenuhan Kewajiban Sertifikasi PPK, PPSPM, dan Bendahara

Yth. Kuasa Pengguna Anggaran
{NAMA_SATKER} ({KODE_SATKER})
di Tempat

Menindaklanjuti ketentuan mengenai standardisasi kompetensi Pejabat Perbendaharaan pada Satuan Kerja Pengelola APBN:
1. Setiap pejabat yang menduduki jabatan PPK, PPSPM, dan Bendahara diwajibkan memiliki Sertifikat Kompetensi yang masih aktif.
2. Satker Anda teridentifikasi memiliki pejabat yang belum tersertifikasi atau memiliki sertifikat yang masa berlakunya mendekati kadaluarsa.
3. Diharapkan KPA segera menugaskan pejabat terkait untuk mendaftar ujian sertifikasi/perpanjangan masa berlaku melalui portal SIMASPATI Kemenkeu.
4. Monitoring berkala dapat diakses melalui portal https://anggaran-026.my.id.

Demikian disampaikan, terima kasih atas perhatiannya.

Kepala KPPN Semarang I`
  },

  // 5. TRANSAKSI KKP (KARTU KREDIT PEMERINTAH) & DIGIPAY
  {
    id: 'temp-transaksi-kkp',
    jenis: 'Transaksi KKP & Digipay',
    judul: '💳 [AKSELERASI KKP & DIGIPAY] Peningkatan Transaksi Kartu Kredit Pemerintah & GUP KKP',
    subjekEmail: '[AKSELERASI KKP - KPPN SEMARANG I] Himbauan Optimalisasi Penggunaan KKP Satker {KODE_SATKER}',
    isiWa: `*KPPN SEMARANG I - AKSELERASI PENGGUNAAN KARTU KREDIT PEMERINTAH (KKP)*

Yth. Kuasa Pengguna Anggaran, PPK & Bendahara Pengeluaran
*Satker:* {NAMA_SATKER} (Kode: *{KODE_SATKER}*)

Dalam rangka modernisasi sistem pembayaran non-tunai pemerintah, efisiensi pengelolaan kas, serta mendukung Program Belanja Produk Dalam Negeri:

🏆 *Apresiasi & Himbauan Transaksi KKP:*
• KPPN Semarang I memberikan apresiasi tinggi kepada Satker yang aktif melakukan transaksi operasional belanja barang/perjalanan dinas menggunakan *KKP*.
• Bagi Satker yang belum mengoptimalkan proporsi UP KKP (minimal 40% dari total UP), diimbau untuk segera memanfaatkan kartu KKP dalam belanja operasional sehari-hari.

💡 *Manfaat Penggunaan KKP:*
✅ Transaksi aman, praktis, dan akuntabel tanpa memegang uang tunai besar.
✅ Bebas biaya administrasi dan bunga perbankan mitra (BRI, Mandiri, BNI, BSI).
✅ Mempercepat revolving GUP KKP dan mendongkrak nilai IKPA Satker.

📊 *Lihat Leaderboard & Peringkat Transaksi KKP Satker:*
👉 *https://anggaran-026.my.id* (Menu Transaksi KKP)

Salam Perubahan & Digitalisasi Perbendaharaan!

_KPPN Semarang I - Handal, Efisien, Berintegritas_`,
    isiSurat: `SURAT HIMBAUAN OPTIMALISASI KARTU KREDIT PEMERINTAH (KKP)
Nomor: {NO_SURAT}
Hal: Peningkatan Frekuensi Transaksi dan Revolving GUP KKP

Yth. Kuasa Pengguna Anggaran
{NAMA_SATKER} ({KODE_SATKER})
di Tempat

Sehubungan dengan arahan Ditjen Perbendaharaan dalam optimalisasi transaksi non-tunai (cashless) pada satuan kerja:
1. Satker pemegang proporsi UP KKP dihimbau untuk meningkatkan frekuensi belanja barang operasional dan perjalanan dinas dengan Kartu Kredit Pemerintah.
2. Segera lakukan pengajuan SPM GUP KKP secara berkala untuk menjaga kelancaran limit kartu kredit.
3. KPPN Semarang I memantau keaktifan transaksi KKP seluruh satker mitra melalui portal resmi https://anggaran-026.my.id.

Terima kasih atas kerja sama dan dukungannya.

Kepala KPPN Semarang I`
  },

  // 6. PENYERAPAN ANGGARAN & DEVIASI HAL III DIPA
  {
    id: 'temp-penyerapan-rendah',
    jenis: 'Penyerapan Rendah',
    judul: '💸 [PENYERAPAN & RPD] Percepatan Realisasi Belanja & Akurasi Hal III DIPA',
    subjekEmail: '[HIMBAUAN - KPPN SEMARANG I] Percepatan Penyerapan Anggaran Satker {KODE_SATKER}',
    isiWa: `*KPPN SEMARANG I - HIMBAUAN PENYERAPAN ANGGARAN & SPM*

Yth. Pengelola Keuangan *{NAMA_SATKER}* (Kode: *{KODE_SATKER}*)

Pemberitahuan Kinerja Pelaksanaan Anggaran dari *KPPN Semarang I*:
Realisasi penyerapan anggaran Satker Anda saat ini baru mencapai *{PENYERAPAN}%* dari total alokasi pagu DIPA.

📋 *Langkah Efektivitas Pengelolaan Belanja:*
1. Segera proses berkas tagihan pihak ketiga atas pekerjaan/pengadaan yang telah selesai (BAST).
2. Ajukan SPM (Belanja Barang, Modal, Bansos) ke KPPN sesuai Rencana Penarikan Dana Halaman III DIPA agar tidak menumpuk di akhir triwulan.
3. Manfaatkan mekanisme TUP untuk kebutuhan belanja mendesak dengan perikatan yang jelas.

📊 *Pantau Seluruh Indikator Kinerja Satker Anda:*
👉 *https://anggaran-026.my.id*

Terima kasih atas dedikasi dan kerja sama yang baik.

_Seksi Manajemen Satker dan Kepatuhan Internal (MSKI)_
_KPPN Semarang I_`,
    isiSurat: `SURAT HIMBAUAN PERCEPATAN PENYERAPAN ANGGARAN
Nomor: {NO_SURAT}
Hal: Langkah-Langkah Percepatan Penyerapan Anggaran Triwulan Berjalan

Yth. Kuasa Pengguna Anggaran
{NAMA_SATKER} ({KODE_SATKER})
di Tempat

Sesuai arahan Direktur Jenderal Perbendaharaan mengenai efektivitas belanja negara, disampaikan bahwa tingkat penyerapan anggaran Satker {NAMA_SATKER} saat ini berada di angka {PENYERAPAN}% dengan sisa anggaran sebesar Rp {SISA_PAGU}.

Guna menjaga kelancaran pasokan dana dan performa IKPA, kami meminta KPA untuk:
1. Mempercepat penyelesaian tagihan pihak ketiga.
2. Mengajukan SPM sesuai Rencana Penarikan Dana Halaman III DIPA.
3. Melakukan reviu dan percepatan eksekusi kegiatan kontraktual.
4. Memantau posisi capaian melalui https://anggaran-026.my.id.

Terima kasih atas perhatian dan kerja samanya.

Kepala KPPN Semarang I`
  },

  // 7. PUSAT INFORMASI & MONITORING MANDIRI PORTAL ANGGARAN-026.MY.ID
  {
    id: 'temp-portal-mandiri',
    jenis: 'Portal Mandiri Satker',
    judul: '🌐 [PORTAL RESMI] Akses Layanan & Monitoring Mandiri Satker di anggaran-026.my.id',
    subjekEmail: '[INFORMASI PORTAL - KPPN SEMARANG I] Akses Terpadu Monitoring & Layanan Satker KPPN Semarang I',
    isiWa: `*PORTAL TERPADU MONITORING & LAYANAN KPPN SEMARANG I*
*Website Resmi:* *https://anggaran-026.my.id*

Yth. Bapak/Ibu Kuasa Pengguna Anggaran, PPK, PPSPM, Bendahara & Operator Satker Mitra KPPN Semarang I.

Kini seluruh data kinerja perbendaharaan, regulasi, materi bimtek, dan layanan bantuan KPPN Semarang I dapat diakses secara mandiri, real-time, dan terintegrasi melalui portal:

👉 *https://anggaran-026.my.id*

🌟 *Fitur Utama yang Dapat Diakses Langsung:*
1. 📊 *Dashboard IKPA & Capaian Output SAKTI* (Status realisasi, ranking, dan rincian indikator).
2. ⚠️ *Satker Dalam Perhatian* (Deteksi dini potensi sanksi / penurunan nilai kinerja).
3. 💳 *Pengelolaan UP/TUP & Transaksi KKP* (Jadwal jatuh tempo revolving dan leaderboard KKP).
4. 🎓 *Sertifikasi Pejabat* (Cek sisa masa berlaku sertifikat PPK/PPSPM/Bendahara).
5. 📂 *Materi Slide, Juknis SAKTI & Link Sosialisasi* (Unduh bahan tayang presentasi narasumber).
6. 📝 *Presensi Online & Saluran Pengaduan Resmi* (Lapor kendala langsung ke Seksi MSKI).

Mari bersama wujudkan tata kelola APBN yang transparan, akuntabel, dan bebas gratifikasi!

_KPPN Semarang I - Melayani dengan Sepenuh Hati_`,
    isiSurat: `PEMBERITAHUAN PELUNCURAN DAN OPTIMALISASI PORTAL MONITORING MANDIRI
Nomor: {NO_SURAT}
Hal: Sosialisasi Penggunaan Portal Monitoring Anggaran KPPN Semarang I

Yth. Pimpinan / Kuasa Pengguna Anggaran Satker Mitra KPPN Semarang I
di Tempat

Dalam upaya meningkatkan transparansi, kecepatan koordinasi, serta efektivitas pembinaan pelaksanaan anggaran, KPPN Semarang I menyediakan portal monitoring terintegrasi yang dapat diakses oleh seluruh Satuan Kerja pada tautan:

https://anggaran-026.my.id

Portal ini menyediakan pemantauan real-time nilai IKPA, pelaporan capaian output SAKTI, batas waktu pengelolaan UP/TUP, sertifikasi pejabat perbendaharaan, transaksi Kartu Kredit Pemerintah, hingga bahan sosialisasi resmi.

Demikian disampaikan untuk dapat dimanfaatkan sebaik-baiknya oleh jajaran pengelola keuangan Satker.

Kepala KPPN Semarang I`
  }
];
