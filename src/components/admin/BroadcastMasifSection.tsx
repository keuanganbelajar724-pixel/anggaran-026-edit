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
  BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
  onNavigateToPerhatian,
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

  const [customBroadcastExcelList, setCustomBroadcastExcelList] = useState<any[]>([]);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  isPausedRef.current = isPaused;

  const [broadcastProgress, setBroadcastProgress] = useState<number>(0);
  const [broadcastLogs, setBroadcastLogs] = useState<string[]>([]);
  const [sentStats, setSentStats] = useState<{ success: number; failed: number; total: number }>({ success: 0, failed: 0, total: 0 });

  // Recipient Selection & Editing Overrides State
  const [unselectedRecipientIds, setUnselectedRecipientIds] = useState<string[]>([]);
  const [recipientOverrides, setRecipientOverrides] = useState<Record<string, { pejabatNama?: string; pejabatNoHp?: string; renderedMessage?: string }>>({});
  const [recipientSearchQuery, setRecipientSearchQuery] = useState<string>('');
  const [editingCustomMsgModal, setEditingCustomMsgModal] = useState<{ id: string; recipientName: string; satkerNama: string; currentMsg: string } | null>(null);

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

  // Anti-Ban & Rate-Limiting Controls
  const [delayBetweenMs, setDelayBetweenMs] = useState<number>(1200); // 1.2s default
  const [useRandomJitter, setUseRandomJitter] = useState<boolean>(true); // +200-800ms
  const [batchPauseSize, setBatchPauseSize] = useState<number>(25); // Pause 5s every 25 messages

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
      localStorage.setItem('kppn_wa_gateway_config', JSON.stringify(configToSave));
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
          isPerhatian,
          isEdited: !!override
        });
      });
    });

    return recipients;
  }, [targetSatkers, selectedBroadcastRoles, recipientOverrides, customBroadcastExcelList, broadcastTemplateText]);

  // Filtered Recipients by Search Bar
  const filteredRecipients = useMemo(() => {
    if (!recipientSearchQuery.trim()) return calculatedRecipients;
    const q = recipientSearchQuery.toLowerCase();
    return calculatedRecipients.filter(rec => (
      rec.satkerNama.toLowerCase().includes(q) ||
      rec.satkerKode.toLowerCase().includes(q) ||
      rec.pejabatNama.toLowerCase().includes(q) ||
      rec.pejabatNoHp.toLowerCase().includes(q) ||
      rec.roleLabel.toLowerCase().includes(q)
    ));
  }, [calculatedRecipients, recipientSearchQuery]);

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

  // Mass Broadcast Execution Engine with Jitter & Smart Delay
  const handleStartMassBroadcast = async () => {
    const recipients = selectedRecipients;

    if (recipients.length === 0) {
      alert('Tidak ada penerima broadcast yang terpilih.');
      return;
    }

    if (waGatewayProvider !== 'simulasi' && waGatewayProvider !== 'wa_me_link' && !waGatewayToken && waGatewayProvider !== 'custom_api') {
      alert(`Anda memilih provider '${waGatewayProvider.toUpperCase()}', namun API Token belum diisi/disimpan. Silakan simpan API Token pada kartu 'Pengaturan Token Gateway'.`);
      return;
    }

    // Auto save gateway token
    handleSaveGatewaySettings(false);

    const isPerhatianFocused = broadcastTargetFilter === 'PERHATIAN_SEMUA';
    const confirmMsg = waGatewayProvider === 'simulasi'
      ? `Jalankan Simulasi Broadcast Konsol ke ${recipients.length} penerima${isPerhatianFocused ? ' (Fokus Satker Dalam Perhatian)' : ''}?`
      : `PERINGATAN RESMI: Pengiriman REAL via Gateway '${waGatewayProvider.toUpperCase()}' ke ${recipients.length} nomor WhatsApp pejabat satker.\n\nLanjutkan pengiriman pesan sekarang?`;

    if (!confirm(confirmMsg)) return;

    setIsSendingBroadcast(true);
    setIsPaused(false);
    setBroadcastProgress(0);
    setSentStats({ success: 0, failed: 0, total: recipients.length });
    setBroadcastLogs([`[SYSTEM] Memulai antrean broadcast masif ke ${recipients.length} Pejabat Satker via Provider '${waGatewayProvider.toUpperCase()}'...`]);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      // Check pause
      while (isPausedRef.current) {
        await new Promise(res => setTimeout(res, 500));
      }

      const rec = recipients[i];
      const result = await sendSingleWaMessage(rec.pejabatNoHp, rec.renderedMessage);

      if (result.success) {
        successCount++;
        setBroadcastLogs(prev => [
          `[${new Date().toLocaleTimeString('id-ID')}] TERKIRIM 🟢 (${result.note}) -> ${rec.roleLabel} (${rec.pejabatNama}) | Satker: ${rec.satkerNama} (${rec.satkerKode}) | No: ${rec.pejabatNoHp}`,
          ...prev.slice(0, 150)
        ]);
      } else {
        failCount++;
        setBroadcastLogs(prev => [
          `[${new Date().toLocaleTimeString('id-ID')}] GAGAL 🔴 (${result.note}) -> ${rec.roleLabel} (${rec.pejabatNama}) | No: ${rec.pejabatNoHp}`,
          ...prev.slice(0, 150)
        ]);
      }

      setSentStats({ success: successCount, failed: failCount, total: recipients.length });
      const progress = Math.round(((i + 1) / recipients.length) * 100);
      setBroadcastProgress(progress);

      // Smart Rate-Limiting & Jitter Delay to protect WhatsApp account from bans
      if (i < recipients.length - 1) {
        let sleepDuration = delayBetweenMs;
        if (useRandomJitter) {
          sleepDuration += Math.floor(Math.random() * 600);
        }

        // Batch pause check
        if (batchPauseSize > 0 && (i + 1) % batchPauseSize === 0) {
          setBroadcastLogs(prev => [`[ANTI-BAN COOLDOWN] Menjeda 5 detik otomatis setelah ${i + 1} pesan terkirim...`, ...prev]);
          await new Promise(res => setTimeout(res, 5000));
        } else {
          await new Promise(res => setTimeout(res, waGatewayProvider === 'simulasi' ? 120 : sleepDuration));
        }
      }
    }

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
        message: `Total ${successCount} pesan berhasil terkirim, ${failCount} gagal.`
      });
    } else {
      alert(`Proses broadcast masif selesai!\n- Terkirim: ${successCount}\n- Gagal: ${failCount}`);
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

            <div className="flex items-center gap-2 shrink-0">
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
                <span>Pilih Semua Satker Perhatian ({perhatianSatkers.length})</span>
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
              <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 font-black">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Pengaturan Gateway WhatsApp &amp; Penyimpanan Token API
                  </h4>
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                    Auto-Saved &amp; Secure
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Token WhatsApp disimpan secara permanen di memori browser dan basis data admin. Ubah token kapan saja dan klik <strong>Simpan Token</strong> untuk menerapkan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowGatewayConfigHelp(!showGatewayConfigHelp)}
                className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showGatewayConfigHelp ? 'Tutup Panduan' : 'Panduan Token'}</span>
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

          {/* Premium Anti-Ban & Rate Limiter Bar */}
          <div className="bg-slate-900/5 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-emerald-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <div className="font-bold text-slate-700 dark:text-slate-300">Jeda Antar Pesan:</div>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="250"
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

            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useRandomJitter}
                  onChange={(e) => setUseRandomJitter(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Smart Jitter (+200ms - 800ms)</div>
                  <div className="text-[10px] text-slate-500">Mencegah deteksi bot anti-spam WA</div>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <label className="flex items-center gap-1.5">
                <span className="font-bold text-slate-600 dark:text-slate-400 text-[11px]">Pause per:</span>
                <select
                  value={batchPauseSize}
                  onChange={(e) => setBatchPauseSize(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                >
                  <option value="15">15 Pesan (Istirahat 5s)</option>
                  <option value="25">25 Pesan (Istirahat 5s)</option>
                  <option value="50">50 Pesan (Istirahat 5s)</option>
                  <option value="0">Tanpa Pause</option>
                </select>
              </label>
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

            {/* Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-500 text-[11px]">Pilih Preset:</span>
              {[
                { key: 'preset_perhatian', name: '⚠️ Satker Perhatian' },
                { key: 'preset_output', name: '🔴 Capaian Output' },
                { key: 'preset_deviasi', name: '📊 Deviasi Hal III' },
                { key: 'preset_penyerapan', name: '💸 Penyerapan Anggaran' },
                { key: 'preset_apresiasi', name: '🏆 Apresiasi Baik' }
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
                onClick={handleStartMassBroadcast}
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
          <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            
            {/* Search Box */}
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={recipientSearchQuery}
                onChange={(e) => setRecipientSearchQuery(e.target.value)}
                placeholder="Cari Satker, Pejabat, No HP, Peran..."
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
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer text-xs"
              >
                {isAllChecked ? <CheckSquare className="w-3.5 h-3.5 text-rose-500" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                <span>{isAllChecked ? 'Hapus Centang Semua' : 'Centang Semua (' + filteredRecipients.length + ')'}</span>
              </button>

              {Object.keys(recipientOverrides).length > 0 && (
                <button
                  type="button"
                  onClick={() => setRecipientOverrides({})}
                  className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 flex items-center gap-1.5 cursor-pointer text-[11px]"
                  title="Kembalikan semua nama, nomor HP, dan pesan yang pernah diedit ke data asli"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ({Object.keys(recipientOverrides).length}) Edit Manual</span>
                </button>
              )}

              <span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-xl font-mono font-bold text-[11px]">
                {selectedCount} Terpilih
              </span>
            </div>

          </div>

          {/* Progress Bar during broadcast */}
          {isSendingBroadcast && (
            <div className="space-y-2 bg-slate-900 p-4 rounded-2xl border border-slate-800 text-white">
              <div className="flex justify-between text-xs font-bold text-rose-400">
                <span>
                  {isPaused ? '⏸️ Pengiriman Masif Dijeda...' : '🚀 Pengiriman Masif Berjalan...'}
                </span>
                <span>{sentStats.success} Berhasil | {sentStats.failed} Gagal ({broadcastProgress}%)</span>
              </div>
              <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 h-full transition-all duration-300"
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
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[460px] overflow-y-auto shadow-sm">
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
                  <th className="py-2.5 px-3 min-w-[200px]">Satker Target</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Peran &amp; Nama Pejabat</th>
                  <th className="py-2.5 px-3 min-w-[140px]">No WhatsApp</th>
                  <th className="py-2.5 px-3 min-w-[260px]">Teks Pesan Ter-render</th>
                  <th className="py-2.5 px-3 text-center">Status Data</th>
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
                          <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{rec.satkerNama}</span>
                            {rec.isPerhatian && (
                              <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-rose-300 shrink-0">
                                Perhatian
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">Kode: {rec.satkerKode} | Skor IKPA: {rec.nilaiIkpa}</div>
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
                            <span>Edit Pesan Khusus Satker Ini</span>
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

        </div>

      </div>

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

    </div>
  );
};
