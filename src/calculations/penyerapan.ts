import { PenyerapanInput, PenyerapanPeriod, IndicatorResult, CalculationDetail } from '../models/ikpa';
import { round2 } from './rounding';
export { round2 };

// ==================================================
// 4. TARGET PENYERAPAN
// ==================================================
// Target merupakan target kumulatif sesuai triwulan:
// Triwulan I   (01-03): 51: 20%, 52: 15%, 53: 10%, 57: 25%
// Triwulan II  (04-06): 51: 50%, 52: 50%, 53: 40%, 57: 50%
// Triwulan III (07-09): 51: 75%, 52: 70%, 53: 70%, 57: 75%
// Triwulan IV  (10-12): 51: 95%, 52: 90%, 53: 90%, 57: 95%
export const TARGETS: Record<string, { 51: number; 52: number; 53: number; 57: number }> = {
  '01': { 51: 0.20, 52: 0.15, 53: 0.10, 57: 0.25 },
  '02': { 51: 0.20, 52: 0.15, 53: 0.10, 57: 0.25 },
  '03': { 51: 0.20, 52: 0.15, 53: 0.10, 57: 0.25 },

  '04': { 51: 0.50, 52: 0.50, 53: 0.40, 57: 0.50 },
  '05': { 51: 0.50, 52: 0.50, 53: 0.40, 57: 0.50 },
  '06': { 51: 0.50, 52: 0.50, 53: 0.40, 57: 0.50 },

  '07': { 51: 0.75, 52: 0.70, 53: 0.70, 57: 0.75 },
  '08': { 51: 0.75, 52: 0.70, 53: 0.70, 57: 0.75 },
  '09': { 51: 0.75, 52: 0.70, 53: 0.70, 57: 0.75 },

  '10': { 51: 0.95, 52: 0.90, 53: 0.90, 57: 0.95 },
  '11': { 51: 0.95, 52: 0.90, 53: 0.90, 57: 0.95 },
  '12': { 51: 0.95, 52: 0.90, 53: 0.90, 57: 0.95 }
};

// Default target standar per triwulan sesuai PER-5/PB/2024:
export const DEFAULT_QUARTER_TARGETS: Record<number, { 51: number; 52: number; 53: number; 57: number }> = {
  1: { 51: 0.20, 52: 0.15, 53: 0.10, 57: 0.25 },
  2: { 51: 0.50, 52: 0.50, 53: 0.40, 57: 0.50 },
  3: { 51: 0.75, 52: 0.70, 53: 0.70, 57: 0.75 },
  4: { 51: 0.95, 52: 0.90, 53: 0.90, 57: 0.95 }
};

export function getQuarterFromPeriod(periode: string | number): number {
  const pNum = parseInt(String(periode || '1').trim(), 10) || 1;
  return pNum <= 3 ? 1 : pNum <= 6 ? 2 : pNum <= 9 ? 3 : 4;
}

// Backward-compatible array for existing consumers
export const PENYERAPAN_TARGETS = [
  { periode: '01', 51: 0.20, 52: 0.15, 53: 0.10, 57: 0.25 },
  { periode: '02', 51: 0.20, 52: 0.15, 53: 0.10, 57: 0.25 },
  { periode: '03', 51: 0.20, 52: 0.15, 53: 0.10, 57: 0.25 },
  { periode: '04', 51: 0.50, 52: 0.50, 53: 0.40, 57: 0.50 },
  { periode: '05', 51: 0.50, 52: 0.50, 53: 0.40, 57: 0.50 },
  { periode: '06', 51: 0.50, 52: 0.50, 53: 0.40, 57: 0.50 },
  { periode: '07', 51: 0.75, 52: 0.70, 53: 0.70, 57: 0.75 },
  { periode: '08', 51: 0.75, 52: 0.70, 53: 0.70, 57: 0.75 },
  { periode: '09', 51: 0.75, 52: 0.70, 53: 0.70, 57: 0.75 },
  { periode: '10', 51: 0.95, 52: 0.90, 53: 0.90, 57: 0.95 },
  { periode: '11', 51: 0.95, 52: 0.90, 53: 0.90, 57: 0.95 },
  { periode: '12', 51: 0.95, 52: 0.90, 53: 0.90, 57: 0.95 }
];

