import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Crown, 
  Building2, 
  User, 
  KeyRound, 
  LogOut, 
  ShieldCheck, 
  Clock, 
  Calendar,
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  BadgeCheck,
  Zap,
  LogIn
} from 'lucide-react';
import { AppUser, AppTheme } from '../types';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface UserGreetingBannerProps {
  currentUser: AppUser | null;
  onOpenProfileModal: (tab?: 'profile' | 'password') => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
  theme?: AppTheme;
}

export const UserGreetingBanner: React.FC<UserGreetingBannerProps> = ({
  currentUser,
  onOpenProfileModal,
  onOpenLoginModal,
  onLogout,
  onNavigateToAdmin,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const [imageError, setImageError] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const timePart = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
      setCurrentTimeStr(`${datePart} • ${timePart}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const photoUrl = currentUser?.photoUrl ? normalizeImageUrl(currentUser.photoUrl) : '';

  // Render when user is logged in (Super Admin or Pegawai)
  if (currentUser) {
    const greetingText = currentUser.customGreeting || 
      (isSuperAdmin ? 'Hai, Admin Super KPPN!' : `Hai, ${currentUser.displayName}!`);

    return (
      <div className={`relative overflow-hidden rounded-3xl border shadow-xl p-5 sm:p-6 mb-6 transition-all duration-300 ${
        isSuperAdmin
          ? (isDark 
              ? 'bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-amber-500/40 text-white shadow-amber-950/20' 
              : 'bg-gradient-to-r from-amber-500/10 via-indigo-50/70 to-purple-50/50 border-amber-300/80 text-slate-900 shadow-indigo-500/5')
          : (isDark 
              ? 'bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900 border-emerald-500/40 text-white shadow-emerald-950/20' 
              : 'bg-gradient-to-r from-emerald-500/10 via-teal-50/70 to-sky-50/50 border-emerald-300/80 text-slate-900 shadow-emerald-500/5')
      }`}>
        {/* Luxury Background Glow */}
        <div className={`absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          isSuperAdmin ? 'bg-amber-500/15' : 'bg-emerald-500/15'
        }`} />
        <div className="absolute -bottom-10 left-1/3 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left Avatar & Greeting */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar Circle with Glow */}
            <div className="relative group shrink-0">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-0.5 shadow-xl flex items-center justify-center overflow-hidden border-2 ${
                isSuperAdmin 
                  ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 border-amber-400' 
                  : 'bg-gradient-to-tr from-emerald-400 via-teal-500 to-sky-600 border-emerald-400'
              }`}>
                {photoUrl && !imageError ? (
                  <img 
                    src={photoUrl} 
                    alt={currentUser.displayName} 
                    className="w-full h-full object-cover rounded-[14px]"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className={`w-full h-full rounded-[14px] flex items-center justify-center font-black text-xl sm:text-2xl ${
                    isDark ? 'bg-slate-900 text-amber-300' : 'bg-white text-indigo-700 shadow-inner'
                  }`}>
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              <button
                onClick={() => onOpenProfileModal('profile')}
                className={`absolute -bottom-1 -right-1 p-1 rounded-full text-slate-950 shadow-md hover:scale-110 transition-transform cursor-pointer ${
                  isSuperAdmin ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                title="Ganti Foto Profil / Sapaan"
              >
                {isSuperAdmin ? <Crown className="w-3.5 h-3.5" /> : <BadgeCheck className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Title & Greeting Texts */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isSuperAdmin 
                    ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40' 
                    : 'bg-emerald-400/20 text-emerald-800 dark:text-emerald-300 border border-emerald-400/40'
                }`}>
                  {isSuperAdmin ? <Crown className="w-3.5 h-3.5 text-amber-500" /> : <Building2 className="w-3.5 h-3.5 text-emerald-500" />}
                  <span>{isSuperAdmin ? 'ADMIN SUPER KPPN' : 'PEGAWAI KPPN'}</span>
                </span>
                
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                  @{currentUser.username}
                </span>

                {currentTimeStr && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold ml-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{currentTimeStr}</span>
                  </span>
                )}
              </div>

              {/* Personalized Greeting */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2">
                <span className="animate-bounce">👋</span>
                <span className={isSuperAdmin 
                  ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 dark:from-amber-300 dark:via-white dark:to-indigo-300 bg-clip-text text-transparent' 
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 dark:from-emerald-300 dark:via-white dark:to-sky-300 bg-clip-text text-transparent'
                }>
                  {greetingText}
                </span>
              </h2>

              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {currentUser.displayName} • {currentUser.jabatan || 'Staff Perbendaharaan'} ({currentUser.seksi || 'KPPN Semarang I'})
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
            <button
              onClick={() => onOpenProfileModal('profile')}
              className="bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              title="Atur Foto Google Drive & Kalimat Sapaan Anda"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Edit Sapaan &amp; Foto</span>
            </button>

            <button
              onClick={() => onOpenProfileModal('password')}
              className="bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              title="Ubah kata sandi login Anda"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              <span>Ganti Sandi</span>
            </button>

            {onNavigateToAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className={`font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 ${
                  isSuperAdmin
                    ? 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Buka Modul Admin</span>
              </button>
            )}

            <button
              onClick={onLogout}
              className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 font-bold text-xs p-2 sm:px-3 sm:py-2 rounded-xl transition-all cursor-pointer"
              title="Keluar dari sesi ini"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render when guest / public / Satker user
  return (
    <div className={`relative overflow-hidden rounded-3xl border shadow-lg p-5 sm:p-6 mb-6 transition-all ${
      isDark 
        ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/20 text-white' 
        : 'bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/80 border-indigo-200/80 text-slate-900'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
            026
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>PORTAL LAYANAN PUBLIK &amp; MONITORING MITRA SATKER</span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              Selamat Datang di ANGKASA KPPN Semarang I
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Satuan kerja dapat memantau data IKPA, Capaian Output, Presensi &amp; Layanan tanpa login.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenLoginModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95 shrink-0"
        >
          <LogIn className="w-4 h-4" />
          <span>Login Pegawai / Admin KPPN</span>
        </button>
      </div>
    </div>
  );
};
