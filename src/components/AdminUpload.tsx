import React, { useState, useRef } from 'react';
import { SatkerIKPA, UploadLog, DashboardConfig, Announcement, AppTheme, ExcelUploadHistory, PejabatSertifikasi, MenuVisibilityConfig, PresentationMaterial } from '../types';
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
  processBroadcastExcel
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
  Loader2
} from 'lucide-react';

interface AdminUploadProps {
  satkers?: SatkerIKPA[];
  onApplyNewSatkers: (newSatkers: SatkerIKPA[], appendMode: boolean) => void;
  onUpdateSatker?: (updatedSatker: SatkerIKPA) => void;
  onDeleteSatker?: (id: string) => void;
  onDeleteBatchSatkers?: (ids: string[]) => void;
  onAddSatker?: (newSatker: SatkerIKPA) => void;
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
    fileName: 'Laporan_IKPA_OMSPAN_Mei_2026.xlsx',
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
    fileName: 'Laporan_IKPA_OMSPAN_April_2026.xlsx',
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
    fileName: 'Laporan_IKPA_OMSPAN_Januari_2026.xlsx',
    periode: 'Januari 2026',
    uploadDate: '02 Feb 2026, 10:15 WIB',
    uploadedBy: 'Seksi MSKI KPPN Semarang I',
    satkerCount: INITIAL_SATKER_DATA.length,
    averageIKPA: 86.20,
    notes: 'Laporan IKPA OM-SPAN SAKTI Periode Januari 2026 (Data Excel Resmi)',
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
  onUpdateAdminPin
}) => {
  const isDark = theme === 'dark';

  // Navigation inside Admin Panel
  const [adminTab, setAdminTab] = useState<'upload' | 'crud' | 'perhatian' | 'pejabat-hp' | 'history' | 'settings' | 'announcements' | 'materi-slide' | 'broadcast' | 'logs'>('upload');

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

  // Global Confirmation Modal State (replaces iframe-blocked window.confirm)
  const [isConfirmLoading, setIsConfirmLoading] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  const requestConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmText?: string; cancelText?: string; variant?: 'danger' | 'warning' | 'info' }
  ) => {
    setIsConfirmLoading(false);
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: options?.confirmText || 'Ya, Lanjutkan',
      cancelText: options?.cancelText || 'Batal',
      variant: options?.variant || 'danger',
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

  // Announcement Manager Form State
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
              category: matForm.category,
              description: matForm.description,
              presenter: matForm.presenter,
              date: matForm.date,
              embedUrl: matForm.embedUrl,
              slideCount: matForm.slideCount,
              isPinned: matForm.isPinned,
              isActive: matForm.isActive,
              importance: matForm.importance,
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
        category: matForm.category,
        description: matForm.description,
        presenter: matForm.presenter || 'Seksi MSKI KPPN Semarang I',
        date: matForm.date || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
        embedUrl: matForm.embedUrl,
        type: 'google_slides',
        slideCount: matForm.slideCount || 20,
        isPinned: matForm.isPinned,
        isActive: matForm.isActive,
        importance: matForm.importance,
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
        const result = await processExcelFile(file);
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
      alert(`Berhasil! ${previewPejabatList.length} data Pejabat Perbendaharaan & Sertifikasi telah diterapkan ke sistem dan tersimpan di Arsip Historical.`);
      setPreviewPejabatList([]);
      setUploadLog(null);
      setCurrentFileName('');
    }
  };

  const handleApply = (overwriteActiveDashboard: boolean = true) => {
    if (previewSatkers.length === 0) return;

    const fileNameToUse = currentFileName || `Data_${excelCategory}_${uploadPeriode.replace(/\s+/g, '_')}.xlsx`;
    const avgIKPA = Number((previewSatkers.reduce((acc, s) => acc + s.nilaiTotalIKPA, 0) / previewSatkers.length).toFixed(2));

    const newHistoryItem: ExcelUploadHistory = {
      id: `hist-${Date.now()}`,
      fileName: fileNameToUse,
      periode: uploadPeriode.trim() || 'Agustus 2026',
      uploadDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
      uploadedBy: 'Seksi MSKI KPPN Semarang I',
      satkerCount: previewSatkers.length,
      averageIKPA: avgIKPA,
      notes: uploadNotes.trim() || 'Data hasil upload & pembersihan otomatis Excel SAKTI',
      satkersData: [...previewSatkers],
      category: excelCategory,
      isActive: overwriteActiveDashboard
    };

    if (overwriteActiveDashboard) {
      onApplyNewSatkers(previewSatkers, appendMode);
      const newHistoryList = [newHistoryItem, ...historicalUploads.map(h => ({ ...h, isActive: false }))];
      saveAndApplyHistoricalUploads(newHistoryList);
      addLog(
        'Nimpa Data Dashboard & Arsip', 
        'UPLOAD', 
        `${previewSatkers.length} Satker (${excelCategory}) periode "${uploadPeriode}" diterapkan ke Dashboard Utama & disimpan ke Arsip Historical.`, 
        'SUCCESS'
      );
      alert(`Berhasil! ${previewSatkers.length} data Satker (${excelCategory}) periode "${uploadPeriode}" telah MENIMPA data Dashboard Utama dan tersimpan di Arsip Historical.`);
    } else {
      const newHistoryList = [newHistoryItem, ...historicalUploads];
      saveAndApplyHistoricalUploads(newHistoryList);
      addLog(
        'Simpan Ke Arsip Historical', 
        'UPLOAD', 
        `File "${fileNameToUse}" (${previewSatkers.length} Satker) periode "${uploadPeriode}" disimpan ke Arsip Historical tanpa menimpa data aktif.`, 
        'INFO'
      );
      alert(`File Excel (${excelCategory}) periode "${uploadPeriode}" berhasil DISIMPAN ke Arsip Historical. (Dashboard Utama tidak ditimpa).`);
    }

    setPreviewSatkers([]);
    setUploadLog(null);
    setCurrentFileName('');
  };

  const handleActivateHistorical = (item: ExcelUploadHistory) => {
    requestConfirm(
      'Timpa Data Dashboard Utama',
      `Apakah Anda yakin ingin MENIMPA data Dashboard Utama dengan data Excel periode "${item.periode}" (${item.fileName})?`,
      () => {
        onApplyNewSatkers(item.satkersData, false);
        const newHistoryList = historicalUploads.map(h => ({
          ...h,
          isActive: h.id === item.id
        }));
        saveAndApplyHistoricalUploads(newHistoryList);
        addLog(
          'Nimpa Data Dashboard (Arsip)', 
          'UPLOAD', 
          `Dashboard Utama ditimpa dengan data arsip Excel periode "${item.periode}" (${item.satkerCount} Satker).`, 
          'SUCCESS'
        );
      },
      { confirmText: 'Ya, Timpa Data Dashboard', variant: 'warning' }
    );
  };

  const handleDeleteHistorical = (id: string) => {
    const target = historicalUploads.find(h => h.id === id);
    const newHistoryList = historicalUploads.filter(h => h.id !== id);
    const isNowEmpty = newHistoryList.length === 0;

    requestConfirm(
      'Hapus Arsip Excel',
      `Apakah Anda yakin ingin menghapus arsip Excel periode "${target?.periode || ''}" (${target?.fileName || ''})?${
        target?.isActive || isNowEmpty
          ? '\n\n⚠️ PERHATIAN: Menghapus arsip ini juga akan mengosongkan data Satker di Dashboard Utama.'
          : ' Data ini akan dihapus dari riwayat.'
      }`,
      () => {
        saveAndApplyHistoricalUploads(newHistoryList);
        if ((target?.isActive || isNowEmpty) && onClearAllData) {
          onClearAllData();
        } else if (target?.isActive && newHistoryList.length > 0) {
          const firstRemaining = newHistoryList[0];
          if (firstRemaining.satkersData && firstRemaining.satkersData.length > 0) {
            onApplyNewSatkers(firstRemaining.satkersData, false);
            const updatedWithActive = newHistoryList.map((h, i) => ({
              ...h,
              isActive: i === 0
            }));
            saveAndApplyHistoricalUploads(updatedWithActive);
          } else if (onClearAllData) {
            onClearAllData();
          }
        }
        addLog('Hapus Arsip Excel', 'UPLOAD', `Arsip Excel periode "${target?.periode}" dihapus.`, 'INFO');
      },
      { confirmText: 'Ya, Hapus Arsip', variant: 'danger' }
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
      `Apakah Anda yakin ingin MENGHAPUS TOTAL DATA SATKER (${satkers.length} Satker) DAN MENGHAPUS SEMUA ARSIP FILE EXCEL?\n\nTindakan ini akan mengosongkan dashboard secara menyeluruh (IKPA, Capaian Output, & Perlu Perhatian) menjadi 0 Satker agar Anda dapat menguji dengan file Excel asli milik Anda.`,
      () => {
        if (onClearAllData) {
          onClearAllData();
        }
        saveAndApplyHistoricalUploads([]);
        setCustomBroadcastExcelList([]);
        addLog('Reset Total Data & Arsip', 'SETTINGS', 'Seluruh data Satker dan arsip file Excel dikosongkan secara total.', 'WARNING');
      },
      { confirmText: 'Ya, Bersihkan Total (0 Satker)', variant: 'danger' }
    );
  };

  const handleRemovePreviewItem = (id: string) => {
    setPreviewSatkers(prev => prev.filter(s => s.id !== id));
  };

  // If NOT Authenticated -> Show Front-and-Center Admin Login Hero Card
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className={`rounded-3xl border-2 shadow-2xl overflow-hidden transition-all ${
          isDark 
            ? 'bg-slate-900 border-indigo-500/50 text-slate-100 shadow-indigo-950/50' 
            : 'bg-white border-indigo-200 text-slate-900 shadow-indigo-500/10'
        }`}>
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white relative overflow-hidden border-b border-indigo-500/30">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-400/40 rounded-2xl flex items-center justify-center text-amber-400 shadow-lg shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5" />
                  KPPN Semarang I (026) • Admin Control Center
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                  Otentikasi Modul Administrator
                </h2>
              </div>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
              Gunakan password admin untuk membuka hak akses pengelola: Olah File Excel SAKTI/OM-SPAN, WhatsApp Gateway Broadcast, Manajemen Satker &amp; Pejabat, serta Kontrol Visibilitas Menu.
            </p>
          </div>

          {/* Form & Quick Actions Body */}
          <div className="p-6 sm:p-8 space-y-6">
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
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
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
            {satkers.length}
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
          onClick={() => setAdminTab('pejabat-hp')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'pejabat-hp'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200/60 ring-2 ring-emerald-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <Phone className="w-4 h-4 text-emerald-600" />
          <span>4. Monitoring No HP Pejabat</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            Kontak
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
          <span>3. Arsip Periode</span>
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
          <span>4. Analisis &amp; Simulator IKPA</span>
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
          <span>5. Pengaturan Dashboard</span>
        </button>

        <button
          onClick={() => setAdminTab('announcements')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'announcements'
              ? 'bg-white text-slate-900 shadow-md border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-600" />
          <span>6. Pengumuman</span>
          {(tempConfig.announcements?.length || 0) > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {tempConfig.announcements.length}
            </span>
          )}
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
          <span>7. Kelola Materi Slide Show</span>
          <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {(tempConfig.presentationMaterials?.length || 0)}
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
          <span>7. Broadcast Masif Satker</span>
          <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            Dynamic Mail Merge
          </span>
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
          <span>8. Log Admin</span>
          <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {activityLogs.length}
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

            {/* Setting 3: Menu Visibility Lock (Nonaktifkan Menu Satker) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-rose-600" />
                  Atur Visibilitas Menu Satker (Kunci / Sembunyikan Menu Navigasi):
                </label>
                <p className="text-[11px] text-slate-500 mt-1">
                  Nonaktifkan menu tertentu apabila Admin KPPN ingin seluruh Satker mitra fokus mengerjakan satu tugas utama (misalnya pengisian Capaian Output SAKTI). Menu yang dimatikan tidak akan muncul bagi pengunjung Satker.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { key: 'dashboard', label: 'Dashboard Utama IKPA', desc: 'Overview Rekapitulasi & Peringkat IKPA Satker' },
                  { key: 'capaian-output', label: 'Capaian Output SAKTI', desc: 'Laporan % progress upload output' },
                  { key: 'redflags', label: 'Hal Perlu Diperhatikan', desc: 'Indikator IKPA merah & deviasi' },
                  { key: 'sertifikasi', label: 'Sertifikasi Pejabat', desc: 'Status PTP/PPK/PPSPM' },
                  { key: 'per5-analisis', label: 'Analisis PER-5/PB/2024', desc: 'Simulasi proyeksi nilai IKPA' },
                  { key: 'pengetahuan', label: 'Pengetahuan & Juknis', desc: 'Pusat Juknis & Regulasi SAKTI' },
                  { key: 'announcements', label: 'Pengumuman & Surat', desc: 'Surat Edaran & pengumuman KPPN' },
                  { key: 'materi-slide', label: 'Materi Slide Presentation', desc: 'Galeri PowerPoint & Slide Show (No Download)' },
                  { key: 'aduan', label: 'Lapor Aduan Satker', desc: 'Kanal Layanan & Tiket Aduan Satker' },
                  { key: 'reminder', label: 'Pengingat WA Satker', desc: 'Portal Draf & Broadcast WhatsApp' },
                  { key: 'guide', label: 'Panduan Excel', desc: 'Instruksi format & kolom' }
                ].map((menu) => {
                  const isVisible = tempConfig.menuVisibility?.[menu.key as keyof MenuVisibilityConfig] ?? true;

                  return (
                    <div
                      key={menu.key}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isVisible
                          ? 'bg-white border-emerald-300 ring-1 ring-emerald-500/20 shadow-xs'
                          : 'bg-rose-50/70 border-rose-200'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block flex items-center gap-1.5">
                          {!isVisible && <Lock className="w-3 h-3 text-rose-600 inline" />}
                          {menu.label}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {menu.desc}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setTempConfig(prev => {
                            const currVis = prev.menuVisibility || {
                              'dashboard': true,
                              'capaian-output': true,
                              'redflags': true,
                              'sertifikasi': true,
                              'per5-analisis': true,
                              'pengetahuan': true,
                              'announcements': true,
                              'aduan': true,
                              'reminder': true,
                              'guide': true
                            };
                            return {
                              ...prev,
                              menuVisibility: {
                                ...currVis,
                                [menu.key]: !isVisible
                              }
                            };
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                          isVisible
                            ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-500'
                            : 'bg-rose-600 text-white border-rose-700 hover:bg-rose-500'
                        }`}
                      >
                        {isVisible ? 'Aktif 🟢' : 'Terkunci 🔒'}
                      </button>
                    </div>
                  );
                })}
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
                <div className="sm:col-span-2">
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
      )}

      {adminTab === 'announcements' && (
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
                Gunakan tombol aksi cepat untuk mengaktifkan, menonaktifkan, mengubah prioritas, atau menghapus materi slide.
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
                        : mat.importance === 'Sangat Penting'
                        ? 'bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/20'
                        : mat.isPinned
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        
                        {/* Status Aktif Badge */}
                        <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                          mat.isActive !== false
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {mat.isActive !== false ? '● AKTIF (TAMPIL)' : '○ NON-AKTIF (DISEMBUNYIKAN)'}
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

      {/* Broadcast & Mass Notification Tab */}
      {adminTab === 'broadcast' && (
        <div className="space-y-6">
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-full text-xs font-bold mb-1">
                  <Send className="w-3.5 h-3.5" />
                  PUSAT BROADCAST &amp; NOTIFIKASI MASIF SATKER
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  Pengiriman Pesan WhatsApp &amp; Mail Merge Dinamis ke Pejabat Satker
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Kirim pengingat atau apresiasi secara terfokus ke KPA, PPK, PPSPM, Bendahara, maupun Operator. Gunakan template dinamis atau upload pesan khusus via Excel.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => broadcastFileInputRef.current?.click()}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  title="Unggah Excel berisi Kode Satker & Pesan Khusus Per Satker"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Excel Broadcast Custom</span>
                </button>

                <button
                  onClick={downloadBroadcastExcelTemplate}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Download template format broadcast excel"
                >
                  <Download className="w-3.5 h-3.5 text-rose-500" />
                  <span>Template Broadcast</span>
                </button>
              </div>
            </div>

            {/* Custom Excel Alert Banner */}
            {customBroadcastExcelList.length > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>File Excel Custom Terhubung ({customBroadcastExcelList.length} Pesan Satker Khusus Siap Digunakan)</span>
                </div>
                <button
                  onClick={() => setCustomBroadcastExcelList([])}
                  className="text-emerald-700 dark:text-emerald-300 underline font-extrabold hover:text-rose-600 cursor-pointer"
                >
                  Gunakan Template Biasa
                </button>
              </div>
            )}

            {/* Target Role & Filter Configuration Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Target Roles Card */}
              <div className="bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <User className="w-4 h-4 text-rose-500" />
                  1. Pilih Pejabat &amp; Operator Penerima Target:
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'kpa', label: 'Kuasa Pengguna Anggaran (KPA)' },
                    { key: 'ppk', label: 'Pejabat Pembuat Komitmen (PPK)' },
                    { key: 'ppspm', label: 'Pejabat Penanda Tangan SPM (PPSPM)' },
                    { key: 'bendahara', label: 'Bendahara Pengeluaran' },
                    { key: 'operatorKomitmen', label: 'Operator Komitmen' },
                    { key: 'operatorPembayaran', label: 'Operator Pembayaran' },
                    { key: 'operatorPelaporan', label: 'Operator Pelaporan' },
                    { key: 'operatorGaji', label: 'Operator Gaji' }
                  ].map(role => {
                    const isChecked = selectedBroadcastRoles.includes(role.key);
                    return (
                      <label
                        key={role.key}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer font-bold transition-all ${
                          isChecked
                            ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-400 text-rose-900 dark:text-rose-200'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBroadcastRoles(prev => [...prev, role.key]);
                            } else {
                              setSelectedBroadcastRoles(prev => prev.filter(r => r !== role.key));
                            }
                          }}
                          className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                        <span className="truncate">{role.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Target Satkers Filter Card */}
              <div className="bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-sky-500" />
                  2. Filter Kondisi Satker Target:
                </h4>

                <div className="space-y-2">
                  {[
                    { key: 'ALL', label: 'Semua Satker Mitra KPPN Semarang I', desc: `Total ${satkers.length} Satker` },
                    { key: 'BELUM_OUTPUT', label: 'Khusus Satker Belum/Terlambat Capaian Output', desc: `${satkers.filter(s => s.statusCapaianOutput !== 'Sudah Terlaporkan').length} Satker` },
                    { key: 'IKPA_KURANG', label: 'Khusus Satker Nilai IKPA < 87.5 (Kategori Risko)', desc: `${satkers.filter(s => s.nilaiTotalIKPA < 87.5).length} Satker` },
                    { key: 'PENYERAPAN_RENDAH', label: 'Khusus Satker Realisasi Penyerapan < 70%', desc: `${satkers.filter(s => s.persenPenyerapan < 70).length} Satker` }
                  ].map(opt => (
                    <label
                      key={opt.key}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer font-bold transition-all ${
                        broadcastTargetFilter === opt.key
                          ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-400 text-sky-900 dark:text-sky-200'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="broadcastTargetFilter"
                          checked={broadcastTargetFilter === opt.key}
                          onChange={() => setBroadcastTargetFilter(opt.key as any)}
                          className="text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        <span>{opt.label}</span>
                      </div>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">
                        {opt.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* WhatsApp Gateway Provider & API Token Configuration */}
            <div className="bg-emerald-950/20 dark:bg-emerald-950/40 p-5 rounded-2xl border border-emerald-500/30 dark:border-emerald-500/30 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
                      Integrasi &amp; Pengaturan Token WhatsApp Gateway API
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pilih metode pengiriman pesan: Simulasi Log Konsol, WhatsApp Direct Link, atau kirim langsung via Provider API Gateway (Fonnte, Wablas, Whacenter, Custom Webhook).
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-extrabold text-[11px]">
                  <span>Status: {waGatewayProvider === 'simulasi' ? 'Simulasi Konsol 🟡' : waGatewayProvider === 'wa_me_link' ? 'WA Direct Link 🔵' : waGatewayToken ? 'API Token Siap 🟢' : 'API Token Belum Diisi 🔴'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Provider Select */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                    1. Provider WhatsApp Gateway:
                  </label>
                  <select
                    value={waGatewayProvider}
                    onChange={(e) => {
                      const prov = e.target.value as any;
                      setWaGatewayProvider(prov);
                      if (prov === 'fonnte') setWaGatewayEndpoint('https://api.fonnte.com/send');
                      else if (prov === 'wablas') setWaGatewayEndpoint('https://api.wablas.com/api/v2/send-message');
                      else if (prov === 'whacenter') setWaGatewayEndpoint('https://api.whacenter.com/send');
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                  >
                    <option value="simulasi">🟡 Mode Simulasi (Dry-Run Konsol Log)</option>
                    <option value="wa_me_link">🔵 Mode WA Direct Link (wa.me Multi-Tab)</option>
                    <option value="fonnte">🟢 Fonnte API Gateway (fonnte.com)</option>
                    <option value="wablas">🟢 Wablas API Gateway (wablas.com)</option>
                    <option value="whacenter">🟢 Whacenter API Gateway (whacenter.com)</option>
                    <option value="custom_api">⚙️ Custom REST API Webhook Endpoint</option>
                  </select>
                </div>

                {/* API Token Input */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                    2. API Token / Authorization Secret Key:
                  </label>
                  <input
                    type="password"
                    value={waGatewayToken}
                    onChange={(e) => setWaGatewayToken(e.target.value)}
                    disabled={waGatewayProvider === 'simulasi' || waGatewayProvider === 'wa_me_link'}
                    placeholder={waGatewayProvider === 'simulasi' ? 'Tidak diperlukan untuk simulasi' : 'Contoh: token_abc123xyz...'}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs disabled:opacity-50"
                  />
                </div>

                {/* Endpoint URL Input */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                    3. Endpoint URL REST API Gateway:
                  </label>
                  <input
                    type="text"
                    value={waGatewayEndpoint}
                    onChange={(e) => setWaGatewayEndpoint(e.target.value)}
                    disabled={waGatewayProvider === 'simulasi' || waGatewayProvider === 'wa_me_link'}
                    placeholder="https://api.fonnte.com/send"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Quick Test Bar */}
              <div className="pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="font-bold text-slate-600 dark:text-slate-300 shrink-0">Tes Kirim WA Uji Coba:</span>
                  <input
                    type="text"
                    value={waTestPhone}
                    onChange={(e) => setWaTestPhone(e.target.value)}
                    placeholder="081234567890"
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs w-36"
                  />
                  <button
                    type="button"
                    disabled={isTestingWaConnection}
                    onClick={handleTestWaConnection}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isTestingWaConnection ? 'Mengirim Tes...' : 'Tes Kirim WA'}</span>
                  </button>
                </div>

                <div className="text-slate-500 text-[10px]">
                  💡 <span className="font-bold">Info:</span> Token WhatsApp Gateway Anda disimpan secara aman di memori browser dan digunakan khusus untuk pengiriman pesan ke Satker.
                </div>
              </div>
            </div>

            {/* Template Editor & Presets */}
            <div className="bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  3. Pengaturan Template Pesan Dinamis &amp; Placeholder:
                </h4>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-500 text-[11px]">Preset Template:</span>
                  {[
                    { key: 'preset1', name: 'Rekap IKPA' },
                    { key: 'preset2', name: 'Pengingat Output' },
                    { key: 'preset3', name: 'Apresiasi Baik' },
                    { key: 'preset4', name: 'Peringatan Risk' }
                  ].map(p => (
                    <button
                      key={p.key}
                      onClick={() => handleSelectBroadcastPreset(p.key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${
                        broadcastTemplatePreset === p.key
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Placeholder Badges List */}
              <div className="flex flex-wrap items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                <span className="font-bold text-amber-800 dark:text-amber-300 mr-1 text-[11px]">🏷️ Placeholder Tersedia:</span>
                {[
                  '{NAMA_PEJABAT}',
                  '{PERAN_PEJABAT}',
                  '{NAMA_SATKER}',
                  '{KODE_SATKER}',
                  '{NILAI_IKPA}',
                  '{PREDIKAT}',
                  '{STATUS_OUTPUT}',
                  '{PENYERAPAN}',
                  '{PERIODE_BULAN}'
                ].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setBroadcastTemplateText(prev => prev + ` ${tag}`)}
                    className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-amber-100 dark:hover:bg-amber-950 font-mono text-[10px] px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800 cursor-pointer"
                    title="Klik untuk menyisipkan ke teks"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <textarea
                rows={6}
                value={broadcastTemplateText}
                onChange={(e) => setBroadcastTemplateText(e.target.value)}
                placeholder="Tuliskan template pesan broadcast di sini..."
                className={`w-full p-3.5 rounded-2xl border font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Recipient Live Preview & Interactive Selection / Edit Console */}
            {(() => {
              const allRecipients = getCalculatedBroadcastRecipients();

              const filteredRecipients = allRecipients.filter(rec => {
                if (!recipientSearchQuery.trim()) return true;
                const q = recipientSearchQuery.toLowerCase();
                return (
                  rec.satkerNama.toLowerCase().includes(q) ||
                  rec.satkerKode.toLowerCase().includes(q) ||
                  rec.pejabatNama.toLowerCase().includes(q) ||
                  rec.pejabatNoHp.toLowerCase().includes(q) ||
                  rec.roleLabel.toLowerCase().includes(q)
                );
              });

              const selectedRecipients = filteredRecipients.filter(r => !unselectedRecipientIds.includes(r.id));
              const selectedCount = selectedRecipients.length;
              const isAllChecked = filteredRecipients.length > 0 && selectedCount === filteredRecipients.length;

              const toggleSelectAll = () => {
                if (isAllChecked) {
                  // Deselect all filtered
                  setUnselectedRecipientIds(prev => Array.from(new Set([...prev, ...filteredRecipients.map(r => r.id)])));
                } else {
                  // Select all filtered
                  setUnselectedRecipientIds(prev => prev.filter(id => !filteredRecipients.some(r => r.id === id)));
                }
              };

              const handleUpdateOverride = (id: string, field: 'pejabatNama' | 'pejabatNoHp' | 'renderedMessage', value: string) => {
                setRecipientOverrides(prev => ({
                  ...prev,
                  [id]: {
                    ...prev[id],
                    [field]: value
                  }
                }));
              };

              const handleResetOverride = (id: string) => {
                setRecipientOverrides(prev => {
                  const next = { ...prev };
                  delete next[id];
                  return next;
                });
              };

              return (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Users className="w-5 h-5 text-rose-500" />
                        Daftar Penerima Terkalkulasi ({selectedCount} / {allRecipients.length} Terpilih Siap Kirim)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Centang penerima yang diinginkan. Anda dapat mengedit Nama Pejabat, Nomor WhatsApp, atau Teks Pesan secara langsung jika ada kesalahan data.
                      </p>
                    </div>

                    <button
                      disabled={isSendingBroadcast || selectedCount === 0}
                      onClick={handleStartMassBroadcast}
                      className={`px-6 py-3 rounded-2xl font-black text-xs text-white shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        isSendingBroadcast || selectedCount === 0
                          ? 'bg-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-rose-600/30'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {isSendingBroadcast ? `Mengirim... (${broadcastProgress}%)` : `Kirim Broadcast Masif Sekarang (${selectedCount} Penerima Terpilih)`}
                      </span>
                    </button>
                  </div>

                  {/* Filter & Selection Bar */}
                  <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    
                    {/* Search Input */}
                    <div className="relative w-full sm:w-72">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={recipientSearchQuery}
                        onChange={(e) => setRecipientSearchQuery(e.target.value)}
                        placeholder="Cari Satker, Pejabat, No HP, Role..."
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      {recipientSearchQuery && (
                        <button onClick={() => setRecipientSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Bulk Selection Actions */}
                    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {isAllChecked ? <CheckSquare className="w-3.5 h-3.5 text-rose-500" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{isAllChecked ? 'Hapus Semua Centang' : 'Pilih Semua (' + filteredRecipients.length + ')'}</span>
                      </button>

                      {Object.keys(recipientOverrides).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setRecipientOverrides({})}
                          className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 flex items-center gap-1.5 cursor-pointer text-[11px]"
                          title="Kembalikan semua nama, nomor HP, dan pesan yang pernah diedit ke data asli"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset ({Object.keys(recipientOverrides).length}) Edit Data</span>
                        </button>
                      )}

                      <span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-xl font-mono font-bold text-[11px]">
                        {selectedCount} Terpilih
                      </span>
                    </div>

                  </div>

                  {/* Progress Bar during broadcast */}
                  {isSendingBroadcast && (
                    <div className="space-y-1 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                      <div className="flex justify-between text-xs font-bold text-rose-400">
                        <span>Proses Pengiriman Masif Berjalan...</span>
                        <span>{broadcastProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-300"
                          style={{ width: `${broadcastProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Live Sending Console Logs */}
                  {broadcastLogs.length > 0 && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                          <Activity className="w-3.5 h-3.5" /> LOG KONSOL PENGIRIMAN WA &amp; EMAIL:
                        </span>
                        <button onClick={() => setBroadcastLogs([])} className="text-slate-500 hover:text-slate-300">
                          Bersihkan Log
                        </button>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-300">
                        {broadcastLogs.map((lg, idx) => (
                          <div key={idx} className="border-b border-slate-900/60 pb-0.5">
                            {lg}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recipient Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[450px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={isAllChecked}
                              onChange={toggleSelectAll}
                              className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                          </th>
                          <th className="py-2.5 px-3">Satker Target</th>
                          <th className="py-2.5 px-3 min-w-[180px]">Peran &amp; Edit Nama Pejabat</th>
                          <th className="py-2.5 px-3 min-w-[150px]">Edit No WhatsApp</th>
                          <th className="py-2.5 px-3">Hasil Teks Pesan Ter-render</th>
                          <th className="py-2.5 px-3 text-center">Status &amp; Opsi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredRecipients.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              Tidak ada penerima yang cocok dengan filter / pencarian.
                            </td>
                          </tr>
                        ) : (
                          filteredRecipients.map(rec => {
                            const isSelected = !unselectedRecipientIds.includes(rec.id);
                            return (
                              <tr key={rec.id} className={`transition-all ${isSelected ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-slate-100/50 dark:bg-slate-950/40 opacity-60'}`}>
                                <td className="py-2.5 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setUnselectedRecipientIds(prev => prev.filter(id => id !== rec.id));
                                      } else {
                                        setUnselectedRecipientIds(prev => [...prev, rec.id]);
                                      }
                                    }}
                                    className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                                  />
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-extrabold text-slate-900 dark:text-slate-100">{rec.satkerNama}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{rec.satkerKode} | IKPA: {rec.nilaiIkpa}</div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-rose-600 dark:text-rose-400 mb-0.5">{rec.roleLabel}</div>
                                  <input
                                    type="text"
                                    value={rec.pejabatNama}
                                    onChange={(e) => handleUpdateOverride(rec.id, 'pejabatNama', e.target.value)}
                                    placeholder="Masukkan nama pejabat..."
                                    className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                                  />
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="text-[10px] text-slate-400 mb-0.5 font-bold">No. WA Tujuan:</div>
                                  <input
                                    type="text"
                                    value={rec.pejabatNoHp}
                                    onChange={(e) => handleUpdateOverride(rec.id, 'pejabatNoHp', e.target.value)}
                                    placeholder="081234567890"
                                    className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                  />
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="bg-slate-100 dark:bg-slate-950 p-2 rounded-xl text-[11px] font-sans text-slate-800 dark:text-slate-200 max-w-md line-clamp-2 whitespace-pre-line border border-slate-200 dark:border-slate-800">
                                    {rec.renderedMessage}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCustomMsgModal({
                                      id: rec.id,
                                      recipientName: rec.pejabatNama,
                                      satkerNama: rec.satkerNama,
                                      currentMsg: rec.renderedMessage
                                    })}
                                    className="mt-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit Pesan Khusus Untuk Satker Ini</span>
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {rec.isEdited ? (
                                    <div className="space-y-1">
                                      <span className="inline-block bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] px-2 py-0.5 rounded font-bold">
                                        Diedit
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleResetOverride(rec.id)}
                                        className="block mx-auto text-[10px] text-slate-500 hover:text-rose-600 underline font-bold cursor-pointer"
                                      >
                                        Reset
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-mono">Bawaan</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Modal Edit Custom Message Per Recipient */}
                  {editingCustomMsgModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              <Edit3 className="w-4 h-4 text-rose-500" />
                              Edit Pesan Khusus Recipient
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {editingCustomMsgModal.recipientName} - {editingCustomMsgModal.satkerNama}
                            </p>
                          </div>
                          <button
                            onClick={() => setEditingCustomMsgModal(null)}
                            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Tuliskan Isi Pesan Khusus:
                          </label>
                          <textarea
                            rows={6}
                            value={editingCustomMsgModal.currentMsg}
                            onChange={(e) => setEditingCustomMsgModal({ ...editingCustomMsgModal, currentMsg: e.target.value })}
                            className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-sans text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingCustomMsgModal(null)}
                            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateOverride(editingCustomMsgModal.id, 'renderedMessage', editingCustomMsgModal.currentMsg);
                              setEditingCustomMsgModal(null);
                            }}
                            className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Simpan Pesan Khusus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}

          </div>
        </div>
      )}
      {adminTab === 'crud' && (
        <div className="space-y-6">
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-bold mb-1">
                  <Wrench className="w-3.5 h-3.5" />
                  KELOLA, EDIT MANUAL &amp; HAPUS DATA SATKER
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  Manajemen &amp; Pembaruan Manual Data Satker Dashboard
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Edit nilai indikator, ubah status capaian output, hapus data salah, atau tambahkan satker baru secara langsung tanpa perlu upload ulang file Excel.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => passwordFileInputRef.current?.click()}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  title="Upload Excel berisi Kode Satker, Nama Satker, Password Satker"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Batch Password Excel</span>
                </button>

                <button
                  onClick={downloadPasswordBatchTemplate}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Download template format password satker"
                >
                  <Download className="w-3.5 h-3.5 text-sky-500" />
                  <span>Template Password</span>
                </button>

                <button
                  onClick={() => setIsAddingSatker(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Satker Baru</span>
                </button>

                {selectedSatkerIds.length > 0 && (
                  <button
                    onClick={handleDeleteBatch}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus ({selectedSatkerIds.length}) Terpilih</span>
                  </button>
                )}

                <button
                  onClick={handleClearEverything}
                  className="bg-rose-700 hover:bg-rose-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer border border-rose-500"
                  title="Hapus total seluruh data satker dan arsip file Excel dummy"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Delete All Data &amp; Excel Dummy</span>
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-emerald-50/50 border-emerald-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total Satker Dashboard</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{satkers.length} Satker</span>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-rose-50/50 border-rose-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Satker Berisiko (IKPA &lt; 87.5)</span>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
                  {satkers.filter(s => s.nilaiTotalIKPA < 87.5).length} Satker
                </span>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-50/50 border-amber-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Belum Laporkan Output</span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                  {satkers.filter(s => s.statusCapaianOutput === 'Belum Terlaporkan').length} Satker
                </span>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-sky-50/50 border-sky-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total Pagu Mitra</span>
                <span className="text-sm font-black font-mono text-sky-700 dark:text-sky-300 mt-2 block">
                  Rp {(satkers.reduce((acc, s) => acc + s.paguAnggaran, 0) / 1000000000).toFixed(1)} Miliar
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={crudSearch}
                  onChange={(e) => setCrudSearch(e.target.value)}
                  placeholder="Cari nama satker, kode satker, atau K/L..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={crudPredikatFilter}
                  onChange={(e) => setCrudPredikatFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold"
                >
                  <option value="ALL">Semua Predikat IKPA</option>
                  <option value="SANGAT BAIK">Sangat Baik (≥ 95)</option>
                  <option value="BAIK">Baik (87.5 - 94.99)</option>
                  <option value="CUKUP">Cukup (75 - 87.49)</option>
                  <option value="KURANG">Kurang (&lt; 75)</option>
                </select>

                <select
                  value={crudOutputFilter}
                  onChange={(e) => setCrudOutputFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold"
                >
                  <option value="ALL">Semua Status Output</option>
                  <option value="Sudah Terlaporkan">Sudah Terlaporkan</option>
                  <option value="Belum Terlaporkan">Belum Terlaporkan</option>
                  <option value="Terlambat">Terlambat</option>
                </select>
              </div>
            </div>

            {/* Table of Satkers */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={selectedSatkerIds.length > 0 && selectedSatkerIds.length === filteredCrudSatkers.length}
                        onChange={handleToggleSelectAll}
                        className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Kode &amp; Nama Satker</th>
                    <th className="py-3 px-4">Password Akses Satker</th>
                    <th className="py-3 px-4">Kementerian / Lembaga</th>
                    <th className="py-3 px-4">Pagu &amp; Realisasi</th>
                    <th className="py-3 px-4">Status Output</th>
                    <th className="py-3 px-4">Nilai IKPA</th>
                    <th className="py-3 px-4 text-center">Aksi Edit / Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredCrudSatkers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                        <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
                          {satkers.length === 0 ? 'Daftar Satker Masih Kosong (0 Satker)' : 'Tidak Ada Data Satker Terkait'}
                        </p>
                        <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
                          {satkers.length === 0 
                            ? 'Seluruh data dummy telah dikosongkan. Silakan unggah file Excel Anda di tab "Upload File Excel Baru".'
                            : 'Coba sesuaikan kata kunci pencarian atau filter status.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCrudSatkers.map((satker) => {
                    const isSelected = selectedSatkerIds.includes(satker.id);
                    return (
                      <tr key={satker.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 ${isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/30' : ''}`}>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectSatker(satker.id)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100">{satker.namaSatker}</div>
                          <div className="text-[11px] text-slate-500 font-mono">Kode: {satker.kodeSatker}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                            <KeyRound className="w-3 h-3 text-amber-600" />
                            {satker.passwordSatker || getSatkerDefaultPassword(satker)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{satker.kementerianLembaga}</div>
                          <div className="text-[11px] text-slate-400">{satker.unitEselon1}</div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <div className="font-bold">Rp {satker.paguAnggaran.toLocaleString('id-ID')}</div>
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            Realisasi: {satker.persenPenyerapan}%
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            satker.statusCapaianOutput === 'Sudah Terlaporkan'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/50'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300/50'
                          }`}>
                            {satker.statusCapaianOutput} ({satker.indikator.capaianOutput}%)
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-black text-sm text-slate-900 dark:text-slate-100">{satker.nilaiTotalIKPA}</div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{satker.predikat}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setEditingSatker({ ...satker, indikator: { ...satker.indikator } })}
                              className="bg-sky-600 hover:bg-sky-500 text-white p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Edit Detail Data & Indikator Satker"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>

                            <button
                              onClick={() => handleDeleteSingleSatker(satker)}
                              className="bg-rose-600 hover:bg-rose-500 text-white p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Hapus Satker Dari Dashboard"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* Satker Dalam Perhatian Subtab */}
      {adminTab === 'perhatian' && (
        <div className="space-y-6">
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-full text-xs font-bold mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  KOMPILASI DATA SATKER DALAM PERHATIAN KHUSUS
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  Kompilasi Satker Perlu Pendampingan &amp; Evaluasi Kinerja IKPA
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Kompilasi terpadu seluruh Satker yang memiliki catatan risiko: nilai IKPA &lt; 87.5, Capaian Output belum terlaporkan/0%, deviasi Halaman III DIPA tinggi, atau penyerapan rendah.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => exportSatkersToExcel(satkers.filter(s => s.nilaiTotalIKPA < 87.5 || s.statusCapaianOutput !== 'Sudah Terlaporkan'), 'Kompilasi_Satker_Perhatian_KPPN026.xlsx')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Excel Satker Perhatian</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-rose-50/50 border-rose-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total Satker Dalam Perhatian</span>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
                  {satkers.filter(s => s.nilaiTotalIKPA < 87.5 || s.statusCapaianOutput !== 'Sudah Terlaporkan' || s.persenPenyerapan < 75 || s.indikator.deviasiHal3Dipa < 75).length} Satker
                </span>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-50/50 border-amber-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Capaian Output Belum/Terlambat</span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                  {satkers.filter(s => s.statusCapaianOutput !== 'Sudah Terlaporkan').length} Satker
                </span>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-purple-50/50 border-purple-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Nilai IKPA &lt; 87.5 (Kategori Risiko)</span>
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
                  {satkers.filter(s => s.nilaiTotalIKPA < 87.5).length} Satker
                </span>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-sky-50/50 border-sky-100'}`}>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Deviasi Hal III DIPA Tinggi (&lt;75%)</span>
                <span className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1 block">
                  {satkers.filter(s => s.indikator.deviasiHal3Dipa < 75).length} Satker
                </span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchPerhatianQuery}
                  onChange={(e) => setSearchPerhatianQuery(e.target.value)}
                  placeholder="Cari Kode Satker, Nama Satker, K/L..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="font-bold text-slate-500 text-[11px] shrink-0">Filter Kategori Risiko:</span>
                <select
                  value={filterPerhatianRisk}
                  onChange={(e) => setFilterPerhatianRisk(e.target.value as any)}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                >
                  <option value="ALL">Semua Kategori Risiko ({satkers.length})</option>
                  <option value="BELUM_OUTPUT">🔴 Capaian Output Belum Terlaporkan</option>
                  <option value="IKPA_RENDAH">⚠️ Nilai IKPA &lt; 87.50</option>
                  <option value="DEVIASI_TINGGI">📉 Deviasi Hal III DIPA &lt; 75%</option>
                  <option value="PENYERAPAN_RENDAH">💸 Penyerapan Anggaran &lt; 75%</option>
                </select>
              </div>
            </div>

            {/* Table of Satker Dalam Perhatian */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Satker</th>
                    <th className="py-3 px-4">Kementerian / Lembaga</th>
                    <th className="py-3 px-4 text-center">Score IKPA</th>
                    <th className="py-3 px-4 text-center">Output SAKTI</th>
                    <th className="py-3 px-4">Indikator Kunci &amp; Issues</th>
                    <th className="py-3 px-4 text-center">Kontak PIC / HP</th>
                    <th className="py-3 px-4 text-center">Tindakan / Aksi MSKI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {satkers
                    .filter(s => {
                      if (filterPerhatianRisk === 'BELUM_OUTPUT' && s.statusCapaianOutput === 'Sudah Terlaporkan') return false;
                      if (filterPerhatianRisk === 'IKPA_RENDAH' && s.nilaiTotalIKPA >= 87.5) return false;
                      if (filterPerhatianRisk === 'DEVIASI_TINGGI' && s.indikator.deviasiHal3Dipa >= 75) return false;
                      if (filterPerhatianRisk === 'PENYERAPAN_RENDAH' && s.persenPenyerapan >= 75) return false;

                      if (!searchPerhatianQuery.trim()) {
                        if (filterPerhatianRisk === 'ALL') {
                          return s.nilaiTotalIKPA < 87.5 || s.statusCapaianOutput !== 'Sudah Terlaporkan' || s.persenPenyerapan < 75 || s.indikator.deviasiHal3Dipa < 75;
                        }
                        return true;
                      }
                      const q = searchPerhatianQuery.toLowerCase();
                      return s.namaSatker.toLowerCase().includes(q) || s.kodeSatker.includes(q) || s.kementerianLembaga.toLowerCase().includes(q);
                    })
                    .map(satker => {
                      const pejabats = ensurePejabatOperator(satker);
                      const isOutputMissing = satker.statusCapaianOutput !== 'Sudah Terlaporkan';
                      const isIkpaLow = satker.nilaiTotalIKPA < 87.5;
                      const isDeviasiLow = satker.indikator.deviasiHal3Dipa < 75;
                      const isPenyerapanLow = satker.persenPenyerapan < 75;

                      return (
                        <tr key={satker.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900 dark:text-slate-100">{satker.namaSatker}</div>
                            <div className="text-[11px] text-slate-500 font-mono">Kode: {satker.kodeSatker}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            <div className="font-medium text-xs">{satker.kementerianLembaga}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full font-black text-xs inline-block ${
                              isIkpaLow ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {satker.nilaiTotalIKPA}
                            </span>
                            <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-bold">{satker.predikat}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black inline-block ${
                              isOutputMissing ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {satker.statusCapaianOutput} ({satker.indikator.capaianOutput}%)
                            </span>
                          </td>
                          <td className="py-3 px-4 space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {isOutputMissing && (
                                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                  🔴 Capaian Output 0%
                                </span>
                              )}
                              {isIkpaLow && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                  ⚠️ IKPA &lt; 87.5
                                </span>
                              )}
                              {isDeviasiLow && (
                                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                  📉 Deviasi Hal III ({satker.indikator.deviasiHal3Dipa}%)
                                </span>
                              )}
                              {isPenyerapanLow && (
                                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                  💸 Penyerapan ({satker.persenPenyerapan}%)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-xs">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{pejabats.operatorPelaporan?.nama || satker.namaPic || 'PIC SAKTI'}</div>
                            <div className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px]">{pejabats.operatorPelaporan?.noHp || satker.noHpPic || '-'}</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {(pejabats.operatorPelaporan?.noHp || satker.noHpPic) && (
                                <a
                                  href={`https://wa.me/${(pejabats.operatorPelaporan?.noHp || satker.noHpPic).replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Yth. ${satker.namaSatker} (${satker.kodeSatker}), mohon penyesuaian/pembinaan terkait kinerja IKPA periode ini.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  title="Kirim WhatsApp Pendampingan"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>WA</span>
                                </a>
                              )}

                              <button
                                onClick={() => {
                                  setEditingSatker({ ...satker, indikator: { ...satker.indikator } });
                                  setAdminTab('crud');
                                }}
                                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 p-1.5 rounded-lg text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 cursor-pointer flex items-center gap-1"
                                title="Edit / Detail Data Satker"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-sky-500" />
                                <span>Edit</span>
                              </button>
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
        <>

      {/* Clean Slate & Delete All Data Bar */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 p-5 rounded-3xl border border-rose-500/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="bg-rose-500 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              CLEAN SLATE &amp; MANAJEMEN DATA
            </span>
            <span className="text-slate-300 text-xs font-mono font-bold">
              Status Data Saat Ini: {satkers.length} Satker | {historicalUploads.length} Arsip Excel
            </span>
          </div>
          <h4 className="text-base font-extrabold text-white">
            Kosongkan Data Dummy &amp; Bersihkan Seluruh Arsip Excel
          </h4>
          <p className="text-slate-300 text-xs mt-0.5 max-w-xl">
            Gunakan tombol di sebelah kanan jika Anda ingin membersihkan seluruh data sampel/dummy bawaan sistem dan menguji upload dari file Excel asli Anda dari kondisi 100% bersih.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (satkers.length === 0) {
                alert("Data Satker sudah 0 (kosong).");
                return;
              }
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
            className="bg-rose-800/90 hover:bg-rose-700 text-rose-100 border border-rose-600 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Kosongkan seluruh data satker aktif menjadi 0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan Satker ({satkers.length})</span>
          </button>

          <button
            onClick={handleClearAllHistory}
            className="bg-amber-800/90 hover:bg-amber-700 text-amber-100 border border-amber-600 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Hapus seluruh riwayat arsip file Excel"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Hapus Arsip ({historicalUploads.length})</span>
          </button>

          <button
            onClick={handleClearEverything}
            className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
            title="Hapus total data satker DAN semua arsip Excel sekaligus"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Total (0 Dummy)</span>
          </button>
        </div>
      </div>

      {/* Menu Categories Selector */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-3 py-1 rounded-full">
              KATEGORI MENU EXCEL DEDIKATED
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
              Pilih Jenis Laporan Excel Yang Akan Diunggah
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Setiap menu memiliki template dan validator otomatis khusus sesuai standar Direktorat Jenderal Perbendaharaan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (excelCategory === 'SERTIFIKASI') downloadSertifikasiTemplate();
                else if (excelCategory === 'CAPAIAN_OUTPUT') downloadCapaianOutputTemplate();
                else downloadExcelTemplate();
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Template Excel ({excelCategory})</span>
            </button>
          </div>
        </div>

        {/* 3 Dedicated Excel Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setExcelCategory('IKPA')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              excelCategory === 'IKPA'
                ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-500 ring-2 ring-sky-500/30'
                : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 font-extrabold text-sm text-sky-800 dark:text-sky-300">
              <BarChart3 className="w-5 h-5 text-sky-600" />
              <span>1. Excel IKPA (8 Indikator)</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Data Rekonsiliasi 8 Indikator IKPA dari SAKTI / OM-SPAN KPPN.
            </p>
          </button>

          <button
            onClick={() => setExcelCategory('CAPAIAN_OUTPUT')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              excelCategory === 'CAPAIAN_OUTPUT'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/30'
                : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-800 dark:text-emerald-300">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>2. Excel Capaian Output</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Status Pengisian, Konfirmasi &amp; Progres Output SAKTI Satker.
            </p>
          </button>

          <button
            onClick={() => setExcelCategory('SERTIFIKASI')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              excelCategory === 'SERTIFIKASI'
                ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 font-extrabold text-sm text-amber-800 dark:text-amber-300">
              <Award className="w-5 h-5 text-amber-600" />
              <span>3. Excel Sertifikasi Pejabat</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Daftar KPA, PPK, PPSPM, PTP &amp; Status Sertifikasi PTP/PPK/PPSPM.
            </p>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-sky-600" />
          <span>Area Upload File Excel / CSV ({excelCategory})</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Unggah file hasil ekspor SAKTI/OM-SPAN untuk kategori <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{excelCategory}</strong>. Sistem otomatis membersihkan spasi liar &amp; memperbaiki format.
        </p>

        {excelCategory === 'IKPA' && (
          <div className="mb-4 p-3.5 bg-sky-50/90 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/80 rounded-2xl flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200">
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                <strong>Fitur Unggulan:</strong> Mendukung Ekspor Asli SAKTI/OM-SPAN (Bulanan seperti <strong>Januari</strong>, Februari, Maret, dll). Bulan otomatis terdeteksi dari header Excel.
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
                <strong>Fitur Capaian Output:</strong> Membaca kolom <code>% Data Masuk/Upload</code> (Rekap Kertas Kerja Caput OM-SPAN). Satker dengan nilai <strong>0%</strong> otomatis dikategorikan <strong>Belum Terlaporkan</strong> (Belum Mengirim SAKTI).
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
                title="Menimpa data aktif dashboard utama dan menyimpan arsipnya"
              >
                <RotateCcw className="w-4 h-4" />
                <span>⚡ Nimpa &amp; Aktifkan Di Dashboard Utama</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Kode &amp; Nama Satker</th>
                  <th className="py-3 px-4">Pagu Anggaran</th>
                  <th className="py-3 px-4">Penyerapan</th>
                  <th className="py-3 px-4">Capaian Output</th>
                  <th className="py-3 px-4">Total IKPA</th>
                  <th className="py-3 px-4">Predikat</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {previewSatkers.map((satker) => (
                  <tr key={satker.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{satker.namaSatker}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Kode: {satker.kodeSatker}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      Rp {satker.paguAnggaran.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      {satker.persenPenyerapan}%
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
                    <td className="py-3 px-4 font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      {satker.nilaiTotalIKPA}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {satker.predikat}
                    </td>
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
                ))}
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

      {/* Global Custom Confirmation Modal (replaces native window.confirm for iframe compatibility) */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all animate-in zoom-in-95 duration-200 ${
            isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-slate-950/80' : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/20'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`relative flex items-center justify-center p-4 rounded-2xl shrink-0 shadow-inner ${
                confirmModal.variant === 'danger'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 ring-4 ring-rose-500/10'
                  : confirmModal.variant === 'warning'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ring-4 ring-amber-500/10'
                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 ring-4 ring-indigo-500/10'
              }`}>
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div className="space-y-2 flex-1 pt-0.5">
                <h3 className="text-xl font-black tracking-tight">{confirmModal.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={isConfirmLoading}
                onClick={() => {
                  if (isConfirmLoading) return;
                  setConfirmModal(null);
                }}
                className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {confirmModal.cancelText || 'Batal'}
              </button>

              <button
                disabled={isConfirmLoading}
                onClick={() => {
                  if (isConfirmLoading) return;
                  setIsConfirmLoading(true);
                  const callback = confirmModal.onConfirm;
                  setTimeout(() => {
                    try {
                      callback();
                    } finally {
                      setIsConfirmLoading(false);
                      setConfirmModal(null);
                    }
                  }, 300);
                }}
                className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-black text-white active:scale-95 transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
                  confirmModal.variant === 'danger'
                    ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30'
                    : confirmModal.variant === 'warning'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/30'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-600/30'
                }`}
              >
                {isConfirmLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>{confirmModal.confirmText || 'Ya, Lanjutkan'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
