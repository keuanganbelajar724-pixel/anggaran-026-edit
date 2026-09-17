import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  Trash2,
  Check,
  Building2,
  Eye,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Database,
  Lock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  UserCheck,
  Award,
  ShieldCheck,
  Users,
  Phone,
  Mail,
  Copy,
  Clock
} from 'lucide-react';
import { MasterSatker, PejabatSertifikasi, SatkerIKPA } from '../../types';
import {
  validatePejabatPerbendaharaanIKPAExcel,
  downloadPejabatIKPATemplate,
  exportPejabatIKPAToExcel,
  ProcessPejabatIKPAResult
} from '../../utils/pejabatPerbendaharaanIKPAProcessor';

interface UploadPejabatIKPASectionProps {
  isDark?: boolean;
  satkers?: SatkerIKPA[];
  masterSatkers?: MasterSatker[];
  pejabatList: PejabatSertifikasi[];
  onApplyPejabatList: (list: PejabatSertifikasi[], satkerPejabatMap?: Record<string, any>) => void;
  onClearPejabatData: () => void;
  requestConfirm: (title: string, message: string, onConfirm: () => void, isDestructive?: boolean) => void;
  showToast: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
  addLog: (action: string, category: 'AUTH' | 'UPLOAD' | 'SETTINGS' | 'ANNOUNCEMENT', details: string, status?: 'SUCCESS' | 'WARNING' | 'INFO') => void;
}