// ==================================================
// 5. PAGU NETTO
// ==================================================
// Pagu Netto = Pagu DIPA - Blokir (tidak boleh negatif)
export function calculateNetBudget(pagu: number, blokir: number): number {
  const p = Number(pagu) || 0;
  const b = Number(blokir) || 0;
  return Math.max(0, p - b);
}

// ==================================================
// 4b. GET TARGETS (Dukungan Custom Target Triwulanan & Dispensasi)
// ==================================================
export function calculateTargets(
  periode: string,
  customQuarterTargets?: Record<number, { 51: number; 52: number; 53: number; 57: number }>
): { 51: number; 52: number; 53: number; 57: number } {
  const clean = String(periode).trim().padStart(2, '0');
  const qNum = getQuarterFromPeriod(clean);
  if (customQuarterTargets && customQuarterTargets[qNum]) {
    return customQuarterTargets[qNum];
  }
  return TARGETS[clean] || DEFAULT_QUARTER_TARGETS[qNum] || { 51: 0.95, 52: 0.90, 53: 0.90, 57: 0.95 };
}

// Normalisasi input target (misal 15 menjadi 0.15, atau 0.15 tetap 0.15)
export function parseTargetValue(rawVal: any, defaultTarget: number): number {
  if (rawVal === undefined || rawVal === null || rawVal === '') return defaultTarget;
  const num = Number(rawVal);
  if (isNaN(num) || num < 0) return defaultTarget;
  return num > 1 ? num / 100 : num;
}

// ==================================================
// 6. NOMINAL TARGET
// ==================================================
// Nominal Target = Pagu Netto * Target Persentase
export function calculateTargetNominal(paguNetto: number, targetPercent: number): number {
  const pn = Number(paguNetto) || 0;
  const tp = Number(targetPercent) || 0;
  return pn * tp;
}

// ==================================================
// 7. % REALISASI TERHADAP TARGET
// ==================================================
// Formula Excel: =IFERROR(IF(actual/target>100%, 100%, actual/target), 0)
// Capaian maksimum = 100%
export function calculateAchievement(actual: number, target: number): number {
  const act = Number(actual) || 0;
  const tgt = Number(target) || 0;
  if (tgt === 0) {
    return 0;
  }
  const ratio = act / tgt;
  return Math.min(ratio, 1) * 100;
}

// ==================================================
// 8, 9, 10 & 23. PROPORSI PAGU SESUAI PER-5 & MY INTRESS
// ==================================================
// Sesuai rumus resmi DJPb / OM-SPAN / My InTress:
// NKPAT JBx = ((PAn / TAn) x (Pagu per JB / Total Pagu)) x 100
// Proporsi setiap jenis belanja adalah Pagu Netto JB / Total Pagu Netto Seluruh JB (51+52+53+57)
export function calculateBudgetProportions(
  pagu51: number,
  pagu52: number,
  pagu53: number,
  pagu57: number
): {
  proporsi51: number;
  proporsi52: number;
  proporsi53: number;
  proporsi57: number;
} {
  const p51 = Math.max(0, Number(pagu51) || 0);
  const p52 = Math.max(0, Number(pagu52) || 0);
  const p53 = Math.max(0, Number(pagu53) || 0);
  const p57 = Math.max(0, Number(pagu57) || 0);

  const totalAll = p51 + p52 + p53 + p57;
  if (totalAll <= 0) {
    return { proporsi51: 0, proporsi52: 0, proporsi53: 0, proporsi57: 0 };
  }

  const proporsi51 = (p51 / totalAll) * 100;
  const proporsi52 = (p52 / totalAll) * 100;
  const proporsi53 = (p53 / totalAll) * 100;
  const proporsi57 = (p57 / totalAll) * 100;

  return { proporsi51, proporsi52, proporsi53, proporsi57 };
}

// Alias for exact name parity
export const calculateBudgetProportion = calculateBudgetProportions;

