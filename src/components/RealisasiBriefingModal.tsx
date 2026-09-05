import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Send,
  Download
} from 'lucide-react';
import { 
  EvaluatedSatkerRealisasi, 
  SummaryRealisasiTriwulan, 
  TriwulanKey, 
  generateBriefingText, 
  formatRupiah, 
  formatRupiahCompact 
} from '../utils/targetTriwulanProcessor';

interface RealisasiBriefingModalProps {
  evaluatedList: EvaluatedSatkerRealisasi[];
  summary: SummaryRealisasiTriwulan;
  triwulan: TriwulanKey;
  posisiWaktu: string;
  onFilterPrioritas1: () => void;
  onClose: () => void;
  isDark?: boolean;
}

export const RealisasiBriefingModal: React.FC<RealisasiBriefingModalProps> = ({
  evaluatedList,
  summary,
  triwulan,
  posisiWaktu,
  onFilterPrioritas1,
  onClose,
  isDark = false
}) => {
  const [copied, setCopied] = useState(false);

  const memoText = React.useMemo(() => {
    return generateBriefingText(evaluatedList, summary, triwulan, posisiWaktu);
  }, [evaluatedList, summary, triwulan, posisiWaktu]);

  const handleCopy = () => {
    navigator.clipboard.writeText(memoText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const kritisSatkers = evaluatedList.filter(s => s.priorityRisk === 'PRIORITAS_1_KRITIS');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Memo Eksekutif & Bahan Briefing Pimpinan</h3>
              <p className="text-[11px] text-slate-500">Format teks ringkasan resmi siap salin ke WhatsApp / Rapat Pembinaan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Quick Action Alert */}
          {kritisSatkers.length > 0 && (
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-900 dark:text-rose-200 text-xs">
                    Terdeteksi {kritisSatkers.length} Satker Kritis Pagu Besar
                  </h4>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300">
                    Satker dengan pagu besar yang belum mencapai target triwulan dan berkontribusi signifikan pada gap realisasi KPPN.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onFilterPrioritas1();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shrink-0 shadow-sm transition-colors"
              >
                Filter Satker Kritis
              </button>
            </div>
          )}

          {/* Text Area / Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Pratinjau Teks Memo:
              </label>
              <span className="text-[11px] text-slate-400">
                Kompatibel dengan format tebal WhatsApp (*)
              </span>
            </div>
            <textarea
              readOnly
              value={memoText}
              rows={13}
              className={`w-full p-3.5 rounded-xl font-mono text-xs border outline-none leading-relaxed resize-none ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 text-slate-200' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Posisi data: {posisiWaktu}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                copied 
                  ? 'bg-emerald-700 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Tersalin ke Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Salin Teks Memo WhatsApp
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
