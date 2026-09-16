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

/**
 * Menentukan apakah suatu indikator secara efektif aktif / diperhitungkan dalam IKPA.
 * Sesuai PER-5 / Juknis IKPA:
 * 1. Pengguna dapat menonaktifkan indikator via project.activeIndicators[key] === false
 * 2. Jika suatu indikator tidak memiliki baris data / transaksi sama sekali (0 baris),
 *    indikator tersebut otomatis diperlakukan sebagai TIDAK DIPERHITUNGKAN (N/A)
 *    agar satker diperlakukan adil dan bobot dinormalisasi via Konversi Bobot (O6).
 */
export function isIndicatorEffectivelyActive(
  project: SimulationProject,
  key: keyof SimulationProject['activeIndicators']
): boolean {
  // 1. Cek toggle eksplisit dari pengguna
  if (project.activeIndicators && project.activeIndicators[key] === false) {
    return false;
  }

  // 2. Cek apakah ada data baris / transaksi riil
  switch (key) {
    case 'revisiDIPA':
      return Array.isArray(project.revisiDIPA) && project.revisiDIPA.length > 0;
    case 'deviasiHalIII':
      return Array.isArray(project.deviasiHalIII) && project.deviasiHalIII.length > 0;
    case 'penyerapan':
      return Array.isArray(project.penyerapan) && project.penyerapan.length > 0;
    case 'belanjaKontraktual':
      return Array.isArray(project.belanjaKontraktual) && project.belanjaKontraktual.length > 0;
    case 'penyelesaianTagihan':
      return Array.isArray(project.penyelesaianTagihan) && project.penyelesaianTagihan.length > 0;
    case 'pengelolaanUPTUP': {
      const hasTunai = Array.isArray(project.upTUPTunai) && project.upTUPTunai.length > 0;
      const hasKKP = Array.isArray(project.upTUPKKP) && project.upTUPKKP.length > 0 &&
        project.upTUPKKP.some(k => (Number(k.upKKPPerBulan) || 0) > 0 || (Number(k.penggunaanKKP) || 0) > 0);
      return hasTunai || hasKKP;
    }
    case 'capaianOutput':
      return Array.isArray(project.capaianOutput) && project.capaianOutput.length > 0;
    default:
      return true;
  }
}

