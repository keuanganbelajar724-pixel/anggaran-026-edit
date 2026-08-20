export interface MasterSatker {
  id: string;
  kodeSatker: string; // Kolom H: Kode Satker (e.g. "651046")
  namaSatker: string; // Kolom I: Nama Satker
  isActive: boolean;  // Kolom J: Status Aktif (true = AKTIF / false = NONAKTIF)
  kementerianLembaga?: string; // Kolom C
  kodeBa?: string;    // Kolom B: 3-digit BA code (e.g. "015", "060")
  unitEselon1?: string; // Kolom E
  kodeKppn?: string;  // Kolom F (e.g. "026")
  namaKppn?: string;  // Kolom G (e.g. "KPPN SEMARANG I")
  passwordSatker?: string;
  namaPic?: string;
  noHpPic?: string;
  emailPic?: string;
  alamatSatker?: string;
  catatan?: string;
  pejabatOperator?: PejabatDanOperator;
  createdAt?: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// MODUL IKPA (Terpisah)
// -------------------------------------------------------------
export interface IKPARecord {
  id: string;
  batchId?: string;
  kodeSatker: string;
  namaSatker: string;
  kementerianLembaga?: string;
  unitEselon1?: string;
  paguAnggaran: number;
  realisasiAnggaran: number;
  persenPenyerapan: number;
  nilaiTotalIKPA: number;
  predikat: IKPAPredikat;
  indikator: IndikatorIKPA;
  periode: string; // misal 'Januari 2026', 'Semester I 2026'
  tahun: number;
  riwayatBulanan?: RiwayatBulananIKPA[];
  issues?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IKPAUploadBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  tahun: number;
  periode: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  invalidSatkers: { kodeSatker: string; namaSatker?: string; reason: string }[];
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  summaryPagu?: number;
  summaryRealisasi?: number;
  avgIKPA?: number;
}

// -------------------------------------------------------------
// MODUL CAPAIAN OUTPUT (Terpisah)
// -------------------------------------------------------------
export interface CapaianOutputRecord {
  id: string;
  batchId?: string;
  kodeSatker: string;
  namaSatker: string;
  kementerianLembaga?: string;
  unitEselon1?: string;
  periode: string; // misal 'Agustus 2026'
  tahun: number;
  targetRO: number;
  terlaporkanRO: number;
  persenCapaianOutput: number;
  statusCapaianOutput: 'Sudah Terlaporkan' | 'Belum Terlaporkan' | 'Terlambat';
  rincianRO?: {
    kodeRO: string;
    namaRO: string;
    target: number;
    realisasi: number;
    persen: number;
    status: string;
  }[];
  kendala?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CapaianOutputUploadBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  tahun: number;
  periode: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  invalidSatkers: { kodeSatker: string; namaSatker?: string; reason: string }[];
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  terlaporkanCount?: number;
  belumTerlaporkanCount?: number;
  terlambatCount?: number;
}

// -------------------------------------------------------------
// MODUL PEJABAT PERBENDAHARAAN (Terpisah)
// -------------------------------------------------------------
export interface PejabatUploadBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  invalidSatkers: { kodeSatker: string; namaPejabat?: string; reason: string }[];
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

// -------------------------------------------------------------
// MODUL PENGELOLAAN UP / TUP (Terpisah)
// -------------------------------------------------------------
export interface PengelolaanUPRecord {
  id: string;
  batchId?: string;
  kodeSatker: string;
  namaSatker: string;
  kementerianLembaga?: string;
  kodeBa?: string;
  paguUP: number;
  nilaiUP: number;
  realisasiGUP: number;
  totalRevolvingGUP?: number; // Alias for realisasiGUP
  persenRevolving?: number; // Alias for persentaseRevolving
  sisaUP: number;
  persentaseRevolving: number;
  frekuensiGUP: number;
  statusRevolving: 'Sangat Baik' | 'Optimal' | 'Lambat / Kritis' | 'Belum Revolving' | 'Lancar / Normal';
  tglTerakhirSP2D?: string;
  nomorSp2dTerakhir?: string;
  nilaiSp2dTerakhir?: number;
  batasRevolving?: string; // Batas Revolving di Kolom N Excel
  batasRevolvingKolomN?: string; // Alias for Kolom N
  batasWaktuTUPKolomH?: string; // Alias for Kolom H
  jenisDana?: 'UP' | 'TUP';
  tanggalTerakhirSP2D?: string;
  sisaHariRevolving?: number;
  sisaHariTUP?: number;
  isJatuhTempoLibur?: boolean;
  sisaHariBatasRevolving?: number; // Hitungan sisa hari menuju jatuh tempo
  isJatuhTempo1Minggu?: boolean; // Jatuh tempo dalam kurun waktu 1 minggu (<= 7 hari)
  isOverdue?: boolean; // Melewati batas revolving
  isHariLibur?: boolean; // Jatuh pada hari Sabtu/Minggu/Libur
  saranTglPengajuan?: string; // Saran diajukan pada HARI KERJA sebelum libur
  hariTanpaRevolving?: number;
  peringatanKritis?: boolean;
  keterangan?: string;
  periode: string;
  tahun: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PengelolaanUPUploadBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  tahun: number;
  periode: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  invalidSatkers: { kodeSatker: string; namaSatker?: string; reason: string }[];
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  totalPaguUP?: number;
  totalRealisasiGUP?: number;
  satkerKritisCount?: number;
  satker1MingguCount?: number;
}

export interface KarwasTUPRecord {
  id: string;
  batchId?: string;
  jenisDana?: 'UP' | 'TUP';
  kodeSatker: string;
  namaSatker: string;
  kementerianLembaga?: string;
  kodeBa?: string;
  nomorSuratPersetujuan?: string;
  tglPersetujuan?: string;
  nomorSp2dTUP?: string;
  tglSp2dTUP?: string;
  nilaiTUP: number;
  realisasiPertanggungjawaban: number; // GTUP / Nihil
  sisaTUP: number;
  persenPertanggungjawaban: number;
  batasWaktuTUP: string; // Batas Waktu TUP di Kolom H Excel
  batasWaktuTUPKolomH?: string; // Batas Waktu TUP di Kolom H Excel (Formatted Day & Date)
  sisaHariBatasWaktuTUP?: number; // Hitungan sisa hari
  isJatuhTempo1Minggu?: boolean; // Dalam kurun waktu 1 minggu (<= 7 hari)
  isOverdue?: boolean; // Melewati batas waktu TUP
  isHariLibur?: boolean; // Jatuh tempo di hari libur
  saranTglPengajuan?: string; // Saran diajukan HARI KERJA sebelum libur
  statusTUP: 'Lunas / Selesai' | 'Dalam Proses' | 'Kritis / Segera Jatuh Tempo' | 'Lewat Batas Waktu';
  keterangan?: string;
  periode: string;
  tahun: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface KarwasTUPUploadBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  tahun: number;
  periode: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  invalidSatkers: { kodeSatker: string; namaSatker?: string; reason: string }[];
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  totalNilaiTUP?: number;
  totalRealisasiTUP?: number;
  tupKritisCount?: number;
  tup1MingguCount?: number;
}

// -------------------------------------------------------------
// MODUL BROADCAST MESSAGE & AUDIT LOG (Terpisah)
// -------------------------------------------------------------
export interface BroadcastMessageRecord {
  id: string;
  judul: string;
  isiPesan: string;
  kategori: 'IKPA' | 'CAPAIAN_OUTPUT' | 'PEJABAT' | 'PENGELOLAAN_UP' | 'UMUM';
  targetTipe: 'SEMUA_SATKER' | 'SATKER_TERTENTU' | 'PER_KL' | 'SATKER_BERMASALAH';
  targetSatkerIds: string[];
  targetRoles: string[];
  pengirim: string;
  statusKirim: 'DRAFT' | 'TERKIRIM' | 'TERJADWAL';
  dikirimPada?: string;
  totalPenerima: number;
  lampiran?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: 'ADMIN' | 'PESERTA' | 'SYSTEM';
  modul: 'MASTER_SATKER' | 'IKPA' | 'CAPAIAN_OUTPUT' | 'PEJABAT' | 'PENGELOLAAN_UP' | 'BROADCAST' | 'CONFIG' | 'AUTH';
  aksi: 'UPLOAD' | 'IMPORT' | 'EDIT' | 'DELETE' | 'RESET' | 'LOGIN' | 'EXPORT' | 'UPDATE_PROFILE';
  detail: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  ipAddress?: string;
  affectedCount?: number;
}

// -------------------------------------------------------------
// PREVIEW VALIDASI EXCEL MODEL (2-Step Import Workflow)
// -------------------------------------------------------------
export interface ExcelValidationPreview<T> {
  file: File;
  fileName: string;
  fileSize: number;
  modul: 'MASTER_SATKER' | 'IKPA' | 'CAPAIAN_OUTPUT' | 'PEJABAT' | 'PENGELOLAAN_UP';
  tahun: number;
  periode: string;
  totalRows: number;
  validData: T[];
  invalidRows: {
    rowNumber: number;
    kodeSatker: string;
    namaSatker?: string;
    reason: string;
    raw?: any;
  }[];
  unregisteredSatkers: {
    kodeSatker: string;
    namaSatker?: string;
    reason: string;
  }[];
  isValidFormat: boolean;
  formatErrors: string[];
}

// -------------------------------------------------------------
// ROLE & PERMISSION SYSTEM
// -------------------------------------------------------------
export type UserRole = 'ADMIN' | 'PESERTA' | 'GUEST';

export interface UserPermissionConfig {
  canViewDashboard: boolean;
  canManageMasterSatker: boolean;
  canManageIKPA: boolean;
  canManageCapaianOutput: boolean;
  canManagePejabat: boolean;
  canManagePengelolaanUP: boolean;
  canBroadcastMessage: boolean;
  canViewAuditLogs: boolean;
  canExportData: boolean;
  canEditOwnProfile: boolean;
}

export type IKPAPredikat = 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang' | 'Sangat Perlu Perhatian';

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

  // Flag indicating if Capaian Output SAKTI Excel data has been uploaded
  hasCapaianOutputData?: boolean;
  
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
  isActive?: boolean; // Status aktif dari Master Satker
  statusAktif?: 'AKTIF' | 'NONAKTIF';

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
  nomor?: number;
  nip: string;
  nama: string;
  kdSatker: string;
  nmSatker: string;
  nmJabatan: string; // e.g. Pejabat Pembuat Komitmen, Pejabat Penanda Tangan Surat Perintah Membayar, Bendahara Penerimaan, Bendahara Pengeluaran
  noSertifikat: string; // e.g. PNT-06134/026/044/2021 or "Tidak Ada"
  tglSertifikat?: string; // e.g. 30/06/2021 or ""
  tglKadaluarsa?: string; // e.g. 30/06/2026 or ""
  status?: 'Aktif' | 'Kadaluarsa' | 'Belum Tersertifikasi';
  keterangan?: string;
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
  accessType?: 'UMUM' | 'INTERNAL'; // Target audiens: UMUM (eksternal) atau INTERNAL (khusus)
  password?: string; // Password akses khusus jika tipe INTERNAL
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
  'pengelolaan-up'?: boolean;
  'kelola-satker'?: boolean;
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

export interface WhatsAppGatewayConfig {
  provider: 'simulasi' | 'fonnte' | 'wablas' | 'whacenter' | 'custom_api' | 'wa_me_link';
  token: string;
  endpoint: string;
  deviceId?: string;
  testPhone?: string;
  savedAt?: string;
  isAutoSave?: boolean;
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
  dashboardAnnouncement?: string;

  capaianOutputBadge?: string;
  capaianOutputTitle?: string;
  capaianOutputSubtitle?: string;
  capaianOutputAnnouncement?: string;

  redflagsBadge?: string;
  redflagsTitle?: string;
  redflagsSubtitle?: string;
  redflagsAnnouncement?: string;

  per5Badge?: string;
  per5Title?: string;
  per5Subtitle?: string;
  per5Announcement?: string;

  sertifikasiBadge?: string;
  sertifikasiTitle?: string;
  sertifikasiSubtitle?: string;
  sertifikasiAnnouncement?: string;

  pengumumanBadge?: string;
  pengumumanTitle?: string;
  pengumumanSubtitle?: string;
  pengumumanAnnouncement?: string;

  materiSlideBadge?: string;
  materiSlideTitle?: string;
  materiSlideSubtitle?: string;
  materiSlideAnnouncement?: string;

  portalLinkBadge?: string;
  portalLinkTitle?: string;
  portalLinkSubtitle?: string;
  portalLinkAnnouncement?: string;

  presensiBadge?: string;
  presensiTitle?: string;
  presensiSubtitle?: string;
  presensiAnnouncement?: string;

  pengetahuanBadge?: string;
  pengetahuanTitle?: string;
  pengetahuanSubtitle?: string;
  pengetahuanAnnouncement?: string;

  aduanBadge?: string;
  aduanTitle?: string;
  aduanSubtitle?: string;
  aduanAnnouncement?: string;

  reminderBadge?: string;
  reminderTitle?: string;
  reminderSubtitle?: string;
  reminderAnnouncement?: string;

  guideBadge?: string;
  guideTitle?: string;
  guideSubtitle?: string;
  guideAnnouncement?: string;

  pengelolaanUpBadge?: string;
  pengelolaanUpTitle?: string;
  pengelolaanUpSubtitle?: string;
  pengelolaanUpAnnouncement?: string;
}

export type AduanStatus = 'MENUNGGU' | 'DIPROSES' | 'SELESAI' | 'DITOLAK';

export type AduanKategori = 
  | 'Pengaduan Gratifikasi / Imbalan'
  | 'Pelanggaran Kode Etik / Sikap Petugas'
  | 'Pengaduan Layanan / Disiplin'
  | 'Kendala Teknis SAKTI & Rekonsiliasi'
  | 'Permintaan Konsultasi / Pendampingan'
  | 'Indikasi Fraud / Penyimpangan'
  | 'Lainnya';

export interface AduanRiwayatTindakLanjut {
  id: string;
  waktu: string;
  petugas: string;
  catatan: string;
  statusSebelumnya: AduanStatus;
  statusBaru: AduanStatus;
}

export interface AduanSatkerRecord {
  id: string;
  tiketNomor: string;
  tanggal: string;
  createdAt: string;
  aliasPelapor: string;
  namaSatker?: string;
  kodeSatker?: string;
  kontakHp?: string;
  emailPelapor?: string;
  kategori: AduanKategori;
  judulAduan: string;
  deskripsi: string;
  lampiranUrl?: string;
  lampiranNama?: string;
  status: AduanStatus;
  urgensi: 'BIASA' | 'PENTING' | 'SANGAT_SEGERA';
  sumber: 'DASHBOARD_FORM' | 'WHATSAPP_MANUAL' | 'TATAP_MUKA' | 'SURAT_RESMI';
  catatanAdmin?: string;
  petugasPenyelesai?: string;
  tanggalSelesai?: string;
  riwayatTindakLanjut?: AduanRiwayatTindakLanjut[];
}

export interface DashboardConfig {
  defaultFilter: 'ALL' | 'BELUM_OUTPUT' | 'SUDAH_OUTPUT' | 'IKPA_KURANG' | 'PENYERAPAN_RENDAH' | 'DEVIASI_TINGGI';
  customAnnouncement: string;
  hideIKPAWhenOnlyCapaianOutput?: boolean;
  showKpiCards: boolean;
  showBarChart: boolean;
  announcements: Announcement[];
  presentationMaterials?: PresentationMaterial[];
  kegiatanSosialisasi?: KegiatanSosialisasi[];
  menuVisibility?: MenuVisibilityConfig;
  waDeviceStatus?: WhatsAppDeviceStatus;
  waGatewayConfig?: WhatsAppGatewayConfig;
  broadcastSettings?: BroadcastSettings;
  helpdeskPhone?: string;
  helpdeskJamLayanan?: string;
  helpdeskPicName?: string;
  helpdeskEmail?: string;
  helpdeskOpeningGreeting?: string;
  allowPublicTickets?: boolean;
  aduanList?: AduanSatkerRecord[];
  updateDates?: {
    dashboard?: string;
    capaianOutput?: string;
    sertifikasi?: string;
    redflags?: string;
    per5Analisis?: string;
    materiSlide?: string;
    portalLink?: string;
    presensi?: string;
    pengelolaanUp?: string;
  };
  customTexts?: DashboardCustomTexts;
  historicalUploads?: ExcelUploadHistory[];
  masterSatkers?: MasterSatker[];
  ikpaRecords?: IKPARecord[];
  ikpaUploads?: IKPAUploadBatch[];
  capaianOutputRecords?: CapaianOutputRecord[];
  capaianOutputUploads?: CapaianOutputUploadBatch[];
  pejabatUploads?: PejabatUploadBatch[];
  pengelolaanUpRecords?: PengelolaanUPRecord[];
  pengelolaanUpUploads?: PengelolaanUPUploadBatch[];
  broadcastMessages?: BroadcastMessageRecord[];
  auditLogs?: AuditLogEntry[];
  presensiKegiatanList?: PresensiKegiatan[];
  presensiPesertaList?: PesertaPresensi[];
}

export type NavigationTab = 
  | 'dashboard' 
  | 'capaian-output' 
  | 'pengelolaan-up'
  | 'kelola-satker'
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


