import React, { useState, useEffect } from 'react';
import { Calendar, Edit3, ListFilter, Check } from 'lucide-react';

interface PeriodDropdownSelectorProps {
  value: string;
  onChange: (val: string) => void;
  isDark?: boolean;
  themeColor?: 'emerald' | 'sky' | 'indigo' | 'amber' | 'blue';
  className?: string;
}

export const PRESET_PERIODS = {
  standard2026: [
    's.d. Januari 2026',
    's.d. Februari 2026',
    's.d. Maret 2026',
    's.d. April 2026',
    's.d. Mei 2026',
    's.d. Juni 2026',
    's.d. Juli 2026',
    's.d. Agustus 2026',
    's.d. September 2026',
    's.d. Oktober 2026',
    's.d. November 2026',
    's.d. Desember 2026'
  ],
  bulanSaja2026: [
    'Januari 2026',
    'Februari 2026',
    'Maret 2026',
    'April 2026',
    'Mei 2026',
    'Juni 2026',
    'Juli 2026',
    'Agustus 2026',
    'September 2026',
    'Oktober 2026',
    'November 2026',
    'Desember 2026'
  ],
  triwulanSemester: [
    'Triwulan I 2026',
    'Triwulan II 2026',
    'Triwulan III 2026',
    'Triwulan IV 2026',
    'Semester I 2026',
    'Semester II 2026',
    'Tahunan 2026'
  ],
  standard2025: [
    's.d. Desember 2025',
    's.d. November 2025',
    's.d. Oktober 2025',
    's.d. September 2025',
    's.d. Agustus 2025',
    's.d. Juli 2025',
    's.d. Juni 2025',
    's.d. Mei 2025',
    's.d. April 2025',
    's.d. Maret 2025',
    's.d. Februari 2025',
    's.d. Januari 2025'
  ]
};

const ALL_PRESET_LIST = [
  ...PRESET_PERIODS.standard2026,
  ...PRESET_PERIODS.bulanSaja2026,
  ...PRESET_PERIODS.triwulanSemester,
  ...PRESET_PERIODS.standard2025
];

export const PeriodDropdownSelector: React.FC<PeriodDropdownSelectorProps> = ({
  value,
  onChange,
  isDark = false,
  themeColor = 'emerald',
  className = ''
}) => {
  const isValueInPresets = ALL_PRESET_LIST.includes(value);
  const [isManualMode, setIsManualMode] = useState<boolean>(!isValueInPresets && value.trim().length > 0);

  // Sync mode if value changes outside
  useEffect(() => {
    if (!ALL_PRESET_LIST.includes(value) && value.trim().length > 0) {
      setIsManualMode(true);
    }
  }, [value]);

  const colorStyles = {
    emerald: {
      border: 'border-emerald-300 dark:border-emerald-700 focus:ring-emerald-500 focus:border-emerald-500',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      btnActive: 'bg-emerald-600 text-white',
      btnHover: 'hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
    },
    sky: {
      border: 'border-sky-300 dark:border-sky-700 focus:ring-sky-500 focus:border-sky-500',
      badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
      btnActive: 'bg-sky-600 text-white',
      btnHover: 'hover:bg-sky-100 dark:hover:bg-sky-950/60 text-sky-700 dark:text-sky-300'
    },
    indigo: {
      border: 'border-indigo-300 dark:border-indigo-700 focus:ring-indigo-500 focus:border-indigo-500',
      badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      btnActive: 'bg-indigo-600 text-white',
      btnHover: 'hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
    },
    amber: {
      border: 'border-amber-300 dark:border-amber-700 focus:ring-amber-500 focus:border-amber-500',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      btnActive: 'bg-amber-600 text-white',
      btnHover: 'hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-700 dark:text-amber-300'
    },
    blue: {
      border: 'border-blue-300 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      btnActive: 'bg-blue-600 text-white',
      btnHover: 'hover:bg-blue-100 dark:hover:bg-blue-950/60 text-blue-700 dark:text-blue-300'
    }
  };

  const style = colorStyles[themeColor] || colorStyles.emerald;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsManualMode(true);
    } else {
      setIsManualMode(false);
      onChange(val);
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="relative flex items-center">
        {!isManualMode ? (
          <div className="relative flex items-center">
            <div className="absolute left-2.5 pointer-events-none text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <select
              value={ALL_PRESET_LIST.includes(value) ? value : '__custom__'}
              onChange={handleSelectChange}
              className={`pl-8 pr-7 py-1.5 text-xs font-black rounded-xl bg-white dark:bg-slate-900 border ${style.border} text-slate-800 dark:text-slate-100 shadow-sm cursor-pointer transition-all outline-none`}
              title="Pilih Periode Laporan dari Daftar Dropdown"
            >
              <optgroup label="📅 Tahun Anggaran 2026 (Format Resmi s.d. Bulan)">
                {PRESET_PERIODS.standard2026.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </optgroup>

              <optgroup label="📅 Tahun Anggaran 2026 (Bulan Saja)">
                {PRESET_PERIODS.bulanSaja2026.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </optgroup>

              <optgroup label="📊 Triwulan & Semester 2026">
                {PRESET_PERIODS.triwulanSemester.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </optgroup>

              <optgroup label="📁 Tahun Anggaran 2025">
                {PRESET_PERIODS.standard2025.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </optgroup>

              <option value="__custom__">✏️ Ketik Manual / Periode Kustom...</option>
            </select>
          </div>
        ) : (
          <div className="relative flex items-center">
            <div className="absolute left-2.5 pointer-events-none text-slate-400">
              <Edit3 className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Misal: s.d. Juli 2026"
              className={`pl-8 pr-3 py-1.5 text-xs font-black rounded-xl bg-white dark:bg-slate-900 border ${style.border} text-slate-800 dark:text-slate-100 shadow-sm transition-all outline-none w-48`}
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Switch mode button */}
      <button
        type="button"
        onClick={() => {
          if (isManualMode) {
            setIsManualMode(false);
            if (!ALL_PRESET_LIST.includes(value)) {
              onChange('s.d. Juli 2026');
            }
          } else {
            setIsManualMode(true);
          }
        }}
        className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer ${style.btnHover}`}
        title={isManualMode ? 'Kembali ke Dropdown Periode' : 'Beralih ke Input Teks Manual'}
      >
        {isManualMode ? (
          <>
            <ListFilter className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline">Pilih Dropdown</span>
          </>
        ) : (
          <>
            <Edit3 className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline">Ketik Manual</span>
          </>
        )}
      </button>
    </div>
  );
};
