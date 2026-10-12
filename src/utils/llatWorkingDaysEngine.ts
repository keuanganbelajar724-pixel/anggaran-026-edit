/**
 * Mesin Hitung Hari Kerja dan Logika Kalender LLAT PER-9/PB/2026
 * Mengimplementasikan kalender libur nasional, cuti bersama, dan perhitungan
 * tenggat waktu (sebelum/sesudah, hari kerja vs hari kalender, pergeseran bila libur).
 */

import { LLATEvent } from '../types/llat';

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
  isDecember: boolean;
  hardCutOffDateStr: string;
  hardCutOffFormatted: string;
  subClauseType?: 'OCT_NOV_ROLLING' | 'DEC_GROUP_A' | 'DEC_GROUP_B' | 'DEC_GROUP_C' | 'DEC_GROUP_D_NRK';
  isFixedDateCutOff?: boolean;
  isDecemberStartMilestone?: boolean;
  decemberStartMilestoneItems?: Array<{
    title: string;
    desc: string;
    deadline: string;
    pasal: string;
    badge: string;
  }>;
  // Ketentuan Batas Penolakan SPM (Pasal 19 PER-9/PB/2026)
  rejectedDeadlineStr?: string;
  rejectedDeadlineFormatted?: string;
  rejectedJamBatas?: string;
  rejectedRulePasal?: string;
  rejectedDescription?: string;
}

/**
 * Mendapatkan informasi klausul dinamis 5 Hari Kerja & batas pendaftaran Kontrak akhir tahun
 * (Pasal 6 ayat 2, 3, 5 huruf a/b/c/d, ayat 6 & Pasal 18 ayat 1b PER-9/PB/2026)
 * Berlaku pada hari kerja di bulan Oktober, November, dan Desember 2026
 */
