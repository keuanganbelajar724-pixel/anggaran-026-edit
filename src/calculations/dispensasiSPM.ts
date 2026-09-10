import { DispensasiSPM } from '../models/ikpa';
import { round2 } from './rounding';

/**
 * 4. KOLOM C — RASIO DISPENSASI SPM
 * Formula Excel Asli:
 * C2: =B2/A2*1000
 * Skala yang digunakan workbook adalah per mil (× 1000), BUKAN persen (× 100).
 * Contoh: A2 = 100, B2 = 1 -> C2 = (1 / 100) * 1000 = 10
 *
 * 5. PENANGANAN A2 = 0:
 * Jika A2 === 0, rasio = 0 (mencegah error #DIV/0!, NaN, Infinity).
 */
export function calculateDispensationRatio(
  totalSPM: number,
  dispensasi: number
): number {
  if (!totalSPM || totalSPM <= 0 || isNaN(totalSPM)) {
    return 0;
  }
  const disp = Math.max(0, dispensasi || 0);
  return (disp / totalSPM) * 1000;
}

// Alias for calculation engine compatibility
export const calculateDispensasiRatio = calculateDispensationRatio;

/**
 * 6 & 7. KOLOM D — PENGURANG NILAI
 * Formula Excel Asli:
 * D2: =IF(C2=0, 0, IF(C2<=0.099, 0.25, IF(C2<=0.99, 0.5, IF(C2<=4.99, 0.75, 1))))
 *
 * THRESHOLD WAJIB:
 * - Rasio = 0                => Pengurang = 0
 * - 0 < Rasio <= 0.099       => Pengurang = 0.25
 * - 0.099 < Rasio <= 0.99    => Pengurang = 0.50
 * - 0.99 < Rasio <= 4.99     => Pengurang = 0.75
 * - Rasio > 4.99             => Pengurang = 1.00
 *
 * PENTING:
 * - Jangan membulatkan rasio sebelum menentukan threshold!
 * - Nilai pengurang tepat: 0, 0.25, 0.5, 0.75, 1.
 */
export function calculateDispensationPenalty(ratio: number): number {
  if (!ratio || ratio <= 0 || isNaN(ratio)) {
    return 0;
  }
  if (ratio <= 0.099) {
    return 0.25;
  }
  if (ratio <= 0.99) {
    return 0.5;
  }
  if (ratio <= 4.99) {
    return 0.75;
  }
  return 1.0;
}

// Alias for calculation engine compatibility
export const calculateDispensasiReduction = calculateDispensationPenalty;

/**
 * Validasi input A2 dan B2
 */
export interface DispensasiValidation {
  isValid: boolean;
  warnings: string[];
}

