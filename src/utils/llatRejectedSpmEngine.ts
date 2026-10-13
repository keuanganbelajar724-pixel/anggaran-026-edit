/**
 * Mesin Kalkulator & Matriks Batas Waktu Pengajuan Kembali SPM Ditolak
 * Berdasarkan Ketentuan Resmi PER-9/PB/2026
 * Mengatur Pasal 9, 12, 15, 17, 19, 24, dan 28
 */

import { LLATEvent } from '../types/llat';
import { calculateWorkingDayDeadline, isWorkingDay } from './llatWorkingDaysEngine';

export interface RejectedSpmRuleDef {
  id: string;
  pasal: string;
  ayat?: string;
  namaSpm: string;
  kategoriSpm: string;
  deskripsiAturan: string;
  persyaratanWajib: string;
  penyelesaianSp2d: string;
  batasJamDefault: string; // '15:00' atau '17:00'
  ketentuanKhusus: Array<{
    kondisiLabel: string;
    tanggalPenolakanKppn?: string; // e.g. '2026-12-18'
    tanggalPenolakanMin?: string;
    tanggalPenolakanMax?: string;
    tanggalBatasPengajuan: string; // e.g. '2026-12-21'
    jamBatas: string;
    keterangan: string;
  }>;
  formulaUmum: {
    jumlahHariKerja: number;
    keterangan: string;
  };
}

