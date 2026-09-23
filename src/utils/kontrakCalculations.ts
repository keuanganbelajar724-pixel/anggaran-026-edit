import {
  KontrakFilterState,
  KontrakMonitoringRecord,
  KontrakQualityReport,
  KontrakSummary,
  StatusProgressKontrak
} from '../types';

export function getTriwulanFromDate(dateStr: string): 'Tw I' | 'Tw II' | 'Tw III' | 'Tw IV' | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length < 2) return null;
  const month = parseInt(parts[1], 10);
  if (month >= 1 && month <= 3) return 'Tw I';
  if (month >= 4 && month <= 6) return 'Tw II';
  if (month >= 7 && month <= 9) return 'Tw III';
  if (month >= 10 && month <= 12) return 'Tw IV';
  return null;
}

export function filterKontrakRecords(
  records: KontrakMonitoringRecord[],
  filter: KontrakFilterState
): KontrakMonitoringRecord[] {
  return records.filter(r => {
    // 1. Global Search
    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase();
      const match =
        r.nomor_kontrak.toLowerCase().includes(q) ||
        r.kode_satker.toLowerCase().includes(q) ||
        r.deskripsi_satker.toLowerCase().includes(q) ||
        r.nama_supplier.toLowerCase().includes(q) ||
        r.uraian_kontrak.toLowerCase().includes(q) ||
        r.nrk_span.toLowerCase().includes(q) ||
        r.nrk_sakti.toLowerCase().includes(q) ||
        r.kode_coa.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. Tahun (berdasarkan Tanggal Kontrak)
    if (filter.tahun && filter.tahun !== 'ALL') {
      const year = r.tanggal_kontrak.slice(0, 4);
      if (year !== filter.tahun) return false;
    }

    // 3. Triwulan (berdasarkan Tanggal Kontrak)
    if (filter.triwulan && filter.triwulan !== 'ALL') {
      const tw = getTriwulanFromDate(r.tanggal_kontrak);
      if (tw !== filter.triwulan) return false;
    }

    // 4. Bulan (berdasarkan Tanggal Kontrak)
    if (filter.bulan && filter.bulan !== 'ALL') {
      const parts = r.tanggal_kontrak.split('-');
      if (parts.length >= 2) {
        const m = parts[1];
        if (m !== filter.bulan.padStart(2, '0')) return false;
      } else {
        return false;
      }
    }

    // 5. Kode Satker
    if (filter.kodeSatker && filter.kodeSatker !== 'ALL') {
      if (r.kode_satker !== filter.kodeSatker) return false;
    }

    // 6. Nama Satker
    if (filter.namaSatker && filter.namaSatker !== 'ALL') {
      if (r.deskripsi_satker !== filter.namaSatker) return false;
    }

    // 7. Nomor Kontrak
    if (filter.nomorKontrak && filter.nomorKontrak.trim()) {
      if (!r.nomor_kontrak.toLowerCase().includes(filter.nomorKontrak.trim().toLowerCase())) {
        return false;
      }
    }

    // 8. Supplier
    if (filter.supplier && filter.supplier !== 'ALL') {
      if (r.nama_supplier !== filter.supplier) return false;
    }

    // 9. Status NRK
    if (filter.statusNrk && filter.statusNrk !== 'ALL') {
      if (r.status_nrk !== filter.statusNrk) return false;
    }

    // 10. Status Progress Kontrak
    if (filter.statusProgress && filter.statusProgress !== 'ALL') {
      if (r.status_progress_kontrak !== filter.statusProgress) return false;
    }

    // 11. Status Kirim ke KPPN
    if (filter.statusKirimKppn && filter.statusKirimKppn !== 'ALL') {
      if (r.status_kirim_kppn !== filter.statusKirimKppn) return false;
    }

    // 12. Kode COA
    if (filter.kodeCoa && filter.kodeCoa !== 'ALL') {
      if (!r.kode_coa.includes(filter.kodeCoa)) return false;
    }

    // 13. Kode Mata Uang
    if (filter.kodeMataUang && filter.kodeMataUang !== 'ALL') {
      if (r.kode_mata_uang !== filter.kodeMataUang) return false;
    }

    // 14. Tanggal Kontrak Range
    if (filter.tanggalKontrakStart && r.tanggal_kontrak < filter.tanggalKontrakStart) return false;
    if (filter.tanggalKontrakEnd && r.tanggal_kontrak > filter.tanggalKontrakEnd) return false;

    // 15. Tanggal Mulai Range
    if (filter.tanggalMulaiStart && r.tanggal_mulai < filter.tanggalMulaiStart) return false;
    if (filter.tanggalMulaiEnd && r.tanggal_mulai > filter.tanggalMulaiEnd) return false;

    // 16. Tanggal Selesai Range
    if (filter.tanggalSelesaiStart && r.tanggal_selesai < filter.tanggalSelesaiStart) return false;
    if (filter.tanggalSelesaiEnd && r.tanggal_selesai > filter.tanggalSelesaiEnd) return false;

    // 17. Kategori Progress (Quick filter)
    if (filter.kategoriProgress && filter.kategoriProgress !== 'ALL') {
      if (filter.kategoriProgress === 'SELESAI') {
        if (
          r.status_progress_kontrak !== 'SELESAI TEPAT WAKTU' &&
          r.status_progress_kontrak !== 'SELESAI TERLAMBAT'
        ) {
          return false;
        }
      } else if (filter.kategoriProgress === 'BELUM_SELESAI') {
        if (
          r.status_progress_kontrak !== 'BELUM SELESAI' &&
          r.status_progress_kontrak !== 'BELUM SELESAI TERLAMBAT TERMIN' &&
          r.status_progress_kontrak !== 'BELUM SELESAI TERLAMBAT'
        ) {
          return false;
        }
      } else if (filter.kategoriProgress === 'TERLAMBAT') {
        if (
          r.status_progress_kontrak !== 'BELUM SELESAI TERLAMBAT TERMIN' &&
          r.status_progress_kontrak !== 'BELUM SELESAI TERLAMBAT' &&
          r.status_progress_kontrak !== 'SELESAI TERLAMBAT'
        ) {
          return false;
        }
      } else if (filter.kategoriProgress === 'NRK_PERLU_PENYESUAIAN') {
        if (r.status_nrk !== 'SESUAIKAN DENGAN NRK SPAN') {
          return false;
        }
      }
    }

    return true;
  });
}

