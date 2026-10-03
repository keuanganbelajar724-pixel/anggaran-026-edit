import * as XLSX from 'xlsx';
import { KppnForm, FormField, FormFieldType, FormResponseRecord, FormAnswer } from '../types/form';

export interface GoogleFormParseResult {
  form: KppnForm;
  responses: FormResponseRecord[];
  summary: {
    totalRows: number;
    detectedQuestionsCount: number;
    detectedSatkersCount: number;
    filename?: string;
  };
}

/**
 * Heuristic detector for question field types based on sample values
 */
export function detectFieldTypeFromValues(values: any[]): { type: FormFieldType; options?: { id: string; label: string }[] } {
  const cleanValues = values
    .map(v => (v !== undefined && v !== null ? String(v).trim() : ''))
    .filter(v => v !== '');

  if (cleanValues.length === 0) {
    return { type: 'SHORT_TEXT' };
  }

  // 1. Check YES_NO (contains only 'Ya' and 'Tidak', or 'Yes' and 'No')
  const lowerVals = cleanValues.map(v => v.toLowerCase());
  const isYesNo = lowerVals.every(v => v === 'ya' || v === 'tidak' || v === 'yes' || v === 'no');
  if (isYesNo) {
    return { type: 'YES_NO' };
  }

  // 2. Check RATING (all are numbers between 1 and 5)
  const isRatingNumeric = cleanValues.every(v => {
    const num = Number(v);
    return !isNaN(num) && num >= 1 && num <= 5 && Number.isInteger(num);
  });
  if (isRatingNumeric && cleanValues.length > 0) {
    return { type: 'RATING' };
  }

  // 3. Check Rating with Indonesian text Likert scale (Sangat Puas, Puas, Cukup, Kurang, Tidak Puas)
  const likertKeywords = ['sangat puas', 'puas', 'cukup puas', 'kurang puas', 'tidak puas', 'sangat baik', 'baik', 'cukup', 'kurang', 'buruk', 'sangat setuju', 'setuju', 'ragu-ragu', 'tidak setuju'];
  const isLikertScale = cleanValues.every(v => likertKeywords.some(k => v.toLowerCase().includes(k)));
  if (isLikertScale) {
    // Collect distinct unique options
    const unique = Array.from(new Set(cleanValues));
    return {
      type: 'MULTIPLE_CHOICE',
      options: unique.map((opt, i) => ({ id: `opt_${i + 1}`, label: opt }))
    };
  }

  // 4. Check MULTIPLE CHOICE (distinct values count is small <= 12 and max string length <= 80)
  const uniqueVals = Array.from(new Set(cleanValues));
  const maxLen = Math.max(...cleanValues.map(v => v.length));
  if (uniqueVals.length <= 10 && maxLen <= 80 && cleanValues.length >= 2) {
    return {
      type: 'MULTIPLE_CHOICE',
      options: uniqueVals.map((opt, i) => ({ id: `opt_${i + 1}`, label: opt }))
    };
  }

  // 5. Check PARAGRAPH vs SHORT TEXT
  if (maxLen > 80) {
    return { type: 'PARAGRAPH' };
  }

  return { type: 'SHORT_TEXT' };
}

/**
 * Parses Google Form Responses Excel (.xlsx, .xls) or CSV
 */
export async function parseGoogleFormFile(file: File): Promise<GoogleFormParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  return parseGoogleFormRawMatrix(rawJson, file.name);
}

/**
 * Parses Tab-Delimited / CSV text pasted from Google Sheets
 */
export function parseGoogleFormPastedText(text: string, title?: string): GoogleFormParseResult {
  const lines = text.trim().split('\n').map(line => {
    // If contains tabs, split by tab; else check comma
    if (line.includes('\t')) {
      return line.split('\t').map(c => c.trim().replace(/^"(.*)"$/, '$1'));
    }
    // Fallback comma split
    return line.split(',').map(c => c.trim().replace(/^"(.*)"$/, '$1'));
  });

  return parseGoogleFormRawMatrix(lines, title || 'Import Google Form Spreadsheet');
}

/**
 * Core Parser: Takes 2D array of rows from Google Forms
 */
