import React, { useState } from 'react';
import { PemutakhiranKewenanganHistoryItem, PemutakhiranAuditLog } from '../../types';
import {
  X,
  History,
  FileSpreadsheet,
  FileText,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle
} from 'lucide-react';
import { formatIndonesianDate } from '../../utils/pendaftaranSaktiExport';

interface RiwayatPemutakhiranModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: PemutakhiranKewenanganHistoryItem[];
  auditLogs: PemutakhiranAuditLog[];
  onLoadDraft: (item: PemutakhiranKewenanganHistoryItem) => void;
  onDeleteHistory: (id: string) => void;
  onExportExcelItem: (item: PemutakhiranKewenanganHistoryItem) => void;
  onExportPdfItem: (item: PemutakhiranKewenanganHistoryItem) => void;
}

export const RiwayatPemutakhiranModal: React.FC<RiwayatPemutakhiranModalProps> = ({
  isOpen,
  onClose,
  historyList,
  auditLogs,
  onLoadDraft,
  onDeleteHistory,
  onExportExcelItem,
  onExportPdfItem
}) => {
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'AUDIT'>('HISTORY');

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SELESAI':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            SELESAI
          </span>
        );
      case 'DIAJUKAN':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            DIAJUKAN
          </span>
        );
      case 'DITOLAK':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            DITOLAK
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            DRAFT
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Riwayat & Log Audit Pemutakhiran Kewenangan
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Penyimpanan riwayat formulir dan jejak audit aktivitas pengguna Satker
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Daftar Riwayat Pengajuan ({historyList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'AUDIT'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Log Audit Aktivitas ({auditLogs.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'HISTORY' ? (
            historyList.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Belum ada riwayat pengajuan pemutakhiran kewenangan</p>
                <p className="text-xs mt-1 text-slate-600">
                  Formulir yang disimpan sebagai draft atau diexport akan tersimpan di sini secara otomatis.
                </p>
              </div>
            ) : (
              historyList.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-850/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">
                        Pemutakhiran Kewenangan ({item.totalUser} Pengguna)
                      </span>
                      {getStatusBadge(item.status)}
                      <span className="text-xs text-slate-400 font-mono">Satker: {item.kodeSatker}</span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-4 flex-wrap">
                      <span>KPA: <strong className="text-slate-300">{item.kpa?.nama || '-'}</strong></span>
                      <span>Tanggal: {formatIndonesianDate(item.tanggalPengajuan)}</span>
                      {item.exportedExcelAt && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Excel Exported
                        </span>
                      )}
                      {item.exportedPdfAt && (
                        <span className="text-rose-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PDF Exported
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadDraft(item);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Buka kembali formulir ini"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Form</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onExportExcelItem(item)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Export Excel Master Template"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onExportPdfItem(item)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Export PDF Resmi"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteHistory(item.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Hapus riwayat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            /* Audit Log View */
            auditLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Belum ada aktivitas audit log</p>
              </div>
            ) : (
              <div className="space-y-2">
                {auditLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-slate-850/60 border border-slate-800 flex items-start gap-3 text-xs"
                  >
                    <div className="mt-0.5 p-1 rounded bg-indigo-500/10 text-indigo-400">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white">{log.action}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-0.5">{log.detail}</p>
                      {log.user && (
                        <span className="text-[10px] text-indigo-300/80 font-mono mt-0.5 inline-block">
                          Oleh: {log.user}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
