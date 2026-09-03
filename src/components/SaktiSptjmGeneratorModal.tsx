import React, { useState } from 'react';
import { DiagnostikCaputResult, DiagnostikCaputROItem } from '../types';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  ShieldCheck, 
  FileText, 
  Building2, 
  User, 
  Calendar,
  Sparkles
} from 'lucide-react';

interface SaktiSptjmGeneratorModalProps {
  data: DiagnostikCaputResult | null;
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const SaktiSptjmGeneratorModal: React.FC<SaktiSptjmGeneratorModalProps> = ({
  data,
  isOpen,
  onClose,
  isDark = false
}) => {
  const [kpaName, setKpaName] = useState<string>('DR. H. AHMAD HIDAYAT, S.E., M.Si.');
  const [kpaNip, setKpaNip] = useState<string>('19780512 200312 1 002');
  const [kpaJabatan, setKpaJabatan] = useState<string>('Kuasa Pengguna Anggaran (KPA)');
  const [nomorSurat, setNomorSurat] = useState<string>('SPTJM-014/KPA.02/09/2026');
  const [tanggalSurat, setTanggalSurat] = useState<string>('10 September 2026');
  const [kotaSurat, setKotaSurat] = useState<string>('Jakarta');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !data) return null;

  const satkerCode = data.summary.satkerCode || '654321';
  const satkerName = data.summary.satkerName || 'Kantor Pelayanan Utama';
  const periode = data.summary.periode || 'Agustus 2026';

  const criticalItems = data.items.filter(it => it.diagnosaSeverity !== 'OPTIMAL' || it.validasiSaktiCode !== '00');

