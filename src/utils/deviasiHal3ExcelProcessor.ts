import * as XLSX from 'xlsx';
import { DeviasiHal3Record, DeviasiJenisBelanjaDetail } from '../types';

export interface ProcessDeviasiHal3Result {
  records: DeviasiHal3Record[];
  summary: {
    totalSatker: number;
    totalBaris: number;
    totalRpd: number;
    totalRealisasi: number;
    totalDeviasiNominal: number;
    avgPersenDeviasi: number;
    sumRpd51: number;
    sumReal51: number;
    sumDev51: number;
    sumRpd52: number;
    sumReal52: number;
    sumDev52: number;
    sumRpd53: number;
    sumReal53: number;
    sumDev53: number;
    sumRpd57: number;
    sumReal57: number;
    sumDev57: number;
  };
  errors: string[];
}

export const PERIODE_BULAN_MAP: Record<number, string> = {
  1: 'Januari',
  2: 'Februari',
  3: 'Maret',
  4: 'April',
  5: 'Mei',
  6: 'Juni',
  7: 'Juli',
  8: 'Agustus',
  9: 'September',
  10: 'Oktober',
  11: 'November',
  12: 'Desember'
};

export const NAMA_BULAN_TO_NUM: Record<string, number> = {
  januari: 1,
  februari: 2,
  maret: 3,
  april: 4,
  mei: 5,
  juni: 6,
  juli: 7,
  agustus: 8,
  september: 9,
  oktober: 10,
  november: 11,
  desember: 12
};

export function parseNumeric(val: any, fallback = 0): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : fallback;
  if (val === null || val === undefined) return fallback;
  const str = String(val).trim().replace(/Rp/gi, '').replace(/\s+/g, '');
  if (!str) return fallback;
  
  let res: number;
  // Format Indonesia: 1.000.000,00 atau International: 1,000,000.00
  if (str.includes('.') && str.includes(',')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      // 1.000.000,50 -> 1000000.50
      res = parseFloat(str.replace(/\./g, '').replace(',', '.'));
    } else {
      // 1,000,000.50 -> 1000000.50
      res = parseFloat(str.replace(/,/g, ''));
    }
  } else if (str.includes(',')) {
    // 1000000,50 atau 10,5%
    res = parseFloat(str.replace(',', '.'));
  } else if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      // 1.000.000 -> 1000000
      res = parseFloat(str.replace(/\./g, ''));
    } else {
      res = parseFloat(str);
    }
  } else {
    res = parseFloat(str);
  }
  return Number.isFinite(res) ? res : fallback;
}

export function parsePeriodeBulan(rawPeriode: any, fallbackMonth = 'Agustus'): { periodeAngka: number; periodeBulan: string; periodeFormatted: string } {
  if (!rawPeriode) {
    const defaultNum = NAMA_BULAN_TO_NUM[fallbackMonth.toLowerCase()] || 8;
    return {
      periodeAngka: defaultNum,
      periodeBulan: PERIODE_BULAN_MAP[defaultNum] || fallbackMonth,
      periodeFormatted: `Periode ${String(defaultNum).padStart(2, '0')} (${PERIODE_BULAN_MAP[defaultNum]})`
    };
  }

  const str = String(rawPeriode).trim().toLowerCase();
  
  // Check if string contains month name e.g. "Agustus", "Bulan 8", "Januari"
  for (const [name, num] of Object.entries(NAMA_BULAN_TO_NUM)) {
    if (str.includes(name)) {
      return {
        periodeAngka: num,
        periodeBulan: PERIODE_BULAN_MAP[num],
        periodeFormatted: `Periode ${String(num).padStart(2, '0')} (${PERIODE_BULAN_MAP[num]})`
      };
    }
  }

  // Extract number e.g. "01", "1", "08", "8", "tw 3" -> 3? No, numeric match:
  const numMatch = str.match(/\b\d+\b/);
  if (numMatch) {
    let num = parseInt(numMatch[0], 10);
    if (num >= 1 && num <= 12) {
      const monthName = PERIODE_BULAN_MAP[num] || fallbackMonth;
      return {
        periodeAngka: num,
        periodeBulan: monthName,
        periodeFormatted: `Periode ${String(num).padStart(2, '0')} (${monthName})`
      };
    }
  }

  const fallbackNum = NAMA_BULAN_TO_NUM[fallbackMonth.toLowerCase()] || 8;
  return {
    periodeAngka: fallbackNum,
    periodeBulan: PERIODE_BULAN_MAP[fallbackNum] || fallbackMonth,
    periodeFormatted: `Periode ${String(fallbackNum).padStart(2, '0')} (${PERIODE_BULAN_MAP[fallbackNum]})`
  };
}

