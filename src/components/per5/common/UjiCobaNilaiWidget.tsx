import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Award,
  Zap,
  ArrowRight
} from 'lucide-react';
import { round2 } from '../../../calculations/rounding';

interface UjiCobaNilaiWidgetProps {
  indicatorName: string;
  weight: number;
  currentScore: number;
  currentTotalIKPA: number;
  onApplySimulatedScore?: (newScore: number) => void;
  colorTheme?: 'indigo' | 'sky' | 'emerald' | 'amber' | 'violet' | 'teal' | 'purple' | 'rose';
  isDark?: boolean;
}

export const UjiCobaNilaiWidget: React.FC<UjiCobaNilaiWidgetProps> = ({
  indicatorName,
  weight,
  currentScore,
  currentTotalIKPA,
  onApplySimulatedScore,
  colorTheme = 'indigo',
  isDark = false
}) => {
  const [testScore, setTestScore] = useState<number>(Math.round(currentScore * 100) / 100);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Perhitungan dampak simulasi
  const currentWeighted = round2((currentScore * weight) / 100);
  const testWeighted = round2((testScore * weight) / 100);
  const deltaWeighted = round2(testWeighted - currentWeighted);

  // Proyeksi total IKPA baru
  const projectedTotalIKPA = Math.min(100, Math.max(0, round2(currentTotalIKPA + deltaWeighted)));

  const getPredikat = (score: number) => {
    if (score >= 95) return { label: 'SANGAT BAIK', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 89) return { label: 'BAIK', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' };
    if (score >= 70) return { label: 'CUKUP', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { label: 'KURANG', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
  };

  const currentPredikat = getPredikat(currentTotalIKPA);
  const projectedPredikat = getPredikat(projectedTotalIKPA);

  const presets = [0, 50, 75, 89, 95, 100];

  return (
    <div
      className={`rounded-2xl border transition-all shadow-xs overflow-hidden ${
        isDark
          ? 'bg-slate-900/80 border-slate-800 text-slate-100'
          : 'bg-gradient-to-br from-white to-blue-50/20 border-slate-200 text-slate-900'
      }`}
    >
      {/* Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`px-5 py-3.5 flex items-center justify-between cursor-pointer select-none transition-colors border-b ${
          isDark ? 'border-slate-800 hover:bg-slate-800/40' : 'border-slate-100 hover:bg-slate-50/80'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                Simulasi Mandiri & Uji Coba Cepat: {indicatorName}
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Bobot {weight}%
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Uji coba skor alternatif dan lihat dampaknya secara langsung terhadap nilai akhir IKPA Satker
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block">Skor Riil Saat Ini</span>
            <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">
              {currentScore.toFixed(2)}
            </span>
          </div>
          <button
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-5 space-y-5">
          {/* Controls: Slider & Quick Presets */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Tentukan Nilai Uji Coba (0 - 100):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={testScore}
                    onChange={e => setTestScore(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-20 text-right px-2 py-1 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-blue-600 dark:text-blue-400"
                  />
                  <span className="text-xs font-bold text-slate-400">/ 100</span>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={testScore}
                onChange={e => setTestScore(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />

              {/* Preset Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                <span className="text-[11px] font-medium text-slate-400 mr-1">Preset:</span>
                {presets.map(p => (
                  <button
                    key={p}
                    onClick={() => setTestScore(p)}
                    type="button"
                    className={`px-2 py-0.5 rounded-md text-xs font-mono font-medium transition-all ${
                      testScore === p
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setTestScore(Math.round(currentScore * 100) / 100)}
                  type="button"
                  className="px-2 py-0.5 rounded-md text-xs font-medium text-slate-500 hover:text-blue-600 ml-auto inline-flex items-center gap-1"
                  title="Kembalikan ke nilai riil"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
            </div>

            {/* Impact Projection Matrix */}
            <div className={`md:col-span-5 p-4 rounded-xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-white border-slate-200/90 shadow-xs'
            }`}>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  Dampak Terhadap IKPA Satker
                </span>
                <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                  deltaWeighted >= 0
                    ? 'text-emerald-600 bg-emerald-500/10'
                    : 'text-rose-600 bg-rose-500/10'
                }`}>
                  {deltaWeighted >= 0 ? `+${deltaWeighted.toFixed(2)}` : deltaWeighted.toFixed(2)} poin
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Tertimbang Uji Coba:</span>
                  <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                    {testWeighted.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    ({testScore} × {weight}%)
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Proyeksi Total IKPA:</span>
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                    {projectedTotalIKPA.toFixed(2)}
                  </span>
                  <span className={`text-[10px] font-bold block mt-0.5 ${projectedPredikat.color}`}>
                    {projectedPredikat.label}
                  </span>
                </div>
              </div>

              {onApplySimulatedScore && (
                <button
                  onClick={() => onApplySimulatedScore(testScore)}
                  type="button"
                  className="w-full mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>Terapkan Nilai Simulasi</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
