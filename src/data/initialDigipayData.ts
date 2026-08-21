import { DigipayRecord, DigipaySatkerSummary } from '../types';

/**
 * Initial empty records for Digipay - Starts blank for user uploads
 */
export const INITIAL_DIGIPAY_RECORDS: DigipayRecord[] = [];

/**
 * Aggregates individual Digipay records into Satker-level summaries
 */
export function aggregateDigipayRecords(records: DigipayRecord[]): DigipaySatkerSummary[] {
  if (!records || records.length === 0) return [];

  const map = new Map<string, {
    kodeSatker: string;
    namaSatker: string;
    kementerianLembaga?: string;
    totalTransaksiVA: number;
    totalNominalVA: number;
    totalTransaksiKKP: number;
    totalNominalKKP: number;
    banks: Record<string, number>;
    vendors: Record<string, number>;
    latestDate?: string;
  }>();

  records.forEach(r => {
    if (!r.kodeSatker) return;
    const kode = r.kodeSatker.trim();
    const existing = map.get(kode) || {
      kodeSatker: kode,
      namaSatker: r.namaSatker || `Satker ${kode}`,
      kementerianLembaga: r.kementerianLembaga,
      totalTransaksiVA: 0,
      totalNominalVA: 0,
      totalTransaksiKKP: 0,
      totalNominalKKP: 0,
      banks: {},
      vendors: {},
      latestDate: undefined
    };

    if (r.tipePembayaran === 'VA') {
      existing.totalTransaksiVA += 1;
      existing.totalNominalVA += (r.nominalTransaksi || 0);
    } else if (r.tipePembayaran === 'KKP') {
      existing.totalTransaksiKKP += 1;
      existing.totalNominalKKP += (r.nominalTransaksi || 0);
    }

    if (r.namaBank) {
      existing.banks[r.namaBank] = (existing.banks[r.namaBank] || 0) + 1;
    }
    if (r.namaVendor) {
      existing.vendors[r.namaVendor] = (existing.vendors[r.namaVendor] || 0) + 1;
    }

    if (r.tglTransaksi) {
      if (!existing.latestDate || r.tglTransaksi > existing.latestDate) {
        existing.latestDate = r.tglTransaksi;
      }
    }

    map.set(kode, existing);
  });

  const summaries: DigipaySatkerSummary[] = Array.from(map.values()).map(item => {
    const totalSemuaTransaksi = item.totalTransaksiVA + item.totalTransaksiKKP;
    const totalSemuaNominal = item.totalNominalVA + item.totalNominalKKP;

    // Get dominant bank
    let bankTerbanyak = '';
    let maxBankCount = 0;
    Object.entries(item.banks).forEach(([b, cnt]) => {
      if (cnt > maxBankCount) {
        maxBankCount = cnt;
        bankTerbanyak = b;
      }
    });

    // Get dominant vendor
    let vendorTerbanyak = '';
    let maxVendorCount = 0;
    Object.entries(item.vendors).forEach(([v, cnt]) => {
      if (cnt > maxVendorCount) {
        maxVendorCount = cnt;
        vendorTerbanyak = v;
      }
    });

    let statusKeaktifan: DigipaySatkerSummary['statusKeaktifan'] = 'Belum Ada Transaksi';
    if (totalSemuaTransaksi >= 4) {
      statusKeaktifan = 'Sangat Aktif';
    } else if (totalSemuaTransaksi >= 2) {
      statusKeaktifan = 'Aktif';
    } else if (totalSemuaTransaksi > 0) {
      statusKeaktifan = 'Perlu Akselerasi';
    }

    return {
      kodeSatker: item.kodeSatker,
      namaSatker: item.namaSatker,
      kementerianLembaga: item.kementerianLembaga,
      totalTransaksiVA: item.totalTransaksiVA,
      totalNominalVA: item.totalNominalVA,
      totalTransaksiKKP: item.totalTransaksiKKP,
      totalNominalKKP: item.totalNominalKKP,
      totalSemuaTransaksi,
      totalSemuaNominal,
      bankTerbanyak,
      vendorTerbanyak,
      tglTransaksiTerakhir: item.latestDate,
      statusKeaktifan
    };
  });

  // Sort by count for rank
  const sortedByCount = [...summaries].sort((a, b) => b.totalSemuaTransaksi - a.totalSemuaTransaksi || b.totalSemuaNominal - a.totalSemuaNominal);
  sortedByCount.forEach((s, idx) => {
    s.rankByCount = idx + 1;
  });

  // Sort by nominal for rank
  const sortedByNominal = [...summaries].sort((a, b) => b.totalSemuaNominal - a.totalSemuaNominal || b.totalSemuaTransaksi - a.totalSemuaTransaksi);
  sortedByNominal.forEach((s, idx) => {
    s.rankByNominal = idx + 1;
  });

  return sortedByCount;
}

export const INITIAL_DIGIPAY_DATA = INITIAL_DIGIPAY_RECORDS;