export function processDeviasiHal3Excel(fileBuffer: ArrayBuffer | Uint8Array, fileName: string): ProcessDeviasiHal3Result {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const errors: string[] = [];

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    return {
      records: [],
      summary: createEmptySummary(),
      errors: ['File Excel tidak memiliki lembar kerja (worksheet).']
    };
  }

  let bestRecords: DeviasiHal3Record[] = [];

  // 1. First attempt: scan all sheets with OMSPAN Specific / Matrix Parser
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rawRows || rawRows.length < 2) continue;

    const sheetRecords = parseOMSPANRows(rawRows, fileName);
    if (sheetRecords.length > bestRecords.length) {
      bestRecords = sheetRecords;
    }
  }

  // 2. Fallback heuristic attempt if no records found
  if (bestRecords.length === 0) {
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!rawRows || rawRows.length === 0) continue;

      const fallbackRecords = parseFallbackRows(rawRows);
      if (fallbackRecords.length > bestRecords.length) {
        bestRecords = fallbackRecords;
      }
    }
  }

  if (bestRecords.length === 0) {
    return {
      records: [],
      summary: createEmptySummary(),
      errors: [
        'Tidak ditemukan baris data Satker yang valid dalam file Excel.',
        'Pastikan file memuat kolom Kode Satker, Nama Satker, Periode (Kolom F), dan rincian belanja (51, 52, 53, 57).'
      ]
    };
  }

  // Summary aggregation
  const totalBaris = bestRecords.length;
  const uniqueSatkers = new Set(bestRecords.map(r => r.kodeSatker));
  const totalSatker = uniqueSatkers.size;

  const totalRpd = bestRecords.reduce((sum, r) => sum + (r.rpdTotal || 0), 0);
  const totalRealisasi = bestRecords.reduce((sum, r) => sum + (r.realisasiTotal || 0), 0);
  const totalDeviasiNominal = bestRecords.reduce((sum, r) => sum + (r.deviasiNominalTotal || 0), 0);
  const avgPersenDeviasi = totalBaris > 0 
    ? Number((bestRecords.reduce((sum, r) => sum + (r.persenDeviasiTotal || 0), 0) / totalBaris).toFixed(2))
    : 0;

  const sumRpd51 = bestRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja51?.rpd || 0), 0);
  const sumReal51 = bestRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja51?.realisasi || 0), 0);
  const sumDev51 = bestRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja51?.deviasiNominal || 0), 0);

  const sumRpd52 = bestRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja52?.rpd || 0), 0);
  const sumReal52 = bestRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja52?.realisasi || 0), 0);
  const sumDev52 = bestRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja52?.deviasiNominal || 0), 0);

  const sumRpd53 = bestRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja53?.rpd || 0), 0);
  const sumReal53 = bestRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja53?.realisasi || 0), 0);
  const sumDev53 = bestRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja53?.deviasiNominal || 0), 0);

  const sumRpd57 = bestRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja57?.rpd || 0), 0);
  const sumReal57 = bestRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja57?.realisasi || 0), 0);
  const sumDev57 = bestRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja57?.deviasiNominal || 0), 0);

  return {
    records: bestRecords,
    summary: {
      totalSatker,
      totalBaris,
      totalRpd,
      totalRealisasi,
      totalDeviasiNominal,
      avgPersenDeviasi,
      sumRpd51,
      sumReal51,
      sumDev51,
      sumRpd52,
      sumReal52,
      sumDev52,
      sumRpd53,
      sumReal53,
      sumDev53,
      sumRpd57,
      sumReal57,
      sumDev57
    },
    errors
  };
}

