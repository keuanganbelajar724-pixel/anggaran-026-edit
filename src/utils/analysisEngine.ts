import { SatkerIKPA, RiwayatBulananIKPA, PejabatDanOperator } from '../types';

/**
 * Ensures a Satker has complete Pejabat Dan Operator data
 */
export function ensurePejabatOperator(satker: SatkerIKPA): PejabatDanOperator {
  if (satker.pejabatOperator && Object.keys(satker.pejabatOperator).length > 0) {
    return satker.pejabatOperator;
  }

  const kode = satker.kodeSatker;

  return {
    kpa: {
      nama: '',
      nip: '',
      noHp: '',
      email: ''
    },
    ppk: {
      nama: '',
      nip: '',
      noHp: '',
      email: ''
    },
    ppspm: {
      nama: '',
      nip: '',
      noHp: '',
      email: ''
    },
    bendahara: {
      nama: '',
      nip: '',
      noHp: '',
      email: ''
    },
    operatorKomitmen: {
      nama: '',
      nip: '',
      noHp: '',
      email: ''
    },
    operatorPembayaran: {
      nama: '',
      nip: '',
      noHp: '',
      email: ''
    },
    operatorPelaporan: {
      nama: satker.namaPic || '',
      nip: '',
      noHp: satker.noHpPic || '',
      email: satker.emailPic || ''
    },
    operatorGaji: {
      nama: '',
      nip: '',
      noHp: '',
      email: ''
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
  if (!history || history.length === 0) {
    return {
      trendDirection: 'STABLE',
      latestScore: 0,
      previousScore: 0,
      scoreChange: 0,
      highestMonth: { bulan: '-', score: 0 },
      lowestMonth: { bulan: '-', score: 0 },
      mainDriversUp: [],
      mainDriversDown: [],
      narrativeSummary: 'Belum ada data riwayat IKPA yang diunggah.',
      recommendations: ['Silakan unggah data Excel IKPA dari My Intress / SAKTI untuk memulai analisis otomatis.']
    };
  }

  // If only 1 month is present (e.g. initial upload for January)
  if (history.length === 1) {
    const cur = history[0];
    const currentScore = Number.isFinite(cur.nilaiIKPA) ? Number(cur.nilaiIKPA) : 0;
    const optimalIndicators: string[] = [];
    const bottleneckIndicators: string[] = [];
    const recommendations: string[] = [];

    const revisi = Number.isFinite(cur.revisiDipa) ? Number(cur.revisiDipa) : 0;
    const deviasi = Number.isFinite(cur.deviasiHal3Dipa) ? Number(cur.deviasiHal3Dipa) : 0;
    const upTup = Number.isFinite(cur.pengelolaanUpTup) ? Number(cur.pengelolaanUpTup) : 0;
    const penyerapan = Number.isFinite(cur.penyerapanAnggaran) ? Number(cur.penyerapanAnggaran) : 0;
    const output = Number.isFinite(cur.capaianOutput) ? Number(cur.capaianOutput) : 0;
    const dispen = Number.isFinite(cur.dispensasiSpm) ? Number(cur.dispensasiSpm) : 0;

    if (revisi >= 95) optimalIndicators.push('Revisi DIPA optimal (100.00)');
    else bottleneckIndicators.push(`Revisi DIPA masih ${revisi.toFixed(1)}`);

    if (deviasi >= 90) optimalIndicators.push('Deviasi Hal III DIPA sangat terkendali (100.00)');
    else bottleneckIndicators.push(`Deviasi Hal III DIPA perlu disesuaikan (${deviasi.toFixed(1)})`);

    if (upTup >= 95) optimalIndicators.push('Pengelolaan UP & TUP disiplin (100.00)');
    else bottleneckIndicators.push(`Pengelolaan UP/TUP belum optimal (${upTup.toFixed(1)})`);

    if (penyerapan < 75) {
      bottleneckIndicators.push(`Penyerapan anggaran masih ${penyerapan.toFixed(1)}% (Perlu akselerasi belanja)`);
      recommendations.push('Akselerasi realisasi kegiatan operasional dan segera ajukan SPM belanja barang/modal ke KPPN.');
    } else {
      optimalIndicators.push(`Penyerapan anggaran mencapai target (${penyerapan.toFixed(1)}%)`);
    }

    if (output < 70) {
      bottleneckIndicators.push(`Capaian Output SAKTI masih ${output.toFixed(1)}% (Bobot terbesar: 25%)`);
      recommendations.push('Segera lakukan konfirmasi dan pengunggahan capaian rincian output (RO) pada aplikasi SAKTI.');
    } else {
      optimalIndicators.push(`Capaian Output SAKTI baik (${output.toFixed(1)}%)`);
    }

    if (dispen < 100 && dispen > 0) {
      bottleneckIndicators.push('Terdapat pengajuan Dispensasi SPM yang berpotensi mengurangi poin');
      recommendations.push('Hindari keterlambatan pengajuan SPM pada akhir periode untuk mencegah dispensasi.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Pertahankan kinerja optimal dan disiplin pelaporan SAKTI setiap bulannya.');
    }

    const narrative = `Posisi awal kinerja IKPA ${satkerName} pada periode ${cur.bulan} tercatat sebesar ${currentScore.toFixed(2)} poin. ${
      bottleneckIndicators.length > 0
        ? `Area yang menjadi faktor pembatas (bottleneck) utama adalah ${bottleneckIndicators.slice(0, 2).join(' serta ')}.`
        : 'Seluruh indikator kinerja utama berada pada posisi optimal.'
    }`;

    return {
      trendDirection: 'STABLE',
      latestScore: currentScore,
      previousScore: currentScore,
      scoreChange: 0,
      highestMonth: { bulan: cur.bulan || '-', score: currentScore },
      lowestMonth: { bulan: cur.bulan || '-', score: currentScore },
      mainDriversUp: optimalIndicators,
      mainDriversDown: bottleneckIndicators,
      narrativeSummary: narrative,
      recommendations
    };
  }

  // Multi-month comparison (e.g. Februari vs Januari)
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  const initial = history[0];

  const latestIKPA = Number.isFinite(latest.nilaiIKPA) ? Number(latest.nilaiIKPA) : 0;
  const previousIKPA = Number.isFinite(previous.nilaiIKPA) ? Number(previous.nilaiIKPA) : 0;
  const initialIKPA = Number.isFinite(initial.nilaiIKPA) ? Number(initial.nilaiIKPA) : 0;

  const scoreChange = Number((latestIKPA - previousIKPA).toFixed(2)) || 0;
  const totalPeriodChange = Number((latestIKPA - initialIKPA).toFixed(2)) || 0;

  let trendDirection: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
  if (scoreChange > 0.3) trendDirection = 'UP';
  else if (scoreChange < -0.3) trendDirection = 'DOWN';

  // Find highest and lowest month
  let highest = history[0];
  let lowest = history[0];
  history.forEach(m => {
    const mVal = Number.isFinite(m.nilaiIKPA) ? Number(m.nilaiIKPA) : 0;
    const hVal = Number.isFinite(highest.nilaiIKPA) ? Number(highest.nilaiIKPA) : 0;
    const lVal = Number.isFinite(lowest.nilaiIKPA) ? Number(lowest.nilaiIKPA) : 0;
    if (mVal > hVal) highest = m;
    if (mVal < lVal) lowest = m;
  });

  // Calculate indicator shifts between latest and previous month
  const dOutput = Number(((latest.capaianOutput || 0) - (previous.capaianOutput || 0)).toFixed(2)) || 0;
  const dDeviasi = Number(((latest.deviasiHal3Dipa || 0) - (previous.deviasiHal3Dipa || 0)).toFixed(2)) || 0;
  const dPenyerapan = Number(((latest.penyerapanAnggaran || 0) - (previous.penyerapanAnggaran || 0)).toFixed(2)) || 0;
  const dRevisi = Number(((latest.revisiDipa || 0) - (previous.revisiDipa || 0)).toFixed(2)) || 0;
  const dUpTup = Number(((latest.pengelolaanUpTup || 0) - (previous.pengelolaanUpTup || 0)).toFixed(2)) || 0;
  const dKontrak = Number(((latest.belanjaKontraktual || 0) - (previous.belanjaKontraktual || 0)).toFixed(2)) || 0;
  const dTagihan = Number(((latest.penyelesaianTagihan || 0) - (previous.penyelesaianTagihan || 0)).toFixed(2)) || 0;

  const mainDriversUp: string[] = [];
  const mainDriversDown: string[] = [];

  if (dOutput > 3) {
    mainDriversUp.push(`Peningkatan Indikator Capaian Output (+${dOutput.toFixed(1)} poin, dari ${previous.capaianOutput || 0} menjadi ${latest.capaianOutput || 0}) setelah pemutakhiran data SAKTI.`);
  } else if (dOutput < -3) {
    mainDriversDown.push(`Penurunan Indikator Capaian Output (${dOutput.toFixed(1)} poin, dari ${previous.capaianOutput || 0} ke ${latest.capaianOutput || 0}) akibat kendala konfirmasi RO.`);
  }

  if (dDeviasi > 3) {
    mainDriversUp.push(`Perbaikan akurasi RPD Hal III DIPA (+${dDeviasi.toFixed(1)} poin, dari ${previous.deviasiHal3Dipa || 0} ke ${latest.deviasiHal3Dipa || 0}).`);
  } else if (dDeviasi < -3) {
    mainDriversDown.push(`Pembengkakan Deviasi Halaman III DIPA (${dDeviasi.toFixed(1)} poin, dari ${previous.deviasiHal3Dipa || 0} menjadi ${latest.deviasiHal3Dipa || 0}) karena realisasi tidak sesuai jadwal RPD.`);
  }

  if (dPenyerapan > 3) {
    mainDriversUp.push(`Akselerasi penyerapan anggaran (+${dPenyerapan.toFixed(1)} poin, dari ${(previous.penyerapanAnggaran || 0).toFixed(1)}% ke ${(latest.penyerapanAnggaran || 0).toFixed(1)}%).`);
  } else if (dPenyerapan < -3) {
    mainDriversDown.push(`Perlambatan realisasi belanja (${dPenyerapan.toFixed(1)} poin).`);
  }

  if (dRevisi > 3) {
    mainDriversUp.push(`Optimalisasi Indikator Revisi DIPA (+${dRevisi.toFixed(1)} poin).`);
  } else if (dRevisi < -3) {
    mainDriversDown.push(`Penurunan nilai Revisi DIPA (${dRevisi.toFixed(1)} poin) akibat revisi berulang.`);
  }

  if (dUpTup > 3) {
    mainDriversUp.push(`Peningkatan kepatuhan revolving UP/TUP (+${dUpTup.toFixed(1)} poin).`);
  } else if (dUpTup < -3) {
    mainDriversDown.push(`Keterlambatan revolving UP/TUP (${dUpTup.toFixed(1)} poin).`);
  }

  // Generate Narrative Summary
  let narrative = '';
  if (trendDirection === 'UP') {
    narrative = `Pada periode ${latest.bulan}, nilai IKPA ${satkerName} mengalami KENAIKAN sebesar +${scoreChange} poin (dari ${previousIKPA.toFixed(2)} di bulan ${previous.bulan} menjadi ${latestIKPA.toFixed(2)}). Performa terbaik tercatat pada bulan ${highest.bulan} (${(Number.isFinite(highest.nilaiIKPA) ? Number(highest.nilaiIKPA) : 0).toFixed(2)}). ${
      mainDriversUp.length > 0 ? `Pendorong utama kenaikan adalah ${mainDriversUp[0]}` : ''
    }`;
  } else if (trendDirection === 'DOWN') {
    narrative = `Pada periode ${latest.bulan}, nilai IKPA ${satkerName} mengalami PENURUNAN sebesar ${Math.abs(scoreChange)} poin (dari ${previousIKPA.toFixed(2)} di bulan ${previous.bulan} menjadi ${latestIKPA.toFixed(2)}). ${
      mainDriversDown.length > 0 ? `Faktor penurunan disebabkan oleh ${mainDriversDown[0]}` : ''
    }`;
  } else {
    narrative = `Performa IKPA ${satkerName} relatif STABIL di angka ${latestIKPA.toFixed(2)} pada bulan ${latest.bulan} dibanding bulan ${previous.bulan} (${previousIKPA.toFixed(2)}).`;
  }

  // Dynamic Recommendations
  const recommendations: string[] = [];
  if ((latest.capaianOutput || 0) < 70) {
    recommendations.push('Segera lakukan konfirmasi dan unggah data Laporan Capaian Output di aplikasi SAKTI sebelum tanggal 5.');
  }
  if ((latest.deviasiHal3Dipa || 0) < 75) {
    recommendations.push('Lakukan pemutakhiran Rencana Penarikan Dana (RPD) Halaman III DIPA di SAKTI pada awal triwulan agar deviasi tetap di bawah 20%.');
  }
  if ((latest.penyerapanAnggaran || 0) < 75) {
    recommendations.push('Akselerasi penerbitan SPM belanja barang & modal yang telah selesai dilaksanakan untuk mendongkrak rasio penyerapan anggaran.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Pertahankan konsistensi perekaman data SAKTI dan jaga deviasi Hal III DIPA tetap di bawah 5% untuk mempertahankan predikat Sangat Baik.');
  }

  return {
    trendDirection,
    latestScore: latestIKPA,
    previousScore: previousIKPA,
    scoreChange,
    highestMonth: { bulan: highest.bulan || '-', score: Number.isFinite(highest.nilaiIKPA) ? Number(highest.nilaiIKPA) : 0 },
    lowestMonth: { bulan: lowest.bulan || '-', score: Number.isFinite(lowest.nilaiIKPA) ? Number(lowest.nilaiIKPA) : 0 },
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
 * Computes default satker password in format: [KodeSatker]_[KodeBA]
 * e.g. 890594 + 018 => 890594_018
 */
export function getSatkerDefaultPassword(satker: SatkerIKPA): string {
  if (satker.passwordSatker && satker.passwordSatker.trim() !== '') {
    return satker.passwordSatker.trim();
  }
  const ba = satker.kodeBa || extractKodeBA(satker.kementerianLembaga);
  return `${satker.kodeSatker}_${ba}`;
}

