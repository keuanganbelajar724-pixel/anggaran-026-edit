import { RevisiDIPAInput, RevisionDipaRow, IndicatorResult, CalculationDetail } from '../models/ikpa';
import { round2 } from './rounding';

/**
 * Master Data: 14 Jenis Revisi yang Diakui IKPA 2026
 */
export const VALID_REVISION_CODES = [
  "201", "211", "212", "213", "217", "220", "221",
  "222", "225", "226", "229", "231", "236", "239"
];

export const VALID_REVISION_CODE_MAP: Record<string, string> = {
  "201": "Antar-Fungsi/Sub-Fungsi dan/atau Antar-Program",
  "211": "Pemenuhan Belanja Operasional",
  "212": "Penyelesaian Pagu Minus Belanja Pegawai Operasional",
  "213": "Pergeseran Anggaran dari Belanja Operasional ke Belanja Non-Operasional",
  "217": "Penyelesaian Tunggakan",
  "220": "Pemanfaatan Sisa Anggaran Kontraktual dan/atau Swakelola",
  "221": "Pergeseran anggaran Antarjenis Belanja",
  "222": "Kontrak Tahun Jamak",
  "225": "RO Cadangan",
  "226": "Penurunan volume RO secara total",
  "229": "Penyelesaian putusan pengadilan yang telah mempunyai kekuatan hukum tetap (inkracht)",
  "231": "Penyelesaian Pekerjaan yang Tidak Terselesaikan sampai dengan Akhir Tahun Anggaran",
  "236": "Pergeseran Anggaran Antar-KRO dan/atau Antar-Kegiatan",
  "239": "Revisi dalam rangka Pagu Anggaran Tetap lainnya"
};

/**
 * Memecah kode jenis revisi string (mendukung koma) dan membersihkan whitespace
 * Contoh: "102, 221, 315" -> ["102", "221", "315"]
 */
export function parseRevisionCodes(codeStr: string | null | undefined): string[] {
  if (!codeStr) return [];
  return String(codeStr)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Mengecek apakah kode revisi yang diinput termasuk dalam 14 jenis revisi
 */
export function checkRevisionCodes(codeStr: string | null | undefined): {
  codes: string[];
  hasAny14: boolean;
  hasAll14: boolean;
  matchedCodes: string[];
  unmatchedCodes: string[];
  descriptions: { kode: string; uraian: string; is14: boolean }[];
} {
  const codes = parseRevisionCodes(codeStr);
  if (codes.length === 0) {
    return {
      codes: [],
      hasAny14: false,
      hasAll14: false,
      matchedCodes: [],
      unmatchedCodes: [],
      descriptions: []
    };
  }
  const matchedCodes = codes.filter(c => VALID_REVISION_CODES.includes(c));
  const unmatchedCodes = codes.filter(c => !VALID_REVISION_CODES.includes(c));
  const descriptions = codes.map(c => ({
    kode: c,
    uraian: VALID_REVISION_CODE_MAP[c] || 'Kode di luar 14 jenis revisi',
    is14: VALID_REVISION_CODES.includes(c)
  }));

  return {
    codes,
    hasAny14: matchedCodes.length > 0,
    hasAll14: unmatchedCodes.length === 0,
    matchedCodes,
    unmatchedCodes,
    descriptions
  };
}

/**
 * Logika Kolom I: Apakah diperhitungkan dalam Indikator Revisi DIPA
 * Formula Excel: =IF(AND(H4="ya",F4=G4),"diperhitungkan","tidak diperhitungkan")
 *
 * Syarat:
 * 1. H === "ya"
 * 2. Pagu Sebelum (F) === Pagu Menjadi (G) (keduanya tidak null/kosong)
 */
export function calculateRevisionEligibility(
  row: Partial<RevisionDipaRow & RevisiDIPAInput>
): "diperhitungkan" | "tidak diperhitungkan" {
  const hRaw = row.empatBelasJenis ?? row.jenisRevisi14 ?? "-";
  const h = String(hRaw).trim().toLowerCase();

  const f = row.paguSebelum !== undefined && row.paguSebelum !== null
    ? Number(row.paguSebelum)
    : (row.paguDipaSebelum !== undefined && row.paguDipaSebelum !== null ? Number(row.paguDipaSebelum) : null);

  const g = row.paguMenjadi !== undefined && row.paguMenjadi !== null
    ? Number(row.paguMenjadi)
    : (row.paguDipaMenjadi !== undefined && row.paguDipaMenjadi !== null ? Number(row.paguDipaMenjadi) : null);

  // Jika tidak ada revisi ("-") atau "tidak", otomatis tidak diperhitungkan
  if (h !== "ya") {
    return "tidak diperhitungkan";
  }

  // Jika H === "ya", F dan G wajib ada dan F === G (Pagu DIPA Tetap)
  if (f !== null && g !== null && f === g && f > 0) {
    return "diperhitungkan";
  }

  return "tidak diperhitungkan";
}

/**
 * Logika Kolom J: Menghitung jumlah revisi yang diperhitungkan secara kumulatif
 * Excel: COUNTIF(range, "diperhitungkan")
 */
export function calculateCumulativeCount(
  rows: { diperhitungkan?: "diperhitungkan" | "tidak diperhitungkan" }[],
  startIndex: number,
  endIndex: number
): number {
  let count = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    if (rows[i]?.diperhitungkan === "diperhitungkan") {
      count++;
    }
  }
  return count;
}

