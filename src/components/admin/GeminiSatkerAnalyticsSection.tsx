import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Key,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Download,
  Trash2,
  BrainCircuit,
  TrendingDown,
  FileText,
  CreditCard,
  Building2,
  ExternalLink,
  ShieldCheck,
  Cpu,
  MessageSquareQuote,
  Target,
  Zap,
  BookOpen,
  Award,
  Archive,
  FolderArchive,
  History,
  Info,
  Layers,
  LineChart,
  BadgeDollarSign,
  PieChart,
  MessageSquare,
  X,
  Share2,
  FileSpreadsheet,
  CheckCheck,
  Sliders,
  Maximize2,
  Presentation
} from 'lucide-react';
import { IKPAPresentationDeckModal } from './IKPAPresentationDeckModal';
import {
  generateGeminiContent,
  testGeminiConnection,
  checkGeminiStatus,
  getClientStoredApiKey,
  saveClientStoredApiKey,
  loadCloudGeminiConfig,
  saveCloudGeminiConfig,
  subscribeToCloudGeminiConfig,
  loadCloudChatHistory,
  saveCloudChatHistory,
  subscribeToCloudChatHistory,
  loadCloudArchivedSessions,
  saveCloudArchivedSessions,
  subscribeToCloudArchivedSessions,
  GeminiServerStatus
} from '../../services/geminiService';
import { generateLocalFinancialAnalysis } from '../../utils/localAiAnalystEngine';
import {
  SatkerIKPA,
  MasterSatker,
  PengelolaanUPRecord,
  TransaksiKKPRecord,
  DigipayRecord,
  PejabatSertifikasi,
  DashboardConfig,
  ChatMessage,
  ArchivedChatSession,
  AnalystRolePersona
} from '../../types';

interface GeminiSatkerAnalyticsSectionProps {
  satkers: SatkerIKPA[];
  masterSatkers?: MasterSatker[];
  pejabatList?: PejabatSertifikasi[];
  pengelolaanUpRecords?: PengelolaanUPRecord[];
  transaksiKkpRecords?: TransaksiKKPRecord[];
  transaksiDigipayRecords?: DigipayRecord[];
  dashboardConfig?: DashboardConfig;
  isDark?: boolean;
  selectedSatkerForDiagnosis?: SatkerIKPA | null;
  onClearSelectedDiagnosisSatker?: () => void;
  onSendToBroadcast?: (templateText: string) => void;
}

export type { ChatMessage, ArchivedChatSession, AnalystRolePersona };

