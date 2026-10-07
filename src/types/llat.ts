export type LLATStatus = 
  | 'BELUM_DIMULAI' 
  | 'SEGERA' 
  | 'HARI_INI' 
  | 'BERJALAN' 
  | 'SELESAI' 
  | 'TERLEWAT';

export type LLATStatusMode = 'AUTO' | 'MANUAL';

export type LLATPrioritas = 'NORMAL' | 'PENTING' | 'KRITIS';

export type LLATPublikasi = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type LLATTargetPengguna = 
  | 'SEMUA_SATKER'
  | 'BENDAHARA'
  | 'PPK'
  | 'PPSPM'
  | 'KPA'
  | 'OPERATOR'
  | 'ADMIN'
  | 'UAKPA'
  | 'BLU';

export interface LLATEvent {
  llat_id: string;
  tahun_anggaran: number;
  kode_kegiatan: string;
  nama_kegiatan: string;
  kategori: string;
  deskripsi: string;
  tanggal_mulai: string;      // YYYY-MM-DD
  tanggal_batas: string;      // YYYY-MM-DD
  jam_batas: string;          // e.g. "17:00"
  timezone: string;           // e.g. "WIB"
  status: LLATStatus;
  status_mode: LLATStatusMode;
  manual_status?: LLATStatus;
  prioritas: LLATPrioritas;
  target_pengguna: string[];  // e.g. ['SEMUA_SATKER', 'PPK']
  dasar_hukum: string;        // e.g. "PER-17/PB/2025"
  nomor_peraturan: string;
  sumber_url?: string;
  catatan?: string;
  warna?: string;
  urutan: number;
  is_active: boolean;
  publikasi: LLATPublikasi;
  created_at: string;
  updated_at: string;
  version?: number;
}

export interface LLATCategory {
  id: string;
  nama: string;
  deskripsi?: string;
  warna: string;
  is_active: boolean;
}

export interface LLATReminderConfig {
  reminder_h7: boolean;
  reminder_h3: boolean;
  reminder_h1: boolean;
  reminder_h0: boolean; // Hari H
}

export interface LLATSettings {
  is_active: boolean;
  menu_title: string;
  menu_description: string;
  menu_icon: string;
  tahun_aktif: number;
  version: number;
  reminder: LLATReminderConfig;
}

export interface LLATAuditLogEntry {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  record_id?: string;
  kegiatan_name?: string;
  old_value?: string;
  new_value?: string;
  details?: string;
}

export interface LLATVersionRecord {
  version: number;
  tahun_anggaran: number;
  updated_at: string;
  updated_by: string;
  notes: string;
  events_count: number;
}