// ==================================================
// 11. NKPA
// ==================================================
// NKPA = % Realisasi terhadap Target * Proporsi Pagu
// Skala 0-100: NKPA = %Realisasi * Proporsi / 100
// ROUND 2 desimal
export function calculateNkpa(
  achievementPercent: number,
  proportionPercent: number
): number {
  const ach = Number(achievementPercent) || 0;
  const prop = Number(proportionPercent) || 0;
  return round2((ach * prop) / 100);
}

// ==================================================
// 12. NILAI PERIODE (P)
// ==================================================
// P = NKPA51 + NKPA52 + NKPA53 + NKPA57
export function calculatePeriodScore(
  nkpa51: number,
  nkpa52: number,
  nkpa53: number,
  nkpa57: number
): number {
  const n51 = Number(nkpa51) || 0;
  const n52 = Number(nkpa52) || 0;
  const n53 = Number(nkpa53) || 0;
  const n57 = Number(nkpa57) || 0;
  return round2(n51 + n52 + n53 + n57);
}

// ==================================================
// 13, 14, 16-19. NILAI INDIKATOR KUMULATIF (Q)
// ==================================================
// Anchor Triwulanan Sesuai Formula Excel:
// Periode 01: Q5  = P5
// Periode 02: Q11 = P11
// Periode 03: Q17 = P17
// Periode 04: Q23 = AVERAGE(P17, P23)
// Periode 05: Q29 = AVERAGE(P17, P29)
// Periode 06: Q35 = AVERAGE(P17, P35)
// Periode 07: Q41 = AVERAGE(P17, P35, P41)
// Periode 08: Q47 = AVERAGE(P17, P35, P47)
// Periode 09: Q53 = AVERAGE(P17, P35, P53)
// Periode 10: Q59 = AVERAGE(P17, P35, P53, P59)
// Periode 11: Q65 = AVERAGE(P17, P35, P53, P65)
// Periode 12: Q71 = AVERAGE(P17, P35, P53, P71)
export function calculateIndicatorScore(
  pValues: number[],
  periodIndex: number
): number {
  const p3 = pValues[2] ?? 0;
  const p6 = pValues[5] ?? 0;
  const p9 = pValues[8] ?? 0;
  const pCurrent = pValues[periodIndex] ?? 0;

  if (periodIndex < 3) {
    return pCurrent;
  } else if (periodIndex < 6) {
    return round2((p3 + pCurrent) / 2);
  } else if (periodIndex < 9) {
    return round2((p3 + p6 + pCurrent) / 3);
  } else {
    return round2((p3 + p6 + p9 + pCurrent) / 4);
  }
}

// ==================================================
// 22. CALCULATION ENGINE UTAMA
// ==================================================
export interface PenyerapanCalculationOutput {
  periods: PenyerapanPeriod[];
  result: IndicatorResult;
  warnings: string[];
}

