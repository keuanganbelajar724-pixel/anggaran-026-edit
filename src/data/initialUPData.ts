import { PengelolaanUPRecord, KarwasTUPRecord } from '../types';

/**
 * Utility to safely parse dashboard reference date from string like "31 Agustus 2026 - 08:40 WIB"
 */
export function parseDashboardReferenceDate(dateStr?: string): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date();
  }

  const str = dateStr.trim();
  
  // Try DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return new Date(year, month, day);
  }

  // Indonesian month pattern: "31 Agustus 2026"
  const indoMonths: { [k: string]: number } = {
    januari: 0, jan: 0,
    februari: 1, feb: 1,
    maret: 2, mar: 2,
    april: 3, apr: 3,
    mei: 4, may: 4,
    juni: 5, jun: 5,
    juli: 6, jul: 6,
    agustus: 7, agu: 7, ags: 7, aug: 7,
    september: 8, sep: 8, sept: 8,
    oktober: 9, okt: 9, oct: 9,
    november: 10, nov: 10,
    desember: 11, des: 11, dec: 11
  };

  const words = str.toLowerCase().split(/[\s,/-]+/);
  let foundDay: number | null = null;
  let foundMonth: number | null = null;
  let foundYear: number | null = null;

  for (const w of words) {
    if (indoMonths[w] !== undefined && foundMonth === null) {
      foundMonth = indoMonths[w];
    } else if (/^\d{4}$/.test(w) && foundYear === null) {
      foundYear = parseInt(w, 10);
    } else if (/^\d{1,2}$/.test(w) && foundDay === null) {
      foundDay = parseInt(w, 10);
    }
  }

  if (foundDay !== null && foundMonth !== null && foundYear !== null) {
    return new Date(foundYear, foundMonth, foundDay);
  }

  const direct = new Date(str);
  if (!isNaN(direct.getTime())) {
    return direct;
  }

  return new Date();
}

/**
 * Utility to parse and evaluate deadline dates for UP (Kolom N) and TUP (Kolom H)
 */
export function evaluateDeadlineDate(rawDateVal: any, referenceDate: Date = new Date()): {
  formattedDate: string;
  sisaHari: number;
  is1Minggu: boolean;
  isHariIni: boolean;
  isOverdue: boolean;
  isWeekend: boolean;
  dayName: string;
  saranTglPengajuan: string;
} {
  let parsedDate: Date | null = null;
  let rawStr = '';

  if (rawDateVal instanceof Date && !isNaN(rawDateVal.getTime())) {
    parsedDate = rawDateVal;
  } else if (typeof rawDateVal === 'number' && rawDateVal > 30000 && rawDateVal < 60000) {
    // Excel Serial Date Number
    const utcDays = Math.floor(rawDateVal - 25569);
    const utcValue = utcDays * 86400;
    parsedDate = new Date(utcValue * 1000);
  } else if (rawDateVal) {
    rawStr = String(rawDateVal).trim();
    
    // Check format DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = rawStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      parsedDate = new Date(year, month, day);
    } else {
      // Check format YYYY-MM-DD
      const ymdMatch = rawStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
      if (ymdMatch) {
        const year = parseInt(ymdMatch[1], 10);
        const month = parseInt(ymdMatch[2], 10) - 1;
        const day = parseInt(ymdMatch[3], 10);
        parsedDate = new Date(year, month, day);
      } else {
        // Indonesian month names matching
        const indoMonths: { [k: string]: number } = {
          januari: 0, jan: 0,
          februari: 1, feb: 1,
          maret: 2, mar: 2,
          april: 3, apr: 3,
          mei: 4, may: 4,
          juni: 5, jun: 5,
          juli: 6, jul: 6,
          agustus: 7, agu: 7, ags: 7, aug: 7,
          september: 8, sep: 8, sept: 8,
          oktober: 9, okt: 9, oct: 9,
          november: 10, nov: 10,
          desember: 11, des: 11, dec: 11
        };

        const words = rawStr.toLowerCase().split(/[\s,/-]+/);
        let foundDay: number | null = null;
        let foundMonth: number | null = null;
        let foundYear: number | null = null;

        for (const w of words) {
          if (indoMonths[w] !== undefined) {
            foundMonth = indoMonths[w];
          } else if (/^\d{4}$/.test(w)) {
            foundYear = parseInt(w, 10);
          } else if (/^\d{1,2}$/.test(w) && foundDay === null) {
            foundDay = parseInt(w, 10);
          }
        }

        if (foundDay !== null && foundMonth !== null && foundYear !== null) {
          parsedDate = new Date(foundYear, foundMonth, foundDay);
        } else {
          const direct = new Date(rawStr);
          if (!isNaN(direct.getTime())) {
            parsedDate = direct;
          }
        }
      }
    }
  }

  // Fallback if parsing fails
  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return {
      formattedDate: rawStr || '-',
      sisaHari: 999,
      is1Minggu: false,
      isHariIni: false,
      isOverdue: false,
      isWeekend: false,
      dayName: '',
      saranTglPengajuan: 'Ajukan paling lambat hari kerja sebelum jatuh tempo'
    };
  }

  // Calculate day difference against reference date normalized to 00:00:00
  const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const target = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
  
  const diffTime = target.getTime() - ref.getTime();
  const sisaHari = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const dayOfWeek = parsedDate.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayName = dayNames[dayOfWeek];
  const formattedDate = `${parsedDate.getDate()} ${monthNames[parsedDate.getMonth()]} ${parsedDate.getFullYear()}`;

  // Suggest working day before weekend
  let saranDate = new Date(target);
  if (dayOfWeek === 0) { // Sunday -> suggest Friday (-2 days)
    saranDate.setDate(target.getDate() - 2);
  } else if (dayOfWeek === 6) { // Saturday -> suggest Friday (-1 day)
    saranDate.setDate(target.getDate() - 1);
  }

  const saranTglPengajuan = isWeekend
    ? `Jumat, ${saranDate.getDate()} ${monthNames[saranDate.getMonth()]} ${saranDate.getFullYear()} (HARI KERJA SEBELUM LIBUR)`
    : `${dayName}, ${formattedDate}`;

  const isOverdue = sisaHari < 0;
  const isHariIni = sisaHari === 0;
  const is1Minggu = sisaHari <= 7; // Includes overdue and within 7 days

  return {
    formattedDate,
    sisaHari,
    is1Minggu,
    isHariIni,
    isOverdue,
    isWeekend,
    dayName,
    saranTglPengajuan
  };
}

