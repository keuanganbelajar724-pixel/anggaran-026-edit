export interface MasterRoleSakti {
  roleCode: string;
  roleName: string;
  description: string;
  category: RoleCategory;
  active: boolean;
  specialRequirement?: 'BLU_ONLY' | 'NONE';
  smartWarning?: string;
  orderIndex: number;
}

export type RoleCategory = 
  | 'KPA / PPK / PPSPM'
  | 'ADMIN'
  | 'ANGGARAN'
  | 'PEMBAYARAN'
  | 'KOMITMEN'
  | 'BENDAHARA'
  | 'PNBP'
  | 'PELAPORAN'
  | 'PERSEDIAAN'
  | 'ASET'
  | 'PIUTANG'
  | 'BLU';

export const MASTER_ROLE_SAKTI_LIST: MasterRoleSakti[] = [
  {
    roleCode: 'SATKER_KPA',
    roleName: 'Kuasa Pengguna Anggaran (KPA)',
    description: 'Kelompok Pengguna Untuk KPA',
    category: 'KPA / PPK / PPSPM',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 1
  },
  {
    roleCode: 'SATKER_PPK',
    roleName: 'Pejabat Pembuat Komitmen (PPK)',
    description: 'Kelompok Pengguna Untuk PPK',
    category: 'KPA / PPK / PPSPM',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 2
  },
  {
    roleCode: 'SATKER_PPK_DFDD',
    roleName: 'PPK DAK Fisik & Dana Desa',
    description: 'Kelompok Pengguna Untuk PPK Penyalur DAK Fisik dan Dana Desa',
    category: 'KPA / PPK / PPSPM',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 3
  },
  {
    roleCode: 'SATKER_PPSPM',
    roleName: 'Pejabat Penandatangan SPM (PPSPM)',
    description: 'Kelompok Pengguna Untuk PPSPM',
    category: 'KPA / PPK / PPSPM',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 4
  },
  {
    roleCode: 'SATKER_ADMIN',
    roleName: 'Admin Satker',
    description: 'Kelompok Pengguna Untuk ADMIN SATKER',
    category: 'ADMIN',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 5
  },
  {
    roleCode: 'SATKER_OPERATOR_ANGGARAN',
    roleName: 'Operator Anggaran',
    description: 'Kelompok Pengguna Untuk Operator Anggaran Satker',
    category: 'ANGGARAN',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 6
  },
  {
    roleCode: 'SATKER_VALIDATOR_ANGGARAN',
    roleName: 'Validator Anggaran (BLU)',
    description: 'Kelompok Pengguna Untuk Validator Anggaran Satker BLU (KHUSUS SATKER BLU)',
    category: 'BLU',
    active: true,
    specialRequirement: 'BLU_ONLY',
    smartWarning: 'Role ini khusus untuk Satker BLU (Badan Layanan Umum).',
    orderIndex: 7
  },
  {
    roleCode: 'SATKER_OPERATOR_PEMBAYARAN',
    roleName: 'Operator Pembayaran (SPP & SPM)',
    description: 'Bagi yang ingin memiliki akses sebagai operator pembayaran SPP dan SPM',
    category: 'PEMBAYARAN',
    active: true,
    specialRequirement: 'NONE',
    smartWarning: 'Role ini memberikan akses operator pembayaran SPP dan SPM.',
    orderIndex: 8
  },
  {
    roleCode: 'SATKER_OPERATOR_PEMBAYARAN_SPM',
    roleName: 'Operator Pembayaran SPM Saja',
    description: 'Bagi yang ingin memiliki akses sebagai operator SPM saja',
    category: 'PEMBAYARAN',
    active: true,
    specialRequirement: 'NONE',
    smartWarning: 'Role ini khusus operator SPM saja.',
    orderIndex: 9
  },
  {
    roleCode: 'SATKER_OPERATOR_PEMBAYARAN_SPP',
    roleName: 'Operator Pembayaran SPP Saja',
    description: 'Bagi yang ingin memiliki akses sebagai operator SPP saja',
    category: 'PEMBAYARAN',
    active: true,
    specialRequirement: 'NONE',
    smartWarning: 'Role ini khusus operator SPP saja.',
    orderIndex: 10
  },
  {
    roleCode: 'SATKER_OPERATOR_KOMITMEN',
    roleName: 'Operator Komitmen',
    description: 'Kelompok Pengguna Untuk Operator Komitmen Satker',
    category: 'KOMITMEN',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 11
  },
  {
    roleCode: 'SATKER_BENDAHARA_PENGELUARAN',
    roleName: 'Bendahara Pengeluaran',
    description: 'Kelompok Pengguna Untuk Bendahara Pengeluaran Satker',
    category: 'BENDAHARA',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 12
  },
  {
    roleCode: 'SATKER_BENDAHARA_PENGELUARAN_PEMBANTU',
    roleName: 'Bendahara Pengeluaran Pembantu (BPP)',
    description: 'Kelompok Pengguna Untuk Bendahara Pengeluaran Pembantu Satker',
    category: 'BENDAHARA',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 13
  },
  {
    roleCode: 'SATKER_BENDAHARA_PENERIMAAN',
    roleName: 'Bendahara Penerimaan',
    description: 'Kelompok Pengguna Untuk Bendahara Penerimaan Satker',
    category: 'BENDAHARA',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 14
  },
  {
    roleCode: 'SATKER_OPERATOR_PNBP',
    roleName: 'Operator PNBP',
    description: 'Kelompok Pengguna Untuk Pengelola PNBP Satker',
    category: 'PNBP',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 15
  },
  {
    roleCode: 'SATKER_OPERATOR_PELAPORAN',
    roleName: 'Operator Pelaporan (GLP)',
    description: 'Kelompok Pengguna Untuk Operator General Ledger dan Pelaporan Satker',
    category: 'PELAPORAN',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 16
  },
  {
    roleCode: 'SATKER_OPERATOR_PERSEDIAAN',
    roleName: 'Operator Persediaan',
    description: 'Kelompok Pengguna Untuk Operator Persediaan Satker',
    category: 'PERSEDIAAN',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 17
  },
  {
    roleCode: 'SATKER_OPERATOR_PERSEDIAAN_PEMBANTU',
    roleName: 'Operator Persediaan Pembantu',
    description: 'Kelompok Pengguna Untuk Operator Persediaan Pembantu Satker',
    category: 'PERSEDIAAN',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 18
  },
  {
    roleCode: 'SATKER_APPROVER_PERSEDIAAN',
    roleName: 'Approver Persediaan',
    description: 'Kelompok Pengguna Untuk Approver Persediaan Satker',
    category: 'PERSEDIAAN',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 19
  },
  {
    roleCode: 'SATKER_APPROVER_PERSEDIAAN_PEMBANTU',
    roleName: 'Approver Persediaan Pembantu',
    description: 'Kelompok Pengguna Untuk Approver Persediaan Pembantu Satker',
    category: 'PERSEDIAAN',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 20
  },
  {
    roleCode: 'SATKER_OPERATOR_ASET',
    roleName: 'Operator Aset',
    description: 'Kelompok Pengguna Untuk Operator Aset Satker',
    category: 'ASET',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 21
  },
  {
    roleCode: 'SATKER_OPERATOR_ASET_PEMBANTU',
    roleName: 'Operator Aset Pembantu (UAPKPB)',
    description: 'Kelompok Pengguna Untuk Operator Aset Pembantu Satker (UAPKPB)',
    category: 'ASET',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 22
  },
  {
    roleCode: 'SATKER_VALIDATOR_ASET',
    roleName: 'Validator Aset',
    description: 'Kelompok Pengguna Untuk Validator Aset Satker',
    category: 'ASET',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 23
  },
  {
    roleCode: 'SATKER_VALIDATOR_ASET_PEMBANTU',
    roleName: 'Validator Aset Pembantu (UAPKPB)',
    description: 'Kelompok Pengguna Untuk Validator Aset Pembantu Satker (UAPKPB)',
    category: 'ASET',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 24
  },
  {
    roleCode: 'SATKER_APPROVER_ASET',
    roleName: 'Approver Aset',
    description: 'Kelompok Pengguna Untuk Approver Aset Satker',
    category: 'ASET',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 25
  },
  {
    roleCode: 'SATKER_APPROVER_ASET_PEMBANTU',
    roleName: 'Approver Aset Pembantu (UAPKPB)',
    description: 'Kelompok Pengguna Untuk Approver Aset Pembantu Satker (UAPKPB)',
    category: 'ASET',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 26
  },
  {
    roleCode: 'SATKER_OPERATOR_PIUTANG',
    roleName: 'Operator Piutang',
    description: 'Kelompok Pengguna Untuk Operator Piutang Satker',
    category: 'PIUTANG',
    active: true,
    specialRequirement: 'NONE',
    orderIndex: 27
  },
  {
    roleCode: 'SATKER_OPERATOR_SPI',
    roleName: 'Operator SPI (BLU)',
    description: 'Kelompok Pengguna Untuk Operator Satuan Pengawas Internal (KHUSUS SATKER BLU)',
    category: 'BLU',
    active: true,
    specialRequirement: 'BLU_ONLY',
    smartWarning: 'Role ini khusus untuk Satker BLU (Badan Layanan Umum).',
    orderIndex: 28
  }
];

