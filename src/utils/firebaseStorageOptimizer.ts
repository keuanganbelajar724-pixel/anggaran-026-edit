import { SatkerIKPA, ExcelUploadHistory, PengelolaanUPRecord, MasterSatker, TransaksiKKPRecord, DigipayRecord, DeviasiHal3Record, DeviasiJenisBelanjaDetail } from '../types';

const MONTHS_ORDER = [
  'januari', 'februari', 'maret', 'april', 'mei', 'juni',
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
];

const PERIODE_BULAN_MAP: Record<number, string> = {
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
 * Server data is authoritative for satkers list and current indicators, while preserving extended contact & history.
 */
export function mergeSatkersAntiDowngrade(serverList: SatkerIKPA[], localList: SatkerIKPA[]): SatkerIKPA[] {
  if (!Array.isArray(serverList)) return localList || [];
  if (serverList.length === 0) return [];

  const localSatkerMap = new Map<string, SatkerIKPA>();
  if (Array.isArray(localList)) {
    localList.forEach(localS => {
      if (localS && localS.kodeSatker) {
        localSatkerMap.set(localS.kodeSatker.trim(), localS);
      }
    });
  }

  // Iterate over serverList (server is authoritative source for which satkers exist)
  return serverList.map(serverS => {
    const kode = serverS.kodeSatker?.trim();
    if (!kode) return serverS;

    const localS = localSatkerMap.get(kode);
    if (!localS) return serverS;

    // Merge riwayatBulanan seamlessly (preserve all distinct months)
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

    return {
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
    };
  });
}

export function compactPengelolaanUPForFirestore(records: PengelolaanUPRecord[]): any[] {
  if (!Array.isArray(records)) return [];
  return records
    .filter(r => r && r.kodeSatker && /^\d{5,6}$/.test(String(r.kodeSatker).trim()) && !String(r.namaSatker || '').includes('24082026') && !String(r.namaSatker || '').toLowerCase().includes('tanggal unduh'))
    .map(r => ({
      id: String(r.id || `up_${r.kodeSatker}`),
      batchId: String(r.batchId || ''),
      kodeSatker: String(r.kodeSatker || '').trim().padStart(6, '0'),
      namaSatker: String(r.namaSatker || '').trim(),
      kementerianLembaga: String(r.kementerianLembaga || ''),
      kodeBa: String(r.kodeBa || ''),
      paguUP: Number(r.paguUP) || 0,
      nilaiUP: Number(r.nilaiUP) || 0,
      realisasiGUP: Number(r.realisasiGUP) || 0,
      totalRevolvingGUP: Number(r.totalRevolvingGUP || r.realisasiGUP) || 0,
      persenRevolving: Number(r.persenRevolving || r.persentaseRevolving) || 0,
      sisaUP: Number(r.sisaUP) || 0,
      persentaseRevolving: Number(r.persentaseRevolving) || 0,
      frekuensiGUP: Number(r.frekuensiGUP) || 0,
      statusRevolving: r.statusRevolving || 'Optimal',
      tglTerakhirSP2D: String(r.tglTerakhirSP2D || r.tanggalTerakhirSP2D || ''),
      nomorSp2dTerakhir: String(r.nomorSp2dTerakhir || ''),
      nilaiSp2dTerakhir: Number(r.nilaiSp2dTerakhir) || 0,
      batasRevolving: String(r.batasRevolving || r.batasRevolvingKolomN || ''),
      batasRevolvingKolomN: String(r.batasRevolvingKolomN || r.batasRevolving || ''),
      batasWaktuTUPKolomH: String(r.batasWaktuTUPKolomH || (r as any).batasWaktuTUP || ''),
      jenisDana: (r.jenisDana === 'TUP' ? 'TUP' : 'UP') as 'UP' | 'TUP',
      tanggalTerakhirSP2D: String(r.tanggalTerakhirSP2D || r.tglTerakhirSP2D || ''),
      sisaHariRevolving: typeof r.sisaHariRevolving === 'number' ? r.sisaHariRevolving : 999,
      sisaHariTUP: typeof r.sisaHariTUP === 'number' ? r.sisaHariTUP : 999,
      isJatuhTempoLibur: !!r.isJatuhTempoLibur,
      sisaHariBatasRevolving: typeof r.sisaHariBatasRevolving === 'number' ? r.sisaHariBatasRevolving : 999,
      isJatuhTempo1Minggu: !!r.isJatuhTempo1Minggu,
      isOverdue: !!r.isOverdue,
      isHariLibur: !!r.isHariLibur,
      saranTglPengajuan: String(r.saranTglPengajuan || ''),
      hariTanpaRevolving: Number(r.hariTanpaRevolving) || 0,
      peringatanKritis: !!r.peringatanKritis,
      keterangan: String(r.keterangan || ''),
      periode: String(r.periode || 'Agustus 2026'),
      tahun: Number(r.tahun) || 2026,
      createdAt: String(r.createdAt || new Date().toISOString()),
      updatedAt: String(r.updatedAt || new Date().toISOString())
    }));
}

/**
 * Merge Pengelolaan UP anti-downgrade (Server data is authoritative)
 */
export function mergePengelolaanUPAntiDowngrade(serverList: PengelolaanUPRecord[], localList: PengelolaanUPRecord[]): PengelolaanUPRecord[] {
  if (Array.isArray(serverList)) {
    return serverList;
  }
  return Array.isArray(localList) ? localList : [];
}

/**
 * Merge Historical Uploads anti-downgrade (Server data is authoritative)
 */
export function mergeHistoricalUploadsAntiDowngrade(serverList: ExcelUploadHistory[], localList: ExcelUploadHistory[]): ExcelUploadHistory[] {
  if (Array.isArray(serverList)) {
    return serverList;
  }
  return Array.isArray(localList) ? localList : [];
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
 * Compacts KKP records for Firestore (removes undefined fields and ensures clean types)
 */
export function compactKKPForFirestore(records: TransaksiKKPRecord[]): any[] {
  if (!Array.isArray(records)) return [];
  return records.map(r => ({
    id: r.id || `kkp-${r.kodeSatker || 'satker'}-${Date.now()}`,
    kodeSatker: r.kodeSatker || '',
    namaSatker: r.namaSatker || '',
    kementerianLembaga: r.kementerianLembaga || '',
    jumlahTransaksi: Number(r.jumlahTransaksi) || 0,
    totalNominal: Number(r.totalNominal) || 0,
    bankPenerbit: r.bankPenerbit || '',
    noSp2dTerakhir: r.noSp2dTerakhir || '',
    tglSp2dTerakhir: r.tglSp2dTerakhir || '',
    statusKeaktifan: r.statusKeaktifan || 'Aktif',
    periode: r.periode || 'Agustus 2026',
    tahun: Number(r.tahun) || 2026,
    catatan: r.catatan || ''
  }));
}

/**
 * Merge Digipay records anti-downgrade (Server is authoritative)
 */
export function mergeDigipayAntiDowngrade(serverList: DigipayRecord[], localList: DigipayRecord[]): DigipayRecord[] {
  if (Array.isArray(serverList)) {
    return serverList;
  }
  return Array.isArray(localList) ? localList : [];
}

/**
 * Compacts Deviasi Hal III records for Firestore (stores values in lightweight 4-tuples)
 * Drastically reduces document payload from >1.9MB down to <250KB for 1,500+ records.
 */
export function compactDeviasiHal3ForFirestore(records: DeviasiHal3Record[]): any[] {
  if (!Array.isArray(records)) return [];
  return records
    .filter(r => r && (r.kodeSatker || r.namaSatker))
    .map(r => {
      const d51 = r.rincianJenisBelanja?.belanja51 || r.rincianJenisBelanja?.belanjaPegawai;
      const d52 = r.rincianJenisBelanja?.belanja52 || r.rincianJenisBelanja?.belanjaBarang;
      const d53 = r.rincianJenisBelanja?.belanja53 || r.rincianJenisBelanja?.belanjaModal;
      const d57 = r.rincianJenisBelanja?.belanja57 || r.rincianJenisBelanja?.belanjaBansos;

      // Lightweight 4-number array: [rpd, realisasi, deviasiNominal, persenDeviasi]
      const b51 = d51 ? [Number(d51.rpd || 0), Number(d51.realisasi || 0), Number(d51.deviasiNominal || 0), Number(d51.persenDeviasi || 0)] : undefined;
      const b52 = d52 ? [Number(d52.rpd || 0), Number(d52.realisasi || 0), Number(d52.deviasiNominal || 0), Number(d52.persenDeviasi || 0)] : undefined;
      const b53 = d53 ? [Number(d53.rpd || 0), Number(d53.realisasi || 0), Number(d53.deviasiNominal || 0), Number(d53.persenDeviasi || 0)] : undefined;
      const b57 = d57 ? [Number(d57.rpd || 0), Number(d57.realisasi || 0), Number(d57.deviasiNominal || 0), Number(d57.persenDeviasi || 0)] : undefined;

      const pAngka = Number(r.periodeAngka) || 8;
      const pBulan = r.periodeBulan || PERIODE_BULAN_MAP[pAngka] || 'Agustus';

      const item: any = {
        id: String(r.id || `deviasi_${r.kodeSatker}_${pAngka}`),
        k: String(r.kodeSatker || '').trim(),
        n: String(r.namaSatker || '').trim(),
        p: pAngka,
        b: pBulan,
        rt: Number(r.rpdTotal) || 0,
        at: Number(r.realisasiTotal) || 0,
        dt: Number(r.deviasiNominalTotal) || 0,
        pt: Number(r.persenDeviasiTotal) || 0
      };

      if (b51 && (b51[0] > 0 || b51[1] > 0 || b51[2] > 0)) item.b51 = b51;
      if (b52 && (b52[0] > 0 || b52[1] > 0 || b52[2] > 0)) item.b52 = b52;
      if (b53 && (b53[0] > 0 || b53[1] > 0 || b53[2] > 0)) item.b53 = b53;
      if (b57 && (b57[0] > 0 || b57[1] > 0 || b57[2] > 0)) item.b57 = b57;

      if (r.kodeKppn && r.kodeKppn !== '026') item.kppn = r.kodeKppn;
      if (r.kodeEselon1) item.es = r.kodeEselon1;
      if (r.tanggalPosting) item.w = r.tanggalPosting;
      if (r.noRevisiTerakhir !== undefined && r.noRevisiTerakhir !== '') item.rev = String(r.noRevisiTerakhir);
      if (r.klasifikasiSatker) item.kl = r.klasifikasiSatker;
      if (r.earlyWarningAlert) item.ew = true;

      return item;
    });
}

/**
 * Hydrates compact Deviasi Hal III records from Firestore into full typed objects
 */
export function hydrateDeviasiHal3FromFirestore(rawList: any[]): DeviasiHal3Record[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .filter(r => r && (r.k || r.kodeSatker || r.n || r.namaSatker))
    .map((r, idx) => {
      const kodeSatker = String(r.k || r.kodeSatker || '').trim();
      const namaSatker = String(r.n || r.namaSatker || `Satker ${kodeSatker}`).trim();
      const periodeAngka = Number(r.p || r.periodeAngka || 8);
      const periodeBulan = String(r.b || r.periodeBulan || PERIODE_BULAN_MAP[periodeAngka] || 'Agustus');
      const periodeFormatted = `Periode ${String(periodeAngka).padStart(2, '0')} (${periodeBulan})`;

      const rpdTotal = Number(r.rt !== undefined ? r.rt : r.rpdTotal) || 0;
      const realisasiTotal = Number(r.at !== undefined ? r.at : r.realisasiTotal) || 0;
      const deviasiNominalTotal = Number(r.dt !== undefined ? r.dt : r.deviasiNominalTotal) || 0;
      const persenDeviasiTotal = Number(r.pt !== undefined ? r.pt : r.persenDeviasiTotal) || 0;

      // Parse 51, 52, 53, 57 details
      const extractDetail = (compactArr: any, fullObj: any, akun: string, label: string): DeviasiJenisBelanjaDetail => {
        let rpd = 0;
        let real = 0;
        let dev = 0;
        let pct = 0;

        if (Array.isArray(compactArr)) {
          rpd = Number(compactArr[0]) || 0;
          real = Number(compactArr[1]) || 0;
          dev = Number(compactArr[2]) || 0;
          pct = Number(compactArr[3]) || 0;
        } else if (fullObj) {
          rpd = Number(fullObj.rpd) || 0;
          real = Number(fullObj.realisasi) || 0;
          dev = Number(fullObj.deviasiNominal) || 0;
          pct = Number(fullObj.persenDeviasi) || 0;
        }

        return {
          jenisBelanja: `${label} (${akun})`,
          akun,
          rpd,
          realisasi: real,
          deviasiNominal: dev,
          persenDeviasi: pct,
          status: pct <= 5 ? 'Aman' : pct <= 10 ? 'Waspada' : pct <= 20 ? 'Tinggi' : 'Kritis'
        };
      };

      const belanja51 = extractDetail(r.b51, r.rincianJenisBelanja?.belanja51 || r.rincianJenisBelanja?.belanjaPegawai, '51', 'Belanja Pegawai');
      const belanja52 = extractDetail(r.b52, r.rincianJenisBelanja?.belanja52 || r.rincianJenisBelanja?.belanjaBarang, '52', 'Belanja Barang');
      const belanja53 = extractDetail(r.b53, r.rincianJenisBelanja?.belanja53 || r.rincianJenisBelanja?.belanjaModal, '53', 'Belanja Modal');
      const belanja57 = extractDetail(r.b57, r.rincianJenisBelanja?.belanja57 || r.rincianJenisBelanja?.belanjaBansos, '57', 'Belanja Bansos');

      const triwulan = (periodeAngka <= 3 ? 'TW I' : periodeAngka <= 6 ? 'TW II' : periodeAngka <= 9 ? 'TW III' : 'TW IV') as any;

      return {
        id: String(r.id || `deviasi-${kodeSatker}-${periodeAngka}-${idx}`),
        kodeSatker,
        namaSatker,
        kementerianLembaga: String(r.kementerianLembaga || 'Kementerian/Lembaga Mitra'),
        kodeKppn: String(r.kppn || r.kodeKppn || '026'),
        kodeEselon1: String(r.es || r.kodeEselon1 || ''),
        periodeAngka,
        periodeBulan,
        periodeFormatted,
        triwulan,
        tahun: Number(r.tahun) || 2026,
        tanggalPosting: String(r.w || r.tanggalPosting || ''),
        noRevisiTerakhir: r.rev !== undefined ? r.rev : (r.noRevisiTerakhir || ''),
        klasifikasiSatker: String(r.kl || r.klasifikasiSatker || ''),
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
        earlyWarningAlert: r.ew !== undefined ? !!r.ew : (r.earlyWarningAlert !== undefined ? !!r.earlyWarningAlert : persenDeviasiTotal > 10.0),
        createdAt: r.createdAt || new Date().toISOString(),
        updatedAt: r.updatedAt || new Date().toISOString()
      };
    });
}

/**
 * Merges Deviasi Hal III lists safely anti-downgrade (Server is authoritative)
 */
export function mergeDeviasiHal3AntiDowngrade(serverRawList: any[], localList: DeviasiHal3Record[]): DeviasiHal3Record[] {
  if (Array.isArray(serverRawList)) {
    return hydrateDeviasiHal3FromFirestore(serverRawList);
  }
  return Array.isArray(localList) ? localList : [];
}



