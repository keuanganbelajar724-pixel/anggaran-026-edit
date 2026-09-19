import React from 'react';
import { PemutakhiranDataDraft } from '../../types';
import {
  X,
  FileSpreadsheet,
  FileText,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { formatRolesForExcel, sortRolesByMasterOrder } from '../../data/masterRoleSakti';
import { formatToDdMmYyyy } from '../../utils/saktiMasterTemplateService';
import { formatIndonesianDate } from '../../utils/pendaftaranSaktiExport';

interface PreviewPemutakhiranDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: PemutakhiranDataDraft;
  onExportExcel: () => void;
  onExportPDF: () => void;
  isExportingExcel?: boolean;
}

export const PreviewPemutakhiranDataModal: React.FC<PreviewPemutakhiranDataModalProps> = ({
  isOpen,
  onClose,
  draft,
  onExportExcel,
  onExportPDF,
  isExportingExcel = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Preview Formulir Pemutakhiran Data Pengguna SAKTI</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Format tabel 10 kolom sesuai Master Template Excel & dokumen cetak PDF
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportExcel}
              disabled={isExportingExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {isExportingExcel ? 'Memproses...' : 'Unduh Excel Master'}
            </button>
            <button
              type="button"
              onClick={onExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Unduh PDF Formulir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body - Document Simulator */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-950/40">
          {/* Document Sheet Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            {/* Title / Kop */}
            <div className="text-center pb-4 border-b border-slate-800">
              <h2 className="text-lg font-black tracking-wide text-white uppercase">
                FORMULIR PEMUTAKHIRAN DATA PENGGUNA SAKTI
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Kementerian Keuangan RI • Direktorat Jenderal Perbendaharaan
              </p>
            </div>

            {/* Satker Metadata Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-b border-slate-800/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium w-24">Kode Satker:</span>
                <span className="font-mono font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/60">
                  {draft.kodeSatker}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium w-24">Nama Satker:</span>
                <span className="font-bold text-white truncate" title={draft.namaSatker}>
                  {draft.namaSatker}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium w-24">Level Satker:</span>
                <span className="text-slate-300">
                  {draft.levelSatker || 'Satker Daerah (KD)'}
                </span>
              </div>
            </div>

            {/* 10-Column Master Table */}
            <div className="overflow-x-auto my-5 rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-850 text-slate-300 font-bold border-b border-slate-700">
                    <th className="p-2.5 text-center w-10 border-r border-slate-800">No</th>
                    <th className="p-2.5 text-center w-24 border-r border-slate-800">Kode Satker</th>
                    <th className="p-2.5 w-60 border-r border-slate-800">Peran (Role SAKTI)</th>
                    <th className="p-2.5 w-44 border-r border-slate-800">Nama</th>
                    <th className="p-2.5 text-center w-36 border-r border-slate-800">NIP</th>
                    <th className="p-2.5 text-center w-32 border-r border-slate-800">NPWP</th>
                    <th className="p-2.5 text-center w-36 border-r border-slate-800">NIK</th>
                    <th className="p-2.5 w-48 border-r border-slate-800">E-mail</th>
                    <th className="p-2.5 text-center w-28 border-r border-slate-800">No. HP</th>
                    <th className="p-2.5 w-36 border-r border-slate-800">Nomor SK</th>
                    <th className="p-2.5 text-center w-28">Tanggal SK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono text-[11px]">
                  {draft.users.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-500 font-sans">
                        Belum ada data pengguna yang dipilih untuk formulir ini.
                      </td>
                    </tr>
                  ) : (
                    draft.users.map((u, idx) => {
                      const sortedRoles = sortRolesByMasterOrder(u.peranList || []);
                      const rolesStr = formatRolesForExcel(sortedRoles);
                      const cleanNik = (u.nik || '').replace(/\D/g, '');
                      const cleanNip = (u.nip || '').replace(/\D/g, '');
                      const cleanNpwp = (u.npwp || '').replace(/\D/g, '');
                      const tglSk = formatToDdMmYyyy(u.tanggalSk);

                      // Check if any field changed from dataAwal
                      const dAwal = u.dataAwal;
                      const isNameChanged = dAwal && dAwal.nama !== u.nama;
                      const isNipChanged = dAwal && dAwal.nip !== u.nip;
                      const isNpwpChanged = dAwal && dAwal.npwp !== u.npwp;
                      const isNikChanged = dAwal && dAwal.nik !== u.nik;
                      const isEmailChanged = dAwal && dAwal.email !== u.email;
                      const isHpChanged = dAwal && dAwal.noHp !== u.noHp;
                      const isSkChanged = dAwal && dAwal.nomorSk !== u.nomorSk;
                      const isTglSkChanged = dAwal && dAwal.tanggalSk !== u.tanggalSk;
                      const isRolesChanged = dAwal && JSON.stringify(dAwal.peranList?.sort()) !== JSON.stringify(u.peranList?.sort());

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-2.5 text-center text-slate-400 font-sans border-r border-slate-800">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 text-center text-teal-400 font-bold border-r border-slate-800">
                            {draft.kodeSatker}
                          </td>
                          <td className="p-2.5 border-r border-slate-800 leading-relaxed font-sans text-xs">
                            <span className={isRolesChanged ? 'text-amber-300 font-medium' : 'text-slate-200'}>
                              {rolesStr || '-'}
                            </span>
                            {isRolesChanged && (
                              <span className="block text-[9px] text-amber-400 font-mono mt-0.5">
                                [Role Dimutakhirkan]
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-sans font-semibold text-white border-r border-slate-800">
                            <span className={isNameChanged ? 'text-amber-300 font-bold' : ''}>
                              {u.nama || '-'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center text-slate-300 border-r border-slate-800">
                            <span className={isNipChanged ? 'text-amber-300 font-bold' : ''}>
                              {cleanNip || '-'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center text-slate-300 border-r border-slate-800">
                            <span className={isNpwpChanged ? 'text-amber-300 font-bold' : ''}>
                              {cleanNpwp || '-'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center text-slate-300 border-r border-slate-800">
                            <span className={isNikChanged ? 'text-amber-300 font-bold' : ''}>
                              {cleanNik || '-'}
                            </span>
                          </td>
                          <td className="p-2.5 font-sans text-slate-300 border-r border-slate-800 truncate">
                            <span className={isEmailChanged ? 'text-amber-300 font-bold' : ''}>
                              {u.email || '-'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center text-slate-300 border-r border-slate-800">
                            <span className={isHpChanged ? 'text-amber-300 font-bold' : ''}>
                              {u.noHp || '-'}
                            </span>
                          </td>
                          <td className="p-2.5 font-sans text-slate-300 border-r border-slate-800">
                            <span className={isSkChanged ? 'text-amber-300 font-bold' : ''}>
                              {u.nomorSk || '-'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center text-slate-300">
                            <span className={isTglSkChanged ? 'text-amber-300 font-bold' : ''}>
                              {tglSk || '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Notes Section */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs space-y-1.5 text-slate-400">
              <span className="font-bold text-slate-300 block mb-1">Catatan Resmi Template:</span>
              <p>1. NIP, NPWP, dan NIK diisi angka tanpa pemisah simbol</p>
              <p>2. Email diisi dengan email SAKTI (@sakti.mail.go.id) atau Kemenkeu (@kemenkeu.go.id) bagi pegawai Kemenkeu</p>
              <p>3. tanggal SK diisi dengan format DD-MM-YYYY</p>
            </div>

            {/* Signature Block */}
            <div className="flex justify-end pt-6">
              <div className="w-72 text-center text-xs space-y-1">
                <p className="text-slate-400">
                  {draft.tempatPenetapan || 'Jakarta'}, {formatIndonesianDate(draft.tanggalPenetapan || new Date().toISOString())}
                </p>
                <p className="font-bold text-white">
                  {draft.kpa?.jabatan || 'Kuasa Pengguna Anggaran'}
                </p>
                <div className="h-20 flex items-center justify-center text-slate-600 italic text-[11px]">
                  (Tanda Tangan & Cap Kedinasan)
                </div>
                <p className="font-bold text-white border-b border-slate-700 pb-0.5 inline-block min-w-44">
                  {draft.kpa?.nama || '(..................................................)'}
                </p>
                <p className="text-slate-400">
                  NIP. {draft.kpa?.nip || '...........................................'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-teal-400" />
            <span>Total Pengguna: {draft.users.length} orang • Format 100% Mengikuti Master Template Kemenkeu</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup Preview
          </button>
        </div>
      </div>
    </div>
  );
};
