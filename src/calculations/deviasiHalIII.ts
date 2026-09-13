import { DeviasiHalIIIInput, DeviasiHal3Row, IndicatorResult, CalculationDetail } from '../models/ikpa';

/**
 * Fungsi pembulatan 2 desimal standar IKPA 2026.
 * Sesuai aturan: Math.round((value + Number.EPSILON) * 100) / 100.
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Rata-rata array angka numerik.
 */
export function average(numbers: number[]): number {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return sum / numbers.length;
}

/**
 * Pembagian aman menghindari NaN dan Infinity.
 */
export function safeDiv(num: number, den: number, fallback: number = 0): number {
  if (den === 0 || isNaN(den) || !isFinite(den)) return fallback;
  const res = num / den;
  return isNaN(res) || !isFinite(res) ? fallback : res;
}

/**
 * 5. KOLOM J:M — DEVIASI NOMINAL
 * Deviasi selalu menggunakan nilai absolut:
 * J = ABS(F-B), K = ABS(G-C), L = ABS(H-D), M = ABS(I-E)
 */
export function calculateNominalDeviation(plan: number, realization: number): number {
  const p = Number(plan) || 0;
  const r = Number(realization) || 0;
  return Math.abs(r - p);
}

/**
 * 6. KOLOM N:Q — % DEVIASI
 * Formula Excel:
 * =IF(B5>0, MIN(ROUND(ABS(F5-B5)/B5*100,2),100), IF(AND(B5=0,F5=0), 0, IF(AND(B5=0,F5>0), 100, 0)))
 */
export function calculateDeviationPercent(plan: number, realization: number): number {
  const p = Number(plan) || 0;
  const r = Number(realization) || 0;

  if (p > 0) {
    return Math.min(
      round2((Math.abs(r - p) / p) * 100),
      100
    );
  }

  if (p === 0 && r === 0) {
    return 0;
  }

  if (p === 0 && r > 0) {
    return 100;
  }

  return 0;
}

// Alias for backwards compatibility
export const deviationPercent = calculateDeviationPercent;

/**
 * 7. KOLOM R:U — % PROPORSI PAGU
 * Menggunakan konsep:
 * 51 dan 52: proporsi terhadap total 51 + 52 (R = p51 / (p51+p52), S = p52 / (p51+p52))
 * 53 dan 57: proporsi terhadap total 51 + 52 + 53 + 57 (T = p53 / total, U = p57 / total)
 */
export function calculateBudgetProportion(
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
  if (totalAll > 0) {
    return {
      proporsi51: round2((p51 / totalAll) * 100),
      proporsi52: round2((p52 / totalAll) * 100),
      proporsi53: round2((p53 / totalAll) * 100),
      proporsi57: round2((p57 / totalAll) * 100)
    };
  }

  return { proporsi51: 0, proporsi52: 0, proporsi53: 0, proporsi57: 0 };
}

/**
 * 8. KOLOM V:Y — % DEVIASI TERTIMBANG & 9. PENGECUALIAN KHUSUS MARET
 * V = ROUND(N * R / 100, 2)
 * Khusus Maret (periode 03): V7 = 0 dan W7 = 0 per S-119/PB.2/2024
 */
export function calculateWeightedDeviation(
  percentDev: number,
  proporsi: number,
  isMaret51or52: boolean = false
): number {
  if (isMaret51or52) {
    return 0;
  }
  const pct = Number(percentDev) || 0;
  const prop = Number(proporsi) || 0;
  return round2((pct * prop) / 100);
}

/**
 * 10. KOLOM Z — % DEVIASI SELURUH J.BEL
 * Formula: Z5 = SUM(V5:Y5)
 */
export function calculateTotalDeviation(
  w51: number,
  w52: number,
  w53: number,
  w57: number
): number {
  return round2(
    (Number(w51) || 0) +
    (Number(w52) || 0) +
    (Number(w53) || 0) +
    (Number(w57) || 0)
  );
}

