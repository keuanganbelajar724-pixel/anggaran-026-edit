import React, { useState } from 'react';
import { SatkerIKPA, IndikatorIKPA } from '../../../types';
import { ArrowRight, Trophy, Zap, Scale, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeadToHeadComparisonProps {
  satkerA: SatkerIKPA;
  allSatkers: SatkerIKPA[];
  isDark?: boolean;
  onApplyPresetToA?: (newIndikator: IndikatorIKPA) => void;
}

const INDICATORS_DEF: { key: keyof IndikatorIKPA; label: string; weight: number }[] = [
  { key: 'capaianOutput', label: 'Capaian Output SAKTI', weight: 25 },
  { key: 'penyerapanAnggaran', label: 'Penyerapan Anggaran', weight: 20 },
  { key: 'deviasiHal3Dipa', label: 'Deviasi Hal III DIPA', weight: 15 },
  { key: 'revisiDipa', label: 'Revisi DIPA', weight: 10 },
  { key: 'belanjaKontraktual', label: 'Data Kontrak', weight: 10 },
  { key: 'penyelesaianTagihan', label: 'Penyelesaian Tagihan', weight: 10 },
  { key: 'pengelolaanUpTup', label: 'Pengelolaan UP/TUP', weight: 10 },
  { key: 'dispensasiSpm', label: 'Dispensasi SPM', weight: 5 },
];

export const HeadToHeadComparison: React.FC<HeadToHeadComparisonProps> = ({
  satkerA,
  allSatkers,
  isDark = false,
  onApplyPresetToA
}) => {
  // Find highest score satker for default benchmark
  const bestSatker = [...allSatkers].sort((a, b) => (b.nilaiTotalIKPA || 0) - (a.nilaiTotalIKPA || 0))[0];
  const [selectedBId, setSelectedBId] = useState<string>(
    bestSatker?.id !== satkerA.id ? (bestSatker?.id || allSatkers[1]?.id || '') : (allSatkers[1]?.id || '')
  );

  const satkerB = allSatkers.find(s => s.id === selectedBId) || bestSatker || satkerA;

  const scoreA = satkerA.nilaiTotalIKPA || 0;
  const scoreB = satkerB.nilaiTotalIKPA || 0;
  const totalDelta = Number((scoreA - scoreB).toFixed(2));

  // Determine strengths & weaknesses
  const indA = satkerA.indikator;
  const indB = satkerB.indikator;

  const comparisonRows = INDICATORS_DEF.map(ind => {
    const valA = indA?.[ind.key] ?? 0;
    const valB = indB?.[ind.key] ?? 0;
    const diff = Number((valA - valB).toFixed(1));
    const pointContribution = Number((diff * (ind.weight / 100)).toFixed(2));
    return {
      ...ind,
      valA,
      valB,
      diff,
      pointContribution,
      winner: valA > valB ? 'A' : valB > valA ? 'B' : 'tie'
    };
  });

  const aWinsCount = comparisonRows.filter(r => r.winner === 'A').length;
  const bWinsCount = comparisonRows.filter(r => r.winner === 'B').length;

  return (
    <div className={`p-6 rounded-3xl border shadow-sm space-y-6 ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      
      {/* Header & Satker Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            <Scale className="w-3.5 h-3.5" />
            KOMPARASI HEAD-TO-HEAD BENCHMARK
          </div>
          <h3 className="text-xl font-black tracking-tight mt-1">
            Bandingkan Performa Langsung 2 Satker KPPN
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Analisis keunggulan kompetitif dan adopsi indikator unggulan satker pembanding.
          </p>
        </div>

        {/* Dropdown for Satker B */}
        <div className="w-full md:w-80 space-y-1">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <span>Pilih Satker Pembanding (Satker B):</span>
          </label>
          <select
            value={selectedBId}
            onChange={(e) => setSelectedBId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
          >
            {allSatkers.map(s => (
              <option key={s.id} value={s.id}>
                {s.namaSatker} (IKPA: {s.nilaiTotalIKPA})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Versus Cards */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        
        {/* Satker A Card */}
        <div className="md:col-span-5 p-5 rounded-2xl border-2 border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-600 text-white">
              Satker Utama (A)
            </span>
            <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400">
              Kode: {satkerA.kodeSatker}
            </span>
          </div>
          <div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100 line-clamp-1">
              {satkerA.namaSatker}
            </h4>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {scoreA}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase">
                Predikat: {satkerA.predikat || 'Sangat Baik'}
              </span>
            </div>
          </div>
          <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            <span>Unggul di {aWinsCount} dari 8 Indikator</span>
          </div>
        </div>

        {/* Center VS Badge */}
        <div className="md:col-span-1 flex flex-col items-center justify-center py-2">
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black text-xs flex items-center justify-center shadow-lg">
            VS
          </div>
          <span className={`text-[11px] font-mono font-black mt-1.5 px-2 py-0.5 rounded ${
            totalDelta > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
            totalDelta < 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-800'
          }`}>
            {totalDelta > 0 ? `+${totalDelta}` : totalDelta} Poin
          </span>
        </div>

        {/* Satker B Card */}
        <div className="md:col-span-5 p-5 rounded-2xl border-2 border-purple-500/30 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-600 text-white">
              Satker Benchmark (B)
            </span>
            <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-400">
              Kode: {satkerB.kodeSatker}
            </span>
          </div>
          <div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100 line-clamp-1">
              {satkerB.namaSatker}
            </h4>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-purple-600 dark:text-purple-400">
                {scoreB}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase">
                Predikat: {satkerB.predikat || 'Sangat Baik'}
              </span>
            </div>
          </div>
          <div className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            <span>Unggul di {bWinsCount} dari 8 Indikator</span>
          </div>
        </div>
      </div>

      {/* Adopt Best Practices Action */}
      {scoreB > scoreA && onApplyPresetToA && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Peluang Adopsi:</strong> Satker B memiliki skor lebih tinggi (+{(scoreB - scoreA).toFixed(2)} poin).
              Anda dapat mengadopsi indikator unggulan Satker B langsung ke simulator Satker A!
            </span>
          </div>
          <button
            onClick={() => {
              if (satkerB.indikator) {
                // adopt the maximum of each indicator
                const adopted: IndikatorIKPA = { ...satkerA.indikator };
                INDICATORS_DEF.forEach(def => {
                  const valB = satkerB.indikator?.[def.key] ?? 0;
                  const valA = satkerA.indikator?.[def.key] ?? 0;
                  adopted[def.key] = Math.max(valA, valB);
                });
                onApplyPresetToA(adopted);
              }
            }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shrink-0 cursor-pointer shadow-sm transition-all"
          >
            Adopsi Indikator Unggul B ke Simulator
          </button>
        </div>
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-extrabold uppercase border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Indikator IKPA</th>
              <th className="py-3 px-4">Bobot</th>
              <th className="py-3 px-4 text-indigo-700 dark:text-indigo-400">Satker A</th>
              <th className="py-3 px-4 text-purple-700 dark:text-purple-400">Satker B</th>
              <th className="py-3 px-4">Selisih (A - B)</th>
              <th className="py-3 px-4">Dampak Poin IKPA</th>
              <th className="py-3 px-4">Unggul</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {comparisonRows.map(row => (
              <tr key={row.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                  {row.label}
                </td>
                <td className="py-3 px-4 font-mono text-slate-500">
                  {row.weight}%
                </td>
                <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {row.valA}
                </td>
                <td className="py-3 px-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                  {row.valB}
                </td>
                <td className="py-3 px-4 font-mono font-extrabold">
                  <span className={row.diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : row.diff < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}>
                    {row.diff > 0 ? `+${row.diff}` : row.diff}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono font-extrabold">
                  <span className={row.pointContribution > 0 ? 'text-emerald-600 dark:text-emerald-400' : row.pointContribution < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}>
                    {row.pointContribution > 0 ? `+${row.pointContribution}` : row.pointContribution} Poin
                  </span>
                </td>
                <td className="py-3 px-4">
                  {row.winner === 'A' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      Satker A (+{row.diff})
                    </span>
                  ) : row.winner === 'B' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      Satker B (+{Math.abs(row.diff)})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Sama Imbang
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
