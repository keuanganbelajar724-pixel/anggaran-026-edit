import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Crown, 
  Building2, 
  KeyRound, 
  ShieldCheck, 
  ShieldAlert, 
  Edit3, 
  Trash2, 
  Search, 
  Check, 
  X, 
  Save, 
  Sparkles, 
  Image as ImageIcon, 
  Eye, 
  EyeOff, 
  Clock, 
  AlertCircle,
  HelpCircle,
  RefreshCw,
  BadgeCheck,
  UserCheck,
  Mail,
  Phone
} from 'lucide-react';
import { AppUser, UserRole } from '../../types/user';
import { AppTheme } from '../../types';
import { 
  getStoredUsers, 
  saveStoredUsers, 
  createNewUser, 
  updateUserProfile, 
  deleteUserAccount,
  subscribeUsers 
} from '../../utils/userManager';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { ModernConfirmModal, ConfirmModalState } from '../ModernConfirmModal';
import { useToast } from '../ToastNotification';

interface UserManagementSectionProps {
  currentUser: AppUser | null;
  theme?: AppTheme;
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  currentUser,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const [users, setUsers] = useState<AppUser[]>(() => getStoredUsers());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'superadmin' | 'pegawai'>('ALL');

  // Modal States
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<AppUser | null>(null);

