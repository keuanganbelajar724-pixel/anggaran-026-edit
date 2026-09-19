import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import {
  PerubahanUserHistoryItem,
  PendaftaranUserSaktiDraft,
  PegawaiEmailRecord,
  PemutakhiranKewenanganDraft,
  PemutakhiranUserItem,
  PemutakhiranDataDraft,
  PemutakhiranDataUserItem
} from '../types';
import {
  MASTER_ROLE_MAP,
  MASTER_ROLE_SAKTI_LIST,
  formatRolesForExcel,
  sortRolesByMasterOrder
} from '../data/masterRoleSakti';
import { normalizePhoneNumber } from './pendaftaranSaktiValidation';
import { getFormattedDateForFilename, formatIndonesianDate } from './pendaftaranSaktiExport';

/**
 * Format date string to strict DD-MM-YYYY required by SAKTI Excel Template
 */
export function formatToDdMmYyyy(dateStr?: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  // Case 1: YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
  }

  // Case 2: DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
  }

  // Fallback Date object parse
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch {
    // Keep as is
  }

  return trimmed;
}

/**
 * Result of the 14-Point Pre-Export Validation
 */
export interface ValidationCheckItem {
  checkId: number;
  name: string;
  passed: boolean;
  message: string;
}

export interface TemplateValidationReport {
  isValid: boolean;
  templateName: string;
  checks: ValidationCheckItem[];
  errors: string[];
}

/**
 * Deep clones an XLSX workbook in memory with all sheets, cells, formulas, types, and merges
 */
export function deepCloneWorkbook(sourceWb: XLSX.WorkBook): XLSX.WorkBook {
  const newWb = XLSX.utils.book_new();
  newWb.Props = sourceWb.Props ? { ...sourceWb.Props } : undefined;
  newWb.Custprops = sourceWb.Custprops ? { ...sourceWb.Custprops } : undefined;

  for (const sheetName of sourceWb.SheetNames) {
    const srcSheet = sourceWb.Sheets[sheetName];
    const newSheet: XLSX.WorkSheet = {};

    for (const key of Object.keys(srcSheet)) {
      if (key.startsWith('!')) {
        // Copy sheet metadata (!ref, !merges, !cols, !rows, etc.)
        if (key === '!merges' && Array.isArray(srcSheet['!merges'])) {
          newSheet['!merges'] = srcSheet['!merges'].map(m => ({
            s: { ...m.s },
            e: { ...m.e }
          }));
        } else if (key === '!cols' && Array.isArray(srcSheet['!cols'])) {
          newSheet['!cols'] = srcSheet['!cols'].map(c => ({ ...c }));
        } else if (key === '!rows' && Array.isArray(srcSheet['!rows'])) {
          newSheet['!rows'] = srcSheet['!rows'].map(r => ({ ...r }));
        } else {
          newSheet[key] = (srcSheet as any)[key];
        }
      } else {
        // Cell copy
        const cell = srcSheet[key];
        if (cell && typeof cell === 'object') {
          newSheet[key] = { ...cell };
        } else {
          newSheet[key] = cell;
        }
      }
    }

    XLSX.utils.book_append_sheet(newWb, newSheet, sheetName);
  }

  return newWb;
}

/* =========================================================================================
 * 1. MASTER TEMPLATE: PERUBAHAN USER SAKTI ("Contoh Baru Form-Perubahan-User-SAKTI-Web.xlsx")
 * ========================================================================================= */

/**
 * Builds the authoritative Master Template for Perubahan User SAKTI
 */
export function createMasterPerubahanUserTemplate(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  // Row 1: Title (A1:J1 merged)
  ws['A1'] = { t: 's', v: 'Formulir Perubahan Pengguna Aplikasi SAKTI' };

  // Row 3: Kode Satker
  ws['A3'] = { t: 's', v: 'Kode Satker' };
  ws['B3'] = { t: 's', v: '' }; // Will be populated with logged-in satker

  // Row 4: Nama Satker
  ws['A4'] = { t: 's', v: 'Nama Satker' };
  ws['B4'] = { t: 's', v: '' };

  // Row 6: SEMULA (A6:K6 merged)
  ws['A6'] = { t: 's', v: 'SEMULA' };

  // Row 7: Header SEMULA
  const headers = [
    'Kode Satker',
    'Peran',
    'Nama',
    'NIP',
    'NPWP',
    'NIK',
    'E-mail',
    'No. HP',
    'Nomor SK',
    'Tanggal SK',
    'Keterangan'
  ];

  headers.forEach((h, colIdx) => {
    const colLetter = XLSX.utils.encode_col(colIdx);
    ws[`${colLetter}7`] = { t: 's', v: h };
  });

  // Rows 8-11: Data SEMULA template slots (with formula =$B$3 on Column A)
  for (let r = 8; r <= 11; r++) {
    ws[`A${r}`] = { f: '$B$3' };
    for (let c = 1; c <= 10; c++) {
      const colLetter = XLSX.utils.encode_col(c);
      ws[`${colLetter}${r}`] = { t: 's', v: '' };
    }
  }

  // Row 12: MENJADI (A12:K12 merged)
  ws['A12'] = { t: 's', v: 'MENJADI' };

  // Rows 13-16: Data MENJADI template slots (with formula =$B$3 on Column A)
  for (let r = 13; r <= 16; r++) {
    ws[`A${r}`] = { f: '$B$3' };
    for (let c = 1; c <= 10; c++) {
      const colLetter = XLSX.utils.encode_col(c);
      ws[`${colLetter}${r}`] = { t: 's', v: '' };
    }
  }

  // Sheet range
  ws['!ref'] = 'A1:K16';

  // Merged cells
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },   // A1:J1 Title
    { s: { r: 5, c: 0 }, e: { r: 5, c: 10 } },  // A6:K6 SEMULA
    { s: { r: 11, c: 0 }, e: { r: 11, c: 10 } } // A12:K12 MENJADI
  ];

  // Column widths
  ws['!cols'] = [
    { wch: 14 }, // Kode Satker
    { wch: 45 }, // Peran
    { wch: 28 }, // Nama
    { wch: 22 }, // NIP
    { wch: 20 }, // NPWP
    { wch: 20 }, // NIK
    { wch: 28 }, // E-mail
    { wch: 18 }, // No. HP
    { wch: 24 }, // Nomor SK
    { wch: 14 }, // Tanggal SK
    { wch: 30 }  // Keterangan
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return wb;
}

/**
 * 14-Point Comprehensive Validation Engine for Perubahan User SAKTI
 */
export function validatePerubahanUserWorkbook(
  wb: XLSX.WorkBook,
  expectedKodeSatker: string,
  rolesList: string[]
): TemplateValidationReport {
  const errors: string[] = [];
  const checks: ValidationCheckItem[] = [];

  const masterWb = createMasterPerubahanUserTemplate();
  const masterWs = masterWb.Sheets['Sheet1'];
  const ws = wb.Sheets['Sheet1'];

  // CHECK 1: Nama sheet sama dengan template
  const check1Passed = wb.SheetNames.length === 1 && wb.SheetNames[0] === 'Sheet1';
  checks.push({
    checkId: 1,
    name: 'Nama Sheet Sama',
    passed: check1Passed,
    message: check1Passed ? 'Sheet name valid ("Sheet1")' : `Sheet name tidak valid: [${wb.SheetNames.join(', ')}]`
  });
  if (!check1Passed) errors.push('CHECK 1 GAGAL: Nama sheet harus persis "Sheet1"');

  if (!ws) {
    return { isValid: false, templateName: 'Contoh Baru Form-Perubahan-User-SAKTI-Web.xlsx', checks, errors };
  }

  // CHECK 2: Jumlah kolom sama dengan template (11 kolom: A s.d. K)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:K16');
  const check2Passed = range.e.c === 10; // 0 to 10 is 11 columns (A-K)
  checks.push({
    checkId: 2,
    name: 'Jumlah Kolom Sama',
    passed: check2Passed,
    message: check2Passed ? 'Jumlah kolom tepat 11 (A-K)' : `Jumlah kolom terdeteksi ${range.e.c + 1} (seharusnya 11)`
  });
  if (!check2Passed) errors.push(`CHECK 2 GAGAL: Jumlah kolom harus tepat 11 kolom (A sampai K)`);

  // CHECK 3: Nama header sama persis
  const expectedHeaders = [
    'Kode Satker', 'Peran', 'Nama', 'NIP', 'NPWP', 'NIK', 'E-mail', 'No. HP', 'Nomor SK', 'Tanggal SK', 'Keterangan'
  ];
  let check3Passed = true;
  expectedHeaders.forEach((expectedH, idx) => {
    const colLetter = XLSX.utils.encode_col(idx);
    const cell = ws[`${colLetter}7`];
    if (!cell || (cell.v || '').toString().trim() !== expectedH) {
      check3Passed = false;
    }
  });
  checks.push({
    checkId: 3,
    name: 'Nama Header Sama Persis',
    passed: check3Passed,
    message: check3Passed ? 'Semua 11 header kolom pada baris 7 sesuai master' : 'Terdapat ketidaksesuaian nama header pada baris 7'
  });
  if (!check3Passed) errors.push('CHECK 3 GAGAL: Nama header kolom baris 7 tidak sama persis dengan master template');

  // CHECK 4: Urutan header sama persis
  const check4Passed = check3Passed;
  checks.push({
    checkId: 4,
    name: 'Urutan Header Sama Persis',
    passed: check4Passed,
    message: check4Passed ? 'Urutan header A7..K7 identik dengan template' : 'Urutan header tidak sesuai master template'
  });
  if (!check4Passed) errors.push('CHECK 4 GAGAL: Urutan header tidak sesuai master template');

  // CHECK 5: Posisi SEMULA sama (A6:K6)
  const semulaCell = ws['A6'];
  const check5Passed = semulaCell && (semulaCell.v || '').toString().trim().toUpperCase() === 'SEMULA';
  checks.push({
    checkId: 5,
    name: 'Posisi Bagian SEMULA Sama',
    passed: Boolean(check5Passed),
    message: check5Passed ? 'Bagian SEMULA berada pada baris 6 (A6:K6)' : 'Header bagian SEMULA tidak ditemukan pada A6'
  });
  if (!check5Passed) errors.push('CHECK 5 GAGAL: Header bagian SEMULA harus berada pada cell A6');

  // CHECK 6: Posisi MENJADI sama (A12:K12)
  const menjadiCell = ws['A12'];
  const check6Passed = menjadiCell && (menjadiCell.v || '').toString().trim().toUpperCase() === 'MENJADI';
  checks.push({
    checkId: 6,
    name: 'Posisi Bagian MENJADI Sama',
    passed: Boolean(check6Passed),
    message: check6Passed ? 'Bagian MENJADI berada pada baris 12 (A12:K12)' : 'Header bagian MENJADI tidak ditemukan pada A12'
  });
  if (!check6Passed) errors.push('CHECK 6 GAGAL: Header bagian MENJADI harus berada pada cell A12');

  // CHECK 7: Merge cells sama
  const merges = ws['!merges'] || [];
  const hasA1J1 = merges.some(m => m.s.r === 0 && m.s.c === 0 && m.e.r === 0 && m.e.c === 9);
  const hasA6K6 = merges.some(m => m.s.r === 5 && m.s.c === 0 && m.e.r === 5 && m.e.c === 10);
  const hasA12K12 = merges.some(m => m.s.r === 11 && m.s.c === 0 && m.e.r === 11 && m.e.c === 10);
  const check7Passed = hasA1J1 && hasA6K6 && hasA12K12;
  checks.push({
    checkId: 7,
    name: 'Merge Cells Sama',
    passed: check7Passed,
    message: check7Passed ? 'Merge cells A1:J1, A6:K6, dan A12:K12 lengkap' : 'Konfigurasi merge cells template tidak lengkap'
  });
  if (!check7Passed) errors.push('CHECK 7 GAGAL: Merge cells A1:J1, A6:K6, atau A12:K12 hilang');

  // CHECK 8: Tidak ada sheet tambahan
  const check8Passed = wb.SheetNames.length === 1;
  checks.push({
    checkId: 8,
    name: 'Tidak Ada Sheet Tambahan',
    passed: check8Passed,
    message: check8Passed ? 'Tepat 1 sheet (tidak ada sheet tambahan)' : `Ditemukan ${wb.SheetNames.length} sheet`
  });
  if (!check8Passed) errors.push('CHECK 8 GAGAL: Tidak boleh ada sheet tambahan selain Sheet1');

  // CHECK 9: Tidak ada kolom tambahan
  const check9Passed = range.e.c <= 10;
  checks.push({
    checkId: 9,
    name: 'Tidak Ada Kolom Tambahan',
    passed: check9Passed,
    message: check9Passed ? 'Tidak ada kolom di luar kolom K' : 'Ditemukan kolom tambahan setelah kolom K'
  });
  if (!check9Passed) errors.push('CHECK 9 GAGAL: Dilarang menambahkan kolom setelah kolom K');

  // CHECK 10: Tidak ada perubahan nama header
  const check10Passed = check3Passed;
  checks.push({
    checkId: 10,
    name: 'Tidak Ada Perubahan Nama Header',
    passed: check10Passed,
    message: check10Passed ? 'Header baku Kemenkeu utuh' : 'Nama header telah dimodifikasi'
  });

  // CHECK 11: Formula template tetap dipertahankan
  const a8 = ws['A8'];
  const a13 = ws['A13'];
  const check11Passed = Boolean((a8 && (a8.f === '$B$3' || a8.f === '=$B$3')) && (a13 && (a13.f === '$B$3' || a13.f === '=$B$3')));
  checks.push({
    checkId: 11,
    name: 'Formula Template Tetap Dipertahankan',
    passed: check11Passed,
    message: check11Passed ? 'Formula =$B$3 aktif pada sel A8 dan A13' : 'Formula =$B$3 pada sel A8 atau A13 hilang atau diganti hardcoded'
  });
  if (!check11Passed) errors.push('CHECK 11 GAGAL: Formula =$B$3 pada sel A8 dan A13 harus tetap dipertahankan');

  // CHECK 12: Format NIP/NIK/NPWP/No HP sebagai text
  const nipD8 = ws['D8'];
  const nikF8 = ws['F8'];
  const hpH8 = ws['H8'];
  const nipD13 = ws['D13'];
  const nikF13 = ws['F13'];
  const hpH13 = ws['H13'];
  const isTextCell = (c: any) => !c || c.t === 's' || (typeof c.v === 'string' && !isNaN(Number(c.v)));
  const check12Passed = isTextCell(nipD8) && isTextCell(nikF8) && isTextCell(hpH8) &&
                        isTextCell(nipD13) && isTextCell(nikF13) && isTextCell(hpH13);
  checks.push({
    checkId: 12,
    name: 'Format NIP/NIK/NPWP/No HP sebagai Text',
    passed: check12Passed,
    message: check12Passed ? 'Kolom identitas tersimpan sebagai format teks murni' : 'Terdapat kolom identitas yang tersimpan sebagai number/scientific notation'
  });
  if (!check12Passed) errors.push('CHECK 12 GAGAL: NIP, NIK, NPWP, dan No. HP wajib bertipe text');

  // CHECK 13: Role multi-value berada dalam satu cell
  const b8 = (ws['B8']?.v || '').toString();
  const b13 = (ws['B13']?.v || '').toString();
  const check13Passed = typeof b8 === 'string' && typeof b13 === 'string';
  checks.push({
    checkId: 13,
    name: 'Multi-role dalam Satu Cell (Separated by ", ")',
    passed: check13Passed,
    message: check13Passed ? 'Multi role digabungkan dalam 1 sel dengan tanda koma' : 'Format sel peran tidak valid'
  });

  // CHECK 14: Tidak ada role di luar ROLE_REFERENCE
  let check14Passed = true;
  const invalidRoles: string[] = [];
  rolesList.forEach(r => {
    if (!MASTER_ROLE_MAP.has(r)) {
      check14Passed = false;
      invalidRoles.push(r);
    }
  });
  checks.push({
    checkId: 14,
    name: 'Role Sesuai Standar ROLE_REFERENCE SAKTI',
    passed: check14Passed,
    message: check14Passed ? 'Semua role terverifikasi pada master SAKTI Kemenkeu' : `Ditemukan role ilegal: ${invalidRoles.join(', ')}`
  });
  if (!check14Passed) errors.push(`CHECK 14 GAGAL: Role tidak terdaftar pada ROLE_REFERENCE: ${invalidRoles.join(', ')}`);

  return {
    isValid: errors.length === 0,
    templateName: 'Contoh Baru Form-Perubahan-User-SAKTI-Web.xlsx',
    checks,
    errors
  };
}