/**
 * Logika Kolom L: Nilai Indikator
 * Formula Excel: =IF(J4<=1,110,IF(J4=2,100,50))
 * Catatan: JANGAN cap 100 pada kolom L. Nilai 110 harus tetap diperbolehkan!
 */
export function calculateRevisionIndicator(count: number): number {
  if (count <= 1) return 110;
  if (count === 2) return 100;
  return 50;
}

/**
 * Menghitung seluruh tabel Revisi DIPA untuk 12 periode.
 *
 * Pemisahan Semester:
 * - Semester I (Periode 01-06, baris index 0-5):
 *   - J[i] = COUNTIF(I[0..i], "diperhitungkan")
 *   - L[i] = calculateRevisionIndicator(J[i])
 *   - M[i] = L[i] (M4..M9 = L4..L9)
 *
 * - Semester II (Periode 07-12, baris index 6-11):
 *   - J[i] = COUNTIF(I[6..i], "diperhitungkan") (KUMULATIF DIMULAI KEMBALI DARI PERIODE 07!)
 *   - L[i] = calculateRevisionIndicator(J[i])
 *   - M[i] = AVERAGE(L[5], L[i]) = (L[5] + L[i]) / 2 (Excel AVERAGE($L$9, L_curr))
 */
export function calculateSemesterIKPA(
  inputs: (RevisionDipaRow | RevisiDIPAInput)[]
): RevisionDipaRow[] {
  if (!inputs || inputs.length === 0) {
    return [];
  }

  const preparedRows: RevisionDipaRow[] = inputs.map((existing, i) => {
    const no = existing?.no ?? (i + 1);
    const periode = existing?.periode ?? String(no).padStart(2, '0');
    const isSem1 = no <= 6;
    const keterangan = isSem1 ? 'Semester I' : 'Semester II';

    const revisiKe = existing?.revisiKe !== undefined ? existing.revisiKe : null;
    const tanggalRevisi = existing?.tanggalRevisi || null;
    const kodeJenisRevisi = existing?.kodeJenisRevisi || '';

    const f = existing?.paguSebelum !== undefined
      ? existing.paguSebelum
      : (existing?.paguDipaSebelum !== undefined ? existing.paguDipaSebelum : null);

    const g = existing?.paguMenjadi !== undefined
      ? existing.paguMenjadi
      : (existing?.paguDipaMenjadi !== undefined ? existing.paguDipaMenjadi : null);

    const hRaw = existing?.empatBelasJenis ?? existing?.jenisRevisi14 ?? '-';
    const empatBelasJenis: "ya" | "tidak" | "-" =
      hRaw === 'ya' ? 'ya' : (hRaw === 'tidak' ? 'tidak' : '-');

    return {
      no,
      periode,
      revisiKe: revisiKe !== null && revisiKe !== undefined ? Number(revisiKe) : null,
      tanggalRevisi,
      kodeJenisRevisi,
      paguSebelum: f !== null && f !== undefined ? Number(f) : null,
      paguMenjadi: g !== null && g !== undefined ? Number(g) : null,
      empatBelasJenis,
      diperhitungkan: 'tidak diperhitungkan',
      jumlahDiperhitungkan: 0,
      keterangan,
      nilaiIndikator: 110,
      nilaiIKPA: 110
    };
  });

  // Step 1: Hitung status diperhitungkan (Kolom I) untuk setiap baris
  for (let i = 0; i < preparedRows.length; i++) {
    preparedRows[i].diperhitungkan = calculateRevisionEligibility(preparedRows[i]);
  }

  // Kelompokkan indeks baris per Semester I (no <= 6) dan Semester II (no > 6)
  const sem1Indices: number[] = [];
  const sem2Indices: number[] = [];
  preparedRows.forEach((row, idx) => {
    if (row.no <= 6) {
      sem1Indices.push(idx);
    } else {
      sem2Indices.push(idx);
    }
  });

  // Step 2: Semester I
  for (let idx of sem1Indices) {
    const count = calculateCumulativeCount(preparedRows, sem1Indices[0], idx);
    preparedRows[idx].jumlahDiperhitungkan = count;
    preparedRows[idx].keterangan = 'Semester I';
    const indicator = calculateRevisionIndicator(count);
    preparedRows[idx].nilaiIndikator = indicator;
    preparedRows[idx].nilaiIKPA = indicator;
  }

  // Nilai Semester I terakhir
  const lastSem1Idx = sem1Indices.length > 0 ? sem1Indices[sem1Indices.length - 1] : -1;
  const l9Value = lastSem1Idx >= 0 ? preparedRows[lastSem1Idx].nilaiIndikator : 110;

  // Step 3: Semester II (Kumulatif Semester II dimulai dari awal Semester II)
  for (let idx of sem2Indices) {
    const count = calculateCumulativeCount(preparedRows, sem2Indices[0], idx);
    preparedRows[idx].jumlahDiperhitungkan = count;
    preparedRows[idx].keterangan = 'Semester II';
    const indicator = calculateRevisionIndicator(count);
    preparedRows[idx].nilaiIndikator = indicator;
    preparedRows[idx].nilaiIKPA = (l9Value + indicator) / 2;
  }

  return preparedRows;
}

