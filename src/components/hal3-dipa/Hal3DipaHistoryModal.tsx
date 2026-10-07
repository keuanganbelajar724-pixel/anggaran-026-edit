import React from 'react';
import { 
  X, 
  Package, 
  Calendar, 
  Clock, 
  FileSpreadsheet, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { UploadHal3Batch } from '../../types/hal3Dipa';

interface Hal3DipaHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: UploadHal3Batch[];
}

export const Hal3DipaHistoryModal: React.FC<Hal3DipaHistoryModalProps> = ({
  isOpen,
  onClose,
  batches
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-black shadow-inner">
              📦
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                AUDIT LOG & VERSIONING
              </span>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Riwayat Unggahan Monitoring Kanwil
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {batches.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Belum ada riwayat unggahan monitoring.</p>
              <p className="text-[11px] text-slate-400 mt-1">Silakan lakukan upload berkas Excel dari Kanwil untuk memulai.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map((b, idx) => (
                <div 
                  key={b.id || idx}
                  className="p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-xs hover:border-teal-300 dark:hover:border-teal-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 flex items-center justify-center font-bold shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                            {b.nama_file}
                          </h4>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {b.status_import}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          ID: <span className="font-mono">{b.id}</span> &bull; {b.periode} TA {b.tahun_anggaran}
                        </p>
                      </div>
                    </div>

                    <div className="text-right sm:text-right">
                      <div className="text-sm font-black text-teal-600 dark:text-teal-400">
                        {b.jumlah_data} Satker
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(b.uploaded_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Baru Ditambahkan</span>
                      <strong className="text-emerald-600">{b.jumlah_baru} satker</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Data Diperbarui</span>
                      <strong className="text-teal-600">{b.jumlah_update} satker</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Error / Dilewati</span>
                      <strong className="text-rose-600">{b.jumlah_error} baris</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Pengunggah</span>
                      <strong className="text-slate-700 dark:text-slate-300 truncate block">{b.uploaded_by}</strong>
                    </div>
                  </div>

                  {b.catatan && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                      &quot;{b.catatan}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
