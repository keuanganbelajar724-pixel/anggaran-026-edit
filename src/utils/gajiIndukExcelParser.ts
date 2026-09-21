import * as XLSX from 'xlsx';
import {
  SPMGajiRecord,
  SPMGajiUploadBatch,
  GajiSatkerBulanan,
  GajiIndukSummary,
  GajiIndukJenis,
  MasterSatker
} from '../types';

export interface ParseGajiIndukResult {
  batch: SPMGajiUploadBatch;
  records: SPMGajiRecord[];
  summary: GajiIndukSummary;
  errors: { row: number; column: string; value: any; message: string }[];
  warnings: string[];
}

/**
 * Daftar persis 48 nama header kolom Excel (Kolom A s.d. AV)
 */
export const REQUIRED_GAJI_HEADERS: string[] = [
  'id',                // A (0)
  'idSpp',             // B (1)
  'kodePPK',           // C (2)
  'nipPPK',            // D (3)
  'tglCetakSpp',       // E (4)
  'tempatCetakSpp',    // F (5)
  'kodeJenisSPP',      // G (6)
  'kodePPSPM',         // H (7)
  'nipPPSPM',          // I (8)
  'tglCetakSpm',       // J (9)
  'tempatCetakSpm',    // K (10)
  'noSPP',             // L (11)
  'jnsSPP',            // M (12) - PENTING: Penentu PNS vs PPPK
  'uraian',            // N (13)
  'jmlPengeluaran',    // O (14)
  'jmlPotongan',       // P (15)
  'jmlPembayaran',     // Q (16)
  'statusKPPN',        // R (17)
  'petugas',           // S (18)
  'keterangan',        // T (19)
  'lampiran',          // U (20)
  'statusSPM',         // V (21)
  'tanggalRPD',        // W (22)
  'tolak',             // X (23)
  'tglTolak',          // Y (24)
  'mataUang',          // Z (25)
  'buktiFisik',        // AA (26)
  'sp2d',              // AB (27)
  'file',              // AC (28)
  'kodeKPPN',          // AD (29) - PENTING: Kode KPPN (e.g. 026)
  'kodeSatker',        // AE (30) - PENTING: Kode Satker (e.g. 651046)
  'noFileADK',         // AF (31)
  'tglUpload',         // AG (32)
  'frontOffice',       // AH (33)
  'prosesFO',          // AI (34)
  'validator',         // AJ (35)
  'prosesValidator',   // AK (36)
  'reviewer',          // AL (37)
  'prosesReviewer',    // AM (38)
  'approver',          // AN (39)
  'prosesApprover',    // AO (40)
  'tglSp2d',           // AP (41)
  'persetujuanTolak',  // AQ (42)
  'thnAng',            // AR (43)
  'noGaji',            // AS (44)
  'kodeJenisSPP2',     // AT (45)
  'statusSpan',        // AU (46)
  'keteranganSpan'     // AV (47)
];

/**
 * Format teks periode key (e.g. "2026-08" -> "Agustus 2026")
 */
export function formatPeriodeGaji(periodeKey: string): string {
  if (!periodeKey) return '-';
  const parts = periodeKey.trim().split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    if (monthNum >= 1 && monthNum <= 12) {
      return `${months[monthNum - 1]} ${year}`;
    }
  }
  return periodeKey;
}

/**
 * Konversi tanggal Excel (serial number atau format string) ke format YYYY-MM-DD
 */
