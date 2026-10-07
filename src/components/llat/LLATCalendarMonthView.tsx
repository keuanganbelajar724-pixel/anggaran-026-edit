import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { LLATEvent } from '../../types/llat';
import { getCountdownInfo, getPriorityBadge } from '../../data/defaultLlatData';

interface LLATCalendarMonthViewProps {
  events: LLATEvent[];
  selectedYear: number;
  selectedMonth: number; // 0-indexed: 0 = Jan, 11 = Des, or -1 for current
  onChangeMonth: (year: number, month: number) => void;
  onSelectEvent: (event: LLATEvent) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];

export const LLATCalendarMonthView: React.FC<LLATCalendarMonthViewProps> = ({
  events,
  selectedYear,
  selectedMonth,
  onChangeMonth,
  onSelectEvent
}) => {
  // If month is invalid, default to December 2026 or current
  const activeYear = selectedYear || 2026;
  const activeMonth = selectedMonth >= 0 && selectedMonth <= 11 ? selectedMonth : 11; // default Des

  const [selectedDateEvents, setSelectedDateEvents] = useState<{
    dateStr: string;
    events: LLATEvent[];
  } | null>(null);

  // Calculate calendar grid
  // In JS, getDay() returns 0 for Sunday, 1 for Monday, etc.
  // We want Monday (1) as index 0, Sunday (0) as index 6
  const firstDayOfMonth = new Date(activeYear, activeMonth, 1);
  const rawFirstDay = firstDayOfMonth.getDay(); // 0 is Sun
  const startingDayIndex = rawFirstDay === 0 ? 6 : rawFirstDay - 1; // 0 is Mon

  const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(activeYear, activeMonth, 0).getDate();

  // Create date cells
  const cells: {
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    dateStr: string;
  }[] = [];

  // Previous month padding
  for (let i = startingDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = activeMonth === 0 ? 11 : activeMonth - 1;
    const prevYear = activeMonth === 0 ? activeYear - 1 : activeYear;
    const mStr = String(prevMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    cells.push({
      day,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      dateStr: `${prevYear}-${mStr}-${dStr}`
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const mStr = String(activeMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    cells.push({
      day,
      month: activeMonth,
      year: activeYear,
      isCurrentMonth: true,
      dateStr: `${activeYear}-${mStr}-${dStr}`
    });
  }

  // Next month padding to fill complete grid of 35 or 42 cells
  const remainingCells = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonth = activeMonth === 11 ? 0 : activeMonth + 1;
    const nextYear = activeMonth === 11 ? activeYear + 1 : activeYear;
    const mStr = String(nextMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    cells.push({
      day,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      dateStr: `${nextYear}-${mStr}-${dStr}`
    });
  }

  // Map events to dateStr (checking tanggal_batas as primary milestone date)
  const eventsByDate = React.useMemo(() => {
    const map: Record<string, LLATEvent[]> = {};
    events.forEach((ev) => {
      if (!map[ev.tanggal_batas]) {
        map[ev.tanggal_batas] = [];
      }
      map[ev.tanggal_batas].push(ev);
    });
    return map;
  }, [events]);

  const handlePrevMonth = () => {
    if (activeMonth === 0) {
      onChangeMonth(activeYear - 1, 11);
    } else {
      onChangeMonth(activeYear, activeMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (activeMonth === 11) {
      onChangeMonth(activeYear + 1, 0);
    } else {
      onChangeMonth(activeYear, activeMonth + 1);
    }
  };

  const todayStr = React.useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Month Navigation Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <span>{MONTH_NAMES[activeMonth]} {activeYear}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kalender Langkah-Langkah Akhir Tahun Anggaran {activeYear}
            </p>
          </div>
        </div>

        {/* Prev / Next & Month Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all shadow-2xs"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              const now = new Date();
              onChangeMonth(now.getFullYear(), now.getMonth());
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-all shadow-2xs"
          >
            Bulan Ini
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all shadow-2xs"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 text-center text-xs font-black text-slate-600 dark:text-slate-400 py-2.5">
        {DAY_NAMES.map((day, idx) => (
          <div key={day} className={idx >= 5 ? 'text-rose-500 dark:text-rose-400' : ''}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid Cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20">
        {cells.map((cell, idx) => {
          const dayEvents = eventsByDate[cell.dateStr] || [];
          const hasEvents = dayEvents.length > 0;
          const isToday = cell.dateStr === todayStr;

          // Highest priority among day's events
          const hasKritis = dayEvents.some((e) => e.prioritas === 'KRITIS');
          const hasPenting = dayEvents.some((e) => e.prioritas === 'PENTING');

          return (
            <div
              key={idx}
              onClick={() => {
                if (hasEvents) {
                  setSelectedDateEvents({
                    dateStr: cell.dateStr,
                    events: dayEvents
                  });
                }
              }}
              className={`min-h-[96px] sm:min-h-[110px] p-2 flex flex-col justify-between transition-all relative group ${
                cell.isCurrentMonth
                  ? 'bg-white dark:bg-slate-900'
                  : 'bg-slate-50/60 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 opacity-60'
              } ${
                hasEvents ? 'cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20' : ''
              } ${
                isToday ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/20' : ''
              }`}
            >
              {/* Day Number and Badges */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs sm:text-sm font-black w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-xs'
                      : hasKritis
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-extrabold'
                      : cell.isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400'
                  }`}
                >
                  {cell.day}
                </span>

                {isToday && (
                  <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    Hari Ini
                  </span>
                )}
              </div>

              {/* Event indicators - Clean and non-cluttered */}
              {hasEvents && (
                <div className="mt-1 space-y-1">
                  {/* Summary Dot Badge as specified: ● 3 kegiatan */}
                  <div
                    className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black flex items-center gap-1 transition-transform group-hover:scale-[1.02] ${
                      hasKritis
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300/60'
                        : hasPenting
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300/60'
                        : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-200 border border-indigo-300/60'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        hasKritis ? 'bg-rose-500 animate-pulse' : hasPenting ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                    />
                    <span className="truncate">
                      {dayEvents.length} Kegiatan LLAT
                    </span>
                  </div>

                  {/* Micro Preview of first event title */}
                  <div className="hidden sm:block text-[10px] text-slate-600 dark:text-slate-400 font-semibold truncate leading-tight">
                    {dayEvents[0].nama_kegiatan}
                  </div>
                </div>
              )}

              {/* Empty state filler */}
              {!hasEvents && (
                <div className="h-4" />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Date Drawer / Modal for Detailed Events */}
      {selectedDateEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Daftar Batas Waktu LLAT
                </span>
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {new Date(selectedDateEvents.dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDateEvents(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 transition-all"
              >
                Tutup
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
              {selectedDateEvents.events.map((ev) => {
                const priority = getPriorityBadge(ev.prioritas);
                const countdown = getCountdownInfo(ev);

                return (
                  <div
                    key={ev.llat_id}
                    onClick={() => {
                      setSelectedDateEvents(null);
                      onSelectEvent(ev);
                    }}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                          {ev.kode_kegiatan}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${priority.badgeClass}`}>
                          {priority.label}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {ev.kategori}
                        </span>
                      </div>

                      <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {ev.jam_batas} {ev.timezone}
                      </span>
                    </div>

                    <h5 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                      {ev.nama_kegiatan}
                    </h5>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {ev.deskripsi}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <span className="text-slate-500 font-bold">
                        Batas: {ev.tanggal_batas}
                      </span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                        Lihat Detail Kegiatan →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
