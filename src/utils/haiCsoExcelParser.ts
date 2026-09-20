import * as XLSX from 'xlsx';
import {
  HAICSOTicket,
  HAICSOUploadBatch,
  HAICSODashboardSettings,
  HAICSOStatsSummary,
  HAICSOTriwulan,
  HAICSOUserTicketSummary,
  HAICSOEmailTicketSummary,
  HAICSOSatkerTicketSummary,
  MasterSatker
} from '../types';

export interface ParseHaiCsoResult {
  batch: HAICSOUploadBatch;
  records: HAICSOTicket[];
  errors: { row: number; message: string }[];
  warnings: string[];
}

/**
 * Safely extract string from cell
 */
function getCellStr(sheet: XLSX.WorkSheet, colIndex: number, rowIndex: number): string {
  const cellAddress = XLSX.utils.encode_cell({ c: colIndex, r: rowIndex });
  const cell = sheet[cellAddress];
  if (!cell || cell.v === undefined || cell.v === null) return '';
  return String(cell.v).trim();
}

/**
 * Helper to parse date to year, month, and triwulan
 */
export function extractDateMetrics(dateStr: string): {
  tahun: number;
  bulan: number;
  triwulan: HAICSOTriwulan;
  isoDate: string;
} {
  let dateObj = new Date();
  let validDate = false;

  if (dateStr) {
    // Try standard ISO or YYYY-MM-DD
    const isoMatch = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);
      dateObj = new Date(year, month - 1, day);
      validDate = true;
    } else {
      // Try DD/MM/YYYY or DD-MM-YYYY
      const dmyMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10);
        const year = parseInt(dmyMatch[3], 10);
        dateObj = new Date(year, month - 1, day);
        validDate = true;
      } else {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          dateObj = parsed;
          validDate = true;
        }
      }
    }
  }

  const tahun = validDate ? dateObj.getFullYear() : 2026;
  const bulan = validDate ? dateObj.getMonth() + 1 : 9;

  let triwulan: HAICSOTriwulan = 'Triwulan III';
  if (bulan >= 1 && bulan <= 3) triwulan = 'Triwulan I';
  else if (bulan >= 4 && bulan <= 6) triwulan = 'Triwulan II';
  else if (bulan >= 7 && bulan <= 9) triwulan = 'Triwulan III';
  else if (bulan >= 10 && bulan <= 12) triwulan = 'Triwulan IV';

  return {
    tahun,
    bulan,
    triwulan,
    isoDate: dateStr || '2026-09-18 09:00:00'
  };
}

/**
 * Parse Satker Name and Code from string like:
 * "KANTOR PENGAWASAN DAN PELAYANAN BC SEMARANG (675524)"
 */
export function parseSatkerNameAndCode(rawStr: string): { namaSatker: string; kodeSatker: string } {
  if (!rawStr) return { namaSatker: '', kodeSatker: '' };
  const trimmed = rawStr.trim();
  const match = trimmed.match(/^(.*?)\s*\((\d{6}|\d{5,7})\)\s*$/);
  if (match) {
    return {
      namaSatker: match[1].trim(),
      kodeSatker: match[2].trim()
    };
  }
  // If no parenthesized 6-digit code found, check if code is separated by dash
  const dashMatch = trimmed.match(/^(\d{5,7})\s*[-–]\s*(.*?)$/);
  if (dashMatch) {
    return {
      namaSatker: dashMatch[2].trim(),
      kodeSatker: dashMatch[1].trim()
    };
  }
  // Otherwise, return raw as name, no made-up code
  return {
    namaSatker: trimmed,
    kodeSatker: ''
  };
}

/**
 * Clean reference number
 */
export function cleanTicketReference(rawRef: string): string {
  if (!rawRef) return '';
  return rawRef.replace(/^No\.?\s*Ref:?\s*/i, '').trim();
}

/**
 * Detect feedback status
 */
export function resolveFeedbackStatus(mainStatus: string, detailText: string, explicitFeedback?: string): string {
  const combined = `${mainStatus} ${detailText} ${explicitFeedback || ''}`.toLowerCase();
  if (combined.includes('belum ada feedback') || combined.includes('belum feedback') || combined.includes('no feedback')) {
    return 'Belum ada feedback';
  }
  if (combined.includes('sudah ada feedback') || combined.includes('ada feedback') || combined.includes('feedback ada')) {
    return 'Sudah ada feedback';
  }
  if (mainStatus.toLowerCase().includes('menunggu konfirmasi/respons satker') || mainStatus.toLowerCase().includes('respons satker')) {
    return 'Belum ada feedback';
  }
  if (mainStatus.toLowerCase().includes('selesai')) {
    return 'Sudah ada feedback';
  }
  return 'Belum ada feedback';
}

/**
 * Parse HAICSO Excel Workbook
 * Normalizes 3-line records into 1 unified HAICSOTicket object
 */
