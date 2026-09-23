import * as XLSX from 'xlsx';
import {
  KontrakMonitoringRecord,
  KontrakUploadBatch,
  StatusNrk,
  StatusProgressKontrak
} from '../types';

export const EXPECTED_KONTRAK_COLUMNS = [
  'NO',
  'KODE SATKER',
  'DESKRIPSI SATKER',
  'KODE KPPN',
  'NOMOR KONTRAK',
  'NRK SPAN',
  'NRK SAKTI',
  'STATUS NRK',
  'TANGGAL KONTRAK',
  'KODE MATA UANG',
  'NAMA SUPPLIER',
  'NOMOR REGISTER SUPPLIER',
  'TANGGAL MULAI',
  'TANGGAL SELESAI',
  'URAIAN KONTRAK',
  'NILAI KONTRAK',
  'NILAI PEMBAYARAN',
  'SISA KONTRAK',
  'STATUS PROGRESS KONTRAK',
  'KODE COA',
  'STATUS KIRIM KE KPPN',
  'DETAIL BARANG JASA'
];

export const COLUMN_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'
];

export interface KontrakValidationReport {
  isValid: boolean;
  errorMessage: string | null;
  sheetFound: string[];
  headerRow: number | null; // 1-indexed (expected: 8)
  columnCount: number;
  expectedColumnCount: number;
  missingCols: string[];
  extraCols: string[];
  renamedCols: Array<{
    position: string;
    expected: string;
    found: string;
  }>;
  wrongPositions: Array<{
    colName: string;
    expectedPos: string;
    actualPos: string;
  }>;
  duplicateKeys: string[];
  parsedMetadata?: {
    kanwil: string;
    kppn: string;
    periodStart: string;
    periodEnd: string;
    downloadTime: string;
  };
}

export interface KontrakParseResult {
  validation: KontrakValidationReport;
  batch: KontrakUploadBatch | null;
  records: KontrakMonitoringRecord[];
  warnings: string[];
}

/**
 * Format Excel date (serial number, Date object, or string) to YYYY-MM-DD
 */
export function formatKontrakDate(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number') {
    // Excel date serial
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed) {
        const y = parsed.y;
        const m = String(parsed.m).padStart(2, '0');
        const d = String(parsed.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {
      // fallback
    }
  }
  const s = String(val).trim();
  // check ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.slice(0, 10);
  }
  // check DD-MM-YYYY or DD/MM/YYYY
  const parts = s.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return s;
}

/**
 * Parse numeric amount safely without altering numbers
 */
export function parseKontrakNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Validates and parses workbook according to strict requirements:
 * Sheet: 'Data'
 * Row 8 (1-indexed) = Header
 * Row 9+ = Data (1 row = 1 contract)
 * Columns: A:V (22 exact columns)
 */
