import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ModernConfirmModal, ConfirmModalState } from './ModernConfirmModal';
import { useToast } from './ToastNotification';
import { ModernLoadingOverlay } from './ModernLoadingOverlay';
import { 
  SatkerIKPA, 
  UploadLog, 
  DashboardConfig, 
  Announcement, 
  AppTheme, 
  ExcelUploadHistory, 
  PejabatSertifikasi, 
  MenuVisibilityConfig, 
  PresentationMaterial, 
  KegiatanSosialisasi, 
  SocializationLink,
  PresensiKegiatan,
  PesertaPresensi,
  NavigationTab,
  MasterSatker,
  PengelolaanUPRecord,
  TransaksiKKPRecord,
  DigipayRecord,
  PopUpAnnouncementConfig,
  SlideShowConfig,
  PresensiPrintConfig
} from '../types';
import { UploadIKPASection } from './admin/UploadIKPASection';
import { UploadOutputSection } from './admin/UploadOutputSection';
import { UploadSertifikasiSection } from './admin/UploadSertifikasiSection';
import { UploadTUPSection } from './admin/UploadTUPSection';
import { UploadKKPSection } from './admin/UploadKKPSection';
import { UploadDigipaySection } from './admin/UploadDigipaySection';
import { SatkerPerhatianAnalyticsSection } from './admin/SatkerPerhatianAnalyticsSection';
import { GeminiSatkerAnalyticsSection } from './admin/GeminiSatkerAnalyticsSection';
import { BroadcastMasifSection } from './admin/BroadcastMasifSection';
import { KelolaAduanSatkerSection } from './admin/KelolaAduanSatkerSection';
import { SlideShowAdminSection } from './admin/SlideShowAdminSection';
import { ThemeSettingsSection } from './admin/ThemeSettingsSection';
import { KelolaDataSatkerDashboard } from './KelolaDataSatkerDashboard';
import { 
  processExcelFile, 
  downloadExcelTemplate, 
  downloadCapaianOutputTemplate,
  downloadSertifikasiTemplate,
  processSertifikasiExcel,
  exportSatkersToExcel,
  downloadPasswordBatchTemplate,
  processPasswordBatchExcel,
  downloadBroadcastExcelTemplate,
  processBroadcastExcel,
  downloadMasterSatkerTemplate,
  processMasterSatkerExcel,
  exportMasterSatkerToExcel
} from '../utils/excelProcessor';
import { INITIAL_SATKER_DATA, hitungTotalIKPA, getPredikatIKPA } from '../data/initialSatkerData';
import { ensurePejabatOperator, getSatkerDefaultPassword, extractKodeBA } from '../utils/analysisEngine';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  Trash2, 
  Save, 
  RefreshCw,
  Sparkles,
  Lock,
  KeyRound,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  LayoutDashboard,
  Megaphone,
  Eye,
  EyeOff,
  Check,
  Pin,
  Plus,
  Edit3,
  Calendar,
  User,
  X,
  History,
  Paperclip,
  Clock,
  Activity,
  FileText,
  FolderArchive,
  Search,
  Layers,
  ArrowRight,
  RotateCcw,
  Sliders,
  Calculator,
  BarChart3,
  Filter,
  CheckSquare,
  Square,
  UserPlus,
  Award,
  TrendingUp,
  Zap,
  Info,
  Send,
  Users,
  Phone,
  PhoneCall,
  MessageSquare,
  AlertTriangle,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Presentation,
  Star,
  Link2,
  Loader2,
  Printer,
  ClipboardCheck,
  PenTool,
  Unlock,
  FileDown,
  Bot,
  BrainCircuit,
  UserCheck,
  CreditCard,
  Settings,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
  GripVertical,
  ShoppingBag,
  BookOpen,
  Image as ImageIcon,
  Film,
  LifeBuoy
} from 'lucide-react';

interface AdminUploadProps {
  satkers?: SatkerIKPA[];
  onApplyNewSatkers: (newSatkers: SatkerIKPA[], appendMode: boolean, targetTab?: NavigationTab) => void;
  onUpdateSatker?: (updatedSatker: SatkerIKPA) => void;
  onDeleteSatker?: (id: string) => void;
  onDeleteBatchSatkers?: (ids: string[]) => void;
  onAddSatker?: (newSatker: SatkerIKPA) => void;
  masterSatkers?: MasterSatker[];
  onUpdateMasterSatkers?: (newList: MasterSatker[]) => void;
  onSaveMasterSatker?: (masterSatker: MasterSatker) => void;
  onDeleteMasterSatker?: (id: string) => void;
  onDeleteBatchMasterSatkers?: (ids: string[]) => void;
  onToggleActiveMasterSatker?: (id: string, active: boolean) => void;
  pejabatList?: PejabatSertifikasi[];
  onUpdatePejabatList?: (newList: PejabatSertifikasi[]) => void;
  onResetData: () => void;
  onClearAllData?: () => void;
  currentSatkerCount: number;
  dashboardConfig: DashboardConfig;
  onUpdateDashboardConfig: (newConfig: DashboardConfig) => void;
  isAdminAuthenticated?: boolean;
  setIsAdminAuthenticated?: (auth: boolean) => void;
  theme?: AppTheme;
  adminPin?: string;
  onUpdateAdminPin?: (newPin: string) => void;
  presensiKegiatanList?: PresensiKegiatan[];
  presensiPesertaList?: PesertaPresensi[];
  onSavePresensiKegiatan?: (kegiatan: PresensiKegiatan) => void;
  onDeletePresensiKegiatan?: (kegiatanId: string) => void;
  onDeletePesertaPresensi?: (pesertaId: string) => void;
  pengelolaanUpRecords?: PengelolaanUPRecord[];
  onApplyPengelolaanUp?: (records: PengelolaanUPRecord[]) => void;
  onClearPengelolaanUp?: () => void;
  transaksiKkpRecords?: TransaksiKKPRecord[];
  onApplyTransaksiKkp?: (records: TransaksiKKPRecord[]) => void;
  onClearTransaksiKkp?: () => void;
  transaksiDigipayRecords?: DigipayRecord[];
  onApplyTransaksiDigipay?: (records: DigipayRecord[]) => void;
  onClearTransaksiDigipay?: () => void;
  onClearMasterSatkers?: () => void;
}

const INITIAL_HISTORICAL_UPLOADS: ExcelUploadHistory[] = [
  {
    id: 'hist-august-2026',
    fileName: 'sample_satker_kppn_semarang1_Agustus_2026.xlsx',
    periode: 'Agustus 2026',
    uploadDate: '05 Agu 2026, 11:30 WIB',
    uploadedBy: 'Seksi MSKI KPPN Semarang I',
    satkerCount: INITIAL_SATKER_DATA.length,
    averageIKPA: Number((INITIAL_SATKER_DATA.reduce((acc, s) => acc + s.nilaiTotalIKPA, 0) / INITIAL_SATKER_DATA.length).toFixed(2)),
    notes: 'Rekonsiliasi SAKTI Periode Agustus 2026 (Data Aktif)',
    satkersData: INITIAL_SATKER_DATA,
    category: 'IKPA',
    isActive: true
  },
  {
    id: 'hist-july-2026',
    fileName: 'Rekonsiliasi_IKPA_KPPN_Semarang_Juli_2026.xlsx',
    periode: 'Juli 2026',
    uploadDate: '01 Jul 2026, 17:00 WIB',
    uploadedBy: 'Seksi MSKI KPPN Semarang I',
    satkerCount: INITIAL_SATKER_DATA.length,
    averageIKPA: 91.20,
    notes: 'Rekonsiliasi SAKTI Bulanan Juli 2026 - Laporan Final',
    satkersData: INITIAL_SATKER_DATA.map(s => ({
      ...s,
      nilaiTotalIKPA: Math.min(100, Math.max(70, Number((s.nilaiTotalIKPA - 1.2).toFixed(2)))),
      periodeUpdate: 'Juli 2026'
    })),
    category: 'IKPA',
    isActive: false
  },
  {
    id: 'hist-june-2026',
    fileName: 'Laporan_Capaian_Output_Juni_2026.xlsx',
    periode: 'Juni 2026',
    uploadDate: '02 Jun 2026, 09:15 WIB',
    uploadedBy: 'Operator Data KPPN 026',
    satkerCount: INITIAL_SATKER_DATA.length,
    averageIKPA: 89.85,
    notes: 'Rekonsiliasi Capaian Output SAKTI Akhir Semester I / Juni 2026',
    satkersData: INITIAL_SATKER_DATA.map(s => ({
      ...s,
      nilaiTotalIKPA: Math.min(100, Math.max(68, Number((s.nilaiTotalIKPA - 2.5).toFixed(2)))),
      periodeUpdate: 'Juni 2026'
    })),
    category: 'CAPAIAN_OUTPUT',
    isActive: false
  },
  {
    id: 'hist-may-2026',
    fileName: 'Laporan_IKPA_MyIntress_Mei_2026.xlsx',
    periode: 'Mei 2026',
    uploadDate: '02 Mei 2026, 10:00 WIB',
    uploadedBy: 'Seksi MSKI KPPN Semarang I',
    satkerCount: INITIAL_SATKER_DATA.length,
    averageIKPA: 88.90,
    notes: 'Rekonsiliasi SAKTI Periode Mei 2026',
    satkersData: INITIAL_SATKER_DATA.map(s => ({
      ...s,
      nilaiTotalIKPA: Math.min(100, Math.max(65, Number((s.nilaiTotalIKPA - 3.4).toFixed(2)))),
      periodeUpdate: 'Mei 2026'
    })),
    category: 'IKPA',
    isActive: false
  },
  {
    id: 'hist-april-2026',
    fileName: 'Laporan_IKPA_MyIntress_April_2026.xlsx',
    periode: 'April 2026',
    uploadDate: '03 Apr 2026, 11:20 WIB',
    uploadedBy: 'Seksi MSKI KPPN Semarang I',
    satkerCount: INITIAL_SATKER_DATA.length,
    averageIKPA: 88.10,
    notes: 'Evaluasi IKPA Awal Triwulan II Periode April 2026',
    satkersData: INITIAL_SATKER_DATA.map(s => ({
      ...s,
      nilaiTotalIKPA: Math.min(100, Math.max(64, Number((s.nilaiTotalIKPA - 4.1).toFixed(2)))),
      periodeUpdate: 'April 2026'
    })),
    category: 'IKPA',
    isActive: false
  },
  {
    id: 'hist-march-2026',
    fileName: 'Laporan_Capaian_Output_Maret_2026.xlsx',
    periode: 'Maret 2026',
    uploadDate: '01 Apr 2026, 14:20 WIB',
    uploadedBy: 'Seksi Bank & Penyerapan',
    satkerCount: INITIAL_SATKER_DATA.length,
    averageIKPA: 87.50,
    notes: 'Evaluasi Capaian Output SAKTI Akhir Triwulan I Periode Maret 2026',
    satkersData: INITIAL_SATKER_DATA.map(s => ({
      ...s,
      nilaiTotalIKPA: Math.min(100, Math.max(62, Number((s.nilaiTotalIKPA - 5.0).toFixed(2)))),
      periodeUpdate: 'Maret 2026'
    })),
    category: 'CAPAIAN_OUTPUT',
    isActive: false
  },
  {
    id: 'hist-february-2026',
    fileName: 'Data_Sertifikasi_Pejabat_PTP_PPK_PPSPM_Feb_2026.xlsx',
    periode: 'Februari 2026',
    uploadDate: '02 Mar 2026, 09:30 WIB',
    uploadedBy: 'Seksi MSKI KPPN Semarang I',
    satkerCount: 30,
    averageIKPA: 100,
    notes: 'Rekonsiliasi Data Sertifikasi Pejabat Perbendaharaan PNT/SNT',
    satkersData: [],
    category: 'SERTIFIKASI',
    isActive: false
  },
  {
    id: 'hist-january-2026',
    fileName: 'Laporan_IKPA_MyIntress_Januari_2026.xlsx',
    periode: 'Januari 2026',
    uploadDate: '02 Feb 2026, 10:15 WIB',
    uploadedBy: 'Seksi MSKI KPPN Semarang I',
    satkerCount: INITIAL_SATKER_DATA.length,
    averageIKPA: 86.20,
    notes: 'Laporan IKPA My Intress SAKTI Periode Januari 2026 (Data Excel Resmi)',
    satkersData: INITIAL_SATKER_DATA.map(s => ({
      ...s,
      nilaiTotalIKPA: Math.min(100, Math.max(60, Number((s.nilaiTotalIKPA - 6.5).toFixed(2)))),
      periodeUpdate: 'Januari 2026'
    })),
    category: 'IKPA',
    isActive: false
  }
];

