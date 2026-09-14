import { PerhitunganIkpaExcelReference, ExcelSheetData } from '../types';

export interface InterfaceRowData {
  no: number;
  kppn: string;
  ba: string;
  kodeSatker: string;
  uraianSatker: string;
  revisiDipa: number;
  deviasiHal3: number;
  penyerapan: number;
  kontraktual: number;
  tagihan: number;
  upTup: number;
  capaianOutput: number;
  nilaiTotal: number;
  konversiBobot: number;
  dispensasiSpm: number;
  nilaiAkhir: number;
}

export interface RevisiDipaRow {
  id: number;
  periode: string;
  revisiKe: number;
  tanggalRevisi: string;
  kodeJenisRevisi: string;
  paguSebelum: number;
  paguMenjadi: number;
  is14Jenis: boolean;
  diperhitungkan: boolean;
  jumlahRevisiNetto: number;
  keterangan: string; // "Semester I" or "Semester II"
  nilaiIndikator: number;
  nilaiIkpa: number;
}

export interface DeviasiHal3MonthRow {
  periode: string; // "01" - "12"
  bulanName: string;
  rencana51: number;
  rencana52: number;
  rencana53: number;
  rencana57: number;
  realisasi51: number;
  realisasi52: number;
  realisasi53: number;
  realisasi57: number;
  // Green columns computed:
  deviasi51: number;
  deviasi52: number;
  deviasi53: number;
  deviasi57: number;
  persenDeviasi51: number;
  persenDeviasi52: number;
  persenDeviasi53: number;
  persenDeviasi57: number;
  proporsi51: number;
  proporsi52: number;
  proporsi53: number;
  proporsi57: number;
  deviasiTertimbang51: number;
  deviasiTertimbang52: number;
  deviasiTertimbang53: number;
  deviasiTertimbang57: number;
  deviasiSeluruhJBel: number;
  rataRataDeviasiKumulatif: number;
  nilaiIkpa: number;
}

export interface PenyerapanMonthRow {
  periode: string;
  bulanName: string;
  pagu51: number;
  pagu52: number;
  pagu53: number;
  pagu57: number;
  blokir51: number;
  blokir52: number;
  blokir53: number;
  blokir57: number;
  target51: number; // e.g. 0.2, 0.5, 0.75, 0.9
  target52: number;
  target53: number;
  target57: number;
  realisasi51: number;
  realisasi52: number;
  realisasi53: number;
  realisasi57: number;
  // Green columns computed:
  paguNetto51: number;
  paguNetto52: number;
  paguNetto53: number;
  paguNetto57: number;
  proporsi51: number;
  proporsi52: number;
  proporsi53: number;
  proporsi57: number;
  persenRealisasi51: number;
  persenRealisasi52: number;
  persenRealisasi53: number;
  persenRealisasi57: number;
  nkpaTertimbang51: number;
  nkpaTertimbang52: number;
  nkpaTertimbang53: number;
  nkpaTertimbang57: number;
  nkpaTertimbangTotal: number;
  nilaiIkpa: number;
}

export interface KontraktualRow {
  id: number;
  kodeSatker: string;
  namaSatker: string;
  noKontrak: string;
  jenisBelanja: string; // "52" or "53"
  nilaiKontrak: number;
  tanggalKontrak: string;
  tanggalMasuk: string;
  tanggalPenyelesaian: string;
  triwulanSemester: string;
  nilaiDistribusiAkselerasi: number;
  nilaiKontrakDini: number;
  nilaiAkselerasi53: number;
  // Green computed
  selisihHariKerja: number;
  isTepatWaktu: boolean;
}

export interface TagihanRow {
  id: number;
  satker: string;
  noSp2d: string;
  tanggalSp2d: string;
  noSpm: string;
  tanggalSpm: string;
  nilaiSp2d: number;
  tanggalBast: string;
  tanggalBapp: string;
  tanggalMulaiPerhitungan: string;
  tanggalKonversiAdk: string;
  selisihHari: number;
  jumlahHariLibur: number;
  jumlahHariFinal: number;
  status: 'TEPAT' | 'TERLAMBAT';
}

