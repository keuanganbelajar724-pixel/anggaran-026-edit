import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Inbox,
  CheckSquare
} from 'lucide-react';
import { LLATEvent } from '../../types/llat';
import { 
  getCountdownInfo, 
  getPriorityBadge, 
  getStatusBadge,
  getDeadlineTypeBadge,
  getVerificationBadge 
} from '../../data/defaultLlatData';

interface LLATCalendarWeekViewProps {
  events: LLATEvent[];
  initialDate?: string; // YYYY-MM-DD
  onSelectEvent: (event: LLATEvent) => void;
}

export const LLATCalendarWeekView: React.FC<LLATCalendarWeekViewProps> = ({
  events,
  initialDate = '2026-12-07',
  onSelectEvent
}) => {
  // Current anchor date (default early Dec 2026 or today)
  const [currentAnchor, setCurrentAnchor] = useState<Date>(() => {
    try {
      return new Date(initialDate + 'T00:00:00');
    } catch {
      return new Date(2026, 11, 7);
    }
  });

  // Calculate Monday of current anchor week
  const weekDays = useMemo(() => {
    const anchor = new Date(currentAnchor);
    const dayOfWeek = anchor.getDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(anchor);
    monday.setDate(anchor.getDate() + diffToMonday);

    const days: { date: Date; dateStr: string; dayName: string; dayNum: number }[] = [];
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const dStr = String(d.getDate()).padStart(2, '0');
      days.push({
        date: d,
        dateStr: `${yStr}-${mStr}-${dStr}`,
        dayName: dayNames[i],
        dayNum: d.getDate()
      });
    }

    return days;
  }, [currentAnchor]);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const handlePrevWeek = () => {
    const prev = new Date(currentAnchor);
    prev.setDate(prev.getDate() - 7);
    setCurrentAnchor(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentAnchor);
    next.setDate(next.getDate() + 7);
    setCurrentAnchor(next);
  };

  const handleJumpTo = (year: number, month: number, day: number) => {
    setCurrentAnchor(new Date(year, month, day));
  };

  // Group events by date for this week
  const eventsByDate = useMemo(() => {
    const map: Record<string, { event: LLATEvent; isPenerimaan: boolean; isPenyelesaian: boolean }[]> = {};
    weekDays.forEach(wd => { map[wd.dateStr] = []; });

    events.forEach(ev => {
      const penDate = ev.tanggal_penerimaan || ev.tanggal_batas;
      if (penDate && map[penDate]) {
        map[penDate].push({
          event: ev,
          isPenerimaan: true,
          isPenyelesaian: false
        });
      }

      if (ev.tanggal_penyelesaian && ev.tanggal_penyelesaian !== penDate && map[ev.tanggal_penyelesaian]) {
        map[ev.tanggal_penyelesaian].push({
          event: ev,
          isPenerimaan: false,
          isPenyelesaian: true
        });
      }
    });

    return map;
  }, [events, weekDays]);

  const totalEventsThisWeek = useMemo(() => {
    return Object.values(eventsByDate).reduce((acc, list) => acc + list.length, 0);
  }, [eventsByDate]);

  const weekTitle = useMemo(() => {
    if (weekDays.length === 0) return '';
    const first = weekDays[0].date;
    const last = weekDays[6].date;
    const firstM = first.toLocaleDateString('id-ID', { month: 'short' });
    const lastM = last.toLocaleDateString('id-ID', { month: 'short' });
    const y = last.getFullYear();

    if (firstM === lastM) {
      return `${first.getDate()} - ${last.getDate()} ${firstM} ${y}`;
    }
    return `${first.getDate()} ${firstM} - ${last.getDate()} ${lastM} ${y}`;
  }, [weekDays]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
      {/* Week Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center text-white shadow-xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Minggu: {weekTitle}
              </h4>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {totalEventsThisWeek} Tenggat
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tinjauan jadwal mingguan dengan rincian batas waktu per hari
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Minggu Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleJumpTo(2026, 9, 12)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
          >
            Okt 2026
          </button>

          <button
            onClick={() => handleJumpTo(2026, 11, 7)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
          >
            Des 2026 (Puncak)
          </button>

          <button
            onClick={() => handleJumpTo(2027, 0, 11)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
          >
            Jan 2027 (Tutup Buku)
          </button>

          <button
            onClick={handleNextWeek}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Minggu Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days Grid - Horizontal scroll on small screen */}
      <div className="p-4 sm:p-6 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 min-w-[700px]">
          {weekDays.map(wd => {
            const dayItems = eventsByDate[wd.dateStr] || [];
            const isToday = wd.dateStr === todayStr;
            const isWeekend = wd.dayName === 'Sabtu' || wd.dayName === 'Minggu';

            return (
              <div
                key={wd.dateStr}
                className={`rounded-2xl border flex flex-col min-h-[360px] ${
                  isToday
                    ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 ring-2 ring-blue-500'
                    : isWeekend
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                {/* Day Header */}
                <div className={`p-3 border-b text-center ${
                  isToday
                    ? 'bg-blue-600 text-white rounded-t-[14px]'
                    : isWeekend
                    ? 'bg-slate-100/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-800 rounded-t-[14px]'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-t-[14px]'
                }`}>
                  <div className={`text-xs font-black uppercase tracking-wider ${
                    isToday ? 'text-white' : isWeekend ? 'text-rose-500 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
                  }`}>
                    {wd.dayName}
                  </div>
                  <div className={`text-lg font-black mt-0.5 ${
                    isToday ? 'text-white' : 'text-slate-900 dark:text-white'
                  }`}>
                    {wd.dayNum}
                  </div>
                  <div className={`text-[10px] ${isToday ? 'text-blue-100' : 'text-slate-400'}`}>
                    {dayItems.length} Tenggat
                  </div>
                </div>

                {/* Day Content */}
                <div className="p-2 flex-1 space-y-2 overflow-y-auto max-h-[460px]">
                  {dayItems.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-3 text-center text-slate-300 dark:text-slate-600 text-[11px] italic">
                      Tidak ada batas waktu
                    </div>
                  ) : (
                    dayItems.map((item, idx) => {
                      const priority = getPriorityBadge(item.event.prioritas);
                      const isCrit = item.event.prioritas === 'KRITIS';

                      return (
                        <div
                          key={`${item.event.llat_id}-week-${idx}`}
                          onClick={() => onSelectEvent(item.event)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer group text-left ${
                            item.isPenerimaan
                              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 hover:border-blue-400'
                              : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 hover:border-indigo-400'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-900 text-amber-300">
                              {item.event.kode_kegiatan}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${priority.badgeClass}`}>
                              {priority.label}
                            </span>
                          </div>

                          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                            {item.isPenerimaan ? (
                              <span className="text-blue-700 dark:text-blue-300">📥 Batas Penerimaan</span>
                            ) : (
                              <span className="text-indigo-700 dark:text-indigo-300">🏁 Batas Penyelesaian</span>
                            )}
                          </div>

                          <h5 className="text-[11px] font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {item.event.nama_kegiatan}
                          </h5>

                          <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {item.event.jam_batas || '17:00'}
                            </span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                              Detail &rarr;
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
