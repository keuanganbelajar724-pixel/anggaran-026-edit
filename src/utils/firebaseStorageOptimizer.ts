import { SatkerIKPA, ExcelUploadHistory, PengelolaanUPRecord, MasterSatker, TransaksiKKPRecord, DigipayRecord } from '../types';

const MONTHS_ORDER = [
  'januari', 'februari', 'maret', 'april', 'mei', 'juni',
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
];

const DUMMY_PHONES = new Set(['081234567890', '081398765432', '081298765432', '081323456789', '+62 812-3456-7890', '08123456789']);

export function cleanContactValue(val?: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (DUMMY_PHONES.has(trimmed)) return '';
  if (trimmed.startsWith('081234567890')) return '';
  return trimmed;
}

export function cleanPicName(val?: string, kode?: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (kode && (trimmed === `Operator ${kode}` || trimmed === `Pejabat Satker ${kode}`)) return '';
  if (/^Operator \d{5,6}$/i.test(trimmed)) return '';
  return trimmed;
}

/**
 * Compacts satkers list for Firestore to prevent 1MB document size limit
 */
export function compactSatkersForFirestore(satkers: SatkerIKPA[]): any[] {
  if (!Array.isArray(satkers)) return [];
  return satkers.map(s => {
    // Keep only non-empty, useful data
    return {
      id: s.id,
      kodeSatker: s.kodeSatker || '',
      namaSatker: s.namaSatker || '',
      kementerianLembaga: s.kementerianLembaga || '',
      unitEselon1: s.unitEselon1 || '',
      paguAnggaran: s.paguAnggaran || 0,
      realisasiAnggaran: s.realisasiAnggaran || 0,
      persenPenyerapan: s.persenPenyerapan || 0,
      statusCapaianOutput: s.statusCapaianOutput || 'Belum Terlaporkan',
      indikator: s.indikator || {
        revisiDipa: 0,
        deviasiHal3Dipa: 0,
        penyerapanAnggaran: 0,
        belanjaKontraktual: 0,
        penyelesaianTagihan: 0,
        pengelolaanUpTup: 0,
        dispensasiSpm: 0,
        capaianOutput: 0
      },
      nilaiTotalIKPA: s.nilaiTotalIKPA || 0,
      predikat: s.predikat || 'Cukup',
      hasIKPAData: s.hasIKPAData !== false,
      hasCapaianOutputData: !!s.hasCapaianOutputData,
      issues: Array.isArray(s.issues) ? s.issues.slice(0, 5) : [],
      namaPic: cleanPicName(s.namaPic, s.kodeSatker),
      noHpPic: cleanContactValue(s.noHpPic),
      emailPic: s.emailPic || '',
      passwordSatker: s.passwordSatker || '',
      alamatSatker: s.alamatSatker || '',
      periodeUpdate: s.periodeUpdate || '',
      riwayatBulanan: Array.isArray(s.riwayatBulanan)
        ? s.riwayatBulanan.map(r => ({
            bulan: r.bulan,
            nilaiIKPA: r.nilaiIKPA ?? 0,
            capaianOutput: r.capaianOutput ?? 0,
            deviasiHal3Dipa: r.deviasiHal3Dipa ?? 0,
            penyerapanAnggaran: r.penyerapanAnggaran ?? 0,
            revisiDipa: r.revisiDipa ?? 0,
            belanjaKontraktual: r.belanjaKontraktual ?? 0,
            penyelesaianTagihan: r.penyelesaianTagihan ?? 0,
            pengelolaanUpTup: r.pengelolaanUpTup ?? 0,
            dispensasiSpm: r.dispensasiSpm ?? 0
          }))
        : []
    };
  });
}

/**
 * Compacts historical uploads array so 50+ months easily fit under 1MB in Firestore
 */
