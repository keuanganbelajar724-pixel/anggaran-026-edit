export type SidebarThemePreset = 
  | 'navy_kemenkeu' 
  | 'emerald_djpb' 
  | 'midnight_indigo' 
  | 'slate_dark' 
  | 'royal_purple' 
  | 'crimson_maroon'
  | 'custom';

export interface SidebarSubmenuItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  badge?: string; // e.g. "PRODUKSI", "SSO", "BARU", "DJPb", "PORTAL"
  icon?: string;
  isExternal?: boolean;
  isActive: boolean;
}

export interface SidebarMenuItem {
  id: string;
  title: string;
  category?: string; // e.g. "Aplikasi Inti DJPb", "Perbankan & Kas", "Internal KPPN", "Layanan Satker"
  description?: string;
  icon?: string;
  badge?: string;
  url?: string; // Direct URL if no submenus
  submenus?: SidebarSubmenuItem[]; // Nested submenus
  isActive: boolean;
  order?: number;
}

export interface SidebarConfig {
  isEnabled: boolean; // Saklar aktif/nonaktif sidebar
  title: string; // e.g. "Aplikasi Internal KPPN"
  subtitle?: string; // e.g. "Pusat Pintasan Sistem DJPb & KPPN Semarang I"
  themePreset: SidebarThemePreset;
  customBgColor?: string; // e.g. "#0f172a"
  customHeaderColor?: string; // e.g. "#1e3a8a"
  customTextColor?: string;
  customAccentColor?: string; // e.g. "#38bdf8"
  position: 'left' | 'right';
  widthMode: 'compact' | 'standard' | 'wide'; // 300px, 360px, 420px
  items: SidebarMenuItem[];
  updatedAt?: string;
  updatedBy?: string;
}