export const REJECTED_SPM_RULES: RejectedSpmRuleDef[] = [
  // 1. PASAL 24 AYAT (1) - SPM-TUP TUNAI
  {
    id: 'pasal-24-1',
    pasal: 'Pasal 24',
    ayat: 'Ayat (1)',
    namaSpm: 'SPM-TUP Tunai (Pasal 23 ayat 1)',
    kategoriSpm: 'Uang Persediaan / TUP',
    deskripsiAturan: 'Dalam hal KPPN melakukan penolakan atas pengajuan SPM-TUP Tunai yang memerlukan perbaikan SPM dan/atau data supplier, SPM diterima KPPN paling lambat tanggal 16 November 2026 dengan melampirkan bukti penolakan SPM dari KPPN.',
    persyaratanWajib: 'Wajib melampirkan bukti penolakan SPM dari KPPN',
    penyelesaianSp2d: 'Paling lambat 20 November 2026 (SP2D SPM-TUP Tunai)',
    batasJamDefault: '15:00', // November cutoff adalah 15:00 WIB
    ketentuanKhusus: [
      {
        kondisiLabel: 'Batas akhir mutlak pengajuan perbaikan SPM-TUP Tunai',
        tanggalPenolakanMax: '2026-11-16',
        tanggalBatasPengajuan: '2026-11-16',
        jamBatas: '15:00',
        keterangan: 'SPM diterima KPPN paling lambat tanggal 16 November 2026 pukul 15:00 WIB.'
      }
    ],
    formulaUmum: {
      jumlahHariKerja: 0,
      keterangan: 'Batas mutlak 16 November 2026 (pukul 15:00 WIB)'
    }
  },

  // 2. PASAL 24 AYAT (2) - SPM-UP TUNAI, SPM-TUP KKP, & SPM-GUP
  {
    id: 'pasal-24-2',
    pasal: 'Pasal 24',
    ayat: 'Ayat (2)',
    namaSpm: 'SPM-UP Tunai, SPM-TUP KKP, dan SPM-GUP (Pasal 23 ayat 2)',
    kategoriSpm: 'Uang Persediaan / GUP / KKP',
    deskripsiAturan: 'Dalam hal KPPN melakukan penolakan atas pengajuan SPM-UP Tunai, SPM-TUP KKP, dan SPM-GUP yang memerlukan perbaikan SPM dan/atau data supplier, pengajuan kembali SPM paling lambat 2 Hari Kerja berikutnya pada Jam Kerja setelah ditolak s.d. 7 Des 2026; penolakan 8 Des paling lambat 9 Des (1 HK); penolakan 9 Des paling lambat 10 Des (1 HK); penolakan 10 Des paling lambat 11 Des 2026 (1 HK).',
    persyaratanWajib: 'Wajib melampirkan bukti penolakan SPM dari KPPN',
    penyelesaianSp2d: 'Diselesaikan oleh KPPN sesuai ketentuan penerbitan SP2D UP/GUP/TUP KKP',
    batasJamDefault: '17:00',
    ketentuanKhusus: [
      {
        kondisiLabel: 'Penolakan pada tanggal 8 Desember 2026',
        tanggalPenolakanKppn: '2026-12-08',
        tanggalBatasPengajuan: '2026-12-09',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 9 Desember 2026 pada Jam Kerja setelah ditolak oleh KPPN (1 Hari Kerja berikutnya - Pasal 24 ayat 2 huruf b).'
      },
      {
        kondisiLabel: 'Penolakan pada tanggal 9 Desember 2026',
        tanggalPenolakanKppn: '2026-12-09',
        tanggalBatasPengajuan: '2026-12-10',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 10 Desember 2026 pada Jam Kerja setelah ditolak oleh KPPN (1 Hari Kerja berikutnya - Pasal 24 ayat 2 huruf c).'
      },
      {
        kondisiLabel: 'Penolakan pada tanggal 10 Desember 2026',
        tanggalPenolakanKppn: '2026-12-10',
        tanggalBatasPengajuan: '2026-12-11',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 11 Desember 2026 pada Jam Kerja setelah ditolak oleh KPPN (1 Hari Kerja berikutnya).'
      }
    ],
    formulaUmum: {
      jumlahHariKerja: 2,
      keterangan: 'Paling lambat 2 Hari Kerja berikutnya (untuk penolakan s.d. 7 Desember 2026)'
    }
  },

  // 3. PASAL 12 - SPM GAJI INDUK, PPPK, & PPNPN JANUARI 2027
  {
    id: 'pasal-12',
    pasal: 'Pasal 12',
    ayat: 'Pasal 12 huruf a-d',
    namaSpm: 'SPM Gaji Induk, PPPK, dan PPNPN Jan 2027 (Pasal 11)',
    kategoriSpm: 'Gaji Induk / PPPK / PPNPN',
    deskripsiAturan: 'Dalam hal KPPN melakukan penolakan atas pengajuan SPM sebagaimana dimaksud Pasal 11 yang memerlukan perbaikan SPM dan/atau data supplier: s.d. 10 Des -> 2 HK berikutnya; penolakan 11 Des -> maks 14 Des (Senin); penolakan 14 Des -> maks 15 Des (1 HK); penolakan 28 Des -> maks 29 Des (1 HK); penolakan 29 Des -> maks 30 Des 2026 (1 HK).',
    persyaratanWajib: 'Wajib melampirkan bukti penolakan SPM dari KPPN',
    penyelesaianSp2d: 'SP2D diterbitkan KPPN paling lambat pada hari kerja pertama bulan Januari 2027',
    batasJamDefault: '17:00',
    ketentuanKhusus: [
      {
        kondisiLabel: 'Penolakan pada tanggal 11 Desember 2026',
        tanggalPenolakanKppn: '2026-12-11',
        tanggalBatasPengajuan: '2026-12-14',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 14 Desember 2026 pada Jam Kerja setelah ditolak oleh KPPN (1 Hari Kerja berikutnya / Senin - huruf b).'
      },
      {
        kondisiLabel: 'Penolakan pada tanggal 14 Desember 2026',
        tanggalPenolakanKppn: '2026-12-14',
        tanggalBatasPengajuan: '2026-12-15',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 15 Desember 2026 pada Jam Kerja setelah ditolak oleh KPPN (1 Hari Kerja berikutnya - huruf c).'
      },
      {
        kondisiLabel: 'Penolakan pada tanggal 28 Desember 2026',
        tanggalPenolakanKppn: '2026-12-28',
        tanggalBatasPengajuan: '2026-12-29',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 29 Desember 2026 pada Jam Kerja setelah ditolak oleh KPPN (1 Hari Kerja berikutnya - huruf d).'
      },
      {
        kondisiLabel: 'Penolakan pada tanggal 29 Desember 2026',
        tanggalPenolakanKppn: '2026-12-29',
        tanggalBatasPengajuan: '2026-12-30',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 30 Desember 2026 pada Jam Kerja setelah ditolak oleh KPPN (1 Hari Kerja berikutnya).'
      }
    ],
    formulaUmum: {
      jumlahHariKerja: 2,
      keterangan: 'Paling lambat 2 Hari Kerja berikutnya (untuk penolakan s.d. 10 Desember 2026 - huruf a)'
    }
  },

  // 4. PASAL 28 AYAT (1) - SPM-PTUP
  {
    id: 'pasal-28-1',
    pasal: 'Pasal 28',
    ayat: 'Ayat (1) & (3)',
    namaSpm: 'SPM-PTUP (Pertanggungjawaban TUP - Pasal 27 ayat 1)',
    kategoriSpm: 'Pertanggungjawaban TUP',
    deskripsiAturan: 'Dalam hal KPPN melakukan penolakan atas pengajuan SPM-PTUP sebagaimana dimaksud Pasal 27 ayat (1), Satker mengajukan kembali perbaikan SPM paling lambat tanggal 16 Desember 2026 dengan melampirkan bukti penolakan SPM dari KPPN.',
    persyaratanWajib: 'Wajib melampirkan bukti penolakan SPM dari KPPN',
    penyelesaianSp2d: 'Paling lambat pada Hari Kerja berikutnya setelah perbaikan SPM diterima secara lengkap dan benar oleh KPPN (Ayat 3)',
    batasJamDefault: '17:00',
    ketentuanKhusus: [
      {
        kondisiLabel: 'Batas akhir mutlak pengajuan perbaikan SPM-PTUP',
        tanggalPenolakanMax: '2026-12-16',
        tanggalBatasPengajuan: '2026-12-16',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 16 Desember 2026 pada Jam Kerja.'
      }
    ],
    formulaUmum: {
      jumlahHariKerja: 0,
      keterangan: 'Batas akhir mutlak tanggal 16 Desember 2026 pada Jam Kerja'
    }
  },

  // 5. PASAL 17 AYAT (1) - SPM-KP, SPM-IB, SPM-PP (Ayat 1)
  {
    id: 'pasal-17-1',
    pasal: 'Pasal 17',
    ayat: 'Ayat (1) & (3)',
    namaSpm: 'SPM-KP, SPM-IB, SPM-PP, Pengembalian Pendapatan (Pasal 16 ayat 1)',
    kategoriSpm: 'Pengembalian / Nonkontraktual Khusus',
    deskripsiAturan: 'Dalam hal KPPN melakukan penolakan atas pengajuan SPM Pasal 16 ayat (1) yang memerlukan perbaikan SPM dan/atau data supplier: s.d. 17 Des -> 2 HK berikutnya; penolakan setelah 17 Des -> paling lambat 21 Desember 2026 pada Jam Kerja.',
    persyaratanWajib: 'Wajib melampirkan bukti penolakan SPM dari KPPN',
    penyelesaianSp2d: 'Paling lambat pada Hari Kerja berikutnya setelah perbaikan SPM diterima secara lengkap dan benar oleh KPPN (Ayat 3)',
    batasJamDefault: '17:00',
    ketentuanKhusus: [
      {
        kondisiLabel: 'Penolakan setelah tanggal 17 Desember 2026 (18-21 Des)',
        tanggalPenolakanMin: '2026-12-18',
        tanggalPenolakanMax: '2026-12-21',
        tanggalBatasPengajuan: '2026-12-21',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 21 Desember 2026 pada Jam Kerja untuk penolakan setelah tanggal 17 Desember 2026 (huruf b).'
      }
    ],
    formulaUmum: {
      jumlahHariKerja: 2,
      keterangan: 'Paling lambat 2 Hari Kerja berikutnya (untuk penolakan s.d. 17 Desember 2026 - huruf a)'
    }
  },

  // 6. PASAL 9 - SPM-LS TUNJANGAN KINERJA JANUARI 2027
  {
    id: 'pasal-9',
    pasal: 'Pasal 9',
    ayat: 'Pasal 9 huruf a-c',
    namaSpm: 'SPM-LS Tunjangan Kinerja Januari 2027 (Pasal 8)',
    kategoriSpm: 'Tunjangan Kinerja',
    deskripsiAturan: 'Dalam hal KPPN melakukan penolakan atas pengajuan SPM Pasal 8 yang memerlukan perbaikan SPM dan/atau data supplier: s.d. 17 Des -> 2 HK berikutnya; penolakan 18 Des -> paling lambat 21 Des; penolakan 21 Des -> paling lambat 22 Des 2026.',
    persyaratanWajib: 'Wajib melampirkan bukti penolakan SPM dari KPPN',
    penyelesaianSp2d: 'SP2D diterbitkan KPPN dengan tanggal 1 Januari 2027',
    batasJamDefault: '17:00',
    ketentuanKhusus: [
      {
        kondisiLabel: 'Penolakan pada tanggal 18 Desember 2026',
        tanggalPenolakanKppn: '2026-12-18',
        tanggalBatasPengajuan: '2026-12-21',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 21 Desember 2026 pada Jam Kerja setelah ditolak oleh KPPN (huruf b).'
      },
      {
        kondisiLabel: 'Penolakan pada tanggal 21 Desember 2026',
        tanggalPenolakanKppn: '2026-12-21',
        tanggalBatasPengajuan: '2026-12-22',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 22 Desember 2026 pada Jam Kerja setelah ditolak oleh KPPN (huruf c).'
      }
    ],
    formulaUmum: {
      jumlahHariKerja: 2,
      keterangan: 'Paling lambat 2 Hari Kerja berikutnya (untuk penolakan s.d. 17 Desember 2026 - huruf a)'
    }
  },

  // 7. PASAL 15 - SPM-LS NONKONTRAKTUAL / PERJALANAN DINAS
  {
    id: 'pasal-15',
    pasal: 'Pasal 15',
    ayat: 'Ayat (1) & (2)',
    namaSpm: 'SPM-LS Nonkontraktual & Perjalanan Dinas (Pasal 14)',
    kategoriSpm: 'SPM-LS Nonkontraktual',
    deskripsiAturan: 'Dalam hal KPPN melakukan penolakan atas pengajuan SPM Pasal 14 yang memerlukan perbaikan SPM dan/atau data supplier: s.d. 22 Des -> 2 HK berikutnya; penolakan setelah 22 Des -> paling lambat 28 Desember 2026 pada Jam Kerja; penolakan 28 Des -> paling lambat 29 Des (1 HK); penolakan 29 Des -> paling lambat 30 Des (1 HK); penolakan 30 Des -> paling lambat 31 Desember 2026 (1 HK / Hari Kerja Terakhir).',
    persyaratanWajib: 'Wajib melampirkan bukti penolakan SPM dari KPPN',
    penyelesaianSp2d: 'Paling lambat pada Hari Kerja berikutnya setelah perbaikan SPM diterima secara lengkap dan benar oleh KPPN (Ayat 2)',
    batasJamDefault: '17:00',
    ketentuanKhusus: [
      {
        kondisiLabel: 'Penolakan setelah tanggal 22 Desember 2026 (23 Des)',
        tanggalPenolakanKppn: '2026-12-23',
        tanggalBatasPengajuan: '2026-12-28',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 28 Desember 2026 pada Jam Kerja untuk penolakan setelah tanggal 22 Desember 2026 (huruf b).'
      },
      {
        kondisiLabel: 'Penolakan pada tanggal 28 Desember 2026',
        tanggalPenolakanKppn: '2026-12-28',
        tanggalBatasPengajuan: '2026-12-29',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 29 Desember 2026 pada Jam Kerja setelah ditolak oleh KPPN (1 Hari Kerja berikutnya).'
      },
      {
        kondisiLabel: 'Penolakan pada tanggal 29 Desember 2026',
        tanggalPenolakanKppn: '2026-12-29',
        tanggalBatasPengajuan: '2026-12-30',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 30 Desember 2026 pada Jam Kerja setelah ditolak oleh KPPN (1 Hari Kerja berikutnya).'
      },
      {
        kondisiLabel: 'Penolakan pada tanggal 30 Desember 2026',
        tanggalPenolakanKppn: '2026-12-30',
        tanggalBatasPengajuan: '2026-12-31',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 31 Desember 2026 pada Jam Kerja (1 Hari Kerja berikutnya / Hari Kerja Terakhir TA 2026).'
      }
    ],
    formulaUmum: {
      jumlahHariKerja: 2,
      keterangan: 'Paling lambat 2 Hari Kerja berikutnya (untuk penolakan s.d. 22 Desember 2026 - huruf a)'
    }
  },

  // 8. PASAL 19 - SPM KONTRAKTUAL (BAST/BAPP/JAMINAN)
  {
    id: 'pasal-19',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    namaSpm: 'SPM-LS Kontraktual dengan BAST/BAPP/Jaminan (Pasal 18)',
    kategoriSpm: 'SPM-LS Kontraktual',
    deskripsiAturan: 'Dalam hal KPPN melakukan penolakan atas pengajuan SPM Pasal 18 ayat (1), (3), (5), (7), dan (9) yang memerlukan perbaikan SPM dan/atau data kontrak dan/atau data supplier: Satker dapat mengajukan kembali perbaikan SPM paling lambat 2 Hari Kerja setelah ditolak KPPN (Oktober–awal Desember). Menjelang akhir Desember: penolakan 23 Des -> maks 28 Des; penolakan 28 Des -> maks 30 Des; penolakan 29 Des -> maks 30 Des (1 HK); penolakan 30 Des -> maks 31 Des (1 HK / Hari Kerja Terakhir).',
    persyaratanWajib: 'Wajib melampirkan bukti penolakan SPM dari KPPN',
    penyelesaianSp2d: 'Paling lambat pada Hari Kerja berikutnya setelah perbaikan SPM diterima secara lengkap dan benar oleh KPPN (Ayat 2)',
    batasJamDefault: '17:00',
    ketentuanKhusus: [
      {
        kondisiLabel: 'Penolakan SPM BAST/BAPP/Jaminan 15–18 Des (23 Des 2026)',
        tanggalPenolakanKppn: '2026-12-23',
        tanggalBatasPengajuan: '2026-12-28',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 28 Desember 2026 pada Jam Kerja (Hari Kerja berikutnya setelah libur cuti bersama Natal 24–27 Des).'
      },
      {
        kondisiLabel: 'Penolakan pada tanggal 28 Desember 2026 (BAST 19–23 Des)',
        tanggalPenolakanKppn: '2026-12-28',
        tanggalBatasPengajuan: '2026-12-30',
        jamBatas: '17:00',
        keterangan: 'Paling lambat 2 Hari Kerja berikutnya yaitu tanggal 30 Desember 2026 pada Jam Kerja.'
      },
      {
        kondisiLabel: 'Penolakan pada tanggal 29 Desember 2026',
        tanggalPenolakanKppn: '2026-12-29',
        tanggalBatasPengajuan: '2026-12-30',
        jamBatas: '17:00',
        keterangan: 'Paling lambat 1 Hari Kerja berikutnya yaitu tanggal 30 Desember 2026 pada Jam Kerja.'
      },
      {
        kondisiLabel: 'Penolakan pada tanggal 30 Desember 2026 (H-1 Tutup Buku)',
        tanggalPenolakanKppn: '2026-12-30',
        tanggalBatasPengajuan: '2026-12-31',
        jamBatas: '17:00',
        keterangan: 'Paling lambat 1 Hari Kerja berikutnya yaitu tanggal 31 Desember 2026 pada Jam Kerja (Hari Kerja Terakhir TA 2026).'
      }
    ],
    formulaUmum: {
      jumlahHariKerja: 2,
      keterangan: 'Paling lambat 2 Hari Kerja setelah ditolak KPPN dan tidak melewati batas waktu penerbitan SP2D'
    }
  },

  // 9. PASAL 17 AYAT (2) - SPM PENGEMBALIAN PENERIMAAN S.D. 8 JAN 2027
  {
    id: 'pasal-17-2',
    pasal: 'Pasal 17',
    ayat: 'Ayat (2) & (3)',
    namaSpm: 'SPM Pengembalian Penerimaan / Kelebihan (Pasal 16 ayat 2)',
    kategoriSpm: 'Pengembalian Penerimaan TA 2026',
    deskripsiAturan: 'Dalam hal KPPN melakukan penolakan atas pengajuan SPM Pasal 16 ayat (2) yang memerlukan perbaikan SPM dan/atau data supplier, pengajuan kembali SPM paling lambat 2 Hari Kerja berikutnya pada Jam Kerja setelah ditolak oleh KPPN untuk penolakan sampai dengan tanggal 8 Januari 2027 dan paling lambat tanggal 11 Januari 2027.',
    persyaratanWajib: 'Wajib melampirkan bukti penolakan SPM dari KPPN',
    penyelesaianSp2d: 'Paling lambat pada Hari Kerja berikutnya setelah perbaikan SPM diterima secara lengkap dan benar oleh KPPN (Ayat 3)',
    batasJamDefault: '17:00',
    ketentuanKhusus: [
      {
        kondisiLabel: 'Batas mutlak akhir pengajuan pengembalian penerimaan (Jan 2027)',
        tanggalPenolakanMin: '2027-01-07',
        tanggalPenolakanMax: '2027-01-08',
        tanggalBatasPengajuan: '2027-01-11',
        jamBatas: '17:00',
        keterangan: 'Paling lambat tanggal 11 Januari 2027 pada Jam Kerja (Ayat 2).'
      }
    ],
    formulaUmum: {
      jumlahHariKerja: 2,
      keterangan: 'Paling lambat 2 Hari Kerja berikutnya dan tidak melewati 11 Januari 2027'
    }
  },

  // 10. PASAL 28 AYAT (2) - SPM-GUP NIHIL
  {
    id: 'pasal-28-2',
    pasal: 'Pasal 28',
    ayat: 'Ayat (2) & (3)',
    namaSpm: 'SPM-GUP Nihil (Pasal 27 ayat 2)',
    kategoriSpm: 'Pertanggungjawaban Uang Persediaan',
    deskripsiAturan: 'Dalam hal KPPN melakukan penolakan atas pengajuan SPM-GUP Nihil sebagaimana dimaksud Pasal 27 ayat (2), Satker mengajukan kembali perbaikan SPM pada Hari Kerja berikutnya pada Jam Kerja setelah ditolak oleh KPPN dan paling lambat tanggal 12 Januari 2027 pada Jam Kerja dengan melampirkan bukti penolakan SPM dari KPPN.',
    persyaratanWajib: 'Wajib melampirkan bukti penolakan SPM dari KPPN',
    penyelesaianSp2d: 'Paling lambat pada Hari Kerja berikutnya setelah perbaikan SPM diterima secara lengkap dan benar oleh KPPN (Ayat 3)',
    batasJamDefault: '17:00',
    ketentuanKhusus: [
      {
        kondisiLabel: 'Batas akhir mutlak pengajuan perbaikan SPM-GUP Nihil',
        tanggalPenolakanMin: '2027-01-11',
        tanggalPenolakanMax: '2027-01-12',
        tanggalBatasPengajuan: '2027-01-12',
        jamBatas: '17:00',
        keterangan: 'Pada Hari Kerja berikutnya setelah ditolak dan paling lambat tanggal 12 Januari 2027 pada Jam Kerja.'
      }
    ],
    formulaUmum: {
      jumlahHariKerja: 1, // "pada Hari Kerja berikutnya"
      keterangan: 'Paling lambat 1 Hari Kerja berikutnya setelah ditolak dan maks 12 Januari 2027'
    }
  }
];

