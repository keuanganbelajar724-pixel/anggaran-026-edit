import React from 'react';
import { 
  Clock, 
  Calendar, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  BookOpen, 
  Users,
  ChevronRight
} from 'lucide-react';
import { LLATEvent } from '../../types/llat';
import { getCountdownInfo, getPriorityBadge, getStatusBadge } from '../../data/defaultLlatData';

interface LLATTimelineViewProps {
  events: LLATEvent[];
  onSelectEvent: (event: LLATEvent) => void;
}

export const LLATTimelineView: React.FC<LLATTimelineViewProps> = ({
  events,
  onSelectEvent
}) => {
  // Sort events chronologically by tanggal_batas then urutan
  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => {
      const cmp = a.tanggal_batas.localeCompare(b.tanggal_batas);
      if (cmp !== 0) return cmp;
      return (a.urutan || 0) - (b.urutan || 0);
    });
  }, [events]);

  // Group events by tanggal_batas
  const groupedByDate = React.useMemo(() => {
    const groups: { dateStr: string; items: LLATEvent[] }[] = [];
    let currentDate = '';
    let currentGroup: LLATEvent[] = [];

    sortedEvents.forEach((ev) => {
      if (ev.tanggal_batas !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ dateStr: currentDate, items: currentGroup });
        }
        currentDate = ev.tanggal_batas;
        currentGroup = [ev];
      } else {
        currentGroup.push(ev);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ dateStr: currentDate, items: currentGroup });
    }

    return groups;
  }, [sortedEvents]);

  if (groupedByDate.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
          Tidak ada kegiatan LLAT yang sesuai dengan filter
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Coba reset filter atau pilih tahun/bulan lain.
        </p>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-7">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>📍 ALUR TIMELINE LANGKAH-LANGKAH AKHIR TAHUN</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Urutan kronologis batas akhir pengajuan dan penyelesaian per tanggal
          </p>
        </div>
        <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          {sortedEvents.length} Kegiatan Terjadwal
        </span>
      </div>

      <div className="relative pl-4 sm:pl-8 before:absolute before:left-[19px] sm:before:left-[35px] before:top-4 before:bottom-4 before:w-[3px] before:bg-gradient-to-b before:from-indigo-500 before:via-blue-500 before:to-slate-300 dark:before:to-slate-700 space-y-8">
        {groupedByDate.map((group, groupIdx) => {
          const dateObj = new Date(group.dateStr + 'T00:00:00');
          const isToday = group.dateStr === todayStr;
          const isPast = group.dateStr < todayStr;

          const dayNumber = dateObj.getDate();
          const monthShort = dateObj.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
          const fullDateIndo = dateObj.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });

          return (
            <div key={group.dateStr} className="relative group">
              {/* Date Milestone Pill on the left stem */}
              <div className="flex items-start gap-4 sm:gap-6">
                <div
                  className={`relative z-10 shrink-0 w-10 sm:w-14 h-10 sm:h-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-md border-2 transition-transform group-hover:scale-105 ${
                    isToday
                      ? 'bg-rose-600 text-white border-white ring-4 ring-rose-400/50'
                      : isPast
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-indigo-600 text-white border-indigo-200 dark:border-indigo-800'
                  }`}
                >
                  <span className="text-[11px] sm:text-base leading-none font-extrabold">{dayNumber}</span>
                  <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-wider opacity-90">{monthShort}</span>
                </div>

                {/* Content Block for this Date */}
                <div className="flex-1 min-w-0 space-y-3 pt-0.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        {fullDateIndo}
                      </h4>
                      {isToday && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-xs animate-pulse">
                          HARI INI
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      {group.items.length} Kegiatan LLAT
                    </span>
                  </div>

                  {/* Branch Items list */}
                  <div className="space-y-2.5">
                    {group.items.map((item) => {
                      const priority = getPriorityBadge(item.prioritas);
                      const countdown = getCountdownInfo(item);
                      const status = getStatusBadge(item.status);

                      return (
                        <div
                          key={item.llat_id}
                          onClick={() => onSelectEvent(item)}
                          className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md transition-all cursor-pointer group/item flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                                {item.kode_kegiatan}
                              </span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${priority.badgeClass}`}>
                                {priority.label}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {item.kategori}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.badgeClass}`}>
                                {status.label}
                              </span>
                            </div>

                            <h5 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">
                              {item.nama_kegiatan}
                            </h5>

                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                              {item.deskripsi}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1 font-bold">
                                <Clock className="w-3.5 h-3.5 text-rose-500" />
                                Batas: {item.jam_batas} {item.timezone}
                              </span>
                              {item.target_pengguna && item.target_pengguna.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5 text-blue-500" />
                                  Target: {item.target_pengguna.slice(0, 3).join(', ')}
                                  {item.target_pengguna.length > 3 && ` +${item.target_pengguna.length - 3}`}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right Countdown & Action */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                            <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${countdown.badgeClass}`}>
                              {countdown.text}
                            </span>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover/item:translate-x-1 transition-transform">
                              Detail <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
