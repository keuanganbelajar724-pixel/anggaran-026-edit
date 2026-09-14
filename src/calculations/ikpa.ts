import {
  SimulationProject,
  IKPAResult,
  IndicatorResult,
  DEFAULT_WEIGHTS
} from '../models/ikpa';
import { round2, safeDiv } from './rounding';
import { calculateRevisiDIPA } from './revisiDipa';
import { calculateDeviasiHalIII } from './deviasiHalIII';
import { calculatePenyerapan } from './penyerapan';
import { calculateBelanjaKontraktual } from './belanjaKontraktual';
import { calculatePenyelesaianTagihan } from './penyelesaianTagihan';
import { calculatePengelolaanUPTUP } from './pengelolaanUPTUP';
import { calculateCapaianOutput } from './capaianOutput';
import { calculateDispensasiSPM } from './dispensasiSPM';

export function getPredikatIKPA(score: number): string {
  if (score >= 95) return 'SANGAT BAIK';
  if (score >= 89) return 'BAIK';
  if (score >= 70) return 'CUKUP';
  return 'KURANG';
}

export function calculateIKPA(
  project: SimulationProject,
  options?: { overrideCutoff?: number }
): IKPAResult {
  const cutoff = options?.overrideCutoff ?? (project.metadata?.periodeCutoff || 12);
  const weights = { ...DEFAULT_WEIGHTS, ...(project.weights || {}) };
  const active = project.activeIndicators || {
    revisiDIPA: true,
    deviasiHalIII: true,
    penyerapan: true,
    belanjaKontraktual: true,
    penyelesaianTagihan: true,
    pengelolaanUPTUP: true,
    capaianOutput: true
  };

  // Determine actual applied weights (0 if indicator is deactivated)
  const appliedWeights = {
    revisiDIPA: active.revisiDIPA ? weights.revisiDIPA : 0,
    deviasiHalIII: active.deviasiHalIII ? weights.deviasiHalIII : 0,
    penyerapan: active.penyerapan ? weights.penyerapan : 0,
    belanjaKontraktual: active.belanjaKontraktual ? weights.belanjaKontraktual : 0,
    penyelesaianTagihan: active.penyelesaianTagihan ? weights.penyelesaianTagihan : 0,
    pengelolaanUPTUP: active.pengelolaanUPTUP ? weights.pengelolaanUPTUP : 0,
    capaianOutput: active.capaianOutput ? weights.capaianOutput : 0
  };

  // 1. Revisi DIPA (G6)
  const revisiDIPA = calculateRevisiDIPA(
    project.revisiDIPA,
    appliedWeights.revisiDIPA,
    active.revisiDIPA
  );

  // 2. Deviasi Halaman III DIPA (H6) - evaluasi s.d. cutoff bulan
  const thresholdDeviasiHal3 = Number(
    project.ambangBatasDeviasiHal3 ?? project.metadata?.ambangBatasDeviasiHal3 ?? 5.0
  );
  const deviasiHalIII = calculateDeviasiHalIII(
    project.deviasiHalIII,
    appliedWeights.deviasiHalIII,
    active.deviasiHalIII,
    project.calculationMode,
    cutoff,
    thresholdDeviasiHal3
  );

  // 3. Penyerapan Anggaran (I6) - evaluasi s.d. cutoff bulan
  const penyerapan = calculatePenyerapan(
    project.penyerapan,
    appliedWeights.penyerapan,
    active.penyerapan,
    cutoff
  );

  // 4. Belanja Kontraktual (J6)
  const belanjaKontraktual = calculateBelanjaKontraktual(
    project.belanjaKontraktual,
    appliedWeights.belanjaKontraktual,
    active.belanjaKontraktual,
    project.overrideNilaiKontraktual,
    project.isNormalisasiBobotKontraktual !== false,
    project.keteranganDispensasiKontraktual,
    project.metodeKalkulasiKontraktual || 'omspan'
  );

  // 5. Penyelesaian Tagihan (K6)
  const penyelesaianTagihan = calculatePenyelesaianTagihan(
    project.penyelesaianTagihan,
    appliedWeights.penyelesaianTagihan,
    active.penyelesaianTagihan
  );

  // 6. Pengelolaan UP/TUP Tunai & KKP (L6) - evaluasi s.d. cutoff bulan
  const pengelolaanUPTUP = calculatePengelolaanUPTUP(
    project.upTUPTunai,
    project.upTUPKKP,
    appliedWeights.pengelolaanUPTUP,
    active.pengelolaanUPTUP,
    cutoff
  );

  // 7. Capaian Output (M6) - evaluasi s.d. cutoff bulan
  const capaianOutput = calculateCapaianOutput(
    project.capaianOutput,
    project.capaianOutputKetepatan,
    appliedWeights.capaianOutput,
    active.capaianOutput,
    cutoff
  );

  // 8. Dispensasi SPM (Pengurang)
  const dispensasi = calculateDispensasiSPM(project.dispensasiSPM || {
    jumlahSPMTriwulanIV: 0,
    jumlahDispensasiSPM: 0
  });

  // Helper to ensure each indicator is defined and type-safe
  const ensureIndicator = (ind?: IndicatorResult, weight: number = 0, isActive: boolean = true): IndicatorResult => ind || {
    rawValue: 0,
    cappedValue: 0,
    weight: isActive ? weight : 0,
    weightedValue: 0,
    isActive,
    details: []
  };

  const safeRevisiDIPA = ensureIndicator(revisiDIPA, appliedWeights.revisiDIPA, active.revisiDIPA);
  const safeDeviasiHalIII = ensureIndicator(deviasiHalIII, appliedWeights.deviasiHalIII, active.deviasiHalIII);
  const safePenyerapan = ensureIndicator(penyerapan, appliedWeights.penyerapan, active.penyerapan);
  const safeBelanjaKontraktual = ensureIndicator(belanjaKontraktual, appliedWeights.belanjaKontraktual, active.belanjaKontraktual);
  const safePenyelesaianTagihan = ensureIndicator(penyelesaianTagihan, appliedWeights.penyelesaianTagihan, active.penyelesaianTagihan);
  const safePengelolaanUPTUP = ensureIndicator(pengelolaanUPTUP, appliedWeights.pengelolaanUPTUP, active.pengelolaanUPTUP);
  const safeCapaianOutput = ensureIndicator(capaianOutput, appliedWeights.capaianOutput, active.capaianOutput);

  // Nilai Total: SUM(G8:M8)
  const totalWeighted = round2(
    (safeRevisiDIPA.weightedValue || 0) +
    (safeDeviasiHalIII.weightedValue || 0) +
    (safePenyerapan.weightedValue || 0) +
    (safeBelanjaKontraktual.weightedValue || 0) +
    (safePenyelesaianTagihan.weightedValue || 0) +
    (safePengelolaanUPTUP.weightedValue || 0) +
    (safeCapaianOutput.weightedValue || 0)
  );

  // Konversi Bobot: SUM(G7:M7)/100
  const sumWeights =
    appliedWeights.revisiDIPA +
    appliedWeights.deviasiHalIII +
    appliedWeights.penyerapan +
    appliedWeights.belanjaKontraktual +
    appliedWeights.penyelesaianTagihan +
    appliedWeights.pengelolaanUPTUP +
    appliedWeights.capaianOutput;

  const weightConversion = round2(safeDiv(sumWeights, 100, 1));

  // Nilai Akhir: ROUND(NilaiTotal / KonversiBobot, 2) - PengurangDispensasi
  const rawFinal = weightConversion > 0
    ? round2(safeDiv(totalWeighted, weightConversion))
    : 0;

  const finalScore = round2(Math.max(0, rawFinal - dispensasi.reduction));
  const predikat = getPredikatIKPA(finalScore);

  return {
    indicators: {
      revisiDIPA: safeRevisiDIPA,
      deviasiHalIII: safeDeviasiHalIII,
      penyerapan: safePenyerapan,
      belanjaKontraktual: safeBelanjaKontraktual,
      penyelesaianTagihan: safePenyelesaianTagihan,
      pengelolaanUPTUP: safePengelolaanUPTUP,
      capaianOutput: safeCapaianOutput
    },
    total: totalWeighted,
    totalWeighted,
    weightConversion,
    dispensasiReduction: dispensasi.reduction,
    dispensasiRatio: dispensasi.ratio,
    finalScore,
    predikat
  };
}