export const UploadPejabatIKPASection: React.FC<UploadPejabatIKPASectionProps> = ({
  isDark = false,
  satkers = [],
  masterSatkers = [],
  pejabatList = [],
  onApplyPejabatList,
  onClearPejabatData,
  requestConfirm,
  showToast,
  addLog
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [previewResult, setPreviewResult] = useState<ProcessPejabatIKPAResult | null>(null);
  const [uploadMode, setUploadMode] = useState<'MERGE' | 'REPLACE_ALL'>('MERGE');

  // Active database view states
  const [searchPejabat, setSearchPejabat] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // KPI counts
  const stats = useMemo(() => {
    const total = pejabatList.length;
    const tersertifikasi = pejabatList.filter(p => p.statusSertifikasi === 'Tersertifikasi').length;
    const belumSertifikat = pejabatList.filter(p => p.statusSertifikasi === 'Belum Tersertifikasi').length;
    const perluPerpanjangan = pejabatList.filter(p => p.statusSertifikasi === 'Belum Perpanjangan').length;
    const kadaluarsa = pejabatList.filter(p => p.statusSertifikasi === 'Kadaluarsa').length;
    const aktif = pejabatList.filter(p => (p.statusJabatan || 'Aktif').toLowerCase() === 'aktif').length;
    const satkerCovered = new Set(pejabatList.map(p => p.kdSatker).filter(Boolean)).size;

    return { total, tersertifikasi, belumSertifikat, perluPerpanjangan, kadaluarsa, aktif, satkerCovered };
  }, [pejabatList]);

  // Handle file select
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCurrentFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await validatePejabatPerbendaharaanIKPAExcel(file, masterSatkers);
      if (!result.validData || result.validData.length === 0) {
        throw new Error('Tidak ada data Pejabat yang valid dalam file Excel.');
      }

      setPreviewResult(result);

      addLog(
        'Upload Excel Pejabat IKPA',
        'UPLOAD',
        `File "${file.name}" diunggah. ${result.validData.length} data Pejabat perbendaharaan terbaca untuk ${result.satkerUpdatedCount} satker.`,
        'SUCCESS'
      );

      showToast({
        type: 'success',
        title: 'File Pejabat Berhasil Terbaca',
        message: `${result.validData.length} data Pejabat dari ${result.satkerUpdatedCount} satker siap diterapkan ke Tab IKPA.`
      });
    } catch (err: any) {
      const errMsg = err.message || 'Gagal membaca file Excel Pejabat Perbendaharaan.';
      setErrorMessage(errMsg);
      setPreviewResult(null);
      addLog('Gagal Olah Pejabat IKPA', 'UPLOAD', `Gagal olah file "${file.name}": ${errMsg}`, 'WARNING');
      showToast({
        type: 'error',
        title: 'Gagal Memproses File',
        message: errMsg
      });
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  // Apply preview to active dataset and update IKPA Satker
  const handleApplyPreview = () => {
    if (!previewResult || !previewResult.validData || previewResult.validData.length === 0) return;

    let mergedList: PejabatSertifikasi[] = [];

    if (uploadMode === 'REPLACE_ALL') {
      mergedList = previewResult.validData;
    } else {
      // MERGE & UPDATE by NIP & kdSatker & nmJabatan
      const map = new Map<string, PejabatSertifikasi>();
      pejabatList.forEach(p => {
        const key = `${p.kdSatker || ''}_${p.nip || ''}_${(p.nmJabatan || '').toLowerCase()}`;
        map.set(key, p);
      });

      previewResult.validData.forEach(newP => {
        const key = `${newP.kdSatker || ''}_${newP.nip || ''}_${(newP.nmJabatan || '').toLowerCase()}`;
        map.set(key, newP);
      });

      mergedList = Array.from(map.values());
    }

    onApplyPejabatList(mergedList, previewResult.satkerPejabatOperatorMap);

    addLog(
      'Update Pejabat Perbendaharaan IKPA',
      'UPLOAD',
      `${previewResult.validData.length} data Pejabat (${uploadMode}) berhasil disimpan dan disinkronkan ke Tab IKPA.`,
      'SUCCESS'
    );

    showToast({
      type: 'success',
      title: 'Data Pejabat di Tab IKPA Diperbarui',
      message: `Total ${mergedList.length} Pejabat Perbendaharaan berhasil disinkronkan dengan Satker di Tab IKPA!`
    });

    setPreviewResult(null);
    setCurrentFileName('');
  };

  // Filtered active records
  const filteredPejabat = useMemo(() => {
    return pejabatList.filter(p => {
      // Role filter
      if (filterRole !== 'ALL') {
        const jab = (p.nmJabatan || '').toLowerCase();
        if (filterRole === 'KPA' && !jab.includes('kpa') && !jab.includes('kuasa')) return false;
        if (filterRole === 'PPK' && !jab.includes('ppk') && !jab.includes('pembuat komitmen')) return false;
        if (filterRole === 'PPSPM' && !jab.includes('ppspm') && !jab.includes('penandatangan') && !jab.includes('penanda tangan')) return false;
        if (filterRole === 'BENDAHARA' && !jab.includes('bendahara')) return false;
        if (filterRole === 'OPERATOR' && !jab.includes('operator')) return false;
      }

      // Status filter
      if (filterStatus !== 'ALL') {
        if (p.statusSertifikasi !== filterStatus) return false;
      }

      // Search query
      if (searchPejabat) {
        const q = searchPejabat.toLowerCase();
        const namaMatch = (p.nama || '').toLowerCase().includes(q);
        const nipMatch = (p.nip || '').toLowerCase().includes(q);
        const satkerMatch = (p.nmSatker || '').toLowerCase().includes(q) || (p.kdSatker || '').includes(q);
        const noSertMatch = (p.noSertifikat || '').toLowerCase().includes(q);
        const jabMatch = (p.nmJabatan || '').toLowerCase().includes(q);
        if (!namaMatch && !nipMatch && !satkerMatch && !noSertMatch && !jabMatch) return false;
      }

      return true;
    });
  }, [pejabatList, filterRole, filterStatus, searchPejabat]);

  const totalPages = Math.max(1, Math.ceil(filteredPejabat.length / itemsPerPage));
  const paginatedPejabat = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPejabat.slice(start, start + itemsPerPage);
  }, [filteredPejabat, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border-emerald-800/40' : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-emerald-200'} shadow-sm`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-600 text-white shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Update Data Pejabat di Tab IKPA</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
              Upload Pejabat Perbendaharaan Satker (Versi IKPA)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Unggah file Excel data seluruh Pejabat Perbendaharaan (KPA, PPK, PPSPM, Bendahara Pengeluaran, Operator) untuk seluruh satker. Data ini secara otomatis mengupdate informasi kontak, status sertifikat, dan detail pejabat di <strong>Tab IKPA &amp; Modal Detail Satker</strong> tanpa mengganggu data sertifikasi SIMASPATEN.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadPejabatIKPATemplate}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700'
                  : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Unduh Template Excel IKPA</span>
            </button>
            {pejabatList.length > 0 && (
              <button
                type="button"
                onClick={() => exportPejabatIKPAToExcel(pejabatList)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Database Excel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
        <button
          type="button"
          onClick={() => { setFilterStatus('ALL'); setFilterRole('ALL'); }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterStatus === 'ALL' && filterRole === 'ALL'
              ? 'ring-2 ring-indigo-500 shadow-md ' + (isDark ? 'bg-indigo-950/70 border-indigo-500/60' : 'bg-indigo-50 border-indigo-300')
              : isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="text-slate-500 dark:text-slate-400 block font-semibold text-[11px]">Total Pejabat</span>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
            {stats.total} <span className="text-xs font-normal text-slate-400">Orang</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('Tersertifikasi')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterStatus === 'Tersertifikasi'
              ? 'ring-2 ring-emerald-500 shadow-md ' + (isDark ? 'bg-emerald-950/70 border-emerald-500/60' : 'bg-emerald-50 border-emerald-300')
              : isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50'
          }`}
        >
          <span className="text-emerald-700 dark:text-emerald-300 block font-semibold text-[11px]">Tersertifikasi</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {stats.tersertifikasi} <span className="text-xs font-normal text-slate-400">Orang</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('Belum Tersertifikasi')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterStatus === 'Belum Tersertifikasi'
              ? 'ring-2 ring-rose-500 shadow-md ' + (isDark ? 'bg-rose-950/70 border-rose-500/60' : 'bg-rose-50 border-rose-300')
              : isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-rose-50/40 border-rose-100 hover:bg-rose-50'
          }`}
        >
          <span className="text-rose-700 dark:text-rose-300 block font-semibold text-[11px]">Belum Sertifikat</span>
          <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {stats.belumSertifikat} <span className="text-xs font-normal text-slate-400">Orang</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('Belum Perpanjangan')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterStatus === 'Belum Perpanjangan'
              ? 'ring-2 ring-amber-500 shadow-md ' + (isDark ? 'bg-amber-950/70 border-amber-500/60' : 'bg-amber-50 border-amber-300')
              : isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-amber-50/40 border-amber-100 hover:bg-amber-50'
          }`}
        >
          <span className="text-amber-700 dark:text-amber-300 block font-semibold text-[11px]">Perlu Perpanjangan</span>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {stats.perluPerpanjangan} <span className="text-xs font-normal text-slate-400">Orang</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('Kadaluarsa')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            filterStatus === 'Kadaluarsa'
              ? 'ring-2 ring-red-500 shadow-md ' + (isDark ? 'bg-red-950/70 border-red-500/60' : 'bg-red-50 border-red-300')
              : isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-red-50/40 border-red-100 hover:bg-red-50'
          }`}
        >
          <span className="text-red-700 dark:text-red-300 block font-semibold text-[11px]">Kadaluarsa</span>
          <span className="text-xl font-black text-red-600 dark:text-red-400 mt-1 block">
            {stats.kadaluarsa} <span className="text-xs font-normal text-slate-400">Orang</span>
          </span>
        </button>

        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-sky-50/50 border-sky-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold text-[11px]">Satker Tercover</span>
          <span className="text-xl font-black text-sky-600 dark:text-sky-400 mt-1 block">
            {stats.satkerCovered} <span className="text-xs font-normal text-slate-400">Satker</span>
          </span>
        </div>
      </div>

      {/* Upload Dropzone Box */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Upload className="w-5 h-5 text-emerald-600" />
              <span>Unggah File Excel Pejabat Perbendaharaan Satker</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mendukung file Excel (.xlsx, .xls) &amp; CSV daftar pejabat perbendaharaan untuk seluruh satker.
            </p>
          </div>

          {pejabatList.length > 0 && (
            <button
              type="button"
              onClick={() => {
                requestConfirm(
                  'Kosongkan Database Pejabat IKPA',
                  `Apakah Anda yakin ingin mengosongkan seluruh database Pejabat Perbendaharaan IKPA (${pejabatList.length} Pejabat)? Data sertifikasi SIMASPATEN dan data IKPA lainnya tetap aman.`,
                  () => {
                    onClearPejabatData();
                    addLog('Kosongkan Pejabat IKPA', 'UPLOAD', 'Seluruh data Pejabat Perbendaharaan IKPA dikosongkan.', 'WARNING');
                    showToast({
                      type: 'info',
                      title: 'Data Pejabat Dikosongkan',
                      message: 'Database Pejabat Perbendaharaan IKPA telah dikosongkan.'
                    });
                  },
                  true
                );
              }}
              className="px-3.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Pejabat IKPA</span>
            </button>
          )}
        </div>

        {/* Dropzone Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
            isProcessing
              ? 'border-emerald-400 bg-emerald-50/20 opacity-70 cursor-wait'
              : isDark
              ? 'border-slate-700 hover:border-emerald-500 hover:bg-slate-800/50'
              : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              {isProcessing ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-8 h-8" />
              )}
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                {isProcessing
                  ? 'Sedang membaca dan memvalidasi file Excel...'
                  : 'Klik atau Tarik File Excel Pejabat ke Sini'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Format yang didukung: .XLSX, .XLS, .CSV (Kolom: Kode Satker, Nama Satker, NIP, Nama Pejabat, Jabatan, Sertifikat, dll.)
              </p>
            </div>
            {currentFileName && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentFileName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Gagal Memproses File</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Preview & Apply Card */}
        {previewResult && (
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>File Siap Diterapkan</span>
                </div>
                <h5 className="font-black text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                  Pratinjau Data Pejabat Perbendaharaan ({previewResult.validData.length} Pejabat dari {previewResult.satkerUpdatedCount} Satker)
                </h5>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewResult(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyPreview}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Terapkan &amp; Update Pejabat di Tab IKPA</span>
                </button>
              </div>
            </div>

            {/* Mode selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setUploadMode('MERGE')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  uploadMode === 'MERGE'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 font-bold text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-black">1. Gabungkan &amp; Perbarui (Merge) - Disarankan</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Memperbarui data pejabat perbendaharaan pada satker yang ada dalam file Excel, dan mempertahankan data lainnya.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('REPLACE_ALL')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  uploadMode === 'REPLACE_ALL'
                    ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/80 font-bold text-rose-900 dark:text-rose-200 ring-2 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-black">2. Timpa Seluruh Database (Replace All)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Mengosongkan database pejabat sebelumnya dan hanya menyimpan data dari file Excel ini.
                </div>
              </button>
            </div>

            {/* Preview sample table */}
            <div className="overflow-x-auto max-h-64 border rounded-xl border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-200 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 uppercase sticky top-0">
                  <tr>
                    <th className="py-2 px-3">No</th>
                    <th className="py-2 px-3">Satker</th>
                    <th className="py-2 px-3">Nama Pejabat &amp; NIP</th>
                    <th className="py-2 px-3">Jabatan</th>
                    <th className="py-2 px-3 text-center">Status Sertifikat</th>
                    <th className="py-2 px-3">No Sertifikat &amp; Masa Berlaku</th>
                    <th className="py-2 px-3">Kontak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {previewResult.validData.slice(0, 8).map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-100 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">{p.nmSatker}</span>
                        <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{p.kdSatker}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{p.nama}</span>
                        <span className="font-mono text-[10px] text-slate-500">{p.nip}</span>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">{p.nmJabatan}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.statusSertifikasi === 'Tersertifikasi'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                            : p.statusSertifikasi === 'Kadaluarsa'
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300'
                            : p.statusSertifikasi === 'Belum Perpanjangan'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300'
                        }`}>
                          {p.statusSertifikasi}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px]">
                        <div>{p.noSertifikat}</div>
                        {p.tglKadaluarsa && p.tglKadaluarsa !== '-' && (
                          <div className="text-[10px] text-slate-400">Exp: {p.tglKadaluarsa}</div>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {p.noHp && p.noHp !== '-' ? p.noHp : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewResult.validData.length > 8 && (
              <p className="text-[11px] text-center text-slate-400 italic">
                Menampilkan 8 dari {previewResult.validData.length} baris data pratinjau. Klik tombol &quot;Terapkan&quot; di atas untuk menyimpan seluruh data.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Active Database View */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold mb-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>DATABASE PEJABAT SATKER DI IKPA</span>
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Daftar Pejabat Perbendaharaan Aktif ({pejabatList.length} Pejabat)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daftar pejabat yang tampil di Tab IKPA per satker (KPA, PPK, PPSPM, Bendahara Pengeluaran, Operator).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchPejabat}
                onChange={(e) => { setSearchPejabat(e.target.value); setCurrentPage(1); }}
                placeholder="Cari satker, nama, NIP, no sertifikat..."
                className="w-full pl-9 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Role Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1">Jabatan:</span>
            {[
              { id: 'ALL', label: 'Semua Jabatan' },
              { id: 'KPA', label: 'KPA' },
              { id: 'PPK', label: 'PPK' },
              { id: 'PPSPM', label: 'PPSPM' },
              { id: 'BENDAHARA', label: 'Bendahara' },
              { id: 'OPERATOR', label: 'Operator' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setFilterRole(tab.id); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  filterRole === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1">Status Sertifikat:</span>
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'Tersertifikasi', label: 'Tersertifikasi' },
              { id: 'Belum Tersertifikasi', label: 'Belum Sertifikat' },
              { id: 'Belum Perpanjangan', label: 'Perlu Perpanjangan' },
              { id: 'Kadaluarsa', label: 'Kadaluarsa' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setFilterStatus(tab.id); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  filterStatus === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pejabat List Table */}
        {pejabatList.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-40 text-emerald-500" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Belum ada data Pejabat Perbendaharaan Satker.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Silakan unggah file Excel di atas untuk mengisi pejabat perbendaharaan yang akan tampil pada Tab IKPA dan rincian satker.
            </p>
          </div>
        ) : filteredPejabat.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-xs">Tidak ditemukan pejabat yang cocok dengan pencarian / filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto max-h-[520px] rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 uppercase sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Kode &amp; Satker</th>
                    <th className="py-2.5 px-3">Nama Pejabat &amp; NIP</th>
                    <th className="py-2.5 px-3">Jabatan</th>
                    <th className="py-2.5 px-3 text-center">Status Sertifikat</th>
                    <th className="py-2.5 px-3">Nomor Sertifikat</th>
                    <th className="py-2.5 px-3">Masa Berlaku</th>
                    <th className="py-2.5 px-3">Kontak (HP / Email)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paginatedPejabat.map((p, idx) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                    return (
                      <tr key={p.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{rowNumber}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1 max-w-[200px]" title={p.nmSatker}>
                            {p.nmSatker}
                          </div>
                          <div className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <span>{p.kdSatker}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{p.nama}</div>
                          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <span>{p.nip || '-'}</span>
                            {p.nip && p.nip !== '-' && (
                              <button
                                type="button"
                                onClick={() => handleCopy(p.nip, `nip-${p.id || idx}`)}
                                title="Salin NIP"
                                className="text-slate-400 hover:text-emerald-600 p-0.5"
                              >
                                {copiedId === `nip-${p.id || idx}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                            {p.nmJabatan}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.statusSertifikasi === 'Tersertifikasi'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : p.statusSertifikasi === 'Kadaluarsa'
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                              : p.statusSertifikasi === 'Belum Perpanjangan'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          }`}>
                            {p.statusSertifikasi}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {p.noSertifikat && p.noSertifikat !== 'Belum Ada' && p.noSertifikat !== '-' ? (
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded text-[11px]">
                              {p.noSertifikat}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Belum Ada</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          {p.tglKadaluarsa && p.tglKadaluarsa !== '-' ? (
                            <div>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{p.tglKadaluarsa}</span>
                              {p.isKadaluarsa && (
                                <span className="block text-[10px] text-red-500 font-bold">Kadaluarsa</span>
                              )}
                              {p.isMendekatiKadaluarsa && (
                                <span className="block text-[10px] text-amber-500 font-bold">Exp &lt; 90 hari</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {p.noHp && p.noHp !== '-' && (
                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-mono">
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{p.noHp}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(p.noHp || '', `hp-${p.id || idx}`)}
                                title="Salin No HP"
                                className="text-slate-400 hover:text-emerald-600 p-0.5"
                              >
                                {copiedId === `hp-${p.id || idx}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                          {p.email && p.email !== '-' && (
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">
                              <Mail className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span className="truncate max-w-[150px]" title={p.email}>{p.email}</span>
                            </div>
                          )}
                          {(!p.noHp || p.noHp === '-') && (!p.email || p.email === '-') && (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPejabat.length)} dari {filteredPejabat.length} data
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
