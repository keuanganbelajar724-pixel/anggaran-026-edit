import React from 'react';
import { PerubahanUserHistoryItem } from '../../types';
import { MASTER_ROLE_MAP, formatRolesForExcel } from '../../data/masterRoleSakti';
import { formatIndonesianDate } from '../../utils/pendaftaranSaktiExport';
import { X, FileSpreadsheet, FileText, CheckCircle2, ArrowDown, Building2 } from 'lucide-react';

interface PreviewPerubahanModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: PerubahanUserHistoryItem;
  onExportExcel: () => void;
  onExportPdf: () => void;
  kpaName: string;
  kpaNip: string;
}

export const PreviewPerubahanModal: React.FC<PreviewPerubahanModalProps> = ({
  isOpen,
  onClose,
  submission,
  onExportExcel,
  onExportPdf,
  kpaName,
  kpaNip
}) => {
  if (!isOpen) return null;

  const semula = submission.semula;
  const menjadi = submission.menjadi;
  const diff = submission.diffSummary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pratinjau Dokumen Perubahan User SAKTI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format resmi sesuai standar Kemenkeu & Formulir Web SAKTI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportExcel}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={onExportPdf}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Document Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-100 dark:bg-slate-950/80">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
            {/* Kop Surat / Header */}
            <div className="text-center border-b pb-4 border-slate-200 dark:border-slate-800 space-y-1">
              <p className="font-serif font-bold text-xs sm:text-sm tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                Kementerian Keuangan Republik Indonesia
              </p>
              <p className="font-serif font-bold text-xs sm:text-sm tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                Direktorat Jenderal Perbendaharaan
              </p>
              <p className="font-serif font-semibold text-xs tracking-wider text-slate-600 dark:text-slate-400 uppercase">
                Formulir Perubahan Pengguna Aplikasi Sistem Aplikasi Keuangan Tingkat Instansi (SAKTI)
              </p>
            </div>

            {/* Satker Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 font-mono">
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-sans">Kode Satker:</span>{' '}
                <span className="font-bold text-slate-900 dark:text-white">{submission.kodeSatker}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-sans">Nama Satker:</span>{' '}
                <span className="font-bold text-slate-900 dark:text-white">{submission.namaSatker}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-sans">Level Satker:</span>{' '}
                <span className="font-bold text-slate-900 dark:text-white">{submission.levelSatker || 'Satker Daerah (KD)'}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-sans">Tanggal Dokumen:</span>{' '}
                <span className="font-bold text-slate-900 dark:text-white">{formatIndonesianDate(submission.tanggalPengajuan)}</span>
              </div>
            </div>

            {/* 1. DATA SEMULA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-wide text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  1. DATA SEMULA (SEBELUM PERUBAHAN)
                </span>
                <span className="text-[11px] text-slate-400 italic">Read-Only</span>
              </div>

              <div className="overflow-x-auto border border-amber-200 dark:border-amber-900/60 rounded-xl">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold border-b border-amber-200 dark:border-amber-900/60">
                    <tr>
                      <th className="p-2 border-r border-amber-200/50">Kode Satker</th>
                      <th className="p-2 border-r border-amber-200/50 min-w-[180px]">Peran SAKTI</th>
                      <th className="p-2 border-r border-amber-200/50 min-w-[140px]">Nama</th>
                      <th className="p-2 border-r border-amber-200/50">NIP</th>
                      <th className="p-2 border-r border-amber-200/50">NPWP</th>
                      <th className="p-2 border-r border-amber-200/50">NIK</th>
                      <th className="p-2 border-r border-amber-200/50">E-mail</th>
                      <th className="p-2 border-r border-amber-200/50">No. HP</th>
                      <th className="p-2 border-r border-amber-200/50">Nomor SK</th>
                      <th className="p-2 border-r border-amber-200/50">Tgl SK</th>
                      <th className="p-2">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 dark:divide-amber-950 bg-white dark:bg-slate-900">
                    <tr>
                      <td className="p-2 font-mono text-center border-r border-amber-100 dark:border-amber-950">{semula.kodeSatker}</td>
                      <td className="p-2 border-r border-amber-100 dark:border-amber-950 font-mono text-slate-800 dark:text-slate-200">
                        {formatRolesForExcel(semula.roles || []) || '-'}
                      </td>
                      <td className="p-2 font-semibold border-r border-amber-100 dark:border-amber-950">{semula.nama || '-'}</td>
                      <td className="p-2 font-mono border-r border-amber-100 dark:border-amber-950">{semula.nip || '-'}</td>
                      <td className="p-2 font-mono border-r border-amber-100 dark:border-amber-950">{semula.npwp || '-'}</td>
                      <td className="p-2 font-mono border-r border-amber-100 dark:border-amber-950">{semula.nik || '-'}</td>
                      <td className="p-2 border-r border-amber-100 dark:border-amber-950">{semula.email || '-'}</td>
                      <td className="p-2 font-mono border-r border-amber-100 dark:border-amber-950">{semula.noHp || '-'}</td>
                      <td className="p-2 border-r border-amber-100 dark:border-amber-950">{semula.nomorSk || '-'}</td>
                      <td className="p-2 font-mono border-r border-amber-100 dark:border-amber-950">{semula.tanggalSk || '-'}</td>
                      <td className="p-2 text-slate-600 dark:text-slate-400">{semula.keterangan || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Divider Arrow */}
            <div className="flex items-center justify-center my-1">
              <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
                <ArrowDown className="w-3.5 h-3.5 text-indigo-500 animate-bounce" />
                <span>PERUBAHAN DIAJUKAN</span>
                <ArrowDown className="w-3.5 h-3.5 text-indigo-500 animate-bounce" />
              </div>
            </div>

            {/* 2. DATA MENJADI */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-wide text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  2. DATA MENJADI (SETELAH PERUBAHAN)
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold">Hasil Perubahan</span>
              </div>

              <div className="overflow-x-auto border border-emerald-200 dark:border-emerald-900/60 rounded-xl">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold border-b border-emerald-200 dark:border-emerald-900/60">
                    <tr>
                      <th className="p-2 border-r border-emerald-200/50">Kode Satker</th>
                      <th className="p-2 border-r border-emerald-200/50 min-w-[180px]">Peran SAKTI</th>
                      <th className="p-2 border-r border-emerald-200/50 min-w-[140px]">Nama</th>
                      <th className="p-2 border-r border-emerald-200/50">NIP</th>
                      <th className="p-2 border-r border-emerald-200/50">NPWP</th>
                      <th className="p-2 border-r border-emerald-200/50">NIK</th>
                      <th className="p-2 border-r border-emerald-200/50">E-mail</th>
                      <th className="p-2 border-r border-emerald-200/50">No. HP</th>
                      <th className="p-2 border-r border-emerald-200/50">Nomor SK</th>
                      <th className="p-2 border-r border-emerald-200/50">Tgl SK</th>
                      <th className="p-2">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100 dark:divide-emerald-950 bg-white dark:bg-slate-900">
                    <tr>
                      <td className="p-2 font-mono text-center border-r border-emerald-100 dark:border-emerald-950">{menjadi.kodeSatker}</td>
                      <td className="p-2 border-r border-emerald-100 dark:border-emerald-950 font-mono text-slate-800 dark:text-slate-200">
                        {formatRolesForExcel(menjadi.roles || []) || '-'}
                      </td>
                      <td className="p-2 font-semibold border-r border-emerald-100 dark:border-emerald-950">{menjadi.nama || '-'}</td>
                      <td className="p-2 font-mono border-r border-emerald-100 dark:border-emerald-950">{menjadi.nip || '-'}</td>
                      <td className="p-2 font-mono border-r border-emerald-100 dark:border-emerald-950">{menjadi.npwp || '-'}</td>
                      <td className="p-2 font-mono border-r border-emerald-100 dark:border-emerald-950">{menjadi.nik || '-'}</td>
                      <td className="p-2 border-r border-emerald-100 dark:border-emerald-950">{menjadi.email || '-'}</td>
                      <td className="p-2 font-mono border-r border-emerald-100 dark:border-emerald-950">{menjadi.noHp || '-'}</td>
                      <td className="p-2 border-r border-emerald-100 dark:border-emerald-950">{menjadi.nomorSk || '-'}</td>
                      <td className="p-2 font-mono border-r border-emerald-100 dark:border-emerald-950">{menjadi.tanggalSk || '-'}</td>
                      <td className="p-2 text-slate-600 dark:text-slate-400">{menjadi.keterangan || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Ringkasan Perubahan Terdeteksi:
              </h4>

              <div className="space-y-1.5 text-xs">
                {diff.rolesAdded.length > 0 && (
                  <div className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
                    <span className="font-bold">• Role Ditambahkan:</span>
                    <span>
                      {diff.rolesAdded
                        .map(r => `${r} (${MASTER_ROLE_MAP.get(r)?.roleName || r})`)
                        .join(', ')}
                    </span>
                  </div>
                )}

                {diff.rolesRemoved.length > 0 && (
                  <div className="flex items-start gap-2 text-rose-700 dark:text-rose-300">
                    <span className="font-bold">• Role Dihapus:</span>
                    <span>
                      {diff.rolesRemoved
                        .map(r => `${r} (${MASTER_ROLE_MAP.get(r)?.roleName || r})`)
                        .join(', ')}
                    </span>
                  </div>
                )}

                {diff.fieldChanges.map(fc => (
                  <div key={fc.field} className="flex items-start gap-2 text-indigo-700 dark:text-indigo-300">
                    <span className="font-bold">• {fc.label}:</span>
                    <span>
                      "{fc.from || '(kosong)'}" <span className="text-slate-400 font-normal">berubah menjadi</span> "{fc.to || '(kosong)'}"
                    </span>
                  </div>
                ))}

                {submission.keterangan && (
                  <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-bold">• Alasan Perubahan:</span>
                    <span>{submission.keterangan}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Signature Area */}
            <div className="flex justify-end pt-4">
              <div className="w-64 text-center text-xs space-y-1">
                <p className="text-slate-600 dark:text-slate-400">Mengetahui,</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Kuasa Pengguna Anggaran</p>
                <div className="h-16 flex items-center justify-center text-slate-300 dark:text-slate-600 italic text-[11px]">
                  (Tanda Tangan Asli / Basah)
                </div>
                <p className="font-bold text-slate-900 dark:text-white underline">{kpaName}</p>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">NIP/NRP: {kpaNip}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Formulir ini siap untuk diekspor ke format Excel (.xlsx) atau PDF (.pdf).
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
