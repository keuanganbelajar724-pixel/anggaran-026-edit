import React from 'react';
import { X, Calculator, HelpCircle, Check, Copy, ExternalLink } from 'lucide-react';
import { CalculationDetail } from '../../models/ikpa';

interface FormulaInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  indicatorCode?: string;
  excelCell?: string;
  excelFormula?: string;
  scoreFormatted: string;
  details: CalculationDetail[];
  isDark?: boolean;
}

export const FormulaInspectorModal: React.FC<FormulaInspectorModalProps> = ({
  isOpen,
  onClose,
  title,
  indicatorCode,
  excelCell,
  excelFormula,
  scoreFormatted,
  details,
  isDark = false
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const copyFormula = () => {
    if (excelFormula) {
      navigator.clipboard.writeText(excelFormula);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div 
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl transition-all ${
          isDark 
            ? 'border-slate-800 bg-slate-900 text-slate-100' 
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 ${
          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">{title}</h3>
                {excelCell && (
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-mono font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Sel: {excelCell}
                  </span>
                )}
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Audit Trail & Formula Inspector (Excel 2026 Compatible)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-2 transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
          {/* Result Banner */}
          <div className={`flex items-center justify-between rounded-xl p-4 border ${
            isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-emerald-50/60 border-emerald-200/80'
          }`}>
            <div>
              <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Hasil Numerik Terhitung
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {scoreFormatted}
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" /> Presisi Excel (round2)
            </span>
          </div>

          {/* Formula Box */}
          {excelFormula && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Formula Asli Workbook Excel:
                </label>
                <button
                  onClick={copyFormula}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Tersalin' : 'Salin Formula'}
                </button>
              </div>
              <div className={`rounded-xl p-3 font-mono text-xs overflow-x-auto border ${
                isDark ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-900 border-slate-800 text-emerald-300'
              }`}>
                <code>{excelFormula}</code>
              </div>
            </div>
          )}

          {/* Step-by-Step Audit Trail */}
          <div className="space-y-2">
            <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Langkah Substitusi & Kalkulasi:
            </h4>
            <div className="space-y-2">
              {details && details.length > 0 ? (
                details.map((d, idx) => (
                  <div 
                    key={idx}
                    className={`rounded-xl border p-3 text-xs space-y-1 ${
                      isDark ? 'border-slate-800 bg-slate-800/40' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                        {idx + 1}. {d.step}
                      </span>
                      {d.excelCell && (
                        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                          {d.excelCell}
                        </span>
                      )}
                    </div>
                    {d.formulaHuman && (
                      <p className={`font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {d.formulaHuman}
                      </p>
                    )}
                    {d.value !== undefined && (
                      <div className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        = {typeof d.value === 'number' ? d.value.toLocaleString('id-ID', { maximumFractionDigits: 4 }) : String(d.value)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className={`rounded-xl border p-4 text-center text-xs ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                  Rincian kalkulasi detail tersedia otomatis saat simulasi dijalankan.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end border-t px-6 py-3.5 ${
          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'
        }`}>
          <button
            onClick={onClose}
            className={`rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition-colors ${
              isDark 
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' 
                : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