function createEmptySummary() {
  return {
    totalSatker: 0,
    totalBaris: 0,
    totalRpd: 0,
    totalRealisasi: 0,
    totalDeviasiNominal: 0,
    avgPersenDeviasi: 0,
    sumRpd51: 0,
    sumReal51: 0,
    sumDev51: 0,
    sumRpd52: 0,
    sumReal52: 0,
    sumDev52: 0,
    sumRpd53: 0,
    sumReal53: 0,
    sumDev53: 0,
    sumRpd57: 0,
    sumReal57: 0,
    sumDev57: 0
  };
}

/**
 * Standard OMSPAN Parser:
 * Matches Kolom A-Y based on the exact OMSPAN Deviasi Halaman III DIPA specifications:
 * Col A (0): NO
 * Col B (1): Kode Satker
 * Col C (2): Nama Satker
 * Col D (3): Kode KPPN
 * Col E (4): Kode Eselon 1
 * Col F (5): Periode (01..12)
 * Col G (6): Rencana 51 (Pegawai)
 * Col H (7): Rencana 52 (Barang)
 * Col I (8): Rencana 53 (Modal)
 * Col J (9): Rencana 57 (Bansos)
 * Col K (10): Penyerapan 51
 * Col L (11): Penyerapan 52
 * Col M (12): Penyerapan 53
 * Col N (13): Penyerapan 57
 * Col O (14): Deviasi 51
 * Col P (15): Deviasi 52
 * Col Q (16): Deviasi 53
 * Col R (17): Deviasi 57
 * Col S (18): % Deviasi 51
 * Col T (19): % Deviasi 52
 * Col U (20): % Deviasi 53
 * Col V (21): % Deviasi 57
 * Col W (22): Tanggal Posting
 * Col X (23): No Revisi Terakhir
 * Col Y (24): Klasifikasi Satker
 */