export interface RejectedSpmCalculationResult {
  rule: RejectedSpmRuleDef;
  tanggalDitolak: string;
  tanggalBatasPengajuan: string;
  jamBatasPengajuan: string;
  isSpecialCutoff: boolean;
  hkRule: '1_HK' | '2_HK' | 'TANGGAL_PASTI';
  hkRuleLabel: string;
  alasanPenetapan: string;
  kutipanResmi: string;
  syaratLampiran: string;
  batasSp2d: string;
  sisaHari: number; // vs current date
  statusLabel: 'HARI_INI' | 'SEGERA' | 'TERLEWAT' | 'MASIH_LAMA';
  statusBadgeColor: string;
}

/**
 * Kalkulasi presisi batas pengajuan kembali SPM ditolak berdasarkan tanggal penolakan KPPN
 */
export function calculateRejectedSpmDeadline(
  ruleId: string,
  tanggalDitolak: string,
  referenceNowStr: string = '2026-10-12'
): RejectedSpmCalculationResult {
  const rule = REJECTED_SPM_RULES.find(r => r.id === ruleId) || REJECTED_SPM_RULES[0];
  
  let targetDeadline = '';
  let targetJam = rule.batasJamDefault;
  let isSpecialCutoff = false;
  let alasan = '';

  // 1. Cek apakah ada ketentuan khusus tanggal pasti yang cocok
  for (const k of rule.ketentuanKhusus) {
    if (k.tanggalPenolakanKppn && k.tanggalPenolakanKppn === tanggalDitolak) {
      targetDeadline = k.tanggalBatasPengajuan;
      targetJam = k.jamBatas;
      isSpecialCutoff = true;
      alasan = k.keterangan;
      break;
    }
    if (k.tanggalPenolakanMin && k.tanggalPenolakanMax) {
      if (tanggalDitolak >= k.tanggalPenolakanMin && tanggalDitolak <= k.tanggalPenolakanMax) {
        targetDeadline = k.tanggalBatasPengajuan;
        targetJam = k.jamBatas;
        isSpecialCutoff = true;
        alasan = k.keterangan;
        break;
      }
    }
    if (!k.tanggalPenolakanMin && k.tanggalPenolakanMax && tanggalDitolak <= k.tanggalPenolakanMax) {
      if (rule.id === 'pasal-24-1' || rule.id === 'pasal-28-1') {
        targetDeadline = k.tanggalBatasPengajuan;
        targetJam = k.jamBatas;
        isSpecialCutoff = true;
        alasan = k.keterangan;
        break;
      }
    }
  }

  // 2. Jika tidak masuk tanggal khusus, gunakan formula hari kerja
  if (!targetDeadline) {
    const hk = rule.formulaUmum.jumlahHariKerja || 2;
    const calc = calculateWorkingDayDeadline(tanggalDitolak, hk, 'SESUDAH', false);
    targetDeadline = calc.targetDateStr;
    
    // Pastikan batas tidak melewati batas mutlak regulasi
    if (rule.id === 'pasal-17-2' && targetDeadline > '2027-01-11') {
      targetDeadline = '2027-01-11';
      isSpecialCutoff = true;
      alasan = 'Disesuaikan dengan batas mutlak Pasal 17 ayat (2) (maksimal 11 Januari 2027).';
    } else if (rule.id === 'pasal-28-2' && targetDeadline > '2027-01-12') {
      targetDeadline = '2027-01-12';
      isSpecialCutoff = true;
      alasan = 'Disesuaikan dengan batas mutlak Pasal 28 ayat (2) (maksimal 12 Januari 2027).';
    } else {
      alasan = `Dihitung ${hk} Hari Kerja berikutnya setelah ditolak KPPN (${tanggalDitolak}).`;
    }
  }

  // Tentukan jam batas otomatis jika bulan Oktober/November -> 15:00 WIB, Desember/Januari -> 17:00 WIB
  if (targetDeadline.startsWith('2026-10') || targetDeadline.startsWith('2026-11')) {
    targetJam = '15:00';
  } else {
    targetJam = '17:00';
  }

  // Identifikasi kategori hari kerja (1 HK vs 2 HK vs Tanggal Pasti)
  let hkRule: '1_HK' | '2_HK' | 'TANGGAL_PASTI' = '2_HK';
  let hkRuleLabel = '2 Hari Kerja Berikutnya';

  if (alasan.toLowerCase().includes('1 hari kerja') || alasan.toLowerCase().includes('hari kerja berikutnya')) {
    hkRule = '1_HK';
    hkRuleLabel = '1 Hari Kerja Berikutnya (Kritis!)';
  } else if (rule.formulaUmum.jumlahHariKerja === 1 || rule.id === 'pasal-28-2') {
    hkRule = '1_HK';
    hkRuleLabel = '1 Hari Kerja Berikutnya (Kritis!)';
  } else if (rule.formulaUmum.jumlahHariKerja === 0 || rule.id === 'pasal-24-1' || rule.id === 'pasal-28-1') {
    hkRule = 'TANGGAL_PASTI';
    hkRuleLabel = 'Batas Mutlak Regulasi';
  } else {
    hkRule = '2_HK';
    hkRuleLabel = '2 Hari Kerja Berikutnya';
  }

  // Hitung sisa hari dari referenceNow
  const refDate = new Date(referenceNowStr + 'T00:00:00');
  const dlineDate = new Date(targetDeadline + 'T00:00:00');
  const diffTime = dlineDate.getTime() - refDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let statusLabel: 'HARI_INI' | 'SEGERA' | 'TERLEWAT' | 'MASIH_LAMA' = 'MASIH_LAMA';
  let statusBadgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';

  if (diffDays < 0) {
    statusLabel = 'TERLEWAT';
    statusBadgeColor = 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
  } else if (diffDays === 0) {
    statusLabel = 'HARI_INI';
    statusBadgeColor = 'bg-rose-600 text-white animate-pulse';
  } else if (diffDays <= 7) {
    statusLabel = 'SEGERA';
    statusBadgeColor = 'bg-amber-500 text-white';
  }

  return {
    rule,
    tanggalDitolak,
    tanggalBatasPengajuan: targetDeadline,
    jamBatasPengajuan: targetJam,
    isSpecialCutoff,
    hkRule,
    hkRuleLabel,
    alasanPenetapan: alasan,
    kutipanResmi: `${rule.pasal} ${rule.ayat || ''}: ${rule.deskripsiAturan}`,
    syaratLampiran: rule.persyaratanWajib,
    batasSp2d: rule.penyelesaianSp2d,
    sisaHari: diffDays,
    statusLabel,
    statusBadgeColor
  };
}

