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
      recommendations: ['Silakan unggah data Excel IKPA dari OM-SPAN untuk memulai analisis otomatis.']
    };
  }

  // If only 1 month is present (e.g. initial upload for January)
  if (history.length === 1) {
    const cur = history[0];
    const currentScore = cur.nilaiIKPA;
    const optimalIndicators: string[] = [];
    const bottleneckIndicators: string[] = [];
    const recommendations: string[] = [];

    if (cur.revisiDipa >= 95) optimalIndicators.push('Revisi DIPA optimal (100.00)');
    else bottleneckIndicators.push(`Revisi DIPA masih ${cur.revisiDipa}`);

    if (cur.deviasiHal3Dipa >= 90) optimalIndicators.push('Deviasi Hal III DIPA sangat terkendali (100.00)');
    else bottleneckIndicators.push(`Deviasi Hal III DIPA perlu disesuaikan (${cur.deviasiHal3Dipa})`);

    if (cur.pengelolaanUpTup >= 95) optimalIndicators.push('Pengelolaan UP & TUP disiplin (100.00)');
    else bottleneckIndicators.push(`Pengelolaan UP/TUP belum optimal (${cur.pengelolaanUpTup})`);

    if (cur.penyerapanAnggaran < 75) {
      bottleneckIndicators.push(`Penyerapan anggaran masih ${cur.penyerapanAnggaran.toFixed(1)}% (Perlu akselerasi belanja)`);
      recommendations.push('Akselerasi realisasi kegiatan operasional dan segera ajukan SPM belanja barang/modal ke KPPN.');
    } else {
      optimalIndicators.push(`Penyerapan anggaran mencapai target (${cur.penyerapanAnggaran.toFixed(1)}%)`);
    }

    if (cur.capaianOutput < 70) {
      bottleneckIndicators.push(`Capaian Output SAKTI masih ${cur.capaianOutput.toFixed(1)}% (Bobot terbesar: 25%)`);
      recommendations.push('Segera lakukan konfirmasi dan pengunggahan capaian rincian output (RO) pada aplikasi SAKTI.');
    } else {
      optimalIndicators.push(`Capaian Output SAKTI baik (${cur.capaianOutput.toFixed(1)}%)`);
    }

    if (cur.dispensasiSpm < 100 && cur.dispensasiSpm > 0) {
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
      highestMonth: { bulan: cur.bulan, score: currentScore },
      lowestMonth: { bulan: cur.bulan, score: currentScore },
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

  const scoreChange = Number((latest.nilaiIKPA - previous.nilaiIKPA).toFixed(2));
  const totalPeriodChange = Number((latest.nilaiIKPA - initial.nilaiIKPA).toFixed(2));

  let trendDirection: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
  if (scoreChange > 0.3) trendDirection = 'UP';
  else if (scoreChange < -0.3) trendDirection = 'DOWN';

  // Find highest and lowest month
  let highest = history[0];
  let lowest = history[0];
  history.forEach(m => {
    if (m.nilaiIKPA > highest.nilaiIKPA) highest = m;
    if (m.nilaiIKPA < lowest.nilaiIKPA) lowest = m;
  });

  // Calculate indicator shifts between latest and previous month
  const dOutput = Number((latest.capaianOutput - previous.capaianOutput).toFixed(2));
  const dDeviasi = Number((latest.deviasiHal3Dipa - previous.deviasiHal3Dipa).toFixed(2));
  const dPenyerapan = Number((latest.penyerapanAnggaran - previous.penyerapanAnggaran).toFixed(2));
  const dRevisi = Number((latest.revisiDipa - previous.revisiDipa).toFixed(2));
  const dUpTup = Number((latest.pengelolaanUpTup - previous.pengelolaanUpTup).toFixed(2));
  const dKontrak = Number((latest.belanjaKontraktual - previous.belanjaKontraktual).toFixed(2));
  const dTagihan = Number((latest.penyelesaianTagihan - previous.penyelesaianTagihan).toFixed(2));

  const mainDriversUp: string[] = [];
  const mainDriversDown: string[] = [];

  if (dOutput > 3) {
    mainDriversUp.push(`Peningkatan Indikator Capaian Output (+${dOutput.toFixed(1)} poin, dari ${previous.capaianOutput} menjadi ${latest.capaianOutput}) setelah pemutakhiran data SAKTI.`);
  } else if (dOutput < -3) {
    mainDriversDown.push(`Penurunan Indikator Capaian Output (${dOutput.toFixed(1)} poin, dari ${previous.capaianOutput} ke ${latest.capaianOutput}) akibat kendala konfirmasi RO.`);
  }

  if (dDeviasi > 3) {
    mainDriversUp.push(`Perbaikan akurasi RPD Hal III DIPA (+${dDeviasi.toFixed(1)} poin, dari ${previous.deviasiHal3Dipa} ke ${latest.deviasiHal3Dipa}).`);
  } else if (dDeviasi < -3) {
    mainDriversDown.push(`Pembengkakan Deviasi Halaman III DIPA (${dDeviasi.toFixed(1)} poin, dari ${previous.deviasiHal3Dipa} menjadi ${latest.deviasiHal3Dipa}) karena realisasi tidak sesuai jadwal RPD.`);
  }

  if (dPenyerapan > 3) {
    mainDriversUp.push(`Akselerasi penyerapan anggaran (+${dPenyerapan.toFixed(1)} poin, dari ${previous.penyerapanAnggaran.toFixed(1)}% ke ${latest.penyerapanAnggaran.toFixed(1)}%).`);
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
    narrative = `Pada periode ${latest.bulan}, nilai IKPA ${satkerName} mengalami KENAIKAN sebesar +${scoreChange} poin (dari ${previous.nilaiIKPA.toFixed(2)} di bulan ${previous.bulan} menjadi ${latest.nilaiIKPA.toFixed(2)}). Performa terbaik tercatat pada bulan ${highest.bulan} (${highest.nilaiIKPA.toFixed(2)}). ${
      mainDriversUp.length > 0 ? `Pendorong utama kenaikan adalah ${mainDriversUp[0]}` : ''
    }`;
  } else if (trendDirection === 'DOWN') {
    narrative = `Pada periode ${latest.bulan}, nilai IKPA ${satkerName} mengalami PENURUNAN sebesar ${Math.abs(scoreChange)} poin (dari ${previous.nilaiIKPA.toFixed(2)} di bulan ${previous.bulan} menjadi ${latest.nilaiIKPA.toFixed(2)}). ${
      mainDriversDown.length > 0 ? `Faktor penurunan disebabkan oleh ${mainDriversDown[0]}` : ''
    }`;
  } else {
    narrative = `Performa IKPA ${satkerName} relatif STABIL di angka ${latest.nilaiIKPA.toFixed(2)} pada bulan ${latest.bulan} dibanding bulan ${previous.bulan} (${previous.nilaiIKPA.toFixed(2)}).`;
  }

  // Dynamic Recommendations
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
    recommendations.push('Pertahankan konsistensi perekaman data SAKTI dan jaga deviasi Hal III DIPA tetap di bawah 5% untuk mempertahankan predikat Sangat Baik.');
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

