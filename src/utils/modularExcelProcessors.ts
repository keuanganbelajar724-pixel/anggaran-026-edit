import * as XLSX from 'xlsx';
import {
  MasterSatker,
  IKPARecord,
  CapaianOutputRecord,
  PejabatSertifikasi,
  PengelolaanUPRecord,
  KarwasTUPRecord,
  DigipayRecord,
  ExcelValidationPreview
} from '../types';
import { hitungTotalIKPA, getPredikatIKPA } from '../data/initialSatkerData';
import { evaluateDeadlineDate } from '../data/initialUPData';

function cleanText(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/\s+/g, ' ');
}

function parseFormattedNumber(val: any, defaultValue: number = 0): number {
  if (val === null || val === undefined || val === '') return defaultValue;
  if (typeof val === 'number') return isNaN(val) ? defaultValue : val;
  
  let str = String(val).trim().replace(/Rp|\$|IDR|%|\s/gi, '');
  if (!str) return defaultValue;

  // Case 1: Contains both dot and comma
  if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Indonesian format: 1.500.000,50 -> 1500000.50
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,500,000.50 -> 1500000.50
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    // Case 2: Contains only dot(s)
    // If multiple dots (e.g. 1.500.000) or single dot with 3 digits at end (e.g. 250.000, 25.000)
    const dotParts = str.split('.');
    if (dotParts.length > 2 || (dotParts.length === 2 && dotParts[1].length === 3 && dotParts[0].length >= 1)) {
      str = str.replace(/\./g, '');
    }
  } else if (str.includes(',')) {
    // Case 3: Contains only comma(s)
    const commaParts = str.split(',');
    if (commaParts.length > 2 || (commaParts.length === 2 && commaParts[1].length === 3)) {
      // Thousand separator comma: 1,500,000
      str = str.replace(/,/g, '');
    } else {
      // Decimal comma: 1500000,50 -> 1500000.50
      str = str.replace(',', '.');
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? defaultValue : num;
}

function normalizeKodeSatker(raw: any): string {
  if (!raw) return '';
  const digits = String(raw).trim().replace(/[^0-9]/g, '');
  if (digits.length === 6) return digits;
  if (digits.length > 0 && digits.length < 6) {
    return digits.padStart(6, '0');
  }
  return digits;
}

export function parseExcelDateString(val: any): string {
  if (val === null || val === undefined || val === '') return '';
  
  if (typeof val === 'number') {
    // Excel date serial number (e.g. 44927 -> 2023-01-01)
    if (val > 20000 && val < 70000) {
      const utc_days = Math.floor(val - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      const day = String(date_info.getUTCDate()).padStart(2, '0');
      const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
      const year = date_info.getUTCFullYear();
      return `${day}-${month}-${year}`;
    }
    return String(val);
  }

  if (val instanceof Date && !isNaN(val.getTime())) {
    const day = String(val.getDate()).padStart(2, '0');
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const year = val.getFullYear();
    return `${day}-${month}-${year}`;
  }

  const str = String(val).trim();
  if (!str || str === '-' || str.toLowerCase() === 'tidak ada' || str.toLowerCase() === 'belum ada') return '';

  // ISO string
  if (str.includes('T') && str.length >= 10) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  }

  // YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(str)) {
    const parts = str.split(/[-/.]/);
    return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
  }

  // DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}/.test(str)) {
    const parts = str.split(/[-/.]/);
    return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
  }

  return str;
}

/**
 * 1. VALIDASI & PREVIEW EXCEL IKPA TERISOLASI TERHADAP MASTER SATKER
 */
