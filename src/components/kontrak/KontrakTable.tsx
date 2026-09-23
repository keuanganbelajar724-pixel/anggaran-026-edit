import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  Search,
  SlidersHorizontal,
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
}

export const KontrakTable: React.FC<KontrakTableProps> = ({
  records,
  isDark = false,
  userRole = 'admin',
  userSatkerCode
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
  const { years, satkers, suppliers, progressStatuses, nrkStatuses, kirimStatuses, coas } =
    useMemo(() => {
      const yearSet = new Set<string>();
      const satkerMap = new Map<string, string>();
      const suppSet = new Set<string>();
      const progSet = new Set<string>();
      const nrkSet = new Set<string>();
      const kirimSet = new Set<string>();
      const coaSet = new Set<string>();

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
      });

      return {
        years: Array.from(yearSet).sort(),
        satkers: Array.from(satkerMap.entries()).map(([kode, nama]) => ({ kode, nama })),
        suppliers: Array.from(suppSet).sort(),
        progressStatuses: Array.from(progSet).sort(),
        nrkStatuses: Array.from(nrkSet).sort(),
        kirimStatuses: Array.from(kirimSet).sort(),
        coas: Array.from(coaSet).sort()
      };
    }, [records]);

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
    <div className="space-y-4">
      {/* FILTER & TOOLBAR CARD */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Quick Category Buttons & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Quick Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => handleCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter.kategoriProgress === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Semua ({records.length})
            </button>
            <button
              onClick={() => handleCategoryFilter('SELESAI')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter.kategoriProgress === 'SELESAI'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              Selesai
            </button>
            <button
              onClick={() => handleCategoryFilter('BELUM_SELESAI')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter.kategoriProgress === 'BELUM_SELESAI'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              }`}
            >
              Belum Selesai
            </button>
            <button
              onClick={() => handleCategoryFilter('TERLAMBAT')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter.kategoriProgress === 'TERLAMBAT'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
              }`}
            >
              ⚠️ Terlambat
            </button>
            <button
              onClick={() => handleCategoryFilter('NRK_PERLU_PENYESUAIAN')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter.kategoriProgress === 'NRK_PERLU_PENYESUAIAN'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
              }`}
            >
              NRK Perlu Penyesuaian
            </button>
          </div>

          {/* Global Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kontrak, satker, supplier, uraian, NRK, COA..."
              value={filter.searchQuery}
              onChange={e => {
                setFilter(prev => ({ ...prev, searchQuery: e.target.value }));
                setCurrentPage(1);
              }}
              className={`w-full pl-10 pr-9 py-2 rounded-2xl text-xs font-medium border transition-colors outline-none ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
              }`}
            />
            {filter.searchQuery && (
              <button
                onClick={() => setFilter(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Advanced Filters Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                showAdvancedFilters
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvancedFilters ? 'Tutup Filter' : '15 Filter Lengkap'}</span>
            </button>

            <button
              onClick={handleResetFilter}
              title="Reset Semua Filter"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 15 ADVANCED FILTERS PANEL */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* 1. Tahun */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">1. Tahun Kontrak</label>
              <select
                value={filter.tahun}
                onChange={e => {
                  setFilter(prev => ({ ...prev, tahun: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-xl border bg-transparent font-medium"
              >
                <option value="ALL">Semua Tahun</option>
                {years.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Triwulan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">2. Triwulan (Tanggal Kontrak)</label>
              <select
                value={filter.triwulan}
                onChange={e => {
                  setFilter(prev => ({ ...prev, triwulan: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-xl border bg-transparent font-medium"
              >
                <option value="ALL">Semua Triwulan</option>
                <option value="Tw I">Triwulan I (Jan - Mar)</option>
                <option value="Tw II">Triwulan II (Apr - Jun)</option>
                <option value="Tw III">Triwulan III (Jul - Sep)</option>
                <option value="Tw IV">Triwulan IV (Okt - Des)</option>
              </select>
            </div>

            {/* 3. Bulan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">3. Bulan Kontrak</label>
              <select
                value={filter.bulan}
                onChange={e => {
                  setFilter(prev => ({ ...prev, bulan: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-xl border bg-transparent font-medium"
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
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Kode Satker (Disabled if Satker role) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">4. Kode Satker</label>
              <select
                disabled={userRole === 'satker'}
                value={filter.kodeSatker}
                onChange={e => {
                  setFilter(prev => ({ ...prev, kodeSatker: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-xl border bg-transparent font-medium disabled:opacity-50"
              >
                <option value="ALL">Semua Satker ({satkers.length})</option>
                {satkers.map(s => (
                  <option key={s.kode} value={s.kode}>
                    {s.kode} - {s.nama.slice(0, 25)}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Status Progress Kontrak */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">5. Status Progress Kontrak</label>
              <select
                value={filter.statusProgress}
                onChange={e => {
                  setFilter(prev => ({ ...prev, statusProgress: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-xl border bg-transparent font-medium"
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
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">6. Status NRK</label>
              <select
                value={filter.statusNrk}
                onChange={e => {
                  setFilter(prev => ({ ...prev, statusNrk: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-xl border bg-transparent font-medium"
              >
                <option value="ALL">Semua Status NRK</option>
                {nrkStatuses.map(st => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* 7. Supplier */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">7. Nama Supplier</label>
              <select
                value={filter.supplier}
                onChange={e => {
                  setFilter(prev => ({ ...prev, supplier: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-xl border bg-transparent font-medium"
              >
                <option value="ALL">Semua Supplier ({suppliers.length})</option>
                {suppliers.slice(0, 100).map(sp => (
                  <option key={sp} value={sp}>
                    {sp.slice(0, 30)}
                  </option>
                ))}
              </select>
            </div>

            {/* 8. Kode COA */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">8. Kode Akun / COA</label>
              <select
                value={filter.kodeCoa}
                onChange={e => {
                  setFilter(prev => ({ ...prev, kodeCoa: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-xl border bg-transparent font-medium"
              >
                <option value="ALL">Semua COA</option>
                {coas.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 9. Tanggal Kontrak Range */}
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">9. Tanggal Kontrak (Rentang)</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filter.tanggalKontrakStart}
                  onChange={e => setFilter(prev => ({ ...prev, tanggalKontrakStart: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded-xl border bg-transparent text-xs"
                />
                <span className="text-slate-400">s.d.</span>
                <input
                  type="date"
                  value={filter.tanggalKontrakEnd}
                  onChange={e => setFilter(prev => ({ ...prev, tanggalKontrakEnd: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded-xl border bg-transparent text-xs"
                />
              </div>
            </div>

            {/* 10. Tanggal Selesai Range */}
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">10. Tanggal Selesai (Rentang)</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filter.tanggalSelesaiStart}
                  onChange={e => setFilter(prev => ({ ...prev, tanggalSelesaiStart: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded-xl border bg-transparent text-xs"
                />
                <span className="text-slate-400">s.d.</span>
                <input
                  type="date"
                  value={filter.tanggalSelesaiEnd}
                  onChange={e => setFilter(prev => ({ ...prev, tanggalSelesaiEnd: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded-xl border bg-transparent text-xs"
                />
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
