import React from 'react';
import { 
  TrendingUp, 
  AlertOctagon, 
  Award, 
  Building2, 
  Layers, 
  ArrowUpRight, 
  Flame, 
  CheckCircle2, 
  AlertTriangle,
  Briefcase
} from 'lucide-react';
import { 
  EvaluatedSatkerRealisasi, 
  SummaryRealisasiTriwulan, 
  groupSatkersByKL, 
  formatRupiah, 
  formatRupiahCompact 
} from '../utils/targetTriwulanProcessor';

interface RealisasiLeaderboardViewProps {
  evaluatedList: EvaluatedSatkerRealisasi[];
  summary: SummaryRealisasiTriwulan;
  onSelectSatker: (satker: EvaluatedSatkerRealisasi) => void;
  isDark?: boolean;
}

export const RealisasiLeaderboardView: React.FC<RealisasiLeaderboardViewProps> = ({
  evaluatedList,
  summary,
  onSelectSatker,
  isDark = false
}) => {
  // Top 5 Highest Realization
  const topPerformers = React.useMemo(() => {
    return [...evaluatedList]
      .filter(s => s.totalPagu > 0)
      .sort((a, b) => b.totalPersen - a.totalPersen)
      .slice(0, 5);
  }, [evaluatedList]);

  // Top 5 Deficit Drivers (Nominal Rp)
  const topDeficits = React.useMemo(() => {
    return [...evaluatedList]
      .filter(s => s.overallStatus === 'BELUM_SESUAI' && s.totalKekuranganNominal > 0)
      .sort((a, b) => b.totalKekuranganNominal - a.totalKekuranganNominal)
      .slice(0, 5);
  }, [evaluatedList]);

  // K/L Ranked
  const klRankings = React.useMemo(() => {
    const grouped = groupSatkersByKL(evaluatedList);
    const sorted = [...grouped].sort((a, b) => b.persenRealisasi - a.persenRealisasi);
    return {
      top: sorted.slice(0, 5),
      bottom: [...sorted].reverse().slice(0, 5)
    };
  }, [evaluatedList]);

  return (
    <div className="space-y-6">
      {/* 2-Column Grid: Top 5 Realisasi vs Top 5 Defisit Nominal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TOP 5 HIGHEST REALIZATION */}
        <div className={`rounded-2xl border p-5 transition-all shadow-sm ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Top 5 Satker Realisasi Tertinggi (%)
                </h3>
                <p className="text-[11px] text-slate-500">Satker dengan persentase serapan anggaran terbaik</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Optimal
            </span>
          </div>

          <div className="space-y-3">
            {topPerformers.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => onSelectSatker(s)}
                className={`p-3 rounded-xl border cursor-pointer transition-all hover:border-emerald-500/50 hover:shadow-sm ${
                  isDark ? 'bg-slate-850/60 border-slate-800 hover:bg-slate-800' : 'bg-slate-50/70 border-slate-200/70 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      idx === 0 ? 'bg-amber-400 text-amber-950' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {s.namaSatker}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                        <span className="font-mono text-emerald-600 font-bold">{s.kodeSatker}</span>
                        <span>•</span>
                        <span className="truncate max-w-[160px]">{s.kementerianLembaga}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {s.totalPersen}%
                    </span>
                    <div className="text-[10px] text-slate-500">
                      {formatRupiahCompact(s.totalRealisasi)}
                    </div>
                  </div>
                </div>

                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-750 mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, s.totalPersen)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP 5 DEFICIT DRIVERS */}
        <div className={`rounded-2xl border p-5 transition-all shadow-sm ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Top 5 Satker Kekurangan Terbesar (Rp)
                </h3>
                <p className="text-[11px] text-slate-500">Penggerak defisit nominal utama target triwulan</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              Intervensi Prioritas
            </span>
          </div>

          <div className="space-y-3">
            {topDeficits.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => onSelectSatker(s)}
                className={`p-3 rounded-xl border cursor-pointer transition-all hover:border-rose-500/50 hover:shadow-sm ${
                  isDark ? 'bg-slate-850/60 border-slate-800 hover:bg-slate-800' : 'bg-slate-50/70 border-slate-200/70 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {s.namaSatker}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                        <span className="font-mono text-emerald-600 font-bold">{s.kodeSatker}</span>
                        <span>•</span>
                        <span className="text-rose-600 font-semibold">{s.belumMemenuhiList.map(b => b.jenis).join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                      {formatRupiahCompact(s.totalKekuranganNominal)}
                    </span>
                    <div className="text-[10px] text-slate-500">
                      Realisasi: {s.totalPersen}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                  <span>Pagu Total: {formatRupiahCompact(s.totalPagu)}</span>
                  <span className="text-rose-600 font-bold">{formatRupiah(s.totalKekuranganNominal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MINISTRY LEADERBOARD & RECAP */}
      <div className={`rounded-2xl border p-5 transition-all shadow-sm ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Peringkat Capaian Kementerian / Lembaga
              </h3>
              <p className="text-[11px] text-slate-500">Performa serapan agregat berdasarkan instansi pembina</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top 5 K/L */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
            <h4 className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              5 K/L dengan Serapan Rata-Rata Tertinggi:
            </h4>
            <div className="space-y-2.5">
              {klRankings.top.map((kl, i) => (
                <div key={kl.klName} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 h-4 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold flex items-center justify-center text-[10px]">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      {kl.klName}
                    </span>
                    <span className="text-[10px] text-slate-400">({kl.totalSatker} satker)</span>
                  </div>
                  <div className="font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                    {kl.persenRealisasi}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom 5 K/L */}
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20">
            <h4 className="font-bold text-xs text-rose-800 dark:text-rose-300 flex items-center gap-1.5 mb-3">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              5 K/L dengan Serapan Terendah (Perlu Akselerasi):
            </h4>
            <div className="space-y-2.5">
              {klRankings.bottom.map((kl, i) => (
                <div key={kl.klName} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 h-4 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold flex items-center justify-center text-[10px]">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      {kl.klName}
                    </span>
                    <span className="text-[10px] text-slate-400">({kl.totalSatker} satker)</span>
                  </div>
                  <div className="font-black text-rose-600 dark:text-rose-400 shrink-0">
                    {kl.persenRealisasi}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
