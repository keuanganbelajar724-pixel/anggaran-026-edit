/**
 * Utilities for Date Parsing, Batas Waktu, 1-Week Filter & Holiday Analysis
 * Khusus Monitoring UP (Kolom N) & Karwas TUP (Kolom H) KPPN Semarang I
 */

const INDO_MONTHS: Record<string, number> = {
  jan: 0, januari: 0, january: 0,
  feb: 1, februari: 1, february: 1,
  mar: 2, maret: 2, march: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  agu: 7, agustus: 7, aug: 7, august: 7,
  sep: 8, september: 8,
  okt: 9, oktober: 9, oct: 9, october: 9,
  nov: 10, november: 10,
  des: 11, desember: 11, dec: 11, december: 11
};

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Parse various date formats from Excel (serial numbers, strings, date objects)
 */
export function parseExcelDate(raw: any): { date: Date | null; dateString: string; rawString: string } {
  if (raw === null || raw === undefined || raw === '') {
    return { date: null, dateString: '', rawString: '' };
  }

  const rawStr = String(raw).trim();

  // If already a JS Date
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return {
      date: raw,
      dateString: formatDateIndo(raw),
      rawString: rawStr
    };
  }

  // If Excel serial number (e.g. 45500 ~ 2024, 46250 ~ 2026)
  if (typeof raw === 'number' || (!isNaN(Number(raw)) && Number(raw) > 20000 && Number(raw) < 70000)) {
    const serial = Number(raw);
    // Excel base date Dec 30 1899
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    
    // Fractional day for time (if any)
    const fractionalDay = serial - Math.floor(serial) + 0.0000001;
    let totalSeconds = Math.floor(86400 * fractionalDay);
    const seconds = totalSeconds % 60;
    totalSeconds -= seconds;
    const hours = Math.floor(totalSeconds / (60 * 60));
    const minutes = Math.floor(totalSeconds / 60) % 60;

    const parsedDate = new Date(
      dateInfo.getUTCFullYear(),
      dateInfo.getUTCMonth(),
      dateInfo.getUTCDate(),
      hours,
      minutes,
      seconds
    );

    if (!isNaN(parsedDate.getTime())) {
      return {
        date: parsedDate,
        dateString: formatDateIndo(parsedDate),
        rawString: rawStr
      };
    }
  }

  // If string date like "25/08/2026", "25-08-2026", "2026-08-25", "25 Agustus 2026"
  const clean = rawStr.replace(/,/g, ' ').replace(/\s+/g, ' ');

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return { date: d, dateString: formatDateIndo(d), rawString: rawStr };
    }
  }

  // Match YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = clean.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return { date: d, dateString: formatDateIndo(d), rawString: rawStr };
    }
  }

  // Match text like "25 Agustus 2026" or "25-Aug-2026"
  const textMatch = clean.match(/(\d{1,2})[\s\-]+([a-zA-Z]+)[\s\-]+(\d{2,4})/);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthStr = textMatch[2].toLowerCase().substring(0, 3);
    let year = parseInt(textMatch[3], 10);
    if (year < 100) year += 2000;
    const month = INDO_MONTHS[monthStr] ?? -1;
    if (month !== -1) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return { date: d, dateString: formatDateIndo(d), rawString: rawStr };
      }
    }
  }

  // Fallback direct Date parse
  const fallback = new Date(rawStr);
  if (!isNaN(fallback.getTime())) {
    return { date: fallback, dateString: formatDateIndo(fallback), rawString: rawStr };
  }

  return { date: null, dateString: rawStr, rawString: rawStr };
}

export function formatDateIndo(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()] || String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatShortDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export interface DueDateAnalysis {
  parsedDate: Date | null;
  formattedDate: string;
  dayName: string;
  sisaHari: number;
  isJatuhTempo1Minggu: boolean;
  isOverdue: boolean;
  isHariLibur: boolean;
  saranTglPengajuan: string;
  holidayAdviceText: string;
  statusKategori: 'OVERDUE' | 'HARI_INI_BESOK' | 'SATU_MINGGU' | 'AMAN';
  badgeColorClass: string;
  badgeLabel: string;
}