// Legacy/short role code aliases to canonical official master role codes
export const ROLE_ALIAS_MAP: Record<string, string> = {
  'ADM': 'SATKER_ADMIN',
  'ADMIN': 'SATKER_ADMIN',
  'KPA': 'SATKER_KPA',
  'PPK': 'SATKER_PPK',
  'PPSPM': 'SATKER_PPSPM',
  'KOM': 'SATKER_OPERATOR_KOMITMEN',
  'BYR': 'SATKER_OPERATOR_PEMBAYARAN',
  'BNG': 'SATKER_BENDAHARA_PENGELUARAN',
  'BENDAHARA': 'SATKER_BENDAHARA_PENGELUARAN',
  'GAJI': 'SATKER_OPERATOR_GAJI',
  'GLP': 'SATKER_OPERATOR_GLP',
  'ANGGARAN': 'SATKER_OPERATOR_ANGGARAN',
  'ASET': 'SATKER_OPERATOR_ASET',
  'PERSEDIAAN': 'SATKER_OPERATOR_PERSEDIAAN',
  'PIUTANG': 'SATKER_OPERATOR_PIUTANG',
  'PNBP': 'SATKER_OPERATOR_PNBP',
};

/**
 * Normalizes raw or legacy role codes to canonical master role codes.
 */
