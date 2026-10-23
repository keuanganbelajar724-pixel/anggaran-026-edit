import { JenisDispensasiIKPA } from '../types';

export interface KriteriaDispensasiItem {
  id: string; // e.g. '3.a'
  kode: string; // 'a', 'b', 'c', 'd', 'e'
  teks: string;
  catatanKhusus?: string;
  memerlukanSuratMenteri?: boolean; // *) Surat/Keputusan Kepala Badan/Menteri
  memerlukanDipaIVB?: boolean;      // **) Catatan pada DIPA Halaman IVB
}

export interface IndikatorDispensasiConfig {
  jenis: JenisDispensasiIKPA;
  nomor: number;
  nama: string;
  singkatan: string;
  warnaBadge: string;
  borderBadge: string;
  bgLight: string;
  textLight: string;
  bgDark: string;
  textDark: string;
  kriteria: KriteriaDispensasiItem[];
}

/**
 * Data Kriteria Pengajuan Permohonan Penyesuaian IKPA
 * Berdasarkan Nota Dinas Direktur Pelaksanaan Anggaran
 * Nomor  : ND-1423/PB.2/2026
 * Tanggal: 6 Oktober 2026
 */
export const KRITERIA_DISPENSASI_ND1423: IndikatorDispensasiConfig[] = [
  {
    jenis: 'REVISI_DIPA',
    nomor: 1,
    nama: 'Revisi DIPA',
    singkatan: 'Revisi DIPA',
    warnaBadge: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800',
    borderBadge: 'border-indigo-500',
    bgLight: 'bg-indigo-50',
    textLight: 'text-indigo-700',
    bgDark: 'dark:bg-indigo-950/50',
    textDark: 'dark:text-indigo-300',
    kriteria: [
      {
        id: '1.a',
        kode: 'a',
        teks: 'Kesalahan pemberian kode jenis revisi oleh Kantor Wilayah Direktorat Jenderal Perbendaharaan/Direktorat Pelaksanaan Anggaran/Direktorat Jenderal Anggaran.'
      },
      {
        id: '1.b',
        kode: 'b',
        teks: 'Terdapat revisi dalam hal pagu anggaran tetap yang dilakukan bersamaan dengan revisi yang merupakan kebijakan pemerintah.'
      }
    ]
  },
  {
    jenis: 'DEVIASI_HAL3',
    nomor: 2,
    nama: 'Deviasi Hal III DIPA',
    singkatan: 'Deviasi Hal III',
    warnaBadge: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800',
    borderBadge: 'border-sky-500',
    bgLight: 'bg-sky-50',
    textLight: 'text-sky-700',
    bgDark: 'dark:bg-sky-950/50',
    textDark: 'dark:text-sky-300',
    kriteria: [
      {
        id: '2.a',
        kode: 'a',
        teks: 'Keterlambatan/kesalahan posting revisi pemutakhiran Rencana Penarikan Dana oleh Kantor Wilayah Direktorat Jenderal Perbendaharaan/Direktorat Pelaksanaan Anggaran/Direktorat Jenderal Anggaran.'
      },
      {
        id: '2.b',
        kode: 'b',
        teks: 'Perubahan alokasi anggaran karena adanya kebijakan khusus di tingkat K/L*).',
        catatanKhusus: 'Dokumen pendukung terkait kebijakan khusus di tingkat K/L minimal memuat Surat/Keputusan Kepala Badan/Menteri.',
        memerlukanSuratMenteri: true
      },
      {
        id: '2.c',
        kode: 'c',
        teks: 'Perubahan alokasi anggaran karena adanya penambahan anggaran dari BA BUN**).',
        catatanKhusus: 'Penambahan anggaran dari BA BUN dapat terlihat melalui Catatan pada DIPA Halaman IVB.',
        memerlukanDipaIVB: true
      },
      {
        id: '2.d',
        kode: 'd',
        teks: 'Terdapat revisi DIPA atas tindak lanjut kebijakan pemerintah yang dilakukan bersamaan dengan periode pemutakhiran Rencana Penarikan Dana.'
      },
      {
        id: '2.e',
        kode: 'e',
        teks: 'Keterlambatan penerbitan SP2D melewati bulan berkenaan karena adanya kendala/error pada aplikasi dan/atau keadaan force majeure.'
      }
    ]
  },
  {
    jenis: 'PENYERAPAN_ANGGARAN',
    nomor: 3,
    nama: 'Penyerapan Anggaran',
    singkatan: 'Penyerapan',
    warnaBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
    borderBadge: 'border-emerald-500',
    bgLight: 'bg-emerald-50',
    textLight: 'text-emerald-700',
    bgDark: 'dark:bg-emerald-950/50',
    textDark: 'dark:text-emerald-300',
    kriteria: [
      {
        id: '3.a',
        kode: 'a',
        teks: 'Perubahan alokasi anggaran karena adanya penambahan anggaran yang bersumber dari kebijakan pemerintah di bidang penganggaran dan pelaksanaan anggaran.'
      },
      {
        id: '3.b',
        kode: 'b',
        teks: 'Perubahan alokasi anggaran karena adanya kebijakan khusus di tingkat K/L*).',
        catatanKhusus: 'Dokumen pendukung terkait kebijakan khusus di tingkat K/L minimal memuat Surat/Keputusan Kepala Badan/Menteri.',
        memerlukanSuratMenteri: true
      },
      {
        id: '3.c',
        kode: 'c',
        teks: 'Perubahan alokasi anggaran karena adanya penambahan anggaran dari BA BUN**).',
        catatanKhusus: 'Penambahan anggaran dari BA BUN dapat terlihat melalui Catatan pada DIPA Halaman IVB.',
        memerlukanDipaIVB: true
      },
      {
        id: '3.d',
        kode: 'd',
        teks: 'Pelaksanaan kegiatan yang berkaitan dengan penanganan bencana.'
      }
    ]
  },
  {
    jenis: 'KONTRAKTUAL',
    nomor: 4,
    nama: 'Belanja Kontraktual',
    singkatan: 'Kontraktual',
    warnaBadge: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800',
    borderBadge: 'border-purple-500',
    bgLight: 'bg-purple-50',
    textLight: 'text-purple-700',
    bgDark: 'dark:bg-purple-950/50',
    textDark: 'dark:text-purple-300',
    kriteria: [
      {
        id: '4.a',
        kode: 'a',
        teks: 'Perubahan alokasi anggaran karena adanya kebijakan khusus di tingkat K/L*).',
        catatanKhusus: 'Dokumen pendukung terkait kebijakan khusus di tingkat K/L minimal memuat Surat/Keputusan Kepala Badan/Menteri.',
        memerlukanSuratMenteri: true
      },
      {
        id: '4.b',
        kode: 'b',
        teks: 'Perubahan alokasi anggaran karena adanya penambahan anggaran dari BA BUN**).',
        catatanKhusus: 'Penambahan anggaran dari BA BUN dapat terlihat melalui Catatan pada DIPA Halaman IVB.',
        memerlukanDipaIVB: true
      },
      {
        id: '4.c',
        kode: 'c',
        teks: 'Pelaksanaan kontrak yang berkaitan dengan penanganan bencana.'
      },
      {
        id: '4.d',
        kode: 'd',
        teks: 'Pelaksanaan kontrak di akhir tahun anggaran karena adanya perubahan alokasi anggaran yang bersumber dari kebijakan pemerintah.'
      }
    ]
  },
  {
    jenis: 'PENYELESAIAN_TAGIHAN',
    nomor: 5,
    nama: 'Penyelesaian Tagihan',
    singkatan: 'Tagihan',
    warnaBadge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
    borderBadge: 'border-amber-500',
    bgLight: 'bg-amber-50',
    textLight: 'text-amber-700',
    bgDark: 'dark:bg-amber-950/50',
    textDark: 'dark:text-amber-300',
    kriteria: [
      {
        id: '5.a',
        kode: 'a',
        teks: 'Kesalahan input tanggal BAST/BAPP pada aplikasi SAKTI.'
      },
      {
        id: '5.b',
        kode: 'b',
        teks: 'Keterlambatan pembayaran disebabkan kebijakan di bidang penganggaran dan/atau pelaksanaan anggaran.'
      }
    ]
  },
  {
    jenis: 'UP_TUP',
    nomor: 6,
    nama: 'Pengelolaan UP/TUP',
    singkatan: 'UP/TUP',
    warnaBadge: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-800',
    borderBadge: 'border-cyan-500',
    bgLight: 'bg-cyan-50',
    textLight: 'text-cyan-700',
    bgDark: 'dark:bg-cyan-950/50',
    textDark: 'dark:text-cyan-300',
    kriteria: [
      {
        id: '6.a',
        kode: 'a',
        teks: 'Keterlambatan penerbitan SP2D karena adanya kendala/error pada aplikasi dan/atau keadaan force majeure.'
      }
    ]
  },
  {
    jenis: 'DISPENSASI_SPM',
    nomor: 7,
    nama: 'Dispensasi SPM',
    singkatan: 'Dispensasi SPM',
    warnaBadge: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800',
    borderBadge: 'border-rose-500',
    bgLight: 'bg-rose-50',
    textLight: 'text-rose-700',
    bgDark: 'dark:bg-rose-950/50',
    textDark: 'dark:text-rose-300',
    kriteria: [
      {
        id: '7.a',
        kode: 'a',
        teks: 'Pelaksanaan kontrak yang berkaitan dengan penanganan bencana.'
      },
      {
        id: '7.b',
        kode: 'b',
        teks: 'Perubahan alokasi anggaran karena adanya penambahan anggaran yang bersumber dari kebijakan pemerintah di bidang penganggaran dan pelaksanaan anggaran.'
      }
    ]
  },
  {
    jenis: 'CAPAIAN_OUTPUT',
    nomor: 8,
    nama: 'Capaian Output',
    singkatan: 'Capaian Output',
    warnaBadge: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-800',
    borderBadge: 'border-teal-500',
    bgLight: 'bg-teal-50',
    textLight: 'text-teal-700',
    bgDark: 'dark:bg-teal-950/50',
    textDark: 'dark:text-teal-300',
    kriteria: [
      {
        id: '8.a',
        kode: 'a',
        teks: 'Terdapat alokasi RO yang tidak dapat direalisasikan karena adanya kebijakan pemerintah di bidang penganggaran dan pelaksanaan anggaran.'
      }
    ]
  },
  {
    jenis: 'LAINNYA',
    nomor: 9,
    nama: 'Lainnya / Keadaan Kahar',
    singkatan: 'Force Majeure',
    warnaBadge: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    borderBadge: 'border-slate-500',
    bgLight: 'bg-slate-50',
    textLight: 'text-slate-700',
    bgDark: 'dark:bg-slate-900',
    textDark: 'dark:text-slate-300',
    kriteria: [
      {
        id: '9.a',
        kode: 'a',
        teks: 'Keadaan kahar (force majeure) seperti bencana alam, kendala teknis jaringan terpusat berskala nasional, atau kondisi darurat lainnya yang telah dinyatakan secara resmi.'
      }
    ]
  }
];

export const CATATAN_KAKI_ND1423 = {
  kebijakanKL: '*) Dokumen pendukung terkait kebijakan khusus di tingkat K/L minimal memuat Surat/Keputusan Kepala Badan/Menteri.',
  anggaranBUN: '**) Penambahan anggaran dari BA BUN dapat terlihat melalui Catatan pada DIPA Halaman IVB.'
};

export function getIndikatorDispensasiConfig(jenis: JenisDispensasiIKPA | string): IndikatorDispensasiConfig {
  const found = KRITERIA_DISPENSASI_ND1423.find(k => k.jenis === jenis);
  if (found) return found;

  return {
    jenis: 'LAINNYA' as JenisDispensasiIKPA,
    nomor: 9,
    nama: jenis || 'Dispensasi Lainnya',
    singkatan: jenis || 'Dispensasi',
    warnaBadge: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
    borderBadge: 'border-slate-400',
    bgLight: 'bg-slate-50',
    textLight: 'text-slate-700',
    bgDark: 'dark:bg-slate-900',
    textDark: 'dark:text-slate-300',
    kriteria: []
  };
}
