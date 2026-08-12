import { TemplateMessage } from '../types';

export const REMINDER_TEMPLATES: TemplateMessage[] = [
  {
    id: 'temp-capaian-output',
    jenis: 'Capaian Output',
    judul: 'Peringatan Terlambat / Belum Capaian Output SAKTI',
    subjekEmail: '[PENTING - KPPN SEMARANG I] Teguran Penyampaian Data Capaian Output Satker {KODE_SATKER}',
    isiWa: `Yth. Bpk/Ibu {NAMA_PIC} (Satker {NAMA_SATKER} - Kode {KODE_SATKER})

*KANTOR PELAYANAN PERBENDAHARAAN NEGARA (KPPN) SEMARANG I*

Berdasarkan monitoring Aplikasi SAKTI & OM-SPAN per tanggal hari ini, Satker Bapak/Ibu tercatat *BELUM / TERLAMBAT* menyampaikan *Laporan Capaian Output* untuk periode berjalan.

Detail Status Satker:
📌 Kode Satker: {KODE_SATKER}
🏢 Nama Satker: {NAMA_SATKER}
📊 Capaian Output Terdeteksi: {CAPAIAN_OUTPUT}%
⚠️ Catatan Tambahan: {MASALAH_LIST}

Mohon segera melakukan perekaman, konfirmasi, dan pembagian data Capaian Output di SAKTI paling lambat pada *{BATAS_WAKTU} pukul 16.00 WIB* agar tidak berdampak negatif pada penurunan nilai IKPA Satker.

Terima kasih atas kerja samanya.
_Seksi MSKI - KPPN Semarang I_`,
    isiSurat: `SURAT HIMBAUAN DAN PERINGATAN TERSEBUT
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

Demikian disampaikan, atas perhatian dan kerja samanya diucapkan terima kasih.

Kepala Kantor Pelayanan Perbendaharaan Negara Semarang I`
  },
  {
    id: 'temp-ikpa-rendah',
    jenis: 'IKPA Rendah',
    judul: 'Teguran Nilai IKPA Di Bawah Target KPPN Semarang I (<87.5)',
    subjekEmail: '[SURAT TEGURAN - KPPN SEMARANG I] Evaluation Nilai IKPA Satker {KODE_SATKER}',
    isiWa: `Yth. Bpk/Ibu KPA & PIC Keuangan {NAMA_SATKER} (Kode {KODE_SATKER})

*KPPN SEMARANG I - NOTIFIKASI EVALUASI IKPA*

Diberitahukan bahwa nilai IKPA Satker Anda saat ini berada pada angka *{NILAI_IKPA}* dengan predikat *"{PREDIKAT}"*, yang mana masih *di bawah target minimal KPPN Semarang I (≥ 87,50)*.

Catatan Komponen Indikator:
- Penyerapan Anggaran: {PENYERAPAN}%
- Deviasi Hal III DIPA: {DEVIASI_HAL3}%
- Capaian Output: {CAPAIAN_OUTPUT}%
- Catatan Kinerja: {MASALAH_LIST}

Mohon dapat segera dilakukan langkah asistensi dan koordinasi dengan Tim Pembina KPPN Semarang I untuk percepatan perbaikan indikator terkait sebelum batas penutupan rekonsiliasi.

Pusat Layanan Asistensi: KPPN Semarang I
Contact Person Seksi MSKI / CSO KPPN Semarang I.`,
    isiSurat: `SURAT EVALUASI KINERJA PELAKSANAAN ANGGARAN
Nomor: {NO_SURAT}
Hal: Evaluasi dan Pembinaan Nilai IKPA Satker KPPN Semarang I

Yth. Kepala / Kuasa Pengguna Anggaran
{NAMA_SATKER}
Semarang

Sehubungan dengan hasil pembinaan dan monitoring KPPN Semarang I, disampaikan evaluasi kinerja pelaksanaan anggaran Satker {NAMA_SATKER} (Kode {KODE_SATKER}) sebagai berikut:

1. Nilai IKPA Satker Anda periode berjalan adalah sebesar {NILAI_IKPA} dengan kategori "{PREDIKAT}".
2. Beberapa komponen indikator yang memerlukan perhatian khusus meliputi:
   {MASALAH_LIST}
3. KPPN Semarang I membuka layanan pendampingan dan konsultasi langsung (Asistensi IKPA) setiap hari kerja untuk membantu menyelesaikan kendala administrasi keuangan pada Satker Bapak/Ibu.

Diharapkan langkah konkrit perbaikan dapat direalisasikan sebelum {BATAS_WAKTU}.

Demikian surat evaluasi ini disampaikan untuk ditindaklanjuti.

Kepala KPPN Semarang I`
  },
  {
    id: 'temp-penyerapan-rendah',
    jenis: 'Penyerapan Rendah',
    judul: 'Himbauan Percepatan Penyerapan Anggaran & Hal III DIPA',
    subjekEmail: '[HIMBAUAN - KPPN SEMARANG I] Percepatan Penyerapan Anggaran Satker {KODE_SATKER}',
    isiWa: `Yth. Pengelola Keuangan {NAMA_SATKER} ({KODE_SATKER})

Pemberitahuan dari *KPPN SEMARANG I*:
Realisasi anggaran Satker Anda saat ini baru mencapai *{PENYERAPAN}%* dari total Pagu (Sisa Pagu: Rp {SISA_PAGU}).

Sesuai rencana penarikan dana Halaman III DIPA, mohon segera mengajukan SPM (Belanja Pegawai, Barang, Modal, maupun Kontraktual) untuk menghindari penumpukan tagihan di akhir triwulan dan menjaga indikator Deviasi Halaman III DIPA.

Terima kasih.
_KPPN Semarang I_`,
    isiSurat: `SURAT HIMBAUAN PERCEPATAN PENYERAPAN ANGGARAN
Nomor: {NO_SURAT}
Hal: Langkah-Langkah Percepatan Penyerapan Anggaran Triwulan Berjalan

Yth. Kuasa Pengguna Anggaran
{NAMA_SATKER} ({KODE_SATKER})

Sesuai arahan Direktur Jenderal Perbendaharaan mengenai efektivitas belanja negara, disampaikan bahwa tingkat penyerapan anggaran Satker {NAMA_SATKER} saat ini berada di angka {PENYERAPAN}% dengan sisa anggaran sebesar Rp {SISA_PAGU}.

Guna menjaga kelancaran pasokan dana dan performa IKPA, kami meminta KPA untuk:
1. Mempercepat penyelesaian tagihan pihak ketiga.
2. Mengajukan SPM sesuai Rencana Penarikan Dana Halaman III DIPA.
3. Melakukan reviu dan percepatan eksekusi kegiatan kontraktual.

Terima kasih atas perhatian dan kerja samanya.

Kepala KPPN Semarang I`
  }
];
