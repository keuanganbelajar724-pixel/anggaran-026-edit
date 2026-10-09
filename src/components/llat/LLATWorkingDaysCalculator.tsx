import React, { useState } from 'react';
import { Calculator, Calendar, ArrowRight, CheckCircle2, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { calculateWorkingDayDeadline, adjustIfHoliday, isWeekend, isHoliday, isWorkingDay } from '../../utils/llatWorkingDaysEngine';

interface LLATWorkingDaysCalculatorProps {
  onApplyDate?: (calculatedDate: string) => void;
}

export const LLATWorkingDaysCalculator: React.FC<LLATWorkingDaysCalculatorProps> = ({ onApplyDate }) => {
  const [refDate, setRefDate] = useState('2026-12-01');
  const [workingDays, setWorkingDays] = useState(5);
  const [direction, setDirection] = useState<'SESUDAH' | 'SEBELUM'>('SESUDAH');
  const [includeRefDate, setIncludeRefDate] = useState(false);
  const [ruleType, setRuleType] = useState<'KONTRAK' | 'SPM' | 'CUSTOM'>('KONTRAK');

  // Hitung hasil otomatis
  const result = calculateWorkingDayDeadline(refDate, workingDays, direction, includeRefDate);
  const refStatus = {
    isWeekend: isWeekend(refDate),
    holiday: isHoliday(refDate),
    isWorking: isWorkingDay(refDate)
  };
  const targetHoliday = isHoliday(result.targetDateStr);

  const setPreset = (type: 'KONTRAK' | 'SPM_GAJI' | 'KOREKSI_RETUR') => {
    if (type === 'KONTRAK') {
      setRuleType('KONTRAK');
      setWorkingDays(5);
      setDirection('SESUDAH');
      setIncludeRefDate(false);
    } else if (type === 'SPM_GAJI') {
      setRuleType('SPM');
      setWorkingDays(3);
      setDirection('SESUDAH');
      setIncludeRefDate(false);
    } else if (type === 'KOREKSI_RETUR') {
      setRuleType('CUSTOM');
      setWorkingDays(7);
      setDirection('SESUDAH');
      setIncludeRefDate(false);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20">
            <Calculator className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base tracking-tight flex items-center gap-2">
              MESIN HITUNG HARI KERJA PER-9/PB/2026
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                Resmi SKB 3 Menteri
              </span>
            </h3>
            <p className="text-xs text-indigo-200/80">
              Kalkulasi tenggat waktu pendaftaran kontrak, SPM, SP2D, retur, dan dispensasi tanpa menghitung hari libur.
            </p>
          </div>
        </div>

        {/* Preset Cepat */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-indigo-200 font-semibold mr-1">Preset Aturan:</span>
          <button
            onClick={() => setPreset('KONTRAK')}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-bold transition-colors"
          >
            Kontrak (+5 HK)
          </button>
          <button
            onClick={() => setPreset('SPM_GAJI')}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-bold transition-colors"
          >
            SP2D (+3 HK)
          </button>
          <button
            onClick={() => setPreset('KOREKSI_RETUR')}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-bold transition-colors"
          >
            Retur (+7 HK)
          </button>
        </div>
      </div>

      {/* Konten Form & Output */}
      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Kolom Input Parameter */}
        <div className="lg:col-span-5 space-y-3.5">
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
              Tanggal Acuan / Peristiwa
            </label>
            <div className="relative">
              <input
                type="date"
                value={refDate}
                onChange={(e) => setRefDate(e.target.value)}
                className="w-full pl-3 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {/* Indikator Status Tanggal Acuan */}
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              {refStatus.isWorking ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Hari Kerja Efektif
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {refStatus.isWeekend ? 'Akhir Pekan (Sabtu/Minggu)' : refStatus.holiday.holidayName}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Hari Kerja (HK)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={workingDays}
                onChange={(e) => setWorkingDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                Arah Perhitungan
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="SESUDAH">Sesudah (+ Hari)</option>
                <option value="SEBELUM">Sebelum (- Hari)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeRefDate}
                onChange={(e) => setIncludeRefDate(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Hitung tanggal acuan sebagai hari ke-1 (Include ref date)</span>
            </label>
          </div>
        </div>

        {/* Kolom Hasil Kalkulasi */}
        <div className="lg:col-span-7 bg-indigo-50/50 dark:bg-slate-800/60 rounded-xl p-4 border border-indigo-100 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                HASIL KOMPUTASI TENGGAT:
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">
                Formula: {refDate} {direction === 'SESUDAH' ? '+' : '-'} {workingDays} HK
              </span>
            </div>

            {/* Kotak Tanggal Hasil */}
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                  Tanggal Jatuh Tempo Resmi:
                </span>
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono">
                  {result.targetDateStr}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pukul 17:00 WIB (Batas Akhir Jam Layanan)
                </span>
              </div>

              {onApplyDate && (
                <button
                  onClick={() => onApplyDate(result.targetDateStr)}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Gunakan Tanggal
                </button>
              )}
            </div>

            {/* Penjelasan Rincian Langkah Hari Kerja */}
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                {result.explanation}
              </p>
              
              <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-[11px] font-mono">
                {result.steps.map((st, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-2 py-1 rounded-md ${
                      st.isWorking
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 line-through opacity-75'
                    }`}
                  >
                    <span>{st.dateStr}</span>
                    <span className="text-[10px]">{st.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rujukan PER-9/PB/2026 */}
          <div className="mt-3 pt-2.5 border-t border-indigo-200/60 dark:border-slate-700/60 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>
              Perhitungan mengacu pada kalender hari kerja KPPN Semarang I dan ketentuan PER-9/PB/2026 (Sabtu, Minggu, dan Libur Nasional dilewati).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
