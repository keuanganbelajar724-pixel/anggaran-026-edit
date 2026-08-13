export type IKPAPredikat = 'Sangat Baik' | 'Baik' | 'Cukup' | 'Sangat Perlu Perhatian';

export interface IndikatorIKPA {
  revisiDipa: number; // Max 100
  deviasiHal3Dipa: number; // Max 100
  penyerapanAnggaran: number; // Max 100
  belanjaKontraktual: number; // Max 100
  penyelesaianTagihan: number; // Max 100
  pengelolaanUpTup: number; // Max 100
  dispensasiSpm: number; // Max 100
  capaianOutput: number; // Max 100
}

export interface RiwayatBulananIKPA {
  bulan: string; // 'Januari' | 'Februari' | 'Maret' | 'April' | 'Mei' | 'Juni' | 'Juli' etc.
  nilaiIKPA: number;
  capaianOutput: number;
  deviasiHal3Dipa: number;
  penyerapanAnggaran: number;
  revisiDipa?: number;
  belanjaKontraktual?: number;
  penyelesaianTagihan?: number;
  pengelolaanUpTup?: number;
  dispensasiSpm?: number;
}

export interface PejabatRoleInfo {
  nama: string;
  nip?: string;
  noHp?: string;
  email?: string;
}

export interface PejabatDanOperator {
  kpa?: PejabatRoleInfo;
  ppk?: PejabatRoleInfo;
  ppspm?: PejabatRoleInfo;
  bendahara?: PejabatRoleInfo;
  operatorKomitmen?: PejabatRoleInfo;
  operatorPembayaran?: PejabatRoleInfo;
  operatorPelaporan?: PejabatRoleInfo;
  operatorGaji?: PejabatRoleInfo;
}

export interface SatkerIKPA {
  id: string;
  kodeSatker: string;
  kodeBa?: string; // 3 digit Kode BA, e.g. '015', '018', '025', '060'
  kodeKppn?: string; // 3 digit Kode KPPN, e.g. '026'
  namaSatker: string;
  kementerianLembaga: string;
  unitEselon1?: string;
  paguAnggaran: number;
  realisasiAnggaran: number;
  persenPenyerapan: number;
  
  // Status Capaian Output
  statusCapaianOutput: 'Sudah Terlaporkan' | 'Belum Terlaporkan' | 'Terlambat';
  
  // Breakdown 8 Indikator IKPA
  indikator: IndikatorIKPA;
  
  // Total Nilai IKPA
  nilaiTotalIKPA: number;
  predikat: IKPAPredikat;
  
  // Flag indicating if full IKPA Excel data has been uploaded
  hasIKPAData?: boolean;
  
  // Riwayat Bulanan (Januari - Juli / Update Terus)
  riwayatBulanan?: RiwayatBulananIKPA[];
  
  // Catatan Masalah / Warning Flags
  issues: string[];
  
  // Kontak Satker Utama
  namaPic?: string;
  noHpPic?: string;
  emailPic?: string;
  alamatSatker?: string;

  // Rincian Pengelola Keuangan & Operator Satker (Internal - Diakses via Detail)
  pejabatOperator?: PejabatDanOperator;
  
  // Metadata
  periodeUpdate: string;
  isModified?: boolean;

  // Keamanan & Akses Password Satker
  passwordSatker?: string;
}

export interface BroadcastTargetRole {
  roleKey: 'kpa' | 'ppk' | 'ppspm' | 'bendahara' | 'operatorKomitmen' | 'operatorPembayaran' | 'operatorPelaporan' | 'operatorGaji';
  roleLabel: string;
}

export interface DynamicBroadcastTemplate {
  id: string;
  namaTemplate: string;
  deskripsi?: string;
  pesanTemplate: string;
}

export interface CustomExcelBroadcastItem {
  kodeSatker: string;
  namaSatker: string;
  targetRole?: string;
  namaPejabat?: string;
  noHpTarget?: string;
  customMessage?: string;
  nilaiIkpa?: number;
  catatanKhusus?: string;
}

export interface UploadLog {
  id: string;
  fileName: string;
  uploadDate: string;
  rowCount: number;
  cleanedCount: number;
  status: 'Success' | 'Warning' | 'Error';
  notes: string[];
}

export interface ExcelUploadHistory {
  id: string;
  fileName: string;
  periode: string; // e.g. 'Agustus 2026', 'Juli 2026', 'Juni 2026', 'Triwulan I 2026'
  uploadDate: string;
  uploadedBy: string;
  satkerCount: number;
  averageIKPA: number;
  notes?: string;
  satkersData: SatkerIKPA[];
  category?: 'IKPA' | 'CAPAIAN_OUTPUT' | 'SERTIFIKASI';
  isActive?: boolean;
}