export function hasActualRevisiDIPAData(inputs?: (RevisiDIPAInput | RevisionDipaRow)[]): boolean {
  if (!inputs || inputs.length === 0) return false;
  return inputs.some(r => {
    if (!r) return false;
    const revKe = Number(r.revisiKe);
    if (!isNaN(revKe) && revKe > 0) return true;
    if (typeof r.tanggalRevisi === 'string' && r.tanggalRevisi.trim() !== '') return true;
    const pSeb = Number(r.paguDipaSebelum ?? (r as any).paguSebelum);
    if (!isNaN(pSeb) && pSeb > 0) return true;
    const pMen = Number(r.paguDipaMenjadi ?? (r as any).paguMenjadi);
    if (!isNaN(pMen) && pMen > 0) return true;
    if (r.kodeJenisRevisi && String(r.kodeJenisRevisi).trim() !== '') return true;
    return false;
  });
}

/**
 * Logika Final yang Masuk ke Interface (Dashboard):
 * Formula Excel: =IF('Revisi DIPA'!M15>100, 100, 'Revisi DIPA'!M15)
 *
 * Cap 100 HANYA dilakukan pada nilai akhir yang masuk ke dashboard/interface.
 * Kolom L dan M tabel tetap mempertahankan nilai asli (misal 110 atau 105).
 */
export function calculateFinalRevisionScore(rows: RevisionDipaRow[]): number {
  if (!rows || rows.length === 0 || !hasActualRevisiDIPAData(rows)) return 0;
  // Ambil M15 (periode 12, index 11)
  const lastRow = rows.length >= 12 ? rows[11] : rows[rows.length - 1];
  const m15 = lastRow ? lastRow.nilaiIKPA : 0;
  return Math.min(100, m15);
}

/**
 * Fungsi kalkulasi utama untuk modul IKPA Engine.
 * Mengembalikan IndicatorResult lengkap dengan rincian audit perhitungan.
 */
