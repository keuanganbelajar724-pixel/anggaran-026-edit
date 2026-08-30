import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  Trash2,
  Check,
  Building2,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  Search,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Database,
  Lock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Percent
} from 'lucide-react';
import { MasterSatker, DeviasiHal3Record } from '../../types';
import {
  processDeviasiHal3Excel,
  downloadDeviasiHal3TemplateExcel,
  exportDeviasiHal3ToExcel,
  ProcessDeviasiHal3Result
} from '../../utils/deviasiHal3ExcelProcessor';
import { INITIAL_DEVIASI_HAL3_DATA, NAMA_BULAN_LIST } from '../../data/initialDeviasiHal3Data';

interface UploadDeviasiHal3SectionProps {
  satkers?: any[];
  masterSatkers?: MasterSatker[];
  deviasiHal3Records?: DeviasiHal3Record[];
  onApplyDeviasiHal3?: (records: DeviasiHal3Record[]) => void;
  onClearDeviasiHal3?: () => void;
  requestConfirm?: any;
  currentRecordsCount?: number;
  addLog?: (action: string, category: 'AUTH' | 'UPLOAD' | 'SETTINGS' | 'ANNOUNCEMENT', details: string, status?: 'SUCCESS' | 'WARNING' | 'INFO') => void;
  showToast?: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
  isDark?: boolean;
}

