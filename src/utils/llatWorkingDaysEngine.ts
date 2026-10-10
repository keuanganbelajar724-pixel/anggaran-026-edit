/**
 * Mesin Hitung Hari Kerja dan Logika Kalender LLAT PER-9/PB/2026
 * Mengimplementasikan kalender libur nasional, cuti bersama, dan perhitungan
 * tenggat waktu (sebelum/sesudah, hari kerja vs hari kalender, pergeseran bila libur).
 */

export interface HolidayEntry {
  date: string; // YYYY-MM-DD
  name: string;
  isCutiBersama: boolean;
}

// Daftar Libur Nasional dan Cuti Bersama Resmi Periode Q4 2026 s.d. Q1 2027 (Kemenko PMK/SKB 3 Menteri)
export const HOLIDAYS_LLAT_2026_2027: Record<string, HolidayEntry> = {
  // 2026
  '2026-01-01': { date: '2026-01-01', name: 'Tahun Baru 2026 Masehi', isCutiBersama: false },
  '2026-05-01': { date: '2026-05-01', name: 'Hari Buruh Internasional', isCutiBersama: false },
  '2026-08-17': { date: '2026-08-17', name: 'Hari Kemerdekaan RI ke-81', isCutiBersama: false },
  '2026-10-01': { date: '2026-10-01', name: 'Hari Kesaktian Pancasila', isCutiBersama: false },
  '2026-10-28': { date: '2026-10-28', name: 'Hari Sumpah Pemuda', isCutiBersama: false },
  '2026-11-10': { date: '2026-11-10', name: 'Hari Pahlawan', isCutiBersama: false },
  '2026-12-24': { date: '2026-12-24', name: 'Cuti Bersama Hari Raya Natal', isCutiBersama: true },
  '2026-12-25': { date: '2026-12-25', name: 'Hari Raya Natal', isCutiBersama: false },
  // 2027
  '2027-01-01': { date: '2027-01-01', name: 'Tahun Baru 2027 Masehi', isCutiBersama: false },
  '2027-01-18': { date: '2027-01-18', name: 'Isra Mi\'raj Nabi Muhammad SAW', isCutiBersama: false },
  '2027-02-06': { date: '2027-02-06', name: 'Tahun Baru Imlek 2578 Kongzili', isCutiBersama: false },
};

/**
 * Cek apakah tanggal tertentu merupakan akhir pekan (Sabtu/Minggu)
 */
export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day === 0 || day === 6; // 0 = Minggu, 6 = Sabtu
}

/**
 * Cek apakah tanggal tertentu merupakan hari libur nasional atau cuti bersama
 */
export function isHoliday(dateStr: string): { isHoliday: boolean; holidayName?: string; isCutiBersama?: boolean } {
  const entry = HOLIDAYS_LLAT_2026_2027[dateStr];
  if (entry) {
    return { isHoliday: true, holidayName: entry.name, isCutiBersama: entry.isCutiBersama };
  }
  return { isHoliday: false };
}

/**
 * Cek apakah suatu hari merupakan hari kerja efektif
 */
export function isWorkingDay(dateStr: string): boolean {
  if (isWeekend(dateStr)) return false;
  if (isHoliday(dateStr).isHoliday) return false;
  return true;
}

/**
 * Hitung selisih hari kerja antara dua tanggal (start to end inclusive/exclusive)
 */
export function getWorkingDaysBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  if (start > end) return 0;

  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const currentStr = `${y}-${m}-${d}`;
    if (isWorkingDay(currentStr)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Mesin kalkulasi tanggal tenggat berdasarkan parameter hari kerja:
 * - refDate: YYYY-MM-DD
 * - workingDays: jumlah hari kerja
 * - direction: 'SESUDAH' atau 'SEBELUM'
 * - includeRefDate: apakah tanggal acuan dihitung sebagai hari ke-1
 */
export function calculateWorkingDayDeadline(
  refDateStr: string,
  workingDays: number,
  direction: 'SESUDAH' | 'SEBELUM' = 'SESUDAH',
  includeRefDate: boolean = false
): {
  targetDateStr: string;
  steps: Array<{ dateStr: string; dayIndex: number; isWorking: boolean; note: string }>;
  explanation: string;
} {
  const steps: Array<{ dateStr: string; dayIndex: number; isWorking: boolean; note: string }> = [];
  const current = new Date(refDateStr + 'T00:00:00');
  let remainingDays = workingDays;
  let dayIndex = 0;

  // Jika includeRefDate false, geser 1 hari kalender terlebih dahulu
  if (!includeRefDate) {
    current.setDate(current.getDate() + (direction === 'SESUDAH' ? 1 : -1));
  }

  while (remainingDays > 0) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const weekend = isWeekend(dateStr);
    const holidayInfo = isHoliday(dateStr);
    const working = !weekend && !holidayInfo.isHoliday;

    let note = 'Hari Kerja Efektif';
    if (weekend) {
      note = current.getDay() === 0 ? 'Hari Minggu (Libur Akhir Pekan)' : 'Hari Sabtu (Libur Akhir Pekan)';
    } else if (holidayInfo.isHoliday) {
      note = `Hari Libur: ${holidayInfo.holidayName}`;
    }

    if (working) {
      dayIndex++;
      remainingDays--;
      steps.push({ dateStr, dayIndex, isWorking: true, note: `Hari kerja ke-${dayIndex}` });
    } else {
      steps.push({ dateStr, dayIndex, isWorking: false, note: `Dilewati: ${note}` });
    }

    if (remainingDays > 0) {
      current.setDate(current.getDate() + (direction === 'SESUDAH' ? 1 : -1));
    }
  }

  const y = current.getFullYear();
  const m = String(current.getMonth() + 1).padStart(2, '0');
  const d = String(current.getDate()).padStart(2, '0');
  const targetDateStr = `${y}-${m}-${d}`;

  const explanation = `${workingDays} hari kerja ${direction === 'SESUDAH' ? 'setelah' : 'sebelum'} ${refDateStr} jatuh pada ${targetDateStr}.`;

  return { targetDateStr, steps, explanation };
}

