import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Filter, 
  Search, 
  Sparkles, 
  Printer, 
  Eye, 
  Layers, 
  BookOpen, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle, 
  PieChart as PieIcon, 
  BarChart3, 
  Building2, 
  Calendar, 
  UserCheck, 
  FileText, 
  ExternalLink, 
  Palette, 
  RefreshCw, 
  ChevronRight, 
  Award, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight, 
  Info,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { 
  RealisasiBelanjaRecord, 
  RealisasiBelanjaSummary, 
  BuletinConfig, 
  SatkerIKPA, 
  AppTheme,
  DashboardConfig 
} from '../../types';
import { 
  processRealisasiBelanjaExcel, 
  computeRealisasiBelanjaSummary, 
  formatRupiahShort, 
  formatRupiahFull, 
  generateCanvaBulkCreateCSV, 
  exportRealisasiBelanjaToExcel,
  getJenisBelanjaInfo 
} from '../../utils/realisasiBelanjaProcessor';
import { safeLocalStorageSet, safeLocalStorageGet } from '../../utils/safeStorage';
import { useToast } from '../ToastNotification';
import { db, doc, setDoc, onSnapshot } from '../../lib/firebase';
import { INITIAL_REALISASI_BELANJA } from '../../data/initialRealisasiBelanja';

import { BuletinMagazineLayout } from './BuletinMagazineLayout';
import { BuletinDataStudioEditor } from './BuletinDataStudioEditor';
import { generateCompletePrintReadyBuletinConfig } from '../../utils/buletinTreasuryEngine';

interface BuletinWartaSectionProps {
  theme?: AppTheme;
  isDark?: boolean;
  satkers?: SatkerIKPA[];
  dashboardConfig?: DashboardConfig;
  onUpdateDashboardConfig?: (newConfig: DashboardConfig) => void;
  isAdminAuthenticated?: boolean;
}

const STORAGE_KEY_REALISASI = 'kppn_realisasi_belanja_records';
const STORAGE_KEY_BULETIN_CFG = 'kppn_buletin_config';

const DEFAULT_BULETIN_CONFIG: BuletinConfig = generateCompletePrintReadyBuletinConfig();

