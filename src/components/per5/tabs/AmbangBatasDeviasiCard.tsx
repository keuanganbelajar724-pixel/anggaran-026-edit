import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { round2 } from '../../../calculations/deviasiHalIII';

interface AmbangBatasDeviasiCardProps {
  currentThreshold: number;
  onUpdateThreshold: (newThreshold: number) => void;
  isDark?: boolean;
}

export const AmbangBatasDeviasiCard: React.FC<AmbangBatasDeviasiCardProps> = ({
  currentThreshold,
  onUpdateThreshold,
  isDark = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState<string>(currentThreshold.toFixed(1));

  // Cek apakah sedang dalam kondisi regulasi normal (5.0%) atau mode dispensasi
  const isNormalRule = Math.abs(currentThreshold - 5.0) < 0.001;

  // Handler perubahan input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num) && num >= 0 && num <= 100) {
      onUpdateThreshold(round2(num));
    }
  };

  const handleApplyPreset = (threshold: number) => {
    setInputValue(threshold.toFixed(1));
    onUpdateThreshold(threshold);
  };

  const maxDeviationAtThreshold = Math.max(0, round2(100 - currentThreshold));

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
        isDark
          ? isNormalRule
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-slate-900/95 border-amber-500/40 ring-1 ring-amber-500/20'
          : isNormalRule
          ? 'bg-white border-slate-200/90'
          : 'bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30 border-amber-300 ring-1 ring-amber-300/30'
      }`}
    >
      {/* Header Card */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl mt-0.5 transition-colors ${
              isNormalRule
                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 animate-pulse'
            }`}
          >
            {isNormalRule ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <ShieldAlert className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Aturan Ambang Batas & Dispensasi Nilai IKPA
              </h3>
              {isNormalRule ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Aturan Baku (5,0%)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 dark:bg-amber-950/90 dark:text-amber-200 border border-amber-400 dark:border-amber-700 shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  Dispensasi Aktif: Ambang Batas {currentThreshold.toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Berdasarkan PER-5/PB/2022. Tersedia isian khusus apabila satker memperoleh persetujuan dispensasi/relaksasi ambang batas.
            </p>
          </div>
        </div>

        {/* Toggle Collapse & Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {!isNormalRule && (
            <button
              type="button"
              onClick={() => handleApplyPreset(5.0)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              title="Kembalikan ke aturan reguler PER-5/PB/2022 (5.0%)"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Kembalikan Normal (5,0%)
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isExpanded ? 'Tutup Rincian' : 'Buka Rincian Aturan'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Konten Rincian */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Highlight Aturan Visual (Persis seperti yang ada pada dokumen/gambar PER-5) */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-4">
            <div className="flex items-start gap-2.5 mb-3">
              <div className="mt-0.5 text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="h-5 w-5 fill-blue-600 text-white dark:fill-blue-500 dark:text-slate-900" />
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                <span className="font-black text-slate-950 dark:text-white">
                  Ambang batas rata-rata deviasi bulanan sebesar{' '}
                  <span className={`px-1 py-0.5 rounded font-mono font-black ${
                    isNormalRule 
                      ? 'bg-blue-200 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200' 
                      : 'bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 underline'
                  }`}>
                    {currentThreshold.toFixed(1)}%
                  </span>
                </span>{' '}
                untuk memperoleh nilai maksimal (100).
              </div>
            </div>

            {/* Tabel Regulasi Persis Dokumen PER-5 */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-blue-600 dark:border-blue-800 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-blue-700 dark:bg-blue-900 text-white font-bold">
                    <th className="px-3 py-2 text-center w-12 border-r border-blue-600 dark:border-blue-800">No.</th>
                    <th className="px-4 py-2 border-r border-blue-600 dark:border-blue-800">Rentang Deviasi</th>
                    <th className="px-4 py-2">Nilai Indikator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-200 dark:divide-blue-900/60 bg-amber-50/70 dark:bg-slate-900/70 text-slate-900 dark:text-slate-100">
                  <tr className="hover:bg-amber-100/60 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="px-3 py-2 text-center font-bold border-r border-blue-200 dark:border-blue-900/60">1</td>
                    <td className="px-4 py-2 font-mono font-bold border-r border-blue-200 dark:border-blue-900/60">
                      0 - {currentThreshold.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 font-mono font-black text-emerald-700 dark:text-emerald-400">
                      100,0
                    </td>
                  </tr>
                  <tr className="hover:bg-amber-100/60 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="px-3 py-2 text-center font-bold border-r border-blue-200 dark:border-blue-900/60">2</td>
                    <td className="px-4 py-2 font-mono font-bold border-r border-blue-200 dark:border-blue-900/60">
                      &gt; {currentThreshold.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 font-mono">
                      0 - {maxDeviationAtThreshold.toFixed(1)} <span className="text-slate-500 text-[11px] font-sans font-normal">(sesuai persentase deviasi: 100 - Deviasi)</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Form Isian Khusus & Kontrol Dispensasi */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1">
            <div className="md:col-span-5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Isian Khusus Ambang Batas Nilai Maksimal:
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={inputValue}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                      isNormalRule
                        ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-blue-500'
                        : 'border-amber-500 dark:border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 font-black focus:ring-amber-500 ring-1 ring-amber-400/40'
                    }`}
                    placeholder="5.0"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 font-mono">%</span>
                </div>

                {/* Tombol Cepat Reset ke Normal */}
                <button
                  type="button"
                  onClick={() => handleApplyPreset(5.0)}
                  disabled={isNormalRule}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isNormalRule
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-bold'
                  }`}
                  title="Reset ke Aturan Normal (5,0%)"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Normal
                </button>
              </div>
            </div>

            {/* Tombol Cepat Pilihan Preset */}
            <div className="md:col-span-7">
              <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                Preset Cepat Sesuai Kebutuhan / Surat Dispensasi:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(5.0)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isNormalRule
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  Aturan Baku (5,0%)
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(10.0)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    Math.abs(currentThreshold - 10.0) < 0.001
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-300'
                  }`}
                >
                  Dispensasi 10,0%
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(15.0)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    Math.abs(currentThreshold - 15.0) < 0.001
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-300'
                  }`}
                >
                  Dispensasi 15,0%
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(100.0)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    Math.abs(currentThreshold - 100.0) < 0.001
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-300'
                  }`}
                  title="Toleransi penuh 100% (Semua deviasi otomatis memperoleh nilai 100)"
                >
                  Bebas Deviasi (100%)
                </button>
              </div>
            </div>
          </div>

          {/* Informasi Panduan Regulasi */}
          <div className="flex items-start gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p>
              <strong>Petunjuk:</strong> Kolom AB (Nilai IKPA) dihitung dengan rumus{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-blue-600 dark:text-blue-400">
                =IF(AA &le; {currentThreshold.toFixed(1)}, 100, 100 - AA)
              </code>
              . Jika Satker Anda memiliki surat dispensasi dari KPPN/Kanwil DJPb, ubah isian di atas atau isi langsung dispensasi nilai pada Kolom AB tabel di bawah. Jika tidak ada dispensasi khusus, gunakan <strong>Aturan Baku (5,0%)</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
