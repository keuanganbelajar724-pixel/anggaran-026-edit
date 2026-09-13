import { UPTUPTunaiInput } from '../models/ikpa';
import { round2, excelAverage } from './rounding';

export interface UPTUPTunaiTransaction extends UPTUPTunaiInput {
  id?: string;
}

export interface ProcessedUPTunaiRow {
  no: number;
  kodeSatker: string;
  namaSatker: string;
  kodeKPPN: string;
  sumberDana: string;
  jenis: 'UP' | 'GUP' | 'GUP NIHIL' | 'TUP' | 'SETORAN TUP' | 'GTUP NIHIL';
  tanggal: string;
  selisihHariKalender: number; // Kolom H
  totalGU: number; // Kolom I
  totalOutstandingUP: number; // Kolom J
  persen: number; // Kolom K (% Revolving GUP)
  status: '-' | 'TEPAT WAKTU' | 'TERLAMBAT'; // Kolom L
  totalHariSebulan: number; // Kolom M
  persenGupDisebulankan: number | null; // Kolom N
  totalTUP: number; // Kolom O
  totalSetoranTUP: number; // Kolom P
  nilaiKetepatanWaktu: number | '-'; // Kolom Q
  nilaiPersentaseGupDisebulankan: number | null; // Kolom R
  nilaiSetoranTup: number; // Kolom S
}

export interface UPTUPTunaiResult {
  rawValue: number; // Q28: (50%*Q27) + (25%*R27) + (25%*S27) unrounded raw
  nilaiKetepatanWaktu: number; // Q27: ROUND(AVERAGE(Q5:Q26), 2)
  nilaiGupDisebulankan: number; // R27: ROUND(AVERAGE(R5:R26), 2)
  nilaiSetoranTup: number; // S27: ROUND(AVERAGE(S5:S26), 2)
  processedRows: ProcessedUPTunaiRow[];
}

/**
 * Menghitung selisih hari kalender murni antara dua tanggal ISO (YYYY-MM-DD)
 */
export function getCalendarDaysDiff(dateEarlyStr: string, dateLateStr: string): number {
  if (!dateEarlyStr || !dateLateStr) return 0;
  const d1 = new Date(dateEarlyStr.includes('T') ? dateEarlyStr.split('T')[0] : dateEarlyStr).getTime();
  const d2 = new Date(dateLateStr.includes('T') ? dateLateStr.split('T')[0] : dateLateStr).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}

/**
 * Menghitung jumlah hari kalender dalam sebulan (28/29/30/31) dari string tanggal
 */
export function getDaysInMonthFromDateString(dateStr: string): number {
  if (!dateStr) return 30;
  const d = new Date(dateStr.includes('T') ? dateStr.split('T')[0] : dateStr);
  if (isNaN(d.getTime())) return 30;
  // new Date(year, monthIndex + 1, 0) menghasilkan tanggal terakhir dari bulan tersebut
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/**
 * Menghitung otomatis Total Hari Sebulan (Kolom M) sesuai PER-5/PB/2024:
 * Jumlah hari kalender pada bulan awal interval (transaksi UP/GUP sebelumnya).
 * Misal:
 * - 20 Januari ke 11 Februari -> 31 hari (Januari = 31)
 * - 11 Februari ke 25 Februari -> 28 hari (Februari 2026 = 28)
 * - 20 Februari ke 20 Maret -> 28 hari (Februari = 28)
 * - Transaksi pertama UP -> 0
 */
export function calculateAutoDaysInMonth(
  transactions: UPTUPTunaiInput[],
  index: number
): number {
  const current = transactions[index];
  if (!current || index === 0 || current.jenis === 'UP' || current.jenis === 'TUP') {
    return 0;
  }
  const prev = getPreviousRelevantTransaction(transactions, index);
  if (prev && prev.tanggal) {
    return getDaysInMonthFromDateString(prev.tanggal);
  }
  if (current.tanggal) {
    return getDaysInMonthFromDateString(current.tanggal);
  }
  return 30;
}

/**
 * Menentukan transaksi sebelumnya yang relevan untuk perhitungan selisih hari (Kompatibel Excel):
 * - SETORAN TUP (H25) = G25 - G22 (mengacu ke tanggal transaksi TUP)
 * - GTUP NIHIL (H26) = G26 - G22 (mengacu ke tanggal transaksi TUP)
 * - GUP setelah TUP (H23) = G23 - G21 (mengacu ke transaksi GUP sebelumnya yang relevan, melewati TUP)
 * - Transaksi normal lainnya = transaksi langsung sebelumnya
 */
export function getPreviousRelevantTransaction(
  transactions: UPTUPTunaiInput[],
  currentIndex: number
): UPTUPTunaiInput | null {
  const current = transactions[currentIndex];
  if (!current || currentIndex === 0) return null;

  // Aturan 12 & 13: SETORAN TUP & GTUP NIHIL mengacu ke TUP
  if (current.jenis === 'SETORAN TUP' || current.jenis === 'GTUP NIHIL') {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (transactions[i].jenis === 'TUP') {
        return transactions[i];
      }
    }
  }

  // Aturan 11: GUP setelah TUP mengacu ke GUP/UP sebelumnya, bukan TUP
  if (current.jenis === 'GUP') {
    if (transactions[currentIndex - 1]?.jenis === 'TUP') {
      for (let i = currentIndex - 2; i >= 0; i--) {
        if (transactions[i].jenis === 'GUP' || transactions[i].jenis === 'UP') {
          return transactions[i];
        }
      }
    }
  }

  return transactions[currentIndex - 1];
}