export function calculateIKPA(
  project: SimulationProject,
  options?: { overrideCutoff?: number }
): IKPAResult {
  const cutoff = options?.overrideCutoff ?? (project.metadata?.periodeCutoff || 12);
  const weights = { ...DEFAULT_WEIGHTS, ...(project.weights || {}) };

  // Hitung status keaktifan efektif untuk seluruh 7 indikator
  const effectiveActive = {
    revisiDIPA: isIndicatorEffectivelyActive(project, 'revisiDIPA'),
    deviasiHalIII: isIndicatorEffectivelyActive(project, 'deviasiHalIII'),
    penyerapan: isIndicatorEffectivelyActive(project, 'penyerapan'),
    belanjaKontraktual: isIndicatorEffectivelyActive(project, 'belanjaKontraktual'),
    penyelesaianTagihan: isIndicatorEffectivelyActive(project, 'penyelesaianTagihan'),
    pengelolaanUPTUP: isIndicatorEffectivelyActive(project, 'pengelolaanUPTUP'),
    capaianOutput: isIndicatorEffectivelyActive(project, 'capaianOutput')
  };

  // Determine actual applied weights (0 if indicator is deactivated or has 0 rows)
  const appliedWeights = {
    revisiDIPA: effectiveActive.revisiDIPA ? weights.revisiDIPA : 0,
    deviasiHalIII: effectiveActive.deviasiHalIII ? weights.deviasiHalIII : 0,
    penyerapan: effectiveActive.penyerapan ? weights.penyerapan : 0,
    belanjaKontraktual: effectiveActive.belanjaKontraktual ? weights.belanjaKontraktual : 0,
    penyelesaianTagihan: effectiveActive.penyelesaianTagihan ? weights.penyelesaianTagihan : 0,
    pengelolaanUPTUP: effectiveActive.pengelolaanUPTUP ? weights.pengelolaanUPTUP : 0,
    capaianOutput: effectiveActive.capaianOutput ? weights.capaianOutput : 0
  };

  // 1. Revisi DIPA (G6)
  const revisiDIPA = calculateRevisiDIPA(
    project.revisiDIPA,
    appliedWeights.revisiDIPA,
    effectiveActive.revisiDIPA
  );

  // 2. Deviasi Halaman III DIPA (H6) - evaluasi s.d. cutoff bulan
  const thresholdDeviasiHal3 = Number(
    project.ambangBatasDeviasiHal3 ?? project.metadata?.ambangBatasDeviasiHal3 ?? 5.0
  );
  const deviasiHalIII = calculateDeviasiHalIII(
    project.deviasiHalIII,
    appliedWeights.deviasiHalIII,
    effectiveActive.deviasiHalIII,
    project.calculationMode,
    cutoff,
    thresholdDeviasiHal3
  );

  // 3. Penyerapan Anggaran (I6) - evaluasi s.d. cutoff bulan
  const penyerapan = calculatePenyerapan(
    project.penyerapan,
    appliedWeights.penyerapan,
    effectiveActive.penyerapan,
    cutoff,
    project.penyerapanQuarterTargets
  );

  // 4. Belanja Kontraktual (J6)
  const belanjaKontraktual = calculateBelanjaKontraktual(
    project.belanjaKontraktual,
    appliedWeights.belanjaKontraktual,
    effectiveActive.belanjaKontraktual,
    project.overrideNilaiKontraktual,
    project.isNormalisasiBobotKontraktual !== false,
    project.keteranganDispensasiKontraktual,
    project.metodeKalkulasiKontraktual || 'omspan'
  );

  // 5. Penyelesaian Tagihan (K6)
  const penyelesaianTagihan = calculatePenyelesaianTagihan(
    project.penyelesaianTagihan,
    appliedWeights.penyelesaianTagihan,
    effectiveActive.penyelesaianTagihan
  );

  // 6. Pengelolaan UP/TUP Tunai & KKP (L6) - evaluasi s.d. cutoff bulan
  // Jika metadata.periodeCutoff atau overrideCutoff tidak diset khusus, gunakan cutoff aktif berdasarkan periode data KKP yang terisi agar sesuai MyIntress (misal TW I = 110, bukan dibagi 4 menjadi 27.50)
  const effectiveKkpCutoff = options?.overrideCutoff ?? project.metadata?.periodeCutoff ?? (() => {
    let last = 1;
    if (Array.isArray(project.upTUPKKP)) {
      project.upTUPKKP.forEach((r, idx) => {
        if (Number(r.penggunaanKKP ?? 0) > 0) {
          last = idx + 1;
        }
      });
    }
    return last;
  })();

  const pengelolaanUPTUP = calculatePengelolaanUPTUP(
    project.upTUPTunai,
    project.upTUPKKP,
    appliedWeights.pengelolaanUPTUP,
    effectiveActive.pengelolaanUPTUP,
    effectiveKkpCutoff
  );

  // 7. Capaian Output (M6) - evaluasi s.d. cutoff bulan
  const capaianOutput = calculateCapaianOutput(
    project.capaianOutput,
    project.capaianOutputKetepatan,
    appliedWeights.capaianOutput,
    effectiveActive.capaianOutput,
    cutoff
  );

  // 8. Dispensasi SPM (Pengurang)
  const dispensasi = calculateDispensasiSPM(project.dispensasiSPM || {
    jumlahSPMTriwulanIV: 0,
    jumlahDispensasiSPM: 0
  });

  // Helper to ensure each indicator is defined and type-safe
  const ensureIndicator = (ind?: IndicatorResult, weight: number = 0, isActive: boolean = true): IndicatorResult => {
    if (!ind) {
      return {
        rawValue: 0,
        cappedValue: 0,
        weight: isActive ? weight : 0,
        weightedValue: 0,
        isActive,
        details: []
      };
    }
    if (!isActive) {
      return {
        ...ind,
        weight: 0,
        weightedValue: 0,
        isActive: false
      };
    }
    return ind;
  };

  const safeRevisiDIPA = ensureIndicator(revisiDIPA, appliedWeights.revisiDIPA, effectiveActive.revisiDIPA);
  const safeDeviasiHalIII = ensureIndicator(deviasiHalIII, appliedWeights.deviasiHalIII, effectiveActive.deviasiHalIII);
  const safePenyerapan = ensureIndicator(penyerapan, appliedWeights.penyerapan, effectiveActive.penyerapan);
  const safeBelanjaKontraktual = ensureIndicator(belanjaKontraktual, appliedWeights.belanjaKontraktual, effectiveActive.belanjaKontraktual);
  const safePenyelesaianTagihan = ensureIndicator(penyelesaianTagihan, appliedWeights.penyelesaianTagihan, effectiveActive.penyelesaianTagihan);
  const safePengelolaanUPTUP = ensureIndicator(pengelolaanUPTUP, appliedWeights.pengelolaanUPTUP, effectiveActive.pengelolaanUPTUP);
  const safeCapaianOutput = ensureIndicator(capaianOutput, appliedWeights.capaianOutput, effectiveActive.capaianOutput);

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