export function compactHistoricalUploadsForFirestore(histories: ExcelUploadHistory[]): any[] {
  if (!Array.isArray(histories)) return [];
  return histories.map(h => ({
    id: h.id,
    fileName: h.fileName,
    periode: h.periode,
    uploadDate: h.uploadDate,
    uploadedBy: h.uploadedBy,
    satkerCount: h.satkerCount,
    averageIKPA: h.averageIKPA,
    notes: h.notes || '',
    category: h.category || 'IKPA',
    isActive: !!h.isActive,
    satkersData: Array.isArray(h.satkersData)
      ? h.satkersData.map((s: any) => ({
          kodeSatker: s.kodeSatker || '',
          namaSatker: s.namaSatker || '',
          nilaiTotalIKPA: s.nilaiTotalIKPA ?? 0,
          predikat: s.predikat || 'Cukup',
          paguAnggaran: s.paguAnggaran || 0,
          realisasiAnggaran: s.realisasiAnggaran || 0,
          statusCapaianOutput: s.statusCapaianOutput || 'Belum Terlaporkan',
          indikator: s.indikator || {
            revisiDipa: 0,
            deviasiHal3Dipa: 0,
            penyerapanAnggaran: 0,
            belanjaKontraktual: 0,
            penyelesaianTagihan: 0,
            pengelolaanUpTup: 0,
            dispensasiSpm: 0,
            capaianOutput: 0
          },
          hasIKPAData: s.hasIKPAData !== false,
          hasCapaianOutputData: !!s.hasCapaianOutputData
        }))
      : []
  }));
}

/**
 * Merge Satkers safely without ever downgrading or deleting multi-month history
 * Server data is authoritative for current indicators, while preserving extended contact & history.
 */
export function mergeSatkersAntiDowngrade(serverList: SatkerIKPA[], localList: SatkerIKPA[]): SatkerIKPA[] {
  if (!Array.isArray(serverList) || serverList.length === 0) return localList || [];
  if (!Array.isArray(localList) || localList.length === 0) return serverList;

  const satkerMap = new Map<string, SatkerIKPA>();

  // Helper to count non-empty monthly history
  const getMonthCount = (s: SatkerIKPA) => (s.riwayatBulanan || []).filter(r => r && r.bulan).length;

  const localMaxMonths = Math.max(0, ...localList.map(getMonthCount));
  const serverMaxMonths = Math.max(0, ...serverList.map(getMonthCount));

  // Initialize with local list first
  localList.forEach(localS => {
    if (localS && localS.kodeSatker) {
      satkerMap.set(localS.kodeSatker.trim(), { ...localS });
    }
  });

  // Apply server list (Server is authoritative Source of Truth)
  serverList.forEach(serverS => {
    const kode = serverS.kodeSatker?.trim();
    if (!kode) return;

    const localS = satkerMap.get(kode);
    if (!localS) {
      satkerMap.set(kode, { ...serverS });
    } else {
      // Merge riwayatBulanan seamlessly (preserve all months)
      const historyMap = new Map<string, any>();
      (localS.riwayatBulanan || []).forEach(r => {
        if (r && r.bulan) {
          historyMap.set(r.bulan.trim().toLowerCase(), r);
        }
      });
      (serverS.riwayatBulanan || []).forEach(r => {
        if (r && r.bulan) {
          historyMap.set(r.bulan.trim().toLowerCase(), r);
        }
      });

      const mergedHistory = Array.from(historyMap.values()).sort((a, b) => {
        const idxA = MONTHS_ORDER.findIndex(m => (a.bulan || '').toLowerCase().includes(m));
        const idxB = MONTHS_ORDER.findIndex(m => (b.bulan || '').toLowerCase().includes(m));
        return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
      });

      // Server data takes precedence for IKPA scores, indicators, and status
      satkerMap.set(kode, {
        ...localS,
        ...serverS,
        riwayatBulanan: mergedHistory.length > 0 ? mergedHistory : (serverS.riwayatBulanan || localS.riwayatBulanan || []),
        namaPic: cleanPicName(serverS.namaPic || localS.namaPic, kode),
        noHpPic: cleanContactValue(serverS.noHpPic || localS.noHpPic),
        emailPic: serverS.emailPic || localS.emailPic || '',
        passwordSatker: serverS.passwordSatker || localS.passwordSatker || '',
        alamatSatker: serverS.alamatSatker || localS.alamatSatker || '',
        hasIKPAData: serverS.hasIKPAData !== undefined ? serverS.hasIKPAData : localS.hasIKPAData,
        hasCapaianOutputData: serverS.hasCapaianOutputData !== undefined ? serverS.hasCapaianOutputData : localS.hasCapaianOutputData
      });
    }
  });

  return Array.from(satkerMap.values());
}

