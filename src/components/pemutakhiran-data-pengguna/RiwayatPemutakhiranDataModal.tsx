import React, { useState } from 'react';
import { PemutakhiranDataHistoryItem, PemutakhiranDataAuditLog } from '../../types';
import {
  X,
  History,
  FileSpreadsheet,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Search,
  Filter,
  Eye,
  Calendar,
  UserCheck
} from 'lucide-react';
import { formatIndonesianDate } from '../../utils/pendaftaranSaktiExport';

interface RiwayatPemutakhiranDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: PemutakhiranDataHistoryItem[];
  auditLogs: PemutakhiranDataAuditLog[];
  onExportExcel: (historyItem: PemutakhiranDataHistoryItem) => void;
  onExportPDF: (historyItem: PemutakhiranDataHistoryItem) => void;
  onLoadDraft: (historyItem: PemutakhiranDataHistoryItem) => void;
}

export const RiwayatPemutakhiranDataModal: React.FC<RiwayatPemutakhiranDataModalProps> = ({
  isOpen,
  onClose,
  historyList,
  auditLogs,
  onExportExcel,
  onExportPDF,
  onLoadDraft
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'audit'>('history');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredHistory = historyList.filter(item => {
    const q = searchTerm.toLowerCase();
    const matchSatker = item.kodeSatker.includes(q) || item.namaSatker.toLowerCase().includes(q);
    const matchKpa = (item.kpa?.nama || '').toLowerCase().includes(q);
    const matchUser = (item.draftData?.users || []).some(u => (u.nama || '').toLowerCase().includes(q));
    return matchSatker || matchKpa || matchUser;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Riwayat & Log Audit Pemutakhiran Data Pengguna SAKTI</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftar pengajuan formulir, arsip dokumen, dan riwayat aktivitas perubahan data pengguna
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-5 pt-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Riwayat Dokumen Pengajuan ({historyList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Log Aktivitas & Audit ({auditLogs.length})
          </button>
        </div>

        {/* Tab 1: History List */}
        {activeTab === 'history' && (
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan nama pengguna, KPA, atau kode satker..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500"
              />
            </div>

            {filteredHistory.length === 0 ? (
              <div className="py-14 text-center text-slate-500">
                <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Belum ada riwayat pengajuan pemutakhiran data</p>
                <p className="text-xs text-slate-600 mt-1">
                  Ajukan formulir atau simpan draf untuk mencatat riwayat pemutakhiran data pengguna SAKTI.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map(item => {
                  const statusColors = {
                    DRAFT: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
                    DIAJUKAN: 'bg-teal-950/40 text-teal-400 border-teal-800/60',
                    SELESAI: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
                    DITOLAK: 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                  };

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-850/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              statusColors[item.status] || 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="text-xs font-mono font-semibold text-slate-300">
                            Satker: {item.kodeSatker} - {item.namaSatker}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                            {item.totalUser} Pengguna Dimutakhirkan
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {formatIndonesianDate(item.tanggalPengajuan || item.createdAt)}
                          </span>
                          <span>•</span>
                          <span>KPA: {item.kpa?.nama || '-'}</span>
                        </div>

                        <div className="text-[11px] text-slate-500 truncate pt-1">
                          Daftar Nama: {item.draftData?.users.map(u => u.nama).join(', ') || '-'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => onLoadDraft(item)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-teal-400 bg-teal-950/40 border border-teal-800/60 hover:bg-teal-900/40 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Muat ke Form
                        </button>
                        <button
                          type="button"
                          onClick={() => onExportExcel(item)}
                          title="Unduh Excel Master"
                          className="p-1.5 rounded-lg text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/40 transition-colors cursor-pointer"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onExportPDF(item)}
                          title="Unduh PDF Formulir"
                          className="p-1.5 rounded-lg text-rose-400 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/40 transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="p-5 overflow-y-auto space-y-3 flex-1">
            {auditLogs.length === 0 ? (
              <div className="py-14 text-center text-slate-500">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Belum ada log audit aktivitas</p>
                <p className="text-xs text-slate-600 mt-1">
                  Aktivitas pemilihan user, perubahan data, export Excel, dan export PDF akan tercatat di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {auditLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3 text-slate-300"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-teal-400">
                          {log.action}
                        </span>
                        <span className="text-xs text-slate-400 font-sans">
                          oleh <span className="text-white font-medium">{log.user || 'Operator Satker'}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-sans">{log.detail}</p>
                    </div>
                    <span className="text-[11px] text-slate-500 whitespace-nowrap font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Terisolasi berdasarkan Kode Satker profil yang aktif.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