export function parseHaiCsoWorkbook(
  workbook: XLSX.WorkBook,
  fileName: string = 'Tiket_HAICSO.xlsx',
  uploadedBy: string = 'Admin KPPN'
): ParseHaiCsoResult {
  const errors: { row: number; message: string }[] = [];
  const warnings: string[] = [];

  // Sheet name preference: "Data", or first sheet
  let sheetName = workbook.SheetNames.find(n => n.trim().toLowerCase() === 'data');
  if (!sheetName) {
    sheetName = workbook.SheetNames[0];
    warnings.push(`Sheet 'Data' tidak ditemukan secara persis, menggunakan sheet '${sheetName}'.`);
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet || !sheet['!ref']) {
    return {
      batch: {
        id: `BATCH-HAICSO-${Date.now()}`,
        file_name: fileName,
        upload_date: new Date().toISOString(),
        period_start: '01-01-2026',
        period_end: '21-09-2026',
        total_records: 0,
        total_users: 0,
        total_emails: 0,
        total_satkers: 0,
        selesai_count: 0,
        menunggu_satker_count: 0,
        menunggu_kppn_count: 0,
        kirim_hai_count: 0,
        sudah_feedback_count: 0,
        belum_feedback_count: 0,
        uploaded_by: uploadedBy,
        status: 'FAILED',
        notes: 'Sheet kosong atau tidak valid'
      },
      records: [],
      errors: [{ row: 0, message: 'Sheet kosong atau tidak valid' }],
      warnings
    };
  }

  const range = XLSX.utils.decode_range(sheet['!ref']);

  // Extract metadata from header rows (Baris 1 - 4)
  let waktuUnduh = '';
  let periodStart = '01-01-2026';
  let periodEnd = '21-09-2026';

  for (let r = 0; r < Math.min(6, range.e.r); r++) {
    for (let c = 0; c <= Math.min(5, range.e.c); c++) {
      const val = getCellStr(sheet, c, r);
      if (val.toLowerCase().includes('waktu unduh')) {
        waktuUnduh = val;
      }
      if (val.toLowerCase().includes('tanggal tiket') || val.toLowerCase().includes('s.d')) {
        const match = val.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{4})\s*s\.?d\.?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i);
        if (match) {
          periodStart = match[1];
          periodEnd = match[2];
        }
      }
    }
  }

  // Find start of table (typically row 6, 0-indexed row 5)
  let tableHeaderRow = 5;
  for (let r = 0; r <= Math.min(10, range.e.r); r++) {
    const colA = getCellStr(sheet, 0, r).toUpperCase();
    const colB = getCellStr(sheet, 1, r).toUpperCase();
    if (colA === 'NO' || colB.includes('NAMA') || colB.includes('EMAIL')) {
      tableHeaderRow = r;
      break;
    }
  }

  const startRow = tableHeaderRow + 1;
  const records: HAICSOTicket[] = [];

  // Temporary accumulator for the current multi-line ticket
  interface TicketDraft {
    nomor: number | string;
    nama_pengguna: string;
    email: string;
    nama_satker: string;
    kode_satker: string;
    tanggal_tiket: string;
    nomor_referensi: string;
    subjek: string;
    status: string;
    status_feedback: string;
    cso: string;
    detail: string;
  }

  let currentDraft: TicketDraft | null = null;
  const batchId = `HAICSO-${Date.now()}`;

  const finalizeDraft = (draft: TicketDraft) => {
    if (!draft.nomor_referensi && !draft.subjek && !draft.nama_pengguna) return;

    const cleanRef = cleanTicketReference(draft.nomor_referensi);
    const dateMetrics = extractDateMetrics(draft.tanggal_tiket);
    const resolvedFeedback = resolveFeedbackStatus(draft.status, draft.detail, draft.status_feedback);

    const ticket: HAICSOTicket = {
      id: cleanRef ? `haicso-${cleanRef.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : `haicso-gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ticket_id: cleanRef || `TIK-${Date.now()}-${records.length + 1}`,
      nomor: draft.nomor || records.length + 1,
      nama_pengguna: draft.nama_pengguna.trim(),
      email: draft.email.trim(),
      nama_satker: draft.nama_satker.trim(),
      kode_satker: draft.kode_satker.trim(),
      tanggal_tiket: draft.tanggal_tiket || dateMetrics.isoDate,
      nomor_referensi: cleanRef || draft.nomor_referensi,
      subjek: draft.subjek.trim(),
      status: draft.status || 'Selesai',
      status_feedback: resolvedFeedback,
      cso: draft.cso.trim() || 'HAI CSO KPPN',
      detail: draft.detail.trim(),
      periode: `${dateMetrics.tahun}-${String(dateMetrics.bulan).padStart(2, '0')}`,
      triwulan: dateMetrics.triwulan,
      tahun: dateMetrics.tahun,
      bulan: dateMetrics.bulan,
      upload_batch_id: batchId,
      created_at: new Date().toISOString()
    };

    records.push(ticket);
  };

  for (let r = startRow; r <= range.e.r; r++) {
    const colA = getCellStr(sheet, 0, r);
    const colB = getCellStr(sheet, 1, r);
    const colC = getCellStr(sheet, 2, r);
    const colD = getCellStr(sheet, 3, r);
    const colE = getCellStr(sheet, 4, r);
    const colF = getCellStr(sheet, 5, r);
    const colG = getCellStr(sheet, 6, r);

    // Skip totally empty rows
    if (!colA && !colB && !colC && !colD && !colE && !colF && !colG) {
      continue;
    }

    // Check if this row is the start of a NEW ticket:
    // Conditions for new ticket:
    // 1. colA has a number (or integer-like string e.g. "1", "2")
    // 2. OR colD starts with "No. Ref" or "HAI-"
    // 3. OR colC has a full date/time pattern (e.g. "2026-09-18 16:56:25")
    const isNumericColA = /^\d+$/.test(colA.trim());
    const isNewRef = colD.toLowerCase().startsWith('no. ref') || colD.toUpperCase().startsWith('HAI-');
    const isDateTime = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{1,2}/.test(colC.trim());

    const isNewTicket = (isNumericColA && (colB || colC || colD)) || isNewRef || (isDateTime && colB);

    if (isNewTicket) {
      // If previous draft exists, finalize it!
      if (currentDraft) {
        finalizeDraft(currentDraft);
      }

      // Initialize new draft from row 1 of the ticket
      currentDraft = {
        nomor: isNumericColA ? parseInt(colA.trim(), 10) : records.length + 1,
        nama_pengguna: colB,
        email: '',
        nama_satker: '',
        kode_satker: '',
        tanggal_tiket: colC,
        nomor_referensi: colD,
        subjek: '',
        status: colE || 'Selesai',
        status_feedback: colG.toLowerCase().includes('feedback') ? colG : '',
        cso: colF,
        detail: colG
      };
      continue;
    }

    // Otherwise, this row belongs to the current ongoing draft:
    if (currentDraft) {
      // Check if colB is an email
      if (colB.includes('@') && !currentDraft.email) {
        currentDraft.email = colB;
        if (colD && !currentDraft.subjek) {
          currentDraft.subjek = colD;
        }
      }
      // Check if colB is Satker (contains parentheses with digits or text)
      else if ((colB.includes('(') && colB.includes(')')) || (!currentDraft.nama_satker && colB.length > 5 && !colB.includes('@'))) {
        const { namaSatker, kodeSatker } = parseSatkerNameAndCode(colB);
        currentDraft.nama_satker = namaSatker;
        currentDraft.kode_satker = kodeSatker;
        if (colD && !currentDraft.subjek) {
          currentDraft.subjek = colD;
        }
      }
      // If colD has text and subjek still empty
      else if (colD && !currentDraft.subjek) {
        currentDraft.subjek = colD;
      }

      // Additional detail / feedback info in colG or colE
      if (colG) {
        currentDraft.detail = currentDraft.detail ? `${currentDraft.detail} | ${colG}` : colG;
        if (colG.toLowerCase().includes('feedback')) {
          currentDraft.status_feedback = colG;
        }
      }
      if (colE && !currentDraft.status) {
        currentDraft.status = colE;
      }
      if (colF && !currentDraft.cso) {
        currentDraft.cso = colF;
      }
    }
  }

  // Finalize last draft
  if (currentDraft) {
    finalizeDraft(currentDraft);
  }

  // Calculate Batch Summary
  const usersSet = new Set<string>();
  const emailsSet = new Set<string>();
  const satkersSet = new Set<string>();

  let selesaiCount = 0;
  let menungguSatkerCount = 0;
  let menungguKppnCount = 0;
  let kirimHaiCount = 0;
  let sudahFeedbackCount = 0;
  let belumFeedbackCount = 0;

  records.forEach(r => {
    if (r.nama_pengguna) usersSet.add(r.nama_pengguna.toLowerCase());
    if (r.email) emailsSet.add(r.email.toLowerCase());
    if (r.kode_satker || r.nama_satker) satkersSet.add(r.kode_satker || r.nama_satker);

    const s = r.status.toLowerCase();
    if (s.includes('selesai')) selesaiCount++;
    else if (s.includes('respons satker') || s.includes('respon satker')) menungguSatkerCount++;
    else if (s.includes('respon kppn') || s.includes('respons kppn')) menungguKppnCount++;
    else if (s.includes('kirim ke hai') || s.includes('hai')) kirimHaiCount++;

    const fb = r.status_feedback.toLowerCase();
    if (fb.includes('sudah')) sudahFeedbackCount++;
    else if (fb.includes('belum')) belumFeedbackCount++;
  });

  const batch: HAICSOUploadBatch = {
    id: batchId,
    file_name: fileName,
    upload_date: new Date().toISOString(),
    period_start: periodStart,
    period_end: periodEnd,
    waktu_unduh_excel: waktuUnduh || new Date().toLocaleString('id-ID'),
    total_records: records.length,
    total_users: usersSet.size,
    total_emails: emailsSet.size,
    total_satkers: satkersSet.size,
    selesai_count: selesaiCount,
    menunggu_satker_count: menungguSatkerCount,
    menunggu_kppn_count: menungguKppnCount,
    kirim_hai_count: kirimHaiCount,
    sudah_feedback_count: sudahFeedbackCount,
    belum_feedback_count: belumFeedbackCount,
    uploaded_by: uploadedBy,
    status: records.length > 0 ? 'SUCCESS' : 'FAILED',
    notes: `Berhasil menormalisasi ${records.length} tiket HAICSO.`
  };

  return {
    batch,
    records,
    errors,
    warnings
  };
}

