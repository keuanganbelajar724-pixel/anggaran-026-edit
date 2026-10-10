import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Building,
  Flame,
  Layers,
  ChevronDown,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { LLATEvent } from '../../types/llat';
import { getCountdownInfo, getDeadlineTypeBadge, getVerificationBadge, getPriorityBadge } from '../../data/defaultLlatData';
import { getRolling5HKInfo, Rolling5HKInfo, formatShortDateID } from '../../utils/llatWorkingDaysEngine';

interface LLATCalendarMonthViewProps {
  events: LLATEvent[];
  selectedYear: number;
  selectedMonth: number;
  onChangeMonth: (year: number, month: number) => void;
  onSelectEvent: (event: LLATEvent) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

// Daftar Hari Libur Nasional & Cuti Bersama Resmi (Q4 2026 & Jan 2027)
const HOLIDAYS_MAP: Record<string, string> = {
  // Oktober 2026
  '2026-10-01': 'Hari Kesaktian Pancasila',
  '2026-10-28': 'Hari Sumpah Pemuda',
  // November 2026
  '2026-11-10': 'Hari Pahlawan',
  // Desember 2026
  '2026-12-24': 'Cuti Bersama Hari Raya Natal',
  '2026-12-25': 'Hari Raya Natal',
  // Januari 2027
  '2027-01-01': 'Tahun Baru 2027 Masehi'
};

interface DateEventItem {
  event: LLATEvent;
  isPenerimaan?: boolean;
  isPenyelesaian?: boolean;
}

// Category aesthetic colors & badges
function getCategoryColor(category: string): { 
  bg: string; 
  text: string; 
  border: string; 
  dot: string; 
  tag: string;
  accent: string;
  gradient: string;
  subtle: string;
} {
  const c = category.toLowerCase();
  if (c.includes('kontrak') || c.includes('bapp') || c.includes('bast')) {
    return {
      bg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
      text: 'text-emerald-950 dark:text-emerald-200',
      border: 'border-emerald-300/80 dark:border-emerald-600/70',
      dot: 'bg-emerald-500',
      tag: 'bg-emerald-600 text-white',
      accent: 'border-l-emerald-500',
      gradient: 'from-emerald-600 to-teal-700',
      subtle: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
    };
  }
  if (c.includes('up') || c.includes('tup') || c.includes('gup') || c.includes('rekening')) {
    return {
      bg: 'bg-amber-500/15 dark:bg-amber-500/25',
      text: 'text-amber-950 dark:text-amber-200',
      border: 'border-amber-300/80 dark:border-amber-600/70',
      dot: 'bg-amber-500',
      tag: 'bg-amber-600 text-white',
      accent: 'border-l-amber-500',
      gradient: 'from-amber-600 to-orange-700',
      subtle: 'bg-amber-950/40 border-amber-500/40 text-amber-200'
    };
  }
  if (c.includes('revisi') || c.includes('dipa')) {
    return {
      bg: 'bg-purple-500/15 dark:bg-purple-500/25',
      text: 'text-purple-950 dark:text-purple-200',
      border: 'border-purple-300/80 dark:border-purple-600/70',
      dot: 'bg-purple-500',
      tag: 'bg-purple-600 text-white',
      accent: 'border-l-purple-500',
      gradient: 'from-purple-600 to-indigo-700',
      subtle: 'bg-purple-950/40 border-purple-500/40 text-purple-200'
    };
  }
  if (c.includes('gaji') || c.includes('pph') || c.includes('honor')) {
    return {
      bg: 'bg-cyan-500/15 dark:bg-cyan-500/25',
      text: 'text-cyan-950 dark:text-cyan-200',
      border: 'border-cyan-300/80 dark:border-cyan-600/70',
      dot: 'bg-cyan-500',
      tag: 'bg-cyan-600 text-white',
      accent: 'border-l-cyan-500',
      gradient: 'from-cyan-600 to-blue-700',
      subtle: 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
    };
  }
  if (c.includes('retur') || c.includes('koreksi') || c.includes('pembukuan') || c.includes('kritis')) {
    return {
      bg: 'bg-rose-500/15 dark:bg-rose-500/25',
      text: 'text-rose-950 dark:text-rose-200',
      border: 'border-rose-400/80 dark:border-rose-600/70',
      dot: 'bg-rose-500',
      tag: 'bg-rose-600 text-white',
      accent: 'border-l-rose-500',
      gradient: 'from-rose-600 to-red-700',
      subtle: 'bg-rose-950/40 border-rose-500/40 text-rose-200'
    };
  }
  
  // Default fallback (Blue / Indigo)
  return {
    bg: 'bg-indigo-500/15 dark:bg-indigo-500/25',
    text: 'text-indigo-950 dark:text-indigo-200',
    border: 'border-indigo-300/80 dark:border-indigo-600/70',
    dot: 'bg-indigo-500',
    tag: 'bg-indigo-600 text-white',
    accent: 'border-l-indigo-500',
    gradient: 'from-indigo-600 to-blue-700',
    subtle: 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
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

  // Filter mode inside month view (ALL, SATKER_ONLY, KPPN_ONLY, CRITICAL_ONLY, 5-HK)
  const [filterMode, setFilterMode] = useState<'ALL' | 'PENERIMAAN' | 'PENYELESAIAN' | 'KRITIS' | 'LIMA_HK'>('ALL');
  // Card density mode (COMFY vs COMPACT)
  const [densityMode, setDensityMode] = useState<'COMFY' | 'COMPACT'>('COMFY');
  // Toggle sorot klausul 5 HK manual (warna kuning)
  const [showRolling5HK, setShowRolling5HK] = useState(true);

  // Hover Popover (Tooltip membesar tanpa klik saat kursor menunjuk tanggal/agenda)
  const [hoverData, setHoverData] = useState<{
    dateStr: string;
    items: DateEventItem[];
    holidayName?: string;
    isWeekend?: boolean;
    clientX: number;
    clientY: number;
    activeItemCode?: string;
    rolling5HK?: Rolling5HKInfo | null;
  } | null>(null);

  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringPopoverRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // Selected date panel (jika tetap ingin mengklik untuk membuka modal permanen)
  const [selectedDateEvents, setSelectedDateEvents] = useState<{
    dateStr: string;
    items: DateEventItem[];
    rolling5HK?: Rolling5HKInfo | null;
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
      // 1. Tanggal Batas / Penerimaan Dokumen (Primary Date)
      const penerimaanDate = ev.tanggal_penerimaan || ev.tanggal_batas || ev.tanggal_tenggat;
      const isOnlyPenyelesaian = Boolean(!ev.tanggal_penerimaan && !ev.tanggal_batas && ev.tanggal_penyelesaian);

      if (penerimaanDate && !isOnlyPenyelesaian) {
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

      // 2. Tanggal Penyelesaian SP2D KPPN (jika berbeda atau berdiri sendiri)
      if (ev.tanggal_penyelesaian && (ev.tanggal_penyelesaian !== penerimaanDate || isOnlyPenyelesaian)) {
        const kppnDate = ev.tanggal_penyelesaian;
        if (!map[kppnDate]) map[kppnDate] = [];
        const exists = map[kppnDate].some(item => item.event.llat_id === ev.llat_id && item.isPenyelesaian);
        if (!exists) {
          map[kppnDate].push({
            event: ev,
            isPenerimaan: false,
            isPenyelesaian: true
          });
        }
      }

      // 3. Sub deadlines jika ada
      if (Array.isArray(ev.sub_deadlines)) {
        ev.sub_deadlines.forEach((sub) => {
          if (sub.tanggal) {
            if (!map[sub.tanggal]) map[sub.tanggal] = [];
            const exists = map[sub.tanggal].some(item => item.event.llat_id === ev.llat_id);
            if (!exists) {
              map[sub.tanggal].push({
                event: {
                  ...ev,
                  nama_kegiatan: `${ev.nama_kegiatan} (${sub.label || 'Tahap'})`
                },
                isPenerimaan: true,
                isPenyelesaian: false
              });
            }
          }
        });
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
    let rolling5HKCount = 0;

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

    // Hitung hari kerja 5 HK di bulan yang sedang ditampilkan
    if (activeYear === 2026 && (activeMonth === 9 || activeMonth === 10)) {
      for (let day = 1; day <= daysInMonth; day++) {
        const dStr = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (getRolling5HKInfo(dStr)) {
          rolling5HKCount++;
        }
      }
    }

    return { satkerCount, kppnCount, criticalCount, totalItems, rolling5HKCount };
  }, [eventsByDate, activeYear, activeMonth, daysInMonth]);

  // Handler for Hover / Mouse Enter & Move
  const handleCellHover = (
    e: React.MouseEvent,
    dateStr: string,
    items: DateEventItem[],
    holidayName?: string,
    isWeekendVal?: boolean,
    activeItemCode?: string,
    rolling5HK?: Rolling5HKInfo | null
  ) => {
    // Jika pengguna sedang aktif melihat/menggulir isi popover, jangan interupsi
    if (isHoveringPopoverRef.current) return;

    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    setHoverData(prev => {
      // Jika masih di tanggal yang sama, pertahankan posisi koordinat agar popover stabil dan tidak berpindah saat kursor bergerak menuju popover
      if (prev && prev.dateStr === dateStr) {
        return {
          ...prev,
          items,
          holidayName,
          isWeekend: isWeekendVal,
          activeItemCode,
          rolling5HK
        };
      }
      return {
        dateStr,
        items,
        holidayName,
        isWeekend: isWeekendVal,
        clientX: e.clientX,
        clientY: e.clientY,
        activeItemCode,
        rolling5HK
      };
    });
  };

  const handleCellMouseLeave = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      if (!isHoveringPopoverRef.current) {
        setHoverData(null);
      }
    }, 350);
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
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-500/80 text-white border border-white/30">
                    Awal LLAT (Persiapan)
                  </span>
                )}
                {activeYear === 2026 && activeMonth === 9 && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 border border-amber-300 shadow-xs">
                    Masa Transisi & Registrasi Kontrak
                  </span>
                )}
                {activeYear === 2026 && activeMonth === 10 && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-500 text-white border border-rose-300 animate-pulse shadow-xs">
                    Periode Kritis Tahap I & II
                  </span>
                )}
                {activeYear === 2026 && activeMonth === 11 && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-red-600 text-white border border-red-300 shadow-xs animate-bounce">
                    Puncak Tutup Tahun Anggaran 2026
                  </span>
                )}
                {activeYear === 2027 && activeMonth === 0 && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-500/80 text-white border border-white/30">
                    LPJ & Pembukuan Final
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-indigo-100 font-medium mt-0.5">
                Berdasarkan PER-9/PB/2026 • Dilengkapi sorotan visual milestone Satker & KPPN
              </p>
            </div>
          </div>

          {/* Navigation Controls & Quick Month Jumpers */}
          <div className="flex flex-wrap items-center gap-2 relative z-10">
            {/* Quick Key Month Shortcuts */}
            <div className="hidden lg:flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/15">
              {[
                { label: 'Okt 2026', y: 2026, m: 9 },
                { label: 'Nov 2026', y: 2026, m: 10 },
                { label: 'Des 2026 (Puncak)', y: 2026, m: 11, highlight: true },
                { label: 'Jan 2027 (Final)', y: 2027, m: 0 }
              ].map((jump) => {
                const isActive = activeYear === jump.y && activeMonth === jump.m;
                return (
                  <button
                    key={`${jump.y}-${jump.m}`}
                    onClick={() => onChangeMonth(jump.y, jump.m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-md ring-1 ring-amber-300'
                        : jump.highlight
                        ? 'bg-rose-500/80 text-white hover:bg-rose-500'
                        : 'text-indigo-100 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    {jump.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handlePrevMonth}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-black transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer shadow-sm"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            <button
              onClick={() => {
                const now = new Date();
                onChangeMonth(now.getFullYear(), now.getMonth());
              }}
              className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-black transition-all border border-amber-300 shadow-md cursor-pointer"
            >
              Bulan Ini
            </button>

            <button
              onClick={handleNextMonth}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-black transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer shadow-sm"
              title="Bulan Berikutnya"
            >
              <span className="hidden sm:inline">Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Informative Stats & Legend Strip with vibrant theme colors */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 dark:from-slate-800/90 dark:via-slate-850/80 dark:to-slate-900 border-b border-indigo-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Quick Counter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Ringkasan Bulan Ini:
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-800">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>{monthStats.satkerCount} Batas Penerimaan Berkas Satker</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 font-extrabold border border-indigo-200 dark:border-indigo-800">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>{monthStats.kppnCount} Penyelesaian SP2D KPPN</span>
            </span>
            {monthStats.criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-black border border-rose-300 dark:border-rose-800 animate-pulse">
                <Flame className="w-3 h-3 text-rose-600" />
                <span>{monthStats.criticalCount} Agenda Kritis</span>
              </span>
            )}
            {monthStats.rolling5HKCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 font-extrabold border border-amber-300 dark:border-amber-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{monthStats.rolling5HKCount} Batas 5 HK Kontrak & BAST</span>
              </span>
            )}
          </div>

          {/* Controls: Filter & View Density */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Filter buttons */}
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-0.5 border border-indigo-200 dark:border-slate-700 shadow-2xs">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterMode('PENERIMAAN')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'PENERIMAAN'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
                title="Hanya Batas Penerimaan Berkas Satker"
              >
                📥 Satker
              </button>
              <button
                onClick={() => setFilterMode('PENYELESAIAN')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'PENYELESAIAN'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
                title="Hanya Batas Penyelesaian SP2D KPPN"
              >
                🏁 KPPN
              </button>
              <button
                onClick={() => setFilterMode('KRITIS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'KRITIS'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
                title="Hanya Prioritas Kritis"
              >
                🔥 Kritis
              </button>
              <button
                onClick={() => setFilterMode('LIMA_HK')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'LIMA_HK'
                    ? 'bg-amber-400 text-slate-950 shadow-xs font-black ring-1 ring-amber-300'
                    : 'text-amber-800 dark:text-amber-300 hover:text-amber-950 font-bold'
                }`}
                title="Hanya Hari Batas Waktu 5 Hari Kerja (Kuning)"
              >
                ⚡ 5 HK
              </button>
            </div>

            {/* Quick Toggle 5 HK */}
            <button
              onClick={() => setShowRolling5HK(!showRolling5HK)}
              className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                showRolling5HK
                  ? 'bg-amber-100/90 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 border-amber-400 dark:border-amber-700 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title="Aktifkan / Sembunyikan Sorotan Batas 5 HK Kontrak & BAST (Warna Kuning)"
            >
              <span className={`w-2 h-2 rounded-full ${showRolling5HK ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>5 HK (Kuning)</span>
            </button>

            {/* Density toggle */}
            <div className="hidden sm:flex items-center bg-white dark:bg-slate-800 rounded-xl p-0.5 border border-indigo-200 dark:border-slate-700 shadow-2xs">
              <button
                onClick={() => setDensityMode('COMFY')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  densityMode === 'COMFY'
                    ? 'bg-slate-900 text-white dark:bg-slate-700'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Luas"
              >
                Luas
              </button>
              <button
                onClick={() => setDensityMode('COMPACT')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  densityMode === 'COMPACT'
                    ? 'bg-slate-900 text-white dark:bg-slate-700'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Ringkas"
              >
                Ringkas
              </button>
            </div>
          </div>
        </div>

        {/* Live Date Inspector Strip - Reaktif langsung saat kursor menunjuk tanggal mana pun */}
        <div className={`px-4 py-3 transition-all duration-150 border-b ${
          hoverData
            ? 'bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/30'
            : 'bg-white dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
        }`}>
          {hoverData ? (
            <div className="flex flex-wrap items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm shrink-0">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-amber-300">
                      {new Date(hoverData.dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    {hoverData.holidayName && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
                        🏖️ Libur: {hoverData.holidayName}
                      </span>
                    )}
                    {hoverData.items.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white shadow-xs">
                        🔔 {hoverData.items.length} Batas Waktu Terdaftar
                      </span>
                    )}
                    {hoverData.items.length === 0 && !hoverData.holidayName && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                        {hoverData.isWeekend ? '☕ Hari Libur Akhir Pekan' : '✅ Hari Kerja Normal'}
                      </span>
                    )}
                  </div>
                  {hoverData.items.length > 0 && (
                    <div className="text-xs text-indigo-200 mt-1 font-medium flex items-center gap-2 flex-wrap">
                      {hoverData.items.slice(0, 3).map((it, idx) => (
                        <span key={idx} className="bg-white/10 px-2 py-0.5 rounded text-[11px] font-semibold border border-white/15">
                          <strong className="text-amber-300 font-mono mr-1">[{it.event.kode_kegiatan}]</strong>
                          {it.event.nama_kegiatan} (Pukul {it.event.jam_batas || '17:00'} WIB)
                        </span>
                      ))}
                      {hoverData.items.length > 3 && (
                        <span className="text-[11px] text-amber-300 font-black">
                          +{hoverData.items.length - 3} agenda lainnya
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-amber-300 font-bold bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-lg">
                PER-9/PB/2026
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>Arahkan kursor ke tanggal mana pun pada kalender untuk melihat rincian tenggat secara instan</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Penerimaan Satker
                </span>
                <span className="inline-flex items-center gap-1 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> SP2D KPPN
                </span>
                <span className="inline-flex items-center gap-1 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Kritis / Libur
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Legend color guide bar with high-contrast colored pills */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
          <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
            Panduan Warna:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-300 dark:ring-blue-800" />
            <span className="font-bold text-blue-900 dark:text-blue-300">Batas Satker (Penerimaan)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-indigo-300 dark:ring-indigo-800" />
            <span className="font-bold text-indigo-900 dark:text-indigo-300">Batas KPPN (Penyelesaian SP2D)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-rose-300 dark:ring-rose-800" />
            <span className="font-bold text-rose-900 dark:text-rose-300">Prioritas Kritis / Libur</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-300 dark:ring-emerald-800" />
            <span className="font-bold text-emerald-900 dark:text-emerald-300">Kontrak & BAST</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-100/90 dark:bg-amber-950/70 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-700 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-300 dark:ring-amber-700 animate-pulse" />
            <span className="font-extrabold text-amber-950 dark:text-amber-200">Kuning: Batas 5 HK Kontrak & BAST (Klausul Manual)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-300 dark:ring-amber-800" />
            <span className="font-bold text-amber-900 dark:text-amber-300">UP/TUP/GUP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 ring-2 ring-purple-300 dark:ring-purple-800" />
            <span className="font-bold text-purple-900 dark:text-purple-300">Revisi DIPA</span>
          </div>
        </div>

        {/* Calendar Day Header (Sen s.d. Min) */}
        <div className="grid grid-cols-7 border-b border-indigo-200 dark:border-slate-800 bg-gradient-to-r from-slate-100 via-indigo-50/50 to-slate-100 dark:from-slate-850 dark:to-slate-800">
          {DAY_NAMES.map((d, idx) => (
            <div
              key={d}
              className={`py-3 text-center text-xs font-black tracking-wider uppercase ${
                idx >= 5 
                  ? 'text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30' 
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid (Days Cells) */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800 bg-slate-100/40 dark:bg-slate-950/40">
          {cells.map((cell, idx) => {
            const rawItems = eventsByDate[cell.dateStr] || [];
            const rolling5HKInfo = getRolling5HKInfo(cell.dateStr);
            const is5HKDay = showRolling5HK && !!rolling5HKInfo;
            
            // Filter items based on user choice
            const dateItems = rawItems.filter(item => {
              if (filterMode === 'ALL') return true;
              if (filterMode === 'PENERIMAAN') return item.isPenerimaan;
              if (filterMode === 'PENYELESAIAN') return item.isPenyelesaian;
              if (filterMode === 'KRITIS') return item.event.prioritas === 'KRITIS';
              if (filterMode === 'LIMA_HK') return false;
              return true;
            });

            const isToday = cell.dateStr === todayStr;
            const isSelected = selectedDateEvents?.dateStr === cell.dateStr;
            const isWeekendDay = (idx % 7) >= 5;
            
            // Check holiday
            const holidayInfo = {
              isHoliday: !!HOLIDAYS_MAP[cell.dateStr],
              holidayName: HOLIDAYS_MAP[cell.dateStr]
            };

            const hasEvents = dateItems.length > 0;
            const hasCritical = dateItems.some(i => i.event.prioritas === 'KRITIS');
            const hasPenerimaan = dateItems.some(i => i.isPenerimaan);
            const hasPenyelesaian = dateItems.some(i => i.isPenyelesaian);

            // Styling dynamic per cell
            let cellBgClass = 'bg-white dark:bg-slate-900';
            let cellHoverClass = 'hover:bg-indigo-50/70 dark:hover:bg-slate-800/90';

            if (!cell.isCurrentMonth) {
              cellBgClass = 'bg-slate-50/50 dark:bg-slate-950/70 opacity-40';
            } else if (filterMode === 'LIMA_HK') {
              if (rolling5HKInfo) {
                cellBgClass = 'bg-amber-100/90 dark:bg-amber-950/60 border-2 border-amber-500 ring-2 ring-amber-400/40 shadow-sm';
                cellHoverClass = 'hover:bg-amber-200/90 dark:hover:bg-amber-900/50';
              } else {
                cellBgClass = 'bg-slate-50/40 dark:bg-slate-950/60 opacity-30';
              }
            } else if (holidayInfo.isHoliday) {
              cellBgClass = 'bg-rose-50/80 dark:bg-rose-950/30 border-l-2 border-l-rose-500';
            } else if (hasCritical) {
              cellBgClass = is5HKDay 
                ? 'bg-rose-50/70 dark:bg-rose-950/40 border-l-4 border-l-rose-500 border-r-4 border-r-amber-400 shadow-rose-100/50'
                : 'bg-rose-50/60 dark:bg-rose-950/30 border-l-4 border-l-rose-500 shadow-rose-100/50';
            } else if (hasPenerimaan && hasPenyelesaian) {
              cellBgClass = is5HKDay
                ? 'bg-gradient-to-br from-blue-50/70 to-indigo-50/70 dark:from-blue-950/40 dark:to-indigo-950/40 border-l-4 border-l-indigo-600 border-r-4 border-r-amber-400'
                : 'bg-gradient-to-br from-blue-50/60 to-indigo-50/60 dark:from-blue-950/30 dark:to-indigo-950/30 border-l-4 border-l-indigo-600';
            } else if (hasPenerimaan) {
              cellBgClass = is5HKDay
                ? 'bg-blue-50/60 dark:bg-blue-950/25 border-l-2 border-l-blue-500 border-r-4 border-r-amber-400'
                : 'bg-blue-50/60 dark:bg-blue-950/25 border-l-2 border-l-blue-500';
            } else if (hasPenyelesaian) {
              cellBgClass = is5HKDay
                ? 'bg-indigo-50/60 dark:bg-indigo-950/25 border-l-2 border-l-indigo-600 border-r-4 border-r-amber-400'
                : 'bg-indigo-50/60 dark:bg-indigo-950/25 border-l-2 border-l-indigo-600';
            } else if (is5HKDay) {
              // Highlight kuning khas klausul manual 5 HK untuk pendaftaran kontrak & BAST
              cellBgClass = 'bg-amber-50/90 dark:bg-amber-950/35 border-l-4 border-l-amber-500 shadow-2xs';
              cellHoverClass = 'hover:bg-amber-100/90 dark:hover:bg-amber-900/40';
            } else if (isWeekendDay) {
              cellBgClass = 'bg-slate-50/80 dark:bg-slate-900/60';
            }

            const minHeightClass = densityMode === 'COMPACT' 
              ? 'min-h-[96px] sm:min-h-[120px]' 
              : 'min-h-[120px] sm:min-h-[155px]';

            const isHovered = hoverData?.dateStr === cell.dateStr;

            return (
              <div
                key={cell.dateStr}
                onMouseEnter={(e) => {
                  handleCellHover(
                    e, 
                    cell.dateStr, 
                    rawItems, 
                    holidayInfo.holidayName, 
                    isWeekendDay,
                    undefined,
                    rolling5HKInfo
                  );
                }}
                onMouseMove={(e) => {
                  handleCellHover(
                    e, 
                    cell.dateStr, 
                    rawItems, 
                    holidayInfo.holidayName, 
                    isWeekendDay,
                    undefined,
                    rolling5HKInfo
                  );
                }}
                onMouseLeave={handleCellMouseLeave}
                onClick={() => {
                  if (rawItems.length > 0 || (showRolling5HK && rolling5HKInfo)) {
                    setSelectedDateEvents({
                      dateStr: cell.dateStr,
                      items: rawItems,
                      rolling5HK: rolling5HKInfo
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
                } ${
                  isHovered
                    ? 'ring-2 ring-indigo-500 ring-inset shadow-lg bg-indigo-50/70 dark:bg-indigo-950/40 z-20 scale-[1.01]'
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
                          : is5HKDay
                          ? 'bg-amber-500 text-white font-black ring-1 ring-amber-300 dark:ring-amber-600'
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
                          />
                        )}
                        {hasPenyelesaian && (
                          <span 
                            className="w-2.5 h-2.5 rounded-full bg-indigo-600 ring-1 ring-white shadow-2xs" 
                          />
                        )}
                      </div>
                    )}

                    {/* 5 HK Yellow Tag */}
                    {cell.isCurrentMonth && is5HKDay && (
                      <span 
                        className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-400 dark:bg-amber-500 text-slate-950 font-mono shadow-2xs shrink-0"
                      >
                        5 HK
                      </span>
                    )}
                  </div>

                  {/* Right Badges: Holiday or Event Counter */}
                  <div className="flex items-center gap-1">
                    {holidayInfo.isHoliday && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 truncate max-w-[70px] sm:max-w-[90px]">
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
                  {/* Yellow Card for Rolling 5 HK Clause in October & November */}
                  {cell.isCurrentMonth && is5HKDay && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDateEvents({
                          dateStr: cell.dateStr,
                          items: rawItems,
                          rolling5HK: rolling5HKInfo
                        });
                      }}
                      onMouseEnter={(e) => {
                        handleCellHover(
                          e, 
                          cell.dateStr, 
                          rawItems, 
                          holidayInfo.holidayName, 
                          isWeekendDay, 
                          '5HK',
                          rolling5HKInfo
                        );
                      }}
                      className="px-2 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs hover:scale-[1.02] cursor-pointer border bg-amber-100/90 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100 border-amber-300 dark:border-amber-700/80 hover:bg-amber-200/90 dark:hover:bg-amber-900/60"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 ring-1 ring-amber-300 animate-pulse" />
                      <div className="truncate flex-1 leading-tight">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[9px] font-black px-1 py-0.2 rounded bg-amber-300 dark:bg-amber-800 text-amber-950 dark:text-amber-100">
                            H+5
                          </span>
                          <span className="font-extrabold text-[10px] sm:text-[11px] text-amber-950 dark:text-amber-200 truncate">
                            BAST {rolling5HKInfo.sourceDateFormatted}
                          </span>
                        </div>
                        <div className="text-[9px] text-amber-800 dark:text-amber-300/90 font-medium truncate">
                          Pkl 17:00 • Batas Kontrak & LS
                        </div>
                      </div>
                    </div>
                  )}
                  {dateItems.slice(0, densityMode === 'COMPACT' ? 1 : 2).map((item, itemIdx) => {
                    const isCrit = item.event.prioritas === 'KRITIS';
                    const colorScheme = getCategoryColor(item.event.kategori);

                    return (
                      <div
                        key={`${item.event.llat_id}-${itemIdx}`}
                        onMouseEnter={(e) => {
                          handleCellHover(
                            e, 
                            cell.dateStr, 
                            rawItems, 
                            holidayInfo.holidayName, 
                            isWeekendDay, 
                            item.event.kode_kegiatan
                          );
                        }}
                        onMouseMove={(e) => {
                          handleCellHover(
                            e, 
                            cell.dateStr, 
                            rawItems, 
                            holidayInfo.holidayName, 
                            isWeekendDay, 
                            item.event.kode_kegiatan
                          );
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(item.event);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs leading-snug font-bold transition-all flex items-center gap-2 shadow-xs hover:scale-[1.02] cursor-pointer border ${
                          isCrit
                            ? 'bg-gradient-to-r from-rose-100 to-red-50 dark:from-rose-950/90 dark:to-red-950/70 text-rose-950 dark:text-rose-100 border-rose-400 dark:border-rose-700 ring-1 ring-rose-400/40 shadow-rose-200/50'
                            : `${colorScheme.bg} ${colorScheme.text} ${colorScheme.border}`
                        }`}
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
      {/* HOVER TOOLTIP / POPOVER: TAMPILAN MEMBESAR, SANGAT JELAS, MEWAH & BEBAS GLITCH */}
      {/* DI-PORTAL LANGSUNG KE document.body SEHINGGA BEBAS DARI TRANSFORM/OVERFLOW PARENT */}
      {/* ========================================================================= */}
      {typeof document !== 'undefined' && hoverData && createPortal(
        (() => {
          const cardWidth = typeof window !== 'undefined' ? Math.min(520, window.innerWidth - 32) : 480;
          const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
          const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

          // Position horizontally: to the right of cursor by 18px, or flip to left if near right edge
          let left = hoverData.clientX + 18;
          if (left + cardWidth > viewportWidth - 16) {
            left = hoverData.clientX - cardWidth - 18;
          }
          if (left < 12) left = 12;

          // Position vertically: align with cursor, clamped safely inside viewport
          const estimatedHeight = Math.min(480, hoverData.items.length * 125 + 160);
          let top = hoverData.clientY - 20;
          if (top + estimatedHeight > viewportHeight - 16) {
            top = Math.max(12, viewportHeight - estimatedHeight - 16);
          }
          if (top < 12) top = 12;

          return (
            <div 
              className="fixed z-[9999999] pointer-events-auto transition-all duration-75 ease-out"
              style={{
                left: `${left}px`,
                top: `${top}px`,
              }}
              onMouseEnter={() => {
                if (leaveTimerRef.current) {
                  clearTimeout(leaveTimerRef.current);
                  leaveTimerRef.current = null;
                }
                isHoveringPopoverRef.current = true;
              }}
              onMouseLeave={() => {
                isHoveringPopoverRef.current = false;
                if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
                leaveTimerRef.current = setTimeout(() => {
                  setHoverData(null);
                }, 350);
              }}
            >
              {/* Pop-up Card */}
              <div className="w-[520px] max-w-[92vw] bg-slate-950/98 backdrop-blur-2xl text-white rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95)] border-2 border-indigo-500/90 p-5 space-y-4 ring-4 ring-indigo-500/30 max-h-[min(540px,82vh)] overflow-y-auto pointer-events-auto select-text scrollbar-thin scrollbar-thumb-indigo-500/60 scrollbar-track-slate-900">
              
              {/* Header Popover with Grand Badge & Glow */}
              <div className="flex items-center justify-between border-b border-slate-800/90 pb-3.5 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 text-amber-300 flex items-center justify-center font-black shadow-lg shadow-indigo-500/30 border border-white/25 shrink-0">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-base font-black text-white tracking-tight">
                      {new Date(hoverData.dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </h5>
                    <p className="text-xs text-indigo-300 font-bold mt-0.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                      <span>
                        {hoverData.items.length > 0 
                          ? `${hoverData.items.length} Agenda & Batas Waktu Resmi` 
                          : hoverData.rolling5HK && showRolling5HK
                          ? `Batas 5 HK: BAST & Kontrak tgl ${hoverData.rolling5HK.sourceDateFormatted}`
                          : hoverData.holidayName 
                          ? 'Hari Libur Nasional Resmi'
                          : hoverData.isWeekend
                          ? 'Akhir Pekan (Hari Non-Kerja)'
                          : 'Hari Kerja Normal (Tidak Ada Deadline Khusus)'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hoverData.holidayName && (
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md border border-rose-400/40 shrink-0">
                      🏖️ Libur Nasional
                    </span>
                  )}
                  {!hoverData.holidayName && hoverData.rolling5HK && showRolling5HK && (
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md border border-amber-300 font-mono shrink-0">
                      ⚡ Klausul 5 HK
                    </span>
                  )}
                  {!hoverData.holidayName && !hoverData.rolling5HK && hoverData.isWeekend && (
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                      ☕ Akhir Pekan
                    </span>
                  )}
                  {!hoverData.holidayName && !hoverData.rolling5HK && !hoverData.isWeekend && hoverData.items.length === 0 && (
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 shrink-0">
                      ✅ Hari Kerja
                    </span>
                  )}

                  {/* Quick Close Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHoverData(null);
                    }}
                    className="p-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Tutup"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Holiday Notice if any */}
              {hoverData.holidayName && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/80 via-red-950/70 to-rose-950/80 border-2 border-rose-500/60 text-xs font-bold text-rose-100 flex items-center gap-3 shadow-md">
                  <span className="text-2xl">🏖️</span>
                  <div>
                    <div className="font-black text-rose-200">HARI LIBUR RESMI PEMERINTAH</div>
                    <div className="text-rose-100 font-semibold">{hoverData.holidayName}</div>
                    <div className="text-[11px] text-rose-300/80 mt-0.5">Sesuai SKB 3 Menteri, seluruh aktivitas layanan perbendaharaan diliburkan.</div>
                  </div>
                </div>
              )}

              {/* 5 HK Rolling Deadline Card (Kuning / Amber) */}
              {hoverData.rolling5HK && showRolling5HK && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/95 via-yellow-950/90 to-amber-950/95 border-2 border-amber-400 text-amber-100 shadow-xl space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚡</span>
                      <span className="font-black text-xs uppercase tracking-wide text-amber-300 bg-amber-900/80 px-2.5 py-0.5 rounded-lg border border-amber-500/60 font-mono">
                        Klausul Perhitungan Manual 5 HK (H+5)
                      </span>
                    </div>
                    <span className="font-mono text-xs text-amber-300 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-500/40">
                      PER-9/PB/2026
                    </span>
                  </div>

                  <div>
                    <h6 className="text-sm font-black text-white leading-snug">
                      Batas Waktu BAST & Kontrak Ditandatangan Tanggal {hoverData.rolling5HK.sourceDateFormatted}
                    </h6>
                    <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                      {hoverData.rolling5HK.description}
                    </p>
                  </div>

                  {/* 2-box metric */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="bg-black/40 p-2.5 rounded-xl border border-amber-500/40">
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                        📄 Tanggal Dokumen BAST/Kontrak:
                      </div>
                      <div className="text-sm font-black text-white font-mono mt-0.5">
                        {hoverData.rolling5HK.sourceDateFormatted}
                      </div>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded-xl border border-amber-500/40">
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                        ⏳ Batas Akhir Pengajuan (H+5 HK):
                      </div>
                      <div className="text-sm font-black text-amber-300 font-mono mt-0.5">
                        Hari ini (Pkl 17:00 WIB)
                      </div>
                    </div>
                  </div>

                  {/* Forward simulation & hard ceiling */}
                  <div className="pt-2 border-t border-amber-500/30 text-[11px] space-y-1 text-amber-200/90">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Dasar Klausul:</span>
                      <span className="font-bold text-amber-300">{hoverData.rolling5HK.pasal}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Plafon Sapu Jagat Periode:</span>
                      <span className="font-bold text-amber-300">{hoverData.rolling5HK.hardCutOffFormatted}</span>
                    </div>
                    <div className="mt-1 pt-1 border-t border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-1.5 font-semibold">
                      <span>💡</span>
                      <span>Jika BAST ditandatangani <strong>hari ini</strong>, batas pengajuannya adalah <strong>{hoverData.rolling5HK.forwardDeadlineFormatted}</strong>.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Items list preview - Prominent Cards, Crystal-Clear Typography & Colored Highlights */}
              {hoverData.items.length > 0 ? (
                <div className="space-y-3">
                  {hoverData.items.map((it, idx) => {
                    const priority = getPriorityBadge(it.event.prioritas);
                    const isCrit = it.event.prioritas === 'KRITIS';
                    const colorScheme = getCategoryColor(it.event.kategori);
                    const isHighlighted = hoverData.activeItemCode === it.event.kode_kegiatan;

                    return (
                      <div 
                        key={`hover-${it.event.llat_id}-${idx}`}
                        className={`p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-900/75 border-2 ${
                          isHighlighted
                            ? 'border-amber-400 ring-2 ring-amber-400/50 bg-indigo-950/40 shadow-lg'
                            : isCrit 
                            ? 'border-rose-500/90 shadow-lg shadow-rose-950/50 bg-rose-950/20' 
                            : 'border-slate-700/80 hover:border-indigo-400'
                        } transition-all space-y-2.5 shadow-md`}
                      >
                        {/* Top Badges row */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-black text-amber-300 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-700">
                              {it.event.kode_kegiatan}
                            </span>
                            <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg shadow-xs ${
                              it.isPenerimaan 
                                ? 'bg-blue-600 text-white border border-blue-400/40' 
                                : 'bg-indigo-600 text-white border border-indigo-400/40'
                            }`}>
                              {it.isPenerimaan ? '📥 Penerimaan Berkas Satker' : '🏁 Penyelesaian SP2D KPPN'}
                            </span>
                            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${colorScheme.subtle} border`}>
                              {it.event.kategori}
                            </span>
                          </div>

                          {/* Jam batas pill */}
                          <span className="font-mono text-xs text-amber-300 font-black flex items-center gap-1 bg-amber-950/80 px-2.5 py-0.5 rounded-lg border border-amber-500/50 shadow-xs">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Pukul {it.event.jam_batas || '17:00'} {it.event.timezone || 'WIB'}</span>
                          </span>
                        </div>

                        {/* Main agenda title - Large, bold, eye-catching */}
                        <div className="flex items-start justify-between gap-2">
                          <h6 className="text-sm font-black text-white leading-snug">
                            {it.event.nama_kegiatan}
                          </h6>
                        </div>

                        {/* Detailed substance description */}
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          {it.event.deskripsi}
                        </p>

                        {/* Footer legal basis & priority indicator */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/90 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5 truncate max-w-[340px]">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="font-medium truncate">
                              {it.event.dasar_hukum} • Hal. {it.event.halaman_sumber || '-'}
                            </span>
                          </div>
                          <span className={`font-black px-2 py-0.5 rounded text-[11px] ${
                            isCrit 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse' 
                              : 'text-slate-300'
                          }`}>
                            {priority.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                  {hoverData.isWeekend ? (
                    <>
                      <p className="text-sm font-black text-slate-200">☕ Hari Libur Akhir Pekan</p>
                      <p className="text-xs text-slate-400">
                        Tidak ada aktivitas perbankan atau pengajuan SPM/SP2D reguler pada hari ini.
                      </p>
                    </>
                  ) : hoverData.rolling5HK && showRolling5HK ? (
                    <>
                      <p className="text-sm font-black text-amber-300">⚡ Hari Batas Waktu 5 HK (Klausul Manual)</p>
                      <p className="text-xs text-amber-200/80">
                        Hari kerja ini merupakan batas akhir penyampaian Kontrak dan SPM-LS untuk BAST tanggal {hoverData.rolling5HK.sourceDateFormatted} (Pukul 17:00 WIB).
                      </p>
                    </>
                  ) : !hoverData.holidayName ? (
                    <>
                      <p className="text-sm font-black text-emerald-300">✅ Hari Kerja Reguler</p>
                      <p className="text-xs text-slate-400">
                        Tidak ada batas tenggat khusus LLAT PER-9/PB/2026 pada tanggal ini. Pemrosesan SPM/SP2D berjalan reguler.
                      </p>
                    </>
                  ) : null}
                </div>
              )}

              {/* Tooltip Footer instruction */}
              <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5 text-indigo-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Klik tanggal ini pada kalender untuk membuka panel detail</span>
                </span>
                <span className="text-amber-400 font-black px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                  PER-9/PB/2026
                </span>
              </div>
            </div>
          </div>
        );
      })(),
      document.body
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
                  {selectedDateEvents.items.length > 0 ? (
                    <>
                      Terdapat <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedDateEvents.items.length} agenda/tenggat</span> pada tanggal ini. Klik kartu untuk melihat dasar hukum, jam batas, dan rincian PER-9/PB/2026.
                    </>
                  ) : selectedDateEvents.rolling5HK ? (
                    <>
                      Tanggal ini merupakan <span className="font-bold text-amber-600 dark:text-amber-400">Batas Waktu 5 Hari Kerja (Klausul Perhitungan Manual)</span> untuk pendaftaran Kontrak & SPM-LS Kontraktual untuk BAST tanggal {selectedDateEvents.rolling5HK.sourceDateFormatted}.
                    </>
                  ) : (
                    <>
                      Tidak ada tenggat batas khusus pada tanggal ini. Layanan operasional berjalan normal.
                    </>
                  )}
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

          {/* Dedicated 5 HK Rolling Deadline Card (Kuning / Amber) */}
          {selectedDateEvents.rolling5HK && (
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-yellow-500/10 border-2 border-amber-400/90 dark:border-amber-500/70 shadow-lg space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 dark:border-amber-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-sm">
                    ⚡
                  </span>
                  <div>
                    <h5 className="font-black text-slate-950 dark:text-amber-100 text-base flex items-center gap-2">
                      Klausul Batas 5 Hari Kerja (H+5 HK)
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                        Klausul Manual
                      </span>
                    </h5>
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                      {selectedDateEvents.rolling5HK.pasal}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-400/40">
                    Pukul 17:00 WIB
                  </span>
                </div>
              </div>

              {/* Substantive Explanation */}
              <div className="bg-white/90 dark:bg-slate-900/90 p-4 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                <p className="font-bold text-slate-900 dark:text-white">
                  📌 Mengapa tanggal ini merupakan batas waktu?
                </p>
                <p>
                  Berdasarkan klausul PER-9/PB/2026, pendaftaran Kontrak/Perubahan Kontrak dan pengajuan SPM-LS Kontraktual untuk BAST/BAPP yang dibuat pada masa transisi/berjalan wajib disampaikan ke KPPN paling lambat <strong>5 (lima) Hari Kerja</strong> sejak tanggal penandatanganan dokumen.
                </p>
                <p>
                  Oleh karena itu, hari ini (<strong>{new Date(selectedDateEvents.dateStr + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>) adalah batas akhir bagi Satuan Kerja untuk mengajukan berkas BAST / Kontrak yang ditandatangani pada tanggal <strong>{selectedDateEvents.rolling5HK.sourceDateFormatted}</strong>.
                </p>
              </div>

              {/* 3-Col Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    📄 Tanggal BAST / Kontrak
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    {selectedDateEvents.rolling5HK.sourceDateFormatted}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Tanggal penandatanganan</div>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border-2 border-amber-500 shadow-xs">
                  <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                    ⏳ Batas Akhir (H+5 HK)
                  </div>
                  <div className="text-sm font-black text-amber-600 dark:text-amber-300 font-mono mt-0.5">
                    Hari Ini (17:00 WIB)
                  </div>
                  <div className="text-[11px] text-amber-800 dark:text-amber-200 font-medium mt-1">Tenggat SAKTI & KPPN</div>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    🛑 Plafon Mutlak Periode
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                    {selectedDateEvents.rolling5HK.hardCutOffFormatted}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Batas akhir sapu jagat</div>
                </div>
              </div>

              {/* Steps Audit Trail (Daftar 5 Hari Kerja Mundur/Maju) */}
              {selectedDateEvents.rolling5HK.stepsBack && selectedDateEvents.rolling5HK.stepsBack.length > 0 && (
                <div className="bg-white/60 dark:bg-slate-900/60 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Rincian Penghitungan 5 Hari Kerja (Tanpa Libur & Akhir Pekan):</span>
                    <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300">5 Hari Kerja Efektif</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                      Tgl BAST: {selectedDateEvents.rolling5HK.sourceDateFormatted}
                    </span>
                    <span className="text-slate-400">➔</span>
                    {selectedDateEvents.rolling5HK.stepsBack.slice().reverse().map((step, sIdx) => (
                      <span 
                        key={sIdx} 
                        className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                        title={step.note}
                      >
                        <span>HK-{step.dayIndex}: {formatShortDateID(step.dateStr)}</span>
                      </span>
                    ))}
                    <span className="text-slate-400">➔</span>
                    <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                      Batas Akhir: Hari Ini
                    </span>
                  </div>
                </div>
              )}

              {/* Forward Simulation Box */}
              <div className="p-3.5 rounded-xl bg-amber-100/90 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700/80 text-xs flex flex-wrap items-center justify-between gap-3 text-amber-950 dark:text-amber-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">💡</span>
                  <span>
                    Jika BAST / Kontrak baru ditandatangani <strong>HARI INI ({formatShortDateID(selectedDateEvents.dateStr)})</strong>: Batas pengajuannya adalah <strong>{selectedDateEvents.rolling5HK.forwardDeadlineFormatted}</strong> (Pukul 17:00 WIB).
                  </span>
                </div>
                <span className="text-[11px] font-black px-2.5 py-1 rounded bg-amber-400 text-slate-950 shrink-0 font-mono">
                  Batas H+5: {selectedDateEvents.rolling5HK.forwardDeadlineFormatted}
                </span>
              </div>
            </div>
          )}

          {selectedDateEvents.items.length > 0 && (
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
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${colorScheme.bg} ${colorScheme.text} border ${colorScheme.border}`}>
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
          )}
        </div>
      )}
    </div>
  );
};