export function getRolling5HKInfo(dateStr: string): Rolling5HKInfo | null {
  const isOct = dateStr.startsWith('2026-10-');
  const isNov = dateStr.startsWith('2026-11-');
  const isDec = dateStr.startsWith('2026-12-');

  // Berlaku untuk periode Q4 (Oktober, November, dan Desember 2026)
  if (!isOct && !isNov && !isDec) return null;

  // Tanggal 1 s.d. 7 Oktober 2026 bukan batas waktu BAST/Kontrak:
  // LLAT baru dimulai Oktober, sehingga BAST/Kontrak paling cepat terbit 1 Oktober.
  // Batas 5 Hari Kerja untuk dokumen terbit 1 Oktober (Hari Kesaktian Pancasila) jatuh tempo pada 8 Oktober 2026.
  // Dokumen yang terbit s.d. 30 September batas mutlak pendaftarannya diatur tersendiri pada 9 Oktober 2026 (LLAT-03.1 & LLAT-06.1).
  if (isOct && dateStr < '2026-10-08') return null;

  // Di bulan Desember, pendaftaran kontrak & penerbitan NRK ditutup pada 23 Desember 2026 (Pasal 6 ayat 5d & ayat 6)
  if (isDec && dateStr > '2026-12-23') return null;

  // Hanya berlaku untuk hari kerja efektif
  if (!isWorkingDay(dateStr)) return null;

  // =========================================================================
  // LOGIKA KHUSUS DESEMBER 2026 (Pasal 6 ayat 3, ayat 5 huruf a, b, c, d & ayat 6)
  // =========================================================================
  if (isDec) {
    // Di bulan Desember 2026, tanggal batas waktu pendaftaran kontrak HANYA jatuh pada:
    // 1) 1 s.d. 4 Des: Batas 5 HK pendaftaran Kontrak tgl 24–27 Nov (Pasal 6 ayat 3)
    // 2) 7 Des: Batas 5 HK kontrak 30 Nov & Plafon Kontrak 1–5 Des (Pasal 6 ayat 3 & ayat 5 huruf a)
    // 3) 14 Des: Batas 5 HK kontrak 7 Des & Plafon Kontrak 6–12 Des (Pasal 6 ayat 5 huruf b)
    // 4) 21 Des: Batas LANGSUNG Kontrak 13–17 Des (Pasal 6 ayat 5 huruf c - TANPA kata 5 HK!)
    // 5) 23 Des: Batas LANGSUNG Kontrak 18–22 Des & Penerbitan NRK KPPN (Pasal 6 ayat 5 huruf d & ayat 6 - TANPA kata 5 HK!)
    // Tanggal lainnya (8, 9, 10, 11, 15, 16, 17, 18, 22 Des) BUKAN hari batas waktu kontrak!
    const validDecemberDeadlineDates = [
      '2026-12-01',
      '2026-12-02',
      '2026-12-03',
      '2026-12-04',
      '2026-12-07',
      '2026-12-14',
      '2026-12-21',
      '2026-12-23'
    ];

    if (!validDecemberDeadlineDates.includes(dateStr)) {
      return null;
    }

    let sourceDateStr = '';
    let sourceDateFormatted = '';
    let stepsBack: Array<{ dateStr: string; dayIndex: number; note: string }> = [];
    let label = '';
    let shortLabel = '';
    let description = '';
    let pasal = '';
    let hardCutOffDateStr = '';
    let hardCutOffFormatted = '';
    let forwardDeadlineStr = '';
    let forwardDeadlineFormatted = '';
    let subClauseType: 'DEC_GROUP_A' | 'DEC_GROUP_B' | 'DEC_GROUP_C' | 'DEC_GROUP_D_NRK' = 'DEC_GROUP_A';
    let isFixedDateCutOff = false;
    let isDecemberStartMilestone = false;
    let decemberStartMilestoneItems: Array<{
      title: string;
      desc: string;
      deadline: string;
      pasal: string;
      badge: string;
    }> | undefined = undefined;

    if (dateStr <= '2026-12-07') {
      subClauseType = 'DEC_GROUP_A';
      hardCutOffDateStr = '2026-12-07';
      hardCutOffFormatted = '7 Desember 2026';
      isFixedDateCutOff = false;

      if (dateStr === '2026-12-01') {
        pasal = 'Pasal 6 ayat (3) PER-9/PB/2026';
        // Batas 5 HK mundur dari 1 Des adalah Kontrak tanggal 24 Nov 2026
        sourceDateStr = '2026-11-24';
        sourceDateFormatted = '24 Nov 2026';
        forwardDeadlineStr = '2026-12-07';
        forwardDeadlineFormatted = '7 Des 2026';
        
        stepsBack = [
          { dateStr: '2026-11-25', dayIndex: 1, note: 'HK-1: Rabu, 25 Nov 2026' },
          { dateStr: '2026-11-26', dayIndex: 2, note: 'HK-2: Kamis, 26 Nov 2026' },
          { dateStr: '2026-11-27', dayIndex: 3, note: 'HK-3: Jumat, 27 Nov 2026' },
          { dateStr: '2026-11-30', dayIndex: 4, note: 'HK-4: Senin, 30 Nov 2026' },
          { dateStr: '2026-12-01', dayIndex: 5, note: 'HK-5: Selasa, 1 Des 2026 (Batas Akhir Penerimaan)' }
        ];
        
        isDecemberStartMilestone = false;
        label = 'Batas 5 HK: Kontrak tgl 24 Nov 2026 (Pasal 6 ayat 3)';
        shortLabel = 'Batas Kontrak 24 Nov';
        description = 'Sesuai ketentuan Pasal 6 ayat (3) PER-9/PB/2026, hari ini tanggal 1 Desember 2026 merupakan batas akhir (H+5 Hari Kerja) pengajuan pendaftaran Kontrak yang ditandatangani tanggal 24 November 2026 ke KPPN (bukan batas BAST; batas SPM BAST November adalah gelondongan tanggal 20 Nov & 7 Des).';
        decemberStartMilestoneItems = undefined;
      } else if (dateStr === '2026-12-07') {
        pasal = 'Pasal 6 ayat (3) & Pasal 6 ayat (5) huruf a PER-9/PB/2026';
        sourceDateStr = '30 Nov & Kontrak 1–5 Des 2026';
        sourceDateFormatted = '30 Nov & 1–5 Des';
        forwardDeadlineStr = '2026-12-14';
        forwardDeadlineFormatted = '14 Des 2026';
        label = 'Batas 5 HK Kontrak 30 Nov & Plafon Kontrak 1–5 Des';
        shortLabel = 'Batas Kontrak 1–5 Des (7 Des)';
        description = 'Sesuai Pasal 6 ayat (3) dan Pasal 6 ayat (5) huruf a PER-9/PB/2026, hari ini merupakan batas akhir (H+5 HK) pendaftaran kontrak tanggal 30 Nov 2026, sekaligus batas akhir plafon mutlak bagi kontrak yang ditandatangani 1 s.d. 5 Desember 2026 pada Jam Kerja.';
        stepsBack = [
          { dateStr: '2026-12-01', dayIndex: 1, note: 'HK-1: Selasa, 1 Des 2026' },
          { dateStr: '2026-12-02', dayIndex: 2, note: 'HK-2: Rabu, 2 Des 2026' },
          { dateStr: '2026-12-03', dayIndex: 3, note: 'HK-3: Kamis, 3 Des 2026' },
          { dateStr: '2026-12-04', dayIndex: 4, note: 'HK-4: Jumat, 4 Des 2026' },
          { dateStr: '2026-12-07', dayIndex: 5, note: 'HK-5: Senin, 7 Des 2026 (Plafon Sapu Jagat Hari Ini)' }
        ];
      } else {
        pasal = 'Pasal 6 ayat (3) PER-9/PB/2026';
        const backResult = subtractWorkingDays(dateStr, 5);
        sourceDateStr = backResult.targetDateStr;
        sourceDateFormatted = formatShortDateID(sourceDateStr);
        stepsBack = backResult.steps;
        const forwardResult = calculateWorkingDayDeadline(dateStr, 5, 'SESUDAH', false);
        forwardDeadlineStr = forwardResult.targetDateStr > '2026-12-07' ? '2026-12-07' : forwardResult.targetDateStr;
        forwardDeadlineFormatted = forwardDeadlineStr === '2026-12-07' ? '7 Des 2026 (Plafon)' : formatShortDateID(forwardDeadlineStr);
        label = `Batas 5 HK: Kontrak tgl ${sourceDateFormatted} (Plafon 7 Des)`;
        shortLabel = `5 HK (${sourceDateFormatted})`;
        description = `Sesuai ketentuan Pasal 6 ayat (3) PER-9/PB/2026, hari ini merupakan batas akhir (H+5 HK) pengajuan pendaftaran Kontrak yang ditandatangani pada tanggal ${sourceDateFormatted} (akhir November 2026).`;
      }
    } else if (dateStr === '2026-12-14') {
      subClauseType = 'DEC_GROUP_B';
      hardCutOffDateStr = '2026-12-14';
      hardCutOffFormatted = '14 Desember 2026';
      pasal = 'Pasal 6 ayat (5) huruf b PER-9/PB/2026';
      isFixedDateCutOff = false;
      sourceDateStr = 'Kontrak 6–12 Des 2026 (7 Des: H+5)';
      sourceDateFormatted = 'Kontrak 6–12 Des';
      forwardDeadlineStr = '2026-12-21';
      forwardDeadlineFormatted = '21 Des 2026';
      label = 'Batas 5 HK Kontrak 7 Des & Plafon Kontrak 6–12 Des';
      shortLabel = 'Batas Kontrak 6–12 Des (14 Des)';
      description = 'Sesuai Pasal 6 ayat (5) huruf b PER-9/PB/2026, kontrak atau perubahan kontrak yang ditandatangani tanggal 6 sampai dengan 12 Desember 2026 diterima KPPN paling lambat 5 (lima) Hari Kerja setelah tanggal ditandatangani dan PALING LAMBAT hari ini tanggal 14 Desember 2026 pada Jam Kerja. Hari ini juga batas H+5 HK bagi kontrak tanggal 7 Desember 2026.';
      stepsBack = [
        { dateStr: '2026-12-08', dayIndex: 1, note: 'HK-1: Selasa, 8 Des 2026' },
        { dateStr: '2026-12-09', dayIndex: 2, note: 'HK-2: Rabu, 9 Des 2026' },
        { dateStr: '2026-12-10', dayIndex: 3, note: 'HK-3: Kamis, 10 Des 2026' },
        { dateStr: '2026-12-11', dayIndex: 4, note: 'HK-4: Jumat, 11 Des 2026' },
        { dateStr: '2026-12-14', dayIndex: 5, note: 'HK-5: Senin, 14 Des 2026 (Plafon Mutlak Hari Ini)' }
      ];
    } else if (dateStr === '2026-12-21') {
      subClauseType = 'DEC_GROUP_C';
      hardCutOffDateStr = '2026-12-21';
      hardCutOffFormatted = '21 Desember 2026';
      pasal = 'Pasal 6 ayat (5) huruf c PER-9/PB/2026 (Batas Langsung)';
      isFixedDateCutOff = true; // Langsung tanggal 21 Desember, tanpa kata 5 HK!
      sourceDateStr = '2026-12-13 s.d. 2026-12-17';
      sourceDateFormatted = 'Kontrak 13–17 Des 2026';
      forwardDeadlineStr = '2026-12-21';
      forwardDeadlineFormatted = '21 Des 2026 (Batas Langsung)';
      label = 'Batas Langsung Kontrak 13–17 Des (Bukan 5 HK)';
      shortLabel = 'Batas Kontrak 13–17 Des (21 Des)';
      description = 'Sesuai Pasal 6 ayat (5) huruf c PER-9/PB/2026, kontrak atau perubahan kontrak yang ditandatangani tanggal 13 sampai dengan 17 Desember 2026 diterima KPPN paling lambat hari ini tanggal 21 Desember 2026 pada Jam Kerja. Berbeda dengan huruf a dan b, ketentuan ini TIDAK memuat kata "5 Hari Kerja", melainkan langsung menetapkan tanggal batas akhir mutlak pada 21 Desember 2026.';
      stepsBack = [
        { dateStr: '2026-12-13', dayIndex: 0, note: 'Awal penandatanganan kontrak kelompok c (13 Des 2026)' },
        { dateStr: '2026-12-17', dayIndex: 0, note: 'Akhir penandatanganan kontrak kelompok c (17 Des 2026)' },
        { dateStr: '2026-12-21', dayIndex: 1, note: 'Batas langsung penerimaan di KPPN: Senin, 21 Des 2026 (Pukul 17:00 WIB)' }
      ];
    } else if (dateStr === '2026-12-23') {
      subClauseType = 'DEC_GROUP_D_NRK';
      hardCutOffDateStr = '2026-12-23';
      hardCutOffFormatted = '23 Desember 2026';
      pasal = 'Pasal 6 ayat (5) huruf d & ayat (6) PER-9/PB/2026 (Batas Langsung)';
      isFixedDateCutOff = true; // Langsung tanggal 23 Desember, tanpa kata 5 HK!
      sourceDateStr = '2026-12-18 s.d. 2026-12-22';
      sourceDateFormatted = 'Kontrak 18–22 Des & NRK KPPN';
      forwardDeadlineStr = '2026-12-23';
      forwardDeadlineFormatted = '23 Des 2026 (Tutup Tahun)';
      label = 'Batas Langsung Kontrak 18–22 Des & Penerbitan NRK (Tutup Tahun)';
      shortLabel = 'Batas Akhir Kontrak & NRK (23 Des)';
      description = 'Sesuai Pasal 6 ayat (5) huruf d dan ayat (6) PER-9/PB/2026, kontrak atau perubahan kontrak yang ditandatangani tanggal 18 sampai dengan 22 Desember 2026 diterima KPPN paling lambat hari ini tanggal 23 Desember 2026 pada Jam Kerja. KPPN menerbitkan NRK/menyetujui perubahan kontrak paling lambat 2 HK dan paling lambat hari ini tanggal 23 Desember 2026 pada Jam Kerja. Berbeda dengan huruf a dan b, ketentuan ini TIDAK memuat kata "5 Hari Kerja", melainkan langsung menetapkan tanggal batas akhir penutupan pada 23 Desember 2026.';
      stepsBack = [
        { dateStr: '2026-12-18', dayIndex: 0, note: 'Awal penandatanganan kontrak kelompok d (18 Des 2026)' },
        { dateStr: '2026-12-22', dayIndex: 0, note: 'Akhir penandatanganan kontrak kelompok d (22 Des 2026)' },
        { dateStr: '2026-12-23', dayIndex: 1, note: 'Batas langsung kontrak & penutupan penerbitan NRK KPPN: Rabu, 23 Des 2026 (17:00 WIB)' }
      ];
    }

    const forwardSteps: Array<{ dateStr: string; dayIndex: number; isWorking: boolean; note: string }> = dateStr === '2026-12-01' ? [
      { dateStr: '2026-12-01', dayIndex: 0, isWorking: true, note: 'Hari ini: Dimulainya Agenda Akhir Tahun TA 2026' },
      { dateStr: '2026-12-07', dayIndex: 5, isWorking: true, note: 'Batas Plafon KPPN: 7 Des 2026 (Pukul 17:00 WIB)' }
    ] : [
      { dateStr, dayIndex: 0, isWorking: true, note: `Hari ini: ${formatShortDateID(dateStr)}` },
      { dateStr: hardCutOffDateStr, dayIndex: 1, isWorking: true, note: `Batas Plafon: ${formatShortDateID(hardCutOffDateStr)}` }
    ];

    const decRejectedCalc = calculateWorkingDayDeadline(dateStr, 2, 'SESUDAH', false);
    const decRejectedDeadlineStr = decRejectedCalc.targetDateStr;
    const decRejectedDeadlineFormatted = formatShortDateID(decRejectedDeadlineStr);

    return {
      dateStr,
      sourceDateStr,
      sourceDateFormatted,
      forwardDeadlineStr,
      forwardDeadlineFormatted,
      stepsBack,
      stepsForward: forwardSteps,
      label,
      shortLabel,
      description,
      pasal,
      isOctober: false,
      isNovember: false,
      isDecember: true,
      hardCutOffDateStr,
      hardCutOffFormatted,
      subClauseType,
      isFixedDateCutOff,
      isDecemberStartMilestone,
      decemberStartMilestoneItems,
      rejectedDeadlineStr: decRejectedDeadlineStr,
      rejectedDeadlineFormatted: decRejectedDeadlineFormatted,
      rejectedJamBatas: '17:00',
      rejectedRulePasal: 'Pasal 19 PER-9/PB/2026',
      rejectedDescription: `Berdasarkan Pasal 19 PER-9/PB/2026, dalam hal KPPN melakukan penolakan atas pengajuan SPM pada hari ini (${formatShortDateID(dateStr)}), Satker dapat mengajukan kembali perbaikan SPM paling lambat 2 Hari Kerja setelah ditolak yaitu ${decRejectedDeadlineFormatted} pukul 17:00 WIB dengan melampirkan bukti penolakan SPM dari KPPN.`
    };
  }

  // =========================================================================
  // LOGIKA OKTOBER & NOVEMBER 2026
  // =========================================================================
  // CATATAN PENTING PER-9/PB/2026:
  // - Bulan Oktober: Batas 5 HK berlaku untuk Kontrak (Pasal 6 ayat 2) DAN SPM-LS Kontraktual (BAST/BAPP/Jaminan).
  //   Plafon sapu jagat SPM-LS BAST Oktober adalah 6 November 2026 (LLAT-06.2).
  // - Bulan November: Batas 5 HK HANYA berlaku untuk Pendaftaran Kontrak (Pasal 6 ayat 3).
  //   Untuk SPM-LS BAST November TIDAK menggunakan batas 5 HK harian berputar, melainkan ditetapkan secara
  //   GELONDONGAN bertahap dengan tanggal pasti:
  //     * BAST 1–15 November 2026  -> Batas SPM-LS ke KPPN: 20 November 2026 (LLAT-06.3)
  //     * BAST 16–30 November 2026 -> Batas SPM-LS ke KPPN: 7 Desember 2026 (LLAT-06.4)
  // =========================================================================

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
    : 'Pasal 6 ayat (3)';

  const label = isOct
    ? `Batas 5 HK: BAST & Kontrak tgl ${sourceDateFormatted}`
    : `Batas 5 HK: Pendaftaran Kontrak tgl ${sourceDateFormatted}`;

  const shortLabel = isOct
    ? `5 HK (${sourceDateFormatted})`
    : `Kontrak 5 HK (${sourceDateFormatted})`;

  const description = isOct
    ? `Berdasarkan ketentuan Pasal 6 ayat (2) & Pasal 18 ayat (1) huruf b PER-9/PB/2026, hari ini merupakan batas akhir (H+5 Hari Kerja) pengajuan pendaftaran Kontrak dan SPM-LS Kontraktual untuk BAST/BAPP yang ditandatangani pada tanggal ${sourceDateFormatted} (dengan batas akhir sapu jagat 6 November 2026).`
    : `Berdasarkan ketentuan Pasal 6 ayat (3) PER-9/PB/2026, hari ini merupakan batas akhir (H+5 Hari Kerja) pendaftaran Kontrak atau perubahan data Kontrak yang ditandatangani tanggal ${sourceDateFormatted} ke KPPN. (Batas 5 hari kerja di bulan November HANYA berlaku untuk Pendaftaran Kontrak; untuk SPM-LS BAST November tidak ada batas 5 HK harian berputar, melainkan diajukan secara gelondongan tanggal 20 Nov & 7 Des 2026).`;

  const rejectedCalc = calculateWorkingDayDeadline(dateStr, 2, 'SESUDAH', false);
  const rejectedDeadlineStr = rejectedCalc.targetDateStr;
  const rejectedDeadlineFormatted = formatShortDateID(rejectedDeadlineStr);
  const rejectedJamBatas = (isOct || isNov) ? '15:00' : '17:00';
  const rejectedDescription = isOct
    ? `Berdasarkan Pasal 19 PER-9/PB/2026, dalam hal KPPN melakukan penolakan atas pengajuan SPM-LS Kontraktual/BAST pada hari ini (${formatShortDateID(dateStr)}), Satker dapat mengajukan kembali perbaikan SPM paling lambat 2 Hari Kerja setelah ditolak yaitu ${rejectedDeadlineFormatted} pukul ${rejectedJamBatas} WIB dengan melampirkan bukti penolakan SPM dari KPPN.`
    : `Berdasarkan regulasi PER-9/PB/2026, jika terdapat penolakan dokumen pengajuan pada hari ini (${formatShortDateID(dateStr)}), perbaikan diajukan paling lambat 2 Hari Kerja yaitu ${rejectedDeadlineFormatted} pukul ${rejectedJamBatas} WIB dengan melampirkan bukti penolakan resmi.`;

  return {
    dateStr,
    sourceDateStr,
    sourceDateFormatted,
    forwardDeadlineStr,
    forwardDeadlineFormatted,
    stepsBack,
    stepsForward: forwardResult.steps,
    label,
    shortLabel,
    description,
    pasal: `${pasal} PER-9/PB/2026`,
    isOctober: isOct,
    isNovember: isNov,
    isDecember: false,
    hardCutOffDateStr,
    hardCutOffFormatted,
    subClauseType: 'OCT_NOV_ROLLING',
    rejectedDeadlineStr,
    rejectedDeadlineFormatted,
    rejectedJamBatas,
    rejectedRulePasal: 'Pasal 19 PER-9/PB/2026',
    rejectedDescription
  };
}