  const generateSptjmText = (): string => {
    return `SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK (SPTJM)
LAPORAN CAPAIAN OUTPUT BULANAN SATKER PADA APLIKASI SAKTI
NOMOR: ${nomorSurat}

Yang bertanda tangan di bawah ini:
Nama        : ${kpaName}
NIP         : ${kpaNip}
Jabatan     : ${kpaJabatan}
Satuan Kerja: [${satkerCode}] ${satkerName}

Menyatakan dengan sesungguhnya bahwa:
1. Data realisasi volume (RVRO) dan realisasi progres fisik (PCRO) yang dilaporkan melalui Aplikasi SAKTI untuk Periode ${periode} telah diverifikasi dan dihitung berdasarkan bukti fisik yang sah (Berita Acara Kemajuan Pekerjaan / BAST / Laporan Kegiatan).
2. Terhadap Rincian Output (RO) yang memiliki deviasi capaian fisik terhadap target maupun selisih antara progres fisik dengan penyerapan anggaran lebih dari 20%, telah dilengkapi dengan kode referensi kendala yang sesuai dan narasi penjelasan 3 elemen (Aktivitas, Kendala, Solusi) sebagaimana diatur dalam PER-5/PB/2024.
3. Rincian data output yang kami pertanggungjawabkan adalah sejumlah ${data.items.length} Rincian Output (RO) dengan rincian deviasi kendala sebagai berikut:
${criticalItems.slice(0, 10).map((ro, i) => `   ${i + 1}. [${ro.kodeRo}] PCRO: ${ro.realisasiProgres}%, RVRO: ${ro.realisasiVolume}, Ref: ${ro.rekomendasiRefCode || '01'} - ${ro.rekomendasiRefName || 'Belum Selesai'}`).join('\n')}
${criticalItems.length > 10 ? `   ... dan ${criticalItems.length - 10} RO lainnya terlampir pada sistem SAKTI.` : ''}

4. Apabila di kemudian hari ditemukan ketidaksesuaian antara data yang dilaporkan pada Aplikasi SAKTI dengan kondisi fisik riil di lapangan, kami bersedia bertanggung jawab penuh sesuai dengan ketentuan peraturan perundang-undangan.

Demikian Surat Pernyataan Tanggung Jawab Mutlak ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.

${kotaSurat}, ${tanggalSurat}
Kuasa Pengguna Anggaran,

[Materai Rp 10.000]

${kpaName}
NIP. ${kpaNip}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateSptjmText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-current/10 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-black leading-tight">
                Generator SPTJM Capaian Output SAKTI (PER-5/PB/2024)
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Surat Pernyataan Tanggung Jawab Mutlak Kuasa Pengguna Anggaran (KPA)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Metadata Controls */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Nomor Surat SPTJM:
              </label>
              <input
                type="text"
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Nama KPA:
              </label>
              <input
                type="text"
                value={kpaName}
                onChange={(e) => setKpaName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                NIP KPA:
              </label>
              <input
                type="text"
                value={kpaNip}
                onChange={(e) => setKpaNip(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Kota Penandatangan:
              </label>
              <input
                type="text"
                value={kotaSurat}
                onChange={(e) => setKotaSurat(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Tanggal Dokumen:
              </label>
              <input
                type="text"
                value={tanggalSurat}
                onChange={(e) => setTanggalSurat(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
              />
            </div>

            <div className="flex items-end">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 text-[11px] w-full font-medium">
                💡 Wajib bermaterai Rp 10.000 saat pengajuan dispensasi buka periode ke KPPN.
              </div>
            </div>
          </div>

          {/* Letter Sheet Preview */}
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-serif leading-relaxed text-xs sm:text-sm shadow-inner space-y-4">
            <div className="text-center space-y-1 pb-4 border-b border-current/20">
              <h4 className="font-bold tracking-wider text-sm sm:text-base font-sans">
                SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK (SPTJM)
              </h4>
              <p className="text-xs font-sans text-slate-500 font-mono">
                NOMOR: {nomorSurat}
              </p>
            </div>

            <p>Yang bertanda tangan di bawah ini:</p>
            <div className="pl-4 space-y-1 text-xs sm:text-sm font-sans">
              <div className="grid grid-cols-4 gap-2">
                <span className="font-bold">Nama</span>
                <span className="col-span-3">: {kpaName}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <span className="font-bold">NIP</span>
                <span className="col-span-3 font-mono">: {kpaNip}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <span className="font-bold">Jabatan</span>
                <span className="col-span-3">: {kpaJabatan}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <span className="font-bold">Satuan Kerja</span>
                <span className="col-span-3">: [{satkerCode}] {satkerName}</span>
              </div>
            </div>

            <p className="pt-2">Menyatakan dengan sesungguhnya bahwa:</p>
            <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                Data realisasi volume (RVRO) dan realisasi progres fisik (PCRO) yang dilaporkan melalui Aplikasi SAKTI untuk <strong>Periode {periode}</strong> telah diverifikasi dan dihitung berdasarkan bukti fisik yang sah (Berita Acara Kemajuan Pekerjaan / BAST / Laporan Kegiatan).
              </li>
              <li>
                Terhadap Rincian Output (RO) yang memiliki deviasi capaian fisik terhadap target maupun selisih antara progres fisik dengan penyerapan anggaran lebih dari 20%, telah dilengkapi dengan kode referensi kendala yang sesuai dan narasi penjelasan 3 elemen (Aktivitas, Kendala, Solusi) sebagaimana diatur dalam <strong>PER-5/PB/2024</strong>.
              </li>
              <li>
                Rincian data output yang kami pertanggungjawabkan adalah sejumlah <strong>{data.items.length} Rincian Output (RO)</strong> yang tercatat pada Aplikasi SAKTI.
              </li>
              <li>
                Apabila di kemudian hari ditemukan ketidaksesuaian antara data yang dilaporkan pada Aplikasi SAKTI dengan kondisi fisik riil di lapangan, kami bersedia bertanggung jawab penuh sesuai dengan ketentuan peraturan perundang-undangan.
              </li>
            </ol>

            <p className="pt-2">
              Demikian Surat Pernyataan Tanggung Jawab Mutlak ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.
            </p>

            <div className="pt-6 flex justify-end">
              <div className="text-center space-y-12 w-64">
                <p className="text-xs font-sans">
                  {kotaSurat}, {tanggalSurat}<br />
                  <strong>Kuasa Pengguna Anggaran,</strong>
                </p>
                <div className="w-24 h-12 mx-auto border border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-400">
                  Materai 10.000
                </div>
                <div>
                  <p className="font-bold underline text-xs font-sans">{kpaName}</p>
                  <p className="text-[11px] font-mono text-slate-500">NIP. {kpaNip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-current/10 bg-slate-50 dark:bg-slate-800/60">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Teks Dokumen'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
