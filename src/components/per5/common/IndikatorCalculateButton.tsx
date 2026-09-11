import React, { useState } from 'react';
import { Calculator, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { IndicatorResult } from '../../../models/ikpa';
import { ValidationIssue } from '../../../utils/indikatorValidation';
import { IndikatorCalculateModal } from './IndikatorCalculateModal';

interface IndikatorCalculateButtonProps {
  indicatorKey: string;
  indicatorName: string;
  weight: number;
  indicatorResult: IndicatorResult;
  validationIssues: ValidationIssue[];
  onForceRecalculate?: () => void;
  satkerName?: string;
  isDark?: boolean;
  className?: string;
}

export const IndikatorCalculateButton: React.FC<IndikatorCalculateButtonProps> = ({
  indicatorKey,
  indicatorName,
  weight,
  indicatorResult,
  validationIssues,
  onForceRecalculate,
  satkerName,
  isDark = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const errorCount = validationIssues.filter(i => i.severity === 'error').length;
  const warningCount = validationIssues.filter(i => i.severity === 'warning').length;

  const handleClick = () => {
    setIsCalculating(true);
    if (onForceRecalculate) {
      onForceRecalculate();
    }
    setTimeout(() => {
      setIsCalculating(false);
      setIsOpen(true);
    }, 280);
  };

  return (
    <>
      <button
        onClick={handleClick}
        type="button"
        disabled={isCalculating}
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs border ${
          isDark
            ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-500/50 shadow-emerald-950/40'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-emerald-200/50'
        } ${isCalculating ? 'animate-pulse opacity-80' : 'hover:scale-[1.02]'} ${className}`}
        title="Klik untuk menghitung ulang nilai indikator ini, melihat rincian langkah perhitungan, dan memeriksa validitas data"
      >
        <Calculator className={`h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
        <span>{isCalculating ? 'Mengkalkulasi...' : 'Perhitungkan Indikator Ini'}</span>

        {/* Mini status indicator badge */}
        <span className="rounded-lg bg-emerald-800/40 px-2 py-0.5 font-mono text-[11px] font-black border border-white/20">
          {(indicatorResult.cappedValue ?? 0).toFixed(2)}
        </span>

        {errorCount > 0 ? (
          <span
            className="flex h-2 w-2 rounded-full bg-rose-400 animate-ping"
            title={`${errorCount} kesalahan data terdeteksi`}
          />
        ) : warningCount > 0 ? (
          <span
            className="flex h-2 w-2 rounded-full bg-amber-400"
            title={`${warningCount} peringatan data`}
          />
        ) : null}
      </button>

      <IndikatorCalculateModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        indicatorKey={indicatorKey}
        indicatorName={indicatorName}
        weight={weight}
        indicatorResult={indicatorResult}
        validationIssues={validationIssues}
        satkerName={satkerName}
        isDark={isDark}
      />
    </>
  );
};
