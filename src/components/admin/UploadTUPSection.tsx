import React, { useState, useRef } from 'react';
import {
  CreditCard,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FolderArchive,
  Trash2,
  RotateCcw,
  Sparkles,
  Building2,
  Check,
  Search,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  BellRing
} from 'lucide-react';
import { PengelolaanUPRecord, MasterSatker, SatkerIKPA } from '../../types';
import {
  validatePengelolaanUPExcelFile,
  validateKarwasTUPExcelFile,
  downloadPengelolaanUPTemplate,
  downloadKarwasTUPTemplate
} from '../../utils/modularExcelProcessors';

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

  const satuMingguCount = pengelolaanUpRecords.filter(r => r.isJatuhTempo1Minggu || (r.sisaHariRevolving !== undefined && r.sisaHariRevolving >= 0 && r.sisaHariRevolving <= 7)).length;
  const weekendLiburCount = pengelolaanUpRecords.filter(r => r.isJatuhTempoLibur).length;
  const kritisCount = pengelolaanUpRecords.filter(r => r.peringatanKritis || r.statusRevolving === 'Lambat / Kritis').length;
  const normalCount = pengelolaanUpRecords.filter(r => r.statusRevolving === 'Lancar / Normal' || r.statusRevolving === 'Optimal' || r.statusRevolving === 'Sangat Baik').length;

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

      setPreviewRecords(previewResult.validData);

      const typeLabel = activeUploadType === 'TUP_KOLOM_H' ? 'Karwas TUP (Kolom H)' : 'Pengelolaan UP (Kolom N)';
      addLog(
        `Upload Excel ${typeLabel}`,
        'UPLOAD',
        `File "${file.name}" diunggah. ${previewResult.validData.length} data ${typeLabel} berhasil dianalisis & diperbaiki otomatis.`,
        'SUCCESS'
      );

      showToast({
        type: 'success',
        title: `File ${typeLabel} Terbaca`,
        message: `${previewResult.validData.length} data Satker terbaca. Tinjau batas revolving & saran pengajuan hari kerja pada preview di bawah.`
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

    // Merge or replace records seamlessly
    const existingMap = new Map<string, PengelolaanUPRecord>();
    pengelolaanUpRecords.forEach(r => existingMap.set(r.kodeSatker, r));
    previewRecords.forEach(r => existingMap.set(r.kodeSatker, r));
    const mergedList = Array.from(existingMap.values());

    onApplyPengelolaanUp(mergedList);

    const typeLabel = activeUploadType === 'TUP_KOLOM_H' ? 'Karwas TUP' : 'Pengelolaan UP';
    addLog(
      `Update Database ${typeLabel}`,
      'UPLOAD',
      `${previewRecords.length} data ${typeLabel} diterapkan ke Dashboard (Total aktif: ${mergedList.length} Satker).`,
      'SUCCESS'
    );

    showToast({
      type: 'success',
      title: 'Database UP / TUP Diperbarui',
      message: `${previewRecords.length} data ${typeLabel} kini aktif di Dashboard KPPN Semarang I.`
    });

    setPreviewRecords([]);
    setCurrentFileName('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-purple-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-300 border border-purple-400/30 px-3 py-1 rounded-full text-xs font-black mb-2">
            <CreditCard className="w-4 h-4 text-purple-400" />
            <span>MODUL KHUSUS PENGELOLAAN UP (KOLOM N) &amp; KARWAS TUP (KOLOM H)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Upload &amp; Monitoring Batas Revolving UP / Karwas TUP
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Sistem otomatis mengevaluasi <strong>Kolom N (Batas Revolving UP)</strong> &amp; <strong>Kolom H (Batas Waktu TUP)</strong>, mendeteksi jatuh tempo dalam kurun waktu 1 minggu (&le; 7 hari), serta memberi saran pengajuan pada <strong>HARI KERJA</strong> sebelum akhir pekan/libur.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={downloadPengelolaanUPTemplate}
            className="bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Template UP (Kolom N)</span>
          </button>
          <button
            type="button"
            onClick={downloadKarwasTUPTemplate}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Template Karwas TUP (Kolom H)</span>
          </button>
        </div>
      </div>

      {/* Mandatory Reminder Box */}
      <div className="bg-amber-500/10 border-2 border-amber-500 rounded-2xl p-4 flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs">
        <BellRing className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
        <div className="leading-relaxed">
          <strong className="font-black uppercase block text-amber-950 dark:text-amber-100">
            Tolong perhatikan hari libur apabila jatuh tempo harap diajukan HARI KERJA sebelum libur
          </strong>
          Sistem otomatis mengalkulasi dan menampilkan saran tanggal pengajuan SPM GUP / pertanggungjawaban TUP ke hari kerja terakhir sebelum libur nasional atau akhir pekan.
        </div>
      </div>

      {/* KPI Stats UP/TUP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-50/50 border-amber-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Jatuh Tempo Kurun 1 Minggu</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {satuMingguCount} <span className="text-xs font-normal text-slate-400">Satker</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-rose-50/50 border-rose-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Jatuh Tempo Hari Libur</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {weekendLiburCount} <span className="text-xs font-normal text-slate-400">Satker</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-purple-50/50 border-purple-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total Satker UP &amp; TUP</span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
            {pengelolaanUpRecords.length} <span className="text-xs font-normal text-slate-400">Satker</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-emerald-50/50 border-emerald-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Revolving Lancar</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {normalCount} <span className="text-xs font-normal text-slate-400">Satker</span>
          </span>
        </div>
      </div>

      {/* Upload Choice Sub-Selector */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
        
        {/* Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h4 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Upload className="w-5 h-5 text-purple-600" />
              <span>Pilih Format Excel yang Akan Diunggah:</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih tipe form di bawah sebelum memilih file Excel dari komputer Anda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                requestConfirm(
                  'Kosongkan Database UP/TUP',
                  `Apakah Anda yakin ingin mengosongkan seluruh data Pengelolaan UP/TUP (${pengelolaanUpRecords.length} Satker)? Data IKPA lainnya tetap aman.`,
                  () => {
                    onClearPengelolaanUp();
                    addLog('Kosongkan Data UP/TUP', 'UPLOAD', 'Seluruh data Pengelolaan UP/TUP dikosongkan.', 'WARNING');
                    showToast({
                      type: 'info',
                      title: 'Data UP/TUP Dikosongkan',
                      message: 'Database Pengelolaan UP/TUP telah dikosongkan.'
                    });
                  },
                  { confirmText: 'Kosongkan UP/TUP', variant: 'danger' }
                );
              }}
              className="bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Data UP/TUP</span>
            </button>
          </div>
        </div>

        {/* 2 Format Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setActiveUploadType('UP_KOLOM_N')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
              activeUploadType === 'UP_KOLOM_N'
                ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-600 ring-2 ring-purple-400/40 shadow-md'
                : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-purple-700 dark:text-purple-300 uppercase tracking-wide flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                Format 1: Pengelolaan UP (Kolom N)
              </span>
              {activeUploadType === 'UP_KOLOM_N' && (
                <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  PILIHAN AKTIF
                </span>
              )}
            </div>
            <h5 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              Laporan Pengelolaan UP &amp; Batas Revolving (Kolom N)
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Membaca <strong>Kolom N</strong> sebagai batas revolving UP, Kolom G (Pagu UP), Kolom J (Realisasi GUP), Kolom L (Sisa Kas UP), Kolom M (% Revolving).
            </p>
          </div>

          <div
            onClick={() => setActiveUploadType('TUP_KOLOM_H')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
              activeUploadType === 'TUP_KOLOM_H'
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-600 ring-2 ring-sky-400/40 shadow-md'
                : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-sky-700 dark:text-sky-300 uppercase tracking-wide flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                Format 2: Karwas TUP (Kolom H)
              </span>
              {activeUploadType === 'TUP_KOLOM_H' && (
                <span className="bg-sky-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  PILIHAN AKTIF
                </span>
              )}
            </div>
            <h5 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              Kartu Pengawasan TUP &amp; Batas Waktu TUP (Kolom H)
            </h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Membaca <strong>Kolom H</strong> sebagai batas waktu pertanggungjawaban TUP (1 bulan), Kolom E (Pagu/Nilai TUP), Kolom F (Realisasi Pertanggungjawaban TUP), Kolom G (Sisa TUP).
            </p>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx, .xls, .csv"
          className="hidden"
        />

        {/* Drag & Drop Area */}
        <div className="border-2 border-dashed border-purple-300 dark:border-purple-800 hover:border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 rounded-2xl p-8 text-center transition-all">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CreditCard className="w-7 h-7" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Pilih File Excel {activeUploadType === 'TUP_KOLOM_H' ? 'Karwas TUP (Kolom H)' : 'Pengelolaan UP (Kolom N)'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tarik file ke sini atau klik tombol di bawah (.xlsx, .xls, .csv)
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="mt-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? 'Memproses File...'
                    : activeUploadType === 'TUP_KOLOM_H'
                    ? 'Pilih File Excel Karwas TUP'
                    : 'Pilih File Excel Pengelolaan UP'}
                </span>
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
                className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terapkan ke Dashboard UP/TUP</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-200 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 uppercase sticky top-0">
                  <tr>
                    <th className="py-2 px-3">No</th>
                    <th className="py-2 px-3">Kode &amp; Satker</th>
                    <th className="py-2 px-3">Batas Revolving / TUP</th>
                    <th className="py-2 px-3 text-right">Nilai UP/TUP</th>
                    <th className="py-2 px-3 text-right">Realisasi GUP</th>
                    <th className="py-2 px-3 text-center">% Revolving</th>
                    <th className="py-2 px-3 text-center">Status &amp; Saran Pengajuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {previewRecords.map((r, idx) => {
                    const deadline = r.batasRevolvingKolomN || r.batasWaktuTUPKolomH || '-';
                    return (
                      <tr key={r.id || idx} className={r.isJatuhTempoLibur ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}>
                        <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold">{r.namaSatker}</div>
                          <div className="font-mono text-xs text-purple-700 dark:text-purple-300">{r.kodeSatker}</div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-purple-600" />
                            <span>{deadline}</span>
                          </div>
                          {r.isJatuhTempo1Minggu && (
                            <span className="inline-block mt-0.5 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded">
                              ⏳ &le; 1 Minggu
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">Rp {(r.nilaiUP || r.paguUP || 0).toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-600 font-bold">Rp {(r.realisasiGUP || 0).toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-center font-bold">{r.persentaseRevolving || r.persenRevolving}%</td>
                        <td className="py-2 px-3 text-center">
                          <div className="space-y-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.statusRevolving === 'Lancar / Normal' || r.statusRevolving === 'Optimal'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                            }`}>
                              {r.statusRevolving}
                            </span>
                            {r.isJatuhTempoLibur && (
                              <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">
                                ⚠️ Saran: {r.saranTglPengajuan}
                              </div>
                            )}
                          </div>
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
              <span>DATABASE PENGELOLAAN UP &amp; KARWAS TUP AKTIF</span>
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Daftar Satker Pengelola UP &amp; TUP ({pengelolaanUpRecords.length} Satker)
            </h4>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari satker, kode, batas waktu..."
              className="w-full pl-9 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {pengelolaanUpRecords.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-xs">Belum ada data Pengelolaan UP/TUP.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 uppercase sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Kode &amp; Satker</th>
                  <th className="py-2.5 px-3">Batas Revolving / TUP</th>
                  <th className="py-2.5 px-3 text-right">Nilai UP/TUP</th>
                  <th className="py-2.5 px-3 text-right">Realisasi GUP</th>
                  <th className="py-2.5 px-3 text-center">% Revolving</th>
                  <th className="py-2.5 px-3 text-center">Status &amp; Saran Hari Kerja</th>
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
                      (r.batasWaktuTUPKolomH && r.batasWaktuTUPKolomH.toLowerCase().includes(q))
                    );
                  })
                  .map((r, idx) => (
                    <tr key={r.id || idx} className={r.isJatuhTempoLibur ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''}>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{r.namaSatker}</div>
                        <div className="font-mono text-[11px] text-purple-600 dark:text-purple-400">{r.kodeSatker}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" />
                          <span>{r.batasRevolvingKolomN || r.batasWaktuTUPKolomH || '-'}</span>
                        </div>
                        {r.isJatuhTempo1Minggu && (
                          <span className="inline-block mt-0.5 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded">
                            ⏳ &le; 1 Minggu
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">Rp {(r.nilaiUP || r.paguUP || 0).toLocaleString('id-ID')}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-bold">Rp {(r.realisasiGUP || 0).toLocaleString('id-ID')}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{r.persentaseRevolving || r.persenRevolving}%</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="space-y-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.statusRevolving === 'Lancar / Normal' || r.statusRevolving === 'Optimal' || r.statusRevolving === 'Sangat Baik'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                          }`}>
                            {r.statusRevolving}
                          </span>
                          {r.isJatuhTempoLibur && (
                            <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">
                              ⚠️ Saran: {r.saranTglPengajuan}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
