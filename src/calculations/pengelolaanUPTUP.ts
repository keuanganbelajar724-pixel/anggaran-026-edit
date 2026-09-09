import { UPTUPTunaiInput, UPTUPKKPInput, IndicatorResult, CalculationDetail } from '../models/ikpa';
import { calculateUPTUPTunai, UPTUPTunaiResult } from './upTupTunai';
import { calculateUPKKP, UPTUPKKPResult } from './upTupKKP';
import { round2 } from './rounding';
import { DEFAULT_EXCEL_UP_TUNAI_ROWS, DEFAULT_EXCEL_UP_KKP_ROWS } from '../utils/excelReferenceDefaultData';

/**
 * Formula Excel Nilai Gabungan Mentah (Sel N7):
 * =IF(N6=0, (90%*N5/90%), (N5*90%)+(10%*N6))
 */
export function calculateUPTUPCombinedRaw(
  nilaiUPTunai: number,
  nilaiUPKKP: number
): number {
  if (nilaiUPKKP === 0) {
    return (0.90 * nilaiUPTunai) / 0.90;
  }
  return (nilaiUPTunai * 0.90) + (nilaiUPKKP * 0.10);
}

/**
 * Formula Excel Nilai Gabungan Final Capped 100 (Sel N8):
 * =ROUND(IF(N7>100, 100, N7), 2)
 */
export function calculateUPTUPCombinedFinal(
  nilaiUPTunai: number,
  nilaiUPKKP: number
): number {
  const raw = calculateUPTUPCombinedRaw(nilaiUPTunai, nilaiUPKKP);
  return round2(Math.min(raw, 100));
}

// Alias for unified compatibility
export const calculateUPTUPCombined = calculateUPTUPCombinedFinal;

/**
 * Pengelolaan UP dan TUP (Indikator 6 IKPA - PER-5/PB/2024)
 * Menghubungkan Nilai UP/TUP Tunai (90%) dan UP KKP (10%) ke dalam format standar IndicatorResult.
 */
export function calculatePengelolaanUPTUP(
  tunaiInputs: UPTUPTunaiInput[],
  kkpInputs: UPTUPKKPInput[],
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
        formulaHuman: 'Bobot = 0%',
        value: 0
      }]
    };
  }

  const tunaiResult: UPTUPTunaiResult = calculateUPTUPTunai(tunaiInputs);
  const kkpResult: UPTUPKKPResult = calculateUPKKP(kkpInputs);

  const valTunai = tunaiResult.rawValue; // Q28 (raw unrounded)
  const valKKP = kkpResult.rawValue; // J16
  const isKkpZero = valKKP === 0;

  // N7: Mentah gabungan
  const rawCombined = calculateUPTUPCombinedRaw(valTunai, valKKP);
  // N8: Final capped 100
  const cappedValue = calculateUPTUPCombinedFinal(valTunai, valKKP);
  // L8: Nilai Berbobot IKPA
  const weightedValue = round2((cappedValue * weight) / 100);

  details.push({
    step: 'Nilai UP/TUP Tunai (Q28)',
    formulaHuman: `(50% × Ketepatan ${tunaiResult.nilaiKetepatanWaktu.toFixed(2)}) + (25% × GUP ${tunaiResult.nilaiGupDisebulankan.toFixed(2)}) + (25% × TUP ${tunaiResult.nilaiSetoranTup.toFixed(2)}) = ${round2(valTunai).toFixed(2)}`,
    formulaTechnical: '(50%*Q27) + (25%*R27) + (25%*S27)',
    value: round2(valTunai)
  });

  details.push({
    step: 'Nilai UP KKP Kumulatif Akhir (J16)',
    formulaHuman: isKkpZero
      ? 'Nilai KKP = 0,00 (Bobot dialihkan 100% ke UP Tunai)'
      : `Nilai KKP Periode 12 (J16) = ${valKKP.toFixed(2)}`,
    formulaTechnical: isKkpZero ? 'UP KKP = 0' : 'AVERAGE($I$7,$I$10,$I$13,I16)',
    value: valKKP
  });

  details.push({
    step: 'Nilai Gabungan UP & TUP Mentah (N7)',
    formulaHuman: isKkpZero
      ? `(90% × ${round2(valTunai).toFixed(2)}) / 90% = ${round2(rawCombined).toFixed(2)}`
      : `(${round2(valTunai).toFixed(2)} × 90%) + (${valKKP.toFixed(2)} × 10%) = ${round2(rawCombined).toFixed(2)}`,
    formulaTechnical: isKkpZero ? '(90% * N5) / 90%' : '(N5 * 90%) + (10% * N6)',
    value: round2(rawCombined)
  });

  details.push({
    step: 'Nilai Akhir Indikator Capped 100 (N8)',
    formulaHuman: `ROUND(IF(${round2(rawCombined).toFixed(2)} > 100, 100, ${round2(rawCombined).toFixed(2)}), 2) = ${cappedValue.toFixed(2)}`,
    formulaTechnical: 'ROUND(IF(N7>100, 100, N7), 2)',
    value: cappedValue
  });

  details.push({
    step: 'Nilai Berbobot IKPA (L8)',
    formulaHuman: `ROUND(${cappedValue.toFixed(2)} × ${weight}% / 100, 2) = ${weightedValue.toFixed(2)}`,
    formulaTechnical: `ROUND(${cappedValue} * ${weight} / 100, 2)`,
    value: weightedValue
  });

  return {
    rawValue: round2(rawCombined),
    cappedValue,
    weight,
    weightedValue,
    isActive,
    details,
    metadata: {
      tunaiResult,
      kkpResult,
      isKkpZero,
      valTunaiRaw: valTunai,
      valKKPRaw: valKKP
    }
  };
}

