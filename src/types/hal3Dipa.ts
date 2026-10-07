// =============================================================
// MODEL DATA MONITORING HAL III DIPA KPPN SEMARANG I
// =============================================================

export type StatusKanwilHal3 = 'Sudah Mengajukan' | 'Belum Mengajukan' | string;

export type StatusTindakLanjutHal3 = 
  | 'Belum Ditindaklanjuti'
  | 'Sudah Dihubungi'
  | 'Menunggu Jawaban'
  | 'Akan Mengajukan'
  | 'Tidak Mengajukan'
  | 'Hal III Sudah Sesuai'
  | 'Selesai'
  | 'Lainnya';

export type KeputusanSatkerHal3 =
  | 'Akan Mengajukan'
  | 'Tidak Mengajukan'
  | 'Masih Dalam Proses/Koordinasi'
  | 'Hal III Sudah Sesuai'
  | 'Lainnya'
  | '';

export type MediaKonfirmasiHal3 =
  | 'WhatsApp'
  | 'Telepon'
  | 'Email'
  | 'Surat'
  | 'Tatap Muka'
  | 'Lainnya'
  | '';

export const STANDAR_ALASAN_TIDAK_MENGAJUKAN = [
  'Hal III DIPA sudah sesuai dengan kebutuhan.',
  'Tidak terdapat perubahan kebutuhan.',
  'Realisasi/perencanaan masih sesuai dengan Hal III DIPA.',
  'Tidak terdapat perubahan RPD yang perlu direvisi.',
  'Masih menunggu keputusan/koordinasi internal.',
  'Akan mengajukan revisi pada periode berikutnya.',
  'Kegiatan tidak mengalami perubahan.',
  'Lainnya.'
] as const;

export interface TindakLanjutHal3 {
  id: string;
  monitoring_id: string;
  status_tindak_lanjut: StatusTindakLanjutHal3;
  keputusan_satker?: KeputusanSatkerHal3;
  alasan_kode?: string;
  alasan_detail?: string;
  tanggal_konfirmasi?: string;
  nama_pic?: string;
  jabatan_pic?: string;
  no_hp_pic?: string;
  media_konfirmasi?: MediaKonfirmasiHal3;
  catatan_kppn?: string;
  rencana_tindak_lanjut?: string;
  tanggal_follow_up?: string;
  petugas_id?: string;
  petugas_nama?: string;
  created_at: string;
  updated_at: string;
}

export type JenisHistoriHal3 =
  | 'UPLOAD_KANWIL'
  | 'STATUS_KANWIL_BERUBAH'
  | 'TINDAK_LANJUT_DIHUBUNGI'
  | 'KEPUTUSAN_SATKER'
  | 'CATATAN_KPPN'
  | 'SELESAI'
  | 'LAINNYA';

export interface HistoriHal3Item {
  id: string;
  monitoring_id: string;
  tanggal: string;
  jenis_perubahan: JenisHistoriHal3;
  status_lama?: string;
  status_baru?: string;
  keterangan: string;
  user_nama: string;
  user_id?: string;
  created_at: string;
}

export interface MonitoringHal3Item {
  id: string; // composite key: `${kode_satker}-${tahun_anggaran}-${periode}`
  tahun_anggaran: number; // e.g. 2026
  periode: string; // e.g. 'TW IV'
  kppn_kode: string; // e.g. '026' or 'Semarang I'
  kode_satker: string;
  nama_satker: string;
  nama_satker_source: string;
  status_kanwil: StatusKanwilHal3;
  source_upload_id: string;
  source_file_name: string;
  tanggal_data: string;
  source_row_reference?: number | string;
  is_in_latest_upload?: boolean;
  tindak_lanjut?: TindakLanjutHal3;
  histori?: HistoriHal3Item[];
  created_at: string;
  updated_at: string;
}

export interface UploadHal3Batch {
  id: string;
  nama_file: string;
  tahun_anggaran: number;
  periode: string;
  kppn_kode: string;
  jumlah_data: number;
  jumlah_baru: number;
  jumlah_update: number;
  jumlah_error: number;
  status_import: 'BERHASIL' | 'SEBAGIAN' | 'GAGAL';
  uploaded_by: string;
  uploaded_at: string;
  catatan?: string;
}
