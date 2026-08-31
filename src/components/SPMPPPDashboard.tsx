import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Zap,
  Phone,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Upload
} from 'lucide-react';
import { SPMPPPRecord, MasterSatker } from '../types';

interface SPMPPPDashboardProps {
  spmPppRecords?: SPMPPPRecord[];
  spmRecords?: SPMPPPRecord[];
  masterSatkers?: MasterSatker[];
  satkers?: any[];
  isDark?: boolean;
  isAdminAuthenticated?: boolean;
  onSetIsAdminAuthenticated?: (val: boolean) => void;
  onUpdateSPMPPP?: (records: SPMPPPRecord[]) => void;
  onUpdateSPMRecords?: (records: SPMPPPRecord[]) => void;
  onGoToUpload?: () => void;
  onGoToAdmin?: () => void;
}

const STATUS_ORDER_MAP: Record<string, number> = {
  'cetak spm': 1,
  'cetak spp': 2,
  'setuju spp': 3,
  'upload ntt': 4,
  'belum membuat spp': 5
};

export const SPMPPPDashboard: React.FC<SPMPPPDashboardProps> = ({
  spmPppRecords = [],
  spmRecords = [],
  masterSatkers = [],
  satkers = [],
  isDark = false
}) => {
  const [activeView, setActiveView] = useState<'satker' | 'rincian' | 'analisis'>('satker');
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<'ALL' | 'PLN' | 'TELKOM'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSatker, setSelectedSatker] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const rawRecords = spmPppRecords ?? spmRecords;
  const effectiveRecords = useMemo(() => {
    return Array.isArray(rawRecords) ? rawRecords : [];
  }, [rawRecords]);

  // Master map lookup
  const masterMap = useMemo(() => {
    const map = new Map<string, MasterSatker>();
    masterSatkers.forEach(m => {
      if (m.kodeSatker) map.set(m.kodeSatker.trim(), m);
    });
    return map;
  }, [masterSatkers]);

  // Currency Formatter
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Summary Metrics
  const summary = useMemo(() => {
    const totalCount = effectiveRecords.length;
    const totalNominal = effectiveRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);

    const getStatusText = (r: SPMPPPRecord) => (r.statusSpm && r.statusSpm.trim() !== '') ? r.statusSpm.trim() : 'Belum membuat SPP';

    const cetakSpmRecords = effectiveRecords.filter(r => getStatusText(r).toLowerCase() === 'cetak spm');
    const cetakSppRecords = effectiveRecords.filter(r => getStatusText(r).toLowerCase() === 'cetak spp');
    const setujuSppRecords = effectiveRecords.filter(r => getStatusText(r).toLowerCase() === 'setuju spp');
    const uploadNttRecords = effectiveRecords.filter(r => getStatusText(r).toLowerCase() === 'upload ntt' || getStatusText(r).toLowerCase().includes('ntt'));
    const belumRecords = effectiveRecords.filter(r => getStatusText(r).toLowerCase().includes('belum'));

    const cetakSpmCount = cetakSpmRecords.length;
    const cetakSpmNominal = cetakSpmRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);

    const cetakSppCount = cetakSppRecords.length;
    const cetakSppNominal = cetakSppRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);

    const setujuSppCount = setujuSppRecords.length;
    const setujuSppNominal = setujuSppRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);

    const uploadNttCount = uploadNttRecords.length;
    const uploadNttNominal = uploadNttRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);

    const belumCount = belumRecords.length;
    const belumNominal = belumRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);

    // Service Breakdown
    const plnRecords = effectiveRecords.filter(r => r.jenisLayanan === 'PLN');
    const plnCount = plnRecords.length;
    const plnNominal = plnRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);
    const plnBelumCount = plnRecords.filter(r => getStatusText(r).toLowerCase().includes('belum')).length;

    const telkomRecords = effectiveRecords.filter(r => r.jenisLayanan === 'TELKOM');
    const telkomCount = telkomRecords.length;
    const telkomNominal = telkomRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);
    const telkomBelumCount = telkomRecords.filter(r => getStatusText(r).toLowerCase().includes('belum')).length;

    const uniqueSatkers = new Set(effectiveRecords.map(r => r.kodeSatker)).size;
    const uniqueSatkerBelum = new Set(belumRecords.map(r => r.kodeSatker)).size;

    return {
      totalCount,
      totalNominal,
      cetakSpmCount,
      cetakSpmNominal,
      cetakSppCount,
      cetakSppNominal,
      setujuSppCount,
      setujuSppNominal,
      uploadNttCount,
      uploadNttNominal,
      belumCount,
      belumNominal,
      plnCount,
      plnNominal,
      plnBelumCount,
      telkomCount,
      telkomNominal,
      telkomBelumCount,
      uniqueSatkers,
      uniqueSatkerBelum,
      persenBelum: totalCount > 0 ? ((belumCount / totalCount) * 100).toFixed(1) : '0',
      persenSelesai: totalCount > 0 ? (((totalCount - belumCount) / totalCount) * 100).toFixed(1) : '0'
    };
  }, [effectiveRecords]);

  // Satker Aggregation List
  const satkerAggregatedList = useMemo(() => {
    const map = new Map<string, {
      kodeSatker: string;
      namaSatker: string;
      totalTagihan: number;
      totalNominal: number;
      plnCount: number;
      plnNominal: number;
      telkomCount: number;
      telkomNominal: number;
      belumCount: number;
      belumNominal: number;
      prosesCount: number;
      statusCounts: Record<string, number>;
      picPhone?: string;
    }>();

    effectiveRecords.forEach(r => {
      const existing = map.get(r.kodeSatker) || {
        kodeSatker: r.kodeSatker,
        namaSatker: r.namaSatker,
        totalTagihan: 0,
        totalNominal: 0,
        plnCount: 0,
        plnNominal: 0,
        telkomCount: 0,
        telkomNominal: 0,
        belumCount: 0,
        belumNominal: 0,
        prosesCount: 0,
        statusCounts: {},
        picPhone: masterMap.get(r.kodeSatker)?.noHpPic || ''
      };

      existing.totalTagihan += 1;
      existing.totalNominal += (r.nilaiTagihan || 0);

      if (r.jenisLayanan === 'PLN') {
        existing.plnCount += 1;
        existing.plnNominal += (r.nilaiTagihan || 0);
      } else {
        existing.telkomCount += 1;
        existing.telkomNominal += (r.nilaiTagihan || 0);
      }

      const rawStatus = r.statusSpm && r.statusSpm.trim() !== '' ? r.statusSpm.trim() : 'Belum membuat SPP';
      existing.statusCounts[rawStatus] = (existing.statusCounts[rawStatus] || 0) + 1;

      const isBelum = !r.statusSpm || r.statusSpm.toLowerCase().includes('belum');

      if (isBelum) {
        existing.belumCount += 1;
        existing.belumNominal += (r.nilaiTagihan || 0);
      } else {
        existing.prosesCount += 1;
      }

      map.set(r.kodeSatker, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.belumNominal - a.belumNominal || b.totalNominal - a.totalNominal);
  }, [effectiveRecords, masterMap]);

  // Distinct statuses breakdown from Excel Kolom L sorted cleanly
  const distinctStatuses = useMemo(() => {
    const counts: Record<string, number> = {};
    effectiveRecords.forEach(r => {
      const raw = (r.statusSpm && r.statusSpm.trim() !== '') ? r.statusSpm.trim() : 'Belum membuat SPP';
      counts[raw] = (counts[raw] || 0) + 1;
    });
    return counts;
  }, [effectiveRecords]);

  const sortedStatusEntries = useMemo(() => {
    return Object.entries(distinctStatuses).sort(([a], [b]) => {
      const orderA = STATUS_ORDER_MAP[a.toLowerCase()] ?? 99;
      const orderB = STATUS_ORDER_MAP[b.toLowerCase()] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b);
    });
  }, [distinctStatuses]);

  // Filtered Satker List
  const filteredSatkerList = useMemo(() => {
    return satkerAggregatedList.filter(s => {
      if (statusFilter === 'ALL') {
        // pass
      } else if (statusFilter === 'BELUM') {
        if (s.belumCount === 0) return false;
      } else if (statusFilter === 'SELESAI' || statusFilter === 'SP2D') {
        if (s.selesaiCount === 0) return false;
      } else if (statusFilter === 'PROSES') {
        if (s.prosesCount === 0) return false;
      } else {
        // Exact status filter (e.g. 'Cetak SPM', 'Cetak SPP', 'Setuju SPP', 'Upload NTT', 'Belum membuat SPP')
        const countForStatus = s.statusCounts[statusFilter] || 0;
        if (countForStatus === 0) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchKode = s.kodeSatker.toLowerCase().includes(q);
        const matchNama = s.namaSatker.toLowerCase().includes(q);
        return matchKode || matchNama;
      }
      return true;
    });
  }, [satkerAggregatedList, statusFilter, searchQuery]);

  // Filtered Detailed Invoices
  const filteredInvoices = useMemo(() => {
    return effectiveRecords.filter(r => {
      if (serviceFilter !== 'ALL' && r.jenisLayanan !== serviceFilter) return false;
      if (selectedSatker !== 'ALL' && r.kodeSatker !== selectedSatker) return false;

      const rawStatus = (r.statusSpm && r.statusSpm.trim() !== '') ? r.statusSpm.trim() : 'Belum membuat SPP';
      const isBelum = !r.statusSpm || r.statusSpm.toLowerCase().includes('belum') || (!r.noSpm && !r.noSp2d);
      const isSelesai = r.noSp2d || (r.statusSpm && r.statusSpm.toLowerCase().includes('sp2d'));
      const isProses = !isBelum && !isSelesai;

      if (statusFilter === 'ALL') {
        // pass
      } else if (statusFilter === 'BELUM') {
        if (!isBelum) return false;
      } else if (statusFilter === 'SELESAI' || statusFilter === 'SP2D') {
        if (!isSelesai) return false;
      } else if (statusFilter === 'PROSES') {
        if (!isProses) return false;
      } else {
        // Exact status match from Excel Kolom L
        if (rawStatus.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchKode = r.kodeSatker.toLowerCase().includes(q);
        const matchNama = (r.namaSatker || '').toLowerCase().includes(q);
        const matchPelanggan = (r.noPelanggan || '').toLowerCase().includes(q);
        const matchSpp = (r.noSpp || '').toLowerCase().includes(q);
        const matchSpm = (r.noSpm || '').toLowerCase().includes(q);
        const matchSp2d = (r.noSp2d || '').toLowerCase().includes(q);
        const matchStatus = (r.statusSpm || '').toLowerCase().includes(q);

        return matchKode || matchNama || matchPelanggan || matchSpp || matchSpm || matchSp2d || matchStatus;
      }

      return true;
    });
  }, [effectiveRecords, serviceFilter, selectedSatker, statusFilter, searchQuery]);

  // Pagination for Satker List
  const paginatedSatkerList = useMemo(() => {
    if (pageSize <= 0) return filteredSatkerList;
    const start = (currentPage - 1) * pageSize;
    return filteredSatkerList.slice(start, start + pageSize);
  }, [filteredSatkerList, currentPage, pageSize]);

  // Pagination for Invoices
  const paginatedInvoices = useMemo(() => {
    if (pageSize <= 0) return filteredInvoices;
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  const activeTotalPages = pageSize <= 0
    ? 1
    : activeView === 'satker' 
      ? (Math.ceil(filteredSatkerList.length / pageSize) || 1) 
      : (Math.ceil(filteredInvoices.length / pageSize) || 1);

  return (
    <div className="space-y-6">
      {/* Top Header Card (Clean Dashboard Header without upload/download/broadcast) */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-amber-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-lg shadow-amber-500/25">
              <Receipt className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Monitoring SPM PPP (Langganan Daya & Jasa)
                </h2>
                <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Tagihan PFK: PLN & TELKOM
                </span>
              </div>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-3xl`}>
                Dashboard pemantauan penyelesaian Surat Perintah Membayar Perhitungan Fihak Ketiga (SPM PPP) untuk memastikan seluruh tagihan listrik, telepon, dan internet satker terselesaikan tepat waktu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl border border-amber-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5 shadow-sm">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Periode: <strong>Agustus 2026</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Tagihan PFK</span>
            <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {summary.totalCount.toLocaleString('id-ID')}
            </div>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
              {formatRupiah(summary.totalNominal)}
            </div>
            <div className={`text-[11px] mt-1.5 flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{summary.uniqueSatkers} Satker Terdata</span>
            </div>
          </div>
        </div>

        {/* Belum Membuat SPP - CRITICAL */}
        <div 
          onClick={() => { setStatusFilter('Belum membuat SPP'); setCurrentPage(1); }}
          className={`p-5 rounded-2xl border cursor-pointer hover:scale-[1.01] transition-transform ${isDark ? 'bg-slate-800/90 border-rose-900/60' : 'bg-white border-rose-200 shadow-sm ring-2 ring-rose-500/20'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Belum Membuat SPP
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
              {summary.persenBelum}%
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {summary.belumCount.toLocaleString('id-ID')} <span className="text-sm font-semibold text-slate-500">Tagihan</span>
            </div>
            <div className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-1">
              {formatRupiah(summary.belumNominal)}
            </div>
            <div className={`text-[11px] mt-1.5 font-medium ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>
              ⚠️ {summary.uniqueSatkerBelum} Satker belum membuat SPP
            </div>
          </div>
        </div>

        {/* Listrik (PLN) */}
        <div 
          onClick={() => { setServiceFilter(serviceFilter === 'PLN' ? 'ALL' : 'PLN'); setCurrentPage(1); }}
          className={`p-5 rounded-2xl border cursor-pointer hover:scale-[1.01] transition-transform ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} flex items-center gap-1.5`}>
              <Zap className="w-4 h-4 text-amber-500" />
              Tagihan Listrik (PLN)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              PLN
            </span>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-black ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
              {summary.plnCount.toLocaleString('id-ID')}
            </div>
            <div className="text-xs font-bold text-amber-600 mt-1">
              {formatRupiah(summary.plnNominal)}
            </div>
            <div className={`text-[11px] mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {summary.plnBelumCount} tagihan PLN belum membuat SPP
            </div>
          </div>
        </div>

        {/* Telepon / Internet (TELKOM) */}
        <div 
          onClick={() => { setServiceFilter(serviceFilter === 'TELKOM' ? 'ALL' : 'TELKOM'); setCurrentPage(1); }}
          className={`p-5 rounded-2xl border cursor-pointer hover:scale-[1.01] transition-transform ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} flex items-center gap-1.5`}>
              <Phone className="w-4 h-4 text-indigo-500" />
              Telekomunikasi (TELKOM)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              TELKOM
            </span>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-black ${isDark ? 'text-indigo-400' : 'text-indigo-800'}`}>
              {summary.telkomCount.toLocaleString('id-ID')}
            </div>
            <div className="text-xs font-bold text-indigo-600 mt-1">
              {formatRupiah(summary.telkomNominal)}
            </div>
            <div className={`text-[11px] mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {summary.telkomBelumCount} tagihan Telkom belum membuat SPP
            </div>
          </div>
        </div>
      </div>

      {/* 4 Status Progress Workflow Breakdown (Cetak SPM, Cetak SPP, Setuju SPP, Upload NTT, Belum membuat SPP) */}
      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>Progress Status Proses Tagihan PFK (Kolom L Excel)</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Klik kartu status untuk filter cepat
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* 1. Cetak SPM */}
          <button
            onClick={() => { setStatusFilter(statusFilter === 'Cetak SPM' ? 'ALL' : 'Cetak SPM'); setCurrentPage(1); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'Cetak SPM'
                ? 'ring-2 ring-amber-500 bg-amber-500 text-white shadow-md'
                : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 hover:border-amber-400 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span>Cetak SPM</span>
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-lg font-black mt-1">
              {summary.cetakSpmCount} <span className="text-[10px] font-medium opacity-80">Tagihan</span>
            </div>
            <div className={`text-[10px] font-semibold mt-0.5 ${statusFilter === 'Cetak SPM' ? 'text-amber-100' : 'text-amber-700 dark:text-amber-300'}`}>
              {formatRupiah(summary.cetakSpmNominal)}
            </div>
          </button>

          {/* 2. Cetak SPP */}
          <button
            onClick={() => { setStatusFilter(statusFilter === 'Cetak SPP' ? 'ALL' : 'Cetak SPP'); setCurrentPage(1); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'Cetak SPP'
                ? 'ring-2 ring-indigo-500 bg-indigo-600 text-white shadow-md'
                : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span>Cetak SPP</span>
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-lg font-black mt-1">
              {summary.cetakSppCount} <span className="text-[10px] font-medium opacity-80">Tagihan</span>
            </div>
            <div className={`text-[10px] font-semibold mt-0.5 ${statusFilter === 'Cetak SPP' ? 'text-indigo-100' : 'text-indigo-700 dark:text-indigo-300'}`}>
              {formatRupiah(summary.cetakSppNominal)}
            </div>
          </button>

          {/* 3. Setuju SPP */}
          <button
            onClick={() => { setStatusFilter(statusFilter === 'Setuju SPP' ? 'ALL' : 'Setuju SPP'); setCurrentPage(1); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'Setuju SPP'
                ? 'ring-2 ring-cyan-500 bg-cyan-600 text-white shadow-md'
                : 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-900/60 hover:border-cyan-400 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span>Setuju SPP</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-lg font-black mt-1">
              {summary.setujuSppCount} <span className="text-[10px] font-medium opacity-80">Tagihan</span>
            </div>
            <div className={`text-[10px] font-semibold mt-0.5 ${statusFilter === 'Setuju SPP' ? 'text-cyan-100' : 'text-cyan-700 dark:text-cyan-300'}`}>
              {formatRupiah(summary.setujuSppNominal)}
            </div>
          </button>

          {/* 4. Upload NTT */}
          <button
            onClick={() => { setStatusFilter(statusFilter === 'Upload NTT' ? 'ALL' : 'Upload NTT'); setCurrentPage(1); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'Upload NTT'
                ? 'ring-2 ring-teal-500 bg-teal-600 text-white shadow-md'
                : 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/60 hover:border-teal-400 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span>Upload NTT</span>
              <Upload className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="text-lg font-black mt-1">
              {summary.uploadNttCount} <span className="text-[10px] font-medium opacity-80">Tagihan</span>
            </div>
            <div className={`text-[10px] font-semibold mt-0.5 ${statusFilter === 'Upload NTT' ? 'text-teal-100' : 'text-teal-700 dark:text-teal-300'}`}>
              {formatRupiah(summary.uploadNttNominal)}
            </div>
          </button>

          {/* 5. Belum membuat SPP */}
          <button
            onClick={() => { setStatusFilter(statusFilter === 'Belum membuat SPP' ? 'ALL' : 'Belum membuat SPP'); setCurrentPage(1); }}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === 'Belum membuat SPP'
                ? 'ring-2 ring-rose-500 bg-rose-600 text-white shadow-md'
                : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 hover:border-rose-400 text-slate-800 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span>Belum membuat SPP</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-lg font-black mt-1">
              {summary.belumCount} <span className="text-[10px] font-medium opacity-80">Tagihan</span>
            </div>
            <div className={`text-[10px] font-semibold mt-0.5 ${statusFilter === 'Belum membuat SPP' ? 'text-rose-100' : 'text-rose-700 dark:text-rose-300'}`}>
              {formatRupiah(summary.belumNominal)}
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area: View Toggle & Filters */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
        {/* Navigation View Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => { setActiveView('satker'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeView === 'satker'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Rekapitulasi per Satker ({satkerAggregatedList.length})
            </button>

            <button
              onClick={() => { setActiveView('rincian'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeView === 'rincian'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Rincian Seluruh Tagihan ({effectiveRecords.length})
            </button>

            <button
              onClick={() => { setActiveView('analisis'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeView === 'analisis'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Analisis Layanan
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Periode Tagihan: <strong>Agustus 2026</strong></span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode/nama satker, no pelanggan..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="ALL">(Select All) - Semua Status / No. SPM ({effectiveRecords.length})</option>
              {sortedStatusEntries.map(([stName, cnt]) => (
                <option key={stName} value={stName}>
                  {stName} ({cnt} data)
                </option>
              ))}
            </select>
          </div>

          {/* Service Filter (Only for Rincian / All) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setServiceFilter('ALL'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                serviceFilter === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Semua Jasa
            </button>
            <button
              onClick={() => { setServiceFilter('PLN'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                serviceFilter === 'PLN' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              PLN ({summary.plnCount})
            </button>
            <button
              onClick={() => { setServiceFilter('TELKOM'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                serviceFilter === 'TELKOM' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              TELKOM ({summary.telkomCount})
            </button>
          </div>

          {/* Page size */}
          <div className="flex items-center justify-end gap-2 text-xs">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tampilkan:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value={15}>15 Data</option>
              <option value={30}>30 Data</option>
              <option value={50}>50 Data</option>
              <option value={100}>100 Data</option>
              <option value={250}>250 Data</option>
              <option value={-1}>Semua Data ({activeView === 'satker' ? filteredSatkerList.length : filteredInvoices.length})</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills (Matching Excel Kolom L AutoFilter: Cetak SPM, Cetak SPP, Setuju SPP, Upload NTT, Belum membuat SPP) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-3 text-xs scrollbar-thin">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-amber-500" /> Filter No. SPM / Status:
          </span>
          <button
            onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            (Select All) ({effectiveRecords.length})
          </button>
          {sortedStatusEntries.map(([statusName, count]) => {
            const isSelected = statusFilter.toLowerCase() === statusName.toLowerCase();
            const lower = statusName.toLowerCase();
            let badgeClass = isSelected
              ? 'bg-blue-600 text-white shadow-sm border-blue-600'
              : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
            
            if (lower.includes('upload') || lower.includes('ntt')) {
              badgeClass = isSelected
                ? 'bg-teal-600 text-white shadow-sm border-teal-600'
                : 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800';
            } else if (lower.includes('setuju')) {
              badgeClass = isSelected
                ? 'bg-cyan-600 text-white shadow-sm border-cyan-600'
                : 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800';
            } else if (lower === 'cetak spp') {
              badgeClass = isSelected
                ? 'bg-indigo-600 text-white shadow-sm border-indigo-600'
                : 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';
            } else if (lower === 'cetak spm') {
              badgeClass = isSelected
                ? 'bg-amber-600 text-white shadow-sm border-amber-600'
                : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
            } else if (lower.includes('sp2d') || lower.includes('selesai')) {
              badgeClass = isSelected
                ? 'bg-emerald-600 text-white shadow-sm border-emerald-600'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
            } else if (lower.includes('belum')) {
              badgeClass = isSelected
                ? 'bg-rose-600 text-white shadow-sm border-rose-600'
                : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
            }

            return (
              <button
                key={statusName}
                onClick={() => { setStatusFilter(statusName); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg border text-xs font-bold shrink-0 transition-all ${badgeClass}`}
              >
                {statusName} ({count})
              </button>
            );
          })}
        </div>

        {/* VIEW 1: REKAPITULASI PER SATKER */}
        {activeView === 'satker' && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs text-left">
              <thead className={`text-[11px] uppercase tracking-wider ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                <tr>
                  <th className="px-3.5 py-3">Peringkat</th>
                  <th className="px-3.5 py-3">Kode & Nama Satker</th>
                  <th className="px-3.5 py-3 text-center">PLN</th>
                  <th className="px-3.5 py-3 text-center">TELKOM</th>
                  <th className="px-3.5 py-3 text-right">Total Tagihan</th>
                  <th className="px-3.5 py-3 text-right">Belum SPP</th>
                  <th className="px-3.5 py-3 text-center">No. SPM / Status SPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginatedSatkerList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      Tidak ditemukan satker dengan kriteria pencarian yang dipilih.
                    </td>
                  </tr>
                ) : (
                  paginatedSatkerList.map((s, idx) => {
                    const rank = (pageSize > 0 ? (currentPage - 1) * pageSize : 0) + idx + 1;
                    const isAllDone = s.belumCount === 0;
                    const statusEntries = Object.entries(s.statusCounts || {});

                    return (
                      <tr
                        key={s.kodeSatker}
                        className={`${
                          !isAllDone && s.belumCount > 3 ? (isDark ? 'bg-rose-950/10' : 'bg-rose-50/30') : ''
                        } ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} transition-colors`}
                      >
                        <td className="px-3.5 py-3 text-slate-400 font-mono font-bold">
                          #{rank}
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {s.kodeSatker}
                            </span>{' '}
                            - {s.namaSatker}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Total: {s.totalTagihan} Tagihan Langganan
                          </div>
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            {s.plnCount} ({formatRupiah(s.plnNominal)})
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            {s.telkomCount} ({formatRupiah(s.telkomNominal)})
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatRupiah(s.totalNominal)}
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          {s.belumCount > 0 ? (
                            <div className="text-rose-600 dark:text-rose-400 font-bold font-mono">
                              {s.belumCount} tagihan
                              <div className="text-[10px] font-normal text-rose-500">
                                {formatRupiah(s.belumNominal)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              0 (Lengkap)
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {statusEntries.length === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                <AlertTriangle className="w-3 h-3" />
                                Belum membuat SPP
                              </span>
                            ) : (
                              statusEntries.map(([statusName, count]) => {
                                const lower = statusName.toLowerCase().trim();
                                const isSelesai = lower.includes('sp2d') || lower.includes('selesai');
                                const isBelumStatus = lower.includes('belum');
                                const isUploadNtt = lower === 'upload ntt' || lower.includes('ntt');
                                const isSetuju = lower === 'setuju spp' || lower.includes('setuju');
                                const isCetakSpp = lower === 'cetak spp';
                                const isCetakSpm = lower === 'cetak spm';

                                let badgeColor = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200';
                                if (isCetakSpm) {
                                  badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300';
                                } else if (isCetakSpp) {
                                  badgeColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300';
                                } else if (isSetuju) {
                                  badgeColor = 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300';
                                } else if (isUploadNtt) {
                                  badgeColor = 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300';
                                } else if (isSelesai) {
                                  badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300';
                                } else if (isBelumStatus) {
                                  badgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300';
                                }

                                return (
                                  <span
                                    key={statusName}
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}
                                  >
                                    {isCetakSpm && <Clock className="w-3 h-3 text-amber-600" />}
                                    {isCetakSpp && <Clock className="w-3 h-3 text-indigo-600" />}
                                    {isSetuju && <CheckCircle2 className="w-3 h-3 text-cyan-600" />}
                                    {isUploadNtt && <Upload className="w-3 h-3 text-teal-600" />}
                                    {isSelesai && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                    {isBelumStatus && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                                    {statusName} {statusEntries.length > 1 ? `(${count})` : ''}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2: RINCIAN SELURUH TAGIHAN (Clean table without action column) */}
        {activeView === 'rincian' && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-xs text-left">
              <thead className={`text-[11px] uppercase tracking-wider ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                <tr>
                  <th className="px-3 py-3">No</th>
                  <th className="px-3 py-3">Satker</th>
                  <th className="px-3 py-3">Layanan</th>
                  <th className="px-3 py-3">No Pelanggan</th>
                  <th className="px-3 py-3">Periode</th>
                  <th className="px-3 py-3 text-right">Nilai Tagihan</th>
                  <th className="px-3 py-3">No SPP</th>
                  <th className="px-3 py-3 text-center">No. SPM / Status SPM</th>
                  <th className="px-3 py-3">No SP2D</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      Tidak ada rincian tagihan yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((r, idx) => {
                    const statusText = (r.statusSpm && r.statusSpm.trim() !== '') ? r.statusSpm.trim() : 'Belum membuat SPP';
                    const lowerStatus = statusText.toLowerCase().trim();
                    const isBelum = lowerStatus.includes('belum');

                    let statusBadgeClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200';
                    if (lowerStatus === 'cetak spm') {
                      statusBadgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300';
                    } else if (lowerStatus === 'cetak spp') {
                      statusBadgeClass = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300';
                    } else if (lowerStatus === 'setuju spp') {
                      statusBadgeClass = 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300';
                    } else if (lowerStatus === 'upload ntt' || lowerStatus.includes('ntt')) {
                      statusBadgeClass = 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300';
                    } else if (lowerStatus.includes('sp2d') || lowerStatus.includes('selesai')) {
                      statusBadgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300';
                    } else if (isBelum) {
                      statusBadgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300';
                    }

                    return (
                      <tr
                        key={r.id}
                        className={`${isBelum ? (isDark ? 'bg-rose-950/10' : 'bg-rose-50/20') : ''} ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} transition-colors`}
                      >
                        <td className="px-3 py-2.5 text-slate-400 font-mono">
                          {(pageSize > 0 ? (currentPage - 1) * pageSize : 0) + idx + 1}
                        </td>
                        <td className="px-3 py-2.5 font-medium max-w-[220px] truncate" title={`${r.kodeSatker} - ${r.namaSatker}`}>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {r.kodeSatker}
                          </span>{' '}
                          - {r.namaSatker}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                            r.jenisLayanan === 'PLN' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}>
                            {r.jenisLayanan === 'PLN' ? <Zap className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                            {r.jenisLayanan}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                          {r.noPelanggan || '-'}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px]">
                          {r.bulan}/{r.tahun}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatRupiah(r.nilaiTagihan)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {r.noSpp || '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            {r.noSpm && (
                              <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                {r.noSpm}
                              </span>
                            )}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadgeClass}`}>
                              {statusText}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {r.noSp2d || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 3: ANALISIS LAYANAN */}
        {activeView === 'analisis' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PLN Deep Dive */}
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-amber-50/50 border-amber-200'}`}>
              <div className="flex items-center justify-between pb-3 border-b border-amber-200/60 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500 text-white rounded-xl">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Langganan Daya Listrik (PLN)
                    </h4>
                    <p className="text-xs text-slate-500">Perhitungan Fihak Ketiga (PFK) PLN</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-200 text-amber-900">
                  {summary.plnCount} Tagihan
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Total Nominal Tagihan PLN:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(summary.plnNominal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-rose-600 font-semibold">Tagihan Belum Diajukan SPM:</span>
                  <span className="font-mono font-bold text-rose-600">{Number.isFinite(summary.plnBelumCount) ? summary.plnBelumCount : 0} Tagihan</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-600 font-semibold">Sudah Selesai SP2D:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {Math.max(0, (Number.isFinite(summary.plnCount) ? summary.plnCount : 0) - (Number.isFinite(summary.plnBelumCount) ? summary.plnBelumCount : 0))} Tagihan
                  </span>
                </div>

                <div className="pt-3 border-t border-amber-200/60 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    5 Tagihan Listrik Terbesar:
                  </div>
                  <div className="space-y-1.5">
                    {effectiveRecords
                      .filter(r => r.jenisLayanan === 'PLN')
                      .sort((a, b) => (b.nilaiTagihan || 0) - (a.nilaiTagihan || 0))
                      .slice(0, 5)
                      .map((r, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                          <div className="truncate max-w-[220px]">
                            <span className="font-bold text-amber-600">{r.kodeSatker}</span> - {r.namaSatker}
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(r.nilaiTagihan)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TELKOM Deep Dive */}
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-indigo-50/50 border-indigo-200'}`}>
              <div className="flex items-center justify-between pb-3 border-b border-indigo-200/60 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500 text-white rounded-xl">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Telekomunikasi & Data (TELKOM)
                    </h4>
                    <p className="text-xs text-slate-500">Perhitungan Fihak Ketiga (PFK) Telkom</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-200 text-indigo-900">
                  {summary.telkomCount} Tagihan
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Total Nominal Tagihan TELKOM:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(summary.telkomNominal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-rose-600 font-semibold">Tagihan Belum Diajukan SPM:</span>
                  <span className="font-mono font-bold text-rose-600">{Number.isFinite(summary.telkomBelumCount) ? summary.telkomBelumCount : 0} Tagihan</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-600 font-semibold">Sudah Selesai SP2D:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {Math.max(0, (Number.isFinite(summary.telkomCount) ? summary.telkomCount : 0) - (Number.isFinite(summary.telkomBelumCount) ? summary.telkomBelumCount : 0))} Tagihan
                  </span>
                </div>

                <div className="pt-3 border-t border-indigo-200/60 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    5 Tagihan Telkom Terbesar:
                  </div>
                  <div className="space-y-1.5">
                    {effectiveRecords
                      .filter(r => r.jenisLayanan === 'TELKOM')
                      .sort((a, b) => (b.nilaiTagihan || 0) - (a.nilaiTagihan || 0))
                      .slice(0, 5)
                      .map((r, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                          <div className="truncate max-w-[220px]">
                            <span className="font-bold text-indigo-600">{r.kodeSatker}</span> - {r.namaSatker}
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{formatRupiah(r.nilaiTagihan)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination Bar */}
        {activeView !== 'analisis' && (
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              {pageSize <= 0
                ? `Menampilkan semua (${activeView === 'satker' ? filteredSatkerList.length : filteredInvoices.length} data)`
                : `Menampilkan ${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, activeView === 'satker' ? filteredSatkerList.length : filteredInvoices.length)} dari ${activeView === 'satker' ? filteredSatkerList.length : filteredInvoices.length} data`}
            </span>

            {pageSize > 0 && activeTotalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className={`px-3 py-1.5 rounded-lg font-semibold ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900'}`}>
                  {currentPage} / {activeTotalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(activeTotalPages, p + 1))}
                  disabled={currentPage === activeTotalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
