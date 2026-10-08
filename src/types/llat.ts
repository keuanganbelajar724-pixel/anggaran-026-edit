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

export type LLATStatusVerifikasi = 
  | 'TERVERIFIKASI' 
  | 'BELUM_DIVERIFIKASI' 
  | 'PERLU_PEMERIKSAAN_MANUAL';

export type LLATStatusPenyelesaian = 
  | 'BELUM_SELESAI' 
  | 'SELESAI' 
  | 'TIDAK_ADA_STATUS';

export type LLATKetentuanWaktu = 
  | 'HARI_KERJA' 
  | 'HARI_KALENDER' 
  | 'TIDAK_DITENTUKAN';

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

export interface LLATSubDeadline {
  id: string;
  label: string;
  tanggal: string;
  jam?: string;
  jenis: string; // e.g. "Batas Penerimaan Dokumen", "Batas Penyelesaian SP2D"
  tahun_kalender_tenggat?: number;
  periode_transaksi?: string;
  jenis_dokumen?: string;
  status_verifikasi?: LLATStatusVerifikasi;
  catatan?: string;
}

export interface LLATEvent {
  llat_id: string;
  tahun_anggaran: number;
  kode_kegiatan: string;
  nama_kegiatan: string;
  kategori: string;
  deskripsi: string;
  tanggal_mulai: string;      // YYYY-MM-DD
  tanggal_batas: string;      // YYYY-MM-DD (batas penerimaan dokumen / batas utama)
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

  // Field Ekstensi Master LLAT TA 2026
  tahun_kalender_tenggat?: number;      // 2026 atau 2027 (penyelesaian TA 2026)
  periode_transaksi?: string;           // e.g. "Sampai dengan 30 September 2026", "1-31 Oktober 2026", dll.
  jenis_dokumen?: string;               // e.g. "Data Kontrak/Addendum", "SPM-LS", "SP3B-BLU", "LPJ", dll.
  jenis_tenggat?: string;               // e.g. "Batas Diterima KPPN", "Batas Penyelesaian", "Batas Penyetoran", dll.
  tanggal_tenggat?: string;             // Alias / sinkron dengan tanggal_batas
  jam_tenggat?: string;                 // Alias / sinkron dengan jam_batas
  aturan_rel_tenggat?: string;          // e.g. "Paling lambat 5 hari kerja setelah kontrak ditandatangani"
  tanggal_penerimaan?: string;          // Tanggal batas penerimaan dokumen
  jam_penerimaan?: string;              // Jam batas penerimaan dokumen
  tanggal_penyelesaian?: string;        // Tanggal batas penyelesaian proses / SP2D
  jam_penyelesaian?: string;            // Jam batas penyelesaian proses
  ketentuan?: string;                   // Penjelasan ketentuan rinci
  ketentuan_waktu?: LLATKetentuanWaktu; // Hari kerja vs hari kalender
  ketentuan_khusus?: string;            // Ketentuan jaminan garansi bank, syarat dispensasi, dll.
  halaman_sumber?: string | number;     // Halaman dalam materi sosialisasi PDF
  nama_file_sumber?: string;            // Alias nama_file_sumber
  file_sumber?: string;                 // Nama file materi, default "sosialisasi LLAT 2026 ga full.pdf"
  status_verifikasi?: LLATStatusVerifikasi; // Status verifikasi terhadap dokumen resmi
  status_penyelesaian?: LLATStatusPenyelesaian; // Status konfirmasi penyelesaian kegiatan
  is_tanggal_pasti?: boolean;           // False jika berupa aturan relatif
  aturan_relatif?: string;              // Misal "2 hari kerja setelah dokumen diterima"
  sub_deadlines?: LLATSubDeadline[];    // Jika 1 kegiatan induk memiliki multi-tenggat
  updated_by?: string;                  // User yang terakhir memperbarui
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