export interface TemplateMessage {
  id: string;
  jenis: 'Capaian Output' | 'IKPA Rendah' | 'Penyerapan Rendah' | 'Deviasi Hal III DIPA' | 'General';
  judul: string;
  subjekEmail: string;
  isiWa: string;
  isiSurat: string;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: 'Penting' | 'Batas Waktu' | 'Surat Edaran' | 'Jadwal' | 'Sistem';
  content: string;
  author: string;
  isPinned?: boolean;
  isUrgent?: boolean;
  isActive?: boolean;
  isHeroSpotlight?: boolean;
  heroDisplayMode?: 'full' | 'compact';
  linkUrl?: string;
  linkLabel?: string;
  linkType?: 'pdf' | 'youtube' | 'drive' | 'general';
  attachmentUrl?: string; // Link Drive / File PDF Surat Edaran
  attachmentLabel?: string;
  surveyUrl?: string; // Link Survei Kepuasan / Google Form
  surveyLabel?: string;
}

export interface PejabatSertifikasi {
  id: string;
  nomor: number;
  nip: string;
  nama: string;
  kdSatker: string;
  nmSatker: string;
  nmJabatan: string; // e.g. Pejabat Pembuat Komitmen, Pejabat Penanda Tangan Surat Perintah Membayar, Bendahara Penerimaan, Bendahara Pengeluaran
  noSertifikat: string; // e.g. PNT-06134/026/044/2021 or "Tidak Ada"
  tglSertifikat?: string; // e.g. 30/06/2021 or ""
  tglKadaluarsa?: string; // e.g. 30/06/2026 or ""
}

export type KnowledgeCategory = 
  | 'JUKNIS_SAKTI' 
  | 'LAYANAN_PD_KONTRAK' 
  | 'PELAPORAN_SAKTI' 
  | 'ADMINISTRATOR_SAKTI' 
  | 'VIDEO_TUTORIAL' 
  | 'TOOLS_CSV' 
  | 'PANDUAN_CUSTOM';

export interface KnowledgeStep {
  stepNumber: number;
  title: string;
  description: string;
  importantNotes?: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: KnowledgeCategory;
  summary: string;
  contentMarkdown?: string;
  steps?: KnowledgeStep[];
  videoUrl?: string;
  downloadUrl?: string;
  referenceUrl?: string;
  author: string;
  date: string;
  isPinned?: boolean;
  tags?: string[];
}

export interface PresentationMaterial {
  id: string;
  title: string;
  category: 'SAKTI & Juknis' | 'PER-5 & IKPA' | 'LPJ & Relevansi' | 'Bimtek Perbendaharaan' | 'Mekanisme SP2D' | 'Laporan Keuangan' | 'Umum';
  description: string;
  presenter: string;
  date: string;
  embedUrl: string; // Google Slides embed, Drive preview, PDF viewer link, or Canva embed
  type?: 'google_slides' | 'pdf_presentation' | 'drive_embed' | 'canva_embed';
  slideCount?: number;
  isPinned?: boolean;
  isActive?: boolean; // Admin toggle to activate/deactivate
  importance?: 'Sangat Penting' | 'Penting' | 'Biasa'; // Admin priority badge
  tags?: string[];
}

export interface SocializationLink {
  id: string;
  judulLink: string;
  url: string;
  deskripsi?: string;
  iconType?: 'drive' | 'pdf' | 'zoom' | 'form' | 'youtube' | 'presence' | 'certificate' | 'whatsapp' | 'website' | 'general';
  badge?: string;
  isHighlight?: boolean;
  isActive?: boolean;
  colorTheme?: 'teal' | 'emerald' | 'sky' | 'indigo' | 'amber' | 'rose' | 'purple' | 'slate';
  customIcon?: string;
  clickCount?: number;
}

export interface KegiatanSosialisasi {
  id: string;
  judulKegiatan: string;
  subJudul?: string;
  tanggal?: string;
  jam?: string;
  lokasi?: string;
  bannerUrl?: string;
  deskripsi?: string;
  isActive: boolean;
  isFeatured?: boolean;
  themeColor?: 'emerald' | 'sky' | 'indigo' | 'purple' | 'amber' | 'rose';
  links: SocializationLink[];
}

export type JenisPelaksanaanPresensi = 'Online' | 'Offline' | 'Hybrid';

