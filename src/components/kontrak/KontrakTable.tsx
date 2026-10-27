import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X
} from 'lucide-react';
import { KontrakFilterState, KontrakMonitoringRecord } from '../../types';
import {
  filterKontrakRecords,
  formatNumber,
  formatRupiah
} from '../../utils/kontrakCalculations';
import {
  exportKontrakBelumSelesaiPDF,
  exportKontrakTerlambatPDF,
  exportKontrakToExcel,
  exportKontrakToPDF,
  exportNrkPerluPenyesuaianPDF,
  exportSisaKontrakTerbesarPDF
} from '../../utils/kontrakExport';
import { KontrakDetailModal } from './KontrakDetailModal';

interface KontrakTableProps {
  records: KontrakMonitoringRecord[];
  isDark?: boolean;
  userRole?: string;
  userSatkerCode?: string;
  activeKpiFilter?: string;
  onClearKpiFilter?: () => void;
  kpiFilterLabel?: string;
}

export const KontrakTable: React.FC<KontrakTableProps> = ({
  records,
  isDark = false,
  userRole = 'admin',
  userSatkerCode,
  activeKpiFilter,
  onClearKpiFilter,
  kpiFilterLabel
}) => {
  // 15 Filters State
  const initialFilter: KontrakFilterState = {
    searchQuery: '',
    tahun: 'ALL',
    triwulan: 'ALL',
    bulan: 'ALL',
    kodeSatker: userRole === 'satker' && userSatkerCode ? userSatkerCode : 'ALL',
    namaSatker: 'ALL',
    nomorKontrak: '',
    supplier: 'ALL',
    statusNrk: 'ALL',
    statusProgress: 'ALL',
    statusKirimKppn: 'ALL',
    kodeCoa: 'ALL',
    kodeMataUang: 'ALL',
    tanggalKontrakStart: '',
    tanggalKontrakEnd: '',
    tanggalMulaiStart: '',
    tanggalMulaiEnd: '',
    tanggalSelesaiStart: '',
    tanggalSelesaiEnd: '',
    kategoriProgress: 'ALL'
  };

  const [filter, setFilter] = useState<KontrakFilterState>(initialFilter);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Sorting: Default Tanggal Selesai ASC (closest first)
  const [sortField, setSortField] = useState<keyof KontrakMonitoringRecord>('tanggal_selesai');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination: Default 25
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Detail Modal
  const [selectedRecord, setSelectedRecord] = useState<KontrakMonitoringRecord | null>(null);

  // Extract unique options for dropdowns
  const { years, satkers, suppliers, progressStatuses, nrkStatuses, kirimStatuses, coas, mataUangs } =
    useMemo(() => {
      const yearSet = new Set<string>();
      const satkerMap = new Map<string, string>();
      const suppSet = new Set<string>();
      const progSet = new Set<string>();
      const nrkSet = new Set<string>();
      const kirimSet = new Set<string>();
      const coaSet = new Set<string>();
      const curSet = new Set<string>();

      records.forEach(r => {
        if (r.tanggal_kontrak) {
          const y = r.tanggal_kontrak.slice(0, 4);
          if (y) yearSet.add(y);
        }
        if (r.kode_satker) satkerMap.set(r.kode_satker, r.deskripsi_satker);
        if (r.nama_supplier) suppSet.add(r.nama_supplier);
        if (r.status_progress_kontrak) progSet.add(r.status_progress_kontrak);
        if (r.status_nrk) nrkSet.add(r.status_nrk);
        if (r.status_kirim_kppn) kirimSet.add(r.status_kirim_kppn);
        if (r.kode_coa) coaSet.add(r.kode_coa);
        if (r.kode_mata_uang) curSet.add(r.kode_mata_uang);
      });

      return {
        years: Array.from(yearSet).sort(),
        satkers: Array.from(satkerMap.entries()).map(([kode, nama]) => ({ kode, nama })),
        suppliers: Array.from(suppSet).sort(),
        progressStatuses: Array.from(progSet).sort(),
        nrkStatuses: Array.from(nrkSet).sort(),
        kirimStatuses: Array.from(kirimSet).sort(),
        coas: Array.from(coaSet).sort(),
        mataUangs: Array.from(curSet).sort()
      };
    }, [records]);

  // Dynamic counts for quick category tabs
  const categoryCounts = useMemo(() => {
    let selesai = 0;
    let belumSelesai = 0;
    let terlambat = 0;
    let nrkPerluPenyesuaian = 0;

    records.forEach(r => {
      const st = r.status_progress_kontrak;
      if (st === 'SELESAI TEPAT WAKTU' || st === 'SELESAI TERLAMBAT') {
        selesai++;
      }
      if (
        st === 'BELUM SELESAI' ||
        st === 'BELUM SELESAI TERLAMBAT TERMIN' ||
        st === 'BELUM SELESAI TERLAMBAT'
      ) {
        belumSelesai++;
      }
      if (
        st === 'BELUM SELESAI TERLAMBAT TERMIN' ||
        st === 'BELUM SELESAI TERLAMBAT' ||
        st === 'SELESAI TERLAMBAT'
      ) {
        terlambat++;
      }
      if (r.status_nrk === 'SESUAIKAN DENGAN NRK SPAN') {
        nrkPerluPenyesuaian++;
      }
    });

    return {
      all: records.length,
      selesai,
      belumSelesai,
      terlambat,
      nrkPerluPenyesuaian
    };
  }, [records]);

  // Count active advanced filters
  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (filter.tahun !== 'ALL') count++;
    if (filter.triwulan !== 'ALL') count++;
    if (filter.bulan !== 'ALL') count++;
    if (filter.kodeSatker !== 'ALL' && !(userRole === 'satker' && userSatkerCode)) count++;
    if (filter.namaSatker !== 'ALL') count++;
    if (filter.nomorKontrak.trim()) count++;
    if (filter.supplier !== 'ALL') count++;
    if (filter.statusNrk !== 'ALL') count++;
    if (filter.statusProgress !== 'ALL') count++;
    if (filter.statusKirimKppn !== 'ALL') count++;
    if (filter.kodeCoa !== 'ALL') count++;
    if (filter.kodeMataUang !== 'ALL') count++;
    if (filter.tanggalKontrakStart || filter.tanggalKontrakEnd) count++;
    if (filter.tanggalMulaiStart || filter.tanggalMulaiEnd) count++;
    if (filter.tanggalSelesaiStart || filter.tanggalSelesaiEnd) count++;
    return count;
  }, [filter, userRole, userSatkerCode]);

  // List of active filter chips for easy 1-click removal
  const activeFilterChips = useMemo(() => {
    const list: Array<{ id: string; label: string; value: string; onRemove: () => void }> = [];

    const bulanMap: Record<string, string> = {
      '01': 'Januari',
      '02': 'Februari',
      '03': 'Maret',
      '04': 'April',
      '05': 'Mei',
      '06': 'Juni',
      '07': 'Juli',
      '08': 'Agustus',
      '09': 'September',
      '10': 'Oktober',
      '11': 'November',
      '12': 'Desember'
    };

    if (filter.searchQuery.trim()) {
      list.push({
        id: 'search',
        label: 'Cari',
        value: `"${filter.searchQuery.trim()}"`,
        onRemove: () => setFilter(prev => ({ ...prev, searchQuery: '' }))
      });
    }

    if (filter.kategoriProgress && filter.kategoriProgress !== 'ALL') {
      const catNames: Record<string, string> = {
        SELESAI: 'Selesai',
        BELUM_SELESAI: 'Belum Selesai',
        TERLAMBAT: 'Terlambat',
        NRK_PERLU_PENYESUAIAN: 'NRK Perlu Penyesuaian'
      };
      list.push({
        id: 'kategori',
        label: 'Kategori',
        value: catNames[filter.kategoriProgress] || filter.kategoriProgress,
        onRemove: () => setFilter(prev => ({ ...prev, kategoriProgress: 'ALL' }))
      });
    }

    if (filter.tahun !== 'ALL') {
      list.push({
        id: 'tahun',
        label: 'Tahun',
        value: filter.tahun,
        onRemove: () => setFilter(prev => ({ ...prev, tahun: 'ALL' }))
      });
    }

    if (filter.triwulan !== 'ALL') {
      list.push({
        id: 'triwulan',
        label: 'Triwulan',
        value: filter.triwulan,
        onRemove: () => setFilter(prev => ({ ...prev, triwulan: 'ALL' }))
      });
    }

    if (filter.bulan !== 'ALL') {
      list.push({
        id: 'bulan',
        label: 'Bulan',
        value: bulanMap[filter.bulan] || filter.bulan,
        onRemove: () => setFilter(prev => ({ ...prev, bulan: 'ALL' }))
      });
    }

    if (filter.kodeSatker !== 'ALL' && !(userRole === 'satker' && userSatkerCode)) {
      list.push({
        id: 'kodeSatker',
        label: 'Satker',
        value: filter.kodeSatker,
        onRemove: () => setFilter(prev => ({ ...prev, kodeSatker: 'ALL' }))
      });
    }

    if (filter.supplier !== 'ALL') {
      list.push({
        id: 'supplier',
        label: 'Supplier',
        value: filter.supplier.length > 20 ? filter.supplier.slice(0, 20) + '...' : filter.supplier,
        onRemove: () => setFilter(prev => ({ ...prev, supplier: 'ALL' }))
      });
    }

    if (filter.nomorKontrak.trim()) {
      list.push({
        id: 'nomorKontrak',
        label: 'No. Kontrak',
        value: filter.nomorKontrak.trim(),
        onRemove: () => setFilter(prev => ({ ...prev, nomorKontrak: '' }))
      });
    }

    if (filter.statusProgress !== 'ALL') {
      list.push({
        id: 'statusProgress',
        label: 'Progress',
        value: filter.statusProgress,
        onRemove: () => setFilter(prev => ({ ...prev, statusProgress: 'ALL' }))
      });
    }

    if (filter.statusNrk !== 'ALL') {
      list.push({
        id: 'statusNrk',
        label: 'NRK',
        value: filter.statusNrk,
        onRemove: () => setFilter(prev => ({ ...prev, statusNrk: 'ALL' }))
      });
    }

    if (filter.statusKirimKppn !== 'ALL') {
      list.push({
        id: 'statusKirimKppn',
        label: 'Kirim KPPN',
        value: filter.statusKirimKppn,
        onRemove: () => setFilter(prev => ({ ...prev, statusKirimKppn: 'ALL' }))
      });
    }

    if (filter.kodeCoa !== 'ALL') {
      list.push({
        id: 'kodeCoa',
        label: 'COA',
        value: filter.kodeCoa,
        onRemove: () => setFilter(prev => ({ ...prev, kodeCoa: 'ALL' }))
      });
    }

    if (filter.kodeMataUang !== 'ALL') {
      list.push({
        id: 'kodeMataUang',
        label: 'Mata Uang',
        value: filter.kodeMataUang,
        onRemove: () => setFilter(prev => ({ ...prev, kodeMataUang: 'ALL' }))
      });
    }

    if (filter.tanggalKontrakStart || filter.tanggalKontrakEnd) {
      list.push({
        id: 'tglKontrak',
        label: 'Tgl Kontrak',
        value: `${filter.tanggalKontrakStart || 'Awal'} s.d. ${filter.tanggalKontrakEnd || 'Akhir'}`,
        onRemove: () => setFilter(prev => ({ ...prev, tanggalKontrakStart: '', tanggalKontrakEnd: '' }))
      });
    }

    if (filter.tanggalSelesaiStart || filter.tanggalSelesaiEnd) {
      list.push({
        id: 'tglSelesai',
        label: 'Tgl Selesai',
        value: `${filter.tanggalSelesaiStart || 'Awal'} s.d. ${filter.tanggalSelesaiEnd || 'Akhir'}`,
        onRemove: () => setFilter(prev => ({ ...prev, tanggalSelesaiStart: '', tanggalSelesaiEnd: '' }))
      });
    }

    if (filter.tanggalMulaiStart || filter.tanggalMulaiEnd) {
      list.push({
        id: 'tglMulai',
        label: 'Tgl Mulai',
        value: `${filter.tanggalMulaiStart || 'Awal'} s.d. ${filter.tanggalMulaiEnd || 'Akhir'}`,
        onRemove: () => setFilter(prev => ({ ...prev, tanggalMulaiStart: '', tanggalMulaiEnd: '' }))
      });
    }

    return list;
  }, [filter, userRole, userSatkerCode]);

  // Apply filters
  const filteredRecords = useMemo(() => {
    return filterKontrakRecords(records, filter);
  }, [records, filter]);

  // Apply sorting
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let result = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        result = valA - valB;
      } else {
        result = String(valA).localeCompare(String(valB));
      }

      return sortOrder === 'asc' ? result : -result;
    });
  }, [filteredRecords, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  // Totals for filtered records
  const totals = useMemo(() => {
    let nilaiKontrak = 0;
    let nilaiPembayaran = 0;
    let sisaKontrak = 0;
    filteredRecords.forEach(r => {
      nilaiKontrak += r.nilai_kontrak;
      nilaiPembayaran += r.nilai_pembayaran;
      sisaKontrak += r.sisa_kontrak;
    });
    return { nilaiKontrak, nilaiPembayaran, sisaKontrak };
  }, [filteredRecords]);

  const handleSort = (field: keyof KontrakMonitoringRecord) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleResetFilter = () => {
    setFilter(initialFilter);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (cat: KontrakFilterState['kategoriProgress']) => {
    setFilter(prev => ({
      ...prev,
      kategoriProgress: prev.kategoriProgress === cat ? 'ALL' : cat
    }));
    setCurrentPage(1);
  };

  return (
    <div id="kontrak-table-section" className="space-y-4">
      {/* FILTER & TOOLBAR CARD */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {activeKpiFilter && activeKpiFilter !== 'ALL' && (
          <div className="mb-3.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-emerald-800 dark:text-emerald-200">
                🔍 Filter Kotak Aktif:
              </span>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-600 text-white shadow-2xs">
                {kpiFilterLabel || activeKpiFilter}
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                ({records.length} kontrak ditemukan)
              </span>
            </div>
            {onClearKpiFilter && (
              <button
                type="button"
                onClick={onClearKpiFilter}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-2xs transition-all cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5 text-rose-500" />
                <span>Reset Filter Kotak</span>
              </button>
            )}
          </div>
        )}
        {/* Quick Category Buttons, Search & Filter Controls */}
        <div className="space-y-3.5">
          {/* Quick Category Tabs Row */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleCategoryFilter('ALL')}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                filter.kategoriProgress === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm ring-2 ring-slate-900/10 dark:ring-white/20 scale-[1.02]'
                  : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Kontrak</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  filter.kategoriProgress === 'ALL'
                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {formatNumber(categoryCounts.all)}
              </span>
            </button>

            <button
              onClick={() => handleCategoryFilter('SELESAI')}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                filter.kategoriProgress === 'SELESAI'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30 scale-[1.02]'
                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span>Selesai</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  filter.kategoriProgress === 'SELESAI'
                    ? 'bg-white/25 text-white'
                    : 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200'
                }`}
              >
                {formatNumber(categoryCounts.selesai)}
              </span>
            </button>

            <button
              onClick={() => handleCategoryFilter('BELUM_SELESAI')}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                filter.kategoriProgress === 'BELUM_SELESAI'
                  ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/30 scale-[1.02]'
                  : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>Belum Selesai</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  filter.kategoriProgress === 'BELUM_SELESAI'
                    ? 'bg-white/25 text-white'
                    : 'bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200'
                }`}
              >
                {formatNumber(categoryCounts.belumSelesai)}
              </span>
            </button>

            <button
              onClick={() => handleCategoryFilter('TERLAMBAT')}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                filter.kategoriProgress === 'TERLAMBAT'
                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/30 scale-[1.02]'
                  : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
              <span>Terlambat</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  filter.kategoriProgress === 'TERLAMBAT'
                    ? 'bg-white/25 text-white'
                    : 'bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200'
                }`}
              >
                {formatNumber(categoryCounts.terlambat)}
              </span>
            </button>

            <button
              onClick={() => handleCategoryFilter('NRK_PERLU_PENYESUAIAN')}
              className={`group flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                filter.kategoriProgress === 'NRK_PERLU_PENYESUAIAN'
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30 scale-[1.02]'
                  : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
              <span>NRK Perlu Penyesuaian</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  filter.kategoriProgress === 'NRK_PERLU_PENYESUAIAN'
                    ? 'bg-white/25 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200'
                }`}
              >
                {formatNumber(categoryCounts.nrkPerluPenyesuaian)}
              </span>
            </button>
          </div>

          {/* Search Bar & Advanced Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Global Search Input */}
            <div className="relative flex-1 group">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Cari nomor kontrak, kode/nama satker, supplier, uraian, NRK, COA..."
                value={filter.searchQuery}
                onChange={e => {
                  setFilter(prev => ({ ...prev, searchQuery: e.target.value }));
                  setCurrentPage(1);
                }}
                className={`w-full pl-10 pr-24 py-2.5 rounded-2xl text-xs font-medium border transition-all outline-none shadow-2xs ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {filter.searchQuery && (
                  <button
                    onClick={() => setFilter(prev => ({ ...prev, searchQuery: '' }))}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {formatNumber(filteredRecords.length)}
                </span>
              </div>
            </div>

            {/* Filter Toggle & Reset Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border shadow-2xs ${
                  showAdvancedFilters
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20 shadow-sm'
                    : activeAdvancedFilterCount > 0
                    ? 'bg-amber-500 text-white border-amber-500 shadow-amber-500/20 shadow-sm'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showAdvancedFilters ? 'Tutup Filter' : 'Filter Lanjutan'}</span>
                {activeAdvancedFilterCount > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                      showAdvancedFilters || activeAdvancedFilterCount > 0
                        ? 'bg-white/25 text-white'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {activeAdvancedFilterCount} Aktif
                  </span>
                )}
                {showAdvancedFilters ? (
                  <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                )}
              </button>

              <button
                onClick={handleResetFilter}
                title="Reset Semua Filter & Pencarian"
                className="group px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500 text-slate-500" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Active Filter Chips Strip */}
          {activeFilterChips.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs animate-in fade-in">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-emerald-500" />
                Filter Aktif:
              </span>
              {activeFilterChips.map(chip => (
                <span
                  key={chip.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/80 shadow-2xs"
                >
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{chip.label}:</span>
                  <span className="font-extrabold max-w-[150px] truncate">{chip.value}</span>
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    className="ml-1 p-0.5 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800/80 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                    title={`Hapus filter ${chip.label}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline px-2 py-0.5 cursor-pointer ml-1"
              >
                Hapus Semua
              </button>
            </div>
          )}
        </div>

        {/* 10 COMPREHENSIVE FILTERS PANEL - MODERN, ENGAGING & BEAUTIFUL */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
            {/* Header of 10 Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                      Panel Filter Terpadu (10 Kriteria Kontrak SPAN / SAKTI)
                    </h4>
                    {activeAdvancedFilterCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {activeAdvancedFilterCount} Kriteria Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Saring data kontrak secara instan berdasarkan parameter waktu, satuan kerja, rekanan, status, hingga akun COA.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {activeAdvancedFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reset Semua</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Tutup</span>
                </button>
              </div>
            </div>

            {/* 10 FILTERS GRID */}
            <div className="space-y-3">
              {/* ROW 1: 4 Dropdowns (Tahun, Triwulan, Bulan, Kode Satker) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. Tahun Kontrak */}
                <div
                  className={`p-3 rounded-2xl border transition-all duration-200 ${
                    filter.tahun !== 'ALL'
                      ? 'bg-gradient-to-br from-blue-50/90 via-white to-sky-50/60 border-blue-400 dark:from-blue-950/40 dark:via-slate-800 dark:to-blue-950/20 dark:border-blue-500 shadow-xs ring-2 ring-blue-500/10'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-4.5 h-4.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-[10px]">
                        1
                      </span>
                      <span>Tahun Kontrak</span>
                    </label>
                    {filter.tahun !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilter(prev => ({ ...prev, tahun: 'ALL' }));
                          setCurrentPage(1);
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-0.5"
                        title="Reset Tahun"
                      >
                        <X className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={filter.tahun}
                    onChange={e => {
                      setFilter(prev => ({ ...prev, tahun: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all cursor-pointer ${
                      filter.tahun !== 'ALL'
                        ? 'bg-white dark:bg-slate-900 border-blue-400 dark:border-blue-500 text-blue-950 dark:text-blue-100 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                  >
                    <option value="ALL">Semua Tahun</option>
                    {years.map(y => (
                      <option key={y} value={y}>
                        Tahun {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Triwulan (Tanggal Kontrak) */}
                <div
                  className={`p-3 rounded-2xl border transition-all duration-200 ${
                    filter.triwulan !== 'ALL'
                      ? 'bg-gradient-to-br from-blue-50/90 via-white to-sky-50/60 border-blue-400 dark:from-blue-950/40 dark:via-slate-800 dark:to-blue-950/20 dark:border-blue-500 shadow-xs ring-2 ring-blue-500/10'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-4.5 h-4.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-[10px]">
                        2
                      </span>
                      <span>Triwulan (Tanggal Kontrak)</span>
                    </label>
                    {filter.triwulan !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilter(prev => ({ ...prev, triwulan: 'ALL' }));
                          setCurrentPage(1);
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-0.5"
                        title="Reset Triwulan"
                      >
                        <X className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={filter.triwulan}
                    onChange={e => {
                      setFilter(prev => ({ ...prev, triwulan: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all cursor-pointer ${
                      filter.triwulan !== 'ALL'
                        ? 'bg-white dark:bg-slate-900 border-blue-400 dark:border-blue-500 text-blue-950 dark:text-blue-100 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                  >
                    <option value="ALL">Semua Triwulan</option>
                    <option value="Tw I">Tw I (Jan - Mar)</option>
                    <option value="Tw II">Tw II (Apr - Jun)</option>
                    <option value="Tw III">Tw III (Jul - Sep)</option>
                    <option value="Tw IV">Tw IV (Okt - Des)</option>
                  </select>
                </div>

                {/* 3. Bulan Kontrak */}
                <div
                  className={`p-3 rounded-2xl border transition-all duration-200 ${
                    filter.bulan !== 'ALL'
                      ? 'bg-gradient-to-br from-blue-50/90 via-white to-sky-50/60 border-blue-400 dark:from-blue-950/40 dark:via-slate-800 dark:to-blue-950/20 dark:border-blue-500 shadow-xs ring-2 ring-blue-500/10'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-4.5 h-4.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-[10px]">
                        3
                      </span>
                      <span>Bulan Kontrak</span>
                    </label>
                    {filter.bulan !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilter(prev => ({ ...prev, bulan: 'ALL' }));
                          setCurrentPage(1);
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-0.5"
                        title="Reset Bulan"
                      >
                        <X className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={filter.bulan}
                    onChange={e => {
                      setFilter(prev => ({ ...prev, bulan: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all cursor-pointer ${
                      filter.bulan !== 'ALL'
                        ? 'bg-white dark:bg-slate-900 border-blue-400 dark:border-blue-500 text-blue-950 dark:text-blue-100 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                  >
                    <option value="ALL">Semua Bulan</option>
                    {[
                      ['01', 'Januari'],
                      ['02', 'Februari'],
                      ['03', 'Maret'],
                      ['04', 'April'],
                      ['05', 'Mei'],
                      ['06', 'Juni'],
                      ['07', 'Juli'],
                      ['08', 'Agustus'],
                      ['09', 'September'],
                      ['10', 'Oktober'],
                      ['11', 'November'],
                      ['12', 'Desember']
                    ].map(([num, name]) => (
                      <option key={num} value={num}>
                        {num} - {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Kode Satker */}
                <div
                  className={`p-3 rounded-2xl border transition-all duration-200 ${
                    filter.kodeSatker !== 'ALL'
                      ? 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 border-emerald-400 dark:from-emerald-950/40 dark:via-slate-800 dark:to-emerald-950/20 dark:border-emerald-500 shadow-xs ring-2 ring-emerald-500/10'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-4.5 h-4.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center justify-center text-[10px]">
                        4
                      </span>
                      <span>Kode Satker</span>
                    </label>
                    {userRole === 'satker' ? (
                      <span className="text-[10px] font-bold text-slate-400">Akun Satker</span>
                    ) : filter.kodeSatker !== 'ALL' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setFilter(prev => ({ ...prev, kodeSatker: 'ALL' }));
                          setCurrentPage(1);
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-0.5"
                        title="Reset Satker"
                      >
                        <X className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    ) : null}
                  </div>
                  <select
                    disabled={userRole === 'satker'}
                    value={filter.kodeSatker}
                    onChange={e => {
                      setFilter(prev => ({ ...prev, kodeSatker: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                      filter.kodeSatker !== 'ALL'
                        ? 'bg-white dark:bg-slate-900 border-emerald-400 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  >
                    <option value="ALL">Semua Satker ({satkers.length})</option>
                    {satkers.map(s => (
                      <option key={s.kode} value={s.kode}>
                        {s.kode} - {s.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ROW 2: 4 Dropdowns (Status Progress, Status NRK, Nama Supplier, Kode Akun / COA) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 5. Status Progress Kontrak */}
                <div
                  className={`p-3 rounded-2xl border transition-all duration-200 ${
                    filter.statusProgress !== 'ALL'
                      ? 'bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60 border-amber-400 dark:from-amber-950/40 dark:via-slate-800 dark:to-amber-950/20 dark:border-amber-500 shadow-xs ring-2 ring-amber-500/10'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-4.5 h-4.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-extrabold flex items-center justify-center text-[10px]">
                        5
                      </span>
                      <span>Status Progress Kontrak</span>
                    </label>
                    {filter.statusProgress !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilter(prev => ({ ...prev, statusProgress: 'ALL' }));
                          setCurrentPage(1);
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-0.5"
                        title="Reset Status Progress"
                      >
                        <X className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={filter.statusProgress}
                    onChange={e => {
                      setFilter(prev => ({ ...prev, statusProgress: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all cursor-pointer ${
                      filter.statusProgress !== 'ALL'
                        ? 'bg-white dark:bg-slate-900 border-amber-400 dark:border-amber-500 text-amber-950 dark:text-amber-100 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    }`}
                  >
                    <option value="ALL">Semua Status Progress</option>
                    {progressStatuses.map(st => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Status NRK */}
                <div
                  className={`p-3 rounded-2xl border transition-all duration-200 ${
                    filter.statusNrk !== 'ALL'
                      ? 'bg-gradient-to-br from-purple-50/90 via-white to-violet-50/60 border-purple-400 dark:from-purple-950/40 dark:via-slate-800 dark:to-purple-950/20 dark:border-purple-500 shadow-xs ring-2 ring-purple-500/10'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-4.5 h-4.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-extrabold flex items-center justify-center text-[10px]">
                        6
                      </span>
                      <span>Status NRK</span>
                    </label>
                    {filter.statusNrk !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilter(prev => ({ ...prev, statusNrk: 'ALL' }));
                          setCurrentPage(1);
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-0.5"
                        title="Reset Status NRK"
                      >
                        <X className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={filter.statusNrk}
                    onChange={e => {
                      setFilter(prev => ({ ...prev, statusNrk: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all cursor-pointer ${
                      filter.statusNrk !== 'ALL'
                        ? 'bg-white dark:bg-slate-900 border-purple-400 dark:border-purple-500 text-purple-950 dark:text-purple-100 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                    }`}
                  >
                    <option value="ALL">Semua Status NRK</option>
                    {nrkStatuses.map(st => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. Nama Supplier */}
                <div
                  className={`p-3 rounded-2xl border transition-all duration-200 ${
                    filter.supplier !== 'ALL'
                      ? 'bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/60 border-teal-400 dark:from-teal-950/40 dark:via-slate-800 dark:to-teal-950/20 dark:border-teal-500 shadow-xs ring-2 ring-teal-500/10'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-4.5 h-4.5 rounded-md bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-extrabold flex items-center justify-center text-[10px]">
                        7
                      </span>
                      <span>Nama Supplier</span>
                    </label>
                    {filter.supplier !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilter(prev => ({ ...prev, supplier: 'ALL' }));
                          setCurrentPage(1);
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-0.5"
                        title="Reset Supplier"
                      >
                        <X className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={filter.supplier}
                    onChange={e => {
                      setFilter(prev => ({ ...prev, supplier: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all cursor-pointer ${
                      filter.supplier !== 'ALL'
                        ? 'bg-white dark:bg-slate-900 border-teal-400 dark:border-teal-500 text-teal-950 dark:text-teal-100 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                    }`}
                  >
                    <option value="ALL">Semua Supplier ({suppliers.length})</option>
                    {suppliers.map(sp => (
                      <option key={sp} value={sp}>
                        {sp}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 8. Kode Akun / COA */}
                <div
                  className={`p-3 rounded-2xl border transition-all duration-200 ${
                    filter.kodeCoa !== 'ALL'
                      ? 'bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/60 border-indigo-400 dark:from-indigo-950/40 dark:via-slate-800 dark:to-indigo-950/20 dark:border-indigo-500 shadow-xs ring-2 ring-indigo-500/10'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-4.5 h-4.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold flex items-center justify-center text-[10px]">
                        8
                      </span>
                      <span>Kode Akun / COA</span>
                    </label>
                    {filter.kodeCoa !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilter(prev => ({ ...prev, kodeCoa: 'ALL' }));
                          setCurrentPage(1);
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-0.5"
                        title="Reset COA"
                      >
                        <X className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={filter.kodeCoa}
                    onChange={e => {
                      setFilter(prev => ({ ...prev, kodeCoa: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all cursor-pointer ${
                      filter.kodeCoa !== 'ALL'
                        ? 'bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-500 text-indigo-950 dark:text-indigo-100 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                    }`}
                  >
                    <option value="ALL">Semua COA ({coas.length})</option>
                    {coas.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ROW 3: 2 Wide Date Ranges (Tanggal Kontrak & Tanggal Selesai) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                {/* 9. Tanggal Kontrak (Rentang) */}
                <div
                  className={`p-3 rounded-2xl border transition-all duration-200 ${
                    filter.tanggalKontrakStart || filter.tanggalKontrakEnd
                      ? 'bg-gradient-to-br from-blue-50/90 via-white to-sky-50/60 border-blue-400 dark:from-blue-950/40 dark:via-slate-800 dark:to-blue-950/20 dark:border-blue-500 shadow-xs ring-2 ring-blue-500/10'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-4.5 h-4.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-[10px]">
                        9
                      </span>
                      <span>Tanggal Kontrak (Rentang)</span>
                    </label>
                    {(filter.tanggalKontrakStart || filter.tanggalKontrakEnd) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilter(prev => ({ ...prev, tanggalKontrakStart: '', tanggalKontrakEnd: '' }));
                          setCurrentPage(1);
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-0.5"
                        title="Reset Rentang Tanggal Kontrak"
                      >
                        <X className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="date"
                        value={filter.tanggalKontrakStart}
                        onChange={e => {
                          setFilter(prev => ({ ...prev, tanggalKontrakStart: e.target.value }));
                          setCurrentPage(1);
                        }}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all ${
                          filter.tanggalKontrakStart
                            ? 'bg-white dark:bg-slate-900 border-blue-400 text-blue-900 dark:text-blue-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      />
                    </div>
                    <span className="text-slate-400 font-extrabold text-[11px]">s.d.</span>
                    <div className="flex-1 relative">
                      <input
                        type="date"
                        value={filter.tanggalKontrakEnd}
                        onChange={e => {
                          setFilter(prev => ({ ...prev, tanggalKontrakEnd: e.target.value }));
                          setCurrentPage(1);
                        }}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all ${
                          filter.tanggalKontrakEnd
                            ? 'bg-white dark:bg-slate-900 border-blue-400 text-blue-900 dark:text-blue-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 10. Tanggal Selesai (Rentang) */}
                <div
                  className={`p-3 rounded-2xl border transition-all duration-200 ${
                    filter.tanggalSelesaiStart || filter.tanggalSelesaiEnd
                      ? 'bg-gradient-to-br from-rose-50/90 via-white to-amber-50/60 border-rose-400 dark:from-rose-950/40 dark:via-slate-800 dark:to-rose-950/20 dark:border-rose-500 shadow-xs ring-2 ring-rose-500/10'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-4.5 h-4.5 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-extrabold flex items-center justify-center text-[10px]">
                        10
                      </span>
                      <span>Tanggal Selesai (Rentang)</span>
                    </label>
                    {(filter.tanggalSelesaiStart || filter.tanggalSelesaiEnd) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilter(prev => ({ ...prev, tanggalSelesaiStart: '', tanggalSelesaiEnd: '' }));
                          setCurrentPage(1);
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-0.5"
                        title="Reset Rentang Tanggal Selesai"
                      >
                        <X className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="date"
                        value={filter.tanggalSelesaiStart}
                        onChange={e => {
                          setFilter(prev => ({ ...prev, tanggalSelesaiStart: e.target.value }));
                          setCurrentPage(1);
                        }}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all ${
                          filter.tanggalSelesaiStart
                            ? 'bg-white dark:bg-slate-900 border-rose-400 text-rose-900 dark:text-rose-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      />
                    </div>
                    <span className="text-slate-400 font-extrabold text-[11px]">s.d.</span>
                    <div className="flex-1 relative">
                      <input
                        type="date"
                        value={filter.tanggalSelesaiEnd}
                        onChange={e => {
                          setFilter(prev => ({ ...prev, tanggalSelesaiEnd: e.target.value }));
                          setCurrentPage(1);
                        }}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all ${
                          filter.tanggalSelesaiEnd
                            ? 'bg-white dark:bg-slate-900 border-rose-400 text-rose-900 dark:text-rose-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Panel Footer Status Bar */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  Menyaring <strong className="text-emerald-700 dark:text-emerald-400 font-black">{formatNumber(filteredRecords.length)}</strong> dari{' '}
                  <strong className="text-slate-900 dark:text-white">{formatNumber(records.length)}</strong> total kontrak
                  {records.length > 0 && (
                    <span className="ml-1 text-[11px] text-slate-500 font-bold">
                      ({((filteredRecords.length / records.length) * 100).toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Semua Filter</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Sembunyikan Filter</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QUICK PDF & EXPORT BUTTONS */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-bold mr-1">📄 Unduh Cepat PDF:</span>
            <button
              onClick={() => exportKontrakBelumSelesaiPDF(records)}
              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800 cursor-pointer"
            >
              Belum Selesai
            </button>
            <button
              onClick={() => exportKontrakTerlambatPDF(records)}
              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800 cursor-pointer"
            >
              Terlambat
            </button>
            <button
              onClick={() => exportNrkPerluPenyesuaianPDF(records)}
              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 cursor-pointer"
            >
              NRK Perlu Penyesuaian
            </button>
            <button
              onClick={() => exportSisaKontrakTerbesarPDF(records)}
              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800 cursor-pointer"
            >
              Sisa Terbesar
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportKontrakToExcel(filteredRecords)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel ({filteredRecords.length})</span>
            </button>
            <button
              onClick={() => exportKontrakToPDF(filteredRecords, filter)}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* DATA TABLE CARD */}
      <div
        className={`rounded-3xl border shadow-sm overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className={`border-b font-extrabold ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-100/80 border-slate-200 text-slate-700'
                }`}
              >
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th
                  onClick={() => handleSort('nomor_kontrak')}
                  className="py-3 px-3 cursor-pointer hover:text-emerald-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Nomor Kontrak</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('kode_satker')}
                  className="py-3 px-3 cursor-pointer hover:text-emerald-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Satker</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('nama_supplier')}
                  className="py-3 px-3 cursor-pointer hover:text-emerald-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Supplier</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('tanggal_mulai')}
                  className="py-3 px-3 cursor-pointer hover:text-emerald-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Mulai</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('tanggal_selesai')}
                  className="py-3 px-3 cursor-pointer hover:text-emerald-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Selesai (Due Date)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('nilai_kontrak')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-emerald-600"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Nilai Kontrak</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('nilai_pembayaran')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-emerald-600"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Pembayaran</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('sisa_kontrak')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-emerald-600"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Sisa Kontrak</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status_progress_kontrak')}
                  className="py-3 px-3 cursor-pointer hover:text-emerald-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Status Progress</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status_nrk')}
                  className="py-3 px-3 cursor-pointer hover:text-emerald-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Status NRK</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-bold">Tidak ada data kontrak yang cocok dengan filter aktif.</p>
                    <button
                      onClick={handleResetFilter}
                      className="mt-2 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, idx) => {
                  const isTerlambat =
                    r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' ||
                    r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT' ||
                    r.status_progress_kontrak === 'SELESAI TERLAMBAT';

                  const isSelesai =
                    r.status_progress_kontrak === 'SELESAI TEPAT WAKTU' ||
                    r.status_progress_kontrak === 'SELESAI TERLAMBAT';

                  return (
                    <tr
                      key={r.id || idx}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/10'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {r.nomor_kontrak}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block">
                          {r.kode_satker}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[180px] block">
                          {r.deskripsi_satker}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block truncate max-w-[160px]">
                          {r.nama_supplier}
                        </span>
                        {r.kode_coa && (
                          <span className="font-mono text-[10px] text-slate-400 block">COA: {r.kode_coa}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {r.tanggal_mulai}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200">
                        {r.tanggal_selesai}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatRupiah(r.nilai_kontrak)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(r.nilai_pembayaran)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        {formatRupiah(r.sisa_kontrak)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status_progress_kontrak === 'SELESAI TEPAT WAKTU'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : isTerlambat
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {r.status_progress_kontrak}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status_nrk === 'SESUAI'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {r.status_nrk}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          title="Lihat Detail Seluruh Kolom Sumber"
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* TOTAL FOOTER ROW */}
            {filteredRecords.length > 0 && (
              <tfoot>
                <tr
                  className={`border-t font-extrabold ${
                    isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <td colSpan={6} className="py-3 px-3 text-right">
                    TOTAL HASIL FILTER ({formatNumber(filteredRecords.length)} KONTRAK):
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs">
                    {formatRupiah(totals.nilaiKontrak)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(totals.nilaiPembayaran)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs text-amber-600 dark:text-amber-400">
                    {formatRupiah(totals.sisaKontrak)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* PAGINATION TOOLBAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Tampilkan per halaman:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 rounded-lg border bg-transparent font-medium"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-400">
              Menampilkan {Math.min((currentPage - 1) * pageSize + 1, sortedRecords.length)} -{' '}
              {Math.min(currentPage * pageSize, sortedRecords.length)} dari {sortedRecords.length} kontrak
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border disabled:opacity-30 cursor-pointer font-bold"
            >
              « Pertama
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border disabled:opacity-30 cursor-pointer font-bold"
            >
              ‹ Sebelumnya
            </button>
            <span className="px-3 py-1 font-bold text-slate-700 dark:text-slate-300">
              Halaman {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border disabled:opacity-30 cursor-pointer font-bold"
            >
              Berikutnya ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border disabled:opacity-30 cursor-pointer font-bold"
            >
              Terakhir »
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedRecord && (
        <KontrakDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          isDark={isDark}
        />
      )}
    </div>
  );
};
