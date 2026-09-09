import { DeviasiHalIIIInput, IndicatorResult, CalculationDetail } from '../models/ikpa';
import { round2, average, safeDiv } from './rounding';

export function deviationPercent(plan: number, actual: number): number {
  if (plan > 0) {
    return Math.min(
      round2((Math.abs(actual - plan) / plan) * 100),
      100
    );
  }
  if (plan === 0 && actual === 0) return 0;
  if (plan === 0 && actual > 0) return 100;
  return 0;
}

export function calculateDeviasiHalIII(
  inputs: DeviasiHalIIIInput[],
  weight: number = 15,
  isActive: boolean = true,
  mode: 'excel_compatible' | 'validation' = 'excel_compatible'
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
        formulaHuman: 'Bobot = 0% atau data kosong',
        value: 0
      }]
    };
  }

  // Check if there is any plan or realization data inputted
  const hasAnyData = inputs.some(m =>
    (m.rencana51 > 0 || m.rencana52 > 0 || m.rencana53 > 0 || m.rencana57 > 0 ||
     (m.penyerapan51 ?? (m as any).realisasi51 ?? 0) > 0 ||
     (m.penyerapan52 ?? (m as any).realisasi52 ?? 0) > 0 ||
     (m.penyerapan53 ?? (m as any).realisasi53 ?? 0) > 0 ||
     (m.penyerapan57 ?? (m as any).realisasi57 ?? 0) > 0)
  );

  if (!hasAnyData) {
    return {
      rawValue: 0,
      cappedValue: 0,
      weight: isActive ? weight : 0,
      weightedValue: 0,
      isActive,
      details: [{
        step: 'Data Deviasi Hal III Belum Diisi',
        formulaHuman: 'Belum ada Rencana Penarikan Dana (RPD) maupun Realisasi yang diinputkan (Nilai = 0)',
        value: 0
      }]
    };
  }

  // Calculate default pagu proportions if not provided
  // Calculate total rencana as approximation if proporsi is not explicit
  const processedMonths = inputs.map((m, idx) => {
    // Proportions
    let p51 = m.proporsiPagu51 ?? 0;
    let p52 = m.proporsiPagu52 ?? 0;
    let p53 = m.proporsiPagu53 ?? 0;
    let p57 = m.proporsiPagu57 ?? 0;

    const propSum = p51 + p52 + p53 + p57;
    if (propSum === 0) {
      // derive from rencana sum or sensible defaults from workbook
      const totalRencana = m.rencana51 + m.rencana52 + m.rencana53 + m.rencana57;
      if (totalRencana > 0) {
        p51 = round2((m.rencana51 / totalRencana) * 100);
        p52 = round2((m.rencana52 / totalRencana) * 100);
        p53 = round2((m.rencana53 / totalRencana) * 100);
        p57 = round2((m.rencana57 / totalRencana) * 100);
      } else {
        p51 = 38.09;
        p52 = 51.59;
        p53 = 9.34;
        p57 = 0.98;
      }
    }

    const actual51 = m.penyerapan51 ?? (m as any).realisasi51 ?? 0;
    const actual52 = m.penyerapan52 ?? (m as any).realisasi52 ?? 0;
    const actual53 = m.penyerapan53 ?? (m as any).realisasi53 ?? 0;
    const actual57 = m.penyerapan57 ?? (m as any).realisasi57 ?? 0;

    // % Deviasi per jenis belanja
    const devPct51 = deviationPercent(m.rencana51, actual51);
    const devPct52 = deviationPercent(m.rencana52, actual52);
    const devPct53 = deviationPercent(m.rencana53, actual53);
    const devPct57 = deviationPercent(m.rencana57, actual57);

    // Deviasi tertimbang
    const devTertimbang51 = round2((devPct51 * p51) / 100);
    const devTertimbang52 = round2((devPct52 * p52) / 100);
    const devTertimbang53 = round2((devPct53 * p53) / 100);
    const devTertimbang57 = round2((devPct57 * p57) / 100);

    // Total deviasi bulan ini
    const totalDeviasiBulan = round2(
      devTertimbang51 + devTertimbang52 + devTertimbang53 + devTertimbang57
    );

    return {
      periode: m.periode,
      rencana: { 51: m.rencana51, 52: m.rencana52, 53: m.rencana53, 57: m.rencana57 },
      penyerapan: { 51: actual51, 52: actual52, 53: actual53, 57: actual57 },
      proporsi: { 51: p51, 52: p52, 53: p53, 57: p57 },
      devPct: { 51: devPct51, 52: devPct52, 53: devPct53, 57: devPct57 },
      devTertimbang: {
        51: devTertimbang51,
        52: devTertimbang52,
        53: devTertimbang53,
        57: devTertimbang57
      },
      totalDeviasiBulan,
      rataRataKumulatif: 0,
      nilaiIkpaBulan: 0
    };
  });

  // Calculate cumulative average up to each month
  const monthlyDevTotals: number[] = [];
  for (let i = 0; i < processedMonths.length; i++) {
    monthlyDevTotals.push(processedMonths[i].totalDeviasiBulan);
    const avgCum = round2(average(monthlyDevTotals));
    processedMonths[i].rataRataKumulatif = avgCum;
    processedMonths[i].nilaiIkpaBulan = avgCum <= 5 ? 100 : round2(Math.max(0, 100 - avgCum));
  }

  // Last available month is the final score for Deviasi Halaman III DIPA
  const lastMonth = processedMonths[processedMonths.length - 1];
  const rawValue = lastMonth ? lastMonth.nilaiIkpaBulan : 100;
  const cappedValue = Math.min(100, Math.max(0, rawValue));
  const weightedValue = round2((cappedValue * weight) / 100);

  details.push({
    step: 'Rata-rata Deviasi Kumulatif Akhir (% Rata-Rata)',
    formulaHuman: `Rata-rata deviasi kumulatif periode 01 s/d ${lastMonth?.periode || '12'} = ${lastMonth?.rataRataKumulatif}%`,
    formulaTechnical: 'ROUND(AVERAGE(Z01:Z12), 2)',
    value: `${lastMonth?.rataRataKumulatif}%`
  });

  details.push({
    step: 'Nilai IKPA Deviasi Hal III (AB16)',
    formulaHuman:
      (lastMonth?.rataRataKumulatif ?? 0) <= 5
        ? 'Rata-rata deviasi ≤ 5% => Nilai = 100'
        : `100 - ${lastMonth?.rataRataKumulatif} = ${rawValue}`,
    formulaTechnical: 'IF(Deviasi<=5, 100, 100 - Deviasi)',
    value: rawValue
  });

  details.push({
    step: 'Nilai Berbobot (H8)',
    formulaHuman: `ROUND(${cappedValue} × ${weight}% / 100; 2) = ${weightedValue}`,
    formulaTechnical: `ROUND(${cappedValue} * ${weight} / 100, 2)`,
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
      months: processedMonths,
      finalCumulativeDeviation: lastMonth?.rataRataKumulatif ?? 0
    }
  };
}
