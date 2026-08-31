import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Clock,
  Building2,
  Calendar,
  Sparkles,
  CalendarDays,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { PengelolaanUPRecord, MasterSatker } from '../types';
import {
  formatBatasHariTanggal,
  parseDashboardReferenceDate,
  evaluateUPRecordStatus
} from '../data/initialUPData';
import { PaginationControl } from './PaginationControl';

interface PengelolaanUPDashboardProps {
  records?: PengelolaanUPRecord[];
  upRecords?: PengelolaanUPRecord[];
  masterSatkers?: MasterSatker[];
  userRole?: 'ADMIN' | 'PESERTA' | 'GUEST';
  userSatkerCode?: string;
  onOpenUploadModal?: () => void;
  onGoToAdmin?: () => void;
  onOpenReminder?: (record: PengelolaanUPRecord) => void;
  theme?: any;
  dashboardConfig?: any;
  isAdminAuthenticated?: boolean;
  customTexts?: any;
}

export const PengelolaanUPDashboard: React.FC<PengelolaanUPDashboardProps> = ({
  records,
  upRecords,
  masterSatkers = [],
  userRole = 'GUEST',
  userSatkerCode,
  onOpenUploadModal,
  onGoToAdmin,
  theme = 'light',
  dashboardConfig,
  isAdminAuthenticated,
  customTexts
}) => {
  const isDark = theme === 'dark';

  // Extract reference date from dashboard update dates
  const referenceDate = useMemo(() => {
    const rawDateStr = dashboardConfig?.updateDates?.pengelolaanUp || dashboardConfig?.updateDates?.dashboard;
    return parseDashboardReferenceDate(rawDateStr);
  }, [dashboardConfig]);

  const activeRecords = useMemo(() => {
    const raw = (records && records.length > 0) ? records : (upRecords || []);
    return raw.filter(r => {
      if (!r || !r.kodeSatker) return false;
      const code = String(r.kodeSatker).trim();
      // Valid Indonesian Satker code must be 5 to 6 digits, never a 18-digit timestamp
      if (!/^\d{5,6}$/.test(code)) return false;
      if (r.namaSatker && (r.namaSatker.includes('24082026') || r.namaSatker.toLowerCase().includes('tanggal unduh') || r.namaSatker.toLowerCase().includes('dicetak'))) return false;
      return true;
    });
  }, [records, upRecords]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | '1_MINGGU' | 'TELAT' | 'HARI_INI' | 'UP_ONLY' | 'TUP_ONLY'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Active Master Satker Map for enrichment
  const activeSatkerMap = useMemo(() => {
    const map = new Map<string, MasterSatker>();
    if (masterSatkers && masterSatkers.length > 0) {
      masterSatkers.forEach(m => {
        if (m.kodeSatker && m.isActive !== false) {
          map.set(m.kodeSatker.trim(), m);
        }
      });
    }
    return map;
  }, [masterSatkers]);

  // Role scoped records
  const scopedRecords = useMemo(() => {
    let list = activeRecords;
    if (userRole === 'PESERTA' && userSatkerCode) {
      list = list.filter(r => r.kodeSatker === userSatkerCode);
    }
    if (activeSatkerMap.size > 0) {
      list = list.filter(r => {
        const master = activeSatkerMap.get(r.kodeSatker?.trim());
        // Only exclude if master exists and is explicitly marked inactive
        if (master && master.isActive === false) return false;
        return true;
      });
    }
    return list;
  }, [activeRecords, userRole, userSatkerCode, activeSatkerMap]);

  // Evaluated record map for consistent sorting & filtering
  const evaluatedMap = useMemo(() => {
    const map = new Map<string, { up: ReturnType<typeof evaluateUPRecordStatus>; tup: ReturnType<typeof evaluateUPRecordStatus> }>();
    scopedRecords.forEach(item => {
      const up = evaluateUPRecordStatus(item, referenceDate, 'UP');
      const tup = evaluateUPRecordStatus(item, referenceDate, 'TUP');
      map.set(item.id || item.kodeSatker, { up, tup });
    });
    return map;
  }, [scopedRecords, referenceDate]);

  // Summary counts
  const stats = useMemo(() => {
    const total = scopedRecords.length;
    let countUP = 0;
    let countTUP = 0;
    let satuMinggu = 0;
    let countTelat = 0;
    let countHariIni = 0;
    let countMendekati = 0;
    let countNihil = 0;

    scopedRecords.forEach(r => {
      const evalData = evaluatedMap.get(r.id || r.kodeSatker);
      const up = evalData?.up;
      const tup = evalData?.tup;

      const hasUP = up && up.rawDeadline !== '-' && up.rawDeadline !== '';
      const hasTUP = tup && tup.rawDeadline !== '-' && tup.rawDeadline !== '';

      if (hasUP) countUP++;
      if (hasTUP) countTUP++;

      const isTelatAny = (hasUP && up.isTelat) || (hasTUP && tup.isTelat);
      const isHariIniAny = (hasUP && up.isHariIni) || (hasTUP && tup.isHariIni);
      const isMendekatiAny = (hasUP && up.isMendekati1Minggu) || (hasTUP && tup.isMendekati1Minggu);
      const is1MingguAny = (hasUP && up.isDalam1Minggu) || (hasTUP && tup.isDalam1Minggu);
      const isNihilAny = (hasUP && up.isNihil) || (hasTUP && tup.isNihil);

      if (isTelatAny) countTelat++;
      if (isHariIniAny) countHariIni++;
      if (isMendekatiAny) countMendekati++;
      if (is1MingguAny) satuMinggu++;
      if (isNihilAny) countNihil++;
    });

    return {
      total,
      countUP,
      countTUP,
      satuMinggu,
      countTelat,
      countHariIni,
      countMendekati,
      countNihil
    };
  }, [scopedRecords, evaluatedMap]);

  // Filtered by search & activeFilter
  const displayedRecords = useMemo(() => {
    return scopedRecords.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        item.kodeSatker.includes(q) ||
        item.namaSatker.toLowerCase().includes(q) ||
        (item.kementerianLembaga && item.kementerianLembaga.toLowerCase().includes(q)) ||
        (item.batasRevolvingKolomN && item.batasRevolvingKolomN.toLowerCase().includes(q)) ||
        (item.batasWaktuTUPKolomH && item.batasWaktuTUPKolomH.toLowerCase().includes(q)) ||
        (item.batasRevolving && item.batasRevolving.toLowerCase().includes(q));

      const evalData = evaluatedMap.get(item.id || item.kodeSatker);
      const up = evalData?.up;
      const tup = evalData?.tup;

      const hasUP = up && up.rawDeadline !== '-' && up.rawDeadline !== '';
      const hasTUP = tup && tup.rawDeadline !== '-' && tup.rawDeadline !== '';

      let matchFilter = true;
      if (activeFilter === '1_MINGGU') {
        matchFilter = (hasUP && up.isDalam1Minggu) || (hasTUP && tup.isDalam1Minggu) || false;
      } else if (activeFilter === 'TELAT') {
        matchFilter = (hasUP && up.isTelat) || (hasTUP && tup.isTelat) || false;
      } else if (activeFilter === 'HARI_INI') {
        matchFilter = (hasUP && up.isHariIni) || (hasTUP && tup.isHariIni) || false;
      } else if (activeFilter === 'UP_ONLY') {
        matchFilter = hasUP || false;
      } else if (activeFilter === 'TUP_ONLY') {
        matchFilter = hasTUP || false;
      }

      return matchSearch && matchFilter;
    });
  }, [scopedRecords, searchTerm, activeFilter, evaluatedMap]);

  const paginatedRecords = useMemo(() => {
    if (pageSize <= 0) return displayedRecords;
    return displayedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [displayedRecords, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-black uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5" />
                <span>{customTexts?.pengelolaanUpBadge || 'MODUL BATAS WAKTU UP & TUP'}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-purple-200 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Update Dashboard: <strong>{dashboardConfig?.updateDates?.pengelolaanUp || '31 Agustus 2026 - 08:40 WIB'}</strong></span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {customTexts?.pengelolaanUpTitle || 'Monitoring Batas Waktu UP & TUP'}
            </h1>
            <p className="text-sm text-slate-300">
              {customTexts?.pengelolaanUpSubtitle || 'Monitoring batas waktu UP (Kolom N) & Karwas TUP (Kolom H) per Satker dengan evaluasi status jatuh tempo real-time.'}
            </p>
          </div>

          {(userRole === 'ADMIN' || isAdminAuthenticated) && onGoToAdmin && (
            <button
              onClick={onGoToAdmin}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black px-5 py-3 rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all cursor-pointer text-sm shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Kelola / Upload UP &amp; TUP</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Satker */}
        <div
          onClick={() => {
            setActiveFilter('ALL');
            setCurrentPage(1);
          }}
          className={`border rounded-2xl p-5 shadow-sm space-y-2 cursor-pointer transition-all ${
            activeFilter === 'ALL'
              ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Satker</span>
            <Building2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {stats.total} <span className="text-xs font-semibold text-slate-400">Satker</span>
          </div>
          <div className="text-[11px] text-slate-500">Seluruh Satker terdaftar</div>
        </div>

        {/* Card 2: Batas Waktu UP */}
        <div
          onClick={() => {
            setActiveFilter('UP_ONLY');
            setCurrentPage(1);
          }}
          className={`border rounded-2xl p-5 shadow-sm space-y-2 cursor-pointer transition-all ${
            activeFilter === 'UP_ONLY'
              ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Batas Waktu UP</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            {stats.countUP} <span className="text-xs font-semibold text-slate-400">Satker</span>
          </div>
          <div className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">Memiliki batas revolving UP</div>
        </div>

        {/* Card 3: Batas Waktu TUP */}
        <div
          onClick={() => {
            setActiveFilter('TUP_ONLY');
            setCurrentPage(1);
          }}
          className={`border rounded-2xl p-5 shadow-sm space-y-2 cursor-pointer transition-all ${
            activeFilter === 'TUP_ONLY'
              ? 'bg-sky-500/10 border-sky-500 ring-2 ring-sky-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">Batas Waktu TUP</span>
            <CalendarDays className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">
            {stats.countTUP} <span className="text-xs font-semibold text-slate-400">Satker</span>
          </div>
          <div className="text-[11px] text-sky-700 dark:text-sky-300 font-semibold">Memiliki batas waktu TUP</div>
        </div>

        {/* Card 4: Kurun 1 Minggu & Telat */}
        <div
          onClick={() => {
            setActiveFilter('1_MINGGU');
            setCurrentPage(1);
          }}
          className={`border rounded-2xl p-5 shadow-sm space-y-2 cursor-pointer transition-all ${
            activeFilter === '1_MINGGU'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Kurun 1 Minggu &amp; Telat</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {stats.satuMinggu} <span className="text-xs font-semibold text-slate-400">Satker</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
            {stats.countTelat > 0 && <span className="text-rose-600">⚠️ {stats.countTelat} Telat</span>}
            {stats.countHariIni > 0 && <span>• ⚡ {stats.countHariIni} Hari Ini</span>}
            <span>• ⏱️ {stats.countMendekati} &le; 7 Hari</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        {/* Toolbar & Filter Badges */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode, nama satker, hari, tanggal..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => {
                setActiveFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Semua ({scopedRecords.length})
            </button>

            <button
              onClick={() => {
                setActiveFilter('1_MINGGU');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === '1_MINGGU'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400 font-black'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Kurun 1 Minggu ({stats.satuMinggu})</span>
            </button>

            {stats.countTelat > 0 && (
              <button
                onClick={() => {
                  setActiveFilter('TELAT');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === 'TELAT'
                    ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400 font-black'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Telat ({stats.countTelat})</span>
              </button>
            )}

            {stats.countHariIni > 0 && (
              <button
                onClick={() => {
                  setActiveFilter('HARI_INI');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === 'HARI_INI'
                    ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300 font-black'
                    : 'bg-amber-100/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Hari Ini ({stats.countHariIni})</span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveFilter('UP_ONLY');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'UP_ONLY'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
              }`}
            >
              Batas Waktu UP ({stats.countUP})
            </button>

            <button
              onClick={() => {
                setActiveFilter('TUP_ONLY');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'TUP_ONLY'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900'
              }`}
            >
              Batas Waktu TUP ({stats.countTUP})
            </button>
          </div>
        </div>

        {/* Legend Indicator & Explanation */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-purple-600" />
              <span>Keterangan Status:</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold border border-rose-300">
              🔴 Merah: Telat / Sudah Jatuh Tempo (UP &gt; 0%)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-900/70 dark:text-amber-200 font-bold border border-amber-400">
              🟡 Kuning: Jatuh Tempo Hari Ini ({referenceDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-semibold border border-amber-200">
              ⏱️ Amber: Kurun 1 Minggu (&le; 7 Hari)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium border border-emerald-200">
              ✓ Nihil (0.00% / Sisa UP 0 - Tidak Telat)
            </span>
          </div>

          {activeFilter !== 'ALL' && (
            <button
              onClick={() => {
                setActiveFilter('ALL');
                setCurrentPage(1);
              }}
              className="text-purple-600 dark:text-purple-400 font-bold underline text-[11px] cursor-pointer"
            >
              Reset ke Semua Satker
            </button>
          )}
        </div>

        {/* Informational Filter Tag */}
        {activeFilter === '1_MINGGU' && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Menampilkan satker yang memiliki batas waktu dalam <strong>kurun waktu 1 minggu (&le; 7 hari)</strong> dan satker yang <strong>sudah jatuh tempo/telat</strong> (UP &gt; 0%).</span>
            </div>
            <button
              onClick={() => {
                setActiveFilter('ALL');
                setCurrentPage(1);
              }}
              className="text-amber-700 dark:text-amber-300 font-bold underline text-[11px] cursor-pointer"
            >
              Tampilkan Semua Satker
            </button>
          </div>
        )}

        {/* Table Content */}
        {displayedRecords.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {activeFilter === '1_MINGGU'
                ? 'Tidak ada satker dengan batas waktu dalam kurun waktu 1 minggu.'
                : activeFilter === 'TELAT'
                ? 'Hebat! Tidak ada satker yang telat melewati batas waktu.'
                : activeFilter === 'HARI_INI'
                ? 'Tidak ada satker yang jatuh tempo hari ini.'
                : 'Belum ada data Batas Waktu UP & TUP.'}
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {activeFilter !== 'ALL' ? (
                <button
                  onClick={() => {
                    setActiveFilter('ALL');
                    setCurrentPage(1);
                  }}
                  className="text-purple-600 dark:text-purple-400 font-bold underline cursor-pointer"
                >
                  Klik di sini untuk melihat semua data ({scopedRecords.length} Satker)
                </button>
              ) : (
                'Silakan unggah data batas waktu UP (Kolom N) atau TUP (Kolom H) melalui menu Kelola Data.'
              )}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:-mx-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase">
                  <th className="py-3 px-3 w-12 text-center">NO</th>
                  <th className="py-3 px-4">KODE &amp; SATKER</th>
                  <th className="py-3 px-4">BATAS WAKTU UP (KOLOM N)</th>
                  <th className="py-3 px-4">BATAS WAKTU TUP (KOLOM H)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedRecords.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * (pageSize > 0 ? pageSize : 0) + idx + 1;
                  const evalData = evaluatedMap.get(item.id || item.kodeSatker);
                  const upStatus = evalData?.up || evaluateUPRecordStatus(item, referenceDate, 'UP');
                  const tupStatus = evalData?.tup || evaluateUPRecordStatus(item, referenceDate, 'TUP');

                  // Row background style based on status priority: Telat (Full Red) > Hari Ini (Full Yellow) > Mendekati (Amber)
                  let rowStyle = 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50';
                  const isRowTelat = upStatus.isTelat || tupStatus.isTelat;
                  const isRowHariIni = !isRowTelat && (upStatus.isHariIni || tupStatus.isHariIni);
                  const isRowMendekati = !isRowTelat && !isRowHariIni && (upStatus.isMendekati1Minggu || tupStatus.isMendekati1Minggu);

                  if (isRowTelat) {
                    rowStyle = 'bg-red-500/15 dark:bg-red-950/80 border-l-4 border-l-red-600 hover:bg-red-500/25 dark:hover:bg-red-900/90 text-red-950 dark:text-red-100';
                  } else if (isRowHariIni) {
                    rowStyle = 'bg-amber-300/35 dark:bg-amber-900/70 border-l-4 border-l-amber-500 hover:bg-amber-300/50 dark:hover:bg-amber-800/80 text-amber-950 dark:text-amber-100';
                  } else if (isRowMendekati) {
                    rowStyle = 'bg-amber-50/70 dark:bg-amber-950/30 border-l-4 border-l-amber-400 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 text-slate-800 dark:text-slate-200';
                  }

                  return (
                    <tr
                      key={item.id || idx}
                      className={`transition-colors ${rowStyle}`}
                    >
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{globalIdx}</td>
                      <td className="py-3 px-4">
                        <div className={`font-bold ${isRowTelat ? 'text-red-950 dark:text-red-100' : isRowHariIni ? 'text-amber-950 dark:text-amber-100' : 'text-slate-900 dark:text-slate-100'}`}>
                          {item.namaSatker}
                        </div>
                        <div className={`font-mono font-semibold ${isRowTelat ? 'text-red-700 dark:text-red-300' : isRowHariIni ? 'text-amber-800 dark:text-amber-300' : 'text-purple-600 dark:text-purple-400'}`}>
                          {item.kodeSatker}
                        </div>
                        {item.kementerianLembaga && (
                          <div className={`text-[10px] ${isRowTelat ? 'text-red-800/80 dark:text-red-300/80' : isRowHariIni ? 'text-amber-800/80 dark:text-amber-300/80' : 'text-slate-400'}`}>
                            {item.kementerianLembaga}
                          </div>
                        )}
                      </td>

                      {/* Kolom Batas Waktu UP */}
                      <td className="py-3 px-4">
                        {upStatus.rawDeadline !== '-' && upStatus.rawDeadline !== '' ? (
                          <div className="space-y-1">
                            <div className={`font-mono flex items-center gap-1.5 ${upStatus.textColorClass}`}>
                              {upStatus.isTelat ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              ) : upStatus.isHariIni ? (
                                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              ) : (
                                <Calendar className={`w-3.5 h-3.5 ${upStatus.isMendekati1Minggu ? 'text-amber-600' : 'text-purple-600'} shrink-0`} />
                              )}
                              <span>{upStatus.fullDateWithDay}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${upStatus.badgeColorClass}`}>
                                {upStatus.badgeLabel}
                              </span>

                              {upStatus.isWeekend && !upStatus.isNihil && (
                                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
                                  • Libur ({upStatus.saranTglPengajuan.split('(')[0].trim()})
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>

                      {/* Kolom Batas Waktu TUP */}
                      <td className="py-3 px-4">
                        {tupStatus.rawDeadline !== '-' && tupStatus.rawDeadline !== '' ? (
                          <div className="space-y-1">
                            <div className={`font-mono flex items-center gap-1.5 ${tupStatus.textColorClass}`}>
                              {tupStatus.isTelat ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              ) : tupStatus.isHariIni ? (
                                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              ) : (
                                <Calendar className={`w-3.5 h-3.5 ${tupStatus.isMendekati1Minggu ? 'text-amber-600' : 'text-sky-600'} shrink-0`} />
                              )}
                              <span>{tupStatus.fullDateWithDay}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${tupStatus.badgeColorClass}`}>
                                {tupStatus.badgeLabel}
                              </span>

                              {tupStatus.isWeekend && !tupStatus.isNihil && (
                                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
                                  • Libur ({tupStatus.saranTglPengajuan.split('(')[0].trim()})
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Control */}
        <PaginationControl
          currentPage={currentPage}
          totalItems={displayedRecords.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="Satker"
          isDark={theme === 'dark'}
          className="-mx-5 sm:-mx-6 -mb-5 sm:-mb-6 rounded-b-3xl"
        />
      </div>
    </div>
  );
};

