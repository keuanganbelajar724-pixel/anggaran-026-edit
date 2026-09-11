import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Target,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  ArrowRight,
  Calculator,
  RotateCcw,
  ShieldAlert,
  CheckSquare,
  Zap,
  MousePointerClick
} from 'lucide-react';

export interface PetunjukIndicatorContent {
  id: string;
  title: string;
  bobot: string;
  aspek: string;
  color: string;
  deskripsiSingkat: string;
  alurKerjaCepat: Array<{
    step: number;
    title: string;
    description: string;
    highlight: string;
  }>;
  kolomInputManual: Array<{ nama: string; keterangan: string }>;
  kolomOtomatisSistem: Array<{ nama: string; keterangan: string }>;
  sumberData: string[];
  langkahPengisian: Array<{
    kolom: string;
    tipe: 'Input' | 'Otomatis' | 'Input/Hitung';
    keterangan: string;
  }>;
  rumusExcel: string;
  penjelasanRumus: string[];
  tipsNilai100: string[];
  panduanTombol: Array<{
    namaTombol: string;
    keterangan: string;
  }>;
}

export const PETUNJUK_INDIKATOR_DATA: Record<string, PetunjukIndicatorContent> = {
  'interface': {
    id: 'interface',
    title: 'Ringkasan Eksekutif & Interface IKPA 2026',
    bobot: '100%',
    aspek: 'Agregasi Kinerja Pelaksanaan Anggaran',
    color: 'emerald',
    deskripsiSingkat:
      'Halaman utama konsolidasi seluruh 7 indikator IKPA dan faktor pengurang dispensasi SPM. Menghitung nilai akhir otomatis (Sel Q6), total tertimbang (N6), dan konversi bobot (O6) persis sesuai formula baku workbook resmi Kemenkeu.',
    alurKerjaCepat: [
      {
        step: 1,
        title: 'Pilih Periode Cut-Off Evaluasi',
        description: 'Pilih tombol bulan kumulatif (01 Jan s.d. 12 Des). Sistem menghitung capaian seluruh indikator kumulatif sampai bulan yang dipilih.',
        highlight: 'Bulan 09 (September) otomatis menggunakan target akselerasi TW III'
      },
      {
        step: 2,
        title: 'Pantau Nilai Akhir IKPA (Sel Q6)',
        description: 'Periksa kartu skor utama. Nilai akhir dihitung dari Total Tertimbang dibagi Konversi Bobot dikurangi Dispensasi SPM, dengan batas maksimal 100.',
        highlight: 'Target predikat: SANGAT BAIK (≥95), BAIK (89 s.d. <95)'
      },
      {
        step: 3,
        title: 'Cek Status Data & Navigasi ke Modul Indikator',
        description: 'Periksa kolom "Status Data" di tabel agregasi (Sudah Dihitung, Belum Lengkap, Belum Diisi). Klik tombol "Buka" untuk melengkapi data pada modul bersangkutan.',
        highlight: 'Klik ikon kalkulator untuk audit transparansi rumus tiap sel'
      },
      {
        step: 4,
        title: 'Uji Skenario dengan Sandbox What-If',
        description: 'Gunakan panel "Sandbox & Simulator Mandiri" untuk menggeser nilai target indikator secara bebas tanpa mengubah data riil untuk merancang strategi peningkatan IKPA.',
        highlight: 'Eksperimen strategi tanpa risiko merusak data riil'
      }
    ],
    kolomInputManual: [
      { nama: 'Periode Cut-Off (Bulan 01 s.d. 12)', keterangan: 'Memilih bulan evaluasi kumulatif untuk mensimulasikan capaian IKPA pada periode tertentu.' },
      { nama: 'Tombol Mulai dari 0 (Kosongkan)', keterangan: 'Mengosongkan seluruh data pada 7 indikator sekaligus sehingga simulasi dimulai dari nilai 0 bersih.' },
      { nama: 'Mode Tampilan (Dashboard vs Excel)', keterangan: 'Beralih antara visualisasi interaktif modern dan tampilan format sheet Excel Interface.' }
    ],
    kolomOtomatisSistem: [
      { nama: 'Total Tertimbang / N6 (Sel N6)', keterangan: 'Akumulasi nilai tertimbang dari seluruh 7 indikator: SUM(E6:K6).' },
      { nama: 'Konversi Bobot / O6 (Sel O6)', keterangan: 'Persentase total bobot indikator aktif. Bernilai 100% jika semua indikator aktif, atau proporsional jika ada yang non-aktif.' },
      { nama: 'Pengurang Dispensasi SPM / P6 (Sel P6)', keterangan: 'Faktor penalti pengurang skor akhir IKPA akibat keterlambatan pengajuan SPM pada Triwulan IV.' },
      { nama: 'Nilai Akhir IKPA / Q6 (Sel Q6)', keterangan: 'Formula: =MIN(100, MAX(0, ROUND((N6 / O6) - P6, 2))).' },
      { nama: 'Predikat Kinerja Satker', keterangan: 'Kategori predikat resmi: Sangat Baik (≥95), Baik (89 - 94.99), Cukup (70 - 88.99), Kurang (<70).' }
    ],
    sumberData: [
      'Agregasi otomatis dari 7 Modul: Revisi DIPA, Deviasi Hal III DIPA, Penyerapan Anggaran, Belanja Kontraktual, Penyelesaian Tagihan, Pengelolaan UP & TUP, Capaian Output, dan Dispensasi SPM.',
      'Peraturan Direktur Jenderal Perbendaharaan Nomor PER-5/PB/2022.',
      'Format Sheet Excel Resmi: "Interface" (Baris 1 s.d. 8, Kolom A s.d. Q).'
    ],
    langkahPengisian: [
      { kolom: 'Memulai Simulasi Baru', tipe: 'Input', keterangan: 'Klik "Mulai dari 0 (Kosongkan)" untuk membersihkan seluruh data menjadi 0, atau "Muat Contoh Workbook" untuk referensi.' },
      { kolom: 'Periode Evaluasi Kumulatif', tipe: 'Input', keterangan: 'Pilih tombol bulan 01 s.d. 12. Untuk triwulan I pilih 03, triwulan II pilih 06, triwulan III pilih 09, triwulan IV pilih 12.' },
      { kolom: 'Tabel Agregasi 7 Indikator', tipe: 'Otomatis', keterangan: 'Menampilkan nilai indikator, bobot, dan nilai tertimbang yang otomatis tertarik dari setiap modul terkait.' },
      { kolom: 'Status Data Indikator', tipe: 'Otomatis', keterangan: '"Sudah dihitung" (hijau), "Belum lengkap" (kuning, misal baru terisi sebagian bulan), "Belum diisi" (abu-abu).' },
      { kolom: 'Audit Rumus (Inspector)', tipe: 'Input/Hitung', keterangan: 'Klik ikon kalkulator pada baris indikator mana saja untuk melihat langkah matematis dan formula teknis Excel-nya.' }
    ],
    rumusExcel: "=MIN(100, MAX(0, ROUND((N6 / O6) - P6, 2)))",
    penjelasanRumus: [
      'N6 (Total Tertimbang) = E6 + F6 + G6 + H6 + I6 + J6 + K6 (penjumlahan seluruh nilai berbobot 7 indikator).',
      'O6 (Konversi Bobot) = Total Bobot Indikator Aktif / 100. Jika 7 indikator aktif semua (bobot 100%), maka O6 = 100%.',
      'P6 (Dispensasi SPM) = Poin pengurang yang langsung memotong nilai akhir IKPA dari rasio SPM dispensasi TW IV.',
      'Q6 (Nilai Akhir) = (N6 / O6) - P6, dibatasi antara 0 sampai 100 dengan pembulatan 2 desimal (ROUND 2).',
      'MENGAPA NILAI TIDAK OTOMATIS 0 JIKA DATA KOSONG? Pada IKPA regulasi DJPb, jika satker tidak melakukan revisi DIPA (0 revisi), nilainya maksimal 100 karena dinilai tertib. Pada simulasi ini, tombol "Mulai dari 0 (Kosongkan)" dirancang khusus agar benar-benar membersihkan seluruh indikator menjadi 0.00.',
      'SANGAT BAIK = Skor >= 95.00 | BAIK = 89.00 s.d. 94.99 | CUKUP = 70.00 s.d. 88.99 | KURANG = < 70.00.'
    ],
    tipsNilai100: [
      'Prioritaskan Indikator Berbobot Besar: Capaian Output (25%) dan Penyerapan Anggaran (20%) menguasai 45% dari total bobot IKPA.',
      'Hindari Penalti Dispensasi SPM: Jangan sampai mengajukan dispensasi SPM di Triwulan IV karena akan langsung memotong nilai akhir di Sel P6.',
      'Kendalikan Deviasi Hal III: Selalu mutakhirkan RPD Halaman III DIPA pada setiap awal triwulan (Januari, April, Juli, Oktober) agar gap deviasi < 5%.',
      'Pantau Status Data: Pastikan seluruh indikator berstatus hijau "Sudah dihitung" agar nilai mencerminkan performa nyata satker.',
      'Gunakan Sandbox Simulator: Rencanakan strategi pencapaian target satker dengan menggeser slider pada Sandbox sebelum mengeksekusi anggaran riil.'
    ],
    panduanTombol: [
      { namaTombol: 'Pilih Bulan (01 s.d. 12)', keterangan: 'Mengatur cut-off evaluasi kumulatif secara dinamis untuk melihat progres capaian per bulan.' },
      { namaTombol: 'Mulai dari 0 (Kosongkan)', keterangan: 'Membersihkan seluruh data pada semua modul indikator sehingga total nilai dan seluruh rincian kembali ke 0.' },
      { namaTombol: 'Petunjuk Pengisian & Rumus', keterangan: 'Membuka/menutup panduan komprehensif, alur kerja, kamus kolom, dan rumus Excel pada halaman ini.' },
      { namaTombol: 'Mode Tampilan (Dashboard / Excel)', keterangan: 'Beralih antara tampilan kartu visual interaktif dan tampilan format sheet Excel Workbook.' },
      { namaTombol: 'Buka (pada tabel)', keterangan: 'Membuka langsung tab modul indikator bersangkutan untuk menginput data atau mengedit detail.' },
      { namaTombol: 'Formula Inspector (Kalkulator)', keterangan: 'Menampilkan modal audit perhitungan transparan langkah demi langkah sesuai formula Excel.' },
      { namaTombol: 'Sandbox What-If Matrix', keterangan: 'Membuka panel simulasi interaktif untuk menggeser nilai 7 indikator secara bebas tanpa mengubah data proyek.' }
    ]
  },
  'revisi-dipa': {
    id: 'revisi-dipa',
    title: 'Indikator 1: Revisi DIPA',
    bobot: '10%',
    aspek: 'Kualitas Perencanaan Anggaran',
    color: 'indigo',
    deskripsiSingkat:
      'Mengukur frekuensi revisi DIPA yang menjadi kewenangan Kanwil DJPb / DJA per semester. Hanya revisi pada kategori Pagu Tetap yang dihitung sebagai pengurang nilai jika melebihi 1 kali per semester.',
    alurKerjaCepat: [
      {
        step: 1,
        title: 'Buka SAKTI Modul Penganggaran',
        description: 'Buka menu riwayat revisi DIPA satker untuk mencatat nomor pengesahan SP DIPA, tanggal, dan pagu sebelum serta sesudah revisi.',
        highlight: 'Ambil riwayat revisi resmi per semester'
      },
      {
        step: 2,
        title: 'Isi Kolom Input Manual (01 s.d. 12)',
        description: 'Isi kolom "Revisi Ke", "Tanggal SP DIPA", "Pagu Sebelum", "Pagu Menjadi", dan tentukan "14 Jenis Revisi" (pilih "ya" jika masuk 14 kriteria revisi yang diperhitungkan).',
        highlight: 'Jika pagu berubah, revisi tidak dihitung (Pagu Berubah)'
      },
      {
        step: 3,
        title: 'Periksa Validasi & Klik "Perhitungkan Indikator Ini"',
        description: 'Pastikan banner validasi berwarna hijau. Klik tombol hijau "Perhitungkan Indikator Ini" untuk melihat rincian langkah rumus (M15/G6) dan menyimpan skor ke simulasi total.',
        highlight: 'Skor tersimpan otomatis ke total IKPA'
      }
    ],
    kolomInputManual: [
      { nama: 'Revisi Ke (Kolom C)', keterangan: 'Nomor urut pengesahan revisi DIPA (misal: 1, 2, 3).' },
      { nama: 'Tanggal SP DIPA (Kolom D)', keterangan: 'Tanggal terbit pengesahan DIPA revisi (format YYYY-MM-DD).' },
      { nama: 'Pagu DIPA Sebelum (Kolom F)', keterangan: 'Total nominal rupiah pagu DIPA sebelum revisi dilakukan.' },
      { nama: 'Pagu DIPA Menjadi (Kolom G)', keterangan: 'Total nominal rupiah pagu DIPA setelah pengesahan revisi.' },
      { nama: '14 Jenis Revisi (Kolom H)', keterangan: 'Pilih "ya" jika revisi masuk dalam 14 kriteria yang dibatasi, atau "tidak" jika dikecualikan.' }
    ],
    kolomOtomatisSistem: [
      { nama: 'Pagu Tetap? (Kolom E)', keterangan: 'Otomatis "ya" jika Pagu Sebelum sama dengan Pagu Menjadi.' },
      { nama: 'Dihitung? (Kolom I)', keterangan: 'Bernilai 1 jika Pagu Tetap = "ya" DAN 14 Jenis Revisi = "ya".' },
      { nama: 'Jumlah Revisi Sem I & II (Kolom J)', keterangan: 'Menghitung akumulasi frekuensi revisi semesteran (J9 untuk Sem I, J15 untuk Sem II).' },
      { nama: 'Nilai Semester (Kolom L)', keterangan: 'L9 = 100 - (Revisi Sem I - 1)*10; L15 = 100 - (Revisi Sem II - 1)*10.' },
      { nama: 'Nilai Akhir (M15 / G6)', keterangan: 'Rata-rata L9 dan L15, dibatasi maksimal 100 poin.' }
    ],
    sumberData: [
      'SAKTI Modul Penganggaran (Riwayat Revisi DIPA)',
      'Surat Pengesahan DIPA Petikan dari Kanwil DJPb / DJA',
      'Format Sheet Excel: Revisi DIPA (Baris 5 s.d. 14)'
    ],
    langkahPengisian: [
      { kolom: 'Periode (01 s.d. 12)', tipe: 'Otomatis', keterangan: 'Baris 01-06 mewakili Semester I, baris 07-12 mewakili Semester II.' },
      { kolom: 'Revisi Ke', tipe: 'Input', keterangan: 'Nomor pengesahan revisi. Kosongkan jika pada bulan tersebut tidak ada revisi.' },
      { kolom: 'Tanggal Pengesahan', tipe: 'Input', keterangan: 'Tanggal terbit SP DIPA Revisi.' },
      { kolom: 'Pagu DIPA Sebelum & Menjadi', tipe: 'Input', keterangan: 'Ketik nominal rupiah pagu total sebelum dan sesudah revisi.' },
      { kolom: '14 Jenis Revisi', tipe: 'Input', keterangan: 'Pilih "ya" jika revisi termasuk kriteria yang dihitung (kewenangan Kanwil/DJPb), pilih "tidak" jika pengecualian.' },
      { kolom: 'Diperhitungkan (I)', tipe: 'Otomatis', keterangan: 'Bernilai 1 jika revisi mengurangi frekuensi, 0 jika tidak dihitung.' }
    ],
    rumusExcel: "=IF(M15 > 100, 100, M15) di mana M15 = AVERAGE(L9, L15)",
    penjelasanRumus: [
      'Toleransi: Maksimal 1 kali revisi DIPA berkategori Pagu Tetap per semester.',
      'Jika revisi per semester = 1 kali, maka Nilai Semester = 100.',
      'Jika revisi per semester = 2 kali, maka Nilai Semester = 50.',
      'Jika revisi per semester >= 3 kali, maka Nilai Semester = 0.',
      'Jika suatu semester tidak ada revisi sama sekali (0 kali), nilai semester dihitung 110 (reward) namun hasil akhir tetap di-cap 100.',
      'Revisi yang menyebabkan perubahan pagu total (Pagu Berubah) otomatis tidak dihitung.'
    ],
    tipsNilai100: [
      'Rencanakan usulan perubahan anggaran secara komprehensif sehingga cukup 1 kali revisi pagu tetap dalam satu semester.',
      'Manfaatkan klausul revisi yang masuk 14 jenis pengecualian resmi (seperti revisi administratif, pergeseran antar rincian output prioritas, atau arahan Presiden).',
      'Ajukan usulan revisi semester I sebelum batas waktu akhir triwulan II.'
    ],
    panduanTombol: [
      { namaTombol: 'Perhitungkan Indikator Ini', keterangan: 'Menghitung nilai akhir, membuka modal audit transparansi, dan menyimpan skor ke simulasi IKPA.' },
      { namaTombol: 'Formula Inspector', keterangan: 'Melihat rincian formula Excel M15/G6 dan keterkaitan sel pendukungnya.' },
      { namaTombol: 'Daftar 14 Jenis Revisi', keterangan: 'Membuka referensi resmi jenis revisi apa saja yang masuk hitungan vs yang dikecualikan.' },
      { namaTombol: 'Reset Standar Excel', keterangan: 'Mengembalikan seluruh data tabel ke data contoh workbook resmi.' }
    ]
  },

  'deviasi-hal3': {
    id: 'deviasi-hal3',
    title: 'Indikator 2: Deviasi Halaman III DIPA',
    bobot: '15%',
    aspek: 'Kualitas Perencanaan Anggaran',
    color: 'sky',
    deskripsiSingkat:
      'Mengukur keselarasan antara Rencana Penarikan Dana (RPD) bulanan pada Halaman III DIPA dengan realisasi anggaran riil per jenis belanja (51, 52, 53, 57). Ambang batas toleransi rata-rata deviasi adalah 5%.',
    alurKerjaCepat: [
      {
        step: 1,
        title: 'Ambil Data RPD & Realisasi Bulanan',
        description: 'Buka Halaman III DIPA (tabel RPD bulanan) dan LRA Bulanan SAKTI/OMSPAN untuk periode bulan 1 s.d. 12.',
        highlight: 'Siapkan angka nominal belanja 51, 52, 53, 57'
      },
      {
        step: 2,
        title: 'Ketik Kolom Rencana & Penyerapan',
        description: 'Masukkan angka pada kolom "Rencana" (B:E) dan kolom "Penyerapan" (F:I) untuk jenis belanja yang dimiliki satker (Pegawai 51, Barang 52, Modal 53, Bansos 57).',
        highlight: 'Kolom deviasi dan persentase dihitung otomatis'
      },
      {
        step: 3,
        title: 'Cek Rata-Rata Kumulatif & Simpan',
        description: 'Lihat sel AA16 (% Rata-rata Kumulatif). Jika <= 5%, nilai IKPA akan sempurna 100. Klik tombol "Perhitungkan Indikator Ini" untuk menyimpan.',
        highlight: 'Target: Rata-rata deviasi <= 5%'
      }
    ],
    kolomInputManual: [
      { nama: 'Rencana Belanja 51, 52, 53, 57 (B:E)', keterangan: 'Nominal rupiah rencana penarikan dana bulanan dari Halaman III DIPA.' },
      { nama: 'Penyerapan Belanja 51, 52, 53, 57 (F:I)', keterangan: 'Nominal rupiah realisasi penyerapan anggaran riil per bulan dari SP2D.' }
    ],
    kolomOtomatisSistem: [
      { nama: 'Deviasi Nominal (J:M)', keterangan: 'Selisih mutlak antara Rencana dan Penyerapan: ABS(Penyerapan - Rencana).' },
      { nama: '% Deviasi (N:Q)', keterangan: 'Persentase deviasi terhadap rencana: (Deviasi Nominal / Rencana) * 100%.' },
      { nama: 'Proporsi Pagu (R:U)', keterangan: 'Bobot proporsi belanja terhadap total pagu satker.' },
      { nama: 'Deviasi Tertimbang (V:Y)', keterangan: '% Deviasi × Proporsi Pagu. Khusus Bulan Maret (03), belanja 51 & 52 otomatis bernilai 0% (dispensasi nasional).' },
      { nama: 'Rata-Rata Kumulatif (AA)', keterangan: 'Rata-rata kumulatif deviasi bulanan sampai dengan periode berjalan.' },
      { nama: 'Nilai IKPA (AB16 / H6)', keterangan: 'Formula: IF(AA16 <= 5, 100, 100 - AA16).' }
    ],
    sumberData: [
      'Halaman III DIPA Petikan Satker (Tabel RPD Bulanan per Jenis Belanja)',
      'Laporan Realisasi Anggaran (LRA) Bulanan SAKTI Modul Pelaporan / SPAN / OMSPAN',
      'Format Sheet Excel: Deviasi Hal III DIPA (Baris 5 s.d. 16)'
    ],
    langkahPengisian: [
      { kolom: 'Periode (01 s.d. 12)', tipe: 'Otomatis', keterangan: '12 Periode Bulanan (01 = Januari s.d. 12 = Desember).' },
      { kolom: 'Rencana Belanja 51, 52, 53, 57', tipe: 'Input', keterangan: 'Target RPD bulanan per jenis belanja dari Halaman III DIPA.' },
      { kolom: 'Penyerapan Belanja 51, 52, 53, 57', tipe: 'Input', keterangan: 'Realisasi penyerapan anggaran riil per jenis belanja pada bulan bersangkutan.' },
      { kolom: 'Proporsi Pagu Belanja', tipe: 'Otomatis', keterangan: 'Dihitung otomatis dari total pagu masing-masing jenis belanja.' },
      { kolom: 'Deviasi Tertimbang', tipe: 'Otomatis', keterangan: 'Dihitung otomatis per jenis belanja dan dijumlahkan.' },
      { kolom: 'Rata-Rata Kumulatif (AA)', tipe: 'Otomatis', keterangan: 'Menghitung deviasi rata-rata kumulatif s.d. bulan berjalan.' }
    ],
    rumusExcel: "=IF(AA16 <= 5, 100, 100 - AA16)",
    penjelasanRumus: [
      'Deviasi nominal dihitung per jenis belanja: |Penyerapan - Rencana|.',
      'Persentase deviasi dihitung terhadap rencana belanja bulanan.',
      'Sesuai PER-5/PB/2024 dan SE Kemenkeu, toleransi rata-rata deviasi adalah 5%.',
      'Jika rata-rata deviasi <= 5%, maka nilai indikator = 100 (sempurna).',
      'Jika rata-rata deviasi > 5%, maka nilai indikator = 100 - rata-rata deviasi.',
      'Khusus Bulan Maret, deviasi tertimbang belanja 51 & 52 diberikan dispensasi 0%.'
    ],
    tipsNilai100: [
      'Lakukan Pemutakhiran Halaman III DIPA secara disiplin pada 10 hari kerja pertama awal triwulan (Maret, Juni, September).',
      'Sesuaikan RPD bulanan dengan jadwal penerbitan SP2D riil agar penyerapan presisi dengan rencana.',
      'Jaga agar rata-rata deviasi kumulatif tidak melebihi angka toleransi 5,00%.'
    ],
    panduanTombol: [
      { namaTombol: 'Perhitungkan Indikator Ini', keterangan: 'Mengunci hasil perhitungan deviasi, membuka audit rumus, dan memperbarui skor proyek.' },
      { namaTombol: 'Lihat Detail Perhitungan', keterangan: 'Membuka panel audit cross-check per bulan dan per jenis belanja (51, 52, 53, 57).' },
      { namaTombol: 'Formula Inspector', keterangan: 'Melihat sel acuan AB16 dan langkah perhitungan matematis.' },
      { namaTombol: 'Simulasi What-If', keterangan: 'Menguji skenario perbaikan penyerapan untuk melihat dampaknya terhadap nilai IKPA.' }
    ]
  },

  'penyerapan': {
    id: 'penyerapan',
    title: 'Indikator 3: Penyerapan Anggaran',
    bobot: '20%',
    aspek: 'Kualitas Pelaksanaan Anggaran',
    color: 'emerald',
    deskripsiSingkat:
      'Mengukur proporsi realisasi belanja terhadap pagu DIPA per triwulan (TW I s.d. TW IV) per jenis belanja (51, 52, 53, 57) terhadap target triwulanan nasional.',
    alurKerjaCepat: [
      {
        step: 1,
        title: 'Cek Pagu DIPA, Blokir, & Realisasi di OMSPAN',
        description: 'Buka menu Monitoring Penyerapan Anggaran di OMSPAN untuk mencatat Pagu DIPA, Pagu Blokir, dan Realisasi per jenis belanja.',
        highlight: 'Pagu blokir otomatis mengurangi pagu dasar'
      },
      {
        step: 2,
        title: 'Input Data Triwulan yang Dievaluasi',
        description: 'Masukkan angka Pagu DIPA, Pagu Blokir, dan Realisasi Kumulatif untuk Belanja Pegawai (51), Barang (52), Modal (53), dan Bansos (57).',
        highlight: 'Target nasional triwulanan terisi otomatis'
      },
      {
        step: 3,
        title: 'Validasi & Klik "Perhitungkan Indikator Ini"',
        description: 'Sistem menghitung rasio penyerapan vs target (NKPA). Rata-rata triwulan dihitung menjadi Nilai Akhir (Q71). Klik tombol hijau untuk menyimpan.',
        highlight: 'Bobot 20% terhadap total IKPA'
      }
    ],
    kolomInputManual: [
      { nama: 'Pagu DIPA (Kolom B:E)', keterangan: 'Nominal rupiah pagu total DIPA satker per jenis belanja (51, 52, 53, 57).' },
      { nama: 'Pagu Blokir (Kolom F:I)', keterangan: 'Nominal rupiah dana yang masih diberi tanda blokir (tanda bintang *). Jika tidak ada blokir, isi 0.' },
      { nama: 'Realisasi Kumulatif (Kolom J:M)', keterangan: 'Nominal rupiah realisasi SP2D kumulatif s.d. akhir periode triwulan bersangkutan.' }
    ],
    kolomOtomatisSistem: [
      { nama: 'Pagu Netto', keterangan: 'Pagu DIPA dikurangi Pagu Blokir. Hanya pagu netto yang menjadi pembagi penyerapan.' },
      { nama: 'Target Triwulanan (%)', keterangan: 'Target resmi PER-5: TW I (51:20%, 52:15%, 53:10%), TW II (50%), TW III (51:75%, 52/53:70%), TW IV (51:95%, 52/53:90%).' },
      { nama: 'NKPA per Jenis Belanja', keterangan: 'Rasio persentase realisasi terhadap target triwulanan (maksimal 100 per jenis belanja).' },
      { nama: 'Nilai Triwulan (P17, P35, P53, P71)', keterangan: 'Penjumlahan tertimbang NKPA seluruh jenis belanja pada masing-masing triwulan.' },
      { nama: 'Nilai Akhir (Q71)', keterangan: 'Rata-rata nilai triwulan: AVERAGE(P17, P35, P53, P71).' }
    ],
    sumberData: [
      'DIPA Petikan Satker (Pagu & Catatan Blokir per Jenis Belanja: 51, 52, 53, 57)',
      'Laporan Realisasi SP2D SAKTI Modul Pembayaran / OMSPAN Penyerapan',
      'Format Sheet Excel: Penyerapan Anggaran (Baris 5 s.d. 71)'
    ],
    langkahPengisian: [
      { kolom: 'Pagu & Blokir (B:E & F:I)', tipe: 'Input', keterangan: 'Pagu DIPA dan nilai blokir untuk Belanja Pegawai (51), Barang (52), Modal (53), dan Bansos (57).' },
      { kolom: 'Realisasi Kumulatif (J:M)', tipe: 'Input', keterangan: 'Akumulasi realisasi belanja s.d. akhir periode triwulan yang dihitung.' },
      { kolom: 'Pagu Netto', tipe: 'Otomatis', keterangan: 'Pagu dikurangi blokir. Hanya pagu netto yang dihitung.' },
      { kolom: 'Target (%)', tipe: 'Otomatis', keterangan: 'Target penyerapan triwulanan sesuai ketentuan PER-5/PB/2024.' },
      { kolom: 'NKPA per Jenis Belanja', tipe: 'Otomatis', keterangan: 'Rasio realisasi terhadap target triwulanan (maksimal 100).' },
      { kolom: 'Nilai Triwulan (P)', tipe: 'Otomatis', keterangan: 'Penjumlahan tertimbang NKPA seluruh jenis belanja per triwulan.' }
    ],
    rumusExcel: "=AVERAGE(P17, P35, P53, P71) di mana P17=TW I, P35=TW II, P53=TW III, P71=TW IV",
    penjelasanRumus: [
      'Target minimal penyerapan triwulanan PER-5/PB/2024:',
      '• Triwulan I: Belanja Pegawai 20%, Belanja Barang 15%, Belanja Modal 10%.',
      '• Triwulan II: Belanja Pegawai 50%, Belanja Barang 50%, Belanja Modal 50%.',
      '• Triwulan III: Belanja Pegawai 75%, Belanja Barang 70%, Belanja Modal 70%.',
      '• Triwulan IV: Belanja Pegawai 95%, Belanja Barang 90%, Belanja Modal 90%.',
      'Pagu yang diblokir otomatis dikeluarkan dari perhitungan pagu penyerapan.',
      'Capaian realisasi melebihi target tetap dihitung maksimal 100 per jenis belanja.'
    ],
    tipsNilai100: [
      'Dorong percepatan realisasi belanja sejak Triwulan I agar target triwulanan terlampaui.',
      'Segera selesaikan persyaratan pembukaan blokir anggaran di awal tahun jika dokumen pemenuhan telah lengkap.',
      'Hindari penumpukan pengajuan tagihan SPM di Triwulan IV.'
    ],
    panduanTombol: [
      { namaTombol: 'Perhitungkan Indikator Ini', keterangan: 'Menghitung nilai rata-rata triwulan dan mengupdate nilai indikator penyerapan ke proyek.' },
      { namaTombol: 'Formula Inspector', keterangan: 'Mengecek formula AVERAGE(P17, P35, P53, P71) dan detail tiap triwulan.' },
      { namaTombol: 'Uji 16 Golden Tests', keterangan: 'Memverifikasi akurasi perhitungan terhadap 16 kasus uji resmi workbook.' },
      { namaTombol: 'Simulasi What-If', keterangan: 'Menggeser slider akselerasi untuk melihat potensi kenaikan nilai jika realisasi dipercepat.' }
    ]
  },

  'kontraktual': {
    id: 'kontraktual',
    title: 'Indikator 4: Belanja Kontraktual',
    bobot: '10%',
    aspek: 'Kualitas Pelaksanaan Anggaran',
    color: 'amber',
    deskripsiSingkat:
      'Mengukur kepatuhan pendaftaran data kontrak ke KPPN maksimal 5 hari kerja, percepatan lelang/kontrak dini pra-DIPA, dan akselerasi belanja modal (53) sebelum triwulan III.',
    alurKerjaCepat: [
      {
        step: 1,
        title: 'Buka SAKTI Modul Komitmen (Karwas Kontrak)',
        description: 'Buka menu Karwas Kontrak / CAN di SAKTI untuk melihat daftar nomor kontrak, tanggal tanda tangan, dan tanggal pendaftaran ke KPPN.',
        highlight: 'Ambil daftar kontrak/SPK satker'
      },
      {
        step: 2,
        title: 'Input Baris Kontrak Satker',
        description: 'Masukkan Nomor Kontrak, Tanggal Kontrak, Tanggal Pendaftaran ke KPPN, Nilai Kontrak (Rupiah), Akun Belanja (52/53), dan tandai apakah Kontrak Dini.',
        highlight: 'Batas pendaftaran: 5 hari kerja'
      },
      {
        step: 3,
        title: 'Sistem Menghitung 3 Komponen',
        description: 'Sistem menghitung Ketepatan Pendaftaran (20%), Kontrak Dini (40%), dan Akselerasi Belanja Modal 53 (40%). Klik "Perhitungkan Indikator Ini" untuk menyimpan.',
        highlight: 'Formula N30 menggabungkan 3 komponen'
      }
    ],
    kolomInputManual: [
      { nama: 'Nomor Kontrak / SPK', keterangan: 'Nomor resmi dokumen kontrak atau Surat Perintah Kerja.' },
      { nama: 'Tanggal Kontrak', keterangan: 'Tanggal penandatanganan kontrak oleh Pejabat Pembuat Komitmen (PPK).' },
      { nama: 'Tanggal Pendaftaran KPPN', keterangan: 'Tanggal diterimanya resume kontrak oleh KPPN via SAKTI.' },
      { nama: 'Nilai Kontrak (Rupiah)', keterangan: 'Total nominal rupiah perjanjian kontrak.' },
      { nama: 'Akun Belanja (52 / 53)', keterangan: 'Pilih jenis belanja: Belanja Modal (53) atau Belanja Barang Non-Operasional (52).' },
      { nama: 'Kategori Kontrak Dini', keterangan: 'Pilih jenis kontrak: Kontrak Pra-DIPA, Kontrak Dini TW I, atau Kontrak Reguler.' }
    ],
    kolomOtomatisSistem: [
      { nama: 'Selisih Hari Kerja', keterangan: 'Jumlah hari kerja antara tanggal kontrak dan tanggal pendaftaran (hari libur/weekend tidak dihitung).' },
      { nama: 'Status Ketepatan', keterangan: '"Tepat Waktu" jika <= 5 Hari Kerja; "Terlambat" jika > 5 Hari Kerja.' },
      { nama: 'Skor Pendaftaran (N29)', keterangan: 'Proporsi kontrak tepat waktu dengan bobot 20%.' },
      { nama: 'Skor Kontrak Dini (O29)', keterangan: 'Penilaian kontrak dini pra-DIPA / awal tahun dengan bobot 40%.' },
      { nama: 'Skor Akselerasi 53 (P29)', keterangan: 'Penyelesaian kontrak modal sebelum Triwulan III dengan bobot 40%.' },
      { nama: 'Nilai Indikator (N30)', keterangan: 'Nilai gabungan ketiga komponen: N29 + O29 + P29 (maksimal 100).' }
    ],
    sumberData: [
      'SAKTI Modul Komitmen (Daftar CAN/Karwas Kontrak & Tanggal BAST)',
      'Data Pendaftaran Kontrak KPPN (SPAN / OMSPAN Karwas Kontrak)',
      'Format Sheet Excel: Belanja Kontraktual'
    ],
    langkahPengisian: [
      { kolom: 'No & Nomor Kontrak', tipe: 'Input', keterangan: 'Nomor identifikasi kontrak/SPK/perjanjian kerja sama.' },
      { kolom: 'Tanggal Kontrak / SPK', tipe: 'Input', keterangan: 'Tanggal penandatanganan kontrak oleh PPK.' },
      { kolom: 'Tanggal Pendaftaran KPPN', tipe: 'Input', keterangan: 'Tanggal penyampaian resume kontrak ke KPPN via SAKTI.' },
      { kolom: 'Nilai Kontrak & Akun', tipe: 'Input', keterangan: 'Nominal kontrak dan akun belanja (Belanja Modal 53 atau Belanja Barang 52).' },
      { kolom: 'Ketepatan Pendaftaran', tipe: 'Otomatis', keterangan: 'Tepat Waktu jika pendaftaran <= 5 Hari Kerja sejak tanggal kontrak.' }
    ],
    rumusExcel: "=ROUND(IF((20%*Distribusi + 40%*KontrakDini + 40%*Akselerasi53) > 100, 100, ...), 2)",
    penjelasanRumus: [
      'Ketepatan waktu pendaftaran kontrak: Wajib didaftarkan ke KPPN paling lambat 5 hari kerja setelah penandatanganan.',
      'Akselerasi belanja modal (53): Kontrak belanja modal yang diselesaikan sebelum Triwulan III mendapat bobot 40%.',
      'Kontrak dini pra-DIPA: Kontrak yang ditandatangani sebelum tahun anggaran berjalan memberikan kontribusi 40%.',
      'Jika satker tidak memiliki belanja modal (53), bobot dialihkan ke komponen ketepatan pendaftaran.'
    ],
    tipsNilai100: [
      'Daftarkan resume kontrak ke KPPN secara realtime pada hari yang sama atau maksimal 3 hari kerja setelah ditandatangani.',
      'Laksanakan pengadaan belanja modal 53 di awal tahun (Triwulan I atau II) agar tuntas sebelum September.',
      'Manfaatkan skema lelang pra-DIPA sebelum tahun anggaran dimulai.'
    ],
    panduanTombol: [
      { namaTombol: 'Perhitungkan Indikator Ini', keterangan: 'Menghitung nilai gabungan 3 komponen dan menyimpan hasil ke simulasi proyek.' },
      { namaTombol: 'Formula Inspector', keterangan: 'Mengecek formula Excel sel N30 dan rincian langkah perhitungan.' },
      { namaTombol: 'Audit Excel', keterangan: 'Menjalankan pengujian otomatis terhadap data acuan resmi.' },
      { namaTombol: 'Tambah Baris Kontrak', keterangan: 'Menambahkan baris transaksi kontrak baru.' }
    ]
  },

  'tagihan': {
    id: 'tagihan',
    title: 'Indikator 5: Penyelesaian Tagihan',
    bobot: '10%',
    aspek: 'Kualitas Pelaksanaan Anggaran',
    color: 'violet',
    deskripsiSingkat:
      'Mengukur ketepatan waktu penyelesaian tagihan pihak ketiga dengan menerbitkan SPM-LS non-belanja pegawai ke KPPN maksimal 17 hari kerja sejak timbulnya hak tagih (BAST).',
    alurKerjaCepat: [
      {
        step: 1,
        title: 'Kumpulkan Data BAST & SPM-LS',
        description: 'Buka SAKTI Modul Pembayaran untuk mencatat Nomor & Tanggal BAST (Berita Acara Serah Terima) serta Tanggal terbit SPM-LS non-pegawai.',
        highlight: 'Batas toleransi: 17 hari kerja'
      },
      {
        step: 2,
        title: 'Input Baris Tagihan pada Tabel',
        description: 'Ketik Nomor BAST, Tanggal BAST, Nomor SPM, Tanggal SPM, dan Nilai Tagihan (Rupiah).',
        highlight: 'Sistem menghitung selisih hari kerja otomatis'
      },
      {
        step: 3,
        title: 'Lihat Rasio Ketepatan & Simpan',
        description: 'Sistem menganalisis apakah SPM <= 17 hari kerja (Tepat Waktu). Nilai = (SPM Tepat Waktu / Total SPM) * 100. Klik tombol hijau untuk menyimpan.',
        highlight: 'Target: 100% tepat waktu'
      }
    ],
    kolomInputManual: [
      { nama: 'Nomor BAST / Hak Tagih', keterangan: 'Nomor Berita Acara Serah Terima pekerjaan atau dokumen timbulnya hak tagih.' },
      { nama: 'Tanggal BAST', keterangan: 'Tanggal resmi penandatanganan serah terima pekerjaan/barang.' },
      { nama: 'Nomor SPM', keterangan: 'Nomor Surat Perintah Membayar (SPM-LS) yang diterbitkan PPSPM.' },
      { nama: 'Tanggal SPM', keterangan: 'Tanggal penerbitan SPM oleh Satker ke KPPN.' },
      { nama: 'Nilai SPM (Rupiah)', keterangan: 'Nominal rupiah tagihan yang dibayarkan.' }
    ],
    kolomOtomatisSistem: [
      { nama: 'Selisih Hari Kerja', keterangan: 'Jumlah hari kerja antara Tanggal BAST dan Tanggal SPM (weekend & libur nasional tidak dihitung).' },
      { nama: 'Status Ketepatan', keterangan: '"Tepat Waktu" jika selisih <= 17 hari kerja; "Terlambat" jika selisih > 17 hari kerja.' },
      { nama: 'Jumlah SPM Tepat Waktu', keterangan: 'Total baris SPM yang berstatus Tepat Waktu.' },
      { nama: 'Rasio Ketepatan (%)', keterangan: '(Jumlah Tepat Waktu / Total SPM) × 100%.' },
      { nama: 'Nilai IKPA (G10)', keterangan: 'Nilai persentase ketepatan, maksimal 100 poin.' }
    ],
    sumberData: [
      'SAKTI Modul Pembayaran (SPM-LS Non-Belanja Pegawai)',
      'Berita Acara Serah Terima (BAST) / Berita Acara Penyelesaian Pekerjaan (BAPP)',
      'Format Sheet Excel: Penyelesaian Tagihan'
    ],
    langkahPengisian: [
      { kolom: 'Nomor BAST / Dokumen Hak', tipe: 'Input', keterangan: 'Nomor dokumen serah terima pekerjaan/barang.' },
      { kolom: 'Tanggal BAST', tipe: 'Input', keterangan: 'Tanggal penyelesaian pekerjaan yang disepakati.' },
      { kolom: 'Nomor & Tanggal SPM', tipe: 'Input', keterangan: 'Tanggal penerbitan SPM-LS Non-Pegawai oleh PPSPM.' },
      { kolom: 'Hari Kerja (BAST s.d. SPM)', tipe: 'Otomatis', keterangan: 'Jumlah hari kerja antara tanggal BAST dan tanggal SPM (hari libur tidak dihitung).' },
      { kolom: 'Status Ketepatan', tipe: 'Otomatis', keterangan: 'Tepat Waktu jika <= 17 Hari Kerja; Terlambat jika > 17 Hari Kerja.' }
    ],
    rumusExcel: "=IF(COUNT(D5:D) = 0, 100, (COUNTIF(Status, 'Tepat Waktu') / Total_SPM) * 100)",
    penjelasanRumus: [
      'Batas penyelesaian tagihan kontraktual (SPM-LS non belanja pegawai) adalah maksimal 17 hari kerja sejak timbulnya hak tagih (BAST).',
      'Nilai indikator merupakan persentase jumlah SPM yang tepat waktu (<=17 HK) dibandingkan seluruh SPM yang diajukan.',
      'Jika tidak ada tagihan kontraktual pada satker bersangkutan, nilai default dihitung 100.'
    ],
    tipsNilai100: [
      'Segera lakukan pengujian berkas tagihan oleh PPK maksimal 5 hari kerja sejak BAST diterima.',
      'Terbitkan SPP dan ajukan SPM oleh PPSPM dalam waktu maksimal 5 hari kerja berikutnya.',
      'Jangan menandatangani BAST jika rekanan belum siap menyampaikan tagihan fisik secara lengkap.'
    ],
    panduanTombol: [
      { namaTombol: 'Perhitungkan Indikator Ini', keterangan: 'Menghitung rasio ketepatan SPM dan menyimpan nilai tagihan ke proyek aktif.' },
      { namaTombol: 'Formula Inspector', keterangan: 'Melihat formula Excel sel G10 dan rincian langkah perhitungan.' },
      { namaTombol: 'Tambah Baris Tagihan', keterangan: 'Menambahkan baris data tagihan BAST baru.' }
    ]
  },

  'up-tup': {
    id: 'up-tup',
    title: 'Indikator 6: Pengelolaan UP dan TUP',
    bobot: '10%',
    aspek: 'Kualitas Pelaksanaan Anggaran',
    color: 'teal',
    deskripsiSingkat:
      'Mengukur kepatuhan revolving GUP (minimal 1 kali per bulan untuk UP Tunai dan pertanggungjawaban TUP <= 30 hari kalender), serta optimalisasi penggunaan Kartu Kredit Pemerintah (KKP).',
    alurKerjaCepat: [
      {
        step: 1,
        title: 'Buka Buku Kas Umum & Karwas UP SAKTI',
        description: 'Buka Modul Bendahara di SAKTI untuk mencatat tanggal SP2D UP, SP2D GUP berkala, SP2D TUP, dan bukti setor sisa TUP.',
        highlight: 'Revolving GUP minimal 1x per bulan'
      },
      {
        step: 2,
        title: 'Input Data UP/TUP Tunai & KKP',
        description: 'Pada Tab Tunai, isi riwayat tanggal SP2D GUP dan penyelesaian TUP. Pada Tab KKP, masukkan besaran pagu UP KKP dan realisasi transaksi bulanan.',
        highlight: 'Komposisi: 90% Tunai + 10% KKP'
      },
      {
        step: 3,
        title: 'Periksa Nilai Tertimbang & Simpan',
        description: 'Sistem menghitung nilai gabungan UP Tunai (90%) dan KKP (10%). Klik "Perhitungkan Indikator Ini" untuk menyimpan ke skor total.',
        highlight: 'Maksimal nilai kombinasi 100 poin'
      }
    ],
    kolomInputManual: [
      { nama: 'Pagu UP Awal', keterangan: 'Besaran nominal Uang Persediaan awal tahun yang disetujui KPPN.' },
      { nama: 'Tanggal SP2D GUP (Revolving)', keterangan: 'Tanggal terbit SP2D GUP penggantian kas dari KPPN.' },
      { nama: 'Tanggal SP2D TUP & PTUP', keterangan: 'Tanggal terbit SP2D TUP dan tanggal penyampaian pertanggungjawaban TUP.' },
      { nama: 'Pagu & Realisasi KKP Bulanan', keterangan: 'Besaran proporsi target KKP dan nominal transaksi belanja menggunakan KKP.' }
    ],
    kolomOtomatisSistem: [
      { nama: 'Selisih Hari Kalender GUP/TUP', keterangan: 'Jumlah hari kalender antara revolving dan pertanggungjawaban (maksimal 30 hari).' },
      { nama: 'Frekuensi Revolving Bulanan', keterangan: 'Menghitung apakah dalam satu bulan terdapat minimal 1 kali revolving GUP.' },
      { nama: 'Skor UP Tunai (Q28)', keterangan: 'Gabungan ketepatan revolving, revolving disebulankan, dan penyelesaian TUP.' },
      { nama: 'Skor UP KKP (J16)', keterangan: 'Capaian proporsi transaksi belanja via Kartu Kredit Pemerintah.' },
      { nama: 'Nilai Akhir Indikator (N8)', keterangan: 'Formula: ROUND(IF(N7>100, 100, (90%*Tunai)+(10%*KKP)), 2).' }
    ],
    sumberData: [
      'SAKTI Modul Bendahara (Buku Kas Umum, Karwas UP/TUP)',
      'SP2D GUP, SPM PTUP, dan Bukti Setor Sisa UP/TUP (SSPB/SSBP)',
      'Data Transaksi Kartu Kredit Pemerintah (KKP)',
      'Format Sheet Excel: Pengelolaan UP TUP KKP'
    ],
    langkahPengisian: [
      { kolom: 'Ketepatan Revolving UP (Q27)', tipe: 'Input/Hitung', keterangan: 'Persentase revolving GUP minimal 1 kali sebulan (target 100%). Bobot 50% pada UP Tunai.' },
      { kolom: 'GUP Disebulankan (R27)', tipe: 'Input/Hitung', keterangan: 'Realisasi revolving GUP terhadap total pagu UP yang dikelola. Bobot 25% pada UP Tunai.' },
      { kolom: 'Pertanggungjawaban TUP (S27)', tipe: 'Input/Hitung', keterangan: 'Penyelesaian TUP dan penyetoran sisa TUP dalam 30 hari kalender. Bobot 25% pada UP Tunai.' },
      { kolom: 'Pagu & Penggunaan KKP (Sheet KKP)', tipe: 'Input', keterangan: 'Besaran UP KKP dan realisasi transaksi pembayaran belanja dengan KKP setiap bulan.' }
    ],
    rumusExcel: "=ROUND(IF((UP_Tunai*90% + KKP*10%) > 100, 100, UP_Tunai*90% + KKP*10%), 2)",
    penjelasanRumus: [
      'Komposisi bobot: 90% Pengelolaan UP/TUP Tunai + 10% Penggunaan Kartu Kredit Pemerintah (KKP).',
      'Jika satker tidak memiliki kewajiban KKP (besaran KKP = 0), bobot dialihkan 100% ke UP Tunai.',
      'Revolving GUP wajib dilakukan minimal 1 kali per bulan kalender jika pagu UP telah terpakai minimal 50%.',
      'Pertanggungjawaban TUP wajib diselesaikan maksimal 30 hari kalender sejak SP2D TUP terbit.'
    ],
    tipsNilai100: [
      'Lakukan revolving GUP minimal 1 kali per bulan secara disiplin sebelum akhir bulan.',
      'Segera setorkan sisa dana TUP dan sampaikan SPM Pertanggungjawaban TUP sebelum melewati batas 30 hari kalender.',
      'Aktifkan penggunaan Kartu Kredit Pemerintah (KKP) untuk belanja keperluan operasional dan perjalanan dinas.'
    ],
    panduanTombol: [
      { namaTombol: 'Perhitungkan Indikator Ini', keterangan: 'Menghitung kombinasi bobot 90% Tunai + 10% KKP dan menyimpan hasil ke simulasi.' },
      { namaTombol: 'Formula Inspector', keterangan: 'Mengecek formula Excel sel N8 dan komponen penyusunnya.' },
      { namaTombol: 'Beralih Sub-Tab Tunai vs KKP', keterangan: 'Memilih data yang ingin diinput antara UP Tunai atau Kartu Kredit Pemerintah.' }
    ]
  },

  'capaian-output': {
    id: 'capaian-output',
    title: 'Indikator 7: Capaian Output',
    bobot: '25%',
    aspek: 'Kualitas Hasil Pelaksanaan Anggaran',
    color: 'purple',
    deskripsiSingkat:
      'Memiliki bobot terbesar (25%). Mengukur akuntabilitas capaian kinerja pelaksanaan anggaran melalui ketepatan waktu pelaporan data capaian output (30%) dan capaian Rincian Output / RO (70%).',
    alurKerjaCepat: [
      {
        step: 1,
        title: 'Buka Perekaman Capaian Output di SAKTI',
        description: 'Buka menu Perekaman Capaian Output di SAKTI dan data konfirmasi OMSPAN untuk melihat daftar RO satker.',
        highlight: 'Bobot terbesar di IKPA (25%)'
      },
      {
        step: 2,
        title: 'Isi Ketepatan Laporan Bulanan (30%)',
        description: 'Set status ketepatan pelaporan bulanan (Bulan 1 s.d. 12). Pelaporan tepat waktu jika direkam <= hari kerja ke-5 bulan berikutnya.',
        highlight: 'Batas pelaporan: HK ke-5'
      },
      {
        step: 3,
        title: 'Input Rincian Output & Simpan (70%)',
        description: 'Ketik Target & Realisasi Volume (RVRO), Target & Realisasi Progres Fisik (PCRO), dan Status Konfirmasi KPPN. Klik "Perhitungkan Indikator Ini" untuk menyimpan.',
        highlight: 'Formula: AD6 (30%) + AD7 (70%)'
      }
    ],
    kolomInputManual: [
      { nama: 'Tabel Ketepatan Waktu (Jan - Des)', keterangan: 'Status pelaporan capaian output bulanan s.d. tanggal 5 hari kerja bulan berikutnya.' },
      { nama: 'Kode & Nama Rincian Output (RO)', keterangan: 'Daftar seluruh Rincian Output yang dikelola satker sesuai DIPA.' },
      { nama: 'Target & Realisasi RVRO', keterangan: 'Target volume output setahun dan akumulasi realisasi volume yang telah dicapai.' },
      { nama: 'Target & Realisasi PCRO (%)', keterangan: 'Target progres capaian dan realisasi kumulatif progres fisik persentase.' },
      { nama: 'Status Konfirmasi KPPN', keterangan: 'Wajib berstatus "Terkonfirmasi" agar data dihitung sah oleh OMSPAN.' }
    ],
    kolomOtomatisSistem: [
      { nama: 'Rata-Rata Ketepatan Waktu (AB6)', keterangan: 'Rata-rata persentase ketepatan pelaporan bulanan.' },
      { nama: 'Kontribusi Ketepatan 30% (AD6)', keterangan: 'Nilai ketepatan dikalikan bobot 30%.' },
      { nama: 'Capaian Output per RO (Kolom R)', keterangan: 'Perhitungan indeks capaian berdasarkan PCRO dan RVRO dengan filter anomali.' },
      { nama: 'Rata-Rata Capaian RO (AB7)', keterangan: 'Rata-rata capaian seluruh RO yang terkonfirmasi valid.' },
      { nama: 'Kontribusi Capaian RO 70% (AD7)', keterangan: 'Rata-rata capaian RO dikalikan bobot 70%.' },
      { nama: 'Nilai Akhir Indikator (AD8)', keterangan: 'AD6 + AD7 (maksimal 100 poin).' }
    ],
    sumberData: [
      'SAKTI Modul Komitmen / Pelaporan (Perekaman Capaian Kinerja Output / Rincian Output)',
      'Data Konfirmasi Capaian Output dari KPPN (OMSPAN)',
      'Format Sheet Excel: Capaian Output (Kolom A s.d. AD)'
    ],
    langkahPengisian: [
      { kolom: 'Kode & Nama RO (A:B)', tipe: 'Input', keterangan: 'Daftar seluruh Rincian Output yang dikelola satker sesuai DIPA.' },
      { kolom: 'Target & Realisasi RVRO (F & H)', tipe: 'Input', keterangan: 'Target volume output setahun dan realisasi kumulatif volume output yang telah dihasilkan.' },
      { kolom: 'Target & Realisasi PCRO (N & P)', tipe: 'Input', keterangan: 'Target progres capaian rincian output dan realisasi kumulatif progres fisik (%).' },
      { kolom: 'Status Konfirmasi KPPN (D)', tipe: 'Input', keterangan: 'Wajib berstatus "Terkonfirmasi" agar dihitung valid oleh sistem.' },
      { kolom: 'Tepat Waktu Pelaporan', tipe: 'Input', keterangan: 'Status pelaporan bulanan s.d. batas tanggal 5 hari kerja bulan berikutnya.' }
    ],
    rumusExcel: "=ROUND(AD6 + AD7, 2) di mana AD6 = 30% × Rata2 Ketepatan Waktu, AD7 = 70% × Rata2 Capaian RO",
    penjelasanRumus: [
      'Bobot indikator ini adalah 25% (terbesar di antara seluruh indikator IKPA).',
      'Komponen 1 (Bobot 30%): Rata-rata ketepatan waktu pelaporan bulanan (12 bulan atau s.d. cut-off).',
      'Komponen 2 (Bobot 70%): Rata-rata nilai capaian seluruh Rincian Output (RO).',
      'Nilai Capaian per RO dihitung dari rasio PCRO dan RVRO dengan toleransi anomali data.',
      'RO yang belum terkonfirmasi KPPN tidak akan menyumbang nilai optimal.'
    ],
    tipsNilai100: [
      'Laporkan data capaian output pada SAKTI secara tertib paling lambat hari kerja ke-5 setiap awal bulan.',
      'Pastikan seluruh RO mendapatkan konfirmasi valid dari KPPN sebelum batas cut-off pelaporan.',
      'Perbarui progres fisik (PCRO) dan volume (RVRO) secara berkala dan sinkron dengan realisasi belanja.'
    ],
    panduanTombol: [
      { namaTombol: 'Perhitungkan Indikator Ini', keterangan: 'Menghitung nilai kombinasi AD6 + AD7 dan memperbarui capaian output di proyek simulasi.' },
      { namaTombol: 'Formula Inspector', keterangan: 'Mengecek rincian formula AD6 (30%), AD7 (70%), dan formula capaian per RO.' },
      { namaTombol: 'Tambah Baris Rincian Output', keterangan: 'Menambahkan RO baru ke dalam tabel simulasi.' }
    ]
  },

  'dispensasi-spm': {
    id: 'dispensasi-spm',
    title: 'Faktor Pengurang: Dispensasi SPM',
    bobot: 'Pengurang Nilai',
    aspek: 'Kepatuhan Akhir Tahun Anggaran',
    color: 'rose',
    deskripsiSingkat:
      'Bukan merupakan indikator penambah, melainkan PENGURANG NILAI TOTAL IKPA. Mengukur kepatuhan pengajuan SPM pada akhir tahun (Triwulan IV) tanpa meminta dispensasi keterlambatan ke KPPN/Kanwil.',
    alurKerjaCepat: [
      {
        step: 1,
        title: 'Hitung Jumlah SPM Triwulan IV',
        description: 'Buka OMSPAN / SAKTI untuk melihat total seluruh SPM yang diajukan satker pada bulan Oktober, November, dan Desember.',
        highlight: 'Hitung total seluruh SPM TW IV'
      },
      {
        step: 2,
        title: 'Ketik Angka di Kotak A2 dan B2',
        description: 'Ketik total SPM TW IV pada kotak "Jumlah SPM Triwulan IV (A2)" dan berapa SPM yang diajukan dengan dispensasi pada kotak "Jumlah Dispensasi SPM (B2)".',
        highlight: 'Jika tidak ada dispensasi, isi B2 = 0'
      },
      {
        step: 3,
        title: 'Sistem Menghitung Rasio & Penalti',
        description: 'Sistem menghitung rasio permil (B2/A2*1000). Jika B2=0, penalti = 0 poin (aman). Klik "Perhitungkan Indikator Ini" untuk menerapkan pengurang.',
        highlight: 'Target: 0 SPM dispensasi'
      }
    ],
    kolomInputManual: [
      { nama: 'Jumlah SPM Triwulan IV (Sel A2)', keterangan: 'Total seluruh Surat Perintah Membayar yang diterbitkan satker pada Triwulan IV.' },
      { nama: 'Jumlah Dispensasi SPM (Sel B2)', keterangan: 'Jumlah SPM yang diterbitkan melewati batas norma waktu LLAT dan mendapatkan surat persetujuan dispensasi.' }
    ],
    kolomOtomatisSistem: [
      { nama: 'Rasio Dispensasi (Sel C2)', keterangan: 'Dihitung dari (B2 / A2) * 1000 dalam satuan permil (‰).' },
      { nama: 'Pengurang Nilai IKPA (Sel D2)', keterangan: 'Poin penalti pengurang langsung terhadap total skor IKPA satker (0 s.d. 5 poin).' }
    ],
    sumberData: [
      'Surat Persetujuan Dispensasi KPPN / Kanwil DJPb untuk pengajuan SPM terlambat di Triwulan IV',
      'Data Jumlah SPM Triwulan IV dari SAKTI / SPAN / OMSPAN',
      'Format Sheet Excel: Dispensasi SPM'
    ],
    langkahPengisian: [
      { kolom: 'Jumlah SPM Triwulan IV (A2)', tipe: 'Input', keterangan: 'Total seluruh SPM yang diajukan satker pada bulan Oktober, November, dan Desember.' },
      { kolom: 'Jumlah Dispensasi SPM (B2)', tipe: 'Input', keterangan: 'Jumlah SPM yang diajukan melebihi batas waktu akhir tahun sehingga memerlukan dispensasi.' },
      { kolom: 'Rasio Dispensasi (C2)', tipe: 'Otomatis', keterangan: 'B2 / A2 (Persentase SPM yang menggunakan dispensasi).' },
      { kolom: 'Pengurang Nilai (D2)', tipe: 'Otomatis', keterangan: 'Nilai penalti pengurang langsung terhadap total nilai IKPA satker.' }
    ],
    rumusExcel: "=IF(C2=0, 0, IF(C2<=0.05, 0.5, IF(C2<=0.1, 1, IF(C2<=0.2, 2, IF(C2<=0.3, 3, 5)))))",
    penjelasanRumus: [
      'Dispensasi SPM bukan merupakan indikator penambah, melainkan PENGURANG NILAI TOTAL IKPA.',
      'Jika tidak ada SPM dispensasi (B2 = 0), maka pengurang = 0,00 (tidak ada pemotongan nilai).',
      'Jika rasio > 0% s.d. 5%, nilai IKPA dipotong 0,5 poin.',
      'Jika rasio > 5% s.d. 10%, nilai IKPA dipotong 1,0 poin.',
      'Jika rasio > 10% s.d. 20%, nilai IKPA dipotong 2,0 poin.',
      'Jika rasio > 20% s.d. 30%, nilai IKPA dipotong 3,0 poin.',
      'Jika rasio > 30%, nilai IKPA dipotong 5,0 poin (penalti maksimal).'
    ],
    tipsNilai100: [
      'Pedomani Surat Edaran Direktur Jenderal Perbendaharaan mengenai Langkah-Langkah Akhir Tahun (LLAT) secara seksama.',
      'Ajukan seluruh SPM LS Kontraktual dan GUP Nihil sesuai jadwal batching dan jangan menunda ke hari-hari terakhir batas pengajuan.',
      'Pastikan nihil dispensasi pengajuan SPM agar nilai total IKPA tidak berkurang sedikitpun.'
    ],
    panduanTombol: [
      { namaTombol: 'Perhitungkan Indikator Ini', keterangan: 'Menerapkan faktor pengurang nilai dispensasi ke total skor IKPA proyek aktif.' },
      { namaTombol: 'Formula Inspector', keterangan: 'Melihat logika kategori penalti pengurang pada sel D2.' }
    ]
  }
};

