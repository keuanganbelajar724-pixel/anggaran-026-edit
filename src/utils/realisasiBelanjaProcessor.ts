import * as XLSX from 'xlsx';
import { 
  RealisasiBelanjaRecord, 
  RealisasiBelanjaSummary, 
  BuletinConfig,
  MyIntressRecord,
  MyIntressSummary,
  SatkerReconciliationDiff
} from '../types';
import { INITIAL_MY_INTRESS_DATA } from '../data/initialMyIntressData';

// Satker Master Lookup Map for resolving official names across all datasets
const SATKER_MASTER_MAP = new Map<string, string>();
if (Array.isArray(INITIAL_MY_INTRESS_DATA)) {
  INITIAL_MY_INTRESS_DATA.forEach(s => {
    if (s && s.kodeSatker && s.namaSatker) {
      SATKER_MASTER_MAP.set(String(s.kodeSatker).trim(), String(s.namaSatker).trim());
    }
  });
}

/**
 * Standard Indonesian APBN Sumber Dana Reference Dictionary (Kemenkeu / SPAN / SAKTI / MonSAKTI)
 */
export const SUMBER_DANA_DICTIONARY: Record<string, { kode: string; singkatan: string; nama: string; label: string }> = {
  '01': { kode: '01', singkatan: 'RM', nama: 'Rupiah Murni', label: 'Rupiah Murni (RM)' },
  '02': { kode: '02', singkatan: 'RMP', nama: 'Rupiah Murni Pendamping', label: 'Rupiah Murni Pendamping (RMP)' },
  '03': { kode: '03', singkatan: 'PLN', nama: 'Pinjaman Luar Negeri', label: 'Pinjaman Luar Negeri (PLN)' },
  '04': { kode: '04', singkatan: 'HLN', nama: 'Hibah Luar Negeri', label: 'Hibah Luar Negeri (HLN)' },
  '05': { kode: '05', singkatan: 'HDN', nama: 'Hibah Dalam Negeri', label: 'Hibah Dalam Negeri (HDN)' },
  '06': { kode: '06', singkatan: 'PNBP', nama: 'Penerimaan Negara Bukan Pajak', label: 'Penerimaan Negara Bukan Pajak (PNBP)' },
  '07': { kode: '07', singkatan: 'BLU', nama: 'Badan Layanan Umum', label: 'Badan Layanan Umum (BLU)' },
  '08': { kode: '08', singkatan: 'PDN', nama: 'Pinjaman Dalam Negeri', label: 'Pinjaman Dalam Negeri (PDN)' },
  '09': { kode: '09', singkatan: 'SBSN', nama: 'Surat Berharga Syariah Negara', label: 'Surat Berharga Syariah Negara (SBSN)' },
  '10': { kode: '10', singkatan: 'SBSN PBS', nama: 'SBSN Project Based Sukuk', label: 'SBSN Project Based Sukuk (PBS)' },
  '11': { kode: '11', singkatan: 'PNBP-TK', nama: 'PNBP Ditarik Kembali', label: 'PNBP Ditarik Kembali' },
  '14': { kode: '14', singkatan: 'SBSN Reguler', nama: 'SBSN Reguler', label: 'SBSN Reguler' },
  '15': { kode: '15', singkatan: 'Hibah Terencana', nama: 'Hibah Terencana', label: 'Hibah Terencana' },
  '16': { kode: '16', singkatan: 'Hibah Langsung', nama: 'Hibah Langsung', label: 'Hibah Langsung' },
  '18': { kode: '18', singkatan: 'SBSN DPP', nama: 'SBSN Dana Proyek Pemerintah', label: 'SBSN Dana Proyek Pemerintah (DPP)' },
  '19': { kode: '19', singkatan: 'SBSN Proyek', nama: 'SBSN Pembiayaan Proyek', label: 'SBSN Pembiayaan Proyek (19)' },
};

/**
 * Resolve official Sumber Dana Code and Descriptive Name (e.g. 01 -> Rupiah Murni (RM), 19 -> SBSN Pembiayaan Proyek)
 */
export function getOfficialSumberDanaName(kode?: string, uraian?: string): { kode: string; uraian: string; label: string; nama: string; singkatan: string } {
  const cleanKode = String(kode || '').trim();
  const cleanUraian = String(uraian || '').trim();

  // Normalize numeric 1-digit code to 2-digits (e.g. "1" -> "01")
  const paddedKode = /^\d+$/.test(cleanKode) && cleanKode.length === 1 ? `0${cleanKode}` : cleanKode;
  const paddedUraian = /^\d+$/.test(cleanUraian) && cleanUraian.length === 1 ? `0${cleanUraian}` : cleanUraian;

  // 1. If uraian is actually a numeric code key (e.g. "01", "19", "03", "06", "10", "18")
  if (SUMBER_DANA_DICTIONARY[paddedUraian]) {
    const info = SUMBER_DANA_DICTIONARY[paddedUraian];
    return { kode: info.kode, uraian: info.label, label: info.label, nama: info.nama, singkatan: info.singkatan };
  }

  // 2. If kode matches dictionary
  if (SUMBER_DANA_DICTIONARY[paddedKode]) {
    const info = SUMBER_DANA_DICTIONARY[paddedKode];
    // If cleanUraian is descriptive text and not just numbers or code
    const isDescriptive = cleanUraian && cleanUraian !== cleanKode && !/^\d+$/.test(cleanUraian);
    const resolvedUraian = isDescriptive ? (cleanUraian.length > 3 ? cleanUraian : info.label) : info.label;
    return { kode: info.kode, uraian: resolvedUraian, label: info.label, nama: info.nama, singkatan: info.singkatan };
  }

  // 3. Keyword matching on text
  const upper = `${cleanKode} ${cleanUraian}`.toUpperCase();
  if (upper.includes('SBSN') && (upper.includes('19') || upper.includes('PROYEK') || upper.includes('PEMBIAYAAN'))) {
    return { kode: cleanKode || '19', uraian: 'SBSN Pembiayaan Proyek', label: 'SBSN Pembiayaan Proyek (19)', nama: 'SBSN Pembiayaan Proyek', singkatan: 'SBSN Proyek' };
  }
  if (upper.includes('SBSN') && (upper.includes('10') || upper.includes('PBS'))) {
    return { kode: cleanKode || '10', uraian: 'SBSN Project Based Sukuk (PBS)', label: 'SBSN Project Based Sukuk (PBS)', nama: 'SBSN Project Based Sukuk', singkatan: 'SBSN PBS' };
  }
  if (upper.includes('SBSN') && (upper.includes('18') || upper.includes('DPP'))) {
    return { kode: cleanKode || '18', uraian: 'SBSN Dana Proyek Pemerintah (DPP)', label: 'SBSN Dana Proyek Pemerintah (DPP)', nama: 'SBSN Dana Proyek Pemerintah', singkatan: 'SBSN DPP' };
  }
  if (upper.includes('SBSN')) {
    return { kode: cleanKode || '09', uraian: 'Surat Berharga Syariah Negara (SBSN)', label: 'Surat Berharga Syariah Negara (SBSN)', nama: 'Surat Berharga Syariah Negara', singkatan: 'SBSN' };
  }
  if (upper.includes('RM') || upper.includes('RUPIAH MURNI')) {
    if (upper.includes('PENDAMPING') || upper.includes('RMP') || upper.includes('02')) {
      return { kode: cleanKode || '02', uraian: 'Rupiah Murni Pendamping (RMP)', label: 'Rupiah Murni Pendamping (RMP)', nama: 'Rupiah Murni Pendamping', singkatan: 'RMP' };
    }
    return { kode: cleanKode || '01', uraian: 'Rupiah Murni (RM)', label: 'Rupiah Murni (RM)', nama: 'Rupiah Murni', singkatan: 'RM' };
  }
  if (upper.includes('PNBP')) {
    return { kode: cleanKode || '06', uraian: 'Penerimaan Negara Bukan Pajak (PNBP)', label: 'Penerimaan Negara Bukan Pajak (PNBP)', nama: 'Penerimaan Negara Bukan Pajak', singkatan: 'PNBP' };
  }
  if (upper.includes('BLU')) {
    return { kode: cleanKode || '07', uraian: 'Badan Layanan Umum (BLU)', label: 'Badan Layanan Umum (BLU)', nama: 'Badan Layanan Umum', singkatan: 'BLU' };
  }
  if (upper.includes('PLN') || upper.includes('PINJAMAN')) {
    return { kode: cleanKode || '03', uraian: 'Pinjaman Luar Negeri (PLN)', label: 'Pinjaman Luar Negeri (PLN)', nama: 'Pinjaman Luar Negeri', singkatan: 'PLN' };
  }
  if (upper.includes('HLN') || upper.includes('HIBAH')) {
    return { kode: cleanKode || '04', uraian: 'Hibah Luar Negeri (HLN)', label: 'Hibah Luar Negeri (HLN)', nama: 'Hibah Luar Negeri', singkatan: 'HLN' };
  }

  // 4. If cleanUraian is descriptive and not pure digits
  if (cleanUraian && !/^\d+$/.test(cleanUraian)) {
    return { kode: cleanKode || '01', uraian: cleanUraian, label: cleanUraian, nama: cleanUraian, singkatan: cleanUraian };
  }

  // Fallback default
  return { kode: cleanKode || '01', uraian: 'Rupiah Murni (RM)', label: 'Rupiah Murni (RM)', nama: 'Rupiah Murni', singkatan: 'RM' };
}

