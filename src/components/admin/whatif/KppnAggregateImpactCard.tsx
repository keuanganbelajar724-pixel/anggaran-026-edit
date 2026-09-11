import React from 'react';
import { SatkerIKPA } from '../../../types';
import { Award, TrendingUp, Users, ArrowUpRight } from 'lucide-react';

interface KppnAggregateImpactCardProps {
  satkers: SatkerIKPA[];
  activeSatker: SatkerIKPA;
  simulatedScore: number;
  isDark?: boolean;
}

export const KppnAggregateImpactCard: React.FC<KppnAggregateImpactCardProps> = ({
  satkers,
  activeSatker,
  simulatedScore,
  isDark = false
}) => {
  const totalCount = satkers.length || 1;
  const currentBaseline = activeSatker.nilaiTotalIKPA || 0;
  const delta = Number((simulatedScore - currentBaseline).toFixed(2));

  // KPPN average score calculation
  const totalCurrentSum = satkers.reduce((acc, s) => acc + (s.nilaiTotalIKPA || 0), 0);
  const currentKppnAvg = Number((totalCurrentSum / totalCount).toFixed(2));

  const newTotalSum = totalCurrentSum - currentBaseline + simulatedScore;
  const newKppnAvg = Number((newTotalSum / totalCount).toFixed(2));
  const kppnDelta = Number((newKppnAvg - currentKppnAvg).toFixed(3));

  // Rank calculation
  const sortedCurrent = [...satkers].sort((a, b) => (b.nilaiTotalIKPA || 0) - (a.nilaiTotalIKPA || 0));
  const currentRank = sortedCurrent.findIndex(s => s.id === activeSatker.id) + 1;

  // New rank with simulated score
  const simulatedList = satkers.map(s => {
    if (s.id === activeSatker.id) {
      return { ...s, nilaiTotalIKPA: simulatedScore };
    }
    return s;
  });
  const sortedNew = simulatedList.sort((a, b) => (b.nilaiTotalIKPA || 0) - (a.nilaiTotalIKPA || 0));
  const newRank = sortedNew.findIndex(s => s.id === activeSatker.id) + 1;
  const rankShift = currentRank - newRank; // positive means rank improved!

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    } shadow-sm space-y-4`}>
      
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Dampak Agregat KPPN Semarang I
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Pengaruh simulasi satker terhadap rata-rata &amp; peringkat satker di KPPN
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300">
          N = {totalCount} Satker
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Rank Position */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-500" />
            Posisi Ranking Satker
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg font-black font-mono text-slate-900 dark:text-slate-100">
              #{currentRank}
            </span>
            <span className="text-slate-400 text-xs">➔</span>
            <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
              #{newRank}
            </span>
          </div>
          <div className="text-[10px] font-bold">
            {rankShift > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> Naik {rankShift} peringkat!
              </span>
            ) : rankShift < 0 ? (
              <span className="text-rose-600 dark:text-rose-400">
                Turun {Math.abs(rankShift)} peringkat
              </span>
            ) : (
              <span className="text-slate-400">Tetap di posisi #{currentRank}</span>
            )}
          </div>
        </div>

        {/* KPPN Semarang I Composite Average */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-indigo-500" />
            Rata-rata KPPN Semarang I
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg font-black font-mono text-slate-900 dark:text-slate-100">
              {currentKppnAvg}
            </span>
            <span className="text-slate-400 text-xs">➔</span>
            <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
              {newKppnAvg}
            </span>
          </div>
          <div className="text-[10px] font-bold">
            <span className={kppnDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {kppnDelta >= 0 ? `+${kppnDelta}` : kppnDelta} Poin Agregat
            </span>
          </div>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 text-[11px] text-indigo-900 dark:text-indigo-200">
        💡 <strong>Analisis Pengaruh:</strong> Kenaikan {delta > 0 ? `+${delta}` : delta} poin pada <strong>{activeSatker.namaSatker}</strong> memberikan kontribusi nyata menaikkan indeks IKPA KPPN Semarang I secara keseluruhan sebesar <strong>{kppnDelta > 0 ? `+${kppnDelta}` : kppnDelta} poin</strong>.
      </div>

    </div>
  );
};