export async function validateIKPAExcelFile(
  file: File,
  masterSatkers: MasterSatker[],
  forcedPeriod?: string,
  forcedYear?: number
): Promise<ExcelValidationPreview<IKPARecord>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!matrix || matrix.length === 0) {
          throw new Error('File Excel kosong.');
        }

        // Master Satker lookup map
        const masterMap = new Map<string, MasterSatker>();
        masterSatkers.forEach(m => {
          if (m.kodeSatker) masterMap.set(m.kodeSatker.trim(), m);
        });

        // Detect month/period
        let detectedMonth = forcedPeriod || '';
        const monthsList = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        if (!detectedMonth) {
          for (let i = 0; i < Math.min(15, matrix.length); i++) {
            if (!matrix[i]) continue;
            const rowStr = matrix[i].join(' ');
            monthsList.forEach(m => {
              if (rowStr.toLowerCase().includes(m.toLowerCase()) && !detectedMonth) {
                detectedMonth = m;
              }
            });
          }
          if (!detectedMonth) {
            monthsList.forEach(m => {
              if (file.name.toLowerCase().includes(m.toLowerCase()) && !detectedMonth) {
                detectedMonth = m;
              }
            });
          }
          if (!detectedMonth) detectedMonth = 'Januari';
        }

        const tahun = forcedYear || 2026;
        const periodeFormatted = `${detectedMonth} ${tahun}`;

        // Header detection
        let headerRowIndex = -1;
        let colKode = -1;
        let colNama = -1;
        let colPagu = -1;
        let colRealisasi = -1;
        let colPenyerapan = -1;
        let colRevisi = -1;
        let colDeviasi = -1;
        let colKontraktual = -1;
        let colTagihan = -1;
        let colUpTup = -1;
        let colDispensasi = -1;
        let colCapaianOutput = -1;
        let colNilaiAkhir = -1;

        for (let r = 0; r < Math.min(25, matrix.length); r++) {
          const row = matrix[r];
          if (!row) continue;
          const rowLower = row.map(c => String(c).toLowerCase().trim());
          const hasKode = rowLower.some(c => c.includes('kode') || c.includes('satker') || c.includes('kd_satker'));
          const hasIKPA = rowLower.some(c => c.includes('ikpa') || c.includes('nilai') || c.includes('revisi') || c.includes('penyerapan'));

          if (hasKode && (hasIKPA || rowLower.length >= 5)) {
            headerRowIndex = r;
            rowLower.forEach((val, idx) => {
              if ((val.includes('kode') && val.includes('satker')) || val === 'kd satker' || val === 'kode' || val === 'kdsatker') {
                if (colKode === -1) colKode = idx;
              } else if (val.includes('nama') || val.includes('uraian') || val === 'satker') {
                if (colNama === -1) colNama = idx;
              } else if (val.includes('pagu') || val.includes('dipa')) {
                if (colPagu === -1) colPagu = idx;
              } else if (val.includes('realisasi')) {
                if (colRealisasi === -1) colRealisasi = idx;
              } else if (val.includes('revisi')) {
                if (colRevisi === -1) colRevisi = idx;
              } else if (val.includes('deviasi') || val.includes('hal iii') || val.includes('hal 3')) {
                if (colDeviasi === -1) colDeviasi = idx;
              } else if (val.includes('penyerapan')) {
                if (colPenyerapan === -1) colPenyerapan = idx;
              } else if (val.includes('kontraktual') || val.includes('belanja')) {
                if (colKontraktual === -1) colKontraktual = idx;
              } else if (val.includes('tagihan')) {
                if (colTagihan === -1) colTagihan = idx;
              } else if (val.includes('up') || val.includes('tup')) {
                if (colUpTup === -1) colUpTup = idx;
              } else if (val.includes('dispensasi')) {
                if (colDispensasi === -1) colDispensasi = idx;
              } else if (val.includes('output') || val.includes('capaian')) {
                if (colCapaianOutput === -1) colCapaianOutput = idx;
              } else if (val.includes('total') || val.includes('akhir') || val.includes('nilai ikpa')) {
                if (colNilaiAkhir === -1) colNilaiAkhir = idx;
              }
            });
            break;
          }
        }

        // Fallback default columns
        if (colKode === -1) colKode = 1;
        if (colNama === -1) colNama = 2;

        const validData: IKPARecord[] = [];
        const invalidRows: any[] = [];
        const unregisteredSatkers: any[] = [];
        const seenKodes = new Set<string>();

        const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 1;

        for (let r = startRow; r < matrix.length; r++) {
          const row = matrix[r];
          if (!row || row.length === 0) continue;

          const rowUpper = row.map(c => String(c || '').trim().toUpperCase()).join(' ');

          // Skip auxiliary rows (Bobot, Nilai Akhir, Konversi, Total, etc.)
          if (
            rowUpper.includes('BOBOT') ||
            rowUpper.includes('NILAI AKHIR') ||
            rowUpper.includes('NILAI KONVERSI') ||
            rowUpper.includes('BOBOT KONVERSI') ||
            rowUpper.includes('TOTAL BOBOT') ||
            rowUpper.includes('RATA-RATA') ||
            rowUpper.includes('JUMLAH')
          ) {
            continue;
          }

          const rawKode = row[colKode] || row[0] || '';
          const kodeSatker = normalizeKodeSatker(rawKode);
          const namaSatkerFromRow = cleanText(row[colNama] || '');

          if (!kodeSatker || kodeSatker.length < 5) continue;
          if (seenKodes.has(kodeSatker)) continue;
          seenKodes.add(kodeSatker);

          // CHECK MASTER SATKER
          const master = masterMap.get(kodeSatker);
          if (master && master.isActive === false) {
            invalidRows.push({
              rowNumber: r + 1,
              kodeSatker,
              namaSatker: master.namaSatker,
              reason: 'Satker berstatus NONAKTIF di Master Data (Disembunyikan)'
            });
            continue;
          }

          if (!master) {
            unregisteredSatkers.push({
              kodeSatker,
              namaSatker: namaSatkerFromRow || `Satker ${kodeSatker}`,
              reason: 'Kode Satker belum terdaftar di Master Data Referensi (Otomatis dibuatkan referensi)'
            });
          }

          // Parse IKPA Indicators using detected col or standard OM-SPAN column indices
          // Col H (7): Revisi DIPA, Col I (8): Deviasi, Col K (10): Penyerapan, Col L (11): Kontraktual
          // Col M (12): Tagihan, Col N (13): UP/TUP, Col P (15): Capaian Output, Col T (19): Dispensasi
          const revisiDipa = colRevisi !== -1 
            ? parseFormattedNumber(row[colRevisi], 100) 
            : (row.length > 7 ? parseFormattedNumber(row[7], 100) : 100);

          const deviasiHal3Dipa = colDeviasi !== -1 
            ? parseFormattedNumber(row[colDeviasi], 100) 
            : (row.length > 8 ? parseFormattedNumber(row[8], 100) : 100);

          const penyerapanAnggaran = colPenyerapan !== -1 
            ? parseFormattedNumber(row[colPenyerapan], 0) 
            : (row.length > 10 ? parseFormattedNumber(row[10], 0) : 0);

          const belanjaKontraktual = colKontraktual !== -1 
            ? parseFormattedNumber(row[colKontraktual], 0) 
            : (row.length > 11 ? parseFormattedNumber(row[11], 0) : 0);

          const penyelesaianTagihan = colTagihan !== -1 
            ? parseFormattedNumber(row[colTagihan], 0) 
            : (row.length > 12 ? parseFormattedNumber(row[12], 0) : 0);

          const pengelolaanUpTup = colUpTup !== -1 
            ? parseFormattedNumber(row[colUpTup], 0) 
            : (row.length > 13 ? parseFormattedNumber(row[13], 0) : 0);

          const capaianOutput = colCapaianOutput !== -1 
            ? parseFormattedNumber(row[colCapaianOutput], 0) 
            : (row.length > 15 ? parseFormattedNumber(row[15], 0) : 0);

          const dispensasiSpm = colDispensasi !== -1 
            ? parseFormattedNumber(row[colDispensasi], 0) 
            : (row.length > 19 ? parseFormattedNumber(row[19], 0) : 0);

          const paguAnggaran = colPagu !== -1 ? parseFormattedNumber(row[colPagu], 0) : 0;
          const realisasiAnggaran = colRealisasi !== -1 ? parseFormattedNumber(row[colRealisasi], 0) : 0;
          const persenPenyerapan = paguAnggaran > 0 ? Number(((realisasiAnggaran / paguAnggaran) * 100).toFixed(2)) : 0;

          const indikator = {
            revisiDipa: Math.min(100, Math.max(0, revisiDipa)),
            deviasiHal3Dipa: Math.min(100, Math.max(0, deviasiHal3Dipa)),
            penyerapanAnggaran: Math.min(100, Math.max(0, penyerapanAnggaran)),
            belanjaKontraktual: Math.min(100, Math.max(0, belanjaKontraktual)),
            penyelesaianTagihan: Math.min(100, Math.max(0, penyelesaianTagihan)),
            pengelolaanUpTup: Math.min(100, Math.max(0, pengelolaanUpTup)),
            dispensasiSpm: Math.min(100, Math.max(0, dispensasiSpm)),
            capaianOutput: Math.min(100, Math.max(0, capaianOutput))
          };

          let calculatedTotal = 0;
          if (colNilaiAkhir !== -1 && parseFormattedNumber(row[colNilaiAkhir]) > 0) {
            calculatedTotal = parseFormattedNumber(row[colNilaiAkhir]);
          } else if (row.length > 20 && parseFormattedNumber(row[20]) > 0) {
            calculatedTotal = parseFormattedNumber(row[20]);
          } else if (row.length > 21 && parseFormattedNumber(row[21]) > 0) {
            calculatedTotal = parseFormattedNumber(row[21]);
          } else {
            calculatedTotal = hitungTotalIKPA(indikator);
          }

          const predikat = getPredikatIKPA(calculatedTotal);

          const record: IKPARecord = {
            id: `ikpa-${kodeSatker}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            kodeSatker,
            namaSatker: master?.namaSatker || namaSatkerFromRow || `Satker ${kodeSatker}`,
            kementerianLembaga: master?.kementerianLembaga || 'Kementerian / Lembaga Mitra',
            unitEselon1: master?.unitEselon1 || '',
            paguAnggaran,
            realisasiAnggaran,
            persenPenyerapan,
            nilaiTotalIKPA: calculatedTotal,
            predikat,
            indikator,
            periode: periodeFormatted,
            tahun,
            updatedAt: new Date().toISOString()
          };

          validData.push(record);
        }

        resolve({
          file,
          fileName: file.name,
          fileSize: file.size,
          modul: 'IKPA',
          tahun,
          periode: periodeFormatted,
          totalRows: validData.length + invalidRows.length,
          validData,
          invalidRows,
          unregisteredSatkers,
          isValidFormat: validData.length > 0,
          formatErrors: validData.length === 0 ? ['Tidak ada data satker yang valid untuk diimpor.'] : []
        });

      } catch (err: any) {
        reject(new Error(err.message || 'Gagal memproses file Excel IKPA'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari disk.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 2. VALIDASI & PREVIEW EXCEL CAPAIAN OUTPUT TERISOLASI TERHADAP MASTER SATKER
 */
export async function validateCapaianOutputExcelFile(
  file: File,
  masterSatkers: MasterSatker[],
  forcedPeriod?: string,
  forcedYear?: number
): Promise<ExcelValidationPreview<CapaianOutputRecord>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!matrix || matrix.length === 0) {
          throw new Error('File Excel Capaian Output kosong.');
        }

        const masterMap = new Map<string, MasterSatker>();
        masterSatkers.forEach(m => {
          if (m.kodeSatker) masterMap.set(m.kodeSatker.trim(), m);
        });

        let detectedMonth = forcedPeriod || 'Agustus';
        const tahun = forcedYear || 2026;
        const periodeFormatted = `${detectedMonth} ${tahun}`;

        // Find columns
        let headerRow = -1;
        let colKode = -1;
        let colNama = -1;
        let colTargetRO = -1;
        let colTerlaporkanRO = -1;
        let colPersen = -1;
        let colStatus = -1;

        for (let r = 0; r < Math.min(25, matrix.length); r++) {
          const row = matrix[r];
          if (!row) continue;
          const rowLower = row.map(c => String(c).toLowerCase().trim());
          if (rowLower.some(c => c.includes('satker') || c.includes('output') || c.includes('rincian') || c.includes('ro'))) {
            headerRow = r;
            rowLower.forEach((val, idx) => {
              if (val.includes('kode') || val === 'kdsatker' || val === 'kd satker') {
                if (colKode === -1) colKode = idx;
              } else if (val.includes('nama satker') || val === 'uraian satker') {
                if (colNama === -1) colNama = idx;
              } else if (val.includes('target') || val.includes('jumlah ro')) {
                if (colTargetRO === -1) colTargetRO = idx;
              } else if (val.includes('terlaporkan') || val.includes('sudah lapor')) {
                if (colTerlaporkanRO === -1) colTerlaporkanRO = idx;
              } else if (val.includes('persen') || val.includes('progres') || val.includes('%')) {
                if (colPersen === -1) colPersen = idx;
              } else if (val.includes('status') || val.includes('keterangan')) {
                if (colStatus === -1) colStatus = idx;
              }
            });
            break;
          }
        }

        if (colKode === -1) colKode = 1;
        if (colNama === -1) colNama = 2;

        const validData: CapaianOutputRecord[] = [];
        const invalidRows: any[] = [];
        const unregisteredSatkers: any[] = [];
        const seenKodes = new Set<string>();

        const startRow = headerRow !== -1 ? headerRow + 1 : 1;

        for (let r = startRow; r < matrix.length; r++) {
          const row = matrix[r];
          if (!row || row.length === 0) continue;

          const rawKode = row[colKode] || row[0] || '';
          const kodeSatker = normalizeKodeSatker(rawKode);
          const rawNama = cleanText(row[colNama] || '');

          if (!kodeSatker || kodeSatker.length < 5) continue;
          if (seenKodes.has(kodeSatker)) continue;
          seenKodes.add(kodeSatker);

          const master = masterMap.get(kodeSatker);
          if (master && master.isActive === false) {
            invalidRows.push({
              rowNumber: r + 1,
              kodeSatker,
              namaSatker: master.namaSatker,
              reason: 'Satker Nonaktif di Master Data'
            });
            continue;
          }

          if (!master) {
            unregisteredSatkers.push({
              kodeSatker,
              namaSatker: rawNama || `Satker ${kodeSatker}`,
              reason: 'Kode Satker belum terdaftar di Master Referensi (Otomatis dibuatkan referensi)'
            });
          }

          const targetRO = colTargetRO !== -1 ? Math.max(1, parseFormattedNumber(row[colTargetRO], 10)) : 10;
          const terlaporkanRO = colTerlaporkanRO !== -1 ? parseFormattedNumber(row[colTerlaporkanRO], targetRO) : targetRO;
          const persen = colPersen !== -1 ? parseFormattedNumber(row[colPersen], Number(((terlaporkanRO / targetRO) * 100).toFixed(1))) : Number(((terlaporkanRO / targetRO) * 100).toFixed(1));

          let status: 'Sudah Terlaporkan' | 'Belum Terlaporkan' | 'Terlambat' = 'Sudah Terlaporkan';
          if (colStatus !== -1 && row[colStatus]) {
            const st = String(row[colStatus]).toLowerCase();
            if (st.includes('belum') || st.includes('tidak')) status = 'Belum Terlaporkan';
            else if (st.includes('lambat') || st.includes('terlambat')) status = 'Terlambat';
          } else {
            if (persen < 90) status = 'Belum Terlaporkan';
          }

          validData.push({
            id: `caput-${kodeSatker}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            kodeSatker,
            namaSatker: master?.namaSatker || rawNama || `Satker ${kodeSatker}`,
            kementerianLembaga: master?.kementerianLembaga || 'Kementerian / Lembaga Mitra',
            unitEselon1: master?.unitEselon1 || '',
            periode: periodeFormatted,
            tahun,
            targetRO,
            terlaporkanRO,
            persenCapaianOutput: Math.min(100, Math.max(0, persen)),
            statusCapaianOutput: status,
            updatedAt: new Date().toISOString()
          });
        }

        resolve({
          file,
          fileName: file.name,
          fileSize: file.size,
          modul: 'CAPAIAN_OUTPUT',
          tahun,
          periode: periodeFormatted,
          totalRows: validData.length + invalidRows.length,
          validData,
          invalidRows,
          unregisteredSatkers,
          isValidFormat: validData.length > 0,
          formatErrors: validData.length === 0 ? ['Tidak ditemukan baris data capaian output yang valid.'] : []
        });

      } catch (err: any) {
        reject(new Error(err.message || 'Gagal memproses file Excel Capaian Output'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file Capaian Output.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 3. VALIDASI & PREVIEW EXCEL PENGELOLAAN UP TERISOLASI (FOKUS KOLOM N: BATAS REVOLVING)
 */
export async function validatePengelolaanUPExcelFile(
  file: File,
  masterSatkers: MasterSatker[],
  forcedPeriod?: string,
  forcedYear?: number
): Promise<ExcelValidationPreview<PengelolaanUPRecord>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!matrix || matrix.length === 0) {
          throw new Error('File Excel Pengelolaan UP kosong.');
        }

        const masterMap = new Map<string, MasterSatker>();
        masterSatkers.forEach(m => {
          if (m.kodeSatker) masterMap.set(m.kodeSatker.trim(), m);
        });

        let detectedMonth = forcedPeriod || 'Agustus';
        const tahun = forcedYear || 2026;
        const periodeFormatted = `${detectedMonth} ${tahun}`;

        // Find headers
        let headerRow = -1;
        let colKode = -1;
        let colNama = -1;
        let colPaguUP = -1;
        let colNilaiUP = -1;
        let colRealisasiGUP = -1;
        let colSisaUP = -1;
        let colPersenRevolving = -1;
        let colFrekuensi = -1;
        let colTglSP2D = -1;
        let colNoSP2D = -1;
        let colBatasRevolving = -1; // Kolom N (Batas Revolving / Jatuh Tempo)

        for (let r = 0; r < Math.min(25, matrix.length); r++) {
          const row = matrix[r];
          if (!row) continue;
          const rowLower = row.map(c => String(c).toLowerCase().trim());
          if (rowLower.some(c => c.includes('satker') || c.includes('up') || c.includes('gup') || c.includes('revolving') || c.includes('batas'))) {
            headerRow = r;
            rowLower.forEach((val, idx) => {
              if (val.includes('kode') || val === 'kdsatker' || val === 'kd satker') {
                if (colKode === -1) colKode = idx;
              } else if (val.includes('nama satker') || val === 'uraian' || val === 'satker') {
                if (colNama === -1) colNama = idx;
              } else if (val.includes('pagu up') || val.includes('dipa up') || val.includes('pagu')) {
                if (colPaguUP === -1) colPaguUP = idx;
              } else if (val.includes('nilai up') || val.includes('besaran up') || val === 'up' || val.includes('jumlah up')) {
                if (colNilaiUP === -1) colNilaiUP = idx;
              } else if (val.includes('gup') || val.includes('realisasi gup') || val.includes('revolving gup') || val.includes('pertanggungjawaban')) {
                if (colRealisasiGUP === -1) colRealisasiGUP = idx;
              } else if (val.includes('sisa') || val.includes('saldo')) {
                if (colSisaUP === -1) colSisaUP = idx;
              } else if (val.includes('revolving') && (val.includes('persen') || val.includes('%') || val.includes('rasio'))) {
                if (colPersenRevolving === -1) colPersenRevolving = idx;
              } else if (val.includes('frekuensi') || val.includes('kali') || val.includes('jumlah gup')) {
                if (colFrekuensi === -1) colFrekuensi = idx;
              } else if (val.includes('no sp2d') || val.includes('nomor sp2d')) {
                if (colNoSP2D === -1) colNoSP2D = idx;
              } else if (val.includes('tgl sp2d') || val.includes('tanggal sp2d') || val.includes('sp2d terakhir')) {
                if (colTglSP2D === -1) colTglSP2D = idx;
              } else if (val.includes('batas revolving') || val.includes('batas akhir') || val.includes('jatuh tempo') || val.includes('batas waktu')) {
                if (colBatasRevolving === -1) colBatasRevolving = idx;
              }
            });
            break;
          }
        }

        // Fallback default columns: Kolom N is index 13 (0-based)
        if (colKode === -1) colKode = 1;
        if (colNama === -1) colNama = 2;
        if (colBatasRevolving === -1) colBatasRevolving = 13; // Kolom N (14th column = index 13)

        const validData: PengelolaanUPRecord[] = [];
        const invalidRows: any[] = [];
        const unregisteredSatkers: any[] = [];
        const seenKodes = new Set<string>();

        const startRow = headerRow !== -1 ? headerRow + 1 : 1;

        for (let r = startRow; r < matrix.length; r++) {
          const row = matrix[r];
          if (!row || row.length === 0) continue;

          const rowUpper = row.map(c => String(c || '').trim().toUpperCase()).join(' ');
          if (rowUpper.includes('JUMLAH') || rowUpper.includes('TOTAL') || rowUpper.includes('RATA-RATA')) {
            continue;
          }

          const rawKode = row[colKode] || row[0] || '';
          const kodeSatker = normalizeKodeSatker(rawKode);
          const rawNama = cleanText(row[colNama] || '');

          if (!kodeSatker || kodeSatker.length < 5) continue;
          if (seenKodes.has(kodeSatker)) continue;
          seenKodes.add(kodeSatker);

          const master = masterMap.get(kodeSatker);
          if (master && master.isActive === false) {
            invalidRows.push({
              rowNumber: r + 1,
              kodeSatker,
              namaSatker: master.namaSatker,
              reason: 'Satker berstatus Nonaktif'
            });
            continue;
          }

          if (!master) {
            unregisteredSatkers.push({
              kodeSatker,
              namaSatker: rawNama || `Satker ${kodeSatker}`,
              reason: 'Kode Satker belum terdaftar di Master Data Referensi (Otomatis dibuatkan referensi)'
            });
          }

          const nilaiUP = colNilaiUP !== -1 ? parseFormattedNumber(row[colNilaiUP], 50000000) : 50000000;
          const paguUP = colPaguUP !== -1 ? parseFormattedNumber(row[colPaguUP], nilaiUP * 12) : nilaiUP * 12;
          const realisasiGUP = colRealisasiGUP !== -1 ? parseFormattedNumber(row[colRealisasiGUP], nilaiUP * 0.8) : nilaiUP * 0.8;
          const sisaUP = colSisaUP !== -1 ? parseFormattedNumber(row[colSisaUP], Math.max(0, nilaiUP - realisasiGUP)) : Math.max(0, nilaiUP - realisasiGUP);
          
          let persenRevolving = colPersenRevolving !== -1 ? parseFormattedNumber(row[colPersenRevolving]) : (nilaiUP > 0 ? (realisasiGUP / nilaiUP) * 100 : 0);
          persenRevolving = Number(persenRevolving.toFixed(1));

          const frekuensiGUP = colFrekuensi !== -1 ? Math.max(0, parseInt(String(row[colFrekuensi])) || 1) : 1;
          const nomorSp2dTerakhir = colNoSP2D !== -1 ? cleanText(row[colNoSP2D]) : undefined;
          const tglTerakhirSP2D = colTglSP2D !== -1 ? (parseExcelDateString(row[colTglSP2D]) || cleanText(row[colTglSP2D]) || '-') : '-';

          // PARSE KOLOM N (BATAS REVOLVING)
          const rawBatas = colBatasRevolving !== -1 && row[colBatasRevolving] !== undefined && row[colBatasRevolving] !== '' 
            ? row[colBatasRevolving] 
            : (row[13] !== undefined && row[13] !== '' ? row[13] : '25-08-2026');

          const deadlineEval = evaluateDeadlineDate(rawBatas);
          const formattedHariTanggal = deadlineEval.dayName && deadlineEval.formattedDate && deadlineEval.formattedDate !== '-'
            ? `${deadlineEval.dayName}, ${deadlineEval.formattedDate}`
            : deadlineEval.formattedDate;

          let statusRevolving: 'Sangat Baik' | 'Optimal' | 'Lambat / Kritis' | 'Belum Revolving' = 'Optimal';
          if (deadlineEval.isOverdue) {
            statusRevolving = 'Lambat / Kritis';
          } else if (persenRevolving >= 100) {
            statusRevolving = 'Sangat Baik';
          } else if (persenRevolving >= 75) {
            statusRevolving = 'Optimal';
          } else if (persenRevolving > 0) {
            statusRevolving = 'Lambat / Kritis';
          } else {
            statusRevolving = 'Belum Revolving';
          }

          const record: PengelolaanUPRecord = {
            id: `up-${kodeSatker}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            kodeSatker,
            namaSatker: master?.namaSatker || rawNama || `Satker ${kodeSatker}`,
            kementerianLembaga: master?.kementerianLembaga || 'Kementerian / Lembaga Mitra',
            kodeBa: master?.kodeBa || '',
            jenisDana: 'UP',
            paguUP,
            nilaiUP,
            realisasiGUP,
            totalRevolvingGUP: realisasiGUP,
            persenRevolving,
            sisaUP,
            persentaseRevolving: persenRevolving,
            frekuensiGUP,
            statusRevolving,
            nomorSp2dTerakhir,
            tglTerakhirSP2D,
            batasRevolving: formattedHariTanggal,
            batasRevolvingKolomN: formattedHariTanggal,
            sisaHariBatasRevolving: deadlineEval.sisaHari,
            isJatuhTempo1Minggu: deadlineEval.is1Minggu,
            isOverdue: deadlineEval.isOverdue,
            isHariLibur: deadlineEval.isWeekend,
            saranTglPengajuan: deadlineEval.saranTglPengajuan,
            hariTanpaRevolving: deadlineEval.isOverdue ? Math.abs(deadlineEval.sisaHari) + 30 : (persenRevolving < 50 ? 32 : 12),
            peringatanKritis: statusRevolving === 'Lambat / Kritis' || statusRevolving === 'Belum Revolving' || deadlineEval.isOverdue || (deadlineEval.is1Minggu && persenRevolving < 75),
            keterangan: deadlineEval.isOverdue
              ? 'TELAH MELEWATI BATAS REVOLVING! Segera ajukan SPM GUP.'
              : deadlineEval.isWeekend
              ? `Jatuh tempo bertepatan hari ${deadlineEval.dayName}. Wajib diajukan hari kerja sebelum libur (${deadlineEval.saranTglPengajuan})!`
              : deadlineEval.is1Minggu
              ? `Jatuh tempo dalam ${deadlineEval.sisaHari} hari (${formattedHariTanggal}). Segera ajukan SPM GUP.`
              : 'Revolving berjalan normal.',
            periode: periodeFormatted,
            tahun,
            updatedAt: new Date().toISOString()
          };

          validData.push(record);
        }

        resolve({
          file,
          fileName: file.name,
          fileSize: file.size,
          modul: 'PENGELOLAAN_UP',
          tahun,
          periode: periodeFormatted,
          totalRows: validData.length + invalidRows.length,
          validData,
          invalidRows,
          unregisteredSatkers,
          isValidFormat: validData.length > 0,
          formatErrors: validData.length === 0 ? ['Format file Pengelolaan UP tidak sesuai atau kosong.'] : []
        });

      } catch (err: any) {
        reject(new Error(err.message || 'Gagal memproses file Excel Pengelolaan UP'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file Pengelolaan UP.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 3B. VALIDASI & PREVIEW EXCEL KARWAS TUP TERISOLASI (FOKUS KOLOM H: BATAS WAKTU PERTANGGUNGJAWABAN)
 */
export async function validateKarwasTUPExcelFile(
  file: File,
  masterSatkers: MasterSatker[],
  forcedPeriod?: string,
  forcedYear?: number
): Promise<ExcelValidationPreview<KarwasTUPRecord>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!matrix || matrix.length === 0) {
          throw new Error('File Excel Karwas TUP kosong.');
        }

        const masterMap = new Map<string, MasterSatker>();
        masterSatkers.forEach(m => {
          if (m.kodeSatker) masterMap.set(m.kodeSatker.trim(), m);
        });

        let detectedMonth = forcedPeriod || 'Agustus';
        const tahun = forcedYear || 2026;
        const periodeFormatted = `${detectedMonth} ${tahun}`;

        // Find headers
        let headerRow = -1;
        let colKode = -1;
        let colNama = -1;
        let colNoSurat = -1;
        let colTglSurat = -1;
        let colNoSP2D = -1;
        let colTglSP2D = -1;
        let colNilaiTUP = -1;
        let colBatasWaktuTUP = -1; // Kolom H (Batas Waktu TUP / Pertanggungjawaban)
        let colRealisasi = -1;
        let colSisaTUP = -1;
        let colStatus = -1;

        for (let r = 0; r < Math.min(25, matrix.length); r++) {
          const row = matrix[r];
          if (!row) continue;
          const rowLower = row.map(c => String(c).toLowerCase().trim());
          if (rowLower.some(c => c.includes('satker') || c.includes('tup') || c.includes('surat') || c.includes('sp2d') || c.includes('batas'))) {
            headerRow = r;
            rowLower.forEach((val, idx) => {
              if (val.includes('kode') || val === 'kdsatker' || val === 'kd satker') {
                if (colKode === -1) colKode = idx;
              } else if (val.includes('nama satker') || val === 'uraian' || val === 'satker') {
                if (colNama === -1) colNama = idx;
              } else if (val.includes('surat') || val.includes('persetujuan') || val.includes('no surat')) {
                if (colNoSurat === -1) colNoSurat = idx;
              } else if (val.includes('tgl surat') || val.includes('tgl persetujuan')) {
                if (colTglSurat === -1) colTglSurat = idx;
              } else if (val.includes('no sp2d') || val.includes('nomor sp2d')) {
                if (colNoSP2D === -1) colNoSP2D = idx;
              } else if (val.includes('tgl sp2d') || val.includes('tanggal sp2d')) {
                if (colTglSP2D === -1) colTglSP2D = idx;
              } else if (val.includes('nilai tup') || val.includes('jumlah tup') || val === 'tup' || val.includes('besaran')) {
                if (colNilaiTUP === -1) colNilaiTUP = idx;
              } else if (val.includes('batas') || val.includes('jatuh tempo') || val.includes('batas waktu') || val.includes('tenggat')) {
                if (colBatasWaktuTUP === -1) colBatasWaktuTUP = idx;
              } else if (val.includes('realisasi') || val.includes('pertanggungjawaban') || val.includes('gtup') || val.includes('ptup')) {
                if (colRealisasi === -1) colRealisasi = idx;
              } else if (val.includes('sisa') || val.includes('saldo')) {
                if (colSisaTUP === -1) colSisaTUP = idx;
              } else if (val.includes('status') || val.includes('keterangan')) {
                if (colStatus === -1) colStatus = idx;
              }
            });
            break;
          }
        }

        // Fallback default columns: Kolom H is index 7 (0-based)
        if (colKode === -1) colKode = 1;
        if (colNama === -1) colNama = 2;
        if (colBatasWaktuTUP === -1) colBatasWaktuTUP = 7; // Kolom H (8th column = index 7)

        const validData: KarwasTUPRecord[] = [];
        const invalidRows: any[] = [];
        const unregisteredSatkers: any[] = [];
        const seenKodes = new Set<string>();

        const startRow = headerRow !== -1 ? headerRow + 1 : 1;

        for (let r = startRow; r < matrix.length; r++) {
          const row = matrix[r];
          if (!row || row.length === 0) continue;

          const rowUpper = row.map(c => String(c || '').trim().toUpperCase()).join(' ');
          if (rowUpper.includes('JUMLAH') || rowUpper.includes('TOTAL') || rowUpper.includes('RATA-RATA')) {
            continue;
          }

          const rawKode = row[colKode] || row[0] || '';
          const kodeSatker = normalizeKodeSatker(rawKode);
          const rawNama = cleanText(row[colNama] || '');

          if (!kodeSatker || kodeSatker.length < 5) continue;
          if (seenKodes.has(kodeSatker)) continue;
          seenKodes.add(kodeSatker);

          const master = masterMap.get(kodeSatker);
          if (master && master.isActive === false) {
            invalidRows.push({
              rowNumber: r + 1,
              kodeSatker,
              namaSatker: master.namaSatker,
              reason: 'Satker berstatus Nonaktif'
            });
            continue;
          }

          if (!master) {
            unregisteredSatkers.push({
              kodeSatker,
              namaSatker: rawNama || `Satker ${kodeSatker}`,
              reason: 'Kode Satker belum terdaftar di Master Data Referensi (Otomatis dibuatkan referensi)'
            });
          }

          const nilaiTUP = colNilaiTUP !== -1 ? parseFormattedNumber(row[colNilaiTUP], 100000000) : 100000000;
          const realisasiPertanggungjawaban = colRealisasi !== -1 ? parseFormattedNumber(row[colRealisasi], 0) : 0;
          const sisaTUP = colSisaTUP !== -1 ? parseFormattedNumber(row[colSisaTUP], Math.max(0, nilaiTUP - realisasiPertanggungjawaban)) : Math.max(0, nilaiTUP - realisasiPertanggungjawaban);
          const persenPertanggungjawaban = nilaiTUP > 0 ? Number(((realisasiPertanggungjawaban / nilaiTUP) * 100).toFixed(1)) : 0;

          const nomorSuratPersetujuan = colNoSurat !== -1 ? cleanText(row[colNoSurat]) : '-';
          const tglPersetujuan = colTglSurat !== -1 ? cleanText(row[colTglSurat]) : '-';
          const nomorSp2dTUP = colNoSP2D !== -1 ? cleanText(row[colNoSP2D]) : '-';
          const tglSp2dTUP = colTglSP2D !== -1 ? cleanText(row[colTglSP2D]) : '-';

          // PARSE KOLOM H (BATAS WAKTU TUP)
          const rawBatas = colBatasWaktuTUP !== -1 && row[colBatasWaktuTUP] !== undefined && row[colBatasWaktuTUP] !== ''
            ? row[colBatasWaktuTUP]
            : (row[7] !== undefined && row[7] !== '' ? row[7] : '25-08-2026');

          const deadlineEval = evaluateDeadlineDate(rawBatas);
          const formattedHariTanggal = deadlineEval.dayName && deadlineEval.formattedDate && deadlineEval.formattedDate !== '-'
            ? `${deadlineEval.dayName}, ${deadlineEval.formattedDate}`
            : deadlineEval.formattedDate;

          let statusTUP: 'Lunas / Selesai' | 'Dalam Proses' | 'Kritis / Segera Jatuh Tempo' | 'Lewat Batas Waktu' = 'Dalam Proses';
          if (persenPertanggungjawaban >= 100 || sisaTUP <= 0) {
            statusTUP = 'Lunas / Selesai';
          } else if (deadlineEval.isOverdue) {
            statusTUP = 'Lewat Batas Waktu';
          } else if (deadlineEval.is1Minggu) {
            statusTUP = 'Kritis / Segera Jatuh Tempo';
          } else {
            statusTUP = 'Dalam Proses';
          }

          const record: KarwasTUPRecord = {
            id: `tup-${kodeSatker}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            kodeSatker,
            namaSatker: master?.namaSatker || rawNama || `Satker ${kodeSatker}`,
            kementerianLembaga: master?.kementerianLembaga || 'Kementerian / Lembaga Mitra',
            kodeBa: master?.kodeBa || '',
            jenisDana: 'TUP',
            nomorSuratPersetujuan,
            tglPersetujuan,
            nomorSp2dTUP,
            tglSp2dTUP,
            nilaiTUP,
            realisasiPertanggungjawaban,
            sisaTUP,
            persenPertanggungjawaban,
            batasWaktuTUP: formattedHariTanggal,
            batasWaktuTUPKolomH: formattedHariTanggal,
            sisaHariBatasWaktuTUP: deadlineEval.sisaHari,
            isJatuhTempo1Minggu: deadlineEval.is1Minggu,
            isOverdue: deadlineEval.isOverdue,
            isHariLibur: deadlineEval.isWeekend,
            saranTglPengajuan: deadlineEval.saranTglPengajuan,
            statusTUP,
            keterangan: statusTUP === 'Lunas / Selesai'
              ? 'TUP telah lunas dan dipertanggungjawabkan 100%.'
              : deadlineEval.isOverdue
              ? 'MELEWATI BATAS WAKTU 30 HARI! Wajib segera menyetorkan sisa dana TUP ke Kas Negara.'
              : deadlineEval.isWeekend
              ? `Jatuh tempo hari ${deadlineEval.dayName}. Harap diajukan SPM PTUP / Setor pada hari kerja sebelum libur (${deadlineEval.saranTglPengajuan})!`
              : deadlineEval.is1Minggu
              ? `Batas waktu tersisa ${deadlineEval.sisaHari} hari (${formattedHariTanggal}). Segera pertanggungjawabkan.`
              : 'Dalam masa pertanggungjawaban 30 hari.',
            periode: periodeFormatted,
            tahun,
            updatedAt: new Date().toISOString()
          };

          validData.push(record);
        }

        resolve({
          file,
          fileName: file.name,
          fileSize: file.size,
          modul: 'PENGELOLAAN_UP',
          tahun,
          periode: periodeFormatted,
          totalRows: validData.length + invalidRows.length,
          validData: validData as any,
          invalidRows,
          unregisteredSatkers,
          isValidFormat: validData.length > 0,
          formatErrors: validData.length === 0 ? ['Format file Karwas TUP tidak sesuai atau kosong.'] : []
        });

      } catch (err: any) {
        reject(new Error(err.message || 'Gagal memproses file Excel Karwas TUP'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file Karwas TUP.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Helper to match Satker Name to Master Satker if Kode is not provided
 */
function findSatkerByNameOrCode(rawKode: string, rawName: string, masterSatkers: MasterSatker[]): { kode: string; nama: string; kl?: string } {
  const cleanKode = normalizeKodeSatker(rawKode);
  if (cleanKode && cleanKode.length >= 5) {
    const matched = masterSatkers.find(m => m.kodeSatker === cleanKode);
    if (matched) return { kode: matched.kodeSatker, nama: matched.namaSatker, kl: matched.kementerianLembaga };
  }

  const normName = cleanText(rawName).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normName) {
    const directMatch = masterSatkers.find(m => m.namaSatker.toUpperCase().replace(/[^A-Z0-9]/g, '') === normName);
    if (directMatch) return { kode: directMatch.kodeSatker, nama: directMatch.namaSatker, kl: directMatch.kementerianLembaga };

    // Partial contains
    const partialMatch = masterSatkers.find(m => {
      const mNorm = m.namaSatker.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return normName.includes(mNorm) || mNorm.includes(normName);
    });
    if (partialMatch) return { kode: partialMatch.kodeSatker, nama: partialMatch.namaSatker, kl: partialMatch.kementerianLembaga };
  }

  // Fallback
  return {
    kode: cleanKode || (rawName ? `99${Math.abs(rawName.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) % 9000 + 1000)}` : '000000'),
    nama: cleanText(rawName) || `SATKER ${cleanKode || 'KPPN'}`
  };
}

/**
 * 4. VALIDASI & PREVIEW EXCEL PEJABAT PERBENDAHARAAN TERISOLASI
 * Mendukung otomatis:
 * A) File Pejabat Belum Bersertifikat KPPN Semarang I
 * B) File Pejabat Belum Perpanjangan KPPN Semarang I
 * C) File Standar / Multi-Sheet Pejabat
 */
export async function validatePejabatExcelFile(
  file: File,
  masterSatkers: MasterSatker[]
): Promise<ExcelValidationPreview<PejabatSertifikasi>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const validData: PejabatSertifikasi[] = [];
        const invalidRows: any[] = [];
        const unregisteredSatkers: any[] = [];
        let detectedType: string = 'GABUNGAN';

        // Process all sheets in the workbook
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          if (!matrix || matrix.length < 2) return;

          // Detect Header row
          let headerRowIdx = -1;
          const colMap: Record<string, number> = {
            no: -1,
            nip: -1,
            nama: -1,
            jabatan: -1,
            satker: -1,
            kdSatker: -1,
            nmSatker: -1,
            statusSertifikasi: -1,
            statusUsulan: -1,
            statusJabatan: -1,
            noSertifikat: -1,
            tglSertifikat: -1,
            tglKadaluarsa: -1,
            kppn: -1,
            kl: -1,
            tglDownload: -1
          };

          for (let r = 0; r < Math.min(15, matrix.length); r++) {
            const row = matrix[r];
            if (!row || row.length === 0) continue;
            const rowStr = row.map(c => String(c || '').toLowerCase().trim());

            if (rowStr.some(c => c === 'nip' || c.includes('nama') || c.includes('jabatan') || c.includes('satker') || c.includes('sertifikat'))) {
              headerRowIdx = r;
              rowStr.forEach((val, idx) => {
                const clean = val.replace(/[^a-z0-9]/g, '');
                if (clean === 'no' || clean === 'nomor') colMap.no = idx;
                else if (clean === 'nip' || clean.includes('nipofficer')) colMap.nip = idx;
                else if (clean === 'nama' || clean.includes('namapejabat') || clean.includes('namalengkap') || clean.includes('nmpejabat')) colMap.nama = idx;
                else if (clean === 'jabatan' || clean.includes('namajabatan') || clean.includes('nmjabatan') || clean.includes('peran')) colMap.jabatan = idx;
                else if (clean === 'kodesatker' || clean === 'kdsatker' || clean === 'kodesatk') colMap.kdSatker = idx;
                else if (clean === 'namasatker' || clean === 'nmsatker') colMap.nmSatker = idx;
                else if (clean === 'satker') colMap.satker = idx;
                else if (clean.includes('statussertifikasi') || clean === 'status' || clean.includes('statussert')) colMap.statusSertifikasi = idx;
                else if (clean.includes('statususulan') || clean.includes('usulan')) colMap.statusUsulan = idx;
                else if (clean.includes('statusjabatan') || clean.includes('stsjabatan')) colMap.statusJabatan = idx;
                // Specific date checks first before generic "sertifikat"
                else if (clean.includes('tanggalkadaluarsa') || clean.includes('tglkadaluarsa') || clean.includes('kadaluarsa') || clean.includes('tglexpired') || clean.includes('tglberakhir') || clean.includes('tanggalberakhir')) colMap.tglKadaluarsa = idx;
                else if (clean.includes('tanggalsertifikat') || clean.includes('tglsertifikat') || clean.includes('tglterbit') || clean.includes('tanggalterbit') || clean.includes('tglsk') || clean.includes('tanggalsk') || clean.includes('tglberlaku')) colMap.tglSertifikat = idx;
                else if (clean.includes('nomorsertifikat') || clean.includes('nosertifikat') || clean.includes('nosert') || clean.includes('noregister') || clean.includes('nomorreg') || clean.includes('noreg') || (clean.includes('sertifikat') && !clean.includes('tgl') && !clean.includes('tanggal') && !clean.includes('status') && !clean.includes('masa'))) colMap.noSertifikat = idx;
                else if (clean === 'kppn' || clean.includes('namakppn')) colMap.kppn = idx;
                else if (clean === 'kl' || clean.includes('kementerian') || clean.includes('lembaga')) colMap.kl = idx;
                else if (clean.includes('tanggaldownload') || clean.includes('tgldownload')) colMap.tglDownload = idx;
              });
              break;
            }
          }

          if (headerRowIdx === -1) return;

          // Determine if this is Sheet 1 (Belum Bersertifikat) or Sheet 2 (Belum Perpanjangan)
          const isBelumBersertifikatFormat = colMap.noSertifikat === -1 && (colMap.statusUsulan !== -1 || colMap.statusSertifikasi !== -1);
          const isBelumPerpanjanganFormat = colMap.tglKadaluarsa !== -1 || colMap.noSertifikat !== -1;

          if (isBelumBersertifikatFormat && !isBelumPerpanjanganFormat) {
            detectedType = 'BELUM_SERTIFIKAT';
          } else if (isBelumPerpanjanganFormat && !isBelumBersertifikatFormat) {
            detectedType = 'BELUM_PERPANJANGAN';
          }

          // Process rows
          for (let r = headerRowIdx + 1; r < matrix.length; r++) {
            const row = matrix[r];
            if (!row || row.length === 0) continue;

            const nip = colMap.nip !== -1 ? cleanText(row[colMap.nip]) : '';
            const nama = colMap.nama !== -1 ? cleanText(row[colMap.nama]) : '';
            const nmJabatan = colMap.jabatan !== -1 ? cleanText(row[colMap.jabatan]) : 'Pejabat Perbendaharaan';
            
            // Skip empty rows
            if (!nip && !nama) continue;

            const rawKodeSatker = colMap.kdSatker !== -1 ? cleanText(row[colMap.kdSatker]) : '';
            const rawNamaSatker = colMap.nmSatker !== -1 ? cleanText(row[colMap.nmSatker]) : (colMap.satker !== -1 ? cleanText(row[colMap.satker]) : '');
            
            const matchedSatker = findSatkerByNameOrCode(rawKodeSatker, rawNamaSatker, masterSatkers);
            const kodeSatker = matchedSatker.kode;
            const namaSatker = rawNamaSatker || matchedSatker.nama;
            const kementerianLembaga = (colMap.kl !== -1 && cleanText(row[colMap.kl])) ? cleanText(row[colMap.kl]) : (matchedSatker.kl || 'Kementerian / Lembaga Mitra');

            const rawStatusSert = colMap.statusSertifikasi !== -1 ? cleanText(row[colMap.statusSertifikasi]) : '';
            const rawStatusUsulan = colMap.statusUsulan !== -1 ? cleanText(row[colMap.statusUsulan]) : 'Belum rekam usulan';
            const rawStatusJabatan = colMap.statusJabatan !== -1 ? cleanText(row[colMap.statusJabatan]) : 'Aktif';
            let noSertifikat = colMap.noSertifikat !== -1 ? cleanText(row[colMap.noSertifikat]) : '';
            let tglSertifikat = colMap.tglSertifikat !== -1 ? parseExcelDateString(row[colMap.tglSertifikat]) : '';
            let tglKadaluarsa = colMap.tglKadaluarsa !== -1 ? parseExcelDateString(row[colMap.tglKadaluarsa]) : '';
            const kppn = colMap.kppn !== -1 ? cleanText(row[colMap.kppn]) : 'SEMARANG I';
            const tglDownload = colMap.tglDownload !== -1 ? parseExcelDateString(row[colMap.tglDownload]) : new Date().toLocaleDateString('id-ID');

            // Smart validation & normalization for swapped columns / date values
            const isDateString = (str: string) => {
              if (!str) return false;
              const s = str.trim();
              return /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(s) || /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(s);
            };

            // If noSertifikat is actually a date string and tglSertifikat is missing
            if (isDateString(noSertifikat) && (!tglSertifikat || tglSertifikat === '-')) {
              tglSertifikat = parseExcelDateString(noSertifikat);
              noSertifikat = '-';
            } else if (isDateString(noSertifikat) && !isDateString(tglSertifikat) && tglSertifikat && tglSertifikat !== '-') {
              // Swapped: tglSertifikat has the cert number and noSertifikat has the date
              const temp = noSertifikat;
              noSertifikat = tglSertifikat;
              tglSertifikat = parseExcelDateString(temp);
            }

            // Category assignment & days calculation
            let kategoriData: 'BELUM_SERTIFIKAT' | 'BELUM_PERPANJANGAN' | 'TERSERTIFIKASI_AKTIF' = 'BELUM_SERTIFIKAT';
            let statusSertifikasi: 'Belum Tersertifikasi' | 'Belum Perpanjangan' | 'Tersertifikasi' | 'Kadaluarsa' = 'Belum Tersertifikasi';
            let sisaHari = 0;
            let isKadaluarsa = false;
            let isMendekatiKadaluarsa = false;

            if (tglKadaluarsa || (noSertifikat && noSertifikat !== '-' && noSertifikat.toUpperCase() !== 'BELUM ADA' && noSertifikat.toUpperCase() !== 'TIDAK ADA')) {
              kategoriData = 'BELUM_PERPANJANGAN';
              statusSertifikasi = 'Belum Perpanjangan';

              if (tglKadaluarsa) {
                // Parse date format (DD-MM-YYYY or YYYY-MM-DD or DD/MM/YYYY)
                let expDate: Date | null = null;
                if (tglKadaluarsa.includes('-')) {
                  const parts = tglKadaluarsa.split('-');
                  if (parts[0].length === 4) {
                    expDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                  } else if (parts[2].length === 4) {
                    expDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                  }
                } else if (tglKadaluarsa.includes('/')) {
                  const parts = tglKadaluarsa.split('/');
                  if (parts[2].length === 4) {
                    expDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                  }
                }

                if (expDate && !isNaN(expDate.getTime())) {
                  const today = new Date();
                  const diffTime = expDate.getTime() - today.getTime();
                  sisaHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (sisaHari <= 0) {
                    isKadaluarsa = true;
                    statusSertifikasi = 'Kadaluarsa';
                  } else if (sisaHari <= 60) {
                    isMendekatiKadaluarsa = true;
                  }
                }
              }
            } else {
              kategoriData = 'BELUM_SERTIFIKAT';
              statusSertifikasi = 'Belum Tersertifikasi';
              if (!noSertifikat) noSertifikat = 'Belum Ada';
            }

            // Generate smart actionable recommendations
            let catatanRekomendasi = '';
            if (kategoriData === 'BELUM_SERTIFIKAT') {
              if (rawStatusUsulan.toLowerCase().includes('antrean diklat') || rawStatusUsulan.toLowerCase().includes('antrean')) {
                catatanRekomendasi = 'Pantau pemanggilan diklat e-learning / antrean diklat pada portal SWIPE-AP.';
              } else if (rawStatusUsulan.toLowerCase().includes('verifikasi')) {
                catatanRekomendasi = 'Berkas usulan dalam verifikasi unit pembina SIMASPATEN. Cek notifikasi berkala.';
              } else if (rawStatusUsulan.toLowerCase().includes('jadwal') || rawStatusUsulan.toLowerCase().includes('uji kompetensi') || rawStatusUsulan.toLowerCase().includes('ujian')) {
                catatanRekomendasi = 'Pejabat dijadwalkan mengikuti Ujian Kompetensi. Harap persiapkan materi dan hadir tepat waktu sesuai jadwal SIMASPATEN.';
              } else if (rawStatusUsulan.toLowerCase().includes('tidak lulus') || rawStatusUsulan.toLowerCase().includes('tidak memenuhi')) {
                catatanRekomendasi = 'Lengkapi perbaikan berkas persyaratan dan ajukan pendaftaran remedial/ujian ulang di SIMASPATEN.';
              } else {
                catatanRekomendasi = 'Segera rekam usulan kepesertaan penilaian kompetensi pejabat melalui aplikasi SIMASPATEN.';
              }
            } else {
              if (rawStatusJabatan.toLowerCase() === 'aktif') {
                if (isKadaluarsa) {
                  catatanRekomendasi = 'URGENT: Pejabat AKTIF dengan sertifikat Kadaluarsa. Segera ajukan perpanjangan di SIMASPATEN!';
                } else if (isMendekatiKadaluarsa) {
                  catatanRekomendasi = `PRIORITAS TINGGI: Sertifikat pejabat aktif tersisa ${sisaHari} hari. Segera rekam usulan perpanjangan di SIMASPATEN.`;
                } else if (rawStatusUsulan.toLowerCase().includes('admin dsp') || rawStatusUsulan.toLowerCase().includes('kirim')) {
                  catatanRekomendasi = 'Usulan perpanjangan telah dikirim ke Admin DSP. Pantau penerbitan sertifikat baru di SIMASPATEN.';
                } else {
                  catatanRekomendasi = 'Siapkan portofolio PPL dan rekam usulan perpanjangan di SIMASPATEN sebelum masa berlaku berakhir.';
                }
              } else {
                catatanRekomendasi = 'Pejabat berstatus Non-Aktif. Dapat diperpanjang di SIMASPATEN apabila akan ditugaskan kembali di satker.';
              }
            }

            validData.push({
              id: `pejabat-imp-${kodeSatker}-${nip || r}-${Date.now()}`,
              nomor: validData.length + 1,
              nip: nip || `198001012010011${String(r).padStart(3, '0')}`,
              nama: nama || `Pejabat Satker ${kodeSatker}`,
              kdSatker: kodeSatker,
              nmSatker: namaSatker,
              nmJabatan,
              noSertifikat,
              tglSertifikat,
              tglKadaluarsa,
              statusJabatan: rawStatusJabatan || 'Aktif',
              statusUsulan: rawStatusUsulan || 'Belum rekam usulan',
              status: statusSertifikasi,
              statusSertifikasi,
              kategoriData,
              kppn,
              tglDownload,
              sisaHariMasaBerlaku: sisaHari,
              isKadaluarsa,
              isMendekatiKadaluarsa,
              kementerianLembaga,
              catatanRekomendasi,
              keterangan: `${rawStatusSert || statusSertifikasi} - ${rawStatusUsulan || 'Belum Diusulkan'}`
            });
          }
        });

        if (validData.length === 0) {
          throw new Error('Tidak ditemukan data Pejabat yang valid dalam file Excel. Pastikan terdapat kolom NIP, Nama, Satker, atau Jabatan.');
        }

        resolve({
          file,
          fileName: file.name,
          fileSize: file.size,
          modul: 'PEJABAT',
          tahun: 2026,
          periode: detectedType === 'BELUM_SERTIFIKAT' ? 'Pejabat Belum Bersertifikat' : (detectedType === 'BELUM_PERPANJANGAN' ? 'Pejabat Belum Perpanjangan' : 'Semua Pejabat Perbendaharaan'),
          totalRows: validData.length + invalidRows.length,
          validData,
          invalidRows,
          unregisteredSatkers,
          isValidFormat: validData.length > 0,
          formatErrors: []
        });

      } catch (err: any) {
        reject(new Error(err.message || 'Gagal memproses file Excel Pejabat Perbendaharaan.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file Pejabat dari disk.'));
    reader.readAsArrayBuffer(file);
  });
}

