import React, { useState, useMemo } from 'react';
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
  Percent,
  SlidersHorizontal,
  ArrowUpDown
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
import { PERIODE_LIST } from '../data/initialDeviasiHal3Data';
import * as XLSX from 'xlsx';

interface DeviasiHal3SatkerPublicViewProps {
  deviasiRecords: DeviasiHal3Record[];
  masterSatkers?: MasterSatker[];
  satkers?: SatkerIKPA[];
  isDark?: boolean;
  isAdminAuthenticated?: boolean;
  onOpenAdminAuth?: () => void;
  onSwitchToInternal?: () => void;
}

type TabBelanjaMode = 'MATRIKS' | '51' | '52' | '53' | '57';
type SeverityFilterType =
  | 'ALL'
  | 'ALERT_ANY'        // Ada Akun Belanja > 10%
  | 'ALERT_51'         // Belanja 51 > 10%
  | 'ALERT_52'         // Belanja 52 > 10%
  | 'ALERT_53'         // Belanja 53 > 10%
  | 'ALERT_57'         // Belanja 57 > 10%
  | 'SAFE';            // Seluruh Akun Aman (<= 5%)

export const DeviasiHal3SatkerPublicView: React.FC<DeviasiHal3SatkerPublicViewProps> = ({
  deviasiRecords = [],
  masterSatkers = [],
  satkers = [],
  isDark = false,
  isAdminAuthenticated = false,
  onOpenAdminAuth,
  onSwitchToInternal
}) => {
  // State Filter & Search
  const [selectedPeriode, setSelectedPeriode] = useState<string>('ALL');
  const [selectedKl, setSelectedKl] = useState<string>('ALL');
  const [selectedKlasifikasi, setSelectedKlasifikasi] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityFilterType>('ALL');
  const [activeTab, setActiveTab] = useState<TabBelanjaMode>('MATRIKS');
  const [sortField, setSortField] = useState<'deviasiRp' | 'persenDeviasi' | 'kodeSatker' | 'periodeAngka' | 'klasifikasi' | 'noRevisi'>('persenDeviasi');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Detail Modal
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<DeviasiHal3Record | null>(null);

  // Format rupiah helper
  const formatRupiah = (num: number) => {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
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

  // Distinct Klasifikasi Satker list
  const klasifikasiList = useMemo(() => {
    const set = new Set<string>();
    deviasiRecords.forEach(r => {
      if (r.klasifikasiSatker && r.klasifikasiSatker.trim()) {
        set.add(r.klasifikasiSatker.trim());
      }
    });
    return Array.from(set).sort();
  }, [deviasiRecords]);

  // Klasifikasi stats
  const klasifikasiStats = useMemo(() => {
    let countFullBlokir = 0;
    let countNonFullBlokir = 0;
    let countBlu = 0;

    deviasiRecords.forEach(r => {
      const k = (r.klasifikasiSatker || '').toUpperCase();
      if (k.includes('FULL BLOKIR') && !k.startsWith('NON BLU/NON') && !k.startsWith('NON-FULL')) {
        countFullBlokir++;
      } else if (k.includes('NON FULL BLOKIR') || k.includes('NON BLOKIR')) {
        countNonFullBlokir++;
      }
      if (k.includes('BLU') && !k.includes('NON BLU')) {
        countBlu++;
      }
    });

    return {
      countFullBlokir,
      countNonFullBlokir,
      countBlu,
      total: deviasiRecords.length
    };
  }, [deviasiRecords]);

  // Klasifikasi Badge Helper
  const renderKlasifikasiBadge = (klasifikasi?: string) => {
    if (!klasifikasi || !klasifikasi.trim()) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400">
          -
        </span>
      );
    }

    const kUpper = klasifikasi.toUpperCase();
    const isFullBlokir = kUpper.includes('FULL BLOKIR') && !kUpper.startsWith('NON BLU/NON') && !kUpper.startsWith('NON-FULL');
    const isNonFullBlokir = kUpper.includes('NON FULL BLOKIR') || kUpper.includes('NON BLOKIR');

    if (isFullBlokir) {
      return (
        <span 
          title="Satker dengan status FULL BLOKIR pada Halaman III DIPA"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 text-[11px] font-extrabold border border-rose-300 dark:border-rose-800/80 shadow-2xs whitespace-nowrap"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{klasifikasi}</span>
        </span>
      );
    }

    if (isNonFullBlokir) {
      return (
        <span 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 text-[11px] font-extrabold border border-emerald-300 dark:border-emerald-800/80 shadow-2xs whitespace-nowrap"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{klasifikasi}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
        {klasifikasi}
      </span>
    );
  };

  // Filter Data
  const filteredRecords = useMemo(() => {
    return deviasiRecords.filter(r => {
      // Periode Filter
      if (selectedPeriode !== 'ALL' && String(r.periodeAngka) !== selectedPeriode) {
        return false;
      }

      // K/L Filter
      if (selectedKl !== 'ALL' && r.kementerianLembaga !== selectedKl) {
        return false;
      }

      // Klasifikasi Filter
      if (selectedKlasifikasi !== 'ALL') {
        const k = (r.klasifikasiSatker || '').toUpperCase();
        if (selectedKlasifikasi === 'FULL_BLOKIR') {
          if (!k.includes('FULL BLOKIR') || k.startsWith('NON BLU/NON') || k.startsWith('NON-FULL')) return false;
        } else if (selectedKlasifikasi === 'NON_FULL_BLOKIR') {
          if (!k.includes('NON FULL BLOKIR') && !k.includes('NON BLOKIR')) return false;
        } else if (selectedKlasifikasi === 'BLU') {
          if (!k.includes('BLU') || k.includes('NON BLU')) return false;
        } else if (selectedKlasifikasi === 'NON_BLU') {
          if (k.includes('BLU') && !k.includes('NON BLU')) return false;
        } else if (r.klasifikasiSatker !== selectedKlasifikasi) {
          return false;
        }
      }

      // Severity / Deviasi Filter
      if (selectedSeverity !== 'ALL') {
        const p51 = r.rincianJenisBelanja?.belanja51?.persenDeviasi || 0;
        const p52 = r.rincianJenisBelanja?.belanja52?.persenDeviasi || 0;
        const p53 = r.rincianJenisBelanja?.belanja53?.persenDeviasi || 0;
        const p57 = r.rincianJenisBelanja?.belanja57?.persenDeviasi || 0;

        if (selectedSeverity === 'ALERT_ANY') {
          if (p51 <= 10 && p52 <= 10 && p53 <= 10 && p57 <= 10) return false;
        } else if (selectedSeverity === 'ALERT_51') {
          if (p51 <= 10) return false;
        } else if (selectedSeverity === 'ALERT_52') {
          if (p52 <= 10) return false;
        } else if (selectedSeverity === 'ALERT_53') {
          if (p53 <= 10) return false;
        } else if (selectedSeverity === 'ALERT_57') {
          if (p57 <= 10) return false;
        } else if (selectedSeverity === 'SAFE') {
          if (p51 > 5 || p52 > 5 || p53 > 5 || p57 > 5) return false;
        }
      }

      // Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchKode = (r.kodeSatker || '').toLowerCase().includes(q);
        const matchNama = (r.namaSatker || '').toLowerCase().includes(q);
        const matchKppn = (r.kodeKppn || '').toLowerCase().includes(q);
        const matchKlas = (r.klasifikasiSatker || '').toLowerCase().includes(q);
        if (!matchKode && !matchNama && !matchKppn && !matchKlas) return false;
      }

      return true;
    });
  }, [deviasiRecords, selectedPeriode, selectedKl, selectedKlasifikasi, selectedSeverity, searchTerm]);

  // Sorting
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];
    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortField === 'persenDeviasi') {
        if (activeTab === '51') {
          valA = a.rincianJenisBelanja?.belanja51?.persenDeviasi || 0;
          valB = b.rincianJenisBelanja?.belanja51?.persenDeviasi || 0;
        } else if (activeTab === '52') {
          valA = a.rincianJenisBelanja?.belanja52?.persenDeviasi || 0;
          valB = b.rincianJenisBelanja?.belanja52?.persenDeviasi || 0;
        } else if (activeTab === '53') {
          valA = a.rincianJenisBelanja?.belanja53?.persenDeviasi || 0;
          valB = b.rincianJenisBelanja?.belanja53?.persenDeviasi || 0;
        } else if (activeTab === '57') {
          valA = a.rincianJenisBelanja?.belanja57?.persenDeviasi || 0;
          valB = b.rincianJenisBelanja?.belanja57?.persenDeviasi || 0;
        } else {
          valA = a.persenDeviasiTotal || 0;
          valB = b.persenDeviasiTotal || 0;
        }
      } else if (sortField === 'deviasiRp') {
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
      } else if (sortField === 'periodeAngka') {
        valA = a.periodeAngka || 0;
        valB = b.periodeAngka || 0;
      } else if (sortField === 'klasifikasi') {
        valA = a.klasifikasiSatker || '';
        valB = b.klasifikasiSatker || '';
      } else if (sortField === 'noRevisi') {
        valA = Number(a.noRevisiTerakhir) || 0;
        valB = Number(b.noRevisiTerakhir) || 0;
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

  // Calculate High-level Public Summary Metrics (ONLY Deviasi & % Deviasi, NO RPD/Realisasi totals!)
  const publicMetrics = useMemo(() => {
    let totalDeviasiNominal = 0;
    let sumPersenDeviasi = 0;
    let countAman = 0;      // <= 5%
    let countWaspada = 0;   // > 5% && <= 10%
    let countKritis = 0;    // > 10%

    // Sub-accounts aggregates
    let dev51 = 0, sumPersen51 = 0, count51 = 0;
    let dev52 = 0, sumPersen52 = 0, count52 = 0;
    let dev53 = 0, sumPersen53 = 0, count53 = 0;
    let dev57 = 0, sumPersen57 = 0, count57 = 0;

    filteredRecords.forEach(r => {
      totalDeviasiNominal += r.deviasiNominalTotal || 0;
      const p = r.persenDeviasiTotal || 0;
      sumPersenDeviasi += p;

      if (p <= 5.0) countAman++;
      else if (p <= 10.0) countWaspada++;
      else countKritis++;

      // 51
      const b51 = r.rincianJenisBelanja?.belanja51;
      if (b51) {
        dev51 += b51.deviasiNominal || 0;
        sumPersen51 += b51.persenDeviasi || 0;
        count51++;
      }

      // 52
      const b52 = r.rincianJenisBelanja?.belanja52;
      if (b52) {
        dev52 += b52.deviasiNominal || 0;
        sumPersen52 += b52.persenDeviasi || 0;
        count52++;
      }

      // 53
      const b53 = r.rincianJenisBelanja?.belanja53;
      if (b53) {
        dev53 += b53.deviasiNominal || 0;
        sumPersen53 += b53.persenDeviasi || 0;
        count53++;
      }

      // 57
      const b57 = r.rincianJenisBelanja?.belanja57;
      if (b57) {
        dev57 += b57.deviasiNominal || 0;
        sumPersen57 += b57.persenDeviasi || 0;
        count57++;
      }
    });

    const totalRows = filteredRecords.length;
    const avgPersenDeviasi = totalRows > 0 ? sumPersenDeviasi / totalRows : 0;
    const avg51 = count51 > 0 ? sumPersen51 / count51 : 0;
    const avg52 = count52 > 0 ? sumPersen52 / count52 : 0;
    const avg53 = count53 > 0 ? sumPersen53 / count53 : 0;
    const avg57 = count57 > 0 ? sumPersen57 / count57 : 0;

    return {
      totalRows,
      totalDeviasiNominal,
      avgPersenDeviasi,
      countAman,
      countWaspada,
      countKritis,
      belanja51: { dev: dev51, avgPersen: avg51 },
      belanja52: { dev: dev52, avgPersen: avg52 },
      belanja53: { dev: dev53, avgPersen: avg53 },
      belanja57: { dev: dev57, avgPersen: avg57 }
    };
  }, [filteredRecords]);

  // Chart Data: Rata-rata % Deviasi per Jenis Belanja vs Batas Toleransi 5%
  const chartDataPersen = useMemo(() => {
    return [
      {
        name: '51 Pegawai',
        persen: Number(publicMetrics.belanja51.avgPersen.toFixed(2)),
        toleransi: 5.0
      },
      {
        name: '52 Barang',
        persen: Number(publicMetrics.belanja52.avgPersen.toFixed(2)),
        toleransi: 5.0
      },
      {
        name: '53 Modal',
        persen: Number(publicMetrics.belanja53.avgPersen.toFixed(2)),
        toleransi: 5.0
      },
      {
        name: '57 Bansos',
        persen: Number(publicMetrics.belanja57.avgPersen.toFixed(2)),
        toleransi: 5.0
      }
    ];
  }, [publicMetrics]);

  // Handle Safe Satker Export (Excludes RPD & Realisasi)
  const handleExportSatker = () => {
    const dataToExport = filteredRecords.map((r, idx) => {
      const pTotal = r.persenDeviasiTotal || 0;
      let statusKepatuhan = 'Aman (≤ 5%)';
      if (pTotal > 10.0) statusKepatuhan = 'Kritis (> 10%)';
      else if (pTotal > 5.0) statusKepatuhan = 'Waspada (5% - 10%)';

      return {
        'No': idx + 1,
        'Kode Satker': r.kodeSatker,
        'Nama Satker': r.namaSatker,
        'Bulan / Periode': r.periodeAngka ? String(r.periodeAngka).padStart(2, '0') : '-',
        'Klasifikasi (Kolom Y)': r.klasifikasiSatker || '-',
        'Deviasi 51 Pegawai (Rp)': r.rincianJenisBelanja?.belanja51?.deviasiNominal || 0,
        '% Deviasi 51 Pegawai': `${(r.rincianJenisBelanja?.belanja51?.persenDeviasi || 0).toFixed(2)}%`,
        'Deviasi 52 Barang (Rp)': r.rincianJenisBelanja?.belanja52?.deviasiNominal || 0,
        '% Deviasi 52 Barang': `${(r.rincianJenisBelanja?.belanja52?.persenDeviasi || 0).toFixed(2)}%`,
        'Deviasi 53 Modal (Rp)': r.rincianJenisBelanja?.belanja53?.deviasiNominal || 0,
        '% Deviasi 53 Modal': `${(r.rincianJenisBelanja?.belanja53?.persenDeviasi || 0).toFixed(2)}%`,
        'Deviasi 57 Bansos (Rp)': r.rincianJenisBelanja?.belanja57?.deviasiNominal || 0,
        '% Deviasi 57 Bansos': `${(r.rincianJenisBelanja?.belanja57?.persenDeviasi || 0).toFixed(2)}%`,
        'Rata-rata % Deviasi': `${pTotal.toFixed(2)}%`,
        'Status Kepatuhan': statusKepatuhan,
        'No Revisi': r.noRevisiTerakhir !== undefined && r.noRevisiTerakhir !== '' ? `Rev ${r.noRevisiTerakhir}` : '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Deviasi Satker');
    XLSX.writeFile(wb, `Monitoring_Deviasi_Hal3_Satker_${selectedPeriode === 'ALL' ? 'Semua_Periode' : `Periode_${selectedPeriode}`}.xlsx`);
  };

  const handleHeaderSort = (field: 'deviasiRp' | 'persenDeviasi' | 'kodeSatker' | 'periodeAngka' | 'klasifikasi' | 'noRevisi') => {
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
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Periode: {selectedPeriode === 'ALL' ? 'Semua Periode' : `Bulan ${selectedPeriode}`}
              </span>
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

      {/* 4 CARDS KEPATUHAN DEVIASI BULAN BERJALAN (MURNI DEVIASI & PERSEN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Rata-rata % Deviasi */}
        <div className={`p-5 rounded-3xl border shadow-xs space-y-2 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Rata-rata % Deviasi
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {publicMetrics.avgPersenDeviasi.toFixed(2)}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>Toleransi batas normal DJPb:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">≤ 5.00%</strong>
          </p>
        </div>

        {/* Card 2: Satker Aman / Patuh (<= 5%) */}
        <div className={`p-5 rounded-3xl border shadow-xs space-y-2 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Satker Patuh (≤ 5%)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {publicMetrics.countAman} <span className="text-xs font-medium text-slate-500">Baris</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {publicMetrics.totalRows > 0 ? ((publicMetrics.countAman / publicMetrics.totalRows) * 100).toFixed(1) : 0}% mematuhi target RPD Halaman III
          </p>
        </div>

        {/* Card 3: Satker Waspada (5.01% - 10%) */}
        <div className={`p-5 rounded-3xl border shadow-xs space-y-2 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Waspada (5% - 10%)
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            {publicMetrics.countWaspada} <span className="text-xs font-medium text-slate-500">Baris</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {publicMetrics.totalRows > 0 ? ((publicMetrics.countWaspada / publicMetrics.totalRows) * 100).toFixed(1) : 0}% deviasi mendekati ambang batas
          </p>
        </div>

        {/* Card 4: Satker Deviasi Kritis (> 10%) */}
        <div className={`p-5 rounded-3xl border shadow-xs space-y-2 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Deviasi Kritis (&gt; 10%)
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
            {publicMetrics.countKritis} <span className="text-xs font-medium text-slate-500">Baris</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {publicMetrics.totalRows > 0 ? ((publicMetrics.countKritis / publicMetrics.totalRows) * 100).toFixed(1) : 0}% perlu penyesuaian revisi RPD
          </p>
        </div>
      </div>

      {/* VISUALISASI PERSEN DEVIASI PER JENIS BELANJA (TANPA NOMINAL RENCANA / REALISASI) */}
      <div className={`p-6 rounded-3xl border shadow-xs space-y-5 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Tingkat Kepatuhan &amp; % Deviasi per Jenis Belanja
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Perbandingan rata-rata deviasi persen pada akun 51, 52, 53, dan 57 terhadap batas toleransi 5.00% DJPb.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Batas Maksimal Aman: 5.00%
          </span>
        </div>

        {/* 4 Mini Cards Jenis Belanja */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 51 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>51 Pegawai</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black ${
                publicMetrics.belanja51.avgPersen <= 5.0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {publicMetrics.belanja51.avgPersen <= 5.0 ? 'Aman' : 'Tinggi'}
              </span>
            </div>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
              {publicMetrics.belanja51.avgPersen.toFixed(2)}%
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Deviasi Rp:</span>
              <strong className="font-mono text-rose-600 dark:text-rose-400">{formatRupiah(publicMetrics.belanja51.dev)}</strong>
            </div>
          </div>

          {/* 52 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>52 Barang</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black ${
                publicMetrics.belanja52.avgPersen <= 5.0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {publicMetrics.belanja52.avgPersen <= 5.0 ? 'Aman' : 'Tinggi'}
              </span>
            </div>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
              {publicMetrics.belanja52.avgPersen.toFixed(2)}%
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Deviasi Rp:</span>
              <strong className="font-mono text-rose-600 dark:text-rose-400">{formatRupiah(publicMetrics.belanja52.dev)}</strong>
            </div>
          </div>

          {/* 53 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>53 Modal</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black ${
                publicMetrics.belanja53.avgPersen <= 5.0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {publicMetrics.belanja53.avgPersen <= 5.0 ? 'Aman' : 'Tinggi'}
              </span>
            </div>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
              {publicMetrics.belanja53.avgPersen.toFixed(2)}%
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Deviasi Rp:</span>
              <strong className="font-mono text-rose-600 dark:text-rose-400">{formatRupiah(publicMetrics.belanja53.dev)}</strong>
            </div>
          </div>

          {/* 57 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>57 Bansos</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black ${
                publicMetrics.belanja57.avgPersen <= 5.0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {publicMetrics.belanja57.avgPersen <= 5.0 ? 'Aman' : 'Tinggi'}
              </span>
            </div>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
              {publicMetrics.belanja57.avgPersen.toFixed(2)}%
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>Deviasi Rp:</span>
              <strong className="font-mono text-rose-600 dark:text-rose-400">{formatRupiah(publicMetrics.belanja57.dev)}</strong>
            </div>
          </div>
        </div>

        {/* Bar Chart % Deviasi */}
        <div className="h-56 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartDataPersen} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
              <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
              <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} unit="%" />
              <RechartsTooltip
                formatter={(val: any) => [`${val}%`, '']}
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  borderRadius: '16px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <ReferenceLine y={5.0} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Batas 5%', fill: '#10b981', fontSize: 10, position: 'right' }} />
              <Bar dataKey="persen" name="Rata-rata % Deviasi" radius={[6, 6, 0, 0]}>
                {chartDataPersen.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.persen <= 5.0 ? '#10b981' : entry.persen <= 10.0 ? '#f59e0b' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FILTER & KONTROL TABEL */}
      <div className={`p-5 rounded-3xl border shadow-xs space-y-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Tab Selection */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('MATRIKS')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'MATRIKS'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            📋 Matriks Deviasi Lengkap (51, 52, 53, 57)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('51')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === '51'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Belanja Pegawai (51)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('52')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === '52'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Belanja Barang (52)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('53')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === '53'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Belanja Modal (53)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('57')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === '57'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Belanja Bansos (57)
          </button>
        </div>

        {/* Filter Row: Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode / nama satker..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter Status Deviasi */}
          <div className="sm:col-span-3">
            <select
              value={selectedSeverity}
              onChange={(e) => {
                setSelectedSeverity(e.target.value as SeverityFilterType);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-rose-700 dark:text-rose-400"
            >
              <option value="ALL">🔍 Semua Status Deviasi</option>
              <option value="ALERT_ANY">🚨 Ada Akun Belanja &gt; 10%</option>
              <option value="ALERT_51">🏢 Deviasi 51 Pegawai &gt; 10%</option>
              <option value="ALERT_52">📦 Deviasi 52 Barang &gt; 10%</option>
              <option value="ALERT_53">🏗️ Deviasi 53 Modal &gt; 10%</option>
              <option value="ALERT_57">🤝 Deviasi 57 Bansos &gt; 10%</option>
              <option value="SAFE">✅ Seluruh Akun Aman (≤ 5%)</option>
            </select>
          </div>

          {/* Filter Klasifikasi Satker (Kolom Y) */}
          <div className="sm:col-span-2">
            <select
              value={selectedKlasifikasi}
              onChange={(e) => {
                setSelectedKlasifikasi(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="ALL">🏷️ Semua Klasifikasi</option>
              <option value="FULL_BLOKIR">🔒 Full Blokir ({klasifikasiStats.countFullBlokir})</option>
              <option value="NON_FULL_BLOKIR">🔓 Non Full Blokir ({klasifikasiStats.countNonFullBlokir})</option>
              <option value="BLU">🏦 BLU ({klasifikasiStats.countBlu})</option>
              {klasifikasiList.length > 0 && <option disabled>──────────</option>}
              {klasifikasiList.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Filter Periode Bulan */}
          <div className="sm:col-span-2">
            <select
              value={selectedPeriode}
              onChange={(e) => {
                setSelectedPeriode(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="ALL">-- Semua Periode --</option>
              {PERIODE_LIST.map(p => (
                <option key={p.angka} value={String(p.angka)}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter K/L */}
          <div className="sm:col-span-2">
            <select
              value={selectedKl}
              onChange={(e) => {
                setSelectedKl(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="ALL">-- K/L ({klList.length}) --</option>
              {klList.map(kl => (
                <option key={kl} value={kl}>{kl.slice(0, 20)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABEL MONITORING KHUSUS SATKER: MURNI DEVIASI & % DEVIASI (TANPA RENCANA & PENYERAPAN) */}
      <div className={`rounded-3xl border shadow-xs overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Tabel Kepatuhan Deviasi Halaman III DIPA Satker
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeTab === 'MATRIKS'
                ? 'Matriks Deviasi Lengkap: Deviasi Nominal (Rp) & % Deviasi per Akun (51, 52, 53, 57). Angka Rencana dan Realisasi disembunyikan.'
                : `Menampilkan Deviasi Nominal (Rp) dan % Deviasi untuk ${activeTab === '51' ? 'Belanja Pegawai (51)' : activeTab === '52' ? 'Belanja Barang (52)' : activeTab === '53' ? 'Belanja Modal (53)' : 'Belanja Bansos (57)'}.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-1 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
            >
              <option value={10}>10 Baris</option>
              <option value={15}>15 Baris</option>
              <option value={25}>25 Baris</option>
              <option value={50}>50 Baris</option>
              <option value={-1}>Semua ({filteredRecords.length})</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'MATRIKS' ? (
            /* MATRIKS LENGKAP KHUSUS SATKER: HANYA DEVIASI (RP) & % DEVIASI (TANPA RPD & REALISASI) */
            <table className="w-full text-left text-xs min-w-[1050px]">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th rowSpan={2} className="py-3 px-2 text-center w-10 border-r border-slate-200 dark:border-slate-700">No</th>
                  <th rowSpan={2} className="py-3 px-3 min-w-[220px] border-r border-slate-200 dark:border-slate-700">Satker</th>
                  <th rowSpan={2} className="py-3 px-2 text-center w-16 border-r border-slate-200 dark:border-slate-700">Bln</th>
                  <th rowSpan={2} className="py-3 px-3 text-center min-w-[130px] border-r border-slate-200 dark:border-slate-700 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300">
                    Klasifikasi (Y)
                  </th>
                  <th colSpan={4} className="py-2 px-2 text-center bg-rose-50/80 dark:bg-rose-950/40 border-r border-slate-200 dark:border-slate-700 text-rose-700 dark:text-rose-300">
                    Deviasi Nominal (Rp)
                  </th>
                  <th colSpan={4} className="py-2 px-2 text-center bg-amber-50/80 dark:bg-amber-950/40 border-r border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-300">
                    % Deviasi per Jenis Belanja
                  </th>
                  <th rowSpan={2} className="py-3 px-2 text-center min-w-[90px] border-r border-slate-200 dark:border-slate-700">
                    Status
                  </th>
                  <th rowSpan={2} className="py-3 px-2 text-center w-14">Revisi</th>
                </tr>
                <tr className="border-t border-slate-200 dark:border-slate-700 text-[9px] font-mono">
                  {/* Deviasi Rp */}
                  <th className="py-2 px-2 text-right bg-rose-50/30 dark:bg-rose-950/20">51</th>
                  <th className="py-2 px-2 text-right bg-rose-50/30 dark:bg-rose-950/20">52</th>
                  <th className="py-2 px-2 text-right bg-rose-50/30 dark:bg-rose-950/20">53</th>
                  <th className="py-2 px-2 text-right bg-rose-50/30 dark:bg-rose-950/20 border-r border-slate-200 dark:border-slate-700">57</th>
                  {/* % Deviasi */}
                  <th className="py-2 px-2 text-center bg-amber-50/30 dark:bg-amber-950/20">51</th>
                  <th className="py-2 px-2 text-center bg-amber-50/30 dark:bg-amber-950/20">52</th>
                  <th className="py-2 px-2 text-center bg-amber-50/30 dark:bg-amber-950/20">53</th>
                  <th className="py-2 px-2 text-center bg-amber-50/30 dark:bg-amber-950/20 border-r border-slate-200 dark:border-slate-700">57</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-slate-400">
                      Tidak ada data yang cocok dengan kriteria filter Anda.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r, idx) => {
                    const globalIdx = (currentPage - 1) * (pageSize > 0 ? pageSize : 0) + idx + 1;
                    const pTotal = r.persenDeviasiTotal || 0;
                    const isAman = pTotal <= 5.0;
                    const isWaspada = pTotal > 5.0 && pTotal <= 10.0;

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all"
                        onClick={() => setSelectedRecordDetail(r)}
                      >
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-400 border-r border-slate-200 dark:border-slate-800">
                          {globalIdx}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                          <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{r.namaSatker}</div>
                          <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">{r.kodeSatker}</div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                          {String(r.periodeAngka || 1).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                          {renderKlasifikasiBadge(r.klasifikasiSatker)}
                        </td>

                        {/* Deviasi Nominal (Rp) */}
                        <td className="py-2.5 px-2 text-right font-mono text-rose-600 dark:text-rose-400">
                          {formatRupiah(r.rincianJenisBelanja?.belanja51?.deviasiNominal || 0)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-rose-600 dark:text-rose-400">
                          {formatRupiah(r.rincianJenisBelanja?.belanja52?.deviasiNominal || 0)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-rose-600 dark:text-rose-400">
                          {formatRupiah(r.rincianJenisBelanja?.belanja53?.deviasiNominal || 0)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-rose-600 dark:text-rose-400 border-r border-slate-200 dark:border-slate-800">
                          {formatRupiah(r.rincianJenisBelanja?.belanja57?.deviasiNominal || 0)}
                        </td>

                        {/* % Deviasi */}
                        <td className="py-2.5 px-2 text-center font-mono">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${(r.rincianJenisBelanja?.belanja51?.persenDeviasi || 0) <= 5 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' : 'text-rose-600 bg-rose-50 dark:bg-rose-950/50'}`}>
                            {(r.rincianJenisBelanja?.belanja51?.persenDeviasi || 0).toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${(r.rincianJenisBelanja?.belanja52?.persenDeviasi || 0) <= 5 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' : 'text-rose-600 bg-rose-50 dark:bg-rose-950/50'}`}>
                            {(r.rincianJenisBelanja?.belanja52?.persenDeviasi || 0).toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${(r.rincianJenisBelanja?.belanja53?.persenDeviasi || 0) <= 5 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' : 'text-rose-600 bg-rose-50 dark:bg-rose-950/50'}`}>
                            {(r.rincianJenisBelanja?.belanja53?.persenDeviasi || 0).toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono border-r border-slate-200 dark:border-slate-800">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${(r.rincianJenisBelanja?.belanja57?.persenDeviasi || 0) <= 5 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' : 'text-rose-600 bg-rose-50 dark:bg-rose-950/50'}`}>
                            {(r.rincianJenisBelanja?.belanja57?.persenDeviasi || 0).toFixed(2)}%
                          </span>
                        </td>

                        {/* Status Kepatuhan */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isAman
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : isWaspada
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {isAman ? 'Patuh' : isWaspada ? 'Waspada' : 'Kritis'}
                          </span>
                        </td>

                        {/* No Revisi */}
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-500">
                          {r.noRevisiTerakhir !== undefined && r.noRevisiTerakhir !== '' ? `Rev ${r.noRevisiTerakhir}` : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* INDIVIDUAL TAB KHUSUS SATKER: HANYA DEVIASI NOMINAL & % DEVIASI (TANPA RPD & REALISASI) */
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-3 text-center w-12">No</th>
                  <th className="py-3.5 px-4 min-w-[260px]">Satuan Kerja</th>
                  <th className="py-3.5 px-3 min-w-[100px] text-center">Periode</th>
                  <th className="py-3.5 px-3 min-w-[140px] text-center bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300">
                    Klasifikasi (Kolom Y)
                  </th>
                  <th className="py-3.5 px-4 text-right min-w-[160px] text-rose-900 dark:text-rose-300">
                    Deviasi Nominal {activeTab} (Rp)
                  </th>
                  <th className="py-3.5 px-3 text-center min-w-[110px]">
                    % Deviasi {activeTab}
                  </th>
                  <th className="py-3.5 px-3 text-center min-w-[110px]">
                    Status Kepatuhan
                  </th>
                  <th className="py-3.5 px-3 text-center min-w-[90px]">Revisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Tidak ada data yang cocok dengan kriteria filter Anda.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r, idx) => {
                    const globalIdx = (currentPage - 1) * (pageSize > 0 ? pageSize : 0) + idx + 1;

                    let rowDev = 0;
                    let rowPersen = 0;

                    if (activeTab === '51') {
                      rowDev = r.rincianJenisBelanja?.belanja51?.deviasiNominal || 0;
                      rowPersen = r.rincianJenisBelanja?.belanja51?.persenDeviasi || 0;
                    } else if (activeTab === '52') {
                      rowDev = r.rincianJenisBelanja?.belanja52?.deviasiNominal || 0;
                      rowPersen = r.rincianJenisBelanja?.belanja52?.persenDeviasi || 0;
                    } else if (activeTab === '53') {
                      rowDev = r.rincianJenisBelanja?.belanja53?.deviasiNominal || 0;
                      rowPersen = r.rincianJenisBelanja?.belanja53?.persenDeviasi || 0;
                    } else if (activeTab === '57') {
                      rowDev = r.rincianJenisBelanja?.belanja57?.deviasiNominal || 0;
                      rowPersen = r.rincianJenisBelanja?.belanja57?.persenDeviasi || 0;
                    }

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all"
                        onClick={() => setSelectedRecordDetail(r)}
                      >
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-500">
                          {globalIdx}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100">{r.namaSatker}</div>
                          <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">Kode: {r.kodeSatker}</div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                          Bulan {String(r.periodeAngka || 1).padStart(2, '0')}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {renderKlasifikasiBadge(r.klasifikasiSatker)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                          {formatRupiah(rowDev)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-black border ${
                            rowPersen <= 5.0
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                              : rowPersen <= 10.0
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300'
                          }`}>
                            {rowPersen.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rowPersen <= 5.0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : rowPersen <= 10.0
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {rowPersen <= 5.0 ? 'Aman (≤ 5%)' : rowPersen <= 10.0 ? 'Waspada' : 'Kritis (> 10%)'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-mono font-bold">
                            {r.noRevisiTerakhir !== undefined && r.noRevisiTerakhir !== '' ? `Rev ${r.noRevisiTerakhir}` : '-'}
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
