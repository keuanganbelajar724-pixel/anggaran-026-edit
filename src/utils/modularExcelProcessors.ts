import * as XLSX from 'xlsx';
import {
  MasterSatker,
  IKPARecord,
  CapaianOutputRecord,
  PejabatSertifikasi,
  PengelolaanUPRecord,
  ExcelValidationPreview
} from '../types';
import { hitungTotalIKPA, getPredikatIKPA } from '../data/initialSatkerData';

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

          // Parse IKPA Indicators
          const revisiDipa = colRevisi !== -1 ? parseFormattedNumber(row[colRevisi], 100) : 100;
          const deviasiHal3Dipa = colDeviasi !== -1 ? parseFormattedNumber(row[colDeviasi], 100) : 100;
          const penyerapanAnggaran = colPenyerapan !== -1 ? parseFormattedNumber(row[colPenyerapan], 95) : 95;
          const belanjaKontraktual = colKontraktual !== -1 ? parseFormattedNumber(row[colKontraktual], 100) : 100;
          const penyelesaianTagihan = colTagihan !== -1 ? parseFormattedNumber(row[colTagihan], 100) : 100;
          const pengelolaanUpTup = colUpTup !== -1 ? parseFormattedNumber(row[colUpTup], 100) : 100;
          const dispensasiSpm = colDispensasi !== -1 ? parseFormattedNumber(row[colDispensasi], 100) : 100;
          const capaianOutput = colCapaianOutput !== -1 ? parseFormattedNumber(row[colCapaianOutput], 100) : 100;

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

          const calculatedTotal = colNilaiAkhir !== -1 && parseFormattedNumber(row[colNilaiAkhir]) > 0
            ? parseFormattedNumber(row[colNilaiAkhir])
            : hitungTotalIKPA(indikator);

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
 * 3. VALIDASI & PREVIEW EXCEL PENGELOLAAN UP / TUP TERISOLASI
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

        for (let r = 0; r < Math.min(25, matrix.length); r++) {
          const row = matrix[r];
          if (!row) continue;
          const rowLower = row.map(c => String(c).toLowerCase().trim());
          if (rowLower.some(c => c.includes('satker') || c.includes('up') || c.includes('gup') || c.includes('revolving'))) {
            headerRow = r;
            rowLower.forEach((val, idx) => {
              if (val.includes('kode') || val === 'kdsatker' || val === 'kd satker') {
                if (colKode === -1) colKode = idx;
              } else if (val.includes('nama satker') || val === 'uraian') {
                if (colNama === -1) colNama = idx;
              } else if (val.includes('pagu up') || val.includes('dipa up')) {
                if (colPaguUP === -1) colPaguUP = idx;
              } else if (val.includes('nilai up') || val.includes('besaran up') || val === 'up') {
                if (colNilaiUP === -1) colNilaiUP = idx;
              } else if (val.includes('gup') || val.includes('realisasi gup') || val.includes('pertanggungjawaban')) {
                if (colRealisasiGUP === -1) colRealisasiGUP = idx;
              } else if (val.includes('sisa') || val.includes('saldo')) {
                if (colSisaUP === -1) colSisaUP = idx;
              } else if (val.includes('revolving') || val.includes('persen') || val.includes('%')) {
                if (colPersenRevolving === -1) colPersenRevolving = idx;
              } else if (val.includes('frekuensi') || val.includes('kali') || val.includes('jumlah gup')) {
                if (colFrekuensi === -1) colFrekuensi = idx;
              } else if (val.includes('tanggal') || val.includes('sp2d') || val.includes('terakhir')) {
                if (colTglSP2D === -1) colTglSP2D = idx;
              }
            });
            break;
          }
        }

        if (colKode === -1) colKode = 1;
        if (colNama === -1) colNama = 2;

        const validData: PengelolaanUPRecord[] = [];
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
          const tglTerakhirSP2D = colTglSP2D !== -1 ? cleanText(row[colTglSP2D]) : '15-08-2026';

          let statusRevolving: 'Sangat Baik' | 'Optimal' | 'Lambat / Kritis' | 'Belum Revolving' = 'Optimal';
          if (persenRevolving >= 100) statusRevolving = 'Sangat Baik';
          else if (persenRevolving >= 75) statusRevolving = 'Optimal';
          else if (persenRevolving > 0) statusRevolving = 'Lambat / Kritis';
          else statusRevolving = 'Belum Revolving';

          const record: PengelolaanUPRecord = {
            id: `up-${kodeSatker}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            kodeSatker,
            namaSatker: master.namaSatker,
            kementerianLembaga: master.kementerianLembaga || '',
            kodeBa: master.kodeBa || '',
            paguUP,
            nilaiUP,
            realisasiGUP,
            sisaUP,
            persentaseRevolving: persenRevolving,
            frekuensiGUP,
            statusRevolving,
            tglTerakhirSP2D,
            hariTanpaRevolving: persenRevolving < 50 ? 32 : 12,
            peringatanKritis: statusRevolving === 'Lambat / Kritis' || statusRevolving === 'Belum Revolving',
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
          formatErrors: validData.length === 0 ? ['Format file Pengelolaan UP tidak sesuai.'] : []
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
