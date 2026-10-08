import React, { useMemo, useState } from 'react';
import { 
  Clock, 
  Calendar, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  BookOpen, 
  Users,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Inbox,
  Flame,
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

interface LLATTimelineViewProps {
  events: LLATEvent[];
  onSelectEvent: (event: LLATEvent) => void;
}

interface MonthBlock {
  key: '2026-10' | '2026-11' | '2026-12' | '2027-01';
  title: string;
  subtitle: string;
  badge: string;
  themeColor: string;
  items: LLATEvent[];
}

export const LLATTimelineView: React.FC<LLATTimelineViewProps> = ({
  events,
  onSelectEvent
}) => {
  const [activeMonthTab, setActiveMonthTab] = useState<'ALL' | '2026-10' | '2026-11' | '2026-12' | '2027-01'>('ALL');

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Sort events chronologically by tanggal_batas then urutan
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aDate = a.tanggal_batas || '';
      const bDate = b.tanggal_batas || '';
      const cmp = aDate.localeCompare(bDate);
      if (cmp !== 0) return cmp;
      return (a.urutan || 0) - (b.urutan || 0);
    });
  }, [events]);

  // Group into 4 distinct visual blocks: Oktober 2026, November 2026, Desember 2026, Januari 2027
  const monthBlocks = useMemo<MonthBlock[]>(() => {
    const blocks: MonthBlock[] = [
      {
        key: '2026-10',
        title: '🍁 OKTOBER 2026',
        subtitle: 'Fase Persiapan & Pemutakhiran Rencana Penarikan Dana (RPD) Harian Akhir Tahun',
        badge: 'TA 2026 - Tahap Persiapan',
        themeColor: 'from-sky-500 to-blue-600',
        items: []
      },
      {
        key: '2026-11',
        title: '🍂 NOVEMBER 2026',
        subtitle: 'Fase Pendaftaran Kontrak Tahap I & Pengajuan Awal Permohonan TUP Akhir Tahun',
        badge: 'TA 2026 - Pra Cut-Off',
        themeColor: 'from-indigo-500 to-purple-600',
        items: []
      },
      {
        key: '2026-12',
        title: '❄️ DESEMBER 2026',
        subtitle: 'Puncak Akhir Tahun: SPM Gaji Jan 2027, SPM-LS, Bank Garansi, Setor Kas UP/TUP, & Cut-Off SPAN',
        badge: 'TA 2026 - Puncak Kritis',
        themeColor: 'from-rose-500 to-red-600',
        items: []
      },
      {
        key: '2027-01',
        title: '🗓️ JANUARI 2027',
        subtitle: 'Penyelesaian & Penutupan Buku TA 2026: Tutup Modul SAKTI BMN, LPJ Des, SHR MonSAKTI, & LKKL',
        badge: 'Terkait Penutupan TA 2026',
        themeColor: 'from-emerald-500 to-teal-600',
        items: []
      }
    ];

    sortedEvents.forEach((ev) => {
      const d = ev.tanggal_batas || '';
      if (d.startsWith('2026-10')) {
        blocks[0].items.push(ev);
      } else if (d.startsWith('2026-11')) {
        blocks[1].items.push(ev);
      } else if (d.startsWith('2026-12')) {
        blocks[2].items.push(ev);
      } else if (d.startsWith('2027-01') || d.startsWith('2027-02')) {
        blocks[3].items.push(ev);
      } else if (ev.tahun_anggaran === 2026 && d < '2026-10-01') {
        // Fallback for earlier 2026
        blocks[0].items.push(ev);
      }
    });

    return blocks;
  }, [sortedEvents]);

  const displayedBlocks = useMemo(() => {
    if (activeMonthTab === 'ALL') return monthBlocks;
    return monthBlocks.filter(b => b.key === activeMonthTab);
  }, [monthBlocks, activeMonthTab]);

  return (
    <div className="space-y-6">
      {/* Timeline Controls & Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>📍 TIMELINE KHUSUS AKHIR TAHUN ANGGARAN (OKTOBER 2026 — JANUARI 2027)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualisasi kepadatan tenggat dan kesinambungan proses penutupan buku TA 2026 hingga Januari 2027
            </p>
          </div>

          <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {sortedEvents.length} Agenda Terdaftar
          </span>
        </div>

        {/* Tab switcher for visual months */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveMonthTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeMonthTab === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Semua Bulan (Oktober — Januari)
          </button>

          {monthBlocks.map((b) => (
            <button
              key={b.key}
              onClick={() => setActiveMonthTab(b.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeMonthTab === b.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>{b.title.split(' ')[1]} {b.title.split(' ')[2]}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {b.items.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Render Each Month Block with Distinct Visual Identity */}
      <div className="space-y-8">
        {displayedBlocks.map((block) => (
          <div
            key={block.key}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            {/* Month Header Banner */}
            <div className={`p-5 bg-gradient-to-r ${block.themeColor} text-white flex flex-wrap items-center justify-between gap-3 shadow-xs`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg sm:text-xl font-black tracking-wide">
                    {block.title}
                  </h4>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-white/25 text-white backdrop-blur-xs">
                    {block.badge}
                  </span>
                </div>
                <p className="text-xs text-white/90 font-medium">
                  {block.subtitle}
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black">
                  {block.items.length}
                </span>
                <span className="text-xs font-bold text-white/80 block">
                  Kegiatan Terjadwal
                </span>
              </div>
            </div>

            {/* Activities List */}
            <div className="p-4 sm:p-7 space-y-4">
              {block.items.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  Tidak ada agenda spesifik yang tercatat pada bulan ini.
                </div>
              ) : (
                <div className="relative pl-4 sm:pl-8 before:absolute before:left-[19px] sm:before:left-[35px] before:top-4 before:bottom-4 before:w-[3px] before:bg-gradient-to-b before:from-indigo-400 before:via-blue-400 before:to-slate-300 dark:before:to-slate-700 space-y-6">
                  {block.items.map((event, idx) => {
                    const dateObj = new Date(event.tanggal_batas + 'T00:00:00');
                    const isToday = event.tanggal_batas === todayStr;
                    const priority = getPriorityBadge(event.prioritas);
                    const deadlineType = getDeadlineTypeBadge(event.jenis_tenggat);
                    const verification = getVerificationBadge(event.status_verifikasi);
                    const countdown = getCountdownInfo(event);

                    const dayNumber = dateObj.getDate();
                    const monthShort = dateObj.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
                    const fullDateIndo = dateObj.toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });

                    return (
                      <div key={`${event.llat_id}-timeline-${idx}`} className="relative flex items-start gap-3 sm:gap-6 group">
                        {/* Date Node Badge */}
                        <div className={`relative z-10 w-10 sm:w-16 h-10 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-black text-center shrink-0 border-2 transition-transform group-hover:scale-105 shadow-sm ${
                          isToday
                            ? 'bg-blue-600 text-white border-blue-400 shadow-blue-200'
                            : event.prioritas === 'KRITIS'
                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700'
                        }`}>
                          <span className="text-[10px] sm:text-xs uppercase font-extrabold leading-none opacity-80">
                            {monthShort}
                          </span>
                          <span className="text-base sm:text-xl font-black leading-none mt-0.5">
                            {dayNumber}
                          </span>
                        </div>

                        {/* Card Content */}
                        <div
                          onClick={() => onSelectEvent(event)}
                          className="flex-1 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                                  {event.kode_kegiatan}
                                </span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${priority.badgeClass}`}>
                                  Prioritas {priority.label}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${deadlineType.badgeClass}`}>
                                  {deadlineType.label}
                                </span>

                                {/* Distinct January 2027 TA 2026 label */}
                                {block.key === '2027-01' && (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                                    Penyelesaian Beban TA 2026
                                  </span>
                                )}
                              </div>

                              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {event.nama_kegiatan}
                              </h4>
                            </div>

                            <span className={`text-xs font-black px-3 py-1 rounded-xl shrink-0 ${countdown.badgeClass}`}>
                              {countdown.text}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {event.deskripsi}
                          </p>

                          {/* Specific sub-deadlines if present */}
                          {event.sub_deadlines && event.sub_deadlines.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Rincian Tahapan Tenggat:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {event.sub_deadlines.map((sub) => (
                                  <div key={sub.id} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{sub.label}:</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0 ml-2">{sub.tanggal}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Card Footer Info */}
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                <span>{fullDateIndo} (Pukul {event.jam_batas || '17:00'} {event.timezone || 'WIB'})</span>
                              </span>
                              <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                                <span>{event.file_sumber} - {event.halaman_sumber}</span>
                              </span>
                            </div>

                            <span className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                              <span>Detail Kegiatan</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