export interface UpTupTunaiRow {
  id: number;
  kodeSatker: string;
  namaSatker: string;
  sumberDana: string;
  jenis: 'UP' | 'GUP' | 'TUP' | 'PTUP';
  tanggal: string;
  selisihHariKalender: number;
  totalGu: number;
  totalOutstandingUp: number;
  persenRevolving: number;
  status: string;
  totalHariSebulan: number;
  persenGupDisebulankan: number;
  totalTup: number;
  totalSetoranTup: number;
  nilaiKetepatanWaktu: number;
  nilaiPersentaseGupDisebulankan: number;
  nilaiSetoranTup: number;
}

export interface UpTupKkpRow {
  periode: string;
  bulanName: string;
  kodeSatker: string;
  namaSatker: string;
  upKkpPerBulan: number;
  upKkp1Tahun: number;
  targetPenggunaanKkp: number;
  penggunaanKkp: number;
  // Green computed
  nilaiRasioKkp: number;
  nilaiUpKkp: number;
  nilaiUpTunai: number;
  nilaiGabunganUpTup: number;
}

export interface DispensasiSpmData {
  jumlahSpmTw4: number;
  jumlahDispensasiSpm: number;
  rasio: number;
  pengurangNilai: number;
}

export interface CapaianOutputRoRow {
  id: number;
  satker: string;
  namaSatker: string;
  kppn: string;
  bulan: number;
  program: string;
  kegiatan: string;
  kro: string;
  ro: string;
  uraianRo: string;
  target: number;
  satuan: string;
  realisasiRo: number;
  persenProgress: number;
  statusKonfirmasi: string;
  targetPcro: number;
  nilai: number;
  nilaiAkhir: number;
}

export interface CapaianOutputKetepatanRow {
  no: number;
  satker: string;
  namaSatker: string;
  bulan: string;
  ketepatan: 'Tepat Waktu' | 'Terlambat';
  nilaiKetepatanWaktu: number;
}

export const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DAFTAR_14_JENIS_REVISI_DIPA = [
  { kode: 201, uraian: 'Antar-Fungsi/Sub-Fungsi dan/atau Antar-Program' },
  { kode: 202, uraian: 'Pergeseran anggaran belanja operasional' },
  { kode: 203, uraian: 'Pemenuhan Belanja Operasional' },
  { kode: 204, uraian: 'Penyelesaian Pagu Minus Belanja Pegawai Operasional' },
  { kode: 205, uraian: 'Pergeseran Anggaran dari Belanja Operasional ke Belanja Non-Operasional' },
  { kode: 206, uraian: 'Penyelesaian Tunggakan' },
  { kode: 207, uraian: 'Pemanfaatan Sisa Anggaran Kontraktual dan/atau Swakelola' },
  { kode: 208, uraian: 'Pergeseran anggaran Antarjenis Belanja' },
  { kode: 209, uraian: 'Kontrak Tahun Jamak' },
  { kode: 210, uraian: 'RO Cadangan' },
  { kode: 211, uraian: 'Penurunan volume RO secara total' },
  { kode: 212, uraian: 'Revisi dalam rangka Pinjaman dan/atau Hibah Luar Negeri' },
  { kode: 213, uraian: 'Revisi dalam rangka Pinjaman dan/atau Hibah Dalam Negeri' },
  { kode: 214, uraian: 'Pergeseran Anggaran Antar-KRO dan/atau Antar-Kegiatan' }
];

// Helper to format currency
export function formatRupiah(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0';
  return Math.round(val).toLocaleString('id-ID');
}

// Helper to format percentage
export function formatPercent(val: number, decimals = 2): string {
  if (isNaN(val) || val === null || val === undefined) return '0,00%';
  return val.toFixed(decimals).replace('.', ',') + '%';
}

