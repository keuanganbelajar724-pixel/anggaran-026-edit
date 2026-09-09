import {
  CapaianOutputInput,
  CapaianOutputKetepatanInput,
  IndicatorResult,
  CalculationDetail
} from '../models/ikpa';
import { round2, average, safeDiv } from './rounding';

export function calculateSingleROScore(row: CapaianOutputInput): number {
  if (row.statusKonfirmasi !== 'terkonfirmasi') {
    return 0;
  }

  const realisasi = row.realisasiRO || 0;
  const target = row.target || 1;
  const progress = row.persenProgress ?? 0;
  const targetPCRO = row.targetPCRO || 100;

  if (row.bulan === 12) {
    const raw = safeDiv(realisasi, target) * 100;
    return round2(Math.min(100, Math.max(0, raw)));
  }

  if (progress >= 100) {
    const raw = safeDiv(realisasi, target) * 100;
    return round2(Math.min(100, Math.max(0, raw)));
  }

  if (progress < 100) {
    const raw = safeDiv(progress, targetPCRO) * 100;
    return round2(Math.min(100, Math.max(0, raw)));
  }

  return 0;
}

export function calculateCapaianOutput(
  roInputs: CapaianOutputInput[],
  ketepatanInputs: CapaianOutputKetepatanInput[],
  weight: number = 25,
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

  if ((!roInputs || roInputs.length === 0) && (!ketepatanInputs || ketepatanInputs.length === 0)) {
    return {
      rawValue: 0,
      cappedValue: 0,
      weight: isActive ? weight : 0,
      weightedValue: 0,
      isActive,
      details: [{
        step: 'Data Capaian Output Kosong',
        formulaHuman: 'Belum ada data Rincian Output yang diinputkan (Nilai = 0)',
        value: 0
      }]
    };
  }

  // 1. Capaian RO (Bobot 70%)
  const processedRO = (roInputs || []).map(ro => {
    const score = calculateSingleROScore(ro);
    return {
      ...ro,
      calculatedScore: score
    };
  });

  const avgCapaianRO =
    processedRO.length > 0
      ? round2(average(processedRO.map(x => x.calculatedScore)))
      : 0;

  // 2. Ketepatan Waktu Pelaporan (Bobot 30%)
  const processedKetepatan = (ketepatanInputs || []).map(k => {
    const isTepat = k.ketepatan === 'Tepat Waktu';
    const score = isTepat ? 100 : 0;
    return {
      ...k,
      score
    };
  });

  const avgKetepatan =
    processedKetepatan.length > 0
      ? round2(average(processedKetepatan.map(x => x.score)))
      : 0;

  // Nilai Capaian Output: AD8 = (30% * Ketepatan) + (70% * Capaian RO)
  const kompKetepatan = round2(0.30 * avgKetepatan);
  const kompCapaianRO = round2(0.70 * avgCapaianRO);
  const rawValue = round2(kompKetepatan + kompCapaianRO);
  const cappedValue = Math.min(100, Math.max(0, rawValue));
  const weightedValue = round2((cappedValue * weight) / 100);

  details.push({
    step: 'Indikator Ketepatan Waktu Pelaporan (Bobot 30%)',
    formulaHuman: `Rata-rata ketepatan 12 bulan = ${avgKetepatan} → Komponen = 30% × ${avgKetepatan} = ${kompKetepatan}`,
    formulaTechnical: 'AVERAGE(Y5:Y16) * 30%',
    value: kompKetepatan
  });

  details.push({
    step: 'Indikator Capaian RO (Bobot 70%)',
    formulaHuman: `Rata-rata capaian ${processedRO.length} Rincian Output = ${avgCapaianRO} → Komponen = 70% × ${avgCapaianRO} = ${kompCapaianRO}`,
    formulaTechnical: 'AVERAGE(R5:R63) * 70%',
    value: kompCapaianRO
  });

  details.push({
    step: 'Nilai Akhir Capaian Output (AD8)',
    formulaHuman: `${kompKetepatan} + ${kompCapaianRO} = ${rawValue}`,
    formulaTechnical: 'AD8 = SUM(AD6:AD7)',
    value: rawValue
  });

  details.push({
    step: 'Nilai Berbobot (M8)',
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
      avgCapaianRO,
      avgKetepatan,
      kompKetepatan,
      kompCapaianRO,
      roCount: processedRO.length
    }
  };
}
