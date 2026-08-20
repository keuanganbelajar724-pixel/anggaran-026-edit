import React, { useState, useRef } from 'react';
import {
  TrendingUp,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FolderArchive,
  Trash2,
  RotateCcw,
  Sparkles,
  Layers,
  FileDown,
  Building2,
  Check,
  Zap
} from 'lucide-react';
import { SatkerIKPA, ExcelUploadHistory, MasterSatker } from '../../types';
import { processExcelFile, downloadCapaianOutputTemplate, exportSatkersToExcel } from '../../utils/excelProcessor';
import { PeriodDropdownSelector } from './PeriodDropdownSelector';

interface UploadOutputSectionProps {
  isDark: boolean;
  satkers: SatkerIKPA[];
  masterSatkers?: MasterSatker[];
  historicalUploads: ExcelUploadHistory[];
  onApplySatkers: (satkers: SatkerIKPA[], appendMode: boolean) => void;
  onSaveHistoricalUploads: (newList: ExcelUploadHistory[]) => void;
  onClearCapaianOutputData: () => void;
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

export const UploadOutputSection: React.FC<UploadOutputSectionProps> = ({
  isDark,
  satkers,
  masterSatkers = [],
  historicalUploads,
  onApplySatkers,
  onSaveHistoricalUploads,
  onClearCapaianOutputData,
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
  const [uploadNotes, setUploadNotes] = useState<string>('Laporan % Progress Upload Capaian Output SAKTI');
  const [searchHistory, setSearchHistory] = useState<string>('');

  // Filter history khusus Capaian Output
  const caputHistories = historicalUploads.filter(h => h.category === 'CAPAIAN_OUTPUT');
  const terlaporkanCount = satkers.filter(s => s.statusCapaianOutput === 'Sudah Terlaporkan').length;
  const belumTerlaporkanCount = satkers.filter(s => s.statusCapaianOutput === 'Belum Terlaporkan').length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setCurrentFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await processExcelFile(file, 'CAPAIAN_OUTPUT');
      if (result.satkers.length === 0) {
        throw new Error('Tidak ada data Capaian Output yang valid dalam file Excel.');
      }

      setPreviewSatkers(result.satkers);
      if (result.satkers.length > 0 && result.satkers[0].periodeUpdate) {
        setUploadPeriode(result.satkers[0].periodeUpdate);
      }

      addLog(
        'Upload Excel Capaian Output',
        'UPLOAD',
        `File "${file.name}" diunggah. ${result.satkers.length} Satker Capaian Output diproses. Periode: ${result.satkers[0]?.periodeUpdate || 'Agustus 2026'}.`,
        'SUCCESS'
      );

      showToast({
        type: 'success',
        title: 'File Capaian Output Terbaca',
        message: `${result.satkers.length} data Satker terbaca. Silakan preview sebelum menerapkan ke Database Capaian Output.`
      });
    } catch (err: any) {
      const errMsg = err.message || 'Gagal memproses file Excel Capaian Output.';
      setErrorMessage(errMsg);
      addLog('Gagal Olah Capaian Output', 'UPLOAD', `Gagal olah file "${file.name}": ${errMsg}`, 'WARNING');
      showToast({
        type: 'error',
        title: 'Gagal Olah Capaian Output',
        message: errMsg
      });
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleApplyPreview = (overwriteActive: boolean) => {
    if (previewSatkers.length === 0) return;

    const fileNameToUse = currentFileName || `Laporan_Capaian_Output_${uploadPeriode.replace(/\s+/g, '_')}.xlsx`;

    // Gabungkan data Capaian Output ke Satker yang sudah ada tanpa merusak indikator IKPA lainnya
    const previewMap = new Map<string, SatkerIKPA>(previewSatkers.map(p => [p.kodeSatker, p]));
    const mergedSatkers = satkers.map(currentSatker => {
      const foundInPreview = previewMap.get(currentSatker.kodeSatker);

      if (foundInPreview) {
        return {
          ...currentSatker,
          hasCapaianOutputData: true,
          statusCapaianOutput: foundInPreview.statusCapaianOutput,
          indikator: {
            ...currentSatker.indikator,
            capaianOutput: foundInPreview.indikator.capaianOutput
          },
          periodeUpdate: uploadPeriode
        };
      }
      return currentSatker;
    });

    // Tambahkan satker baru jika ada di preview tapi belum ada di satkers
    previewSatkers.forEach(p => {
      if (!mergedSatkers.some(s => s.kodeSatker === p.kodeSatker)) {
        mergedSatkers.push({
          ...p,
          hasCapaianOutputData: true,
          hasIKPAData: false,
          nilaiTotalIKPA: 0,
          paguAnggaran: 0,
          realisasiAnggaran: 0
        });
      }
    });

    const newHistoryItem: ExcelUploadHistory = {
      id: `hist-caput-${Date.now()}`,
      fileName: fileNameToUse,
      periode: uploadPeriode.trim() || 'Agustus 2026',
      uploadDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
      uploadedBy: 'Seksi MSKI KPPN Semarang I',
      satkerCount: previewSatkers.length,
      averageIKPA: 0,
      notes: uploadNotes.trim() || 'Upload Data Capaian Output SAKTI',
      satkersData: previewSatkers,
      category: 'CAPAIAN_OUTPUT',
      isActive: overwriteActive
    };

    // Filter out existing historical upload with SAME period & CAPAIAN_OUTPUT category to overwrite
    const normalizedPeriode = uploadPeriode.trim().toLowerCase();
    const filteredHistory = historicalUploads.filter(h => {
      const isCaput = h.category === 'CAPAIAN_OUTPUT';
      const samePeriode = (h.periode || '').trim().toLowerCase() === normalizedPeriode;
      return !(isCaput && samePeriode);
    });

    if (overwriteActive) {
      onApplySatkers(mergedSatkers, false);
      const updatedHistory = [
        newHistoryItem,
        ...filteredHistory.map(h => (h.category === 'CAPAIAN_OUTPUT' ? { ...h, isActive: false } : h))
      ];
      onSaveHistoricalUploads(updatedHistory);

      addLog(
        'Update Capaian Output (Menimpa Periode Sama)',
        'UPLOAD',
        `Data Capaian Output ${previewSatkers.length} Satker periode "${uploadPeriode}" berhasil menimpa data lama dan diperbarui.`,
        'SUCCESS'
      );

      showToast({
        type: 'success',
        title: 'Capaian Output Berhasil Diperbarui',
        message: `${previewSatkers.length} status Capaian Output periode "${uploadPeriode}" telah aktif di Dashboard.`
      });
    } else {
      const updatedHistory = [newHistoryItem, ...filteredHistory];
      onSaveHistoricalUploads(updatedHistory);

      addLog(
        'Simpan Arsip Capaian Output (Menimpa Periode Sama)',
        'UPLOAD',
        `File "${fileNameToUse}" (${previewSatkers.length} Satker) tersimpan di Arsip Capaian Output menimpa arsip lama periode "${uploadPeriode}".`,
        'INFO'
      );

      showToast({
        type: 'info',
        title: 'Tersimpan di Arsip Capaian Output',
        message: `File Capaian Output periode "${uploadPeriode}" berhasil menimpa arsip lama dan tersimpan di Arsip Historical.`
      });
    }

    setPreviewSatkers([]);
    setCurrentFileName('');
  };

  const handleActivateHistorical = (item: ExcelUploadHistory) => {
    requestConfirm(
      'Aktifkan Arsip Capaian Output',
      `Apakah Anda yakin ingin mengaktifkan data Capaian Output periode "${item.periode}" (${item.fileName}) ke Dashboard?`,
      () => {
        // Terapkan data Capaian Output dari history ke satkers aktif
        const previewMap = new Map<string, SatkerIKPA>((item.satkersData || []).map(p => [p.kodeSatker, p]));
        const merged = satkers.map(s => {
          const matched = previewMap.get(s.kodeSatker);
          if (matched) {
            return {
              ...s,
              hasCapaianOutputData: true,
              statusCapaianOutput: matched.statusCapaianOutput,
              indikator: {
                ...s.indikator,
                capaianOutput: matched.indikator.capaianOutput
              }
            };
          }
          return s;
        });

        onApplySatkers(merged, false);
        const updated = historicalUploads.map(h => {
          if (h.category === 'CAPAIAN_OUTPUT') {
            return { ...h, isActive: h.id === item.id };
          }
          return h;
        });
        onSaveHistoricalUploads(updated);

        addLog(
          'Beralih Periode Capaian Output',
          'UPLOAD',
          `Dashboard Capaian Output dialihkan ke periode "${item.periode}".`,
          'SUCCESS'
        );

        showToast({
          type: 'success',
          title: 'Periode Capaian Output Diaktifkan',
          message: `Data Capaian Output periode "${item.periode}" kini aktif.`
        });
      },
      { confirmText: 'Aktifkan Periode Ini', variant: 'warning' }
    );
  };

  const handleDeleteHistorical = (id: string) => {
    const target = historicalUploads.find(h => h.id === id);
    requestConfirm(
      'Hapus Arsip Capaian Output & Bersihkan Dashboard',
      `Apakah Anda yakin ingin menghapus arsip file Capaian Output periode "${target?.periode || ''}" (${target?.fileName || ''})?\n\n⚠️ Menghapus arsip ini akan otomatis membersihkan status Capaian Output pada dashboard peserta.`,
      () => {
        const newHistoryList = historicalUploads.filter(h => h.id !== id);
        const remainingCaput = newHistoryList.filter(h => h.category === 'CAPAIAN_OUTPUT');

        if (remainingCaput.length === 0) {
          // Tidak ada arsip Capaian Output yang tersisa -> Bersihkan total status capaian output dari satkers
          const resetSatkers = satkers.map(s => ({
            ...s,
            hasCapaianOutputData: false,
            statusCapaianOutput: 'Belum Terlaporkan' as const,
            indikator: {
              ...s.indikator,
              capaianOutput: 0
            }
          }));
          onApplySatkers(resetSatkers, false);
          onSaveHistoricalUploads(newHistoryList);
          if (onClearCapaianOutputData) {
            onClearCapaianOutputData();
          }
          addLog('Hapus Arsip & Bersihkan Capaian Output', 'UPLOAD', `Seluruh arsip Capaian Output dihapus. Data capaian output pada dashboard peserta otomatis dikosongkan.`, 'INFO');
          showToast({
            type: 'info',
            title: 'Arsip Dihapus & Capaian Output Dikosongkan',
            message: `Seluruh arsip Capaian Output telah dihapus. Status Capaian Output peserta pada dashboard otomatis direset (0%).`
          });
        } else {
          if (target?.isActive) {
            // Aktifkan arsip Capaian Output teratas yang tersisa
            const nextActive = remainingCaput[0];
            const updatedWithActive = newHistoryList.map(h => {
              if (h.category === 'CAPAIAN_OUTPUT') {
                return { ...h, isActive: h.id === nextActive.id };
              }
              return h;
            });
            onSaveHistoricalUploads(updatedWithActive);

            const previewMap = new Map<string, SatkerIKPA>((nextActive.satkersData || []).map(p => [p.kodeSatker, p]));
            const updatedSatkers = satkers.map(s => {
              const match = previewMap.get(s.kodeSatker);
              if (match) {
                return {
                  ...s,
                  hasCapaianOutputData: true,
                  statusCapaianOutput: match.statusCapaianOutput,
                  indikator: {
                    ...s.indikator,
                    capaianOutput: match.indikator.capaianOutput
                  }
                };
              }
              return s;
            });
            onApplySatkers(updatedSatkers, false);
            addLog('Hapus Arsip & Alihkan Capaian Output', 'UPLOAD', `Arsip Capaian Output "${target?.fileName}" dihapus. Dashboard dialihkan ke periode "${nextActive.periode}".`, 'INFO');
            showToast({
              type: 'info',
              title: 'Arsip Dihapus & Data Disinkronkan',
              message: `Arsip Capaian Output "${target?.periode}" dihapus. Dashboard kini menampilkan data periode "${nextActive.periode}".`
            });
          } else {
            onSaveHistoricalUploads(newHistoryList);
            addLog('Hapus Arsip Capaian Output', 'UPLOAD', `Arsip "${target?.fileName}" periode "${target?.periode}" dihapus.`, 'INFO');
            showToast({
              type: 'info',
              title: 'Arsip Dihapus',
              message: `Arsip Capaian Output periode "${target?.periode}" telah dihapus.`
            });
          }
        }
      },
      { confirmText: 'Ya, Hapus & Bersihkan', variant: 'danger' }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-black mb-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>MODUL DATABASE KHUSUS CAPAIAN OUTPUT SAKTI</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Upload &amp; Pengelolaan Data Capaian Output SAKTI
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Database ini khusus memproses file rekapitulasi pelaporan Capaian Output SAKTI/OM-SPAN (kolom % Data Masuk/Upload). Mengunggah file ini hanya memperbarui status &amp; nilai Capaian Output tanpa mengotori 7 indikator IKPA lainnya.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={downloadCapaianOutputTemplate}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Format Template Capaian Output</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Capaian Output */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-emerald-50/50 border-emerald-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Sudah Terlaporkan (SAKTI)</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {terlaporkanCount} <span className="text-xs font-normal text-slate-400">Satker</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-rose-50/50 border-rose-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Belum Terlaporkan</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {belumTerlaporkanCount} <span className="text-xs font-normal text-slate-400">Satker</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-purple-50/50 border-purple-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total Arsip Caput</span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
            {caputHistories.length} <span className="text-xs font-normal text-slate-400">Batch</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-50/50 border-amber-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Periode Aktif Caput</span>
          <span className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1 block truncate">
            {historicalUploads.find(h => h.category === 'CAPAIAN_OUTPUT' && h.isActive)?.periode || 'Agustus 2026'}
          </span>
        </div>
      </div>

      {/* Upload Box */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Upload className="w-5 h-5 text-emerald-600" />
              <span>Unggah File Excel Capaian Output SAKTI</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Membaca kolom "% Data Masuk" atau "% Capaian Output". Satker dengan 0% otomatis dikategorikan Belum Terlaporkan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                requestConfirm(
                  'Reset Status Capaian Output',
                  'Apakah Anda yakin ingin mereset seluruh status Capaian Output menjadi 0% / Belum Terlaporkan? Data IKPA lainnya tetap aman.',
                  () => {
                    onClearCapaianOutputData();
                    addLog('Reset Capaian Output', 'UPLOAD', 'Seluruh status Capaian Output direset.', 'WARNING');
                    showToast({
                      type: 'info',
                      title: 'Capaian Output Direset',
                      message: 'Status Capaian Output seluruh Satker telah direset ke Belum Terlaporkan.'
                    });
                  },
                  { confirmText: 'Reset Capaian Output', variant: 'danger' }
                );
              }}
              className="bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Status Caput Aktif</span>
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

        <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl p-8 text-center transition-all">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <TrendingUp className="w-7 h-7" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Pilih File Excel Capaian Output SAKTI
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tarik file ke sini atau klik tombol di bawah (.xlsx, .xls, .csv)
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{isProcessing ? 'Memproses File Capaian Output...' : 'Pilih File Excel Capaian Output'}</span>
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

        {/* Preview Table Caput */}
        {previewSatkers.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-emerald-200 dark:border-emerald-900 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5 rounded-md">
                  PREVIEW CAPAIAN OUTPUT ({previewSatkers.length} SATKER)
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  File: {currentFileName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <PeriodDropdownSelector
                  value={uploadPeriode}
                  onChange={setUploadPeriode}
                  isDark={isDark}
                  themeColor="emerald"
                />

                <button
                  type="button"
                  onClick={() => handleApplyPreview(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terapkan ke Dashboard Capaian Output</span>
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
                    <th className="py-2 px-3 text-center">Status Lapor</th>
                    <th className="py-2 px-3 text-center">% Capaian Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {previewSatkers.slice(0, 10).map((s, idx) => (
                    <tr key={s.id || idx}>
                      <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <div className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{s.kodeSatker}</div>
                        <div className="font-medium text-slate-800 dark:text-slate-200">{s.namaSatker}</div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.statusCapaianOutput === 'Sudah Terlaporkan'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                        }`}>
                          {s.statusCapaianOutput}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-black text-slate-900 dark:text-slate-100">
                        {s.indikator.capaianOutput}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Arsip Periode Khusus Capaian Output */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold mb-1">
              <FolderArchive className="w-3.5 h-3.5 text-emerald-600" />
              <span>ARSIP HISTORICAL CAPAIAN OUTPUT</span>
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Riwayat &amp; Arsip Laporan Capaian Output ({caputHistories.length} Batch)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daftar arsip file Capaian Output terdahulu yang tersimpan aman.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              placeholder="Cari arsip Capaian Output..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {caputHistories.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <FolderArchive className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-xs">Belum ada riwayat arsip file Capaian Output.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {caputHistories
              .filter(h => !searchHistory || h.fileName.toLowerCase().includes(searchHistory.toLowerCase()) || h.periode.toLowerCase().includes(searchHistory.toLowerCase()))
              .map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    item.isActive
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-500/20'
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
                        Diunggah: {item.uploadDate} • {item.satkerCount} Satker
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    {!item.isActive && (
                      <button
                        type="button"
                        onClick={() => handleActivateHistorical(item)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aktifkan Periode Ini</span>
                      </button>
                    )}

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
