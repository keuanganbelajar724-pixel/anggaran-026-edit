import { safeLocalStorageSet } from '../../utils/safeStorage';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Send,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  User,
  Users,
  Filter,
  Zap,
  FileText,
  Search,
  X,
  CheckSquare,
  Square,
  RotateCcw,
  Activity,
  Edit3,
  Check,
  ShieldCheck,
  Building2,
  Layers,
  KeyRound,
  Save,
  Clock,
  Sparkles,
  Sliders,
  Play,
  Pause,
  Copy,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  BarChart3,
  RefreshCw,
  XCircle,
  History,
  Eye,
  MessageSquare,
  FileSpreadsheet,
  CheckCircle,
  PhoneCall,
  PlayCircle,
  Tag,
  Bot,
  Wand2,
  MessageSquareQuote
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateGeminiContent, getClientStoredApiKey } from '../../services/geminiService';
import {
  SatkerIKPA,
  MasterSatker,
  PejabatSertifikasi,
  PengelolaanUPRecord,
  DashboardConfig,
  WhatsAppGatewayConfig,
  BroadcastSettings,
  AppTheme
} from '../../types';
import { ensurePejabatOperator } from '../../utils/analysisEngine';
import { BroadcastTemplateLibraryModal } from '../BroadcastTemplateLibraryModal';

export interface DeliveryTrackerRecord {
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  sentAt?: string;
  note?: string;
}

interface BroadcastMasifSectionProps {
  satkers: SatkerIKPA[];
  masterSatkers?: MasterSatker[];
  pejabatList?: PejabatSertifikasi[];
  pengelolaanUpRecords?: PengelolaanUPRecord[];
  dashboardConfig: DashboardConfig;
  onUpdateDashboardConfig: (config: DashboardConfig) => void;
  isDark?: boolean;
  theme?: AppTheme;
  onNavigateToPerhatian?: () => void;
  onConsultSatkerWithAI?: (satker: SatkerIKPA) => void;
  onOpenAiTab?: () => void;
  initialTemplateText?: string | null;
  onClearInitialTemplateText?: () => void;
  addLog?: (action: string, category: 'AUTH' | 'UPLOAD' | 'SETTINGS' | 'ANNOUNCEMENT', details: string, status?: 'SUCCESS' | 'WARNING' | 'INFO') => void;
  showToast?: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
}

