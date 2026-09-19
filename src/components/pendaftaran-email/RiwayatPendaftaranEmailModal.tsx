import React, { useState } from 'react';
import { PendaftaranEmailHistoryItem } from '../../types';
import { formatIndonesianDate } from '../../utils/pendaftaranSaktiExport';
import { exportPendaftaranEmailToExcel, exportPendaftaranEmailToPDF } from '../../utils/pendaftaranEmailExport';
import { History, X, FileSpreadsheet, FileText, Trash2, Mail, Check } from 'lucide-react';

interface RiwayatPendaftaranEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: PendaftaranEmailHistoryItem[];
  onDeleteHistory: (id: string) => void;
  onLoadDraft: (draft: PendaftaranEmailHistoryItem) => void;
}

export const RiwayatPendaftaranEmailModal: React.FC<RiwayatPendaftaranEmailModalProps> = ({
  isOpen,
  onClose,
  historyList,
  onDeleteHistory,
  onLoadDraft
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Riwayat Pengajuan Pendaftaran Email
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Arsip daftar permohonan akun email kedinasan Kemenkeu per Satker
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {historyList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Mail className="w-12 h-12 mx-auto stroke-1 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-medium">Belum ada riwayat pendaftaran email tersimpan.</p>
              <p className="text-xs text-slate-500">
                Data akan otomatis terekam saat Anda mengekspor atau menyimpan draf pendaftaran email.
              </p>
            </div>
          ) : (
            historyList.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Permohonan Email ({item.totalPegawai} Pegawai)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                      {item.kodeSatker}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                    <span>Tanggal: {formatIndonesianDate(item.tanggal)}</span>
                    <span>• Penandatangan: {item.pejabat.nama}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onLoadDraft(item)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 transition-colors"
                  >
                    Buka Draf
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await exportPendaftaranEmailToExcel(
                          item.draftData.kodeKppn,
                          item.kodeSatker,
                          item.namaSatker,
                          item.draftData.pegawaiList
                        );
                      } catch (err: any) {
                        alert(err?.message || 'Gagal export Excel: Format template tidak valid');
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                    title="Export Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => exportPendaftaranEmailToPDF(
                      item.draftData.kodeKppn,
                      item.kodeSatker,
                      item.namaSatker,
                      item.draftData.pegawaiList,
                      item.pejabat
                    )}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                    title="Export PDF"
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
                        <Check className="w-3 h-3" />
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
                      title="Hapus arsip ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
