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
  // Card visual theme properties
  cardGradientBar: string;
  cardBorder: string;
  cardBg: string;
  cardHeaderBg: string;
  innerBoxBg: string;
  quoteLeftBorder: string;
  accentIconColor: string;
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
    warnaBadge: 'bg-indigo-600 text-white border-indigo-700 dark:bg-indigo-500 dark:text-white',
    borderBadge: 'border-indigo-500',
    bgLight: 'bg-indigo-50',
    textLight: 'text-indigo-700',
    bgDark: 'dark:bg-indigo-950/50',
    textDark: 'dark:text-indigo-300',
    cardGradientBar: 'from-indigo-600 via-blue-600 to-indigo-800',
    cardBorder: 'border-2 border-indigo-300 dark:border-indigo-700/80 shadow-md shadow-indigo-500/10 hover:border-indigo-500',
    cardBg: 'bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-blue-950/30',
    cardHeaderBg: 'bg-indigo-50/50 dark:bg-indigo-950/30',
    innerBoxBg: 'bg-white/90 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-800/70',
    quoteLeftBorder: 'border-l-4 border-l-indigo-500',
    accentIconColor: 'text-indigo-600 dark:text-indigo-400',
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
    warnaBadge: 'bg-sky-600 text-white border-sky-700 dark:bg-sky-500 dark:text-white',
    borderBadge: 'border-sky-500',
    bgLight: 'bg-sky-50',
    textLight: 'text-sky-700',
    bgDark: 'dark:bg-sky-950/50',
    textDark: 'dark:text-sky-300',
    cardGradientBar: 'from-sky-500 via-blue-500 to-cyan-600',
    cardBorder: 'border-2 border-sky-300 dark:border-sky-700/80 shadow-md shadow-sky-500/10 hover:border-sky-500',
    cardBg: 'bg-gradient-to-br from-sky-50/70 via-white to-cyan-50/40 dark:from-sky-950/40 dark:via-slate-900 dark:to-cyan-950/30',
    cardHeaderBg: 'bg-sky-50/50 dark:bg-sky-950/30',
    innerBoxBg: 'bg-white/90 dark:bg-slate-900/90 border border-sky-200 dark:border-sky-800/70',
    quoteLeftBorder: 'border-l-4 border-l-sky-500',
    accentIconColor: 'text-sky-600 dark:text-sky-400',
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
    warnaBadge: 'bg-emerald-600 text-white border-emerald-700 dark:bg-emerald-500 dark:text-white',
    borderBadge: 'border-emerald-500',
    bgLight: 'bg-emerald-50',
    textLight: 'text-emerald-700',
    bgDark: 'dark:bg-emerald-950/50',
    textDark: 'dark:text-emerald-300',
    cardGradientBar: 'from-emerald-500 via-teal-500 to-green-600',
    cardBorder: 'border-2 border-emerald-400 dark:border-emerald-700/80 shadow-md shadow-emerald-500/10 hover:border-emerald-500',
    cardBg: 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30',
    cardHeaderBg: 'bg-emerald-50/50 dark:bg-emerald-950/30',
    innerBoxBg: 'bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-800/70',
    quoteLeftBorder: 'border-l-4 border-l-emerald-500',
    accentIconColor: 'text-emerald-600 dark:text-emerald-400',
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
    warnaBadge: 'bg-purple-600 text-white border-purple-700 dark:bg-purple-500 dark:text-white',
    borderBadge: 'border-purple-500',
    bgLight: 'bg-purple-50',
    textLight: 'text-purple-700',
    bgDark: 'dark:bg-purple-950/50',
    textDark: 'dark:text-purple-300',
    cardGradientBar: 'from-purple-600 via-fuchsia-600 to-indigo-600',
    cardBorder: 'border-2 border-purple-300 dark:border-purple-700/80 shadow-md shadow-purple-500/10 hover:border-purple-500',
    cardBg: 'bg-gradient-to-br from-purple-50/80 via-white to-fuchsia-50/50 dark:from-purple-950/40 dark:via-slate-900 dark:to-fuchsia-950/30',
    cardHeaderBg: 'bg-purple-50/50 dark:bg-purple-950/30',
    innerBoxBg: 'bg-white/90 dark:bg-slate-900/90 border border-purple-200 dark:border-purple-800/70',
    quoteLeftBorder: 'border-l-4 border-l-purple-500',
    accentIconColor: 'text-purple-600 dark:text-purple-400',
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
    warnaBadge: 'bg-amber-600 text-white border-amber-700 dark:bg-amber-500 dark:text-white',
    borderBadge: 'border-amber-500',
    bgLight: 'bg-amber-50',
    textLight: 'text-amber-700',
    bgDark: 'dark:bg-amber-950/50',
    textDark: 'dark:text-amber-300',
    cardGradientBar: 'from-amber-500 via-orange-500 to-yellow-600',
    cardBorder: 'border-2 border-amber-400 dark:border-amber-700/80 shadow-md shadow-amber-500/10 hover:border-amber-500',
    cardBg: 'bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-950/30',
    cardHeaderBg: 'bg-amber-50/50 dark:bg-amber-950/30',
    innerBoxBg: 'bg-white/90 dark:bg-slate-900/90 border border-amber-200 dark:border-amber-800/70',
    quoteLeftBorder: 'border-l-4 border-l-amber-500',
    accentIconColor: 'text-amber-600 dark:text-amber-400',
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
    warnaBadge: 'bg-cyan-600 text-white border-cyan-700 dark:bg-cyan-500 dark:text-white',
    borderBadge: 'border-cyan-500',
    bgLight: 'bg-cyan-50',
    textLight: 'text-cyan-700',
    bgDark: 'dark:bg-cyan-950/50',
    textDark: 'dark:text-cyan-300',
    cardGradientBar: 'from-cyan-500 via-teal-500 to-blue-600',
    cardBorder: 'border-2 border-cyan-300 dark:border-cyan-700/80 shadow-md shadow-cyan-500/10 hover:border-cyan-500',
    cardBg: 'bg-gradient-to-br from-cyan-50/80 via-white to-sky-50/50 dark:from-cyan-950/40 dark:via-slate-900 dark:to-sky-950/30',
    cardHeaderBg: 'bg-cyan-50/50 dark:bg-cyan-950/30',
    innerBoxBg: 'bg-white/90 dark:bg-slate-900/90 border border-cyan-200 dark:border-cyan-800/70',
    quoteLeftBorder: 'border-l-4 border-l-cyan-500',
    accentIconColor: 'text-cyan-600 dark:text-cyan-400',
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
    warnaBadge: 'bg-rose-600 text-white border-rose-700 dark:bg-rose-500 dark:text-white',
    borderBadge: 'border-rose-500',
    bgLight: 'bg-rose-50',
    textLight: 'text-rose-700',
    bgDark: 'dark:bg-rose-950/50',
    textDark: 'dark:text-rose-300',
    cardGradientBar: 'from-rose-500 via-pink-500 to-red-600',
    cardBorder: 'border-2 border-rose-300 dark:border-rose-700/80 shadow-md shadow-rose-500/10 hover:border-rose-500',
    cardBg: 'bg-gradient-to-br from-rose-50/80 via-white to-pink-50/50 dark:from-rose-950/40 dark:via-slate-900 dark:to-pink-950/30',
    cardHeaderBg: 'bg-rose-50/50 dark:bg-rose-950/30',
    innerBoxBg: 'bg-white/90 dark:bg-slate-900/90 border border-rose-200 dark:border-rose-800/70',
    quoteLeftBorder: 'border-l-4 border-l-rose-500',
    accentIconColor: 'text-rose-600 dark:text-rose-400',
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
    warnaBadge: 'bg-teal-600 text-white border-teal-700 dark:bg-teal-500 dark:text-white',
    borderBadge: 'border-teal-500',
    bgLight: 'bg-teal-50',
    textLight: 'text-teal-700',
    bgDark: 'dark:bg-teal-950/50',
    textDark: 'dark:text-teal-300',
    cardGradientBar: 'from-teal-500 via-emerald-500 to-cyan-600',
    cardBorder: 'border-2 border-teal-300 dark:border-teal-700/80 shadow-md shadow-teal-500/10 hover:border-teal-400',
    cardBg: 'bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/50 dark:from-teal-950/40 dark:via-slate-900 dark:to-emerald-950/30',
    cardHeaderBg: 'bg-teal-50/50 dark:bg-teal-950/30',
    innerBoxBg: 'bg-white/90 dark:bg-slate-900/90 border border-teal-200 dark:border-teal-800/70',
    quoteLeftBorder: 'border-l-4 border-l-teal-500',
    accentIconColor: 'text-teal-600 dark:text-teal-400',
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
    warnaBadge: 'bg-slate-700 text-white border-slate-800 dark:bg-slate-600 dark:text-white',
    borderBadge: 'border-slate-500',
    bgLight: 'bg-slate-50',
    textLight: 'text-slate-700',
    bgDark: 'dark:bg-slate-900',
    textDark: 'dark:text-slate-300',
    cardGradientBar: 'from-slate-500 via-gray-500 to-zinc-600',
    cardBorder: 'border-2 border-slate-300 dark:border-slate-700 hover:border-slate-400 shadow-md shadow-slate-500/5',
    cardBg: 'bg-gradient-to-br from-slate-50/90 via-white to-zinc-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-zinc-950',
    cardHeaderBg: 'bg-slate-50 dark:bg-slate-800/40',
    innerBoxBg: 'bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700',
    quoteLeftBorder: 'border-l-4 border-l-slate-500',
    accentIconColor: 'text-slate-600 dark:text-slate-400',
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
    warnaBadge: 'bg-slate-700 text-white border-slate-800 dark:bg-slate-600 dark:text-white',
    borderBadge: 'border-slate-400',
    bgLight: 'bg-slate-50',
    textLight: 'text-slate-700',
    bgDark: 'dark:bg-slate-900',
    textDark: 'dark:text-slate-300',
    cardGradientBar: 'from-slate-500 via-gray-500 to-zinc-600',
    cardBorder: 'border-2 border-slate-300 dark:border-slate-700 hover:border-slate-400 shadow-md shadow-slate-500/5',
    cardBg: 'bg-gradient-to-br from-slate-50/90 via-white to-zinc-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-zinc-950',
    cardHeaderBg: 'bg-slate-50 dark:bg-slate-800/40',
    innerBoxBg: 'bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700',
    quoteLeftBorder: 'border-l-4 border-l-slate-500',
    accentIconColor: 'text-slate-600 dark:text-slate-400',
    kriteria: []
  };
}
