import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  Lock,
  Download,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Building2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Eye,
  Info,
  X,
  Layers,
  Coins,
  SlidersHorizontal,
  ArrowUpDown,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { DeviasiHal3Record, MasterSatker, SatkerIKPA } from '../types';
import { PERIODE_LIST, INITIAL_DEVIASI_HAL3_DATA } from '../data/initialDeviasiHal3Data';
import { hydrateDeviasiHal3FromFirestore } from '../utils/firebaseStorageOptimizer';
import * as XLSX from 'xlsx';

interface DeviasiHal3SatkerPublicViewProps {
  deviasiRecords: DeviasiHal3Record[];
  masterSatkers?: MasterSatker[];
  satkers?: SatkerIKPA[];
  isDark?: boolean;
  isAdminAuthenticated?: boolean;
  satkerDisplayMonth?: string;
  satkerMonthStrictLock?: boolean;
  onOpenAdminAuth?: () => void;
  onSwitchToInternal?: () => void;
  onSetSatkerDisplayMonth?: (month: string) => void;
}

type TabBelanjaMode = 'MATRIKS' | '51' | '52' | '53' | '57';
type SeverityFilterType =
  | 'ALL'
  | 'DEVIASI_ADA'      // Ada Deviasi Nominal (Rp > 0)
  | 'DEVIASI_NIHIL'    // Nihil Deviasi (Rp 0 / Sesuai RPD)
  | 'DEVIASI_51'       // Ada Deviasi 51 Pegawai (Rp > 0)
  | 'DEVIASI_52'       // Ada Deviasi 52 Barang (Rp > 0)
  | 'DEVIASI_53'       // Ada Deviasi 53 Modal (Rp > 0)
  | 'DEVIASI_57';      // Ada Deviasi 57 Bansos (Rp > 0)

