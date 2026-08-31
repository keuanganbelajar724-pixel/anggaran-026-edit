import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Download,
  Receipt,
  Zap,
  Phone,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
  Check,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  Eye,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Database,
  HelpCircle,
  Clock,
  Send,
  AlertTriangle
} from 'lucide-react';
import { MasterSatker, SPMPPPRecord } from '../../types';
import { validateSPMPPPExcelFile, downloadSPMPPPTemplate, exportSPMPPPToExcel } from '../../utils/modularExcelProcessors';

interface UploadSPMPPPSectionProps {
  satkers?: any[];
  masterSatkers?: MasterSatker[];
  spmPppRecords?: SPMPPPRecord[];
  onApplySPMPPP?: (records: SPMPPPRecord[]) => void;
  onClearSPMPPP?: () => void;
  onUploadSuccess?: (records: SPMPPPRecord[], batchInfo: any) => void;
  onResetData?: () => void;
  requestConfirm?: any;
  currentRecordsCount?: number;
  addLog?: (action: string, category: 'AUTH' | 'UPLOAD' | 'SETTINGS' | 'ANNOUNCEMENT', details: string, status?: 'SUCCESS' | 'WARNING' | 'INFO') => void;
  showToast?: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
  isDark?: boolean;
}

export const UploadSPMPPPSection: React.FC<UploadSPMPPPSectionProps> = ({
  satkers = [],
  masterSatkers = [],
  spmPppRecords = [],
  onApplySPMPPP,
  onClearSPMPPP,
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
  const [serviceFilter, setServiceFilter] = useState<'ALL' | 'PLN' | 'TELKOM'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const effectiveRecords = useMemo(() => {
    return Array.isArray(spmPppRecords) ? spmPppRecords : [];
  }, [spmPppRecords]);

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
    const totalCount = effectiveRecords.length;
    const totalNominal = effectiveRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);

    const plnRecords = effectiveRecords.filter(r => r.jenisLayanan === 'PLN');
    const plnCount = plnRecords.length;
    const plnNominal = plnRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);

    const telkomRecords = effectiveRecords.filter(r => r.jenisLayanan === 'TELKOM');
    const telkomCount = telkomRecords.length;
    const telkomNominal = telkomRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);

    const belumRecords = effectiveRecords.filter(
      r => !r.statusSpm || r.statusSpm.toLowerCase().includes('belum') || (!r.noSpm && !r.noSp2d)
    );
    const belumCount = belumRecords.length;
    const belumNominal = belumRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);

    const selesaiRecords = effectiveRecords.filter(
      r => r.noSp2d || (r.statusSpm && r.statusSpm.toLowerCase().includes('sp2d'))
    );
    const selesaiCount = selesaiRecords.length;
    const selesaiNominal = selesaiRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);

    const prosesRecords = effectiveRecords.filter(
      r => !belumRecords.includes(r) && !selesaiRecords.includes(r)
    );
    const prosesCount = prosesRecords.length;

    const uniqueSatkers = new Set(effectiveRecords.map(r => r.kodeSatker)).size;
    const uniqueSatkerBelum = new Set(belumRecords.map(r => r.kodeSatker)).size;

    return {
      totalCount,
      totalNominal,
      plnCount,
      plnNominal,
      telkomCount,
      telkomNominal,
      belumCount,
      belumNominal,
      selesaiCount,
      selesaiNominal,
      prosesCount,
      uniqueSatkers,
      uniqueSatkerBelum
    };
  }, [effectiveRecords]);

  // Distinct statuses breakdown from Excel Kolom L
  const distinctStatuses = useMemo(() => {
    const counts: Record<string, number> = {};
    effectiveRecords.forEach(r => {
      const raw = (r.statusSpm && r.statusSpm.trim() !== '') ? r.statusSpm.trim() : 'Belum membuat SPP';
      counts[raw] = (counts[raw] || 0) + 1;
    });
    return counts;
  }, [effectiveRecords]);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      setIsProcessing(true);
      const validation = await validateSPMPPPExcelFile(file, masterSatkers, selectedPeriod, 2026);
      const validCount = (validation.validData || (validation as any).validRecords || []).length;
      setPreviewData({
        fileName: file.name,
        fileSize: file.size,
        ...validation
      });
      setPreviewPage(1);
      showToast?.({
        type: 'success',
        title: 'File Berhasil Dibaca',
        message: `Ditemukan ${validCount} baris data tagihan SPM PPP yang siap diunggah.`
      });
    } catch (err: any) {
      showToast?.({
        type: 'error',
        title: 'Gagal Membaca File Excel',
        message: err.message || 'Format file Excel tidak sesuai dengan template SPM PPP.'
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Apply previewed data to active state
  const handleApplyData = () => {
    const recordsToApply: SPMPPPRecord[] = previewData?.validData || previewData?.validRecords || [];
    if (!previewData || recordsToApply.length === 0) return;

    const newRecords: SPMPPPRecord[] = recordsToApply;
    let finalRecords: SPMPPPRecord[] = [];

    if (importMode === 'replace') {
      finalRecords = newRecords;
    } else {
      // Append mode: merge based on unique ID or KD_SATKER+NO_PELANGGAN+PERIODE
      const existingMap = new Map<string, SPMPPPRecord>();
      effectiveRecords.forEach(r => {
        const key = `${r.kodeSatker}-${r.noPelanggan}-${r.periodeTagihan}`;
        existingMap.set(key, r);
      });

      newRecords.forEach(r => {
        const key = `${r.kodeSatker}-${r.noPelanggan}-${r.periodeTagihan}`;
        existingMap.set(key, r);
      });

      finalRecords = Array.from(existingMap.values());
    }

    if (onApplySPMPPP) {
      onApplySPMPPP(finalRecords);
    }

    if (onUploadSuccess) {
      onUploadSuccess(finalRecords, {
        fileName: previewData.fileName,
        validCount: newRecords.length,
        totalNominal: previewData.summary?.totalNominal,
        period: selectedPeriod
      });
    }

    addLog?.(
      'UPLOAD_SPM_PPP',
      'UPLOAD',
      `Berhasil mengunggah ${newRecords.length} data tagihan SPM PPP (${importMode === 'replace' ? 'Ganti Semua' : 'Tambahkan'}). Total sekarang: ${finalRecords.length} tagihan.`,
      'SUCCESS'
    );

    showToast?.({
      type: 'success',
      title: 'Data SPM PPP Berhasil Diterapkan!',
      message: `${finalRecords.length} data tagihan daya & jasa kini aktif pada Dashboard SPM PPP.`
    });

    setPreviewData(null);
  };

  // Clear all data
  const handleClearAll = () => {
    const doClear = () => {
      try {
        if (onClearSPMPPP) {
          onClearSPMPPP();
        } else if (onResetData) {
          onResetData();
        }
        addLog?.('CLEAR_SPM_PPP', 'SETTINGS', 'Mengosongkan seluruh data monitoring SPM PPP.', 'WARNING');
        showToast?.({
          type: 'success',
          title: 'Data Berhasil Dikosongkan',
          message: 'Semua data monitoring SPM PPP telah dihapus dari sistem.'
        });
      } catch (err) {
        console.error('Error clearing SPM PPP data:', err);
      }
    };

    if (typeof requestConfirm === 'function') {
      requestConfirm(
        'Kosongkan Seluruh Data SPM PPP?',
        `Terdapat ${effectiveCount} baris data tagihan (${formatRupiah(activeStats.totalNominal)}) yang tersimpan. Tindakan ini akan mengosongkan seluruh data pada dashboard SPM PPP.`,
        doClear,
        {
          variant: 'danger',
          iconType: 'trash',
          confirmText: 'Ya, Hapus Semua Data',
          cancelText: 'Batal'
        }
      );
    } else {
      if (window.confirm('Apakah Anda yakin ingin menghapus seluruh data SPM PPP?')) {
        doClear();
      }
    }
  };

  // Batch delete selected rows
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const countToDelete = selectedIds.size;

    const doDelete = () => {
      try {
        const remaining = effectiveRecords.filter(r => !selectedIds.has(r.id));
        if (onApplySPMPPP) onApplySPMPPP(remaining);
        setSelectedIds(new Set());
        showToast?.({
          type: 'success',
          title: 'Data Dihapus',
          message: `Berhasil menghapus ${countToDelete} data tagihan.`
        });
      } catch (err) {
        console.error('Error deleting selected SPM PPP data:', err);
      }
    };

    if (typeof requestConfirm === 'function') {
      requestConfirm(
        `Hapus ${countToDelete} Data Terpilih?`,
        'Baris tagihan yang dipilih akan dihapus secara permanen dari dataset aktif.',
        doDelete,
        {
          variant: 'danger',
          iconType: 'trash',
          confirmText: 'Hapus Terpilih',
          cancelText: 'Batal'
        }
      );
    } else {
      doDelete();
    }
  };

  // Filtered active records
  const filteredActiveRecords = useMemo(() => {
    return effectiveRecords.filter(r => {
      // Service filter
      if (serviceFilter !== 'ALL' && r.jenisLayanan !== serviceFilter) return false;

      // Status filter
      const rawStatus = (r.statusSpm && r.statusSpm.trim() !== '') ? r.statusSpm.trim() : 'Belum membuat SPP';
      const isBelum = !r.statusSpm || r.statusSpm.toLowerCase().includes('belum') || (!r.noSpm && !r.noSp2d);
      const isSelesai = r.noSp2d || (r.statusSpm && r.statusSpm.toLowerCase().includes('sp2d'));
      const isProses = !isBelum && !isSelesai;

      if (statusFilter === 'ALL') {
        // pass
      } else if (statusFilter === 'BELUM') {
        if (!isBelum) return false;
      } else if (statusFilter === 'SELESAI' || statusFilter === 'SP2D') {
        if (!isSelesai) return false;
      } else if (statusFilter === 'PROSES') {
        if (!isProses) return false;
      } else {
        // Exact status filter (e.g., 'Upload NTT', 'Setuju SPP', 'Cetak SPP', 'Cetak SPM', 'Belum membuat SPP')
        if (rawStatus.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // Search query
      if (searchTableQuery.trim()) {
        const q = searchTableQuery.toLowerCase();
        const matchKode = r.kodeSatker.toLowerCase().includes(q);
        const matchNama = (r.namaSatker || '').toLowerCase().includes(q);
        const matchPelanggan = (r.noPelanggan || '').toLowerCase().includes(q);
        const matchSpp = (r.noSpp || '').toLowerCase().includes(q);
        const matchSpm = (r.noSpm || '').toLowerCase().includes(q);
        const matchSp2d = (r.noSp2d || '').toLowerCase().includes(q);
        const matchStatus = (r.statusSpm || '').toLowerCase().includes(q);

        return matchKode || matchNama || matchPelanggan || matchSpp || matchSpm || matchSp2d || matchStatus;
      }

      return true;
    });
  }, [effectiveRecords, serviceFilter, statusFilter, searchTableQuery]);

  // Paginated active records
  const paginatedActiveRecords = useMemo(() => {
    if (pageSize <= 0) return filteredActiveRecords;
    const start = (currentPage - 1) * pageSize;
    return filteredActiveRecords.slice(start, start + pageSize);
  }, [filteredActiveRecords, currentPage, pageSize]);

  const totalPages = pageSize <= 0 ? 1 : (Math.ceil(filteredActiveRecords.length / pageSize) || 1);

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedActiveRecords.length && paginatedActiveRecords.length > 0) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(selectedIds);
      paginatedActiveRecords.forEach(r => newSet.add(r.id));
      setSelectedIds(newSet);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-amber-200'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/30">
              <Receipt className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Unggah & Kelola Data Tagihan SPM PPP
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  PLN & TELKOM
                </span>
              </div>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Monitoring penyelesaian Surat Perintah Membayar Perhitungan Fihak Ketiga (SPM PPP) atas tagihan langganan daya & jasa satker.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={downloadSPMPPPTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-all shadow-sm"
              title="Unduh format template Excel SPM PPP resmi"
            >
              <Download className="w-4 h-4 text-amber-600" />
              Unduh Template Excel
            </button>
            <button
              onClick={() => exportSPMPPPToExcel(effectiveRecords, 'Monitoring_SPM_PPP_KPPN.xlsx', selectedPeriod)}
              disabled={effectiveCount === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Ekspor seluruh data aktif ke file Excel multi-sheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Ekspor ke Excel ({effectiveCount})
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Tagihan Aktif</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {effectiveCount.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">Invoice</span>
            </div>
            <div className="text-xs font-semibold text-blue-600 mt-0.5">
              {formatRupiah(activeStats.totalNominal)}
            </div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Dari {activeStats.uniqueSatkers} Satker terdaftar
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-rose-200 shadow-sm ring-1 ring-rose-500/20'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">Belum Mengajukan SPM</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-600">
              {activeStats.belumCount.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">Tagihan</span>
            </div>
            <div className="text-xs font-bold text-rose-700 mt-0.5">
              {formatRupiah(activeStats.belumNominal)}
            </div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {activeStats.uniqueSatkerBelum} Satker perlu diingatkan
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tagihan Listrik (PLN)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-black ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              {activeStats.plnCount.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">Tagihan</span>
            </div>
            <div className="text-xs font-semibold text-amber-600 mt-0.5">
              {formatRupiah(activeStats.plnNominal)}
            </div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Langganan Daya Listrik
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Telepon & Internet (TELKOM)</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-black ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>
              {activeStats.telkomCount.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">Tagihan</span>
            </div>
            <div className="text-xs font-semibold text-indigo-600 mt-0.5">
              {formatRupiah(activeStats.telkomNominal)}
            </div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Jasa Telekomunikasi / Data
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className={`p-6 rounded-2xl border-2 border-dashed ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-amber-50/30 border-amber-300/80'} transition-all text-center`}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          id="spm-ppp-upload-input"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Pilih atau Tarik File Excel Monitoring SPM PPP
            </h4>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Mendukung format .XLSX & .XLS (Kolom: KD_SATKER, NAMA_SATKER, JNS_LAYANAN, NO_PELANGGAN, BULAN, TAHUN, NILAI_TAGIHAN, NO_SPP, NO_SPM, NO_SP2D, STATUS_SPM).
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Membaca File Excel...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Pilih File Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal / Container if file selected */}
      {previewData && (
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800 border-amber-500/30' : 'bg-white border-amber-300 shadow-xl ring-2 ring-amber-500/20'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Pratinjau Hasil Pembacaan File: {previewData.fileName}
                </h4>
                <p className="text-xs text-emerald-600 font-medium">
                  ✓ Valid: {(previewData.validData || previewData.validRecords || []).length} baris | Total Nominal: {formatRupiah(previewData.summary?.totalNominal || 0)}
                </p>
              </div>
            </div>

            {/* Mode selection & Apply */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${importMode === 'replace' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  Ganti Semua
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${importMode === 'append' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  Tambahkan (Append)
                </button>
              </div>

              <button
                onClick={handleApplyData}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
              >
                <Check className="w-4 h-4" />
                Terapkan ke Dashboard
              </button>

              <button
                onClick={() => setPreviewData(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              >
                Batal
              </button>
            </div>
          </div>

          {/* Preview Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className={`text-[11px] uppercase tracking-wider ${isDark ? 'bg-slate-900/60 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                <tr>
                  <th className="px-3 py-2.5">No</th>
                  <th className="px-3 py-2.5">Satker</th>
                  <th className="px-3 py-2.5">Layanan</th>
                  <th className="px-3 py-2.5">No Pelanggan</th>
                  <th className="px-3 py-2.5">Bulan/Tahun</th>
                  <th className="px-3 py-2.5 text-right">Nilai Tagihan</th>
                  <th className="px-3 py-2.5">No SPP</th>
                  <th className="px-3 py-2.5">No SPM</th>
                  <th className="px-3 py-2.5">Status SPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {(previewData.validData || previewData.validRecords || []).slice(0, 10).map((r: SPMPPPRecord, idx: number) => (
                  <tr key={idx} className={isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}>
                    <td className="px-3 py-2 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium">
                      <span className="font-mono font-bold text-amber-600">{r.kodeSatker}</span> - {r.namaSatker}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${r.jenisLayanan === 'PLN' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                        {r.jenisLayanan}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono">{r.noPelanggan || '-'}</td>
                    <td className="px-3 py-2">{r.bulan}/{r.tahun}</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatRupiah(r.nilaiTagihan)}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">{r.noSpp || '-'}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">{r.noSpm || '-'}</td>
                    <td className="px-3 py-2">
                      {(() => {
                        const statusText = (r.statusSpm && r.statusSpm.trim() !== '') ? r.statusSpm.trim() : 'Belum membuat SPP';
                        const lowerStatus = statusText.toLowerCase();
                        let badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
                        if (lowerStatus.includes('sp2d') || lowerStatus.includes('selesai')) {
                          badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                        } else if (lowerStatus.includes('belum')) {
                          badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
                        } else if (lowerStatus.includes('upload') || lowerStatus.includes('ntt')) {
                          badgeClass = 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300';
                        } else if (lowerStatus.includes('setuju')) {
                          badgeClass = 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300';
                        } else if (lowerStatus.includes('spp')) {
                          badgeClass = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
                        } else if (lowerStatus.includes('spm')) {
                          badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
                        }
                        return (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}`}>
                            {statusText}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(previewData.validData || previewData.validRecords || []).length > 10 && (
              <p className="text-xs text-center py-2 text-slate-400 italic">
                Menampilkan 10 dari {(previewData.validData || previewData.validRecords || []).length} baris pratinjau...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Active Data Management Section */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-500" />
              <h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Daftar Tagihan Tersimpan ({effectiveCount})
              </h4>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Kelola, cari, dan tinjau data rincian tagihan langganan daya & jasa yang telah tersimpan.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-xl transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus ({selectedIds.size})
              </button>
            )}

            <button
              onClick={handleClearAll}
              disabled={effectiveCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Semua Data
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari satker, ID pelanggan, SPP/SPM..."
              value={searchTableQuery}
              onChange={e => {
                setSearchTableQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            />
          </div>

          {/* Service Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setServiceFilter('ALL'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${serviceFilter === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Semua Layanan
            </button>
            <button
              onClick={() => { setServiceFilter('PLN'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${serviceFilter === 'PLN' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              PLN ({activeStats.plnCount})
            </button>
            <button
              onClick={() => { setServiceFilter('TELKOM'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${serviceFilter === 'TELKOM' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
            >
              TELKOM ({activeStats.telkomCount})
            </button>
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            >
              <option value="ALL">(Select All) - Semua Status ({effectiveRecords.length})</option>
              {Object.entries(distinctStatuses).map(([stName, cnt]) => (
                <option key={stName} value={stName}>
                  {stName} ({cnt} data)
                </option>
              ))}
            </select>
          </div>

          {/* Page size */}
          <div className="flex items-center justify-end gap-2 text-xs">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tampilkan:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            >
              <option value={10}>10 Baris</option>
              <option value={25}>25 Baris</option>
              <option value={50}>50 Baris</option>
              <option value={100}>100 Baris</option>
              <option value={250}>250 Baris</option>
              <option value={-1}>Semua Data ({filteredActiveRecords.length})</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills (Matching Excel Kolom L AutoFilter) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-3 text-xs scrollbar-thin">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-amber-500" /> Filter Kolom L:
          </span>
          <button
            onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            (Select All) ({effectiveRecords.length})
          </button>
          {Object.entries(distinctStatuses).map(([statusName, count]) => {
            const isSelected = statusFilter.toLowerCase() === statusName.toLowerCase();
            const lower = statusName.toLowerCase();
            let badgeClass = isSelected
              ? 'bg-blue-600 text-white shadow-sm border-blue-600'
              : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
            
            if (lower.includes('upload') || lower.includes('ntt')) {
              badgeClass = isSelected
                ? 'bg-teal-600 text-white shadow-sm border-teal-600'
                : 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800';
            } else if (lower.includes('setuju')) {
              badgeClass = isSelected
                ? 'bg-cyan-600 text-white shadow-sm border-cyan-600'
                : 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800';
            } else if (lower.includes('cetak spp') || (lower.includes('spp') && !lower.includes('belum'))) {
              badgeClass = isSelected
                ? 'bg-indigo-600 text-white shadow-sm border-indigo-600'
                : 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';
            } else if (lower.includes('spm')) {
              badgeClass = isSelected
                ? 'bg-amber-600 text-white shadow-sm border-amber-600'
                : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
            } else if (lower.includes('sp2d') || lower.includes('selesai')) {
              badgeClass = isSelected
                ? 'bg-emerald-600 text-white shadow-sm border-emerald-600'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
            } else if (lower.includes('belum')) {
              badgeClass = isSelected
                ? 'bg-rose-600 text-white shadow-sm border-rose-600'
                : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
            }

            return (
              <button
                key={statusName}
                onClick={() => { setStatusFilter(statusName); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg border text-xs font-bold shrink-0 transition-all ${badgeClass}`}
              >
                {statusName} ({count})
              </button>
            );
          })}
        </div>

        {/* Table of Active Records */}
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-xs text-left">
            <thead className={`text-[11px] uppercase tracking-wider ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
              <tr>
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === paginatedActiveRecords.length && paginatedActiveRecords.length > 0}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3">No</th>
                <th className="px-3 py-3">Satker</th>
                <th className="px-3 py-3">Layanan</th>
                <th className="px-3 py-3">ID / No Pelanggan</th>
                <th className="px-3 py-3">Periode</th>
                <th className="px-3 py-3 text-right">Nilai Tagihan</th>
                <th className="px-3 py-3">No SPP</th>
                <th className="px-3 py-3">No SPM</th>
                <th className="px-3 py-3">No SP2D</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {paginatedActiveRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    Tidak ada data tagihan yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedActiveRecords.map((r, idx) => {
                  const isChecked = selectedIds.has(r.id);
                  const isBelum = !r.statusSpm || r.statusSpm.toLowerCase().includes('belum') || (!r.noSpm && !r.noSp2d);
                  const isSelesai = r.noSp2d || (r.statusSpm && r.statusSpm.toLowerCase().includes('sp2d'));

                  return (
                    <tr
                      key={r.id}
                      className={`${isChecked ? (isDark ? 'bg-amber-950/20' : 'bg-amber-50/50') : ''} ${isDark ? 'hover:bg-slate-700/40' : 'hover:bg-slate-50'} transition-colors`}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectRow(r.id)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-slate-400 font-mono">
                        {(pageSize > 0 ? (currentPage - 1) * pageSize : 0) + idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-medium max-w-[200px] truncate" title={`${r.kodeSatker} - ${r.namaSatker}`}>
                        <span className="font-mono font-bold text-amber-600">{r.kodeSatker}</span> - {r.namaSatker}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                          r.jenisLayanan === 'PLN' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {r.jenisLayanan === 'PLN' ? <Zap className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                          {r.jenisLayanan}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {r.noPelanggan || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px]">
                        {r.bulan}/{r.tahun}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold font-mono text-slate-900 dark:text-white">
                        {formatRupiah(r.nilaiTagihan)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {r.noSpp || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {r.noSpm || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {r.noSp2d || '-'}
                      </td>
                      <td className="px-3 py-2.5">
                        {(() => {
                          const statusText = (r.statusSpm && r.statusSpm.trim() !== '') ? r.statusSpm.trim() : 'Belum membuat SPP';
                          const lowerStatus = statusText.toLowerCase();
                          let badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
                          if (lowerStatus.includes('sp2d') || lowerStatus.includes('selesai')) {
                            badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                          } else if (lowerStatus.includes('belum')) {
                            badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
                          } else if (lowerStatus.includes('upload') || lowerStatus.includes('ntt')) {
                            badgeClass = 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300';
                          } else if (lowerStatus.includes('setuju')) {
                            badgeClass = 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300';
                          } else if (lowerStatus.includes('spp')) {
                            badgeClass = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
                          } else if (lowerStatus.includes('spm')) {
                            badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
                          }
                          return (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}`}>
                              {statusText}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {filteredActiveRecords.length > 0 && (
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              {pageSize <= 0
                ? `Menampilkan semua (${filteredActiveRecords.length} data)`
                : `Menampilkan ${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, filteredActiveRecords.length)} dari ${filteredActiveRecords.length} data`}
            </span>

            {pageSize > 0 && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className={`px-3 py-1.5 rounded-lg font-semibold ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900'}`}>
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