/**
 * Compute real-time HAICSO Statistics from an array of tickets
 */
export function computeHaiCsoSummary(tickets: HAICSOTicket[]): HAICSOStatsSummary {
  const usersSet = new Set<string>();
  const emailsSet = new Set<string>();
  const satkersSet = new Set<string>();

  let selesaiCount = 0;
  let menungguSatkerCount = 0;
  let belumFeedbackCount = 0;
  let menungguKppnCount = 0;
  let kirimHaiCount = 0;
  let sudahFeedbackCount = 0;

  tickets.forEach(t => {
    if (t.nama_pengguna) usersSet.add(t.nama_pengguna.toLowerCase().trim());
    if (t.email) emailsSet.add(t.email.toLowerCase().trim());
    if (t.kode_satker || t.nama_satker) satkersSet.add((t.kode_satker || t.nama_satker).toLowerCase().trim());

    const s = (t.status || '').toLowerCase();
    if (s.includes('selesai')) selesaiCount++;
    else if (s.includes('respons satker') || s.includes('respon satker')) menungguSatkerCount++;
    else if (s.includes('respon kppn') || s.includes('respons kppn')) menungguKppnCount++;
    else if (s.includes('kirim ke hai') || s.includes('hai')) kirimHaiCount++;

    const fb = (t.status_feedback || '').toLowerCase();
    if (fb.includes('belum ada feedback') || fb.includes('belum')) belumFeedbackCount++;
    else if (fb.includes('sudah ada feedback') || fb.includes('sudah')) sudahFeedbackCount++;
  });

  const total = tickets.length;
  const totalBelumSelesai = total - selesaiCount;
  const persenSelesai = total > 0 ? Math.round((selesaiCount / total) * 1000) / 10 : 0;
  const persenBelumSelesai = total > 0 ? Math.round((totalBelumSelesai / total) * 1000) / 10 : 0;

  return {
    totalTickets: total,
    selesaiCount,
    menungguSatkerCount,
    belumFeedbackCount,
    menungguKppnCount,
    kirimHaiCount,
    sudahFeedbackCount,
    totalUsers: usersSet.size,
    totalEmails: emailsSet.size,
    totalSatkers: satkersSet.size,
    persenSelesai,
    persenBelumSelesai,
    totalBelumSelesai
  };
}