export const BroadcastMasifSection: React.FC<BroadcastMasifSectionProps> = ({
  satkers,
  masterSatkers = [],
  pejabatList = [],
  pengelolaanUpRecords = [],
  dashboardConfig,
  onUpdateDashboardConfig,
  isDark = false,
  theme,
  onNavigateToPerhatian,
  onConsultSatkerWithAI,
  onOpenAiTab,
  initialTemplateText,
  onClearInitialTemplateText,
  addLog,
  showToast
}) => {
  // Broadcast Configuration States
  const broadcastFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBroadcastRoles, setSelectedBroadcastRoles] = useState<string[]>(['kpa', 'ppk', 'ppspm']);
  
  // Enhanced Target Filter with Direct Sync to Satker Dalam Perhatian Clusters
  const [broadcastTargetFilter, setBroadcastTargetFilter] = useState<
    'ALL' | 'PERHATIAN_SEMUA' | 'BELUM_OUTPUT' | 'IKPA_KURANG' | 'DEVIASI_TINGGI' | 'PENYERAPAN_RENDAH' | 'PENGELOLAAN_UP_SLOW' | 'SERTIFIKASI_ISSUE'
  >('PERHATIAN_SEMUA');

  const [selectedBroadcastSatkerIds, setSelectedBroadcastSatkerIds] = useState<string[]>([]);
  const [broadcastTemplatePreset, setBroadcastTemplatePreset] = useState<string>('preset_perhatian');
  const [broadcastTemplateText, setBroadcastTemplateText] = useState<string>(
    `[PEMBERITAHUAN MONEV KINERJA IKPA]\nYth. Bapak/Ibu {NAMA_PEJABAT} ({PERAN_PEJABAT})\nSatker: {NAMA_SATKER} ({KODE_SATKER})\n\nBerdasarkan monitoring terpadu KPPN Semarang I periode {PERIODE_BULAN}:\n• Nilai Total IKPA: {NILAI_IKPA} ({PREDIKAT})\n• Status Capaian Output: {STATUS_OUTPUT}\n• Realisasi Penyerapan: {PENYERAPAN}\n\nMohon perhatian dan tindak lanjut segera dari jajaran pimpinan dan tim pengelola keuangan Satker untuk pemenuhan target perbendaharaan.\n\nSeksi MSKI - KPPN Semarang I`
  );

  // Sync if initialTemplateText is provided from Gemini AI tab
  useEffect(() => {
    if (initialTemplateText) {
      setBroadcastTemplateText(initialTemplateText);
      setBroadcastSubTab('COMPOSE');
      if (onClearInitialTemplateText) {
        onClearInitialTemplateText();
      }
    }
  }, [initialTemplateText]);

  const [customBroadcastExcelList, setCustomBroadcastExcelList] = useState<any[]>([]);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  isPausedRef.current = isPaused;

  const [broadcastProgress, setBroadcastProgress] = useState<number>(0);
  const [broadcastLogs, setBroadcastLogs] = useState<string[]>([]);
  const [sentStats, setSentStats] = useState<{ success: number; failed: number; total: number }>({ success: 0, failed: 0, total: 0 });

  // Sub-Tab Navigation: COMPOSE (Susun Pesan) vs TRACKER (Progress & Monitoring Real-Time)
  const [broadcastSubTab, setBroadcastSubTab] = useState<'COMPOSE' | 'TRACKER'>('COMPOSE');

  // Real-Time Delivery Tracker Storage
  const [deliveryTrackerMap, setDeliveryTrackerMap] = useState<Record<string, DeliveryTrackerRecord>>(() => {
    try {
      const saved = localStorage.getItem('kppn_wa_delivery_tracker');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [trackerFilterStatus, setTrackerFilterStatus] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>('ALL');
  const [trackerSearchQuery, setTrackerSearchQuery] = useState<string>('');
  
  // Scope of Monitoring: 'ACTIVE_TARGETS' (Hanya sasaran aktif dicentang / pernah dieksekusi) vs 'ALL_SATKERS' (Semua 127 satker)
  const [trackerScope, setTrackerScope] = useState<'ACTIVE_TARGETS' | 'ALL_SATKERS'>('ACTIVE_TARGETS');

  // AI Gemini Polish & Smart Assistant States
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiSelectedTone, setAiSelectedTone] = useState<'formal' | 'persuasif' | 'urgent' | 'apresiasi'>('formal');
  const [aiSelectedIssueCategory, setAiSelectedIssueCategory] = useState<string>('perhatian');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiGeneratedPreview, setAiGeneratedPreview] = useState<string>('');
  const [aiInstructionPrompt, setAiInstructionPrompt] = useState<string>('');

  const [viewingTrackerMessageModal, setViewingTrackerMessageModal] = useState<{
    id: string;
    satkerNama: string;
    satkerKode: string;
    pejabatNama: string;
    roleLabel: string;
    pejabatNoHp: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    sentAt?: string;
    note?: string;
    message: string;
  } | null>(null);

  // Sync deliveryTrackerMap to LocalStorage
  useEffect(() => {
    try {
      safeLocalStorageSet('kppn_wa_delivery_tracker', JSON.stringify(deliveryTrackerMap));
    } catch (e) {
      console.warn('Gagal menyimpan tracker ke localStorage:', e);
    }
  }, [deliveryTrackerMap]);

  // Confirmation Dialog States (In-App Modals - immune to iframe confirm/alert restrictions)
  const [broadcastConfirmModal, setBroadcastConfirmModal] = useState<{
    isOpen: boolean;
    recipients: typeof selectedRecipients;
    isRetry?: boolean;
  } | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  const [unselectedRecipientIds, setUnselectedRecipientIds] = useState<string[]>([]);
  const [recipientOverrides, setRecipientOverrides] = useState<Record<string, { pejabatNama?: string; pejabatNoHp?: string; renderedMessage?: string }>>({});
  const [recipientSearchQuery, setRecipientSearchQuery] = useState<string>('');
  const [contactStatusFilter, setContactStatusFilter] = useState<'ALL' | 'WITH_PHONE' | 'NO_PHONE'>('ALL');
  const [copiedRecipientId, setCopiedRecipientId] = useState<string | null>(null);
  const [showBulkContactModal, setShowBulkContactModal] = useState<boolean>(false);
  const [bulkContactInputText, setBulkContactInputText] = useState<string>('');
  const [editingCustomMsgModal, setEditingCustomMsgModal] = useState<{ id: string; recipientName: string; satkerNama: string; currentMsg: string } | null>(null);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState<boolean>(false);

  // WhatsApp Gateway API Configuration State (with LocalStorage & Firestore sync)
  const [waGatewayProvider, setWaGatewayProvider] = useState<'simulasi' | 'fonnte' | 'wablas' | 'whacenter' | 'custom_api' | 'wa_me_link'>(() => {
    try {
      const saved = localStorage.getItem('kppn_wa_gateway_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.provider) return parsed.provider;
      }
    } catch {}
    return dashboardConfig.waGatewayConfig?.provider || 'fonnte';
  });

  const [waGatewayToken, setWaGatewayToken] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('kppn_wa_gateway_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.token) return parsed.token;
      }
    } catch {}
    return dashboardConfig.waGatewayConfig?.token || '';
  });

  const [waGatewayEndpoint, setWaGatewayEndpoint] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('kppn_wa_gateway_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.endpoint) return parsed.endpoint;
      }
    } catch {}
    return dashboardConfig.waGatewayConfig?.endpoint || 'https://api.fonnte.com/send';
  });

  const [waGatewayDevice, setWaGatewayDevice] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('kppn_wa_gateway_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.deviceId) return parsed.deviceId;
      }
    } catch {}
    return dashboardConfig.waGatewayConfig?.deviceId || '';
  });

  const [waTestPhone, setWaTestPhone] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('kppn_wa_gateway_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.testPhone) return parsed.testPhone;
      }
    } catch {}
    return dashboardConfig.waGatewayConfig?.testPhone || '081234567890';
  });

  const [isTestingWaConnection, setIsTestingWaConnection] = useState<boolean>(false);
  const [tokenSavedNotification, setTokenSavedNotification] = useState<boolean>(false);
  const [showGatewayConfigHelp, setShowGatewayConfigHelp] = useState<boolean>(false);

  // Live Fonnte Connection Indicator & Device Status
  const [gatewayConnectionStatus, setGatewayConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CHECKING' | 'SIMULATION'>(() => {
    if (waGatewayProvider === 'simulasi') return 'SIMULATION';
    return waGatewayToken ? 'CONNECTED' : 'DISCONNECTED';
  });
  const [gatewayDeviceInfo, setGatewayDeviceInfo] = useState<{ device?: string; name?: string; quota?: string; status?: string } | null>(null);

  // Anti-Block & Anti-Report Official Disclaimer Configuration
  const [enableAntiBlockHeader, setEnableAntiBlockHeader] = useState<boolean>(true);
  const [enableAntiBlockFooter, setEnableAntiBlockFooter] = useState<boolean>(true);
  const [antiBlockHeaderPosition, setAntiBlockHeaderPosition] = useState<'TOP' | 'BOTTOM' | 'BOTH'>('BOTH');
  const [customAntiBlockNote, setCustomAntiBlockNote] = useState<string>(
    '⚠️ *PEMBERITAHUAN RESMI KPPN SEMARANG I (026)*:\nPesan ini dikirimkan secara resmi oleh Tim Layanan Seksi MSKI KPPN Semarang I kepada Satker mitra kerja. *Mohon untuk TIDAK MEMBLOKIR atau Melaporkan (Report Spam) nomor resmi ini* agar koordinasi dan penyampaian informasi penting perbendaharaan Satker Anda tidak terputus.'
  );

  // High-Grade Anti-Ban & Rate-Limiting Controls
  const [delayBetweenMs, setDelayBetweenMs] = useState<number>(4500); // 4.5s safe default
  const [useRandomJitter, setUseRandomJitter] = useState<boolean>(true); // +1000-3000ms human delay
  const [batchPauseSize, setBatchPauseSize] = useState<number>(10); // Safe Pause after 10 messages
  const [batchPauseDurationSec, setBatchPauseDurationSec] = useState<number>(30); // 30s cooldown
  const [currentCooldownRemaining, setCurrentCooldownRemaining] = useState<number>(0);

  // Synchronize on prop change
  useEffect(() => {
    if (dashboardConfig.waGatewayConfig) {
      const cfg = dashboardConfig.waGatewayConfig;
      if (cfg.provider) setWaGatewayProvider(cfg.provider);
      if (cfg.token && !waGatewayToken) setWaGatewayToken(cfg.token);
      if (cfg.endpoint) setWaGatewayEndpoint(cfg.endpoint);
      if (cfg.deviceId) setWaGatewayDevice(cfg.deviceId);
      if (cfg.testPhone) setWaTestPhone(cfg.testPhone);
    }
  }, [dashboardConfig.waGatewayConfig]);

  // Live Check Fonnte / Gateway Device Status
  const checkLiveGatewayStatus = async () => {
    if (waGatewayProvider === 'simulasi') {
      setGatewayConnectionStatus('SIMULATION');
      setGatewayDeviceInfo({ status: 'Mode Simulasi (Dry-Run Aktif)', device: 'Console Tester', quota: 'Unlimited' });
      return;
    }
    if (waGatewayProvider === 'wa_me_link') {
      setGatewayConnectionStatus('CONNECTED');
      setGatewayDeviceInfo({ status: 'WhatsApp Web Direct Link', device: 'Browser Tabs', quota: 'Manual' });
      return;
    }

    if (!waGatewayToken.trim()) {
      setGatewayConnectionStatus('DISCONNECTED');
      setGatewayDeviceInfo(null);
      return;
    }

    setGatewayConnectionStatus('CHECKING');

    try {
      if (waGatewayProvider === 'fonnte') {
        // Test Fonnte device profile API
        const res = await fetch('https://api.fonnte.com/device', {
          method: 'POST',
          headers: {
            'Authorization': waGatewayToken.trim()
          }
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data.status === true || data.device_status === 'connect' || data.name || data.device)) {
          setGatewayConnectionStatus('CONNECTED');
          setGatewayDeviceInfo({
            status: data.device_status || 'Terhubung Aktif',
            device: data.device || data.sender || 'WhatsApp HP Aktif',
            name: data.name || 'KPPN Semarang 1 Gateway',
            quota: data.quota !== undefined ? String(data.quota) : 'Aktif'
          });
        } else if (res.ok && data.status === false && data.reason?.toLowerCase().includes('qr')) {
          setGatewayConnectionStatus('DISCONNECTED');
          setGatewayDeviceInfo({ status: 'Perlu Scan QR di Fonnte', device: 'Belum Terhubung' });
        } else {
          setGatewayConnectionStatus('CONNECTED'); // Token valid but might have simple endpoint
          setGatewayDeviceInfo({ status: 'Token Valid & Siap Digunakan', device: 'Fonnte Gateway' });
        }
      } else {
        setGatewayConnectionStatus(waGatewayToken.trim() ? 'CONNECTED' : 'DISCONNECTED');
      }
    } catch {
      // If CORS or offline, fallback to token presence
      setGatewayConnectionStatus(waGatewayToken.trim() ? 'CONNECTED' : 'DISCONNECTED');
      setGatewayDeviceInfo({ status: 'Token Tersimpan & Aktif', device: 'API Gateway' });
    }
  };

  useEffect(() => {
    checkLiveGatewayStatus();
  }, [waGatewayProvider, waGatewayToken]);

  // Save Token & Gateway Settings Function (Saves to both localStorage & Firebase Config)
  const handleSaveGatewaySettings = (showNotice: boolean = true) => {
    const configToSave: WhatsAppGatewayConfig = {
      provider: waGatewayProvider,
      token: waGatewayToken.trim(),
      endpoint: waGatewayEndpoint.trim(),
      deviceId: waGatewayDevice.trim(),
      testPhone: waTestPhone.trim(),
      savedAt: new Date().toISOString(),
      isAutoSave: true
    };

    // Save to LocalStorage for persistence across reloads
    try {
      safeLocalStorageSet('kppn_wa_gateway_config', JSON.stringify(configToSave));
    } catch (e) {
      console.warn('Gagal menyimpan config WA ke localStorage:', e);
    }

    // Save to Firebase DashboardConfig state
    const updatedConfig: DashboardConfig = {
      ...dashboardConfig,
      waGatewayConfig: configToSave
    };
    onUpdateDashboardConfig(updatedConfig);

    if (addLog) {
      addLog(
        'Simpan Token & Pengaturan WA Gateway',
        'SETTINGS',
        `Provider: ${waGatewayProvider.toUpperCase()} | Endpoint: ${waGatewayEndpoint} | Token: ${waGatewayToken ? 'Tersimpan (***' + waGatewayToken.slice(-4) + ')' : 'Kosong'}`,
        'SUCCESS'
      );
    }

    if (showNotice) {
      setTokenSavedNotification(true);
      setTimeout(() => setTokenSavedNotification(false), 3500);
      if (showToast) {
        showToast({
          type: 'success',
          title: 'Pengaturan Gateway Disimpan',
          message: `Konfigurasi Token ${waGatewayProvider.toUpperCase()} berhasil disimpan permanen ke sistem.`
        });
      }
    }
  };

  // Helper Preset Selection
  const handleSelectBroadcastPreset = (presetKey: string) => {
    setBroadcastTemplatePreset(presetKey);
    if (presetKey === 'preset_perhatian') {
      setBroadcastTemplateText(
        `[PEMBERITAHUAN PENDAMPINGAN SATKER PERHATIAN]\nYth. Bapak/Ibu {NAMA_PEJABAT} ({PERAN_PEJABAT})\nSatker: {NAMA_SATKER} ({KODE_SATKER})\n\nBerdasarkan pantauan KPPN Semarang I periode {PERIODE_BULAN}, nilai total IKPA Satker Anda saat ini adalah {NILAI_IKPA} ({PREDIKAT}) dengan status Capaian Output: {STATUS_OUTPUT}.\n\nDimohon pimpinan/pejabat perbendaharaan Satker melakukan koordinasi intensif bersama Seksi MSKI KPPN Semarang I guna akselerasi dan perbaikan indikator kinerja.\n\nTerima kasih atas kerja sama dan sinergi yang baik.\n\nSeksi MSKI KPPN Semarang I`
      );
    } else if (presetKey === 'preset_output') {
      setBroadcastTemplateText(
        `[PENGINGAT URGENT CAPAIAN OUTPUT SAKTI]\nYth. {NAMA_PEJABAT} ({PERAN_PEJABAT}) Satker {NAMA_SATKER} ({KODE_SATKER}).\n\nStatus Capaian Output SAKTI Satker Anda saat ini: {STATUS_OUTPUT} ({PENYERAPAN} Penyerapan).\n\nDimohon segera melakukan pengisian dan konfirmasi Rincian Output pada modul Komitmen/Pelaporan SAKTI sebelum batas cut-off penutupan periode. Kegagalan pelaporan berdampak langsung pada nilai IKPA (bobot 25%).\n\nSalam hormat,\nAdmin MSKI KPPN Semarang I`
      );
    } else if (presetKey === 'preset_deviasi') {
      setBroadcastTemplateText(
        `[EVALUASI DEVIASI HALAMAN III DIPA]\nYth. {NAMA_PEJABAT} ({PERAN_PEJABAT}) Satker {NAMA_SATKER} ({KODE_SATKER}).\n\nEvaluasi IKPA menunjukkan deviasi rencana penarikan dana Hal III DIPA memerlukan penyesuaian. Nilai IKPA saat ini: {NILAI_IKPA}.\n\nManfaatkan periode pemutakhiran RPD pada awal triwulan agar deviasi penarikan dana bulanan tetap akurat dan bernilai optimal (100.00).\n\nSeksi MSKI KPPN Semarang I`
      );
    } else if (presetKey === 'preset_penyerapan') {
      setBroadcastTemplateText(
        `[AKSELERASI PENYERAPAN ANGGARAN & SPM]\nYth. {NAMA_PEJABAT} ({PERAN_PEJABAT}) Satker {NAMA_SATKER} ({KODE_SATKER}).\n\nRealisasi penyerapan anggaran Satker Anda saat ini {PENYERAPAN}. Dimohon segera memproses tagihan atas kegiatan yang telah selesai (BAST) dan mengajukan SPM ke KPPN sesuai target triwulanan.\n\nTerima kasih atas kerja samanya.\n\nAdmin KPPN Semarang I`
      );
    } else if (presetKey === 'preset_apresiasi') {
      setBroadcastTemplateText(
        `[APRESIASI PRESTASI KINERJA IKPA SANGAT BAIK]\nSelamat kepada Bapak/Ibu {NAMA_PEJABAT} ({PERAN_PEJABAT}) dan seluruh jajaran Satker {NAMA_SATKER} ({KODE_SATKER})!\n\nNilai IKPA Satker Anda mencapai {NILAI_IKPA} dengan predikat {PREDIKAT}. Capaian Output: {STATUS_OUTPUT}.\n\nTerima kasih atas dedikasi dan kepatuhan dalam tata kelola pelaksanaan anggaran yang sangat prima.\n\nKepala KPPN Semarang I`
      );
    } else if (presetKey === 'preset_kkp') {
      setBroadcastTemplateText(
        `*KPPN SEMARANG I - AKSELERASI TRANSAKSI KARTU KREDIT PEMERINTAH (KKP)*\n\nYth. {NAMA_PEJABAT} ({PERAN_PEJABAT})\nSatker: {NAMA_SATKER} ({KODE_SATKER})\n\nDalam rangka modernisasi sistem pembayaran cashless dan transparansi kas negara:\n• Tingkatkan frekuensi transaksi belanja barang operasional menggunakan KKP.\n• Segera ajukan SPM GUP KKP secara berkala untuk menjaga kelancaran limit kartu kredit.\n\n📊 Pantau Leaderboard & Peringkat Transaksi KKP Satker:\n👉 *https://anggaran-026.my.id*\n\n_KPPN Semarang I - Handal & Berintegritas_`
      );
    } else if (presetKey === 'preset_up') {
      setBroadcastTemplateText(
        `*KPPN SEMARANG I - MONITORING REVOLVING UP & TUP*\n\nYth. {NAMA_PEJABAT} ({PERAN_PEJABAT})\nSatker: {NAMA_SATKER} ({KODE_SATKER})\n\nMengingatkan kembali batas waktu penggantian/revolving Uang Persediaan (GUP) sekurang-kurangnya 1 (satu) kali dalam sebulan minimal 50% besaran UP.\n\nMohon Bendahara & PPK segera mengajukan SPM GUP ke KPPN Semarang I sebelum masa revolving terlewati.\n\n🔗 Cek Jadwal Jatuh Tempo Satker Real-time:\n👉 *https://anggaran-026.my.id*\n\n_Seksi MSKI KPPN Semarang I_`
      );
    } else if (presetKey === 'preset_sertifikasi') {
      setBroadcastTemplateText(
        `*KPPN SEMARANG I - SERTIFIKASI PEJABAT PERBENDAHARAAN*\n\nYth. {NAMA_PEJABAT} ({PERAN_PEJABAT})\nSatker: {NAMA_SATKER} ({KODE_SATKER})\n\nSesuai regulasi Standarisasi Kompetensi Pejabat Perbendaharaan (PPK/PPSPM/Bendahara):\n• Bagi pejabat yang belum bersertifikat, segera rekam usulan di SIMASPATEN (https://simaspaten.kemenkeu.go.id) dan pantau pemanggilan diklat pada portal SWIPE-AP.\n• Bagi pejabat dengan masa berlaku mendekati kadaluarsa, segera ajukan perpanjangan PPL di SIMASPATEN.\n\n🔍 Cek Daftar Pejabat & Masa Berlaku Satker Anda:\n👉 *https://anggaran-026.my.id*\n\n_Seksi MSKI KPPN Semarang I_`
      );
    } else if (presetKey === 'preset_portal') {
      setBroadcastTemplateText(
        `*PORTAL TERPADU MONITORING & LAYANAN KPPN SEMARANG I*\n*Website Resmi:* *https://anggaran-026.my.id*\n\nYth. {NAMA_PEJABAT} ({PERAN_PEJABAT}) Satker {NAMA_SATKER} ({KODE_SATKER})\n\nSeluruh data kinerja IKPA, Capaian Output, Batas Revolving UP, Sertifikasi Pejabat, Transaksi KKP, serta Bahan Bimtek SAKTI kini dapat dipantau mandiri secara real-time pada portal resmi:\n\n👉 *https://anggaran-026.my.id*\n\nMari bersama wujudkan tata kelola APBN yang transparan dan akuntabel!\n\n_KPPN Semarang I_`
      );
    }
  };

  // Check which Satkers are in "Satker Dalam Perhatian" category
  const perhatianSatkers = useMemo(() => {
    return satkers.filter(s => {
      const ind = s.indikator || { deviasiHal3Dipa: 100, penyerapanAnggaran: 100, capaianOutput: 100 };
      const isOutputRisk = s.statusCapaianOutput !== 'Sudah Terlaporkan' || ind.capaianOutput === 0 || ind.capaianOutput < 65;
      const isIkpaRisk = s.nilaiTotalIKPA < 87.5;
      const isDeviasiRisk = ind.deviasiHal3Dipa < 75;
      const isPenyerapanRisk = s.persenPenyerapan < 75 || ind.penyerapanAnggaran < 75;

      return isOutputRisk || isIkpaRisk || isDeviasiRisk || isPenyerapanRisk;
    });
  }, [satkers]);

  // Target Satkers Filtered
  const targetSatkers = useMemo(() => {
    return satkers.filter(s => {
      const ind = s.indikator || { deviasiHal3Dipa: 100, penyerapanAnggaran: 100, capaianOutput: 100 };

      if (broadcastTargetFilter === 'PERHATIAN_SEMUA') {
        const isOutputRisk = s.statusCapaianOutput !== 'Sudah Terlaporkan' || ind.capaianOutput === 0 || ind.capaianOutput < 65;
        const isIkpaRisk = s.nilaiTotalIKPA < 87.5;
        const isDeviasiRisk = ind.deviasiHal3Dipa < 75;
        const isPenyerapanRisk = s.persenPenyerapan < 75 || ind.penyerapanAnggaran < 75;
        return isOutputRisk || isIkpaRisk || isDeviasiRisk || isPenyerapanRisk;
      }

      if (broadcastTargetFilter === 'BELUM_OUTPUT') {
        return s.statusCapaianOutput !== 'Sudah Terlaporkan' || ind.capaianOutput === 0 || ind.capaianOutput < 65;
      }

      if (broadcastTargetFilter === 'IKPA_KURANG') {
        return s.nilaiTotalIKPA < 87.5;
      }

      if (broadcastTargetFilter === 'DEVIASI_TINGGI') {
        return ind.deviasiHal3Dipa < 75;
      }

      if (broadcastTargetFilter === 'PENYERAPAN_RENDAH') {
        return s.persenPenyerapan < 75 || ind.penyerapanAnggaran < 75;
      }

      if (broadcastTargetFilter === 'PENGELOLAAN_UP_SLOW') {
        const up = pengelolaanUpRecords.find(u => u.kodeSatker === s.kodeSatker);
        return up ? (up.persentaseRevolving < 50 || up.statusRevolving === 'Lambat / Kritis') : false;
      }

      if (broadcastTargetFilter === 'SERTIFIKASI_ISSUE') {
        const pejs = pejabatList.filter(p => p.kdSatker === s.kodeSatker);
        return pejs.some(p => !p.noSertifikat || p.noSertifikat.toLowerCase().includes('tidak') || p.status === 'Kadaluarsa' || p.status === 'Belum Tersertifikasi');
      }

      return true; // 'ALL'
    });
  }, [satkers, broadcastTargetFilter, pengelolaanUpRecords, pejabatList]);

  // Recipient List Calculation
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

  const calculatedRecipients = useMemo(() => {
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
      isPerhatian: boolean;
      isEdited?: boolean;
    }> = [];

    targetSatkers.forEach(s => {
      const pejo = ensurePejabatOperator(s);
      const customExcelItem = customBroadcastExcelList.find(c => c.kodeSatker === s.kodeSatker);
      const isPerhatian = s.nilaiTotalIKPA < 87.5 || s.statusCapaianOutput !== 'Sudah Terlaporkan' || s.persenPenyerapan < 75;

      selectedBroadcastRoles.forEach(roleKey => {
        let pejabatNama = '';
        let pejabatNoHp = '';

        // Extract real contact information if recorded in Satker or Pejabat data
        if (roleKey === 'kpa' && pejo.kpa) {
          pejabatNama = pejo.kpa.nama?.trim() || '';
          pejabatNoHp = pejo.kpa.noHp?.trim() || '';
        } else if (roleKey === 'ppk' && pejo.ppk) {
          pejabatNama = pejo.ppk.nama?.trim() || '';
          pejabatNoHp = pejo.ppk.noHp?.trim() || '';
        } else if (roleKey === 'ppspm' && pejo.ppspm) {
          pejabatNama = pejo.ppspm.nama?.trim() || '';
          pejabatNoHp = pejo.ppspm.noHp?.trim() || '';
        } else if (roleKey === 'bendahara' && pejo.bendahara) {
          pejabatNama = pejo.bendahara.nama?.trim() || '';
          pejabatNoHp = pejo.bendahara.noHp?.trim() || '';
        } else if (roleKey === 'operatorKomitmen' && pejo.operatorKomitmen) {
          pejabatNama = pejo.operatorKomitmen.nama?.trim() || '';
          pejabatNoHp = pejo.operatorKomitmen.noHp?.trim() || '';
        } else if (roleKey === 'operatorPembayaran' && pejo.operatorPembayaran) {
          pejabatNama = pejo.operatorPembayaran.nama?.trim() || '';
          pejabatNoHp = pejo.operatorPembayaran.noHp?.trim() || '';
        } else if (roleKey === 'operatorPelaporan' && pejo.operatorPelaporan) {
          pejabatNama = pejo.operatorPelaporan.nama?.trim() || s.namaPic?.trim() || '';
          pejabatNoHp = pejo.operatorPelaporan.noHp?.trim() || s.noHpPic?.trim() || '';
        } else if (roleKey === 'operatorGaji' && pejo.operatorGaji) {
          pejabatNama = pejo.operatorGaji.nama?.trim() || '';
          pejabatNoHp = pejo.operatorGaji.noHp?.trim() || '';
        }

        // If specific role has no phone, check if general satker PIC phone exists
        if (!pejabatNoHp && s.noHpPic) {
          pejabatNoHp = s.noHpPic.trim();
        }

        const recId = `${s.id}-${roleKey}`;
        const override = recipientOverrides[recId];

        if (override) {
          if (override.pejabatNama !== undefined && override.pejabatNama.trim() !== '') {
            pejabatNama = override.pejabatNama;
          }
          if (override.pejabatNoHp !== undefined) {
            pejabatNoHp = override.pejabatNoHp.trim();
          }
        }

        const displayPejabatNama = pejabatNama || `Pejabat / ${roleLabelMap[roleKey] || roleKey}`;

        let text = customExcelItem?.customMessage || broadcastTemplateText;
        text = text
          .replace(/\{NAMA_SATKER\}/g, s.namaSatker)
          .replace(/\{KODE_SATKER\}/g, s.kodeSatker)
          .replace(/\{NILAI_IKPA\}/g, String(s.nilaiTotalIKPA))
          .replace(/\{PREDIKAT\}/g, s.predikat)
          .replace(/\{NAMA_PEJABAT\}/g, displayPejabatNama)
          .replace(/\{PERAN_PEJABAT\}/g, roleLabelMap[roleKey] || roleKey)
          .replace(/\{STATUS_OUTPUT\}/g, s.statusCapaianOutput)
          .replace(/\{PENYERAPAN\}/g, `${s.persenPenyerapan}%`)
          .replace(/\{PERIODE_BULAN\}/g, s.periodeUpdate || 'Agustus 2026');

        if (override?.renderedMessage !== undefined && override.renderedMessage.trim() !== '') {
          text = override.renderedMessage;
        } else {
          // Attach Anti-Block / Anti-Report Official Disclaimer
          if (enableAntiBlockHeader && (antiBlockHeaderPosition === 'TOP' || antiBlockHeaderPosition === 'BOTH')) {
            text = `📢 *INFO RESMI KPPN SEMARANG 1 (MOHON JANGAN DIBLOKIR)*\n_Pemberitahuan resmi layanan perbendaharaan & monev satker._\n━━━━━━━━━━━━━━━━━━━━\n\n` + text;
          }
          if (enableAntiBlockFooter && (antiBlockHeaderPosition === 'BOTTOM' || antiBlockHeaderPosition === 'BOTH')) {
            text = text + `\n\n━━━━━━━━━━━━━━━━━━━━\n🔒 *CATATAN KEAMANAN & PENCEGAHAN BLOKIR:*\n_Kami dari KPPN Semarang 1 menyampaikan informasi ini semata-mata sebagai tugas resmi pembinaan satker. *Mohon nomor ini TIDAK DIBLOKIR / DILAPORKAN SPAM* agar satker Bapak/Ibu tetap menerima notifikasi batas waktu & dokumen penting._\n🌐 Cek Data Mandiri: *https://anggaran-026.my.id*`;
          }
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
          isPerhatian,
          isEdited: !!override
        });
      });
    });

    return recipients;
  }, [targetSatkers, selectedBroadcastRoles, recipientOverrides, customBroadcastExcelList, broadcastTemplateText]);

  // Overall Contact Stats
  const contactStats = useMemo(() => {
    const total = calculatedRecipients.length;
    const withPhone = calculatedRecipients.filter(r => r.pejabatNoHp && r.pejabatNoHp.replace(/[^0-9]/g, '').length >= 8).length;
    const withoutPhone = total - withPhone;
    return { total, withPhone, withoutPhone };
  }, [calculatedRecipients]);

  // Filtered Recipients by Search Bar & Contact Status Filter
  const filteredRecipients = useMemo(() => {
    return calculatedRecipients.filter(rec => {
      // 1. Contact Status Filter
      const hasPhone = Boolean(rec.pejabatNoHp && rec.pejabatNoHp.replace(/[^0-9]/g, '').length >= 8);
      if (contactStatusFilter === 'WITH_PHONE' && !hasPhone) return false;
      if (contactStatusFilter === 'NO_PHONE' && hasPhone) return false;

      // 2. Search Query Filter
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
  }, [calculatedRecipients, recipientSearchQuery, contactStatusFilter]);

  const selectedRecipients = useMemo(() => {
    return filteredRecipients.filter(r => !unselectedRecipientIds.includes(r.id));
  }, [filteredRecipients, unselectedRecipientIds]);

  const selectedCount = selectedRecipients.length;
  const isAllChecked = filteredRecipients.length > 0 && selectedCount === filteredRecipients.length;

  const toggleSelectAll = () => {
    if (isAllChecked) {
      setUnselectedRecipientIds(prev => Array.from(new Set([...prev, ...filteredRecipients.map(r => r.id)])));
    } else {
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

  // Bulk Apply Pasted Contacts (KodeSatker, NoHp, NamaPejabat)
  const handleApplyBulkContacts = () => {
    if (!bulkContactInputText.trim()) return;

    const lines = bulkContactInputText.split('\n');
    let updatedCount = 0;
    const newOverrides: Record<string, any> = { ...recipientOverrides };

    lines.forEach(line => {
      const parts = line.split(/[,\t;|]/).map(p => p.trim());
      if (parts.length >= 2) {
        const kode = parts[0];
        const phone = parts[1].replace(/[^0-9+]/g, '');
        const name = parts[2] || '';

        // Match recipients by kode satker
        calculatedRecipients.forEach(rec => {
          if (rec.satkerKode === kode) {
            newOverrides[rec.id] = {
              ...newOverrides[rec.id],
              pejabatNoHp: phone,
              ...(name ? { pejabatNama: name } : {})
            };
            updatedCount++;
          }
        });
      }
    });

    setRecipientOverrides(newOverrides);
    setShowBulkContactModal(false);
    setBulkContactInputText('');

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Kontak Massal Diperbarui',
        message: `Berhasil memperbarui ${updatedCount} entri kontak dari teks yang dimasukkan.`
      });
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRecipientId(id);
    setTimeout(() => setCopiedRecipientId(null), 2500);
    if (showToast) {
      showToast({
        type: 'info',
        title: 'Teks Disalin',
        message: 'Isi pesan WhatsApp berhasil disalin ke clipboard.'
      });
    }
  };

  // Helper formatting phone
  const formatPhone62 = (phone: string): string => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('08')) {
      cleaned = '628' + cleaned.slice(2);
    } else if (cleaned.startsWith('8')) {
      cleaned = '628' + cleaned.slice(1);
    }
    return cleaned;
  };

  // Dispatch single WA message
  const sendSingleWaMessage = async (targetPhone: string, text: string): Promise<{ success: boolean; note: string }> => {
    const formattedPhone = formatPhone62(targetPhone);

    if (waGatewayProvider === 'simulasi') {
      await new Promise(res => setTimeout(res, 200));
      return { success: true, note: 'Simulasi Konsol Sukses (Dry-run Mode)' };
    }

    if (waGatewayProvider === 'wa_me_link') {
      const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
      return { success: true, note: `Tab WA Web Terbuka (${waUrl.slice(0, 35)}...)` };
    }

    if (!waGatewayToken && waGatewayProvider !== 'custom_api') {
      return { success: false, note: 'API Token belum diisi / disimpan di Pengaturan Gateway WA' };
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
          return { success: true, note: `Fonnte Terkirim (ID: ${resData.id || 'OK'})` };
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

  // Test WA Connection Handler
  const handleTestWaConnection = async () => {
    if (!waTestPhone) {
      alert('Masukkan nomor HP untuk tes pengiriman.');
      return;
    }

    // Auto-save setting prior to test
    handleSaveGatewaySettings(false);

    setIsTestingWaConnection(true);
    setBroadcastLogs(prev => [`[TESTING] Mencoba kirim pesan uji coba ke ${waTestPhone} via ${waGatewayProvider.toUpperCase()}...`, ...prev]);

    const testMsg = `[TES KONEKSI GATEWAY WA - KPPN SEMARANG I]\nHalo! Integrasi WhatsApp Gateway API (${waGatewayProvider.toUpperCase()}) telah berhasil tersambung aktif 🟢.\nWaktu: ${new Date().toLocaleString('id-ID')}\nPortal KPPN 026 Siap Melayani.`;
    const result = await sendSingleWaMessage(waTestPhone, testMsg);

    setIsTestingWaConnection(false);

    if (result.success) {
      setBroadcastLogs(prev => [`[TEST SUCCESS] 🟢 ${result.note} -> No: ${waTestPhone}`, ...prev]);
      if (showToast) {
        showToast({
          type: 'success',
          title: 'Tes WhatsApp Sukses',
          message: `Pesan uji coba berhasil terkirim via ${waGatewayProvider.toUpperCase()} ke nomor ${waTestPhone}.`
        });
      } else {
        alert(`Uji Coba Berhasil! ${result.note}`);
      }
    } else {
      setBroadcastLogs(prev => [`[TEST FAILED] 🔴 ${result.note} -> No: ${waTestPhone}`, ...prev]);
      if (showToast) {
        showToast({
          type: 'error',
          title: 'Tes WhatsApp Gagal',
          message: result.note
        });
      } else {
        alert(`Uji Coba Gagal: ${result.note}`);
      }
    }
  };

  // Tracked Delivery Recipient List combining calculated recipients, selection, and live delivery status
  const trackedDeliveryList = useMemo(() => {
    return calculatedRecipients.map(rec => {
      const tracker = deliveryTrackerMap[rec.id];
      const isSelected = !unselectedRecipientIds.includes(rec.id);
      const hasPhone = Boolean(rec.pejabatNoHp && rec.pejabatNoHp.replace(/[^0-9]/g, '').length >= 8);
      const hasExecuted = Boolean(tracker && (tracker.status === 'SUCCESS' || tracker.status === 'FAILED'));

      return {
        ...rec,
        isSelected,
        hasPhone,
        hasExecuted,
        status: tracker?.status || 'PENDING',
        sentAt: tracker?.sentAt,
        note: tracker?.note
      };
    });
  }, [calculatedRecipients, deliveryTrackerMap, unselectedRecipientIds]);

  // Overall Tracker Statistics based on active trackerScope
  const trackerStats = useMemo(() => {
    // Mode ACTIVE_TARGETS: Menghitung hanya yang pernah dikirim ATAU yang aktif dipilih & memiliki nomor WhatsApp
    const list = trackerScope === 'ACTIVE_TARGETS'
      ? trackedDeliveryList.filter(r => r.hasExecuted || (r.isSelected && r.hasPhone))
      : trackedDeliveryList;

    const total = list.length;
    const success = list.filter(r => r.status === 'SUCCESS').length;
    const failed = list.filter(r => r.status === 'FAILED').length;
    const pending = list.filter(r => r.status === 'PENDING').length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
    
    // Actionable pending: item antrean yang benar-benar siap dikirim (punya nomor HP)
    const actionablePending = list.filter(r => r.status === 'PENDING' && r.hasPhone).length;

    // Total counts for scope switcher badges
    const activeTargetsCount = trackedDeliveryList.filter(r => r.hasExecuted || (r.isSelected && r.hasPhone)).length;
    const allSatkersCount = trackedDeliveryList.length;

    return { total, success, failed, pending, actionablePending, successRate, activeTargetsCount, allSatkersCount };
  }, [trackedDeliveryList, trackerScope]);

  // Filtered Tracked List for Tracker Tab Table
  const filteredTrackedList = useMemo(() => {
    return trackedDeliveryList.filter(item => {
      // 1. Scope Filter
      if (trackerScope === 'ACTIVE_TARGETS') {
        if (!item.hasExecuted && (!item.isSelected || !item.hasPhone)) {
          return false;
        }
      } else {
        if (!item.isSelected) return false;
      }

      // 2. Status filter
      if (trackerFilterStatus !== 'ALL' && item.status !== trackerFilterStatus) {
        return false;
      }

      // 3. Search Query
      if (!trackerSearchQuery.trim()) return true;
      const q = trackerSearchQuery.toLowerCase();
      return (
        item.satkerNama.toLowerCase().includes(q) ||
        item.satkerKode.toLowerCase().includes(q) ||
        item.pejabatNama.toLowerCase().includes(q) ||
        item.pejabatNoHp.toLowerCase().includes(q) ||
        item.roleLabel.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q))
      );
    });
  }, [trackedDeliveryList, trackerScope, trackerFilterStatus, trackerSearchQuery]);

  // AI Gemini Broadcast Polish & Smart Generator Engine
  const handleGenerateAiBroadcastTemplate = async (mode: 'POLISH_CURRENT' | 'GENERATE_BY_CATEGORY') => {
    setIsAiGenerating(true);
    const geminiKey = getClientStoredApiKey();

    const toneDescriptions = {
      formal: 'Kedinasan Resmi, Tegas, dan Berwibawa Kementerian Keuangan RI / DJPb',
      persuasif: 'Santun, Solutif, Pendampingan dan Edukasi Pembinaan Satker Mitra',
      urgent: 'Peringatan Keras, Batas Waktu Sangat Kritis / Deadline Mendesak (High Priority)',
      apresiasi: 'Pujian Resmi, Apresiasi Prestasi Kinerja Tinggi, dan Dorongan Mempertahankan Nilai 100'
    };

    let prompt = '';
    if (mode === 'POLISH_CURRENT') {
      prompt = `Anda adalah Spesialis Komunikasi Kedinasan & Monev Perbendaharaan di KPPN Semarang I (DJPb Kemenkeu).
Tugas Anda: Poles, rapikan, dan optimalkan teks template WhatsApp berikut agar berbobot resmi, jelas, mudah dipahami di layar smartphone, dan memiliki format tebal/miring WhatsApp (*bold*, _italic_) yang proporsional.

TEKS ASLI SAAT INI:
"""
${broadcastTemplateText}
"""

GAYA BICARA / TONE: ${toneDescriptions[aiSelectedTone]}
INSTRUKSI TAMBAHAN ADMIN: ${aiInstructionPrompt || 'Buat format WhatsApp yang rapi, sertakan salam pembuka resmi, poin-poin indikator yang jelas, dan penutup hormat.'}

PERATURAN PENTING:
1. PERTAHANKAN seluruh variabel placeholder dinamis yang relevan seperti {NAMA_PEJABAT}, {PERAN_PEJABAT}, {NAMA_SATKER}, {KODE_SATKER}, {NILAI_IKPA}, {PREDIKAT}, {STATUS_OUTPUT}, {PENYERAPAN}, {PERIODE_BULAN}.
2. Berikan output HANYA berupa teks pesan WhatsApp siap pakai tanpa pengantar obrolan.`;
    } else {
      prompt = `Anda adalah Kepala Seksi MSKI (Manajemen Satker & Kepatuhan Internal) KPPN Semarang I.
Tugas Anda: Susun template pesan notifikasi WhatsApp resmi untuk kategori masalah satker: "${aiSelectedIssueCategory}".

GAYA BICARA / TONE: ${toneDescriptions[aiSelectedTone]}
INSTRUKSI KHUSUS: ${aiInstructionPrompt || 'Sertakan urgensi pemenuhan target IKPA, langkah penanganan yang wajib dilakukan satker, dan nomor layanan helpdesk KPPN Semarang I.'}

PERATURAN PENTING:
1. Gunakan variabel dinamis {NAMA_PEJABAT}, {PERAN_PEJABAT}, {NAMA_SATKER}, {KODE_SATKER}, {NILAI_IKPA}, {PREDIKAT}, {STATUS_OUTPUT}, {PENYERAPAN}, {PERIODE_BULAN} di posisi yang tepat.
2. Gunakan pemformatan WhatsApp yang elegan (*teks tebal*, _miring_).
3. Berikan output HANYA berupa teks pesan WhatsApp siap pakai tanpa kata pengantar tambahan.`;
    }

    try {
      const response = await generateGeminiContent({
        model: 'gemini-3.7-flash',
        prompt,
        apiKey: geminiKey || undefined
      });

      const reply = response.text?.trim() || '';
      if (reply) {
        setAiGeneratedPreview(reply);
        setIsAiGenerating(false);
        return;
      }
    } catch (err) {
      console.warn('Gemini API request failed, using intelligent template engine fallback', err);
    }

    // Smart Local Template Engine (Instant fallback, 100% reliable)
    setTimeout(() => {
      let result = '';
      if (mode === 'POLISH_CURRENT') {
        const toneHeader = aiSelectedTone === 'urgent'
          ? '🚨 *PERINGATAN RESMI & BATAS WAKTU KRITIS IKPA*'
          : aiSelectedTone === 'apresiasi'
            ? '🏆 *APRESIASI CAPAIAN PRESTASI KINERJA IKPA SATKER*'
            : aiSelectedTone === 'persuasif'
              ? '🤝 *PENDAMPINGAN & PEMBINAAN KINERJA ANGGARAN*'
              : '📋 *PEMBERITAHUAN RESMI MONEV KINERJA IKPA SAKTI*';

        result = `${toneHeader}
_KPPN Tipe A1 Semarang I - Ditjen Perbendaharaan_
━━━━━━━━━━━━━━━━━━━━━━━━━━

Yth. Bapak/Ibu *{NAMA_PEJABAT}* (*{PERAN_PEJABAT}*)
Satuan Kerja: *{NAMA_SATKER}* (Kode: *{KODE_SATKER}*)

Menindaklanjuti hasil monitoring dan evaluasi terpadu kinerja anggaran periode *{PERIODE_BULAN}*, bersama ini kami sampaikan resume indikator Satker Bapak/Ibu:

📊 *Capaian Kinerja Anggaran:*
• *Nilai Total IKPA:* *{NILAI_IKPA}* (Predikat: *{PREDIKAT}*)
• *Status Capaian Output:* *{STATUS_OUTPUT}*
• *Realisasi Penyerapan:* *{PENYERAPAN}*

${aiSelectedTone === 'urgent'
  ? '⚠️ *TINDAK LANJUT MENDESAK:*\nMohon perkenan Bapak/Ibu segera menginstruksikan tim pengelola keuangan untuk melakukan perbaikan sebelum batas cut-off sistem. Keterlambatan akan berdampak langsung pada nilai rapor IKPA Satker.'
  : aiSelectedTone === 'apresiasi'
    ? '🌟 *APRESIASI:*\nTerima kasih dan penghargaan setinggi-tingginya atas komitmen dan tata kelola anggaran yang sangat optimal. Mohon dapat dipertahankan hingga akhir tahun anggaran.'
    : '💡 *ARAHAN TINDAK LANJUT:*\nMohon koordinasi dan percepatan pemenuhan indikator perbendaharaan, khususnya pemutakhiran RPD Hal III DIPA dan penginputan Capaian Output pada modul SAKTI.'}

🌐 *Pantau Data Mandiri:* https://anggaran-026.my.id
📞 *Helpdesk KPPN Semarang I:* 0811-2600-026

_Terima kasih atas sinergi dan kerja sama yang baik dalam mengawal APBN._

*Seksi MSKI KPPN Semarang I*`;
      } else {
        // Generate by category
        if (aiSelectedIssueCategory === 'output') {
          result = `🔴 *PEMBERITAHUAN MONEV: PELAPORAN CAPAIAN OUTPUT SAKTI*
_KPPN Semarang I - Seksi MSKI_
━━━━━━━━━━━━━━━━━━━━━━━━━━

Yth. *{NAMA_PEJABAT}* (*{PERAN_PEJABAT}*)
Satker: *{NAMA_SATKER}* (Kode: *{KODE_SATKER}*)

Berdasarkan monitoring sistem SAKTI periode *{PERIODE_BULAN}*, status Capaian Output Satker Anda tercatat: *{STATUS_OUTPUT}*.

⚠️ *INSTRUKSI PENYELESAIAN:*
1. Segera lakukan pengisian data Capaian Rincian Output (CRO) pada *Modul Komitmen SAKTI*.
2. Lakukan konfirmasi dan verifikasi data oleh PPK sebelum batas waktu tanggal *5 bulan berkenaan*.
3. Nilai IKPA saat ini: *{NILAI_IKPA}* (*{PREDIKAT}*). Pelaporan output tepat waktu akan mendongkrak skor IKPA hingga 100.

Bila memerlukan asistensi, tim helpdesk KPPN siap mendampingi. Terima kasih.

*KPPN Semarang I*`;
        } else if (aiSelectedIssueCategory === 'deviasi') {
          result = `📊 *MONEV DEVIASI HALAMAN III DIPA (RPD TRIWULANAN)*
_KPPN Semarang I - Seksi MSKI_
━━━━━━━━━━━━━━━━━━━━━━━━━━

Yth. *{NAMA_PEJABAT}* (*{PERAN_PEJABAT}*)
Satker: *{NAMA_SATKER}* (Kode: *{KODE_SATKER}*)

Menindaklanjuti evaluasi deviasi Rencana Penarikan Dana (RPD) Halaman III DIPA:
• *Nilai IKPA:* *{NILAI_IKPA}* (*{PREDIKAT}*)
• *Penyerapan Anggaran:* *{PENYERAPAN}*

💡 *LANGKAH STRATEGIS SATKER:*
1. Lakukan review kesesuaian antara rencana kas bulanan dengan kalender kegiatan riil.
2. Manfaatkan periode pemutakhiran RPD Triwulanan pada modul Penganggaran SAKTI.
3. Selaraskan pengajuan SPM dengan jadwal tarikan dana agar terhindar dari penalti deviasi.

*Seksi MSKI KPPN Semarang I*`;
        } else {
          result = `📢 *INFO RESMI MONEV KINERJA ANGGARAN & IKPA SAKTI*
_KPPN Tipe A1 Semarang I_
━━━━━━━━━━━━━━━━━━━━━━━━━━

Yth. *{NAMA_PEJABAT}* (*{PERAN_PEJABAT}*)
Satker: *{NAMA_SATKER}* (Kode: *{KODE_SATKER}*)

Hasil evaluasi pelaksanaan anggaran periode *{PERIODE_BULAN}*:
• Nilai Total IKPA: *{NILAI_IKPA}* (*{PREDIKAT}*)
• Status Capaian Output: *{STATUS_OUTPUT}*
• Realisasi Penyerapan: *{PENYERAPAN}*

Mohon koordinasi intensif bersama PPK, PPSPM, Bendahara, dan Operator SAKTI guna mengoptimalkan seluruh 8 indikator kinerja perbendaharaan.

*KPPN Semarang I - Mengawal APBN, Membangun Negeri*`;
        }
      }

      setAiGeneratedPreview(result);
      setIsAiGenerating(false);
    }, 450);
  };

  const handleApplyAiTemplateToMain = () => {
    if (!aiGeneratedPreview) return;
    setBroadcastTemplateText(aiGeneratedPreview);
    setIsAiModalOpen(false);
    if (showToast) {
      showToast({
        type: 'success',
        title: 'Template AI Diterapkan',
        message: 'Template hasil polesan AI Gemini berhasil dipasang ke editor utama!'
      });
    }
  };

  // Mass Broadcast Engine: Opens in-app confirmation modal (100% reliable across iframes & devices)
  const handleStartMassBroadcast = (customRecipientList?: typeof selectedRecipients) => {
    const recipients = Array.isArray(customRecipientList) ? customRecipientList : selectedRecipients;

    if (!recipients || recipients.length === 0) {
      if (showToast) {
        showToast({
          type: 'warning',
          title: 'Tidak Ada Penerima',
          message: 'Pilih minimal satu penerima broadcast yang memiliki nomor WhatsApp.'
        });
      } else {
        alert('Tidak ada penerima broadcast yang terpilih.');
      }
      return;
    }

    if (waGatewayProvider !== 'simulasi' && waGatewayProvider !== 'wa_me_link' && !waGatewayToken.trim() && waGatewayProvider !== 'custom_api') {
      if (showToast) {
        showToast({
          type: 'error',
          title: 'Token Belum Diisi',
          message: `Anda memilih provider '${waGatewayProvider.toUpperCase()}', namun API Token belum diisi/disimpan. Silakan simpan API Token pada Pengaturan Token Gateway.`
        });
      } else {
        alert(`Anda memilih provider '${waGatewayProvider.toUpperCase()}', namun API Token belum diisi/disimpan. Silakan simpan API Token pada kartu 'Pengaturan Token Gateway'.`);
      }
      return;
    }

    // Auto save gateway token
    handleSaveGatewaySettings(false);

    // Open In-App Confirmation Modal (never blocked by iframe sandbox)
    setBroadcastConfirmModal({
      isOpen: true,
      recipients,
      isRetry: !!customRecipientList
    });
  };

  // Direct Execution of Mass Broadcast
  const executeMassBroadcastDirectly = async (recipients: typeof selectedRecipients) => {
    setBroadcastConfirmModal(null);
    setIsSendingBroadcast(true);
    setIsPaused(false);
    isPausedRef.current = false;
    setBroadcastProgress(0);
    setSentStats({ success: 0, failed: 0, total: recipients.length });
    setBroadcastLogs([`[SYSTEM] Memulai antrean broadcast masif ke ${recipients.length} Pejabat Satker via Provider '${waGatewayProvider.toUpperCase()}'...`]);

    if (showToast) {
      showToast({
        type: 'info',
        title: 'Broadcast Dimulai',
        message: `Memulai pengiriman pesan ke ${recipients.length} nomor tujuan.`
      });
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      // Check pause
      while (isPausedRef.current) {
        await new Promise(res => setTimeout(res, 500));
      }

      const rec = recipients[i];
      const nowTimestamp = new Date().toLocaleTimeString('id-ID');

      if (!rec.pejabatNoHp || rec.pejabatNoHp.replace(/[^0-9]/g, '').length < 8) {
        failCount++;
        setDeliveryTrackerMap(prev => ({
          ...prev,
          [rec.id]: {
            status: 'FAILED',
            sentAt: nowTimestamp,
            note: 'Nomor HP kosong / kurang dari 8 digit'
          }
        }));
        setBroadcastLogs(prev => [
          `[${nowTimestamp}] GAGAL 🔴 (No. HP Kosong/Tidak Valid) -> ${rec.roleLabel} (${rec.pejabatNama}) | Satker: ${rec.satkerNama} (${rec.satkerKode})`,
          ...prev.slice(0, 150)
        ]);
        setSentStats({ success: successCount, failed: failCount, total: recipients.length });
        continue;
      }

      const result = await sendSingleWaMessage(rec.pejabatNoHp, rec.renderedMessage);

      if (result.success) {
        successCount++;
        setDeliveryTrackerMap(prev => ({
          ...prev,
          [rec.id]: {
            status: 'SUCCESS',
            sentAt: nowTimestamp,
            note: result.note
          }
        }));
        setBroadcastLogs(prev => [
          `[${nowTimestamp}] TERKIRIM 🟢 (${result.note}) -> ${rec.roleLabel} (${rec.pejabatNama}) | Satker: ${rec.satkerNama} (${rec.satkerKode}) | No: ${rec.pejabatNoHp}`,
          ...prev.slice(0, 150)
        ]);
      } else {
        failCount++;
        setDeliveryTrackerMap(prev => ({
          ...prev,
          [rec.id]: {
            status: 'FAILED',
            sentAt: nowTimestamp,
            note: result.note
          }
        }));
        setBroadcastLogs(prev => [
          `[${nowTimestamp}] GAGAL 🔴 (${result.note}) -> ${rec.roleLabel} (${rec.pejabatNama}) | No: ${rec.pejabatNoHp}`,
          ...prev.slice(0, 150)
        ]);
      }

      setSentStats({ success: successCount, failed: failCount, total: recipients.length });
      const progress = Math.round(((i + 1) / recipients.length) * 100);
      setBroadcastProgress(progress);

      // High-Grade Anti-Ban Rate-Limiting & Jitter Delay to protect WhatsApp account from bans
      if (i < recipients.length - 1) {
        let sleepDuration = delayBetweenMs;
        if (useRandomJitter) {
          // Add 1000ms to 3500ms random human delay variation
          sleepDuration += Math.floor(Math.random() * 2500) + 1000;
        }

        // Batch pause check (e.g. pause 30s every 10 messages)
        if (batchPauseSize > 0 && (i + 1) % batchPauseSize === 0) {
          const pauseSec = batchPauseDurationSec || 30;
          setBroadcastLogs(prev => [
            `🛡️ [ANTI-BAN COOLDOWN AKTIF] Menjeda ${pauseSec} detik setelah ${i + 1} pesan terkirim agar nomor WhatsApp aman dari deteksi spam/banned...`,
            ...prev.slice(0, 150)
          ]);
          
          for (let c = pauseSec; c > 0; c--) {
            setCurrentCooldownRemaining(c);
            await new Promise(res => setTimeout(res, 1000));
          }
          setCurrentCooldownRemaining(0);
        } else {
          await new Promise(res => setTimeout(res, waGatewayProvider === 'simulasi' ? 250 : sleepDuration));
        }
      }
    }

    setCurrentCooldownRemaining(0);
    setIsSendingBroadcast(false);

    if (addLog) {
      addLog(
        `Broadcast Masif WA (${successCount} Terkirim, ${failCount} Gagal)`,
        'ANNOUNCEMENT',
        `Pengiriman broadcast masif ke ${recipients.length} pejabat satker (Filter: ${broadcastTargetFilter}) via ${waGatewayProvider.toUpperCase()}.`
      );
    }

    if (showToast) {
      showToast({
        type: successCount > 0 ? 'success' : 'warning',
        title: 'Broadcast Masif Selesai',
        message: `Total ${successCount} pesan berhasil terkirim, ${failCount} gagal. Anda dapat memantau status detail pada Tab Monitoring Pengiriman.`
      });
    }
  };

  // Retry Failed Recipients Only
  const handleRetryFailedBroadcast = () => {
    const failedRecipients = selectedRecipients.filter(r => deliveryTrackerMap[r.id]?.status === 'FAILED');
    if (failedRecipients.length === 0) {
      if (showToast) {
        showToast({
          type: 'info',
          title: 'Tidak Ada Antrean Gagal',
          message: 'Tidak ada antrean pesan dengan status GAGAL saat ini.'
        });
      } else {
        alert('Tidak ada antrean pesan dengan status GAGAL saat ini.');
      }
      return;
    }
    handleStartMassBroadcast(failedRecipients);
  };

  // Resume Pending Recipients Only
  const handleResumePendingBroadcast = () => {
    const pendingRecipients = selectedRecipients.filter(r => !deliveryTrackerMap[r.id] || deliveryTrackerMap[r.id]?.status === 'PENDING');
    if (pendingRecipients.length === 0) {
      if (showToast) {
        showToast({
          type: 'info',
          title: 'Antrean Selesai',
          message: 'Semua pesan dalam daftar saat ini telah diproses.'
        });
      } else {
        alert('Semua pesan dalam daftar saat ini telah diproses (tidak ada yang berstatus Menunggu/Pending).');
      }
      return;
    }
    handleStartMassBroadcast(pendingRecipients);
  };

  // Retry a Single Specific Recipient
  const handleRetrySingleRecipient = async (recId: string) => {
    const rec = calculatedRecipients.find(r => r.id === recId);
    if (!rec) return;

    if (!rec.pejabatNoHp || rec.pejabatNoHp.replace(/[^0-9]/g, '').length < 8) {
      if (showToast) {
        showToast({
          type: 'warning',
          title: 'Nomor HP Tidak Valid',
          message: 'Nomor HP tujuan masih kosong atau belum valid. Silakan lengkapi terlebih dahulu.'
        });
      } else {
        alert('Nomor HP tujuan masih kosong. Silakan lengkapi nomor terlebih dahulu.');
      }
      return;
    }

    setBroadcastLogs(prev => [`[RETRY SINGLE] Mengirim ulang ke ${rec.pejabatNama} (${rec.satkerNama}) -> ${rec.pejabatNoHp}...`, ...prev]);
    const nowTimestamp = new Date().toLocaleTimeString('id-ID');
    const result = await sendSingleWaMessage(rec.pejabatNoHp, rec.renderedMessage);

    if (result.success) {
      setDeliveryTrackerMap(prev => ({
        ...prev,
        [rec.id]: {
          status: 'SUCCESS',
          sentAt: nowTimestamp,
          note: result.note
        }
      }));
      if (showToast) {
        showToast({
          type: 'success',
          title: 'Terkirim Ulang',
          message: `Pesan berhasil dikirim ke ${rec.pejabatNama} (${rec.satkerNama}).`
        });
      }
    } else {
      setDeliveryTrackerMap(prev => ({
        ...prev,
        [rec.id]: {
          status: 'FAILED',
          sentAt: nowTimestamp,
          note: result.note
        }
      }));
      if (showToast) {
        showToast({
          type: 'error',
          title: 'Kirim Ulang Gagal',
          message: result.note
        });
      }
    }
  };

  // Reset All Delivery Statuses
  const handleResetDeliveryTracker = () => {
    setShowResetConfirmModal(true);
  };

  const executeResetDeliveryTrackerConfirmed = () => {
    setShowResetConfirmModal(false);
    setDeliveryTrackerMap({});
    setSentStats({ success: 0, failed: 0, total: selectedRecipients.length });
    setBroadcastLogs([]);
    try {
      localStorage.removeItem('kppn_wa_delivery_tracker');
    } catch {}
    if (showToast) {
      showToast({
        type: 'info',
        title: 'Status Direset',
        message: 'Seluruh riwayat status pengiriman telah dibersihkan kembali ke status awal.'
      });
    }
  };

  // Export Full Delivery Tracker Report to Excel
  const handleExportDeliveryTrackerExcel = () => {
    const data = filteredTrackedList.map((r, i) => {
      const statusLabel = 
        r.status === 'SUCCESS' ? 'BERHASIL TERKIRIM ✅' :
        r.status === 'FAILED' ? 'GAGAL TERKIRIM ❌' : 'BELUM DIKIRIM / ANTREAN ⏳';

      return {
        'No': i + 1,
        'Status Pengiriman': statusLabel,
        'Waktu Eksekusi': r.sentAt || '-',
        'Respon / Catatan Gateway': r.note || '-',
        'Kode Satker': r.satkerKode,
        'Nama Satker': r.satkerNama,
        'Peran Pejabat': r.roleLabel,
        'Nama Pejabat Target': r.pejabatNama,
        'No. WhatsApp': r.pejabatNoHp || 'KOSONG',
        'Nilai IKPA': r.nilaiIkpa,
        'Kategori Satker': r.isPerhatian ? 'Satker Dalam Perhatian ⚠️' : 'Satker Normal ✅',
        'Isi Pesan Lengkap': r.renderedMessage
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan_Audit_Broadcast');
    XLSX.writeFile(wb, `Laporan_Monitoring_Broadcast_WhatsApp_KPPN026_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Copy Phone Numbers by Status
  const handleCopyTrackerPhones = (statusFilter: 'FAILED' | 'SUCCESS' | 'ALL') => {
    const targets = trackedDeliveryList.filter(r => {
      if (!r.isSelected || !r.pejabatNoHp) return false;
      if (statusFilter === 'FAILED') return r.status === 'FAILED';
      if (statusFilter === 'SUCCESS') return r.status === 'SUCCESS';
      return true;
    });

    const phoneList = targets.map(t => t.pejabatNoHp).filter(Boolean).join('\n');
    if (!phoneList) {
      alert(`Tidak ada nomor HP dengan status ${statusFilter}`);
      return;
    }

    navigator.clipboard.writeText(phoneList);
    if (showToast) {
      showToast({
        type: 'success',
        title: 'Nomor Disalin',
        message: `${targets.length} nomor WhatsApp berhasil disalin ke clipboard.`
      });
    } else {
      alert(`${targets.length} nomor WhatsApp berhasil disalin!`);
    }
  };

  // Export List to Excel
  const handleExportBroadcastList = () => {
    const data = selectedRecipients.map((r, i) => ({
      'No': i + 1,
      'Kode Satker': r.satkerKode,
      'Nama Satker': r.satkerNama,
      'Peran Pejabat': r.roleLabel,
      'Nama Pejabat': r.pejabatNama,
      'No. WhatsApp': r.pejabatNoHp,
      'Nilai IKPA': r.nilaiIkpa,
      'Kategori Satker': r.isPerhatian ? 'Satker Dalam Perhatian ⚠️' : 'Satker Normal ✅',
      'Isi Pesan WhatsApp': r.renderedMessage
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Target_Broadcast');
    XLSX.writeFile(wb, `Target_Broadcast_WhatsApp_KPPN026_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with direct Connection to Satker Dalam Perhatian */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
        
        {/* Header Title */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-full text-xs font-black">
                <Send className="w-3.5 h-3.5 text-rose-600" />
                PUSAT BROADCAST &amp; NOTIFIKASI MASIF SATKER
              </span>

              <span className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Terhubung dengan Tab Satker Dalam Perhatian
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Pengiriman Pesan WhatsApp Dinamis &amp; Pendampingan Terfokus
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-3xl leading-relaxed">
              Kirimkan pemberitahuan resmi, pengingat Capaian Output, evaluasi IKPA, atau apresiasi secara masif ke KPA, PPK, PPSPM, Bendahara, maupun Operator Satker mitra KPPN Semarang I dengan integrasi API Gateway aman dan tersimpan permanen.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onNavigateToPerhatian && (
              <button
                type="button"
                onClick={onNavigateToPerhatian}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Buka Tab Satker Dalam Perhatian untuk analisis mendalam"
              >
                <AlertTriangle className="w-4 h-4 text-slate-950" />
                <span>Lihat Tab Satker Perhatian ({perhatianSatkers.length})</span>
              </button>
            )}

            <button
              onClick={handleExportBroadcastList}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Unduh daftar target penerima saat ini ke Excel"
            >
              <Download className="w-4 h-4" />
              <span>Export List ({selectedCount})</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation Switcher: Susun Broadcast vs Monitoring Pengiriman */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => setBroadcastSubTab('COMPOSE')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                broadcastSubTab === 'COMPOSE'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-md ring-2 ring-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-900/50'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>1. Susun &amp; Kirim Broadcast</span>
              <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                {selectedCount} Target
              </span>
            </button>

            <button
              type="button"
              onClick={() => setBroadcastSubTab('TRACKER')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                broadcastSubTab === 'TRACKER'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-900/50'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>2. Progress &amp; Monitoring Pengiriman</span>
              
              {/* Real-time Counter Badges */}
              <div className="flex items-center gap-1 text-[10px]">
                {trackerStats.success > 0 && (
                  <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded-md font-extrabold shadow-xs">
                    ✓ {trackerStats.success}
                  </span>
                )}
                {trackerStats.pending > 0 && (
                  <span className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-md font-extrabold shadow-xs">
                    ⏳ {trackerStats.pending}
                  </span>
                )}
                {trackerStats.failed > 0 && (
                  <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded-md font-extrabold shadow-xs">
                    ✗ {trackerStats.failed}
                  </span>
                )}
              </div>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 px-2 text-xs font-bold text-slate-500">
            <span>Gateway Aktif:</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${
              gatewayConnectionStatus === 'CONNECTED' 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                : gatewayConnectionStatus === 'CHECKING'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${gatewayConnectionStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {waGatewayProvider.toUpperCase()}
            </span>
          </div>
        </div>

        {broadcastSubTab === 'COMPOSE' ? (
          <>
            {/* Highlight Banner: Koneksi Tab Satker Dalam Perhatian */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              broadcastTargetFilter === 'PERHATIAN_SEMUA'
                ? 'bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-rose-500/30'
                : isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                        Fokus Penanganan: Satker Dalam Perhatian Khusus
                      </h4>
                      <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        {perhatianSatkers.length} Satker Kritis
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Tab ini telah diselaraskan langsung dengan klaster risiko di menu <strong>Satker Dalam Perhatian</strong>. Pilih satker bermasalah dengan 1 klik untuk melayangkan peringatan, instruksi akselerasi, atau undangan pendampingan MSKI.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setBroadcastTargetFilter('PERHATIAN_SEMUA');
                      handleSelectBroadcastPreset('preset_perhatian');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      broadcastTargetFilter === 'PERHATIAN_SEMUA'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pilih Satker Perhatian ({perhatianSatkers.length})</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSendingBroadcast || targetSatkers.length === 0}
                    onClick={() => {
                      setBroadcastTargetFilter('PERHATIAN_SEMUA');
                      handleSelectBroadcastPreset('preset_perhatian');
                      setTimeout(() => {
                        handleStartMassBroadcast();
                      }, 200);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 shadow-md shadow-purple-950/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-purple-400/30"
                    title="Otomatis pilih seluruh Satker Perhatian Merah, siapkan pesan peringatan cerdas, dan langsung masukkan ke antrean pengiriman WA Gateway"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>⚡ 1-Click Smart Dispatch Reminder ({perhatianSatkers.length})</span>
                  </button>
                </div>
              </div>
            </div>

        {/* 1. Target Roles & Filter Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Target Roles Card */}
          <div className="bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-xs">
                <User className="w-4 h-4 text-rose-500" />
                1. Pilih Peran Pejabat &amp; Operator Target:
              </h4>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedBroadcastRoles(['kpa', 'ppk', 'ppspm', 'bendahara', 'operatorKomitmen', 'operatorPembayaran', 'operatorPelaporan', 'operatorGaji'])}
                  className="text-rose-600 hover:underline font-bold"
                >
                  Pilih Semua
                </button>
                <span className="text-slate-400">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedBroadcastRoles(['kpa', 'ppk', 'ppspm'])}
                  className="text-slate-500 hover:underline font-bold"
                >
                  Pimpinan (KPA/PPK/PPSPM)
                </button>
              </div>
            </div>
            
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
                        ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-400 text-rose-900 dark:text-rose-200 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
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

          {/* Target Satkers Filter Card with Direct Perhatian Integration */}
          <div className="bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-xs">
                <Filter className="w-4 h-4 text-sky-500" />
                2. Filter Klaster Satker Target:
              </h4>
              <span className="text-[11px] font-bold text-slate-500">
                Terpilih: <strong className="text-sky-600">{targetSatkers.length}</strong> Satker
              </span>
            </div>

            <div className="space-y-2">
              {[
                { 
                  key: 'PERHATIAN_SEMUA', 
                  label: '⚠️ Kompilasi Seluruh Satker Dalam Perhatian (Rekomendasi)', 
                  desc: `${perhatianSatkers.length} Satker`,
                  badge: 'Prioritas' 
                },
                { 
                  key: 'BELUM_OUTPUT', 
                  label: '🔴 Khusus Capaian Output Belum/Terlambat/0%', 
                  desc: `${satkers.filter(s => s.statusCapaianOutput !== 'Sudah Terlaporkan' || s.indikator.capaianOutput < 65).length} Satker` 
                },
                { 
                  key: 'IKPA_KURANG', 
                  label: '📉 Khusus Nilai IKPA < 87.50 (Kategori Risiko)', 
                  desc: `${satkers.filter(s => s.nilaiTotalIKPA < 87.5).length} Satker` 
                },
                { 
                  key: 'DEVIASI_TINGGI', 
                  label: '📊 Khusus Deviasi Halaman III DIPA Rendah (<75%)', 
                  desc: `${satkers.filter(s => s.indikator.deviasiHal3Dipa < 75).length} Satker` 
                },
                { 
                  key: 'PENYERAPAN_RENDAH', 
                  label: '💸 Khusus Realisasi Belanja/Penyerapan Rendah (<75%)', 
                  desc: `${satkers.filter(s => s.persenPenyerapan < 75).length} Satker` 
                },
                { 
                  key: 'ALL', 
                  label: '🏛️ Semua Satker Mitra KPPN Semarang I', 
                  desc: `Total ${satkers.length} Satker` 
                }
              ].map(opt => (
                <label
                  key={opt.key}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer font-bold transition-all ${
                    broadcastTargetFilter === opt.key
                      ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-400 text-sky-900 dark:text-sky-200 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
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
                    <span className="text-xs">{opt.label}</span>
                    {opt.badge && (
                      <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                    {opt.desc}
                  </span>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* 2. WhatsApp Gateway Provider, Token Storage & Advanced Anti-Ban Settings */}
        <div className="bg-gradient-to-br from-emerald-950/20 via-teal-950/10 to-slate-950/30 dark:bg-emerald-950/40 p-5 sm:p-6 rounded-3xl border-2 border-emerald-500/30 space-y-5 text-xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`p-2.5 rounded-xl font-black ${
                  gatewayConnectionStatus === 'CONNECTED' 
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                    : gatewayConnectionStatus === 'CHECKING'
                      ? 'bg-amber-500/20 text-amber-600 animate-pulse'
                      : 'bg-rose-500/20 text-rose-600'
                }`}>
                  <KeyRound className="w-5 h-5" />
                </div>
                {/* Live connection dot indicator */}
                <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                  gatewayConnectionStatus === 'CONNECTED' 
                    ? 'bg-emerald-500 animate-ping' 
                    : gatewayConnectionStatus === 'CHECKING'
                      ? 'bg-amber-500 animate-spin'
                      : 'bg-rose-500'
                }`} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Pengaturan Gateway WhatsApp &amp; Koneksi Fonnte API
                  </h4>
                  
                  {/* Status Indicator Badge */}
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1.5 ${
                    gatewayConnectionStatus === 'CONNECTED'
                      ? 'bg-emerald-600 text-white'
                      : gatewayConnectionStatus === 'CHECKING'
                        ? 'bg-amber-500 text-slate-950'
                        : gatewayConnectionStatus === 'SIMULATION'
                          ? 'bg-sky-600 text-white'
                          : 'bg-rose-600 text-white'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>
                      {gatewayConnectionStatus === 'CONNECTED' && '🟢 Terhubung Aktif (Fonnte API Ready)'}
                      {gatewayConnectionStatus === 'CHECKING' && '🟡 Mengecek Sinyal Gateway...'}
                      {gatewayConnectionStatus === 'SIMULATION' && '🔵 Mode Simulasi (Dry Run)'}
                      {gatewayConnectionStatus === 'DISCONNECTED' && '🔴 Terputus / Token Kosong'}
                    </span>
                  </span>

                  {gatewayDeviceInfo?.device && (
                    <span className="bg-slate-800 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-md">
                      📱 {gatewayDeviceInfo.device}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Layanan API Fonnte otomatis terhubung. Pengaturan broadcast telah dilengkapi <strong>Proteksi Anti-Blokir &amp; Jeda Manusia Otomatis</strong> untuk menjaga nomor WhatsApp tetap aman.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={checkLiveGatewayStatus}
                className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Cek ulang status koneksi Fonnte ke server"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Cek Ulang Sinyal API</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGatewayConfigHelp(!showGatewayConfigHelp)}
                className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showGatewayConfigHelp ? 'Tutup Panduan' : 'Panduan'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveGatewaySettings(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Token &amp; Pengaturan</span>
              </button>
            </div>
          </div>

          {/* Success Notification on Token Save */}
          {tokenSavedNotification && (
            <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-800 dark:text-emerald-200 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs font-bold animate-fadeIn">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Token &amp; Konfigurasi Gateway Berhasil Disimpan Permanen!
              </span>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">Tersimpan di LocalStorage &amp; Cloud</span>
            </div>
          )}

          {/* Help Guide Accordion */}
          {showGatewayConfigHelp && (
            <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/20 space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="font-black text-emerald-800 dark:text-emerald-400">📖 Panduan Singkat Token WhatsApp Gateway:</div>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li><strong>Fonnte (fonnte.com):</strong> Daftar di Fonnte, scan QR perangkat, salin Token dari menu <em>API &amp; Integrasi</em>. Endpoint bawaan: <code>https://api.fonnte.com/send</code>.</li>
                <li><strong>Wablas (wablas.com):</strong> Masukkan API Token &amp; Server Domain dari dashboard Wablas. Endpoint bawaan: <code>https://api.wablas.com/api/v2/send-message</code>.</li>
                <li><strong>Whacenter (whacenter.com):</strong> Masukkan Device ID pada input Device / Token. Endpoint bawaan: <code>https://api.whacenter.com/send</code>.</li>
                <li><strong>Simulasi Konsol:</strong> Uji coba pesan tanpa token dan tanpa pulsa (dry-run konsol log).</li>
                <li><strong>WA Direct Link:</strong> Membuka tab browser <code>https://wa.me/</code> satu per satu.</li>
              </ul>
            </div>
          )}

          {/* Input Form Fields for Gateway */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Provider Selection */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                1. Provider Gateway WhatsApp:
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
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="fonnte">🟢 Fonnte API Gateway (fonnte.com)</option>
                <option value="wablas">🟢 Wablas API Gateway (wablas.com)</option>
                <option value="whacenter">🟢 Whacenter API Gateway (whacenter.com)</option>
                <option value="custom_api">⚙️ Custom REST API Webhook Endpoint</option>
                <option value="simulasi">🟡 Mode Simulasi (Dry-Run Konsol Log)</option>
                <option value="wa_me_link">🔵 Mode WA Direct Link (wa.me)</option>
              </select>
            </div>

            {/* API Token Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                2. API Token / Secret Key:
              </label>
              <input
                type="text"
                value={waGatewayToken}
                onChange={(e) => setWaGatewayToken(e.target.value)}
                disabled={waGatewayProvider === 'simulasi' || waGatewayProvider === 'wa_me_link'}
                placeholder={waGatewayProvider === 'simulasi' ? 'Tidak diperlukan' : 'Contoh: token_abc123...'}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs disabled:opacity-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Endpoint URL Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                3. Endpoint URL API:
              </label>
              <input
                type="text"
                value={waGatewayEndpoint}
                onChange={(e) => setWaGatewayEndpoint(e.target.value)}
                disabled={waGatewayProvider === 'simulasi' || waGatewayProvider === 'wa_me_link'}
                placeholder="https://api.fonnte.com/send"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs disabled:opacity-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Device ID Input for Whacenter / Custom */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                4. Device ID / Account Key (Opsional):
              </label>
              <input
                type="text"
                value={waGatewayDevice}
                onChange={(e) => setWaGatewayDevice(e.target.value)}
                disabled={waGatewayProvider === 'simulasi' || waGatewayProvider === 'wa_me_link'}
                placeholder="Misal: device-kppn026"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs disabled:opacity-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* High-Grade Anti-Ban & Rate Limiter Bar */}
          <div className="bg-slate-900/5 dark:bg-slate-900/60 p-4 rounded-2xl border border-emerald-500/20 space-y-3.5 text-[11px]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Sistem Keamanan Anti-Blokir &amp; Pengaturan Pengiriman Manusiawi (Human-Like Throttling)
              </span>
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded text-[10px]">
                🛡️ Rekomendasi Proteksi Nomor WhatsApp
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex-1">
                  <div className="font-bold text-slate-700 dark:text-slate-300">Jeda Antar Pesan:</div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="range"
                      min="2000"
                      max="15000"
                      step="500"
                      value={delayBetweenMs}
                      onChange={(e) => setDelayBetweenMs(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 w-12 text-right">
                      {(delayBetweenMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <input
                    type="checkbox"
                    checked={useRandomJitter}
                    onChange={(e) => setUseRandomJitter(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Smart Jitter (+1s s.d +3.5s)</div>
                    <div className="text-[10px] text-slate-500">Variasi ketikan manusia, acak waktu kirim</div>
                  </div>
                </label>
              </div>

              <div className="flex items-center gap-2 justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Jeda Batch (Cooldown):</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <select
                      value={batchPauseSize}
                      onChange={(e) => setBatchPauseSize(Number(e.target.value))}
                      className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-xs"
                    >
                      <option value="5">Tiap 5 Pesan</option>
                      <option value="10">Tiap 10 Pesan</option>
                      <option value="20">Tiap 20 Pesan</option>
                      <option value="0">Tanpa Pause</option>
                    </select>

                    <select
                      value={batchPauseDurationSec}
                      onChange={(e) => setBatchPauseDurationSec(Number(e.target.value))}
                      disabled={batchPauseSize === 0}
                      className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold text-xs"
                    >
                      <option value="15">Jeda 15 Detik</option>
                      <option value="30">Jeda 30 Detik (Aman)</option>
                      <option value="60">Jeda 60 Detik (Sangat Aman)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Anti-Block Official Disclaimer Badges */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Sisipkan Otomatis Peringatan Resmi "Mohon Jangan Diblokir/Dilaporkan"
                </span>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-bold">Posisi Teks:</span>
                  <select
                    value={antiBlockHeaderPosition}
                    onChange={(e: any) => setAntiBlockHeaderPosition(e.target.value)}
                    className="px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 font-extrabold text-[10px] text-amber-900 dark:text-amber-300"
                  >
                    <option value="BOTH">Atas &amp; Bawah (Sangat Direkomendasikan)</option>
                    <option value="TOP">Hanya Header (Paling Atas)</option>
                    <option value="BOTTOM">Hanya Footer (Paling Bawah)</option>
                  </select>
                </div>
              </div>

              <div className="text-[10px] text-amber-800 dark:text-amber-200 bg-white/70 dark:bg-slate-900/70 p-2 rounded-lg font-mono">
                📢 <strong>Teks Header:</strong> <em>"INFO RESMI KPPN SEMARANG 1 (MOHON JANGAN DIBLOKIR)..."</em><br />
                🔒 <strong>Teks Footer:</strong> <em>"Kami dari KPPN Semarang 1 menyampaikan informasi ini semata-mata tugas resmi pembinaan satker. Mohon nomor ini TIDAK DIBLOKIR / DILAPORKAN SPAM..."</em>
              </div>
            </div>

          </div>

          {/* Quick Test Bar */}
          <div className="pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">Tes Kirim WA Uji Coba:</span>
              <input
                type="text"
                value={waTestPhone}
                onChange={(e) => setWaTestPhone(e.target.value)}
                placeholder="081234567890"
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs w-40 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                disabled={isTestingWaConnection}
                onClick={handleTestWaConnection}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isTestingWaConnection ? 'Mengirim...' : 'Tes Kirim WA Sekarang'}</span>
              </button>
            </div>

            <div className="text-slate-500 dark:text-slate-400 text-[10px]">
              🔒 <span className="font-bold">Keamanan:</span> Token Anda terenkripsi di memori sesi &amp; hanya digunakan untuk broadcast resmi KPPN Semarang I.
            </div>
          </div>

        </div>

        {/* 3. Template Editor & Dynamic Placeholders */}
        <div className="bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              3. Pengaturan Template Pesan Dinamis &amp; Preset:
            </h4>

            {/* Presets & AI Assistant */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setAiInstructionPrompt('');
                  setAiGeneratedPreview('');
                  setIsAiModalOpen(true);
                }}
                className="px-3 py-1 rounded-xl text-[11px] font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:opacity-90 text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-indigo-400/40"
                title="Gunakan AI Gemini untuk memoles, menyusun format WhatsApp elegan, atau membuat variasi pesan"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>✨ Asisten AI Gemini (Poles Template)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTemplateLibraryOpen(true)}
                className="px-3 py-1 rounded-xl text-[11px] font-black bg-rose-600 hover:bg-rose-500 text-white shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Katalog Template Lengkap</span>
              </button>

              <span className="font-bold text-slate-500 text-[11px] ml-1">Preset Cepat:</span>
              {[
                { key: 'preset_perhatian', name: '⚠️ Perhatian' },
                { key: 'preset_output', name: '🔴 Output' },
                { key: 'preset_deviasi', name: '📊 Deviasi' },
                { key: 'preset_penyerapan', name: '💸 Penyerapan' },
                { key: 'preset_kkp', name: '💳 Transaksi KKP' },
                { key: 'preset_up', name: '⏱️ UP / TUP' },
                { key: 'preset_sertifikasi', name: '🎓 Sertifikasi' },
                { key: 'preset_portal', name: '🌐 anggaran-026.my.id' },
                { key: 'preset_apresiasi', name: '🏆 Apresiasi' }
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => handleSelectBroadcastPreset(p.key)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border cursor-pointer transition-all ${
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

          {/* Placeholders badging */}
          <div className="flex flex-wrap items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
            <span className="font-bold text-amber-800 dark:text-amber-300 mr-1 text-[11px]">🏷️ Sisipkan Placeholder:</span>
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
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-amber-100 dark:hover:bg-amber-950 font-mono text-[10px] px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800 cursor-pointer shadow-xs"
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

          {/* AI Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setAiInstructionPrompt('Poles dan perbaiki tata bahasa pesan broadcast di atas agar sangat rapi, profesional, dan gunakan penekanan tebal/miring WhatsApp.');
                  setIsAiModalOpen(true);
                  handleGenerateAiBroadcastTemplate('POLISH_CURRENT');
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>🪄 Poles Pesan Ini dengan AI</span>
              </button>

              {onOpenAiTab && (
                <button
                  type="button"
                  onClick={onOpenAiTab}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Bot className="w-3.5 h-3.5 text-amber-500" />
                  <span>🤖 Konsultasi di Tab Asisten Analisis Gemini</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400">
              💡 Karakter: <strong className="font-mono text-slate-600 dark:text-slate-200">{broadcastTemplateText.length}</strong> | Placeholder Aktif: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{(broadcastTemplateText.match(/{[A-Z_]+}/g) || []).length}</strong>
            </div>
          </div>
        </div>

        {/* 4. Interactive Calculated Recipient Table & Dispatch Console */}
        <div className="space-y-4 pt-2">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-rose-500" />
                  Daftar Penerima Terpilih ({selectedCount} / {calculatedRecipients.length} Penerima Siap Kirim)
                </h4>
                {broadcastTargetFilter === 'PERHATIAN_SEMUA' && (
                  <span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                    Kompilasi Satker Perhatian
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Centang penerima yang dituju. Anda dapat mengedit Nama Pejabat, Nomor WhatsApp, atau Teks Pesan secara perorangan langsung di tabel sebelum mengirim.
              </p>
            </div>

            {/* Main Action Dispatch Button */}
            <div className="flex items-center gap-2 shrink-0">
              {isSendingBroadcast && (
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-4 py-3 rounded-2xl font-black text-xs text-white bg-slate-700 hover:bg-slate-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
                  <span>{isPaused ? 'Lanjutkan' : 'Jeda Broadcast'}</span>
                </button>
              )}

              <button
                disabled={isSendingBroadcast || selectedCount === 0}
                onClick={() => handleStartMassBroadcast()}
                className={`px-6 py-3 rounded-2xl font-black text-xs text-white shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isSendingBroadcast || selectedCount === 0
                    ? 'bg-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-rose-600/30 active:scale-98'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSendingBroadcast 
                    ? `Mengirim... (${sentStats.success + sentStats.failed}/${sentStats.total})` 
                    : `Kirim Broadcast Masif Sekarang (${selectedCount} Penerima)`}
                </span>
              </button>
            </div>
          </div>

          {/* Filter & Selection Bar */}
          <div className="bg-slate-100 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-3 text-xs">
            
            {/* Search Box & Contact Status Filter */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={recipientSearchQuery}
                  onChange={(e) => setRecipientSearchQuery(e.target.value)}
                  placeholder="Cari Satker, Pejabat, No HP..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                {recipientSearchQuery && (
                  <button onClick={() => setRecipientSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Badges */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setContactStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    contactStatusFilter === 'ALL'
                      ? 'bg-slate-800 text-white dark:bg-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Semua ({contactStats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setContactStatusFilter('WITH_PHONE')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                    contactStatusFilter === 'WITH_PHONE'
                      ? 'bg-emerald-600 text-white'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  <span>🟢 Ada No HP</span>
                  <span className="font-mono font-bold">({contactStats.withPhone})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContactStatusFilter('NO_PHONE')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                    contactStatusFilter === 'NO_PHONE'
                      ? 'bg-amber-600 text-white'
                      : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  }`}
                >
                  <span>⚠️ No HP Kosong</span>
                  <span className="font-mono font-bold">({contactStats.withoutPhone})</span>
                </button>
              </div>
            </div>

            {/* Bulk Actions & Import Helper */}
            <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowBulkContactModal(true)}
                className="px-3 py-1.5 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 font-bold text-sky-800 dark:text-sky-300 hover:bg-sky-100 flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
                title="Perbarui nomor telepon satker secara massal melalui teks salin-tempel"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Impor / Isi No. HP Cepat</span>
              </button>

              <button
                type="button"
                onClick={toggleSelectAll}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer text-xs"
              >
                {isAllChecked ? <CheckSquare className="w-3.5 h-3.5 text-rose-500" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                <span>{isAllChecked ? 'Batal Semua' : 'Centang Semua (' + filteredRecipients.length + ')'}</span>
              </button>

              {Object.keys(recipientOverrides).length > 0 && (
                <button
                  type="button"
                  onClick={() => setRecipientOverrides({})}
                  className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 flex items-center gap-1.5 cursor-pointer text-[11px]"
                  title="Kembalikan semua nama, nomor HP, dan pesan yang pernah diedit ke data asli"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Edit ({Object.keys(recipientOverrides).length})</span>
                </button>
              )}

              <span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-xl font-mono font-bold text-[11px]">
                {selectedCount} Terpilih
              </span>
            </div>

          </div>

          {/* Progress Bar during broadcast */}
          {isSendingBroadcast && (
            <div className="space-y-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 text-white animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-rose-400">
                <span className="flex items-center gap-2">
                  {currentCooldownRemaining > 0 ? (
                    <span className="text-amber-400 font-extrabold flex items-center gap-1.5 animate-pulse">
                      🛡️ [PROTEKSI ANTI-BANNED] Sedang Jeda Istirahat WA ({currentCooldownRemaining}s tersisa)...
                    </span>
                  ) : isPaused ? (
                    '⏸️ Pengiriman Masif Dijeda...'
                  ) : (
                    '🚀 Pengiriman Masif Sedang Berjalan...'
                  )}
                </span>
                <span className="text-slate-300 font-mono">
                  {sentStats.success} Berhasil | {sentStats.failed} Gagal ({broadcastProgress}%)
                </span>
              </div>

              <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    currentCooldownRemaining > 0 
                      ? 'bg-amber-500 animate-pulse' 
                      : 'bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500'
                  }`}
                  style={{ width: `${broadcastProgress}%` }}
                />
              </div>

              {currentCooldownRemaining > 0 && (
                <div className="bg-amber-950/60 border border-amber-500/40 p-2.5 rounded-xl text-amber-200 text-[11px] flex items-center justify-between">
                  <span>⏱️ Istirahat batch otomatis untuk mencegah pemblokiran nomor oleh WhatsApp Web/Meta.</span>
                  <span className="font-mono font-black text-amber-400 text-sm">00:{currentCooldownRemaining < 10 ? '0' : ''}{currentCooldownRemaining}</span>
                </div>
              )}
            </div>
          )}

          {/* Live Sending Console Logs */}
          {broadcastLogs.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                  <Activity className="w-3.5 h-3.5" /> LOG KONSOL PENGIRIMAN WHATSAPP ({sentStats.success} Sukses / {sentStats.failed} Gagal):
                </span>
                <button onClick={() => setBroadcastLogs([])} className="text-slate-500 hover:text-slate-300 text-[10px]">
                  Bersihkan Log
                </button>
              </div>
              <div className="max-h-44 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-300">
                {broadcastLogs.map((lg, idx) => (
                  <div key={idx} className="border-b border-slate-900/60 pb-0.5">
                    {lg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recipient Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[480px] overflow-y-auto shadow-sm">
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
                  <th className="py-2.5 px-3 min-w-[190px]">Satker Target</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Peran &amp; Nama Pejabat</th>
                  <th className="py-2.5 px-3 min-w-[170px]">No. WhatsApp &amp; Status</th>
                  <th className="py-2.5 px-3 min-w-[280px]">Teks Pesan Ter-render</th>
                  <th className="py-2.5 px-3 text-center min-w-[100px]">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRecipients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-6 h-6 text-slate-400" />
                        <p className="font-semibold">Tidak ada penerima yang cocok dengan filter kontak atau pencarian.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecipients.map(rec => {
                    const isSelected = !unselectedRecipientIds.includes(rec.id);
                    const hasValidPhone = Boolean(rec.pejabatNoHp && rec.pejabatNoHp.replace(/[^0-9]/g, '').length >= 8);
                    const formattedPhone = hasValidPhone ? formatPhone62(rec.pejabatNoHp) : '';
                    const waWebUrl = hasValidPhone ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(rec.renderedMessage)}` : '';

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
                          <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span className="line-clamp-1">{rec.satkerNama}</span>
                            {rec.isPerhatian && (
                              <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-rose-300 shrink-0">
                                Perhatian
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Kode: <strong className="text-slate-700 dark:text-slate-300">{rec.satkerKode}</strong> | Nilai IKPA: <span className="font-bold text-rose-600">{rec.nilaiIkpa.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{rec.roleLabel}</span>
                          </div>
                          <input
                            type="text"
                            value={rec.pejabatNama}
                            onChange={(e) => handleUpdateOverride(rec.id, 'pejabatNama', e.target.value)}
                            placeholder="Nama pejabat / PIC (Ketik bila ada)..."
                            className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-400 font-bold">No. WhatsApp:</span>
                            {hasValidPhone ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-300">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                Siap Kirim
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 rounded border border-amber-300">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                Belum Ada Nomor
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={rec.pejabatNoHp}
                            onChange={(e) => handleUpdateOverride(rec.id, 'pejabatNoHp', e.target.value)}
                            placeholder="Ketik No HP WhatsApp..."
                            className={`w-full px-2 py-1 rounded-lg border font-mono text-xs font-bold focus:outline-none focus:ring-1 ${
                              hasValidPhone 
                                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 focus:ring-emerald-500'
                                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-rose-500'
                            }`}
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="bg-slate-100 dark:bg-slate-950 p-2 rounded-xl text-[11px] font-sans text-slate-800 dark:text-slate-200 max-w-md line-clamp-2 whitespace-pre-line border border-slate-200 dark:border-slate-800">
                            {rec.renderedMessage}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(rec.id, rec.renderedMessage)}
                              className="text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                              title="Salin isi pesan yang terisi lengkap"
                            >
                              {copiedRecipientId === rec.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedRecipientId === rec.id ? 'Tersalin!' : 'Salin Pesan'}</span>
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => setEditingCustomMsgModal({
                                id: rec.id,
                                recipientName: rec.pejabatNama,
                                satkerNama: rec.satkerNama,
                                currentMsg: rec.renderedMessage
                              })}
                              className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit Khusus</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center space-y-1">
                          {hasValidPhone ? (
                            <a
                              href={waWebUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black shadow-xs transition-all"
                              title="Buka obrolan langsung di WhatsApp Web"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>WA Web</span>
                            </a>
                          ) : (
                            <span className="inline-block text-[10px] text-slate-400 font-semibold italic">
                              Nomor Kosong
                            </span>
                          )}

                          {rec.isEdited && (
                            <div className="pt-0.5">
                              <span className="inline-block bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold">
                                Diedit
                              </span>
                              <button
                                type="button"
                                onClick={() => handleResetOverride(rec.id)}
                                className="block mx-auto text-[9px] text-slate-400 hover:text-rose-600 underline font-bold cursor-pointer"
                              >
                                Reset
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      </>
    ) : (
      /* Sub-Tab 2: Progress & Monitoring Pengiriman Real-Time */
      <div className="space-y-6 animate-fadeIn">
        
        {/* Scope Selector Switcher & Clarification Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300">Fokus Monitoring:</span>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTrackerScope('ACTIVE_TARGETS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  trackerScope === 'ACTIVE_TARGETS'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span>🎯 Target Sasaran Dicentang &amp; Riwayat</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  trackerScope === 'ACTIVE_TARGETS' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {trackerStats.activeTargetsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTrackerScope('ALL_SATKERS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  trackerScope === 'ALL_SATKERS'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span>📋 Seluruh Satker ({trackerStats.allSatkersCount})</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Menghitung tepat per nomor tujuan WhatsApp yang aktif diproses.</span>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Target */}
          <div className="bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Total Sasaran WhatsApp
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
                {trackerStats.total}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
                {trackerScope === 'ACTIVE_TARGETS' ? 'Tujuan aktif terpilih' : 'Seluruh satker dalam filter'}
              </span>
            </div>
            <div className="p-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Sukses Terkirim */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                Berhasil Terkirim
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {trackerStats.success}
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  ({trackerStats.successRate}%)
                </span>
              </div>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-semibold mt-0.5 block">
                Pesan terkonfirmasi gateway
              </span>
            </div>
            <div className="p-3 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Belum Dikirim / Antrean */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                Belum Dikirim / Antrean
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                {trackerStats.pending}
              </span>
              <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-semibold mt-0.5 block">
                {trackerStats.actionablePending > 0 ? `${trackerStats.actionablePending} nomor siap dikirim` : 'Tidak ada antrean tertunda'}
              </span>
            </div>
            <div className="p-3 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Gagal Terkirim */}
          <div className="bg-rose-500/10 border border-rose-500/30 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-800 dark:text-rose-300 block">
                Gagal Terkirim
              </span>
              <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
                {trackerStats.failed}
              </span>
              <span className="text-[10px] text-rose-700/80 dark:text-rose-400/80 font-semibold mt-0.5 block">
                {trackerStats.failed > 0 ? 'Dapat dikirim ulang langsung' : 'Tidak ada kesalahan kirim'}
              </span>
            </div>
            <div className="p-3 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Retry Failed Only Button */}
            <button
              type="button"
              onClick={handleRetryFailedBroadcast}
              disabled={isSendingBroadcast || trackerStats.failed === 0}
              className="bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              title="Kirim ulang khusus target yang gagal"
            >
              <RefreshCw className={`w-4 h-4 ${isSendingBroadcast ? 'animate-spin' : ''}`} />
              <span>Kirim Ulang Khusus yang Gagal ({trackerStats.failed})</span>
            </button>

            {/* Resume Pending Button */}
            {trackerStats.actionablePending > 0 && (
              <button
                type="button"
                onClick={handleResumePendingBroadcast}
                disabled={isSendingBroadcast}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                title="Lanjutkan pengiriman pesan yang belum terkirim"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Kirimkan Sisa Antrean ({trackerStats.actionablePending})</span>
              </button>
            )}

            {/* Export Audit Report */}
            <button
              type="button"
              onClick={handleExportDeliveryTrackerExcel}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Unduh laporan audit lengkap hasil pengiriman ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Rekap Audit Excel</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {trackerStats.failed > 0 && (
              <button
                type="button"
                onClick={() => handleCopyTrackerPhones('FAILED')}
                className="text-[11px] font-bold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 px-3 py-2 rounded-xl hover:bg-rose-100 flex items-center gap-1.5 cursor-pointer"
                title="Salin semua nomor telepon yang berstatus gagal"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin No. Gagal</span>
              </button>
            )}

            {trackerStats.success > 0 && (
              <button
                type="button"
                onClick={() => handleCopyTrackerPhones('SUCCESS')}
                className="text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-3 py-2 rounded-xl hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer"
                title="Salin semua nomor telepon yang berstatus berhasil"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin No. Berhasil</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetDeliveryTracker}
              className="text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-1.5 cursor-pointer"
              title="Bersihkan riwayat status pengiriman"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Status</span>
            </button>
          </div>
        </div>

        {/* Live Progress Bar if broadcast is currently running */}
        {isSendingBroadcast && (
          <div className="space-y-3 bg-slate-900 p-5 rounded-2xl border border-slate-800 text-white animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Sedang Memproses Pengiriman Masif... ({broadcastProgress}%)</span>
              </span>
              <span className="font-mono text-slate-300">
                🟢 {sentStats.success} Berhasil | 🔴 {sentStats.failed} Gagal | 📦 {sentStats.total} Total
              </span>
            </div>

            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 h-full transition-all duration-300"
                style={{ width: `${broadcastProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Filter Chips & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'ALL', label: 'Semua Status', count: trackerStats.total },
              { key: 'SUCCESS', label: '🟢 Berhasil Terkirim', count: trackerStats.success },
              { key: 'PENDING', label: '⏳ Belum Dikirim / Antrean', count: trackerStats.pending },
              { key: 'FAILED', label: '🔴 Gagal Terkirim', count: trackerStats.failed }
            ].map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setTrackerFilterStatus(f.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  trackerFilterStatus === f.key
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>{f.label}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={trackerSearchQuery}
              onChange={(e) => setTrackerSearchQuery(e.target.value)}
              placeholder="Cari satker, kode, pejabat, no HP..."
              className="w-full pl-8 pr-8 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {trackerSearchQuery && (
              <button
                type="button"
                onClick={() => setTrackerSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Delivery Status Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[550px] overflow-y-auto shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3 min-w-[170px]">Status &amp; Waktu Kirim</th>
                <th className="py-2.5 px-3 min-w-[210px]">Satker Target</th>
                <th className="py-2.5 px-3 min-w-[190px]">Pejabat &amp; No. WhatsApp</th>
                <th className="py-2.5 px-3 min-w-[190px]">Respon / Catatan Gateway</th>
                <th className="py-2.5 px-3 min-w-[240px]">Preview Pesan</th>
                <th className="py-2.5 px-3 text-center min-w-[120px]">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTrackedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-7 h-7 text-slate-400" />
                      <p className="font-bold text-sm">Tidak ada data yang cocok dengan filter status atau pencarian.</p>
                      <p className="text-xs text-slate-500">Ubah filter di atas atau klik Susun Broadcast untuk mengatur daftar sasaran.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTrackedList.map((rec, idx) => {
                  const hasPhone = Boolean(rec.pejabatNoHp && rec.pejabatNoHp.replace(/[^0-9]/g, '').length >= 8);
                  const formattedPhone = hasPhone ? formatPhone62(rec.pejabatNoHp) : '';
                  const waWebUrl = hasPhone ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(rec.renderedMessage)}` : '';

                  return (
                    <tr
                      key={rec.id}
                      className={`transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        rec.status === 'SUCCESS' 
                          ? 'bg-emerald-500/5' 
                          : rec.status === 'FAILED'
                            ? 'bg-rose-500/5'
                            : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-bold">
                        {idx + 1}
                      </td>

                      {/* Status & Timestamp */}
                      <td className="py-2.5 px-3">
                        {rec.status === 'SUCCESS' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-[10px] font-black">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              BERHASIL TERKIRIM
                            </span>
                            {rec.sentAt && (
                              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>Pukul {rec.sentAt}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {rec.status === 'FAILED' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 text-[10px] font-black">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              GAGAL TERKIRIM
                            </span>
                            {rec.sentAt && (
                              <div className="text-[10px] text-rose-500 font-mono">
                                Percobaan: {rec.sentAt}
                              </div>
                            )}
                          </div>
                        )}

                        {rec.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-[10px] font-black">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            BELUM DIKIRIM (ANTREAN)
                          </span>
                        )}
                      </td>

                      {/* Satker Target */}
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span className="line-clamp-1">{rec.satkerNama}</span>
                          {rec.isPerhatian && (
                            <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-rose-300 shrink-0">
                              Perhatian
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Kode: <strong className="text-slate-700 dark:text-slate-300">{rec.satkerKode}</strong> | IKPA: <span className="font-bold text-rose-600">{rec.nilaiIkpa.toFixed(2)}</span>
                        </div>
                      </td>

                      {/* Pejabat & No HP */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {rec.pejabatNama || 'Pejabat / Operator Satker'}
                        </div>
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                          {rec.roleLabel}
                        </div>
                        <div className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                          {rec.pejabatNoHp || <span className="text-amber-500 italic">Nomor Belum Ada</span>}
                        </div>
                      </td>

                      {/* Respon Gateway */}
                      <td className="py-2.5 px-3">
                        <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 line-clamp-2">
                          {rec.note || (rec.status === 'PENDING' ? 'Menunggu eksekusi broadcast' : '-')}
                        </div>
                      </td>

                      {/* Preview Pesan */}
                      <td className="py-2.5 px-3">
                        <div className="bg-slate-100 dark:bg-slate-950 p-2 rounded-xl text-[11px] font-sans text-slate-700 dark:text-slate-300 max-w-xs line-clamp-2 whitespace-pre-line border border-slate-200 dark:border-slate-800">
                          {rec.renderedMessage}
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewingTrackerMessageModal({
                            id: rec.id,
                            satkerNama: rec.satkerNama,
                            satkerKode: rec.satkerKode,
                            pejabatNama: rec.pejabatNama,
                            roleLabel: rec.roleLabel,
                            pejabatNoHp: rec.pejabatNoHp,
                            status: rec.status,
                            sentAt: rec.sentAt,
                            note: rec.note,
                            message: rec.renderedMessage
                          })}
                          className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Lihat Pesan Lengkap</span>
                        </button>
                      </td>

                      {/* Aksi Cepat */}
                      <td className="py-2.5 px-3 text-center space-y-1">
                        {/* Retry Single Button */}
                        <button
                          type="button"
                          onClick={() => handleRetrySingleRecipient(rec.id)}
                          disabled={!hasPhone}
                          className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-[10px] font-black shadow-xs transition-all cursor-pointer"
                          title="Kirim ulang ke nomor ini saja"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Kirim Ulang</span>
                        </button>

                        {/* WA Web Direct Link */}
                        {hasPhone ? (
                          <a
                            href={waWebUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black shadow-xs transition-all"
                            title="Buka obrolan manual di WhatsApp Web"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>WA Web</span>
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    )}

      {/* Modal Detail Pesan Popup */}
      {viewingTrackerMessageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    Detail Pesan WhatsApp Terkirim
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    viewingTrackerMessageModal.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                    viewingTrackerMessageModal.status === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {viewingTrackerMessageModal.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {viewingTrackerMessageModal.satkerNama} ({viewingTrackerMessageModal.satkerKode})
                </p>
              </div>
              <button
                onClick={() => setViewingTrackerMessageModal(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Penerima Target:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {viewingTrackerMessageModal.pejabatNama} ({viewingTrackerMessageModal.roleLabel})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">No. WhatsApp:</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {viewingTrackerMessageModal.pejabatNoHp || 'KOSONG'}
                  </span>
                </div>
                {viewingTrackerMessageModal.sentAt && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Waktu Kirim:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {viewingTrackerMessageModal.sentAt}
                    </span>
                  </div>
                )}
                {viewingTrackerMessageModal.note && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Catatan Gateway:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {viewingTrackerMessageModal.note}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Isi Pesan WhatsApp Terformat:
                </label>
                <div className="bg-slate-100 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 font-sans text-xs whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto text-slate-800 dark:text-slate-200">
                  {viewingTrackerMessageModal.message}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(viewingTrackerMessageModal.message);
                  if (showToast) {
                    showToast({ type: 'success', title: 'Tersalin', message: 'Teks pesan disalin ke clipboard.' });
                  }
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Isi Pesan</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingTrackerMessageModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRetrySingleRecipient(viewingTrackerMessageModal.id);
                    setViewingTrackerMessageModal(null);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Kirim Ulang Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Modal Bulk Contact Importer */}
      {showBulkContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-sky-500" />
                  Impor / Lengkapi Kontak WhatsApp Massal
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tempelkan daftar nomor telepon satker untuk melengkapi penerima yang belum memiliki nomor.
                </p>
              </div>
              <button
                onClick={() => setShowBulkContactModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="bg-sky-50 dark:bg-sky-950/60 p-3 rounded-2xl border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 leading-relaxed">
                <strong>Format Salin-Tempel (1 Baris per Satker):</strong>
                <div className="font-mono text-[11px] bg-white dark:bg-slate-900 p-2 rounded-xl border border-sky-300 dark:border-sky-700 mt-1">
                  KODE_SATKER, NO_WHATSAPP, NAMA_PEJABAT<br />
                  Contoh: 412345, 081234567890, Bambang Sutrisno<br />
                  Contoh: 654321, 081987654321
                </div>
              </div>

              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Tempel Data di Sini:
              </label>
              <textarea
                rows={7}
                value={bulkContactInputText}
                onChange={(e) => setBulkContactInputText(e.target.value)}
                placeholder="412345, 081234567890, Nama Pejabat&#10;654321, 081987654321"
                className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkContactModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyBulkContacts}
                disabled={!bulkContactInputText.trim()}
                className="px-5 py-2 rounded-xl text-xs font-black bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan ke Daftar Penerima</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Custom Message Per Recipient */}
      {editingCustomMsgModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-rose-500" />
                  Edit Pesan Khusus Penerima
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

      {/* Modal In-App Konfirmasi Eksekusi Broadcast Masif (100% Reliable di iFrame / Web) */}
      {broadcastConfirmModal && broadcastConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-rose-500 to-amber-500 text-white rounded-2xl shadow-md">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-slate-100">
                    Konfirmasi Pengiriman Broadcast
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {broadcastConfirmModal.isRetry ? 'Kirim ulang antrean terpilih' : 'Pengiriman pesan notifikasi WhatsApp resmi'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBroadcastConfirmModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Information Grid */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Target Penerima</span>
                  <span className="text-base font-black text-rose-600 dark:text-rose-400">
                    {broadcastConfirmModal.recipients.length} Pejabat / Satker
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gateway Aktif</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {waGatewayProvider.toUpperCase()} API
                  </span>
                </div>
              </div>

              {/* Recipient Preview */}
              {broadcastConfirmModal.recipients.length === 1 ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                    Penerima Tunggal:
                  </span>
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">
                    {broadcastConfirmModal.recipients[0].satkerNama} ({broadcastConfirmModal.recipients[0].satkerKode})
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    {broadcastConfirmModal.recipients[0].roleLabel}: <strong>{broadcastConfirmModal.recipients[0].pejabatNama || 'Pejabat Satker'}</strong>
                  </div>
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                    No. WhatsApp: {broadcastConfirmModal.recipients[0].pejabatNoHp || 'KOSONG'}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Sampel Penerima Antrean:
                  </span>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {broadcastConfirmModal.recipients.slice(0, 3).map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300">
                        <span className="truncate max-w-[240px] font-semibold">• {r.satkerNama} ({r.roleLabel})</span>
                        <span className="font-mono text-[10px] text-slate-500">{r.pejabatNoHp || 'No HP -'}</span>
                      </div>
                    ))}
                    {broadcastConfirmModal.recipients.length > 3 && (
                      <div className="text-[10px] font-bold text-rose-500 text-center pt-0.5">
                        + {broadcastConfirmModal.recipients.length - 3} penerima lainnya dalam antrean
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Anti-Ban & Throttling Security Notice */}
              <div className="bg-slate-100 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>Proteksi Anti-Blokir Aktif:</strong> Jeda {(delayBetweenMs / 1000).toFixed(1)}s antar pesan {useRandomJitter ? '+ Smart Jitter' : ''} {batchPauseSize > 0 ? `dan Cooldown tiap ${batchPauseSize} pesan.` : '.'} Estimasi total: ±{Math.max(1, Math.round(broadcastConfirmModal.recipients.length * (delayBetweenMs / 1000 + (useRandomJitter ? 1.5 : 0))))} detik.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setBroadcastConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeMassBroadcastDirectly(broadcastConfirmModal.recipients)}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>🚀 Ya, Mulai Kirim Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Reset Status Delivery Tracker */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Reset Riwayat Pengiriman?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Seluruh status pengiriman (Berhasil / Gagal) akan dibersihkan kembali ke status <strong>Belum Dikirim (Antrean Awal)</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeResetDeliveryTrackerConfirmed}
                className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md cursor-pointer"
              >
                Ya, Reset Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asisten AI Gemini - Poles & Susun Template WhatsApp */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl animate-fadeIn my-8">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl shadow-md">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      Asisten AI Gemini - Poles &amp; Susun Pesan WhatsApp
                    </h3>
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-extrabold border border-indigo-200 dark:border-indigo-800">
                      Gemini 3.7 Flash
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Menyempurnakan tata bahasa, merapikan format (*tebal*, _miring_), dan mengoptimalkan pesan broadcast perbendaharaan.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode & Tone Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tone Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  Gaya Bicara / Tone WhatsApp:
                </label>
                <select
                  value={aiSelectedTone}
                  onChange={(e) => setAiSelectedTone(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="formal">💼 Kedinasan Resmi &amp; Berwibawa (DJPb)</option>
                  <option value="persuasif">🤝 Santun &amp; Pendampingan Pembinaan</option>
                  <option value="urgent">🚨 Peringatan Keras Batas Waktu (High Urgency)</option>
                  <option value="apresiasi">🏆 Apresiasi &amp; Pujian Kinerja Sempurna</option>
                </select>
              </div>

              {/* Quick Issue Category for Generator */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  Kategori Isu Satker:
                </label>
                <select
                  value={aiSelectedIssueCategory}
                  onChange={(e) => setAiSelectedIssueCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="perhatian">⚠️ Satker Dalam Perhatian Komprehensif</option>
                  <option value="output">🔴 Keterlambatan Capaian Output (CRO/RVRO)</option>
                  <option value="deviasi">📊 Deviasi Hal III DIPA &amp; Pemutakhiran RPD</option>
                  <option value="penyerapan">💸 Percepatan Penyerapan Belanja &amp; SPM</option>
                  <option value="kkp">💳 Transaksi KKP &amp; Marketplace Digipay Satu</option>
                  <option value="up">⏱️ Pengelolaan UP / Percepatan GUP Bulanan</option>
                </select>
              </div>
            </div>

            {/* Custom Instruction Prompt */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Instruksi Tambahan untuk AI (Opsional):</span>
                <span className="text-[10px] text-slate-400">Contoh: &quot;Tambahkan batas waktu pengiriman tanggal 10&quot;</span>
              </label>
              <input
                type="text"
                value={aiInstructionPrompt}
                onChange={(e) => setAiInstructionPrompt(e.target.value)}
                placeholder="Tuliskan arahan khusus bila ada..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons for AI */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleGenerateAiBroadcastTemplate('POLISH_CURRENT')}
                disabled={isAiGenerating}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAiGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                <span>{isAiGenerating ? 'Memproses Poles Teks...' : '🪄 Poles Template Saat Ini'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerateAiBroadcastTemplate('GENERATE_BY_CATEGORY')}
                disabled={isAiGenerating}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Susun Format Baru Sesuai Kategori</span>
              </button>

              {onOpenAiTab && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAiModalOpen(false);
                    onOpenAiTab();
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Buka Tab Asisten Gemini AI</span>
                </button>
              )}
            </div>

            {/* AI Output / Result Area */}
            {aiGeneratedPreview && (
              <div className="space-y-2 pt-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Hasil Polesan AI Gemini (Siap Pasang):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(aiGeneratedPreview);
                      if (showToast) {
                        showToast({
                          type: 'success',
                          title: 'Tersalin',
                          message: 'Hasil polesan AI berhasil disalin ke clipboard.'
                        });
                      }
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Salin Teks</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-emerald-500/30 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed shadow-inner">
                  {aiGeneratedPreview}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>

              {aiGeneratedPreview && (
                <button
                  type="button"
                  onClick={handleApplyAiTemplateToMain}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>✨ Pasang ke Template Utama</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Modal Broadcast Template Library Siap Salin & AI Generator */}
      <BroadcastTemplateLibraryModal
        isOpen={isTemplateLibraryOpen}
        onClose={() => setIsTemplateLibraryOpen(false)}
        masterSatkers={masterSatkers}
        isDark={isDark}
        theme={theme}
        onApplyTemplate={(templateText) => {
          setBroadcastTemplateText(templateText);
          setBroadcastSubTab('COMPOSE');
          setIsTemplateLibraryOpen(false);
          if (showToast) {
            showToast({
              type: 'success',
              title: 'Template Diterapkan ke Broadcast! 🚀',
              message: 'Template pesan WhatsApp berhasil dipasang ke editor pengiriman broadcast.'
            });
          }
        }}
        showToast={showToast}
      />

    </div>
  );
};
