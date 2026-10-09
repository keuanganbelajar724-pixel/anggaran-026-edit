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