export interface PresensiKegiatan {
  id: string;
  judulKegiatan: string;
  subJudul?: string;
  tanggal: string;
  jamMulai?: string;
  jamSelesai?: string;
  jenis: JenisPelaksanaanPresensi;
  lokasi: string;
  deskripsi?: string;
  penyelenggara?: string;
  isActive: boolean;
  isLocked?: boolean;
  createdAt?: string;
}

export interface PesertaPresensi {
  id: string;
  kegiatanId: string;
  namaLengkap: string;
  nip: string;
  jabatan?: string;
  asalInstansi: string;
  kodeSatker?: string;
  noHp?: string;
  email?: string;
  tandaTanganUrl: string; // Base64 data URL
  waktuPresensi: string;
  statusKehadiran?: 'Hadir' | 'Izin' | 'Tugas Luar';
  catatan?: string;
  createdAt?: string;
}

export interface MenuVisibilityConfig {
  'dashboard': boolean;
  'capaian-output': boolean;
  'redflags': boolean;
  'sertifikasi': boolean;
  'per5-analisis': boolean;
  'announcements': boolean;
  'materi-slide'?: boolean;
  'portal-link'?: boolean;
  'presensi'?: boolean;
  'pengetahuan': boolean;
  'aduan'?: boolean;
  'reminder': boolean;
  'guide': boolean;
}

export interface WhatsAppDeviceStatus {
  isConnected: boolean;
  status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'SCANNING_QR';
  phoneNumber?: string;
  deviceName?: string;
  batteryLevel?: number;
  lastSeen?: string;
  pairingCode?: string;
}

export interface BroadcastSettings {
  delaySeconds: number; // Jeda antar pesan (detik)
  useJitter: boolean;   // Acak jeda (+1 sampai +5 detik)
  pauseBatchCount: number; // Pause setelah N pesan
  pauseBatchDurationSeconds: number; // Durasi pause (detik)
  maxDailyLimit: number; // Batas kuota harian aman
}

export interface DashboardCustomTexts {
  dashboardBadge?: string;
  dashboardTitle?: string;
  dashboardSubtitle?: string;

  capaianOutputBadge?: string;
  capaianOutputTitle?: string;
  capaianOutputSubtitle?: string;

  redflagsBadge?: string;
  redflagsTitle?: string;
  redflagsSubtitle?: string;

  per5Badge?: string;
  per5Title?: string;
  per5Subtitle?: string;

  sertifikasiBadge?: string;
  sertifikasiTitle?: string;
  sertifikasiSubtitle?: string;

  pengumumanBadge?: string;
  pengumumanTitle?: string;
  pengumumanSubtitle?: string;

  materiSlideBadge?: string;
  materiSlideTitle?: string;
  materiSlideSubtitle?: string;

  portalLinkBadge?: string;
  portalLinkTitle?: string;
  portalLinkSubtitle?: string;
}

export interface DashboardConfig {
  defaultFilter: 'ALL' | 'BELUM_OUTPUT' | 'SUDAH_OUTPUT' | 'IKPA_KURANG' | 'PENYERAPAN_RENDAH' | 'DEVIASI_TINGGI';
  customAnnouncement: string;
  showKpiCards: boolean;
  showBarChart: boolean;
  announcements: Announcement[];
  presentationMaterials?: PresentationMaterial[];
  kegiatanSosialisasi?: KegiatanSosialisasi[];
  menuVisibility?: MenuVisibilityConfig;
  waDeviceStatus?: WhatsAppDeviceStatus;
  broadcastSettings?: BroadcastSettings;
  helpdeskPhone?: string;
  helpdeskJamLayanan?: string;
  updateDates?: {
    dashboard?: string;
    capaianOutput?: string;
    sertifikasi?: string;
    redflags?: string;
    per5Analisis?: string;
    materiSlide?: string;
    portalLink?: string;
  };
  customTexts?: DashboardCustomTexts;
  historicalUploads?: ExcelUploadHistory[];
  presensiKegiatanList?: PresensiKegiatan[];
  presensiPesertaList?: PesertaPresensi[];
}

export type NavigationTab = 
  | 'dashboard' 
  | 'capaian-output' 
  | 'redflags' 
  | 'sertifikasi'
  | 'per5-analisis'
  | 'announcements' 
  | 'materi-slide'
  | 'portal-link'
  | 'presensi'
  | 'pengetahuan'
  | 'aduan'
  | 'admin' 
  | 'reminder' 
  | 'guide';

export type AppTheme = 'light' | 'dark';


