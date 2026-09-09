import { UPTUPTunaiInput } from '../models/ikpa';
import { round2, average, safeDiv } from './rounding';

export interface UPTUPTunaiResult {
  rawValue: number;
  nilaiKetepatanWaktu: number;
  nilaiGupDisebulankan: number;
  nilaiSetoranTup: number;
  processedRows: any[];
}

export function calculateUPTUPTunai(inputs: UPTUPTunaiInput[]): UPTUPTunaiResult {
  if (!inputs || inputs.length === 0) {
    return {
      rawValue: 0,
      nilaiKetepatanWaktu: 0,
      nilaiGupDisebulankan: 0,
      nilaiSetoranTup: 0,
      processedRows: []
    };
  }

  const ketepatanScores: number[] = [];
  const gupDisebulankanScores: number[] = [];
  const setoranTupScores: number[] = [];

  const processedRows = inputs.map((item, idx) => {
    // 1. Selisih hari
    let selisihHari = item.selisihHariKalender ?? 30;
    if (idx > 0 && !item.selisihHariKalender && item.tanggal && inputs[idx - 1].tanggal) {
      const d1 = new Date(inputs[idx - 1].tanggal).getTime();
      const d2 = new Date(item.tanggal).getTime();
      if (!isNaN(d1) && !isNaN(d2)) {
        selisihHari = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
      }
    }
    const hariSebulan = item.totalHariSebulan ?? 30;

    // 2. Persen GUP = ROUND(Total GUP / Outstanding UP * 100, 2)
    const persenGUP =
      item.totalOutstandingUP > 0
        ? round2((item.totalGUP / item.totalOutstandingUP) * 100)
        : 0;

    // 3. Persen GUP Disebulankan: Math.min(100, (persenGUP * hariSebulan) / selisihHari)
    let gupDisebulankan: number | null = null;
    if ((item as any).nilaiPersentaseGupDisebulankan !== undefined && (item as any).nilaiPersentaseGupDisebulankan !== null) {
      gupDisebulankan = Number((item as any).nilaiPersentaseGupDisebulankan);
      gupDisebulankanScores.push(gupDisebulankan);
    } else if (selisihHari > 0 && item.totalOutstandingUP > 0 && item.totalGUP > 0) {
      const rawDisebulankan = (persenGUP * hariSebulan) / selisihHari;
      gupDisebulankan = round2(Math.min(100, rawDisebulankan));
      gupDisebulankanScores.push(gupDisebulankan);
    }

    // 4. Nilai ketepatan waktu
    let scoreKetepatan: number | null = null;
    if ((item as any).nilaiKetepatanWaktu !== undefined && (item as any).nilaiKetepatanWaktu !== null) {
      scoreKetepatan = Number((item as any).nilaiKetepatanWaktu);
      ketepatanScores.push(scoreKetepatan);
    } else if (item.status && item.status !== '-') {
      scoreKetepatan = item.status.toUpperCase().includes('TEPAT') ? 100 : 0;
      ketepatanScores.push(scoreKetepatan);
    }

    // 5. Nilai setoran TUP: 100 - (totalSetoranTUP / totalTUP * 100)
    let scoreSetoranTup: number | null = null;
    if ((item as any).nilaiSetoranTup !== undefined && (item as any).nilaiSetoranTup !== null) {
      scoreSetoranTup = Number((item as any).nilaiSetoranTup);
      setoranTupScores.push(scoreSetoranTup);
    } else if (item.totalTUP > 0) {
      if (item.totalSetoranTUP === 0) {
        scoreSetoranTup = 100;
      } else {
        scoreSetoranTup = round2(
          Math.max(0, 100 - (item.totalSetoranTUP / item.totalTUP) * 100)
        );
      }
      setoranTupScores.push(scoreSetoranTup);
    }

    return {
      ...item,
      selisihHari,
      persenGUP,
      gupDisebulankan,
      scoreKetepatan,
      scoreSetoranTup
    };
  });

  const avgKetepatan = ketepatanScores.length > 0 ? round2(average(ketepatanScores)) : 100;
  const avgGupDisebulankan =
    gupDisebulankanScores.length > 0 ? round2(average(gupDisebulankanScores)) : 100;
  const avgSetoranTup =
    setoranTupScores.length > 0 ? round2(average(setoranTupScores)) : 100;

  // Weights: Ketepatan 50%, GUP 25%, TUP 25%
  const rawValue = round2(
    0.50 * avgKetepatan + 0.25 * avgGupDisebulankan + 0.25 * avgSetoranTup
  );

  return {
    rawValue,
    nilaiKetepatanWaktu: avgKetepatan,
    nilaiGupDisebulankan: avgGupDisebulankan,
    nilaiSetoranTup: avgSetoranTup,
    processedRows
  };
}