export function calculatePenyerapanAnggaran(
  inputs: (PenyerapanInput | PenyerapanPeriod)[],
  weight: number = 20,
  isActive: boolean = true,
  cutoffMonth: number = 12,
  customQuarterTargets?: Record<number, { 51: number; 52: number; 53: number; 57: number }>
): PenyerapanCalculationOutput {
  const warnings: string[] = [];

  if (!isActive || weight === 0 || !inputs || inputs.length === 0) {
    const emptyResult: IndicatorResult = {
      rawValue: 0,
      cappedValue: 0,
      weight: isActive ? weight : 0,
      weightedValue: 0,
      isActive,
      details: [{
        step: 'Indikator Kosong / Belum Ada Data',
        formulaHuman: 'Satker belum menginput baris periode penyerapan anggaran',
        value: 0
      }],
      metadata: { periods: [], count: 0 }
    };
    return {
      periods: [],
      result: emptyResult,
      warnings: []
    };
  }

  // Filter out any non-numeric periods like notes
  const validInputs = (inputs || []).filter(inp => /^\d{1,2}$/.test(String(inp.periode || '').trim()));
  const sourceInputs = validInputs.length > 0 ? validInputs : inputs || [];

  // Urutkan input sesuai nomor periode
  const normalizedInputs: PenyerapanInput[] = [...sourceInputs].sort((a, b) => {
    const pA = parseInt(String(a.periode || '0').trim(), 10) || 0;
    const pB = parseInt(String(b.periode || '0').trim(), 10) || 0;
    return pA - pB;
  });

  // Check warnings
  normalizedInputs.forEach(inp => {
    if (inp.blokir51 > inp.pagu51 || inp.blokir52 > inp.pagu52 || inp.blokir53 > inp.pagu53 || inp.blokir57 > inp.pagu57) {
      warnings.push(`Periode ${inp.periode}: Blokir melebihi pagu.`);
    }
  });

  // Step 1: Compute Net Budget, Target, Realization, Achievement, Proportion, and NKPA for each period
  const preProcessed = normalizedInputs.map((inp, idx) => {
    const pNum = parseInt(String(inp.periode || idx + 1).trim(), 10) || (idx + 1);
    const pStr = String(pNum).padStart(2, '0');
    const targets = calculateTargets(pStr, customQuarterTargets);

    const t51 = parseTargetValue(inp.target51, targets[51]);
    const t52 = parseTargetValue(inp.target52, targets[52]);
    const t53 = parseTargetValue(inp.target53, targets[53]);
    const t57 = parseTargetValue(inp.target57, targets[57]);

    const pagu51 = Number(inp.pagu51) || 0;
    const pagu52 = Number(inp.pagu52) || 0;
    const pagu53 = Number(inp.pagu53) || 0;
    const pagu57 = Number(inp.pagu57) || 0;

    const blokir51 = Number(inp.blokir51) || 0;
    const blokir52 = Number(inp.blokir52) || 0;
    const blokir53 = Number(inp.blokir53) || 0;
    const blokir57 = Number(inp.blokir57) || 0;

    const realisasi51 = Number(inp.realisasi51) || 0;
    const realisasi52 = Number(inp.realisasi52) || 0;
    const realisasi53 = Number(inp.realisasi53) || 0;
    const realisasi57 = Number(inp.realisasi57) || 0;

    const paguNetto51 = calculateNetBudget(pagu51, blokir51);
    const paguNetto52 = calculateNetBudget(pagu52, blokir52);
    const paguNetto53 = calculateNetBudget(pagu53, blokir53);
    const paguNetto57 = calculateNetBudget(pagu57, blokir57);

    const targetNominal51 = calculateTargetNominal(paguNetto51, t51);
    const targetNominal52 = calculateTargetNominal(paguNetto52, t52);
    const targetNominal53 = calculateTargetNominal(paguNetto53, t53);
    const targetNominal57 = calculateTargetNominal(paguNetto57, t57);

    const achievement51 = calculateAchievement(realisasi51, targetNominal51);
    const achievement52 = calculateAchievement(realisasi52, targetNominal52);
    const achievement53 = calculateAchievement(realisasi53, targetNominal53);
    const achievement57 = calculateAchievement(realisasi57, targetNominal57);

    // Proporsi Pagu: in Excel, calculated using pagu netto (or pagu DIPA when blokir is 0)
    // Both 51 and 52 use total (51+52); 53 and 57 use total (51+52+53+57)
    const proportions = calculateBudgetProportions(paguNetto51, paguNetto52, paguNetto53, paguNetto57);

    const nkpa51 = calculateNkpa(achievement51, proportions.proporsi51);
    const nkpa52 = calculateNkpa(achievement52, proportions.proporsi52);
    const nkpa53 = calculateNkpa(achievement53, proportions.proporsi53);
    const nkpa57 = calculateNkpa(achievement57, proportions.proporsi57);

    const nilaiPeriode = calculatePeriodScore(nkpa51, nkpa52, nkpa53, nkpa57);

    return {
      periode: pStr,
      pagu51, pagu52, pagu53, pagu57,
      blokir51, blokir52, blokir53, blokir57,
      realisasi51, realisasi52, realisasi53, realisasi57,
      paguNetto51, paguNetto52, paguNetto53, paguNetto57,
      target51: t51, target52: t52, target53: t53, target57: t57,
      targetNominal51, targetNominal52, targetNominal53, targetNominal57,
      achievement51, achievement52, achievement53, achievement57,
      proportion51: proportions.proporsi51,
      proportion52: proportions.proporsi52,
      proportion53: proportions.proporsi53,
      proportion57: proportions.proporsi57,
      nkpa51, nkpa52, nkpa53, nkpa57,
      nilaiPeriode,
      nilaiIndikator: 0
    };
  });

  // Step 2: Compute Q (Nilai Indikator Kumulatif) using exact workbook formula
  const pValues = preProcessed.map(x => x.nilaiPeriode);
  const periods: PenyerapanPeriod[] = preProcessed.map((item, idx) => {
    const nilaiIndikator = calculateIndicatorScore(pValues, idx);
    return {
      ...item,
      nilaiIndikator
    };
  });

  // Step 3: Final Interface Value is evaluated up to cutoffMonth (default 12 / Q71)
  const targetIdx = Math.min(periods.length - 1, Math.max(0, (cutoffMonth || 12) - 1));
  const finalPeriod = periods[targetIdx] || periods[periods.length - 1];
  const rawValue = finalPeriod ? finalPeriod.nilaiIndikator : 100;
  const cappedValue = Math.min(100, Math.max(0, rawValue));
  const weightedValue = round2((cappedValue * weight) / 100);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const evalMonthName = monthNames[targetIdx] || `Bulan ${targetIdx + 1}`;

  const details: CalculationDetail[] = [
    {
      step: `Pagu Netto Seluruh Jenis Belanja (Periode ${targetIdx + 1} - ${evalMonthName})`,
      formulaHuman: `Netto 51: Rp${finalPeriod.paguNetto51.toLocaleString('id-ID')}, Netto 52: Rp${finalPeriod.paguNetto52.toLocaleString('id-ID')}, Netto 53: Rp${finalPeriod.paguNetto53.toLocaleString('id-ID')}, Netto 57: Rp${finalPeriod.paguNetto57.toLocaleString('id-ID')}`,
      formulaTechnical: 'Pagu - Blokir',
      value: finalPeriod.paguNetto51 + finalPeriod.paguNetto52 + finalPeriod.paguNetto53 + finalPeriod.paguNetto57
    },
    {
      step: `NKPA Seluruh Jenis Belanja Periode ${targetIdx + 1}`,
      formulaHuman: `NKPA 51 (${finalPeriod.nkpa51}) + NKPA 52 (${finalPeriod.nkpa52}) + NKPA 53 (${finalPeriod.nkpa53}) + NKPA 57 (${finalPeriod.nkpa57}) = ${finalPeriod.nilaiPeriode}`,
      formulaTechnical: 'SUM(NKPA 51:57)',
      value: finalPeriod.nilaiPeriode
    },
    {
      step: `Nilai IKPA Penyerapan Anggaran (Evaluasi s.d. ${evalMonthName})`,
      formulaHuman: `Nilai Indikator Periode ${String(targetIdx + 1).padStart(2, '0')} (${evalMonthName}) = ${rawValue}`,
      formulaTechnical: targetIdx === 11 ? 'AVERAGE($P$17, $P$35, $P$53, P71)' : `Periode ${targetIdx + 1}`,
      value: rawValue
    },
    {
      step: 'Nilai Berbobot (I6)',
      formulaHuman: `ROUND(${cappedValue} × ${weight}% / 100, 2) = ${weightedValue}`,
      formulaTechnical: `ROUND(${cappedValue} * ${weight} / 100, 2)`,
      value: weightedValue
    }
  ];

  const result: IndicatorResult = {
    rawValue,
    cappedValue,
    weight,
    weightedValue,
    isActive,
    details,
    metadata: {
      periods,
      evaluatedPeriodIndex: targetIdx,
      evaluatedMonth: evalMonthName,
      finalNKPA: finalPeriod.nilaiPeriode,
      warnings
    }
  };

  return { periods, result, warnings };
}

