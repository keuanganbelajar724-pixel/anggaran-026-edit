import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Download,
  ShoppingBag,
  CreditCard,
  Receipt,
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
  Database
} from 'lucide-react';
import { MasterSatker, DigipayRecord } from '../../types';
import { validateDigipayExcelFile, downloadDigipayTemplate, exportDigipayToExcel } from '../../utils/modularExcelProcessors';

interface UploadDigipaySectionProps {
  satkers?: any[];
  masterSatkers?: MasterSatker[];
  transaksiDigipayRecords?: DigipayRecord[];
  onApplyTransaksiDigipay?: (records: DigipayRecord[]) => void;
  onClearTransaksiDigipay?: () => void;
  onUploadSuccess?: (records: DigipayRecord[], batchInfo: any) => void;
  onResetData?: () => void;
  requestConfirm?: any;
  currentRecordsCount?: number;
  addLog?: (action: string, category: 'AUTH' | 'UPLOAD' | 'SETTINGS' | 'ANNOUNCEMENT', details: string, status?: 'SUCCESS' | 'WARNING' | 'INFO') => void;
  showToast?: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
  isDark?: boolean;
}

export const UploadDigipaySection: React.FC<UploadDigipaySectionProps> = ({
  satkers = [],
  masterSatkers = [],
  transaksiDigipayRecords = [],
  onApplyTransaksiDigipay,
  onClearTransaksiDigipay,
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

  // Table & Management state for active uploaded records
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'VA' | 'KKP'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const effectiveRecords = useMemo(() => {
    return Array.isArray(transaksiDigipayRecords) ? transaksiDigipayRecords : [];
  }, [transaksiDigipayRecords]);

  const effectiveCount = effectiveRecords.length;

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
    const totalTx = effectiveRecords.length;
    const totalNom = effectiveRecords.reduce((acc, r) => acc + (Number(r.nominalTransaksi) || 0), 0);
    const vaRecords = effectiveRecords.filter(r => r.tipePembayaran === 'VA');
    const totalVA = vaRecords.length;
    const nomVA = vaRecords.reduce((acc, r) => acc + (Number(r.nominalTransaksi) || 0), 0);
    const kkpRecords = effectiveRecords.filter(r => r.tipePembayaran === 'KKP');
    const totalKKP = kkpRecords.length;
    const nomKKP = kkpRecords.reduce((acc, r) => acc + (Number(r.nominalTransaksi) || 0), 0);
    const uniqueSatkers = new Set(effectiveRecords.map(r => r.kodeSatker)).size;

    return { totalTx, totalNom, totalVA, nomVA, totalKKP, nomKKP, uniqueSatkers };
  }, [effectiveRecords]);

  // Filtered active records for management table
  const filteredActiveRecords = useMemo(() => {
    return effectiveRecords.filter(r => {
      if (typeFilter !== 'ALL' && r.tipePembayaran !== typeFilter) return false;
      if (!searchTableQuery.trim()) return true;
      const q = searchTableQuery.toLowerCase();
      return (
        r.kodeSatker.toLowerCase().includes(q) ||
        r.namaSatker.toLowerCase().includes(q) ||
        (r.noTransaksi && r.noTransaksi.toLowerCase().includes(q)) ||
        (r.namaVendor && r.namaVendor.toLowerCase().includes(q)) ||
        (r.namaBank && r.namaBank.toLowerCase().includes(q)) ||
        (r.uraianBarang && r.uraianBarang.toLowerCase().includes(q))
      );
    });
  }, [effectiveRecords, typeFilter, searchTableQuery]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredActiveRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActiveRecords.slice(start, start + pageSize);
  }, [filteredActiveRecords, currentPage, pageSize]);

  // Local Confirmation Dialog State for guaranteed modal operation
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

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

  // 1. CLEAR ALL DATA (FAIL-SAFE & IMMEDIATE)
  const executeClearAll = () => {
    try {
      localStorage.setItem('kppn_transaksi_digipay', '[]');
      localStorage.setItem('kppn_digipay_emptied_v3', 'true');
    } catch (e) {
      console.warn('Error clearing localStorage:', e);
    }

    if (onClearTransaksiDigipay) {
      onClearTransaksiDigipay();
    }
    if (onApplyTransaksiDigipay) {
      onApplyTransaksiDigipay([]);
    }
    if (onResetData) {
      onResetData();
    }

    setShowClearConfirmModal(false);
    setPreviewData(null);
    setSelectedIds(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (addLog) {
      addLog(
        'Kosongkan Transaksi Digipay',
        'SETTINGS',
        'Seluruh data transaksi Digipay (VA & KKP) berhasil dikosongkan (0 Transaksi).',
        'WARNING'
      );
    }

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Data Digipay Berhasil Dikosongkan',
        message: 'Seluruh data transaksi Digipay telah bersih dari sistem (0 Transaksi).'
      });
    }
  };

  const handleClearDataClick = () => {
    if (typeof requestConfirm === 'function') {
      try {
        requestConfirm(
          'Kosongkan Seluruh Data Transaksi Digipay',
          `Apakah Anda yakin ingin menghapus seluruh ${effectiveCount} data transaksi Digipay (VA & KKP) saat ini? Tindakan ini akan mengosongkan dataset menjadi 0 transaksi.`,
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

  // 2. DELETE SINGLE RECORD
  const handleDeleteSingleRecord = (recordId: string, noTransaksi: string) => {
    const updated = effectiveRecords.filter(r => r.id !== recordId);
    if (onApplyTransaksiDigipay) {
      onApplyTransaksiDigipay(updated);
    }
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(recordId);
      return next;
    });

    if (showToast) {
      showToast({
        type: 'info',
        title: 'Transaksi Dihapus',
        message: `Transaksi ${noTransaksi || recordId} berhasil dihapus.`
      });
    }
  };

  // 3. DELETE SELECTED RECORDS
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const countToDelete = selectedIds.size;
    const updated = effectiveRecords.filter(r => !selectedIds.has(r.id));

    if (onApplyTransaksiDigipay) {
      onApplyTransaksiDigipay(updated);
    }
    setSelectedIds(new Set());

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Transaksi Terpilih Dihapus',
        message: `${countToDelete} transaksi berhasil dihapus dari sistem.`
      });
    }
  };

  // 4. DELETE BY TYPE (VA ONLY OR KKP ONLY)
  const handleDeleteByType = (type: 'VA' | 'KKP') => {
    const label = type === 'VA' ? 'Virtual Account (VA)' : 'Kartu Kredit Pemerintah (KKP)';
    const updated = effectiveRecords.filter(r => r.tipePembayaran !== type);
    
    if (onApplyTransaksiDigipay) {
      onApplyTransaksiDigipay(updated);
    }

    if (showToast) {
      showToast({
        type: 'info',
        title: `Transaksi ${type} Dihapus`,
        message: `Seluruh transaksi pembayaran ${label} telah dihapus dari sistem.`
      });
    }
  };

  // File selection & preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const preview = await validateDigipayExcelFile(file, masterSatkers, selectedPeriod, 2026);
      setPreviewData(preview);
      setPreviewPage(1);
      if (showToast) {
        showToast({
          type: 'info',
          title: 'File Excel Berhasil Dibaca',
          message: `Ditemukan ${preview.validData.length} baris transaksi. Silakan periksa pratinjau sebelum menyimpan.`
        });
      }
    } catch (err: any) {
      if (showToast) {
        showToast({
          type: 'error',
          title: 'Gagal Membaca File',
          message: err.message || 'Terjadi kesalahan saat memproses Excel Digipay.'
        });
      } else {
        alert(err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply import
  const handleApplyImport = () => {
    if (!previewData || !previewData.validData || previewData.validData.length === 0) return;

    let finalRecords: DigipayRecord[] = [];
    if (importMode === 'replace') {
      finalRecords = previewData.validData;
    } else {
      // Append mode - avoid duplicates by ID or noTransaksi
      const existingIds = new Set(effectiveRecords.map(r => r.noTransaksi || r.id));
      const newItems = previewData.validData.filter((r: DigipayRecord) => !existingIds.has(r.noTransaksi || r.id));
      finalRecords = [...effectiveRecords, ...newItems];
    }

    const validCount = previewData.validData.length;
    const vaCount = previewData.validData.filter((r: DigipayRecord) => r.tipePembayaran === 'VA').length;
    const kkpCount = previewData.validData.filter((r: DigipayRecord) => r.tipePembayaran === 'KKP').length;

    if (onApplyTransaksiDigipay) {
      onApplyTransaksiDigipay(finalRecords);
    } else if (onUploadSuccess) {
      onUploadSuccess(finalRecords, {
        fileName: previewData.fileName,
        totalRows: previewData.totalRows,
        validCount,
        vaCount,
        kkpCount
      });
    }

    if (addLog) {
      addLog(
        'Upload Excel Transaksi Digipay',
        'UPLOAD',
        `File: ${previewData.fileName} (${validCount} transaksi: ${vaCount} VA, ${kkpCount} KKP) [${importMode.toUpperCase()}]`,
        'SUCCESS'
      );
    }

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Data Digipay Berhasil Disimpan',
        message: `Total ${finalRecords.length} transaksi Digipay (${importMode === 'replace' ? 'Data digantikan' : 'Data ditambahkan'}) tersimpan di sistem.`
      });
    }

    setPreviewData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* 1. MAIN UPLOAD CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                MODUL MONITORING DIGIPAY SATU
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                Saat ini di sistem: <strong className="text-indigo-600 dark:text-indigo-400">{effectiveCount}</strong> Transaksi
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
              Upload &amp; Pengelolaan Data Transaksi Digipay (VA &amp; KKP)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Unggah file laporan monitoring transaksi Digipay. Sistem mendukung format multi-tab (<strong>Tab 1: Pembayaran VA</strong> &amp; <strong>Tab 2: Pembayaran KKP</strong>) dengan deteksi otomatis kolom <strong>Nominal Invoice (Kolom I)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {effectiveCount > 0 && (
              <button
                type="button"
                onClick={handleClearDataClick}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Data ({effectiveCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={downloadDigipayTemplate}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template Format</span>
            </button>
          </div>
        </div>

        {/* Upload Box & Period Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Pilih Periode Laporan:</span>
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full mt-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {['Januari 2026', 'Februari 2026', 'Maret 2026', 'April 2026', 'Mei 2026', 'Juni 2026', 'Juli 2026', 'Agustus 2026', 'September 2026', 'Oktober 2026', 'November 2026', 'Desember 2026'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Metode Penyimpanan:</span>
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                    importMode === 'replace'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Ganti Seluruh Data
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                    importMode === 'append'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Tambahkan ke Data Ada
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Data transaksi Digipay yang diunggah akan otomatis terakumulasi per Satker untuk menentukan peringkat keaktifan dan total belanja transaksi VA maupun KKP.
            </p>
          </div>

          <div className="md:col-span-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/30 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 flex flex-col items-center justify-center space-y-3 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform flex items-center justify-center">
                <Upload className="w-7 h-7" />
              </div>
              <div className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">
                {isProcessing ? 'Memproses dan Memvalidasi Kolom Excel...' : 'Klik atau Tarik File Excel Transaksi Digipay'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                Mendukung multi-sheet (<strong>Pembayaran VA</strong> &amp; <strong>Pembayaran KKP</strong>). Format kolom: Kode Satker, Nama Satker, No Invoice, Tanggal, Vendor, Bank, dan <strong>Nominal Invoice (Kolom I)</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* 2. PREVIEW SECTION (WHEN EXCEL FILE IS SELECTED) */}
        {previewData && (
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 p-5 space-y-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Pratinjau Hasil Pembacaan Excel Digipay
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    File: <strong>{previewData.fileName}</strong> • Terdeteksi <strong>{previewData.validData?.length || 0}</strong> transaksi valid ({previewData.validData?.filter((r: DigipayRecord) => r.tipePembayaran === 'VA').length || 0} VA &amp; {previewData.validData?.filter((r: DigipayRecord) => r.tipePembayaran === 'KKP').length || 0} KKP).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewData(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyImport}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan &amp; Terapkan ke Sistem</span>
                </button>
              </div>
            </div>

            {/* Quick preview stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 text-[11px]">Total Transaksi Terbaca:</span>
                <div className="font-black text-base text-slate-900 dark:text-white mt-0.5">
                  {previewData.validData?.length || 0} Invoice
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 text-[11px]">Transaksi VA (Virtual Account):</span>
                <div className="font-black text-base text-blue-600 dark:text-blue-400 mt-0.5">
                  {previewData.validData?.filter((r: DigipayRecord) => r.tipePembayaran === 'VA').length || 0} Transaksi
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 text-[11px]">Transaksi KKP:</span>
                <div className="font-black text-base text-purple-600 dark:text-purple-400 mt-0.5">
                  {previewData.validData?.filter((r: DigipayRecord) => r.tipePembayaran === 'KKP').length || 0} Transaksi
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 text-[11px]">Total Nominal Belanja:</span>
                <div className="font-black text-base text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                  Rp {previewData.validData?.reduce((acc: number, r: DigipayRecord) => acc + (r.nominalTransaksi || 0), 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Interactive Preview Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Rincian Data yang Akan Diimpor (Sampel Transaksi &amp; Nominal Invoice):</span>
                </span>
                <span className="text-slate-500">
                  Menampilkan {Math.min(previewPage * 8, previewData.validData.length)} dari {previewData.validData.length} baris
                </span>
              </div>

              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">Tipe</th>
                      <th className="p-2.5">Satker</th>
                      <th className="p-2.5">No. Invoice / Transaksi</th>
                      <th className="p-2.5">Tanggal</th>
                      <th className="p-2.5">Vendor / Rekanan</th>
                      <th className="p-2.5">Bank</th>
                      <th className="p-2.5 text-right font-black text-emerald-600 dark:text-emerald-400">Nominal Invoice (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewData.validData.slice(0, previewPage * 8).map((row: DigipayRecord, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            row.tipePembayaran === 'VA'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          }`}>
                            {row.tipePembayaran}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{row.kodeSatker}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{row.namaSatker}</div>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">{row.noTransaksi}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{row.tglTransaksi}</td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{row.namaVendor}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{row.namaBank}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          Rp {(row.nominalTransaksi || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {previewData.validData.length > previewPage * 8 && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 text-center border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewPage(prev => prev + 1)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Muat Baris Lainnya...
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. UPLOADED DATA MANAGEMENT SECTION (SHOWS CURRENT DATA WITH DELETE CONTROLS) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs px-3 py-1 rounded-full mb-1">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span>MANAJEMEN DATA TERUNGGAH ({effectiveCount} TRANSAKSI)</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
              Daftar Transaksi Digipay Aktif di Sistem
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola, pantau, ekspor, atau hapus transaksi secara individual maupun batch untuk menjaga akurasi data.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {effectiveCount > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => exportDigipayToExcel(effectiveRecords)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Ekspor data transaksi aktif ke file Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Ekspor ke Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearDataClick}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Semua ({effectiveCount})</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Active Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Total Transaksi:</span>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
              {activeStats.totalTx} Transaksi
            </div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-bold">
              {activeStats.uniqueSatkers} Satuan Kerja Terlibat
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/70">
            <span className="text-blue-700 dark:text-blue-300 font-semibold">Virtual Account (VA):</span>
            <div className="text-lg sm:text-xl font-black text-blue-700 dark:text-blue-300 mt-1">
              {activeStats.totalVA} Transaksi
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-bold truncate">
              {formatRupiah(activeStats.nomVA)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/70">
            <span className="text-purple-700 dark:text-purple-300 font-semibold">KKP Digipay:</span>
            <div className="text-lg sm:text-xl font-black text-purple-700 dark:text-purple-300 mt-1">
              {activeStats.totalKKP} Transaksi
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-bold truncate">
              {formatRupiah(activeStats.nomKKP)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/70">
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Total Belanja (Nominal):</span>
            <div className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1 truncate">
              {formatRupiah(activeStats.totalNom)}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
              Akumulasi VA &amp; KKP
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setTypeFilter('ALL'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  typeFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Semua ({effectiveCount})
              </button>
              <button
                type="button"
                onClick={() => { setTypeFilter('VA'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  typeFilter === 'VA'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                VA Only ({activeStats.totalVA})
              </button>
              <button
                type="button"
                onClick={() => { setTypeFilter('KKP'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  typeFilter === 'KKP'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                KKP Only ({activeStats.totalKKP})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari satker, no transaksi, vendor..."
                value={searchTableQuery}
                onChange={(e) => { setSearchTableQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Batch deletion for selected checkboxes */}
          {selectedIds.size > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-3 text-xs animate-fadeIn">
              <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Terpilih <strong>{selectedIds.size}</strong> transaksi untuk dihapus.</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Batal Pilih
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer shadow-xs"
                >
                  Hapus {selectedIds.size} Transaksi Terpilih
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={filteredActiveRecords.length > 0 && selectedIds.size === filteredActiveRecords.length}
                      onChange={handleSelectAll}
                      className="rounded text-indigo-600 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-3 w-20">Tipe</th>
                  <th className="py-3 px-3 min-w-[130px]">No. Transaksi / Order</th>
                  <th className="py-3 px-3 min-w-[100px]">Tanggal</th>
                  <th className="py-3 px-3 min-w-[180px]">Satuan Kerja</th>
                  <th className="py-3 px-3 min-w-[150px]">Vendor &amp; Bank</th>
                  <th className="py-3 px-3 text-right min-w-[130px]">Nominal (Rp)</th>
                  <th className="py-3 px-3 min-w-[180px]">Uraian Barang</th>
                  <th className="py-3 px-3 text-center w-16">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {effectiveCount === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2 opacity-60" />
                      <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">
                        Belum Ada Data Transaksi Digipay di Sistem
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Silakan unggah file Excel monitoring transaksi Digipay menggunakan kotak upload di atas.
                      </p>
                    </td>
                  </tr>
                ) : filteredActiveRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      <p className="font-semibold text-xs">
                        Tidak ditemukan transaksi yang sesuai dengan pencarian atau filter tipe.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r, idx) => {
                    const rowNum = (currentPage - 1) * pageSize + idx + 1;
                    const isSelected = selectedIds.has(r.id);

                    return (
                      <tr
                        key={r.id || idx}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(r.id)}
                            className="rounded text-indigo-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500 font-mono">
                          {rowNum}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            r.tipePembayaran === 'VA'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          }`}>
                            {r.tipePembayaran}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {r.noTransaksi || '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {r.tglTransaksi || '-'}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded text-[10px]">
                              {r.kodeSatker}
                            </span>
                            <span className="truncate max-w-[150px]">{r.namaSatker}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                            {r.namaVendor || '-'}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {r.namaBank || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatRupiah(r.nominalTransaksi)}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px] truncate max-w-[200px]">
                          {r.uraianBarang || '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteSingleRecord(r.id, r.noTransaksi)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-all cursor-pointer"
                            title="Hapus baris transaksi ini"
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

          {/* Pagination Controls */}
          {filteredActiveRecords.length > 0 && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>
                  Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredActiveRecords.length)} dari {filteredActiveRecords.length} Transaksi
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 font-bold focus:outline-none"
                >
                  <option value={10}>10 per hal</option>
                  <option value={25}>25 per hal</option>
                  <option value={50}>50 per hal</option>
                  <option value={100}>100 per hal</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-bold text-slate-800 dark:text-slate-200">
                  Hal {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guaranteed Fallback Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Kosongkan Transaksi Digipay?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              Apakah Anda yakin ingin menghapus seluruh <strong className="text-rose-600">{effectiveCount}</strong> data transaksi Digipay (VA &amp; KKP) saat ini? Dataset akan dikosongkan total menjadi 0 transaksi.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeClearAll}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer shadow-lg shadow-rose-900/20 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Kosongkan Total</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
