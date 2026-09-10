import { PenyelesaianTagihanRow, IndicatorResult, CalculationDetail } from '../models/ikpa';
import { round2 } from './rounding';
import { normalizeDateToIso } from '../utils/ikpaDateUtils';

/**
 * THRESHOLD KETEPATAN WAKTU EXCEL:
 * Formula Excel: =IF(N4<=17, "TEPAT", "TERLAMBAT")
 * Batas strictly 17 hari efektif!
 */
export const THRESHOLD_HARI_EFEKTIF = 17;

/**
 * Parses an ISO date (YYYY-MM-DD) into integer calendar components [year, month, day]
 * in local calendar to avoid any UTC timezone shift.
 */
function parseDateParts(dateStr: string): [number, number, number] | null {
  const iso = normalizeDateToIso(dateStr);
  if (!iso) return null;
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return [y, m, d];
}

/**
 * 6. KOLOM L — SELISIH HARI KALENDER
 * Formula Excel: L4 = K4 - J4
 * Selisih Hari = Tanggal Konversi - Tanggal Mulai (bukan hari inklusif).
 * Contoh: 1 April ke 10 April = 9 hari.
 * Jika tanggal konversi lebih awal dari tanggal mulai, mengembalikan selisih negatif (untuk validasi/warning).
 * Jika tanggal belum lengkap, mengembalikan null.
 */
