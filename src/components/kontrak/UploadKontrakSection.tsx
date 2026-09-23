import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Info,
  Layers,
  RefreshCw,
  Sparkles,
  UploadCloud,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { KontrakMonitoringRecord, KontrakUploadBatch } from '../../types';
import {
  downloadAcceptanceTestExcelFile,
  KontrakParseResult,
  parseKontrakWorkbook
} from '../../utils/kontrakExcelParser';

interface UploadKontrakSectionProps {
  onImportBatch: (
    batch: KontrakUploadBatch,
    records: KontrakMonitoringRecord[],
    mode: 'APPEND' | 'REPLACE_PERIOD'
  ) => Promise<void> | void;
  isDark?: boolean;
}

export const UploadKontrakSection: React.FC<UploadKontrakSectionProps> = ({
  onImportBatch,
  isDark = false
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<KontrakParseResult | null>(null);
  const [importMode, setImportMode] = useState<'APPEND' | 'REPLACE_PERIOD'>('REPLACE_PERIOD');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setParseResult(null);
    setSuccessMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false
      });

      const result = parseKontrakWorkbook(workbook, file.name, 'Admin KPPN');
      setParseResult(result);
    } catch (err: any) {
      setParseResult({
        validation: {
          isValid: false,
          errorMessage: `Gagal membaca file Excel: ${err.message || 'Format tidak valid'}`,
          sheetFound: [],
          headerRow: null,
          columnCount: 0,
          expectedColumnCount: 22,
          missingCols: [],
          extraCols: [],
          renamedCols: [],
          wrongPositions: [],
          duplicateKeys: []
        },
        batch: null,
        records: [],
        warnings: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult || !parseResult.batch || parseResult.records.length === 0) return;
    setIsImporting(true);
    try {
      await onImportBatch(parseResult.batch, parseResult.records, importMode);
      setSuccessMessage(
        `Berhasil mengimpor ${parseResult.records.length} data kontrak dari file "${parseResult.batch.file_name}" ke database!`
      );
      setParseResult(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert(`Gagal menyimpan ke database: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SUCCESS BANNER */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="p-1 text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* INSTRUCTION CARD */}
      <div
        className={`p-5 rounded-3xl border shadow-sm ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-600" />
              <span>Unggah Berkas Excel Monitoring Data Kontrak</span>
            </h3>
            <p className="text-xs text-slate-500">
              Format wajib: Sheet <strong>"Data"</strong>, Header resmi berada di <strong>Baris 8</strong>,
              Data dimulai <strong>Baris 9</strong>, dan tepat <strong>22 kolom (A:V)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadAcceptanceTestExcelFile}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Format Template Excel (XLSX)</span>
            </button>
          </div>
        </div>

        {/* DROPZONE */}
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-5 p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-800/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            {isProcessing ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-6 h-6" />
            )}
          </div>

          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
            {isProcessing ? 'Memvalidasi struktur file Excel...' : 'Tarik & Letakkan file Excel di sini'}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            atau klik untuk memilih file dari komputer (.xlsx / .xls)
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sheet: <strong>Data</strong>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Header: <strong>Row 8</strong>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Data: <strong>Row 9+</strong>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Kolom: <strong>22 (A:V)</strong>
            </span>
          </div>
        </div>
      </div>

      {/* PARSE / VALIDATION RESULT MODAL / SECTION */}
      {parseResult && (
        <div
          className={`p-6 rounded-3xl border shadow-lg ${
            parseResult.validation.isValid
              ? isDark
                ? 'bg-slate-900 border-emerald-900'
                : 'bg-white border-emerald-200'
              : isDark
              ? 'bg-slate-900 border-rose-900'
              : 'bg-white border-rose-200'
          }`}
        >
          {/* HEADER STATUS */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {parseResult.validation.isValid ? (
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h4 className="font-extrabold text-base">
                  {parseResult.validation.isValid
                    ? '✅ STRUKTUR EXCEL SESUAI & TERVERIFIKASI'
                    : '❌ STRUKTUR EXCEL TIDAK SESUAI'}
                </h4>
                <p className="text-xs text-slate-500">
                  {parseResult.batch?.file_name} •{' '}
                  {parseResult.validation.isValid
                    ? `${parseResult.records.length} data kontrak valid ditemukan`
                    : 'File tidak memenuhi struktur resmi KPPN'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setParseResult(null)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* IF INVALID: SHOW DETAILED REPORT */}
          {!parseResult.validation.isValid && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 space-y-3 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Rincian Kesalahan Struktur:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                <div>
                  <strong>Sheet Ditemukan:</strong>{' '}
                  {parseResult.validation.sheetFound.length > 0
                    ? parseResult.validation.sheetFound.join(', ')
                    : 'Tidak ada'}
                </div>
                <div>
                  <strong>Header Resmi:</strong> Baris 8 (Ditemukan: Baris{' '}
                  {parseResult.validation.headerRow || 'Tidak sesuai'})
                </div>
                <div>
                  <strong>Jumlah Kolom:</strong> {parseResult.validation.columnCount} (Dibutuhkan:{' '}
                  {parseResult.validation.expectedColumnCount} kolom A:V)
                </div>
              </div>

              {parseResult.validation.missingCols.length > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800">
                  <strong className="block mb-1 text-rose-700 dark:text-rose-400">
                    Kolom yang Hilang:
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5">
                    {parseResult.validation.missingCols.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {parseResult.validation.renamedCols.length > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800">
                  <strong className="block mb-1 text-rose-700 dark:text-rose-400">
                    Nama / Posisi Kolom Berbeda:
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px]">
                    {parseResult.validation.renamedCols.map((c, i) => (
                      <li key={i}>
                        {c.position} → Harusnya "<strong>{c.expected}</strong>", Ditemukan: "
                        <strong>{c.found}</strong>"
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parseResult.validation.extraCols.length > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800">
                  <strong className="block mb-1 text-rose-700 dark:text-rose-400">
                    Kolom Tambahan Melebihi A:V:
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5">
                    {parseResult.validation.extraCols.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="font-semibold text-rose-800 dark:text-rose-300 pt-2 border-t border-rose-200 dark:border-rose-800">
                Silakan perbaiki file Excel Anda atau unduh template resmi di atas.
              </p>
            </div>
          )}

          {/* IF VALID: PREVIEW & IMPORT OPTION */}
          {parseResult.validation.isValid && parseResult.batch && (
            <div className="mt-4 space-y-4 text-xs">
              {/* METADATA INFO */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Waktu Unduh Sumber:</span>
                  <strong className="font-mono text-slate-800 dark:text-slate-200">
                    {parseResult.batch.download_time_source}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Kanwil DJPB:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {parseResult.batch.kanwil}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">KPPN:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {parseResult.batch.kppn}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Periode Kontrak:</span>
                  <strong className="font-mono text-slate-800 dark:text-slate-200">
                    {parseResult.batch.period_start} s.d. {parseResult.batch.period_end}
                  </strong>
                </div>
              </div>

              {/* WARNINGS IF ANY */}
              {parseResult.warnings.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Catatan Validasi Data:</span>
                  </div>
                  {parseResult.warnings.map((w, idx) => (
                    <div key={idx} className="pl-5">
                      {w}
                    </div>
                  ))}
                </div>
              )}

              {/* SAMPLE ROWS PREVIEW */}
              <div>
                <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Preview 5 Baris Pertama Data Kontrak:
                </h5>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 border-b">
                        <th className="py-2 px-2.5">No</th>
                        <th className="py-2 px-2.5">Nomor Kontrak</th>
                        <th className="py-2 px-2.5">Satker</th>
                        <th className="py-2 px-2.5">Supplier</th>
                        <th className="py-2 px-2.5">Nilai Kontrak</th>
                        <th className="py-2 px-2.5">Status Progress</th>
                        <th className="py-2 px-2.5">Status NRK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {parseResult.records.slice(0, 5).map((r, i) => (
                        <tr key={i}>
                          <td className="py-1.5 px-2.5 text-slate-400">{r.no}</td>
                          <td className="py-1.5 px-2.5 font-bold">{r.nomor_kontrak}</td>
                          <td className="py-1.5 px-2.5 font-sans">
                            {r.kode_satker} - {r.deskripsi_satker.slice(0, 15)}..
                          </td>
                          <td className="py-1.5 px-2.5 font-sans">{r.nama_supplier}</td>
                          <td className="py-1.5 px-2.5 text-right">
                            {r.nilai_kontrak.toLocaleString('id-ID')}
                          </td>
                          <td className="py-1.5 px-2.5 font-sans text-[10px]">
                            {r.status_progress_kontrak}
                          </td>
                          <td className="py-1.5 px-2.5 font-sans text-[10px]">{r.status_nrk}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* IMPORT MODE SELECTOR */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <span className="font-extrabold text-slate-700 dark:text-slate-300 block">
                  Pilih Mode Import Data:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'REPLACE_PERIOD'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'REPLACE_PERIOD'}
                      onChange={() => setImportMode('REPLACE_PERIOD')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <strong className="block font-bold text-slate-800 dark:text-slate-200">
                        1. Ganti Data Periode Ini (Disarankan)
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Data monitoring kontrak pada periode yang sama akan digantikan sepenuhnya oleh batch
                        terbaru ini.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'APPEND'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'APPEND'}
                      onChange={() => setImportMode('APPEND')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <strong className="block font-bold text-slate-800 dark:text-slate-200">
                        2. Tambahkan Data (Append)
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Menambahkan seluruh record ke dalam database tanpa menghapus data periode lama.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setParseResult(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Batalkan
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      <span>Simpan &amp; Import {parseResult.records.length} Kontrak</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
