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
  Send,
  Phone,
  Fingerprint,
  Palette
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
import { BANNER_THEME_PRESETS, getPresetById, getDefaultPresetId } from '../../utils/bannerThemePresets';
import { ModernConfirmModal, ConfirmModalState } from '../ModernConfirmModal';
import { useToast } from '../ToastNotification';
import { EmailGatewayConfigCard } from './EmailGatewayConfigCard';
import { TelegramGatewayConfigCard } from './TelegramGatewayConfigCard';

interface UserManagementSectionProps {
  currentUser: AppUser | null;
  theme?: AppTheme;
  onUserUpdated?: (user: AppUser) => void;
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  currentUser,
  theme = 'light',
  onUserUpdated
}) => {
  const isDark = theme === 'dark';
  const isTamu = currentUser?.role === 'tamu';
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<'users' | 'email_gateway' | 'telegram_gateway'>('users');
  const [users, setUsers] = useState<AppUser[]>(() => getStoredUsers());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'superadmin' | 'pegawai' | 'tamu'>('ALL');

  // Modal States
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<AppUser | null>(null);
  const [themePickerUser, setThemePickerUser] = useState<AppUser | null>(null);

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
    passwordRaw: '',
    bannerColorTheme: 'emerald_mint'
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
      passwordRaw: 'pegawai026',
      bannerColorTheme: 'emerald_mint'
    });
    setFormPhotoPreview('');
    setFormImageError(false);
    setShowPassword(false);
    setIsAddUserModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: AppUser) => {
    setEditingUser(user);
    const userTheme = user.bannerColorTheme
      ? (typeof user.bannerColorTheme === 'string' ? user.bannerColorTheme : (user.bannerColorTheme.presetId || 'kemenkeu_gold'))
      : getDefaultPresetId(user.role === 'superadmin');

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
      passwordRaw: user.passwordRaw || '',
      bannerColorTheme: userTheme
    });
    setFormPhotoPreview(user.photoUrl ? normalizeImageUrl(user.photoUrl) : '');
    setFormImageError(false);
    setShowPassword(false);
  };

  // Handle direct theme update for a user
  const handleUpdateUserTheme = async (userId: string, newThemeId: string) => {
    try {
      const res = await updateUserProfile(userId, { bannerColorTheme: newThemeId });
      if (res.success) {
        setUsers(getStoredUsers());
        if (currentUser && currentUser.id === userId && onUserUpdated && res.user) {
          onUserUpdated(res.user);
        }
        const presetObj = getPresetById(newThemeId);
        showToast(`Warna tema berhasil diubah ke "${presetObj.name.split('&')[0].trim()}"!`, 'success');
        setThemePickerUser(null);
      } else {
        showToast(res.message || 'Gagal mengubah tema warna.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem.', 'error');
    }
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
        bannerColorTheme: formData.bannerColorTheme,
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
        customGreeting: formData.customGreeting.trim() || `Hai, ${formData.displayName.trim()}!`,
        bannerColorTheme: formData.bannerColorTheme
      });

      if (res.success) {
        setUsers(getStoredUsers());
        if (currentUser && currentUser.id === editingUser.id && onUserUpdated && res.user) {
          onUserUpdated(res.user);
        }
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
            {isTamu ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/25 border border-purple-400/40 text-purple-200 text-xs font-black uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5 text-purple-300" />
                <span>MODE OBSERVASI STUDI BANDING (READ-ONLY)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5" />
                <span>MODUL EKSKLUSIF ADMIN SUPER</span>
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Manajemen Pengguna &amp; Akun Pegawai KPPN
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {isTamu 
                ? 'Peninjauan struktur akun pengguna, pembagian kewenangan pegawai, dan konfigurasi profil sistem ANGKASA KPPN Semarang I untuk keperluan studi banding.' 
                : 'Buat dan kelola akun login untuk pegawai internal KPPN Semarang I. Pegawai yang dibuat dapat mengakses modul operasional KPPN tanpa akses ke Manajemen User & Log Admin.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {isTamu ? (
              <div className="bg-purple-900/60 border border-purple-500/50 text-purple-200 text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-md">
                <Eye className="w-4 h-4 text-purple-300" />
                <span>Akses Observasi (Hanya Lihat)</span>
              </div>
            ) : (
              <button
                onClick={handleOpenAddModal}
                className="bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah User Pegawai</span>
              </button>
            )}
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

      {/* Subtab Navigation: Kelola User vs Gateway Email API */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
            subTab === 'users'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white shadow-lg shadow-indigo-600/30 border-indigo-300 ring-2 ring-indigo-400/50 scale-[1.02]'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
        >
          <Users className={`w-4 h-4 ${subTab === 'users' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
          <span>Kelola Pengguna ({totalUsers})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('email_gateway')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
            subTab === 'email_gateway'
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 border-orange-300 ring-2 ring-orange-400/50 scale-[1.02]'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50/50'
          }`}
        >
          <Mail className={`w-4 h-4 ${subTab === 'email_gateway' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
          <span>Gateway Email (Brevo / Resend / Gmail)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('telegram_gateway')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
            subTab === 'telegram_gateway'
              ? 'bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30 border-sky-300 ring-2 ring-sky-400/50 scale-[1.02]'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:bg-sky-50/50'
          }`}
        >
          <Send className={`w-4 h-4 rotate-[-20deg] ${subTab === 'telegram_gateway' ? 'text-white' : 'text-sky-600 dark:text-sky-400'}`} />
          <span>Gateway Bot Telegram API</span>
        </button>
      </div>

      {/* VIEW A: EMAIL GATEWAY CONFIGURATION */}
      {subTab === 'email_gateway' && (
        <EmailGatewayConfigCard 
          currentUserEmail={currentUser?.email} 
          theme={theme === 'dark' ? 'dark' : 'light'} 
        />
      )}

      {/* VIEW B: TELEGRAM GATEWAY CONFIGURATION */}
      {subTab === 'telegram_gateway' && (
        <TelegramGatewayConfigCard 
          theme={theme === 'dark' ? 'dark' : 'light'} 
        />
      )}

      {/* VIEW B: USER LIST & MANAGEMENT */}
      {subTab === 'users' && (
        <>
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
          const themeId = u.bannerColorTheme
            ? (typeof u.bannerColorTheme === 'string' ? u.bannerColorTheme : (u.bannerColorTheme.presetId || 'kemenkeu_gold'))
            : getDefaultPresetId(isSuper);
          const preset = getPresetById(themeId);

          return (
            <div
              key={u.id}
              className={`rounded-3xl border p-5 shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4 relative overflow-hidden ${
                !u.isActive 
                  ? 'opacity-60 bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800' 
                  : isSuper
                    ? 'bg-white dark:bg-slate-900 border-amber-300/80 dark:border-amber-500/30 shadow-amber-500/5'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Top Accent Gradient Bar matching user's color theme */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${preset.previewGradient}`} />

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
                    <Fingerprint className="w-3 h-3 text-indigo-500" />
                    <span>NIP Pegawai:</span>
                  </span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                    {u.nip || <span className="text-amber-500 font-normal italic">Belum diisi</span>}
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

                {/* Banner Color Theme Indicator & Quick Edit */}
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Palette className="w-3 h-3 text-amber-500" />
                    <span>Warna Tema:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${preset.previewGradient}`} />
                      <span>{preset.name.split('&')[0]}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setThemePickerUser(u)}
                      className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1"
                      title="Ubah warna tema untuk pengguna ini"
                    >
                      <Palette className="w-2.5 h-2.5" />
                      <span>Ubah</span>
                    </button>
                  </div>
                </div>

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
                {isTamu ? (
                  <div className="w-full py-1 text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 px-3 py-1.5 rounded-xl w-full">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Mode Studi Banding (Hanya Lihat)</span>
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setThemePickerUser(u)}
                        className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer"
                        title="Ganti Warna Banner & Tema User Ini"
                      >
                        <Palette className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                        title="Edit Profil & Sapaan"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => { setResettingPasswordUser(u); setNewPasswordInput(''); }}
                        className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer"
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
                  </>
                )}
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
      </>
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

              {/* NIP Pegawai */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-indigo-500" />
                  <span>NIP 18 Digit (Bisa dipakai login)</span>
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value.replace(/\D/g, '') })}
                  placeholder="contoh: 199205152014021002"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Pegawai dapat menggunakan 18 digit NIP ini sebagai identitas login ke sistem.</p>
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

              {/* NIP Pegawai */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-indigo-500" />
                  <span>NIP 18 Digit (Bisa dipakai login)</span>
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value.replace(/\D/g, '') })}
                  placeholder="contoh: 199205152014021002"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Dapat digunakan sebagai identitas login alternatif akun pegawai.</p>
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

              {/* Pilihan Warna Tema Banner & Kartu */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pilihan Warna Tema Banner &amp; Kartu</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BANNER_THEME_PRESETS.map((preset) => {
                    const isSelected = formData.bannerColorTheme === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, bannerColorTheme: preset.id })}
                        className={`p-2 rounded-xl text-left border cursor-pointer transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-900/50'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${preset.previewGradient} shrink-0 shadow-xs`} />
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{preset.name.split('&')[0]}</span>
                      </button>
                    );
                  })}
                </div>
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

      {/* Modal 4: Theme Color Picker for User */}
      {themePickerUser && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-indigo-300/80 dark:border-indigo-500/40 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden my-8 animate-in fade-in duration-200">
            <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 p-6 text-white flex items-center justify-between border-b border-indigo-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <span>Ganti Warna Banner &amp; Tema: @{themePickerUser.username}</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Pilih skema warna tema kartu &amp; banner untuk {themePickerUser.displayName} ({themePickerUser.role === 'superadmin' ? 'Admin Super' : 'Pegawai'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setThemePickerUser(null)}
                className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BANNER_THEME_PRESETS.map((preset) => {
                  const currentThemeId = themePickerUser.bannerColorTheme
                    ? (typeof themePickerUser.bannerColorTheme === 'string' ? themePickerUser.bannerColorTheme : (themePickerUser.bannerColorTheme.presetId || 'kemenkeu_gold'))
                    : getDefaultPresetId(themePickerUser.role === 'superadmin');
                  const isSelected = currentThemeId === preset.id;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleUpdateUserTheme(themePickerUser.id, preset.id)}
                      className={`group relative text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-md ring-2 ring-indigo-500/30 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 hover:scale-[1.01]'
                      }`}
                    >
                      <div className={`w-full h-8 rounded-xl bg-gradient-to-r ${preset.previewGradient} shadow-inner flex items-center justify-between px-3`}>
                        <span className="text-[10px] font-black text-white drop-shadow-xs uppercase tracking-wider">
                          {preset.tag}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-white text-indigo-700 flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="font-black text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {preset.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {preset.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setThemePickerUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Tutup
              </button>
            </div>
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