/**
 * Daftar Tanggal-Tanggal Pasti Batas Pengajuan Kembali SPM Ditolak
 * Siap ditampilkan langsung dalam tabel matriks dan dikonversi menjadi LLATEvent
 */
export interface FixedRejectedSpmEventDef {
  id: string;
  pasal: string;
  ayat: string;
  jenisSpm: string;
  kondisiPenolakan: string;
  tanggalPenolakanAcuan?: string;
  tanggalBatas: string;
  jamBatas: string;
  deskripsi: string;
  urgensi: 'KRITIS' | 'PENTING';
  dasarHukum: string;
  hkRule: '1_HK' | '2_HK' | 'TANGGAL_PASTI';
  hkLabel: string;
}

export const FIXED_REJECTED_SPM_SCHEDULE: FixedRejectedSpmEventDef[] = [
  // =========================================================================
  // =========================================================================
  // OKTOBER 2026 - KETENTUAN PENOLAKAN SPM-LS KONTRAKTUAL DENGAN BAST/BAPP/JAMINAN (PASAL 19)
  // Jam batas penolakan bulan Oktober adalah Pukul 15:00 WIB
  // Formula: Paling lambat 2 Hari Kerja setelah ditolak oleh KPPN
  // =========================================================================
  {
    id: 'LLAT-REJECT-BAST-01OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 1 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 1 Okt pada batas pengajuan 8 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-08',
    tanggalBatas: '2026-10-12',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 1 Okt 2026 yang ditolak KPPN pada batas akhir 8 Okt 2026. Satker mengajukan kembali paling lambat 2 Hari Kerja setelah ditolak yaitu 12 Oktober 2026 pukul 15:00 WIB dengan melampirkan bukti penolakan KPPN. SP2D diselesaikan hari kerja berikutnya.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-30SEP',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan s.d. 30 Sept - LLAT-06.1)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan s.d. 30 Sept pada batas akhir 9 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-09',
    tanggalBatas: '2026-10-13',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan periode s.d. 30 September 2026 (LLAT-06.1) yang ditolak KPPN pada 9 Oktober 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 13 Oktober 2026 pukul 15:00 WIB dengan melampirkan bukti penolakan SPM dari KPPN.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-05OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 5 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 5 Okt pada batas akhir 12 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-12',
    tanggalBatas: '2026-10-14',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan tanggal 5 Oktober 2026 yang ditolak KPPN pada batas akhir pengajuan 12 Oktober 2026. Satker dapat mengajukan kembali perbaikan SPM paling lambat 2 Hari Kerja setelah ditolak yaitu 14 Oktober 2026 pukul 15:00 WIB dengan melampirkan bukti penolakan SPM dari KPPN. SP2D diselesaikan hari kerja berikutnya.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-06OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 6 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 6 Okt pada batas akhir 13 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-13',
    tanggalBatas: '2026-10-15',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 6 Okt 2026 yang ditolak KPPN pada 13 Oktober 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 15 Oktober 2026 pukul 15:00 WIB dengan bukti penolakan KPPN.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-07OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 7 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 7 Okt pada batas akhir 14 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-14',
    tanggalBatas: '2026-10-16',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 7 Okt 2026 yang ditolak KPPN pada 14 Oktober 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 16 Oktober 2026 pukul 15:00 WIB dengan bukti penolakan KPPN.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-08OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 8 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 8 Okt pada batas akhir 15 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-15',
    tanggalBatas: '2026-10-19',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 8 Okt 2026 yang ditolak KPPN pada 15 Oktober 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 19 Oktober 2026 pukul 15:00 WIB dengan bukti penolakan KPPN.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-09OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 9 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 9 Okt pada batas akhir 16 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-16',
    tanggalBatas: '2026-10-20',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 9 Okt 2026 yang ditolak KPPN pada 16 Oktober 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 20 Oktober 2026 pukul 15:00 WIB dengan bukti penolakan KPPN.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-12OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 12 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 12 Okt pada batas akhir 19 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-19',
    tanggalBatas: '2026-10-21',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 12 Okt 2026 yang ditolak KPPN pada 19 Oktober 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 21 Oktober 2026 pukul 15:00 WIB.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-13OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 13 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 13 Okt pada batas akhir 20 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-20',
    tanggalBatas: '2026-10-22',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 13 Okt 2026 yang ditolak KPPN pada 20 Oktober 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 22 Oktober 2026 pukul 15:00 WIB.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-14OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 14 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 14 Okt pada batas akhir 21 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-21',
    tanggalBatas: '2026-10-23',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 14 Okt 2026 yang ditolak KPPN pada 21 Oktober 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 23 Oktober 2026 pukul 15:00 WIB.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-15OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 15 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 15 Okt pada batas akhir 22 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-22',
    tanggalBatas: '2026-10-26',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 15 Okt 2026 yang ditolak KPPN pada 22 Oktober 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 26 Oktober 2026 pukul 15:00 WIB.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-16OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 16 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 16 Okt pada batas akhir 23 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-23',
    tanggalBatas: '2026-10-27',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 16 Okt 2026 yang ditolak KPPN pada 23 Oktober 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 27 Oktober 2026 pukul 15:00 WIB.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-19OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 19 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 19 Okt pada batas akhir 26 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-26',
    tanggalBatas: '2026-10-28',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 19 Okt 2026 yang ditolak KPPN pada 26 Oktober 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 28 Oktober 2026 pukul 15:00 WIB.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-20OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 20 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 20 Okt pada batas akhir 27 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-27',
    tanggalBatas: '2026-10-29',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 20 Okt 2026 yang ditolak KPPN pada 27 Oktober 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 29 Oktober 2026 pukul 15:00 WIB.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-21OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 21 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 21 Okt pada batas akhir 28 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-28',
    tanggalBatas: '2026-10-30',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 21 Okt 2026 yang ditolak KPPN pada 28 Oktober 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 30 Oktober 2026 pukul 15:00 WIB.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-22OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 22 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 22 Okt pada batas akhir 29 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-29',
    tanggalBatas: '2026-11-02',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 22 Okt 2026 yang ditolak KPPN pada 29 Oktober 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 2 November 2026 pukul 15:00 WIB.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-23OKT',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 23 Okt)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 23 Okt pada batas akhir 30 Okt 2026',
    tanggalPenolakanAcuan: '2026-10-30',
    tanggalBatas: '2026-11-03',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 23 Okt 2026 yang ditolak KPPN pada 30 Oktober 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 3 November 2026 pukul 15:00 WIB.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-PLAFON',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (Plafon BAST/BAPP/Jaminan Oktober)',
    kondisiPenolakan: 'Penolakan SPM BAST/BAPP/Jaminan Oktober pada batas sapu jagat 6 Nov 2026',
    tanggalPenolakanAcuan: '2026-11-06',
    tanggalBatas: '2026-11-10',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan Oktober yang ditolak KPPN pada batas sapu jagat 6 November 2026. Diajukan kembali paling lambat 2 Hari Kerja yaitu 10 November 2026 pukul 15:00 WIB dengan melampirkan bukti penolakan KPPN.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },

  // =========================================================================
  // NOVEMBER 2026 & DESEMBER 2026 - KETENTUAN KHUSUS REGULASI (PER-9/PB/2026)
  // Menampilkan dengan jelas perbedaan 1 Hari Kerja (1 HK) vs 2 Hari Kerja (2 HK)
  // =========================================================================
  {
    id: 'LLAT-REJECT-TUP-TUNAI',
    pasal: 'Pasal 24',
    ayat: 'Ayat (1)',
    jenisSpm: 'SPM-TUP Tunai',
    kondisiPenolakan: 'Penolakan pengajuan SPM-TUP Tunai (Pasal 23 ayat 1)',
    tanggalBatas: '2026-11-16',
    jamBatas: '15:00',
    deskripsi: 'Batas akhir penerimaan perbaikan SPM-TUP Tunai oleh KPPN setelah penolakan. Wajib melampirkan bukti penolakan SPM dari KPPN. Paling lambat 16 November 2026 pukul 15:00 WIB.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 24 ayat (1)',
    hkRule: 'TANGGAL_PASTI',
    hkLabel: 'Batas Mutlak Regulasi (15:00 WIB)'
  },
  {
    id: 'LLAT-REJECT-BAST-NOV1',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 1–15 Nov - LLAT-06.3)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 1–15 Nov pada batas akhir 20 Nov 2026',
    tanggalPenolakanAcuan: '2026-11-20',
    tanggalBatas: '2026-11-24',
    jamBatas: '15:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 1–15 Nov 2026 (LLAT-06.3) yang ditolak KPPN pada 20 November 2026. Diajukan paling lambat 2 Hari Kerja yaitu 24 November 2026 pukul 15:00 WIB dengan bukti penolakan KPPN.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-NOV2',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 16–30 Nov - LLAT-06.4)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 16–30 Nov pada batas akhir 7 Des 2026',
    tanggalPenolakanAcuan: '2026-12-07',
    tanggalBatas: '2026-12-09',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 16–30 Nov 2026 (LLAT-06.4) yang ditolak KPPN pada 7 Desember 2026. Diajukan paling lambat 2 Hari Kerja yaitu 9 Desember 2026 pukul 17:00 WIB dengan bukti penolakan KPPN.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-UP-08DES',
    pasal: 'Pasal 24',
    ayat: 'Ayat (2) huruf b',
    jenisSpm: 'SPM-UP Tunai, SPM-TUP KKP, dan SPM-GUP',
    kondisiPenolakan: 'Penolakan pada tanggal 8 Desember 2026',
    tanggalPenolakanAcuan: '2026-12-08',
    tanggalBatas: '2026-12-09',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali SPM-UP Tunai, SPM-TUP KKP, dan SPM-GUP yang ditolak KPPN pada tanggal 8 Desember 2026. Diajukan paling lambat 9 Desember 2026 (1 Hari Kerja berikutnya) pada Jam Kerja dengan bukti penolakan.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 24 ayat (2) huruf b',
    hkRule: '1_HK',
    hkLabel: '1 Hari Kerja Berikutnya (Kritis!)'
  },
  {
    id: 'LLAT-REJECT-UP-09DES',
    pasal: 'Pasal 24',
    ayat: 'Ayat (2) huruf c',
    jenisSpm: 'SPM-UP Tunai, SPM-TUP KKP, dan SPM-GUP',
    kondisiPenolakan: 'Penolakan pada tanggal 9 Desember 2026',
    tanggalPenolakanAcuan: '2026-12-09',
    tanggalBatas: '2026-12-10',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali SPM-UP Tunai, SPM-TUP KKP, dan SPM-GUP yang ditolak KPPN pada tanggal 9 Desember 2026. Diajukan paling lambat 10 Desember 2026 (1 Hari Kerja berikutnya) pada Jam Kerja dengan bukti penolakan.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 24 ayat (2) huruf c',
    hkRule: '1_HK',
    hkLabel: '1 Hari Kerja Berikutnya (Kritis!)'
  },
  {
    id: 'LLAT-REJECT-UP-10DES',
    pasal: 'Pasal 24',
    ayat: 'Ayat (2)',
    jenisSpm: 'SPM-UP Tunai, SPM-TUP KKP, dan SPM-GUP',
    kondisiPenolakan: 'Penolakan pada tanggal 10 Desember 2026',
    tanggalPenolakanAcuan: '2026-12-10',
    tanggalBatas: '2026-12-11',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali SPM-UP Tunai, SPM-TUP KKP, dan SPM-GUP yang ditolak KPPN pada tanggal 10 Desember 2026. Diajukan paling lambat 11 Desember 2026 (1 Hari Kerja berikutnya) pada Jam Kerja dengan bukti penolakan.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 24 ayat (2)',
    hkRule: '1_HK',
    hkLabel: '1 Hari Kerja Berikutnya (Kritis!)'
  },
  {
    id: 'LLAT-REJECT-BAST-DES1',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 1–7 Des - LLAT-06.5)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 1–7 Des pada batas akhir 9 Des 2026',
    tanggalPenolakanAcuan: '2026-12-09',
    tanggalBatas: '2026-12-11',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 1–7 Des 2026 (LLAT-06.5) yang ditolak KPPN pada 9 Desember 2026. Diajukan paling lambat 2 Hari Kerja yaitu 11 Desember 2026 pukul 17:00 WIB dengan bukti penolakan KPPN.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-GAJI-11DES',
    pasal: 'Pasal 12',
    ayat: 'Huruf b',
    jenisSpm: 'SPM Gaji Induk / PPPK / PPNPN Jan 2027',
    kondisiPenolakan: 'Penolakan pada tanggal 11 Desember 2026',
    tanggalPenolakanAcuan: '2026-12-11',
    tanggalBatas: '2026-12-14',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali SPM Gaji Induk, PPPK, dan PPNPN Jan 2027 (Pasal 11) yang ditolak KPPN pada tanggal 11 Desember 2026. Diajukan paling lambat 14 Desember 2026 (Hari Kerja berikutnya / Senin) pada Jam Kerja.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 12 huruf b',
    hkRule: '1_HK',
    hkLabel: '1 Hari Kerja Berikutnya (Senin)'
  },
  {
    id: 'LLAT-REJECT-GAJI-14DES',
    pasal: 'Pasal 12',
    ayat: 'Huruf c',
    jenisSpm: 'SPM Gaji Induk / PPPK / PPNPN Jan 2027',
    kondisiPenolakan: 'Penolakan pada tanggal 14 Desember 2026',
    tanggalPenolakanAcuan: '2026-12-14',
    tanggalBatas: '2026-12-15',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali SPM Gaji Induk, PPPK, dan PPNPN Jan 2027 (Pasal 11) yang ditolak KPPN pada tanggal 14 Desember 2026. Diajukan paling lambat 15 Desember 2026 (1 Hari Kerja berikutnya) pada Jam Kerja.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 12 huruf c',
    hkRule: '1_HK',
    hkLabel: '1 Hari Kerja Berikutnya (Kritis!)'
  },
  {
    id: 'LLAT-REJECT-PTUP',
    pasal: 'Pasal 28',
    ayat: 'Ayat (1)',
    jenisSpm: 'SPM-PTUP (Pertanggungjawaban TUP)',
    kondisiPenolakan: 'Penolakan pengajuan SPM-PTUP (Pasal 27 ayat 1)',
    tanggalPenolakanAcuan: '2026-12-14',
    tanggalBatas: '2026-12-16',
    jamBatas: '17:00',
    deskripsi: 'Batas akhir pengajuan kembali perbaikan SPM-PTUP yang ditolak KPPN pada batas awal 14 Des 2026. Diajukan paling lambat 2 Hari Kerja yaitu 16 Desember 2026 pada Jam Kerja dengan melampirkan bukti penolakan. SP2D diselesaikan hari kerja berikutnya.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 28 ayat (1)',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-DES2',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 8–14 Des - LLAT-06.6)',
    kondisiPenolakan: 'Penolakan pengajuan SPM atas BAST/BAPP/Jaminan 8–14 Des pada batas akhir 16 Des 2026',
    tanggalPenolakanAcuan: '2026-12-16',
    tanggalBatas: '2026-12-18',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 8–14 Des 2026 (LLAT-06.6) yang ditolak KPPN pada 16 Desember 2026. Diajukan paling lambat 2 Hari Kerja yaitu 18 Desember 2026 pukul 17:00 WIB dengan bukti penolakan KPPN.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-KP-17DES',
    pasal: 'Pasal 17',
    ayat: 'Ayat (1) huruf b',
    jenisSpm: 'SPM-KP, SPM-IB, SPM-PP, Pengembalian Pendapatan',
    kondisiPenolakan: 'Penolakan setelah tanggal 17 Desember 2026',
    tanggalPenolakanAcuan: '2026-12-18',
    tanggalBatas: '2026-12-21',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM Pasal 16 ayat (1) yang ditolak KPPN setelah tanggal 17 Desember 2026. Diajukan paling lambat 21 Desember 2026 (Hari Kerja berikutnya / Senin) pada Jam Kerja dengan melampirkan bukti penolakan SPM.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 17 ayat (1) huruf b',
    hkRule: '1_HK',
    hkLabel: '1 Hari Kerja Berikutnya (Senin)'
  },
  {
    id: 'LLAT-REJECT-TUKIN-18DES',
    pasal: 'Pasal 9',
    ayat: 'Huruf b',
    jenisSpm: 'SPM-LS Tunjangan Kinerja Januari 2027',
    kondisiPenolakan: 'Penolakan pada tanggal 18 Desember 2026',
    tanggalPenolakanAcuan: '2026-12-18',
    tanggalBatas: '2026-12-21',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali SPM-LS Tunjangan Kinerja Jan 2027 (Pasal 8) yang ditolak KPPN pada tanggal 18 Desember 2026. Diajukan paling lambat 21 Desember 2026 (Hari Kerja berikutnya / Senin) pada Jam Kerja.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 9 huruf b',
    hkRule: '1_HK',
    hkLabel: '1 Hari Kerja Berikutnya (Senin)'
  },
  {
    id: 'LLAT-REJECT-TUKIN-21DES',
    pasal: 'Pasal 9',
    ayat: 'Huruf c',
    jenisSpm: 'SPM-LS Tunjangan Kinerja Januari 2027',
    kondisiPenolakan: 'Penolakan pada tanggal 21 Desember 2026',
    tanggalPenolakanAcuan: '2026-12-21',
    tanggalBatas: '2026-12-22',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali SPM-LS Tunjangan Kinerja Jan 2027 (Pasal 8) yang ditolak KPPN pada tanggal 21 Desember 2026. Diajukan paling lambat 22 Desember 2026 (1 Hari Kerja berikutnya) pada Jam Kerja.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 9 huruf c',
    hkRule: '1_HK',
    hkLabel: '1 Hari Kerja Berikutnya (Kritis!)'
  },
  {
    id: 'LLAT-REJECT-NONKONTRAK-21DES',
    pasal: 'Pasal 15',
    ayat: 'Ayat (1) huruf a',
    jenisSpm: 'SPM-LS Nonkontraktual / Perjalanan Dinas (LLAT-05.2)',
    kondisiPenolakan: 'Penolakan SPM-LS Nonkontraktual pada batas pengajuan 21 Des 2026',
    tanggalPenolakanAcuan: '2026-12-21',
    tanggalBatas: '2026-12-23',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM Nonkontraktual yang ditolak KPPN pada 21 Desember 2026. Diajukan paling lambat 2 Hari Kerja yaitu 23 Desember 2026 pada Jam Kerja dengan melampirkan bukti penolakan.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 15 ayat (1) huruf a',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-BAST-DES3',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual dengan BAST/BAPP/Jaminan (15–18 Des - LLAT-06.7)',
    kondisiPenolakan: 'Penolakan SPM BAST/BAPP/Jaminan 15–18 Des pada batas 23 Des 2026',
    tanggalPenolakanAcuan: '2026-12-23',
    tanggalBatas: '2026-12-28',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan (termasuk Jaminan Bank Garansi) yang ditolak KPPN pada 23 Desember 2026. Setelah libur cuti bersama Natal (24–27 Des), diajukan paling lambat 28 Desember 2026 (Hari Kerja berikutnya) pukul 17:00 WIB.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '1_HK',
    hkLabel: '1 Hari Kerja Berikutnya (Setelah Cuti Natal)'
  },
  {
    id: 'LLAT-REJECT-NONKONTRAK-22DES',
    pasal: 'Pasal 15',
    ayat: 'Ayat (1) huruf b',
    jenisSpm: 'SPM-LS Nonkontraktual / Perjalanan Dinas',
    kondisiPenolakan: 'Penolakan setelah tanggal 22 Desember 2026 (23 Des)',
    tanggalPenolakanAcuan: '2026-12-23',
    tanggalBatas: '2026-12-28',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM Pasal 14 yang ditolak KPPN setelah tanggal 22 Desember 2026. Diajukan paling lambat 28 Desember 2026 (Hari Kerja berikutnya setelah libur Natal) pada Jam Kerja dengan melampirkan bukti penolakan. SP2D diselesaikan hari kerja berikutnya.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 15 ayat (1) huruf b',
    hkRule: '1_HK',
    hkLabel: '1 Hari Kerja Berikutnya (Setelah Cuti Natal)'
  },
  {
    id: 'LLAT-REJECT-GAJI-28DES',
    pasal: 'Pasal 12',
    ayat: 'Huruf d',
    jenisSpm: 'SPM Gaji Induk / PPPK / PPNPN Jan 2027',
    kondisiPenolakan: 'Penolakan pada tanggal 28 Desember 2026',
    tanggalPenolakanAcuan: '2026-12-28',
    tanggalBatas: '2026-12-29',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali SPM Gaji Induk, PPPK, dan PPNPN Jan 2027 (Pasal 11) yang ditolak KPPN pada tanggal 28 Desember 2026. Diajukan paling lambat 29 Desember 2026 (1 Hari Kerja berikutnya) pada Jam Kerja.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 12 huruf d',
    hkRule: '1_HK',
    hkLabel: '1 Hari Kerja Berikutnya (Kritis!)'
  },
  {
    id: 'LLAT-REJECT-NONKONTRAK-28DES',
    pasal: 'Pasal 15',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Nonkontraktual / Honorarium Akhir Tahun',
    kondisiPenolakan: 'Penolakan pengajuan SPM Nonkontraktual pada 28 Desember 2026',
    tanggalPenolakanAcuan: '2026-12-28',
    tanggalBatas: '2026-12-29',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM Nonkontraktual yang ditolak KPPN pada tanggal 28 Desember 2026. Diajukan paling lambat 29 Desember 2026 (1 Hari Kerja berikutnya) pada Jam Kerja dengan bukti penolakan.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 15',
    hkRule: '1_HK',
    hkLabel: '1 Hari Kerja Berikutnya (Kritis!)'
  },
  {
    id: 'LLAT-REJECT-BAST-DES4-28',
    pasal: 'Pasal 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual (BAST/BAPP/Jaminan 19–23 Des - LLAT-06.8)',
    kondisiPenolakan: 'Penolakan SPM BAST/BAPP/Jaminan 19–23 Des pada batas pengajuan 28 Des 2026',
    tanggalPenolakanAcuan: '2026-12-28',
    tanggalBatas: '2026-12-30',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM-LS Kontraktual dengan BAST/BAPP/Jaminan 19–23 Des 2026 yang ditolak KPPN pada 28 Desember 2026. Diajukan paling lambat 2 Hari Kerja berikutnya yaitu 30 Desember 2026 pukul 17:00 WIB dengan bukti penolakan KPPN.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 19',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-KONTRAK-29DES',
    pasal: 'Pasal 15 & 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual / Nonkontraktual Akhir Tahun',
    kondisiPenolakan: 'Penolakan SPM pada tanggal 29 Desember 2026',
    tanggalPenolakanAcuan: '2026-12-29',
    tanggalBatas: '2026-12-30',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali perbaikan SPM yang ditolak KPPN pada tanggal 29 Desember 2026. Wajib diajukan paling lambat 1 Hari Kerja berikutnya yaitu 30 Desember 2026 pada Jam Kerja dengan melampirkan bukti penolakan KPPN.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 15 & Pasal 19',
    hkRule: '1_HK',
    hkLabel: '1 Hari Kerja Berikutnya (Kritis!)'
  },
  {
    id: 'LLAT-REJECT-KONTRAK-30DES',
    pasal: 'Pasal 15 & 19',
    ayat: 'Ayat (1) & (2)',
    jenisSpm: 'SPM-LS Kontraktual / Nonkontraktual (H-1 Tutup Buku TA 2026)',
    kondisiPenolakan: 'Penolakan SPM pada tanggal 30 Desember 2026',
    tanggalPenolakanAcuan: '2026-12-30',
    tanggalBatas: '2026-12-31',
    jamBatas: '17:00',
    deskripsi: 'Batas mutlak pengajuan kembali perbaikan SPM yang ditolak KPPN pada tanggal 30 Desember 2026. Wajib diajukan 1 Hari Kerja berikutnya yaitu 31 Desember 2026 pada Jam Kerja (Hari Kerja Terakhir TA 2026) dengan melampirkan bukti penolakan KPPN.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 15 & Pasal 19',
    hkRule: '1_HK',
    hkLabel: '1 Hari Kerja Berikutnya (Hari Terakhir TA 2026!)'
  },

  // =========================================================================
  // JANUARI 2027 - PENERIMAAN / NIHIL TA 2026 (PASAL 17 & 28)
  // =========================================================================
  {
    id: 'LLAT-REJECT-PENGEMBALIAN-08JAN',
    pasal: 'Pasal 17',
    ayat: 'Ayat (2)',
    jenisSpm: 'SPM Pengembalian Penerimaan / Kelebihan',
    kondisiPenolakan: 'Penolakan sampai dengan tanggal 8 Januari 2027',
    tanggalPenolakanAcuan: '2027-01-08',
    tanggalBatas: '2027-01-11',
    jamBatas: '17:00',
    deskripsi: 'Batas pengajuan kembali SPM Pasal 16 ayat (2) yang ditolak KPPN s.d. 8 Januari 2027. Paling lambat 2 Hari Kerja berikutnya dan paling lambat tanggal 11 Januari 2027 pada Jam Kerja dengan bukti penolakan.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 17 ayat (2)',
    hkRule: '2_HK',
    hkLabel: '2 Hari Kerja Berikutnya'
  },
  {
    id: 'LLAT-REJECT-GUP-NIHIL',
    pasal: 'Pasal 28',
    ayat: 'Ayat (2)',
    jenisSpm: 'SPM-GUP Nihil',
    kondisiPenolakan: 'Penolakan pengajuan SPM-GUP Nihil (Pasal 27 ayat 2)',
    tanggalPenolakanAcuan: '2027-01-11',
    tanggalBatas: '2027-01-12',
    jamBatas: '17:00',
    deskripsi: 'Batas akhir pengajuan kembali perbaikan SPM-GUP Nihil yang ditolak KPPN. Diajukan pada Hari Kerja berikutnya (1 Hari Kerja) dan paling lambat 12 Januari 2027 pada Jam Kerja dengan bukti penolakan. SP2D diselesaikan hari kerja berikutnya.',
    urgensi: 'KRITIS',
    dasarHukum: 'PER-9/PB/2026 Pasal 28 ayat (2)',
    hkRule: '1_HK',
    hkLabel: '1 Hari Kerja Berikutnya (Kritis!)'
  }
];

