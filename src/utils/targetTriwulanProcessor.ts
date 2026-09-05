import { MyIntressRecord, TriwulanKey, TargetTriwulanRule } from '../types';

/**
 * Aturan Target Triwulanan Realisasi Belanja Resmi Sesuai Ketentuan DJPb:
 * - Belanja Pegawai: Tw I (20%), Tw II (50%), Tw III (75%), Tw IV (95%)
 * - Belanja Barang:  Tw I (15%), Tw II (50%), Tw III (70%), Tw IV (90%)
 * - Belanja Modal:   Tw I (10%), Tw II (40%), Tw III (70%), Tw IV (90%)
 * - Belanja Bansos:  Tw I (25%), Tw II (50%), Tw III (75%), Tw IV (95%)
 */
export const DEFAULT_TARGET_TRIWULAN: Record<TriwulanKey, TargetTriwulanRule> = {
  'Tw I': {
    pegawai: 20,
    barang: 15,
    modal: 10,
    bansos: 25
  },
  'Tw II': {
    pegawai: 50,
    barang: 50,
    modal: 40,
    bansos: 50
  },
  'Tw III': {
    pegawai: 75,
    barang: 70,
    modal: 70,
    bansos: 75
  },
  'Tw IV': {
    pegawai: 95,
    barang: 90,
    modal: 90,
    bansos: 95
  }
};

export const DEFAULT_TARGET_TRIWULAN_RULES = DEFAULT_TARGET_TRIWULAN;

export const TRIWULAN_OPTIONS: { key: TriwulanKey; label: string; bulanDesc: string; desc: string }[] = [
  { key: 'Tw I', label: 'Triwulan I', bulanDesc: 's.d. Akhir Maret', desc: 'Pegawai: 20% | Barang: 15% | Modal: 10% | Bansos: 25%' },
  { key: 'Tw II', label: 'Triwulan II', bulanDesc: 's.d. Akhir Juni', desc: 'Pegawai: 50% | Barang: 50% | Modal: 40% | Bansos: 50%' },
  { key: 'Tw III', label: 'Triwulan III', bulanDesc: 's.d. Akhir September', desc: 'Pegawai: 75% | Barang: 70% | Modal: 70% | Bansos: 75%' },
  { key: 'Tw IV', label: 'Triwulan IV', bulanDesc: 's.d. Akhir Desember', desc: 'Pegawai: 95% | Barang: 90% | Modal: 90% | Bansos: 95%' },
];

export interface SatkerBelanjaDetail {
  label: string;
  hasPagu: boolean;
  pagu: number;
  realisasi: number;
  sisaPagu: number;
  persen: number;
  targetPersen: number;
  gapPersen: number; // persen - targetPersen (positif = melampaui, negatif = di bawah target)
  status: 'MEMENUHI' | 'BELUM_MEMENUHI' | 'NO_PAGU';
  kekuranganNominal: number; // Nominal Rupiah yang harus segera direalisasikan untuk mencapai target
}

export interface EvaluatedSatkerRealisasi {
  id: string;
  no: number;
  kodeSatker: string;
  namaSatker: string;
  kementerianLembaga?: string;
  triwulan: TriwulanKey;
  targetRule: TargetTriwulanRule;
  
  pegawai: SatkerBelanjaDetail;
  barang: SatkerBelanjaDetail;
  modal: SatkerBelanjaDetail;
  bansos: SatkerBelanjaDetail;

  totalPagu: number;
  totalRealisasi: number;
  totalPersen: number;
  totalSisa: number;

  targetNominalTotal: number; // Nominal Rupiah target triwulanan total satker
  targetPersenLangsung: number; // Target persentase komposit/bobot satker langsung
  gapPersenLangsung: number; // Selisih totalPersen - targetPersenLangsung (+ surplus, - defisit)
  surplusNominal: number; // Kelebihan serapan jika sudah melampaui target

  paguCluster: 'JUMBO' | 'BESAR' | 'SEDANG' | 'KECIL';
  clusterLabel: string;
  priorityRisk: 'PRIORITAS_1_KRITIS' | 'PRIORITAS_2_MODERAT' | 'PERHATIAN_MODAL' | 'ON_TRACK_JUMBO' | 'AMAN';
  hasZeroRealization: boolean;
  zeroRealizationTypes: string[];
  maxNegativeGap: number;