export interface SensitivityItem {
  indicatorKey: keyof IKPAResult['indicators'];
  label: string;
  currentScore: number;
  weight: number;
  impactPerPoint: number;
  maxPotentialGain: number;
  recommendation: string;
}

/**
 * Prompt Item 25: Sensitivity analysis calculation
 * Computes exact mathematical impact on Final IKPA if each indicator is raised by 1 point
 */
export function calculateSensitivity(
  project: SimulationProject,
  baseResult: IKPAResult
): SensitivityItem[] {
  const items: { key: keyof IKPAResult['indicators']; label: string }[] = [
    { key: 'penyerapan', label: 'Penyerapan Anggaran' },
    { key: 'capaianOutput', label: 'Capaian Output' },
    { key: 'deviasiHalIII', label: 'Deviasi Hal III DIPA' },
    { key: 'revisiDIPA', label: 'Revisi DIPA' },
    { key: 'belanjaKontraktual', label: 'Belanja Kontraktual' },
    { key: 'penyelesaianTagihan', label: 'Penyelesaian Tagihan' },
    { key: 'pengelolaanUPTUP', label: 'Pengelolaan UP/TUP' }
  ];

  const conv = baseResult.weightConversion || 1;

  return items.map(it => {
    const ind = baseResult.indicators[it.key];
    const weight = ind.weight;
    // Derivative: (weight / 100) / conv
    const impactPerPoint = conv > 0 ? round2((weight / 100) / conv) : 0;
    const roomTo100 = Math.max(0, 100 - ind.cappedValue);
    const maxPotentialGain = round2(roomTo100 * impactPerPoint);

    let rec = '';
    if (ind.cappedValue >= 100) {
      rec = 'Nilai sudah maksimal (100). Pertahankan konsistensi.';
    } else if (weight >= 20) {
      rec = `Prioritas Utama: Bobot tinggi (${weight}%). Peningkatan 1 poin menambah +${impactPerPoint} poin IKPA akhir.`;
    } else {
      rec = `Potensi kenaikan maksimal: +${maxPotentialGain} poin IKPA jika nilai mencapai 100.`;
    }

    return {
      indicatorKey: it.key,
      label: it.label,
      currentScore: ind.cappedValue,
      weight,
      impactPerPoint,
      maxPotentialGain,
      recommendation: rec
    };
  }).sort((a, b) => b.impactPerPoint - a.impactPerPoint);
}