/**
 * 11. KOLOM AA — % RATA-RATA DEVIASI KUMULATIF & 13. PERLAKUAN DESEMBER
 * AA5 = ROUND(Z5, 2)
 * AA6 = ROUND(AVERAGE(Z5:Z6), 2)
 * ...
 * AA15 = ROUND(AVERAGE(Z5:Z15), 2)
 * AA16 = AA15 (Perlakuan Desember sama dengan November)
 */
export function calculateCumulativeDeviation(
  totalDeviations: number[],
  index: number
): number {
  if (index === 0) {
    return round2(totalDeviations[0] || 0);
  }
  // Periode 12 (index 11): Data dan nilai Desember sama dengan November (AA16 = AA15)
  if (index === 11) {
    return calculateCumulativeDeviation(totalDeviations, 10);
  }
  const slice = totalDeviations.slice(0, index + 1);
  const sum = slice.reduce((a, b) => a + b, 0);
  return round2(sum / slice.length);
}

/**
 * 12. KOLOM AB — NILAI IKPA
 * Formula Excel: =IF(AA5<=5, 100, (100-AA5))
 * Tidak ada ROUND tambahan pada formula AB.
 */
export function calculateIkpa(cumulativeDeviation: number): number {
  const cd = Number(cumulativeDeviation) || 0;
  if (cd <= 5) {
    return 100;
  }
  return 100 - cd;
}

/**
 * Nilai default proporsi dari workbook referensi jika tidak ada pagu spesifik:
 * 51: 38.09%, 52: 51.59%, 53: 9.34%, 57: 0%
 */
export const DEFAULT_WORKBOOK_PROPORTIONS = {
  51: 38.09,
  52: 51.59,
  53: 9.34,
  57: 0
};

export function hasActualDeviasiHal3Data(inputs?: (DeviasiHalIIIInput | DeviasiHal3Row)[]): boolean {
  if (!inputs || inputs.length === 0) return false;
  return inputs.some(r => {
    if (!r) return false;
    const r51 = Number(r.rencana51) || 0;
    const r52 = Number(r.rencana52) || 0;
    const r53 = Number(r.rencana53) || 0;
    const r57 = Number(r.rencana57) || 0;
    const y51 = Number(r.penyerapan51 ?? (r as any).realisasi51) || 0;
    const y52 = Number(r.penyerapan52 ?? (r as any).realisasi52) || 0;
    const y53 = Number(r.penyerapan53 ?? (r as any).realisasi53) || 0;
    const y57 = Number(r.penyerapan57 ?? (r as any).realisasi57) || 0;
    return (r51 + r52 + r53 + r57 + y51 + y52 + y53 + y57) > 0;
  });
}

/**
 * Menghitung keseluruhan baris 12 periode Deviasi Halaman III DIPA.
 * Menghasilkan DeviasiHal3Row[] lengkap (A s.d. AB) dan IndicatorResult.
 */
