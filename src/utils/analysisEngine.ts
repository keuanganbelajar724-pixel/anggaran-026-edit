import { SatkerIKPA, RiwayatBulananIKPA, PejabatDanOperator } from '../types';

/**
 * Ensures a Satker has complete Pejabat Dan Operator data
 */
export function ensurePejabatOperator(satker: SatkerIKPA): PejabatDanOperator {
  if (satker.pejabatOperator && Object.keys(satker.pejabatOperator).length > 0) {
    return satker.pejabatOperator;
  }

  const kode = satker.kodeSatker;
  const suffix = kode.slice(-3);

  return {
    kpa: {
      nama: `Drs. H. M. Sholahuddin, M.Si.`,
      nip: `19720512 199803 1 0${suffix}`,
      noHp: satker.noHpPic || '081234567890',
      email: `kpa.${kode}@kemenkeu.go.id`
    },
    ppk: {
      nama: `Bambang Setyawan, S.E., M.M.`,
      nip: `19790815 200212 1 0${suffix}`,
      noHp: '081398765432',
      email: `ppk.${kode}@kemenkeu.go.id`
    },
    ppspm: {
      nama: `Sri Wahyuni, S.Sos.`,
      nip: `19820320 200412 2 0${suffix}`,
      noHp: '081567890123',
      email: `ppspm.${kode}@kemenkeu.go.id`
    },
    bendahara: {
      nama: `Dewi Lestari, A.Md.`,
      nip: `19881105 200912 2 0${suffix}`,
      noHp: '081789012345',
      email: `bendahara.${kode}@kemenkeu.go.id`
    },
    operatorKomitmen: {
      nama: `Rizal Pratama, A.Md.Ak.`,
      nip: `19920110 201402 1 0${suffix}`,
      noHp: '082123456789',
      email: `opr.komitmen.${kode}@kemenkeu.go.id`
    },
    operatorPembayaran: {
      nama: `Anisa Rahmawati, S.Kom.`,
      nip: `19940618 201602 2 0${suffix}`,
      noHp: '082234567890',
      email: `opr.pembayaran.${kode}@kemenkeu.go.id`
    },
    operatorPelaporan: {
      nama: satker.namaPic || `Fajar Hidayat (SAKTI Output)`,
      nip: `19950925 201802 1 0${suffix}`,
      noHp: satker.noHpPic || '082345678901',
      email: satker.emailPic || `opr.pelaporan.${kode}@kemenkeu.go.id`
    },
    operatorGaji: {
      nama: `Hendra Wijaya, S.E.`,
      nip: `19910404 201302 1 0${suffix}`,
      noHp: '082456789012',
      email: `opr.gaji.${kode}@kemenkeu.go.id`
    }
  };
}

/**
 * Ensures a Satker has monthly history. Only uses actual history or creates 1 month entry matching periodeUpdate.
 */
export function ensureMonthlyHistory(satker: SatkerIKPA): RiwayatBulananIKPA[] {
  if (satker.riwayatBulanan && satker.riwayatBulanan.length > 0) {
    return satker.riwayatBulanan;
  }

  // Infer month from satker.periodeUpdate (e.g. "Januari 2026") or default to 'Januari'
  const detectedMonth = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].find(
    m => satker.periodeUpdate && satker.periodeUpdate.toLowerCase().includes(m.toLowerCase())
  ) || 'Januari';

  const cur = satker.indikator;

  return [
    {
      bulan: detectedMonth,
      nilaiIKPA: satker.nilaiTotalIKPA,
      capaianOutput: cur?.capaianOutput ?? 100,
      deviasiHal3Dipa: cur?.deviasiHal3Dipa ?? 100,
      penyerapanAnggaran: satker.persenPenyerapan || cur?.penyerapanAnggaran || 85,
      revisiDipa: cur?.revisiDipa ?? 100,
      belanjaKontraktual: cur?.belanjaKontraktual ?? 100,
      penyelesaianTagihan: cur?.penyelesaianTagihan ?? 100,
      pengelolaanUpTup: cur?.pengelolaanUpTup ?? 100,
      dispensasiSpm: cur?.dispensasiSpm ?? 100
    }
  ];
}

export interface SatkerTrendAnalysisResult {
  trendDirection: 'UP' | 'DOWN' | 'STABLE';
  latestScore: number;
  previousScore: number;
  scoreChange: number;
  highestMonth: { bulan: string; score: number };
  lowestMonth: { bulan: string; score: number };
  mainDriversUp: string[];
  mainDriversDown: string[];
  narrativeSummary: string;
  recommendations: string[];
}

/**
 * Automates the periodic AI/algorithmic analysis for a specific Satker
 */
