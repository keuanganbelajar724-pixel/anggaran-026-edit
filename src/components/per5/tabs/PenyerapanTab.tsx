import React, { useState } from 'react';
import {
  TrendingUp,
  Sliders,
  Calculator,
  Percent,
  CheckCircle2,
  Info
} from 'lucide-react';
import { SimulationProject, PenyerapanInput } from '../../../models/ikpa';

interface PenyerapanTabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const PenyerapanTab: React.FC<PenyerapanTabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  const result = project.output?.indicators.penyerapan;
  const rows = project.penyerapan;
  const [boostPct, setBoostPct] = useState<number>(5);

  const handleUpdateRow = (index: number, field: keyof PenyerapanInput, val: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: Number(val) || 0 };
    onUpdateProject({ ...project, penyerapan: newRows });
  };

  const handleApplyBoost = () => {
    const factor = 1 + boostPct / 100;
    const newRows = rows.map(r => ({
      ...r,
      realisasi52: Math.min(r.pagu52 - r.blokir52, Math.round(r.realisasi52 * factor)),
      realisasi53: Math.min(r.pagu53 - r.blokir53, Math.round(r.realisasi53 * factor))
    }));
    onUpdateProject({ ...project, penyerapan: newRows });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border p-5 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-600">
              Bobot 20% | Sel Q71
            </span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Simulasi Penyerapan Anggaran
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Rata-rata tertimbang Nilai Kinerja Penyerapan Anggaran (NKPA) Triwulan I, II, III, dan IV.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase block font-medium">Nilai Akhir (Q71)</span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {result ? result.cappedValue.toFixed(2) : '0.00'}
            </div>
          </div>
          <button
            onClick={() => onOpenInspector(
              'Indikator Penyerapan Anggaran',
              'Q71',
              '=AVERAGE($P$17, $P$35, $P$53, P71)',
              result ? result.cappedValue.toFixed(2) : '0.00',
              result?.details || []
            )}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Calculator className="h-3.5 w-3.5 text-emerald-600" />
            Formula Inspector
          </button>
        </div>
      </div>

      {/* What-If Booster */}
      <div className={`rounded-2xl border p-4 shadow-xs ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-600" />
              <h4 className="font-semibold text-xs">What-If Analysis: Peningkatan Realisasi Anggaran</h4>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Simulasikan percepatan realisasi belanja barang & modal hingga +{boostPct}% untuk mengejar target triwulan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={boostPct}
              onChange={e => setBoostPct(Number(e.target.value))}
              className="w-28 accent-emerald-600"
            />
            <span className="font-mono font-bold text-xs w-8 text-emerald-600">
              +{boostPct}%
            </span>
            <button
              onClick={handleApplyBoost}
              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Terapkan Percepatan
            </button>
          </div>
        </div>
      </div>

      {/* 12 Months Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h4 className="font-semibold text-sm">Data Penyerapan Anggaran Bulanan & Realisasi Per Jenis Belanja</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-semibold ${
              isDark ? 'bg-slate-800/60 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              <tr>
                <th className="px-3 py-2.5">Bulan</th>
                <th className="px-3 py-2.5 text-right">Pagu 51</th>
                <th className="px-3 py-2.5 text-right">Realisasi 51</th>
                <th className="px-3 py-2.5 text-right">Pagu 52</th>
                <th className="px-3 py-2.5 text-right">Realisasi 52</th>
                <th className="px-3 py-2.5 text-right">Pagu 53</th>
                <th className="px-3 py-2.5 text-right">Realisasi 53</th>
                <th className="px-3 py-2.5 text-right">Total Pagu Netto</th>
                <th className="px-3 py-2.5 text-right">Total Realisasi</th>
                <th className="px-3 py-2.5 text-right font-bold text-emerald-600">% Realisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {rows.map((r, idx) => {
                const totalPaguNetto = (r.pagu51 - r.blokir51) + (r.pagu52 - r.blokir52) + (r.pagu53 - r.blokir53) + (r.pagu57 - r.blokir57);
                const totalRealisasi = r.realisasi51 + r.realisasi52 + r.realisasi53 + r.realisasi57;
                const pct = totalPaguNetto > 0 ? (totalRealisasi / totalPaguNetto) * 100 : 0;

                return (
                  <tr key={idx} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'}>
                    <td className="px-3 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">
                      Bulan {r.periode}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.pagu51}
                        onChange={e => handleUpdateRow(idx, 'pagu51', e.target.value)}
                        className="w-24 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.realisasi51}
                        onChange={e => handleUpdateRow(idx, 'realisasi51', e.target.value)}
                        className="w-24 text-right rounded border px-1.5 py-0.5 text-[11px] text-emerald-600 font-medium dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.pagu52}
                        onChange={e => handleUpdateRow(idx, 'pagu52', e.target.value)}
                        className="w-24 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.realisasi52}
                        onChange={e => handleUpdateRow(idx, 'realisasi52', e.target.value)}
                        className="w-24 text-right rounded border px-1.5 py-0.5 text-[11px] text-emerald-600 font-medium dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.pagu53}
                        onChange={e => handleUpdateRow(idx, 'pagu53', e.target.value)}
                        className="w-24 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.realisasi53}
                        onChange={e => handleUpdateRow(idx, 'realisasi53', e.target.value)}
                        className="w-24 text-right rounded border px-1.5 py-0.5 text-[11px] text-emerald-600 font-medium dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-300">
                      {totalPaguNetto.toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-300">
                      {totalRealisasi.toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {pct.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
