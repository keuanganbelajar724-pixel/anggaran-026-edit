import React from 'react';
import { CatatanDiskusiSatker, AppTheme } from '../../types';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface CatatanDiskusiDeleteModalProps {
  note: CatatanDiskusiSatker | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  theme?: AppTheme;
}

export const CatatanDiskusiDeleteModal: React.FC<CatatanDiskusiDeleteModalProps> = ({
  note,
  isOpen,
  onClose,
  onConfirm,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div 
        className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-black text-rose-600 dark:text-rose-400">
            Hapus Catatan Diskusi Pembinaan?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Catatan sesi tanggal <strong>{note.tanggal}</strong> dengan topik:
          </p>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
            "{note.topikDiskusi}"
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            Tindakan ini akan menghapus catatan dari riwayat lokal dan sinkronisasi Cloud KPPN.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 text-xs font-black bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Ya, Hapus Catatan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
