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
// -------------------------------------------------------------
// MODUL DIAGNOSTIK & KALKULATOR CAPAIAN OUTPUT (SI-CAPUT)
// -------------------------------------------------------------
export interface DiagnostikCaputROItem {
  id: string;
  kodeSatker: string;
  namaSatker: string;
  kodeProgram?: string;
  namaProgram?: string;
  kodeKegiatan?: string;
  namaKegiatan?: string;
  kodeKro?: string;
  namaKro?: string;
  kodeRo: string;
  namaRo: string;
  volumeTarget: number;       // TVRO (Target Volume RO)
  volumeRealisasi: number;    // RVRO (Realisasi Volume RO)
  targetProgres: number;      // TPCRO (%)
  realisasiProgres: number;   // PCRO (%)
  paguAnggaran?: number;      // Pagu DIPA RO
  realisasiAnggaran?: number; // Realisasi Belanja RO
  persenPenyerapan?: number;  // % Penyerapan Anggaran
  polarisasi?: 'MAXIMIZE' | 'MINIMIZE' | 'RANGE';
  keteranganSakti?: string;
  diagnosaSeverity: 'KRITIS' | 'PERINGATAN' | 'OPTIMAL' | 'INFO';
  diagnosaCode: 'TPCRO_PCRO_ZERO' | 'PCRO_BELOW_TPCRO' | 'PCRO_100_RVRO_BELOW_TVRO' | 'TPCRO_GT0_PCRO_ZERO' | 'LAGGING_CAPUT' | 'RVRO_ANOMALY' | 'DEVIATION_HIGH' | 'MISSING_EXPLANATION' | 'UNMATCHED_TARGET' | 'OPTIMAL';
  diagnosaTitle: string;
  diagnosaDescription: string;
  rekomendasiTindakan: string[];
  templateKeteranganSakti: string;
  gapKinerja: number; // TPCRO - PCRO
  nilaiKomponenRo: number; // 0 - 100
  potensiKenaikanSkor: number;
}

export interface DiagnostikCaputSatkerSummary {
  kodeSatker: string;
  namaSatker: string;
  totalRo: number;
  roKritisCount: number;
  roPeringatanCount: number;
  roOptimalCount: number;
  currentScoreCaput: number;
  projectedScoreCaput: number;
  avgPCRO: number;
  avgTPCRO: number;
  totalPagu: number;
  totalRealisasi: number;
  persenPenyerapan: number;
}

