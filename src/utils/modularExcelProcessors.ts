import * as XLSX from 'xlsx';
import {
  MasterSatker,
  IKPARecord,
  CapaianOutputRecord,
  PejabatSertifikasi,
  PengelolaanUPRecord,
  KarwasTUPRecord,
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
  
  let str = String(val).trim().replace(/Rp|\$|%|\s/gi, '');
  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
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
          if (!master) {
            unregisteredSatkers.push({
              kodeSatker,
              namaSatker: namaSatkerFromRow || `Satker ${kodeSatker}`,
              reason: 'Kode Satker tidak ditemukan dalam Master Data Referensi Satker KPPN'
            });
            invalidRows.push({
              rowNumber: r + 1,
              kodeSatker,
              namaSatker: namaSatkerFromRow,
              reason: 'Satker belum terdaftar di Master Data'
            });
            continue;
          }

          if (!master.isActive) {
            invalidRows.push({
              rowNumber: r + 1,
              kodeSatker,
              namaSatker: master.namaSatker,
              reason: 'Satker berstatus NONAKTIF di Master Data (Disembunyikan)'
            });
            continue;
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
            namaSatker: master.namaSatker,
            kementerianLembaga: master.kementerianLembaga || '',
            unitEselon1: master.unitEselon1 || '',
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
          if (!master) {
            unregisteredSatkers.push({
              kodeSatker,
              namaSatker: rawNama || `Satker ${kodeSatker}`,
              reason: 'Kode Satker tidak ada di Referensi Master Satker'
            });
            invalidRows.push({
              rowNumber: r + 1,
              kodeSatker,
              namaSatker: rawNama,
              reason: 'Satker belum terdaftar di Master Referensi'
            });
            continue;
          }

          if (!master.isActive) {
            invalidRows.push({
              rowNumber: r + 1,
              kodeSatker,
              namaSatker: master.namaSatker,
              reason: 'Satker Nonaktif di Master Data'
            });
            continue;
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
            namaSatker: master.namaSatker,
            kementerianLembaga: master.kementerianLembaga || '',
            unitEselon1: master.unitEselon1 || '',
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
          if (!master) {
            unregisteredSatkers.push({
              kodeSatker,
              namaSatker: rawNama || `Satker ${kodeSatker}`,
              reason: 'Kode Satker tidak ditemukan dalam Master Data Referensi'
            });
            invalidRows.push({
              rowNumber: r + 1,
              kodeSatker,
              namaSatker: rawNama,
              reason: 'Satker belum terdaftar di Master Referensi'
            });
            continue;
          }

          if (!master.isActive) {
            invalidRows.push({
              rowNumber: r + 1,
              kodeSatker,
              namaSatker: master.namaSatker,
              reason: 'Satker berstatus Nonaktif'
            });
            continue;
          }

          const nilaiUP = colNilaiUP !== -1 ? parseFormattedNumber(row[colNilaiUP], 50000000) : 50000000;
          const paguUP = colPaguUP !== -1 ? parseFormattedNumber(row[colPaguUP], nilaiUP * 12) : nilaiUP * 12;
          const realisasiGUP = colRealisasiGUP !== -1 ? parseFormattedNumber(row[colRealisasiGUP], nilaiUP * 0.8) : nilaiUP * 0.8;
          const sisaUP = colSisaUP !== -1 ? parseFormattedNumber(row[colSisaUP], Math.max(0, nilaiUP - realisasiGUP)) : Math.max(0, nilaiUP - realisasiGUP);
          
          let persenRevolving = colPersenRevolving !== -1 ? parseFormattedNumber(row[colPersenRevolving]) : (nilaiUP > 0 ? (realisasiGUP / nilaiUP) * 100 : 0);
          persenRevolving = Number(persenRevolving.toFixed(1));

          const frekuensiGUP = colFrekuensi !== -1 ? Math.max(0, parseInt(String(row[colFrekuensi])) || 1) : 1;
          const nomorSp2dTerakhir = colNoSP2D !== -1 ? cleanText(row[colNoSP2D]) : undefined;
          const tglTerakhirSP2D = colTglSP2D !== -1 ? cleanText(row[colTglSP2D]) : '15-08-2026';

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
            namaSatker: master.namaSatker,
            kementerianLembaga: master.kementerianLembaga || '',
            kodeBa: master.kodeBa || '',
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
          if (!master) {
            unregisteredSatkers.push({
              kodeSatker,
              namaSatker: rawNama || `Satker ${kodeSatker}`,
              reason: 'Kode Satker tidak ditemukan dalam Master Data Referensi'
            });
            invalidRows.push({
              rowNumber: r + 1,
              kodeSatker,
              namaSatker: rawNama,
              reason: 'Satker belum terdaftar di Master Referensi'
            });
            continue;
          }

          if (!master.isActive) {
            invalidRows.push({
              rowNumber: r + 1,
              kodeSatker,
              namaSatker: master.namaSatker,
              reason: 'Satker berstatus Nonaktif'
            });
            continue;
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
            namaSatker: master.namaSatker,
            kementerianLembaga: master.kementerianLembaga || '',
            kodeBa: master.kodeBa || '',
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
 * 4. VALIDASI & PREVIEW EXCEL PEJABAT PERBENDAHARAAN TERISOLASI
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
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!matrix || matrix.length === 0) {
          throw new Error('File Excel Pejabat Perbendaharaan kosong.');
        }

        const masterMap = new Map<string, MasterSatker>();
        masterSatkers.forEach(m => {
          if (m.kodeSatker) masterMap.set(m.kodeSatker.trim(), m);
        });

        let headerRow = -1;
        let colKode = -1;
        let colNamaSatker = -1;
        let colNamaPejabat = -1;
        let colNip = -1;
        let colJabatan = -1;
        let colNoSertifikat = -1;
        let colStatusSertifikat = -1;
        let colTglKadaluarsa = -1;

        for (let r = 0; r < Math.min(25, matrix.length); r++) {
          const row = matrix[r];
          if (!row) continue;
          const rowLower = row.map(c => String(c).toLowerCase().trim());
          if (rowLower.some(c => c.includes('pejabat') || c.includes('ppk') || c.includes('ppspm') || c.includes('bendahara') || c.includes('sertifikat') || c.includes('nip'))) {
            headerRow = r;
            rowLower.forEach((val, idx) => {
              if (val.includes('kode') || val === 'kdsatker' || val === 'kd satker') {
                if (colKode === -1) colKode = idx;
              } else if (val.includes('nama satker') || val === 'satker') {
                if (colNamaSatker === -1) colNamaSatker = idx;
              } else if (val.includes('nama pejabat') || val.includes('nama pegawai') || val === 'nama') {
                if (colNamaPejabat === -1) colNamaPejabat = idx;
              } else if (val.includes('nip')) {
                if (colNip === -1) colNip = idx;
              } else if (val.includes('jabatan') || val.includes('peran')) {
                if (colJabatan === -1) colJabatan = idx;
              } else if (val.includes('sertifikat') || val.includes('no sertifikat')) {
                if (colNoSertifikat === -1) colNoSertifikat = idx;
              } else if (val.includes('status') || val.includes('sertifikasi')) {
                if (colStatusSertifikat === -1) colStatusSertifikat = idx;
              } else if (val.includes('kadaluarsa') || val.includes('expired') || val.includes('masa berlaku')) {
                if (colTglKadaluarsa === -1) colTglKadaluarsa = idx;
              }
            });
            break;
          }
        }

        if (colKode === -1) colKode = 1;
        if (colNamaPejabat === -1) colNamaPejabat = 2;

        const validData: PejabatSertifikasi[] = [];
        const invalidRows: any[] = [];
        const unregisteredSatkers: any[] = [];

        const startRow = headerRow !== -1 ? headerRow + 1 : 1;

        for (let r = startRow; r < matrix.length; r++) {
          const row = matrix[r];
          if (!row || row.length === 0) continue;

          const rawKode = row[colKode] || row[0] || '';
          const kodeSatker = normalizeKodeSatker(rawKode);
          const namaPejabat = cleanText(row[colNamaPejabat] || '');

          if (!kodeSatker || kodeSatker.length < 5 || !namaPejabat) continue;

          const master = masterMap.get(kodeSatker);
          if (!master) {
            unregisteredSatkers.push({
              kodeSatker,
              namaSatker: cleanText(row[colNamaSatker] || `Satker ${kodeSatker}`),
              reason: 'Kode Satker pejabat tidak terdaftar di Referensi Satker'
            });
            invalidRows.push({
              rowNumber: r + 1,
              kodeSatker,
              namaSatker: cleanText(row[colNamaSatker]),
              reason: 'Satker belum terdaftar di Master Referensi'
            });
            continue;
          }

          const nip = colNip !== -1 ? cleanText(row[colNip]) : '198501012010011001';
          const nmJabatan = colJabatan !== -1 ? cleanText(row[colJabatan]) : 'PPK (Pejabat Pembuat Komitmen)';
          const noSertifikat = colNoSertifikat !== -1 ? cleanText(row[colNoSertifikat]) : `BNSP-PPK-${kodeSatker}-01`;
          const tglKadaluarsa = colTglKadaluarsa !== -1 ? cleanText(row[colTglKadaluarsa]) : '2026-12-31';

          let status: 'Aktif' | 'Kadaluarsa' | 'Belum Tersertifikasi' = 'Aktif';
          if (colStatusSertifikat !== -1 && row[colStatusSertifikat]) {
            const rawStatus = cleanText(row[colStatusSertifikat]).toLowerCase();
            if (rawStatus.includes('kadaluarsa') || rawStatus.includes('expired')) {
              status = 'Kadaluarsa';
            } else if (rawStatus.includes('belum') || rawStatus.includes('tidak')) {
              status = 'Belum Tersertifikasi';
            } else {
              status = 'Aktif';
            }
          }

          validData.push({
            id: `pejabat-${kodeSatker}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            kdSatker: kodeSatker,
            nmSatker: master.namaSatker,
            nip,
            nama: namaPejabat,
            nmJabatan,
            noSertifikat,
            tglSertifikat: '2024-01-01',
            tglKadaluarsa,
            status,
            keterangan: status === 'Aktif' ? 'Sertifikat Valid' : 'Perlu Refreshment / Perpanjangan'
          });
        }

        resolve({
          file,
          fileName: file.name,
          fileSize: file.size,
          modul: 'PEJABAT',
          tahun: 2026,
          periode: 'Tahun 2026',
          totalRows: validData.length + invalidRows.length,
          validData,
          invalidRows,
          unregisteredSatkers,
          isValidFormat: validData.length > 0,
          formatErrors: validData.length === 0 ? ['Format file Pejabat Perbendaharaan tidak sesuai.'] : []
        });

      } catch (err: any) {
        reject(new Error(err.message || 'Gagal memproses file Excel Pejabat Perbendaharaan'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file Pejabat.'));
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
