import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  FileSpreadsheet, 
  Send, 
  BookOpen, 
  Building2, 
  ShieldCheck,
  Search,
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
  Link2,
  ClipboardCheck,
  CreditCard,
  ShoppingBag,
  User,
  Phone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { NavigationTab, AppTheme, MenuVisibilityConfig, MasterSatker } from '../types';
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
  onResetData?: () => void;
  lastUpdateDate: string;
  theme: AppTheme;
  toggleTheme: () => void;
  menuVisibility?: MenuVisibilityConfig;
  tabOrder?: NavigationTab[];
  isAdminAuthenticated?: boolean;
  onAuthenticateAdmin?: (pin: string) => boolean;
  onLogoutAdmin?: () => void;
  masterSatkers?: MasterSatker[];
  transaksiKkpCount?: number;
  transaksiDigipayCount?: number;
  onOpenBroadcastLibrary?: () => void;
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
  tabOrder,
  isAdminAuthenticated = false,
  onAuthenticateAdmin,
  onLogoutAdmin,
  masterSatkers = [],
  transaksiKkpCount = 0,
  transaksiDigipayCount = 0,
  onOpenBroadcastLibrary
}) => {
  const isDark = theme === 'dark';
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [isSatkerPreviewMode, setIsSatkerPreviewMode] = useState<boolean>(false);
  const navScrollRef = useRef<HTMLDivElement>(null);

  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      navScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleTabClick = (tabId: NavigationTab) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const rawTabs: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: React.ReactNode; activeColor: string }[] = [
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
      id: 'pengelolaan-up',
      label: 'Pengelolaan UP/TUP',
      icon: <CreditCard className="w-4 h-4 text-indigo-300" />,
      badge: <span className="bg-indigo-950 text-indigo-200 border border-indigo-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">UP</span>,
      activeColor: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/40'
    },
    {
      id: 'transaksi-kkp',
      label: 'Transaksi KKP / GUP',
      icon: <CreditCard className="w-4 h-4 text-amber-300" />,
      badge: <span className="bg-amber-950 text-amber-200 border border-amber-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">KKP</span>,
      activeColor: 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/40'
    },
    {
      id: 'transaksi-digipay',
      label: 'Transaksi Digipay',
      icon: <ShoppingBag className="w-4 h-4 text-emerald-300" />,
      badge: <span className="bg-emerald-950 text-emerald-200 border border-emerald-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">Digipay</span>,
      activeColor: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/40'
    },
    {
      id: 'kelola-satker',
      label: 'Kelola Data Satker',
      icon: <Building2 className="w-4 h-4 text-sky-300" />,
      badge: <span className="bg-sky-950 text-sky-200 border border-sky-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">{masterSatkers.length} Satker</span>,
      activeColor: 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 ring-1 ring-sky-400/40'
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
      id: 'presensi',
      label: '📋 Presensi Online',
      icon: <ClipboardCheck className="w-4 h-4 text-teal-300" />,
      badge: <span className="bg-teal-950 text-teal-200 border border-teal-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">Absen</span>,
      activeColor: 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 ring-1 ring-teal-400/40'
    }
  ];

  // Dynamic tab ordering based on tabOrder config
  const tabs = useMemo(() => {
    const adminTabItem = {
      id: 'admin' as NavigationTab,
      label: '🛡️ Modul Admin (Control Center)',
      icon: <ShieldCheck className="w-4 h-4 text-amber-300" />,
      badge: <span className="bg-amber-950 text-amber-200 border border-amber-500/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black">Admin</span>,
      activeColor: 'bg-gradient-to-r from-indigo-700 via-purple-700 to-slate-900 text-white shadow-lg shadow-indigo-700/40 ring-2 ring-amber-400/60'
    };

    let baseList = rawTabs;
    if (tabOrder && Array.isArray(tabOrder) && tabOrder.length > 0) {
      const tabMap = new Map(rawTabs.map(t => [t.id, t]));
      const ordered: typeof rawTabs = [];
      
      // First add tabs in configured order
      tabOrder.forEach(tabId => {
        if (tabId !== 'guide' && tabMap.has(tabId)) {
          ordered.push(tabMap.get(tabId)!);
          tabMap.delete(tabId);
        }
      });

      // Append any remaining tabs that weren't in tabOrder (excluding guide)
      tabMap.forEach((t) => {
        if (t.id !== 'guide') {
          ordered.push(t);
        }
      });
      baseList = ordered;
    }

    if (isAdminAuthenticated && !isSatkerPreviewMode) {
      return [adminTabItem, ...baseList];
    }

    return baseList;
  }, [tabOrder, satkerCount, belumCapaianCount, sertifikasiUnapprovedCount, announcementsCount, masterSatkers.length, isAdminAuthenticated, isSatkerPreviewMode]);

  return (
    <header className={`${
      isDark 
        ? 'bg-slate-950/95 border-slate-800/90 text-white backdrop-blur-xl' 
        : 'bg-white/95 border-slate-200/90 text-slate-900 backdrop-blur-xl shadow-xs'
    } border-b sticky top-0 z-30 shadow-md transition-colors duration-300 ease-in-out`}>
      {/* Top Bar Banner with Government Institutional Badge */}
      <div className="max-w-[1680px] 2xl:max-w-[1840px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-2 sm:py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          {/* Identity & Sub-header */}
          <div className="flex items-center space-x-3 shrink-0">
            <div 
              onClick={() => setActiveTab('dashboard')}
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950 p-1 flex items-center justify-center shadow-lg shadow-indigo-950/40 ring-1 ring-amber-500/40 shrink-0 cursor-pointer hover:scale-105 transition-all overflow-hidden border border-slate-700/50"
              title="ANGKASA - Dashboard Utama"
            >
              <img src="/favicon.svg" alt="ANGKASA Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className={`text-base sm:text-lg font-black tracking-tight leading-tight flex items-center gap-1.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  ANGKASA
                  <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    V3.2
                  </span>
                </h1>
                <span className={`text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${
                  isDark ? 'bg-indigo-950/90 text-indigo-300 border-indigo-700/60' : 'bg-slate-900 text-amber-300 border-slate-800'
                }`}>
                  KPPN Semarang I (026)
                </span>
              </div>
              <p className={`text-[10px] sm:text-xs truncate max-w-[320px] sm:max-w-none font-medium ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Aplikasi Navigasi Keuangan &amp; Akselerasi Satuan Kerja • DJPb Kementerian Keuangan
              </p>
            </div>
          </div>

          {/* Center Executive Live Metric Ticker for Wide Screens */}
          <div className="hidden xl:flex items-center gap-2.5 py-1 px-3.5 rounded-2xl border bg-slate-900/5 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-300 dark:border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-slate-600 dark:text-slate-400 text-[11px]">DJPb SAKTI:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-[11px]">Online</span>
            </div>

            <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-300 dark:border-slate-800">
              <span className="font-bold text-slate-600 dark:text-slate-400 text-[11px]">Mitra KPPN:</span>
              <span className="font-black text-slate-900 dark:text-slate-100 text-[11px]">{masterSatkers.length > 0 ? `${masterSatkers.length} Satker` : '127 Satker'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600 dark:text-slate-400 text-[11px]">Target IKPA:</span>
              <span className="font-black text-amber-600 dark:text-amber-400 text-[11px]">≥ 95.00 (Sangat Baik)</span>
            </div>
          </div>

          {/* Controls & Quick Stats */}
          <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto">
            
            {/* Theme Toggle Button (Light/Dark Mode) */}
            <button
              onClick={toggleTheme}
              className={`relative flex items-center justify-between gap-2 px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer shadow-md overflow-hidden shrink-0 min-h-[40px] sm:min-h-[44px] hover:scale-105 active:scale-95 ${
                isDark 
                  ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border-amber-500/50 text-amber-300 shadow-amber-950/30 ring-1 ring-amber-500/20' 
                  : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 border-amber-400 text-slate-950 shadow-amber-500/20 ring-2 ring-amber-400/50'
              }`}
              title={isDark ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
            >
              {isDark ? (
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300">
                    <Sun className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs font-extrabold text-amber-200 hidden sm:inline">☀️ Light</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-lg bg-slate-900/20 text-slate-900">
                    <Moon className="w-4 h-4 text-slate-900" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 hidden sm:inline">🌙 Dark</span>
                </div>
              )}
            </button>

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

            {/* Template Broadcast Quick Access (Admin Only) */}
            {isAdminAuthenticated && onOpenBroadcastLibrary && (
              <button
                onClick={onOpenBroadcastLibrary}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-md border border-rose-400/30 transition-all cursor-pointer shrink-0 min-h-[40px] sm:min-h-[44px] hover:scale-105 active:scale-95"
                title="Buka Katalog Template Broadcast Siap Salin"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Template Broadcast</span>
              </button>
            )}

            {/* Admin Login / Logout Button */}
            {!isAdminAuthenticated ? (
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md shadow-sky-600/20 border border-sky-400/30 transition-all cursor-pointer shrink-0 min-h-[40px] sm:min-h-[44px] hover:scale-105 active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Login Admin</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleTabClick('admin')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer min-h-[40px] sm:min-h-[44px] ${
                    activeTab === 'admin'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md ring-2 ring-emerald-400/50'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                  title="Masuk ke Modul Admin"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Admin Mode</span>
                  <span className="sm:hidden text-[11px]">Admin</span>
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
          <div className="mt-2 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 px-3 py-2 rounded-2xl border border-sky-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-md">
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
                onClick={() => handleTabClick('admin')}
                className={`px-3 py-1 rounded-xl text-[11px] font-extrabold border cursor-pointer transition-all ${
                  activeTab === 'admin'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-sm'
                    : 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400/40'
                }`}
              >
                {activeTab === 'admin' ? '✓ Sedang di Tab Admin' : 'Ke Tab Admin →'}
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs - Horizontally Scrollable Bar on small screens, Flexible Fluid Wrap on wide screens */}
        <div className="relative mt-2 border-t pt-1.5 group">
          {/* Left Arrow Scroll (for smaller / scrollable viewports) */}
          <button
            type="button"
            onClick={() => scrollNav('left')}
            className="hidden sm:flex xl:hidden absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-slate-900/90 text-white items-center justify-center shadow-md border border-slate-700 hover:bg-indigo-600 transition-all cursor-pointer opacity-70 hover:opacity-100"
            title="Geser Menu ke Kiri"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Right Arrow Scroll (for smaller / scrollable viewports) */}
          <button
            type="button"
            onClick={() => scrollNav('right')}
            className="hidden sm:flex xl:hidden absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-slate-900/90 text-white items-center justify-center shadow-md border border-slate-700 hover:bg-indigo-600 transition-all cursor-pointer opacity-70 hover:opacity-100"
            title="Geser Menu ke Kanan"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <nav
            ref={navScrollRef}
            className={`flex items-center gap-1.5 overflow-x-auto xl:flex-wrap no-scrollbar scroll-smooth py-1 px-1 sm:px-2 xl:px-0 snap-x snap-mandatory ${
              isDark ? 'border-slate-800/80' : 'border-slate-200'
            }`}
          >
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
                    onClick={() => handleTabClick(t.id)}
                    className={`relative flex items-center gap-2 px-3 sm:px-3.5 py-1.5 text-xs sm:text-[13px] font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap snap-start shrink-0 min-h-[38px] touch-manipulation select-none ${
                      isActive
                        ? t.activeColor
                        : t.id === 'admin'
                          ? 'bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-amber-300 border border-amber-500/60 hover:border-amber-400 shadow-md hover:bg-indigo-900/80 font-black'
                          : isDark 
                            ? 'text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700'
                            : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/90 border border-slate-200/80 hover:border-slate-300 bg-white/60 shadow-2xs'
                    }`}
                  >
                    {isActive && (
                      <div
                        className="absolute inset-0 rounded-xl bg-white/10"
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
      </div>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
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