/**
 * Cek apakah tanggal tetap jatuh pada hari libur, dan jika ada ketentuan pergeseran:
 * bila libur digeser ke hari kerja sebelumnya atau hari kerja berikutnya
 */
export function adjustIfHoliday(
  dateStr: string,
  mode: 'PREVIOUS_WORKING_DAY' | 'NEXT_WORKING_DAY' | 'EXACT' = 'EXACT'
): {
  adjustedDate: string;
  wasAdjusted: boolean;
  originalDayType: string;
} {
  const weekend = isWeekend(dateStr);
  const holiday = isHoliday(dateStr);

  if (!weekend && !holiday.isHoliday) {
    return { adjustedDate: dateStr, wasAdjusted: false, originalDayType: 'Hari Kerja Normal' };
  }

  if (mode === 'EXACT') {
    return {
      adjustedDate: dateStr,
      wasAdjusted: false,
      originalDayType: weekend ? 'Akhir Pekan (Tanggal Tetap)' : `Hari Libur (${holiday.holidayName})`
    };
  }

  const current = new Date(dateStr + 'T00:00:00');
  const step = mode === 'NEXT_WORKING_DAY' ? 1 : -1;

  while (!isWorkingDay(current.toISOString().slice(0, 10))) {
    current.setDate(current.getDate() + step);
  }

  const adjustedDate = current.toISOString().slice(0, 10);
  return {
    adjustedDate,
    wasAdjusted: true,
    originalDayType: `Awalnya ${weekend ? 'Akhir Pekan' : holiday.holidayName}, disesuaikan ke ${adjustedDate}`
  };
}

/**
 * Format tanggal YYYY-MM-DD menjadi format singkat bahasa Indonesia (e.g. "2 Okt 2026")
 */
export function formatShortDateID(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthName = months[parseInt(m, 10) - 1] || m;
  return `${parseInt(d, 10)} ${monthName} ${y}`;
}

/**
 * Hitung mundur N hari kerja dari refDate
 */
export function subtractWorkingDays(refDateStr: string, workingDays: number): {
  targetDateStr: string;
  steps: Array<{ dateStr: string; dayIndex: number; note: string }>;
} {
  const steps: Array<{ dateStr: string; dayIndex: number; note: string }> = [];
  const current = new Date(refDateStr + 'T00:00:00');
  let remainingDays = workingDays;
  let dayIndex = 0;

  // Mundur 1 hari kalender terlebih dahulu
  current.setDate(current.getDate() - 1);

  while (remainingDays > 0) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const weekend = isWeekend(dateStr);
    const holidayInfo = isHoliday(dateStr);
    const working = !weekend && !holidayInfo.isHoliday;

    let note = 'Hari Kerja';
    if (weekend) {
      note = current.getDay() === 0 ? 'Minggu (Libur Akhir Pekan)' : 'Sabtu (Libur Akhir Pekan)';
    } else if (holidayInfo.isHoliday) {
      note = `Libur: ${holidayInfo.holidayName}`;
    }

    if (working) {
      dayIndex++;
      remainingDays--;
      steps.push({ dateStr, dayIndex, note: `Hari kerja ke-${dayIndex} mundur` });
    } else {
      steps.push({ dateStr, dayIndex, note: `Dilewati: ${note}` });
    }

    if (remainingDays > 0) {
      current.setDate(current.getDate() - 1);
    }
  }

  const y = current.getFullYear();
  const m = String(current.getMonth() + 1).padStart(2, '0');
  const d = String(current.getDate()).padStart(2, '0');
  return { targetDateStr: `${y}-${m}-${d}`, steps };
}

