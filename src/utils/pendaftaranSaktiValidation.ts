import { PendaftaranUserSaktiDraft, UserSaktiRecord, ValidationIssue, PendaftaranValidationResult } from '../types';
import { MASTER_ROLE_MAP, isRoleBluOnly } from '../data/masterRoleSakti';

/**
 * Normalizes phone number into clean string (e.g. 081234567890)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+62')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Format NIP to standard Indonesian civil servant pattern (198501152010011002 -> 19850115 201001 1 002)
 */
export function formatNIPDisplay(nip: string): string {
  const digits = (nip || '').replace(/\D/g, '');
  if (digits.length === 18) {
    return `${digits.slice(0, 8)} ${digits.slice(8, 14)} ${digits.slice(14, 15)} ${digits.slice(15)}`;
  }
  return nip;
}

/**
 * Validate individual user record
 */
export function validateUserRecord(user: UserSaktiRecord, isBLU: boolean, existingNIPs: Map<string, string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const uName = user.namaLengkap?.trim() || `User #${user.id.slice(-4)}`;

  // 1. Nama
  if (!user.namaLengkap || user.namaLengkap.trim().length === 0) {
    issues.push({
      userId: user.id,
      field: 'namaLengkap',
      userName: uName,
      severity: 'ERROR',
      message: 'Nama lengkap wajib diisi.'
    });
  }

  // 2. NIP (18 digit angka)
  const cleanNIP = (user.nip || '').replace(/\D/g, '');
  if (!cleanNIP) {
    issues.push({
      userId: user.id,
      field: 'nip',
      userName: uName,
      severity: 'ERROR',
      message: 'NIP wajib diisi.'
    });
  } else if (cleanNIP.length !== 18) {
    issues.push({
      userId: user.id,
      field: 'nip',
      userName: uName,
      severity: 'ERROR',
      message: `NIP harus terdiri dari 18 digit angka (saat ini ${cleanNIP.length} digit).`
    });
  } else {
    // Duplicate check
    if (existingNIPs.has(cleanNIP) && existingNIPs.get(cleanNIP) !== user.id) {
      issues.push({
        userId: user.id,
        field: 'nip',
        userName: uName,
        severity: 'ERROR',
        message: `NIP "${cleanNIP}" terduplikasi dengan pengguna lain dalam formulir.`
      });
    }
  }

  // 3. NIK (Wajib diisi 16 digit angka KTP)
  const cleanNIK = (user.nik || '').replace(/\D/g, '');
  if (!cleanNIK) {
    issues.push({
      userId: user.id,
      field: 'nik',
      userName: uName,
      severity: 'ERROR',
      message: 'NIK wajib diisi (16 digit angka KTP).'
    });
  } else if (cleanNIK.length !== 16) {
    issues.push({
      userId: user.id,
      field: 'nik',
      userName: uName,
      severity: 'ERROR',
      message: `NIK harus terdiri dari 16 digit angka (saat ini ${cleanNIK.length} digit).`
    });
  }

  // 4. NPWP (Wajib diisi 15 atau 16 digit angka tanpa simbol)
  const cleanNPWP = (user.npwp || '').replace(/\D/g, '');
  if (!cleanNPWP) {
    issues.push({
      userId: user.id,
      field: 'npwp',
      userName: uName,
      severity: 'ERROR',
      message: 'NPWP wajib diisi (15 atau 16 digit angka tanpa pemisah simbol).'
    });
  } else if (cleanNPWP.length !== 15 && cleanNPWP.length !== 16) {
    issues.push({
      userId: user.id,
      field: 'npwp',
      userName: uName,
      severity: 'ERROR',
      message: `Format NPWP harus 15 atau 16 digit angka tanpa simbol (saat ini ${cleanNPWP.length} digit).`
    });
  }

  // 5. Email (valid format)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!user.email || !user.email.trim()) {
    issues.push({
      userId: user.id,
      field: 'email',
      userName: uName,
      severity: 'ERROR',
      message: 'Alamat e-mail aktif wajib diisi.'
    });
  } else if (!emailRegex.test(user.email.trim())) {
    issues.push({
      userId: user.id,
      field: 'email',
      userName: uName,
      severity: 'ERROR',
      message: 'Format e-mail tidak valid.'
    });
  }

  // 6. No. HP (Indonesian valid number: 08xx / 628xx, min 9 digits, max 15)
  const normPhone = normalizePhoneNumber(user.noHp || '');
  if (!normPhone) {
    issues.push({
      userId: user.id,
      field: 'noHp',
      userName: uName,
      severity: 'ERROR',
      message: 'Nomor Handphone (WhatsApp) wajib diisi.'
    });
  } else if (!/^08\d{8,13}$/.test(normPhone)) {
    issues.push({
      userId: user.id,
      field: 'noHp',
      userName: uName,
      severity: 'ERROR',
      message: 'Nomor HP tidak valid (gunakan format Indonesia, contoh: 081234567890).'
    });
  }

  // 7. Nomor SK
  if (!user.nomorSk || !user.nomorSk.trim()) {
    issues.push({
      userId: user.id,
      field: 'nomorSk',
      userName: uName,
      severity: 'ERROR',
      message: 'Nomor SK penunjukan pejabat/operator wajib diisi.'
    });
  }

  // 8. Tanggal SK
  if (!user.tanggalSk || !user.tanggalSk.trim()) {
    issues.push({
      userId: user.id,
      field: 'tanggalSk',
      userName: uName,
      severity: 'ERROR',
      message: 'Tanggal SK wajib diisi.'
    });
  }

  // 9. Pangkat / Golongan
  if (!user.pangkatGolongan || !user.pangkatGolongan.trim()) {
    issues.push({
      userId: user.id,
      field: 'pangkatGolongan',
      userName: uName,
      severity: 'WARNING',
      message: 'Pangkat/Golongan belum diisi. Diperlukan untuk lampiran SK Penetapan User SAKTI.'
    });
  }

  // 10. Jabatan Dinas
  if (!user.jabatan || !user.jabatan.trim()) {
    issues.push({
      userId: user.id,
      field: 'jabatan',
      userName: uName,
      severity: 'WARNING',
      message: 'Jabatan kedinasan satker belum diisi.'
    });
  }

  // 11. Peran Jabatan (Approval / Validator / Operator / Admin)
  if (!user.peranJabatan) {
    issues.push({
      userId: user.id,
      field: 'peranJabatan',
      userName: uName,
      severity: 'WARNING',
      message: 'Peran Jabatan (Approval / Validator / Operator / Admin) belum ditentukan.'
    });
  }

  // 12. Jabatan Perbendaharaan
  if (!user.jabatanPerbendaharaan || !user.jabatanPerbendaharaan.trim()) {
    issues.push({
      userId: user.id,
      field: 'jabatanPerbendaharaan',
      userName: uName,
      severity: 'WARNING',
      message: 'Jabatan Perbendaharaan belum diisi.'
    });
  }

  // 13. Role (minimal 1, harus dari master reference)
  if (!user.roles || user.roles.length === 0) {
    issues.push({
      userId: user.id,
      field: 'roles',
      userName: uName,
      severity: 'ERROR',
      message: 'Pengguna harus memiliki minimal 1 (satu) role SAKTI.'
    });
  } else {
    for (const roleCode of user.roles) {
      if (!MASTER_ROLE_MAP.has(roleCode)) {
        issues.push({
          userId: user.id,
          field: 'roles',
          userName: uName,
          severity: 'ERROR',
          message: `Role "${roleCode}" tidak terdaftar dalam referensi resmi SAKTI.`
        });
      }
      // Check BLU restriction
      if (!isBLU && isRoleBluOnly(roleCode)) {
        issues.push({
          userId: user.id,
          field: 'roles',
          userName: uName,
          severity: 'ERROR',
          message: `Role "${roleCode}" hanya diperuntukkan bagi Satker BLU. Nonaktifkan atau ubah Satker menjadi BLU.`
        });
      }
    }
  }

  return issues;
}

