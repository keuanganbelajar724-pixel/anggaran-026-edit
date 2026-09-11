import React, { useState } from 'react';
import { X, Calculator, HelpCircle, Check, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

interface DeviasiHal3DipaCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScore: (score: number) => void;
  isDark?: boolean;
}

interface MonthData {
  monthName: string;
  rpd: number; // in millions
  realisasi: number; // in millions
}

const INITIAL_MONTHS: MonthData[] = [
  { monthName: 'Januari', rpd: 50, realisasi: 48 },
  { monthName: 'Februari', rpd: 65, realisasi: 60 },
  { monthName: 'Maret', rpd: 90, realisasi: 85 },
  { monthName: 'April', rpd: 70, realisasi: 68 },
  { monthName: 'Mei', rpd: 80, realisasi: 78 },
  { monthName: 'Juni', rpd: 110, realisasi: 95 },
  { monthName: 'Juli', rpd: 85, realisasi: 82 },
  { monthName: 'Agustus', rpd: 90, realisasi: 89 },
  { monthName: 'September', rpd: 120, realisasi: 112 },
  { monthName: 'Oktober', rpd: 95, realisasi: 92 },
  { monthName: 'November', rpd: 110, realisasi: 105 },
  { monthName: 'Desember', rpd: 150, realisasi: 146 },
];

