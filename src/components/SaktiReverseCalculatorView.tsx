import React, { useState } from 'react';
import { DiagnostikCaputResult, DiagnostikCaputROItem } from '../types';
import { 
  Calculator, 
  Sparkles, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sliders, 
  ShieldCheck, 
  Wand2, 
  RotateCcw,
  Zap
} from 'lucide-react';

interface SaktiReverseCalculatorProps {
  data: DiagnostikCaputResult;
  onApplyOptimizedValues?: (updatedItems: DiagnostikCaputROItem[]) => void;
  onOpenSimulator: (ro: DiagnostikCaputROItem) => void;
  isDark?: boolean;
}

export const SaktiReverseCalculatorView: React.FC<SaktiReverseCalculatorProps> = ({
  data,
  onApplyOptimizedValues,
  onOpenSimulator,
  isDark = false
}) => {
  const [targetIKPAScore, setTargetIKPAScore] = useState<number>(100);
  const [avoidValidasi08, setAvoidValidasi08] = useState<boolean>(true); // GAP <= 20%
  const [appliedNotice, setAppliedNotice] = useState<boolean>(false);

  const totalRo = data.items.length;
  if (totalRo === 0) return null;

  // Calculate Reverse Optimization for each RO
  const optimizedItems = data.items.map(ro => {
    let optimalPcro = ro.realisasiProgres;
    let optimalRvro = ro.realisasiVolume;
    let optimalRefCode = ro.rekomendasiRefCode || ro.kodeRefOriginal || '01';
    let optimalRefName = ro.rekomendasiRefName || 'Tahapan Pelaksanaan Belum Selesai';

    // Condition 1: Target Z Calculation
    // Z = min(100, (PCRO / TPCRO) * 100)
    // To achieve targetIKPAScore: PCRO >= (targetIKPAScore / 100) * TPCRO
    const minPcroForZ = (targetIKPAScore / 100) * ro.targetProgres;
    
    // Condition 2: Avoid Validasi 08 (GAP Penyerapan vs Fisik > 20%)
    // PPA - PCRO <= 20% -> PCRO >= PPA - 20%
    const minPcroForVal08 = avoidValidasi08 ? Math.max(0, ro.realisasiAnggaran - 20) : 0;

    // Minimum optimal PCRO required
    optimalPcro = Math.min(100, Math.max(ro.realisasiProgres, minPcroForZ, minPcroForVal08));
    optimalPcro = Number(optimalPcro.toFixed(1));

    // If PCRO reaches 100%, check RVRO
    if (optimalPcro >= 100 && optimalRvro === 0) {
      // If waiting for BAST, suggest RVRO = TVRO or keep 0 with Ref 01
      optimalRefCode = '01';
      optimalRefName = 'Tahapan Pelaksanaan Selesai / Menunggu BAST';
    } else if (optimalPcro >= ro.targetProgres && ro.realisasiAnggaran <= optimalPcro + 20) {
      optimalRefCode = '00';
      optimalRefName = 'Normal / Sesuai Rencana';
    }

    // Recalculate projected Z with optimal values
    let projectedZ = 100;
    if (ro.targetProgres > 0) {
      projectedZ = Math.min(100, (optimalPcro / ro.targetProgres) * 100);
    }

    const pcroDelta = Number((optimalPcro - ro.realisasiProgres).toFixed(1));

    return {
      ...ro,
      optimalPcro,
      optimalRvro,
      optimalRefCode,
      optimalRefName,
      projectedZ: Number(projectedZ.toFixed(2)),
      pcroDelta,
      needsAdjustment: pcroDelta > 0 || ro.nilaiKomponenRo < targetIKPAScore
    };
  });

  const adjustedCount = optimizedItems.filter(it => it.needsAdjustment).length;
  const currentAvgScore = data.summary.currentScoreCaput;
  const projectedAvgScore = optimizedItems.reduce((acc, it) => acc + it.projectedZ, 0) / totalRo;

  const handleApplyAll = () => {
    if (onApplyOptimizedValues) {
      const updatedList: DiagnostikCaputROItem[] = optimizedItems.map(it => ({
        ...it,
        realisasiProgres: it.optimalPcro,
        realisasiVolume: it.optimalRvro,
        nilaiKomponenRo: it.projectedZ,
        rekomendasiRefCode: it.optimalRefCode,
        rekomendasiRefName: it.optimalRefName,
        diagnosaSeverity: it.projectedZ >= 95 ? 'OPTIMAL' : it.projectedZ >= 80 ? 'SEDANG' : 'KRITIS',
        validasiSaktiCode: it.optimalRefCode === '00' ? '00' : '02',
        validasiSaktiStatus: it.optimalRefCode === '00' ? 'Lolos Validasi' : 'Early Warning (Ref Ditentukan)'
      }));

      onApplyOptimizedValues(updatedList);
      setAppliedNotice(true);
      setTimeout(() => setAppliedNotice(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${
        isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      } space-y-4`}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
          <Wand2 className="w-3.5 h-3.5" />
          <span>Reverse-Engineered Optimizer &bull; Kalkulator Target Minimum PCRO SAKTI</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Hitung Mundur Target Realisasi Fisik (PCRO) &amp; Volume Output
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed mt-1">
              Menentukan batas minimal realisasi fisik (PCRO) yang harus diakui dan diinput oleh PPK pada bulan berjalan agar <strong>Nilai Kolom Z mencapai target</strong> serta <strong>bebas dari pencekalan Validasi SAKTI 08</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onApplyOptimizedValues && (
              <button
                onClick={handleApplyAll}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Terapkan Nilai Rekomendasi ({adjustedCount} RO)</span>
              </button>
            )}
          </div>
        </div>

        {appliedNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Berhasil menerapkan nilai rekomendasi fisik optimal ke seluruh dataset aktif! Rata-rata skor kini telah diperbarui.</span>
          </div>
        )}

        {/* Dynamic Sliders & Constraints */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        } grid grid-cols-1 md:grid-cols-2 gap-5`}>
          <div>
            <div className="flex items-center justify-between mb-2 text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-500" />
                <span>Target Nilai IKPA Kolom Z Satker:</span>
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">
                {targetIKPAScore} / 100
              </span>
            </div>
            <input
              type="range"
              min="70"
              max="100"
              step="1"
              value={targetIKPAScore}
              onChange={(e) => setTargetIKPAScore(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>70 (Cukup)</span>
              <span>85 (Baik)</span>
              <span>100 (Maksimal Sempurna)</span>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={avoidValidasi08}
                onChange={(e) => setAvoidValidasi08(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Kunci Batas Selisih Belanja (Bebas Validasi 08: GAP Penyerapan vs Fisik ≤ 20%)</span>
            </label>
            <p className="text-[11px] text-slate-500 mt-1 pl-6">
              Otomatis menyesuaikan PCRO agar tidak tertinggal lebih dari 20% dari persentase penyerapan anggaran (PPA).
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Skor IKPA Saat Ini
          </span>
          <div className="my-2">
            <div className="text-3xl font-black text-slate-700 dark:text-slate-300">
              {currentAvgScore.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-500">
              Rata-rata {totalRo} Rincian Output
            </span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800`}>
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
            Proyeksi Nilai Setelah Optimalisasi
          </span>
          <div className="my-2">
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {projectedAvgScore.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
              Kenaikan: +{(projectedAvgScore - currentAvgScore).toFixed(2)} Poin
            </span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Output yang Membutuhkan Penyesuaian
          </span>
          <div className="my-2">
            <div className="text-3xl font-black text-indigo-600 dark:text-cyan-400">
              {adjustedCount} <span className="text-sm font-semibold text-slate-400">/ {totalRo} RO</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Perlu pengakuan progres fisik tambahan
            </span>
          </div>
        </div>
      </div>

      {/* Reverse Optimization Matrix Table */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      } space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Matriks Kebutuhan Minimal Fisik (PCRO) per Rincian Output
            </h3>
            <p className="text-xs text-slate-500">
              Rekomendasi input fisik optimal untuk operator dan PPK saat mengisi data SAKTI.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className={`text-[11px] font-bold uppercase tracking-wider ${
              isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'
            }`}>
              <tr>
                <th className="p-3 rounded-l-xl">Kode RO</th>
                <th className="p-3">Nama Rincian Output</th>
                <th className="p-3 text-center">TPCRO (Target)</th>
                <th className="p-3 text-center">PPA (Belanja)</th>
                <th className="p-3 text-center">PCRO Eksisting</th>
                <th className="p-3 text-center font-bold">PCRO Minimal SAKTI</th>
                <th className="p-3 text-center">Rekomendasi Ref</th>
                <th className="p-3 text-right rounded-r-xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-current/5">
              {optimizedItems.map(ro => (
                <tr key={ro.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="p-3 font-mono font-bold text-indigo-600 dark:text-cyan-400 whitespace-nowrap">
                    {ro.kodeRo}
                  </td>
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                    {ro.namaRo}
                  </td>
                  <td className="p-3 text-center font-mono">
                    {ro.targetProgres.toFixed(1)}%
                  </td>
                  <td className="p-3 text-center font-mono">
                    {ro.realisasiAnggaran.toFixed(1)}%
                  </td>
                  <td className="p-3 text-center font-mono text-slate-500">
                    {ro.realisasiProgres.toFixed(1)}%
                  </td>
                  <td className="p-3 text-center font-mono">
                    <div className="flex items-center justify-center gap-1.5 font-bold">
                      <span className="text-slate-800 dark:text-slate-200">{ro.optimalPcro.toFixed(1)}%</span>
                      {ro.pcroDelta > 0 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-rose-600 text-white shadow-sm">
                          Kurang {ro.pcroDelta}%
                        </span>
                      ) : (
                        <span className="text-[10px] px-1 py-0.5 rounded font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Optimal
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300">
                      Kode {ro.optimalRefCode}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onOpenSimulator(ro)}
                      className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Buka Simulator
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
