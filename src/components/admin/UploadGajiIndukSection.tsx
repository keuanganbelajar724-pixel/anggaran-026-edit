import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  SPMGajiRecord,
  SPMGajiUploadBatch,
  MasterSatker,
  GajiIndukJenis
} from '../../types';
import {
  parseMonitoringGajiWorkbook,
  generateSampleGajiIndukExcel,
  generateInitialGajiIndukData,
  formatPeriodeGaji,
  REQUIRED_GAJI_HEADERS
} from '../../utils/gajiIndukExcelParser';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Trash2,
  Download,
  Coins,
  ShieldCheck,
  Layers,
  ArrowRight,
  Info,
  X,
  RefreshCw
} from 'lucide-react';

interface UploadGajiIndukSectionProps {
  records: SPMGajiRecord[];
  uploads: SPMGajiUploadBatch[];
  masterSatkers?: MasterSatker[];
  onApplyRecords?: (newRecords: SPMGajiRecord[], newUploads: SPMGajiUploadBatch[]) => void;
  onUploadSuccess?: (newRecords: SPMGajiRecord[], newBatch: SPMGajiUploadBatch) => void;
  onClearRecords?: () => void;
  onDeleteBatch?: (batchId: string) => void;
  requestConfirm?: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      confirmText?: string;
      cancelText?: string;
      variant?: 'danger' | 'warning' | 'info' | 'success';
      iconType?: 'trash' | 'warning' | 'shield' | 'check' | 'info' | 'sparkles' | 'reload';
    }
  ) => void;
  showToast?: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title?: string; message: string }) => void;
  addLog?: (action: string, category: 'AUTH' | 'UPLOAD' | 'SETTINGS' | 'ANNOUNCEMENT', details: string, status?: 'SUCCESS' | 'WARNING' | 'INFO') => void;
  isDark?: boolean;
}

