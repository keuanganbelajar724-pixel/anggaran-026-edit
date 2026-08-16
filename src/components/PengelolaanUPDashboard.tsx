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
  Info
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'KRITIS' | 'OPTIMAL' | 'SANGAT_BAIK'>('ALL');
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

  // Filtered by search & status
  const displayedRecords = useMemo(() => {
    return scopedRecords.filter(item => {
      const matchSearch =
        item.kodeSatker.includes(searchTerm) ||
        item.namaSatker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.kementerianLembaga && item.kementerianLembaga.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchStatus = true;
      if (statusFilter === 'KRITIS') {
        matchStatus = item.statusRevolving === 'Lambat / Kritis' || item.statusRevolving === 'Belum Revolving' || item.peringatanKritis === true;
      } else if (statusFilter === 'OPTIMAL') {
        matchStatus = item.statusRevolving === 'Optimal';
      } else if (statusFilter === 'SANGAT_BAIK') {
        matchStatus = item.statusRevolving === 'Sangat Baik';
      }

      return matchSearch && matchStatus;
    });
  }, [scopedRecords, searchTerm, statusFilter]);

  // Aggregated Stats
  const stats = useMemo(() => {
    const totalSatker = scopedRecords.length;
    const totalPaguUP = scopedRecords.reduce((acc, curr) => acc + (curr.paguUP || 0), 0);
    const totalRealisasiGUP = scopedRecords.reduce((acc, curr) => acc + (curr.realisasiGUP || 0), 0);
    const avgRevolving = totalSatker > 0 ? (scopedRecords.reduce((acc, curr) => acc + (curr.persentaseRevolving || 0), 0) / totalSatker) : 0;
    const kritisCount = scopedRecords.filter(r => r.statusRevolving === 'Lambat / Kritis' || r.statusRevolving === 'Belum Revolving').length;
    const optimalCount = scopedRecords.filter(r => r.statusRevolving === 'Optimal' || r.statusRevolving === 'Sangat Baik').length;

    return {
      totalSatker,
      totalPaguUP,
      totalRealisasiGUP,
      avgRevolving: avgRevolving.toFixed(1),
      kritisCount,
      optimalCount
    };
  }, [scopedRecords]);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-black uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5" />
              <span>{customTexts?.pengelolaanUpBadge || 'MODUL PENGELOLAAN UP / TUP'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {customTexts?.pengelolaanUpTitle || 'Monitoring & Evaluasi Pengelolaan Uang Persediaan'}
            </h1>
            <p className="text-sm text-slate-300">
              {customTexts?.pengelolaanUpSubtitle || 'Pemantauan revolving UP/TUP, saldo sisa kas bendahara, serta percepatan penyampaian SPM GUP Nihil/Isi sesuai regulasi KPPN Semarang I.'}
            </p>
          </div>

          {userRole === 'ADMIN' && onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black px-5 py-3 rounded-2xl shadow-lg hover:shadow-sky-500/25 transition-all cursor-pointer text-sm shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Upload Data UP / TUP</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Satker Dikelola</span>
            <Building2 className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {stats.totalSatker} <span className="text-xs font-semibold text-slate-400">Satker</span>
          </div>
          <div className="text-[11px] text-slate-500">Satker aktif pengelola dana UP di KPPN 026</div>
        </div>

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

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Revolving Optimal</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.optimalCount} <span className="text-xs font-semibold text-slate-400">Satker</span>
          </div>
          <div className="text-[11px] text-slate-500">Perputaran GUP lancar (&ge; 75%)</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Perhatian / Kritis</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            {stats.kritisCount} <span className="text-xs font-semibold text-slate-400">Satker</span>
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">Perlu percepatan pengajuan GUP</div>
        </div>
      </div>

      {/* Main Table & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode/nama satker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Semua ({scopedRecords.length})
            </button>
            <button
              onClick={() => setStatusFilter('KRITIS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'KRITIS'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Kritis ({stats.kritisCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('OPTIMAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'OPTIMAL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
              }`}
            >
              Optimal ({stats.optimalCount})
            </button>
          </div>
        </div>

        {/* Table Content */}
        {displayedRecords.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {userRole === 'PESERTA' ? 'Data Pengelolaan UP untuk Satker Anda belum tersedia.' : 'Belum ada data Pengelolaan UP.'}
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {userRole === 'ADMIN'
                ? 'Silakan unggah file Excel data Pengelolaan UP / TUP melalui tombol Upload di atas.'
                : 'Data akan muncul setelah Admin KPPN mengunggah laporan monitoring Pengelolaan UP.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3">KODE & SATKER</th>
                  <th className="py-3 px-3">K/L</th>
                  <th className="py-3 px-3 text-right">BESARAN UP</th>
                  <th className="py-3 px-3 text-right">REALISASI GUP</th>
                  <th className="py-3 px-3 text-right">SISA SALDO UP</th>
                  <th className="py-3 px-3 text-center">% REVOLVING</th>
                  <th className="py-3 px-3 text-center">STATUS</th>
                  <th className="py-3 px-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedRecords.map((item) => {
                  const isKritis = item.statusRevolving === 'Lambat / Kritis' || item.statusRevolving === 'Belum Revolving';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-black text-slate-900 dark:text-slate-100">{item.kodeSatker}</div>
                        <div className="text-slate-700 dark:text-slate-300 font-semibold line-clamp-1">{item.namaSatker}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                        {item.kementerianLembaga || '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatRupiah(item.nilaiUP)}
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
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          !isKritis
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}>
                          {!isKritis ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          <span>{item.statusRevolving}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedRecord(item)}
                          className="px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold hover:bg-sky-200 dark:hover:bg-sky-900 transition-colors cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-full">
                  DETAIL PENGELOLAAN UP SATKER
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                  [{selectedRecord.kodeSatker}] {selectedRecord.namaSatker}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 block">Besaran Pagu UP:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formatRupiah(selectedRecord.paguUP)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Nilai UP Dikelola:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formatRupiah(selectedRecord.nilaiUP)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Realisasi GUP:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(selectedRecord.realisasiGUP)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sisa Saldo Kas UP:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formatRupiah(selectedRecord.sisaUP)}</span>
                </div>
              </div>

              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-600" />
                  <span>Rekomendasi & Analisis Tindak Lanjut:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {selectedRecord.persentaseRevolving < 75
                    ? 'Satker belum mencapai target perputaran UP minimal (75%). Mohon segera mengajukan SPM GUP untuk kuitansi yang telah terbayar agar tidak terkena pemotongan besaran UP oleh KPPN.'
                    : 'Perputaran uang persediaan satker sudah sangat optimal dan memenuhi standar kinerja KPPN 026.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
