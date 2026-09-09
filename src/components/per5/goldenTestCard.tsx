import React, { useState } from 'react';
import { ShieldCheck, Play, CheckCircle2, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { runGoldenTests, GoldenTestReport } from '../../calculations/goldenTests';

interface GoldenTestCardProps {
  isDark?: boolean;
}

export const GoldenTestCard: React.FC<GoldenTestCardProps> = ({ isDark = false }) => {
  const [report, setReport] = useState<GoldenTestReport | null>(() => runGoldenTests());
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const rep = runGoldenTests();
      setReport(rep);
      setIsRunning(false);
    }, 250);
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-xs transition-all ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Golden Test: Validasi Hasil vs Workbook Excel</h3>
              {report && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  report.overallStatus === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                }`}>
                  {report.overallStatus === 'PASS' ? 'SEMUA PASS (100% Cocok)' : `${report.failedCount} GAGAL`}
                </span>
              )}
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Uji numerik otomatis dengan toleransi selisih mutlak ≤ 0.01 terhadap file Kalkulator Perhitungan IKPA 2026.xlsx
            </p>
          </div>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all shadow-xs ${
            isDark 
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Menguji...' : 'Jalankan Golden Test Ulang'}
        </button>
      </div>

      {report && (
        <div className="mt-4 space-y-4">
          {/* Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200/80'}`}>
              <span className={`text-[11px] block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Total Uji Numerik
              </span>
              <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100">
                {report.totalTests} Indikator
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-emerald-50/70 border-emerald-200'}`}>
              <span className="text-[11px] block font-medium text-emerald-700 dark:text-emerald-400">
                Lolos Validasi (PASS)
              </span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {report.passedCount} / {report.totalTests}
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200/80'}`}>
              <span className={`text-[11px] block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Nilai Excel Asli
              </span>
              <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100">
                {report.overallIKPA.expected.toFixed(2)}
              </span>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200/80'}`}>
              <span className={`text-[11px] block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Nilai Aplikasi
              </span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {report.overallIKPA.actual.toFixed(2)} (Δ {report.overallIKPA.diff.toFixed(2)})
              </span>
            </div>
          </div>

          {/* Test Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className={`border-b font-semibold ${
                isDark ? 'bg-slate-800/70 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <tr>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Indikator IKPA</th>
                  <th className="px-3 py-2.5 text-right">Nilai Raw (Excel)</th>
                  <th className="px-3 py-2.5 text-right">Nilai Raw (Aplikasi)</th>
                  <th className="px-3 py-2.5 text-right">Tertimbang (Excel)</th>
                  <th className="px-3 py-2.5 text-right">Tertimbang (Aplikasi)</th>
                  <th className="px-3 py-2.5 text-right">Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {report.results.map((r, idx) => (
                  <tr 
                    key={idx}
                    className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}
                  >
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        r.status === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {r.status === 'PASS' ? (
                          <><CheckCircle2 className="h-3 w-3" /> PASS</>
                        ) : (
                          <><AlertTriangle className="h-3 w-3" /> FAIL</>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">
                      {r.indicator}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">
                      {r.expectedRaw.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-800 dark:text-slate-200">
                      {r.actualRaw.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">
                      {r.expectedWeighted.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {r.actualWeighted.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-500">
                      {r.diffWeighted.toFixed(4)}
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
