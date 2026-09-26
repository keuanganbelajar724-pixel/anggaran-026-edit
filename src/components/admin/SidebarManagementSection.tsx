import React, { useState } from 'react';
import { 
  SidebarConfig, 
  SidebarMenuItem, 
  SidebarSubmenuItem, 
  SidebarThemePreset 
} from '../../types/sidebar';
import { AppUser } from '../../types/user';
import { 
  INITIAL_SIDEBAR_CONFIG, 
  SIDEBAR_THEME_PRESETS 
} from '../../data/initialSidebarData';
import { 
  renderSidebarIcon 
} from '../InternalAppSidebar';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  ExternalLink, 
  ChevronUp, 
  ChevronDown, 
  Layers, 
  Palette, 
  Eye, 
  LayoutGrid, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  X, 
  AlertCircle,
  FolderPlus,
  Sliders,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  Building2
} from 'lucide-react';
import { useToast } from '../ToastNotification';

interface SidebarManagementSectionProps {
  currentUser: AppUser | null;
  sidebarConfig?: SidebarConfig;
  onUpdateSidebarConfig: (newConfig: SidebarConfig) => void;
  isDark?: boolean;
}

const AVAILABLE_ICONS = [
  'Cpu',
  'Database',
  'LifeBuoy',
  'ShoppingBag',
  'CreditCard',
  'Award',
  'Building2',
  'FileText',
  'Globe',
  'Key',
  'Shield',
  'LayoutGrid',
  'Terminal',
  'Wrench',
  'Sparkles',
  'Layers'
];

const DEFAULT_CATEGORIES = [
  'Aplikasi Inti DJPb',
  'Layanan Satker',
  'Belanja & Perbankan',
  'SDM & Jabatan Perbendaharaan',
  'Internal KPPN',
  'Sistem Monitoring & Evaluasi',
  'Umum & Regulasi'
];

