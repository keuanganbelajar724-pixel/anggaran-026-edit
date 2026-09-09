import React from 'react';
import {
  AlertTriangle,
  Sliders,
  Calculator,
  ShieldAlert,
  Info,
  CheckCircle2
} from 'lucide-react';
import { SimulationProject, DispensasiSPMInput } from '../../../models/ikpa';

interface DispensasiTabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const DispensasiTab: React.FC<DispensasiTabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  const output = project.output;
  const dispensasi = project.dispensasiSPM || { jumlahSPMTriwulanIV: 200, jumlahDispensasiSPM: 0 };
  const reduction = output?.dispensasiReduction ?? 0;
  const ratio = output?.dispensasiRatio ?? 0;

  const handleUpdate = (field: keyof DispensasiSPMInput, val: number) => {
    onUpdateProject({
      ...project,
      dispensasiSPM: {
        ...dispensasi,
        [field]: Math.max(0, val)
      }
    });
  };

  const matrixTiers = [
    { label: '0% (Tanpa Dispensasi)', range: '0%', penalty: 0.00 },
    { label: 'Rasio > 0% s.d 5%', range: '0 < Rasio ≤ 5%', penalty: -0.50 },
    { label: 'Rasio > 5% s.d 10%', range: '5% < Rasio ≤ 10%', penalty: -1.00 },
    { label: 'Rasio > 10% s.d 15%', range: '10% < Rasio ≤ 15%', penalty: -2.00 },
    { label: 'Rasio > 15% s.d 20%', range: '15% < Rasio ≤ 20%', penalty: -3.00 },
    { label: 'Rasio > 20%', range: 'Rasio > 20%', penalty: -5.00 }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border p-5 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-rose-600">
              Faktor Pengurang Langsung Nilai Akhir
            </span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Simulasi Dispensasi SPM Triwulan IV
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Pengajuan SPM yang melewati batas tanggal penerbitan SPM pada akhir tahun anggaran dikenakan pengurangan nilai total IKPA.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase block font-medium">Nilai Pengurang</span>
            <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
              -{reduction.toFixed(2)}
            </div>
          </div>
          <button
            onClick={() => onOpenInspector(
              'Pengurang Dispensasi SPM Triwulan IV',
              'Sel Matrix',
              '=VLOOKUP(RasioDispensasi, MatrixDispensasi, 2, TRUE)',
              `-${reduction.toFixed(2)}`,
              [
                { step: 'Jumlah SPM Triwulan IV', formulaHuman: 'Total SPM terbit di TW IV', value: dispensasi.jumlahSPMTriwulanIV },
                { step: 'Jumlah SPM Diberi Dispensasi', formulaHuman: 'SPM dispensasi keterlambatan', value: dispensasi.jumlahDispensasiSPM },
                { step: 'Rasio Dispensasi (%)', formulaHuman: '(Dispensasi / Total SPM TW IV) * 100', value: `${ratio.toFixed(2)}%` },
                { step: 'Pengurang Nilai IKPA', formulaHuman: 'Berdasarkan tabel interval regulasi', value: -reduction }
              ]
            )}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Calculator className="h-3.5 w-3.5 text-emerald-600" />
            Formula Inspector
          </button>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`rounded-2xl border p-5 space-y-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-600" /> Input Simulasi SPM Triwulan IV
          </h4>

          <div>
            <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Total Penerbitan SPM di Triwulan IV:
            </label>
            <input
              type="number"
              value={dispensasi.jumlahSPMTriwulanIV}
              onChange={e => handleUpdate('jumlahSPMTriwulanIV', Number(e.target.value))}
              className="w-full rounded-xl border px-3 py-2 font-mono text-sm dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Jumlah SPM yang Mendapat Dispensasi:
              </label>
              <span className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400">
                {dispensasi.jumlahDispensasiSPM} SPM
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={dispensasi.jumlahDispensasiSPM}
              onChange={e => handleUpdate('jumlahDispensasiSPM', Number(e.target.value))}
              className="w-full accent-rose-600"
            />
          </div>

          <div className={`rounded-xl p-3 text-xs space-y-1 ${
            isDark ? 'bg-slate-800/40' : 'bg-slate-50'
          }`}>
            <div className="flex justify-between">
              <span className="text-slate-500">Rasio Dispensasi Terhitung:</span>
              <span className="font-mono font-bold">{ratio.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Penalti Pengurang:</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                -{reduction.toFixed(2)} Poin IKPA
              </span>
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className={`rounded-2xl border p-5 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-rose-500" /> Matriks Regulasi Pengurang Dispensasi SPM
          </h4>

          <div className="space-y-2">
            {matrixTiers.map((t, idx) => {
              const isCurrent = Math.abs(t.penalty) === reduction;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between rounded-xl p-2.5 text-xs transition-colors ${
                    isCurrent
                      ? 'border-2 border-rose-500 bg-rose-500/10 font-bold'
                      : isDark ? 'bg-slate-800/40 text-slate-400' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className="font-mono">{t.penalty === 0 ? '0.00' : t.penalty.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