/**
 * Resolve official satker name from Column P or master reference
 */
export function getOfficialSatkerName(kode: string, fallbackName?: string): string {
  const cleanKode = String(kode || '').trim();
  const cleanFallback = String(fallbackName || '').trim();

  // If fallback is already a valid descriptive text (not empty, not equal to code, not purely numbers)
  if (
    cleanFallback &&
    cleanFallback !== cleanKode &&
    !/^\d+$/.test(cleanFallback) &&
    cleanFallback.length >= 3 &&
    !cleanFallback.toLowerCase().startsWith('satker ')
  ) {
    return cleanFallback;
  }

  // Lookup in master dictionary
  if (cleanKode && SATKER_MASTER_MAP.has(cleanKode)) {
    return SATKER_MASTER_MAP.get(cleanKode)!;
  }

  if (cleanFallback && cleanFallback !== cleanKode && !/^\d+$/.test(cleanFallback)) {
    return cleanFallback;
  }

  return cleanKode ? `Satker ${cleanKode}` : 'Satuan Kerja';
}

// Helper to clean text
function cleanText(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/\s+/g, ' ');
}

// Helper to parse currency or formatted number from Excel / CSV
export function parseNum(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) || !Number.isFinite(val) ? 0 : val;
  
  let str = String(val).trim().replace(/Rp|\$|%|\s/gi, '');
  if (!str) return 0;

  // Check if string contains dots and/or commas
  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  if (hasComma && hasDot) {
    const lastCommaIndex = str.lastIndexOf(',');
    const lastDotIndex = str.lastIndexOf('.');
    if (lastCommaIndex > lastDotIndex) {
      // Indonesian format: 1.234.567,89 -> remove dots, replace comma with dot
      str = str.replace(/\./g, '').replace(/,/g, '.');
    } else {
      // US format: 1,234,567.89 -> remove commas
      str = str.replace(/,/g, '');
    }
  } else if (hasComma) {
    const commaCount = (str.match(/,/g) || []).length;
    if (commaCount > 1) {
      // Multiple commas -> thousands separators: "24,878,687,727"
      str = str.replace(/,/g, '');
    } else {
      // Single comma: "960,788" vs "74,07"
      const parts = str.split(',');
      if (parts[1] && parts[1].length === 3 && parts[0].length >= 1 && parseInt(parts[0], 10) > 0) {
        // Thousand separator: "960,788" -> "960788"
        str = str.replace(/,/g, '');
      } else {
        // Decimal: "74,07" -> "74.07"
        str = str.replace(/,/g, '.');
      }
    }
  } else if (hasDot) {
    const dotCount = (str.match(/\./g) || []).length;
    if (dotCount > 1) {
      // Multiple dots -> Indonesian thousands separators: "24.878.687.727"
      str = str.replace(/\./g, '');
    } else {
      // Single dot: "960.788" vs "74.07"
      const parts = str.split('.');
      if (parts[1] && parts[1].length === 3 && parts[0].length >= 1 && parseInt(parts[0], 10) > 0) {
        // Thousand separator in Indonesian format: "960.788" -> "960788"
        str = str.replace(/\./g, '');
      }
    }
  }

  const n = parseFloat(str);
  return isNaN(n) || !Number.isFinite(n) ? 0 : n;
}

// Get jenis belanja name from 2-digit account prefix
export function getJenisBelanjaInfo(akunKode: string): { kode: string; nama: string; color: string } {
  const prefix = String(akunKode || '').trim().substring(0, 2);
  switch (prefix) {
    case '51':
      return { kode: '51', nama: 'Belanja Pegawai (51)', color: '#3B82F6' }; // Blue
    case '52':
      return { kode: '52', nama: 'Belanja Barang (52)', color: '#10B981' }; // Emerald
    case '53':
      return { kode: '53', nama: 'Belanja Modal (53)', color: '#F59E0B' }; // Amber
    case '57':
      return { kode: '57', nama: 'Belanja Bansos (57)', color: '#8B5CF6' }; // Purple
    default:
      return { kode: prefix || '58', nama: `Belanja Lainnya (${prefix})`, color: '#64748B' }; // Slate
  }
}

/**
 * Process Excel file from SINTESA / MonSAKTI Inquiry Data Realisasi Belanja
 * Standard SINTESA Column Positions:
 * - Kolom A (0): kementerian_kode
 * - Kolom B (1): kementerian_uraian (Kementerian / Lembaga)
 * - Kolom C (2): eseloni_kode
 * - Kolom D (3): eseloni_uraian
 * - Kolom E (4): kewenangan_kode
 * - Kolom F (5): kewenangan_uraian
 * - Kolom G (6): provinsi_kode
 * - Kolom H (7): provinsi_uraian
 * - Kolom I (8): kabkota_kode
 * - Kolom J (9): kabkota_uraian
 * - Kolom K (10): kanwil_kode
 * - Kolom L (11): kanwil_uraian
 * - Kolom M (12): kppn_kode
 * - Kolom N (13): kppn_uraian
 * - Kolom O (14): satker_kode
 * - Kolom P (15): satker_uraian
 * - Kolom Q (16): fungsi_kode
 * - Kolom R (17): fungsi_uraian
 * - Kolom S (18): subfungsi_kode
 * - Kolom T (19): subfungsi_uraian
 * - Kolom U (20): program_kode
 * - Kolom V (21): program_uraian
 * - Kolom W (22): kegiatan_kode
 * - Kolom X (23): kegiatan_uraian
 * - Kolom Y (24): outputkro_kode
 * - Kolom Z (25): outputkro_uraian
 * - Kolom AA (26): akun_kode
 * - Kolom AB (27): akun_uraian
 * - Kolom AC (28): sumberdana_kode
 * - Kolom AD (29): sumberdana_uraian
 * - Kolom AP (41): pagu_dipa
 * - Kolom AQ (42): realisasi
 * - Kolom AR (43): blokir
 */
