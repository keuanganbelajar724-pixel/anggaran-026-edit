import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Download,
  CreditCard,
  CheckCircle2,
  AlertCircle,
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
  FileText
} from 'lucide-react';
import { MasterSatker, TransaksiKKPRecord } from '../../types';
import { validateKKPExcelFile, downloadKKPTemplate, exportKKPToExcel } from '../../utils/modularExcelProcessors';
import { INITIAL_TRANSAKSI_KKP_DATA } from '../../data/initialKKPData';

interface UploadKKPSectionProps {
  satkers?: any[];
  masterSatkers?: MasterSatker[];
  transaksiKkpRecords?: TransaksiKKPRecord[];
  onApplyTransaksiKkp?: (records: TransaksiKKPRecord[]) => void;
  onClearTransaksiKkp?: () => void;
  onUploadSuccess?: (records: TransaksiKKPRecord[], batchInfo: any) => void;
  onResetData?: () => void;
  requestConfirm?: any;
  currentRecordsCount?: number;
  addLog?: (action: string, category: 'AUTH' | 'UPLOAD' | 'SETTINGS' | 'ANNOUNCEMENT', details: string, status?: 'SUCCESS' | 'WARNING' | 'INFO') => void;
  showToast?: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
  isDark?: boolean;
}

export const UploadKKPSection: React.FC<UploadKKPSectionProps> = ({
  satkers = [],
  masterSatkers = [],
  transaksiKkpRecords = [],
  onApplyTransaksiKkp,
  onClearTransaksiKkp,
  onUploadSuccess,
  onResetData,
  requestConfirm,
  currentRecordsCount = 0,
  addLog,
  showToast,
  isDark = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Agustus 2026');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [previewPage, setPreviewPage] = useState(1);
  const [previewSearch, setPreviewSearch] = useState('');

  // Table & Management state for active uploaded records
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [bankFilter, setBankFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fail-safe local modal state for clear / reset
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showResetDefaultModal, setShowResetDefaultModal] = useState(false);

  const effectiveRecords = useMemo(() => {
    return Array.isArray(transaksiKkpRecords) ? transaksiKkpRecords : [];
  }, [transaksiKkpRecords]);

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
    const totalSp2d = effectiveRecords.reduce((acc, r) => acc + (Number(r.jumlahTransaksi) || 0), 0);
    const totalNominal = effectiveRecords.reduce((acc, r) => acc + (Number(r.totalNominal) || 0), 0);
    
    // Unique banks
    const bankCounts: Record<string, number> = {};
    effectiveRecords.forEach(r => {
      const b = r.bankPenerbit || 'Bank Rakyat Indonesia (BRI)';
      bankCounts[b] = (bankCounts[b] || 0) + 1;
    });

    const uniqueBanks = Object.keys(bankCounts).length;
    const topBank = Object.entries(bankCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    return { totalSatkers, totalSp2d, totalNominal, uniqueBanks, topBank };
  }, [effectiveRecords]);

  // Unique bank list for filtering
  const availableBanks = useMemo(() => {
    const banks = new Set<string>();
    effectiveRecords.forEach(r => {
      if (r.bankPenerbit) banks.add(r.bankPenerbit);
    });
    return Array.from(banks);
  }, [effectiveRecords]);

  // Filtered active records for management table
  const filteredActiveRecords = useMemo(() => {
    return effectiveRecords.filter(r => {
      if (bankFilter !== 'ALL' && r.bankPenerbit !== bankFilter) return false;
      if (statusFilter !== 'ALL' && r.statusKeaktifan !== statusFilter) return false;
      if (!searchTableQuery.trim()) return true;
      const q = searchTableQuery.toLowerCase();
      return (
        r.kodeSatker.toLowerCase().includes(q) ||
        r.namaSatker.toLowerCase().includes(q) ||
        (r.kementerianLembaga && r.kementerianLembaga.toLowerCase().includes(q)) ||
        (r.bankPenerbit && r.bankPenerbit.toLowerCase().includes(q)) ||
        (r.noSp2dTerakhir && r.noSp2dTerakhir.toLowerCase().includes(q)) ||
        (r.periode && r.periode.toLowerCase().includes(q))
      );
    });
  }, [effectiveRecords, bankFilter, statusFilter, searchTableQuery]);

  // Pagination for active table
  const totalPages = Math.max(1, Math.ceil(filteredActiveRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActiveRecords.slice(start, start + pageSize);
  }, [filteredActiveRecords, currentPage, pageSize]);

  // Filtered preview records
  const filteredPreviewData = useMemo(() => {
    if (!previewData || !previewData.validData) return [];
    if (!previewSearch.trim()) return previewData.validData;
    const q = previewSearch.toLowerCase();
    return previewData.validData.filter((r: any) =>
      r.kodeSatker?.toLowerCase().includes(q) ||
      r.namaSatker?.toLowerCase().includes(q) ||
      r.bankPenerbit?.toLowerCase().includes(q) ||
      r.noSp2dTerakhir?.toLowerCase().includes(q)
    );
  }, [previewData, previewSearch]);

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
      const preview = await validateKKPExcelFile(file, masterSatkers, selectedPeriod, 2026);
      setPreviewData(preview);
      setPreviewPage(1);
      setPreviewSearch('');
      if (showToast) {
        showToast({
          type: 'info',
          title: 'File Excel Berhasil Dibaca',
          message: `Ditemukan ${preview.validData?.length || 0} Satker transaksi KKP. Silakan periksa pratinjau sebelum menyimpan.`
        });
      }
    } catch (err: any) {
      if (showToast) {
        showToast({
          type: 'error',
          title: 'Gagal Membaca File',
          message: err.message || 'Terjadi kesalahan saat memproses Excel Transaksi KKP.'
        });
      } else {
        alert(err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply import to dashboard
  const handleApplyImport = () => {
    if (!previewData || !previewData.validData || previewData.validData.length === 0) return;

    let finalRecords: TransaksiKKPRecord[] = [];
    if (importMode === 'replace') {
      finalRecords = previewData.validData;
    } else {
      // Append mode: merge based on unique ID or (kodeSatker + periode)
      const existingMap = new Map<string, TransaksiKKPRecord>();
      effectiveRecords.forEach(r => {
        const key = `${r.kodeSatker}_${r.periode || 'Agustus 2026'}`;
        existingMap.set(key, r);
      });
      previewData.validData.forEach((r: TransaksiKKPRecord) => {
        const key = `${r.kodeSatker}_${r.periode || 'Agustus 2026'}`;
        existingMap.set(key, r);
      });
      finalRecords = Array.from(existingMap.values());
    }

    if (onApplyTransaksiKkp) {
      onApplyTransaksiKkp(finalRecords);
    } else if (onUploadSuccess) {
      onUploadSuccess(finalRecords, {
        fileName: previewData.fileName,
        totalRows: previewData.totalRows,
        validCount: previewData.validData.length
      });
    }

    if (addLog) {
      addLog(
        'Upload Excel Transaksi KKP',
        'UPLOAD',
        `File: ${previewData.fileName} (${previewData.validData.length} Satker KKP diterapkan, Mode: ${importMode.toUpperCase()})`,
        'SUCCESS'
      );
    }

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Data KKP Berhasil Disimpan',
        message: `Total ${finalRecords.length} data Satker transaksi KKP telah aktif dan tersinkronisasi di dashboard.`
      });
    }

    setPreviewData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 1. CLEAR ALL DATA (FAIL-SAFE & IMMEDIATE)
  const executeClearAll = () => {
    try {
      localStorage.setItem('kppn_transaksi_kkp', '[]');
    } catch (e) {
      console.warn('Error clearing localStorage:', e);
    }

    if (onClearTransaksiKkp) {
      onClearTransaksiKkp();
    }
    if (onApplyTransaksiKkp) {
      onApplyTransaksiKkp([]);
    }

    setShowClearConfirmModal(false);
    setPreviewData(null);
    setSelectedIds(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (addLog) {
      addLog(
        'Kosongkan Transaksi KKP',
        'SETTINGS',
        'Seluruh data transaksi KKP berhasil dikosongkan (0 Satker).',
        'WARNING'
      );
    }

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Data Transaksi KKP Dikosongkan',
        message: 'Seluruh data transaksi KKP telah bersih dari sistem (0 Satker).'
      });
    }
  };

  // Handle click on Clear Data
  const handleClearDataClick = () => {
    if (typeof requestConfirm === 'function') {
      try {
        requestConfirm(
          'Kosongkan Seluruh Data Transaksi KKP',
          `Apakah Anda yakin ingin MENGHAPUS & MENGOSONGKAN seluruh ${effectiveCount} data Satker transaksi KKP saat ini? Tindakan ini akan membuat dataset KKP menjadi 0 Satker.`,
          executeClearAll,
          {
            confirmText: 'Ya, Kosongkan Total',
            cancelText: 'Batal',
            variant: 'danger',
            iconType: 'trash'
          }
        );
      } catch (err) {
        setShowClearConfirmModal(true);
      }
    } else {
      setShowClearConfirmModal(true);
    }
  };

  // 2. RESET TO DEFAULT SEED DATA
  const executeResetDefault = () => {
    const defaultData = INITIAL_TRANSAKSI_KKP_DATA;
    try {
      localStorage.setItem('kppn_transaksi_kkp', JSON.stringify(defaultData));
    } catch (e) {
      console.warn('Error resetting localStorage:', e);
    }

    if (onApplyTransaksiKkp) {
      onApplyTransaksiKkp(defaultData);
    }

    setShowResetDefaultModal(false);
    setPreviewData(null);
    setSelectedIds(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (addLog) {
      addLog(
        'Reset Data Awal Transaksi KKP',
        'SETTINGS',
        `Data transaksi KKP dikembalikan ke sampel data awal (${defaultData.length} Satker).`,
        'INFO'
      );
    }

    if (showToast) {
      showToast({
        type: 'info',
        title: 'Data KKP Direset ke Awal',
        message: `Memuat ulang ${defaultData.length} data Satker transaksi KKP bawaan.`
      });
    }
  };

  const handleResetDefaultClick = () => {
    if (typeof requestConfirm === 'function') {
      try {
        requestConfirm(
          'Reset ke Data Awal KKP',
          `Apakah Anda yakin ingin memuat kembali data sampel bawaan KKP (${INITIAL_TRANSAKSI_KKP_DATA.length} Satker)?`,
          executeResetDefault,
          {
            confirmText: 'Ya, Muat Data Awal',
            cancelText: 'Batal',
            variant: 'warning',
            iconType: 'reload'
          }
        );
      } catch (err) {
        setShowResetDefaultModal(true);
      }
    } else {
      setShowResetDefaultModal(true);
    }
  };

  // 3. DELETE SINGLE RECORD
  const handleDeleteSingleRecord = (recordId: string, satkerName: string) => {
    const updated = effectiveRecords.filter(r => r.id !== recordId);
    if (onApplyTransaksiKkp) {
      onApplyTransaksiKkp(updated);
    }
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(recordId);
      return next;
    });

    if (showToast) {
      showToast({
        type: 'info',
        title: 'Satker KKP Dihapus',
        message: `Data transaksi KKP untuk ${satkerName} berhasil dihapus.`
      });
    }
  };

  // 4. DELETE SELECTED RECORDS
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const countToDelete = selectedIds.size;
    const updated = effectiveRecords.filter(r => !selectedIds.has(r.id));

    if (onApplyTransaksiKkp) {
      onApplyTransaksiKkp(updated);
    }
    setSelectedIds(new Set());

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Satker Terpilih Dihapus',
        message: `${countToDelete} Satker transaksi KKP berhasil dihapus dari sistem.`
      });
    }
  };

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allCurrentIds = new Set(filteredActiveRecords.map(r => r.id));
      setSelectedIds(allCurrentIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Export Active Data to Excel
  const handleExportActiveData = () => {
    exportKKPToExcel(
      effectiveRecords,
      `Rekap_Transaksi_KKP_KPPN026_${new Date().toISOString().slice(0, 10)}.xlsx`,
      'Semua Bulan (Kumulatif)'
    );
    if (showToast) {
      showToast({
        type: 'success',
        title: 'File Excel Diunduh',
        message: `Berhasil mengunduh rekap ${effectiveRecords.length} data Satker transaksi KKP.`
      });
    }
  };

  return (
    <div className="space-y-6">

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                MODUL TRANSAKSI KKP &amp; GUP
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                Saat ini: <strong className="text-indigo-600 dark:text-indigo-400 font-black">{effectiveCount}</strong> Satker Aktif
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
              Upload &amp; Manajemen Data Transaksi KKP (GUP)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Unggah file laporan transaksi KKP (OM-SPAN / SAKTI). Sistem secara otomatis mengagregasi frekuensi SP2D dan total rupiah per Satker tanpa mempublikasikan kolom rahasia.
            </p>
          </div>

          {/* Action Buttons Top */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {effectiveCount > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleClearDataClick}
                  className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/70 text-rose-700 dark:text-rose-300 font-black text-xs px-3.5 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200 dark:border-rose-800 shadow-sm"
                  title="Hapus seluruh data Transaksi KKP menjadi 0"
                >
                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Kosongkan Data</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportActiveData}
                  className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs px-3.5 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-200 dark:border-emerald-800 shadow-sm"
                  title="Ekspor seluruh data transaksi KKP aktif ke file Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Ekspor Excel</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleResetDefaultClick}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs px-3.5 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-sm"
              title="Kembalikan dataset ke data sampel awal"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Reset ke Awal</span>
            </button>

            <button
              type="button"
              onClick={downloadKKPTemplate}
              className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 font-bold text-xs px-3.5 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800 shadow-sm"
            >
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Unduh Template Excel</span>
            </button>
          </div>
        </div>

        {/* Live Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
              Total Satker KKP
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {activeStats.totalSatkers} <span className="text-xs font-semibold text-slate-400">Satker</span>
            </div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
              Satker Terdaftar Aktif
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Total Transaksi (SP2D)
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {activeStats.totalSp2d.toLocaleString('id-ID')} <span className="text-xs font-semibold text-slate-400">SP2D</span>
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              Frekuensi Penerbitan
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              Total Nominal Belanja
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              {formatRupiah(activeStats.totalNominal)}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              Nilai Realisasi KKP
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              Mitra Bank Penerbit
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1 truncate" title={activeStats.topBank}>
              {activeStats.topBank}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {activeStats.uniqueBanks} Bank Penerbit
            </div>
          </div>
        </div>

        {/* Privacy Notice Banner */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
          <div className="p-1.5 bg-indigo-200/60 dark:bg-indigo-900 rounded-lg shrink-0 mt-0.5">
            <Lock className="w-4 h-4 text-indigo-700 dark:text-indigo-300" />
          </div>
          <div>
            <strong className="font-bold">Ketentuan Privasi &amp; Pengecualian Kolom Otomatis:</strong> Kolom C s.d. I (yang berisi nomor rekening pihak ketiga, detail vendor individual, atau nomor faktur rinci) <strong>tidak ditampilkan di dashboard publik</strong>, hanya Kode Satker, Nama Satker, Frekuensi Transaksi, Total Nominal Rupiah, Bank Penerbit, dan No/Tanggal SP2D yang dipublikasikan.
          </div>
        </div>

        {/* Import Settings & File Dropzone */}
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Pengaturan Impor File Transaksi KKP
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Import Mode: Replace vs Append */}
              <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    importMode === 'replace'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Ganti Semua Data (Replace)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    importMode === 'append'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Tambahkan Data (Append)
                </button>
              </div>

              {/* Default Period */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-semibold">Periode Default:</span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="Agustus 2026">Agustus 2026</option>
                  <option value="Juli 2026">Juli 2026</option>
                  <option value="Juni 2026">Juni 2026</option>
                  <option value="Mei 2026">Mei 2026</option>
                  <option value="April 2026">April 2026</option>
                  <option value="Maret 2026">Maret 2026</option>
                  <option value="Februari 2026">Februari 2026</option>
                  <option value="Januari 2026">Januari 2026</option>
                </select>
              </div>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 rounded-3xl p-8 text-center hover:border-indigo-500 transition-all bg-white dark:bg-slate-900/60 shadow-inner">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="kkp-excel-input-enhanced"
            />

            <div className="space-y-3">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                {isProcessing ? (
                  <RefreshCw className="w-7 h-7 animate-spin" />
                ) : (
                  <Upload className="w-7 h-7" />
                )}
              </div>

              <div>
                <label
                  htmlFor="kkp-excel-input-enhanced"
                  className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-6 py-3 rounded-2xl cursor-pointer shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isProcessing ? 'Memproses dan Mengagregasi Excel...' : 'Pilih File Excel Transaksi KKP'}
                </label>
                <p className="text-[11px] text-slate-400 mt-2">
                  Mendukung file format <code>.xlsx</code>, <code>.xls</code> (Laporan OM-SPAN GUP KKP / Rekonsiliasi SAKTI)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Preview Container if file uploaded */}
        {previewData && (
          <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
            
            {/* Preview Banner */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-indigo-50 dark:bg-indigo-950/60 p-5 rounded-3xl border border-indigo-200 dark:border-indigo-800">
              <div className="space-y-1">
                <div className="font-black text-base text-indigo-950 dark:text-indigo-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Pratinjau File: <strong className="font-mono">{previewData.fileName}</strong></span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-800 dark:text-indigo-300 font-semibold">
                  <span>📊 Terdeteksi: <strong>{previewData.validData?.length || 0} Satker</strong></span>
                  <span>•</span>
                  <span>🗓️ Periode: <strong>{previewData.periode}</strong></span>
                  <span>•</span>
                  <span>⚙️ Mode Impor: <strong className="uppercase">{importMode}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPreviewData(null)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  onClick={handleApplyImport}
                  className="px-5 py-2.5 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Terapkan ke Dashboard Transaksi KKP</span>
                </button>
              </div>
            </div>

            {/* Preview Controls: Search & Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari satker / bank di pratinjau..."
                  value={previewSearch}
                  onChange={(e) => {
                    setPreviewSearch(e.target.value);
                    setPreviewPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="text-xs text-slate-500 font-semibold">
                Menampilkan {paginatedPreviewRows.length} dari {filteredPreviewData.length} baris
              </div>
            </div>

            {/* Table Preview */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black">
                  <tr>
                    <th className="py-3 px-3.5 text-center w-12">No</th>
                    <th className="py-3 px-3.5">Kode Satker</th>
                    <th className="py-3 px-3.5">Nama Satker</th>
                    <th className="py-3 px-3.5 text-center">Jumlah Transaksi</th>
                    <th className="py-3 px-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">Total Nominal (Rp)</th>
                    <th className="py-3 px-3.5">Bank Penerbit</th>
                    <th className="py-3 px-3.5 font-mono">Tgl SP2D Terakhir</th>
                    <th className="py-3 px-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedPreviewRows.map((r: any, idx: number) => {
                    const rowNum = (previewPage - 1) * 10 + idx + 1;
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3.5 text-center font-mono text-slate-400">{rowNum}</td>
                        <td className="py-2.5 px-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{r.kodeSatker}</td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate">{r.namaSatker}</td>
                        <td className="py-2.5 px-3.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                          {r.jumlahTransaksi} SP2D
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(r.totalNominal)}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 truncate max-w-[140px]">{r.bankPenerbit || '-'}</td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-500 dark:text-slate-400">{r.tglSp2dTerakhir || '-'}</td>
                        <td className="py-2.5 px-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.statusKeaktifan === 'Sangat Aktif'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : r.statusKeaktifan === 'Aktif'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}>
                            {r.statusKeaktifan || 'Aktif'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Preview Pagination */}
            {previewTotalPages > 1 && (
              <div className="flex items-center justify-between px-2 pt-2 text-xs">
                <span className="text-slate-500">Halaman {previewPage} dari {previewTotalPages}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={previewPage <= 1}
                    onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold disabled:opacity-40"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={previewPage >= previewTotalPages}
                    onClick={() => setPreviewPage(p => Math.min(previewTotalPages, p + 1))}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold disabled:opacity-40"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Active Dataset Management Table (When records exist) */}
      {effectiveCount > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-xl">
          
          {/* Table Header & Search Filter */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Daftar Data Transaksi KKP Aktif ({effectiveRecords.length} Satker)</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kelola, filter, cari, atau hapus data transaksi KKP per Satuan Kerja.
              </p>
            </div>

            {/* Bulk Action Buttons if items selected */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/60 px-3.5 py-1.5 rounded-2xl border border-rose-200 dark:border-rose-800 animate-fadeIn">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  {selectedIds.size} Satker dipilih
                </span>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3 py-1 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Hapus Terpilih
                </button>
              </div>
            )}
          </div>

          {/* Search, Bank Filter & Page Size */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode/nama satker, SP2D, bank..."
                  value={searchTableQuery}
                  onChange={(e) => {
                    setSearchTableQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                />
              </div>

              {availableBanks.length > 1 && (
                <select
                  value={bankFilter}
                  onChange={(e) => {
                    setBankFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Bank Mitra ({activeStats.uniqueBanks})</option>
                  {availableBanks.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              )}

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="Sangat Aktif">Sangat Aktif</option>
                <option value="Aktif">Aktif</option>
                <option value="Perlu Akselerasi">Perlu Akselerasi</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Tampilkan:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value={10}>10 Baris</option>
                <option value={25}>25 Baris</option>
                <option value={50}>50 Baris</option>
                <option value={100}>100 Baris</option>
              </select>
            </div>
          </div>

          {/* Active Data Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-black">
                <tr>
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === filteredActiveRecords.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-3">Kode Satker</th>
                  <th className="py-3 px-3">Nama Satker &amp; K/L</th>
                  <th className="py-3 px-3 text-center">Frekuensi SP2D</th>
                  <th className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">Total Belanja (Rp)</th>
                  <th className="py-3 px-3">Bank Penerbit</th>
                  <th className="py-3 px-3 font-mono">No / Tgl SP2D</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center w-16">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada data transaksi KKP yang sesuai dengan pencarian / filter.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r, idx) => {
                    const rowNum = (currentPage - 1) * pageSize + idx + 1;
                    const isSelected = selectedIds.has(r.id);
                    return (
                      <tr
                        key={r.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(r.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-400">{rowNum}</td>
                        <td className="py-3 px-3 font-mono font-black text-indigo-600 dark:text-indigo-400">{r.kodeSatker}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate">{r.namaSatker}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{r.kementerianLembaga || '-'}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-extrabold text-slate-800 dark:text-slate-200">
                          {r.jumlahTransaksi} SP2D
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatRupiah(r.totalNominal)}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[130px]">{r.bankPenerbit || '-'}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          <div>{r.noSp2dTerakhir || '-'}</div>
                          <div className="text-[10px] text-slate-400">{r.tglSp2dTerakhir || '-'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                            r.statusKeaktifan === 'Sangat Aktif'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : r.statusKeaktifan === 'Aktif'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}>
                            {r.statusKeaktifan || 'Aktif'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteSingleRecord(r.id, r.namaSatker)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all cursor-pointer"
                            title="Hapus data satker ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Active Table Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Menampilkan <strong>{paginatedRecords.length}</strong> dari <strong>{filteredActiveRecords.length}</strong> Satker KKP
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-bold text-slate-800 dark:text-slate-200">
                Halaman {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Guaranteed Fail-safe Modal: Kosongkan Seluruh Data */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                Kosongkan Seluruh Data Transaksi KKP?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tindakan ini akan <strong>menghapus total {effectiveCount} Satker</strong> transaksi KKP dari dashboard dan menyinkronkannya ke Firebase (0 Satker).
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeClearAll}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 font-black text-xs text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                Ya, Kosongkan Total
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guaranteed Fail-safe Modal: Reset ke Awal */}
      {showResetDefaultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <RefreshCw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                Reset ke Data Awal Transaksi KKP?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tindakan ini akan memuat kembali data sampel bawaan KKP ({INITIAL_TRANSAKSI_KKP_DATA.length} Satker) ke dashboard.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetDefaultModal(false)}
                className="flex-1 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeResetDefault}
                className="flex-1 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 font-black text-xs text-white shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
              >
                Ya, Muat Data Awal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