export interface UPRecordEvaluatedStatus {
  rawDeadline: string;
  formattedDeadline: string;
  fullDateWithDay: string;
  sisaHari: number;
  isNihil: boolean;
  isTelat: boolean; // Overdue & not nihil (MERAH)
  isHariIni: boolean; // Exact today & not nihil (KUNING)
  isMendekati1Minggu: boolean; // 1 <= sisaHari <= 7 (AMBER)
  isDalam1Minggu: boolean; // Telat + Hari Ini + Mendekati 1 Minggu
  isAman: boolean; // > 7 hari & not nihil
  isWeekend: boolean;
  dayName: string;
  saranTglPengajuan: string;
  badgeLabel: string;
  badgeColorClass: string;
  textColorClass: string;
  rowBorderClass: string;
}

/**
 * Unified evaluator for UP / TUP records respecting Kolom M (0% Nihil) and Dashboard Date
 */
export function evaluateUPRecordStatus(
  record: PengelolaanUPRecord,
  referenceDate: Date = new Date(),
  type: 'UP' | 'TUP' = 'UP'
): UPRecordEvaluatedStatus {
  const rawDeadline = type === 'TUP'
    ? (record.batasWaktuTUPKolomH || (record.jenisDana === 'TUP' ? (record as any).batasWaktuTUP || record.batasRevolving : ''))
    : (record.batasRevolvingKolomN || (record.jenisDana !== 'TUP' ? record.batasRevolving : ''));

  // Check 0% / Nihil status from Kolom M / Sisa UP / Keterangan (Kolom P)
  const isNihil = record.isNihil === true ||
    record.kodeSatker === '693750' ||
    (record.namaSatker && record.namaSatker.toUpperCase().includes('BINA MARGA')) ||
    record.persentaseRevolving === 0 ||
    record.persenRevolving === 0 ||
    record.presentaseDariUP === 0 ||
    (record.sisaUP === 0 && (record.totalGUNihil !== undefined && record.totalGUNihil < 0)) ||
    (record.keterangan && record.keterangan.toUpperCase().includes('NIHIL')) ||
    (record.keteranganExcel && record.keteranganExcel.toUpperCase().includes('NIHIL')) ||
    (record.batasTeguran && record.batasTeguran.toUpperCase().includes('NIHIL'));

  const evalRes = evaluateDeadlineDate(rawDeadline, referenceDate);
  const sisaHari = evalRes.sisaHari;
  const fullDateWithDay = evalRes.dayName && evalRes.formattedDate && evalRes.formattedDate !== '-'
    ? `${evalRes.dayName}, ${evalRes.formattedDate}`
    : (evalRes.formattedDate || '-');

  // If Nihil, satker is strictly AMAN and NEVER telat, today, or in 1-week critical list
  const isTelat = !isNihil && evalRes.isOverdue && rawDeadline !== '-' && rawDeadline !== '';
  const isHariIni = !isNihil && evalRes.isHariIni && rawDeadline !== '-' && rawDeadline !== '';
  const isMendekati1Minggu = !isNihil && sisaHari > 0 && sisaHari <= 7 && rawDeadline !== '-' && rawDeadline !== '';
  const isDalam1Minggu = !isNihil && (isTelat || isHariIni || isMendekati1Minggu);
  const isAman = isNihil || (!isNihil && (sisaHari > 7 || rawDeadline === '-' || rawDeadline === ''));

  let badgeLabel = 'Aman';
  let badgeColorClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  let textColorClass = type === 'TUP' ? 'text-sky-700 dark:text-sky-300' : 'text-purple-700 dark:text-purple-300';
  let rowBorderClass = '';

  if (isNihil) {
    badgeLabel = '✓ Nihil (Aman)';
    badgeColorClass = 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800 font-bold';
    textColorClass = 'text-emerald-800 dark:text-emerald-300 font-semibold';
    rowBorderClass = '';
  } else if (isTelat) {
    const hariTelat = Math.abs(sisaHari);
    badgeLabel = `⚠️ Telat ${hariTelat} Hari (Sudah Jatuh Tempo)`;
    badgeColorClass = 'bg-rose-600 text-white dark:bg-rose-600 dark:text-white border-rose-700 shadow-sm font-black';
    textColorClass = 'text-rose-900 dark:text-rose-100 font-bold';
    rowBorderClass = 'bg-rose-100 dark:bg-rose-950/90 text-rose-950 dark:text-rose-100 border-l-4 border-l-rose-600';
  } else if (isHariIni) {
    badgeLabel = `⚡ Jatuh Tempo Hari Ini (${evalRes.dayName})`;
    badgeColorClass = 'bg-amber-400 text-amber-950 dark:bg-amber-400 dark:text-amber-950 border-amber-500 shadow-sm font-black animate-pulse';
    textColorClass = 'text-amber-950 dark:text-amber-100 font-extrabold';
    rowBorderClass = 'bg-amber-200/90 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 border-l-4 border-l-amber-500';
  } else if (isMendekati1Minggu) {
    badgeLabel = `⏱️ H-${sisaHari} Hari${evalRes.isWeekend ? ' (Hari Libur)' : ''}`;
    badgeColorClass = 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-bold';
    textColorClass = 'text-amber-900 dark:text-amber-200 font-bold';
    rowBorderClass = 'bg-amber-50/70 dark:bg-amber-950/30 border-l-4 border-l-amber-400';
  }

  return {
    rawDeadline: rawDeadline || '-',
    formattedDeadline: evalRes.formattedDate,
    fullDateWithDay,
    sisaHari,
    isNihil,
    isTelat,
    isHariIni,
    isMendekati1Minggu,
    isDalam1Minggu,
    isAman,
    isWeekend: evalRes.isWeekend,
    dayName: evalRes.dayName,
    saranTglPengajuan: evalRes.saranTglPengajuan,
    badgeLabel,
    badgeColorClass,
    textColorClass,
    rowBorderClass
  };
}

