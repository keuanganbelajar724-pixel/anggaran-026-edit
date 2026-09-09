import React, { useState } from 'react';
import {
  Coins,
  CreditCard,
  Sliders,
  Calculator,
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import { SimulationProject, UPTUPTunaiInput, UPTUPKKPInput } from '../../../models/ikpa';
import { normalizeDateToIso } from '../../../utils/ikpaDateUtils';

interface UpTupTabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const UpTupTab: React.FC<UpTupTabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  const result = project.output?.indicators.pengelolaanUPTUP;
  const tunaiRows = project.upTUPTunai;
  const kkpRows = project.upTUPKKP;
  const [activeSubTab, setActiveSubTab] = useState<'tunai' | 'kkp'>('tunai');

  const handleUpdateTunai = (index: number, field: keyof UPTUPTunaiInput, val: any) => {
    const newRows = [...tunaiRows];
    const processedVal = field === 'tanggal' ? normalizeDateToIso(val) : val;
    newRows[index] = { ...newRows[index], [field]: processedVal };
    onUpdateProject({ ...project, upTUPTunai: newRows });
  };

  const handleUpdateKKP = (index: number, field: keyof UPTUPKKPInput, val: any) => {
    const newRows = [...kkpRows];
    newRows[index] = { ...newRows[index], [field]: Number(val) || 0 };
    onUpdateProject({ ...project, upTUPKKP: newRows });
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
              Bobot 10% | Sel H16
            </span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Simulasi Pengelolaan UP dan TUP (Tunai & KKP)
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Formula: MIN(100, (Nilai UP/TUP Tunai * 90%) + (Nilai UP KKP * 10%)).
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase block font-medium">Nilai Akhir (H16)</span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {result ? result.cappedValue.toFixed(2) : '0.00'}
            </div>
          </div>
          <button
            onClick={() => onOpenInspector(
              'Indikator Pengelolaan UP dan TUP',
              'H16',
              '=MIN(100, (UP_Tunai*90%) + (UP_KKP*10%))',
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

      {/* Sub-Tabs: Tunai vs KKP */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('tunai')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeSubTab === 'tunai'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Coins className="h-4 w-4" /> UP & TUP Tunai (Bobot 90%)
        </button>
        <button
          onClick={() => setActiveSubTab('kkp')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeSubTab === 'kkp'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <CreditCard className="h-4 w-4" /> UP Kartu Kredit Pemerintah (Bobot 10%)
        </button>
      </div>

      {activeSubTab === 'tunai' ? (
        <div className={`rounded-2xl border overflow-hidden shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-semibold text-sm">Riwayat Transaksi Revolving UP & Pertanggungjawaban TUP Tunai</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b font-semibold ${
                isDark ? 'bg-slate-800/60 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                <tr>
                  <th className="px-3 py-2.5">No</th>
                  <th className="px-3 py-2.5">Jenis</th>
                  <th className="px-3 py-2.5">Tanggal</th>
                  <th className="px-3 py-2.5 text-right">Total GUP</th>
                  <th className="px-3 py-2.5 text-right">Outstanding UP</th>
                  <th className="px-3 py-2.5 text-right">Total TUP</th>
                  <th className="px-3 py-2.5 text-right">Setoran TUP</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {tunaiRows.map((r, idx) => (
                  <tr key={idx} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'}>
                    <td className="px-3 py-2 font-medium">{r.no}</td>
                    <td className="px-3 py-2 font-sans font-medium">{r.jenis}</td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={normalizeDateToIso(r.tanggal)}
                        onChange={e => handleUpdateTunai(idx, 'tanggal', e.target.value)}
                        className="w-32 rounded border px-1.5 py-0.5 text-[11px] font-mono dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.totalGUP}
                        onChange={e => handleUpdateTunai(idx, 'totalGUP', Number(e.target.value))}
                        className="w-28 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.totalOutstandingUP}
                        onChange={e => handleUpdateTunai(idx, 'totalOutstandingUP', Number(e.target.value))}
                        className="w-28 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.totalTUP}
                        onChange={e => handleUpdateTunai(idx, 'totalTUP', Number(e.target.value))}
                        className="w-28 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={r.totalSetoranTUP}
                        onChange={e => handleUpdateTunai(idx, 'totalSetoranTUP', Number(e.target.value))}
                        className="w-28 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-3 py-2 text-center font-sans">
                      <span className="rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">
                        {r.status || 'TEPAT WAKTU'}
                      </span>
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
            <h4 className="font-semibold text-sm">Target & Realisasi Penggunaan Kartu Kredit Pemerintah (KKP) Bulanan</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b font-semibold ${
                isDark ? 'bg-slate-800/60 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                <tr>
                  <th className="px-3 py-2.5">Bulan</th>
                  <th className="px-3 py-2.5 text-right">Besaran UP KKP Bulanan (Rp)</th>
                  <th className="px-3 py-2.5 text-right">Realisasi Penggunaan KKP (Rp)</th>
                  <th className="px-3 py-2.5 text-right font-bold text-emerald-600">% Capaian KKP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {kkpRows.map((r, idx) => {
                  const pct = r.upKKPPerBulan > 0 ? (r.penggunaanKKP / r.upKKPPerBulan) * 100 : 100;
                  return (
                    <tr key={idx} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'}>
                      <td className="px-3 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">
                        Bulan {r.periode}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          value={r.upKKPPerBulan}
                          onChange={e => handleUpdateKKP(idx, 'upKKPPerBulan', e.target.value)}
                          className="w-36 text-right rounded border px-2 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          value={r.penggunaanKKP}
                          onChange={e => handleUpdateKKP(idx, 'penggunaanKKP', e.target.value)}
                          className="w-36 text-right rounded border px-2 py-0.5 text-[11px] text-emerald-600 font-medium dark:bg-slate-800 dark:border-slate-700"
                        />
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
      )}
    </div>
  );
};
