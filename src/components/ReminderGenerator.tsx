import React, { useState, useEffect, useRef } from 'react';
import { ModernConfirmModal, ConfirmModalState } from './ModernConfirmModal';
import { useToast } from './ToastNotification';
import { SatkerIKPA, TemplateMessage, DashboardConfig, WhatsAppDeviceStatus, BroadcastSettings } from '../types';
import { REMINDER_TEMPLATES } from '../data/reminderTemplates';
import { 
  Send, 
  MessageSquare, 
  FileText, 
  Copy, 
  Check, 
  ExternalLink, 
  User, 
  Building2, 
  Calendar, 
  Hash, 
  Printer, 
  Sparkles,
  Users,
  Lock,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  QrCode,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  Play,
  Pause,
  StopCircle,
  Clock,
  Sliders,
  CheckSquare,
  Square,
  Zap,
  Filter,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';

interface ReminderGeneratorProps {
  satkers: SatkerIKPA[];
  selectedSatkerFromProps?: SatkerIKPA | null;
  bulkSatkersFromProps?: SatkerIKPA[] | null;
  isAdminAuthenticated?: boolean;
  onAuthenticateAdmin?: (pin: string) => boolean;
  onGoToAdminTab?: () => void;
  theme?: 'light' | 'dark';
  dashboardConfig?: DashboardConfig;
  onUpdateDashboardConfig?: (newConfig: DashboardConfig) => void;
}

export const ReminderGenerator: React.FC<ReminderGeneratorProps> = ({
  satkers,
  selectedSatkerFromProps,
  bulkSatkersFromProps,
  isAdminAuthenticated = false,
  onAuthenticateAdmin,
  onGoToAdminTab,
  theme = 'light',
  dashboardConfig,
  onUpdateDashboardConfig
}) => {
  const isDark = theme === 'dark';

  // Local Auth Pin state
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAuthenticateAdmin && onAuthenticateAdmin(pinInput)) {
      setPinError(null);
      setPinInput('');
    } else {
      setPinError('Password Admin salah. Silakan periksa kembali password Anda.');
    }
  };

  // Mode Selection
  const [targetMode, setTargetMode] = useState<'SINGLE' | 'BULK'>(
    bulkSatkersFromProps && bulkSatkersFromProps.length > 0 ? 'BULK' : 'SINGLE'
  );

  // Selected Satker for single mode
  const [selectedSatkerId, setSelectedSatkerId] = useState<string>(
    selectedSatkerFromProps ? selectedSatkerFromProps.id : (satkers[0]?.id || '')
  );

  // Target Filter Preset for Bulk
  const [filterPreset, setFilterPreset] = useState<'ALL' | 'BELUM_OUTPUT' | 'IKPA_KURANG' | 'DEVIASI_TINGGI' | 'SERTIFIKASI_BERMASALAH'>('BELUM_OUTPUT');
  const [selectedSatkerIds, setSelectedSatkerIds] = useState<string[]>([]);
  const [searchSatkerQuery, setSearchSatkerQuery] = useState<string>('');

  // Selected Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(REMINDER_TEMPLATES[0].id);
  const [customWaText, setCustomWaText] = useState<string>('');

  // Customizable Fields
  const [noSurat, setNoSurat] = useState<string>('S-1042/KPR.033/2026');
  const [batasWaktu, setBatasWaktu] = useState<string>('12 Agustus 2026');
  const [catatanKhusus, setCatatanKhusus] = useState<string>('');

  const [copiedWA, setCopiedWA] = useState<boolean>(false);
  const [copiedSurat, setCopiedSurat] = useState<boolean>(false);

  // WhatsApp Device & Gateway State
  const defaultDeviceStatus: WhatsAppDeviceStatus = {
    isConnected: true,
    status: 'CONNECTED',
    phoneNumber: '+62 812-3456-7890',
    deviceName: 'WhatsApp Web (KPPN 026 Gateway)',
    batteryLevel: 96,
    lastSeen: 'Aktif Sockets WA Web'
  };

  const waDevice: WhatsAppDeviceStatus = dashboardConfig?.waDeviceStatus || defaultDeviceStatus;

  // QR Modal state
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [qrCountdown, setQrCountdown] = useState<number>(45);
  const [pairingMethod, setPairingMethod] = useState<'QR' | 'PAIRING_CODE'>('QR');
  const [pairingPhoneInput, setPairingPhoneInput] = useState<string>('081234567890');
  const [generatedPairingCode, setGeneratedPairingCode] = useState<string>('');

  // Anti-Spam Broadcast Settings
  const defaultBroadcastSettings: BroadcastSettings = {
    delaySeconds: 8,
    useJitter: true,
    pauseBatchCount: 10,
    pauseBatchDurationSeconds: 60,
    maxDailyLimit: 100
  };

  const [broadcastConfig, setBroadcastConfig] = useState<BroadcastSettings>(
    dashboardConfig?.broadcastSettings || defaultBroadcastSettings
  );

  // Automated Broadcast Engine States
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [broadcastIndex, setBroadcastIndex] = useState<number>(0);
  const [countdownTimer, setCountdownTimer] = useState<number>(0);
  const [broadcastLogs, setBroadcastLogs] = useState<Array<{
    id: string;
    satkerName: string;
    kodeSatker: string;
    phone: string;
    status: 'SENT' | 'WAITING' | 'PAUSED' | 'FAILED';
    timestamp: string;
    logText: string;
  }>>([]);

  // Initialize selectedSatkerIds based on filter preset
  useEffect(() => {
    let filtered = satkers;
    if (filterPreset === 'BELUM_OUTPUT') {
      filtered = satkers.filter(s => s.statusCapaianOutput !== 'Sudah Terlaporkan');
    } else if (filterPreset === 'IKPA_KURANG') {
      filtered = satkers.filter(s => s.nilaiTotalIKPA < 87.5);
    } else if (filterPreset === 'DEVIASI_TINGGI') {
      filtered = satkers.filter(s => s.indikator.deviasiHal3Dipa < 90);
    } else if (filterPreset === 'SERTIFIKASI_BERMASALAH') {
      filtered = satkers.filter(s => s.issues.some(i => i.toLowerCase().includes('sertifikat') || i.toLowerCase().includes('pejabat')));
    }
    setSelectedSatkerIds(filtered.map(s => s.id));
  }, [filterPreset, satkers]);

  useEffect(() => {
    if (selectedSatkerFromProps) {
      setSelectedSatkerId(selectedSatkerFromProps.id);
      setTargetMode('SINGLE');
    }
  }, [selectedSatkerFromProps]);

  useEffect(() => {
    if (bulkSatkersFromProps && bulkSatkersFromProps.length > 0) {
      setTargetMode('BULK');
      setSelectedSatkerIds(bulkSatkersFromProps.map(s => s.id));
    }
  }, [bulkSatkersFromProps]);

  // QR Timer loop
  useEffect(() => {
    let timer: any = null;
    if (isQrModalOpen && qrCountdown > 0) {
      timer = setInterval(() => {
        setQrCountdown(prev => prev - 1);
      }, 1000);
    } else if (qrCountdown === 0) {
      setQrCountdown(45); // Refresh QR
    }
    return () => clearInterval(timer);
  }, [isQrModalOpen, qrCountdown]);

  const activeSatker = satkers.find(s => s.id === selectedSatkerId) || satkers[0];
  const activeTemplate = REMINDER_TEMPLATES.find(t => t.id === selectedTemplateId) || REMINDER_TEMPLATES[0];

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Compile template
  const compileTemplate = (templateStr: string, satkerObj: SatkerIKPA) => {
    if (!satkerObj) return '';
    
    let result = templateStr;
    const sisaPagu = satkerObj.paguAnggaran - satkerObj.realisasiAnggaran;
    const masalahListStr = satkerObj.issues.length > 0 
      ? satkerObj.issues.map(iss => `- ${iss}`).join('\n')
      : '- Perlu penyesuaian indikator berkala';

    result = result.replace(/{NAMA_SATKER}/g, satkerObj.namaSatker || '');
    result = result.replace(/{KODE_SATKER}/g, satkerObj.kodeSatker || '');
    result = result.replace(/{NAMA_PIC}/g, satkerObj.namaPic || 'Bpk/Ibu Pengelola Keuangan');
    result = result.replace(/{NILAI_IKPA}/g, String(satkerObj.nilaiTotalIKPA || '0'));
    result = result.replace(/{PREDIKAT}/g, satkerObj.predikat || '');
    result = result.replace(/{PENYERAPAN}/g, String(satkerObj.persenPenyerapan || '0'));
    result = result.replace(/{CAPAIAN_OUTPUT}/g, String(satkerObj.indikator.capaianOutput || '0'));
    result = result.replace(/{DEVIASI_HAL3}/g, String(satkerObj.indikator.deviasiHal3Dipa || '0'));
    result = result.replace(/{SISA_PAGU}/g, formatRupiah(sisaPagu));
    result = result.replace(/{MASALAH_LIST}/g, masalahListStr);
    result = result.replace(/{NO_SURAT}/g, noSurat);
    result = result.replace(/{BATAS_WAKTU}/g, batasWaktu);

    if (catatanKhusus.trim()) {
      result += `\n\n📌 Catatan Khusus CSO KPPN SMG I:\n${catatanKhusus}`;
    }

    // Official Anti-Block / Anti-Report Footer Disclaimer
    result += `\n\n━━━━━━━━━━━━━━━━━━━━\n🔒 *CATATAN RESMI KPPN SEMARANG 1:*\n_Pemberitahuan ini dikirimkan secara resmi oleh Tim Layanan KPPN Semarang I semata-mata untuk pembinaan & monev kinerja Satker. *Mohon nomor ini JANGAN DIBLOKIR / DILAPORKAN SPAM* agar komunikasi koordinasi perbendaharaan Satker Anda tetap lancar._\n🌐 Akses Portal Monitoring: *https://anggaran-026.my.id*`;

    return result;
  };

  const compiledWA = compileTemplate(activeTemplate.isiWa, activeSatker);
  const compiledSurat = compileTemplate(activeTemplate.isiSurat, activeSatker);
  const compiledSubjek = compileTemplate(activeTemplate.subjekEmail, activeSatker);

  const handleCopyWA = () => {
    navigator.clipboard.writeText(compiledWA);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2000);
  };

  const handleCopySurat = () => {
    navigator.clipboard.writeText(compiledSurat);
    setCopiedSurat(true);
    setTimeout(() => setCopiedSurat(false), 2000);
  };

  const handleOpenWhatsApp = (satkerObj: SatkerIKPA) => {
    if (!satkerObj) return;
    let phone = satkerObj.noHpPic || '';
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    }
    const text = encodeURIComponent(compileTemplate(activeTemplate.isiWa, satkerObj));
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  // Helper update device status
  const updateWaDevice = (newStatus: WhatsAppDeviceStatus) => {
    if (onUpdateDashboardConfig && dashboardConfig) {
      onUpdateDashboardConfig({
        ...dashboardConfig,
        waDeviceStatus: newStatus
      });
    }
  };

  const { showToast } = useToast();
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  const handleConnectSimulatedQr = () => {
    updateWaDevice({
      isConnected: true,
      status: 'CONNECTED',
      phoneNumber: '+62 812-3456-7890',
      deviceName: 'WhatsApp Web (KPPN 026 Gateway)',
      batteryLevel: 98,
      lastSeen: 'Aktif Sockets WA Web'
    });
    setIsQrModalOpen(false);
    showToast({
      type: 'success',
      title: 'WhatsApp Terhubung',
      message: 'WhatsApp Admin KPPN Semarang I terhubung ke Gateway Broadcast.'
    });
  };

  const handleDisconnectWa = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Putuskan Koneksi WhatsApp',
      message: 'Apakah Anda yakin ingin memutuskan koneksi WhatsApp Gateway Admin? Broadcast otomatis tidak akan terkirim sampai dihubungkan kembali.',
      confirmText: 'Ya, Putuskan',
      cancelText: 'Batal',
      variant: 'danger',
      iconType: 'warning',
      onConfirm: () => {
        updateWaDevice({
          isConnected: false,
          status: 'DISCONNECTED',
          phoneNumber: '',
          deviceName: 'Tidak Terhubung',
          batteryLevel: 0,
          lastSeen: 'Terputus'
        });
        showToast({
          type: 'info',
          title: 'Koneksi Terputus',
          message: 'WhatsApp Gateway telah diputuskan.'
        });
      }
    });
  };

  const handlePingTest = () => {
    showToast({
      type: 'success',
      title: 'Test Ping Berhasil',
      message: 'Sockets WhatsApp Web Gateway KPPN Semarang I Responsif (Latency: 24ms).'
    });
  };

  const generatePairingCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code1 = '', code2 = '';
    for (let i = 0; i < 4; i++) {
      code1 += chars.charAt(Math.floor(Math.random() * chars.length));
      code2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPairingCode(`${code1}-${code2}`);
  };

  // Bulk target list
  const selectedBulkSatkers = satkers.filter(s => selectedSatkerIds.includes(s.id));

  // Automated Broadcast Loop simulation
  const startBroadcastEngine = () => {
    if (!waDevice.isConnected) {
      alert('Perangkat WhatsApp belum terhubung. Silakan hubungkan via QR Code terlebih dahulu.');
      setIsQrModalOpen(true);
      return;
    }
    if (selectedBulkSatkers.length === 0) {
      alert('Pilih minimal 1 Satker tujuan untuk melakukan broadcast.');
      return;
    }

    setIsBroadcasting(true);
    setIsPaused(false);
    setBroadcastIndex(0);

    // Initial Logs
    const initialLogs = selectedBulkSatkers.map(s => ({
      id: s.id,
      satkerName: s.namaSatker,
      kodeSatker: s.kodeSatker,
      phone: s.noHpPic || '081234567890',
      status: 'WAITING' as const,
      timestamp: '-',
      logText: 'Dalam Antrean Broadcast'
    }));
    setBroadcastLogs(initialLogs);
  };

  // Broadcast step effect
  useEffect(() => {
    let timer: any = null;

    if (isBroadcasting && !isPaused && broadcastIndex < selectedBulkSatkers.length) {
      const currentSatker = selectedBulkSatkers[broadcastIndex];
      
      // Calculate delay with optional jitter
      const baseDelay = broadcastConfig.delaySeconds || 8;
      const jitter = broadcastConfig.useJitter ? Math.floor(Math.random() * 4) + 1 : 0;
      const totalWait = baseDelay + jitter;

      setCountdownTimer(totalWait);

      // Countdown ticker
      const ticker = setInterval(() => {
        setCountdownTimer(prev => {
          if (prev <= 1) {
            clearInterval(ticker);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Send execution
      timer = setTimeout(() => {
        clearInterval(ticker);
        
        // Update log for current satker
        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
        
        setBroadcastLogs(prev => prev.map(item => {
          if (item.id === currentSatker.id) {
            return {
              ...item,
              status: 'SENT',
              timestamp: timeNow,
              logText: `Pesan WA berhasil dikirim via Gateway (${totalWait}s anti-spam delay)`
            };
          }
          return item;
        }));

        // Advance to next satker
        if (broadcastIndex + 1 >= selectedBulkSatkers.length) {
          setIsBroadcasting(false);
          alert(`🎉 Broadcast Selesai! Berhasil mengirim ${selectedBulkSatkers.length} pesan WhatsApp ke Satker tujuan.`);
        } else {
          setBroadcastIndex(prev => prev + 1);
        }

      }, totalWait * 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(ticker);
      };
    }
  }, [isBroadcasting, isPaused, broadcastIndex, selectedBulkSatkers, broadcastConfig]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 rounded-3xl text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
              <Send className="w-3.5 h-3.5" />
              INTEGRASI WHATSAPP GATEWAY &amp; BROADCAST ENGINE
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              waDevice.isConnected 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}>
              {waDevice.isConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
              <span>{waDevice.isConnected ? 'WA Connected (Active)' : 'WA Terputus'}</span>
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">
            Pengirim Pesan &amp; Broadcast Smart WhatsApp KPPN Semarang I
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Terhubung langsung ke nomor WhatsApp Admin KPPN dengan sistem perlindungan anti-spam (jeda acak &amp; pembatasan kuota) agar tidak terdeteksi SPAM saat broadcast teguran ke banyak Satker.
          </p>
        </div>

        {isAdminAuthenticated && (
          <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700 shrink-0 self-start md:self-center">
            <button
              onClick={() => setTargetMode('SINGLE')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                targetMode === 'SINGLE' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satker Tunggal
            </button>
            <button
              onClick={() => setTargetMode('BULK')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                targetMode === 'BULK' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Broadcast Anti-Spam
            </button>
          </div>
        )}
      </div>

      {/* WhatsApp Device Connection Bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
            waDevice.isConnected 
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
              : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}>
            <Smartphone className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {waDevice.isConnected ? `Perangkat Terhubung: ${waDevice.phoneNumber}` : 'WhatsApp Gateway Belum Terhubung'}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                waDevice.isConnected ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
              }`}>
                {waDevice.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {waDevice.isConnected 
                ? `${waDevice.deviceName} • Baterai: ${waDevice.batteryLevel}% • Status Socket: ${waDevice.lastSeen}`
                : 'Pindai QR Code menggunakan aplikasi WhatsApp di HP Admin untuk mengaktifkan fitur kirim otomatis.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {waDevice.isConnected ? (
            <>
              <button
                onClick={handlePingTest}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl transition-all border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                <span>Uji Ping WA</span>
              </button>

              <button
                onClick={() => setIsQrModalOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl transition-all border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-500" />
                <span>Ubah Perangkat QR</span>
              </button>

              <button
                onClick={handleDisconnectWa}
                className="bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900 transition-all cursor-pointer"
              >
                Putuskan WA
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR Code WA Sekarang</span>
            </button>
          )}
        </div>
      </div>

      {!isAdminAuthenticated ? (
        /* LOCK SCREEN FOR NON-ADMIN USERS */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xl space-y-5 my-6">
          <div className="w-16 h-16 bg-amber-500/15 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-block bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-black text-[10px] uppercase px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800 mb-2">
              TERPROTEKSI: KPPN ADMIN ACCESS ONLY
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Akses Fitur Kirim Pengingat WA Terkunci
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 max-w-md mx-auto leading-relaxed">
              Pengiriman teguran broadcast WhatsApp dan draf surat resmi hanya dapat dilakukan oleh pejabat/petugas Admin KPPN Semarang I. Silakan masukkan password Admin untuk membuka akses.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-3 pt-2 max-w-sm mx-auto">
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="Masukkan Password Admin KPPN..."
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (pinError) setPinError(null);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {pinError && (
              <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center justify-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>Buka Akses Pengingat WA</span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Atau Anda dapat masuk via menu </span>
            <button
              onClick={() => {
                if (onGoToAdminTab) onGoToAdminTab();
              }}
              className="text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
            >
              Admin &amp; Upload
            </button>
          </div>
        </div>
      ) : (
        /* MAIN UNLOCKED REMINDER & BROADCAST CONTROLS */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Config Controls */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>1. Parameter Target &amp; Template</span>
            </h3>

            {/* Target Mode Single vs Bulk */}
            {targetMode === 'SINGLE' ? (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Satker Tujuan:
                </label>
                <select
                  value={selectedSatkerId}
                  onChange={(e) => setSelectedSatkerId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                >
                  {satkers.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.kodeSatker}] {s.namaSatker} (IKPA: {Number.isFinite(s.nilaiTotalIKPA) ? s.nilaiTotalIKPA : 0})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Filter Preset Satker Bermasalah:</span>
                    <span className="text-amber-600 dark:text-amber-400 font-black">{selectedBulkSatkers.length} Satker Terpilih</span>
                  </label>

                  <select
                    value={filterPreset}
                    onChange={(e: any) => setFilterPreset(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-extrabold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="BELUM_OUTPUT">🔴 Satker Belum / 0% Upload Capaian Output SAKTI</option>
                    <option value="IKPA_KURANG">⚠️ Satker Nilai IKPA Rendah (&lt; 87.50)</option>
                    <option value="DEVIASI_TINGGI">📉 Satker Deviasi Hal III DIPA Tinggi</option>
                    <option value="SERTIFIKASI_BERMASALAH">🏅 Satker Sertifikasi Pejabat Belum Valid</option>
                    <option value="ALL">🌐 Semua Satker Mitra KPPN Semarang I</option>
                  </select>
                </div>

                {/* Search Box & Quick Toggle */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold text-slate-500">Daftar Satker Tercentang:</span>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <button
                        onClick={() => setSelectedSatkerIds(satkers.map(s => s.id))}
                        className="text-amber-600 dark:text-amber-400 hover:underline font-extrabold cursor-pointer"
                      >
                        Pilih Semua
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => setSelectedSatkerIds([])}
                        className="text-slate-400 hover:underline cursor-pointer"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Cari kode/nama satker..."
                    value={searchSatkerQuery}
                    onChange={(e) => setSearchSatkerQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 mb-2"
                  />

                  <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
                    {satkers
                      .filter(s => {
                        if (!searchSatkerQuery.trim()) return true;
                        const q = searchSatkerQuery.toLowerCase();
                        return s.namaSatker.toLowerCase().includes(q) || s.kodeSatker.includes(q);
                      })
                      .map(s => {
                        const isChecked = selectedSatkerIds.includes(s.id);

                        return (
                          <label
                            key={s.id}
                            className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                              isChecked ? 'bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSatkerIds(prev => [...prev, s.id]);
                                  } else {
                                    setSelectedSatkerIds(prev => prev.filter(id => id !== s.id));
                                  }
                                }}
                                className="rounded text-amber-600 focus:ring-amber-500"
                              />
                              <span className="font-mono text-[10px] text-slate-400">[{s.kodeSatker}]</span>
                              <span className="truncate">{s.namaSatker}</span>
                            </div>

                            <span className="text-[10px] shrink-0 font-mono text-rose-600 dark:text-rose-400">
                              IKPA: {Number.isFinite(s.nilaiTotalIKPA) ? s.nilaiTotalIKPA : 0}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Template Selector */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Jenis Template Teguran:
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
              >
                {REMINDER_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.judul} ({t.jenis})
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Custom Variables */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-400" /> No. Surat Official
                </label>
                <input
                  type="text"
                  value={noSurat}
                  onChange={(e) => setNoSurat(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Batas Waktu
                </label>
                <input
                  type="text"
                  value={batasWaktu}
                  onChange={(e) => setBatasWaktu(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Catatan Khusus */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Khusus dari CSO / KPPN (Opsional):
              </label>
              <textarea
                rows={2}
                value={catatanKhusus}
                onChange={(e) => setCatatanKhusus(e.target.value)}
                placeholder="Contoh: Harap konfirmasi dengan Ibu Rina CSO KPPN SMG I..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              ></textarea>
            </div>

            {/* Anti-Spam Safety Settings Card */}
            <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                  Pengaturan Anti-Spam &amp; Jeda Kirim
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">AMUNISI AMAN WA</span>
              </div>

              {/* Delay Slider */}
              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Jeda Antar Pesan:</span>
                  <span className="text-amber-600 font-mono">{broadcastConfig.delaySeconds} Detik</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={30}
                  step={1}
                  value={broadcastConfig.delaySeconds}
                  onChange={(e) => setBroadcastConfig(prev => ({ ...prev, delaySeconds: Number(e.target.value) }))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Jitter Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={broadcastConfig.useJitter}
                  onChange={(e) => setBroadcastConfig(prev => ({ ...prev, useJitter: e.target.checked }))}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                  Acak Jeda Waktu (Jitter +1s s.d +5s agar mirip pengetikan manusia)
                </span>
              </label>
            </div>

          </div>

          {/* Right Column (Span 2): Preview / Automated Broadcast Queue */}
          <div className="lg:col-span-2 space-y-6">
            
            {targetMode === 'SINGLE' ? (
              <>
                {/* Single WA Preview Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="bg-emerald-800 dark:bg-emerald-950 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-emerald-300" />
                      <div>
                        <h4 className="text-sm font-black">Draft Pesan WhatsApp Broadcast Satker</h4>
                        <p className="text-[11px] text-emerald-200">Dapat langsung dikirim ke nomor PIC Satker</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyWA}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl border border-emerald-500/50 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        {copiedWA ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWA ? 'Tersalin!' : 'Salin Pesan WA'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto">
                    {compiledWA}
                  </div>
                </div>

                {/* Surat Resmi Preview Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-400" />
                      <div>
                        <h4 className="text-sm font-black">Draft Surat Resmi KPPN Semarang I</h4>
                        <p className="text-[11px] text-slate-400">Subjek: {compiledSubjek}</p>
                      </div>
                    </div>

                    <button
                      onClick={handleCopySurat}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedSurat ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSurat ? 'Tersalin!' : 'Salin Draft Surat'}</span>
                    </button>
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 font-serif text-xs leading-relaxed whitespace-pre-wrap border-t border-slate-200 dark:border-slate-800">
                    {compiledSurat}
                  </div>
                </div>
              </>
            ) : (
              /* AUTOMATED BULK BROADCAST QUEUE ENGINE */
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase mb-1">
                      <Zap className="w-3 h-3 text-amber-500" /> AUTOMATED ANTI-SPAM ENGINE
                    </div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      Antrean Broadcast Masal ({selectedBulkSatkers.length} Satker Terpilih)
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isBroadcasting ? (
                      <button
                        onClick={startBroadcastEngine}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Mulai Broadcast Otomatis</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsPaused(!isPaused)}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          {isPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5" />}
                          <span>{isPaused ? 'Lanjutkan' : 'Jeda (Pause)'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsBroadcasting(false);
                            setIsPaused(false);
                          }}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <StopCircle className="w-3.5 h-3.5" />
                          <span>Hentikan</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Countdown Timer */}
                {isBroadcasting && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                        Progres Broadcast: {broadcastIndex + 1} dari {selectedBulkSatkers.length || 1} Pesan
                      </span>
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-black">
                        {selectedBulkSatkers.length > 0 ? Math.round(((broadcastIndex) / selectedBulkSatkers.length) * 100) : 0}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full transition-all duration-500"
                        style={{ width: `${selectedBulkSatkers.length > 0 ? Math.min(100, Math.max(0, ((broadcastIndex) / selectedBulkSatkers.length) * 100)) : 0}%` }}
                      ></div>
                    </div>

                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between pt-1">
                      <span>Memproses: <strong>{selectedBulkSatkers[broadcastIndex]?.namaSatker}</strong></span>
                      <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-mono text-[10px]">
                        Anti-Spam Delay: {countdownTimer}s
                      </span>
                    </div>
                  </div>
                )}

                {/* Broadcast Satker Table Log */}
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {selectedBulkSatkers.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Tidak ada Satker yang tercentang. Pilih Satker di panel kiri untuk memulai broadcast.
                    </div>
                  ) : (
                    selectedBulkSatkers.map((satker, idx) => {
                      const logItem = broadcastLogs.find(l => l.id === satker.id);
                      const isCurrent = isBroadcasting && broadcastIndex === idx;

                      return (
                        <div
                          key={satker.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isCurrent
                              ? 'bg-amber-500/15 border-amber-500/50 ring-2 ring-amber-500/30'
                              : logItem?.status === 'SENT'
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold bg-slate-900 text-amber-300 px-2 py-0.5 rounded">
                                {satker.kodeSatker}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{satker.namaSatker}</span>
                              
                              {logItem?.status === 'SENT' && (
                                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" /> TERKIRIM
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              PIC: <strong>{satker.namaPic || 'Bendahara'}</strong> ({satker.noHpPic || 'Tanpa No HP'}) • Nilai IKPA: <span className="font-bold text-rose-600">{Number.isFinite(satker.nilaiTotalIKPA) ? satker.nilaiTotalIKPA : 0}</span> ({satker.predikat})
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                const txt = compileTemplate(activeTemplate.isiWa, satker);
                                navigator.clipboard.writeText(txt);
                                alert(`Draf WA untuk ${satker.namaSatker} berhasil disalin!`);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-800 dark:text-slate-200 rounded-xl flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Teks WA</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* SCAN QR CODE MODAL */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-6 h-6 text-emerald-500" />
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Scan QR Code WA Gateway
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    KPPN Semarang I WhatsApp Web Integration
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsQrModalOpen(false)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold p-2 rounded-xl text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Toggle QR vs Pairing Code */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setPairingMethod('QR')}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  pairingMethod === 'QR' ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                1. Scan QR Code
              </button>
              <button
                onClick={() => {
                  setPairingMethod('PAIRING_CODE');
                  generatePairingCode();
                }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  pairingMethod === 'PAIRING_CODE' ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                2. Tautkan Kode HP
              </button>
            </div>

            {pairingMethod === 'QR' ? (
              <div className="text-center space-y-4">
                {/* QR Code Container with Animation Line */}
                <div className="relative w-56 h-56 mx-auto bg-slate-950 p-4 rounded-3xl border-4 border-emerald-500/50 shadow-inner flex flex-col items-center justify-center overflow-hidden">
                  
                  {/* Laser Beam Animation Line */}
                  <div className="absolute inset-x-0 h-1 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-pulse top-1/2 -translate-y-1/2"></div>

                  {/* Dynamic Matrix QR pattern */}
                  <div className="grid grid-cols-6 gap-1.5 w-full h-full p-2 bg-white rounded-2xl">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`rounded-xs ${
                          (i * 7) % 3 === 0 ? 'bg-slate-950' : (i * 5) % 2 === 0 ? 'bg-emerald-600' : 'bg-slate-200'
                        }`}
                      ></div>
                    ))}
                  </div>

                  {/* KPPN Badge in center */}
                  <div className="absolute bg-slate-900 text-amber-400 border border-amber-500 text-[10px] font-black px-2 py-0.5 rounded-md shadow-md">
                    KPPN 026
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-bold">Buka WhatsApp di HP &gt; Perangkat Tertaut &gt; Tautkan Perangkat</p>
                  <p className="text-slate-400 text-[11px]">
                    QR Code diperbarui otomatis dalam <span className="font-bold text-amber-500 font-mono">{qrCountdown}s</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Masukkan nomor HP Admin WhatsApp KPPN Semarang I untuk mendapatkan Kode Penautan 8-Digit:
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={pairingPhoneInput}
                    onChange={(e) => setPairingPhoneInput(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full text-center font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 text-slate-900 dark:text-white"
                  />

                  <div className="bg-slate-950 text-emerald-400 font-mono text-2xl font-black py-4 rounded-2xl tracking-widest border border-emerald-500/40 shadow-inner">
                    {generatedPairingCode || 'K9X2-P8ML'}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Masukkan kode di atas pada notifikasi penautan perangkat di aplikasi WhatsApp HP Anda.
                </p>
              </div>
            )}

            {/* Simulated Action */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                onClick={handleConnectSimulatedQr}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Simulasikan Scan Berhasil &amp; Hubungkan WA</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modern Confirmation Modal */}
      <ModernConfirmModal
        modal={confirmModal}
        onClose={() => setConfirmModal(null)}
        isDark={isDark}
      />

    </div>
  );
};