export const DeviasiHal3SatkerPublicView: React.FC<DeviasiHal3SatkerPublicViewProps> = ({
  deviasiRecords: rawDeviasiRecords = [],
  masterSatkers = [],
  satkers = [],
  isDark = false,
  isAdminAuthenticated = false,
  satkerDisplayMonth,
  satkerMonthStrictLock,
  onOpenAdminAuth,
  onSwitchToInternal,
  onSetSatkerDisplayMonth
}) => {
  // Ensure robust records: fallback to initial if empty, hydrate if compacted
  const deviasiRecords = useMemo(() => {
    const list = Array.isArray(rawDeviasiRecords) && rawDeviasiRecords.length > 0
      ? rawDeviasiRecords
      : INITIAL_DEVIASI_HAL3_DATA;
    
    const isCompacted = list.some((r: any) => (r.k && !r.kodeSatker) || (r.p !== undefined && r.periodeAngka === undefined));
    if (isCompacted) {
      return hydrateDeviasiHal3FromFirestore(list);
    }
    return list;
  }, [rawDeviasiRecords]);

  // Configured display month from props or localStorage (default to '9' as requested)
  const initialConfiguredMonth = satkerDisplayMonth || (typeof localStorage !== 'undefined' && localStorage.getItem('kppn_deviasi_satker_month')) || '9';
  const isStrictLocked = satkerMonthStrictLock !== undefined 
    ? satkerMonthStrictLock 
    : (typeof localStorage !== 'undefined' ? localStorage.getItem('kppn_deviasi_satker_month_lock') !== 'false' : true);

  // State Filter & Search
  const [selectedPeriode, setSelectedPeriode] = useState<string>(initialConfiguredMonth);
  const [selectedKl, setSelectedKl] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityFilterType>('ALL');
  const [activeTab, setActiveTab] = useState<TabBelanjaMode>('MATRIKS');
  const [sortField, setSortField] = useState<'deviasiRp' | 'kodeSatker' | 'namaSatker' | 'periodeAngka'>('deviasiRp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Table Text Size / Display Density ('standard' or 'large') - Default is now 'standard' as requested!
  const [tableTextSize, setTableTextSize] = useState<'standard' | 'large'>('standard');

  // Detail Modal
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<DeviasiHal3Record | null>(null);

  // Sync if prop satkerDisplayMonth changes
  useEffect(() => {
    if (satkerDisplayMonth) {
      setSelectedPeriode(satkerDisplayMonth);
      setCurrentPage(1);
    }
  }, [satkerDisplayMonth]);

  // Effective period for filtering
  const effectivePeriode = isStrictLocked && initialConfiguredMonth !== 'ALL' ? initialConfiguredMonth : selectedPeriode;

  // Format rupiah helper
  const formatRupiah = (num: number) => {
    return 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');
  };

  // Distinct K/L list
  const klList = useMemo(() => {
    const set = new Set<string>();
    deviasiRecords.forEach(r => {
      if (r.kementerianLembaga && r.kementerianLembaga.trim()) {
        set.add(r.kementerianLembaga.trim());
      }
    });
    return Array.from(set).sort();
  }, [deviasiRecords]);

  // Filter Data
  const filteredRecords = useMemo(() => {
    return deviasiRecords.filter(r => {
      // Periode Filter: focus strictly on effective period
      if (effectivePeriode !== 'ALL' && String(r.periodeAngka) !== effectivePeriode) {
        return false;
      }

      // K/L Filter
      if (selectedKl !== 'ALL' && r.kementerianLembaga !== selectedKl) {
        return false;
      }

      // Severity / Deviasi Nominal Filter
      if (selectedSeverity !== 'ALL') {
        const d51 = r.rincianJenisBelanja?.belanja51?.deviasiNominal || 0;
        const d52 = r.rincianJenisBelanja?.belanja52?.deviasiNominal || 0;
        const d53 = r.rincianJenisBelanja?.belanja53?.deviasiNominal || 0;
        const d57 = r.rincianJenisBelanja?.belanja57?.deviasiNominal || 0;
        const totalDev = r.deviasiNominalTotal || 0;

        if (selectedSeverity === 'DEVIASI_ADA') {
          if (totalDev <= 0) return false;
        } else if (selectedSeverity === 'DEVIASI_NIHIL') {
          if (totalDev > 0) return false;
        } else if (selectedSeverity === 'DEVIASI_51') {
          if (d51 <= 0) return false;
        } else if (selectedSeverity === 'DEVIASI_52') {
          if (d52 <= 0) return false;
        } else if (selectedSeverity === 'DEVIASI_53') {
          if (d53 <= 0) return false;
        } else if (selectedSeverity === 'DEVIASI_57') {
          if (d57 <= 0) return false;
        }
      }

      // Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchKode = (r.kodeSatker || '').toLowerCase().includes(q);
        const matchNama = (r.namaSatker || '').toLowerCase().includes(q);
        const matchKppn = (r.kodeKppn || '').toLowerCase().includes(q);
        const matchKl = (r.kementerianLembaga || '').toLowerCase().includes(q);
        if (!matchKode && !matchNama && !matchKppn && !matchKl) return false;
      }

      return true;
    });
  }, [deviasiRecords, effectivePeriode, selectedKl, selectedSeverity, searchTerm]);

  // Sorting
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];
    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortField === 'deviasiRp') {
        if (activeTab === '51') {
          valA = a.rincianJenisBelanja?.belanja51?.deviasiNominal || 0;
          valB = b.rincianJenisBelanja?.belanja51?.deviasiNominal || 0;
        } else if (activeTab === '52') {
          valA = a.rincianJenisBelanja?.belanja52?.deviasiNominal || 0;
          valB = b.rincianJenisBelanja?.belanja52?.deviasiNominal || 0;
        } else if (activeTab === '53') {
          valA = a.rincianJenisBelanja?.belanja53?.deviasiNominal || 0;
          valB = b.rincianJenisBelanja?.belanja53?.deviasiNominal || 0;
        } else if (activeTab === '57') {
          valA = a.rincianJenisBelanja?.belanja57?.deviasiNominal || 0;
          valB = b.rincianJenisBelanja?.belanja57?.deviasiNominal || 0;
        } else {
          valA = a.deviasiNominalTotal || 0;
          valB = b.deviasiNominalTotal || 0;
        }
      } else if (sortField === 'kodeSatker') {
        valA = a.kodeSatker || '';
        valB = b.kodeSatker || '';
      } else if (sortField === 'namaSatker') {
        valA = a.namaSatker || '';
        valB = b.namaSatker || '';
      } else if (sortField === 'periodeAngka') {
        valA = a.periodeAngka || 0;
        valB = b.periodeAngka || 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredRecords, sortField, sortDirection, activeTab]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / (pageSize > 0 ? pageSize : 1));
  const paginatedRecords = useMemo(() => {
    if (pageSize === -1) return sortedRecords;
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  // Calculate High-level Public Summary Metrics (Murni Fokus Nominal Deviasi Rupiah)
  const publicMetrics = useMemo(() => {
    let totalDeviasiNominal = 0;
    let countNihil = 0;
    let countAdaDeviasi = 0;

    // Sub-accounts aggregates nominal
    let dev51 = 0;
    let dev52 = 0;
    let dev53 = 0;
    let dev57 = 0;

    filteredRecords.forEach(r => {
      const tot = r.deviasiNominalTotal || 0;
      totalDeviasiNominal += tot;

      if (tot === 0) {
        countNihil++;
      } else {
        countAdaDeviasi++;
      }

      // 51
      const b51 = r.rincianJenisBelanja?.belanja51;
      if (b51) {
        dev51 += b51.deviasiNominal || 0;
      }

      // 52
      const b52 = r.rincianJenisBelanja?.belanja52;
      if (b52) {
        dev52 += b52.deviasiNominal || 0;
      }

      // 53
      const b53 = r.rincianJenisBelanja?.belanja53;
      if (b53) {
        dev53 += b53.deviasiNominal || 0;
      }

      // 57
      const b57 = r.rincianJenisBelanja?.belanja57;
      if (b57) {
        dev57 += b57.deviasiNominal || 0;
      }
    });

    const totalRows = filteredRecords.length;

    return {
      totalRows,
      totalDeviasiNominal,
      countNihil,
      countAdaDeviasi,
      belanja51: { dev: dev51 },
      belanja52: { dev: dev52 },
      belanja53: { dev: dev53 },
      belanja57: { dev: dev57 }
    };
  }, [filteredRecords]);

  // Chart Data: Total Deviasi Nominal per Jenis Belanja (Juta Rupiah)
  const chartDataNominal = useMemo(() => {
    return [
      {
        name: '51 Pegawai',
        deviasiJuta: Number(((publicMetrics.belanja51.dev || 0) / 1_000_000).toFixed(1)),
        nominalRp: publicMetrics.belanja51.dev || 0,
        fill: '#0284c7'
      },
      {
        name: '52 Barang',
        deviasiJuta: Number(((publicMetrics.belanja52.dev || 0) / 1_000_000).toFixed(1)),
        nominalRp: publicMetrics.belanja52.dev || 0,
        fill: '#d97706'
      },
      {
        name: '53 Modal',
        deviasiJuta: Number(((publicMetrics.belanja53.dev || 0) / 1_000_000).toFixed(1)),
        nominalRp: publicMetrics.belanja53.dev || 0,
        fill: '#7c3aed'
      },
      {
        name: '57 Bansos',
        deviasiJuta: Number(((publicMetrics.belanja57.dev || 0) / 1_000_000).toFixed(1)),
        nominalRp: publicMetrics.belanja57.dev || 0,
        fill: '#059669'
      }
    ];
  }, [publicMetrics]);

  // Handle Safe Satker Export (Excludes RPD & Realisasi, Focuses purely on Nominal Deviasi)
  const handleExportSatker = () => {
    const dataToExport = filteredRecords.map((r, idx) => {
      return {
        'No': idx + 1,
        'Kode Satker': r.kodeSatker,
        'Nama Satker': r.namaSatker,
        'Kementerian / Lembaga': r.kementerianLembaga || '-',
        'Bulan': r.periodeAngka ? String(r.periodeAngka).padStart(2, '0') : '-',
        'Deviasi 51 Pegawai (Rp)': r.rincianJenisBelanja?.belanja51?.deviasiNominal || 0,
        'Deviasi 52 Barang (Rp)': r.rincianJenisBelanja?.belanja52?.deviasiNominal || 0,
        'Deviasi 53 Modal (Rp)': r.rincianJenisBelanja?.belanja53?.deviasiNominal || 0,
        'Deviasi 57 Bansos (Rp)': r.rincianJenisBelanja?.belanja57?.deviasiNominal || 0,
        'Total Deviasi (Rp)': r.deviasiNominalTotal || 0,
        'Status': (r.deviasiNominalTotal || 0) === 0 ? 'Nihil / Sesuai RPD' : 'Terdapat Deviasi'
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Deviasi Nominal Satker');
    XLSX.writeFile(wb, `Monitoring_Deviasi_Nominal_Satker_${selectedPeriode === 'ALL' ? 'Semua_Periode' : `Periode_${selectedPeriode}`}.xlsx`);
  };

  const handleHeaderSort = (field: 'deviasiRp' | 'kodeSatker' | 'namaSatker' | 'periodeAngka') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* HEADER BANNER KHUSUS SATKER */}
      <div className={`p-6 rounded-3xl border transition-all shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300/60">
                <Shield className="w-3.5 h-3.5" />
                Portal Satker: Deviasi Halaman III DIPA (Aman &amp; Terlindungi)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300/70 dark:border-indigo-800">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Periode: {effectivePeriode === 'ALL' ? 'Semua Periode' : `Bulan ${effectivePeriode.padStart(2, '0')} (${PERIODE_LIST.find(p => String(p.angka) === effectivePeriode)?.bulan || ''})`}
              </span>
              {isStrictLocked && effectivePeriode !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60">
                  🔒 Ditetapkan oleh Admin KPPN
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Monitoring Deviasi &amp; Kepatuhan RPD Halaman III DIPA
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              Tampilan khusus satker yang berfokus murni pada <strong className="text-slate-800 dark:text-slate-200">deviasi (selisih) dan persentase deviasi bulan berjalan</strong> per jenis belanja (51 Pegawai, 52 Barang, 53 Modal, dan 57 Bansos). 
              Untuk mencegah penyalahgunaan data antar-satker, <span className="font-bold text-emerald-600 dark:text-emerald-400">nominal Rencana RPD dan Penyerapan (Realisasi) disembunyikan</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportSatker}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              title="Unduh data deviasi dan % deviasi satker dalam format Excel"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel Satker</span>
            </button>

            {isAdminAuthenticated ? (
              onSwitchToInternal && (
                <button
                  type="button"
                  onClick={onSwitchToInternal}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                  title="Kembali ke tampilan lengkap Internal KPPN"
                >
                  <span>🏛️ Kembali ke Internal KPPN</span>
                </button>
              )
            ) : onOpenAdminAuth ? (
              <button
                type="button"
                onClick={onOpenAdminAuth}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Khusus Admin KPPN Semarang I - Autentikasi PIN/Password"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Akses Admin KPPN</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* KHUSUS ADMIN SAAT TESTING/PRATINJAU TAMPILAN SATKER */}
      {isAdminAuthenticated && (
        <div className={`p-4 rounded-3xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          isDark ? 'bg-indigo-950/40 border-indigo-800 text-indigo-200' : 'bg-indigo-50/90 border-indigo-200 text-indigo-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-indigo-600 text-white shadow-xs shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Pratinjau Admin: Tampilan Satker
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200/80 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200">
                  Bulan {effectivePeriode === 'ALL' ? 'Semua' : effectivePeriode.padStart(2, '0')}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Satker saat ini melihat data: <strong className="text-slate-900 dark:text-white">{effectivePeriode === 'ALL' ? 'Semua Periode Bulan' : `Bulan ${effectivePeriode.padStart(2, '0')} (${PERIODE_LIST.find(p => String(p.angka) === effectivePeriode)?.bulan || ''})`}</strong>. {isStrictLocked ? '(Terkunci hanya bulan ini agar satker tidak bingung)' : '(Satker bebas pilih bulan)'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Set Periode Tayang:</span>
            <select
              value={effectivePeriode}
              onChange={(e) => {
                if (onSetSatkerDisplayMonth) {
                  onSetSatkerDisplayMonth(e.target.value);
                } else if (typeof localStorage !== 'undefined') {
                  localStorage.setItem('kppn_deviasi_satker_month', e.target.value);
                }
                setSelectedPeriode(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1.5 px-3 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">Semua Periode (01-12)</option>
              {PERIODE_LIST.map(p => (
                <option key={p.angka} value={String(p.angka)}>
                  {p.label} {String(p.angka) === '9' ? '⭐ (Bulan 09)' : ''}
                </option>
              ))}
            </select>
            {onSwitchToInternal && (
              <button
                type="button"
                onClick={onSwitchToInternal}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                🏛️ Kembali ke Internal KPPN
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4 CARDS KEPATUHAN DEVIASI NOMINAL BULAN BERJALAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Deviasi Nominal */}
        <div className={`p-5 rounded-3xl border shadow-xs space-y-2 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Total Deviasi Nominal
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white truncate">
            {formatRupiah(publicMetrics.totalDeviasiNominal)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total selisih nominal |RPD - Realisasi| seluruh satker
          </p>
        </div>

        {/* Card 2: Satker Tepat Sesuai RPD (Nihil Deviasi / Rp 0) */}
        <div className={`p-5 rounded-3xl border shadow-xs space-y-2 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Tepat Sesuai RPD (Nihil)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {publicMetrics.countNihil} <span className="text-xs font-medium text-slate-500">Satker</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {publicMetrics.totalRows > 0 ? ((publicMetrics.countNihil / publicMetrics.totalRows) * 100).toFixed(1) : 0}% satker nihil selisih (Deviasi Rp 0)
          </p>
        </div>

        {/* Card 3: Satker Terdapat Deviasi Nominal */}
        <div className={`p-5 rounded-3xl border shadow-xs space-y-2 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Terdapat Deviasi
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            {publicMetrics.countAdaDeviasi} <span className="text-xs font-medium text-slate-500">Satker</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {publicMetrics.totalRows > 0 ? ((publicMetrics.countAdaDeviasi / publicMetrics.totalRows) * 100).toFixed(1) : 0}% satker memiliki deviasi nominal (&gt; Rp 0)
          </p>
        </div>

        {/* Card 4: Total Satker Dievaluasi */}
        <div className={`p-5 rounded-3xl border shadow-xs space-y-2 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Total Satker Evaluasi
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {publicMetrics.totalRows} <span className="text-xs font-medium text-slate-500">Satker</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Periode Bulan {effectivePeriode === 'ALL' ? 'Semua Periode' : effectivePeriode.padStart(2, '0')}
          </p>
        </div>
      </div>

      {/* VISUALISASI DEVIASI NOMINAL PER JENIS BELANJA (MURNI RUPIAH) */}
      <div className={`p-6 rounded-3xl border shadow-xs space-y-5 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Deviasi Nominal per Jenis Belanja (Rupiah)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rincian total selisih nominal |RPD - Realisasi| pada Akun 51 Pegawai, 52 Barang, 53 Modal, dan 57 Bansos.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Fokus Deviasi Nominal (Rp)
          </span>
        </div>

        {/* 4 Mini Cards Jenis Belanja with Colorful Accents & Large Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 51 Pegawai - Sky Accent */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark 
              ? 'bg-sky-950/20 border-sky-800/50 hover:border-sky-700' 
              : 'bg-sky-50/70 border-sky-200 hover:border-sky-300'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-sky-800 dark:text-sky-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                51 Pegawai
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-sky-100 text-sky-900 dark:bg-sky-900 dark:text-sky-200 border border-sky-200 dark:border-sky-800">
                Akun 51
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-sky-900 dark:text-sky-100 truncate mt-1">
              {formatRupiah(publicMetrics.belanja51.dev)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-sky-200/60 dark:border-sky-800/40">
              Total Deviasi Belanja Pegawai
            </div>
          </div>

          {/* 52 Barang - Amber Accent */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark 
              ? 'bg-amber-950/20 border-amber-800/50 hover:border-amber-700' 
              : 'bg-amber-50/70 border-amber-200 hover:border-amber-300'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                52 Barang
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                Akun 52
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-amber-900 dark:text-amber-100 truncate mt-1">
              {formatRupiah(publicMetrics.belanja52.dev)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
              Total Deviasi Belanja Barang
            </div>
          </div>

          {/* 53 Modal - Purple Accent */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark 
              ? 'bg-purple-950/20 border-purple-800/50 hover:border-purple-700' 
              : 'bg-purple-50/70 border-purple-200 hover:border-purple-300'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-purple-800 dark:text-purple-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                53 Modal
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                Akun 53
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-purple-900 dark:text-purple-100 truncate mt-1">
              {formatRupiah(publicMetrics.belanja53.dev)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-purple-200/60 dark:border-purple-800/40">
              Total Deviasi Belanja Modal
            </div>
          </div>

          {/* 57 Bansos - Emerald Accent */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark 
              ? 'bg-emerald-950/20 border-emerald-800/50 hover:border-emerald-700' 
              : 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                57 Bansos
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                Akun 57
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-emerald-900 dark:text-emerald-100 truncate mt-1">
              {formatRupiah(publicMetrics.belanja57.dev)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
              Total Deviasi Belanja Bansos
            </div>
          </div>
        </div>

        {/* Bar Chart Deviasi Nominal (Juta Rupiah) */}
        <div className="h-56 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartDataNominal} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
              <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
              <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} unit=" Jt" />
              <RechartsTooltip
                formatter={(val: any, name: any, item: any) => [formatRupiah(item?.payload?.nominalRp || 0), 'Total Deviasi Nominal']}
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="deviasiJuta" name="Deviasi Nominal (Juta Rp)" radius={[8, 8, 0, 0]}>
                {chartDataNominal.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FILTER & KONTROL TABEL SATKER */}
      <div className={`p-5 rounded-3xl border shadow-xs space-y-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Tab Selection dengan Aksen Warna Tiap Akun Belanja */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('MATRIKS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'MATRIKS'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-200 dark:border-indigo-800/70'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📋</span>
            <span>Matriks Deviasi (51, 52, 53, 57)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('51')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === '51'
                ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 shadow-sm border border-sky-300 dark:border-sky-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <span>51 Pegawai</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('52')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === '52'
                ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 shadow-sm border border-amber-300 dark:border-amber-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>52 Barang</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('53')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === '53'
                ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 shadow-sm border border-purple-300 dark:border-purple-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span>53 Modal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('57')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === '57'
                ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 shadow-sm border border-teal-300 dark:border-teal-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
            <span>57 Bansos</span>
          </button>
        </div>

        {/* Filter Row: 4 Kolom Rapi & Bersih (Tanpa Klasifikasi) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode / nama satker..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Filter Status Deviasi */}
          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => {
                setSelectedSeverity(e.target.value as SeverityFilterType);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">🔍 Semua Status Deviasi</option>
              <option value="DEVIASI_ADA">⚠️ Terdapat Deviasi Nominal (&gt; Rp 0)</option>
              <option value="DEVIASI_NIHIL">✅ Tepat Sesuai RPD (Nihil / Rp 0)</option>
              <option value="DEVIASI_51">🏢 Deviasi 51 Pegawai (&gt; Rp 0)</option>
              <option value="DEVIASI_52">📦 Deviasi 52 Barang (&gt; Rp 0)</option>
              <option value="DEVIASI_53">🏗️ Deviasi 53 Modal (&gt; Rp 0)</option>
              <option value="DEVIASI_57">🤝 Deviasi 57 Bansos (&gt; Rp 0)</option>
            </select>
          </div>

          {/* Filter Periode Bulan */}
          {isStrictLocked && initialConfiguredMonth !== 'ALL' ? (
            <div className="relative">
              <div className="w-full py-2 px-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-semibold leading-tight">Periode Evaluasi:</span>
                    <span className="font-black">Bulan {initialConfiguredMonth.padStart(2, '0')} ({PERIODE_LIST.find(p => String(p.angka) === initialConfiguredMonth)?.bulan || ''})</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200/80 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 font-extrabold shrink-0 border border-indigo-300 dark:border-indigo-700">
                  🔒 Ditetapkan
                </span>
              </div>
            </div>
          ) : (
            <div>
              <select
                value={selectedPeriode}
                onChange={(e) => {
                  setSelectedPeriode(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2.5 px-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">📅 Semua Periode Bulan</option>
                {PERIODE_LIST.map(p => (
                  <option key={p.angka} value={String(p.angka)}>
                    {p.label} {String(p.angka) === initialConfiguredMonth ? '⭐ (Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter K/L */}
          <div>
            <select
              value={selectedKl}
              onChange={(e) => {
                setSelectedKl(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">🏛️ Semua K/L ({klList.length})</option>
              {klList.map(kl => (
                <option key={kl} value={kl}>{kl.slice(0, 24)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABEL MONITORING KHUSUS SATKER: MURNI DEVIASI NOMINAL (TANPA PERSENTASE MEMBINGUNGKAN) */}
      <div className={`rounded-3xl border shadow-md overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Tabel Kepatuhan Deviasi Halaman III DIPA Satker
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              {activeTab === 'MATRIKS'
                ? 'Matriks Deviasi Lengkap: Menampilkan Deviasi Nominal (Rp) Akun 51 Pegawai, 52 Barang, 53 Modal, dan 57 Bansos. Kolom nominal ditampilkan besar dan jelas tanpa persentase membingungkan.'
                : `Menampilkan Deviasi Nominal (Rp) untuk ${activeTab === '51' ? 'Belanja Pegawai (51)' : activeTab === '52' ? 'Belanja Barang (52)' : activeTab === '53' ? 'Belanja Modal (53)' : 'Belanja Bansos (57)'}. Kolom nominal luas dan mudah dipantau.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Toggle Ukuran Teks / Kepadatan Tabel */}
            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setTableTextSize('standard')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  tableTextSize === 'standard'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Tampilan teks ukuran standar"
              >
                Standar
              </button>
              <button
                type="button"
                onClick={() => setTableTextSize('large')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  tableTextSize === 'large'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Tampilan teks lebih besar, longgar dan mudah dibaca satker"
              >
                <span>🔍 Nyaman (Besar)</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Baris:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-1 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-xs"
              >
                <option value={10}>10 Baris</option>
                <option value={15}>15 Baris</option>
                <option value={25}>25 Baris</option>
                <option value={50}>50 Baris</option>
                <option value={-1}>Semua ({filteredRecords.length})</option>
              </select>
            </div>
          </div>
        </div>

        {/* PANDUAN WARNA & INDIKATOR TARGET (MEMUDAHKAN PEMAHAMAN SATKER) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">Aksen Akun:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-300 font-bold text-[11px] border border-sky-300 dark:border-sky-800">
              <span className="w-2 h-2 rounded-full bg-sky-600"></span> 51 Pegawai
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-300 font-bold text-[11px] border border-amber-300 dark:border-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span> 52 Barang
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-950 dark:bg-purple-950 dark:text-purple-300 font-bold text-[11px] border border-purple-300 dark:border-purple-800">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span> 53 Modal
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px] border border-emerald-300 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 57 Bansos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">Status Deviasi:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 font-black text-[11px] border border-emerald-300 dark:border-emerald-700 shadow-2xs">
              🟢 Sesuai RPD (Nihil / Rp 0)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-black text-[11px] border border-amber-300 dark:border-amber-700 shadow-2xs">
              ⚠️ Terdapat Deviasi (&gt; Rp 0)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'MATRIKS' ? (
            /* MATRIKS LENGKAP KHUSUS SATKER: MURNI FOKUS DEVIASI NOMINAL (RP) (TANPA PERSENTASE MEMBINGUNGKAN) */
            <table className="w-full text-left min-w-[1050px]">
              <thead className="text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th rowSpan={2} className="py-3 px-3 text-center w-12 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 text-xs font-black">
                    No
                  </th>
                  <th rowSpan={2} className="py-3 px-4 min-w-[280px] bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-black">
                    Satuan Kerja
                  </th>
                  <th rowSpan={2} className="py-3 px-2 text-center w-16 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 text-xs font-black">
                    Bln
                  </th>
                  
                  {/* Header Deviasi Nominal 4 Akun */}
                  <th colSpan={4} className="py-3.5 px-4 text-center bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white border-r border-slate-600 text-xs sm:text-sm font-black tracking-wide shadow-xs">
                    💰 DEVIASI NOMINAL PER JENIS BELANJA (RUPIAH)
                  </th>

                  {/* Total Deviasi Nominal */}
                  <th rowSpan={2} className="py-3 px-4 text-right min-w-[190px] bg-slate-800 dark:bg-slate-950 text-white font-black text-xs sm:text-sm tracking-wide border-r border-slate-700">
                    TOTAL DEVIASI (RP)
                  </th>

                  {/* Status */}
                  <th rowSpan={2} className="py-3 px-4 text-center min-w-[150px] bg-slate-800 dark:bg-slate-950 text-white font-black text-xs sm:text-sm tracking-wide">
                    STATUS
                  </th>
                </tr>
                <tr className="border-t border-slate-200 dark:border-slate-700 text-xs">
                  {/* Subheader Deviasi Rp per akun - Dibuat Lebar & Jelas */}
                  <th className="py-2.5 px-4 text-right bg-sky-200 text-sky-950 dark:bg-sky-900 dark:text-sky-100 font-black border-r border-sky-300 dark:border-sky-800 min-w-[150px]">
                    51 Pegawai
                  </th>
                  <th className="py-2.5 px-4 text-right bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100 font-black border-r border-amber-300 dark:border-amber-800 min-w-[150px]">
                    52 Barang
                  </th>
                  <th className="py-2.5 px-4 text-right bg-purple-200 text-purple-950 dark:bg-purple-900 dark:text-purple-100 font-black border-r border-purple-300 dark:border-purple-800 min-w-[150px]">
                    53 Modal
                  </th>
                  <th className="py-2.5 px-4 text-right bg-emerald-200 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-100 font-black border-r border-slate-400 dark:border-slate-600 min-w-[150px]">
                    57 Bansos
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-200 dark:divide-slate-800 ${
                tableTextSize === 'large' ? 'text-xs sm:text-[13px]' : 'text-xs'
              }`}>
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400 text-sm font-medium">
                      Tidak ada data yang cocok dengan kriteria filter Anda.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r, idx) => {
                    const globalIdx = (currentPage - 1) * (pageSize > 0 ? pageSize : 0) + idx + 1;
                    const totalDev = r.deviasiNominalTotal || 0;
                    const isNihil = totalDev === 0;

                    const dev51 = r.rincianJenisBelanja?.belanja51?.deviasiNominal || 0;
                    const dev52 = r.rincianJenisBelanja?.belanja52?.deviasiNominal || 0;
                    const dev53 = r.rincianJenisBelanja?.belanja53?.deviasiNominal || 0;
                    const dev57 = r.rincianJenisBelanja?.belanja57?.deviasiNominal || 0;

                    const pyClass = tableTextSize === 'large' ? 'py-4' : 'py-3';

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-blue-50/70 dark:hover:bg-slate-800/80 cursor-pointer transition-all group"
                        onClick={() => setSelectedRecordDetail(r)}
                      >
                        <td className={`${pyClass} px-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800`}>
                          {globalIdx}
                        </td>
                        <td className={`${pyClass} px-4 border-r border-slate-200 dark:border-slate-800`}>
                          <div className={`font-black text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${
                            tableTextSize === 'large' ? 'text-sm' : 'text-xs'
                          }`}>
                            {r.namaSatker}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {r.kodeSatker}
                            </span>
                            {r.kementerianLembaga && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px] font-medium">
                                {r.kementerianLembaga}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`${pyClass} px-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800`}>
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono font-black text-xs">
                            {String(r.periodeAngka || 1).padStart(2, '0')}
                          </span>
                        </td>

                        {/* Deviasi Nominal (Rp) Akun 51, 52, 53, 57 - Font Besar & Luas */}
                        <td className={`${pyClass} px-4 text-right font-mono font-bold bg-sky-50/70 dark:bg-sky-950/25 border-r border-sky-200/80 dark:border-sky-900/40 ${
                          tableTextSize === 'large' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                        } ${
                          dev51 === 0 ? 'text-slate-400 font-normal' : 'text-sky-950 dark:text-sky-100 font-black'
                        }`}>
                          {dev51 === 0 ? 'Rp 0' : formatRupiah(dev51)}
                        </td>
                        <td className={`${pyClass} px-4 text-right font-mono font-bold bg-amber-50/70 dark:bg-amber-950/25 border-r border-amber-200/80 dark:border-amber-900/40 ${
                          tableTextSize === 'large' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                        } ${
                          dev52 === 0 ? 'text-slate-400 font-normal' : 'text-amber-950 dark:text-amber-100 font-black'
                        }`}>
                          {dev52 === 0 ? 'Rp 0' : formatRupiah(dev52)}
                        </td>
                        <td className={`${pyClass} px-4 text-right font-mono font-bold bg-purple-50/70 dark:bg-purple-950/25 border-r border-purple-200/80 dark:border-purple-900/40 ${
                          tableTextSize === 'large' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                        } ${
                          dev53 === 0 ? 'text-slate-400 font-normal' : 'text-purple-950 dark:text-purple-100 font-black'
                        }`}>
                          {dev53 === 0 ? 'Rp 0' : formatRupiah(dev53)}
                        </td>
                        <td className={`${pyClass} px-4 text-right font-mono font-bold bg-emerald-50/70 dark:bg-emerald-950/25 border-r border-slate-300 dark:border-slate-700 ${
                          tableTextSize === 'large' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                        } ${
                          dev57 === 0 ? 'text-slate-400 font-normal' : 'text-emerald-950 dark:text-emerald-100 font-black'
                        }`}>
                          {dev57 === 0 ? 'Rp 0' : formatRupiah(dev57)}
                        </td>

                        {/* Total Deviasi Nominal (Rp) */}
                        <td className={`${pyClass} px-4 text-right font-mono font-black border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 ${
                          tableTextSize === 'large' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                        } ${
                          isNihil ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                        }`}>
                          {formatRupiah(totalDev)}
                        </td>

                        {/* Status Deviasi */}
                        <td className={`${pyClass} px-4 text-center bg-slate-50/80 dark:bg-slate-900/50`}>
                          <span className={`inline-flex items-center justify-center gap-1.5 min-w-[110px] px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs ${
                            isNihil
                              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700'
                              : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-400 dark:border-amber-700'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${isNihil ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span>{isNihil ? 'Sesuai RPD' : 'Ada Deviasi'}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* INDIVIDUAL TAB KHUSUS SATKER: MURNI DEVIASI NOMINAL (TANPA PERSENTASE) */
            <table className="w-full text-left min-w-[850px]">
              <thead className={`text-white font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 shadow-xs ${
                activeTab === '51' ? 'bg-gradient-to-r from-sky-700 to-blue-800' :
                activeTab === '52' ? 'bg-gradient-to-r from-amber-600 to-orange-700' :
                activeTab === '53' ? 'bg-gradient-to-r from-purple-700 to-indigo-800' :
                'bg-gradient-to-r from-emerald-600 to-teal-800'
              }`}>
                <tr>
                  <th className="py-3.5 px-3 text-center w-12 border-r border-white/20 text-xs font-black">No</th>
                  <th className="py-3.5 px-4 min-w-[300px] border-r border-white/20 text-xs sm:text-sm font-black">Satuan Kerja</th>
                  <th className="py-3.5 px-3 min-w-[100px] text-center border-r border-white/20 text-xs font-black">Periode</th>
                  <th className="py-3.5 px-4 text-right min-w-[240px] border-r border-white/20 text-xs sm:text-sm font-black">
                    💰 Deviasi Nominal Akun {activeTab} (Rp)
                  </th>
                  <th className="py-3.5 px-4 text-center min-w-[180px] border-r border-white/20 text-xs sm:text-sm font-black">
                    🎯 Status Kepatuhan
                  </th>
                  <th className="py-3.5 px-4 min-w-[240px] text-xs sm:text-sm font-black">
                    📋 Evaluasi Penyerapan vs RPD
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-200 dark:divide-slate-800 ${
                tableTextSize === 'large' ? 'text-xs sm:text-[13px]' : 'text-xs'
              }`}>
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 text-sm font-medium">
                      Tidak ada data yang cocok dengan kriteria filter Anda.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r, idx) => {
                    const globalIdx = (currentPage - 1) * (pageSize > 0 ? pageSize : 0) + idx + 1;

                    let rowDev = 0;

                    if (activeTab === '51') {
                      rowDev = r.rincianJenisBelanja?.belanja51?.deviasiNominal || 0;
                    } else if (activeTab === '52') {
                      rowDev = r.rincianJenisBelanja?.belanja52?.deviasiNominal || 0;
                    } else if (activeTab === '53') {
                      rowDev = r.rincianJenisBelanja?.belanja53?.deviasiNominal || 0;
                    } else if (activeTab === '57') {
                      rowDev = r.rincianJenisBelanja?.belanja57?.deviasiNominal || 0;
                    }

                    const isNihil = rowDev === 0;
                    const pyClass = tableTextSize === 'large' ? 'py-4' : 'py-3';

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-blue-50/70 dark:hover:bg-slate-800/70 cursor-pointer transition-all group"
                        onClick={() => setSelectedRecordDetail(r)}
                      >
                        <td className={`${pyClass} px-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800`}>
                          {globalIdx}
                        </td>
                        <td className={`${pyClass} px-4 border-r border-slate-200 dark:border-slate-800`}>
                          <div className={`font-black text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${
                            tableTextSize === 'large' ? 'text-sm' : 'text-xs'
                          }`}>
                            {r.namaSatker}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {r.kodeSatker}
                            </span>
                            {r.kementerianLembaga && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px] font-medium">
                                {r.kementerianLembaga}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`${pyClass} px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800`}>
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono font-black text-xs">
                            Bulan {String(r.periodeAngka || 1).padStart(2, '0')}
                          </span>
                        </td>
                        <td className={`${pyClass} px-4 text-right font-mono font-black border-r border-slate-200 dark:border-slate-800 ${
                          tableTextSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                        } ${
                          activeTab === '51' ? 'bg-sky-50/60 dark:bg-sky-950/20 text-sky-900 dark:text-sky-200' :
                          activeTab === '52' ? 'bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200' :
                          activeTab === '53' ? 'bg-purple-50/60 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200' :
                          'bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                        }`}>
                          {rowDev === 0 ? (
                            <span className="text-slate-400 font-normal text-sm">Rp 0 (Sesuai RPD)</span>
                          ) : (
                            formatRupiah(rowDev)
                          )}
                        </td>
                        <td className={`${pyClass} px-4 text-center border-r border-slate-200 dark:border-slate-800`}>
                          <span className={`inline-flex items-center justify-center min-w-[130px] px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs ${
                            isNihil
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-700'
                          }`}>
                            {isNihil ? '✅ Tepat Sesuai RPD' : '⚠️ Ada Selisih RPD'}
                          </span>
                        </td>
                        <td className={`${pyClass} px-4`}>
                          <span className={`text-xs font-semibold ${
                            isNihil ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'
                          }`}>
                            {isNihil 
                              ? 'Penyerapan anggaran tepat sesuai rencana penarikan dana bulanan.'
                              : `Terdapat selisih ${formatRupiah(rowDev)} antara rencana dan realisasi.`}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {pageSize !== -1 && totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> (Total {filteredRecords.length} Baris Data)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-all cursor-pointer"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-all cursor-pointer"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL SATKER (KHUSUS SATKER: HANYA DEVIASI & % DEVIASI, AMAN TANPA RENCANA & PENYERAPAN) */}
      {selectedRecordDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-3xl border shadow-2xl p-6 space-y-5 animate-scale-up ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Detail Kepatuhan Satker
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                  {selectedRecordDetail.namaSatker}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Kode Satker: {selectedRecordDetail.kodeSatker} • Periode Bulan {selectedRecordDetail.periodeAngka}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecordDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Klasifikasi: {selectedRecordDetail.klasifikasiSatker || '-'}
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Revisi: {selectedRecordDetail.noRevisiTerakhir ? `Rev ${selectedRecordDetail.noRevisiTerakhir}` : '-'}
              </span>
              <span className={`px-2 py-0.5 rounded-md font-bold ${
                (selectedRecordDetail.persenDeviasiTotal || 0) <= 5.0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                Rata-rata % Deviasi: {(selectedRecordDetail.persenDeviasiTotal || 0).toFixed(2)}%
              </span>
            </div>

            {/* Breakdown per Akun Belanja */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Rincian Deviasi &amp; Persen per Jenis Belanja:
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {/* 51 */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>51 Pegawai</span>
                    <span className="font-mono text-indigo-600 font-black">
                      {(selectedRecordDetail.rincianJenisBelanja?.belanja51?.persenDeviasi || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Deviasi Rp:</span>
                    <strong className="text-rose-600 font-mono">
                      {formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja51?.deviasiNominal || 0)}
                    </strong>
                  </div>
                </div>

                {/* 52 */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>52 Barang</span>
                    <span className="font-mono text-indigo-600 font-black">
                      {(selectedRecordDetail.rincianJenisBelanja?.belanja52?.persenDeviasi || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Deviasi Rp:</span>
                    <strong className="text-rose-600 font-mono">
                      {formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja52?.deviasiNominal || 0)}
                    </strong>
                  </div>
                </div>

                {/* 53 */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>53 Modal</span>
                    <span className="font-mono text-indigo-600 font-black">
                      {(selectedRecordDetail.rincianJenisBelanja?.belanja53?.persenDeviasi || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Deviasi Rp:</span>
                    <strong className="text-rose-600 font-mono">
                      {formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja53?.deviasiNominal || 0)}
                    </strong>
                  </div>
                </div>

                {/* 57 */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                  <div className="font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                    <span>57 Bansos</span>
                    <span className="font-mono text-indigo-600 font-black">
                      {(selectedRecordDetail.rincianJenisBelanja?.belanja57?.persenDeviasi || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Deviasi Rp:</span>
                    <strong className="text-rose-600 font-mono">
                      {formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja57?.deviasiNominal || 0)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Catatan Tindak Lanjut */}
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong>Panduan Tindak Lanjut Satker:</strong>
                <p className="mt-0.5 text-sky-800 dark:text-sky-300 text-[11px] leading-relaxed">
                  {(selectedRecordDetail.persenDeviasiTotal || 0) > 5.0
                    ? 'Deviasi melebihi batas toleransi 5.00%. Disarankan untuk menyesuaikan proyeksi RPD pada revisi Halaman III DIPA triwulan berikutnya agar nilai IKPA tetap maksimal.'
                    : 'Kepatuhan Halaman III DIPA telah memenuhi target (≤ 5.00%). Pertahankan konsistensi penarikan dana sesuai RPD hingga akhir triwulan.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setSelectedRecordDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
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
