import { SatkerIKPA, ExcelUploadHistory, PengelolaanUPRecord, MasterSatker, TransaksiKKPRecord, DigipayRecord } from '../types';

const MONTHS_ORDER = [
  'januari', 'februari', 'maret', 'april', 'mei', 'juni',
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
];

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
      namaPic: s.namaPic || '',
      noHpPic: s.noHpPic || '',
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
 */
export function mergeSatkersAntiDowngrade(serverList: SatkerIKPA[], localList: SatkerIKPA[]): SatkerIKPA[] {
  if (!Array.isArray(serverList) || serverList.length === 0) return localList || [];
  if (!Array.isArray(localList) || localList.length === 0) return serverList;

  const satkerMap = new Map<string, SatkerIKPA>();

  // Helper to count non-empty monthly history
  const getMonthCount = (s: SatkerIKPA) => (s.riwayatBulanan || []).filter(r => r && r.bulan).length;

  const localMaxMonths = Math.max(0, ...localList.map(getMonthCount));
  const serverMaxMonths = Math.max(0, ...serverList.map(getMonthCount));

  // Initialize with server list
  serverList.forEach(s => {
    if (s && s.kodeSatker) {
      satkerMap.set(s.kodeSatker.trim(), { ...s });
    }
  });

  // Merge local list
  localList.forEach(localS => {
    const kode = localS.kodeSatker?.trim();
    if (!kode) return;

    const serverS = satkerMap.get(kode);
    if (!serverS) {
      satkerMap.set(kode, localS);
    } else {
      // Merge riwayatBulanan seamlessly
      const historyMap = new Map<string, any>();
      (serverS.riwayatBulanan || []).forEach(r => {
        if (r && r.bulan) {
          historyMap.set(r.bulan.trim().toLowerCase(), r);
        }
      });
      (localS.riwayatBulanan || []).forEach(r => {
        if (r && r.bulan) {
          const key = r.bulan.trim().toLowerCase();
          const existingR = historyMap.get(key);
          // If local has valid nilaiIKPA, prefer local
          if (!existingR || (r.nilaiIKPA && r.nilaiIKPA > 0)) {
            historyMap.set(key, r);
          }
        }
      });

      const mergedHistory = Array.from(historyMap.values()).sort((a, b) => {
        const idxA = MONTHS_ORDER.findIndex(m => (a.bulan || '').toLowerCase().includes(m));
        const idxB = MONTHS_ORDER.findIndex(m => (b.bulan || '').toLowerCase().includes(m));
        return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
      });

      const preferLocalCurrent = localMaxMonths >= serverMaxMonths || (localS.nilaiTotalIKPA || 0) > 0;

      satkerMap.set(kode, {
        ...(preferLocalCurrent ? serverS : localS),
        ...(preferLocalCurrent ? localS : serverS),
        riwayatBulanan: mergedHistory.length > 0 ? mergedHistory : (localS.riwayatBulanan || serverS.riwayatBulanan || []),
        namaPic: localS.namaPic || serverS.namaPic,
        noHpPic: localS.noHpPic || serverS.noHpPic,
        emailPic: localS.emailPic || serverS.emailPic,
        passwordSatker: localS.passwordSatker || serverS.passwordSatker,
        alamatSatker: localS.alamatSatker || serverS.alamatSatker,
        hasIKPAData: localS.hasIKPAData || serverS.hasIKPAData,
        hasCapaianOutputData: localS.hasCapaianOutputData || serverS.hasCapaianOutputData
      });
    }
  });

  return Array.from(satkerMap.values());
}

/**
 * Merge Pengelolaan UP anti-downgrade
 */
export function mergePengelolaanUPAntiDowngrade(serverList: PengelolaanUPRecord[], localList: PengelolaanUPRecord[]): PengelolaanUPRecord[] {
  if (!Array.isArray(serverList) || serverList.length === 0) return localList || [];
  if (!Array.isArray(localList) || localList.length === 0) return serverList;

  const upMap = new Map<string, PengelolaanUPRecord>();
  serverList.forEach(r => {
    if (r && r.kodeSatker) upMap.set(r.kodeSatker.trim(), { ...r });
  });

  localList.forEach(localR => {
    const kode = localR.kodeSatker?.trim();
    if (!kode) return;
    const serverR = upMap.get(kode);
    if (!serverR) {
      upMap.set(kode, localR);
    } else {
      upMap.set(kode, {
        ...serverR,
        ...localR,
        batasRevolvingKolomN: localR.batasRevolvingKolomN || serverR.batasRevolvingKolomN,
        batasWaktuTUPKolomH: localR.batasWaktuTUPKolomH || serverR.batasWaktuTUPKolomH
      });
    }
  });

  return Array.from(upMap.values());
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