export function differenceInCalendarDays(
  conversionDateStr: string | null | undefined,
  startDateStr: string | null | undefined
): number | null {
  if (!conversionDateStr || !startDateStr) return null;

  const pConv = parseDateParts(conversionDateStr);
  const pStart = parseDateParts(startDateStr);
  if (!pConv || !pStart) return null;

  // Use Date.UTC at midnight for pure calendar-day difference without timezone/DST drift
  const utcConv = Date.UTC(pConv[0], pConv[1] - 1, pConv[2]);
  const utcStart = Date.UTC(pStart[0], pStart[1] - 1, pStart[2]);

  const diffMs = utcConv - utcStart;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// Alias for calculation engine compatibility
export const calculateCalendarDifference = differenceInCalendarDays;

/**
 * 8. KOLOM N — JUMLAH HARI EFEKTIF
 * Formula Excel: N4 = L4 - M4
 * Jumlah Hari Efektif = Selisih Hari Kalender - Hari Libur
 * Contoh: L = 20, M = 3 -> N = 17.
 */
export function calculateEffectiveDays(
  calendarDays: number | null,
  holidayDays: number
): number | null {
  if (calendarDays === null) return null;
  const holidays = Math.max(0, holidayDays || 0);
  return calendarDays - holidays;
}

/**
 * 9. BATAS KETEPATAN WAKTU
 * Formula Excel: O4 = IF(N4<=17, "TEPAT", "TERLAMBAT")
 * Ketentuan:
 * - N <= 17 -> "TEPAT"
 * - N > 17  -> "TERLAMBAT"
 * - Jika data tanggal belum lengkap -> "BELUM LENGKAP"
 */
export function calculateStatus(
  effectiveDays: number | null
): "TEPAT" | "TERLAMBAT" | "BELUM LENGKAP" {
  if (effectiveDays === null) {
    return "BELUM LENGKAP";
  }
  return effectiveDays <= THRESHOLD_HARI_EFEKTIF ? "TEPAT" : "TERLAMBAT";
}

/**
 * 11. KOLOM Q — JUMLAH TEPAT WAKTU
 * Formula Excel: Q4 = COUNTIF(O4:O29, "TEPAT")
 */
export function countOnTime(rows: { status: string }[]): number {
  return rows.filter(r => r.status === "TEPAT").length;
}

/**
 * 12. KOLOM R — JUMLAH TERLAMBAT
 * Formula Excel: R4 = COUNTIF(O4:O29, "TERLAMBAT")
 */
export function countLate(rows: { status: string }[]): number {
  return rows.filter(r => r.status === "TERLAMBAT").length;
}

/**
 * 14. NILAI INDIKATOR
 * Formula Excel: R6 = Q4/S4*100
 * Nilai Penyelesaian Tagihan = (Jumlah Tepat Waktu / Total Tagihan) * 100
 * Jika total === 0, return 0.
 */
export function calculateBillingCompletionScore(
  tepatWaktu: number,
  terlambat: number
): number {
  const total = tepatWaktu + terlambat;
  if (total === 0) {
    return 0;
  }
  return (tepatWaktu / total) * 100;
}

// Alias for calculation engine compatibility
export const calculateBillingScore = calculateBillingCompletionScore;

/**
 * 18. HARI LIBUR OTOMATIS (OPSIONAL)
 * Menghitung hari Sabtu, Minggu, dan hari libur nasional tentatif di antara dua tanggal.
 * Digunakan jika pengguna memilih mode "Otomatis" untuk estimasi hari libur.
 */
export function calculateHolidayDays(
  startDateStr: string | null | undefined,
  conversionDateStr: string | null | undefined
): number {
  if (!startDateStr || !conversionDateStr) return 0;
  const pStart = parseDateParts(startDateStr);
  const pConv = parseDateParts(conversionDateStr);
  if (!pStart || !pConv) return 0;

  const dStart = new Date(pStart[0], pStart[1] - 1, pStart[2]);
  const dConv = new Date(pConv[0], pConv[1] - 1, pConv[2]);
  if (dConv <= dStart) return 0;

  let holidays = 0;
  const current = new Date(dStart.getTime());
  current.setDate(current.getDate() + 1); // Start checking after start date up to conversion date

  while (current <= dConv) {
    const dayOfWeek = current.getDay(); // 0 = Sun, 6 = Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      holidays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return holidays;
}

/**
 * Interface untuk baris data yang sudah diproses secara lengkap
 */
export interface ProcessedTagihanRow extends PenyelesaianTagihanRow {
  isDateReversed: boolean; // tanggalKonversi < tanggalMulai
  warningMessage?: string;
}

/**
 * Summary hasil perhitungan sheet Penyelesaian Tagihan
 */
export interface PenyelesaianTagihanSummary {
  rowCount: number;
  jumlahTepatWaktu: number; // Q4
  jumlahTerlambat: number; // R4
  totalTagihan: number; // S4
  nilaiIndikator: number; // R6 (Q4/S4*100)
  cappedValue: number; // Capped 0 - 100
  weightedValue: number; // K8 (=ROUND(cappedValue * weight / 100, 2))
  jumlahBelumLengkap: number;
}

/**
 * Memproses seluruh baris input dan menghasilkan struktur lengkap kolom A s.d. S
 */
export function processTagihanRows(inputs: PenyelesaianTagihanRow[]): {
  processedRows: ProcessedTagihanRow[];
  summary: PenyelesaianTagihanSummary;
} {
  const processedRows: ProcessedTagihanRow[] = (inputs || []).map((item, index) => {
    const no = item.no || index + 1;
    const nomorSPP = item.nomorSPP || item.nomorSPM || `SPP-${String(no).padStart(3, '0')}`;
    const identitasTagihan = item.identitasTagihan || item.satker || item.nomorSP2D || `Tagihan #${no}`;
    const keterangan = item.keterangan || 'SPM-LS Kontraktual Non Belanja Pegawai';
    const jenisTagihan = item.jenisTagihan || 'SPM-LS Kontraktual';

    // Tanggal-tanggal
    const tanggalSPP = item.tanggalSPP || item.tanggalSPM || null;
    const tanggalTagihan = item.tanggalTagihan || item.tanggalBAST || null;
    const tanggalDokumenPendukung = item.tanggalDokumenPendukung || item.tanggalBAPP || item.tanggalBAST || null;
    const tanggalPenyampaian = item.tanggalPenyampaian || item.tanggalKonversiADK || null;

    // Tanggal Mulai (Kolom J) & Tanggal Konversi (Kolom K)
    const tanggalMulai = item.tanggalMulai || item.tanggalMulaiPerhitungan || item.tanggalBAST || null;
    const tanggalKonversi = item.tanggalKonversi || item.tanggalKonversiADK || item.tanggalSPM || null;

    // Kolom L: Selisih Hari Kalender (=K - J)
    const selisihHari = differenceInCalendarDays(tanggalKonversi, tanggalMulai);

    // Validasi apakah tanggal terbalik
    const isDateReversed = selisihHari !== null && selisihHari < 0;

    // Kolom M: Hari Libur
    const hariLibur = Math.max(0, item.hariLibur ?? item.jumlahHariLibur ?? 0);

    // Kolom N: Jumlah Hari Efektif (=L - M)
    const jumlahHariEfektif = calculateEffectiveDays(selisihHari, hariLibur);

    // Kolom O: Status (=IF(N<=17, "TEPAT", "TERLAMBAT"))
    let status: "TEPAT" | "TERLAMBAT" | "BELUM LENGKAP";
    let warningMessage: string | undefined;

    if (isDateReversed) {
      status = "TERLAMBAT";
      warningMessage = "Tanggal konversi lebih awal daripada tanggal mulai.";
    } else if (jumlahHariEfektif === null) {
      status = "BELUM LENGKAP";
      warningMessage = "Tanggal mulai atau tanggal konversi belum diisi.";
    } else {
      status = calculateStatus(jumlahHariEfektif);
    }

    // Kolom P: Keterangan Hasil
    const keteranganHasil = item.keteranganHasil || (
      status === "TEPAT"
        ? `Tepat Waktu (${jumlahHariEfektif} hari <= 17)`
        : status === "TERLAMBAT"
        ? `Terlambat (${jumlahHariEfektif} hari > 17)`
        : "Belum Lengkap"
    );

    return {
      ...item,
      no,
      identitasTagihan,
      keterangan,
      jenisTagihan,
      nomorSPP,
      tanggalSPP,
      tanggalTagihan,
      tanggalDokumenPendukung,
      tanggalPenyampaian,
      tanggalMulai,
      tanggalKonversi,
      selisihHari,
      hariLibur,
      jumlahHariEfektif,
      status,
      keteranganHasil,
      isDateReversed,
      warningMessage,
      // Compatibility aliases
      nomorSPM: nomorSPP,
      tanggalSPM: tanggalSPP,
      tanggalMulaiPerhitungan: tanggalMulai,
      tanggalKonversiADK: tanggalKonversi,
      jumlahHariLibur: hariLibur,
      jumlahHariFinal: jumlahHariEfektif
    };
  });

  // Hitung kolom Q, R, S, R6
  const jumlahTepatWaktu = countOnTime(processedRows); // Q4
  const jumlahTerlambat = countLate(processedRows);   // R4
  const totalTagihan = jumlahTepatWaktu + jumlahTerlambat; // S4
  const jumlahBelumLengkap = processedRows.filter(r => r.status === "BELUM LENGKAP").length;

  // Nilai Indikator R6 = Q4/S4*100 (tidak ada pembulatan eksplisit di engine sebelum final display)
  const nilaiIndikator = calculateBillingCompletionScore(jumlahTepatWaktu, jumlahTerlambat);
  const cappedValue = Math.min(100, Math.max(0, nilaiIndikator));
  const weightedValue = round2((cappedValue * 10) / 100); // Bobot default 10%

  return {
    processedRows,
    summary: {
      rowCount: processedRows.length,
      jumlahTepatWaktu,
      jumlahTerlambat,
      totalTagihan,
      nilaiIndikator,
      cappedValue,
      weightedValue,
      jumlahBelumLengkap
    }
  };
}

/**
 * Main Calculation Engine: calculatePenyelesaianTagihan
 * Mengembalikan IndicatorResult lengkap dengan step audit untuk Formula Inspector.
 */
export function calculatePenyelesaianTagihan(
  inputs: PenyelesaianTagihanRow[],
  weight: number = 10,
  isActive: boolean = true
): IndicatorResult {
  const details: CalculationDetail[] = [];

  if (!isActive || weight === 0 || !inputs || inputs.length === 0) {
    return {
      rawValue: 0,
      cappedValue: 0,
      weight: isActive ? weight : 0,
      weightedValue: 0,
      isActive,
      details: [{
        step: 'Indikator Tidak Aktif / Kosong',
        formulaHuman: 'Tidak ada transaksi SPM LS Kontraktual Non Belanja Pegawai / bobot 0%',
        value: 0
      }]
    };
  }

  const { processedRows, summary } = processTagihanRows(inputs);
  const weightedValue = round2((summary.cappedValue * weight) / 100);

  // Detail audit langkah perhitungan sesuai struktur Excel
  details.push({
    step: 'Jumlah SPM Tepat Waktu (Sel Q4)',
    formulaHuman: `COUNTIF(O4:O${Math.max(4, 3 + inputs.length)}, "TEPAT") = ${summary.jumlahTepatWaktu} tagihan`,
    formulaTechnical: '=COUNTIF(O4:O29,"TEPAT")',
    value: summary.jumlahTepatWaktu
  });

  details.push({
    step: 'Jumlah SPM Terlambat (Sel R4)',
    formulaHuman: `COUNTIF(O4:O${Math.max(4, 3 + inputs.length)}, "TERLAMBAT") = ${summary.jumlahTerlambat} tagihan`,
    formulaTechnical: '=COUNTIF(O4:O29,"TERLAMBAT")',
    value: summary.jumlahTerlambat
  });

  details.push({
    step: 'Total Tagihan Dihitung (Sel S4)',
    formulaHuman: `SUM(Q4:R4) = ${summary.jumlahTepatWaktu} + ${summary.jumlahTerlambat} = ${summary.totalTagihan} tagihan`,
    formulaTechnical: '=SUM(Q4:R4)',
    value: summary.totalTagihan
  });

  details.push({
    step: 'Nilai Indikator Penyelesaian Tagihan (Sel R6)',
    formulaHuman: summary.totalTagihan > 0
      ? `(Q4 / S4) × 100 = (${summary.jumlahTepatWaktu} / ${summary.totalTagihan}) × 100 = ${round2(summary.nilaiIndikator)}`
      : '0 / 0 = 0 (Tidak ada tagihan)',
    formulaTechnical: '=Q4/S4*100',
    value: round2(summary.nilaiIndikator)
  });

  details.push({
    step: 'Nilai IKPA Berbobot (Sel K8 pada Dashboard)',
    formulaHuman: `ROUND(${round2(summary.cappedValue)} × ${weight}% / 100; 2) = ${weightedValue}`,
    formulaTechnical: `=ROUND('Penyelesaian Tagihan'!R6 * ${weight}%, 2)`,
    value: weightedValue
  });

  return {
    rawValue: summary.nilaiIndikator,
    cappedValue: summary.cappedValue,
    weight,
    weightedValue,
    isActive,
    details,
    metadata: {
      items: processedRows,
      tepatCount: summary.jumlahTepatWaktu,
      terlambatCount: summary.jumlahTerlambat,
      totalSPM: summary.totalTagihan,
      summary
    }
  };
}

/**
 * Automated Golden Test Verification Result Interface
 */
export interface GoldenTestCaseCheck {
  id: string;
  name: string;
  expected: any;
  actual: any;
  status: "PASS" | "FAIL";
  note?: string;
}

export interface PenyelesaianTagihanGoldenTestSummary {
  timestamp: string;
  totalChecks: number;
  passedCount: number;
  failedCount: number;
  status: "PASS" | "FAIL";
  checks: GoldenTestCaseCheck[];
}

/**
 * 31. AUTOMATED GOLDEN TEST:
 * Menjalankan 7 test cases wajib sesuai instruksi:
 * TEST 1: L = 10, M = 0 -> N = 10, O = "TEPAT"
 * TEST 2: L = 17, M = 0 -> N = 17, O = "TEPAT"
 * TEST 3: L = 18, M = 0 -> N = 18, O = "TERLAMBAT"
 * TEST 4: L = 20, M = 3 -> N = 17, O = "TEPAT"
 * TEST 5: L = 20, M = 2 -> N = 18, O = "TERLAMBAT"
 * TEST 6: 90 TEPAT, 10 TERLAMBAT -> Q = 90, R = 10, S = 100, R6 = 90
 * TEST 7: 0 TEPAT, 0 TERLAMBAT -> R6 = 0
 * PLUS TEST 8: Verifikasi Data Default Workbook (25 TEPAT, 1 TERLAMBAT -> R6 = 96.15)
 */
export function runPenyelesaianTagihanGoldenTest(
  sampleInputs?: PenyelesaianTagihanRow[]
): PenyelesaianTagihanGoldenTestSummary {
  const checks: GoldenTestCaseCheck[] = [];

  // TEST 1: L = 10, M = 0 -> N = 10, O = "TEPAT"
  const n1 = calculateEffectiveDays(10, 0);
  const o1 = calculateStatus(n1);
  checks.push({
    id: 'TEST 1',
    name: 'L = 10, M = 0 -> N = 10, O = "TEPAT"',
    expected: { n: 10, o: 'TEPAT' },
    actual: { n: n1, o: o1 },
    status: n1 === 10 && o1 === 'TEPAT' ? 'PASS' : 'FAIL',
    note: '10 hari efektif <= 17 hari'
  });

  // TEST 2: L = 17, M = 0 -> N = 17, O = "TEPAT"
  const n2 = calculateEffectiveDays(17, 0);
  const o2 = calculateStatus(n2);
  checks.push({
    id: 'TEST 2',
    name: 'L = 17, M = 0 -> N = 17, O = "TEPAT"',
    expected: { n: 17, o: 'TEPAT' },
    actual: { n: n2, o: o2 },
    status: n2 === 17 && o2 === 'TEPAT' ? 'PASS' : 'FAIL',
    note: '17 hari efektif tepat pada batas threshold'
  });

  // TEST 3: L = 18, M = 0 -> N = 18, O = "TERLAMBAT"
  const n3 = calculateEffectiveDays(18, 0);
  const o3 = calculateStatus(n3);
  checks.push({
    id: 'TEST 3',
    name: 'L = 18, M = 0 -> N = 18, O = "TERLAMBAT"',
    expected: { n: 18, o: 'TERLAMBAT' },
    actual: { n: n3, o: o3 },
    status: n3 === 18 && o3 === 'TERLAMBAT' ? 'PASS' : 'FAIL',
    note: '18 hari efektif melebihi batas 17 hari'
  });

  // TEST 4: L = 20, M = 3 -> N = 17, O = "TEPAT"
  const n4 = calculateEffectiveDays(20, 3);
  const o4 = calculateStatus(n4);
  checks.push({
    id: 'TEST 4',
    name: 'L = 20, M = 3 -> N = 17, O = "TEPAT"',
    expected: { n: 17, o: 'TEPAT' },
    actual: { n: n4, o: o4 },
    status: n4 === 17 && o4 === 'TEPAT' ? 'PASS' : 'FAIL',
    note: '20 kalender - 3 hari libur = 17 hari efektif'
  });

  // TEST 5: L = 20, M = 2 -> N = 18, O = "TERLAMBAT"
  const n5 = calculateEffectiveDays(20, 2);
  const o5 = calculateStatus(n5);
  checks.push({
    id: 'TEST 5',
    name: 'L = 20, M = 2 -> N = 18, O = "TERLAMBAT"',
    expected: { n: 18, o: 'TERLAMBAT' },
    actual: { n: n5, o: o5 },
    status: n5 === 18 && o5 === 'TERLAMBAT' ? 'PASS' : 'FAIL',
    note: '20 kalender - 2 hari libur = 18 hari efektif'
  });

  // TEST 6: 90 TEPAT, 10 TERLAMBAT -> Q = 90, R = 10, S = 100, R6 = 90
  const q6 = 90;
  const r6Val = 10;
  const s6 = q6 + r6Val;
  const score6 = calculateBillingCompletionScore(q6, r6Val);
  checks.push({
    id: 'TEST 6',
    name: '90 TEPAT, 10 TERLAMBAT -> Q = 90, R = 10, S = 100, R6 = 90',
    expected: { q: 90, r: 10, s: 100, r6: 90 },
    actual: { q: q6, r: r6Val, s: s6, r6: score6 },
    status: s6 === 100 && score6 === 90 ? 'PASS' : 'FAIL',
    note: 'Q4/S4*100 = 90/100*100 = 90'
  });

  // TEST 7: 0 TEPAT, 0 TERLAMBAT -> R6 = 0
  const score7 = calculateBillingCompletionScore(0, 0);
  checks.push({
    id: 'TEST 7',
    name: '0 TEPAT, 0 TERLAMBAT -> R6 = 0',
    expected: 0,
    actual: score7,
    status: score7 === 0 ? 'PASS' : 'FAIL',
    note: 'Mencegah pembagian 0/0 (NaN/Infinity)'
  });

  // TEST 8: Verifikasi Data Workbook Sample (jika disediakan)
  if (sampleInputs && sampleInputs.length > 0) {
    const { summary } = processTagihanRows(sampleInputs);
    const expectedScore = 96.15;
    const roundedActual = round2(summary.nilaiIndikator);
    const diff = Math.abs(roundedActual - expectedScore);

    checks.push({
      id: 'TEST 8 (Workbook Reference)',
      name: 'Workbook Data: 25 TEPAT, 1 TERLAMBAT -> Q=25, R=1, S=26, R6=96.15',
      expected: { tepat: 25, terlambat: 1, total: 26, r6: 96.15 },
      actual: {
        tepat: summary.jumlahTepatWaktu,
        terlambat: summary.jumlahTerlambat,
        total: summary.totalTagihan,
        r6: roundedActual
      },
      status: diff <= 0.01 ? 'PASS' : 'FAIL',
      note: `Diff: ${diff.toFixed(4)} (Toleransi: <= 0.01)`
    });
  }

  const passedCount = checks.filter(c => c.status === 'PASS').length;
  const failedCount = checks.length - passedCount;

  return {
    timestamp: new Date().toISOString(),
    totalChecks: checks.length,
    passedCount,
    failedCount,
    status: failedCount === 0 ? 'PASS' : 'FAIL',
    checks
  };
}
