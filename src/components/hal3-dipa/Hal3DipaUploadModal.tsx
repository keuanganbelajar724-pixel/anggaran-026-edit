import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  Database, 
  Info,
  Clock,
  User,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { 
  parseHal3DipaExcel, 
  processHal3BatchImport, 
  Hal3ExcelPreview 
} from '../../utils/hal3DipaExcelParser';
import { MonitoringHal3Item, UploadHal3Batch } from '../../types/hal3Dipa';

interface Hal3DipaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingRecords: MonitoringHal3Item[];
  onImportComplete: (
    updatedRecords: MonitoringHal3Item[], 
    uploadBatch: UploadHal3Batch
  ) => void;
  currentUser?: { name?: string; role?: string } | null;
  defaultTahunAnggaran?: number;
  defaultPeriode?: string;
}

export const Hal3DipaUploadModal: React.FC<Hal3DipaUploadModalProps> = ({
  isOpen,
  onClose,
  existingRecords,
  onImportComplete,
  currentUser,
  defaultTahunAnggaran = 2026,
  defaultPeriode = 'TW IV'
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Hal3ExcelPreview | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Parameter Import
  const [tahunAnggaran, setTahunAnggaran] = useState<number>(defaultTahunAnggaran);
  const [periode, setPeriode] = useState<string>(defaultPeriode);

  // Step Progress State
  const [importStatus, setImportStatus] = useState<
    'idle' | 'processing' | 'done'
  >('idle');
  const [currentStepText, setCurrentStepText] = useState<string>('');
  const [importResults, setImportResults] = useState<{
    total: number;
    baru: number;
    diperbarui: number;
    tidakValid: number;
    duplikat: number;
    dipertahankan: number;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setParseError(null);
    setIsParsing(true);
    setImportStatus('idle');

    try {
      const buffer = await selected.arrayBuffer();
      const res = parseHal3DipaExcel(buffer, selected.name, selected.size);
      setPreview(res);
    } catch (err: any) {
      setParseError(err?.message || 'Gagal memproses file Excel.');
      setPreview(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!preview || !file) return;

    setImportStatus('processing');
    const steps = [
      'Membaca berkas...',
      'Memvalidasi baris data...',
      'Mencocokkan kode satker...',
      'Memperbarui monitoring Kanwil...',
      'Mempertahankan data tindak lanjut KPPN...',
      'Menyimpan riwayat perubahan...'
    ];

    for (const step of steps) {
      setCurrentStepText(step);
      await new Promise(r => setTimeout(r, 220));
    }

    const now = new Date().toISOString();
    const batchId = `upload-hal3-${Date.now()}`;
    const userName = currentUser?.name || 'Petugas KPPN Semarang I';

    const uploadBatch: UploadHal3Batch = {
      id: batchId,
      nama_file: file.name,
      tahun_anggaran: tahunAnggaran,
      periode: periode,
      kppn_kode: '026',
      jumlah_data: preview.validRowCount,
      jumlah_baru: 0,
      jumlah_update: 0,
      jumlah_error: preview.totalRows - preview.validRowCount,
      status_import: 'BERHASIL',
      uploaded_by: userName,
      uploaded_at: now,
      catatan: `Import data monitoring Hal III DIPA ${periode} TA ${tahunAnggaran}`
    };

    const importResult = processHal3BatchImport(
      preview.parsedRows,
      existingRecords,
      uploadBatch,
      userName
    );

    uploadBatch.jumlah_baru = importResult.stats.baru;
    uploadBatch.jumlah_update = importResult.stats.diperbarui;
    uploadBatch.jumlah_error = importResult.stats.tidakValid;

    setImportResults(importResult.stats);
    setImportStatus('done');

    onImportComplete(importResult.updatedRecords, uploadBatch);
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setParseError(null);
    setImportStatus('idle');
    setImportResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-black shadow-inner">
              📤
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  UPLOAD MONITORING KANWIL
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  KPPN Semarang I
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Upload & Import Monitoring Hal III DIPA
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {importStatus === 'done' && importResults ? (
            /* HASIL IMPORT */
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/30">
                  ✓
                </div>
                <div>
                  <h3 className="text-base font-black">IMPORT SELESAI BERHASIL!</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    Data monitoring Kanwil telah berhasil disinkronkan ke dalam database ANGKASA.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Data Baru</div>
                  <div className="text-lg font-black text-emerald-600">{importResults.baru}</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Data Diperbarui</div>
                  <div className="text-lg font-black text-teal-600">{importResults.diperbarui}</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Dipertahankan</div>
                  <div className="text-lg font-black text-indigo-600">{importResults.dipertahankan}</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Duplikat Terdeteksi</div>
                  <div className="text-lg font-black text-amber-600">{importResults.duplikat}</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Tidak Valid / Dilewati</div>
                  <div className="text-lg font-black text-rose-600">{importResults.tidakValid}</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Total Baris File</div>
                  <div className="text-lg font-black text-slate-800 dark:text-slate-100">{importResults.total}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  🛡️ Perlindungan Data Internal KPPN Aktif:
                </p>
                <p>
                  Seluruh data tindak lanjut, alasan, PIC, nomor kontak, serta catatan yang telah diinputkan sebelumnya tetap utuh dan tersimpan aman.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md cursor-pointer transition-all"
                >
                  Tutup & Lihat Dashboard
                </button>
              </div>
            </div>
          ) : importStatus === 'processing' ? (
            /* STEP PROGRESS BAR */
            <div className="p-8 text-center space-y-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 animate-fade-in">
              <RefreshCw className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-black text-teal-950 dark:text-teal-100">
                  Memproses Import Data Monitoring...
                </h3>
                <p className="text-xs font-bold text-teal-700 dark:text-teal-300">
                  {currentStepText}
                </p>
              </div>
              <p className="text-[11px] text-slate-500">
                Mohon tunggu beberapa detik, sistem sedang memverifikasi identitas satker dan riwayat tindak lanjut.
              </p>
            </div>
          ) : (
            /* FORM UPLOAD & PREVIEW */
            <div className="space-y-4">
              {/* Opsi Periode & Tahun */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tahun Anggaran (TA)
                  </label>
                  <select
                    value={tahunAnggaran}
                    onChange={(e) => setTahunAnggaran(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  >
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Periode / Triwulan
                  </label>
                  <select
                    value={periode}
                    onChange={(e) => setPeriode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  >
                    <option value="TW IV">TW IV (Triwulan IV - Akhir Tahun)</option>
                    <option value="TW III">TW III (Triwulan III)</option>
                    <option value="TW II">TW II (Triwulan II)</option>
                    <option value="TW I">TW I (Triwulan I)</option>
                  </select>
                </div>
              </div>

              {/* Drag & Drop Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-teal-300 dark:border-teal-800/80 rounded-3xl bg-teal-50/30 dark:bg-teal-950/20 hover:bg-teal-50/60 dark:hover:bg-teal-950/40 text-center cursor-pointer transition-all space-y-3 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-300 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                    {file ? file.name : 'Pilih File Monitoring Hal III DIPA (.xlsx / .xls)'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Klik atau seret file hasil unduhan monitoring dari Kanwil DJPb / OMSPAN ke area ini.
                  </p>
                  <p className="text-[11px] text-teal-600 font-semibold mt-0.5">
                    Contoh: &quot;Monitoring Rev Hal III DIPA TW IV 2026.xlsx&quot;
                  </p>
                </div>
              </div>

              {parseError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* TAMPILAN PREVIEW JIKA FILE TERDETEKSI */}
              {preview && (
                <div className="space-y-4 animate-fade-in">
                  {/* Info Card File */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Informasi Berkas Terdeteksi
                      </span>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Ganti File
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block">Ukuran File</span>
                        <strong className="text-slate-800 dark:text-slate-200">{(preview.fileSize / 1024).toFixed(1)} KB</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block">Sheet Terpilih</span>
                        <strong className="text-slate-800 dark:text-slate-200 truncate block">{preview.selectedSheet}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block">Total Baris</span>
                        <strong className="text-slate-800 dark:text-slate-200">{preview.totalRows} Baris</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block">Satker Teridentifikasi</span>
                        <strong className="text-teal-600 dark:text-teal-400 font-black">{preview.validRowCount} Satker</strong>
                      </div>
                    </div>

                    {/* Validasi Kolom Kunci */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Pemeriksaan Kolom:
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          preview.detectedHeaders.kodeSatkerCol 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {preview.detectedHeaders.kodeSatkerCol ? '✓' : '✗'} Kolom Kode Satker: {preview.detectedHeaders.kodeSatkerCol || 'Tidak Ditemukan'}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          preview.detectedHeaders.namaSatkerCol 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {preview.detectedHeaders.namaSatkerCol ? '✓' : '⚠'} Kolom Nama Satker: {preview.detectedHeaders.namaSatkerCol || 'Otomatis Master Satker'}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          preview.detectedHeaders.statusKanwilCol 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {preview.detectedHeaders.statusKanwilCol ? '✓' : '⚠'} Kolom Status Pengajuan: {preview.detectedHeaders.statusKanwilCol || 'Standar Status'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabel Cuplikan Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Cuplikan Preview 8 Data Pertama:
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Identitas: Kode Satker + TA + Periode
                      </span>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase">
                          <tr>
                            <th className="py-2.5 px-3">No</th>
                            <th className="py-2.5 px-3">Kode Satker</th>
                            <th className="py-2.5 px-3">Nama Satker</th>
                            <th className="py-2.5 px-3">Status Kanwil</th>
                            <th className="py-2.5 px-3">Validasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                          {preview.sampleRows.map((sr, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{sr.rowNumber}</td>
                              <td className="py-2 px-3 font-mono font-bold text-teal-600 dark:text-teal-400">{sr.kodeSatker || '-'}</td>
                              <td className="py-2 px-3 text-slate-800 dark:text-slate-200 truncate max-w-xs">{sr.namaSatker || '-'}</td>
                              <td className="py-2 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  sr.statusKanwil === 'Sudah Mengajukan' 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {sr.statusKanwil}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                {sr.isValid ? (
                                  <span className="text-emerald-600 font-bold text-[10px]">✓ Valid</span>
                                ) : (
                                  <span className="text-rose-600 font-bold text-[10px]">{sr.error || 'Tidak Valid'}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions Batal / Import */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black shadow-lg shadow-teal-600/30 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Database className="w-4 h-4" />
                      <span>Import Data ({preview.validRowCount} Satker)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