export function normalizeRoleCode(rawCode: string): string {
  if (!rawCode) return '';
  const trimmed = rawCode.trim();
  if (MASTER_ROLE_SAKTI_LIST.some(r => r.roleCode === trimmed)) return trimmed;
  const upper = trimmed.toUpperCase();
  if (ROLE_ALIAS_MAP[upper]) return ROLE_ALIAS_MAP[upper];
  const found = MASTER_ROLE_SAKTI_LIST.find(r => r.roleCode.toUpperCase() === upper);
  if (found) return found.roleCode;
  return trimmed;
}

// Master lookup map for fast O(1) query (includes canonical codes and common aliases)
export const MASTER_ROLE_MAP = new Map<string, MasterRoleSakti>();
MASTER_ROLE_SAKTI_LIST.forEach(r => {
  MASTER_ROLE_MAP.set(r.roleCode, r);
});
Object.entries(ROLE_ALIAS_MAP).forEach(([alias, targetCode]) => {
  const target = MASTER_ROLE_MAP.get(targetCode);
  if (target && !MASTER_ROLE_MAP.has(alias)) {
    MASTER_ROLE_MAP.set(alias, target);
  }
});

// Level Satker official reference options
export const LEVEL_SATKER_OPTIONS = [
  { value: 'Satker Daerah (KD)', label: 'Satker Daerah (KD)' },
  { value: 'Satker Pusat (KP)', label: 'Satker Pusat (KP)' },
  { value: 'Dekonsentrasi (DK)', label: 'Dekonsentrasi (DK)' },
  { value: 'Tugas Pembantuan (TP)', label: 'Tugas Pembantuan (TP)' },
  { value: 'Badan Layanan Umum (BLU)', label: 'Badan Layanan Umum (BLU)' },
  { value: 'Urusan Bersama (UB)', label: 'Urusan Bersama (UB)' }
];

/**
 * Sort roles strictly according to official master reference order
 */
export function sortRolesByMasterOrder(roleCodes: string[]): string[] {
  if (!roleCodes || !Array.isArray(roleCodes)) return [];
  // Normalize each code so aliases like ADM become SATKER_ADMIN and deduplicate
  const normalized = roleCodes.map(r => normalizeRoleCode(r) || r).filter(Boolean);
  const uniqueCodes = Array.from(new Set(normalized));
  return uniqueCodes.sort((a, b) => {
    const orderA = MASTER_ROLE_MAP.get(a)?.orderIndex ?? 999;
    const orderB = MASTER_ROLE_MAP.get(b)?.orderIndex ?? 999;
    return orderA - orderB;
  });
}

/**
 * Formats roles array into the exact comma-separated string required by Excel template
 * Example: SATKER_OPERATOR_PEMBAYARAN, SATKER_OPERATOR_KOMITMEN, SATKER_OPERATOR_PELAPORAN
 */
export function formatRolesForExcel(roleCodes: string[]): string {
  const sorted = sortRolesByMasterOrder(roleCodes);
  return sorted.join(', ');
}

/**
 * Check if a role is BLU-only
 */
export function isRoleBluOnly(roleCode: string): boolean {
  const role = MASTER_ROLE_MAP.get(roleCode);
  return role?.specialRequirement === 'BLU_ONLY';
}

/**
 * Categories list in logical order for UI grouping
 */
