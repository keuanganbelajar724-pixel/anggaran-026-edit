import { DashboardThemeSettings, ThemePresetId } from '../types';

export interface ThemePresetDefinition {
  id: ThemePresetId;
  name: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  previewGradient: string;
  bannerGradient: string;
  primaryHex: string;
  accentHex: string;
  headerAccentGlow: string;
  activeTabClass: string;
}

export const THEME_PRESETS: Record<ThemePresetId, ThemePresetDefinition> = {
  default_kppn: {
    id: 'default_kppn',
    name: 'KPPN Emerald Navy (Standar Resmi)',
    subtitle: 'Warna default resmi Kemenkeu & KPPN Semarang I: Deep Navy, Emerald Green & Sky Blue.',
    badge: 'DEFAULT RESMI',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    previewGradient: 'from-slate-900 via-slate-800 to-teal-900',
    bannerGradient: 'from-slate-950 via-slate-900 to-teal-950',
    primaryHex: '#059669',
    accentHex: '#0284c7',
    headerAccentGlow: 'rgba(5, 150, 105, 0.25)',
    activeTabClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
  },
  midnight_indigo: {
    id: 'midnight_indigo',
    name: 'Midnight Royal Indigo & Violet',
    subtitle: 'Nuansa eksekutif modern bernuansa Midnight Indigo, Deep Violet, dan Neon Blue.',
    badge: 'ROYAL INDIGO',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    previewGradient: 'from-slate-950 via-indigo-950 to-purple-900',
    bannerGradient: 'from-slate-950 via-indigo-950 to-slate-900',
    primaryHex: '#4f46e5',
    accentHex: '#8b5cf6',
    headerAccentGlow: 'rgba(79, 70, 229, 0.3)',
    activeTabClass: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/40'
  },
  emerald_cyber: {
    id: 'emerald_cyber',
    name: 'Emerald Treasury & Cyber Green',
    subtitle: 'Nuansa hijau perbendaharaan khas Ditjen Perbendaharaan Kementerian Keuangan.',
    badge: 'CYBER EMERALD',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    previewGradient: 'from-emerald-950 via-slate-950 to-teal-900',
    bannerGradient: 'from-emerald-950 via-slate-900 to-emerald-900',
    primaryHex: '#10b981',
    accentHex: '#14b8a6',
    headerAccentGlow: 'rgba(16, 185, 129, 0.3)',
    activeTabClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
  },
  golden_amber: {
    id: 'golden_amber',
    name: 'Executive Amber Gold & Mocha',
    subtitle: 'Nuansa emas prestisius hangat khas apresiasi kinerja & penghargaan Ditjen Perbendaharaan.',
    badge: 'PRESTIGE GOLD',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    previewGradient: 'from-stone-950 via-amber-950 to-stone-900',
    bannerGradient: 'from-stone-950 via-amber-950 to-stone-900',
    primaryHex: '#d97706',
    accentHex: '#f59e0b',
    headerAccentGlow: 'rgba(217, 119, 6, 0.3)',
    activeTabClass: 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/40'
  },
  crimson_prestige: {
    id: 'crimson_prestige',
    name: 'Crimson Ruby & Burgundy Prestige',
    subtitle: 'Nuansa merah marun berwibawa tinggi, bold, tegas, dan bersemangat tinggi.',
    badge: 'BURGUNDY RUBY',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    previewGradient: 'from-zinc-950 via-rose-950 to-zinc-900',
    bannerGradient: 'from-zinc-950 via-rose-950 to-zinc-900',
    primaryHex: '#e11d48',
    accentHex: '#f43f5e',
    headerAccentGlow: 'rgba(225, 29, 72, 0.3)',
    activeTabClass: 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-rose-400/40'
  },
  oceanic_cyan: {
    id: 'oceanic_cyan',
    name: 'Oceanic Deep Blue & Cyan',
    subtitle: 'Nuansa biru samudra dalam dengan aksen cyan futuristik cerah yang menyegarkan.',
    badge: 'OCEANIC CYAN',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    previewGradient: 'from-slate-950 via-sky-950 to-cyan-900',
    bannerGradient: 'from-slate-950 via-sky-950 to-slate-900',
    primaryHex: '#0284c7',
    accentHex: '#06b6d4',
    headerAccentGlow: 'rgba(2, 132, 199, 0.3)',
    activeTabClass: 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 ring-1 ring-sky-400/40'
  },
  royal_purple: {
    id: 'royal_purple',
    name: 'Imperial Royal Purple & Fuchsia',
    subtitle: 'Nuansa ungu kerajaan eksklusif, artistik, dan modern.',
    badge: 'IMPERIAL PURPLE',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    previewGradient: 'from-slate-950 via-purple-950 to-indigo-900',
    bannerGradient: 'from-slate-950 via-purple-950 to-slate-900',
    primaryHex: '#7c3aed',
    accentHex: '#c026d3',
    headerAccentGlow: 'rgba(124, 58, 237, 0.3)',
    activeTabClass: 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400/40'
  },
  custom: {
    id: 'custom',
    name: 'Custom Palette (Pilihan Bebas Admin)',
    subtitle: 'Atur warna gradasi banner, aksen tombol, dan glow navigasi sesuai preferensi khusus.',
    badge: 'CUSTOM PALETTE',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
    previewGradient: 'from-slate-950 via-slate-800 to-indigo-900',
    bannerGradient: 'from-slate-950 via-slate-900 to-indigo-950',
    primaryHex: '#059669',
    accentHex: '#0284c7',
    headerAccentGlow: 'rgba(5, 150, 105, 0.3)',
    activeTabClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
  }
};

export const DEFAULT_THEME_SETTINGS: DashboardThemeSettings = {
  preset: 'default_kppn',
  primaryColor: '#059669',
  accentColor: '#0284c7',
  bannerStartColor: '#0f172a',
  bannerEndColor: '#134e4a',
  tabLayoutMode: 'auto_fill', // Default: Rata penuh dari kiri ke kanan tanpa ruang kosong di kanan
  activeTabGlow: true
};

export function getThemePreset(presetId?: ThemePresetId): ThemePresetDefinition {
  if (!presetId || !THEME_PRESETS[presetId]) {
    return THEME_PRESETS.default_kppn;
  }
  return THEME_PRESETS[presetId];
}