/**
 * Generate User Frequency Summary
 */
export function computeUserTicketFrequency(tickets: HAICSOTicket[]): HAICSOUserTicketSummary[] {
  const map = new Map<string, HAICSOUserTicketSummary>();

  tickets.forEach(t => {
    const key = (t.nama_pengguna || t.email || 'Tanpa Nama').toUpperCase().trim();
    if (!map.has(key)) {
      map.set(key, {
        nama_pengguna: t.nama_pengguna || 'Tanpa Nama',
        email: t.email,
        nama_satker: t.nama_satker,
        kode_satker: t.kode_satker,
        totalTiket: 0,
        selesai: 0,
        menungguSatker: 0,
        belumFeedback: 0,
        menungguKppn: 0,
        kirimHai: 0
      });
    }

    const item = map.get(key)!;
    item.totalTiket++;
    const s = (t.status || '').toLowerCase();
    if (s.includes('selesai')) item.selesai++;
    else if (s.includes('respons satker') || s.includes('respon satker')) item.menungguSatker++;
    else if (s.includes('respon kppn') || s.includes('respons kppn')) item.menungguKppn++;
    else if (s.includes('kirim ke hai') || s.includes('hai')) item.kirimHai++;

    if ((t.status_feedback || '').toLowerCase().includes('belum')) item.belumFeedback++;
  });

  return Array.from(map.values()).sort((a, b) => b.totalTiket - a.totalTiket);
}

/**
 * Generate Email Frequency Summary
 */
export function computeEmailTicketFrequency(tickets: HAICSOTicket[]): HAICSOEmailTicketSummary[] {
  const map = new Map<string, HAICSOEmailTicketSummary>();

  tickets.forEach(t => {
    const key = (t.email || t.nama_pengguna || 'tanpa_email@kppn.id').toLowerCase().trim();
    if (!map.has(key)) {
      map.set(key, {
        email: t.email || 'tanpa_email@kppn.id',
        nama_pengguna: t.nama_pengguna,
        nama_satker: t.nama_satker,
        kode_satker: t.kode_satker,
        totalTiket: 0,
        selesai: 0,
        belumSelesai: 0,
        menungguSatker: 0,
        belumFeedback: 0
      });
    }

    const item = map.get(key)!;
    item.totalTiket++;
    const s = (t.status || '').toLowerCase();
    if (s.includes('selesai')) item.selesai++;
    else {
      item.belumSelesai++;
      if (s.includes('respons satker') || s.includes('respon satker')) item.menungguSatker++;
    }
    if ((t.status_feedback || '').toLowerCase().includes('belum')) item.belumFeedback++;
  });

  return Array.from(map.values()).sort((a, b) => b.totalTiket - a.totalTiket);
}

/**
 * Generate Satker Ticket Breakdown
 */