interface PetunjukPengisianCardProps {
  indicatorId?: string;
  defaultExpanded?: boolean;
  className?: string;
  isDark?: boolean;
}

export const PetunjukPengisianCard: React.FC<PetunjukPengisianCardProps> = ({
  indicatorId,
  defaultExpanded = false,
  className = '',
  isDark = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedId, setSelectedId] = useState<string>(indicatorId || 'interface');
  const [activeTab, setActiveTab] = useState<'alur' | 'kamus' | 'rumus' | 'tips' | 'tombol'>('alur');

  const activeId = indicatorId || selectedId;
  const currentData = PETUNJUK_INDIKATOR_DATA[activeId] || PETUNJUK_INDIKATOR_DATA['interface'] || PETUNJUK_INDIKATOR_DATA['revisi-dipa'];

  return (
    <div
      id={`petunjuk-pengisian-${activeId}`}
      className={`rounded-2xl border transition-all shadow-xs overflow-hidden ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-800'
      } ${className}`}
    >
      {/* 1. Header Bar: Selalu Terlihat & Bisa Diklik untuk Expand/Collapse */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
          isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50/80'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                📖 Cara Menggunakan & Panduan Pengisian
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                {currentData.title}
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Bobot {currentData.bobot}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl line-clamp-2">
              {currentData.deskripsiSingkat}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            {isExpanded ? 'Tutup Panduan' : 'Buka Cara Pakai'}
          </span>
          <div className="p-1 rounded-lg text-slate-400">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {/* 2. Expanded Content Body */}
      {isExpanded && (
        <div className="px-5 pb-6 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-5">
          {/* Switcher jika di halaman umum */}
          {!indicatorId && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {Object.values(PETUNJUK_INDIKATOR_DATA).map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  type="button"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedId === item.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.title.split(':')[0]} ({item.bobot})
                </button>
              ))}
            </div>
          )}

          {/* Sub Tabs: Navigasi Bagian Panduan */}
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => setActiveTab('alur')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'alur'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              1. Alur Cepat (Quick Start)
            </button>

            <button
              onClick={() => setActiveTab('kamus')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'kamus'
                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              2. Kolom Input vs Otomatis
            </button>

            <button
              onClick={() => setActiveTab('rumus')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'rumus'
                  ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Calculator className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              3. Aturan & Rumus PER-5
            </button>

            <button
              onClick={() => setActiveTab('tips')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'tips'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              4. Tips Skor 100
            </button>

            <button
              onClick={() => setActiveTab('tombol')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'tombol'
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MousePointerClick className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              5. Fungsi Tombol
            </button>
          </div>

          {/* TAB 1: ALUR KERJA CEPAT */}
          {activeTab === 'alur' && (
            <div className="space-y-4 animate-fade-in">
              {/* 3 Step Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {currentData.alurKerjaCepat.map(st => (
                  <div
                    key={st.step}
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                          {st.step}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {st.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {st.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{st.highlight}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Perbandingan Ringkas: Kolom Manual vs Otomatis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-amber-50/80 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-700 dark:text-amber-400 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px]">
                      ✍️ INPUT MANUAL
                    </span>
                    <span>Kolom yang Harus Anda Ketik / Salin:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {currentData.kolomInputManual.map((k, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-bold text-amber-600 dark:text-amber-400">•</span>
                        <span>
                          <strong className="text-slate-900 dark:text-white">{k.nama}</strong>: {k.keterangan}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-blue-950/20 border-blue-800/40 text-blue-200' : 'bg-blue-50/80 border-blue-200 text-blue-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-xs text-blue-700 dark:text-blue-400 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-800 dark:text-blue-300 text-[10px]">
                      ⚡ OTOMATIS SISTEM
                    </span>
                    <span>Kolom yang Dihitung Langsung oleh Sistem:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {currentData.kolomOtomatisSistem.map((k, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-bold text-blue-600 dark:text-blue-400">•</span>
                        <span>
                          <strong className="text-slate-900 dark:text-white">{k.nama}</strong>: {k.keterangan}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KAMUS KOLOM LENGKAP */}
          {activeTab === 'kamus' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Rincian aturan teknis pengisian setiap kolom data pada tabel indikator ini:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckSquare className="h-3.5 w-3.5" /> Sesuai Format Workbook Excel 2026
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className={`text-slate-600 dark:text-slate-300 font-semibold border-b ${
                    isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-100/80 border-slate-200'
                  }`}>
                    <tr>
                      <th className="px-3.5 py-2.5 w-1/4">Nama Kolom / Format</th>
                      <th className="px-3.5 py-2.5 w-28">Sifat Kolom</th>
                      <th className="px-3.5 py-2.5">Keterangan & Aturan Pengisian Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentData.langkahPengisian.map((row, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 1 ? (isDark ? 'bg-slate-800/30' : 'bg-slate-50/50') : ''}
                      >
                        <td className="px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-100">
                          {row.kolom}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md whitespace-nowrap ${
                              row.tipe === 'Input'
                                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {row.tipe === 'Input' ? '✍️ Input Manual' : '⚡ Otomatis'}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                          {row.keterangan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sumber Data Box */}
              <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  📂 Sumber Dokumen / Aplikasi Penarik Data:
                </span>
                <div className="flex flex-wrap gap-2 text-slate-600 dark:text-slate-300">
                  {currentData.sumberData.map((src, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-slate-800 px-2 py-1 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                      • {src}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATURAN & RUMUS PER-5 */}
          {activeTab === 'rumus' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                  <Sparkles className="h-4 w-4" /> Rumus Resmi Excel (Sesuai Workbook Kalkulator 2026)
                </div>
                <div className="p-3 rounded-xl font-mono text-xs bg-slate-900 text-emerald-400 dark:bg-black dark:text-emerald-300 mb-3 overflow-x-auto select-all">
                  {currentData.rumusExcel}
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {currentData.penjelasanRumus.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TIPS MERAIH NILAI 100 */}
          {activeTab === 'tips' && (
            <div className={`p-4 rounded-xl border animate-fade-in ${
              isDark ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-2.5 text-amber-700 dark:text-amber-400">
                <Lightbulb className="h-4 w-4" /> Strategi & Tips Satker Agar Nilai Optimal 100
              </div>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-amber-200/90">
                {currentData.tipsNilai100.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 5: FUNGSI TOMBOL TOOLBAR */}
          {activeTab === 'tombol' && (
            <div className="space-y-2.5 animate-fade-in">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                Penjelasan tombol aksi pada toolbar di atas:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentData.panduanTombol.map((btn, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {btn.namaTombol}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {btn.keterangan}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