export function computeKontrakSummary(records: KontrakMonitoringRecord[]): KontrakSummary {
  let totalNilaiKontrak = 0;
  let totalNilaiPembayaran = 0;
  let totalSisaKontrak = 0;

  let selesaiTepatWaktu = 0;
  let selesaiTerlambat = 0;
  let belumSelesaiMurni = 0;
  let belumSelesaiTerlambatTermin = 0;
  let belumSelesaiTerlambat = 0;

  let terlambatNilaiKontrak = 0;
  let terlambatNilaiPembayaran = 0;
  let terlambatSisaKontrak = 0;

  let nrkSesuai = 0;
  let nrkPerluPenyesuaian = 0;

  for (const r of records) {
    totalNilaiKontrak += r.nilai_kontrak;
    totalNilaiPembayaran += r.nilai_pembayaran;
    totalSisaKontrak += r.sisa_kontrak;

    // Status Progress
    if (r.status_progress_kontrak === 'SELESAI TEPAT WAKTU') {
      selesaiTepatWaktu++;
    } else if (r.status_progress_kontrak === 'SELESAI TERLAMBAT') {
      selesaiTerlambat++;
      terlambatNilaiKontrak += r.nilai_kontrak;
      terlambatNilaiPembayaran += r.nilai_pembayaran;
      terlambatSisaKontrak += r.sisa_kontrak;
    } else if (r.status_progress_kontrak === 'BELUM SELESAI') {
      belumSelesaiMurni++;
    } else if (r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN') {
      belumSelesaiTerlambatTermin++;
      terlambatNilaiKontrak += r.nilai_kontrak;
      terlambatNilaiPembayaran += r.nilai_pembayaran;
      terlambatSisaKontrak += r.sisa_kontrak;
    } else if (r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT') {
      belumSelesaiTerlambat++;
      terlambatNilaiKontrak += r.nilai_kontrak;
      terlambatNilaiPembayaran += r.nilai_pembayaran;
      terlambatSisaKontrak += r.sisa_kontrak;
    }

    // Status NRK
    if (r.status_nrk === 'SESUAI') {
      nrkSesuai++;
    } else if (r.status_nrk === 'SESUAIKAN DENGAN NRK SPAN') {
      nrkPerluPenyesuaian++;
    }
  }

  const totalSelesai = selesaiTepatWaktu + selesaiTerlambat;
  const totalBelumSelesai = belumSelesaiMurni + belumSelesaiTerlambatTermin + belumSelesaiTerlambat;
  const totalTerlambat = belumSelesaiTerlambatTermin + belumSelesaiTerlambat + selesaiTerlambat;

  const persenRealisasiPembayaran =
    totalNilaiKontrak > 0 ? (totalNilaiPembayaran / totalNilaiKontrak) * 100 : null;
  const persenSisaKontrak =
    totalNilaiKontrak > 0 ? (totalSisaKontrak / totalNilaiKontrak) * 100 : null;

  return {
    totalKontrak: records.length,
    totalNilaiKontrak,
    totalNilaiPembayaran,
    totalSisaKontrak,
    selesaiTepatWaktu,
    selesaiTerlambat,
    totalSelesai,
    belumSelesaiMurni,
    belumSelesaiTerlambatTermin,
    belumSelesaiTerlambat,
    totalBelumSelesai,
    totalTerlambat,
    terlambatNilaiKontrak,
    terlambatNilaiPembayaran,
    terlambatSisaKontrak,
    nrkSesuai,
    nrkPerluPenyesuaian,
    persenRealisasiPembayaran,
    persenSisaKontrak
  };
}

export function computeDataQualityReport(records: KontrakMonitoringRecord[]): KontrakQualityReport {
  let nrkPerluPenyesuaian = 0;
  let nilaiKontrakNol = 0;
  let pembayaranMelebihiKontrak = 0;
  let sisaKontrakNegatif = 0;
  let tanggalTidakValid = 0;
  let tanggalSelesaiSebelumMulai = 0;

  const seenMap = new Map<string, number>();
  const duplicateKeysList: string[] = [];

  for (const r of records) {
    if (r.status_nrk === 'SESUAIKAN DENGAN NRK SPAN') {
      nrkPerluPenyesuaian++;
    }
    if (r.nilai_kontrak === 0) {
      nilaiKontrakNol++;
    }
    if (r.nilai_pembayaran > r.nilai_kontrak) {
      pembayaranMelebihiKontrak++;
    }
    if (r.sisa_kontrak < 0) {
      sisaKontrakNegatif++;
    }
    if (!r.tanggal_kontrak || !r.tanggal_mulai || !r.tanggal_selesai) {
      tanggalTidakValid++;
    }
    if (r.tanggal_mulai && r.tanggal_selesai && r.tanggal_selesai < r.tanggal_mulai) {
      tanggalSelesaiSebelumMulai++;
    }

    const key = `${r.kode_satker}|${r.nomor_kontrak}`;
    const count = (seenMap.get(key) || 0) + 1;
    seenMap.set(key, count);
    if (count === 2) {
      duplicateKeysList.push(`Satker ${r.kode_satker} - No Kontrak: ${r.nomor_kontrak}`);
    }
  }

  return {
    nrkPerluPenyesuaian,
    nomorKontrakDuplikat: duplicateKeysList.length,
    nilaiKontrakNol,
    pembayaranMelebihiKontrak,
    sisaKontrakNegatif,
    tanggalTidakValid,
    tanggalSelesaiSebelumMulai,
    duplicateKeysList
  };
}

export interface SatkerKontrakAnalysis {
  kodeSatker: string;
  namaSatker: string;
  totalKontrak: number;
  totalNilaiKontrak: number;
  totalPembayaran: number;
  totalSisaKontrak: number;
  selesai: number;
  belumSelesai: number;
  terlambat: number;
  nrkPerluPenyesuaian: number;
}

