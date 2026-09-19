import React from 'react';
import { PemutakhiranKewenanganDraft } from '../../types';
import { X, FileSpreadsheet, FileText, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';
import { formatRolesForExcel, sortRolesByMasterOrder } from '../../data/masterRoleSakti';
import { formatIndonesianDate } from '../../utils/pendaftaranSaktiExport';

interface PreviewPemutakhiranModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: PemutakhiranKewenanganDraft;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

export const PreviewPemutakhiranModal: React.FC<PreviewPemutakhiranModalProps> = ({
  isOpen,
  onClose,
  draft,
  onExportExcel,
  onExportPDF
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Pratinjau Formulir Pemutakhiran Kewenangan Pengguna SAKTI
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Struktur pratinjau sesuai Master Template resmi Kemenkeu ("Contoh Form Pemutakhiran Kewenangan (29).xlsx")
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportExcel}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              type="button"
              onClick={onExportPDF}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Realistic Sheet Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/80 flex justify-center">
          <div className="bg-white text-slate-900 w-full max-w-4xl p-8 rounded-lg shadow-xl font-sans border border-slate-300 text-xs">
            {/* Title */}
            <div className="text-center font-bold text-base mb-6 border-b-2 border-slate-900 pb-2">
              Formulir Pemutakhiran Kewenangan Pengguna SAKTI
            </div>

            {/* Metadata Satker (Rows 3, 4, 6) */}
            <div className="mb-6 space-y-1.5 bg-slate-50 p-4 rounded-md border border-slate-200">
              <div className="grid grid-cols-6 gap-2">
                <div className="col-span-2 font-bold text-slate-700">Kode Satker (A3)</div>
                <div className="col-span-4 font-mono font-semibold text-slate-900">: {draft.kodeSatker || '-'}</div>
              </div>
              <div className="grid grid-cols-6 gap-2">
                <div className="col-span-2 font-bold text-slate-700">Nama Satker (A4)</div>
                <div className="col-span-4 font-semibold text-slate-900">: {draft.namaSatker || '-'}</div>
              </div>
              <div className="grid grid-cols-6 gap-2">
                <div className="col-span-2 font-bold text-slate-700">Level Satker (A6)</div>
                <div className="col-span-4 text-slate-800">: {draft.levelSatker || 'Satker Daerah (KD)'}</div>
              </div>
            </div>

            {/* Main Table (Row 7+) */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-slate-900 text-left text-[11px]">
                <thead>
                  <tr className="bg-[#2F5597] text-white">
                    <th className="border border-slate-900 px-2.5 py-2 text-center font-bold">Kode Satker</th>
                    <th className="border border-slate-900 px-2.5 py-2 text-center font-bold">Tipe</th>
                    <th className="border border-slate-900 px-2.5 py-2 text-center font-bold">Peran</th>
                    <th className="border border-slate-900 px-3 py-2 font-bold">Nama</th>
                    <th className="border border-slate-900 px-3 py-2 text-center font-bold">NIK</th>
                    <th className="border border-slate-900 px-3 py-2 font-bold">Peran</th>
                  </tr>
                </thead>
                <tbody>
                  {(draft.users || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400 italic border border-slate-900">
                        Belum ada pengguna yang dipilih untuk dimutakhirkan.
                      </td>
                    </tr>
                  ) : (
                    draft.users.map((u, idx) => {
                      const rolesList = sortRolesByMasterOrder(u.rolesPemutakhiran || []);
                      const rolesStr = formatRolesForExcel(rolesList);
                      return (
                        <tr key={u.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="border border-slate-900 px-2 py-1.5 text-center font-mono text-slate-600">
                            =$B$3 ({draft.kodeSatker})
                          </td>
                          <td className="border border-slate-900 px-2 py-1.5 text-center font-semibold text-slate-700">
                            {u.tipe || 'SATKER'}
                          </td>
                          <td className="border border-slate-900 px-2 py-1.5 text-center font-bold text-indigo-700">
                            {u.peranKategori || 'OPERATOR'}
                          </td>
                          <td className="border border-slate-900 px-2.5 py-1.5 font-bold text-slate-900">
                            {u.nama || '-'}
                          </td>
                          <td className="border border-slate-900 px-2 py-1.5 text-center font-mono text-slate-800">
                            {u.nik || '-'}
                          </td>
                          <td className="border border-slate-900 px-2.5 py-1.5 text-slate-800 leading-relaxed">
                            {rolesStr || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Notes */}
            <div className="mb-8 text-[11px] text-slate-700 border-l-2 border-amber-500 pl-3 py-1">
              <div className="font-bold text-slate-900 mb-1">Catatan:</div>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Silakan mengisi data pengguna (User) yang ingin di-update kewenangannya.</li>
                <li>Pastikan NIK telah benar dimiliki oleh pengguna dan sesuai (16 digit).</li>
                <li>Isian Formulir Pemutakhiran Kewenangan akan mengupdate kewenangan user yang ada saat ini.</li>
              </ol>
            </div>

            {/* Signature Area */}
            <div className="flex justify-end">
              <div className="w-64 text-center">
                <div className="text-slate-800 mb-1">
                  {draft.tempatPenetapan || 'Jakarta'}, {formatIndonesianDate(draft.tanggalPenetapan || new Date().toISOString())}
                </div>
                <div className="font-bold text-slate-900 mb-16">
                  {draft.kpa?.jabatan || 'Kuasa Pengguna Anggaran'}
                </div>
                <div className="font-bold text-slate-900 underline">
                  {draft.kpa?.nama || '(..................................................)'}
                </div>
                <div className="text-slate-700 text-[10px] mt-0.5">
                  NIP. {draft.kpa?.nip || '...........................................'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Format workbook mematuhi 2 sheet standar ("Form Pemutakhiran Kewenangan" & "Contoh Kasus")</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
