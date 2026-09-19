import React, { useState } from 'react';
import { PerubahanUserHistoryItem } from '../../types';
import { MASTER_ROLE_MAP } from '../../data/masterRoleSakti';
import { formatIndonesianDate } from '../../utils/pendaftaranSaktiExport';
import { exportPerubahanUserToExcel, exportPerubahanUserToPDF } from '../../utils/perubahanUserSaktiExport';
import {
  History,
  X,
  FileSpreadsheet,
  FileText,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface RiwayatPerubahanUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: PerubahanUserHistoryItem[];
  onDeleteHistory: (id: string) => void;
  onPreviewItem: (item: PerubahanUserHistoryItem) => void;
  onLoadIntoDraft: (item: PerubahanUserHistoryItem) => void;
  satker: {
    kodeSatker: string;
    namaSatker: string;
    levelSatker?: string;
    namaKpa?: string;
    nipKpa?: string;
  };
}

export const RiwayatPerubahanUserModal: React.FC<RiwayatPerubahanUserModalProps> = ({
  isOpen,
  onClose,
  historyList,
  onDeleteHistory,
  onPreviewItem,
  onLoadIntoDraft,
  satker
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'DIAJUKAN' | 'DRAFT'>('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredHistory = historyList.filter(item => {
    if (activeTab === 'ALL') return true;
    return item.status === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DIAJUKAN':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Diajukan</span>
          </span>
        );
      case 'SELESAI':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Selesai</span>
          </span>
        );
      case 'DITOLAK':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Ditolak</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Riwayat Pengajuan Perubahan User SAKTI</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                  {historyList.length} Arsip
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {satker.kodeSatker} - {satker.namaSatker}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Semua ({historyList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DIAJUKAN')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'DIAJUKAN'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Diajukan ({historyList.filter(h => h.status === 'DIAJUKAN').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DRAFT')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'DRAFT'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Draft ({historyList.filter(h => h.status === 'DRAFT').length})
          </button>
        </div>

        {/* List Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <History className="w-12 h-12 mx-auto stroke-1 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-medium">Belum ada riwayat pengajuan perubahan data user.</p>
              <p className="text-xs text-slate-500">
                Data perubahan yang Anda simpan atau ajukan akan tersimpan otomatis di sini.
              </p>
            </div>
          ) : (
            filteredHistory.map(item => {
              const diff = item.diffSummary;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {item.menjadi.nama}
                        </span>
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          (NIP: {item.menjadi.nip || item.semula.nip})
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Diajukan pada: {formatIndonesianDate(item.tanggalPengajuan)} {item.createdAt ? `• ${new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => onLoadIntoDraft(item)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 transition-colors"
                        title="Muat ke form perubahan aktif"
                      >
                        Buka Form
                      </button>

                      <button
                        type="button"
                        onClick={() => onPreviewItem(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Pratinjau Dokumen"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await exportPerubahanUserToExcel(item, satker.namaSatker, satker.levelSatker);
                          } catch (err: any) {
                            alert(err?.message || 'Gagal export Excel: Struktur template tidak valid');
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                        title="Download Excel"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => exportPerubahanUserToPDF(item, satker)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        title="Download PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {confirmDeleteId === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteHistory(item.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Klik untuk konfirmasi hapus"
                          >
                            <span>Hapus?</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Batal"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Hapus Arsip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Diff highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40">
                      <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                        SEMULA:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.semula.roles.length === 0 ? (
                          <span className="text-slate-400 italic">Tidak ada role</span>
                        ) : (
                          item.semula.roles.map(r => (
                            <span key={r} className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-mono">
                              {MASTER_ROLE_MAP.get(r)?.roleName || r}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                        MENJADI:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.menjadi.roles.length === 0 ? (
                          <span className="text-slate-400 italic">Tidak ada role</span>
                        ) : (
                          item.menjadi.roles.map(r => (
                            <span key={r} className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-mono">
                              {MASTER_ROLE_MAP.get(r)?.roleName || r}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary Notes */}
                  {item.keterangan && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Alasan:</span> {item.keterangan}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Riwayat tersimpan per Satker di memori lokal peramban.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
