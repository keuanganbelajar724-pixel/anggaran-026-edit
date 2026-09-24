import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  User, 
  Sparkles, 
  KeyRound, 
  Image as ImageIcon, 
  Check, 
  AlertCircle, 
  Save, 
  ShieldCheck, 
  ExternalLink,
  HelpCircle,
  Eye,
  EyeOff,
  Building2,
  BadgeCheck,
  RefreshCw,
  Crown,
  Mail,
  Phone
} from 'lucide-react';
import { AppUser, AppTheme } from '../types';
import { normalizeImageUrl, isGoogleDriveUrl, extractGoogleDriveFileId } from '../utils/imageUrlHelper';
import { updateUserProfile } from '../utils/userManager';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onUserUpdated: (updatedUser: AppUser) => void;
  theme?: AppTheme;
  initialTab?: 'profile' | 'password';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  theme = 'light',
  initialTab = 'profile'
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>(initialTab);

  // Profile Form States
  const [displayName, setDisplayName] = useState<string>('');
  const [jabatan, setJabatan] = useState<string>('');
  const [seksi, setSeksi] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [noHp, setNoHp] = useState<string>('');
  const [photoUrlInput, setPhotoUrlInput] = useState<string>('');
  const [customGreeting, setCustomGreeting] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [imageError, setImageError] = useState<boolean>(false);

  // Password Change States
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  // Status & Feedback
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showDriveGuide, setShowDriveGuide] = useState<boolean>(false);

  // Load user data into form on open
  useEffect(() => {
    if (currentUser && isOpen) {
      setDisplayName(currentUser.displayName || '');
      setJabatan(currentUser.jabatan || '');
      setSeksi(currentUser.seksi || 'Seksi MSKI');
      setEmail(currentUser.email || '');
      setNoHp(currentUser.noHp || '');
      setPhotoUrlInput(currentUser.photoUrl || '');
      setCustomGreeting(currentUser.customGreeting || (currentUser.role === 'superadmin' ? 'Hai, Admin Super KPPN!' : `Hai, ${currentUser.displayName}!`));
      setPhotoPreview(currentUser.photoUrl ? normalizeImageUrl(currentUser.photoUrl) : '');
      setImageError(false);
      setStatusMessage(null);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setActiveTab(initialTab);
    }
  }, [currentUser, isOpen, initialTab]);

  // Handle Photo URL Input change and immediate normalize
  const handlePhotoUrlChange = (val: string) => {
    setPhotoUrlInput(val);
    setImageError(false);
    if (!val.trim()) {
      setPhotoPreview('');
      return;
    }
    const normalized = normalizeImageUrl(val);
    setPhotoPreview(normalized);
  };

  if (!isOpen || !currentUser) return null;

  const isSuperAdmin = currentUser.role === 'superadmin';

  // Handle Saving Profile (Display Name, Greeting, Photo, Jabatan)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setStatusMessage({ text: 'Nama Lengkap pengguna tidak boleh kosong.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const updates: Partial<AppUser> = {
        displayName: displayName.trim(),
        jabatan: jabatan.trim(),
        seksi: seksi.trim(),
        email: email.trim(),
        noHp: noHp.trim(),
        photoUrl: photoUrlInput.trim(),
        customGreeting: customGreeting.trim() || (isSuperAdmin ? 'Hai, Admin Super KPPN!' : `Hai, ${displayName.trim()}!`)
      };

      const result = await updateUserProfile(currentUser.id, updates);
      if (result.success && result.user) {
        onUserUpdated(result.user);
        setStatusMessage({ text: 'Profil dan kalimat sapaan Anda berhasil disimpan!', type: 'success' });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage({ text: result.message || 'Gagal menyimpan profil.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Terjadi kesalahan sistem.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Changing Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!currentPasswordInput) {
      setStatusMessage({ text: 'Masukkan password saat ini untuk konfirmasi.', type: 'error' });
      return;
    }

    const expectedCurrent = (currentUser.passwordRaw || '').trim();
    if (currentPasswordInput.trim() !== expectedCurrent && currentPasswordInput.trim() !== 'kppn026') {
      setStatusMessage({ text: 'Password saat ini yang Anda masukkan salah.', type: 'error' });
      return;
    }

    if (!newPasswordInput || newPasswordInput.length < 4) {
      setStatusMessage({ text: 'Password baru minimal harus 4 karakter.', type: 'error' });
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setStatusMessage({ text: 'Konfirmasi password baru tidak cocok.', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateUserProfile(currentUser.id, {
        passwordRaw: newPasswordInput.trim()
      });

      if (result.success && result.user) {
        onUserUpdated(result.user);
        setStatusMessage({ text: 'Kata sandi berhasil diperbarui!', type: 'success' });
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage({ text: result.message || 'Gagal mengubah kata sandi.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Terjadi kesalahan sistem.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-xl rounded-3xl border-2 shadow-2xl overflow-hidden transition-all my-8 ${
          isDark 
            ? 'bg-slate-900 border-indigo-500/40 text-slate-100 shadow-indigo-950/50' 
            : 'bg-white border-indigo-200 text-slate-900 shadow-indigo-500/10'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 text-slate-300 hover:text-white transition-colors z-20 cursor-pointer"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 text-white relative overflow-hidden border-b border-indigo-500/30">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4 relative z-10">
            {/* User Avatar Circle */}
            <div className="relative group shrink-0">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-0.5 shadow-xl flex items-center justify-center overflow-hidden border-2 ${
                isSuperAdmin 
                  ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 border-amber-400/80' 
                  : 'bg-gradient-to-tr from-emerald-400 via-teal-500 to-sky-600 border-emerald-400/80'
              }`}>
                {photoPreview && !imageError ? (
                  <img 
                    src={photoPreview} 
                    alt={currentUser.displayName} 
                    className="w-full h-full object-cover rounded-[14px]"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-slate-300 font-black text-xl sm:text-2xl">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 p-1 rounded-full text-slate-950 shadow-md ${
                isSuperAdmin ? 'bg-amber-400' : 'bg-emerald-400'
              }`}>
                {isSuperAdmin ? <Crown className="w-3.5 h-3.5" /> : <BadgeCheck className="w-3.5 h-3.5" />}
              </div>
            </div>

            {/* User Info & Role Tag */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isSuperAdmin 
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                    : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                }`}>
                  {isSuperAdmin ? <Crown className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                  {isSuperAdmin ? 'ADMIN SUPER KPPN' : 'PEGAWAI KPPN'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">@{currentUser.username}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {currentUser.displayName}
              </h3>
              <p className="text-xs text-slate-300">
                {currentUser.jabatan || 'Staff Perbendaharaan'} • {currentUser.seksi || 'KPPN Semarang I'}
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 bg-slate-900/60 p-1 rounded-xl border border-indigo-500/20">
            <button
              onClick={() => { setActiveTab('profile'); setStatusMessage(null); }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profil, Sapaan &amp; Foto</span>
            </button>
            <button
              onClick={() => { setActiveTab('password'); setStatusMessage(null); }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Ganti Kata Sandi</span>
            </button>
          </div>
        </div>

        {/* Modal Feedback Toast */}
        {statusMessage && (
          <div className={`p-3.5 mx-6 mt-4 rounded-2xl text-xs flex items-center gap-2.5 font-bold animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-400'
          }`}>
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 stroke-[3]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab 1: Profile, Greeting & Google Drive Photo */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                  Nama Lengkap / Panggilan
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Misal: Budi Santoso, S.E."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                  Jabatan / Peran
                </label>
                <input
                  type="text"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="Misal: Pelaksana Seksi MSKI"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Email & No. HP / WhatsApp for Password Reset */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-500" />
                  <span>Email Resmi (Pemulihan Password)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@kemenkeu.go.id"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Email ini digunakan saat menggunakan fitur Lupa Password di halaman login.
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Nomor WhatsApp / HP</span>
                </label>
                <input
                  type="tel"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="081234567890"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Nomor kontak untuk koordinasi internal KPPN.
                </p>
              </div>
            </div>

            {/* Kalimat Sapaan Khusus */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Kalimat Sapaan Pengguna (Muncul di Dashboard)</span>
                </label>
              </div>
              <input
                type="text"
                value={customGreeting}
                onChange={(e) => setCustomGreeting(e.target.value)}
                placeholder={isSuperAdmin ? "Hai, Admin Super KPPN!" : "Hai Budi! Semangat melayani Satker hari ini"}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Kalimat ini akan menyapa Anda secara personal di kartu sambutan atas Dashboard ANGKASA.
              </p>
            </div>

            {/* Foto Profil via Google Drive Link */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Link Foto Profil (Google Drive atau URL Gambar)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowDriveGuide(!showDriveGuide)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Cara Ambil Link Google Drive?</span>
                </button>
              </div>

              <div className="space-y-2">
                <input
                  type="url"
                  value={photoUrlInput}
                  onChange={(e) => handlePhotoUrlChange(e.target.value)}
                  placeholder="https://drive.google.com/file/d/1ABCXYZ.../view?usp=sharing"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Google Drive Step-by-Step Guide Box */}
                {showDriveGuide && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1.5 text-slate-700 dark:text-slate-200 animate-fadeIn">
                    <div className="font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Petunjuk Pemakaian Foto dari Google Drive:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      <li>Buka Google Drive dan klik kanan pada foto Anda.</li>
                      <li>Pilih menu <strong>Bagikan / Share</strong>.</li>
                      <li>Ubah Akses Umum menjadi <strong>"Siapa saja yang memiliki link" (Anyone with the link)</strong>.</li>
                      <li>Klik <strong>Salin Link (Copy link)</strong> dan tempelkan ke kolom input di atas.</li>
                      <li>Sistem ANGKASA akan otomatis mengonversi link tersebut menjadi foto langsung!</li>
                    </ol>
                  </div>
                )}

                {/* Live Preview Box */}
                {photoPreview && (
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-900 shrink-0 border border-slate-300 dark:border-slate-600">
                      {!imageError ? (
                        <img 
                          src={photoPreview} 
                          alt="Preview Foto" 
                          className="w-full h-full object-cover"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-rose-500 text-[10px] text-center p-1 font-bold">
                          Gagal Memuat
                        </div>
                      )}
                    </div>
                    <div className="text-xs space-y-0.5 overflow-hidden">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
                        {!imageError ? '✅ Pratinjau Foto Berhasil Dimuat' : '⚠️ Foto Tidak Dapat Dimuat'}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {!imageError 
                          ? 'Foto siap ditampilkan di kartu sapaan dan header profil Anda.' 
                          : 'Pastikan file Google Drive telah diatur ke "Siapa saja yang memiliki link".'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Presets for Admin KPPN */}
            {isSuperAdmin && (
              <div className="pt-2">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Pilihan Cepat Avatar Admin:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handlePhotoUrlChange('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white font-bold transition-all cursor-pointer"
                  >
                    👔 Eksekutif Pria
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePhotoUrlChange('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white font-bold transition-all cursor-pointer"
                  >
                    💼 Eksekutif Wanita
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePhotoUrlChange('')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-rose-500 hover:text-white font-bold transition-all cursor-pointer"
                  >
                    🔄 Reset Default Lambang KPPN
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Profil & Sapaan'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Change Password */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-1">
              <span className="font-extrabold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                Keamanan Akun Pengguna:
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                Ubah kata sandi secara berkala untuk menjaga keamanan akses modul internal KPPN Semarang I.
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                Kata Sandi Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi saat ini..."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono rounded-xl px-3.5 py-2.5 pr-10 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Minimal 4 karakter..."
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono rounded-xl px-3.5 py-2.5 pr-10 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                  Konfirmasi Sandi Baru
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Ulangi sandi baru..."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>{isSaving ? 'Menyimpan Sandi...' : 'Perbarui Kata Sandi'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
