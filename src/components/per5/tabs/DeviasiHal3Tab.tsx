import React, { useState } from 'react';
import {
  Calendar,
  Sliders,
  Calculator,
  TrendingDown,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SimulationProject, DeviasiHalIIIInput } from '../../../models/ikpa';

interface DeviasiHal3TabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const DeviasiHal3Tab: React.FC<DeviasiHal3TabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  const result = project.output?.indicators.deviasiHalIII;
  const rows = project.deviasiHalIII;
  const metadataMonths = result?.metadata?.months || [];

  // What-If local simulation slider: target deviasi reduction percentage
  const [whatIfReductionPct, setWhatIfReductionPct] = useState<number>(0);

  const handleUpdateField = (index: number, field: keyof DeviasiHalIIIInput, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: Number(value) || 0 };
    onUpdateProject({ ...project, deviasiHalIII: newRows });
  };

  const handleApplyWhatIf = () => {
    if (whatIfReductionPct === 0) return;
    const factor = (100 - whatIfReductionPct) / 100;
    const newRows = rows.map(r => {
      // Bring realisasi closer to rencana by factor
      return {
        ...r,
        penyerapan51: Math.round(r.rencana51 + ((r.penyerapan51 ?? (r as any).realisasi51 ?? r.rencana51) - r.rencana51) * factor),
        penyerapan52: Math.round(r.rencana52 + ((r.penyerapan52 ?? (r as any).realisasi52 ?? r.rencana52) - r.rencana52) * factor),
        penyerapan53: Math.round(r.rencana53 + ((r.penyerapan53 ?? (r as any).realisasi53 ?? r.rencana53) - r.rencana53) * factor),
        penyerapan57: Math.round(r.rencana57 + ((r.penyerapan57 ?? (r as any).realisasi57 ?? r.rencana57) - r.rencana57) * factor)
      };
    });
    onUpdateProject({ ...project, deviasiHalIII: newRows });
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
              Bobot 15% | Sel AC15
            </span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Simulasi Deviasi Halaman III DIPA
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Rata-rata kumulatif deviasi bulanan antara rencana penarikan dana dengan realisasi anggaran 4 jenis belanja.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase block font-medium">Nilai Akhir (AC15)</span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {result ? result.cappedValue.toFixed(2) : '0.00'}
            </div>
          </div>
          <button
            onClick={() => onOpenInspector(
              'Indikator Deviasi Halaman III DIPA',
              'AC15',
              '=ROUND(100 - RataRataDeviasiKumulatif, 2)',
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

      {/* What-If Slider Card */}
      <div className={`rounded-2xl border p-4 shadow-xs ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-600" />
              <h4 className="font-semibold text-xs">What-If Analysis: Pengetatan Deviasi RPD</h4>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Simulasikan perbaikan ketepatan realisasi terhadap RPD bulanan (mengurangi selisih hingga {whatIfReductionPct}%).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={whatIfReductionPct}
                onChange={e => setWhatIfReductionPct(Number(e.target.value))}
                className="w-32 accent-emerald-600"
              />
              <span className="font-mono font-bold text-xs w-10 text-emerald-600">
                {whatIfReductionPct}%
              </span>
            </div>
            <button
              onClick={handleApplyWhatIf}
              disabled={whatIfReductionPct === 0}
              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              Terapkan Simulasi
            </button>
          </div>
        </div>
      </div>

      {/* 12 Months Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h4 className="font-semibold text-sm">Matriks Perhitungan Deviasi Bulanan (Januari - Desember)</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-semibold ${
              isDark ? 'bg-slate-800/60 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              <tr>
                <th className="px-3 py-2.5">Bulan</th>
                <th className="px-3 py-2.5 text-right">Rencana 51 (Pegawai)</th>
                <th className="px-3 py-2.5 text-right">Realisasi 51</th>
                <th className="px-3 py-2.5 text-right">Rencana 52 (Barang)</th>
                <th className="px-3 py-2.5 text-right">Realisasi 52</th>
                <th className="px-3 py-2.5 text-right">Rencana 53 (Modal)</th>
                <th className="px-3 py-2.5 text-right">Realisasi 53</th>
                <th className="px-3 py-2.5 text-right">Deviasi Bulan (AA)</th>
                <th className="px-3 py-2.5 text-right">Rata2 Kumulatif (AB)</th>
                <th className="px-3 py-2.5 text-right font-bold text-emerald-600">Nilai IKPA (AC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {rows.map((r, idx) => {
                const meta = metadataMonths[idx];
                return (
                  <tr key={idx} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'}>
                    <td className="px-3 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">
                      Bulan {r.periode}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.rencana51}
                        onChange={e => handleUpdateField(idx, 'rencana51', e.target.value)}
                        className="w-24 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.penyerapan51 ?? (r as any).realisasi51 ?? 0}
                        onChange={e => handleUpdateField(idx, 'penyerapan51', e.target.value)}
                        className="w-24 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700 font-medium text-emerald-600 dark:text-emerald-400"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.rencana52}
                        onChange={e => handleUpdateField(idx, 'rencana52', e.target.value)}
                        className="w-24 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.penyerapan52 ?? (r as any).realisasi52 ?? 0}
                        onChange={e => handleUpdateField(idx, 'penyerapan52', e.target.value)}
                        className="w-24 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700 font-medium text-emerald-600 dark:text-emerald-400"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.rencana53}
                        onChange={e => handleUpdateField(idx, 'rencana53', e.target.value)}
                        className="w-24 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.penyerapan53 ?? (r as any).realisasi53 ?? 0}
                        onChange={e => handleUpdateField(idx, 'penyerapan53', e.target.value)}
                        className="w-24 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700 font-medium text-emerald-600 dark:text-emerald-400"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-300">
                      {meta?.totalDeviasiBulan !== undefined ? `${meta.totalDeviasiBulan.toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-300">
                      {meta?.rataRataKumulatif !== undefined ? `${meta.rataRataKumulatif.toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {meta?.nilaiIkpaBulan !== undefined ? meta.nilaiIkpaBulan.toFixed(2) : '-'}
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