export const ROLE_CATEGORIES: RoleCategory[] = [
  'KPA / PPK / PPSPM',
  'ADMIN',
  'ANGGARAN',
  'PEMBAYARAN',
  'KOMITMEN',
  'BENDAHARA',
  'PNBP',
  'PELAPORAN',
  'PERSEDIAAN',
  'ASET',
  'PIUTANG',
  'BLU'
];

/**
 * 4 Peran Jabatan Resmi SAKTI (Approval, Validator, Operator, Admin)
 * Sesuai template resmi Satker Kemenkeu
 */
export const PERAN_JABATAN_OPTIONS = [
  'Approval',
  'Validator',
  'Operator',
  'Admin'
] as const;

export type PeranJabatanSakti = typeof PERAN_JABATAN_OPTIONS[number];

/**
 * Daftar Jabatan Perbendaharaan SAKTI Tingkat Satuan Kerja
 */
export const DEFAULT_JABATAN_PERBENDAHARAAN_OPTIONS = [
  'Kuasa Pengguna Anggaran (KPA)',
  'Pejabat Pembuat Komitmen (PPK)',
  'Pejabat Penandatangan SPM (PPSPM)',
  'Bendahara Pengeluaran',
  'Bendahara Penerimaan',
  'Bendahara Pengeluaran Pembantu',
  'Operator Anggaran',
  'Operator Komitmen',
  'Operator Pembayaran',
  'Operator Bendahara',
  'Operator Aset / BMN',
  'Operator Persediaan',
  'Operator Pelaporan / GLP',
  'Administrator SAKTI',
  'Pengelola Kepegawaian',
  'Pejabat Pengadaan'
] as const;

/**
 * Membantu merekomendasikan Peran Jabatan & Jabatan Perbendaharaan awal
 * secara cerdas tanpa mencampuradukkan antara Role Akses Sistem dengan Jabatan.
 */
export function inferPeranAndJabatanFromRoles(roleCodes: string[]): {
  peranJabatan: PeranJabatanSakti;
  jabatanPerbendaharaan: string;
} {
  const codes = new Set(roleCodes || []);
  if (codes.has('SATKER_KPA')) {
    return { peranJabatan: 'Approval', jabatanPerbendaharaan: 'Kuasa Pengguna Anggaran (KPA)' };
  }
  if (codes.has('SATKER_PPK') || codes.has('SATKER_PPK_DFDD')) {
    return { peranJabatan: 'Approval', jabatanPerbendaharaan: 'Pejabat Pembuat Komitmen (PPK)' };
  }
  if (codes.has('SATKER_PPSPM')) {
    return { peranJabatan: 'Validator', jabatanPerbendaharaan: 'Pejabat Penandatangan SPM (PPSPM)' };
  }
  if (codes.has('SATKER_ADMIN')) {
    return { peranJabatan: 'Admin', jabatanPerbendaharaan: 'Administrator SAKTI' };
  }
  if (codes.has('SATKER_BENDAHARA_PENGELUARAN') || codes.has('SATKER_BENDAHARA_PENGELUARAN_PEMBANTU')) {
    return { peranJabatan: 'Operator', jabatanPerbendaharaan: 'Bendahara Pengeluaran' };
  }
  if (codes.has('SATKER_BENDAHARA_PENERIMAAN')) {
    return { peranJabatan: 'Operator', jabatanPerbendaharaan: 'Bendahara Penerimaan' };
  }
  if (codes.has('SATKER_VALIDATOR_ANGGARAN')) {
    return { peranJabatan: 'Validator', jabatanPerbendaharaan: 'Operator Anggaran' };
  }
  if (codes.has('SATKER_OPERATOR_ANGGARAN')) {
    return { peranJabatan: 'Operator', jabatanPerbendaharaan: 'Operator Anggaran' };
  }
  if (codes.has('SATKER_OPERATOR_KOMITMEN')) {
    return { peranJabatan: 'Operator', jabatanPerbendaharaan: 'Operator Komitmen' };
  }
  if (codes.has('SATKER_OPERATOR_PEMBAYARAN')) {
    return { peranJabatan: 'Operator', jabatanPerbendaharaan: 'Operator Pembayaran' };
  }
  if (codes.has('SATKER_OPERATOR_ASET')) {
    return { peranJabatan: 'Operator', jabatanPerbendaharaan: 'Operator Aset / BMN' };
  }
  if (codes.has('SATKER_OPERATOR_PERSEDIAAN')) {
    return { peranJabatan: 'Operator', jabatanPerbendaharaan: 'Operator Persediaan' };
  }
  if (codes.has('SATKER_OPERATOR_GLP')) {
    return { peranJabatan: 'Operator', jabatanPerbendaharaan: 'Operator Pelaporan / GLP' };
  }
  return { peranJabatan: 'Operator', jabatanPerbendaharaan: 'Operator Anggaran' };
}

