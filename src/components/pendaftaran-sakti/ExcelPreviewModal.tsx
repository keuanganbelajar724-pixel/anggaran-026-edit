import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Info, 
  Table,
  CheckCircle2
} from 'lucide-react';
import { PendaftaranUserSaktiDraft } from '../../types';
import { formatRolesForExcel, MASTER_ROLE_SAKTI_LIST } from '../../data/masterRoleSakti';
import { normalizePhoneNumber } from '../../utils/pendaftaranSaktiValidation';
import { formatIndonesianDate } from '../../utils/pendaftaranSaktiExport';

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
  const [activeTab, setActiveTab] = useState<'form' | 'ref'>('form');

  if (!isOpen) return null;

  const cleanKodeSatker = draft.kodeSatker.trim();
  const kota = draft.tempatPenetapan?.trim() || 'Jakarta';
  const rawDate = draft.tanggalPenetapan || new Date().toISOString().split('T')[0];
  const dateFormatted = formatIndonesianDate(rawDate);

  let namaKpa = draft.namaKpa?.trim() || '';
  let nipKpa = draft.nipKpa?.trim() || '';
  if (!namaKpa || !nipKpa) {
    const kpaUser = draft.users.find(u =>
      (u.roles || []).some(r => r.toUpperCase().includes('KPA')) ||
      (u.peranJabatan || '').toUpperCase().includes('KPA') ||
      (u.jabatanPerbendaharaan || '').toUpperCase().includes('KPA')
    );
    if (kpaUser) {
      if (!namaKpa) namaKpa = kpaUser.namaLengkap;
      if (!nipKpa) nipKpa = kpaUser.nip;
    }
  }
  if (!namaKpa) namaKpa = 'Nama KPA';
  if (!nipKpa) nipKpa = '1990xxxx';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#1B365D] via-[#2F5597] to-[#1E3A8A] text-white flex items-center justify-between border-b border-blue-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Simulasi Format Excel (.xlsx) Resmi SAKTI
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  {activeTab === 'form' ? 'Sheet: Form Pendaftaran' : 'Sheet: Referensi KODE PERAN'}
                </span>
              </h3>
              <p className="text-xs text-blue-100">
                Latar Royal Blue (#2F5597), batas sel grid hitam, kotak pernyataan tanggung jawab, dan tanda tangan KPA
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-950 dark:text-blue-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p>
              Pratinjau ini merepresentasikan file master <strong>Contoh Form-Pendaftaran-User-SAKTI-Web-SATKER.xlsx</strong> yang akan diunduh. Header tebal Royal Blue (#2F5597) dan batas sel hitam tipis diterapkan secara persis.
            </p>
          </div>

          {/* Spreadsheet Canvas simulation */}
          <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-slate-950 font-sans text-xs">
            {/* Sheet Tabs Top */}
            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-300 dark:border-slate-700 flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`font-bold px-3 py-1 rounded border shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTab === 'form'
                    ? 'bg-white dark:bg-slate-900 text-[#2F5597] dark:text-blue-400 border-slate-300 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-700 border-transparent'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                Form Pendaftaran
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ref')}
                className={`font-bold px-3 py-1 rounded border shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTab === 'ref'
                    ? 'bg-white dark:bg-slate-900 text-[#2F5597] dark:text-blue-400 border-slate-300 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-700 border-transparent'
                }`}
              >
                Referensi KODE PERAN
              </button>
            </div>

            {activeTab === 'form' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
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
                      <th className="w-28 py-1 border-r border-slate-300 dark:border-slate-700">J</th>
                      <th className="w-36 py-1">K</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px]">
                    {/* Row 1: Title Merged A1:J1 */}
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">1</td>
                      <td colSpan={10} className="p-3 text-center font-bold text-base text-black dark:text-white">
                        Formulir Pendaftaran Pengguna Aplikasi SAKTI
                      </td>
                      <td></td>
                    </tr>

                    {/* Row 2: Empty */}
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">2</td>
                      <td colSpan={11} className="py-1"></td>
                    </tr>

                    {/* Row 3: Kode Satker */}
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">3</td>
                      <td className="p-1.5 font-normal text-slate-800 dark:text-slate-200">Kode Satker</td>
                      <td className="p-1.5 font-normal text-slate-900 dark:text-white">{cleanKodeSatker}</td>
                      <td colSpan={9}></td>
                    </tr>

                    {/* Row 4: Nama Satker */}
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">4</td>
                      <td className="p-1.5 font-normal text-slate-800 dark:text-slate-200">Nama Satker</td>
                      <td className="p-1.5 font-normal text-slate-900 dark:text-white">{draft.namaSatker}</td>
                      <td colSpan={9}></td>
                    </tr>

                    {/* Row 5: Level Satker */}
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">5</td>
                      <td className="p-1.5 font-normal text-slate-800 dark:text-slate-200">Level Satker</td>
                      <td className="p-1.5 font-normal text-slate-900 dark:text-white">{draft.levelSatker}</td>
                      <td colSpan={9}></td>
                    </tr>

                    {/* Row 6: E6 Level Satker */}
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">6</td>
                      <td colSpan={4}></td>
                      <td className="p-1 text-center font-normal text-slate-600 dark:text-slate-400">Level Satker</td>
                      <td colSpan={6}></td>
                    </tr>

                    {/* Row 7: Header Table - Royal Blue #2F5597 with White Bold Text */}
                    <tr className="bg-[#2F5597] text-white font-bold text-center">
                      <td className="font-mono text-[10px] text-slate-400 bg-slate-900 border-r border-slate-700 select-none">7</td>
                      <td className="p-2 border border-black text-center">Kode Satker</td>
                      <td className="p-2 border border-black text-center">Peran</td>
                      <td className="p-2 border border-black text-center">Nama</td>
                      <td className="p-2 border border-black text-center">NIP</td>
                      <td className="p-2 border border-black text-center">NPWP</td>
                      <td className="p-2 border border-black text-center">NIK</td>
                      <td className="p-2 border border-black text-center">E-mail</td>
                      <td className="p-2 border border-black text-center">No. HP</td>
                      <td className="p-2 border border-black text-center">Nomor SK</td>
                      <td className="p-2 border border-black text-center">Tanggal SK</td>
                      <td></td>
                    </tr>

                    {/* Row 8+: User data */}
                    {draft.users.length === 0 ? (
                      <tr>
                        <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">8</td>
                        <td className="p-2 border border-black text-center">{cleanKodeSatker}</td>
                        <td colSpan={9} className="p-2 border border-black text-slate-400 italic">
                          Belum ada data pengguna yang ditambahkan
                        </td>
                        <td></td>
                      </tr>
                    ) : (
                      draft.users.map((u, idx) => {
                        const rowNum = 8 + idx;
                        const roleStr = formatRolesForExcel(u.roles || []);
                        const cleanPhone = normalizePhoneNumber(u.noHp || '');
                        const cleanNIP = (u.nip || '').replace(/\D/g, '');
                        const cleanNIK = (u.nik || '').replace(/\D/g, '');
                        const cleanNPWP = (u.npwp || '').trim();
                        const isBlu = (u.roles || []).some(r => r.toUpperCase().includes('BLU') || r === 'SATKER_VALIDATOR_ANGGARAN');

                        return (
                          <tr key={u.id || idx} className={isBlu ? 'bg-[#FFF2CC] text-black' : 'bg-white dark:bg-slate-900 text-black dark:text-white'}>
                            <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
                              {rowNum}
                            </td>
                            <td className="p-2 border border-black text-center">
                              {cleanKodeSatker}
                            </td>
                            <td className="p-2 border border-black whitespace-normal break-words max-w-xs">
                              {roleStr}
                            </td>
                            <td className="p-2 border border-black">
                              {u.namaLengkap}
                            </td>
                            <td className="p-2 border border-black text-center">
                              {cleanNIP}
                            </td>
                            <td className="p-2 border border-black text-center">
                              {cleanNPWP || '-'}
                            </td>
                            <td className="p-2 border border-black text-center">
                              {cleanNIK || '-'}
                            </td>
                            <td className="p-2 border border-black">
                              {u.email}
                            </td>
                            <td className="p-2 border border-black text-center">
                              {cleanPhone}
                            </td>
                            <td className="p-2 border border-black">
                              {u.nomorSk}
                            </td>
                            <td className="p-2 border border-black text-center">
                              {u.tanggalSk}
                            </td>
                            <td className="p-2 text-red-600 font-bold text-[10px] whitespace-nowrap">
                              {isBlu ? 'KHUSUS SATKER BLU' : ''}
                            </td>
                          </tr>
                        );
                      })
                    )}

                    {/* Row dst */}
                    <tr>
                      <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
                        {8 + Math.max(1, draft.users.length)}
                      </td>
                      <td className="p-1.5 italic text-slate-500">dst</td>
                      <td colSpan={10}></td>
                    </tr>

                    {/* Space Rows */}
                    <tr>
                      <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
                        {9 + Math.max(1, draft.users.length)}
                      </td>
                      <td colSpan={11} className="py-2"></td>
                    </tr>

                    {/* Statement Box (Left A-F) and Signature Block (Right H-J) */}
                    <tr>
                      <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
                        {10 + Math.max(1, draft.users.length)}
                      </td>
                      {/* Statement Box merged A:F */}
                      <td colSpan={6} className="p-3 border border-black align-top bg-white dark:bg-slate-900 text-[10px] leading-relaxed text-slate-800 dark:text-slate-200">
                        <p className="mb-2">
                          <strong>1.</strong> Saya menyatakan bahwa seluruh data yang diisi pada formulir ini adalah <strong>BENAR</strong> dan saya mengisinya dalam keadaan sehat, tanpa paksaan dari siapapun atau tanpa ada tekanan dari pihak manapun. Apabila terbukti diketahui sebaliknya di kemudian hari, maka saya bersedia menerima tuntutan di kemudian hari sesuai dengan ketentuan yang berlaku.
                        </p>
                        <p className="mb-2">
                          <strong>2.</strong> Semua informasi yang dicantumkan pada formulir ini adalah <strong>BENAR dan SAH</strong>, serta membebaskan KPPN dari segala tuntutan pihak ketiga baik perdata maupun pidana, sehubungan dengan kesalahan/ketidakbenaran dalam pemberian informasi.
                        </p>
                        <p>
                          <strong>3.</strong> Bilamana kemudian hari terdapat tuntutan atas transaksi pengeluaran negara atas beban APBN yang berasal dari data elektonik yang saya terbitkan, maka saya bertanggung jawab penuh atas segala risiko yang timbul.
                        </p>
                      </td>
                      <td className="w-10"></td>
                      {/* Signature Block H:J */}
                      <td colSpan={3} className="p-3 align-top text-left text-xs leading-normal">
                        <div className="space-y-1">
                          <p>{kota},    {dateFormatted}</p>
                          <p className="font-bold">Kuasa Pengguna Anggaran</p>
                          <div className="h-14"></div>
                          <p className="font-bold underline">{namaKpa}</p>
                          <p>NIP {nipKpa.replace(/\D/g, '') || nipKpa}</p>
                        </div>
                      </td>
                      <td></td>
                    </tr>

                    {/* Keterangan & Dikirimkan HAI */}
                    <tr>
                      <td className="font-mono text-[10px] text-center text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
                        {11 + Math.max(1, draft.users.length)}
                      </td>
                      <td colSpan={11} className="pt-4 pb-2">
                        <div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                          <p className="font-bold text-black dark:text-white">Keterangan</p>
                          <p>*NPWP diisi angka tanpa pemisah simbol</p>
                          <p>*E-mail diisi dengan e-mail resmi Kedinasan</p>
                          <p>*Tanggal SK diisi dengan format dd-mm-yyyy</p>
                          <p>*Untuk contoh pengisian peran lengkap, silakan kunjungi <span className="text-blue-600 underline cursor-pointer">bit.ly/rolesakti</span></p>
                          
                          <div className="pt-2">
                            <p className="font-bold text-black dark:text-white">Dikirimkan HAI berupa :</p>
                            <p>* file PDF bertandatangan KPA</p>
                            <p>* file excel sebagai lampiran</p>
                            <p>* file SK Penetapan Pengguna SAKTI oleh KPA sebagai lampiran</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              /* Sheet 2: Referensi KODE PERAN */
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-[#2F5597] text-white font-bold text-center">
                      <th className="p-2 border border-black">KODE PERAN PADA EXCEL</th>
                      <th className="p-2 border border-black">DESKRIPSI</th>
                      <th className="p-2 border border-black">KATEGORI</th>
                      <th className="p-2 border border-black">KHUSUS BLU</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px]">
                    {MASTER_ROLE_SAKTI_LIST.map(r => (
                      <tr key={r.roleCode} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <td className="p-2 border border-black font-mono font-bold text-blue-900 dark:text-blue-300">
                          {r.roleCode}
                        </td>
                        <td className="p-2 border border-black">
                          {r.description}
                        </td>
                        <td className="p-2 border border-black">
                          {r.category}
                        </td>
                        <td className={`p-2 border border-black font-bold text-center ${
                          r.specialRequirement === 'BLU_ONLY' ? 'text-red-600 bg-red-50 dark:bg-red-950/20' : 'text-slate-500'
                        }`}>
                          {r.specialRequirement === 'BLU_ONLY' ? 'YA (KHUSUS BLU)' : 'TIDAK'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2F5597] hover:bg-[#25467D] text-white shadow-md shadow-blue-900/20 transition-all cursor-pointer flex items-center gap-1.5"
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
