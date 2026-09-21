import React, { useState, useRef, useMemo } from 'react';
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
  ArrowRight,
  BarChart3,
  CreditCard,
  User,
  ExternalLink,
  PieChart,
  Eye
} from 'lucide-react';
import {
  MonitoringLPJRecord,
  LPJUploadBatch,
  LPJBatchSummary,
  MasterSatker
} from '../../types';
import {
  parseMonitoringLPJWorkbook,
  generateSampleLPJWorkbookBytes,
  generateInitialLPJData,
  computeLPJSummary,
  formatRupiah,
  ParseLPJResult
} from '../../utils/lpjExcelParser';
import { exportLPJExcel } from '../../utils/lpjExportHelper';

interface UploadLPJSectionProps {
  isDark: boolean;
  masterSatkers?: MasterSatker[];
  records: MonitoringLPJRecord[];
  uploads: LPJUploadBatch[];
  onApplyRecords: (
    newRecords: MonitoringLPJRecord[],
    newUploads: LPJUploadBatch[]
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

export const UploadLPJSection: React.FC<UploadLPJSectionProps> = ({
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
  const [previewResult, setPreviewResult] = useState<ParseLPJResult | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'analisis' | 'database'>('upload');

  // Styling
  const bgCard = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  // Compute analytics
  const summary = useMemo(() => computeLPJSummary(records), [records]);

  // Handle File Selection
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

        const parsed = parseMonitoringLPJWorkbook(workbook, file.name, 'Admin KPPN 026');
        setPreviewResult(parsed);
        setIsProcessing(false);
        showToast({
          type: 'success',
          title: 'File Excel Berhasil Dibaca',
          message: `Ditemukan ${parsed.records.length} data satker (${parsed.batch.sudahKirimCount} sudah kirim, ${parsed.batch.belumKirimCount} belum kirim)`
        });
      } catch (err: any) {
        setIsProcessing(false);
        setErrorMessage(err.message || 'Gagal memproses file Excel.');
        showToast({
          type: 'error',
          title: 'Gagal Membaca File',
          message: err.message || 'Format file Excel tidak sesuai format LPJ'
        });
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setErrorMessage('Terjadi kesalahan saat membaca file');
    };
    reader.readAsArrayBuffer(file);
  };

  // Apply Preview Data to Main App Database
  const handleApplyData = () => {
    if (!previewResult) return;

    requestConfirm(
      'Simpan Data Monitoring LPJ',
      `Terapkan data ${previewResult.records.length} satker dari file "${previewResult.batch.filename}" ke sistem monitoring LPJ? Data ini akan langsung tampil pada Dashboard Monitoring LPJ Satker.`,
      () => {
        // Merge or replace: kita simpan batch baru dan update records
        const newUploads = [previewResult.batch, ...uploads];
        // Timpa atau tambahkan berdasarkan kodeSatker + periode + jenisBendahara
        const existingMap = new Map<string, MonitoringLPJRecord>();
        records.forEach(r => existingMap.set(`${r.kodeSatker}-${r.periodeFormatted}-${r.jenisBendahara}`, r));
        previewResult.records.forEach(r => existingMap.set(`${r.kodeSatker}-${r.periodeFormatted}-${r.jenisBendahara}`, r));

        const updatedRecords = Array.from(existingMap.values());
        onApplyRecords(updatedRecords, newUploads);

        addLog('UPLOAD_LPJ', 'UPLOAD', `Upload LPJ "${previewResult.batch.filename}" (${previewResult.records.length} satker)`, 'SUCCESS');
        showToast({
          type: 'success',
          title: 'Data LPJ Berhasil Diterapkan',
          message: `${previewResult.records.length} data satker LPJ kini aktif di Dashboard Satker.`
        });
        setPreviewResult(null);
        setCurrentFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      {
        confirmText: 'Ya, Terapkan Data',
        variant: 'success',
        iconType: 'check'
      }
    );
  };

  // Download Sample Excel Files
  const handleDownloadSample = (periode: 'Agustus 2026' | 'September 2026') => {
    const bytes = generateSampleLPJWorkbookBytes(periode, masterSatkers);
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contoh_Format_Monitoring_LPJ_${periode.replace(/\s+/g, '_')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast({
      type: 'info',
      title: 'Sampel Excel Terunduh',
      message: `File contoh LPJ ${periode} siap digunakan sebagai referensi atau diunggah kembali.`
    });
  };

  // Reset / Clear Database
  const handleClear = () => {
    requestConfirm(
      'Kosongkan Database LPJ?',
      'Semua data monitoring LPJ dan riwayat upload batch akan dihapus dari aplikasi. Tindakan ini tidak dapat dibatalkan.',
      () => {
        onClearRecords();
        setPreviewResult(null);
        addLog('CLEAR_LPJ', 'UPLOAD', 'Mengosongkan seluruh database LPJ', 'WARNING');
        showToast({
          type: 'warning',
          title: 'Database LPJ Dikosongkan',
          message: 'Seluruh rekaman data monitoring LPJ telah dihapus.'
        });
      },
      {
        confirmText: 'Ya, Hapus Semua',
        variant: 'danger',
        iconType: 'trash'
      }
    );
  };

  // Delete individual batch
  const handleDeleteBatch = (batchId: string) => {
    const targetBatch = uploads.find(b => b.id === batchId);
    if (!targetBatch) return;

    requestConfirm(
      'Hapus Batch Upload LPJ?',
      `Apakah Anda yakin ingin menghapus arsip "${targetBatch.filename}" (${targetBatch.periode})? Seluruh data LPJ terkait batch ini akan dihapus.`,
      () => {
        const remainingUploads = uploads.filter(b => b.id !== batchId);
        const remainingRecords = records.filter(r => (r.uploadId ? r.uploadId !== batchId : r.periodeFormatted !== targetBatch.periode));
        if (remainingUploads.length === 0) {
          onClearRecords();
        } else {
          onApplyRecords(remainingRecords, remainingUploads);
        }
        addLog('DELETE_LPJ_BATCH', 'UPLOAD', `Menghapus batch LPJ ${targetBatch.filename}`, 'WARNING');
        showToast({
          type: 'info',
          title: 'Batch Dihapus',
          message: `Arsip batch "${targetBatch.filename}" berhasil dihapus.`
        });
      },
      {
        confirmText: 'Ya, Hapus Batch',
        variant: 'danger',
        iconType: 'trash'
      }
    );
  };

  // Reload sample LPJ data
  const handleLoadSample = () => {
    const initial = generateInitialLPJData(masterSatkers);
    onApplyRecords(initial.records, initial.batches);
    addLog('LOAD_SAMPLE_LPJ', 'UPLOAD', 'Memuat kembali data contoh monitoring LPJ (216 satker)', 'INFO');
    showToast({
      type: 'success',
      title: 'Sampel LPJ Dimuat',
      message: `Data contoh LPJ (${initial.records.length} rekaman) berhasil dimuat kembali.`
    });
  };

  // Filtered preview data
  const previewRows = useMemo(() => {
    if (!previewResult) return [];
    if (!searchQuery.trim()) return previewResult.records;
    const q = searchQuery.toLowerCase();
    return previewResult.records.filter(r =>
      r.kodeSatker.toLowerCase().includes(q) ||
      r.namaSatker.toLowerCase().includes(q) ||
      r.namaBendahara.toLowerCase().includes(q)
    );
  }, [previewResult, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className={`p-6 rounded-2xl border shadow-sm ${bgCard} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              MODUL ADMIN LPJ
            </span>
            <span className="text-xs text-slate-500">• KPPN Semarang I</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Upload &amp; Analisis Monitoring LPJ Bendahara
          </h2>
          <p className={`text-xs ${textMuted} mt-1 max-w-2xl`}>
            Pusat pengelolaan berkas Excel monitoring LPJ Bendahara SAKTI. Unggah data Agustus (Lengkap pengiriman) atau September (Belum mengirimkan), lalu lakukan analisis kepatuhan satker.
          </p>
        </div>

        {/* Action Tabs: Upload vs Analisis vs Database */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start shrink-0">
          <button
            onClick={() => setActiveSubTab('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'upload'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Excel
          </button>
          <button
            onClick={() => setActiveSubTab('analisis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'analisis'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analisis Data LPJ
          </button>
          <button
            onClick={() => setActiveSubTab('database')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'database'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            Database ({records.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: UPLOAD EXCEL LPJ */}
      {activeSubTab === 'upload' && (
        <div className="space-y-6">
          {/* Upload Dropzone Card */}
          <div className={`p-6 rounded-2xl border ${bgCard} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Unggah Berkas Excel Monitoring LPJ
                </h3>
                <p className={`text-xs ${textMuted} mt-0.5`}>
                  Mendukung format export SAKTI (.xlsx / .xls) untuk data penyampaian LPJ Pengeluaran maupun Penerimaan.
                </p>
              </div>

              {/* Action Buttons: Sample, Clear */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadSample('Agustus 2026')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                  title="Unduh file Excel contoh Agustus yang sudah 100% lengkap terkirim"
                >
                  <Download className="w-3.5 h-3.5" />
                  Sampel Agustus
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSample('September 2026')}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                  title="Unduh file Excel contoh September yang 100% belum mengirimkan"
                >
                  <Download className="w-3.5 h-3.5" />
                  Sampel September
                </button>

                {records.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                    title="Kosongkan seluruh data LPJ untuk persiapan upload data asli"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Kosongkan Database LPJ
                  </button>
                )}
              </div>
            </div>

            {/* Dropzone Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDark
                  ? 'border-slate-700 hover:border-emerald-500 bg-slate-800/40 hover:bg-slate-800/70'
                  : 'border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
                <Upload className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Pilih atau Tarik File Excel Monitoring LPJ di Sini
              </h4>
              <p className={`text-xs ${textMuted} mt-1 max-w-md mx-auto`}>
                Sistem akan secara cerdas memetakan nama kolom, status pengiriman, saldo bank, saldo tunai, dan nomor dokumen.
              </p>
              {currentFileName && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold">
                  <Check className="w-3.5 h-3.5" /> {currentFileName}
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Preview Section if File Parsed */}
          {previewResult && (
            <div className={`p-6 rounded-2xl border ${bgCard} space-y-4 animate-in fade-in`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Hasil Pratinjau Pembacaan File
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {previewResult.batch.filename} ({previewResult.records.length} Satker)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Periode: <strong>{previewResult.batch.periode}</strong> • Sudah Kirim:{' '}
                    <strong className="text-emerald-600">{previewResult.batch.sudahKirimCount}</strong> • Belum Kirim:{' '}
                    <strong className="text-rose-600">{previewResult.batch.belumKirimCount}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewResult(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleApplyData}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Terapkan ke Dashboard Monitoring
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto max-h-80 border rounded-xl border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama Satuan Kerja</th>
                      <th className="py-2.5 px-3">Tipe</th>
                      <th className="py-2.5 px-3">Status Pengiriman</th>
                      <th className="py-2.5 px-3">Tgl Kirim</th>
                      <th className="py-2.5 px-3">No LPJ</th>
                      <th className="py-2.5 px-3 text-right">Saldo Kas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {previewRows.slice(0, 50).map((r, i) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-500 font-mono">{i + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{r.kodeSatker}</td>
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{r.namaSatker}</td>
                        <td className="py-2 px-3">{r.jenisBendahara}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.statusPengiriman === 'SUDAH_KIRIM'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {r.statusPengiriman === 'SUDAH_KIRIM' ? 'SUDAH KIRIM' : 'BELUM KIRIM'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{r.tanggalKirim || '-'}</td>
                        <td className="py-2 px-3 font-mono text-[11px]">{r.nomorLpj || '-'}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatRupiah(r.totalSaldoKas)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: ANALISIS LPJ */}
      {activeSubTab === 'analisis' && (
        <div className="space-y-6">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-5 rounded-2xl border ${bgCard}`}>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tingkat Kepatuhan LPJ</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {summary.persenKepatuhan}%
                </span>
                <span className="text-xs text-slate-500">Kepatuhan Total</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary.persenKepatuhan}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {summary.sudahKirim} dari {summary.totalSatker} satker telah tertib menyampaikan LPJ.
              </p>
            </div>

            <div className={`p-5 rounded-2xl border ${bgCard}`}>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Satker Perlu Pembinaan</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                  {summary.belumKirim}
                </span>
                <span className="text-xs text-slate-500">Satker Menunggak</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                Satker berisiko terkena sanksi administratif atau pemblokiran SPM jika tidak mengirimkan LPJ hingga batas waktu tanggal 10.
              </p>
            </div>

            <div className={`p-5 rounded-2xl border ${bgCard}`}>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Rekapitulasi Kas &amp; Bank</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                  {formatRupiah(summary.totalSaldoKas)}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 flex items-center justify-between">
                <span>Selisih Kas:</span>
                <strong className={summary.totalSelisihKas === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {summary.totalSelisihKas === 0 ? 'Klop (Rp 0)' : formatRupiah(summary.totalSelisihKas)}
                </strong>
              </p>
            </div>
          </div>

          {/* Analysis Breakdown: Probis & Satker Menunggak */}
          <div className={`p-6 rounded-2xl border ${bgCard} space-y-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  Daftar Satker Belum Mengirimkan LPJ (Prioritas Penanganan)
                </h3>
                <p className={`text-xs ${textMuted} mt-0.5`}>
                  Satuan kerja berikut memerlukan reminder atau surat tagihan dari KPPN Semarang I.
                </p>
              </div>
              <button
                onClick={() => exportLPJExcel(records.filter(r => r.statusPengiriman === 'BELUM_KIRIM'), summary, 'Satker_Belum_Kirim')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Daftar Belum Kirim (.xlsx)
              </button>
            </div>

            <div className="overflow-x-auto border rounded-xl border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Kode</th>
                    <th className="py-2.5 px-4">Nama Satuan Kerja</th>
                    <th className="py-2.5 px-3">Periode</th>
                    <th className="py-2.5 px-3">Tipe</th>
                    <th className="py-2.5 px-3">Nama Bendahara</th>
                    <th className="py-2.5 px-3">No Kontak WA</th>
                    <th className="py-2.5 px-3">Batas Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {records.filter(r => r.statusPengiriman === 'BELUM_KIRIM').slice(0, 20).map((r, i) => (
                    <tr key={r.id} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/20">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{i + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">{r.kodeSatker}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">{r.namaSatker}</td>
                      <td className="py-2.5 px-3">{r.periodeFormatted}</td>
                      <td className="py-2.5 px-3">{r.jenisBendahara}</td>
                      <td className="py-2.5 px-3">{r.namaBendahara}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400">{r.noHpBendahara || '-'}</td>
                      <td className="py-2.5 px-3 font-medium text-rose-600 dark:text-rose-400">{r.batasWaktuPengiriman || '10 Bulan Berikutnya'}</td>
                    </tr>
                  ))}
                  {records.filter(r => r.statusPengiriman === 'BELUM_KIRIM').length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                        Seluruh satuan kerja telah lengkap mengirimkan LPJ.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DATABASE LPJ */}
      {activeSubTab === 'database' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${bgCard} space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderArchive className="w-5 h-5 text-blue-500" />
                  Database Monitoring LPJ Satker Aktif
                </h3>
                <p className={`text-xs ${textMuted} mt-0.5`}>
                  Total {records.length} baris data satker tersimpan di database lokal sistem.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportLPJExcel(records, summary, 'Database_Keseluruhan')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Cadangkan ke Excel
                </button>
                <button
                  onClick={handleClear}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Kosongkan Database
                </button>
              </div>
            </div>

            {/* Upload Batches History */}
            <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Riwayat Berkas Batch Upload LPJ:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {uploads.map(b => (
                  <div key={b.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{b.filename}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {b.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteBatch(b.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title={`Hapus arsip batch "${b.filename}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-slate-500 flex items-center justify-between text-[11px]">
                      <span>Periode: <strong>{b.periode}</strong></span>
                      <span>Total: {b.jumlahData} Satker</span>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      Diupload oleh {b.uploadedBy} • {new Date(b.uploadedAt).toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