export function analyzeSatkerPeriodicTrend(
  satkerName: string,
  history: RiwayatBulananIKPA[]
): SatkerTrendAnalysisResult {
  if (!history || history.length < 2) {
    return {
      trendDirection: 'STABLE',
      latestScore: history[0]?.nilaiIKPA || 0,
      previousScore: history[0]?.nilaiIKPA || 0,
      scoreChange: 0,
      highestMonth: { bulan: 'Juli', score: history[0]?.nilaiIKPA || 0 },
      lowestMonth: { bulan: 'Januari', score: history[0]?.nilaiIKPA || 0 },
      mainDriversUp: [],
      mainDriversDown: [],
      narrativeSummary: 'Data riwayat periodik belum mencukupi untuk analisis tren.',
      recommendations: []
    };
  }

  const latest = history[history.length - 1]; // Juli or latest
  const previous = history[history.length - 2]; // Juni or previous
  const initial = history[0]; // Januari

  const scoreChange = Number((latest.nilaiIKPA - previous.nilaiIKPA).toFixed(2));
  const totalPeriodChange = Number((latest.nilaiIKPA - initial.nilaiIKPA).toFixed(2));

  let trendDirection: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
  if (scoreChange > 0.5) trendDirection = 'UP';
  else if (scoreChange < -0.5) trendDirection = 'DOWN';

  // Find highest and lowest month
  let highest = history[0];
  let lowest = history[0];
  history.forEach(m => {
    if (m.nilaiIKPA > highest.nilaiIKPA) highest = m;
    if (m.nilaiIKPA < lowest.nilaiIKPA) lowest = m;
  });

  // Calculate indicator shifts between latest and previous month
  const dOutput = latest.capaianOutput - previous.capaianOutput;
  const dDeviasi = latest.deviasiHal3Dipa - previous.deviasiHal3Dipa;
  const dPenyerapan = latest.penyerapanAnggaran - previous.penyerapanAnggaran;

  const mainDriversUp: string[] = [];
  const mainDriversDown: string[] = [];

  if (dOutput > 5) {
    mainDriversUp.push(`Peningkatan signifikan Indikator Capaian Output (+${dOutput.toFixed(1)} poin, dari ${previous.capaianOutput} menjadi ${latest.capaianOutput}) setelah pengunggahan data SAKTI.`);
  } else if (dOutput < -5) {
    mainDriversDown.push(`Penurunan tajam Indikator Capaian Output (${dOutput.toFixed(1)} poin, dari ${previous.capaianOutput} ke ${latest.capaianOutput}) akibat data SAKTI belum dikonfirmasi atau terlambat.`);
  }

  if (dDeviasi > 5) {
    mainDriversUp.push(`Perbaikan akurasi Rencana Penarikan Dana (RPD) Hal III DIPA (+${dDeviasi.toFixed(1)} poin, dari ${previous.deviasiHal3Dipa} ke ${latest.deviasiHal3Dipa}).`);
  } else if (dDeviasi < -5) {
    mainDriversDown.push(`Pembengkakan Deviasi Halaman III DIPA (${dDeviasi.toFixed(1)} poin, dari ${previous.deviasiHal3Dipa} menjadi ${latest.deviasiHal3Dipa}) karena realisasi penarikan tidak sesuai RPD.`);
  }

  if (dPenyerapan > 5) {
    mainDriversUp.push(`Akselerasi penyerapan anggaran Triwulan III (+${dPenyerapan.toFixed(1)} poin, dari ${previous.penyerapanAnggaran}% ke ${latest.penyerapanAnggaran}%).`);
  } else if (dPenyerapan < -5) {
    mainDriversDown.push(`Perlambatan realisasi belanja negara (${dPenyerapan.toFixed(1)} poin) melebihi batas toleransi.`);
  }

  // Generate Narrative Summary
  let narrative = '';
  if (trendDirection === 'UP') {
    narrative = `Pada periode ${latest.bulan}, nilai IKPA ${satkerName} mengalami KENAIKAN sebesar +${scoreChange} poin (dari ${previous.nilaiIKPA} menjadi ${latest.nilaiIKPA}). Performa terbaik tercatat pada bulan ${highest.bulan} (${highest.nilaiIKPA}). Faktor pendorong utama adalah perbaikan pada komponen Capaian Output dan penyesuaian RPD Halaman III DIPA.`;
  } else if (trendDirection === 'DOWN') {
    narrative = `Pada periode ${latest.bulan}, nilai IKPA ${satkerName} mengalami PENURUNAN sebesar ${scoreChange} poin (dari ${previous.nilaiIKPA} menjadi ${latest.nilaiIKPA}). Titik performa terendah terjadi pada bulan ${lowest.bulan} (${lowest.nilaiIKPA}). Penyebab utama penurunan skor adalah belum terinputnya Capaian Output SAKTI atau tinggi nya deviasi penarikan dana harian.`;
  } else {
    narrative = `Performa IKPA ${satkerName} cenderung STABIL di angka ${latest.nilaiIKPA} pada bulan ${latest.bulan} dibanding bulan ${previous.bulan} (${previous.nilaiIKPA}). Skor tertinggi tercatat pada bulan ${highest.bulan} (${highest.nilaiIKPA}).`;
  }

  // Recommendations
  const recommendations: string[] = [];
  if (latest.capaianOutput < 70) {
    recommendations.push('Segera lakukan konfirmasi dan unggah data Laporan Capaian Output di aplikasi SAKTI sebelum tanggal 5.');
  }
  if (latest.deviasiHal3Dipa < 75) {
    recommendations.push('Lakukan pemutakhiran Rencana Penarikan Dana (RPD) Halaman III DIPA di SAKTI pada awal triwulan agar deviasi tetap di bawah 20%.');
  }
  if (latest.penyerapanAnggaran < 75) {
    recommendations.push('Akselerasi penerbitan SPM belanja barang & modal yang telah selesai dilaksanakan untuk mendongkrak rasio penyerapan anggaran.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Pertahankan konsistensi perekaman data SAKTI dan jaga deviasi Hal III DIPA tetap di bawah 5% untuk mencapai nilai 100 Sangat Baik.');
  }

  return {
    trendDirection,
    latestScore: latest.nilaiIKPA,
    previousScore: previous.nilaiIKPA,
    scoreChange,
    highestMonth: { bulan: highest.bulan, score: highest.nilaiIKPA },
    lowestMonth: { bulan: lowest.bulan, score: lowest.nilaiIKPA },
    mainDriversUp,
    mainDriversDown,
    narrativeSummary: narrative,
    recommendations
  };
}