export function parseGoogleFormRawMatrix(matrix: any[][], sourceName: string): GoogleFormParseResult {
  if (!matrix || matrix.length < 2) {
    throw new Error('Data Google Form tidak valid atau kosong. Minimal harus ada 1 baris judul kolom dan 1 baris jawaban.');
  }

  const headerRow = matrix[0].map(h => String(h || '').trim());
  const dataRows = matrix.slice(1).filter(row => row.some(cell => String(cell || '').trim() !== ''));

  if (headerRow.length === 0 || dataRows.length === 0) {
    throw new Error('Tidak ada data baris yang ditemukan dalam spreadsheet.');
  }

  // Detect index of identity columns
  let timestampIdx = -1;
  let satkerNameIdx = -1;
  let satkerCodeIdx = -1;
  let respondentNameIdx = -1;
  let emailIdx = -1;
  let noHpIdx = -1;

  const questionIndices: number[] = [];

  headerRow.forEach((colName, idx) => {
    const lower = colName.toLowerCase();

    if (timestampIdx === -1 && (lower.includes('timestamp') || lower.includes('waktu') || lower.includes('tanggal') || lower.includes('date'))) {
      timestampIdx = idx;
    } else if (satkerCodeIdx === -1 && (lower.includes('kode satker') || lower === 'kdsatker')) {
      satkerCodeIdx = idx;
    } else if (satkerNameIdx === -1 && (lower.includes('nama satker') || lower.includes('satker') || lower.includes('instansi') || lower.includes('unit kerja'))) {
      satkerNameIdx = idx;
    } else if (respondentNameIdx === -1 && (lower.includes('nama responden') || lower.includes('nama lengkap') || lower === 'nama' || lower.includes('petugas'))) {
      respondentNameIdx = idx;
    } else if (emailIdx === -1 && (lower.includes('email') || lower.includes('surel'))) {
      emailIdx = idx;
    } else if (noHpIdx === -1 && (lower.includes('no. hp') || lower.includes('no hp') || lower.includes('telepon') || lower.includes('whatsapp') || lower.includes('wa'))) {
      noHpIdx = idx;
    } else if (colName.trim().length > 0) {
      // It is a survey question!
      questionIndices.push(idx);
    }
  });

  // If questionIndices is empty (e.g. headers didn't match), treat all non-timestamp columns as questions
  if (questionIndices.length === 0) {
    headerRow.forEach((col, idx) => {
      if (idx !== timestampIdx) questionIndices.push(idx);
    });
  }

  // Build Form Fields
  const fields: FormField[] = questionIndices.map((colIdx, qIdx) => {
    const label = headerRow[colIdx] || `Pertanyaan ${qIdx + 1}`;
    const columnValues = dataRows.map(r => r[colIdx]);
    const detected = detectFieldTypeFromValues(columnValues);

    const field: FormField = {
      id: `q_${qIdx + 1}_${Math.random().toString(36).substring(2, 7)}`,
      type: detected.type,
      label,
      required: true,
      options: detected.options
    };

    if (detected.type === 'RATING') {
      field.minRating = 1;
      field.maxRating = 5;
      field.minRatingLabel = '1 (Kurang)';
      field.maxRatingLabel = '5 (Sangat Baik)';
    }

    return field;
  });

  // Clean title from sourceName
  const cleanTitle = sourceName
    .replace(/\.(xlsx|xls|csv)$/i, '')
    .replace(/[-_]/g, ' ')
    .trim();

  const formId = `form_gform_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const form: KppnForm = {
    id: formId,
    title: cleanTitle.length > 5 ? cleanTitle : 'Hasil Google Form Terimport',
    description: `Formulir kuesioner yang diimpor secara otomatis dari file Google Form / Spreadsheet (${sourceName}). Dihasilkan ${dataRows.length} respon terverifikasi.`,
    category: 'SURVEI_LAYANAN',
    targetAudience: 'satker',
    isActive: true,
    isPublicStatsVisible: true,
    allowMultipleSubmissions: true,
    fields,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  // Build Response Records
  const uniqueSatkers = new Set<string>();

  const responses: FormResponseRecord[] = dataRows.map((row, rIdx) => {
    // Timestamp
    let submittedAt = nowIso;
    if (timestampIdx >= 0 && row[timestampIdx]) {
      const rawDate = row[timestampIdx];
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        submittedAt = parsedDate.toISOString();
      }
    }

    // Identity
    const satker = (satkerNameIdx >= 0 && row[satkerNameIdx]) ? String(row[satkerNameIdx]).trim() : `Satker Mitra ${rIdx + 1}`;
    const satkerKode = (satkerCodeIdx >= 0 && row[satkerCodeIdx]) ? String(row[satkerCodeIdx]).trim() : undefined;
    const respName = (respondentNameIdx >= 0 && row[respondentNameIdx]) ? String(row[respondentNameIdx]).trim() : `Responden ${rIdx + 1}`;
    const respEmail = (emailIdx >= 0 && row[emailIdx]) ? String(row[emailIdx]).trim() : undefined;
    const respNoHp = (noHpIdx >= 0 && row[noHpIdx]) ? String(row[noHpIdx]).trim() : undefined;

    if (satker) uniqueSatkers.add(satker);

    // Answers
    const answers: FormAnswer[] = fields.map((field, fIdx) => {
      const colIdx = questionIndices[fIdx];
      let val = row[colIdx];

      if (field.type === 'RATING') {
        const num = Number(val);
        val = !isNaN(num) && num >= 1 && num <= 5 ? num : 5;
      } else {
        val = val !== undefined && val !== null ? String(val).trim() : '-';
      }

      return {
        fieldId: field.id,
        fieldLabel: field.label,
        fieldType: field.type,
        value: val
      };
    });

    return {
      id: `resp_${formId}_${rIdx + 1}`,
      formId,
      formTitle: form.title,
      respondentName: respName,
      respondentSatker: satker,
      respondentSatkerKode: satkerKode,
      respondentEmail: respEmail,
      respondentNoHp: respNoHp,
      answers,
      submittedAt
    };
  });

  return {
    form,
    responses,
    summary: {
      totalRows: responses.length,
      detectedQuestionsCount: fields.length,
      detectedSatkersCount: uniqueSatkers.size,
      filename: sourceName
    }
  };
}
