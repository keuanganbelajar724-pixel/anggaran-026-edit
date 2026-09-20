import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FolderArchive,
  Trash2,
  Search,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Building2,
  Check,
  RefreshCw,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import {
  MonitoringRekonsiliasiRecord,
  MonitoringRekonsiliasiUploadBatch,
  MasterSatker,
  SatkerIKPA
} from '../../types';
import {
  parseMonitoringRekonsiliasiWorkbook,
  formatPeriodeRekonsiliasi,
  generateSampleMonitoringKepatuhanExcel,
  ParseRekonsiliasiResult
} from '../../utils/rekonsiliasiExcelParser';

interface UploadRekonsiliasiSectionProps {
  isDark: boolean;
  satkers?: SatkerIKPA[];
  masterSatkers?: MasterSatker[];
  records: MonitoringRekonsiliasiRecord[];
  uploads: MonitoringRekonsiliasiUploadBatch[];
  onApplyRecords: (
    newRecords: MonitoringRekonsiliasiRecord[],
    newUploads: MonitoringRekonsiliasiUploadBatch[]
  ) => void;
  onClearRecords: () => void;
  requestConfirm: (
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
  showToast: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
  addLog: (action: string, category: 'AUTH' | 'UPLOAD' | 'SETTINGS' | 'ANNOUNCEMENT', details: string, status?: 'SUCCESS' | 'WARNING' | 'INFO') => void;
}

export const UploadRekonsiliasiSection: React.FC<UploadRekonsiliasiSectionProps> = ({
  isDark,
  masterSatkers = [],
  records = [],
  uploads = [],
  onApplyRecords,
  onClearRecords,
  requestConfirm,
  showToast,
  addLog
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [previewResult, setPreviewResult] = useState<ParseRekonsiliasiResult | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTabSub, setActiveTabSub] = useState<'upload' | 'database'>('upload');

  // Colors
  const bgCard = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCurrentFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const parsed = parseMonitoringRekonsiliasiWorkbook(
          workbook,
          file.name,
          'Admin KPPN'
        );

        if (!parsed.records || parsed.records.length === 0) {
          throw new Error('Tidak ada baris Satker valid yang ditemukan dalam file Excel.');
        }

        setPreviewResult(parsed);
        addLog(
          'Upload Excel Rekonsiliasi',
          'UPLOAD',
          `File "${file.name}" terbaca: ${parsed.records.length} Satker periode ${parsed.batch.periode}.`,
          'SUCCESS'
        );

        showToast({
          type: 'success',
          title: 'File Excel Kepatuhan Terbaca',
          message: `${parsed.records.length} data Satker terbaca (${parsed.batch.summary.rekonsiliasiSelesai} Rekon Selesai, ${parsed.batch.summary.rekonsiliasiBelumSelesai} Belum). Klik tombol Terapkan untuk memperbarui.`
        });
      } catch (err: any) {
        console.error('Error parsing Excel Rekonsiliasi:', err);
        const errMsg = err?.message || 'Gagal memproses file Excel Monitoring Kepatuhan Satker.';
        setErrorMessage(errMsg);
        addLog('Gagal Olah File Rekonsiliasi', 'UPLOAD', `Gagal olah file "${file.name}": ${errMsg}`, 'WARNING');
        showToast({
          type: 'error',
          title: 'Gagal Membaca File Excel',
          message: errMsg
        });
      } finally {
        setIsProcessing(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Apply preview to active state
  const handleApplyPreview = () => {
    if (!previewResult) return;

    // Merge: replace existing records for the same periode or add new
    const otherPeriodRecords = records.filter(r => r.periode !== previewResult.batch.periode);
    const updatedRecords = [...previewResult.records, ...otherPeriodRecords];

    const otherUploads = uploads.filter(u => u.periode !== previewResult.batch.periode);
    const updatedUploads = [previewResult.batch, ...otherUploads];

    onApplyRecords(updatedRecords, updatedUploads);

    addLog(
      'Terapkan Data Rekonsiliasi',
      'UPLOAD',
      `Data periode ${previewResult.batch.periode} (${previewResult.records.length} Satker) berhasil diterapkan ke Dashboard Kepatuhan.`,
      'SUCCESS'
    );

    showToast({
      type: 'success',
      title: 'Data Rekonsiliasi Diterapkan',
      message: `${previewResult.records.length} data Satker periode ${previewResult.batch.periode} telah aktif di Dashboard Rekonsiliasi.`
    });

    setPreviewResult(null);
    setCurrentFileName('');
    setActiveTabSub('database');
  };

  // Load sample baseline
  const handleLoadSample = () => {
    try {
      const sampleBytes = generateSampleMonitoringKepatuhanExcel(masterSatkers);
      const wb = XLSX.read(sampleBytes, { type: 'array' });
      const parsed = parseMonitoringRekonsiliasiWorkbook(
        wb,
        'Monitoring Kepatuhan Satker_2026-09-20 06-38.xlsx',
        'Data Baseline Sistem'
      );

      const otherPeriodRecords = records.filter(r => r.periode !== parsed.batch.periode);
      const updatedRecords = [...parsed.records, ...otherPeriodRecords];

      const otherUploads = uploads.filter(u => u.periode !== parsed.batch.periode);
      const updatedUploads = [parsed.batch, ...otherUploads];

      onApplyRecords(updatedRecords, updatedUploads);

      addLog(
        'Load Baseline Rekonsiliasi',
        'UPLOAD',
        'Memuat data baseline contoh 127 Satker (91 Rekon Selesai, 36 Belum Rekon, 63 Todolist Selesai, 64 Belum).',
        'SUCCESS'
      );

      showToast({
        type: 'success',
        title: 'Data Baseline Dimuat',
        message: '127 Satker periode September 2026 berhasil dimuat ke database Rekonsiliasi.'
      });
    } catch (err: any) {
      alert('Gagal memuat data baseline: ' + (err?.message || 'Error'));
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    const sampleBytes = generateSampleMonitoringKepatuhanExcel(masterSatkers);
    const blob = new Blob([sampleBytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Template_Monitoring_Kepatuhan_Satker_SAKTI.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast({
      type: 'info',
      title: 'Template Diunduh',
      message: 'File Template_Monitoring_Kepatuhan_Satker_SAKTI.xlsx siap diisi atau diunggah.'
    });
  };

  // Delete batch
  const handleDeleteBatch = (batchId: string) => {
    const batch = uploads.find(u => u.id === batchId);
    if (!batch) return;

    requestConfirm(
      'Hapus Batch Upload Rekonsiliasi?',
      `Apakah Anda yakin ingin menghapus data arsip "${batch.filename}" periode ${batch.periode} (${batch.jumlahData} Satker)? Data pada periode ini akan dihapus dari dashboard.`,
      () => {
        const remainingUploads = uploads.filter(u => u.id !== batchId);
        const remainingRecords = records.filter(r => r.uploadId !== batchId && r.periode !== batch.periode);
        onApplyRecords(remainingRecords, remainingUploads);

        addLog(
          'Hapus Batch Rekonsiliasi',
          'UPLOAD',
          `Menghapus arsip ${batch.filename} periode ${batch.periode}.`,
          'WARNING'
        );

        showToast({
          type: 'warning',
          title: 'Batch Dihapus',
          message: `Data periode ${batch.periode} berhasil dihapus.`
        });
      },
      { variant: 'danger', iconType: 'trash', confirmText: 'Ya, Hapus Batch' }
    );
  };

  // Clear all
  const handleClearAll = () => {
    requestConfirm(
      'Kosongkan Seluruh Data Rekonsiliasi?',
      'Tindakan ini akan menghapus seluruh data kepatuhan Satker, riwayat upload batch, dan status rekonsiliasi yang tersimpan.',
      () => {
        onClearRecords();
        setPreviewResult(null);
        addLog('Reset Data Rekonsiliasi', 'UPLOAD', 'Seluruh data Rekonsiliasi & Kepatuhan Satker dikosongkan.', 'WARNING');
        showToast({
          type: 'warning',
          title: 'Database Dikosongkan',
          message: 'Seluruh data Rekonsiliasi telah dihapus.'
        });
      },
      { variant: 'danger', iconType: 'trash', confirmText: 'Kosongkan Sekarang' }
    );
  };

  // Filtered records for database preview tab
  const filteredRecords = records.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.kodeSatker.toLowerCase().includes(q) ||
      r.namaSatker.toLowerCase().includes(q) ||
      r.periode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
      />

      {/* Main Header Card */}
      <div className={`p-6 rounded-3xl border ${bgCard} shadow-sm`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full">
                  10. REKONSILIASI &amp; KEPATUHAN SATKER
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {records.length} Satker Terdata
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                Upload Excel Monitoring Kepatuhan Satker SAKTI
              </h2>
              <p className={`text-xs ${textMuted} mt-0.5`}>
                Unggah file hasil unduhan SAKTI (format multi-header baris 5–6) untuk mengevaluasi Rekonsiliasi, Todolist, Tutup Periode Modul, SP2S, dan SP3S.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                  : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Contoh Excel</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSample}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Muat Data Contoh (127)</span>
            </button>

            {records.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 text-rose-700 dark:text-rose-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-5">
          <button
            type="button"
            onClick={() => setActiveTabSub('upload')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTabSub === 'upload'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Unggah File Excel Baru
          </button>
          <button
            type="button"
            onClick={() => setActiveTabSub('database')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTabSub === 'database'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Database &amp; Riwayat Arsip ({records.length} Satker / {uploads.length} Batch)
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: UPLOAD ZONE */}
      {activeTabSub === 'upload' && (
        <div className="space-y-6">
          {/* Dropzone Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              isDark
                ? 'border-slate-700 bg-slate-900/50 hover:bg-slate-800/60 hover:border-blue-500'
                : 'border-slate-300 bg-white hover:bg-blue-50/40 hover:border-blue-500'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              Pilih atau Tarik File Excel Monitoring Kepatuhan Satker
            </h4>
            <p className={`text-xs ${textMuted} max-w-lg mx-auto mt-2 leading-relaxed`}>
              Mendukung format file resmi SAKTI: <strong>Monitoring Kepatuhan Satker_[YYYY-MM-DD].xlsx</strong>. Sistem otomatis membaca Rekonsiliasi (Status, Tanggal, Operator, KPA), Todolist, Status Tutup Periode Modul, SP2S &amp; SP3S.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
              >
                {isProcessing ? 'Memproses File...' : 'Pilih File dari Komputer'}
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-rose-800 dark:text-rose-300">Gagal Membaca File</h5>
                <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Preview Parsed Data */}
          {previewResult && (
            <div className={`p-6 rounded-3xl border ${bgCard} shadow-lg space-y-5 animate-in fade-in`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                    Hasil Analisis File Berhasil
                  </span>
                  <h4 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
                    <span>{previewResult.batch.filename}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      Periode: {formatPeriodeRekonsiliasi(previewResult.batch.periode)} ({previewResult.batch.periode})
                    </span>
                  </h4>
                  <p className={`text-xs ${textMuted} mt-0.5`}>
                    Terbaca {previewResult.records.length} baris Satker. Silakan tinjau ringkasan di bawah sebelum menerapkan ke dashboard.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewResult(null)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-400"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyPreview}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Terapkan ke Dashboard Rekonsiliasi</span>
                  </button>
                </div>
              </div>

              {/* Summary KPIs of Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 block">Total Satker</span>
                  <span className="text-xl font-black text-blue-700 dark:text-blue-400 mt-1 block">
                    {previewResult.batch.summary.totalSatker}
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-500">100% data</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">Rekon Selesai</span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1 block">
                    {previewResult.batch.summary.rekonsiliasiSelesai}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-500">Sudah Sama / SHR</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                  <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">Rekon Belum</span>
                  <span className="text-xl font-black text-rose-700 dark:text-rose-400 mt-1 block">
                    {previewResult.batch.summary.rekonsiliasiBelumSelesai}
                  </span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-500">Selisih TDK</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900">
                  <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 block">Todolist Bersih</span>
                  <span className="text-xl font-black text-teal-700 dark:text-teal-400 mt-1 block">
                    {previewResult.batch.summary.todolistSelesai}
                  </span>
                  <span className="text-[10px] text-teal-600 dark:text-teal-500">Nilai 0</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">Ada Todolist</span>
                  <span className="text-xl font-black text-amber-700 dark:text-amber-400 mt-1 block">
                    {previewResult.batch.summary.todolistBelumSelesai}
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-500">Perlu tindak lanjut</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
                  <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 block">Belum Tutup</span>
                  <span className="text-xl font-black text-purple-700 dark:text-purple-400 mt-1 block">
                    {previewResult.batch.summary.belumTutupPeriode}
                  </span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-500">Belum permanen</span>
                </div>
              </div>

              {/* Sample 5 records preview table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Pratinjau Data Awal (5 dari {previewResult.records.length} Satker):</span>
                  <span className="text-[11px] text-slate-500 font-mono">Periode {previewResult.batch.periode}</span>
                </div>
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">No</th>
                        <th className="p-2.5">Kode</th>
                        <th className="p-2.5">Nama Satker</th>
                        <th className="p-2.5">Rekonsiliasi</th>
                        <th className="p-2.5">Todolist</th>
                        <th className="p-2.5">Tutup Periode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewResult.records.slice(0, 5).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 font-mono text-slate-400">{i + 1}</td>
                          <td className="p-2.5 font-mono font-bold text-blue-600">{r.kodeSatker}</td>
                          <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">{r.namaSatker}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.rekonsiliasiStatus === 'SELESAI'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {r.rekonsiliasiRaw || r.rekonsiliasiStatus}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.todolistStatus === 'SELESAI'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {r.todolistRaw || r.todolistStatus}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.tutupPeriodeStatus === 'SUDAH_TUTUP'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {r.tutupPeriodeRaw || r.tutupPeriodeStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: DATABASE & BATCHES */}
      {activeTabSub === 'database' && (
        <div className="space-y-6">
          {/* Batches Table */}
          <div className={`p-6 rounded-3xl border ${bgCard} shadow-sm space-y-4`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-blue-500" />
                Daftar Riwayat Batch Unggahan Excel ({uploads.length} File)
              </h4>
              <span className={`text-xs ${textMuted}`}>
                Total {records.length} data Satker aktif di database
              </span>
            </div>

            {uploads.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-500">Belum ada file Excel yang diunggah.</p>
                <button
                  type="button"
                  onClick={() => setActiveTabSub('upload')}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  Unggah File Sekarang
                </button>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Periode</th>
                      <th className="p-3">Nama File</th>
                      <th className="p-3">Diunggah Oleh</th>
                      <th className="p-3">Waktu Unggah</th>
                      <th className="p-3 text-center">Jumlah Satker</th>
                      <th className="p-3 text-center">Rekon Selesai</th>
                      <th className="p-3 text-center">Rekon Belum</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {uploads.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            {formatPeriodeRekonsiliasi(b.periode)}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {b.filename}
                        </td>
                        <td className="p-3 text-slate-500">{b.uploadedBy}</td>
                        <td className="p-3 text-slate-500">
                          {new Date(b.uploadedAt).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-center font-bold font-mono text-blue-600">
                          {b.jumlahData}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-600">
                          {b.summary.rekonsiliasiSelesai}
                        </td>
                        <td className="p-3 text-center font-bold text-rose-600">
                          {b.summary.rekonsiliasiBelumSelesai}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteBatch(b.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Hapus Batch Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Current Data Search & Preview Table */}
          {records.length > 0 && (
            <div className={`p-6 rounded-3xl border ${bgCard} shadow-sm space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Daftar Satker Terdata Saat Ini ({filteredRecords.length} Satker)
                  </h4>
                  <p className={`text-xs ${textMuted}`}>
                    Data yang saat ini aktif dan dapat dipantau Satker di menu Rekonsiliasi.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kode / nama Satker..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">Periode</th>
                      <th className="p-2.5">Kode</th>
                      <th className="p-2.5">Nama Satker</th>
                      <th className="p-2.5">Status Rekon</th>
                      <th className="p-2.5">Status Todolist</th>
                      <th className="p-2.5">Tutup Periode</th>
                      <th className="p-2.5">Dokumen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRecords.slice(0, 100).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-mono text-slate-400">{i + 1}</td>
                        <td className="p-2.5 font-mono text-slate-500">{r.periode}</td>
                        <td className="p-2.5 font-mono font-bold text-blue-600">{r.kodeSatker}</td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">{r.namaSatker}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.rekonsiliasiStatus === 'SELESAI'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {r.rekonsiliasiStatus === 'SELESAI' ? 'Selesai' : 'Belum'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.todolistStatus === 'SELESAI'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {r.todolistStatus === 'SELESAI' ? 'Bersih (0)' : 'Ada'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.tutupPeriodeStatus === 'SUDAH_TUTUP'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {r.tutupPeriodeStatus === 'SUDAH_TUTUP' ? 'Sudah Tutup' : 'Belum Tutup'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500">
                          {r.sp2sStatus === 'ADA' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 mr-1">SP2S</span>
                          )}
                          {r.sp3sStatus === 'ADA' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 mr-1">SP3S</span>
                          )}
                          {r.dispensasi && r.dispensasi !== '-' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800">Disp</span>
                          )}
                          {r.sp2sStatus !== 'ADA' && r.sp3sStatus !== 'ADA' && (!r.dispensasi || r.dispensasi === '-') && (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