/**
 * Formula Excel Nilai Ketepatan Waktu:
 * =IF(L="-", "-", IF(L="TEPAT WAKTU", 100, 0))
 * "-" harus dipertahankan sebagai teks agar Excel AVERAGE mengabaikannya.
 */
export function calculateKetepatanWaktu(status?: string | null): number | '-' {
  if (!status || status === '-') {
    return '-';
  }
  const cleanStatus = status.trim().toUpperCase();
  if (cleanStatus === 'TEPAT WAKTU') {
    return 100;
  }
  return 0;
}

/**
 * Formula Excel Persen GUP Disebulankan:
 * N = ROUND(IF(K*M/H > 100, 100, K*M/H), 2)
 */
export function calculateGUPDisebulankan(
  persenGUP: number,
  totalHariSebulan: number,
  selisihHari: number
): number {
  if (selisihHari <= 0 || persenGUP <= 0) return 0;
  const value = (persenGUP * totalHariSebulan) / selisihHari;
  return round2(Math.min(value, 100));
}

/**
 * Formula Excel Nilai Setoran TUP:
 * =IF(P=0, 100, ROUND(100 - (P / O * 100), 2))
 */
export function calculateSetoranTUP(totalSetoranTUP: number, totalTUP: number): number {
  if (totalSetoranTUP === 0 || totalTUP === 0) {
    return 100;
  }
  return round2(100 - ((totalSetoranTUP / totalTUP) * 100));
}

