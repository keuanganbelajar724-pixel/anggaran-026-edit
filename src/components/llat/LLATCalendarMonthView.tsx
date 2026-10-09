import React, { useState, useRef, useEffect } from 'react';
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
  CheckSquare,
  AlertTriangle,
  Flame,
  Flag,
  Bookmark,
  Layers,
  Search,
  Filter,
  Eye,
  CalendarCheck2,
  BellRing,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { LLATEvent } from '../../types/llat';
import { 
  getCountdownInfo, 
  getPriorityBadge, 
  getStatusBadge, 
  getVerificationBadge, 
  getDeadlineTypeBadge 
} from '../../data/defaultLlatData';
import { isWeekend, isHoliday } from '../../utils/llatWorkingDaysEngine';

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

// Visual category color palette helper with rich, accessible contrast & domain-native styling
function getCategoryColor(categoryName: string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
  tag: string;
  accent: string;
} {
  const c = (categoryName || '').toLowerCase();
  
  if (c.includes('rpd') || c.includes('halaman iii dipa') || c.includes('rencana penarikan')) {
    return {
      bg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
      text: 'text-emerald-950 dark:text-emerald-200',
      border: 'border-emerald-300/80 dark:border-emerald-600/70',
      dot: 'bg-emerald-500',
      tag: 'bg-emerald-600 text-white',
      accent: 'border-l-emerald-500'
    };
  }
  if (c.includes('kontrak') || c.includes('karwas')) {
    return {
      bg: 'bg-purple-500/15 dark:bg-purple-500/25',
      text: 'text-purple-950 dark:text-purple-200',
      border: 'border-purple-300/80 dark:border-purple-600/70',
      dot: 'bg-purple-500',
      tag: 'bg-purple-600 text-white',
      accent: 'border-l-purple-500'
    };
  }
  if (c.includes('revisi') || c.includes('dipa')) {
    return {
      bg: 'bg-indigo-500/15 dark:bg-indigo-500/25',
      text: 'text-indigo-950 dark:text-indigo-200',
      border: 'border-indigo-300/80 dark:border-indigo-600/70',
      dot: 'bg-indigo-500',
      tag: 'bg-indigo-600 text-white',
      accent: 'border-l-indigo-500'
    };
  }
  if (c.includes('tup') || c.includes('up') || c.includes('ganti uang')) {
    return {
      bg: 'bg-amber-500/15 dark:bg-amber-500/25',
      text: 'text-amber-950 dark:text-amber-200',
      border: 'border-amber-400/80 dark:border-amber-600/70',
      dot: 'bg-amber-500',
      tag: 'bg-amber-600 text-white',
      accent: 'border-l-amber-500'
    };
  }
  if (c.includes('jaminan') || c.includes('garansi bank')) {
    return {
      bg: 'bg-orange-500/15 dark:bg-orange-500/25',
      text: 'text-orange-950 dark:text-orange-200',
      border: 'border-orange-300/80 dark:border-orange-600/70',
      dot: 'bg-orange-500',
      tag: 'bg-orange-600 text-white',
      accent: 'border-l-orange-500'
    };
  }
  if (c.includes('gaji') || c.includes('non-gaji') || c.includes('ls')) {
    return {
      bg: 'bg-cyan-500/15 dark:bg-cyan-500/25',
      text: 'text-cyan-950 dark:text-cyan-200',
      border: 'border-cyan-300/80 dark:border-cyan-600/70',
      dot: 'bg-cyan-500',
      tag: 'bg-cyan-600 text-white',
      accent: 'border-l-cyan-500'
    };
  }
  if (c.includes('blu') || c.includes('sp3b') || c.includes('sp2b')) {
    return {
      bg: 'bg-teal-500/15 dark:bg-teal-500/25',
      text: 'text-teal-950 dark:text-teal-200',
      border: 'border-teal-300/80 dark:border-teal-600/70',
      dot: 'bg-teal-500',
      tag: 'bg-teal-600 text-white',
      accent: 'border-l-teal-500'
    };
  }
  if (c.includes('bun') || c.includes('ba bun')) {
    return {
      bg: 'bg-lime-500/15 dark:bg-lime-500/25',
      text: 'text-lime-950 dark:text-lime-200',
      border: 'border-lime-400/80 dark:border-lime-600/70',
      dot: 'bg-lime-600',
      tag: 'bg-lime-600 text-white',
      accent: 'border-l-lime-500'
    };
  }
  if (c.includes('hibah')) {
    return {
      bg: 'bg-fuchsia-500/15 dark:bg-fuchsia-500/25',
      text: 'text-fuchsia-950 dark:text-fuchsia-200',
      border: 'border-fuchsia-300/80 dark:border-fuchsia-600/70',
      dot: 'bg-fuchsia-500',
      tag: 'bg-fuchsia-600 text-white',
      accent: 'border-l-fuchsia-500'
    };
  }
  if (c.includes('akuntansi') || c.includes('pelaporan') || c.includes('rekon') || c.includes('lpj')) {
    return {
      bg: 'bg-sky-500/15 dark:bg-sky-500/25',
      text: 'text-sky-950 dark:text-sky-200',
      border: 'border-sky-300/80 dark:border-sky-600/70',
      dot: 'bg-sky-500',
      tag: 'bg-sky-600 text-white',
      accent: 'border-l-sky-500'
    };
  }
  if (c.includes('retur') || c.includes('koreksi') || c.includes('pembukuan')) {
    return {
      bg: 'bg-rose-500/15 dark:bg-rose-500/25',
      text: 'text-rose-950 dark:text-rose-200',
      border: 'border-rose-400/80 dark:border-rose-600/70',
      dot: 'bg-rose-500',
      tag: 'bg-rose-600 text-white',
      accent: 'border-l-rose-500'
    };
  }
  
  // Default fallback
  return {
    bg: 'bg-indigo-500/15 dark:bg-indigo-500/25',
    text: 'text-indigo-950 dark:text-indigo-200',
    border: 'border-indigo-300/80 dark:border-indigo-600/70',
    dot: 'bg-indigo-500',
    tag: 'bg-indigo-600 text-white',
    accent: 'border-l-indigo-500'
  };
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

  // Filter mode inside month view (ALL, SATKER_ONLY, KPPN_ONLY, CRITICAL_ONLY)
  const [filterMode, setFilterMode] = useState<'ALL' | 'PENERIMAAN' | 'PENYELESAIAN' | 'KRITIS'>('ALL');
  // Card density mode (COMFY vs COMPACT)
  const [densityMode, setDensityMode] = useState<'COMFY' | 'COMPACT'>('COMFY');

  // Hover Popover (Tooltip tanpa klik saat kursor menunjuk tanggal/agenda)
  const [hoverData, setHoverData] = useState<{
    dateStr: string;
    items: DateEventItem[];
    holidayName?: string;
    isWeekend?: boolean;
    x: number;
    y: number;
  } | null>(null);

  // Selected date panel (jika tetap ingin mengklik untuk membuka modal permanen)
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

  // Quick statistics for current viewed month
  const monthStats = React.useMemo(() => {
    const monthPrefix = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}`;
    let satkerCount = 0;
    let kppnCount = 0;
    let criticalCount = 0;
    let totalItems = 0;

    Object.entries(eventsByDate).forEach(([dStr, items]) => {
      if (dStr.startsWith(monthPrefix)) {
        items.forEach(it => {
          totalItems++;
          if (it.isPenerimaan) satkerCount++;
          if (it.isPenyelesaian) kppnCount++;
          if (it.event.prioritas === 'KRITIS') criticalCount++;
        });
      }
    });

    return { satkerCount, kppnCount, criticalCount, totalItems };
  }, [eventsByDate, activeYear, activeMonth]);

  // Handler for Hover / Mouse Enter
  const handleCellMouseEnter = (
    e: React.MouseEvent,
    dateStr: string,
    items: DateEventItem[],
    holidayName?: string,
    isWeekendVal?: boolean
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverData({
      dateStr,
      items,
      holidayName,
      isWeekend: isWeekendVal,
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  };

  const handleCellMouseLeave = () => {
    setHoverData(null);
  };

  return (
    <div className="space-y-6">
      {/* Outer Card with vibrant border and soft colored backdrop */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-200/90 dark:border-indigo-900/60 shadow-xl overflow-hidden transition-all">
        
        {/* Colorful Gradient Header Banner */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-900 text-white flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
          {/* Decorative background glows */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-rose-500/20 blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-md border border-white/25">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-xs">
                  {MONTH_NAMES[activeMonth]} {activeYear}
                </h4>
                {activeYear === 2026 && activeMonth === 8 && (
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-indigo-500/80 border border-indigo-300/40 text-white shadow-xs">
                    🌱 Persiapan Administrasi & Data Kontrak Awal
                  </span>
                )}
                {activeYear === 2026 && activeMonth === 9 && (
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-500/80 border border-blue-300/40 text-white shadow-xs">
                    🍁 Awal Periode LLAT (RPD & Kontrak)
                  </span>
                )}
                {activeYear === 2026 && activeMonth === 10 && (
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black shadow-xs ring-1 ring-amber-300">
                    🍂 Fase Kritis Pra Cut-Off (TUP & Pengesahan BLU)
                  </span>
                )}
                {activeYear === 2026 && activeMonth === 11 && (
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-rose-500/90 border border-rose-300/40 text-white shadow-xs animate-pulse">
                    ❄️ Puncak Akhir Tahun & Cut-Off SPAN
                  </span>
                )}
                {activeYear === 2027 && activeMonth === 0 && (
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/90 border border-emerald-300/40 text-white shadow-xs">
                    🗓️ Penutupan Buku & Pelaporan TA 2026
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-100/90 mt-1">
                Visualisasi kalender penuh warna interaktif dengan identifikasi batas penerimaan berkas satker, penyelesaian SP2D, dan hari libur resmi.
              </p>
            </div>
          </div>

          {/* Month Navigation & Direct Month Switcher */}
          <div className="flex items-center gap-1.5 flex-wrap relative z-10">
            <button
              onClick={handlePrevMonth}
              className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => onChangeMonth(2026, 8)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                activeYear === 2026 && activeMonth === 8
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-md scale-105'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
              title="September 2026"
            >
              Sep 2026
            </button>

            <button
              onClick={() => onChangeMonth(2026, 9)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                activeYear === 2026 && activeMonth === 9
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-md scale-105'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
              title="Oktober 2026"
            >
              Okt 2026
            </button>

            <button
              onClick={() => onChangeMonth(2026, 10)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                activeYear === 2026 && activeMonth === 10
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-md scale-105'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
              title="November 2026"
            >
              Nov 2026
            </button>

            <button
              onClick={() => onChangeMonth(2026, 11)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                activeYear === 2026 && activeMonth === 11
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-md scale-105'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
              title="Desember 2026"
            >
              Des 2026
            </button>

            <button
              onClick={() => onChangeMonth(2027, 0)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                activeYear === 2027 && activeMonth === 0
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-md scale-105'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
              title="Januari 2027"
            >
              Jan 2027
            </button>

            <button
              onClick={handleNextMonth}
              className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Month Metrics & Interactive Filter Strip */}
        <div className="px-4 py-2.5 bg-indigo-50/70 dark:bg-slate-800/90 border-b border-indigo-100 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Quick Metrics in current view */}
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap font-bold">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <CalendarCheck2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Bulan ini: <strong className="text-slate-900 dark:text-white">{monthStats.totalItems}</strong> agenda</span>
            </span>

            <span className="text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Penerimaan Satker: <strong>{monthStats.satkerCount}</strong></span>
            </span>

            <span className="text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>Penyelesaian KPPN: <strong>{monthStats.kppnCount}</strong></span>
            </span>

            {monthStats.criticalCount > 0 && (
              <span className="text-rose-700 dark:text-rose-300 flex items-center gap-1.5 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span>Kritis: <strong>{monthStats.criticalCount}</strong></span>
              </span>
            )}
          </div>

          {/* Quick Filter Buttons & Density Mode */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setFilterMode('ALL')}
                className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all ${
                  filterMode === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('PENERIMAAN')}
                className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all flex items-center gap-1 ${
                  filterMode === 'PENERIMAAN'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
                }`}
              >
                📥 Satker
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('PENYELESAIAN')}
                className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all flex items-center gap-1 ${
                  filterMode === 'PENYELESAIAN'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
                }`}
              >
                🏁 KPPN
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('KRITIS')}
                className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all flex items-center gap-1 ${
                  filterMode === 'KRITIS'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                }`}
              >
                🔥 Kritis
              </button>
            </div>

            {/* Density toggle */}
            <div className="hidden sm:flex items-center bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDensityMode('COMFY')}
                className={`px-2 py-1 text-[11px] font-extrabold rounded-md ${
                  densityMode === 'COMFY' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
                title="Tampilan Luas"
              >
                Luas
              </button>
              <button
                type="button"
                onClick={() => setDensityMode('COMPACT')}
                className={`px-2 py-1 text-[11px] font-extrabold rounded-md ${
                  densityMode === 'COMPACT' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
                title="Tampilan Rapat"
              >
                Ringkas
              </button>
            </div>
          </div>
        </div>

        {/* Vibrant Color Legend Bar with Hover Hint */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 dark:from-slate-800/80 dark:via-indigo-950/30 dark:to-slate-800/80 border-b border-indigo-100 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Keterangan Warna:</span>
            </span>

            <span className="inline-flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300">
              <span className="w-3 h-3 rounded-md bg-blue-600 shadow-xs"></span>
              <span>📥 Batas Penerimaan Berkas Satker</span>
            </span>

            <span className="inline-flex items-center gap-1.5 font-bold text-indigo-800 dark:text-indigo-300">
              <span className="w-3 h-3 rounded-md bg-indigo-600 shadow-xs"></span>
              <span>🏁 Batas Penyelesaian SP2D KPPN</span>
            </span>

            <span className="inline-flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-xs"></span>
              <span>Prioritas Kritis / Hari Libur</span>
            </span>

            <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
              <span className="w-3 h-3 rounded-md bg-amber-500 shadow-xs"></span>
              <span>TUP & UP</span>
            </span>

            <span className="inline-flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-400">
              <span className="w-3 h-3 rounded-md bg-purple-600 shadow-xs"></span>
              <span>Kontrak & Bank Garansi</span>
            </span>
          </div>

          <span className="text-[11px] font-extrabold text-indigo-900 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/80 px-3 py-1 rounded-lg border border-indigo-300 dark:border-indigo-800 flex items-center gap-1.5 shadow-2xs">
            <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-bounce" />
            <span>Arahkan kursor ke tanggal/agenda untuk melihat popover mewah tanpa klik</span>
          </span>
        </div>

        {/* Days of Week Bar (Colorful styling) */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100 via-indigo-50/50 to-slate-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 text-center font-black text-xs py-3">
          {DAY_NAMES.map((d, idx) => {
            const isWeekendDay = idx >= 5;
            return (
              <div 
                key={d} 
                className={`flex items-center justify-center gap-1 tracking-wider ${
                  isWeekendDay 
                    ? 'text-rose-600 dark:text-rose-400 font-black' 
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{d}</span>
                {isWeekendDay && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
              </div>
            );
          })}
        </div>

        {/* 7-Columns Calendar Grid with Rich Color Tinting */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200/90 dark:divide-slate-800 bg-slate-200/60 dark:bg-slate-800">
          {cells.map((cell) => {
            const rawItems = eventsByDate[cell.dateStr] || [];
            
            // Filter items based on active quick filter
            const dateItems = rawItems.filter(item => {
              if (filterMode === 'PENERIMAAN') return item.isPenerimaan;
              if (filterMode === 'PENYELESAIAN') return item.isPenyelesaian;
              if (filterMode === 'KRITIS') return item.event.prioritas === 'KRITIS';
              return true;
            });

            const isToday = cell.dateStr === todayStr;
            const hasEvents = dateItems.length > 0;
            const hasCritical = dateItems.some(i => i.event.prioritas === 'KRITIS');
            const hasPenerimaan = dateItems.some(i => i.isPenerimaan);
            const hasPenyelesaian = dateItems.some(i => i.isPenyelesaian);
            const isSelected = selectedDateEvents?.dateStr === cell.dateStr;
            const holidayInfo = isHoliday(cell.dateStr);
            const isWeekendDay = isWeekend(cell.dateStr);

            // Dynamic Background Tinting with distinct and lively colors
            let cellBgClass = 'bg-white dark:bg-slate-900';
            let cellHoverClass = 'hover:bg-indigo-50/80 dark:hover:bg-slate-800/90';

            if (!cell.isCurrentMonth) {
              cellBgClass = 'opacity-40 bg-slate-100/70 dark:bg-slate-950/60';
            } else if (isToday) {
              cellBgClass = 'bg-gradient-to-b from-blue-100/90 to-indigo-100/70 dark:from-blue-950/70 dark:to-indigo-950/60';
            } else if (holidayInfo.isHoliday) {
              cellBgClass = 'bg-rose-50/80 dark:bg-rose-950/40 border-l-2 border-l-rose-500';
            } else if (hasCritical) {
              cellBgClass = 'bg-gradient-to-b from-rose-50/90 to-amber-50/40 dark:from-rose-950/40 dark:to-slate-900 border-l-2 border-l-rose-500';
            } else if (hasPenerimaan && hasPenyelesaian) {
              cellBgClass = 'bg-gradient-to-b from-blue-50/80 to-indigo-50/60 dark:from-blue-950/30 dark:to-indigo-950/30 border-l-2 border-l-indigo-500';
            } else if (hasPenerimaan) {
              cellBgClass = 'bg-blue-50/60 dark:bg-blue-950/25 border-l-2 border-l-blue-500';
            } else if (hasPenyelesaian) {
              cellBgClass = 'bg-indigo-50/60 dark:bg-indigo-950/25 border-l-2 border-l-indigo-600';
            } else if (isWeekendDay) {
              cellBgClass = 'bg-slate-50/80 dark:bg-slate-900/60';
            }

            const minHeightClass = densityMode === 'COMPACT' 
              ? 'min-h-[96px] sm:min-h-[120px]' 
              : 'min-h-[120px] sm:min-h-[155px]';

            return (
              <div
                key={cell.dateStr}
                onMouseEnter={(e) => {
                  if (rawItems.length > 0 || holidayInfo.isHoliday) {
                    handleCellMouseEnter(
                      e, 
                      cell.dateStr, 
                      rawItems, 
                      holidayInfo.holidayName, 
                      isWeekendDay
                    );
                  }
                }}
                onMouseLeave={handleCellMouseLeave}
                onClick={() => {
                  if (rawItems.length > 0) {
                    setSelectedDateEvents({
                      dateStr: cell.dateStr,
                      items: rawItems
                    });
                  } else {
                    setSelectedDateEvents(null);
                  }
                }}
                className={`${minHeightClass} p-2 sm:p-2.5 ${cellBgClass} ${cellHoverClass} transition-all cursor-pointer relative flex flex-col justify-between ${
                  isToday 
                    ? 'ring-3 ring-blue-500 ring-inset shadow-md z-10' 
                    : ''
                } ${
                  isSelected 
                    ? 'ring-3 ring-amber-500 ring-inset shadow-lg bg-amber-50/60 dark:bg-amber-950/50 z-10' 
                    : ''
                } group`}
              >
                {/* Cell Top Header (Date Number & Badges) */}
                <div className="flex items-center justify-between mb-1.5 gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Day number with colorful circular badge */}
                    <span
                      className={`inline-flex items-center justify-center text-xs font-black rounded-lg w-7 h-7 transition-all group-hover:scale-110 shadow-xs ${
                        isToday
                          ? 'bg-blue-600 text-white ring-2 ring-blue-300 shadow-md font-black'
                          : holidayInfo.isHoliday
                          ? 'bg-rose-600 text-white font-black ring-1 ring-rose-300'
                          : hasCritical
                          ? 'bg-rose-500 text-white font-black'
                          : hasEvents
                          ? 'bg-indigo-600 text-white font-black'
                          : isWeekendDay
                          ? 'text-rose-600 dark:text-rose-400 font-black bg-rose-100/50 dark:bg-rose-950/40'
                          : 'text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {cell.day}
                    </span>

                    {/* Dual Milestone dots */}
                    {cell.isCurrentMonth && (hasPenerimaan || hasPenyelesaian) && (
                      <div className="flex items-center gap-1">
                        {hasPenerimaan && (
                          <span 
                            className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-1 ring-white shadow-2xs" 
                            title="Batas Penerimaan Berkas Satker" 
                          />
                        )}
                        {hasPenyelesaian && (
                          <span 
                            className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-1 ring-white shadow-2xs" 
                            title="Batas Penyelesaian SP2D KPPN" 
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Badges: Holiday or Event Counter */}
                  <div className="flex items-center gap-1">
                    {holidayInfo.isHoliday && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 truncate max-w-[70px] sm:max-w-[90px]" title={holidayInfo.holidayName}>
                        Libur
                      </span>
                    )}

                    {rawItems.length > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 ${
                        hasCritical
                          ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white animate-pulse'
                          : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'
                      }`}>
                        {hasCritical && <Flame className="w-2.5 h-2.5 fill-white" />}
                        <span>{rawItems.length}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Holiday Name Banner if Holiday */}
                {holidayInfo.isHoliday && (
                  <div className="mb-1.5 px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-[11px] font-extrabold text-rose-800 dark:text-rose-200 truncate">
                    🏖️ {holidayInfo.holidayName}
                  </div>
                )}

                {/* Event Snippets (Enlarged, Clear Typography, High Contrast Badges) */}
                <div className="space-y-1.5 flex-1 overflow-hidden">
                  {dateItems.slice(0, densityMode === 'COMPACT' ? 1 : 2).map((item, itemIdx) => {
                    const isCrit = item.event.prioritas === 'KRITIS';
                    const colorScheme = getCategoryColor(item.event.kategori);

                    return (
                      <div
                        key={`${item.event.llat_id}-${itemIdx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(item.event);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs leading-snug font-bold transition-all flex items-center gap-2 shadow-xs hover:scale-[1.02] cursor-pointer border ${
                          isCrit
                            ? 'bg-gradient-to-r from-rose-100 to-red-50 dark:from-rose-950/90 dark:to-red-950/70 text-rose-950 dark:text-rose-100 border-rose-400 dark:border-rose-700 ring-1 ring-rose-400/40 shadow-rose-200/50'
                            : `${colorScheme.bg} ${colorScheme.text} ${colorScheme.border}`
                        }`}
                        title={`${item.isPenerimaan ? '📥 Penerimaan: ' : '🏁 Penyelesaian: '}${item.event.nama_kegiatan} (${item.event.kategori})`}
                      >
                        {/* Dot indicator */}
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isCrit 
                            ? 'bg-rose-600 animate-ping' 
                            : item.isPenerimaan 
                            ? 'bg-blue-600' 
                            : 'bg-indigo-600'
                        }`} />

                        {/* Text and code with readable size & weight */}
                        <span className="truncate flex-1">
                          <span className="font-black mr-1 text-[11px]">
                            {item.isPenerimaan ? '📥' : '🏁'}
                          </span>
                          <span className="font-mono text-[10px] font-black mr-1.5 px-1 py-0.2 rounded bg-black/10 dark:bg-white/10">
                            {item.event.kode_kegiatan}
                          </span>
                          <span className="font-extrabold text-xs tracking-tight">
                            {item.event.nama_kegiatan}
                          </span>
                        </span>
                      </div>
                    );
                  })}

                  {/* Expand button if more than shown items with vibrant badge */}
                  {dateItems.length > (densityMode === 'COMPACT' ? 1 : 2) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDateEvents({
                          dateStr: cell.dateStr,
                          items: rawItems
                        });
                      }}
                      className="w-full text-center py-1.5 rounded-lg bg-gradient-to-r from-indigo-100 via-blue-100 to-indigo-100 dark:from-indigo-950/80 dark:to-blue-950/80 text-indigo-950 dark:text-indigo-200 text-xs font-black hover:from-indigo-200 hover:to-blue-200 transition-all cursor-pointer border border-indigo-300 dark:border-indigo-800 shadow-2xs"
                    >
                      +{dateItems.length - (densityMode === 'COMPACT' ? 1 : 2)} agenda lainnya »
                    </button>
                  )}
                </div>

                {/* Bottom subtle indicator for today */}
                {isToday && (
                  <div className="mt-1 pt-1 border-t border-blue-200 dark:border-blue-800 text-[10px] font-black text-blue-700 dark:text-blue-300 text-center uppercase tracking-wider">
                    ★ HARI INI ★
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HOVER TOOLTIP / POPOVER: TAMPILAN MEWAH, JELAS, BESAR & MUDAH DIBACA        */}
      {/* ========================================================================= */}
      {hoverData && (
        <div 
          className="fixed z-50 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
          style={{
            // Center horizontally over the cell, position above or below cell
            left: `${Math.min(Math.max(hoverData.x - 225, 20), window.innerWidth - 480)}px`,
            top: `${hoverData.y > 420 ? hoverData.y - 14 : hoverData.y + 125}px`,
            transform: hoverData.y > 420 ? 'translateY(-100%)' : 'translateY(0)'
          }}
        >
          <div className="w-[450px] max-w-[94vw] bg-slate-950/95 backdrop-blur-xl text-white rounded-3xl shadow-2xl border-2 border-indigo-400/90 p-5 space-y-4 pointer-events-auto ring-4 ring-black/30">
            {/* Header Popover with Grand Badge */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-amber-300 flex items-center justify-center font-black shadow-md border border-white/20">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-black text-white tracking-tight">
                    {new Date(hoverData.dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h5>
                  <p className="text-xs text-indigo-300 font-bold mt-0.5">
                    {hoverData.items.length > 0 
                      ? `${hoverData.items.length} Agenda / Batas Waktu Terjadwal` 
                      : (hoverData.holidayName ? 'Hari Libur Nasional / Cuti' : 'Tidak ada agenda')}
                  </p>
                </div>
              </div>

              {hoverData.holidayName && (
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-600 text-white shadow-xs">
                  Libur Nasional
                </span>
              )}
            </div>

            {/* Holiday Notice if any */}
            {hoverData.holidayName && (
              <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-xs font-bold text-rose-200 flex items-center gap-2.5 shadow-xs">
                <span className="text-base">🏖️</span>
                <span>{hoverData.holidayName}</span>
              </div>
            )}

            {/* Items list preview - Larger, more readable typography */}
            {hoverData.items.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {hoverData.items.map((it, idx) => {
                  const priority = getPriorityBadge(it.event.prioritas);
                  const isCrit = it.event.prioritas === 'KRITIS';
                  const colorScheme = getCategoryColor(it.event.kategori);

                  return (
                    <div 
                      key={`hover-${it.event.llat_id}-${idx}`}
                      className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-indigo-400 transition-all space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-black text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {it.event.kode_kegiatan}
                          </span>
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                            it.isPenerimaan ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'
                          }`}>
                            {it.isPenerimaan ? '📥 Penerimaan Berkas Satker' : '🏁 Penyelesaian SP2D KPPN'}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${colorScheme.bg} ${colorScheme.text} border ${colorScheme.border}`}>
                            {it.event.kategori}
                          </span>
                        </div>

                        <span className="font-mono text-xs text-amber-300 font-black flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/40">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pukul {it.event.jam_batas || '17:00'} {it.event.timezone || 'WIB'}</span>
                        </span>
                      </div>

                      {/* Main agenda title - bold, readable size */}
                      <p className="text-sm font-black text-white leading-snug">
                        {it.event.nama_kegiatan}
                      </p>

                      {/* Detailed substance description */}
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">
                        {it.event.deskripsi}
                      </p>

                      {/* Footer legal basis & critical alert */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                        <span className="font-medium truncate max-w-[280px]">
                          {it.event.dasar_hukum} • Hal. {it.event.halaman_sumber || '-'}
                        </span>
                        <span className={`font-black ${isCrit ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                          {priority.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              !hoverData.holidayName && (
                <p className="text-xs text-slate-400 italic text-center py-2">
                  Tidak ada tenggat batas untuk tanggal ini.
                </p>
              )
            )}

            {/* Tooltip Footer instruction */}
            <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1">
                <span>💡</span>
                <span>Klik tanggal untuk membuka lembar rincian</span>
              </span>
              <span className="text-amber-400 font-extrabold">PER-9/PB/2026</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Date Agenda Panel (Rich Colorful Popover/Modal Banner yang tetap bisa dibuka via klik) */}
      {selectedDateEvents && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-500 shadow-2xl p-5 sm:p-7 animate-fade-in space-y-5">
          <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white flex items-center justify-center font-black shadow-lg">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Agenda Tanggal {new Date(selectedDateEvents.dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Terdapat <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedDateEvents.items.length} agenda/tenggat</span> pada tanggal ini. Klik kartu untuk melihat dasar hukum, jam batas, dan rincian PER-9/PB/2026.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedDateEvents(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Panel Agenda"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {selectedDateEvents.items.map((item, idx) => {
              const priority = getPriorityBadge(item.event.prioritas);
              const countdown = getCountdownInfo(item.event);
              const deadlineType = getDeadlineTypeBadge(item.event.jenis_tenggat);
              const verification = getVerificationBadge(item.event.status_verifikasi);
              const colorScheme = getCategoryColor(item.event.kategori);

              return (
                <div
                  key={`${item.event.llat_id}-panel-${idx}`}
                  onClick={() => onSelectEvent(item.event)}
                  className={`p-5 rounded-2xl border-2 ${
                    item.event.prioritas === 'KRITIS'
                      ? 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-indigo-50/40'
                  } transition-all cursor-pointer group flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md`}
                >
                  <div className="space-y-2.5">
                    {/* Header tags */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                        {item.event.kode_kegiatan}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        item.isPenerimaan
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-indigo-600 text-white shadow-xs'
                      }`}>
                        {item.isPenerimaan ? '📥 Batas Penerimaan Dokumen' : '🏁 Batas Penyelesaian SP2D'}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${priority.badgeClass}`}>
                        {priority.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorScheme.bg} ${colorScheme.text} border ${colorScheme.border}`}>
                        {item.event.kategori}
                      </span>
                    </div>

                    <h5 className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                      {item.event.nama_kegiatan}
                    </h5>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {item.event.deskripsi}
                    </p>

                    {item.event.dasar_hukum && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{item.event.dasar_hukum} • Hal. {item.event.halaman_sumber || '-'}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer detail */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-mono font-bold text-slate-600 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Pukul {item.event.jam_batas || '17:00'} {item.event.timezone || 'WIB'}</span>
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform cursor-pointer"
                    >
                      <span>Lihat Detail Lengkap</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
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
