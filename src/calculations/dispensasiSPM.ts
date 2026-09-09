import { DispensasiSPMInput } from '../models/ikpa';
import { round2, safeDiv } from './rounding';

export function calculateDispensasiReduction(ratio: number): number {
  if (ratio <= 0 || isNaN(ratio)) return 0;
  if (ratio <= 0.099) return 0.25;
  if (ratio <= 0.99) return 0.5;
  if (ratio <= 4.99) return 0.75;
  return 1.0;
}

export interface DispensasiResult {
  jumlahSPM: number;
  jumlahDispensasi: number;
  ratio: number;
  reduction: number;
  details: {
    formulaHuman: string;
    formulaTechnical: string;
    ratioText: string;
    reductionText: string;
  };
}

export function calculateDispensasiSPM(input: DispensasiSPMInput): DispensasiResult {
  const jumlahSPM = input.jumlahSPMTriwulanIV || 0;
  const jumlahDispensasi = input.jumlahDispensasiSPM || 0;

  const ratio = jumlahSPM > 0
    ? round2(safeDiv(jumlahDispensasi, jumlahSPM) * 1000)
    : 0;

  const reduction = calculateDispensasiReduction(ratio);

  return {
    jumlahSPM,
    jumlahDispensasi,
    ratio,
    reduction,
    details: {
      formulaHuman: `Rasio = (${jumlahDispensasi} / ${jumlahSPM}) × 1000 = ${ratio}‰ → Pengurang = -${reduction.toFixed(2).replace('.', ',')}`,
      formulaTechnical: 'IF(ratio=0,0,IF(ratio<=0.099,0.25,IF(ratio<=0.99,0.5,IF(ratio<=4.99,0.75,1))))',
      ratioText: `${ratio}‰`,
      reductionText: `-${reduction.toFixed(2).replace('.', ',')}`
    }
  };
}
