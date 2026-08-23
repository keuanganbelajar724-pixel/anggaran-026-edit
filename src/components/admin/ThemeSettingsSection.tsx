import React, { useState } from 'react';
import { Palette, Sparkles, LayoutGrid, Check, RotateCcw, Sliders, Eye, Wand2, PaintBucket, SunMoon, Layers } from 'lucide-react';
import { DashboardConfig, DashboardThemeSettings, ThemePresetId } from '../../types';
import { THEME_PRESETS, DEFAULT_THEME_SETTINGS, getThemePreset } from '../../utils/themeUtils';

interface ThemeSettingsSectionProps {
  dashboardConfig: DashboardConfig;
  onUpdateDashboardConfig: (newConfig: DashboardConfig) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  isDark?: boolean;
}

export const ThemeSettingsSection: React.FC<ThemeSettingsSectionProps> = ({
  dashboardConfig,
  onUpdateDashboardConfig,
  addToast,
  isDark = true
}) => {
  const currentSettings: DashboardThemeSettings = dashboardConfig.themeSettings || DEFAULT_THEME_SETTINGS;

  const [selectedPreset, setSelectedPreset] = useState<ThemePresetId>(currentSettings.preset || 'default_kppn');
  const [tabLayoutMode, setTabLayoutMode] = useState<'auto_fill' | 'compact'>(currentSettings.tabLayoutMode || 'auto_fill');
  const [primaryColor, setPrimaryColor] = useState<string>(currentSettings.primaryColor || '#059669');
  const [accentColor, setAccentColor] = useState<string>(currentSettings.accentColor || '#0284c7');
  const [bannerStartColor, setBannerStartColor] = useState<string>(currentSettings.bannerStartColor || '#0f172a');
  const [bannerEndColor, setBannerEndColor] = useState<string>(currentSettings.bannerEndColor || '#134e4a');
  const [activeTabGlow, setActiveTabGlow] = useState<boolean>(currentSettings.activeTabGlow !== false);

  const activePresetDef = getThemePreset(selectedPreset);

  const handleSelectPreset = (presetId: ThemePresetId) => {
    setSelectedPreset(presetId);
    const preset = getThemePreset(presetId);
    setPrimaryColor(preset.primaryHex);
    setAccentColor(preset.accentHex);
    
    // Set banner start and end based on preset
    if (presetId === 'default_kppn') {
      setBannerStartColor('#0f172a');
      setBannerEndColor('#134e4a');
    } else if (presetId === 'midnight_indigo') {
      setBannerStartColor('#0f172a');
      setBannerEndColor('#312e81');
    } else if (presetId === 'emerald_cyber') {
      setBannerStartColor('#064e3b');
      setBannerEndColor('#0f172a');
    } else if (presetId === 'golden_amber') {
      setBannerStartColor('#1c1917');
      setBannerEndColor('#78350f');
    } else if (presetId === 'crimson_prestige') {
      setBannerStartColor('#18181b');
      setBannerEndColor('#881337');
    } else if (presetId === 'oceanic_cyan') {
      setBannerStartColor('#082f49');
      setBannerEndColor('#0c4a6e');
    } else if (presetId === 'royal_purple') {
      setBannerStartColor('#1e1b4b');
      setBannerEndColor('#581c87');
    }
  };

  const handleSaveTheme = () => {
    const newThemeSettings: DashboardThemeSettings = {
      preset: selectedPreset,
      primaryColor,
      accentColor,
      bannerStartColor,
      bannerEndColor,
      tabLayoutMode,
      activeTabGlow
    };

    const newConfig: DashboardConfig = {
      ...dashboardConfig,
      themeSettings: newThemeSettings
    };

    onUpdateDashboardConfig(newConfig);
    addToast('🎨 Tema dan tata letak warna dashboard berhasil disimpan!', 'success');
  };

  const handleResetToDefault = () => {
    setSelectedPreset('default_kppn');
    setTabLayoutMode('auto_fill');
    setPrimaryColor(DEFAULT_THEME_SETTINGS.primaryColor || '#059669');
    setAccentColor(DEFAULT_THEME_SETTINGS.accentColor || '#0284c7');
    setBannerStartColor(DEFAULT_THEME_SETTINGS.bannerStartColor || '#0f172a');
    setBannerEndColor(DEFAULT_THEME_SETTINGS.bannerEndColor || '#134e4a');
    setActiveTabGlow(true);

    const newConfig: DashboardConfig = {
      ...dashboardConfig,
      themeSettings: DEFAULT_THEME_SETTINGS
    };
    onUpdateDashboardConfig(newConfig);
    addToast('Tema berhasil dikembalikan ke standar resmi KPPN Semarang I!', 'info');
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl">
      
      {/* Header Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/60 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            <Palette className="w-3.5 h-3.5 text-indigo-500" />
            <span>KUSTOMISASI TEMA &amp; TAMPILAN DASHBOARD</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Pengaturan Warna &amp; Tata Letak Navigasi Rata Baris</span>
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl">
            Sesuaikan palet warna dashboard, gradasi banner, gaya tombol, dan aktifkan mode perataan tab otomatis dari kiri ke kanan penuh tanpa meninggalkan ruang kosong di ujung kanan.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Standar KPPN</span>
          </button>

          <button
            type="button"
            onClick={handleSaveTheme}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan Tema</span>
          </button>
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-lg relative overflow-hidden transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, ${bannerStartColor} 0%, ${bannerEndColor} 100%)`
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 border border-white/20 backdrop-blur-xs">
              <Eye className="w-3 h-3 text-amber-300" />
              <span>Live Preview Tema: {activePresetDef.name}</span>
            </div>
            <h4 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Sistem Monitoring Real-Time IKPA KPPN Semarang I</span>
            </h4>
            <p className="text-xs text-white/80 max-w-xl">
              Pratinjau visual banner, aksen tombol aktif, dan perataan navigasi yang akan langsung dilihat oleh satker.
            </p>
          </div>

          {/* Sample Mini Tab Pills in Preview */}
          <div className="w-full md:w-auto p-2 rounded-xl bg-black/30 border border-white/15 backdrop-blur-md">
            <div className="text-[10px] font-black uppercase tracking-wider text-white/60 mb-1.5 px-1 flex items-center justify-between">
              <span>Contoh Tab Aktif</span>
              <span className="text-emerald-400 font-bold">{tabLayoutMode === 'auto_fill' ? 'Mode: Rata Penuh (Auto-Fill)' : 'Mode: Compact'}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <div 
                className="px-3 py-1 rounded-lg text-xs font-black text-white shadow-md transition-all flex items-center gap-1.5 ring-1 ring-white/30"
                style={{ backgroundColor: primaryColor }}
              >
                <span>Dashboard IKPA</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/40 text-emerald-300 font-mono font-bold">144</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg text-xs font-bold text-white/70 bg-white/5 border border-white/10 flex items-center gap-1">
                <span>Capaian Output</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg text-xs font-bold text-white/70 bg-white/5 border border-white/10 flex items-center gap-1">
                <span>Pengelolaan UP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Pengaturan Mode Perataan Tab Navigasi (User Request Solved) */}
      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
              <LayoutGrid className="w-3 h-3 text-sky-600 dark:text-sky-400" />
              <span>PERATAAN TAB NAVIGASI HEADER</span>
            </div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Gaya Tata Letak Baris Tab Navigasi (Auto-Fit Rata Kiri Sampai Kanan)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih apakah tab-tab di header harus otomatis membagi lebar penuh kontainer secara merata tanpa menyisakan ruang kosong di kanan, atau menggunakan lebar konten standar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Option 1: Auto Fill / Full Width Justified (Default & Recommended) */}
          <label 
            onClick={() => setTabLayoutMode('auto_fill')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
              tabLayoutMode === 'auto_fill'
                ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-500 shadow-md ring-2 ring-sky-500/20'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <input
              type="radio"
              name="tabLayoutMode"
              checked={tabLayoutMode === 'auto_fill'}
              onChange={() => setTabLayoutMode('auto_fill')}
              className="mt-1 text-sky-600 focus:ring-sky-500"
            />
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  ✨ Rata Penuh dari Kiri ke Kanan (Auto-Fill Justified)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-slate-950">
                  DIREKOMENDASIKAN
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Setiap tab secara cerdas membagi lebar baris dari ujung kiri sampai ujung kanan. Tidak ada lagi ruang kosong menganga di kanan baris kedua bila ada banyak tab aktif.
              </p>
            </div>
          </label>

          {/* Option 2: Compact */}
          <label 
            onClick={() => setTabLayoutMode('compact')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
              tabLayoutMode === 'compact'
                ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-500 shadow-md ring-2 ring-sky-500/20'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <input
              type="radio"
              name="tabLayoutMode"
              checked={tabLayoutMode === 'compact'}
              onChange={() => setTabLayoutMode('compact')}
              className="mt-1 text-sky-600 focus:ring-sky-500"
            />
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-black text-slate-900 dark:text-white block">
                📐 Ukuran Tab Kompak (Sesuai Panjang Teks)
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Lebar setiap tab menyesuaikan panjang teks judul menu masing-masing tanpa dipaksa merata hingga ujung kanan.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 2. Pilihan Preset Tema Warna Elegan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PaintBucket className="w-4 h-4 text-emerald-500" />
              <span>Pilihan Palet Preset Tema Warna Elegan</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pilih tema warna siap pakai yang dirancang dengan rasio kontras tinggi dan estetika modern Ditjen Perbendaharaan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Object.values(THEME_PRESETS).map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden group ${
                  isSelected
                    ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-500/30 bg-white dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Visual Color Preview Bar */}
                <div className="h-12 w-full rounded-xl p-2 flex items-center justify-between shadow-inner relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${preset.bannerGradient.includes('to-') ? '' : ''} ${preset.primaryHex} 0%, ${preset.accentHex} 100%)`
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full border border-white/50 shadow-xs" style={{ backgroundColor: preset.primaryHex }} />
                    <span className="w-4 h-4 rounded-full border border-white/50 shadow-xs" style={{ backgroundColor: preset.accentHex }} />
                  </div>
                  {isSelected && (
                    <span className="w-6 h-6 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-md font-bold">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {preset.name}
                    </span>
                  </div>
                  <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-md border ${preset.badgeColor}`}>
                    {preset.badge}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {preset.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Custom Color Pickers & Hex Codes (Jika Admin Ingin Custom Bebas) */}
      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-500" />
              <span>Kustomisasi Warna Hex &amp; Gradasi Latar (Opsional Custom)</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Ubah kode warna hex untuk banner utama, aksen tombol aktif, dan gradasi latar sesuai selera Anda.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* 1. Primary Highlight Color */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 text-[11px]">
              Warna Utama Tombol / Tab Aktif:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => {
                  setPrimaryColor(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer p-0 bg-transparent"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => {
                  setPrimaryColor(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 font-mono font-bold text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 2. Accent Color */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 text-[11px]">
              Warna Aksen / Badge Highlight:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => {
                  setAccentColor(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer p-0 bg-transparent"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => {
                  setAccentColor(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 font-mono font-bold text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 3. Banner Gradient Start */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 text-[11px]">
              Banner Gradasi Awal (Start):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bannerStartColor}
                onChange={(e) => {
                  setBannerStartColor(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer p-0 bg-transparent"
              />
              <input
                type="text"
                value={bannerStartColor}
                onChange={(e) => {
                  setBannerStartColor(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 font-mono font-bold text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 4. Banner Gradient End */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 text-[11px]">
              Banner Gradasi Akhir (End):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bannerEndColor}
                onChange={(e) => {
                  setBannerEndColor(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer p-0 bg-transparent"
              />
              <input
                type="text"
                value={bannerEndColor}
                onChange={(e) => {
                  setBannerEndColor(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 font-mono font-bold text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={activeTabGlow}
              onChange={(e) => setActiveTabGlow(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Aktifkan Efek Glow Cahaya Modern pada Tab Navigasi Aktif</span>
          </label>
        </div>
      </div>

      {/* Bottom Save Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={handleResetToDefault}
          className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          Kembalikan ke Default
        </button>

        <button
          type="button"
          onClick={handleSaveTheme}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Simpan Perubahan Tema &amp; Tata Letak</span>
        </button>
      </div>

    </div>
  );
};
