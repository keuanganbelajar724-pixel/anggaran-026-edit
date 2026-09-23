import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  FileCheck,
  FileSpreadsheet,
  FileText,
  GitCompare,
  Layers,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { KontrakMonitoringRecord, KontrakUploadBatch } from '../../types';
import { compareUploadBatches, formatNumber, formatRupiah } from '../../utils/kontrakCalculations';

interface KontrakBatchHistoryProps {
  batches: KontrakUploadBatch[];
  records: KontrakMonitoringRecord[];
  onDeleteBatch: (batchId: string) => Promise<void> | void;
  isDark?: boolean;
}

export const KontrakBatchHistory: React.FC<KontrakBatchHistoryProps> = ({
  batches,
  records,
  onDeleteBatch,
  isDark = false
}) => {
  const [selectedBatchA, setSelectedBatchA] = useState<string>(batches[0]?.id || '');
  const [selectedBatchB, setSelectedBatchB] = useState<string>(batches[1]?.id || batches[0]?.id || '');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter records per batch
  const recordsBatchA = useMemo(() => {
    return records.filter(r => r.upload_batch_id === selectedBatchA);
  }, [records, selectedBatchA]);

  const recordsBatchB = useMemo(() => {
    return records.filter(r => r.upload_batch_id === selectedBatchB);
  }, [records, selectedBatchB]);

  // Compute comparison
  const comparisonResult = useMemo(() => {
    if (!selectedBatchA || !selectedBatchB || selectedBatchA === selectedBatchB) return null;
    return compareUploadBatches(recordsBatchA, recordsBatchB, selectedBatchA, selectedBatchB);
  }, [recordsBatchA, recordsBatchB, selectedBatchA, selectedBatchB]);

  const handleDelete = async (batchId: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data batch ${batchId}? Seluruh kontrak dalam batch ini akan dihapus.`)) {
      setDeletingId(batchId);
      try {
        await onDeleteBatch(batchId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. DAFTAR RIWAYAT BATCH */}
      <div
        className={`p-5 rounded-3xl border shadow-sm ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Daftar Riwayat Batch Upload Kontrak ({batches.length} Batch)</span>
            </h4>
            <p className="text-xs text-slate-500">
              Riwayat berkas Excel hasil unduhan monitoring yang telah diimpor ke database KPPN.
            </p>
          </div>
        </div>

        {batches.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-bold">Belum ada riwayat batch upload.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`border-b font-extrabold ${
                    isDark ? 'bg-slate-800/80 text-slate-200' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <th className="py-2.5 px-3">Batch ID</th>
                  <th className="py-2.5 px-3">Nama Berkas</th>
                  <th className="py-2.5 px-3">Waktu Unduh Sumber</th>
                  <th className="py-2.5 px-3">Periode Kontrak</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Kontrak</th>
                  <th className="py-2.5 px-3">Pengunggah</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batches.map((b, idx) => (
                  <tr key={b.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {b.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{b.file_name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {b.download_time_source}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {b.period_start} s.d. {b.period_end}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold font-mono">
                      {formatNumber(b.total_records)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{b.uploaded_by}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDelete(b.id)}
                        disabled={deletingId === b.id}
                        title="Hapus Batch Data Ini"
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. FITUR PERBANDINGAN BATCH (BATCH A VS BATCH B) */}
      <div
        className={`p-5 rounded-3xl border shadow-sm ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <GitCompare className="w-5 h-5 text-indigo-600" />
          <div>
            <h4 className="font-extrabold text-sm sm:text-base">
              Perbandingan Batch (Batch A vs Batch B)
            </h4>
            <p className="text-xs text-slate-500">
              Analisis perubahan data antara dua batch upload: kontrak baru, kontrak hilang, perubahan nominal,
              dan perubahan status progress / NRK.
            </p>
          </div>
        </div>

        {batches.length < 2 ? (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
            Dibutuhkan minimal 2 batch upload untuk melakukan analisis perbandingan. Silakan unggah berkas
            kedua terlebih dahulu.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Pilih Batch A (Basis / Sebelumnya):
                </label>
                <select
                  value={selectedBatchA}
                  onChange={e => setSelectedBatchA(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-transparent text-xs font-medium"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.file_name} ({b.download_time_source})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Pilih Batch B (Pembanding / Terbaru):
                </label>
                <select
                  value={selectedBatchB}
                  onChange={e => setSelectedBatchB(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-transparent text-xs font-medium"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.file_name} ({b.download_time_source})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Metrics */}
            {comparisonResult && (
              <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                    <span className="text-[11px] text-emerald-700 block font-bold">Kontrak Baru (di B):</span>
                    <strong className="text-xl font-mono text-emerald-800 dark:text-emerald-300">
                      +{comparisonResult.kontrakBaruCount}
                    </strong>
                  </div>

                  <div className="p-3 rounded-2xl border bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800">
                    <span className="text-[11px] text-rose-700 block font-bold">Kontrak Hilang:</span>
                    <strong className="text-xl font-mono text-rose-800 dark:text-rose-300">
                      -{comparisonResult.kontrakHilangCount}
                    </strong>
                  </div>

                  <div className="p-3 rounded-2xl border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <span className="text-[11px] text-blue-700 block font-bold">Perubahan Progress:</span>
                    <strong className="text-xl font-mono text-blue-800 dark:text-blue-300">
                      {comparisonResult.perubahanStatusProgressCount}
                    </strong>
                  </div>

                  <div className="p-3 rounded-2xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    <span className="text-[11px] text-amber-700 block font-bold">Perubahan Pembayaran:</span>
                    <strong className="text-sm font-mono block truncate text-amber-800 dark:text-amber-300 mt-1">
                      {formatRupiah(comparisonResult.perubahanPembayaran)}
                    </strong>
                  </div>
                </div>

                {/* Status changes table if any */}
                {comparisonResult.statusChangesList.length > 0 && (
                  <div>
                    <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2">
                      Rincian Kontrak yang Mengalami Perubahan Status / Nominal:
                    </h5>
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 font-extrabold text-[11px]">
                            <th className="py-2 px-3">Satker</th>
                            <th className="py-2 px-3">Nomor Kontrak</th>
                            <th className="py-2 px-3">Progress Batch A</th>
                            <th className="py-2 px-3">Progress Batch B</th>
                            <th className="py-2 px-3">Status NRK</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                          {comparisonResult.statusChangesList.slice(0, 30).map((ch, idx) => (
                            <tr key={idx}>
                              <td className="py-1.5 px-3 font-mono font-bold">{ch.kodeSatker}</td>
                              <td className="py-1.5 px-3 font-mono">{ch.nomorKontrak}</td>
                              <td className="py-1.5 px-3 text-slate-500">{ch.oldStatusProgress}</td>
                              <td className="py-1.5 px-3 font-bold text-emerald-600">
                                {ch.newStatusProgress}
                              </td>
                              <td className="py-1.5 px-3 text-blue-600">{ch.newStatusNrk}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