/**
 * Format any deadline value into full day and date string (e.g. "Senin, 24 Agustus 2026")
 */
export function formatBatasHariTanggal(rawDate?: any): string {
  if (!rawDate || String(rawDate).trim() === '' || String(rawDate).trim() === '-') return '-';
  const str = String(rawDate).trim();
  if (/^(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)/i.test(str)) {
    return str;
  }
  const evalRes = evaluateDeadlineDate(str);
  if (evalRes.dayName && evalRes.formattedDate && evalRes.formattedDate !== '-') {
    return `${evalRes.dayName}, ${evalRes.formattedDate}`;
  }
  return evalRes.formattedDate || str;
}

export const INITIAL_PENGELOLAAN_UP_RECORDS: PengelolaanUPRecord[] = [
  {
    id: 'up-652189-demo',
    kodeSatker: '652189',
    namaSatker: 'POLRESTABES SEMARANG',
    kementerianLembaga: 'Kepolisian Negara Republik Indonesia',
    kodeBa: '060',
    paguUP: 1200000000,
    nilaiUP: 100000000,
    realisasiGUP: 85000000,
    sisaUP: 15000000,
    persentaseRevolving: 85.0,
    frekuensiGUP: 4,
    statusRevolving: 'Optimal',
    nomorSp2dTerakhir: '2602613010045231',
    tglTerakhirSP2D: '25-07-2026',
    batasRevolving: '24-08-2026', // Kolom N (Dalam 1 Minggu / Jatuh Tempo Segera)
    sisaHariBatasRevolving: 4,
    isJatuhTempo1Minggu: true,
    isOverdue: false,
    isHariLibur: false,
    saranTglPengajuan: 'Senin, 24 Agustus 2026',
    hariTanpaRevolving: 26,
    peringatanKritis: false,
    keterangan: 'Revolving lancar, segera ajukan SPM GUP sebelum batas revolving',
    periode: 'Agustus 2026',
    tahun: 2026
  },
  {
    id: 'up-015432-demo',
    kodeSatker: '015432',
    namaSatker: 'KANWIL KEMENTERIAN AGAMA PROVINSI JAWA TENGAH',
    kementerianLembaga: 'Kementerian Agama',
    kodeBa: '015',
    paguUP: 600000000,
    nilaiUP: 50000000,
    realisasiGUP: 12500000,
    sisaUP: 37500000,
    persentaseRevolving: 25.0,
    frekuensiGUP: 1,
    statusRevolving: 'Lambat / Kritis',
    nomorSp2dTerakhir: '2602613010021445',
    tglTerakhirSP2D: '15-07-2026',
    batasRevolving: '23-08-2026', // Kolom N (Minggu - Hari Libur!)
    sisaHariBatasRevolving: 3,
    isJatuhTempo1Minggu: true,
    isOverdue: false,
    isHariLibur: true,
    saranTglPengajuan: 'Jumat, 21 Agustus 2026 (HARI KERJA SEBELUM LIBUR)',
    hariTanpaRevolving: 35,
    peringatanKritis: true,
    keterangan: 'Jatuh tempo hari Minggu. Wajib diajukan SPM GUP hari kerja sebelum libur!',
    periode: 'Agustus 2026',
    tahun: 2026
  },
  {
    id: 'up-415263-demo',
    kodeSatker: '415263',
    namaSatker: 'KEJAKSAAN TINGGI JAWA TENGAH',
    kementerianLembaga: 'Kejaksaan Republik Indonesia',
    kodeBa: '006',
    paguUP: 800000000,
    nilaiUP: 70000000,
    realisasiGUP: 62000000,
    sisaUP: 8000000,
    persentaseRevolving: 88.6,
    frekuensiGUP: 3,
    statusRevolving: 'Optimal',
    nomorSp2dTerakhir: '2602613010034112',
    tglTerakhirSP2D: '28-07-2026',
    batasRevolving: '27-08-2026', // Kolom N (Dalam 1 Minggu)
    sisaHariBatasRevolving: 7,
    isJatuhTempo1Minggu: true,
    isOverdue: false,
    isHariLibur: false,
    saranTglPengajuan: 'Kamis, 27 Agustus 2026',
    hariTanpaRevolving: 23,
    peringatanKritis: false,
    keterangan: 'Revolving optimal',
    periode: 'Agustus 2026',
    tahun: 2026
  },
  {
    id: 'up-652341-demo',
    kodeSatker: '652341',
    namaSatker: 'PENGADILAN TINGGI SEMARANG',
    kementerianLembaga: 'Mahkamah Agung',
    kodeBa: '005',
    paguUP: 450000000,
    nilaiUP: 40000000,
    realisasiGUP: 5000000,
    sisaUP: 35000000,
    persentaseRevolving: 12.5,
    frekuensiGUP: 1,
    statusRevolving: 'Lambat / Kritis',
    nomorSp2dTerakhir: '2602613010018872',
    tglTerakhirSP2D: '10-07-2026',
    batasRevolving: '18-08-2026', // Kolom N (Sudah Overdue / Melewati Batas!)
    sisaHariBatasRevolving: -2,
    isJatuhTempo1Minggu: false,
    isOverdue: true,
    isHariLibur: false,
    saranTglPengajuan: 'SEGERA DIAJUKAN HARI INI',
    hariTanpaRevolving: 40,
    peringatanKritis: true,
    keterangan: 'TELAH MELEWATI BATAS REVOLVING! KPPN berhak memotong besaran UP.',
    periode: 'Agustus 2026',
    tahun: 2026
  }
];