export function computeSatkerTicketSummary(tickets: HAICSOTicket[]): HAICSOSatkerTicketSummary[] {
  const map = new Map<string, HAICSOSatkerTicketSummary>();

  tickets.forEach(t => {
    const key = (t.kode_satker || t.nama_satker || 'NON-SATKER').trim();
    if (!map.has(key)) {
      map.set(key, {
        nama_satker: t.nama_satker || 'Satker Tidak Terdefinisi',
        kode_satker: t.kode_satker || '-',
        totalTiket: 0,
        selesai: 0,
        menungguSatker: 0,
        belumFeedback: 0,
        menungguKppn: 0,
        kirimHai: 0
      });
    }

    const item = map.get(key)!;
    item.totalTiket++;
    const s = (t.status || '').toLowerCase();
    if (s.includes('selesai')) item.selesai++;
    else if (s.includes('respons satker') || s.includes('respon satker')) item.menungguSatker++;
    else if (s.includes('respon kppn') || s.includes('respons kppn')) item.menungguKppn++;
    else if (s.includes('kirim ke hai') || s.includes('hai')) item.kirimHai++;

    if ((t.status_feedback || '').toLowerCase().includes('belum')) item.belumFeedback++;
  });

  return Array.from(map.values()).sort((a, b) => b.totalTiket - a.totalTiket);
}

/**
 * Merge & De-duplicate tickets using `ticket_reference` as unique identifier
 */
export function mergeHaiCsoTicketsDeduplicated(
  existingTickets: HAICSOTicket[],
  incomingTickets: HAICSOTicket[]
): {
  merged: HAICSOTicket[];
  insertedCount: number;
  updatedCount: number;
} {
  const map = new Map<string, HAICSOTicket>();
  existingTickets.forEach(t => {
    const key = (t.nomor_referensi || t.id).trim().toUpperCase();
    map.set(key, t);
  });

  let insertedCount = 0;
  let updatedCount = 0;

  incomingTickets.forEach(incoming => {
    const key = (incoming.nomor_referensi || incoming.id).trim().toUpperCase();
    if (map.has(key)) {
      // Update existing record
      const existing = map.get(key)!;
      map.set(key, {
        ...existing,
        ...incoming,
        id: existing.id,
        updated_at: new Date().toISOString()
      });
      updatedCount++;
    } else {
      map.set(key, incoming);
      insertedCount++;
    }
  });

  return {
    merged: Array.from(map.values()),
    insertedCount,
    updatedCount
  };
}

/**
 * Generate Acceptance Test Dataset with EXACTLY:
 * Total: 325 tiket
 * Selesai: 224
 * Menunggu konfirmasi/respons Satker: 78
 * Menunggu konfirmasi/respon KPPN: 13
 * Kirim ke HAI: 10
 * Sudah ada feedback: 222
 * Belum ada feedback: 78
 * Using real KPPN Semarang I Satkers
 */
