import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  SPMGajiRecord,
  SPMGajiUploadBatch,
  MasterSatker,
  GajiIndukJenis
} from '../../types';
import {
  parseMonitoringGajiWorkbook,
  generateSampleGajiIndukExcel,
  formatPeriodeGaji,
  REQUIRED_GAJI_HEADERS
} from '../../utils/gajiIndukExcelParser';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Trash2,
  Download,
  Coins,
  ShieldCheck,
  Layers,
  ArrowRight,
  Info,
  X
} from 'lucide-react';

interface UploadGajiIndukSectionProps {
  records: SPMGajiRecord[];
  uploads: SPMGajiUploadBatch[];
  masterSatkers: MasterSatker[];
  onUploadSuccess: (newRecords: SPMGajiRecord[], newBatch: SPMGajiUploadBatch) => void;
  onDeleteBatch?: (batchId: string) => void;
  isDark?: boolean;
}

export const UploadGajiIndukSection: React.FC<UploadGajiIndukSectionProps> = ({
  records,
  uploads,
  masterSatkers,
  onUploadSuccess,
  onDeleteBatch,
  isDark = false
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{
    batch: SPMGajiUploadBatch;
    records: SPMGajiRecord[];
    warnings: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        throw new Error('Format file tidak didukung. Mohon unggah file Excel berformat .xlsx atau .xls.');
      }

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

      const parsed = parseMonitoringGajiWorkbook(workbook, file.name, masterSatkers, 'Admin KPPN');

      if (parsed.records.length === 0) {
        throw new Error('File Excel tidak memuat data transaksi SPM yang dapat diproses.');
      }

      setParsedPreview({
        batch: parsed.batch,
        records: parsed.records,
        warnings: parsed.warnings
      });
    } catch (err: any) {
      console.error('Error parsing Gaji Excel:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses file Excel.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmSave = () => {
    if (!parsedPreview) return;
    onUploadSuccess(parsedPreview.records, parsedPreview.batch);
    setParsedPreview(null);
  };

  const handleDownloadSample = (periode: string, jenis: GajiIndukJenis) => {
    const wb = generateSampleGajiIndukExcel(periode, jenis, masterSatkers);
    const fname = `Template-SPM-Gaji-${jenis}-${periode}.xlsx`;
    XLSX.writeFile(wb, fname);
  };

  return (
    <div className={`space-y-6 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
      
      {/* Banner Penjelasan Kolom Excel */}
      <div className={`p-5 rounded-2xl border ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50/50 border-emerald-200'
      }`}>
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
            <Coins className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>Format Baku Excel Monitoring SPM Gaji Induk (48 Kolom: A s.d. AV)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                Resmi SPAN/KPPN
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Sistem memvalidasi persis 48 kolom baku dari lembar kerja (Sheet1) baris pertama.
              Penentu jenis gaji diambil dari <strong>Kolom M (jnsSPP)</strong> (<em>GAJI INDUK</em> untuk PNS, dan <em>GAJI PPPK INDUK</em> untuk PPPK),
              sedangkan kode satker diambil dari <strong>Kolom AE (kodeSatker)</strong> dengan kode KPPN di <strong>Kolom AD (kodeKPPN)</strong>.
            </p>
          </div>
        </div>

        {/* Quick Sample Download */}
        <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Unduh Contoh Template Excel Sesuai Struktur:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDownloadSample('2026-08', 'PNS')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm cursor-pointer"
            >
              Agustus 2026 (PNS)
            </button>
            <button
              onClick={() => handleDownloadSample('2026-08', 'PPPK')}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-sm cursor-pointer"
            >
              Agustus 2026 (PPPK)
            </button>
            <button
              onClick={() => handleDownloadSample('2026-07', 'PNS')}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold transition-all shadow-sm cursor-pointer"
            >
              Juli 2026 (PNS)
            </button>
          </div>
        </div>
      </div>

      {/* DROPZONE UPLOAD */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileProcess(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 scale-[0.99]'
            : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={e => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileProcess(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
          {isLoading ? (
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-8 h-8" />
          )}
        </div>

        <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
          {isLoading ? 'Sedang Memvalidasi Format 48 Kolom...' : 'Tarik & Letakkan File Excel Monitoring SPM Gaji Induk di Sini'}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5">
          Atau klik untuk memilih file dari komputer Anda (.xlsx / .xls).
          Otomatis mendeteksi periode (Juni, Juli, Agustus), jenis gaji (PNS vs PPPK), dan validasi satker.
        </p>
      </div>

      {/* ERROR ALERT */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-bold">Gagal Memproses File Excel:</strong>
            <p className="text-xs mt-0.5">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* RIWAYAT BATCH UPLOAD GAJI INDUK */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Riwayat Batch Pengunggahan Monitoring SPM Gaji Induk</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daftar file Excel yang telah tersimpan dalam basis data sistem.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {uploads.length} Batch Tersimpan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Nama File</th>
                <th className="py-3 px-3.5 text-center">Periode</th>
                <th className="py-3 px-3.5 text-center">Jenis Gaji</th>
                <th className="py-3 px-3.5 text-center">Jumlah SPM</th>
                <th className="py-3 px-3.5 text-center">Satker Terdata</th>
                <th className="py-3 px-3.5">Waktu Upload</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {uploads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Belum ada batch upload Excel Gaji Induk.
                  </td>
                </tr>
              ) : (
                uploads.map(batch => (
                  <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-xs">{batch.filename}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-center font-bold">{batch.periode}</td>
                    <td className="py-3 px-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        batch.jenisGaji === 'PPPK'
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {batch.jenisGaji === 'PPPK' ? 'PPPK/P3K' : 'PNS'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {batch.jumlahRecord} SPM
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono font-bold">
                      {batch.jumlahSatker} Satker
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 text-xs">
                      {new Date(batch.uploadedAt).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {onDeleteBatch && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus batch "${batch.filename}" (${batch.periode})? Seluruh record SPM di batch ini akan dibatalkan.`)) {
                              onDeleteBatch(batch.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-all cursor-pointer"
                          title="Hapus Batch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL KONFIRMASI / PREVIEW HASIL PARSE */}
      {parsedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl p-6 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-extrabold text-base text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span>Konfirmasi Hasil Validasi File Excel</span>
              </div>
              <button
                onClick={() => setParsedPreview(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-5 space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Nama File:</span>
                  <strong className="font-mono text-slate-800 dark:text-slate-200">{parsedPreview.batch.filename}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Periode Terdeteksi:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{parsedPreview.batch.periode}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Jenis Gaji:</span>
                  <strong className="font-bold text-slate-800 dark:text-slate-200">
                    {parsedPreview.batch.jenisGaji === 'PPPK' ? 'Gaji Induk PPPK/P3K' : 'Gaji Induk PNS'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Jumlah Record SPM:</span>
                  <strong className="font-mono font-bold text-emerald-600">{parsedPreview.records.length} SPM</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Jumlah Satker Terdata:</span>
                  <strong className="font-mono font-bold text-slate-800 dark:text-slate-200">{parsedPreview.batch.jumlahSatker} Satker</strong>
                </div>
              </div>

              {parsedPreview.warnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs space-y-1">
                  <strong className="block font-bold">Catatan Verifikasi Kolom:</strong>
                  {parsedPreview.warnings.map((w, i) => (
                    <div key={i}>• {w}</div>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-500">
                Data akan digabungkan ke dalam basis data monitoring. Satker yang terdata akan otomatis
                diperbarui statusnya menjadi <strong>SUDAH MENGIRIM</strong> untuk periode {parsedPreview.batch.periode}.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setParsedPreview(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan &amp; Terapkan ke Monitoring</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
