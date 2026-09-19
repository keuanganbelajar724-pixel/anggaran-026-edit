import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Check, 
  AlertTriangle, 
  Search, 
  ShieldCheck, 
  Info, 
  UserCheck, 
  FileText, 
  Phone, 
  Mail, 
  CreditCard, 
  Calendar,
  AlertCircle,
  Briefcase,
  Award,
  Layers
} from 'lucide-react';
import { UserSaktiRecord, PeranJabatanSakti } from '../../types';
import { 
  MASTER_ROLE_SAKTI_LIST, 
  ROLE_CATEGORIES, 
  RoleCategory, 
  formatRolesForExcel,
  sortRolesByMasterOrder,
  MASTER_ROLE_MAP,
  PERAN_JABATAN_OPTIONS,
  DEFAULT_JABATAN_PERBENDAHARAAN_OPTIONS,
  inferPeranAndJabatanFromRoles,
  normalizeRoleCode
} from '../../data/masterRoleSakti';
import { normalizePhoneNumber, formatNIPDisplay } from '../../utils/pendaftaranSaktiValidation';

interface UserSaktiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: UserSaktiRecord) => void;
  initialData?: UserSaktiRecord | null;
  isBLU: boolean;
  existingUsers: UserSaktiRecord[];
}

export const UserSaktiModal: React.FC<UserSaktiModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isBLU,
  existingUsers
}) => {
  const [formData, setFormData] = useState<UserSaktiRecord>({
    id: '',
    namaLengkap: '',
    nip: '',
    pangkatGolongan: '',
    jabatan: '',
    npwp: '',
    nik: '',
    email: '',
    noHp: '',
    roles: [],
    peranJabatan: 'Operator',
    jabatanPerbendaharaan: 'Operator Anggaran',
    nomorSk: '',
    tanggalSk: '',
    keterangan: ''
  });

  const [customJabatanPerbendaharaan, setCustomJabatanPerbendaharaan] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (initialData) {
      const isCustomPerb = !!initialData.jabatanPerbendaharaan && 
        !DEFAULT_JABATAN_PERBENDAHARAAN_OPTIONS.includes(initialData.jabatanPerbendaharaan as any);
      setCustomJabatanPerbendaharaan(isCustomPerb);
      setFormData({
        ...initialData,
        pangkatGolongan: initialData.pangkatGolongan || '',
        jabatan: initialData.jabatan || '',
        peranJabatan: initialData.peranJabatan || 'Operator',
        jabatanPerbendaharaan: initialData.jabatanPerbendaharaan || 'Operator Anggaran',
        roles: initialData.roles || []
      });
    } else {
      // Default new user with today's date for SK
      const today = new Date().toISOString().split('T')[0];
      setCustomJabatanPerbendaharaan(false);
      setFormData({
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        namaLengkap: '',
        nip: '',
        pangkatGolongan: '',
        jabatan: '',
        npwp: '',
        nik: '',
        email: '',
        noHp: '',
        roles: [],
        peranJabatan: 'Operator',
        jabatanPerbendaharaan: 'Operator Anggaran',
        nomorSk: '',
        tanggalSk: today,
        keterangan: ''
      });
    }
    setRoleSearch('');
    setSelectedCategory('ALL');
    setDuplicateWarning(null);
    setSubmitAttempted(false);
  }, [initialData, isOpen]);

  // Check duplicate NIP against other users
  const handleNIPChange = (rawNIP: string) => {
    const cleanDigits = rawNIP.replace(/\D/g, '').slice(0, 18);
    setFormData(prev => ({ ...prev, nip: cleanDigits }));

    if (cleanDigits.length === 18) {
      const duplicate = existingUsers.find(u => 
        u.id !== formData.id && (u.nip || '').replace(/\D/g, '') === cleanDigits
      );
      if (duplicate) {
        setDuplicateWarning(`Perhatian: NIP ${cleanDigits} sudah terdaftar atas nama "${duplicate.namaLengkap}". Mohon pastikan bukan pengguna ganda.`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  // Dedicated Remove Role handler (always succeeds, even for aliases or legacy codes)
  const handleRemoveRole = (roleCode: string) => {
    const normalizedCode = normalizeRoleCode(roleCode) || roleCode;
    setFormData(prev => {
      const currentRoles = prev.roles || [];
      const nextRoles = currentRoles.filter(
        r => r !== roleCode && r !== normalizedCode && normalizeRoleCode(r) !== normalizedCode
      );
      return {
        ...prev,
        roles: nextRoles
      };
    });
  };

  // Toggle role selection with smart suggestion for Peran Jabatan & Jabatan Perbendaharaan
  const handleToggleRole = (roleCode: string) => {
    const normalizedCode = normalizeRoleCode(roleCode) || roleCode;
    const currentRoles = formData.roles || [];
    const isSelected = currentRoles.some(
      r => r === roleCode || r === normalizedCode || normalizeRoleCode(r) === normalizedCode
    );

    // If currently selected, clicking removes it directly and reliably
    if (isSelected) {
      handleRemoveRole(roleCode);
      return;
    }

    const roleMeta = MASTER_ROLE_MAP.get(normalizedCode) || MASTER_ROLE_MAP.get(roleCode);

    // Guard BLU role if satker is not BLU
    if (roleMeta && !isBLU && roleMeta.specialRequirement === 'BLU_ONLY') {
      alert(`Role "${roleMeta.roleName}" hanya diperuntukkan bagi Satker BLU (Badan Layanan Umum).`);
      return;
    }

    setFormData(prev => {
      const prevRoles = prev.roles || [];
      const nextRoles = [...prevRoles, normalizedCode];

      // Auto-suggest Peran Jabatan & Jabatan Perbendaharaan if not customized yet or when adding first roles
      let nextPeran = prev.peranJabatan;
      let nextJabatanPerb = prev.jabatanPerbendaharaan;
      if (nextRoles.length > 0) {
        const inferred = inferPeranAndJabatanFromRoles(nextRoles);
        // If current is still default or empty, adopt inferred
        if (!nextPeran || nextPeran === 'Operator') {
          nextPeran = inferred.peranJabatan;
        }
        if (!nextJabatanPerb || nextJabatanPerb === 'Operator Anggaran') {
          nextJabatanPerb = inferred.jabatanPerbendaharaan;
        }
      }

      return {
        ...prev,
        roles: nextRoles,
        peranJabatan: nextPeran,
        jabatanPerbendaharaan: nextJabatanPerb
      };
    });
  };

  // Filtered master roles list
  const filteredRoles = useMemo(() => {
    const q = roleSearch.toLowerCase().trim();
    return MASTER_ROLE_SAKTI_LIST.filter(role => {
      // Category filter
      if (selectedCategory !== 'ALL' && role.category !== selectedCategory) {
        return false;
      }
      // Search query filter
      if (q) {
        const matchCode = role.roleCode.toLowerCase().includes(q);
        const matchName = role.roleName.toLowerCase().includes(q);
        const matchDesc = role.description.toLowerCase().includes(q);
        const matchCat = role.category.toLowerCase().includes(q);
        return matchCode || matchName || matchDesc || matchCat;
      }
      return true;
    });
  }, [roleSearch, selectedCategory]);

  // Sorted selected roles strictly by master orderIndex
  const sortedSelectedRoles = useMemo(() => {
    return sortRolesByMasterOrder(formData.roles || []);
  }, [formData.roles]);

  // Generated string that will be written into Excel cell
  const generatedExcelString = useMemo(() => {
    return formatRolesForExcel(formData.roles || []);
  }, [formData.roles]);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!formData.namaLengkap.trim()) {
      alert('Nama lengkap pengguna wajib diisi.');
      return;
    }

    const cleanNIP = (formData.nip || '').replace(/\D/g, '');
    if (cleanNIP.length !== 18) {
      alert(`NIP harus 18 digit angka (saat ini ${cleanNIP.length} digit).`);
      return;
    }

    const cleanNIK = (formData.nik || '').replace(/\D/g, '');
    if (!cleanNIK) {
      alert('NIK (16 digit angka KTP) wajib diisi.');
      return;
    }
    if (cleanNIK.length !== 16) {
      alert(`NIK harus 16 digit angka (saat ini ${cleanNIK.length} digit).`);
      return;
    }

    const cleanNPWP = (formData.npwp || '').replace(/\D/g, '');
    if (!cleanNPWP) {
      alert('NPWP (15 atau 16 digit angka tanpa simbol) wajib diisi.');
      return;
    }
    if (cleanNPWP.length !== 15 && cleanNPWP.length !== 16) {
      alert(`NPWP harus terdiri dari 15 atau 16 digit angka tanpa pemisah simbol (saat ini ${cleanNPWP.length} digit).`);
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      alert('Alamat email aktif wajib diisi dengan format yang benar.');
      return;
    }

    const cleanPhone = normalizePhoneNumber(formData.noHp);
    if (!cleanPhone || cleanPhone.length < 9) {
      alert('Nomor HP wajib diisi dengan nomor valid Indonesia (contoh: 081234567890).');
      return;
    }

    if (!formData.nomorSk.trim()) {
      alert('Nomor SK penunjukan wajib diisi.');
      return;
    }

    if (!formData.tanggalSk) {
      alert('Tanggal SK penunjukan wajib diisi.');
      return;
    }

    if (!formData.peranJabatan) {
      alert('Peran Jabatan (Approval / Validator / Operator / Admin) wajib dipilih.');
      return;
    }

    if (!formData.jabatanPerbendaharaan || !formData.jabatanPerbendaharaan.trim()) {
      alert('Jabatan Perbendaharaan wajib diisi.');
      return;
    }

    if (!formData.roles || formData.roles.length === 0) {
      alert('Pilih minimal 1 (satu) role SAKTI untuk pengguna ini.');
      return;
    }

    onSave({
      ...formData,
      nip: cleanNIP,
      pangkatGolongan: formData.pangkatGolongan?.trim() || 'Penata / III/c',
      jabatan: formData.jabatan?.trim() || 'Pengelola Keuangan / Pelaksana',
      peranJabatan: formData.peranJabatan || 'Operator',
      jabatanPerbendaharaan: formData.jabatanPerbendaharaan?.trim() || 'Operator Anggaran',
      noHp: cleanPhone,
      roles: sortedSelectedRoles
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                {initialData ? 'Edit Data Pengguna SAKTI' : 'Tambah Pengguna SAKTI Baru'}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  Format Resmi SAKTI
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Pilih role dari referensi resmi tanpa input manual bebas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Duplicate Warning Banner */}
          {duplicateWarning && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Peringatan Duplikasi NIP</p>
                <p className="mt-0.5">{duplicateWarning}</p>
              </div>
            </div>
          )}

          {/* Section 1: Identitas Pegawai */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
              1. Identitas &amp; Kontak Pegawai
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Nama Lengkap */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap (Sesuai SK) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso, S.E."
                  value={formData.namaLengkap}
                  onChange={e => setFormData({ ...formData, namaLengkap: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

              {/* NIP */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    NIP (18 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${
                    (formData.nip || '').length === 18 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}>
                    {(formData.nip || '').length}/18 digit
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={18}
                  placeholder="198501152010011002"
                  value={formData.nip}
                  onChange={e => handleNIPChange(e.target.value)}
                  className={`w-full text-xs sm:text-sm font-mono px-3 py-2 rounded-xl border ${
                    (formData.nip || '').length === 18
                      ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : submitAttempted && (formData.nip || '').length !== 18
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                  } text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all`}
                />
                {formData.nip && formData.nip.length === 18 && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 truncate">
                    Format: {formatNIPDisplay(formData.nip)}
                  </p>
                )}
              </div>

              {/* Pangkat & Golongan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" />
                  Pangkat / Golongan Ruang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penata / III/c"
                  value={formData.pangkatGolongan || ''}
                  onChange={e => setFormData({ ...formData, pangkatGolongan: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

              {/* Jabatan Kedinasan Satker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-blue-500" />
                  Jabatan Kedinasan Satker <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kepala Subbagian Umum / Pelaksana"
                  value={formData.jabatan || ''}
                  onChange={e => setFormData({ ...formData, jabatan: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

              {/* NIK */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    NIK (16 Digit KTP) <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${
                    (formData.nik || '').length === 16 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}>
                    {(formData.nik || '').length}/16
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={16}
                  placeholder="3374012304850001"
                  value={formData.nik || ''}
                  onChange={e => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                  className={`w-full text-xs sm:text-sm font-mono px-3 py-2 rounded-xl border ${
                    (formData.nik || '').length === 16
                      ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : submitAttempted && (formData.nik || '').length !== 16
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                  } text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all`}
                />
              </div>

              {/* NPWP */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    NPWP (15 / 16 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${
                    (formData.npwp || '').length === 15 || (formData.npwp || '').length === 16 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}>
                    {(formData.npwp || '').length}/16
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={16}
                  placeholder="012345678026000"
                  value={formData.npwp || ''}
                  onChange={e => setFormData({ ...formData, npwp: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                  className={`w-full text-xs sm:text-sm font-mono px-3 py-2 rounded-xl border ${
                    (formData.npwp || '').length === 15 || (formData.npwp || '').length === 16
                      ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : submitAttempted && (formData.npwp || '').length !== 15 && (formData.npwp || '').length !== 16
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                  } text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all`}
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  E-mail Aktif <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="nama.user@instansi.go.id"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value.trim().toLowerCase() })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

              {/* No HP / WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  No. HP / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={formData.noHp}
                  onChange={e => setFormData({ ...formData, noHp: e.target.value })}
                  className="w-full text-xs sm:text-sm font-mono px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Diformat otomatis sebagai teks di Excel (angka 0 tidak hilang).
                </p>
              </div>

              {/* Nomor SK */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-400" />
                  Nomor SK <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="KEP-12/WPB.14/KP.01/2026"
                  value={formData.nomorSk}
                  onChange={e => setFormData({ ...formData, nomorSk: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

              {/* Tanggal SK */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Tanggal SK <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggalSk}
                  onChange={e => setFormData({ ...formData, tanggalSk: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Kewenangan & Peran SAKTI (Untuk Lampiran SK & Pengorganisasian) */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              2. Kedudukan &amp; Kewenangan SK SAKTI
            </h4>
            <div className="p-3 mb-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                Ketentuan Pemisahan Data Sesuai Template Resmi:
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                <li><strong className="text-slate-900 dark:text-white">PERAN JABATAN</strong>: 4 kategori kewenangan resmi pada SK (Approval, Validator, Operator, Admin).</li>
                <li><strong className="text-slate-900 dark:text-white">JABATAN PERBENDAHARAAN</strong>: Fungsi pengelolaan keuangan negara yang diampu (KPA, PPK, PPSPM, Bendahara, Operator Anggaran, dll).</li>
                <li><strong className="text-slate-900 dark:text-white">ROLE SAKTI</strong>: Kode hak akses teknis aplikasi yang dipilih di bagian bawah.</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Peran Jabatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Peran Jabatan (Baku SK) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.peranJabatan || 'Operator'}
                  onChange={e => setFormData({ ...formData, peranJabatan: e.target.value as PeranJabatanSakti })}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none font-semibold transition-all"
                >
                  {PERAN_JABATAN_OPTIONS.map(pj => (
                    <option key={pj} value={pj}>
                      {pj} {pj === 'Approval' ? '(KPA / PPK)' : pj === 'Validator' ? '(PPSPM / Penguji)' : pj === 'Operator' ? '(Pelaksana Modul SAKTI)' : '(Pengelola User Satker)'}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Wajib memilih salah satu dari 4 kategori resmi SK.
                </p>
              </div>

              {/* Jabatan Perbendaharaan */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Jabatan Perbendaharaan <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomJabatanPerbendaharaan(!customJabatanPerbendaharaan)}
                    className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    {customJabatanPerbendaharaan ? 'Pilih dari Daftar Baku' : '+ Input Bebas / Kustom'}
                  </button>
                </div>

                {customJabatanPerbendaharaan ? (
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bendahara Pengeluaran Pembantu Bidang A"
                    value={formData.jabatanPerbendaharaan || ''}
                    onChange={e => setFormData({ ...formData, jabatanPerbendaharaan: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  />
                ) : (
                  <select
                    value={formData.jabatanPerbendaharaan || 'Operator Anggaran'}
                    onChange={e => {
                      if (e.target.value === 'CUSTOM_OTHER') {
                        setCustomJabatanPerbendaharaan(true);
                      } else {
                        setFormData({ ...formData, jabatanPerbendaharaan: e.target.value });
                      }
                    }}
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  >
                    {DEFAULT_JABATAN_PERBENDAHARAAN_OPTIONS.map(jp => (
                      <option key={jp} value={jp}>{jp}</option>
                    ))}
                    <option value="CUSTOM_OTHER">-- Ketik Jabatan Kustom / Lainnya --</option>
                  </select>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Dicantumkan pada Kolom ke-5 Tabel Lampiran SK SAKTI.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Pemilihan Role SAKTI (Multi Select with Referensi) */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                  3. Pilih Role / Kode Akses SAKTI (Multi-Select) <span className="text-rose-500">*</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Role diambil dari referensi resmi. Pengguna dapat memiliki satu atau lebih peran.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {formData.roles?.length || 0} Role Dipilih
                </span>
                {formData.roles && formData.roles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, roles: [] })}
                    className="text-[11px] font-bold text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                  >
                    Reset Pilihan
                  </button>
                )}
              </div>
            </div>

            {/* Live Excel Output Preview Box */}
            <div className="mb-4 p-3 rounded-xl bg-slate-900 text-slate-200 border border-slate-700 shadow-inner">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-amber-400" />
                  Preview Nilai Kolom 'Peran' Pada File Excel Resmi:
                </span>
                <span className="text-[10px] text-teal-400 font-mono">
                  Auto-Sorted Berdasarkan Urutan Master Role
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 font-mono text-xs text-amber-300 break-all select-all border border-slate-800 min-h-[36px] flex items-center">
                {generatedExcelString || <span className="text-slate-500 italic">(Belum ada role yang dipilih)</span>}
              </div>
            </div>

            {/* Selected Roles Chips */}
            {sortedSelectedRoles.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Terpilih:</span>
                {sortedSelectedRoles.map(code => {
                  const meta = MASTER_ROLE_MAP.get(code) || MASTER_ROLE_MAP.get(normalizeRoleCode(code));
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold pl-2.5 pr-1 py-1 rounded-lg bg-teal-600 text-white shadow-xs group"
                    >
                      <span>{meta?.roleName || code}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveRole(code);
                        }}
                        className="w-5 h-5 rounded hover:bg-teal-700 active:bg-rose-600 flex items-center justify-center cursor-pointer transition-colors text-teal-100 hover:text-white hover:bg-rose-500/80"
                        title={`Hapus role ${meta?.roleName || code}`}
                        aria-label={`Hapus ${code}`}
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Filter & Search Toolbar */}
            <div className="space-y-2.5 mb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari role (contoh: komitmen, aset, bendahara, pembayaran, pnbp)..."
                  value={roleSearch}
                  onChange={e => setRoleSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === 'ALL'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Semua ({MASTER_ROLE_SAKTI_LIST.length})
                </button>
                {ROLE_CATEGORIES.map(cat => {
                  const count = MASTER_ROLE_SAKTI_LIST.filter(r => r.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Roles Selection Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {filteredRoles.map(role => {
                const isSelected = (formData.roles || []).some(
                  r => r === role.roleCode || normalizeRoleCode(r) === role.roleCode
                );
                const isBluDisabled = !isBLU && role.specialRequirement === 'BLU_ONLY';

                return (
                  <div
                    key={role.roleCode}
                    onClick={() => {
                      if (!isBluDisabled) handleToggleRole(role.roleCode);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isBluDisabled
                        ? 'opacity-40 bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-800 cursor-not-allowed'
                        : isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 dark:border-teal-500 shadow-xs cursor-pointer ring-1 ring-teal-400/40'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-teal-400 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                        isSelected
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {role.roleName}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {role.roleCode}
                          </span>
                          {role.specialRequirement === 'BLU_ONLY' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                              Khusus BLU
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {role.description}
                        </p>

                        {/* Smart Warning info */}
                        {role.smartWarning && (
                          <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium mt-1 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                            <Info className="w-3 h-3 shrink-0" />
                            {role.smartWarning}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              <span className="text-rose-500 font-bold">*</span> Wajib diisi sesuai template resmi SAKTI
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{initialData ? 'Simpan Perubahan' : 'Tambahkan Pengguna'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
