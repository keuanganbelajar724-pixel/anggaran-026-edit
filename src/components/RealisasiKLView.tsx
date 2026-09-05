import React, { useState } from 'react';
import { 
  Building2, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  Layers, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { GroupedKLSummary, EvaluatedSatkerRealisasi, formatRupiah, formatRupiahCompact } from '../utils/targetTriwulanProcessor';

interface RealisasiKLViewProps {
  groupedKLList: GroupedKLSummary[];
  onSelectSatker: (satker: EvaluatedSatkerRealisasi) => void;
  isDark?: boolean;
}

export const RealisasiKLView: React.FC<RealisasiKLViewProps> = ({
  groupedKLList,
  onSelectSatker,
  isDark = false
}) => {
  const [expandedKLs, setExpandedKLs] = useState<Set<string>>(new Set());

  const toggleExpand = (klName: string) => {
    setExpandedKLs(prev => {
      const next = new Set(prev);
      if (next.has(klName)) next.delete(klName);
      else next.add(klName);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedKLs(new Set(groupedKLList.map(g => g.klName)));
  };

  const collapseAll = () => {
    setExpandedKLs(new Set());
  };

  if (groupedKLList.length === 0) {
    return (
      <div className={`p-12 text-center rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
        Tidak ada data Kementerian / Lembaga yang sesuai dengan filter pencarian.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Controls Bar for K/L */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Total {groupedKLList.length} Kementerian / Lembaga
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500 dark:text-slate-400">
            Dikelompokkan berdasarkan instansi pembina
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
            }`}
          >
            Buka Semua
          </button>
          <button
            onClick={collapseAll}
            className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
            }`}
          >
            Tutup Semua
          </button>
        </div>
      </div>

      {/* Accordion Cards */}
      <div className="space-y-3">
        {groupedKLList.map((g) => {
          const isExpanded = expandedKLs.has(g.klName);
          const allCompliant = g.satkerBelumSesuaiCount === 0;
          const hasKritis = g.satkers.some(s => s.priorityRisk === 'PRIORITAS_1_KRITIS');

          return (
            <div
              key={g.klName}
              className={`rounded-2xl border transition-all overflow-hidden shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
              }`}
            >
              {/* Card Header (Clickable) */}
              <div
                onClick={() => toggleExpand(g.klName)}
                className={`p-4 sm:p-5 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                  isExpanded ? (isDark ? 'bg-slate-850/60' : 'bg-slate-50/50') : ''
                }`}
              >
                {/* Left info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    allCompliant 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                      : hasKritis 
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                        {g.klName}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {g.totalSatker} Satker
                      </span>
                      {hasKritis && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300/40">
                          <ShieldAlert className="w-3 h-3" />
                          Ada Satker Kritis
                        </span>
                      )}
                      {g.hasModalIssue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/40">
                          <AlertTriangle className="w-3 h-3" />
                          Isu Belanja Modal
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <div>
                        Pagu: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{formatRupiahCompact(g.totalPagu)}</strong>
                      </div>
                      <div>
                        Realisasi: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatRupiahCompact(g.totalRealisasi)}</strong>
                      </div>
                      {g.totalKekuranganRp > 0 && (
                        <div>
                          Kekurangan: <strong className="text-rose-600 font-semibold">{formatRupiahCompact(g.totalKekuranganRp)}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right metrics & bar */}
                <div className="flex items-center justify-between lg:justify-end gap-5 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                  {/* Progress bar */}
                  <div className="w-36 sm:w-44">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {g.persenRealisasi}%
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {g.satkerSesuaiCount}/{g.totalSatker} Sesuai
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          g.persenRealisasi >= 75
                            ? 'bg-emerald-500'
                            : g.persenRealisasi >= 50
                              ? 'bg-blue-500'
                              : g.persenRealisasi >= 25
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, g.persenRealisasi)}%` }}
                      />
                    </div>
                  </div>

                  {/* Status badge & chevron */}
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                      allCompliant
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {allCompliant ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          100% Sesuai
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          {g.satkerBelumSesuaiCount} Belum Sesuai
                        </>
                      )}
                    </span>

                    <button
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                      title={isExpanded ? 'Tutup Rincian' : 'Buka Rincian Satker'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Accordion Content (Satker Table under K/L) */}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-4">
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                          isDark ? 'bg-slate-850 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          <th className="py-2.5 px-3 w-10 text-center">No</th>
                          <th className="py-2.5 px-3">Kode & Nama Satker</th>
                          <th className="py-2.5 px-3 text-right">Pagu & Realisasi</th>
                          <th className="py-2.5 px-2 text-center">Pegawai</th>
                          <th className="py-2.5 px-2 text-center">Barang</th>
                          <th className="py-2.5 px-2 text-center">Modal</th>
                          <th className="py-2.5 px-2 text-center">Bansos</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right">Kekurangan</th>
                          <th className="py-2.5 px-2 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {g.satkers.map((s, idx) => {
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
                              <td className="py-2 px-3 max-w-[240px]">
                                <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {s.namaSatker}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    {s.kodeSatker}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {s.clusterLabel}
                                  </span>
                                  {s.priorityRisk === 'PRIORITAS_1_KRITIS' && (
                                    <span className="text-[9px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950 px-1 py-0.2 rounded">
                                      Prioritas 1
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right whitespace-nowrap">
                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                  {s.totalPersen}%
                                </div>
                                <div className="text-[10px] text-emerald-600 font-semibold">
                                  {formatRupiahCompact(s.totalRealisasi)}
                                </div>
                                <div className="text-[9px] text-slate-400">
                                  Pagu: {formatRupiahCompact(s.totalPagu)}
                                </div>
                              </td>
                              <td className="py-2 px-2 text-center whitespace-nowrap">
                                {renderMiniPill(s.pegawai)}
                              </td>
                              <td className="py-2 px-2 text-center whitespace-nowrap">
                                {renderMiniPill(s.barang)}
                              </td>
                              <td className="py-2 px-2 text-center whitespace-nowrap">
                                {renderMiniPill(s.modal)}
                              </td>
                              <td className="py-2 px-2 text-center whitespace-nowrap">
                                {renderMiniPill(s.bansos)}
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
                              <td className="py-2 px-3 text-right whitespace-nowrap font-mono font-bold text-rose-600">
                                {s.totalKekuranganNominal > 0 ? formatRupiahCompact(s.totalKekuranganNominal) : '-'}
                              </td>
                              <td className="py-2 px-2 text-center whitespace-nowrap">
                                <button
                                  onClick={() => onSelectSatker(s)}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                                >
                                  Detail
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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

function renderMiniPill(detail: any) {
  if (!detail.hasPagu) return <span className="text-slate-400 text-[10px]">-</span>;
  const isPass = detail.status === 'MEMENUHI';
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
      isPass ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' : 'text-rose-600 bg-rose-50 dark:bg-rose-950/60'
    }`}>
      {detail.persen}%
    </span>
  );
}