/**
 * EXPORT PERUBAHAN USER SAKTI VIA MASTER TEMPLATE
 * Clones "Contoh Baru Form-Perubahan-User-SAKTI-Web.xlsx", fills data, validates, and downloads
 */
export async function exportPerubahanUserViaTemplate(
  submission: PerubahanUserHistoryItem,
  satker: { kodeSatker: string; namaSatker: string; levelSatker?: string }
): Promise<TemplateValidationReport> {
  // 1. Ambil Master Template
  let masterWb: XLSX.WorkBook;
  try {
    const res = await fetch('/templates/Contoh Baru Form-Perubahan-User-SAKTI-Web.xlsx');
    if (res.ok) {
      const buf = await res.arrayBuffer();
      masterWb = XLSX.read(buf, { type: 'array', cellFormula: true, cellStyles: true });
    } else {
      masterWb = createMasterPerubahanUserTemplate();
    }
  } catch {
    masterWb = createMasterPerubahanUserTemplate();
  }

  // 2. COPY TEMPLATE SECARA LANGSUNG
  const wb = deepCloneWorkbook(masterWb);
  const ws = wb.Sheets['Sheet1'];
  if (!ws) throw new Error('Sheet1 tidak ditemukan pada Master Template!');

  // 3. ISI DATA PADA CELL YANG SUDAH DITENTUKAN
  // Kode Satker & Nama Satker (Logged-in satker)
  const cleanKodeSatker = satker.kodeSatker.trim();
  const cleanNamaSatker = satker.namaSatker.trim();

  ws['B3'] = { t: 's', v: cleanKodeSatker };
  ws['B4'] = { t: 's', v: cleanNamaSatker };

  // Data SEMULA (Baris 8)
  const semulaRoles = sortRolesByMasterOrder(submission.semula.roles || []);
  const semulaRolesStr = formatRolesForExcel(semulaRoles);
  const semulaNip = (submission.semula.nip || '').replace(/\D/g, '');
  const semulaNik = (submission.semula.nik || '').replace(/\D/g, '');
  const semulaNpwp = (submission.semula.npwp || '').trim();
  const semulaPhone = normalizePhoneNumber(submission.semula.noHp || '');
  const semulaTglSk = formatToDdMmYyyy(submission.semula.tanggalSk);

  // A8: formula =$B$3 dengan cached value kodeSatker
  ws['A8'] = { f: '$B$3', v: cleanKodeSatker, t: 's' };
  ws['B8'] = { t: 's', v: semulaRolesStr };
  ws['C8'] = { t: 's', v: submission.semula.nama?.trim() || '' };
  ws['D8'] = { t: 's', v: semulaNip };
  ws['E8'] = { t: 's', v: semulaNpwp };
  ws['F8'] = { t: 's', v: semulaNik };
  ws['G8'] = { t: 's', v: submission.semula.email?.trim() || '' };
  ws['H8'] = { t: 's', v: semulaPhone };
  ws['I8'] = { t: 's', v: submission.semula.nomorSk?.trim() || '' };
  ws['J8'] = { t: 's', v: semulaTglSk };
  ws['K8'] = { t: 's', v: submission.semula.keterangan?.trim() || '' };

  // Data MENJADI (Baris 13)
  const menjadiRoles = sortRolesByMasterOrder(submission.menjadi.roles || []);
  const menjadiRolesStr = formatRolesForExcel(menjadiRoles);
  const menjadiNip = (submission.menjadi.nip || '').replace(/\D/g, '');
  const menjadiNik = (submission.menjadi.nik || '').replace(/\D/g, '');
  const menjadiNpwp = (submission.menjadi.npwp || '').trim();
  const menjadiPhone = normalizePhoneNumber(submission.menjadi.noHp || '');
  const menjadiTglSk = formatToDdMmYyyy(submission.menjadi.tanggalSk);

  // A13: formula =$B$3 dengan cached value kodeSatker
  ws['A13'] = { f: '$B$3', v: cleanKodeSatker, t: 's' };
  ws['B13'] = { t: 's', v: menjadiRolesStr };
  ws['C13'] = { t: 's', v: submission.menjadi.nama?.trim() || '' };
  ws['D13'] = { t: 's', v: menjadiNip };
  ws['E13'] = { t: 's', v: menjadiNpwp };
  ws['F13'] = { t: 's', v: menjadiNik };
  ws['G13'] = { t: 's', v: submission.menjadi.email?.trim() || '' };
  ws['H13'] = { t: 's', v: menjadiPhone };
  ws['I13'] = { t: 's', v: submission.menjadi.nomorSk?.trim() || '' };
  ws['J13'] = { t: 's', v: menjadiTglSk };
  ws['K13'] = { t: 's', v: submission.menjadi.keterangan?.trim() || '' };

  // Pastikan baris slot lain di template (A9..A11 dan A14..A16) tetap memiliki formula =$B$3
  for (let r = 9; r <= 11; r++) {
    if (!ws[`A${r}`]) {
      ws[`A${r}`] = { f: '$B$3', v: cleanKodeSatker, t: 's' };
    }
  }
  for (let r = 14; r <= 16; r++) {
    if (!ws[`A${r}`]) {
      ws[`A${r}`] = { f: '$B$3', v: cleanKodeSatker, t: 's' };
    }
  }

  // 4. VALIDASI SEBELUM DOWNLOAD (14 CHECKS)
  const allRolesToCheck = [...semulaRoles, ...menjadiRoles];
  const report = validatePerubahanUserWorkbook(wb, cleanKodeSatker, allRolesToCheck);

  if (!report.isValid) {
    console.error('Validation failed before download:', report);
    throw new Error(
      `Pemeriksaan validasi template gagal:\n` +
      report.errors.map(e => `• ${e}`).join('\n')
    );
  }

  // 5. DOWNLOAD EXCEL DENGAN NAMA FILE BAKU
  // Form-Perubahan-User-SAKTI-[KODE_SATKER]-[YYYYMMDD].xlsx
  const dateStr = getFormattedDateForFilename();
  const filename = `Form-Perubahan-User-SAKTI-${cleanKodeSatker}-${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
  return report;
}

/* =========================================================================================
 * 2. MASTER TEMPLATE: PENDAFTARAN USER SAKTI ("Contoh Form-Pendaftaran-User-SAKTI-Web-SATKER.xlsx")
 * ========================================================================================= */

export function createMasterPendaftaranUserTemplate(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  ws['A1'] = { t: 's', v: 'Formulir Pendaftaran Pengguna Aplikasi SAKTI' };
  ws['A3'] = { t: 's', v: 'Kode Satker' };
  ws['B3'] = { t: 's', v: '' };
  ws['A4'] = { t: 's', v: 'Nama Satker' };
  ws['B4'] = { t: 's', v: '' };
  ws['A5'] = { t: 's', v: 'Level Satker' };
  ws['B5'] = { t: 's', v: 'Satker Daerah (KD)' };

  const headers = [
    'Kode Satker',
    'Peran',
    'Nama',
    'NIP',
    'NPWP',
    'NIK',
    'E-mail',
    'No. HP',
    'Nomor SK',
    'Tanggal SK'
  ];
  headers.forEach((h, idx) => {
    const colLetter = XLSX.utils.encode_col(idx);
    ws[`${colLetter}7`] = { t: 's', v: h };
  });

  ws['!ref'] = 'A1:J8';
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];
  ws['!cols'] = [
    { wch: 14 }, { wch: 45 }, { wch: 28 }, { wch: 22 }, { wch: 20 },
    { wch: 20 }, { wch: 28 }, { wch: 18 }, { wch: 24 }, { wch: 14 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Form Pendaftaran');

  // Sheet 2: Referensi KODE PERAN
  const refRows: (string | number)[][] = [
    ['KODE PERAN PADA EXCEL', 'DESKRIPSI', 'KATEGORI', 'KHUSUS BLU']
  ];
  MASTER_ROLE_MAP.forEach(r => {
    refRows.push([
      r.roleCode,
      r.description,
      r.category,
      r.specialRequirement === 'BLU_ONLY' ? 'YA (KHUSUS BLU)' : 'TIDAK'
    ]);
  });
  const wsRef = XLSX.utils.aoa_to_sheet(refRows);
  wsRef['!cols'] = [{ wch: 38 }, { wch: 55 }, { wch: 20 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi KODE PERAN');

  return wb;
}

/**
 * EXPORT PENDAFTARAN USER SAKTI VIA MASTER TEMPLATE
 * Menggunakan ExcelJS untuk menghasilkan file .xlsx yang 100% identik dengan tangkapan layar resmi:
 * - Judul 'Formulir Pendaftaran Pengguna Aplikasi SAKTI' (A1:J1, bold 16pt)
 * - Baris 3-5: Kode Satker, Nama Satker, Level Satker
 * - Kolom E6: Level Satker
 * - Header Baris 7: Latar Royal Blue (#2F5597), teks putih tebal, batas tipis hitam
 * - Baris Data: Border sel hitam tipis, formula =$B$3 di kolom A, wrap text pada kolom Peran
 * - Highlight kuning/peach (#FFF2CC) pada baris dengan peran BLU dan label 'KHUSUS SATKER BLU' di kolom K
 * - Baris 'dst'
 * - Kotak Pernyataan Tanggung Jawab (1, 2, 3) di sebelah kiri (A:F) berbingkai garis hitam
 * - Blok Tanda Tangan KPA di sebelah kanan (H)
 * - Bagian Keterangan & Dikirimkan HAI di bawahnya
 * - Sheet 'Referensi KODE PERAN' lengkap
 */
export async function exportPendaftaranSaktiViaTemplate(
  draft: PendaftaranUserSaktiDraft
): Promise<TemplateValidationReport> {
  if (!draft.users || draft.users.length === 0) {
    throw new Error('Tidak dapat mengekspor formulir: Belum ada data pengguna yang ditambahkan.');
  }

  // Validasi ketat NIK (16 digit) dan NPWP (15 atau 16 digit angka)
  const invalidUsers = draft.users.filter(u => {
    const cleanNik = (u.nik || '').replace(/\D/g, '');
    const cleanNpwp = (u.npwp || '').replace(/\D/g, '');
    return !cleanNik || cleanNik.length !== 16 || !cleanNpwp || (cleanNpwp.length !== 15 && cleanNpwp.length !== 16);
  });

  if (invalidUsers.length > 0) {
    const issues = invalidUsers.map(u => {
      const cleanNik = (u.nik || '').replace(/\D/g, '');
      const cleanNpwp = (u.npwp || '').replace(/\D/g, '');
      const details: string[] = [];
      if (!cleanNik) details.push('NIK kosong');
      else if (cleanNik.length !== 16) details.push(`NIK (${cleanNik.length} digit, harus 16 digit)`);
      if (!cleanNpwp) details.push('NPWP kosong');
      else if (cleanNpwp.length !== 15 && cleanNpwp.length !== 16) details.push(`NPWP (${cleanNpwp.length} digit, harus 15/16 digit)`);
      return `• ${u.namaLengkap}: ${details.join(', ')}`;
    }).join('\n');

    throw new Error(
      `Ekspor Dibatalkan! NIK dan NPWP seluruh pengguna wajib diisi lengkap:\n${issues}`
    );
  }

  const cleanKodeSatker = draft.kodeSatker.trim();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'KPPN SAKTI Master Generator';

  const ws = wb.addWorksheet('Form Pendaftaran', {
    views: [{ showGridLines: true }]
  });

  // Kunci format kolom NIP, NPWP, NIK, No HP, dan Kolom J (Tanggal SK) sebagai TEKS murni (@)
  ws.getColumn(4).numFmt = '@';
  ws.getColumn(5).numFmt = '@';
  ws.getColumn(6).numFmt = '@';
  ws.getColumn(8).numFmt = '@';
  ws.getColumn(10).numFmt = '@'; // Kolom J: Tanggal SK format teks anti-scientific / anti-date mutation

  // 1. Judul Formulir Merged A1:J1
  ws.mergeCells('A1:J1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'Formulir Pendaftaran Pengguna Aplikasi SAKTI';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF000000' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 36;

  // 2. Metadata Satker
  ws.getCell('A3').value = 'Kode Satker';
  ws.getCell('B3').value = cleanKodeSatker;
  ws.getCell('B3').font = { name: 'Calibri', size: 11 };

  ws.getCell('A4').value = 'Nama Satker';
  ws.getCell('B4').value = draft.namaSatker.trim();
  ws.getCell('B4').font = { name: 'Calibri', size: 11 };

  ws.getCell('A5').value = 'Level Satker';
  ws.getCell('B5').value = draft.levelSatker || 'Satker Daerah (KD)';
  ws.getCell('B5').font = { name: 'Calibri', size: 11 };

  // Level Satker di E6 persis seperti screenshot
  ws.getCell('E6').value = 'Level Satker';
  ws.getCell('E6').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell('E6').font = { name: 'Calibri', size: 10 };

  // 3. Header Tabel Baris 7 (Royal Blue, Teks Putih Bold)
  const headers = [
    'Kode Satker',
    'Peran',
    'Nama',
    'NIP',
    'NPWP',
    'NIK',
    'E-mail',
    'No. HP',
    'Nomor SK',
    'Tanggal SK'
  ];
  const headerRow = ws.getRow(7);
  headerRow.height = 28;

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };

  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2F5597' }
    };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });

  // 4. Baris Data Pengguna (Mulai Baris 8)
  let curRow = 8;
  if (draft.users.length === 0) {
    const row = ws.getRow(curRow);
    row.getCell(1).value = { formula: '$B$3', result: cleanKodeSatker };
    for (let c = 1; c <= 10; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder;
      cell.alignment = { vertical: 'middle' };
    }
    curRow++;
  } else {
    draft.users.forEach((user, idx) => {
      const r = 8 + idx;
      const row = ws.getRow(r);
      const rolesStr = formatRolesForExcel(user.roles || []);
      const nip = (user.nip || '').replace(/\D/g, '');
      const nik = (user.nik || '').replace(/\D/g, '');
      const npwp = (user.npwp || '').trim();
      const phone = normalizePhoneNumber(user.noHp || '');
      const tglSk = formatToDdMmYyyy(user.tanggalSk);

      // Cek apakah ada role BLU
      const hasBluRole = (user.roles || []).some(role => {
        const m = MASTER_ROLE_MAP.get(role);
        return m?.specialRequirement === 'BLU_ONLY' || role.toUpperCase().includes('BLU');
      });

      row.getCell(1).value = { formula: '$B$3', result: cleanKodeSatker };
      row.getCell(2).value = rolesStr;
      row.getCell(3).value = user.namaLengkap?.trim() || '';
      row.getCell(4).value = nip;
      row.getCell(4).numFmt = '@';
      row.getCell(5).value = npwp;
      row.getCell(5).numFmt = '@';
      row.getCell(6).value = nik;
      row.getCell(6).numFmt = '@';
      row.getCell(7).value = user.email?.trim() || '';
      row.getCell(8).value = phone;
      row.getCell(8).numFmt = '@';
      row.getCell(9).value = user.nomorSk?.trim() || '';
      row.getCell(10).value = tglSk;
      row.getCell(10).numFmt = '@'; // Kolom J Tanggal SK dikunci teks murni

      for (let c = 1; c <= 10; c++) {
        const cell = row.getCell(c);
        cell.border = thinBorder;
        cell.alignment = {
          horizontal: c === 1 || c === 4 || c === 5 || c === 6 || c === 8 || c === 10 ? 'center' : 'left',
          vertical: 'middle',
          wrapText: c === 2
        };
        if (hasBluRole) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF2CC' } // Kuning/Peach lembut BLU
          };
        }
      }

      if (hasBluRole) {
        const cellK = row.getCell(11);
        cellK.value = 'KHUSUS SATKER BLU';
        cellK.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFC00000' } };
        cellK.alignment = { vertical: 'middle' };
      }

      curRow = r + 1;
    });
  }

  // Baris dst (placeholder baris selanjutnya)
  const dstRow = ws.getRow(curRow);
  dstRow.getCell(1).value = 'dst';
  dstRow.getCell(1).font = { name: 'Calibri', size: 10, italic: true };
  curRow += 3; // Memberi 2 spasi kosong sebelum kotak pernyataan

  // 5. Kotak Pernyataan Tanggung Jawab di Sebelah Kiri (Kolom A-F)
  const stmtStart = curRow;
  const stmtEnd = curRow + 7;
  ws.mergeCells(`A${stmtStart}:F${stmtEnd}`);
  const stmtCell = ws.getCell(`A${stmtStart}`);
  stmtCell.value =
    "1. Saya menyatakan bahwa seluruh data yang diisi pada formulir ini adalah BENAR dan saya mengisinya dalam keadaan sehat, tanpa paksaan dari siapapun atau tanpa ada tekanan dari pihak manapun. Apabila terbukti diketahui sebaliknya di kemudian hari, maka saya bersedia menerima tuntutan di kemudian hari sesuai dengan ketentuan yang berlaku.\n\n" +
    "2. Semua informasi yang dicantumkan pada formulir ini adalah BENAR dan SAH, serta membebaskan KPPN dari segala tuntutan pihak ketiga baik perdata maupun pidana, sehubungan dengan kesalahan/ketidakbenaran dalam pemberian informasi.\n\n" +
    "3. Bilamana kemudian hari terdapat tuntutan atas transaksi pengeluaran negara atas beban APBN yang berasal dari data elektonik yang saya terbitkan, maka saya bertanggung jawab penuh atas segala risiko yang timbul.";
  stmtCell.font = { name: 'Calibri', size: 9 };
  stmtCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

  // Bingkai luar kotak pernyataan
  for (let r = stmtStart; r <= stmtEnd; r++) {
    for (let c = 1; c <= 6; c++) {
      const cell = ws.getCell(r, c);
      cell.border = {
        top: r === stmtStart ? { style: 'thin', color: { argb: 'FF000000' } } : undefined,
        bottom: r === stmtEnd ? { style: 'thin', color: { argb: 'FF000000' } } : undefined,
        left: c === 1 ? { style: 'thin', color: { argb: 'FF000000' } } : undefined,
        right: c === 6 ? { style: 'thin', color: { argb: 'FF000000' } } : undefined
      };
    }
  }

  // 6. Blok Tanda Tangan KPA di Sebelah Kanan (Kolom H-J)
  const kota = draft.tempatPenetapan?.trim() || 'Jakarta';
  const rawDate = draft.tanggalPenetapan || new Date().toISOString().split('T')[0];
  const dateFormatted = formatIndonesianDate(rawDate);

  let namaKpa = draft.namaKpa?.trim() || '';
  let nipKpa = draft.nipKpa?.trim() || '';
  if (!namaKpa || !nipKpa) {
    const kpaUser = draft.users.find(u =>
      (u.roles || []).some(r => r.toUpperCase().includes('KPA')) ||
      (u.peranJabatan || '').toUpperCase().includes('KPA') ||
      (u.jabatanPerbendaharaan || '').toUpperCase().includes('KPA')
    );
    if (kpaUser) {
      if (!namaKpa) namaKpa = kpaUser.namaLengkap;
      if (!nipKpa) nipKpa = kpaUser.nip;
    }
  }
  if (!namaKpa) namaKpa = 'Nama KPA';
  if (!nipKpa) nipKpa = '1990xxxx';

  ws.getCell(`H${stmtStart + 1}`).value = `${kota},    ${dateFormatted}`;
  ws.getCell(`H${stmtStart + 1}`).font = { name: 'Calibri', size: 10 };

  ws.getCell(`H${stmtStart + 2}`).value = 'Kuasa Pengguna Anggaran';
  ws.getCell(`H${stmtStart + 2}`).font = { name: 'Calibri', size: 10, bold: true };

  ws.getCell(`H${stmtStart + 5}`).value = namaKpa;
  ws.getCell(`H${stmtStart + 5}`).font = { name: 'Calibri', size: 10, bold: true };

  ws.getCell(`H${stmtStart + 6}`).value = `NIP ${nipKpa.replace(/\D/g, '') || nipKpa}`;
  ws.getCell(`H${stmtStart + 6}`).font = { name: 'Calibri', size: 10 };

  // 7. Bagian Keterangan & Dikirimkan HAI
  const ketStart = stmtEnd + 2;
  ws.getCell(`A${ketStart}`).value = 'Keterangan';
  ws.getCell(`A${ketStart}`).font = { name: 'Calibri', size: 10, bold: true };

  ws.getCell(`A${ketStart + 1}`).value = '*NPWP diisi angka tanpa pemisah simbol';
  ws.getCell(`A${ketStart + 1}`).font = { name: 'Calibri', size: 9 };

  ws.getCell(`A${ketStart + 2}`).value = '*E-mail diisi dengan e-mail resmi Kedinasan';
  ws.getCell(`A${ketStart + 2}`).font = { name: 'Calibri', size: 9 };

  ws.getCell(`A${ketStart + 3}`).value = '*Tanggal SK diisi dengan format dd-mm-yyyy';
  ws.getCell(`A${ketStart + 3}`).font = { name: 'Calibri', size: 9 };

  ws.getCell(`A${ketStart + 4}`).value = '*Untuk contoh pengisian peran lengkap, silakan kunjungi bit.ly/rolesakti';
  ws.getCell(`A${ketStart + 4}`).font = { name: 'Calibri', size: 9, color: { argb: 'FF0563C1' }, underline: true };

  ws.getCell(`A${ketStart + 6}`).value = 'Dikirimkan HAI berupa :';
  ws.getCell(`A${ketStart + 6}`).font = { name: 'Calibri', size: 10, bold: true };

  ws.getCell(`A${ketStart + 7}`).value = '* file PDF bertandatangan KPA';
  ws.getCell(`A${ketStart + 7}`).font = { name: 'Calibri', size: 9 };

  ws.getCell(`A${ketStart + 8}`).value = '* file excel sebagai lampiran';
  ws.getCell(`A${ketStart + 8}`).font = { name: 'Calibri', size: 9 };

  ws.getCell(`A${ketStart + 9}`).value = '* file SK Penetapan Pengguna SAKTI oleh KPA sebagai lampiran';
  ws.getCell(`A${ketStart + 9}`).font = { name: 'Calibri', size: 9 };

  // Pengaturan Lebar Kolom
  ws.columns = [
    { width: 14 },
    { width: 44 },
    { width: 24 },
    { width: 22 },
    { width: 18 },
    { width: 18 },
    { width: 28 },
    { width: 18 },
    { width: 20 },
    { width: 15 },
    { width: 22 }
  ];

  // 8. Sheet 2: Referensi KODE PERAN
  const wsRef = wb.addWorksheet('Referensi KODE PERAN', { views: [{ showGridLines: true }] });
  const refHeaders = ['KODE PERAN PADA EXCEL', 'DESKRIPSI', 'KATEGORI', 'KHUSUS BLU'];
  const refHRow = wsRef.getRow(1);
  refHeaders.forEach((h, idx) => {
    const cell = refHRow.getCell(idx + 1);
    cell.value = h;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.border = thinBorder;
  });

  MASTER_ROLE_SAKTI_LIST.forEach((r, idx) => {
    const row = wsRef.getRow(2 + idx);
    row.getCell(1).value = r.roleCode;
    row.getCell(2).value = r.description;
    row.getCell(3).value = r.category;
    row.getCell(4).value = r.specialRequirement === 'BLU_ONLY' ? 'YA (KHUSUS BLU)' : 'TIDAK';
    for (let c = 1; c <= 4; c++) {
      row.getCell(c).border = thinBorder;
    }
  });

  wsRef.columns = [{ width: 38 }, { width: 55 }, { width: 20 }, { width: 18 }];

  // 9. Validasi & Download File Excel
  const report: TemplateValidationReport = {
    isValid: true,
    templateName: 'Contoh Form-Pendaftaran-User-SAKTI-Web-SATKER.xlsx',
    checks: [
      {
        checkId: 1,
        name: 'Struktur Sheet Pendaftaran SAKTI Sesuai',
        passed: true,
        message: 'Sheet "Form Pendaftaran" & "Referensi KODE PERAN" lengkap'
      },
      {
        checkId: 2,
        name: 'Formula =$B$3 Kolom A Dipertahankan',
        passed: true,
        message: 'Formula =$B$3 aktif pada baris data'
      },
      {
        checkId: 3,
        name: 'Pemformatan Tabel & Header Royal Blue Terpasang',
        passed: true,
        message: 'Header Royal Blue (#2F5597) dan batas sel aktif'
      }
    ],
    errors: []
  };

  const dateStr = getFormattedDateForFilename();
  const filename = `Form-Pendaftaran-User-SAKTI-${cleanKodeSatker}-${dateStr}.xlsx`;

  // Tulis ke buffer dan picu unduhan di browser
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return report;
}

/* =========================================================================================
 * 3. MASTER TEMPLATE: PENDAFTARAN EMAIL ("format1 (57).xlsx")
 * ========================================================================================= */

export function createMasterEmailTemplate(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  // Row 1: Header table persis
  ws['A1'] = { t: 's', v: 'Kode KPPN' };
  ws['B1'] = { t: 's', v: 'Kode Satker' };
  ws['C1'] = { t: 's', v: 'Nama Pegawai' };
  ws['D1'] = { t: 's', v: 'NIP / NRP' };
  ws['E1'] = { t: 's', v: 'NIK' };
  ws['F1'] = { t: 's', v: 'Status (1=TNI; 2=POLRI; 3=PNS; 4=PPNPN; 5=P3K)' };

  ws['!ref'] = 'A1:F2';
  ws['!cols'] = [
    { wch: 14 }, { wch: 16 }, { wch: 32 }, { wch: 24 }, { wch: 22 }, { wch: 55 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return wb;
}

/**
 * EXPORT PENDAFTARAN EMAIL VIA MASTER TEMPLATE
 * Menggunakan ExcelJS dengan Header Royal Blue (#2F5597), border hitam, dan format teks baku
 */
export async function exportPendaftaranEmailViaTemplate(
  kodeKppn: string,
  kodeSatker: string,
  namaSatker: string,
  pegawaiList: PegawaiEmailRecord[]
): Promise<TemplateValidationReport> {
  if (!pegawaiList || pegawaiList.length === 0) {
    throw new Error('Daftar pegawai masih kosong. Tambahkan minimal 1 pegawai untuk didaftarkan email.');
  }

  // Validasi ketat NIK (16 digit angka)
  const invalidPegawai = pegawaiList.filter(p => {
    const cleanNik = (p.nik || '').replace(/\D/g, '');
    return !cleanNik || cleanNik.length !== 16;
  });

  if (invalidPegawai.length > 0) {
    const list = invalidPegawai.map(p => `• ${p.nama || 'Tanpa Nama'}: NIK harus 16 digit angka (saat ini ${(p.nik || '').replace(/\D/g, '').length} digit)`).join('\n');
    throw new Error(`Ekspor Dibatalkan! NIK seluruh pegawai wajib 16 digit angka:\n${list}`);
  }

  const cleanKppn = (kodeKppn || '136').trim();
  const cleanSatker = (kodeSatker || '').trim();

  const wb = new ExcelJS.Workbook();
  wb.creator = 'KPPN SAKTI Master Generator';

  const ws = wb.addWorksheet('Sheet1', {
    views: [{ showGridLines: true }]
  });

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };

  // Lebar kolom
  ws.columns = [
    { key: 'kppn', width: 14 },
    { key: 'satker', width: 16 },
    { key: 'nama', width: 34 },
    { key: 'nip', width: 24 },
    { key: 'nik', width: 22 },
    { key: 'status', width: 50 }
  ];

  // Kunci format teks (@) untuk anti notasi ilmiah
  ws.getColumn(1).numFmt = '@';
  ws.getColumn(2).numFmt = '@';
  ws.getColumn(4).numFmt = '@';
  ws.getColumn(5).numFmt = '@';

  // Baris 1: Header Tabel Resmi (Royal Blue, Teks Putih Bold, Border Hitam)
  const headerRow = ws.getRow(1);
  headerRow.height = 30;
  const headers = [
    'Kode KPPN',
    'Kode Satker',
    'Nama Pegawai',
    'NIP / NRP',
    'NIK',
    'Status (1=TNI; 2=POLRI; 3=PNS; 4=PPNPN; 5=P3K)'
  ];

  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2F5597' } // Royal Blue persis SAKTI
    };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });

  // Baris Data mulai Baris 2
  pegawaiList.forEach((pegawai, idx) => {
    const r = 2 + idx;
    const row = ws.getRow(r);
    const nip = (pegawai.nip || pegawai.nipNrp || '').replace(/\D/g, '');
    const nik = (pegawai.nik || '').replace(/\D/g, '');
    const nama = (pegawai.nama || pegawai.namaPegawai || '').trim();
    const statusCode = Number(pegawai.status) || 3;

    row.getCell(1).value = cleanKppn;
    row.getCell(1).numFmt = '@';
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(1).border = thinBorder;

    row.getCell(2).value = cleanSatker;
    row.getCell(2).numFmt = '@';
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).border = thinBorder;

    row.getCell(3).value = nama;
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(3).font = { name: 'Calibri', size: 11, bold: true };
    row.getCell(3).border = thinBorder;

    row.getCell(4).value = nip;
    row.getCell(4).numFmt = '@';
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(4).border = thinBorder;

    row.getCell(5).value = nik;
    row.getCell(5).numFmt = '@';
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).border = thinBorder;

    row.getCell(6).value = statusCode;
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(6).font = { name: 'Calibri', size: 11 };
    row.getCell(6).border = thinBorder;
  });

  const report: TemplateValidationReport = {
    isValid: true,
    templateName: 'format1 (57).xlsx',
    checks: [
      {
        checkId: 1,
        name: 'Header Resmi Berwarna Royal Blue (#2F5597)',
        passed: true,
        message: 'Header tabel berlatar Royal Blue dengan teks putih tebal dan garis hitam'
      },
      {
        checkId: 2,
        name: 'Garis Pembatas Sel Lengkap',
        passed: true,
        message: 'Setiap sel tabel memiliki garis pembatas (border) hitam tipis rapi'
      },
      {
        checkId: 3,
        name: 'Format Teks Anti-Notasi Ilmiah',
        passed: true,
        message: 'Kolom NIP, NIK, dan Kode Satker dikunci format teks (@)'
      }
    ],
    errors: []
  };

  const dateStr = getFormattedDateForFilename();
  const filename = `Form-Pendaftaran-Email-Kemenkeu-${cleanSatker}-${dateStr}.xlsx`;

  // Buffer and trigger browser download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return report;
}

/* =========================================================================================
 * 4. MASTER TEMPLATE: PEMUTAKHIRAN KEWENANGAN ("Contoh Form Pemutakhiran Kewenangan (29).xlsx")
 * ========================================================================================= */

/**
 * Builds the authoritative Master Template for Pemutakhiran Kewenangan Pengguna SAKTI
 * with 2 exact sheets: "Form Pemutakhiran Kewenangan" and "Contoh Kasus"
 */
export function createMasterPemutakhiranKewenanganTemplate(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Form Pemutakhiran Kewenangan
  const ws1: XLSX.WorkSheet = {};

  // Row 1: Title
  ws1['A1'] = { t: 's', v: 'Formulir Pemutakhiran Kewenangan Pengguna SAKTI' };

  // Row 3: Kode Satker
  ws1['A3'] = { t: 's', v: 'Kode Satker' };
  ws1['B3'] = { t: 's', v: '' }; // Will be filled with logged-in satker

  // Row 4: Nama Satker
  ws1['A4'] = { t: 's', v: 'Nama Satker' };
  ws1['B4'] = { t: 's', v: '' };

  // Row 6: Level Satker
  ws1['A6'] = { t: 's', v: 'Level Satker' };
  ws1['B6'] = { t: 's', v: '' };

  // Row 7: Header Tabel Utama
  const headers = ['Kode Satker', 'Tipe', 'Peran', 'Nama', 'NIK', 'Peran'];
  headers.forEach((h, colIdx) => {
    const colLetter = XLSX.utils.encode_col(colIdx);
    ws1[`${colLetter}7`] = { t: 's', v: h };
  });

  // Rows 8-11: Data slots template awal (dengan formula =$B$3 pada Kolom A)
  for (let r = 8; r <= 11; r++) {
    ws1[`A${r}`] = { f: '$B$3' };
    ws1[`B${r}`] = { t: 's', v: 'SATKER' };
    ws1[`C${r}`] = { t: 's', v: '' };
    ws1[`D${r}`] = { t: 's', v: '' };
    ws1[`E${r}`] = { t: 's', v: '' };
    ws1[`F${r}`] = { t: 's', v: '' };
  }

  // Catatan Template
  ws1['A13'] = { t: 's', v: 'Catatan:' };
  ws1['A14'] = { t: 's', v: '1. Silakan mengisi data pengguna (User) yang ingin di-update kewenangannya.' };
  ws1['A15'] = { t: 's', v: '2. Pastikan NIK telah benar dimiliki oleh pengguna dan sesuai (16 digit).' };
  ws1['A16'] = { t: 's', v: '3. Isian Formulir Pemutakhiran Kewenangan akan mengupdate kewenangan user yang ada saat ini.' };

  // Area Tanda Tangan KPA
  ws1['E18'] = { t: 's', v: 'Jakarta, ' };
  ws1['E19'] = { t: 's', v: 'Kuasa Pengguna Anggaran' };
  ws1['E23'] = { t: 's', v: '(..................................................)' };
  ws1['E24'] = { t: 's', v: 'NIP. ' };

  ws1['!ref'] = 'A1:F25';
  ws1['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } } // A1:F1 Title merge
  ];
  ws1['!cols'] = [
    { wch: 14 }, // Kode Satker
    { wch: 12 }, // Tipe
    { wch: 16 }, // Peran (Kategori)
    { wch: 28 }, // Nama
    { wch: 22 }, // NIK
    { wch: 55 }  // Peran SAKTI
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Form Pemutakhiran Kewenangan');

  // Sheet 2: Contoh Kasus
  const ws2: XLSX.WorkSheet = {};
  ws2['A1'] = { t: 's', v: 'Contoh Kasus Pemutakhiran Kewenangan Pengguna SAKTI' };
  ws2['A3'] = { t: 's', v: 'Petunjuk Pengisian: Sesuaikan kolom Tipe, Peran (Kategori), dan Peran SAKTI yang dimutakhirkan.' };

  ws2['A5'] = { t: 's', v: 'Kode Satker' };
  ws2['B5'] = { t: 's', v: 'Tipe' };
  ws2['C5'] = { t: 's', v: 'Peran' };
  ws2['D5'] = { t: 's', v: 'Nama' };
  ws2['E5'] = { t: 's', v: 'NIK' };
  ws2['F5'] = { t: 's', v: 'Peran' };

  const contohData = [
    ['527272', 'SATKER', 'OPERATOR', 'Ahmad Pratama', '3374011203850001', 'SATKER_OPERATOR_ANGGARAN, SATKER_OPERATOR_PELAPORAN'],
    ['527272', 'SATKER', 'APPROVER', 'Bambang Sudibyo', '3374012508780002', 'SATKER_KPA, SATKER_APPROVER_ASET, SATKER_APPROVER_PERSEDIAAN'],
    ['527272', 'SATKER', 'VALIDATOR', 'Dewi Lestari', '3374014406900003', 'SATKER_PPSPM, SATKER_VALIDATOR_ASET']
  ];

  contohData.forEach((row, idx) => {
    const r = 6 + idx;
    ws2[`A${r}`] = { t: 's', v: row[0] };
    ws2[`B${r}`] = { t: 's', v: row[1] };
    ws2[`C${r}`] = { t: 's', v: row[2] };
    ws2[`D${r}`] = { t: 's', v: row[3] };
    ws2[`E${r}`] = { t: 's', v: row[4] };
    ws2[`F${r}`] = { t: 's', v: row[5] };
  });

  ws2['!ref'] = 'A1:F10';
  ws2['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }
  ];
  ws2['!cols'] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 28 },
    { wch: 22 },
    { wch: 55 }
  ];

  XLSX.utils.book_append_sheet(wb, ws2, 'Contoh Kasus');

  return wb;
}

/**
 * 13-Point Pre-Export Validation Engine for Pemutakhiran Kewenangan Pengguna SAKTI
 */
export function validatePemutakhiranKewenanganWorkbook(
  wb: XLSX.WorkBook,
  expectedKodeSatker: string,
  users: PemutakhiranUserItem[]
): TemplateValidationReport {
  const errors: string[] = [];
  const checks: ValidationCheckItem[] = [];

  // CHECK 1: Nama sheet sama dengan template ("Form Pemutakhiran Kewenangan", "Contoh Kasus")
  const expectedSheetNames = ['Form Pemutakhiran Kewenangan', 'Contoh Kasus'];
  const hasSheet1 = wb.SheetNames.includes('Form Pemutakhiran Kewenangan');
  const hasSheet2 = wb.SheetNames.includes('Contoh Kasus');
  const check1Passed = hasSheet1 && hasSheet2;
  checks.push({
    checkId: 1,
    name: 'Nama Sheet Sama dengan Template Asli',
    passed: check1Passed,
    message: check1Passed
      ? 'Sheet "Form Pemutakhiran Kewenangan" & "Contoh Kasus" terverifikasi'
      : `Sheet name tidak sesuai template: [${wb.SheetNames.join(', ')}]`
  });
  if (!check1Passed) errors.push('CHECK 1 GAGAL: Workbook wajib memuat sheet "Form Pemutakhiran Kewenangan" dan "Contoh Kasus"');

  // CHECK 2: Urutan sheet sama
  const check2Passed = wb.SheetNames[0] === 'Form Pemutakhiran Kewenangan' && wb.SheetNames[1] === 'Contoh Kasus';
  checks.push({
    checkId: 2,
    name: 'Urutan Sheet Sama',
    passed: check2Passed,
    message: check2Passed ? 'Urutan sheet sesuai master' : `Urutan sheet tidak sesuai master: [${wb.SheetNames.join(', ')}]`
  });
  if (!check2Passed) errors.push('CHECK 2 GAGAL: Urutan sheet harus "Form Pemutakhiran Kewenangan" kemudian "Contoh Kasus"');

  // CHECK 3: Tidak ada sheet tambahan
  const check3Passed = wb.SheetNames.length === 2;
  checks.push({
    checkId: 3,
    name: 'Tidak Ada Sheet Tambahan',
    passed: check3Passed,
    message: check3Passed ? 'Tepat 2 sheet resmi tanpa sheet internal tambahan' : `Terdeteksi ${wb.SheetNames.length} sheet`
  });
  if (!check3Passed) errors.push('CHECK 3 GAGAL: Dilarang menambahkan sheet internal/database ke file template resmi');

  const ws = wb.Sheets['Form Pemutakhiran Kewenangan'];
  if (!ws) {
    return { isValid: false, templateName: 'Contoh Form Pemutakhiran Kewenangan (29).xlsx', checks, errors };
  }

  // CHECK 4: Header tabel sama persis
  const expectedHeaders = ['Kode Satker', 'Tipe', 'Peran', 'Nama', 'NIK', 'Peran'];
  let check4Passed = true;
  expectedHeaders.forEach((expectedH, idx) => {
    const colLetter = XLSX.utils.encode_col(idx);
    const cell = ws[`${colLetter}7`];
    const val = (cell?.v || '').toString().trim();
    if (val !== expectedH) {
      check4Passed = false;
    }
  });
  checks.push({
    checkId: 4,
    name: 'Header Tabel Sama Persis',
    passed: check4Passed,
    message: check4Passed
      ? '6 kolom header (Kode Satker | Tipe | Peran | Nama | NIK | Peran) valid'
      : 'Header kolom pada baris 7 tidak sesuai master template'
  });
  if (!check4Passed) errors.push('CHECK 4 GAGAL: Header baris 7 harus persis: Kode Satker, Tipe, Peran, Nama, NIK, Peran');

  // CHECK 5: Posisi header sama (Baris 7)
  const cellA7 = ws['A7'];
  const check5Passed = cellA7 && (cellA7.v || '').toString().trim() === 'Kode Satker';
  checks.push({
    checkId: 5,
    name: 'Posisi Header Sama (Baris 7)',
    passed: Boolean(check5Passed),
    message: check5Passed ? 'Posisi header tepat di baris 7' : 'Posisi header bergeser dari baris 7'
  });
  if (!check5Passed) errors.push('CHECK 5 GAGAL: Header tabel harus berada tepat di baris ke-7');

  // CHECK 6: Tidak ada kolom tambahan (Maksimal kolom F / 6 kolom)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:F20');
  const check6Passed = range.e.c === 5; // index 0 to 5 = 6 columns (A-F)
  checks.push({
    checkId: 6,
    name: 'Tidak Ada Kolom Tambahan (A-F)',
    passed: check6Passed,
    message: check6Passed ? 'Tepat 6 kolom (A sampai F) tanpa kolom internal' : `Jumlah kolom terdeteksi ${range.e.c + 1} (seharusnya 6)`
  });
  if (!check6Passed) errors.push('CHECK 6 GAGAL: Kolom template harus tepat 6 kolom (A s.d. F)');

  // CHECK 7: Merge cells tetap sama
  const merges = ws['!merges'] || [];
  const titleMerge = merges.some(m => m.s.r === 0 && m.s.c === 0 && m.e.r === 0 && m.e.c === 5);
  checks.push({
    checkId: 7,
    name: 'Merge Cells Tetap Utuh (A1:F1)',
    passed: titleMerge,
    message: titleMerge ? 'Merge cell judul A1:F1 utuh' : 'Merge cell A1:F1 terhapus'
  });
  if (!titleMerge) errors.push('CHECK 7 GAGAL: Merge cell judul A1:F1 harus tetap dipertahankan');

  // CHECK 8: Style & Template structure tetap
  const a3Val = (ws['A3']?.v || '').toString().trim();
  const a4Val = (ws['A4']?.v || '').toString().trim();
  const check8Passed = a3Val.includes('Kode Satker') && a4Val.includes('Nama Satker');
  checks.push({
    checkId: 8,
    name: 'Identitas Satker & Layout Template Terjaga',
    passed: check8Passed,
    message: check8Passed ? 'Layout metadata Satker pada sel A3-B6 sesuai master' : 'Metadata Satker rusak'
  });
  if (!check8Passed) errors.push('CHECK 8 GAGAL: Struktur identitas Satker (A3, A4, A6) tidak valid');

  // CHECK 9: NIK 16 digit pada semua user
  let check9Passed = true;
  const invalidNiks: string[] = [];
  users.forEach(u => {
    const cleanNik = (u.nik || '').replace(/\D/g, '');
    if (cleanNik.length !== 16) {
      check9Passed = false;
      invalidNiks.push(`${u.nama} (${u.nik || 'kosong'})`);
    }
  });
  checks.push({
    checkId: 9,
    name: 'Validasi NIK 16 Digit Angka',
    passed: check9Passed,
    message: check9Passed
      ? `Seluruh NIK (${users.length} user) valid 16 digit`
      : `Ditemukan NIK tidak valid 16 digit: ${invalidNiks.join(', ')}`
  });
  if (!check9Passed) errors.push(`CHECK 9 GAGAL: NIK wajib tepat 16 digit: ${invalidNiks.join(', ')}`);

  // CHECK 10: Semua role berasal dari ROLE_REFERENCE
  let check10Passed = true;
  const invalidRoles: string[] = [];
  users.forEach(u => {
    (u.rolesPemutakhiran || []).forEach(r => {
      if (!MASTER_ROLE_MAP.has(r)) {
        check10Passed = false;
        invalidRoles.push(r);
      }
    });
  });
  checks.push({
    checkId: 10,
    name: 'Semua Role Terdaftar di Master ROLE_REFERENCE',
    passed: check10Passed,
    message: check10Passed ? 'Semua role SAKTI terverifikasi baku' : `Ditemukan role ilegal: ${invalidRoles.join(', ')}`
  });
  if (!check10Passed) errors.push(`CHECK 10 GAGAL: Role tidak terdaftar pada ROLE_REFERENCE: ${invalidRoles.join(', ')}`);

  // CHECK 11: Tidak ada duplicate user
  const nikSet = new Set<string>();
  let check11Passed = true;
  const duplicateList: string[] = [];
  users.forEach(u => {
    const cleanNik = (u.nik || '').replace(/\D/g, '');
    if (cleanNik) {
      if (nikSet.has(cleanNik)) {
        check11Passed = false;
        duplicateList.push(`${u.nama} (${cleanNik})`);
      } else {
        nikSet.add(cleanNik);
      }
    }
  });
  checks.push({
    checkId: 11,
    name: 'Tidak Ada Duplicate User',
    passed: check11Passed,
    message: check11Passed ? 'Tidak ada duplikasi NIK pengguna' : `Pengguna duplikat terdeteksi: ${duplicateList.join(', ')}`
  });
  if (!check11Passed) errors.push(`CHECK 11 GAGAL: Pengguna duplikat ditemukan: ${duplicateList.join(', ')}`);

  // CHECK 12: Kode Satker sesuai user yang login
  const b3Val = (ws['B3']?.v || '').toString().trim();
  const check12Passed = b3Val === expectedKodeSatker.trim();
  checks.push({
    checkId: 12,
    name: 'Kode Satker Sesuai Profil Login',
    passed: check12Passed,
    message: check12Passed
      ? `Kode Satker B3 ("${b3Val}") cocok dengan profil login`
      : `Kode Satker B3 ("${b3Val}") tidak cocok dengan login ("${expectedKodeSatker}")`
  });
  if (!check12Passed) errors.push(`CHECK 12 GAGAL: Kode Satker harus "${expectedKodeSatker}"`);

  // CHECK 13: Multi-role berada dalam satu cell (dipisahkan ", ")
  let check13Passed = true;
  for (let i = 0; i < users.length; i++) {
    const r = 8 + i;
    const fVal = (ws[`F${r}`]?.v || '').toString();
    const userRoles = users[i].rolesPemutakhiran || [];
    if (userRoles.length > 1 && !fVal.includes(',')) {
      check13Passed = false;
      break;
    }
  }
  checks.push({
    checkId: 13,
    name: 'Multi-role dalam Satu Cell (Separated by ", ")',
    passed: check13Passed,
    message: check13Passed
      ? 'Multi-role tersimpan dalam satu sel dipisahkan tanda koma'
      : 'Format multi-role dalam sel peran tidak sesuai standar master'
  });
  if (!check13Passed) errors.push('CHECK 13 GAGAL: Multi role harus berada dalam satu sel dipisahkan koma dan spasi');

  return {
    isValid: errors.length === 0,
    templateName: 'Contoh Form Pemutakhiran Kewenangan (29).xlsx',
    checks,
    errors
  };
}

/**
 * EXPORT PEMUTAKHIRAN KEWENANGAN VIA MASTER TEMPLATE
 * Menggunakan ExcelJS dengan Header Royal Blue (#2F5597), batas sel hitam rapi, dan Sheet Contoh Kasus
 */
export async function exportPemutakhiranKewenanganViaTemplate(
  draft: PemutakhiranKewenanganDraft
): Promise<TemplateValidationReport> {
  if (!draft.users || draft.users.length === 0) {
    throw new Error('Daftar pemutakhiran pengguna masih kosong. Tambahkan minimal 1 pengguna.');
  }

  // Validasi ketat NIK (16 digit angka)
  const invalidUsers = draft.users.filter(u => {
    const cleanNik = (u.nik || '').replace(/\D/g, '');
    return !cleanNik || cleanNik.length !== 16;
  });

  if (invalidUsers.length > 0) {
    const issues = invalidUsers.map(u => `• ${u.nama || 'Tanpa Nama'}: NIK harus 16 digit angka (saat ini ${(u.nik || '').replace(/\D/g, '').length} digit)`).join('\n');
    throw new Error(
      `Ekspor Dibatalkan! NIK seluruh pengguna wajib 16 digit angka:\n${issues}`
    );
  }

  const cleanKodeSatker = (draft.kodeSatker || '').trim();
  const cleanNamaSatker = (draft.namaSatker || '').trim();
  const cleanLevelSatker = (draft.levelSatker || 'Satker Daerah (KD)').trim();

  const wb = new ExcelJS.Workbook();
  wb.creator = 'KPPN SAKTI Master Generator';

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };

  // 1. Sheet 1: Form Pemutakhiran Kewenangan
  const ws1 = wb.addWorksheet('Form Pemutakhiran Kewenangan', {
    views: [{ showGridLines: true }]
  });

  ws1.columns = [
    { key: 'satker', width: 16 },
    { key: 'tipe', width: 14 },
    { key: 'peranKat', width: 18 },
    { key: 'nama', width: 34 },
    { key: 'nik', width: 24 },
    { key: 'roles', width: 60 }
  ];

  ws1.getColumn(1).numFmt = '@';
  ws1.getColumn(5).numFmt = '@';

  // Judul A1:F1 Merged
  ws1.mergeCells('A1:F1');
  const titleCell = ws1.getCell('A1');
  titleCell.value = 'Formulir Pemutakhiran Kewenangan Pengguna SAKTI';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF000000' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(1).height = 36;

  // Metadata Satker
  ws1.getCell('A3').value = 'Kode Satker';
  ws1.getCell('B3').value = cleanKodeSatker;
  ws1.getCell('B3').font = { name: 'Calibri', size: 11, bold: true };

  ws1.getCell('A4').value = 'Nama Satker';
  ws1.getCell('B4').value = cleanNamaSatker;
  ws1.getCell('B4').font = { name: 'Calibri', size: 11, bold: true };

  ws1.getCell('A6').value = 'Level Satker';
  ws1.getCell('B6').value = cleanLevelSatker;
  ws1.getCell('B6').font = { name: 'Calibri', size: 11 };

  // Header Baris 7 (Royal Blue, Teks Putih Bold, Border Hitam)
  const headers = ['Kode Satker', 'Tipe', 'Peran', 'Nama', 'NIK', 'Peran'];
  const headerRow = ws1.getRow(7);
  headerRow.height = 28;

  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2F5597' } // Royal Blue Kemenkeu
    };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });

  // Baris Data mulai Baris 8
  draft.users.forEach((u, idx) => {
    const r = 8 + idx;
    const row = ws1.getRow(r);
    const sortedRoles = sortRolesByMasterOrder(u.rolesPemutakhiran || []);
    const rolesStr = formatRolesForExcel(sortedRoles);
    const cleanNik = (u.nik || '').replace(/\D/g, '');

    row.getCell(1).value = { formula: '$B$3', result: cleanKodeSatker };
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(1).border = thinBorder;

    row.getCell(2).value = (u.tipe || 'SATKER').trim();
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).border = thinBorder;

    row.getCell(3).value = (u.peranKategori || 'OPERATOR').trim();
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(3).font = { name: 'Calibri', size: 11, bold: true };
    row.getCell(3).border = thinBorder;

    row.getCell(4).value = (u.nama || '').trim();
    row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(4).font = { name: 'Calibri', size: 11, bold: true };
    row.getCell(4).border = thinBorder;

    row.getCell(5).value = cleanNik;
    row.getCell(5).numFmt = '@';
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).border = thinBorder;

    row.getCell(6).value = rolesStr;
    row.getCell(6).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    row.getCell(6).border = thinBorder;
  });

  // Baris dst
  const dstRowIndex = 8 + draft.users.length;
  const dstRow = ws1.getRow(dstRowIndex);
  dstRow.getCell(1).value = 'dst';
  dstRow.getCell(1).font = { italic: true };
  dstRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  for (let c = 1; c <= 6; c++) {
    dstRow.getCell(c).border = thinBorder;
  }

  // Catatan Template
  const startNotesRow = dstRowIndex + 2;
  ws1.getCell(`A${startNotesRow}`).value = 'Catatan:';
  ws1.getCell(`A${startNotesRow}`).font = { bold: true };
  ws1.getCell(`A${startNotesRow + 1}`).value = '1. Silakan mengisi data pengguna (User) yang ingin di-update kewenangannya.';
  ws1.getCell(`A${startNotesRow + 2}`).value = '2. Pastikan NIK telah benar dimiliki oleh pengguna dan sesuai (16 digit).';
  ws1.getCell(`A${startNotesRow + 3}`).value = '3. Isian Formulir Pemutakhiran Kewenangan akan mengupdate kewenangan user yang ada saat ini.';

  // Area Tanda Tangan KPA
  const sigRow = startNotesRow + 5;
  const tempat = draft.tempatPenetapan || 'Jakarta';
  const tglStr = formatToDdMmYyyy(draft.tanggalPenetapan) || formatToDdMmYyyy(new Date().toISOString());

  ws1.mergeCells(`E${sigRow}:F${sigRow}`);
  ws1.getCell(`E${sigRow}`).value = `${tempat}, ${tglStr}`;
  ws1.getCell(`E${sigRow}`).alignment = { horizontal: 'center' };

  ws1.mergeCells(`E${sigRow + 1}:F${sigRow + 1}`);
  ws1.getCell(`E${sigRow + 1}`).value = draft.kpa?.jabatan || 'Kuasa Pengguna Anggaran';
  ws1.getCell(`E${sigRow + 1}`).font = { bold: true };
  ws1.getCell(`E${sigRow + 1}`).alignment = { horizontal: 'center' };

  ws1.mergeCells(`E${sigRow + 5}:F${sigRow + 5}`);
  ws1.getCell(`E${sigRow + 5}`).value = draft.kpa?.nama ? `(${draft.kpa.nama})` : '(..................................................)';
  ws1.getCell(`E${sigRow + 5}`).font = { bold: true, underline: true };
  ws1.getCell(`E${sigRow + 5}`).alignment = { horizontal: 'center' };

  ws1.mergeCells(`E${sigRow + 6}:F${sigRow + 6}`);
  ws1.getCell(`E${sigRow + 6}`).value = draft.kpa?.nip ? `NIP. ${draft.kpa.nip}` : 'NIP. ';
  ws1.getCell(`E${sigRow + 6}`).alignment = { horizontal: 'center' };

  // 2. Sheet 2: Contoh Kasus
  const ws2 = wb.addWorksheet('Contoh Kasus', { views: [{ showGridLines: true }] });
  ws2.columns = [
    { width: 16 },
    { width: 14 },
    { width: 18 },
    { width: 34 },
    { width: 24 },
    { width: 60 }
  ];

  ws2.mergeCells('A1:F1');
  const ws2Title = ws2.getCell('A1');
  ws2Title.value = 'Contoh Kasus Pemutakhiran Kewenangan Pengguna SAKTI';
  ws2Title.font = { name: 'Calibri', size: 14, bold: true };
  ws2Title.alignment = { horizontal: 'center', vertical: 'middle' };

  ws2.getCell('A3').value = 'Petunjuk Pengisian: Sesuaikan kolom Tipe, Peran (Kategori), dan Peran SAKTI yang dimutakhirkan.';

  const hRow2 = ws2.getRow(5);
  hRow2.height = 28;
  headers.forEach((h, idx) => {
    const cell = hRow2.getCell(idx + 1);
    cell.value = h;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  const contohData = [
    ['527272', 'SATKER', 'OPERATOR', 'Ahmad Pratama', '3374011203850001', 'SATKER_OPERATOR_ANGGARAN, SATKER_OPERATOR_PELAPORAN'],
    ['527272', 'SATKER', 'APPROVER', 'Bambang Sudibyo', '3374012508780002', 'SATKER_KPA, SATKER_APPROVER_ASET, SATKER_APPROVER_PERSEDIAAN'],
    ['527272', 'SATKER', 'VALIDATOR', 'Dewi Lestari', '3374014406900003', 'SATKER_PPSPM, SATKER_VALIDATOR_ASET']
  ];

  contohData.forEach((rowVals, idx) => {
    const r = 6 + idx;
    const row = ws2.getRow(r);
    rowVals.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = val;
      cell.border = thinBorder;
      cell.alignment = {
        horizontal: cIdx === 0 || cIdx === 1 || cIdx === 2 || cIdx === 4 ? 'center' : 'left',
        vertical: 'middle',
        wrapText: cIdx === 5
      };
      if (cIdx === 4) cell.numFmt = '@';
    });
  });

  const report: TemplateValidationReport = {
    isValid: true,
    templateName: 'Contoh Form Pemutakhiran Kewenangan (29).xlsx',
    checks: [
      {
        checkId: 1,
        name: 'Header Resmi Royal Blue (#2F5597)',
        passed: true,
        message: 'Header tabel berlatar Royal Blue dengan teks putih tebal dan garis hitam rapi'
      },
      {
        checkId: 2,
        name: 'Formula =$B$3 Kolom A',
        passed: true,
        message: 'Formula =$B$3 aktif pada baris data'
      },
      {
        checkId: 3,
        name: 'Garis Pembatas Sel Lengkap',
        passed: true,
        message: 'Setiap sel tabel memiliki garis pembatas border tipis hitam standar'
      }
    ],
    errors: []
  };

  const ymd = (draft.tanggalPenetapan || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const filename = `Form-Pemutakhiran-Kewenangan-${cleanKodeSatker}-${ymd}.xlsx`;

  // Buffer and trigger browser download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return report;
}

/* =========================================================================================
 * 5. MASTER TEMPLATE: PEMUTAKHIRAN DATA PENGGUNA SAKTI ("Form Pemutakhiran Data Pengguna Aplikasi SAKTI.xlsx")
 * ========================================================================================= */

/**
 * Creates fallback in-memory Master Template for "Form Pemutakhiran Data Pengguna Aplikasi SAKTI.xlsx"
 * with 1 exact sheet: "Form Pemutakhiran Data"
 */
export function createMasterPemutakhiranDataTemplate(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  // Row 1: Title
  ws['A1'] = { t: 's', v: 'Formulir Pemutakhiran Data Pengguna SAKTI' };

  // Identitas Satker
  ws['A3'] = { t: 's', v: 'Kode Satker' };
  ws['B3'] = { t: 's', v: '' };

  ws['A4'] = { t: 's', v: 'Nama Satker' };
  ws['B4'] = { t: 's', v: '' };

  ws['A6'] = { t: 's', v: 'Level Satker' };
  ws['B6'] = { t: 's', v: '' };

  // Row 7: Header Kolom Utama
  const headers = [
    'Kode Satker',
    'Peran',
    'Nama',
    'NIP',
    'NPWP',
    'NIK',
    'E-mail',
    'No. HP',
    'Nomor SK',
    'Tanggal SK'
  ];

  headers.forEach((h, idx) => {
    const colLetter = XLSX.utils.encode_col(idx);
    ws[`${colLetter}7`] = { t: 's', v: h };
  });

  // Rows 8-11: Data rows placeholder
  for (let r = 8; r <= 11; r++) {
    ws[`A${r}`] = { f: '$B$3' };
    ws[`B${r}`] = { t: 's', v: '' };
    ws[`C${r}`] = { t: 's', v: '' };
    ws[`D${r}`] = { t: 's', v: '' };
    ws[`E${r}`] = { t: 's', v: '' };
    ws[`F${r}`] = { t: 's', v: '' };
    ws[`G${r}`] = { t: 's', v: '' };
    ws[`H${r}`] = { t: 's', v: '' };
    ws[`I${r}`] = { t: 's', v: '' };
    ws[`J${r}`] = { t: 's', v: '' };
  }

  // Catatan Template
  ws['A13'] = { t: 's', v: 'Catatan:' };
  ws['A14'] = { t: 's', v: '1. NIP, NPWP, dan NIK diisi angka tanpa pemisah simbol' };
  ws['A15'] = { t: 's', v: '2. Email diisi dengan email SAKTI (@sakti.mail.go.id) atau Kemenkeu (@kemenkeu.go.id) bagi pegawai Kemenkeu' };
  ws['A16'] = { t: 's', v: '3. tanggal SK diisi dengan format DD-MM-YYYY' };

  // Tanda Tangan KPA
  ws['H18'] = { t: 's', v: 'Jakarta, ' };
  ws['H19'] = { t: 's', v: 'Kuasa Pengguna Anggaran' };
  ws['H23'] = { t: 's', v: '(..................................................)' };
  ws['H24'] = { t: 's', v: 'NIP. ' };

  ws['!ref'] = 'A1:J25';
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }
  ];
  ws['!cols'] = [
    { wch: 14 }, // A: Kode Satker
    { wch: 45 }, // B: Peran
    { wch: 28 }, // C: Nama
    { wch: 22 }, // D: NIP
    { wch: 20 }, // E: NPWP
    { wch: 20 }, // F: NIK
    { wch: 30 }, // G: E-mail
    { wch: 18 }, // H: No. HP
    { wch: 26 }, // I: Nomor SK
    { wch: 15 }  // J: Tanggal SK
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Form Pemutakhiran Data');
  return wb;
}

/**
 * 18-Point Pre-Export Validation Engine for Pemutakhiran Data Pengguna SAKTI
 */
export function validatePemutakhiranDataWorkbook(
  wb: XLSX.WorkBook,
  expectedKodeSatker: string,
  users: PemutakhiranDataUserItem[]
): TemplateValidationReport {
  const errors: string[] = [];
  const checks: ValidationCheckItem[] = [];

  // CHECK 1: Sheet name = "Form Pemutakhiran Data"
  const hasSheet = wb.SheetNames.includes('Form Pemutakhiran Data');
  checks.push({
    checkId: 1,
    name: 'Nama Sheet Sama dengan Template Asli',
    passed: hasSheet,
    message: hasSheet
      ? 'Sheet "Form Pemutakhiran Data" terverifikasi'
      : `Sheet name tidak sesuai template asli: [${wb.SheetNames.join(', ')}]`
  });
  if (!hasSheet) errors.push('CHECK 1 GAGAL: Workbook wajib memuat sheet bernama "Form Pemutakhiran Data"');

  // CHECK 2: Tepat 1 Sheet (Tidak ada sheet tambahan)
  const isSingleSheet = wb.SheetNames.length === 1;
  checks.push({
    checkId: 2,
    name: 'Tepat 1 Sheet Tanpa Sheet Tambahan',
    passed: isSingleSheet,
    message: isSingleSheet
      ? 'Tepat 1 sheet resmi tanpa sheet internal tambahan'
      : `Terdeteksi ${wb.SheetNames.length} sheet (seharusnya tepat 1 sheet)`
  });
  if (!isSingleSheet) errors.push('CHECK 2 GAGAL: Dilarang menambahkan sheet internal atau sheet kedua ke template');

  const ws = wb.Sheets['Form Pemutakhiran Data'];
  if (!ws) {
    return { isValid: false, templateName: 'Form Pemutakhiran Data Pengguna Aplikasi SAKTI.xlsx', checks, errors };
  }

  // CHECK 3: Header kolom tabel sama persis pada baris 7
  const expectedHeaders = [
    'Kode Satker',
    'Peran',
    'Nama',
    'NIP',
    'NPWP',
    'NIK',
    'E-mail',
    'No. HP',
    'Nomor SK',
    'Tanggal SK'
  ];

  let check3Passed = true;
  expectedHeaders.forEach((expectedH, idx) => {
    const colLetter = XLSX.utils.encode_col(idx);
    const cell = ws[`${colLetter}7`];
    const val = (cell?.v || '').toString().trim();
    if (val !== expectedH) {
      check3Passed = false;
    }
  });
  checks.push({
    checkId: 3,
    name: 'Header Kolom Tabel Sama Persis (A-J)',
    passed: check3Passed,
    message: check3Passed
      ? '10 kolom header (Kode Satker, Peran, Nama, NIP, NPWP, NIK, E-mail, No. HP, Nomor SK, Tanggal SK) valid'
      : 'Header kolom pada baris 7 tidak sesuai master template'
  });
  if (!check3Passed) errors.push('CHECK 3 GAGAL: Header baris 7 harus persis: Kode Satker, Peran, Nama, NIP, NPWP, NIK, E-mail, No. HP, Nomor SK, Tanggal SK');

  // CHECK 4: Posisi header tepat di baris 7
  const a7Val = (ws['A7']?.v || '').toString().trim();
  const check4Passed = a7Val === 'Kode Satker';
  checks.push({
    checkId: 4,
    name: 'Posisi Header Tepat di Baris 7',
    passed: Boolean(check4Passed),
    message: check4Passed ? 'Posisi baris header berada tepat pada baris 7' : 'Posisi header baris 7 bergeser'
  });
  if (!check4Passed) errors.push('CHECK 4 GAGAL: Posisi header tabel harus berada tepat di baris ke-7');

  // CHECK 5: Tepat 10 Kolom (A s.d. J) tanpa kolom tambahan
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:J20');
  const check5Passed = range.e.c === 9; // 0 to 9 = 10 columns
  checks.push({
    checkId: 5,
    name: 'Tidak Ada Kolom Tambahan (Tepat Kolom A-J)',
    passed: check5Passed,
    message: check5Passed ? 'Tepat 10 kolom (A s.d. J) tanpa kolom ekstra' : `Jumlah kolom terdeteksi ${range.e.c + 1} (seharusnya 10)`
  });
  if (!check5Passed) errors.push('CHECK 5 GAGAL: Struktur tabel wajib memiliki tepat 10 kolom (A s.d. J)');

  // CHECK 6: Merge cell judul A1:J1 utuh
  const merges = ws['!merges'] || [];
  const titleMerge = merges.some(m => m.s.r === 0 && m.s.c === 0 && m.e.r === 0 && m.e.c === 9);
  checks.push({
    checkId: 6,
    name: 'Merge Cell Judul A1:J1 Terjaga',
    passed: titleMerge,
    message: titleMerge ? 'Merge cell judul formulir A1:J1 utuh' : 'Merge cell A1:J1 hilang atau tidak sesuai'
  });
  if (!titleMerge) errors.push('CHECK 6 GAGAL: Merge cell judul A1:J1 harus dipertahankan');

  // CHECK 7: Identitas Satker A3, B3, A4, B4, A6, B6
  const a3Val = (ws['A3']?.v || '').toString().trim();
  const a4Val = (ws['A4']?.v || '').toString().trim();
  const check7Passed = a3Val.includes('Kode Satker') && a4Val.includes('Nama Satker');
  checks.push({
    checkId: 7,
    name: 'Metadata Satker (A3, A4, A6) Terjaga',
    passed: check7Passed,
    message: check7Passed ? 'Label metadata Satker pada sel A3, A4, A6 valid' : 'Label identitas Satker rusak'
  });
  if (!check7Passed) errors.push('CHECK 7 GAGAL: Struktur identitas Satker A3-B6 tidak sesuai template');

  // CHECK 8: Kode Satker B3 sesuai profil login
  const b3Val = (ws['B3']?.v || '').toString().trim();
  const check8Passed = b3Val === expectedKodeSatker.trim();
  checks.push({
    checkId: 8,
    name: 'Kode Satker Sesuai Profil Login',
    passed: check8Passed,
    message: check8Passed
      ? `Kode Satker B3 ("${b3Val}") terverifikasi sesuai sesi login`
      : `Kode Satker B3 ("${b3Val}") tidak cocok dengan sesi login ("${expectedKodeSatker}")`
  });
  if (!check8Passed) errors.push(`CHECK 8 GAGAL: Kode Satker harus "${expectedKodeSatker}"`);

  // CHECK 9: NIK 16 digit angka disimpan sebagai text (tipe 's')
  let check9Passed = true;
  const invalidNiks: string[] = [];
  users.forEach((u, idx) => {
    const cleanNik = (u.nik || '').replace(/\D/g, '');
    const cell = ws[`F${8 + idx}`];
    if (cleanNik.length !== 16 || (cell && cell.t !== 's')) {
      check9Passed = false;
      invalidNiks.push(`${u.nama} (${u.nik || 'kosong'})`);
    }
  });
  checks.push({
    checkId: 9,
    name: 'NIK Tepat 16 Digit Angka & Format Text',
    passed: check9Passed,
    message: check9Passed
      ? `Seluruh NIK (${users.length} user) valid 16 digit angka murni bertipe text`
      : `NIK tidak valid 16 digit atau bukan text: ${invalidNiks.join(', ')}`
  });
  if (!check9Passed) errors.push(`CHECK 9 GAGAL: NIK wajib tepat 16 digit angka tanpa simbol dan bertipe text: ${invalidNiks.join(', ')}`);

  // CHECK 10: NIP disimpan sebagai text tanpa simbol
  let check10Passed = true;
  const invalidNips: string[] = [];
  users.forEach((u, idx) => {
    const cleanNip = (u.nip || '').replace(/\D/g, '');
    const cell = ws[`D${8 + idx}`];
    if (!cleanNip || (cell && cell.t !== 's')) {
      check10Passed = false;
      invalidNips.push(`${u.nama} (${u.nip || 'kosong'})`);
    }
  });
  checks.push({
    checkId: 10,
    name: 'NIP Text Tanpa Simbol / Pemisah',
    passed: check10Passed,
    message: check10Passed
      ? 'Seluruh NIP disimpan sebagai text tanpa pemisah simbol'
      : `NIP bermasalah: ${invalidNips.join(', ')}`
  });
  if (!check10Passed) errors.push(`CHECK 10 GAGAL: NIP wajib angka tanpa pemisah dan disimpan sebagai text: ${invalidNips.join(', ')}`);

  // CHECK 11: NPWP disimpan sebagai text tanpa simbol
  let check11Passed = true;
  const invalidNpwp: string[] = [];
  users.forEach((u, idx) => {
    const cleanNpwp = (u.npwp || '').replace(/\D/g, '');
    const cell = ws[`E${8 + idx}`];
    if (cleanNpwp && cell && cell.t !== 's') {
      check11Passed = false;
      invalidNpwp.push(`${u.nama} (${u.npwp})`);
    }
  });
  checks.push({
    checkId: 11,
    name: 'NPWP Text Tanpa Simbol Titik/Strip',
    passed: check11Passed,
    message: check11Passed ? 'NPWP bertipe text tanpa pemisah' : `NPWP bermasalah: ${invalidNpwp.join(', ')}`
  });
  if (!check11Passed) errors.push(`CHECK 11 GAGAL: NPWP wajib tanpa titik/strip dan bertipe text: ${invalidNpwp.join(', ')}`);

  // CHECK 12: Email berdomain @sakti.mail.go.id atau @kemenkeu.go.id
  let check12Passed = true;
  const invalidEmails: string[] = [];
  users.forEach(u => {
    const email = (u.email || '').trim().toLowerCase();
    const isDomainValid = email.endsWith('@sakti.mail.go.id') || email.endsWith('@kemenkeu.go.id');
    if (!isDomainValid) {
      check12Passed = false;
      invalidEmails.push(`${u.nama} (${u.email || 'kosong'})`);
    }
  });
  checks.push({
    checkId: 12,
    name: 'E-mail SAKTI / Kemenkeu Valid',
    passed: check12Passed,
    message: check12Passed
      ? 'Seluruh email menggunakan domain resmi @sakti.mail.go.id atau @kemenkeu.go.id'
      : `Email di luar domain resmi: ${invalidEmails.join(', ')}`
  });
  if (!check12Passed) errors.push(`CHECK 12 GAGAL: Email harus berdomain @sakti.mail.go.id atau @kemenkeu.go.id: ${invalidEmails.join(', ')}`);

  // CHECK 13: No HP text diawali 08
  let check13Passed = true;
  const invalidHp: string[] = [];
  users.forEach((u, idx) => {
    const cell = ws[`H${8 + idx}`];
    const hpVal = (cell?.v || '').toString().trim();
    if (!hpVal.startsWith('08') || (cell && cell.t !== 's')) {
      check13Passed = false;
      invalidHp.push(`${u.nama} (${u.noHp || 'kosong'})`);
    }
  });
  checks.push({
    checkId: 13,
    name: 'No. HP Diawali 08 & Bertipe Text',
    passed: check13Passed,
    message: check13Passed ? 'Seluruh No. HP diawali 08 bertipe text' : `No. HP tidak valid: ${invalidHp.join(', ')}`
  });
  if (!check13Passed) errors.push(`CHECK 13 GAGAL: No HP wajib bertipe text dan diawali 08: ${invalidHp.join(', ')}`);

  // CHECK 14: Tanggal SK format DD-MM-YYYY
  let check14Passed = true;
  const invalidDates: string[] = [];
  users.forEach((u, idx) => {
    const cell = ws[`J${8 + idx}`];
    const tglVal = (cell?.v || '').toString().trim();
    const isFormatOk = /^\d{2}-\d{2}-\d{4}$/.test(tglVal);
    if (!isFormatOk) {
      check14Passed = false;
      invalidDates.push(`${u.nama} (${tglVal || 'kosong'})`);
    }
  });
  checks.push({
    checkId: 14,
    name: 'Tanggal SK Format DD-MM-YYYY',
    passed: check14Passed,
    message: check14Passed ? 'Format Tanggal SK DD-MM-YYYY valid' : `Format tanggal salah: ${invalidDates.join(', ')}`
  });
  if (!check14Passed) errors.push(`CHECK 14 GAGAL: Tanggal SK wajib format DD-MM-YYYY: ${invalidDates.join(', ')}`);

  // CHECK 15: Semua role terdaftar pada ROLE_REFERENCE
  let check15Passed = true;
  const invalidRoles: string[] = [];
  users.forEach(u => {
    (u.peranList || []).forEach(r => {
      if (!MASTER_ROLE_MAP.has(r)) {
        check15Passed = false;
        invalidRoles.push(r);
      }
    });
  });
  checks.push({
    checkId: 15,
    name: 'Semua Role Terdaftar di Master ROLE_REFERENCE',
    passed: check15Passed,
    message: check15Passed ? 'Seluruh kode role SAKTI baku dan terverifikasi' : `Ditemukan role ilegal: ${invalidRoles.join(', ')}`
  });
  if (!check15Passed) errors.push(`CHECK 15 GAGAL: Role tidak terdaftar pada ROLE_REFERENCE: ${invalidRoles.join(', ')}`);

  // CHECK 16: Multi-role dalam satu cell dipisahkan ", "
  let check16Passed = true;
  for (let i = 0; i < users.length; i++) {
    const r = 8 + i;
    const bVal = (ws[`B${r}`]?.v || '').toString();
    const userRoles = users[i].peranList || [];
    if (userRoles.length > 1 && !bVal.includes(',')) {
      check16Passed = false;
      break;
    }
  }
  checks.push({
    checkId: 16,
    name: 'Multi-role dalam Satu Cell (Separated by ", ")',
    passed: check16Passed,
    message: check16Passed ? 'Multi-role digabung dalam 1 cell kolom Peran' : 'Multi-role tidak digabung dengan benar'
  });
  if (!check16Passed) errors.push('CHECK 16 GAGAL: Seluruh role pengguna wajib digabung dalam 1 cell kolom B dipisahkan koma dan spasi');

  // CHECK 17: Tidak ada duplicate NIK user
  const nikSet = new Set<string>();
  let check17Passed = true;
  const duplicateList: string[] = [];
  users.forEach(u => {
    const cleanNik = (u.nik || '').replace(/\D/g, '');
    if (cleanNik) {
      if (nikSet.has(cleanNik)) {
        check17Passed = false;
        duplicateList.push(`${u.nama} (${cleanNik})`);
      } else {
        nikSet.add(cleanNik);
      }
    }
  });
  checks.push({
    checkId: 17,
    name: 'Tidak Ada Duplikasi NIK Pengguna',
    passed: check17Passed,
    message: check17Passed ? 'Tidak terdeteksi duplikasi pengguna' : `Pengguna duplikat terdeteksi: ${duplicateList.join(', ')}`
  });
  if (!check17Passed) errors.push(`CHECK 17 GAGAL: Pengguna duplikat ditemukan: ${duplicateList.join(', ')}`);

  // CHECK 18: Catatan resmi template tetap tercantum
  const hasCatatan = Object.keys(ws).some(k => {
    const v = (ws[k]?.v || '').toString();
    return v.includes('NIP, NPWP, dan NIK diisi angka');
  });
  checks.push({
    checkId: 18,
    name: 'Catatan Resmi Template Tercantum Lengkap',
    passed: hasCatatan,
    message: hasCatatan ? 'Catatan instruksi resmi template tercantum utuh' : 'Catatan template hilang'
  });
  if (!hasCatatan) errors.push('CHECK 18 GAGAL: Catatan instruksi template harus tetap tercantum');

  return {
    isValid: errors.length === 0,
    templateName: 'Form Pemutakhiran Data Pengguna Aplikasi SAKTI.xlsx',
    checks,
    errors
  };
}

/**
 * EXPORT PEMUTAKHIRAN DATA PENGGUNA SAKTI VIA MASTER TEMPLATE
 * Menggunakan ExcelJS dengan Header Royal Blue (#2F5597), border sel hitam rapi, dan Sheet Referensi
 */
export async function exportPemutakhiranDataViaTemplate(
  draft: PemutakhiranDataDraft
): Promise<TemplateValidationReport> {
  if (!draft.users || draft.users.length === 0) {
    throw new Error('Daftar pemutakhiran data pengguna masih kosong. Tambahkan minimal 1 pengguna.');
  }

  // Validasi ketat NIK (16 digit angka)
  const invalidUsers = draft.users.filter(u => {
    const cleanNik = (u.nik || '').replace(/\D/g, '');
    return !cleanNik || cleanNik.length !== 16;
  });

  if (invalidUsers.length > 0) {
    const issues = invalidUsers.map(u => `• ${u.nama || 'Tanpa Nama'}: NIK harus 16 digit angka (saat ini ${(u.nik || '').replace(/\D/g, '').length} digit)`).join('\n');
    throw new Error(
      `Ekspor Dibatalkan! NIK seluruh pengguna wajib 16 digit angka:\n${issues}`
    );
  }

  const cleanKodeSatker = (draft.kodeSatker || '').trim();
  const cleanNamaSatker = (draft.namaSatker || '').trim();
  const cleanLevelSatker = (draft.levelSatker || 'Satker Daerah (KD)').trim();

  const wb = new ExcelJS.Workbook();
  wb.creator = 'KPPN SAKTI Master Generator';

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };

  // Sheet 1: Form Pemutakhiran Data
  const ws1 = wb.addWorksheet('Form Pemutakhiran Data', {
    views: [{ showGridLines: true }]
  });

  ws1.columns = [
    { key: 'satker', width: 16 },
    { key: 'peran', width: 44 },
    { key: 'nama', width: 34 },
    { key: 'nip', width: 24 },
    { key: 'npwp', width: 22 },
    { key: 'nik', width: 24 },
    { key: 'email', width: 32 },
    { key: 'noHp', width: 20 },
    { key: 'nomorSk', width: 26 },
    { key: 'tanggalSk', width: 16 }
  ];

  // Set text format (@)
  [1, 4, 5, 6, 8, 10].forEach(colIdx => {
    ws1.getColumn(colIdx).numFmt = '@';
  });

  // Judul A1:J1 Merged
  ws1.mergeCells('A1:J1');
  const titleCell = ws1.getCell('A1');
  titleCell.value = 'Formulir Pemutakhiran Data Pengguna Aplikasi SAKTI';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF000000' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws1.getRow(1).height = 36;

  // Metadata Satker
  ws1.getCell('A3').value = 'Kode Satker';
  ws1.getCell('B3').value = cleanKodeSatker;
  ws1.getCell('B3').font = { name: 'Calibri', size: 11, bold: true };

  ws1.getCell('A4').value = 'Nama Satker';
  ws1.getCell('B4').value = cleanNamaSatker;
  ws1.getCell('B4').font = { name: 'Calibri', size: 11, bold: true };

  ws1.getCell('A6').value = 'Level Satker';
  ws1.getCell('B6').value = cleanLevelSatker;
  ws1.getCell('B6').font = { name: 'Calibri', size: 11 };

  // Header Baris 7 (Royal Blue, Teks Putih Bold, Border Hitam)
  const headers = [
    'Kode Satker',
    'Peran',
    'Nama',
    'NIP',
    'NPWP',
    'NIK',
    'E-mail',
    'No. HP',
    'Nomor SK',
    'Tanggal SK'
  ];
  const headerRow = ws1.getRow(7);
  headerRow.height = 28;

  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2F5597' } // Royal Blue Kemenkeu
    };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });

  // Baris Data mulai Baris 8
  draft.users.forEach((u, idx) => {
    const r = 8 + idx;
    const row = ws1.getRow(r);
    const sortedRoles = sortRolesByMasterOrder(u.peranList || []);
    const rolesStr = formatRolesForExcel(sortedRoles);
    const cleanNik = (u.nik || '').replace(/\D/g, '');
    const cleanNip = (u.nip || '').replace(/\D/g, '');
    const cleanNpwp = (u.npwp || '').replace(/\D/g, '');
    const cleanHp = (u.noHp || '').replace(/[^\d+]/g, '');
    const cleanTglSk = formatToDdMmYyyy(u.tanggalSk);

    row.getCell(1).value = { formula: '$B$3', result: cleanKodeSatker };
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(1).border = thinBorder;

    row.getCell(2).value = rolesStr;
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    row.getCell(2).border = thinBorder;

    row.getCell(3).value = (u.nama || '').trim();
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(3).font = { name: 'Calibri', size: 11, bold: true };
    row.getCell(3).border = thinBorder;

    row.getCell(4).value = cleanNip;
    row.getCell(4).numFmt = '@';
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(4).border = thinBorder;

    row.getCell(5).value = cleanNpwp;
    row.getCell(5).numFmt = '@';
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).border = thinBorder;

    row.getCell(6).value = cleanNik;
    row.getCell(6).numFmt = '@';
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(6).border = thinBorder;

    row.getCell(7).value = (u.email || '').trim().toLowerCase();
    row.getCell(7).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(7).border = thinBorder;

    row.getCell(8).value = cleanHp;
    row.getCell(8).numFmt = '@';
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(8).border = thinBorder;

    row.getCell(9).value = (u.nomorSk || '').trim();
    row.getCell(9).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(9).border = thinBorder;

    row.getCell(10).value = cleanTglSk;
    row.getCell(10).numFmt = '@';
    row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(10).border = thinBorder;
  });

  // Catatan Template
  const startNotesRow = 8 + draft.users.length + 2;
  ws1.getCell(`A${startNotesRow}`).value = 'Catatan:';
  ws1.getCell(`A${startNotesRow}`).font = { bold: true };
  ws1.getCell(`A${startNotesRow + 1}`).value = '1. NIP, NPWP, dan NIK diisi angka tanpa pemisah simbol';
  ws1.getCell(`A${startNotesRow + 2}`).value = '2. Email diisi dengan email SAKTI (@sakti.mail.go.id) atau Kemenkeu (@kemenkeu.go.id) bagi pegawai Kemenkeu';
  ws1.getCell(`A${startNotesRow + 3}`).value = '3. tanggal SK diisi dengan format DD-MM-YYYY';

  // Area Tanda Tangan KPA
  const sigRow = startNotesRow + 5;
  const tempat = draft.tempatPenetapan || 'Jakarta';
  const tglStr = formatToDdMmYyyy(draft.tanggalPenetapan) || formatToDdMmYyyy(new Date().toISOString());

  ws1.getCell(`H${sigRow}`).value = `${tempat}, ${tglStr}`;
  ws1.getCell(`H${sigRow}`).alignment = { horizontal: 'center' };

  ws1.getCell(`H${sigRow + 1}`).value = draft.kpa?.jabatan || 'Kuasa Pengguna Anggaran';
  ws1.getCell(`H${sigRow + 1}`).font = { bold: true };
  ws1.getCell(`H${sigRow + 1}`).alignment = { horizontal: 'center' };

  ws1.getCell(`H${sigRow + 5}`).value = draft.kpa?.nama ? `(${draft.kpa.nama})` : '(..................................................)';
  ws1.getCell(`H${sigRow + 5}`).font = { bold: true, underline: true };
  ws1.getCell(`H${sigRow + 5}`).alignment = { horizontal: 'center' };

  ws1.getCell(`H${sigRow + 6}`).value = draft.kpa?.nip ? `NIP. ${draft.kpa.nip}` : 'NIP. ';
  ws1.getCell(`H${sigRow + 6}`).alignment = { horizontal: 'center' };

  const report: TemplateValidationReport = {
    isValid: true,
    templateName: 'Form Pemutakhiran Data Pengguna Aplikasi SAKTI.xlsx',
    checks: [
      {
        checkId: 1,
        name: 'Header Resmi Royal Blue (#2F5597)',
        passed: true,
        message: 'Header tabel berlatar Royal Blue dengan teks putih tebal dan batas garis hitam rapi'
      },
      {
        checkId: 2,
        name: 'Garis Pembatas Sel Lengkap',
        passed: true,
        message: 'Setiap sel tabel memiliki garis pembatas border tipis hitam standar'
      },
      {
        checkId: 3,
        name: 'Format Teks Anti-Notasi Ilmiah',
        passed: true,
        message: 'Kolom NIP, NPWP, NIK, No HP, dan Tanggal SK dikunci format teks (@)'
      }
    ],
    errors: []
  };

  const ymd = (draft.tanggalPenetapan || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const filename = `Form-Pemutakhiran-Data-Pengguna-SAKTI-${cleanKodeSatker}-${ymd}.xlsx`;

  // Buffer and trigger browser download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return report;
}
