import { BelanjaKontraktualInput, IndicatorResult, CalculationDetail } from '../models/ikpa';
import { round2, average, excelAverageRaw } from './rounding';
import { normalizeDateToIso } from '../utils/ikpaDateUtils';

export { round2 };

export const EARLY_CONTRACT_SCORE = 110;
export const STANDARD_CONTRACT_SCORE = 100;
export const PRA_DIPA_SCORE = 120;

/**
 * Excel AVERAGE implementation:
 * - Strictly ignores non-numeric, blank, null, or undefined values.
 * - Does NOT treat blank cells as 0.
 */
export function excelAverage(values: Array<number | string | null | undefined>): number {
  return excelAverageRaw(values);
}

/**
 * Mengambil Triwulan (I, II, III, IV) dari tanggal ISO YYYY-MM-DD.
 * Kolom K: =IF(MONTH(H)<=3,"I",IF(MONTH(H)<=6,"II",IF(MONTH(H)<=9,"III","IV")))
 */
export function getQuarterFromDate(dateStr?: string): 'I' | 'II' | 'III' | 'IV' | '' {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const clean = normalizeDateToIso(dateStr);
  if (!clean) return '';
  const parts = clean.split('-');
  if (parts.length < 2) return '';
  const month = parseInt(parts[1], 10);
  if (isNaN(month) || month < 1 || month > 12) return '';

  if (month <= 3) return 'I';
  if (month <= 6) return 'II';
  if (month <= 9) return 'III';
  return 'IV';
}

/**
 * Mengambil Semester (I, II) dari tanggal ISO YYYY-MM-DD.
 * Kolom L: =IF(MONTH(H)<=6,"I","II")
 */
export function getSemesterFromDate(dateStr?: string): 'I' | 'II' | '' {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const clean = normalizeDateToIso(dateStr);
  if (!clean) return '';
  const parts = clean.split('-');
  if (parts.length < 2) return '';
  const month = parseInt(parts[1], 10);
  if (isNaN(month) || month < 1 || month > 12) return '';

  return month <= 6 ? 'I' : 'II';
}

/**
 * Kolom M: Triwulan (Tanggal Penyelesaian untuk Belanja Modal 53 bernilai Rp50 s.d. 200 juta).
 * Syarat:
 * 1. Jenis Belanja = "53"
 * 2. Nilai Kontrak >= Rp50.000.000 dan <= Rp200.000.000
 * Jika memenuhi syarat: return triwulan dari Tanggal Penyelesaian (Kolom J).
 * Jika tidak memenuhi syarat: return "" (blank/kosong, bukan nol).
 * Formula Excel: =IF(AND(F="53", G>=50000000, G<=200000000), IF(MONTH(J)<=3,"I",...), "")
 */
export function calculateQuarter53(
  jenisBelanja: string,
  nilaiKontrak: number,
  tanggalPenyelesaian?: string
): 'I' | 'II' | 'III' | 'IV' | '' {
  const is53 = String(jenisBelanja).trim() === '53';
  const val = Number(nilaiKontrak) || 0;
  const isRange = val >= 50_000_000 && val <= 200_000_000;

  if (is53 && isRange && tanggalPenyelesaian) {
    return getQuarterFromDate(tanggalPenyelesaian);
  }
  return '';
}

/**
 * Konversi Rasio Distribusi Akselerasi:
 * Aturan PER-5 / Excel:
 * Rata-rata <= 0%  -> 0
 * Rata-rata <= 25% -> 50
 * Rata-rata <= 50% -> 60
 * Rata-rata <= 75% -> 80
 * Rata-rata > 75%  -> 100
 */
export function convertDistribusiRasio(avg: number): number {
  if (avg <= 0) return 0;
  if (avg <= 25) return 50;
  if (avg <= 50) return 60;
  if (avg <= 75) return 80;
  return 100;
}

/**
 * Kolom P: Nilai Akselerasi 53
 * Sesuai Regulasi PER-5 & Standar My InTress:
 * Khusus Belanja Modal 53 bernilai Rp50.000.000 s.d. Rp200.000.000:
 * - Selesai TW I   -> 100
 * - Selesai TW II  -> 90
 * - Selesai TW III -> 80
 * - Selesai TW IV  -> 70
 * Jika bukan Belanja Modal 53 Rp50-200jt -> null (blank / tidak dinilai)
 */
export function getAkselerasi53Score(
  quarter53?: 'I' | 'II' | 'III' | 'IV' | '',
  isEligible53Range: boolean = true
): number | null {
  if (!isEligible53Range || !quarter53) return null;
  if (quarter53 === 'I') return 100;
  if (quarter53 === 'II') return 90;
  if (quarter53 === 'III') return 80;
  if (quarter53 === 'IV') return 70;
  return null;
}