/**
 * Konversi objek Rolling5HKInfo menjadi format LLATEvent resmi
 * agar dapat terintegrasi sempurna di panel "Hari Ini Ada Deadline Apa?",
 * agenda harian, modal detail, dan penghitung KPI.
 */
export function createRolling5HKEvent(r5hk: Rolling5HKInfo): LLATEvent {
  const isOct = r5hk.isOctober;
  const isNov = r5hk.isNovember;
  const isDec = r5hk.isDecember;

  let kodeKegiatan = 'PASAL-6&18';
  let namaKegiatan = '';
  let jenisDokumen = '';
  let kategori = 'Kontrak & BAST';

  if (isOct) {
    kodeKegiatan = 'PASAL-6&18';
    namaKegiatan = `Batas 5 HK: BAST & Kontrak Ditandatangani ${r5hk.sourceDateFormatted}`;
    jenisDokumen = 'Pendaftaran Data Kontrak & SPM-LS Kontraktual (BAST/BAPP)';
    kategori = 'Kontrak & BAST';
  } else if (isNov) {
    kodeKegiatan = 'PASAL-6.3';
    namaKegiatan = `Batas 5 HK: Pendaftaran Kontrak Ditandatangani ${r5hk.sourceDateFormatted}`;
    jenisDokumen = 'Pendaftaran Data Kontrak / Addendum';
    kategori = 'Pendaftaran Kontrak';
  } else if (isDec) {
    kodeKegiatan = r5hk.isFixedDateCutOff ? 'PASAL-6.5' : 'PASAL-6.3';
    namaKegiatan = r5hk.label;
    jenisDokumen = 'Pendaftaran Kontrak & Penerbitan NRK KPPN';
    kategori = 'Pendaftaran Kontrak';
  } else {
    kodeKegiatan = 'PASAL-6';
    namaKegiatan = r5hk.label;
    jenisDokumen = 'Dokumen Kontraktual / BAST';
    kategori = 'Kontrak & BAST';
  }

  const defaultJam = (isOct || isNov) ? '15:00' : '17:00';

  return {
    llat_id: `rolling-5hk-${r5hk.dateStr}`,
    tahun_anggaran: 2026,
    kode_kegiatan: kodeKegiatan,
    nama_kegiatan: namaKegiatan,
    kategori: kategori,
    deskripsi: r5hk.description,
    tanggal_mulai: r5hk.sourceDateStr,
    tanggal_batas: r5hk.dateStr,
    jam_batas: defaultJam,
    timezone: 'WIB',
    status: 'HARI_INI',
    status_mode: 'AUTO',
    prioritas: 'PENTING',
    target_pengguna: ['SEMUA_SATKER', 'PPK', 'PPSPM'],
    dasar_hukum: r5hk.pasal,
    nomor_peraturan: 'PER-9/PB/2026',
    catatan: `Klausul batas waktu 5 hari kerja (H+5 HK). Tanggal penerbitan dokumen acuan: ${r5hk.sourceDateFormatted}. Batas pengajuan ke KPPN Semarang I: ${r5hk.dateStr} pukul ${defaultJam} WIB (Plafon mutlak: ${r5hk.hardCutOffFormatted}).`,
    urutan: 999,
    is_active: true,
    publikasi: 'PUBLISHED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    jenis_dokumen: jenisDokumen,
    jenis_tenggat: 'Batas Diterima KPPN',
    tanggal_tenggat: r5hk.dateStr,
    jam_tenggat: defaultJam,
    tanggal_penerimaan: r5hk.dateStr,
    jam_penerimaan: defaultJam,
    tanggal_penyelesaian: r5hk.dateStr,
    jam_penyelesaian: defaultJam,
    ketentuan_waktu: 'HARI_KERJA',
    is_tanggal_pasti: true,
    status_verifikasi: 'TERVERIFIKASI',
    status_penyelesaian: 'BELUM_SELESAI',
    nomor_peraturan_resmi: 'PER-9/PB/2026',
    pasal_bab: r5hk.pasal
  };
}

/**
 * Menghasilkan daftar LLATEvent rolling 5 HK untuk rentang tanggal tertentu
 * (digunakan untuk panel Deadline Terdekat, 7 Hari Ke Depan, Perlu Perhatian, dan pencarian)
 */
export function getRolling5HKEventsInRange(startDateStr: string, endDateStr: string): LLATEvent[] {
  const events: LLATEvent[] = [];
  if (!startDateStr || !endDateStr || startDateStr > endDateStr) return events;

  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start.getTime() > end.getTime()) {
    return events;
  }

  const current = new Date(start);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const r5hk = getRolling5HKInfo(dateStr);
    if (r5hk) {
      events.push(createRolling5HKEvent(r5hk));
    }

    current.setDate(current.getDate() + 1);
  }

  return events;
}


