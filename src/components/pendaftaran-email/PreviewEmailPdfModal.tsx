import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  UserCheck, 
  Edit3, 
  ShieldCheck,
  Building
} from 'lucide-react';
import { PendaftaranEmailDraft, PejabatEmailPenandatangan } from '../../types';
import { exportPendaftaranEmailToPdf, getStatusNameByCode } from '../../utils/pendaftaranEmailExport';

interface PreviewEmailPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: PendaftaranEmailDraft;
  onUpdatePejabat?: (pejabat: PejabatEmailPenandatangan) => void;
}

export const PreviewEmailPdfModal: React.FC<PreviewEmailPdfModalProps> = ({
  isOpen,
  onClose,
  draft,
  onUpdatePejabat
}) => {
  const [isEditingPejabat, setIsEditingPejabat] = useState(false);
  const [pejabatNama, setPejabatNama] = useState(draft.pejabat?.nama || '');
  const [pejabatNip, setPejabatNip] = useState(draft.pejabat?.nip || '');
  const [pejabatJabatan, setPejabatJabatan] = useState(draft.pejabat?.jabatan || 'Kuasa Pengguna Anggaran');

  if (!isOpen) return null;

  const handleSavePejabat = () => {
    const updated: PejabatEmailPenandatangan = {
      nama: pejabatNama.trim(),
      nip: pejabatNip.trim(),
      jabatan: pejabatJabatan.trim() || 'Kuasa Pengguna Anggaran'
    };
    if (onUpdatePejabat) {
      onUpdatePejabat(updated);
    }
    setIsEditingPejabat(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>👁 Pratinjau Dokumen Cetak Rekap PDF</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                  Siap Tanda Tangan
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dokumen formal A4 untuk lampiran permohonan pendaftaran email kedinasan.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Cetak langsung menggunakan dialog printer browser"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pejabat Signer Configuration Ribbon */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                Penandatangan Dokumen: {draft.pejabat?.nama || '(Belum diset)'} ({draft.pejabat?.jabatan || 'KPA'})
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                NIP: {draft.pejabat?.nip || '-'} • Diambil dari Master Pejabat Satker
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingPejabat(!isEditingPejabat)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-500" />
            <span>{isEditingPejabat ? 'Tutup Pengaturan' : 'Ganti Pejabat Penandatangan'}</span>
          </button>
        </div>

        {/* Pejabat Edit Form (Expandable) */}
        {isEditingPejabat && (
          <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 space-y-3 shrink-0 animate-in fade-in duration-150">
            <h4 className="text-xs font-black text-teal-900 dark:text-teal-200 uppercase tracking-wider">
              Ubah Data Pejabat Penandatangan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Pejabat *
                </label>
                <input
                  type="text"
                  value={pejabatNama}
                  onChange={(e) => setPejabatNama(e.target.value)}
                  placeholder="Nama Lengkap dan Gelar"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  NIP Pejabat *
                </label>
                <input
                  type="text"
                  value={pejabatNip}
                  onChange={(e) => setPejabatNip(e.target.value)}
                  placeholder="198001012005011001"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Jabatan *
                </label>
                <input
                  type="text"
                  value={pejabatJabatan}
                  onChange={(e) => setPejabatJabatan(e.target.value)}
                  placeholder="Kuasa Pengguna Anggaran"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSavePejabat}
                className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terapkan Penandatangan</span>
              </button>
            </div>
          </div>
        )}

        {/* Paper Sheet Preview Area (Simulating Printable A4) */}
        <div className="flex-1 overflow-y-auto bg-slate-200 dark:bg-slate-950/80 p-4 sm:p-6 rounded-2xl flex justify-center">
          <div className="bg-white text-slate-900 shadow-xl rounded-lg max-w-2xl w-full p-8 space-y-6 min-h-[700px] border border-slate-300 text-xs leading-relaxed font-sans print:shadow-none print:border-none print:m-0 print:p-0">
            {/* Kop Surat Resmi */}
            <div className="text-center space-y-1 pb-3 border-b-2 border-slate-900">
              <h4 className="font-bold text-sm tracking-wider uppercase">
                KEMENTERIAN KEUANGAN REPUBLIK INDONESIA
              </h4>
              <p className="font-bold text-xs uppercase tracking-wide">
                DIREKTORAT JENDERAL PERBENDAHARAAN
              </p>
              <p className="text-[11px] text-slate-700">
                KANTOR PELAYANAN PERBENDAHARAAN NEGARA SEMARANG I (KPPN {draft.kodeKppn || '136'})
              </p>
            </div>

            {/* Document Title */}
            <div className="text-center space-y-1 pt-2">
              <h3 className="font-black text-sm tracking-wide uppercase">
                DAFTAR PENDAFTARAN EMAIL KEDINASAN PEGAWAI
              </h3>
              <p className="text-[11px] text-slate-600">
                Lampiran Rekapitulasi Data Permohonan Pendaftaran Akun Email Kedinasan
              </p>
            </div>

            {/* Satker Metadata Box */}
            <div className="p-3 bg-slate-50 rounded border border-slate-300 text-[11px] grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <p><strong>Kode KPPN:</strong> {draft.kodeKppn || '136'} (Semarang I)</p>
                <p><strong>Kode Satker:</strong> {draft.kodeSatker}</p>
                <p><strong>Nama Satker:</strong> {draft.namaSatker}</p>
              </div>
              <div className="space-y-0.5 text-right">
                <p><strong>Tanggal:</strong> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p><strong>Jumlah Pegawai:</strong> {draft.pegawaiList.length} Orang</p>
                <p><strong>Status:</strong> Siap Ditandatangani</p>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                    <th className="py-2 px-2 text-center border-r border-slate-300 w-10">No</th>
                    <th className="py-2 px-3 border-r border-slate-300">Nama Pegawai</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-300">NIP / NRP</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-300">NIK</th>
                    <th className="py-2 px-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {draft.pegawaiList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                        Belum ada data pegawai.
                      </td>
                    </tr>
                  ) : (
                    draft.pegawaiList.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2 text-center font-mono border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3 font-semibold border-r border-slate-200">
                          {p.namaPegawai}
                        </td>
                        <td className="py-1.5 px-2.5 text-center font-mono border-r border-slate-200">
                          {p.nipNrp}
                        </td>
                        <td className="py-1.5 px-2.5 text-center font-mono border-r border-slate-200">
                          {p.nik}
                        </td>
                        <td className="py-1.5 px-2.5 text-center font-semibold">
                          {getStatusNameByCode(p.status)} ({p.status})
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Signature Block (Manual signature and stamp area) */}
            <div className="pt-8 flex justify-end">
              <div className="w-64 text-center space-y-1">
                <p className="text-[11px]">
                  Semarang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-[11px] font-semibold">Mengetahui,</p>
                <p className="text-[11px] font-semibold">{draft.pejabat?.jabatan || 'Kuasa Pengguna Anggaran'}</p>

                {/* Space for manual signature and stamp */}
                <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 italic">
                  ( Ruang Tanda Tangan &amp; Cap Dinas )
                </div>

                <p className="text-xs font-bold underline">
                  {draft.pejabat?.nama || '........................................'}
                </p>
                <p className="text-[11px] font-mono">
                  NIP/NRP. {draft.pejabat?.nip || '........................................'}
                </p>
              </div>
            </div>
          </div>
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
              exportPendaftaranEmailToPdf(draft);
              onClose();
            }}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Berkas PDF Resmi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
