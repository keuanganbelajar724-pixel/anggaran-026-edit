import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  TrendingUp,
  Award,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Copy,
  Zap
} from 'lucide-react';
import { SimulationProject, IKPAResult } from '../../../models/ikpa';
import { calculateIKPA } from '../../../calculations/ikpa';

interface SkenarioTabProps {
  baselineProject: SimulationProject;
  currentProject: SimulationProject;
  onApplyScenario: (sc: SimulationProject) => void;
  isDark?: boolean;
}

export const SkenarioTab: React.FC<SkenarioTabProps> = ({
  baselineProject,
  currentProject,
  onApplyScenario,
  isDark = false
}) => {
  // Generate 3 scenarios from current project:
  // 1. Baseline
  const baselineResult = calculateIKPA(baselineProject);

  // 2. Realistic Target:
  // Improve deviasi hal III by 50%, increase timely reporting, reduce dispensasi to 0
  const realisticProject: SimulationProject = {
    ...currentProject,
    name: 'Skenario 2: Target Realistis',
    dispensasiSPM: {
      jumlahSPMTriwulanIV: currentProject.dispensasiSPM?.jumlahSPMTriwulanIV || 200,
      jumlahDispensasiSPM: 0
    },
    capaianOutputKetepatan: currentProject.capaianOutputKetepatan.map(k => ({
      ...k,
      ketepatan: 'Tepat Waktu' as const
    }))
  };
  const realisticResult = calculateIKPA(realisticProject);

  // 3. Optimistic (Maximal) Target:
  // 100% on early contracts, 0 dispensasi, 100% on timely reporting, penyerapan boosted
  const optimisticProject: SimulationProject = {
    ...currentProject,
    name: 'Skenario 3: Target Optimis (Maksimal)',
    dispensasiSPM: {
      jumlahSPMTriwulanIV: currentProject.dispensasiSPM?.jumlahSPMTriwulanIV || 200,
      jumlahDispensasiSPM: 0
    },
    capaianOutputKetepatan: currentProject.capaianOutputKetepatan.map(k => ({
      ...k,
      ketepatan: 'Tepat Waktu' as const
    })),
    belanjaKontraktual: currentProject.belanjaKontraktual.map(b => ({
      ...b,
      isEarlyContract: true,
      tanggalMasuk: b.tanggalKontrak
    }))
  };
  const optimisticResult = calculateIKPA(optimisticProject);

  const currentResult = currentProject.output || calculateIKPA(currentProject);

  const indicatorsList: { key: keyof typeof currentResult.indicators; name: string; weight: number }[] = [
    { key: 'revisiDIPA', name: 'Revisi DIPA', weight: 10 },
    { key: 'deviasiHalIII', name: 'Deviasi Hal III DIPA', weight: 15 },
    { key: 'penyerapan', name: 'Penyerapan Anggaran', weight: 20 },
    { key: 'belanjaKontraktual', name: 'Belanja Kontraktual', weight: 10 },
    { key: 'penyelesaianTagihan', name: 'Penyelesaian Tagihan', weight: 10 },
    { key: 'pengelolaanUPTUP', name: 'Pengelolaan UP/TUP', weight: 10 },
    { key: 'capaianOutput', name: 'Capaian Output', weight: 25 },
  ];

  // Calculate gaps for automated recommendations
  const recommendations = [
    {
      indicator: 'Capaian Output',
      priority: 'Tinggi',
      gap: (100 - currentResult.indicators.capaianOutput.cappedValue).toFixed(2),
      potentialIKPA: ((100 - currentResult.indicators.capaianOutput.cappedValue) * 0.25).toFixed(2),
      action: 'Pastikan seluruh operator satker mengonfirmasi data Capaian Output KRO/RO sebelum tanggal 15 setiap bulannya di SAKTI.'
    },
    {
      indicator: 'Dispensasi SPM TW IV',
      priority: currentResult.dispensasiReduction > 0 ? 'Sangat Tinggi' : 'Rendah',
      gap: currentResult.dispensasiReduction.toFixed(2),
      potentialIKPA: currentResult.dispensasiReduction.toFixed(2),
      action: currentResult.dispensasiReduction > 0 
        ? 'Hindari pengajuan SPM di luar batas waktu penerbitan SPM akhir tahun anggaran untuk mengembalikan penalti pengurang.'
        : 'Pertahankan nihil dispensasi SPM pada akhir tahun anggaran.'
    },
    {
      indicator: 'Deviasi Halaman III DIPA',
      priority: currentResult.indicators.deviasiHalIII.cappedValue < 90 ? 'Tinggi' : 'Sedang',
      gap: (100 - currentResult.indicators.deviasiHalIII.cappedValue).toFixed(2),
      potentialIKPA: ((100 - currentResult.indicators.deviasiHalIII.cappedValue) * 0.15).toFixed(2),
      action: 'Lakukan pemutakhiran RPD Halaman III DIPA pada batas akhir pemutakhiran triwulan agar deviasi bulanan tetap di bawah 5%.'
    },
    {
      indicator: 'Belanja Kontraktual',
      priority: currentResult.indicators.belanjaKontraktual.cappedValue < 95 ? 'Sedang' : 'Rendah',
      gap: (100 - currentResult.indicators.belanjaKontraktual.cappedValue).toFixed(2),
      potentialIKPA: ((100 - currentResult.indicators.belanjaKontraktual.cappedValue) * 0.10).toFixed(2),
      action: 'Daftarkan kontrak/SPK ke KPPN maksimal 5 hari kerja setelah penandatanganan dan dorong percepatan belanja modal (53).'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className={`rounded-2xl border p-5 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <Layers className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Perbandingan Skenario Simulasi Kinerja (Side-by-Side)
          </h3>
        </div>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Bandingkan hasil capaian kondisi saat ini (Baseline) dengan Skenario Target Realistis dan Skenario Optimis Maksimal.
        </p>
      </div>

      {/* Side-by-Side Comparison Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-semibold ${
              isDark ? 'bg-slate-800/60 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              <tr>
                <th className="px-4 py-3">Indikator IKPA</th>
                <th className="px-3 py-3 text-center">Bobot</th>
                <th className="px-4 py-3 text-right">
                  <span className="block text-slate-500 text-[10px]">Kondisi Saat Ini</span>
                  Skenario 1 (Aktif)
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="block text-emerald-600 text-[10px]">Target Realistis</span>
                  Skenario 2
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="block text-blue-600 text-[10px]">Target Optimis</span>
                  Skenario 3 (Maksimal)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
              {indicatorsList.map(ind => {
                const cVal = currentResult.indicators[ind.key].cappedValue;
                const rVal = realisticResult.indicators[ind.key].cappedValue;
                const oVal = optimisticResult.indicators[ind.key].cappedValue;

                return (
                  <tr key={ind.key} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'}>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                      {ind.name}
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-500 font-sans">
                      {ind.weight}%
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                      {cVal.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {rVal.toFixed(2)}
                      {rVal > cVal && (
                        <span className="ml-1 text-[10px] text-emerald-500 font-normal">
                          (+{(rVal - cVal).toFixed(2)})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-blue-600 dark:text-blue-400">
                      {oVal.toFixed(2)}
                      {oVal > cVal && (
                        <span className="ml-1 text-[10px] text-blue-500 font-normal">
                          (+{(oVal - cVal).toFixed(2)})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Dispensasi SPM row */}
              <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                <td className="px-4 py-2.5 font-sans font-medium text-rose-600 dark:text-rose-400">
                  Pengurang Dispensasi SPM
                </td>
                <td className="px-3 py-2.5 text-center text-slate-500 font-sans">-</td>
                <td className="px-4 py-2.5 text-right font-bold text-rose-600 dark:text-rose-400">
                  -{currentResult.dispensasiReduction.toFixed(2)}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  -{realisticResult.dispensasiReduction.toFixed(2)}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-blue-600 dark:text-blue-400">
                  -{optimisticResult.dispensasiReduction.toFixed(2)}
                </td>
              </tr>

              {/* Final Score Row */}
              <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-emerald-50/40 dark:bg-emerald-950/20 text-sm">
                <td className="px-4 py-3.5 font-sans font-black text-slate-900 dark:text-slate-100">
                  NILAI AKHIR IKPA
                </td>
                <td className="px-3 py-3.5 text-center font-sans font-bold">100%</td>
                <td className="px-4 py-3.5 text-right font-black text-slate-900 dark:text-slate-100 text-base">
                  {currentResult.finalScore.toFixed(2)}
                  <span className="block text-[10px] font-sans font-semibold text-slate-500">
                    {currentResult.predikat}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 text-base">
                  {realisticResult.finalScore.toFixed(2)}
                  <span className="block text-[10px] font-sans font-semibold text-emerald-600">
                    {realisticResult.predikat} (+{(realisticResult.finalScore - currentResult.finalScore).toFixed(2)})
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right font-black text-blue-600 dark:text-blue-400 text-base">
                  {optimisticResult.finalScore.toFixed(2)}
                  <span className="block text-[10px] font-sans font-semibold text-blue-600">
                    {optimisticResult.predikat} (+{(optimisticResult.finalScore - currentResult.finalScore).toFixed(2)})
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons for Scenarios */}
        <div className="flex flex-wrap items-center justify-end gap-3 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => onApplyScenario(realisticProject)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" /> Terapkan Skenario Realistis ke Proyek
          </button>
          <button
            onClick={() => onApplyScenario(optimisticProject)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            <TrendingUp className="h-3.5 w-3.5" /> Terapkan Skenario Optimis ke Proyek
          </button>
        </div>
      </div>

      {/* Automated Action Recommendations */}
      <div className={`rounded-2xl border p-5 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h4 className="font-bold text-sm">Rekomendasi Aksi Otomatis Berdasarkan Gap Terbesar</h4>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-3.5 border ${
                isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {rec.indicator}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    rec.priority === 'Sangat Tinggi'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : rec.priority === 'Tinggi'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    Prioritas: {rec.priority}
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {rec.action}
                </p>
              </div>

              <div className="sm:text-right shrink-0">
                <span className="text-[10px] text-slate-400 uppercase block font-medium">Potensi Kenaikan IKPA</span>
                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  +{rec.potentialIKPA} Poin
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