  overallStatus: 'SESUAI' | 'BELUM_SESUAI' | 'NO_PAGU';
  allocatedTypesCount: number; // Jumlah jenis belanja yang memiliki pagu
  compliantTypesCount: number; // Jumlah jenis belanja yang memenuhi target
  belumMemenuhiList: { jenis: string; gap: number; kekuranganRp: number }[];
  totalKekuranganNominal: number;
}

export type PaguClusterType = 'ALL' | 'JUMBO' | 'BESAR' | 'SEDANG' | 'KECIL';
export type PriorityRiskType = 'ALL' | 'PRIORITAS_1_KRITIS' | 'PRIORITAS_2_MODERAT' | 'PERHATIAN_MODAL' | 'ZERO_REAL' | 'ON_TRACK_JUMBO' | 'AMAN';

export interface GroupedKLSummary {
  klName: string;
  totalSatker: number;
  totalPagu: number;
  totalRealisasi: number;
  persenRealisasi: number;
  satkerSesuaiCount: number;
  satkerBelumSesuaiCount: number;
  persenSesuai: number;
  totalKekuranganRp: number;
  hasModalIssue: boolean;
  satkers: EvaluatedSatkerRealisasi[];
}

export interface GroupedClusterSummary {
  clusterKey: 'JUMBO' | 'BESAR' | 'SEDANG' | 'KECIL';
  label: string;
  rangeDesc: string;
  badgeColor: string;
  totalSatker: number;
  totalPagu: number;
  totalRealisasi: number;
  persenRealisasi: number;
  satkerSesuaiCount: number;
  satkerBelumSesuaiCount: number;
  persenSesuai: number;
  totalKekuranganRp: number;
  satkers: EvaluatedSatkerRealisasi[];
}

export interface PillarSummary {
  label: string;
  pagu: number;
  realisasi: number;
  persen: number;
  targetPersen: number;
  statusKppn: 'MEMENUHI' | 'BELUM_MEMENUHI';
  satkerBerpaguCount: number;
  satkerMemenuhiCount: number;
  satkerBelumMemenuhiCount: number;
  totalKekuranganRp: number;
}

export interface SummaryRealisasiTriwulan {
  totalSatker: number;
  totalPagu: number;
  totalRealisasi: number;
  persenTotal: number;
  totalSisa: number;

  satkerSesuaiCount: number;
  satkerBelumSesuaiCount: number;
  satkerNoPaguCount: number;

  persenSesuai: number;
  persenBelumSesuai: number;

  totalKekuranganKppn: number;

  pegawai: PillarSummary;
  barang: PillarSummary;
  modal: PillarSummary;
  bansos: PillarSummary;
}

function calculateDetail(
  label: string,
  pagu: number,
  real: number,
  persenInput: number,
  targetPersen: number
): SatkerBelanjaDetail {
  const safePagu = Number(pagu) || 0;
  const safeReal = Number(real) || 0;
  const hasPagu = safePagu > 0;
  
  const persen = hasPagu
    ? (persenInput !== undefined && persenInput !== null && !isNaN(persenInput) && persenInput > 0
        ? Number(persenInput)
        : Math.min(100, Math.round((safeReal / safePagu) * 10000) / 100))
    : 0;

  const gapPersen = hasPagu ? Math.round((persen - targetPersen) * 100) / 100 : 0;
  const status: 'MEMENUHI' | 'BELUM_MEMENUHI' | 'NO_PAGU' = !hasPagu
    ? 'NO_PAGU'
    : persen >= targetPersen
    ? 'MEMENUHI'
    : 'BELUM_MEMENUHI';

  // Target nominal = safePagu * (targetPersen / 100)
  const targetNominal = hasPagu ? safePagu * (targetPersen / 100) : 0;
  const kekuranganNominal = status === 'BELUM_MEMENUHI' ? Math.max(0, targetNominal - safeReal) : 0;

  return {
    label,
    hasPagu,
    pagu: safePagu,
    realisasi: safeReal,
    sisaPagu: Math.max(0, safePagu - safeReal),
    persen,
    targetPersen,
    gapPersen,
    status,
    kekuranganNominal
  };
}

