import React, { useState, useRef } from 'react';
import {
  Award,
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
  UserCheck
} from 'lucide-react';
import { PejabatSertifikasi, MasterSatker, SatkerIKPA } from '../../types';
import { processSertifikasiExcel, downloadSertifikasiTemplate } from '../../utils/excelProcessor';

interface UploadSertifikasiSectionProps {
  isDark: boolean;
  satkers: SatkerIKPA[];
  masterSatkers?: MasterSatker[];
  pejabatList: PejabatSertifikasi[];
  onApplyPejabatList: (pejabatList: PejabatSertifikasi[]) => void;
  onClearPejabatData: () => void;
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

export const UploadSertifikasiSection: React.FC<UploadSertifikasiSectionProps> = ({
  isDark,
  satkers,
  masterSatkers = [],
  pejabatList,
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
  const [previewPejabat, setPreviewPejabat] = useState<PejabatSertifikasi[]>([]);
  const [searchPejabat, setSearchPejabat] = useState<string>('');

  const tersertifikasiCount = pejabatList.filter(p => p.status === 'Aktif' || (p as any).statusSertifikasi === 'Tersertifikasi').length;
  const belumTersertifikasiCount = pejabatList.filter(p => p.status === 'Belum Tersertifikasi' || (p as any).statusSertifikasi === 'Belum Tersertifikasi').length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setCurrentFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await processSertifikasiExcel(file);
      if (!result.pejabatList || result.pejabatList.length === 0) {
        throw new Error('Tidak ada data Sertifikasi Pejabat yang valid dalam file Excel.');
      }

      setPreviewPejabat(result.pejabatList);

      addLog(
        'Upload Excel Sertifikasi',
        'UPLOAD',
        `File "${file.name}" diunggah. ${result.pejabatList.length} data Pejabat terbaca.`,
        'SUCCESS'
      );

      showToast({
        type: 'success',
        title: 'File Sertifikasi Terbaca',
        message: `${result.pejabatList.length} data Pejabat terbaca. Silakan preview sebelum menerapkan ke Database Sertifikasi.`
      });
    } catch (err: any) {
      const errMsg = err.message || 'Gagal memproses file Excel Sertifikasi Pejabat.';
      setErrorMessage(errMsg);
      addLog('Gagal Olah Sertifikasi Pejabat', 'UPLOAD', `Gagal olah file "${file.name}": ${errMsg}`, 'WARNING');
      showToast({
        type: 'error',
        title: 'Gagal Olah Sertifikasi',
        message: errMsg
      });
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleApplyPreview = () => {
    if (previewPejabat.length === 0) return;

    onApplyPejabatList(previewPejabat);

    addLog(
      'Update Database Sertifikasi Pejabat',
      'UPLOAD',
      `${previewPejabat.length} data Pejabat Perbendaharaan berhasil diterapkan ke Database Sertifikasi.`,
      'SUCCESS'
    );

    showToast({
      type: 'success',
      title: 'Database Sertifikasi Diperbarui',
      message: `${previewPejabat.length} Pejabat Perbendaharaan aktif di Dashboard Sertifikasi.`
    });

    setPreviewPejabat([]);
    setCurrentFileName('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-black mb-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>MODUL DATABASE KHUSUS SERTIFIKASI PEJABAT PERBENDAHARAAN</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Upload &amp; Pengelolaan Sertifikasi Pejabat (PTP / PPK / PPSPM)
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Database ini khusus menyimpan dan memantau status sertifikasi kompetensi pejabat perbendaharaan (KPA, PPK, PPSPM, Bendahara, PTP). Terpisah dan aman dari modul IKPA dan Capaian Output.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={downloadSertifikasiTemplate}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Format Template Sertifikasi</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Sertifikasi */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-50/50 border-amber-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total Pejabat Terdata</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {pejabatList.length} <span className="text-xs font-normal text-slate-400">Orang</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-emerald-50/50 border-emerald-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Tersertifikasi (Aktif)</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {tersertifikasiCount} <span className="text-xs font-normal text-slate-400">Orang</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-rose-50/50 border-rose-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Belum Tersertifikasi</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {belumTersertifikasiCount} <span className="text-xs font-normal text-slate-400">Orang</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-sky-50/50 border-sky-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Cakupan Satker</span>
          <span className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1 block">
            {new Set(pejabatList.map(p => (p as any).kodeSatker || p.kdSatker)).size} <span className="text-xs font-normal text-slate-400">Satker</span>
          </span>
        </div>
      </div>

      {/* Upload Box */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Upload className="w-5 h-5 text-amber-600" />
              <span>Unggah File Excel Sertifikasi Pejabat Perbendaharaan</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Format mencakup Kolom: Kode Satker, Nama Satker, Nama Pejabat, NIP, Jabatan, Status Sertifikasi, Nomor Sertifikat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                requestConfirm(
                  'Kosongkan Database Sertifikasi',
                  `Apakah Anda yakin ingin mengosongkan seluruh data Sertifikasi Pejabat (${pejabatList.length} Pejabat)? Data IKPA & Capaian Output tetap aman.`,
                  () => {
                    onClearPejabatData();
                    addLog('Kosongkan Data Sertifikasi', 'UPLOAD', 'Seluruh data Sertifikasi Pejabat dikosongkan.', 'WARNING');
                    showToast({
                      type: 'info',
                      title: 'Data Sertifikasi Dikosongkan',
                      message: 'Database Sertifikasi Pejabat telah dikosongkan.'
                    });
                  },
                  { confirmText: 'Kosongkan Sertifikasi', variant: 'danger' }
                );
              }}
              className="bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Data Sertifikasi</span>
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

        <div className="border-2 border-dashed border-amber-300 dark:border-amber-800 hover:border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl p-8 text-center transition-all">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Award className="w-7 h-7" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Pilih File Excel Sertifikasi Pejabat
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tarik file ke sini atau klik tombol di bawah (.xlsx, .xls, .csv)
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="mt-3 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{isProcessing ? 'Memproses File Pejabat...' : 'Pilih File Excel Sertifikasi'}</span>
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
        {previewPejabat.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-amber-200 dark:border-amber-900 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-amber-600 text-white font-black text-xs px-2.5 py-0.5 rounded-md">
                  PREVIEW ({previewPejabat.length} PEJABAT)
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  File: {currentFileName}
                </span>
              </div>

              <button
                type="button"
                onClick={handleApplyPreview}
                className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terapkan ke Database Sertifikasi</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-200 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 uppercase sticky top-0">
                  <tr>
                    <th className="py-2 px-3">No</th>
                    <th className="py-2 px-3">Satker</th>
                    <th className="py-2 px-3">Nama Pejabat</th>
                    <th className="py-2 px-3">Jabatan</th>
                    <th className="py-2 px-3">NIP</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {previewPejabat.slice(0, 10).map((p: any, idx) => (
                    <tr key={p.id || idx}>
                      <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <div className="font-bold">{p.namaSatker || p.nmSatker}</div>
                        <div className="font-mono text-xs text-amber-700 dark:text-amber-300">{p.kodeSatker || p.kdSatker}</div>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">{p.namaPejabat || p.nama}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{p.jabatan || p.nmJabatan}</td>
                      <td className="py-2 px-3 font-mono">{p.nip || '-'}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.statusSertifikasi === 'Tersertifikasi' || p.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                        }`}>
                          {p.statusSertifikasi || p.status}
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

      {/* Database View Pejabat Aktif */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full text-xs font-bold mb-1">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>DATABASE PEJABAT AKTIF</span>
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Daftar Pejabat Perbendaharaan Aktif ({pejabatList.length} Pejabat)
            </h4>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchPejabat}
              onChange={(e) => setSearchPejabat(e.target.value)}
              placeholder="Cari pejabat / NIP / satker..."
              className="w-full pl-9 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {pejabatList.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Award className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-xs">Belum ada data Sertifikasi Pejabat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 uppercase sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Kode &amp; Satker</th>
                  <th className="py-2.5 px-3">Nama Pejabat</th>
                  <th className="py-2.5 px-3">Jabatan</th>
                  <th className="py-2.5 px-3">NIP</th>
                  <th className="py-2.5 px-3 text-center">Status Sertifikasi</th>
                  <th className="py-2.5 px-3">No. Sertifikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {pejabatList
                  .filter(p => {
                    if (!searchPejabat) return true;
                    const q = searchPejabat.toLowerCase();
                    return (
                      (p.nama || (p as any).namaPejabat || '').toLowerCase().includes(q) ||
                      (p.kdSatker || (p as any).kodeSatker || '').includes(q) ||
                      (p.nip || '').includes(q) ||
                      (p.nmSatker || (p as any).namaSatker || '').toLowerCase().includes(q)
                    );
                  })
                  .map((p: any, idx) => (
                    <tr key={p.id || idx}>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{p.namaSatker || p.nmSatker}</div>
                        <div className="font-mono text-[11px] text-amber-600 dark:text-amber-400">{p.kodeSatker || p.kdSatker}</div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{p.namaPejabat || p.nama}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{p.jabatan || p.nmJabatan}</td>
                      <td className="py-2.5 px-3 font-mono">{p.nip || '-'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.statusSertifikasi === 'Tersertifikasi' || p.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                        }`}>
                          {p.statusSertifikasi || p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{p.noSertifikat || '-'}</td>
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