// Helper to format score
export function formatScore(val: number, decimals = 2): string {
  if (isNaN(val) || val === null || val === undefined) return '0,00';
  return val.toFixed(decimals).replace('.', ',');
}

/**
 * Mem-parsing string nominal rupiah ke number secara akurat.
 * Mendukung format:
 * - "916.718.000" (titik sebagai pemisah ribuan standar Indonesia) -> 916718000
 * - "916,718,000" (koma sebagai pemisah ribuan standar US) -> 916718000
 * - "916718000" (angka polos) -> 916718000
 * - "Rp 916.718.000" (dengan prefix Rp) -> 916718000
 * - "916.718.000,00" (titik ribuan, koma desimal) -> 916718000
 * - "916,718,000.00" (koma ribuan, titik desimal) -> 916718000
 */
export function parseRupiahAmount(rawInput: string | number): number {
  if (typeof rawInput === 'number') {
    return isNaN(rawInput) ? 0 : rawInput;
  }
  if (!rawInput) return 0;

  let str = String(rawInput).trim();
  if (!str) return 0;

  // Hapus prefix "Rp", "IDR", dan spasi
  str = str.replace(/^(?:rp|idr)\.?\s*/i, '').replace(/\s+/g, '');

  const hasDot = str.includes('.');
  const hasComma = str.includes(',');

  // Kasus 1: Memiliki titik DAN koma
  if (hasDot && hasComma) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Format Indonesia: 916.718.000,50 -> titik ribuan, koma desimal
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Format US: 916,718,000.50 -> koma ribuan, titik desimal
      str = str.replace(/,/g, '');
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  // Kasus 2: Hanya memiliki titik
  if (hasDot && !hasComma) {
    const dotCount = (str.match(/\./g) || []).length;
    // Jika lebih dari 1 titik (contoh: 916.718.000), pasti pemisah ribuan
    if (dotCount > 1) {
      str = str.replace(/\./g, '');
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    }
    // Jika tepat 1 titik:
    const parts = str.split('.');
    // Jika 3 digit di belakang titik (contoh: "916.718" atau "500.000"), di konteks rupiah adalah pemisah ribuan!
    if (parts[1] && parts[1].length === 3) {
      str = str.replace(/\./g, '');
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    }
    // Jika bukan 3 digit (contoh "41.2" atau "10.5"), perlakukan sebagai desimal
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  // Kasus 3: Hanya memiliki koma
  if (hasComma && !hasDot) {
    const commaCount = (str.match(/,/g) || []).length;
    // Jika lebih dari 1 koma (contoh: 916,718,000), pasti pemisah ribuan
    if (commaCount > 1) {
      str = str.replace(/,/g, '');
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    }
    // Jika tepat 1 koma:
    const parts = str.split(',');
    if (parts[1] && parts[1].length === 3) {
      // Pemisah ribuan ala US (contoh: 916,718)
      str = str.replace(/,/g, '');
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    }
    // Desimal koma ala Indonesia (contoh: "15,5" -> 15.5)
    str = str.replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  // Kasus 4: Hanya angka biasa
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Mem-parsing string persentase target ke decimal (0 s.d. 1)
 * Contoh: "15%" -> 0.15, "15" -> 0.15, "15,5%" -> 0.155
 */
export function parseTargetPercent(rawInput: string | number): number | undefined {
  if (rawInput === undefined || rawInput === null) return undefined;
  if (typeof rawInput === 'number') {
    if (isNaN(rawInput) || rawInput < 0) return undefined;
    return rawInput > 1 ? rawInput / 100 : rawInput;
  }

  const str = String(rawInput).trim();
  if (str === '') return undefined;

  // Hapus % dan spasi, ganti koma desimal menjadi titik
  const sanitized = str.replace(/%/g, '').replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  if (!sanitized) return undefined;

  const num = parseFloat(sanitized);
  if (isNaN(num) || num < 0) return undefined;
  return num > 1 ? num / 100 : num;
}