export async function processRealisasiBelanjaExcel(file: File): Promise<{
  records: RealisasiBelanjaRecord[];
  summary: RealisasiBelanjaSummary;
  fileName: string;
  totalRows: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Select the sheet (prefer 'Inquiry Data' or 'Sintesa' or the first one)
        let sheetName = workbook.SheetNames.find(n => 
          n.toLowerCase().includes('inquiry') || 
          n.toLowerCase().includes('sintesa') ||
          n.toLowerCase().includes('realisasi')
        ) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (!matrix || matrix.length < 2) {
          throw new Error('File Excel tidak memiliki baris data yang cukup.');
        }

        // Find header row
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(15, matrix.length); i++) {
          const rowStr = matrix[i].map(c => String(c).toLowerCase()).join(' ');
          if (rowStr.includes('satker') || rowStr.includes('pagu') || rowStr.includes('kementerian') || rowStr.includes('realisasi')) {
            headerRowIndex = i;
            break;
          }
        }

        const headers: string[] = matrix[headerRowIndex].map(h => 
          String(h).trim().toLowerCase().replace(/[\s\.\-\/]/g, '_')
        );

        // Map column indices with robust aliases, exact match priority, and positional fallbacks
        const getColIdx = (aliases: string[], fallbackPos?: number, excludeIndices: number[] = []) => {
          // 1. Exact match check
          for (let i = 0; i < headers.length; i++) {
            if (excludeIndices.includes(i)) continue;
            const h = headers[i];
            if (aliases.some(alias => h === alias)) return i;
          }
          // 2. StartsWith / Includes check (prefer longer alias matches first)
          const sortedAliases = [...aliases].sort((a, b) => b.length - a.length);
          for (let i = 0; i < headers.length; i++) {
            if (excludeIndices.includes(i)) continue;
            const h = headers[i];
            if (sortedAliases.some(alias => h === alias || h.includes(alias))) return i;
          }
          if (fallbackPos !== undefined && fallbackPos < headers.length && !excludeIndices.includes(fallbackPos)) return fallbackPos;
          if (fallbackPos !== undefined && fallbackPos < headers.length) return fallbackPos;
          return -1;
        };

        const idxKemKode = getColIdx(['kementerian_kode', 'kemen_kode', 'kd_kemen', 'kd_kl', 'ba_kode', 'kd_ba'], 0);
        const idxKemUraian = getColIdx(['kementerian_uraian', 'kemen_uraian', 'ur_kemen', 'nm_kl', 'kementerian', 'nama_kementerian'], 1, [idxKemKode]);
        const idxEselonIKode = getColIdx(['eseloni_kode', 'eselon1_kode', 'kd_eselon1'], 2);
        const idxEselonIUraian = getColIdx(['eseloni_uraian', 'eselon1_uraian', 'ur_eselon1'], 3);
        const idxKewenanganKode = getColIdx(['kewenangan_kode', 'kd_kewenangan'], 4);
        const idxKewenanganUraian = getColIdx(['kewenangan_uraian', 'kewenangan', 'ur_kewenangan'], 5);
        const idxProvinsiKode = getColIdx(['provinsi_kode', 'kd_provinsi'], 6);
        const idxProvinsiUraian = getColIdx(['provinsi_uraian', 'ur_provinsi'], 7);
        const idxKabKotaKode = getColIdx(['kabkota_kode', 'kd_kabkota'], 8);
        const idxKabKotaUraian = getColIdx(['kabkota_uraian', 'ur_kabkota'], 9);
        const idxKanwilKode = getColIdx(['kanwil_kode', 'kd_kanwil'], 10);
        const idxKanwilUraian = getColIdx(['kanwil_uraian', 'ur_kanwil'], 11);
        const idxKppnKode = getColIdx(['kppn_kode', 'kd_kppn'], 12);
        const idxKppnUraian = getColIdx(['kppn_uraian', 'ur_kppn'], 13);
        
        // Kolom O (index 14) = Kode Satker, Kolom P (index 15) = Uraian / Nama Satker
        const idxSatkerKode = getColIdx(['satker_kode', 'kd_satker', 'kdsatker', 'kode_satker', 'kodesatker'], 14);
        const idxSatkerUraian = getColIdx(['satker_uraian', 'ur_satker', 'ursatker', 'nmsatker', 'nama_satker', 'namasatker', 'uraian_satker', 'nama_satuan_kerja', 'satker_name'], 15, [idxSatkerKode]);
        
        const idxFungsiKode = getColIdx(['fungsi_kode', 'kd_fungsi'], 16);
        const idxFungsiUraian = getColIdx(['fungsi_uraian', 'ur_fungsi'], 17);
        const idxSubfungsiKode = getColIdx(['subfungsi_kode', 'kd_subfungsi'], 18);
        const idxSubfungsiUraian = getColIdx(['subfungsi_uraian', 'ur_subfungsi'], 19);
        const idxProgramKode = getColIdx(['program_kode', 'kd_program'], 20);
        const idxProgramUraian = getColIdx(['program_uraian', 'program', 'ur_program'], 21);
        const idxKegiatanKode = getColIdx(['kegiatan_kode', 'kd_kegiatan'], 22);
        const idxKegiatanUraian = getColIdx(['kegiatan_uraian', 'kegiatan', 'ur_kegiatan'], 23);
        const idxOutputKroKode = getColIdx(['outputkro_kode', 'kro_kode', 'output_kode', 'kro'], 24);
        const idxOutputKroUraian = getColIdx(['outputkro_uraian', 'ur_outputkro', 'ur_kro', 'output_uraian', 'uraian_kro'], 25);
        const idxAkunKode = getColIdx(['akun_kode', 'kd_akun', 'kdakun', 'kode_akun', 'akun'], 26);
        const idxAkunUraian = getColIdx(['akun_uraian', 'ur_akun', 'nm_akun', 'nama_akun'], 27, [idxAkunKode]);
        
        // Kolom AC (index 28) = Kode Sumber Dana, Kolom AD (index 29) = Uraian Sumber Dana
        const idxSumberdanaKode = getColIdx(['sumberdana_kode', 'kd_sumberdana', 'kd_sd', 'kdsd', 'kode_sumberdana'], 28);
        const idxSumberdanaUraian = getColIdx(['sumberdana_uraian', 'ur_sumberdana', 'ursumberdana', 'nama_sumberdana', 'uraian_sumberdana', 'nmsumberdana'], 29, [idxSumberdanaKode]);
        
        const idxPagu = getColIdx(['pagu_dipa', 'pagu', 'alokasi', 'dipa'], 41);
        const idxRealisasi = getColIdx(['realisasi', 'penyerapan', 'sp2d'], 42);
        const idxBlokir = getColIdx(['blokir', 'pagu_blokir', 'blok'], 43);

        const records: RealisasiBelanjaRecord[] = [];

        for (let r = headerRowIndex + 1; r < matrix.length; r++) {
          const row = matrix[r];
          if (!row || row.length === 0) continue;

          // In SINTESA / MonSAKTI format: Kolom O (index 14) is Kode Satker, Kolom P (index 15) is Nama Satker
          const rawSatkerKode = cleanText(idxSatkerKode >= 0 ? row[idxSatkerKode] : (row[14] !== undefined ? row[14] : ''));
          const rawSatkerUraian = cleanText(idxSatkerUraian >= 0 ? row[idxSatkerUraian] : (row[15] !== undefined ? row[15] : ''));
          const satkerKode = rawSatkerKode || '000000';
          const satkerUraian = getOfficialSatkerName(satkerKode, rawSatkerUraian);

          const akunKode = cleanText(idxAkunKode >= 0 ? row[idxAkunKode] : (row[26] !== undefined ? row[26] : ''));
          const paguVal = parseNum(idxPagu >= 0 ? row[idxPagu] : (row[41] !== undefined ? row[41] : 0));
          const realisasiVal = parseNum(idxRealisasi >= 0 ? row[idxRealisasi] : (row[42] !== undefined ? row[42] : 0));
          const blokirVal = parseNum(idxBlokir >= 0 ? row[idxBlokir] : (row[43] !== undefined ? row[43] : 0));

          // Skip completely empty lines or totals
          if (!satkerKode && !satkerUraian && paguVal === 0 && realisasiVal === 0) continue;
          if (satkerUraian.toLowerCase().includes('total') || satkerUraian.toLowerCase().includes('jumlah')) continue;

          const rawKemKode = cleanText(idxKemKode >= 0 ? row[idxKemKode] : (row[0] !== undefined ? row[0] : ''));
          const rawKemUraian = cleanText(idxKemUraian >= 0 ? row[idxKemUraian] : (row[1] !== undefined ? row[1] : ''));
          const kemKode = rawKemKode || '';
          const kemUraian = (rawKemUraian && rawKemUraian !== rawKemKode) ? rawKemUraian : (kemKode ? `Kementerian ${kemKode}` : 'Kementerian / Lembaga');
          const eselonIKode = cleanText(idxEselonIKode >= 0 ? row[idxEselonIKode] : '');
          const eselonIUraian = cleanText(idxEselonIUraian >= 0 ? row[idxEselonIUraian] : '');
          const kewenanganKode = cleanText(idxKewenanganKode >= 0 ? row[idxKewenanganKode] : '');
          const kewenanganUraian = cleanText(idxKewenanganUraian >= 0 ? row[idxKewenanganUraian] : 'Kantor Daerah');
          const provinsiKode = cleanText(idxProvinsiKode >= 0 ? row[idxProvinsiKode] : '');
          const provinsiUraian = cleanText(idxProvinsiUraian >= 0 ? row[idxProvinsiUraian] : '');
          const kabkotaKode = cleanText(idxKabKotaKode >= 0 ? row[idxKabKotaKode] : '');
          const kabkotaUraian = cleanText(idxKabKotaUraian >= 0 ? row[idxKabKotaUraian] : '');
          const kanwilKode = cleanText(idxKanwilKode >= 0 ? row[idxKanwilKode] : '');
          const kanwilUraian = cleanText(idxKanwilUraian >= 0 ? row[idxKanwilUraian] : '');
          const kppnKode = cleanText(idxKppnKode >= 0 ? row[idxKppnKode] : '');
          const kppnUraian = cleanText(idxKppnUraian >= 0 ? row[idxKppnUraian] : '');
          const fungsiKode = cleanText(idxFungsiKode >= 0 ? row[idxFungsiKode] : '');
          const fungsiUraian = cleanText(idxFungsiUraian >= 0 ? row[idxFungsiUraian] : '');
          const subfungsiKode = cleanText(idxSubfungsiKode >= 0 ? row[idxSubfungsiKode] : '');
          const subfungsiUraian = cleanText(idxSubfungsiUraian >= 0 ? row[idxSubfungsiUraian] : '');
          const programKode = cleanText(idxProgramKode >= 0 ? row[idxProgramKode] : '');
          const programUraian = cleanText(idxProgramUraian >= 0 ? row[idxProgramUraian] : '');
          const kegiatanKode = cleanText(idxKegiatanKode >= 0 ? row[idxKegiatanKode] : '');
          const kegiatanUraian = cleanText(idxKegiatanUraian >= 0 ? row[idxKegiatanUraian] : '');
          const outputKroKode = cleanText(idxOutputKroKode >= 0 ? row[idxOutputKroKode] : '');
          const outputKroUraian = cleanText(idxOutputKroUraian >= 0 ? row[idxOutputKroUraian] : '');
          const akunUraian = cleanText(idxAkunUraian >= 0 ? row[idxAkunUraian] : 'Belanja Negara');
          
          // Resolve Kolom AC & AD (Sumber Dana)
          const rawSdKode = cleanText(idxSumberdanaKode >= 0 ? row[idxSumberdanaKode] : (row[28] !== undefined ? row[28] : ''));
          const rawSdUraian = cleanText(idxSumberdanaUraian >= 0 ? row[idxSumberdanaUraian] : (row[29] !== undefined ? row[29] : ''));
          const resolvedSd = getOfficialSumberDanaName(rawSdKode, rawSdUraian);
          const sumberdanaKode = resolvedSd.kode;
          const sumberdanaUraian = resolvedSd.uraian;

          const jenisInfo = getJenisBelanjaInfo(akunKode);
          const sisaPagu = Math.max(0, paguVal - realisasiVal);
          const persenRealisasi = paguVal > 0 ? (realisasiVal / paguVal) * 100 : 0;

          records.push({
            id: `sintesa_rb_${satkerKode}_${akunKode}_${r}`,
            kementerianKode: kemKode,
            kementerianUraian: kemUraian,
            eselonIKode,
            eselonIUraian,
            kewenanganKode,
            kewenanganUraian,
            provinsiKode,
            provinsiUraian,
            kabkotaKode,
            kabkotaUraian,
            kanwilKode,
            kanwilUraian,
            kppnKode,
            kppnUraian,
            satkerKode: satkerKode || '000000',
            satkerUraian: satkerUraian || 'Satuan Kerja',
            fungsiKode,
            fungsiUraian,
            subfungsiKode,
            subfungsiUraian,
            programKode,
            programUraian,
            kegiatanKode,
            kegiatanUraian,
            outputKroKode,
            outputKroUraian,
            akunKode: akunKode || '521111',
            akunUraian,
            jenisBelanjaKode: jenisInfo.kode,
            jenisBelanjaUraian: jenisInfo.nama,
            sumberdanaKode,
            sumberdanaUraian,
            paguDipa: paguVal,
            realisasi: realisasiVal,
            blokir: blokirVal,
            sisaPagu,
            persenRealisasi
          });
        }

        if (records.length === 0) {
          throw new Error('Tidak ditemukan data baris realisasi belanja SINTESA yang valid.');
        }

        const summary = computeRealisasiBelanjaSummary(records);
        resolve({
          records,
          summary,
          fileName: file.name,
          totalRows: records.length
        });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Gagal membaca file Excel SINTESA.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Compute aggregates and statistics from RealisasiBelanja records
 */
