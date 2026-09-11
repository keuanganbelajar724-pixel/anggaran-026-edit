import React, { useState } from 'react';
import { X, Calculator, HelpCircle, Check, Sparkles, TrendingUp } from 'lucide-react';

interface PenyerapanBelanjaCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScore: (score: number) => void;
  isDark?: boolean;
}

interface BelanjaItem {
  kode: '51' | '52' | '53' | '57';
  nama: string;
  pagu: number; // in millions
  realisasi: number; // in millions
  targets: {
    1: number; // %
    2: number;
    3: number;
    4: number;
  };
}

const INITIAL_BELANJA: BelanjaItem[] = [
  {
    kode: '51',
    nama: 'Belanja Pegawai (51)',
    pagu: 1200,
    realisasi: 920,
    targets: { 1: 20, 2: 50, 3: 75, 4: 95 }
  },
  {
    kode: '52',
    nama: 'Belanja Barang (52)',
    pagu: 850,
    realisasi: 580,
    targets: { 1: 15, 2: 50, 3: 70, 4: 90 }
  },
  {
    kode: '53',
    nama: 'Belanja Modal (53)',
    pagu: 450,
    realisasi: 280,
    targets: { 1: 10, 2: 40, 3: 70, 4: 90 }
  },
  {
    kode: '57',
    nama: 'Belanja Bansos (57)',
    pagu: 100,
    realisasi: 75,
    targets: { 1: 25, 2: 50, 3: 75, 4: 100 }
  },
];

export const PenyerapanBelanjaCalculatorModal: React.FC<PenyerapanBelanjaCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyScore,
  isDark = false
}) => {
  const [activeQuarter, setActiveQuarter] = useState<1 | 2 | 3 | 4>(3);
  const [items, setItems] = useState<BelanjaItem[]>(INITIAL_BELANJA);

  if (!isOpen) return null;

  const handleUpdate = (index: number, field: 'pagu' | 'realisasi', value: number) => {
    const next = [...items];
    next[index] = {
      ...next[index],
      [field]: Math.max(0, value)
    };
    setItems(next);
  };

  // Calculations per jenis belanja
  const rows = items.map(item => {
    const pct = item.pagu > 0 ? (item.realisasi / item.pagu) * 100 : 0;
    const targetPct = item.targets[activeQuarter];
    // PER-5/PB/2024: if realization >= target, score is 100; else (realization / target) * 100
    let score = targetPct > 0 ? (pct / targetPct) * 100 : 100;
    score = Math.min(100, Math.max(0, score));

    return {
      ...item,
      pct: Number(pct.toFixed(2)),
      targetPct,
      score: Number(score.toFixed(2))
    };
  });

  const totalPagu = items.reduce((acc, it) => acc + it.pagu, 0);
  const totalRealisasi = items.reduce((acc, it) => acc + it.realisasi, 0);
  const totalPct = totalPagu > 0 ? Number(((totalRealisasi / totalPagu) * 100).toFixed(2)) : 0;

  // Weighted average score based on pagu share
  const weightedScore = totalPagu > 0
    ? Number((rows.reduce((acc, r) => acc + (r.score * (r.pagu / totalPagu)), 0)).toFixed(2))
    : 100;

  const handleAutoFillTargets = () => {
    const next = items.map(it => {
      const targetPct = it.targets[activeQuarter];
      return {
        ...it,
        realisasi: Number(((it.pagu * targetPct) / 100).toFixed(1))
      };
    });
    setItems(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 sm:p-7 space-y-5 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Kalkulator Teknis Indikator (Bobot 20%)
              </div>
              <h3 className="text-lg font-black tracking-tight mt-0.5">
                Kalkulator Penyerapan Anggaran per Jenis Belanja (PER-5/PB/2024)
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quarter Selector */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <span className="text-slate-500 px-2 text-[11px]">Pilih Periode:</span>
            {[1, 2, 3, 4].map(q => (
              <button
                key={q}
                onClick={() => setActiveQuarter(q as 1 | 2 | 3 | 4)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-bold ${
                  activeQuarter === q
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Triwulan {q === 1 ? 'I' : q === 2 ? 'II' : q === 3 ? 'III' : 'IV'}
              </button>
            ))}
          </div>

          <button
            onClick={handleAutoFillTargets}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Set Pas Target Triwulan {activeQuarter}
          </button>
        </div>

        {/* KPI Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="text-xs font-bold text-slate-500">Total Pagu DIPA</div>
            <div className="text-lg font-black font-mono mt-1 text-slate-900 dark:text-slate-100">
              Rp {totalPagu.toLocaleString('id-ID')} Juta
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="text-xs font-bold text-slate-500">Total Realisasi Riil</div>
            <div className="text-lg font-black font-mono mt-1 text-slate-900 dark:text-slate-100">
              Rp {totalRealisasi.toLocaleString('id-ID')} Juta ({totalPct}%)
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Nilai IKPA Penyerapan</div>
            <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
              {weightedScore}
              <span className="text-xs font-bold font-sans text-emerald-600 dark:text-emerald-300 ml-1">
                / 100
              </span>
            </div>
          </div>
        </div>

        {/* Table per Jenis Belanja */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-extrabold uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Jenis Belanja</th>
                <th className="py-2.5 px-3">Pagu (Juta Rp)</th>
                <th className="py-2.5 px-3">Realisasi (Juta Rp)</th>
                <th className="py-2.5 px-3">% Realisasi</th>
                <th className="py-2.5 px-3">Target Triwulan {activeQuarter}</th>
                <th className="py-2.5 px-3">Nilai Indikator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row, idx) => (
                <tr key={row.kode} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                    {row.nama}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      value={row.pagu}
                      onChange={(e) => handleUpdate(idx, 'pagu', Number(e.target.value))}
                      className="w-24 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-right font-mono font-bold"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      value={row.realisasi}
                      onChange={(e) => handleUpdate(idx, 'realisasi', Number(e.target.value))}
                      className="w-24 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-right font-mono font-bold"
                    />
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    {row.pct}%
                  </td>
                  <td className="py-2.5 px-3 font-mono font-extrabold text-slate-600 dark:text-slate-300">
                    {row.targetPct}%
                  </td>
                  <td className="py-2.5 px-3 font-mono font-black">
                    <span className={`px-2 py-0.5 rounded text-[11px] ${
                      row.score >= 100
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : row.score >= 90
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {row.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <button
            onClick={() => {
              onApplyScore(weightedScore);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan Skor ({weightedScore}%) ke Slider Simulasi</span>
          </button>
        </div>

      </div>
    </div>
  );
};