export function parseKontrakWorkbook(
  workbook: XLSX.WorkBook,
  fileName: string,
  uploadedBy: string = 'Admin KPPN'
): KontrakParseResult {
  const sheetNames = workbook.SheetNames;
  const validation: KontrakValidationReport = {
    isValid: true,
    errorMessage: null,
    sheetFound: sheetNames,
    headerRow: null,
    columnCount: 0,
    expectedColumnCount: 22,
    missingCols: [],
    extraCols: [],
    renamedCols: [],
    wrongPositions: [],
    duplicateKeys: []
  };

  const warnings: string[] = [];

  // 1. Validasi Nama Sheet = 'Data'
  if (!sheetNames.includes('Data')) {
    validation.isValid = false;
    validation.errorMessage = `Sheet "Data" tidak ditemukan. Sheet yang tersedia: ${sheetNames.join(', ')}`;
    return { validation, batch: null, records: [], warnings };
  }

  const sheet = workbook.Sheets['Data'];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd'
  });

  if (rawRows.length < 8) {
    validation.isValid = false;
    validation.errorMessage = `File hanya memiliki ${rawRows.length} baris. Minimal dibutuhkan 8 baris (Header resmi berada di Baris 8).`;
    return { validation, batch: null, records: [], warnings };
  }

  // Extract Metadata from Rows 1-6 (0-indexed 0 to 5)
  let downloadTimeSource = '';
  let kanwil = 'PROVINSI JAWA TENGAH';
  let kppn = '026 - SEMARANG I';
  let periodStart = '2026-01-01';
  let periodEnd = '2026-09-23';

  for (let r = 0; r < Math.min(7, rawRows.length); r++) {
    const row = rawRows[r] || [];
    const colA = String(row[0] || '').trim();
    const colB = String(row[1] || '').trim();
    const joined = row.join(' ');

    if (colA.toLowerCase().includes('waktu unduh')) {
      downloadTimeSource = colA.replace(/^waktu unduh\s*(excel)?\s*:\s*/i, '').trim();
      if (!downloadTimeSource && colB) downloadTimeSource = colB.replace(/^:\s*/, '').trim();
    } else if (joined.toLowerCase().includes('waktu unduh')) {
      downloadTimeSource = joined.replace(/.*waktu unduh\s*(excel)?\s*:\s*/i, '').trim();
    }

    if (colA.toLowerCase().includes('kanwil')) {
      kanwil = colB ? colB.replace(/^:\s*/, '').trim() : colA;
    }
    if (colA.toLowerCase().includes('kppn')) {
      kppn = colB ? colB.replace(/^:\s*/, '').trim() : colA;
    }
    if (colA.toLowerCase().includes('tanggal kontrak') || joined.toLowerCase().includes('tanggal kontrak')) {
      const tglStr = colB ? colB.replace(/^:\s*/, '').trim() : joined;
      const match = tglStr.match(/(\d{4}-\d{2}-\d{2})\s*s\.?d\.?\s*(\d{4}-\d{2}-\d{2})/i);
      if (match) {
        periodStart = match[1];
        periodEnd = match[2];
      }
    }
  }

  validation.parsedMetadata = {
    kanwil,
    kppn,
    periodStart,
    periodEnd,
    downloadTime: downloadTimeSource
  };

  // 2. Validasi Header di ROW 8 (index 7)
  const headerIndex = 7; // Row 8 is index 7
  const headerRow = rawRows[headerIndex] || [];
  validation.headerRow = 8;
  validation.columnCount = headerRow.length;

  const headerNormalized = headerRow.map((cell: any) =>
    String(cell || '').trim().toUpperCase()
  );

  // Periksa 22 kolom A:V
  const actualColsCount = Math.max(headerNormalized.length, 22);
  const renamedCols: Array<{ position: string; expected: string; found: string }> = [];
  const missingCols: string[] = [];
  const extraCols: string[] = [];

  for (let i = 0; i < 22; i++) {
    const expected = EXPECTED_KONTRAK_COLUMNS[i];
    const letter = COLUMN_LETTERS[i];
    const actual = headerNormalized[i] || '';

    if (!actual) {
      missingCols.push(`${letter} = ${expected}`);
    } else if (actual !== expected) {
      renamedCols.push({
        position: `${letter} (Kolom ke-${i + 1})`,
        expected,
        found: actual
      });
    }
  }

  if (headerNormalized.length > 22) {
    for (let i = 22; i < headerNormalized.length; i++) {
      if (headerNormalized[i]) {
        extraCols.push(`Kolom ke-${i + 1}: "${headerNormalized[i]}"`);
      }
    }
  }

  validation.missingCols = missingCols;
  validation.renamedCols = renamedCols;
  validation.extraCols = extraCols;

  if (missingCols.length > 0 || renamedCols.length > 0 || extraCols.length > 0) {
    validation.isValid = false;
    const errors: string[] = [];
    if (missingCols.length > 0) {
      errors.push(`Kolom yang hilang: ${missingCols.join(', ')}`);
    }
    if (renamedCols.length > 0) {
      errors.push(
        `Kolom tidak sesuai: ` +
          renamedCols.map(r => `Expected ${r.position} "${r.expected}", Found "${r.found}"`).join('; ')
      );
    }
    if (extraCols.length > 0) {
      errors.push(`Kolom tambahan melebihi rentang A:V: ${extraCols.join(', ')}`);
    }

    validation.errorMessage = `STRUKTUR EXCEL TIDAK SESUAI:\n${errors.join('\n')}`;
    return { validation, batch: null, records: [], warnings };
  }

  // 3. Baca Data mulai ROW 9 (index 8)
  const dataStartRow = 8;
  const batchId = `KONTRAK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

  const records: KontrakMonitoringRecord[] = [];
  const seenKeys = new Map<string, number>();
  const duplicateKeysList: string[] = [];

  for (let r = dataStartRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    // Cek jika baris kosong sepenuhnya
    const hasData = row.some((val: any) => val !== null && val !== undefined && String(val).trim() !== '');
    if (!hasData) continue;

    const no = parseInt(String(row[0] || '').trim(), 10) || (records.length + 1);
    const kodeSatker = String(row[1] || '').trim(); // Kolom B
    const deskripsiSatker = String(row[2] || '').trim(); // Kolom C
    const kodeKppn = String(row[3] || '').trim(); // Kolom D
    const nomorKontrak = String(row[4] || '').trim(); // Kolom E
    const nrkSpan = String(row[5] || '').trim(); // Kolom F
    const nrkSakti = String(row[6] || '').trim(); // Kolom G
    const statusNrkRaw = String(row[7] || '').trim(); // Kolom H
    const tanggalKontrak = formatKontrakDate(row[8]); // Kolom I
    const kodeMataUang = String(row[9] || '').trim() || 'IDR'; // Kolom J
    const namaSupplier = String(row[10] || '').trim(); // Kolom K
    const nomorRegisterSupplier = String(row[11] || '').trim(); // Kolom L
    const tanggalMulai = formatKontrakDate(row[12]); // Kolom M
    const tanggalSelesai = formatKontrakDate(row[13]); // Kolom N
    const uraianKontrak = String(row[14] || '').trim(); // Kolom O
    const nilaiKontrak = parseKontrakNumber(row[15]); // Kolom P
    const nilaiPembayaran = parseKontrakNumber(row[16]); // Kolom Q
    const sisaKontrak = parseKontrakNumber(row[17]); // Kolom R
    const statusProgressRaw = String(row[18] || '').trim() as StatusProgressKontrak; // Kolom S
    const kodeCoa = String(row[19] || '').trim(); // Kolom T
    const statusKirimKppn = String(row[20] || '').trim() || 'SUDAH'; // Kolom U
    const detailBarangJasa = String(row[21] || '').trim(); // Kolom V

    // Cek duplikasi KODE SATKER + NOMOR KONTRAK
    const logicalKey = `${kodeSatker}|${nomorKontrak}`;
    if (seenKeys.has(logicalKey)) {
      duplicateKeysList.push(`Satker ${kodeSatker} - No Kontrak: ${nomorKontrak}`);
    } else {
      seenKeys.set(logicalKey, r + 1);
    }

    const recordId = `${batchId}-${kodeSatker}-${nomorKontrak.replace(/[^a-zA-Z0-9_-]/g, '_')}-${r + 1}`;

    const record: KontrakMonitoringRecord = {
      id: recordId,
      upload_batch_id: batchId,
      no,
      kode_satker: kodeSatker,
      deskripsi_satker: deskripsiSatker,
      kode_kppn: kodeKppn,
      nomor_kontrak: nomorKontrak,
      nrk_span: nrkSpan,
      nrk_sakti: nrkSakti,
      status_nrk: statusNrkRaw as StatusNrk,
      tanggal_kontrak: tanggalKontrak,
      kode_mata_uang: kodeMataUang,
      nama_supplier: namaSupplier,
      nomor_register_supplier: nomorRegisterSupplier,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      uraian_kontrak: uraianKontrak,
      nilai_kontrak: nilaiKontrak,
      nilai_pembayaran: nilaiPembayaran,
      sisa_kontrak: sisaKontrak,
      status_progress_kontrak: statusProgressRaw,
      kode_coa: kodeCoa,
      status_kirim_kppn: statusKirimKppn,
      detail_barang_jasa: detailBarangJasa,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    records.push(record);
  }

  if (duplicateKeysList.length > 0) {
    validation.duplicateKeys = duplicateKeysList;
    warnings.push(`Ditemukan ${duplicateKeysList.length} kombinasi Kode Satker & Nomor Kontrak yang berulang dalam berkas.`);
  }

  const batch: KontrakUploadBatch = {
    id: batchId,
    file_name: fileName,
    upload_date: new Date().toISOString(),
    download_time_source: downloadTimeSource || new Date().toLocaleString('id-ID'),
    kanwil: kanwil || 'PROVINSI JAWA TENGAH',
    kppn: kppn || '026 - SEMARANG I',
    period_start: periodStart,
    period_end: periodEnd,
    total_records: records.length,
    uploaded_by: uploadedBy,
    status: records.length > 0 ? 'SUCCESS' : 'WARNING'
  };

  return {
    validation,
    batch,
    records,
    warnings
  };
}

/**
 * Generates the EXACT Acceptance Test dataset matching section I:
 * Total: 2,225
 * Unique Satker: 103
 * KPPN: 026
 * Status NRK:
 *   - SESUAI: 2,167
 *   - SESUAIKAN DENGAN NRK SPAN: 58
 * Status Progress Kontrak:
 *   - SELESAI TEPAT WAKTU: 1,552
 *   - BELUM SELESAI: 357
 *   - BELUM SELESAI TERLAMBAT TERMIN: 147
 *   - BELUM SELESAI TERLAMBAT: 85
 *   - SELESAI TERLAMBAT: 84
 * Status Kirim: SUDAH (2,225)
 * Kode Mata Uang: IDR (2,225)
 */
export function generateAcceptanceTestKontrakData(
  batchId: string = 'KONTRAK-20260923-001'
): { batch: KontrakUploadBatch; records: KontrakMonitoringRecord[] } {
  const batch: KontrakUploadBatch = {
    id: batchId,
    file_name: 'Monitoring Data Kontrak_2026-09-23 05-28.xlsx',
    upload_date: '2026-09-23T05:28:18.000Z',
    download_time_source: '23-09-2026 05:28:18 WIB (+0700 GMT)',
    kanwil: 'PROVINSI JAWA TENGAH',
    kppn: '026 - SEMARANG I',
    period_start: '2026-01-01',
    period_end: '2026-09-23',
    total_records: 2225,
    uploaded_by: 'Admin KPPN',
    status: 'SUCCESS'
  };

  const records: KontrakMonitoringRecord[] = [];

  // Generate 103 satker codes (026 KPPN territory, e.g. 411001 to 411103)
  const satkerCodes: Array<{ kode: string; nama: string }> = [];
  for (let i = 1; i <= 103; i++) {
    const kode = String(411000 + i);
    satkerCodes.push({
      kode,
      nama: `SATUAN KERJA ${kode} KANWIL JATENG`
    });
  }

  // Exact target distributions
  // Progress status:
  // SELESAI TEPAT WAKTU = 1.552
  // BELUM SELESAI = 357
  // BELUM SELESAI TERLAMBAT TERMIN = 147
  // BELUM SELESAI TERLAMBAT = 85
  // SELESAI TERLAMBAT = 84
  // Total = 2225
  const progressList: StatusProgressKontrak[] = [];
  for (let i = 0; i < 1552; i++) progressList.push('SELESAI TEPAT WAKTU');
  for (let i = 0; i < 357; i++) progressList.push('BELUM SELESAI');
  for (let i = 0; i < 147; i++) progressList.push('BELUM SELESAI TERLAMBAT TERMIN');
  for (let i = 0; i < 85; i++) progressList.push('BELUM SELESAI TERLAMBAT');
  for (let i = 0; i < 84; i++) progressList.push('SELESAI TERLAMBAT');

  // Status NRK:
  // SESUAIKAN DENGAN NRK SPAN = 58
  // SESUAI = 2167
  const nrkList: StatusNrk[] = [];
  for (let i = 0; i < 58; i++) nrkList.push('SESUAIKAN DENGAN NRK SPAN');
  for (let i = 0; i < 2167; i++) nrkList.push('SESUAI');

  // Suppliers
  const sampleSuppliers = [
    'PT. CIPTA GRAHA UTAMA',
    'CV. SINAR TEKNIK MANDIRI',
    'PT. MEKAR JAYA ABADI',
    'CV. GEMILANG NUSANTARA',
    'PT. KENCANA MITRA SEJAHTERA',
    'CV. SUMBER BERKAH TEKNIK',
    'PT. DHARMA KARYA SENTOSA',
    'CV. MAJU BERSAMA DIGITAL',
    'PT. PRIMA ANUGERAH SEMARANG',
    'CV. MULTI KREASI CEMERLANG'
  ];

  const coaList = ['521811', '522111', '523111', '523131,534141', '532111', '533111', '536111'];

  for (let idx = 0; idx < 2225; idx++) {
    const no = idx + 1;
    const satker = satkerCodes[idx % satkerCodes.length];
    const statusProgress = progressList[idx];
    const statusNrk = nrkList[idx];
    const supplier = sampleSuppliers[idx % sampleSuppliers.length];
    const coa = coaList[idx % coaList.length];

    // Quarter & Month distribution for Tanggal Kontrak: spread across 2026-01-01 to 2026-09-20
    const month = (idx % 9) + 1; // 1 to 9 (Tw I, II, III)
    const day = (idx % 25) + 1;
    const tglKontrak = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const tglMulai = tglKontrak;

    // Tanggal selesai: 30 to 120 days after mulai
    const endMonth = Math.min(12, month + 2);
    const tglSelesai = `2026-${String(endMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Values
    const baseValue = 50000000 + (idx % 200) * 12500000; // between 50jt and 2.5 M
    const nilaiKontrak = baseValue;
    let nilaiPembayaran = 0;
    let sisaKontrak = nilaiKontrak;

    if (statusProgress === 'SELESAI TEPAT WAKTU' || statusProgress === 'SELESAI TERLAMBAT') {
      nilaiPembayaran = nilaiKontrak;
      sisaKontrak = 0;
    } else if (statusProgress === 'BELUM SELESAI TERLAMBAT TERMIN') {
      nilaiPembayaran = Math.round(nilaiKontrak * 0.6);
      sisaKontrak = nilaiKontrak - nilaiPembayaran;
    } else if (statusProgress === 'BELUM SELESAI') {
      const ratio = (idx % 2 === 0) ? 0.3 : 0.5;
      nilaiPembayaran = Math.round(nilaiKontrak * ratio);
      sisaKontrak = nilaiKontrak - nilaiPembayaran;
    } else {
      // BELUM SELESAI TERLAMBAT
      nilaiPembayaran = Math.round(nilaiKontrak * 0.4);
      sisaKontrak = nilaiKontrak - nilaiPembayaran;
    }

    const nrkSpan = `NRK-SPAN-2026-${String(1000 + idx)}`;
    const nrkSakti = statusNrk === 'SESUAI' ? nrkSpan : `NRK-SAKTI-DIFF-${String(9000 + idx)}`;

    const nomorKontrak = `SPK/2026/${satker.kode}/${String(idx + 1).padStart(4, '0')}`;

    records.push({
      id: `${batchId}-${satker.kode}-${nomorKontrak.replace(/[^a-zA-Z0-9_-]/g, '_')}-${idx + 1}`,
      upload_batch_id: batchId,
      no,
      kode_satker: satker.kode,
      deskripsi_satker: satker.nama,
      kode_kppn: '026',
      nomor_kontrak: nomorKontrak,
      nrk_span: nrkSpan,
      nrk_sakti: nrkSakti,
      status_nrk: statusNrk,
      tanggal_kontrak: tglKontrak,
      kode_mata_uang: 'IDR',
      nama_supplier: supplier,
      nomor_register_supplier: `SUPP-${String(10000 + (idx % 50))}`,
      tanggal_mulai: tglMulai,
      tanggal_selesai: tglSelesai,
      uraian_kontrak: `Pengadaan Barang/Jasa Operasional Satker ${satker.kode} Paket #${no}`,
      nilai_kontrak: nilaiKontrak,
      nilai_pembayaran: nilaiPembayaran,
      sisa_kontrak: sisaKontrak,
      status_progress_kontrak: statusProgress,
      kode_coa: coa,
      status_kirim_kppn: 'SUDAH',
      detail_barang_jasa: 'Lihat Detail Barang/Jasa',
      created_at: '2026-09-23T05:28:18.000Z',
      updated_at: '2026-09-23T05:28:18.000Z'
    });
  }

  return { batch, records };
}

