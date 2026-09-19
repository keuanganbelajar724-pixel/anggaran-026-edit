import React from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  FileSpreadsheet, 
  FileText 
} from 'lucide-react';
import { PendaftaranValidationResult, ValidationIssue, UserSaktiRecord } from '../../types';

interface ValidationSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationResult: PendaftaranValidationResult;
  users: UserSaktiRecord[];
  onSelectUserToEdit: (user: UserSaktiRecord) => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

export const ValidationSummaryModal: React.FC<ValidationSummaryModalProps> = ({
  isOpen,
  onClose,
  validationResult,
  users,
  onSelectUserToEdit,
  onExportExcel,
  onExportPDF
}) => {
  if (!isOpen) return null;

  const errorIssues = validationResult.issues.filter(i => i.severity === 'ERROR');
  const warningIssues = validationResult.issues.filter(i => i.severity === 'WARNING');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between text-white ${
          validationResult.isValid
            ? 'bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 border-emerald-800/60'
            : 'bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border-rose-800/60'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              validationResult.isValid
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
            }`}>
              {validationResult.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {validationResult.isValid ? 'Audit Validasi: Siap Ekspor' : 'Audit Validasi: Perlu Perbaikan'}
              </h3>
              <p className="text-xs text-slate-300">
                {validationResult.isValid 
                  ? 'Seluruh data pengguna dan atribut satker telah memenuhi standar resmi SAKTI' 
                  : `Ditemukan ${errorIssues.length} kendala yang harus diperbaiki sebelum ekspor Excel / PDF`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Summary Stats Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <p className="text-[11px] text-slate-500 font-medium">Total Pengguna</p>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {validationResult.totalUsers} Pegawai
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <p className="text-[11px] text-slate-500 font-medium">Total Role Terdaftar</p>
              <p className="text-lg font-black text-teal-600 dark:text-teal-400 mt-0.5">
                {validationResult.totalRoles} Role
              </p>
            </div>

            <div className={`p-3 rounded-xl border ${
              validationResult.isValid
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}>
              <p className="text-[11px] font-medium">Status Validasi</p>
              <p className="text-lg font-black mt-0.5">
                {validationResult.isValid ? '100% VALID' : `${errorIssues.length} ERROR`}
              </p>
            </div>
          </div>

          {/* Validated Checklist Status */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              Checklist Standar Kepatuhan SAKTI
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Format Kode Satker 6 Digit</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Level Satker Resmi Terpilih</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Role Terkunci Pada Master Referensi</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Urutan Role Mengikuti Master SAKTI</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Format NIP &amp; Kontak Bebas Scientific Notation</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Pemisah Peran Koma-Spasi Siap Template</span>
              </div>
            </div>
          </div>

          {/* List of Errors */}
          {errorIssues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Daftar Kendala Yang Perlu Diperbaiki ({errorIssues.length})
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {errorIssues.map((issue, idx) => {
                  const targetUser = users.find(u => u.id === issue.userId);
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          {issue.userName && (
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {issue.userName}
                            </p>
                          )}
                          <p className="text-rose-700 dark:text-rose-300 mt-0.5">
                            {issue.message}
                          </p>
                        </div>
                      </div>

                      {targetUser && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectUserToEdit(targetUser);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/40 transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs text-[11px]"
                        >
                          <span>Perbaiki</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List of Warnings */}
          {warningIssues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Catatan Disarankan ({warningIssues.length})
              </h4>
              <div className="space-y-1.5">
                {warningIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2"
                  >
                    <span className="font-bold shrink-0">•</span>
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            Tutup Jendela
          </button>

          {validationResult.isValid ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  onExportExcel();
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Unduh Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onExportPDF();
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Unduh PDF (.pdf)</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Tombol ekspor terkunci sampai semua kendala di atas diperbaiki</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