  // Form State for Add User
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    role: 'pegawai' as UserRole,
    jabatan: 'Pelaksana Seksi MSKI',
    seksi: 'Seksi MSKI',
    nip: '',
    email: '',
    noHp: '',
    photoUrl: '',
    customGreeting: '',
    passwordRaw: ''
  });

  const [formPhotoPreview, setFormPhotoPreview] = useState<string>('');
  const [formImageError, setFormImageError] = useState<boolean>(false);
  const [showDriveGuide, setShowDriveGuide] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  // Real-time synchronization for users
  useEffect(() => {
    const unsub = subscribeUsers((updatedUsers) => {
      setUsers(updatedUsers);
    });
    return () => unsub();
  }, []);

  const handlePhotoUrlChange = (val: string) => {
    setFormData(prev => ({ ...prev, photoUrl: val }));
    setFormImageError(false);
    if (!val.trim()) {
      setFormPhotoPreview('');
      return;
    }
    const normalized = normalizeImageUrl(val);
    setFormPhotoPreview(normalized);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      username: '',
      displayName: '',
      role: 'pegawai',
      jabatan: 'Pelaksana Seksi MSKI',
      seksi: 'Seksi MSKI',
      nip: '',
      email: '',
      noHp: '',
      photoUrl: '',
      customGreeting: 'Halo Rekan Pegawai! Semangat melayani Satker hari ini',
      passwordRaw: 'pegawai026'
    });
    setFormPhotoPreview('');
    setFormImageError(false);
    setShowPassword(false);
    setIsAddUserModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: AppUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      jabatan: user.jabatan || '',
      seksi: user.seksi || 'Seksi MSKI',
      nip: user.nip || '',
      email: user.email || '',
      noHp: user.noHp || '',
      photoUrl: user.photoUrl || '',
      customGreeting: user.customGreeting || '',
      passwordRaw: user.passwordRaw || ''
    });
    setFormPhotoPreview(user.photoUrl ? normalizeImageUrl(user.photoUrl) : '');
    setFormImageError(false);
    setShowPassword(false);
  };

  // Submit Add User
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.displayName.trim()) {
      showToast('Username dan Nama Lengkap wajib diisi.', 'error');
      return;
    }

    if (!formData.passwordRaw.trim() || formData.passwordRaw.length < 4) {
      showToast('Password minimal 4 karakter.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createNewUser({
        username: formData.username.trim().toLowerCase(),
        displayName: formData.displayName.trim(),
        role: formData.role,
        jabatan: formData.jabatan.trim(),
        seksi: formData.seksi.trim(),
        nip: formData.nip.trim(),
        email: formData.email.trim(),
        noHp: formData.noHp.trim(),
        photoUrl: formData.photoUrl.trim(),
        customGreeting: formData.customGreeting.trim() || `Hai, ${formData.displayName.trim()}!`,
        passwordRaw: formData.passwordRaw.trim(),
        isActive: true
      });

      if (res.success) {
        showToast(`Akun user @${formData.username} berhasil dibuat!`, 'success');
        setIsAddUserModalOpen(false);
      } else {
        showToast(res.message || 'Gagal menambahkan user.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit User
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!formData.displayName.trim()) {
      showToast('Nama Lengkap tidak boleh kosong.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateUserProfile(editingUser.id, {
        displayName: formData.displayName.trim(),
        role: formData.role,
        jabatan: formData.jabatan.trim(),
        seksi: formData.seksi.trim(),
        nip: formData.nip.trim(),
        email: formData.email.trim(),
        noHp: formData.noHp.trim(),
        photoUrl: formData.photoUrl.trim(),
        customGreeting: formData.customGreeting.trim() || `Hai, ${formData.displayName.trim()}!`
      });

      if (res.success) {
        showToast(`Data pengguna "${formData.displayName}" berhasil diperbarui!`, 'success');
        setEditingUser(null);
      } else {
        showToast(res.message || 'Gagal memperbarui user.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Reset Password by Admin Super
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingPasswordUser) return;

    if (!newPasswordInput.trim() || newPasswordInput.length < 4) {
      showToast('Password baru minimal 4 karakter.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateUserProfile(resettingPasswordUser.id, {
        passwordRaw: newPasswordInput.trim()
      });

      if (res.success) {
        showToast(`Password untuk user @${resettingPasswordUser.username} berhasil direset!`, 'success');
        setResettingPasswordUser(null);
        setNewPasswordInput('');
      } else {
        showToast(res.message || 'Gagal mereset password.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (user: AppUser) => {
    if (user.role === 'superadmin' && user.id === currentUser?.id) {
      showToast('Tidak dapat menonaktifkan akun Admin Super yang sedang Anda gunakan.', 'warning');
      return;
    }

    const newStatus = !user.isActive;
    const res = await updateUserProfile(user.id, { isActive: newStatus });
    if (res.success) {
      showToast(`User @${user.username} telah di-${newStatus ? 'Aktifkan' : 'Nonaktifkan'}.`, 'success');
    }
  };

  // Delete User
  const handleDeleteUser = (user: AppUser) => {
    if (user.role === 'superadmin') {
      const superCount = users.filter(u => u.role === 'superadmin').length;
      if (superCount <= 1) {
        showToast('Tidak dapat menghapus satu-satunya Admin Super.', 'error');
        return;
      }
    }

    setConfirmModal({
      isOpen: true,
      title: 'Hapus Akun Pengguna',
      message: `Apakah Anda yakin ingin menghapus akun @${user.username} (${user.displayName})? Pengguna ini tidak akan dapat login lagi ke sistem ANGKASA.`,
      confirmText: 'Ya, Hapus Akun',
      cancelText: 'Batal',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: async () => {
        const res = await deleteUserAccount(user.id);
        if (res.success) {
          showToast(`Akun @${user.username} telah dihapus.`, 'success');
        } else {
          showToast(res.message || 'Gagal menghapus user.', 'error');
        }
      }
    });
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      u.displayName.toLowerCase().includes(q) || 
      u.username.toLowerCase().includes(q) || 
      (u.jabatan && u.jabatan.toLowerCase().includes(q)) ||
      (u.seksi && u.seksi.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  const totalUsers = users.length;
  const superAdminCount = users.filter(u => u.role === 'superadmin').length;
  const pegawaiCount = users.filter(u => u.role === 'pegawai').length;
  const activeCount = users.filter(u => u.isActive).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-500/30">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5" />
              <span>MODUL EKSKLUSIF ADMIN SUPER</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Manajemen Pengguna &amp; Akun Pegawai KPPN
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Buat dan kelola akun login untuk pegawai internal KPPN Semarang I. Pegawai yang dibuat dapat mengakses modul operasional KPPN tanpa akses ke Manajemen User &amp; Log Admin.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah User Pegawai</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-indigo-500/20">
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase text-slate-400 tracking-wider block">Total Pengguna</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">{totalUsers} Akun</div>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-amber-500/30">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase text-amber-400 tracking-wider block">Admin Super</span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">{superAdminCount} User</div>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-sky-500/30">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase text-sky-400 tracking-wider block">Pegawai KPPN</span>
            <div className="text-xl sm:text-2xl font-black text-sky-300 mt-1">{pegawaiCount} User</div>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-emerald-500/30">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase text-emerald-400 tracking-wider block">Akun Aktif</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">{activeCount} Aktif</div>
          </div>
        </div>
      </div>

      {/* Search and Role Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, username, jabatan..."
            className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl pl-9 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer transition-all ${
              roleFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Semua ({totalUsers})
          </button>
          <button
            onClick={() => setRoleFilter('superadmin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer transition-all ${
              roleFilter === 'superadmin'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            👑 Admin Super ({superAdminCount})
          </button>
          <button
            onClick={() => setRoleFilter('pegawai')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer transition-all ${
              roleFilter === 'pegawai'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            🏛️ Pegawai ({pegawaiCount})
          </button>
        </div>
      </div>

      {/* Users Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((u) => {
          const isSuper = u.role === 'superadmin';
          const resolvedPhoto = u.photoUrl ? normalizeImageUrl(u.photoUrl) : '';

          return (
            <div
              key={u.id}
              className={`rounded-3xl border p-5 shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4 ${
                !u.isActive 
                  ? 'opacity-60 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800' 
                  : isSuper
                    ? 'bg-white dark:bg-slate-900 border-amber-300/80 dark:border-amber-500/30 shadow-amber-500/5'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Top User Header */}
              <div className="flex items-start gap-3.5">
                <div className={`w-14 h-14 rounded-2xl p-0.5 shrink-0 overflow-hidden border-2 ${
                  isSuper ? 'border-amber-400 bg-amber-100 dark:bg-amber-950' : 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950'
                }`}>
                  {resolvedPhoto ? (
                    <img 
                      src={resolvedPhoto} 
                      alt={u.displayName} 
                      className="w-full h-full object-cover rounded-[12px]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-lg text-slate-700 dark:text-slate-200">
                      {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>

                <div className="space-y-1 flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isSuper 
                        ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40' 
                        : 'bg-sky-400/20 text-sky-800 dark:text-sky-300 border border-sky-400/40'
                    }`}>
                      {isSuper ? <Crown className="w-3 h-3 text-amber-500" /> : <Building2 className="w-3 h-3 text-sky-500" />}
                      <span>{isSuper ? 'Admin Super' : 'Pegawai'}</span>
                    </span>

                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      u.isActive 
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                    }`}>
                      {u.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {u.displayName}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    @{u.username}
                  </p>
                </div>
              </div>

              {/* Jabatan & Kalimat Sapaan Preview */}
              <div className="space-y-2 text-xs border-y border-slate-100 dark:border-slate-800/80 py-3">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Jabatan:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px] text-right">
                    {u.jabatan || '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Seksi:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {u.seksi || 'MSKI'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-sky-500" />
                    <span>Email:</span>
                  </span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200 truncate max-w-[170px] text-right">
                    {u.email || <span className="text-amber-500 font-normal italic">Belum diisi</span>}
                  </span>
                </div>

                {u.noHp && (
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-500" />
                      <span>No. WhatsApp:</span>
                    </span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {u.noHp}
                    </span>
                  </div>
                )}

                {/* Sapaan Preview */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px]">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-0.5">
                    Kalimat Sapaan Dashboard:
                  </span>
                  <p className="font-semibold text-indigo-950 dark:text-indigo-200 italic line-clamp-2">
                    "{u.customGreeting || (isSuper ? 'Hai, Admin Super KPPN!' : `Hai, ${u.displayName}!`)}"
                  </p>
                </div>

                {u.lastLoginAt && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Terakhir login: {new Date(u.lastLoginAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(u)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                    title="Edit Profil & Sapaan"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => { setResettingPasswordUser(u); setNewPasswordInput(''); }}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer"
                    title="Reset Password Akun"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggleActive(u)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      u.isActive 
                        ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600' 
                        : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600'
                    }`}
                    title={u.isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                  >
                    {u.isActive ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteUser(u)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                  title="Hapus Akun Pengguna"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-black text-slate-800 dark:text-slate-200">
            Tidak Ada Pengguna Ditemukan
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gunakan kata kunci lain atau klik tombol "Tambah User Pegawai" di atas.
          </p>
        </div>
      )}

      {/* Modal 1: Add New User */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-200 dark:border-indigo-500/40 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden my-8">
            <div className="bg-gradient-to-r from-slate-950 to-indigo-950 p-6 text-white flex items-center justify-between border-b border-indigo-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Tambah Pengguna Pegawai KPPN</h3>
                  <p className="text-xs text-slate-300">Buat akun untuk pegawai internal KPPN Semarang I</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })}
                    placeholder="misal: budi, eko.mski"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                    Role Hak Akses
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pegawai">🏛️ Pegawai KPPN (Tanpa User Mgmt &amp; Log)</option>
                    <option value="superadmin">👑 Admin Super (Akses Penuh)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                  Nama Lengkap &amp; Gelar *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="misal: Budi Santoso, S.E."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                    Jabatan
                  </label>
                  <input
                    type="text"
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    placeholder="misal: Pelaksana Seksi MSKI"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                    Seksi / Subbag
                  </label>
                  <select
                    value={formData.seksi}
                    onChange={(e) => setFormData({ ...formData, seksi: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Seksi MSKI">Seksi MSKI</option>
                    <option value="Seksi Bank">Seksi Bank</option>
                    <option value="Seksi Pencairan Dana (Pera)">Seksi Pencairan Dana (Pera)</option>
                    <option value="Seksi Verifikasi & Akuntansi (Vera)">Seksi Verifikasi &amp; Akuntansi (Vera)</option>
                    <option value="Subbagian Umum">Subbagian Umum</option>
                  </select>
                </div>
              </div>

              {/* Email & No. HP / WA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-500" />
                    <span>Email Resmi (Untuk Reset Sandi)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@kemenkeu.go.id"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Digunakan untuk kirim OTP jika lupa password.</p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>No. WhatsApp / HP</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.noHp}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder="081234567890"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Kontak darurat atau koordinasi internal.</p>
                </div>
              </div>

              {/* Password Initial */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                  Password Awal Login *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.passwordRaw}
                    onChange={(e) => setFormData({ ...formData, passwordRaw: e.target.value })}
                    placeholder="misal: pegawai026"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl px-3.5 py-2.5 pr-10 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Pegawai dapat mengganti kata sandi ini sendiri di profil mereka.</p>
              </div>

              {/* Kalimat Sapaan */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Kalimat Sapaan Dashboard</span>
                </label>
                <input
                  type="text"
                  value={formData.customGreeting}
                  onChange={(e) => setFormData({ ...formData, customGreeting: e.target.value })}
                  placeholder="misal: Halo Rekan Pegawai! Semangat melayani Satker hari ini"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Foto Google Drive Link */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Link Foto Profil (Google Drive / URL Gambar)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDriveGuide(!showDriveGuide)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Cara Link Drive?</span>
                  </button>
                </div>
                <input
                  type="url"
                  value={formData.photoUrl}
                  onChange={(e) => handlePhotoUrlChange(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                />

                {showDriveGuide && (
                  <div className="mt-2 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                    <p className="font-bold text-indigo-950 dark:text-indigo-300">Petunjuk Google Drive:</p>
                    <p>Klik kanan file foto di Google Drive &gt; Bagikan &gt; Ubah akses menjadi "Siapa saja yang memiliki link" &gt; Salin link dan tempel di atas.</p>
                  </div>
                )}

                {formPhotoPreview && (
                  <div className="mt-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                      <img 
                        src={formPhotoPreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={() => setFormImageError(true)}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {formImageError ? '⚠️ Foto gagal dimuat (cek izin link)' : '✅ Pratinjau Foto Siap'}
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Membuat...' : 'Buat User Pegawai'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-200 dark:border-indigo-500/40 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden my-8">
            <div className="bg-gradient-to-r from-slate-950 to-indigo-950 p-6 text-white flex items-center justify-between border-b border-indigo-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Edit Pengguna: @{editingUser.username}</h3>
                  <p className="text-xs text-slate-300">Perbarui informasi jabatan, sapaan, dan foto</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                  Nama Lengkap &amp; Gelar *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                    Jabatan
                  </label>
                  <input
                    type="text"
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                    Seksi
                  </label>
                  <select
                    value={formData.seksi}
                    onChange={(e) => setFormData({ ...formData, seksi: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Seksi MSKI">Seksi MSKI</option>
                    <option value="Seksi Bank">Seksi Bank</option>
                    <option value="Seksi Pencairan Dana (Pera)">Seksi Pencairan Dana (Pera)</option>
                    <option value="Seksi Verifikasi & Akuntansi (Vera)">Seksi Verifikasi &amp; Akuntansi (Vera)</option>
                    <option value="Subbagian Umum">Subbagian Umum</option>
                  </select>
                </div>
              </div>

              {/* Email & No. HP in Edit User */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-500" />
                    <span>Email Resmi (Untuk Reset Sandi)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@kemenkeu.go.id"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Digunakan untuk reset password mandiri via OTP.</p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>No. WhatsApp / HP</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.noHp}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder="081234567890"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Kontak darurat atau koordinasi internal.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Kalimat Sapaan Dashboard</span>
                </label>
                <input
                  type="text"
                  value={formData.customGreeting}
                  onChange={(e) => setFormData({ ...formData, customGreeting: e.target.value })}
                  placeholder="misal: Hai Budi! Semangat Melayani Satker"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Link Foto Google Drive</span>
                </label>
                <input
                  type="url"
                  value={formData.photoUrl}
                  onChange={(e) => handlePhotoUrlChange(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                />
                {formPhotoPreview && (
                  <div className="mt-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                      <img 
                        src={formPhotoPreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={() => setFormImageError(true)}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {formImageError ? '⚠️ Foto gagal dimuat' : '✅ Pratinjau Foto Siap'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Reset Password by Admin */}
      {resettingPasswordUser && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-300 dark:border-amber-500/40 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden my-8">
            <div className="bg-gradient-to-r from-slate-950 to-amber-950 p-6 text-white flex items-center justify-between border-b border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Reset Password</h3>
                  <p className="text-xs text-slate-300">Untuk user: @{resettingPasswordUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setResettingPasswordUser(null)}
                className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                  Password Baru Pengguna
                </label>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Ketik password baru (min. 4 karakter)..."
                  required
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResettingPasswordUser(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Reset Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <ModernConfirmModal
          modal={confirmModal}
          onClose={() => setConfirmModal(null)}
          isDark={isDark}
        />
      )}
    </div>
  );
};