/**
 * Evaluasi satu record Satker terhadap target triwulanan
 */
export function evaluateSatkerTriwulan(
  s: MyIntressRecord,
  triwulan: TriwulanKey,
  customRules?: TargetTriwulanRule
): EvaluatedSatkerRealisasi {
  const rule = customRules || DEFAULT_TARGET_TRIWULAN[triwulan] || DEFAULT_TARGET_TRIWULAN['Tw III'];

  const pegawai = calculateDetail('Belanja Pegawai', s.paguPegawai, s.realPegawai, s.persenPegawai, rule.pegawai);
  const barang = calculateDetail('Belanja Barang', s.paguBarang, s.realBarang, s.persenBarang, rule.barang);
  const modal = calculateDetail('Belanja Modal', s.paguModal, s.realModal, s.persenModal, rule.modal);
  const bansos = calculateDetail('Belanja Bansos', s.paguBansos, s.realBansos, s.persenBansos, rule.bansos);

  const pillars = [pegawai, barang, modal, bansos];
  const allocatedPillars = pillars.filter(p => p.hasPagu);
  const allocatedTypesCount = allocatedPillars.length;
  const compliantTypesCount = allocatedPillars.filter(p => p.status === 'MEMENUHI').length;

  const belumMemenuhiList: { jenis: string; gap: number; kekuranganRp: number }[] = [];
  let totalKekuranganNominal = 0;

  allocatedPillars.forEach(p => {
    if (p.status === 'BELUM_MEMENUHI') {
      belumMemenuhiList.push({
        jenis: p.label,
        gap: p.gapPersen,
        kekuranganRp: p.kekuranganNominal
      });
      totalKekuranganNominal += p.kekuranganNominal;
    }
  });

  let overallStatus: 'SESUAI' | 'BELUM_SESUAI' | 'NO_PAGU' = 'SESUAI';
  if (allocatedTypesCount === 0) {
    overallStatus = 'NO_PAGU';
  } else if (belumMemenuhiList.length > 0) {
    overallStatus = 'BELUM_SESUAI';
  }

  const totalPagu = Number(s.paguTotal) || (pegawai.pagu + barang.pagu + modal.pagu + bansos.pagu);
  const totalReal = Number(s.realTotal) || (pegawai.realisasi + barang.realisasi + modal.realisasi + bansos.realisasi);
  const totalPersen = totalPagu > 0 
    ? (s.persenTotal !== undefined && s.persenTotal !== null ? Number(s.persenTotal) : Math.round((totalReal / totalPagu) * 10000) / 100)
    : 0;

  // Perhitungan Target Langsung (Nominal & Persentase Komposit Wajib)
  const targetPegawaiRp = pegawai.hasPagu ? Math.round((pegawai.pagu * rule.pegawai) / 100) : 0;
  const targetBarangRp = barang.hasPagu ? Math.round((barang.pagu * rule.barang) / 100) : 0;
  const targetModalRp = modal.hasPagu ? Math.round((modal.pagu * rule.modal) / 100) : 0;
  const targetBansosRp = bansos.hasPagu ? Math.round((bansos.pagu * rule.bansos) / 100) : 0;
  const targetNominalTotal = targetPegawaiRp + targetBarangRp + targetModalRp + targetBansosRp;
  const targetPersenLangsung = totalPagu > 0 ? Math.round((targetNominalTotal / totalPagu) * 10000) / 100 : 0;
  const gapPersenLangsung = Math.round((totalPersen - targetPersenLangsung) * 100) / 100;
  const surplusNominal = totalReal > targetNominalTotal ? Math.max(0, totalReal - targetNominalTotal) : 0;

  // Klasifikasi Klaster Pagu (DJPb Treasury scale)
  let paguCluster: 'JUMBO' | 'BESAR' | 'SEDANG' | 'KECIL' = 'SEDANG';
  let clusterLabel = 'Sedang (2M - 10M)';
  if (totalPagu >= 50_000_000_000) {
    paguCluster = 'JUMBO';
    clusterLabel = 'Jumbo (≥ 50M)';
  } else if (totalPagu >= 10_000_000_000) {
    paguCluster = 'BESAR';
    clusterLabel = 'Besar (10M - 50M)';
  } else if (totalPagu >= 2_000_000_000) {
    paguCluster = 'SEDANG';
    clusterLabel = 'Sedang (2M - 10M)';
  } else {
    paguCluster = 'KECIL';
    clusterLabel = 'Kecil (< 2M)';
  }

  // Deteksi akun berpagu yang 0% serapan (indikator pagu pasif/menganggur)
  const zeroRealizationTypes: string[] = [];
  allocatedPillars.forEach(p => {
    if (p.hasPagu && p.pagu > 0 && p.realisasi === 0) {
      zeroRealizationTypes.push(p.label);
    }
  });
  const hasZeroRealization = zeroRealizationTypes.length > 0;

  // Hitung deviasi negatif terbesar
  let maxNegativeGap = 0;
  belumMemenuhiList.forEach(b => {
    const absGap = Math.abs(b.gap);
    if (absGap > maxNegativeGap) {
      maxNegativeGap = absGap;
    }
  });

  // Klasifikasi Prioritas Intervensi KPPN (Kuadran Risiko Realisasi)
  let priorityRisk: 'PRIORITAS_1_KRITIS' | 'PRIORITAS_2_MODERAT' | 'PERHATIAN_MODAL' | 'ON_TRACK_JUMBO' | 'AMAN' = 'AMAN';
  if (overallStatus === 'BELUM_SESUAI') {
    if (paguCluster === 'JUMBO' || totalKekuranganNominal >= 1_000_000_000) {
      priorityRisk = 'PRIORITAS_1_KRITIS';
    } else if (modal.hasPagu && modal.status === 'BELUM_MEMENUHI') {
      priorityRisk = 'PERHATIAN_MODAL';
    } else {
      priorityRisk = 'PRIORITAS_2_MODERAT';
    }
  } else {
    if (paguCluster === 'JUMBO' || paguCluster === 'BESAR') {
      priorityRisk = 'ON_TRACK_JUMBO';
    } else {
      priorityRisk = 'AMAN';
    }
  }

  return {
    id: s.id || `satker_${s.kodeSatker}`,
    no: s.no || 0,
    kodeSatker: s.kodeSatker || '',
    namaSatker: s.namaSatker || 'Satker Tanpa Nama',
    kementerianLembaga: s.kementerianLembaga || s.namaKementerian || extractKLFromSatker(s.namaSatker),
    triwulan,
    targetRule: rule,
    pegawai,
    barang,
    modal,
    bansos,
    totalPagu,
    totalRealisasi: totalReal,
    totalPersen,
    totalSisa: Math.max(0, totalPagu - totalReal),
    targetNominalTotal,
    targetPersenLangsung,
    gapPersenLangsung,
    surplusNominal,
    paguCluster,
    clusterLabel,
    priorityRisk,
    hasZeroRealization,
    zeroRealizationTypes,
    maxNegativeGap,
    overallStatus,
    allocatedTypesCount,
    compliantTypesCount,
    belumMemenuhiList,
    totalKekuranganNominal
  };
}

