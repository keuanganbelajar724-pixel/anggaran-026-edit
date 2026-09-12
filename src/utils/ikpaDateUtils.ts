/**
 * Utility functions for parsing, converting, and formatting IKPA dates.
 * Handles Excel serial numbers (e.g. 45292, 45321), ISO dates (YYYY-MM-DD),
 * and Indonesian / text date strings.
 */

export function isExcelDateSerial(val: any): boolean {
  if (val === null || val === undefined || val === '') return false;
  const num = Number(val);
  return !isNaN(num) && num >= 20000 && num <= 75000;
}

export function excelSerialToDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const d = new Date(utcDays * 86400 * 1000);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Normalizes any date input (Excel serial, DD/MM/YYYY, DD-MMM-YY, ISO string) into standard 'YYYY-MM-DD'.
 */
export function normalizeDateToIso(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (!str || str === '-' || str === 'null' || str === 'undefined') return '';

  // 1. If Excel serial number (e.g. "45321" or 45321)
  if (isExcelDateSerial(str)) {
    const d = excelSerialToDate(Number(str));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // 2. If already standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 3. If DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    let year = dmy[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // 4. If DD-MMM-YY (e.g. "08-FEB-22", "28-FEB-2022")
  const MONTHS: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', mei: '05', may: '05',
    jun: '06', jul: '07', agu: '08', aug: '08', sep: '09', okt: '10',
    oct: '10', nov: '11', des: '12', dec: '12'
  };
  const textMatch = str.match(/^(\d{1,2})[\s\-]+([a-zA-Z]{3,})[\s\-]+(\d{2,4})$/);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const mStr = textMatch[2].toLowerCase().substring(0, 3);
    const m = MONTHS[mStr];
    let year = textMatch[3];
    if (year.length === 2) year = `20${year}`;
    if (m) {
      return `${year}-${m}-${day}`;
    }
  }

  // 5. Fallback Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return str;
}

/**
 * Format date for human display in tables / UI:
 * - 'short': "30/01/2024"
 * - 'long': "30 Jan 2024"
 * - 'iso': "2024-01-30"
 */
export function formatDateDisplay(val: any, mode: 'short' | 'long' | 'iso' = 'short'): string {
  if (!val) return '-';
  const iso = normalizeDateToIso(val);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return String(val || '-');

  const [y, m, d] = iso.split('-');
  if (mode === 'iso') return iso;
  if (mode === 'short') return `${d}/${m}/${y}`;

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthIdx = parseInt(m, 10) - 1;
  const monthName = MONTH_NAMES[monthIdx] || m;
  return `${d} ${monthName} ${y}`;
}

/**
 * Sanitizes and normalizes all date fields in a SimulationProject
 */
export function sanitizeProjectDates<T extends {
  revisiDIPA?: any[];
  belanjaKontraktual?: any[];
  penyelesaianTagihan?: any[];
  upTUPTunai?: any[];
}>(project: T): T {
  if (!project) return project;
  return {
    ...project,
    revisiDIPA: (project.revisiDIPA || []).map(r => ({
      ...r,
      tanggalRevisi: r.tanggalRevisi ? normalizeDateToIso(r.tanggalRevisi) : ''
    })),
    belanjaKontraktual: (project.belanjaKontraktual || []).map(k => ({
      ...k,
      tanggalKontrak: k.tanggalKontrak ? normalizeDateToIso(k.tanggalKontrak) : '',
      tanggalMasuk: k.tanggalMasuk ? normalizeDateToIso(k.tanggalMasuk) : '',
      tanggalPenyelesaian: k.tanggalPenyelesaian ? normalizeDateToIso(k.tanggalPenyelesaian) : ''
    })),
    penyelesaianTagihan: (project.penyelesaianTagihan || []).map(t => ({
      ...t,
      tanggalSP2D: t.tanggalSP2D ? normalizeDateToIso(t.tanggalSP2D) : '',
      tanggalSPM: t.tanggalSPM ? normalizeDateToIso(t.tanggalSPM) : '',
      tanggalBAST: t.tanggalBAST ? normalizeDateToIso(t.tanggalBAST) : '',
      tanggalBAPP: t.tanggalBAPP ? normalizeDateToIso(t.tanggalBAPP) : '',
      tanggalMulaiPerhitungan: t.tanggalMulaiPerhitungan ? normalizeDateToIso(t.tanggalMulaiPerhitungan) : '',
      tanggalKonversiADK: t.tanggalKonversiADK ? normalizeDateToIso(t.tanggalKonversiADK) : ''
    })),
    upTUPTunai: (project.upTUPTunai || []).map(u => {
      const isAccidentalDummy = u.totalGUP === 50000000 && u.totalOutstandingUP === 300000000;
      return {
        ...u,
        tanggal: u.tanggal ? normalizeDateToIso(u.tanggal) : '',
        totalGUP: isAccidentalDummy ? 0 : u.totalGUP,
        totalOutstandingUP: isAccidentalDummy ? 0 : u.totalOutstandingUP,
        selisihHariKalender: isAccidentalDummy ? 0 : u.selisihHariKalender,
        status: isAccidentalDummy ? '-' : u.status
      };
    })
  };
}
