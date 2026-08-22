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
  UserCheck,
  Clock,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { PejabatSertifikasi, MasterSatker, SatkerIKPA } from '../../types';
import { 
  validatePejabatExcelFile, 
  downloadPejabatBelumBersertifikatTemplate, 
  downloadPejabatBelumPerpanjanganTemplate, 
  downloadPejabatTemplate 
} from '../../utils/modularExcelProcessors';

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
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [uploadMode, setUploadMode] = useState<'MERGE' | 'REPLACE_CATEGORY' | 'REPLACE_ALL'>('MERGE');
  const [searchPejabat, setSearchPejabat] = useState<string>('');

  const belumBersertifikatCount = pejabatList.filter(p => p.kategoriData === 'BELUM_SERTIFIKAT' || !p.noSertifikat || p.noSertifikat === 'Belum Ada' || p.noSertifikat === 'Tidak Ada').length;
  const belumPerpanjanganCount = pejabatList.filter(p => p.kategoriData === 'BELUM_PERPANJANGAN' || (p.noSertifikat && p.noSertifikat !== 'Belum Ada' && p.noSertifikat !== 'Tidak Ada')).length;
  const aktifCount = pejabatList.filter(p => (p.statusJabatan || 'Aktif').toLowerCase() === 'aktif').length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setCurrentFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await validatePejabatExcelFile(file, masterSatkers);
      if (!result.validData || result.validData.length === 0) {
        throw new Error('Tidak ada data Sertifikasi Pejabat yang valid dalam file Excel.');
      }

      setPreviewData(result);

      addLog(
        'Upload Excel Pejabat',
        'UPLOAD',
        `File "${file.name}" diunggah. ${result.validData.length} data Pejabat terbaca (${result.periode}).`,
        'SUCCESS'
      );

      showToast({
        type: 'success',
        title: 'File Pejabat Terbaca',
        message: `${result.validData.length} data Pejabat terbaca. Silakan pilih opsi penerapan sebelum menyimpan.`
      });
    } catch (err: any) {
      const errMsg = err.message || 'Gagal memproses file Excel Pejabat Perbendaharaan.';
      setErrorMessage(errMsg);
      setPreviewData(null);
      addLog('Gagal Olah Pejabat', 'UPLOAD', `Gagal olah file "${file.name}": ${errMsg}`, 'WARNING');
      showToast({
        type: 'error',
        title: 'Gagal Olah File',
        message: errMsg
      });
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleApplyPreview = () => {
    if (!previewData || !previewData.validData || previewData.validData.length === 0) return;

    let mergedList: PejabatSertifikasi[] = [];

    if (uploadMode === 'REPLACE_ALL') {
      mergedList = previewData.validData;
    } else if (uploadMode === 'REPLACE_CATEGORY') {
      const incomingCategory = previewData.validData[0]?.kategoriData || 'BELUM_SERTIFIKAT';
      const keepOtherCategories = pejabatList.filter(p => p.kategoriData !== incomingCategory);
      mergedList = [...keepOtherCategories, ...previewData.validData];
    } else {
      // MERGE & UPDATE based on NIP & Kode Satker
      const existingMap = new Map<string, PejabatSertifikasi>();
      pejabatList.forEach(p => {
        const key = `${p.nip || ''}_${p.kdSatker || ''}_${p.nmJabatan || ''}`;
        existingMap.set(key, p);
      });

      previewData.validData.forEach((newP: PejabatSertifikasi) => {
        const key = `${newP.nip || ''}_${newP.kdSatker || ''}_${newP.nmJabatan || ''}`;
        existingMap.set(key, newP);
      });

      mergedList = Array.from(existingMap.values());
    }

    onApplyPejabatList(mergedList);

    addLog(
      'Update Database Pejabat Perbendaharaan',
      'UPLOAD',
      `${previewData.validData.length} data Pejabat (${uploadMode}) berhasil disimpan ke database.`,
      'SUCCESS'
    );

    showToast({
      type: 'success',
      title: 'Database Pejabat Diperbarui',
      message: `Total ${mergedList.length} Pejabat Perbendaharaan aktif di Dashboard.`
    });

    setPreviewData(null);
    setCurrentFileName('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-black mb-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>MODUL DATABASE SERTIFIKASI PEJABAT PERBENDAHARAAN</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Upload &amp; Pengelolaan Pejabat Perbendaharaan (PTP / PPK / PPSPM / Bendahara)
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Mendukung otomatis Format 1 (Belum Bersertifikat) dan Format 2 (Belum Perpanjangan) dari KPPN Semarang I. Data tersimpan rapi, lengkap dengan status usulan SIMASPATEN dan rekomendasi tindak lanjut.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="relative group">
            <button
              type="button"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Template Excel</span>
            </button>
            <div className="absolute right-0 mt-1 w-64 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl p-2 hidden group-hover:block z-30 space-y-1">
              <button
                type="button"
                onClick={downloadPejabatBelumBersertifikatTemplate}
                className="w-full text-left px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/20 rounded-xl flex items-center justify-between"
              >
                <span>Format Belum Bersertifikat</span>
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={downloadPejabatBelumPerpanjanganTemplate}
                className="w-full text-left px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/20 rounded-xl flex items-center justify-between"
              >
                <span>Format Belum Perpanjangan</span>
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={downloadPejabatTemplate}
                className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 rounded-xl flex items-center justify-between border-t border-slate-800 pt-2"
              >
                <span>Format Standar Gabungan</span>
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Pejabat */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-indigo-50/50 border-indigo-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Total Pejabat Terdata</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
            {pejabatList.length} <span className="text-xs font-normal text-slate-400">Orang</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-rose-50/50 border-rose-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Belum Bersertifikat</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {belumBersertifikatCount} <span className="text-xs font-normal text-slate-400">Orang</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-amber-50/50 border-amber-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Belum Perpanjangan</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {belumPerpanjanganCount} <span className="text-xs font-normal text-slate-400">Orang</span>
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-emerald-50/50 border-emerald-100'}`}>
          <span className="text-slate-500 dark:text-slate-400 block font-semibold">Pejabat Aktif</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {aktifCount} <span className="text-xs font-normal text-slate-400">Pejabat</span>
          </span>
        </div>
      </div>

      {/* Upload Box */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Upload className="w-5 h-5 text-amber-600" />
              <span>Unggah File Excel Pejabat Perbendaharaan</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mendukung otomatis file Excel/CSV Satker Belum Bersertifikat &amp; Belum Perpanjangan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                requestConfirm(
                  'Kosongkan Database Pejabat',
                  `Apakah Anda yakin ingin mengosongkan seluruh data Pejabat Perbendaharaan (${pejabatList.length} Pejabat)? Data IKPA, Capaian Output, & UP tetap aman.`,
                  () => {
                    onClearPejabatData();
                    addLog('Kosongkan Data Pejabat', 'UPLOAD', 'Seluruh data Pejabat Perbendaharaan dikosongkan.', 'WARNING');
                    showToast({
                      type: 'info',
                      title: 'Data Pejabat Dikosongkan',
                      message: 'Database Pejabat Perbendaharaan telah dikosongkan.'
                    });
                  },
                  { confirmText: 'Kosongkan Pejabat', variant: 'danger' }
                );
              }}
              className="bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Data Pejabat</span>
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
                Pilih File Excel Pejabat Perbendaharaan
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
                <span>{isProcessing ? 'Memproses File Pejabat...' : 'Pilih File Excel Pejabat'}</span>
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

        {/* Preview & Options */}
        {previewData && (
          <div className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-amber-200 dark:border-amber-900 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-amber-600 text-white font-black text-xs px-2.5 py-0.5 rounded-md">
                  PREVIEW ({previewData.validData.length} PEJABAT)
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {previewData.periode} ({currentFileName})
                </span>
              </div>

              <button
                type="button"
                onClick={handleApplyPreview}
                className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan ke Database Pejabat</span>
              </button>
            </div>

            {/* Mode selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setUploadMode('MERGE')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  uploadMode === 'MERGE'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 font-bold text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-black">1. Gabungkan &amp; Update (Merge)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Pertahankan data kategori lain &amp; perbarui yang cocok.</div>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('REPLACE_CATEGORY')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  uploadMode === 'REPLACE_CATEGORY'
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/80 font-bold text-amber-900 dark:text-amber-200 ring-2 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-black">2. Ganti Kategori Terkait</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Timpa semua data dalam kategori yang sama.</div>
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
                <div className="font-black">3. Ganti Seluruh Database</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Kosongkan seluruh data lama &amp; gunakan file ini.</div>
              </button>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-200 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 uppercase sticky top-0">
                  <tr>
                    <th className="py-2 px-3">No</th>
                    <th className="py-2 px-3">Satker</th>
                    <th className="py-2 px-3">Nama Pejabat &amp; NIP</th>
                    <th className="py-2 px-3">Jabatan</th>
                    <th className="py-2 px-3">Status Usulan</th>
                    <th className="py-2 px-3 text-center">Status / Sertifikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {previewData.validData.slice(0, 10).map((p: any, idx: number) => (
                    <tr key={p.id || idx}>
                      <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <div className="font-bold">{p.nmSatker}</div>
                        <div className="font-mono text-xs text-amber-700 dark:text-amber-300">{p.kdSatker}</div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{p.nama}</div>
                        <div className="font-mono text-[11px] text-slate-500">{p.nip}</div>
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{p.nmJabatan}</td>
                      <td className="py-2 px-3 font-medium">{p.statusUsulan || 'Belum rekam usulan'}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.kategoriData === 'BELUM_SERTIFIKAT'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                        }`}>
                          {p.noSertifikat && p.noSertifikat !== 'Belum Ada' ? p.noSertifikat : 'Belum Ada Sertifikat'}
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
            <p className="font-bold text-xs">Belum ada data Pejabat Perbendaharaan.</p>
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
                  <th className="py-2.5 px-3">Status Usulan</th>
                  <th className="py-2.5 px-3 text-center">Status / Sertifikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {pejabatList
                  .filter(p => {
                    if (!searchPejabat) return true;
                    const q = searchPejabat.toLowerCase();
                    return (
                      (p.nama || '').toLowerCase().includes(q) ||
                      (p.kdSatker || '').includes(q) ||
                      (p.nip || '').includes(q) ||
                      (p.nmSatker || '').toLowerCase().includes(q) ||
                      (p.nmJabatan || '').toLowerCase().includes(q)
                    );
                  })
                  .map((p, idx) => (
                    <tr key={p.id || idx}>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{p.nmSatker}</div>
                        <div className="font-mono text-[11px] text-amber-600 dark:text-amber-400">{p.kdSatker}</div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{p.nama}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{p.nmJabatan}</td>
                      <td className="py-2.5 px-3 font-mono">{p.nip || '-'}</td>
                      <td className="py-2.5 px-3">{p.statusUsulan || 'Belum rekam usulan'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.kategoriData === 'BELUM_SERTIFIKAT' || !p.noSertifikat || p.noSertifikat === 'Belum Ada'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                        }`}>
                          {p.noSertifikat && p.noSertifikat !== 'Belum Ada' ? p.noSertifikat : 'Belum Bersertifikat'}
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
