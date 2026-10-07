import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  List, 
  GitCommit, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Printer, 
  SlidersHorizontal, 
  ExternalLink, 
  Sparkles, 
  Bell, 
  BookOpen, 
  Tag, 
  Users, 
  FileDown, 
  ChevronRight, 
  RefreshCw,
  Info,
  ShieldAlert,
  Flame,
  ArrowRight
} from 'lucide-react';
import { 
  LLATEvent, 
  LLATCategory, 
  LLATSettings, 
  LLATStatus, 
  LLATPrioritas, 
  LLATTargetPengguna 
} from '../../types/llat';
import { 
  calculateEventStatus, 
  getCountdownInfo, 
  getPriorityBadge, 
  getStatusBadge 
} from '../../data/defaultLlatData';
import { LLATCalendarMonthView } from './LLATCalendarMonthView';
import { LLATTimelineView } from './LLATTimelineView';
import { LLATListView } from './LLATListView';
import { LLATDetailModal } from './LLATDetailModal';
import { LLATExportPdfModal } from './LLATExportPdfModal';

interface LLATMonitoringCenterProps {
  events: LLATEvent[];
  categories: LLATCategory[];
  settings: LLATSettings;
  isAdminAuthenticated: boolean;
  currentUser?: { name?: string; role?: string; satkerCode?: string } | null;
  onGoToAdmin?: () => void;
  theme?: string;
}

