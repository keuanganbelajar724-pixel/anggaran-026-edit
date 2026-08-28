import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Zap,
  Phone,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Layers,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { SPMPPPRecord, MasterSatker } from '../types';
import { exportSPMPPPToExcel, downloadSPMPPPTemplate } from '../utils/modularExcelProcessors';

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

export const SPMPPPDashboard: React.FC<SPMPPPDashboardProps> = ({
  spmPppRecords = [],
  spmRecords = [],
  masterSatkers = [],
  satkers = [],
  isDark = false,
  isAdminAuthenticated = false,
  onSetIsAdminAuthenticated,
  onUpdateSPMPPP,
  onUpdateSPMRecords,
  onGoToUpload,
  onGoToAdmin
}) => {
  const [activeView, setActiveView] = useState<'satker' | 'rincian' | 'analisis'>('satker');
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<'ALL' | 'PLN' | 'TELKOM'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BELUM' | 'PROSES' | 'SELESAI'>('ALL');
  const [satkerActiveFilter, setSatkerActiveFilter] = useState<'ALL' | 'AKTIF' | 'NONAKTIF'>('ALL');
  const [selectedSatker, setSelectedSatker] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [copiedText, setCopiedText] = useState(false);

  const updateHandler = onUpdateSPMRecords || onUpdateSPMPPP;
  const navigateToUpload = onGoToUpload || onGoToAdmin;

  const rawRecords = spmPppRecords.length > 0 ? spmPppRecords : spmRecords;
  const effectiveRecords = useMemo(() => {
    return Array.isArray(rawRecords) ? rawRecords : [];
  }, [rawRecords]);

  // Quick toggle status for single record
  const handleToggleRecordStatus = (recordId: string) => {
    if (!updateHandler) return;
    const updated = effectiveRecords.map(r => {
      if (r.id === recordId) {
        const isCurrentlyBelum = !r.statusSpm || r.statusSpm.toLowerCase().includes('belum') || (!r.noSpm && !r.noSp2d);
        if (isCurrentlyBelum) {
          const nowStr = new Date().toISOString().split('T')[0];
          return {
            ...r,
            statusSpm: 'Selesai SP2D',
            noSpm: r.noSpm || `SPM-${r.kodeSatker}-${nowStr}`,
            noSp2d: r.noSp2d || `SP2D-${r.kodeSatker}-${nowStr}`
          };
        } else {
          return {
            ...r,
            statusSpm: 'Belum Terbit SPM',
            noSpm: '',
            noSp2d: ''
          };
        }
      }
      return r;
    });
    updateHandler(updated);
  };

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

    const belumRecords = effectiveRecords.filter(
      r => !r.statusSpm || r.statusSpm.toLowerCase().includes('belum') || (!r.noSpm && !r.noSp2d)
    );
    const belumCount = belumRecords.length;
    const belumNominal = belumRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);

    const selesaiRecords = effectiveRecords.filter(
      r => r.noSp2d || (r.statusSpm && r.statusSpm.toLowerCase().includes('sp2d'))
    );
    const selesaiCount = selesaiRecords.length;
    const selesaiNominal = selesaiRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);

    const prosesRecords = effectiveRecords.filter(
      r => !belumRecords.includes(r) && !selesaiRecords.includes(r)
    );
    const prosesCount = prosesRecords.length;
    const prosesNominal = prosesRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);

    // Service Breakdown
    const plnRecords = effectiveRecords.filter(r => r.jenisLayanan === 'PLN');
    const plnCount = plnRecords.length;
    const plnNominal = plnRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);
    const plnBelumCount = plnRecords.filter(r => !r.statusSpm || r.statusSpm.toLowerCase().includes('belum') || (!r.noSpm && !r.noSp2d)).length;

    const telkomRecords = effectiveRecords.filter(r => r.jenisLayanan === 'TELKOM');
    const telkomCount = telkomRecords.length;
    const telkomNominal = telkomRecords.reduce((acc, r) => acc + (Number(r.nilaiTagihan) || 0), 0);
    const telkomBelumCount = telkomRecords.filter(r => !r.statusSpm || r.statusSpm.toLowerCase().includes('belum') || (!r.noSpm && !r.noSp2d)).length;

    const uniqueSatkers = new Set(effectiveRecords.map(r => r.kodeSatker)).size;
    const uniqueSatkerBelum = new Set(belumRecords.map(r => r.kodeSatker)).size;

    return {
      totalCount,
      totalNominal,
      belumCount,
      belumNominal,
      selesaiCount,
      selesaiNominal,
      prosesCount,
      prosesNominal,
      plnCount,
      plnNominal,
      plnBelumCount,
      telkomCount,
      telkomNominal,
      telkomBelumCount,
      uniqueSatkers,
      uniqueSatkerBelum,
      persenBelum: totalCount > 0 ? ((belumCount / totalCount) * 100).toFixed(1) : '0',
      persenSelesai: totalCount > 0 ? ((selesaiCount / totalCount) * 100).toFixed(1) : '0'
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
      selesaiCount: number;
      selesaiNominal: number;
      prosesCount: number;
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
        selesaiCount: 0,
        selesaiNominal: 0,
        prosesCount: 0,
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

      const isBelum = !r.statusSpm || r.statusSpm.toLowerCase().includes('belum') || (!r.noSpm && !r.noSp2d);
      const isSelesai = r.noSp2d || (r.statusSpm && r.statusSpm.toLowerCase().includes('sp2d'));

      if (isBelum) {
        existing.belumCount += 1;
        existing.belumNominal += (r.nilaiTagihan || 0);
      } else if (isSelesai) {
        existing.selesaiCount += 1;
        existing.selesaiNominal += (r.nilaiTagihan || 0);
      } else {
        existing.prosesCount += 1;
      }

      map.set(r.kodeSatker, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.belumNominal - a.belumNominal || b.totalNominal - a.totalNominal);
  }, [effectiveRecords, masterMap]);

  // Filtered Satker List
  const filteredSatkerList = useMemo(() => {
    return satkerAggregatedList.filter(s => {
      if (statusFilter === 'BELUM' && s.belumCount === 0) return false;
      if (statusFilter === 'SELESAI' && s.belumCount > 0) return false;

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

      const isBelum = !r.statusSpm || r.statusSpm.toLowerCase().includes('belum') || (!r.noSpm && !r.noSp2d);
      const isSelesai = r.noSp2d || (r.statusSpm && r.statusSpm.toLowerCase().includes('sp2d'));
      const isProses = !isBelum && !isSelesai;

      if (statusFilter === 'BELUM' && !isBelum) return false;
      if (statusFilter === 'SELESAI' && !isSelesai) return false;
      if (statusFilter === 'PROSES' && !isProses) return false;

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
    const start = (currentPage - 1) * pageSize;
    return filteredSatkerList.slice(start, start + pageSize);
  }, [filteredSatkerList, currentPage, pageSize]);

  // Pagination for Invoices
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  const activeTotalPages = activeView === 'satker' 
    ? Math.ceil(filteredSatkerList.length / pageSize) || 1 
    : Math.ceil(filteredInvoices.length / pageSize) || 1;

  // Generate WhatsApp Reminder Broadcast Text
  const handleCopyBroadcast = () => {
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const topSatkers = satkerAggregatedList
      .filter(s => s.belumCount > 0)
      .slice(0, 10)
      .map((s, idx) => `${idx + 1}. [${s.kodeSatker}] ${s.namaSatker} (${s.belumCount} tagihan - ${formatRupiah(s.belumNominal)})`)
      .join('\n');

    const text = `📢 *PENGINGAT PENGAJUAN SPM PPP (PLN & TELKOM)*
📅 Tanggal: ${dateStr}

Yth. Bapak/Ibu KPA/PPK/PPSPM Satuan Kerja Mitra KPPN,

Berdasarkan monitoring tagihan langganan daya & jasa (Perhitungan Pihak Ketiga) yang terdaftar:
• Total Tagihan Belum SPM: *${summary.belumCount} Tagihan* (${formatRupiah(summary.belumNominal)})
• Satker Belum Mengajukan: *${summary.uniqueSatkerBelum} Satker*

Daftar Satker dengan tagihan belum SPM terbanyak:
${topSatkers}

Mohon bantuan Satker terkait untuk segera menerbitkan SPP dan mengajukan SPM PPP ke KPPN agar terhindar dari keterlambatan pembayaran dan denda layanan.

Terima kasih atas kerja sama dan sinergi yang baik.
*KPPN - Layanan Perbendaharaan Prima*`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-amber-200'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleCopyBroadcast}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all shadow-sm cursor-pointer"
              title="Salin ringkasan pesan WhatsApp untuk broadcast grup satker"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-700" />}
              {copiedText ? 'Teks Tersalin!' : 'Salin Teks Broadcast WA'}
            </button>

            <button
              onClick={() => exportSPMPPPToExcel(effectiveRecords, 'Daftar_Satker_Belum_SPM_PPP.xlsx')}
              disabled={effectiveRecords.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              Unduh Excel ({effectiveRecords.length})
            </button>

            {navigateToUpload && (
              <button
                onClick={navigateToUpload}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-md shadow-amber-600/20 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                Upload Excel
              </button>
            )}
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

        {/* Belum Mengajukan SPM - CRITICAL */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-800/90 border-rose-900/60' : 'bg-white border-rose-200 shadow-sm ring-2 ring-rose-500/20'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Belum Mengajukan SPM
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
              ⚠️ {summary.uniqueSatkerBelum} Satker perlu percepatan pengajuan
            </div>
          </div>
        </div>

        {/* Listrik (PLN) */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
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
              {summary.plnBelumCount} tagihan PLN belum terbit SPM
            </div>
          </div>
        </div>

        {/* Telepon / Internet (TELKOM) */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
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
              {summary.telkomBelumCount} tagihan Telkom belum terbit SPM
            </div>
          </div>
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

          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                statusFilter === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Semua Status
            </button>
            <button
              onClick={() => { setStatusFilter('BELUM'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                statusFilter === 'BELUM' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Belum SPM ({summary.belumCount})
            </button>
            <button
              onClick={() => { setStatusFilter('SELESAI'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                statusFilter === 'SELESAI' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              SP2D ({summary.selesaiCount})
            </button>
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
              PLN
            </button>
            <button
              onClick={() => { setServiceFilter('TELKOM'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                serviceFilter === 'TELKOM' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              TELKOM
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
            </select>
          </div>
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
                  <th className="px-3.5 py-3 text-right">Belum SPM</th>
                  <th className="px-3.5 py-3 text-center">Status Progres</th>
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
                    const rank = (currentPage - 1) * pageSize + idx + 1;
                    const isAllDone = s.belumCount === 0;

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
                          {isAllDone ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Selesai Terbit SPM
                            </span>
                          ) : s.selesaiCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              <Clock className="w-3 h-3" />
                              Sebagian ({s.selesaiCount}/{s.totalTagihan})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              <AlertTriangle className="w-3 h-3" />
                              Belum Mengajukan SPM
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2: RINCIAN SELURUH TAGIHAN */}
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
                  <th className="px-3 py-3">No SPM</th>
                  <th className="px-3 py-3">No SP2D</th>
                  <th className="px-3 py-3">Status SPM</th>
                  <th className="px-3 py-3 text-center">Aksi / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      Tidak ada rincian tagihan yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((r, idx) => {
                    const isBelum = !r.statusSpm || r.statusSpm.toLowerCase().includes('belum') || (!r.noSpm && !r.noSp2d);
                    const isSelesai = r.noSp2d || (r.statusSpm && r.statusSpm.toLowerCase().includes('sp2d'));

                    return (
                      <tr
                        key={r.id}
                        className={`${isBelum ? (isDark ? 'bg-rose-950/10' : 'bg-rose-50/20') : ''} ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} transition-colors`}
                      >
                        <td className="px-3 py-2.5 text-slate-400 font-mono">
                          {(currentPage - 1) * pageSize + idx + 1}
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
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {r.noSpm || '-'}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {r.noSp2d || '-'}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isBelum
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : isSelesai
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {r.statusSpm || (isBelum ? 'Belum Mengajukan' : 'Proses')}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleRecordStatus(r.id)}
                            title={isBelum ? 'Klik untuk tandai sudah selesai/terbit SPM' : 'Klik untuk ubah kembali ke Belum SPM'}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                              isBelum
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {isBelum ? '✓ Tandai SP2D' : '↺ Reset Belum'}
                          </button>
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
                  <span className="font-mono font-bold text-rose-600">{summary.plnBelumCount} Tagihan</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-600 font-semibold">Sudah Selesai SP2D:</span>
                  <span className="font-mono font-bold text-emerald-600">{summary.plnCount - summary.plnBelumCount} Tagihan</span>
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
                  <span className="font-mono font-bold text-rose-600">{summary.telkomBelumCount} Tagihan</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-600 font-semibold">Sudah Selesai SP2D:</span>
                  <span className="font-mono font-bold text-emerald-600">{summary.telkomCount - summary.telkomBelumCount} Tagihan</span>
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
        {activeView !== 'analisis' && activeTotalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              Halaman {currentPage} dari {activeTotalPages}
            </span>

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
          </div>
        )}
      </div>
    </div>
  );
};
