import React from 'react';
import {
  X,
  History,
  FileSpreadsheet,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { MonitoringRekonsiliasiUploadBatch } from '../../types';
import { formatPeriodeRekonsiliasi } from '../../utils/rekonsiliasiExcelParser';

interface RiwayatUploadRekonsiliasiModalProps {
  uploads: MonitoringRekonsiliasiUploadBatch[];
  currentPeriode: string;
  isAdminAuthenticated: boolean;
  isDark: boolean;
  onSelectPeriode: (periode: string) => void;
  onDeleteBatch: (batchId: string) => void;
  onClose: () => void;
}

export const RiwayatUploadRekonsiliasiModal: React.FC<RiwayatUploadRekonsiliasiModalProps> = ({
  uploads,
  currentPeriode,
  isAdminAuthenticated,
  isDark,
  onSelectPeriode,
  onDeleteBatch,
  onClose
}) => {
  const bgModal = isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900';
  const cardBg = isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-4xl rounded-2xl shadow-2xl border ${bgModal} ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        } overflow-hidden max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">Riwayat Batch Upload Monitoring</h3>
              <p className={`text-xs ${textMuted} mt-0.5`}>
                Daftar file Excel kepatuhan Satker yang telah diimpor ke sistem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {uploads.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className={`w-12 h-12 mx-auto mb-3 ${textMuted}`} />
              <p className="font-semibold text-sm">Belum Ada Riwayat Upload</p>
              <p className={`text-xs ${textMuted} mt-1`}>
                File Excel yang Anda unggah akan otomatis tersimpan dalam daftar batch di sini.
              </p>
            </div>
          ) : (
            uploads.map((batch) => {
              const isCurrent = batch.periode === currentPeriode;
              return (
                <div
                  key={batch.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isCurrent
                      ? isDark
                        ? 'border-blue-600 bg-blue-950/20'
                        : 'border-blue-400 bg-blue-50/40'
                      : cardBg
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4" />
                          {batch.filename}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white">
                            Periode Aktif
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          batch.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {batch.status === 'SUCCESS' ? 'Sukses' : 'Peringatan'}
                        </span>
                      </div>

                      <div className={`text-xs ${textMuted} flex flex-wrap items-center gap-x-4 gap-y-1 mt-1`}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Periode: <strong>{formatPeriodeRekonsiliasi(batch.periode)}</strong> ({batch.periode})
                        </span>
                        <span>•</span>
                        <span>Jumlah: <strong>{batch.jumlahData} Satker</strong></span>
                        <span>•</span>
                        <span>Diupload: {new Date(batch.uploadedAt).toLocaleString('id-ID')}</span>
                        <span>•</span>
                        <span>Oleh: {batch.uploadedBy}</span>
                      </div>

                      {batch.downloadWaktuInfo && (
                        <p className={`text-[11px] ${textMuted} italic mt-1`}>
                          Info sumber: {batch.downloadWaktuInfo}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {!isCurrent && (
                        <button
                          onClick={() => {
                            onSelectPeriode(batch.periode);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                          Lihat Periode Ini
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isAdminAuthenticated && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Yakin ingin menghapus batch "${batch.filename}" (${batch.periode})? Data satker pada periode ini akan dihapus.`)) {
                              onDeleteBatch(batch.id);
                            }
                          }}
                          className={`p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ${
                            uploads.length <= 1 ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                          title="Hapus batch ini"
                          disabled={uploads.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary bar if available */}
                  {batch.summary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60">
                        <span className={textMuted}>Rekon Selesai:</span>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                          {batch.summary.rekonsiliasiSelesai}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60">
                        <span className={textMuted}>Rekon Belum:</span>
                        <p className="font-bold text-rose-600 dark:text-rose-400">
                          {batch.summary.rekonsiliasiBelumSelesai}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60">
                        <span className={textMuted}>Todolist Selesai:</span>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                          {batch.summary.todolistSelesai}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60">
                        <span className={textMuted}>Masih Todolist:</span>
                        <p className="font-bold text-rose-600 dark:text-rose-400">
                          {batch.summary.todolistBelumSelesai}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60">
                        <span className={textMuted}>Belum Tutup:</span>
                        <p className="font-bold text-amber-600 dark:text-amber-400">
                          {batch.summary.belumTutupPeriode}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60">
                        <span className={textMuted}>Perlu Tindakan:</span>
                        <p className="font-bold text-rose-600 dark:text-rose-400">
                          {batch.summary.perluTindakan}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} flex justify-end`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
