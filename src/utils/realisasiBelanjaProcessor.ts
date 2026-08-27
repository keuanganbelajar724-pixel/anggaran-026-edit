import * as XLSX from 'xlsx';
import { RealisasiBelanjaRecord, RealisasiBelanjaSummary, BuletinConfig } from '../types';

// Helper to clean text
function cleanText(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/\s+/g, ' ');
}

// Helper to parse currency or formatted number
function parseNum(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  let str = String(val).trim().replace(/Rp|\$|%|\s/gi, '');
  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
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
 * Process Excel file from OM-SPAN / SAKTI Inquiry Data Realisasi Belanja
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

        // Select the sheet (prefer 'Inquiry Data' or the first one)
        let sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('inquiry')) || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (!matrix || matrix.length < 2) {
          throw new Error('File Excel tidak memiliki baris data yang cukup.');
        }

        // Find header row (search for row containing 'kementerian_kode' or 'satker_kode' or 'pagu_dipa' or 'realisasi')
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(15, matrix.length); i++) {
          const rowStr = matrix[i].map(c => String(c).toLowerCase()).join(' ');
          if (rowStr.includes('satker') || rowStr.includes('pagu') || rowStr.includes('kementerian')) {
            headerRowIndex = i;
            break;
          }
        }

        const headers: string[] = matrix[headerRowIndex].map(h => 
          String(h).trim().toLowerCase().replace(/[\s\.\-\/]/g, '_')
        );

        // Map column indices
        const getColIdx = (aliases: string[]) => {
          return headers.findIndex(h => aliases.some(alias => h.includes(alias)));
        };

        const idxKemKode = getColIdx(['kementerian_kode', 'kemen_kode', 'kd_kemen', 'kd_kl', 'ba_kode']);
        const idxKemUraian = getColIdx(['kementerian_uraian', 'kemen_uraian', 'ur_kemen', 'nm_kl', 'kementerian']);
        const idxSatkerKode = getColIdx(['satker_kode', 'kd_satker', 'kdsatker', 'kode_satker']);
        const idxSatkerUraian = getColIdx(['satker_uraian', 'ur_satker', 'nmsatker', 'nama_satker', 'satker']);
        const idxAkunKode = getColIdx(['akun_kode', 'kd_akun', 'kdakun', 'kode_akun', 'akun']);
        const idxAkunUraian = getColIdx(['akun_uraian', 'ur_akun', 'nm_akun', 'nama_akun']);
        const idxPagu = getColIdx(['pagu_dipa', 'pagu', 'alokasi', 'dipa']);
        const idxRealisasi = getColIdx(['realisasi', 'penyerapan', 'sp2d']);
        const idxBlokir = getColIdx(['blokir', 'pagu_blokir', 'blok']);
        const idxKewenangan = getColIdx(['kewenangan_uraian', 'kewenangan', 'ur_kewenangan']);
        const idxSumberdana = getColIdx(['sumberdana_uraian', 'sumber_dana', 'sumberdana', 'ur_sumberdana']);
        const idxProgram = getColIdx(['program_uraian', 'program', 'ur_program']);
        const idxKegiatan = getColIdx(['kegiatan_uraian', 'kegiatan', 'ur_kegiatan']);

        const records: RealisasiBelanjaRecord[] = [];

        for (let r = headerRowIndex + 1; r < matrix.length; r++) {
          const row = matrix[r];
          if (!row || row.length === 0) continue;

          const satkerKode = cleanText(idxSatkerKode >= 0 ? row[idxSatkerKode] : '');
          const satkerUraian = cleanText(idxSatkerUraian >= 0 ? row[idxSatkerUraian] : '');
          const akunKode = cleanText(idxAkunKode >= 0 ? row[idxAkunKode] : '');
          const paguVal = parseNum(idxPagu >= 0 ? row[idxPagu] : 0);
          const realisasiVal = parseNum(idxRealisasi >= 0 ? row[idxRealisasi] : 0);
          const blokirVal = parseNum(idxBlokir >= 0 ? row[idxBlokir] : 0);

          // Skip completely empty lines or totals
          if (!satkerKode && !satkerUraian && paguVal === 0 && realisasiVal === 0) continue;
          if (satkerUraian.toLowerCase().includes('total') || satkerUraian.toLowerCase().includes('jumlah')) continue;

          const kemKode = cleanText(idxKemKode >= 0 ? row[idxKemKode] : '');
          const kemUraian = cleanText(idxKemUraian >= 0 ? row[idxKemUraian] : 'Kementerian / Lembaga');
          const akunUraian = cleanText(idxAkunUraian >= 0 ? row[idxAkunUraian] : 'Belanja Negara');
          const kewenangan = cleanText(idxKewenangan >= 0 ? row[idxKewenangan] : 'Kantor Daerah');
          const sumberdana = cleanText(idxSumberdana >= 0 ? row[idxSumberdana] : 'RM');
          const program = cleanText(idxProgram >= 0 ? row[idxProgram] : '');
          const kegiatan = cleanText(idxKegiatan >= 0 ? row[idxKegiatan] : '');

          const jenisInfo = getJenisBelanjaInfo(akunKode);
          const sisaPagu = Math.max(0, paguVal - realisasiVal);
          const persenRealisasi = paguVal > 0 ? (realisasiVal / paguVal) * 100 : 0;

          records.push({
            id: `rb_${satkerKode}_${akunKode}_${r}`,
            kementerianKode: kemKode,
            kementerianUraian: kemUraian,
            kewenanganUraian: kewenangan,
            satkerKode: satkerKode || '000000',
            satkerUraian: satkerUraian || 'Satuan Kerja',
            akunKode: akunKode || '521111',
            akunUraian: akunUraian,
            jenisBelanjaKode: jenisInfo.kode,
            jenisBelanjaUraian: jenisInfo.nama,
            sumberdanaUraian: sumberdana,
            programUraian: program,
            kegiatanUraian: kegiatan,
            paguDipa: paguVal,
            realisasi: realisasiVal,
            blokir: blokirVal,
            sisaPagu,
            persenRealisasi
          });
        }

        if (records.length === 0) {
          throw new Error('Tidak ditemukan data baris realisasi belanja yang valid.');
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

    reader.onerror = () => reject(new Error('Gagal membaca file Excel.'));
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
        namaSatker: r.satkerUraian,
        pagu: 0,
        realisasi: 0
      };
    }
    satkerMap[sKey].pagu += r.paguDipa;
    satkerMap[sKey].realisasi += r.realisasi;

    // Kementerian Map
    const kKey = r.kementerianKode || '000';
    if (!kementerianMap[kKey]) {
      kementerianMap[kKey] = {
        kode: kKey,
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
    .sort((a, b) => b.realisasi - a.realisasi)
    .slice(0, 15);

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
  if (!amount || isNaN(amount)) return 'Rp 0';
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
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function formatRupiahFull(amount: number): string {
  if (!amount || isNaN(amount)) return 'Rp 0';
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
 * Export filtered realisasi belanja records to Excel
 */
export function exportRealisasiBelanjaToExcel(
  records: RealisasiBelanjaRecord[],
  fileName = 'Data_Realisasi_Belanja_KPPN.xlsx'
): void {
  const exportData = records.map((r, idx) => ({
    'No': idx + 1,
    'Kode Satker': r.satkerKode,
    'Nama Satker': r.satkerUraian,
    'Kode K/L': r.kementerianKode,
    'Kementerian / Lembaga': r.kementerianUraian,
    'Kewenangan': r.kewenanganUraian || '-',
    'Kode Akun': r.akunKode,
    'Uraian Akun': r.akunUraian,
    'Jenis Belanja': r.jenisBelanjaUraian,
    'Sumber Dana': r.sumberdanaUraian || '-',
    'Program': r.programUraian || '-',
    'Pagu DIPA (Rp)': r.paguDipa,
    'Realisasi (Rp)': r.realisasi,
    'Sisa Pagu (Rp)': r.sisaPagu,
    'Persentase Realisasi (%)': Number(r.persenRealisasi.toFixed(2)),
    'Pagu Blokir (Rp)': r.blokir
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Realisasi Belanja');
  XLSX.writeFile(workbook, fileName);
}
