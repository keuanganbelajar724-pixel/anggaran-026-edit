import { BelanjaKontraktualInput, IndicatorResult, CalculationDetail } from '../models/ikpa';
import { round2, average } from './rounding';

export const EARLY_CONTRACT_SCORE = 110;

export function getQuarterFromDate(dateStr?: string): 'I' | 'II' | 'III' | 'IV' {
  if (!dateStr) return 'I';
  const month = new Date(dateStr).getMonth() + 1;
  if (month <= 3) return 'I';
  if (month <= 6) return 'II';
  if (month <= 9) return 'III';
  return 'IV';
}

export function getSemesterFromDate(dateStr?: string): 'I' | 'II' {
  if (!dateStr) return 'I';
  const month = new Date(dateStr).getMonth() + 1;
  return month <= 6 ? 'I' : 'II';
}

export function convertDistribusiRasio(avg: number): number {
  if (avg <= 0) return 0;
  if (avg <= 25) return 50;
  if (avg <= 50) return 60;
  if (avg <= 75) return 80;
  return 100;
}

export function getAkselerasi53Score(quarter: 'I' | 'II' | 'III' | 'IV'): number {
  if (quarter === 'I') return 100;
  if (quarter === 'II') return 90;
  if (quarter === 'III') return 80;
  return 70;
}

export function calculateBelanjaKontraktual(
  inputs: BelanjaKontraktualInput[],
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
        formulaHuman: 'Satker tidak mempunyai transaksi kontraktual / bobot 0%',
        value: 0
      }]
    };
  }

  const processed = inputs.map(item => {
    const sem = item.semesterKontrak || getSemesterFromDate(item.tanggalKontrak);
    const qtr = item.quarterKontrak || getQuarterFromDate(item.tanggalKontrak);

    // Distribusi akselerasi raw: IF(Semester="I", 100, 0) or pre-calculated
    const rawDistribusi = (item as any).nilaiDistribusiAkselerasi !== undefined
      ? Number((item as any).nilaiDistribusiAkselerasi)
      : (sem === 'I' ? 100 : 0);

    // Kontrak Dini: 110 if early contract, else 100
    const valKontrakDini = (item as any).nilaiKontrakDini !== undefined
      ? Number((item as any).nilaiKontrakDini)
      : (item.isEarlyContract ? EARLY_CONTRACT_SCORE : 100);

    // Akselerasi 53
    const valAkselerasi53 = (item as any).nilaiAkselerasi53 !== undefined
      ? Number((item as any).nilaiAkselerasi53)
      : getAkselerasi53Score(qtr);

    return {
      ...item,
      semester: sem,
      quarter: qtr,
      rawDistribusi,
      valKontrakDini,
      valAkselerasi53
    };
  });

  // Averages
  const avgDistribusiRaw = average(processed.map(x => x.rawDistribusi));
  const nilaiDistribusiConverted = convertDistribusiRasio(avgDistribusiRaw);

  const avgKontrakDini = average(processed.map(x => x.valKontrakDini));
  const avgAkselerasi53 = average(processed.map(x => x.valAkselerasi53));

  // Component weights:
  // Distribusi Akselerasi = 20%
  // Kontrak Dini = 40%
  // Akselerasi 53 = 40%
  const kompDistribusi = round2(0.20 * nilaiDistribusiConverted);
  const kompKontrakDini = round2(0.40 * avgKontrakDini);
  const kompAkselerasi53 = round2(0.40 * avgAkselerasi53);

  const rawValue = round2(kompDistribusi + kompKontrakDini + kompAkselerasi53);
  const cappedValue = Math.min(100, Math.max(0, rawValue));
  const weightedValue = round2((cappedValue * weight) / 100);

  details.push({
    step: 'Rata-rata Distribusi Akselerasi',
    formulaHuman: `Rata-rata Semester I = ${round2(avgDistribusiRaw)}% → Nilai Konversi = ${nilaiDistribusiConverted}`,
    formulaTechnical: 'IF(avg<=25,50,IF(avg<=50,60,IF(avg<=75,80,100)))',
    value: nilaiDistribusiConverted
  });

  details.push({
    step: 'Rata-rata Kontrak Dini',
    formulaHuman: `Rata-rata nilai kontrak dini = ${round2(avgKontrakDini)}`,
    formulaTechnical: 'AVERAGE(KontrakDini)',
    value: round2(avgKontrakDini)
  });

  details.push({
    step: 'Rata-rata Akselerasi Belanja 53',
    formulaHuman: `Rata-rata akselerasi 53 = ${round2(avgAkselerasi53)}`,
    formulaTechnical: 'AVERAGE(Akselerasi53)',
    value: round2(avgAkselerasi53)
  });

  details.push({
    step: 'Nilai Indikator Belanja Kontraktual (N30)',
    formulaHuman: `(20% × ${nilaiDistribusiConverted}) + (40% × ${round2(avgKontrakDini)}) + (40% × ${round2(avgAkselerasi53)}) = ${rawValue}`,
    formulaTechnical: '(0.20*Distribusi) + (0.40*KontrakDini) + (0.40*Akselerasi53)',
    value: rawValue
  });

  details.push({
    step: 'Nilai Berbobot (J8)',
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
      items: processed,
      kompDistribusi,
      kompKontrakDini,
      kompAkselerasi53
    }
  };
}