export const BuletinWartaSection: React.FC<BuletinWartaSectionProps> = ({
  theme = 'light',
  isDark = false,
  satkers = [],
  dashboardConfig,
  isAdminAuthenticated = false
}) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sub-tabs in Buletin section
  const [activeSubTab, setActiveSubTab] = useState<'analisis' | 'desain-buletin' | 'canva-ekspor'>('analisis');

  // Realisasi Belanja Data state
  const [records, setRecords] = useState<RealisasiBelanjaRecord[]>(() => {
    try {
      const raw = safeLocalStorageGet(STORAGE_KEY_REALISASI);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error loading cached realisasi belanja:', e);
    }
    return INITIAL_REALISASI_BELANJA || [];
  });

  const [activeFileName, setActiveFileName] = useState<string>('Data Realisasi Belanja OM-SPAN');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Filter States
  const [searchSatker, setSearchSatker] = useState<string>('');
  const [filterJenisBelanja, setFilterJenisBelanja] = useState<string>('ALL');
  const [filterKementerian, setFilterKementerian] = useState<string>('ALL');
  const [filterKewenangan, setFilterKewenangan] = useState<string>('ALL');
  const [filterRealisasiLevel, setFilterRealisasiLevel] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Buletin Config state
  const [buletinConfig, setBuletinConfig] = useState<BuletinConfig>(() => {
    try {
      const raw = safeLocalStorageGet(STORAGE_KEY_BULETIN_CFG);
      if (raw) return { ...DEFAULT_BULETIN_CONFIG, ...JSON.parse(raw) };
    } catch (e) {
      console.warn('Error loading cached buletin config:', e);
    }
    return DEFAULT_BULETIN_CONFIG;
  });

  // Real-time synchronization for Buletin Configuration across devices
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'buletin_config'), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && typeof data === 'object') {
            setBuletinConfig(prev => ({
              ...prev,
              ...data
            }));
            safeLocalStorageSet(STORAGE_KEY_BULETIN_CFG, JSON.stringify(data));
          }
        }
      }, (err) => {
        console.warn('Notice listening to remote buletin config:', err);
      });
      return () => unsub();
    } catch {
      // Ignore
    }
  }, []);

  // Calculate Overall Summary
  const overallSummary = useMemo(() => {
    if (records.length === 0) return null;
    return computeRealisasiBelanjaSummary(records);
  }, [records]);

  // Unique K/L and Kewenangan for filter dropdowns
  const uniqueKementerians = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach(r => {
      if (r.kementerianKode && r.kementerianUraian) {
        map.set(r.kementerianKode, `${r.kementerianKode} - ${r.kementerianUraian}`);
      }
    });
    return Array.from(map.entries()).map(([kode, label]) => ({ kode, label }));
  }, [records]);

  const uniqueKewenangans = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.kewenanganUraian) set.add(r.kewenanganUraian);
    });
    return Array.from(set);
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Search
      if (searchSatker) {
        const q = searchSatker.toLowerCase();
        const matchKode = r.satkerKode.toLowerCase().includes(q);
        const matchNama = r.satkerUraian.toLowerCase().includes(q);
        const matchAkun = r.akunKode.toLowerCase().includes(q) || r.akunUraian.toLowerCase().includes(q);
        if (!matchKode && !matchNama && !matchAkun) return false;
      }

      // Filter Jenis Belanja
      if (filterJenisBelanja !== 'ALL' && r.jenisBelanjaKode !== filterJenisBelanja) {
        return false;
      }

      // Filter K/L
      if (filterKementerian !== 'ALL' && r.kementerianKode !== filterKementerian) {
        return false;
      }

      // Filter Kewenangan
      if (filterKewenangan !== 'ALL' && r.kewenanganUraian !== filterKewenangan) {
        return false;
      }

      // Filter Realisasi Level
      if (filterRealisasiLevel === 'UNDER_50' && r.persenRealisasi >= 50) return false;
      if (filterRealisasiLevel === '50_TO_80' && (r.persenRealisasi < 50 || r.persenRealisasi > 80)) return false;
      if (filterRealisasiLevel === 'OVER_80' && r.persenRealisasi < 80) return false;
      if (filterRealisasiLevel === 'HUNDRED' && r.persenRealisasi < 99.99) return false;

      return true;
    });
  }, [records, searchSatker, filterJenisBelanja, filterKementerian, filterKewenangan, filterRealisasiLevel]);

  // Filtered Summary
  const filteredSummary = useMemo(() => {
    if (filteredRecords.length === 0) return null;
    return computeRealisasiBelanjaSummary(filteredRecords);
  }, [filteredRecords]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  // Handle Excel Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsProcessing(true);

    try {
      const result = await processRealisasiBelanjaExcel(file);
      setRecords(result.records);
      setActiveFileName(result.fileName);
      setCurrentPage(1);

      // Save a compact snapshot (cap at 1000 items in localStorage to stay lightweight)
      safeLocalStorageSet(STORAGE_KEY_REALISASI, JSON.stringify(result.records.slice(0, 1000)));

      addToast({
        title: 'Upload Realisasi Belanja Berhasil',
        message: `Berhasil memproses ${result.totalRows.toLocaleString('id-ID')} baris data realisasi dari ${file.name}.`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error processing realisasi belanja Excel:', err);
      addToast({
        title: 'Gagal Memproses Excel',
        message: err?.message || 'Pastikan file Excel berformat OM-SPAN / SAKTI Inquiry Data yang valid.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save Buletin Config
  const handleSaveBuletinConfig = async () => {
    const updated = {
      ...buletinConfig,
      updatedAt: new Date().toISOString()
    };
    setBuletinConfig(updated);
    safeLocalStorageSet(STORAGE_KEY_BULETIN_CFG, JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'settings', 'buletin_config'), updated, { merge: true });
    } catch (err) {
      console.warn('Notice saving buletin config:', err);
    }

    addToast({
      title: 'Pengaturan Buletin Disimpan',
      message: 'Format edisi, judul, dan layout buletin berhasil diperbarui.',
      type: 'success'
    });
  };

  // Download Canva Bulk Create CSV
  const handleDownloadCanvaCSV = () => {
    const csvContent = generateCanvaBulkCreateCSV(
      overallSummary || filteredSummary,
      buletinConfig,
      satkers,
      dashboardConfig?.juknisList || []
    );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Canva_BulkCreate_Buletin_${buletinConfig.bulanTahun.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      title: 'Dataset Canva Berhasil Diunduh',
      message: 'File CSV siap dihubungkan ke fitur Canva "Bulk Create" (Buat Banyak).',
      type: 'success'
    });
  };

  // Print / Save PDF of the Buletin
  const handlePrintBuletin = () => {
    window.print();
  };

  // Theme color styles for Buletin preview
  const themeStyles = useMemo(() => {
    switch (buletinConfig.temaWarna) {
      case 'emerald':
        return {
          primaryBg: 'bg-emerald-900 text-white',
          headerBg: 'from-emerald-950 via-emerald-900 to-teal-900',
          accentBorder: 'border-emerald-500',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          subHeaderBg: 'bg-emerald-50 text-emerald-950',
          cardBorder: 'border-emerald-200',
          accentText: 'text-emerald-700'
        };
      case 'indigo':
        return {
          primaryBg: 'bg-indigo-900 text-white',
          headerBg: 'from-indigo-950 via-indigo-900 to-purple-900',
          accentBorder: 'border-indigo-500',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          subHeaderBg: 'bg-indigo-50 text-indigo-950',
          cardBorder: 'border-indigo-200',
          accentText: 'text-indigo-700'
        };
      case 'burgundy':
        return {
          primaryBg: 'bg-rose-950 text-white',
          headerBg: 'from-rose-950 via-rose-900 to-red-950',
          accentBorder: 'border-rose-500',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          subHeaderBg: 'bg-rose-50 text-rose-950',
          cardBorder: 'border-rose-200',
          accentText: 'text-rose-700'
        };
      case 'gold':
        return {
          primaryBg: 'bg-amber-950 text-white',
          headerBg: 'from-amber-950 via-yellow-950 to-slate-950',
          accentBorder: 'border-amber-400',
          badgeBg: 'bg-amber-400/25 text-amber-300 border-amber-400/50',
          subHeaderBg: 'bg-amber-50 text-amber-950',
          cardBorder: 'border-amber-200',
          accentText: 'text-amber-700'
        };
      default: // navy
        return {
          primaryBg: 'bg-slate-900 text-white',
          headerBg: 'from-slate-950 via-blue-950 to-indigo-950',
          accentBorder: 'border-amber-400',
          badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
          subHeaderBg: 'bg-blue-50 text-slate-900',
          cardBorder: 'border-blue-200',
          accentText: 'text-blue-700'
        };
    }
  }, [buletinConfig.temaWarna]);

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Main Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 text-white shadow-xl border border-blue-900/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                Modul Eksklusif Admin
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                OM-SPAN / SAKTI Realisasi Belanja
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30">
                🎨 Format Canva Ready
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>📰 17. Buletin & Warta KPPN</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pusat pengolahan data Excel realisasi belanja APBN, analisis filter multidimensi, serta generator otomatis Buletin Perbendaharaan resmi dengan format majalah A4 yang terintegrasi langsung dengan <strong>Canva Bulk Create</strong> dan ekspor cetak PDF.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isProcessing ? 'Memproses...' : 'Upload Excel Realisasi'}</span>
            </button>

            <button
              onClick={handleDownloadCanvaCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Canva Dataset</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab('analisis')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'analisis'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/40'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>1. Analisis & Filter Realisasi Belanja</span>
            {records.length > 0 && (
              <span className="bg-blue-400/30 text-blue-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {records.length} Baris
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('desain-buletin')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'desain-buletin'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-purple-400/40'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Studio Desain & Preview Buletin A4</span>
            <span className="bg-amber-400 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black">
              PRINT READY
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('canva-ekspor')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'canva-ekspor'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30 ring-2 ring-pink-400/40'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>3. Integrasi & Panduan Canva (Bulk Create)</span>
            <span className="bg-pink-400/30 text-pink-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Canva CSV
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: ANALISIS & FILTER REALISASI BELANJA EXCEL                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'analisis' && (
        <div className="space-y-6">
          {/* Active File Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeFileName}
                  </h4>
                  {records.length > 0 && (
                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      Aktif ({records.length} baris data)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {records.length > 0 
                    ? `Terdeteksi ${overallSummary?.totalSatkerCount || 0} Satker dari ${overallSummary?.breakdownKementerian.length || 0} Kementerian/Lembaga`
                    : 'Belum ada data realisasi belanja. Silakan upload file Excel OM-SPAN / SAKTI.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {records.length > 0 && (
                <button
                  onClick={() => exportRealisasiBelanjaToExcel(filteredRecords)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download Excel Filtered</span>
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Ganti File Excel</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          {overallSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Pagu DIPA</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-xs">
                    Rp
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {formatRupiahShort(overallSummary.totalPagu)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {formatRupiahFull(overallSummary.totalPagu)}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Total Realisasi Belanja</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {overallSummary.persenRealisasiTotal.toFixed(2)}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                    {formatRupiahShort(overallSummary.totalRealisasi)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {formatRupiahFull(overallSummary.totalRealisasi)}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-amber-200/80 dark:border-amber-900/50 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Sisa Pagu Anggaran</span>
                  <span className="text-xs font-bold text-slate-400">
                    {(100 - overallSummary.persenRealisasiTotal).toFixed(2)}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xl font-black text-amber-700 dark:text-amber-400">
                    {formatRupiahShort(overallSummary.totalSisa)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {formatRupiahFull(overallSummary.totalSisa)}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Jumlah Satuan Kerja</span>
                  <Building2 className="w-4 h-4 text-purple-600" />
                </div>
                <div className="mt-2">
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {overallSummary.totalSatkerCount} Satker
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {overallSummary.breakdownKementerian.length} Kementerian / Lembaga
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Breakdown per Jenis Belanja (51, 52, 53, 57) */}
          {overallSummary && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-blue-600" />
                  <span>Realisasi per Jenis Belanja APBN (Akun 51, 52, 53, 57)</span>
                </h3>
                <span className="text-xs text-slate-500">
                  Target Triwulan Berjalan: Disarankan ≥ 50%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {overallSummary.breakdownJenisBelanja.map(item => (
                  <div 
                    key={item.kode}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.nama}
                      </span>
                      <span 
                        className="text-xs font-black px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: `${item.color}20`, color: item.color }}
                      >
                        {item.persen.toFixed(2)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, item.persen)}%`, backgroundColor: item.color }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span>Real: {formatRupiahShort(item.realisasi)}</span>
                      <span>Pagu: {formatRupiahShort(item.pagu)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multidimensional Filter Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>Filter Realisasi Belanja &amp; Eksplorasi Data</span>
              </h3>
              <span className="text-xs text-slate-500">
                Menampilkan <strong>{filteredRecords.length.toLocaleString('id-ID')}</strong> dari {records.length.toLocaleString('id-ID')} baris
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search Satker */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Pencarian Satker / Akun</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ketik nama/kode satker..."
                    value={searchSatker}
                    onChange={(e) => { setSearchSatker(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-8.5 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Jenis Belanja */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Jenis Belanja</label>
                <select
                  value={filterJenisBelanja}
                  onChange={(e) => { setFilterJenisBelanja(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="ALL">Semua Jenis Belanja</option>
                  <option value="51">51 - Belanja Pegawai</option>
                  <option value="52">52 - Belanja Barang</option>
                  <option value="53">53 - Belanja Modal</option>
                  <option value="57">57 - Belanja Bansos</option>
                </select>
              </div>

              {/* Kementerian / Lembaga */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Kementerian / Lembaga</label>
                <select
                  value={filterKementerian}
                  onChange={(e) => { setFilterKementerian(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white truncate"
                >
                  <option value="ALL">Semua Kementerian / Lembaga</option>
                  {uniqueKementerians.map(k => (
                    <option key={k.kode} value={k.kode}>{k.label}</option>
                  ))}
                </select>
              </div>

              {/* Kewenangan */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Kewenangan</label>
                <select
                  value={filterKewenangan}
                  onChange={(e) => { setFilterKewenangan(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="ALL">Semua Kewenangan</option>
                  {uniqueKewenangans.map(kw => (
                    <option key={kw} value={kw}>{kw}</option>
                  ))}
                </select>
              </div>

              {/* Tingkat Realisasi */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Status Penyerapan</label>
                <select
                  value={filterRealisasiLevel}
                  onChange={(e) => { setFilterRealisasiLevel(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="UNDER_50">Rendah (&lt; 50%)</option>
                  <option value="50_TO_80">Sedang (50% - 80%)</option>
                  <option value="OVER_80">Tinggi (&gt; 80%)</option>
                  <option value="HUNDRED">Optimal (100%)</option>
                </select>
              </div>
            </div>

            {/* Clear Filter Button */}
            {(searchSatker || filterJenisBelanja !== 'ALL' || filterKementerian !== 'ALL' || filterKewenangan !== 'ALL' || filterRealisasiLevel !== 'ALL') && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    setSearchSatker('');
                    setFilterJenisBelanja('ALL');
                    setFilterKementerian('ALL');
                    setFilterKewenangan('ALL');
                    setFilterRealisasiLevel('ALL');
                    setCurrentPage(1);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  ↺ Reset Semua Filter
                </button>
              </div>
            )}
          </div>

          {/* Top 5 & Bottom 5 Satker Leaderboard */}
          {overallSummary && overallSummary.topSatkers.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 5 */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Top Satker Realisasi Tertinggi</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Peringkat 1 s.d. 5</span>
                </div>

                <div className="space-y-2">
                  {overallSummary.topSatkers.slice(0, 5).map((s, idx) => (
                    <div key={s.kodeSatker} className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {s.namaSatker}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Kode: {s.kodeSatker} • Real: {formatRupiahShort(s.realisasi)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 shrink-0 ml-2">
                        {s.persen.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom 5 */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-rose-200/80 dark:border-rose-900/50 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Satker Perlu Akselerasi Penyerapan</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Peringkat Terbawah</span>
                </div>

                <div className="space-y-2">
                  {overallSummary.bottomSatkers.slice(0, 5).map((s, idx) => (
                    <div key={s.kodeSatker} className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                          !
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {s.namaSatker}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Kode: {s.kodeSatker} • Sisa: {formatRupiahShort(Math.max(0, s.pagu - s.realisasi))}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-rose-700 dark:text-rose-400 shrink-0 ml-2">
                        {s.persen.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Data Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Rincian Data Realisasi Belanja (Tabel Detail)
              </h3>
              <span className="text-xs text-slate-500">
                Halaman {currentPage} dari {totalPages}
              </span>
            </div>

            {paginatedRecords.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-sm">Tidak ada data yang sesuai dengan filter.</p>
                <p className="text-xs">Coba sesuaikan kata kunci pencarian atau ubah kriteria filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-3">No</th>
                      <th className="py-3 px-3">Satuan Kerja</th>
                      <th className="py-3 px-3">Akun / Jenis Belanja</th>
                      <th className="py-3 px-3">Kementerian / Lembaga</th>
                      <th className="py-3 px-3 text-right">Pagu DIPA (Rp)</th>
                      <th className="py-3 px-3 text-right">Realisasi (Rp)</th>
                      <th className="py-3 px-3 text-center">Capaian (%)</th>
                      <th className="py-3 px-3 text-right">Sisa Pagu (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {paginatedRecords.map((r, idx) => {
                      const rowNum = (currentPage - 1) * itemsPerPage + idx + 1;
                      const jenisInfo = getJenisBelanjaInfo(r.akunKode);

                      return (
                        <tr key={r.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-400">{rowNum}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white truncate max-w-[220px]">
                              {r.satkerUraian}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {r.satkerKode} • {r.kewenanganUraian || 'Kantor Daerah'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span 
                                className="w-2 h-2 rounded-full shrink-0" 
                                style={{ backgroundColor: jenisInfo.color }}
                              />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {r.akunKode}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                              {r.akunUraian}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                              {r.kementerianUraian}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Kode K/L: {r.kementerianKode}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 dark:text-white">
                            {formatRupiahFull(r.paguDipa)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {formatRupiahFull(r.realisasi)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-black ${
                              r.persenRealisasi >= 80
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : r.persenRealisasi >= 50
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {r.persenRealisasi.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                            {formatRupiahFull(r.sisaPagu)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  ← Sebelumnya
                </button>
                <div className="flex items-center gap-1 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-slate-500">{totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  Berikutnya →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: STUDIO DESAIN & PREVIEW BULETIN A4 (PRINT READY)              */}
      {/* ========================================================================= */}
      {activeSubTab === 'desain-buletin' && (
        <div className="space-y-8">
          {/* Complete Buletin Data Studio Editor */}
          <BuletinDataStudioEditor
            buletinConfig={buletinConfig}
            onUpdateBuletinConfig={(newConfig) => {
              setBuletinConfig(newConfig);
              safeLocalStorageSet(STORAGE_KEY_BULETIN_CFG, JSON.stringify(newConfig));
            }}
            overallSummary={overallSummary}
            satkers={satkers}
          />

          {/* ============================================================ */}
          {/* LIVE A4 BULETIN PREVIEW (MAGAZINE LAYOUT)                   */}
          {/* ============================================================ */}
          <div id="buletin-live-preview-section" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Pratinjau Visual Majalah &amp; Warta Resmi KPPN Semarang I (20 Halaman Standar A4)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Otomatis sinkron dengan hasil isian Data Studio, unggahan foto, dan rekapitulasi data riil APBN.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSaveBuletinConfig}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan ke Cloud</span>
                </button>
                <button
                  onClick={handlePrintBuletin}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Ekspor PDF A4</span>
                </button>
              </div>
            </div>

            {/* Render Modern Magazine Layout */}
            <BuletinMagazineLayout
              buletinConfig={buletinConfig}
              overallSummary={overallSummary}
              satkers={satkers}
              themeStyles={themeStyles}
              onUpdateBuletinConfig={(newConfig) => {
                setBuletinConfig(newConfig);
                safeLocalStorageSet(STORAGE_KEY_BULETIN_CFG, JSON.stringify(newConfig));
              }}
              onEditField={(fieldKey) => {
                const editorElement = document.getElementById('buletin-data-studio-editor');
                if (editorElement) {
                  editorElement.scrollIntoView({ behavior: 'smooth' });
                }
                addToast(`Silakan perbarui data untuk "${fieldKey}" di panel editor di atas.`, 'info');
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: INTEGRASI & PANDUAN CANVA (BULK CREATE & TEMPLATE)            */}
      {/* ========================================================================= */}
      {activeSubTab === 'canva-ekspor' && (
        <div className="space-y-6">
          {/* Main Canva Info Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-pink-950 via-purple-950 to-indigo-950 text-white border border-pink-500/30 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                C
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Integrasi Otomatis Canva: Bulk Create &amp; A4 Newsletter
                </h3>
                <p className="text-xs text-pink-200">
                  Cara termudah mendesain buletin di Canva tanpa perlu mengetik ulang angka dan nama satker satu per satu!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-2">
                <span className="text-xs font-black text-pink-300 uppercase">Langkah 1: Download CSV</span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Klik tombol <strong>Download Canva CSV</strong> di bawah. File CSV ini sudah memetakan semua variabel (Total Pagu, Realisasi %, Top Satker, dll.).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-2">
                <span className="text-xs font-black text-purple-300 uppercase">Langkah 2: Buka Canva</span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Buka template buletin/majalah/newsletter A4 di Canva, lalu cari menu <strong>Apps (Aplikasi) &gt; "Bulk Create" (Buat Banyak)</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-2">
                <span className="text-xs font-black text-indigo-300 uppercase">Langkah 3: Hubungkan Data</span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Upload file CSV tadi, lalu klik kanan teks di Canva &gt; pilih <strong>"Connect Data"</strong> (Hubungkan Data). Canva akan otomatis mengisi seluruh halaman!
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10">
              <button
                onClick={handleDownloadCanvaCSV}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-white text-slate-950 hover:bg-slate-100 shadow-lg transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-pink-600" />
                <span>Unduh Dataset Canva CSV Sekarang</span>
              </button>

              <a
                href={buletinConfig.canvaTemplateUrl || 'https://www.canva.com/templates/?query=newsletter+annual+report+a4'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-pink-600 hover:bg-pink-700 text-white shadow-lg transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka Template Newsletter di Canva ↗</span>
              </a>
            </div>
          </div>

          {/* Detailed Guide & Canva Variable Mapping Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>Daftar Variabel Data yang Siap Dihubungkan ke Canva</span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Nama Variabel (Canva Tag)</th>
                    <th className="py-2.5 px-3">Keterangan Isi Data</th>
                    <th className="py-2.5 px-3">Contoh Nilai Terkini</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono text-[11px]">
                  <tr>
                    <td className="py-2 px-3 font-bold text-pink-600">{'{{Edisi_Buletin}}'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-sans">Nomor Edisi &amp; Volume Warta</td>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{buletinConfig.edisi}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-pink-600">{'{{Total_Pagu_Short}}'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-sans">Total Pagu DIPA (Singkat M/T)</td>
                    <td className="py-2 px-3 font-bold text-blue-600">{formatRupiahShort(overallSummary?.totalPagu || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-pink-600">{'{{Total_Realisasi_Short}}'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-sans">Total Realisasi Anggaran (Singkat M/T)</td>
                    <td className="py-2 px-3 font-bold text-emerald-600">{formatRupiahShort(overallSummary?.totalRealisasi || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-pink-600">{'{{Persen_Realisasi_Total}}'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-sans">Persentase Penyerapan Belanja Total</td>
                    <td className="py-2 px-3 font-bold text-emerald-600">{(overallSummary?.persenRealisasiTotal || 0).toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-pink-600">{'{{Top_Satker_1_Nama}}'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-sans">Nama Satker Terbaik Peringkat 1</td>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{overallSummary?.topSatkers[0]?.namaSatker || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-pink-600">{'{{Highlight_Tips_SAKTI_1}}'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-sans">Tips Juknis SAKTI Rubrik Edukasi</td>
                    <td className="py-2 px-3 font-sans text-[10px] text-slate-600 dark:text-slate-300 truncate max-w-[240px]">{buletinConfig.tipsSaktiCustom?.[0] || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