export function calculateDeviasiHal3(
  inputs: (DeviasiHalIIIInput | DeviasiHal3Row)[],
  weight: number = 15,
  isActive: boolean = true,
  cutoffMonth: number = 12
): {
  rows: DeviasiHal3Row[];
  result: IndicatorResult;
} {
  const details: CalculationDetail[] = [];

  // Dapatkan periode yang diinputkan oleh Satker
  const rawInputPeriods = (inputs || [])
    .map(inp => (inp?.periode || '').trim())
    .filter(p => p.length > 0)
    .map(p => (p.length === 1 ? `0${p}` : p));

  // Ambil periode unik yang diinputkan secara berurutan
  const uniquePeriods = Array.from(new Set(rawInputPeriods)).sort();

  // Jika belum ada data baris yang diinputkan (0 baris) ATAU belum ada data riil rencana & penyerapan (seluruh nominal 0)
  if (!inputs || inputs.length === 0 || uniquePeriods.length === 0 || !hasActualDeviasiHal3Data(inputs)) {
    const emptyRows: DeviasiHal3Row[] = (inputs || []).map(inp => ({
      periode: inp?.periode || '01',
      pagu51: Number(inp?.pagu51) || 0,
      pagu52: Number(inp?.pagu52) || 0,
      pagu53: Number(inp?.pagu53) || 0,
      pagu57: Number(inp?.pagu57) || 0,
      rencana51: Number(inp?.rencana51) || 0,
      rencana52: Number(inp?.rencana52) || 0,
      rencana53: Number(inp?.rencana53) || 0,
      rencana57: Number(inp?.rencana57) || 0,
      penyerapan51: Number(inp?.penyerapan51 ?? (inp as any)?.realisasi51) || 0,
      penyerapan52: Number(inp?.penyerapan52 ?? (inp as any)?.realisasi52) || 0,
      penyerapan53: Number(inp?.penyerapan53 ?? (inp as any)?.realisasi53) || 0,
      penyerapan57: Number(inp?.penyerapan57 ?? (inp as any)?.realisasi57) || 0,
      deviasi51: 0,
      deviasi52: 0,
      deviasi53: 0,
      deviasi57: 0,
      persenDeviasi51: 0,
      persenDeviasi52: 0,
      persenDeviasi53: 0,
      persenDeviasi57: 0,
      proporsi51: inp?.proporsi51 ?? DEFAULT_WORKBOOK_PROPORTIONS[51],
      proporsi52: inp?.proporsi52 ?? DEFAULT_WORKBOOK_PROPORTIONS[52],
      proporsi53: inp?.proporsi53 ?? DEFAULT_WORKBOOK_PROPORTIONS[53],
      proporsi57: inp?.proporsi57 ?? DEFAULT_WORKBOOK_PROPORTIONS[57],
      deviasiTertimbang51: 0,
      deviasiTertimbang52: 0,
      deviasiTertimbang53: 0,
      deviasiTertimbang57: 0,
      deviasiSeluruhJenisBelanja: 0,
      rataRataDeviasiKumulatif: 0,
      nilaiIKPA: 0
    }));

    return {
      rows: emptyRows,
      result: {
        rawValue: 0,
        cappedValue: 0,
        weight: isActive ? weight : 0,
        weightedValue: 0,
        isActive,
        details: [{
          step: 'Data RPD Halaman III Kosong / Belum Diisi',
          formulaHuman: 'Belum ada data rencana (RPD) atau realisasi penyerapan yang diinputkan (Nilai = 0)',
          formulaTechnical: '0',
          value: 0,
          note: 'Satker dapat mengisi rencana penarikan dana dan penyerapan untuk memulai perhitungan'
        }],
        metadata: {
          rows: emptyRows,
          months: emptyRows.map(r => ({
            periode: r.periode,
            rencana: { 51: 0, 52: 0, 53: 0, 57: 0 },
            penyerapan: { 51: 0, 52: 0, 53: 0, 57: 0 },
            proporsi: { 51: r.proporsi51, 52: r.proporsi52, 53: r.proporsi53, 57: r.proporsi57 },
            devPct: { 51: 0, 52: 0, 53: 0, 57: 0 },
            devTertimbang: { 51: 0, 52: 0, 53: 0, 57: 0 },
            totalDeviasiBulan: 0,
            rataRataKumulatif: 0,
            nilaiIkpaBulan: 0
          })),
          finalCumulativeDeviation: 0
        }
      }
    };
  }

  const periods = uniquePeriods;

  const inputMap = new Map<string, DeviasiHalIIIInput | DeviasiHal3Row>();
  (inputs || []).forEach(inp => {
    if (inp && inp.periode) {
      const clean = inp.periode.trim();
      const padded = clean.length === 1 ? `0${clean}` : clean;
      inputMap.set(padded, inp);
    }
  });

  // Step 1: Pre-process baris untuk menangani replikasi Desember (Periode 12 = Periode 11) jika diperlukan
  const rawRows = periods.map((periode, idx) => {
    const existing = inputMap.get(periode);

    // Default nilai
    let r51 = Number(existing?.rencana51) || 0;
    let r52 = Number(existing?.rencana52) || 0;
    let r53 = Number(existing?.rencana53) || 0;
    let r57 = Number(existing?.rencana57) || 0;

    let y51 = Number(existing?.penyerapan51 ?? (existing as any)?.realisasi51) || 0;
    let y52 = Number(existing?.penyerapan52 ?? (existing as any)?.realisasi52) || 0;
    let y53 = Number(existing?.penyerapan53 ?? (existing as any)?.realisasi53) || 0;
    let y57 = Number(existing?.penyerapan57 ?? (existing as any)?.realisasi57) || 0;

    // Nominal Pagu
    let pagu51 = Number(existing?.pagu51) || 0;
    let pagu52 = Number(existing?.pagu52) || 0;
    let pagu53 = Number(existing?.pagu53) || 0;
    let pagu57 = Number(existing?.pagu57) || 0;
    const totalPagu = pagu51 + pagu52 + pagu53 + pagu57;

    // Proporsi: prioritas 1 dari input proporsi, prioritas 2 dari nominal pagu, prioritas 3 default workbook
    let p51 = existing?.proporsi51 ?? existing?.proporsiPagu51;
    let p52 = existing?.proporsi52 ?? existing?.proporsiPagu52;
    let p53 = existing?.proporsi53 ?? existing?.proporsiPagu53;
    let p57 = existing?.proporsi57 ?? existing?.proporsiPagu57;

    if ((p51 === undefined || p51 === null) && totalPagu > 0) {
      const calcProp = calculateBudgetProportion(pagu51, pagu52, pagu53, pagu57);
      p51 = calcProp.proporsi51;
      p52 = calcProp.proporsi52;
      p53 = calcProp.proporsi53;
      p57 = calcProp.proporsi57;
    } else {
      p51 = p51 !== undefined && p51 !== null ? Number(p51) : DEFAULT_WORKBOOK_PROPORTIONS[51];
      p52 = p52 !== undefined && p52 !== null ? Number(p52) : DEFAULT_WORKBOOK_PROPORTIONS[52];
      p53 = p53 !== undefined && p53 !== null ? Number(p53) : DEFAULT_WORKBOOK_PROPORTIONS[53];
      p57 = p57 !== undefined && p57 !== null ? Number(p57) : DEFAULT_WORKBOOK_PROPORTIONS[57];
    }

    return {
      periode,
      pagu51,
      pagu52,
      pagu53,
      pagu57,
      rencana51: r51,
      rencana52: r52,
      rencana53: r53,
      rencana57: r57,
      penyerapan51: y51,
      penyerapan52: y52,
      penyerapan53: y53,
      penyerapan57: y57,
      proporsi51: p51,
      proporsi52: p52,
      proporsi53: p53,
      proporsi57: p57
    };
  });

  // Periode 12 (Desember): Sesuai workbook, rencana dan penyerapan periode 12 menggunakan data periode 11 (November)
  // B16 = B15, C16 = C15, D16 = D15, E16 = E15
  // F16 = F15, G16 = G15, H16 = H15, I16 = I15
  if (rawRows[10] && rawRows[11]) {
    const nov = rawRows[10];
    const dec = rawRows[11];
    // Jika data Desember kosong atau sama, kita pastikan data November disalin
    const decHasCustomData = (inputs || []).some(inp => (inp.periode === '12' || inp.periode === '12') && (inp.rencana51 > 0 || inp.penyerapan51 > 0));
    if (!decHasCustomData) {
      dec.rencana51 = nov.rencana51;
      dec.rencana52 = nov.rencana52;
      dec.rencana53 = nov.rencana53;
      dec.rencana57 = nov.rencana57;
      dec.penyerapan51 = nov.penyerapan51;
      dec.penyerapan52 = nov.penyerapan52;
      dec.penyerapan53 = nov.penyerapan53;
      dec.penyerapan57 = nov.penyerapan57;
      dec.proporsi51 = nov.proporsi51;
      dec.proporsi52 = nov.proporsi52;
      dec.proporsi53 = nov.proporsi53;
      dec.proporsi57 = nov.proporsi57;
    }
  }

  // Step 2: Hitung Kolom J s.d. Z untuk setiap baris
  const intermediateRows: Array<{
    periode: string;
    rencana51: number;
    rencana52: number;
    rencana53: number;
    rencana57: number;
    penyerapan51: number;
    penyerapan52: number;
    penyerapan53: number;
    penyerapan57: number;
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
    deviasiSeluruhJenisBelanja: number;
  }> = [];

  const totalDeviationsList: number[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const r = rawRows[i];
    const isMaret = r.periode === '03';

    // J:M = Deviasi Nominal = ABS(Penyerapan - Rencana)
    const deviasi51 = calculateNominalDeviation(r.rencana51, r.penyerapan51);
    const deviasi52 = calculateNominalDeviation(r.rencana52, r.penyerapan52);
    const deviasi53 = calculateNominalDeviation(r.rencana53, r.penyerapan53);
    const deviasi57 = calculateNominalDeviation(r.rencana57, r.penyerapan57);

    // N:Q = % Deviasi
    const persenDeviasi51 = calculateDeviationPercent(r.rencana51, r.penyerapan51);
    const persenDeviasi52 = calculateDeviationPercent(r.rencana52, r.penyerapan52);
    const persenDeviasi53 = calculateDeviationPercent(r.rencana53, r.penyerapan53);
    const persenDeviasi57 = calculateDeviationPercent(r.rencana57, r.penyerapan57);

    // V:Y = % Deviasi Tertimbang
    // Maret: V7 = 0 dan W7 = 0
    const deviasiTertimbang51 = calculateWeightedDeviation(persenDeviasi51, r.proporsi51, isMaret);
    const deviasiTertimbang52 = calculateWeightedDeviation(persenDeviasi52, r.proporsi52, isMaret);
    const deviasiTertimbang53 = calculateWeightedDeviation(persenDeviasi53, r.proporsi53, false);
    const deviasiTertimbang57 = calculateWeightedDeviation(persenDeviasi57, r.proporsi57, false);

    // Z = % Deviasi Seluruh J.Bel = SUM(V:Y)
    const deviasiSeluruhJenisBelanja = calculateTotalDeviation(
      deviasiTertimbang51,
      deviasiTertimbang52,
      deviasiTertimbang53,
      deviasiTertimbang57
    );

    totalDeviationsList.push(deviasiSeluruhJenisBelanja);

    intermediateRows.push({
      periode: r.periode,
      pagu51: r.pagu51,
      pagu52: r.pagu52,
      pagu53: r.pagu53,
      pagu57: r.pagu57,
      rencana51: r.rencana51,
      rencana52: r.rencana52,
      rencana53: r.rencana53,
      rencana57: r.rencana57,
      penyerapan51: r.penyerapan51,
      penyerapan52: r.penyerapan52,
      penyerapan53: r.penyerapan53,
      penyerapan57: r.penyerapan57,
      deviasi51,
      deviasi52,
      deviasi53,
      deviasi57,
      persenDeviasi51,
      persenDeviasi52,
      persenDeviasi53,
      persenDeviasi57,
      proporsi51: r.proporsi51,
      proporsi52: r.proporsi52,
      proporsi53: r.proporsi53,
      proporsi57: r.proporsi57,
      deviasiTertimbang51,
      deviasiTertimbang52,
      deviasiTertimbang53,
      deviasiTertimbang57,
      deviasiSeluruhJenisBelanja
    });
  }

  // Step 3: Hitung Kolom AA (% Rata-Rata Deviasi Kumulatif) dan AB (Nilai IKPA)
  const finalRows: DeviasiHal3Row[] = intermediateRows.map((row, idx) => {
    const rataRataDeviasiKumulatif = calculateCumulativeDeviation(totalDeviationsList, idx);
    const nilaiIKPA = calculateIkpa(rataRataDeviasiKumulatif);

    return {
      ...row,
      rataRataDeviasiKumulatif,
      nilaiIKPA
    };
  });

  // Nilai Akhir Indikator diambil dari Periode cutoffMonth (default 12)
  const lastRow = finalRows.length > 0 ? finalRows[finalRows.length - 1] : undefined;
  const targetIdx = Math.min(finalRows.length - 1, Math.max(0, (cutoffMonth || 12) - 1));
  const evaluatedRow = finalRows[targetIdx] || lastRow;
  const rawValue = evaluatedRow ? evaluatedRow.nilaiIKPA : 100;
  const cappedValue = Math.min(100, Math.max(0, rawValue));
  const weightedValue = round2((cappedValue * weight) / 100);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const evalMonthName = monthNames[targetIdx] || `Bulan ${targetIdx + 1}`;

  // Detail audit perhitungan untuk Formula Inspector
  details.push({
    step: `Deviasi Seluruh Jenis Belanja (Periode ${targetIdx + 1} - ${evalMonthName})`,
    formulaHuman: `Z${targetIdx + 5} = V${targetIdx + 5} (${evaluatedRow?.deviasiTertimbang51 ?? 0}) + W${targetIdx + 5} (${evaluatedRow?.deviasiTertimbang52 ?? 0}) + X${targetIdx + 5} (${evaluatedRow?.deviasiTertimbang53 ?? 0}) + Y${targetIdx + 5} (${evaluatedRow?.deviasiTertimbang57 ?? 0}) = ${evaluatedRow?.deviasiSeluruhJenisBelanja ?? 0}%`,
    formulaTechnical: `=SUM(V${targetIdx + 5}:Y${targetIdx + 5})`,
    value: `${evaluatedRow?.deviasiSeluruhJenisBelanja ?? 0}%`
  });

  details.push({
    step: `Rata-Rata Deviasi Kumulatif Evaluasi (s.d. ${evalMonthName})`,
    formulaHuman: targetIdx >= 10
      ? `Sesuai aturan workbook, penilaian sampai November sehingga AA16 = AA15 = ${evaluatedRow?.rataRataDeviasiKumulatif ?? 0}%`
      : `Rata-rata kumulatif deviasi periode 01 s.d. ${String(targetIdx + 1).padStart(2, '0')} (${evalMonthName}) = ${evaluatedRow?.rataRataDeviasiKumulatif ?? 0}%`,
    formulaTechnical: `=AA${targetIdx + 5}`,
    value: `${evaluatedRow?.rataRataDeviasiKumulatif ?? 0}%`
  });

  details.push({
    step: `Nilai IKPA Deviasi Halaman III (s.d. ${evalMonthName})`,
    formulaHuman:
      (evaluatedRow?.rataRataDeviasiKumulatif ?? 0) <= 5
        ? `Rata-rata deviasi kumulatif s.d. ${evalMonthName} ≤ 5% => Nilai IKPA = 100`
        : `100 - ${evaluatedRow?.rataRataDeviasiKumulatif ?? 0} = ${rawValue}`,
    formulaTechnical: `=IF(AA${targetIdx + 5}<=5, 100, 100-AA${targetIdx + 5})`,
    value: rawValue
  });

  details.push({
    step: 'Nilai Berbobot (H6)',
    formulaHuman: `ROUND(${cappedValue} × ${weight}% / 100, 2) = ${weightedValue}`,
    formulaTechnical: `=ROUND(${cappedValue} * ${weight} / 100, 2)`,
    value: weightedValue
  });

  const result: IndicatorResult = {
    rawValue,
    cappedValue,
    weight: isActive ? weight : 0,
    weightedValue: isActive ? weightedValue : 0,
    isActive,
    details,
    metadata: {
      rows: finalRows,
      months: finalRows.map(r => ({
        periode: r.periode,
        rencana: { 51: r.rencana51, 52: r.rencana52, 53: r.rencana53, 57: r.rencana57 },
        penyerapan: { 51: r.penyerapan51, 52: r.penyerapan52, 53: r.penyerapan53, 57: r.penyerapan57 },
        proporsi: { 51: r.proporsi51, 52: r.proporsi52, 53: r.proporsi53, 57: r.proporsi57 },
        devPct: { 51: r.persenDeviasi51, 52: r.persenDeviasi52, 53: r.persenDeviasi53, 57: r.persenDeviasi57 },
        devTertimbang: {
          51: r.deviasiTertimbang51,
          52: r.deviasiTertimbang52,
          53: r.deviasiTertimbang53,
          57: r.deviasiTertimbang57
        },
        totalDeviasiBulan: r.deviasiSeluruhJenisBelanja,
        rataRataKumulatif: r.rataRataDeviasiKumulatif,
        nilaiIkpaBulan: r.nilaiIKPA
      })),
      finalCumulativeDeviation: lastRow?.rataRataDeviasiKumulatif ?? 0
    }
  };

  return { rows: finalRows, result };
}