/**
 * Mesin Perhitungan Utama Pengelolaan UP/TUP Tunai (PER-5/PB/2024 & Excel Workbook Compatible)
 */
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

  const qValues: Array<number | '-'> = [];
  const rValues: Array<number | null> = [];
  const sValues: number[] = [];

  let runningTUP = 0;
  let runningSetoranTUP = 0;

  const processedRows: ProcessedUPTunaiRow[] = inputs.map((item, index) => {
    const no = item.no || index + 1;
    const kodeSatker = item.kodeSatker || '';
    const namaSatker = item.namaSatker || '';
    const kodeKPPN = item.kodeKPPN || '';
    const sumberDana = item.sumberDana || 'RM';
    const jenis = item.jenis || 'GUP';
    const tanggal = item.tanggal || '';
    const totalGU = Number(item.totalGUP ?? (item as any).totalGU ?? 0);

    // Track TUP and Setoran TUP running values
    if (jenis === 'TUP') {
      runningTUP = totalGU;
    }
    if (jenis === 'SETORAN TUP') {
      runningSetoranTUP = Number(item.totalSetoranTUP || totalGU || 0);
    }

    const totalTUP = runningTUP;
    const totalSetoranTUP =
      jenis === 'SETORAN TUP' || jenis === 'GTUP NIHIL'
        ? (Number(item.totalSetoranTUP) || runningSetoranTUP)
        : 0;

    // 1. Selisih Hari Kalender (Kolom H)
    let selisihHari = 0;
    if (index === 0 || jenis === 'UP' || jenis === 'TUP') {
      selisihHari = 0;
    } else {
      const prev = getPreviousRelevantTransaction(inputs, index);
      if (prev && prev.tanggal && tanggal) {
        selisihHari = getCalendarDaysDiff(prev.tanggal, tanggal);
      } else if (typeof item.selisihHariKalender === 'number') {
        selisihHari = item.selisihHariKalender;
      }
    }

    // 2. Total Outstanding UP (Kolom J)
    let totalOutstandingUP = Number(item.totalOutstandingUP ?? 0);
    if (jenis === 'SETORAN TUP') {
      // J25 = I22 - I25 (Total TUP - Setoran TUP)
      totalOutstandingUP = Math.max(0, totalTUP - totalSetoranTUP);
    } else if (jenis === 'GTUP NIHIL' || jenis === 'GUP NIHIL') {
      totalOutstandingUP = 0;
    }

    // 3. Persen GUP (Kolom K)
    let persen = 0;
    if (jenis === 'GUP' && totalOutstandingUP > 0) {
      persen = round2((totalGU / totalOutstandingUP) * 100);
    }

    // 4. Status (Kolom L)
    const status: '-' | 'TEPAT WAKTU' | 'TERLAMBAT' =
      item.status === 'TEPAT WAKTU' || item.status === 'TERLAMBAT' ? item.status : '-';

    // 5. Total Hari Sebulan (Kolom M)
    let totalHariSebulan: number;
    if (typeof item.totalHariSebulan === 'number' && item.totalHariSebulan !== 0) {
      totalHariSebulan = item.totalHariSebulan;
    } else if (jenis === 'UP' || jenis === 'TUP' || index === 0) {
      totalHariSebulan = item.totalHariSebulan ?? 0;
    } else {
      totalHariSebulan = calculateAutoDaysInMonth(inputs, index);
    }

    // 6. Persen GUP Disebulankan (Kolom N) & Nilai Persentase GUP Disebulankan (Kolom R)
    let persenGupDisebulankan: number | null = null;
    let nilaiPersentaseGupDisebulankan: number | null = null;

    if (jenis === 'GUP') {
      if (persen === 0 || totalOutstandingUP === 0) {
        persenGupDisebulankan = 0;
      } else if (selisihHari > 0) {
        persenGupDisebulankan = calculateGUPDisebulankan(persen, totalHariSebulan, selisihHari);
      } else {
        persenGupDisebulankan = 100;
      }
      nilaiPersentaseGupDisebulankan = persenGupDisebulankan;
      rValues.push(nilaiPersentaseGupDisebulankan);
    } else {
      // Untuk baris yang bukan GUP, biarkan kosong (null) seperti Excel
      rValues.push(null);
    }

    // 7. Nilai Ketepatan Waktu (Kolom Q)
    const nilaiKetepatanWaktu = calculateKetepatanWaktu(status);
    qValues.push(nilaiKetepatanWaktu);

    // 8. Nilai Setoran TUP (Kolom S)
    const nilaiSetoranTup = calculateSetoranTUP(totalSetoranTUP, totalTUP);
    sValues.push(nilaiSetoranTup);

    return {
      no,
      kodeSatker,
      namaSatker,
      kodeKPPN,
      sumberDana,
      jenis,
      tanggal,
      selisihHariKalender: selisihHari,
      totalGU,
      totalOutstandingUP,
      persen,
      status,
      totalHariSebulan,
      persenGupDisebulankan,
      totalTUP,
      totalSetoranTUP,
      nilaiKetepatanWaktu,
      nilaiPersentaseGupDisebulankan,
      nilaiSetoranTup
    };
  });

  // Komponen rata-rata Excel:
  // Q27 = ROUND(AVERAGE(Q5:Q26), 2)
  // R27 = ROUND(AVERAGE(R5:R26), 2)
  // S27 = ROUND(AVERAGE(S5:S26), 2)
  const hasFinancialActivity = inputs.some(
    r => (Number(r.totalGUP) > 0) ||
         (Number(r.totalOutstandingUP) > 0) ||
         (Number(r.totalTUP) > 0) ||
         (Number(r.totalSetoranTUP) > 0) ||
         (r.status === 'TEPAT WAKTU' || r.status === 'TERLAMBAT')
  );

  const nilaiKetepatanWaktu = round2(excelAverage(qValues));
  const nilaiGupDisebulankan = round2(excelAverage(rValues));
  const nilaiSetoranTup = hasFinancialActivity ? round2(excelAverage(sValues)) : 0;

  // Q28 = (50%*Q27) + (25%*R27) + (25%*S27)
  // Tidak dibulatkan di Q28 (simpan raw result unrounded sesuai Excel)
  const rawValue = hasFinancialActivity
    ? (0.50 * nilaiKetepatanWaktu) + (0.25 * nilaiGupDisebulankan) + (0.25 * nilaiSetoranTup)
    : 0;

  return {
    rawValue,
    nilaiKetepatanWaktu: hasFinancialActivity ? nilaiKetepatanWaktu : 0,
    nilaiGupDisebulankan: hasFinancialActivity ? nilaiGupDisebulankan : 0,
    nilaiSetoranTup,
    processedRows
  };
}
