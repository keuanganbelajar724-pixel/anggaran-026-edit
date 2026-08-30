import React, { useState, useMemo, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  RotateCcw, 
  Trash2, 
  Search, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  PieChart, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUpDown,
  Layers,
  HelpCircle,
  X
} from 'lucide-react';
import { MyIntressRecord, MyIntressSummary, AppTheme } from '../../types';
import { formatRupiahShort, formatRupiahFull } from '../../utils/realisasiBelanjaProcessor';
import { PaginationControl } from '../PaginationControl';
import * as XLSX from 'xlsx';

interface MyIntressAnalysisViewProps {
  theme?: AppTheme;
  isDark?: boolean;
  records?: MyIntressRecord[];
  intressRecords?: MyIntressRecord[];
  summary?: MyIntressSummary | null;
  intressSummary?: MyIntressSummary | null;
  activeFileName?: string;
  waktuUnduh?: string;
  isProcessing?: boolean;
  onUploadExcel: (file: File) => void;
  onResetDefaultData?: () => void;
  onResetDefault?: () => void;
  onClearAllData?: () => void;
  onClearData?: () => void;
  onSyncToBuletin?: () => void;
  onNavigateToReconciliation?: () => void;
  onNavigateToSintesa?: () => void;
}

export const MyIntressAnalysisView: React.FC<MyIntressAnalysisViewProps> = ({
  theme = 'light',
  isDark = false,
  records,
  intressRecords,
  summary,
  intressSummary,
  activeFileName = 'Data Realisasi Belanja My InTress',
  waktuUnduh,
  isProcessing = false,
  onUploadExcel,
  onResetDefaultData,
  onResetDefault,
  onClearAllData,
  onClearData,
  onSyncToBuletin,
  onNavigateToReconciliation,
  onNavigateToSintesa
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Safe records resolution
  const rawRecords = Array.isArray(records) ? records : (Array.isArray(intressRecords) ? intressRecords : []);
  const activeSummary = summary || intressSummary || null;
  const handleReset = onResetDefaultData || onResetDefault || (() => {});
  const handleClear = onClearAllData || onClearData || (() => {});

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterJenisBelanja, setFilterJenisBelanja] = useState<string>('ALL');
  const [filterRealisasiLevel, setFilterRealisasiLevel] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'pagu' | 'realisasi' | 'persen' | 'nama'>('pagu');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Selected Satker for modal
  const [selectedSatker, setSelectedSatker] = useState<MyIntressRecord | null>(null);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return rawRecords.filter(r => {
      if (!r) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchKode = (r.kodeSatker || '').toLowerCase().includes(q);
        const matchNama = (r.namaSatker || '').toLowerCase().includes(q);
        if (!matchKode && !matchNama) return false;
      }

      if (filterJenisBelanja === '51' && (r.paguPegawai || 0) <= 0 && (r.realPegawai || 0) <= 0) return false;
      if (filterJenisBelanja === '52' && (r.paguBarang || 0) <= 0 && (r.realBarang || 0) <= 0) return false;
      if (filterJenisBelanja === '53' && (r.paguModal || 0) <= 0 && (r.realModal || 0) <= 0) return false;
      if (filterJenisBelanja === '57' && (r.paguBansos || 0) <= 0 && (r.realBansos || 0) <= 0) return false;
      if (filterJenisBelanja === '61' && (r.paguTransfer || 0) <= 0 && (r.realTransfer || 0) <= 0) return false;

      if (filterRealisasiLevel === 'UNDER_50' && (r.persenTotal || 0) >= 50) return false;
      if (filterRealisasiLevel === '50_TO_80' && ((r.persenTotal || 0) < 50 || (r.persenTotal || 0) > 80)) return false;
      if (filterRealisasiLevel === 'OVER_80' && (r.persenTotal || 0) < 80) return false;
      if (filterRealisasiLevel === 'HUNDRED' && (r.persenTotal || 0) < 99.99) return false;

      return true;
    }).sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === 'pagu') {
        valA = a.paguTotal || 0;
        valB = b.paguTotal || 0;
      } else if (sortBy === 'realisasi') {
        valA = a.realTotal || 0;
        valB = b.realTotal || 0;
      } else if (sortBy === 'persen') {
        valA = a.persenTotal || 0;
        valB = b.persenTotal || 0;
      } else if (sortBy === 'nama') {
        return sortOrder === 'asc' ? (a.namaSatker || '').localeCompare(b.namaSatker || '') : (b.namaSatker || '').localeCompare(a.namaSatker || '');
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [rawRecords, searchQuery, filterJenisBelanja, filterRealisasiLevel, sortBy, sortOrder]);

  // Active Summary on filtered records
  const dynamicSummary = useMemo(() => {
    if (filteredRecords.length === 0) return null;
    const totalPagu = filteredRecords.reduce((s, r) => s + r.paguTotal, 0);
    const totalRealisasi = filteredRecords.reduce((s, r) => s + r.realTotal, 0);
    const totalSisa = filteredRecords.reduce((s, r) => s + r.sisaTotal, 0);
    const persenRealisasiTotal = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

    const pagu51 = filteredRecords.reduce((s, r) => s + r.paguPegawai, 0);
    const real51 = filteredRecords.reduce((s, r) => s + r.realPegawai, 0);

    const pagu52 = filteredRecords.reduce((s, r) => s + r.paguBarang, 0);
    const real52 = filteredRecords.reduce((s, r) => s + r.realBarang, 0);

    const pagu53 = filteredRecords.reduce((s, r) => s + r.paguModal, 0);
    const real53 = filteredRecords.reduce((s, r) => s + r.realModal, 0);

    const pagu57 = filteredRecords.reduce((s, r) => s + r.paguBansos, 0);
    const real57 = filteredRecords.reduce((s, r) => s + r.realBansos, 0);

    const pagu61 = filteredRecords.reduce((s, r) => s + r.paguTransfer, 0);
    const real61 = filteredRecords.reduce((s, r) => s + r.realTransfer, 0);

    return {
      totalPagu,
      totalRealisasi,
      totalSisa,
      persenRealisasiTotal,
      satkerCount: filteredRecords.length,
      pagu51, real51, persen51: pagu51 > 0 ? (real51 / pagu51) * 100 : 0,
      pagu52, real52, persen52: pagu52 > 0 ? (real52 / pagu52) * 100 : 0,
      pagu53, real53, persen53: pagu53 > 0 ? (real53 / pagu53) * 100 : 0,
      pagu57, real57, persen57: pagu57 > 0 ? (real57 / pagu57) * 100 : 0,
      pagu61, real61, persen61: pagu61 > 0 ? (real61 / pagu61) * 100 : 0,
    };
  }, [filteredRecords]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const isFilterActive = searchQuery.trim() !== '' || filterJenisBelanja !== 'ALL' || filterRealisasiLevel !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setFilterJenisBelanja('ALL');
    setFilterRealisasiLevel('ALL');
    setCurrentPage(1);
  };

  const handleExportExcel = () => {
    const exportData = filteredRecords.map((r, idx) => ({
      'No': idx + 1,
      'Kode Satker': r.kodeSatker,
      'Nama Satker': r.namaSatker,
      'Pagu Pegawai (51)': r.paguPegawai,
      'Real Pegawai (51)': r.realPegawai,
      '% Pegawai': r.persenPegawai,
      'Pagu Barang (52)': r.paguBarang,
      'Real Barang (52)': r.realBarang,
      '% Barang': r.persenBarang,
      'Pagu Modal (53)': r.paguModal,
      'Real Modal (53)': r.realModal,
      '% Modal': r.persenModal,
      'Pagu Bansos (57)': r.paguBansos,
      'Real Bansos (57)': r.realBansos,
      '% Bansos': r.persenBansos,
      'Pagu Transfer (61)': r.paguTransfer,
      'Real Transfer (61)': r.realTransfer,
      '% Transfer': r.persenTransfer,
      'Pagu Total': r.paguTotal,
      'Real Total': r.realTotal,
      '% Total': r.persenTotal,
      'Sisa Total': r.sisaTotal
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data My InTress');
    XLSX.writeFile(workbook, 'Data_Realisasi_MYINTRESS_KPPN.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* File Upload Banner & Action Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4.5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {activeFileName}
              </h4>
              {rawRecords.length > 0 ? (
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  Aktif ({rawRecords.length} Satker)
                </span>
              ) : (
                <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  Data Kosong
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {rawRecords.length > 0 
                ? `Laporan Realisasi Belanja Satker Per Jenis Belanja (51, 52, 53, 57, Transfer) • ${waktuUnduh ? `Waktu Unduh: ${waktuUnduh}` : 'Sumber: Aplikasi My InTress'}`
                : 'Belum ada data My InTress. Silakan upload file Excel atau pulihkan dataset bawaan.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadExcel(f);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {onNavigateToReconciliation && (
            <button
              onClick={onNavigateToReconciliation}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Cek Selisih Data vs SINTESA</span>
            </button>
          )}

          {onSyncToBuletin && rawRecords.length > 0 && (
            <button
              onClick={onSyncToBuletin}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs transition-all cursor-pointer"
              title="Sinkronkan data My InTress ke konfigurasi Buletin"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sinkronkan ke Buletin</span>
            </button>
          )}

          {rawRecords.length > 0 && (
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Download Excel</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Memproses...' : 'Upload Excel My InTress'}</span>
          </button>

          {rawRecords.length < 127 && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 dark:hover:bg-teal-900/60 transition-colors cursor-pointer"
              title="Pulihkan dataset bawaan My InTress (127 Satker)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Pulihkan Data Asli</span>
            </button>
          )}

          {rawRecords.length > 0 && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Kosongkan</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Dynamic Summary Cards */}
      {dynamicSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Pagu */}
          <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Pagu My InTress
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatRupiahShort(dynamicSummary.totalPagu)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              {formatRupiahFull(dynamicSummary.totalPagu)}
            </p>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Cakupan Satker:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{dynamicSummary.satkerCount} Satker</span>
            </div>
          </div>

          {/* Card 2: Total Realisasi */}
          <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Realisasi Belanja
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {(Number.isFinite(dynamicSummary.persenRealisasiTotal) ? dynamicSummary.persenRealisasiTotal : 0).toFixed(2)}%
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                ({formatRupiahShort(dynamicSummary.totalRealisasi)})
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mt-2 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Number.isFinite(dynamicSummary.persenRealisasiTotal) ? dynamicSummary.persenRealisasiTotal : 0)}%` }}
              />
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Nominal Real:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                {formatRupiahShort(dynamicSummary.totalRealisasi)}
              </span>
            </div>
          </div>

          {/* Card 3: Sisa Pagu */}
          <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Sisa Pagu Anggaran
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              {formatRupiahShort(dynamicSummary.totalSisa)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Belum terserap: {(Number.isFinite(100 - dynamicSummary.persenRealisasiTotal) ? Math.max(0, 100 - dynamicSummary.persenRealisasiTotal) : 0).toFixed(2)}%
            </p>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Sisa Pagu Lengkap:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                {formatRupiahShort(dynamicSummary.totalSisa)}
              </span>
            </div>
          </div>

          {/* Card 4: Belanja Transfer & Satker Aktif */}
          <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Belanja Transfer (TKD)
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400">
              {(Number.isFinite(dynamicSummary.persen61) ? dynamicSummary.persen61 : 0).toFixed(2)}%
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Realisasi: {formatRupiahShort(dynamicSummary.real61)} / {formatRupiahShort(dynamicSummary.pagu61)}
            </p>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Penyalur TKD:</span>
              <span className="font-bold text-cyan-700 dark:text-cyan-300">500104 & 600031</span>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown per Jenis Belanja (51, 52, 53, 57, Transfer) */}
      {dynamicSummary && (
        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Rincian Realisasi My InTress per Jenis Belanja</span>
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Data terhitung otomatis dari satker yang aktif
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 51: Pegawai */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-blue-800 dark:text-blue-300">51 - Pegawai</span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">{(Number.isFinite(dynamicSummary.persen51) ? dynamicSummary.persen51 : 0).toFixed(1)}%</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {formatRupiahShort(dynamicSummary.real51)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pagu: {formatRupiahShort(dynamicSummary.pagu51)}
              </p>
              <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-1.5 mt-2">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, Number.isFinite(dynamicSummary.persen51) ? dynamicSummary.persen51 : 0)}%` }} />
              </div>
            </div>

            {/* 52: Barang */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">52 - Barang</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{(Number.isFinite(dynamicSummary.persen52) ? dynamicSummary.persen52 : 0).toFixed(1)}%</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {formatRupiahShort(dynamicSummary.real52)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pagu: {formatRupiahShort(dynamicSummary.pagu52)}
              </p>
              <div className="w-full bg-emerald-200 dark:bg-emerald-900 rounded-full h-1.5 mt-2">
                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, Number.isFinite(dynamicSummary.persen52) ? dynamicSummary.persen52 : 0)}%` }} />
              </div>
            </div>

            {/* 53: Modal */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-amber-800 dark:text-amber-300">53 - Modal</span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400">{(Number.isFinite(dynamicSummary.persen53) ? dynamicSummary.persen53 : 0).toFixed(1)}%</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {formatRupiahShort(dynamicSummary.real53)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pagu: {formatRupiahShort(dynamicSummary.pagu53)}
              </p>
              <div className="w-full bg-amber-200 dark:bg-amber-900 rounded-full h-1.5 mt-2">
                <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, Number.isFinite(dynamicSummary.persen53) ? dynamicSummary.persen53 : 0)}%` }} />
              </div>
            </div>

            {/* 57: Bansos */}
            <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-purple-800 dark:text-purple-300">57 - Bansos</span>
                <span className="text-xs font-black text-purple-600 dark:text-purple-400">{(Number.isFinite(dynamicSummary.persen57) ? dynamicSummary.persen57 : 0).toFixed(1)}%</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {formatRupiahShort(dynamicSummary.real57)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pagu: {formatRupiahShort(dynamicSummary.pagu57)}
              </p>
              <div className="w-full bg-purple-200 dark:bg-purple-900 rounded-full h-1.5 mt-2">
                <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, Number.isFinite(dynamicSummary.persen57) ? dynamicSummary.persen57 : 0)}%` }} />
              </div>
            </div>

            {/* Transfer / TKD */}
            <div className="p-3.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-cyan-800 dark:text-cyan-300">Transfer (TKD)</span>
                <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">{(Number.isFinite(dynamicSummary.persen61) ? dynamicSummary.persen61 : 0).toFixed(1)}%</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {formatRupiahShort(dynamicSummary.real61)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pagu: {formatRupiahShort(dynamicSummary.pagu61)}
              </p>
              <div className="w-full bg-cyan-200 dark:bg-cyan-900 rounded-full h-1.5 mt-2">
                <div className="bg-cyan-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, Number.isFinite(dynamicSummary.persen61) ? dynamicSummary.persen61 : 0)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Kode atau Nama Satker..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Jenis Belanja */}
          <div>
            <select
              value={filterJenisBelanja}
              onChange={(e) => {
                setFilterJenisBelanja(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="ALL">Semua Jenis Belanja</option>
              <option value="51">Hanya yang memiliki Belanja Pegawai (51)</option>
              <option value="52">Hanya yang memiliki Belanja Barang (52)</option>
              <option value="53">Hanya yang memiliki Belanja Modal (53)</option>
              <option value="57">Hanya yang memiliki Belanja Bansos (57)</option>
              <option value="61">Hanya yang memiliki Transfer Ke Daerah (TKD)</option>
            </select>
          </div>

          {/* Filter Level Realisasi */}
          <div>
            <select
              value={filterRealisasiLevel}
              onChange={(e) => {
                setFilterRealisasiLevel(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="ALL">Semua Level Realisasi</option>
              <option value="OVER_80">Realisasi Tinggi ( &ge; 80% )</option>
              <option value="50_TO_80">Realisasi Sedang ( 50% - 80% )</option>
              <option value="UNDER_50">Realisasi Rendah ( &lt; 50% )</option>
              <option value="HUNDRED">Realisasi Maksimal ( 100% )</option>
            </select>
          </div>

          {/* Urutkan / Sort */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as any);
                setSortOrder(so as any);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="pagu-desc">Pagu Terbesar &darr;</option>
              <option value="pagu-asc">Pagu Terkecil &uarr;</option>
              <option value="realisasi-desc">Realisasi Terbesar &darr;</option>
              <option value="persen-desc">% Realisasi Tertinggi &darr;</option>
              <option value="persen-asc">% Realisasi Terendah &uarr;</option>
              <option value="nama-asc">Nama Satker (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Indicator & Reset */}
        {isFilterActive && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400">
              Menampilkan <strong>{filteredRecords.length}</strong> dari <strong>{rawRecords.length}</strong> Satker terfilter.
            </span>
            <button
              onClick={resetFilters}
              className="font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* Main Satker Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Daftar Realisasi Satker My InTress</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {filteredRecords.length} Satker
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Klik pada baris satker untuk melihat rincian belanja dan analisis mendalam.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3.5 text-center w-12">No</th>
                <th className="py-3 px-3.5 min-w-[240px]">Satuan Kerja</th>
                <th className="py-3 px-3 text-right">Pegawai (51)</th>
                <th className="py-3 px-3 text-right">Barang (52)</th>
                <th className="py-3 px-3 text-right">Modal (53)</th>
                <th className="py-3 px-3 text-right">Bansos (57)</th>
                <th className="py-3 px-3 text-right">Transfer</th>
                <th className="py-3 px-3.5 text-right font-black text-slate-900 dark:text-white min-w-[120px]">Total Pagu</th>
                <th className="py-3 px-3.5 text-right font-black text-emerald-700 dark:text-emerald-300 min-w-[120px]">Total Realisasi</th>
                <th className="py-3 px-3 text-center min-w-[100px]">% Penyerapan</th>
                <th className="py-3 px-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Tidak ada satker yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  const safePersenTotal = Number.isFinite(r.persenTotal) ? r.persenTotal : 0;
                  return (
                    <tr
                      key={r.id || r.kodeSatker}
                      onClick={() => setSelectedSatker(r)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400">
                        {globalIdx}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {r.namaSatker}
                        </div>
                        <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Kode: {r.kodeSatker}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="text-slate-800 dark:text-slate-200">
                          {formatRupiahShort(r.realPegawai)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Number.isFinite(r.persenPegawai) && r.persenPegawai > 0 ? `${r.persenPegawai.toFixed(1)}%` : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="text-slate-800 dark:text-slate-200">
                          {formatRupiahShort(r.realBarang)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Number.isFinite(r.persenBarang) && r.persenBarang > 0 ? `${r.persenBarang.toFixed(1)}%` : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="text-slate-800 dark:text-slate-200">
                          {formatRupiahShort(r.realModal)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Number.isFinite(r.persenModal) && r.persenModal > 0 ? `${r.persenModal.toFixed(1)}%` : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="text-slate-800 dark:text-slate-200">
                          {formatRupiahShort(r.realBansos)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Number.isFinite(r.persenBansos) && r.persenBansos > 0 ? `${r.persenBansos.toFixed(1)}%` : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="text-slate-800 dark:text-slate-200">
                          {formatRupiahShort(r.realTransfer)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Number.isFinite(r.persenTransfer) && r.persenTransfer > 0 ? `${r.persenTransfer.toFixed(1)}%` : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatRupiahShort(r.paguTotal)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiahShort(r.realTotal)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
                            safePersenTotal >= 80
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : safePersenTotal >= 50
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {safePersenTotal.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSatker(r);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 cursor-pointer"
                          title="Lihat Rincian Satker"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredRecords.length > itemsPerPage && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex justify-center">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Satker Detail Modal */}
      {selectedSatker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/30">
              <div>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Kode Satker: {selectedSatker.kodeSatker}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {selectedSatker.namaSatker}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSatker(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Overview Badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400 block">Total Pagu</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {formatRupiahFull(selectedSatker.paguTotal)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">Total Realisasi</span>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                    {formatRupiahFull(selectedSatker.realTotal)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 block">Sisa Anggaran</span>
                  <span className="text-sm font-black text-amber-700 dark:text-amber-300">
                    {formatRupiahFull(selectedSatker.sisaTotal)}
                  </span>
                </div>
              </div>

              {/* Breakdown per Jenis Belanja */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  Rincian Per Jenis Belanja (My InTress)
                </h4>
                <div className="space-y-2">
                  {[
                    { nama: 'Belanja Pegawai (51)', pagu: selectedSatker.paguPegawai, real: selectedSatker.realPegawai, persen: selectedSatker.persenPegawai, color: 'blue' },
                    { nama: 'Belanja Barang (52)', pagu: selectedSatker.paguBarang, real: selectedSatker.realBarang, persen: selectedSatker.persenBarang, color: 'emerald' },
                    { nama: 'Belanja Modal (53)', pagu: selectedSatker.paguModal, real: selectedSatker.realModal, persen: selectedSatker.persenModal, color: 'amber' },
                    { nama: 'Belanja Bansos (57)', pagu: selectedSatker.paguBansos, real: selectedSatker.realBansos, persen: selectedSatker.persenBansos, color: 'purple' },
                    { nama: 'Transfer Ke Daerah (TKD)', pagu: selectedSatker.paguTransfer, real: selectedSatker.realTransfer, persen: selectedSatker.persenTransfer, color: 'cyan' },
                  ].map(b => (
                    <div key={b.nama} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{b.nama}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Pagu: {formatRupiahFull(b.pagu)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                          Real: {formatRupiahFull(b.real)}
                        </div>
                        <div className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                          {(Number.isFinite(b.persen) ? b.persen : 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => setSelectedSatker(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
