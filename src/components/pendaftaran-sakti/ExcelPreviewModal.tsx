import React from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  Info, 
  Table
} from 'lucide-react';
import { PendaftaranUserSaktiDraft } from '../../types';
import { formatRolesForExcel } from '../../data/masterRoleSakti';
import { normalizePhoneNumber } from '../../utils/pendaftaranSaktiValidation';

interface ExcelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: PendaftaranUserSaktiDraft;
  onDownload: () => void;
}

export const ExcelPreviewModal: React.FC<ExcelPreviewModalProps> = ({
  isOpen,
  onClose,
  draft,
  onDownload
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white flex items-center justify-between border-b border-emerald-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Simulasi Format Excel (.xlsx) Resmi SAKTI
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Sheet: Form Pendaftaran
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Struktur kolom, header, baris metadata, dan pemformatan teks 100% identik dengan template Kemenkeu
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

        {/* Content Body: Authentic Excel Spreadsheet Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Pratinjau ini merepresentasikan isi file <strong>Form-Pendaftaran-User-SAKTI-{draft.kodeSatker}.xlsx</strong>. Seluruh data NIP, NIK, dan No. HP diformat sebagai teks untuk mencegah hilangnya angka nol di depan atau perubahan menjadi notasi ilmiah.
            </p>
          </div>

          {/* Spreadsheet Canvas simulation */}
          <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-slate-950 font-sans text-xs">
            {/* Sheet Tabs Top */}
            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-300 dark:border-slate-700 flex items-center gap-2 text-xs">
              <span className="font-bold px-3 py-1 rounded bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border border-slate-300 dark:border-slate-700 shadow-2xs flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5" />
                Form Pendaftaran
              </span>
              <span className="text-slate-500 hover:text-slate-700 px-3 py-1 rounded cursor-pointer">
                Referensi KODE PERAN
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  {/* Excel Column Letters */}
                  <tr className="bg-slate-200 dark:bg-slate-800/90 text-slate-500 font-mono text-[10px] text-center border-b border-slate-300 dark:border-slate-700 select-none">
                    <th className="w-10 py-1 border-r border-slate-300 dark:border-slate-700 bg-slate-300/60 dark:bg-slate-900">#</th>
                    <th className="w-28 py-1 border-r border-slate-300 dark:border-slate-700">A</th>
                    <th className="w-72 py-1 border-r border-slate-300 dark:border-slate-700">B</th>
                    <th className="w-48 py-1 border-r border-slate-300 dark:border-slate-700">C</th>
                    <th className="w-40 py-1 border-r border-slate-300 dark:border-slate-700">D</th>
                    <th className="w-36 py-1 border-r border-slate-300 dark:border-slate-700">E</th>
                    <th className="w-36 py-1 border-r border-slate-300 dark:border-slate-700">F</th>
                    <th className="w-48 py-1 border-r border-slate-300 dark:border-slate-700">G</th>
                    <th className="w-36 py-1 border-r border-slate-300 dark:border-slate-700">H</th>
                    <th className="w-44 py-1 border-r border-slate-300 dark:border-slate-700">I</th>
                    <th className="w-28 py-1">J</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                  {/* Row 1: Title Merged A1:J1 */}
                  <tr className="bg-slate-50 dark:bg-slate-900/60">
                    <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">1</td>
                    <td colSpan={10} className="p-3 text-center font-black text-sm text-slate-900 dark:text-white uppercase tracking-wide">
                      Formulir Pendaftaran Pengguna Aplikasi SAKTI
                    </td>
                  </tr>

                  {/* Row 2: Empty */}
                  <tr>
                    <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">2</td>
                    <td colSpan={10} className="py-1 bg-slate-50/50 dark:bg-slate-950/40"></td>
                  </tr>

                  {/* Row 3: Kode Satker */}
                  <tr>
                    <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">3</td>
                    <td className="p-2 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">Kode Satker</td>
                    <td className="p-2 font-mono font-bold text-emerald-700 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-800">{draft.kodeSatker}</td>
                    <td colSpan={8} className="p-2 bg-slate-50/30 dark:bg-slate-950/20"></td>
                  </tr>

                  {/* Row 4: Nama Satker */}
                  <tr>
                    <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">4</td>
                    <td className="p-2 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">Nama Satker</td>
                    <td className="p-2 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">{draft.namaSatker}</td>
                    <td colSpan={8} className="p-2 bg-slate-50/30 dark:bg-slate-950/20"></td>
                  </tr>

                  {/* Row 5: Level Satker */}
                  <tr>
                    <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">5</td>
                    <td className="p-2 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">Level Satker</td>
                    <td className="p-2 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">{draft.levelSatker}</td>
                    <td colSpan={8} className="p-2 bg-slate-50/30 dark:bg-slate-950/20"></td>
                  </tr>

                  {/* Row 6: Empty */}
                  <tr>
                    <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">6</td>
                    <td colSpan={10} className="py-1 bg-slate-50/50 dark:bg-slate-950/40"></td>
                  </tr>

                  {/* Row 7: Header Table */}
                  <tr className="bg-slate-800 text-white font-bold text-center">
                    <td className="font-mono text-[10px] text-slate-400 bg-slate-900 border-r border-slate-700 select-none">7</td>
                    <td className="p-2 border-r border-slate-700">Kode Satker</td>
                    <td className="p-2 border-r border-slate-700">Peran</td>
                    <td className="p-2 border-r border-slate-700">Nama</td>
                    <td className="p-2 border-r border-slate-700">NIP</td>
                    <td className="p-2 border-r border-slate-700">NPWP</td>
                    <td className="p-2 border-r border-slate-700">NIK</td>
                    <td className="p-2 border-r border-slate-700">E-mail</td>
                    <td className="p-2 border-r border-slate-700">No. HP</td>
                    <td className="p-2 border-r border-slate-700">Nomor SK</td>
                    <td className="p-2">Tanggal SK</td>
                  </tr>

                  {/* Row 8+: User data */}
                  {draft.users.length === 0 ? (
                    <tr>
                      <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">8</td>
                      <td colSpan={10} className="p-4 text-center text-slate-400 italic">
                        Belum ada data pengguna yang ditambahkan
                      </td>
                    </tr>
                  ) : (
                    draft.users.map((u, idx) => {
                      const rowNum = 8 + idx;
                      const roleStr = formatRolesForExcel(u.roles || []);
                      const cleanPhone = normalizePhoneNumber(u.noHp || '');
                      const cleanNIP = (u.nip || '').replace(/\D/g, '');

                      return (
                        <tr key={u.id} className="hover:bg-teal-50/30 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
                            {rowNum}
                          </td>
                          <td className="p-2 font-mono text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                            {draft.kodeSatker}
                          </td>
                          <td className="p-2 font-mono text-[10px] text-amber-700 dark:text-amber-300 border-r border-slate-200 dark:border-slate-800 whitespace-normal break-words max-w-xs">
                            {roleStr}
                          </td>
                          <td className="p-2 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                            {u.namaLengkap}
                          </td>
                          <td className="p-2 font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                            {cleanNIP}
                          </td>
                          <td className="p-2 font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                            {u.npwp || '-'}
                          </td>
                          <td className="p-2 font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                            {u.nik || '-'}
                          </td>
                          <td className="p-2 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                            {u.email}
                          </td>
                          <td className="p-2 font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                            {cleanPhone}
                          </td>
                          <td className="p-2 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                            {u.nomorSk}
                          </td>
                          <td className="p-2 font-mono text-center text-slate-700 dark:text-slate-300">
                            {u.tanggalSk}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Total {draft.users.length} baris pengguna siap diekspor ke Excel resmi.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              Tutup Preview
            </button>
            <button
              type="button"
              onClick={() => {
                onDownload();
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File Excel Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