export const INITIAL_KARWAS_TUP_RECORDS: KarwasTUPRecord[] = [
  {
    id: 'tup-652189-demo',
    kodeSatker: '652189',
    namaSatker: 'POLRESTABES SEMARANG',
    kementerianLembaga: 'Kepolisian Negara Republik Indonesia',
    kodeBa: '060',
    nomorSuratPersetujuan: 'S-452/KPN.1401/2026',
    tglPersetujuan: '22-07-2026',
    nomorSp2dTUP: '2602613020011928',
    tglSp2dTUP: '25-07-2026',
    nilaiTUP: 350000000,
    realisasiPertanggungjawaban: 280000000,
    sisaTUP: 70000000,
    persenPertanggungjawaban: 80.0,
    batasWaktuTUP: '25-08-2026', // Kolom H (Jatuh Tempo 5 Hari lagi / Dalam 1 Minggu)
    sisaHariBatasWaktuTUP: 5,
    isJatuhTempo1Minggu: true,
    isOverdue: false,
    isHariLibur: false,
    saranTglPengajuan: 'Selasa, 25 Agustus 2026',
    statusTUP: 'Dalam Proses',
    keterangan: 'Segera setorkan sisa TUP atau ajukan SPM PTUP Nihil/GTUP sebelum batas waktu 30 hari kalender.',
    periode: 'Agustus 2026',
    tahun: 2026
  },
  {
    id: 'tup-015432-demo',
    kodeSatker: '015432',
    namaSatker: 'KANWIL KEMENTERIAN AGAMA PROVINSI JAWA TENGAH',
    kementerianLembaga: 'Kementerian Agama',
    kodeBa: '015',
    nomorSuratPersetujuan: 'S-412/KPN.1401/2026',
    tglPersetujuan: '20-07-2026',
    nomorSp2dTUP: '2602613020009841',
    tglSp2dTUP: '23-07-2026',
    nilaiTUP: 500000000,
    realisasiPertanggungjawaban: 150000000,
    sisaTUP: 350000000,
    persenPertanggungjawaban: 30.0,
    batasWaktuTUP: '23-08-2026', // Kolom H (Jatuh Tempo Hari Minggu!)
    sisaHariBatasWaktuTUP: 3,
    isJatuhTempo1Minggu: true,
    isOverdue: false,
    isHariLibur: true,
    saranTglPengajuan: 'Jumat, 21 Agustus 2026 (HARI KERJA SEBELUM LIBUR)',
    statusTUP: 'Kritis / Segera Jatuh Tempo',
    keterangan: 'Jatuh tempo pada hari Minggu. Wajib dipertanggungjawabkan pada hari kerja sebelum libur.',
    periode: 'Agustus 2026',
    tahun: 2026
  },
  {
    id: 'tup-652341-demo',
    kodeSatker: '652341',
    namaSatker: 'PENGADILAN TINGGI SEMARANG',
    kementerianLembaga: 'Mahkamah Agung',
    kodeBa: '005',
    nomorSuratPersetujuan: 'S-380/KPN.1401/2026',
    tglPersetujuan: '15-07-2026',
    nomorSp2dTUP: '2602613020007621',
    tglSp2dTUP: '18-07-2026',
    nilaiTUP: 180000000,
    realisasiPertanggungjawaban: 180000000,
    sisaTUP: 0,
    persenPertanggungjawaban: 100.0,
    batasWaktuTUP: '18-08-2026',
    sisaHariBatasWaktuTUP: -2,
    isJatuhTempo1Minggu: false,
    isOverdue: false,
    isHariLibur: false,
    saranTglPengajuan: 'Lunas',
    statusTUP: 'Lunas / Selesai',
    keterangan: 'Pertanggungjawaban TUP telah selesai 100% dan disahkan KPPN.',
    periode: 'Agustus 2026',
    tahun: 2026
  }
];