export interface CompatibilityTestItem {
  field: string;
  label: string;
  expected: number | string;
  actual: number | string;
  difference?: number;
  pass: boolean;
}

/**
 * Regression Test Kesesuaian Formula dengan Excel Workbook (PER-5/PB/2024 & Kalkulator Perhitungan IKPA 2026.xlsx)
 * Memverifikasi sel-sel kritis: H23, H25, H26, Q27, R27, S27, Q28, J5..J16, N7, N8.
 */
export function validateUPTUPAgainstExcel(): {
  items: CompatibilityTestItem[];
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
} {
  const tolerance = 0.01;

  // Convert default workbook data
  const tunaiInputs: UPTUPTunaiInput[] = DEFAULT_EXCEL_UP_TUNAI_ROWS.map((u: any) => ({
    no: u.id,
    kodeSatker: u.kodeSatker || '',
    namaSatker: u.namaSatker || '',
    sumberDana: u.sumberDana || 'RM',
    jenis: u.jenis,
    tanggal: u.tanggal,
    selisihHariKalender: u.selisihHariKalender,
    totalGUP: u.totalGu,
    totalOutstandingUP: u.totalOutstandingUp,
    totalHariSebulan: u.totalHariSebulan,
    totalTUP: u.totalTup,
    totalSetoranTUP: u.totalSetoranTup,
    status: u.status
  }));

  const kkpInputs: UPTUPKKPInput[] = DEFAULT_EXCEL_UP_KKP_ROWS.map((kp: any) => ({
    periode: kp.periode,
    upKKPPerBulan: kp.upKkpPerBulan,
    penggunaanKKP: kp.penggunaanKkp
  }));

  const tunaiRes = calculateUPTUPTunai(tunaiInputs);
  const kkpRes = calculateUPKKP(kkpInputs);
  const indRes = calculatePengelolaanUPTUP(tunaiInputs, kkpInputs, 10, true);

  // Row 23 (index 18), Row 25 (index 20), Row 26 (index 21)
  const row23 = tunaiRes.processedRows[18];
  const row25 = tunaiRes.processedRows[20];
  const row26 = tunaiRes.processedRows[21];

  const jScores = kkpRes.processedMonths.map(m => m.nilaiUPKKP);

  const tests: Array<{ field: string; label: string; expected: number; actual: number }> = [
    // UP Tunai Critical Cells
    { field: 'H23', label: 'Selisih Hari GUP setelah TUP (H23 = G23-G21)', expected: 3, actual: row23?.selisihHariKalender ?? 0 },
    { field: 'H25', label: 'Selisih Hari SETORAN TUP dari TUP (H25 = G25-G22)', expected: 22, actual: row25?.selisihHariKalender ?? 0 },
    { field: 'H26', label: 'Selisih Hari GTUP NIHIL dari TUP (H26 = G26-G22)', expected: 22, actual: row26?.selisihHariKalender ?? 0 },
    { field: 'Q27', label: 'Rata-rata Ketepatan Waktu (Q27)', expected: 89.47, actual: tunaiRes.nilaiKetepatanWaktu },
    { field: 'R27', label: 'Rata-rata GUP Disebulankan (R27)', expected: 92.89, actual: tunaiRes.nilaiGupDisebulankan },
    { field: 'S27', label: 'Rata-rata Setoran TUP (S27)', expected: 99.09, actual: tunaiRes.nilaiSetoranTup },
    { field: 'Q28', label: 'Nilai UP/TUP Tunai Raw (Q28)', expected: 92.73, actual: round2(tunaiRes.rawValue) },

    // KKP J5:J16
    { field: 'J5', label: 'Nilai KKP Kumulatif Periode 01 (J5)', expected: 0, actual: jScores[0] ?? 0 },
    { field: 'J6', label: 'Nilai KKP Kumulatif Periode 02 (J6)', expected: 100, actual: jScores[1] ?? 0 },
    { field: 'J7', label: 'Nilai KKP Kumulatif Periode 03 (J7)', expected: 110, actual: jScores[2] ?? 0 },
    { field: 'J8', label: 'Nilai KKP Kumulatif Periode 04 (J8)', expected: 105, actual: jScores[3] ?? 0 },
    { field: 'J9', label: 'Nilai KKP Kumulatif Periode 05 (J9)', expected: 110, actual: jScores[4] ?? 0 },
    { field: 'J10', label: 'Nilai KKP Kumulatif Periode 06 (J10)', expected: 110, actual: jScores[5] ?? 0 },
    { field: 'J11', label: 'Nilai KKP Kumulatif Periode 07 (J11)', expected: 106.67, actual: jScores[6] ?? 0 },
    { field: 'J12', label: 'Nilai KKP Kumulatif Periode 08 (J12)', expected: 106.67, actual: jScores[7] ?? 0 },
    { field: 'J13', label: 'Nilai KKP Kumulatif Periode 09 (J13)', expected: 110, actual: jScores[8] ?? 0 },
    { field: 'J14', label: 'Nilai KKP Kumulatif Periode 10 (J14)', expected: 107.50, actual: jScores[9] ?? 0 },
    { field: 'J15', label: 'Nilai KKP Kumulatif Periode 11 (J15)', expected: 107.50, actual: jScores[10] ?? 0 },
    { field: 'J16', label: 'Nilai KKP Kumulatif Periode 12 (J16)', expected: 107.50, actual: jScores[11] ?? 0 },

    // Gabungan N7 & N8
    { field: 'N7', label: 'Nilai Gabungan Mentah UP & KKP (N7)', expected: 94.21, actual: round2(calculateUPTUPCombinedRaw(tunaiRes.rawValue, kkpRes.rawValue)) },
    { field: 'N8', label: 'Nilai Gabungan Final Capped 100 (N8)', expected: 94.21, actual: indRes.cappedValue }
  ];

  const items: CompatibilityTestItem[] = tests.map(t => {
    const diff = Math.abs(t.expected - t.actual);
    const pass = diff <= tolerance;
    return {
      field: t.field,
      label: t.label,
      expected: t.expected,
      actual: t.actual,
      difference: round2(diff),
      pass
    };
  });

  const passedCount = items.filter(i => i.pass).length;
  const allPassed = passedCount === items.length;

  return {
    items,
    allPassed,
    passedCount,
    totalCount: items.length
  };
}