export function computeSatkerAnalysis(records: KontrakMonitoringRecord[]): SatkerKontrakAnalysis[] {
  const map = new Map<string, SatkerKontrakAnalysis>();

  for (const r of records) {
    let item = map.get(r.kode_satker);
    if (!item) {
      item = {
        kodeSatker: r.kode_satker,
        namaSatker: r.deskripsi_satker,
        totalKontrak: 0,
        totalNilaiKontrak: 0,
        totalPembayaran: 0,
        totalSisaKontrak: 0,
        selesai: 0,
        belumSelesai: 0,
        terlambat: 0,
        nrkPerluPenyesuaian: 0
      };
      map.set(r.kode_satker, item);
    }

    item.totalKontrak++;
    item.totalNilaiKontrak += r.nilai_kontrak;
    item.totalPembayaran += r.nilai_pembayaran;
    item.totalSisaKontrak += r.sisa_kontrak;

    if (
      r.status_progress_kontrak === 'SELESAI TEPAT WAKTU' ||
      r.status_progress_kontrak === 'SELESAI TERLAMBAT'
    ) {
      item.selesai++;
    }
    if (
      r.status_progress_kontrak === 'BELUM SELESAI' ||
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT'
    ) {
      item.belumSelesai++;
    }
    if (
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT' ||
      r.status_progress_kontrak === 'SELESAI TERLAMBAT'
    ) {
      item.terlambat++;
    }
    if (r.status_nrk === 'SESUAIKAN DENGAN NRK SPAN') {
      item.nrkPerluPenyesuaian++;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalNilaiKontrak - a.totalNilaiKontrak);
}

export interface TriwulanKontrakAnalysis {
  triwulan: 'Tw I' | 'Tw II' | 'Tw III' | 'Tw IV';
  label: string;
  totalKontrak: number;
  totalNilaiKontrak: number;
  totalPembayaran: number;
  totalSisaKontrak: number;
  selesai: number;
  belumSelesai: number;
  terlambat: number;
}

export function computeTriwulanAnalysis(records: KontrakMonitoringRecord[]): TriwulanKontrakAnalysis[] {
  const result: Record<'Tw I' | 'Tw II' | 'Tw III' | 'Tw IV', TriwulanKontrakAnalysis> = {
    'Tw I': {
      triwulan: 'Tw I',
      label: 'Triwulan I (Jan - Mar)',
      totalKontrak: 0,
      totalNilaiKontrak: 0,
      totalPembayaran: 0,
      totalSisaKontrak: 0,
      selesai: 0,
      belumSelesai: 0,
      terlambat: 0
    },
    'Tw II': {
      triwulan: 'Tw II',
      label: 'Triwulan II (Apr - Jun)',
      totalKontrak: 0,
      totalNilaiKontrak: 0,
      totalPembayaran: 0,
      totalSisaKontrak: 0,
      selesai: 0,
      belumSelesai: 0,
      terlambat: 0
    },
    'Tw III': {
      triwulan: 'Tw III',
      label: 'Triwulan III (Jul - Sep)',
      totalKontrak: 0,
      totalNilaiKontrak: 0,
      totalPembayaran: 0,
      totalSisaKontrak: 0,
      selesai: 0,
      belumSelesai: 0,
      terlambat: 0
    },
    'Tw IV': {
      triwulan: 'Tw IV',
      label: 'Triwulan IV (Okt - Des)',
      totalKontrak: 0,
      totalNilaiKontrak: 0,
      totalPembayaran: 0,
      totalSisaKontrak: 0,
      selesai: 0,
      belumSelesai: 0,
      terlambat: 0
    }
  };

  for (const r of records) {
    const tw = getTriwulanFromDate(r.tanggal_kontrak);
    if (!tw) continue;
    const target = result[tw];
    target.totalKontrak++;
    target.totalNilaiKontrak += r.nilai_kontrak;
    target.totalPembayaran += r.nilai_pembayaran;
    target.totalSisaKontrak += r.sisa_kontrak;

    if (
      r.status_progress_kontrak === 'SELESAI TEPAT WAKTU' ||
      r.status_progress_kontrak === 'SELESAI TERLAMBAT'
    ) {
      target.selesai++;
    }
    if (
      r.status_progress_kontrak === 'BELUM SELESAI' ||
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT'
    ) {
      target.belumSelesai++;
    }
    if (
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT' ||
      r.status_progress_kontrak === 'SELESAI TERLAMBAT'
    ) {
      target.terlambat++;
    }
  }

  return [result['Tw I'], result['Tw II'], result['Tw III'], result['Tw IV']];
}

export interface SupplierKontrakAnalysis {
  supplier: string;
  totalKontrak: number;
  totalNilaiKontrak: number;
  totalPembayaran: number;
  totalSisaKontrak: number;
  belumSelesai: number;
  terlambat: number;
}

export function computeSupplierAnalysis(records: KontrakMonitoringRecord[]): SupplierKontrakAnalysis[] {
  const map = new Map<string, SupplierKontrakAnalysis>();

  for (const r of records) {
    const supp = r.nama_supplier || 'Supplier Tidak Disebutkan';
    let item = map.get(supp);
    if (!item) {
      item = {
        supplier: supp,
        totalKontrak: 0,
        totalNilaiKontrak: 0,
        totalPembayaran: 0,
        totalSisaKontrak: 0,
        belumSelesai: 0,
        terlambat: 0
      };
      map.set(supp, item);
    }

    item.totalKontrak++;
    item.totalNilaiKontrak += r.nilai_kontrak;
    item.totalPembayaran += r.nilai_pembayaran;
    item.totalSisaKontrak += r.sisa_kontrak;

    if (
      r.status_progress_kontrak === 'BELUM SELESAI' ||
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT'
    ) {
      item.belumSelesai++;
    }
    if (
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT' ||
      r.status_progress_kontrak === 'SELESAI TERLAMBAT'
    ) {
      item.terlambat++;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalNilaiKontrak - a.totalNilaiKontrak);
}

export interface CoaKontrakAnalysis {
  coa: string;
  totalKontrak: number;
  totalNilaiKontrak: number;
  totalPembayaran: number;
  totalSisaKontrak: number;
}

export function computeCoaAnalysis(records: KontrakMonitoringRecord[]): CoaKontrakAnalysis[] {
  const map = new Map<string, CoaKontrakAnalysis>();

  for (const r of records) {
    const coa = r.kode_coa || '-';
    let item = map.get(coa);
    if (!item) {
      item = {
        coa,
        totalKontrak: 0,
        totalNilaiKontrak: 0,
        totalPembayaran: 0,
        totalSisaKontrak: 0
      };
      map.set(coa, item);
    }

    item.totalKontrak++;
    item.totalNilaiKontrak += r.nilai_kontrak;
    item.totalPembayaran += r.nilai_pembayaran;
    item.totalSisaKontrak += r.sisa_kontrak;
  }

  return Array.from(map.values()).sort((a, b) => b.totalNilaiKontrak - a.totalNilaiKontrak);
}

export interface BatchComparisonResult {
  batchAId: string;
  batchBId: string;
  totalBatchA: number;
  totalBatchB: number;
  kontrakBaruCount: number;
  kontrakHilangCount: number;
  perubahanNilaiKontrak: number;
  perubahanPembayaran: number;
  perubahanSisa: number;
  perubahanStatusProgressCount: number;
  perubahanStatusNrkCount: number;
  statusChangesList: Array<{
    logicalKey: string;
    kodeSatker: string;
    nomorKontrak: string;
    oldStatusProgress: string;
    newStatusProgress: string;
    oldStatusNrk: string;
    newStatusNrk: string;
    nilaiDiff: number;
  }>;
}

export function compareUploadBatches(
  recordsA: KontrakMonitoringRecord[],
  recordsB: KontrakMonitoringRecord[],
  batchAId: string,
  batchBId: string
): BatchComparisonResult {
  const mapA = new Map<string, KontrakMonitoringRecord>();
  recordsA.forEach(r => mapA.set(`${r.kode_satker}|${r.nomor_kontrak}`, r));

  const mapB = new Map<string, KontrakMonitoringRecord>();
  recordsB.forEach(r => mapB.set(`${r.kode_satker}|${r.nomor_kontrak}`, r));

  let kontrakBaruCount = 0;
  let kontrakHilangCount = 0;
  let perubahanNilaiKontrak = 0;
  let perubahanPembayaran = 0;
  let perubahanSisa = 0;
  let perubahanStatusProgressCount = 0;
  let perubahanStatusNrkCount = 0;

  const statusChangesList: BatchComparisonResult['statusChangesList'] = [];

  // Check items in B
  for (const [key, itemB] of mapB.entries()) {
    const itemA = mapA.get(key);
    if (!itemA) {
      kontrakBaruCount++;
    } else {
      const pDiff = itemB.nilai_kontrak - itemA.nilai_kontrak;
      const payDiff = itemB.nilai_pembayaran - itemA.nilai_pembayaran;
      const sisaDiff = itemB.sisa_kontrak - itemA.sisa_kontrak;

      perubahanNilaiKontrak += pDiff;
      perubahanPembayaran += payDiff;
      perubahanSisa += sisaDiff;

      const progressChanged = itemA.status_progress_kontrak !== itemB.status_progress_kontrak;
      const nrkChanged = itemA.status_nrk !== itemB.status_nrk;

      if (progressChanged) perubahanStatusProgressCount++;
      if (nrkChanged) perubahanStatusNrkCount++;

      if (progressChanged || nrkChanged || pDiff !== 0) {
        statusChangesList.push({
          logicalKey: key,
          kodeSatker: itemB.kode_satker,
          nomorKontrak: itemB.nomor_kontrak,
          oldStatusProgress: itemA.status_progress_kontrak,
          newStatusProgress: itemB.status_progress_kontrak,
          oldStatusNrk: itemA.status_nrk,
          newStatusNrk: itemB.status_nrk,
          nilaiDiff: pDiff
        });
      }
    }
  }

  // Check items in A but not in B
  for (const [key] of mapA.entries()) {
    if (!mapB.has(key)) {
      kontrakHilangCount++;
    }
  }

  return {
    batchAId,
    batchBId,
    totalBatchA: recordsA.length,
    totalBatchB: recordsB.length,
    kontrakBaruCount,
    kontrakHilangCount,
    perubahanNilaiKontrak,
    perubahanPembayaran,
    perubahanSisa,
    perubahanStatusProgressCount,
    perubahanStatusNrkCount,
    statusChangesList
  };
}

export function formatRupiah(val: number): string {
  if (isNaN(val)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
}

export function formatNumber(val: number): string {
  if (isNaN(val)) return '0';
  return new Intl.NumberFormat('id-ID').format(val);
}

// -------------------------------------------------------------
// ANALISIS TAMBAHAN TINGKAT LANJUT (EXTENDED EXPERT ANALYTICS)
// -------------------------------------------------------------

/**
 * 1. Analisis Durasi Pelaksanaan & Aging Sisa Hari Jatuh Tempo
 */
export interface AgingAndDeadlineAnalysis {
  referenceDate: string;
  avgDurationDays: number;
  minDurationDays: number;
  maxDurationDays: number;
  // Kategori Masa Pelaksanaan
  durationBrackets: Array<{
    name: string;
    count: number;
    totalNilai: number;
    color: string;
  }>;
  // Kategori Countdown Jatuh Tempo
  overdueCount: number;
  overdueSisa: number;
  criticalCount: number; // <= 14 hari
  criticalSisa: number;
  warningCount: number;  // 15 - 30 hari
  warningSisa: number;
  normalCount: number;   // > 30 hari
  normalSisa: number;
  settledCount: number;  // Sisa 0
  settledNilai: number;
  countdownChartData: Array<{
    category: string;
    label: string;
    count: number;
    sisa: number;
    color: string;
  }>;
  // Kontrak Prioritas yang Memerlukan Tindakan Cepat
  urgentAttentionList: Array<{
    record: KontrakMonitoringRecord;
    daysRemaining: number;
    durationDays: number;
    urgencyLevel: 'CRITICAL_OVERDUE' | 'HIGH_15_DAYS' | 'MEDIUM_30_DAYS';
  }>;
}

export function computeAgingAndDeadlineAnalysis(
  records: KontrakMonitoringRecord[],
  referenceDateStr: string = '2026-09-23'
): AgingAndDeadlineAnalysis {
  const refTime = new Date(referenceDateStr).getTime();

  let totalDuration = 0;
  let validDurationCount = 0;
  let minDuration = 99999;
  let maxDuration = 0;

  // Brackets durasi
  let durKilat = { name: '< 30 Hari (Pengadaan Kilat)', count: 0, totalNilai: 0, color: '#06b6d4' };
  let durPendek = { name: '1 - 3 Bulan (Jangka Pendek)', count: 0, totalNilai: 0, color: '#3b82f6' };
  let durMenengah = { name: '3 - 6 Bulan (Jangka Menengah)', count: 0, totalNilai: 0, color: '#8b5cf6' };
  let durPanjang = { name: '> 6 Bulan (Jangka Panjang)', count: 0, totalNilai: 0, color: '#ec4899' };

  let overdueCount = 0;
  let overdueSisa = 0;
  let criticalCount = 0;
  let criticalSisa = 0;
  let warningCount = 0;
  let warningSisa = 0;
  let normalCount = 0;
  let normalSisa = 0;
  let settledCount = 0;
  let settledNilai = 0;

  const urgentAttentionList: AgingAndDeadlineAnalysis['urgentAttentionList'] = [];

  for (const r of records) {
    // 1. Durasi pelaksanaan
    let durationDays = 0;
    if (r.tanggal_mulai && r.tanggal_selesai) {
      const startT = new Date(r.tanggal_mulai).getTime();
      const endT = new Date(r.tanggal_selesai).getTime();
      if (!isNaN(startT) && !isNaN(endT) && endT >= startT) {
        durationDays = Math.round((endT - startT) / (1000 * 60 * 60 * 24)) + 1;
        totalDuration += durationDays;
        validDurationCount++;
        if (durationDays < minDuration) minDuration = durationDays;
        if (durationDays > maxDuration) maxDuration = durationDays;

        if (durationDays < 30) {
          durKilat.count++;
          durKilat.totalNilai += r.nilai_kontrak;
        } else if (durationDays <= 90) {
          durPendek.count++;
          durPendek.totalNilai += r.nilai_kontrak;
        } else if (durationDays <= 180) {
          durMenengah.count++;
          durMenengah.totalNilai += r.nilai_kontrak;
        } else {
          durPanjang.count++;
          durPanjang.totalNilai += r.nilai_kontrak;
        }
      }
    }

    // 2. Countdown jatuh tempo dari tanggal referensi
    if (r.sisa_kontrak <= 0) {
      settledCount++;
      settledNilai += r.nilai_kontrak;
    } else {
      let daysRemaining = 999;
      if (r.tanggal_selesai) {
        const endT = new Date(r.tanggal_selesai).getTime();
        if (!isNaN(endT)) {
          daysRemaining = Math.round((endT - refTime) / (1000 * 60 * 60 * 24));
        }
      }

      if (daysRemaining < 0) {
        // Lewat tanggal selesai tapi sisa masih ada
        overdueCount++;
        overdueSisa += r.sisa_kontrak;
        urgentAttentionList.push({
          record: r,
          daysRemaining,
          durationDays,
          urgencyLevel: 'CRITICAL_OVERDUE'
        });
      } else if (daysRemaining <= 14) {
        // Kritis <= 14 hari
        criticalCount++;
        criticalSisa += r.sisa_kontrak;
        urgentAttentionList.push({
          record: r,
          daysRemaining,
          durationDays,
          urgencyLevel: 'HIGH_15_DAYS'
        });
      } else if (daysRemaining <= 30) {
        // Peringatan 15 - 30 hari
        warningCount++;
        warningSisa += r.sisa_kontrak;
        urgentAttentionList.push({
          record: r,
          daysRemaining,
          durationDays,
          urgencyLevel: 'MEDIUM_30_DAYS'
        });
      } else {
        normalCount++;
        normalSisa += r.sisa_kontrak;
      }
    }
  }

  // Sort urgent list: overdue first, then lowest daysRemaining, then highest sisa
  urgentAttentionList.sort((a, b) => {
    if (a.daysRemaining !== b.daysRemaining) {
      return a.daysRemaining - b.daysRemaining;
    }
    return b.record.sisa_kontrak - a.record.sisa_kontrak;
  });

  return {
    referenceDate: referenceDateStr,
    avgDurationDays: validDurationCount > 0 ? Math.round(totalDuration / validDurationCount) : 0,
    minDurationDays: minDuration === 99999 ? 0 : minDuration,
    maxDurationDays: maxDuration,
    durationBrackets: [durKilat, durPendek, durMenengah, durPanjang],
    overdueCount,
    overdueSisa,
    criticalCount,
    criticalSisa,
    warningCount,
    warningSisa,
    normalCount,
    normalSisa,
    settledCount,
    settledNilai,
    countdownChartData: [
      {
        category: 'OVERDUE',
        label: '🚨 Lewat Batas Akhir (Sisa > 0)',
        count: overdueCount,
        sisa: overdueSisa,
        color: '#ef4444'
      },
      {
        category: 'CRITICAL_14',
        label: '⏳ Kritis (< 15 Hari Lagi)',
        count: criticalCount,
        sisa: criticalSisa,
        color: '#f97316'
      },
      {
        category: 'WARNING_30',
        label: '⚠️ Waspada (15 - 30 Hari Lagi)',
        count: warningCount,
        sisa: warningSisa,
        color: '#f59e0b'
      },
      {
        category: 'NORMAL',
        label: '📅 Aman (> 30 Hari Lagi)',
        count: normalCount,
        sisa: normalSisa,
        color: '#3b82f6'
      },
      {
        category: 'SETTLED',
        label: '✅ Lunas / Sisa Nol (Selesai)',
        count: settledCount,
        sisa: settledNilai,
        color: '#10b981'
      }
    ],
    urgentAttentionList: urgentAttentionList.slice(0, 30) // top 30
  };
}

/**
 * 2. Analisis Segmentasi Nilai & Skala Proyek Pengadaan
 */
export interface ScaleSegmentItem {
  key: 'MIKRO' | 'KECIL' | 'MENENGAH' | 'BESAR';
  name: string;
  rangeLabel: string;
  count: number;
  totalNilai: number;
  totalPembayaran: number;
  totalSisa: number;
  persenSerapan: number;
  persenDariTotalNilai: number;
  terlambatCount: number;
  terlambatRate: number;
  color: string;
}

export function computeScaleSegmentation(records: KontrakMonitoringRecord[]): {
  segments: ScaleSegmentItem[];
  totalNilaiAll: number;
} {
  const totalNilaiAll = records.reduce((acc, r) => acc + r.nilai_kontrak, 0);

  const mikro: ScaleSegmentItem = {
    key: 'MIKRO',
    name: 'Pengadaan Mikro',
    rangeLabel: '< Rp 50 Juta',
    count: 0,
    totalNilai: 0,
    totalPembayaran: 0,
    totalSisa: 0,
    persenSerapan: 0,
    persenDariTotalNilai: 0,
    terlambatCount: 0,
    terlambatRate: 0,
    color: '#06b6d4'
  };

  const kecil: ScaleSegmentItem = {
    key: 'KECIL',
    name: 'Pengadaan Kecil (Batas Non-Tender)',
    rangeLabel: 'Rp 50 Jt - Rp 200 Jt',
    count: 0,
    totalNilai: 0,
    totalPembayaran: 0,
    totalSisa: 0,
    persenSerapan: 0,
    persenDariTotalNilai: 0,
    terlambatCount: 0,
    terlambatRate: 0,
    color: '#3b82f6'
  };

  const menengah: ScaleSegmentItem = {
    key: 'MENENGAH',
    name: 'Pengadaan Menengah (Tender UMKM)',
    rangeLabel: 'Rp 200 Jt - Rp 2,5 Miliar',
    count: 0,
    totalNilai: 0,
    totalPembayaran: 0,
    totalSisa: 0,
    persenSerapan: 0,
    persenDariTotalNilai: 0,
    terlambatCount: 0,
    terlambatRate: 0,
    color: '#8b5cf6'
  };

  const besar: ScaleSegmentItem = {
    key: 'BESAR',
    name: 'Proyek Skala Besar / Strategis',
    rangeLabel: '> Rp 2,5 Miliar',
    count: 0,
    totalNilai: 0,
    totalPembayaran: 0,
    totalSisa: 0,
    persenSerapan: 0,
    persenDariTotalNilai: 0,
    terlambatCount: 0,
    terlambatRate: 0,
    color: '#ec4899'
  };

  for (const r of records) {
    let target: ScaleSegmentItem;
    if (r.nilai_kontrak < 50000000) {
      target = mikro;
    } else if (r.nilai_kontrak <= 200000000) {
      target = kecil;
    } else if (r.nilai_kontrak <= 2500000000) {
      target = menengah;
    } else {
      target = besar;
    }

    target.count++;
    target.totalNilai += r.nilai_kontrak;
    target.totalPembayaran += r.nilai_pembayaran;
    target.totalSisa += r.sisa_kontrak;

    if (
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT' ||
      r.status_progress_kontrak === 'SELESAI TERLAMBAT'
    ) {
      target.terlambatCount++;
    }
  }

  const segments = [mikro, kecil, menengah, besar].map(seg => {
    seg.persenSerapan = seg.totalNilai > 0 ? (seg.totalPembayaran / seg.totalNilai) * 100 : 0;
    seg.persenDariTotalNilai = totalNilaiAll > 0 ? (seg.totalNilai / totalNilaiAll) * 100 : 0;
    seg.terlambatRate = seg.count > 0 ? (seg.terlambatCount / seg.count) * 100 : 0;
    return seg;
  });

  return {
    segments,
    totalNilaiAll
  };
}

/**
 * 3. Analisis Kategori Komoditas / Jenis Pengadaan (Text Intelligence Parser)
 */
export interface CommodityCategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
  totalNilai: number;
  totalPembayaran: number;
  totalSisa: number;
  persenSerapan: number;
  samples: string[];
}

export function computeCommodityIntelligence(
  records: KontrakMonitoringRecord[]
): CommodityCategoryItem[] {
  const categories: Record<string, CommodityCategoryItem> = {
    konstruksi: {
      id: 'konstruksi',
      name: 'Konstruksi & Fisik Bangunan',
      icon: '🏗️',
      color: '#0284c7',
      count: 0,
      totalNilai: 0,
      totalPembayaran: 0,
      totalSisa: 0,
      persenSerapan: 0,
      samples: []
    },
    ti: {
      id: 'ti',
      name: 'TI, Perangkat & Jaringan',
      icon: '💻',
      color: '#6366f1',
      count: 0,
      totalNilai: 0,
      totalPembayaran: 0,
      totalSisa: 0,
      persenSerapan: 0,
      samples: []
    },
    kebersihan: {
      id: 'kebersihan',
      name: 'Kebersihan, Keamanan & Pramubakti',
      icon: '🧹',
      color: '#10b981',
      count: 0,
      totalNilai: 0,
      totalPembayaran: 0,
      totalSisa: 0,
      persenSerapan: 0,
      samples: []
    },
    transportasi: {
      id: 'transportasi',
      name: 'Sewa Kendaraan & Transportasi',
      icon: '🚗',
      color: '#f59e0b',
      count: 0,
      totalNilai: 0,
      totalPembayaran: 0,
      totalSisa: 0,
      persenSerapan: 0,
      samples: []
    },
    konsumsi: {
      id: 'konsumsi',
      name: 'Konsumsi, Catering & Hotel',
      icon: '🍱',
      color: '#ea580c',
      count: 0,
      totalNilai: 0,
      totalPembayaran: 0,
      totalSisa: 0,
      persenSerapan: 0,
      samples: []
    },
    atk: {
      id: 'atk',
      name: 'ATK, Percetakan & Publikasi',
      icon: '📦',
      color: '#8b5cf6',
      count: 0,
      totalNilai: 0,
      totalPembayaran: 0,
      totalSisa: 0,
      persenSerapan: 0,
      samples: []
    },
    medis: {
      id: 'medis',
      name: 'Kesehatan, Medis & Laboratorium',
      icon: '🏥',
      color: '#ec4899',
      count: 0,
      totalNilai: 0,
      totalPembayaran: 0,
      totalSisa: 0,
      persenSerapan: 0,
      samples: []
    },
    konsultansi: {
      id: 'konsultansi',
      name: 'Konsultansi, Supervisi & Diklat',
      icon: '🎓',
      color: '#14b8a6',
      count: 0,
      totalNilai: 0,
      totalPembayaran: 0,
      totalSisa: 0,
      persenSerapan: 0,
      samples: []
    },
    pemeliharaan: {
      id: 'pemeliharaan',
      name: 'Pemeliharaan Gedung & Mesin',
      icon: '🛠️',
      color: '#64748b',
      count: 0,
      totalNilai: 0,
      totalPembayaran: 0,
      totalSisa: 0,
      persenSerapan: 0,
      samples: []
    },
    lainnya: {
      id: 'lainnya',
      name: 'Pengadaan Operasional Lainnya',
      icon: '📂',
      color: '#94a3b8',
      count: 0,
      totalNilai: 0,
      totalPembayaran: 0,
      totalSisa: 0,
      persenSerapan: 0,
      samples: []
    }
  };

  const reKonstruksi = /gedung|bangunan|renovasi|rehab|jalan|jembatan|pagar|ruang|fisik|konstruksi|saluran|drainase|atap|paving|pondasi|semen|cor/i;
  const reTi = /software|server|komputer|laptop|internet|jaringan|lan|wifi|lisensi|aplikasi|hosting|domain|printer|scanner|hardware|cctv|komputasi|cloud/i;
  const reKebersihan = /cleaning|kebersihan|security|keamanan|satpam|pramubakti|pengamanan|taman|cleaning service|gardener/i;
  const reTransportasi = /kendaraan|mobil|motor|sewa mobil|rental|transport|bus|sopir|driver|angkutan|tiket|bbm/i;
  const reKonsumsi = /makan|snack|konsumsi|katering|catering|jamuan|prasmanan|hotel|akomodasi|paket meeting/i;
  const reAtk = /atk|alat tulis|kertas|cetak|percetakan|buku|spanduk|banner|brosur|map|amplop|stempel/i;
  const reMedis = /alkes|medis|obat|reagen|lab|laboratorium|kesehatan|rapid|vaksin|pasien|farmasi|darah/i;
  const reKonsultansi = /konsultan|supervisi|pengawasan|perencanaan|kajian|narasumber|pelatihan|diklat|kursus|studi|penelitian|audit/i;
  const rePemeliharaan = /pemeliharaan|perawatan|servis|service|perbaikan|ac|apar|genset|kalibrasi/i;

  for (const r of records) {
    const text = `${r.uraian_kontrak || ''} ${r.detail_barang_jasa || ''}`.toLowerCase();
    const coa = (r.kode_coa || '').trim();

    let catKey = 'lainnya';
    if (reKonstruksi.test(text) || coa.startsWith('53')) {
      catKey = 'konstruksi';
    } else if (reTi.test(text)) {
      catKey = 'ti';
    } else if (reKebersihan.test(text)) {
      catKey = 'kebersihan';
    } else if (reTransportasi.test(text)) {
      catKey = 'transportasi';
    } else if (reKonsumsi.test(text)) {
      catKey = 'konsumsi';
    } else if (reAtk.test(text)) {
      catKey = 'atk';
    } else if (reMedis.test(text)) {
      catKey = 'medis';
    } else if (reKonsultansi.test(text)) {
      catKey = 'konsultansi';
    } else if (rePemeliharaan.test(text)) {
      catKey = 'pemeliharaan';
    }

    const cat = categories[catKey];
    cat.count++;
    cat.totalNilai += r.nilai_kontrak;
    cat.totalPembayaran += r.nilai_pembayaran;
    cat.totalSisa += r.sisa_kontrak;

    if (cat.samples.length < 3 && r.uraian_kontrak) {
      cat.samples.push(r.uraian_kontrak);
    }
  }

  return Object.values(categories)
    .map(c => {
      c.persenSerapan = c.totalNilai > 0 ? (c.totalPembayaran / c.totalNilai) * 100 : 0;
      return c;
    })
    .sort((a, b) => b.totalNilai - a.totalNilai);
}

/**
 * 4. Analisis Kontrak Dorman (Nol Realisasi Pembayaran / Zero Disbursement)
 */
export interface DormantContractItem {
  record: KontrakMonitoringRecord;
  daysSinceStart: number;
  riskTier: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function computeDormantContracts(
  records: KontrakMonitoringRecord[],
  referenceDateStr: string = '2026-09-23'
): {
  dormantRecords: DormantContractItem[];
  totalDormant: number;
  totalDormantNilai: number;
  countHighRisk: number;   // > 60 hari nol realisasi
  countMediumRisk: number; // 31 - 60 hari
  countLowRisk: number;    // <= 30 hari
} {
  const refTime = new Date(referenceDateStr).getTime();
  const dormantRecords: DormantContractItem[] = [];

  let totalDormantNilai = 0;
  let countHighRisk = 0;
  let countMediumRisk = 0;
  let countLowRisk = 0;

  for (const r of records) {
    // Kontrak dengan nilai > 0 tapi pembayaran masih 0
    if (r.nilai_kontrak > 0 && r.nilai_pembayaran === 0) {
      let daysSinceStart = 0;
      if (r.tanggal_mulai) {
        const startT = new Date(r.tanggal_mulai).getTime();
        if (!isNaN(startT)) {
          daysSinceStart = Math.max(0, Math.round((refTime - startT) / (1000 * 60 * 60 * 24)));
        }
      }

      let riskTier: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (daysSinceStart > 60) {
        riskTier = 'HIGH';
        countHighRisk++;
      } else if (daysSinceStart > 30) {
        riskTier = 'MEDIUM';
        countMediumRisk++;
      } else {
        countLowRisk++;
      }

      totalDormantNilai += r.nilai_kontrak;
      dormantRecords.push({
        record: r,
        daysSinceStart,
        riskTier
      });
    }
  }

  dormantRecords.sort((a, b) => {
    if (a.riskTier === 'HIGH' && b.riskTier !== 'HIGH') return -1;
    if (b.riskTier === 'HIGH' && a.riskTier !== 'HIGH') return 1;
    return b.record.nilai_kontrak - a.record.nilai_kontrak;
  });

  return {
    dormantRecords,
    totalDormant: dormantRecords.length,
    totalDormantNilai,
    countHighRisk,
    countMediumRisk,
    countLowRisk
  };
}

/**
 * 5. Rekanan Multikontrak Lintas Satker (Cross-Satker Supplier Exposure)
 */
export interface CrossSatkerSupplierItem {
  supplier: string;
  totalKontrak: number;
  satkerList: string[];
  satkerCount: number;
  totalNilai: number;
  totalPembayaran: number;
  totalSisa: number;
  persenSerapan: number;
  terlambatCount: number;
}

export function computeCrossSatkerSuppliers(
  records: KontrakMonitoringRecord[]
): CrossSatkerSupplierItem[] {
  const map = new Map<
    string,
    {
      supplier: string;
      totalKontrak: number;
      satkers: Set<string>;
      totalNilai: number;
      totalPembayaran: number;
      totalSisa: number;
      terlambatCount: number;
    }
  >();

  for (const r of records) {
    const supp = (r.nama_supplier || '').trim() || 'Supplier Tanpa Nama';
    let item = map.get(supp);
    if (!item) {
      item = {
        supplier: supp,
        totalKontrak: 0,
        satkers: new Set<string>(),
        totalNilai: 0,
        totalPembayaran: 0,
        totalSisa: 0,
        terlambatCount: 0
      };
      map.set(supp, item);
    }

    item.totalKontrak++;
    item.satkers.add(`${r.kode_satker} - ${r.deskripsi_satker}`);
    item.totalNilai += r.nilai_kontrak;
    item.totalPembayaran += r.nilai_pembayaran;
    item.totalSisa += r.sisa_kontrak;

    if (
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
      r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT' ||
      r.status_progress_kontrak === 'SELESAI TERLAMBAT'
    ) {
      item.terlambatCount++;
    }
  }

  // Filter only those who work with > 1 satker OR have >= 3 contracts
  const crossSuppliers: CrossSatkerSupplierItem[] = [];
  for (const item of map.values()) {
    if (item.satkers.size > 1 || item.totalKontrak >= 3) {
      crossSuppliers.push({
        supplier: item.supplier,
        totalKontrak: item.totalKontrak,
        satkerList: Array.from(item.satkers),
        satkerCount: item.satkers.size,
        totalNilai: item.totalNilai,
        totalPembayaran: item.totalPembayaran,
        totalSisa: item.totalSisa,
        persenSerapan: item.totalNilai > 0 ? (item.totalPembayaran / item.totalNilai) * 100 : 0,
        terlambatCount: item.terlambatCount
      });
    }
  }

  return crossSuppliers.sort((a, b) => b.totalNilai - a.totalNilai);
}

/**
 * 6. Burn-Rate Estimator / Proyeksi Kebutuhan Kas Mingguan
 */
export interface BurnRateEstimate {
  targetCutoffDate: string;
  remainingWeeks: number;
  remainingWorkDays: number;
  totalSisaToDisburse: number;
  requiredWeeklyBurnRate: number;
  requiredDailyBurnRate: number;
  topContributingSatkers: Array<{
    kodeSatker: string;
    namaSatker: string;
    sisa: number;
    percentOfTotalSisa: number;
  }>;
}

export function computeBurnRateEstimate(
  records: KontrakMonitoringRecord[],
  targetDateStr: string = '2026-12-15',
  referenceDateStr: string = '2026-09-23'
): BurnRateEstimate {
  const refT = new Date(referenceDateStr).getTime();
  const targetT = new Date(targetDateStr).getTime();

  const diffDays = Math.max(1, Math.round((targetT - refT) / (1000 * 60 * 60 * 24)));
  const remainingWeeks = Math.max(1, Math.round(diffDays / 7));
  const remainingWorkDays = Math.max(1, Math.round((diffDays * 5) / 7));

  const totalSisaToDisburse = records.reduce((acc, r) => acc + r.sisa_kontrak, 0);
  const requiredWeeklyBurnRate = totalSisaToDisburse / remainingWeeks;
  const requiredDailyBurnRate = totalSisaToDisburse / remainingWorkDays;

  // Satker contributing to sisa
  const satkerMap = new Map<string, { kode: string; nama: string; sisa: number }>();
  for (const r of records) {
    if (r.sisa_kontrak > 0) {
      let s = satkerMap.get(r.kode_satker);
      if (!s) {
        s = { kode: r.kode_satker, nama: r.deskripsi_satker, sisa: 0 };
        satkerMap.set(r.kode_satker, s);
      }
      s.sisa += r.sisa_kontrak;
    }
  }

  const topContributingSatkers = Array.from(satkerMap.values())
    .sort((a, b) => b.sisa - a.sisa)
    .slice(0, 10)
    .map(s => ({
      kodeSatker: s.kode,
      namaSatker: s.nama,
      sisa: s.sisa,
      percentOfTotalSisa: totalSisaToDisburse > 0 ? (s.sisa / totalSisaToDisburse) * 100 : 0
    }));

  return {
    targetCutoffDate: targetDateStr,
    remainingWeeks,
    remainingWorkDays,
    totalSisaToDisburse,
    requiredWeeklyBurnRate,
    requiredDailyBurnRate,
    topContributingSatkers
  };
}

