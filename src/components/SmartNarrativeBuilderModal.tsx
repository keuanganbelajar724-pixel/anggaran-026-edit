import React, { useState, useEffect } from 'react';
import { DiagnostikCaputROItem } from '../types';
import { SAKTI_REFERENSI_LIST } from '../utils/diagnostikCaputProcessor';
import { 
  Sparkles, 
  X, 
  Check, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Sliders,
  FileText
} from 'lucide-react';

interface SmartNarrativeBuilderModalProps {
  ro: DiagnostikCaputROItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNarrative: (roId: string, customNarrative: string, refCode: string) => void;
  isDark?: boolean;
}

export const SmartNarrativeBuilderModal: React.FC<SmartNarrativeBuilderModalProps> = ({
  ro,
  isOpen,
  onClose,
  onSaveNarrative,
  isDark = false
}) => {
  const [refCode, setRefCode] = useState<string>('07');
  const [aktivitasText, setAktivitasText] = useState<string>('');
  const [kendalaText, setKendalaText] = useState<string>('');
  const [solusiText, setSolusiText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (ro) {
      const initialRef = ro.selectedReferensiSakti && ro.selectedReferensiSakti !== '99' ? ro.selectedReferensiSakti : '07';
      setRefCode(initialRef);
      setAktivitasText(`Pelaksanaan tahapan fisik RO ${ro.kodeRo} telah terealisasi ${ro.realisasiProgres.toFixed(2)}% dari target ${ro.targetProgres.toFixed(2)}% dengan output volume ${ro.volumeRealisasi} dari target ${ro.volumeTarget} vol.`);
      
      if (ro.gapKinerja > 20) {
        setKendalaText('Terdapat kendala teknis penyesuaian jadwal pelaksanaan dan proses verifikasi dokumen administrasi pendukung.');
        setSolusiText('Telah dilakukan percepatan koordinasi teknis tim pelaksana dan dijadwalkan penyelesaian tuntas pada periode berikutnya.');
      } else if (ro.gapPpa > 20) {
        setKendalaText('Pekerjaan fisik telah dilaksanakan mendahului pencairan SP2D keuangan karena pengujian berkas SPJ sedang berlangsung.');
        setSolusiText('Pengajuan SPM ke KPPN segera diselesaikan pada awal bulan ini untuk menyesuaikan serapan belanja.');
      } else {
        setKendalaText('Aktivitas operasional rutin berjalan sesuai tahapan DIPA/POK tanpa kendala teknis yang signifikan.');
        setSolusiText('Mempertahankan ritme capaian target dan memastikan kelengkapan dokumen BAST sebelum tutup buku.');
      }
    }
  }, [ro]);

  if (!isOpen || !ro) return null;

  // Compile standard narrative format
  const compiledNarrative = `[1. Capaian & Tahapan Aktivitas]: ${aktivitasText.trim()} [2. Kendala & Permasalahan]: ${kendalaText.trim()} [3. Tindak Lanjut & Mitigasi]: ${solusiText.trim()} [Validasi PPK]: Data telah sesuai standar PER-5/PB/2024.`;

  const charCount = compiledNarrative.length;
  const isOverLimit = charCount > 2000;

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledNarrative);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    onSaveNarrative(ro.id, compiledNarrative, refCode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">
                  Penyusun Narasi SAKTI (3 Elemen Wajib)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300">
                  {ro.kodeRo}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-md mt-0.5">
                {ro.namaRo}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Reference Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Kode Referensi SAKTI Resmi:
            </label>
            <select
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              {SAKTI_REFERENSI_LIST.map(ref => (
                <option key={ref.kode} value={ref.kode}>
                  {ref.kode === '99' ? `⚠️ ${ref.kode}) ${ref.judul} (Dihindari)` : `${ref.kode}) ${ref.judul}`}
                </option>
              ))}
            </select>

            {/* Warning when 99 is selected */}
            {refCode === '99' && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Perhatian DJPb &amp; KPPN:</strong>
                  Hindari penggunaan Kode 99 (Lain-lain). Disarankan memilih kode referensi 01 s.d. 08 yang substantif (misalnya Kode 01 Efisiensi, Kode 02 SPJ Masih Proses, Kode 04 Penyesuaian Target, Kode 05 Penilaian Periodik, atau Kode 07 Menunggu BAST/Laporan) agar data langsung disetujui dan tidak ditolak KPPN.
                </div>
              </div>
            )}
          </div>

          {/* Elemen 1: Realisasi Fisik */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>1. Capaian &amp; Rincian Tahapan Aktivitas Riil:</span>
              <span className="text-[10px] text-slate-400 font-normal">Wajib diisi</span>
            </label>
            <textarea
              rows={2}
              value={aktivitasText}
              onChange={(e) => setAktivitasText(e.target.value)}
              className={`w-full text-xs p-3 rounded-xl border outline-none focus:border-indigo-500 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
              placeholder="Contoh: Telah dilaksanakan sosialisasi tahap 1..."
            />
          </div>

          {/* Elemen 2: Kendala Teknis */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>2. Kendala / Alasan Terjadinya Deviasi Capaian:</span>
              <span className="text-[10px] text-slate-400 font-normal">Substantif</span>
            </label>
            <textarea
              rows={2}
              value={kendalaText}
              onChange={(e) => setKendalaText(e.target.value)}
              className={`w-full text-xs p-3 rounded-xl border outline-none focus:border-indigo-500 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
              placeholder="Contoh: Proses pengadaan lelang membutuhkan review teknis..."
            />
          </div>

          {/* Elemen 3: Rencana Solusi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>3. Solusi &amp; Rencana Tindak Lanjut Bulan Depan:</span>
              <span className="text-[10px] text-slate-400 font-normal">Mitigasi</span>
            </label>
            <textarea
              rows={2}
              value={solusiText}
              onChange={(e) => setSolusiText(e.target.value)}
              className={`w-full text-xs p-3 rounded-xl border outline-none focus:border-indigo-500 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
              placeholder="Contoh: Percepatan penyelesaian SPM diajukan minggu pertama..."
            />
          </div>

          {/* Compiled Output Preview */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pratinjau Keterangan SAKTI Lengkap:
              </span>
              <span className={`text-xs font-mono font-bold ${isOverLimit ? 'text-rose-600' : 'text-slate-500'}`}>
                {charCount} / 2.000 Karakter {isOverLimit && '(Melebihi Batas SAKTI!)'}
              </span>
            </div>

            <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed font-sans ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              {compiledNarrative}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`px-6 py-4 border-t flex items-center justify-between gap-3 ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Tersalin!' : 'Salin Teks'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handleSave}
              disabled={isOverLimit}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Narasi ke RO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