export function calculateRevisiDIPA(
  inputs: RevisiDIPAInput[] | RevisionDipaRow[],
  weight: number = 10,
  isActive: boolean = true
): IndicatorResult {
  const details: CalculationDetail[] = [];

  if (!isActive || weight === 0) {
    return {
      rawValue: 0,
      cappedValue: 0,
      weight: isActive ? weight : 0,
      weightedValue: 0,
      isActive,
      details: [{
        step: 'Indikator Tidak Aktif',
        formulaHuman: 'Bobot = 0% atau indikator dinonaktifkan',
        value: 0
      }]
    };
  }

  // Jika belum ada data revisi DIPA yang diisi, kembalikan nilai 0 (bukan default 100/110)
  if (!hasActualRevisiDIPAData(inputs)) {
    return {
      rawValue: 0,
      cappedValue: 0,
      weight: isActive ? weight : 0,
      weightedValue: 0,
      isActive,
      details: [{
        step: 'Data Revisi DIPA Kosong',
        formulaHuman: 'Belum ada data revisi DIPA yang diinputkan (Nilai = 0)',
        formulaTechnical: '0',
        value: 0,
        note: 'Nilai awal simulasi 0 sebelum data revisi DIPA diisi'
      }],
      metadata: {
        rows: [],
        sem1Count: 0,
        sem2Count: 0,
        sem1Indicator: 0,
        sem2Indicator: 0,
        m15: 0,
        finalScore: 0
      }
    };
  }

  // Hitung tabel 12 periode
  const calculatedRows = calculateSemesterIKPA(inputs || []);

  const sem1Count = calculatedRows[5].jumlahDiperhitungkan;
  const sem2Count = calculatedRows[11].jumlahDiperhitungkan;
  const l9Value = calculatedRows[5].nilaiIndikator;
  const l15Value = calculatedRows[11].nilaiIndikator;
  const m15Value = calculatedRows[11].nilaiIKPA;

  const rawValue = m15Value;
  const cappedValue = Math.min(100, rawValue);
  const weightedValue = round2((cappedValue * weight) / 100);

  details.push({
    step: 'Revisi Diperhitungkan Semester I (J9)',
    formulaHuman: `COUNTIF(I4:I9; "diperhitungkan") = ${sem1Count} revisi`,
    formulaTechnical: 'COUNTIF(I4:I9, "diperhitungkan")',
    excelCell: 'J9',
    value: sem1Count,
    note: sem1Count <= 1 ? 'Maksimal 1 revisi per semester (Nilai 110)' : (sem1Count === 2 ? '2 revisi (Nilai 100)' : '>2 revisi (Nilai 50)')
  });

  details.push({
    step: 'Nilai Indikator Semester I (L9)',
    formulaHuman: `IF(J9<=1; 110; IF(J9=2; 100; 50)) = ${l9Value}`,
    formulaTechnical: 'IF(J9<=1, 110, IF(J9=2, 100, 50))',
    excelCell: 'L9',
    value: l9Value
  });

  details.push({
    step: 'Revisi Diperhitungkan Semester II (J15)',
    formulaHuman: `COUNTIF(I10:I15; "diperhitungkan") = ${sem2Count} revisi (dihitung ulang mulai periode 07)`,
    formulaTechnical: 'COUNTIF(I10:I15, "diperhitungkan")',
    excelCell: 'J15',
    value: sem2Count,
    note: 'Basis perhitungan Semester II terpisah, tidak menggabungkan Semester I'
  });

  details.push({
    step: 'Nilai Indikator Semester II (L15)',
    formulaHuman: `IF(J15<=1; 110; IF(J15=2; 100; 50)) = ${l15Value}`,
    formulaTechnical: 'IF(J15<=1, 110, IF(J15=2, 100, 50))',
    excelCell: 'L15',
    value: l15Value
  });

  details.push({
    step: 'Nilai Akhir Indikator (M15)',
    formulaHuman: `AVERAGE(L9; L15) = (${l9Value} + ${l15Value}) / 2 = ${m15Value}`,
    formulaTechnical: 'AVERAGE($L$9, L15)',
    excelCell: 'M15',
    value: m15Value
  });

  details.push({
    step: 'Nilai Capped Masuk Dashboard (Interface G6)',
    formulaHuman: `MIN(100; M15) = MIN(100; ${m15Value}) = ${cappedValue}`,
    formulaTechnical: 'IF(M15>100, 100, M15)',
    excelCell: 'G6',
    value: cappedValue,
    note: 'Nilai indikator dibatasi maksimal 100 pada dashboard utama'
  });

  details.push({
    step: 'Nilai Berbobot (Interface G8)',
    formulaHuman: `ROUND(${cappedValue} × ${weight}% / 100; 2) = ${weightedValue}`,
    formulaTechnical: `ROUND(${cappedValue} * ${weight} / 100, 2)`,
    excelCell: 'G8',
    value: weightedValue
  });

  return {
    rawValue,
    cappedValue,
    weight,
    weightedValue,
    isActive,
    details,
    metadata: {
      rows: calculatedRows,
      sem1Count,
      sem2Count,
      sem1Indicator: l9Value,
      sem2Indicator: l15Value,
      m15: m15Value,
      finalScore: cappedValue
    }
  };
}

