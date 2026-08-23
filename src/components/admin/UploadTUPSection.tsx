import React, { useState, useRef } from 'react';
import {
  CreditCard,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FolderArchive,
  Trash2,
  Search,
  Clock,
  Calendar,
  Check
} from 'lucide-react';
import { PengelolaanUPRecord, MasterSatker, SatkerIKPA } from '../../types';
import {
  validatePengelolaanUPExcelFile,
  validateKarwasTUPExcelFile,
  downloadPengelolaanUPTemplate,
  downloadKarwasTUPTemplate
} from '../../utils/modularExcelProcessors';
import { formatBatasHariTanggal } from '../../data/initialUPData';

interface UploadTUPSectionProps {
  isDark: boolean;
  satkers: SatkerIKPA[];
  masterSatkers?: MasterSatker[];
  pengelolaanUpRecords?: PengelolaanUPRecord[];
  onApplyPengelolaanUp: (records: PengelolaanUPRecord[]) => void;
  onClearPengelolaanUp: () => void;
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

export const UploadTUPSection: React.FC<UploadTUPSectionProps> = ({
  isDark,
  satkers,
  masterSatkers = [],
  pengelolaanUpRecords = [],
  onApplyPengelolaanUp,
  onClearPengelolaanUp,
  requestConfirm,
  showToast,
  addLog
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadType, setActiveUploadType] = useState<'UP_KOLOM_N' | 'TUP_KOLOM_H'>('UP_KOLOM_N');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [previewRecords, setPreviewRecords] = useState<PengelolaanUPRecord[]>([]);
  const [uploadPeriode, setUploadPeriode] = useState<string>('Agustus 2026');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setCurrentFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let previewResult;
      if (activeUploadType === 'TUP_KOLOM_H') {
        previewResult = await validateKarwasTUPExcelFile(file, masterSatkers, uploadPeriode, 2026);
      } else {
        previewResult = await validatePengelolaanUPExcelFile(file, masterSatkers, uploadPeriode, 2026);
      }

      if (!previewResult.validData || previewResult.validData.length === 0) {
        throw new Error('Tidak ada baris data valid yang terbaca dalam file Excel.');
      }

      setPreviewRecords(previewResult.validData as any);

      const typeLabel = activeUploadType === 'TUP_KOLOM_H' ? 'Karwas TUP (Kolom H)' : 'Pengelolaan UP (Kolom N)';
      addLog(
        `Upload Excel ${typeLabel}`,
        'UPLOAD',
        `File "${file.name}" diunggah. ${previewResult.validData.length} data ${typeLabel} berhasil dianalisis.`,
        'SUCCESS'
      );

      showToast({
        type: 'success',
        title: `File ${typeLabel} Terbaca`,
        message: `${previewResult.validData.length} data Satker terbaca. Klik "Terapkan ke Dashboard UP/TUP" untuk menyimpan ke dashboard.`
      });
    } catch (err: any) {
      const errMsg = err.message || 'Gagal memproses file Excel Pengelolaan UP/TUP.';
      setErrorMessage(errMsg);
      addLog('Gagal Olah UP/TUP', 'UPLOAD', `Gagal olah file "${file.name}": ${errMsg}`, 'WARNING');
      showToast({
        type: 'error',
        title: 'Gagal Olah UP/TUP',
        message: errMsg
      });
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleApplyPreview = () => {
    if (previewRecords.length === 0) return;

    // Merge or replace records seamlessly by kodeSatker
    const existingMap = new Map<string, PengelolaanUPRecord>();
    pengelolaanUpRecords.forEach(r => existingMap.set(r.kodeSatker, { ...r }));

    const isTUP = activeUploadType === 'TUP_KOLOM_H';

    previewRecords.forEach(p => {
      const existing = existingMap.get(p.kodeSatker);
      if (existing) {
        existingMap.set(p.kodeSatker, {
          ...existing,
          ...p,
          batasRevolvingKolomN: isTUP
            ? (existing.batasRevolvingKolomN || (existing.jenisDana !== 'TUP' ? existing.batasRevolving : undefined))
            : (p.batasRevolvingKolomN || p.batasRevolving || existing.batasRevolvingKolomN),
          batasWaktuTUPKolomH: isTUP
            ? (p.batasWaktuTUPKolomH || (p as any).batasWaktuTUP || p.batasRevolving)
            : (existing.batasWaktuTUPKolomH || (existing as any).batasWaktuTUP),
          updatedAt: new Date().toISOString()
        });
      } else {
        existingMap.set(p.kodeSatker, {
          ...p,
          batasRevolvingKolomN: isTUP ? undefined : (p.batasRevolvingKolomN || p.batasRevolving),
          batasWaktuTUPKolomH: isTUP ? (p.batasWaktuTUPKolomH || (p as any).batasWaktuTUP || p.batasRevolving) : undefined,
          updatedAt: new Date().toISOString()
        });
      }
    });

    const mergedList = Array.from(existingMap.values());

    if (typeof onApplyPengelolaanUp === 'function') {
      onApplyPengelolaanUp(mergedList);
    }

    const typeLabel = isTUP ? 'Karwas TUP' : 'Pengelolaan UP';
    addLog(
      `Update Database ${typeLabel}`,
      'UPLOAD',
      `${previewRecords.length} data ${typeLabel} diterapkan ke Dashboard (Total aktif: ${mergedList.length} Satker).`,
      'SUCCESS'
    );

    showToast({
      type: 'success',
      title: 'Berhasil Diterapkan ke Dashboard',
      message: `${previewRecords.length} data ${typeLabel} kini telah aktif dan tersimpan di Dashboard UP/TUP.`
    });

    setPreviewRecords([]);
    setCurrentFileName('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-purple-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-black uppercase tracking-wider mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>MODUL BATAS WAKTU UP &amp; TUP</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Monitoring Batas Waktu UP &amp; TUP
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Monitoring batas waktu UP (Kolom N) &amp; Karwas TUP (Kolom H) dalam format hari dan tanggal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeUploadType === 'TUP_KOLOM_H') {
                downloadKarwasTUPTemplate();
              } else {
                downloadPengelolaanUPTemplate();
              }
            }}
            className="px-4 py-2.5 rounded-xl border border-purple-400/40 bg-purple-900/30 hover:bg-purple-900/50 text-purple-200 text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Template {activeUploadType === 'TUP_KOLOM_H' ? 'TUP (Kolom H)' : 'UP (Kolom N)'}</span>
          </button>

