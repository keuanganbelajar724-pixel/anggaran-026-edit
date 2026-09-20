import React from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  UploadCloud,
  Eye,
  Download,
  Trash2,
  ToggleLeft,
  AlertCircle
} from 'lucide-react';
import { RekonsiliasiAuditLog } from '../../types';

interface RekonsiliasiAuditLogModalProps {
  logs: RekonsiliasiAuditLog[];
  isDark: boolean;
  onClose: () => void;
}

export const RekonsiliasiAuditLogModal: React.FC<RekonsiliasiAuditLogModalProps> = ({
  logs,
  isDark,
  onClose
}) => {
  const bgModal = isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900';
  const cardBg = isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  const getAksiIcon = (aksi: RekonsiliasiAuditLog['aksi']) => {
    switch (aksi) {
      case 'UPLOAD':
      case 'IMPORT_SUCCESS':
        return <UploadCloud className="w-4 h-4 text-blue-500" />;
      case 'VIEW_DETAIL':
        return <Eye className="w-4 h-4 text-emerald-500" />;
      case 'EXPORT':
        return <Download className="w-4 h-4 text-indigo-500" />;
      case 'DELETE_BATCH':
        return <Trash2 className="w-4 h-4 text-rose-500" />;
      case 'TOGGLE_TAB':
        return <ToggleLeft className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-3xl rounded-2xl shadow-2xl border ${bgModal} ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        } overflow-hidden max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">Log Audit Aktivitas Rekonsiliasi</h3>
              <p className={`text-xs ${textMuted} mt-0.5`}>
                Catatan riwayat aksi sistem, upload, validasi, dan export data kepatuhan
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
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className={`w-12 h-12 mx-auto mb-3 ${textMuted}`} />
              <p className="font-semibold text-sm">Belum Ada Aktivitas Tercatat</p>
              <p className={`text-xs ${textMuted} mt-1`}>
                Setiap aksi upload, ekspor, atau perubahan data akan tercatat secara otomatis di sini.
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`p-3.5 rounded-xl border flex items-start gap-3.5 ${cardBg}`}
              >
                <div className="mt-0.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-700/60">
                  {getAksiIcon(log.aksi)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{log.aksi}</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : log.status === 'ERROR'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <span className={`text-[11px] ${textMuted}`}>
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed">{log.detail}</p>
                  <div className={`text-[11px] ${textMuted} mt-1 flex items-center gap-3`}>
                    <span>Oleh: <strong>{log.user}</strong> ({log.role})</span>
                    {log.periode && <span>Periode: {log.periode}</span>}
                    {log.affectedCount !== undefined && <span>Data: {log.affectedCount} Satker</span>}
                  </div>
                </div>
              </div>
            ))
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
