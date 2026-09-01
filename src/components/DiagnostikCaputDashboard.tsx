import React, { useState, useRef, useMemo } from 'react';
import { 
  DiagnostikCaputResult, 
  DiagnostikCaputROItem, 
  AppTheme 
} from '../types';
import { 
  parseMyIntressCaputExcel, 
  getDemoDiagnostikCaputData,
  exportDiagnostikCaputToExcel,
  formatRupiahCaput
} from '../utils/diagnostikCaputProcessor';
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
  TrendingUp, 
  Info, 
  Send, 
  ExternalLink, 
  Search, 
  Layers, 
  CheckSquare, 
  Activity, 
  Target,
  ShieldAlert,
  Cpu,
  HelpCircle,
  Clock,
  Building,
  DollarSign,
  Filter,
  BarChart3,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { PaginationControl } from './PaginationControl';

interface DiagnostikCaputDashboardProps {
  theme?: AppTheme;
  kppnName?: string;
  onGoToCapaianOutputTab?: () => void;
}

export const DiagnostikCaputDashboard: React.FC<DiagnostikCaputDashboardProps> = ({
  theme = 'light',
  kppnName = 'KPPN',
  onGoToCapaianOutputTab
}) => {
  const isDark = theme === 'dark';

  // Analysis State
  const [data, setData] = useState<DiagnostikCaputResult>(() => getDemoDiagnostikCaputData());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bulkCopied, setBulkCopied] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'DIAGNOSTIK' | 'REKAP_SATKER' | 'SIMULATOR' | 'PANDUAN'>('DIAGNOSTIK');

  // Filters & Search
  const [selectedSatker, setSelectedSatker] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'KRITIS' | 'PERINGATAN' | 'OPTIMAL'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Live Simulator Overrides State: mapping RO id -> simulated PCRO value
  const [simulatedPcroMap, setSimulatedPcroMap] = useState<Record<string, number>>({});

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const result = await parseMyIntressCaputExcel(file);
      setData(result);
      setSelectedSatker('ALL');
      setSimulatedPcroMap({});
      setCurrentPage(1);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal memproses file Excel Capaian Output.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Export Cleaned Excel
  const handleExportExcel = () => {
    exportDiagnostikCaputToExcel(data, `SI_CAPUT_Kolaka_156_${data.summary.kodeSatker}`);
  };

  // Copy Template Handler for Single Item
  const handleCopyTemplate = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Bulk Copy all problematic SAKTI templates
  const handleBulkCopyTemplates = () => {
    const problematicItems = data.items.filter(it => it.diagnosaSeverity !== 'OPTIMAL');
    const itemsToCopy = problematicItems.length > 0 ? problematicItems : data.items;

    const textToCopy = itemsToCopy.map((it, idx) => {
      return `${idx + 1}. [RO: ${it.kodeRo} - ${it.namaRo}]\nStatus: ${it.diagnosaSeverity} (TPCRO: ${it.targetProgres}%, PCRO: ${it.realisasiProgres}%)\nKeterangan SAKTI:\n${it.templateKeteranganSakti}\n`;
    }).join('\n----------------------------------------\n\n');

    navigator.clipboard.writeText(textToCopy);
    setBulkCopied(true);
    setTimeout(() => setBulkCopied(false), 2500);
  };

  // Extract unique satker list from items
  const uniqueSatkers = useMemo(() => {
    const map = new Map<string, { kode: string; nama: string; count: number }>();
    data.items.forEach(it => {
      if (!map.has(it.kodeSatker)) {
        map.set(it.kodeSatker, { kode: it.kodeSatker, nama: it.namaSatker, count: 0 });
      }
      map.get(it.kodeSatker)!.count++;
    });
    return Array.from(map.values());
  }, [data.items]);

  // Filter Items by Satker, Severity & Search
  const filteredItems = useMemo(() => {
    return data.items.filter(item => {
      if (selectedSatker !== 'ALL' && item.kodeSatker !== selectedSatker) {
        return false;
      }
      if (filterSeverity !== 'ALL' && item.diagnosaSeverity !== filterSeverity) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchKode = item.kodeRo.toLowerCase().includes(q);
        const matchNama = item.namaRo.toLowerCase().includes(q);
        const matchKro = item.kodeKro?.toLowerCase().includes(q) || item.namaKro?.toLowerCase().includes(q);
        const matchKeg = item.kodeKegiatan?.toLowerCase().includes(q) || item.namaKegiatan?.toLowerCase().includes(q);
        const matchSatker = item.kodeSatker.toLowerCase().includes(q) || item.namaSatker.toLowerCase().includes(q);
        if (!matchKode && !matchNama && !matchKro && !matchKeg && !matchSatker) {
          return false;
        }
      }
      return true;
    });
  }, [data.items, selectedSatker, filterSeverity, searchQuery]);

  const totalFiltered = filteredItems.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Compute Simulator Live Score
  const simulatorSummary = useMemo(() => {
    const activeItems = selectedSatker === 'ALL' 
      ? data.items 
      : data.items.filter(it => it.kodeSatker === selectedSatker);

    const total = activeItems.length;
    if (total === 0) return { currentScore: 0, simScore: 0, delta: 0, itemsModified: 0 };

    let currentSum = 0;
    let simSum = 0;
    let itemsModified = 0;

    activeItems.forEach(it => {
      currentSum += it.nilaiKomponenRo;

      const simVal = simulatedPcroMap[it.id] !== undefined ? simulatedPcroMap[it.id] : it.realisasiProgres;
      if (simulatedPcroMap[it.id] !== undefined && simulatedPcroMap[it.id] !== it.realisasiProgres) {
        itemsModified++;
      }

      let simKomponen = 0;
      const tp = it.targetProgres;
      if (tp === 0 && simVal === 0) {
        simKomponen = 0;
      } else if (tp === 0 && simVal > 0) {
        simKomponen = 100;
      } else {
        simKomponen = Math.min(100, (simVal / tp) * 100);
      }
      simSum += simKomponen;
    });

    const currentScore = Number((currentSum / total).toFixed(2));
    const simScore = Number((simSum / total).toFixed(2));
    const delta = Number((simScore - currentScore).toFixed(2));

    return { currentScore, simScore, delta, itemsModified };
  }, [data.items, selectedSatker, simulatedPcroMap]);

  // Quick Action for Simulator: Auto Fix Critical (TPCRO=0 & PCRO=0 -> PCRO=0.01)
  const handleAutoFixCritical = () => {
    const newMap = { ...simulatedPcroMap };
    data.items.forEach(it => {
      if (it.diagnosaCode === 'TPCRO_PCRO_ZERO') {
        newMap[it.id] = 0.01;
      }
    });
    setSimulatedPcroMap(newMap);
  };

  // Quick Action for Simulator: Auto Fulfill All Targets (PCRO = TPCRO)
  const handleAutoFulfillAll = () => {
    const newMap = { ...simulatedPcroMap };
    data.items.forEach(it => {
      if (it.targetProgres === 0 && it.realisasiProgres === 0) {
        newMap[it.id] = 0.01;
      } else {
        newMap[it.id] = it.targetProgres;
      }
    });
    setSimulatedPcroMap(newMap);
  };

  // Reset Simulator
  const handleResetSimulator = () => {
    setSimulatedPcroMap({});
  };

  return (
    <div className={`space-y-6 transition-colors duration-200 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
      />

      {/* TOP HERO BANNER */}
      <div className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-xl border ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border-indigo-800/40 text-white' 
          : 'bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 border-indigo-700 text-white'
      }`}>
        {/* Glow & Background Accents */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
              <span>SI-CAPUT — Engine Pembersih &amp; Diagnostik Capaian Output SAKTI (Kemenkeu 156)</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Tools Diagnostik &amp; Analisis Capaian Output
            </h1>
            
            <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
              Otomatis membersihkan raw data Excel MyIntress/SAKTI menjadi analisa taktis, mendeteksi anomali kritis <strong className="text-amber-300 font-mono bg-amber-950/60 px-1.5 py-0.5 rounded">TPCRO = 0 &amp; PCRO = 0</strong>, dan menyediakan narasi Keterangan SAKTI siap salin.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-indigo-200">
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md">
                <Building className="w-3.5 h-3.5 text-cyan-300" />
                <strong>Satker:</strong> {data.summary.namaSatker} ({data.summary.kodeSatker})
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <strong>Periode:</strong> {data.summary.periode}
              </span>
              {data.uploadedFileName && (
                <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-1 rounded-md font-mono">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                  {data.uploadedFileName}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 min-w-[240px]">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Menganalisis & Membersihkan...' : 'Unggah & Analisis Excel MyIntress'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs border border-indigo-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-cyan-300" />
              <span>Unduh Excel Hasil Analisis</span>
            </button>

            <button
              onClick={() => {
                setData(getDemoDiagnostikCaputData());
                setSelectedSatker('ALL');
                setSimulatedPcroMap({});
                setErrorMsg(null);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-300" />
              <span>Muat Data Demo / Simulasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* ERROR MESSAGE ALERT */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Gagal Menganalisis File</p>
            <p className="text-xs mt-0.5">{errorMsg}</p>
          </div>
          <button 
            onClick={() => setErrorMsg(null)}
            className="text-xs font-semibold underline hover:no-underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* NAVIGATION SUB-TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('DIAGNOSTIK')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'DIAGNOSTIK'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Hasil Diagnostik RO ({data.summary.totalRo})</span>
        </button>

        {uniqueSatkers.length > 1 && (
          <button
            onClick={() => setActiveSubTab('REKAP_SATKER')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'REKAP_SATKER'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : isDark 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Rekap Satker &amp; Peringkat ({uniqueSatkers.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('SIMULATOR')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'SIMULATOR'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Kalkulator &amp; Simulator IKPA</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PANDUAN')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'PANDUAN'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Panduan Unduh MyIntress (6 Langkah)</span>
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Skor Caput Saat Ini */}
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

        {/* Card 2: RO Kritis (TPCRO=0 & PCRO=0 / Zero Progress) */}
        <div className={`p-5 rounded-2xl border transition-all ${
          data.summary.roKritisCount > 0 
            ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 shadow-md' 
            : isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">RO Kritis (Zero Progress)</span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {data.summary.roKritisCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">RO Bermasalah</span>
          </div>
          <p className="mt-2 text-[11px] text-rose-700 dark:text-rose-300/80 leading-snug">
            {data.summary.roKritisCount > 0 
              ? '🚨 TPCRO=0 & PCRO=0 atau serapan tinggi tapi fisik 0%!' 
              : '✅ Tidak terdeteksi kondisi zero progress kritis.'}
          </p>
        </div>

        {/* Card 3: RO Peringatan / Deviasi */}
        <div className={`p-5 rounded-2xl border transition-all ${
          data.summary.roPeringatanCount > 0 
            ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 shadow-md' 
            : isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">RO Peringatan / Deviasi</span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {data.summary.roPeringatanCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">RO Deviasi &gt;20%</span>
          </div>
          <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300/80 leading-snug">
            Perlu pengisian narasi Keterangan SAKTI &amp; akselerasi fisik.
          </p>
        </div>

        {/* Card 4: RO Optimal */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-800/90 border-slate-700/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">RO Optimal</span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {data.summary.roOptimalCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">dari {data.summary.totalRo} Total RO</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Rata-rata PCRO:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{data.summary.avgPCRO}% (Target: {data.summary.avgTPCRO}%)</span>
          </div>
        </div>
      </div>

      {/* SPECIAL WARNING HIGHLIGHT FOR TPCRO=0 & PCRO=0 */}
      {data.summary.roKritisCount > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-2 border-rose-500/40 dark:border-rose-500/60 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md shrink-0">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                ⚠️ Perhatian Khusus SAKTI: Terdeteksi {data.summary.roKritisCount} RO Kritis Tanpa Progres!
              </h4>
              <p className="text-xs text-rose-800/90 dark:text-rose-300/90 mt-1 max-w-4xl leading-relaxed">
                Kondisi <strong>TPCRO = 0</strong> dan <strong>PCRO = 0</strong> membuat sistem SAKTI tidak akan membentuk progres (nilai komponen menjadi 0). Untuk RO yang belum ada realisasi, pastikan mengisi <strong>PCRO minimal 0,01</strong> pada periode berjalan agar sistem tetap menghitung progres IKPA.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => {
                setFilterSeverity('KRITIS');
                setActiveSubTab('DIAGNOSTIK');
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold whitespace-nowrap shadow-md cursor-pointer transition-all"
            >
              Lihat {data.summary.roKritisCount} RO Kritis &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: DIAGNOSTIK RO (MAIN VIEW) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'DIAGNOSTIK' && (
        <div className="space-y-4">
          {/* FILTER & SEARCH CONTROLS */}
          <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 ${
            isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              {/* Satker Filter Dropdown if multi-satker */}
              {uniqueSatkers.length > 1 && (
                <div className="min-w-[200px]">
                  <select
                    value={selectedSatker}
                    onChange={(e) => {
                      setSelectedSatker(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-semibold outline-none cursor-pointer ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-white' 
                        : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="ALL">🏢 Semua Satker ({uniqueSatkers.length} Satker)</option>
                    {uniqueSatkers.map(s => (
                      <option key={s.kode} value={s.kode}>
                        {s.kode} - {s.nama} ({s.count} RO)
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
            </div>

            {/* Filter Buttons & Bulk Copy */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => { setFilterSeverity('ALL'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterSeverity === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({data.items.length})
              </button>

              <button
                onClick={() => { setFilterSeverity('KRITIS'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  filterSeverity === 'KRITIS'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : isDark ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <span>🚨 Kritis ({data.summary.roKritisCount})</span>
              </button>

              <button
                onClick={() => { setFilterSeverity('PERINGATAN'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  filterSeverity === 'PERINGATAN'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : isDark ? 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/60' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>⚠️ Peringatan ({data.summary.roPeringatanCount})</span>
              </button>

              <button
                onClick={() => { setFilterSeverity('OPTIMAL'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  filterSeverity === 'OPTIMAL'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isDark ? 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span>✅ Optimal ({data.summary.roOptimalCount})</span>
              </button>

              <button
                onClick={handleBulkCopyTemplates}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-cyan-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all cursor-pointer"
                title="Salin semua narasi SAKTI untuk RO yang perlu perbaikan"
              >
                {bulkCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{bulkCopied ? 'Semua Tersalin!' : 'Salin Semua Keterangan SAKTI'}</span>
              </button>
            </div>
          </div>

          {/* LIST OF DIAGNOSED RO ITEMS */}
          {paginatedItems.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Tidak Ada Data RO Sesuai Filter</h3>
              <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau ubah filter status.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedItems.map((ro) => {
                const isKritis = ro.diagnosaSeverity === 'KRITIS';
                const isPeringatan = ro.diagnosaSeverity === 'PERINGATAN';
                const isOptimal = ro.diagnosaSeverity === 'OPTIMAL';

                return (
                  <div
                    key={ro.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isKritis 
                        ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/20 dark:bg-rose-950/20 shadow-md' 
                        : isPeringatan 
                          ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/20 shadow-sm' 
                          : isDark 
                            ? 'bg-slate-800/90 border-slate-700' 
                            : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    {/* Top Header Card */}
                    <div className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
                      isKritis 
                        ? 'bg-rose-100/70 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900' 
                        : isPeringatan 
                          ? 'bg-amber-100/70 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900' 
                          : isDark 
                            ? 'bg-slate-800 border-slate-700' 
                            : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                          isKritis 
                            ? 'bg-rose-600 text-white' 
                            : isPeringatan 
                              ? 'bg-amber-600 text-white' 
                              : 'bg-emerald-600 text-white'
                        }`}>
                          {isKritis && <ShieldAlert className="w-3 h-3" />}
                          {isPeringatan && <AlertTriangle className="w-3 h-3" />}
                          {isOptimal && <CheckCircle2 className="w-3 h-3" />}
                          <span>{ro.diagnosaSeverity}</span>
                        </span>

                        <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                          {ro.kodeRo}
                        </span>

                        {ro.kodeSatker && (
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            {ro.kodeSatker} - {ro.namaSatker}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Nilai Komponen RO</span>
                          <span className={`text-xs font-black font-mono ${
                            ro.nilaiKomponenRo >= 90 ? 'text-emerald-600 dark:text-emerald-400' : ro.nilaiKomponenRo > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {ro.nilaiKomponenRo.toFixed(2)} / 100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-5 space-y-4">
                      {/* Title & Hierarchy */}
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                          {ro.namaRo}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {ro.namaProgram ? `${ro.namaProgram} • ` : ''}{ro.namaKegiatan || ro.kodeKegiatan || ''}
                        </p>
                      </div>

                      {/* Performance Metrics Bar with Excel Column Mapping */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
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
                            ro.realisasiProgres >= ro.targetProgres && ro.targetProgres > 0 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : ro.realisasiProgres > 0 
                                ? 'text-amber-600 dark:text-amber-400' 
                                : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {ro.realisasiProgres.toFixed(2)}%
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            <span className="font-mono font-semibold text-indigo-600 dark:text-cyan-400">Kolom P:</span> {ro.volumeRealisasi} vol
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Deviasi / Gap (Q - Y)</span>
                          <span className={`font-mono font-extrabold text-sm ${
                            ro.gapKinerja > 20 ? 'text-rose-600 dark:text-rose-400' : ro.gapKinerja > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {ro.gapKinerja > 0 ? `-${ro.gapKinerja.toFixed(2)}%` : '+0.00%'}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">Selisih Target-Realisasi</span>
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

                      {/* Diagnostic Box */}
                      <div className={`p-4 rounded-xl border space-y-2 ${
                        isKritis 
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200' 
                          : isPeringatan 
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200' 
                            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                      }`}>
                        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                          <Cpu className="w-4 h-4 shrink-0" />
                          <span>{ro.diagnosaTitle}</span>
                        </div>
                        <p className="text-xs leading-relaxed opacity-90 pl-6">
                          {ro.diagnosaDescription}
                        </p>
                      </div>

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

                      {/* Template SAKTI Ready-to-Copy */}
                      {ro.templateKeteranganSakti && (
                        <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Template Keterangan SAKTI (Siap Salin):</span>
                            </span>

                            <button
                              onClick={() => handleCopyTemplate(ro.id, ro.templateKeteranganSakti)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                copiedId === ro.id
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              }`}
                            >
                              {copiedId === ro.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Tersalin ke Clipboard!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin Template SAKTI</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className={`p-3 rounded-xl font-mono text-xs leading-relaxed border select-all ${
                            isDark 
                              ? 'bg-slate-900/90 border-slate-700 text-slate-300' 
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            "{ro.templateKeteranganSakti}"
                          </div>
                        </div>
                      )}
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
      {/* TAB 2: REKAP SATKER & PERINGKAT */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'REKAP_SATKER' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-500" />
                  <span>Rekapitulasi Kinerja Capaian Output per Satker</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Matriks ringkasan seluruh satuan kerja yang ada di file Excel: jumlah RO kritis, deviasi, dan estimasi skor IKPA Caput.
                </p>
              </div>

              <button
                onClick={handleExportExcel}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all self-start sm:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Rekap Excel</span>
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className={`border-b ${isDark ? 'bg-slate-900/60 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <th className="py-3 px-3 font-bold">No</th>
                    <th className="py-3 px-3 font-bold">Satker</th>
                    <th className="py-3 px-3 font-bold text-center">Total RO</th>
                    <th className="py-3 px-3 font-bold text-center text-rose-600">RO Kritis</th>
                    <th className="py-3 px-3 font-bold text-center text-amber-600">Deviasi &gt;20%</th>
                    <th className="py-3 px-3 font-bold text-center text-emerald-600">RO Optimal</th>
                    <th className="py-3 px-3 font-bold text-right">Rata2 PCRO</th>
                    <th className="py-3 px-3 font-bold text-right">Skor Caput</th>
                    <th className="py-3 px-3 font-bold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 font-sans">
                  {(data.satkerBreakdown || []).map((s, idx) => (
                    <tr key={s.kodeSatker} className={`hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors ${
                      selectedSatker === s.kodeSatker ? 'bg-indigo-50/70 dark:bg-indigo-950/50 font-semibold' : ''
                    }`}>
                      <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{s.namaSatker}</div>
                        <div className="font-mono text-[11px] text-slate-500">Kode: {s.kodeSatker}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">{s.totalRo}</td>
                      <td className="py-3 px-3 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded-full ${s.roKritisCount > 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'text-slate-400'}`}>
                          {s.roKritisCount}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded-full ${s.roPeringatanCount > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'text-slate-400'}`}>
                          {s.roPeringatanCount}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600">{s.roOptimalCount}</td>
                      <td className="py-3 px-3 text-right font-mono">{s.avgPCRO}%</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-mono font-black text-sm ${
                          s.currentScoreCaput >= 90 ? 'text-emerald-600 dark:text-emerald-400' : s.currentScoreCaput >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {s.currentScoreCaput}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedSatker(s.kodeSatker);
                            setActiveSubTab('DIAGNOSTIK');
                            setCurrentPage(1);
                          }}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-sm cursor-pointer transition-all"
                        >
                          Diagnosa RO &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: KALKULATOR & SIMULATOR IKPA */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'SIMULATOR' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-500" />
                  <span>Kalkulator &amp; Live Simulator Kenaikan Nilai IKPA Caput</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                  Uji coba perbaikan nilai PCRO secara langsung untuk melihat proyeksi kenaikan skor Capaian Output Satker sebelum diinput ke Modul Komitmen SAKTI.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleAutoFixCritical}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Perbaiki Semua TPCRO=0 (0,01)</span>
                </button>

                <button
                  onClick={handleAutoFulfillAll}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simulasi Penuhi Target (100)</span>
                </button>

                {simulatorSummary.itemsModified > 0 && (
                  <button
                    onClick={handleResetSimulator}
                    className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    Reset Simulasi
                  </button>
                )}
              </div>
            </div>

            {/* Score Simulation Matrix */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Nilai Caput Saat Ini</span>
                <span className="text-4xl font-black text-rose-600 dark:text-rose-400 mt-2 block">
                  {simulatorSummary.currentScore}
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  Skor riil dari data Excel
                </span>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-center shadow-lg shadow-indigo-900/30 flex flex-col justify-center items-center">
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider block">Potensi Lonjakan Nilai</span>
                <span className="text-4xl font-black text-cyan-300 mt-2 block">
                  {simulatorSummary.delta >= 0 ? `+${simulatorSummary.delta}` : simulatorSummary.delta}
                </span>
                <span className="text-xs text-indigo-100 mt-1 block">
                  {simulatorSummary.itemsModified} RO Telah Disimulasikan
                </span>
              </div>

              <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Hasil Skor Simulasi</span>
                <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mt-2 block">
                  {simulatorSummary.simScore}
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 block">
                  Kategori: {simulatorSummary.simScore >= 95 ? 'Sangat Baik (SANGAT OPTIMAL)' : simulatorSummary.simScore >= 80 ? 'Baik' : 'Kurang'}
                </span>
              </div>
            </div>

            {/* Interactive RO Slider Table */}
            <div className="mt-8 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Daftar Rincian Output untuk Simulasi Nilai:
              </h4>

              <div className="space-y-3">
                {data.items.slice(0, 15).map(ro => {
                  const currPcro = simulatedPcroMap[ro.id] !== undefined ? simulatedPcroMap[ro.id] : ro.realisasiProgres;
                  let simNkro = 0;
                  if (ro.targetProgres === 0 && currPcro === 0) {
                    simNkro = 0;
                  } else if (ro.targetProgres === 0 && currPcro > 0) {
                    simNkro = 100;
                  } else {
                    simNkro = Math.min(100, (currPcro / ro.targetProgres) * 100);
                  }

                  return (
                    <div key={ro.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-indigo-600 dark:text-cyan-400">{ro.kodeRo}</span>
                          <span className={`px-2 py-0.2 text-[10px] font-bold rounded-full ${
                            ro.diagnosaSeverity === 'KRITIS' ? 'bg-rose-100 text-rose-700' : ro.diagnosaSeverity === 'PERINGATAN' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {ro.diagnosaSeverity}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{ro.namaRo}</p>
                        <p className="text-[11px] text-slate-500">
                          Target (TPCRO): {ro.targetProgres}% | Realisasi Awal: {ro.realisasiProgres}%
                        </p>
                      </div>

                      {/* Slider Control */}
                      <div className="flex items-center gap-4 min-w-[280px]">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-semibold">Simulasi PCRO:</span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-cyan-400">{currPcro.toFixed(2)}%</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max="100"
                            step="0.01"
                            value={currPcro}
                            onChange={(e) => {
                              setSimulatedPcroMap({
                                ...simulatedPcroMap,
                                [ro.id]: parseFloat(e.target.value) || 0
                              });
                            }}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </div>

                        <div className="text-right min-w-[70px]">
                          <span className="text-[10px] text-slate-400 block">Nilai RO</span>
                          <span className={`font-mono font-black text-sm ${simNkro >= 100 ? 'text-emerald-600' : simNkro > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {simNkro.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: PANDUAN PENGAMBILAN DATA MYINTRESS (6 LANGKAH) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'PANDUAN' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-500" />
              <span>Panduan Mengunduh File Excel dari MyIntress (6 Langkah)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ikuti langkah sederhana berikut untuk mengekspor data capaian output satuan kerja dari MyIntress untuk dianalisis di SI-CAPUT.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Buka Menu MyIntress</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Login ke aplikasi <strong>MyIntress</strong> &rarr; pilih menu <strong>Tematik</strong> &rarr; klik <strong>Indikator Pelaksanaan Anggaran (IKPA)</strong>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  2
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Pilih Periode &amp; Kirim</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pilih periode/bulan pelaporan yang akan dievaluasi (misal: <em>Agustus 2026</em>), kemudian klik tombol <strong>KIRIM</strong>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Klik Nilai Capaian Output</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pada tabel indikator IKPA, klik angka/nilai pada kolom <strong>Capaian Output</strong> untuk membuka rincian bulanan.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  4
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Klik Detail Bulan Terakhir</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pada popup riwayat bulanan, klik tautan/tombol <strong>Detail</strong> pada baris bulan pelaporan berjalan.
                </p>
              </div>

              {/* Step 5 */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  5
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Unduh Tombol XLSX</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Unduh data rincian RO menggunakan tombol <strong>XLSX</strong> di pojok kanan atas tabel MyIntress.
                </p>
              </div>

              {/* Step 6 */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  6
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Unggah &amp; Lihat Analisis</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Kembali ke aplikasi SI-CAPUT ini, klik <strong>Unggah &amp; Analisis Excel</strong>. Sistem akan langsung membersihkan dan memproses seluruh diagnosa RO!
                </p>
              </div>
            </div>

            {/* SAKTI Roles Note */}
            <div className="mt-6 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
              <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Siapa yang bertugas mengisi &amp; menyetujui di SAKTI?</strong>
                <p className="mt-1 leading-relaxed">
                  Pengisian realisasi capaian output (PCRO dan Keterangan) dilakukan oleh <strong>Operator Komitmen</strong> atau <strong>Pejabat Pembuat Komitmen (PPK)</strong> pada Modul Komitmen Aplikasi SAKTI. Pastikan PPK melakukan <strong>Approval</strong> sebelum tanggal 7 agar data sah terkirim ke sistem perbendaharaan.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
