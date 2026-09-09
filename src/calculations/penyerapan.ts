import { PenyerapanInput, IndicatorResult, CalculationDetail } from '../models/ikpa';
import { round2, average, safeDiv } from './rounding';

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
  { periode: '12', 51: 0.95, 52: 0.90, 53: 0.90, 57: 0.95 },
];

export function calculatePenyerapan(
  inputs: PenyerapanInput[],
  weight: number = 20,
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
        formulaHuman: 'Bobot = 0% atau data kosong',
        value: 0
      }]
    };
  }

  // Filter out any non-standard periods like notes ('Catatan:')
  const validInputs = inputs.filter(inp => /^\d{1,2}$/.test(inp.periode.trim()));
  const targetInputs = validInputs.length > 0 ? validInputs : inputs;

  // Calculate each period
  const processedPeriods = targetInputs.map((inp, idx) => {
    const defaultTarget = PENYERAPAN_TARGETS[idx] || PENYERAPAN_TARGETS[11];
    const t51 = inp.target51 ?? defaultTarget[51];
    const t52 = inp.target52 ?? defaultTarget[52];
    const t53 = inp.target53 ?? defaultTarget[53];
    const t57 = inp.target57 ?? defaultTarget[57];

    const paguNetto51 = Math.max(0, inp.pagu51 - inp.blokir51);
    const paguNetto52 = Math.max(0, inp.pagu52 - inp.blokir52);
    const paguNetto53 = Math.max(0, inp.pagu53 - inp.blokir53);
    const paguNetto57 = Math.max(0, inp.pagu57 - inp.blokir57);

    // Proporsi 51 dan 52: 51/(51+52), 52/(51+52)
    const sum5152 = paguNetto51 + paguNetto52;
    const proporsi51 = sum5152 > 0 ? paguNetto51 / sum5152 : 0;
    const proporsi52 = sum5152 > 0 ? paguNetto52 / sum5152 : 0;

    // Proporsi 53 dan 57: 53/(51+52+53+57), 57/(51+52+53+57)
    const totalPaguNetto = paguNetto51 + paguNetto52 + paguNetto53 + paguNetto57;
    const proporsi53 = totalPaguNetto > 0 ? paguNetto53 / totalPaguNetto : 0;
    const proporsi57 = totalPaguNetto > 0 ? paguNetto57 / totalPaguNetto : 0;

    // Nominal Target = Pagu Netto * Target
    const nominalTarget51 = paguNetto51 * t51;
    const nominalTarget52 = paguNetto52 * t52;
    const nominalTarget53 = paguNetto53 * t53;
    const nominalTarget57 = paguNetto57 * t57;

    // % Realisasi = MIN(1, Realisasi / Nominal Target)
    const pctReal51 = nominalTarget51 > 0 ? Math.min(1, inp.realisasi51 / nominalTarget51) : (inp.realisasi51 > 0 ? 1 : 0);
    const pctReal52 = nominalTarget52 > 0 ? Math.min(1, inp.realisasi52 / nominalTarget52) : (inp.realisasi52 > 0 ? 1 : 0);
    const pctReal53 = nominalTarget53 > 0 ? Math.min(1, inp.realisasi53 / nominalTarget53) : (inp.realisasi53 > 0 ? 1 : 0);
    const pctReal57 = nominalTarget57 > 0 ? Math.min(1, inp.realisasi57 / nominalTarget57) : (inp.realisasi57 > 0 ? 1 : 0);

    // NKPA Tertimbang = ROUND(%Realisasi * ProporsiPagu * 100, 2)
    const nkpa51 = round2(pctReal51 * proporsi51 * 100);
    const nkpa52 = round2(pctReal52 * proporsi52 * 100);
    const nkpa53 = round2(pctReal53 * proporsi53 * 100);
    const nkpa57 = round2(pctReal57 * proporsi57 * 100);

    // NKPA Seluruh Jenis Belanja (P in workbook)
    const nkpaTotal = round2(nkpa51 + nkpa52 + nkpa53 + nkpa57);

    return {
      periode: inp.periode,
      pagu: { 51: inp.pagu51, 52: inp.pagu52, 53: inp.pagu53, 57: inp.pagu57 },
      blokir: { 51: inp.blokir51, 52: inp.blokir52, 53: inp.blokir53, 57: inp.blokir57 },
      paguNetto: { 51: paguNetto51, 52: paguNetto52, 53: paguNetto53, 57: paguNetto57 },
      target: { 51: t51, 52: t52, 53: t53, 57: t57 },
      nominalTarget: { 51: nominalTarget51, 52: nominalTarget52, 53: nominalTarget53, 57: nominalTarget57 },
      realisasi: { 51: inp.realisasi51, 52: inp.realisasi52, 53: inp.realisasi53, 57: inp.realisasi57 },
      pctReal: { 51: pctReal51, 52: pctReal52, 53: pctReal53, 57: pctReal57 },
      proporsi: { 51: proporsi51, 52: proporsi52, 53: proporsi53, 57: proporsi57 },
      nkpa: { 51: nkpa51, 52: nkpa52, 53: nkpa53, 57: nkpa57 },
      nkpaTotal,
      nilaiIkpa: 0
    };
  });

  // Calculate Q values using exact workbook pattern:
  // Q01 = P01
  // Q02 = P02
  // Q03 = P03
  // Q04 = AVERAGE(P03, P04)
  // Q05 = AVERAGE(P03, P05)
  // Q06 = AVERAGE(P03, P06)
  // Q07 = AVERAGE(P03, P06, P07)
  // Q08 = AVERAGE(P03, P06, P08)
  // Q09 = AVERAGE(P03, P06, P09)
  // Q10 = AVERAGE(P03, P06, P09, P10)
  // Q11 = AVERAGE(P03, P06, P09, P11)
  // Q12 = AVERAGE(P03, P06, P09, P12)
  const p = processedPeriods.map(x => x.nkpaTotal);
  const p3 = p[2] ?? p[p.length - 1] ?? 100;
  const p6 = p[5] ?? p[p.length - 1] ?? 100;
  const p9 = p[8] ?? p[p.length - 1] ?? 100;

  for (let i = 0; i < processedPeriods.length; i++) {
    let qVal: number;
    if (i < 3) {
      qVal = p[i];
    } else if (i < 6) {
      qVal = round2(average([p3, p[i]]));
    } else if (i < 9) {
      qVal = round2(average([p3, p6, p[i]]));
    } else {
      qVal = round2(average([p3, p6, p9, p[i]]));
    }
    processedPeriods[i].nilaiIkpa = qVal;
  }

  const lastPeriod = processedPeriods[processedPeriods.length - 1];
  const rawValue = lastPeriod ? lastPeriod.nilaiIkpa : 100;
  const cappedValue = Math.min(100, Math.max(0, rawValue));
  const weightedValue = round2((cappedValue * weight) / 100);

  details.push({
    step: 'NKPA Seluruh Jenis Belanja Periode 12 (P12)',
    formulaHuman: `NKPA tertimbang periode akhir = ${lastPeriod?.nkpaTotal}`,
    formulaTechnical: 'SUM(NKPA 51:57)',
    value: lastPeriod?.nkpaTotal ?? 0
  });

  details.push({
    step: 'Nilai IKPA Penyerapan (Q71)',
    formulaHuman: `AVERAGE(P03, P06, P09, P12) = ${rawValue}`,
    formulaTechnical: 'AVERAGE($P$17,$P$35,$P$53,P71)',
    value: rawValue
  });

  details.push({
    step: 'Nilai Berbobot (I8)',
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
      periods: processedPeriods,
      finalNKPA: lastPeriod?.nkpaTotal ?? 0
    }
  };
}
