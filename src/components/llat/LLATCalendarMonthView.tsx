import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  Info,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X,
  FileText,
  ShieldAlert,
  Inbox,
  CheckSquare
} from 'lucide-react';
import { LLATEvent } from '../../types/llat';
import { 
  getCountdownInfo, 
  getPriorityBadge, 
  getStatusBadge,
  getVerificationBadge,
  getDeadlineTypeBadge 
} from '../../data/defaultLlatData';

interface LLATCalendarMonthViewProps {
  events: LLATEvent[];
  selectedYear: number;
  selectedMonth: number; // 0-indexed: 0 = Jan, 9 = Okt, 11 = Des
  onChangeMonth: (year: number, month: number) => void;
  onSelectEvent: (event: LLATEvent) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];

export interface DateEventItem {
  event: LLATEvent;
  isPenerimaan: boolean;
  isPenyelesaian: boolean;
}

export const LLATCalendarMonthView: React.FC<LLATCalendarMonthViewProps> = ({
  events,
  selectedYear,
  selectedMonth,
  onChangeMonth,
  onSelectEvent
}) => {
  const activeYear = selectedYear || 2026;
  const activeMonth = selectedMonth >= 0 && selectedMonth <= 11 ? selectedMonth : 9; // Default Oktober (index 9)

  // Selected date panel
  const [selectedDateEvents, setSelectedDateEvents] = useState<{
    dateStr: string;
    items: DateEventItem[];
  } | null>(null);

  // Month navigation calculation
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

  // Map events to dateStr tracking both Penerimaan and Penyelesaian milestones
  const eventsByDate = React.useMemo(() => {
    const map: Record<string, DateEventItem[]> = {};

    events.forEach((ev) => {
      // 1. Tanggal Batas / Penerimaan Dokumen
      const penerimaanDate = ev.tanggal_penerimaan || ev.tanggal_batas;
      if (penerimaanDate) {
        if (!map[penerimaanDate]) map[penerimaanDate] = [];
        // Check if not already added
        const exists = map[penerimaanDate].some(item => item.event.llat_id === ev.llat_id && item.isPenerimaan);
        if (!exists) {
          map[penerimaanDate].push({
            event: ev,
            isPenerimaan: true,
            isPenyelesaian: false
          });
        }
      }

      // 2. Tanggal Batas Penyelesaian (jika berbeda dari tanggal penerimaan)
      if (ev.tanggal_penyelesaian && ev.tanggal_penyelesaian !== penerimaanDate) {
        const selDate = ev.tanggal_penyelesaian;
        if (!map[selDate]) map[selDate] = [];
        const exists = map[selDate].some(item => item.event.llat_id === ev.llat_id && item.isPenyelesaian);
        if (!exists) {
          map[selDate].push({
            event: ev,
            isPenerimaan: false,
            isPenyelesaian: true
          });
        }
      }
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
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Month Navigation Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {MONTH_NAMES[activeMonth]} {activeYear}
                </h4>
                {activeYear === 2026 && activeMonth >= 9 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                    Periode Kritis LLAT
                  </span>
                )}
                {activeYear === 2027 && activeMonth === 0 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                    Penutupan Buku TA 2026
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Klik pada tanggal untuk membuka panel rincian agenda dan tenggat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => onChangeMonth(2026, 8)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                activeYear === 2026 && activeMonth === 8
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Awal Triwulan IV (September 2026)"
            >
              Sep 2026
            </button>

            <button
              onClick={() => onChangeMonth(2026, 9)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                activeYear === 2026 && activeMonth === 9
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Kembali ke Awal Periode LLAT (Oktober 2026)"
            >
              Okt 2026
            </button>

            <button
              onClick={() => onChangeMonth(2026, 10)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                activeYear === 2026 && activeMonth === 10
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Bulan November 2026 (TUP & Pengesahan BLU)"
            >
              Nov 2026
            </button>

            <button
              onClick={() => onChangeMonth(2026, 11)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                activeYear === 2026 && activeMonth === 11
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Puncak Akhir Tahun (Desember 2026)"
            >
              Des 2026
            </button>

            <button
              onClick={() => onChangeMonth(2027, 0)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                activeYear === 2027 && activeMonth === 0
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Penyelesaian Awal Tahun (Januari 2027)"
            >
              Jan 2027
            </button>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend indicator */}
        <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-700 dark:text-slate-300">Penanda:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
              <span>📥 Batas Penerimaan Dokumen</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600"></span>
              <span>🏁 Batas Penyelesaian SP2D/Proses</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Prioritas Kritis</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            *Seluruh agenda bersumber dari Sosialisasi LLAT TA 2026
          </span>
        </div>

        {/* Days of Week Bar */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/60 text-center font-bold text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 py-2.5">
          {DAY_NAMES.map((d, idx) => (
            <div key={d} className={idx >= 5 ? 'text-rose-500 dark:text-rose-400' : ''}>
              {d}
            </div>
          ))}
        </div>

        {/* 7-Columns Calendar Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800 bg-slate-100 dark:bg-slate-800">
          {cells.map((cell) => {
            const dateItems = eventsByDate[cell.dateStr] || [];
            const isToday = cell.dateStr === todayStr;
            const hasEvents = dateItems.length > 0;
            const hasCritical = dateItems.some(i => i.event.prioritas === 'KRITIS');
            const hasPenerimaan = dateItems.some(i => i.isPenerimaan);
            const hasPenyelesaian = dateItems.some(i => i.isPenyelesaian);
            const isSelected = selectedDateEvents?.dateStr === cell.dateStr;

            // Background dynamic tinting based on event density and critical status
            let cellBgClass = 'bg-white dark:bg-slate-900';
            if (!cell.isCurrentMonth) {
              cellBgClass = 'opacity-40 bg-slate-50/70 dark:bg-slate-950/40';
            } else if (hasCritical) {
              cellBgClass = 'bg-rose-50/40 dark:bg-rose-950/20';
            } else if (hasEvents) {
              cellBgClass = 'bg-blue-50/25 dark:bg-blue-950/15';
            }

            return (
              <div
                key={cell.dateStr}
                onClick={() => {
                  if (hasEvents) {
                    setSelectedDateEvents({
                      dateStr: cell.dateStr,
                      items: dateItems
                    });
                  } else {
                    setSelectedDateEvents(null);
                  }
                }}
                className={`min-h-[100px] sm:min-h-[130px] p-1.5 sm:p-2.5 ${cellBgClass} transition-all cursor-pointer relative flex flex-col justify-between ${
                  isToday ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/50 dark:bg-blue-950/40' : ''
                } ${
                  isSelected ? 'ring-2 ring-indigo-500 ring-inset shadow-inner bg-indigo-50/40 dark:bg-indigo-950/40' : ''
                } hover:bg-slate-100/70 dark:hover:bg-slate-800/80 group`}
              >
                {/* Cell Top Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-black rounded-lg w-6 h-6 transition-transform group-hover:scale-110 ${
                        isToday
                          ? 'bg-blue-600 text-white shadow-md'
                          : hasCritical
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-black'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cell.day}
                    </span>

                    {/* Dual Milestone badges if both exist */}
                    {cell.isCurrentMonth && (hasPenerimaan || hasPenyelesaian) && (
                      <div className="flex items-center gap-0.5">
                        {hasPenerimaan && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Ada batas penerimaan berkas" />
                        )}
                        {hasPenyelesaian && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="Ada batas penyelesaian SP2D/proses" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Indicator count */}
                  {hasEvents && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-2xs ${
                      hasCritical
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-indigo-600 text-white'
                    }`}>
                      {dateItems.length}
                    </span>
                  )}
                </div>

                {/* Event Snippets (max 2 items) */}
                <div className="space-y-1.5 flex-1 overflow-hidden">
                  {dateItems.slice(0, 2).map((item, itemIdx) => {
                    const isCrit = item.event.prioritas === 'KRITIS';
                    return (
                      <div
                        key={`${item.event.llat_id}-${itemIdx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(item.event);
                        }}
                        className={`px-1.5 py-1 rounded-md text-[10px] leading-tight font-bold truncate transition-all flex items-center gap-1 shadow-2xs hover:scale-[1.02] cursor-pointer ${
                          isCrit
                            ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                            : item.isPenerimaan
                            ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
                        }`}
                        title={`${item.isPenerimaan ? '📥 Penerimaan: ' : '🏁 Penyelesaian: '}${item.event.nama_kegiatan}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isCrit ? 'bg-rose-500 animate-ping' : item.isPenerimaan ? 'bg-blue-500' : 'bg-indigo-500'
                        }`} />
                        <span className="truncate">
                          {item.isPenerimaan ? '📥 ' : '🏁 '}
                          <span className="font-mono text-[9px] mr-0.5">{item.event.kode_kegiatan}</span>
                          {item.event.nama_kegiatan}
                        </span>
                      </div>
                    );
                  })}

                  {/* Expand button if more than 2 items */}
                  {dateItems.length > 2 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDateEvents({
                          dateStr: cell.dateStr,
                          items: dateItems
                        });
                      }}
                      className="w-full text-center py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      +{dateItems.length - 2} kegiatan lagi
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Agenda Panel */}
      {selectedDateEvents && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-500/30 dark:border-indigo-500/40 p-4 sm:p-6 shadow-xl animate-fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-black">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Agenda Tanggal {new Date(selectedDateEvents.dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Terdapat {selectedDateEvents.items.length} tenggat dan batas waktu pada tanggal ini
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedDateEvents(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Tutup Panel Agenda"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {selectedDateEvents.items.map((item, idx) => {
              const priority = getPriorityBadge(item.event.prioritas);
              const countdown = getCountdownInfo(item.event);
              const deadlineType = getDeadlineTypeBadge(item.event.jenis_tenggat);
              const verification = getVerificationBadge(item.event.status_verifikasi);

              return (
                <div
                  key={`${item.event.llat_id}-panel-${idx}`}
                  onClick={() => onSelectEvent(item.event)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                        {item.event.kode_kegiatan}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        item.isPenerimaan
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200'
                      }`}>
                        {item.isPenerimaan ? '📥 Batas Penerimaan Dokumen' : '🏁 Batas Penyelesaian SP2D'}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${priority.badgeClass}`}>
                        {priority.label}
                      </span>
                    </div>

                    <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.event.nama_kegiatan}
                    </h5>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {item.event.deskripsi}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pukul {item.event.jam_batas || '17:00'} {item.event.timezone || 'WIB'}</span>
                    </div>

                    <span className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                      <span>Rincian</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
