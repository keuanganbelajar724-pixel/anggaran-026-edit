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
  RotateCcw
} from 'lucide-react';
import { PengelolaanUPRecord, MasterSatker } from '../types';
import { formatBatasHariTanggal } from '../data/initialUPData';

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
  dashboardConfig,
  isAdminAuthenticated,
  customTexts
}) => {
  const activeRecords = useMemo(() => {
    return (records && records.length > 0) ? records : (upRecords || []);
  }, [records, upRecords]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | '1_MINGGU' | 'UP_ONLY' | 'TUP_ONLY'>('ALL');

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
      list = list.filter(r => activeSatkerMap.has(r.kodeSatker));
    }
    return list;
  }, [activeRecords, userRole, userSatkerCode, activeSatkerMap]);

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

      let matchFilter = true;
      if (activeFilter === '1_MINGGU') {
        matchFilter = item.isJatuhTempo1Minggu === true || (item.sisaHariRevolving !== undefined && item.sisaHariRevolving >= 0 && item.sisaHariRevolving <= 7);
      } else if (activeFilter === 'UP_ONLY') {
        matchFilter = !!(item.batasRevolvingKolomN || (item.jenisDana !== 'TUP' && item.batasRevolving));
      } else if (activeFilter === 'TUP_ONLY') {
        matchFilter = !!(item.batasWaktuTUPKolomH || (item.jenisDana === 'TUP' || (item as any).batasWaktuTUP));
      }

      return matchSearch && matchFilter;
    });
  }, [scopedRecords, searchTerm, activeFilter]);

  // Summary counts
  const stats = useMemo(() => {
    const total = scopedRecords.length;
    const countUP = scopedRecords.filter(r => r.batasRevolvingKolomN || (r.jenisDana !== 'TUP' && r.batasRevolving)).length;
    const countTUP = scopedRecords.filter(r => r.batasWaktuTUPKolomH || (r.jenisDana === 'TUP' || (r as any).batasWaktuTUP)).length;
    const satuMinggu = scopedRecords.filter(r => r.isJatuhTempo1Minggu || (r.sisaHariRevolving !== undefined && r.sisaHariRevolving >= 0 && r.sisaHariRevolving <= 7)).length;

    return {
      total,
      countUP,
      countTUP,
      satuMinggu
    };
  }, [scopedRecords]);

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
                <span>Update: <strong>{dashboardConfig?.updateDates?.pengelolaanUp || '07 Agustus 2026 - 09:00 WIB'}</strong></span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {customTexts?.pengelolaanUpTitle || 'Monitoring Batas Waktu UP & TUP'}
            </h1>
            <p className="text-sm text-slate-300">
              {customTexts?.pengelolaanUpSubtitle || 'Monitoring batas waktu UP (Kolom N) & Karwas TUP (Kolom H) per Satker dalam format hari dan tanggal.'}
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
          onClick={() => setActiveFilter('ALL')}
          className={`border rounded-2xl p-5 shadow-sm space-y-2 cursor-pointer transition-all ${
            activeFilter === 'ALL'
              ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
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
          onClick={() => setActiveFilter('UP_ONLY')}
          className={`border rounded-2xl p-5 shadow-sm space-y-2 cursor-pointer transition-all ${
            activeFilter === 'UP_ONLY'
              ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
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
          onClick={() => setActiveFilter('TUP_ONLY')}
          className={`border rounded-2xl p-5 shadow-sm space-y-2 cursor-pointer transition-all ${
            activeFilter === 'TUP_ONLY'
              ? 'bg-sky-500/10 border-sky-500 ring-2 ring-sky-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
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

        {/* Card 4: 1 Minggu Jatuh Tempo */}
        <div
          onClick={() => setActiveFilter('1_MINGGU')}
          className={`border rounded-2xl p-5 shadow-sm space-y-2 cursor-pointer transition-all ${
            activeFilter === '1_MINGGU'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Kurun 1 Minggu</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {stats.satuMinggu} <span className="text-xs font-semibold text-slate-400">Satker</span>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">Jatuh tempo &le; 7 hari</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        {/* Toolbar & Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode, nama satker, hari, tanggal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Semua ({scopedRecords.length})
            </button>

            <button
              onClick={() => setActiveFilter('1_MINGGU')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === '1_MINGGU'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Kurun 1 Minggu ({stats.satuMinggu})</span>
            </button>

            <button
              onClick={() => setActiveFilter('UP_ONLY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'UP_ONLY'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
              }`}
            >
              Batas Waktu UP ({stats.countUP})
            </button>

            <button
              onClick={() => setActiveFilter('TUP_ONLY')}
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

        {/* Informational Filter Tag */}
        {activeFilter === '1_MINGGU' && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Menampilkan satker yang memiliki batas waktu dalam <strong>kurun waktu 1 minggu (&le; 7 hari)</strong>.</span>
            </div>
            <button
              onClick={() => setActiveFilter('ALL')}
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
                : 'Belum ada data Batas Waktu UP & TUP.'}
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {activeFilter === '1_MINGGU' ? (
                <button
                  onClick={() => setActiveFilter('ALL')}
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase">
                  <th className="py-3 px-3 w-12 text-center">NO</th>
                  <th className="py-3 px-4">KODE &amp; SATKER</th>
                  <th className="py-3 px-4">BATAS WAKTU UP</th>
                  <th className="py-3 px-4">BATAS WAKTU TUP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedRecords.map((item, idx) => {
                  const upDeadline = formatBatasHariTanggal(item.batasRevolvingKolomN || (item.jenisDana !== 'TUP' ? item.batasRevolving : undefined));
                  const tupDeadline = formatBatasHariTanggal(item.batasWaktuTUPKolomH || (item.jenisDana === 'TUP' ? (item as any).batasWaktuTUP || item.batasRevolving : undefined));

                  return (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{item.namaSatker}</div>
                        <div className="font-mono text-purple-600 dark:text-purple-400 font-semibold">{item.kodeSatker}</div>
                        {item.kementerianLembaga && (
                          <div className="text-[10px] text-slate-400">{item.kementerianLembaga}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {upDeadline !== '-' ? (
                          <div className="font-mono font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>{upDeadline}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {tupDeadline !== '-' ? (
                          <div className="font-mono font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span>{tupDeadline}</span>
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
      </div>
    </div>
  );
};
