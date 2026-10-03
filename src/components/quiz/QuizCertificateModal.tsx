import React, { useRef } from 'react';
import { Award, CheckCircle2, Download, Printer, X, ShieldCheck, QrCode } from 'lucide-react';
import { QuizResultRecord } from '../../types/quiz';

interface QuizCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: QuizResultRecord | null;
  isDark?: boolean;
}

export const QuizCertificateModal: React.FC<QuizCertificateModalProps> = ({
  isOpen,
  onClose,
  result,
  isDark = false
}) => {
  if (!isOpen || !result) return null;

  const certificateNo = result.certificateNo || `KPPN026/UKOM-CAT/${new Date(result.completedAt).getFullYear()}/${result.id.slice(-6).toUpperCase()}`;
  const examDate = new Date(result.completedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const getPredicate = (score: number) => {
    if (score >= 90) return { label: 'SANGAT MEMUASKAN (ISTIMEWA)', color: 'text-amber-600 dark:text-amber-400' };
    if (score >= 80) return { label: 'MEMUASKAN', color: 'text-emerald-600 dark:text-emerald-400' };
    if (score >= 70) return { label: 'BAIK', color: 'text-blue-600 dark:text-blue-400' };
    return { label: 'CUKUP', color: 'text-slate-600 dark:text-slate-400' };
  };

  const predicate = getPredicate(result.score);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[96vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-black text-sm text-slate-200">
              e-Sertifikat Kelulusan Uji Kompetensi CAT
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Canvas / Document */}
        <div className="p-4 sm:p-8 overflow-y-auto flex justify-center bg-slate-950/90 print:p-0 print:bg-white">
          <div 
            id="certificate-print-area"
            className="w-full max-w-3xl bg-[#FCFBF7] text-slate-900 p-8 sm:p-12 rounded-3xl border-8 border-double border-amber-600/60 shadow-2xl relative overflow-hidden print:border-amber-700 print:shadow-none print:w-full print:max-w-none"
          >
            {/* Background Guilloche Watermark Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
              <ShieldCheck className="w-96 h-96 text-amber-900" />
            </div>

            {/* Corner Decorative Ornaments */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-600" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-600" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-600" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-600" />

            {/* Header Instansi */}
            <div className="text-center space-y-1 pb-6 border-b-2 border-amber-700/30">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-xs font-black tracking-widest uppercase text-slate-600">
                  KEMENTERIAN KEUANGAN REPUBLIK INDONESIA
                </span>
              </div>
              <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                DIREKTORAT JENDERAL PERBENDAHARAAN • KANWIL DJPB PROVINSI JAWA TENGAH
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                KANTOR PELAYANAN PERBENDAHARAAN NEGARA TIPE A1 SEMARANG I
              </h2>
            </div>

            {/* Title Certificate */}
            <div className="text-center py-6 space-y-2">
              <div className="inline-block px-4 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-widest border border-amber-300">
                SERTIFIKAT KELULUSAN RESMI
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-amber-900 tracking-wide font-serif">
                SERTIFIKAT KOMPETENSI
              </h1>
              <p className="text-[11px] font-mono font-bold text-slate-500">
                Nomor: {certificateNo}
              </p>
            </div>

            {/* Recipient Details */}
            <div className="text-center space-y-4 my-2">
              <p className="text-xs text-slate-600 italic">
                Kepala Kantor Pelayanan Perbendaharaan Negara Semarang I dengan ini menyatakan bahwa:
              </p>

              <div className="py-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight underline decoration-amber-500 decoration-2 underline-offset-8">
                  {result.participantName}
                </h3>
                <p className="text-xs font-bold text-slate-600 mt-2 font-mono">
                  {result.satkerOrUnit}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-xl mx-auto">
                Telah mengikuti dan dinyatakan <strong className="text-emerald-700 font-black">LULUS UJI KOMPETENSI</strong> melalui sistem Simulasi Computer Assisted Test (CAT) Perbendaharaan pada materi:
              </p>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 max-w-lg mx-auto">
                <div className="font-black text-sm text-amber-950">
                  {result.packageTitle}
                </div>
                <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
                  Kategori: {result.category}
                </div>
              </div>

              {/* Score & Predicate Table */}
              <div className="flex items-center justify-center gap-6 py-2">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black block">Nilai Ujian</span>
                  <span className="text-3xl font-black font-mono text-amber-600">{result.score}</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">dari 100</span>
                </div>
                <div className="h-10 w-px bg-slate-300" />
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-black block">Predikat Kelulusan</span>
                  <span className={`text-sm sm:text-base font-black ${predicate.color}`}>
                    {predicate.label}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    Durasi: {Math.floor(result.timeSpentSeconds / 60)}m {result.timeSpentSeconds % 60}d
                  </span>
                </div>
              </div>
            </div>

            {/* Footer: Date & Signatures */}
            <div className="pt-8 border-t border-slate-300 mt-6 grid grid-cols-2 gap-4 items-end">
              {/* QR Verification Seal */}
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white rounded-xl border border-slate-300 shadow-xs inline-block">
                    <QrCode className="w-12 h-12 text-slate-800" />
                  </div>
                  <div className="text-[9px] text-slate-500 leading-tight">
                    <span className="font-bold text-slate-700 block">Verifikasi Keabsahan:</span>
                    <span>Dokumen ini diterbitkan secara digital melalui Portal CAT KPPN Semarang I. Sah tanpa tanda tangan basah.</span>
                  </div>
                </div>
              </div>

              {/* Pejabat Tanda Tangan */}
              <div className="text-center space-y-1 ml-auto">
                <p className="text-xs text-slate-600">
                  Semarang, {examDate}
                </p>
                <p className="text-xs font-bold text-slate-700">
                  Kepala Seksi Manajemen Satker &amp; Kepatuhan Internal
                </p>
                <div className="h-14 flex items-center justify-center">
                  <span className="px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-50 text-emerald-800 text-[9px] font-black tracking-wider uppercase">
                    ✓ TERVERIFIKASI DIGITAL KPPN
                  </span>
                </div>
                <p className="text-xs font-black text-slate-900 underline decoration-slate-400">
                  TIM UJI KOMPETENSI KPPN 026
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  NIP. 198501012008121001
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