export const GeminiSatkerAnalyticsSection: React.FC<GeminiSatkerAnalyticsSectionProps> = ({
  satkers = [],
  masterSatkers = [],
  pejabatList = [],
  pengelolaanUpRecords = [],
  transaksiKkpRecords = [],
  transaksiDigipayRecords = [],
  dashboardConfig,
  isDark = false,
  selectedSatkerForDiagnosis = null,
  onClearSelectedDiagnosisSatker,
  onSendToBroadcast
}) => {
  const [isPresentationDeckOpen, setIsPresentationDeckOpen] = useState<boolean>(false);
  // API Key Management State & Server Connection Status
  const [apiKey, setApiKey] = useState<string>(() => {
    return getClientStoredApiKey();
  });
  const [serverStatus, setServerStatus] = useState<GeminiServerStatus | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [tempApiKeyInput, setTempApiKeyInput] = useState<string>('');
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean | null>(null);
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.6-flash');

  // Check server status & Sync with Firestore on mount
  useEffect(() => {
    let isMounted = true;
    checkGeminiStatus().then((status) => {
      if (isMounted) {
        setServerStatus(status);
      }
    });

    // 1. Initial load Gemini Config (API Key & Model) from Firestore Cloud
    loadCloudGeminiConfig().then((cfg) => {
      if (isMounted && cfg) {
        if (cfg.apiKey) {
          setApiKey(cfg.apiKey);
          setTempApiKeyInput(cfg.apiKey);
        }
        if (cfg.selectedModel) {
          setSelectedModel(cfg.selectedModel);
        }
      }
    });

    // 2. Initial load Chat Messages & Archives from Firestore Cloud
    loadCloudChatHistory().then((cloudMsgs) => {
      if (isMounted && cloudMsgs && cloudMsgs.length > 0) {
        setChatMessages(cloudMsgs);
      }
    });

    loadCloudArchivedSessions().then((cloudArchives) => {
      if (isMounted && cloudArchives && cloudArchives.length > 0) {
        setArchivedSessions(cloudArchives);
      }
    });

    // 3. Real-time Firestore sync listeners
    const unsubConfig = subscribeToCloudGeminiConfig((cfg) => {
      if (isMounted && cfg) {
        if (cfg.apiKey !== undefined) {
          setApiKey(cfg.apiKey);
          setTempApiKeyInput(cfg.apiKey);
        }
        if (cfg.selectedModel) {
          setSelectedModel(cfg.selectedModel);
        }
      }
    });

    const unsubChat = subscribeToCloudChatHistory((cloudMsgs) => {
      if (isMounted && cloudMsgs && cloudMsgs.length > 0) {
        setChatMessages(cloudMsgs);
      }
    });

    const unsubArchives = subscribeToCloudArchivedSessions((cloudArchives) => {
      if (isMounted && cloudArchives && cloudArchives.length > 0) {
        setArchivedSessions(cloudArchives);
      }
    });

    return () => {
      isMounted = false;
      unsubConfig();
      unsubChat();
      unsubArchives();
    };
  }, []);

  // Storage Info Modal State
  const [showStorageInfoModal, setShowStorageInfoModal] = useState<boolean>(false);

  // Archive Management State
  const [archivedSessions, setArchivedSessions] = useState<ArchivedChatSession[]>(() => {
    const saved = localStorage.getItem('kppn_gemini_archived_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse archived chat sessions', e);
      }
    }
    return [];
  });
  const [showArchiveModal, setShowArchiveModal] = useState<boolean>(false);
  const [viewingArchivedSession, setViewingArchivedSession] = useState<ArchivedChatSession | null>(null);

  // Chat & Analysis State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('kppn_gemini_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved chat history', e);
      }
    }
    return [
      {
        id: 'msg-welcome',
        sender: 'system',
        text: 'Selamat datang di **Asisten Analis Keuangan & IKPA SAKTI (Powered by Google Gemini 3.6 Flash)**.\n\nSaya telah terhubung langsung dengan seluruh basis data Satker KPPN Semarang I (Nilai IKPA, 8 Indikator, Capaian Output, Realisasi Pagu, KKP, dan Digipay).\n\n💡 *Percakapan tersinkronisasi secara real-time antar perangkat melalui Cloud Firestore Database.*',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedSatkerFilter, setSelectedSatkerFilter] = useState<string>('');
  const [showKeyGuide, setShowKeyGuide] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copyFeedbackType, setCopyFeedbackType] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitialMount = useRef<boolean>(true);

  // Role Persona State
  const [selectedPersona, setSelectedPersona] = useState<AnalystRolePersona>('mski_analyst');

  // Auto-scroll ONLY the chat messages container to bottom without affecting the parent page scroll
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages.length, isLoading]);

  // If a Satker was passed for direct diagnosis
  useEffect(() => {
    if (selectedSatkerForDiagnosis) {
      setSelectedSatkerFilter(selectedSatkerForDiagnosis.kodeSatker);
      handleDirectSatkerAnalysis(selectedSatkerForDiagnosis);
      if (onClearSelectedDiagnosisSatker) {
        onClearSelectedDiagnosisSatker();
      }
    }
  }, [selectedSatkerForDiagnosis]);

  // Calculate live summary statistics for contextual grounding
  const stats = React.useMemo(() => {
    const total = satkers.length;
    if (total === 0) {
      return {
        total: 0,
        avgIKPA: 0,
        satkerDalamPerhatian: [],
        belowIKPA: [],
        belowOutput: [],
        belowDeviasi: [],
        belowPenyerapan: []
      };
    }

    const avgIKPA = Number((satkers.reduce((acc, s) => acc + (s.nilaiTotalIKPA || 0), 0) / total).toFixed(2));
    const belowIKPA = satkers.filter(s => s.nilaiTotalIKPA < 87.5);
    const belowOutput = satkers.filter(s => s.statusCapaianOutput !== 'Sudah Terlaporkan');
    const belowDeviasi = satkers.filter(s => (s.indikator?.deviasiHal3Dipa || 0) < 75);
    const belowPenyerapan = satkers.filter(s => (s.persenPenyerapan || 0) < 75);

    const satkerDalamPerhatian = satkers.filter(s => 
      s.nilaiTotalIKPA < 87.5 || 
      s.statusCapaianOutput !== 'Sudah Terlaporkan' || 
      (s.persenPenyerapan || 0) < 75 || 
      (s.indikator?.deviasiHal3Dipa || 0) < 75
    ).sort((a, b) => a.nilaiTotalIKPA - b.nilaiTotalIKPA);

    return {
      total,
      avgIKPA,
      satkerDalamPerhatian,
      belowIKPA,
      belowOutput,
      belowDeviasi,
      belowPenyerapan
    };
  }, [satkers]);

  // Construct comprehensive system prompt with current dataset context & Persona
  const buildSystemContextPrompt = (): string => {
    const satkerSummaries = satkers.map(s => {
      const picInfo = s.namaPic ? ` (PIC: ${s.namaPic} - ${s.noHpPic || 'No WA -'})` : '';
      return `- [${s.kodeSatker}] ${s.namaSatker} | IKPA: ${s.nilaiTotalIKPA} (${s.predikat}) | Pagu: Rp${(s.paguAnggaran || 0).toLocaleString('id-ID')} | Real: ${(s.persenPenyerapan || 0).toFixed(1)}% | Output: ${s.statusCapaianOutput} | Deviasi Hal III: ${s.indikator?.deviasiHal3Dipa || 0} | Penyerapan: ${s.indikator?.penyerapanAnggaran || 0} | UP/TUP: ${s.indikator?.pengelolaanUpTup || 0} | Tagihan: ${s.indikator?.penyelesaianTagihan || 0} | Kontraktual: ${s.indikator?.belanjaKontraktual || 0} | Dispensasi: ${s.indikator?.dispensasiSpm || 0}${picInfo}`;
    }).join('\n');

    const perhatianSummaries = stats.satkerDalamPerhatian.map(s => {
      const issues: string[] = [];
      if (s.nilaiTotalIKPA < 87.5) issues.push(`Nilai IKPA Rendah (${s.nilaiTotalIKPA})`);
      if (s.statusCapaianOutput !== 'Sudah Terlaporkan') issues.push(`Status Output: ${s.statusCapaianOutput}`);
      if ((s.indikator?.deviasiHal3Dipa || 0) < 75) issues.push(`Deviasi Hal III Kritis (${s.indikator?.deviasiHal3Dipa}%)`);
      if ((s.persenPenyerapan || 0) < 75) issues.push(`Penyerapan Rendah (${(s.persenPenyerapan || 0).toFixed(1)}%)`);
      return `* Satker [${s.kodeSatker}] ${s.namaSatker} -> Masalah: ${issues.join(', ')}`;
    }).join('\n');

    let personaInstruction = '';
    if (selectedPersona === 'pakar_keuangan_negara') {
      personaInstruction = `PERAN UTAMA: Anda bertindak sebagai Pakar Senior Analis Keuangan Negara & Kebijakan Fiskal Publik (Chief Financial Analyst). 
Gaya berpikir & keahlian:
- Sangat menguasai teori dan praktik Pengelolaan Keuangan Negara (UU No. 1/2004, UU No. 17/2003, PMK Standar Biaya Masukan/Keluaran, serta Reformasi Penganggaran).
- Mampu membedah efisiensi alokatif, efektivitas belanja modal/barang/bansos, Value for Money (VfM), dan cost-benefit analysis.
- Memberikan saran restrukturisasi postur DIPA, optimasi sisa pagu kontraktual, pengendalian defisit likuiditas, dan mitigasi inefisiensi belanja secara tajam, matematis, dan berbobot akademisi/praktisi keuangan negara tingkat tinggi.`;
    } else if (selectedPersona === 'mski_analyst') {
      personaInstruction = `PERAN UTAMA: Anda bertindak sebagai Kepala Seksi MSKI (Manajemen Satker & Kepatuhan Internal) KPPN Semarang I. Gaya berpikir: analitis, terstruktur, berbasis data riil, berorientasi solusi pembinaan, dan menguasai Perdirjen Perbendaharaan PER-5/PB/2024 / Juknis IKPA.`;
    } else if (selectedPersona === 'kepala_kppn') {
      personaInstruction = `PERAN UTAMA: Anda bertindak sebagai Kepala KPPN Tipe A1 Semarang I. Gaya berpikir: visioner, eksekutif tingkat tinggi, tegas, fokus pada mitigasi risiko agregat fiskal regional Jawa Tengah, dan siap menyusun arahan kebijakan strategis kepada pimpinan satker mitra.`;
    } else if (selectedPersona === 'auditor_ppk') {
      personaInstruction = `PERAN UTAMA: Anda bertindak sebagai Auditor Kepatuhan & Pendamping PPK/PPSPM Satker. Gaya berpikir: sangat teliti pada kelengkapan dokumen, batas waktu 17 hari kerja SPP-SPM, aturan garansi bank kontrak, serta kepatuhan perpajakan dan rekening penampungan.`;
    } else if (selectedPersona === 'forecaster_likuiditas') {
      personaInstruction = `PERAN UTAMA: Anda bertindak sebagai Spesialis Manajemen Kas & Forecasting Likuiditas Kas Negara (Cash Flow & Treasury Planner).
Gaya berpikir & keahlian:
- Fokus pada akurasi perencanaan kas harian/mingguan/bulanan (Renkas), pemantauan saldo rekening penampungan, pola penyerapan musiman (seasonal trend), dan pencegahan idle cash / kas mengendap di bendahara.
- Memberikan proyeksi likuiditas APBN KPPN Semarang I sampai akhir tahun secara presisi.`;
    } else {
      personaInstruction = `PERAN UTAMA: Anda bertindak sebagai Pakar Teknis SAKTI & Digital Treasury Kemenkeu. Gaya berpikir: langkah klik-demi-klik teknis pada modul SAKTI (Komitmen, Pembayaran, Bendahara, Pelaporan), validasi Capaian Output, pemutakhiran RPD Triwulanan Hal III DIPA, integrasi Digipay Satu & KKP.`;
    }

    return `Anda adalah Asisten Analis AI Cerdas Pengelolaan Keuangan Negara dan Evaluasi Kinerja Anggaran (IKPA SAKTI) di KPPN Tipe A1 Semarang I (Kode KPPN 026), Ditjen Perbendaharaan (DJPb), Kementerian Keuangan RI.

${personaInstruction}

DATA AKTIF KPPN SEMARANG I (026) SAAT INI:
- Jumlah Satker Terdaftar: ${stats.total} Satker
- Rata-Rata Nilai IKPA KPPN: ${stats.avgIKPA}
- Jumlah Satker Dalam Perhatian Khusus: ${stats.satkerDalamPerhatian.length} Satker
- Jumlah Satker dengan IKPA < 87.50: ${stats.belowIKPA.length} Satker
- Jumlah Satker Belum/Terlambat Lapor Capaian Output: ${stats.belowOutput.length} Satker
- Jumlah Satker Deviasi Hal III DIPA < 75%: ${stats.belowDeviasi.length} Satker
- Jumlah Satker Realisasi Belanja < 75%: ${stats.belowPenyerapan.length} Satker
- Total Catatan Transaksi KKP: ${transaksiKkpRecords.length} data
- Total Catatan Transaksi Digipay: ${transaksiDigipayRecords.length} data
- Total Catatan Pengelolaan UP/TUP: ${pengelolaanUpRecords.length} data

DAFTAR SATKER DALAM PERHATIAN KHUSUS:
${perhatianSummaries || 'Tidak ada satker bermasalah, seluruh satker memenuhi target.'}

DATA LENGKAP SATKER:
${satkerSummaries}

FORMAT RESPON ANDA:
- Gunakan bahasa Indonesia kedinasan yang prima, elegan, solutif, dan berwibawa.
- Gunakan format Markdown rapi dengan Heading, Poin Berbutir, Tabel (jika relevan), dan Blok Rekomendasi Solusi Berjenjang (KPA -> PPK -> PPSPM -> Bendahara -> Operator).
- Berikan diagnosis akar masalah (Root Cause), dampak terhadap IKPA KPPN, dan Tindakan Remedial (Action Plan) berjangka waktu jelas (H+1 sampai H+7).`;
  };

  const handleSaveApiKey = async () => {
    const trimmed = tempApiKeyInput.trim();
    await saveCloudGeminiConfig({ apiKey: trimmed, selectedModel });
    setApiKey(trimmed);
    setShowApiKeyInput(false);
    setIsApiKeyValid(null);
    alert(trimmed ? 'Google Gemini API Key kustom berhasil disimpan & disinkronkan ke Cloud Firestore (Terkoneksi otomatis antara AI Studio dan Web Deployment)!' : 'API Key kustom dihapus.');
  };

  const handleTestApiKey = async () => {
    const keyToTest = (tempApiKeyInput || apiKey || getClientStoredApiKey()).trim();
    setIsTestingKey(true);
    setIsApiKeyValid(null);

    try {
      const testRes = await testGeminiConnection({
        apiKey: keyToTest || undefined,
        model: selectedModel
      });

      setIsApiKeyValid(testRes.success);
      if (testRes.success && keyToTest) {
        await saveCloudGeminiConfig({ apiKey: keyToTest, selectedModel });
      }
      alert(testRes.message);
    } catch (err: any) {
      console.error('Test API Key Error', err);
      setIsApiKeyValid(false);
      alert(`Tes Koneksi Gagal: ${err.message || 'API Key tidak valid atau kuota habis.'}`);
    } finally {
      setIsTestingKey(false);
    }
  };

  const executeGeminiRequest = async (userPromptText: string, satkerContext?: SatkerIKPA | null) => {
    const activeKey = (apiKey || getClientStoredApiKey() || '').trim();
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userPromptText,
      timestamp,
      targetSatkerKode: satkerContext?.kodeSatker,
      rolePersona: selectedPersona
    };

    const updatedWithUser = [...chatMessages, userMessage];
    setChatMessages(updatedWithUser);
    saveCloudChatHistory(updatedWithUser);
    setIsLoading(true);

    try {
      const systemContext = buildSystemContextPrompt();

      let promptPayload = userPromptText;
      if (satkerContext) {
        promptPayload = `[FOKUS KHUSUS SATKER: ${satkerContext.namaSatker} (${satkerContext.kodeSatker})]\n` +
          `Data Satker: Pagu Rp${(satkerContext.paguAnggaran || 0).toLocaleString('id-ID')}, Realisasi Rp${(satkerContext.realisasiAnggaran || 0).toLocaleString('id-ID')} (${(satkerContext.persenPenyerapan || 0).toFixed(2)}%), Nilai IKPA: ${satkerContext.nilaiTotalIKPA} (${satkerContext.predikat}), Status Capaian Output: ${satkerContext.statusCapaianOutput}.\n` +
          `8 Indikator: Revisi DIPA (${satkerContext.indikator?.revisiDipa}), Deviasi Hal III (${satkerContext.indikator?.deviasiHal3Dipa}), Penyerapan (${satkerContext.indikator?.penyerapanAnggaran}), Kontraktual (${satkerContext.indikator?.belanjaKontraktual}), Tagihan (${satkerContext.indikator?.penyelesaianTagihan}), UP/TUP (${satkerContext.indikator?.pengelolaanUpTup}), Dispensasi SPM (${satkerContext.indikator?.dispensasiSpm}), Capaian Output (${satkerContext.indikator?.capaianOutput}).\n\n` +
          `Pertanyaan/Instruksi:\n${userPromptText}`;
      }

      const response = await generateGeminiContent({
        prompt: promptPayload,
        model: selectedModel,
        systemInstruction: systemContext,
        apiKey: activeKey || undefined
      });

      const replyText = response.text || 'Maaf, tidak ada output teks dari Google Gemini.';

      const botMessage: ChatMessage = {
        id: `gemini-${Date.now()}`,
        sender: 'gemini',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        targetSatkerKode: satkerContext?.kodeSatker,
        rolePersona: selectedPersona
      };

      setChatMessages(prev => {
        const next = [...prev, botMessage];
        saveCloudChatHistory(next);
        return next;
      });
    } catch (err: any) {
      console.warn('Gemini Analysis Request Error, fallback to local AI engine', err);
      const fallbackReply = generateLocalFinancialAnalysis(
        userPromptText,
        selectedPersona,
        satkers,
        stats,
        satkerContext
      );

      const errorMessage: ChatMessage = {
        id: `gemini-fallback-${Date.now()}`,
        sender: 'gemini',
        text: `${fallbackReply}\n\n> 💡 *Catatan: Analisis di atas dihasilkan melalui Mesin Analitik Finansial Terintegrasi (Koneksi API Gemini: ${err.message || 'Offline mode'}).*`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        rolePersona: selectedPersona
      };
      setChatMessages(prev => {
        const next = [...prev, errorMessage];
        saveCloudChatHistory(next);
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputQuery.trim();
    if (!query) return;

    let targetSatker: SatkerIKPA | null = null;
    if (selectedSatkerFilter) {
      targetSatker = satkers.find(s => s.kodeSatker === selectedSatkerFilter) || null;
    }

    setInputQuery('');
    executeGeminiRequest(query, targetSatker);
  };

  const handleDirectSatkerAnalysis = (satker: SatkerIKPA) => {
    const prompt = `Lakukan diagnosis mendalam dan rancang strategi pemulihan kinerja anggaran untuk Satker ${satker.namaSatker} (${satker.kodeSatker}).\n` +
      `Sajikan:\n` +
      `1. Matriks Analisis Kelemahan dari 8 Indikator IKPA yang rendah.\n` +
      `2. Identifikasi potensi resiko fiskal dan kerugian penilaian KPPN.\n` +
      `3. Langkah kerja konkret mingguan untuk KPA, PPK, PPSPM, dan Operator SAKTI.\n` +
      `4. Konsep teks pengingat WhatsApp resmi yang sopan dan tegas untuk dikirimkan ke PIC/KPA Satker.`;
    executeGeminiRequest(prompt, satker);
  };

  const handleRunPreset = (presetType: string) => {
    let targetSatker: SatkerIKPA | null = null;
    if (selectedSatkerFilter) {
      targetSatker = satkers.find(s => s.kodeSatker === selectedSatkerFilter) || null;
    }

    let prompt = '';
    switch (presetType) {
      case 'perhatian':
        prompt = `Bedah seluruh ${stats.satkerDalamPerhatian.length} Satker Dalam Perhatian di KPPN Semarang I. Kelompokkan berdasarkan klaster masalah (Deviasi Hal III, Belum Lapor Capaian Output, Rendah Penyerapan, dan Nilai IKPA < 87.50). Berikan urutan prioritas pendampingan klinis anggaran (Supervision & Clinical Assistance).`;
        break;
      case 'deviasi':
        prompt = `Analisis penyebab rendahnya nilai Deviasi Halaman III DIPA pada satker-satker KPPN Semarang I. Berikan panduan teknis strategi pemutakhiran RPD (Rencana Penarikan Dana) Triwulanan pada aplikasi SAKTI dan jadwal kritis batas akhir pengajuan revisi Hal III DIPA ke Kanwil DJPb.`;
        break;
      case 'output':
        prompt = `Analisis satker yang berstatus 'Belum Terlaporkan' atau 'Terlambat' pada Capaian Output SAKTI. Buatkan draf konsep Surat Teguran / Pemberitahuan Resmi dari Kepala KPPN Semarang I kepada KPA Satker terkait batas akhir konfirmasi data Capaian Output.`;
        break;
      case 'kkp_digipay':
        prompt = `Evaluasi pemanfaatan Kartu Kredit Pemerintah (KKP) dan transaksi Digipay Marketplace pada lingkup satker KPPN Semarang I. Berikan strategi akselerasi belanja non-tunai dan digitalisasi pembayaran APBN untuk mendongkrak skor indikator Pengelolaan UP/TUP dan Modernisasi Pembayaran.`;
        break;
      case 'draft_notadinas':
        prompt = `Buatkan Draf Naskah Laporan Evaluasi Pelaksanaan Anggaran (EPA) dan Analisis Capaian IKPA KPPN Semarang I untuk dilaporkan kepada Kepala Kanwil DJPb Provinsi Jawa Tengah. Sertakan ringkasan eksekutif, capaian nilai rata-rata, hambatan utama, dan rencana aksi perbaikan triwulan berikutnya.`;
        break;
      case 'financial_efficiency':
        prompt = `Sebagai Pakar Analis Keuangan Senior (CFA), lakukan Analisis Efisiensi Belanja dan Value for Money (VfM) terhadap seluruh Satker KPPN Semarang I. 
Bedah:
1. Rasio Realisasi Belanja terhadap Deviasi RPD Kas.
2. Identifikasi potensi inefisiensi alokatif dan pemborosan belanja di akhir periode.
3. Rekomendasi restrukturisasi pagu dan relokasi anggaran untuk satker yang mengalami perlambatan belanja.
4. Matriks cost-benefit dan KPI finansial triwulan berikutnya.`;
        break;
      case 'cashflow_forecast':
        prompt = `Sebagai Spesialis Forecasting Likuiditas Kas Negara, buatkan Model Proyeksi Arus Kas & Tren Penyerapan Kas Negara (Cash Flow Simulation) untuk KPPN Semarang I hingga tutup tahun anggaran.
Sajikan:
1. Estimasi kebutuhan kas bulanan berdasarkan tren musiman penyerapan belanja pegawai, barang, dan modal.
2. Analisis risiko likuiditas dan potensi kas mengendap (idle cash) pada rekening bendahara pengeluaran.
3. Jadwal peringatan dini (early warning schedule) batas pengajuan SPM-LS Kontraktual dan SPM-GUP Nihil.`;
        break;
      case 'risk_matrix':
        prompt = `Buatkan Matriks Peta Risiko Fiskal & Kepatuhan Satker (Fiscal Risk Matrix 4x4) untuk KPPN Semarang I.
Kelompokkan satker ke dalam 4 Kuadran Risiko:
- Kuadran I: Risiko Tinggi / IKPA Rendah (Prioritas Intervensi Klinis Khusus)
- Kuadran II: Pagu Raksasa / Penyerapan Lambat (Risiko Fiskal Regional)
- Kuadran III: Masalah Teknis Administrasi / Output Tertunda
- Kuadran IV: Satker Unggulan (Benchmark & Role Model)
Sertakan mitigasi operasional dan treatment pembinaan untuk masing-masing kuadran.`;
        break;
      case 'mitigasi_akhir_tahun':
        prompt = `Rancang Pedoman Mitigasi Risiko Anggaran Menghadapi Akhir Tahun Anggaran (Langkah-Langkah Akhir Tahun / LLAT) untuk satker KPPN Semarang I. Fokus pada pencegahan penumpukan SPM di bulan Desember, dispensasi SPM, dan penyelesaian sisa TUP agar nihil.`;
        break;
      default:
        prompt = presetType;
    }

    executeGeminiRequest(prompt, targetSatker);
  };

  const handleCopyMessage = (id: string, text: string, type: 'raw' | 'whatsapp' = 'raw') => {
    let textToCopy = text;
    if (type === 'whatsapp') {
      // Ensure bold and bullet points are WhatsApp compliant (*bold*, _italic_)
      textToCopy = text
        .replace(/\*\*(.*?)\*\*/g, '*$1*') // Convert markdown bold **text** to WA bold *text*
        .replace(/^#+\s*(.*?)$/gm, '📌 *$1*'); // Convert headers to WhatsApp emoji headers
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedMessageId(id);
    setCopyFeedbackType(type);
    setTimeout(() => {
      setCopiedMessageId(null);
      setCopyFeedbackType(null);
    }, 2000);
  };

  const handleDeleteSingleMessage = (id: string) => {
    setChatMessages(prev => {
      const next = prev.filter(m => m.id !== id);
      saveCloudChatHistory(next);
      return next;
    });
  };

  const handleDownloadChat = () => {
    const chatText = chatMessages.map(m => `[${m.timestamp}] ${m.sender.toUpperCase()}:\n${m.text}\n\n-----------------------------------\n`).join('\n');
    const blob = new Blob([chatText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Analisis_Gemini_AI_IKPA_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Archive Current Session
  const handleArchiveCurrentSession = () => {
    const nonSystemMessages = chatMessages.filter(m => m.sender !== 'system');
    if (nonSystemMessages.length === 0) {
      alert('Tidak ada percakapan untuk diarsipkan.');
      return;
    }

    const firstUserMsg = nonSystemMessages.find(m => m.sender === 'user');
    const defaultTitle = firstUserMsg 
      ? firstUserMsg.text.slice(0, 45) + (firstUserMsg.text.length > 45 ? '...' : '')
      : `Sesi Analisis ${new Date().toLocaleDateString('id-ID')}`;

    const titleInput = prompt('Masukkan judul/catatan untuk arsip sesi ini:', defaultTitle);
    if (titleInput === null) return; // User cancelled

    const newArchive: ArchivedChatSession = {
      id: `archive-${Date.now()}`,
      title: titleInput.trim() || defaultTitle,
      archivedAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      targetSatkerKode: selectedSatkerFilter || undefined,
      messageCount: chatMessages.length,
      persona: selectedPersona,
      messages: [...chatMessages]
    };

    const updatedArchives = [newArchive, ...archivedSessions];
    setArchivedSessions(updatedArchives);
    saveCloudArchivedSessions(updatedArchives);

    // Reset active chat to initial welcome
    const initialWelcome: ChatMessage = {
      id: 'msg-welcome',
      sender: 'system',
      text: `Sesi percakapan sebelumnya telah berhasil diarsipkan sebagai: **"${newArchive.title}"**.\n\nSesi obrolan baru siap digunakan. Silakan ajukan pertanyaan atau pilih analisis cepat di bawah.`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages([initialWelcome]);
    saveCloudChatHistory([initialWelcome]);
    alert(`Sesi percakapan berhasil diarsipkan! Anda dapat membukanya kembali dari menu "Arsip Percakapan".`);
  };

  const handleRestoreArchivedSession = (session: ArchivedChatSession) => {
    if (confirm(`Buka dan pulihkan arsip percakapan "${session.title}" ke konsol aktif?`)) {
      setChatMessages(session.messages);
      saveCloudChatHistory(session.messages);
      if (session.targetSatkerKode) {
        setSelectedSatkerFilter(session.targetSatkerKode);
      }
      setShowArchiveModal(false);
      setViewingArchivedSession(null);
    }
  };

  const handleDeleteArchivedSession = (id: string) => {
    if (confirm('Hapus arsip percakapan ini secara permanen?')) {
      setArchivedSessions(prev => {
        const next = prev.filter(a => a.id !== id);
        saveCloudArchivedSessions(next);
        return next;
      });
      if (viewingArchivedSession?.id === id) {
        setViewingArchivedSession(null);
      }
    }
  };

  const handleClearHistory = () => {
    if (confirm('Bersihkan seluruh riwayat percakapan analisis AI aktif saat ini? (Anda disarankan mengarsipkan terlebih dahulu jika ada catatan penting)')) {
      const initialWelcome: ChatMessage = {
        id: 'msg-welcome',
        sender: 'system',
        text: 'Riwayat obrolan telah dibersihkan. Silakan ajukan pertanyaan atau pilih analisis cepat terkait anggaran dan satker.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages([initialWelcome]);
      saveCloudChatHistory([initialWelcome]);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Header */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border-indigo-500/30' 
          : 'bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border-indigo-800'
      }`}>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md">
                <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                INTELLIGENT FISCAL ASSISTANT • POWERED BY GOOGLE GEMINI
              </div>

              {/* Database Storage Location Badge */}
              <button
                type="button"
                onClick={() => setShowStorageInfoModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-white/10 hover:bg-white/20 text-indigo-200 border border-white/20 transition-all cursor-pointer"
                title="Klik untuk informasi detail database & lokasi penyimpanan percakapan"
              >
                <Info className="w-3 h-3 text-cyan-300" />
                <span>Penyimpanan: Cloud Firestore &amp; LocalStorage (Realtime Sync)</span>
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Asisten Analis Cerdas Anggaran &amp; IKPA SAKTI</span>
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
              Konsultasi interaktif tanya jawab berbasis AI terhadap data riil {stats.total} Satuan Kerja KPPN Semarang I. Menganalisis akar penyebab anjloknya skor IKPA, merumuskan strategi revisi Hal III DIPA, membedah keterlambatan capaian output, hingga menyusun draf teguran resmi.
            </p>
          </div>

          {/* Right Status Pill & Setup Trigger */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className={`w-2.5 h-2.5 rounded-full ${apiKey || serverStatus?.hasServerKey ? 'bg-emerald-400 animate-pulse' : 'bg-teal-400'}`} />
              <span className="text-xs font-bold text-white">
                {apiKey
                  ? `Gemini Kustom (${selectedModel})`
                  : serverStatus?.hasServerKey
                  ? `Gemini Server Terhubung (${selectedModel})`
                  : 'AI Analis Finansial Aktif'}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsPresentationDeckOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 border border-amber-300/50"
                title="Buka Bank Paparan Presentasi 50 Slide PowerPoint Baku Berdasarkan Data IKPA"
              >
                <Presentation className="w-4 h-4 text-slate-950" />
                <span>📊 Format Paparan PPT (50 Slide)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowArchiveModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer border border-indigo-400/30"
                title="Buka daftar percakapan yang telah diarsipkan"
              >
                <FolderArchive className="w-3.5 h-3.5 text-amber-300" />
                <span>Arsip Percakapan ({archivedSessions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{apiKey ? 'Kelola API Key' : 'Atur API Key'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowKeyGuide(!showKeyGuide)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/15 cursor-pointer"
                title="Panduan Dapatkan API Key Gratis"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Context Quick Stat Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
          <div className="bg-slate-950/40 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Satker Aktif</span>
            <span className="text-lg font-black text-white">{stats.total} Satker</span>
          </div>
          <div className="bg-slate-950/40 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Rata-Rata IKPA KPPN</span>
            <span className="text-lg font-black text-amber-300">{stats.avgIKPA} Poin</span>
          </div>
          <div className="bg-slate-950/40 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Satker Dalam Perhatian</span>
            <span className="text-lg font-black text-rose-400">{stats.satkerDalamPerhatian.length} Satker</span>
          </div>
          <div className="bg-slate-950/40 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Belum Capaian Output</span>
            <span className="text-lg font-black text-sky-300">{stats.belowOutput.length} Satker</span>
          </div>
        </div>
      </div>

      {/* Collapsible API Key Management Drawer */}
      {showApiKeyInput && (
        <div className={`p-6 rounded-3xl border shadow-lg transition-all animate-fadeIn ${
          isDark ? 'bg-slate-900 border-indigo-500/40 text-white' : 'bg-white border-indigo-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black">Konfigurasi Google Gemini AI</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tersinkronisasi otomatis via Cloud Firestore: API Key dan percakapan AI terhubung secara real-time antar sesi, baik di Google AI Studio maupun Web Deployment.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowApiKeyInput(false)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            >
              Tutup
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="md:col-span-2 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Gemini API Key (Google AI Studio)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={tempApiKeyInput || apiKey}
                  onChange={(e) => setTempApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleTestApiKey}
                  disabled={isTestingKey}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTestingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>Tes Koneksi</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-sm"
                >
                  Simpan
                </button>
              </div>
              {isApiKeyValid === true && (
                <p className="text-xs text-emerald-500 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Koneksi Gemini API Berhasil &amp; Valid (Tersinkron Cloud)!
                </p>
              )}
              {isApiKeyValid === false && (
                <p className="text-xs text-rose-500 flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> API Key tidak valid atau permintaan gagal. Periksa kembali key Anda.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilih Model Gemini
              </label>
              <select
                value={selectedModel}
                onChange={(e) => {
                  const newModel = e.target.value;
                  setSelectedModel(newModel);
                  saveCloudGeminiConfig({ apiKey, selectedModel: newModel });
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (Paling Stabil, Cepat &amp; Direkomendasikan)</option>
                <option value="gemini-3.7-flash">Gemini 3.7 Flash (Terkini &amp; High Reasoning)</option>
                <option value="gemini-flash-latest">Gemini Flash Auto-Latest (Model Terbaru Otomatis)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Penalaran Kompleks &amp; Mendalam)</option>
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Dilengkapi <strong>Smart Auto-Fallback</strong>: Jika salah satu model mengalami lonjakan antrean (503), sistem otomatis mengalihkan ke model stabil lainnya tanpa error.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal / Card on Getting Free Key */}
      {showKeyGuide && (
        <div className={`p-5 rounded-3xl border shadow-md ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-indigo-50 border-indigo-200 text-slate-800'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" /> Cara Mendapatkan Google Gemini API Key Gratis:
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <li>Buka portal resmi <strong>Google AI Studio</strong> di: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-amber-300 font-bold underline inline-flex items-center gap-1">aistudio.google.com/app/apikey <ExternalLink className="w-3 h-3" /></a></li>
                <li>Masuk menggunakan akun Google Anda.</li>
                <li>Klik tombol <strong>&quot;Create API Key&quot;</strong> (Pilih project default atau buat project baru).</li>
                <li>Salin kode API Key yang muncul (dimulai dengan teks <code>AIzaSy...</code>).</li>
                <li>Tempelkan kode tersebut pada kolom <strong>Gemini API Key</strong> di atas, lalu klik <strong>Simpan</strong>.</li>
              </ol>
            </div>
            <button
              onClick={() => setShowKeyGuide(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Role Persona & Mode Selector Bar (Executive Experience) */}
      <div className={`p-4 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-500 shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <span>Persona &amp; Sudut Pandang Analis AI</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                Multi-Role
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Sesuaikan karakter analisis AI sesuai kebutuhan laporan atau audiensi Anda.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedPersona('pakar_keuangan_negara')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPersona === 'pakar_keuangan_negara'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50 scale-105'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <BadgeDollarSign className="w-3.5 h-3.5 text-amber-300" />
            <span>Pakar Analis Keuangan (Chief CFA)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPersona('mski_analyst')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPersona === 'mski_analyst'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kasi MSKI (Pembina IKPA)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPersona('kepala_kppn')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPersona === 'kepala_kppn'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Kepala KPPN (Eksekutif)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPersona('forecaster_likuiditas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPersona === 'forecaster_likuiditas'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Forecaster Likuiditas &amp; Kas</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPersona('it_sakti_expert')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPersona === 'it_sakti_expert'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Pakar Teknis SAKTI</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPersona('auditor_ppk')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPersona === 'auditor_ppk'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Pendamping PPK/PPSPM</span>
          </button>
        </div>
      </div>

      {/* Quick Action Presets (1-Click AI Diagnosis) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-indigo-500" /> Analisis Cepat 1-Klik (Preset Rekomendasi):
          </span>
          <span className="text-[11px] text-slate-400">Pilih salah satu untuk diagnosis instan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => handleRunPreset('financial_efficiency')}
            disabled={isLoading}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 cursor-pointer group ${
              isDark 
                ? 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-emerald-500/50' 
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-emerald-400 shadow-xs'
            }`}
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <BadgeDollarSign className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h5 className="text-xs font-black text-slate-900 dark:text-white">Efisiensi Belanja &amp; VfM</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                Analisis Value for Money, efisiensi alokatif, dan restrukturisasi DIPA.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRunPreset('cashflow_forecast')}
            disabled={isLoading}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 cursor-pointer group ${
              isDark 
                ? 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-cyan-500/50' 
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-cyan-400 shadow-xs'
            }`}
          >
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 group-hover:scale-110 transition-transform">
              <LineChart className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h5 className="text-xs font-black text-slate-900 dark:text-white">Forecast Likuiditas &amp; Arus Kas</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                Simulasi kebutuhan kas bulanan &amp; deteksi idle cash rekening satker.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRunPreset('risk_matrix')}
            disabled={isLoading}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 cursor-pointer group ${
              isDark 
                ? 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-purple-500/50' 
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-purple-400 shadow-xs'
            }`}
          >
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
              <PieChart className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h5 className="text-xs font-black text-slate-900 dark:text-white">Peta Matriks Risiko Fiskal 4x4</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                Pemetaan kuadran risiko mitigasi fiskal dan satker berpagu besar.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRunPreset('perhatian')}
            disabled={isLoading}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 cursor-pointer group ${
              isDark 
                ? 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-rose-500/50' 
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-rose-400 shadow-xs'
            }`}
          >
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h5 className="text-xs font-black text-slate-900 dark:text-white">Bedah Satker Dalam Perhatian</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                Analisis klaster masalah &amp; urutan prioritas intervensi klinis bagi {stats.satkerDalamPerhatian.length} satker kritis.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRunPreset('deviasi')}
            disabled={isLoading}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 cursor-pointer group ${
              isDark 
                ? 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-amber-500/50' 
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-amber-400 shadow-xs'
            }`}
          >
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
              <Target className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h5 className="text-xs font-black text-slate-900 dark:text-white">Strategi Pemulihan Deviasi Hal III</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                Panduan teknis pemutakhiran RPD Triwulanan SAKTI &amp; jadwal batas revisi DIPA.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRunPreset('output')}
            disabled={isLoading}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 cursor-pointer group ${
              isDark 
                ? 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-sky-500/50' 
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-sky-400 shadow-xs'
            }`}
          >
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h5 className="text-xs font-black text-slate-900 dark:text-white">Teguran Belum Capaian Output</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                Format surat resmi &amp; pesan WhatsApp tagihan pelaporan konfirmasi Rincian Output.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRunPreset('kkp_digipay')}
            disabled={isLoading}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 cursor-pointer group ${
              isDark 
                ? 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-emerald-500/50' 
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-emerald-400 shadow-xs'
            }`}
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h5 className="text-xs font-black text-slate-900 dark:text-white">Akselerasi KKP &amp; Digipay</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                Evaluasi transaksi nontunai dan belanja marketplace Kemenkeu untuk skor UP/TUP.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRunPreset('draft_notadinas')}
            disabled={isLoading}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 cursor-pointer group ${
              isDark 
                ? 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-indigo-500/50' 
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-400 shadow-xs'
            }`}
          >
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h5 className="text-xs font-black text-slate-900 dark:text-white">Draf Nota Dinas Laporan EPA</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                Konsep laporan evaluasi pelaksanaan anggaran triwulanan kepada Kepala Kanwil DJPb.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Interactive Chat Console */}
      <div className={`rounded-3xl border shadow-xl flex flex-col overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Chat Console Top Bar */}
        <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Konsol Dialog Analisis AI SAKTI</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {selectedModel}
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Grounding kontekstual aktif terhadap {stats.total} Satker &amp; riwayat indikator KPPN 026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Satker Quick Focus Dropdown */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSatkerFilter}
                onChange={(e) => setSelectedSatkerFilter(e.target.value)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[180px] sm:max-w-xs truncate ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="">-- Fokus Semua Satker --</option>
                {satkers.map(s => (
                  <option key={s.id || s.kodeSatker} value={s.kodeSatker}>
                    [{s.kodeSatker}] {s.namaSatker} (IKPA: {s.nilaiTotalIKPA})
                  </option>
                ))}
              </select>
            </div>

            {/* Archive Current Session Button */}
            <button
              type="button"
              onClick={handleArchiveCurrentSession}
              className="px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              title="Simpan dan arsipkan riwayat percakapan sesi ini"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Arsipkan Sesi</span>
            </button>

            {/* Export Markdown */}
            <button
              type="button"
              onClick={handleDownloadChat}
              className="p-2 rounded-xl border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Unduh Hasil Analisis (.md)"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Clear History */}
            <button
              type="button"
              onClick={handleClearHistory}
              className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
              title="Bersihkan / Hapus Riwayat Chat Aktif"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread Area */}
        <div 
          ref={messagesContainerRef}
          className="p-6 space-y-4 max-h-[560px] overflow-y-auto min-h-[360px] overscroll-contain"
        >
          {chatMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSystem = msg.sender === 'system';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`relative max-w-3xl rounded-2xl p-4 sm:p-5 shadow-sm text-xs sm:text-sm leading-relaxed space-y-2 ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-tr-none'
                    : isSystem
                    ? isDark ? 'bg-indigo-950/40 border border-indigo-800/40 text-indigo-200' : 'bg-indigo-50/80 border border-indigo-200 text-indigo-900'
                    : isDark ? 'bg-slate-800/90 border border-slate-700 text-slate-100 rounded-tl-none' : 'bg-slate-50 border border-slate-200/80 text-slate-900 rounded-tl-none'
                }`}>
                  {/* Sender Header & Meta */}
                  <div className="flex items-center justify-between gap-4 pb-1 border-b border-white/10 dark:border-slate-700/50">
                    <span className="font-bold text-[11px] opacity-80 flex items-center gap-1.5">
                      {isUser ? 'Administrator KPPN' : isSystem ? 'Panduan Sistem' : 'Google Gemini AI Analyst'}
                      {msg.targetSatkerKode && (
                        <span className="bg-amber-400 text-slate-950 px-2 py-0.2 rounded font-black text-[10px]">
                          Fokus Satker: {msg.targetSatkerKode}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] opacity-60 font-mono">{msg.timestamp}</span>
                      {/* Delete single message button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSingleMessage(msg.id)}
                        className="opacity-40 hover:opacity-100 text-slate-400 hover:text-rose-500 cursor-pointer transition-all"
                        title="Hapus pesan ini dari riwayat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Message Body with Markdown formatting */}
                  <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm space-y-2">
                    {msg.text}
                  </div>

                  {/* Action Bar for Bot Messages (WhatsApp, Copy, Send to Broadcast) */}
                  {!isUser && !isSystem && (
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                      {/* Send directly to broadcast template */}
                      {onSendToBroadcast && (
                        <button
                          type="button"
                          onClick={() => onSendToBroadcast(msg.text)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-all cursor-pointer"
                          title="Gunakan teks analisis ini sebagai template pesan di menu Broadcast Masif WA"
                        >
                          <Send className="w-3 h-3" />
                          <span>Kirim ke Broadcast WA</span>
                        </button>
                      )}

                      {/* Copy WhatsApp Style */}
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.text, 'whatsapp')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer"
                        title="Salin dengan format cetak tebal & rapi khusus WhatsApp"
                      >
                        {copiedMessageId === msg.id && copyFeedbackType === 'whatsapp' ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Format WA Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-3 h-3" />
                            <span>Salin Format WA</span>
                          </>
                        )}
                      </button>

                      {/* Standard Copy */}
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.text, 'raw')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900/10 dark:bg-slate-700/50 hover:bg-slate-900/20 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                      >
                        {copiedMessageId === msg.id && copyFeedbackType === 'raw' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin Teks</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-md">
                    <span className="text-xs font-black">AD</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 sm:gap-4 justify-start animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className={`p-4 rounded-2xl rounded-tl-none border text-xs sm:text-sm flex items-center gap-3 ${
                isDark ? 'bg-slate-800/90 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                <span>Google Gemini sedang membedah data dan merumuskan analisis strategis...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Bar */}
        <form onSubmit={handleSendMessage} className={`p-4 border-t ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                selectedSatkerFilter 
                  ? `Ketik pertanyaan analisis khusus untuk Satker [${selectedSatkerFilter}]...`
                  : "Tanyakan apapun tentang IKPA, deviasi anggaran, satker bermasalah, atau draf teguran..."
              }
              disabled={isLoading}
              className={`flex-1 px-4 py-3 rounded-2xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />

            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              <span>Kirim</span>
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 px-1">
            <span>
              💡 <em>Tips: Gunakan Persona Analis &amp; pilihan Satker di kanan atas untuk hasil presisi tinggi.</em>
            </span>
            <span className="font-mono">
              Model: <strong>{selectedModel}</strong> | Riwayat Tersimpan: <strong>{chatMessages.length} Pesan</strong>
            </span>
          </div>
        </form>
      </div>

      {/* Modal Informasi Lokasi Penyimpanan Database Chat */}
      {showStorageInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 rounded-2xl">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Lokasi &amp; Keamanan Database Chat AI
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Transparansi Penyimpanan Riwayat Analisis Perbendaharaan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStorageInfoModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Di Mana Data Percakapan AI Disimpan &amp; Disinkronkan?</span>
                </div>
                <p>
                  Percakapan dan sesi konsultasi AI disinkronkan secara aman ke <strong>Cloud Firestore Database</strong> (sehingga riwayat percakapan tetap tersambung saat Anda membuka versi deployment maupun perangkat lain) dan di-cache secara instan di peramban (LocalStorage):
                </p>
                <ul className="list-disc list-inside font-mono text-[11px] text-indigo-600 dark:text-indigo-400 space-y-0.5 pl-2">
                  <li><code>Firestore: gemini_chats/global_session</code> (Sinkronisasi cloud lintas perangkat &amp; deployment)</li>
                  <li><code>Firestore: gemini_chats/archives</code> (Arsip sesi konsultasi cloud)</li>
                  <li><code>LocalStorage: kppn_gemini_api_key</code> (Kunci API Google Gemini privat Anda)</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <h5 className="font-black text-slate-800 dark:text-slate-200">🔒 Privasi &amp; Kendali Penuh Admin:</h5>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Sesi percakapan tersinkronisasi otomatis sehingga Anda dapat melanjutkan analisis di mana saja.</li>
                  <li>Anda dapat <strong>Mengarsipkan Sesi</strong> untuk disimpan sebagai referensi laporan bulanan.</li>
                  <li>Anda dapat <strong>Menghapus Pesan Satuan</strong> atau <strong>Menghapus Seluruh Riwayat</strong> kapan saja dengan aman.</li>
                  <li>Anda dapat mengunduh seluruh sesi ke format <strong>Markdown (.md)</strong> untuk dokumentasi.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowStorageInfoModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kelola Arsip Percakapan Analisis */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-fadeIn my-8">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md">
                  <FolderArchive className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Daftar Arsip Percakapan Analisis AI
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Koleksi sesi konsultasi, diagnosis satker, dan perumusan rekomendasi yang pernah Anda simpan.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowArchiveModal(false);
                  setViewingArchivedSession(null);
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            {viewingArchivedSession ? (
              /* Preview Specific Archived Session */
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {viewingArchivedSession.title}
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      Diarsipkan: {viewingArchivedSession.archivedAt} | {viewingArchivedSession.messageCount} Pesan
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewingArchivedSession(null)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                  >
                    ← Kembali ke Daftar
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 max-h-72 overflow-y-auto space-y-3">
                  {viewingArchivedSession.messages.map((m) => (
                    <div key={m.id} className="text-xs space-y-1">
                      <div className="font-bold text-[10px] text-slate-500 flex items-center justify-between">
                        <span>{m.sender.toUpperCase()}</span>
                        <span className="font-mono">{m.timestamp}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteArchivedSession(viewingArchivedSession.id)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                  >
                    Hapus Arsip Ini
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRestoreArchivedSession(viewingArchivedSession)}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Pulihkan ke Konsol Chat</span>
                  </button>
                </div>
              </div>
            ) : (
              /* List of All Archives */
              <div className="space-y-3">
                {archivedSessions.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <Archive className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      Belum ada sesi percakapan yang diarsipkan.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Klik tombol <strong>&quot;Arsipkan Sesi&quot;</strong> di konsol chat untuk menyimpan obrolan penting.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {archivedSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {session.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span>📅 {session.archivedAt}</span>
                            <span>•</span>
                            <span>💬 {session.messageCount} Pesan</span>
                            {session.targetSatkerKode && (
                              <>
                                <span>•</span>
                                <span className="bg-amber-400/20 text-amber-700 dark:text-amber-300 px-1.5 rounded font-bold">
                                  Satker: {session.targetSatkerKode}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setViewingArchivedSession(session)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                          >
                            Lihat
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRestoreArchivedSession(session)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-xs cursor-pointer"
                            title="Pulihkan obrolan ini ke konsol aktif"
                          >
                            Buka
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteArchivedSession(session.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Hapus arsip ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[11px] text-slate-400">
                Total Arsip: <strong className="text-indigo-600 dark:text-indigo-400">{archivedSessions.length} Sesi</strong>
              </span>

              <button
                type="button"
                onClick={() => {
                  setShowArchiveModal(false);
                  setViewingArchivedSession(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 50-Slide Executive Presentation Deck Studio Modal */}
      {isPresentationDeckOpen && (
        <IKPAPresentationDeckModal
          isOpen={isPresentationDeckOpen}
          onClose={() => setIsPresentationDeckOpen(false)}
          satkers={satkers}
          dashboardConfig={dashboardConfig || ({} as any)}
          isDark={isDark}
          onAskGeminiForTopic={(topicPrompt) => {
            setIsPresentationDeckOpen(false);
            // Put prompt into console
            const promptInput = document.querySelector('textarea[placeholder*="Ketik pertanyaan"]') as HTMLTextAreaElement | null;
            if (promptInput) {
              promptInput.value = topicPrompt;
              promptInput.focus();
            }
          }}
        />
      )}

    </div>
  );
};
