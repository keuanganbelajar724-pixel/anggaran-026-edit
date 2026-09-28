import { BannerColorTheme } from '../types/user';

export interface BannerPresetDefinition {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  lightBgClass: string;
  darkBgClass: string;
  lightBorderClass: string;
  darkBorderClass: string;
  lightTextGradient: string;
  darkTextGradient: string;
  glowColorLight: string;
  glowColorDark: string;
  badgeClassLight: string;
  badgeClassDark: string;
  avatarRing: string;
  previewGradient: string;
}

export const BANNER_THEME_PRESETS: BannerPresetDefinition[] = [
  {
    id: 'kemenkeu_gold',
    name: 'Emas Kemenkeu & Royal Amber',
    subtitle: 'Wibawa & Kehormatan Kas Perbendaharaan',
    tag: 'Standar Super Admin',
    lightBgClass: 'bg-gradient-to-r from-amber-500/15 via-indigo-50/70 to-purple-50/50',
    darkBgClass: 'bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900',
    lightBorderClass: 'border-amber-300/80 shadow-indigo-500/5 text-slate-900',
    darkBorderClass: 'border-amber-500/40 shadow-amber-950/20 text-white',
    lightTextGradient: 'bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600',
    darkTextGradient: 'bg-gradient-to-r from-amber-300 via-white to-indigo-300',
    glowColorLight: 'bg-amber-500/15',
    glowColorDark: 'bg-amber-500/15',
    badgeClassLight: 'bg-amber-400/20 text-amber-800 border-amber-400/50',
    badgeClassDark: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
    avatarRing: 'bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 border-amber-400',
    previewGradient: 'from-amber-400 via-rose-500 to-indigo-600'
  },
  {
    id: 'emerald_mint',
    name: 'Zamrud & Mint Alami',
    subtitle: 'Segar, Sejuk, & Penuh Integritas',
    tag: 'Standar Pegawai',
    lightBgClass: 'bg-gradient-to-r from-emerald-500/15 via-teal-50/70 to-sky-50/50',
    darkBgClass: 'bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900',
    lightBorderClass: 'border-emerald-300/80 shadow-emerald-500/5 text-slate-900',
    darkBorderClass: 'border-emerald-500/40 shadow-emerald-950/20 text-white',
    lightTextGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600',
    darkTextGradient: 'bg-gradient-to-r from-emerald-300 via-white to-sky-300',
    glowColorLight: 'bg-emerald-500/15',
    glowColorDark: 'bg-emerald-500/15',
    badgeClassLight: 'bg-emerald-400/20 text-emerald-800 border-emerald-400/50',
    badgeClassDark: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40',
    avatarRing: 'bg-gradient-to-tr from-emerald-400 via-teal-500 to-sky-600 border-emerald-400',
    previewGradient: 'from-emerald-400 via-teal-500 to-cyan-500'
  },
  {
    id: 'sapphire_ocean',
    name: 'Safir Samudra & Biru Bahari',
    subtitle: 'Elegan Khas Kemenkeu Maritim',
    tag: 'Populer KPPN',
    lightBgClass: 'bg-gradient-to-r from-blue-500/15 via-sky-50/80 to-cyan-50/60',
    darkBgClass: 'bg-gradient-to-r from-slate-950 via-blue-950/80 to-slate-900',
    lightBorderClass: 'border-sky-300/80 shadow-blue-500/10 text-slate-900',
    darkBorderClass: 'border-sky-500/40 shadow-sky-950/30 text-white',
    lightTextGradient: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600',
    darkTextGradient: 'bg-gradient-to-r from-sky-300 via-white to-blue-300',
    glowColorLight: 'bg-sky-500/15',
    glowColorDark: 'bg-sky-500/20',
    badgeClassLight: 'bg-sky-400/20 text-sky-800 border-sky-400/50',
    badgeClassDark: 'bg-sky-400/20 text-sky-300 border-sky-400/40',
    avatarRing: 'bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 border-sky-400',
    previewGradient: 'from-blue-500 via-sky-500 to-cyan-400'
  },
  {
    id: 'amethyst_violet',
    name: 'Amethyst & Ungu Violet Kerajaan',
    subtitle: 'Eksklusif, Karismatik, & Futuristik',
    tag: 'Mewah',
    lightBgClass: 'bg-gradient-to-r from-purple-500/15 via-fuchsia-50/70 to-indigo-50/50',
    darkBgClass: 'bg-gradient-to-r from-slate-950 via-purple-950/80 to-slate-900',
    lightBorderClass: 'border-purple-300/80 shadow-purple-500/10 text-slate-900',
    darkBorderClass: 'border-purple-500/40 shadow-purple-950/30 text-white',
    lightTextGradient: 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600',
    darkTextGradient: 'bg-gradient-to-r from-purple-300 via-white to-fuchsia-300',
    glowColorLight: 'bg-purple-500/15',
    glowColorDark: 'bg-purple-500/20',
    badgeClassLight: 'bg-purple-400/20 text-purple-800 border-purple-400/50',
    badgeClassDark: 'bg-purple-400/20 text-purple-300 border-purple-400/40',
    avatarRing: 'bg-gradient-to-tr from-purple-400 via-fuchsia-500 to-indigo-600 border-purple-400',
    previewGradient: 'from-purple-500 via-fuchsia-500 to-pink-500'
  },
  {
    id: 'sunset_coral',
    name: 'Matahari Senja & Sunset Coral',
    subtitle: 'Hangat, Bersahabat, & Penuh Energi',
    tag: 'Hangat',
    lightBgClass: 'bg-gradient-to-r from-orange-500/15 via-amber-50/80 to-rose-50/60',
    darkBgClass: 'bg-gradient-to-r from-slate-950 via-orange-950/80 to-slate-900',
    lightBorderClass: 'border-orange-300/80 shadow-orange-500/10 text-slate-900',
    darkBorderClass: 'border-orange-500/40 shadow-orange-950/30 text-white',
    lightTextGradient: 'bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600',
    darkTextGradient: 'bg-gradient-to-r from-amber-300 via-white to-orange-300',
    glowColorLight: 'bg-orange-500/15',
    glowColorDark: 'bg-orange-500/20',
    badgeClassLight: 'bg-orange-400/20 text-orange-800 border-orange-400/50',
    badgeClassDark: 'bg-orange-400/20 text-orange-300 border-orange-400/40',
    avatarRing: 'bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 border-orange-400',
    previewGradient: 'from-amber-400 via-orange-500 to-rose-500'
  },
  {
    id: 'ruby_crimson',
    name: 'Merah Delima & Ruby Elegan',
    subtitle: 'Tegas, Tegap, & Berani Melayani',
    tag: 'Berani',
    lightBgClass: 'bg-gradient-to-r from-rose-500/15 via-red-50/70 to-pink-50/50',
    darkBgClass: 'bg-gradient-to-r from-slate-950 via-rose-950/80 to-slate-900',
    lightBorderClass: 'border-rose-300/80 shadow-rose-500/10 text-slate-900',
    darkBorderClass: 'border-rose-500/40 shadow-rose-950/30 text-white',
    lightTextGradient: 'bg-gradient-to-r from-rose-600 via-red-600 to-pink-600',
    darkTextGradient: 'bg-gradient-to-r from-rose-300 via-white to-red-300',
    glowColorLight: 'bg-rose-500/15',
    glowColorDark: 'bg-rose-500/20',
    badgeClassLight: 'bg-rose-400/20 text-rose-800 border-rose-400/50',
    badgeClassDark: 'bg-rose-400/20 text-rose-300 border-rose-400/40',
    avatarRing: 'bg-gradient-to-tr from-rose-400 via-red-500 to-pink-600 border-rose-400',
    previewGradient: 'from-rose-500 via-red-600 to-amber-500'
  },
  {
    id: 'midnight_neon',
    name: 'Midnight Obsidian & Cyber Cyan',
    subtitle: 'Futuristik Dark Mode dengan Aksen Neon Terang',
    tag: 'Modern',
    lightBgClass: 'bg-gradient-to-r from-slate-200/90 via-cyan-50/70 to-slate-100',
    darkBgClass: 'bg-gradient-to-r from-black via-slate-950 to-slate-900',
    lightBorderClass: 'border-cyan-400/60 shadow-cyan-500/10 text-slate-900',
    darkBorderClass: 'border-cyan-400/50 shadow-cyan-950/40 text-white',
    lightTextGradient: 'bg-gradient-to-r from-cyan-600 via-teal-600 to-slate-800',
    darkTextGradient: 'bg-gradient-to-r from-cyan-300 via-white to-emerald-300',
    glowColorLight: 'bg-cyan-500/15',
    glowColorDark: 'bg-cyan-500/25',
    badgeClassLight: 'bg-cyan-400/20 text-cyan-800 border-cyan-400/50',
    badgeClassDark: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40',
    avatarRing: 'bg-gradient-to-tr from-cyan-400 via-teal-500 to-slate-700 border-cyan-400',
    previewGradient: 'from-cyan-400 via-slate-900 to-teal-400'
  },
  {
    id: 'tropical_teal',
    name: 'Teal Tropis & Hijau Toska',
    subtitle: 'Nuansa Nusantara Maritim & Kesejukan',
    tag: 'Sejuk',
    lightBgClass: 'bg-gradient-to-r from-teal-500/15 via-emerald-50/70 to-cyan-50/50',
    darkBgClass: 'bg-gradient-to-r from-slate-950 via-teal-950/80 to-slate-900',
    lightBorderClass: 'border-teal-300/80 shadow-teal-500/10 text-slate-900',
    darkBorderClass: 'border-teal-500/40 shadow-teal-950/30 text-white',
    lightTextGradient: 'bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600',
    darkTextGradient: 'bg-gradient-to-r from-teal-300 via-white to-emerald-300',
    glowColorLight: 'bg-teal-500/15',
    glowColorDark: 'bg-teal-500/20',
    badgeClassLight: 'bg-teal-400/20 text-teal-800 border-teal-400/50',
    badgeClassDark: 'bg-teal-400/20 text-teal-300 border-teal-400/40',
    avatarRing: 'bg-gradient-to-tr from-teal-400 via-emerald-500 to-cyan-600 border-teal-400',
    previewGradient: 'from-teal-400 via-emerald-500 to-cyan-500'
  },
  {
    id: 'rose_gold',
    name: 'Mawar Merona & Rose Gold',
    subtitle: 'Estetis, Lembut, & Anggun Mempesona',
    tag: 'Anggun',
    lightBgClass: 'bg-gradient-to-r from-pink-500/15 via-rose-50/70 to-amber-50/50',
    darkBgClass: 'bg-gradient-to-r from-slate-950 via-pink-950/70 to-slate-900',
    lightBorderClass: 'border-pink-300/80 shadow-pink-500/10 text-slate-900',
    darkBorderClass: 'border-pink-500/40 shadow-pink-950/30 text-white',
    lightTextGradient: 'bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600',
    darkTextGradient: 'bg-gradient-to-r from-pink-300 via-white to-amber-200',
    glowColorLight: 'bg-pink-500/15',
    glowColorDark: 'bg-pink-500/20',
    badgeClassLight: 'bg-pink-400/20 text-pink-800 border-pink-400/50',
    badgeClassDark: 'bg-pink-400/20 text-pink-300 border-pink-400/40',
    avatarRing: 'bg-gradient-to-tr from-pink-400 via-rose-500 to-amber-400 border-pink-400',
    previewGradient: 'from-pink-400 via-rose-400 to-amber-300'
  },
  {
    id: 'titanium_slate',
    name: 'Monokrom Titanium & Perak Modern',
    subtitle: 'Minimalis Bersih, Netral, & Profesional',
    tag: 'Minimalis',
    lightBgClass: 'bg-gradient-to-r from-slate-300/40 via-slate-50 to-zinc-100',
    darkBgClass: 'bg-gradient-to-r from-zinc-950 via-slate-900 to-zinc-900',
    lightBorderClass: 'border-slate-300 shadow-slate-500/5 text-slate-900',
    darkBorderClass: 'border-slate-700 shadow-zinc-950/40 text-white',
    lightTextGradient: 'bg-gradient-to-r from-slate-800 via-slate-700 to-zinc-900',
    darkTextGradient: 'bg-gradient-to-r from-slate-200 via-white to-zinc-300',
    glowColorLight: 'bg-slate-400/10',
    glowColorDark: 'bg-slate-500/15',
    badgeClassLight: 'bg-slate-300/40 text-slate-800 border-slate-400/50',
    badgeClassDark: 'bg-slate-700/50 text-slate-200 border-slate-600',
    avatarRing: 'bg-gradient-to-tr from-slate-400 via-zinc-500 to-slate-700 border-slate-400',
    previewGradient: 'from-slate-400 via-zinc-600 to-slate-800'
  },
  {
    id: 'bordeaux_wine',
    name: 'Bordeaux Wine & Maroon Mewah',
    subtitle: 'Karismatik Mendalam dengan Kesan Berwibawa',
    tag: 'Aristokrat',
    lightBgClass: 'bg-gradient-to-r from-red-600/15 via-purple-50/60 to-rose-50/60',
    darkBgClass: 'bg-gradient-to-r from-slate-950 via-red-950/90 to-purple-950/60',
    lightBorderClass: 'border-red-300/80 shadow-red-500/10 text-slate-900',
    darkBorderClass: 'border-red-500/40 shadow-red-950/30 text-white',
    lightTextGradient: 'bg-gradient-to-r from-red-700 via-purple-700 to-rose-700',
    darkTextGradient: 'bg-gradient-to-r from-red-300 via-white to-purple-300',
    glowColorLight: 'bg-red-500/15',
    glowColorDark: 'bg-red-500/25',
    badgeClassLight: 'bg-red-400/20 text-red-800 border-red-400/50',
    badgeClassDark: 'bg-red-400/20 text-red-300 border-red-400/40',
    avatarRing: 'bg-gradient-to-tr from-red-500 via-purple-600 to-rose-600 border-red-400',
    previewGradient: 'from-red-600 via-purple-700 to-rose-700'
  },
  {
    id: 'electric_lime',
    name: 'Electric Lime & Hijau Semangat',
    subtitle: 'Cerlang, Dinamis, & Penuh Optimisme',
    tag: 'Energik',
    lightBgClass: 'bg-gradient-to-r from-lime-500/15 via-emerald-50/60 to-yellow-50/60',
    darkBgClass: 'bg-gradient-to-r from-slate-950 via-lime-950/60 to-slate-900',
    lightBorderClass: 'border-lime-400/80 shadow-lime-500/10 text-slate-900',
    darkBorderClass: 'border-lime-500/40 shadow-lime-950/20 text-white',
    lightTextGradient: 'bg-gradient-to-r from-lime-600 via-emerald-600 to-amber-600',
    darkTextGradient: 'bg-gradient-to-r from-lime-300 via-white to-yellow-300',
    glowColorLight: 'bg-lime-500/15',
    glowColorDark: 'bg-lime-500/20',
    badgeClassLight: 'bg-lime-400/20 text-lime-900 border-lime-500/50',
    badgeClassDark: 'bg-lime-400/20 text-lime-300 border-lime-400/40',
    avatarRing: 'bg-gradient-to-tr from-lime-400 via-emerald-500 to-yellow-500 border-lime-400',
    previewGradient: 'from-lime-400 via-emerald-500 to-yellow-400'
  }
];

export function getPresetById(id: string): BannerPresetDefinition {
  return BANNER_THEME_PRESETS.find(p => p.id === id) || BANNER_THEME_PRESETS[0];
}

export function getDefaultPresetId(isSuperAdmin: boolean): string {
  return isSuperAdmin ? 'kemenkeu_gold' : 'emerald_mint';
}