export const LLATMonitoringCenter: React.FC<LLATMonitoringCenterProps> = ({
  events,
  categories,
  settings,
  isAdminAuthenticated,
  currentUser,
  onGoToAdmin,
  theme
}) => {
  // View mode switcher: 'calendar' | 'list' | 'timeline'
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'timeline'>('calendar');

  // Filter States
  const [selectedYear, setSelectedYear] = useState<number>(settings.tahun_aktif || 2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(11); // 11 = Desember (0-indexed)
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [targetFilter, setTargetFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyToday, setOnlyToday] = useState<boolean>(false);

  // Modals
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<LLATEvent | null>(null);
  const [isExportPdfOpen, setIsExportPdfOpen] = useState<boolean>(false);

  // Available Years from events
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(events.map((e) => e.tahun_anggaran))).sort((a, b) => b - a);
    if (!years.includes(2026)) years.push(2026);
    return years;
  }, [events]);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Compute live dynamic status for every event
  const eventsWithLiveStatus = useMemo(() => {
    return events.map((ev) => {
      // Satker only sees is_active = true and publikasi = PUBLISHED
      const liveStatus = calculateEventStatus(ev);
      return {
        ...ev,
        status: ev.status_mode === 'MANUAL' && ev.manual_status ? ev.manual_status : liveStatus
      };
    });
  }, [events]);

  // Satker vs Admin visibility filter:
  // If not admin, only show is_active && publikasi === 'PUBLISHED'
  const accessibleEvents = useMemo(() => {
    if (isAdminAuthenticated) {
      return eventsWithLiveStatus;
    }
    return eventsWithLiveStatus.filter((e) => e.is_active && e.publikasi === 'PUBLISHED');
  }, [eventsWithLiveStatus, isAdminAuthenticated]);

  // Filtered Events based on user filters
  const filteredEvents = useMemo(() => {
    return accessibleEvents.filter((ev) => {
      if (ev.tahun_anggaran !== selectedYear) return false;

      if (onlyToday) {
        if (ev.tanggal_batas !== todayStr) return false;
      }

      if (categoryFilter !== 'ALL' && ev.kategori !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && ev.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && ev.prioritas !== priorityFilter) return false;

      if (targetFilter !== 'ALL') {
        const matchesTarget = 
          ev.target_pengguna?.includes('SEMUA_SATKER') ||
          ev.target_pengguna?.includes(targetFilter);
        if (!matchesTarget) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          ev.nama_kegiatan.toLowerCase().includes(q) ||
          ev.kode_kegiatan.toLowerCase().includes(q) ||
          ev.kategori.toLowerCase().includes(q) ||
          ev.deskripsi.toLowerCase().includes(q) ||
          ev.dasar_hukum.toLowerCase().includes(q) ||
          ev.catatan?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [accessibleEvents, selectedYear, onlyToday, categoryFilter, statusFilter, priorityFilter, targetFilter, searchQuery, todayStr]);

  // KPI Calculations from accessible actual data
  const kpiStats = useMemo(() => {
    const yearEvents = accessibleEvents.filter((e) => e.tahun_anggaran === selectedYear);

    // Hari Ini
    const hariIniCount = yearEvents.filter((e) => e.tanggal_batas === todayStr).length;

    // 7 Hari Ke Depan
    const dToday = new Date(todayStr + 'T00:00:00');
    const d7Days = new Date(dToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    const d7DaysStr = `${d7Days.getFullYear()}-${String(d7Days.getMonth() + 1).padStart(2, '0')}-${String(d7Days.getDate()).padStart(2, '0')}`;
    
    const tujuhHariCount = yearEvents.filter((e) => {
      return e.tanggal_batas >= todayStr && e.tanggal_batas <= d7DaysStr;
    }).length;

    // Bulan Ini (current month of reference date)
    const curMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');
    const bulanIniCount = yearEvents.filter((e) => {
      return e.tanggal_batas.split('-')[1] === curMonthStr;
    }).length;

    // Selesai
    const selesaiCount = yearEvents.filter((e) => e.status === 'SELESAI').length;

    // Terlewat
    const terlewatCount = yearEvents.filter((e) => e.status === 'TERLEWAT').length;

    return {
      hariIni: hariIniCount,
      tujuhHari: tujuhHariCount,
      bulanIni: bulanIniCount,
      selesai: selesaiCount,
      terlewat: terlewatCount,
      total: yearEvents.length
    };
  }, [accessibleEvents, selectedYear, todayStr]);

  // NEXT DEADLINE (Upcoming Nearest Deadline)
  const nextDeadlineEvent = useMemo(() => {
    const upcoming = accessibleEvents
      .filter((e) => e.tahun_anggaran === selectedYear && e.tanggal_batas >= todayStr && e.status !== 'SELESAI')
      .sort((a, b) => a.tanggal_batas.localeCompare(b.tanggal_batas));
    return upcoming[0] || null;
  }, [accessibleEvents, selectedYear, todayStr]);

  // 7 HARI KE DEPAN ITEMS (Max 3 important items)
  const next7DaysEvents = useMemo(() => {
    const dToday = new Date(todayStr + 'T00:00:00');
    const d7Days = new Date(dToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    const d7DaysStr = `${d7Days.getFullYear()}-${String(d7Days.getMonth() + 1).padStart(2, '0')}-${String(d7Days.getDate()).padStart(2, '0')}`;

    return accessibleEvents
      .filter((e) => e.tahun_anggaran === selectedYear && e.tanggal_batas >= todayStr && e.tanggal_batas <= d7DaysStr)
      .sort((a, b) => a.tanggal_batas.localeCompare(b.tanggal_batas))
      .slice(0, 4);
  }, [accessibleEvents, selectedYear, todayStr]);

  // SUDAH TERLEWAT ITEMS (Attention required)
  const overdueEvents = useMemo(() => {
    return accessibleEvents
      .filter((e) => e.tahun_anggaran === selectedYear && e.status === 'TERLEWAT')
      .sort((a, b) => b.tanggal_batas.localeCompare(a.tanggal_batas));
  }, [accessibleEvents, selectedYear]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Hero Command Center Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-2xl border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute right-1/4 bottom-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                <CalendarIcon className="w-4 h-4" />
                <span>LLAT COMMAND CENTER</span>
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 text-white text-xs font-bold font-mono border border-white/10">
                KPPN TIPE A1 SEMARANG I (026)
              </span>
              <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 text-xs font-extrabold border border-blue-500/30">
                TA {selectedYear}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              {settings.menu_title || 'Monitoring LLAT'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {settings.menu_description || 'Pusat informasi, kalender dan pemantauan batas waktu Langkah-Langkah dalam Menghadapi Akhir Tahun Anggaran untuk KPPN Semarang I dan Satuan Kerja.'}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsExportPdfOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs border border-white/20 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-sky-400" />
              <span>Unduh Kalender PDF</span>
            </button>

            {isAdminAuthenticated && onGoToAdmin && (
              <button
                type="button"
                onClick={onGoToAdmin}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Kelola Kalender (Admin)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* HIGHLIGHT: DEADLINE TERDEKAT & COUNTDOWN BANNER (Section 18 & 4) */}
      {nextDeadlineEvent && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-900 via-red-900 to-amber-900 text-white p-5 sm:p-6 shadow-xl border border-rose-700/80 animate-pulse-subtle">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white text-rose-900 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Flame className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                  DEADLINE TERDEKAT BERIKUTNYA
                </span>
                <span className="font-mono text-xs font-black text-amber-300">
                  {nextDeadlineEvent.kode_kegiatan}
                </span>
                <span className="text-xs px-2 py-0.2 rounded-md bg-rose-800/80 text-rose-100 font-bold">
                  {nextDeadlineEvent.kategori}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white truncate leading-snug">
                {nextDeadlineEvent.nama_kegiatan}
              </h2>

              <p className="text-xs text-rose-100/90 line-clamp-1">
                Batas Akhir: {new Date(nextDeadlineEvent.tanggal_batas + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • Pukul {nextDeadlineEvent.jam_batas} {nextDeadlineEvent.timezone}
              </p>
            </div>

            {/* Countdown Badge & Button */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-200 block">Sisa Waktu</span>
                <span className="text-sm sm:text-base font-black text-white font-mono">
                  {getCountdownInfo(nextDeadlineEvent).text}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetailEvent(nextDeadlineEvent)}
                className="px-5 py-3 rounded-xl bg-white text-rose-950 font-black text-xs hover:bg-rose-50 shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Lihat Detail</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY KPI CARDS (Section 5) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Hari Ini */}
        <div 
          onClick={() => {
            setOnlyToday(true);
            setViewMode('list');
          }}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              HARI INI
            </span>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
              Deadline
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 group-hover:text-rose-600 transition-colors">
            {kpiStats.hariIni}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Kegiatan jatuh tempo hari ini</p>
        </div>

        {/* 7 Hari Ke Depan */}
        <div 
          onClick={() => {
            setOnlyToday(false);
            setViewMode('timeline');
          }}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              7 HARI KE DEPAN
            </span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
              Segera
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 group-hover:text-amber-600 transition-colors">
            {kpiStats.tujuhHari}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Kegiatan dalam 7 hari ke depan</p>
        </div>

        {/* Bulan Ini */}
        <div 
          onClick={() => {
            setOnlyToday(false);
            setViewMode('calendar');
          }}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              BULAN INI
            </span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
              Kalender
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 group-hover:text-blue-600 transition-colors">
            {kpiStats.bulanIni}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Total kegiatan pada bulan ini</p>
        </div>

        {/* Selesai / Terlewat Status */}
        <div 
          onClick={() => {
            setOnlyToday(false);
            setViewMode('list');
          }}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              SELESAI / TERLAKSANA
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
              {kpiStats.total} Total
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 group-hover:text-emerald-600 transition-colors">
            {kpiStats.selesai}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {kpiStats.terlewat > 0 ? `${kpiStats.terlewat} kegiatan lewat batas` : 'Semua kegiatan terpantau'}
          </p>
        </div>
      </div>

      {/* QUICK WIDGETS ROW: 7 HARI KE DEPAN & PERLU PERHATIAN (Section 30 & 31) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kegiatan 7 Hari Ke Depan Widget */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>KEGIATAN 7 HARI KE DEPAN (MINGGU INI)</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                setOnlyToday(false);
                setViewMode('timeline');
              }}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Lihat Timeline</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {next7DaysEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Tidak ada batas akhir kegiatan dalam 7 hari ke depan.
              </p>
            ) : (
              next7DaysEvents.map((ev) => {
                const countdown = getCountdownInfo(ev);
                const priority = getPriorityBadge(ev.prioritas);

                return (
                  <div
                    key={ev.llat_id}
                    onClick={() => setSelectedDetailEvent(ev)}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-900 text-amber-300">
                          {ev.kode_kegiatan}
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${priority.badgeClass}`}>
                          {priority.label}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {ev.nama_kegiatan}
                      </h5>
                    </div>

                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 ${countdown.badgeClass}`}>
                      {countdown.text}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Perlu Perhatian (Kegiatan Lewat Batas) Widget */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h4 className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>PERLU PERHATIAN (SUDAH TERLEWAT)</span>
            </h4>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
              {overdueEvents.length} Kegiatan
            </span>
          </div>

          <div className="space-y-2">
            {overdueEvents.length === 0 ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 py-3 text-center font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Bagus! Tidak ada kegiatan yang terlewat melewati batas akhir.</span>
              </p>
            ) : (
              overdueEvents.slice(0, 4).map((ev) => (
                <div
                  key={ev.llat_id}
                  onClick={() => setSelectedDetailEvent(ev)}
                  className="p-3 rounded-xl border border-rose-100 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 space-y-0.5">
                    <span className="font-mono text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-600 text-white">
                      {ev.kode_kegiatan}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-rose-600">
                      {ev.nama_kegiatan}
                    </h5>
                  </div>

                  <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 whitespace-nowrap shrink-0">
                    Batas: {ev.tanggal_batas}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FILTER & VIEW SWITCHER TOOLBAR (Section 8 & 15 & 40) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        {/* Row 1: View Mode Switcher & Quick Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs">
            <button
              type="button"
              onClick={() => {
                setOnlyToday(false);
                setViewMode('calendar');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'calendar' && !onlyToday
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>📅 Kalender</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlyToday(false);
                setViewMode('list');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'list' && !onlyToday
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5 text-blue-500" />
              <span>📋 Daftar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlyToday(false);
                setViewMode('timeline');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'timeline' && !onlyToday
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5 text-purple-500" />
              <span>📍 Timeline</span>
            </button>
          </div>

          {/* Quick Buttons: HARI INI & RESET */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setOnlyToday(!onlyToday);
                if (!onlyToday) setViewMode('list');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                onlyToday
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              <span>🔴 Hari Ini</span>
              {onlyToday && <span>(Aktif)</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setTargetFilter('ALL');
                setSearchQuery('');
                setOnlyToday(false);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
            >
              Reset Filter
            </button>
          </div>
        </div>

        {/* Row 2: Comprehensive Filter Inputs (Section 15) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Tahun Anggaran */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>TA {yr}</option>
            ))}
          </select>

          {/* Kategori */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.nama}>{c.nama}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
          >
            <option value="ALL">Semua Status</option>
            <option value="HARI_INI">HARI INI</option>
            <option value="SEGERA">SEGERA JATUH TEMPO</option>
            <option value="BERJALAN">BERJALAN</option>
            <option value="BELUM_DIMULAI">BELUM DIMULAI</option>
            <option value="SELESAI">SELESAI</option>
            <option value="TERLEWAT">TERLEWAT</option>
          </select>

          {/* Prioritas */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="KRITIS">KRITIS</option>
            <option value="PENTING">PENTING</option>
            <option value="NORMAL">NORMAL</option>
          </select>

          {/* Target Pengguna */}
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
          >
            <option value="ALL">Semua Target Satker</option>
            <option value="BENDAHARA">Bendahara</option>
            <option value="PPK">PPK</option>
            <option value="PPSPM">PPSPM</option>
            <option value="KPA">KPA</option>
            <option value="OPERATOR">Operator SAKTI</option>
            <option value="UAKPA">UAKPA / Akuntansi</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kegiatan LLAT..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
            />
          </div>
        </div>
      </div>

      {/* MAIN VIEW CONTENT CONTAINER */}
      <div>
        {viewMode === 'calendar' && !onlyToday && (
          <LLATCalendarMonthView
            events={filteredEvents}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onChangeMonth={(year, month) => {
              setSelectedYear(year);
              setSelectedMonth(month);
            }}
            onSelectEvent={(event) => setSelectedDetailEvent(event)}
          />
        )}

        {viewMode === 'timeline' && !onlyToday && (
          <LLATTimelineView
            events={filteredEvents}
            onSelectEvent={(event) => setSelectedDetailEvent(event)}
          />
        )}

        {(viewMode === 'list' || onlyToday) && (
          <LLATListView
            events={filteredEvents}
            onSelectEvent={(event) => setSelectedDetailEvent(event)}
            searchQuery={searchQuery}
          />
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedDetailEvent && (
        <LLATDetailModal
          event={selectedDetailEvent}
          isAdmin={isAdminAuthenticated}
          onClose={() => setSelectedDetailEvent(null)}
          onEdit={isAdminAuthenticated && onGoToAdmin ? () => {
            setSelectedDetailEvent(null);
            onGoToAdmin();
          } : undefined}
        />
      )}

      {/* EXPORT PDF MODAL */}
      {isExportPdfOpen && (
        <LLATExportPdfModal
          events={accessibleEvents.filter((e) => e.tahun_anggaran === selectedYear)}
          categories={categories}
          currentYear={selectedYear}
          onClose={() => setIsExportPdfOpen(false)}
        />
      )}
    </div>
  );
};
