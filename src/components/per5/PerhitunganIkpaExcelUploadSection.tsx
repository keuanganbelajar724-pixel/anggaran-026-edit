import React, { useState, useMemo, useRef } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Lock, 
  Search, 
  FileText, 
  Layers, 
  Sparkles, 
  Info, 
  ChevronRight, 
  Table as TableIcon,
  HelpCircle,
  Database,
  Calendar,
  UserCheck,
  Check,
  ArrowUpDown
} from 'lucide-react';
import { PerhitunganIkpaExcelReference, ExcelSheetData, AppTheme } from '../../types';
import { 
  downloadPerhitunganIkpaExcel, 
  parseUploadedPerhitunganExcel, 
  DEFAULT_PERHITUNGAN_IKPA_REFERENCE 
} from '../../utils/perhitunganIkpaExcelHelper';

interface PerhitunganIkpaExcelUploadSectionProps {
  referenceData?: PerhitunganIkpaExcelReference;
  isAdminAuthenticated: boolean;
  onAuthenticateAdmin?: () => void;
  onSaveReference: (newRef: PerhitunganIkpaExcelReference) => void;
  theme: AppTheme;
}

export const PerhitunganIkpaExcelUploadSection: React.FC<PerhitunganIkpaExcelUploadSectionProps> = ({
  referenceData = DEFAULT_PERHITUNGAN_IKPA_REFERENCE,
  isAdminAuthenticated,
  onAuthenticateAdmin,
  onSaveReference,
  theme
}) => {
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Sheet Selector
  const [activeSheetIdx, setActiveSheetIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Pending uploaded data for preview before saving
  const [previewRef, setPreviewRef] = useState<PerhitunganIkpaExcelReference | null>(null);

  // The displayed reference is either the preview or the confirmed saved reference
  const currentRef = previewRef || referenceData || DEFAULT_PERHITUNGAN_IKPA_REFERENCE;

  // Selected sheet
  const currentSheet: ExcelSheetData | undefined = currentRef.sheets?.[activeSheetIdx] || currentRef.sheets?.[0];

  // Filtered rows for the active sheet
  const filteredRows = useMemo(() => {
    if (!currentSheet || !currentSheet.rows) return [];
    if (!searchQuery.trim()) return currentSheet.rows;

    const q = searchQuery.toLowerCase().trim();
    return currentSheet.rows.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(q)
      );
    });
  }, [currentSheet, searchQuery]);

  // Handle Drag & Drop / File Input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    await processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    setUploadError(null);
    setSuccessNotice(null);
    setIsUploading(true);

    try {
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        throw new Error('Hanya berkas Excel (.xlsx, .xls) atau .csv yang didukung.');
      }

      const parsed = await parseUploadedPerhitunganExcel(file, 'Administrator KPPN Semarang I');
      setPreviewRef(parsed);
      setActiveSheetIdx(0);
      setSuccessNotice(`File "${file.name}" berhasil dibaca! Tinjau lembar kerja di bawah, lalu klik "Simpan Sebagai Acuan Aktif".`);
    } catch (err: any) {
      setUploadError(err?.message || 'Gagal memproses file Excel.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAdminAuthenticated) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleConfirmSave = () => {
    if (!previewRef) return;
    onSaveReference(previewRef);
    setPreviewRef(null);
    setSuccessNotice('Acuan dasar perhitungan IKPA berhasil diperbarui dan disimpan ke sistem secara permanen.');
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  const handleCancelPreview = () => {
    setPreviewRef(null);
    setUploadError(null);
    setSuccessNotice(null);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan ke Acuan Dasar Perhitungan Standar DJPb PER-5/PB/2024?')) {
      onSaveReference(DEFAULT_PERHITUNGAN_IKPA_REFERENCE);
      setPreviewRef(null);
      setSuccessNotice('Acuan perhitungan berhasil di-reset ke template resmi DJPb.');
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  const handleDownloadActiveFile = () => {
    downloadPerhitunganIkpaExcel(currentRef);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className={`p-6 sm:p-7 rounded-3xl border shadow-lg transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-slate-800 text-white' 
          : 'bg-gradient-to-br from-teal-900 via-slate-900 to-indigo-950 border-teal-800 text-white'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Format Excel / Spreadsheet Acuan</span>
              </span>

              {isAdminAuthenticated ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Akses Admin Terbuka (Bisa Unggah &amp; Perbarui)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Akses Satker (Hanya Lihat &amp; Unduh)</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Pembaruan: {currentRef.uploadedAt || 'Terbaru'}</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Dasar &amp; Contoh Perhitungan IKPA (PER-5/PB/2024 &amp; 2025)</span>
            </h2>

            <p className="text-sm text-slate-200 leading-relaxed">
              Berkas spreadsheet resmi yang menjadi basis formula, pembobotan 8 indikator, trajektori target triwulanan, dan simulasi penilaian IKPA di KPPN Semarang I. Satuan kerja dapat mengunduh dan mempelajari spreadsheet ini, sedangkan Administrator KPPN dapat memperbaruinya apabila terdapat formulasi atau petunjuk teknis perhitungan baru.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <button
              onClick={handleDownloadActiveFile}
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              title="Unduh file Excel (.xlsx) acuan aktif ke komputer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Spreadsheet (.xlsx)</span>
            </button>

            {isAdminAuthenticated && (
              <button
                onClick={handleResetToDefault}
                className="px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 flex items-center gap-1.5 cursor-pointer transition-all"
                title="Reset kembali ke acuan standar DJPb"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Reset Default</span>
              </button>
            )}
          </div>
        </div>

        {/* Highlight Metadata Badges */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
            <div className="text-slate-400 font-medium">Berkas Aktif:</div>
            <div className="font-bold text-emerald-300 truncate mt-0.5" title={currentRef.fileName}>
              {currentRef.fileName}
            </div>
          </div>
          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
            <div className="text-slate-400 font-medium">Jumlah Lembar (Sheet):</div>
            <div className="font-bold text-sky-300 mt-0.5">
              {currentRef.sheets?.length || 0} Lembar Kerja
            </div>
          </div>
          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
            <div className="text-slate-400 font-medium">Total Baris Contoh/Acuan:</div>
            <div className="font-bold text-amber-300 mt-0.5">
              {currentRef.totalDataRows || 0} Baris Data
            </div>
          </div>
          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
            <div className="text-slate-400 font-medium">Pengunggah / Sumber:</div>
            <div className="font-bold text-purple-300 truncate mt-0.5" title={currentRef.uploadedBy}>
              {currentRef.uploadedBy}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="flex-1">{successNotice}</div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-500 hover:underline text-xs">Tutup</button>
        </div>
      )}

      {uploadError && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-200 flex items-center gap-3 animate-fade-in text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <div className="flex-1">{uploadError}</div>
          <button onClick={() => setUploadError(null)} className="text-rose-500 hover:underline text-xs">Tutup</button>
        </div>
      )}

      {/* SECTION 1: ADMIN UPLOAD BOX (Or Login Prompt if Non-Admin) */}
      {!isAdminAuthenticated ? (
        <div className={`p-6 rounded-2xl border ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-amber-50/50 border-amber-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-500">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Area Unggah Spreadsheet Dibatasi Khusus Admin
                </h3>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Penggantian atau pembaruan contoh perhitungan acuan hanya dapat dilakukan oleh Admin Pengelola IKPA KPPN. Satuan kerja tetap dapat mempelajari seluruh sheet dan formula di bawah ini serta mengunduhnya.
                </p>
              </div>
            </div>

            {onAuthenticateAdmin && (
              <button
                onClick={onAuthenticateAdmin}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 cursor-pointer shrink-0 shadow-md transition-all active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Login Admin untuk Unggah File</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className={`font-black text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <UploadCloud className="w-5 h-5 text-emerald-500" />
                <span>Panel Unggah Excel Contoh Dasar Perhitungan (Khusus Admin)</span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Unggah spreadsheet Excel (.xlsx / .xls) untuk memperbarui rumus, matriks bobot, atau contoh simulasi satker jika ada reformulasi kebijakan baru.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Admin KPPN Terverifikasi</span>
              </span>
            </div>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isUploading 
                ? 'border-emerald-500 bg-emerald-500/5' 
                : isDark 
                  ? 'border-slate-700 hover:border-emerald-500/60 bg-slate-950/40 hover:bg-slate-900/60' 
                  : 'border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isUploading ? 'Sedang mengekstrak lembar kerja Excel...' : 'Tarik & Letakkan Berkas Excel ke Sini atau Klik untuk Memilih'}
                </p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Mendukung format <strong>.xlsx</strong>, <strong>.xls</strong>, atau <strong>.csv</strong> multi-sheet (hingga 25 MB).
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors">
                <UploadCloud className="w-4 h-4" />
                <span>Pilih Berkas dari Komputer</span>
              </div>
            </div>
          </div>

          {/* Pending Preview Bar (if newly uploaded file is ready to apply) */}
          {previewRef && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 space-y-3 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-sm font-black text-amber-900 dark:text-amber-200">
                      File Baru Siap Diterapkan: &ldquo;{previewRef.fileName}&rdquo;
                    </div>
                    <div className="text-xs text-amber-800/80 dark:text-amber-300/80">
                      Terbaca {previewRef.sheets.length} sheet dan {previewRef.totalDataRows} baris data acuan. Tinjau lembar kerja di bawah sebelum menyimpan.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleConfirmSave}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Sebagai Acuan Aktif</span>
                  </button>
                  <button
                    onClick={handleCancelPreview}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: SPREADSHEET WORKBOOK VIEWER */}
      <div className={`p-6 rounded-3xl border shadow-sm space-y-5 ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className={`font-black text-base flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <TableIcon className="w-5 h-5 text-sky-500" />
              <span>Pratinjau Lembar Kerja &amp; Tabel Acuan Perhitungan</span>
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Klik tab lembar (sheet) di bawah untuk memeriksa formula, simulasi perhitungan, atau ambang batas tiap indikator.
            </p>
          </div>

          {/* Search box inside active sheet */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari teks / indikator di tabel..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border transition-colors outline-none ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 text-white focus:border-sky-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500'
              }`}
            />
          </div>
        </div>

        {/* Sheet Tabs Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
          {currentRef.sheets?.map((sh, idx) => {
            const isActive = idx === activeSheetIdx;
            return (
              <button
                key={sh.sheetName + idx}
                onClick={() => {
                  setActiveSheetIdx(idx);
                  setSearchQuery('');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-2 ${
                  isActive
                    ? isDark
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                      : 'bg-sky-50 text-sky-700 border border-sky-300 shadow-sm'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <FileSpreadsheet className={`w-3.5 h-3.5 ${isActive ? 'text-sky-500' : 'text-slate-400'}`} />
                <span>{sh.sheetName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive 
                    ? isDark ? 'bg-sky-500/30 text-sky-200' : 'bg-sky-200 text-sky-800'
                    : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                }`}>
                  {sh.totalRows}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table View */}
        {currentSheet ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>
                Menampilkan <strong>{filteredRows.length}</strong> dari {currentSheet.totalRows} baris pada sheet &ldquo;<strong>{currentSheet.sheetName}</strong>&rdquo;
              </span>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-sky-500 hover:underline cursor-pointer"
                >
                  Bersihkan Pencarian
                </button>
              )}
            </div>

            <div className={`overflow-x-auto rounded-2xl border max-h-[500px] scrollbar-thin ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'
            }`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead className={`sticky top-0 z-10 font-bold border-b ${
                  isDark ? 'bg-slate-900 text-slate-200 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <tr>
                    <th className="px-3.5 py-3 text-center w-12 text-slate-400">#</th>
                    {currentSheet.columns.map((col, idx) => (
                      <th key={col + idx} className="px-4 py-3 whitespace-nowrap font-bold tracking-tight">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={currentSheet.columns.length + 1} className="px-4 py-12 text-center text-slate-400">
                        Tidak ada data yang sesuai dengan filter pencarian &ldquo;{searchQuery}&rdquo;.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, rIdx) => (
                      <tr 
                        key={rIdx}
                        className={`transition-colors ${
                          isDark 
                            ? 'hover:bg-slate-800/40 odd:bg-slate-950/30' 
                            : 'hover:bg-slate-50 odd:bg-slate-50/40'
                        }`}
                      >
                        <td className="px-3.5 py-2.5 text-center text-slate-400 font-mono text-[11px]">
                          {rIdx + 1}
                        </td>
                        {currentSheet.columns.map((col, cIdx) => {
                          const val = row[col];
                          const strVal = val !== undefined && val !== null ? String(val) : '';
                          const isNumeric = typeof val === 'number' || (!isNaN(Number(strVal)) && strVal.trim() !== '');

                          return (
                            <td 
                              key={cIdx} 
                              className={`px-4 py-2.5 text-[12px] leading-relaxed ${
                                isNumeric 
                                  ? 'font-mono text-slate-800 dark:text-slate-200 font-semibold' 
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {strVal}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-sm">
            Tidak ada lembar kerja ditemukan dalam berkas Excel ini.
          </div>
        )}
      </div>

      {/* SECTION 3: RULES & FORMULA EXPLANATION CARDS */}
      <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
          <Info className="w-4 h-4 text-emerald-500" />
          <span>Aturan Evaluasi yang Terkandung dalam Acuan Spreadsheet Ini</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
            <div className="font-bold text-emerald-500 flex items-center justify-between">
              <span>Revisi DIPA (10%)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 font-mono">Sem I &amp; II</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              0-1 kali = Nilai 110 (Bonus). 2 kali = Nilai 100. Lebih dari 2 kali = Nilai 50. Memperhitungkan 14 jenis revisi pagu tetap.
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
            <div className="font-bold text-sky-500 flex items-center justify-between">
              <span>Deviasi Hal III (15%)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 font-mono">Ambang ≤ 5.0%</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Deviasi bulanan tertimbang ≤ 5% bernilai 100. Di atas 5% nilai berkurang bertahap hingga batas deviasi 20% (0 poin).
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
            <div className="font-bold text-amber-500 flex items-center justify-between">
              <span>Pengelolaan UP/TUP (10%)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 font-mono">Bonus KKP 110</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              50% GUP tepat waktu, 25% GUP disebulankan, 25% Setoran TUP tepat. Transaksi KKP aktif memberi nilai bonus 110.
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
            <div className="font-bold text-purple-500 flex items-center justify-between">
              <span>Capaian Output (25%)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 font-mono">HK ke-5 &amp; PCRO</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Bobot terbesar (25%). Menilai ketepatan lapor hari kerja ke-5 dan ketercapaian target progres fisik RO (PCRO vs TPCRO).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
