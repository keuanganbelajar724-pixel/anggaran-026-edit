import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Search, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Cpu, 
  Database, 
  LifeBuoy, 
  ShoppingBag, 
  CreditCard, 
  Award, 
  Building2, 
  FileText, 
  Globe, 
  Key, 
  Shield, 
  LayoutGrid, 
  Terminal, 
  Wrench, 
  Sparkles, 
  Lock, 
  User, 
  LogOut,
  Sliders,
  CheckCircle2,
  FolderOpen,
  ArrowRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { SidebarConfig, SidebarMenuItem, SidebarSubmenuItem } from '../types/sidebar';
import { AppUser } from '../types/user';
import { INITIAL_SIDEBAR_CONFIG, SIDEBAR_THEME_PRESETS } from '../data/initialSidebarData';

interface InternalAppSidebarProps {
  config?: SidebarConfig;
  currentUser: AppUser | null;
  isAdminAuthenticated: boolean;
  onOpenSettings?: () => void;
  onUpdateConfig?: (newConfig: SidebarConfig) => void;
  isDark?: boolean;
}

// Icon helper resolver
export const renderSidebarIcon = (iconName?: string, className: string = 'w-5 h-5') => {
  switch (iconName) {
    case 'Cpu': return <Cpu className={className} />;
    case 'Database': return <Database className={className} />;
    case 'LifeBuoy': return <LifeBuoy className={className} />;
    case 'ShoppingBag': return <ShoppingBag className={className} />;
    case 'CreditCard': return <CreditCard className={className} />;
    case 'Award': return <Award className={className} />;
    case 'Building2': return <Building2 className={className} />;
    case 'FileText': return <FileText className={className} />;
    case 'Globe': return <Globe className={className} />;
    case 'Key': return <Key className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'LayoutGrid': return <LayoutGrid className={className} />;
    case 'Terminal': return <Terminal className={className} />;
    case 'Wrench': return <Wrench className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    default: return <Layers className={className} />;
  }
};

