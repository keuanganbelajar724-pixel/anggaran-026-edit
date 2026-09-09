import { RevisiDIPAInput, IndicatorResult, CalculationDetail } from '../models/ikpa';
import { round2, average } from './rounding';

export function calculateRevisiDIPA(
  inputs: RevisiDIPAInput[],
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
        formulaHuman: 'Bobot = 0% atau data kosong',
        value: 0
      }]
    };
  }

  // Calculate each row
  let cumulativeCount = 0;
  const processedRows = inputs.map((row, idx) => {
    const isCounted =
      row.jenisRevisi14 === 'ya' &&
      (row.paguDipaSebelum === undefined ||
        row.paguDipaMenjadi === undefined ||
        row.paguDipaSebelum === row.paguDipaMenjadi);

    if (isCounted) {
      cumulativeCount += 1;
    }

    let nilaiL: number;
    if (cumulativeCount <= 1) {
      nilaiL = 110;
    } else if (cumulativeCount === 2) {
      nilaiL = 100;
    } else {
      nilaiL = 50;
    }

    return {
      ...row,
      isCounted,
      cumulativeCount,
      nilaiL,
      nilaiM: nilaiL // will be computed in second pass
    };
  });

  // Calculate M column:
  // Rows 0 to 5 (M4 to M9 in Excel) follow L
  // Rows 6 to 11 (M10 to M15) use AVERAGE($L$9, L_curr) where L9 is the value at index 5 (or row 6)
  const l9Value = processedRows[5] ? processedRows[5].nilaiL : (processedRows[processedRows.length - 1]?.nilaiL ?? 110);

  for (let i = 0; i < processedRows.length; i++) {
    if (i <= 5) {
      processedRows[i].nilaiM = processedRows[i].nilaiL;
    } else {
      processedRows[i].nilaiM = round2(average([l9Value, processedRows[i].nilaiL]));
    }
  }

  const lastRow = processedRows[processedRows.length - 1];
  const rawValue = lastRow ? lastRow.nilaiM : 100;
  const cappedValue = Math.min(100, rawValue);
  const weightedValue = round2((cappedValue * weight) / 100);

  details.push({
    step: 'Total Revisi DIPA Diperhitungkan',
    formulaHuman: `Jumlah kumulatif revisi 14 jenis dengan pagu tetap = ${cumulativeCount}`,
    formulaTechnical: 'COUNTIF(Status,"diperhitungkan")',
    value: cumulativeCount
  });

  details.push({
    step: 'Nilai Indikator (M15)',
    formulaHuman: `Nilai akhir indikator setelah formula kumulatif = ${rawValue}`,
    formulaTechnical: 'M15 = AVERAGE($L$9, L15)',
    value: rawValue
  });

  details.push({
    step: 'Nilai Capped (Dashboard G6)',
    formulaHuman: `MIN(100; ${rawValue}) = ${cappedValue}`,
    formulaTechnical: 'MIN(100, RevisiDIPA.M15)',
    value: cappedValue
  });

  details.push({
    step: 'Nilai Berbobot (G8)',
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
      rows: processedRows,
      totalCountedRevisions: cumulativeCount
    }
  };
}