/**
 * Calculates overall KPPN monthly average trends dynamically from Jan to latest uploaded month
 */
export function getKPPNMonthlyAggregate(satkers: SatkerIKPA[]) {
  const monthsOrder = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // Collect active months present in satkers' history or periodeUpdate
  const activeMonthsSet = new Set<string>();
  satkers.forEach(s => {
    const history = ensureMonthlyHistory(s);
    history.forEach(h => {
      if (h.bulan) {
        const mCapital = h.bulan.charAt(0).toUpperCase() + h.bulan.slice(1).toLowerCase();
        activeMonthsSet.add(mCapital);
      }
    });
    if (s.periodeUpdate) {
      monthsOrder.forEach(m => {
        if (s.periodeUpdate.toLowerCase().includes(m.toLowerCase())) {
          activeMonthsSet.add(m);
        }
      });
    }
  });

  let availableMonths = monthsOrder.filter(m => activeMonthsSet.has(m));
  if (availableMonths.length === 0) {
    availableMonths = ['Januari'];
  }

  return availableMonths.map(m => {
    let sumIKPA = 0;
    let sumOutput = 0;
    let sumDeviasi = 0;
    let sumPenyerapan = 0;
    let count = 0;

    satkers.forEach(s => {
      const history = ensureMonthlyHistory(s);
      const match = history.find(h => h.bulan.toLowerCase() === m.toLowerCase());
      if (match) {
        sumIKPA += match.nilaiIKPA;
        sumOutput += match.capaianOutput;
        sumDeviasi += match.deviasiHal3Dipa;
        sumPenyerapan += match.penyerapanAnggaran;
        count++;
      }
    });

    return {
      bulan: m,
      avgIKPA: count > 0 ? Number((sumIKPA / count).toFixed(2)) : 0,
      avgCapaianOutput: count > 0 ? Number((sumOutput / count).toFixed(1)) : 0,
      avgDeviasiHal3Dipa: count > 0 ? Number((sumDeviasi / count).toFixed(1)) : 0,
      avgPenyerapan: count > 0 ? Number((sumPenyerapan / count).toFixed(1)) : 0
    };
  });
}

/**
 * Extracts 3-digit BA code from Kementerian/Lembaga string (e.g. "BA 015 - W13 ...")
 */
export function extractKodeBA(klString?: string): string {
  if (!klString) return '015';
  const match = klString.match(/BA\s*(\d{3})/i) || klString.match(/\b(\d{3})\b/);
  if (match) return match[1];
  return '015';
}

/**
 * Computes default satker password in format: [KodeSatker][KodeBA][KodeKPPN]
 * e.g. 527272 + 015 + 026 => 527272015026
 */
export function getSatkerDefaultPassword(satker: SatkerIKPA): string {
  if (satker.passwordSatker && satker.passwordSatker.trim() !== '') {
    return satker.passwordSatker.trim();
  }
  const ba = satker.kodeBa || extractKodeBA(satker.kementerianLembaga);
  const kppn = satker.kodeKppn || '026';
  return `${satker.kodeSatker}${ba}${kppn}`;
}