export function validateDispensasiInput(
  totalSPM: number,
  dispensasi: number
): DispensasiValidation {
  const warnings: string[] = [];

  if (totalSPM < 0 || dispensasi < 0) {
    warnings.push("Jumlah SPM dan dispensasi tidak boleh bernilai negatif.");
  }

  if (totalSPM === 0 && dispensasi > 0) {
    warnings.push("Jumlah SPM Triwulan IV adalah 0, tetapi terdapat dispensasi.");
  }

  if (totalSPM > 0 && dispensasi > totalSPM) {
    warnings.push("Jumlah dispensasi melebihi jumlah SPM Triwulan IV.");
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
}

/**
 * Hasil perhitungan lengkap modul Dispensasi SPM
 */
export interface DispensasiResult {
  jumlahSPMTriwulanIV: number; // Sel A2
  jumlahDispensasiSPM: number; // Sel B2
  rasio: number;               // Sel C2 (=B2/A2*1000)
  pengurangNilai: number;      // Sel D2 (=P6 pada sheet Interface)
  validation: DispensasiValidation;
  // Compatibility properties
  jumlahSPM: number;
  jumlahDispensasi: number;
  ratio: number;
  reduction: number;
  details: {
    formulaHuman: string;
    formulaTechnical: string;
    ratioText: string;
    reductionText: string;
    thresholdApplied: string;
  };
}

/**
 * Calculation Engine Utama: calculateDispensasiSPM
 */
export function calculateDispensasiSPM(input: DispensasiSPM): DispensasiResult {
  const jumlahSPMTriwulanIV = Math.max(0, Math.floor(input?.jumlahSPMTriwulanIV ?? 0));
  const jumlahDispensasiSPM = Math.max(0, Math.floor(input?.jumlahDispensasiSPM ?? 0));

  // Hitung Rasio C2: =B2/A2*1000 (tanpa pembulatan awal)
  const rasio = calculateDispensationRatio(jumlahSPMTriwulanIV, jumlahDispensasiSPM);

  // Hitung Pengurang Nilai D2
  const pengurangNilai = calculateDispensationPenalty(rasio);

  const validation = validateDispensasiInput(jumlahSPMTriwulanIV, jumlahDispensasiSPM);

  // Threshold label
  let thresholdApplied = 'Rasio = 0 → Pengurang = 0';
  if (rasio > 0 && rasio <= 0.099) {
    thresholdApplied = '0 < Rasio ≤ 0,099 → Pengurang = 0,25';
  } else if (rasio > 0.099 && rasio <= 0.99) {
    thresholdApplied = '0,099 < Rasio ≤ 0,99 → Pengurang = 0,50';
  } else if (rasio > 0.99 && rasio <= 4.99) {
    thresholdApplied = '0,99 < Rasio ≤ 4,99 → Pengurang = 0,75';
  } else if (rasio > 4.99) {
    thresholdApplied = 'Rasio > 4,99 → Pengurang = 1,00';
  }

  const formulaHuman = jumlahSPMTriwulanIV > 0
    ? `(${jumlahDispensasiSPM} / ${jumlahSPMTriwulanIV}) × 1000 = ${rasio.toFixed(4)}‰ → ${thresholdApplied}`
    : `Total SPM TW IV = 0 → Rasio = 0‰ → Pengurang = 0`;

  return {
    jumlahSPMTriwulanIV,
    jumlahDispensasiSPM,
    rasio,
    pengurangNilai,
    validation,
    // Aliases
    jumlahSPM: jumlahSPMTriwulanIV,
    jumlahDispensasi: jumlahDispensasiSPM,
    ratio: rasio,
    reduction: pengurangNilai,
    details: {
      formulaHuman,
      formulaTechnical: '=IF(C2=0,0,IF(C2<=0.099,0.25,IF(C2<=0.99,0.5,IF(C2<=4.99,0.75,1))))',
      ratioText: `${rasio.toFixed(2)}‰`,
      reductionText: `-${pengurangNilai.toFixed(2).replace('.', ',')}`,
      thresholdApplied
    }
  };
}

/**
 * 21. AUTOMATED GOLDEN TEST:
 * Sesuai instruksi pengguna:
 * TEST 1: A=100, B=0       -> ratio=0,     penalty=0
 * TEST 2: ratio=0.099      -> penalty=0.25
 * TEST 3: ratio=0.99       -> penalty=0.50
 * TEST 4: ratio=4.99       -> penalty=0.75
 * TEST 5: ratio=5          -> penalty=1
 * TEST 6: ratio=10         -> penalty=1
 * TEST 7: totalSPM=0, B=0  -> ratio=0,     penalty=0
 * TEST 8: totalSPM=100,B=1 -> ratio=10,    penalty=1
 * PLUS TEST 9: Workbook Reference Data: totalSPM=550, B=2 -> ratio=3.636..., penalty=0.75
 */
export interface DispensasiGoldenCheck {
  id: string;
  name: string;
  expected: { ratio?: number; penalty: number };
  actual: { ratio?: number; penalty: number };
  status: 'PASS' | 'FAIL';
  note?: string;
}

export interface DispensasiGoldenReport {
  timestamp: string;
  totalChecks: number;
  passedCount: number;
  failedCount: number;
  status: 'PASS' | 'FAIL';
  checks: DispensasiGoldenCheck[];
}

export function runDispensasiSPMGoldenTest(): DispensasiGoldenReport {
  const checks: DispensasiGoldenCheck[] = [];

  // TEST 1: A=100, B=0 -> ratio=0, penalty=0
  const r1 = calculateDispensationRatio(100, 0);
  const p1 = calculateDispensationPenalty(r1);
  checks.push({
    id: 'TEST 1',
    name: 'A=100, B=0 -> ratio=0, penalty=0',
    expected: { ratio: 0, penalty: 0 },
    actual: { ratio: r1, penalty: p1 },
    status: r1 === 0 && p1 === 0 ? 'PASS' : 'FAIL',
    note: 'Tanpa dispensasi, nilai pengurang adalah 0'
  });

  // TEST 2: ratio=0.099 -> penalty=0.25
  const p2 = calculateDispensationPenalty(0.099);
  checks.push({
    id: 'TEST 2',
    name: 'ratio=0.099 -> penalty=0.25',
    expected: { ratio: 0.099, penalty: 0.25 },
    actual: { ratio: 0.099, penalty: p2 },
    status: p2 === 0.25 ? 'PASS' : 'FAIL',
    note: 'Tepat di batas atas tier 1 (<= 0.099)'
  });

  // TEST 3: ratio=0.99 -> penalty=0.50
  const p3 = calculateDispensationPenalty(0.99);
  checks.push({
    id: 'TEST 3',
    name: 'ratio=0.99 -> penalty=0.50',
    expected: { ratio: 0.99, penalty: 0.5 },
    actual: { ratio: 0.99, penalty: p3 },
    status: p3 === 0.5 ? 'PASS' : 'FAIL',
    note: 'Tepat di batas atas tier 2 (<= 0.99)'
  });

  // TEST 4: ratio=4.99 -> penalty=0.75
  const p4 = calculateDispensationPenalty(4.99);
  checks.push({
    id: 'TEST 4',
    name: 'ratio=4.99 -> penalty=0.75',
    expected: { ratio: 4.99, penalty: 0.75 },
    actual: { ratio: 4.99, penalty: p4 },
    status: p4 === 0.75 ? 'PASS' : 'FAIL',
    note: 'Tepat di batas atas tier 3 (<= 4.99)'
  });

  // TEST 5: ratio=5 -> penalty=1
  const p5 = calculateDispensationPenalty(5);
  checks.push({
    id: 'TEST 5',
    name: 'ratio=5 -> penalty=1',
    expected: { ratio: 5, penalty: 1 },
    actual: { ratio: 5, penalty: p5 },
    status: p5 === 1 ? 'PASS' : 'FAIL',
    note: 'Melebihi 4.99 -> tier maksimum'
  });

  // TEST 6: ratio=10 -> penalty=1
  const p6 = calculateDispensationPenalty(10);
  checks.push({
    id: 'TEST 6',
    name: 'ratio=10 -> penalty=1',
    expected: { ratio: 10, penalty: 1 },
    actual: { ratio: 10, penalty: p6 },
    status: p6 === 1 ? 'PASS' : 'FAIL',
    note: 'Tier maksimum penalty 1.00'
  });

  // TEST 7: totalSPM=0, dispensasi=0 -> ratio=0, penalty=0
  const r7 = calculateDispensationRatio(0, 0);
  const p7 = calculateDispensationPenalty(r7);
  checks.push({
    id: 'TEST 7',
    name: 'totalSPM=0, dispensasi=0 -> ratio=0, penalty=0',
    expected: { ratio: 0, penalty: 0 },
    actual: { ratio: r7, penalty: p7 },
    status: r7 === 0 && p7 === 0 ? 'PASS' : 'FAIL',
    note: 'Safe handling pembagian nol'
  });

  // TEST 8: totalSPM=100, dispensasi=1 -> ratio=10, penalty=1
  const r8 = calculateDispensationRatio(100, 1);
  const p8 = calculateDispensationPenalty(r8);
  checks.push({
    id: 'TEST 8',
    name: 'totalSPM=100, dispensasi=1 -> ratio=10, penalty=1',
    expected: { ratio: 10, penalty: 1 },
    actual: { ratio: r8, penalty: p8 },
    status: r8 === 10 && p8 === 1 ? 'PASS' : 'FAIL',
    note: '(1 / 100) * 1000 = 10 -> penalty = 1'
  });

  // TEST 9: Workbook Reference Data (A=550, B=2 -> rasio=3.636..., penalty=0.75)
  const r9 = calculateDispensationRatio(550, 2);
  const p9 = calculateDispensationPenalty(r9);
  const diffRatio = Math.abs(r9 - 3.6363636363636362);
  checks.push({
    id: 'TEST 9 (Workbook Reference)',
    name: 'A=550, B=2 -> rasio ≈ 3.636‰, penalty = 0.75',
    expected: { ratio: 3.6364, penalty: 0.75 },
    actual: { ratio: Number(r9.toFixed(4)), penalty: p9 },
    status: diffRatio < 0.0001 && p9 === 0.75 ? 'PASS' : 'FAIL',
    note: 'Sesuai persis dengan lembar kerja acuan Excel'
  });

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
