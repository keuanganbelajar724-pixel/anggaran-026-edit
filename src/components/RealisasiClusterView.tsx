import React, { useState } from 'react';
import { 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  TrendingUp, 
  Building2, 
  ArrowUpRight 
} from 'lucide-react';
import { GroupedClusterSummary, EvaluatedSatkerRealisasi, formatRupiah, formatRupiahCompact } from '../utils/targetTriwulanProcessor';

interface RealisasiClusterViewProps {
  groupedClusterList: GroupedClusterSummary[];
  onSelectSatker: (satker: EvaluatedSatkerRealisasi) => void;
  isDark?: boolean;
}

export const RealisasiClusterView: React.FC<RealisasiClusterViewProps> = ({
  groupedClusterList,
  onSelectSatker,
  isDark = false
}) => {
  // Default open all clusters
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(
    new Set(['JUMBO', 'BESAR', 'SEDANG', 'KECIL'])
  );

  const toggleCluster = (key: string) => {
    setExpandedClusters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Intro info */}
      <div className={`p-4 rounded-2xl border ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              Matriks Segmentasi Klaster Pagu Anggaran
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              Analisis segmentasi satker berdasarkan besaran pagu DIPA untuk mengidentifikasi kontributor deviasi terbesar terhadap realisasi total KPPN Semarang I.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              Jumbo (≥50M)
            </span>
            <span className="px-2.5 py-1 rounded-full font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              Besar (10-50M)
            </span>
            <span className="px-2.5 py-1 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              Sedang (2-10M)
            </span>
            <span className="px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
              Kecil (&lt;2M)
            </span>
          </div>
        </div>
      </div>

      {/* Cluster Sections */}
      <div className="space-y-6">
        {groupedClusterList.map((cluster) => {
          const isExpanded = expandedClusters.has(cluster.clusterKey);

          return (
            <div
              key={cluster.clusterKey}
              className={`rounded-2xl border transition-all overflow-hidden shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
              }`}
            >
              {/* Header */}
              <div
                onClick={() => toggleCluster(cluster.clusterKey)}
                className={`p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                  isExpanded ? (isDark ? 'bg-slate-850/40' : 'bg-slate-50/40') : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                        {cluster.label}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {cluster.totalSatker} Satker
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        ({cluster.rangeDesc})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <div>
                        Total Pagu: <strong className="text-slate-800 dark:text-slate-200 font-bold">{formatRupiahCompact(cluster.totalPagu)}</strong>
                      </div>
                      <div>
                        Realisasi: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatRupiahCompact(cluster.totalRealisasi)}</strong>
                      </div>
                      {cluster.totalKekuranganRp > 0 && (
                        <div>
                          Kekurangan: <strong className="text-rose-600 font-bold">{formatRupiahCompact(cluster.totalKekuranganRp)}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                  {/* Realization bar */}
                  <div className="w-40">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        {cluster.persenRealisasi}%
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {cluster.satkerSesuaiCount}/{cluster.totalSatker} Sesuai
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(100, cluster.persenRealisasi)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                      cluster.satkerBelumSesuaiCount === 0
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {cluster.satkerBelumSesuaiCount === 0 ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          100% Sesuai
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {cluster.satkerBelumSesuaiCount} Belum Sesuai
                        </>
                      )}
                    </span>

                    <button className="p-1 text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Table of Satkers in Cluster */}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/60">
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                          isDark ? 'bg-slate-850 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3">Kode & Satker</th>
                          <th className="py-2.5 px-3">Kementerian / Lembaga</th>
                          <th className="py-2.5 px-3 text-right">Pagu</th>
                          <th className="py-2.5 px-3 text-right">Realisasi</th>
                          <th className="py-2.5 px-3 text-center">Capaian %</th>
                          <th className="py-2.5 px-3 text-center">Status Target</th>
                          <th className="py-2.5 px-3 text-right">Kekurangan (Rp)</th>
                          <th className="py-2.5 px-2 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {cluster.satkers.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-6 text-center text-slate-400">
                              Tidak ada satker dalam klaster ini yang sesuai filter.
                            </td>
                          </tr>
                        ) : (
                          cluster.satkers.map((s, idx) => {
                            const isPass = s.overallStatus === 'SESUAI';
                            return (
                              <tr
                                key={s.id}
                                className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${
                                  !isPass && s.totalKekuranganNominal > 0 ? 'bg-rose-50/10' : ''
                                }`}
                              >
                                <td className="py-2 px-3 text-center text-slate-400 font-medium">
                                  {idx + 1}
                                </td>
                                <td className="py-2 px-3 max-w-[220px]">
                                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {s.namaSatker}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                      {s.kodeSatker}
                                    </span>
                                    {s.priorityRisk === 'PRIORITAS_1_KRITIS' && (
                                      <span className="text-[9px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950 px-1 py-0.2 rounded">
                                        Prioritas 1
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                                  {s.kementerianLembaga}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                                  {formatRupiahCompact(s.totalPagu)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                                  {formatRupiahCompact(s.totalRealisasi)}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className="font-extrabold text-slate-900 dark:text-slate-100">
                                    {s.totalPersen}%
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isPass
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}>
                                    {isPass ? 'Sesuai' : 'Belum Sesuai'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                                  {s.totalKekuranganNominal > 0 ? formatRupiah(s.totalKekuranganNominal) : '-'}
                                </td>
                                <td className="py-2 px-2 text-center whitespace-nowrap">
                                  <button
                                    onClick={() => onSelectSatker(s)}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                                  >
                                    Detail
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
