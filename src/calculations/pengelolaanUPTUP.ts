import { UPTUPTunaiInput, UPTUPKKPInput, IndicatorResult, CalculationDetail } from '../models/ikpa';
import { calculateUPTUPTunai } from './upTupTunai';
import { calculateUPTUPKKP } from './upTupKKP';
import { round2 } from './rounding';

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

  const tunaiResult = calculateUPTUPTunai(tunaiInputs);
  const kkpResult = calculateUPTUPKKP(kkpInputs);

  const valTunai = tunaiResult.rawValue;
  const valKKP = kkpResult.rawValue;
  const isKkpZero = valKKP === 0 && kkpResult.totalPenggunaan === 0;

  let rawCombined: number;
  if (isKkpZero) {
    // (90% * UP Tunai) / 90% = UP Tunai
    rawCombined = valTunai;
  } else {
    // (UP Tunai * 90%) + (UP KKP * 10%)
    rawCombined = round2(0.90 * valTunai + 0.10 * valKKP);
  }

  const cappedValue = Math.min(100, Math.max(0, round2(rawCombined)));
  const weightedValue = round2((cappedValue * weight) / 100);

  details.push({
    step: 'Nilai Pengelolaan UP/TUP Tunai',
    formulaHuman: `(50% × Ketepatan ${tunaiResult.nilaiKetepatanWaktu}) + (25% × GUP ${tunaiResult.nilaiGupDisebulankan}) + (25% × TUP ${tunaiResult.nilaiSetoranTup}) = ${valTunai}`,
    formulaTechnical: '(50%*Ketepatan) + (25%*GUP) + (25%*SetoranTUP)',
    value: valTunai
  });

  details.push({
    step: 'Nilai Pengelolaan UP/TUP KKP',
    formulaHuman: isKkpZero
      ? 'KKP = 0 (Tidak Ada Penggunaan KKP / Bobot dialihkan 100% ke Tunai)'
      : `Nilai KKP Kumulatif Akhir (J16) = ${valKKP}`,
    formulaTechnical: isKkpZero ? 'UP KKP = 0' : 'AVERAGE($I$7,$I$10,$I$13,I16)',
    value: valKKP
  });

  details.push({
    step: 'Nilai Gabungan Pengelolaan UP dan TUP (N8)',
    formulaHuman: isKkpZero
      ? `(90% × ${valTunai}) / 90% = ${rawCombined}`
      : `(90% × ${valTunai}) + (10% × ${valKKP}) = ${rawCombined}`,
    formulaTechnical: isKkpZero ? '(90% * Tunai) / 90%' : '(90% * Tunai) + (10% * KKP)',
    value: rawCombined
  });

  details.push({
    step: 'Nilai Capped (L6)',
    formulaHuman: `MIN(100; ${rawCombined}) = ${cappedValue}`,
    formulaTechnical: 'MIN(100, N8)',
    value: cappedValue
  });

  details.push({
    step: 'Nilai Berbobot (L8)',
    formulaHuman: `ROUND(${cappedValue} × ${weight}% / 100; 2) = ${weightedValue}`,
    formulaTechnical: `ROUND(${cappedValue} * ${weight} / 100, 2)`,
    value: weightedValue
  });

  return {
    rawValue: rawCombined,
    cappedValue,
    weight,
    weightedValue,
    isActive,
    details,
    metadata: {
      tunaiResult,
      kkpResult,
      isKkpZero
    }
  };
}