export function computeRealisasiBelanjaSummary(records: RealisasiBelanjaRecord[]): RealisasiBelanjaSummary {
  let totalPagu = 0;
  let totalRealisasi = 0;
  let totalBlokir = 0;

  const satkerMap: Record<string, { kodeSatker: string; namaSatker: string; pagu: number; realisasi: number }> = {};
  const kementerianMap: Record<string, { kode: string; nama: string; pagu: number; realisasi: number }> = {};
  const jenisBelanjaMap: Record<string, { kode: string; nama: string; pagu: number; realisasi: number; color: string }> = {
    '51': { kode: '51', nama: 'Belanja Pegawai (51)', pagu: 0, realisasi: 0, color: '#3B82F6' },
    '52': { kode: '52', nama: 'Belanja Barang (52)', pagu: 0, realisasi: 0, color: '#10B981' },
    '53': { kode: '53', nama: 'Belanja Modal (53)', pagu: 0, realisasi: 0, color: '#F59E0B' },
    '57': { kode: '57', nama: 'Belanja Bansos (57)', pagu: 0, realisasi: 0, color: '#8B5CF6' }
  };

  records.forEach(r => {
    totalPagu += r.paguDipa;
    totalRealisasi += r.realisasi;
    totalBlokir += r.blokir;

    // Breakdown Jenis Belanja
    const jKode = r.jenisBelanjaKode in jenisBelanjaMap ? r.jenisBelanjaKode : '52';
    if (!jenisBelanjaMap[jKode]) {
      const info = getJenisBelanjaInfo(r.akunKode);
      jenisBelanjaMap[jKode] = { kode: jKode, nama: info.nama, pagu: 0, realisasi: 0, color: info.color };
    }
    jenisBelanjaMap[jKode].pagu += r.paguDipa;
    jenisBelanjaMap[jKode].realisasi += r.realisasi;

    // Satker Map
    const sKey = r.satkerKode;
    if (!satkerMap[sKey]) {
      satkerMap[sKey] = {
        kodeSatker: r.satkerKode,
        namaSatker: getOfficialSatkerName(r.satkerKode, r.satkerUraian),
        pagu: 0,
        realisasi: 0
      };
    }
    satkerMap[sKey].pagu += r.paguDipa;
    satkerMap[sKey].realisasi += r.realisasi;

    // Kementerian Map
    const kKey = r.kementerianKode || r.kementerianUraian || '000';
    if (!kementerianMap[kKey]) {
      kementerianMap[kKey] = {
        kode: r.kementerianKode || kKey,
        nama: r.kementerianUraian || 'Kementerian/Lembaga',
        pagu: 0,
        realisasi: 0
      };
    }
    kementerianMap[kKey].pagu += r.paguDipa;
    kementerianMap[kKey].realisasi += r.realisasi;
  });

  const totalSisa = Math.max(0, totalPagu - totalRealisasi);
  const persenRealisasiTotal = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

  // Breakdown Jenis Belanja Array
  const breakdownJenisBelanja = Object.values(jenisBelanjaMap)
    .filter(j => j.pagu > 0 || j.realisasi > 0)
    .map(j => ({
      ...j,
      persen: j.pagu > 0 ? (j.realisasi / j.pagu) * 100 : 0
    }));

  // Top & Bottom Satker (sorted by % realisasi, filtering out 0-pagu)
  const allSatkersWithPercent = Object.values(satkerMap)
    .filter(s => s.pagu > 0)
    .map(s => ({
      ...s,
      persen: (s.realisasi / s.pagu) * 100
    }))
    .sort((a, b) => b.persen - a.persen);

  const topSatkers = allSatkersWithPercent.slice(0, 10);
  const bottomSatkers = [...allSatkersWithPercent].reverse().slice(0, 10);

  // Breakdown Kementerian
  const breakdownKementerian = Object.values(kementerianMap)
    .filter(k => k.pagu > 0)
    .map(k => ({
      ...k,
      persen: (k.realisasi / k.pagu) * 100
    }))
    .sort((a, b) => b.realisasi - a.realisasi);

  return {
    totalPagu,
    totalRealisasi,
    totalSisa,
    totalBlokir,
    persenRealisasiTotal,
    totalSatkerCount: Object.keys(satkerMap).length,
    totalRows: records.length,
    breakdownJenisBelanja,
    topSatkers,
    bottomSatkers,
    breakdownKementerian
  };
}

/**
 * Format currency to Indonesian Rupiah (Miliar / Triliun / Full)
 */
export function formatRupiahShort(amount: number): string {
  if (!amount || isNaN(amount) || !Number.isFinite(amount)) return 'Rp 0';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000_000) {
    return `Rp ${(amount / 1_000_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} T`;
  }
  if (abs >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M`;
  }
  if (abs >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Jt`;
  }
  if (abs >= 1_000) {
    return `Rp ${(amount / 1_000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Rb`;
  }
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