/**
 * Agregasi perhitungan ringkasan kepatuhan seluruh Satker
 */
export function computeSummaryRealisasiTriwulan(
  evaluatedList: EvaluatedSatkerRealisasi[],
  triwulan: TriwulanKey,
  rule: TargetTriwulanRule
): SummaryRealisasiTriwulan {
  const totalSatker = evaluatedList.length;
  let totalPagu = 0;
  let totalRealisasi = 0;
  let satkerSesuaiCount = 0;
  let satkerBelumSesuaiCount = 0;
  let satkerNoPaguCount = 0;
  let totalKekuranganKppn = 0;

  let paguPeg = 0, realPeg = 0, berpaguPeg = 0, memPeg = 0, kekuranganPeg = 0;
  let paguBar = 0, realBar = 0, berpaguBar = 0, memBar = 0, kekuranganBar = 0;
  let paguMod = 0, realMod = 0, berpaguMod = 0, memMod = 0, kekuranganMod = 0;
  let paguBan = 0, realBan = 0, berpaguBan = 0, memBan = 0, kekuranganBan = 0;

  evaluatedList.forEach(s => {
    totalPagu += s.totalPagu;
    totalRealisasi += s.totalRealisasi;
    totalKekuranganKppn += s.totalKekuranganNominal;

    if (s.overallStatus === 'SESUAI') satkerSesuaiCount++;
    else if (s.overallStatus === 'BELUM_SESUAI') satkerBelumSesuaiCount++;
    else satkerNoPaguCount++;

    // Pegawai
    paguPeg += s.pegawai.pagu;
    realPeg += s.pegawai.realisasi;
    if (s.pegawai.hasPagu) {
      berpaguPeg++;
      if (s.pegawai.status === 'MEMENUHI') memPeg++;
      else kekuranganPeg += s.pegawai.kekuranganNominal;
    }

    // Barang
    paguBar += s.barang.pagu;
    realBar += s.barang.realisasi;
    if (s.barang.hasPagu) {
      berpaguBar++;
      if (s.barang.status === 'MEMENUHI') memBar++;
      else kekuranganBar += s.barang.kekuranganNominal;
    }

    // Modal
    paguMod += s.modal.pagu;
    realMod += s.modal.realisasi;
    if (s.modal.hasPagu) {
      berpaguMod++;
      if (s.modal.status === 'MEMENUHI') memMod++;
      else kekuranganMod += s.modal.kekuranganNominal;
    }

    // Bansos
    paguBan += s.bansos.pagu;
    realBan += s.bansos.realisasi;
    if (s.bansos.hasPagu) {
      berpaguBan++;
      if (s.bansos.status === 'MEMENUHI') memBan++;
      else kekuranganBan += s.bansos.kekuranganNominal;
    }
  });

  const persenTotal = totalPagu > 0 ? Math.round((totalRealisasi / totalPagu) * 10000) / 100 : 0;
  const persenPeg = paguPeg > 0 ? Math.round((realPeg / paguPeg) * 10000) / 100 : 0;
  const persenBar = paguBar > 0 ? Math.round((realBar / paguBar) * 10000) / 100 : 0;
  const persenMod = paguMod > 0 ? Math.round((realMod / paguMod) * 10000) / 100 : 0;
  const persenBan = paguBan > 0 ? Math.round((realBan / paguBan) * 10000) / 100 : 0;

  return {
    totalSatker,
    totalPagu,
    totalRealisasi,
    persenTotal,
    totalSisa: Math.max(0, totalPagu - totalRealisasi),
    satkerSesuaiCount,
    satkerBelumSesuaiCount,
    satkerNoPaguCount,
    persenSesuai: totalSatker > 0 ? Math.round((satkerSesuaiCount / totalSatker) * 1000) / 10 : 0,
    persenBelumSesuai: totalSatker > 0 ? Math.round((satkerBelumSesuaiCount / totalSatker) * 1000) / 10 : 0,
    totalKekuranganKppn,
    pegawai: {
      label: 'Belanja Pegawai',
      pagu: paguPeg,
      realisasi: realPeg,
      persen: persenPeg,
      targetPersen: rule.pegawai,
      statusKppn: persenPeg >= rule.pegawai ? 'MEMENUHI' : 'BELUM_MEMENUHI',
      satkerBerpaguCount: berpaguPeg,
      satkerMemenuhiCount: memPeg,
      satkerBelumMemenuhiCount: berpaguPeg - memPeg,
      totalKekuranganRp: kekuranganPeg
    },
    barang: {
      label: 'Belanja Barang',
      pagu: paguBar,
      realisasi: realBar,
      persen: persenBar,
      targetPersen: rule.barang,
      statusKppn: persenBar >= rule.barang ? 'MEMENUHI' : 'BELUM_MEMENUHI',
      satkerBerpaguCount: berpaguBar,
      satkerMemenuhiCount: memBar,
      satkerBelumMemenuhiCount: berpaguBar - memBar,
      totalKekuranganRp: kekuranganBar
    },
    modal: {
      label: 'Belanja Modal',
      pagu: paguMod,
      realisasi: realMod,
      persen: persenMod,
      targetPersen: rule.modal,
      statusKppn: persenMod >= rule.modal ? 'MEMENUHI' : 'BELUM_MEMENUHI',
      satkerBerpaguCount: berpaguMod,
      satkerMemenuhiCount: memMod,
      satkerBelumMemenuhiCount: berpaguMod - memMod,
      totalKekuranganRp: kekuranganMod
    },
    bansos: {
      label: 'Belanja Bansos',
      pagu: paguBan,
      realisasi: realBan,
      persen: persenBan,
      targetPersen: rule.bansos,
      statusKppn: persenBan >= rule.bansos ? 'MEMENUHI' : 'BELUM_MEMENUHI',
      satkerBerpaguCount: berpaguBan,
      satkerMemenuhiCount: memBan,
      satkerBelumMemenuhiCount: berpaguBan - memBan,
      totalKekuranganRp: kekuranganBan
    }
  };
}