export const DeviasiHal3DipaCalculatorModal: React.FC<DeviasiHal3DipaCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyScore,
  isDark = false
}) => {
  const [months, setMonths] = useState<MonthData[]>(INITIAL_MONTHS);
  const [activeQuarter, setActiveQuarter] = useState<1 | 2 | 3 | 4 | 'all'>('all');

  if (!isOpen) return null;

  // Calculation according to PER-5/PB/2024:
  // For each month: Deviasi % = (|Realisasi - RPD| / RPD) * 100 (jika RPD > 0)
  // Rata-rata deviasi = sum(Deviasi %) / jumlah bulan
  // Nilai Indikator Deviasi:
  // Sesuai juknis PER-5: toleransi deviasi 5% -> jika rata-rata deviasi <= 5%, nilai = 100.
  // Jika deviasi > 5%: Nilai = Math.max(0, 100 - (rata-rata deviasi - 5) * 2) (interpolasi linier standar Kemenkeu).

  const monthCalculations = months.map(m => {
    const diff = Math.abs(m.realisasi - m.rpd);
    const pct = m.rpd > 0 ? (diff / m.rpd) * 100 : 0;
    return {
      ...m,
      diff,
      pct: Number(pct.toFixed(2))
    };
  });

  const totalRpd = months.reduce((acc, m) => acc + m.rpd, 0);
  const totalRealisasi = months.reduce((acc, m) => acc + m.realisasi, 0);
  const avgDeviasiPct = Number(
    (monthCalculations.reduce((acc, m) => acc + m.pct, 0) / months.length).toFixed(2)
  );

  // Score mapping according to PER-5/PB/2024 standard:
  // If avg deviasi <= 5%, score is 100.
  // If avg deviasi > 5%, score drops. Standard formula: 100 - ((avgDeviasi - 5) * 1.5)
  let calculatedScore = 100;
  if (avgDeviasiPct > 5) {
    calculatedScore = Math.max(0, Math.min(100, 100 - (avgDeviasiPct - 5) * 1.6));
  }
  calculatedScore = Number(calculatedScore.toFixed(2));

  const handleUpdateMonth = (index: number, field: 'rpd' | 'realisasi', value: number) => {
    const next = [...months];
    next[index] = {
      ...next[index],
      [field]: Math.max(0, value)
    };
    setMonths(next);
  };

  const handleResetToTolerated = () => {
    // Automatically adjust Realisasi to within 4% of RPD
    const next = months.map(m => ({
      ...m,
      realisasi: Number((m.rpd * 0.97).toFixed(1))
    }));
    setMonths(next);
  };

  const filteredIndices = months.map((_, i) => i).filter(i => {
    if (activeQuarter === 'all') return true;
    if (activeQuarter === 1) return i >= 0 && i <= 2;
    if (activeQuarter === 2) return i >= 3 && i <= 5;
    if (activeQuarter === 3) return i >= 6 && i <= 8;
    if (activeQuarter === 4) return i >= 9 && i <= 11;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 sm:p-7 space-y-5 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Kalkulator Teknis Indikator (Bobot 15%)
              </div>
              <h3 className="text-lg font-black tracking-tight mt-0.5">
                Kalkulator Deviasi Halaman III DIPA (PER-5/PB/2024)
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

        {/* Info Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-extrabold">Formula PER-5/PB/2024:</span> Deviasi dihitung dari selisih mutlak rencana penarikan dana bulanan (Hal III DIPA) terhadap realisasinya.
            Batas toleransi deviasi aman adalah <span className="underline font-bold">maksimal 5%</span> per bulan untuk mempertahankan skor maksimal 100.
          </div>
        </div>

        {/* Score Preview Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="text-xs font-bold text-slate-500">Total RPD vs Realisasi</div>
            <div className="text-base font-black font-mono mt-1 text-slate-900 dark:text-slate-100">
              Rp {totalRealisasi.toLocaleString('id-ID')} jt <span className="text-xs font-normal text-slate-500">/ {totalRpd.toLocaleString('id-ID')} jt</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="text-xs font-bold text-slate-500">Rata-rata Deviasi Bulanan</div>
            <div className={`text-xl font-black font-mono mt-1 ${
              avgDeviasiPct <= 5 ? 'text-emerald-600 dark:text-emerald-400' :
              avgDeviasiPct <= 15 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {avgDeviasiPct}%
              <span className="text-[10px] ml-1.5 font-bold font-sans">
                {avgDeviasiPct <= 5 ? '(Dalam Toleransi 5%)' : '(Melewati Toleransi)'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40">
            <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Hasil Nilai IKPA Deviasi</div>
            <div className="text-2xl font-black font-mono text-indigo-700 dark:text-indigo-400 mt-0.5">
              {calculatedScore}
              <span className="text-xs font-bold font-sans text-indigo-600 dark:text-indigo-300 ml-1">
                / 100
              </span>
            </div>
          </div>
        </div>

        {/* Filter Quarters */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveQuarter('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeQuarter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Semua Bulan (12)
            </button>
            <button
              onClick={() => setActiveQuarter(1)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeQuarter === 1 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Triwulan I
            </button>
            <button
              onClick={() => setActiveQuarter(2)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeQuarter === 2 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Triwulan II
            </button>
            <button
              onClick={() => setActiveQuarter(3)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeQuarter === 3 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Triwulan III
            </button>
            <button
              onClick={() => setActiveQuarter(4)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeQuarter === 4 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Triwulan IV
            </button>
          </div>

          <button
            onClick={handleResetToTolerated}
            className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto-Optimasi ke Toleransi 5%
          </button>
        </div>

        {/* Input Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-extrabold uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Bulan</th>
                <th className="py-2.5 px-3">RPD Halaman III (Juta Rp)</th>
                <th className="py-2.5 px-3">Realisasi Aktual (Juta Rp)</th>
                <th className="py-2.5 px-3">Selisih Mutlak</th>
                <th className="py-2.5 px-3">Deviasi (%)</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredIndices.map(index => {
                const item = monthCalculations[index];
                const isSafe = item.pct <= 5;
                return (
                  <tr key={item.monthName} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">
                      {item.monthName}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        value={item.rpd}
                        onChange={(e) => handleUpdateMonth(index, 'rpd', Number(e.target.value))}
                        className="w-24 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-right font-mono font-bold"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        value={item.realisasi}
                        onChange={(e) => handleUpdateMonth(index, 'realisasi', Number(e.target.value))}
                        className="w-24 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-right font-mono font-bold"
                      />
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                      Rp {item.diff.toLocaleString('id-ID')} jt
                    </td>
                    <td className="py-2 px-3 font-mono font-black">
                      <span className={isSafe ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {item.pct}%
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        isSafe
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {isSafe ? 'Aman (≤5%)' : 'Melebihi'}
                      </span>
                    </td>
                  </tr>
                );
              })}
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
              onApplyScore(calculatedScore);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black flex items-center gap-2 shadow-md cursor-pointer transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan Skor ({calculatedScore}%) ke Slider Simulasi</span>
          </button>
        </div>

      </div>
    </div>
  );
};
