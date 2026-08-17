import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FolderArchive,
  Trash2,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  FileDown,
  Building2,
  TrendingUp,
  Check,
  BarChart3
} from 'lucide-react';
import { SatkerIKPA, ExcelUploadHistory, MasterSatker, IndikatorIKPA } from '../../types';
import { processExcelFile, downloadExcelTemplate, exportSatkersToExcel } from '../../utils/excelProcessor';
import { hitungTotalIKPA, getPredikatIKPA } from '../../data/initialSatkerData';

interface UploadIKPASectionProps {
  isDark: boolean;
  satkers: SatkerIKPA[];
  masterSatkers?: MasterSatker[];
  historicalUploads: ExcelUploadHistory[];
  onApplySatkers: (satkers: SatkerIKPA[], appendMode: boolean) => void;
  onSaveHistoricalUploads: (newList: ExcelUploadHistory[]) => void;
  onClearIKPAData: () => void;
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

export const UploadIKPASection: React.FC<UploadIKPASectionProps> = ({
  isDark,
  satkers,
  masterSatkers = [],
  historicalUploads,
  onApplySatkers,
  onSaveHistoricalUploads,
  onClearIKPAData,
  requestConfirm,
  showToast,
  addLog
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [previewSatkers, setPreviewSatkers] = useState<SatkerIKPA[]>([]);
  const [uploadPeriode, setUploadPeriode] = useState<string>('Agustus 2026');
  const [uploadNotes, setUploadNotes] = useState<string>('Rekonsiliasi IKPA SAKTI 8 Indikator');
  const [appendMode, setAppendMode] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<string>('');

  // Filter history khusus IKPA
  const ikpaHistories = historicalUploads.filter(h => !h.category || h.category === 'IKPA');
  const ikpaSatkerCount = satkers.filter(s => s.hasIKPAData !== false && s.nilaiTotalIKPA > 0).length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setCurrentFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await processExcelFile(file, 'IKPA');
      if (result.satkers.length === 0) {
        throw new Error('Tidak ada data Satker IKPA yang valid dalam file Excel.');
      }

      setPreviewSatkers(result.satkers);
      if (result.satkers.length > 0 && result.satkers[0].periodeUpdate) {
        setUploadPeriode(result.satkers[0].periodeUpdate);
      }

      addLog(
        'Upload Excel IKPA',
        'UPLOAD',
        `File "${file.name}" diunggah. ${result.satkers.length} Satker IKPA dibersihkan & diproses. Periode: ${result.satkers[0]?.periodeUpdate || 'Januari 2026'}.`,
        'SUCCESS'
      );

      showToast({
        type: 'success',
        title: 'File Excel IKPA Terbaca',
        message: `${result.satkers.length} data Satker berhasil dianalisis. Silakan tinjau preview sebelum menerapkan ke Database IKPA.`
      });
    } catch (err: any) {
      const errMsg = err.message || 'Gagal memproses file Excel IKPA.';
      setErrorMessage(errMsg);
      addLog('Gagal Olah File Excel IKPA', 'UPLOAD', `Gagal olah file "${file.name}": ${errMsg}`, 'WARNING');
      showToast({
        type: 'error',
        title: 'Gagal Olah Excel IKPA',
        message: errMsg
      });
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleApplyPreview = (overwriteActive: boolean) => {
    if (previewSatkers.length === 0) return;

    const fileNameToUse = currentFileName || `Laporan_IKPA_${uploadPeriode.replace(/\s+/g, '_')}.xlsx`;
    const avgIKPA = Number(
      (previewSatkers.reduce((acc, s) => acc + (s.nilaiTotalIKPA || 0), 0) / (previewSatkers.length || 1)).toFixed(2)
    );

    // Tandai data memiliki IKPA secara tegas (tidak mencampuradukkan status capaian output kecuali sudah diupload)
    const formattedData = previewSatkers.map(s => {
      const existing = satkers.find(curr => curr.kodeSatker === s.kodeSatker);
      return {
        ...s,
        hasIKPAData: true,
        hasCapaianOutputData: existing ? existing.hasCapaianOutputData : false,
        statusCapaianOutput: (existing && existing.hasCapaianOutputData) ? existing.statusCapaianOutput : s.statusCapaianOutput,
        periodeUpdate: uploadPeriode
      };
    });

    const newHistoryItem: ExcelUploadHistory = {
      id: `hist-ikpa-${Date.now()}`,
      fileName: fileNameToUse,
      periode: uploadPeriode.trim() || 'Agustus 2026',
      uploadDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
      uploadedBy: 'Seksi MSKI KPPN Semarang I',
      satkerCount: formattedData.length,
      averageIKPA: avgIKPA,
      notes: uploadNotes.trim() || 'Upload Data IKPA (8 Indikator)',
      satkersData: formattedData,
      category: 'IKPA',
      isActive: overwriteActive
    };

    if (overwriteActive) {
      onApplySatkers(formattedData, appendMode);
      const updatedHistory = [
        newHistoryItem,
        ...historicalUploads.map(h => (!h.category || h.category === 'IKPA' ? { ...h, isActive: false } : h))
      ];
      onSaveHistoricalUploads(updatedHistory);

      addLog(
        'Update Database IKPA',
        'UPLOAD',
        `${formattedData.length} Satker IKPA periode "${uploadPeriode}" berhasil diperbarui ke Dashboard IKPA Utama.`,
        'SUCCESS'
      );

      showToast({
        type: 'success',
        title: 'Database IKPA Berhasil Diperbarui',
        message: `${formattedData.length} data Satker periode "${uploadPeriode}" telah aktif di Dashboard IKPA Utama.`
      });
    } else {
      const updatedHistory = [newHistoryItem, ...historicalUploads];
      onSaveHistoricalUploads(updatedHistory);

      addLog(
        'Simpan Arsip IKPA',
        'UPLOAD',
        `File "${fileNameToUse}" (${formattedData.length} Satker) tersimpan di Arsip IKPA tanpa menimpa data aktif.`,
        'INFO'
      );

      showToast({
        type: 'info',
        title: 'Tersimpan di Arsip IKPA',
        message: `File IKPA periode "${uploadPeriode}" tersimpan di Arsip Historical.`
      });
    }

    setPreviewSatkers([]);
    setCurrentFileName('');
  };

  const handleActivateHistorical = (item: ExcelUploadHistory) => {
    requestConfirm(
      'Aktifkan Arsip IKPA',
      `Apakah Anda yakin ingin mengaktifkan data IKPA periode "${item.periode}" (${item.fileName}) ke Dashboard IKPA Utama?`,
      () => {
        onApplySatkers(item.satkersData, false);
        const updated = historicalUploads.map(h => {
          if (!h.category || h.category === 'IKPA') {
            return { ...h, isActive: h.id === item.id };
          }
          return h;
        });
        onSaveHistoricalUploads(updated);

        addLog(
          'Beralih Periode IKPA',
          'UPLOAD',
          `Dashboard IKPA Utama dialihkan ke periode "${item.periode}" (${item.satkerCount} Satker).`,
          'SUCCESS'
        );

        showToast({
          type: 'success',
          title: 'Periode IKPA Diaktifkan',
          message: `Data IKPA periode "${item.periode}" kini aktif di Dashboard IKPA.`
        });
      },
      { confirmText: 'Aktifkan Periode Ini', variant: 'warning' }
    );
  };

  const handleDeleteHistorical = (id: string) => {
    const target = historicalUploads.find(h => h.id === id);
    requestConfirm(
      'Hapus Arsip IKPA',
      `Apakah Anda yakin ingin menghapus arsip file IKPA periode "${target?.periode || ''}"?`,
      () => {
        const updated = historicalUploads.filter(h => h.id !== id);
        onSaveHistoricalUploads(updated);
        addLog('Hapus Arsip IKPA', 'UPLOAD', `Arsip IKPA "${target?.fileName}" dihapus.`, 'INFO');
        showToast({
          type: 'info',
          title: 'Arsip Dihapus',
          message: `Arsip IKPA periode "${target?.periode}" telah dihapus.`
        });
      },
      { confirmText: 'Hapus Arsip', variant: 'danger' }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-sky-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-sky-500/20 text-sky-300 border border-sky-400/30 px-3 py-1 rounded-full text-xs font-black mb-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span>MODUL DATABASE KHUSUS EXCEL IKPA (8 INDIKATOR)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Upload &amp; Pengelolaan Data Excel IKPA
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Database ini khusus untuk memproses 8 indikator IKPA resmi (Revisi DIPA, Deviasi Hal III, Penyerapan, Kontraktual, UP/TUP, Dispensasi SPM, dll). Data ini terisolasi dan tidak tercampur dengan Capaian Output, Sertifikasi, atau UP/TUP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={downloadExcelTemplate}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Format Template IKPA</span>
          </button>

          <button
            type="button"
            onClick={() => exportSatkersToExcel(satkers, `Database_IKPA_KPPN026_${new Date().toISOString().slice(0, 10)}.xlsx`)}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Database IKPA</span>
          </button>
        </div>
      </div>

      {/* KPI Stats IKPA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-sky-50/50 border-sky-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Satker Terdaftar IKPA</span>
          <span className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1 block">
            {ikpaSatkerCount} <span className="text-xs font-normal text-slate-400">Satker</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-emerald-50/50 border-emerald-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Rata-Rata Nilai IKPA</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {satkers.length > 0 ? (satkers.reduce((acc, s) => acc + s.nilaiTotalIKPA, 0) / satkers.length).toFixed(2) : '0.00'}
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-purple-50/50 border-purple-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total Arsip Batch IKPA</span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
            {ikpaHistories.length} <span className="text-xs font-normal text-slate-400">Batch</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-50/50 border-amber-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Periode Aktif IKPA</span>
          <span className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1 block truncate">
            {historicalUploads.find(h => (!h.category || h.category === 'IKPA') && h.isActive)?.periode || satkers[0]?.periodeUpdate || 'Agustus 2026'}
          </span>
        </div>
      </div>

      {/* Upload Box */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Upload className="w-5 h-5 text-sky-600" />
              <span>Unggah File Excel IKPA (SAKTI / OM-SPAN)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Format file otomatis mendeteksi header kolom kode satker, pagu, realisasi, dan 8 indikator IKPA.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                requestConfirm(
                  'Kosongkan Database IKPA',
                  `Apakah Anda yakin ingin mengosongkan seluruh data IKPA aktif (${satkers.length} Satker)? Data Capaian Output & Sertifikasi tidak akan terpengaruh.`,
                  () => {
                    onClearIKPAData();
                    addLog('Kosongkan Data IKPA', 'UPLOAD', 'Seluruh data IKPA aktif dikosongkan.', 'WARNING');
                    showToast({
                      type: 'info',
                      title: 'Data IKPA Dikosongkan',
                      message: 'Database IKPA telah dikosongkan (0 Satker).'
                    });
                  },
                  { confirmText: 'Kosongkan IKPA', variant: 'danger' }
                );
              }}
              className="bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Data IKPA Aktif</span>
            </button>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx, .xls, .csv"
          className="hidden"
        />

        <div className="border-2 border-dashed border-sky-300 dark:border-sky-800 hover:border-sky-500 bg-sky-50/40 dark:bg-sky-950/20 rounded-2xl p-8 text-center transition-all">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <FileSpreadsheet className="w-7 h-7" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Pilih File Excel Laporan IKPA
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tarik file ke sini atau klik tombol di bawah untuk memilih file (.xlsx, .xls, .csv)
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="mt-3 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{isProcessing ? 'Memproses File IKPA...' : 'Pilih File Excel IKPA'}</span>
              </button>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Preview Table Section */}
        {previewSatkers.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-sky-200 dark:border-sky-900 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-sky-600 text-white font-black text-xs px-2.5 py-0.5 rounded-md">
                  PREVIEW ({previewSatkers.length} SATKER)
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  File: {currentFileName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={uploadPeriode}
                  onChange={(e) => setUploadPeriode(e.target.value)}
                  placeholder="Periode misal: Agustus 2026"
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"
                />

                <button
                  type="button"
                  onClick={() => handleApplyPreview(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terapkan ke Dashboard Utama</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreview(false)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>Simpan ke Arsip Saja</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-200 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 uppercase sticky top-0">
                  <tr>
                    <th className="py-2 px-3">No</th>
                    <th className="py-2 px-3">Kode &amp; Nama Satker</th>
                    <th className="py-2 px-3 text-right">Pagu</th>
                    <th className="py-2 px-3 text-right">Realisasi</th>
                    <th className="py-2 px-3 text-center">Nilai IKPA</th>
                    <th className="py-2 px-3 text-center">Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {previewSatkers.slice(0, 10).map((s, idx) => (
                    <tr key={s.id || idx}>
                      <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <div className="font-mono font-bold text-sky-700 dark:text-sky-300">{s.kodeSatker}</div>
                        <div className="font-medium text-slate-800 dark:text-slate-200">{s.namaSatker}</div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">Rp {s.paguAnggaran.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-mono">Rp {s.realisasiAnggaran.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-center font-black font-mono text-emerald-600">{s.nilaiTotalIKPA}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          {s.predikat}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewSatkers.length > 10 && (
              <p className="text-[11px] text-slate-400 text-center italic">
                Menampilkan 10 dari {previewSatkers.length} Satker yang siap diimpor.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Arsip Periode Khusus IKPA */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-bold mb-1">
              <FolderArchive className="w-3.5 h-3.5 text-blue-600" />
              <span>ARSIP HISTORICAL KHUSUS IKPA</span>
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Riwayat &amp; Arsip Periode Laporan IKPA ({ikpaHistories.length} Batch)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Klik "Aktifkan" untuk menampilkan kembali data IKPA periode terdahulu ke Dashboard Utama.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              placeholder="Cari arsip IKPA..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {ikpaHistories.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <FolderArchive className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-xs">Belum ada riwayat arsip file IKPA.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ikpaHistories
              .filter(h => !searchHistory || h.fileName.toLowerCase().includes(searchHistory.toLowerCase()) || h.periode.toLowerCase().includes(searchHistory.toLowerCase()))
              .map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    item.isActive
                      ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-400 ring-2 ring-sky-500/20'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                          {item.periode}
                        </span>
                        {item.isActive && (
                          <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>AKTIF</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                        {item.fileName}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Diunggah: {item.uploadDate} • {item.satkerCount} Satker • Rata-rata IKPA: {item.averageIKPA}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    {!item.isActive && (
                      <button
                        type="button"
                        onClick={() => handleActivateHistorical(item)}
                        className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aktifkan Periode Ini</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => exportSatkersToExcel(item.satkersData || [], `Arsip_IKPA_${item.periode.replace(/\s+/g, '_')}.xlsx`)}
                      className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      title="Download Arsip Excel IKPA"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteHistorical(item.id)}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 p-1.5 rounded-xl text-xs transition-all cursor-pointer"
                      title="Hapus Arsip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