export const InternalAppSidebar: React.FC<InternalAppSidebarProps> = ({
  config = INITIAL_SIDEBAR_CONFIG,
  currentUser,
  isAdminAuthenticated,
  onOpenSettings,
  onUpdateConfig,
  isDark = false
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedMenuIds, setExpandedMenuIds] = useState<string[]>([]);

  // State Ukuran Tombol (Simbol saja vs Penuh)
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kppn_sidebar_btn_minimized');
      if (saved !== null) return saved === 'true';
    } catch {
      // fallback
    }
    return config?.floatingButtonSize === 'symbol';
  });

  // State Visibilitas Tombol Melayang di Layar (Aktif vs Nonaktif)
  const [isFloatingVisible, setIsFloatingVisible] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kppn_sidebar_btn_visible');
      if (saved !== null) return saved === 'true';
    } catch {
      // fallback
    }
    return config?.showFloatingButton !== false;
  });

  const themePresetKey = config?.themePreset || 'navy_kemenkeu';
  const themePreset = SIDEBAR_THEME_PRESETS[themePresetKey] || SIDEBAR_THEME_PRESETS.navy_kemenkeu;
  const isPositionRight = config?.position === 'right';

  // Sinkronisasi saat config dari props berubah
  useEffect(() => {
    if (config?.showFloatingButton !== undefined) {
      try {
        const saved = localStorage.getItem('kppn_sidebar_btn_visible');
        if (saved === null) {
          setIsFloatingVisible(config.showFloatingButton);
        }
      } catch {
        setIsFloatingVisible(config.showFloatingButton);
      }
    }
  }, [config?.showFloatingButton]);

  useEffect(() => {
    if (config?.floatingButtonSize !== undefined) {
      try {
        const saved = localStorage.getItem('kppn_sidebar_btn_minimized');
        if (saved === null) {
          setIsMinimized(config.floatingButtonSize === 'symbol');
        }
      } catch {
        setIsMinimized(config.floatingButtonSize === 'symbol');
      }
    }
  }, [config?.floatingButtonSize]);

  // Handler Toggle Minimize
  const toggleMinimize = (toState?: boolean) => {
    setIsMinimized(prev => {
      const next = toState !== undefined ? toState : !prev;
      try {
        localStorage.setItem('kppn_sidebar_btn_minimized', String(next));
      } catch (e) {
        console.warn('LocalStorage notice:', e);
      }
      if (onUpdateConfig && config) {
        onUpdateConfig({
          ...config,
          floatingButtonSize: next ? 'symbol' : 'full'
        });
      }
      return next;
    });
  };

  // Handler Toggle Floating Button Visible
  const toggleFloatingVisible = (toState?: boolean) => {
    setIsFloatingVisible(prev => {
      const next = toState !== undefined ? toState : !prev;
      try {
        localStorage.setItem('kppn_sidebar_btn_visible', String(next));
      } catch (e) {
        console.warn('LocalStorage notice:', e);
      }
      if (onUpdateConfig && config) {
        onUpdateConfig({
          ...config,
          showFloatingButton: next
        });
      }
      return next;
    });
  };

  // Toggle open/close on keyboard shortcut: Ctrl+B or Cmd+B, dan Custom Events
  useEffect(() => {
    if (!isAdminAuthenticated || !currentUser || config?.isEnabled === false) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);
    const handleCustomToggle = () => setIsOpen(prev => !prev);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-kppn-sidebar', handleCustomOpen);
    window.addEventListener('toggle-kppn-sidebar', handleCustomToggle);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-kppn-sidebar', handleCustomOpen);
      window.removeEventListener('toggle-kppn-sidebar', handleCustomToggle);
    };
  }, [isOpen, isAdminAuthenticated, currentUser, config?.isEnabled]);

  // Width classes
  const widthClasses = useMemo(() => {
    switch (config?.widthMode) {
      case 'compact': return 'w-80 max-w-[85vw]';
      case 'wide': return 'w-[440px] max-w-[92vw]';
      case 'standard':
      default: return 'w-[370px] max-w-[90vw]';
    }
  }, [config?.widthMode]);

  const activeItems = useMemo(() => {
    return (config?.items || []).filter(item => item.isActive !== false);
  }, [config?.items]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    activeItems.forEach(item => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [activeItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return activeItems.filter(item => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchCat = item.category?.toLowerCase().includes(q);
      const matchSub = item.submenus?.some(s => 
        s.isActive !== false && (
          s.title.toLowerCase().includes(q) ||
          s.url.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
        )
      );
      return matchTitle || matchDesc || matchCat || matchSub;
    });
  }, [activeItems, selectedCategory, searchQuery]);

  // Auto-expand all items when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedMenuIds(filteredItems.map(item => item.id));
    }
  }, [searchQuery, filteredItems]);

  const toggleExpand = (id: string) => {
    setExpandedMenuIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const expandAll = () => {
    setExpandedMenuIds(filteredItems.map(item => item.id));
  };

  const collapseAll = () => {
    setExpandedMenuIds([]);
  };

  // CRITICAL REQUIREMENT:
  // "jadi kalau di luar yang tidak bisa login maka side bar tidak muncul"
  // "niatnya sidebar ini hanya bisa dilihat oleh yang mempunyai user"
  if (!isAdminAuthenticated || !currentUser || config?.isEnabled === false) {
    return null;
  }

  return (
    <>
      {/* 1. Sleek Floating Toggle Button (Hanya tampil bagi yang login & jika diaktifkan) */}
      {!isOpen && isFloatingVisible && (
        <div 
          className={`fixed z-40 transition-all duration-300 ${
            isPositionRight 
              ? 'right-0 top-1/3 -translate-y-1/2' 
              : 'left-0 top-1/3 -translate-y-1/2'
          }`}
        >
          {isMinimized ? (
            /* Mode 1: UKURAN SIMBOL SAJA (Minimalis agar tidak mengganggu membaca) */
            <div className="relative group/btn flex items-center">
              <button
                onClick={() => setIsOpen(true)}
                type="button"
                className={`group relative flex items-center justify-center p-2.5 sm:p-3 shadow-2xl transition-all duration-300 cursor-pointer ${
                  isPositionRight 
                    ? 'rounded-l-2xl border-l-2 border-y border-sky-400/60 hover:pl-3.5' 
                    : 'rounded-r-2xl border-r-2 border-y border-sky-400/60 hover:pr-3.5'
                } bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white hover:bg-blue-900/95 ring-1 ring-white/10 hover:scale-105 active:scale-95`}
                title="Buka Sidebar Aplikasi Internal KPPN (Ctrl+B) • Ukuran Simbol"
                aria-label="Buka Sidebar Aplikasi Internal KPPN"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-sky-400/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-inherit" />

                {/* Symbol Icon */}
                <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md group-hover:rotate-6 transition-transform">
                  <LayoutGrid className="w-4 h-4 text-sky-200" />
                </div>

                {/* Counter indicator dot/badge */}
                <span className="absolute -top-1 -right-1 bg-sky-500 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md border border-slate-900">
                  {activeItems.length}
                </span>
              </button>

              {/* Tooltip on hover */}
              <div 
                className={`absolute pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-all duration-200 whitespace-nowrap z-50 ${
                  isPositionRight ? 'right-full mr-2' : 'left-full ml-2'
                }`}
              >
                <div className="bg-slate-900/95 border border-slate-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-xl flex items-center gap-1.5 backdrop-blur-md">
                  <span>Aplikasi KPPN</span>
                  <span className="text-[10px] text-sky-300 font-mono font-bold">({activeItems.length})</span>
                </div>
              </div>

              {/* Small Expand Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMinimize(false);
                }}
                className={`absolute opacity-0 group-hover/btn:opacity-100 transition-all duration-200 p-1 rounded-lg bg-slate-800/90 hover:bg-sky-600 text-sky-300 hover:text-white border border-slate-700 shadow-lg cursor-pointer ${
                  isPositionRight ? '-left-6 top-1/2 -translate-y-1/2' : '-right-6 top-1/2 -translate-y-1/2'
                }`}
                title="Perbesar tombol ke ukuran penuh (dengan teks)"
                aria-label="Perbesar ke ukuran penuh"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            /* Mode 2: UKURAN PENUH (Dengan Teks & Tombol Minimize) */
            <div className="relative group/btn flex items-center">
              <button
                onClick={() => setIsOpen(true)}
                type="button"
                className={`group relative flex items-center gap-2.5 px-3 py-3 shadow-2xl transition-all duration-300 cursor-pointer ${
                  isPositionRight 
                    ? 'rounded-l-2xl border-l-2 border-y border-sky-400/50 hover:pl-4' 
                    : 'rounded-r-2xl border-r-2 border-y border-sky-400/50 hover:pr-4'
                } bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white hover:bg-blue-900/95 ring-1 ring-white/10`}
                title="Buka Sidebar Aplikasi Internal KPPN (Ctrl+B)"
                aria-label="Buka Sidebar Aplikasi Internal KPPN"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-400/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-inherit" />

                <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md group-hover:scale-110 transition-transform">
                  <LayoutGrid className="w-4 h-4 text-sky-200" />
                </div>

                <div className="relative flex flex-col text-left pr-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1">
                    <span>INTERNAL</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </span>
                  <span className="text-xs font-black tracking-tight text-white leading-tight">
                    Aplikasi KPPN
                  </span>
                </div>

                <span className="relative bg-white/10 border border-white/20 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md text-sky-200">
                  {activeItems.length}
                </span>

                {/* Tombol Minimize ke Simbol */}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMinimize(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      toggleMinimize(true);
                    }
                  }}
                  className="p-1 rounded-lg bg-white/10 hover:bg-sky-500 hover:text-slate-950 text-sky-200 transition-colors cursor-pointer ml-0.5"
                  title="Minimize tombol ke ukuran simbol agar tidak mengganggu membaca"
                  aria-label="Minimize tombol ke ukuran simbol"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. Slide-Over Backdrop (Clean backdrop blur, klik backdrop menutup drawer) */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* 3. Slide-Over Drawer Panel */}
      <aside
        className={`fixed top-0 bottom-0 z-50 ${widthClasses} flex flex-col shadow-2xl transition-transform duration-300 ease-out border-slate-800 ${
          isPositionRight 
            ? `right-0 border-l ${isOpen ? 'translate-x-0' : 'translate-x-full'}` 
            : `left-0 border-r ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
        } ${themePreset.bgClass} text-slate-100 font-sans`}
        style={config.themePreset === 'custom' && config.customBgColor ? { backgroundColor: config.customBgColor } : undefined}
      >
        {/* Drawer Header */}
        <div 
          className={`relative p-5 border-b ${themePreset.borderClass} bg-gradient-to-br ${themePreset.headerGradient} text-white shrink-0`}
          style={config.themePreset === 'custom' && config.customHeaderColor ? { background: config.customHeaderColor } : undefined}
        >
          {/* Top Row: Brand & Close */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                <Building2 className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${themePreset.badgeBg} ${themePreset.badgeText}`}>
                    KPPN SEMARANG I (026)
                  </span>
                  <span className="text-[10px] font-mono text-white/70">DJPb</span>
                </div>
                <h2 className="text-sm font-black tracking-tight text-white mt-0.5 leading-snug">
                  {config.title || 'Aplikasi Internal KPPN'}
                </h2>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Tutup Sidebar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {config.subtitle && (
            <p className="text-[11px] text-white/80 mt-2 leading-relaxed font-normal">
              {config.subtitle}
            </p>
          )}

          {/* Quick Stats & Expand/Collapse All Buttons */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/10 text-[11px]">
            <span className="text-white/70 font-medium">
              <strong className="text-white font-bold">{activeItems.length}</strong> Aplikasi Tersedia
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                type="button"
                className="text-[10px] font-bold text-white/80 hover:text-white hover:underline cursor-pointer"
              >
                Buka Semua
              </button>
              <span className="text-white/40">•</span>
              <button
                onClick={collapseAll}
                type="button"
                className="text-[10px] font-bold text-white/80 hover:text-white hover:underline cursor-pointer"
              >
                Tutup Semua
              </button>
            </div>
          </div>
        </div>

        {/* Kontrol Cepat Pengaturan Tombol Melayang di Layar */}
        <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 shrink-0 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sliders className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-200 truncate">
                Tombol Melayang di Layar
              </span>
            </div>

            {/* Toggle Saklar Aktif / Nonaktif */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-black uppercase ${isFloatingVisible ? 'text-emerald-400' : 'text-slate-400'}`}>
                {isFloatingVisible ? 'Aktif' : 'Nonaktif'}
              </span>
              <button
                type="button"
                onClick={() => toggleFloatingVisible()}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isFloatingVisible ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
                title={isFloatingVisible ? "Nonaktifkan tombol melayang agar tidak menutupi tampilan bacaan" : "Aktifkan kembali tombol melayang di tepi layar"}
                aria-label="Aktifkan atau nonaktifkan tombol melayang"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isFloatingVisible ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Opsi Mode Ukuran Tombol ketika tombol aktif */}
          {isFloatingVisible ? (
            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/70 text-[10px]">
              <span className="text-slate-400 font-medium">Ukuran Tombol:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => toggleMinimize(true)}
                  className={`px-2 py-1 rounded-md font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 ${
                    isMinimized 
                      ? 'bg-sky-500 text-slate-950 font-black shadow-xs' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ukuran simbol saja agar tidak mengganggu membaca"
                >
                  <Minimize2 className="w-3 h-3" />
                  <span>Simbol Saja</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleMinimize(false)}
                  className={`px-2 py-1 rounded-md font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 ${
                    !isMinimized 
                      ? 'bg-sky-500 text-slate-950 font-black shadow-xs' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ukuran penuh dengan teks Aplikasi KPPN"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Penuh (Teks)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] leading-relaxed flex items-start gap-1.5">
              <span className="text-amber-400 font-bold shrink-0">ℹ️</span>
              <span>
                Tombol melayang dinonaktifkan agar tidak mengganggu membaca. Anda tetap dapat membuka sidebar melalui tombol <strong>"Aplikasi KPPN"</strong> di Header atau tombol keyboard <strong>Ctrl + B</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Search Bar & Category Filter */}
        <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/60 shrink-0 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aplikasi, submenu, atau tautan..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-800/90 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categories Pill Scroller */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-sky-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Semua ({activeItems.length})
              </button>
              {categories.map(cat => {
                const count = activeItems.filter(i => i.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-sky-500 text-slate-950 font-black shadow-xs'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {activeItems.length === 0 ? (
            <div className="py-14 px-6 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                <Layers className="w-6 h-6 opacity-70" />
              </div>
              <h4 className="text-sm font-black text-white">Belum Ada Aplikasi Ditambahkan</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Daftar pintasan aplikasi KPPN saat ini kosong. Anda dapat mengisi aplikasi resmi secara mandiri sesuai kebutuhan satker.
              </p>
              {isAdminAuthenticated && onOpenSettings && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenSettings();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs inline-flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>+ Kelola &amp; Tambah Aplikasi</span>
                  </button>
                </div>
              )}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Layers className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
              <p className="text-xs font-bold text-slate-300">Aplikasi tidak ditemukan</p>
              <p className="text-[11px] text-slate-500">Coba gunakan kata kunci pencarian yang berbeda</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const hasSubmenus = Array.isArray(item.submenus) && item.submenus.length > 0;
              const activeSubmenus = (item.submenus || []).filter(s => s.isActive !== false);
              const isExpanded = expandedMenuIds.includes(item.id);

              return (
                <div 
                  key={item.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded 
                      ? 'bg-slate-900 border-sky-500/40 shadow-lg' 
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  {/* Card Header / Main Button */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isExpanded 
                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                            : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                        }`}>
                          {renderSidebarIcon(item.icon, 'w-4 h-4')}
                        </div>

                        {/* Title & Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-xs font-black text-white tracking-tight leading-tight">
                              {item.title}
                            </h3>
                            {item.badge && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                {item.badge}
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}

                          {item.category && (
                            <span className="inline-block mt-1 text-[10px] font-mono text-slate-500">
                              📁 {item.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Direct Link button or Accordion expand button */}
                      <div className="flex items-center gap-1 shrink-0">
                        {hasSubmenus ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
                              isExpanded 
                                ? 'bg-sky-500/20 text-sky-300' 
                                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                            title={isExpanded ? 'Tutup Submenu' : 'Buka Submenu'}
                          >
                            <span className="text-[10px] font-mono">{activeSubmenus.length} Link</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        ) : item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold transition-all shadow-xs flex items-center gap-1"
                            title="Buka Aplikasi di Tab Baru"
                          >
                            <span>Buka</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Submenu Accordion Content */}
                  {hasSubmenus && isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 bg-slate-950/40 space-y-1.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 py-1">
                        Pilihan Modul &amp; Tautan ({activeSubmenus.length})
                      </div>

                      {activeSubmenus.map(sub => (
                        <a
                          key={sub.id}
                          href={sub.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/sub flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-900/80 hover:bg-sky-950/60 border border-slate-800/60 hover:border-sky-500/40 transition-all"
                        >
                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-200 group-hover/sub:text-sky-300 transition-colors">
                                {sub.title}
                              </span>
                              {sub.badge && (
                                <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                  {sub.badge}
                                </span>
                              )}
                            </div>
                            {sub.description && (
                              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                {sub.description}
                              </p>
                            )}
                            <div className="text-[9px] font-mono text-slate-500 truncate mt-0.5">
                              {sub.url}
                            </div>
                          </div>

                          <div className="p-1.5 rounded-lg bg-slate-800 group-hover/sub:bg-sky-500 group-hover/sub:text-slate-950 text-slate-300 shrink-0 transition-colors shadow-2xs">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer with Current User Profile & Superadmin Link */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/90 shrink-0 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="font-black text-slate-200 truncate text-[11px]">
                  {currentUser?.displayName || 'Pengguna Terdaftar'}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${currentUser?.role === 'superadmin' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <span>{currentUser?.role === 'superadmin' ? 'Admin Super' : 'Pegawai KPPN'}</span>
                  {currentUser?.seksi && (
                    <span className="truncate">• {currentUser.seksi}</span>
                  )}
                </div>
              </div>
            </div>

            {/* If Super Admin, show shortcut to settings */}
            {currentUser?.role === 'superadmin' && onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                title="Atur Menu & Warna Sidebar di Panel Admin"
              >
                <Sliders className="w-3 h-3" />
                <span>Atur Sidebar</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
            <span>Shortcut: Ctrl+B</span>
            <span>Tekan Esc untuk tutup</span>
          </div>
        </div>
      </aside>
    </>
  );
};
