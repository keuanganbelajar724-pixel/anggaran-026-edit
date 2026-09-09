import React, { useState } from 'react';
import {
  Target,
  Clock,
  Sliders,
  Calculator,
  Plus,
  Trash2,
  CheckCircle2,
  Info
} from 'lucide-react';
import { SimulationProject, CapaianOutputInput, CapaianOutputKetepatanInput } from '../../../models/ikpa';

interface CapaianOutputTabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const CapaianOutputTab: React.FC<CapaianOutputTabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  const result = project.output?.indicators.capaianOutput;
  const roRows = project.capaianOutput;
  const ketepatanRows = project.capaianOutputKetepatan || [];
  const [activeSubTab, setActiveSubTab] = useState<'ro' | 'ketepatan'>('ro');

  const handleUpdateRO = (index: number, field: keyof CapaianOutputInput, val: any) => {
    const newRows = [...roRows];
    newRows[index] = { ...newRows[index], [field]: val };
    onUpdateProject({ ...project, capaianOutput: newRows });
  };

  const handleUpdateKetepatan = (index: number, field: keyof CapaianOutputKetepatanInput, val: any) => {
    const newRows = [...ketepatanRows];
    newRows[index] = { ...newRows[index], [field]: val };
    onUpdateProject({ ...project, capaianOutputKetepatan: newRows });
  };

  // Quick optimization: Make all timely
  const handleMakeAllTimely = () => {
    const newKetepatan = ketepatanRows.map(k => ({
      ...k,
      ketepatan: 'Tepat Waktu' as const
    }));
    onUpdateProject({ ...project, capaianOutputKetepatan: newKetepatan });
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
              Bobot 25% (Tertinggi) | Sel V27
            </span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Simulasi Capaian Output (KRO / RO)
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Formula: ROUND((70% * Capaian Riil RO) + (30% * Ketepatan Waktu Pelaporan), 2).
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase block font-medium">Nilai Akhir (V27)</span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {result ? result.cappedValue.toFixed(2) : '0.00'}
            </div>
          </div>
          <button
            onClick={() => onOpenInspector(
              'Indikator Capaian Output',
              'V27',
              '=ROUND((70%*CapaianRO) + (30%*KetepatanWaktu), 2)',
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

      {/* Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('ro')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeSubTab === 'ro'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Target className="h-4 w-4" /> Capaian Rincian Output (Bobot 70%)
          </button>
          <button
            onClick={() => setActiveSubTab('ketepatan')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeSubTab === 'ketepatan'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Clock className="h-4 w-4" /> Ketepatan Waktu Pelaporan (Bobot 30%)
          </button>
        </div>

        {activeSubTab === 'ketepatan' && (
          <button
            onClick={handleMakeAllTimely}
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
          >
            Setel Semua 100% Tepat Waktu
          </button>
        )}
      </div>

      {activeSubTab === 'ro' ? (
        <div className={`rounded-2xl border overflow-hidden shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-semibold text-sm">Target & Realisasi Rincian Output (RO) Terdaftar</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b font-semibold ${
                isDark ? 'bg-slate-800/60 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                <tr>
                  <th className="px-3 py-2.5">No</th>
                  <th className="px-3 py-2.5">Kode RO</th>
                  <th className="px-3 py-2.5">Uraian Rincian Output</th>
                  <th className="px-3 py-2.5 text-right">Target Volume</th>
                  <th className="px-3 py-2.5 text-right">Realisasi Volume (RVRO)</th>
                  <th className="px-3 py-2.5 text-right">Progres Capaian (PCRO)</th>
                  <th className="px-3 py-2.5 text-center">Status Konfirmasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {roRows.map((r, idx) => (
                  <tr key={idx} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'}>
                    <td className="px-3 py-2 font-medium">{r.no}</td>
                    <td className="px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400">{r.ro || `RO.${idx + 1}`}</td>
                    <td className="px-3 py-2 font-sans">{r.uraianRO || 'Layanan Perbendaharaan dan Fasilitasi'}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.target}
                        onChange={e => handleUpdateRO(idx, 'target', Number(e.target.value))}
                        className="w-20 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.realisasiRO || 0}
                        onChange={e => handleUpdateRO(idx, 'realisasiRO', Number(e.target.value))}
                        className="w-20 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700 text-emerald-600 font-semibold"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.persenProgress ?? 100}
                        onChange={e => handleUpdateRO(idx, 'persenProgress', Number(e.target.value))}
                        className="w-20 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700 text-emerald-600 font-semibold"
                      />
                    </td>
                    <td className="px-3 py-2 text-center font-sans">
                      <select
                        value={r.statusKonfirmasi || 'terkonfirmasi'}
                        onChange={e => handleUpdateRO(idx, 'statusKonfirmasi', e.target.value)}
                        className="rounded border px-2 py-0.5 text-[10px] dark:bg-slate-800 dark:border-slate-700"
                      >
                        <option value="terkonfirmasi">Terkonfirmasi</option>
                        <option value="tidak terkonfirmasi">Tidak Terkonfirmasi</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-semibold text-sm">Status Ketepatan Waktu Pelaporan Capaian Output Bulanan</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b font-semibold ${
                isDark ? 'bg-slate-800/60 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                <tr>
                  <th className="px-3 py-2.5">Bulan Pelaporan</th>
                  <th className="px-3 py-2.5">Batas Waktu Pelaporan</th>
                  <th className="px-3 py-2.5">Tanggal Pelaporan Riil</th>
                  <th className="px-3 py-2.5 text-center">Status Ketepatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {ketepatanRows.map((k, idx) => (
                  <tr key={idx} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'}>
                    <td className="px-3 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">
                      Bulan {k.bulan}
                    </td>
                    <td className="px-3 py-2 text-slate-500">Tgl 15 bulan berikutnya</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={k.tanggalPelaporan || ''}
                        onChange={e => handleUpdateKetepatan(idx, 'tanggalPelaporan', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-28 rounded border px-2 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-center font-sans">
                      <select
                        value={k.ketepatan}
                        onChange={e => handleUpdateKetepatan(idx, 'ketepatan', e.target.value as any)}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          k.ketepatan === 'Tepat Waktu'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        <option value="Tepat Waktu">Tepat Waktu (100)</option>
                        <option value="Tidak Tepat Waktu">Terlambat (0)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
