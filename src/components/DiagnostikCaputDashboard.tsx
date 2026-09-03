import React, { useState, useRef, useMemo } from 'react';
import { 
  DiagnostikCaputResult, 
  DiagnostikCaputROItem, 
  AppTheme,
  SaktiReferensiItem
} from '../types';
import { 
  parseMyIntressCaputExcel, 
  getDemoDiagnostikCaputData,
  exportDiagnostikCaputToExcel,
  formatRupiahCaput,
  SAKTI_REFERENSI_LIST,
  SAKTI_VALIDASI_RULES,
  generateSaktiTemplateByRef
} from '../utils/diagnostikCaputProcessor';
import { SaktiSimulatorModal } from './SaktiSimulatorModal';
import { SuratKlarifikasiKppnView } from './SuratKlarifikasiKppnView';
import { SmartNarrativeBuilderModal } from './SmartNarrativeBuilderModal';
import { SaktiPreFlightAuditCard } from './SaktiPreFlightAuditCard';
import { SaktiPlaybookAnomaliView } from './SaktiPlaybookAnomaliView';
import { KroDistributionAnalyticsView } from './KroDistributionAnalyticsView';
import { SaktiBatchPayloadExportModal } from './SaktiBatchPayloadExportModal';
import { SaktiTrajectoryForecastView } from './SaktiTrajectoryForecastView';
import { SaktiReverseCalculatorView } from './SaktiReverseCalculatorView';
import { SaktiActionPlanGanttView } from './SaktiActionPlanGanttView';
import { SaktiSptjmGeneratorModal } from './SaktiSptjmGeneratorModal';
import { 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  RefreshCw, 
  Info, 
  Search, 
  CheckSquare, 
  Activity, 
  Target,
  ShieldAlert,
  Cpu,
  HelpCircle,
  Clock,
  Building,
  Trash2,
  ArrowRight,
  FileText,
  BookOpen,
  Bell,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sliders,
  Send,
  UserCheck,
  Printer,
  TrendingUp,
  ArrowDownToLine,
  Calculator,
  CalendarDays,
  Wand2,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { PaginationControl } from './PaginationControl';

interface DiagnostikCaputDashboardProps {
  theme?: AppTheme;
  isDark?: boolean;
  kppnName?: string;
  masterSatkers?: any[];
  onGoToUpload?: () => void;
  onSelectSatker?: (code: string) => void;
  onGoToCapaianOutputTab?: () => void;
}

export const DiagnostikCaputDashboard: React.FC<DiagnostikCaputDashboardProps> = ({
  theme = 'light',
  isDark: isDarkProp,
  kppnName = 'KPPN',
  onGoToCapaianOutputTab
}) => {
  const isDark = isDarkProp !== undefined ? isDarkProp : theme === 'dark';

  // Analysis State - Kosong secara default sesuai kebutuhan satker
  const [data, setData] = useState<DiagnostikCaputResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Sub-tab Navigation: 'DIAGNOSTIK' | 'SIMULASI_SAKTI' | 'REVERSE_CALC' | 'TRAJEKTORI' | 'ACTION_PLAN' | 'SURAT_KPPN' | 'ANALISIS_KRO' | 'PLAYBOOK_ANOMALI' | 'ATURAN_JUKNIS' | 'PANDUAN'
  const [activeSubTab, setActiveSubTab] = useState<'DIAGNOSTIK' | 'SIMULASI_SAKTI' | 'REVERSE_CALC' | 'TRAJEKTORI' | 'ACTION_PLAN' | 'SURAT_KPPN' | 'ANALISIS_KRO' | 'PLAYBOOK_ANOMALI' | 'ATURAN_JUKNIS' | 'PANDUAN'>('DIAGNOSTIK');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'KRITIS' | 'PERINGATAN' | 'OPTIMAL'>('ALL');
  const [filterValidation, setFilterValidation] = useState<'ALL' | 'DITOLAK' | 'EARLY_WARNING' | 'GAP_TINGGI' | 'BELUM_100' | 'UNCONFIRMED_KPPN'>('ALL');
  const [selectedSatkerFilter, setSelectedSatkerFilter] = useState<string>('ALL');

  // Interactive Reference Mapping per RO (roId -> selectedRefCode)
  const [customRefMap, setCustomRefMap] = useState<Record<string, string>>({});
  const [customNarrativeMap, setCustomNarrativeMap] = useState<Record<string, string>>({});

  // Modals state
  const [simulatingRO, setSimulatingRO] = useState<DiagnostikCaputROItem | null>(null);
  const [customizingRO, setCustomizingRO] = useState<DiagnostikCaputROItem | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSptjmModalOpen, setIsSptjmModalOpen] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Copy Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bulkCopied, setBulkCopied] = useState<boolean>(false);

  // Juknis Tab Filter
  const [refSearch, setRefSearch] = useState<string>('');
  const [selectedRefCategory, setSelectedRefCategory] = useState<string>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Upload
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await parseMyIntressCaputExcel(file);
      setData(result);
      setCurrentPage(1);
      setActiveSubTab('DIAGNOSTIK');
    } catch (err: any) {
      console.error('Error parsing Caput Excel:', err);
      setErrorMsg(err.message || 'Gagal memproses file Excel. Pastikan format file sesuai dengan laporan MyIntress/SAKTI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const handleLoadDemo = () => {
    setIsLoading(true);
    setErrorMsg(null);
    setTimeout(() => {
      const demoData = getDemoDiagnostikCaputData();
      setData(demoData);
      setCurrentPage(1);
      setActiveSubTab('DIAGNOSTIK');
      setIsLoading(false);
    }, 400);
  };

  const handleResetData = () => {
    setData(null);
    setErrorMsg(null);
    setSearchQuery('');
    setFilterSeverity('ALL');
    setSelectedSatkerFilter('ALL');
    setCustomRefMap({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Switch Reference Code for a specific RO
  const handleRefChange = (roId: string, newRefCode: string) => {
    setCustomRefMap(prev => ({
      ...prev,
      [roId]: newRefCode
    }));
  };

  // Get current effective narrative for an RO
  const getEffectiveNarrative = (ro: DiagnostikCaputROItem): { text: string; refCode: string; refTitle: string } => {
    const activeRefCode = customRefMap[ro.id] || ro.selectedReferensiSakti || '07';
    const refObj = SAKTI_REFERENSI_LIST.find(r => r.kode === activeRefCode) || SAKTI_REFERENSI_LIST[6];
    
    // Check if user crafted a custom narrative
    if (customNarrativeMap[ro.id]) {
      return {
        text: customNarrativeMap[ro.id],
        refCode: activeRefCode,
        refTitle: `${refObj.kode}) ${refObj.judul} (Kustom)`
      };
    }

    const text = generateSaktiTemplateByRef(activeRefCode, {
      kodeRo: ro.kodeRo,
      namaRo: ro.namaRo,
      pcro: ro.realisasiProgres,
      tpcro: ro.targetProgres,
      ppa: ro.persenPenyerapan || 0,
      rvro: ro.volumeRealisasi,
      tvro: ro.volumeTarget,
      nilaiZ: ro.nilaiKomponenRo
    });
    return {
      text,
      refCode: activeRefCode,
      refTitle: `${refObj.kode}) ${refObj.judul}`
    };
  };

  // Handle Save Custom Narrative
  const handleSaveCustomNarrative = (roId: string, customNarrative: string, refCode: string) => {
    setCustomNarrativeMap(prev => ({
      ...prev,
      [roId]: customNarrative
    }));
    setCustomRefMap(prev => ({
      ...prev,
      [roId]: refCode
    }));
  };

  // Handle Apply Simulated Changes to an RO in dataset
  const handleApplySimulatedRO = (updatedRO: DiagnostikCaputROItem) => {
    if (!data) return;
    const newItems = data.items.map(it => it.id === updatedRO.id ? updatedRO : it);
    
    // Recalculate summary metrics
    const totalRo = newItems.length;
    const roKritisCount = newItems.filter(it => it.diagnosaSeverity === 'KRITIS').length;
    const roPeringatanCount = newItems.filter(it => it.diagnosaSeverity === 'PERINGATAN').length;
    const roOptimalCount = newItems.filter(it => it.diagnosaSeverity === 'OPTIMAL').length;
    const totalScore = newItems.reduce((acc, it) => acc + it.nilaiKomponenRo, 0);
    const avgScore = totalRo > 0 ? totalScore / totalRo : 0;
    const avgPcro = totalRo > 0 ? newItems.reduce((acc, it) => acc + it.realisasiProgres, 0) / totalRo : 0;
    const avgTpcro = totalRo > 0 ? newItems.reduce((acc, it) => acc + it.targetProgres, 0) / totalRo : 0;

    setData({
      ...data,
      summary: {
        ...data.summary,
        totalRo,
        roKritisCount,
        roPeringatanCount,
        roOptimalCount,
        currentScoreCaput: Number(avgScore.toFixed(2)),
        avgPCRO: Number(avgPcro.toFixed(2)),
        avgTPCRO: Number(avgTpcro.toFixed(2))
      },
      items: newItems
    });
  };

  // Handle Apply Bulk Optimized Values
  const handleApplyOptimizedList = (updatedList: DiagnostikCaputROItem[]) => {
    if (!data) return;
    const totalRo = updatedList.length;
    const roKritisCount = updatedList.filter(it => it.diagnosaSeverity === 'KRITIS').length;
    const roPeringatanCount = updatedList.filter(it => it.diagnosaSeverity === 'PERINGATAN').length;
    const roOptimalCount = updatedList.filter(it => it.diagnosaSeverity === 'OPTIMAL').length;
    const totalScore = updatedList.reduce((acc, it) => acc + it.nilaiKomponenRo, 0);
    const avgScore = totalRo > 0 ? totalScore / totalRo : 0;
    const avgPcro = totalRo > 0 ? updatedList.reduce((acc, it) => acc + it.realisasiProgres, 0) / totalRo : 0;
    const avgTpcro = totalRo > 0 ? updatedList.reduce((acc, it) => acc + it.targetProgres, 0) / totalRo : 0;

    setData({
      ...data,
      summary: {
        ...data.summary,
        totalRo,
        roKritisCount,
        roPeringatanCount,
        roOptimalCount,
        currentScoreCaput: Number(avgScore.toFixed(2)),
        avgPCRO: Number(avgPcro.toFixed(2)),
        avgTPCRO: Number(avgTpcro.toFixed(2))
      },
      items: updatedList
    });
  };

  // Handle Copy Single Template
  const handleCopyTemplate = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Handle Copy All Templates
  const handleBulkCopyTemplates = () => {
    if (!data) return;
    const problematicItems = data.items.filter(it => it.diagnosaSeverity !== 'OPTIMAL');
    const itemsToCopy = problematicItems.length > 0 ? problematicItems : data.items;

    const formattedText = itemsToCopy.map((it, idx) => {
      const nar = getEffectiveNarrative(it);
      return `[${idx + 1}] RO: ${it.kodeRo} - ${it.namaRo}\nKode Referensi: ${nar.refTitle}\nStatus Kolom Z: ${it.nilaiKomponenRo.toFixed(2)} (${it.diagnosaSeverity})\nKeterangan SAKTI:\n"${nar.text}"\n`;
    }).join('\n----------------------------------------\n\n');

    navigator.clipboard.writeText(formattedText);
    setBulkCopied(true);
    setTimeout(() => setBulkCopied(false), 3000);
  };

  // Export Cleaned Data
  const handleExportExcel = () => {
    if (!data) return;
    exportDiagnostikCaputToExcel(data, `Diagnostik_Caput_${data.summary.kodeSatker}`);
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.items.filter(item => {
      // Satker Filter
      if (selectedSatkerFilter !== 'ALL' && item.kodeSatker !== selectedSatkerFilter) {
        return false;
      }
      // Severity Filter
      if (filterSeverity !== 'ALL' && item.diagnosaSeverity !== filterSeverity) {
        return false;
      }
      // SAKTI Validation Filter
      if (filterValidation === 'DITOLAK' && !item.validasiSaktiStatus?.includes('Ditolak')) {
        return false;
      }
      if (filterValidation === 'EARLY_WARNING' && !item.validasiSaktiStatus?.includes('Early Warning')) {
        return false;
      }
      if (filterValidation === 'GAP_TINGGI' && Math.abs(item.gapPpa) <= 20 && item.gapKinerja <= 20) {
        return false;
      }
      if (filterValidation === 'BELUM_100' && item.nilaiKomponenRo >= 99.99) {
        return false;
      }
      if (filterValidation === 'UNCONFIRMED_KPPN' && !item.isUnconfirmedKppn) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchKodeRo = item.kodeRo.toLowerCase().includes(query);
        const matchNamaRo = item.namaRo.toLowerCase().includes(query);
        const matchKro = (item.namaKro || '').toLowerCase().includes(query);
        const matchKeg = (item.namaKegiatan || '').toLowerCase().includes(query);
        const matchSatker = item.kodeSatker.toLowerCase().includes(query) || item.namaSatker.toLowerCase().includes(query);
        if (!matchKodeRo && !matchNamaRo && !matchKro && !matchKeg && !matchSatker) {
          return false;
        }
      }
      return true;
    });
  }, [data, selectedSatkerFilter, filterSeverity, filterValidation, searchQuery]);

  // Pagination Slice
  const totalFiltered = filteredItems.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Juknis Filtered References
  const filteredReferences = useMemo(() => {
    return SAKTI_REFERENSI_LIST.filter(ref => {
      if (selectedRefCategory !== 'ALL' && ref.kategoriAnomali !== selectedRefCategory) {
        return false;
      }
      if (refSearch.trim()) {
        const q = refSearch.toLowerCase();
        return ref.kode.includes(q) || ref.judul.toLowerCase().includes(q) || ref.deskripsiJuknis.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedRefCategory, refSearch]);

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
          }
        }}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* HEADER SECTION */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-slate-800/90 via-slate-800 to-indigo-950/40 border-slate-700/80 shadow-xl' 
          : 'bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/50 border-slate-200/80 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-cyan-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SI-CAPUT • Juknis SAKTI Ver 3.2 Tahun 2026</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Diagnostik &amp; Template Keterangan SAKTI
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Analisis akurasi <strong>Kolom Z (Nilai Capaian Output)</strong> dari MyIntress, deteksi <strong>8 Variabel Validasi SAKTI</strong>, dan otomatisasi <strong>9 Kode Referensi Keterangan Resmi</strong> untuk akselerasi nilai IKPA Satker.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {!data ? (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Unggah File MyIntress (.xlsx)</span>
                </button>
                <button
                  onClick={handleLoadDemo}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all border border-slate-200 dark:border-slate-600 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Coba Contoh Data Demo</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ganti File Excel</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Hasil Analisis &amp; Template</span>
                </button>
                <button
                  onClick={handleResetData}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  title="Hapus Data & Reset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* SATKER ACTIVE SUMMARY BADGE */}
        {data && (
          <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-cyan-400 font-bold">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-600 dark:text-cyan-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    {data.summary.kodeSatker}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {data.summary.namaSatker}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3" />
                  Periode: <strong className="text-slate-700 dark:text-slate-300">{data.summary.periode}</strong>
                  {data.uploadedFileName && (
                    <span className="truncate max-w-xs text-slate-400">({data.uploadedFileName})</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Kepatuhan Terbaca:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                {data.summary.totalRo} Rincian Output
              </span>
            </div>
          </div>
        )}
      </div>

      {/* PENGUMUMAN & HAL PENTING SAKTI 2026 BANNER */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs leading-relaxed">
        <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="font-bold text-sm text-amber-800 dark:text-amber-300">
              📌 Hal Penting Pelaporan SAKTI Tahun 2026 (Juknis Ver 3.2):
            </strong>
            <span className="px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 text-[10px] font-extrabold uppercase">
              Wajib Diketahui Satker
            </span>
          </div>
          <p className="text-[11px] text-amber-800 dark:text-amber-300/90">
            • <strong>Open Period Reguler:</strong> Dibuka sistem otomatis mulai tgl 1 s.d. <strong>Hari Kerja ke-7 awal bulan</strong> berikutnya.<br />
            • <strong>Alur Persetujuan:</strong> Operator Komitmen merekam data &rarr; <strong>PPK wajib Validasi (Setuju)</strong> &rarr; Operator PPK Umum menekan <strong>KIRIM</strong> (Tombol Kirim aktif hanya jika SELURUH RO disetujui PPK).<br />
            • <strong>Status Kolom R (Konfirmasi KPPN):</strong> Jika status <em>Terkonfirmasi</em> data aman. Jika status <em>Tidak Terkonfirmasi</em> nilai Caput menjadi 0 sehingga wajib lapor/konfirmasi ke KPPN mitra kerja.<br />
            • <strong>Siklus OLAP MyIntress:</strong> Apabila seluruh data di SAKTI sudah OK dan divalidasi namun nilai di MyIntress belum 100, silakan tunggu proses batch OLAP MyIntress sekitar <strong>2 jam kemudian</strong>.
          </p>
        </div>
      </div>

      {/* SPECIAL ALERT FOR UNCONFIRMED KOLOM R */}
      {data && (data.summary.roUnconfirmedCount || 0) > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 flex items-start gap-3 text-xs leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="font-extrabold text-sm text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <span>🚨 Perhatian Kritis Kolom R: Terdeteksi {data.summary.roUnconfirmedCount} RO Tidak/Belum Terkonfirmasi KPPN</span>
              </strong>
              <button
                onClick={() => {
                  setFilterValidation('UNCONFIRMED_KPPN');
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                Lihat RO Perlu Konfirmasi ({data.summary.roUnconfirmedCount})
              </button>
            </div>
            <p className="text-[11px] text-rose-800 dark:text-rose-300/90 leading-relaxed">
              Pada aplikasi MyIntress, status pada <strong>Kolom R</strong> yang tidak terkonfirmasi biasanya menyebabkan nilai capaian output menjadi <strong>0,00</strong>. Harap segera melapor atau mengajukan konfirmasi ke KPPN mitra kerja (Seksi MSKI). Jika data baru saja divalidasi dan disetujui PPK di SAKTI, nilai akan ter-update setelah siklus OLAP MyIntress berjalan (estimasi <strong>2 jam kemudian</strong>).
            </p>
          </div>
        </div>
      )}

      {/* ERROR ALERT */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Gagal Memproses File</p>
              <p className="text-xs mt-0.5 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
          <button 
            onClick={() => setErrorMsg(null)}
            className="text-xs font-semibold underline hover:no-underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* NAVIGATION SUB-TABS (7 Sub-Tabs) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('DIAGNOSTIK')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'DIAGNOSTIK'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Hasil Diagnostik &amp; Audit {data ? `(${data.summary.totalRo})` : ''}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('SIMULASI_SAKTI')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'SIMULASI_SAKTI'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-indigo-500" />
          <span>Simulasi &amp; What-If</span>
        </button>

        <button
          onClick={() => setActiveSubTab('REVERSE_CALC')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'REVERSE_CALC'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wand2 className="w-4 h-4 text-emerald-500" />
          <span>Kalkulator PCRO Minimum</span>
        </button>

        <button
          onClick={() => setActiveSubTab('TRAJEKTORI')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'TRAJEKTORI'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          <span>Trajektori &amp; Prognosis</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ACTION_PLAN')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'ACTION_PLAN'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-blue-500" />
          <span>Jadwal Aksi PPK (4 Pekan)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('SURAT_KPPN')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'SURAT_KPPN'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-500" />
          <span>Surat Klarifikasi KPPN</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ANALISIS_KRO')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'ANALISIS_KRO'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-500" />
          <span>Portofolio KRO</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PLAYBOOK_ANOMALI')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'PLAYBOOK_ANOMALI'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Playbook 10 Anomali</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ATURAN_JUKNIS')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'ATURAN_JUKNIS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span>9 Ref &amp; 8 Validasi</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PANDUAN')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'PANDUAN'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-indigo-500" />
          <span>Panduan Unduh</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* KONDISI 1: DATA BELUM DIUNGGAH (EMPTY STATE AWAL)            */}
      {/* ------------------------------------------------------------- */}
      {!data && activeSubTab === 'DIAGNOSTIK' && (
        <div className="space-y-6">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-8 sm:p-12 rounded-3xl border-2 border-dashed text-center transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 scale-[1.01]'
                : isDark
                  ? 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                  : 'border-slate-300 bg-white hover:border-indigo-300 shadow-sm'
            }`}
          >
            <div className="max-w-xl mx-auto space-y-5">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-cyan-400 shadow-inner">
                <FileSpreadsheet className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Unggah File Excel Capaian Output Satker Anda
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Silakan unggah file rincian output dari aplikasi <strong>MyIntress</strong> (format <code>.xlsx</code> / <code>.xls</code> / <code>.csv</code>). Sistem akan membaca langsung <strong>Kolom Z (Nilai Caput)</strong>, mendeteksi deviasi fisik terhadap target, serta menyiapkan <strong>Template Keterangan SAKTI Resmi (Kode 01 s.d. 08 &amp; 99)</strong>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Pilih File Excel (.xlsx)</span>
                </button>

                <button
                  onClick={handleLoadDemo}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-600 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-indigo-500" />
                  <span>Muat Contoh Data Demo</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Evaluasi Kolom Z Resmi
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  9 Referensi Keterangan SAKTI
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  8 Variabel Validasi Kualitas Data
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* KONDISI 2: DATA SUDAH TERSEDIA (HASIL DIAGNOSTIK RO)          */}
      {/* ------------------------------------------------------------- */}
      {data && activeSubTab === 'DIAGNOSTIK' && (
        <div className="space-y-6">
          {/* KPI METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Skor Caput Satker */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isDark 
                ? 'bg-slate-800/90 border-slate-700/80 shadow-md' 
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skor Caput Satker</span>
                <div className={`p-2 rounded-xl ${data.summary.currentScoreCaput >= 90 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-amber-100 dark:bg-amber-950 text-amber-600'}`}>
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`text-3xl font-black ${
                  data.summary.currentScoreCaput >= 90 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : data.summary.currentScoreCaput >= 70 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {data.summary.currentScoreCaput}
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ 100</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Potensi Setelah Perbaikan:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {data.summary.projectedScoreCaput} (+{(data.summary.projectedScoreCaput - data.summary.currentScoreCaput).toFixed(2)})
                </span>
              </div>
            </div>

            {/* Card 2: RO Kritis (Kolom Z < 60 / Zero Progress) */}
            <div className={`p-5 rounded-2xl border transition-all ${
              data.summary.roKritisCount > 0 
                ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 shadow-md' 
                : isDark ? 'bg-slate-800/90 border-slate-700/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">RO Kritis (Kolom Z &lt; 60)</span>
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                  {data.summary.roKritisCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">RO Kritis</span>
              </div>
              <p className="mt-2 text-[11px] text-rose-700 dark:text-rose-300/80 leading-snug">
                {data.summary.roKritisCount > 0 
                  ? '🚨 Kolom Z < 60 atau kondisi TPCRO=0 & PCRO=0' 
                  : '✅ Tidak terdeteksi kondisi zero progress / nilai kritis.'}
              </p>
            </div>

            {/* Card 3: RO Belum Optimal (Kolom Z < 100) - Red Block Alert */}
            <div className={`p-5 rounded-2xl border-2 transition-all ${
              data.summary.roPeringatanCount > 0 
                ? 'bg-rose-50/90 dark:bg-rose-950/60 border-rose-400 dark:border-rose-700 shadow-lg shadow-rose-600/15 ring-2 ring-rose-500/20' 
                : isDark ? 'bg-slate-800/90 border-slate-700/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">RO Belum Optimal (Z &lt; 100)</span>
                <div className="p-2 rounded-xl bg-rose-600 text-white shadow-sm">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                  {data.summary.roPeringatanCount}
                </span>
                <span className="text-xs text-rose-700 dark:text-rose-300 font-bold">RO Belum 100</span>
              </div>
              <p className="mt-2 text-[11px] text-rose-700 dark:text-rose-300 font-medium leading-snug">
                {data.summary.roPeringatanCount > 0
                  ? '🚨 Nilai Kolom Z belum mencapai 100, pilih referensi substantif & lengkapi narasi SAKTI.'
                  : 'Seluruh RO telah mencapai nilai 100.'}
              </p>
            </div>

            {/* Card 4: RO Optimal (Kolom Z = 100) - Clean Neutral (Tidak terlalu di-highlight) */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-800/50 border-slate-700/70 shadow-sm' : 'bg-slate-50/80 border-slate-200/80 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">RO Optimal (Kolom Z = 100)</span>
                <div className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-700 dark:text-slate-200">
                  {data.summary.roOptimalCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">dari {data.summary.totalRo} RO</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Target tercapai normal (skor 100 penuh).
              </p>
            </div>
          </div>

          {/* SAKTI PRE-FLIGHT AUDIT & HEALTH-CHECK SCORECARD */}
          <SaktiPreFlightAuditCard
            data={data}
            onOpenSimulator={(ro) => setSimulatingRO(ro)}
            onOpenNarrativeBuilder={(ro) => setCustomizingRO(ro)}
            isDark={isDark}
          />

          {/* FILTER & SEARCH CONTROLS */}
          <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 ${
            isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Kode RO, Nama RO, KRO, Kegiatan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border transition-colors outline-none ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'
                }`}
              />
            </div>

            {/* Severity & SAKTI Validation Badges Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setFilterSeverity('ALL');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterSeverity === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isDark ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({data.summary.totalRo})
                </button>

                <button
                  onClick={() => {
                    setFilterSeverity('KRITIS');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterSeverity === 'KRITIS'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                  }`}
                >
                  <span>🚨 Kritis ({data.summary.roKritisCount})</span>
                </button>

                <button
                  onClick={() => {
                    setFilterSeverity('PERINGATAN');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterSeverity === 'PERINGATAN'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-2 border-rose-300 dark:border-rose-800 font-extrabold'
                  }`}
                >
                  <span>🚨 Belum 100 ({data.summary.roPeringatanCount})</span>
                </button>

                <button
                  onClick={() => {
                    setFilterSeverity('OPTIMAL');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterSeverity === 'OPTIMAL'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>Optimal ({data.summary.roOptimalCount})</span>
                </button>
              </div>

              {/* SAKTI Validation Filter Dropdown */}
              <div className="w-auto">
                <select
                  value={filterValidation}
                  onChange={(e) => {
                    setFilterValidation(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer ${
                    filterValidation !== 'ALL'
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 border-indigo-300'
                      : isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  <option value="ALL">🔍 Semua Status SAKTI</option>
                  <option value="UNCONFIRMED_KPPN">🚨 Kolom R Tidak Terkonfirmasi ({data.summary.roUnconfirmedCount || 0})</option>
                  <option value="DITOLAK">🚨 Input Ditolak (01, 03, 04, 06)</option>
                  <option value="EARLY_WARNING">⚡ Early Warning (02, 05, 07, 08)</option>
                  <option value="GAP_TINGGI">⚠️ Deviasi GAP &gt; 20%</option>
                  <option value="BELUM_100">📉 Kolom Z &lt; 100</option>
                </select>
              </div>

              <button
                onClick={() => setIsSptjmModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Dokumen SPTJM KPA</span>
              </button>

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Ekspor &amp; Payload SAKTI</span>
              </button>

              <button
                onClick={handleBulkCopyTemplates}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                {bulkCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Semua Keterangan Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Narasi SAKTI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* LIST OF RO CARDS */}
          {paginatedItems.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
              <AlertTriangle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada data RO yang sesuai filter.</p>
              <p className="text-xs text-slate-500 mt-1">Coba ubah kata kunci pencarian atau reset filter severity.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedItems.map((ro) => {
                const isKritis = ro.diagnosaSeverity === 'KRITIS';
                const isPeringatan = ro.diagnosaSeverity === 'PERINGATAN';
                const isOptimal = ro.nilaiKomponenRo >= 99.99 && !isKritis && !isPeringatan;
                const isBelumOptimal = !isOptimal;
                const narrative = getEffectiveNarrative(ro);

                return (
                  <div
                    key={ro.id}
                    className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                      isBelumOptimal
                        ? 'border-rose-500 dark:border-rose-700 bg-white dark:bg-slate-800/95 shadow-md shadow-rose-600/10 ring-1 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 opacity-95 hover:opacity-100 shadow-sm'
                    }`}
                  >
                    {/* Header Strip: Red Block Header for Belum Optimal, Neutral Clean for Optimal */}
                    <div className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
                      isBelumOptimal
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                        : 'bg-slate-100/90 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-md font-black text-[10px] tracking-wider uppercase ${
                          isBelumOptimal
                            ? 'bg-white text-rose-700 shadow-sm'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {isBelumOptimal ? `🚨 ${isKritis ? 'RO KRITIS (Z < 60)' : 'BELUM OPTIMAL (Z < 100)'}` : 'OPTIMAL (Z = 100)'}
                        </span>

                        <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                          isBelumOptimal 
                            ? 'bg-rose-800/90 text-white border-rose-400' 
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}>
                          {ro.kodeRo}
                        </span>

                        <span className={`text-[11px] ${isBelumOptimal ? 'text-rose-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {ro.kodeSatker} - {ro.namaSatker}
                        </span>

                        {/* Status Validasi SAKTI Badge */}
                        {ro.validasiSaktiCode && ro.validasiSaktiCode !== '00' && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBelumOptimal 
                              ? 'bg-rose-950/80 text-rose-100 border border-rose-400/50' 
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}>
                            ⚡ Validasi {ro.validasiSaktiCode} ({ro.validasiSaktiStatus?.includes('Ditolak') ? 'Input Ditolak' : 'Early Warning'})
                          </span>
                        )}

                        {/* Status Kolom R Badge (Konfirmasi KPPN) */}
                        {ro.statusKonfirmasiKppn && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                            isBelumOptimal
                              ? 'bg-rose-950/80 text-rose-100 border border-rose-400/50'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}>
                            <span>Kolom R: {ro.statusKonfirmasiKppn}</span>
                            {ro.isUnconfirmedKppn ? <span>(⚠️ Perlu Lapor KPPN)</span> : <span>(✓ Aman)</span>}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-mono font-bold text-[11px]">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          isBelumOptimal ? 'bg-rose-800 text-rose-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>Kolom Z</span>
                        <span className={`uppercase text-[10px] ${isBelumOptimal ? 'text-rose-100' : 'text-slate-500 dark:text-slate-400'}`}>Nilai Caput:</span>
                        <span className={`text-sm font-black px-2.5 py-0.5 rounded-lg ${
                          isBelumOptimal
                            ? 'bg-white text-rose-700 shadow-sm'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}>
                          {ro.nilaiKomponenRo.toFixed(2)} / 100
                        </span>
                      </div>
                    </div>

                    {/* Main Card Body */}
                    <div className="p-5 sm:p-6 space-y-4">
                      {/* RO Title & Hierarchy */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {ro.namaRo}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {ro.namaProgram ? `${ro.namaProgram} • ` : ''}{ro.namaKegiatan} {ro.namaKro ? `• ${ro.namaKro}` : ''}
                        </p>
                      </div>

                      {/* 4 Pillars Matrix (Kolom X, P, Y, Q, Z) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 font-mono font-bold text-[9px]">Kolom Y</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Target (TPCRO)</span>
                          </div>
                          <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                            {ro.targetProgres.toFixed(2)}%
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            <span className="font-mono font-semibold text-indigo-600 dark:text-cyan-400">Kolom X:</span> {ro.volumeTarget} vol
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 font-mono font-bold text-[9px]">Kolom Q</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Realisasi (PCRO)</span>
                          </div>
                          <span className={`font-mono font-extrabold text-sm ${
                            isBelumOptimal
                              ? 'text-rose-600 dark:text-rose-400 font-black'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}>
                            {ro.realisasiProgres.toFixed(2)}%
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            <span className="font-mono font-semibold text-indigo-600 dark:text-cyan-400">Kolom P:</span> {ro.volumeRealisasi} vol
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Deviasi Target (Q - Y)</span>
                          <span className={`font-mono font-extrabold text-sm ${
                            isBelumOptimal
                              ? 'text-rose-600 dark:text-rose-400 font-black'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {ro.gapKinerja > 0 ? `-${ro.gapKinerja.toFixed(2)}%` : '+0.00%'}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            GAP PCRO-PPA: <strong className={ro.gapPpa < -20 ? 'text-rose-500' : ro.gapPpa > 20 ? 'text-indigo-500' : 'text-slate-600'}>{ro.gapPpa > 0 ? `+${ro.gapPpa.toFixed(1)}%` : `${ro.gapPpa.toFixed(1)}%`}</strong>
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Penyerapan Anggaran</span>
                          <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                            {ro.persenPenyerapan ? `${ro.persenPenyerapan.toFixed(1)}%` : '-'}
                          </span>
                          {ro.realisasiAnggaran !== undefined && (
                            <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
                              {formatRupiahCaput(ro.realisasiAnggaran)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Diagnostic Box: Red Block for Belum Optimal, Neutral for Optimal */}
                      <div className={`p-4 rounded-xl border space-y-2 ${
                        isBelumOptimal 
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100' 
                          : 'bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <div className={`flex items-center gap-2 font-bold text-xs sm:text-sm ${
                          isBelumOptimal ? 'text-rose-800 dark:text-rose-200 font-black' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          <Cpu className={`w-4 h-4 shrink-0 ${isBelumOptimal ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`} />
                          <span>{ro.diagnosaTitle}</span>
                        </div>
                        <p className={`text-xs leading-relaxed opacity-95 pl-6 ${
                          isBelumOptimal ? 'text-rose-900 dark:text-rose-200' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {ro.diagnosaDescription}
                        </p>
                      </div>

                      {/* Explicit Warning for Kolom R Unconfirmed */}
                      {ro.isUnconfirmedKppn && (
                        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-3">
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <strong className="font-extrabold text-rose-800 dark:text-rose-300 block">
                              🚨 Perhatian Kolom R: Status Konfirmasi KPPN "{ro.statusKonfirmasiKppn}"
                            </strong>
                            <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300/90">
                              Data pada Kolom R MyIntress belum dikonfirmasi KPPN sehingga nilai Caput RO ini menjadi <strong>0,00</strong>. 
                              Silakan segera lapor / konfirmasi ke KPPN mitra kerja (Seksi MSKI). Apabila di SAKTI sudah divalidasi dan disetujui PPK, harap tunggu siklus update OLAP MyIntress sekitar <strong>2 jam kemudian</strong>.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Action Recommendations */}
                      {ro.rekomendasiTindakan.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Langkah Perbaikan Rekomendasi (SAKTI Modul Komitmen):</span>
                          </span>
                          <ul className="space-y-1 pl-5 list-disc text-xs text-slate-600 dark:text-slate-400">
                            {ro.rekomendasiTindakan.map((rek, idx) => (
                              <li key={idx} className="leading-relaxed">
                                {rek}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* PEMILIH REFERENSI SAKTI & TEMPLATE KETERANGAN DINAMIS */}
                      <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                        {/* Selector Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                            <label htmlFor={`ref-select-${ro.id}`} className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                              Pilih Kode Referensi SAKTI Resmi:
                            </label>
                          </div>

                          {/* Dropdown 9 Kode Referensi SAKTI */}
                          <div className="w-full sm:w-80">
                            <select
                              id={`ref-select-${ro.id}`}
                              value={narrative.refCode}
                              onChange={(e) => handleRefChange(ro.id, e.target.value)}
                              className={`w-full text-xs font-semibold px-3 py-1.5 rounded-xl border outline-none cursor-pointer transition-colors ${
                                isDark 
                                  ? 'bg-slate-900 border-indigo-900/80 text-cyan-300 focus:border-cyan-400' 
                                  : 'bg-indigo-50/70 border-indigo-200 text-indigo-900 focus:border-indigo-500'
                              }`}
                            >
                              {SAKTI_REFERENSI_LIST.map(ref => (
                                <option key={ref.kode} value={ref.kode} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                                  {ref.kode === '99' ? `⚠️ ${ref.kode}) ${ref.judul} (Dihindari)` : `${ref.kode}) ${ref.judul}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Selected Reference Explanatory Note */}
                        <div className="px-3.5 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-800 dark:text-slate-200 font-bold">{narrative.refTitle}</strong>: {SAKTI_REFERENSI_LIST.find(r => r.kode === narrative.refCode)?.deskripsiJuknis}
                          </div>
                        </div>

                        {/* Warning Callout when 99 is Selected */}
                        {narrative.refCode === '99' && (
                          <div className="px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold block">Peringatan DJPb &amp; KPPN: Hindari Kode 99!</strong>
                              Penggunaan Kode 99 (Lain-lain) sebaiknya dihindari. Utamakan memilih kode referensi 01 s.d. 08 yang substantif (seperti Kode 01 Efisiensi, Kode 02 SPJ Masih Proses, Kode 04 Penyesuaian Target, Kode 05 Penilaian Periodik, atau Kode 07 Menunggu BAST/Jadwal) agar capaian output disetujui tanpa risiko penolakan KPPN.
                            </div>
                          </div>
                        )}

                        {/* Template SAKTI Ready-to-Copy */}
                        <div className="space-y-2 pt-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Narasi Keterangan SAKTI ({narrative.text.length} / 2.000 Karakter):</span>
                            </span>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                onClick={() => setCustomizingRO(ro)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950 dark:hover:bg-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-all cursor-pointer"
                                title="Susun rincian 3 komponen wajib SAKTI (Tahapan, Kendala, Solusi)"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Susun 3 Elemen</span>
                              </button>

                              <button
                                onClick={() => setSimulatingRO(ro)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950 dark:hover:bg-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-all cursor-pointer"
                                title="Simulasikan jika target/realisasi fisik atau belanja diubah"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Simulasi Nilai</span>
                              </button>

                              <button
                                onClick={() => handleCopyTemplate(ro.id, narrative.text)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  copiedId === ro.id
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                }`}
                              >
                                {copiedId === ro.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Tersalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Salin Narasi</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className={`p-3 rounded-xl font-mono text-xs leading-relaxed border select-all ${
                            isDark 
                              ? 'bg-slate-900/90 border-slate-700 text-slate-300' 
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            "{narrative.text}"
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pt-2">
                  <PaginationControl
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={totalFiltered}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(newSize) => {
                      setPageSize(newSize);
                      setCurrentPage(1);
                    }}
                    pageSizeOptions={[5, 10, 25, 50]}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 2: ATURAN & REFERENSI RESMI SAKTI 2026                 */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'ATURAN_JUKNIS' && (
        <div className="space-y-8">
          {/* SECTION 1: 8 VARIABEL VALIDASI KUALITAS DATA SAKTI */}
          <div className={`p-6 sm:p-8 rounded-3xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'} space-y-6`}>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold mb-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Aturan Validasi Sistem SAKTI Saat Simpan Data</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                8 Variabel Kualitas Data Capaian Output SAKTI
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Mulai tahun 2026, validasi 8 variabel kualitas data dilakukan langsung pada Aplikasi SAKTI saat proses <strong>Simpan Data</strong> (tidak lagi menunggu pengiriman OMSPAN). Berikut status aksi dan cara penyelesaiannya:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SAKTI_VALIDASI_RULES.map((val) => {
                const isDitolak = val.statusAction.includes('Ditolak');
                return (
                  <div 
                    key={val.kode}
                    className={`p-4 sm:p-5 rounded-2xl border space-y-3 transition-all ${
                      isDitolak
                        ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                        : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                          isDitolak ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          {val.nama}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          {val.kondisi}
                        </span>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-xl border text-[11px] font-mono leading-relaxed ${
                      isDitolak 
                        ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' 
                        : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}>
                      <strong className="block text-[10px] uppercase font-bold tracking-wider mb-0.5">Warning Box SAKTI:</strong>
                      "{val.warningBox}"
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        isDitolak 
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                      }`}>
                        Status Aksi: {val.statusAction}
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                        💡 <strong>Solusi Satker:</strong> {val.petunjuk}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: 9 KODE REFERENSI KETERANGAN SAKTI */}
          <div className={`p-6 sm:p-8 rounded-3xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'} space-y-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 text-xs font-bold mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Katalog Referensi Resmi DJPb Kemenkeu</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  9 Kode Referensi Keterangan SAKTI &amp; Kriterianya
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
                  Pilihlah kode referensi yang tepat untuk menjelaskan anomali kuantitatif (GAP capaian) agar data capaian output Satker disetujui dan berstatus <strong>Terkonfirmasi &amp; Valid</strong> oleh KPPN.
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                {['ALL', 'Capaian Kinerja Terlalu Tinggi', 'Capaian Kinerja Terlalu Rendah', 'Anomali Kuantitatif Lainnya', 'Semua Kondisi Anomali'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedRefCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedRefCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : isDark ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua Kategori' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Himbauan DJPb & KPPN: Hindari Kode 99 */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-bold text-sm block">Arahan Prioritas: Hindari Penggunaan Kode Referensi 99 (Lain-lain)</strong>
                <p className="leading-relaxed">
                  Berdasarkan monitoring DJPb dan KPPN, penggunaan Kode Referensi 99 sering menjadi temuan atau ditolak saat rekonsiliasi manual karena tidak memberikan alasan yang spesifik. Satuan kerja <strong>sangat dianjurkan memetakan kendala ke Kode 01 s.d. 08</strong> yang substantif (misal: Efisiensi Anggaran, SPJ Masih Berproses, Penyesuaian Target/Jadwal, Penilaian Periodik, atau Menunggu BAST) agar data langsung terkonfirmasi dan tidak dipertanyakan.
                </p>
              </div>
            </div>

            {/* List 9 Referensi */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReferences.map((ref) => {
                const isRef99 = ref.kode === '99';
                return (
                  <div
                    key={ref.kode}
                    className={`p-5 rounded-2xl border space-y-3 flex flex-col justify-between transition-all ${
                      isRef99
                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20'
                        : isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`w-8 h-8 rounded-xl text-white font-black text-sm flex items-center justify-center shadow-sm ${
                          isRef99 ? 'bg-amber-600' : 'bg-indigo-600'
                        }`}>
                          {ref.kode}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isRef99 
                            ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {isRef99 ? '⚠️ DIHINDARI' : ref.kategoriAnomali}
                        </span>
                      </div>

                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                        {ref.judul}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {ref.deskripsiJuknis}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px]">
                      <span className="font-bold text-indigo-600 dark:text-cyan-400 block mb-0.5">Kondisi Penggunaan:</span>
                      <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        {ref.kondisiPemicu}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Syarat 3 Elemen Keterangan Memadai */}
            <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2 text-xs text-indigo-950 dark:text-indigo-200">
              <div className="flex items-center gap-2 font-bold text-sm text-indigo-700 dark:text-cyan-300">
                <Sparkles className="w-4 h-4" />
                <span>3 Elemen Wajib Keterangan Memadai (Terutama untuk Referensi 99):</span>
              </div>
              <p className="leading-relaxed">
                Berdasarkan Juknis SAKTI Ver 3.2 Halaman 30, isian keterangan bersifat <em>mandatory</em> (maksimal 2.000 karakter). Agar tidak ditolak KPPN pada konfirmasi manual, narasi wajib memuat:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-900">
                  <strong className="block text-indigo-600 dark:text-cyan-400 font-bold mb-1">1. Capaian &amp; Aktivitas</strong>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">Menyampaikan informasi progres fisik riil dan tahapan kegiatan yang telah diselesaikan.</p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-900">
                  <strong className="block text-indigo-600 dark:text-cyan-400 font-bold mb-1">2. Kendala &amp; Solusi</strong>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">Menyampaikan kendala teknis lapangan serta rencana tindak lanjut akselerasi.</p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-900">
                  <strong className="block text-indigo-600 dark:text-cyan-400 font-bold mb-1">3. Penjelasan Substansial</strong>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">Menyampaikan metode perhitungan bobot atau alasan perbedaan termin bayar vs fisik.</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: JADWAL OPEN PERIOD 2026 & DISPENSASI */}
          <div className={`p-6 sm:p-8 rounded-3xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'} space-y-6`}>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Kalender Pelaporan Capaian Output 2026</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Jadwal Batas Akhir Open Period Reguler Tahun 2026
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Pelaporan menganut <strong>prinsip sekuensial</strong> (berurutan). Jika ada 1 bulan yang terlewat tidak dilaporkan, Satker tidak dapat menyampaikan laporan bulan berikutnya kecuali mengajukan pembukaan akses via <strong>Hai Kemenkeu</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { bulan: 'Januari 2026', deadline: '30 April 2026' },
                { bulan: 'Februari 2026', deadline: '30 April 2026' },
                { bulan: 'Maret 2026', deadline: '30 April 2026' },
                { bulan: 'April 2026', deadline: '12 Mei 2026' },
                { bulan: 'Mei 2026', deadline: '10 Juni 2026' },
                { bulan: 'Juni 2026', deadline: '9 Juli 2026' },
                { bulan: 'Juli 2026', deadline: '11 Agustus 2026' },
                { bulan: 'Agustus 2026', deadline: '9 September 2026' },
                { bulan: 'September 2026', deadline: '9 Oktober 2026' },
                { bulan: 'Oktober 2026', deadline: '10 November 2026' },
                { bulan: 'November 2026', deadline: '9 Desember 2026' },
                { bulan: 'Desember 2026', deadline: '13 Januari 2027' },
              ].map((per, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{per.bulan}</span>
                  <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-cyan-400">{per.deadline}</span>
                </div>
              ))}
            </div>

            {/* Aturan Pembukaan Periode Tambahan & Dispensasi HAI Kemenkeu */}
            <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-500" />
                <span>Tata Cara Pembukaan Akses Pelaporan Terlewat (Dispensasi)</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Jika periode telah ditutup, Satker dapat mengajukan permohonan pembukaan akses melalui contact center <strong>Hai Kemenkeu</strong> (<a href="https://hai.kemenkeu.go.id" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-cyan-400 underline">https://hai.kemenkeu.go.id</a>). Surat permohonan minimal mencantumkan: <strong>Kode BA, Unit Eselon I, Kanwil DJPb mitra, KPPN mitra, Kode Satker, dan Periode Pelaporan</strong> yang dimohonkan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB: SIMULASI & WHAT-IF SAKTI 2026                        */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'SIMULASI_SAKTI' && (
        <div className="space-y-6">
          {data ? (
            <div className={`p-6 sm:p-8 rounded-3xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'} space-y-6`}>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 text-xs font-bold mb-2">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Kalkulator &amp; Uji Coba Kinerja SAKTI</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Pilih Rincian Output (RO) untuk Disimulasikan
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
                  Pilih salah satu RO di bawah untuk membuka simulator interaktif. Anda dapat menggeser slider realisasi progres (PCRO), target (TPCRO), dan realisasi volume (RVRO) untuk melihat pembentukan <strong>Nilai Kolom Z</strong>, validasi SAKTI 01–08, dan menerapkan perubahan ke dataset.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.items.map((ro) => {
                  const isBelumOpt = ro.nilaiKomponenRo < 99.99 || ro.diagnosaSeverity !== 'OPTIMAL';
                  return (
                    <div
                      key={ro.id}
                      onClick={() => setSimulatingRO(ro)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer hover:scale-[1.01] flex flex-col justify-between ${
                        isBelumOpt
                          ? 'bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-950/70 border-rose-400 dark:border-rose-800 shadow-sm'
                          : 'bg-slate-50/70 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300">
                            {ro.kodeRo}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                            isBelumOpt
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {isBelumOpt ? '🚨 ' : ''}Kolom Z: {ro.nilaiKomponenRo.toFixed(1)}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                          {ro.namaRo}
                        </h4>
                      </div>

                      <div className="mt-4 pt-3 border-t border-current/10 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500">PCRO: {ro.realisasiProgres.toFixed(1)}% | TPCRO: {ro.targetProgres.toFixed(1)}%</span>
                        <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400 flex items-center gap-1">
                          Buka Simulasi &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={`p-8 sm:p-12 rounded-3xl border text-center ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-cyan-400">
                  <Sliders className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Belum Ada Data RO untuk Disimulasikan
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Silakan unggah file Excel MyIntress Anda atau muat contoh data demo untuk mencoba simulator interaktif SAKTI.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Unggah File Excel
                  </button>
                  <button
                    onClick={handleLoadDemo}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-600 cursor-pointer transition-all"
                  >
                    Muat Contoh Demo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB: SURAT KLARIFIKASI KPPN                               */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'SURAT_KPPN' && (
        <div>
          {data ? (
            <SuratKlarifikasiKppnView 
              data={data} 
              kppnName={kppnName} 
              isDark={isDark} 
            />
          ) : (
            <div className={`p-8 sm:p-12 rounded-3xl border text-center ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-cyan-400">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Unggah Data Terlebih Dahulu
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Surat tanggapan dan klarifikasi resmi ke KPPN akan terisi otomatis dengan seluruh rincian RO deviasi setelah Anda mengunggah laporan capaian output.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Unggah File Excel
                  </button>
                  <button
                    onClick={handleLoadDemo}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-600 cursor-pointer transition-all"
                  >
                    Muat Contoh Demo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB: REVERSE CALCULATOR (TARGET MINIMUM PCRO)             */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'REVERSE_CALC' && (
        <div>
          {data ? (
            <SaktiReverseCalculatorView
              data={data}
              onApplyOptimizedValues={handleApplyOptimizedList}
              onOpenSimulator={(ro) => setSimulatingRO(ro)}
              isDark={isDark}
            />
          ) : (
            <div className={`p-8 sm:p-12 rounded-3xl border text-center ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Wand2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Kalkulator Membutuhkan Data Output
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Unggah file Excel MyIntress atau muat contoh demo untuk menghitung target minimum realisasi fisik (PCRO) agar skor IKPA Kolom Z mencapai nilai maksimal.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Unggah File Excel
                  </button>
                  <button
                    onClick={handleLoadDemo}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-600 cursor-pointer transition-all"
                  >
                    Muat Contoh Demo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB: TRAJEKTORI & PROGNOSIS CAPUT AKHIR TAHUN             */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'TRAJEKTORI' && (
        <div>
          {data ? (
            <SaktiTrajectoryForecastView
              data={data}
              onOpenSimulator={(ro) => setSimulatingRO(ro)}
              isDark={isDark}
            />
          ) : (
            <div className={`p-8 sm:p-12 rounded-3xl border text-center ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-cyan-400">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Prognosis Membutuhkan Data Output
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Unggah file Excel MyIntress atau muat contoh demo untuk menghitung trajektori dan kebutuhan akselerasi bulanan menuju target 100%.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Unggah File Excel
                  </button>
                  <button
                    onClick={handleLoadDemo}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-600 cursor-pointer transition-all"
                  >
                    Muat Contoh Demo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB: JADWAL & MATRIKS AKSI PPK (ACTION PLAN GANTT)         */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'ACTION_PLAN' && (
        <div>
          {data ? (
            <SaktiActionPlanGanttView
              data={data}
              onOpenSimulator={(ro) => setSimulatingRO(ro)}
              isDark={isDark}
            />
          ) : (
            <div className={`p-8 sm:p-12 rounded-3xl border text-center ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-cyan-400">
                  <CalendarDays className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Jadwal Aksi Membutuhkan Data Output
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Unggah file Excel MyIntress atau muat contoh demo untuk menyusun agenda aksi 4-mingguan bagi PPK dan tim pengelola keuangan.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Unggah File Excel
                  </button>
                  <button
                    onClick={handleLoadDemo}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-600 cursor-pointer transition-all"
                  >
                    Muat Contoh Demo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB: ANALISIS KRO & PORTOFOLIO OUTPUT                      */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'ANALISIS_KRO' && (
        <div>
          {data ? (
            <KroDistributionAnalyticsView
              data={data}
              onSelectRo={(ro) => {
                setSimulatingRO(ro);
              }}
              isDark={isDark}
            />
          ) : (
            <div className={`p-8 sm:p-12 rounded-3xl border text-center ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-cyan-400">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Portofolio KRO Membutuhkan Data
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Unggah file Excel MyIntress atau muat contoh demo untuk melihat klasterisasi kinerja per Klasifikasi Rincian Output (KRO).
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Unggah File Excel
                  </button>
                  <button
                    onClick={handleLoadDemo}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-600 cursor-pointer transition-all"
                  >
                    Muat Contoh Demo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB: PLAYBOOK ANOMALI & KASUS EKSTREM SAKTI               */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'PLAYBOOK_ANOMALI' && (
        <SaktiPlaybookAnomaliView isDark={isDark} />
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 3: PANDUAN PENGAMBILAN DATA MYINTRESS (7 LANGKAH)      */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'PANDUAN' && (
        <div className="space-y-6">
          <div className={`p-6 sm:p-8 rounded-3xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <HelpCircle className="w-6 h-6 text-indigo-500" />
                  <span>Panduan Mengunduh File Excel dari MyIntress</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
                  Ikuti alur resmi berikut untuk mengekspor data rincian capaian output satuan kerja Anda langsung dari portal MyIntress, lalu unggah file tersebut ke aplikasi ini.
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all self-start sm:self-auto"
              >
                <Upload className="w-4 h-4" />
                <span>Unggah File Sekarang</span>
              </button>
            </div>

            {/* Step by Step Cards */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-600/30">
                  1
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Masuk ke Portal MyIntress</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Buka browser, login ke portal <strong>MyIntress</strong> menggunakan akun satker Anda.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-600/30">
                  2
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Buka Menu Tematik IKPA</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pilih menu <strong>Tematik</strong> &rarr; klik <strong>Indikator Kinerja Pelaksanaan Anggaran (IKPA)</strong> &rarr; pilih <strong>Indikator Kinerja Pelaksanaan Anggaran Satker</strong>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-600/30">
                  3
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Filter Bulan Terakhir</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Filter periode <strong>bulan terakhir</strong> yang ingin dianalisis capaian outputnya, kemudian klik tombol <strong>Kirim / Cari</strong>.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-600/30">
                  4
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Klik Indikator Caput</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pada tabel IKPA Satker, klik angka pada indikator <strong>Capaian Output (Caput)</strong> untuk membuka rekap riwayat bulanan.
                </p>
              </div>

              {/* Step 5 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-600/30">
                  5
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Klik Detail Rincian</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Jika nilai belum mencapai 100, klik tombol/tautan <strong>Detail</strong> pada baris bulan pelaporan yang dipilih.
                </p>
              </div>

              {/* Step 6 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-emerald-600/30">
                  6
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Unduh Excel (.xlsx)</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pada halaman detail rincian RO, klik tombol <strong>Unduh Excel / XLSX</strong> di pojok kanan atas tabel.
                </p>
              </div>

              {/* Step 7 */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5 sm:col-span-2 lg:col-span-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-emerald-600/30">
                    7
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Unggah ke Aplikasi Diagnostik Ini</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-11">
                  Kembali ke aplikasi ini, klik tombol <strong>Unggah File MyIntress (.xlsx)</strong>. Sistem otomatis membaca <strong>Kolom Z (Nilai Caput)</strong> dan <strong>Kolom R (Status Konfirmasi KPPN)</strong> serta menghasilkan rekomendasi perbaikan dan template narasi SAKTI siap pakai.
                </p>
              </div>
            </div>

            {/* Special Callouts: Kolom R & OLAP 2 Jam */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Perhatian Status Kolom R (Konfirmasi KPPN)</span>
                </div>
                <p className="leading-relaxed">
                  • <strong>Status Terkonfirmasi:</strong> Data aman dan dinilai penuh sesuai capaian fisik.<br />
                  • <strong>Status Tidak Terkonfirmasi:</strong> Nilai Caput biasanya menjadi <strong>0,00</strong> di MyIntress sehingga satker <strong>harus segera lapor / konfirmasi ke KPPN mitra kerja</strong> (Seksi MSKI) agar data disetujui.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-indigo-800 dark:text-indigo-300">
                  <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Siklus Update OLAP MyIntress (~2 Jam)</span>
                </div>
                <p className="leading-relaxed">
                  Apabila seluruh pengisian data di SAKTI sudah OK, validasi tanpa error, dan telah disetujui PPK namun nilai di MyIntress belum mencapai 100, harap <strong>menunggu proses olap batch MyIntress sekitar 2 jam kemudian</strong> untuk sinkronisasi nilai terbaru.
                </p>
              </div>
            </div>

            {/* SAKTI Roles Note */}
            <div className="mt-6 p-5 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5 text-xs text-slate-700 dark:text-slate-300">
              <UserCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-sm text-slate-900 dark:text-white">Alur Kewenangan Pengisian SAKTI:</strong>
                <p className="mt-1 leading-relaxed">
                  1. <strong>Operator Komitmen:</strong> Mengisi PCRO, RVRO, Bukti Dokumen, Referensi (01-08 / 99), dan Keterangan.<br />
                  2. <strong>Pejabat Pembuat Komitmen (PPK):</strong> Melakukan reviu dan persetujuan (Validasi PPK: Setuju / Tolak).<br />
                  3. <strong>Operator PPK Umum:</strong> Mengirimkan data ke MyIntress setelah SELURUH RO tervalidasi Setuju oleh PPK.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE MODALS                                            */}
      {/* ------------------------------------------------------------- */}
      <SaktiSimulatorModal
        ro={simulatingRO}
        isOpen={!!simulatingRO}
        onClose={() => setSimulatingRO(null)}
        onApplyChanges={handleApplySimulatedRO}
        isDark={isDark}
      />

      <SmartNarrativeBuilderModal
        ro={customizingRO}
        isOpen={!!customizingRO}
        onClose={() => setCustomizingRO(null)}
        onSaveNarrative={handleSaveCustomNarrative}
        isDark={isDark}
      />

      <SaktiBatchPayloadExportModal
        data={data}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        customRefMap={customRefMap}
        customNarrativeMap={customNarrativeMap}
        isDark={isDark}
      />

      <SaktiSptjmGeneratorModal
        data={data}
        isOpen={isSptjmModalOpen}
        onClose={() => setIsSptjmModalOpen(false)}
        isDark={isDark}
      />

    </div>
  );
};
