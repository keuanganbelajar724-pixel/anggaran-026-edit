import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Activity,
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
  Receipt,
  User,
  Phone,
  ChevronLeft,
  ChevronRight,
  Clock,
  Radio,
  Smartphone,
  RefreshCw,
  PieChart,
  Coins,
  Ticket,
  Crown,
  Check
} from 'lucide-react';
import { NavigationTab, AppTheme, MenuVisibilityConfig, MasterSatker, SlideShowConfig, DashboardConfig, AppUser } from '../types';
import { AdminLoginModal } from './AdminLoginModal';
import { AndroidInstallModal } from './AndroidInstallModal';
import { SlideShowBannerCarousel } from './SlideShowBannerCarousel';
import { getThemePreset } from '../utils/themeUtils';

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
  currentUser?: AppUser | null;
  onOpenProfileModal?: (tab?: 'profile' | 'password') => void;
  onLoginSuccess?: (user: AppUser) => void;
  masterSatkers?: MasterSatker[];
  transaksiKkpCount?: number;
  transaksiDigipayCount?: number;
  spmPppCount?: number;
  onOpenBroadcastLibrary?: () => void;
  slideShowConfig?: SlideShowConfig;
  onOpenAdminSlideShow?: () => void;
  dashboardConfig?: DashboardConfig;
  onForceCloudSync?: () => void;
  isCloudSyncing?: boolean;
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
  currentUser = null,
  onOpenProfileModal,
  onLoginSuccess,
  masterSatkers = [],
  transaksiKkpCount = 0,
  transaksiDigipayCount = 0,
  spmPppCount = 0,
  onOpenBroadcastLibrary,
  slideShowConfig,
  onOpenAdminSlideShow,
  dashboardConfig,
  onForceCloudSync,
  isCloudSyncing = false
}) => {
  const isDark = theme === 'dark';
  const themeSettings = dashboardConfig?.themeSettings;
  const isAutoFillLayout = themeSettings?.tabLayoutMode !== 'compact';
  const activePreset = getThemePreset(themeSettings?.preset);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);
  const [isSatkerPreviewMode, setIsSatkerPreviewMode] = useState<boolean>(false);
  const navScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeftState, setScrollLeftState] = useState<number>(0);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  // Real-Time Live Clock (Ticking every second)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDateStr = useMemo(() => {
    return currentTime.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, [currentTime]);

  const formattedTimeStr = useMemo(() => {
    return currentTime.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' WIB';
  }, [currentTime]);

  // Check scroll bounds to show/hide indicators
  const updateScrollBounds = () => {
    if (navScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navScrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const navEl = navScrollRef.current;
    if (navEl) {
      updateScrollBounds();
      navEl.addEventListener('scroll', updateScrollBounds, { passive: true });
      window.addEventListener('resize', updateScrollBounds);
      return () => {
        navEl.removeEventListener('scroll', updateScrollBounds);
        window.removeEventListener('resize', updateScrollBounds);
      };
    }
  }, []);

  // Auto-scroll active tab into view whenever activeTab changes
  useEffect(() => {
    if (navScrollRef.current) {
      const activeEl = navScrollRef.current.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      setTimeout(updateScrollBounds, 300);
    }
  }, [activeTab]);

  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      navScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(updateScrollBounds, 300);
    }
  };

  // Mouse drag-to-scroll support for desktop/tablet/mobile emulation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!navScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - navScrollRef.current.offsetLeft);
    setScrollLeftState(navScrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !navScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - navScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    navScrollRef.current.scrollLeft = scrollLeftState - walk;
    updateScrollBounds();
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
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
      id: 'realisasi-anggaran',
      label: 'Realisasi Anggaran',
      icon: <PieChart className="w-4 h-4 text-emerald-300" />,
      badge: <span className="bg-emerald-950 text-emerald-200 border border-emerald-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">InTress</span>,
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
      id: 'diagnostik-caput',
      label: 'SI-CAPUT (Diagnostik)',
      icon: <Activity className="w-4 h-4 text-cyan-300" />,
      badge: <span className="bg-cyan-950 text-cyan-200 border border-cyan-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">Diagnostik</span>,
      activeColor: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 ring-1 ring-cyan-400/40'
    },
    {
      id: 'deviasi-hal3',
      label: 'Deviasi Hal III DIPA (Satker)',
      icon: <FileSpreadsheet className="w-4 h-4 text-amber-300" />,
      badge: <span className="bg-indigo-950 text-indigo-200 border border-indigo-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">Khusus Deviasi</span>,
      activeColor: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/40'
    },
    {
      id: 'spm-ppp',
      label: 'Monitoring SPM PPP',
      icon: <Receipt className="w-4 h-4 text-amber-300" />,
      badge: <span className="bg-amber-950 text-amber-200 border border-amber-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">{spmPppCount > 0 ? `${spmPppCount}` : 'PPP'}</span>,
      activeColor: 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/40'
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
      label: 'Juknis dan Pengetahuan Perbendaharaan',
      icon: <BookOpen className="w-4 h-4 text-indigo-300" />,
      badge: <span className="bg-indigo-950 text-indigo-200 border border-indigo-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">Juknis</span>,
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
    },
    {
      id: 'konfirmasi-kehadiran',
      label: '🤝 Konfirmasi Kehadiran',
      icon: <UserCheck className="w-4 h-4 text-emerald-300" />,
      badge: <span className="bg-emerald-950 text-emerald-200 border border-emerald-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">RSVP Satker</span>,
      activeColor: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
    },
    {
      id: 'pendaftaran-user-sakti',
      label: '📝 Pendaftaran User SAKTI',
      icon: <FileSpreadsheet className="w-4 h-4 text-teal-300" />,
      badge: <span className="bg-teal-950 text-teal-200 border border-teal-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">User SAKTI</span>,
      activeColor: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/30 ring-1 ring-teal-400/40'
    },
    {
      id: 'rekonsiliasi',
      label: '📊 Rekonsiliasi',
      icon: <FileSpreadsheet className="w-4 h-4 text-blue-300" />,
      badge: <span className="bg-blue-950 text-blue-200 border border-blue-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">Kepatuhan</span>,
      activeColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
    },
    {
      id: 'lpj',
      label: '📋 Monitoring LPJ',
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-300" />,
      badge: <span className="bg-emerald-950 text-emerald-200 border border-emerald-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">LPJ SAKTI</span>,
      activeColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
    },
    {
      id: 'gaji-induk',
      label: '💰 Gaji Induk (PNS & PPPK)',
      icon: <Coins className="w-4 h-4 text-emerald-300" />,
      badge: <span className="bg-emerald-950 text-emerald-200 border border-emerald-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">Gaji Induk</span>,
      activeColor: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
    },
    {
      id: 'monitoring-haicso',
      label: '🎫 Monitoring Tiket HAICSO',
      icon: <Ticket className="w-4 h-4 text-amber-300" />,
      badge: <span className="bg-amber-950 text-amber-200 border border-amber-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">HAICSO</span>,
      activeColor: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/40'
    },
    {
      id: 'kontrak',
      label: '📑 Monitoring Data Kontrak',
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-300" />,
      badge: <span className="bg-emerald-950 text-emerald-200 border border-emerald-700/60 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">KPPN</span>,
      activeColor: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
    }
  ];

  // Dynamic tab ordering based on tabOrder config
  const tabs = useMemo(() => {
    const adminTabItem = {
      id: 'admin' as NavigationTab,
      label: '🛡️ Modul Admin (Control Center)',
      icon: <ShieldCheck className="w-4 h-4 text-amber-300" />,
      badge: <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black shadow-xs">Admin</span>,
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
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-600 to-amber-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-2 ring-amber-400/80 shrink-0 cursor-pointer hover:scale-105 transition-all overflow-hidden"
              title="ANGKASA - Dashboard Utama"
            >
              <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-1 flex items-center justify-center">
                <img src="/favicon.svg" alt="ANGKASA Logo" className="w-full h-full object-contain filter drop-shadow-md brightness-110" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className={`text-base sm:text-lg font-black tracking-tight leading-tight flex items-center gap-1.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  ANGKASA
                  <span className="text-[11px] font-black px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-xs">
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

          {/* Center Executive Live Clock Ticker for Wide Screens (Ultra-Premium Glassmorphism Widget) */}
          <div className="hidden lg:flex items-center gap-2.5 py-1.5 px-4 rounded-2xl border shadow-lg backdrop-blur-xl transition-all duration-300 bg-gradient-to-r from-white/90 via-slate-50/95 to-indigo-50/70 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-indigo-950/80 border-slate-200/90 dark:border-indigo-500/30 hover:border-indigo-400 dark:hover:border-indigo-400/60 shadow-slate-200/50 dark:shadow-indigo-950/50 group">
            {/* Live Indicator Capsule */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-xs shadow-emerald-500" />
              </span>
              <span className="font-extrabold text-[9px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
                LIVE
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700/60 mx-0.5" />

            {/* Date Segment */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs tracking-tight">
                {formattedDateStr}
              </span>
            </div>

            <span className="text-slate-300 dark:text-slate-600 font-bold">•</span>

            {/* Time Digital Segment */}
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-900 dark:bg-black/80 text-white border border-slate-700 dark:border-indigo-500/40 shadow-inner">
              <span className="font-mono font-black text-amber-300 dark:text-amber-300 text-xs sm:text-sm tracking-wider tabular-nums drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                {formattedTimeStr}
              </span>
            </div>
          </div>

          {/* Controls & Quick Stats - Compact 2-Tier on Desktop when Logged In */}
          <div className="flex flex-col items-stretch lg:items-end gap-1.5 w-full lg:w-auto shrink-0">
            {/* Row 1: Search, Theme, Android, Sync, or Login Button */}
            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              {/* Theme Toggle Button (Light/Dark Mode) */}
              <button
                onClick={toggleTheme}
                className={`relative flex items-center justify-between gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer shadow-xs shrink-0 min-h-[38px] hover:scale-105 active:scale-95 ${
                  isDark 
                    ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border-amber-500/50 text-amber-300 shadow-amber-950/30' 
                    : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 border-amber-400 text-slate-950 shadow-amber-500/20'
                }`}
                title={isDark ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-900" />
                )}
                <span className="text-xs font-extrabold hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
              </button>

              {/* Search Box */}
              <div className="relative flex-1 min-w-0 sm:min-w-[180px] lg:min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Satker, Kode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full text-xs rounded-xl pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 border focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all min-h-[38px] ${
                    isDark 
                      ? 'bg-slate-900 text-slate-100 border-slate-800 placeholder:text-slate-500' 
                      : 'bg-slate-100 text-slate-900 border-slate-300 placeholder:text-slate-500 focus:bg-white'
                  }`}
                />
              </div>

              {/* Install Android PWA Button */}
              <button
                type="button"
                onClick={() => setIsAndroidModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-xs border border-emerald-400/30 transition-all cursor-pointer shrink-0 min-h-[38px] hover:scale-105 active:scale-95"
                title="Pasang Aplikasi ANGKASA di HP Android"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Android</span>
              </button>

              {/* Force Cloud Sync Button */}
              {onForceCloudSync && (
                <button
                  type="button"
                  onClick={onForceCloudSync}
                  disabled={isCloudSyncing}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-black rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 transition-all cursor-pointer shrink-0 min-h-[38px] hover:scale-105 active:scale-95 disabled:opacity-50"
                  title="Sinkronkan data dengan Firebase Firestore Cloud Database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">{isCloudSyncing ? 'Sinkron...' : 'Cloud'}</span>
                </button>
              )}

              {/* Login Button (Only shown when not logged in) */}
              {!isAdminAuthenticated && (
                <button
                  onClick={() => setIsAdminLoginModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-black rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white shadow-md shadow-indigo-600/20 border border-amber-400/40 transition-all cursor-pointer shrink-0 min-h-[38px] hover:scale-105 active:scale-95"
                  title="Masuk sebagai Super Admin atau Pegawai KPPN Semarang I"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Login Admin / Pegawai</span>
                </button>
              )}
            </div>

            {/* Row 2: Admin Super & Pegawai Profile & Actions */}
            {isAdminAuthenticated && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => onOpenProfileModal?.('profile')}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 transition-all cursor-pointer shadow-xs hover:border-amber-400/50"
                    title={`Klik untuk Pengaturan Profil ${currentUser.role === 'superadmin' ? 'Admin Super' : 'Pegawai'}`}
                  >
                    {currentUser.photoUrl ? (
                      <img
                        src={currentUser.photoUrl}
                        alt={currentUser.displayName}
                        className="w-4 h-4 rounded-full object-cover border border-amber-400/60"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`w-4 h-4 rounded-full ${currentUser.role === 'superadmin' ? 'bg-amber-500' : 'bg-emerald-500'} text-slate-950 font-black text-[9px] flex items-center justify-center`}>
                        {currentUser.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-bold text-[11px] leading-tight text-slate-100">
                      {currentUser.displayName === 'Super Admin MSKI' ? 'Admin Super KPPN 026' : currentUser.displayName}
                    </span>
                    {currentUser.role === 'superadmin' ? (
                      <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                    ) : (
                      <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    )}
                    <span className={`text-[9px] border px-1.5 py-0.2 rounded font-bold ${
                      currentUser.role === 'superadmin'
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                        : 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
                    }`}>
                      {currentUser.role === 'superadmin' ? 'Admin Super' : 'Pegawai'}
                    </span>
                  </button>
                )}

                {onOpenBroadcastLibrary && (
                  <button
                    type="button"
                    onClick={onOpenBroadcastLibrary}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-xs border border-rose-400/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Buka Katalog Template Broadcast Siap Salin"
                  >
                    <Sparkles className="w-3 h-3 text-amber-200" />
                    <span>Template WA</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (onLogoutAdmin) onLogoutAdmin();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title="Keluar Sesi Admin"
                >
                  <LogOut className="w-3 h-3 text-rose-400" />
                  <span>Keluar</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Admin Exclusive Status & Simulator Strip (Bilah Pembatas Elegan Sesuai Gambar) */}
        {isAdminAuthenticated && (
          <div className="mt-2.5 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 px-3.5 sm:px-4 py-2 rounded-2xl border border-sky-500/30 text-white flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs shadow-md">
            {/* Left side: Sesi Admin Eksklusif Info */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 font-black text-sky-200 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="tracking-wide uppercase font-black">SESI ADMIN EKSKLUSIF AKTIF:</span>
              </div>
              <span className="text-slate-300 text-[11px] sm:text-xs">
                Akses penuh Olah Excel, WhatsApp Gateway, Pengumuman &amp; Kunci Menu Satker.
              </span>
            </div>

            {/* Right side: Action tools */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={() => setIsSatkerPreviewMode(!isSatkerPreviewMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 ${
                  isSatkerPreviewMode 
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs' 
                    : 'bg-slate-800 text-sky-200 border-slate-700 hover:bg-slate-700'
                }`}
                title="Simulasi Tampilan Satker"
              >
                {isSatkerPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{isSatkerPreviewMode ? 'Mode Simulasi: ON 🟢' : 'Simulasi Tampilan Satker'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer transition-all flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 ${
                  activeTab === 'admin'
                    ? 'bg-emerald-400 text-slate-950 border-emerald-300 font-black shadow-emerald-500/25 ring-1 ring-emerald-300'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/40 shadow-indigo-600/30'
                }`}
                title="Buka / Lompat Langsung ke Modul Admin"
              >
                {activeTab === 'admin' ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3] text-slate-950" />
                    <span>Sedang di Tab Admin</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    <span>Ke Tab Admin</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Responsive Slide Show Banner Carousel (Placed ABOVE Navigation Tabs) */}
        {activeTab !== 'admin' && slideShowConfig?.isEnabled && (
          <div className="mt-2">
            <SlideShowBannerCarousel
              config={slideShowConfig}
              activeTab={activeTab}
              isDark={isDark}
              isAdmin={isAdminAuthenticated}
              onOpenAdminSlideShow={onOpenAdminSlideShow}
            />
          </div>
        )}

        {/* Navigation Tabs - Bersih & Rata Penuh (Auto-Fill Justified) */}
        <div className="relative mt-2 border-t border-slate-200/60 dark:border-slate-800/80 pt-1.5">
          <nav
            className={`w-full flex flex-wrap items-center gap-1.5 sm:gap-2 py-0.5 select-none ${
              isAutoFillLayout ? 'justify-between' : 'justify-start'
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

                const activeStyle = isActive
                  ? (themeSettings?.preset && themeSettings.preset !== 'default_kppn'
                      ? `${activePreset.activeTabClass} ${themeSettings.activeTabGlow !== false ? 'shadow-lg ring-2 ring-white/30' : ''}`
                      : t.activeColor)
                  : t.id === 'admin'
                    ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-amber-300 border-2 border-amber-500/70 hover:border-amber-400 hover:text-white shadow-md font-black ring-1 ring-amber-500/30 hover:scale-102'
                    : isDark 
                      ? 'text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 bg-slate-900/60'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-300 bg-white shadow-2xs';

                return (
                  <button
                    key={t.id}
                    data-active={isActive ? "true" : "false"}
                    onClick={() => handleTabClick(t.id)}
                    className={`relative flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer whitespace-nowrap min-h-[36px] touch-manipulation select-none hover:shadow-xs active:scale-98 ${
                      isAutoFillLayout ? 'flex-1 min-w-fit' : 'shrink-0'
                    } ${activeStyle}`}
                  >
                    {isActive && (
                      <div
                        className="absolute inset-0 rounded-xl bg-white/10"
                      />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                      {t.icon}
                      <span className="whitespace-nowrap">{t.label}</span>
                      {t.badge}
                      {isAdminAuthenticated && isDisabledForSatker && (
                        <span className="bg-rose-50 text-rose-600 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0" title="Menu ini dinonaktifkan untuk Satker">
                          <Lock className="w-2.5 h-2.5" />
                          <span>OFF</span>
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
        onLoginSuccess={(user) => {
          if (onLoginSuccess) {
            onLoginSuccess(user);
          }
          setActiveTab('admin');
        }}
        theme={theme}
      />

      {/* Android PWA Install Modal */}
      <AndroidInstallModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        isDark={isDark}
      />
    </header>
  );
};