function parseOMSPANRows(rawRows: any[][], fileName: string): DeviasiHal3Record[] {
  const records: DeviasiHal3Record[] = [];

  // Find the header row (typically row 6 or rows 6 & 7)
  let startDataRow = -1;
  let colIdxMap = {
    kodeSatker: 1,
    namaSatker: 2,
    kodeKppn: 3,
    kodeEselon1: 4,
    periode: 5,
    rpd51: 6,
    rpd52: 7,
    rpd53: 8,
    rpd57: 9,
    real51: 10,
    real52: 11,
    real53: 12,
    real57: 13,
    dev51: 14,
    dev52: 15,
    dev53: 16,
    dev57: 17,
    persen51: 18,
    persen52: 19,
    persen53: 20,
    persen57: 21,
    tglPosting: 22,
    noRevisi: 23,
    klasifikasi: 24
  };

  // Dynamically detect header positions if shifted
  for (let r = 0; r < Math.min(25, rawRows.length); r++) {
    const row = rawRows[r] || [];
    const rowStr = row.map(c => String(c || '').toLowerCase().trim()).join(' ');

    if (rowStr.includes('kode satker') && (rowStr.includes('periode') || rowStr.includes('rencana') || rowStr.includes('penyerapan'))) {
      // Find columns dynamically in this row or next row
      const nextRow = rawRows[r + 1] || [];
      
      row.forEach((cell: any, cIdx: number) => {
        const cellStr = String(cell || '').toLowerCase().trim();
        if (cellStr.includes('kode satker') || cellStr === 'kdsatker') colIdxMap.kodeSatker = cIdx;
        if (cellStr.includes('nama satker') || cellStr === 'nmsatker') colIdxMap.namaSatker = cIdx;
        if (cellStr.includes('kode kppn') || cellStr === 'kppn') colIdxMap.kodeKppn = cIdx;
        if (cellStr.includes('eselon') || cellStr.includes('kode eselon')) colIdxMap.kodeEselon1 = cIdx;
        if (cellStr.includes('periode') || cellStr.includes('bulan')) colIdxMap.periode = cIdx;
        if (cellStr.includes('posting') || cellStr.includes('tanggal')) colIdxMap.tglPosting = cIdx;
        if (cellStr.includes('revisi') || cellStr.includes('no revisi')) colIdxMap.noRevisi = cIdx;
        if (cellStr.includes('klasifikasi')) colIdxMap.klasifikasi = cIdx;
      });

      // Check subheader in next row for 51, 52, 53, 57
      const combinedNext = nextRow.map((c: any) => String(c || '').trim());
      if (combinedNext.includes('51') || combinedNext.includes('52')) {
        startDataRow = r + 2;
      } else {
        startDataRow = r + 1;
      }
      break;
    }
  }

  // If header wasn't matched explicitly, check if row index 7 has data following OMSPAN pattern
  if (startDataRow === -1) {
    if (rawRows.length > 7) {
      // Check if row 7 has satker code at col 1
      const testRow = rawRows[7] || [];
      const testCode = String(testRow[1] || '').trim();
      if (testCode.length >= 5 && /^\d+$/.test(testCode)) {
        startDataRow = 7;
      }
    }
  }

  if (startDataRow === -1) {
    startDataRow = 1; // Try starting from row 1
  }

  for (let r = startDataRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rawKode = String(row[colIdxMap.kodeSatker] ?? '').trim();
    const rawNama = String(row[colIdxMap.namaSatker] ?? '').trim();

    // If both kode & nama are empty, or it's a total row, skip
    if (!rawKode && !rawNama) continue;
    const lowerKode = rawKode.toLowerCase();
    const lowerNama = rawNama.toLowerCase();
    if (
      lowerKode.includes('total') || lowerNama.includes('total') ||
      lowerKode.includes('jumlah') || lowerNama.includes('jumlah') ||
      lowerKode.includes('rata-rata') || lowerNama.includes('rata-rata') ||
      lowerKode.includes('rekapitulasi') || lowerNama.includes('rekapitulasi') ||
      lowerKode === 'kode satker' || lowerNama === 'nama satker'
    ) {
      continue;
    }

    // Clean kode satker (e.g. "030073" -> keep leading zero if present, format 6 digits)
    let kodeSatker = rawKode.replace(/[^0-9]/g, '');
    if (!kodeSatker && rawNama) {
      kodeSatker = `SATKER-${r + 1}`;
    }
    if (kodeSatker.length < 6 && kodeSatker.length > 0) {
      kodeSatker = kodeSatker.padStart(6, '0');
    }

    const namaSatker = rawNama || `Satker ${kodeSatker}`;
    const kodeKppn = String(row[colIdxMap.kodeKppn] ?? '').trim() || '026';
    const kodeEselon1 = String(row[colIdxMap.kodeEselon1] ?? '').trim();
    const rawPeriode = row[colIdxMap.periode];
    const { periodeAngka, periodeBulan, periodeFormatted } = parsePeriodeBulan(rawPeriode);

    // Read Rencana (RPD) 51, 52, 53, 57
    const rpd51 = parseNumeric(row[colIdxMap.rpd51]);
    const rpd52 = parseNumeric(row[colIdxMap.rpd52]);
    const rpd53 = parseNumeric(row[colIdxMap.rpd53]);
    const rpd57 = parseNumeric(row[colIdxMap.rpd57]);
    const rpdTotal = rpd51 + rpd52 + rpd53 + rpd57;

    // Read Realisasi (Penyerapan) 51, 52, 53, 57
    const real51 = parseNumeric(row[colIdxMap.real51]);
    const real52 = parseNumeric(row[colIdxMap.real52]);
    const real53 = parseNumeric(row[colIdxMap.real53]);
    const real57 = parseNumeric(row[colIdxMap.real57]);
    const realisasiTotal = real51 + real52 + real53 + real57;

    // Read Deviasi Nominal (Rp) 51, 52, 53, 57
    let dev51 = parseNumeric(row[colIdxMap.dev51]);
    let dev52 = parseNumeric(row[colIdxMap.dev52]);
    let dev53 = parseNumeric(row[colIdxMap.dev53]);
    let dev57 = parseNumeric(row[colIdxMap.dev57]);

    if (dev51 === 0 && (rpd51 > 0 || real51 > 0)) dev51 = Math.abs(real51 - rpd51);
    if (dev52 === 0 && (rpd52 > 0 || real52 > 0)) dev52 = Math.abs(real52 - rpd52);
    if (dev53 === 0 && (rpd53 > 0 || real53 > 0)) dev53 = Math.abs(real53 - rpd53);
    if (dev57 === 0 && (rpd57 > 0 || real57 > 0)) dev57 = Math.abs(real57 - rpd57);

    const deviasiNominalTotal = dev51 + dev52 + dev53 + dev57;

    // Read % Deviasi 51, 52, 53, 57
    let persen51 = parseNumeric(row[colIdxMap.persen51]);
    let persen52 = parseNumeric(row[colIdxMap.persen52]);
    let persen53 = parseNumeric(row[colIdxMap.persen53]);
    let persen57 = parseNumeric(row[colIdxMap.persen57]);

    // Handle decimal fractions e.g. 0.05 -> 5.0%
    if (persen51 > 0 && persen51 <= 1.0) persen51 = Number((persen51 * 100).toFixed(2));
    if (persen52 > 0 && persen52 <= 1.0) persen52 = Number((persen52 * 100).toFixed(2));
    if (persen53 > 0 && persen53 <= 1.0) persen53 = Number((persen53 * 100).toFixed(2));
    if (persen57 > 0 && persen57 <= 1.0) persen57 = Number((persen57 * 100).toFixed(2));

    if (persen51 === 0 && rpd51 > 0) persen51 = Number(((dev51 / rpd51) * 100).toFixed(2));
    if (persen52 === 0 && rpd52 > 0) persen52 = Number(((dev52 / rpd52) * 100).toFixed(2));
    if (persen53 === 0 && rpd53 > 0) persen53 = Number(((dev53 / rpd53) * 100).toFixed(2));
    if (persen57 === 0 && rpd57 > 0) persen57 = Number(((dev57 / rpd57) * 100).toFixed(2));

    // Calculate Total / Average % Deviasi
    let persenDeviasiTotal = 0;
    if (rpdTotal > 0) {
      persenDeviasiTotal = Number(((deviasiNominalTotal / rpdTotal) * 100).toFixed(2));
    } else {
      // Average of non-zero percentages
      const activePersens = [persen51, persen52, persen53, persen57].filter(p => p > 0);
      if (activePersens.length > 0) {
        persenDeviasiTotal = Number((activePersens.reduce((a, b) => a + b, 0) / activePersens.length).toFixed(2));
      }
    }

    const tglPosting = String(row[colIdxMap.tglPosting] ?? '').trim();
    const noRevisi = row[colIdxMap.noRevisi] !== undefined ? String(row[colIdxMap.noRevisi]).trim() : '';
    const klasifikasi = String(row[colIdxMap.klasifikasi] ?? '').trim();

    // Rincian Detail
    const belanja51: DeviasiJenisBelanjaDetail = {
      jenisBelanja: 'Belanja Pegawai (51)',
      akun: '51',
      rpd: rpd51,
      realisasi: real51,
      deviasiNominal: dev51,
      persenDeviasi: persen51,
      status: persen51 <= 5 ? 'Aman' : persen51 <= 10 ? 'Waspada' : persen51 <= 20 ? 'Tinggi' : 'Kritis'
    };

    const belanja52: DeviasiJenisBelanjaDetail = {
      jenisBelanja: 'Belanja Barang (52)',
      akun: '52',
      rpd: rpd52,
      realisasi: real52,
      deviasiNominal: dev52,
      persenDeviasi: persen52,
      status: persen52 <= 5 ? 'Aman' : persen52 <= 10 ? 'Waspada' : persen52 <= 20 ? 'Tinggi' : 'Kritis'
    };

    const belanja53: DeviasiJenisBelanjaDetail = {
      jenisBelanja: 'Belanja Modal (53)',
      akun: '53',
      rpd: rpd53,
      realisasi: real53,
      deviasiNominal: dev53,
      persenDeviasi: persen53,
      status: persen53 <= 5 ? 'Aman' : persen53 <= 10 ? 'Waspada' : persen53 <= 20 ? 'Tinggi' : 'Kritis'
    };

    const belanja57: DeviasiJenisBelanjaDetail = {
      jenisBelanja: 'Belanja Bansos (57)',
      akun: '57',
      rpd: rpd57,
      realisasi: real57,
      deviasiNominal: dev57,
      persenDeviasi: persen57,
      status: persen57 <= 5 ? 'Aman' : persen57 <= 10 ? 'Waspada' : persen57 <= 20 ? 'Tinggi' : 'Kritis'
    };

    // Triwulan calculation
    const triwulan = (periodeAngka <= 3 ? 'TW I' : periodeAngka <= 6 ? 'TW II' : periodeAngka <= 9 ? 'TW III' : 'TW IV') as any;

    records.push({
      id: `deviasi-${kodeSatker}-${periodeAngka}-${r}`,
      kodeSatker,
      namaSatker,
      kementerianLembaga: 'Kementerian/Lembaga Mitra',
      kodeKppn,
      kodeEselon1,
      periodeAngka,
      periodeBulan,
      periodeFormatted,
      triwulan,
      tahun: 2026,
      tanggalPosting: tglPosting,
      noRevisiTerakhir: noRevisi,
      klasifikasiSatker: klasifikasi,
      rpdTotal,
      realisasiTotal,
      deviasiNominalTotal,
      persenDeviasiTotal,
      rincianJenisBelanja: {
        belanjaPegawai: belanja51,
        belanjaBarang: belanja52,
        belanjaModal: belanja53,
        belanjaBansos: belanja57,
        belanja51,
        belanja52,
        belanja53,
        belanja57
      },
      earlyWarningAlert: persenDeviasiTotal > 10.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return records;
}

/**
 * Fallback parser for generic formats
 */
function parseFallbackRows(rawRows: any[][]): DeviasiHal3Record[] {
  const records: DeviasiHal3Record[] = [];

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    let kodeSatker = '';
    let namaSatker = '';
    let periodeAngka = 8;
    const numericValues: number[] = [];

    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c] || '').trim();
      if (!cellVal) continue;

      if (!kodeSatker) {
        const m = cellVal.match(/\b\d{5,7}\b/);
        if (m) {
          kodeSatker = m[0];
          continue;
        }
      }

      if (!namaSatker && isNaN(Number(cellVal)) && cellVal.length > 4) {
        const lower = cellVal.toLowerCase();
        if (!lower.includes('total') && !lower.includes('jumlah') && !lower.includes('laporan')) {
          namaSatker = cellVal;
          continue;
        }
      }

      const num = parseNumeric(cellVal);
      if (!isNaN(num)) {
        numericValues.push(num);
      }
    }

    if (!kodeSatker && !namaSatker) continue;
    if (kodeSatker && !namaSatker) namaSatker = `Satker ${kodeSatker}`;
    if (!kodeSatker && namaSatker) kodeSatker = `SATKER-${r + 1}`;

    const rpdTotal = numericValues[0] || 0;
    const realisasiTotal = numericValues[1] || 0;
    const deviasiNominalTotal = numericValues[2] || Math.abs(realisasiTotal - rpdTotal);
    const persenDeviasiTotal = rpdTotal > 0 ? Number(((deviasiNominalTotal / rpdTotal) * 100).toFixed(2)) : 0;

    const periodeBulan = PERIODE_BULAN_MAP[periodeAngka] || 'Agustus';
    const periodeFormatted = `Periode ${String(periodeAngka).padStart(2, '0')} (${periodeBulan})`;

    records.push({
      id: `deviasi-${kodeSatker}-${periodeAngka}-${r}`,
      kodeSatker,
      namaSatker,
      kementerianLembaga: 'Kementerian/Lembaga Mitra',
      periodeAngka,
      periodeBulan,
      periodeFormatted,
      tahun: 2026,
      rpdTotal,
      realisasiTotal,
      deviasiNominalTotal,
      persenDeviasiTotal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return records;
}

/**
 * Unduh Template Excel Standar OMSPAN
 */
export function downloadDeviasiHal3TemplateExcel() {
  const headers1 = [
    'NO', 'Kode Satker', 'Nama Satker', 'Kode KPPN', 'Kode Eselon 1', 'Periode',
    'Rencana', '', '', '',
    'Penyerapan', '', '', '',
    'Deviasi', '', '', '',
    '% Deviasi', '', '', '',
    'Tanggal Posting', 'No Revisi Terakhir', 'Klasifikasi Satker'
  ];

  const headers2 = [
    '', '', '', '', '', '',
    '51', '52', '53', '57',
    '51', '52', '53', '57',
    '51', '52', '53', '57',
    '51', '52', '53', '57',
    '', '', ''
  ];

  const sampleRows = [
    [
      1, '030073', 'DINAS KEPEMUDAAN, OLAHRAGA DAN PARIWISATA PROVINSI JAWA TENGAH', '026', '09201', '01',
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      '30 12 2025', '1', 'BLU/FULL BLOKIR'
    ],
    [
      2, '035166', 'RUMKIT BHAYANGKARA AKPOL LEMDIKLAT POLRI', '026', '06001', '01',
      452753814, 5992720, 0, 0,
      452753814, 5922720, 0, 0,
      0, 70000, 0, 0,
      0, 1.17, 0, 0,
      '19 02 2026', '1', 'NON BLU/NON FULL BLOKIR'
    ],
    [
      3, '119436', 'KANTOR WILAYAH DJP JAWA TENGAH I', '026', '01504', '01',
      58598000, 14679749, 0, 0,
      58598000, 14679750, 0, 0,
      0, 1, 0, 0,
      0, 0, 0, 0,
      '13 02 2026', '3', 'NON BLU/NON FULL BLOKIR'
    ]
  ];

  const wsData = [
    ['Monitoring RPD Halaman III DIPA'],
    [`Waktu unduh excel: ${new Date().toLocaleDateString('id-ID')}`],
    ['Sampai Dengan : TRIWULAN III'],
    [],
    [],
    headers1,
    headers2,
    ...sampleRows
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Monitoring RPD Halaman III DIPA');

  XLSX.writeFile(wb, `Template_Deviasi_Halaman_III_DIPA_OMSPAN.xlsx`);
}

/**
 * Ekspor Data Monitoring Deviasi ke Excel
 */
export function exportDeviasiHal3ToExcel(records: DeviasiHal3Record[], fileName = 'Monitoring_Deviasi_Hal3_DIPA.xlsx') {
  const exportData = records.map((r, idx) => ({
    'NO': idx + 1,
    'Kode Satker': r.kodeSatker,
    'Nama Satker': r.namaSatker,
    'Kode KPPN': r.kodeKppn || '026',
    'Kode Eselon 1': r.kodeEselon1 || '',
    'Periode': r.periodeAngka ? String(r.periodeAngka).padStart(2, '0') : r.periodeBulan,
    'Rencana 51 (Rp)': r.rincianJenisBelanja?.belanja51?.rpd || 0,
    'Rencana 52 (Rp)': r.rincianJenisBelanja?.belanja52?.rpd || 0,
    'Rencana 53 (Rp)': r.rincianJenisBelanja?.belanja53?.rpd || 0,
    'Rencana 57 (Rp)': r.rincianJenisBelanja?.belanja57?.rpd || 0,
    'Total Rencana (Rp)': r.rpdTotal,
    'Realisasi 51 (Rp)': r.rincianJenisBelanja?.belanja51?.realisasi || 0,
    'Realisasi 52 (Rp)': r.rincianJenisBelanja?.belanja52?.realisasi || 0,
    'Realisasi 53 (Rp)': r.rincianJenisBelanja?.belanja53?.realisasi || 0,
    'Realisasi 57 (Rp)': r.rincianJenisBelanja?.belanja57?.realisasi || 0,
    'Total Realisasi (Rp)': r.realisasiTotal,
    'Deviasi 51 (Rp)': r.rincianJenisBelanja?.belanja51?.deviasiNominal || 0,
    'Deviasi 52 (Rp)': r.rincianJenisBelanja?.belanja52?.deviasiNominal || 0,
    'Deviasi 53 (Rp)': r.rincianJenisBelanja?.belanja53?.deviasiNominal || 0,
    'Deviasi 57 (Rp)': r.rincianJenisBelanja?.belanja57?.deviasiNominal || 0,
    'Total Deviasi (Rp)': r.deviasiNominalTotal,
    '% Deviasi 51': (r.rincianJenisBelanja?.belanja51?.persenDeviasi || 0).toFixed(2) + '%',
    '% Deviasi 52': (r.rincianJenisBelanja?.belanja52?.persenDeviasi || 0).toFixed(2) + '%',
    '% Deviasi 53': (r.rincianJenisBelanja?.belanja53?.persenDeviasi || 0).toFixed(2) + '%',
    '% Deviasi 57': (r.rincianJenisBelanja?.belanja57?.persenDeviasi || 0).toFixed(2) + '%',
    '% Deviasi Total': r.persenDeviasiTotal.toFixed(2) + '%',
    'Tanggal Posting': r.tanggalPosting || '',
    'No Revisi Terakhir': r.noRevisiTerakhir || '',
    'Klasifikasi Satker': r.klasifikasiSatker || ''
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Deviasi Hal III DIPA');

  XLSX.writeFile(wb, fileName);
}