export interface Rolling5HKInfo {
  dateStr: string;
  sourceDateStr: string;
  sourceDateFormatted: string;
  forwardDeadlineStr: string;
  forwardDeadlineFormatted: string;
  stepsBack: Array<{ dateStr: string; dayIndex: number; note: string }>;
  stepsForward: Array<{ dateStr: string; dayIndex: number; isWorking: boolean; note: string }>;
  label: string;
  shortLabel: string;
  description: string;
  pasal: string;
  isOctober: boolean;
  isNovember: boolean;
  hardCutOffDateStr: string;
  hardCutOffFormatted: string;
}

/**
 * Mendapatkan informasi klausul dinamis 5 Hari Kerja (Pasal 6 ayat 2/3 & Pasal 18 ayat 1b PER-9/PB/2026)
 * Khusus berlaku pada hari kerja di bulan Oktober dan November 2026
 */
export function getRolling5HKInfo(dateStr: string): Rolling5HKInfo | null {
  const isOct = dateStr.startsWith('2026-10-');
  const isNov = dateStr.startsWith('2026-11-');

  // Hanya berlaku untuk Oktober & November 2026
  if (!isOct && !isNov) return null;

  // Tanggal 1 s.d. 7 Oktober 2026 bukan batas waktu BAST/Kontrak:
  // LLAT baru dimulai Oktober, sehingga BAST/Kontrak paling cepat terbit 1 Oktober.
  // Batas 5 Hari Kerja untuk dokumen terbit 1 Oktober (Hari Kesaktian Pancasila) jatuh tempo pada 8 Oktober 2026.
  // Dokumen yang terbit s.d. 30 September batas mutlak pendaftarannya diatur tersendiri pada 9 Oktober 2026 (LLAT-03.1 & LLAT-06.1).
  if (isOct && dateStr < '2026-10-08') return null;

  // Hanya berlaku untuk hari kerja efektif
  if (!isWorkingDay(dateStr)) return null;

  // 1. Hitung tanggal sumber mundur 5 hari kerja
  // Khusus untuk 8 Oktober 2026, dokumen acuannya adalah BAST/Kontrak tanggal 1 Oktober 2026
  let sourceDateStr: string;
  let sourceDateFormatted: string;
  let stepsBack: Array<{ dateStr: string; dayIndex: number; note: string }>;

  if (dateStr === '2026-10-08') {
    sourceDateStr = '2026-10-01';
    sourceDateFormatted = '1 Okt 2026';
    stepsBack = [
      { dateStr: '2026-10-02', dayIndex: 1, note: 'HK-1: Jumat, 2 Okt 2026' },
      { dateStr: '2026-10-05', dayIndex: 2, note: 'HK-2: Senin, 5 Okt 2026' },
      { dateStr: '2026-10-06', dayIndex: 3, note: 'HK-3: Selasa, 6 Okt 2026' },
      { dateStr: '2026-10-07', dayIndex: 4, note: 'HK-4: Rabu, 7 Okt 2026' },
      { dateStr: '2026-10-08', dayIndex: 5, note: 'HK-5: Kamis, 8 Okt 2026 (Batas Akhir Hari Ini)' }
    ];
  } else {
    const backResult = subtractWorkingDays(dateStr, 5);
    sourceDateStr = backResult.targetDateStr;
    sourceDateFormatted = formatShortDateID(sourceDateStr);
    stepsBack = backResult.steps;
  }

  // 2. Hitung tanggal batas maju 5 hari kerja jika menandatangani hari ini
  const forwardResult = calculateWorkingDayDeadline(dateStr, 5, 'SESUDAH', false);
  const forwardDeadlineStr = forwardResult.targetDateStr;
  const forwardDeadlineFormatted = formatShortDateID(forwardDeadlineStr);

  // 3. Batas mutlak sapu jagat periode
  const hardCutOffDateStr = isOct ? '2026-11-06' : '2026-12-07';
  const hardCutOffFormatted = isOct ? '6 November 2026' : '7 Desember 2026';

  const pasal = isOct
    ? 'Pasal 6 ayat (2) & Pasal 18 ayat (1) huruf b'
    : 'Pasal 6 ayat (3) & Pasal 18 ayat (1) huruf b/c';

  return {
    dateStr,
    sourceDateStr,
    sourceDateFormatted,
    forwardDeadlineStr,
    forwardDeadlineFormatted,
    stepsBack,
    stepsForward: forwardResult.steps,
    label: `Batas 5 HK: BAST & Kontrak tgl ${sourceDateFormatted}`,
    shortLabel: `5 HK (${sourceDateFormatted})`,
    description: `Berdasarkan ketentuan ${pasal} PER-9/PB/2026, hari ini merupakan batas akhir (H+5 Hari Kerja) pengajuan pendaftaran Kontrak/Adendum dan SPM-LS Kontraktual (BAST/BAPP/Jaminan) yang ditandatangani pada tanggal ${sourceDateFormatted}.`,
    pasal: `${pasal} PER-9/PB/2026`,
    isOctober: isOct,
    isNovember: isNov,
    hardCutOffDateStr,
    hardCutOffFormatted
  };
}