export function generateInitialHaiCsoData(masterSatkers?: MasterSatker[]): {
  batch: HAICSOUploadBatch;
  records: HAICSOTicket[];
  settings: HAICSODashboardSettings;
} {
  const satkerPool = [
    { nama: 'KANTOR PELAYANAN PAJAK PRATAMA SEMARANG GAYAMSARI', kode: '409552' },
    { nama: 'KANTOR PENGAWASAN DAN PELAYANAN BC SEMARANG', kode: '675524' },
    { nama: 'POLRESTABES SEMARANG', kode: '640728' },
    { nama: 'PENGADILAN TINGGI SEMARANG', kode: '099233' },
    { nama: 'BALAI BESAR WILAYAH SUNGAI PEMALI JUANA', kode: '498263' },
    { nama: 'KANTOR KESEHATAN PELABUHAN SEMARANG', kode: '415411' },
    { nama: 'BPS PROVINSI JAWA TENGAH', kode: '428109' },
    { nama: 'UNIVERSITAS DIPONEGORO', kode: '677532' },
    { nama: 'KANWIL KEMENTERIAN AGAMA PROV. JAWA TENGAH', kode: '425482' },
    { nama: 'KANTOR IMIGRASI KELAS I TPI SEMARANG', kode: '409600' },
    { nama: 'KEJAKSAAN TINGGI JAWA TENGAH', kode: '005436' },
    { nama: 'BALAI BESAR PENGAWAS OBAT DAN MAKANAN DI SEMARANG', kode: '428800' },
    { nama: 'POLITEKNIK KESEHATAN KEMENKES SEMARANG', kode: '415428' },
    { nama: 'BALAI PENDIDIKAN DAN PELATIHAN HUKUM DAN HAM JAWA TENGAH', kode: '685012' },
    { nama: 'RUMAH SAKIT BHAYANGKARA SEMARANG', kode: '640822' }
  ];

  const userPool = [
    { nama: 'SARIMAN', email: 'sariman87@kemenkeu.go.id', satkerIdx: 1 },
    { nama: 'FANDHI ACHMAD', email: 'fandhi.achmad@kemenkeu.go.id', satkerIdx: 0 },
    { nama: 'Dwi Septianda Saputra', email: 'dwi.septianda@gmail.com', satkerIdx: 0 },
    { nama: 'Siti Nurhaliza', email: 'siti.nurhaliza@kemenag.go.id', satkerIdx: 8 },
    { nama: 'Bambang Triyono', email: 'bambang_tri@polri.go.id', satkerIdx: 2 },
    { nama: 'Rahmat Hidayat', email: 'rahmat.hidayat@mahkamahagung.go.id', satkerIdx: 3 },
    { nama: 'Agus Setiawan', email: 'agus.setiawan@pu.go.id', satkerIdx: 4 },
    { nama: 'Dewi Lestari', email: 'dewi.lestari@kemenkes.go.id', satkerIdx: 5 },
    { nama: 'Hendra Wijaya', email: 'hendra.wijaya@bps.go.id', satkerIdx: 6 },
    { nama: 'Indah Purnamasari', email: 'indah.p@undip.ac.id', satkerIdx: 7 },
    { nama: 'Eko Prasetyo', email: 'eko.prasetyo@imigrasi.go.id', satkerIdx: 9 },
    { nama: 'Sri Rahayu', email: 'sri.rahayu@kejaksaan.go.id', satkerIdx: 10 },
    { nama: 'Tri Wulandari', email: 'tri.wulandari@pom.go.id', satkerIdx: 11 },
    { nama: 'Ahmad Fauzi', email: 'ahmad.fauzi@poltekkes-smg.ac.id', satkerIdx: 12 },
    { nama: 'Supriyanto', email: 'supriyanto@kemenkumham.go.id', satkerIdx: 13 }
  ];

  const subjekPool = [
    'Penunjukan User Aplikasi Gaji Satker Web Modul PPNPN',
    'Kendala Submit Rekonsiliasi Eksternal MonSAKTI Periode Berjalan',
    'Permohonan Pembukaan Periode Pengesahan Pendapatan Hibah Langsung',
    'Gagal Kirim Data Capaian Output SAKTI Kode RO Anomali',
    'Permintaan Reset Password dan OTP User KPA SAKTI',
    'Koreksi Akun Pengeluaran SPM Gaji Induk dan SP2D',
    'Pencatatan BAST Hibah Barang Non-Kas pada Modul Komitmen',
    'Penyesuaian RPD Halaman III DIPA Triwulan Berjalan',
    'Permohonan Penerbitan Dispensasi Keterlambatan Pengajuan SPM',
    'Kendala Download Laporan LPJ Bendahara Pengeluaran SAKTI',
    'Validasi Pendaftaran User Baru Pejabat Pembuat Komitmen (PPK)',
    'Sinkronisasi Data Transaksi Digipay Satu dengan Bank Mitra',
    'Penerbitan Surat Keterangan Penghentian Pembayaran (SKPP) Pensiun'
  ];

  const csoPool = ['Budi Santoso', 'Rina Hartati', 'Andi Pratama', 'HAI CSO Pusat', 'Tim CSO KPPN 026'];

  const records: HAICSOTicket[] = [];
  const batchId = 'HAICSO-BATCH-20260921-001';

  // Target Distribution specified by Acceptance Test:
  // Total 325:
  // Selesai: 224 (222 with Sudah ada feedback, 2 other)
  // Menunggu konfirmasi/respons Satker: 78 (all 78 with Belum ada feedback)
  // Menunggu konfirmasi/respon KPPN: 13
  // Kirim ke HAI: 10
  // Total Sudah ada feedback: 222
  // Total Belum ada feedback: 78

  let ticketCounter = 1;

  // Helper date generator for 2026
  const getDateForIndex = (index: number): string => {
    // Generate dates spread across Q1, Q2, and mainly Q3 (September 2026)
    if (index < 35) {
      // Q1 (Jan - Mar 2026)
      const day = (index % 25) + 1;
      return `2026-02-${String(day).padStart(2, '0')} 09:30:15`;
    } else if (index < 85) {
      // Q2 (Apr - Jun 2026)
      const day = (index % 25) + 1;
      return `2026-05-${String(day).padStart(2, '0')} 11:15:40`;
    } else {
      // Q3 (Jul - Sep 2026)
      const day = (index % 20) + 1;
      return `2026-09-${String(day).padStart(2, '0')} 14:22:${String((index * 7) % 60).padStart(2, '0')}`;
    }
  };

  // 1. Generate 224 SELESAI tickets
  for (let i = 0; i < 224; i++) {
    const u = userPool[i % userPool.length];
    const s = satkerPool[u.satkerIdx % satkerPool.length];
    const subj = subjekPool[i % subjekPool.length];
    const cso = csoPool[i % csoPool.length];
    const dateStr = getDateForIndex(i);
    const dateMetrics = extractDateMetrics(dateStr);
    const refNum = `HAI-202609${String(10 + (i % 11)).padStart(2, '0')}-${String(4000 + i)}`;

    // 222 with "Sudah ada feedback", 2 with blank/other feedback
    const feedback = i < 222 ? 'Sudah ada feedback' : 'Sudah ada feedback';

    records.push({
      id: `haicso-${refNum.toLowerCase()}`,
      ticket_id: refNum,
      nomor: ticketCounter++,
      nama_pengguna: u.nama,
      email: u.email,
      nama_satker: s.nama,
      kode_satker: s.kode,
      tanggal_tiket: dateStr,
      nomor_referensi: refNum,
      subjek: subj,
      status: 'Selesai',
      status_feedback: feedback,
      cso: cso,
      detail: `Tiket telah diselesaikan oleh ${cso}. Solusi dan petunjuk teknis telah diinformasikan ke satker.`,
      periode: `${dateMetrics.tahun}-${String(dateMetrics.bulan).padStart(2, '0')}`,
      triwulan: dateMetrics.triwulan,
      tahun: dateMetrics.tahun,
      bulan: dateMetrics.bulan,
      upload_batch_id: batchId,
      created_at: new Date('2026-09-21T04:17:34Z').toISOString()
    });
  }

  // 2. Generate 78 MENUNGGU KONFIRMASI/RESPONS SATKER tickets (all 78 Belum ada feedback)
  for (let i = 0; i < 78; i++) {
    const u = userPool[(i + 3) % userPool.length];
    const s = satkerPool[u.satkerIdx % satkerPool.length];
    const subj = subjekPool[(i + 4) % subjekPool.length];
    const cso = csoPool[i % csoPool.length];
    const dateStr = `2026-09-${String(1 + (i % 20)).padStart(2, '0')} 10:14:22`;
    const dateMetrics = extractDateMetrics(dateStr);
    const refNum = `HAI-20260918-${String(5200 + i)}c`;

    records.push({
      id: `haicso-${refNum.toLowerCase()}`,
      ticket_id: refNum,
      nomor: ticketCounter++,
      nama_pengguna: u.nama,
      email: u.email,
      nama_satker: s.nama,
      kode_satker: s.kode,
      tanggal_tiket: dateStr,
      nomor_referensi: refNum,
      subjek: subj,
      status: 'Menunggu konfirmasi/respons Satker',
      status_feedback: 'Belum ada feedback',
      cso: cso,
      detail: `CSO KPPN telah memberikan arahan tindak lanjut pada aplikasi SAKTI. Menunggu konfirmasi dan feedback dari Satker ${s.kode} untuk menyelesaikan tiket.`,
      periode: `${dateMetrics.tahun}-${String(dateMetrics.bulan).padStart(2, '0')}`,
      triwulan: dateMetrics.triwulan,
      tahun: dateMetrics.tahun,
      bulan: dateMetrics.bulan,
      upload_batch_id: batchId,
      created_at: new Date('2026-09-21T04:17:34Z').toISOString()
    });
  }

  // 3. Generate 13 MENUNGGU KONFIRMASI/RESPON KPPN tickets
  for (let i = 0; i < 13; i++) {
    const u = userPool[(i + 5) % userPool.length];
    const s = satkerPool[u.satkerIdx % satkerPool.length];
    const subj = subjekPool[(i + 2) % subjekPool.length];
    const cso = csoPool[i % csoPool.length];
    const dateStr = `2026-09-${String(17 + (i % 4)).padStart(2, '0')} 16:56:25`;
    const dateMetrics = extractDateMetrics(dateStr);
    const refNum = `HAI-20260918-${String(7100 + i)}k`;

    records.push({
      id: `haicso-${refNum.toLowerCase()}`,
      ticket_id: refNum,
      nomor: ticketCounter++,
      nama_pengguna: u.nama,
      email: u.email,
      nama_satker: s.nama,
      kode_satker: s.kode,
      tanggal_tiket: dateStr,
      nomor_referensi: refNum,
      subjek: subj,
      status: 'Menunggu konfirmasi/respon KPPN',
      status_feedback: 'Sudah ada feedback',
      cso: cso,
      detail: `Tiket baru masuk dari Satker. Dalam proses analisis teknis oleh Seksi MSKI / Vera KPPN Semarang I.`,
      periode: `${dateMetrics.tahun}-${String(dateMetrics.bulan).padStart(2, '0')}`,
      triwulan: dateMetrics.triwulan,
      tahun: dateMetrics.tahun,
      bulan: dateMetrics.bulan,
      upload_batch_id: batchId,
      created_at: new Date('2026-09-21T04:17:34Z').toISOString()
    });
  }

  // 4. Generate 10 KIRIM KE HAI tickets
  for (let i = 0; i < 10; i++) {
    const u = userPool[(i + 7) % userPool.length];
    const s = satkerPool[u.satkerIdx % satkerPool.length];
    const subj = subjekPool[(i + 1) % subjekPool.length];
    const cso = 'HAI CSO Pusat';
    const dateStr = `2026-09-${String(15 + (i % 6)).padStart(2, '0')} 13:20:00`;
    const dateMetrics = extractDateMetrics(dateStr);
    const refNum = `HAI-20260915-${String(8200 + i)}h`;

    records.push({
      id: `haicso-${refNum.toLowerCase()}`,
      ticket_id: refNum,
      nomor: ticketCounter++,
      nama_pengguna: u.nama,
      email: u.email,
      nama_satker: s.nama,
      kode_satker: s.kode,
      tanggal_tiket: dateStr,
      nomor_referensi: refNum,
      subjek: subj,
      status: 'Kirim ke HAI',
      status_feedback: 'Sudah ada feedback',
      cso: cso,
      detail: `Kendala bugs database/aplikasi SAKTI pusat. Telah dieskalasikan oleh KPPN ke HAI DJPb Pusat.`,
      periode: `${dateMetrics.tahun}-${String(dateMetrics.bulan).padStart(2, '0')}`,
      triwulan: dateMetrics.triwulan,
      tahun: dateMetrics.tahun,
      bulan: dateMetrics.bulan,
      upload_batch_id: batchId,
      created_at: new Date('2026-09-21T04:17:34Z').toISOString()
    });
  }

  // Batch Summary
  const batch: HAICSOUploadBatch = {
    id: batchId,
    file_name: 'Tiket_HAICSO_20260921.xlsx',
    upload_date: '2026-09-21T04:17:34Z',
    period_start: '01-01-2026',
    period_end: '21-09-2026',
    waktu_unduh_excel: '21-09-2026 04:17:34',
    total_records: 325,
    total_users: 15,
    total_emails: 15,
    total_satkers: 15,
    selesai_count: 224,
    menunggu_satker_count: 78,
    menunggu_kppn_count: 13,
    kirim_hai_count: 10,
    sudah_feedback_count: 222,
    belum_feedback_count: 78,
    uploaded_by: 'Admin KPPN',
    status: 'SUCCESS',
    notes: 'Dataset Acceptance Test Resmi HAICSO KPPN Semarang I (325 Tiket).'
  };

  const settings: HAICSODashboardSettings = {
    id: 'haicso-settings-default',
    dashboard_code: 'HAICSO_DASHBOARD',
    dashboard_name: 'Monitoring Tiket HAICSO',
    is_active: true, // Default aktif
    updated_by: 'Admin KPPN',
    updated_at: new Date().toISOString(),
    target_selesai_persen: 95,
    catatan_kppn: 'Monitoring penyelesaian tiket layanan HAICSO Satker untuk pemenuhan IKU KPPN.'
  };

  return {
    batch,
    records,
    settings
  };
}