// Alias for validatePengelolaanUPExcelFile
export const validateUPExcelFile = validatePengelolaanUPExcelFile;

/**
 * Template Downloads for Modular Categories
 */
export function downloadIKPATemplate() {
  const sampleData = [
    {
      'Kode Satker': '652189',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'Kementerian / Lembaga': 'Kepolisian Negara Republik Indonesia',
      'Pagu Anggaran': 145800000000,
      'Realisasi Anggaran': 112500000000,
      'Revisi DIPA': 95.0,
      'Deviasi Hal III DIPA': 62.5,
      'Penyerapan Anggaran': 77.1,
      'Belanja Kontraktual': 88.0,
      'Penyelesaian Tagihan': 80.0,
      'Pengelolaan UP TUP': 75.0,
      'Dispensasi SPM': 100.0,
      'Capaian Output': 45.0
    },
    {
      'Kode Satker': '015432',
      'Nama Satker': 'KANWIL KEMENTERIAN AGAMA PROVINSI JAWA TENGAH',
      'Kementerian / Lembaga': 'Kementerian Agama',
      'Pagu Anggaran': 210500000000,
      'Realisasi Anggaran': 185400000000,
      'Revisi DIPA': 90.0,
      'Deviasi Hal III DIPA': 70.0,
      'Penyerapan Anggaran': 88.0,
      'Belanja Kontraktual': 92.0,
      'Penyelesaian Tagihan': 85.0,
      'Pengelolaan UP TUP': 90.0,
      'Dispensasi SPM': 100.0,
      'Capaian Output': 50.0
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Format IKPA Satker');
  XLSX.writeFile(workbook, 'Template_Excel_IKPA_KPPN_Semarang1.xlsx');
}

export function downloadCapaianOutputTemplate() {
  const sampleData = [
    {
      'Kode Satker': '652189',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'Target Rincian Output (RO)': 12,
      'Terlaporkan RO': 8,
      'Persentase Capaian (%)': 66.7,
      'Status Capaian Output': 'Belum Terlaporkan'
    },
    {
      'Kode Satker': '015432',
      'Nama Satker': 'KANWIL KEMENTERIAN AGAMA PROVINSI JAWA TENGAH',
      'Target Rincian Output (RO)': 25,
      'Terlaporkan RO': 25,
      'Persentase Capaian (%)': 100,
      'Status Capaian Output': 'Sudah Terlaporkan'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Format Capaian Output');
  XLSX.writeFile(workbook, 'Template_Excel_Capaian_Output_SAKTI.xlsx');
}

export function downloadPengelolaanUPTemplate() {
  const sampleData = [
    {
      'No': 1,
      'Kode Satker': '652189',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'Kementerian Lembaga': 'Kepolisian Negara Republik Indonesia',
      'Pagu UP (Rp)': 1200000000,
      'Nilai Besaran UP (Rp)': 100000000,
      'Realisasi GUP (Rp)': 85000000,
      'Sisa UP (Rp)': 15000000,
      'Persentase Revolving (%)': 85.0,
      'Frekuensi GUP': 4,
      'No SP2D Terakhir': '2602613010045231',
      'Tanggal SP2D Terakhir': '25-07-2026',
      'Hari Tanpa Revolving': 26,
      'Batas Revolving (Kolom N)': '24-08-2026' // Kolom N (Batas Revolving / Jatuh Tempo)
    },
    {
      'No': 2,
      'Kode Satker': '015432',
      'Nama Satker': 'KANWIL KEMENTERIAN AGAMA PROVINSI JAWA TENGAH',
      'Kementerian Lembaga': 'Kementerian Agama',
      'Pagu UP (Rp)': 600000000,
      'Nilai Besaran UP (Rp)': 50000000,
      'Realisasi GUP (Rp)': 12500000,
      'Sisa UP (Rp)': 37500000,
      'Persentase Revolving (%)': 25.0,
      'Frekuensi GUP': 1,
      'No SP2D Terakhir': '2602613010021445',
      'Tanggal SP2D Terakhir': '15-07-2026',
      'Hari Tanpa Revolving': 35,
      'Batas Revolving (Kolom N)': '23-08-2026' // Kolom N (Hari Minggu -> ajukan hari kerja sebelumnya)
    },
    {
      'No': 3,
      'Kode Satker': '415263',
      'Nama Satker': 'KEJAKSAAN TINGGI JAWA TENGAH',
      'Kementerian Lembaga': 'Kejaksaan Republik Indonesia',
      'Pagu UP (Rp)': 800000000,
      'Nilai Besaran UP (Rp)': 70000000,
      'Realisasi GUP (Rp)': 62000000,
      'Sisa UP (Rp)': 8000000,
      'Persentase Revolving (%)': 88.6,
      'Frekuensi GUP': 3,
      'No SP2D Terakhir': '2602613010034112',
      'Tanggal SP2D Terakhir': '28-07-2026',
      'Hari Tanpa Revolving': 23,
      'Batas Revolving (Kolom N)': '27-08-2026'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pengelolaan UP');
  XLSX.writeFile(workbook, 'Template_Excel_Pengelolaan_UP_KolomN.xlsx');
}

export function downloadKarwasTUPTemplate() {
  const sampleData = [
    {
      'No': 1,
      'Kode Satker': '652189',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'No Surat Persetujuan TUP': 'S-452/KPN.1401/2026',
      'Tanggal Surat': '22-07-2026',
      'Nomor SP2D TUP': '2602613020011928',
      'Tanggal SP2D TUP': '25-07-2026',
      'Batas Waktu TUP (Kolom H)': '25-08-2026', // Kolom H (Batas Waktu TUP / Pertanggungjawaban)
      'Nilai TUP (Rp)': 350000000,
      'Realisasi Pertanggungjawaban (Rp)': 280000000,
      'Sisa TUP (Rp)': 70000000,
      'Status TUP': 'Dalam Proses'
    },
    {
      'No': 2,
      'Kode Satker': '015432',
      'Nama Satker': 'KANWIL KEMENTERIAN AGAMA PROVINSI JAWA TENGAH',
      'No Surat Persetujuan TUP': 'S-412/KPN.1401/2026',
      'Tanggal Surat': '20-07-2026',
      'Nomor SP2D TUP': '2602613020009841',
      'Tanggal SP2D TUP': '23-07-2026',
      'Batas Waktu TUP (Kolom H)': '23-08-2026', // Kolom H (Hari Minggu -> Harap diajukan hari kerja sebelumnya)
      'Nilai TUP (Rp)': 500000000,
      'Realisasi Pertanggungjawaban (Rp)': 150000000,
      'Sisa TUP (Rp)': 350000000,
      'Status TUP': 'Kritis / Segera Jatuh Tempo'
    },
    {
      'No': 3,
      'Kode Satker': '652341',
      'Nama Satker': 'PENGADILAN TINGGI SEMARANG',
      'No Surat Persetujuan TUP': 'S-380/KPN.1401/2026',
      'Tanggal Surat': '15-07-2026',
      'Nomor SP2D TUP': '2602613020007621',
      'Tanggal SP2D TUP': '18-07-2026',
      'Batas Waktu TUP (Kolom H)': '18-08-2026',
      'Nilai TUP (Rp)': 180000000,
      'Realisasi Pertanggungjawaban (Rp)': 180000000,
      'Sisa TUP (Rp)': 0,
      'Status TUP': 'Lunas / Selesai'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Karwas TUP');
  XLSX.writeFile(workbook, 'Template_Excel_Karwas_TUP_KolomH.xlsx');
}

export function downloadPejabatBelumBersertifikatTemplate() {
  const sampleData = [
    {
      'NIP': '197503221998031003',
      'Nama': 'SAMBUDI',
      'Jabatan': 'Pejabat Pembuat Komitmen',
      'Satker': 'PENGADILAN AGAMA SEMARANG',
      'Status Sertifikasi': 'Belum Tersertifikasi',
      'Status Usulan': 'Belum rekam usulan',
      'KPPN': 'SEMARANG I',
      'Tanggal Download': '20/8/2026, 16.40.10'
    },
    {
      'NIP': '199103092025052002',
      'Nama': 'RIKA RENI SUSANTI',
      'Jabatan': 'Bendahara Pengeluaran',
      'Satker': 'SEKRETARIAT BAWASLU PROVINSI JAWA TENGAH',
      'Status Sertifikasi': 'Belum Tersertifikasi',
      'Status Usulan': 'Antrean Diklat',
      'KPPN': 'SEMARANG I',
      'Tanggal Download': '20/8/2026, 16.40.10'
    },
    {
      'NIP': '197202182002121002',
      'Nama': 'AHMAD MUDLOFIR',
      'Jabatan': 'Pejabat Pembuat Komitmen',
      'Satker': 'BBPMP PROVINSI JAWA TENGAH',
      'Status Sertifikasi': 'Belum Tersertifikasi',
      'Status Usulan': 'Proses Verifikasi',
      'KPPN': 'SEMARANG I',
      'Tanggal Download': '20/8/2026, 16.40.10'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Belum Bersertifikat');
  XLSX.writeFile(workbook, 'Template_Pejabat_Belum_Bersertifikat_KPPN_Semarang1.xlsx');
}

export function downloadPejabatBelumPerpanjanganTemplate() {
  const sampleData = [
    {
      'No': 1,
      'Nama': 'Adhrial Refaddin',
      'NIP': '197504212008121003',
      'Kode Satker': '723014',
      'Nama Satker': 'LEMBAGA LAYANAN PENDIDIKAN TINGGI WILAYAH VI SEMARANG',
      'Jabatan': 'Calon Pejabat Pembuat Komitmen',
      'Nomor Sertifikat': 'PNT-08581/026/912/2021',
      'Tanggal Sertifikat': '17-09-2021',
      'Tanggal Kadaluarsa': '17-09-2026',
      'Status Jabatan': 'Aktif',
      'Status Usulan': 'Belum Diusulkan',
      'KPPN': 'SEMARANG I',
      'K/L': 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI'
    },
    {
      'No': 2,
      'Nama': 'BEDRU CAHYONO,ST,MT.',
      'NIP': '197404262003121006',
      'Kode Satker': '485355',
      'Nama Satker': 'PERENCANAAN DAN PENGAWASAN JALAN NASIONAL PROVINSI JAWA TENGAH',
      'Jabatan': 'Pejabat Pembuat Komitmen',
      'Nomor Sertifikat': 'PNT-09103/026/323/2021',
      'Tanggal Sertifikat': '30-09-2021',
      'Tanggal Kadaluarsa': '30-09-2026',
      'Status Jabatan': 'Aktif',
      'Status Usulan': 'Belum Diusulkan',
      'KPPN': 'SEMARANG I',
      'K/L': 'KEMENTERIAN PEKERJAAN UMUM DAN PERUMAHAN RAKYAT'
    },
    {
      'No': 3,
      'Nama': 'CHANIF, ST',
      'NIP': '198110182010121005',
      'Kode Satker': '694073',
      'Nama Satker': 'OPERASI DAN PEMELIHARAAN SUMBER DAYA AIR PEMALI JUANA',
      'Jabatan': 'Pejabat Pembuat Komitmen',
      'Nomor Sertifikat': 'PNT-08690/026/933/2021',
      'Tanggal Sertifikat': '22-09-2021',
      'Tanggal Kadaluarsa': '22-09-2026',
      'Status Jabatan': 'Aktif',
      'Status Usulan': 'Di Kirim Ke Admin DSP',
      'KPPN': 'SEMARANG I',
      'K/L': 'KEMENTERIAN PEKERJAAN UMUM'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Belum Perpanjangan');
  XLSX.writeFile(workbook, 'Template_Pejabat_Belum_Perpanjangan_KPPN_Semarang1.xlsx');
}

export function downloadPejabatTemplate() {
  const sampleData = [
    {
      'Kode Satker': '652189',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'Nama Pejabat': 'BAMBANG PRASETYO, S.H.',
      'NIP': '197805122002121001',
      'Jabatan': 'PPK (Pejabat Pembuat Komitmen)',
      'No Sertifikat': 'BNSP-PPK-026-2023-089',
      'Status Sertifikat': 'Aktif',
      'Tanggal Kadaluarsa': '2026-12-31'
    },
    {
      'Kode Satker': '015432',
      'Nama Satker': 'KANWIL KEMENTERIAN AGAMA PROVINSI JAWA TENGAH',
      'Nama Pejabat': 'H. AHMAD FAUZI, M.Ag',
      'NIP': '198103152005011003',
      'Jabatan': 'PPSPM (Pejabat Penandatangan SPM)',
      'No Sertifikat': 'Tidak Ada',
      'Status Sertifikat': 'Belum Tersertifikasi',
      'Tanggal Kadaluarsa': '-'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pejabat Perbendaharaan');
  XLSX.writeFile(workbook, 'Template_Excel_Pejabat_Perbendaharaan.xlsx');
}

/**
 * 6. VALIDASI & IMPORT EXCEL TRANSAKSI GUP KKP (KARTU KREDIT PEMERINTAH)
 * Mematuhi prinsip perlindungan privasi data finansial (Kolom C s.d. I tidak disimpan di publik)
 */
/**
 * Helper to parse any Date format (DD-MM-YYYY, YYYY-MM-DD, Excel Serial, or string)
 * into structured date string, month name, year, and period key (e.g. "Januari 2026").
 */
export function parseDateToPeriod(dateVal: any, fallbackYear = 2026): {
  dateStr: string;
  monthName: string;
  year: number;
  periodKey: string;
} | null {
  if (dateVal === undefined || dateVal === null || dateVal === '') return null;

  // 1. If already Date object
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    const day = String(dateVal.getDate()).padStart(2, '0');
    const mIdx = dateVal.getMonth();
    const yr = dateVal.getFullYear();
    const monthName = INDONESIAN_MONTHS[mIdx] || 'Januari';
    return {
      dateStr: `${day}-${String(mIdx + 1).padStart(2, '0')}-${yr}`,
      monthName,
      year: yr,
      periodKey: `${monthName} ${yr}`
    };
  }

  // 2. If number (Excel serial date number, e.g., 46041)
  if (typeof dateVal === 'number' && !isNaN(dateVal) && dateVal > 20000 && dateVal < 80000) {
    const jsDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
    if (!isNaN(jsDate.getTime())) {
      const day = String(jsDate.getUTCDate()).padStart(2, '0');
      const mIdx = jsDate.getUTCMonth();
      const yr = jsDate.getUTCFullYear();
      const monthName = INDONESIAN_MONTHS[mIdx] || 'Januari';
      return {
        dateStr: `${day}-${String(mIdx + 1).padStart(2, '0')}-${yr}`,
        monthName,
        year: yr,
        periodKey: `${monthName} ${yr}`
      };
    }
  }

  let str = String(dateVal).trim();
  if (!str || str === '-' || str.toLowerCase() === 'tidak ada' || str.toLowerCase() === 'null') return null;

  // Remove timestamp portion if present (e.g. "15/08/2026 10:20:00" or "2026-08-15T00:00:00")
  if (str.includes('T')) {
    str = str.split('T')[0];
  } else if (str.includes(' ')) {
    const spaceParts = str.split(/\s+/);
    // If first part looks like a date (contains - or / or .), keep first part
    if (spaceParts[0] && /[-/.]/.test(spaceParts[0])) {
      str = spaceParts[0];
    }
  }

  // 3. Format: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const mIdx = parseInt(dmyMatch[2], 10) - 1;
    let yr = parseInt(dmyMatch[3], 10);
    if (yr < 100) yr = 2000 + yr; // convert 26 -> 2026
    if (mIdx >= 0 && mIdx < 12) {
      const monthName = INDONESIAN_MONTHS[mIdx];
      return {
        dateStr: `${day}-${String(mIdx + 1).padStart(2, '0')}-${yr}`,
        monthName,
        year: yr,
        periodKey: `${monthName} ${yr}`
      };
    }
  }

  // 4. Format: YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const yr = parseInt(ymdMatch[1], 10);
    const mIdx = parseInt(ymdMatch[2], 10) - 1;
    const day = ymdMatch[3].padStart(2, '0');
    if (mIdx >= 0 && mIdx < 12) {
      const monthName = INDONESIAN_MONTHS[mIdx];
      return {
        dateStr: `${day}-${String(mIdx + 1).padStart(2, '0')}-${yr}`,
        monthName,
        year: yr,
        periodKey: `${monthName} ${yr}`
      };
    }
  }

  // 5. Check if string contains month name in Indonesian or English (e.g. "19 Januari 2026" or "19-Jan-2026" or "19 Aug 2026")
  const fullStr = String(dateVal).trim();
  for (let i = 0; i < INDONESIAN_MONTHS.length; i++) {
    const mName = INDONESIAN_MONTHS[i];
    const mShort = mName.substring(0, 3);
    const regex = new RegExp(`\\b(${mName}|${mShort})\\b`, 'i');
    if (regex.test(fullStr)) {
      const yrMatch = fullStr.match(/\b(202\d)\b/);
      const yr = yrMatch ? parseInt(yrMatch[1], 10) : fallbackYear;
      const dayMatch = fullStr.match(/\b([0-3]?\d)\b/);
      const day = dayMatch ? dayMatch[1].padStart(2, '0') : '01';
      return {
        dateStr: `${day}-${String(i + 1).padStart(2, '0')}-${yr}`,
        monthName: mName,
        year: yr,
        periodKey: `${mName} ${yr}`
      };
    }
  }

  // English month names
  const englishMonths = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const englishShorts = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  for (let i = 0; i < 12; i++) {
    if (new RegExp(`\\b(${englishMonths[i]}|${englishShorts[i]})\\b`, 'i').test(fullStr)) {
      const yrMatch = fullStr.match(/\b(202\d)\b/);
      const yr = yrMatch ? parseInt(yrMatch[1], 10) : fallbackYear;
      const dayMatch = fullStr.match(/\b([0-3]?\d)\b/);
      const day = dayMatch ? dayMatch[1].padStart(2, '0') : '01';
      const mName = INDONESIAN_MONTHS[i];
      return {
        dateStr: `${day}-${String(i + 1).padStart(2, '0')}-${yr}`,
        monthName: mName,
        year: yr,
        periodKey: `${mName} ${yr}`
      };
    }
  }

  return null;
}

/**
 * Helper to convert date string (DD-MM-YYYY or any parseable format) to epoch timestamp
 * for accurate chronological comparisons.
 */
export function parseDateToTimestamp(dateVal: any): number {
  if (!dateVal || dateVal === '-') return 0;
  const p = parseDateToPeriod(dateVal);
  if (!p) return 0;
  const parts = p.dateStr.split('-');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    return new Date(y, m, d).getTime();
  }
  return 0;
}

export async function validateKKPExcelFile(
  file: File,
  masterSatkers: MasterSatker[],
  forcedPeriod?: string,
  forcedYear?: number
): Promise<ExcelValidationPreview<any>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!matrix || matrix.length === 0) {
          throw new Error('File Excel Transaksi KKP kosong.');
        }

        // Master lookup map
        const masterMap = new Map<string, MasterSatker>();
        masterSatkers.forEach(m => {
          if (m.kodeSatker) masterMap.set(m.kodeSatker.trim(), m);
        });

        // Robust Header Search with multi-column scoring
        let headerRowIndex = -1;
        let bestScore = 0;
        let colKodeSatker = -1;
        let colNamaSatker = -1;
        let colNominal = -1;
        let colJumlahTransaksi = -1;
        let colBank = -1;
        let colNoSp2d = -1;
        let colTglSp2d = -1;
        let colKl = -1;

        for (let r = 0; r < Math.min(25, matrix.length); r++) {
          const row = matrix[r];
          if (!row || row.length === 0) continue;
          let score = 0;
          let tKode = -1, tNama = -1, tNom = -1, tJml = -1, tBank = -1, tNoSp2d = -1, tTglSp2d = -1, tKl = -1;

          row.forEach((cell, idx) => {
            const val = String(cell || '').toLowerCase().trim();
            if (!val) return;

            if (val.includes('tanggal sp2d') || val.includes('tgl sp2d') || val.includes('tgl. sp2d') || val.includes('tgl_sp2d') || val.includes('tanggal_sp2d') || val === 'tglsp2d') {
              tTglSp2d = idx;
              score += 4;
            } else if (val.includes('nomor sp2d') || val.includes('no sp2d') || val.includes('no. sp2d') || val.includes('no_sp2d') || val === 'nosp2d' || (val.includes('sp2d') && !val.includes('tgl') && !val.includes('nilai'))) {
              tNoSp2d = idx;
              score += 3;
            } else if (val.includes('nilai transaksi kkp') || val.includes('nilai transaksi') || val.includes('nilai kkp') || val.includes('nilai sp2d') || val.includes('total kkp') || val.includes('jumlah rupiah') || val.includes('rupiah') || val.includes('nominal') || val.includes('nilai (rp)')) {
              tNom = idx;
              score += 4;
            } else if (val.includes('jumlah') && (val.includes('transaksi') || val.includes('sp2d') || val.includes('frekuensi') || val.includes('kali'))) {
              tJml = idx;
              score += 3;
            } else if (val.includes('kode satker') || val === 'kdsatker' || (val.includes('satker') && !val.includes('nama') && !val.includes('uraian'))) {
              tKode = idx;
              score += 3;
            } else if (val.includes('nama satker') || val === 'nmsatker' || val === 'uraian satker') {
              tNama = idx;
              score += 2;
            } else if (val.includes('bank') || val.includes('penerbit') || val.includes('mitra')) {
              tBank = idx;
              score += 2;
            } else if (val.includes('kementerian') || val.includes('lembaga') || val === 'k/l') {
              tKl = idx;
              score += 1;
            }
          });

          if (score > bestScore) {
            bestScore = score;
            headerRowIndex = r;
            colKodeSatker = tKode;
            colNamaSatker = tNama;
            colNominal = tNom;
            colJumlahTransaksi = tJml;
            colBank = tBank;
            colNoSp2d = tNoSp2d;
            colTglSp2d = tTglSp2d;
            colKl = tKl;
          }
        }

        // Fallback default column indices if standard OM-SPAN matrix (NO=A, SATKER=B, SPM=C, NO_SPM=D, TGL_SP2D=E, NO_SP2D=F, NILAI=G)
        if (headerRowIndex === -1 || bestScore < 3) {
          headerRowIndex = 7; // Standard OM-SPAN header at row 8 (0-indexed 7)
        }
        if (colKodeSatker === -1) colKodeSatker = 1;  // Col B: SATKER
        if (colTglSp2d === -1) colTglSp2d = 4;        // Col E: TANGGAL SP2D
        if (colNoSp2d === -1) colNoSp2d = 5;          // Col F: NOMOR SP2D
        if (colNominal === -1) colNominal = 6;        // Col G: Nilai Transaksi KKP (Rp)
        if (colBank === -1 && matrix[0] && matrix[0].length > 7) colBank = 7;

        // Aggregate records per satker and per period month based on Kolom E (Tanggal SP2D)
        const satkerPeriodAggregation = new Map<string, {
          kodeSatker: string;
          namaSatker: string;
          kementerianLembaga: string;
          jumlahTransaksi: number;
          totalNominal: number;
          bankPenerbit: string;
          noSp2dTerakhir: string;
          tglSp2dTerakhir: string;
          periode: string;
          tahun: number;
        }>();

        const invalidRows: { rowNumber: number; kodeSatker: string; namaSatker?: string; reason: string; raw?: any }[] = [];

        for (let r = headerRowIndex + 1; r < matrix.length; r++) {
          const row = matrix[r];
          if (!row || row.length === 0) continue;

          // Check for satker code
          let rawKode = colKodeSatker !== -1 ? row[colKodeSatker] : '';
          let rawNama = colNamaSatker !== -1 ? row[colNamaSatker] : '';

          let kodeSatker = '';
          let namaSatkerExtracted = '';

          // Check if SATKER column has format "411821 - KANWIL DJKN JAWA TENGAH..."
          const satkerStr = String(rawKode || '').trim();
          const dashMatch = satkerStr.match(/^(\d{6})\s*[-–—]\s*(.*)$/);
          if (dashMatch) {
            kodeSatker = dashMatch[1];
            namaSatkerExtracted = cleanText(dashMatch[2]);
          } else {
            kodeSatker = normalizeKodeSatker(rawKode);
          }

          // Look for 6-digit digits in row if code not cleanly found
          if (!kodeSatker) {
            row.forEach(c => {
              const str = String(c).trim();
              if (/^\d{6}$/.test(str) && !kodeSatker) {
                kodeSatker = str;
              }
            });
          }

          if (!kodeSatker) {
            continue; // Skip header/footer/empty lines
          }

          const master = masterMap.get(kodeSatker);
          const namaSatker = namaSatkerExtracted || cleanText(rawNama) || master?.namaSatker || `Satker ${kodeSatker}`;
          const kementerianLembaga = cleanText(colKl !== -1 ? row[colKl] : '') || master?.kementerianLembaga || 'KEMENTERIAN / LEMBAGA MITRA';

          const nominal = colNominal !== -1 ? parseFormattedNumber(row[colNominal]) : 0;
          const bank = cleanText(colBank !== -1 ? row[colBank] : '') || 'Bank Rakyat Indonesia (BRI)';
          const noSp2d = cleanText(colNoSp2d !== -1 ? row[colNoSp2d] : '');
          
          // Parse Tanggal SP2D from Kolom E (or designated column)
          let rawTglSp2d = colTglSp2d !== -1 ? row[colTglSp2d] : '';
          let parsedPeriod = parseDateToPeriod(rawTglSp2d, forcedYear || 2026);

          // If designated column wasn't a valid date, scan row cells for a valid date
          if (!parsedPeriod) {
            for (let c = 0; c < row.length; c++) {
              if (c === colKodeSatker || c === colNominal) continue;
              const trial = parseDateToPeriod(row[c], forcedYear || 2026);
              if (trial) {
                parsedPeriod = trial;
                rawTglSp2d = row[c];
                break;
              }
            }
          }

          const tglSp2d = parsedPeriod?.dateStr || (cleanText(rawTglSp2d) !== '' ? cleanText(rawTglSp2d) : '-');
          const periodMonth = parsedPeriod?.periodKey || forcedPeriod || 'Agustus 2026';
          const year = parsedPeriod?.year || forcedYear || 2026;

          const count = colJumlahTransaksi !== -1 ? parseFormattedNumber(row[colJumlahTransaksi], 1) : 1;

          // Aggregation key combines KodeSatker and Month Period so multi-month OM-SPAN files are cleanly separated
          const aggKey = `${kodeSatker}_${periodMonth}`;

          if (satkerPeriodAggregation.has(aggKey)) {
            const existing = satkerPeriodAggregation.get(aggKey)!;
            existing.jumlahTransaksi += count;
            existing.totalNominal += nominal;
            
            // Pick the most recent SP2D date chronologically
            if (tglSp2d && tglSp2d !== '-') {
              const curTime = parseDateToTimestamp(tglSp2d);
              const prevTime = parseDateToTimestamp(existing.tglSp2dTerakhir);
              if (curTime >= prevTime) {
                existing.tglSp2dTerakhir = tglSp2d;
                if (noSp2d) existing.noSp2dTerakhir = noSp2d;
              }
            }
            if (bank && existing.bankPenerbit === 'Bank Rakyat Indonesia (BRI)') existing.bankPenerbit = bank;
          } else {
            satkerPeriodAggregation.set(aggKey, {
              kodeSatker,
              namaSatker,
              kementerianLembaga,
              jumlahTransaksi: count,
              totalNominal: nominal,
              bankPenerbit: bank,
              noSp2dTerakhir: noSp2d || ('260261301004' + Math.floor(100 + Math.random() * 899)),
              tglSp2dTerakhir: tglSp2d,
              periode: periodMonth,
              tahun: year
            });
          }
        }

        const validData = Array.from(satkerPeriodAggregation.values()).map((item, idx) => {
          let statusKeaktifan: 'Sangat Aktif' | 'Aktif' | 'Perlu Akselerasi' = 'Aktif';
          if (item.jumlahTransaksi >= 25 || item.totalNominal >= 200000000) {
            statusKeaktifan = 'Sangat Aktif';
          } else if (item.jumlahTransaksi <= 10 && item.totalNominal < 75000000) {
            statusKeaktifan = 'Perlu Akselerasi';
          }

          return {
            id: `kkp-${item.kodeSatker}-${item.periode.replace(/\s+/g, '-')}-${Date.now()}-${idx}`,
            kodeSatker: item.kodeSatker,
            namaSatker: item.namaSatker,
            kementerianLembaga: item.kementerianLembaga,
            jumlahTransaksi: item.jumlahTransaksi,
            totalNominal: item.totalNominal,
            bankPenerbit: item.bankPenerbit,
            noSp2dTerakhir: item.noSp2dTerakhir,
            tglSp2dTerakhir: item.tglSp2dTerakhir,
            statusKeaktifan,
            periode: item.periode,
            tahun: item.tahun,
            catatan: statusKeaktifan === 'Sangat Aktif' ? 'Top Transaksi KKP Aktif' : undefined
          };
        });

        // Determine detected periods
        const detectedPeriods = Array.from(new Set(validData.map(d => d.periode)));
        const summaryPeriodText = detectedPeriods.length === 1 
          ? detectedPeriods[0] 
          : (detectedPeriods.length > 1 ? `${detectedPeriods.length} Periode Bulan (${detectedPeriods.slice(0, 3).join(', ')}${detectedPeriods.length > 3 ? '...' : ''})` : (forcedPeriod || 'Agustus 2026'));

        resolve({
          file,
          fileName: file.name,
          fileSize: file.size,
          modul: 'TRANSAKSI_KKP',
          tahun: forcedYear || 2026,
          periode: summaryPeriodText,
          totalRows: matrix.length,
          validData,
          invalidRows,
          isValidFormat: validData.length > 0,
          formatErrors: validData.length === 0 ? ['Tidak ditemukan data satker yang valid dalam file KKP.'] : []
        });
      } catch (err: any) {
        reject(new Error(`Gagal memproses file Excel KKP: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file Excel.'));
    reader.readAsArrayBuffer(file);
  });
}

export function downloadKKPTemplate() {
  const sampleData = [
    {
      'No': 1,
      'Kode Satker': '643340',
      'Nama Satker': 'PUSDIKBINMAS LEMDIKLAT POLRI',
      'Kementerian / Lembaga': 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
      'Bank Penerbit KKP': 'Bank Rakyat Indonesia (BRI)',
      'Jumlah Transaksi': 48,
      'Total Nominal KKP (Rp)': 384500000,
      'No SP2D Terakhir': '260261301004821',
      'Tanggal SP2D': '18-08-2026',
      'Status Keaktifan': 'Sangat Aktif'
    },
    {
      'No': 2,
      'Kode Satker': '651046',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'Kementerian / Lembaga': 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
      'Bank Penerbit KKP': 'Bank Rakyat Indonesia (BRI)',
      'Jumlah Transaksi': 42,
      'Total Nominal KKP (Rp)': 326800000,
      'No SP2D Terakhir': '260261301004755',
      'Tanggal SP2D': '16-08-2026',
      'Status Keaktifan': 'Sangat Aktif'
    },
    {
      'No': 3,
      'Kode Satker': '417315',
      'Nama Satker': 'BALAI BESAR WILAYAH SUNGAI PEMALI JUANA',
      'Kementerian / Lembaga': 'KEMENTERIAN PEKERJAAN UMUM DAN PERUMAHAN RAKYAT',
      'Bank Penerbit KKP': 'Bank Mandiri',
      'Jumlah Transaksi': 36,
      'Total Nominal KKP (Rp)': 295450000,
      'No SP2D Terakhir': '260261301004612',
      'Tanggal SP2D': '14-08-2026',
      'Status Keaktifan': 'Sangat Aktif'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi KKP');
  XLSX.writeFile(workbook, 'Template_Monitoring_Transaksi_KKP_KPPN026.xlsx');
}

/**
 * 7. VALIDASI & IMPORT EXCEL TRANSAKSI DIGIPAY (MULTI-TAB: PEMBAYARAN VA & PEMBAYARAN KKP)
 * Mendukung tab "Pembayaran VA" dan "Pembayaran KKP" dari format monitoring Digipay Satu / Kemenkeu.
 * Kolom Nominal Invoice dideteksi pada Kolom I (index 8) dan berbagai variasi nama header.
 */
export async function validateDigipayExcelFile(
  file: File,
  masterSatkers: MasterSatker[],
  forcedPeriod?: string,
  forcedYear?: number
): Promise<ExcelValidationPreview<DigipayRecord>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('File Excel Digipay kosong atau tidak memiliki lembar kerja.');
        }

        // Master lookup map
        const masterMap = new Map<string, MasterSatker>();
        masterSatkers.forEach(m => {
          if (m.kodeSatker) masterMap.set(m.kodeSatker.trim(), m);
        });

        const validData: DigipayRecord[] = [];
        const invalidRows: { rowNumber: number; kodeSatker: string; namaSatker?: string; reason: string; raw?: any }[] = [];

        // Iterate through all sheets (Supports "VA", "KKP", "Pembayaran VA", "Pembayaran KKP", or single combined sheet)
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          if (!matrix || matrix.length === 0) return;

          const sheetLower = sheetName.toLowerCase().trim();
          // Determine default payment type from sheet name
          let defaultType: 'VA' | 'KKP' = 'VA';
          if (sheetLower === 'kkp' || sheetLower.includes('kkp') || sheetLower.includes('kartu') || sheetLower.includes('kredit')) {
            defaultType = 'KKP';
          } else if (sheetLower === 'va' || sheetLower.includes('va') || sheetLower.includes('virtual') || sheetLower.includes('cms')) {
            defaultType = 'VA';
          }

          // Robust Header search with multi-column scoring
          let headerRowIndex = -1;
          let bestScore = 0;
          let colKodeSatker = -1;
          let colNamaSatker = -1;
          let colTipe = -1;
          let colNoTransaksi = -1;
          let colTglBayar = -1;
          let colTglTransaksi = -1;
          let colVendor = -1;
          let colBank = -1;
          let colNominal = -1;
          let colStatus = -1;
          let colUraian = -1;
          let colKl = -1;

          for (let r = 0; r < Math.min(25, matrix.length); r++) {
            const row = matrix[r];
            if (!row || row.length === 0) continue;
            let score = 0;
            let tKode = -1, tNama = -1, tTipe = -1, tNoTrans = -1, tTglBayar = -1, tTglTrans = -1, tVendor = -1, tBank = -1, tNom = -1, tStatus = -1, tUraian = -1, tKl = -1;

            row.forEach((cell, idx) => {
              const rawVal = String(cell || '').trim();
              const val = rawVal.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (!val) return;

              // 1. TGLBAYAR (Kolom L) - highest priority date column for Digipay
              if (val.includes('tglbayar') || val.includes('tanggalbayar') || val === 'tglbayar' || val.includes('bayartgl')) {
                tTglBayar = idx;
                score += 5;
              } else if (val.includes('tgltransaksi') || val.includes('tanggaltransaksi') || val.includes('tglpesanan') || val.includes('tanggalpesanan') || val.includes('tglinvoice') || val.includes('tanggalinvoice') || val === 'tgl' || val === 'tanggal') {
                tTglTrans = idx;
                score += 2;
              } else if (['kdsatker', 'kodesatker', 'satker', 'kdsatkerinduk', 'kodesatkerinduk', 'satkerkode'].some(k => val.includes(k))) {
                tKode = idx;
                score += 4;
              } else if (['nmsatke', 'nmsatker', 'namasatker', 'uraiansatker', 'satkernama'].some(k => val.includes(k))) {
                tNama = idx;
                score += 3;
              } else if (
                ['nominvc', 'nominalinvoice', 'nilaiinvoice', 'totalinvoice', 'nominal', 'nilai', 'rupiah', 'tagihan', 'total'].some(k => val.includes(k)) ||
                (val.includes('invoice') && (val.includes('nom') || val.includes('nilai') || val.includes('total') || val.includes('rp')))
              ) {
                tNom = idx;
                score += 4;
              } else if (
                ['noinvoic', 'noinvoice', 'notransaksi', 'nomortransaksi', 'noorder', 'orderid', 'kodedigipay', 'notrans', 'idtransaksi', 'nopesanan'].some(k => val.includes(k)) ||
                (val.includes('invoice') && !val.includes('nominal') && !val.includes('nilai'))
              ) {
                tNoTrans = idx;
                score += 3;
              } else if (['nmvendo', 'namavendor', 'vendor', 'rekanan', 'namarekanan', 'umkm', 'penyedia', 'merchant', 'toko'].some(k => val.includes(k))) {
                tVendor = idx;
                score += 3;
              } else if (['stsbayar', 'statusbayar', 'statustransaksi', 'status', 'statuspesanan', 'statusinvoice'].some(k => val.includes(k))) {
                tStatus = idx;
                score += 2;
              } else if (['banksat', 'bankven', 'namabank', 'bank', 'bankpembayar', 'bankmitra', 'bankpenerbit'].some(k => val.includes(k))) {
                tBank = idx;
                score += 2;
              } else if (['carabayar', 'metode', 'tipe', 'jenis', 'tipepembayaran', 'jenispembayaran'].some(k => val.includes(k))) {
                tTipe = idx;
                score += 2;
              } else if (['kategori', 'katego', 'uraian', 'deskripsi', 'namabarang', 'keterangan', 'rincian', 'belanja'].some(k => val.includes(k))) {
                tUraian = idx;
                score += 2;
              } else if (['nmkanw', 'kementerian', 'lembaga', 'kl', 'kementerianlembaga'].some(k => val.includes(k))) {
                tKl = idx;
                score += 1;
              }
            });

            if (score > bestScore) {
              bestScore = score;
              headerRowIndex = r;
              colKodeSatker = tKode;
              colNamaSatker = tNama;
              colTipe = tTipe;
              colNoTransaksi = tNoTrans;
              colTglBayar = tTglBayar;
              colTglTransaksi = tTglTrans;
              colVendor = tVendor;
              colBank = tBank;
              colNominal = tNom;
              colStatus = tStatus;
              colUraian = tUraian;
              colKl = tKl;
            }
          }

          // If standard OM-SPAN / Digipay Satu header format
          if (headerRowIndex === -1 || bestScore < 3) {
            headerRowIndex = 0; // Default Row 1 (0-indexed 0)
          }
          if (colKodeSatker === -1) colKodeSatker = 5;  // Col F (index 5)
          if (colNamaSatker === -1) colNamaSatker = 6;  // Col G (index 6)
          if (colNoTransaksi === -1) colNoTransaksi = 7; // Col H (index 7)
          if (colNominal === -1) colNominal = 8;        // Col I (index 8)
          if (colVendor === -1) colVendor = 9;          // Col J (index 9)
          if (colStatus === -1) colStatus = 10;         // Col K (index 10)
          if (colTglBayar === -1) colTglBayar = 11;     // Col L (index 11) -> TGLBAYAR
          if (colBank === -1) colBank = 14;             // Col O (index 14) -> BANK_SAT
          if (colUraian === -1) colUraian = 13;         // Col N (index 13) -> KATEGORI
          if (colTipe === -1) colTipe = 17;             // Col R (index 17) -> CARA BAYAR

          for (let r = headerRowIndex + 1; r < matrix.length; r++) {
            const row = matrix[r];
            if (!row || row.length === 0) continue;

            let rawKode = colKodeSatker !== -1 ? row[colKodeSatker] : '';
            let rawNama = colNamaSatker !== -1 ? row[colNamaSatker] : '';

            let kodeSatker = normalizeKodeSatker(rawKode);
            if (!kodeSatker) {
              row.forEach(c => {
                const str = String(c).trim();
                if (/^\d{6}$/.test(str) && !kodeSatker) {
                  kodeSatker = str;
                }
              });
            }

            if (!kodeSatker) continue;

            const master = masterMap.get(kodeSatker);
            const namaSatker = cleanText(rawNama) || master?.namaSatker || `Satker ${kodeSatker}`;
            const kementerianLembaga = cleanText(colKl !== -1 ? row[colKl] : '') || master?.kementerianLembaga || 'KEMENTERIAN / LEMBAGA MITRA';

            // Determine payment type
            let tipe: 'VA' | 'KKP' = defaultType;
            if (colTipe !== -1 && row[colTipe]) {
              const rawTipe = String(row[colTipe]).toUpperCase().trim();
              if (rawTipe === 'KKP' || rawTipe.includes('KKP') || rawTipe.includes('KREDIT')) {
                tipe = 'KKP';
              } else if (rawTipe === 'VA' || rawTipe.includes('VA') || rawTipe.includes('VIRTUAL') || rawTipe.includes('CMS')) {
                tipe = 'VA';
              }
            }

            // Parse nominal invoice: Primary column from header detection (Kolom I)
            let nominal = colNominal !== -1 ? parseFormattedNumber(row[colNominal]) : 0;

            // Fallback: If nominal is 0, check Kolom I (index 8) or other numeric columns
            if (nominal <= 0 && row.length > 8 && parseFormattedNumber(row[8]) > 0) {
              nominal = parseFormattedNumber(row[8]);
            }
            if (nominal <= 0 && row.length > 7 && parseFormattedNumber(row[7]) > 0 && typeof row[7] === 'number') {
              nominal = parseFormattedNumber(row[7]);
            }
            if (nominal <= 0 && row.length > 6 && parseFormattedNumber(row[6]) > 0 && typeof row[6] === 'number') {
              nominal = parseFormattedNumber(row[6]);
            }
            if (nominal <= 0 && row.length > 9 && parseFormattedNumber(row[9]) > 0 && typeof row[9] === 'number') {
              nominal = parseFormattedNumber(row[9]);
            }

            const noTrans = cleanText(colNoTransaksi !== -1 ? row[colNoTransaksi] : '') || 
              (row[4] ? cleanText(row[4]) : `DGP-${Date.now().toString().slice(-5)}-${validData.length + 1}`);
            
            // Prioritize Kolom L (TGLBAYAR) for Tanggal Bayar
            let rawTgl = '';
            if (colTglBayar !== -1 && row[colTglBayar] !== undefined && row[colTglBayar] !== '') {
              rawTgl = row[colTglBayar];
            } else if (row.length > 11 && row[11] !== undefined && row[11] !== '') {
              rawTgl = row[11];
            } else if (colTglTransaksi !== -1 && row[colTglTransaksi] !== undefined && row[colTglTransaksi] !== '') {
              rawTgl = row[colTglTransaksi];
            }

            let parsedPeriod = parseDateToPeriod(rawTgl, forcedYear || 2026);

            // If not parseable from designated column, scan other cells for a valid date
            if (!parsedPeriod) {
              for (let c = 0; c < row.length; c++) {
                if (c === colKodeSatker || c === colNominal) continue;
                const trial = parseDateToPeriod(row[c], forcedYear || 2026);
                if (trial) {
                  parsedPeriod = trial;
                  rawTgl = row[c];
                  break;
                }
              }
            }

            const tglTrans = parsedPeriod?.dateStr || (cleanText(rawTgl) !== '' ? cleanText(rawTgl) : '-');
            const periodMonth = parsedPeriod?.periodKey || forcedPeriod || 'Agustus 2026';
            const year = parsedPeriod?.year || forcedYear || 2026;
            const vendor = cleanText(colVendor !== -1 ? row[colVendor] : (row[9] ? row[9] : '')) || 'Penyedia UMKM Terdaftar';
            const bank = cleanText(colBank !== -1 ? row[colBank] : (row[14] ? row[14] : '')) || (tipe === 'KKP' ? 'Bank Rakyat Indonesia (BRI)' : 'Bank Mandiri');
            const status = cleanText(colStatus !== -1 ? row[colStatus] : (row[10] ? row[10] : '')) || 'Selesai';
            const uraian = cleanText(colUraian !== -1 ? row[colUraian] : (row[13] ? row[13] : '')) || 'Belanja Pengadaan Barang & Operasional Digipay';

            // Skip only if both nominal <= 0 and no identifiable transaction info
            if (nominal <= 0 && (!noTrans || noTrans.startsWith('DGP-'))) {
              continue;
            }

            validData.push({
              id: `digipay-${kodeSatker}-${tipe}-${Date.now().toString().slice(-4)}-${validData.length + 1}`,
              kodeSatker,
              namaSatker,
              kementerianLembaga,
              tipePembayaran: tipe,
              noTransaksi: noTrans,
              tglTransaksi: tglTrans,
              namaVendor: vendor,
              namaBank: bank,
              nominalTransaksi: nominal,
              statusTransaksi: status,
              uraianBarang: uraian,
              periode: periodMonth,
              tahun: year,
              createdAt: new Date().toISOString()
            });
          }
        });

        // Determine detected periods
        const detectedPeriods = Array.from(new Set(validData.map(d => d.periode)));
        const summaryPeriodText = detectedPeriods.length === 1 
          ? detectedPeriods[0] 
          : (detectedPeriods.length > 1 ? `${detectedPeriods.length} Periode Bulan (${detectedPeriods.slice(0, 3).join(', ')}${detectedPeriods.length > 3 ? '...' : ''})` : (forcedPeriod || 'Agustus 2026'));

        resolve({
          file,
          fileName: file.name,
          fileSize: file.size,
          modul: 'TRANSAKSI_DIGIPAY' as any,
          tahun: forcedYear || 2026,
          periode: summaryPeriodText,
          totalRows: validData.length,
          validData,
          invalidRows,
          isValidFormat: validData.length > 0,
          formatErrors: validData.length === 0 ? ['Tidak ditemukan transaksi Digipay yang valid pada tab VA ataupun KKP. Pastikan file Excel berisi data transaksi dengan Kolom Nominal Invoice (Kolom I) dan Tanggal Bayar (Kolom L).'] : []
        });
      } catch (err: any) {
        reject(new Error(`Gagal memproses file Excel Digipay: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file Excel.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Download Template Excel Multi-Tab Monitoring Digipay (Tab 1: Pembayaran VA, Tab 2: Pembayaran KKP)
 */
export function downloadDigipayTemplate() {
  // Tab 1: Pembayaran VA
  const dataVA = [
    {
      'No': 1,
      'Kode Satker': '643340',
      'Nama Satker': 'PUSDIKBINMAS LEMDIKLAT POLRI',
      'Kementerian / Lembaga': 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
      'No Transaksi / Order ID': 'DGP-202608-00129',
      'Tanggal Transaksi': '18-08-2026',
      'Nama Rekanan / UMKM': 'CV. Pustaka Mulia Semarang',
      'Nama Bank': 'Bank Rakyat Indonesia (BRI)',
      'Nominal Transaksi (Rp)': 18500000,
      'Status Transaksi': 'Selesai',
      'Uraian Barang / Belanja': 'Pengadaan Modul Pelatihan dan ATK Diklat Angkatan III 2026'
    },
    {
      'No': 2,
      'Kode Satker': '651046',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'Kementerian / Lembaga': 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
      'No Transaksi / Order ID': 'DGP-202608-00210',
      'Tanggal Transaksi': '16-08-2026',
      'Nama Rekanan / UMKM': 'CV. Aneka Jaya Kertas',
      'Nama Bank': 'Bank Rakyat Indonesia (BRI)',
      'Nominal Transaksi (Rp)': 16400000,
      'Status Transaksi': 'Selesai',
      'Uraian Barang / Belanja': 'Kertas F4/A4 dan Perlengkapan Administrasi SPKT & Reskrim'
    },
    {
      'No': 3,
      'Kode Satker': '417315',
      'Nama Satker': 'BALAI BESAR WILAYAH SUNGAI PEMALI JUANA',
      'Kementerian / Lembaga': 'KEMENTERIAN PEKERJAAN UMUM DAN PERUMAHAN RAKYAT',
      'No Transaksi / Order ID': 'DGP-202608-00340',
      'Tanggal Transaksi': '13-08-2026',
      'Nama Rekanan / UMKM': 'CV. Bintang Mas Stationery',
      'Nama Bank': 'Bank Mandiri',
      'Nominal Transaksi (Rp)': 15300000,
      'Status Transaksi': 'Selesai',
      'Uraian Barang / Belanja': 'Toner Printer Plotter Pemetaan dan Kertas Kalkir'
    },
    {
      'No': 4,
      'Kode Satker': '018012',
      'Nama Satker': 'BPS PROVINSI JAWA TENGAH',
      'Kementerian / Lembaga': 'BADAN PUSAT STATISTIK',
      'No Transaksi / Order ID': 'DGP-202608-00412',
      'Tanggal Transaksi': '14-08-2026',
      'Nama Rekanan / UMKM': 'CV. Mitra Prima Grafika',
      'Nama Bank': 'Bank Negara Indonesia (BNI)',
      'Nominal Transaksi (Rp)': 21500000,
      'Status Transaksi': 'Selesai',
      'Uraian Barang / Belanja': 'Pencetakan Kuesioner Survei Sosial Ekonomi & Publikasi Statistik'
    }
  ];

  // Tab 2: Pembayaran KKP
  const dataKKP = [
    {
      'No': 1,
      'Kode Satker': '643340',
      'Nama Satker': 'PUSDIKBINMAS LEMDIKLAT POLRI',
      'Kementerian / Lembaga': 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
      'No Transaksi / Order ID': 'DGP-202608-00142',
      'Tanggal Transaksi': '17-08-2026',
      'Nama Rekanan / UMKM': 'PT. Java Komputer Mandiri',
      'Nama Bank': 'Bank Rakyat Indonesia (BRI)',
      'Nominal Transaksi (Rp)': 24750000,
      'Status Transaksi': 'Selesai',
      'Uraian Barang / Belanja': 'Peralatan IT Scanner & Maintenance Printer Jaringan'
    },
    {
      'No': 2,
      'Kode Satker': '651046',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'Kementerian / Lembaga': 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
      'No Transaksi / Order ID': 'DGP-202608-00234',
      'Tanggal Transaksi': '15-08-2026',
      'Nama Rekanan / UMKM': 'Toko Elektronik Sinar Terang',
      'Nama Bank': 'Bank Rakyat Indonesia (BRI)',
      'Nominal Transaksi (Rp)': 28500000,
      'Status Transaksi': 'Selesai',
      'Uraian Barang / Belanja': 'Perangkat CCTV Tambahan & UPS Server Database SIM Online'
    },
    {
      'No': 3,
      'Kode Satker': '417315',
      'Nama Satker': 'BALAI BESAR WILAYAH SUNGAI PEMALI JUANA',
      'Kementerian / Lembaga': 'KEMENTERIAN PEKERJAAN UMUM DAN PERUMAHAN RAKYAT',
      'No Transaksi / Order ID': 'DGP-202608-00305',
      'Tanggal Transaksi': '15-08-2026',
      'Nama Rekanan / UMKM': 'PT. Surveyor Teknik Persada',
      'Nama Bank': 'Bank Mandiri',
      'Nominal Transaksi (Rp)': 32400000,
      'Status Transaksi': 'Selesai',
      'Uraian Barang / Belanja': 'Alat Ukur Debit Air Sungai & Sparepart Sensor Telemetri'
    },
    {
      'No': 4,
      'Kode Satker': '089014',
      'Nama Satker': 'KANWIL KEMENTERIAN HUKUM DAN HAM JAWA TENGAH',
      'Kementerian / Lembaga': 'KEMENTERIAN HUKUM DAN HAK ASASI MANUSIA',
      'No Transaksi / Order ID': 'DGP-202608-00523',
      'Tanggal Transaksi': '08-08-2026',
      'Nama Rekanan / UMKM': 'UD. Gemilang Meubel Jaya',
      'Nama Bank': 'Bank Mandiri',
      'Nominal Transaksi (Rp)': 14600000,
      'Status Transaksi': 'Selesai',
      'Uraian Barang / Belanja': 'Kursi Kerja Rapat Pelayanan Hak Cipta & Merek'
    }
  ];

  const workbook = XLSX.utils.book_new();

  const wsVA = XLSX.utils.json_to_sheet(dataVA);
  wsVA['!cols'] = [
    { wch: 6 }, { wch: 15 }, { wch: 45 }, { wch: 35 }, { wch: 22 }, { wch: 16 }, { wch: 30 }, { wch: 25 }, { wch: 22 }, { wch: 16 }, { wch: 50 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsVA, 'Pembayaran VA');

  const wsKKP = XLSX.utils.json_to_sheet(dataKKP);
  wsKKP['!cols'] = [
    { wch: 6 }, { wch: 15 }, { wch: 45 }, { wch: 35 }, { wch: 22 }, { wch: 16 }, { wch: 30 }, { wch: 25 }, { wch: 22 }, { wch: 16 }, { wch: 50 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsKKP, 'Pembayaran KKP');

  XLSX.writeFile(workbook, 'Template_Monitoring_Transaksi_Digipay_VA_dan_KKP.xlsx');
}

export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Helper to extract Month & Year string (e.g. "Agustus 2026") from records or date strings
 * Prioritizes Kolom L Tanggal Bayar / Transaksi for Digipay and Kolom E Tanggal SP2D for KKP
 */
export function extractMonthFromRecord(record: {
  periode?: string;
  tglTransaksi?: string;
  tglSp2dTerakhir?: string;
  tglTransaksiTerakhir?: string;
  tahun?: number;
}): string | null {
  if (!record) return null;

  // 1. Prioritize Kolom L Tanggal Transaksi / Bayar for Digipay records
  if (record.tglTransaksi && record.tglTransaksi !== '-' && record.tglTransaksi !== 'Tidak Ada') {
    const parsed = parseDateToPeriod(record.tglTransaksi, record.tahun || 2026);
    if (parsed) return parsed.periodKey;
  }

  // 2. Prioritize Kolom E Tanggal SP2D for KKP records
  if (record.tglSp2dTerakhir && record.tglSp2dTerakhir !== '-' && record.tglSp2dTerakhir !== 'Tidak Ada') {
    const parsed = parseDateToPeriod(record.tglSp2dTerakhir, record.tahun || 2026);
    if (parsed) return parsed.periodKey;
  }

  // 3. Fallback check for tglTransaksiTerakhir
  if (record.tglTransaksiTerakhir && record.tglTransaksiTerakhir !== '-' && record.tglTransaksiTerakhir !== 'Tidak Ada') {
    const parsed = parseDateToPeriod(record.tglTransaksiTerakhir, record.tahun || 2026);
    if (parsed) return parsed.periodKey;
  }

  // 4. Fallback to explicit periode string if it contains a month
  if (record.periode && record.periode !== 'Semua Bulan (Kumulatif 2026)' && record.periode !== 'ALL') {
    for (const m of INDONESIAN_MONTHS) {
      if (new RegExp(`\\b${m}\\b`, 'i').test(record.periode)) {
        const yrMatch = record.periode.match(/\b(202\d)\b/);
        const yr = yrMatch ? yrMatch[1] : (record.tahun || 2026);
        return `${m} ${yr}`;
      }
    }
  }

  return record.periode || null;
}

/**
 * Get numerical index (0-11) and year from period key e.g. "Januari 2026"
 */
export function getMonthInfoFromPeriodKey(periodKey: string): { monthIndex: number; monthName: string; year: number } | null {
  if (!periodKey || periodKey === 'ALL' || periodKey.startsWith('Semua')) return null;
  const parts = periodKey.trim().split(' ');
  const mName = parts[0];
  const yr = parseInt(parts[1] || '2026', 10);
  const mIdx = INDONESIAN_MONTHS.findIndex(m => m.toLowerCase() === mName.toLowerCase());
  if (mIdx === -1) return null;
  return { monthIndex: mIdx, monthName: INDONESIAN_MONTHS[mIdx], year: yr };
}

/**
 * Check if a record matches the filtering criteria:
 * - 'SINGLE': record month must match targetMonth exactly
 * - 'CUMULATIVE': record month must be <= targetMonth in that year
 */
export function isRecordMatchingFilter(
  record: any,
  mode: 'SINGLE' | 'CUMULATIVE',
  targetMonth: string
): boolean {
  if (!targetMonth || targetMonth === 'ALL' || targetMonth.startsWith('Semua')) return true;

  const recMonthKey = extractMonthFromRecord(record);
  if (!recMonthKey) return true;

  if (mode === 'SINGLE') {
    return recMonthKey.toLowerCase() === targetMonth.toLowerCase();
  }

  // Cumulative up to selected month
  const targetInfo = getMonthInfoFromPeriodKey(targetMonth);
  const recInfo = getMonthInfoFromPeriodKey(recMonthKey);

  if (!targetInfo || !recInfo) return true;
  if (recInfo.year < targetInfo.year) return true;
  if (recInfo.year > targetInfo.year) return false;
  return recInfo.monthIndex <= targetInfo.monthIndex;
}

/**
 * Export Transaksi KKP Records to Excel with Monthly Filter Support
 */
export function exportKKPToExcel(
  records: any[],
  fileName: string = 'Laporan_Transaksi_KKP_KPPN026.xlsx',
  selectedPeriod: string = 'Semua Bulan (Kumulatif)'
) {
  const isPeriodFiltered = selectedPeriod && selectedPeriod !== 'ALL' && selectedPeriod !== 'Semua Bulan (Kumulatif)';
  const data = records.map((r, idx) => ({
    'Peringkat': idx + 1,
    'Kode Satker': r.kodeSatker,
    'Nama Satker': r.namaSatker,
    'Kementerian / Lembaga': r.kementerianLembaga || '-',
    'Bank Penerbit KKP': r.bankPenerbit || '-',
    'Jumlah Transaksi (SP2D)': r.jumlahTransaksi || 0,
    'Total Nominal Transaksi (Rp)': r.totalNominal || 0,
    'No SP2D Terakhir': r.noSp2dTerakhir || '-',
    'Tanggal SP2D Terakhir': r.tglSp2dTerakhir || '-',
    'Status Keaktifan': r.statusKeaktifan || 'Aktif',
    'Periode Transaksi': r.periode || selectedPeriod
  }));

  const workbook = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data.length > 0 ? data : [{ 'Info': 'Tidak ada data transaksi KKP untuk periode ini' }]);
  XLSX.utils.book_append_sheet(workbook, ws, 'Rekapitulasi KKP');

  const periodTag = isPeriodFiltered ? `_${selectedPeriod.replace(/\s+/g, '_')}` : '';
  const finalFileName = fileName.endsWith('.xlsx')
    ? (isPeriodFiltered ? fileName.replace('.xlsx', `${periodTag}.xlsx`) : fileName)
    : `${fileName}${periodTag}.xlsx`;

  XLSX.writeFile(workbook, finalFileName);
}

/**
 * Export Digipay Records to Excel with Multi-Tab & Monthly Filter Support
 */
export function exportDigipayToExcel(
  records: DigipayRecord[],
  fileName: string = 'Rekapitulasi_Transaksi_Digipay_KPPN026.xlsx',
  selectedPeriod: string = 'Semua Bulan (Kumulatif)'
) {
  const isPeriodFiltered = selectedPeriod && selectedPeriod !== 'ALL' && selectedPeriod !== 'Semua Bulan (Kumulatif)';

  // Satker-level aggregation for summary tab
  const satkerMap = new Map<string, {
    kodeSatker: string;
    namaSatker: string;
    kementerianLembaga: string;
    totalVA: number;
    nomVA: number;
    totalKKP: number;
    nomKKP: number;
    totalSemua: number;
    totalNom: number;
    bank: string;
  }>();

  records.forEach(r => {
    const existing = satkerMap.get(r.kodeSatker) || {
      kodeSatker: r.kodeSatker,
      namaSatker: r.namaSatker,
      kementerianLembaga: r.kementerianLembaga || '',
      totalVA: 0,
      nomVA: 0,
      totalKKP: 0,
      nomKKP: 0,
      totalSemua: 0,
      totalNom: 0,
      bank: r.namaBank || '-'
    };

    if (r.tipePembayaran === 'VA') {
      existing.totalVA += 1;
      existing.nomVA += (r.nominalTransaksi || 0);
    } else {
      existing.totalKKP += 1;
      existing.nomKKP += (r.nominalTransaksi || 0);
    }
    existing.totalSemua = existing.totalVA + existing.totalKKP;
    existing.totalNom = existing.nomVA + existing.nomKKP;
    satkerMap.set(r.kodeSatker, existing);
  });

  const dataRekap = Array.from(satkerMap.values())
    .sort((a, b) => b.totalSemua - a.totalSemua || b.totalNom - a.totalNom)
    .map((s, idx) => ({
      'Peringkat': idx + 1,
      'Kode Satker': s.kodeSatker,
      'Nama Satker': s.namaSatker,
      'Kementerian / Lembaga': s.kementerianLembaga,
      'Frekuensi VA': s.totalVA,
      'Nominal VA (Rp)': s.nomVA,
      'Frekuensi KKP': s.totalKKP,
      'Nominal KKP (Rp)': s.nomKKP,
      'Total Transaksi': s.totalSemua,
      'Total Belanja (Rp)': s.totalNom,
      'Bank Mitra Dominan': s.bank,
      'Periode': selectedPeriod
    }));

  const dataVA = records.filter(r => r.tipePembayaran === 'VA').map((r, idx) => ({
    'No': idx + 1,
    'Kode Satker': r.kodeSatker,
    'Nama Satker': r.namaSatker,
    'Kementerian / Lembaga': r.kementerianLembaga || '',
    'No Transaksi / Order': r.noTransaksi || '',
    'Tanggal Transaksi': r.tglTransaksi || '',
    'Nama Rekanan / UMKM': r.namaVendor || '',
    'Bank Pembayar': r.namaBank || '',
    'Nominal Transaksi (Rp)': r.nominalTransaksi,
    'Status': r.statusTransaksi || 'Selesai',
    'Uraian Belanja': r.uraianBarang || '',
    'Periode': r.periode || selectedPeriod
  }));

  const dataKKP = records.filter(r => r.tipePembayaran === 'KKP').map((r, idx) => ({
    'No': idx + 1,
    'Kode Satker': r.kodeSatker,
    'Nama Satker': r.namaSatker,
    'Kementerian / Lembaga': r.kementerianLembaga || '',
    'No Transaksi / Order': r.noTransaksi || '',
    'Tanggal Transaksi': r.tglTransaksi || '',
    'Nama Rekanan / UMKM': r.namaVendor || '',
    'Bank Pembayar': r.namaBank || '',
    'Nominal Transaksi (Rp)': r.nominalTransaksi,
    'Status': r.statusTransaksi || 'Selesai',
    'Uraian Belanja': r.uraianBarang || '',
    'Periode': r.periode || selectedPeriod
  }));

  const workbook = XLSX.utils.book_new();

  // Tab 1: Rekapitulasi Per Satker
  const wsRekap = XLSX.utils.json_to_sheet(dataRekap.length > 0 ? dataRekap : [{ 'Info': 'Tidak ada data rekap transaksi' }]);
  XLSX.utils.book_append_sheet(workbook, wsRekap, 'Rekapitulasi Satker');

  // Tab 2: Detail Pembayaran VA
  const wsVA = XLSX.utils.json_to_sheet(dataVA.length > 0 ? dataVA : [{ 'Info': 'Tidak ada data transaksi VA' }]);
  XLSX.utils.book_append_sheet(workbook, wsVA, 'Pembayaran VA');

  // Tab 3: Detail Pembayaran KKP
  const wsKKP = XLSX.utils.json_to_sheet(dataKKP.length > 0 ? dataKKP : [{ 'Info': 'Tidak ada data transaksi KKP' }]);
  XLSX.utils.book_append_sheet(workbook, wsKKP, 'Pembayaran KKP');

  const periodTag = isPeriodFiltered ? `_${selectedPeriod.replace(/\s+/g, '_')}` : '';
  const finalFileName = fileName.endsWith('.xlsx')
    ? (isPeriodFiltered ? fileName.replace('.xlsx', `${periodTag}.xlsx`) : fileName)
    : `${fileName}${periodTag}.xlsx`;

  XLSX.writeFile(workbook, finalFileName);
}