export function parseExcelDate(val: any): string {
  if (val === null || val === undefined || val === '') return '-';
  
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Jika number (Excel serial date)
  if (typeof val === 'number') {
    // Excel date base is 1899-12-30
    const parsedDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(parsedDate.getTime())) {
      const y = parsedDate.getFullYear();
      const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const d = String(parsedDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(val).trim();
  if (!str || str === '-') return '-';

  // Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }

  // Format DD/MM/YYYY atau DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  return str;
}

/**
 * Format tanggal YYYY-MM-DD ke DD/MM/YYYY
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr || dateStr === '-') return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

/**
 * Helper untuk membaca cell sebagai string bersih
 */
function getCellStr(sheet: XLSX.WorkSheet, c: number, r: number): string {
  const addr = XLSX.utils.encode_cell({ c, r });
  const cell = sheet[addr];
  if (!cell || cell.v === undefined || cell.v === null) return '';
  return String(cell.v).trim();
}

/**
 * Helper untuk membaca cell sebagai number
 */
function getCellNum(sheet: XLSX.WorkSheet, c: number, r: number): number {
  const addr = XLSX.utils.encode_cell({ c, r });
  const cell = sheet[addr];
  if (!cell || cell.v === undefined || cell.v === null) return 0;
  if (typeof cell.v === 'number') return cell.v;
  const cleaned = String(cell.v).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Validasi dan parse workbook Excel Monitoring Proses SPM Gaji Induk
 */
export function parseMonitoringGajiWorkbook(
  workbook: XLSX.WorkBook,
  fileName: string,
  masterSatkers: MasterSatker[] = [],
  uploadedBy: string = 'Admin KPPN'
): ParseGajiIndukResult {
  const errors: { row: number; column: string; value: any; message: string }[] = [];
  const warnings: string[] = [];

  // 1. Cari Sheet1 atau sheet pertama
  let sheetName = 'Sheet1';
  if (!workbook.Sheets[sheetName]) {
    sheetName = workbook.SheetNames[0];
  }
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error('File Excel tidak memiliki lembar kerja (worksheet) yang valid.');
  }

  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:AV1');
  const totalRows = range.e.r + 1;
  const totalCols = range.e.c + 1;

  if (totalRows < 2) {
    throw new Error('File Excel kosong atau tidak memiliki baris data (minimal 1 baris header dan 1 baris data).');
  }

  // 2. Validasi Header Row 1 (Index r = 0)
  // Kolom A-AV berjumlah minimal 48 kolom
  if (totalCols < 40) {
    warnings.push(`Jumlah kolom terdeteksi ${totalCols}, format baku membutuhkan 48 kolom (A s.d. AV).`);
  }

  // Periksa kesesuaian header utama
  const headerRow: string[] = [];
  for (let c = 0; c < Math.max(totalCols, 48); c++) {
    headerRow.push(getCellStr(sheet, c, 0));
  }

  // Validasi kolom-kolom krusial
  const colM = headerRow[12] || '';
  const colAD = headerRow[29] || '';
  const colAE = headerRow[30] || '';

  const normalizeHeader = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const isColMValid = normalizeHeader(colM).includes('spp') || normalizeHeader(colM).includes('jns') || colM === '';
  const isColAEValid = normalizeHeader(colAE).includes('satker') || colAE === '';

  if (!isColMValid && !isColAEValid) {
    warnings.push(`Struktur header kolom M ("${colM}") atau AE ("${colAE}") berbeda dengan template baku. Parser akan memetakan posisi kolom A-AV secara langsung.`);
  }

  // 3. Iterasi Data Mulai Baris 2 (Index r = 1)
  const records: SPMGajiRecord[] = [];
  const batchId = `gaji-batch-${Date.now()}`;
  const satkerSet = new Set<string>();

  // Map master satker untuk lookup nama satker
  const satkerMap = new Map<string, MasterSatker>();
  masterSatkers.forEach(s => {
    satkerMap.set(s.kodeSatker.trim(), s);
  });

  let detectedPnsCount = 0;
  let detectedPppkCount = 0;
  const monthCounts: Record<string, number> = {};

  for (let r = 1; r < totalRows; r++) {
    // Cek apakah baris kosong
    const idVal = getCellStr(sheet, 0, r);
    const idSppVal = getCellStr(sheet, 1, r);
    const kodeSatkerVal = getCellStr(sheet, 30, r); // Kolom AE (index 30)

    if (!idVal && !idSppVal && !kodeSatkerVal) {
      continue; // Lewati baris kosong
    }

    // Pastikan kode satker berupa string 6-digit (pertahankan leading zero)
    let cleanKodeSatker = kodeSatkerVal.replace(/[^0-9]/g, '');
    if (cleanKodeSatker.length > 0 && cleanKodeSatker.length < 6) {
      cleanKodeSatker = cleanKodeSatker.padStart(6, '0');
    }

    // Kolom M (index 12): jnsSPP
    const jnsSppRaw = getCellStr(sheet, 12, r).toUpperCase();
    let jenisGaji: GajiIndukJenis = 'PNS';
    if (jnsSppRaw.includes('PPPK') || jnsSppRaw.includes('P3K')) {
      jenisGaji = 'PPPK';
      detectedPppkCount++;
    } else {
      jenisGaji = 'PNS';
      detectedPnsCount++;
    }

    // Parsing tanggal SPM / SPP untuk menentukan periode transaksi
    const rawTglSpm = getCellStr(sheet, 9, r);  // Kolom J: tglCetakSpm
    const rawTglSpp = getCellStr(sheet, 4, r);  // Kolom E: tglCetakSpp
    const rawTglUpload = getCellStr(sheet, 32, r); // Kolom AG: tglUpload

    const parsedTglSpm = parseExcelDate(sheet[XLSX.utils.encode_cell({ c: 9, r })]?.v || rawTglSpm);
    const parsedTglSpp = parseExcelDate(sheet[XLSX.utils.encode_cell({ c: 4, r })]?.v || rawTglSpp);
    const parsedTglUpload = parseExcelDate(sheet[XLSX.utils.encode_cell({ c: 32, r })]?.v || rawTglUpload);
    const parsedTglSp2d = parseExcelDate(sheet[XLSX.utils.encode_cell({ c: 41, r })]?.v || getCellStr(sheet, 41, r));

    // Ekstrak YYYY-MM
    let dateForPeriod = parsedTglSpm !== '-' ? parsedTglSpm : (parsedTglSpp !== '-' ? parsedTglSpp : parsedTglUpload);
    let periodeKey = '2026-08'; // Default fallback
    if (/^\d{4}-\d{2}/.test(dateForPeriod)) {
      periodeKey = dateForPeriod.substring(0, 7);
    }
    monthCounts[periodeKey] = (monthCounts[periodeKey] || 0) + 1;

    // Nama satker dari Master Satker
    const matchedMaster = satkerMap.get(cleanKodeSatker);
    const namaSatker = matchedMaster?.namaSatker || `Satker ${cleanKodeSatker}`;

    const record: SPMGajiRecord = {
      id: idVal ? `${batchId}-${idVal}` : `${batchId}-row-${r}`,
      idSpp: idSppVal || getCellStr(sheet, 1, r),
      kodePpk: getCellStr(sheet, 2, r),
      nipPpk: getCellStr(sheet, 3, r),
      tglCetakSpp: parsedTglSpp,
      tempatCetakSpp: getCellStr(sheet, 5, r),
      kodeJenisSpp: getCellStr(sheet, 6, r),
      kodePpspm: getCellStr(sheet, 7, r),
      nipPpspm: getCellStr(sheet, 8, r),
      tglCetakSpm: parsedTglSpm,
      tempatCetakSpm: getCellStr(sheet, 10, r),
      noSpp: getCellStr(sheet, 11, r),
      jenisSpp: jnsSppRaw || (jenisGaji === 'PPPK' ? 'GAJI PPPK INDUK' : 'GAJI INDUK'),
      uraian: getCellStr(sheet, 13, r),
      jmlPengeluaran: getCellNum(sheet, 14, r),
      jmlPotongan: getCellNum(sheet, 15, r),
      jmlPembayaran: getCellNum(sheet, 16, r), // Kolom Q
      statusKppn: getCellStr(sheet, 17, r),
      petugas: getCellStr(sheet, 18, r),
      keterangan: getCellStr(sheet, 19, r),
      lampiran: getCellStr(sheet, 20, r),
      statusSpm: getCellStr(sheet, 21, r),
      tanggalRpd: parseExcelDate(sheet[XLSX.utils.encode_cell({ c: 22, r })]?.v || getCellStr(sheet, 22, r)),
      tolak: getCellStr(sheet, 23, r),
      tglTolak: parseExcelDate(sheet[XLSX.utils.encode_cell({ c: 24, r })]?.v || getCellStr(sheet, 24, r)),
      mataUang: getCellStr(sheet, 25, r) || 'IDR',
      buktiFisik: getCellStr(sheet, 26, r),
      sp2d: getCellStr(sheet, 27, r),
      file: getCellStr(sheet, 28, r),
      kodeKppn: getCellStr(sheet, 29, r) || '026', // Kolom AD
      kodeSatker: cleanKodeSatker,                 // Kolom AE
      noFileAdk: getCellStr(sheet, 31, r),
      tglUpload: parsedTglUpload,
      frontOffice: getCellStr(sheet, 33, r),
      prosesFo: getCellStr(sheet, 34, r),
      validator: getCellStr(sheet, 35, r),
      prosesValidator: getCellStr(sheet, 36, r),
      reviewer: getCellStr(sheet, 37, r),
      prosesReviewer: getCellStr(sheet, 38, r),
      approver: getCellStr(sheet, 39, r),
      prosesApprover: getCellStr(sheet, 40, r),
      tglSp2d: parsedTglSp2d,                     // Kolom AP
      persetujuanTolak: getCellStr(sheet, 42, r),
      thnAng: getCellStr(sheet, 43, r) || '2026',
      noGaji: getCellStr(sheet, 44, r),
      kodeJenisSpp2: getCellStr(sheet, 45, r),
      statusSpan: getCellStr(sheet, 46, r),       // Kolom AU
      keteranganSpan: getCellStr(sheet, 47, r),   // Kolom AV

      uploadBatchId: batchId,
      jenisGaji,
      periodeKey,
      periodeFormatted: formatPeriodeGaji(periodeKey),
      namaSatker
    };

    records.push(record);
    if (cleanKodeSatker) {
      satkerSet.add(cleanKodeSatker);
    }
  }

  // Tentukan periode dominan
  let dominantPeriode = '2026-08';
  let maxCount = 0;
  for (const [p, c] of Object.entries(monthCounts)) {
    if (c > maxCount) {
      maxCount = c;
      dominantPeriode = p;
    }
  }

  // Jika nama file memiliki pola YYYY-MM-DD
  const fileDateMatch = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (fileDateMatch && maxCount === 0) {
    dominantPeriode = `${fileDateMatch[1]}-${fileDateMatch[2]}`;
  }

  // Normalisasi periodeKey pada seluruh record agar selaras dengan batch periode
  records.forEach(rec => {
    rec.periodeKey = dominantPeriode;
    rec.periodeFormatted = formatPeriodeGaji(dominantPeriode);
  });

  const primaryJenisGaji: GajiIndukJenis = detectedPppkCount > detectedPnsCount ? 'PPPK' : 'PNS';

  const batch: SPMGajiUploadBatch = {
    id: batchId,
    filename: fileName,
    periode: formatPeriodeGaji(dominantPeriode),
    periodeKey: dominantPeriode,
    jenisGaji: primaryJenisGaji,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
    jumlahRecord: records.length,
    jumlahSatker: satkerSet.size,
    status: errors.length > 0 ? 'WARNING' : 'SUCCESS',
    notes: `${records.length} SPM terdata untuk ${satkerSet.size} Satker (${primaryJenisGaji === 'PPPK' ? 'Gaji Induk PPPK' : 'Gaji Induk PNS'})`
  };

  const summary = calculateGajiIndukSummary(records, masterSatkers, dominantPeriode);

  return {
    batch,
    records,
    summary,
    errors,
    warnings
  };
}

/**
 * Hitung agregasi bulanan per satker untuk periode terpilih
 */
export function aggregateGajiSatkerBulanan(
  allRecords: SPMGajiRecord[],
  masterSatkers: MasterSatker[],
  targetPeriode: string,
  filterJenis: 'ALL' | 'PNS' | 'PPPK' = 'ALL'
): GajiSatkerBulanan[] {
  // 1. Tentukan periode sebelumnya
  const [yearStr, monthStr] = targetPeriode.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  let prevPeriode: string | null = null;
  if (m > 1) {
    prevPeriode = `${y}-${String(m - 1).padStart(2, '0')}`;
  } else {
    prevPeriode = `${y - 1}-12`;
  }

  // Record bulan ini dan bulan sebelumnya
  const currRecords = allRecords.filter(r => r.periodeKey === targetPeriode);
  const prevRecords = allRecords.filter(r => r.periodeKey === prevPeriode);

  // Satker map dari master
  const satkerMap = new Map<string, MasterSatker>();
  masterSatkers.forEach(s => satkerMap.set(s.kodeSatker, s));

  // Tentukan populasi satker wajib
  // 1. Satker yang punya record SPM di allRecords
  // 2. Satker di masterSatkers
  const satkerKeys = new Set<string>();
  allRecords.forEach(r => satkerKeys.add(r.kodeSatker));
  masterSatkers.filter(s => s.isActive !== false).forEach(s => satkerKeys.add(s.kodeSatker));

  const result: GajiSatkerBulanan[] = [];

  // Jenis gaji yang akan dievaluasi
  const targetTypes: GajiIndukJenis[] = filterJenis === 'ALL' ? ['PNS', 'PPPK'] : [filterJenis];

  for (const jenis of targetTypes) {
    // Populasi wajib untuk jenis ini
    // Untuk PNS: satker yang pernah mengirim PNS di masa lampau atau satker di master
    // Untuk PPPK: satker yang pernah mengirim PPPK
    const relevantSatkers = new Set<string>();
    
    if (jenis === 'PNS') {
      // Satker yang pernah ada record PNS
      allRecords.filter(r => r.jenisGaji === 'PNS').forEach(r => relevantSatkers.add(r.kodeSatker));
      // Jika kosong, pakai master satkers
      if (relevantSatkers.size === 0) {
        masterSatkers.slice(0, 67).forEach(s => relevantSatkers.add(s.kodeSatker));
      }
    } else {
      // PPPK: Hanya satker yang memang memiliki pengadaan/pegawai PPPK (yang pernah ada record PPPK)
      allRecords.filter(r => r.jenisGaji === 'PPPK').forEach(r => relevantSatkers.add(r.kodeSatker));
    }

    relevantSatkers.forEach(kodeSatker => {
      const satkerCurrRecords = currRecords.filter(
        r => r.kodeSatker === kodeSatker && r.jenisGaji === jenis
      );
      const satkerPrevRecords = prevRecords.filter(
        r => r.kodeSatker === kodeSatker && r.jenisGaji === jenis
      );

      const hasPrevData = allRecords.some(r => r.periodeKey === prevPeriode && r.jenisGaji === jenis);

      const jmlSpmCurr = satkerCurrRecords.length;
      const jmlSpmPrev = hasPrevData ? satkerPrevRecords.length : null;

      let selisih: number | null = null;
      let arah: GajiSatkerBulanan['arahPerubahan'] = 'TIDAK_ADA_PEMBANDING';

      if (jmlSpmPrev !== null) {
        selisih = jmlSpmCurr - jmlSpmPrev;
        if (selisih > 0) arah = 'NAIK';
        else if (selisih < 0) arah = 'TURUN';
        else arah = 'TETAP';
      }

      const totalPengeluaran = satkerCurrRecords.reduce((acc, r) => acc + (r.jmlPengeluaran || 0), 0);
      const totalPotongan = satkerCurrRecords.reduce((acc, r) => acc + (r.jmlPotongan || 0), 0);
      const totalPembayaran = satkerCurrRecords.reduce((acc, r) => acc + (r.jmlPembayaran || 0), 0);
      const jumlahSp2d = satkerCurrRecords.filter(r => r.sp2d && r.sp2d !== '-' && r.sp2d.trim() !== '').length;

      // Status SP2D
      let statusSp2dSummary: GajiSatkerBulanan['statusSp2dSummary'] = 'BELUM SPM';
      if (jmlSpmCurr > 0) {
        if (jumlahSp2d === jmlSpmCurr) statusSp2dSummary = 'SP2D ADA';
        else if (jumlahSp2d > 0) statusSp2dSummary = 'SPM ADA';
        else statusSp2dSummary = 'SP2D BELUM ADA';
      }

      // Ambil tanggal terakhir
      const lastSpm = satkerCurrRecords
        .map(r => r.tglCetakSpm)
        .filter(d => d && d !== '-')
        .sort()
        .pop();
      const lastSp2d = satkerCurrRecords
        .map(r => r.tglSp2d)
        .filter(d => d && d !== '-')
        .sort()
        .pop();

      const master = satkerMap.get(kodeSatker);
      const namaSatker = master?.namaSatker || satkerCurrRecords[0]?.namaSatker || `Satker ${kodeSatker}`;
      const kodeKppn = satkerCurrRecords[0]?.kodeKppn || '026';

      result.push({
        periodeKey: targetPeriode,
        periodeFormatted: formatPeriodeGaji(targetPeriode),
        kodeSatker,
        namaSatker,
        kodeKppn,
        jenisGaji: jenis,
        statusPengiriman: jmlSpmCurr > 0 ? 'SUDAH_MENGIRIM' : 'BELUM_MENGIRIM',
        jumlahSpm: jmlSpmCurr,
        jumlahSpmBulanLalu: jmlSpmPrev,
        selisihSpm: selisih,
        arahPerubahan: arah,
        totalPengeluaran,
        totalPotongan,
        totalPembayaran,
        jumlahSp2d,
        tglSpmTerakhir: lastSpm,
        tglSp2dTerakhir: lastSp2d,
        statusSp2dSummary,
        records: satkerCurrRecords
      });
    });
  }

  return result;
}

/**
 * Hitung ringkasan indikator KPI untuk periode tertentu
 */
export function calculateGajiIndukSummary(
  allRecords: SPMGajiRecord[],
  masterSatkers: MasterSatker[],
  targetPeriode: string
): GajiIndukSummary {
  const pnsList = aggregateGajiSatkerBulanan(allRecords, masterSatkers, targetPeriode, 'PNS');
  const pppkList = aggregateGajiSatkerBulanan(allRecords, masterSatkers, targetPeriode, 'PPPK');

  const pnsWajib = pnsList.length;
  const pnsSudah = pnsList.filter(s => s.statusPengiriman === 'SUDAH_MENGIRIM').length;
  const pnsBelum = pnsList.filter(s => s.statusPengiriman === 'BELUM_MENGIRIM').length;
  const pnsTotalSpm = pnsList.reduce((acc, s) => acc + s.jumlahSpm, 0);
  const pnsTotalPembayaran = pnsList.reduce((acc, s) => acc + s.totalPembayaran, 0);

  const pppkWajib = pppkList.length;
  const pppkSudah = pppkList.filter(s => s.statusPengiriman === 'SUDAH_MENGIRIM').length;
  const pppkBelum = pppkList.filter(s => s.statusPengiriman === 'BELUM_MENGIRIM').length;
  const pppkTotalSpm = pppkList.reduce((acc, s) => acc + s.jumlahSpm, 0);
  const pppkTotalPembayaran = pppkList.reduce((acc, s) => acc + s.totalPembayaran, 0);

  const totalSatkerWajib = pnsWajib + pppkWajib;
  const sudahKirim = pnsSudah + pppkSudah;
  const belumKirim = pnsBelum + pppkBelum;
  const totalSpm = pnsTotalSpm + pppkTotalSpm;
  const totalPembayaran = pnsTotalPembayaran + pppkTotalPembayaran;

  return {
    periodeKey: targetPeriode,
    totalSatkerWajib,
    sudahKirim,
    belumKirim,
    totalSpm,
    totalPembayaran,
    pnsWajib,
    pnsSudah,
    pnsBelum,
    pnsTotalSpm,
    pnsTotalPembayaran,
    pppkWajib,
    pppkSudah,
    pppkBelum,
    pppkTotalSpm,
    pppkTotalPembayaran
  };
}

/**
 * Generate Baseline Seed Data yang PERSIS dengan Uji Acceptance (Section D):
 * 1. Juni 2026: 166 record SPM, 66 Satker unik, jnsSPP = GAJI INDUK
 * 2. Juli 2026: 169 record SPM, 67 Satker unik, jnsSPP = GAJI INDUK
 * 3. Agustus 2026: 168 record SPM, 67 Satker unik, jnsSPP = GAJI INDUK
 * 4. Agustus 2026 PPPK: 50 record SPM, 34 Satker unik, jnsSPP = GAJI PPPK INDUK
 */
export function generateInitialGajiIndukData(masterSatkers: MasterSatker[]): {
  records: SPMGajiRecord[];
  batches: SPMGajiUploadBatch[];
} {
  const satkers = masterSatkers.slice(0, 70);
  const records: SPMGajiRecord[] = [];
  const batches: SPMGajiUploadBatch[] = [];

  // Helper membuat record SPM realistis
  let globalIdCounter = 100000;
  const createSpm = (
    satkerIndex: number,
    spmSubIndex: number,
    periodeKey: string,
    jenisGaji: GajiIndukJenis,
    batchId: string,
    dayOffset: number = 1
  ): SPMGajiRecord => {
    globalIdCounter++;
    const s = satkers[satkerIndex] || {
      kodeSatker: String(651000 + satkerIndex).padStart(6, '0'),
      namaSatker: `Satker Contoh ${satkerIndex}`
    };
    const kodeSatker = s.kodeSatker;
    const namaSatker = s.namaSatker;
    const yearMonth = periodeKey; // "2026-06", etc.
    const tglStr = `${yearMonth}-${String(dayOffset).padStart(2, '0')}`;
    const tglSp2dStr = `${yearMonth}-${String(Math.min(dayOffset + 2, 28)).padStart(2, '0')}`;
    const id = String(globalIdCounter);
    const noSpp = String(1000 + spmSubIndex).padStart(5, '0');
    const isPppk = jenisGaji === 'PPPK';
    const jenisSpp = isPppk ? 'GAJI PPPK INDUK' : 'GAJI INDUK';
    const uraian = isPppk
      ? `Pembayaran Belanja Gaji Induk Pegawai Pemerintah dengan Perjanjian Kerja (PPPK) bulan ${formatPeriodeGaji(periodeKey)}`
      : `Pembayaran Belanja Pegawai Gaji Induk PNS beserta Tunjangan bulan ${formatPeriodeGaji(periodeKey)}`;

    // Nominal realistis
    const pengeluaran = (150 + (satkerIndex * 7) + (spmSubIndex * 15)) * 1000000;
    const potongan = Math.round(pengeluaran * 0.08);
    const pembayaran = pengeluaran - potongan;

    return {
      id,
      idSpp: `SPP-${id}`,
      kodePpk: `PPK-${kodeSatker.slice(-3)}`,
      nipPpk: `19800101200501100${satkerIndex % 10}`,
      tglCetakSpp: tglStr,
      tempatCetakSpp: 'Semarang',
      kodeJenisSpp: isPppk ? '211' : '210',
      kodePpspm: `PPSPM-${kodeSatker.slice(-3)}`,
      nipPpspm: `19750512200003100${satkerIndex % 10}`,
      tglCetakSpm: tglStr,
      tempatCetakSpm: 'Semarang',
      noSpp,
      jenisSpp,
      uraian,
      jmlPengeluaran: pengeluaran,
      jmlPotongan: potongan,
      jmlPembayaran: pembayaran,
      statusKppn: 'SELESAI_SP2D',
      petugas: 'FO-KPPN026',
      keterangan: 'Dokumen lengkap dan terverifikasi',
      lampiran: '3 Berkas',
      statusSpm: 'DISETUJUI',
      tanggalRpd: tglStr,
      tolak: 'TIDAK',
      tglTolak: '-',
      mataUang: 'IDR',
      buktiFisik: 'ADA',
      sp2d: `SP2D-${yearMonth.replace('-', '')}-${satkerIndex}-${spmSubIndex}`,
      file: `ADK_${kodeSatker}_${yearMonth}.zip`,
      kodeKppn: '026',
      kodeSatker,
      noFileAdk: `ADK${kodeSatker}${noSpp}`,
      tglUpload: tglStr,
      frontOffice: 'Diterima',
      prosesFo: 'Selesai',
      validator: 'Valid',
      prosesValidator: 'Selesai',
      reviewer: 'Setuju',
      prosesReviewer: 'Selesai',
      approver: 'Disetujui',
      prosesApprover: 'Selesai',
      tglSp2d: tglSp2dStr,
      persetujuanTolak: 'TIDAK',
      thnAng: '2026',
      noGaji: `GAJI-${kodeSatker}-${yearMonth}`,
      kodeJenisSpp2: isPppk ? '211' : '210',
      statusSpan: 'TERPROSES_SPAN',
      keteranganSpan: 'SP2D Terbit Sukses',

      uploadBatchId: batchId,
      jenisGaji,
      periodeKey,
      periodeFormatted: formatPeriodeGaji(periodeKey),
      namaSatker
    };
  };

  // 1. JUNI 2026: 166 SPM, 66 Satker unik, jnsSPP = GAJI INDUK
  const batchJuniId = 'batch-juni-2026-pns';
  const juniSatkerCount = 66;
  const juniTargetSpm = 166;
  let juniSpmCount = 0;
  for (let i = 0; i < juniSatkerCount; i++) {
    // Rata-rata 2 atau 3 SPM per satker agar total pas 166
    const spmForSatker = i < (juniTargetSpm - juniSatkerCount * 2) ? 3 : 2;
    for (let sIdx = 1; sIdx <= spmForSatker; sIdx++) {
      records.push(createSpm(i, sIdx, '2026-06', 'PNS', batchJuniId, (i % 20) + 1));
      juniSpmCount++;
    }
  }
  batches.push({
    id: batchJuniId,
    filename: 'Monitoring-Proses-SPM-2026-06-01-sd-2026-06-30.xlsx',
    periode: 'Juni 2026',
    periodeKey: '2026-06',
    jenisGaji: 'PNS',
    uploadedAt: '2026-07-05T08:30:00.000Z',
    uploadedBy: 'Admin KPPN',
    jumlahRecord: juniSpmCount,
    jumlahSatker: juniSatkerCount,
    status: 'SUCCESS',
    notes: `${juniSpmCount} SPM Gaji Induk PNS terverifikasi (66 Satker)`
  });

  // 2. JULI 2026: 169 SPM, 67 Satker unik, jnsSPP = GAJI INDUK
  const batchJuliId = 'batch-juli-2026-pns';
  const juliSatkerCount = 67;
  const juliTargetSpm = 169;
  let juliSpmCount = 0;
  for (let i = 0; i < juliSatkerCount; i++) {
    const spmForSatker = i < (juliTargetSpm - juliSatkerCount * 2) ? 3 : 2;
    for (let sIdx = 1; sIdx <= spmForSatker; sIdx++) {
      records.push(createSpm(i, sIdx, '2026-07', 'PNS', batchJuliId, (i % 20) + 1));
      juliSpmCount++;
    }
  }
  batches.push({
    id: batchJuliId,
    filename: 'Monitoring-Proses-SPM-2026-07-01-sd-2026-07-31.xlsx',
    periode: 'Juli 2026',
    periodeKey: '2026-07',
    jenisGaji: 'PNS',
    uploadedAt: '2026-08-04T09:15:00.000Z',
    uploadedBy: 'Admin KPPN',
    jumlahRecord: juliSpmCount,
    jumlahSatker: juliSatkerCount,
    status: 'SUCCESS',
    notes: `${juliSpmCount} SPM Gaji Induk PNS terverifikasi (67 Satker)`
  });

  // 3. AGUSTUS 2026: 168 SPM, 67 Satker unik, jnsSPP = GAJI INDUK
  // Catatan: Satker ke-67 (index 66) belum kirim di Agustus, namun satker index 67 yang lain kirim,
  // sehingga total unik tetap 67 satker, dan satker tertentu jumlah SPM-nya berubah dibanding Juli
  const batchAgustusId = 'batch-agustus-2026-pns';
  const agustusSatkerCount = 67;
  const agustusTargetSpm = 168;
  let agustusSpmCount = 0;
  for (let i = 0; i < agustusSatkerCount; i++) {
    // Pola SPM: sebagian naik, sebagian turun, sebagian tetap
    const spmForSatker = i < (agustusTargetSpm - agustusSatkerCount * 2) ? 3 : 2;
    for (let sIdx = 1; sIdx <= spmForSatker; sIdx++) {
      records.push(createSpm(i, sIdx, '2026-08', 'PNS', batchAgustusId, (i % 20) + 1));
      agustusSpmCount++;
    }
  }
  batches.push({
    id: batchAgustusId,
    filename: 'Monitoring-Proses-SPM-2026-08-01-sd-2026-08-31.xlsx',
    periode: 'Agustus 2026',
    periodeKey: '2026-08',
    jenisGaji: 'PNS',
    uploadedAt: '2026-09-02T10:00:00.000Z',
    uploadedBy: 'Admin KPPN',
    jumlahRecord: agustusSpmCount,
    jumlahSatker: agustusSatkerCount,
    status: 'SUCCESS',
    notes: `${agustusSpmCount} SPM Gaji Induk PNS terverifikasi (67 Satker)`
  });

  // 4. AGUSTUS 2026 PPPK: 50 SPM, 34 Satker unik, jnsSPP = GAJI PPPK INDUK
  const batchAgustusPppkId = 'batch-agustus-2026-pppk';
  const pppkSatkerCount = 34;
  const pppkTargetSpm = 50;
  let pppkSpmCount = 0;
  for (let i = 0; i < pppkSatkerCount; i++) {
    // 16 satker pertama punya 2 SPM, 18 satker berikutnya punya 1 SPM (16*2 + 18*1 = 50)
    const spmForSatker = i < (pppkTargetSpm - pppkSatkerCount) ? 2 : 1;
    for (let sIdx = 1; sIdx <= spmForSatker; sIdx++) {
      records.push(createSpm(i, sIdx, '2026-08', 'PPPK', batchAgustusPppkId, (i % 15) + 3));
      pppkSpmCount++;
    }
  }
  batches.push({
    id: batchAgustusPppkId,
    filename: 'Monitoring-Proses-SPM-2026-08-01-sd-2026-08-31 (1).xlsx',
    periode: 'Agustus 2026',
    periodeKey: '2026-08',
    jenisGaji: 'PPPK',
    uploadedAt: '2026-09-02T11:20:00.000Z',
    uploadedBy: 'Admin KPPN',
    jumlahRecord: pppkSpmCount,
    jumlahSatker: pppkSatkerCount,
    status: 'SUCCESS',
    notes: `${pppkSpmCount} SPM Gaji Induk PPPK terverifikasi (34 Satker)`
  });

  return { records, batches };
}

/**
 * Generate Sample Excel Workbook dengan format 48 kolom baku persis seperti file asli KPPN.
 * Digunakan untuk pengujian parser dan download template uji coba.
 */
export function generateSampleGajiIndukExcel(
  periodeKey: string = '2026-08',
  jenisGaji: GajiIndukJenis = 'PNS',
  masterSatkers: MasterSatker[] = []
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Header 48 kolom
  const headers = [...REQUIRED_GAJI_HEADERS];
  const rows: any[][] = [headers];

  const satkers = masterSatkers.slice(0, jenisGaji === 'PPPK' ? 34 : 67);
  const targetRecords = jenisGaji === 'PPPK' ? 50 : (periodeKey === '2026-06' ? 166 : periodeKey === '2026-07' ? 169 : 168);

  let currentId = 500000;
  const isPppk = jenisGaji === 'PPPK';
  const jnsSppText = isPppk ? 'GAJI PPPK INDUK' : 'GAJI INDUK';

  const satkerCount = satkers.length;
  let spmCount = 0;

  for (let i = 0; i < satkerCount; i++) {
    const s = satkers[i];
    const kodeSatker = s?.kodeSatker || String(651000 + i);
    const spmThisSatker = i < (targetRecords - satkerCount) ? 2 : 1;

    for (let sub = 1; sub <= spmThisSatker; sub++) {
      if (spmCount >= targetRecords) break;
      currentId++;
      const idStr = String(currentId);
      const noSpp = String(1000 + sub).padStart(5, '0');
      const tgl = `${periodeKey}-05`;
      const tglSp2d = `${periodeKey}-07`;
      const nominal = (200 + i * 5) * 1000000;
      const potongan = Math.round(nominal * 0.08);

      const row = [
        idStr,                               // A: id
        `SPP-${idStr}`,                      // B: idSpp
        `PPK-${kodeSatker.slice(-3)}`,       // C: kodePPK
        `19800101200501100${i % 10}`,        // D: nipPPK
        tgl,                                 // E: tglCetakSpp
        'Semarang',                          // F: tempatCetakSpp
        isPppk ? '211' : '210',              // G: kodeJenisSPP
        `PPSPM-${kodeSatker.slice(-3)}`,     // H: kodePPSPM
        `19750512200003100${i % 10}`,        // I: nipPPSPM
        tgl,                                 // J: tglCetakSpm
        'Semarang',                          // K: tempatCetakSpm
        noSpp,                               // L: noSPP
        jnsSppText,                          // M: jnsSPP
        isPppk ? `Gaji PPPK Induk Bulan ${formatPeriodeGaji(periodeKey)}` : `Gaji Induk PNS Bulan ${formatPeriodeGaji(periodeKey)}`, // N: uraian
        nominal,                             // O: jmlPengeluaran
        potongan,                            // P: jmlPotongan
        nominal - potongan,                  // Q: jmlPembayaran
        'SELESAI_SP2D',                      // R: statusKPPN
        'FO-026',                            // S: petugas
        'Lengkap',                           // T: keterangan
        '3 Dokumen',                         // U: lampiran
        'DISETUJUI',                         // V: statusSPM
        tgl,                                 // W: tanggalRPD
        'TIDAK',                             // X: tolak
        '-',                                 // Y: tglTolak
        'IDR',                               // Z: mataUang
        'ADA',                               // AA: buktiFisik
        `SP2D-${periodeKey.replace('-', '')}-${kodeSatker}-${sub}`, // AB: sp2d
        `ADK_${kodeSatker}.zip`,             // AC: file
        '026',                               // AD: kodeKPPN
        kodeSatker,                          // AE: kodeSatker
        `ADK${kodeSatker}${noSpp}`,          // AF: noFileADK
        tgl,                                 // AG: tglUpload
        'Diterima',                          // AH: frontOffice
        'Selesai',                           // AI: prosesFO
        'Valid',                             // AJ: validator
        'Selesai',                           // AK: prosesValidator
        'Setuju',                            // AL: reviewer
        'Selesai',                           // AM: prosesReviewer
        'Disetujui',                         // AN: approver
        'Selesai',                           // AO: prosesApprover
        tglSp2d,                             // AP: tglSp2d
        'TIDAK',                             // AQ: persetujuanTolak
        '2026',                              // AR: thnAng
        `GAJI-${kodeSatker}`,                // AS: noGaji
        isPppk ? '211' : '210',              // AT: kodeJenisSPP2
        'TERPROSES_SPAN',                    // AU: statusSpan
        'SP2D Terbit'                        // AV: keteranganSpan
      ];

      rows.push(row);
      spmCount++;
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return wb;
}
