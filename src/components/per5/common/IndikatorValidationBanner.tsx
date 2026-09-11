import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Check
} from 'lucide-react';
import { ValidationIssue } from '../../../utils/indikatorValidation';

interface IndikatorValidationBannerProps {
  issues: ValidationIssue[];
  indicatorName: string;
  isConfirmed?: boolean;
  onToggleConfirm?: (confirmed: boolean) => void;
  isDark?: boolean;
}

export const IndikatorValidationBanner: React.FC<IndikatorValidationBannerProps> = ({
  issues,
  indicatorName,
  isConfirmed = false,
  onToggleConfirm,
  isDark = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!issues || issues.length === 0) {
    return null;
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        errorCount > 0
          ? isDark
            ? 'bg-rose-950/20 border-rose-900/60 text-rose-200'
            : 'bg-rose-50/90 border-rose-200 text-rose-900'
          : isDark
            ? 'bg-amber-950/20 border-amber-900/60 text-amber-200'
            : 'bg-amber-50/90 border-amber-200 text-amber-900'
      }`}
    >
      {/* Banner Top Header */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              errorCount > 0
                ? isDark
                  ? 'bg-rose-900/40 text-rose-400'
                  : 'bg-rose-100 text-rose-600'
                : isDark
                  ? 'bg-amber-900/40 text-amber-400'
                  : 'bg-amber-100 text-amber-600'
            }`}
          >
            {errorCount > 0 ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold tracking-tight">
                {errorCount > 0
                  ? `Ditemukan ${errorCount} Kesalahan Isian Data (${indicatorName})`
                  : `Ditemukan ${warningCount} Peringatan Data (${indicatorName})`}
              </h4>

              {isConfirmed && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <Check className="h-3 w-3" />
                  Telah Dikonfirmasi Satker
                </span>
              )}
            </div>

            <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
              {errorCount > 0
                ? 'Terdapat isian data yang tidak sesuai kaidah (nilai negatif/melebihi batas). Mohon teliti dan perbaiki agar nilai perhitungan akurat.'
                : 'Data sangat banyak dan terdeteksi beberapa anomali/perlu perhatian. Silakan tinjau rincian di bawah ini.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {onToggleConfirm && (
            <button
              onClick={() => onToggleConfirm(!isConfirmed)}
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                isConfirmed
                  ? isDark
                    ? 'bg-emerald-900/40 border-emerald-700 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200'
                  : isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs'
              }`}
              title={
                isConfirmed
                  ? 'Batalkan tanda konfirmasi'
                  : 'Konfirmasi bahwa Anda telah memeriksa data ini dan memahami dampaknya'
              }
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{isConfirmed ? 'Batalkan Konfirmasi' : 'Konfirmasi Telah Diperiksa'}</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <span>{isExpanded ? 'Tutup Daftar' : `Lihat ${issues.length} Rincian`}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Issues Table */}
      {isExpanded && (
        <div
          className={`border-t px-4 py-3 text-xs overflow-x-auto ${
            isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200/80 bg-white/70'
          }`}
        >
          <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
            <span>Daftar Baris & Isian yang Memerlukan Perhatian:</span>
            <span className="text-[11px] font-normal text-slate-500">
              Total {issues.length} item • {errorCount} Salah • {warningCount} Peringatan
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {issues.map((item, idx) => (
              <div
                key={item.id || idx}
                className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-colors ${
                  item.severity === 'error'
                    ? isDark
                      ? 'bg-rose-950/30 border-rose-900/60 text-rose-200'
                      : 'bg-rose-50/90 border-rose-200/90 text-rose-900'
                    : isDark
                      ? 'bg-amber-950/30 border-amber-900/60 text-amber-200'
                      : 'bg-amber-50/90 border-amber-200/90 text-amber-900'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${
                        item.severity === 'error'
                          ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {item.severity === 'error' ? 'SALAH / ERROR' : 'PERINGATAN'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {item.rowIdentifier}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {item.fieldLabel}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed">{item.message}</p>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Saran:</span>
                    <span>{item.suggestion}</span>
                  </div>
                </div>

                <div className="shrink-0 md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-200/50 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                    Nilai Saat Ini
                  </div>
                  <div className="font-mono font-bold text-xs max-w-[200px] truncate">
                    {String(item.currentValue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
