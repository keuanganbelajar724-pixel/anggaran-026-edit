import { UPTUPKKPInput } from '../models/ikpa';
import { round2, excelAverage } from './rounding';

export const KKP_TARGET_PERCENT: Record<number, number> = {
  1: 0.01,
  2: 0.01,
  3: 0.01,
  4: 0.05,
  5: 0.05,
  6: 0.05,
  7: 0.09,
  8: 0.09,
  9: 0.09,
  10: 0.125,
  11: 0.125,
  12: 0.125
};

export interface ProcessedKKPMonthRow {
  periode: string; // "01" .. "12"
  kodeSatker: string;
  namaSatker: string;
  kodeKPPN: string;
  upKKPPerBulan: number; // Kolom E
  upKKP1Tahun: number; // Kolom F: E * 12
  targetPersen: number; // 1%, 5%, 9%, 12.5%
  targetPenggunaanKKP: number; // Kolom G: F * targetPersen
  penggunaanKKP: number; // Kolom H (Input realisasi)
  nilaiBulanan: number; // Kolom I: IF(H=0, 0, IF(H>=G, 110, 100))
  nilaiUPKKP: number; // Kolom J: formula period kumulatif (J5..J16)
  isAchieved: boolean;
}

export interface UPTUPKKPResult {
  rawValue: number; // Nilai final UP KKP (J16) - Boleh melebihi 100 (misal 105.00 atau 110.00)
  processedMonths: ProcessedKKPMonthRow[];
  totalPenggunaan: number;
}

/**
 * Formula Excel Nilai Bulanan KKP (Kolom I):
 * =IF(H=0, 0, IF(H>=G, 110, 100))
 * Catatan: Nilai bisa 110 (Reward capai target). Jangan dipotong 100 di sini.
 */
export function calculateKKPMonthlyScore(penggunaan: number, target: number): number {
  if (penggunaan === 0) {
    return 0;
  }
  if (penggunaan >= target) {
    return 110;
  }
  return 100;
}

/**
 * Formula Excel Nilai UP KKP per Periode (Kolom J5:J16):
 * J5 = ROUND(I5, 2)
 * J6 = ROUND(I6, 2)
 * J7 = ROUND(I7, 2)
 * J8..J10 = ROUND(AVERAGE($I$7, I_n), 2)
 * J11..J13 = ROUND(AVERAGE($I$7, $I$10, I_n), 2)
 * J14..J16 = ROUND(AVERAGE($I$7, $I$10, $I$13, I_n), 2)
 */
export function calculateKKPPeriodScore(
  period: number,
  monthlyScores: number[]
): number {
  const i7 = monthlyScores[2] ?? 0;
  const i10 = monthlyScores[5] ?? 0;
  const i13 = monthlyScores[8] ?? 0;

  switch (period) {
    case 1:
      return round2(monthlyScores[0] ?? 0);
    case 2:
      return round2(monthlyScores[1] ?? 0);
    case 3:
      return round2(monthlyScores[2] ?? 0);
    case 4:
    case 5:
    case 6:
      return round2(
        excelAverage([
          i7,
          monthlyScores[period - 1] ?? 0
        ])
      );
    case 7:
    case 8:
    case 9:
      return round2(
        excelAverage([
          i7,
          i10,
          monthlyScores[period - 1] ?? 0
        ])
      );
    case 10:
    case 11:
    case 12:
      return round2(
        excelAverage([
          i7,
          i10,
          i13,
          monthlyScores[period - 1] ?? 0
        ])
      );
    default:
      return 0;
  }
}

/**
 * Mesin Perhitungan Pengelolaan UP KKP 12 Bulan (PER-5/PB/2024 & Excel Workbook Compatible)
 */
export function calculateUPKKP(
  inputs: UPTUPKKPInput[],
  cutoffMonth: number = 12
): UPTUPKKPResult {
  if (!inputs || inputs.length === 0) {
    return {
      rawValue: 0,
      processedMonths: [],
      totalPenggunaan: 0
    };
  }

  // Ensure 12 periods array
  const periodMap = new Map<string, UPTUPKKPInput>();
  inputs.forEach(item => {
    const key = String(item.periode).padStart(2, '0');
    periodMap.set(key, item);
  });

  const baseInput = inputs[0];
  const defaultUpBulan = baseInput?.upKKPPerBulan || 0;

  const monthlyScores: number[] = [];
  const processedTemp: Omit<ProcessedKKPMonthRow, 'nilaiUPKKP'>[] = [];
  let totalPenggunaan = 0;

  for (let m = 1; m <= 12; m++) {
    const periodKey = String(m).padStart(2, '0');
    const rowInput = periodMap.get(periodKey);

    const upKKPPerBulan = rowInput ? Number(rowInput.upKKPPerBulan ?? defaultUpBulan) : defaultUpBulan;
    const upKKP1Tahun = upKKPPerBulan * 12; // F = E * 12
    const targetPersen = KKP_TARGET_PERCENT[m] || 0.125;
    const targetPenggunaanKKP = upKKP1Tahun * targetPersen; // G = F * target %
    const penggunaanKKP = rowInput ? Number(rowInput.penggunaanKKP ?? 0) : 0;

    totalPenggunaan += penggunaanKKP;

    const nilaiBulanan = calculateKKPMonthlyScore(penggunaanKKP, targetPenggunaanKKP);
    monthlyScores.push(nilaiBulanan);

    processedTemp.push({
      periode: periodKey,
      kodeSatker: rowInput?.kodeSatker || baseInput?.kodeSatker || '',
      namaSatker: rowInput?.namaSatker || baseInput?.namaSatker || '',
      kodeKPPN: rowInput?.kodeKPPN || baseInput?.kodeKPPN || '',
      upKKPPerBulan,
      upKKP1Tahun,
      targetPersen,
      targetPenggunaanKKP,
      penggunaanKKP,
      nilaiBulanan,
      isAchieved: penggunaanKKP > 0 && penggunaanKKP >= targetPenggunaanKKP
    });
  }

  // Calculate cumulative scores (J5..J16)
  const processedMonths: ProcessedKKPMonthRow[] = processedTemp.map((row, idx) => {
    const periodNumber = idx + 1;
    const nilaiUPKKP = calculateKKPPeriodScore(periodNumber, monthlyScores);
    return {
      ...row,
      nilaiUPKKP
    };
  });

  // Nilai final KKP = periode cutoffMonth (default J16 / Periode 12)
  const targetIdx = Math.min(processedMonths.length - 1, Math.max(0, (cutoffMonth || 12) - 1));
  const targetMonth = processedMonths[targetIdx] || processedMonths[processedMonths.length - 1];
  const rawValue = targetMonth ? targetMonth.nilaiUPKKP : 0;

  return {
    rawValue,
    processedMonths,
    totalPenggunaan
  };
}

// Alias for compatibility
export const calculateUPTUPKKP = calculateUPKKP;
