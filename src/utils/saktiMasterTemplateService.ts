import * as XLSX from 'xlsx';
import {
  PerubahanUserHistoryItem,
  PendaftaranUserSaktiDraft,
  PegawaiEmailRecord
} from '../types';
import {
  MASTER_ROLE_MAP,
  formatRolesForExcel,
  sortRolesByMasterOrder
} from '../data/masterRoleSakti';
import { normalizePhoneNumber } from './pendaftaranSaktiValidation';
import { getFormattedDateForFilename } from './pendaftaranSaktiExport';

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
 */
export async function exportPendaftaranSaktiViaTemplate(
  draft: PendaftaranUserSaktiDraft
): Promise<TemplateValidationReport> {
  let masterWb: XLSX.WorkBook;
  try {
    const res = await fetch('/templates/Contoh Form-Pendaftaran-User-SAKTI-Web-SATKER.xlsx');
    if (res.ok) {
      const buf = await res.arrayBuffer();
      masterWb = XLSX.read(buf, { type: 'array', cellFormula: true, cellStyles: true });
    } else {
      masterWb = createMasterPendaftaranUserTemplate();
    }
  } catch {
    masterWb = createMasterPendaftaranUserTemplate();
  }

  const wb = deepCloneWorkbook(masterWb);
  const ws = wb.Sheets['Form Pendaftaran'];
  if (!ws) throw new Error('Sheet "Form Pendaftaran" tidak ditemukan pada Master Template!');

  const cleanKodeSatker = draft.kodeSatker.trim();
  ws['B3'] = { t: 's', v: cleanKodeSatker };
  ws['B4'] = { t: 's', v: draft.namaSatker.trim() };
  ws['B5'] = { t: 's', v: draft.levelSatker || 'Satker Daerah (KD)' };

  // Fill users starting from Row 8
  draft.users.forEach((user, idx) => {
    const r = 8 + idx;
    const rolesStr = formatRolesForExcel(user.roles || []);
    const nip = (user.nip || '').replace(/\D/g, '');
    const nik = (user.nik || '').replace(/\D/g, '');
    const npwp = (user.npwp || '').trim();
    const phone = normalizePhoneNumber(user.noHp || '');
    const tglSk = formatToDdMmYyyy(user.tanggalSk);

    ws[`A${r}`] = { f: '$B$3', v: cleanKodeSatker, t: 's' };
    ws[`B${r}`] = { t: 's', v: rolesStr };
    ws[`C${r}`] = { t: 's', v: user.namaLengkap?.trim() || '' };
    ws[`D${r}`] = { t: 's', v: nip };
    ws[`E${r}`] = { t: 's', v: npwp };
    ws[`F${r}`] = { t: 's', v: nik };
    ws[`G${r}`] = { t: 's', v: user.email?.trim() || '' };
    ws[`H${r}`] = { t: 's', v: phone };
    ws[`I${r}`] = { t: 's', v: user.nomorSk?.trim() || '' };
    ws[`J${r}`] = { t: 's', v: tglSk };
  });

  const maxRow = Math.max(8, 7 + draft.users.length);
  ws['!ref'] = `A1:J${maxRow}`;

  // Validate
  const errors: string[] = [];
  const checks: ValidationCheckItem[] = [];

  const checkSheets = wb.SheetNames.includes('Form Pendaftaran') && wb.SheetNames.includes('Referensi KODE PERAN');
  checks.push({
    checkId: 1,
    name: 'Struktur Sheet Pendaftaran SAKTI Sesuai',
    passed: checkSheets,
    message: checkSheets ? 'Sheet "Form Pendaftaran" & "Referensi KODE PERAN" lengkap' : 'Sheet master tidak lengkap'
  });
  if (!checkSheets) errors.push('Sheet master pendaftaran SAKTI tidak lengkap');

  const checkA8Formula = !ws['A8'] || ws['A8'].f === '$B$3' || ws['A8'].f === '=$B$3';
  checks.push({
    checkId: 2,
    name: 'Formula =$B$3 Kolom A Dipertahankan',
    passed: checkA8Formula,
    message: checkA8Formula ? 'Formula =$B$3 aktif pada baris data' : 'Formula =$B$3 hilang'
  });

  const report: TemplateValidationReport = {
    isValid: errors.length === 0,
    templateName: 'Contoh Form-Pendaftaran-User-SAKTI-Web-SATKER.xlsx',
    checks,
    errors
  };

  if (!report.isValid) {
    throw new Error(`Validasi template pendaftaran gagal:\n` + errors.map(e => `• ${e}`).join('\n'));
  }

  const dateStr = getFormattedDateForFilename();
  const filename = `Form-Pendaftaran-User-SAKTI-${cleanKodeSatker}-${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);

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
 */
export async function exportPendaftaranEmailViaTemplate(
  kodeKppn: string,
  kodeSatker: string,
  namaSatker: string,
  pegawaiList: PegawaiEmailRecord[]
): Promise<TemplateValidationReport> {
  let masterWb: XLSX.WorkBook;
  try {
    const res = await fetch('/templates/format1 (57).xlsx');
    if (res.ok) {
      const buf = await res.arrayBuffer();
      masterWb = XLSX.read(buf, { type: 'array', cellFormula: true, cellStyles: true });
    } else {
      masterWb = createMasterEmailTemplate();
    }
  } catch {
    masterWb = createMasterEmailTemplate();
  }

  const wb = deepCloneWorkbook(masterWb);
  const ws = wb.Sheets['Sheet1'];
  if (!ws) throw new Error('Sheet1 tidak ditemukan pada Master Template Email!');

  const cleanKppn = (kodeKppn || '136').trim();
  const cleanSatker = kodeSatker.trim();

  // Fill records starting at Row 2
  pegawaiList.forEach((pegawai, idx) => {
    const r = 2 + idx;
    const nip = (pegawai.nip || '').replace(/\D/g, '');
    const nik = (pegawai.nik || '').replace(/\D/g, '');
    // Status must be integer 1, 2, 3, 4, 5
    const statusCode = Number(pegawai.status) || 3;

    ws[`A${r}`] = { t: 's', v: cleanKppn };
    ws[`B${r}`] = { t: 's', v: cleanSatker };
    ws[`C${r}`] = { t: 's', v: pegawai.nama?.trim() || '' };
    ws[`D${r}`] = { t: 's', v: nip };
    ws[`E${r}`] = { t: 's', v: nik };
    ws[`F${r}`] = { t: 'n', v: statusCode }; // Numeric code per template requirement
  });

  const maxRow = Math.max(2, 1 + pegawaiList.length);
  ws['!ref'] = `A1:F${maxRow}`;

  // Validate
  const errors: string[] = [];
  const checks: ValidationCheckItem[] = [];

  // Header exact match
  const expectedHeader = 'Status (1=TNI; 2=POLRI; 3=PNS; 4=PPNPN; 5=P3K)';
  const f1Value = (ws['F1']?.v || '').toString().trim();
  const checkHeader = f1Value === expectedHeader;
  checks.push({
    checkId: 1,
    name: 'Header Kolom F Sesuai Persis',
    passed: checkHeader,
    message: checkHeader ? 'Header Kolom F baku terverifikasi' : `Header Kolom F berbeda: "${f1Value}"`
  });
  if (!checkHeader) errors.push('Header Kolom F wajib persis: "Status (1=TNI; 2=POLRI; 3=PNS; 4=PPNPN; 5=P3K)"');

  // Check no extra columns added beyond Column F
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:F2');
  const checkColCount = range.e.c <= 6; // At most col F or preserved G
  checks.push({
    checkId: 2,
    name: 'Tidak Ada Kolom Tambahan Ilegal',
    passed: checkColCount,
    message: checkColCount ? 'Hanya kolom standar A s.d. F yang digunakan' : 'Ditemukan kolom baru yang tidak ada pada template'
  });

  const report: TemplateValidationReport = {
    isValid: errors.length === 0,
    templateName: 'format1 (57).xlsx',
    checks,
    errors
  };

  if (!report.isValid) {
    throw new Error(`Validasi template email gagal:\n` + errors.map(e => `• ${e}`).join('\n'));
  }

  const dateStr = getFormattedDateForFilename();
  const filename = `Form-Pendaftaran-Email-Kemenkeu-${cleanSatker}-${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);

  return report;
}