export function formatRupiah(num: number): string {
  if (!num || isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
}

export function formatRupiahCompact(num: number): string {
  if (!num || isNaN(num)) return 'Rp 0';
  if (Math.abs(num) >= 1_000_000_000_000) {
    return `Rp ${(num / 1_000_000_000_000).toFixed(2)} T`;
  }
  if (Math.abs(num) >= 1_000_000_000) {
    return `Rp ${(num / 1_000_000_000).toFixed(2)} M`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toFixed(1)} Jt`;
  }
  return formatRupiah(num);
}

function extractKLFromSatker(namaSatker?: string): string {
  if (!namaSatker) return 'Kementerian / Lembaga';
  const upper = namaSatker.toUpperCase();
  if (upper.includes('POLRES') || upper.includes('POLRI') || upper.includes('AKPOL') || upper.includes('BRIMOB') || upper.includes('BHAYANGKARA') || upper.includes('DITPOLAIRUD')) {
    return 'Kepolisian Negara Republik Indonesia';
  }
  if (upper.includes('KODIM') || upper.includes('KOREM') || upper.includes('TNI') || upper.includes('DENPOM') || upper.includes('LANAL') || upper.includes('BEKANG')) {
    return 'Kementerian Pertahanan / TNI';
  }
  if (upper.includes('PENGADILAN')) {
    return 'Mahkamah Agung';
  }
  if (upper.includes('KEJAKSAAN')) {
    return 'Kejaksaan Republik Indonesia';
  }
  if (upper.includes('KEMENAG') || upper.includes('MADRASAH') || upper.includes('MTSN') || upper.includes('MAN ') || upper.includes('MIN ') || upper.includes('IAIN') || upper.includes('UIN')) {
    return 'Kementerian Agama';
  }
  if (upper.includes('BPS') || upper.includes('STATISTIK')) {
    return 'Badan Pusat Statistik';
  }
  if (upper.includes('KPU')) {
    return 'Komisi Pemilihan Umum';
  }
  if (upper.includes('BAWASLU')) {
    return 'Badan Pengawas Pemilihan Umum';
  }
  if (upper.includes('KUMHAM') || upper.includes('LAPAS') || upper.includes('RUTAN') || upper.includes('BAPAS') || upper.includes('IMIGRASI')) {
    return 'Kementerian Hukum dan HAM';
  }
  if (upper.includes('PERTANAHAN') || upper.includes('BPN') || upper.includes('AGRARIA')) {
    return 'Kementerian ATR/BPN';
  }
  if (upper.includes('BALAI') || upper.includes('BBWS') || upper.includes('BPJN')) {
    return 'Kementerian PUPR';
  }
  if (upper.includes('UNIVERSITAS') || upper.includes('POLITEKNIK') || upper.includes('LLDIKTI') || upper.includes('DIKBUD')) {
    return 'Kemendikbudristek';
  }
  if (upper.includes('KESEHATAN') || upper.includes('POLTEKKES') || upper.includes('BBPOM') || upper.includes('RSUP') || upper.includes('BALAI KESEHATAN')) {
    return 'Kementerian Kesehatan';
  }
  if (upper.includes('KEUANGAN') || upper.includes('PAJAK') || upper.includes('BEA CUKAI') || upper.includes('KPPN') || upper.includes('KPKNL')) {
    return 'Kementerian Keuangan';
  }
  return 'Kementerian / Lembaga Lainnya';
}

/**
 * Agregasi Pengelompokan Satker per Kementerian / Lembaga
 */
export function groupSatkersByKL(list: EvaluatedSatkerRealisasi[]): GroupedKLSummary[] {
  const map = new Map<string, EvaluatedSatkerRealisasi[]>();
  
  list.forEach(s => {
    const kl = s.kementerianLembaga || 'Kementerian / Lembaga Lainnya';
    if (!map.has(kl)) {
      map.set(kl, []);
    }
    map.get(kl)!.push(s);
  });

  const result: GroupedKLSummary[] = [];

  map.forEach((satkers, klName) => {
    let totalPagu = 0;
    let totalRealisasi = 0;
    let satkerSesuaiCount = 0;
    let satkerBelumSesuaiCount = 0;
    let totalKekuranganRp = 0;
    let hasModalIssue = false;

    satkers.forEach(s => {
      totalPagu += s.totalPagu;
      totalRealisasi += s.totalRealisasi;
      totalKekuranganRp += s.totalKekuranganNominal;
      if (s.overallStatus === 'SESUAI') {
        satkerSesuaiCount++;
      } else {
        satkerBelumSesuaiCount++;
      }
      if (s.modal.hasPagu && s.modal.status === 'BELUM_MEMENUHI') {
        hasModalIssue = true;
      }
    });

    const persenRealisasi = totalPagu > 0 ? Math.round((totalRealisasi / totalPagu) * 10000) / 100 : 0;
    const persenSesuai = satkers.length > 0 ? Math.round((satkerSesuaiCount / satkers.length) * 1000) / 10 : 0;

    result.push({
      klName,
      totalSatker: satkers.length,
      totalPagu,
      totalRealisasi,
      persenRealisasi,
      satkerSesuaiCount,
      satkerBelumSesuaiCount,
      persenSesuai,
      totalKekuranganRp,
      hasModalIssue,
      satkers: satkers.sort((a, b) => b.totalPagu - a.totalPagu)
    });
  });

  // Urutkan default: Pagu K/L terbesar ke terkecil
  return result.sort((a, b) => b.totalPagu - a.totalPagu);
}

/**
 * Agregasi Pengelompokan Satker per Klaster Skala Pagu
 */
export function groupSatkersByCluster(list: EvaluatedSatkerRealisasi[]): GroupedClusterSummary[] {
  const clusters: { key: 'JUMBO' | 'BESAR' | 'SEDANG' | 'KECIL'; label: string; rangeDesc: string; badgeColor: string }[] = [
    { key: 'JUMBO', label: 'Klaster Jumbo', rangeDesc: 'Pagu ≥ Rp 50 Miliar', badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30' },
    { key: 'BESAR', label: 'Klaster Besar', rangeDesc: 'Pagu Rp 10M - Rp 50M', badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30' },
    { key: 'SEDANG', label: 'Klaster Sedang', rangeDesc: 'Pagu Rp 2M - Rp 10M', badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30' },
    { key: 'KECIL', label: 'Klaster Kecil', rangeDesc: 'Pagu < Rp 2 Miliar', badgeColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30' }
  ];

  return clusters.map(c => {
    const satkers = list.filter(s => s.paguCluster === c.key).sort((a, b) => b.totalPagu - a.totalPagu);
    let totalPagu = 0;
    let totalRealisasi = 0;
    let satkerSesuaiCount = 0;
    let satkerBelumSesuaiCount = 0;
    let totalKekuranganRp = 0;

    satkers.forEach(s => {
      totalPagu += s.totalPagu;
      totalRealisasi += s.totalRealisasi;
      totalKekuranganRp += s.totalKekuranganNominal;
      if (s.overallStatus === 'SESUAI') satkerSesuaiCount++;
      else satkerBelumSesuaiCount++;
    });

    const persenRealisasi = totalPagu > 0 ? Math.round((totalRealisasi / totalPagu) * 10000) / 100 : 0;
    const persenSesuai = satkers.length > 0 ? Math.round((satkerSesuaiCount / satkers.length) * 1000) / 10 : 0;

    return {
      clusterKey: c.key,
      label: c.label,
      rangeDesc: c.rangeDesc,
      badgeColor: c.badgeColor,
      totalSatker: satkers.length,
      totalPagu,
      totalRealisasi,
      persenRealisasi,
      satkerSesuaiCount,
      satkerBelumSesuaiCount,
      persenSesuai,
      totalKekuranganRp,
      satkers
    };
  });
}

/**
 * Format teks ringkasan / briefing eksekutif siap salin untuk Pimpinan KPPN / WhatsApp MSKI
 */
export function generateBriefingText(
  list: EvaluatedSatkerRealisasi[],
  summary: SummaryRealisasiTriwulan,
  triwulan: TriwulanKey,
  posisiWaktu: string
): string {
  const kritisList = list.filter(s => s.priorityRisk === 'PRIORITAS_1_KRITIS');
  const modalList = list.filter(s => s.modal.hasPagu && s.modal.status === 'BELUM_MEMENUHI');
  const topDefisit = [...list].sort((a, b) => b.totalKekuranganNominal - a.totalKekuranganNominal).slice(0, 5);

  let text = `*MEMO MONITORING REALISASI ANGGARAN & TARGET ${triwulan.toUpperCase()}*\n`;
  text += `*KPPN SEMARANG I (My InTress)*\n`;
  text += `Posisi Data: ${posisiWaktu}\n\n`;
  text += `📊 *RINGKASAN KINERJA KPPN:*\n`;
  text += `• Total Pagu: ${formatRupiahCompact(summary.totalPagu)}\n`;
  text += `• Realisasi: ${formatRupiahCompact(summary.totalRealisasi)} (${summary.persenTotal}%)\n`;
  text += `• Kepatuhan Target: ${summary.satkerSesuaiCount} Sesuai (${summary.persenSesuai}%) | ${summary.satkerBelumSesuaiCount} Belum Sesuai (${summary.persenBelumSesuai}%)\n`;
  text += `• Estimasi Kekurangan Realisasi: ${formatRupiahCompact(summary.totalKekuranganKppn)}\n\n`;

  text += `🎯 *REALISASI PER JENIS BELANJA:*\n`;
  text += `• Pegawai: ${summary.pegawai.persen}% (Target: ${summary.pegawai.targetPersen}%) [${summary.pegawai.statusKppn === 'MEMENUHI' ? '✅ MEMENUHI' : '⚠️ DI BAWAH TARGET'}]\n`;
  text += `• Barang: ${summary.barang.persen}% (Target: ${summary.barang.targetPersen}%) [${summary.barang.statusKppn === 'MEMENUHI' ? '✅ MEMENUHI' : '⚠️ DI BAWAH TARGET'}]\n`;
  text += `• Modal: ${summary.modal.persen}% (Target: ${summary.modal.targetPersen}%) [${summary.modal.statusKppn === 'MEMENUHI' ? '✅ MEMENUHI' : '⚠️ DI BAWAH TARGET'}]\n`;
  text += `• Bansos: ${summary.bansos.persen}% (Target: ${summary.bansos.targetPersen}%) [${summary.bansos.statusKppn === 'MEMENUHI' ? '✅ MEMENUHI' : '⚠️ DI BAWAH TARGET'}]\n\n`;

  if (kritisList.length > 0) {
    text += `🚨 *TOP SATKER PRIORITAS INTERVENSI KRITIS (Pagu Besar & Belum Capai Target):*\n`;
    kritisList.slice(0, 5).forEach((s, i) => {
      text += `${i + 1}. [${s.kodeSatker}] ${s.namaSatker}\n   - Realisasi: ${s.totalPersen}% | Kekurangan: ${formatRupiahCompact(s.totalKekuranganNominal)}\n`;
    });
    text += `\n`;
  }

  if (modalList.length > 0) {
    text += `🏗️ *ATENSI BELANJA MODAL TERTINGGAL:*\n`;
    text += `Terdapat ${modalList.length} satker yang belum memenuhi target Belanja Modal (${summary.modal.targetPersen}%). Disarankan segera akselerasi SPM termin fisik/kontraktual.\n\n`;
  }

  text += `_Disusun otomatis oleh Dashboard Pemantauan Realisasi Anggaran My InTress KPPN Semarang I_`;

  return text;
}