/**
 * Kolom O: Nilai Kontrak Dini / Pra DIPA
 * Sesuai Regulasi PER-5 & Standar My InTress:
 * - Kontrak Pra DIPA (Tanggal kontrak sebelum 1 Januari tahun berjalan) -> 120
 * - Kontrak Non Pra DIPA (Tanggal kontrak 1 Januari s.d. 31 Maret / TW I) -> 110
 * - Kontrak setelah 31 Maret (TW II, TW III, TW IV) -> null (tidak dinilai / blank)
 */
export function getKontrakDiniScore(
  tanggalKontrak?: string,
  tahunAnggaran: number = 2026
): number | null {
  if (!tanggalKontrak) return null;
  const iso = normalizeDateToIso(tanggalKontrak);
  if (!iso) return null;
  const parts = iso.split('-');
  if (parts.length < 2) return null;
  const year = parseInt(parts[0], 10);

  // Sesuai parameter pengguna:
  // Kontrak Dini otomatis HANYA jika tanggal kontrak sebelum tahun berjalan (Pra-DIPA, tahun < tahun anggaran berjalan)
  if (year > 0 && year < tahunAnggaran) {
    return PRA_DIPA_SCORE; // 120
  }

  // Jika tanggal di dalam tahun anggaran berjalan (termasuk TW I):
  // Default otomatisnya BUKAN objek dini (null / blank).
  // Pengguna tetap dapat mengubahnya secara bebas di tabel (misal memilih 110) jika di My InTress memang dihitung sebagai kontrak dini.
  return null;
}

/**
 * Menghitung selisih hari kalender antara dua tanggal ISO
 */