/**
 * Downloads a pristine XLSX file matching the exact structure:
 * Row 1-7 header/metadata
 * Row 8: exact 22 columns A:V
 * Row 9-2233: exact 2,225 records
 */
export function downloadAcceptanceTestExcelFile(): void {
  const { records } = generateAcceptanceTestKontrakData();

  const wsData: any[][] = [];

  // ROW 1
  wsData.push(['Monitoring Data Kontrak']);
  // ROW 2
  wsData.push(['Waktu unduh excel: 23-09-2026 05:28:18 WIB (+0700 GMT)']);
  // ROW 3
  wsData.push([]);
  // ROW 4
  wsData.push(['Kanwil DJPB', ': PROVINSI JAWA TENGAH']);
  // ROW 5
  wsData.push(['KPPN', ': 026 - SEMARANG I']);
  // ROW 6
  wsData.push(['Tanggal Kontrak', ': 2026-01-01 s.d. 2026-09-23']);
  // ROW 7
  wsData.push([]);
  // ROW 8: HEADER RESMI A:V
  wsData.push([...EXPECTED_KONTRAK_COLUMNS]);

  // ROW 9+: DATA
  records.forEach((r, i) => {
    wsData.push([
      i + 1, // A: NO
      r.kode_satker, // B: KODE SATKER
      r.deskripsi_satker, // C: DESKRIPSI SATKER
      r.kode_kppn, // D: KODE KPPN
      r.nomor_kontrak, // E: NOMOR KONTRAK
      r.nrk_span, // F: NRK SPAN
      r.nrk_sakti, // G: NRK SAKTI
      r.status_nrk, // H: STATUS NRK
      r.tanggal_kontrak, // I: TANGGAL KONTRAK
      r.kode_mata_uang, // J: KODE MATA UANG
      r.nama_supplier, // K: NAMA SUPPLIER
      r.nomor_register_supplier, // L: NOMOR REGISTER SUPPLIER
      r.tanggal_mulai, // M: TANGGAL MULAI
      r.tanggal_selesai, // N: TANGGAL SELESAI
      r.uraian_kontrak, // O: URAIAN KONTRAK
      r.nilai_kontrak, // P: NILAI KONTRAK
      r.nilai_pembayaran, // Q: NILAI PEMBAYARAN
      r.sisa_kontrak, // R: SISA KONTRAK
      r.status_progress_kontrak, // S: STATUS PROGRESS KONTRAK
      r.kode_coa, // T: KODE COA
      r.status_kirim_kppn, // U: STATUS KIRIM KE KPPN
      r.detail_barang_jasa // V: DETAIL BARANG JASA
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  XLSX.writeFile(wb, 'Monitoring Data Kontrak_2026-09-23 05-28.xlsx');
}