/**
 * Evaluates a due date (Batas Revolving Kolom N / Batas Waktu TUP Kolom H)
 * - Computes remaining calendar days
 * - Identifies if within 1-week window (<= 7 days)
 * - Identifies if due date is a Saturday/Sunday
 * - Recommends submission on the last working day prior to the holiday
 */
export function analyzeDueDate(dueDateRaw: any, customRefDate?: Date): DueDateAnalysis {
  const { date, dateString, rawString } = parseExcelDate(dueDateRaw);

  if (!date) {
    return {
      parsedDate: null,
      formattedDate: rawString || '-',
      dayName: '-',
      sisaHari: 999,
      isJatuhTempo1Minggu: false,
      isOverdue: false,
      isHariLibur: false,
      saranTglPengajuan: '-',
      holidayAdviceText: 'Perhatikan hari libur (ajukan HARI KERJA sebelum libur)',
      statusKategori: 'AMAN',
      badgeColorClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      badgeLabel: rawString || 'Tanggal belum ditentukan'
    };
  }

  // Today normalized to midnight for accurate calendar day count
  const today = customRefDate ? new Date(customRefDate) : new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const sisaHari = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const dayOfWeek = target.getDay(); // 0: Minggu, 6: Sabtu
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHariLibur = isWeekend;
  const dayName = DAY_NAMES[dayOfWeek];

  // Calculate recommended working day before holiday
  let saranDate = new Date(target);
  if (dayOfWeek === 0) { // Minggu -> Jumat (2 hari mundur)
    saranDate.setDate(target.getDate() - 2);
  } else if (dayOfWeek === 6) { // Sabtu -> Jumat (1 hari mundur)
    saranDate.setDate(target.getDate() - 1);
  }

  const saranTglPengajuan = isHariLibur
    ? `Jumat, ${formatDateIndo(saranDate)}`
    : `${dayName}, ${formatDateIndo(target)}`;

  const holidayAdviceText = isHariLibur
    ? `⚠️ Jatuh tempo pada hari ${dayName} (${formatShortDate(target)} - LIBUR). Wajib diajukan paling lambat HARI KERJA sebelumnya (${saranTglPengajuan}).`
    : `Jatuh tempo pada hari kerja (${dayName}, ${formatDateIndo(target)}).`;

  const isOverdue = sisaHari < 0;
  const isJatuhTempo1Minggu = sisaHari >= 0 && sisaHari <= 7;

  let statusKategori: 'OVERDUE' | 'HARI_INI_BESOK' | 'SATU_MINGGU' | 'AMAN' = 'AMAN';
  let badgeColorClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300';
  let badgeLabel = `Aman (Sisa ${sisaHari} Hari)`;

  if (isOverdue) {
    statusKategori = 'OVERDUE';
    badgeColorClass = 'bg-rose-600 text-white animate-pulse border-rose-700 shadow-sm';
    badgeLabel = `🔴 Lewat Jatuh Tempo (${Math.abs(sisaHari)} Hari Lalu)`;
  } else if (sisaHari === 0) {
    statusKategori = 'HARI_INI_BESOK';
    badgeColorClass = 'bg-rose-500 text-white font-black border-rose-600 animate-bounce';
    badgeLabel = `🚨 JATUH TEMPO HARI INI!`;
  } else if (sisaHari === 1) {
    statusKategori = 'HARI_INI_BESOK';
    badgeColorClass = 'bg-amber-500 text-slate-950 font-black border-amber-600';
    badgeLabel = `⚠️ JATUH TEMPO BESOK (1 Hari)`;
  } else if (isJatuhTempo1Minggu) {
    statusKategori = 'SATU_MINGGU';
    badgeColorClass = 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-400 font-bold';
    badgeLabel = `⚡ Sisa ${sisaHari} Hari (1 Minggu)`;
  } else {
    statusKategori = 'AMAN';
    badgeColorClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200';
    badgeLabel = `🟢 Sisa ${sisaHari} Hari`;
  }

  return {
    parsedDate: target,
    formattedDate: dateString,
    dayName,
    sisaHari,
    isJatuhTempo1Minggu: isJatuhTempo1Minggu || isOverdue, // Included in 1-week warning focus
    isOverdue,
    isHariLibur,
    saranTglPengajuan,
    holidayAdviceText,
    statusKategori,
    badgeColorClass,
    badgeLabel
  };
}
