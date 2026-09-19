import React from 'react';
import { X, FileSpreadsheet, Download, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { PendaftaranEmailDraft, EMPLOYEE_STATUS_LIST } from '../../types';
import { exportPendaftaranEmailToExcel, getStatusNameByCode, OFFICIAL_EMAIL_EXCEL_HEADERS } from '../../utils/pendaftaranEmailExport';

interface PreviewEmailExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: PendaftaranEmailDraft;
}

export const PreviewEmailExcelModal: React.FC<PreviewEmailExcelModalProps> = ({
  isOpen,
  onClose,
  draft
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>👁 Pratinjau Output File Excel (Sheet1)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Format Resmi
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pendaftaran-Email-{draft.kodeSatker}-[YYYYMMDD].xlsx • {draft.pegawaiList.length} Baris Data Pegawai
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice Info Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-3 shrink-0">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Struktur Sheet Standar Tanpa Header Tambahan</span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Baris 1 berisi tepat nama kolom resmi. NIP/NRP &amp; NIK dikunci sebagai format TEKS (anti-scientific notation). Status disimpan sebagai integer (1..5).
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-mono uppercase bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md font-bold">
              6 Kolom Tetap
            </span>
          </div>
        </div>

        {/* Sheet Table Preview */}
        <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 sticky top-0 z-10 font-bold">
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-center w-12">
                  Row
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">
                  A: Kode KPPN
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">
                  B: Kode Satker
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">
                  C: Nama Pegawai
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">
                  D: NIP / NRP
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">
                  E: NIK
                </th>
                <th className="py-2.5 px-3">
                  F: Status (1-5)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Row 1 Header Row in Excel */}
              <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold text-slate-600 dark:text-slate-400">
                <td className="py-2 px-3 text-center text-[10px] text-slate-400 border-r border-slate-200 dark:border-slate-800">
                  1
                </td>
                <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                  Kode KPPN
                </td>
                <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                  Kode Satker
                </td>
                <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                  Nama Pegawai
                </td>
                <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                  NIP / NRP
                </td>
                <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                  NIK
                </td>
                <td className="py-2 px-3">
                  Status (1=TNI; 2=POLRI; 3=PNS; 4=PPNPN; 5=P3K)
                </td>
              </tr>

              {/* Data rows */}
              {draft.pegawaiList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-sans">
                    Belum ada data pegawai dalam draft ini.
                  </td>
                </tr>
              ) : (
                draft.pegawaiList.map((p, idx) => (
                  <tr 
                    key={p.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-slate-900 dark:text-slate-100"
                  >
                    <td className="py-2 px-3 text-center text-[10px] text-slate-400 border-r border-slate-200 dark:border-slate-800">
                      {idx + 2}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 font-bold text-teal-600 dark:text-teal-400">
                      {draft.kodeKppn || '136'}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 font-bold text-teal-600 dark:text-teal-400">
                      {draft.kodeSatker}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 font-sans font-bold">
                      {p.namaPegawai}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      {p.nipNrp}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      {p.nik}
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 border text-slate-800 dark:text-slate-200">
                        {getStatusNameByCode(p.status)} ({p.status})
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          >
            Tutup Pratinjau
          </button>

          <button
            type="button"
            disabled={draft.pegawaiList.length === 0}
            onClick={() => {
              exportPendaftaranEmailToExcel(draft);
              onClose();
            }}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Unduh File Excel Resmi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
