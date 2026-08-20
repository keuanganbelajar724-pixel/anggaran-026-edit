import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
  Check,
  Building2,
  Calendar,
  Sparkles,
  Lock
} from 'lucide-react';
import { MasterSatker, TransaksiKKPRecord } from '../../types';
import { validateKKPExcelFile, downloadKKPTemplate } from '../../utils/modularExcelProcessors';

interface UploadKKPSectionProps {
  satkers?: any[];
  masterSatkers?: MasterSatker[];
  transaksiKkpRecords?: TransaksiKKPRecord[];
  onApplyTransaksiKkp?: (records: TransaksiKKPRecord[]) => void;
  onClearTransaksiKkp?: () => void;
  onUploadSuccess?: (records: TransaksiKKPRecord[], batchInfo: any) => void;
  onResetData?: () => void;
  requestConfirm?: any;
  currentRecordsCount?: number;
  addLog?: (action: string, category: 'AUTH' | 'UPLOAD' | 'SETTINGS' | 'ANNOUNCEMENT', details: string, status?: 'SUCCESS' | 'WARNING' | 'INFO') => void;
  showToast?: (opts: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
  isDark?: boolean;
}

export const UploadKKPSection: React.FC<UploadKKPSectionProps> = ({
  satkers = [],
  masterSatkers = [],
  transaksiKkpRecords = [],
  onApplyTransaksiKkp,
  onClearTransaksiKkp,
  onUploadSuccess,
  onResetData,
  requestConfirm,
  currentRecordsCount = 0,
  addLog,
  showToast,
  isDark = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Agustus 2026');

  const effectiveCount = transaksiKkpRecords.length || currentRecordsCount;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const preview = await validateKKPExcelFile(file, masterSatkers, selectedPeriod, 2026);
      setPreviewData(preview);
    } catch (err: any) {
      if (showToast) {
        showToast({
          type: 'error',
          title: 'Gagal Membaca File',
          message: err.message || 'Terjadi kesalahan saat memproses Excel.'
        });
      } else {
        alert(err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyImport = () => {
    if (!previewData || !previewData.validData || previewData.validData.length === 0) return;

    const validCount = previewData.validData.length;

    if (onApplyTransaksiKkp) {
      onApplyTransaksiKkp(previewData.validData);
    } else if (onUploadSuccess) {
      onUploadSuccess(previewData.validData, {
        fileName: previewData.fileName,
        totalRows: previewData.totalRows,
        validCount
      });
    }

    if (addLog) {
      addLog(
        'Upload Excel Transaksi KKP',
        'UPLOAD',
        `File: ${previewData.fileName} (${validCount} Satker berhasil diimpor)`,
        'SUCCESS'
      );
    }

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Impor Berhasil Disimpan',
        message: `Total ${validCount} Satker data transaksi KKP berhasil diperbarui.`
      });
    }

    setPreviewData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              MODUL TRANSAKSI KKP & GUP
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              Saat ini: <strong className="text-indigo-600 dark:text-indigo-400">{effectiveCount}</strong> Satker
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            Upload &amp; Pengelolaan Data Transaksi KKP (GUP)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Unggah file laporan transaksi KKP (OM-SPAN / SAKTI). Sistem secara otomatis mengagregasi frekuensi SP2D dan total rupiah per Satker tanpa mempublikasikan kolom rahasia (C s.d. I).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {effectiveCount > 0 && (onClearTransaksiKkp || onResetData) && (
            <button
              type="button"
              onClick={() => {
                if (requestConfirm) {
                  requestConfirm({
                    title: 'Hapus Data Transaksi KKP',
                    message: 'Apakah Anda yakin ingin mereset/mengosongkan data transaksi KKP saat ini?',
                    confirmLabel: 'Hapus Data',
                    variant: 'danger',
                    onConfirm: () => {
                      if (onClearTransaksiKkp) onClearTransaksiKkp();
                      else if (onResetData) onResetData();
                      if (showToast) showToast({ type: 'info', title: 'Data KKP Direset', message: 'Data transaksi KKP telah dibersihkan.' });
                    }
                  });
                } else if (window.confirm('Hapus seluruh data Transaksi KKP?')) {
                  if (onClearTransaksiKkp) onClearTransaksiKkp();
                  else if (onResetData) onResetData();
                }
              }}
              className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200 dark:border-rose-800"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Data</span>
            </button>
          )}

          <button
            type="button"
            onClick={downloadKKPTemplate}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Template Excel</span>
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <div className="p-1.5 bg-indigo-200/60 dark:bg-indigo-900 rounded-lg shrink-0 mt-0.5">
          <Lock className="w-4 h-4 text-indigo-700 dark:text-indigo-300" />
        </div>
        <div>
          <strong className="font-bold">Ketentuan Privasi &amp; Pengecualian Kolom Otomatis:</strong> Kolom C s.d. I (yang berisi nomor rekening pihak ketiga, detail vendor individual, atau nomor faktur rinci) <strong>tidak ditampilkan di dashboard publik</strong>, hanya Kode Satker, Nama Satker, Frekuensi Transaksi, Total Nominal Rupiah, Bank Mitra, dan No/Tanggal SP2D yang dipublikasikan.
        </div>
      </div>

      {/* Upload Box */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 text-center hover:border-indigo-500 transition-all bg-slate-50/50 dark:bg-slate-950/30">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
          id="kkp-excel-input"
        />

        <div className="space-y-3">
          <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Upload className="w-7 h-7" />
          </div>

          <div>
            <label
              htmlFor="kkp-excel-input"
              className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl cursor-pointer shadow-md shadow-indigo-600/30 transition-all"
            >
              {isProcessing ? 'Memproses File...' : 'Pilih File Excel Transaksi KKP'}
            </label>
            <p className="text-[11px] text-slate-400 mt-2">
              Mendukung file format <code>.xlsx</code>, <code>.xls</code> (Laporan OM-SPAN GUP KKP)
            </p>
          </div>
        </div>
      </div>

      {/* Preview Container if loaded */}
      {previewData && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/70 p-4 rounded-2xl">
            <div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Pratinjau File: <strong>{previewData.fileName}</strong></span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Terdeteksi <strong>{previewData.validRowsCount}</strong> Satuan Kerja aktif bertransaksi KKP.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyImport}
                className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan &amp; Terapkan ke Dashboard</span>
              </button>
            </div>
          </div>

          {/* Quick Table Preview */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-extrabold">
                <tr>
                  <th className="py-2.5 px-3">Kode Satker</th>
                  <th className="py-2.5 px-3">Nama Satker</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Transaksi</th>
                  <th className="py-2.5 px-3 text-right">Total Nominal (Rp)</th>
                  <th className="py-2.5 px-3">Bank Penerbit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
                {previewData.validData.slice(0, 10).map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{r.kodeSatker}</td>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">{r.namaSatker}</td>
                    <td className="py-2 px-3 text-center font-mono font-bold">{r.jumlahTransaksi} SP2D</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Rp {r.totalNominal.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{r.bankPenerbit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