/**
 * Data Referensi Golden Test Resmi
 */
export const REVISI_DIPA_GOLDEN_INPUTS: Omit<RevisionDipaRow, 'diperhitungkan' | 'jumlahDiperhitungkan' | 'keterangan' | 'nilaiIndikator' | 'nilaiIKPA'>[] = [
  { no: 1, periode: "01", revisiKe: 1, tanggalRevisi: "2024-01-24", kodeJenisRevisi: "212", paguSebelum: 7535000000, paguMenjadi: 7535000000, empatBelasJenis: "ya" },
  { no: 2, periode: "02", revisiKe: 2, tanggalRevisi: "2024-02-19", kodeJenisRevisi: "315, 325", paguSebelum: 7535000000, paguMenjadi: 7535000000, empatBelasJenis: "tidak" },
  { no: 3, periode: "03", revisiKe: null, tanggalRevisi: null, kodeJenisRevisi: "", paguSebelum: null, paguMenjadi: null, empatBelasJenis: "-" },
  { no: 4, periode: "04", revisiKe: 3, tanggalRevisi: "2024-04-22", kodeJenisRevisi: "102, 221, 315", paguSebelum: 7535000000, paguMenjadi: 9876500000, empatBelasJenis: "ya" },
  { no: 5, periode: "05", revisiKe: null, tanggalRevisi: null, kodeJenisRevisi: "", paguSebelum: null, paguMenjadi: null, empatBelasJenis: "-" },
  { no: 6, periode: "06", revisiKe: null, tanggalRevisi: null, kodeJenisRevisi: "", paguSebelum: null, paguMenjadi: null, empatBelasJenis: "-" },
  { no: 7, periode: "07", revisiKe: 4, tanggalRevisi: "2024-07-12", kodeJenisRevisi: "221, 315", paguSebelum: 9876500000, paguMenjadi: 9876500000, empatBelasJenis: "ya" },
  { no: 8, periode: "08", revisiKe: 5, tanggalRevisi: "2024-08-08", kodeJenisRevisi: "226", paguSebelum: 9876500000, paguMenjadi: 9876500000, empatBelasJenis: "ya" },
  { no: 9, periode: "09", revisiKe: 6, tanggalRevisi: "2024-09-23", kodeJenisRevisi: "220", paguSebelum: 9876500000, paguMenjadi: 9876500000, empatBelasJenis: "ya" },
  { no: 10, periode: "10", revisiKe: 7, tanggalRevisi: "2024-10-11", kodeJenisRevisi: "238, 315", paguSebelum: 9876500000, paguMenjadi: 9989000000, empatBelasJenis: "tidak" },
  { no: 11, periode: "11", revisiKe: null, tanggalRevisi: null, kodeJenisRevisi: "", paguSebelum: null, paguMenjadi: null, empatBelasJenis: "-" },
  { no: 12, periode: "12", revisiKe: null, tanggalRevisi: null, kodeJenisRevisi: "", paguSebelum: null, paguMenjadi: null, empatBelasJenis: "-" },
];

export interface GoldenTestVerificationResult {
  passed: boolean;
  finalScore: number;
  expectedFinalScore: number;
  rowResults: {
    cellM: string;
    expectedM: number;
    actualM: number;
    passed: boolean;
  }[];
}

/**
 * Menjalankan Automated Golden Test untuk modul Revisi DIPA
 */
export function runRevisiDipaGoldenTest(): GoldenTestVerificationResult {
  const calculated = calculateSemesterIKPA(REVISI_DIPA_GOLDEN_INPUTS as any);
  const expectedM = [110, 110, 110, 110, 110, 110, 110, 105, 80, 80, 80, 80];

  const rowResults = calculated.map((row, idx) => {
    const cellM = `M${idx + 4}`;
    const exp = expectedM[idx];
    const act = row.nilaiIKPA;
    return {
      cellM,
      expectedM: exp,
      actualM: act,
      passed: Math.abs(exp - act) < 0.0001
    };
  });

  const finalScore = calculateFinalRevisionScore(calculated);
  const expectedFinalScore = 80;
  const allRowsPassed = rowResults.every(r => r.passed);
  const finalPassed = Math.abs(finalScore - expectedFinalScore) < 0.0001;

  return {
    passed: allRowsPassed && finalPassed,
    finalScore,
    expectedFinalScore,
    rowResults
  };
}
