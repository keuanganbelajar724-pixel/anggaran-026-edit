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
  AlertTriangle
} from 'lucide-react';
import { PengelolaanUPRecord, MasterSatker, SatkerIKPA } from '../../types';
import { validateUPExcelFile, downloadPengelolaanUPTemplate } from '../../utils/modularExcelProcessors';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [previewRecords, setPreviewRecords] = useState<PengelolaanUPRecord[]>([]);
  const [uploadPeriode, setUploadPeriode] = useState<string>('Agustus 2026');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const kritisCount = pengelolaanUpRecords.filter(r => r.peringatanKritis || r.statusRevolving === 'Lambat / Kritis').length;
  const normalCount = pengelolaanUpRecords.filter(r => r.statusRevolving === 'Lancar / Normal').length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setCurrentFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const preview = await validateUPExcelFile(file, masterSatkers, uploadPeriode, 2026);
      if (!preview.validData || preview.validData.length === 0) {
        throw new Error('Tidak ada data Pengelolaan UP/TUP yang valid dalam file Excel.');
      }

      setPreviewRecords(preview.validData);

      addLog(
        'Upload Excel Pengelolaan UP/TUP',
        'UPLOAD',
        `File "${file.name}" diunggah. ${preview.validData.length} data Pengelolaan UP/TUP berhasil diproses.`,
        'SUCCESS'
      );

      showToast({
        type: 'success',
        title: 'File UP/TUP Terbaca',
        message: `${preview.validData.length} data Satker terbaca. Silakan preview sebelum menerapkan ke Database UP/TUP.`
      });
    } catch (err: any) {
      const errMsg = err.message || 'Gagal memproses file Excel Pengelolaan UP/TUP.';
      setErrorMessage(errMsg);
      addLog('Gagal Olah Pengelolaan UP/TUP', 'UPLOAD', `Gagal olah file "${file.name}": ${errMsg}`, 'WARNING');
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

    onApplyPengelolaanUp(previewRecords);

    addLog(
      'Update Database Pengelolaan UP/TUP',
      'UPLOAD',
      `${previewRecords.length} data Pengelolaan UP/TUP berhasil diterapkan ke Dashboard.`,
      'SUCCESS'
    );

    showToast({
      type: 'success',
      title: 'Database UP/TUP Diperbarui',
      message: `${previewRecords.length} data Pengelolaan UP/TUP kini aktif.`
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
            <span>MODUL DATABASE KHUSUS PENGELOLAAN UP / TUP &amp; GUP</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Upload &amp; Pengelolaan Data Uang Persediaan (UP / TUP / GUP)
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Database ini khusus mengelola pagu UP/TUP, frekuensi revolving GUP bulanan, sisa saldo kas, serta memantau satker yang melebihi batas waktu 30 hari tanpa revolving.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={downloadPengelolaanUPTemplate}
            className="bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Format Template UP/TUP</span>
          </button>
        </div>
      </div>

      {/* KPI Stats UP/TUP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-purple-50/50 border-purple-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total Satker Mengelola UP</span>
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

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-rose-50/50 border-rose-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Revolving Lambat / Kritis</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {kritisCount} <span className="text-xs font-normal text-slate-400">Satker</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-50/50 border-amber-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Periode Aktif UP/TUP</span>
          <span className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1 block truncate">
            {pengelolaanUpRecords[0]?.periode || 'Agustus 2026'}
          </span>
        </div>
      </div>

      {/* Upload Box */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Upload className="w-5 h-5 text-purple-600" />
              <span>Unggah File Excel Monitoring UP / TUP / GUP SAKTI</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Format mencakup Kolom: Kode Satker, Nama Satker, Besaran UP, Saldo Kas, Total Revolving GUP, Frekuensi GUP, Tanggal Terakhir SP2D.
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

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx, .xls, .csv"
          className="hidden"
        />

        <div className="border-2 border-dashed border-purple-300 dark:border-purple-800 hover:border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 rounded-2xl p-8 text-center transition-all">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CreditCard className="w-7 h-7" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Pilih File Excel Pengelolaan UP/TUP SAKTI
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
                <span>{isProcessing ? 'Memproses File UP/TUP...' : 'Pilih File Excel UP/TUP'}</span>
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

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-200 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 uppercase sticky top-0">
                  <tr>
                    <th className="py-2 px-3">No</th>
                    <th className="py-2 px-3">Kode &amp; Satker</th>
                    <th className="py-2 px-3 text-right">Pagu UP</th>
                    <th className="py-2 px-3 text-right">Revolving GUP</th>
                    <th className="py-2 px-3 text-center">% Revolving</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {previewRecords.slice(0, 10).map((r, idx) => (
                    <tr key={r.id || idx}>
                      <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <div className="font-bold">{r.namaSatker}</div>
                        <div className="font-mono text-xs text-purple-700 dark:text-purple-300">{r.kodeSatker}</div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">Rp {r.paguUP.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-mono">Rp {r.totalRevolvingGUP.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-center font-bold">{r.persenRevolving}%</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.statusRevolving === 'Lancar / Normal'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                        }`}>
                          {r.statusRevolving}
                        </span>
                      </td>
                    </tr>
                  ))}
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
              <span>DATABASE PENGELOLAAN UP/TUP AKTIF</span>
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Daftar Satker Pengelola UP/TUP ({pengelolaanUpRecords.length} Satker)
            </h4>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari satker / kode..."
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
                  <th className="py-2.5 px-3 text-right">Pagu UP</th>
                  <th className="py-2.5 px-3 text-right">Revolving GUP</th>
                  <th className="py-2.5 px-3 text-center">% Revolving</th>
                  <th className="py-2.5 px-3 text-center">Frekuensi GUP</th>
                  <th className="py-2.5 px-3 text-center">Status Revolving</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {pengelolaanUpRecords
                  .filter(r => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      r.namaSatker.toLowerCase().includes(q) ||
                      r.kodeSatker.includes(q)
                    );
                  })
                  .map((r, idx) => (
                    <tr key={r.id || idx}>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{r.namaSatker}</div>
                        <div className="font-mono text-[11px] text-purple-600 dark:text-purple-400">{r.kodeSatker}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">Rp {r.paguUP.toLocaleString('id-ID')}</td>
                      <td className="py-2.5 px-3 text-right font-mono">Rp {r.totalRevolvingGUP.toLocaleString('id-ID')}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{r.persenRevolving}%</td>
                      <td className="py-2.5 px-3 text-center font-mono">{r.frekuensiGUP}x</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.statusRevolving === 'Lancar / Normal'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                        }`}>
                          {r.statusRevolving}
                        </span>
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