export const UploadGajiIndukSection: React.FC<UploadGajiIndukSectionProps> = ({
  records,
  uploads,
  masterSatkers = [],
  onApplyRecords,
  onUploadSuccess,
  onClearRecords,
  onDeleteBatch,
  requestConfirm,
  showToast,
  addLog,
  isDark = false
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedPreviewList, setParsedPreviewList] = useState<Array<{
    batch: SPMGajiUploadBatch;
    records: SPMGajiRecord[];
    warnings: string[];
  }> | null>(null);

  // Fallback in-component confirmation modal
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesProcess = async (files: File[]) => {
    setErrorMsg(null);
    setIsLoading(true);

    const validFiles = files.filter(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
    if (validFiles.length === 0) {
      setErrorMsg('Format file tidak didukung. Mohon unggah file Excel berformat .xlsx atau .xls.');
      setIsLoading(false);
      return;
    }

    const results: Array<{
      batch: SPMGajiUploadBatch;
      records: SPMGajiRecord[];
      warnings: string[];
    }> = [];
    const errors: string[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        const parsed = parseMonitoringGajiWorkbook(workbook, file.name, masterSatkers, 'Admin KPPN');

        if (parsed.records.length === 0) {
          errors.push(`File "${file.name}" tidak memuat data transaksi SPM.`);
        } else {
          // Berikan sedikit offset pada batchId agar ID batch unik jika diunggah bersamaan
          const uniqueBatch = {
            ...parsed.batch,
            id: `${parsed.batch.id}-${i}`
          };
          const uniqueRecords = parsed.records.map((r, rIdx) => ({
            ...r,
            id: `${uniqueBatch.id}-${r.idSpp || rIdx}`,
            uploadBatchId: uniqueBatch.id
          }));

          results.push({
            batch: uniqueBatch,
            records: uniqueRecords,
            warnings: parsed.warnings
          });
        }
      } catch (err: any) {
        console.error(`Error parsing ${file.name}:`, err);
        errors.push(`Gagal memproses "${file.name}": ${err.message || 'Format tidak sesuai'}`);
      }
    }

    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (errors.length > 0 && results.length === 0) {
      setErrorMsg(errors.join(' | '));
      return;
    }

    if (errors.length > 0) {
      setErrorMsg(`Peringatan: ${errors.join(', ')}`);
    }

    if (results.length > 0) {
      setParsedPreviewList(results);
    }
  };

  const handleConfirmSave = () => {
    if (!parsedPreviewList || parsedPreviewList.length === 0) return;

    const incomingBatchIds = new Set(parsedPreviewList.map(p => p.batch.id));
    const newUploads = [...parsedPreviewList.map(p => p.batch), ...uploads.filter(u => !incomingBatchIds.has(u.id))];

    const existingMap = new Map<string, SPMGajiRecord>();
    records.forEach(r => existingMap.set(r.id, r));
    
    let totalNewSPM = 0;
    parsedPreviewList.forEach(p => {
      p.records.forEach(r => existingMap.set(r.id, r));
      totalNewSPM += p.records.length;
    });

    const mergedRecords = Array.from(existingMap.values());

    if (onApplyRecords) {
      onApplyRecords(mergedRecords, newUploads);
    } else if (onUploadSuccess && parsedPreviewList.length === 1) {
      onUploadSuccess(parsedPreviewList[0].records, parsedPreviewList[0].batch);
    }

    const fileNames = parsedPreviewList.map(p => p.batch.filename).join(', ');
    showToast?.({
      type: 'success',
      title: 'Batch Berhasil Disimpan',
      message: `${totalNewSPM} data SPM dari ${parsedPreviewList.length} file Excel berhasil diterapkan ke sistem.`
    });
    addLog?.('UPLOAD_GAJI_INDUK', 'UPLOAD', `Upload ${parsedPreviewList.length} file Gaji Induk: ${fileNames} (${totalNewSPM} SPM)`, 'SUCCESS');
    setParsedPreviewList(null);
  };

  const handleDeleteBatch = (batchId: string) => {
    const target = uploads.find(b => b.id === batchId);
    const fname = target?.filename || batchId;

    const doDelete = () => {
      const remainingUploads = uploads.filter(b => b.id !== batchId);
      const remainingRecords = records.filter(r => {
        if (r.uploadBatchId && r.uploadBatchId === batchId) return false;
        if (target && r.periodeKey === target.periodeKey && r.jenisGaji === target.jenisGaji) return false;
        return true;
      });

      if (onApplyRecords) {
        onApplyRecords(remainingRecords, remainingUploads);
      }
      if (onDeleteBatch) {
        onDeleteBatch(batchId);
      }
      if (remainingUploads.length === 0 && onClearRecords) {
        onClearRecords();
      }

      showToast?.({
        type: 'success',
        title: 'Batch Berhasil Dihapus',
        message: `Batch "${fname}" dan seluruh data SPM terkait telah dihapus.`
      });
      addLog?.('HAPUS_BATCH_GAJI', 'UPLOAD', `Hapus batch Gaji Induk: ${fname}`, 'WARNING');
      setConfirmDialog(null);
    };

    if (requestConfirm) {
      requestConfirm(
        'Hapus Batch Monitoring Gaji?',
        `Apakah Anda yakin ingin menghapus batch "${fname}"? Seluruh rekaman SPM pada batch ini akan dihapus dari sistem.`,
        doDelete,
        { confirmText: 'Ya, Hapus Batch', variant: 'danger', iconType: 'trash' }
      );
    } else {
      setConfirmDialog({
        isOpen: true,
        title: 'Hapus Batch Monitoring Gaji?',
        message: `Apakah Anda yakin ingin menghapus batch "${fname}"? Seluruh rekaman SPM pada batch ini akan dihapus dari sistem.`,
        confirmText: 'Ya, Hapus Batch',
        variant: 'danger',
        onConfirm: doDelete
      });
    }
  };

  const handleClearAll = () => {
    const doClear = () => {
      if (onClearRecords) {
        onClearRecords();
      } else if (onApplyRecords) {
        onApplyRecords([], []);
      }
      showToast?.({
        type: 'warning',
        title: 'Database Gaji Induk Dikosongkan',
        message: 'Seluruh rekaman data SPM Gaji Induk dan riwayat batch telah berhasil dikosongkan. Anda kini dapat mengunggah file data asli.'
      });
      addLog?.('CLEAR_GAJI_INDUK', 'UPLOAD', 'Mengosongkan seluruh database Monitoring SPM Gaji Induk', 'WARNING');
      setConfirmDialog(null);
    };

    if (requestConfirm) {
      requestConfirm(
        'Kosongkan Database SPM Gaji Induk?',
        `Seluruh data monitoring SPM Gaji Induk (${records.length} SPM) dan ${uploads.length} batch upload akan dihapus total agar Anda dapat mengunggah data asli dari awal. Tindakan ini tidak dapat dibatalkan.`,
        doClear,
        { confirmText: 'Ya, Kosongkan Semua', variant: 'danger', iconType: 'trash' }
      );
    } else {
      setConfirmDialog({
        isOpen: true,
        title: 'Kosongkan Database SPM Gaji Induk?',
        message: `Seluruh data monitoring SPM Gaji Induk (${records.length} SPM) dan ${uploads.length} batch upload akan dihapus total agar Anda dapat mengunggah data asli dari awal. Tindakan ini tidak dapat dibatalkan.`,
        confirmText: 'Ya, Kosongkan Semua',
        variant: 'danger',
        onConfirm: doClear
      });
    }
  };

  const handleReloadSampleData = () => {
    const initial = generateInitialGajiIndukData(masterSatkers || []);
    if (onApplyRecords) {
      onApplyRecords(initial.records, initial.batches);
    }
    showToast?.({
      type: 'info',
      title: 'Data Contoh Dimuat',
      message: 'Data contoh monitoring SPM Gaji Induk berhasil dimuat kembali.'
    });
    addLog?.('RESET_SAMPLE_GAJI', 'UPLOAD', 'Memuat ulang data contoh SPM Gaji Induk', 'INFO');
  };

  const handleDownloadSample = (periode: string, jenis: GajiIndukJenis) => {
    const wb = generateSampleGajiIndukExcel(periode, jenis, masterSatkers);
    const fname = `Template-SPM-Gaji-${jenis}-${periode}.xlsx`;
    XLSX.writeFile(wb, fname);
  };

  return (
    <div className={`space-y-6 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
      
      {/* Banner Penjelasan Kolom Excel */}
      <div className={`p-5 rounded-2xl border ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50/50 border-emerald-200'
      }`}>
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
            <Coins className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>Format Baku Excel Monitoring SPM Gaji Induk (48 Kolom: A s.d. AV)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                Resmi SPAN/KPPN
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Sistem memvalidasi persis 48 kolom baku dari lembar kerja (Sheet1) baris pertama.
              Penentu jenis gaji diambil dari <strong>Kolom M (jnsSPP)</strong> (<em>GAJI INDUK</em> untuk PNS, dan <em>GAJI PPPK INDUK</em> untuk PPPK),
              sedangkan kode satker diambil dari <strong>Kolom AE (kodeSatker)</strong> dengan kode KPPN di <strong>Kolom AD (kodeKPPN)</strong>.
            </p>
          </div>
        </div>

        {/* Quick Sample Download */}
        <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Unduh Contoh Template Excel Sesuai Struktur:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDownloadSample('2026-08', 'PNS')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm cursor-pointer"
            >
              Agustus 2026 (PNS)
            </button>
            <button
              onClick={() => handleDownloadSample('2026-08', 'PPPK')}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-sm cursor-pointer"
            >
              Agustus 2026 (PPPK)
            </button>
            <button
              onClick={() => handleDownloadSample('2026-07', 'PNS')}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold transition-all shadow-sm cursor-pointer"
            >
              Juli 2026 (PNS)
            </button>
          </div>
        </div>
      </div>

      {/* DROPZONE UPLOAD */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesProcess(Array.from(e.dataTransfer.files));
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 scale-[0.99]'
            : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          multiple
          onChange={e => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesProcess(Array.from(e.target.files));
            }
          }}
          className="hidden"
        />

        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
          {isLoading ? (
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-8 h-8" />
          )}
        </div>

        <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
          {isLoading ? 'Sedang Memvalidasi Format 48 Kolom File Excel...' : 'Tarik & Letakkan File Excel Monitoring SPM Gaji Induk di Sini'}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-1.5 leading-relaxed">
          Atau klik untuk memilih file dari komputer Anda (.xlsx / .xls).
          <span className="block mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
            ✓ Mendukung unggah banyak file sekaligus (contoh: Gaji PNS dan Gaji PPPK)
          </span>
          Sistem otomatis mendeteksi periode, jenis gaji, dan memetakan kode satker tanpa saling menimpa.
        </p>
      </div>

      {/* ERROR ALERT */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-bold">Gagal Memproses File Excel:</strong>
            <p className="text-xs mt-0.5">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* RIWAYAT BATCH UPLOAD GAJI INDUK */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Riwayat Batch Pengunggahan Monitoring SPM Gaji Induk</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daftar file Excel yang telah tersimpan dalam basis data sistem.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {uploads.length} Batch ({records.length} SPM)
            </span>

            {records.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Kosongkan seluruh data SPM Gaji Induk agar siap upload data asli"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Database Gaji Induk</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Nama File</th>
                <th className="py-3 px-3.5 text-center">Periode</th>
                <th className="py-3 px-3.5 text-center">Jenis Gaji</th>
                <th className="py-3 px-3.5 text-center">Jumlah SPM</th>
                <th className="py-3 px-3.5 text-center">Satker Terdata</th>
                <th className="py-3 px-3.5">Waktu Upload</th>
                <th className="py-3 px-3.5 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {uploads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    <div className="max-w-sm mx-auto space-y-1">
                      <p className="font-semibold text-slate-600 dark:text-slate-300">Belum ada batch upload Excel Gaji Induk.</p>
                      <p className="text-[11px] text-slate-400">Database saat ini kosong dan siap menerima unggahan berkas Excel data asli Anda melalui kotak dropzone di atas.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                uploads.map(batch => (
                  <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-xs">{batch.filename}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-center font-bold">{batch.periode}</td>
                    <td className="py-3 px-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        batch.jenisGaji === 'PPPK'
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {batch.jenisGaji === 'PPPK' ? 'PPPK/P3K' : 'PNS'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {batch.jumlahRecord} SPM
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono font-bold">
                      {batch.jumlahSatker} Satker
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 text-xs">
                      {new Date(batch.uploadedAt).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-all cursor-pointer"
                        title={`Hapus batch "${batch.filename}" (${batch.periode})`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL KONFIRMASI / PREVIEW HASIL PARSE (MENDUKUNG SINGLE & MULTI FILE) */}
      {parsedPreviewList && parsedPreviewList.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2 font-extrabold text-base text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {parsedPreviewList.length === 1
                    ? 'Konfirmasi Hasil Validasi File Excel'
                    : `Konfirmasi Unggahan ${parsedPreviewList.length} Berkas Excel Gaji Induk`}
                </span>
              </div>
              <button
                onClick={() => setParsedPreviewList(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sistem berhasil memvalidasi {parsedPreviewList.length} file Excel monitoring SPM. Data berikut akan digabungkan secara kumulatif ke dalam riwayat sistem:
              </p>

              <div className="space-y-3">
                {parsedPreviewList.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border space-y-2 ${
                      isDark
                        ? 'bg-slate-800/60 border-slate-700'
                        : 'bg-emerald-50/60 border-emerald-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-emerald-200/60 dark:border-slate-700 pb-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-md font-mono text-xs">{item.batch.filename}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold self-start sm:self-auto ${
                        item.batch.jenisGaji === 'PPPK'
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {item.batch.jenisGaji === 'PPPK' ? 'Gaji Induk PPPK/P3K' : 'Gaji Induk PNS'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                      <div>
                        <span className="text-slate-500 block">Periode:</span>
                        <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{item.batch.periode}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Jumlah SPM:</span>
                        <strong className="font-mono text-slate-800 dark:text-slate-200 font-bold">{item.records.length} SPM</strong>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-slate-500 block">Satker Terdata:</span>
                        <strong className="font-mono text-slate-800 dark:text-slate-200 font-bold">{item.batch.jumlahSatker} Satker</strong>
                      </div>
                    </div>

                    {item.warnings.length > 0 && (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-[11px] space-y-0.5">
                        <strong className="block font-semibold">Catatan:</strong>
                        {item.warnings.map((w, wIdx) => (
                          <div key={wIdx}>• {w}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Total Keseluruhan File Baru:</span>
                <strong className="text-slate-900 dark:text-white font-bold">
                  {parsedPreviewList.reduce((acc, curr) => acc + curr.records.length, 0)} SPM dari {parsedPreviewList.length} Berkas
                </strong>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <button
                onClick={() => setParsedPreviewList(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {parsedPreviewList.length === 1
                    ? 'Simpan & Terapkan ke Monitoring'
                    : `Simpan & Terapkan Semua (${parsedPreviewList.reduce((acc, curr) => acc + curr.records.length, 0)} SPM)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FALLBACK IN-COMPONENT CONFIRMATION MODAL */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {confirmDialog.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmDialog.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