export interface DiagnostikCaputResult {
  summary: {
    totalRo: number;
    roKritisCount: number;
    roPeringatanCount: number;
    roOptimalCount: number;
    currentScoreCaput: number;
    projectedScoreCaput: number;
    persenKetercapaianTarget: number;
    avgPCRO: number;
    avgTPCRO: number;
    totalPagu: number;
    totalRealisasi: number;
    persenPenyerapanTotal: number;
    kodeSatker: string;
    namaSatker: string;
    periode: string;
  };
  satkerBreakdown?: DiagnostikCaputSatkerSummary[];
  items: DiagnostikCaputROItem[];
  uploadedFileName?: string;
  analyzedAt: string;
}

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
  keteranganExcel?: string;
  totalGUNihil?: number;
  setoranUP?: number;
  totalGUP?: number;
  presentaseDariUP?: number;
  batasTeguran?: string;
  isNihil?: boolean;
  isHariIni?: boolean;
  isTelat?: boolean;
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
  file?: File;
  fileName: string;
  fileSize?: number;
  modul?: 'MASTER_SATKER' | 'IKPA' | 'CAPAIAN_OUTPUT' | 'PEJABAT' | 'PENGELOLAAN_UP' | 'KARWAS_TUP' | 'TRANSAKSI_KKP' | string;
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
  unregisteredSatkers?: {
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
  jenis: 'Capaian Output' | 'IKPA Rendah' | 'Penyerapan Rendah' | 'Deviasi Hal III DIPA' | 'General' | 'Pengelolaan UP/TUP' | 'Sertifikasi Pejabat' | 'Transaksi KKP & Digipay' | 'Portal Mandiri Satker' | string;
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
  nmJabatan: string; // e.g. Pejabat Pembuat Komitmen, Pejabat Penanda Tangan Surat Perintah Membayar, Bendahara Penerimaan, Bendahara Pengeluaran, Calon PPK/PPSPM/Bendahara
  noSertifikat: string; // e.g. PNT-08581/026/912/2021, BNT-03762/185/518/2021 or "Belum Ada" / "Tidak Ada"
  tglSertifikat?: string; // e.g. 17-09-2021
  tglKadaluarsa?: string; // e.g. 17-09-2026
  statusJabatan?: 'Aktif' | 'Non Aktif' | string; // Status jabatan: Aktif vs Non Aktif
  statusUsulan?: string; // e.g. 'Belum rekam usulan', 'Antrean Diklat', 'Proses Verifikasi', 'Dijadwalkan Uji Kompetensi', 'Belum Diusulkan', 'Di Kirim Ke Admin DSP', 'Sertifikat Kadaluarsa', 'Tidak Memenuhi Syarat', 'Tidak Lulus Ujian Komprehensif'
  status?: 'Aktif' | 'Kadaluarsa' | 'Belum Tersertifikasi' | 'Belum Perpanjangan' | 'Mendekati Kadaluarsa';
  statusSertifikasi?: 'Tersertifikasi' | 'Belum Tersertifikasi' | 'Belum Perpanjangan' | 'Kadaluarsa';
  kategoriData?: 'BELUM_SERTIFIKAT' | 'BELUM_PERPANJANGAN' | 'TERSERTIFIKASI_AKTIF' | 'SEMUA';
  kppn?: string; // e.g. 'SEMARANG I'
  tglDownload?: string;
  sisaHariMasaBerlaku?: number;
  isKadaluarsa?: boolean;
  isMendekatiKadaluarsa?: boolean;
  keterangan?: string;
  catatanRekomendasi?: string;
  noHp?: string;
  email?: string;
  kementerianLembaga?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type KnowledgeCategory = 
  | 'JUKNIS_SAKTI' 
  | 'LAYANAN_PD_KONTRAK' 
  | 'PELAPORAN_SAKTI' 
  | 'ADMINISTRATOR_SAKTI' 
  | 'VIDEO_TUTORIAL' 
  | 'TOOLS_CSV' 
  | 'PANDUAN_CUSTOM';

export interface JuknisBlangkoItem {
  id: string;
  namaBlangko: string;
  kategoriAplikasi: string; // Header grup aplikasi (e.g. APLIKASI DIGIT, APLIKASI GAJI WEB, etc.)
  tahunRilis: string; // e.g. "2024", "2023", "-"
  linkDownload: string; // URL file / Drive / PDF
  fileFormat?: 'PDF' | 'DOCX' | 'XLSX' | 'ZIP' | 'LINK' | 'CSV';
  keterangan?: string;
  isPinned?: boolean;
  isActive?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

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

export interface PresensiPrintConfig {
  kopBaris1: string;
  kopBaris2: string;
  kopBaris3: string;
  kopBaris4: string;
  kopAlamatKontak: string;
  kotaTandaTangan: string;
  jabatanPenandatangan: string;
  namaPenandatangan: string;
  nipPenandatangan: string;
  customTitle?: string;
}

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
  printConfig?: Partial<PresensiPrintConfig>;
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

export interface TransaksiKKPRecord {
  id: string;
  batchId?: string;
  kodeSatker: string;
  namaSatker: string;
  kementerianLembaga?: string;
  unitEselon1?: string;
  jumlahTransaksi: number; // Frekuensi transaksi / SP2D GUP KKP
  totalNominal: number; // Total nominal rupiah transaksi KKP
  bankPenerbit?: string; // BRI, Bank Mandiri, BNI, BSI, dll.
  noSp2dTerakhir?: string;
  tglSp2dTerakhir?: string;
  tglTransaksiTerakhir?: string;
  statusKeaktifan?: 'Sangat Aktif' | 'Aktif' | 'Perlu Akselerasi';
  periode?: string;
  tahun?: number;
  catatan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KKPUploadBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  totalNominal?: number;
  totalTransaksi?: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

export interface DigipayRecord {
  id: string;
  kodeSatker: string;
  namaSatker: string;
  kementerianLembaga?: string;
  tipePembayaran: 'VA' | 'KKP'; // VA (Virtual Account CMS) atau KKP (Kartu Kredit Pemerintah)
  noTransaksi?: string; // Nomor Pesanan / Order ID / Invoice
  tglTransaksi?: string; // Tanggal Transaksi / Pembayaran
  namaVendor?: string; // Nama Rekanan UMKM / Merchant Penyedia
  namaBank?: string; // Bank Pembayar (BRI, Mandiri, BNI, BTN, BSI)
  nominalTransaksi: number; // Nilai Transaksi (Rp)
  statusTransaksi?: string; // Selesai / Paid / Success / Proses
  uraianBarang?: string; // Rincian Barang / Belanja Operasional
  noSp2d?: string;
  periode?: string;
  tahun?: number;
  catatan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DigipaySatkerSummary {
  kodeSatker: string;
  namaSatker: string;
  kementerianLembaga?: string;
  totalTransaksiVA: number;
  totalNominalVA: number;
  totalTransaksiKKP: number;
  totalNominalKKP: number;
  totalSemuaTransaksi: number; // Total Transaksi VA + KKP
  totalSemuaNominal: number; // Total Nominal VA + KKP
  bankTerbanyak?: string;
  vendorTerbanyak?: string;
  tglTransaksiTerakhir?: string;
  statusKeaktifan: 'Sangat Aktif' | 'Aktif' | 'Perlu Akselerasi' | 'Belum Ada Transaksi';
  rankByCount?: number;
  rankByNominal?: number;
}

// -------------------------------------------------------------
// MODUL MONITORING DEVIASI HALAMAN III DIPA (Baru)
// -------------------------------------------------------------
export type JenisBelanjaDIPA = '51' | '52' | '53' | '57' | 'TOTAL';

export interface DeviasiJenisBelanjaDetail {
  jenisBelanja?: '51' | '52' | '53' | '57' | string;
  akun?: string;
  namaJenisBelanja?: string; // Belanja Pegawai, Belanja Barang, Belanja Modal, Belanja Bansos
  paguDipa?: number;
  rpd: number; // Rencana Penarikan Dana (Rp)
  realisasi: number; // Realisasi SP2D (Rp)
  deviasiNominal: number; // Selisih |Realisasi - RPD| (Rp)
  persenDeviasi: number; // % Deviasi terhadap RPD
  status?: 'Aman' | 'Waspada' | 'Tinggi' | 'Kritis' | string;
}

export interface DeviasiHal3Record {
  id: string;
  batchId?: string;
  kodeSatker: string;
  namaSatker: string;
  kementerianLembaga?: string;
  kodeKppn?: string;
  kodeEselon1?: string;
  unitEselon1?: string;
  periodeAngka?: number; // 1, 2, 3, ... 12
  periodeBulan: string; // 'Januari', 'Februari', 'Maret', 'Agustus', dst.
  periodeFormatted?: string; // '01 (Januari)', '02 (Februari)', dst.
  triwulan?: 'TW I' | 'TW II' | 'TW III' | 'TW IV';
  tahun: number;
  tanggalPosting?: string;
  noRevisiTerakhir?: string | number;
  klasifikasiSatker?: string;
  paguTotal?: number;
  rpdTotal: number; // Total RPD Halaman III DIPA (Rp)
  realisasiTotal: number; // Total Realisasi Anggaran / SP2D (Rp)
  deviasiNominalTotal: number; // |Realisasi - RPD| (Rp)
  persenDeviasiTotal: number; // Rata-rata / Total Deviasi (%)
  skorIKPADeviasi?: number; // Optional
  statusDeviasi?: 'Aman (≤ 5%)' | 'Waspada (5% - 10%)' | 'Tinggi (10% - 20%)' | 'Kritis (> 20%)';
  rincianJenisBelanja?: {
    belanjaPegawai?: DeviasiJenisBelanjaDetail; // 51
    belanjaBarang?: DeviasiJenisBelanjaDetail; // 52
    belanjaModal?: DeviasiJenisBelanjaDetail; // 53
    belanjaBansos?: DeviasiJenisBelanjaDetail; // 57
    belanja51?: DeviasiJenisBelanjaDetail;
    belanja52?: DeviasiJenisBelanjaDetail;
    belanja53?: DeviasiJenisBelanjaDetail;
    belanja57?: DeviasiJenisBelanjaDetail;
  };
  earlyWarningAlert?: boolean;
  rekomendasiAksi?: string;
  sisaTargetSPM?: number;
  noHpPic?: string;
  namaPic?: string;
  catatan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviasiHal3UploadBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  summaryRpd?: number;
  summaryRealisasi?: number;
  avgDeviasi?: number;
  avgSkorIKPA?: number;
}

export interface DigipayUploadBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  totalNominal?: number;
  totalTransaksi?: number;
  totalVA?: number;
  totalKKP?: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

// -------------------------------------------------------------
// MODUL SPM PPP (Perhitungan Pihak Ketiga - PLN / TELKOM)
// -------------------------------------------------------------
export interface SPMPPPRecord {
  id: string;
  kodeSatker: string; // Kolom KD_SATKER (misal: "119436")
  namaSatker: string; // Kolom NAMA_SATKER
  periodeTagihan: string; // Kolom PERIODE_TAGIHAN (misal: "202608")
  jenisLayanan: 'PLN' | 'TELKOM' | string; // Kolom JNS_LAYANAN
  noPelanggan: string; // Kolom NO_PELANGGAN
  bulan: number; // Kolom BULAN (1-12)
  tahun: number; // Kolom TAHUN
  nilaiTagihan: number; // Kolom Sum of NILAI_TAGIHAN / NILAI_TAGIHAN
  noSpp?: string; // Kolom NO_SPP
  noSpm?: string; // Kolom NO_SPM
  noSp2d?: string; // Kolom NO_SP2D
  statusSpm: 'Belum membuat SPP' | 'Upload NTT' | 'Cetak SPP' | 'Setuju SPP' | 'Cetak SPM' | 'Terbit SP2D' | string; // Kolom STATUS_SPM (Kolom L)
  catatan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SPMPPPUploadBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  totalNominal?: number;
  totalPln?: number;
  totalTelkom?: number;
  belumMengajukanCount?: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

export interface MenuVisibilityConfig {
  'dashboard': boolean;
  'capaian-output': boolean;
  'diagnostik-caput'?: boolean;
  'deviasi-hal3'?: boolean;
  'spm-ppp'?: boolean;
  'pengelolaan-up'?: boolean;
  'transaksi-kkp'?: boolean;
  'transaksi-digipay'?: boolean;
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
  statusConnection?: 'CONNECTED' | 'DISCONNECTED' | 'CHECKING';
  lastPingTime?: string;
  deviceName?: string;
  quotaRemaining?: number;
  antiBlockHeaderEnabled?: boolean;
  antiBlockFooterEnabled?: boolean;
  antiBlockCustomText?: string;
}

export interface BroadcastSettings {
  delaySeconds: number; // Jeda antar pesan (detik)
  useJitter: boolean;   // Acak jeda (+1 sampai +5 detik)
  pauseBatchCount: number; // Pause setelah N pesan
  pauseBatchDurationSeconds: number; // Durasi pause (detik)
  maxDailyLimit: number; // Batas kuota harian aman
  antiBlockDisclaimerHeader?: boolean;
  antiBlockDisclaimerFooter?: boolean;
  humanTypingSimulation?: boolean;
  safetyCooldownActive?: boolean;
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

export interface SlideShowBannerItem {
  id: string;
  title?: string; // Judul Event / Informasi / Pengumuman (Opsional)
  subtitle?: string; // Sub judul / Tema
  imageUrl: string; // URL Gambar Banner / Base64 / GIF Animasi
  imageFit?: 'contain' | 'cover' | 'auto'; // Mode penyesuaian: contain (utuh/pas/tidak terpotong) atau cover (isi penuh)
  backgroundColor?: string; // Warna latar belakang jika rasio banner berbeda
  badge?: string; // e.g. "EVENT", "INFO RESMI", "SOSIALISASI", "KAJIAN", "BIMTEK"
  eventDate?: string; // e.g. "Jumat, 21 Februari 2025"
  eventTime?: string; // e.g. "09.30 s.d 12.15 WIB"
  eventLocation?: string; // e.g. "Zoom ID: 432 277 387 738 (Pass: iu63Po97) • Aula KPPN"
  linkUrl?: string; // Link Zoom / Form / Unduhan
  linkLabel?: string; // Label Tombol (e.g. "Buka Tautan / Gabung", "Lihat Detail")
  targetTabs?: string[]; // Tab mana saja yang menampilkan banner ini (default: ['ALL'])
  isActive: boolean;
  order?: number;
  createdAt?: string;
}

export interface SlideShowConfig {
  isEnabled: boolean; // Saklar Global Slide Show (ON / OFF)
  autoPlay: boolean; // Auto play pergantian slide
  intervalSeconds: number; // Durasi per slide (e.g. 5 detik)
  aspectRatioMode?: 'responsive' | 'landscape' | 'wide' | 'custom';
  slides: SlideShowBannerItem[];
  showOnTabs?: string[]; // Tab mana saja yang menampilkan slide show (default: ['ALL'])
  pauseOnHover?: boolean;
  updatedAt?: string;
}

export type ThemePresetId = 
  | 'default_kppn' 
  | 'midnight_indigo' 
  | 'emerald_cyber' 
  | 'golden_amber' 
  | 'crimson_prestige' 
  | 'oceanic_cyan' 
  | 'royal_purple'
  | 'custom';

export interface DashboardThemeSettings {
  preset: ThemePresetId;
  primaryColor?: string; // e.g. #059669 or Tailwind color class
  accentColor?: string; // e.g. #0284c7
  bannerStartColor?: string; // e.g. #0f172a
  bannerEndColor?: string; // e.g. #1e1b4b
  bannerTextColor?: string;
  tabLayoutMode?: 'auto_fill' | 'compact'; // 'auto_fill' = Rata penuh dari kiri ke kanan (tanpa ruang kosong di kanan), 'compact' = Ukuran konten
  activeTabGlow?: boolean;
  customBannerGradient?: string;
}

export interface PopUpAnnouncementConfig {
  isEnabled: boolean; // Aktif / Nonaktifkan Pop-up Awal
  id?: string; // ID unik pengumuman (jika diubah, popup akan muncul lagi)
  title: string; // Judul Popup
  subtitle?: string; // Sub judul
  badge?: string; // e.g. "PENGUMUMAN PENTING KPPN"
  content: string; // Teks isi pengumuman
  category?: 'Penting' | 'Batas Waktu' | 'Surat Edaran' | 'Jadwal' | 'Sistem' | 'Info Khusus';
  bannerImageUrl?: string; // Optional gambar banner
  linkUrl?: string; // Link tindakan
  linkLabel?: string; // Label tombol link
  secondaryLinkUrl?: string;
  secondaryLinkLabel?: string;
  showDontShowAgainOption?: boolean; // Izinkan user menutup "Jangan tampilkan lagi hari ini"
  autoCloseSeconds?: number; // Tutup otomatis jika diisi (opsional)
  updatedAt?: string;
}

export interface DashboardConfig {
  defaultFilter: 'ALL' | 'BELUM_OUTPUT' | 'SUDAH_OUTPUT' | 'IKPA_KURANG' | 'PENYERAPAN_RENDAH' | 'DEVIASI_TINGGI';
  customAnnouncement: string;
  popUpAnnouncement?: PopUpAnnouncementConfig;
  slideShowConfig?: SlideShowConfig;
  themeSettings?: DashboardThemeSettings;
  hideIKPAWhenOnlyCapaianOutput?: boolean;
  showKpiCards: boolean;
  showBarChart: boolean;
  showDeviasiHal3Widget?: boolean;
  announcements: Announcement[];
  presentationMaterials?: PresentationMaterial[];
  kegiatanSosialisasi?: KegiatanSosialisasi[];
  menuVisibility?: MenuVisibilityConfig;
  tabOrder?: NavigationTab[];
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
    transaksiKkp?: string;
    transaksiDigipay?: string;
    spmPpp?: string;
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
  transaksiKkpRecords?: TransaksiKKPRecord[];
  transaksiKkpUploads?: KKPUploadBatch[];
  transaksiDigipayRecords?: DigipayRecord[];
  transaksiDigipayUploads?: DigipayUploadBatch[];
  deviasiHal3Records?: DeviasiHal3Record[];
  deviasiHal3Uploads?: DeviasiHal3UploadBatch[];
  spmPppRecords?: SPMPPPRecord[];
  spmPppUploads?: SPMPPPUploadBatch[];
  broadcastMessages?: BroadcastMessageRecord[];
  auditLogs?: AuditLogEntry[];
  presensiKegiatanList?: PresensiKegiatan[];
  presensiPesertaList?: PesertaPresensi[];
  presensiPrintConfig?: PresensiPrintConfig;
  juknisBlangkoList?: JuknisBlangkoItem[];
  knowledgeItems?: KnowledgeItem[];
}

export type NavigationTab = 
  | 'dashboard' 
  | 'capaian-output' 
  | 'diagnostik-caput'
  | 'deviasi-hal3'
  | 'spm-ppp'
  | 'pengelolaan-up'
  | 'transaksi-kkp'
  | 'transaksi-digipay'
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

// -------------------------------------------------------------
// MODUL ANALITIK TRAFIK & PENGUNJUNG HARIAN (Admin Only)
// -------------------------------------------------------------
export interface VisitorTrafficSummary {
  pengunjungHariIni: number;
  viewsHariIni: number;
  pengunjung7Hari: number;
  totalPengunjung: number;
  totalViews: number;
  lastUpdated: string;
}

export interface DailyTrafficRecord {
  date: string; // Format YYYY-MM-DD
  displayDate: string; // e.g. "23 Agu", "Senin, 23 Agu"
  uniqueVisitors: number;
  pageviews: number;
  desktopCount: number;
  mobileCount: number;
  tabletCount: number;
  hourlyViews: { [hour: string]: number }; // "00" .. "23"
}

export interface VisitorLogEntry {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  deviceId: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  os: string;
  browser: string;
  screenResolution: string;
  page: string;
  tabId: string;
  isNewVisitor: boolean;
  isTester: boolean;
  satkerKode?: string;
  satkerNama?: string;
}

export interface DeviceAnalytics {
  desktop: number;
  mobile: number;
  tablet: number;
  osList: { name: string; count: number; percentage: number }[];
  browserList: { name: string; count: number; percentage: number }[];
}

export interface PageVisitStat {
  tabId: string;
  title: string;
  count: number;
  percentage: number;
}

export interface TrafficAnalyticsData {
  summary: VisitorTrafficSummary;
  dailyHistory: DailyTrafficRecord[];
  hourlyToday: { hour: string; label: string; views: number; visitors: number }[];
  deviceStats: DeviceAnalytics;
  topPages: PageVisitStat[];
  recentLogs: VisitorLogEntry[];
  totalLogCount: number;
}

export type AppTheme = 'light' | 'dark';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini' | 'system';
  text: string;
  timestamp: string;
  targetSatkerKode?: string;
  rolePersona?: string;
}

export interface ArchivedChatSession {
  id: string;
  title: string;
  archivedAt: string;
  targetSatkerKode?: string;
  messageCount: number;
  persona: string;
  messages: ChatMessage[];
}

export type AnalystRolePersona = 
  | 'mski_analyst' 
  | 'pakar_keuangan_negara' 
  | 'kepala_kppn' 
  | 'auditor_ppk' 
  | 'it_sakti_expert' 
  | 'forecaster_likuiditas';

// -------------------------------------------------------------
// MODUL REALISASI BELANJA (OM-SPAN / SAKTI INQUIRY) & BULETIN
// -------------------------------------------------------------
export interface RealisasiBelanjaRecord {
  id: string;
  kementerianKode: string;
  kementerianUraian: string;
  eselonIKode?: string;
  eselonIUraian?: string;
  kewenanganKode?: string;
  kewenanganUraian?: string;
  provinsiKode?: string;
  provinsiUraian?: string;
  kabkotaKode?: string;
  kabkotaUraian?: string;
  kanwilKode?: string;
  kanwilUraian?: string;
  kppnKode?: string;
  kppnUraian?: string;
  satkerKode: string;
  satkerUraian: string;
  fungsiKode?: string;
  fungsiUraian?: string;
  subfungsiKode?: string;
  subfungsiUraian?: string;
  programKode?: string;
  programUraian?: string;
  kegiatanKode?: string;
  kegiatanUraian?: string;
  outputKroKode?: string;
  outputKroUraian?: string;
  akunKode: string;
  akunUraian: string;
  jenisBelanjaKode: '51' | '52' | '53' | '57' | string; // 51=Pegawai, 52=Barang, 53=Modal, 57=Bansos
  jenisBelanjaUraian: string;
  sumberdanaKode?: string;
  sumberdanaUraian?: string;
  paguDipa: number;
  realisasi: number;
  blokir: number;
  sisaPagu: number;
  persenRealisasi: number;
}

export interface RealisasiBelanjaSummary {
  totalPagu: number;
  totalRealisasi: number;
  totalSisa: number;
  totalBlokir: number;
  persenRealisasiTotal: number;
  totalSatkerCount: number;
  totalRows: number;
  breakdownJenisBelanja: {
    kode: string;
    nama: string;
    pagu: number;
    realisasi: number;
    persen: number;
    color: string;
  }[];
  topSatkers: {
    kodeSatker: string;
    namaSatker: string;
    pagu: number;
    realisasi: number;
    persen: number;
  }[];
  bottomSatkers: {
    kodeSatker: string;
    namaSatker: string;
    pagu: number;
    realisasi: number;
    persen: number;
  }[];
  breakdownKementerian: {
    kode: string;
    nama: string;
    pagu: number;
    realisasi: number;
    persen: number;
  }[];
}

export interface MyIntressRecord {
  id: string;
  no: number;
  kodeSatker: string;
  namaSatker: string;
  paguPegawai: number;
  paguBarang: number;
  paguModal: number;
  paguBebanBunga?: number;
  paguSubsidi?: number;
  paguHibah?: number;
  paguBansos: number;
  paguLain?: number;
  paguTransfer: number;
  paguTotal: number;
  realPegawai: number;
  realBarang: number;
  realModal: number;
  realBebanBunga?: number;
  realSubsidi?: number;
  realHibah?: number;
  realBansos: number;
  realLain?: number;
  realTransfer: number;
  realTotal: number;
  persenPegawai: number;
  persenBarang: number;
  persenModal: number;
  persenBansos: number;
  persenTransfer: number;
  persenTotal: number;
  sisaPegawai: number;
  sisaBarang: number;
  sisaModal: number;
  sisaBansos: number;
  sisaTransfer: number;
  sisaTotal: number;
  waktuUnduh?: string;
}

export interface MyIntressSummary {
  totalPagu: number;
  totalRealisasi: number;
  totalSisa: number;
  persenRealisasiTotal: number;
  totalSatkerCount: number;
  breakdownJenisBelanja: {
    kode: string;
    nama: string;
    pagu: number;
    realisasi: number;
    persen: number;
    sisa: number;
    color: string;
  }[];
  topSatkers: MyIntressRecord[];
  bottomSatkers: MyIntressRecord[];
}

export interface SatkerReconciliationDiff {
  kodeSatker: string;
  namaSatker: string;
  
  // SINTESA Summary
  sintesaPaguTotal: number;
  sintesaRealTotal: number;
  sintesaPersenTotal: number;
  
  // MY INTRESS Summary
  intressPaguTotal: number;
  intressRealTotal: number;
  intressPersenTotal: number;
  
  // Overall Differences (SINTESA - InTress)
  diffPaguTotal: number;
  diffRealTotal: number;
  statusDiff: 'MATCH' | 'DIFF_REALISASI' | 'DIFF_PAGU' | 'DIFF_BOTH' | 'ONLY_SINTESA' | 'ONLY_INTRESS';
  
  // Details per Jenis Belanja (51, 52, 53, 57, 61)
  breakdown: {
    jenisKode: '51' | '52' | '53' | '57' | '61' | 'LAIN' | string;
    jenisNama: string;
    sintesaPagu: number;
    intressPagu: number;
    diffPagu: number;
    sintesaReal: number;
    intressReal: number;
    diffReal: number;
    status: 'MATCH' | 'DIFF_PAGU' | 'DIFF_REAL' | 'DIFF_BOTH';
  }[];
  
  // AI/Rule Analysis Note
  catatanAnalisis: string;
  saranTindakan: string;
  templateKonfirmasiWa: string;
}

export interface CustomBuletinPage {
  id: string;
  title: string;
  section: string; // e.g. "Sorotan Khusus", "Artikel Tambahan", "Infografis Tematik", "Inovasi Satker"
  template: 'split_article' | 'infographic_cards' | 'interview_spotlight' | 'photo_story' | 'data_table';
  subtitle?: string;
  contentParagraph1?: string;
  contentParagraph2?: string;
  contentParagraph3?: string;
  quote?: string;
  quoteAuthor?: string;
  stats?: { label: string; value: string; desc?: string }[];
  photoUrl?: string;
  photoCaption?: string;
  tableData?: { col1: string; col2: string; col3: string; col4: string }[];
  tableHeaders?: [string, string, string, string];
  tags?: string[];
  createdAt: string;
}

export interface BuletinConfig {
  id: string;
  edisi: string; // e.g. "EDISI 2 | TW.II/2026"
  bulanTahun: string; // e.g. "Triwulan II 2026"
  namaBuletin?: string; // e.g. "WARTA SEMARANG SATU" / "BULETIN TUGU MUDA"
  taglineBuletin?: string; // e.g. "Kiprah Perbendaharaan & Kinerja APBN Wilayah KPPN Semarang I"
  judulUtama: string; // e.g. "OPTIMALISASI PENYERAPAN BELANJA APBN & PENGUATAN TATA KELOLA KEUANGAN"
  subJudul: string; // e.g. "Kinerja Fiskal Berkualitas, Akselerasi Digitalisasi SAKTI, & Transformasi Layanan"
  
  // Format / Layout Template Multi-Style
  layoutFormat?: 'executive_magazine' | 'canva_vibrant' | 'clean_treasury' | 'royal_indigo' | 'classic_newsletter';
  highlightMissingData?: boolean; // Highlight incomplete / empty data in red

  // Hal 1: Cover Images & Highlights
  fotoCoverUrl?: string;
  coverHighlight1?: string;
  coverHighlight2?: string;

  // Hal 2: Kepala Kantor & Editorial
  namaKepalaKantor: string; // e.g. "Drs. H. Ahmad Fauzi, M.Si."
  jabatanKepala?: string; // e.g. "KEPALA KPPN SEMARANG I"
  fotoKepalaUrl?: string;
  sambutanKepala: string; // Editorial greeting text

  // Hal 3: Sekilas Tentang Buletin & Tim Redaksi
  sekilasBuletin?: string; // Sekilas tentang Buletin KPPN
  tajukRencana: string; // Editorial highlight
  redaksiTim?: {
    pelindung?: string;
    penanggungJawab?: string;
    pemimpinRedaksi?: string;
    redakturPelaksana?: string;
    timLiputan?: string;
    desainTataLetak?: string;
    sekretariat?: string;
  };
  temaWarna: 'navy' | 'emerald' | 'indigo' | 'burgundy' | 'gold';
  showRealisasiBelanja: boolean;
  showIKPASection: boolean;
  showPojokSakti: boolean;
  showSambutan: boolean;
  showAgendaKegiatan: boolean;
  
  // Hal 8: Transfer Ke Daerah (TKD) Data Customization
  tkdData?: {
    dbh: number;
    dau: number;
    dakFisik: number;
    dakNonFisik: number;
    insentifFiskal: number;
    danaKelurahan: number;
    catatanTkd?: string;
  };

  // Hal 9 & 10: Guyub Rukun (Wawancara Satker)
  wawancaraSatker?: {
    judul: string;
    narasumber: string;
    jabatan: string;
    satker: string;
    fotoNarasumberUrl?: string;
    fotoKegiatanSatkerUrl?: string;
    isiWawancara: string;
    isiWawancara2?: string;
    kutipanPenting: string;
    prestasiSatker?: string;
  };

  // Hal 11 - 14: Sarwa Sarwi KPPN (Internal Capacity Building & Outbound)
  sarwaSarwi?: {
    judul: string;
    temaKegiatan: string;
    tanggal: string;
    lokasi: string;
    ceritaBagian1: string;
    ceritaBagian2: string;
    ceritaBagian3Purnabakti: string;
    ceritaBagian4RiverTubing: string;
    pesanKepala: string;
    fotoCapacityBuilding1Url?: string;
    fotoCapacityBuilding2Url?: string;
    fotoPurnabaktiUrl?: string;
    fotoRiverTubingUrl?: string;
  };

  // Hal 15 & 16: Pagelaran Semarang (Event Budaya & UMKM Binaan)
  pagelaranSemarang?: {
    judulEvent: string;
    tanggalEvent: string;
    lokasiEvent: string;
    deskripsiEvent: string;
    judulUmkm: string;
    deskripsiUmkm: string;
    fotoEvent1Url?: string;
    fotoEvent2Url?: string;
    fotoUmkmUrl?: string;
  };

  // Hal 17 & 18: Teropong Semarang (Kearifan Lokal & Wisata Sejarah)
  teropongSemarang?: {
    lokasi1Nama: string;
    lokasi1Deskripsi: string;
    fotoTeropong1Url?: string;
    fotoTeropong1Sub1Url?: string;
    fotoTeropong1Sub2Url?: string;
    lokasi2Nama: string;
    lokasi2Deskripsi: string;
    fotoTeropong2Url?: string;
    fotoTeropong2Sub1Url?: string;
    fotoTeropong2Sub2Url?: string;
  };

  // Hal 19: Zona Integritas & Pantun
  pantunAntiKorupsi?: {
    bait1: string;
    bait2: string;
    bait3: string;
    bait4: string;
    pesanIntegritas?: string;
  };

  // Rubrik Tambahan Eksekutif (Keren & Interaktif)
  opiniPranata?: {
    judul: string;
    penulis: string;
    jabatanPenulis: string;
    fotoPenulisUrl?: string;
    isiOpini: string;
    kutipanOpini?: string;
  };
  kamusSakti?: {
    istilah: string;
    kepanjangan: string;
    definisi: string;
  }[];
  ttsPerbendaharaan?: {
    judul?: string;
    petunjuk?: string;
    pertanyaanMendatar: { no: number; tanya: string; jawaban: string; length: number }[];
    pertanyaanMenurun: { no: number; tanya: string; jawaban: string; length: number }[];
  };
  wallOfFameSatker?: {
    kode: string;
    nama: string;
    predikat: string;
    nilai: number;
    kategori: string;
    highlight: string;
  }[];
  statistikDigital?: {
    volumeDigipay: number;
    nominalDigipay: number;
    volumeKkp: number;
    nominalKkp: number;
    zeroReturPersen: number;
  };

  // Expanded Deep Treasury Data Sections (Halaman Khusus KPPN Semarang I)
  evaluasiDelapanIkpa?: {
    revisiDipa: { nilai: number; analisis: string };
    deviasiHal3: { nilai: number; analisis: string };
    penyerapanAnggaran: { nilai: number; analisis: string };
    belanjaKontraktual: { nilai: number; analisis: string };
    penyelesaianTagihan: { nilai: number; analisis: string };
    pengelolaanUpTup: { nilai: number; analisis: string };
    dispensasiSpm: { nilai: number; analisis: string };
    capaianOutput: { nilai: number; analisis: string };
    rataRataKppn: number;
    kesimpulan: string;
  };
  satkerPaguBesarTable?: {
    kode: string;
    nama: string;
    pagu: number;
    realisasi: number;
    persen: number;
    ikpa: number;
    status: string;
  }[];
  belanjaModalProyek?: {
    judul: string;
    totalPaguModal: number;
    realisasiModal: number;
    persenModal: number;
    daftarProyek: { namaPaket: string; satker: string; pagu: number; progres: string; status: string }[];
    rekomendasi: string;
  };
  monitoringReturSp2d?: {
    totalSpmDiterbitkan: number;
    totalSp2dTerbit: number;
    totalRetur: number;
    rasioZeroRetur: number;
    nominalRetur: number;
    penyebabRetur: { penyebab: string; persen: number; solusi: string }[];
    sopPenanganan: string;
  };
  leaderboardDigipayKkp?: {
    topDigipaySatker: { nama: string; transaksi: number; nominal: number }[];
    topKkpSatker: { nama: string; transaksi: number; nominal: number }[];
    jumlahVendorUmkm: number;
    pertumbuhanPersen: number;
  };
  customPages?: CustomBuletinPage[]; // Daftar halaman kustom tambahan yang dibuat oleh admin
  excludedPages?: number[]; // Daftar halaman yang disembunyikan/dihapus jika pengguna tidak menginginkannya

  // Hal 20 / 24: Back Cover & Kontak
  kontakKppn?: {
    alamat: string;
    telepon: string;
    whatsappHelpdesk: string;
    email: string;
    website: string;
    instagram: string;
    youtube: string;
    fotoGedungUrl?: string;
    qrCodeText?: string;
  };

  kegiatanKppn?: {
    judul: string;
    subJudul: string;
    tanggal: string;
    lokasi: string;
    deskripsi: string;
  };
  tipsSaktiCustom?: string[];
  catatanAnalis?: string;
  rekonsiliasiSelisihData?: {
    totalSatkerSelisih: number;
    totalDiffReal: number;
    totalDiffPagu: number;
    catatanRingkas: string;
    satkerList?: {
      kode: string;
      nama: string;
      diffReal: number;
      diffPagu: number;
      jenisBelanjaDiff: string;
      catatan?: string;
    }[];
    updatedAt?: string;
  };
  canvaTemplateUrl?: string;
  updatedAt?: string;
}



