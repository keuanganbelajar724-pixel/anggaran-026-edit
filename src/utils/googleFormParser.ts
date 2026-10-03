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
 * Converts any Google Sheets URL (edit, share, pubhtml) into a direct CSV export URL
 */
export function convertToGoogleSheetCsvUrl(rawUrl: string): string {
  const url = rawUrl.trim();
  if (!url) return '';

  // Case 1: Already a direct CSV link or pub output=csv
  if (url.includes('format=csv') || url.includes('output=csv')) {
    return url;
  }

  // Case 2: Standard Google Sheets URL (https://docs.google.com/spreadsheets/d/{ID}/edit#gid=0 or ?usp=sharing)
  const docIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (docIdMatch && docIdMatch[1]) {
    const docId = docIdMatch[1];
    
    // Check if there is a gid parameter (sheet index)
    const gidMatch = url.match(/gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '&gid=0';

    // If published URL: /spreadsheets/d/e/{ID}/pubhtml
    if (url.includes('/spreadsheets/d/e/')) {
      return `https://docs.google.com/spreadsheets/d/e/${docId}/pub?output=csv`;
    }

    return `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv${gidParam}`;
  }

  return url;
}

/**
 * Fetches Google Sheets CSV data safely via backend proxy or direct fetch
 */
export async function fetchGoogleSheetCsvData(rawUrl: string): Promise<string> {
  const csvUrl = convertToGoogleSheetCsvUrl(rawUrl);
  if (!csvUrl) {
    throw new Error('URL Google Sheets tidak valid.');
  }

  // Try fetching via backend proxy to bypass CORS
  try {
    const proxyUrl = `/api/proxy/google-sheet?url=${encodeURIComponent(csvUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 10) {
        return text;
      }
    }
  } catch (proxyErr) {
    console.warn('[GoogleFormParser] Proxy fetch failed, attempting direct fetch:', proxyErr);
  }

  // Direct fetch fallback
  try {
    const directRes = await fetch(csvUrl);
    if (!directRes.ok) {
      throw new Error(`Google Sheets mengembalikan HTTP ${directRes.status}: ${directRes.statusText}`);
    }
    const text = await directRes.text();
    if (!text || text.trim().length < 10) {
      throw new Error('Spreadsheet kosong atau tidak memiliki baris data.');
    }
    return text;
  } catch (directErr: any) {
    throw new Error(
      `Gagal mengambil data dari Google Sheets. Pastikan dokumen sudah disetel ke "Siapa saja dengan link dapat melihat" (Anyone with the link can view) atau gunakan fitur "File > Bagikan > Publikasikan ke Web > format CSV". Detail: ${directErr?.message || directErr}`
    );
  }
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
 * Official Standard Government Templates (Ditjen Perbendaharaan & Permenpan-RB)
 */
export const OFFICIAL_GOVERNMENT_TEMPLATES: Array<{
  id: string;
  name: string;
  badge: string;
  category: any;
  description: string;
  isOfficialSkm?: boolean;
  fields: any[];
}> = [
  {
    id: 'tpl_skm_permenpan',
    name: 'Survei Kepuasan Masyarakat (SKM) Standar Permenpan RB No. 14/2017',
    badge: 'Resmi Kemenkeu & Kemenpan-RB',
    category: 'SURVEI_LAYANAN',
    isOfficialSkm: true,
    description: 'Format kuesioner resmi 9 Unsur Pelayanan Publik (Persyaratan, Prosedur, Waktu, Biaya, Produk Spesifikasi, Kompetensi, Perilaku Petugas, Sarpras, Pengaduan) dengan kalkulasi Nilai IKM & Konversi Mutu Pelayanan (A/B/C/D).',
    fields: [
      {
        id: 'u1_persyaratan',
        type: 'RATING',
        label: '1. Kesesuaian Persyaratan Pelayanan Pencairan SP2D / Konsultasi',
        description: 'Kemudahan dan kesesuaian persyaratan yang diwajibkan KPPN',
        required: true,
        minRating: 1,
        maxRating: 5,
        minRatingLabel: '1 (Sangat Rumit)',
        maxRatingLabel: '5 (Sangat Sesuai/Mudah)'
      },
      {
        id: 'u2_prosedur',
        type: 'RATING',
        label: '2. Kemudahan Prosedur & Alur Pelayanan (Online & Tatap Muka)',
        description: 'Kejelasan alur tahapan pengajuan dokumen dan respon helpdesk',
        required: true,
        minRating: 1,
        maxRating: 5,
        minRatingLabel: '1 (Sangat Berbelit)',
        maxRatingLabel: '5 (Sangat Mudah/Jelas)'
      },
      {
        id: 'u3_kecepatan',
        type: 'RATING',
        label: '3. Kecepatan Waktu Penyelesaian Layanan & Penerbitan SP2D',
        description: 'Ketepatan norma waktu (SLA 1 jam / hari yang sama)',
        required: true,
        minRating: 1,
        maxRating: 5,
        minRatingLabel: '1 (Sangat Lambat)',
        maxRatingLabel: '5 (Sangat Cepat)'
      },
      {
        id: 'u4_biaya',
        type: 'RATING',
        label: '4. Kepastian Bebas Biaya (Biaya/Tarif Rp0 - Tanpa Pungutan)',
        description: 'Seluruh pelayanan perbendaharaan diberikan tanpa dipungut biaya',
        required: true,
        minRating: 1,
        maxRating: 5,
        minRatingLabel: '1 (Ada Pungutan)',
        maxRatingLabel: '5 (Pasti Bebas Biaya)'
      },
      {
        id: 'u5_produk',
        type: 'RATING',
        label: '5. Kesesuaian Produk Pelayanan (SP2D, SKPP, LPJ, Pengesahan)',
        description: 'Akurasi dan kepastian hasil keluaran yang diterbitkan KPPN',
        required: true,
        minRating: 1,
        maxRating: 5,
        minRatingLabel: '1 (Tidak Sesuai)',
        maxRatingLabel: '5 (Sangat Tepat/Akurat)'
      },
      {
        id: 'u6_kompetensi',
        type: 'RATING',
        label: '6. Kompetensi & Pemahaman Regulasi Petugas Layanan / CSO KPPN',
        description: 'Kemampuan petugas dalam menyelesaikan kendala satker',
        required: true,
        minRating: 1,
        maxRating: 5,
        minRatingLabel: '1 (Kurang Cakap)',
        maxRatingLabel: '5 (Sangat Kompeten)'
      },
      {
        id: 'u7_perilaku',
        type: 'RATING',
        label: '7. Perilaku, Kesopanan, dan Keramahan Petugas Pelayanan',
        description: 'Sikap melayani dengan ramah, adil, sopan, dan solutif',
        required: true,
        minRating: 1,
        maxRating: 5,
        minRatingLabel: '1 (Kurang Sopan)',
        maxRatingLabel: '5 (Sangat Ramah & Sopan)'
      },
      {
        id: 'u8_sarpras',
        type: 'RATING',
        label: '8. Kualitas Sarana, Prasarana & Kenyamanan Front Office / Online',
        description: 'Kenyamanan ruang tunggu CSO, sistem antrean, dan website ANGKASA',
        required: true,
        minRating: 1,
        maxRating: 5,
        minRatingLabel: '1 (Kurang Memadai)',
        maxRatingLabel: '5 (Sangat Nyaman/Lengkap)'
      },
      {
        id: 'u9_pengaduan',
        type: 'RATING',
        label: '9. Penanganan Konsultasi, Pengaduan, dan Respon Saran Satker',
        description: 'Kecepatan dan kejelasan respon bila satker menyampaikan keluhan',
        required: true,
        minRating: 1,
        maxRating: 5,
        minRatingLabel: '1 (Lambat/Tidak Tuntas)',
        maxRatingLabel: '5 (Sangat Cepat & Tuntas)'
      },
      {
        id: 'u10_saran',
        type: 'PARAGRAPH',
        label: 'Kritik, Saran, dan Harapan Peningkatan Mutu Pelayanan KPPN',
        description: 'Masukan konstruktif untuk evaluasi manajemen perbendaharaan',
        required: false,
        placeholder: 'Tuliskan masukan atau apresiasi Anda untuk KPPN Semarang I...'
      }
    ]
  },
  {
    id: 'tpl_spak_wbk',
    name: 'Survei Persepsi Anti-Korupsi (SPAK) & Integritas Zona WBK/WBBM',
    badge: 'Penilaian WBBM / ZI',
    category: 'SURVEI_LAYANAN',
    description: 'Instrumen survei penguatan Zona Integritas KPPN untuk memastikan zero gratifikasi, tidak ada diskriminasi, tidak ada calo, dan integritas penuh.',
    fields: [
      {
        id: 'spak_1',
        type: 'YES_NO',
        label: 'Apakah Anda pernah diminta imbalan, uang lelah, atau hadiah dalam pengurusan dokumen di KPPN?',
        required: true
      },
      {
        id: 'spak_2',
        type: 'YES_NO',
        label: 'Apakah petugas KPPN menolak dengan tegas pemberian bingkisan/hadiah/gratifikasi dari satker?',
        required: true
      },
      {
        id: 'spak_3',
        type: 'RATING',
        label: 'Tingkat Transparansi Informasi Informasi Antrean dan Status Pencairan Dana SP2D',
        description: 'Skala 1 (Tertutup) s.d 5 (Sangat Terbuka & Real-Time)',
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: 'spak_4',
        type: 'MULTIPLE_CHOICE',
        label: 'Kanal Saluran Pengaduan Dugaan Pelanggaran / Gratifikasi yang Anda Ketahui',
        required: true,
        options: [
          { id: 'c1', label: 'WISE Kemenkeu (wise.kemenkeu.go.id)' },
          { id: 'c2', label: 'SIPANDU Ditjen Perbendaharaan' },
          { id: 'c3', label: 'SPAN-LAPOR!' },
          { id: 'c4', label: 'Helpdesk Khusus Pengaduan KPPN' }
        ]
      },
      {
        id: 'spak_feedback',
        type: 'PARAGRAPH',
        label: 'Pernyataan / Testimoni Terkait Integritas Layanan KPPN Semarang I',
        required: false
      }
    ]
  },
  {
    id: 'tpl_bimtek_sakti',
    name: 'Evaluasi Bimbingan Teknis (Bimtek) & Sosialisasi SAKTI / IKPA',
    badge: 'Edukasi Satker',
    category: 'EVALUASI_IKPA',
    description: 'Format kuesioner evaluasi pasca-bimbingan teknis perbendaharaan untuk mengukur efektivitas narasumber, materi, dan pemahaman satker.',
    fields: [
      {
        id: 'bt_materi',
        type: 'RATING',
        label: 'Relevansi & Manfaat Materi Bimtek Terhadap Tugas Perbendaharaan Satker',
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: 'bt_narasumber',
        type: 'RATING',
        label: 'Penguasaan Materi dan Kejelasan Penyampaian Oleh Narasumber KPPN',
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: 'bt_fasilitas',
        type: 'RATING',
        label: 'Kualitas Media Pelaksanaan (Ruang Aula / Zoom Online & Audio Visual)',
        required: true,
        minRating: 1,
        maxRating: 5
      },
      {
        id: 'bt_duration',
        type: 'MULTIPLE_CHOICE',
        label: 'Kesesuaian Durasi Waktu Pemaparan dan Sesi Tanya Jawab',
        required: true,
        options: [
          { id: 'bto1', label: 'Sangat Cukup dan Pas' },
          { id: 'bto2', label: 'Kurang Lama pada Sesi Praktik/Simulasi' },
          { id: 'bto3', label: 'Terlalu Panjang' }
        ]
      },
      {
        id: 'bt_topik_lanjutan',
        type: 'PARAGRAPH',
        label: 'Topik Materi / Modul SAKTI Apa yang Paling Anda Butuhkan untuk Bimtek Berikutnya?',
        required: false
      }
    ]
  }
];

/**
 * Heuristic Sentiment & Word Frequency Analysis for Feedback Text
 */
export function extractFeedbackSentiments(textList: string[]): {
  positiveCount: number;
  constructiveCount: number;
  topKeywords: Array<{ word: string; count: number }>;
} {
  const positiveWords = ['baik', 'bagus', 'cepat', 'ramah', 'puas', 'mantap', 'terbantu', 'profesional', 'jelas', 'inovatif', 'hebat', 'terima kasih', 'sopan', 'sempurna', 'keren', 'mudah'];
  const constructiveWords = ['mohon', 'perlu', 'kurang', 'tingkatkan', 'lambat', 'kendala', 'antre', 'antrian', 'server', 'error', 'tolong', 'sulit', 'ditambah', 'perbaiki'];
  const stopWords = new Set(['dan', 'yang', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'ini', 'itu', 'adalah', 'kppn', 'satker', 'saya', 'kami', 'bisa', 'akan', 'agar', 'juga', 'sudah', 'lebih', 'semarang', 'pelayanan', 'layanan']);

  let positiveCount = 0;
  let constructiveCount = 0;
  const wordFrequency: Record<string, number> = {};

  textList.forEach(raw => {
    const lower = raw.toLowerCase();
    let isPos = false;
    let isConst = false;

    positiveWords.forEach(pw => {
      if (lower.includes(pw)) isPos = true;
    });
    constructiveWords.forEach(cw => {
      if (lower.includes(cw)) isConst = true;
    });

    if (isPos && !isConst) positiveCount++;
    else if (isConst) constructiveCount++;
    else if (isPos) positiveCount++;

    // Tokenize
    const tokens = lower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
    tokens.forEach(tok => {
      if (tok.length >= 4 && !stopWords.has(tok)) {
        wordFrequency[tok] = (wordFrequency[tok] || 0) + 1;
      }
    });
  });

  const topKeywords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return {
    positiveCount,
    constructiveCount,
    topKeywords
  };
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
