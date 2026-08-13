import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  AlertTriangle, 
  FileSpreadsheet, 
  Send, 
  BookOpen, 
  Building2, 
  ShieldCheck,
  Search,
  RefreshCw,
  Zap,
  Megaphone,
  Sun,
  Moon,
  Award,
  Sparkles,
  Calculator,
  Lock,
  KeyRound,
  LogOut,
  Eye,
  EyeOff,
  UserCheck,
  LifeBuoy,
  Presentation,
  Link2
} from 'lucide-react';
import { NavigationTab, AppTheme, MenuVisibilityConfig } from '../types';
import { AdminLoginModal } from './AdminLoginModal';

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  satkerCount: number;
  redFlagsCount: number;
  belumCapaianCount?: number;
  sertifikasiUnapprovedCount?: number;
  announcementsCount?: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onResetData: () => void;
  lastUpdateDate: string;
  theme: AppTheme;
  toggleTheme: () => void;
  menuVisibility?: MenuVisibilityConfig;
  isAdminAuthenticated?: boolean;
  onAuthenticateAdmin?: (pin: string) => boolean;
  onLogoutAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  satkerCount,
  redFlagsCount,
  belumCapaianCount = 0,
  sertifikasiUnapprovedCount = 0,
  announcementsCount = 0,
  searchQuery,
  setSearchQuery,
  onResetData,
  lastUpdateDate,
  theme,
  toggleTheme,
  menuVisibility,
  isAdminAuthenticated = false,
  onAuthenticateAdmin,
  onLogoutAdmin
}) => {
  const isDark = theme === 'dark';
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isSatkerPreviewMode, setIsSatkerPreviewMode] = useState<boolean>(false);

  const tabs: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: React.ReactNode; activeColor: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard IKPA',
      icon: <BarChart3 className="w-4 h-4" />,
      badge: <span className="bg-slate-900/60 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">{satkerCount}</span>,
      activeColor: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
    },
    {
      id: 'capaian-output',
      label: 'Capaian Output SAKTI',
      icon: <Zap className="w-4 h-4 text-sky-300" />,
      badge: belumCapaianCount > 0 ? (
        <span className="bg-rose-950 text-rose-200 border border-rose-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold animate-pulse">
          {belumCapaianCount} Belum
        </span>
      ) : (
        <span className="bg-sky-950 text-sky-200 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold">SAKTI</span>
      ),
      activeColor: 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 ring-1 ring-sky-400/40'
    },
    {
      id: 'redflags',
      label: 'Perlu Perhatian',
      icon: <AlertTriangle className="w-4 h-4 text-amber-300" />,
      badge: redFlagsCount > 0 ? (
        <span className="bg-rose-950 text-rose-200 border border-rose-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">
          {redFlagsCount}
        </span>
      ) : undefined,
      activeColor: 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-rose-400/40'
    },
    {
      id: 'sertifikasi',
      label: 'Sertifikasi Pejabat',
      icon: <Award className="w-4 h-4 text-amber-300" />,
      badge: sertifikasiUnapprovedCount > 0 ? (
        <span className="bg-amber-950 text-amber-200 border border-amber-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">
          {sertifikasiUnapprovedCount} Belum
        </span>
      ) : undefined,
      activeColor: 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/40'
    },
    {
      id: 'per5-analisis',
      label: 'Analisis PER-5/PB/2024',
      icon: <Calculator className="w-4 h-4 text-emerald-300" />,
      badge: <span className="bg-emerald-950 text-emerald-200 border border-emerald-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">PER-5</span>,
      activeColor: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
    },
    {
      id: 'announcements',
      label: 'Pengumuman',
      icon: <Megaphone className="w-4 h-4 text-amber-300" />,
      badge: (
        <span className="bg-amber-950 text-amber-200 border border-amber-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">
          {announcementsCount > 0 ? `${announcementsCount}` : 'Info'}
        </span>
      ),
      activeColor: 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/40'
    },
    {
      id: 'materi-slide',
      label: 'Materi Slide',
      icon: <Presentation className="w-4 h-4 text-indigo-300" />,
      badge: <span className="bg-indigo-950 text-indigo-200 border border-indigo-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">Slide</span>,
      activeColor: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/40'
    },
    {
      id: 'portal-link',
      label: '🔗 Link Sosialisasi',
      icon: <Link2 className="w-4 h-4 text-emerald-300" />,
      badge: <span className="bg-emerald-950 text-emerald-200 border border-emerald-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">Sosialisasi</span>,
      activeColor: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
    },
    {
      id: 'pengetahuan',
      label: 'Pengetahuan & Juknis',
      icon: <BookOpen className="w-4 h-4 text-indigo-300" />,
      badge: <span className="bg-indigo-950 text-indigo-200 border border-indigo-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">SAKTI</span>,
      activeColor: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/40'
    },
    {
      id: 'aduan',
      label: 'Lapor Aduan Satker',
      icon: <LifeBuoy className="w-4 h-4 text-rose-300" />,
      badge: <span className="bg-rose-950 text-rose-200 border border-rose-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">Lapor</span>,
      activeColor: 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-rose-400/40'
    },
    {
      id: 'admin',
      label: '🛠️ Panel Edit Admin',
      icon: <ShieldCheck className="w-4 h-4 text-amber-300" />,
      activeColor: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-xl shadow-indigo-600/50 ring-2 ring-indigo-300 font-black'
    },
    {
      id: 'reminder',
      label: 'Pengingat WA',
      icon: <Send className="w-4 h-4" />,
      activeColor: 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400/40'
    },
    {
      id: 'guide',
      label: 'Panduan',
      icon: <BookOpen className="w-4 h-4" />,
      activeColor: 'bg-slate-700 text-white shadow-md shadow-slate-900/50'
    }
  ];

  return (
    <header className={`${
      isDark ? 'bg-slate-950/95 border-slate-800/90 text-white backdrop-blur-md' : 'bg-white/95 border-slate-200 text-slate-900 backdrop-blur-md shadow-xs'
    } border-b sticky top-0 z-30 shadow-md transition-colors duration-300 ease-in-out`}>
      {/* Top Bar Banner */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Identity & Sub-header */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-900/40 shrink-0 cursor-pointer"
            >
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className={`text-base sm:text-lg font-black tracking-tight leading-tight flex items-center gap-1.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  IKPA MONITORING
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse hidden sm:inline-block" />
                </h1>
                <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${
                  isDark ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  KPPN Semarang I (026)
                </span>
              </div>
              <p className={`text-[10px] sm:text-xs truncate max-w-[260px] sm:max-w-none ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Direktorat Jenderal Perbendaharaan • Kanwil DJPb Jawa Tengah
              </p>
            </div>
          </div>

          {/* Controls & Quick Stats */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
            
            {/* Animated Theme Toggle Button (Light/Dark Mode) */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className={`relative flex items-center justify-between gap-2 px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer shadow-md overflow-hidden shrink-0 min-h-[40px] sm:min-h-[44px] ${
                isDark 
                  ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border-amber-500/50 text-amber-300 shadow-amber-950/30 ring-1 ring-amber-500/20' 
                  : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 border-amber-400 text-slate-950 shadow-amber-500/20 ring-2 ring-amber-400/50'
              }`}
              title={isDark ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.div
                    key="dark-mode-toggle"
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-1.5"
                  >
                    <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300">
                      <Sun className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-xs font-extrabold text-amber-200 hidden sm:inline">☀️ Light</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="light-mode-toggle"
                    initial={{ y: -20, opacity: 0, rotate: 90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: -90 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-1.5"
                  >
                    <div className="p-1 rounded-lg bg-slate-900/20 text-slate-900">
                      <Moon className="w-4 h-4 text-slate-900" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 hidden sm:inline">🌙 Dark</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Search Box */}
            <div className="relative flex-1 min-w-0 md:min-w-[220px]">
              <Search className={`w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                isDark ? 'text-slate-400' : 'text-slate-400'
              }`} />
              <input
                type="text"
                placeholder="Cari Satker, Kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs rounded-xl pl-8 sm:pl-9 pr-3 py-2 border focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all min-h-[40px] sm:min-h-[44px] ${
                  isDark 
                    ? 'bg-slate-900 text-slate-100 border-slate-800 placeholder:text-slate-500' 
                    : 'bg-slate-100 text-slate-900 border-slate-300 placeholder:text-slate-500 focus:bg-white'
                }`}
              />
            </div>

            {/* Admin Login / Logout Button */}
            {!isAdminAuthenticated ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-sky-600/20 border border-sky-400/30 transition-all cursor-pointer shrink-0 min-h-[40px] sm:min-h-[44px]"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Login Admin</span>
              </motion.button>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setActiveTab('admin')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all cursor-pointer min-h-[40px] sm:min-h-[44px]"
                  title="Masuk ke Modul Admin"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Admin Mode</span>
                </button>

                <button
                  onClick={() => {
                    if (onLogoutAdmin) onLogoutAdmin();
                  }}
                  className="flex items-center justify-center p-2 text-xs font-bold rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all cursor-pointer min-h-[40px] sm:min-h-[44px]"
                  title="Keluar Sesi Admin"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                </button>
              </div>
            )}

            {/* Reset Data Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={onResetData}
              title="Reset ke Data Bawaan KPPN Semarang I (026)"
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer shrink-0 min-h-[40px] sm:min-h-[44px] ${
                isDark 
                  ? 'text-slate-300 bg-slate-900 hover:bg-slate-800 border-slate-800' 
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Reset</span>
            </motion.button>

            {/* Status Badge */}
            <div className={`hidden lg:flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border shrink-0 ${
              isDark ? 'text-slate-300 bg-slate-900 border-slate-800' : 'text-slate-700 bg-slate-100 border-slate-300'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Update: <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>{lastUpdateDate}</strong></span>
            </div>
          </div>

        </div>

        {/* Admin Exclusive Status & Simulator Strip */}
        {isAdminAuthenticated && (
          <div className="mt-2.5 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 p-2.5 rounded-2xl border border-sky-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
              <span className="font-extrabold text-sky-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                SESI ADMIN EKSKLUSIF AKTIF:
              </span>
              <span className="text-slate-300 text-[11px] hidden md:inline">
                Akses penuh Olah Excel, WhatsApp Gateway, Pengumuman &amp; Kunci Menu Satker.
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setIsSatkerPreviewMode(!isSatkerPreviewMode)}
                className={`px-3 py-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSatkerPreviewMode 
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm' 
                    : 'bg-slate-800 text-sky-200 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {isSatkerPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{isSatkerPreviewMode ? 'Mode Simulasi Satker: ON 🟢' : 'Simulasi Tampilan Satker'}</span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className="px-3 py-1 rounded-xl text-[11px] font-extrabold bg-sky-600 hover:bg-sky-500 text-white border border-sky-400/40 cursor-pointer"
              >
                Ke Tab Admin &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs - Responsive Flex Wrap so all tabs including Pengumuman are clearly visible */}
        <nav className={`mt-3 flex flex-wrap items-center gap-1.5 border-t pt-2.5 pb-1 ${
          isDark ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          {tabs
            .filter((t) => {
              if (t.id === 'admin') return true;
              if (isAdminAuthenticated && !isSatkerPreviewMode) return true; // Admin sees all tabs unless simulating Satker
              if (menuVisibility && menuVisibility[t.id as keyof MenuVisibilityConfig] === false) {
                return false; // Hide disabled tabs for Satker users
              }
              return true;
            })
            .map((t) => {
              const isActive = activeTab === t.id;
              const isDisabledForSatker = menuVisibility && menuVisibility[t.id as keyof MenuVisibilityConfig] === false;

              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`relative flex items-center gap-2 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap snap-start min-h-[42px] touch-manipulation ${
                    isActive
                      ? t.activeColor
                      : t.id === 'admin'
                        ? 'bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-indigo-200 border-2 border-indigo-500/60 hover:border-indigo-400 shadow-md hover:bg-indigo-900/80 font-black'
                        : isDark 
                          ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 rounded-xl bg-white/10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {t.icon}
                    <span>{t.label}</span>
                    {t.badge}
                    {isAdminAuthenticated && isDisabledForSatker && (
                      <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5" title="Menu ini saat ini dinonaktifkan untuk Satker">
                        <Lock className="w-2.5 h-2.5" /> Off
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
        </nav>
      </div>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onAuthenticateAdmin={(pin) => {
          if (onAuthenticateAdmin) {
            const success = onAuthenticateAdmin(pin);
            if (success) {
              setActiveTab('admin');
            }
            return success;
          }
          return false;
        }}
        theme={theme}
      />
    </header>
  );
};