/**
 * Merge Pengelolaan UP anti-downgrade (Server data is authoritative)
 */
export function mergePengelolaanUPAntiDowngrade(serverList: PengelolaanUPRecord[], localList: PengelolaanUPRecord[]): PengelolaanUPRecord[] {
  if (Array.isArray(serverList) && serverList.length > 0) {
    // When server data is available, it is the authoritative single source of truth
    return serverList;
  }
  return Array.isArray(localList) ? localList : [];
}

/**
 * Merge Historical Uploads anti-downgrade (combines all distinct periods)
 */
export function mergeHistoricalUploadsAntiDowngrade(serverList: ExcelUploadHistory[], localList: ExcelUploadHistory[]): ExcelUploadHistory[] {
  if (!Array.isArray(serverList) || serverList.length === 0) return localList || [];
  if (!Array.isArray(localList) || localList.length === 0) return serverList;

  const histMap = new Map<string, ExcelUploadHistory>();

  // Use (category + periode) as key
  serverList.forEach(h => {
    if (h && h.periode) {
      const key = `${h.category || 'IKPA'}_${h.periode.trim().toLowerCase()}`;
      histMap.set(key, h);
    }
  });

  localList.forEach(localH => {
    if (localH && localH.periode) {
      const key = `${localH.category || 'IKPA'}_${localH.periode.trim().toLowerCase()}`;
      const serverH = histMap.get(key);
      if (!serverH || (localH.satkersData && localH.satkersData.length >= (serverH.satkersData?.length || 0))) {
        histMap.set(key, localH);
      }
    }
  });

  return Array.from(histMap.values()).sort((a, b) => {
    const idxA = MONTHS_ORDER.findIndex(m => (a.periode || '').toLowerCase().includes(m));
    const idxB = MONTHS_ORDER.findIndex(m => (b.periode || '').toLowerCase().includes(m));
    return (idxA !== -1 ? idxA : 0) - (idxB !== -1 ? idxB : 0);
  });
}

/**
 * Compacts Digipay records for Firestore
 */
export function compactDigipayForFirestore(records: DigipayRecord[]): any[] {
  if (!Array.isArray(records)) return [];
  return records.map(r => ({
    id: r.id,
    kodeSatker: r.kodeSatker || '',
    namaSatker: r.namaSatker || '',
    kementerianLembaga: r.kementerianLembaga || '',
    tipePembayaran: r.tipePembayaran || 'VA',
    noTransaksi: r.noTransaksi || '',
    tglTransaksi: r.tglTransaksi || '',
    namaVendor: r.namaVendor || '',
    namaBank: r.namaBank || '',
    nominalTransaksi: r.nominalTransaksi || 0,
    statusTransaksi: r.statusTransaksi || 'Selesai',
    uraianBarang: r.uraianBarang || '',
    periode: r.periode || '',
    tahun: r.tahun || 2026
  }));
}

/**
 * Merge Digipay records anti-downgrade
 */
export function mergeDigipayAntiDowngrade(serverList: DigipayRecord[], localList: DigipayRecord[]): DigipayRecord[] {
  if (!Array.isArray(serverList) || serverList.length === 0) return localList || [];
  if (!Array.isArray(localList) || localList.length === 0) return serverList;

  const itemMap = new Map<string, DigipayRecord>();
  serverList.forEach(r => {
    if (r && (r.id || r.noTransaksi)) {
      const key = r.id || `${r.kodeSatker}_${r.noTransaksi}`;
      itemMap.set(key, r);
    }
  });

  localList.forEach(r => {
    if (r && (r.id || r.noTransaksi)) {
      const key = r.id || `${r.kodeSatker}_${r.noTransaksi}`;
      itemMap.set(key, r);
    }
  });

  return Array.from(itemMap.values());
}