export function calculateDaysDifference(date1Str?: string, date2Str?: string): number {
  if (!date1Str || !date2Str) return 0;
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export interface ProcessedContractRow {
  no: number; // Kolom A
  kodeSatker: string; // Kolom B
  namaSatker: string; // Kolom C
  kodeKPPN: string; // Kolom D
  nomorKontrak: string; // Kolom E
  jenisBelanja: '51' | '52' | '53' | '57'; // Kolom F
  nilaiKontrak: number; // Kolom G
  tanggalKontrak: string; // Kolom H
  tanggalMasuk: string; // Kolom I
  tanggalPenyelesaian: string; // Kolom J
  triwulanKontrak: 'I' | 'II' | 'III' | 'IV' | ''; // Kolom K
  semesterKontrak: 'I' | 'II' | ''; // Kolom L
  triwulanPenyelesaian53: 'I' | 'II' | 'III' | 'IV' | ''; // Kolom M
  nilaiDistribusiAkselerasi: number; // Kolom N
  nilaiKontrakDini: number | null; // Kolom O (null jika bukan TW I)
  nilaiAkselerasi53: number | null; // Kolom P (null jika bukan 53 Rp50-200jt)

  // Diagnostic / audit fields
  isEligible53Range: boolean;
  isEligibleDini: boolean;
  selisihHariPendaftaran: number;
  isPendaftaranTerlambat: boolean; // > 5 hari
  isInvalidDateOrder: boolean;
  isNegativeValue: boolean;
  isEarlyContract: boolean;
}

export interface BelanjaKontraktualSummary {
  rowCount: number;
  // Baris 27: Rata-Rata
  avgDistribusiRaw: number; // N27: AVERAGE(N6:N26)
  avgKontrakDini: number | null; // O27: AVERAGE(O6:O26)
  avgAkselerasi53: number | null; // P27: AVERAGE(P6:P26)

  // Baris 28: Bobot Komponen
  bobotDistribusi: number; // N28: 20%
  bobotKontrakDini: number; // O28: 40%
  bobotAkselerasi53: number; // P28: 40%

  // Efektif Bobot (Normalisasi My InTress jika ada komponen tanpa objek kontrak)
  effectiveBobotDistribusi: number;
  effectiveBobotKontrakDini: number;
  effectiveBobotAkselerasi53: number;
  totalActiveWeight: number; // e.g. 0.20, 0.60, atau 1.00

  // Status keaktifan komponen objek
  hasDistribusi: boolean;
  hasKontrakDini: boolean;
  hasAkselerasi53: boolean;

  // Baris 29: Komponen Nilai / Kinerja (Nilai × Bobot Standar)
  nilaiDistribusiConverted: number; // Nilai distribusi yang digunakan
  kompDistribusi: number; // N29: round2(20% * nilaiDistribusi)
  kompKontrakDini: number; // O29: round2(40% * avgKontrakDini)
  kompAkselerasi53: number; // P29: round2(40% * avgAkselerasi53)

  // Baris 30: Nilai Indikator Belanja Kontraktual
  // Formula My InTress: Total Komponen Nilai / Total Bobot Aktif
  nilaiIndikator: number;
  cappedValue: number; // MIN(100, MAX(0, nilaiIndikator))
  rawNilaiIndikator: number; // Nilai mentah rumus sebelum capping 100
  weightedValue: number; // J8: round2((cappedValue * weight) / 100)

  // OM-SPAN Standar Metrics
  metodeKalkulasi: 'omspan' | 'excel';
  rasioKontrakSmtI: number; // Persentase kontrak terdaftar s.d. TW II (Semester I)
  skorDistribusiOmspan: number; // Nilai distribusi hasil konversi rasio PER-5 (misal 80 jika 50%-75%)
  nilaiKinerjaDistribusiOmspan: number; // 20% × skorDistribusiOmspan
  nilaiIndikatorOmspan: number; // Nilai IKPA Belanja Kontraktual standar OM-SPAN
  nilaiIndikatorExcel: number; // Nilai IKPA jika menggunakan rata-rata baris Excel

  // Override / Dispensasi
  overrideNilaiIKPA?: number | null;
  isDispensasi?: boolean;
  keteranganDispensasi?: string;
  isNormalisasiBobot?: boolean;

  // Breakdown statistics
  countBelanja53: number;
  countBelanja53Eligible: number;
  countEarlyContract: number;
  countLateRegistration: number;
  countKontrakSmtI: number;
  countKontrakTWI: number;
  countKontrak53: number;
}

/**
 * Engine kalkulasi lengkap baris dan rekapitulasi Belanja Kontraktual sesuai My InTress & PER-5.
 */
export function calculateBelanjaKontraktualSummary(
  inputs: BelanjaKontraktualInput[],
  weight: number = 10,
  isActive: boolean = true,
  overrideNilaiIKPA?: number | null,
  isNormalisasiBobot: boolean = true,
  keteranganDispensasi?: string,
  metodeKalkulasi: 'omspan' | 'excel' = 'omspan'
): {
  processedRows: ProcessedContractRow[];
  summary: BelanjaKontraktualSummary;
  indicatorResult: IndicatorResult;
} {
  const details: CalculationDetail[] = [];

  const isDispensasi = overrideNilaiIKPA !== undefined && overrideNilaiIKPA !== null;

  if (!isActive || weight === 0 || !inputs || inputs.length === 0) {
    const finalScore = isDispensasi ? Math.min(100, Math.max(0, round2(overrideNilaiIKPA!))) : 100;
    const finalWeighted = round2((finalScore * weight) / 100);

    const emptySummary: BelanjaKontraktualSummary = {
      rowCount: 0,
      avgDistribusiRaw: 0,
      avgKontrakDini: null,
      avgAkselerasi53: null,
      bobotDistribusi: 0.20,
      bobotKontrakDini: 0.40,
      bobotAkselerasi53: 0.40,
      effectiveBobotDistribusi: 0.20,
      effectiveBobotKontrakDini: 0.40,
      effectiveBobotAkselerasi53: 0.40,
      totalActiveWeight: 0,
      hasDistribusi: false,
      hasKontrakDini: false,
      hasAkselerasi53: false,
      nilaiDistribusiConverted: 0,
      kompDistribusi: 0,
      kompKontrakDini: 0,
      kompAkselerasi53: 0,
      nilaiIndikator: finalScore,
      cappedValue: finalScore,
      weightedValue: finalWeighted,
      metodeKalkulasi,
      rasioKontrakSmtI: 0,
      skorDistribusiOmspan: 100,
      nilaiKinerjaDistribusiOmspan: 20,
      nilaiIndikatorOmspan: finalScore,
      nilaiIndikatorExcel: finalScore,
      overrideNilaiIKPA,
      isDispensasi,
      keteranganDispensasi,
      isNormalisasiBobot,
      countBelanja53: 0,
      countBelanja53Eligible: 0,
      countEarlyContract: 0,
      countLateRegistration: 0,
      countKontrakSmtI: 0,
      countKontrakTWI: 0,
      countKontrak53: 0
    };

    const emptyResult: IndicatorResult = {
      rawValue: finalScore,
      cappedValue: finalScore,
      weight: isActive ? weight : 0,
      weightedValue: finalWeighted,
      isActive,
      details: [{
        step: isDispensasi ? 'Dispensasi Nilai IKPA Belanja Kontraktual' : 'Satker Tanpa Kontrak',
        formulaHuman: isDispensasi
          ? `Dispensasi Aktif: Nilai Ditetapkan = ${finalScore}`
          : 'Satker tidak memiliki data kontrak (Nilai default 100 / Bobot 0%)',
        value: finalScore
      }],
      metadata: emptySummary
    };

    return {
      processedRows: [],
      summary: emptySummary,
      indicatorResult: emptyResult
    };
  }

  // Juknis PER-5: Nilai kontrak yang diperhitungkan adalah Rp50 juta ke atas untuk seluruh Jenis Belanja
  const eligibleContractsForDistribusi = inputs.filter(item => {
    const val = Number(item.nilaiKontrak) || 0;
    return val >= 50_000_000;
  });
  const pool = eligibleContractsForDistribusi.length > 0 ? eligibleContractsForDistribusi : inputs;
  const totalRawCount = pool.length;
  const countRawSmtI = pool.filter(item => {
    const tgl = normalizeDateToIso(item.tanggalKontrak);
    const sem = item.semesterKontrak || getSemesterFromDate(tgl);
    const qtr = item.quarterKontrak || getQuarterFromDate(tgl);
    return sem === 'I' || qtr === 'I' || qtr === 'II';
  }).length;
  const satkerSmtIRatio = totalRawCount > 0 ? (countRawSmtI / totalRawCount) * 100 : 0;
  const satkerConvertedDistribusi = totalRawCount > 0 ? convertDistribusiRasio(satkerSmtIRatio) : 100;

  // 1. Process each contract row
  const processedRows: ProcessedContractRow[] = inputs.map((item, idx) => {
    const no = item.no || (idx + 1);
    const kodeSatker = item.kodeSatker || '000000';
    const namaSatker = item.namaSatker || 'SATKER CONTOH';
    const kodeKPPN = item.kodeKPPN || '000';
    const nomorKontrak = item.nomorKontrak || `KTR-${String(no).padStart(3, '0')}`;
    const jenisBelanja = (item.jenisBelanja || '52') as '51' | '52' | '53' | '57';
    const rawNilai = Number(item.nilaiKontrak) || 0;
    const nilaiKontrak = Math.max(0, rawNilai);
    const isNegativeValue = rawNilai < 0;

    const tglKontrak = normalizeDateToIso(item.tanggalKontrak);
    const tglMasuk = normalizeDateToIso(item.tanggalMasuk);
    const tglPenyelesaian = normalizeDateToIso(item.tanggalPenyelesaian);

    // K: Triwulan Kontrak (berdasarkan Tanggal Kontrak)
    const triwulanKontrak = item.quarterKontrak || getQuarterFromDate(tglKontrak);

    // L: Semester Kontrak (berdasarkan Tanggal Kontrak)
    const semesterKontrak = item.semesterKontrak || getSemesterFromDate(tglKontrak);

    // M: Triwulan Tanggal Penyelesaian untuk 53 Rp50-200 juta
    const triwulanPenyelesaian53 = calculateQuarter53(jenisBelanja, nilaiKontrak, tglPenyelesaian);
    const isEligible53Range = jenisBelanja === '53' && nilaiKontrak >= 50_000_000 && nilaiKontrak <= 200_000_000;

    // N: Nilai Distribusi Akselerasi Kontrak
    // Sesuai Juknis PER-5:
    // - Kontrak diterbitkan di Semester I (s.d. TW II) -> Poin 100
    // - Kontrak diterbitkan di Semester II (setelah TW II) -> Poin bertingkat sesuai Rasio Satker (misal 80 jika 50,01% - 75%)
    const isSmtI = semesterKontrak === 'I' || triwulanKontrak === 'I' || triwulanKontrak === 'II';
    let nilaiDistribusiAkselerasi: number;
    if (metodeKalkulasi === 'omspan') {
      nilaiDistribusiAkselerasi = isSmtI ? 100 : satkerConvertedDistribusi;
    } else {
      if (item.nilaiDistribusiAkselerasi !== undefined && item.nilaiDistribusiAkselerasi !== null) {
        nilaiDistribusiAkselerasi = Number(item.nilaiDistribusiAkselerasi);
      } else {
        nilaiDistribusiAkselerasi = isSmtI ? 100 : satkerConvertedDistribusi;
      }
    }

    // O: Nilai Kontrak Dini (Pra-DIPA / Fleksibel Manual My InTress)
    // Sesuai parameter:
    // 1. Parameter otomatis: hanya kontrak sebelum tahun berjalan (Pra-DIPA, < 1 Jan) -> 120
    // 2. Jika pengguna mengubah/memilih manual di tabel (misal memilih 110 karena di My InTress diakui sbg kontrak dini),
    //    sistem secara fleksibel menghormati dan menggunakan nilai pilihan pengguna tersebut.
    let nilaiKontrakDini: number | null = null;
    const isEligible50jt = nilaiKontrak >= 50_000_000;

    if (item.nilaiKontrakDini !== undefined) {
      if (item.nilaiKontrakDini === null || item.nilaiKontrakDini === '' || Number(item.nilaiKontrakDini) === 0) {
        nilaiKontrakDini = null; // User secara eksplisit memilih "- (Bukan Objek Dini)"
      } else {
        const parsed = Number(item.nilaiKontrakDini);
        nilaiKontrakDini = (!isNaN(parsed) && parsed > 0) ? parsed : null;
      }
    } else {
      // Nilai belum diset oleh pengguna (undefined) -> gunakan parameter otomatis (Hanya sebelum tahun berjalan)
      const autoScore = getKontrakDiniScore(tglKontrak);
      nilaiKontrakDini = isEligible50jt ? autoScore : null;
    }

    // P: Nilai Akselerasi 53 (Hanya untuk Belanja Modal 53 Rp50-200jt)
    // Sesuai standar OM-SPAN & PER-5:
    // Komponen ini hanya memiliki objek jika jenisBelanja === '53' dan nilaiKontrak 50jt s.d. 200jt.
    // Jika bukan Belanja Modal 53 pada rentang tersebut -> nilaiAkselerasi53 = null (blank / tidak dinilai).
    let nilaiAkselerasi53: number | null = null;
    if (isEligible53Range) {
      if (item.nilaiAkselerasi53 !== undefined && item.nilaiAkselerasi53 !== null && item.nilaiAkselerasi53 !== '') {
        nilaiAkselerasi53 = Number(item.nilaiAkselerasi53);
      } else {
        nilaiAkselerasi53 = getAkselerasi53Score(triwulanPenyelesaian53, isEligible53Range);
      }
    } else {
      // Bukan objek Belanja 53 50-200jt: Di OM-SPAN tercatat Jumlah Kontrak 53 = 0, tidak dinilai
      nilaiAkselerasi53 = null;
    }

    // Diagnostics
    const selisihHariPendaftaran = calculateDaysDifference(tglKontrak, tglMasuk);
    const isPendaftaranTerlambat = selisihHariPendaftaran > 5;
    const isInvalidDateOrder = Boolean(
      (tglMasuk && tglKontrak && tglMasuk < tglKontrak) ||
      (tglPenyelesaian && tglKontrak && tglPenyelesaian < tglKontrak)
    );
    const isEarlyContract = nilaiKontrakDini !== null && nilaiKontrakDini >= 110;
    const isEligibleDini = nilaiKontrakDini !== null;

    return {
      no,
      kodeSatker,
      namaSatker,
      kodeKPPN,
      nomorKontrak,
      jenisBelanja,
      nilaiKontrak,
      tanggalKontrak: tglKontrak,
      tanggalMasuk: tglMasuk,
      tanggalPenyelesaian: tglPenyelesaian,
      triwulanKontrak,
      semesterKontrak,
      triwulanPenyelesaian53,
      nilaiDistribusiAkselerasi,
      nilaiKontrakDini,
      nilaiAkselerasi53,
      isEligible53Range,
      isEligibleDini,
      selisihHariPendaftaran,
      isPendaftaranTerlambat,
      isInvalidDateOrder,
      isNegativeValue,
      isEarlyContract
    };
  });

  // 2. Baris 27: Rata-Rata menggunakan excelAverage (mengabaikan sel null/kosong)
  const distribusiValues = processedRows
    .map(r => r.nilaiDistribusiAkselerasi)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
  const avgDistribusiRaw = distribusiValues.length > 0 ? excelAverage(distribusiValues) : 0;

  const diniValues = processedRows
    .map(r => r.nilaiKontrakDini)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
  const avgKontrakDini = diniValues.length > 0 ? excelAverage(diniValues) : null;

  const aksel53Values = processedRows
    .map(r => r.nilaiAkselerasi53)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
  const avgAkselerasi53 = aksel53Values.length > 0 ? excelAverage(aksel53Values) : null;

  // 3. Baris 28: Bobot Komponen Standar
  const bobotDistribusi = 0.20;
  const bobotKontrakDini = 0.40;
  const bobotAkselerasi53 = 0.40;

  // Cek keaktifan masing-masing objek komponen
  const hasDistribusi = distribusiValues.length > 0;
  const hasKontrakDini = diniValues.length > 0;
  const hasAkselerasi53 = aksel53Values.length > 0;

  // Total bobot aktif (My InTress Normalization)
  const totalActiveWeight = round2(
    (hasDistribusi ? bobotDistribusi : 0) +
    (hasKontrakDini ? bobotKontrakDini : 0) +
    (hasAkselerasi53 ? bobotAkselerasi53 : 0)
  );

  const effectiveBobotDistribusi = (isNormalisasiBobot && totalActiveWeight > 0 && hasDistribusi)
    ? round2(bobotDistribusi / totalActiveWeight)
    : bobotDistribusi;
  const effectiveBobotKontrakDini = (isNormalisasiBobot && totalActiveWeight > 0 && hasKontrakDini)
    ? round2(bobotKontrakDini / totalActiveWeight)
    : bobotKontrakDini;
  const effectiveBobotAkselerasi53 = (isNormalisasiBobot && totalActiveWeight > 0 && hasAkselerasi53)
    ? round2(bobotAkselerasi53 / totalActiveWeight)
    : bobotAkselerasi53;

  // 4. Breakdown metrics
  const countBelanja53 = processedRows.filter(r => r.jenisBelanja === '53').length;
  const countBelanja53Eligible = processedRows.filter(r => r.isEligible53Range).length;
  const countEarlyContract = processedRows.filter(r => r.isEarlyContract).length;
  const countLateRegistration = processedRows.filter(r => r.isPendaftaranTerlambat).length;
  const countKontrakSmtI = processedRows.filter(r => r.semesterKontrak === 'I' || r.triwulanKontrak === 'I' || r.triwulanKontrak === 'II').length;
  const countKontrakTWI = processedRows.filter(r => r.triwulanKontrak === 'I' || r.isEarlyContract).length;
  const countKontrak53 = countBelanja53Eligible;

  // Standar PER-5 OM-SPAN: Rasio Kontrak s.d. TW II / Total Kontrak
  const totalKontrak = processedRows.length;
  const rasioKontrakSmtI = totalKontrak > 0 ? round2((countKontrakSmtI / totalKontrak) * 100) : 0;
  const skorDistribusiOmspan = totalKontrak > 0 ? convertDistribusiRasio(rasioKontrakSmtI) : 0;
  const nilaiKinerjaDistribusiOmspan = round2(bobotDistribusi * skorDistribusiOmspan);

  // Nilai Komponen Kontrak Dini dan Akselerasi 53
  const kompKontrakDini = (hasKontrakDini && avgKontrakDini !== null) ? round2(bobotKontrakDini * avgKontrakDini) : 0;
  const kompAkselerasi53 = (hasAkselerasi53 && avgAkselerasi53 !== null) ? round2(bobotAkselerasi53 * avgAkselerasi53) : 0;

  // Komponen Distribusi Excel (Rata-rata Kolom N)
  const kompDistribusiExcel = hasDistribusi ? round2(bobotDistribusi * avgDistribusiRaw) : 0;

  // Nilai Indikator Versi OM-SPAN (Resmi PER-5)
  let nilaiIndikatorOmspan: number;
  if (isDispensasi) {
    nilaiIndikatorOmspan = Math.min(100, Math.max(0, round2(overrideNilaiIKPA!)));
  } else if (totalActiveWeight > 0) {
    if (isNormalisasiBobot) {
      nilaiIndikatorOmspan = round2((nilaiKinerjaDistribusiOmspan + kompKontrakDini + kompAkselerasi53) / totalActiveWeight);
    } else {
      nilaiIndikatorOmspan = round2(nilaiKinerjaDistribusiOmspan + kompKontrakDini + kompAkselerasi53);
    }
  } else {
    nilaiIndikatorOmspan = 100;
  }

  // Nilai Indikator Versi Excel (Rata-rata Baris Kolom N)
  let nilaiIndikatorExcel: number;
  if (isDispensasi) {
    nilaiIndikatorExcel = Math.min(100, Math.max(0, round2(overrideNilaiIKPA!)));
  } else if (totalActiveWeight > 0) {
    if (isNormalisasiBobot) {
      nilaiIndikatorExcel = round2((kompDistribusiExcel + kompKontrakDini + kompAkselerasi53) / totalActiveWeight);
    } else {
      nilaiIndikatorExcel = round2(kompDistribusiExcel + kompKontrakDini + kompAkselerasi53);
    }
  } else {
    nilaiIndikatorExcel = 100;
  }

  // Tentukan metode aktif:
  const effMetode = metodeKalkulasi || 'omspan';
  const nilaiDistribusiConverted = effMetode === 'omspan' ? skorDistribusiOmspan : avgDistribusiRaw;
  const kompDistribusi = effMetode === 'omspan' ? nilaiKinerjaDistribusiOmspan : kompDistribusiExcel;
  const rawNilaiIndikator = effMetode === 'omspan' ? nilaiIndikatorOmspan : nilaiIndikatorExcel;
  // Sesuai PMK/Juknis IKPA: Nilai indikator maksimal adalah 100,00
  const cappedValue = Math.min(100, Math.max(0, rawNilaiIndikator));
  const nilaiIndikator = cappedValue;
  const weightedValue = round2((cappedValue * weight) / 100);

  const summary: BelanjaKontraktualSummary = {
    rowCount: processedRows.length,
    avgDistribusiRaw: round2(avgDistribusiRaw),
    avgKontrakDini: avgKontrakDini !== null ? round2(avgKontrakDini) : null,
    avgAkselerasi53: avgAkselerasi53 !== null ? round2(avgAkselerasi53) : null,
    bobotDistribusi,
    bobotKontrakDini,
    bobotAkselerasi53,
    effectiveBobotDistribusi,
    effectiveBobotKontrakDini,
    effectiveBobotAkselerasi53,
    totalActiveWeight,
    hasDistribusi,
    hasKontrakDini,
    hasAkselerasi53,
    nilaiDistribusiConverted,
    kompDistribusi,
    kompKontrakDini,
    kompAkselerasi53,
    nilaiIndikator,
    cappedValue,
    rawNilaiIndikator: round2(rawNilaiIndikator),
    weightedValue,
    metodeKalkulasi: effMetode,
    rasioKontrakSmtI,
    skorDistribusiOmspan,
    nilaiKinerjaDistribusiOmspan,
    nilaiIndikatorOmspan,
    nilaiIndikatorExcel,
    overrideNilaiIKPA,
    isDispensasi,
    keteranganDispensasi,
    isNormalisasiBobot,
    countBelanja53,
    countBelanja53Eligible,
    countEarlyContract,
    countLateRegistration,
    countKontrakSmtI,
    countKontrakTWI,
    countKontrak53
  };

  // Build step-by-step calculation trace for Inspector
  details.push({
    step: 'Rata-Rata Distribusi Akselerasi (N27)',
    formulaHuman: `AVERAGE(N6:N26) = ${round2(avgDistribusiRaw)}`,
    formulaTechnical: '=AVERAGE(N6:N26)',
    value: round2(avgDistribusiRaw)
  });

  details.push({
    step: 'Rata-Rata Kontrak Dini (O27)',
    formulaHuman: avgKontrakDini !== null
      ? `AVERAGE(O6:O26) = ${round2(avgKontrakDini)} (${diniValues.length} kontrak dinilai)`
      : 'Tidak ada objek kontrak dini TW I / Pra-DIPA (Blank / Nihil)',
    formulaTechnical: '=AVERAGE(O6:O26)',
    value: avgKontrakDini !== null ? round2(avgKontrakDini) : 0
  });

  details.push({
    step: 'Rata-Rata Akselerasi 53 (P27)',
    formulaHuman: avgAkselerasi53 !== null
      ? `AVERAGE(P6:P26) = ${round2(avgAkselerasi53)} (${aksel53Values.length} kontrak 53 dinilai)`
      : 'Tidak ada objek Belanja Modal 53 bernilai Rp50-200 Juta (Blank / Nihil)',
    formulaTechnical: '=AVERAGE(P6:P26)',
    value: avgAkselerasi53 !== null ? round2(avgAkselerasi53) : 0
  });

  details.push({
    step: 'Komponen Kinerja Distribusi (N29)',
    formulaHuman: `ROUND(20% × ${round2(avgDistribusiRaw)}; 2) = ${kompDistribusi}`,
    formulaTechnical: '=ROUND(20% * N27, 2)',
    value: kompDistribusi
  });

  details.push({
    step: 'Komponen Kinerja Kontrak Dini (O29)',
    formulaHuman: hasKontrakDini && avgKontrakDini !== null
      ? `ROUND(40% × ${round2(avgKontrakDini)}; 2) = ${kompKontrakDini}`
      : '0,00 (Komponen tidak aktif / nihil objek)',
    formulaTechnical: '=ROUND(40% * O27, 2)',
    value: kompKontrakDini
  });

  details.push({
    step: 'Komponen Kinerja Akselerasi Belanja 53 (P29)',
    formulaHuman: hasAkselerasi53 && avgAkselerasi53 !== null
      ? `ROUND(40% × ${round2(avgAkselerasi53)}; 2) = ${kompAkselerasi53}`
      : '0,00 (Komponen tidak aktif / nihil objek)',
    formulaTechnical: '=ROUND(40% * P27, 2)',
    value: kompAkselerasi53
  });

  if (isDispensasi) {
    details.push({
      step: 'Dispensasi Nilai IKPA Belanja Kontraktual',
      formulaHuman: `Nilai ditetapkan manual via dispensasi: ${nilaiIndikator} (${keteranganDispensasi || 'Dispensasi'})`,
      formulaTechnical: `=OVERRIDE(${nilaiIndikator})`,
      value: nilaiIndikator
    });
  } else if (isNormalisasiBobot && totalActiveWeight > 0 && totalActiveWeight < 1) {
    details.push({
      step: 'Normalisasi Bobot Komponen Aktif (My InTress)',
      formulaHuman: `(${kompDistribusi} + ${kompKontrakDini} + ${kompAkselerasi53}) / Total Bobot Aktif (${Math.round(totalActiveWeight * 100)}%) = ${nilaiIndikator}`,
      formulaTechnical: `=(N29 + O29 + P29) / ${totalActiveWeight}`,
      value: nilaiIndikator
    });
  } else {
    details.push({
      step: 'Nilai Indikator Belanja Kontraktual (N30)',
      formulaHuman: `${kompDistribusi} + ${kompKontrakDini} + ${kompAkselerasi53} = ${nilaiIndikator}`,
      formulaTechnical: '=N29 + O29 + P29',
      value: nilaiIndikator
    });
  }

  details.push({
    step: 'Nilai IKPA Berbobot (J8)',
    formulaHuman: `ROUND(${cappedValue} × ${weight}% / 100; 2) = ${weightedValue}`,
    formulaTechnical: `=ROUND(${cappedValue} * ${weight} / 100, 2)`,
    value: weightedValue
  });

  const indicatorResult: IndicatorResult = {
    rawValue: nilaiIndikator,
    cappedValue,
    weight,
    weightedValue,
    isActive,
    details,
    metadata: {
      items: processedRows,
      summary,
      kompDistribusi,
      kompKontrakDini,
      kompAkselerasi53
    }
  };

  return {
    processedRows,
    summary,
    indicatorResult
  };
}

/**
 * Standard IKPA wrapper function for calculateIKPA
 */
export function calculateBelanjaKontraktual(
  inputs: BelanjaKontraktualInput[],
  weight: number = 10,
  isActive: boolean = true,
  overrideNilaiIKPA?: number | null,
  isNormalisasiBobot: boolean = true,
  keteranganDispensasi?: string,
  metodeKalkulasi: 'omspan' | 'excel' = 'omspan'
): IndicatorResult {
  const { indicatorResult } = calculateBelanjaKontraktualSummary(
    inputs,
    weight,
    isActive,
    overrideNilaiIKPA,
    isNormalisasiBobot,
    keteranganDispensasi,
    metodeKalkulasi
  );
  return indicatorResult;
}

export interface BelanjaKontraktualGoldenTestSummary {
  timestamp: string;
  totalChecks: number;
  passedCount: number;
  failedCount: number;
  status: 'PASS' | 'FAIL';
  checks: Array<{
    cell: string;
    description: string;
    expected: number | string;
    actual: number | string;
    diff: number;
    status: 'PASS' | 'FAIL';
  }>;
  summary: BelanjaKontraktualSummary;
}

/**
 * Golden Test verifier untuk modul Belanja Kontraktual terhadap workbook Excel referensi.
 */
export function runBelanjaKontraktualGoldenTest(
  inputs?: BelanjaKontraktualInput[]
): BelanjaKontraktualGoldenTestSummary {
  // If inputs not provided, dynamically import from sample
  const data = inputs || [];
  const { summary } = calculateBelanjaKontraktualSummary(data, 10, true);

  const expectedValues = [
    { cell: 'N27', description: 'Rata-rata Distribusi Akselerasi Kontrak', expected: 100.00, actual: summary.avgDistribusiRaw },
    { cell: 'O27', description: 'Rata-rata Nilai Kontrak Dini', expected: 103.33, actual: summary.avgKontrakDini },
    { cell: 'P27', description: 'Rata-rata Nilai Akselerasi 53', expected: 94.29, actual: summary.avgAkselerasi53 },
    { cell: 'N28', description: 'Bobot Distribusi Akselerasi', expected: 0.20, actual: summary.bobotDistribusi },
    { cell: 'O28', description: 'Bobot Kontrak Dini', expected: 0.40, actual: summary.bobotKontrakDini },
    { cell: 'P28', description: 'Bobot Akselerasi 53', expected: 0.40, actual: summary.bobotAkselerasi53 },
    { cell: 'N29', description: 'Komponen Distribusi Akselerasi', expected: 20.00, actual: summary.kompDistribusi },
    { cell: 'O29', description: 'Komponen Kontrak Dini', expected: 41.33, actual: summary.kompKontrakDini },
    { cell: 'P29', description: 'Komponen Akselerasi 53', expected: 37.71, actual: summary.kompAkselerasi53 },
    { cell: 'N30', description: 'Nilai Indikator Belanja Kontraktual', expected: 99.04, actual: summary.nilaiIndikator },
    { cell: 'J8', description: 'Nilai IKPA Berbobot (10%)', expected: 9.90, actual: summary.weightedValue }
  ];

  const tolerance = 0.02;
  const checks = expectedValues.map(item => {
    const diff = Math.abs(Number(item.expected) - Number(item.actual));
    const isPass = diff <= tolerance;
    return {
      cell: item.cell,
      description: item.description,
      expected: item.expected,
      actual: item.actual,
      diff: Number(diff.toFixed(4)),
      status: (isPass ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL'
    };
  });

  const passedCount = checks.filter(c => c.status === 'PASS').length;
  const failedCount = checks.length - passedCount;

  return {
    timestamp: new Date().toISOString(),
    totalChecks: checks.length,
    passedCount,
    failedCount,
    status: failedCount === 0 ? 'PASS' : 'FAIL',
    checks,
    summary
  };
}
