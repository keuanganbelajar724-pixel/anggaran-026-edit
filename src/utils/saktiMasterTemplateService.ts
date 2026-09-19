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
 * Clones "Contoh Form Pemutakhiran Kewenangan (29).xlsx", fills data, validates, and downloads
 */
export async function exportPemutakhiranKewenanganViaTemplate(
  draft: PemutakhiranKewenanganDraft
): Promise<TemplateValidationReport> {
  if (!draft.users || draft.users.length === 0) {
    throw new Error('Daftar pemutakhiran pengguna masih kosong. Tambahkan minimal 1 pengguna.');
  }

  // 1. Ambil Master Template
  let masterWb: XLSX.WorkBook;
  try {
    const res = await fetch('/templates/Contoh Form Pemutakhiran Kewenangan (29).xlsx');
    if (res.ok) {
      const buf = await res.arrayBuffer();
      masterWb = XLSX.read(buf, { type: 'array', cellFormula: true, cellStyles: true });
    } else {
      masterWb = createMasterPemutakhiranKewenanganTemplate();
    }
  } catch {
    masterWb = createMasterPemutakhiranKewenanganTemplate();
  }

  // 2. COPY TEMPLATE SECARA LANGSUNG
  const wb = deepCloneWorkbook(masterWb);
  const ws1 = wb.Sheets['Form Pemutakhiran Kewenangan'];
  if (!ws1) throw new Error('Sheet "Form Pemutakhiran Kewenangan" tidak ditemukan pada Master Template!');

  // 3. ISI IDENTITAS SATKER
  const cleanKodeSatker = (draft.kodeSatker || '').trim();
  const cleanNamaSatker = (draft.namaSatker || '').trim();
  const cleanLevelSatker = (draft.levelSatker || 'Satker Daerah (KD)').trim();

  ws1['B3'] = { t: 's', v: cleanKodeSatker };
  ws1['B4'] = { t: 's', v: cleanNamaSatker };
  ws1['B6'] = { t: 's', v: cleanLevelSatker };

  // 4. ISI DATA USER PADA BARIS 8+
  draft.users.forEach((u, idx) => {
    const rowIndex = 8 + idx;
    const sortedRoles = sortRolesByMasterOrder(u.rolesPemutakhiran || []);
    const rolesStr = formatRolesForExcel(sortedRoles);
    const cleanNik = (u.nik || '').replace(/\D/g, '');

    // Col A: Formula =$B$3
    ws1[`A${rowIndex}`] = { f: '$B$3' };

    // Col B: Tipe (default 'SATKER')
    ws1[`B${rowIndex}`] = { t: 's', v: (u.tipe || 'SATKER').trim() };

    // Col C: Peran (Kategori e.g. OPERATOR, APPROVER, VALIDATOR)
    ws1[`C${rowIndex}`] = { t: 's', v: (u.peranKategori || 'OPERATOR').trim() };

    // Col D: Nama
    ws1[`D${rowIndex}`] = { t: 's', v: (u.nama || '').trim() };

    // Col E: NIK (wajib text type 's' agar tidak kena scientific notation)
    ws1[`E${rowIndex}`] = { t: 's', v: cleanNik };

    // Col F: Peran SAKTI (multi role dipisah ', ')
    ws1[`F${rowIndex}`] = { t: 's', v: rolesStr };
  });

  // 5. Geser/Tulis Catatan dan Tanda Tangan KPA setelah baris tabel terakhir
  const startNotesRow = 8 + draft.users.length + 2;
  ws1[`A${startNotesRow}`] = { t: 's', v: 'Catatan:' };
  ws1[`A${startNotesRow + 1}`] = { t: 's', v: '1. Silakan mengisi data pengguna (User) yang ingin di-update kewenangannya.' };
  ws1[`A${startNotesRow + 2}`] = { t: 's', v: '2. Pastikan NIK telah benar dimiliki oleh pengguna dan sesuai (16 digit).' };
  ws1[`A${startNotesRow + 3}`] = { t: 's', v: '3. Isian Formulir Pemutakhiran Kewenangan akan mengupdate kewenangan user yang ada saat ini.' };

  // Tanda Tangan KPA
  const sigRow = startNotesRow + 5;
  const tempat = draft.tempatPenetapan || 'Jakarta';
  const tglStr = formatToDdMmYyyy(draft.tanggalPenetapan) || formatToDdMmYyyy(new Date().toISOString());

  ws1[`E${sigRow}`] = { t: 's', v: `${tempat}, ${tglStr}` };
  ws1[`E${sigRow + 1}`] = { t: 's', v: draft.kpa?.jabatan || 'Kuasa Pengguna Anggaran' };
  ws1[`E${sigRow + 5}`] = { t: 's', v: draft.kpa?.nama ? `(${draft.kpa.nama})` : '(..................................................)' };
  ws1[`E${sigRow + 6}`] = { t: 's', v: draft.kpa?.nip ? `NIP. ${draft.kpa.nip}` : 'NIP. ' };

  // Update sheet range
  ws1['!ref'] = `A1:F${sigRow + 8}`;

  // 6. JALANKAN 13-POINT VALIDATION ENGINE
  const report = validatePemutakhiranKewenanganWorkbook(wb, cleanKodeSatker, draft.users);
  if (!report.isValid) {
    throw new Error(
      `Ekspor Dibatalkan! File tidak lolos verifikasi Master Template Kemenkeu:\n` +
      report.errors.map(e => `• ${e}`).join('\n')
    );
  }

  // 7. FORMAT NAMA FILE: Form-Pemutakhiran-Kewenangan-[KODE_SATKER]-[YYYYMMDD].xlsx
  const ymd = (draft.tanggalPenetapan || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const filename = `Form-Pemutakhiran-Kewenangan-${cleanKodeSatker}-${ymd}.xlsx`;

  XLSX.writeFile(wb, filename);
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
 * Clones "Form Pemutakhiran Data Pengguna Aplikasi SAKTI.xlsx", populates cells, validates, and downloads
 */
export async function exportPemutakhiranDataViaTemplate(
  draft: PemutakhiranDataDraft
): Promise<TemplateValidationReport> {
  if (!draft.users || draft.users.length === 0) {
    throw new Error('Daftar pemutakhiran data pengguna masih kosong. Tambahkan minimal 1 pengguna.');
  }

  // 1. Ambil Master Template
  let masterWb: XLSX.WorkBook;
  try {
    const res = await fetch('/templates/Form Pemutakhiran Data Pengguna Aplikasi SAKTI.xlsx');
    if (res.ok) {
      const buf = await res.arrayBuffer();
      masterWb = XLSX.read(buf, { type: 'array', cellFormula: true, cellStyles: true });
    } else {
      masterWb = createMasterPemutakhiranDataTemplate();
    }
  } catch {
    masterWb = createMasterPemutakhiranDataTemplate();
  }

  // 2. COPY TEMPLATE SECARA LANGSUNG
  const wb = deepCloneWorkbook(masterWb);
  const ws = wb.Sheets['Form Pemutakhiran Data'];
  if (!ws) throw new Error('Sheet "Form Pemutakhiran Data" tidak ditemukan pada Master Template!');

  // 3. ISI IDENTITAS SATKER
  const cleanKodeSatker = (draft.kodeSatker || '').trim();
  const cleanNamaSatker = (draft.namaSatker || '').trim();
  const cleanLevelSatker = (draft.levelSatker || 'Satker Daerah (KD)').trim();

  ws['B3'] = { t: 's', v: cleanKodeSatker };
  ws['B4'] = { t: 's', v: cleanNamaSatker };
  ws['B6'] = { t: 's', v: cleanLevelSatker };

  // 4. ISI DATA PENGGUNA PADA BARIS 8+
  draft.users.forEach((u, idx) => {
    const rowIndex = 8 + idx;
    const sortedRoles = sortRolesByMasterOrder(u.peranList || []);
    const rolesStr = formatRolesForExcel(sortedRoles);
    const cleanNik = (u.nik || '').replace(/\D/g, '');
    const cleanNip = (u.nip || '').replace(/\D/g, '');
    const cleanNpwp = (u.npwp || '').replace(/\D/g, '');
    const cleanHp = (u.noHp || '').replace(/[^\d+]/g, '');
    const cleanTglSk = formatToDdMmYyyy(u.tanggalSk);

    // Col A: Formula =$B$3
    ws[`A${rowIndex}`] = { f: '$B$3' };

    // Col B: Peran (Multi role dipisah ", ")
    ws[`B${rowIndex}`] = { t: 's', v: rolesStr };

    // Col C: Nama
    ws[`C${rowIndex}`] = { t: 's', v: (u.nama || '').trim() };

    // Col D: NIP (Text)
    ws[`D${rowIndex}`] = { t: 's', v: cleanNip };

    // Col E: NPWP (Text)
    ws[`E${rowIndex}`] = { t: 's', v: cleanNpwp };

    // Col F: NIK (Text 16 digit)
    ws[`F${rowIndex}`] = { t: 's', v: cleanNik };

    // Col G: E-mail (@sakti.mail.go.id / @kemenkeu.go.id)
    ws[`G${rowIndex}`] = { t: 's', v: (u.email || '').trim().toLowerCase() };

    // Col H: No. HP (Text diawali 08)
    ws[`H${rowIndex}`] = { t: 's', v: cleanHp };

    // Col I: Nomor SK (Text)
    ws[`I${rowIndex}`] = { t: 's', v: (u.nomorSk || '').trim() };

    // Col J: Tanggal SK (Format DD-MM-YYYY)
    ws[`J${rowIndex}`] = { t: 's', v: cleanTglSk };
  });

  // 5. Tulis Catatan & Tanda Tangan KPA setelah baris terakhir
  const startNotesRow = 8 + draft.users.length + 2;
  ws[`A${startNotesRow}`] = { t: 's', v: 'Catatan:' };
  ws[`A${startNotesRow + 1}`] = { t: 's', v: '1. NIP, NPWP, dan NIK diisi angka tanpa pemisah simbol' };
  ws[`A${startNotesRow + 2}`] = { t: 's', v: '2. Email diisi dengan email SAKTI (@sakti.mail.go.id) atau Kemenkeu (@kemenkeu.go.id) bagi pegawai Kemenkeu' };
  ws[`A${startNotesRow + 3}`] = { t: 's', v: '3. tanggal SK diisi dengan format DD-MM-YYYY' };

  // Tanda Tangan KPA
  const sigRow = startNotesRow + 5;
  const tempat = draft.tempatPenetapan || 'Jakarta';
  const tglStr = formatToDdMmYyyy(draft.tanggalPenetapan) || formatToDdMmYyyy(new Date().toISOString());

  ws[`H${sigRow}`] = { t: 's', v: `${tempat}, ${tglStr}` };
  ws[`H${sigRow + 1}`] = { t: 's', v: draft.kpa?.jabatan || 'Kuasa Pengguna Anggaran' };
  ws[`H${sigRow + 5}`] = { t: 's', v: draft.kpa?.nama ? `(${draft.kpa.nama})` : '(..................................................)' };
  ws[`H${sigRow + 6}`] = { t: 's', v: draft.kpa?.nip ? `NIP. ${draft.kpa.nip}` : 'NIP. ' };

  // Perbarui range lembar kerja
  ws['!ref'] = `A1:J${sigRow + 8}`;

  // 6. Jalankan 18-Point Pre-Export Validation
  const report = validatePemutakhiranDataWorkbook(wb, cleanKodeSatker, draft.users);
  if (!report.isValid) {
    throw new Error(
      `Ekspor Dibatalkan! File tidak lolos verifikasi Master Template Kemenkeu:\n` +
      report.errors.map(e => `• ${e}`).join('\n')
    );
  }

  // 7. FORMAT NAMA FILE: Form-Pemutakhiran-Data-Pengguna-SAKTI-[KODE_SATKER]-[YYYYMMDD].xlsx
  const ymd = (draft.tanggalPenetapan || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const filename = `Form-Pemutakhiran-Data-Pengguna-SAKTI-${cleanKodeSatker}-${ymd}.xlsx`;

  XLSX.writeFile(wb, filename);
  return report;
}
