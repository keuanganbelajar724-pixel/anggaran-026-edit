import React, { useState, useMemo, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  Award,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Zap,
  TrendingUp,
  Target,
  ArrowRight
} from 'lucide-react';
import { IKPAResult, SimulationProject } from '../../../models/ikpa';
import { round2 } from '../../../calculations/rounding';

interface SandboxSimulator7IndikatorProps {
  project: SimulationProject;
  onApplySimulatedValues?: (simulatedScores: Record<string, number>) => void;
  isDark?: boolean;
}

export const SandboxSimulator7Indikator: React.FC<SandboxSimulator7IndikatorProps> = ({
  project,
  onApplySimulatedValues,
  isDark = false
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Nilai awal dari output aktual project
  const actualOutput = project.output;

  const [simScores, setSimScores] = useState({
    revisiDIPA: actualOutput?.indicators.revisiDIPA.cappedValue ?? 0,
    deviasiHalIII: actualOutput?.indicators.deviasiHalIII.cappedValue ?? 0,
    penyerapan: actualOutput?.indicators.penyerapan.cappedValue ?? 0,
    belanjaKontraktual: actualOutput?.indicators.belanjaKontraktual.cappedValue ?? 0,
    penyelesaianTagihan: actualOutput?.indicators.penyelesaianTagihan.cappedValue ?? 0,
    pengelolaanUPTUP: actualOutput?.indicators.pengelolaanUPTUP.cappedValue ?? 0,
    capaianOutput: actualOutput?.indicators.capaianOutput.cappedValue ?? 0,
    dispensasiSPM: actualOutput?.dispensasiReduction ?? 0
  });

  // Sinkronisasi nilai simScores saat project berganti atau di-recalculate
  useEffect(() => {
    if (actualOutput?.indicators) {
      setSimScores({
        revisiDIPA: actualOutput.indicators.revisiDIPA?.cappedValue ?? 0,
        deviasiHalIII: actualOutput.indicators.deviasiHalIII?.cappedValue ?? 0,
        penyerapan: actualOutput.indicators.penyerapan?.cappedValue ?? 0,
        belanjaKontraktual: actualOutput.indicators.belanjaKontraktual?.cappedValue ?? 0,
        penyelesaianTagihan: actualOutput.indicators.penyelesaianTagihan?.cappedValue ?? 0,
        pengelolaanUPTUP: actualOutput.indicators.pengelolaanUPTUP?.cappedValue ?? 0,
        capaianOutput: actualOutput.indicators.capaianOutput?.cappedValue ?? 0,
        dispensasiSPM: actualOutput.dispensasiReduction ?? 0
      });
    }
  }, [project.id, actualOutput?.finalScore, actualOutput?.totalWeighted]);

  const weights = project.weights || {
    revisiDIPA: 10,
    deviasiHalIII: 15,
    penyerapan: 20,
    belanjaKontraktual: 10,
    penyelesaianTagihan: 10,
    pengelolaanUPTUP: 10,
    capaianOutput: 25
  };

  // Kalkulasi Live Simulasi Sesuai Formula Excel Interface
  const calcResult = useMemo(() => {
    const w1 = round2((simScores.revisiDIPA * weights.revisiDIPA) / 100);
    const w2 = round2((simScores.deviasiHalIII * weights.deviasiHalIII) / 100);
    const w3 = round2((simScores.penyerapan * weights.penyerapan) / 100);
    const w4 = round2((simScores.belanjaKontraktual * weights.belanjaKontraktual) / 100);
    const w5 = round2((simScores.penyelesaianTagihan * weights.penyelesaianTagihan) / 100);
    const w6 = round2((simScores.pengelolaanUPTUP * weights.pengelolaanUPTUP) / 100);
    const w7 = round2((simScores.capaianOutput * weights.capaianOutput) / 100);

    const totalWeighted = round2(w1 + w2 + w3 + w4 + w5 + w6 + w7);
    const totalWeights = weights.revisiDIPA + weights.deviasiHalIII + weights.penyerapan + weights.belanjaKontraktual + weights.penyelesaianTagihan + weights.pengelolaanUPTUP + weights.capaianOutput;
    const weightConversion = totalWeights / 100;

    const baseScore = weightConversion > 0 ? totalWeighted / weightConversion : totalWeighted;
    const finalScore = Math.min(100, Math.max(0, round2(baseScore - simScores.dispensasiSPM)));

    let predikat = 'KURANG';
    if (finalScore >= 95) predikat = 'SANGAT BAIK';
    else if (finalScore >= 89) predikat = 'BAIK';
    else if (finalScore >= 70) predikat = 'CUKUP';

    const actualFinal = actualOutput?.finalScore ?? 0;
    const delta = round2(finalScore - actualFinal);

    return {
      w1, w2, w3, w4, w5, w6, w7,
      totalWeighted,
      weightConversion,
      finalScore,
      predikat,
      delta
    };
  }, [simScores, weights, actualOutput]);

  const indicatorsList = [
    { key: 'revisiDIPA', label: '1. Revisi DIPA', weight: weights.revisiDIPA, weighted: calcResult.w1, color: 'text-indigo-600 dark:text-indigo-400', accent: 'accent-indigo-600', badge: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' },
    { key: 'deviasiHalIII', label: '2. Deviasi Halaman III DIPA', weight: weights.deviasiHalIII, weighted: calcResult.w2, color: 'text-sky-600 dark:text-sky-400', accent: 'accent-sky-600', badge: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300' },
    { key: 'penyerapan', label: '3. Penyerapan Anggaran', weight: weights.penyerapan, weighted: calcResult.w3, color: 'text-emerald-600 dark:text-emerald-400', accent: 'accent-emerald-600', badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' },
    { key: 'belanjaKontraktual', label: '4. Belanja Kontraktual', weight: weights.belanjaKontraktual, weighted: calcResult.w4, color: 'text-amber-600 dark:text-amber-400', accent: 'accent-amber-600', badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' },
    { key: 'penyelesaianTagihan', label: '5. Penyelesaian Tagihan', weight: weights.penyelesaianTagihan, weighted: calcResult.w5, color: 'text-violet-600 dark:text-violet-400', accent: 'accent-violet-600', badge: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300' },
    { key: 'pengelolaanUPTUP', label: '6. Pengelolaan UP & TUP', weight: weights.pengelolaanUPTUP, weighted: calcResult.w6, color: 'text-teal-600 dark:text-teal-400', accent: 'accent-teal-600', badge: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300' },
    { key: 'capaianOutput', label: '7. Capaian Output', weight: weights.capaianOutput, weighted: calcResult.w7, color: 'text-purple-600 dark:text-purple-400', accent: 'accent-purple-600', badge: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' }
  ];

  const handleCopyActualValues = () => {
    if (!actualOutput) return;
    setSimScores({
      revisiDIPA: actualOutput.indicators.revisiDIPA.cappedValue,
      deviasiHalIII: actualOutput.indicators.deviasiHalIII.cappedValue,
      penyerapan: actualOutput.indicators.penyerapan.cappedValue,
      belanjaKontraktual: actualOutput.indicators.belanjaKontraktual.cappedValue,
      penyelesaianTagihan: actualOutput.indicators.penyelesaianTagihan.cappedValue,
      pengelolaanUPTUP: actualOutput.indicators.pengelolaanUPTUP.cappedValue,
      capaianOutput: actualOutput.indicators.capaianOutput.cappedValue,
      dispensasiSPM: actualOutput.dispensasiReduction
    });
  };

  const handlePresetAll100 = () => {
    setSimScores({
      revisiDIPA: 100,
      deviasiHalIII: 100,
      penyerapan: 100,
      belanjaKontraktual: 100,
      penyelesaianTagihan: 100,
      pengelolaanUPTUP: 100,
      capaianOutput: 100,
      dispensasiSPM: 0
    });
  };

  const handlePresetZero = () => {
    setSimScores({
      revisiDIPA: 0,
      deviasiHalIII: 0,
      penyerapan: 0,
      belanjaKontraktual: 0,
      penyelesaianTagihan: 0,
      pengelolaanUPTUP: 0,
      capaianOutput: 0,
      dispensasiSPM: 0
    });
  };

  return (
    <div
      className={`rounded-2xl border transition-all shadow-xs overflow-hidden ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors border-b ${
          isDark ? 'border-slate-800 hover:bg-slate-800/40' : 'border-slate-100 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight">
                Sandbox & Simulator Mandiri 7 Indikator IKPA
              </span>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Interactive What-If Matrix
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Geser nilai indikator secara bebas untuk menguji target nilai dan menyusun strategi peningkatan IKPA tanpa mengubah data riil
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block">Hasil Simulasi Langsung:</span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-black text-lg text-purple-600 dark:text-purple-400">
                {calcResult.finalScore.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-500">/ 100</span>
              <span className={`text-xs font-bold ml-1.5 ${
                calcResult.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                ({calcResult.delta >= 0 ? `+${calcResult.delta.toFixed(2)}` : calcResult.delta.toFixed(2)})
              </span>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <Sliders className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-5 space-y-6">
          {/* Quick Action Presets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 mr-1">
                Aksi Cepat:
              </span>
              <button
                onClick={handleCopyActualValues}
                type="button"
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition-all shadow-xs"
              >
                <Copy className="h-3.5 w-3.5 text-blue-500" />
                Salin Nilai Riil Saat Ini
              </button>
              <button
                onClick={handlePresetAll100}
                type="button"
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-all shadow-xs"
              >
                <Target className="h-3.5 w-3.5 text-emerald-600" />
                Target Nilai 100 Sempurna
              </button>
              <button
                onClick={handlePresetZero}
                type="button"
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all shadow-xs"
                title="Geser semua slider simulasi ke 0 (Hanya untuk simulasi What-If, tidak mengubah data proyek riil)"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Set Slider ke 0
              </button>
            </div>

            {/* Projected Score Summary Banner */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Predikat Kinerja:</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  {calcResult.predikat}
                </span>
              </div>
              <div className="text-right border-l pl-4 border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 block">Total Tertimbang (N6):</span>
                <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
                  {calcResult.totalWeighted.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* 7 Indicators Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {indicatorsList.map((ind) => {
              const currentVal = (simScores as any)[ind.key] ?? 100;
              return (
                <div
                  key={ind.key}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isDark ? 'bg-slate-800/40 border-slate-700/70' : 'bg-slate-50/70 border-slate-200/80 hover:bg-white hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${ind.color}`}>
                        {ind.label}
                      </span>
                      <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${ind.badge}`}>
                        Bobot {ind.weight}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={currentVal}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                          setSimScores(prev => ({ ...prev, [ind.key]: val }));
                        }}
                        className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-right rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                      />
                      <span className="text-[11px] text-slate-400 font-bold">/ 100</span>
                    </div>
                  </div>

                  {/* Slider Control */}
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={currentVal}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setSimScores(prev => ({ ...prev, [ind.key]: val }));
                      }}
                      className={`w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer ${ind.accent}`}
                    />
                    <span className="text-xs font-mono font-bold w-12 text-right text-slate-700 dark:text-slate-300">
                      {ind.weighted.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                    <span>Skor: {currentVal.toFixed(1)}</span>
                    <span>Tertimbang: ({currentVal.toFixed(1)} × {ind.weight}%) = {ind.weighted.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}

            {/* Special Pengurang: Dispensasi SPM */}
            <div className={`p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 ${
              isDark ? 'bg-rose-950/20 text-rose-200' : 'bg-rose-50/50 text-rose-900'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    Pengurang Dispensasi SPM (TW IV)
                  </span>
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                    Penalti Pengurang
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    value={simScores.dispensasiSPM}
                    onChange={(e) => {
                      const val = Math.min(5, Math.max(0, parseFloat(e.target.value) || 0));
                      setSimScores(prev => ({ ...prev, dispensasiSPM: val }));
                    }}
                    className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-right rounded border border-rose-300 dark:border-rose-700 dark:bg-slate-800 text-rose-600"
                  />
                  <span className="text-[11px] text-rose-400 font-bold">poin</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={simScores.dispensasiSPM}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setSimScores(prev => ({ ...prev, dispensasiSPM: val }));
                  }}
                  className="w-full h-1.5 bg-rose-200 dark:bg-rose-900/60 rounded-lg appearance-none cursor-pointer accent-rose-600"
                />
                <span className="text-xs font-mono font-bold w-12 text-right text-rose-600 dark:text-rose-400">
                  -{simScores.dispensasiSPM.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-rose-500/80 mt-1.5">
                <span>0 poin = Tidak ada dispensasi</span>
                <span>Maksimal penalti = 5.00 poin</span>
              </div>
            </div>
          </div>

          {/* Footer Projection & What-If Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">Formula Nilai Akhir:</span>
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-200">
                ROUND({calcResult.totalWeighted.toFixed(2)} / {(calcResult.weightConversion).toFixed(2)}, 2) - {simScores.dispensasiSPM.toFixed(2)} = <strong className="text-purple-600 dark:text-purple-400">{calcResult.finalScore.toFixed(2)}</strong>
              </span>
            </div>

            {onApplySimulatedValues && (
              <button
                onClick={() => onApplySimulatedValues(simScores)}
                type="button"
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <span>Terapkan Nilai Simulasi ke Seluruh Modul</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
