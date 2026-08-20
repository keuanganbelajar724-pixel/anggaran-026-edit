import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Building2,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  AlertCircle,
  CalendarDays,
  BellRing
} from 'lucide-react';
import { PengelolaanUPRecord, MasterSatker } from '../types';

interface PengelolaanUPDashboardProps {
  records?: PengelolaanUPRecord[];
  masterSatkers?: MasterSatker[];
  userRole?: 'ADMIN' | 'PESERTA' | 'GUEST';
  userSatkerCode?: string;
  onOpenUploadModal?: () => void;
  customTexts?: any;
}

export const PengelolaanUPDashboard: React.FC<PengelolaanUPDashboardProps> = ({
  records = [],
  masterSatkers = [],
  userRole = 'GUEST',
  userSatkerCode,
  onOpenUploadModal,
  customTexts
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  // Default to 1-week filter as requested: "yang tampil di dashboard cukup yang masih ada di excel dalam kurun waktu 1 minggu"
  const [activeFilter, setActiveFilter] = useState<'1_MINGGU' | 'ALL' | 'UP_ONLY' | 'TUP_ONLY' | 'KRITIS'>('1_MINGGU');
  const [selectedRecord, setSelectedRecord] = useState<PengelolaanUPRecord | null>(null);

  // Active Master Satker Map
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

  // Filtered by role (if peserta, isolate to their own satker only)
  const scopedRecords = useMemo(() => {
    let list = records;
    if (userRole === 'PESERTA' && userSatkerCode) {
      list = list.filter(r => r.kodeSatker === userSatkerCode);
    }
    // Filter against master satkers if available
    if (activeSatkerMap.size > 0) {
      list = list.filter(r => activeSatkerMap.has(r.kodeSatker));
    }
    return list;
  }, [records, userRole, userSatkerCode, activeSatkerMap]);

  // Filtered by search & activeFilter
  const displayedRecords = useMemo(() => {
    return scopedRecords.filter(item => {
      const matchSearch =
        item.kodeSatker.includes(searchTerm) ||
        item.namaSatker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.kementerianLembaga && item.kementerianLembaga.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.batasRevolvingKolomN && item.batasRevolvingKolomN.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.batasWaktuTUPKolomH && item.batasWaktuTUPKolomH.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchFilter = true;
      if (activeFilter === '1_MINGGU') {
        // Kurun waktu 1 minggu (jatuh tempo <= 7 hari atau bertanda isJatuhTempo1Minggu)
        matchFilter = item.isJatuhTempo1Minggu === true || (item.sisaHariRevolving !== undefined && item.sisaHariRevolving >= 0 && item.sisaHariRevolving <= 7);
      } else if (activeFilter === 'UP_ONLY') {
        matchFilter = !item.jenisDana || item.jenisDana === 'UP' || !!item.batasRevolvingKolomN;
      } else if (activeFilter === 'TUP_ONLY') {
        matchFilter = item.jenisDana === 'TUP' || !!item.batasWaktuTUPKolomH;
      } else if (activeFilter === 'KRITIS') {
        matchFilter = item.peringatanKritis === true || item.statusRevolving === 'Lambat / Kritis' || item.statusRevolving === 'Belum Revolving';
      }

      return matchSearch && matchFilter;
    });
  }, [scopedRecords, searchTerm, activeFilter]);

  // Aggregated Stats
  const stats = useMemo(() => {
    const totalSatker = scopedRecords.length;
    const totalPaguUP = scopedRecords.reduce((acc, curr) => acc + (curr.paguUP || 0), 0);
    const totalRealisasiGUP = scopedRecords.reduce((acc, curr) => acc + (curr.realisasiGUP || 0), 0);
    const avgRevolving = totalSatker > 0 ? (scopedRecords.reduce((acc, curr) => acc + (curr.persentaseRevolving || 0), 0) / totalSatker) : 0;
    
    // Count records with 1 week deadline
    const satuMingguCount = scopedRecords.filter(r => r.isJatuhTempo1Minggu || (r.sisaHariRevolving !== undefined && r.sisaHariRevolving >= 0 && r.sisaHariRevolving <= 7)).length;
    // Count records with weekend warning
    const weekendWarningCount = scopedRecords.filter(r => r.isJatuhTempoLibur).length;
    const kritisCount = scopedRecords.filter(r => r.statusRevolving === 'Lambat / Kritis' || r.statusRevolving === 'Belum Revolving' || r.peringatanKritis).length;
    const optimalCount = scopedRecords.filter(r => r.statusRevolving === 'Optimal' || r.statusRevolving === 'Sangat Baik' || r.statusRevolving === 'Lancar / Normal').length;

    return {
      totalSatker,
      totalPaguUP,
      totalRealisasiGUP,
      avgRevolving: avgRevolving.toFixed(1),
      satuMingguCount,
      weekendWarningCount,
      kritisCount,
      optimalCount
    };
  }, [scopedRecords]);

  const formatRupiah = (num?: number) => {
    if (!num) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-black uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5" />
              <span>{customTexts?.pengelolaanUpBadge || 'MODUL PENGELOLAAN UP / TUP & GUP'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {customTexts?.pengelolaanUpTitle || 'Pengelolaan & Batas Revolving UP / Karwas TUP'}
            </h1>
            <p className="text-sm text-slate-300">
              {customTexts?.pengelolaanUpSubtitle || 'Monitoring batas revolving Uang Persediaan (Kolom N) & Karwas TUP (Kolom H) dalam kurun waktu 1 minggu untuk mitigasi keterlambatan SPM.'}
            </p>
          </div>

          {userRole === 'ADMIN' && onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black px-5 py-3 rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all cursor-pointer text-sm shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Upload Data UP (Kolom N) / TUP (Kolom H)</span>
            </button>
          )}
        </div>
      </div>

      {/* MANDATORY WARNING BANNER: HARI LIBUR & JATUH TEMPO */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-0.5 rounded-3xl shadow-lg">
        <div className="bg-amber-50 dark:bg-slate-950 p-5 sm:p-6 rounded-[22px] flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shrink-0 shadow-md font-black">
            <BellRing className="w-7 h-7 animate-bounce" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide">
                PERINGATAN RESMI JATUH TEMPO REVOLVING
              </span>
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Seksi MSKI KPPN Semarang I
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-amber-950 dark:text-amber-200 uppercase tracking-tight">
              Tolong perhatikan hari libur apabila jatuh tempo harap diajukan HARI KERJA sebelum libur
            </h3>
            <p className="text-xs text-amber-900 dark:text-slate-300 leading-relaxed">
              Batas revolving UP tercantum pada <strong>Kolom N</strong> dan Karwas TUP pada <strong>Kolom H</strong>. Apabila tanggal batas revolving jatuh pada hari Sabtu, Minggu, atau Hari Libur Nasional, SPM GUP / Pertanggungjawaban TUP wajib diajukan ke KPPN pada <strong>HARI KERJA TERAKHIR SEBELUM LIBUR</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: 1 Minggu Jatuh Tempo */}
        <div className={`border rounded-2xl p-5 shadow-sm space-y-2 cursor-pointer transition-all ${
          activeFilter === '1_MINGGU'
            ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`} onClick={() => setActiveFilter('1_MINGGU')}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Jatuh Tempo Kurun 1 Minggu</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {stats.satuMingguCount} <span className="text-xs font-semibold text-slate-400">Satker</span>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">Tampil default di dashboard (Kolom N / H)</div>
        </div>

        {/* Card 2: Weekend/Holiday Warning */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Jatuh Tempo Hari Libur</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            {stats.weekendWarningCount} <span className="text-xs font-semibold text-slate-400">Satker</span>
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">Wajib diajukan HARI KERJA sebelumnya</div>
        </div>

        {/* Card 3: Total Satker UP/TUP */}
        <div className={`border rounded-2xl p-5 shadow-sm space-y-2 cursor-pointer transition-all ${
          activeFilter === 'ALL'
            ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/30'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`} onClick={() => setActiveFilter('ALL')}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Satker UP & TUP</span>
            <Building2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {stats.totalSatker} <span className="text-xs font-semibold text-slate-400">Satker</span>
          </div>
          <div className="text-[11px] text-slate-500">Seluruh satker yang mengelola UP/TUP</div>
        </div>

        {/* Card 4: Total Realisasi GUP */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Realisasi GUP</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 truncate" title={formatRupiah(stats.totalRealisasiGUP)}>
            {formatRupiah(stats.totalRealisasiGUP)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Rata-rata revolving: {stats.avgRevolving}%</span>
          </div>
        </div>
      </div>

      {/* Main Table & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode, nama satker, tanggal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveFilter('1_MINGGU')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === '1_MINGGU'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Kurun 1 Minggu ({stats.satuMingguCount})</span>
            </button>

            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Semua ({scopedRecords.length})
            </button>

            <button
              onClick={() => setActiveFilter('UP_ONLY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'UP_ONLY'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
              }`}
            >
              Pengelolaan UP (Kolom N)
            </button>

            <button
              onClick={() => setActiveFilter('TUP_ONLY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'TUP_ONLY'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900'
              }`}
            >
              Karwas TUP (Kolom H)
            </button>

            <button
              onClick={() => setActiveFilter('KRITIS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'KRITIS'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Kritis ({stats.kritisCount})</span>
            </button>
          </div>
        </div>

        {/* Informational Filter Tag */}
        {activeFilter === '1_MINGGU' && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Menampilkan satker yang memiliki batas revolving / jatuh tempo dalam <strong>kurun waktu 1 minggu (&le; 7 hari)</strong>.</span>
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
                ? 'Tidak ada satker dengan batas revolving dalam kurun waktu 1 minggu.'
                : 'Belum ada data Pengelolaan UP / Karwas TUP.'}
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
                'Silakan unggah file Excel Pengelolaan UP (Kolom N) atau Karwas TUP (Kolom H).'
              )}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase">
                  <th className="py-3 px-3">KODE &amp; SATKER</th>
                  <th className="py-3 px-3">JENIS</th>
                  <th className="py-3 px-3">BATAS REVOLVING / TUP</th>
                  <th className="py-3 px-3 text-right">NILAI UP / TUP</th>
                  <th className="py-3 px-3 text-right">REALISASI GUP</th>
                  <th className="py-3 px-3 text-right">SISA KAS</th>
                  <th className="py-3 px-3 text-center">% REVOLVING</th>
                  <th className="py-3 px-3 text-center">STATUS &amp; SARAN HARI KERJA</th>
                  <th className="py-3 px-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedRecords.map((item) => {
                  const isKritis = item.statusRevolving === 'Lambat / Kritis' || item.statusRevolving === 'Belum Revolving' || item.peringatanKritis;
                  const deadlineDate = item.batasRevolvingKolomN || item.batasWaktuTUPKolomH || item.tanggalTerakhirSP2D || '-';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        item.isJatuhTempoLibur ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-mono font-black text-slate-900 dark:text-slate-100">{item.kodeSatker}</div>
                        <div className="text-slate-800 dark:text-slate-200 font-semibold line-clamp-1">{item.namaSatker}</div>
                        <div className="text-[10px] text-slate-400">{item.kementerianLembaga || '-'}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          item.jenisDana === 'TUP' || item.batasWaktuTUPKolomH
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}>
                          {item.jenisDana || (item.batasWaktuTUPKolomH ? 'TUP' : 'UP')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" />
                          <span>{deadlineDate}</span>
                        </div>
                        {item.isJatuhTempo1Minggu && (
                          <span className="inline-block mt-0.5 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded">
                            ⏳ &le; 1 Minggu
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatRupiah(item.nilaiUP || item.paguUP)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(item.realisasiGUP)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-600 dark:text-slate-400">
                        {formatRupiah(item.sisaUP)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full font-black text-[11px] ${
                          item.persentaseRevolving >= 75
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.persentaseRevolving >= 50
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {item.persentaseRevolving}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            !isKritis
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}>
                            {!isKritis ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            <span>{item.statusRevolving}</span>
                          </span>

                          {/* Weekend & Holiday Notice */}
                          {item.isJatuhTempoLibur && (
                            <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                              ⚠️ Harap ajukan: <strong>{item.saranTglPengajuan || 'Hari kerja sebelumnya'}</strong>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedRecord(item)}
                          className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors cursor-pointer text-xs"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-full">
                  DETAIL PENGELOLAAN UP &amp; BATAS REVOLVING
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                  [{selectedRecord.kodeSatker}] {selectedRecord.namaSatker}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Peringatan Libur if applicable */}
              {selectedRecord.isJatuhTempoLibur && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-500 rounded-2xl text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>PERHATIAN HARI LIBUR / AKHIR PEKAN:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Tanggal jatuh tempo ({selectedRecord.batasRevolvingKolomN || selectedRecord.batasWaktuTUPKolomH}) jatuh pada akhir pekan/libur. Harap ajukan SPM pada hari kerja sebelum libur: <strong>{selectedRecord.saranTglPengajuan}</strong>.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 block">Batas Revolving (Kolom N / H):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {selectedRecord.batasRevolvingKolomN || selectedRecord.batasWaktuTUPKolomH || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Saran Tgl Pengajuan SPM:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedRecord.saranTglPengajuan || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Besaran Nilai UP / TUP:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formatRupiah(selectedRecord.nilaiUP || selectedRecord.paguUP)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Realisasi GUP:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(selectedRecord.realisasiGUP)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sisa Saldo Kas:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formatRupiah(selectedRecord.sisaUP)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Persentase Revolving:</span>
                  <span className="font-extrabold text-purple-600 dark:text-purple-400">{selectedRecord.persentaseRevolving}%</span>
                </div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-purple-600" />
                  <span>Rekomendasi Petugas KPPN Semarang I:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {selectedRecord.persentaseRevolving < 75
                    ? 'Satker belum mencapai revolving minimal (75%). Harap segera menyusun dan mengajukan SPM GUP ke KPPN Semarang I sebelum tanggal batas akhir.'
                    : 'Pengelolaan dana UP/TUP terpantau lancar dan telah memenuhi ketentuan regulasi perbendaharaan.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