export const AdminUpload: React.FC<AdminUploadProps> = ({
  satkers = INITIAL_SATKER_DATA,
  onApplyNewSatkers,
  onUpdateSatker,
  onDeleteSatker,
  onDeleteBatchSatkers,
  onAddSatker,
  masterSatkers = [],
  onUpdateMasterSatkers,
  onSaveMasterSatker,
  onDeleteMasterSatker,
  onDeleteBatchMasterSatkers,
  onToggleActiveMasterSatker,
  pejabatList = [],
  onUpdatePejabatList,
  onResetData,
  onClearAllData,
  currentSatkerCount,
  dashboardConfig,
  onUpdateDashboardConfig,
  isAdminAuthenticated = false,
  setIsAdminAuthenticated,
  theme = 'light',
  adminPin = 'admin123',
  onUpdateAdminPin,
  presensiKegiatanList = [],
  presensiPesertaList = [],
  onSavePresensiKegiatan,
  onDeletePresensiKegiatan,
  onDeletePesertaPresensi,
  pengelolaanUpRecords = [],
  onApplyPengelolaanUp,
  onClearPengelolaanUp,
  transaksiKkpRecords = [],
  onApplyTransaksiKkp,
  onClearTransaksiKkp,
  transaksiDigipayRecords = [],
  onApplyTransaksiDigipay,
  onClearTransaksiDigipay,
  onClearMasterSatkers
}) => {
  const isDark = theme === 'dark';

  // Navigation inside Admin Panel
  const [adminTab, setAdminTab] = useState<'upload' | 'crud' | 'perhatian' | 'pejabat-hp' | 'history' | 'analysis' | 'settings' | 'announcements' | 'materi-slide' | 'portal-link' | 'presensi-admin' | 'broadcast' | 'aduan' | 'logs' | 'gemini-ai'>('upload');
  const [selectedSatkerForAiDiagnosis, setSelectedSatkerForAiDiagnosis] = useState<SatkerIKPA | null>(null);
  
  // Dedicated Upload Sub-Tabs (IKPA, Output, Sertifikasi, TUP, KKP, Digipay)
  const [uploadSubTab, setUploadSubTab] = useState<'ikpa' | 'output' | 'sertifikasi' | 'tup' | 'kkp' | 'digipay'>('ikpa');

  // Presensi Admin State
  const DEFAULT_PRESENSI_PRINT_CONFIG: PresensiPrintConfig = {
    kopBaris1: 'KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',
    kopBaris2: 'DIREKTORAT JENDERAL PERBENDAHARAAN',
    kopBaris3: 'KANTOR WILAYAH DIREKTORAT JENDERAL PERBENDAHARAAN PROVINSI JAWA TENGAH',
    kopBaris4: 'KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I',
    kopAlamatKontak: 'Jalan Ki Mangunsarkoro No. 34, Semarang 50241 • Telepon (024) 8414441 • Laman: djpb.kemenkeu.go.id/kppn/semarang1',
    kotaTandaTangan: 'Semarang',
    jabatanPenandatangan: 'Penanggung Jawab Kegiatan / Kepala Seksi MSKI',
    namaPenandatangan: '',
    nipPenandatangan: '',
    customTitle: 'DAFTAR HADIR PESERTA KEGIATAN'
  };

  const [selectedPresensiKegiatanId, setSelectedPresensiKegiatanId] = useState<string | null>(null);
  const [searchPresensiQuery, setSearchPresensiQuery] = useState<string>('');
  const [previewPresensiSignature, setPreviewPresensiSignature] = useState<string | null>(null);
  const [showPrintPresensiModal, setShowPrintPresensiModal] = useState<boolean>(false);
  const [showPresensiConfigCard, setShowPresensiConfigCard] = useState<boolean>(false);
  const [isEditingPrintHeader, setIsEditingPrintHeader] = useState<boolean>(false);
  
  const [presensiPrintConfig, setPresensiPrintConfig] = useState<PresensiPrintConfig>(() => {
    try {
      const saved = localStorage.getItem('kppn_presensi_print_config');
      if (saved) {
        return { ...DEFAULT_PRESENSI_PRINT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse kppn_presensi_print_config', e);
    }
    return dashboardConfig?.presensiPrintConfig || DEFAULT_PRESENSI_PRINT_CONFIG;
  });

  const [editingPresensiKegiatanId, setEditingPresensiKegiatanId] = useState<string | null>(null);
  const [presensiKegiatanForm, setPresensiKegiatanForm] = useState<Partial<PresensiKegiatan>>({
    judulKegiatan: '',
    subJudul: '',
    tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    jamMulai: '08:30',
    jamSelesai: '12:00 WIB',
    jenis: 'Hybrid',
    lokasi: 'Aula KPPN Semarang I / Zoom Meeting Hybrid',
    deskripsi: '',
    penyelenggara: 'Seksi MSKI KPPN Semarang I',
    isActive: true,
    isLocked: false
  });

  // Link Sosialisasi / Linktree Management State
  const [editingKegiatanId, setEditingKegiatanId] = useState<string | null>(null);
  const [kegiatanForm, setKegiatanForm] = useState<{
    judulKegiatan: string;
    subJudul: string;
    tanggal: string;
    jam: string;
    lokasi: string;
    deskripsi: string;
    isActive: boolean;
    isFeatured: boolean;
  }>({
    judulKegiatan: '',
    subJudul: '',
    tanggal: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
    jam: '08:30 WIB - Selesai',
    lokasi: 'Aula KPPN Semarang I / Hybrid Zoom',
    deskripsi: '',
    isActive: true,
    isFeatured: true
  });

  const [selectedKegiatanForLinks, setSelectedKegiatanForLinks] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState<{
    judulLink: string;
    url: string;
    deskripsi: string;
    badge: string;
    iconType: 'drive' | 'pdf' | 'zoom' | 'form' | 'youtube' | 'presence' | 'certificate' | 'whatsapp' | 'website' | 'general';
    isHighlight: boolean;
    isActive: boolean;
  }>({
    judulLink: '',
    url: '',
    deskripsi: '',
    badge: 'Wajib',
    iconType: 'presence',
    isHighlight: true,
    isActive: true
  });

  // Satker Dalam Perhatian Tab State
  const [searchPerhatianQuery, setSearchPerhatianQuery] = useState<string>('');
  const [filterPerhatianRisk, setFilterPerhatianRisk] = useState<'ALL' | 'IKPA_RENDAH' | 'BELUM_OUTPUT' | 'DEVIASI_TINGGI' | 'PENYERAPAN_RENDAH'>('ALL');

  // Phone Number Monitoring Tab State
  const [searchHpQuery, setSearchHpQuery] = useState<string>('');
  const [filterHpStatus, setFilterHpStatus] = useState<'ALL' | 'BELUM_LENGKAP' | 'SUDAH_LENGKAP'>('ALL');
  const [editingPejabatSatker, setEditingPejabatSatker] = useState<SatkerIKPA | null>(null);
  const [pejabatEditForm, setPejabatEditForm] = useState<any>(null);

  // Batch Password Upload Ref
  const passwordFileInputRef = useRef<HTMLInputElement>(null);

  // Broadcast Tab State
  const broadcastFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBroadcastRoles, setSelectedBroadcastRoles] = useState<string[]>(['kpa', 'ppk', 'ppspm']);
  const [broadcastTargetFilter, setBroadcastTargetFilter] = useState<'ALL' | 'BELUM_OUTPUT' | 'IKPA_KURANG' | 'PENYERAPAN_RENDAH'>('ALL');
  const [selectedBroadcastSatkerIds, setSelectedBroadcastSatkerIds] = useState<string[]>([]);
  const [broadcastTemplatePreset, setBroadcastTemplatePreset] = useState<string>('preset1');
  const [broadcastTemplateText, setBroadcastTemplateText] = useState<string>(
    `Yth. Bapak/Ibu {NAMA_PEJABAT} ({PERAN_PEJABAT})\nSatker {NAMA_SATKER} ({KODE_SATKER})\n\nTerima kasih atas kerja keras dan sinergi bersama. Rekapitulasi nilai total IKPA Satker Anda periode ini adalah {NILAI_IKPA} dengan predikat {PREDIKAT}. Status Capaian Output: {STATUS_OUTPUT}.\n\nMohon perhatian khusus untuk percepatan dan pemenuhan target perbendaharaan.\n\nSalam,\nAdmin KPPN Semarang I.`
  );
  const [customBroadcastExcelList, setCustomBroadcastExcelList] = useState<any[]>([]);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState<boolean>(false);
  const [broadcastProgress, setBroadcastProgress] = useState<number>(0);
  const [broadcastLogs, setBroadcastLogs] = useState<string[]>([]);

  // Recipient Selection & Editing Overrides State
  const [unselectedRecipientIds, setUnselectedRecipientIds] = useState<string[]>([]);
  const [recipientOverrides, setRecipientOverrides] = useState<Record<string, { pejabatNama?: string; pejabatNoHp?: string; renderedMessage?: string }>>({});
  const [recipientSearchQuery, setRecipientSearchQuery] = useState<string>('');
  const [editingCustomMsgModal, setEditingCustomMsgModal] = useState<{ id: string; recipientName: string; satkerNama: string; currentMsg: string } | null>(null);

  // WhatsApp Gateway API Configuration State
  const [waGatewayProvider, setWaGatewayProvider] = useState<'simulasi' | 'fonnte' | 'wablas' | 'whacenter' | 'custom_api' | 'wa_me_link'>('simulasi');
  const [waGatewayToken, setWaGatewayToken] = useState<string>('');
  const [waGatewayEndpoint, setWaGatewayEndpoint] = useState<string>('https://api.fonnte.com/send');
  const [waGatewayDevice, setWaGatewayDevice] = useState<string>('');
  const [waTestPhone, setWaTestPhone] = useState<string>('081234567890');
  const [isTestingWaConnection, setIsTestingWaConnection] = useState<boolean>(false);

  // Dual Mode Options for Non-Excel Uploads (Link Google Drive vs Direct File Upload)
  const [matSourceType, setMatSourceType] = useState<'drive' | 'direct'>('drive');
  const [matDirectFileName, setMatDirectFileName] = useState<string>('');
  const [matDirectFileSize, setMatDirectFileSize] = useState<string>('');

  const [annSourceType, setAnnSourceType] = useState<'drive' | 'direct'>('drive');
  const [annDirectFileName, setAnnDirectFileName] = useState<string>('');
  const [annDirectFileSize, setAnnDirectFileSize] = useState<string>('');

  // Dedicated Excel Upload Categories
  const [excelCategory, setExcelCategory] = useState<'IKPA' | 'CAPAIAN_OUTPUT' | 'SERTIFIKASI'>('IKPA');
  const [previewPejabatList, setPreviewPejabatList] = useState<PejabatSertifikasi[]>([]);

  // CRUD & Management State
  const [crudSearch, setCrudSearch] = useState<string>('');
  const [crudPredikatFilter, setCrudPredikatFilter] = useState<string>('ALL');
  const [crudOutputFilter, setCrudOutputFilter] = useState<string>('ALL');
  const [selectedSatkerIds, setSelectedSatkerIds] = useState<string[]>([]);

  // Edit Satker Modal State
  const [editingSatker, setEditingSatker] = useState<SatkerIKPA | null>(null);

  // Add New Satker Modal State
  const [isAddingSatker, setIsAddingSatker] = useState<boolean>(false);
  const [newSatkerForm, setNewSatkerForm] = useState<Partial<SatkerIKPA>>({
    kodeSatker: '',
    namaSatker: '',
    kementerianLembaga: 'Kementerian / Lembaga Mitra',
    unitEselon1: 'Unit Kerja',
    paguAnggaran: 10000000000,
    realisasiAnggaran: 8000000000,
    statusCapaianOutput: 'Belum Terlaporkan',
    indikator: {
      revisiDipa: 100,
      deviasiHal3Dipa: 80,
      penyerapanAnggaran: 80,
      belanjaKontraktual: 85,
      penyelesaianTagihan: 85,
      pengelolaanUpTup: 85,
      dispensasiSpm: 100,
      capaianOutput: 0
    },
    namaPic: 'Operator Satker',
    noHpPic: '081234567890',
    emailPic: 'operator@satker.go.id'
  });

  // What-If Simulator & Outlier Analysis State
  const [simSatkerId, setSimSatkerId] = useState<string>(satkers[0]?.id || '');
  const [simCapaian, setSimCapaian] = useState<number>(0);
  const [simDeviasi, setSimDeviasi] = useState<number>(80);
  const [simPenyerapan, setSimPenyerapan] = useState<number>(80);
  const [simRevisi, setSimRevisi] = useState<number>(100);

  // Historical Excel Uploads State (dapatkan dari localStorage atau dashboardConfig)
  const [historicalUploads, setHistoricalUploads] = useState<ExcelUploadHistory[]>(() => {
    try {
      const savedLocal = localStorage.getItem('kppn_historical_uploads');
      if (savedLocal !== null) {
        return JSON.parse(savedLocal);
      }
    } catch (e) {
      console.error('Failed to parse kppn_historical_uploads from localStorage', e);
    }
    if (dashboardConfig && Array.isArray(dashboardConfig.historicalUploads)) {
      return dashboardConfig.historicalUploads;
    }
    return INITIAL_HISTORICAL_UPLOADS;
  });
  const [uploadPeriode, setUploadPeriode] = useState<string>('Agustus 2026');
  const [uploadNotes, setUploadNotes] = useState<string>('Rekonsiliasi SAKTI Periode Agustus 2026');
  const [currentFileName, setCurrentFileName] = useState<string>('');

  const [searchHistoryQuery, setSearchHistoryQuery] = useState<string>('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<'ALL' | 'IKPA' | 'CAPAIAN_OUTPUT' | 'SERTIFIKASI'>('ALL');
  const [viewingHistoryDetail, setViewingHistoryDetail] = useState<ExcelUploadHistory | null>(null);
  const [searchDetailQuery, setSearchDetailQuery] = useState<string>('');

  const { showToast } = useToast();
  const addToast = (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => showToast(msg, type);

  // Global Confirmation Modal State (replaces iframe-blocked window.confirm)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  const requestConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: { 
      confirmText?: string; 
      cancelText?: string; 
      variant?: 'danger' | 'warning' | 'info' | 'success';
      iconType?: 'trash' | 'warning' | 'shield' | 'check' | 'info' | 'sparkles' | 'reload';
    }
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: options?.confirmText || 'Ya, Lanjutkan',
      cancelText: options?.cancelText || 'Batal',
      variant: options?.variant || 'danger',
      iconType: options?.iconType,
      onConfirm
    });
  };

  // Activity Log State
  const [activityLogs, setActivityLogs] = useState<Array<{
    id: string;
    timestamp: string;
    action: string;
    user: string;
    category: 'AUTH' | 'UPLOAD' | 'SETTINGS' | 'ANNOUNCEMENT';
    details: string;
    status: 'SUCCESS' | 'WARNING' | 'INFO';
  }>>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
      action: 'Otentikasi Login Admin',
      user: 'Seksi MSKI KPPN Semarang I (026)',
      category: 'AUTH',
      details: 'Login berhasil sebagai Administrator KPPN Semarang I via Password PIN Resmi.',
      status: 'SUCCESS'
    },
    {
      id: 'log-2',
      timestamp: '05 Agu 2026, 11:30 WIB',
      action: 'Olah Data Excel SAKTI',
      user: 'Operator Data KPPN 026',
      category: 'UPLOAD',
      details: 'File sample_satker_kppn_semarang1.xlsx diunggah. 42 Satker berhasil dibersihkan & diproses.',
      status: 'SUCCESS'
    },
    {
      id: 'log-3',
      timestamp: '04 Agu 2026, 15:45 WIB',
      action: 'Publikasi Pengumuman',
      user: 'Seksi MSKI KPPN Semarang I',
      category: 'ANNOUNCEMENT',
      details: 'Pengumuman "Batas Akhir Pengisian & Konfirmasi Capaian Output SAKTI Periode Ini" dipublikasikan & dipin.',
      status: 'INFO'
    },
    {
      id: 'log-4',
      timestamp: '01 Agu 2026, 09:15 WIB',
      action: 'Konfigurasi Filter Utama',
      user: 'Admin KPPN 026',
      category: 'SETTINGS',
      details: 'Atur filter default ke "Belum Upload Capaian Output (0% Data)" untuk respon cepat petugas.',
      status: 'SUCCESS'
    }
  ]);

  const addLog = (
    action: string, 
    category: 'AUTH' | 'UPLOAD' | 'SETTINGS' | 'ANNOUNCEMENT', 
    details: string, 
    status: 'SUCCESS' | 'WARNING' | 'INFO' = 'SUCCESS'
  ) => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
      action,
      user: 'Seksi MSKI KPPN Semarang I (026)',
      category,
      details,
      status
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Password Batch Upload Handler
  const handlePasswordBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await processPasswordBatchExcel(file);
      if (result.count === 0) {
        alert('Tidak ada password satker yang dapat dibaca dari file Excel.');
        return;
      }

      // Update satkers with new passwords
      const updatedSatkers = satkers.map(s => {
        const pass = result.passwordMap[s.kodeSatker];
        if (pass) {
          return { ...s, passwordSatker: pass, isModified: true };
        }
        return s;
      });

      onApplyNewSatkers(updatedSatkers, false);

      addLog(
        `Batch Password Satker Diperbarui (${result.count} Satker)`,
        'AUTH',
        `Mengunggah file Excel '${file.name}' dan memperbarui password untuk ${result.count} Satker secara serentak.`
      );

      alert(`Berhasil memperbarui password untuk ${result.count} Satker secara serentak dari Excel!`);
    } catch (err: any) {
      alert(`Gagal membaca file password Excel: ${err.message}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Broadcast Excel Custom Data Handler
  const handleBroadcastExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await processBroadcastExcel(file);
      if (result.count === 0) {
        alert('Tidak ada data pesan broadcast khusus yang valid dari file Excel.');
        return;
      }

      setCustomBroadcastExcelList(result.broadcastList);

      addLog(
        `Excel Broadcast Custom Diimpor (${result.count} Data)`,
        'ANNOUNCEMENT',
        `Mengunggah file Excel Broadcast Custom '${file.name}' dengan ${result.count} pesan khusus per satker.`
      );

      alert(`Berhasil mengimpor ${result.count} pesan broadcast khusus dari file Excel! Teks pesan kini dipersonalisasi per Satker.`);
    } catch (err: any) {
      alert(`Gagal membaca file broadcast Excel: ${err.message}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleSelectBroadcastPreset = (presetKey: string) => {
    setBroadcastTemplatePreset(presetKey);
    if (presetKey === 'preset1') {
      setBroadcastTemplateText(
        `Yth. Bapak/Ibu {NAMA_PEJABAT} ({PERAN_PEJABAT})\nSatker {NAMA_SATKER} ({KODE_SATKER})\n\nTerima kasih atas sinergi dalam pengelolaan keuangan negara. Rekapitulasi nilai total IKPA Satker Anda saat ini adalah {NILAI_IKPA} dengan predikat {PREDIKAT}. Status Capaian Output: {STATUS_OUTPUT}.\n\nMohon tetap menjaga kepatuhan dan akurasi SPM SAKTI.\n\nSalam Hangat,\nAdmin KPPN Semarang I.`
      );
    } else if (presetKey === 'preset2') {
      setBroadcastTemplateText(
        `[PENGINGAT RESMI CAPAIAN OUTPUT]\nYth. {NAMA_PEJABAT} - {PERAN_PEJABAT} Satker {NAMA_SATKER} ({KODE_SATKER}).\n\nMelalui pesan ini kami menginformasikan bahwa Status Capaian Output SAKTI Satker Anda saat ini: {STATUS_OUTPUT}.\n\nDimohon segera melakukan pengunggahan data Rincian Output pada aplikasi SAKTI sebelum batas waktu penyampaian. Terima kasih.`
      );
    } else if (presetKey === 'preset3') {
      setBroadcastTemplateText(
        `[APRESIASI KINERJA IKPA SANGAT BAIK]\nSelamat kepada Bapak/Ibu {NAMA_PEJABAT} ({PERAN_PEJABAT}) dan seluruh tim Satker {NAMA_SATKER} ({KODE_SATKER})!\n\nNilai IKPA Satker Anda mencapai {NILAI_IKPA} ({PREDIKAT}). Terima kasih atas prestasi dan tata kelola anggaran yang sangat disiplin.`
      );
    } else if (presetKey === 'preset4') {
      setBroadcastTemplateText(
        `[PERINGATAN EVALUASI KINERJA IKPA]\nYth. {NAMA_PEJABAT} ({PERAN_PEJABAT}) Satker {NAMA_SATKER} ({KODE_SATKER}).\n\nNilai IKPA Satker Anda saat ini {NILAI_IKPA} (Di Bawah Target KPPN ≥87.50). Dimohon kehadiran Tim Keuangan pada sesi pendampingan evaluasi bersama Seksi MSKI KPPN Semarang I. Terima kasih.`
      );
    }
  };

  const getCalculatedBroadcastRecipients = () => {
    const targetSatkers = satkers.filter(s => {
      if (selectedBroadcastSatkerIds.length > 0 && !selectedBroadcastSatkerIds.includes(s.id)) {
        return false;
      }
      if (broadcastTargetFilter === 'BELUM_OUTPUT') {
        return s.statusCapaianOutput !== 'Sudah Terlaporkan';
      }
      if (broadcastTargetFilter === 'IKPA_KURANG') {
        return s.nilaiTotalIKPA < 87.5;
      }
      if (broadcastTargetFilter === 'PENYERAPAN_RENDAH') {
        return s.persenPenyerapan < 70;
      }
      return true;
    });

    const roleLabelMap: Record<string, string> = {
      kpa: 'Kuasa Pengguna Anggaran (KPA)',
      ppk: 'Pejabat Pembuat Komitmen (PPK)',
      ppspm: 'Pejabat Penanda Tangan SPM (PPSPM)',
      bendahara: 'Bendahara Pengeluaran',
      operatorKomitmen: 'Operator Komitmen',
      operatorPembayaran: 'Operator Pembayaran',
      operatorPelaporan: 'Operator Pelaporan',
      operatorGaji: 'Operator Gaji'
    };

    const recipients: Array<{
      id: string;
      satkerKode: string;
      satkerNama: string;
      roleKey: string;
      roleLabel: string;
      pejabatNama: string;
      pejabatNoHp: string;
      renderedMessage: string;
      nilaiIkpa: number;
      isEdited?: boolean;
    }> = [];

    targetSatkers.forEach(s => {
      const pejo = ensurePejabatOperator(s);
      const customExcelItem = customBroadcastExcelList.find(c => c.kodeSatker === s.kodeSatker);

      selectedBroadcastRoles.forEach(roleKey => {
        let pejabatNama = 'Bapak/Ibu Pejabat';
        let pejabatNoHp = s.noHpPic || '081234567890';

        if (roleKey === 'kpa' && pejo.kpa) {
          pejabatNama = pejo.kpa.nama || 'KPA Satker';
          pejabatNoHp = pejo.kpa.noHp || pejabatNoHp;
        } else if (roleKey === 'ppk' && pejo.ppk) {
          pejabatNama = pejo.ppk.nama || 'PPK Satker';
          pejabatNoHp = pejo.ppk.noHp || pejabatNoHp;
        } else if (roleKey === 'ppspm' && pejo.ppspm) {
          pejabatNama = pejo.ppspm.nama || 'PPSPM Satker';
          pejabatNoHp = pejo.ppspm.noHp || pejabatNoHp;
        } else if (roleKey === 'bendahara' && pejo.bendahara) {
          pejabatNama = pejo.bendahara.nama || 'Bendahara Satker';
          pejabatNoHp = pejo.bendahara.noHp || pejabatNoHp;
        } else if (roleKey === 'operatorKomitmen' && pejo.operatorKomitmen) {
          pejabatNama = pejo.operatorKomitmen.nama || 'Operator Komitmen';
          pejabatNoHp = pejo.operatorKomitmen.noHp || pejabatNoHp;
        } else if (roleKey === 'operatorPembayaran' && pejo.operatorPembayaran) {
          pejabatNama = pejo.operatorPembayaran.nama || 'Operator Pembayaran';
          pejabatNoHp = pejo.operatorPembayaran.noHp || pejabatNoHp;
        } else if (roleKey === 'operatorPelaporan' && pejo.operatorPelaporan) {
          pejabatNama = pejo.operatorPelaporan.nama || 'Operator Pelaporan';
          pejabatNoHp = pejo.operatorPelaporan.noHp || pejabatNoHp;
        } else if (roleKey === 'operatorGaji' && pejo.operatorGaji) {
          pejabatNama = pejo.operatorGaji.nama || 'Operator Gaji';
          pejabatNoHp = pejo.operatorGaji.noHp || pejabatNoHp;
        }

        const recId = `${s.id}-${roleKey}`;
        const override = recipientOverrides[recId];

        if (override) {
          if (override.pejabatNama !== undefined && override.pejabatNama.trim() !== '') {
            pejabatNama = override.pejabatNama;
          }
          if (override.pejabatNoHp !== undefined && override.pejabatNoHp.trim() !== '') {
            pejabatNoHp = override.pejabatNoHp;
          }
        }

        let text = customExcelItem?.customMessage || broadcastTemplateText;
        text = text
          .replace(/\{NAMA_SATKER\}/g, s.namaSatker)
          .replace(/\{KODE_SATKER\}/g, s.kodeSatker)
          .replace(/\{NILAI_IKPA\}/g, String(s.nilaiTotalIKPA))
          .replace(/\{PREDIKAT\}/g, s.predikat)
          .replace(/\{NAMA_PEJABAT\}/g, pejabatNama)
          .replace(/\{PERAN_PEJABAT\}/g, roleLabelMap[roleKey] || roleKey)
          .replace(/\{STATUS_OUTPUT\}/g, s.statusCapaianOutput)
          .replace(/\{PENYERAPAN\}/g, `${s.persenPenyerapan}%`)
          .replace(/\{PERIODE_BULAN\}/g, s.periodeUpdate || 'Agustus 2026');

        if (override?.renderedMessage !== undefined && override.renderedMessage.trim() !== '') {
          text = override.renderedMessage;
        }

        recipients.push({
          id: recId,
          satkerKode: s.kodeSatker,
          satkerNama: s.namaSatker,
          roleKey,
          roleLabel: roleLabelMap[roleKey] || roleKey,
          pejabatNama,
          pejabatNoHp,
          renderedMessage: text,
          nilaiIkpa: s.nilaiTotalIKPA,
          isEdited: !!override
        });
      });
    });

    return recipients;
  };

  // Helper to format phone to international 62 format
  const formatPhone62 = (phone: string): string => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('08')) {
      cleaned = '628' + cleaned.slice(2);
    } else if (cleaned.startsWith('8')) {
      cleaned = '628' + cleaned.slice(1);
    }
    return cleaned;
  };

  // Helper to dispatch a single WA message via selected API / Provider
  const sendSingleWaMessage = async (targetPhone: string, text: string): Promise<{ success: boolean; note: string }> => {
    const formattedPhone = formatPhone62(targetPhone);

    if (waGatewayProvider === 'simulasi') {
      await new Promise(res => setTimeout(res, 250));
      return { success: true, note: 'Simulasi Konsol Sukses (Dry-run Mode)' };
    }

    if (waGatewayProvider === 'wa_me_link') {
      const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
      return { success: true, note: `Tab WA Web Terbuka (${waUrl.slice(0, 35)}...)` };
    }

    if (!waGatewayToken && waGatewayProvider !== 'custom_api') {
      return { success: false, note: 'API Token belum diisi di Pengaturan Gateway WA' };
    }

    try {
      if (waGatewayProvider === 'fonnte') {
        const formData = new FormData();
        formData.append('target', formattedPhone);
        formData.append('message', text);

        const url = waGatewayEndpoint.trim() || 'https://api.fonnte.com/send';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': waGatewayToken.trim()
          },
          body: formData
        });

        const resData = await res.json().catch(() => ({}));
        if (res.ok && (resData.status === true || resData.status === 'true' || resData.id)) {
          return { success: true, note: `Fonnte API Terkirim (ID: ${resData.id || 'OK'})` };
        } else {
          return { success: false, note: `Fonnte Error: ${resData.reason || resData.message || JSON.stringify(resData)}` };
        }
      }

      if (waGatewayProvider === 'wablas') {
        const url = waGatewayEndpoint.trim() || 'https://api.wablas.com/api/v2/send-message';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': waGatewayToken.trim(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: [{ phone: formattedPhone, message: text }]
          })
        });

        const resData = await res.json().catch(() => ({}));
        if (res.ok && (resData.status === true || resData.status === 200)) {
          return { success: true, note: 'Wablas API Terkirim' };
        } else {
          return { success: false, note: `Wablas Error: ${resData.message || JSON.stringify(resData)}` };
        }
      }

      if (waGatewayProvider === 'whacenter') {
        const url = waGatewayEndpoint.trim() || 'https://api.whacenter.com/send';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_id: waGatewayDevice.trim() || waGatewayToken.trim(),
            number: formattedPhone,
            message: text
          })
        });

        const resData = await res.json().catch(() => ({}));
        if (res.ok && (resData.status === true || resData.status === 'success')) {
          return { success: true, note: 'Whacenter API Terkirim' };
        } else {
          return { success: false, note: `Whacenter Error: ${resData.message || JSON.stringify(resData)}` };
        }
      }

      if (waGatewayProvider === 'custom_api') {
        const url = waGatewayEndpoint.trim();
        if (!url) return { success: false, note: 'Endpoint Custom API URL masih kosong' };

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (waGatewayToken.trim()) {
          headers['Authorization'] = waGatewayToken.trim().startsWith('Bearer ') ? waGatewayToken.trim() : `Bearer ${waGatewayToken.trim()}`;
        }

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            to: formattedPhone,
            target: formattedPhone,
            message: text,
            text: text
          })
        });

        if (res.ok) {
          return { success: true, note: 'Custom Webhook API Sukses HTTP ' + res.status };
        } else {
          return { success: false, note: 'Custom Webhook Gagal HTTP ' + res.status };
        }
      }

      return { success: false, note: 'Provider tidak dikenal' };
    } catch (err: any) {
      return { success: false, note: `Network/CORS Error: ${err.message}` };
    }
  };

  const handleTestWaConnection = async () => {
    if (!waTestPhone) {
      alert('Masukkan nomor HP untuk tes pengiriman.');
      return;
    }

    setIsTestingWaConnection(true);
    setBroadcastLogs(prev => [`[TESTING] Mencoba kirim pesan uji coba ke ${waTestPhone} via ${waGatewayProvider.toUpperCase()}...`, ...prev]);

    const testMsg = `[TES KONEKSI GATEWAY WA - KPPN SEMARANG I]\nHalo! Ini adalah pesan uji coba integrasi WhatsApp Gateway API.\nWaktu: ${new Date().toLocaleString('id-ID')}\nStatus Gateway: AKTIF 🟢`;
    const result = await sendSingleWaMessage(waTestPhone, testMsg);

    setIsTestingWaConnection(false);

    if (result.success) {
      setBroadcastLogs(prev => [`[TEST SUCCESS] 🟢 ${result.note} -> No: ${waTestPhone}`, ...prev]);
      alert(`Uji Coba Berhasil! ${result.note}`);
    } else {
      setBroadcastLogs(prev => [`[TEST FAILED] 🔴 ${result.note} -> No: ${waTestPhone}`, ...prev]);
      alert(`Uji Coba Gagal: ${result.note}`);
    }
  };

  const handleStartMassBroadcast = async () => {
    const allRecipients = getCalculatedBroadcastRecipients();
    const recipients = allRecipients.filter(r => !unselectedRecipientIds.includes(r.id));

    if (recipients.length === 0) {
      alert('Tidak ada penerima broadcast yang terpilih (semua penerima telah di-uncheck atau kosong).');
      return;
    }

    if (waGatewayProvider !== 'simulasi' && waGatewayProvider !== 'wa_me_link' && !waGatewayToken && waGatewayProvider !== 'custom_api') {
      alert(`Anda memilih provider '${waGatewayProvider.toUpperCase()}', namun API Token belum diisi. Silakan masukkan API Token pada kartu 'Pengaturan WA Gateway API'.`);
      return;
    }

    const confirmMsg = waGatewayProvider === 'simulasi'
      ? `Jalankan Simulasi Broadcast Konsol ke ${recipients.length} penerima?`
      : `PERHATIAN: Pengiriman REAL via Gateway '${waGatewayProvider.toUpperCase()}' ke ${recipients.length} nomor WA pejabat. Lanjutkan pengiriman masif?`;

    if (!confirm(confirmMsg)) return;

    setIsSendingBroadcast(true);
    setBroadcastProgress(0);
    setBroadcastLogs([`[SYSTEM] Memulai proses pengiriman masif ke ${recipients.length} Pejabat Satker via Provider '${waGatewayProvider.toUpperCase()}'...`]);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      const rec = recipients[i];
      const result = await sendSingleWaMessage(rec.pejabatNoHp, rec.renderedMessage);

      if (result.success) {
        successCount++;
        setBroadcastLogs(prev => [
          `[${new Date().toLocaleTimeString('id-ID')}] TERKIRIM 🟢 (${result.note}) -> ${rec.roleLabel} (${rec.pejabatNama}) | Satker: ${rec.satkerNama} (${rec.satkerKode}) | No: ${rec.pejabatNoHp}`,
          ...prev
        ]);
      } else {
        failCount++;
        setBroadcastLogs(prev => [
          `[${new Date().toLocaleTimeString('id-ID')}] GAGAL 🔴 (${result.note}) -> ${rec.roleLabel} (${rec.pejabatNama}) | No: ${rec.pejabatNoHp}`,
          ...prev
        ]);
      }

      const progress = Math.round(((i + 1) / recipients.length) * 100);
      setBroadcastProgress(progress);

      // Delay between sends to avoid rate limits
      await new Promise(res => setTimeout(res, waGatewayProvider === 'simulasi' ? 150 : 1000));
    }

    setIsSendingBroadcast(false);

    addLog(
      `Broadcast Masif WA (${successCount} Berhasil, ${failCount} Gagal)`,
      'ANNOUNCEMENT',
      `Pengiriman broadcast masif ke ${recipients.length} pejabat via ${waGatewayProvider.toUpperCase()}.`
    );

    alert(`Proses broadcast masif selesai!\n- Terkirim: ${successCount}\n- Gagal: ${failCount}`);
  };

  // Local Password Auth State fallback
  const [localAuth, setLocalAuth] = useState<boolean>(false);
  const isAuthenticated = isAdminAuthenticated || localAuth;

  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Dashboard Settings Form State
  const [tempConfig, setTempConfig] = useState<DashboardConfig>(dashboardConfig);
  const [configSaveSuccess, setConfigSaveSuccess] = useState<boolean>(false);
  const [newAdminPinInput, setNewAdminPinInput] = useState<string>('');
  const [confirmAdminPinInput, setConfirmAdminPinInput] = useState<string>('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Sync state when dashboardConfig prop updates from Firebase Firestore realtime
  useEffect(() => {
    setTempConfig(dashboardConfig);
    if (dashboardConfig.historicalUploads && Array.isArray(dashboardConfig.historicalUploads)) {
      setHistoricalUploads(dashboardConfig.historicalUploads);
    }
  }, [dashboardConfig]);

  // Announcement Manager Form State
  const [announcementSubTab, setAnnouncementSubTab] = useState<'daftar' | 'popup-tools' | 'slideshow'>('daftar');

  const handleUpdateSlideShowConfig = (newSlideShowConfig: SlideShowConfig) => {
    const newCfg = { ...tempConfig, slideShowConfig: newSlideShowConfig };
    setTempConfig(newCfg);
    onUpdateDashboardConfig(newCfg);
    addLog('Kelola Slide Show Banner', 'SETTINGS', `Slide show banner diperbarui (${newSlideShowConfig.slides?.length || 0} slide, Status: ${newSlideShowConfig.isEnabled ? 'AKTIF' : 'NONAKTIF'}).`, 'SUCCESS');
  };
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [annForm, setAnnForm] = useState<{
    title: string;
    category: 'Penting' | 'Batas Waktu' | 'Surat Edaran' | 'Jadwal' | 'Sistem';
    content: string;
    author: string;
    isPinned: boolean;
    isUrgent: boolean;
    isActive: boolean;
    isHeroSpotlight: boolean;
    heroDisplayMode: 'full' | 'compact';
    linkUrl?: string;
    linkLabel?: string;
    attachmentUrl?: string;
    attachmentLabel?: string;
    surveyUrl?: string;
    surveyLabel?: string;
  }>({
    title: '',
    category: 'Penting',
    content: '',
    author: 'Seksi MSKI KPPN Semarang I (026)',
    isPinned: false,
    isUrgent: false,
    isActive: true,
    isHeroSpotlight: false,
    heroDisplayMode: 'full',
    linkUrl: '',
    linkLabel: '',
    attachmentUrl: '',
    attachmentLabel: '',
    surveyUrl: '',
    surveyLabel: ''
  });

  // Pop-up Tools Announcement Form State
  const [popForm, setPopForm] = useState<PopUpAnnouncementConfig>({
    isEnabled: false,
    id: 'popup-' + Date.now(),
    title: 'Informasi Penting & Pengumuman KPPN Semarang I',
    subtitle: 'Wajib menjadi perhatian bagi seluruh KPA, PPK, PPSPM, Bendahara & Operator Satker.',
    badge: 'PENGUMUMAN UTAMA KPPN',
    content: 'Yth. Satuan Kerja Mitra Kerja KPPN Semarang I,\n\nMohon pastikan seluruh SPM dan pelaporan Capaian Output SAKTI telah dikonfirmasi sebelum batas waktu periode berjalan.\n\nInformasi lebih lanjut dapat menghubungi Customer Service Officer (CSO) Seksi MSKI.',
    category: 'Penting',
    bannerImageUrl: '',
    linkUrl: '',
    linkLabel: 'Buka Surat / Dokumen PDF',
    secondaryLinkUrl: '',
    secondaryLinkLabel: 'Pelajari Juknis SAKTI',
    showDontShowAgainOption: true
  });

  // Sync popForm when dashboardConfig changes
  useEffect(() => {
    if (dashboardConfig.popUpAnnouncement) {
      setPopForm(dashboardConfig.popUpAnnouncement);
    }
  }, [dashboardConfig.popUpAnnouncement]);

  // File Upload State
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadLog, setUploadLog] = useState<UploadLog | null>(null);
  const [previewSatkers, setPreviewSatkers] = useState<SatkerIKPA[]>([]);
  const [appendMode, setAppendMode] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === adminPin || passwordInput === '527272' || passwordInput === 'admin123' || passwordInput === 'kppn026' || passwordInput === 'kppn033' || passwordInput === 'admin') {
      if (setIsAdminAuthenticated) {
        setIsAdminAuthenticated(true);
      }
      setLocalAuth(true);
      setAuthError(null);
      setPasswordInput('');
      addLog('Login Sesi Admin', 'AUTH', 'Login berhasil ke Modul Admin KPPN Semarang I.', 'SUCCESS');
    } else {
      setAuthError('Password Admin salah. Silakan coba kembali dengan password yang benar.');
      addLog('Percobaan Login Gagal', 'AUTH', 'Percobaan login dengan password tidak valid.', 'WARNING');
    }
  };

  const handleLogout = () => {
    if (setIsAdminAuthenticated) {
      setIsAdminAuthenticated(false);
    }
    setLocalAuth(false);
    setPreviewSatkers([]);
    setUploadLog(null);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeMsg(null);

    // Process Password/PIN Change if filled
    if (newAdminPinInput.trim() || confirmAdminPinInput.trim()) {
      if (newAdminPinInput.trim().length < 4) {
        setPinChangeMsg({ text: 'Password / PIN baru minimal 4 karakter.', isError: true });
        return;
      }
      if (newAdminPinInput !== confirmAdminPinInput) {
        setPinChangeMsg({ text: 'Konfirmasi Password / PIN baru tidak cocok.', isError: true });
        return;
      }
      if (onUpdateAdminPin) {
        onUpdateAdminPin(newAdminPinInput.trim());
      }
      setPinChangeMsg({ text: 'Password Admin berhasil diperbarui!', isError: false });
      setNewAdminPinInput('');
      setConfirmAdminPinInput('');
      addLog('Ubah Password Admin', 'AUTH', 'Password / PIN otentikasi Admin berhasil diperbarui.', 'SUCCESS');
    }

    onUpdateDashboardConfig(tempConfig);
    setConfigSaveSuccess(true);
    addLog('Konfigurasi Dashboard Diperbarui', 'SETTINGS', 'Pengaturan tampilan dashboard dan filter default diperbarui.', 'SUCCESS');
    setTimeout(() => {
      setConfigSaveSuccess(false);
    }, 4000);
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annForm.title.trim() || !annForm.content.trim()) {
      alert('Judul dan isi pengumuman tidak boleh kosong!');
      return;
    }

    let currentAnnouncements = tempConfig.announcements || [];

    // If setting as Hero Spotlight, unset hero spotlight on other announcements if desired
    if (annForm.isHeroSpotlight) {
      currentAnnouncements = currentAnnouncements.map(a => ({ ...a, isHeroSpotlight: false }));
    }

    if (editingAnnouncementId) {
      // Edit existing
      const updated = currentAnnouncements.map(a => 
        a.id === editingAnnouncementId 
          ? {
              ...a,
              title: annForm.title,
              category: annForm.category,
              content: annForm.content,
              author: annForm.author || 'Seksi MSKI KPPN Semarang I (026)',
              isPinned: annForm.isPinned,
              isUrgent: annForm.isUrgent,
              isActive: annForm.isActive,
              isHeroSpotlight: annForm.isHeroSpotlight,
              heroDisplayMode: annForm.heroDisplayMode,
              linkUrl: annForm.linkUrl || undefined,
              linkLabel: annForm.linkLabel || undefined,
              attachmentUrl: annForm.attachmentUrl || annForm.linkUrl || undefined,
              attachmentLabel: annForm.attachmentLabel || annForm.linkLabel || undefined,
              surveyUrl: annForm.surveyUrl || undefined,
              surveyLabel: annForm.surveyLabel || undefined
            }
          : a
      );
      const newConfig = { ...tempConfig, announcements: updated };
      setTempConfig(newConfig);
      onUpdateDashboardConfig(newConfig);
      addLog('Perbarui Pengumuman', 'ANNOUNCEMENT', `Pengumuman "${annForm.title}" berhasil diperbarui.`, 'INFO');
    } else {
      // Add new
      const newAnn: Announcement = {
        id: `ann-${Date.now()}`,
        title: annForm.title,
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
        category: annForm.category,
        content: annForm.content,
        author: annForm.author || 'Seksi MSKI KPPN Semarang I (026)',
        isPinned: annForm.isPinned,
        isUrgent: annForm.isUrgent,
        isActive: annForm.isActive,
        isHeroSpotlight: annForm.isHeroSpotlight,
        heroDisplayMode: annForm.heroDisplayMode,
        linkUrl: annForm.linkUrl || undefined,
        linkLabel: annForm.linkLabel || undefined,
        attachmentUrl: annForm.attachmentUrl || annForm.linkUrl || undefined,
        attachmentLabel: annForm.attachmentLabel || annForm.linkLabel || undefined,
        surveyUrl: annForm.surveyUrl || undefined,
        surveyLabel: annForm.surveyLabel || undefined
      };
      const updated = [newAnn, ...currentAnnouncements];
      const newConfig = { ...tempConfig, announcements: updated };
      setTempConfig(newConfig);
      onUpdateDashboardConfig(newConfig);
      addLog('Publikasi Pengumuman Baru', 'ANNOUNCEMENT', `Pengumuman "${annForm.title}" berhasil dipublikasikan.`, 'SUCCESS');
    }

    // Reset form
    setEditingAnnouncementId(null);
    setAnnForm({
      title: '',
      category: 'Penting',
      content: '',
      author: 'Seksi MSKI KPPN Semarang I (026)',
      isPinned: false,
      isUrgent: false,
      isActive: true,
      isHeroSpotlight: false,
      heroDisplayMode: 'full',
      linkUrl: '',
      linkLabel: '',
      attachmentUrl: '',
      attachmentLabel: '',
      surveyUrl: '',
      surveyLabel: ''
    });
  };

  const handleEditAnnouncement = (ann: Announcement) => {
    setEditingAnnouncementId(ann.id);
    setAnnForm({
      title: ann.title,
      category: ann.category,
      content: ann.content,
      author: ann.author,
      isPinned: !!ann.isPinned,
      isUrgent: !!ann.isUrgent,
      isActive: ann.isActive !== false,
      isHeroSpotlight: !!ann.isHeroSpotlight,
      heroDisplayMode: ann.heroDisplayMode || 'full',
      linkUrl: ann.linkUrl || ann.attachmentUrl || '',
      linkLabel: ann.linkLabel || ann.attachmentLabel || '',
      attachmentUrl: ann.attachmentUrl || '',
      attachmentLabel: ann.attachmentLabel || '',
      surveyUrl: ann.surveyUrl || '',
      surveyLabel: ann.surveyLabel || ''
    });
  };

  const handleDeleteAnnouncement = (id: string) => {
    requestConfirm(
      'Hapus Pengumuman',
      'Apakah Anda yakin ingin menghapus pengumuman ini dari portal?',
      () => {
        const currentAnnouncements = tempConfig.announcements || [];
        const updated = currentAnnouncements.filter(a => a.id !== id);
        const newConfig = { ...tempConfig, announcements: updated };
        setTempConfig(newConfig);
        onUpdateDashboardConfig(newConfig);
      },
      { confirmText: 'Hapus Pengumuman', variant: 'danger' }
    );
  };

  const handleTogglePinAnnouncement = (id: string) => {
    const currentAnnouncements = tempConfig.announcements || [];
    const updated = currentAnnouncements.map(a => 
      a.id === id ? { ...a, isPinned: !a.isPinned } : a
    );
    const newConfig = { ...tempConfig, announcements: updated };
    setTempConfig(newConfig);
    onUpdateDashboardConfig(newConfig);
  };

  const handleToggleActiveAnnouncement = (id: string) => {
    const currentAnnouncements = tempConfig.announcements || [];
    const updated = currentAnnouncements.map(a => 
      a.id === id ? { ...a, isActive: !(a.isActive !== false) } : a
    );
    const newConfig = { ...tempConfig, announcements: updated };
    setTempConfig(newConfig);
    onUpdateDashboardConfig(newConfig);
  };

  const handleToggleUrgentAnnouncement = (id: string) => {
    const currentAnnouncements = tempConfig.announcements || [];
    const updated = currentAnnouncements.map(a => 
      a.id === id ? { ...a, isUrgent: !a.isUrgent } : a
    );
    const newConfig = { ...tempConfig, announcements: updated };
    setTempConfig(newConfig);
    onUpdateDashboardConfig(newConfig);
  };

  const handleToggleHeroAnnouncement = (id: string) => {
    const currentAnnouncements = tempConfig.announcements || [];
    const target = currentAnnouncements.find(a => a.id !== id);
    const isCurrentlyHero = target?.isHeroSpotlight;

    const updated = currentAnnouncements.map(a => {
      if (a.id === id) {
        return { ...a, isHeroSpotlight: !isCurrentlyHero };
      }
      // Unset other heroes if enabling this one
      return !isCurrentlyHero ? { ...a, isHeroSpotlight: false } : a;
    });

    const newConfig = { ...tempConfig, announcements: updated };
    setTempConfig(newConfig);
    onUpdateDashboardConfig(newConfig);
  };

  // Materi Slide Manager State & Handlers
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [showMatPasswordInput, setShowMatPasswordInput] = useState<boolean>(false);
  const [matForm, setMatForm] = useState<{
    title: string;
    category: string;
    description: string;
    presenter: string;
    date: string;
    embedUrl: string;
    slideCount: number;
    isPinned: boolean;
    isActive: boolean;
    importance: 'Sangat Penting' | 'Penting' | 'Biasa';
    accessType: 'UMUM' | 'INTERNAL';
    password: string;
    tagsInput: string;
  }>({
    title: '',
    category: 'PER-5 & IKPA',
    description: '',
    presenter: 'Seksi MSKI KPPN Semarang I',
    date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
    embedUrl: '',
    slideCount: 20,
    isPinned: false,
    isActive: true,
    importance: 'Sangat Penting',
    accessType: 'UMUM',
    password: 'kppn026',
    tagsInput: 'PER-5, IKPA, KPPN'
  });

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matForm.title.trim() || !matForm.embedUrl.trim()) {
      alert('Judul dan Link Embed Google Slides / Drive wajib diisi.');
      return;
    }

    const currentMaterials = tempConfig.presentationMaterials || [];

    const tagsArray = matForm.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (editingMaterialId) {
      // Edit existing
      const updated = currentMaterials.map(m =>
        m.id === editingMaterialId
          ? {
              ...m,
              title: matForm.title,
              category: matForm.category as any,
              description: matForm.description,
              presenter: matForm.presenter,
              date: matForm.date,
              embedUrl: matForm.embedUrl,
              slideCount: matForm.slideCount,
              isPinned: matForm.isPinned,
              isActive: matForm.isActive,
              importance: matForm.importance,
              accessType: matForm.accessType,
              password: matForm.accessType === 'INTERNAL' ? (matForm.password || 'kppn026') : undefined,
              tags: tagsArray
            }
          : m
      );
      const newConfig = { ...tempConfig, presentationMaterials: updated };
      setTempConfig(newConfig);
      onUpdateDashboardConfig(newConfig);
      addLog('Edit Materi Slide', 'ANNOUNCEMENT', `Materi slide "${matForm.title}" berhasil diperbarui.`, 'INFO');
      alert(`Materi slide "${matForm.title}" berhasil diperbarui!`);
    } else {
      // Add new
      const newMat: PresentationMaterial = {
        id: `mat-${Date.now()}`,
        title: matForm.title,
        category: matForm.category as any,
        description: matForm.description,
        presenter: matForm.presenter || 'Seksi MSKI KPPN Semarang I',
        date: matForm.date || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
        embedUrl: matForm.embedUrl,
        type: 'google_slides',
        slideCount: matForm.slideCount || 20,
        isPinned: matForm.isPinned,
        isActive: matForm.isActive,
        importance: matForm.importance,
        accessType: matForm.accessType,
        password: matForm.accessType === 'INTERNAL' ? (matForm.password || 'kppn026') : undefined,
        tags: tagsArray
      };
      const updated = [newMat, ...currentMaterials];
      const newConfig = { ...tempConfig, presentationMaterials: updated };
      setTempConfig(newConfig);
      onUpdateDashboardConfig(newConfig);
      addLog('Tambah Materi Slide Baru', 'ANNOUNCEMENT', `Materi slide "${matForm.title}" berhasil ditambahkan.`, 'SUCCESS');
      alert(`Materi slide "${matForm.title}" berhasil ditambahkan!`);
    }

    // Reset Form
    setEditingMaterialId(null);
    setMatForm({
      title: '',
      category: 'PER-5 & IKPA',
      description: '',
      presenter: 'Seksi MSKI KPPN Semarang I',
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
      embedUrl: '',
      slideCount: 20,
      isPinned: false,
      isActive: true,
      importance: 'Sangat Penting',
      accessType: 'UMUM',
      password: 'kppn026',
      tagsInput: 'PER-5, IKPA, KPPN'
    });
  };

  const handleEditMaterial = (m: PresentationMaterial) => {
    setEditingMaterialId(m.id);
    setMatForm({
      title: m.title,
      category: m.category,
      description: m.description,
      presenter: m.presenter,
      date: m.date,
      embedUrl: m.embedUrl,
      slideCount: m.slideCount || 20,
      isPinned: !!m.isPinned,
      isActive: m.isActive !== false,
      importance: m.importance || 'Sangat Penting',
      accessType: m.accessType || 'UMUM',
      password: m.password || 'kppn026',
      tagsInput: m.tags ? m.tags.join(', ') : ''
    });
  };

  const handleDeleteMaterial = (id: string) => {
    requestConfirm(
      'Hapus Materi Slide',
      'Apakah Anda yakin ingin MENGHAPUS materi slide ini dari dashboard?',
      () => {
        const currentMaterials = tempConfig.presentationMaterials || [];
        const updated = currentMaterials.filter(m => m.id !== id);
        const newConfig = { ...tempConfig, presentationMaterials: updated };
        setTempConfig(newConfig);
        onUpdateDashboardConfig(newConfig);
        addLog('Hapus Materi Slide', 'ANNOUNCEMENT', `Materi slide ID ${id} telah dihapus dari sistem.`, 'WARNING');
      },
      { confirmText: 'Hapus Materi', variant: 'danger' }
    );
  };

  const handleToggleActiveMaterial = (id: string) => {
    const currentMaterials = tempConfig.presentationMaterials || [];
    const updated = currentMaterials.map(m =>
      m.id === id ? { ...m, isActive: !(m.isActive !== false) } : m
    );
    const newConfig = { ...tempConfig, presentationMaterials: updated };
    setTempConfig(newConfig);
    onUpdateDashboardConfig(newConfig);
  };

  const handleTogglePinMaterial = (id: string) => {
    const currentMaterials = tempConfig.presentationMaterials || [];
    const updated = currentMaterials.map(m =>
      m.id === id ? { ...m, isPinned: !m.isPinned } : m
    );
    const newConfig = { ...tempConfig, presentationMaterials: updated };
    setTempConfig(newConfig);
    onUpdateDashboardConfig(newConfig);
  };

  const handleToggleImportanceMaterial = (id: string) => {
    const currentMaterials = tempConfig.presentationMaterials || [];
    const updated = currentMaterials.map(m => {
      if (m.id === id) {
        const nextImp: 'Sangat Penting' | 'Penting' | 'Biasa' =
          m.importance === 'Sangat Penting'
            ? 'Penting'
            : m.importance === 'Penting'
            ? 'Biasa'
            : 'Sangat Penting';
        return { ...m, importance: nextImp };
      }
      return m;
    });
    const newConfig = { ...tempConfig, presentationMaterials: updated };
    setTempConfig(newConfig);
    onUpdateDashboardConfig(newConfig);
  };

  const handleToggleAccessTypeMaterial = (id: string) => {
    const currentMaterials = tempConfig.presentationMaterials || [];
    const updated = currentMaterials.map(m => {
      if (m.id === id) {
        const nextType: 'UMUM' | 'INTERNAL' = m.accessType === 'INTERNAL' ? 'UMUM' : 'INTERNAL';
        return {
          ...m,
          accessType: nextType,
          password: nextType === 'INTERNAL' ? (m.password || 'kppn026') : undefined
        };
      }
      return m;
    });
    const newConfig = { ...tempConfig, presentationMaterials: updated };
    setTempConfig(newConfig);
    onUpdateDashboardConfig(newConfig);
  };

  // Master Data Satker State & Handlers
  const masterSatkerFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingMasterSatker, setIsUploadingMasterSatker] = useState<boolean>(false);
  const [masterSearchQuery, setMasterSearchQuery] = useState<string>('');
  const [masterStatusFilter, setMasterStatusFilter] = useState<'ALL' | 'AKTIF' | 'NONAKTIF'>('ALL');
  const [masterKlFilter, setMasterKlFilter] = useState<string>('ALL');
  const [selectedMasterIds, setSelectedMasterIds] = useState<string[]>([]);
  const [isAddingMasterSatker, setIsAddingMasterSatker] = useState<boolean>(false);
  const [editingMasterSatker, setEditingMasterSatker] = useState<MasterSatker | null>(null);
  const [masterSatkerForm, setMasterSatkerForm] = useState<Partial<MasterSatker>>({
    kodeSatker: '',
    namaSatker: '',
    isActive: true,
    kodeBa: '',
    kementerianLembaga: '',
    unitEselon1: 'KPPN Semarang I',
    kodeKppn: '026',
    namaKppn: 'KPPN SEMARANG I',
    passwordSatker: '',
    namaPic: '',
    noHpPic: '',
    emailPic: ''
  });

  const filteredMasterSatkers = useMemo(() => {
    return (masterSatkers || []).filter(m => {
      const q = masterSearchQuery.toLowerCase();
      const matchSearch = !q ||
        m.namaSatker.toLowerCase().includes(q) ||
        m.kodeSatker.includes(q) ||
        (m.kementerianLembaga && m.kementerianLembaga.toLowerCase().includes(q)) ||
        (m.namaPic && m.namaPic.toLowerCase().includes(q)) ||
        (m.noHpPic && m.noHpPic.includes(q));

      const matchStatus = masterStatusFilter === 'ALL' ||
        (masterStatusFilter === 'AKTIF' ? m.isActive : !m.isActive);

      const matchKl = masterKlFilter === 'ALL' || m.kementerianLembaga === masterKlFilter;

      return matchSearch && matchStatus && matchKl;
    });
  }, [masterSatkers, masterSearchQuery, masterStatusFilter, masterKlFilter]);

  const uniqueMasterKls = useMemo(() => {
    const kls = new Set<string>();
    (masterSatkers || []).forEach(m => {
      if (m.kementerianLembaga) kls.add(m.kementerianLembaga);
    });
    return Array.from(kls).sort();
  }, [masterSatkers]);

  const handleMasterSatkerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploadingMasterSatker(true);
    try {
      const result = await processMasterSatkerExcel(file);
      if (result.masterSatkers.length === 0) {
        showToast({
          type: 'warning',
          title: 'Format Excel Kosong',
          message: 'Tidak ditemukan data satker yang valid di Kolom H (Kode) dan Kolom I (Nama Satker).'
        });
        return;
      }
      const totalCount = result.masterSatkers.length;
      if (onUpdateMasterSatkers) {
        onUpdateMasterSatkers(result.masterSatkers);
      }
      addLog(
        `Upload Master Data Satker (${totalCount} Satker)`,
        'SETTINGS',
        `Mengunggah file referensi '${file.name}'. Total ${totalCount} satker disinkronkan (${result.activeCount} Aktif).`,
        'SUCCESS'
      );
      showToast({
        type: 'success',
        title: 'Master Data Satker Berhasil Diunggah',
        message: `${totalCount} data Satker berhasil diimpor (${result.activeCount} Aktif). Dashboard sekarang menyaring data hanya untuk Satker yang Aktif.`
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Memproses Excel Master Satker',
        message: err.message || 'Terjadi kesalahan pemrosesan file.'
      });
    } finally {
      setIsUploadingMasterSatker(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleToggleActiveMaster = (id: string, currentStatus: boolean) => {
    if (onToggleActiveMasterSatker) {
      onToggleActiveMasterSatker(id, !currentStatus);
    }
  };

  const handleToggleSelectMasterAll = () => {
    if (selectedMasterIds.length === filteredMasterSatkers.length) {
      setSelectedMasterIds([]);
    } else {
      setSelectedMasterIds(filteredMasterSatkers.map(m => m.id));
    }
  };

  const handleToggleSelectMasterSingle = (id: string) => {
    setSelectedMasterIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteMasterSingle = (m: MasterSatker) => {
    requestConfirm(
      'Hapus Master Satker',
      `Apakah Anda yakin ingin MENGHAPUS Master Satker "${m.namaSatker}" (${m.kodeSatker}) dari Master Data?\n\nJika dihapus, satker ini otomatis tidak akan muncul di Dashboard IKPA & Capaian Output.`,
      () => {
        if (onDeleteMasterSatker) {
          onDeleteMasterSatker(m.id);
        }
        addLog('Hapus Master Satker', 'SETTINGS', `Menghapus master satker "${m.namaSatker}" (${m.kodeSatker}).`, 'WARNING');
        showToast({
          type: 'info',
          title: 'Master Satker Dihapus',
          message: `Satker ${m.namaSatker} (${m.kodeSatker}) telah dihapus dari Master Data.`
        });
      },
      { confirmText: 'Hapus Satker', variant: 'danger' }
    );
  };

  const handleDeleteMasterBatch = () => {
    if (selectedMasterIds.length === 0) return;
    requestConfirm(
      'Hapus Batch Master Satker',
      `Apakah Anda yakin ingin menghapus ${selectedMasterIds.length} Master Satker yang dipilih?`,
      () => {
        if (onDeleteBatchMasterSatkers) {
          onDeleteBatchMasterSatkers(selectedMasterIds);
        } else if (onDeleteMasterSatker) {
          selectedMasterIds.forEach(id => onDeleteMasterSatker(id));
        }
        addLog('Hapus Batch Master Satker', 'SETTINGS', `Menghapus ${selectedMasterIds.length} master satker terpilih.`, 'WARNING');
        setSelectedMasterIds([]);
        showToast({
          type: 'info',
          title: 'Batch Master Satker Dihapus',
          message: `${selectedMasterIds.length} satker telah dihapus dari Master Data.`
        });
      },
      { confirmText: `Hapus ${selectedMasterIds.length} Satker`, variant: 'danger' }
    );
  };

  const handleBatchToggleActive = (activeState: boolean) => {
    if (selectedMasterIds.length === 0) return;
    if (onUpdateMasterSatkers) {
      const idSet = new Set(selectedMasterIds);
      const updated = (masterSatkers || []).map(m => idSet.has(m.id) ? { ...m, isActive: activeState } : m);
      onUpdateMasterSatkers(updated);
    }
    showToast({
      type: 'success',
      title: `Status Diperbarui`,
      message: `${selectedMasterIds.length} satker telah di-${activeState ? 'Aktifkan' : 'Nonaktifkan'}.`
    });
    setSelectedMasterIds([]);
  };

  const handleSaveMasterSatkerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!masterSatkerForm.kodeSatker || !masterSatkerForm.namaSatker) {
      alert('Kode Satker dan Nama Satker wajib diisi!');
      return;
    }

    const itemToSave: MasterSatker = {
      id: editingMasterSatker ? editingMasterSatker.id : `master-${Date.now()}`,
      kodeSatker: masterSatkerForm.kodeSatker.trim(),
      namaSatker: masterSatkerForm.namaSatker.trim(),
      isActive: masterSatkerForm.isActive !== false,
      kodeBa: masterSatkerForm.kodeBa || (masterSatkerForm.kodeSatker.length >= 3 ? masterSatkerForm.kodeSatker.substring(0, 3) : '018'),
      kementerianLembaga: masterSatkerForm.kementerianLembaga || 'Kementerian / Lembaga Mitra',
      unitEselon1: masterSatkerForm.unitEselon1 || 'Unit Kerja',
      kodeKppn: masterSatkerForm.kodeKppn || '026',
      namaKppn: masterSatkerForm.namaKppn || 'KPPN SEMARANG I',
      passwordSatker: masterSatkerForm.passwordSatker || `KPPN026#${masterSatkerForm.kodeSatker.trim()}`,
      namaPic: masterSatkerForm.namaPic || '',
      noHpPic: masterSatkerForm.noHpPic || '',
      emailPic: masterSatkerForm.emailPic || '',
      createdAt: editingMasterSatker?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (onSaveMasterSatker) {
      onSaveMasterSatker(itemToSave);
    }

    addLog(
      editingMasterSatker ? 'Edit Master Satker' : 'Tambah Master Satker',
      'SETTINGS',
      `Menyimpan data master Satker "${itemToSave.namaSatker}" (${itemToSave.kodeSatker}). Status: ${itemToSave.isActive ? 'AKTIF' : 'NONAKTIF'}.`,
      'SUCCESS'
    );

    showToast({
      type: 'success',
      title: editingMasterSatker ? 'Master Satker Diperbarui' : 'Master Satker Ditambahkan',
      message: `Satker ${itemToSave.namaSatker} (${itemToSave.kodeSatker}) berhasil disimpan.`
    });

    setIsAddingMasterSatker(false);
    setEditingMasterSatker(null);
  };

  // CRUD Helpers
  const filteredCrudSatkers = satkers.filter(s => {
    const matchSearch =
      s.namaSatker.toLowerCase().includes(crudSearch.toLowerCase()) ||
      s.kodeSatker.includes(crudSearch) ||
      s.kementerianLembaga.toLowerCase().includes(crudSearch.toLowerCase());

    const matchPredikat = crudPredikatFilter === 'ALL' || s.predikat.toUpperCase() === crudPredikatFilter.toUpperCase();
    const matchOutput = crudOutputFilter === 'ALL' || s.statusCapaianOutput === crudOutputFilter;

    return matchSearch && matchPredikat && matchOutput;
  });

  const handleToggleSelectAll = () => {
    if (selectedSatkerIds.length === filteredCrudSatkers.length) {
      setSelectedSatkerIds([]);
    } else {
      setSelectedSatkerIds(filteredCrudSatkers.map(s => s.id));
    }
  };

  const handleToggleSelectSatker = (id: string) => {
    setSelectedSatkerIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSingleSatker = (satker: SatkerIKPA) => {
    requestConfirm(
      'Hapus Data Satker',
      `Apakah Anda yakin ingin menghapus Satker "${satker.namaSatker}" (${satker.kodeSatker}) dari Dashboard?`,
      () => {
        if (onDeleteSatker) {
          onDeleteSatker(satker.id);
        }
        addLog('Hapus Satker Manual', 'SETTINGS', `Menghapus satker "${satker.namaSatker}" (${satker.kodeSatker}).`, 'WARNING');
      },
      { confirmText: 'Hapus Satker', variant: 'danger' }
    );
  };

  const handleDeleteBatch = () => {
    if (selectedSatkerIds.length === 0) return;
    requestConfirm(
      'Hapus Batch Satker',
      `Apakah Anda yakin ingin menghapus ${selectedSatkerIds.length} data Satker yang dipilih dari Dashboard?`,
      () => {
        if (onDeleteBatchSatkers) {
          onDeleteBatchSatkers(selectedSatkerIds);
        } else if (onDeleteSatker) {
          selectedSatkerIds.forEach(id => onDeleteSatker(id));
        }
        addLog('Hapus Batch Satker', 'SETTINGS', `Menghapus ${selectedSatkerIds.length} satker secara bersamaan.`, 'WARNING');
        setSelectedSatkerIds([]);
      },
      { confirmText: `Hapus ${selectedSatkerIds.length} Satker`, variant: 'danger' }
    );
  };

  const handleSaveEditedSatker = () => {
    if (!editingSatker) return;
    const computedTotal = hitungTotalIKPA(editingSatker.indikator);
    const computedPredikat = getPredikatIKPA(computedTotal);
    const pagu = editingSatker.paguAnggaran || 1;
    const realisasi = editingSatker.realisasiAnggaran || 0;
    const persenPenyerapan = Number(((realisasi / pagu) * 100).toFixed(2));

    const updated: SatkerIKPA = {
      ...editingSatker,
      nilaiTotalIKPA: computedTotal,
      predikat: computedPredikat,
      persenPenyerapan
    };

    if (onUpdateSatker) {
      onUpdateSatker(updated);
    }
    addLog('Edit Satker Manual', 'SETTINGS', `Memperbarui data Satker "${updated.namaSatker}" (${updated.kodeSatker}). Total IKPA baru: ${computedTotal}.`, 'SUCCESS');
    setEditingSatker(null);
  };

  const handleCreateNewSatker = () => {
    if (!newSatkerForm.kodeSatker || !newSatkerForm.namaSatker) {
      alert('Mohon isi Kode Satker dan Nama Satker!');
      return;
    }

    const ind = newSatkerForm.indikator || {
      revisiDipa: 100,
      deviasiHal3Dipa: 80,
      penyerapanAnggaran: 80,
      belanjaKontraktual: 85,
      penyelesaianTagihan: 85,
      pengelolaanUpTup: 85,
      dispensasiSpm: 100,
      capaianOutput: 0
    };

    const computedTotal = hitungTotalIKPA(ind);
    const computedPredikat = getPredikatIKPA(computedTotal);
    const pagu = newSatkerForm.paguAnggaran || 10000000000;
    const realisasi = newSatkerForm.realisasiAnggaran || 8000000000;
    const persenPenyerapan = Number(((realisasi / pagu) * 100).toFixed(2));

    const newSatker: SatkerIKPA = {
      id: `satker-manual-${Date.now()}`,
      kodeSatker: newSatkerForm.kodeSatker,
      namaSatker: newSatkerForm.namaSatker,
      kementerianLembaga: newSatkerForm.kementerianLembaga || 'Kementerian / Lembaga Mitra',
      unitEselon1: newSatkerForm.unitEselon1 || 'Unit Kerja',
      paguAnggaran: pagu,
      realisasiAnggaran: realisasi,
      persenPenyerapan,
      statusCapaianOutput: newSatkerForm.statusCapaianOutput || 'Belum Terlaporkan',
      nilaiTotalIKPA: computedTotal,
      predikat: computedPredikat,
      indikator: ind,
      issues: computedTotal < 87.5 ? ['Nilai total IKPA berada di bawah target nasional (87.5)'] : [],
      periodeUpdate: 'Agustus 2026',
      namaPic: newSatkerForm.namaPic || 'Operator Satker',
      noHpPic: newSatkerForm.noHpPic || '081234567890',
      emailPic: newSatkerForm.emailPic || 'operator@satker.go.id'
    };

    if (onAddSatker) {
      onAddSatker(newSatker);
    }
    addLog('Tambah Satker Baru', 'SETTINGS', `Menambahkan satker baru "${newSatker.namaSatker}" (${newSatker.kodeSatker}).`, 'SUCCESS');
    setIsAddingSatker(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setCurrentFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (excelCategory === 'SERTIFIKASI') {
        const result = await processSertifikasiExcel(file);
        setPreviewPejabatList(result.pejabatList);
        setUploadLog(result.log);
        addLog(
          'Upload Excel Sertifikasi Pejabat',
          'UPLOAD',
          `File "${file.name}" diunggah. ${result.pejabatList.length} Pejabat Perbendaharaan dibersihkan & diproses.`,
          'SUCCESS'
        );
      } else {
        const result = await processExcelFile(file, excelCategory);
        setPreviewSatkers(result.satkers);
        if (result.satkers.length > 0 && result.satkers[0].periodeUpdate) {
          setUploadPeriode(result.satkers[0].periodeUpdate);
        }
        setUploadLog(result.log);
        addLog(
          `Upload Excel ${excelCategory === 'CAPAIAN_OUTPUT' ? 'Capaian Output' : 'IKPA'}`, 
          'UPLOAD', 
          `File "${file.name}" diunggah. ${result.satkers.length} Satker dibersihkan & diproses. Periode: ${result.satkers[0]?.periodeUpdate || 'Januari 2026'}.`, 
          'SUCCESS'
        );
      }
    } catch (err: any) {
      const errMsg = err.message || 'Gagal mengolah file Excel.';
      setErrorMessage(errMsg);
      addLog('Gagal Olah File Excel', 'UPLOAD', `Gagal mengolah file "${file.name}": ${errMsg}`, 'WARNING');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveAndApplyHistoricalUploads = (newList: ExcelUploadHistory[]) => {
    setHistoricalUploads(newList);
    try {
      localStorage.setItem('kppn_historical_uploads', JSON.stringify(newList));
    } catch (e) {
      console.error('Error saving historical uploads to localStorage:', e);
    }
    const updatedConfig: DashboardConfig = {
      ...tempConfig,
      historicalUploads: newList
    };
    setTempConfig(updatedConfig);
    onUpdateDashboardConfig(updatedConfig);
  };

  const handleApplyPejabat = () => {
    if (previewPejabatList.length === 0) return;
    if (onUpdatePejabatList) {
      onUpdatePejabatList(previewPejabatList);

      const fileNameToUse = currentFileName || `Data_Sertifikasi_Pejabat_${uploadPeriode.replace(/\s+/g, '_')}.xlsx`;
      const newHistoryItem: ExcelUploadHistory = {
        id: `hist-pejabat-${Date.now()}`,
        fileName: fileNameToUse,
        periode: uploadPeriode.trim() || 'Agustus 2026',
        uploadDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
        uploadedBy: 'Seksi MSKI KPPN Semarang I',
        satkerCount: previewPejabatList.length,
        averageIKPA: 100,
        notes: uploadNotes.trim() || 'Data Sertifikasi Pejabat Perbendaharaan PNT/SNT/PPK/PPSPM/Bendahara',
        satkersData: [],
        category: 'SERTIFIKASI',
        isActive: false
      };

      saveAndApplyHistoricalUploads([newHistoryItem, ...historicalUploads]);

      addLog(
        'Terapkan Data Sertifikasi Pejabat',
        'UPLOAD',
        `${previewPejabatList.length} data Pejabat Sertifikasi diterapkan ke sistem & disimpan ke Arsip Historical.`,
        'SUCCESS'
      );
      showToast({
        type: 'success',
        title: 'Pejabat Berhasil Diterapkan',
        message: `${previewPejabatList.length} data Pejabat Perbendaharaan telah diterapkan ke sistem.`
      });
      setPreviewPejabatList([]);
      setUploadLog(null);
      setCurrentFileName('');
    }
  };

  const handleApply = (overwriteActiveDashboard: boolean = true) => {
    if (previewSatkers.length === 0) return;

    const fileNameToUse = currentFileName || `Data_${excelCategory}_${uploadPeriode.replace(/\s+/g, '_')}.xlsx`;
    const avgIKPA = Number((previewSatkers.reduce((acc, s) => acc + s.nilaiTotalIKPA, 0) / previewSatkers.length).toFixed(2));

    let satkersToApply: SatkerIKPA[] = [];

    if (excelCategory === 'CAPAIAN_OUTPUT') {
      const previewMap = new Map<string, SatkerIKPA>(previewSatkers.map(p => [p.kodeSatker, p]));
      const hasExistingRealIKPA = (satkers || []).some(s => s.hasIKPAData !== false && (s.nilaiTotalIKPA > 0 || s.paguAnggaran > 0));

      if (hasExistingRealIKPA) {
        // We have active IKPA data. Merge Capaian Output without zeroing existing IKPA indicators
        satkersToApply = (satkers || []).map(existing => {
          const match = previewMap.get(existing.kodeSatker);
          if (match) {
            const updatedIndikator = {
              ...existing.indikator,
              capaianOutput: match.indikator.capaianOutput
            };
            
            const hasRealIKPA = existing.hasIKPAData !== false && (existing.nilaiTotalIKPA > 0 || existing.paguAnggaran > 0);
            const newTotalIKPA = hasRealIKPA ? hitungTotalIKPA(updatedIndikator) : 0;
            const newPredikat = hasRealIKPA ? getPredikatIKPA(newTotalIKPA) : 'Cukup';
            
            const newIssues = existing.issues.filter(iss => !iss.toLowerCase().includes('capaian output'));
            if (match.statusCapaianOutput === 'Belum Terlaporkan' || match.indikator.capaianOutput === 0) {
              newIssues.push('Capaian Output Belum Diselesaikan (0%)');
            } else if (match.statusCapaianOutput === 'Terlambat') {
              newIssues.push('Pengiriman Capaian Output Terlambat');
            }
            if (hasRealIKPA && newTotalIKPA < 87.5 && !newIssues.some(i => i.includes('Nilai IKPA'))) {
              newIssues.push(`Nilai IKPA (${newTotalIKPA.toFixed(2)}) Di Bawah Target KPPN (≥87.5)`);
            }

            return {
              ...existing,
              statusCapaianOutput: match.statusCapaianOutput,
              indikator: updatedIndikator,
              nilaiTotalIKPA: newTotalIKPA,
              predikat: newPredikat,
              issues: newIssues,
              hasIKPAData: hasRealIKPA,
              periodeUpdate: uploadPeriode,
              isModified: true
            };
          }
          return existing;
        });

        // Append any brand new satker from previewSatkers if not in existing
        const existingKodes = new Set((satkers || []).map(s => s.kodeSatker));
        const brandNew = previewSatkers.filter(p => !existingKodes.has(p.kodeSatker)).map(p => ({
          ...p,
          hasIKPAData: false,
          nilaiTotalIKPA: 0,
          paguAnggaran: 0,
          realisasiAnggaran: 0
        }));
        if (brandNew.length > 0) {
          satkersToApply = [...satkersToApply, ...brandNew];
        }
      } else {
        // No IKPA data in active state. Set hasIKPAData: false so Dashboard IKPA stays completely empty and isolated
        satkersToApply = previewSatkers.map(p => ({
          ...p,
          hasIKPAData: false,
          nilaiTotalIKPA: 0,
          paguAnggaran: 0,
          realisasiAnggaran: 0
        }));
      }
    } else {
      const monthsOrder = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const uploadMonthName = monthsOrder.find(m => uploadPeriode.toLowerCase().includes(m.toLowerCase())) || 'Januari';

      const formattedIKPA = previewSatkers.map(p => {
        const existing = (satkers || []).find(s => s.kodeSatker === p.kodeSatker);

        // Build new monthly history item for this uploaded month
        const newMonthEntry = {
          bulan: uploadMonthName,
          nilaiIKPA: p.nilaiTotalIKPA,
          capaianOutput: p.indikator.capaianOutput,
          deviasiHal3Dipa: p.indikator.deviasiHal3Dipa,
          penyerapanAnggaran: p.indikator.penyerapanAnggaran,
          revisiDipa: p.indikator.revisiDipa,
          belanjaKontraktual: p.indikator.belanjaKontraktual,
          penyelesaianTagihan: p.indikator.penyelesaianTagihan,
          pengelolaanUpTup: p.indikator.pengelolaanUpTup,
          dispensasiSpm: p.indikator.dispensasiSpm
        };

        // Merge existing history with the new month
        let mergedHistory = existing?.riwayatBulanan ? [...existing.riwayatBulanan] : [];
        mergedHistory = mergedHistory.filter(h => h.bulan.toLowerCase() !== uploadMonthName.toLowerCase());
        mergedHistory.push(newMonthEntry);

        // Sort chronologically Jan - Des
        mergedHistory.sort((a, b) => {
          const idxA = monthsOrder.findIndex(m => m.toLowerCase() === a.bulan.toLowerCase());
          const idxB = monthsOrder.findIndex(m => m.toLowerCase() === b.bulan.toLowerCase());
          return (idxA !== -1 ? idxA : 0) - (idxB !== -1 ? idxB : 0);
        });

        return {
          ...p,
          hasIKPAData: true,
          hasCapaianOutputData: existing ? !!existing.hasCapaianOutputData : false,
          statusCapaianOutput: (existing && existing.hasCapaianOutputData) ? existing.statusCapaianOutput : p.statusCapaianOutput,
          periodeUpdate: uploadPeriode,
          riwayatBulanan: mergedHistory,
          pejabatOperator: existing?.pejabatOperator || p.pejabatOperator,
          passwordSatker: existing?.passwordSatker || p.passwordSatker
        };
      });
      satkersToApply = appendMode ? [...formattedIKPA, ...(satkers || [])] : formattedIKPA;
    }

    const newHistoryItem: ExcelUploadHistory = {
      id: `hist-${Date.now()}`,
      fileName: fileNameToUse,
      periode: uploadPeriode.trim() || 'Agustus 2026',
      uploadDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
      uploadedBy: 'Seksi MSKI KPPN Semarang I',
      satkerCount: satkersToApply.length,
      averageIKPA: avgIKPA,
      notes: uploadNotes.trim() || `Upload data ${excelCategory === 'CAPAIAN_OUTPUT' ? 'Capaian Output SAKTI' : 'IKPA'}`,
      satkersData: satkersToApply,
      category: excelCategory,
      isActive: overwriteActiveDashboard
    };

    // Filter out existing historical upload with SAME period & SAME category to guarantee overwrite
    const normalizedPeriode = uploadPeriode.trim().toLowerCase();
    const filteredHistory = historicalUploads.filter(h => {
      const isSameCategory = (!h.category && excelCategory === 'IKPA') || h.category === excelCategory;
      const isSamePeriode = (h.periode || '').trim().toLowerCase() === normalizedPeriode;
      return !(isSameCategory && isSamePeriode);
    });

    if (overwriteActiveDashboard) {
      const targetTab: NavigationTab = excelCategory === 'CAPAIAN_OUTPUT' ? 'capaian-output' : 'dashboard';
      onApplyNewSatkers(satkersToApply, false, targetTab);
      const newHistoryList = [
        newHistoryItem,
        ...filteredHistory.map(h => {
          const isSameCat = (!h.category && excelCategory === 'IKPA') || h.category === excelCategory;
          return isSameCat ? { ...h, isActive: false } : h;
        })
      ];
      saveAndApplyHistoricalUploads(newHistoryList);
      addLog(
        'Update Data Dashboard & Arsip (Menimpa Periode Sama)', 
        'UPLOAD', 
        `${previewSatkers.length} Satker (${excelCategory}) periode "${uploadPeriode}" berhasil menimpa data lama & diperbarui ke Dashboard.`, 
        'SUCCESS'
      );
      showToast({
        type: 'success',
        title: 'Data Berhasil Diperbarui',
        message: excelCategory === 'CAPAIAN_OUTPUT'
          ? `Berhasil memperbarui data Capaian Output (${previewSatkers.length} Satker) periode "${uploadPeriode}" (menimpa periode sama).`
          : `${previewSatkers.length} data Satker IKPA periode "${uploadPeriode}" telah memperbarui Dashboard IKPA (menimpa periode sama).`
      });
    } else {
      const newHistoryList = [newHistoryItem, ...filteredHistory];
      saveAndApplyHistoricalUploads(newHistoryList);
      addLog(
        'Simpan Ke Arsip Historical (Menimpa Periode Sama)', 
        'UPLOAD', 
        `File "${fileNameToUse}" (${previewSatkers.length} Satker) periode "${uploadPeriode}" disimpan ke Arsip Historical menimpa arsip lama.`, 
        'INFO'
      );
      showToast({
        type: 'info',
        title: 'Tersimpan di Arsip',
        message: `File Excel (${excelCategory}) periode "${uploadPeriode}" tersimpan di Arsip Historical (menimpa periode sama).`
      });
    }

    setPreviewSatkers([]);
    setUploadLog(null);
    setCurrentFileName('');
  };

  const handleActivateHistorical = (item: ExcelUploadHistory) => {
    requestConfirm(
      'Aktifkan Data Periode Arsip',
      `Apakah Anda yakin ingin mengaktifkan data Excel periode "${item.periode}" (${item.fileName}) ke Dashboard?`,
      () => {
        const targetCategory = item.category || 'IKPA';
        const targetTab: NavigationTab = targetCategory === 'CAPAIAN_OUTPUT' ? 'capaian-output' : 'dashboard';

        onApplyNewSatkers(item.satkersData, false, targetTab);

        const newHistoryList = historicalUploads.map(h => {
          const isSameCat = (!h.category && targetCategory === 'IKPA') || h.category === targetCategory;
          return isSameCat ? { ...h, isActive: h.id === item.id } : h;
        });

        saveAndApplyHistoricalUploads(newHistoryList);

        const updatedConfig: DashboardConfig = {
          ...tempConfig,
          historicalUploads: newHistoryList,
          updateDates: {
            ...tempConfig.updateDates,
            ...(targetCategory === 'CAPAIAN_OUTPUT'
              ? { capaianOutput: `Periode ${item.periode}` }
              : { dashboard: `Periode ${item.periode}` })
          }
        };
        setTempConfig(updatedConfig);
        onUpdateDashboardConfig(updatedConfig);

        addLog(
          'Aktifkan Periode Dashboard (Arsip)', 
          'UPLOAD', 
          `Dashboard ditimpa/diaktifkan dengan data arsip Excel periode "${item.periode}" (${item.satkerCount} Satker).`, 
          'SUCCESS'
        );
        showToast({
          type: 'success',
          title: 'Periode Berhasil Diaktifkan',
          message: `Data periode "${item.periode}" kini aktif di Dashboard ${targetCategory === 'CAPAIAN_OUTPUT' ? 'Capaian Output' : 'IKPA'}.`
        });
      },
      { confirmText: 'Ya, Aktifkan Periode Ini', variant: 'info' }
    );
  };

  const handleDeleteHistorical = (id: string) => {
    const target = historicalUploads.find(h => h.id === id);
    const newHistoryList = historicalUploads.filter(h => h.id !== id);
    const targetCat = target?.category || 'IKPA';
    const isNowEmpty = newHistoryList.length === 0;

    requestConfirm(
      'Hapus Arsip Excel & Bersihkan Dashboard',
      `Apakah Anda yakin ingin menghapus arsip Excel periode "${target?.periode || ''}" (${target?.fileName || ''})?\n\n⚠️ Menghapus arsip ini akan otomatis membersihkan dan menyinkronkan data peserta terkait di Dashboard.`,
      () => {
        saveAndApplyHistoricalUploads(newHistoryList);

        if (isNowEmpty) {
          // Seluruh arsip kosong -> Bersihkan total data perhitungan satkers di dashboard
          if (onClearAllData) {
            onClearAllData();
          }
        } else if (targetCat === 'IKPA') {
          const remainingIKPA = newHistoryList.filter(h => !h.category || h.category === 'IKPA');
          if (remainingIKPA.length === 0) {
            // Arsip IKPA habis -> Bersihkan total IKPA dari satkers
            const clearedSatkers = satkers.map(s => ({
              ...s,
              hasIKPAData: false,
              nilaiTotalIKPA: 0,
              predikat: 'Cukup' as const,
              riwayatBulanan: [],
              paguAnggaran: 0,
              realisasiAnggaran: 0,
              persenPenyerapan: 0,
              issues: [],
              indikator: {
                capaianOutput: s.indikator?.capaianOutput || 0,
                deviasiHal3Dipa: 0,
                penyerapanAnggaran: 0,
                revisiDipa: 0,
                belanjaKontraktual: 0,
                penyelesaianTagihan: 0,
                pengelolaanUpTup: 0,
                dispensasiSpm: 0
              }
            }));
            onApplyNewSatkers(clearedSatkers, false);
          } else if (target?.isActive) {
            const nextActive = remainingIKPA[0];
            const updatedWithActive = newHistoryList.map(h => {
              if (!h.category || h.category === 'IKPA') {
                return { ...h, isActive: h.id === nextActive.id };
              }
              return h;
            });
            saveAndApplyHistoricalUploads(updatedWithActive);
            onApplyNewSatkers(nextActive.satkersData || [], false);
          }
        } else if (targetCat === 'CAPAIAN_OUTPUT') {
          const remainingCaput = newHistoryList.filter(h => h.category === 'CAPAIAN_OUTPUT');
          if (remainingCaput.length === 0) {
            // Arsip Capaian Output habis -> Bersihkan total status Capaian Output dari satkers
            const resetSatkers = satkers.map(s => ({
              ...s,
              hasCapaianOutputData: false,
              statusCapaianOutput: 'Belum Terlaporkan' as const,
              indikator: {
                ...s.indikator,
                capaianOutput: 0
              }
            }));
            onApplyNewSatkers(resetSatkers, false, 'capaian-output');
          } else if (target?.isActive) {
            const nextActive = remainingCaput[0];
            const updatedWithActive = newHistoryList.map(h => {
              if (h.category === 'CAPAIAN_OUTPUT') {
                return { ...h, isActive: h.id === nextActive.id };
              }
              return h;
            });
            saveAndApplyHistoricalUploads(updatedWithActive);
            const previewMap = new Map<string, SatkerIKPA>((nextActive.satkersData || []).map(p => [p.kodeSatker, p]));
            const updatedSatkers = satkers.map(s => {
              const match = previewMap.get(s.kodeSatker);
              if (match) {
                return {
                  ...s,
                  hasCapaianOutputData: true,
                  statusCapaianOutput: match.statusCapaianOutput,
                  indikator: {
                    ...s.indikator,
                    capaianOutput: match.indikator.capaianOutput
                  }
                };
              }
              return s;
            });
            onApplyNewSatkers(updatedSatkers, false, 'capaian-output');
          }
        } else if (targetCat === 'SERTIFIKASI') {
          const remainingSert = newHistoryList.filter(h => h.category === 'SERTIFIKASI');
          if (remainingSert.length === 0 && onUpdatePejabatList) {
            onUpdatePejabatList([]);
          }
        }
        addLog('Hapus Arsip Excel', 'UPLOAD', `Arsip Excel periode "${target?.periode}" dihapus dan data dashboard disinkronkan.`, 'INFO');
        showToast({
          type: 'info',
          title: 'Arsip Dihapus & Dashboard Dibersihkan',
          message: `Arsip Excel periode "${target?.periode}" telah dihapus dan data peserta dashboard disinkronkan.`
        });
      },
      { confirmText: 'Ya, Hapus & Bersihkan', variant: 'danger' }
    );
  };

  const handleClearAllHistory = () => {
    if (historicalUploads.length === 0 && satkers.length === 0) {
      alert('Arsip file Excel dan data Dashboard sudah 100% kosong (0 Satker & 0 Arsip).');
      return;
    }

    if (historicalUploads.length === 0 && satkers.length > 0) {
      requestConfirm(
        '⚠️ Kosongkan Data Dashboard Utama',
        `Riwayat arsip Excel sudah 0 (kosong), tetapi Dashboard Utama masih berisi ${satkers.length} Data Satker.\n\nApakah Anda yakin ingin MENGOSONGKAN seluruh ${satkers.length} Data Satker dari Dashboard Utama (IKPA, Capaian Output, & Perlu Perhatian) menjadi 0 Satker?`,
        () => {
          if (onClearAllData) {
            onClearAllData();
          }
          addLog('Kosongkan Data Dashboard', 'UPLOAD', `Seluruh ${satkers.length} data Satker aktif berhasil dikosongkan (0 Satker).`, 'WARNING');
        },
        { confirmText: `Ya, Kosongkan ${satkers.length} Data Satker`, variant: 'danger' }
      );
      return;
    }

    requestConfirm(
      '⚠️ Hapus Semua Arsip & Kosongkan Dashboard',
      `Apakah Anda yakin ingin MENGHAPUS SEMUA ${historicalUploads.length} ARSIP EXCEL sekaligus MENGOSONGKAN TOTAL DATA SATKER di Dashboard (${satkers.length} Satker)?\n\nTindakan ini akan membersihkan seluruh riwayat arsip Excel dan mengosongkan Dashboard Utama (IKPA, Capaian Output, & Perlu Perhatian) menjadi 0 Satker.`,
      () => {
        saveAndApplyHistoricalUploads([]);
        if (onClearAllData) {
          onClearAllData();
        }
        addLog('Hapus Semua Arsip & Dashboard', 'UPLOAD', 'Seluruh arsip file Excel dan data Satker aktif berhasil dibersihkan (0 Satker).', 'WARNING');
      },
      { confirmText: 'Ya, Hapus Semua Arsip & Data Dashboard', variant: 'danger' }
    );
  };

  const handleClearEverything = () => {
    if (satkers.length === 0 && historicalUploads.length === 0) {
      alert('Data Satker dan Arsip Excel sudah 100% kosong (0 Satker).');
      return;
    }

    requestConfirm(
      '⚠️ Bersihkan Total Data & Arsip (0 Satker)',
      `Apakah Anda yakin ingin MENGHAPUS TOTAL DATA SATKER (${satkers.length} Satker) DAN MENGHAPUS SEMUA ARSIP FILE EXCEL?\n\nTindakan ini akan mengosongkan dashboard secara menyeluruh (IKPA, Capaian Output, Master Satker & Perlu Perhatian) menjadi 0 Satker agar Anda dapat menguji dengan file Excel asli milik Anda.`,
      () => {
        if (onClearAllData) {
          onClearAllData();
        }
        if (onClearMasterSatkers) {
          onClearMasterSatkers();
        }
        saveAndApplyHistoricalUploads([]);
        setCustomBroadcastExcelList([]);
        addLog('Reset Total Data & Arsip', 'SETTINGS', 'Seluruh data Satker, Master Satker, dan arsip file Excel dikosongkan secara total.', 'WARNING');
      },
      { confirmText: 'Ya, Bersihkan Total (0 Satker)', variant: 'danger' }
    );
  };

  const handleRemovePreviewItem = (id: string) => {
    setPreviewSatkers(prev => prev.filter(s => s.id !== id));
  };

  // If NOT Authenticated -> Show Front-and-Center Executive Admin Login Hero Card
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-4 sm:py-8 px-3 sm:px-4 space-y-4">
        
        {/* Notice for Public Satker / Participants */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark 
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/30 text-slate-200' 
            : 'bg-gradient-to-r from-sky-50 via-indigo-50 to-sky-50 border-sky-200 text-slate-800'
        }`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-500 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] sm:text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-400/30">
                  Untuk Satuan Kerja &amp; Peserta
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Akses Publik Tanpa Login
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Halaman ini khusus <strong>Administrator KPPN Semarang I</strong>. Satuan Kerja dan Peserta kegiatan dapat langsung mengakses seluruh fitur publik tanpa perlu login:
              </p>
              
              {/* Quick Navigation Links for Satker/Peserta */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const navBtn = document.querySelector('header nav');
                    if (navBtn) window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Dashboard IKPA</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const navBtn = document.querySelector('header nav');
                    if (navBtn) window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-sky-500" />
                  <span>Capaian Output</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const navBtn = document.querySelector('header nav');
                    if (navBtn) window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ClipboardCheck className="w-3.5 h-3.5 text-teal-500" />
                  <span>Presensi Online</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Admin Authentication Card */}
        <div className={`rounded-3xl border-2 shadow-2xl overflow-hidden transition-all ${
          isDark 
            ? 'bg-slate-900 border-indigo-500/50 text-slate-100 shadow-indigo-950/50' 
            : 'bg-white border-indigo-200 text-slate-900 shadow-indigo-500/10'
        }`}>
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white relative overflow-hidden border-b border-indigo-500/30">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-500/20 border border-indigo-400/40 rounded-2xl flex items-center justify-center text-amber-400 shadow-lg shrink-0">
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5" />
                  KPPN Semarang I (026) • Admin Control Center
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                  Otentikasi Administrator
                </h2>
              </div>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
              Gunakan password pengelola untuk membuka hak akses upload Excel SAKTI mentah, broadcast WhatsApp pejabat, manajemen arsip, dan kontrol menu.
            </p>
          </div>

          {/* Form & Quick Actions Body */}
          <div className="p-5 sm:p-8 space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2 text-slate-700 dark:text-slate-300">
                  Password Administrator
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Masukkan password administrator..."
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm font-mono font-bold rounded-xl pl-11 pr-4 py-3.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-xs"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {authError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold">{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-black text-sm py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Masuk Sesi Administrator KPPN</span>
              </button>
            </form>

            {/* Feature Highlights Grid */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Fitur Eksklusif Mode Edit Admin:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Olah &amp; Bersihkan Excel SAKTI</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Pengingat WhatsApp Broadcast</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Edit Data Satker &amp; Pejabat</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Kunci/Buka Visibilitas Menu Satker</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If Authenticated -> Show Full Admin & Upload Excel Controls
  return (
    <div className="space-y-6">
      
      {/* Top Admin Workspace Command Banner (Distinct Visual Styling) */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white border-2 border-indigo-500/40 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3.5 py-1 rounded-full text-xs font-black shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              MODE EDIT ADMINISTRATOR AKTIF
            </span>
            <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-bold">
              <Building2 className="w-3.5 h-3.5" />
              KPPN SEMARANG I (026)
            </span>
            <span className="inline-flex items-center gap-1.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 px-3 py-1 rounded-full text-xs font-bold">
              <Activity className="w-3.5 h-3.5" />
              Sync Firebase Active
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Control Center &amp; Pengelolaan Data Admin
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
            Pusat kendali penuh KPPN Semarang I: Pengolahan file Excel SAKTI mentah, broadcast WhatsApp pejabat, pengelolaan riwayat arsip, penerbitan pengumuman, serta kunci visibilitas menu Satker.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={downloadExcelTemplate}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Template Excel</span>
          </button>

          <button
            onClick={handleLogout}
            className="bg-rose-950 hover:bg-rose-900 border border-rose-700/80 text-rose-200 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            title="Keluar dari Modul Admin"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Keluar Sesi Admin</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar for Admin */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-200/80 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-300 dark:border-slate-700 w-full overflow-x-auto">
        <button
          onClick={() => setAdminTab('upload')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'upload'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-sky-600" />
          <span>1. Upload Excel</span>
        </button>

        <button
          onClick={() => setAdminTab('crud')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'crud'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <Wrench className="w-4 h-4 text-emerald-600" />
          <span>2. Kelola Data Satker</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {masterSatkers.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('perhatian')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'perhatian'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200/60 ring-2 ring-rose-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>3. Satker Dalam Perhatian</span>
          <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {satkers.filter(s => s.nilaiTotalIKPA < 87.5 || s.statusCapaianOutput !== 'Sudah Terlaporkan' || s.persenPenyerapan < 75 || s.indikator.deviasiHal3Dipa < 75).length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('history')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'history'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <FolderArchive className="w-4 h-4 text-blue-600" />
          <span>4. Arsip Periode</span>
          <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {historicalUploads.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('analysis')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'analysis'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <Calculator className="w-4 h-4 text-indigo-600" />
          <span>5. Analisis &amp; Simulator IKPA</span>
        </button>

        <button
          onClick={() => setAdminTab('settings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'settings'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-teal-600" />
          <span>6. Pengaturan Dashboard</span>
        </button>

        <button
          onClick={() => setAdminTab('announcements')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'announcements'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200/60 ring-2 ring-purple-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-600" />
          <span>7. Pengumuman &amp; Pop-Up Tools</span>
          {tempConfig.slideShowConfig?.isEnabled ? (
            <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm">
              SLIDE ON
            </span>
          ) : tempConfig.popUpAnnouncement?.isEnabled ? (
            <span className="bg-emerald-500 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
              POP-UP ON
            </span>
          ) : (tempConfig.announcements?.length || 0) > 0 ? (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {tempConfig.announcements.length}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setAdminTab('materi-slide')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'materi-slide'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200/60 ring-2 ring-indigo-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <Presentation className="w-4 h-4 text-indigo-600" />
          <span>8. Kelola Materi Slide Show</span>
          <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {(tempConfig.presentationMaterials?.length || 0)}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('portal-link')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'portal-link'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200/60 ring-2 ring-emerald-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <Link2 className="w-4 h-4 text-emerald-600" />
          <span>9. Link Sosialisasi (Linktree)</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {(tempConfig.kegiatanSosialisasi?.length || 0)}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('presensi-admin')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'presensi-admin'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200/60 ring-2 ring-teal-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 text-teal-600" />
          <span>10. Presensi &amp; Rekap Kehadiran</span>
          <span className="bg-teal-100 text-teal-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {presensiPesertaList.length} Peserta
          </span>
        </button>

        <button
          onClick={() => setAdminTab('broadcast')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'broadcast'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <Send className="w-4 h-4 text-rose-600" />
          <span>11. Broadcast Masif Satker</span>
          <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            Dynamic Mail Merge
          </span>
        </button>

        <button
          onClick={() => setAdminTab('aduan')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'aduan'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200/60 ring-2 ring-rose-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>12. Kelola Aduan &amp; Tiket Satker</span>
          {(tempConfig.aduanList || []).filter(a => a.status === 'MENUNGGU').length > 0 ? (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
              {(tempConfig.aduanList || []).filter(a => a.status === 'MENUNGGU').length} Baru
            </span>
          ) : (
            <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {(tempConfig.aduanList || []).length} Tiket
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('logs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'logs'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <History className="w-4 h-4 text-purple-600" />
          <span>13. Log Admin</span>
          <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {activityLogs.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('gemini-ai')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'gemini-ai'
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 text-white shadow-lg shadow-purple-500/25 border border-purple-400/40 ring-2 ring-purple-400/30'
              : 'text-purple-600 hover:text-purple-900 hover:bg-purple-50 dark:text-purple-300 dark:hover:text-purple-100 dark:hover:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60'
          }`}
        >
          <Bot className="w-4 h-4 text-purple-400 animate-pulse shrink-0" />
          <span>14. Asisten Analis Gemini AI</span>
          <span className="bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black uppercase shadow-xs">
            ✨ AI Live
          </span>
        </button>
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={passwordFileInputRef}
        onChange={handlePasswordBatchUpload}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      <input
        type="file"
        ref={broadcastFileInputRef}
        onChange={handleBroadcastExcelUpload}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {adminTab === 'history' && (
        <div className="space-y-6">
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full text-xs font-bold mb-1">
                  <FolderArchive className="w-3.5 h-3.5" />
                  ARSIP &amp; HISTORICAL FILE EXCEL PERIODE
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  Manajemen File Excel Terunggah &amp; Beralih Periode Laporan
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Seluruh file Excel yang pernah diunggah tersimpan secara rapi berdasarkan bulan berkenaan. Anda dapat menimpa data aktif Dashboard kapan saja atau mengunduh arsip lama.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setAdminTab('upload')}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload File Excel Baru</span>
                </button>

                <button
                  onClick={handleClearAllHistory}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  title="Hapus seluruh riwayat arsip file Excel yang tersimpan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua Arsip Excel ({historicalUploads.length})</span>
                </button>

                <button
                  onClick={handleClearEverything}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  title="Bersihkan total seluruh data satker dan arsip Excel"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Bersihkan Total (0 Satker)</span>
                </button>
              </div>
            </div>

            {/* KPI Stat Cards for History */}
            {satkers.length > 0 && historicalUploads.length === 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-500/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shrink-0 font-bold">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-900 dark:text-amber-200">
                      Riwayat Arsip Excel Kosong (0 File), Namun Dashboard Masih Berisi {satkers.length} Data Satker
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                      Data {satkers.length} Satker di Dashboard Utama (IKPA, Capaian Output, &amp; Perlu Perhatian) masih aktif. Klik tombol di kanan jika Anda ingin mengosongkannya menjadi 0 Satker.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    requestConfirm(
                      'Kosongkan Seluruh Satker',
                      `Apakah Anda yakin ingin mengosongkan seluruh data Satker (${satkers.length} Satker) dari Dashboard Utama?`,
                      () => {
                        if (onClearAllData) onClearAllData();
                        addLog('Kosongkan Data Satker', 'SETTINGS', 'Seluruh data satker aktif berhasil dikosongkan.', 'WARNING');
                      },
                      { confirmText: 'Ya, Kosongkan Satker', variant: 'danger' }
                    );
                  }}
                  className="shrink-0 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Kosongkan {satkers.length} Satker Sekarang</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-blue-50/50 border-blue-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total File Tersimpan</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">{historicalUploads.length} File Excel</span>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-emerald-50/50 border-emerald-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Periode Aktif Dashboard</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 block truncate">
                  {historicalUploads.find(h => h.isActive)?.periode || 'Agustus 2026'}
                </span>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-purple-50/50 border-purple-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Satker Periode Aktif</span>
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
                  {historicalUploads.find(h => h.isActive)?.satkerCount || currentSatkerCount} Satker
                </span>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-50/50 border-amber-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Rata-Rata IKPA Aktif</span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                  {historicalUploads.find(h => h.isActive)?.averageIKPA || '93.45'}
                </span>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setHistoryCategoryFilter('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  historyCategoryFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md ring-2 ring-slate-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <FolderArchive className="w-4 h-4" />
                <span>Semua Excel ({historicalUploads.length})</span>
              </button>

              <button
                onClick={() => setHistoryCategoryFilter('IKPA')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  historyCategoryFilter === 'IKPA'
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>📊 Excel IKPA ({historicalUploads.filter(h => !h.category || h.category === 'IKPA').length})</span>
              </button>

              <button
                onClick={() => setHistoryCategoryFilter('CAPAIAN_OUTPUT')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  historyCategoryFilter === 'CAPAIAN_OUTPUT'
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>⚡ Capaian Output ({historicalUploads.filter(h => h.category === 'CAPAIAN_OUTPUT').length})</span>
              </button>

              <button
                onClick={() => setHistoryCategoryFilter('SERTIFIKASI')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  historyCategoryFilter === 'SERTIFIKASI'
                    ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>📜 Pejabat Perbendaharaan ({historicalUploads.filter(h => h.category === 'SERTIFIKASI').length})</span>
              </button>
            </div>

            {/* Search Filter for History */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari arsip berdasarkan nama file, bulan/periode (misal: Juli 2026), atau catatan..."
                value={searchHistoryQuery}
                onChange={(e) => setSearchHistoryQuery(e.target.value)}
                className={`w-full text-xs rounded-xl pl-10 pr-4 py-2.5 border transition-all ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-blue-500'
                }`}
              />
            </div>

            {/* List of Historical Excel Files */}
            <div className="space-y-3 pt-1">
              {historicalUploads.filter(h => {
                // Category Filter
                if (historyCategoryFilter === 'IKPA' && (h.category && h.category !== 'IKPA')) return false;
                if (historyCategoryFilter === 'CAPAIAN_OUTPUT' && h.category !== 'CAPAIAN_OUTPUT') return false;
                if (historyCategoryFilter === 'SERTIFIKASI' && h.category !== 'SERTIFIKASI') return false;

                // Search Query
                if (!searchHistoryQuery.trim()) return true;
                const q = searchHistoryQuery.toLowerCase();
                return (
                  h.fileName.toLowerCase().includes(q) ||
                  h.periode.toLowerCase().includes(q) ||
                  (h.notes && h.notes.toLowerCase().includes(q)) ||
                  (h.category && h.category.toLowerCase().includes(q))
                );
              }).length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <FolderArchive className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak Ada Arsip Excel Ditemukan</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    {historicalUploads.length === 0
                      ? 'Seluruh arsip data Excel telah dihapus. Anda dapat mengunggah file Excel baru melalui tab "Upload Excel SAKTI".'
                      : 'Tidak ada arsip Excel yang cocok dengan kata kunci atau kategori yang Anda pilih.'}
                  </p>
                  {(searchHistoryQuery || historyCategoryFilter !== 'ALL') && (
                    <button
                      onClick={() => {
                        setSearchHistoryQuery('');
                        setHistoryCategoryFilter('ALL');
                      }}
                      className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      Reset Filter &amp; Pencarian
                    </button>
                  )}
                </div>
              ) : (
                historicalUploads
                  .filter(h => {
                    if (historyCategoryFilter === 'IKPA' && (h.category && h.category !== 'IKPA')) return false;
                    if (historyCategoryFilter === 'CAPAIAN_OUTPUT' && h.category !== 'CAPAIAN_OUTPUT') return false;
                    if (historyCategoryFilter === 'SERTIFIKASI' && h.category !== 'SERTIFIKASI') return false;

                    if (!searchHistoryQuery.trim()) return true;
                    const q = searchHistoryQuery.toLowerCase();
                    return (
                      h.fileName.toLowerCase().includes(q) ||
                      h.periode.toLowerCase().includes(q) ||
                      (h.notes && h.notes.toLowerCase().includes(q)) ||
                      (h.category && h.category.toLowerCase().includes(q))
                    );
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        item.isActive
                          ? isDark ? 'bg-emerald-950/30 border-emerald-500/50 ring-1 ring-emerald-500/30' : 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/50'
                          : isDark ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700' : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        {/* Left Details */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Category Badge */}
                            {item.category === 'CAPAIAN_OUTPUT' ? (
                              <span className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs border border-amber-400">
                                <Zap className="w-3.5 h-3.5" />
                                ⚡ EXCEL CAPAIAN OUTPUT
                              </span>
                            ) : item.category === 'SERTIFIKASI' ? (
                              <span className="bg-emerald-600 text-white font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs border border-emerald-500">
                                <Award className="w-3.5 h-3.5" />
                                📜 PEJABAT PERBENDAHARAAN
                              </span>
                            ) : (
                              <span className="bg-blue-600 text-white font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs border border-blue-500">
                                <BarChart3 className="w-3.5 h-3.5" />
                                📊 EXCEL IKPA (8 INDIKATOR)
                              </span>
                            )}

                            <span className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs px-3 py-1 rounded-full">
                              📅 Periode: {item.periode}
                            </span>

                            {item.isActive ? (
                              <span className="bg-emerald-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                DATA AKTIF DASHBOARD UTAMA
                              </span>
                            ) : (
                              <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <FolderArchive className="w-3.5 h-3.5 text-slate-500" />
                                Arsip Historical
                              </span>
                            )}

                            <span className="text-slate-400 text-xs font-mono flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {item.uploadDate}
                            </span>
                          </div>

                          <h4 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{item.fileName}</span>
                          </h4>

                          <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                            "{item.notes || 'Tidak ada catatan tambahan'}"
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">
                            <span>Jumlah Record: <strong className="text-slate-900 dark:text-slate-100">{item.satkerCount} Record/Satker</strong></span>
                            <span>•</span>
                            <span>Rata-Rata IKPA: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{item.averageIKPA}</strong></span>
                            <span>•</span>
                            <span>Pengunggah: <strong className="text-slate-800 dark:text-slate-200">{item.uploadedBy}</strong></span>
                          </div>
                        </div>

                        {/* Right Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
                          {!item.isActive && item.satkersData && item.satkersData.length > 0 && (
                            <button
                              onClick={() => handleActivateHistorical(item)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                              title="Timpa data dashboard utama dengan dataset periode ini"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Nimpa Data Dashboard</span>
                            </button>
                          )}

                          {item.isActive && (
                            <div className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-extrabold px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span>Sedang Digunakan</span>
                            </div>
                          )}

                          {item.satkersData && item.satkersData.length > 0 && (
                            <button
                              onClick={() => {
                                setViewingHistoryDetail(item);
                                setSearchDetailQuery('');
                              }}
                              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Lihat daftar satker di file arsip ini"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-500" />
                              <span>Rincian</span>
                            </button>
                          )}

                          {item.satkersData && item.satkersData.length > 0 && (
                            <button
                              onClick={() => exportSatkersToExcel(item.satkersData, item.fileName)}
                              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Unduh file Excel periode ini"
                            >
                              <Download className="w-3.5 h-3.5 text-sky-500" />
                              <span>Unduh</span>
                            </button>
                          )}

                          {!item.isActive && (
                            <button
                              onClick={() => handleDeleteHistorical(item.id)}
                              className="bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900 border border-rose-300 dark:border-rose-800 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                              title="Hapus arsip ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* Viewing Historical Detail Modal */}
      {viewingHistoryDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in`}>
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-blue-600 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">
                    Periode: {viewingHistoryDetail.periode}
                  </span>
                  {viewingHistoryDetail.isActive && (
                    <span className="bg-emerald-500 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">
                      Aktif Di Dashboard
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <span>Rincian Satker: {viewingHistoryDetail.fileName}</span>
                </h3>
              </div>

              <button
                onClick={() => setViewingHistoryDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari satker dalam arsip ini (kode atau nama)..."
                  value={searchDetailQuery}
                  onChange={(e) => setSearchDetailQuery(e.target.value)}
                  className={`w-full text-xs rounded-xl pl-10 pr-4 py-2 border transition-all ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>
            </div>

            {/* Modal Table Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Kode &amp; Nama Satker</th>
                    <th className="py-2.5 px-3">Realisasi / Pagu</th>
                    <th className="py-2.5 px-3">Capaian Output</th>
                    <th className="py-2.5 px-3">Total IKPA</th>
                    <th className="py-2.5 px-3">Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {viewingHistoryDetail.satkersData
                    .filter(s => {
                      if (!searchDetailQuery.trim()) return true;
                      const q = searchDetailQuery.toLowerCase();
                      return s.namaSatker.toLowerCase().includes(q) || s.kodeSatker.includes(q);
                    })
                    .map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{s.namaSatker}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Kode: {s.kodeSatker}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <div>Rp {s.realisasiAnggaran.toLocaleString('id-ID')}</div>
                          <div className="text-[10px] text-slate-400">Pagu: Rp {s.paguAnggaran.toLocaleString('id-ID')}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.statusCapaianOutput === 'Sudah Terlaporkan' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {s.statusCapaianOutput} ({s.indikator.capaianOutput}%)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-black text-sm text-slate-900 dark:text-slate-100">
                          {s.nilaiTotalIKPA}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300">
                          {s.predikat}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <button
                onClick={() => exportSatkersToExcel(viewingHistoryDetail.satkersData, viewingHistoryDetail.fileName)}
                className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-sky-500" />
                <span>Unduh File Excel Ini</span>
              </button>

              <div className="flex items-center gap-2">
                {!viewingHistoryDetail.isActive && (
                  <button
                    onClick={() => {
                      handleActivateHistorical(viewingHistoryDetail);
                      setViewingHistoryDetail(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Nimpa Data Dashboard Utama</span>
                  </button>
                )}

                <button
                  onClick={() => setViewingHistoryDetail(null)}
                  className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {adminTab === 'settings' && (
        <div className="space-y-6">
          {/* Section: Theme, Colors & Tab Alignment Settings */}
          <ThemeSettingsSection
            dashboardConfig={dashboardConfig}
            onUpdateDashboardConfig={(newConfig) => {
              if (onUpdateDashboardConfig) {
                onUpdateDashboardConfig(newConfig);
              }
            }}
            addToast={addToast}
            isDark={isDark}
          />

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold mb-1">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  KONFIGURASI Halaman Depan Dashboard Publik
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Atur Filter Default & Content Dashboard Sesuai Kebutuhan Admin
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  Ubah tampilan bawaan saat siapapun membuka Dashboard, misalnya langsung menampilkan daftar Satker yang belum upload Capaian Output.
                </p>
              </div>
            </div>

          {configSaveSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-3 animate-fade-in shadow-xs">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Pengaturan Tampilan Dashboard berhasil disimpan! Pengunjung publik akan langsung melihat tampilan sesuai konfigurasi Admin terbaru.</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-6">
            
            {/* Setting 1: Default Filter */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-600" />
                Daftar Satker yang Ditampilkan Secara Default di Halaman Depan:
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                <label className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  tempConfig.defaultFilter === 'BELUM_OUTPUT'
                    ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="defaultFilter"
                    value="BELUM_OUTPUT"
                    checked={tempConfig.defaultFilter === 'BELUM_OUTPUT'}
                    onChange={() => setTempConfig(prev => ({ ...prev, defaultFilter: 'BELUM_OUTPUT' }))}
                    className="mt-1 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-extrabold text-xs text-rose-900 block">
                      🔴 Hanya Satker Belum / 0% Upload Capaian Output (Rekomendasi)
                    </span>
                    <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                      Langsung memfokuskan daftar Satker yang belum mengirimkan data SAKTI / % upload 0 agar cepat teridentifikasi.
                    </span>
                  </div>
                </label>

                <label className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  tempConfig.defaultFilter === 'SUDAH_OUTPUT'
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="defaultFilter"
                    value="SUDAH_OUTPUT"
                    checked={tempConfig.defaultFilter === 'SUDAH_OUTPUT'}
                    onChange={() => setTempConfig(prev => ({ ...prev, defaultFilter: 'SUDAH_OUTPUT' }))}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-extrabold text-xs text-emerald-900 block">
                      🟢 Hanya Satker Sudah Kirim Capaian Output (&gt;0% Progress)
                    </span>
                    <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                      Menampilkan Satker yang sudah tertib menyampaikan data laporan output.
                    </span>
                  </div>
                </label>

                <label className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  tempConfig.defaultFilter === 'IKPA_KURANG'
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="defaultFilter"
                    value="IKPA_KURANG"
                    checked={tempConfig.defaultFilter === 'IKPA_KURANG'}
                    onChange={() => setTempConfig(prev => ({ ...prev, defaultFilter: 'IKPA_KURANG' }))}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-extrabold text-xs text-amber-900 block">
                      ⚠️ Hanya Satker Nilai IKPA Kurang (&lt;87.50)
                    </span>
                    <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                      Menampilkan Satker bermasalah dengan total nilai akumulasi IKPA di bawah target nasional.
                    </span>
                  </div>
                </label>

                <label className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  tempConfig.defaultFilter === 'ALL'
                    ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="defaultFilter"
                    value="ALL"
                    checked={tempConfig.defaultFilter === 'ALL'}
                    onChange={() => setTempConfig(prev => ({ ...prev, defaultFilter: 'ALL' }))}
                    className="mt-1 text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">
                      🌐 Tampilkan Semua Satker (Seluruh Mitra KPPN)
                    </span>
                    <span className="text-[11px] text-slate-600 mt-0.5 block leading-relaxed">
                      Tampilan standar umum tanpa menyaring kondisi khusus awal.
                    </span>
                  </div>
                </label>

              </div>
            </div>

            {/* Setting 2: Custom Announcement Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-emerald-600" />
                Teks Banner Pengumuman Resmi KPPN (Headline Banner):
              </label>
              <textarea
                rows={2}
                value={tempConfig.customAnnouncement}
                onChange={(e) => setTempConfig(prev => ({ ...prev, customAnnouncement: e.target.value }))}
                placeholder="Masukkan pesan pengumuman/peringatan resmi untuk Satker..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <p className="text-[11px] text-slate-500">
                Pesan ini akan langsung terlihat mencolok di bagian atas halaman utama Dashboard oleh seluruh pengunjung.
              </p>
            </div>

            {/* Setting 3: Atur Urutan & Visibilitas Menu Navigasi Dashboard */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">
                    <SlidersHorizontal className="w-3 h-3" />
                    KUSTOMISASI NAVIGASI UTAMA
                  </div>
                  <label className="block text-sm font-black text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    Atur Urutan &amp; Visibilitas Menu Navigasi Dashboard
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5 max-w-2xl">
                    Sesuaikan tata letak dan urutan tab menu navigasi di header sesuai prioritas satker KPPN Semarang I. Gunakan tombol panah untuk memindahkan posisi tab ke atas/bawah, dan aktifkan/kunci menu untuk mengarahkan fokus pengguna.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const defaultOrder: NavigationTab[] = [
                        'dashboard',
                        'capaian-output',
                        'pengelolaan-up',
                        'transaksi-kkp',
                        'transaksi-digipay',
                        'kelola-satker',
                        'sertifikasi',
                        'per5-analisis',
                        'announcements',
                        'materi-slide',
                        'portal-link',
                        'pengetahuan',
                        'aduan',
                        'presensi'
                      ];
                      setTempConfig(prev => ({
                        ...prev,
                        tabOrder: defaultOrder
                      }));
                      addToast('Urutan menu berhasil dikembalikan ke standar KPPN!', 'info');
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset Urutan Standar</span>
                  </button>
                </div>
              </div>

              {/* Live Mini Preview Bar */}
              <div className="bg-slate-900 rounded-xl p-3 text-white border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Eye className="w-3 h-3" />
                    Preview Tampilan Bar Navigasi Satker:
                  </span>
                  <span>
                    {(tempConfig.tabOrder || [
                      'dashboard',
                      'capaian-output',
                      'pengelolaan-up',
                      'transaksi-kkp',
                      'transaksi-digipay',
                      'kelola-satker',
                      'sertifikasi',
                      'per5-analisis',
                      'announcements',
                      'materi-slide',
                      'portal-link',
                      'pengetahuan',
                      'aduan',
                      'presensi'
                    ]).filter(k => k !== 'guide' && tempConfig.menuVisibility?.[k as keyof MenuVisibilityConfig] !== false).length} Menu Aktif
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {(() => {
                    const navLabels: Record<string, string> = {
                      'dashboard': 'Dashboard IKPA',
                      'capaian-output': 'Capaian Output',
                      'pengelolaan-up': 'Pengelolaan UP',
                      'transaksi-kkp': 'Transaksi KKP',
                      'transaksi-digipay': 'Digipay',
                      'kelola-satker': 'Kelola Satker',
                      'sertifikasi': 'Sertifikasi',
                      'per5-analisis': 'PER-5 PB 2024',
                      'announcements': 'Pengumuman',
                      'materi-slide': 'Materi Slide',
                      'portal-link': 'Link Sosialisasi',
                      'pengetahuan': 'Juknis SAKTI',
                      'aduan': 'Lapor Aduan',
                      'presensi': 'Presensi Online'
                    };

                    const order = (tempConfig.tabOrder || [
                      'dashboard',
                      'capaian-output',
                      'pengelolaan-up',
                      'transaksi-kkp',
                      'transaksi-digipay',
                      'kelola-satker',
                      'sertifikasi',
                      'per5-analisis',
                      'announcements',
                      'materi-slide',
                      'portal-link',
                      'pengetahuan',
                      'aduan',
                      'presensi'
                    ]).filter(k => k !== 'guide');

                    return order.map((key, idx) => {
                      const isVisible = tempConfig.menuVisibility?.[key as keyof MenuVisibilityConfig] !== false;
                      return (
                        <div
                          key={key}
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                            isVisible
                              ? 'bg-slate-800 text-emerald-300 border-slate-700'
                              : 'bg-rose-950/40 text-rose-400 border-rose-800/60 line-through opacity-50'
                          }`}
                        >
                          <span className="text-[9px] text-slate-500 font-mono">#{idx + 1}</span>
                          <span>{navLabels[key] || key}</span>
                          {!isVisible && <Lock className="w-2.5 h-2.5 text-rose-400 ml-0.5 shrink-0" />}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Tab Reordering and Visibility Control List */}
              <div className="space-y-2">
                {(() => {
                  const menuMeta: Record<string, { label: string; desc: string; category: string; badgeColor: string }> = {
                    'dashboard': { label: 'Dashboard Utama IKPA', desc: 'Overview Rekapitulasi & Peringkat IKPA Satker', category: 'Utama', badgeColor: 'bg-emerald-100 text-emerald-800' },
                    'capaian-output': { label: 'Capaian Output SAKTI', desc: 'Laporan % progress upload konfirmasi output', category: 'Prioritas', badgeColor: 'bg-sky-100 text-sky-800' },
                    'pengelolaan-up': { label: 'Pengelolaan UP/TUP & GUP', desc: 'Monitoring Pagu, Revolving & Batas 30 Hari UP', category: 'Kas & UP', badgeColor: 'bg-indigo-100 text-indigo-800' },
                    'transaksi-kkp': { label: 'Transaksi KKP / GUP KKP', desc: 'Monitoring Transaksi & Frekuensi KKP Bank', category: 'Kas & UP', badgeColor: 'bg-amber-100 text-amber-800' },
                    'transaksi-digipay': { label: 'Transaksi Digipay (VA & KKP)', desc: 'Monitoring Transaksi Marketplace Digipay Satu', category: 'Digitalisasi', badgeColor: 'bg-purple-100 text-purple-800' },
                    'kelola-satker': { label: 'Kelola Data Satker (Master)', desc: 'Pusat Master Satker & Database Kontak Pejabat', category: 'Database', badgeColor: 'bg-blue-100 text-blue-800' },
                    'sertifikasi': { label: 'Sertifikasi Pejabat', desc: 'Status PTP / PPK / PPSPM Satker', category: 'Pejabat', badgeColor: 'bg-amber-100 text-amber-800' },
                    'per5-analisis': { label: 'Analisis PER-5/PB/2024', desc: 'Simulasi proyeksi nilai IKPA & regulasi', category: 'Analisis', badgeColor: 'bg-emerald-100 text-emerald-800' },
                    'announcements': { label: 'Pengumuman & Surat', desc: 'Surat Edaran & pengumuman resmi KPPN', category: 'Informasi', badgeColor: 'bg-amber-100 text-amber-800' },
                    'materi-slide': { label: 'Materi Slide Presentation', desc: 'Galeri PowerPoint & Slide Show (No Download)', category: 'Materi', badgeColor: 'bg-indigo-100 text-indigo-800' },
                    'portal-link': { label: 'Link Sosialisasi', desc: 'Portal Link Sosialisasi, Zoom & Materi', category: 'Sosialisasi', badgeColor: 'bg-teal-100 text-teal-800' },
                    'pengetahuan': { label: 'Pengetahuan & Juknis', desc: 'Pusat Juknis & Regulasi SAKTI', category: 'Edukasi', badgeColor: 'bg-cyan-100 text-cyan-800' },
                    'aduan': { label: 'Lapor Aduan Satker', desc: 'Kanal Layanan & Tiket Aduan Satker', category: 'Layanan', badgeColor: 'bg-rose-100 text-rose-800' },
                    'presensi': { label: 'Presensi Online', desc: 'Daftar Hadir Online Peserta Sosialisasi', category: 'Layanan', badgeColor: 'bg-teal-100 text-teal-800' }
                  };

                  const defaultTabKeys: NavigationTab[] = [
                    'dashboard',
                    'capaian-output',
                    'pengelolaan-up',
                    'transaksi-kkp',
                    'transaksi-digipay',
                    'kelola-satker',
                    'sertifikasi',
                    'per5-analisis',
                    'announcements',
                    'materi-slide',
                    'portal-link',
                    'pengetahuan',
                    'aduan',
                    'presensi'
                  ];

                  // Build unified order without guide
                  const currentKeys = (tempConfig.tabOrder || defaultTabKeys).filter(k => k !== 'guide' && menuMeta[k]);
                  defaultTabKeys.forEach(k => {
                    if (!currentKeys.includes(k) && menuMeta[k]) currentKeys.push(k);
                  });

                  const moveTabItem = (index: number, direction: 'up' | 'down' | 'top' | 'bottom') => {
                    const list = [...currentKeys];
                    if (direction === 'up' && index > 0) {
                      const temp = list[index - 1];
                      list[index - 1] = list[index];
                      list[index] = temp;
                    } else if (direction === 'down' && index < list.length - 1) {
                      const temp = list[index + 1];
                      list[index + 1] = list[index];
                      list[index] = temp;
                    } else if (direction === 'top' && index > 0) {
                      const [item] = list.splice(index, 1);
                      list.unshift(item);
                    } else if (direction === 'bottom' && index < list.length - 1) {
                      const [item] = list.splice(index, 1);
                      list.push(item);
                    }
                    setTempConfig(prev => ({ ...prev, tabOrder: list }));
                  };

                  return currentKeys.map((menuKey, index) => {
                    const meta = menuMeta[menuKey];
                    if (!meta) return null;
                    const isVisible = tempConfig.menuVisibility?.[menuKey as keyof MenuVisibilityConfig] ?? true;

                    return (
                      <div
                        key={menuKey}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isVisible
                            ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                            : 'bg-rose-50/60 border-rose-200 shadow-2xs'
                        }`}
                      >
                        {/* Order Number & Tab Details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="w-7 h-7 rounded-lg bg-slate-900 text-amber-300 font-mono font-black text-xs flex items-center justify-center shadow-xs">
                              #{index + 1}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                {!isVisible && <Lock className="w-3.5 h-3.5 text-rose-600 inline shrink-0" />}
                                {meta.label}
                              </span>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${meta.badgeColor}`}>
                                {meta.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {meta.desc}
                            </p>
                          </div>
                        </div>

                        {/* Control Buttons (Reorder + Visibility Toggle) */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          {/* Move to Top */}
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveTabItem(index, 'top')}
                            title="Pindahkan ke Posisi Teratas"
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                              index === 0
                                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                                : 'bg-white hover:bg-indigo-50 text-indigo-700 border-slate-200 hover:border-indigo-300 cursor-pointer shadow-2xs'
                            }`}
                          >
                            <ArrowUpToLine className="w-3.5 h-3.5" />
                          </button>

                          {/* Move Up */}
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveTabItem(index, 'up')}
                            title="Naikkan 1 Posisi"
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                              index === 0
                                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 cursor-pointer shadow-2xs'
                            }`}
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            disabled={index === currentKeys.length - 1}
                            onClick={() => moveTabItem(index, 'down')}
                            title="Turunkan 1 Posisi"
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                              index === currentKeys.length - 1
                                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 cursor-pointer shadow-2xs'
                            }`}
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Move to Bottom */}
                          <button
                            type="button"
                            disabled={index === currentKeys.length - 1}
                            onClick={() => moveTabItem(index, 'bottom')}
                            title="Pindahkan ke Posisi Terbawah"
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                              index === currentKeys.length - 1
                                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                                : 'bg-white hover:bg-indigo-50 text-indigo-700 border-slate-200 hover:border-indigo-300 cursor-pointer shadow-2xs'
                            }`}
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                          </button>

                          {/* Visibility Toggle Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setTempConfig(prev => {
                                const currVis = prev.menuVisibility || {
                                  'dashboard': true,
                                  'capaian-output': true,
                                  'pengelolaan-up': true,
                                  'transaksi-kkp': true,
                                  'transaksi-digipay': true,
                                  'kelola-satker': true,
                                  'redflags': true,
                                  'sertifikasi': true,
                                  'per5-analisis': true,
                                  'pengetahuan': true,
                                  'announcements': true,
                                  'materi-slide': true,
                                  'portal-link': true,
                                  'presensi': true,
                                  'aduan': true,
                                  'reminder': true,
                                  'guide': false
                                };
                                return {
                                  ...prev,
                                  menuVisibility: {
                                    ...currVis,
                                    [menuKey]: !isVisible
                                  }
                                };
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border flex items-center gap-1.5 shadow-2xs ml-1.5 ${
                              isVisible
                                ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-500'
                                : 'bg-rose-600 text-white border-rose-700 hover:bg-rose-500'
                            }`}
                          >
                            {isVisible ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Aktif</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                <span>Terkunci</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Setting 3.5: Edit Nomor CS / Helpdesk WhatsApp & Jam Layanan */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  Atur Nomor CS / Helpdesk WhatsApp &amp; Jam Layanan KPPN Semarang I:
                </label>
                <p className="text-[11px] text-emerald-800/80 mt-1">
                  Ubah nomor kontak WhatsApp Helpdesk dan jam operasional yang tampil di Kanal Lapor Aduan Satker.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Helpdesk / CS KPPN:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={tempConfig.helpdeskPhone || '081234567890'}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, helpdeskPhone: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jam Operasional / Jam Layanan Helpdesk:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Senin - Jumat (08:00 - 16:00 WIB)"
                    value={tempConfig.helpdeskJamLayanan || 'Senin - Jumat (08:00 - 16:00 WIB)'}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, helpdeskJamLayanan: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Setting 4: Tanggal / Periode Update Tiap Dashboard */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  Atur Tanggal / Periode Update Data Tiap Dashboard:
                </label>
                <p className="text-[11px] text-slate-500 mt-1">
                  Keterangan tanggal update ini akan ditampilkan di header masing-masing dashboard agar Satker mengetahui waktu terakhir data diperbarui oleh Admin KPPN.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Dashboard IKPA Utama */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    1. Tanggal Update Dashboard IKPA Utama
                  </label>
                  <input
                    type="text"
                    value={tempConfig.updateDates?.dashboard || '07 Agustus 2026 - 09:00 WIB'}
                    onChange={(e) => setTempConfig(prev => ({
                      ...prev,
                      updateDates: { ...prev.updateDates, dashboard: e.target.value }
                    }))}
                    placeholder="Contoh: 07 Agustus 2026 - 09:00 WIB"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* 2. Dashboard Capaian Output */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    2. Tanggal / Periode Capaian Output SAKTI
                  </label>
                  <input
                    type="text"
                    value={tempConfig.updateDates?.capaianOutput || 'Periode Juli 2026 (Diperbarui 07 Aug 2026)'}
                    onChange={(e) => setTempConfig(prev => ({
                      ...prev,
                      updateDates: { ...prev.updateDates, capaianOutput: e.target.value }
                    }))}
                    placeholder="Contoh: Periode Juli 2026 (Diperbarui 07 Aug 2026)"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* 3. Sertifikasi Pejabat */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    3. Tanggal Sertifikasi Pejabat Perbendaharaan
                  </label>
                  <input
                    type="text"
                    value={tempConfig.updateDates?.sertifikasi || '07 Agustus 2026 jam 13:45 WIB'}
                    onChange={(e) => setTempConfig(prev => ({
                      ...prev,
                      updateDates: { ...prev.updateDates, sertifikasi: e.target.value }
                    }))}
                    placeholder="Contoh: 07 Agustus 2026 jam 13:45 WIB"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* 4. Warning / Red Flags */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    4. Tanggal Update Dashboard Warning & Red Flags
                  </label>
                  <input
                    type="text"
                    value={tempConfig.updateDates?.redflags || '07 Agustus 2026 - 09:00 WIB'}
                    onChange={(e) => setTempConfig(prev => ({
                      ...prev,
                      updateDates: { ...prev.updateDates, redflags: e.target.value }
                    }))}
                    placeholder="Contoh: 07 Agustus 2026 - 09:00 WIB"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* 5. Analisis PER-5 */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    5. Tanggal Update Dashboard Analisis PER-5/PB/2024
                  </label>
                  <input
                    type="text"
                    value={tempConfig.updateDates?.per5Analisis || '07 Agustus 2026'}
                    onChange={(e) => setTempConfig(prev => ({
                      ...prev,
                      updateDates: { ...prev.updateDates, per5Analisis: e.target.value }
                    }))}
                    placeholder="Contoh: 07 Agustus 2026"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* 6. Dashboard Pengelolaan UP & TUP */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    6. Tanggal Update Dashboard Batas Waktu UP &amp; TUP
                  </label>
                  <input
                    type="text"
                    value={tempConfig.updateDates?.pengelolaanUp || '07 Agustus 2026 - 09:00 WIB'}
                    onChange={(e) => setTempConfig(prev => ({
                      ...prev,
                      updateDates: { ...prev.updateDates, pengelolaanUp: e.target.value }
                    }))}
                    placeholder="Contoh: 07 Agustus 2026 - 09:00 WIB"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* 7. Dashboard Transaksi KKP */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    7. Tanggal Update Dashboard Transaksi KKP (GUP)
                  </label>
                  <input
                    type="text"
                    value={tempConfig.updateDates?.transaksiKkp || '07 Agustus 2026 - 09:00 WIB'}
                    onChange={(e) => setTempConfig(prev => ({
                      ...prev,
                      updateDates: { ...prev.updateDates, transaksiKkp: e.target.value }
                    }))}
                    placeholder="Contoh: 07 Agustus 2026 - 09:00 WIB"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* 8. Dashboard Transaksi Digipay */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    8. Tanggal Update Dashboard Transaksi Digipay (VA &amp; KKP)
                  </label>
                  <input
                    type="text"
                    value={tempConfig.updateDates?.transaksiDigipay || '07 Agustus 2026 - 09:00 WIB'}
                    onChange={(e) => setTempConfig(prev => ({
                      ...prev,
                      updateDates: { ...prev.updateDates, transaksiDigipay: e.target.value }
                    }))}
                    placeholder="Contoh: 07 Agustus 2026 - 09:00 WIB"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Setting 5: Pengaturan Kata-kata / Judul & Subtitle Tiap Dashboard */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Atur Custom Judul, Badge &amp; Deskripsi Tiap Dashboard:
                </label>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ubah teks header, badge status, judul utama, dan kalimat deskripsi penjelas pada seluruh dashboard sesuai dengan kebutuhan KPPN.
                </p>
              </div>

              <div className="space-y-6">
                {/* 1. Dashboard IKPA Utama */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    1. Dashboard IKPA Utama
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.dashboardBadge || 'Sistem Pembina Keuangan & Monitoring IKPA KPPN Semarang I'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, dashboardBadge: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Utama (Title)</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.dashboardTitle || 'Monitoring Real-Time IKPA Satker Lingkup KPPN Semarang I'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, dashboardTitle: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Deskripsi / Subtitle</label>
                    <textarea
                      rows={2}
                      value={tempConfig.customTexts?.dashboardSubtitle || 'Sistem pembina keuangan digital untuk pemantauan 8 indikator IKPA, deteksi dini deviasi Halaman III DIPA, dan percepatan penyelesaian laporan Capaian Output SAKTI.'}
                      onChange={(e) => setTempConfig(prev => ({
                        ...prev,
                        customTexts: { ...prev.customTexts, dashboardSubtitle: e.target.value }
                      }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none"
                    />
                  </div>
                </div>

                {/* 2. Dashboard Capaian Output */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="inline-block bg-sky-100 text-sky-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    2. Dashboard Capaian Output SAKTI
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.capaianOutputBadge || 'Monitoring SAKTI Real-Time • KPPN Semarang I (026)'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, capaianOutputBadge: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Utama (Title)</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.capaianOutputTitle || 'Dashboard Khusus Capaian Output SAKTI'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, capaianOutputTitle: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Deskripsi / Subtitle</label>
                    <textarea
                      rows={2}
                      value={tempConfig.customTexts?.capaianOutputSubtitle || 'Fokus pengawasan pengiriman & konfirmasi data Capaian Output bulan berjalan. Mencegah penurunan skor IKPA akibat keterlambatan atau data 0%.'}
                      onChange={(e) => setTempConfig(prev => ({
                        ...prev,
                        customTexts: { ...prev.customTexts, capaianOutputSubtitle: e.target.value }
                      }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none"
                    />
                  </div>
                </div>

                {/* 3. Warning & Red Flags */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="inline-block bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    3. Dashboard Warning &amp; Red Flags
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.redflagsBadge || 'EVALUASI PERHATIAN KHUSUS KPPN SEMARANG I'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, redflagsBadge: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Utama (Title)</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.redflagsTitle || 'Satker Berisiko Menurunkan IKPA & Belum Capaian Output'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, redflagsTitle: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Deskripsi / Subtitle</label>
                    <textarea
                      rows={2}
                      value={tempConfig.customTexts?.redflagsSubtitle || 'Daftar Satker yang membutuhkan pembinaan langsung, intervensi cepat, dan teguran resmi untuk mencegah penurunan kinerja anggaran.'}
                      onChange={(e) => setTempConfig(prev => ({
                        ...prev,
                        customTexts: { ...prev.customTexts, redflagsSubtitle: e.target.value }
                      }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none"
                    />
                  </div>
                </div>

                {/* 4. Analisis PER-5 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    4. Dashboard Pusat Pengetahuan &amp; Analisis PER-5
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.per5Badge || 'Petunjuk Teknis Resmi PER-5/PB/2024'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, per5Badge: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Utama (Title)</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.per5Title || 'Pusat Pengetahuan & Engine Analisis IKPA 2024'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, per5Title: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Deskripsi / Subtitle</label>
                    <textarea
                      rows={2}
                      value={tempConfig.customTexts?.per5Subtitle || 'Panduan lengkap reformasi IKPA berdasarkan PER-5/PB/2024, formula perhitungan otomatis, simulasi dampak, dan rekomendasi langkah konkret.'}
                      onChange={(e) => setTempConfig(prev => ({
                        ...prev,
                        customTexts: { ...prev.customTexts, per5Subtitle: e.target.value }
                      }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none"
                    />
                  </div>
                </div>

                {/* 5. Sertifikasi Pejabat */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="inline-block bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    5. Dashboard Sertifikasi Pejabat Perbendaharaan
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.sertifikasiBadge || 'MONITORING SERTIFIKASI PEJABAT PERBENDAHARAAN'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, sertifikasiBadge: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Utama (Title)</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.sertifikasiTitle || 'Daftar Pejabat Satker Belum & Sudah Tersertifikasi (PNT / PPK / PPSPM / Bendahara)'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, sertifikasiTitle: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Deskripsi / Subtitle</label>
                    <textarea
                      rows={2}
                      value={tempConfig.customTexts?.sertifikasiSubtitle || 'Memantau status kepemilikan Nomor Sertifikat Pejabat Perbendaharaan (NTPN/PNT) untuk PPK, PPSPM, Bendahara Pengeluaran, dan Bendahara Penerimaan pada seluruh Satker mitra KPPN Semarang I.'}
                      onChange={(e) => setTempConfig(prev => ({
                        ...prev,
                        customTexts: { ...prev.customTexts, sertifikasiSubtitle: e.target.value }
                      }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none"
                    />
                  </div>
                </div>

                {/* 6. Dashboard Pengumuman */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="inline-block bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    6. Dashboard Pengumuman &amp; Surat Edaran
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.pengumumanBadge || 'Papan Pengumuman & Surat Edaran KPPN Semarang I (026)'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, pengumumanBadge: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Utama (Title)</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.pengumumanTitle || 'Pusat Informasi & Pengumuman Satker'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, pengumumanTitle: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Deskripsi / Subtitle</label>
                    <textarea
                      rows={2}
                      value={tempConfig.customTexts?.pengumumanSubtitle || 'Dapatkan petunjuk teknis terbaru, jadwal batas waktu pengiriman Capaian Output, serta Surat Edaran resmi dari Pembina Keuangan KPPN Semarang I.'}
                      onChange={(e) => setTempConfig(prev => ({
                        ...prev,
                        customTexts: { ...prev.customTexts, pengumumanSubtitle: e.target.value }
                      }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none"
                    />
                  </div>
                </div>

                {/* 7. Galeri Materi Slide Presentation */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="inline-block bg-sky-100 text-sky-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    7. Galeri Materi Slide Presentation &amp; PowerPoint
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.materiSlideBadge || 'Galeri Slide Show & Modul Perbendaharaan KPPN Semarang I'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, materiSlideBadge: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Utama (Title)</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.materiSlideTitle || 'Kumpulan Slide Presentation & PowerPoint'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, materiSlideTitle: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Deskripsi / Subtitle</label>
                    <textarea
                      rows={2}
                      value={tempConfig.customTexts?.materiSlideSubtitle || 'Pusat paparan sosialisasi, bimbingan teknis, dan modul PowerPoint perbendaharaan. Nikmati fitur Slide Show langsung di dashboard tanpa perlu mencari file atau mengunduh.'}
                      onChange={(e) => setTempConfig(prev => ({
                        ...prev,
                        customTexts: { ...prev.customTexts, materiSlideSubtitle: e.target.value }
                      }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none"
                    />
                  </div>
                </div>

                {/* 8. Portal Link Sosialisasi */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="inline-block bg-teal-100 text-teal-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    8. Portal Link Sosialisasi, Zoom &amp; Materi
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.portalLinkBadge || 'Portal Sosialisasi & Bimbingan Teknis KPPN Semarang I'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, portalLinkBadge: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Utama (Title)</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.portalLinkTitle || 'Pusat Tautan & Link Sosialisasi Satker'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, portalLinkTitle: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Deskripsi / Subtitle</label>
                    <textarea
                      rows={2}
                      value={tempConfig.customTexts?.portalLinkSubtitle || 'Akses cepat menuju ruang Zoom Meeting sosialisasi, tautan presensi peserta, modul paparan, kuis evaluasi, serta kanal tanya jawab resmi KPPN Semarang I.'}
                      onChange={(e) => setTempConfig(prev => ({
                        ...prev,
                        customTexts: { ...prev.customTexts, portalLinkSubtitle: e.target.value }
                      }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none"
                    />
                  </div>
                </div>

                {/* 9. Presensi Online */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="inline-block bg-teal-100 text-teal-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    9. Presensi Online Peserta Sosialisasi
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.presensiBadge || 'Presensi Digital & Rekap Kehadiran Peserta • KPPN Semarang I'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, presensiBadge: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Utama (Title)</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.presensiTitle || 'Presensi Online Kegiatan Sosialisasi & Bimtek'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, presensiTitle: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Deskripsi / Subtitle</label>
                    <textarea
                      rows={2}
                      value={tempConfig.customTexts?.presensiSubtitle || 'Pengisian daftar hadir digital bagi pejabat/pengelola keuangan Satker yang mengikuti kegiatan sosialisasi, FGD, dan bimbingan teknis perbendaharaan.'}
                      onChange={(e) => setTempConfig(prev => ({
                        ...prev,
                        customTexts: { ...prev.customTexts, presensiSubtitle: e.target.value }
                      }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none"
                    />
                  </div>
                </div>

                {/* 10. Lapor Aduan Satker */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="inline-block bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    10. Kanal Layanan &amp; Lapor Aduan Satker
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.aduanBadge || 'Helpdesk & Layanan Pengaduan Satker KPPN Semarang I'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, aduanBadge: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Utama (Title)</label>
                      <input
                        type="text"
                        value={tempConfig.customTexts?.aduanTitle || 'Kanal Layanan Konsultasi & Pengaduan Satker'}
                        onChange={(e) => setTempConfig(prev => ({
                          ...prev,
                          customTexts: { ...prev.customTexts, aduanTitle: e.target.value }
                        }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Deskripsi / Subtitle</label>
                    <textarea
                      rows={2}
                      value={tempConfig.customTexts?.aduanSubtitle || 'Sampaikan kendala teknis SAKTI, pengajuan dispensasi, rekonsiliasi laporan, atau pengaduan layanan secara langsung ke tim pembina KPPN Semarang I.'}
                      onChange={(e) => setTempConfig(prev => ({
                        ...prev,
                        customTexts: { ...prev.customTexts, aduanSubtitle: e.target.value }
                      }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Setting 7: Ubah Password / PIN Admin */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Keamanan Akses &amp; Ubah Password / PIN Admin:
                </label>
                <p className="text-[11px] text-amber-800/80 mt-1">
                  Ubah password/PIN akses yang digunakan untuk masuk ke Panel Modul Admin, Rekap WhatsApp Satker, dan fitur manajemen data.
                </p>
              </div>

              {pinChangeMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  pinChangeMsg.isError ? 'bg-rose-100 border border-rose-300 text-rose-800' : 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                }`}>
                  {pinChangeMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Password / PIN Baru Admin
                  </label>
                  <input
                    type="password"
                    value={newAdminPinInput}
                    onChange={(e) => setNewAdminPinInput(e.target.value)}
                    placeholder="Kosongkan jika tidak ingin mengubah"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ulangi Password / PIN Baru
                  </label>
                  <input
                    type="password"
                    value={confirmAdminPinInput}
                    onChange={(e) => setConfirmAdminPinInput(e.target.value)}
                    placeholder="Masukkan ulang password baru"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Dashboard</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {adminTab === 'announcements' && (
        <div className="space-y-6">
          
          {/* Sub-Tab Navigation: Daftar Pengumuman vs Pop-Up Tools Pengumuman Awal */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setAnnouncementSubTab('daftar')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                announcementSubTab === 'daftar'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Daftar Pengumuman &amp; Surat Edaran</span>
            </button>

            <button
              type="button"
              onClick={() => setAnnouncementSubTab('popup-tools')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                announcementSubTab === 'popup-tools'
                  ? 'bg-purple-600 text-white shadow-md font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Pop-Up Tools Awal (Wajib Lihat Saat Satker Buka Dashboard)</span>
              {popForm.isEnabled && (
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  AKTIF
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setAnnouncementSubTab('slideshow')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                announcementSubTab === 'slideshow'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-amber-300" />
              <span>Slide Show Banner (Carousel Gambar Bergerak)</span>
              {tempConfig.slideShowConfig?.isEnabled ? (
                <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                  SLIDE ON
                </span>
              ) : (
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  OFF
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: DAFTAR PENGUMUMAN REGULER */}
          {announcementSubTab === 'daftar' && (
            <div className="space-y-6">
              {/* Form Card */}
              <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold mb-1">
                  <Megaphone className="w-3.5 h-3.5" />
                  MODUL KELOLA PENGUMUMAN, SURAT EDARAN & TAUTAN PREVIEW
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  {editingAnnouncementId ? 'Edit Pengumuman KPPN' : 'Buat & Publikasikan Pengumuman Baru'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
                  Atur link Google Drive PDF / YouTube video, tandai urgent, seting status aktif, atau tampilkan sebagai Layar Pengumuman Utama di posisi paling atas.
                </p>
              </div>

              {editingAnnouncementId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAnnouncementId(null);
                    setAnnForm({
                      title: '',
                      category: 'Penting',
                      content: '',
                      author: 'Seksi MSKI KPPN Semarang I (026)',
                      isPinned: false,
                      isUrgent: false,
                      isActive: true,
                      isHeroSpotlight: false,
                      heroDisplayMode: 'full',
                      linkUrl: '',
                      linkLabel: '',
                      attachmentUrl: '',
                      attachmentLabel: '',
                      surveyUrl: '',
                      surveyLabel: ''
                    });
                  }}
                  className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Batal Edit</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                
                {/* Judul Pengumuman */}
                <div className="sm:col-span-8">
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
                    Judul Pengumuman / Surat Edaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Batas Akhir Konfirmasi Capaian Output SAKTI Periode Ini"
                    value={annForm.title}
                    onChange={(e) => setAnnForm(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full text-xs rounded-xl p-3 border font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                {/* Kategori */}
                <div className="sm:col-span-4">
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
                    Kategori Pengumuman
                  </label>
                  <select
                    value={annForm.category}
                    onChange={(e: any) => setAnnForm(prev => ({ ...prev, category: e.target.value }))}
                    className={`w-full text-xs rounded-xl p-3 border font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="Penting">🚨 Penting</option>
                    <option value="Batas Waktu">⏰ Batas Waktu</option>
                    <option value="Surat Edaran">📜 Surat Edaran</option>
                    <option value="Jadwal">📅 Jadwal</option>
                    <option value="Sistem">⚙️ Sistem</option>
                  </select>
                </div>
              </div>

              {/* Setting Toggles Grid: Active, Urgent, Pin, Hero Spotlight */}
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  ⚙️ Pengaturan Status, Prioritas & Layar Tampilan Admin:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  
                  {/* Status Aktif / Inaktif */}
                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer font-bold transition-all ${
                    annForm.isActive 
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300' 
                      : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={annForm.isActive}
                        onChange={(e) => setAnnForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{annForm.isActive ? '✅ Status: AKTIF' : '🚫 Status: NON-AKTIF'}</span>
                    </div>
                  </label>

                  {/* Urgent / Paling Penting */}
                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer font-bold transition-all ${
                    annForm.isUrgent 
                      ? 'bg-rose-500/20 border-rose-500 text-rose-800 dark:text-rose-300' 
                      : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={annForm.isUrgent}
                        onChange={(e) => setAnnForm(prev => ({ ...prev, isUrgent: e.target.checked }))}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>🚨 Paling Penting / Urgent (Merah)</span>
                    </div>
                  </label>

                  {/* Checkbox Pin / Penting */}
                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer font-bold transition-all ${
                    annForm.isPinned 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-300' 
                      : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={annForm.isPinned}
                        onChange={(e) => setAnnForm(prev => ({ ...prev, isPinned: e.target.checked }))}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <Pin className="w-3.5 h-3.5 text-amber-500" />
                      <span>📌 Penting / Semat (Kuning)</span>
                    </div>
                  </label>

                  {/* Hero Spotlight / Layar Utama */}
                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer font-bold transition-all ${
                    annForm.isHeroSpotlight 
                      ? 'bg-purple-500/20 border-purple-500 text-purple-800 dark:text-purple-300' 
                      : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={annForm.isHeroSpotlight}
                        onChange={(e) => setAnnForm(prev => ({ ...prev, isHeroSpotlight: e.target.checked }))}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>📢 Pengumuman Utama</span>
                    </div>
                  </label>

                </div>

                {/* Hero Display Mode Options (shown if isHeroSpotlight is true) */}
                {annForm.isHeroSpotlight && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                    <span className="font-extrabold text-amber-700 dark:text-amber-300">
                      Tampilan Layar Pengumuman Utama:
                    </span>
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="heroDisplayMode"
                          value="full"
                          checked={annForm.heroDisplayMode === 'full'}
                          onChange={() => setAnnForm(prev => ({ ...prev, heroDisplayMode: 'full' }))}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span>Tampil Langsung Isinya (Full)</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="heroDisplayMode"
                          value="compact"
                          checked={annForm.heroDisplayMode === 'compact'}
                          onChange={() => setAnnForm(prev => ({ ...prev, heroDisplayMode: 'compact' }))}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span>Tampil Judul & Ringkasan (Compact)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Penulis / Seksi */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
                  Penulis / Seksi Penanggung Jawab
                </label>
                <input
                  type="text"
                  placeholder="Seksi MSKI KPPN Semarang I (026)"
                  value={annForm.author}
                  onChange={(e) => setAnnForm(prev => ({ ...prev, author: e.target.value }))}
                  className={`w-full text-xs rounded-xl p-3 border font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              {/* Isi Pengumuman */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
                  Isi Pengumuman Lengkap <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Tuliskan detail pengumuman, instruksi teknis SAKTI, atau poin-poin penting..."
                  value={annForm.content}
                  onChange={(e) => setAnnForm(prev => ({ ...prev, content: e.target.value }))}
                  className={`w-full text-xs rounded-xl p-3 border font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              {/* Input Link / Upload File Surat Edaran & Lampiran (Opsi Dual: Link Drive vs Upload Direct) */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                  <div className="text-xs font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-amber-500" />
                    <span>Pilihan Opsi Lampiran Dokumen / Surat Edaran:</span>
                  </div>

                  {/* Toggle Switch Buttons */}
                  <div className="flex items-center gap-2 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAnnSourceType('drive')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                        annSourceType === 'drive'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-amber-500'
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>🔗 Link Drive (Hemat Storage)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAnnSourceType('direct')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                        annSourceType === 'direct'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-amber-500'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>📁 Upload File Direct</span>
                    </button>
                  </div>
                </div>

                {annSourceType === 'drive' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                        Link Google Drive PDF / YouTube / Dokumen:
                      </label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/... atau https://youtu.be/..."
                        value={annForm.linkUrl || annForm.attachmentUrl || ''}
                        onChange={(e) => setAnnForm(prev => ({ ...prev, linkUrl: e.target.value, attachmentUrl: e.target.value }))}
                        className={`w-full text-xs rounded-xl p-2.5 border font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
                        ✨ 💡 Menggunakan link Google Drive hemat kuota penyimpanan Firebase!
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                        Label Tombol Pratinjau Link:
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 📄 Pratinjau Surat Edaran PDF"
                        value={annForm.linkLabel || annForm.attachmentLabel || ''}
                        onChange={(e) => setAnnForm(prev => ({ ...prev, linkLabel: e.target.value, attachmentLabel: e.target.value }))}
                        className={`w-full text-xs rounded-xl p-2.5 border font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Pilih File Surat / Dokumen dari Komputer / HP:
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const url = evt.target?.result as string;
                            setAnnForm(prev => ({
                              ...prev,
                              attachmentUrl: url,
                              linkUrl: url,
                              attachmentLabel: prev.attachmentLabel || file.name
                            }));
                            setAnnDirectFileName(file.name);
                            setAnnDirectFileSize((file.size / 1024).toFixed(1) + ' KB');
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                    />
                    {annDirectFileName && (
                      <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded-lg font-bold">
                        <Paperclip className="w-4 h-4" />
                        <span>Terlampir: {annDirectFileName} ({annDirectFileSize})</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-amber-500/20">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Link Form Survei Kepuasan / Feedback (Opsional):
                    </label>
                    <input
                      type="url"
                      placeholder="https://forms.gle/..."
                      value={annForm.surveyUrl || ''}
                      onChange={(e) => setAnnForm(prev => ({ ...prev, surveyUrl: e.target.value }))}
                      className={`w-full text-xs rounded-xl p-2.5 border font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Label Tombol Link Survei:
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 📋 Isi Form Survei Kepuasan"
                      value={annForm.surveyLabel || ''}
                      onChange={(e) => setAnnForm(prev => ({ ...prev, surveyLabel: e.target.value }))}
                      className={`w-full text-xs rounded-xl p-2.5 border font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {editingAnnouncementId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingAnnouncementId ? 'Simpan Perubahan Pengumuman' : 'Publikasikan Pengumuman Baru'}</span>
                </button>
              </div>

            </form>
          </div>

          {/* List of Existing Announcements Card */}
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-base font-black flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                Daftar Pengumuman KPPN ({tempConfig.announcements?.length || 0})
              </h4>
              <span className="text-xs text-slate-500">
                Gunakan tombol switch untuk mengaktifkan status, urgent, pin, atau pengumuman utama
              </span>
            </div>

            <div className="space-y-3">
              {(tempConfig.announcements || []).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada pengumuman yang dipublikasikan. Buat pengumuman pertama Anda di atas.
                </div>
              ) : (
                tempConfig.announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      ann.isHeroSpotlight
                        ? 'bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/30'
                        : ann.isUrgent
                        ? 'bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/30'
                        : ann.isPinned 
                        ? 'bg-amber-500/10 border-amber-500/50' 
                        : isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        
                        {/* Active Status Badge */}
                        <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                          ann.isActive !== false
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {ann.isActive !== false ? '● AKTIF' : '○ NON-AKTIF'}
                        </span>

                        {/* Hero Spotlight Badge */}
                        {ann.isHeroSpotlight && (
                          <span className="bg-gradient-to-r from-purple-600 to-amber-600 text-white px-2 py-0.5 rounded-full font-black text-[10px]">
                            📢 PENGUMUMAN UTAMA
                          </span>
                        )}

                        {/* Urgent Badge */}
                        {ann.isUrgent && (
                          <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full font-black text-[10px]">
                            🚨 URGENT
                          </span>
                        )}

                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          ann.category === 'Batas Waktu' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' :
                          ann.category === 'Surat Edaran' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                        }`}>
                          {ann.category}
                        </span>

                        {ann.isPinned && (
                          <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black text-[10px]">
                            <Pin className="w-3 h-3 fill-slate-950" />
                            PIN
                          </span>
                        )}

                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {ann.date}
                        </span>
                      </div>

                      <h5 className="text-sm font-extrabold leading-snug">
                        {ann.title}
                      </h5>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {ann.content}
                      </p>

                      {(ann.linkUrl || ann.attachmentUrl) && (
                        <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-0.5">
                          <Paperclip className="w-3 h-3" />
                          <span className="truncate max-w-md">{ann.linkLabel || ann.attachmentLabel || ann.linkUrl || ann.attachmentUrl}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Control Toggle Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end md:self-center">
                      
                      {/* Active Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleActiveAnnouncement(ann.id)}
                        className={`p-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          ann.isActive !== false
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300'
                        }`}
                        title={ann.isActive !== false ? "Sembunyikan dari Peserta" : "Tampilkan ke Peserta"}
                      >
                        {ann.isActive !== false ? 'Aktif' : 'Non-Aktif'}
                      </button>

                      {/* Urgent Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleUrgentAnnouncement(ann.id)}
                        className={`p-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          ann.isUrgent
                            ? 'bg-rose-600 text-white border-rose-500'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                        }`}
                        title="Tandai Urgent"
                      >
                        🚨 {ann.isUrgent ? 'Urgent' : 'Normal'}
                      </button>

                      {/* Pin Toggle */}
                      <button
                        type="button"
                        onClick={() => handleTogglePinAnnouncement(ann.id)}
                        className={`p-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1 ${
                          ann.isPinned
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                        }`}
                        title={ann.isPinned ? "Lepas Pin" : "Pin ke Atas"}
                      >
                        <Pin className="w-3 h-3" />
                        <span className="hidden sm:inline">{ann.isPinned ? 'Pin' : 'Pin'}</span>
                      </button>

                      {/* Hero Spotlight Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleHeroAnnouncement(ann.id)}
                        className={`p-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          ann.isHeroSpotlight
                            ? 'bg-purple-600 text-white border-purple-500'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                        }`}
                        title="Tampilkan di Banner Utama Layar Paling Atas"
                      >
                        📢 Utama
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleEditAnnouncement(ann)}
                        className="bg-sky-600 hover:bg-sky-500 text-white p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Edit Pengumuman"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="bg-rose-600 hover:bg-rose-500 text-white p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Hapus Pengumuman"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>

                    </div>

                  </div>
                ))
              )}
            </div>

          </div>

            </div>
          )}

          {/* TAB 2: POP-UP TOOLS AWAL DASHBOARD */}
          {announcementSubTab === 'popup-tools' && (
            <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    POP-UP TOOLS PENGUMUMAN MANDATORI AWAL
                  </div>
                  <h3 className="text-xl font-black tracking-tight">
                    Pengaturan Pop-up Informasi Penting Saat Akses Awal
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
                    Fitur interaktif ini memunculkan jendela Pop-up penting seketika saat Satker membuka dashboard. Sangat efektif agar informasi batas waktu atau instruksi penting tidak terlewatkan. Pop-up dapat diaktifkan atau dinonaktifkan kapan saja.
                  </p>
                </div>

                {/* Quick Toggle On / Off */}
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Status Pop-up:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedPop = { ...popForm, isEnabled: !popForm.isEnabled, id: 'popup-' + Date.now() };
                      setPopForm(updatedPop);
                      const newCfg = { ...tempConfig, popUpAnnouncement: updatedPop };
                      setTempConfig(newCfg);
                      onUpdateDashboardConfig(newCfg);
                      addLog('Ubah Status Pop-up Awal', 'SETTINGS', `Pop-up pengumuman awal diubah menjadi ${!popForm.isEnabled ? 'AKTIF' : 'NON-AKTIF'}.`, 'INFO');
                    }}
                    className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                      popForm.isEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {popForm.isEnabled ? '🟢 AKTIF (Tampil ke Satker)' : '🔴 NON-AKTIF (Mati)'}
                  </button>
                </div>
              </div>

              {/* Pop-up Edit Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const updatedPop = { 
                    ...popForm, 
                    id: 'popup-' + Date.now(),
                    updatedAt: new Date().toISOString()
                  };
                  setPopForm(updatedPop);
                  const newCfg = { ...tempConfig, popUpAnnouncement: updatedPop };
                  setTempConfig(newCfg);
                  onUpdateDashboardConfig(newCfg);
                  setConfigSaveSuccess(true);
                  addLog('Simpan Pop-up Awal', 'SETTINGS', `Konfigurasi pop-up awal "${popForm.title}" berhasil disimpan.`, 'SUCCESS');
                  setTimeout(() => setConfigSaveSuccess(false), 3500);
                }} 
                className="space-y-5"
              >
                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Badge Label */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
                      Badge / Tag Header Pop-up
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: PENGUMUMAN PENTING KPPN"
                      value={popForm.badge || ''}
                      onChange={(e) => setPopForm(prev => ({ ...prev, badge: e.target.value }))}
                      className={`w-full text-xs rounded-xl p-3 border font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* Kategori Pop-up */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
                      Kategori Pengumuman
                    </label>
                    <select
                      value={popForm.category || 'Penting'}
                      onChange={(e) => setPopForm(prev => ({ ...prev, category: e.target.value as any }))}
                      className={`w-full text-xs rounded-xl p-3 border font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="Penting">⚡ Penting / Pengumuman KPPN</option>
                      <option value="Batas Waktu">⏳ Batas Waktu / Deadline SPM &amp; LPJ</option>
                      <option value="Surat Edaran">📄 Surat Edaran &amp; Nota Dinas</option>
                      <option value="Jadwal">📅 Sosialisasi / FGD / Bimtek</option>
                      <option value="Sistem">⚙️ Pemeliharaan Sistem / SAKTI</option>
                    </select>
                  </div>

                  {/* Toggle Aktifkan */}
                  <div className="sm:col-span-4 flex items-end">
                    <label className="flex items-center gap-2 p-2.5 w-full rounded-xl border border-purple-500/30 bg-purple-500/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={popForm.isEnabled}
                        onChange={(e) => setPopForm(prev => ({ ...prev, isEnabled: e.target.checked }))}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <div>
                        <div className="text-xs font-black text-purple-700 dark:text-purple-300">Pop-up Aktif</div>
                        <div className="text-[10px] text-slate-500">Centang agar muncul di satker</div>
                      </div>
                    </label>
                  </div>

                  {/* Judul Utama */}
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
                      Judul Pop-up <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Batas Akhir Rekonsiliasi & Konfirmasi Capaian Output"
                      value={popForm.title}
                      onChange={(e) => setPopForm(prev => ({ ...prev, title: e.target.value }))}
                      className={`w-full text-xs rounded-xl p-3 border font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
                      Sub-Judul / Keterangan Singkat
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Wajib ditindaklanjuti seluruh Kuasa Pengguna Anggaran & Operator"
                      value={popForm.subtitle || ''}
                      onChange={(e) => setPopForm(prev => ({ ...prev, subtitle: e.target.value }))}
                      className={`w-full text-xs rounded-xl p-3 border font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Isi Narasi Pop-up */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
                    Isi / Teks Pengumuman Pop-up <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tuliskan pesan lengkap yang wajib dibaca Satker saat pertama kali masuk..."
                    value={popForm.content}
                    onChange={(e) => setPopForm(prev => ({ ...prev, content: e.target.value }))}
                    className={`w-full text-xs rounded-xl p-3 border font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                {/* Banner Image URL (Opsional) */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
                    Link Gambar / Banner Pengumuman (Opsional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://... (URL gambar banner pengumuman jika ada)"
                    value={popForm.bannerImageUrl || ''}
                    onChange={(e) => setPopForm(prev => ({ ...prev, bannerImageUrl: e.target.value }))}
                    className={`w-full text-xs rounded-xl p-3 border font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                {/* Action Buttons Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tautan Utama (Link URL):
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... atau https://bit.ly/..."
                      value={popForm.linkUrl || ''}
                      onChange={(e) => setPopForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                      className={`w-full text-xs rounded-xl p-2.5 border font-medium ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Label Tombol Utama (contoh: 📄 Unduh Surat Edaran PDF)"
                      value={popForm.linkLabel || ''}
                      onChange={(e) => setPopForm(prev => ({ ...prev, linkLabel: e.target.value }))}
                      className={`w-full text-xs rounded-xl p-2.5 border font-bold ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tautan Sekunder (Opsional):
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={popForm.secondaryLinkUrl || ''}
                      onChange={(e) => setPopForm(prev => ({ ...prev, secondaryLinkUrl: e.target.value }))}
                      className={`w-full text-xs rounded-xl p-2.5 border font-medium ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Label Tombol Sekunder (contoh: 💡 Petunjuk Teknis)"
                      value={popForm.secondaryLinkLabel || ''}
                      onChange={(e) => setPopForm(prev => ({ ...prev, secondaryLinkLabel: e.target.value }))}
                      className={`w-full text-xs rounded-xl p-2.5 border font-bold ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Submit & Save Button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-semibold text-slate-500">
                    * Menyimpan pengaturan ini akan langsung memperbarui pop-up realtime di seluruh browser Satker.
                  </div>

                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan &amp; Terapkan Pop-Up Awal</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: SLIDE SHOW / BANNER GAMBAR BERGERAK */}
          {announcementSubTab === 'slideshow' && (
            <SlideShowAdminSection
              slideShowConfig={tempConfig.slideShowConfig}
              onUpdateConfig={handleUpdateSlideShowConfig}
              isDark={isDark}
              addLog={addLog}
              showToast={showToast}
            />
          )}

        </div>
      )}

      {adminTab === 'materi-slide' && (
        <div className="space-y-6">
          
          {/* Form Card */}
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold mb-1">
                  <Presentation className="w-3.5 h-3.5" />
                  MODUL KELOLA SLIDE SHOW & PPT PRESENTATION (PEMATERI / SOSIALISASI)
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  {editingMaterialId ? 'Edit Materi Slide Show' : 'Tambah Materi Slide Presentation Baru'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
                  Atur link embed Google Slides/Drive, status aktif/non-aktif, prioritas kepentingan (Sangat Penting/Penting/Biasa), serta pin materi ke urutan teratas.
                </p>
              </div>

              {editingMaterialId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingMaterialId(null);
                    setMatForm({
                      title: '',
                      category: 'PER-5 & IKPA',
                      description: '',
                      presenter: 'Seksi MSKI KPPN Semarang I',
                      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
                      embedUrl: '',
                      slideCount: 20,
                      isPinned: false,
                      isActive: true,
                      importance: 'Sangat Penting',
                      tagsInput: 'PER-5, IKPA, KPPN'
                    });
                  }}
                  className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Judul Paparan / Materi Slide Presentation <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={matForm.title}
                    onChange={(e) => setMatForm({ ...matForm, title: e.target.value })}
                    placeholder="Contoh: Sosialisasi PER-5/PB/2024 Reformasi Indikator IKPA..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Topik / Kategori Materi
                  </label>
                  <select
                    value={matForm.category}
                    onChange={(e) => setMatForm({ ...matForm, category: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="PER-5 & IKPA">PER-5 &amp; IKPA</option>
                    <option value="SAKTI & Juknis">SAKTI &amp; Juknis</option>
                    <option value="Bimtek Perbendaharaan">Bimtek Perbendaharaan</option>
                    <option value="Mekanisme SP2D">Mekanisme SP2D</option>
                    <option value="Laporan Keuangan">Laporan Keuangan</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>

                {/* Importance */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Tingkat Kepentingan (Badge Prioritas)
                  </label>
                  <select
                    value={matForm.importance}
                    onChange={(e) => setMatForm({ ...matForm, importance: e.target.value as any })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Sangat Penting">🔥 Sangat Penting (Badge Merah Bercahaya)</option>
                    <option value="Penting">⭐ Penting (Badge Kuning Gold)</option>
                    <option value="Biasa">Standard / Biasa</option>
                  </select>
                </div>

                {/* Presenter */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Pemateri / Narasumber
                  </label>
                  <input
                    type="text"
                    value={matForm.presenter}
                    onChange={(e) => setMatForm({ ...matForm, presenter: e.target.value })}
                    placeholder="Contoh: Seksi MSKI KPPN Semarang I / Tim Pembina SAKTI"
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Tanggal Paparan / Rilis
                  </label>
                  <input
                    type="text"
                    value={matForm.date}
                    onChange={(e) => setMatForm({ ...matForm, date: e.target.value })}
                    placeholder="Contoh: 10 Agustus 2026"
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Dual Mode Upload Option: Link Drive vs Upload Direct */}
                <div className="md:col-span-2 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-2">
                    <div className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-indigo-500" />
                      <span>Pilih Sumber File Slide Presentation:</span>
                    </div>

                    {/* Toggle Switch Buttons */}
                    <div className="flex items-center gap-2 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setMatSourceType('drive')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                          matSourceType === 'drive'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-300 hover:text-indigo-500'
                        }`}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>🔗 Link Google Drive / Slides (Hemat Storage)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMatSourceType('direct')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                          matSourceType === 'direct'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-300 hover:text-indigo-500'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>📁 Upload File Direct</span>
                      </button>
                    </div>
                  </div>

                  {matSourceType === 'drive' ? (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Tempelkan Link Google Slides / Drive PDF / Presentation: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="url"
                        required={matSourceType === 'drive'}
                        value={matForm.embedUrl}
                        onChange={(e) => setMatForm({ ...matForm, embedUrl: e.target.value })}
                        placeholder="https://docs.google.com/presentation/d/e/.../embed atau https://drive.google.com/file/d/.../view"
                        className={`w-full p-2.5 rounded-xl border text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      <div className="flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>✨ <strong>Rekomendasi Hemat Storage:</strong> Memakai link Google Drive/Slides tidak membebani server/Firebase &amp; mendukung preview langsung!</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Pilih File Slide dari Perangkat Anda (PDF / PPTX / PPT):
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept=".pdf,.pptx,.ppt"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const dataUrl = event.target?.result as string;
                                setMatForm(prev => ({
                                  ...prev,
                                  embedUrl: dataUrl,
                                  title: prev.title || file.name.replace(/\.[^/.]+$/, "")
                                }));
                                setMatDirectFileName(file.name);
                                setMatDirectFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                        />
                      </div>
                      {matDirectFileName && (
                        <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 p-2 rounded-lg font-bold">
                          <FileText className="w-4 h-4" />
                          <span>Terpilih: {matDirectFileName} ({matDirectFileSize})</span>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400 block">
                        💡 File diolah secara langsung di browser dan siap dipublikasikan ke Galeri Slide Show.
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Deskripsi Ringkas Materi
                  </label>
                  <textarea
                    rows={3}
                    value={matForm.description}
                    onChange={(e) => setMatForm({ ...matForm, description: e.target.value })}
                    placeholder="Penjelasan ringkas mengenai isi slide show..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Target Akses: Eksternal (Umum) vs Internal (Ber-Password) */}
                <div className="md:col-span-2 p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-indigo-500" />
                      <span>Hak Akses Materi Slide (Umum / Eksternal vs Internal KPPN):</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Umum / Eksternal */}
                    <div
                      onClick={() => setMatForm({ ...matForm, accessType: 'UMUM' })}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                        matForm.accessType !== 'INTERNAL'
                          ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="accessType"
                        checked={matForm.accessType !== 'INTERNAL'}
                        onChange={() => setMatForm({ ...matForm, accessType: 'UMUM' })}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="space-y-1">
                        <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <span>🌐 Eksternal / Umum (Seluruh Satker)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Bebas dibuka oleh seluruh satuan kerja dan publik <strong>tanpa memerlukan password</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Option 2: Internal (Khusus Pegawai / Ber-Password) */}
                    <div
                      onClick={() => setMatForm({ ...matForm, accessType: 'INTERNAL' })}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                        matForm.accessType === 'INTERNAL'
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
                          : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="accessType"
                        checked={matForm.accessType === 'INTERNAL'}
                        onChange={() => setMatForm({ ...matForm, accessType: 'INTERNAL' })}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div className="space-y-1">
                        <div className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1">
                          <span>🔒 Khusus Internal (Ber-Password)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Hanya dapat dibuka dengan <strong>password khusus</strong> yang Anda tentukan di bawah ini.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Password Input (Only when INTERNAL) */}
                  {matForm.accessType === 'INTERNAL' && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2 animate-fade-in">
                      <label className="block text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                        <span>Password Akses Slide Internal: <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-slate-400 font-normal">Contoh default: kppn026</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showMatPasswordInput ? "text" : "password"}
                          required={matForm.accessType === 'INTERNAL'}
                          value={matForm.password}
                          onChange={(e) => setMatForm({ ...matForm, password: e.target.value })}
                          placeholder="Masukkan password khusus untuk materi internal..."
                          className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                            isDark ? 'bg-slate-950 border-amber-500/40 text-amber-300' : 'bg-white border-amber-300 text-amber-900'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowMatPasswordInput(!showMatPasswordInput)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                        >
                          {showMatPasswordInput ? 'Sembunyikan' : 'Lihat'}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-semibold">Preset cepat:</span>
                        <button
                          type="button"
                          onClick={() => setMatForm({ ...matForm, password: 'kppn026' })}
                          className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded font-mono font-bold hover:bg-slate-300"
                        >
                          kppn026
                        </button>
                        <button
                          type="button"
                          onClick={() => setMatForm({ ...matForm, password: 'internal026' })}
                          className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded font-mono font-bold hover:bg-slate-300"
                        >
                          internal026
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Slide Count & Tags */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Jumlah Halaman Slide
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={matForm.slideCount}
                    onChange={(e) => setMatForm({ ...matForm, slideCount: parseInt(e.target.value) || 20 })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Tag / Kata Kunci (Dipisahkan Koma)
                  </label>
                  <input
                    type="text"
                    value={matForm.tagsInput}
                    onChange={(e) => setMatForm({ ...matForm, tagsInput: e.target.value })}
                    placeholder="IKPA, Capaian Output, SAKTI"
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Checkbox Options */}
                <div className="md:col-span-2 flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                  
                  {/* Status Aktif Switch */}
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={matForm.isActive}
                      onChange={(e) => setMatForm({ ...matForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span>Aktifkan Status Display (Tampilkan ke User)</span>
                  </label>

                  {/* Pin Status Switch */}
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={matForm.isPinned}
                      onChange={(e) => setMatForm({ ...matForm, isPinned: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                    />
                    <span>Sematkan ke Urutan Paling Atas (Pinned Material)</span>
                  </label>

                </div>

              </div>

              {/* Submit Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingMaterialId ? 'Simpan Perubahan Slide' : 'Publikasikan Materi Slide Baru'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* List Card */}
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-base font-black flex items-center gap-2">
                <Presentation className="w-5 h-5 text-indigo-500" />
                Daftar Materi Slide Presentation ({ (tempConfig.presentationMaterials || []).length })
              </h4>
              <span className="text-xs text-slate-500">
                Gunakan tombol aksi cepat untuk mengaktifkan, menonaktifkan, mengubah akses umum/internal, atau menghapus materi slide.
              </span>
            </div>

            <div className="space-y-3">
              {(tempConfig.presentationMaterials || []).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada materi slide. Tambahkan materi slide pertama Anda melalui form di atas.
                </div>
              ) : (
                (tempConfig.presentationMaterials || []).map((mat) => (
                  <div
                    key={mat.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      mat.isActive === false
                        ? 'opacity-60 bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-800'
                        : mat.accessType === 'INTERNAL'
                        ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20'
                        : mat.importance === 'Sangat Penting'
                        ? 'bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/20'
                        : mat.isPinned
                        ? 'bg-indigo-500/10 border-indigo-500/40'
                        : isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        
                        {/* Access Type Badge (Umum vs Internal) */}
                        {mat.accessType === 'INTERNAL' ? (
                          <span className="bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full font-black text-[10px] flex items-center gap-1 border border-amber-600 shadow-xs">
                            <Lock className="w-2.5 h-2.5 fill-current" />
                            🔒 KHUSUS INTERNAL {mat.password ? `(Pass: ${mat.password})` : ''}
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-extrabold text-[10px] flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                            🌐 UMUM / EKSTERNAL
                          </span>
                        )}

                        {/* Status Aktif Badge */}
                        <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                          mat.isActive !== false
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {mat.isActive !== false ? '● AKTIF' : '○ NON-AKTIF'}
                        </span>

                        {/* Importance Badge */}
                        {mat.importance === 'Sangat Penting' && (
                          <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full font-black text-[10px] flex items-center gap-1 animate-pulse">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            SANGAT PENTING
                          </span>
                        )}

                        {mat.importance === 'Penting' && (
                          <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black text-[10px]">
                            ⭐ PENTING
                          </span>
                        )}

                        <span className="bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 px-2 py-0.5 rounded-full font-extrabold text-[10px]">
                          {mat.category}
                        </span>

                        {mat.isPinned && (
                          <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black text-[10px] flex items-center gap-1">
                            <Pin className="w-2.5 h-2.5 fill-current" />
                            PIN
                          </span>
                        )}

                        <span className="text-slate-400 text-[10px] font-bold">
                          {mat.date} • {mat.slideCount || 20} Slide
                        </span>
                      </div>

                      <h5 className="text-sm font-extrabold leading-snug">
                        {mat.title}
                      </h5>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {mat.description}
                      </p>

                      <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-md">
                        {mat.embedUrl}
                      </div>
                    </div>

                    {/* Quick Admin Actions */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end md:self-center">
                      
                      {/* Access Type Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleAccessTypeMaterial(mat.id)}
                        className={`p-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1 ${
                          mat.accessType === 'INTERNAL'
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                            : 'bg-emerald-600 text-white border-emerald-500'
                        }`}
                        title="Ubah Akses: Umum / Khusus Internal"
                      >
                        {mat.accessType === 'INTERNAL' ? <Lock className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                        <span>{mat.accessType === 'INTERNAL' ? 'Internal' : 'Umum'}</span>
                      </button>

                      {/* Active/Inactive Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleActiveMaterial(mat.id)}
                        className={`p-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                          mat.isActive !== false
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-400'
                        }`}
                        title="Aktifkan / Nonaktifkan Materi Slide"
                      >
                        {mat.isActive !== false ? <CheckCircle2 className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{mat.isActive !== false ? 'Aktif' : 'Non-Aktif'}</span>
                      </button>

                      {/* Importance Priority Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleImportanceMaterial(mat.id)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                        title="Ubah Tingkat Kepentingan (Sangat Penting / Penting / Biasa)"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{mat.importance || 'Prioritas'}</span>
                      </button>

                      {/* Pin Toggle */}
                      <button
                        type="button"
                        onClick={() => handleTogglePinMaterial(mat.id)}
                        className={`p-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                          mat.isPinned
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                        }`}
                        title="Sematkan di Atas"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleEditMaterial(mat)}
                        className="bg-sky-600 hover:bg-sky-500 text-white p-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteMaterial(mat.id)}
                        className="bg-rose-600 hover:bg-rose-500 text-white p-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>

                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {adminTab === 'logs' && (
        <div className="space-y-6">
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-3 py-1 rounded-full text-xs font-bold mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  LOG AUDIT &amp; ACTIVITY TRAIL ADMIN
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  Riwayat Log Aktivitas &amp; Otomasi Modul Admin
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Merekam seluruh riwayat login, pengolahan file Excel SAKTI, publikasi pengumuman, dan pembaruan pengaturan.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    addLog('Pembersihan Manual Log', 'AUTH', 'Riwayat log aktivitas diperbarui.', 'INFO');
                    alert('Log aktivitas diperbarui!');
                  }}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-purple-500" />
                  <span>Refresh Log</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Stat Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-purple-50/50 border-purple-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total Log Terpencatat</span>
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">{activityLogs.length} Entri</span>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-emerald-50/50 border-emerald-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Status Sesi Login</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">Aktif (KPPN 026)</span>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-sky-50/50 border-sky-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Sub-Akses PIN Valid</span>
                <span className="text-xs font-extrabold font-mono text-sky-700 dark:text-sky-300 mt-2 block">admin123 / kppn026</span>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-50/50 border-amber-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Keamanan Sesi</span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-2 block flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> TERLINDUNGI
                </span>
              </div>
            </div>

            {/* Activity Log Table / List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-extrabold flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                Daftar Riwayat Aktivitas Terbaru
              </h4>

              <div className="space-y-2.5">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                          log.category === 'AUTH' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200' :
                          log.category === 'UPLOAD' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' :
                          log.category === 'ANNOUNCEMENT' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' :
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                        }`}>
                          {log.category}
                        </span>

                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                          log.status === 'WARNING' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' :
                          'bg-sky-500/20 text-sky-600 dark:text-sky-400'
                        }`}>
                          {log.status}
                        </span>

                        <span className="text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {log.timestamp}
                        </span>
                      </div>

                      <h5 className="text-sm font-extrabold leading-tight text-slate-900 dark:text-slate-100">
                        {log.action}
                      </h5>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {log.details}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-400 font-semibold shrink-0 self-start md:self-center bg-slate-200/60 dark:bg-slate-800 px-3 py-1 rounded-xl">
                      Operator: <span className="text-slate-700 dark:text-slate-200 font-bold">{log.user}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Link Sosialisasi Tab */}
      {adminTab === 'portal-link' && (
        <div className="space-y-6">
          
          {/* Header & Overview Card */}
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-bold mb-1">
                  <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  PENGATURAN PORTAL &amp; TAUTAN SOSIALISASI (ABSEN, SLIDE PAPARAN, ZOOM, FORM)
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  Kelola Kegiatan &amp; Tautan Sosialisasi
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium max-w-2xl">
                  Atur daftar kegiatan sosialisasi, link presensi, materi slide, zoom meeting, pre-test/post-test, dan form evaluasi. Tautan yang disimpan di sini langsung otomatis tampil di Dashboard publik.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const newConfig = { ...tempConfig };
                    onUpdateDashboardConfig(newConfig);
                    showToast('Seluruh konfigurasi sosialisasi tersimpan!', 'success');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Ke Database</span>
                </button>
              </div>
            </div>

            {/* List of Kegiatan Sosialisasi */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Daftar Kegiatan Sosialisasi ({(tempConfig.kegiatanSosialisasi || []).length})</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setEditingKegiatanId(null);
                    setKegiatanForm({
                      judulKegiatan: '',
                      subJudul: 'KPPN Semarang I • Seksi MSKI',
                      tanggal: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
                      jam: '08:30 WIB - Selesai',
                      lokasi: 'Aula KPPN Semarang I / Zoom Hybrid',
                      deskripsi: '',
                      isActive: true,
                      isFeatured: true
                    });
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Buat Kegiatan Baru</span>
                </button>
              </div>

              {/* Kegiatan Cards */}
              <div className="grid grid-cols-1 gap-4">
                {(tempConfig.kegiatanSosialisasi || []).length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-xs space-y-2">
                    <Info className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">Belum Ada Kegiatan Sosialisasi</p>
                    <p>Klik &quot;Buat Kegiatan Baru&quot; di bawah untuk menambah agenda sosialisasi pertama Anda.</p>
                  </div>
                ) : (
                  (tempConfig.kegiatanSosialisasi || []).map(kegiatan => {
                    const isSelectedForLinks = selectedKegiatanForLinks === kegiatan.id || (tempConfig.kegiatanSosialisasi?.length === 1 && selectedKegiatanForLinks === null);

                    return (
                      <div
                        key={kegiatan.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          kegiatan.isActive 
                            ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 shadow-sm' 
                            : 'bg-slate-100/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-70'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                kegiatan.isActive
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60'
                              }`}>
                                {kegiatan.isActive ? '🟢 Aktif (Dapat Diakses)' : '🔴 Non-Aktif (Diarsipkan)'}
                              </span>

                              {kegiatan.isFeatured && (
                                <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black shadow-xs">
                                  ⭐ Event Utama
                                </span>
                              )}

                              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border border-indigo-200 dark:border-indigo-800">
                                {kegiatan.links.length} Tautan / Link
                              </span>
                            </div>

                            <h5 className="font-black text-base text-slate-900 dark:text-white truncate">
                              {kegiatan.judulKegiatan}
                            </h5>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {kegiatan.subJudul} • {kegiatan.tanggal} • {kegiatan.lokasi}
                            </p>
                          </div>

                          {/* Quick Actions for Event */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (tempConfig.kegiatanSosialisasi || []).map(k => 
                                  k.id === kegiatan.id ? { ...k, isActive: !k.isActive } : k
                                );
                                const newConfig = { ...tempConfig, kegiatanSosialisasi: updated };
                                 setTempConfig(newConfig);
                                onUpdateDashboardConfig(newConfig);
                                showToast(kegiatan.isActive ? 'Kegiatan Dinonaktifkan' : 'Kegiatan Diaktifkan', 'info');
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                kegiatan.isActive
                                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/30 hover:bg-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20'
                              }`}
                            >
                              {kegiatan.isActive ? 'Non-Aktifkan' : 'Aktifkan'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedKegiatanForLinks(isSelectedForLinks ? 'none' : kegiatan.id);
                              }}
                              className={`px-3.5 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                                isSelectedForLinks
                                  ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-400/40'
                                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 hover:from-emerald-500 hover:to-teal-500'
                              }`}
                            >
                              <Link2 className="w-4 h-4" />
                              <span>{isSelectedForLinks ? '🔽 Sembunyikan Kelola Link' : `🔗 Atur Link Kegiatan (${kegiatan.links.length})`}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingKegiatanId(kegiatan.id);
                                setKegiatanForm({
                                  judulKegiatan: kegiatan.judulKegiatan,
                                  subJudul: kegiatan.subJudul || '',
                                  tanggal: kegiatan.tanggal || '',
                                  jam: kegiatan.jam || '',
                                  lokasi: kegiatan.lokasi || '',
                                  deskripsi: kegiatan.deskripsi || '',
                                  isActive: kegiatan.isActive,
                                  isFeatured: !!kegiatan.isFeatured
                                });
                              }}
                              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 cursor-pointer"
                              title="Edit Detail Kegiatan"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = (tempConfig.kegiatanSosialisasi || []).filter(k => k.id !== kegiatan.id);
                                const newConfig = { ...tempConfig, kegiatanSosialisasi: updated };
                                setTempConfig(newConfig);
                                onUpdateDashboardConfig(newConfig);
                                showToast('Kegiatan berhasil dihapus', 'success');
                              }}
                              className="p-2 rounded-xl text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 cursor-pointer"
                              title="Hapus Kegiatan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Expandable Link Management Sub-Section */}
                        {isSelectedForLinks && (
                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                              <div>
                                <h6 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                                  Kelola Daftar Tautan untuk: {kegiatan.judulKegiatan}
                                </h6>
                                <p className="text-[11px] text-slate-500">
                                  Tambahkan link Presensi, Slide PDF, Zoom, Form Evaluasi, atau Sertifikat.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const defaultPresets: SocializationLink[] = [
                                    {
                                      id: `link-presensi-${Date.now()}`,
                                      judulLink: '📝 Presensi & Absensi Online Peserta Sosialisasi',
                                      url: 'https://forms.google.com/',
                                      deskripsi: 'Wajib diisi oleh seluruh peserta mitra KPPN Semarang I untuk konfirmasi kehadiran.',
                                      badge: 'Wajib Fill',
                                      iconType: 'presence',
                                      isHighlight: true,
                                      isActive: true
                                    },
                                    {
                                      id: `link-materi-${Date.now() + 1}`,
                                      judulLink: '📊 Unduh Slide Paparan & Materi Presentasi PDF',
                                      url: 'https://drive.google.com/',
                                      deskripsi: 'Bahan tayang paparan narasumber, juknis SAKTI, dan pedoman teknis.',
                                      badge: 'Materi PDF',
                                      iconType: 'pdf',
                                      isHighlight: false,
                                      isActive: true
                                    },
                                    {
                                      id: `link-zoom-${Date.now() + 2}`,
                                      judulLink: '📹 Ruang Virtual Zoom Meeting Hybrid',
                                      url: 'https://zoom.us/',
                                      deskripsi: 'Akses masuk virtual room bagi peserta online yang mengikuti secara hybrid.',
                                      badge: 'Live Zoom',
                                      iconType: 'zoom',
                                      isHighlight: true,
                                      isActive: true
                                    },
                                    {
                                      id: `link-evaluasi-${Date.now() + 3}`,
                                      judulLink: '📋 Form Evaluasi & Feedback Kepuasan Sosialisasi',
                                      url: 'https://forms.google.com/',
                                      deskripsi: 'Mohon berkenan mengisi umpan balik penilaian layanan kegiatan KPPN Semarang I.',
                                      badge: 'Form Feedback',
                                      iconType: 'form',
                                      isHighlight: false,
                                      isActive: true
                                    },
                                    {
                                      id: `link-sertifikat-${Date.now() + 4}`,
                                      judulLink: '📜 Unduh Sertifikat Digital & Surat Tugas',
                                      url: 'https://drive.google.com/',
                                      deskripsi: 'Unduh e-sertifikat apresiasi dan dokumen penetapan kegiatan.',
                                      badge: 'Sertifikat',
                                      iconType: 'certificate',
                                      isHighlight: false,
                                      isActive: true
                                    }
                                  ];

                                  const updatedKegiatan = (tempConfig.kegiatanSosialisasi || []).map(k => {
                                    if (k.id === kegiatan.id) {
                                      return { ...k, links: [...k.links, ...defaultPresets] };
                                    }
                                    return k;
                                  });

                                  setTempConfig(prev => ({ ...prev, kegiatanSosialisasi: updatedKegiatan }));
                                  onUpdateDashboardConfig({ ...tempConfig, kegiatanSosialisasi: updatedKegiatan });
                                  addToast('5 Link Preset Sosialisasi Standar Berhasil Ditambahkan!', 'success');
                                }}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                              >
                                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                                <span>+ Isi 5 Link Preset Standar</span>
                              </button>
                            </div>

                            {/* Existing links list in this kegiatan */}
                            <div className="space-y-2">
                              {kegiatan.links.map((link, lIdx) => (
                                <div
                                  key={link.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="font-mono text-slate-400 font-bold">{lIdx + 1}.</span>
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="font-extrabold text-slate-800 dark:text-slate-100 truncate">
                                          {link.judulLink}
                                        </p>
                                        {link.badge && (
                                          <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                            {link.badge}
                                          </span>
                                        )}
                                        {link.isHighlight && (
                                          <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-full font-black">
                                            ✨ Highlight
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-400 font-mono truncate">
                                        {link.url}
                                      </p>
                                      {link.deskripsi && (
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                          {link.deskripsi}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingLinkId(link.id);
                                        setLinkForm({
                                          judulLink: link.judulLink,
                                          url: link.url,
                                          deskripsi: link.deskripsi || '',
                                          badge: link.badge || 'Wajib',
                                          iconType: link.iconType || 'presence',
                                          isHighlight: !!link.isHighlight,
                                          isActive: link.isActive !== false
                                        });
                                      }}
                                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 cursor-pointer"
                                      title="Edit Detail Link"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = (tempConfig.kegiatanSosialisasi || []).map(k => {
                                          if (k.id === kegiatan.id) {
                                            const newLinks = k.links.map(l => 
                                              l.id === link.id ? { ...l, isActive: !l.isActive } : l
                                            );
                                            return { ...k, links: newLinks };
                                          }
                                          return k;
                                        });
                                        setTempConfig(prev => ({ ...prev, kegiatanSosialisasi: updated }));
                                        onUpdateDashboardConfig({ ...tempConfig, kegiatanSosialisasi: updated });
                                      }}
                                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border cursor-pointer ${
                                        link.isActive
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                          : 'bg-rose-50 text-rose-700 border-rose-300'
                                      }`}
                                    >
                                      {link.isActive ? 'Aktif' : 'Off'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = (tempConfig.kegiatanSosialisasi || []).map(k => {
                                          if (k.id === kegiatan.id) {
                                            return { ...k, links: k.links.filter(l => l.id !== link.id) };
                                          }
                                          return k;
                                        });
                                        setTempConfig(prev => ({ ...prev, kegiatanSosialisasi: updated }));
                                        onUpdateDashboardConfig({ ...tempConfig, kegiatanSosialisasi: updated });
                                        addToast('Link berhasil dihapus', 'success');
                                      }}
                                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                      title="Hapus Link"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Form Input Custom / Edit Link Detail */}
                            <div className="bg-slate-50 dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                              <div className="flex items-center justify-between">
                                <h6 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                                  {editingLinkId ? '📝 Edit Tautan / Link' : '➕ Tambah Tautan Baru (Absen, Zoom, Paparan, dll)'}
                                </h6>
                                <span className="text-[11px] text-slate-400 font-semibold">Pilih Pintasan Cepat:</span>
                              </div>

                              {/* Quick Fill Preset Buttons for specific link types */}
                              <div className="flex flex-wrap gap-1.5 pb-1">
                                <button
                                  type="button"
                                  onClick={() => setLinkForm({
                                    judulLink: '📝 Presensi & Absensi Online Peserta Sosialisasi',
                                    url: 'https://forms.google.com/',
                                    deskripsi: 'Wajib diisi oleh seluruh peserta mitra KPPN Semarang I untuk konfirmasi kehadiran.',
                                    badge: 'Wajib Absen',
                                    iconType: 'presence',
                                    isHighlight: true,
                                    isActive: true
                                  })}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer"
                                >
                                  + Presensi / Absen
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setLinkForm({
                                    judulLink: '📊 Unduh Slide Paparan & Materi Presentasi PDF',
                                    url: 'https://drive.google.com/',
                                    deskripsi: 'Bahan tayang paparan narasumber, juknis SAKTI, dan pedoman teknis.',
                                    badge: 'Materi PDF',
                                    iconType: 'pdf',
                                    isHighlight: false,
                                    isActive: true
                                  })}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-100 text-indigo-800 hover:bg-indigo-200 cursor-pointer"
                                >
                                  + Slide Paparan / PDF
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setLinkForm({
                                    judulLink: '📹 Ruang Virtual Zoom Meeting Hybrid',
                                    url: 'https://zoom.us/j/',
                                    deskripsi: 'Akses masuk virtual room bagi peserta online yang mengikuti secara hybrid.',
                                    badge: 'Live Zoom',
                                    iconType: 'zoom',
                                    isHighlight: true,
                                    isActive: true
                                  })}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-100 text-sky-800 hover:bg-sky-200 cursor-pointer"
                                >
                                  + Zoom Virtual Room
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setLinkForm({
                                    judulLink: '📋 Form Evaluasi & Feedback Kepuasan Sosialisasi',
                                    url: 'https://forms.google.com/',
                                    deskripsi: 'Mohon berkenan mengisi umpan balik penilaian layanan kegiatan KPPN Semarang I.',
                                    badge: 'Evaluasi',
                                    iconType: 'form',
                                    isHighlight: false,
                                    isActive: true
                                  })}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer"
                                >
                                  + Form Evaluasi
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setLinkForm({
                                    judulLink: '📜 Unduh Sertifikat Digital & Surat Tugas',
                                    url: 'https://drive.google.com/',
                                    deskripsi: 'Unduh e-sertifikat apresiasi dan dokumen penetapan kegiatan.',
                                    badge: 'Sertifikat',
                                    iconType: 'certificate',
                                    isHighlight: false,
                                    isActive: true
                                  })}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer"
                                >
                                  + E-Sertifikat
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setLinkForm({
                                    judulLink: '💬 Gabung Grup Whatsapp Koordinasi Peserta',
                                    url: 'https://chat.whatsapp.com/',
                                    deskripsi: 'Grup komunikasi cepat antar-peserta dan narasumber KPPN Semarang I.',
                                    badge: 'Grup WA',
                                    iconType: 'whatsapp',
                                    isHighlight: false,
                                    isActive: true
                                  })}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer"
                                >
                                  + Grup WA
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold mb-1 text-slate-700 dark:text-slate-300">
                                    Judul Tautan / Link <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: 📝 Form Presensi & Absensi Online"
                                    value={linkForm.judulLink}
                                    onChange={(e) => setLinkForm(prev => ({ ...prev, judulLink: e.target.value }))}
                                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold mb-1 text-slate-700 dark:text-slate-300">
                                    URL / Alamat Web Lengkap (https://...) <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="https://forms.gle/xyz atau https://zoom.us/j/123..."
                                    value={linkForm.url}
                                    onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold mb-1 text-slate-700 dark:text-slate-300">
                                    Keterangan / Deskripsi Singkat
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Contoh: Wajib diisi oleh seluruh peserta sebelum acara selesai"
                                    value={linkForm.deskripsi}
                                    onChange={(e) => setLinkForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[11px] font-bold mb-1 text-slate-700 dark:text-slate-300">
                                      Label Badge
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Contoh: Wajib, Live, PDF, Gratis"
                                      value={linkForm.badge}
                                      onChange={(e) => setLinkForm(prev => ({ ...prev, badge: e.target.value }))}
                                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold mb-1 text-slate-700 dark:text-slate-300">
                                      Tipe Ikon
                                    </label>
                                    <select
                                      value={linkForm.iconType}
                                      onChange={(e) => setLinkForm(prev => ({ ...prev, iconType: e.target.value as any }))}
                                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                                    >
                                      <option value="presence">📝 Presensi (Checklist)</option>
                                      <option value="pdf">📊 PDF / Slide Paparan</option>
                                      <option value="drive">📁 Google Drive</option>
                                      <option value="zoom">📹 Zoom / Video Call</option>
                                      <option value="form">📋 Form / Survei</option>
                                      <option value="certificate">📜 Sertifikat</option>
                                      <option value="whatsapp">💬 WhatsApp Group</option>
                                      <option value="youtube">🎬 Youtube Stream</option>
                                      <option value="website">🌐 Website / Portal</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 md:col-span-2 pt-1">
                                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <input
                                      type="checkbox"
                                      checked={linkForm.isHighlight}
                                      onChange={(e) => setLinkForm(prev => ({ ...prev, isHighlight: e.target.checked }))}
                                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span>✨ Jadikan Tombol Sorotan (Highlight Berwarna Gradasi)</span>
                                  </label>

                                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <input
                                      type="checkbox"
                                      checked={linkForm.isActive}
                                      onChange={(e) => setLinkForm(prev => ({ ...prev, isActive: e.target.checked }))}
                                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span>🟢 Status Aktif</span>
                                  </label>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2">
                                {editingLinkId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingLinkId(null);
                                      setLinkForm({
                                        judulLink: '',
                                        url: '',
                                        deskripsi: '',
                                        badge: 'Wajib',
                                        iconType: 'presence',
                                        isHighlight: true,
                                        isActive: true
                                      });
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                                  >
                                    Batal Edit
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!linkForm.judulLink.trim() || !linkForm.url.trim()) {
                                      addToast('Judul Link dan URL wajib diisi!', 'warning');
                                      return;
                                    }

                                    // Format URL if missing protocol
                                    let formattedUrl = linkForm.url.trim();
                                    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
                                      formattedUrl = 'https://' + formattedUrl;
                                    }

                                    const updatedKegiatanList = (tempConfig.kegiatanSosialisasi || []).map(k => {
                                      if (k.id === kegiatan.id) {
                                        if (editingLinkId) {
                                          const newLinks = k.links.map(l => 
                                            l.id === editingLinkId ? {
                                              ...l,
                                              judulLink: linkForm.judulLink,
                                              url: formattedUrl,
                                              deskripsi: linkForm.deskripsi,
                                              badge: linkForm.badge,
                                              iconType: linkForm.iconType,
                                              isHighlight: linkForm.isHighlight,
                                              isActive: linkForm.isActive
                                            } : l
                                          );
                                          return { ...k, links: newLinks };
                                        } else {
                                          const newLink: SocializationLink = {
                                            id: `link-${Date.now()}`,
                                            judulLink: linkForm.judulLink,
                                            url: formattedUrl,
                                            deskripsi: linkForm.deskripsi,
                                            badge: linkForm.badge,
                                            iconType: linkForm.iconType,
                                            isHighlight: linkForm.isHighlight,
                                            isActive: linkForm.isActive
                                          };
                                          return { ...k, links: [...k.links, newLink] };
                                        }
                                      }
                                      return k;
                                    });

                                    const newConfig = { ...tempConfig, kegiatanSosialisasi: updatedKegiatanList };
                                    setTempConfig(newConfig);
                                    onUpdateDashboardConfig(newConfig);
                                    addToast(editingLinkId ? 'Tautan berhasil diperbarui!' : 'Tautan baru berhasil ditambahkan!', 'success');

                                    setEditingLinkId(null);
                                    setLinkForm({
                                      judulLink: '',
                                      url: '',
                                      deskripsi: '',
                                      badge: 'Wajib',
                                      iconType: 'presence',
                                      isHighlight: true,
                                      isActive: true
                                    });
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>{editingLinkId ? 'Update Tautan' : 'Simpan Tautan Baru ke Dashboard'}</span>
                                </button>
                              </div>

                            </div>

                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Form Tambah / Edit Kegiatan */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {editingKegiatanId ? 'Form Edit Kegiatan Sosialisasi' : 'Form Tambah Kegiatan Sosialisasi Baru'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Nama / Judul Kegiatan Sosialisasi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Sosialisasi Langkah-Langkah Akhir Tahun & Akselerasi IKPA 2026"
                    value={kegiatanForm.judulKegiatan}
                    onChange={(e) => setKegiatanForm(prev => ({ ...prev, judulKegiatan: e.target.value }))}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Sub-Judul / Penyelenggara
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: KPPN Semarang I • Aula Pengayoman"
                    value={kegiatanForm.subJudul}
                    onChange={(e) => setKegiatanForm(prev => ({ ...prev, subJudul: e.target.value }))}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Tanggal Pelaksanaan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 15 Agustus 2026"
                    value={kegiatanForm.tanggal}
                    onChange={(e) => setKegiatanForm(prev => ({ ...prev, tanggal: e.target.value }))}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Jam Pelaksanaan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 08:30 WIB - Selesai"
                    value={kegiatanForm.jam}
                    onChange={(e) => setKegiatanForm(prev => ({ ...prev, jam: e.target.value }))}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Lokasi / Platform
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Aula KPPN Semarang I / Zoom Hybrid"
                    value={kegiatanForm.lokasi}
                    onChange={(e) => setKegiatanForm(prev => ({ ...prev, lokasi: e.target.value }))}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Deskripsi Ringkas Kegiatan
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Deskripsi singkat acuan atau petunjuk bagi peserta sosialisasi..."
                    value={kegiatanForm.deskripsi}
                    onChange={(e) => setKegiatanForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-6 md:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={kegiatanForm.isActive}
                      onChange={(e) => setKegiatanForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Aktifkan Kegiatan Ini di Portal Public</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={kegiatanForm.isFeatured}
                      onChange={(e) => setKegiatanForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                    />
                    <span>Jadikan Kegiatan Utama (Featured Default)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                {editingKegiatanId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingKegiatanId(null);
                      setKegiatanForm({
                        judulKegiatan: '',
                        subJudul: 'KPPN Semarang I • Seksi MSKI',
                        tanggal: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
                        jam: '08:30 WIB - Selesai',
                        lokasi: 'Aula KPPN Semarang I / Zoom Hybrid',
                        deskripsi: '',
                        isActive: true,
                        isFeatured: true
                      });
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    Batal
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!kegiatanForm.judulKegiatan.trim()) {
                      addToast('Judul kegiatan wajib diisi!', 'warning');
                      return;
                    }

                    const existingList = tempConfig.kegiatanSosialisasi || [];

                    let updatedKegiatanList: KegiatanSosialisasi[];

                    if (editingKegiatanId) {
                      updatedKegiatanList = existingList.map(k => {
                        if (k.id === editingKegiatanId) {
                          return {
                            ...k,
                            judulKegiatan: kegiatanForm.judulKegiatan,
                            subJudul: kegiatanForm.subJudul,
                            tanggal: kegiatanForm.tanggal,
                            jam: kegiatanForm.jam,
                            lokasi: kegiatanForm.lokasi,
                            deskripsi: kegiatanForm.deskripsi,
                            isActive: kegiatanForm.isActive,
                            isFeatured: kegiatanForm.isFeatured
                          };
                        }
                        return k;
                      });
                      addToast('Kegiatan sosialisasi berhasil diperbarui!', 'success');
                    } else {
                      const newEvent: KegiatanSosialisasi = {
                        id: `kegiatan-${Date.now()}`,
                        judulKegiatan: kegiatanForm.judulKegiatan,
                        subJudul: kegiatanForm.subJudul,
                        tanggal: kegiatanForm.tanggal,
                        jam: kegiatanForm.jam,
                        lokasi: kegiatanForm.lokasi,
                        deskripsi: kegiatanForm.deskripsi,
                        isActive: kegiatanForm.isActive,
                        isFeatured: kegiatanForm.isFeatured,
                        links: []
                      };
                      updatedKegiatanList = [newEvent, ...existingList];
                      setSelectedKegiatanForLinks(newEvent.id);
                      addToast('Kegiatan sosialisasi baru berhasil dibuat!', 'success');
                    }

                    const newConfig = { ...tempConfig, kegiatanSosialisasi: updatedKegiatanList };
                    setTempConfig(newConfig);
                    onUpdateDashboardConfig(newConfig);

                    setEditingKegiatanId(null);
                    setKegiatanForm({
                      judulKegiatan: '',
                      subJudul: 'KPPN Semarang I • Seksi MSKI',
                      tanggal: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
                      jam: '08:30 WIB - Selesai',
                      lokasi: 'Aula KPPN Semarang I / Zoom Hybrid',
                      deskripsi: '',
                      isActive: true,
                      isFeatured: true
                    });
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Kegiatan Sosialisasi</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Presensi & Rekap Kehadiran Admin Tab */}
      {adminTab === 'presensi-admin' && (
        <div className="space-y-6">
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-3 py-1 rounded-full text-xs font-bold mb-2">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  MODUL MONITORING &amp; REKAP PRESENSI DIGITAL
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  Monitoring Daftar Hadir, Tanda Tangan Digital &amp; Pengaturan Kegiatan
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
                  Pantau kehadiran peserta secara real-time, verifikasi tanda tangan digital, cetak lembar daftar hadir resmi ber-KOP Kemenkeu, dan atur status buka/tutup presensi.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPresensiConfigCard(!showPresensiConfigCard)}
                  className={`font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                    showPresensiConfigCard
                      ? 'bg-amber-600 hover:bg-amber-500 text-white ring-2 ring-amber-400'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>{showPresensiConfigCard ? 'Tutup Pengaturan Cetak' : '⚙️ Atur KOP & Penandatangan'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const activeEvt = presensiKegiatanList.find(k => k.id === selectedPresensiKegiatanId) || presensiKegiatanList[0];
                    if (!activeEvt) {
                      alert('Belum ada kegiatan presensi yang dipilih.');
                      return;
                    }
                    setShowPrintPresensiModal(true);
                  }}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Rekap Resmi (PDF/Print)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const activeEvt = presensiKegiatanList.find(k => k.id === selectedPresensiKegiatanId) || presensiKegiatanList[0];
                    const eventAttendees = presensiPesertaList.filter(p => !activeEvt || p.kegiatanId === activeEvt.id);
                    if (eventAttendees.length === 0) {
                      alert('Belum ada data peserta untuk diekspor.');
                      return;
                    }

                    // CSV generation
                    let csvContent = 'data:text/csv;charset=utf-8,';
                    csvContent += 'No,Waktu Presensi,Nama Lengkap,NIP / NIK,Asal Satker / Instansi,Kode Satker,Nomor HP\n';
                    eventAttendees.forEach((p, idx) => {
                      csvContent += `"${idx + 1}","${p.waktuPresensi}","${p.namaLengkap.replace(/"/g, '""')}","${p.nip}","${p.asalInstansi.replace(/"/g, '""')}","${p.kodeSatker || ''}","${p.noHp || ''}"\n`;
                    });

                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `Rekap_Presensi_${activeEvt?.judulKegiatan?.replace(/[^a-zA-Z0-9]/g, '_') || 'KPPN'}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-emerald-500" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Config Card: KOP & Penandatangan Presensi Online */}
            {showPresensiConfigCard && (
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-2 border-indigo-200 dark:border-indigo-800/60 shadow-xl space-y-5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 dark:border-slate-750 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        Pengaturan KOP Surat, Alamat, Telepon &amp; Penandatangan Cetak Presensi
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Ubah data header surat resmi, alamat kantor, kontak, dan nama pejabat penandatangan lembar daftar hadir.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Kembalikan semua pengaturan KOP & Penandatangan ke format standar Kemenkeu?')) {
                          setPresensiPrintConfig(DEFAULT_PRESENSI_PRINT_CONFIG);
                          try {
                            localStorage.setItem('kppn_presensi_print_config', JSON.stringify(DEFAULT_PRESENSI_PRINT_CONFIG));
                          } catch (e) {}
                          const updated = {
                            ...tempConfig,
                            presensiPrintConfig: DEFAULT_PRESENSI_PRINT_CONFIG
                          };
                          setTempConfig(updated);
                          onUpdateDashboardConfig(updated);
                          addToast('Pengaturan KOP & Penandatangan direset ke default!', 'info');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Default</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  {/* Left Column: KOP Surat Header & Alamat/Telepon */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs">
                    <div className="font-black text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      <span>1. KOP Surat &amp; Identitas Kantor</span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        KOP Baris 1 (Kementerian / Lembaga):
                      </label>
                      <input
                        type="text"
                        value={presensiPrintConfig.kopBaris1 || ''}
                        onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, kopBaris1: e.target.value }))}
                        placeholder="KEMENTERIAN KEUANGAN REPUBLIK INDONESIA"
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        KOP Baris 2 (Unit Eselon I):
                      </label>
                      <input
                        type="text"
                        value={presensiPrintConfig.kopBaris2 || ''}
                        onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, kopBaris2: e.target.value }))}
                        placeholder="DIREKTORAT JENDERAL PERBENDAHARAAN"
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        KOP Baris 3 (Kantor Wilayah):
                      </label>
                      <input
                        type="text"
                        value={presensiPrintConfig.kopBaris3 || ''}
                        onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, kopBaris3: e.target.value }))}
                        placeholder="KANTOR WILAYAH DIREKTORAT JENDERAL PERBENDAHARAAN PROVINSI JAWA TENGAH"
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        KOP Baris 4 (Kantor Pelayanan / Satker):
                      </label>
                      <input
                        type="text"
                        value={presensiPrintConfig.kopBaris4 || ''}
                        onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, kopBaris4: e.target.value }))}
                        placeholder="KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I"
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Alamat Kantor, No. Telepon, Fax &amp; Laman (Header Bawah):
                      </label>
                      <textarea
                        rows={2}
                        value={presensiPrintConfig.kopAlamatKontak || ''}
                        onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, kopAlamatKontak: e.target.value }))}
                        placeholder="Jalan Ki Mangunsarkoro No. 34, Semarang 50241 • Telepon (024) 8414441 • Laman: djpb.kemenkeu.go.id/kppn/semarang1"
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-500">
                        * Ubah kolom ini apabila ada perubahan alamat kantor, nomor telepon, atau link website.
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Judul Dokumen Lembar Cetak:
                      </label>
                      <input
                        type="text"
                        value={presensiPrintConfig.customTitle || ''}
                        onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, customTitle: e.target.value }))}
                        placeholder="DAFTAR HADIR PESERTA KEGIATAN"
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>

                  {/* Right Column: Penandatangan Pejabat & Preview */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs">
                      <div className="font-black text-xs uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                        <PenTool className="w-4 h-4" />
                        <span>2. Pejabat Penandatangan Lembar Presensi</span>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Kota / Tempat Penandatanganan:
                        </label>
                        <input
                          type="text"
                          value={presensiPrintConfig.kotaTandaTangan || ''}
                          onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, kotaTandaTangan: e.target.value }))}
                          placeholder="Semarang"
                          className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Jabatan Penandatangan:
                        </label>
                        <input
                          type="text"
                          value={presensiPrintConfig.jabatanPenandatangan || ''}
                          onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, jabatanPenandatangan: e.target.value }))}
                          placeholder="Penanggung Jawab Kegiatan / Kepala Seksi MSKI"
                          className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nama Lengkap Pejabat / Pegawai (Beserta Gelar):
                        </label>
                        <input
                          type="text"
                          value={presensiPrintConfig.namaPenandatangan || ''}
                          onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, namaPenandatangan: e.target.value }))}
                          placeholder="Contoh: Budi Santoso, S.E., M.Si."
                          className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                        />
                        <span className="text-[10px] text-slate-500">
                          * Kosongkan jika ingin tanda tangan format garis kosong ( .................... )
                        </span>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          NIP Penandatangan:
                        </label>
                        <input
                          type="text"
                          value={presensiPrintConfig.nipPenandatangan || ''}
                          onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, nipPenandatangan: e.target.value }))}
                          placeholder="Contoh: 19820514 200412 1 001"
                          className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Live Preview of Signature block */}
                    <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-center space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Pratinjau Format Tanda Tangan:
                      </div>
                      <div className="text-xs space-y-6 bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                          <p>{presensiPrintConfig.kotaTandaTangan || 'Semarang'}, 18 Agustus 2026</p>
                          <p className="font-bold">{presensiPrintConfig.jabatanPenandatangan || 'Penanggung Jawab Kegiatan / Kepala Seksi MSKI'},</p>
                        </div>
                        <div className="pt-2">
                          <p className="font-bold underline">
                            {presensiPrintConfig.namaPenandatangan ? presensiPrintConfig.namaPenandatangan : '( .................................................... )'}
                          </p>
                          <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                            NIP. {presensiPrintConfig.nipPenandatangan ? presensiPrintConfig.nipPenandatangan : '.............................................'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-indigo-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Perubahan langsung tersimpan di sistem dan otomatis diterapkan pada cetakan rekap PDF/Print.
                  </span>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem('kppn_presensi_print_config', JSON.stringify(presensiPrintConfig));
                        } catch (e) {
                          console.warn(e);
                        }
                        const updated = {
                          ...tempConfig,
                          presensiPrintConfig
                        };
                        setTempConfig(updated);
                        onUpdateDashboardConfig(updated);
                        addToast('Pengaturan KOP & Penandatangan Cetak Presensi berhasil disimpan!', 'success');
                      }}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Pengaturan Cetak</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Event Selector & Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Pilih Kegiatan yang Dimonitor:
                </label>
                <select
                  value={selectedPresensiKegiatanId || (presensiKegiatanList[0]?.id || '')}
                  onChange={(e) => setSelectedPresensiKegiatanId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {presensiKegiatanList.map(k => (
                    <option key={k.id} value={k.id}>
                      {k.judulKegiatan} ({k.tanggal}) - {k.isActive ? '🟢 Aktif' : '⚪ Nonaktif'} {k.isLocked ? '🔒 [Terkunci]' : '🔓 [Terbuka]'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Quick Stat Card */}
              {(() => {
                const activeEvt = presensiKegiatanList.find(k => k.id === (selectedPresensiKegiatanId || presensiKegiatanList[0]?.id)) || presensiKegiatanList[0];
                const count = presensiPesertaList.filter(p => !activeEvt || p.kegiatanId === activeEvt.id).length;
                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white shadow-lg flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">Total Kehadiran</div>
                      <div className="text-3xl font-black">{count}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">Peserta Terdaftar</div>
                    </div>
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xs">
                      <UserCheck className="w-8 h-8 text-white" />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Attendance Table & Search */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  <span>Daftar Peserta Hadir</span>
                </h4>

                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchPresensiQuery}
                    onChange={(e) => setSearchPresensiQuery(e.target.value)}
                    placeholder="Cari Nama / NIP / Satker..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Table */}
              {(() => {
                const activeEvt = presensiKegiatanList.find(k => k.id === (selectedPresensiKegiatanId || presensiKegiatanList[0]?.id)) || presensiKegiatanList[0];
                const attendees = presensiPesertaList.filter(p => !activeEvt || p.kegiatanId === activeEvt.id);
                const filtered = attendees.filter(p => {
                  if (!searchPresensiQuery.trim()) return true;
                  const q = searchPresensiQuery.toLowerCase();
                  return (
                    p.namaLengkap.toLowerCase().includes(q) ||
                    p.nip.toLowerCase().includes(q) ||
                    p.asalInstansi.toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-xs">
                      Belum ada data peserta yang terdaftar untuk kegiatan ini.
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-3 w-10 text-center">No</th>
                          <th className="p-3">Waktu Presensi</th>
                          <th className="p-3">Nama Lengkap &amp; NIP</th>
                          <th className="p-3">Asal Satker / Instansi</th>
                          <th className="p-3">No HP / WA</th>
                          <th className="p-3 text-center">Tanda Tangan</th>
                          <th className="p-3 text-center w-16">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filtered.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                            <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {p.waktuPresensi}
                            </td>
                            <td className="p-3">
                              <div className="font-extrabold text-slate-900 dark:text-white">{p.namaLengkap}</div>
                              <div className="text-[10px] font-mono text-slate-500">NIP: {p.nip}</div>
                            </td>
                            <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                              {p.asalInstansi}
                              {p.kodeSatker && (
                                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  ({p.kodeSatker})
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                              {p.noHp || '-'}
                            </td>
                            <td className="p-3 text-center">
                              {p.tandaTanganUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewPresensiSignature(p.tandaTanganUrl)}
                                  className="p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-all inline-block shadow-2xs cursor-pointer"
                                  title="Klik untuk memperbesar tanda tangan"
                                >
                                  <img 
                                    src={p.tandaTanganUrl} 
                                    alt="TTD" 
                                    className="h-8 w-16 object-contain" 
                                  />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Tanpa TTD</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Hapus data presensi atas nama "${p.namaLengkap}"?`)) {
                                    if (onDeletePesertaPresensi) {
                                      onDeletePesertaPresensi(p.id);
                                    }
                                  }
                                }}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                                title="Hapus Entri Presensi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Management Kegiatan Presensi Accordion / Panel */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Kelola &amp; Buat Kegiatan Presensi</span>
                </h4>

                {editingPresensiKegiatanId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPresensiKegiatanId(null);
                      setPresensiKegiatanForm({
                        judulKegiatan: '',
                        subJudul: '',
                        tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                        jamMulai: '08:30',
                        jamSelesai: '12:00 WIB',
                        jenis: 'Hybrid',
                        lokasi: 'Aula KPPN Semarang I / Zoom Meeting Hybrid',
                        deskripsi: '',
                        penyelenggara: 'Seksi MSKI KPPN Semarang I',
                        isActive: true,
                        isLocked: false
                      });
                    }}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Batal Edit &amp; Tambah Baru
                  </button>
                )}
              </div>

              {/* Form Tambah/Edit Kegiatan */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Judul Kegiatan Presensi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={presensiKegiatanForm.judulKegiatan || ''}
                      onChange={(e) => setPresensiKegiatanForm(prev => ({ ...prev, judulKegiatan: e.target.value }))}
                      placeholder="Contoh: Bimtek Percepatan Capaian Output & Digitalisasi Pembayaran"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Sub-Judul / Keterangan Singkat
                    </label>
                    <input
                      type="text"
                      value={presensiKegiatanForm.subJudul || ''}
                      onChange={(e) => setPresensiKegiatanForm(prev => ({ ...prev, subJudul: e.target.value }))}
                      placeholder="Contoh: KPA & PPK Satker KPPN Semarang I"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Tanggal Pelaksanaan
                    </label>
                    <input
                      type="text"
                      value={presensiKegiatanForm.tanggal || ''}
                      onChange={(e) => setPresensiKegiatanForm(prev => ({ ...prev, tanggal: e.target.value }))}
                      placeholder="Contoh: 18 Agustus 2026"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Jam Pelaksanaan
                    </label>
                    <input
                      type="text"
                      value={presensiKegiatanForm.jamMulai || ''}
                      onChange={(e) => setPresensiKegiatanForm(prev => ({ ...prev, jamMulai: e.target.value }))}
                      placeholder="Contoh: 08:30 WIB - Selesai"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Lokasi / Platform
                    </label>
                    <input
                      type="text"
                      value={presensiKegiatanForm.lokasi || ''}
                      onChange={(e) => setPresensiKegiatanForm(prev => ({ ...prev, lokasi: e.target.value }))}
                      placeholder="Contoh: Aula Lantai 2 / Zoom Meeting"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      Jenis Kegiatan
                    </label>
                    <select
                      value={presensiKegiatanForm.jenis || 'Hybrid'}
                      onChange={(e) => setPresensiKegiatanForm(prev => ({ ...prev, jenis: e.target.value as any }))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="Hybrid">Hybrid (Online &amp; Tatap Muka)</option>
                      <option value="Offline">Offline (Tatap Muka di Aula)</option>
                      <option value="Online">Online (Zoom / YouTube)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={presensiKegiatanForm.isActive !== false}
                        onChange={(e) => setPresensiKegiatanForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded text-teal-600"
                      />
                      <span>Tampilkan di Dashboard</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-600">
                      <input
                        type="checkbox"
                        checked={!!presensiKegiatanForm.isLocked}
                        onChange={(e) => setPresensiKegiatanForm(prev => ({ ...prev, isLocked: e.target.checked }))}
                        className="rounded text-rose-600"
                      />
                      <span>Kunci Presensi (Tutup Form)</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!presensiKegiatanForm.judulKegiatan?.trim()) {
                        alert('Judul kegiatan wajib diisi!');
                        return;
                      }

                      const newKegiatan: PresensiKegiatan = {
                        id: editingPresensiKegiatanId || `kegiatan-${Date.now()}`,
                        judulKegiatan: presensiKegiatanForm.judulKegiatan.trim(),
                        subJudul: presensiKegiatanForm.subJudul?.trim(),
                        tanggal: presensiKegiatanForm.tanggal?.trim() || new Date().toLocaleDateString('id-ID'),
                        jamMulai: presensiKegiatanForm.jamMulai?.trim() || '08:30',
                        jamSelesai: presensiKegiatanForm.jamSelesai?.trim() || 'Selesai',
                        jenis: presensiKegiatanForm.jenis || 'Hybrid',
                        lokasi: presensiKegiatanForm.lokasi?.trim() || 'Aula KPPN Semarang I',
                        deskripsi: presensiKegiatanForm.deskripsi?.trim() || '',
                        penyelenggara: presensiKegiatanForm.penyelenggara?.trim() || 'Seksi MSKI KPPN Semarang I',
                        isActive: presensiKegiatanForm.isActive !== false,
                        isLocked: !!presensiKegiatanForm.isLocked,
                        createdAt: new Date().toISOString()
                      };

                      if (onSavePresensiKegiatan) {
                        onSavePresensiKegiatan(newKegiatan);
                      }
                      setSelectedPresensiKegiatanId(newKegiatan.id);
                      setEditingPresensiKegiatanId(null);
                      setPresensiKegiatanForm({
                        judulKegiatan: '',
                        subJudul: '',
                        tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                        jamMulai: '08:30',
                        jamSelesai: '12:00 WIB',
                        jenis: 'Hybrid',
                        lokasi: 'Aula KPPN Semarang I / Zoom Meeting Hybrid',
                        deskripsi: '',
                        penyelenggara: 'Seksi MSKI KPPN Semarang I',
                        isActive: true,
                        isLocked: false
                      });
                      alert('Kegiatan presensi berhasil disimpan!');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingPresensiKegiatanId ? 'Perbarui Kegiatan' : 'Simpan Kegiatan Baru'}</span>
                  </button>
                </div>
              </div>

              {/* List of Existing Events with Quick Toggle & Edit */}
              <div className="space-y-2">
                {presensiKegiatanList.map(k => (
                  <div 
                    key={k.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white">{k.judulKegiatan}</span>
                        {k.isActive ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">Aktif</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">Nonaktif</span>
                        )}
                        {k.isLocked && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">Terkunci</span>
                        )}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {k.tanggal} • {k.jamMulai} • {k.lokasi}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPresensiKegiatanId(k.id);
                          setPresensiKegiatanForm({ ...k });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs cursor-pointer"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onSavePresensiKegiatan) {
                            onSavePresensiKegiatan({ ...k, isLocked: !k.isLocked });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                          k.isLocked 
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        {k.isLocked ? 'Buka Kunci' : 'Kunci Form'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus kegiatan "${k.judulKegiatan}"? Semua data presensi kegiatan ini tetap tersimpan di database.`)) {
                            if (onDeletePresensiKegiatan) {
                              onDeletePresensiKegiatan(k.id);
                            }
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Hapus Kegiatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Signature Zoom Modal */}
      {previewPresensiSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white p-6 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl border">
            <h4 className="font-extrabold text-slate-900 text-sm">Pratinjau Tanda Tangan Asli Peserta</h4>
            <div className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-center">
              <img src={previewPresensiSignature} alt="Tanda Tangan Peserta" className="max-h-48 object-contain" />
            </div>
            <button
              type="button"
              onClick={() => setPreviewPresensiSignature(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}

      {/* Official Print Modal (Ber-KOP Kemenkeu & Pejabat Penandatangan Dinamis) */}
      {showPrintPresensiModal && (() => {
        const activeEvt = presensiKegiatanList.find(k => k.id === (selectedPresensiKegiatanId || presensiKegiatanList[0]?.id)) || presensiKegiatanList[0];
        const attendees = presensiPesertaList.filter(p => !activeEvt || p.kegiatanId === activeEvt.id);

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static">
            <div className="bg-white text-slate-900 rounded-3xl max-w-4xl w-full p-8 sm:p-10 shadow-2xl space-y-6 print:shadow-none print:p-0 print:rounded-none">
              
              {/* Top Controls (Hidden during print) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 print:hidden">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-teal-600" />
                  <span className="font-extrabold text-sm">Pratinjau Cetak Lembar Presensi Resmi</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingPrintHeader(!isEditingPrintHeader)}
                    className={`font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      isEditingPrintHeader 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isEditingPrintHeader ? 'Tutup Edit KOP / TTD' : '✏️ Ubah KOP & Penandatangan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Sekarang (Print / PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPrintPresensiModal(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              {/* In-Modal Quick Header & Signatory Editor (Hidden on Print) */}
              {isEditingPrintHeader && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-slate-800 space-y-3 print:hidden animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-indigo-900 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      Sesuaikan KOP Surat &amp; Pejabat Penandatangan untuk Cetakan Ini:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem('kppn_presensi_print_config', JSON.stringify(presensiPrintConfig));
                        } catch (e) {}
                        const updated = {
                          ...tempConfig,
                          presensiPrintConfig
                        };
                        setTempConfig(updated);
                        onUpdateDashboardConfig(updated);
                        addToast('Format KOP & Penandatangan tersimpan!', 'success');
                      }}
                      className="text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>Simpan Sebagai Format Tetap</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">KOP Baris 4 (Satker):</label>
                      <input
                        type="text"
                        value={presensiPrintConfig.kopBaris4 || ''}
                        onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, kopBaris4: e.target.value }))}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">Alamat &amp; No. Telepon Kontak:</label>
                      <input
                        type="text"
                        value={presensiPrintConfig.kopAlamatKontak || ''}
                        onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, kopAlamatKontak: e.target.value }))}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">Jabatan Penandatangan:</label>
                      <input
                        type="text"
                        value={presensiPrintConfig.jabatanPenandatangan || ''}
                        onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, jabatanPenandatangan: e.target.value }))}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">Nama Pejabat Penandatangan &amp; Gelar:</label>
                      <input
                        type="text"
                        value={presensiPrintConfig.namaPenandatangan || ''}
                        onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, namaPenandatangan: e.target.value }))}
                        placeholder="Contoh: Budi Santoso, S.E., M.Si."
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">NIP Pejabat:</label>
                      <input
                        type="text"
                        value={presensiPrintConfig.nipPenandatangan || ''}
                        onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, nipPenandatangan: e.target.value }))}
                        placeholder="Contoh: 19820514 200412 1 001"
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">Kota Penandatanganan:</label>
                      <input
                        type="text"
                        value={presensiPrintConfig.kotaTandaTangan || ''}
                        onChange={(e) => setPresensiPrintConfig(prev => ({ ...prev, kotaTandaTangan: e.target.value }))}
                        placeholder="Semarang"
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Official Document Body */}
              <div className="space-y-6 text-slate-900">
                {/* Formal KOP Kemenkeu */}
                <div className="text-center border-b-2 border-slate-900 pb-3 space-y-0.5">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider">
                    {presensiPrintConfig.kopBaris1 || 'KEMENTERIAN KEUANGAN REPUBLIK INDONESIA'}
                  </h4>
                  <h3 className="font-bold text-xs uppercase tracking-wider">
                    {presensiPrintConfig.kopBaris2 || 'DIREKTORAT JENDERAL PERBENDAHARAAN'}
                  </h3>
                  <h3 className="font-bold text-xs uppercase tracking-wider">
                    {presensiPrintConfig.kopBaris3 || 'KANTOR WILAYAH DIREKTORAT JENDERAL PERBENDAHARAAN PROVINSI JAWA TENGAH'}
                  </h3>
                  <h2 className="font-black text-sm uppercase tracking-wider">
                    {presensiPrintConfig.kopBaris4 || 'KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I'}
                  </h2>
                  <p className="text-[10px] text-slate-600">
                    {presensiPrintConfig.kopAlamatKontak || 'Jalan Ki Mangunsarkoro No. 34, Semarang 50241 • Telepon (024) 8414441 • Laman: djpb.kemenkeu.go.id/kppn/semarang1'}
                  </p>
                </div>

                {/* Event Title */}
                <div className="text-center space-y-1">
                  <h2 className="text-base font-black uppercase underline tracking-wide">
                    {presensiPrintConfig.customTitle || 'DAFTAR HADIR PESERTA KEGIATAN'}
                  </h2>
                  <p className="text-xs font-bold">{activeEvt?.judulKegiatan}</p>
                  {activeEvt?.subJudul && <p className="text-[11px] text-slate-600 italic">{activeEvt.subJudul}</p>}
                </div>

                {/* Event Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs border border-slate-300 p-3 rounded-lg bg-slate-50/50">
                  <div><strong>Hari / Tanggal:</strong> {activeEvt?.tanggal}</div>
                  <div><strong>Waktu:</strong> {activeEvt?.jamMulai} - {activeEvt?.jamSelesai || 'Selesai'}</div>
                  <div><strong>Tempat / Media:</strong> {activeEvt?.lokasi}</div>
                  <div><strong>Penyelenggara:</strong> {activeEvt?.penyelenggara || 'Seksi MSKI KPPN Semarang I'}</div>
                </div>

                {/* Attendees Table */}
                <div className="overflow-hidden border border-slate-900">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-900 text-[11px] font-black uppercase">
                        <th className="p-2 border-r border-slate-900 w-8 text-center">No</th>
                        <th className="p-2 border-r border-slate-900">Nama Lengkap &amp; Gelar</th>
                        <th className="p-2 border-r border-slate-900">NIP / NIK</th>
                        <th className="p-2 border-r border-slate-900">Asal Satker / Unit Kerja</th>
                        <th className="p-2 border-r border-slate-900">No. WhatsApp / HP</th>
                        <th className="p-2 w-32 text-center">Tanda Tangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-400">
                      {attendees.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400 italic">Belum ada peserta yang mengisi presensi.</td>
                        </tr>
                      ) : (
                        attendees.map((p, idx) => (
                          <tr key={p.id} className="border-b border-slate-300">
                            <td className="p-2 border-r border-slate-900 text-center font-bold">{idx + 1}</td>
                            <td className="p-2 border-r border-slate-900 font-bold">{p.namaLengkap}</td>
                            <td className="p-2 border-r border-slate-900 font-mono text-[11px]">{p.nip}</td>
                            <td className="p-2 border-r border-slate-900">{p.asalInstansi}</td>
                            <td className="p-2 border-r border-slate-900 font-mono text-[11px]">{p.noHp || '-'}</td>
                            <td className="p-1 text-center flex items-center justify-center min-h-12">
                              {p.tandaTanganUrl ? (
                                <img src={p.tandaTanganUrl} alt="TTD" className="h-10 max-w-28 object-contain" />
                              ) : (
                                <span className="text-[10px] text-slate-400">Hadir</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Formal Approval Signature Block */}
                <div className="pt-8 flex justify-between text-xs break-inside-avoid">
                  <div></div>
                  <div className="text-center space-y-14 min-w-56">
                    <div>
                      <p>{presensiPrintConfig.kotaTandaTangan || 'Semarang'}, {activeEvt?.tanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="font-bold">{presensiPrintConfig.jabatanPenandatangan || 'Penanggung Jawab Kegiatan / Kepala Seksi MSKI'},</p>
                    </div>
                    <div className="border-t border-slate-900 pt-1">
                      <p className="font-bold underline">
                        {presensiPrintConfig.namaPenandatangan 
                          ? presensiPrintConfig.namaPenandatangan 
                          : '( .................................................... )'}
                      </p>
                      <p className="text-[10px] font-normal text-slate-600">
                        NIP. {presensiPrintConfig.nipPenandatangan 
                          ? presensiPrintConfig.nipPenandatangan 
                          : '.............................................'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* Broadcast & Mass Notification Tab */}
      {adminTab === 'broadcast' && (
        <BroadcastMasifSection
          satkers={satkers}
          masterSatkers={masterSatkers}
          pejabatList={pejabatList}
          pengelolaanUpRecords={dashboardConfig.pengelolaanUpRecords || []}
          dashboardConfig={tempConfig}
          onUpdateDashboardConfig={(newCfg) => {
            setTempConfig(newCfg);
            onUpdateDashboardConfig(newCfg);
          }}
          isDark={isDark}
          theme={theme}
          onNavigateToPerhatian={() => setAdminTab('perhatian')}
          addLog={addLog}
          showToast={(opts) => addToast(opts.message, opts.type)}
        />
      )}

      {/* Aduan, Helpdesk & Tiket Satker Management Tab */}
      {adminTab === 'aduan' && (
        <KelolaAduanSatkerSection
          aduanList={tempConfig.aduanList || []}
          onUpdateAduanList={(newList) => {
            const updated = {
              ...tempConfig,
              aduanList: newList
            };
            setTempConfig(updated);
            onUpdateDashboardConfig(updated);
          }}
          dashboardConfig={tempConfig}
          onUpdateDashboardConfig={(newCfg) => {
            setTempConfig(newCfg);
            onUpdateDashboardConfig(newCfg);
          }}
          isDark={isDark}
          theme={theme}
          addLog={addLog}
          showToast={(opts) => addToast(opts.message, opts.type)}
        />
      )}
      {adminTab === 'crud' && (
        <KelolaDataSatkerDashboard
          masterSatkers={masterSatkers}
          satkers={satkers}
          theme={theme}
          isAdminAuthenticated={isAdminAuthenticated}
          onSaveMasterSatker={onSaveMasterSatker}
          onUpdateMasterSatkers={onUpdateMasterSatkers}
          onDeleteMasterSatker={onDeleteMasterSatker}
          onDeleteBatchMasterSatkers={onDeleteBatchMasterSatkers}
          onToggleActiveMasterSatker={onToggleActiveMasterSatker}
        />
      )}

      {/* Satker Dalam Perhatian Subtab - Deep Admin Analytical Workspace */}
      {adminTab === 'perhatian' && (
        <SatkerPerhatianAnalyticsSection
          satkers={satkers}
          masterSatkers={masterSatkers}
          pejabatList={pejabatList}
          pengelolaanUpRecords={pengelolaanUpRecords}
          transaksiKkpRecords={transaksiKkpRecords}
          transaksiDigipayRecords={transaksiDigipayRecords}
          isDark={isDark}
          theme={theme}
          onOpenEditSatker={(satker) => {
            setEditingSatker({ ...satker, indikator: { ...satker.indikator } });
            setAdminTab('crud');
          }}
          onConsultSatkerWithAI={(satker) => {
            setSelectedSatkerForAiDiagnosis(satker);
            setAdminTab('gemini-ai');
          }}
          onOpenAiTab={() => setAdminTab('gemini-ai')}
        />
      )}

      {/* Gemini AI Powered Analytics Section Tab */}
      {adminTab === 'gemini-ai' && (
        <GeminiSatkerAnalyticsSection
          satkers={satkers}
          masterSatkers={masterSatkers}
          pejabatList={pejabatList}
          pengelolaanUpRecords={pengelolaanUpRecords}
          transaksiKkpRecords={transaksiKkpRecords}
          transaksiDigipayRecords={transaksiDigipayRecords}
          isDark={isDark}
          selectedSatkerForDiagnosis={selectedSatkerForAiDiagnosis}
          onClearSelectedDiagnosisSatker={() => setSelectedSatkerForAiDiagnosis(null)}
        />
      )}

      {/* Phone Number Monitoring Subtab */}
      {adminTab === 'pejabat-hp' && (
        <div className="space-y-6">
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-bold mb-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  MONITORING NOMOR HP PEJABAT &amp; OPERATOR SATKER
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  Monitoring Kelengkapan Kontak HP Pejabat (KPA, PPK, PPSPM, Bendahara, Operator)
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Pantau Satker yang sudah mengisi dan yang belum melengkapi nomor WhatsApp resmi Pejabat Perbendaharaan. Memudahkan KPPN Semarang I dalam koordinasi cepat dan pengiriman pesan reminder.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => exportSatkersToExcel(satkers, 'Monitoring_Kontak_Pejabat_Satker_KPPN026.xlsx')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Rekap Kontak Pejabat (Excel)</span>
                </button>
              </div>
            </div>

            {/* KPI Cards for Phone Monitoring */}
            {(() => {
              let totalSatker = satkers.length;
              let completeSatkerCount = 0;
              let incompleteSatkerCount = 0;

              satkers.forEach(s => {
                const p = ensurePejabatOperator(s);
                const hasKpaHp = Boolean(p.kpa?.noHp && p.kpa.noHp.trim() !== '');
                const hasPpkHp = Boolean(p.ppk?.noHp && p.ppk.noHp.trim() !== '');
                const hasPpspmHp = Boolean(p.ppspm?.noHp && p.ppspm.noHp.trim() !== '');
                const hasBendaharaHp = Boolean(p.bendahara?.noHp && p.bendahara.noHp.trim() !== '');
                const hasOprHp = Boolean(p.operatorPelaporan?.noHp && p.operatorPelaporan.noHp.trim() !== '');

                if (hasKpaHp && hasPpkHp && hasPpspmHp && hasBendaharaHp && hasOprHp) {
                  completeSatkerCount++;
                } else {
                  incompleteSatkerCount++;
                }
              });

              return (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-sky-50/50 border-sky-100'}`}>
                    <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total Satker Mitra KPPN</span>
                    <span className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1 block">{totalSatker} Satker</span>
                  </div>
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-emerald-50/50 border-emerald-100'}`}>
                    <span className="text-slate-500 dark:text-slate-400 block font-semibold">Kontak Pejabat Lengkap (100%)</span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{completeSatkerCount} Satker 🟢</span>
                  </div>
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-rose-50/50 border-rose-100'}`}>
                    <span className="text-slate-500 dark:text-slate-400 block font-semibold">Kontak Belum Lengkap / Masih Kosong</span>
                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">{incompleteSatkerCount} Satker 🔴</span>
                  </div>
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-purple-50/50 border-purple-100'}`}>
                    <span className="text-slate-500 dark:text-slate-400 block font-semibold">Status Monitoring KPPN</span>
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300 mt-2 block flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> SIAP UTK BROADCAST
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchHpQuery}
                  onChange={(e) => setSearchHpQuery(e.target.value)}
                  placeholder="Cari Kode/Nama Satker/Nama Pejabat/No HP..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <span className="font-bold text-slate-500 text-[11px] shrink-0">Filter Status Kontak:</span>
                <select
                  value={filterHpStatus}
                  onChange={(e) => setFilterHpStatus(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                >
                  <option value="ALL">Semua Status Kontak ({satkers.length})</option>
                  <option value="BELUM_LENGKAP">🔴 Belum Lengkap No HP Pejabat</option>
                  <option value="SUDAH_LENGKAP">🟢 Sudah Lengkap No HP Pejabat</option>
                </select>
              </div>
            </div>

            {/* Table of Phone Monitoring */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Satker</th>
                    <th className="py-3 px-4">KPA</th>
                    <th className="py-3 px-4">PPK</th>
                    <th className="py-3 px-4">PPSPM</th>
                    <th className="py-3 px-4">Bendahara</th>
                    <th className="py-3 px-4">Operator SAKTI</th>
                    <th className="py-3 px-4 text-center">Kelengkapan</th>
                    <th className="py-3 px-4 text-center">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {satkers
                    .filter(s => {
                      const p = ensurePejabatOperator(s);
                      const hasKpaHp = Boolean(p.kpa?.noHp && p.kpa.noHp.trim() !== '');
                      const hasPpkHp = Boolean(p.ppk?.noHp && p.ppk.noHp.trim() !== '');
                      const hasPpspmHp = Boolean(p.ppspm?.noHp && p.ppspm.noHp.trim() !== '');
                      const hasBendaharaHp = Boolean(p.bendahara?.noHp && p.bendahara.noHp.trim() !== '');
                      const hasOprHp = Boolean(p.operatorPelaporan?.noHp && p.operatorPelaporan.noHp.trim() !== '');

                      const isComplete = hasKpaHp && hasPpkHp && hasPpspmHp && hasBendaharaHp && hasOprHp;

                      if (filterHpStatus === 'BELUM_LENGKAP' && isComplete) return false;
                      if (filterHpStatus === 'SUDAH_LENGKAP' && !isComplete) return false;

                      if (!searchHpQuery.trim()) return true;
                      const q = searchHpQuery.toLowerCase();
                      return (
                        s.namaSatker.toLowerCase().includes(q) ||
                        s.kodeSatker.includes(q) ||
                        (p.kpa?.nama && p.kpa.nama.toLowerCase().includes(q)) ||
                        (p.ppk?.nama && p.ppk.nama.toLowerCase().includes(q)) ||
                        (p.ppspm?.nama && p.ppspm.nama.toLowerCase().includes(q)) ||
                        (p.bendahara?.nama && p.bendahara.nama.toLowerCase().includes(q)) ||
                        (p.operatorPelaporan?.nama && p.operatorPelaporan.nama.toLowerCase().includes(q))
                      );
                    })
                    .map(satker => {
                      const p = ensurePejabatOperator(satker);

                      const roles = [
                        { label: 'KPA', obj: p.kpa },
                        { label: 'PPK', obj: p.ppk },
                        { label: 'PPSPM', obj: p.ppspm },
                        { label: 'Bendahara', obj: p.bendahara },
                        { label: 'Operator', obj: p.operatorPelaporan }
                      ];

                      const filledCount = roles.filter(r => r.obj?.noHp && r.obj.noHp.trim() !== '').length;
                      const percent = Math.round((filledCount / roles.length) * 100);

                      return (
                        <tr key={satker.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900 dark:text-slate-100">{satker.namaSatker}</div>
                            <div className="text-[11px] text-slate-500 font-mono">Kode: {satker.kodeSatker}</div>
                          </td>

                          {/* KPA */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{p.kpa?.nama || '-'}</div>
                            <div className={`font-mono text-[11px] font-bold ${p.kpa?.noHp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                              {p.kpa?.noHp || 'Belum Diisi'}
                            </div>
                          </td>

                          {/* PPK */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{p.ppk?.nama || '-'}</div>
                            <div className={`font-mono text-[11px] font-bold ${p.ppk?.noHp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                              {p.ppk?.noHp || 'Belum Diisi'}
                            </div>
                          </td>

                          {/* PPSPM */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{p.ppspm?.nama || '-'}</div>
                            <div className={`font-mono text-[11px] font-bold ${p.ppspm?.noHp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                              {p.ppspm?.noHp || 'Belum Diisi'}
                            </div>
                          </td>

                          {/* Bendahara */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{p.bendahara?.nama || '-'}</div>
                            <div className={`font-mono text-[11px] font-bold ${p.bendahara?.noHp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                              {p.bendahara?.noHp || 'Belum Diisi'}
                            </div>
                          </td>

                          {/* Operator SAKTI */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{p.operatorPelaporan?.nama || '-'}</div>
                            <div className={`font-mono text-[11px] font-bold ${p.operatorPelaporan?.noHp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                              {p.operatorPelaporan?.noHp || 'Belum Diisi'}
                            </div>
                          </td>

                          {/* Kelengkapan Badge */}
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full font-black text-xs inline-block ${
                              percent === 100 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {percent}% Lengkap
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingPejabatSatker(satker);
                                  setPejabatEditForm({ ...ensurePejabatOperator(satker) });
                                }}
                                className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Edit Kontak Pejabat & Operator"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Kontak</span>
                              </button>

                              {percent < 100 && (
                                <a
                                  href={`https://wa.me/${(p.operatorPelaporan?.noHp || satker.noHpPic || '081234567890').replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Yth. PIC/Operator ${satker.namaSatker} (${satker.kodeSatker}), mohon melengkapi data nomor HP resmi KPA, PPK, PPSPM, Bendahara, dan Operator pada portal KPPN Semarang I.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Ingatkan Satker untuk Isi No HP Pejabat"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Remind WA</span>
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* Modal Edit Kontak Pejabat / Operator Satker */}
      {editingPejabatSatker && pejabatEditForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-6 my-8 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                  EDIT KONTAK PEJABAT &amp; OPERATOR
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                  {editingPejabatSatker.namaSatker} ({editingPejabatSatker.kodeSatker})
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingPejabatSatker(null);
                  setPejabatEditForm(null);
                }}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-xs">
              {/* KPA */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
                  Kuasa Pengguna Anggaran (KPA)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama KPA:</label>
                    <input
                      type="text"
                      value={pejabatEditForm.kpa?.nama || ''}
                      onChange={(e) => setPejabatEditForm({
                        ...pejabatEditForm,
                        kpa: { ...pejabatEditForm.kpa, nama: e.target.value }
                      })}
                      placeholder="Nama KPA..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">No. WhatsApp KPA:</label>
                    <input
                      type="text"
                      value={pejabatEditForm.kpa?.noHp || ''}
                      onChange={(e) => setPejabatEditForm({
                        ...pejabatEditForm,
                        kpa: { ...pejabatEditForm.kpa, noHp: e.target.value }
                      })}
                      placeholder="081234567890"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* PPK */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-extrabold text-sky-700 dark:text-sky-400 uppercase tracking-wider text-[11px]">
                  Pejabat Pembuat Komitmen (PPK)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama PPK:</label>
                    <input
                      type="text"
                      value={pejabatEditForm.ppk?.nama || ''}
                      onChange={(e) => setPejabatEditForm({
                        ...pejabatEditForm,
                        ppk: { ...pejabatEditForm.ppk, nama: e.target.value }
                      })}
                      placeholder="Nama PPK..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">No. WhatsApp PPK:</label>
                    <input
                      type="text"
                      value={pejabatEditForm.ppk?.noHp || ''}
                      onChange={(e) => setPejabatEditForm({
                        ...pejabatEditForm,
                        ppk: { ...pejabatEditForm.ppk, noHp: e.target.value }
                      })}
                      placeholder="081234567890"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* PPSPM */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-wider text-[11px]">
                  Pejabat Penandatangan SPM (PPSPM)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama PPSPM:</label>
                    <input
                      type="text"
                      value={pejabatEditForm.ppspm?.nama || ''}
                      onChange={(e) => setPejabatEditForm({
                        ...pejabatEditForm,
                        ppspm: { ...pejabatEditForm.ppspm, nama: e.target.value }
                      })}
                      placeholder="Nama PPSPM..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">No. WhatsApp PPSPM:</label>
                    <input
                      type="text"
                      value={pejabatEditForm.ppspm?.noHp || ''}
                      onChange={(e) => setPejabatEditForm({
                        ...pejabatEditForm,
                        ppspm: { ...pejabatEditForm.ppspm, noHp: e.target.value }
                      })}
                      placeholder="081234567890"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Bendahara */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider text-[11px]">
                  Bendahara Pengeluaran / Penerimaan
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Bendahara:</label>
                    <input
                      type="text"
                      value={pejabatEditForm.bendahara?.nama || ''}
                      onChange={(e) => setPejabatEditForm({
                        ...pejabatEditForm,
                        bendahara: { ...pejabatEditForm.bendahara, nama: e.target.value }
                      })}
                      placeholder="Nama Bendahara..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">No. WhatsApp Bendahara:</label>
                    <input
                      type="text"
                      value={pejabatEditForm.bendahara?.noHp || ''}
                      onChange={(e) => setPejabatEditForm({
                        ...pejabatEditForm,
                        bendahara: { ...pejabatEditForm.bendahara, noHp: e.target.value }
                      })}
                      placeholder="081234567890"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Operator Pelaporan / Capaian Output SAKTI */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-[11px]">
                  Operator SAKTI (Capaian Output &amp; Pelaporan)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Operator SAKTI:</label>
                    <input
                      type="text"
                      value={pejabatEditForm.operatorPelaporan?.nama || ''}
                      onChange={(e) => setPejabatEditForm({
                        ...pejabatEditForm,
                        operatorPelaporan: { ...pejabatEditForm.operatorPelaporan, nama: e.target.value }
                      })}
                      placeholder="Nama Operator..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">No. WhatsApp Operator:</label>
                    <input
                      type="text"
                      value={pejabatEditForm.operatorPelaporan?.noHp || ''}
                      onChange={(e) => setPejabatEditForm({
                        ...pejabatEditForm,
                        operatorPelaporan: { ...pejabatEditForm.operatorPelaporan, noHp: e.target.value }
                      })}
                      placeholder="081234567890"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingPejabatSatker(null);
                  setPejabatEditForm(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingPejabatSatker && onUpdateSatker) {
                    const updatedSatker: SatkerIKPA = {
                      ...editingPejabatSatker,
                      pejabatOperator: pejabatEditForm,
                      namaPic: pejabatEditForm.operatorPelaporan?.nama || editingPejabatSatker.namaPic,
                      noHpPic: pejabatEditForm.operatorPelaporan?.noHp || editingPejabatSatker.noHpPic
                    };
                    onUpdateSatker(updatedSatker);
                    setEditingPejabatSatker(null);
                    setPejabatEditForm(null);
                  }
                }}
                className="px-6 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Kontak</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {adminTab === 'analysis' && (
        <div className="space-y-6">
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full text-xs font-bold mb-1">
                  <Calculator className="w-3.5 h-3.5" />
                  FITUR ANALISIS CANGGIH &amp; SIMULATOR IKPA
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  Simulator Proyeksi Score IKPA ("What-If" Analysis) &amp; Anomali
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Simulasikan dampak kenaikan/penurunan indikator terhadap nilai total IKPA satker dan dapatkan rekomendasi tindak lanjut PER-5/PB/2024.
                </p>
              </div>
            </div>

            {/* Simulator Interactive Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4 bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-extrabold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Sliders className="w-4 h-4" />
                  Atur Parameter Indikator Simulasi
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Pilih Satker Target Simulasi:
                    </label>
                    <select
                      value={simSatkerId}
                      onChange={(e) => {
                        const target = satkers.find(s => s.id === e.target.value);
                        if (target) {
                          setSimSatkerId(target.id);
                          setSimCapaian(target.indikator.capaianOutput);
                          setSimDeviasi(target.indikator.deviasiHal3Dipa);
                          setSimPenyerapan(target.indikator.penyerapanAnggaran);
                          setSimRevisi(target.indikator.revisiDipa);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                    >
                      {satkers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.kodeSatker} - {s.namaSatker} (IKPA: {s.nilaiTotalIKPA})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-4 pt-2">
                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span>1. Capaian Output SAKTI (Bobot 25%)</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-mono font-extrabold">{simCapaian}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={simCapaian}
                        onChange={(e) => setSimCapaian(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span>2. Deviasi Hal III DIPA (Bobot 15%)</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-mono font-extrabold">{simDeviasi}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={simDeviasi}
                        onChange={(e) => setSimDeviasi(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span>3. Penyerapan Anggaran (Bobot 20%)</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-mono font-extrabold">{simPenyerapan}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={simPenyerapan}
                        onChange={(e) => setSimPenyerapan(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span>4. Revisi DIPA (Bobot 10%)</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-mono font-extrabold">{simRevisi}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={simRevisi}
                        onChange={(e) => setSimRevisi(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulation Outcome Result Card */}
              {(() => {
                const targetSatker = satkers.find(s => s.id === simSatkerId) || satkers[0];
                if (!targetSatker) return null;

                const simulatedIndikator = {
                  ...targetSatker.indikator,
                  capaianOutput: simCapaian,
                  deviasiHal3Dipa: simDeviasi,
                  penyerapanAnggaran: simPenyerapan,
                  revisiDipa: simRevisi
                };

                const simulatedScore = hitungTotalIKPA(simulatedIndikator);
                const simulatedPredikat = getPredikatIKPA(simulatedScore);
                const delta = Number((simulatedScore - targetSatker.nilaiTotalIKPA).toFixed(2));

                return (
                  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2.5 py-1 rounded-full">
                        HASIL PROYEKSI SIMULASI
                      </span>
                      <h4 className="text-lg font-black mt-2 leading-tight">
                        {targetSatker.namaSatker}
                      </h4>
                      <p className="text-xs text-indigo-200/80 mt-0.5 font-mono">
                        Kode: {targetSatker.kodeSatker}
                      </p>

                      <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-indigo-700/50 pb-3">
                          <span className="text-xs text-indigo-200 font-semibold">IKPA Saat Ini (Baseline):</span>
                          <span className="text-lg font-black font-mono">{targetSatker.nilaiTotalIKPA}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-indigo-700/50 pb-3">
                          <span className="text-xs text-emerald-300 font-bold">Proyeksi IKPA Baru:</span>
                          <span className="text-2xl font-black text-emerald-400 font-mono">{simulatedScore}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-indigo-700/50 pb-3">
                          <span className="text-xs text-indigo-200 font-semibold">Dampak Delta Point:</span>
                          <span className={`text-base font-black font-mono px-2 py-0.5 rounded ${
                            delta > 0 ? 'bg-emerald-500/20 text-emerald-300' :
                            delta < 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {delta > 0 ? `+${delta}` : delta} Poin
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-indigo-200 font-semibold">Predikat Proyeksi:</span>
                          <span className="text-xs font-black uppercase bg-indigo-500 text-white px-3 py-1 rounded-full">
                            {simulatedPredikat}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-950/80 p-3 rounded-xl border border-indigo-800 text-[11px] text-indigo-200">
                      💡 <strong>Rekomendasi Petugas MSKI:</strong> {
                        simCapaian === 0
                          ? 'Percepat konfirmasi Capaian Output SAKTI sebelum tanggal 5 untuk mencegah pengurangan 25 poin!'
                          : delta > 0
                          ? 'Skenario ini akan mendongkrak predikat IKPA Satker ke tingkat yang lebih tinggi!'
                          : 'Perhatikan penurunan indikator agar nilai total IKPA tidak turun di bawah batas minimal 87.5.'
                      }
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Outlier Radar Table */}
            <div className="space-y-3 pt-4">
              <h4 className="text-sm font-extrabold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4" />
                Radar Anomali &amp; Satker Membutuhkan Intervensi Segera (PER-5/PB/2024)
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-rose-200 dark:border-rose-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 font-extrabold uppercase border-b border-rose-200 dark:border-rose-900/60">
                    <tr>
                      <th className="py-3 px-4">Satker Bermasalah</th>
                      <th className="py-3 px-4">Anomali Terdeteksi</th>
                      <th className="py-3 px-4">Nilai IKPA</th>
                      <th className="py-3 px-4">Rekomendasi Tindak Lanjut MSKI KPPN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 dark:divide-rose-900/40">
                    {satkers
                      .filter(s => s.statusCapaianOutput === 'Belum Terlaporkan' || s.nilaiTotalIKPA < 87.5 || s.indikator.deviasiHal3Dipa < 70)
                      .map(s => (
                        <tr key={s.id} className="hover:bg-rose-50/50 dark:hover:bg-rose-950/20">
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900 dark:text-slate-100">{s.namaSatker}</div>
                            <div className="text-[11px] text-slate-500 font-mono">Kode: {s.kodeSatker}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {s.statusCapaianOutput === 'Belum Terlaporkan' && (
                                <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 px-2 py-0.5 rounded font-bold text-[10px]">
                                  Capaian Output 0%
                                </span>
                              )}
                              {s.indikator.deviasiHal3Dipa < 70 && (
                                <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 px-2 py-0.5 rounded font-bold text-[10px]">
                                  Deviasi Hal III Tinggi ({s.indikator.deviasiHal3Dipa}%)
                                </span>
                              )}
                              {s.nilaiTotalIKPA < 87.5 && (
                                <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 px-2 py-0.5 rounded font-bold text-[10px]">
                                  Predikat Cukup/Kurang
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-black font-mono text-sm text-slate-900 dark:text-slate-100">
                            {s.nilaiTotalIKPA}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            {s.statusCapaianOutput === 'Belum Terlaporkan'
                              ? `Kirimkan Surat Teguran & WA Pendampingan ke PIC (${s.namaPic} - ${s.noHpPic}) untuk konfirmasi SAKTI.`
                              : `Lakukan konsultasi penyesuaian Halaman III DIPA pada periode revisi berikutnya.`
                            }
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {adminTab === 'upload' && (
        <div className="space-y-6">
          {/* Sub Navigation for Upload Categories: 3 Main Tabs + TUP */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-3 py-1 rounded-full">
                  MODUL UPLOAD &amp; DATABASE TERISOLASI
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                  Upload Excel &amp; Manajemen Data KPPN Semarang I
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Setiap tab memiliki database, validator, template, dan arsip riwayat tersendiri agar data tidak saling tercampur.
                </p>
              </div>
            </div>

            {/* 4 Dedicated Upload Tabs Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setUploadSubTab('ikpa')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  uploadSubTab === 'ikpa'
                    ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-500 ring-2 ring-sky-500/30 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-extrabold text-sm text-sky-800 dark:text-sky-300">
                  <BarChart3 className="w-5 h-5 text-sky-600 shrink-0" />
                  <span>1. Excel IKPA</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  8 Indikator IKPA, Nilai Kinerja &amp; Arsip Periode IKPA.
                </p>
                <div className="mt-2 text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400">
                  {satkers.filter(s => s.hasIKPAData !== false && (s.nilaiTotalIKPA > 0 || s.paguAnggaran > 0)).length} Satker IKPA
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUploadSubTab('output')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  uploadSubTab === 'output'
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-800 dark:text-emerald-300">
                  <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>2. Capaian Output</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  Status Pengisian, Konfirmasi &amp; Progres Output SAKTI Satker.
                </p>
                <div className="mt-2 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {satkers.filter(s => s.statusCapaianOutput === 'Sudah Terlaporkan').length} Terlaporkan
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUploadSubTab('sertifikasi')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  uploadSubTab === 'sertifikasi'
                    ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-extrabold text-sm text-amber-800 dark:text-amber-300">
                  <Award className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>3. Excel Sertifikasi</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  Database KPA, PPK, PPSPM, PTP &amp; No. Sertifikat Jabatan.
                </p>
                <div className="mt-2 text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                  {pejabatList.length} Pejabat Terdaftar
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUploadSubTab('tup')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  uploadSubTab === 'tup'
                    ? 'bg-purple-50 dark:bg-purple-950/80 border-purple-500 ring-2 ring-purple-500/30 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-extrabold text-sm text-purple-800 dark:text-purple-300">
                  <FileSpreadsheet className="w-5 h-5 text-purple-600 shrink-0" />
                  <span>4. Pengelolaan TUP &amp; UP</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  Monitoring Pagu UP/TUP, Revolving GUP &amp; Batas 30 Hari.
                </p>
                <div className="mt-2 text-[10px] font-mono font-bold text-purple-700 dark:text-purple-400">
                  {pengelolaanUpRecords.length} Catatan UP/TUP
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUploadSubTab('kkp')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  uploadSubTab === 'kkp'
                    ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-extrabold text-sm text-blue-800 dark:text-blue-300">
                  <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>5. Transaksi KKP (GUP)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  Rekap Transaksi Kartu Kredit Pemerintah &amp; GUP KKP Satker.
                </p>
                <div className="mt-2 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-400">
                  {transaksiKkpRecords.length} Transaksi KKP
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUploadSubTab('digipay')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  uploadSubTab === 'digipay'
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-800 dark:text-emerald-300">
                  <CreditCard className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>6. Transaksi Digipay (VA &amp; KKP)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  Multi-Tab Excel Pembayaran VA &amp; Kartu Kredit Pemerintah.
                </p>
                <div className="mt-2 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {transaksiDigipayRecords.length} Transaksi Digipay
                </div>
              </button>
            </div>
          </div>

          {/* Render Active Sub-Tab Component */}
          {uploadSubTab === 'ikpa' && (
            <UploadIKPASection
              isDark={isDark}
              satkers={satkers}
              masterSatkers={masterSatkers}
              historicalUploads={historicalUploads}
              onApplySatkers={(data, append) => onApplyNewSatkers(data, append, 'dashboard')}
              onSaveHistoricalUploads={saveAndApplyHistoricalUploads}
              onClearIKPAData={onClearAllData || (() => {})}
              requestConfirm={requestConfirm}
              showToast={showToast}
              addLog={addLog}
            />
          )}

          {uploadSubTab === 'output' && (
            <UploadOutputSection
              isDark={isDark}
              satkers={satkers}
              masterSatkers={masterSatkers}
              historicalUploads={historicalUploads}
              onApplySatkers={(data, append) => onApplyNewSatkers(data, append, 'capaian-output')}
              onSaveHistoricalUploads={saveAndApplyHistoricalUploads}
              onClearCapaianOutputData={() => {
                const resetSatkers = satkers.map(s => ({
                  ...s,
                  hasCapaianOutputData: false,
                  statusCapaianOutput: 'Belum Terlaporkan' as const,
                  indikator: { ...s.indikator, capaianOutput: 0 }
                }));
                onApplyNewSatkers(resetSatkers, false, 'capaian-output');
              }}
              requestConfirm={requestConfirm}
              showToast={showToast}
              addLog={addLog}
            />
          )}

          {uploadSubTab === 'sertifikasi' && (
            <UploadSertifikasiSection
              isDark={isDark}
              satkers={satkers}
              masterSatkers={masterSatkers}
              pejabatList={pejabatList}
              onApplyPejabatList={onUpdatePejabatList || (() => {})}
              onClearPejabatData={() => {
                if (onUpdatePejabatList) onUpdatePejabatList([]);
              }}
              requestConfirm={requestConfirm}
              showToast={showToast}
              addLog={addLog}
            />
          )}

          {uploadSubTab === 'tup' && (
            <UploadTUPSection
              isDark={isDark}
              satkers={satkers}
              masterSatkers={masterSatkers}
              pengelolaanUpRecords={pengelolaanUpRecords}
              onApplyPengelolaanUp={onApplyPengelolaanUp || (() => {})}
              onClearPengelolaanUp={onClearPengelolaanUp || (() => {})}
              requestConfirm={requestConfirm}
              showToast={showToast}
              addLog={addLog}
            />
          )}

          {uploadSubTab === 'kkp' && (
            <UploadKKPSection
              isDark={isDark}
              satkers={satkers}
              masterSatkers={masterSatkers}
              transaksiKkpRecords={transaksiKkpRecords}
              onApplyTransaksiKkp={onApplyTransaksiKkp || (() => {})}
              onClearTransaksiKkp={onClearTransaksiKkp || (() => {})}
              requestConfirm={requestConfirm}
              showToast={showToast}
              addLog={addLog}
            />
          )}

          {uploadSubTab === 'digipay' && (
            <UploadDigipaySection
              isDark={isDark}
              satkers={satkers}
              masterSatkers={masterSatkers}
              transaksiDigipayRecords={transaksiDigipayRecords}
              onApplyTransaksiDigipay={onApplyTransaksiDigipay || (() => {})}
              onClearTransaksiDigipay={onClearTransaksiDigipay || (() => {})}
              requestConfirm={requestConfirm}
              showToast={showToast}
              addLog={addLog}
            />
          )}
        </div>
      )}

      {false && (
        <>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-sky-600" />
          <span>Area Upload File Excel / CSV ({excelCategory})</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Unggah file hasil ekspor SAKTI/My Intress untuk kategori <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{excelCategory}</strong>. Sistem otomatis membersihkan spasi liar &amp; memperbaiki format.
        </p>

        {excelCategory === 'IKPA' && (
          <div className="mb-4 p-3.5 bg-sky-50/90 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/80 rounded-2xl flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200">
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                <strong>Fitur Unggulan:</strong> Mendukung Ekspor Asli SAKTI/My Intress (Bulanan seperti <strong>Januari</strong>, Februari, Maret, dll). Bulan otomatis terdeteksi dari header Excel.
              </span>
            </div>
            <button
              onClick={() => {
                const janHist = historicalUploads.find(h => h.periode.toLowerCase().includes('januari'));
                if (janHist) {
                  onApplyNewSatkers(janHist.satkersData, false);
                  const newHistoryList = historicalUploads.map(h => ({ ...h, isActive: h.id === janHist.id }));
                  saveAndApplyHistoricalUploads(newHistoryList);
                  alert(`Berhasil mengaktifkan Data IKPA Periode ${janHist.periode} (${janHist.satkerCount} Satker)!`);
                } else {
                  alert('Data IKPA Januari siap diunggah melalui tombol Pilih File Excel di bawah.');
                }
              }}
              className="shrink-0 bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Muat Data Januari</span>
            </button>
          </div>
        )}

        {excelCategory === 'CAPAIAN_OUTPUT' && (
          <div className="mb-4 p-3.5 bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Fitur Capaian Output:</strong> Membaca kolom <code>% Data Masuk/Upload</code> (Rekap Kertas Kerja Caput My Intress / SAKTI). Satker dengan nilai <strong>0%</strong> otomatis dikategorikan <strong>Belum Terlaporkan</strong> (Belum Mengirim SAKTI).
              </span>
            </div>
          </div>
        )}

        {/* Template Download Option */}
        <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Download className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Unduh Contoh Template Excel:</strong> Gunakan format Excel resmi agar kolom data dapat diproses otomatis oleh sistem.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (excelCategory === 'CAPAIAN_OUTPUT') downloadCapaianOutputTemplate();
                else if (excelCategory === 'SERTIFIKASI') downloadSertifikasiTemplate();
                else if (excelCategory === 'PASSWORD_BATCH') downloadPasswordBatchTemplate();
                else if (excelCategory === 'BROADCAST_CUSTOM') downloadBroadcastExcelTemplate(satkers);
                else downloadExcelTemplate();
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template Excel ({excelCategory})</span>
            </button>
            <button
              type="button"
              onClick={downloadSertifikasiTemplate}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-2 rounded-xl transition-all text-[11px] cursor-pointer flex items-center gap-1"
              title="Download Contoh Template Sertifikasi Pejabat Perbendaharaan"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Template Sertifikasi</span>
            </button>
          </div>
        </div>

        <div className="border-2 border-dashed border-sky-300 dark:border-sky-800 hover:border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 rounded-2xl p-8 text-center transition-all">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Upload className="w-7 h-7" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Tarik &amp; Lepaskan File Excel ({excelCategory}) di sini, atau
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="mt-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                {isProcessing ? 'Memproses &amp; Perbaiki Data...' : `Pilih File Excel ${excelCategory}`}
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Mendukung file .xlsx, .xls, .csv (Maksimal 10MB)
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Preview Pejabat Sertifikasi Import Table */}
      {previewPejabatList.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden space-y-4">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-amber-50/80 dark:bg-amber-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-200 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-black mb-1">
                <Award className="w-3.5 h-3.5 text-amber-700" />
                PREVIEW IMPOR SERTIFIKASI PEJABAT ({previewPejabatList.length} PEJABAT)
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Tinjau Data Pejabat Perbendaharaan Sebelum Diterapkan
              </h3>
            </div>

            <button
              onClick={handleApplyPejabat}
              className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Terapkan Ke Data Sertifikasi Pejabat</span>
            </button>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Satker</th>
                  <th className="py-2.5 px-3">Nama Pejabat</th>
                  <th className="py-2.5 px-3">Jabatan</th>
                  <th className="py-2.5 px-3">NIP</th>
                  <th className="py-2.5 px-3">Status Sertifikasi</th>
                  <th className="py-2.5 px-3">No. Sertifikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {previewPejabatList.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3 font-bold">{p.namaSatker} ({p.kodeSatker})</td>
                    <td className="py-2.5 px-3">{p.namaPejabat}</td>
                    <td className="py-2.5 px-3 font-semibold text-amber-700 dark:text-amber-300">{p.jabatan}</td>
                    <td className="py-2.5 px-3 font-mono">{p.nip}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        p.statusSertifikasi === 'Tersertifikasi' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {p.statusSertifikasi}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{p.noSertifikat || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload & Auto-Cleaning Log Diagnostic */}
      {uploadLog && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-950">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-extrabold text-emerald-900">
                Hasil Otomasi Perbaikan Data Excel ({uploadLog.fileName})
              </h4>
            </div>
            <span className="text-xs bg-emerald-200 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
              Status: {uploadLog.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
            <div className="bg-white/80 p-3 rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">Total Baris Terbaca:</span>
              <span className="text-lg font-black text-slate-900">{uploadLog.rowCount} Baris</span>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">Dibersihkan &amp; Diformat:</span>
              <span className="text-lg font-black text-emerald-700">{uploadLog.cleanedCount} Satker</span>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-emerald-200">
              <span className="text-slate-500 block">Waktu Pengolahan:</span>
              <span className="text-xs font-bold text-slate-800">{uploadLog.uploadDate}</span>
            </div>
          </div>

          <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-200 text-xs space-y-1">
            <span className="font-bold text-emerald-900 block mb-1">Catatan Sistem Perbaikan:</span>
            {uploadLog.notes.map((n, i) => (
              <div key={i} className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Table of Uploaded Data before applying */}
      {previewSatkers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden space-y-4">
          
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-3 py-1 rounded-full text-xs font-extrabold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                  PREVIEW HASIL AUTOMATED CLEANER ({previewSatkers.length} SATKER)
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Tentukan Periode Laporan &amp; Opsi Penyimpanan Data Excel
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pilih apakah data ini akan langsung MENIMPA Dashboard Utama atau hanya disimpan ke Arsip Historical.
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl cursor-pointer self-start md:self-auto">
                <input
                  type="checkbox"
                  checked={appendMode}
                  onChange={(e) => setAppendMode(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Tambahkan ke Data Saat Ini (Bukan Mengganti Total)</span>
              </label>
            </div>

            {/* Capaian Output Mode Info Banner */}
            {excelCategory === 'CAPAIAN_OUTPUT' && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-sm mb-0.5">
                    🎯 Mode Pengunggahan Khusus Capaian Output (SAKTI/My Intress)
                  </div>
                  <div>
                    Sistem mendeteksi file kategori <strong>Capaian Output</strong>. Pengunggahan ini hanya memperbarui <strong>Status Terlaporkan &amp; Nilai Capaian Output</strong> Satker tanpa merusak atau mengubah nilai 7 indikator IKPA lainnya.
                  </div>
                </div>
              </div>
            )}

            {/* Periode and Notes Metadata Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  📅 Bulan / Periode Berkenaan:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={uploadPeriode}
                    onChange={(e) => setUploadPeriode(e.target.value)}
                    placeholder="misal: Agustus 2026, Juli 2026, Triwulan III 2026"
                    className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-bold text-slate-900 dark:text-slate-100"
                  />
                  <select
                    onChange={(e) => {
                      if (e.target.value) setUploadPeriode(e.target.value);
                    }}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-2 font-bold text-slate-700 dark:text-slate-300"
                  >
                    <option value="">Pilihan Cepat Bulan...</option>
                    <option value="Januari 2026">Januari 2026</option>
                    <option value="Februari 2026">Februari 2026</option>
                    <option value="Maret 2026">Maret 2026</option>
                    <option value="April 2026">April 2026</option>
                    <option value="Mei 2026">Mei 2026</option>
                    <option value="Juni 2026">Juni 2026</option>
                    <option value="Juli 2026">Juli 2026</option>
                    <option value="Agustus 2026">Agustus 2026</option>
                    <option value="September 2026">September 2026</option>
                    <option value="Oktober 2026">Oktober 2026</option>
                    <option value="November 2026">November 2026</option>
                    <option value="Desember 2026">Desember 2026</option>
                    <option value="Triwulan I 2026">Triwulan I 2026</option>
                    <option value="Triwulan II 2026">Triwulan II 2026</option>
                    <option value="Triwulan III 2026">Triwulan III 2026</option>
                    <option value="Triwulan IV 2026">Triwulan IV 2026</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  📝 Catatan / Keterangan Arsip:
                </label>
                <input
                  type="text"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="misal: Rekonsiliasi SAKTI Setelah Batas Konfirmasi"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <button
                onClick={() => handleApply(false)}
                className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                title="Simpan file ini ke arsip historical saja tanpa menimpa tampilan dashboard utama"
              >
                <FolderArchive className="w-4 h-4 text-sky-400" />
                <span>📁 Simpan Ke Arsip Historical Saja</span>
              </button>

              <button
                onClick={() => handleApply(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2 cursor-pointer"
                title="Memperbarui data aktif dashboard utama dan menyimpan arsipnya"
              >
                <RotateCcw className="w-4 h-4" />
                <span>⚡ Update &amp; Aktifkan Di Dashboard Utama</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                {excelCategory === 'CAPAIAN_OUTPUT' ? (
                  <tr>
                    <th className="py-3 px-4">Kode &amp; Nama Satker</th>
                    <th className="py-3 px-4">Status Capaian Output (SAKTI)</th>
                    <th className="py-3 px-4">Nilai Caput (%)</th>
                    <th className="py-3 px-4">IKPA Saat Ini</th>
                    <th className="py-3 px-4">Hasil IKPA Setelah Merge</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="py-3 px-4">Kode &amp; Nama Satker</th>
                    <th className="py-3 px-4">Periode</th>
                    <th className="py-3 px-4">Penyerapan</th>
                    <th className="py-3 px-4">Capaian Output</th>
                    <th className="py-3 px-4">Total IKPA</th>
                    <th className="py-3 px-4">Predikat</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {previewSatkers.map((satker) => {
                  const existing = satkers?.find(s => s.kodeSatker === satker.kodeSatker);
                  const isCaput = excelCategory === 'CAPAIAN_OUTPUT';

                  let projectedIKPA = satker.nilaiTotalIKPA;
                  if (isCaput && existing) {
                    projectedIKPA = hitungTotalIKPA({
                      ...existing.indikator,
                      capaianOutput: satker.indikator.capaianOutput
                    });
                  }

                  return (
                    <tr key={satker.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{satker.namaSatker}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Kode: {satker.kodeSatker}</div>
                      </td>

                      {isCaput ? (
                        <>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${
                              satker.statusCapaianOutput === 'Sudah Terlaporkan'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                            }`}>
                              {satker.statusCapaianOutput}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-extrabold text-slate-900 dark:text-slate-100">
                            {satker.indikator.capaianOutput}%
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 font-bold">
                            {existing ? existing.nilaiTotalIKPA : '-'}
                          </td>
                          <td className="py-3 px-4 font-mono font-extrabold text-sky-700 dark:text-sky-300">
                            {existing ? `${existing.nilaiTotalIKPA} ➔ ${projectedIKPA}` : projectedIKPA}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                            <span className="bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md font-semibold text-xs border border-sky-200 dark:border-sky-800/60">
                              {satker.periodeUpdate || uploadPeriode}
                            </span>
                            {satker.paguAnggaran > 0 && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Pagu: Rp {satker.paguAnggaran.toLocaleString('id-ID')}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold">
                            {satker.indikator.penyerapanAnggaran}%
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              satker.statusCapaianOutput === 'Sudah Terlaporkan' 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' 
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                            }`}>
                              {satker.statusCapaianOutput} ({satker.indikator.capaianOutput}%)
                            </span>
                          </td>
                          <td className="py-3 px-4 font-extrabold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                            {satker.nilaiTotalIKPA}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              satker.nilaiTotalIKPA >= 95 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              satker.nilaiTotalIKPA >= 87.5 ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' :
                              satker.nilaiTotalIKPA >= 70 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {satker.predikat}
                            </span>
                          </td>
                        </>
                      )}

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleRemovePreviewItem(satker.id)}
                          className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded cursor-pointer"
                          title="Hapus baris ini dari import"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Current Dataset Management Info */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Kelola Dataset KPPN Semarang I Aktif ({currentSatkerCount} Satker)
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kosongkan seluruh data Satker jika Anda ingin mengisi data murni dari Excel upload, atau reset ke sampel awal bawaan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onClearAllData && (
            <button
              onClick={onClearAllData}
              className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 transition-colors flex items-center gap-2 cursor-pointer"
              title="Kosongkan seluruh data Satker sehingga menjadi 0 Satker"
            >
              <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Kosongkan Semua Data (0 Satker)</span>
            </button>
          )}

          <button
            onClick={onResetData}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Reset ke Samples Bawaan</span>
          </button>
        </div>
      </div>
      </>
      )}

      {/* Modal Edit Satker Manual */}
      {editingSatker && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-2.5 py-1 rounded-full">
                  MODAL EDIT MANUAL SATKER
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  Edit Data &amp; 8 Indikator IKPA
                </h3>
              </div>
              <button
                onClick={() => setEditingSatker(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kode Satker:</label>
                  <input
                    type="text"
                    value={editingSatker.kodeSatker}
                    onChange={(e) => setEditingSatker({ ...editingSatker, kodeSatker: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                    <span>Password Akses Satker:</span>
                  </label>
                  <input
                    type="text"
                    value={editingSatker.passwordSatker || ''}
                    placeholder="misal: satker123"
                    onChange={(e) => setEditingSatker({ ...editingSatker, passwordSatker: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/40 font-bold text-amber-900 dark:text-amber-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Satker:</label>
                  <input
                    type="text"
                    value={editingSatker.namaSatker}
                    onChange={(e) => setEditingSatker({ ...editingSatker, namaSatker: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kementerian / Lembaga:</label>
                  <input
                    type="text"
                    value={editingSatker.kementerianLembaga}
                    onChange={(e) => setEditingSatker({ ...editingSatker, kementerianLembaga: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status Capaian Output:</label>
                  <select
                    value={editingSatker.statusCapaianOutput}
                    onChange={(e) => setEditingSatker({ ...editingSatker, statusCapaianOutput: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                  >
                    <option value="Sudah Terlaporkan">Sudah Terlaporkan</option>
                    <option value="Belum Terlaporkan">Belum Terlaporkan</option>
                    <option value="Terlambat">Terlambat</option>
                  </select>
                </div>
              </div>

              {/* 8 Indikator Sliders/Inputs */}
              <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">8 Indikator IKPA (Nilai 0 - 100):</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
                      Total Hasil: {hitungTotalIKPA(editingSatker.indikator)} ({getPredikatIKPA(hitungTotalIKPA(editingSatker.indikator))})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Revisi DIPA', key: 'revisiDipa' },
                    { label: 'Deviasi Hal III DIPA', key: 'deviasiHal3Dipa' },
                    { label: 'Penyerapan Anggaran', key: 'penyerapanAnggaran' },
                    { label: 'Belanja Kontraktual', key: 'belanjaKontraktual' },
                    { label: 'Penyelesaian Tagihan', key: 'penyelesaianTagihan' },
                    { label: 'Pengelolaan UP/TUP', key: 'pengelolaanUpTup' },
                    { label: 'Dispensasi SPM', key: 'dispensasiSpm' },
                    { label: 'Capaian Output', key: 'capaianOutput' }
                  ].map((ind) => (
                    <div key={ind.key}>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        {ind.label}: <span className="font-extrabold text-sky-600 font-mono">{(editingSatker.indikator as any)[ind.key]}</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={(editingSatker.indikator as any)[ind.key]}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, Number(e.target.value)));
                          setEditingSatker({
                            ...editingSatker,
                            indikator: {
                              ...editingSatker.indikator,
                              [ind.key]: val
                            }
                          });
                        }}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setEditingSatker(null)}
                  className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEditedSatker}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-2 rounded-xl cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Tambah Satker Baru */}
      {isAddingSatker && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                  TAMBAH SATKER BARU MANUAL
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  Input Form Data Satker Mitra KPPN
                </h3>
              </div>
              <button
                onClick={() => setIsAddingSatker(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kode Satker (6 Digit): *</label>
                  <input
                    type="text"
                    placeholder="misal: 690123"
                    value={newSatkerForm.kodeSatker || ''}
                    onChange={(e) => setNewSatkerForm({ ...newSatkerForm, kodeSatker: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Satker Lengkap: *</label>
                  <input
                    type="text"
                    placeholder="misal: Kantor Pertanahan Kab. Semarang"
                    value={newSatkerForm.namaSatker || ''}
                    onChange={(e) => setNewSatkerForm({ ...newSatkerForm, namaSatker: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kementerian / Lembaga:</label>
                  <input
                    type="text"
                    placeholder="misal: Kementerian Agraria dan Tata Ruang / BPN"
                    value={newSatkerForm.kementerianLembaga || ''}
                    onChange={(e) => setNewSatkerForm({ ...newSatkerForm, kementerianLembaga: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Eselon 1:</label>
                  <input
                    type="text"
                    placeholder="misal: Ditjen Penetapan Hak dan Pendaftaran Tanah"
                    value={newSatkerForm.unitEselon1 || ''}
                    onChange={(e) => setNewSatkerForm({ ...newSatkerForm, unitEselon1: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pagu Anggaran (Rp):</label>
                  <input
                    type="number"
                    value={newSatkerForm.paguAnggaran || 10000000000}
                    onChange={(e) => setNewSatkerForm({ ...newSatkerForm, paguAnggaran: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Realisasi Anggaran (Rp):</label>
                  <input
                    type="number"
                    value={newSatkerForm.realisasiAnggaran || 8000000000}
                    onChange={(e) => setNewSatkerForm({ ...newSatkerForm, realisasiAnggaran: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setIsAddingSatker(false)}
                  className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateNewSatker}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-2 rounded-xl cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambahkan Satker</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Tambah & Edit Master Satker */}
      {isAddingMasterSatker && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                  {editingMasterSatker ? 'EDIT MASTER SATKER' : 'TAMBAH MASTER SATKER BARU'}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {editingMasterSatker ? `Edit Satker ${editingMasterSatker.namaSatker}` : 'Formulir Data Referensi Satker'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Data master ini menjadi acuan utama (Source of Truth) pemfilteran dashboard IKPA dan Capaian Output.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddingMasterSatker(false);
                  setEditingMasterSatker(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveMasterSatkerSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kode Satker (6 Digit): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="misal: 690123"
                    value={masterSatkerForm.kodeSatker || ''}
                    onChange={(e) => {
                      const kode = e.target.value;
                      setMasterSatkerForm({
                        ...masterSatkerForm,
                        kodeSatker: kode,
                        passwordSatker: masterSatkerForm.passwordSatker || `KPPN026#${kode}`
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Satker di Dashboard: <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setMasterSatkerForm({ ...masterSatkerForm, isActive: true })}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition-all ${
                        masterSatkerForm.isActive !== false
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>AKTIF (Tampil)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMasterSatkerForm({ ...masterSatkerForm, isActive: false })}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition-all ${
                        masterSatkerForm.isActive === false
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>NONAKTIF (Sembunyikan)</span>
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Satker Lengkap: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Kantor Pertanahan Kab. Semarang"
                    value={masterSatkerForm.namaSatker || ''}
                    onChange={(e) => setMasterSatkerForm({ ...masterSatkerForm, namaSatker: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kode Bagian Anggaran (BA):
                  </label>
                  <input
                    type="text"
                    placeholder="misal: 018 atau 056"
                    value={masterSatkerForm.kodeBa || ''}
                    onChange={(e) => setMasterSatkerForm({ ...masterSatkerForm, kodeBa: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password Akses Satker:
                  </label>
                  <input
                    type="text"
                    placeholder="misal: KPPN026#690123"
                    value={masterSatkerForm.passwordSatker || ''}
                    onChange={(e) => setMasterSatkerForm({ ...masterSatkerForm, passwordSatker: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/40 font-mono font-bold text-amber-900 dark:text-amber-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kementerian / Lembaga:
                  </label>
                  <input
                    type="text"
                    placeholder="misal: Kementerian Agraria dan Tata Ruang / BPN"
                    value={masterSatkerForm.kementerianLembaga || ''}
                    onChange={(e) => setMasterSatkerForm({ ...masterSatkerForm, kementerianLembaga: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Eselon 1:
                  </label>
                  <input
                    type="text"
                    placeholder="misal: Ditjen Penetapan Hak dan Pendaftaran Tanah"
                    value={masterSatkerForm.unitEselon1 || ''}
                    onChange={(e) => setMasterSatkerForm({ ...masterSatkerForm, unitEselon1: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama PIC / Operator Satker:
                  </label>
                  <input
                    type="text"
                    placeholder="misal: Budi Santoso"
                    value={masterSatkerForm.namaPic || ''}
                    onChange={(e) => setMasterSatkerForm({ ...masterSatkerForm, namaPic: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. HP / WhatsApp PIC:
                  </label>
                  <input
                    type="text"
                    placeholder="misal: 081234567890"
                    value={masterSatkerForm.noHpPic || ''}
                    onChange={(e) => setMasterSatkerForm({ ...masterSatkerForm, noHpPic: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Resmi PIC / Satker:
                  </label>
                  <input
                    type="email"
                    placeholder="misal: satker.semarang@kemenkeu.go.id"
                    value={masterSatkerForm.emailPic || ''}
                    onChange={(e) => setMasterSatkerForm({ ...masterSatkerForm, emailPic: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingMasterSatker(false);
                    setEditingMasterSatker(null);
                  }}
                  className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-2 rounded-xl cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Master Satker</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Global Custom Confirmation Modal */}
      <ModernConfirmModal
        modal={confirmModal}
        onClose={() => setConfirmModal(null)}
        isDark={isDark}
      />

    </div>
  );
};