// Legacy wrapper for compatibility with ikpa.ts
export function calculatePenyerapan(
  inputs: PenyerapanInput[],
  weight: number = 20,
  isActive: boolean = true,
  cutoffMonth: number = 12,
  customQuarterTargets?: Record<number, { 51: number; 52: number; 53: number; 57: number }>
): IndicatorResult {
  const output = calculatePenyerapanAnggaran(inputs, weight, isActive, cutoffMonth, customQuarterTargets);
  return output?.result || {
    rawValue: 0,
    cappedValue: 0,
    weight: isActive ? weight : 0,
    weightedValue: 0,
    isActive,
    details: [],
    metadata: { periods: [], count: 0 }
  };
}

// ==================================================
// 29. GOLDEN TESTS (TEST 1 - TEST 16)
// ==================================================
export interface PenyerapanGoldenTestResult {
  id: string;
  description: string;
  expected: any;
  actual: any;
  passed: boolean;
}

export interface PenyerapanGoldenTestSummary {
  passed: boolean;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  results: PenyerapanGoldenTestResult[];
}

export function runPenyerapanGoldenTest(): PenyerapanGoldenTestSummary {
  const results: PenyerapanGoldenTestResult[] = [];

  // TEST 1: achievement 50% jika realisasi = 50% target.
  const t1 = calculateAchievement(50, 100);
  results.push({
    id: 'TEST 1',
    description: 'achievement 50% jika realisasi = 50% target',
    expected: 50,
    actual: t1,
    passed: Math.abs(t1 - 50) < 0.0001
  });

  // TEST 2: achievement maksimum 100 jika realisasi > target.
  const t2 = calculateAchievement(120, 100);
  results.push({
    id: 'TEST 2',
    description: 'achievement maksimum 100 jika realisasi > target (cap 100%)',
    expected: 100,
    actual: t2,
    passed: t2 === 100
  });

  // TEST 3: target = 0 => achievement 0.
  const t3 = calculateAchievement(100, 0);
  results.push({
    id: 'TEST 3',
    description: 'target = 0 => achievement 0 (tanpa NaN/Infinity)',
    expected: 0,
    actual: t3,
    passed: t3 === 0
  });

  // TEST 4: proporsi 51+52 = 100% jika total 51+52 > 0.
  const prop4 = calculateBudgetProportions(60000000, 40000000, 0, 0);
  const sum4 = round2(prop4.proporsi51 + prop4.proporsi52);
  results.push({
    id: 'TEST 4',
    description: 'proporsi 51+52 = 100% jika total 51+52 > 0',
    expected: 100,
    actual: sum4,
    passed: Math.abs(sum4 - 100) < 0.0001
  });

  // TEST 5: proporsi 51+52+53+57 = 100% jika seluruh pagu > 0.
  // Note: 51 & 52 are proportioned against (51+52), while 53 & 57 are proportioned against totalAll.
  // When testing whole budget scale: totalAll > 0
  const prop5 = calculateBudgetProportions(25000000, 25000000, 25000000, 25000000);
  const sum5357 = round2(prop5.proporsi53 + prop5.proporsi57);
  results.push({
    id: 'TEST 5',
    description: 'proporsi belanja 53+57 terhadap total pagu (25% + 25% = 50%)',
    expected: 50,
    actual: sum5357,
    passed: Math.abs(sum5357 - 50) < 0.0001
  });

  // TEST 6: NKPA = achievement * proportion / 100.
  const t6 = calculateNkpa(85, 40);
  results.push({
    id: 'TEST 6',
    description: 'NKPA = achievement × proportion / 100: 85 × 40 / 100 = 34',
    expected: 34,
    actual: t6,
    passed: t6 === 34
  });

  // TEST 7: P = SUM(NKPA 51:57).
  const t7 = calculatePeriodScore(37.30, 1.56, 0, 0);
  results.push({
    id: 'TEST 7',
    description: 'P = SUM(NKPA 51:57): 37.30 + 1.56 + 0 + 0 = 38.86',
    expected: 38.86,
    actual: t7,
    passed: Math.abs(t7 - 38.86) < 0.0001
  });

  // Base P series matching reference workbook
  const baseP = [38.86, 75.72, 100, 75.24, 91.05, 99.79, 90.08, 99.63, 99.94, 96.78, 100, 100];

  // TEST 8: Q periode 01 = P periode 01.
  const t8 = calculateIndicatorScore(baseP, 0);
  results.push({
    id: 'TEST 8',
    description: 'Q periode 01 = P periode 01: 38.86',
    expected: 38.86,
    actual: t8,
    passed: Math.abs(t8 - 38.86) < 0.0001
  });

  // TEST 9: Q periode 03 = P periode 03.
  const t9 = calculateIndicatorScore(baseP, 2);
  results.push({
    id: 'TEST 9',
    description: 'Q periode 03 = P periode 03: 100',
    expected: 100,
    actual: t9,
    passed: t9 === 100
  });

  // TEST 10: Q periode 04 = average(P03, P04).
  const t10 = calculateIndicatorScore(baseP, 3);
  results.push({
    id: 'TEST 10',
    description: 'Q periode 04 = average(P03, P04): round2((100 + 75.24) / 2) = 87.62',
    expected: 87.62,
    actual: t10,
    passed: Math.abs(t10 - 87.62) < 0.0001
  });

  // TEST 11: Q periode 06 = average(P03, P06).
  const t11 = calculateIndicatorScore(baseP, 5);
  results.push({
    id: 'TEST 11',
    description: 'Q periode 06 = average(P03, P06): round2((100 + 99.79) / 2) = 99.90',
    expected: 99.90,
    actual: t11,
    passed: Math.abs(t11 - 99.90) < 0.0001
  });

  // TEST 12: Q periode 07 = average(P03, P06, P07).
  const t12 = calculateIndicatorScore(baseP, 6);
  results.push({
    id: 'TEST 12',
    description: 'Q periode 07 = average(P03, P06, P07): round2((100 + 99.79 + 90.08) / 3) = 96.62',
    expected: 96.62,
    actual: t12,
    passed: Math.abs(t12 - 96.62) < 0.0001
  });

  // TEST 13: Q periode 09 = average(P03, P06, P09).
  const t13 = calculateIndicatorScore(baseP, 8);
  results.push({
    id: 'TEST 13',
    description: 'Q periode 09 = average(P03, P06, P09): round2((100 + 99.79 + 99.94) / 3) = 99.91',
    expected: 99.91,
    actual: t13,
    passed: Math.abs(t13 - 99.91) < 0.0001
  });

  // TEST 14: Q periode 10 = average(P03, P06, P09, P10).
  const t14 = calculateIndicatorScore(baseP, 9);
  results.push({
    id: 'TEST 14',
    description: 'Q periode 10 = average(P03, P06, P09, P10): round2((100 + 99.79 + 99.94 + 96.78) / 4) = 99.13',
    expected: 99.13,
    actual: t14,
    passed: Math.abs(t14 - 99.13) < 0.0001
  });

  // TEST 15: Q periode 12 = average(P03, P06, P09, P12).
  const t15 = calculateIndicatorScore(baseP, 11);
  results.push({
    id: 'TEST 15',
    description: 'Q periode 12 = average(P03, P06, P09, P12): round2((100 + 99.79 + 99.94 + 100) / 4) = 99.93',
    expected: 99.93,
    actual: t15,
    passed: Math.abs(t15 - 99.93) < 0.0001
  });

  // TEST 16: Final Interface = Q periode 12.
  const dummyInputs = baseP.map((p, idx) => ({
    periode: String(idx + 1).padStart(2, '0'),
    pagu51: 22318340000,
    pagu52: 964937000,
    pagu53: 0,
    pagu57: 0,
    blokir51: 0,
    blokir52: 0,
    blokir53: 0,
    blokir57: 0,
    realisasi51: 24090332203,
    realisasi52: 965222000,
    realisasi53: 0,
    realisasi57: 0
  }));
  const calcOutput = calculatePenyerapanAnggaran(dummyInputs);
  const q12 = calcOutput.periods[11].nilaiIndikator;
  const isFinalQ12 = calcOutput.result.rawValue === q12;
  results.push({
    id: 'TEST 16',
    description: 'Final Interface = Q periode 12 (Q71)',
    expected: q12,
    actual: calcOutput.result.rawValue,
    passed: isFinalQ12
  });

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    passed: failedCount === 0,
    totalTests: results.length,
    passedCount,
    failedCount,
    results
  };
}