/**
 * Wrapper fungsi kalkulator utama yang kompatibel dengan signature IndicatorResult.
 */
export function calculateDeviasiHalIII(
  inputs: (DeviasiHalIIIInput | DeviasiHal3Row)[],
  weight: number = 15,
  isActive: boolean = true,
  mode: 'excel_compatible' | 'validation' = 'excel_compatible',
  cutoffMonth: number = 12
): IndicatorResult {
  const { result } = calculateDeviasiHal3(inputs, weight, isActive, cutoffMonth);
  return result;
}

/**
 * 24. AUTOMATED GOLDEN TESTS
 * Memverifikasi TEST 1 s.d. TEST 14 secara terprogram.
 */
export function runDeviasiHal3GoldenTest(): {
  passed: boolean;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  results: Array<{
    id: string;
    description: string;
    expected: any;
    actual: any;
    passed: boolean;
  }>;
} {
  const testResults: Array<{
    id: string;
    description: string;
    expected: any;
    actual: any;
    passed: boolean;
  }> = [];

  // TEST 1: plan > 0 dan realization < plan
  // Contoh: plan = 100, realization = 80 => % deviasi = 20
  const t1 = calculateDeviationPercent(100, 80);
  testResults.push({
    id: 'TEST 1',
    description: 'plan > 0 dan realization < plan: plan=100, real=80 => 20%',
    expected: 20,
    actual: t1,
    passed: Math.abs(t1 - 20) < 0.0001
  });

  // TEST 2: plan > 0 dan realization > plan
  // Contoh: plan = 80, realization = 100 => % deviasi = 25
  const t2 = calculateDeviationPercent(80, 100);
  testResults.push({
    id: 'TEST 2',
    description: 'plan > 0 dan realization > plan: plan=80, real=100 => 25%',
    expected: 25,
    actual: t2,
    passed: Math.abs(t2 - 25) < 0.0001
  });

  // TEST 3: plan = 0 dan realization = 0 => expected deviation percent = 0
  const t3 = calculateDeviationPercent(0, 0);
  testResults.push({
    id: 'TEST 3',
    description: 'plan = 0 dan realization = 0 => expected deviation percent = 0',
    expected: 0,
    actual: t3,
    passed: t3 === 0
  });

  // TEST 4: plan = 0 dan realization > 0 => expected deviation percent = 100
  const t4 = calculateDeviationPercent(0, 5000000);
  testResults.push({
    id: 'TEST 4',
    description: 'plan = 0 dan realization > 0 => expected deviation percent = 100',
    expected: 100,
    actual: t4,
    passed: t4 === 100
  });

  // TEST 5: deviation percent harus maksimal 100
  // Contoh: plan = 10, realization = 1000 => normally 9900%, capped at 100
  const t5 = calculateDeviationPercent(10, 1000);
  testResults.push({
    id: 'TEST 5',
    description: 'deviation percent harus maksimal 100 (cap 100)',
    expected: 100,
    actual: t5,
    passed: t5 === 100
  });

  // TEST 6: weighted deviation menggunakan: percentDeviation * proportion / 100 (dibulatkan 2 desimal)
  // Contoh: 62.06% * 38.09% / 100 = 23.6386... => 23.64
  const t6 = calculateWeightedDeviation(62.06, 38.09, false);
  testResults.push({
    id: 'TEST 6',
    description: 'weighted deviation: percentDeviation * proportion / 100: 62.06 * 38.09 / 100 => 23.64',
    expected: 23.64,
    actual: t6,
    passed: Math.abs(t6 - 23.64) < 0.0001
  });

  // TEST 7: Maret V7 = 0
  const t7 = calculateWeightedDeviation(36.17, 38.09, true);
  testResults.push({
    id: 'TEST 7',
    description: 'Maret V7 (Belanja 51) = 0 per S-119/PB.2/2024',
    expected: 0,
    actual: t7,
    passed: t7 === 0
  });

  // TEST 8: Maret W7 = 0
  const t8 = calculateWeightedDeviation(61.52, 51.59, true);
  testResults.push({
    id: 'TEST 8',
    description: 'Maret W7 (Belanja 52) = 0 per S-119/PB.2/2024',
    expected: 0,
    actual: t8,
    passed: t8 === 0
  });

  // TEST 9: AA5 = Z5 dibulatkan 2 desimal
  const zList = [62.15, 27.52, 1.85, 15.43, 28.01, 0.20, 0.07, 1.11, 0.71, 0.08, 0.29, 0.29];
  const t9 = calculateCumulativeDeviation(zList, 0);
  testResults.push({
    id: 'TEST 9',
    description: 'AA5 = Z5 dibulatkan 2 desimal: 62.15',
    expected: 62.15,
    actual: t9,
    passed: Math.abs(t9 - 62.15) < 0.0001
  });

  // TEST 10: AA6 = average Z5:Z6
  // (62.15 + 27.52) / 2 = 89.67 / 2 = 44.835 => 44.84
  const t10 = calculateCumulativeDeviation(zList, 1);
  testResults.push({
    id: 'TEST 10',
    description: 'AA6 = average(Z5:Z6): round2((62.15 + 27.52)/2) => 44.84',
    expected: 44.84,
    actual: t10,
    passed: Math.abs(t10 - 44.84) < 0.0001
  });

  // TEST 11: AA15 = average Z5:Z15
  // Sum 11 periods = 137.43 => 137.43 / 11 = 12.4936... => 12.49
  const t11 = calculateCumulativeDeviation(zList, 10);
  testResults.push({
    id: 'TEST 11',
    description: 'AA15 = average(Z5:Z15): 12.49',
    expected: 12.49,
    actual: t11,
    passed: Math.abs(t11 - 12.49) < 0.0001
  });

  // TEST 12: AA16 = AA15
  const t12 = calculateCumulativeDeviation(zList, 11);
  testResults.push({
    id: 'TEST 12',
    description: 'AA16 = AA15 (Desember sama dengan November): 12.49',
    expected: t11,
    actual: t12,
    passed: t12 === t11
  });

  // TEST 13: AB jika AA <= 5 maka 100
  const t13a = calculateIkpa(3.50);
  const t13b = calculateIkpa(5.00);
  testResults.push({
    id: 'TEST 13',
    description: 'AB jika AA <= 5 maka 100: AA=3.50 => 100, AA=5.00 => 100',
    expected: 100,
    actual: t13a,
    passed: t13a === 100 && t13b === 100
  });

  // TEST 14: AB jika AA > 5 maka 100 - AA
  // Contoh: AA = 5.01 => 94.99; AA = 12.49 => 87.51
  const t14a = calculateIkpa(5.01);
  const t14b = calculateIkpa(12.49);
  testResults.push({
    id: 'TEST 14',
    description: 'AB jika AA > 5 maka 100 - AA: AA=5.01 => 94.99, AA=12.49 => 87.51',
    expected: 87.51,
    actual: t14b,
    passed: Math.abs(t14a - 94.99) < 0.0001 && Math.abs(t14b - 87.51) < 0.0001
  });

  const passedCount = testResults.filter(t => t.passed).length;
  const failedCount = testResults.length - passedCount;

  return {
    passed: failedCount === 0,
    totalTests: testResults.length,
    passedCount,
    failedCount,
    results: testResults
  };
}