          {pengelolaanUpRecords.length > 0 && (
            <button
              onClick={() => {
                requestConfirm(
                  'Hapus Database UP / TUP?',
                  `Apakah Anda yakin ingin menghapus seluruh ${pengelolaanUpRecords.length} data batas waktu UP / TUP aktif dari dashboard?`,
                  () => {
                    onClearPengelolaanUp();
                    showToast({
                      type: 'info',
                      title: 'Data UP/TUP Dibersihkan',
                      message: 'Seluruh data batas waktu UP/TUP aktif telah dihapus.'
                    });
                  },
                  { variant: 'danger', confirmText: 'Hapus Semua', iconType: 'trash' }
                );
              }}
              className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 transition-all cursor-pointer"
              title="Kosongkan Data UP/TUP"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Upload Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Pengelolaan UP (Kolom N) */}
        <div
          onClick={() => {
            setActiveUploadType('UP_KOLOM_N');
            setPreviewRecords([]);
          }}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
            activeUploadType === 'UP_KOLOM_N'
              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 shadow-md ring-2 ring-purple-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                KOLOM N EXCEL
              </span>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Batas Waktu UP (Kolom N)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload data tanggal batas revolving Uang Persediaan (UP).
              </p>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              activeUploadType === 'UP_KOLOM_N' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {activeUploadType === 'UP_KOLOM_N' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>
        </div>

        {/* Card 2: Karwas TUP (Kolom H) */}
        <div
          onClick={() => {
            setActiveUploadType('TUP_KOLOM_H');
            setPreviewRecords([]);
          }}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
            activeUploadType === 'TUP_KOLOM_H'
              ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 shadow-md ring-2 ring-sky-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300">
                KOLOM H EXCEL
              </span>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Batas Waktu TUP (Kolom H)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload data tanggal batas waktu pertanggungjawaban TUP.
              </p>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              activeUploadType === 'TUP_KOLOM_H' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {activeUploadType === 'TUP_KOLOM_H' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Unggah File Excel {activeUploadType === 'TUP_KOLOM_H' ? 'Batas Waktu TUP (Kolom H)' : 'Batas Waktu UP (Kolom N)'}
            </h4>
            <p className="text-xs text-slate-500">
              Pilih file format .xlsx atau .xls dari SAKTI / My Intress.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500">Periode:</label>
            <input
              type="text"
              value={uploadPeriode}
              onChange={(e) => setUploadPeriode(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 w-36"
            />
          </div>
        </div>

        {/* Drag & Drop Area */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isProcessing
              ? 'border-purple-400 bg-purple-50/20 dark:bg-purple-950/10 opacity-70 pointer-events-none'
              : 'border-purple-300 dark:border-purple-800 hover:border-purple-500 hover:bg-purple-50/30 dark:hover:bg-purple-950/20'
          }`}
        >
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {isProcessing ? 'Sedang membaca dan memvalidasi file Excel...' : 'Klik atau seret file Excel ke sini'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Format: .xlsx / .xls ({activeUploadType === 'TUP_KOLOM_H' ? 'Kolom H: Batas Waktu TUP' : 'Kolom N: Batas Waktu UP'})
              </p>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Preview Table */}
        {previewRecords.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-purple-200 dark:border-purple-900 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-purple-600 text-white font-black text-xs px-2.5 py-0.5 rounded-md">
                  PREVIEW ({previewRecords.length} SATKER)
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  File: {currentFileName}
                </span>
              </div>

              <button
                type="button"
                onClick={handleApplyPreview}
                className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terapkan ke Dashboard UP/TUP</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-200 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 uppercase sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">NO</th>
                    <th className="py-2.5 px-4">KODE &amp; SATKER</th>
                    <th className="py-2.5 px-4">BATAS WAKTU UP</th>
                    <th className="py-2.5 px-4">BATAS WAKTU TUP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {previewRecords.map((r, idx) => {
                    const isTUP = activeUploadType === 'TUP_KOLOM_H' || r.jenisDana === 'TUP';
                    const upDeadline = !isTUP ? formatBatasHariTanggal(r.batasRevolvingKolomN || r.batasRevolving) : '-';
                    const tupDeadline = isTUP ? formatBatasHariTanggal(r.batasWaktuTUPKolomH || (r as any).batasWaktuTUP || r.batasRevolving) : '-';

                    return (
                      <tr key={r.id || idx} className="hover:bg-slate-100/70 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{r.namaSatker}</div>
                          <div className="font-mono text-xs text-purple-700 dark:text-purple-300">{r.kodeSatker}</div>
                        </td>
                        <td className="py-2.5 px-4">
                          {upDeadline !== '-' ? (
                            <div className="font-mono font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>{upDeadline}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {tupDeadline !== '-' ? (
                            <div className="font-mono font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span>{tupDeadline}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Database View UP/TUP Aktif */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2.5 py-0.5 rounded-full text-xs font-bold mb-1">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>DATABASE BATAS WAKTU UP &amp; TUP AKTIF</span>
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Daftar Batas Waktu Satker ({pengelolaanUpRecords.length} Satker)
            </h4>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode, nama satker, hari, tanggal..."
              className="w-full pl-9 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {pengelolaanUpRecords.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-xs">Belum ada data Batas Waktu UP/TUP di dashboard.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 uppercase sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">NO</th>
                  <th className="py-2.5 px-4">KODE &amp; SATKER</th>
                  <th className="py-2.5 px-4">BATAS WAKTU UP</th>
                  <th className="py-2.5 px-4">BATAS WAKTU TUP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {pengelolaanUpRecords
                  .filter(r => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      r.namaSatker.toLowerCase().includes(q) ||
                      r.kodeSatker.includes(q) ||
                      (r.batasRevolvingKolomN && r.batasRevolvingKolomN.toLowerCase().includes(q)) ||
                      (r.batasWaktuTUPKolomH && r.batasWaktuTUPKolomH.toLowerCase().includes(q)) ||
                      (r.batasRevolving && r.batasRevolving.toLowerCase().includes(q))
                    );
                  })
                  .map((r, idx) => {
                    const upDeadline = formatBatasHariTanggal(r.batasRevolvingKolomN || (r.jenisDana !== 'TUP' ? r.batasRevolving : undefined));
                    const tupDeadline = formatBatasHariTanggal(r.batasWaktuTUPKolomH || (r.jenisDana === 'TUP' ? (r as any).batasWaktuTUP || r.batasRevolving : undefined));

                    return (
                      <tr key={r.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{r.namaSatker}</div>
                          <div className="font-mono text-[11px] text-purple-600 dark:text-purple-400">{r.kodeSatker}</div>
                        </td>
                        <td className="py-2.5 px-4">
                          {upDeadline !== '-' ? (
                            <div className="font-mono font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>{upDeadline}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {tupDeadline !== '-' ? (
                            <div className="font-mono font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span>{tupDeadline}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