export const UploadDeviasiHal3Section: React.FC<UploadDeviasiHal3SectionProps> = ({
  satkers = [],
  masterSatkers = [],
  deviasiHal3Records = [],
  onApplyDeviasiHal3,
  onClearDeviasiHal3,
  requestConfirm,
  currentRecordsCount = 0,
  addLog,
  showToast,
  isDark = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewResult, setPreviewResult] = useState<ProcessDeviasiHal3Result | null>(null);
  const [selectedBulan, setSelectedBulan] = useState<string>('Agustus');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [previewPage, setPreviewPage] = useState(1);
  const [previewSearch, setPreviewSearch] = useState('');

  // Table & Management state for active uploaded records
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [bulanFilter, setBulanFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fail-safe local modal state for clear / reset
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showResetDefaultModal, setShowResetDefaultModal] = useState(false);

  const effectiveRecords = useMemo(() => {
    return Array.isArray(deviasiHal3Records) ? deviasiHal3Records : [];
  }, [deviasiHal3Records]);

  const effectiveCount = effectiveRecords.length || currentRecordsCount;

  // Format currency IDR
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Uploaded dataset stats
  const activeStats = useMemo(() => {
    const totalSatkers = effectiveRecords.length;
    const totalRpd = effectiveRecords.reduce((acc, r) => acc + (Number(r.rpdTotal) || 0), 0);
    const totalRealisasi = effectiveRecords.reduce((acc, r) => acc + (Number(r.realisasiTotal) || 0), 0);
    const totalDeviasi = effectiveRecords.reduce((acc, r) => acc + (Number(r.deviasiNominalTotal) || 0), 0);
    const avgPersen = totalSatkers > 0
      ? Number((effectiveRecords.reduce((acc, r) => acc + (Number(r.persenDeviasiTotal) || 0), 0) / totalSatkers).toFixed(2))
      : 0;
    const avgSkor = totalSatkers > 0
      ? Number((effectiveRecords.reduce((acc, r) => acc + (Number(r.skorIKPADeviasi) || 0), 0) / totalSatkers).toFixed(2))
      : 0;
    const kritisCount = effectiveRecords.filter(r => r.persenDeviasiTotal > 20).length;
    const earlyWarningCount = effectiveRecords.filter(r => r.earlyWarningAlert).length;

    return { totalSatkers, totalRpd, totalRealisasi, totalDeviasi, avgPersen, avgSkor, kritisCount, earlyWarningCount };
  }, [effectiveRecords]);

  // Filtered active records for management table
  const filteredActiveRecords = useMemo(() => {
    return effectiveRecords.filter(r => {
      if (bulanFilter !== 'ALL' && r.periodeBulan !== bulanFilter) return false;
      if (statusFilter === 'AMAN' && r.statusDeviasi !== 'Aman (≤ 5%)') return false;
      if (statusFilter === 'WASPADA' && r.statusDeviasi !== 'Waspada (5% - 10%)') return false;
      if (statusFilter === 'TINGGI' && r.statusDeviasi !== 'Tinggi (10% - 20%)') return false;
      if (statusFilter === 'KRITIS' && r.statusDeviasi !== 'Kritis (> 20%)') return false;
      if (statusFilter === 'EARLY_WARNING' && !r.earlyWarningAlert) return false;

      if (!searchTableQuery.trim()) return true;
      const q = searchTableQuery.toLowerCase();
      return (
        r.kodeSatker.toLowerCase().includes(q) ||
        r.namaSatker.toLowerCase().includes(q) ||
        (r.kementerianLembaga && r.kementerianLembaga.toLowerCase().includes(q)) ||
        (r.periodeBulan && r.periodeBulan.toLowerCase().includes(q))
      );
    });
  }, [effectiveRecords, statusFilter, bulanFilter, searchTableQuery]);

  // Pagination for active table
  const totalPages = Math.max(1, Math.ceil(filteredActiveRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActiveRecords.slice(start, start + pageSize);
  }, [filteredActiveRecords, currentPage, pageSize]);

  // Filtered preview records
  const filteredPreviewData = useMemo(() => {
    if (!previewResult || !previewResult.records) return [];
    if (!previewSearch.trim()) return previewResult.records;
    const q = previewSearch.toLowerCase();
    return previewResult.records.filter((r: DeviasiHal3Record) =>
      r.kodeSatker?.toLowerCase().includes(q) ||
      r.namaSatker?.toLowerCase().includes(q) ||
      r.kementerianLembaga?.toLowerCase().includes(q)
    );
  }, [previewResult, previewSearch]);

  const previewTotalPages = Math.max(1, Math.ceil(filteredPreviewData.length / 10));
  const paginatedPreviewRows = useMemo(() => {
    const start = (previewPage - 1) * 10;
    return filteredPreviewData.slice(start, start + 10);
  }, [filteredPreviewData, previewPage]);

  // Handle file selection & reading
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const result = processDeviasiHal3Excel(buffer, file.name);

      // Overwrite periode bulan jika user memilih dropdown
      if (selectedBulan) {
        result.records = result.records.map(r => ({
          ...r,
          periodeBulan: r.periodeBulan || selectedBulan
        }));
      }

      setPreviewResult(result);
      setPreviewPage(1);
      setPreviewSearch('');

      if (showToast) {
        if (result.records.length > 0) {
          showToast({
            type: 'info',
            title: 'File Excel Berhasil Dibaca',
            message: `Terdeteksi ${result.records.length} data Deviasi Hal III DIPA.`
          });
        } else {
          showToast({
            type: 'warning',
            title: 'Data Kosong / Tidak Sesuai',
            message: result.errors[0] || 'Tidak ada baris data valid yang ditemukan.'
          });
        }
      }
    } catch (err: any) {
      console.error('Error processing Deviasi Hal 3 file:', err);
      if (showToast) {
        showToast({
          type: 'error',
          title: 'Gagal Memproses Excel',
          message: err?.message || 'Pastikan file berekstensi .xlsx / .xls yang valid.'
        });
      }
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag & drop support
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const result = processDeviasiHal3Excel(buffer, file.name);
      if (selectedBulan) {
        result.records = result.records.map(r => ({
          ...r,
          periodeBulan: r.periodeBulan || selectedBulan
        }));
      }
      setPreviewResult(result);
      setPreviewPage(1);
      setPreviewSearch('');

      if (showToast) {
        showToast({
          type: 'info',
          title: 'File Excel Berhasil Dibaca',
          message: `Terdeteksi ${result.records.length} data Deviasi Hal III DIPA.`
        });
      }
    } catch (err: any) {
      if (showToast) {
        showToast({
          type: 'error',
          title: 'Gagal Memproses Excel',
          message: err?.message || 'Gagal membaca format file.'
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply previewed data to state
  const handleApplyData = () => {
    if (!previewResult || !previewResult.records || previewResult.records.length === 0) return;

    let updatedList: DeviasiHal3Record[];
    if (importMode === 'replace') {
      updatedList = previewResult.records;
    } else {
      // Append mode: merge based on (kodeSatker + periodeAngka/periodeBulan)
      const existingMap = new Map<string, DeviasiHal3Record>();
      effectiveRecords.forEach(r => {
        const key = `${r.kodeSatker}_${r.periodeAngka || r.periodeBulan}`;
        existingMap.set(key, r);
      });
      previewResult.records.forEach(r => {
        const key = `${r.kodeSatker}_${r.periodeAngka || r.periodeBulan}`;
        existingMap.set(key, r);
      });
      updatedList = Array.from(existingMap.values());
    }

    if (onApplyDeviasiHal3) {
      onApplyDeviasiHal3(updatedList);
    }

    if (addLog) {
      addLog(
        `Upload Excel Deviasi Hal III (${importMode === 'replace' ? 'Timpa' : 'Gabung'})`,
        'UPLOAD',
        `Memproses ${previewResult.records.length} data satker Deviasi Hal III. Total aktif: ${updatedList.length}`,
        'SUCCESS'
      );
    }

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Data Berhasil Disimpan',
        message: `${previewResult.records.length} data Deviasi Hal III DIPA berhasil diperbarui ke sistem.`
      });
    }

    setPreviewResult(null);
  };

  // Clear data safely
  const handleConfirmClear = () => {
    if (onClearDeviasiHal3) {
      onClearDeviasiHal3();
    }
    setShowClearConfirmModal(false);
    if (addLog) {
      addLog('Kosongkan Data Deviasi Hal III', 'SETTINGS', 'Semua catatan Deviasi Hal III DIPA telah dikosongkan.', 'WARNING');
    }
    if (showToast) {
      showToast({
        type: 'warning',
        title: 'Data Dikosongkan',
        message: 'Seluruh data Deviasi Hal III DIPA telah dibersihkan.'
      });
    }
  };

  // Reset to default data
  const handleConfirmReset = () => {
    if (onApplyDeviasiHal3) {
      onApplyDeviasiHal3(INITIAL_DEVIASI_HAL3_DATA);
    }
    setShowResetDefaultModal(false);
    if (addLog) {
      addLog('Reset Default Deviasi Hal III', 'SETTINGS', 'Memulihkan data sampel awal Deviasi Hal III DIPA.', 'INFO');
    }
    if (showToast) {
      showToast({
        type: 'info',
        title: 'Data Default Dipulihkan',
        message: `Memulihkan ${INITIAL_DEVIASI_HAL3_DATA.length} data sampel Deviasi Hal III DIPA.`
      });
    }
  };

  // Toggle select record
  const toggleSelectRecord = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all on page
  const toggleSelectAllPage = () => {
    const allIdsOnPage = paginatedRecords.map(r => r.id);
    const areAllSelected = allIdsOnPage.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (areAllSelected) {
        allIdsOnPage.forEach(id => next.delete(id));
      } else {
        allIdsOnPage.forEach(id => next.add(id));
      }
      return next;
    });
  };

  // Delete selected records
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const remaining = effectiveRecords.filter(r => !selectedIds.has(r.id));
    if (onApplyDeviasiHal3) {
      onApplyDeviasiHal3(remaining);
    }
    setSelectedIds(new Set());
    if (showToast) {
      showToast({
        type: 'info',
        title: 'Data Dihapus',
        message: `${selectedIds.size} data terpilih telah dihapus.`
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 rounded-3xl border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Modul Integrasi 7: Deviasi Halaman III DIPA</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              Upload &amp; Rekonsiliasi Deviasi Hal III DIPA
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
              Unggah laporan Rencana Penarikan Dana (RPD) vs Realisasi SP2D bulanan (OMSPAN / SAKTI). Sistem otomatis menghitung deviasi kas nominal, % deviasi belanja, dan skor IKPA (bobot 10%).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => downloadDeviasiHal3TemplateExcel()}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 border border-indigo-400/30 hover:scale-[1.02] cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-300" />
              Template Excel (.xlsx)
            </button>

            {effectiveRecords.length > 0 && (
              <button
                type="button"
                onClick={() => exportDeviasiHal3ToExcel(effectiveRecords)}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
              >
                <Download className="w-4 h-4 text-sky-400" />
                Ekspor Data Aktif
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload Zone & Mode Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drop Zone (2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Unggah File Laporan Deviasi Hal III
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Format: OMSPAN / SAKTI (.xlsx, .xls, .csv)
            </span>
          </div>

          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-6 text-center hover:border-indigo-500 transition-all bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col items-center justify-center space-y-3 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                Klik untuk memilih file atau seret file ke area ini
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Mendukung rekapitulasi deviasi per jenis belanja (51, 52, 53) atau total
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              {isProcessing ? 'Membaca File...' : 'Pilih File Excel'}
            </button>
          </div>
        </div>

        {/* Import Settings (1 Column) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Pengaturan Impor Data
          </h3>

          {/* Mode Import */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Metode Impor:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                  importMode === 'replace'
                    ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <div className="font-extrabold flex items-center justify-between">
                  <span>Timpa (Replace)</span>
                  {importMode === 'replace' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <span className="text-[10px] text-slate-500">Gantikan semua data lama</span>
              </button>

              <button
                type="button"
                onClick={() => setImportMode('append')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                  importMode === 'append'
                    ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <div className="font-extrabold flex items-center justify-between">
                  <span>Gabung (Append)</span>
                  {importMode === 'append' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <span className="text-[10px] text-slate-500">Tambahkan ke data aktif</span>
              </button>
            </div>
          </div>

          {/* Periode Bulan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Periode Bulan Pelaporan:</span>
              <span className="text-[10px] text-slate-500 font-normal">Tahun Anggaran 2026</span>
            </label>
            <select
              value={selectedBulan}
              onChange={e => setSelectedBulan(e.target.value)}
              className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            >
              {NAMA_BULAN_LIST.map(b => (
                <option key={b} value={b}>
                  Bulan {b} 2026
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Toleransi Deviasi Nasional adalah <strong>≤ 5%</strong>. Satker dengan deviasi &gt; 10% akan otomatis ditandai sebagai peringatan dini.
            </span>
          </div>
        </div>
      </div>

      {/* Preview Section if File Loaded */}
      {previewResult && (
        <div className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 ${
          previewResult.records.length > 0 ? 'border-indigo-500' : 'border-amber-500'
        } shadow-xl space-y-4 animate-scale-up`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              {previewResult.records.length > 0 ? (
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pratinjau Data Siap Disimpan</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-extrabold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Data Belum Terbaca</span>
                </div>
              )}
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                {previewResult.records.length > 0
                  ? `Ditemukan ${previewResult.records.length} Baris Data Satker`
                  : 'Tidak Ditemukan Baris Data Satker yang Valid'}
              </h3>
              {previewResult.records.length > 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total RPD: <strong>{formatRupiah(previewResult.summary.totalRpd)}</strong> | Total Realisasi: <strong>{formatRupiah(previewResult.summary.totalRealisasi)}</strong> | Deviasi Nominal: <strong>{formatRupiah(previewResult.summary.totalDeviasiNominal)}</strong>
                </p>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {previewResult.errors?.join(' ') || 'Pastikan file memiliki kolom Kode Satker (6 digit) atau unduh Template Excel resmi.'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewResult(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Tutup Pratinjau
              </button>
              {previewResult.records.length > 0 && (
                <button
                  type="button"
                  onClick={handleApplyData}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Terapkan &amp; Simpan ke Sistem
                </button>
              )}
            </div>
          </div>

          {/* Search bar inside preview */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kode / nama satker di pratinjau..."
                value={previewSearch}
                onChange={e => {
                  setPreviewSearch(e.target.value);
                  setPreviewPage(1);
                }}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Menampilkan {paginatedPreviewRows.length} dari {filteredPreviewData.length} data
            </span>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Kode &amp; Satker</th>
                  <th className="p-3">K/L</th>
                  <th className="p-3 text-center">Periode</th>
                  <th className="p-3 text-right">RPD Total</th>
                  <th className="p-3 text-right">Realisasi SP2D</th>
                  <th className="p-3 text-right">Deviasi Nominal</th>
                  <th className="p-3 text-center">% Deviasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {paginatedPreviewRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20">
                    <td className="p-3">
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{r.kodeSatker}</div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">{r.namaSatker}</div>
                    </td>
                    <td className="p-3 text-[11px] text-slate-500">{r.kementerianLembaga || '-'}</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold">
                        {r.periodeFormatted || `Periode ${r.periodeAngka || r.periodeBulan}`}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-[11px]">{formatRupiah(r.rpdTotal)}</td>
                    <td className="p-3 text-right font-mono text-[11px] text-emerald-600 font-bold">{formatRupiah(r.realisasiTotal)}</td>
                    <td className="p-3 text-right font-mono text-[11px] text-rose-600">{formatRupiah(r.deviasiNominalTotal)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-extrabold ${
                        (Number(r.persenDeviasiTotal) || 0) <= 5
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : (Number(r.persenDeviasiTotal) || 0) <= 10
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                      }`}>
                        {(Number.isFinite(r.persenDeviasiTotal) ? r.persenDeviasiTotal : 0).toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Preview Pagination */}
          {previewTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Halaman {previewPage} dari {previewTotalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={previewPage <= 1}
                  onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={previewPage >= previewTotalPages}
                  onClick={() => setPreviewPage(p => Math.min(previewTotalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dataset Aktif Section & Management Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Header Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Kelola Data Aktif Deviasi Hal III DIPA
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {effectiveRecords.length} Satker
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Data yang aktif digunakan pada Tab Navigasi &quot;Deviasi Hal III DIPA&quot; dan sinkronisasi IKPA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Terpilih ({selectedIds.size})
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowResetDefaultModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
              Reset Default
            </button>

            <button
              type="button"
              onClick={() => setShowClearConfirmModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200 dark:border-rose-800/60"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Kosongkan Data
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40">
            <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300">Total RPD Target</span>
            <div className="text-sm sm:text-base font-black text-indigo-950 dark:text-indigo-100 font-mono mt-1">
              {formatRupiah(activeStats.totalRpd)}
            </div>
            <span className="text-[10px] text-slate-500">Rencana Penarikan Dana</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Realisasi SP2D</span>
            <div className="text-sm sm:text-base font-black text-emerald-950 dark:text-emerald-100 font-mono mt-1">
              {formatRupiah(activeStats.totalRealisasi)}
            </div>
            <span className="text-[10px] text-slate-500">Pencairan Kas Negara</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Rata-rata % Deviasi</span>
            <div className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-100 font-mono mt-1 flex items-center gap-1.5">
              <span>{activeStats.avgPersen}%</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                Tol. ≤ 5%
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Rata-rata seluruh satker</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40">
            <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300">Satker Kritis / EW</span>
            <div className="text-sm sm:text-base font-black text-rose-950 dark:text-rose-100 font-mono mt-1">
              {activeStats.kritisCount} Kritis | {activeStats.earlyWarningCount} EW
            </div>
            <span className="text-[10px] text-slate-500">Deviasi &gt; 20% &amp; Early Warning</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kode / nama satker / K/L..."
                value={searchTableQuery}
                onChange={e => {
                  setSearchTableQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Bulan */}
            <select
              value={bulanFilter}
              onChange={e => {
                setBulanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-hidden"
            >
              <option value="ALL">Semua Bulan</option>
              {NAMA_BULAN_LIST.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-hidden"
            >
              <option value="ALL">Semua Status Deviasi</option>
              <option value="AMAN">Aman (≤ 5%)</option>
              <option value="WASPADA">Waspada (5% - 10%)</option>
              <option value="TINGGI">Tinggi (10% - 20%)</option>
              <option value="KRITIS">Kritis (&gt; 20%)</option>
              <option value="EARLY_WARNING">Early Warning Akhir Bulan</option>
            </select>
          </div>

          {/* Page size */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-hidden"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Table of Active Data */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedRecords.length > 0 && paginatedRecords.every(r => selectedIds.has(r.id))}
                    onChange={toggleSelectAllPage}
                    className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="p-3">Kode &amp; Nama Satker</th>
                <th className="p-3">K/L</th>
                <th className="p-3 text-center">Periode</th>
                <th className="p-3 text-right">RPD Total</th>
                <th className="p-3 text-right">Realisasi SP2D</th>
                <th className="p-3 text-right">Deviasi Nominal</th>
                <th className="p-3 text-center">% Deviasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada data yang sesuai filter atau pencarian.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(r => {
                  const isSelected = selectedIds.has(r.id);
                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRecord(r.id)}
                          className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{r.kodeSatker}</div>
                        <div className="text-[11px] text-slate-800 dark:text-slate-200 font-bold">{r.namaSatker}</div>
                      </td>
                      <td className="p-3 text-[11px] text-slate-500">{r.kementerianLembaga || '-'}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold">
                          {r.periodeFormatted || `Periode ${r.periodeAngka || r.periodeBulan}`}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-[11px]">{formatRupiah(r.rpdTotal)}</td>
                      <td className="p-3 text-right font-mono text-[11px] text-emerald-600 font-bold">{formatRupiah(r.realisasiTotal)}</td>
                      <td className="p-3 text-right font-mono text-[11px] text-rose-600">{formatRupiah(r.deviasiNominalTotal)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-extrabold ${
                          (Number(r.persenDeviasiTotal) || 0) <= 5
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : (Number(r.persenDeviasiTotal) || 0) <= 10
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}>
                          {(Number.isFinite(r.persenDeviasiTotal) ? r.persenDeviasiTotal : 0).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500">
              Menampilkan {filteredActiveRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} s.d.{' '}
              {Math.min(currentPage * pageSize, filteredActiveRecords.length)} dari {filteredActiveRecords.length} data
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                Sebelumnya
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clear Confirm Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              Kosongkan Seluruh Data Deviasi Hal III?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tindakan ini akan menghapus semua catatan RPD dan realisasi Deviasi Halaman III DIPA yang sedang aktif. Anda dapat mengunggah file baru atau memulihkan data default kapan saja.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Ya, Kosongkan Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Default Modal */}
      {showResetDefaultModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              Pulihkan ke Data Sampel Awal?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Data aktif akan digantikan dengan data sampel awal Deviasi Hal III DIPA ({INITIAL_DEVIASI_HAL3_DATA.length} Satker KPPN Semarang I).
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetDefaultModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                Ya, Pulihkan Default
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
