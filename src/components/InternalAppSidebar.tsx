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
  isDark = false
}) => {
  // CRITICAL REQUIREMENT:
  // "jadi kalau di luar yang tidak bisa login maka side bar tidak muncul"
  // "niatnya sidebar ini hanya bisa dilihat oleh yang mempunyai user"
  if (!isAdminAuthenticated || !currentUser || config?.isEnabled === false) {
    return null;
  }

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedMenuIds, setExpandedMenuIds] = useState<string[]>([]);

  const themePresetKey = config.themePreset || 'navy_kemenkeu';
  const themePreset = SIDEBAR_THEME_PRESETS[themePresetKey] || SIDEBAR_THEME_PRESETS.navy_kemenkeu;
  const isPositionRight = config.position === 'right';

  // Toggle open/close on keyboard shortcut: Ctrl+B or Cmd+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Width classes
  const widthClasses = useMemo(() => {
    switch (config.widthMode) {
      case 'compact': return 'w-80 max-w-[85vw]';
      case 'wide': return 'w-[440px] max-w-[92vw]';
      case 'standard':
      default: return 'w-[370px] max-w-[90vw]';
    }
  }, [config.widthMode]);

  const activeItems = useMemo(() => {
    return (config.items || []).filter(item => item.isActive !== false);
  }, [config.items]);

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

  return (
    <>
      {/* 1. Sleek Floating Toggle Button (Hanya tampil bagi yang login) */}
      {!isOpen && (
        <div 
          className={`fixed z-40 transition-all duration-300 ${
            isPositionRight 
              ? 'right-0 top-1/3 -translate-y-1/2' 
              : 'left-0 top-1/3 -translate-y-1/2'
          }`}
        >
          <button
            onClick={() => setIsOpen(true)}
            type="button"
            className={`group relative flex items-center gap-2.5 px-3 py-3.5 shadow-2xl transition-all duration-300 cursor-pointer ${
              isPositionRight 
                ? 'rounded-l-2xl border-l-2 border-y border-sky-400/50 hover:pl-4' 
                : 'rounded-r-2xl border-r-2 border-y border-sky-400/50 hover:pr-4'
            } bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white hover:bg-blue-900/95 ring-1 ring-white/10`}
            title="Buka Sidebar Aplikasi Internal KPPN (Ctrl+B)"
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
          </button>
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
          {filteredItems.length === 0 ? (
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