export const SidebarManagementSection: React.FC<SidebarManagementSectionProps> = ({
  currentUser,
  sidebarConfig = INITIAL_SIDEBAR_CONFIG,
  onUpdateSidebarConfig,
  isDark = false
}) => {
  const { addToast } = useToast();

  const [localConfig, setLocalConfig] = useState<SidebarConfig>(() => {
    return {
      ...INITIAL_SIDEBAR_CONFIG,
      ...sidebarConfig,
      items: sidebarConfig?.items && sidebarConfig.items.length > 0 
        ? sidebarConfig.items 
        : INITIAL_SIDEBAR_CONFIG.items
    };
  });

  const [activeSubTab, setActiveSubTab] = useState<'menus' | 'theme' | 'preview'>('menus');

  // Menu Modal State
  const [editingMenuItem, setEditingMenuItem] = useState<SidebarMenuItem | null>(null);
  const [isAddingMenu, setIsAddingMenu] = useState<boolean>(false);
  const [menuForm, setMenuForm] = useState<Partial<SidebarMenuItem>>({
    title: '',
    category: 'Aplikasi Inti DJPb',
    description: '',
    icon: 'Layers',
    badge: '',
    url: '',
    isActive: true,
    submenus: []
  });

  // Submenu Modal State
  const [targetMenuForSubmenu, setTargetMenuForSubmenu] = useState<SidebarMenuItem | null>(null);
  const [editingSubmenuItem, setEditingSubmenuItem] = useState<{ parentId: string; sub: SidebarSubmenuItem } | null>(null);
  const [isAddingSubmenu, setIsAddingSubmenu] = useState<boolean>(false);
  const [submenuForm, setSubmenuForm] = useState<Partial<SidebarSubmenuItem>>({
    title: '',
    url: '',
    description: '',
    badge: '',
    isActive: true
  });

  // Save handler
  const handleSaveConfig = (updated?: SidebarConfig) => {
    const toSave = updated || localConfig;
    const finalConfig: SidebarConfig = {
      ...toSave,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.displayName || currentUser?.username || 'Superadmin'
    };
    setLocalConfig(finalConfig);
    onUpdateSidebarConfig(finalConfig);
    addToast('Konfigurasi Sidebar Aplikasi Internal berhasil disimpan!', 'success');
  };

  // Reset to default standard KPPN
  const handleResetToDefault = () => {
    if (confirm('Kembalikan konfigurasi dan seluruh daftar aplikasi internal ke template standar resmi KPPN Semarang I?')) {
      const resetConfig: SidebarConfig = {
        ...INITIAL_SIDEBAR_CONFIG,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.displayName || 'Superadmin'
      };
      setLocalConfig(resetConfig);
      onUpdateSidebarConfig(resetConfig);
      addToast('Sidebar berhasil dikembalikan ke template standar KPPN!', 'info');
    }
  };

  // Menu item helpers
  const handleOpenAddMenu = () => {
    setMenuForm({
      id: `app-${Date.now()}`,
      title: '',
      category: 'Aplikasi Inti DJPb',
      description: '',
      icon: 'Layers',
      badge: '',
      url: '',
      isActive: true,
      submenus: []
    });
    setIsAddingMenu(true);
    setEditingMenuItem(null);
  };

  const handleOpenEditMenu = (item: SidebarMenuItem) => {
    setEditingMenuItem(item);
    setMenuForm({ ...item });
    setIsAddingMenu(false);
  };

  const handleSaveMenuForm = () => {
    if (!menuForm.title || !menuForm.title.trim()) {
      alert('Judul menu aplikasi wajib diisi!');
      return;
    }

    let updatedItems = [...(localConfig.items || [])];

    if (editingMenuItem) {
      updatedItems = updatedItems.map(item => 
        item.id === editingMenuItem.id 
          ? { ...item, ...menuForm, title: menuForm.title!.trim() } 
          : item
      );
    } else {
      const newItem: SidebarMenuItem = {
        id: menuForm.id || `app-${Date.now()}`,
        title: menuForm.title.trim(),
        category: menuForm.category || 'Aplikasi Inti DJPb',
        description: menuForm.description || '',
        icon: menuForm.icon || 'Layers',
        badge: menuForm.badge || '',
        url: menuForm.url || '',
        isActive: menuForm.isActive !== false,
        submenus: menuForm.submenus || [],
        order: updatedItems.length + 1
      };
      updatedItems.push(newItem);
    }

    const updatedConfig = { ...localConfig, items: updatedItems };
    setLocalConfig(updatedConfig);
    handleSaveConfig(updatedConfig);
    setIsAddingMenu(false);
    setEditingMenuItem(null);
  };

  const handleDeleteMenu = (id: string, title: string) => {
    if (confirm(`Hapus menu aplikasi "${title}" beserta seluruh submenunya?`)) {
      const updatedItems = (localConfig.items || []).filter(item => item.id !== id);
      const updatedConfig = { ...localConfig, items: updatedItems };
      setLocalConfig(updatedConfig);
      handleSaveConfig(updatedConfig);
    }
  };

  const handleToggleMenu = (id: string) => {
    const updatedItems = (localConfig.items || []).map(item => 
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );
    const updatedConfig = { ...localConfig, items: updatedItems };
    setLocalConfig(updatedConfig);
    handleSaveConfig(updatedConfig);
  };

  const handleMoveMenu = (index: number, direction: 'up' | 'down') => {
    const items = [...(localConfig.items || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;

    const updatedConfig = { ...localConfig, items };
    setLocalConfig(updatedConfig);
    handleSaveConfig(updatedConfig);
  };

  // Submenu helpers
  const handleOpenAddSubmenu = (parent: SidebarMenuItem) => {
    setTargetMenuForSubmenu(parent);
    setSubmenuForm({
      id: `sub-${Date.now()}`,
      title: '',
      url: 'https://',
      description: '',
      badge: '',
      isActive: true
    });
    setIsAddingSubmenu(true);
    setEditingSubmenuItem(null);
  };

  const handleOpenEditSubmenu = (parentId: string, sub: SidebarSubmenuItem) => {
    const parent = (localConfig.items || []).find(i => i.id === parentId);
    if (!parent) return;
    setTargetMenuForSubmenu(parent);
    setEditingSubmenuItem({ parentId, sub });
    setSubmenuForm({ ...sub });
    setIsAddingSubmenu(false);
  };

  const handleSaveSubmenuForm = () => {
    if (!targetMenuForSubmenu || !submenuForm.title || !submenuForm.url) {
      alert('Judul submenu dan URL wajib diisi!');
      return;
    }

    const parentId = targetMenuForSubmenu.id;
    const updatedItems = (localConfig.items || []).map(item => {
      if (item.id !== parentId) return item;

      let currentSubs = [...(item.submenus || [])];
      if (editingSubmenuItem) {
        currentSubs = currentSubs.map(s => 
          s.id === editingSubmenuItem.sub.id ? { ...s, ...submenuForm, title: submenuForm.title!.trim(), url: submenuForm.url!.trim() } : s
        );
      } else {
        const newSub: SidebarSubmenuItem = {
          id: submenuForm.id || `sub-${Date.now()}`,
          title: submenuForm.title!.trim(),
          url: submenuForm.url!.trim(),
          description: submenuForm.description || '',
          badge: submenuForm.badge || '',
          isActive: submenuForm.isActive !== false
        };
        currentSubs.push(newSub);
      }

      return { ...item, submenus: currentSubs };
    });

    const updatedConfig = { ...localConfig, items: updatedItems };
    setLocalConfig(updatedConfig);
    handleSaveConfig(updatedConfig);
    setIsAddingSubmenu(false);
    setEditingSubmenuItem(null);
    setTargetMenuForSubmenu(null);
  };

  const handleDeleteSubmenu = (parentId: string, subId: string, title: string) => {
    if (confirm(`Hapus submenu "${title}"?`)) {
      const updatedItems = (localConfig.items || []).map(item => {
        if (item.id !== parentId) return item;
        return {
          ...item,
          submenus: (item.submenus || []).filter(s => s.id !== subId)
        };
      });
      const updatedConfig = { ...localConfig, items: updatedItems };
      setLocalConfig(updatedConfig);
      handleSaveConfig(updatedConfig);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-blue-900/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>MODUL KHUSUS ADMIN SUPER</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Pengaturan Sidebar Aplikasi Internal KPPN
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Atur menu pintasan, tautan submenu ke aplikasi eksternal/internal KPPN (SAKTI, SPAN, OM-SPAN, HAI CSO, DIGIPAY, SPRINT, dsb.), serta kustomisasi tema warna dan posisi sidebar. 
              <span className="block font-bold text-amber-300 mt-1">
                🔒 Sidebar hanya dapat dilihat oleh user yang telah login (Super Admin &amp; Pegawai). Pengunjung luar tanpa login tidak akan melihat sidebar.
              </span>
            </p>
          </div>

          {/* Master Switch ON / OFF */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center justify-between gap-4 w-full sm:w-auto">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                  Status Global Sidebar
                </span>
                <span className={`text-xs font-black ${localConfig.isEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {localConfig.isEnabled ? 'AKTIF (DAPAT DIAKSES)' : 'NONAKTIF (DISEMBUNYIKAN)'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const updated = { ...localConfig, isEnabled: !localConfig.isEnabled };
                  setLocalConfig(updated);
                  handleSaveConfig(updated);
                }}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  localConfig.isEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    localConfig.isEnabled ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
              title="Kembalikan ke susunan menu standar DJPb / Kemenkeu"
            >
              <RotateCcw className="w-4 h-4 text-amber-300" />
              <span>Reset Standar KPPN</span>
            </button>
          </div>
        </div>

        {/* Subtab Navigator */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('menus')}
            className={`px-4 py-2.5 rounded-xl font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeSubTab === 'menus'
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'bg-white/10 text-white/90 hover:bg-white/20'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Daftar Menu &amp; Submenu ({localConfig.items?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('theme')}
            className={`px-4 py-2.5 rounded-xl font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeSubTab === 'theme'
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'bg-white/10 text-white/90 hover:bg-white/20'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>2. Setting Tema Warna &amp; Tata Letak</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('preview')}
            className={`px-4 py-2.5 rounded-xl font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeSubTab === 'preview'
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'bg-white/10 text-white/90 hover:bg-white/20'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>3. Simulasi &amp; Live Preview</span>
          </button>
        </div>
      </div>

      {/* 2. SUBTAB: MENUS & SUBMENUS */}
      {activeSubTab === 'menus' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-sky-600" />
                <span>Daftar Menu Aplikasi Internal KPPN</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tambahkan menu utama atau submenu bertingkat ke aplikasi luar (misal: SAKTI, OM-SPAN, Digipay, SIMASPATI, CMS Bank, dsb.).
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddMenu}
              className="bg-sky-600 hover:bg-sky-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu Aplikasi Baru</span>
            </button>
          </div>

          {/* Menus List */}
          <div className="space-y-3">
            {localConfig.items && localConfig.items.length > 0 ? (
              localConfig.items.map((menu, idx) => {
                const submenus = menu.submenus || [];
                return (
                  <div
                    key={menu.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all ${
                      menu.isActive !== false
                        ? 'border-slate-200 dark:border-slate-800 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50 dark:bg-slate-950'
                    }`}
                  >
                    {/* Menu Item Bar */}
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Order controls */}
                        <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveMenu(idx, 'up')}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            title="Pindah ke Atas"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-mono font-bold text-slate-400">{idx + 1}</span>
                          <button
                            type="button"
                            disabled={idx === (localConfig.items?.length || 0) - 1}
                            onClick={() => handleMoveMenu(idx, 'down')}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            title="Pindah ke Bawah"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          {renderSidebarIcon(menu.icon, 'w-5 h-5')}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                              {menu.title}
                            </h4>
                            {menu.badge && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/50">
                                {menu.badge}
                              </span>
                            )}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {menu.category || 'Umum'}
                            </span>
                          </div>

                          {menu.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {menu.description}
                            </p>
                          )}

                          {menu.url && (
                            <div className="text-[11px] font-mono text-sky-600 dark:text-sky-400 truncate mt-1 flex items-center gap-1">
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span>Direct Link: {menu.url}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                        <button
                          type="button"
                          onClick={() => handleOpenAddSubmenu(menu)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="Tambah link submenu di dalam aplikasi ini"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Submenu ({submenus.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleMenu(menu.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            menu.isActive !== false
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {menu.isActive !== false ? 'Aktif' : 'Nonaktif'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditMenu(menu)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                          title="Edit Menu Aplikasi"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMenu(menu.id, menu.title)}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                          title="Hapus Menu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Submenu List Accordion */}
                    {submenus.length > 0 && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-2">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between">
                          <span>Submenu &amp; Tautan Tujuan ({submenus.length})</span>
                          <span className="text-[10px] font-normal lowercase italic text-slate-400">
                            diklik untuk membuka tautan terkait
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {submenus.map(sub => (
                            <div
                              key={sub.id}
                              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2 shadow-2xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {sub.title}
                                  </span>
                                  {sub.badge && (
                                    <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                      {sub.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                                  {sub.url}
                                </div>
                                {sub.description && (
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                    {sub.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSubmenu(menu.id, sub)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                  title="Edit Submenu"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubmenu(menu.id, sub.id, sub.title)}
                                  className="p-1 rounded text-rose-500 hover:text-rose-700 cursor-pointer"
                                  title="Hapus Submenu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400">
                <Layers className="w-10 h-10 mx-auto text-slate-400 opacity-50 mb-2" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Belum ada menu aplikasi internal yang dibuat</p>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Muat Template Aplikasi Standar KPPN</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SUBTAB: TEMA & TATA LETAK */}
      {activeSubTab === 'theme' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-600" />
              <span>Pengaturan Tema Warna &amp; Tampilan Sidebar</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sesuaikan warna, judul header, posisi drawer, dan ukuran sidebar agar serasi dengan kebutuhan internal KPPN.
            </p>
          </div>

          {/* Form Header Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Judul Header Sidebar:
              </label>
              <input
                type="text"
                value={localConfig.title}
                onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                placeholder="Aplikasi Internal KPPN"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subjudul / Keterangan:
              </label>
              <input
                type="text"
                value={localConfig.subtitle || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, subtitle: e.target.value })}
                placeholder="Pusat Pintasan Sistem DJPb & KPPN Semarang I"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Position & Width */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Posisi Tombol &amp; Sidebar di Layar:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocalConfig({ ...localConfig, position: 'left' })}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    localConfig.position !== 'right'
                      ? 'bg-sky-50 dark:bg-sky-950 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  👈 Sisi Kiri Layar (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setLocalConfig({ ...localConfig, position: 'right' })}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    localConfig.position === 'right'
                      ? 'bg-sky-50 dark:bg-sky-950 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  👉 Sisi Kanan Layar
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lebar Panel Drawer:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'standard', 'wide'] as const).map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setLocalConfig({ ...localConfig, widthMode: w })}
                    className={`p-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                      localConfig.widthMode === w
                        ? 'bg-sky-50 dark:bg-sky-950 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {w === 'compact' ? 'Ramping (320px)' : w === 'wide' ? 'Lebar (440px)' : 'Standar (370px)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Theme Presets */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Pilihan Preset Tema Warna:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(SIDEBAR_THEME_PRESETS).map(([key, preset]) => {
                const isSelected = (localConfig.themePreset || 'navy_kemenkeu') === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLocalConfig({ ...localConfig, themePreset: key as SidebarThemePreset })}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-sky-500 ring-2 ring-sky-500/30 bg-sky-50/30 dark:bg-sky-950/30 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Header color swatch preview */}
                    <div className={`h-8 rounded-lg bg-gradient-to-r ${preset.headerGradient} mb-2.5 flex items-center justify-between px-3 text-white`}>
                      <span className="text-[10px] font-mono font-bold">KPPN 026</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${preset.badgeBg} ${preset.badgeText}`}>
                        PREVIEW
                      </span>
                    </div>

                    <div className="font-black text-xs text-slate-900 dark:text-slate-100">
                      {preset.name}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {preset.description}
                    </p>

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center font-bold">
                        <Check className="w-3 h-3 stroke-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleSaveConfig()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Tema &amp; Tata Letak</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. SUBTAB: LIVE PREVIEW */}
      {activeSubTab === 'preview' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-600" />
                <span>Simulasi Tampilan Sidebar saat Dibuka oleh User</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Berikut adalah gambaran persis bagaimana sidebar akan tampil saat diakses oleh pegawai atau admin.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSaveConfig()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Terapkan Konfigurasi</span>
            </button>
          </div>

          {/* Interactive Mock Preview Box */}
          <div className="max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 text-slate-100 font-sans">
            {/* Header */}
            <div className={`p-4 bg-gradient-to-br ${SIDEBAR_THEME_PRESETS[localConfig.themePreset || 'navy_kemenkeu']?.headerGradient || 'from-blue-900 to-slate-900'} text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                      KPPN SEMARANG I
                    </span>
                    <h4 className="text-xs font-black text-white mt-0.5">
                      {localConfig.title || 'Aplikasi Internal KPPN'}
                    </h4>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-white/80" />
                </div>
              </div>
              {localConfig.subtitle && (
                <p className="text-[10px] text-white/80 mt-1.5">
                  {localConfig.subtitle}
                </p>
              )}
            </div>

            {/* Mock Items list */}
            <div className="p-3 space-y-2 max-h-80 overflow-y-auto bg-slate-950">
              {(localConfig.items || []).slice(0, 4).map(item => (
                <div key={item.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-slate-800 text-sky-400 flex items-center justify-center shrink-0">
                        {renderSidebarIcon(item.icon, 'w-3.5 h-3.5')}
                      </div>
                      <span className="text-xs font-bold text-white truncate">
                        {item.title}
                      </span>
                    </div>
                    {item.badge && (
                      <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.submenus && item.submenus.length > 0 && (
                    <div className="pl-8 space-y-1 text-[10px]">
                      {item.submenus.slice(0, 2).map(s => (
                        <div key={s.id} className="text-slate-400 flex items-center justify-between hover:text-sky-300">
                          <span>• {s.title}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-900 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Login: {currentUser?.displayName || 'Admin Super'}</span>
              <span className="text-sky-400 font-bold">Shortcut: Ctrl+B</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Menu Aplikasi */}
      {(isAddingMenu || editingMenuItem) && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 my-8 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-600" />
                <span>{editingMenuItem ? 'Edit Menu Aplikasi' : 'Tambah Menu Aplikasi Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddingMenu(false);
                  setEditingMenuItem(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama / Judul Menu Aplikasi: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={menuForm.title || ''}
                  onChange={(e) => setMenuForm({ ...menuForm, title: e.target.value })}
                  placeholder="Misal: SAKTI (Sistem Aplikasi Keuangan)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Menu:
                  </label>
                  <select
                    value={menuForm.category || 'Aplikasi Inti DJPb'}
                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                  >
                    {DEFAULT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ikon Aplikasi:
                  </label>
                  <select
                    value={menuForm.icon || 'Layers'}
                    onChange={(e) => setMenuForm({ ...menuForm, icon: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold font-mono"
                  >
                    {AVAILABLE_ICONS.map(ic => (
                      <option key={ic} value={ic}>{ic}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi / Keterangan Singkat:
                </label>
                <textarea
                  value={menuForm.description || ''}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  placeholder="Keterangan singkat mengenai aplikasi dan kegunaannya..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Badge Label (Opsional):
                  </label>
                  <input
                    type="text"
                    value={menuForm.badge || ''}
                    onChange={(e) => setMenuForm({ ...menuForm, badge: e.target.value })}
                    placeholder="e.g. UTAMA, BARU, SSO"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Direct Link URL (Jika tanpa submenu):
                  </label>
                  <input
                    type="text"
                    value={menuForm.url || ''}
                    onChange={(e) => setMenuForm({ ...menuForm, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuForm.isActive !== false}
                    onChange={(e) => setMenuForm({ ...menuForm, isActive: e.target.checked })}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-300">Status Aktif (Tampil di Sidebar)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsAddingMenu(false);
                  setEditingMenuItem(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveMenuForm}
                className="px-5 py-2 rounded-xl text-xs font-black text-white bg-sky-600 hover:bg-sky-500 shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Submenu */}
      {(isAddingSubmenu || editingSubmenuItem) && targetMenuForSubmenu && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 my-8 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300/40">
                  MENU INDUK: {targetMenuForSubmenu.title}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                  {editingSubmenuItem ? 'Edit Submenu / Tautan' : 'Tambah Submenu / Tautan Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingSubmenu(false);
                  setEditingSubmenuItem(null);
                  setTargetMenuForSubmenu(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Submenu: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={submenuForm.title || ''}
                  onChange={(e) => setSubmenuForm({ ...submenuForm, title: e.target.value })}
                  placeholder="Misal: SAKTI Production (Server Live)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL / Tautan Tujuan: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  value={submenuForm.url || ''}
                  onChange={(e) => setSubmenuForm({ ...submenuForm, url: e.target.value })}
                  placeholder="https://sakti.kemenkeu.go.id/"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-sky-600 dark:text-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan / Deskripsi Submenu (Opsional):
                </label>
                <input
                  type="text"
                  value={submenuForm.description || ''}
                  onChange={(e) => setSubmenuForm({ ...submenuForm, description: e.target.value })}
                  placeholder="Akses login live untuk bendahara & PPK"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Badge Label (Opsional):
                </label>
                <input
                  type="text"
                  value={submenuForm.badge || ''}
                  onChange={(e) => setSubmenuForm({ ...submenuForm, badge: e.target.value })}
                  placeholder="e.g. PRODUKSI, SSO, LATIHAN"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={submenuForm.isActive !== false}
                    onChange={(e) => setSubmenuForm({ ...submenuForm, isActive: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-300">Status Aktif (Tampil di Accordion Submenu)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsAddingSubmenu(false);
                  setEditingSubmenuItem(null);
                  setTargetMenuForSubmenu(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSubmenuForm}
                className="px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Submenu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