/**
 * Konversi daftar jadwal penolakan pasti menjadi LLATEvent resmi
 * untuk diintegrasikan ke dalam kalender dan daftar event LLAT
 */
export function generateRejectedSpmLlatEvents(): LLATEvent[] {
  return FIXED_REJECTED_SPM_SCHEDULE.map((item, idx) => {
    return {
      llat_id: `llat-reject-${item.id.toLowerCase()}`,
      tahun_anggaran: parseInt(item.tanggalBatas.substring(0, 4), 10),
      kode_kegiatan: `TOLAK-${String(idx + 1).padStart(2, '0')}`,
      nama_kegiatan: `Batas SPM Ditolak: ${item.jenisSpm}`,
      kategori: 'Batas Pengajuan Kembali SPM Ditolak',
      deskripsi: `${item.kondisiPenolakan}. ${item.deskripsi} [Aturan: ${item.hkLabel} - ${item.dasarHukum}]`,
      tanggal_mulai: item.tanggalPenolakanAcuan || item.tanggalBatas,
      tanggal_batas: item.tanggalBatas,
      jam_batas: item.jamBatas,
      timezone: 'WIB',
      prioritas: 'KRITIS',
      status: 'SEGERA',
      status_mode: 'AUTO',
      publikasi: 'PUBLISHED',
      target_pengguna: ['SEMUA_SATKER', 'PPK', 'PPSPM', 'BENDAHARA'],
      urutan: 200 + idx,
      is_active: true,
      created_at: '2026-10-01T08:00:00Z',
      updated_at: '2026-10-12T00:00:00Z',
      version: 1,
      nomor_peraturan: 'PER-9/PB/2026',
      nomor_peraturan_resmi: 'PER-9/PB/2026',
      
      // Extended fields
      no_pasal: item.pasal,
      ayat_pasal: item.ayat,
      dasar_hukum: item.dasarHukum,
      dokumen_terkait: 'Surat Bukti Penolakan SPM KPPN, Dokumen SPM Perbaikan, Supplier Header/Line',
      sanksi_keterlambatan: `SPM tidak dapat diproses / ditolak permanen bila melewati batas waktu pengajuan kembali (${item.hkLabel}) yang ditentukan regulasi PER-9/PB/2026.`,
      kutipan_sumber: `${item.pasal} ${item.ayat}: ${item.deskripsi} (${item.hkLabel})`,
      file_sumber: 'PER-9/PB/2026',
      
      tanggal_tenggat: item.tanggalBatas,
      jam_tenggat: item.jamBatas,
      status_verifikasi: 'TERVERIFIKASI',
      status_penyelesaian: 'BELUM_SELESAI',
      ketentuan_waktu: 'HARI_KERJA'
    };
  });
}