export function formatRupiahFull(amount: number): string {
  if (!amount || isNaN(amount) || !Number.isFinite(amount)) return 'Rp 0';
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

/**
 * Generate CSV dataset for Canva "Bulk Create" (Buat Banyak di Canva)
 */
export function generateCanvaBulkCreateCSV(
  summary: RealisasiBelanjaSummary | null,
  config: BuletinConfig,
  satkersIKPA: any[] = [],
  juknisList: any[] = []
): string {
  const top1 = summary?.topSatkers[0] || { namaSatker: 'Satker Berprestasi I', persen: 98.5 };
  const top2 = summary?.topSatkers[1] || { namaSatker: 'Satker Berprestasi II', persen: 96.2 };
  const top3 = summary?.topSatkers[2] || { namaSatker: 'Satker Berprestasi III', persen: 94.8 };

  const belanja51 = summary?.breakdownJenisBelanja.find(b => b.kode === '51') || { realisasi: 0, persen: 0 };
  const belanja52 = summary?.breakdownJenisBelanja.find(b => b.kode === '52') || { realisasi: 0, persen: 0 };
  const belanja53 = summary?.breakdownJenisBelanja.find(b => b.kode === '53') || { realisasi: 0, persen: 0 };
  const belanja57 = summary?.breakdownJenisBelanja.find(b => b.kode === '57') || { realisasi: 0, persen: 0 };

  // Calculate average IKPA if available
  const validIKPA = satkersIKPA.filter(s => s.nilaiTotalIKPA > 0);
  const avgIKPA = validIKPA.length > 0 
    ? (validIKPA.reduce((acc, s) => acc + s.nilaiTotalIKPA, 0) / validIKPA.length).toFixed(2)
    : '95.40';

  const tips1 = juknisList[0]?.nama || 'Penyelesaian Tagihan LS Kontraktual Tepat Waktu (Maks 17 Hari Kerja)';
  const tips2 = juknisList[1]?.nama || 'Rekonsiliasi SAKTI-SPAN Setiap Bulan Sebelum Batas Cut-Off';

  const headers = [
    'Edisi_Buletin',
    'Bulan_Tahun',
    'Judul_Utama',
    'Sub_Judul',
    'Nama_Kepala_KPPN',
    'Total_Pagu_DIPA',
    'Total_Pagu_Short',
    'Total_Realisasi',
    'Total_Realisasi_Short',
    'Persen_Realisasi_Total',
    'Sisa_Pagu_Anggaran',
    'Realisasi_Belanja_Pegawai',
    'Persen_Belanja_Pegawai',
    'Realisasi_Belanja_Barang',
    'Persen_Belanja_Barang',
    'Realisasi_Belanja_Modal',
    'Persen_Belanja_Modal',
    'Realisasi_Belanja_Bansos',
    'Persen_Belanja_Bansos',
    'Top_Satker_1_Nama',
    'Top_Satker_1_Persen',
    'Top_Satker_2_Nama',
    'Top_Satker_2_Persen',
    'Top_Satker_3_Nama',
    'Top_Satker_3_Persen',
    'Rata_Rata_Nilai_IKPA',
    'Highlight_Tips_SAKTI_1',
    'Highlight_Tips_SAKTI_2',
    'Editorial_Tajuk_Rencana'
  ];

  const escapeCSV = (str: any) => {
    const s = String(str || '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const row = [
    config.edisi,
    config.bulanTahun,
    config.judulUtama,
    config.subJudul,
    config.namaKepalaKantor,
    formatRupiahFull(summary?.totalPagu || 0),
    formatRupiahShort(summary?.totalPagu || 0),
    formatRupiahFull(summary?.totalRealisasi || 0),
    formatRupiahShort(summary?.totalRealisasi || 0),
    `${(summary?.persenRealisasiTotal || 0).toFixed(2)}%`,
    formatRupiahShort(summary?.totalSisa || 0),
    formatRupiahShort(belanja51.realisasi),
    `${belanja51.persen.toFixed(2)}%`,
    formatRupiahShort(belanja52.realisasi),
    `${belanja52.persen.toFixed(2)}%`,
    formatRupiahShort(belanja53.realisasi),
    `${belanja53.persen.toFixed(2)}%`,
    formatRupiahShort(belanja57.realisasi),
    `${belanja57.persen.toFixed(2)}%`,
    top1.namaSatker,
    `${top1.persen.toFixed(2)}%`,
    top2.namaSatker,
    `${top2.persen.toFixed(2)}%`,
    top3.namaSatker,
    `${top3.persen.toFixed(2)}%`,
    avgIKPA,
    tips1,
    tips2,
    config.tajukRencana
  ];

  return headers.map(escapeCSV).join(',') + '\n' + row.map(escapeCSV).join(',');
}

/**
 * Export filtered realisasi belanja records to Excel with complete SINTESA details
 */
export function exportRealisasiBelanjaToExcel(
  records: RealisasiBelanjaRecord[],
  fileName = 'Data_Realisasi_Belanja_SINTESA_KPPN.xlsx'
): void {
  const exportData = records.map((r, idx) => ({
    'No': idx + 1,
    'Kode K/L (B)': r.kementerianKode || '',
    'Kementerian / Lembaga (B)': r.kementerianUraian || '',
    'Kode Eselon I (C)': r.eselonIKode || '',
    'Uraian Eselon I (D)': r.eselonIUraian || '',
    'Kode Kewenangan (E)': r.kewenanganKode || '',
    'Uraian Kewenangan (F)': r.kewenanganUraian || '',
    'Kode Satker (O)': r.satkerKode || '',
    'Nama Satuan Kerja (P)': r.satkerUraian || '',
    'Kode Fungsi (Q)': r.fungsiKode || '',
    'Uraian Fungsi (R)': r.fungsiUraian || '',
    'Kode Subfungsi (S)': r.subfungsiKode || '',
    'Uraian Subfungsi (T)': r.subfungsiUraian || '',
    'Kode Program (U)': r.programKode || '',
    'Uraian Program (V)': r.programUraian || '',
    'Kode Kegiatan (W)': r.kegiatanKode || '',
    'Uraian Kegiatan (X)': r.kegiatanUraian || '',
    'Kode Output/KRO (Y)': r.outputKroKode || '',
    'Uraian Output KRO (Z)': r.outputKroUraian || '',
    'Kode Akun 6-Digit (AA)': r.akunKode || '',
    'Uraian Akun (AB)': r.akunUraian || '',
    'Jenis Belanja': r.jenisBelanjaUraian || '',
    'Kode Sumber Dana (AC)': r.sumberdanaKode || '',
    'Uraian Sumber Dana (AD)': r.sumberdanaUraian || '',
    'Pagu DIPA (AP) (Rp)': r.paguDipa,
    'Realisasi (AQ) (Rp)': r.realisasi,
    'Sisa Pagu (Rp)': r.sisaPagu,
    'Persentase Realisasi (%)': Number(r.persenRealisasi.toFixed(2)),
    'Pagu Blokir (AR) (Rp)': r.blokir
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SINTESA Realisasi Belanja');
  XLSX.writeFile(workbook, fileName);
}

/**
 * Process Excel / CSV file from MY INTRESS (Realisasi Belanja Satker Per Jenis Belanja)
 */
export async function processMyIntressExcel(file: File): Promise<{
  records: MyIntressRecord[];
  summary: MyIntressSummary;
  fileName: string;
  waktuUnduh: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        let waktuUnduh = '';
        const records: MyIntressRecord[] = [];
        let currentSatker: Partial<MyIntressRecord> | null = null;
        let satkerIndex = 0;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          // Check download timestamp
          const rowStr = row.join(' ');
          if (rowStr.toLowerCase().includes('waktu unduh')) {
            const match = rowStr.match(/Waktu unduh[^:]*:\s*([^,\n\r]+)/i);
            if (match) waktuUnduh = match[1].trim();
          }

          const col0 = cleanText(row[0]);
          const col1 = cleanText(row[1]);

          // Ignore Grand Total line from satker list
          if (col0.toUpperCase().includes('GRAND TOTAL') || col1.toUpperCase().includes('GRAND TOTAL')) {
            currentSatker = null;
            continue;
          }

          // Check if this row starts a new satker
          if (/^\d+$/.test(col0) && col1.includes('|')) {
            satkerIndex++;
            const parts = col1.split('|');
            const kodeSatker = parts[0]?.trim() || '';
            const namaSatker = parts[1]?.trim() || '';

            currentSatker = {
              id: `myintress_satker_${satkerIndex}_${kodeSatker}`,
              no: parseInt(col0, 10),
              kodeSatker,
              namaSatker,
              paguPegawai: 0,
              paguBarang: 0,
              paguModal: 0,
              paguBebanBunga: 0,
              paguSubsidi: 0,
              paguHibah: 0,
              paguBansos: 0,
              paguLain: 0,
              paguTransfer: 0,
              paguTotal: 0,
              realPegawai: 0,
              realBarang: 0,
              realModal: 0,
              realBebanBunga: 0,
              realSubsidi: 0,
              realHibah: 0,
              realBansos: 0,
              realLain: 0,
              realTransfer: 0,
              realTotal: 0,
              persenPegawai: 0,
              persenBarang: 0,
              persenModal: 0,
              persenBansos: 0,
              persenTransfer: 0,
              persenTotal: 0,
              sisaPegawai: 0,
              sisaBarang: 0,
              sisaModal: 0,
              sisaBansos: 0,
              sisaTransfer: 0,
              sisaTotal: 0,
              waktuUnduh
            };
            records.push(currentSatker as MyIntressRecord);
          }

          if (currentSatker) {
            const ket = cleanText(row[2]).toUpperCase();
            if (ket === 'PAGU') {
              currentSatker.paguPegawai = parseNum(row[3]);
              currentSatker.paguBarang = parseNum(row[4]);
              currentSatker.paguModal = parseNum(row[5]);
              currentSatker.paguBebanBunga = parseNum(row[6]);
              currentSatker.paguSubsidi = parseNum(row[7]);
              currentSatker.paguHibah = parseNum(row[8]);
              currentSatker.paguBansos = parseNum(row[9]);
              currentSatker.paguLain = parseNum(row[10]);
              currentSatker.paguTransfer = parseNum(row[11]);
              currentSatker.paguTotal = parseNum(row[12]);
            } else if (ket === 'REALISASI') {
              currentSatker.realPegawai = parseNum(row[3]);
              currentSatker.realBarang = parseNum(row[4]);
              currentSatker.realModal = parseNum(row[5]);
              currentSatker.realBebanBunga = parseNum(row[6]);
              currentSatker.realSubsidi = parseNum(row[7]);
              currentSatker.realHibah = parseNum(row[8]);
              currentSatker.realBansos = parseNum(row[9]);
              currentSatker.realLain = parseNum(row[10]);
              currentSatker.realTransfer = parseNum(row[11]);
              currentSatker.realTotal = parseNum(row[12]);
            } else if (ket === 'SISA') {
              currentSatker.sisaPegawai = parseNum(row[3]);
              currentSatker.sisaBarang = parseNum(row[4]);
              currentSatker.sisaModal = parseNum(row[5]);
              currentSatker.sisaBansos = parseNum(row[9]);
              currentSatker.sisaTransfer = parseNum(row[11]);
              currentSatker.sisaTotal = parseNum(row[12]);
            } else if (ket === '' || ket === '%' || String(row[12] || '').includes('%')) {
              currentSatker.persenPegawai = parseNum(row[3]);
              currentSatker.persenBarang = parseNum(row[4]);
              currentSatker.persenModal = parseNum(row[5]);
              currentSatker.persenBansos = parseNum(row[9]);
              currentSatker.persenTransfer = parseNum(row[11]);
              currentSatker.persenTotal = parseNum(row[12]);
            }
          }
        }

        // Determine unit multiplier and scale amounts to actual full Rupiah
        // Check file header text for explicit units
        const fileContentStr = rows.slice(0, 15).map(r => r.join(' ')).join(' ').toLowerCase();
        let multiplier = 1;

        if (fileContentStr.includes('dalam triliun') || fileContentStr.includes('triliun rupiah')) {
          multiplier = 1_000_000_000_000;
        } else if (fileContentStr.includes('dalam miliar') || fileContentStr.includes('miliar rupiah')) {
          multiplier = 1_000_000_000;
        } else if (fileContentStr.includes('dalam juta') || fileContentStr.includes('juta rupiah')) {
          multiplier = 1_000_000;
        } else if (fileContentStr.includes('dalam ribuan') || fileContentStr.includes('ribuan rupiah') || fileContentStr.includes('ribuan')) {
          multiplier = 1_000;
        } else if (fileContentStr.includes('dalam rupiah') || fileContentStr.includes('rupiah penuh')) {
          multiplier = 1;
        } else {
          // Auto-detection based on total raw pagu across all satkers:
          // In KPPN Semarang I datasets, total pagu is approximately 20-30 Triliun Rupiah.
          const rawTotalPagu = records.reduce((sum, r) => sum + (r.paguTotal || 0), 0);
          if (rawTotalPagu > 0) {
            if (rawTotalPagu < 1_000) {
              // e.g. 24.87 (unit is in Triliun)
              multiplier = 1_000_000_000_000;
            } else if (rawTotalPagu < 1_000_000) {
              // e.g. 24,878.68 or 11,069.61 (unit is in Miliar)
              multiplier = 1_000_000_000;
            } else if (rawTotalPagu < 1_000_000_000) {
              // e.g. 24,878,687.72 (unit is in Juta)
              multiplier = 1_000_000;
            } else if (rawTotalPagu < 1_000_000_000_000) {
              // e.g. 24,878,687,727 (unit is in Ribuan Rupiah)
              multiplier = 1_000;
            } else {
              // >= 1 Triliun: already in full Rupiah
              multiplier = 1;
            }
          }
        }

        if (multiplier !== 1) {
          for (const r of records) {
            r.paguPegawai = (r.paguPegawai || 0) * multiplier;
            r.paguBarang = (r.paguBarang || 0) * multiplier;
            r.paguModal = (r.paguModal || 0) * multiplier;
            r.paguBebanBunga = (r.paguBebanBunga || 0) * multiplier;
            r.paguSubsidi = (r.paguSubsidi || 0) * multiplier;
            r.paguHibah = (r.paguHibah || 0) * multiplier;
            r.paguBansos = (r.paguBansos || 0) * multiplier;
            r.paguLain = (r.paguLain || 0) * multiplier;
            r.paguTransfer = (r.paguTransfer || 0) * multiplier;
            r.paguTotal = (r.paguTotal || 0) * multiplier;

            r.realPegawai = (r.realPegawai || 0) * multiplier;
            r.realBarang = (r.realBarang || 0) * multiplier;
            r.realModal = (r.realModal || 0) * multiplier;
            r.realBebanBunga = (r.realBebanBunga || 0) * multiplier;
            r.realSubsidi = (r.realSubsidi || 0) * multiplier;
            r.realHibah = (r.realHibah || 0) * multiplier;
            r.realBansos = (r.realBansos || 0) * multiplier;
            r.realLain = (r.realLain || 0) * multiplier;
            r.realTransfer = (r.realTransfer || 0) * multiplier;
            r.realTotal = (r.realTotal || 0) * multiplier;

            r.sisaPegawai = (r.sisaPegawai || 0) * multiplier;
            r.sisaBarang = (r.sisaBarang || 0) * multiplier;
            r.sisaModal = (r.sisaModal || 0) * multiplier;
            r.sisaBansos = (r.sisaBansos || 0) * multiplier;
            r.sisaTransfer = (r.sisaTransfer || 0) * multiplier;
            r.sisaTotal = (r.sisaTotal || 0) * multiplier;
          }
        }

        // Compute percentages and calculate sisa
        for (const r of records) {
          if (r.paguPegawai > 0 && (!r.persenPegawai || isNaN(r.persenPegawai))) r.persenPegawai = Number(((r.realPegawai / r.paguPegawai) * 100).toFixed(2));
          if (r.paguBarang > 0 && (!r.persenBarang || isNaN(r.persenBarang))) r.persenBarang = Number(((r.realBarang / r.paguBarang) * 100).toFixed(2));
          if (r.paguModal > 0 && (!r.persenModal || isNaN(r.persenModal))) r.persenModal = Number(((r.realModal / r.paguModal) * 100).toFixed(2));
          if (r.paguBansos > 0 && (!r.persenBansos || isNaN(r.persenBansos))) r.persenBansos = Number(((r.realBansos / r.paguBansos) * 100).toFixed(2));
          if (r.paguTransfer > 0 && (!r.persenTransfer || isNaN(r.persenTransfer))) r.persenTransfer = Number(((r.realTransfer / r.paguTransfer) * 100).toFixed(2));
          if (r.paguTotal > 0 && (!r.persenTotal || isNaN(r.persenTotal))) r.persenTotal = Number(((r.realTotal / r.paguTotal) * 100).toFixed(2));
          
          r.persenPegawai = Number.isFinite(r.persenPegawai) ? r.persenPegawai : 0;
          r.persenBarang = Number.isFinite(r.persenBarang) ? r.persenBarang : 0;
          r.persenModal = Number.isFinite(r.persenModal) ? r.persenModal : 0;
          r.persenBansos = Number.isFinite(r.persenBansos) ? r.persenBansos : 0;
          r.persenTransfer = Number.isFinite(r.persenTransfer) ? r.persenTransfer : 0;
          r.persenTotal = Number.isFinite(r.persenTotal) ? r.persenTotal : 0;

          if (!r.sisaTotal || r.sisaTotal === 0) r.sisaTotal = Math.max(0, (r.paguTotal || 0) - (r.realTotal || 0));
        }

        const summary = computeMyIntressSummary(records);
        resolve({
          records,
          summary,
          fileName: file.name,
          waktuUnduh: waktuUnduh || new Date().toLocaleString('id-ID')
        });
      } catch (err: any) {
        reject(new Error(`Gagal memproses file My InTress: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Gagal membaca file My InTress'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Compute summary aggregation for My InTress records
 */
export function computeMyIntressSummary(records: MyIntressRecord[] = []): MyIntressSummary {
  const safeRecords = Array.isArray(records) ? records : [];
  const totalPagu = safeRecords.reduce((sum, r) => sum + (r.paguTotal || 0), 0);
  const totalRealisasi = safeRecords.reduce((sum, r) => sum + (r.realTotal || 0), 0);
  const totalSisa = safeRecords.reduce((sum, r) => sum + (r.sisaTotal || 0), 0);
  const persenRealisasiTotal = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

  const pagu51 = safeRecords.reduce((sum, r) => sum + (r.paguPegawai || 0), 0);
  const real51 = safeRecords.reduce((sum, r) => sum + (r.realPegawai || 0), 0);

  const pagu52 = safeRecords.reduce((sum, r) => sum + (r.paguBarang || 0), 0);
  const real52 = safeRecords.reduce((sum, r) => sum + (r.realBarang || 0), 0);

  const pagu53 = safeRecords.reduce((sum, r) => sum + (r.paguModal || 0), 0);
  const real53 = safeRecords.reduce((sum, r) => sum + (r.realModal || 0), 0);

  const pagu57 = safeRecords.reduce((sum, r) => sum + (r.paguBansos || 0), 0);
  const real57 = safeRecords.reduce((sum, r) => sum + (r.realBansos || 0), 0);

  const paguTransfer = safeRecords.reduce((sum, r) => sum + (r.paguTransfer || 0), 0);
  const realTransfer = safeRecords.reduce((sum, r) => sum + (r.realTransfer || 0), 0);

  const breakdownJenisBelanja = [
    {
      kode: '51',
      nama: 'Belanja Pegawai (51)',
      pagu: pagu51,
      realisasi: real51,
      persen: pagu51 > 0 ? (real51 / pagu51) * 100 : 0,
      sisa: Math.max(0, pagu51 - real51),
      color: '#3B82F6'
    },
    {
      kode: '52',
      nama: 'Belanja Barang (52)',
      pagu: pagu52,
      realisasi: real52,
      persen: pagu52 > 0 ? (real52 / pagu52) * 100 : 0,
      sisa: Math.max(0, pagu52 - real52),
      color: '#10B981'
    },
    {
      kode: '53',
      nama: 'Belanja Modal (53)',
      pagu: pagu53,
      realisasi: real53,
      persen: pagu53 > 0 ? (real53 / pagu53) * 100 : 0,
      sisa: Math.max(0, pagu53 - real53),
      color: '#F59E0B'
    },
    {
      kode: '57',
      nama: 'Belanja Bansos (57)',
      pagu: pagu57,
      realisasi: real57,
      persen: pagu57 > 0 ? (real57 / pagu57) * 100 : 0,
      sisa: Math.max(0, pagu57 - real57),
      color: '#8B5CF6'
    },
    {
      kode: '61',
      nama: 'Transfer Ke Daerah (TKD)',
      pagu: paguTransfer,
      realisasi: realTransfer,
      persen: paguTransfer > 0 ? (realTransfer / paguTransfer) * 100 : 0,
      sisa: Math.max(0, paguTransfer - realTransfer),
      color: '#06B6D4'
    }
  ];

  const sorted = [...safeRecords].sort((a, b) => b.persenTotal - a.persenTotal);
  const topSatkers = sorted.slice(0, 10);
  const bottomSatkers = [...safeRecords].filter(r => r.paguTotal > 0).sort((a, b) => a.persenTotal - b.persenTotal).slice(0, 10);

  return {
    totalPagu,
    totalRealisasi,
    totalSisa,
    persenRealisasiTotal,
    totalSatkerCount: safeRecords.length,
    breakdownJenisBelanja,
    topSatkers,
    bottomSatkers
  };
}

/**
 * Reconcile SINTESA records with MY INTRESS records to pinpoint differences per Satker and per Jenis Belanja
 */
export function reconcileSintesaAndMyIntress(
  sintesaRecords: RealisasiBelanjaRecord[] = [],
  intressRecords: MyIntressRecord[] = []
): SatkerReconciliationDiff[] {
  const safeSintesa = Array.isArray(sintesaRecords) ? sintesaRecords : [];
  const safeIntress = Array.isArray(intressRecords) ? intressRecords : [];

  // Aggregate SINTESA data by Satker and by Jenis Belanja
  const sintesaMap = new Map<string, {
    namaSatker: string;
    paguTotal: number;
    realTotal: number;
    pagu51: number; real51: number;
    pagu52: number; real52: number;
    pagu53: number; real53: number;
    pagu57: number; real57: number;
    pagu61: number; real61: number;
    paguLain: number; realLain: number;
  }>();

  for (const r of safeSintesa) {
    if (!r) continue;
    const k = r.satkerKode || 'UNKNOWN';
    if (!sintesaMap.has(k)) {
      const properName = getOfficialSatkerName(k, r.satkerUraian);
      sintesaMap.set(k, {
        namaSatker: properName,
        paguTotal: 0,
        realTotal: 0,
        pagu51: 0, real51: 0,
        pagu52: 0, real52: 0,
        pagu53: 0, real53: 0,
        pagu57: 0, real57: 0,
        pagu61: 0, real61: 0,
        paguLain: 0, realLain: 0,
      });
    }

    const entry = sintesaMap.get(k)!;
    const pagu = r.paguDipa || 0;
    const real = r.realisasi || 0;
    const jb = String(r.jenisBelanjaKode || '');

    entry.paguTotal += pagu;
    entry.realTotal += real;

    if (jb === '51' || String(r.akunKode).startsWith('51')) {
      entry.pagu51 += pagu; entry.real51 += real;
    } else if (jb === '52' || String(r.akunKode).startsWith('52')) {
      entry.pagu52 += pagu; entry.real52 += real;
    } else if (jb === '53' || String(r.akunKode).startsWith('53')) {
      entry.pagu53 += pagu; entry.real53 += real;
    } else if (jb === '57' || String(r.akunKode).startsWith('57')) {
      entry.pagu57 += pagu; entry.real57 += real;
    } else if (jb.startsWith('6') || String(r.akunKode).startsWith('6')) {
      entry.pagu61 += pagu; entry.real61 += real;
    } else {
      entry.paguLain += pagu; entry.realLain += real;
    }
  }

  // Create Map for MY INTRESS
  const intressMap = new Map<string, MyIntressRecord>();
  for (const r of safeIntress) {
    if (r && r.kodeSatker) {
      intressMap.set(r.kodeSatker, r);
    }
  }

  // Collect all unique satker codes
  const allCodes = Array.from(new Set([...sintesaMap.keys(), ...intressMap.keys()]));

  const diffList: SatkerReconciliationDiff[] = [];

  for (const code of allCodes) {
    const s = sintesaMap.get(code);
    const m = intressMap.get(code);

    const rawCandidateName = (s?.namaSatker && s.namaSatker !== code && !/^\d+$/.test(s.namaSatker) ? s.namaSatker : '') ||
      (m?.namaSatker && m.namaSatker !== code && !/^\d+$/.test(m.namaSatker) ? m.namaSatker : '');
    const namaSatker = getOfficialSatkerName(code, rawCandidateName);

    const sintesaPaguTotal = s?.paguTotal || 0;
    const sintesaRealTotal = s?.realTotal || 0;
    const rawSintesaPersen = sintesaPaguTotal > 0 ? (sintesaRealTotal / sintesaPaguTotal) * 100 : 0;
    const sintesaPersenTotal = Number.isFinite(rawSintesaPersen) ? rawSintesaPersen : 0;

    const intressPaguTotal = m?.paguTotal || 0;
    const intressRealTotal = m?.realTotal || 0;
    const rawIntressPersen = Number.isFinite(m?.persenTotal) && (m?.persenTotal ?? 0) > 0
      ? (m?.persenTotal || 0)
      : (intressPaguTotal > 0 ? (intressRealTotal / intressPaguTotal) * 100 : 0);
    const intressPersenTotal = Number.isFinite(rawIntressPersen) ? rawIntressPersen : 0;

    const diffPaguTotal = sintesaPaguTotal - intressPaguTotal;
    const diffRealTotal = sintesaRealTotal - intressRealTotal;

    let statusDiff: SatkerReconciliationDiff['statusDiff'] = 'MATCH';
    if (!s && m) {
      statusDiff = 'ONLY_INTRESS';
    } else if (s && !m) {
      statusDiff = 'ONLY_SINTESA';
    } else {
      const hasDiffPagu = Math.abs(diffPaguTotal) > 100;
      const hasDiffReal = Math.abs(diffRealTotal) > 100;
      if (hasDiffPagu && hasDiffReal) statusDiff = 'DIFF_BOTH';
      else if (hasDiffPagu) statusDiff = 'DIFF_PAGU';
      else if (hasDiffReal) statusDiff = 'DIFF_REALISASI';
      else statusDiff = 'MATCH';
    }

    // Breakdown per jenis belanja
    const b51_s_pagu = s?.pagu51 || 0;
    const b51_m_pagu = m?.paguPegawai || 0;
    const b51_s_real = s?.real51 || 0;
    const b51_m_real = m?.realPegawai || 0;

    const b52_s_pagu = s?.pagu52 || 0;
    const b52_m_pagu = m?.paguBarang || 0;
    const b52_s_real = s?.real52 || 0;
    const b52_m_real = m?.realBarang || 0;

    const b53_s_pagu = s?.pagu53 || 0;
    const b53_m_pagu = m?.paguModal || 0;
    const b53_s_real = s?.real53 || 0;
    const b53_m_real = m?.realModal || 0;

    const b57_s_pagu = s?.pagu57 || 0;
    const b57_m_pagu = m?.paguBansos || 0;
    const b57_s_real = s?.real57 || 0;
    const b57_m_real = m?.realBansos || 0;

    const b61_s_pagu = s?.pagu61 || 0;
    const b61_m_pagu = m?.paguTransfer || 0;
    const b61_s_real = s?.real61 || 0;
    const b61_m_real = m?.realTransfer || 0;

    const checkStatus = (dP: number, dR: number) => {
      const p = Math.abs(dP) > 100;
      const r = Math.abs(dR) > 100;
      if (p && r) return 'DIFF_BOTH';
      if (p) return 'DIFF_PAGU';
      if (r) return 'DIFF_REAL';
      return 'MATCH';
    };

    const breakdown: SatkerReconciliationDiff['breakdown'] = [
      {
        jenisKode: '51',
        jenisNama: 'Belanja Pegawai (51)',
        sintesaPagu: b51_s_pagu,
        intressPagu: b51_m_pagu,
        diffPagu: b51_s_pagu - b51_m_pagu,
        sintesaReal: b51_s_real,
        intressReal: b51_m_real,
        diffReal: b51_s_real - b51_m_real,
        status: checkStatus(b51_s_pagu - b51_m_pagu, b51_s_real - b51_m_real)
      },
      {
        jenisKode: '52',
        jenisNama: 'Belanja Barang (52)',
        sintesaPagu: b52_s_pagu,
        intressPagu: b52_m_pagu,
        diffPagu: b52_s_pagu - b52_m_pagu,
        sintesaReal: b52_s_real,
        intressReal: b52_m_real,
        diffReal: b52_s_real - b52_m_real,
        status: checkStatus(b52_s_pagu - b52_m_pagu, b52_s_real - b52_m_real)
      },
      {
        jenisKode: '53',
        jenisNama: 'Belanja Modal (53)',
        sintesaPagu: b53_s_pagu,
        intressPagu: b53_m_pagu,
        diffPagu: b53_s_pagu - b53_m_pagu,
        sintesaReal: b53_s_real,
        intressReal: b53_m_real,
        diffReal: b53_s_real - b53_m_real,
        status: checkStatus(b53_s_pagu - b53_m_pagu, b53_s_real - b53_m_real)
      },
      {
        jenisKode: '57',
        jenisNama: 'Belanja Bansos (57)',
        sintesaPagu: b57_s_pagu,
        intressPagu: b57_m_pagu,
        diffPagu: b57_s_pagu - b57_m_pagu,
        sintesaReal: b57_s_real,
        intressReal: b57_m_real,
        diffReal: b57_s_real - b57_m_real,
        status: checkStatus(b57_s_pagu - b57_m_pagu, b57_s_real - b57_m_real)
      },
      {
        jenisKode: '61',
        jenisNama: 'Transfer Ke Daerah (TKD)',
        sintesaPagu: b61_s_pagu,
        intressPagu: b61_m_pagu,
        diffPagu: b61_s_pagu - b61_m_pagu,
        sintesaReal: b61_s_real,
        intressReal: b61_m_real,
        diffReal: b61_s_real - b61_m_real,
        status: checkStatus(b61_s_pagu - b61_m_pagu, b61_s_real - b61_m_real)
      }
    ];

    // Generate intelligent analytical explanation & recommended action
    const diffBelanjas: string[] = [];
    breakdown.forEach(b => {
      if (b.status !== 'MATCH') {
        const parts = [];
        if (Math.abs(b.diffPagu) > 100) parts.push(`Pagu ${b.diffPagu > 0 ? '+' : ''}${formatRupiahShort(b.diffPagu)}`);
        if (Math.abs(b.diffReal) > 100) parts.push(`Real ${b.diffReal > 0 ? '+' : ''}${formatRupiahShort(b.diffReal)}`);
        diffBelanjas.push(`${b.jenisNama} (${parts.join(', ')})`);
      }
    });

    let catatanAnalisis = '';
    let saranTindakan = '';

    if (statusDiff === 'MATCH') {
      catatanAnalisis = 'Data SINTESA dan MY INTRESS 100% konsisten dan mutakhir.';
      saranTindakan = 'Tidak diperlukan tindakan konfirmasi.';
    } else if (statusDiff === 'DIFF_REALISASI') {
      const direction = diffRealTotal < 0 ? 'lebih tinggi di My InTress' : 'lebih tinggi di SINTESA';
      catatanAnalisis = `Terdapat selisih realisasi ${formatRupiahShort(Math.abs(diffRealTotal))} (${direction}). Teridentifikasi pada: ${diffBelanjas.join('; ')}. Umumnya disebabkan oleh perbedaan cut-off penerbitan SP2D harian atau transaksi SPM yang baru terbit di SPAN/OM-SPAN.`;
      saranTindakan = 'Konfirmasi nomor SP2D terakhir yang diterbitkan dan lakukan rekonsiliasi data transaksi harian SAKTI satker.';
    } else if (statusDiff === 'DIFF_PAGU') {
      catatanAnalisis = `Terdapat selisih Pagu DIPA sebesar ${formatRupiahShort(Math.abs(diffPaguTotal))}. Teridentifikasi pada: ${diffBelanjas.join('; ')}. Kemungkinan terdapat revisi DIPA/POK yang baru disahkan di SAKTI namun belum tersinkron penuh di modul Inquiry SINTESA.`;
      saranTindakan = 'Verifikasi tanggal pengesahan revisi DIPA terakhir dan nomor register DIPA satker.';
    } else if (statusDiff === 'DIFF_BOTH') {
      catatanAnalisis = `Terdapat selisih ganda pada Pagu (${formatRupiahShort(Math.abs(diffPaguTotal))}) dan Realisasi (${formatRupiahShort(Math.abs(diffRealTotal))}). Teridentifikasi pada: ${diffBelanjas.join('; ')}.`;
      saranTindakan = 'Lakukan koordinasi langsung dengan Bendahara Pengeluaran / PPK satker terkait update revisi DIPA dan SPM-LS/UP/TUP.';
    } else {
      catatanAnalisis = `Satker hanya tercatat pada salah satu sistem (${statusDiff === 'ONLY_SINTESA' ? 'Hanya di SINTESA' : 'Hanya di MY INTRESS'}).`;
      saranTindakan = 'Periksa mapping kode satker aktif di database KPPN.';
    }

    // Generate formatted WhatsApp message template ready to copy/send
    const templateKonfirmasiWa = `Yth. Pengelola Keuangan / PPK / Bendahara ${namaSatker} (${code}),\n\n` +
      `Sehubungan dengan hasil pemantauan & rekonsiliasi berkala data realisasi anggaran antara sistem SINTESA dan MY INTRESS di KPPN Semarang I, teridentifikasi catatan sebagai berikut:\n` +
      `• Pagu SINTESA: ${formatRupiahFull(sintesaPaguTotal)} vs My InTress: ${formatRupiahFull(intressPaguTotal)} (Selisih: ${formatRupiahShort(diffPaguTotal)})\n` +
      `• Realisasi SINTESA: ${formatRupiahFull(sintesaRealTotal)} (${sintesaPersenTotal.toFixed(2)}%) vs My InTress: ${formatRupiahFull(intressRealTotal)} (${intressPersenTotal.toFixed(2)}%) (Selisih: ${formatRupiahShort(diffRealTotal)})\n` +
      `• Rincian Akun Belanja yang berselisih:\n${diffBelanjas.map(d => `  - ${d}`).join('\n') || '  - Nihil'}\n\n` +
      `Mohon bantuannya untuk mengonfirmasi status revisi DIPA terakhir serta nomor SP2D/SPM terakhir yang telah terbit di SAKTI. Terima kasih.\n\n` +
      `— Tim Pembina Satker KPPN Semarang I`;

    diffList.push({
      kodeSatker: code,
      namaSatker,
      sintesaPaguTotal,
      sintesaRealTotal,
      sintesaPersenTotal,
      intressPaguTotal,
      intressRealTotal,
      intressPersenTotal,
      diffPaguTotal,
      diffRealTotal,
      statusDiff,
      breakdown,
      catatanAnalisis,
      saranTindakan,
      templateKonfirmasiWa
    });
  }

  // Sort: show discrepancies with largest absolute realisasi difference first
  return diffList.sort((a, b) => {
    if (a.statusDiff === 'MATCH' && b.statusDiff !== 'MATCH') return 1;
    if (a.statusDiff !== 'MATCH' && b.statusDiff === 'MATCH') return -1;
    return Math.abs(b.diffRealTotal) - Math.abs(a.diffRealTotal);
  });
}

/**
 * Export reconciliation diffs to Excel for reporting and satker inquiries
 */
export function exportReconciliationToExcel(
  diffs: SatkerReconciliationDiff[],
  fileName = 'Rekonsiliasi_SINTESA_vs_MYINTRESS_KPPN.xlsx'
): void {
  const exportData = diffs.map((d, idx) => {
    const b51 = d.breakdown.find(b => b.jenisKode === '51');
    const b52 = d.breakdown.find(b => b.jenisKode === '52');
    const b53 = d.breakdown.find(b => b.jenisKode === '53');
    const b57 = d.breakdown.find(b => b.jenisKode === '57');
    const b61 = d.breakdown.find(b => b.jenisKode === '61');

    return {
      'No': idx + 1,
      'Kode Satker': d.kodeSatker,
      'Nama Satuan Kerja': d.namaSatker,
      'Status Rekon': d.statusDiff === 'MATCH' ? 'Cocok (Match)' : d.statusDiff === 'DIFF_REALISASI' ? 'Selisih Realisasi' : d.statusDiff === 'DIFF_PAGU' ? 'Selisih Pagu' : 'Selisih Pagu & Realisasi',
      'Pagu SINTESA (Rp)': d.sintesaPaguTotal,
      'Pagu MY INTRESS (Rp)': d.intressPaguTotal,
      'Selisih Pagu (Rp)': d.diffPaguTotal,
      'Real SINTESA (Rp)': d.sintesaRealTotal,
      'Real MY INTRESS (Rp)': d.intressRealTotal,
      'Selisih Realisasi (Rp)': d.diffRealTotal,
      '% Real SINTESA': Number(d.sintesaPersenTotal.toFixed(2)),
      '% Real MY INTRESS': Number(d.intressPersenTotal.toFixed(2)),
      'Selisih Real Pegawai 51 (Rp)': b51?.diffReal || 0,
      'Selisih Real Barang 52 (Rp)': b52?.diffReal || 0,
      'Selisih Real Modal 53 (Rp)': b53?.diffReal || 0,
      'Selisih Real Bansos 57 (Rp)': b57?.diffReal || 0,
      'Selisih Real Transfer 61 (Rp)': b61?.diffReal || 0,
      'Catatan Analisis Perbedaan': d.catatanAnalisis,
      'Saran Tindakan Konfirmasi': d.saranTindakan
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekon SINTESA vs INTRESS');
  XLSX.writeFile(workbook, fileName);
}

