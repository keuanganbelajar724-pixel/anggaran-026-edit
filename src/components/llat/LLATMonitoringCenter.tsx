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
  ChevronLeft,
  RefreshCw,
  Info,
  ShieldAlert,
  Flame,
  ArrowRight,
  HelpCircle,
  Eye,
  CheckSquare,
  CalendarRange,
  Layers,
  Inbox
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
  getStatusBadge,
  getVerificationBadge,
  getDeadlineTypeBadge 
} from '../../data/defaultLlatData';
import { LLATCalendarMonthView } from './LLATCalendarMonthView';
import { LLATCalendarWeekView } from './LLATCalendarWeekView';
import { LLATDailyAgendaView } from './LLATDailyAgendaView';
import { LLATListView } from './LLATListView';
import { LLATTimelineView } from './LLATTimelineView';
import { LLATDetailModal } from './LLATDetailModal';
import { LLATExportPdfModal } from './LLATExportPdfModal';
import { LLATWorkingDaysCalculator } from './LLATWorkingDaysCalculator';
import { Calculator } from 'lucide-react';

interface LLATMonitoringCenterProps {
  events: LLATEvent[];
  categories: LLATCategory[];
  settings: LLATSettings;
  isAdminAuthenticated: boolean;
  currentUser?: { name?: string; role?: string; satkerCode?: string } | null;
  onGoToAdmin?: () => void;
  theme?: string;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const LLATMonitoringCenter: React.FC<LLATMonitoringCenterProps> = ({
  events,
  categories,
  settings,
  isAdminAuthenticated,
  currentUser,
  onGoToAdmin,
  theme
}) => {
  // View modes: 'calendar' | 'week' | 'daily' | 'list' | 'timeline' | 'calculator'
  const [viewMode, setViewMode] = useState<'calendar' | 'week' | 'daily' | 'list' | 'timeline' | 'calculator'>('calendar');

  // Filter States: Default awal adalah Oktober 2026 (index 9)
  const [selectedYear, setSelectedYear] = useState<number>(settings.tahun_aktif || 2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // 9 = Oktober (0-indexed)
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [targetFilter, setTargetFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyToday, setOnlyToday] = useState<boolean>(false);

  // Modals
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<LLATEvent | null>(null);
  const [isExportPdfOpen, setIsExportPdfOpen] = useState<boolean>(false);

  // Available Years
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
      // Periksa apakah kegiatan relevan dengan tahun yang dipilih (termasuk tenggat lanjutan Jan 2027 untuk TA 2026)
      const matchesYear = 
        ev.tahun_anggaran === selectedYear ||
        ev.tahun_kalender_tenggat === selectedYear ||
        (ev.tanggal_batas && ev.tanggal_batas.startsWith(String(selectedYear))) ||
        (ev.tanggal_penerimaan && ev.tanggal_penerimaan.startsWith(String(selectedYear))) ||
        (ev.tanggal_penyelesaian && ev.tanggal_penyelesaian.startsWith(String(selectedYear))) ||
        (ev.tanggal_tenggat && ev.tanggal_tenggat.startsWith(String(selectedYear)));

      if (!matchesYear) return false;

      if (onlyToday) {
        const isCutOffToday = 
          ev.tanggal_batas === todayStr || 
          ev.tanggal_penerimaan === todayStr || 
          ev.tanggal_penyelesaian === todayStr;
        if (!isCutOffToday) return false;
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

  // 8 STATISTICAL SUMMARY CARDS (Section D of User Requirements)
  const dynamicKpiStats = useMemo(() => {
    const yearEvents = accessibleEvents.filter((e) => {
      return (
        e.tahun_anggaran === selectedYear ||
        e.tahun_kalender_tenggat === selectedYear ||
        (e.tanggal_batas && e.tanggal_batas.startsWith(String(selectedYear))) ||
        (e.tanggal_penerimaan && e.tanggal_penerimaan.startsWith(String(selectedYear))) ||
        (e.tanggal_penyelesaian && e.tanggal_penyelesaian.startsWith(String(selectedYear)))
      );
    });

    // 1. Total kegiatan aktif
    const totalAktif = yearEvents.filter((e) => e.is_active).length;

    // 2. Tenggat hari ini
    const hariIniCount = yearEvents.filter((e) => {
      const pen = e.tanggal_penerimaan || e.tanggal_batas;
      return pen === todayStr || e.tanggal_penyelesaian === todayStr;
    }).length;

    // 3. Tenggat 7 hari ke depan
    const dToday = new Date(todayStr + 'T00:00:00');
    const d7Days = new Date(dToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    const d7DaysStr = `${d7Days.getFullYear()}-${String(d7Days.getMonth() + 1).padStart(2, '0')}-${String(d7Days.getDate()).padStart(2, '0')}`;
    
    const tujuhHariCount = yearEvents.filter((e) => {
      const d = e.tanggal_penerimaan || e.tanggal_batas;
      return d > todayStr && d <= d7DaysStr && e.is_tanggal_pasti !== false;
    }).length;

    // 4. Tenggat 30 hari ke depan
    const d30Days = new Date(dToday.getTime() + 30 * 24 * 60 * 60 * 1000);
    const d30DaysStr = `${d30Days.getFullYear()}-${String(d30Days.getMonth() + 1).padStart(2, '0')}-${String(d30Days.getDate()).padStart(2, '0')}`;

    const tigaPuluhHariCount = yearEvents.filter((e) => {
      const d = e.tanggal_penerimaan || e.tanggal_batas;
      return d > todayStr && d <= d30DaysStr && e.is_tanggal_pasti !== false;
    }).length;

    // 5. Tenggat yang telah lewat
    const telahLewatCount = yearEvents.filter((e) => {
      const d = e.tanggal_penerimaan || e.tanggal_batas;
      return d < todayStr && e.is_tanggal_pasti !== false && e.status_penyelesaian !== 'SELESAI';
    }).length;

    // 6. Kegiatan tanpa tanggal pasti (aturan relatif)
    const tanpaTanggalPastiCount = yearEvents.filter((e) => {
      return e.is_tanggal_pasti === false || Boolean(e.aturan_relatif);
    }).length;

    // 7. Kegiatan yang masih perlu diverifikasi
    const perluVerifikasiCount = yearEvents.filter((e) => {
      return e.status_verifikasi === 'PERLU_PEMERIKSAAN_MANUAL' || e.status_verifikasi === 'BELUM_DIVERIFIKASI';
    }).length;

    // 8. Kegiatan yang sudah dipublikasikan
    const sudahPublikasiCount = yearEvents.filter((e) => e.publikasi === 'PUBLISHED').length;

    return {
      totalAktif,
      hariIniCount,
      tujuhHariCount,
      tigaPuluhHariCount,
      telahLewatCount,
      tanpaTanggalPastiCount,
      perluVerifikasiCount,
      sudahPublikasiCount
    };
  }, [accessibleEvents, selectedYear, todayStr]);

  // 1. TENGGAT HARI INI LIST
  const todayDeadlines = useMemo(() => {
    return accessibleEvents
      .filter((e) => {
        if (e.tahun_anggaran !== selectedYear) return false;
        const pen = e.tanggal_penerimaan || e.tanggal_batas;
        return pen === todayStr || e.tanggal_penyelesaian === todayStr;
      })
      .sort((a, b) => {
        const jamA = a.jam_batas || '23:59';
        const jamB = b.jam_batas || '23:59';
        return jamA.localeCompare(jamB);
      });
  }, [accessibleEvents, selectedYear, todayStr]);

  // 2. TENGGAT TERDEKAT LIST (Upcoming, min 3 items)
  const upcomingDeadlines = useMemo(() => {
    return accessibleEvents
      .filter((e) => {
        if (e.tahun_anggaran !== selectedYear) return false;
        const d = e.tanggal_penerimaan || e.tanggal_batas;
        return d && d >= todayStr && e.is_tanggal_pasti !== false && e.status_penyelesaian !== 'SELESAI';
      })
      .sort((a, b) => {
        const da = a.tanggal_penerimaan || a.tanggal_batas || '';
        const db = b.tanggal_penerimaan || b.tanggal_batas || '';
        if (da !== db) return da.localeCompare(db);
        const ja = a.jam_batas || '23:59';
        const jb = b.jam_batas || '23:59';
        return ja.localeCompare(jb);
      });
  }, [accessibleEvents, selectedYear, todayStr]);

  // 3. TENGGAT 7 HARI KE DEPAN LIST
  const sevenDaysDeadlines = useMemo(() => {
    const dToday = new Date(todayStr + 'T00:00:00');
    const d7Days = new Date(dToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    const d7DaysStr = `${d7Days.getFullYear()}-${String(d7Days.getMonth() + 1).padStart(2, '0')}-${String(d7Days.getDate()).padStart(2, '0')}`;

    return accessibleEvents
      .filter((e) => {
        if (e.tahun_anggaran !== selectedYear) return false;
        const d = e.tanggal_penerimaan || e.tanggal_batas;
        return d && d > todayStr && d <= d7DaysStr && e.is_tanggal_pasti !== false && e.status_penyelesaian !== 'SELESAI';
      })
      .sort((a, b) => {
        const da = a.tanggal_penerimaan || a.tanggal_batas || '';
        const db = b.tanggal_penerimaan || b.tanggal_batas || '';
        return da.localeCompare(db);
      });
  }, [accessibleEvents, selectedYear, todayStr]);

  // 4. PERLU PERHATIAN LIST (Overdue, Critical due soon, or Unverified/Belum selesai)
  const attentionItems = useMemo(() => {
    return accessibleEvents
      .filter((e) => {
        if (e.tahun_anggaran !== selectedYear) return false;
        const d = e.tanggal_penerimaan || e.tanggal_batas;
        const isOverdue = d && d < todayStr && e.status_penyelesaian !== 'SELESAI' && e.is_tanggal_pasti !== false;
        const isCriticalSoon = e.prioritas === 'KRITIS' && d && d >= todayStr && e.status_penyelesaian !== 'SELESAI';
        const isNeedsManual = e.status_verifikasi === 'PERLU_PEMERIKSAAN_MANUAL';
        return isOverdue || isCriticalSoon || isNeedsManual;
      })
      .sort((a, b) => {
        const da = a.tanggal_penerimaan || a.tanggal_batas || '';
        const db = b.tanggal_penerimaan || b.tanggal_batas || '';
        return da.localeCompare(db);
      });
  }, [accessibleEvents, selectedYear, todayStr]);

  const nearestUpcomingEvent = upcomingDeadlines[0] || null;

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleGoToToday = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
    setOnlyToday(true);
    setViewMode('daily');
  };

  const handleGoToNearest = () => {
    if (nearestUpcomingEvent) {
      setSelectedDetailEvent(nearestUpcomingEvent);
    } else {
      setViewMode('timeline');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* 1. HEADER KALENDER (Section C.1) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#0a192f] to-[#1e3a8a] text-white p-6 sm:p-8 shadow-2xl border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute right-1/3 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mb-20" />

        <div className="relative z-10 space-y-6">
          {/* Top metadata row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                <CalendarIcon className="w-4 h-4" />
                <span>PUSAT PENGENDALIAN JADWAL LLAT</span>
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 text-white text-xs font-bold font-mono border border-white/15">
                KPPN Semarang I
              </span>
              <span className="px-3 py-1 rounded-xl bg-blue-500/30 text-blue-200 text-xs font-black border border-blue-400/30">
                TA {selectedYear}
              </span>
            </div>

            {/* Version & Publication Indicators */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Status: Terpublikasi Aktif</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 font-mono text-[11px] border border-white/10">
                Versi Kalender: v{settings.version || 2}.0
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-300 text-[11px] border border-white/10">
                Pembaruan: Oktober 2026
              </span>
            </div>
          </div>

          {/* Title and Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                PUSAT PENGENDALIAN JADWAL LLAT
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed mt-1">
                KPPN Tipe A1 Semarang I — Pengawalan terpadu batas waktu pengajuan SPM, pendaftaran kontrak, jaminan bank, penyelesaian UP/TUP, dan rekonsiliasi akhir tahun TA 2026.
              </p>
            </div>

            {/* Month & Year Selectors & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-white/15 border border-white/20 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="text-slate-900 font-bold">
                    TA {yr}
                  </option>
                ))}
              </select>

              {/* Month Selector */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-white/15 border border-white/20 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx} className="text-slate-900 font-bold">
                    {m}
                  </option>
                ))}
              </select>

              {/* Prev / Next Month Buttons */}
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/15">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Button Hari Ini */}
              <button
                type="button"
                onClick={handleGoToToday}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition-colors shadow-md"
              >
                Hari Ini
              </button>

              {/* Button Lihat Tenggat Terdekat */}
              <button
                type="button"
                onClick={handleGoToNearest}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-colors shadow-md flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Lihat Tenggat Terdekat</span>
              </button>

              {/* Admin Manage button if logged in */}
              {isAdminAuthenticated && onGoToAdmin && (
                <button
                  type="button"
                  onClick={onGoToAdmin}
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition-colors flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
                  <span>Kelola Admin</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Month Shortcuts Bar (September 2026 s.d. Januari 2027) */}
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-bold mr-1 text-[11px]">Pilihan Cepat Bulan:</span>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setSelectedYear(now.getFullYear());
                  setSelectedMonth(now.getMonth());
                }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth()
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => { setSelectedYear(2026); setSelectedMonth(8); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedYear === 2026 && selectedMonth === 8
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200'
                }`}
              >
                September 2026
              </button>
              <button
                type="button"
                onClick={() => { setSelectedYear(2026); setSelectedMonth(9); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedYear === 2026 && selectedMonth === 9
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200'
                }`}
              >
                Oktober 2026
              </button>
              <button
                type="button"
                onClick={() => { setSelectedYear(2026); setSelectedMonth(10); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedYear === 2026 && selectedMonth === 10
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm ring-2 ring-amber-300'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200'
                }`}
              >
                November 2026 ⭐
              </button>
              <button
                type="button"
                onClick={() => { setSelectedYear(2026); setSelectedMonth(11); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedYear === 2026 && selectedMonth === 11
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200'
                }`}
              >
                Desember 2026
              </button>
              <button
                type="button"
                onClick={() => { setSelectedYear(2027); setSelectedMonth(0); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedYear === 2027 && selectedMonth === 0
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200'
                }`}
              >
                Januari 2027
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Aktif: <span className="text-white font-bold">{MONTH_NAMES[selectedMonth]} {selectedYear}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. PANEL: HARI INI ADA DEADLINE APA? (Section 2 Prompt)        */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  🔔 HARI INI ADA DEADLINE APA?
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoring otomatis kewajiban dan batas waktu pengajuan dokumen yang jatuh tempo tepat pada hari ini.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-500 font-mono">
            {todayDeadlines.length} agenda jatuh tempo
          </span>
        </div>

        {todayDeadlines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {todayDeadlines.map((ev) => {
              const priority = getPriorityBadge(ev.prioritas);
              const isPenerimaan = (ev.tanggal_penerimaan || ev.tanggal_batas) === todayStr;
              return (
                <div
                  key={ev.llat_id}
                  onClick={() => setSelectedDetailEvent(ev)}
                  className="p-4 rounded-2xl border-2 border-rose-300 dark:border-rose-800/80 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-900/30 transition-all cursor-pointer group flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-rose-600 text-white">
                        {ev.kode_kegiatan}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-700">
                        {isPenerimaan ? '📥 Batas Penerimaan' : '🏁 Batas Penyelesaian'}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${priority.badgeClass}`}>
                        {priority.label}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors leading-snug">
                      {ev.nama_kegiatan}
                    </h3>

                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      {ev.jenis_dokumen && (
                        <p className="line-clamp-1">
                          <span className="font-bold text-slate-700 dark:text-slate-200">Dokumen:</span> {ev.jenis_dokumen}
                        </p>
                      )}
                      <p className="line-clamp-2 text-[11px] leading-relaxed">
                        <span className="font-bold text-slate-700 dark:text-slate-200">Ketentuan:</span> {ev.deskripsi}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-rose-200/80 dark:border-rose-800/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-rose-700 dark:text-rose-300 font-black">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Batas: Pukul {ev.jam_batas || '17:00'} {ev.timezone || 'WIB'}</span>
                    </div>

                    <span className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300 group-hover:translate-x-1 transition-transform">
                      <span>Lihat Detail</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold">
                ✅ Tidak ada deadline yang tercatat untuk hari ini.
              </p>
              <p className="text-emerald-700/80 dark:text-emerald-300/80 text-xs mt-0.5">
                Silakan pantau tenggat terdekat berikutnya pada panel di bawah ini untuk persiapan dokumen lebih awal.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. PANEL: DEADLINE TERDEKAT (Section 3 Prompt - Min 3 items)    */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                ⏳ DEADLINE TERDEKAT
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daftar agenda dengan batas waktu paling dekat yang harus segera dipenuhi oleh satuan kerja dan BLU.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-500">
            Menampilkan {Math.min(upcomingDeadlines.length, 6)} tenggat terdekat
          </span>
        </div>

        {upcomingDeadlines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {upcomingDeadlines.slice(0, 6).map((ev) => {
              const priority = getPriorityBadge(ev.prioritas);
              const countdown = getCountdownInfo(ev);
              const targetDate = ev.tanggal_penerimaan || ev.tanggal_batas || '';
              const dateObj = new Date(targetDate + 'T00:00:00');
              const formattedDate = dateObj.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });

              return (
                <div
                  key={`upcoming-${ev.llat_id}`}
                  onClick={() => setSelectedDetailEvent(ev)}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all cursor-pointer group flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black font-mono bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        {countdown.text}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-amber-300">
                        {ev.kode_kegiatan}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                        {ev.kategori}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${priority.badgeClass}`}>
                        {priority.label}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
                      {ev.nama_kegiatan}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {ev.deskripsi}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pukul {ev.jam_batas || '17:00'} {ev.timezone || 'WIB'}</span>
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform cursor-pointer"
                    >
                      <span>Lihat Detail</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold text-center">
            Tidak ada deadline mendatang yang tercatat.
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. DUAL ROW: 7 HARI KE DEPAN & PERLU PERHATIAN                 */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL: DEADLINE 7 HARI KE DEPAN (Section 4 Prompt) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                <CalendarRange className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  📅 DEADLINE 7 HARI KE DEPAN
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Total: {sevenDaysDeadlines.length} deadline krusial minggu ini
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setOnlyToday(false); setViewMode('week'); }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Kalender Mingguan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {sevenDaysDeadlines.length > 0 ? (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {sevenDaysDeadlines.map((ev) => {
                const targetDate = ev.tanggal_penerimaan || ev.tanggal_batas || '';
                const dateObj = new Date(targetDate + 'T00:00:00');
                const priority = getPriorityBadge(ev.prioritas);
                return (
                  <div
                    key={`7d-${ev.llat_id}`}
                    onClick={() => setSelectedDetailEvent(ev)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-700 dark:text-blue-400">
                          {dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 font-mono">Pukul {ev.jam_batas || '17:00'}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${priority.badgeClass}`}>
                          {priority.label}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {ev.nama_kegiatan}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {ev.kategori}
                      </p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold text-center">
              Tidak ada deadline dalam 7 hari ke depan.
            </div>
          )}
        </div>

        {/* PANEL: PERLU PERHATIAN (Section 5 Prompt) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  ⚠️ PERLU PERHATIAN
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tenggat terlewat, prioritas kritis, dan agenda perlu verifikasi
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono">
              {attentionItems.length} agenda perhatian
            </span>
          </div>

          {attentionItems.length > 0 ? (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {attentionItems.slice(0, 8).map((ev) => {
                const targetDate = ev.tanggal_penerimaan || ev.tanggal_batas || '';
                const isOverdue = targetDate && targetDate < todayStr;
                return (
                  <div
                    key={`att-${ev.llat_id}`}
                    onClick={() => setSelectedDetailEvent(ev)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-400 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-rose-50/20 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white">
                            Tenggat Lewat
                          </span>
                        )}
                        {ev.prioritas === 'KRITIS' && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            Prioritas Kritis
                          </span>
                        )}
                        {ev.status_verifikasi === 'PERLU_PEMERIKSAAN_MANUAL' && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800">
                            Perlu Cek Manual
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-slate-400">{ev.kode_kegiatan}</span>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {ev.nama_kegiatan}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Tenggat: {targetDate || 'Aturan Relatif'} • Pukul {ev.jam_batas || '17:00'}
                      </p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold text-center">
              Semua agenda dalam kondisi normal.
            </div>
          )}
        </div>
      </div>

      {/* 2. 8 KARTU RINGKASAN DINAMIS (Section D) - Enhanced with rich colors & gradients */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
        {/* 1. Total kegiatan aktif */}
        <div 
          onClick={() => { setOnlyToday(false); setViewMode('list'); }}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-blue-50/60 dark:from-indigo-950/40 dark:to-blue-950/20 border-2 border-indigo-200/90 dark:border-indigo-800/80 hover:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 block truncate">
            1. Total Aktif
          </span>
          <div className="text-2xl font-black text-indigo-900 dark:text-indigo-100 mt-1 group-hover:scale-105 transition-transform">
            {dynamicKpiStats.totalAktif}
          </div>
          <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 block mt-0.5 truncate font-semibold">Agenda TA {selectedYear}</span>
        </div>

        {/* 2. Tenggat hari ini */}
        <div 
          onClick={() => { setOnlyToday(true); setViewMode('daily'); }}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-100 to-red-50 dark:from-rose-950/60 dark:to-red-950/30 border-2 border-rose-300 dark:border-rose-800 hover:border-rose-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-300 block truncate flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
            2. Hari Ini
          </span>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-200 mt-1 group-hover:scale-105 transition-transform">
            {dynamicKpiStats.hariIniCount}
          </div>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-0.5 truncate font-extrabold">Jatuh tempo</span>
        </div>

        {/* 3. Tenggat 7 hari ke depan */}
        <div 
          onClick={() => { setOnlyToday(false); setViewMode('week'); }}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/70 dark:from-amber-950/40 dark:to-orange-950/20 border-2 border-amber-300 dark:border-amber-800 hover:border-amber-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 block truncate">
            3. H-7 Ke Depan
          </span>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-200 mt-1 group-hover:scale-105 transition-transform">
            {dynamicKpiStats.tujuhHariCount}
          </div>
          <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 block mt-0.5 truncate font-semibold">Masa krusial</span>
        </div>

        {/* 4. Tenggat 30 hari ke depan */}
        <div 
          onClick={() => { setOnlyToday(false); setViewMode('calendar'); }}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/20 border-2 border-sky-300 dark:border-sky-800 hover:border-sky-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <span className="text-[10px] font-black uppercase text-sky-800 dark:text-sky-300 block truncate">
            4. H-30 Hari
          </span>
          <div className="text-2xl font-black text-sky-700 dark:text-sky-200 mt-1 group-hover:scale-105 transition-transform">
            {dynamicKpiStats.tigaPuluhHariCount}
          </div>
          <span className="text-[10px] text-sky-600/80 dark:text-sky-400/80 block mt-0.5 truncate font-semibold">Bulan ini</span>
        </div>

        {/* 5. Tenggat yang telah lewat */}
        <div 
          onClick={() => { setOnlyToday(false); setStatusFilter('TERLEWAT'); setViewMode('list'); }}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/20 border-2 border-red-300 dark:border-red-800 hover:border-red-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <span className="text-[10px] font-black uppercase text-red-700 dark:text-red-300 block truncate">
            5. Lewat Tenggat
          </span>
          <div className="text-2xl font-black text-red-700 dark:text-red-200 mt-1 group-hover:scale-105 transition-transform">
            {dynamicKpiStats.telahLewatCount}
          </div>
          <span className="text-[10px] text-red-600/80 dark:text-red-400/80 block mt-0.5 truncate font-semibold">Perlu konfirmasi</span>
        </div>

        {/* 6. Kegiatan tanpa tanggal pasti */}
        <div 
          onClick={() => { setOnlyToday(false); setViewMode('list'); }}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/40 dark:to-fuchsia-950/20 border-2 border-purple-300 dark:border-purple-800 hover:border-purple-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <span className="text-[10px] font-black uppercase text-purple-800 dark:text-purple-300 block truncate">
            6. Aturan Relatif
          </span>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-200 mt-1 group-hover:scale-105 transition-transform">
            {dynamicKpiStats.tanpaTanggalPastiCount}
          </div>
          <span className="text-[10px] text-purple-600/80 dark:text-purple-400/80 block mt-0.5 truncate font-semibold">Syarat khusus</span>
        </div>

        {/* 7. Kegiatan perlu diverifikasi */}
        <div 
          onClick={() => { setOnlyToday(false); setViewMode('list'); }}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/20 border-2 border-orange-300 dark:border-orange-800 hover:border-orange-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <span className="text-[10px] font-black uppercase text-orange-800 dark:text-orange-300 block truncate">
            7. Verifikasi
          </span>
          <div className="text-2xl font-black text-orange-700 dark:text-orange-200 mt-1 group-hover:scale-105 transition-transform">
            {dynamicKpiStats.perluVerifikasiCount}
          </div>
          <span className="text-[10px] text-orange-600/80 dark:text-orange-400/80 block mt-0.5 truncate font-semibold">Cek dokumen</span>
        </div>

        {/* 8. Kegiatan sudah dipublikasikan */}
        <div 
          onClick={() => { setOnlyToday(false); setViewMode('list'); }}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border-2 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 block truncate">
            8. Terpublikasi
          </span>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-200 mt-1 group-hover:scale-105 transition-transform">
            {dynamicKpiStats.sudahPublikasiCount}
          </div>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5 truncate font-semibold">Telah live</span>
        </div>
      </div>

      {/* 3. VIEW MODE SWITCHER TABS (Section C.2) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 5 Tabs as explicitly specified */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs">
            <button
              type="button"
              onClick={() => {
                setOnlyToday(false);
                setViewMode('calendar');
              }}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'calendar' && !onlyToday
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-indigo-500" />
              <span>Kalender Bulanan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlyToday(false);
                setViewMode('week');
              }}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'week' && !onlyToday
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CalendarRange className="w-4 h-4 text-sky-500" />
              <span>Kalender Mingguan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlyToday(false);
                setViewMode('daily');
              }}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'daily' || onlyToday
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>Agenda Harian</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlyToday(false);
                setViewMode('list');
              }}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'list' && !onlyToday
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4 text-blue-500" />
              <span>Daftar Tenggat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlyToday(false);
                setViewMode('timeline');
              }}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'timeline' && !onlyToday
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <GitCommit className="w-4 h-4 text-purple-500" />
              <span>Timeline Akhir Tahun</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOnlyToday(false);
                setViewMode('calculator');
              }}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'calculator' && !onlyToday
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-4 h-4 text-emerald-500" />
              <span>Mesin Hitung Hari Kerja</span>
            </button>
          </div>

          {/* Quick PDF & Reset Toolbar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExportPdfOpen(true)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-500" />
              <span>Cetak PDF</span>
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
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* Kategori */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
          >
            <option value="ALL">Semua Kategori ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.nama}>{c.nama}</option>
            ))}
          </select>

          {/* Prioritas */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="KRITIS">KRITIS</option>
            <option value="PENTING">PENTING</option>
            <option value="NORMAL">NORMAL</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
          >
            <option value="ALL">Semua Status</option>
            <option value="HARI_INI">HARI INI</option>
            <option value="SEGERA">SEGERA JATUH TEMPO</option>
            <option value="BERJALAN">BERJALAN</option>
            <option value="BELUM_DIMULAI">BELUM DIMULAI</option>
            <option value="SELESAI">SELESAI</option>
            <option value="TERLEWAT">TERLEWAT</option>
          </select>

          {/* Target Sasaran */}
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
          >
            <option value="ALL">Semua Sasaran Satker</option>
            <option value="BENDAHARA">Bendahara</option>
            <option value="PPK">PPK</option>
            <option value="PPSPM">PPSPM</option>
            <option value="KPA">KPA</option>
            <option value="OPERATOR">Operator SAKTI</option>
            <option value="UAKPA">UAKPA / Akuntansi</option>
            <option value="BLU">BLU</option>
          </select>

          {/* Search Box */}
          <div className="relative col-span-2 sm:col-span-4 lg:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari agenda LLAT..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
            />
          </div>
        </div>
      </div>

      {/* 4. ACTIVE VIEW COMPONENT RENDERER */}
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

        {viewMode === 'week' && !onlyToday && (
          <LLATCalendarWeekView
            events={filteredEvents}
            initialDate={`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-07`}
            onSelectEvent={(event) => setSelectedDetailEvent(event)}
          />
        )}

        {(viewMode === 'daily' || onlyToday) && (
          <LLATDailyAgendaView
            events={filteredEvents}
            initialDate={onlyToday ? todayStr : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-08`}
            onSelectEvent={(event) => setSelectedDetailEvent(event)}
          />
        )}

        {viewMode === 'list' && !onlyToday && (
          <LLATListView
            events={filteredEvents}
            categories={categories}
            onSelectEvent={(event) => setSelectedDetailEvent(event)}
            searchQuery={searchQuery}
          />
        )}

        {viewMode === 'timeline' && !onlyToday && (
          <LLATTimelineView
            events={filteredEvents}
            onSelectEvent={(event) => setSelectedDetailEvent(event)}
          />
        )}

        {viewMode === 'calculator' && !onlyToday && (
          <LLATWorkingDaysCalculator
            onApplyDate={(calculatedDate) => {
              // Set query pencarian ke tanggal hasil kalkulasi dan arahkan ke daftar agenda
              setSearchQuery(calculatedDate);
              setViewMode('list');
            }}
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
