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
  LogIn,
  Palette,
  Check,
  RotateCcw,
  X,
  Paintbrush,
  Sun,
  Moon
} from 'lucide-react';
import { AppUser, AppTheme, NavigationTab, BannerColorTheme } from '../types';
import { normalizeImageUrl } from '../utils/imageUrlHelper';
import { 
  BANNER_THEME_PRESETS, 
  BannerPresetDefinition, 
  getPresetById, 
  getDefaultPresetId 
} from '../utils/bannerThemePresets';
import { updateUserProfile } from '../utils/userManager';
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/safeStorage';

interface UserGreetingBannerProps {
  currentUser: AppUser | null;
  onOpenProfileModal: (tab?: 'profile' | 'password' | 'theme') => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
  theme?: AppTheme;
  activeTab?: NavigationTab;
  onNavigateToDashboard?: () => void;
  onUserUpdated?: (updatedUser: AppUser) => void;
}

export const UserGreetingBanner: React.FC<UserGreetingBannerProps> = ({
  currentUser,
  onOpenProfileModal,
  onOpenLoginModal,
  onLogout,
  onNavigateToAdmin,
  theme = 'light',
  activeTab,
  onNavigateToDashboard,
  onUserUpdated
}) => {
  const isDark = theme === 'dark';
  const [imageError, setImageError] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  
  // Color Customization State
  const [showColorEditor, setShowColorEditor] = useState<boolean>(false);
  const [editorSubTab, setEditorSubTab] = useState<'presets' | 'custom'>('presets');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const defaultPresetId = getDefaultPresetId(isSuperAdmin);

  // Initialize selected theme
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    if (currentUser?.bannerColorTheme) {
      if (typeof currentUser.bannerColorTheme === 'string') {
        return currentUser.bannerColorTheme;
      }
      if (currentUser.bannerColorTheme.presetId) {
        return currentUser.bannerColorTheme.presetId;
      }
    }
    const local = safeLocalStorageGet(`kppn_banner_theme_${currentUser?.id || 'guest'}`);
    return local || defaultPresetId;
  });

  // Custom colors state if user chooses custom mode
  const [customFrom, setCustomFrom] = useState<string>('#1e1b4b');
  const [customVia, setCustomVia] = useState<string>('#312e81');
  const [customTo, setCustomTo] = useState<string>('#0f172a');
  const [customBorder, setCustomBorder] = useState<string>('#6366f1');
  const [customText, setCustomText] = useState<string>('#e0e7ff');

  // Sync theme when user changes
  useEffect(() => {
    if (currentUser?.bannerColorTheme) {
      if (typeof currentUser.bannerColorTheme === 'string') {
        setActiveThemeId(currentUser.bannerColorTheme);
      } else if (currentUser.bannerColorTheme.presetId) {
        setActiveThemeId(currentUser.bannerColorTheme.presetId);
        if (currentUser.bannerColorTheme.presetId === 'custom') {
          if (currentUser.bannerColorTheme.customGradientFrom) setCustomFrom(currentUser.bannerColorTheme.customGradientFrom);
          if (currentUser.bannerColorTheme.customGradientVia) setCustomVia(currentUser.bannerColorTheme.customGradientVia);
          if (currentUser.bannerColorTheme.customGradientTo) setCustomTo(currentUser.bannerColorTheme.customGradientTo);
          if (currentUser.bannerColorTheme.customBorderColor) setCustomBorder(currentUser.bannerColorTheme.customBorderColor);
          if (currentUser.bannerColorTheme.customTextColor) setCustomText(currentUser.bannerColorTheme.customTextColor);
        }
      }
    } else {
      const local = safeLocalStorageGet(`kppn_banner_theme_${currentUser?.id || 'guest'}`);
      setActiveThemeId(local || defaultPresetId);
    }
  }, [currentUser?.id, currentUser?.bannerColorTheme, defaultPresetId]);

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

  const photoUrl = currentUser?.photoUrl ? normalizeImageUrl(currentUser.photoUrl) : '';
  const activePresetDef = getPresetById(activeThemeId);
  const isCustomActive = activeThemeId === 'custom';

  // Apply theme selection immediately and persist
  const handleSelectPreset = async (presetId: string, persistNow: boolean = true) => {
    setActiveThemeId(presetId);
    safeLocalStorageSet(`kppn_banner_theme_${currentUser?.id || 'guest'}`, presetId);

    if (persistNow && currentUser) {
      await handleSaveThemeToAccount(presetId);
    }
  };

  // Save selected theme to User Profile & Database
  const handleSaveThemeToAccount = async (presetToSave?: string) => {
    const targetPreset = presetToSave || activeThemeId;
    safeLocalStorageSet(`kppn_banner_theme_${currentUser?.id || 'guest'}`, targetPreset);

    if (currentUser) {
      try {
        let themeData: BannerColorTheme | string;
        if (targetPreset === 'custom') {
          themeData = {
            presetId: 'custom',
            name: 'Kustom Bebas',
            customGradientFrom: customFrom,
            customGradientVia: customVia,
            customGradientTo: customTo,
            customBorderColor: customBorder,
            customTextColor: customText
          };
        } else {
          themeData = targetPreset;
        }

        const res = await updateUserProfile(currentUser.id, {
          bannerColorTheme: themeData
        });

        if (res.success && res.user && onUserUpdated) {
          onUserUpdated(res.user);
        }
        setSaveSuccessMsg('Warna banner berhasil disimpan permanen!');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      } catch (err) {
        console.error('Failed to save banner theme:', err);
      }
    } else {
      setSaveSuccessMsg('Warna banner berhasil diterapkan!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  // Reset to default role color
  const handleResetToDefault = async () => {
    const fallbackId = getDefaultPresetId(isSuperAdmin);
    setActiveThemeId(fallbackId);
    safeLocalStorageSet(`kppn_banner_theme_${currentUser?.id || 'guest'}`, fallbackId);

    if (currentUser) {
      try {
        const res = await updateUserProfile(currentUser.id, {
          bannerColorTheme: fallbackId
        });
        if (res.success && res.user && onUserUpdated) {
          onUserUpdated(res.user);
        }
      } catch (err) {
        console.error('Failed to reset banner theme:', err);
      }
    }
    setSaveSuccessMsg('Warna dikembalikan ke setelan standar.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Dynamic CSS & Styles for Banner
  const containerClasses = isCustomActive
    ? 'relative overflow-hidden rounded-3xl border shadow-xl p-5 sm:p-6 mb-6 transition-all duration-300'
    : `relative overflow-hidden rounded-3xl border shadow-xl p-5 sm:p-6 mb-6 transition-all duration-300 ${
        isDark 
          ? `${activePresetDef.darkBgClass} ${activePresetDef.darkBorderClass}` 
          : `${activePresetDef.lightBgClass} ${activePresetDef.lightBorderClass}`
      }`;

  const customContainerStyle = isCustomActive ? {
    background: `linear-gradient(to right, ${customFrom}, ${customVia}, ${customTo})`,
    borderColor: customBorder,
    color: customText
  } : undefined;

  const glowColorClass = isDark ? activePresetDef.glowColorDark : activePresetDef.glowColorLight;
  const badgeClass = isDark ? activePresetDef.badgeClassDark : activePresetDef.badgeClassLight;
  const headingTextClass = isCustomActive 
    ? 'text-white drop-shadow-sm' 
    : (isDark ? activePresetDef.darkTextGradient : activePresetDef.lightTextGradient);

  // Render when user is logged in (Super Admin or Pegawai)
  if (currentUser) {
    const greetingText = currentUser.customGreeting || 
      (isSuperAdmin ? 'Hai, Admin Super KPPN!' : `Hai, ${currentUser.displayName}!`);

    return (
      <div className={containerClasses} style={customContainerStyle}>
        {/* Luxury Background Glow */}
        <div className={`absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl pointer-events-none ${glowColorClass}`} />
        <div className="absolute -bottom-10 left-1/3 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left Avatar & Greeting */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar Circle with Glow */}
            <div className="relative group shrink-0">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-0.5 shadow-xl flex items-center justify-center overflow-hidden border-2 ${
                isCustomActive 
                  ? 'border-white/80 bg-white/10 backdrop-blur-xs' 
                  : activePresetDef.avatarRing
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
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeClass}`}>
                  {isSuperAdmin ? <Crown className="w-3.5 h-3.5 text-amber-500" /> : <Building2 className="w-3.5 h-3.5 text-emerald-500" />}
                  <span>{isSuperAdmin ? 'ADMIN SUPER KPPN' : 'PEGAWAI KPPN'}</span>
                </span>
                
                <span className="text-[11px] font-mono font-bold opacity-75">
                  @{currentUser.username}
                </span>

                {currentTimeStr && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] opacity-75 font-semibold ml-1">
                    <Clock className="w-3 h-3 opacity-60" />
                    <span>{currentTimeStr}</span>
                  </span>
                )}
              </div>

              {/* Personalized Greeting */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2">
                <span className="animate-bounce">👋</span>
                <span className={`${isCustomActive ? '' : 'bg-clip-text text-transparent'} ${headingTextClass}`}>
                  {greetingText}
                </span>
              </h2>

              <p className="text-xs opacity-85 font-medium">
                {currentUser.displayName} • {currentUser.jabatan || 'Staff Perbendaharaan'} ({currentUser.seksi || 'KPPN Semarang I'})
              </p>

              {/* Quick In-Place Color Palette Bar (Ganti Warna Langsung di Sini) */}
              <div className="pt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-1 opacity-80">
                  <Palette className="w-3.5 h-3.5 text-amber-500" />
                  <span>Warna Tema:</span>
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {BANNER_THEME_PRESETS.map((preset) => {
                    const isSelected = activeThemeId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id, true)}
                        title={`Pilih tema: ${preset.name} (${preset.subtitle})`}
                        className={`group relative w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
                          isSelected 
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-lg' 
                            : 'hover:scale-125 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <span className={`w-full h-full rounded-full bg-gradient-to-tr ${preset.previewGradient} shadow-xs border border-white/50 block`} />
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setShowColorEditor(!showColorEditor)}
                    className="ml-1 text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 border border-white/30 transition-all flex items-center gap-1 cursor-pointer"
                    title="Buka panel kustom warna lengkap & kustom bebas"
                  >
                    <span>{showColorEditor ? 'Tutup Opsi' : '⚙️ Kustom / Lengkap'}</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${showColorEditor ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/40 dark:border-slate-800/40">
            {/* TOMBOL EDIT WARNA DI SINI */}
            <button
              onClick={() => setShowColorEditor(!showColorEditor)}
              className={`font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 border ${
                showColorEditor
                  ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 shadow-amber-500/20'
                  : 'bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700'
              }`}
              title="Edit dan sesuaikan warna banner sambutan & profil di sini"
            >
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              <span>Edit Warna</span>
              <span 
                className={`w-3 h-3 rounded-full border border-white/60 shadow-xs bg-gradient-to-r ${activePresetDef.previewGradient}`} 
                title={`Warna aktif: ${activePresetDef.name}`}
              />
            </button>

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
                onClick={activeTab === 'admin' ? (onNavigateToDashboard || (() => {})) : onNavigateToAdmin}
                className={`font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white ring-2 ring-emerald-400/40'
                    : isSuperAdmin
                      ? 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                }`}
                title={activeTab === 'admin' ? "Buka Dashboard IKPA Utama" : "Buka Modul Admin Control Center"}
              >
                {activeTab === 'admin' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                    <span>✓ Sedang di Modul Admin</span>
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Buka Modul Admin</span>
                  </>
                )}
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

        {/* INLINE COLOR CUSTOMIZATION PANEL (DISINI) */}
        {showColorEditor && (
          <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-slate-800/60 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-indigo-200/80 dark:border-indigo-500/30 shadow-2xl text-slate-900 dark:text-slate-100">
              {/* Panel Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                      <span>Pengaturan Warna Banner &amp; Kartu Sambutan</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                        ● Pratinjau Langsung
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Pilih dari 12 preset elegan siap pakai atau kustomisasi warna gradien sesuka Anda.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Tab Selector */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setEditorSubTab('presets')}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        editorSubTab === 'presets'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>12 Preset Elegan</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditorSubTab('custom');
                        setActiveThemeId('custom');
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        editorSubTab === 'custom'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Paintbrush className="w-3.5 h-3.5" />
                      <span>Kustom Bebas</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowColorEditor(false)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                    title="Tutup Panel Warna"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Message Notification */}
              {saveSuccessMsg && (
                <div className="my-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                </div>
              )}

              {/* TAB 1: 12 PRESETS GRID */}
              {editorSubTab === 'presets' && (
                <div className="py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {BANNER_THEME_PRESETS.map((preset) => {
                      const isSelected = activeThemeId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset.id)}
                          className={`group relative text-left p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                            isSelected
                              ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-md ring-2 ring-indigo-500/30 scale-[1.02]'
                              : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01]'
                          }`}
                        >
                          {/* Color Swatch Bar */}
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

                          {/* Info Text */}
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {preset.name}
                              </h4>
                              {isSelected && (
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                                  ✓ Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {preset.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: CUSTOM COLOR PICKER */}
              {editorSubTab === 'custom' && (
                <div className="py-4 space-y-4">
                  <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
                    <p className="font-bold flex items-center gap-1.5 mb-1">
                      <Paintbrush className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Rancang Warna Sendiri:</span>
                    </p>
                    <p className="text-[11px] opacity-80">
                      Ubah kombinasi warna gradien kiri, tengah, kanan, bingkai (border), dan warna teks di bawah. Perubahan langsung tercermin di banner!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                    {/* Color 1: From */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                        Warna Kiri (Awal)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customFrom}
                          onChange={(e) => setCustomFrom(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={customFrom}
                          onChange={(e) => setCustomFrom(e.target.value)}
                          className="flex-1 text-xs font-mono font-bold uppercase px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    {/* Color 2: Via */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                        Warna Tengah (Via)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customVia}
                          onChange={(e) => setCustomVia(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={customVia}
                          onChange={(e) => setCustomVia(e.target.value)}
                          className="flex-1 text-xs font-mono font-bold uppercase px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    {/* Color 3: To */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                        Warna Kanan (Akhir)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customTo}
                          onChange={(e) => setCustomTo(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={customTo}
                          onChange={(e) => setCustomTo(e.target.value)}
                          className="flex-1 text-xs font-mono font-bold uppercase px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    {/* Color 4: Border */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                        Warna Bingkai (Border)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customBorder}
                          onChange={(e) => setCustomBorder(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={customBorder}
                          onChange={(e) => setCustomBorder(e.target.value)}
                          className="flex-1 text-xs font-mono font-bold uppercase px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    {/* Color 5: Text */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                        Warna Teks Aksen
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600 p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          className="flex-1 text-xs font-mono font-bold uppercase px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Color Swatches */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-500 font-bold">Inspirasi Cepat:</span>
                    {[
                      { name: 'Navy & Emas', f: '#0f172a', v: '#1e293b', t: '#78350f', b: '#f59e0b', txt: '#fef3c7' },
                      { name: 'Aurora Hijau', f: '#022c22', v: '#064e3b', t: '#0f766e', b: '#10b981', txt: '#d1fae5' },
                      { name: 'Ungu Nebula', f: '#2e1065', v: '#581c87', t: '#3b0764', b: '#a855f7', txt: '#f3e8ff' },
                      { name: 'Deep Crimson', f: '#450a0a', v: '#881337', t: '#1c1917', b: '#f43f5e', txt: '#ffe4e6' },
                      { name: 'Ocean Cyan', f: '#082f49', v: '#075985', t: '#164e63', b: '#06b6d4', txt: '#cffafe' },
                      { name: 'Matte Obsidian', f: '#09090b', v: '#18181b', t: '#27272a', b: '#52525b', txt: '#fafafa' }
                    ].map((pal, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCustomFrom(pal.f);
                          setCustomVia(pal.v);
                          setCustomTo(pal.t);
                          setCustomBorder(pal.b);
                          setCustomText(pal.txt);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px] flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.b }} />
                        <span>{pal.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Panel Footer Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Kembalikan ke Standar ({isSuperAdmin ? 'Emas Kemenkeu' : 'Zamrud'})</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowColorEditor(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveThemeToAccount()}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Simpan Pilihan Warna</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render when guest / public / Satker user
  return (
    <div className={`relative overflow-hidden rounded-3xl border shadow-lg p-5 sm:p-6 mb-6 transition-all ${
      isDark 
        ? `${activePresetDef.darkBgClass} ${activePresetDef.darkBorderClass}` 
        : `${activePresetDef.lightBgClass} ${activePresetDef.lightBorderClass}`
    }`}>
      {/* Luxury Background Glow */}
      <div className={`absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl pointer-events-none ${glowColorClass}`} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
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
            <p className="text-xs opacity-75">
              Satuan kerja dapat memantau data IKPA, Capaian Output, Presensi &amp; Layanan tanpa login.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowColorEditor(!showColorEditor)}
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            title="Ganti Warna Tampilan Banner Ini"
          >
            <Palette className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Warna Banner</span>
          </button>

          <button
            onClick={onOpenLoginModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Login Pegawai / Admin KPPN</span>
          </button>
        </div>
      </div>

      {/* Guest color switcher panel */}
      {showColorEditor && (
        <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 animate-in fade-in">
          <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-500" />
                Pilih Warna Banner Satker / Publik:
              </span>
              <button
                onClick={() => setShowColorEditor(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {BANNER_THEME_PRESETS.slice(0, 6).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`p-2 rounded-xl text-left border cursor-pointer transition-all ${
                    activeThemeId === preset.id
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-full h-4 rounded-lg bg-gradient-to-r ${preset.previewGradient} mb-1`} />
                  <span className="text-[11px] block truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
