import React, { useState } from 'react';
import { DiagnostikCaputResult, DiagnostikCaputROItem } from '../types';
import { 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Sliders, 
  Calendar, 
  Clock, 
  ArrowUpRight,
  ShieldCheck,
  Flame,
  HelpCircle,
  BarChart3
} from 'lucide-react';

interface SaktiTrajectoryForecastProps {
  data: DiagnostikCaputResult;
  onOpenSimulator: (ro: DiagnostikCaputROItem) => void;
  isDark?: boolean;
}

export const SaktiTrajectoryForecastView: React.FC<SaktiTrajectoryForecastProps> = ({
  data,
  onOpenSimulator,
  isDark = false
}) => {
  const [simulationScenario, setSimulationScenario] = useState<'STATUS_QUO' | 'MODERATE_ACCEL' | 'TARGET_MAXIMAL'>('STATUS_QUO');
  const [selectedMonthTarget, setSelectedMonthTarget] = useState<number>(12); // Default to December (Month 12)

  const totalRo = data.items.length;
  if (totalRo === 0) return null;

  // Extract current month number from periode (e.g., "Januari" -> 1, "Agustus" -> 8)
  const monthNames = [
    'januari', 'februari', 'maret', 'april', 'mei', 'juni', 
    'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
  ];
  const periodeLower = (data.summary.periode || '').toLowerCase();
  let currentMonthIndex = 7; // Default to August (month index 7 = August)
  monthNames.forEach((m, idx) => {
    if (periodeLower.includes(m)) {
      currentMonthIndex = idx;
    }
  });
  const currentMonthNum = currentMonthIndex + 1;
  const remainingMonths = Math.max(1, selectedMonthTarget - currentMonthNum);

  // Calculate Ro Trajectories
  const trajectoryItems = data.items.map(ro => {
    const currentPcro = ro.realisasiProgres;
    const currentTpcro = ro.targetProgres;
    const gapTo100 = Math.max(0, 100 - currentPcro);
    const requiredMonthlyPcro = gapTo100 / remainingMonths;

    // Projected velocity based on current pace
    const currentMonthlyPace = currentMonthNum > 0 ? (currentPcro / currentMonthNum) : currentPcro;
    
    // Calculate projected end PCRO based on selected scenario
    let projectedEndPcro = currentPcro;
    if (simulationScenario === 'STATUS_QUO') {
      projectedEndPcro = Math.min(100, currentPcro + (currentMonthlyPace * remainingMonths));
    } else if (simulationScenario === 'MODERATE_ACCEL') {
      projectedEndPcro = Math.min(100, currentPcro + (Math.max(currentMonthlyPace, requiredMonthlyPcro * 0.75) * remainingMonths));
    } else {
      // TARGET_MAXIMAL: 100%
      projectedEndPcro = 100;
    }

    // Projected Z score
    let projectedZ = 100;
    if (projectedEndPcro < 100) {
      projectedZ = Number(Math.min(100, (projectedEndPcro / 100) * 100).toFixed(1));
    }

    // Risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (requiredMonthlyPcro > 25 || currentPcro < (currentTpcro - 20)) {
      riskLevel = 'HIGH';
    } else if (requiredMonthlyPcro > 12 || currentPcro < currentTpcro) {
      riskLevel = 'MEDIUM';
    }

    return {
      ...ro,
      gapTo100,
      requiredMonthlyPcro: Number(requiredMonthlyPcro.toFixed(1)),
      currentMonthlyPace: Number(currentMonthlyPace.toFixed(1)),
      projectedEndPcro: Number(projectedEndPcro.toFixed(1)),
      projectedZ,
      riskLevel
    };
  });

  const highRiskItems = trajectoryItems.filter(it => it.riskLevel === 'HIGH');
  const mediumRiskItems = trajectoryItems.filter(it => it.riskLevel === 'MEDIUM');
  const safeItems = trajectoryItems.filter(it => it.riskLevel === 'LOW');

  const avgProjectedZ = trajectoryItems.reduce((acc, it) => acc + it.projectedZ, 0) / trajectoryItems.length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${
        isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      } space-y-4`}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 text-xs font-bold">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Prognosis &amp; Trajectory Caput Akhir Tahun &bull; Multi-Scenario Engine</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Simulasi Trajektori Capaian Fisik Menuju Nilai IKPA 100%
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed mt-1">
              Menghitung akselerasi kecepatan penyelesaian fisik (<em>Burn Rate %/Bulan</em>) yang dibutuhkan setiap output agar tidak terjadi penumpukan pekerjaan di akhir tahun anggaran.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={`px-3 py-2 rounded-2xl border text-xs flex items-center gap-2 ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Sisa Waktu: <strong className="text-indigo-600 dark:text-cyan-400 font-mono font-bold">{remainingMonths} Bulan</strong> (s.d. Bulan {selectedMonthTarget})</span>
            </div>
          </div>
        </div>

        {/* Scenario Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
          <button
            onClick={() => setSimulationScenario('STATUS_QUO')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              simulationScenario === 'STATUS_QUO'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                : isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">1. Skenario Status Quo</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500">
              Kecepatan progres fisik berlanjut konstan sesuai rata-rata bulan sebelumnya.
            </p>
          </button>

          <button
            onClick={() => setSimulationScenario('MODERATE_ACCEL')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              simulationScenario === 'MODERATE_ACCEL'
                ? 'bg-cyan-50 dark:bg-cyan-950/70 border-cyan-500 ring-2 ring-cyan-500/20 shadow-sm'
                : isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-cyan-700 dark:text-cyan-300">2. Akselerasi Moderat</span>
              <TrendingUp className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-[11px] text-slate-500">
              Peningkatan kecepatan penyelesaian fisik sebesar +15% per bulan.
            </p>
          </button>

          <button
            onClick={() => setSimulationScenario('TARGET_MAXIMAL')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              simulationScenario === 'TARGET_MAXIMAL'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                : isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-emerald-700 dark:text-emerald-300">3. Target Optimal (100%)</span>
              <Target className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-[11px] text-slate-500">
              Seluruh output ditargetkan tuntas 100% sebelum cut-off akhir tahun.
            </p>
          </button>
        </div>
      </div>

      {/* Summary Scorecard of Trajectory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Proyeksi Nilai IKPA Akhir
          </div>
          <div className="my-2 text-center">
            <div className="text-3xl font-black text-indigo-600 dark:text-cyan-400">
              {avgProjectedZ.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-500">
              Dari Skor Saat Ini: {data.summary.currentScoreCaput.toFixed(2)}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-current/10">
            Skenario: <strong>{simulationScenario}</strong>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
          highRiskItems.length === 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
        }`}>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>RO Berisiko Tinggi Gagal</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="my-2 text-center">
            <div className={`text-3xl font-black ${highRiskItems.length === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {highRiskItems.length} <span className="text-sm font-semibold text-slate-400">/ {totalRo} RO</span>
            </div>
            <span className="text-[11px] text-slate-500">
              {highRiskItems.length === 0 ? 'Tidak ada RO risiko tinggi' : 'Beban target > 25% per bulan'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-current/10">
            Butuh mitigasi jadwal &amp; kurva S
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Rata-rata Beban Fisik/Bulan
          </div>
          <div className="my-2 text-center">
            <div className="text-3xl font-black text-slate-800 dark:text-slate-200">
              {(trajectoryItems.reduce((acc, it) => acc + it.requiredMonthlyPcro, 0) / totalRo).toFixed(1)}%
            </div>
            <span className="text-[11px] text-slate-500">
              Tambahan progres fisik per bulan
            </span>
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-current/10">
            Target per satuan kerja
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between bg-emerald-50/50 border-emerald-200`}>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>RO On-Track (Aman)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-2 text-center">
            <div className="text-3xl font-black text-emerald-600">
              {safeItems.length} <span className="text-sm font-semibold text-slate-400">/ {totalRo} RO</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Siap mencapai target 100%
            </span>
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-current/10">
            Pertahankan ritme pelaporan
          </div>
        </div>
      </div>

      {/* Trajectory Table per RO */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      } space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tabel Trajektori &amp; Beban Akselerasi Bulanan Rincian Output
            </h3>
            <p className="text-xs text-slate-500">
              Urutan berdasarkan tingkat urgensi percepatan fisik tertinggi ke terendah.
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
                <th className="p-3 text-center">PCRO Terkini</th>
                <th className="p-3 text-center">Sisa GAP Fisik</th>
                <th className="p-3 text-center">Beban Per Bulan</th>
                <th className="p-3 text-center">Proyeksi Z Akhir</th>
                <th className="p-3 text-center">Status Risiko</th>
                <th className="p-3 text-right rounded-r-xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-current/5">
              {trajectoryItems.sort((a, b) => b.requiredMonthlyPcro - a.requiredMonthlyPcro).map(ro => (
                <tr key={ro.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="p-3 font-mono font-bold text-indigo-600 dark:text-cyan-400 whitespace-nowrap">
                    {ro.kodeRo}
                  </td>
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                    {ro.namaRo}
                  </td>
                  <td className="p-3 text-center font-mono">
                    {ro.realisasiProgres.toFixed(1)}%
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                    +{ro.gapTo100.toFixed(1)}%
                  </td>
                  <td className="p-3 text-center font-mono font-black">
                    <span className={`px-2 py-0.5 rounded ${
                      ro.requiredMonthlyPcro > 20
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : ro.requiredMonthlyPcro > 10
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      +{ro.requiredMonthlyPcro}% / bln
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold">
                    <span className={ro.projectedZ >= 100 ? 'text-emerald-600' : 'text-amber-600'}>
                      {ro.projectedZ.toFixed(1)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      ro.riskLevel === 'HIGH'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : ro.riskLevel === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {ro.riskLevel === 'HIGH' ? '🚨 Risiko Tinggi' : ro.riskLevel === 'MEDIUM' ? '⚠️ Sedang' : '✅ Aman'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onOpenSimulator(ro)}
                      className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Uji Simulasi
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
