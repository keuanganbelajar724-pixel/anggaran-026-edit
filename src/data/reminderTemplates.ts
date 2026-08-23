import { TemplateMessage } from '../types';

export const REMINDER_TEMPLATES: TemplateMessage[] = [
  // ==========================================
  // 1. CAPAIAN OUTPUT SAKTI (VERSI DATA SPESIFIK SATKER)
  // ==========================================
  {
    id: 'temp-capaian-output-satker',
    jenis: 'Capaian Output',
    judul: '🔴 [DATA SATKER] Peringatan Belum Konfirmasi Capaian Output Satker {KODE_SATKER}',
    subjekEmail: '[PENTING - KPPN SEMARANG I] Percepatan Pelaporan Data Capaian Output Satker {KODE_SATKER}',
    isiWa: `*PEMBERITAHUAN RESMI - KPPN SEMARANG I*
*SEKSI MANAJEMEN SATKER DAN KEPATUHAN INTERNAL (MSKI)*

Yth. Kuasa Pengguna Anggaran (KPA) / PPK / Operator Capaian Output
*Satker:* {NAMA_SATKER} (Kode: *{KODE_SATKER}*)

Berdasarkan monitoring Aplikasi SAKTI & My Intress per hari ini, Satker Bapak/Ibu tercatat *BELUM / TERLAMBAT* menyelesaikan konfirmasi pelaporan *Data Capaian Output* periode berjalan.

📊 *Detail Rekapitulasi Data Satker:*
• Kode Satker : *{KODE_SATKER}*
• Nama Satker : {NAMA_SATKER}
• Status Laporan : *{STATUS_OUTPUT}*
• Realisasi Output : *{CAPAIAN_OUTPUT}%*
• Bobot IKPA : *25.00%* (Komponen Terbesar)

⚠️ *Langkah Tindak Lanjut Segera:*
1. Buka Aplikasi SAKTI (Modul Komitmen / Pelaporan).
2. Lakukan perekaman progres capaian rincian output (RO) dan volume realisasi secara akurat.
3. Lakukan konfirmasi dan finalisasi sebelum *{BATAS_WAKTU}*.

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

  // ==========================================
  // 2. CAPAIAN OUTPUT SAKTI (VERSI UMUM / GRUP SATKER TANPA DATA SPESIFIK - CEK WEB)
  // ==========================================
  {
    id: 'temp-capaian-output-grup',
    jenis: 'Capaian Output',
    judul: '📢 [BROADCAST GRUP] Pengingat Cut-Off Capaian Output (Suruh Cek Web anggaran-026.my.id)',
    subjekEmail: '[PENGUMUMAN - KPPN SEMARANG I] Batas Waktu Pelaporan Capaian Output SAKTI',
    isiWa: `*PENGUMUMAN PENTING - KPPN SEMARANG I*
*PENGINGAT BATAS WAKTU PELAPORAN CAPAIAN OUTPUT SAKTI*

Yth. Seluruh Bapak/Ibu KPA, PPK, dan Operator SAKTI Satker Mitra KPPN Semarang I,

Mengingatkan kembali bahwa batas akhir pengisian dan konfirmasi *Data Capaian Output (RVRO & PCRO) Modul Komitmen/Pelaporan SAKTI* periode berjalan akan segera ditutup pada *{BATAS_WAKTU}*.

⚠️ *PENTING BAGI SELURUH SATKER:*
Komponen Capaian Output memiliki bobot terbesar (*25.00%*) dalam perhitungan Nilai IKPA. Keterlambatan atau status belum terkonfirmasi akan otomatis menyebabkan nilai IKPA anjlok (*skor 0*).

🔍 *Cek Status Satker Anda Secara Mandiri:*
Daftar satker yang sudah konfirmasi vs belum konfirmasi dapat dicek langsung secara real-time pada portal monitoring:
👉 *https://anggaran-026.my.id*
_(Buka Tab "Dashboard IKPA" / "Capaian Output" lalu cari Kode Satker masing-masing)_

📥 *Juknis & Panduan Pengisian:*
Bagi yang mengalami kendala teknis atau anomali data, tutorial dan panduan resmi dapat diunduh di:
👉 *https://anggaran-026.my.id* (Menu Pengetahuan & Juknis SAKTI)

Mohon untuk segera menyelesaikan konfirmasi sebelum sistem ditutup. Terima kasih.

_Seksi MSKI - KPPN Semarang I_
_Handal, Efisien, Berintegritas_`,
    isiSurat: `PENGUMUMAN BATAS AKHIR PELAPORAN DATA CAPAIAN OUTPUT
Nomor: {NO_SURAT}
Hal: Himbauan Percepatan Konfirmasi Capaian Output SAKTI Satker Mitra KPPN Semarang I

Yth. Para Kuasa Pengguna Anggaran (KPA) Satker Mitra KPPN Semarang I
di Tempat

Menindaklanjuti batas waktu pelaporan Capaian Output pada Aplikasi SAKTI periode berjalan:
1. Satker diimbau segera melakukan perekaman target, realisasi fisik (RVRO), dan progres capaian (PCRO) pada Modul Komitmen/Pelaporan SAKTI sebelum {BATAS_WAKTU}.
2. Data satker yang belum melakukan konfirmasi serta panduan teknis pengisian dapat dipantau langsung melalui portal resmi https://anggaran-026.my.id.
3. KPPN Semarang I menyediakan layanan asistensi bagi satker yang memerlukan pendampingan.

Demikian untuk dipedomani.

Kepala KPPN Semarang I`
  },

  // ==========================================
  // 3. EVALUASI IKPA & SATKER DALAM PERHATIAN (DATA SPESIFIK)
  // ==========================================
  {
    id: 'temp-ikpa-rendah-satker',
    jenis: 'IKPA & Evaluasi',
    judul: '📉 [DATA SATKER] Evaluasi Nilai IKPA di Bawah Target Satker {KODE_SATKER}',
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

  // ==========================================
  // 4. EVALUASI IKPA (VERSI UMUM / GRUP SATKER - SURUH CEK WEB)
  // ==========================================
  {
    id: 'temp-ikpa-umum-grup',
    jenis: 'IKPA & Evaluasi',
    judul: '📊 [BROADCAST GRUP] Rilis Nilai IKPA & Daftar Satker Dalam Perhatian',
    subjekEmail: '[INFO KINERJA - KPPN SEMARANG I] Rilis Capaian IKPA Satker Lingkup KPPN Semarang I',
    isiWa: `*RILIS KINERJA PELAKSANAAN ANGGARAN (IKPA) - KPPN SEMARANG I*

Yth. Seluruh KPA, PPK, PPSPM, Bendahara & Pengelola Keuangan Satker Mitra KPPN Semarang I,

Telah dirilis pembaharuan data monitoring Nilai Kinerja Pelaksanaan Anggaran (IKPA) periode berjalan untuk seluruh Satker mitra KPPN Semarang I.

📊 *Fokus Evaluasi & Parameter Kritis:*
1. 📈 *Deviasi Halaman III DIPA* (Jaga kesesuaian RPD dan realisasi belanja).
2. ⏱️ *Penyerapan Anggaran & Tagihan Kontraktual* (Hindari penumpukan SPM di akhir triwulan).
3. 🎯 *Ketepatan Waktu Capaian Output* (Pastikan konfirmasi 100% tuntas).
4. 💳 *Revolving UP/TUP & Transaksi KKP* (Patuhi jadwal revolving 1 bulan).

🔍 *Cek Nilai, Rapor & Peringkat Satker Anda:*
Seluruh Satker dihimbau untuk mengecek nilai detail indikator dan rekomendasi perbaikan di:
👉 *https://anggaran-026.my.id*
_(Cek tab **Dashboard IKPA** & **Satker Dalam Perhatian**)_

Bagi satker dengan nilai di bawah 87.50, kami persilakan berkonsultasi via HAI CSO / Klinik IKPA KPPN Semarang I.

_Seksi MSKI - KPPN Semarang I_`,
    isiSurat: `PEMBERITAHUAN HASIL MONITORING IKPA PERIODE BERJALAN
Nomor: {NO_SURAT}
Hal: Penyampaian Hasil Evaluasi IKPA Satker Mitra KPPN Semarang I

Yth. Para Kuasa Pengguna Anggaran Satker Mitra KPPN Semarang I
di Tempat

Bersama ini disampaikan bahwa hasil rekapitulasi penilaian Indikator Kinerja Pelaksanaan Anggaran (IKPA) seluruh satker telah diperbarui.

Satuan kerja diharapkan memeriksa pencapaian masing-masing indikator dan menindaklanjuti area perbaikan melalui portal https://anggaran-026.my.id.

Demikian disampaikan, atas sinergi dan kerja samanya diucapkan terima kasih.

Kepala KPPN Semarang I`
  },

  // ==========================================
  // 5. KATALOG JUKNIS, SAKTI & BLANGKO (PENGETAHUAN LENGKAP)
  // ==========================================
  {
    id: 'temp-katalog-juknis-lengkap',
    jenis: 'Pengetahuan & Juknis',
    judul: '📚 [BROADCAST GRUP] Katalog Juknis SAKTI, Gaji Web, Digipay & Blangko Resmi KPPN',
    subjekEmail: '[REPOSITORI RESMI - KPPN SEMARANG I] Katalog Juknis SAKTI, Gaji, PPNPN & Blangko Format',
    isiWa: `*PUSAT PENGETAHUAN & REPOSITORI JUKNIS SAKTI - KPPN SEMARANG I*
*Website Resmi:* *https://anggaran-026.my.id*

Yth. Bapak/Ibu Pengelola Keuangan, PPK, PPSPM, Bendahara & Operator Satker,

Untuk mempermudah pelaksanaan tugas perbendaharaan sehari-hari dan penanganan kendala aplikasi, KPPN Semarang I telah menyatukan seluruh *Juknis, SOP, Modul Bimtek, dan Blangko Surat Resmi* ke dalam satu portal digital yang dapat diunduh gratis kapan saja:

👉 *https://anggaran-026.my.id* (Menu Pengetahuan & Juknis SAKTI)

📂 *Daftar Kategori Juknis & Blangko yang Tersedia:*
1. 💻 *SAKTI Lengkap* (Modul Penganggaran, Komitmen, Pembayaran, Bendahara & Pelaporan).
2. 💵 *Aplikasi Gaji Web & GPP Desktop* (Gaji Induk, Kekurangan Gaji, e-SKPP, Uang Makan & Lembur).
3. 📝 *PPNPN Web* (Perekaman data, presensi & pembuatan SPM PPNPN).
4. 🛍️ *Digipay Satu & KKP* (Pendaftaran user, katalog vendor & settlement).
5. 🔐 *TTE SAKTI & Panther 3.2* (Solusi passphrase, reset sertifikat BSrE).
6. 🏥 *Juknis Khusus Satker BLU* (SP3B BLU, SPM 511 & Rekonsiliasi).
7. 📄 *Blangko & Template Resmi* (Surat Dispensasi SPM/Kontrak, Berita Acara Kas, LPJ Bendahara format Word/Excel).

💡 *Tips Cepat:*
Simpan (*bookmark*) link portal ini di browser komputer Anda agar mudah diakses sewaktu-waktu:
👉 *https://anggaran-026.my.id*

_KPPN Semarang I - Handal, Efisien, Berintegritas_`,
    isiSurat: `PEMBERITAHUAN AKSES REPOSITORI JUKNIS DAN BLANGKO FORMAT RESMI
Nomor: {NO_SURAT}
Hal: Penyediaan Repositori Digital Juknis Aplikasi dan Blangko Perbendaharaan KPPN Semarang I

Yth. Kuasa Pengguna Anggaran Satker Mitra KPPN Semarang I
di Tempat

Dalam rangka standardisasi dan peningkatan pemahaman regulasi perbendaharaan, KPPN Semarang I menyediakan pusat repositori terpadu yang memuat petunjuk teknis (Juknis) seluruh modul SAKTI, Gaji Web, PPNPN, Digipay Satu, serta template blangko surat permohonan/dispensasi pada laman:

https://anggaran-026.my.id

Satker dihimbau memanfaatkan fasilitas ini sebagai referensi utama dalam penyusunan dokumen keuangan negara.

Kepala KPPN Semarang I`
  },

  // ==========================================
  // 6. PENGELOLAAN UP / TUP & REVOLVING GUP (DATA SPESIFIK)
  // ==========================================
  {
    id: 'temp-pengelolaan-up-satker',
    jenis: 'Pengelolaan UP/TUP',
    judul: '💳 [DATA SATKER] Pengingat Batas Waktu Revolving GUP Satker {KODE_SATKER}',
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

  // ==========================================
  // 7. PENGELOLAAN UP / TUP (VERSI UMUM / GRUP SATKER - SURUH CEK WEB)
  // ==========================================
  {
    id: 'temp-pengelolaan-up-grup',
    jenis: 'Pengelolaan UP/TUP',
    judul: '⏳ [BROADCAST GRUP] Peringatan Batas Waktu Revolving GUP & Pertanggungjawaban TUP',
    subjekEmail: '[PENGINGAT KPPN - KPPN SEMARANG I] Batas Waktu Pengajuan SPM GUP & Pertanggungjawaban TUP',
    isiWa: `*PENGINGAT PERIODE REVOLVING UP & TUP - KPPN SEMARANG I*

Yth. Bapak/Ibu Kuasa Pengguna Anggaran, PPK & Bendahara Pengeluaran Satker Mitra KPPN Semarang I,

Mengingatkan ketentuan pengelolaan kas negara sesuai Peraturan Menteri Keuangan & Perdirjen Perbendaharaan:

⚠️ *KETENTUAN UTAMA:*
1. 🔄 *Revolving GUP:* Wajib diajukan minimal *1 kali dalam 1 bulan* terhitung sejak tanggal SP2D UP/GUP terakhir dengan persentase minimal *50%*.
2. 🛑 *Konsekuensi Keterlambatan:* Jika melewati batas 1 bulan, KPPN akan menerbitkan Surat Peringatan. Apabila 1 bulan berikutnya belum diajukan, maka UP Tunai akan dikenakan *pemotongan sebesar 25%*.
3. 📦 *Pertanggungjawaban TUP:* Wajib diselesaikan (GUP Nihil) paling lambat *1 bulan* sejak SP2D TUP terbit.

🔍 *Cek Tanggal SP2D Terakhir & Hitung Mundur Jatuh Tempo Satker Anda:*
👉 *https://anggaran-026.my.id* (Pilih Menu **Pengelolaan UP/TUP**)

Bagi satker yang masa revolving-nya sudah mendekati jatuh tempo, mohon segera memproses SPP/SPM GUP pada aplikasi SAKTI.

_Seksi Pencairan Dana - KPPN Semarang I_`,
    isiSurat: `PENGINGAT BATAS WAKTU REVOLVING UP DAN TUP
Nomor: {NO_SURAT}
Hal: Himbauan Percepatan Revolving GUP dan Penyelesaian TUP

Yth. Para Kuasa Pengguna Anggaran Satker Mitra KPPN Semarang I
di Tempat

Mengingatkan kembali kewajiban revolving UP minimal 1 (satu) kali dalam sebulan dan penyelesaian TUP dalam 30 hari kalender.

Daftar satker yang mendekati masa jatuh tempo dapat dipantau langsung di https://anggaran-026.my.id.

Kepala KPPN Semarang I`
  },

  // ==========================================
  // 8. SERTIFIKASI PEJABAT PERBENDAHARAAN (DATA SPESIFIK)
  // ==========================================
  {
    id: 'temp-sertifikasi-satker',
    jenis: 'Sertifikasi Pejabat',
    judul: '🎓 [DATA SATKER] Pemutakhiran Sertifikat PPK/PPSPM/Bendahara Satker {KODE_SATKER}',
    subjekEmail: '[SERTIFIKASI PEJABAT - KPPN SEMARANG I] Himbauan Sertifikasi & Perpanjangan SIMASPATEN Satker {KODE_SATKER}',
    isiWa: `*KPPN SEMARANG I - PEMUTAKHIRAN SERTIFIKASI PEJABAT PERBENDAHARAAN*

Yth. Kuasa Pengguna Anggaran & Pejabat Perbendaharaan
*Satker:* {NAMA_SATKER} (Kode: *{KODE_SATKER}*)

Sesuai PMK mengenai Standarisasi Kompetensi Pejabat Perbendaharaan Negara (PPK, PPSPM, dan Bendahara Pengeluaran), disampaikan hasil monitoring status sertifikasi pejabat pada Satker Anda:

📌 *Data Pejabat Satker:*
• Kode Satker : *{KODE_SATKER}*
• Nama Satker : {NAMA_SATKER}
• Status Teridentifikasi : *Terdapat Pejabat Belum Bersertifikat / Masa Berlaku Mendekati Kadaluarsa*

📋 *Langkah Tindak Lanjut:*
1. Bagi PPK/PPSPM/Bendahara yang *belum bersertifikat*: Segera ikuti program sertifikasi/perekaman usulan pada Aplikasi *SIMASPATEN* (https://simaspaten.kemenkeu.go.id) dan pantau pemanggilan diklat pada *SWIPE-AP*.
2. Bagi pejabat dengan *sertifikat yang akan kadaluarsa*: Segera ajukan perpanjangan masa berlaku sertifikat (Penyegaran/PPL) di SIMASPATEN minimal 30-60 hari sebelum tanggal berakhir.
3. Pastikan data SK pengangkatan pejabat telah terdaftar dan valid pada SAKTI & My Intress.

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
3. Diharapkan KPA segera menugaskan pejabat terkait untuk mendaftar program sertifikasi/perpanjangan masa berlaku melalui portal SIMASPATEN Kemenkeu serta memantau pemanggilan diklat di SWIPE-AP.
4. Monitoring berkala dapat diakses melalui portal https://anggaran-026.my.id.

Demikian disampaikan, terima kasih atas perhatiannya.

Kepala KPPN Semarang I`
  },

  // ==========================================
  // 9. SERTIFIKASI PEJABAT (VERSI UMUM / GRUP SATKER - SURUH CEK WEB)
  // ==========================================
  {
    id: 'temp-sertifikasi-grup',
    jenis: 'Sertifikasi Pejabat',
    judul: '🏅 [BROADCAST GRUP] Monitoring Masa Berlaku Sertifikat PPK, PPSPM, & Bendahara',
    subjekEmail: '[SERTIFIKASI PEJABAT - KPPN SEMARANG I] Pemantauan Sertifikat Pejabat Perbendaharaan',
    isiWa: `*MONITORING SERTIFIKASI PEJABAT PERBENDAHARAAN - KPPN SEMARANG I*

Yth. Seluruh KPA dan Pejabat Pengelola APBN (PPK, PPSPM, Bendahara Pengeluaran),

Dalam rangka pemenuhan standardisasi kompetensi pejabat perbendaharaan negara sesuai peraturan perundang-undangan:

📋 *Hal-Hal yang Perlu Diperhatikan:*
1. 🎓 *Masa Berlaku Sertifikat:* Sertifikat kompetensi PPK/PPSPM/BNT memiliki batas masa berlaku 5 tahun dan wajib diperpanjang melalui PPL/Penyegaran di SIMASPATEN.
2. ⚠️ *Pejabat Belum Bersertifikat:* KPA wajib segera mengusulkan pejabat yang belum memiliki sertifikat untuk mengikuti penilaian kompetensi/diklat di SWIPE-AP.
3. 🔄 *Pergantian SK Pejabat:* Laporkan segera jika terjadi mutasi pejabat baru ke KPPN Semarang I.

🔍 *Cek Status Masa Berlaku Sertifikat Pejabat Satker Anda:*
👉 *https://anggaran-026.my.id* (Menu **Sertifikasi Pejabat**)

Mari pastikan seluruh pejabat pengelola keuangan pada satker Anda memiliki sertifikat yang sah dan aktif.

_Seksi MSKI - KPPN Semarang I_`,
    isiSurat: `PENGUMUMAN PEMANTAUAN SERTIFIKASI PEJABAT PERBENDAHARAAN
Nomor: {NO_SURAT}
Hal: Himbauan Perpanjangan dan Sertifikasi Pejabat Perbendaharaan

Yth. Para Kuasa Pengguna Anggaran Satker Mitra KPPN Semarang I
di Tempat

KPPN Semarang I terus memantau validitas sertifikat kompetensi PPK, PPSPM, dan Bendahara. Satuan kerja dihimbau memeriksa status kadaluarsa pejabat pada portal https://anggaran-026.my.id dan segera memproses perpanjangan melalui SIMASPATEN Kemenkeu.

Kepala KPPN Semarang I`
  },

  // ==========================================
  // 10. TRANSAKSI KKP & DIGIPAY SATU (VERSI UMUM / GRUP SATKER)
  // ==========================================
  {
    id: 'temp-transaksi-kkp-grup',
    jenis: 'Transaksi KKP & Digipay',
    judul: '🛍️ [BROADCAST GRUP] Optimalisasi Belanja Non-Tunai KKP & Marketplace Digipay Satu',
    subjekEmail: '[AKSELERASI KKP - KPPN SEMARANG I] Himbauan Transaksi KKP & Digipay Satu',
    isiWa: `*KPPN SEMARANG I - AKSELERASI KARTU KREDIT PEMERINTAH & DIGIPAY SATU*

Yth. Seluruh KPA, PPK, Pejabat Pengadaan & Bendahara Pengeluaran,

Mendukung transformasi digital belanja pemerintah dan pemberdayaan produk dalam negeri (PDN):

💡 *Manfaat Transaksi KKP & Digipay Satu:*
✅ *Zero Cash Risk:* Belanja operasional dan tiket perjalanan dinas aman tanpa uang tunai.
✅ *Bebas Bunga & Biaya Admin:* Menggunakan fasilitas perbankan Himbara (BRI, Mandiri, BNI, BSI).
✅ *Mendongkrak IKPA:* Satker yang aktif bertransaksi KKP dan Digipay mendapatkan poin maksimal pada indikator Pengelolaan UP/TUP.

📊 *Lihat Leaderboard & Transaksi Satker Teraktif:*
👉 *https://anggaran-026.my.id* (Menu **Transaksi KKP**)

📥 *Unduh Juknis Pendaftaran Vendor & Checkout Digipay:*
👉 *https://anggaran-026.my.id* (Menu Pengetahuan & Juknis)

Mari tingkatkan transaksi non-tunai di lingkungan kerja kita masing-masing!

_KPPN Semarang I - Handal, Efisien, Berintegritas_`,
    isiSurat: `HIMBAUAN OPTIMALISASI KARTU KREDIT PEMERINTAH DAN DIGIPAY SATU
Nomor: {NO_SURAT}
Hal: Peningkatan Belanja Non-Tunai dan Penggunaan Digipay Satu

Yth. Para Kuasa Pengguna Anggaran Satker Mitra KPPN Semarang I
di Tempat

KPPN Semarang I mendorong optimalisasi penggunaan KKP dan platform Digipay Satu untuk belanja barang operasional. Pantau data transaksi dan unduh juknis operasional di https://anggaran-026.my.id.

Kepala KPPN Semarang I`
  },

  // ==========================================
  // 11. PUSAT INFORMASI & MONITORING MANDIRI PORTAL (UTAMA)
  // ==========================================
  {
    id: 'temp-portal-mandiri-lengkap',
    jenis: 'Portal Mandiri Satker',
    judul: '🌐 [PORTAL RESMI] Broadcast Pengenalan Portal Terpadu anggaran-026.my.id',
    subjekEmail: '[INFORMASI PORTAL - KPPN SEMARANG I] Akses Terpadu Monitoring & Layanan Satker KPPN Semarang I',
    isiWa: `*PORTAL TERPADU MONITORING & LAYANAN KPPN SEMARANG I*
*Website Resmi:* *https://anggaran-026.my.id*

Yth. Bapak/Ibu Kuasa Pengguna Anggaran, PPK, PPSPM, Bendahara & Operator Satker Mitra KPPN Semarang I,

Kini seluruh data kinerja perbendaharaan, regulasi, materi bimtek, dan layanan bantuan KPPN Semarang I dapat diakses secara mandiri, real-time, dan terintegrasi melalui portal:

👉 *https://anggaran-026.my.id*

🌟 *Fitur Utama yang Dapat Diakses Langsung:*
1. 📊 *Dashboard IKPA & Capaian Output SAKTI* (Status realisasi, ranking, dan rincian indikator).
2. ⚠️ *Satker Dalam Perhatian* (Deteksi dini potensi sanksi / penurunan nilai kinerja).
3. 💳 *Pengelolaan UP/TUP & Transaksi KKP* (Jadwal jatuh tempo revolving dan leaderboard KKP).
4. 🎓 *Sertifikasi Pejabat* (Cek sisa masa berlaku sertifikat PPK/PPSPM/Bendahara).
5. 📚 *Pengetahuan & Juknis SAKTI* (Unduh buku manual SAKTI, Gaji Web, PPNPN, Digipay & blangko surat).
6. 🖼️ *Katalog Slide Presentasi & Brosur* (Bahan sosialisasi resmi KPPN).
7. 📝 *Presensi Online & Saluran Pengaduan* (Lapor kendala langsung ke Seksi MSKI).

Silakan sebarkan informasi ini ke seluruh jajaran pengelola keuangan di instansi Bapak/Ibu.

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