/**
 * Validates the entire registration draft
 */
export function validatePendaftaranDraft(draft: PendaftaranUserSaktiDraft): PendaftaranValidationResult {
  const allIssues: ValidationIssue[] = [];

  // Satker Information Validation
  if (!draft.kodeSatker || draft.kodeSatker.trim().length === 0) {
    allIssues.push({
      severity: 'ERROR',
      message: 'Kode Satker tidak boleh kosong.'
    });
  } else if (!/^\d{6}$/.test(draft.kodeSatker.trim())) {
    allIssues.push({
      severity: 'ERROR',
      message: `Kode Satker harus 6 digit angka (saat ini: "${draft.kodeSatker}").`
    });
  }

  if (!draft.namaSatker || draft.namaSatker.trim().length === 0) {
    allIssues.push({
      severity: 'ERROR',
      message: 'Nama Satker wajib tersedia.'
    });
  }

  if (!draft.levelSatker || draft.levelSatker.trim().length === 0) {
    allIssues.push({
      severity: 'ERROR',
      message: 'Level Satker wajib dipilih dari daftar referensi.'
    });
  }

  // User Count Check
  if (!draft.users || draft.users.length === 0) {
    allIssues.push({
      severity: 'ERROR',
      message: 'Formulir belum memiliki pengguna. Tambahkan minimal 1 (satu) data pengguna.'
    });
    return {
      isValid: false,
      totalUsers: 0,
      totalRoles: 0,
      issues: allIssues
    };
  }

  // Pre-index NIPs for duplicate detection
  const nipMap = new Map<string, string>();
  draft.users.forEach((u) => {
    const cNIP = (u.nip || '').replace(/\D/g, '');
    if (cNIP && cNIP.length === 18 && !nipMap.has(cNIP)) {
      nipMap.set(cNIP, u.id);
    }
  });

  let totalRolesCount = 0;

  // Validate each user
  draft.users.forEach((user) => {
    totalRolesCount += (user.roles || []).length;
    const userIssues = validateUserRecord(user, draft.isBLU, nipMap);
    allIssues.push(...userIssues);
  });

  const errorCount = allIssues.filter(i => i.severity === 'ERROR').length;

  return {
    isValid: errorCount === 0,
    totalUsers: draft.users.length,
    totalRoles: totalRolesCount,
    issues: allIssues
  };
}