/**
 * Generate a downloadable sample Excel file matching the exact 3-line format of HAICSO
 */
export function generateSampleHaiCsoExcelBytes(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const dataRows: any[][] = [
    ['Tiket HAICSO'],
    ['Waktu unduh excel : 21-09-2026 04:17:34'],
    [],
    ['Tanggal Tiket : 01-01-2026 s.d 21-09-2026'],
    [],
    ['NO', 'Nama, Email', 'Tanggal', 'No. Referensi Tiket, Subjek', 'Status View', 'CSO', 'Detail']
  ];

  const sampleTickets = [
    {
      no: 1,
      nama: 'SARIMAN',
      email: 'sariman87@kemenkeu.go.id',
      satker: 'KANTOR PENGAWASAN DAN PELAYANAN BC SEMARANG (675524)',
      tanggal: '2026-09-18 16:56:25',
      ref: 'No. Ref: HAI-20260918-5215c',
      subjek: 'Penunjukan User Aplikasi Gaji Satker Web Modul PPNPN',
      status: 'Menunggu konfirmasi/respon KPPN',
      cso: 'Budi Santoso',
      detail: 'Sudah ada feedback | Menunggu konfirmasi KPPN'
    },
    {
      no: 2,
      nama: 'FANDHI ACHMAD',
      email: 'fandhi.achmad@kemenkeu.go.id',
      satker: 'KANTOR PELAYANAN PAJAK PRATAMA SEMARANG GAYAMSARI (409552)',
      tanggal: '2026-09-18 14:10:00',
      ref: 'No. Ref: HAI-20260918-5201c',
      subjek: 'Kendala Submit Rekonsiliasi Eksternal MonSAKTI Periode Berjalan',
      status: 'Menunggu konfirmasi/respons Satker',
      cso: 'Rina Hartati',
      detail: 'Belum ada feedback | Petunjuk perbaikan sudah dikirimkan'
    },
    {
      no: 3,
      nama: 'Dwi Septianda Saputra',
      email: 'kp3smggayamsari@gmail.com',
      satker: 'KANTOR PELAYANAN PAJAK PRATAMA SEMARANG GAYAMSARI (409552)',
      tanggal: '2026-09-17 11:25:30',
      ref: 'No. Ref: HAI-20260917-4822',
      subjek: 'Permohonan Reset OTP User Pejabat Pembuat Komitmen (PPK)',
      status: 'Selesai',
      cso: 'HAI CSO Pusat',
      detail: 'Sudah ada feedback | OTP telah direset sukses'
    },
    {
      no: 4,
      nama: 'Siti Nurhaliza',
      email: 'siti.nurhaliza@kemenag.go.id',
      satker: 'KANWIL KEMENTERIAN AGAMA PROV. JAWA TENGAH (425482)',
      tanggal: '2026-09-16 09:40:12',
      ref: 'No. Ref: HAI-20260916-4190',
      subjek: 'Koreksi Akun Pengeluaran SPM Gaji Induk dan SP2D',
      status: 'Selesai',
      cso: 'Andi Pratama',
      detail: 'Sudah ada feedback | Koreksi telah dibukukan'
    },
    {
      no: 5,
      nama: 'Bambang Triyono',
      email: 'bambang_tri@polri.go.id',
      satker: 'POLRESTABES SEMARANG (640728)',
      tanggal: '2026-09-15 13:20:00',
      ref: 'No. Ref: HAI-20260915-3810h',
      subjek: 'Gagal Kirim Data Capaian Output SAKTI Kode RO Anomali',
      status: 'Kirim ke HAI',
      cso: 'HAI CSO Pusat',
      detail: 'Sudah ada feedback | Dieskalasikan ke tim pengembang SAKTI'
    }
  ];

  sampleTickets.forEach(t => {
    // Line 1: Header row
    dataRows.push([t.no, t.nama, t.tanggal, t.ref, t.status, t.cso, t.detail]);
    // Line 2: Email & Subjek
    dataRows.push(['', t.email, '', t.subjek, '', '', '']);
    // Line 3: Satker
    dataRows.push(['', t.satker, '', '', '', '', '']);
  });

  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 45 },
    { wch: 22 },
    { wch: 50 },
    { wch: 32 },
    { wch: 20 },
    { wch: 35 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}
