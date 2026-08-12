import { SatkerIKPA, IKPAPredikat } from "../types";

export function getPredikatIKPA(nilai: number): IKPAPredikat {
  if (nilai >= 95) return "Sangat Baik";
  if (nilai >= 87.5) return "Baik";
  if (nilai >= 70) return "Cukup";
  return "Sangat Perlu Perhatian";
}

export function hitungTotalIKPA(indikator: SatkerIKPA["indikator"]): number {
  const total = 
    (indikator.revisiDipa * 0.10) +
    (indikator.deviasiHal3Dipa * 0.10) +
    (indikator.penyerapanAnggaran * 0.20) +
    (indikator.belanjaKontraktual * 0.10) +
    (indikator.penyelesaianTagihan * 0.10) +
    (indikator.pengelolaanUpTup * 0.10) +
    (indikator.dispensasiSpm * 0.05) +
    (indikator.capaianOutput * 0.25);
    
  return Number(total.toFixed(2));
}

export const INITIAL_SATKER_DATA: SatkerIKPA[] = [];
