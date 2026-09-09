import { PenyelesaianTagihanInput, IndicatorResult, CalculationDetail } from '../models/ikpa';
import { round2, safeDiv } from './rounding';

export function calculateDaysDiff(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr).getTime();
  const end = new Date(endDateStr).getTime();
  if (isNaN(start) || isNaN(end)) return 0;
  const diffTime = end - start;
  return Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
}

export function calculatePenyelesaianTagihan(
  inputs: PenyelesaianTagihanInput[],
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
        formulaHuman: 'Tidak ada transaksi SPM LS Kontraktual Non Belanja Pegawai / bobot 0%',
        value: 0
      }]
    };
  }

  let tepatCount = 0;
  let terlambatCount = 0;

  const processed = inputs.map(item => {
    const selisihHari = calculateDaysDiff(
      item.tanggalMulaiPerhitungan,
      item.tanggalKonversiADK
    );
    const jumlahHariLibur = item.jumlahHariLibur || 0;
    const jumlahHariFinal = Math.max(0, selisihHari - jumlahHariLibur);

    // Rule: <= 17 hari kerja -> TEPAT, else TERLAMBAT
    const status: 'TEPAT' | 'TERLAMBAT' = jumlahHariFinal <= 17 ? 'TEPAT' : 'TERLAMBAT';

    if (status === 'TEPAT') {
      tepatCount++;
    } else {
      terlambatCount++;
    }

    return {
      ...item,
      selisihHari,
      jumlahHariFinal,
      status
    };
  });

  const totalSPM = tepatCount + terlambatCount;
  const rawValue = totalSPM > 0 ? round2(safeDiv(tepatCount, totalSPM) * 100) : 100;
  const cappedValue = Math.min(100, Math.max(0, rawValue));
  const weightedValue = round2((cappedValue * weight) / 100);

  details.push({
    step: 'Jumlah SPM Tepat Waktu (≤ 17 Hari)',
    formulaHuman: `Jumlah SPM berstatus TEPAT = ${tepatCount} berkas`,
    formulaTechnical: 'COUNTIF(Status,"TEPAT")',
    value: tepatCount
  });

  details.push({
    step: 'Jumlah SPM Terlambat (> 17 Hari)',
    formulaHuman: `Jumlah SPM berstatus TERLAMBAT = ${terlambatCount} berkas`,
    formulaTechnical: 'COUNTIF(Status,"TERLAMBAT")',
    value: terlambatCount
  });

  details.push({
    step: 'Total SPM LS Kontraktual',
    formulaHuman: `${tepatCount} + ${terlambatCount} = ${totalSPM} berkas`,
    formulaTechnical: 'SUM(Tepat + Terlambat)',
    value: totalSPM
  });

  details.push({
    step: 'Rasio Ketepatan SPM (R6)',
    formulaHuman: `(${tepatCount} / ${totalSPM}) × 100% = ${rawValue}`,
    formulaTechnical: 'Q4/S4*100',
    value: rawValue
  });

  details.push({
    step: 'Nilai Berbobot (K8)',
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
      tepatCount,
      terlambatCount,
      totalSPM
    }
  };
}
