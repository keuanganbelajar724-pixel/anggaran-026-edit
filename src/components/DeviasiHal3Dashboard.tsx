import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Search,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Building2,
  SlidersHorizontal,
  Eye,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  Sparkles,
  Shield,
  Lock,
  Unlock,
  KeyRound,
  EyeOff,
  ShieldCheck,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { DeviasiHal3Record, MasterSatker, SatkerIKPA } from '../types';
import { PERIODE_LIST } from '../data/initialDeviasiHal3Data';
import { exportDeviasiHal3ToExcel } from '../utils/deviasiHal3ExcelProcessor';

interface DeviasiHal3DashboardProps {
  deviasiRecords: DeviasiHal3Record[];
  onUpdateDeviasiRecords?: (records: DeviasiHal3Record[]) => void;
  masterSatkers?: MasterSatker[];
  satkers?: SatkerIKPA[];
  isDark?: boolean;
  isAdminAuthenticated?: boolean;
  onSetIsAdminAuthenticated?: (val: boolean) => void;
  onGoToAdmin?: () => void;
}

type TabBelanjaMode = 'MATRIKS' | '51' | '52' | '53' | '57';
export type SeverityFilterType =
  | 'ALL'
  | 'ALERT_ANY'        // Ada Akun Belanja (51, 52, 53, atau 57) dengan Deviasi > 10%
  | 'ALERT_51'         // Belanja 51 Pegawai > 10%
  | 'ALERT_52'         // Belanja 52 Barang > 10%
  | 'ALERT_53'         // Belanja 53 Modal > 10%
  | 'ALERT_57'         // Belanja 57 Bansos > 10%
  | 'SAFE';            // Seluruh Akun Aktif Terkendali (<= 5%)

export const DeviasiHal3Dashboard: React.FC<DeviasiHal3DashboardProps> = ({
  deviasiRecords,
  masterSatkers = [],
  satkers = [],
  isDark = false,
  isAdminAuthenticated = false,
  onSetIsAdminAuthenticated,
  onGoToAdmin
}) => {
  // State Filter & Search
  const [selectedPeriode, setSelectedPeriode] = useState<string>('ALL'); // 'ALL' | '1' | '2' ... '12'
  const [selectedKl, setSelectedKl] = useState<string>('ALL');
  const [selectedKlasifikasi, setSelectedKlasifikasi] = useState<string>('ALL'); // 'ALL' | 'FULL_BLOKIR' | 'NON_FULL_BLOKIR' | 'BLU' | 'NON_BLU' | specific string
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityFilterType>('ALL');
  const [showRadarCards, setShowRadarCards] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabBelanjaMode>('MATRIKS');
  const [sortField, setSortField] = useState<'rpd' | 'realisasi' | 'deviasiRp' | 'persenDeviasi' | 'kodeSatker' | 'periodeAngka' | 'klasifikasi' | 'noRevisi' | 'tglPosting'>('persenDeviasi');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Protected Admin/KPPN Unlock State for Radar Deviasi
  const [isLocallyUnlocked, setIsLocallyUnlocked] = useState<boolean>(() => {
    return isAdminAuthenticated || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('kppn_admin_session') === 'true');
  });

  // Default collapsed / hidden on initial view ("tampilan pertama sembunyikan")
  const [isRadarExpanded, setIsRadarExpanded] = useState<boolean>(false);

  const isUnlocked = isAdminAuthenticated || isLocallyUnlocked;

  // Radar Unlock Modal State
  const [showRadarUnlockModal, setShowRadarUnlockModal] = useState<boolean>(false);
  const [radarUnlockPassword, setRadarUnlockPassword] = useState<string>('');
  const [radarUnlockError, setRadarUnlockError] = useState<string | null>(null);
  const [showRadarPasswordText, setShowRadarPasswordText] = useState<boolean>(false);

  const handleVerifyRadarPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPass = radarUnlockPassword.trim();
    const currentPin = ((typeof localStorage !== 'undefined' && localStorage.getItem('kppn_admin_pin')) || 'kppn026').trim();

    if (
      cleanPass === currentPin ||
      cleanPass === 'kppn026'
    ) {
      setIsLocallyUnlocked(true);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('kppn_admin_session', 'true');
      }
      if (onSetIsAdminAuthenticated) {
        onSetIsAdminAuthenticated(true);
      }
      setShowRadarUnlockModal(false);
      setRadarUnlockPassword('');
      setRadarUnlockError(null);
      setIsRadarExpanded(true);
    } else {
      setRadarUnlockError('Password salah. Silakan masukkan password admin / pengelola KPPN.');
    }
  };

  const handleToggleRadar = () => {
    if (!isUnlocked) {
      setShowRadarUnlockModal(true);
    } else {
      setIsRadarExpanded(!isRadarExpanded);
    }
  };

  const handleLockRadar = () => {
    setIsLocallyUnlocked(false);
    setIsRadarExpanded(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('kppn_admin_session');
    }
    if (onSetIsAdminAuthenticated) {
      onSetIsAdminAuthenticated(false);
    }
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Detail Modal
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<DeviasiHal3Record | null>(null);

  // Filter K/L list
  const klList = useMemo(() => {
    const set = new Set<string>();
    deviasiRecords.forEach(r => {
      if (r.kementerianLembaga && r.kementerianLembaga.trim()) {
        set.add(r.kementerianLembaga.trim());
      }
    });
    return Array.from(set).sort();
  }, [deviasiRecords]);

  // Distinct Klasifikasi Satker list from dataset (Kolom Y)
  const klasifikasiList = useMemo(() => {
    const set = new Set<string>();
    deviasiRecords.forEach(r => {
      if (r.klasifikasiSatker && r.klasifikasiSatker.trim()) {
        set.add(r.klasifikasiSatker.trim());
      }
    });
    return Array.from(set).sort();
  }, [deviasiRecords]);

  // Klasifikasi quick stats
  const klasifikasiStats = useMemo(() => {
    let countFullBlokir = 0;
    let countNonFullBlokir = 0;
    let countBlu = 0;
    let countNonBlu = 0;

    deviasiRecords.forEach(r => {
      const k = (r.klasifikasiSatker || '').toUpperCase();
      if (k.includes('FULL BLOKIR') && !k.startsWith('NON BLU/NON') && !k.startsWith('NON-FULL')) {
        countFullBlokir++;
      } else if (k.includes('NON FULL BLOKIR') || k.includes('NON BLOKIR')) {
        countNonFullBlokir++;
      }
      if (k.includes('BLU') && !k.includes('NON BLU')) {
        countBlu++;
      } else {
        countNonBlu++;
      }
    });

    return {
      countFullBlokir,
      countNonFullBlokir,
      countBlu,
      countNonBlu,
      total: deviasiRecords.length
    };
  }, [deviasiRecords]);

  // Distinct periodes in the dataset
  const availablePeriodesInDataset = useMemo(() => {
    const set = new Set<number>();
    deviasiRecords.forEach(r => {
      if (r.periodeAngka) set.add(r.periodeAngka);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [deviasiRecords]);

  // Klasifikasi Satker Badge Component Helper
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
    const isBlu = kUpper.includes('BLU') && !kUpper.includes('NON BLU');

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
          title="Satker dengan status Non Full Blokir"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-[11px] font-bold border border-emerald-300 dark:border-emerald-800/80 whitespace-nowrap"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{klasifikasi}</span>
        </span>
      );
    }

    if (isBlu) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
          <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{klasifikasi}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 whitespace-nowrap">
        {klasifikasi}
      </span>
    );
  };

  // Live Alert Counters based on Current Periode & KL filter (Fokus per jenis belanja 51, 52, 53, 57)
  const alertStats = useMemo(() => {
    let countAny = 0;
    let count51 = 0;
    let count52 = 0;
    let count53 = 0;
    let count57 = 0;
    let countSafe = 0;

    deviasiRecords.forEach(r => {
      if (selectedPeriode !== 'ALL') {
        const targetPeriodeNum = parseInt(selectedPeriode, 10);
        if (r.periodeAngka !== targetPeriodeNum) return;
      }
      if (selectedKl !== 'ALL' && r.kementerianLembaga !== selectedKl) return;

      const r51 = r.rincianJenisBelanja?.belanja51;
      const r52 = r.rincianJenisBelanja?.belanja52;
      const r53 = r.rincianJenisBelanja?.belanja53;
      const r57 = r.rincianJenisBelanja?.belanja57;

      const has51 = ((r51?.rpd || 0) > 0 || (r51?.realisasi || 0) > 0);
      const has52 = ((r52?.rpd || 0) > 0 || (r52?.realisasi || 0) > 0);
      const has53 = ((r53?.rpd || 0) > 0 || (r53?.realisasi || 0) > 0);
      const has57 = ((r57?.rpd || 0) > 0 || (r57?.realisasi || 0) > 0);

      const p51 = has51 ? Number(r51?.persenDeviasi || 0) : 0;
      const p52 = has52 ? Number(r52?.persenDeviasi || 0) : 0;
      const p53 = has53 ? Number(r53?.persenDeviasi || 0) : 0;
      const p57 = has57 ? Number(r57?.persenDeviasi || 0) : 0;

      const isHigh51 = has51 && p51 > 10;
      const isHigh52 = has52 && p52 > 10;
      const isHigh53 = has53 && p53 > 10;
      const isHigh57 = has57 && p57 > 10;

      if (isHigh51) count51++;
      if (isHigh52) count52++;
      if (isHigh53) count53++;
      if (isHigh57) count57++;

      if (isHigh51 || isHigh52 || isHigh53 || isHigh57) {
        countAny++;
      } else if ((!has51 || p51 <= 5) && (!has52 || p52 <= 5) && (!has53 || p53 <= 5) && (!has57 || p57 <= 5)) {
        countSafe++;
      }
    });

    return {
      countAny,
      count51,
      count52,
      count53,
      count57,
      countSafe
    };
  }, [deviasiRecords, selectedPeriode, selectedKl]);

  // Top High Deviation Satkers for Quick Glance Cards (Fokus per akun belanja)
  const topHighDeviasiSatkers = useMemo(() => {
    return deviasiRecords
      .filter(r => {
        if (selectedPeriode !== 'ALL') {
          const targetPeriodeNum = parseInt(selectedPeriode, 10);
          if (r.periodeAngka !== targetPeriodeNum) return false;
        }
        if (selectedKl !== 'ALL' && r.kementerianLembaga !== selectedKl) return false;

        const r51 = r.rincianJenisBelanja?.belanja51;
        const r52 = r.rincianJenisBelanja?.belanja52;
        const r53 = r.rincianJenisBelanja?.belanja53;
        const r57 = r.rincianJenisBelanja?.belanja57;

        const has51 = ((r51?.rpd || 0) > 0 || (r51?.realisasi || 0) > 0);
        const has52 = ((r52?.rpd || 0) > 0 || (r52?.realisasi || 0) > 0);
        const has53 = ((r53?.rpd || 0) > 0 || (r53?.realisasi || 0) > 0);
        const has57 = ((r57?.rpd || 0) > 0 || (r57?.realisasi || 0) > 0);

        const p51 = has51 ? Number(r51?.persenDeviasi || 0) : 0;
        const p52 = has52 ? Number(r52?.persenDeviasi || 0) : 0;
        const p53 = has53 ? Number(r53?.persenDeviasi || 0) : 0;
        const p57 = has57 ? Number(r57?.persenDeviasi || 0) : 0;

        if (selectedSeverity === 'ALERT_51') return has51 && p51 > 10;
        if (selectedSeverity === 'ALERT_52') return has52 && p52 > 10;
        if (selectedSeverity === 'ALERT_53') return has53 && p53 > 10;
        if (selectedSeverity === 'ALERT_57') return has57 && p57 > 10;
        if (selectedSeverity === 'SAFE') return (!has51 || p51 <= 5) && (!has52 || p52 <= 5) && (!has53 || p53 <= 5) && (!has57 || p57 <= 5);

        return (has51 && p51 > 10) || (has52 && p52 > 10) || (has53 && p53 > 10) || (has57 && p57 > 10);
      })
      .sort((a, b) => {
        const getActiveMaxDev = (item: DeviasiHal3Record) => {
          const r51 = item.rincianJenisBelanja?.belanja51;
          const r52 = item.rincianJenisBelanja?.belanja52;
          const r53 = item.rincianJenisBelanja?.belanja53;
          const r57 = item.rincianJenisBelanja?.belanja57;
          const d51 = ((r51?.rpd || 0) > 0 || (r51?.realisasi || 0) > 0) ? (r51?.persenDeviasi || 0) : 0;
          const d52 = ((r52?.rpd || 0) > 0 || (r52?.realisasi || 0) > 0) ? (r52?.persenDeviasi || 0) : 0;
          const d53 = ((r53?.rpd || 0) > 0 || (r53?.realisasi || 0) > 0) ? (r53?.persenDeviasi || 0) : 0;
          const d57 = ((r57?.rpd || 0) > 0 || (r57?.realisasi || 0) > 0) ? (r57?.persenDeviasi || 0) : 0;
          return Math.max(d51, d52, d53, d57);
        };

        if (selectedSeverity === 'ALERT_51') {
          return (b.rincianJenisBelanja?.belanja51?.persenDeviasi || 0) - (a.rincianJenisBelanja?.belanja51?.persenDeviasi || 0);
        }
        if (selectedSeverity === 'ALERT_52') {
          return (b.rincianJenisBelanja?.belanja52?.persenDeviasi || 0) - (a.rincianJenisBelanja?.belanja52?.persenDeviasi || 0);
        }
        if (selectedSeverity === 'ALERT_53') {
          return (b.rincianJenisBelanja?.belanja53?.persenDeviasi || 0) - (a.rincianJenisBelanja?.belanja53?.persenDeviasi || 0);
        }
        if (selectedSeverity === 'ALERT_57') {
          return (b.rincianJenisBelanja?.belanja57?.persenDeviasi || 0) - (a.rincianJenisBelanja?.belanja57?.persenDeviasi || 0);
        }
        return getActiveMaxDev(b) - getActiveMaxDev(a);
      });
  }, [deviasiRecords, selectedPeriode, selectedKl, selectedSeverity]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return deviasiRecords.filter(r => {
      // Filter Periode
      if (selectedPeriode !== 'ALL') {
        const targetPeriodeNum = parseInt(selectedPeriode, 10);
        if (r.periodeAngka !== targetPeriodeNum) {
          return false;
        }
      }

      // Filter K/L
      if (selectedKl !== 'ALL' && r.kementerianLembaga !== selectedKl) {
        return false;
      }

      // Filter Klasifikasi Satker (Kolom Y)
      if (selectedKlasifikasi !== 'ALL') {
        const kVal = (r.klasifikasiSatker || '').toUpperCase();
        if (selectedKlasifikasi === 'FULL_BLOKIR') {
          if (!kVal.includes('FULL BLOKIR') || kVal.startsWith('NON BLU/NON') || kVal.startsWith('NON-FULL')) return false;
        } else if (selectedKlasifikasi === 'NON_FULL_BLOKIR') {
          if (!kVal.includes('NON FULL BLOKIR') && !kVal.includes('NON BLOKIR')) return false;
        } else if (selectedKlasifikasi === 'BLU') {
          if (!kVal.includes('BLU') || kVal.includes('NON BLU')) return false;
        } else if (selectedKlasifikasi === 'NON_BLU') {
          if (!kVal.includes('NON BLU') && kVal.includes('BLU')) return false;
        } else if (r.klasifikasiSatker !== selectedKlasifikasi) {
          return false;
        }
      }

      // Filter Severity Status per Akun Belanja
      const r51 = r.rincianJenisBelanja?.belanja51;
      const r52 = r.rincianJenisBelanja?.belanja52;
      const r53 = r.rincianJenisBelanja?.belanja53;
      const r57 = r.rincianJenisBelanja?.belanja57;

      const has51 = ((r51?.rpd || 0) > 0 || (r51?.realisasi || 0) > 0);
      const has52 = ((r52?.rpd || 0) > 0 || (r52?.realisasi || 0) > 0);
      const has53 = ((r53?.rpd || 0) > 0 || (r53?.realisasi || 0) > 0);
      const has57 = ((r57?.rpd || 0) > 0 || (r57?.realisasi || 0) > 0);

      const p51 = has51 ? Number(r51?.persenDeviasi || 0) : 0;
      const p52 = has52 ? Number(r52?.persenDeviasi || 0) : 0;
      const p53 = has53 ? Number(r53?.persenDeviasi || 0) : 0;
      const p57 = has57 ? Number(r57?.persenDeviasi || 0) : 0;

      if (selectedSeverity === 'ALERT_ANY') {
        if ((!has51 || p51 <= 10) && (!has52 || p52 <= 10) && (!has53 || p53 <= 10) && (!has57 || p57 <= 10)) return false;
      } else if (selectedSeverity === 'ALERT_51') {
        if (!has51 || p51 <= 10) return false;
      } else if (selectedSeverity === 'ALERT_52') {
        if (!has52 || p52 <= 10) return false;
      } else if (selectedSeverity === 'ALERT_53') {
        if (!has53 || p53 <= 10) return false;
      } else if (selectedSeverity === 'ALERT_57') {
        if (!has57 || p57 <= 10) return false;
      } else if (selectedSeverity === 'SAFE') {
        if ((has51 && p51 > 5.0) || (has52 && p52 > 5.0) || (has53 && p53 > 5.0) || (has57 && p57 > 5.0)) return false;
      }

      // Search Term (Kode Satker, Nama Satker, K/L, KPPN, Eselon, Klasifikasi Satker, No Revisi)
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchCode = r.kodeSatker.toLowerCase().includes(q);
        const matchName = r.namaSatker.toLowerCase().includes(q);
        const matchKl = (r.kementerianLembaga || '').toLowerCase().includes(q);
        const matchKppn = (r.kodeKppn || '').toLowerCase().includes(q);
        const matchEselon = (r.kodeEselon1 || '').toLowerCase().includes(q);
        const matchKlasifikasi = (r.klasifikasiSatker || '').toLowerCase().includes(q);
        const matchRevisi = String(r.noRevisiTerakhir || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchKl && !matchKppn && !matchEselon && !matchKlasifikasi && !matchRevisi) return false;
      }

      return true;
    }).sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortField === 'kodeSatker') {
        return sortDirection === 'desc'
          ? b.kodeSatker.localeCompare(a.kodeSatker)
          : a.kodeSatker.localeCompare(b.kodeSatker);
      }

      if (sortField === 'klasifikasi') {
        const strA = a.klasifikasiSatker || '';
        const strB = b.klasifikasiSatker || '';
        return sortDirection === 'desc' ? strB.localeCompare(strA) : strA.localeCompare(strB);
      }

      if (sortField === 'noRevisi') {
        const revA = Number(a.noRevisiTerakhir) || 0;
        const revB = Number(b.noRevisiTerakhir) || 0;
        return sortDirection === 'desc' ? revB - revA : revA - revB;
      }

      if (sortField === 'tglPosting') {
        const tA = a.tanggalPosting || '';
        const tB = b.tanggalPosting || '';
        return sortDirection === 'desc' ? tB.localeCompare(tA) : tA.localeCompare(tB);
      }

      if (sortField === 'periodeAngka') {
        valA = a.periodeAngka || 0;
        valB = b.periodeAngka || 0;
      } else if (activeTab === '51') {
        if (sortField === 'rpd') { valA = a.rincianJenisBelanja?.belanja51?.rpd || 0; valB = b.rincianJenisBelanja?.belanja51?.rpd || 0; }
        else if (sortField === 'realisasi') { valA = a.rincianJenisBelanja?.belanja51?.realisasi || 0; valB = b.rincianJenisBelanja?.belanja51?.realisasi || 0; }
        else if (sortField === 'deviasiRp') { valA = a.rincianJenisBelanja?.belanja51?.deviasiNominal || 0; valB = b.rincianJenisBelanja?.belanja51?.deviasiNominal || 0; }
        else { valA = a.rincianJenisBelanja?.belanja51?.persenDeviasi || 0; valB = b.rincianJenisBelanja?.belanja51?.persenDeviasi || 0; }
      } else if (activeTab === '52') {
        if (sortField === 'rpd') { valA = a.rincianJenisBelanja?.belanja52?.rpd || 0; valB = b.rincianJenisBelanja?.belanja52?.rpd || 0; }
        else if (sortField === 'realisasi') { valA = a.rincianJenisBelanja?.belanja52?.realisasi || 0; valB = b.rincianJenisBelanja?.belanja52?.realisasi || 0; }
        else if (sortField === 'deviasiRp') { valA = a.rincianJenisBelanja?.belanja52?.deviasiNominal || 0; valB = b.rincianJenisBelanja?.belanja52?.deviasiNominal || 0; }
        else { valA = a.rincianJenisBelanja?.belanja52?.persenDeviasi || 0; valB = b.rincianJenisBelanja?.belanja52?.persenDeviasi || 0; }
      } else if (activeTab === '53') {
        if (sortField === 'rpd') { valA = a.rincianJenisBelanja?.belanja53?.rpd || 0; valB = b.rincianJenisBelanja?.belanja53?.rpd || 0; }
        else if (sortField === 'realisasi') { valA = a.rincianJenisBelanja?.belanja53?.realisasi || 0; valB = b.rincianJenisBelanja?.belanja53?.realisasi || 0; }
        else if (sortField === 'deviasiRp') { valA = a.rincianJenisBelanja?.belanja53?.deviasiNominal || 0; valB = b.rincianJenisBelanja?.belanja53?.deviasiNominal || 0; }
        else { valA = a.rincianJenisBelanja?.belanja53?.persenDeviasi || 0; valB = b.rincianJenisBelanja?.belanja53?.persenDeviasi || 0; }
      } else if (activeTab === '57') {
        if (sortField === 'rpd') { valA = a.rincianJenisBelanja?.belanja57?.rpd || 0; valB = b.rincianJenisBelanja?.belanja57?.rpd || 0; }
        else if (sortField === 'realisasi') { valA = a.rincianJenisBelanja?.belanja57?.realisasi || 0; valB = b.rincianJenisBelanja?.belanja57?.realisasi || 0; }
        else if (sortField === 'deviasiRp') { valA = a.rincianJenisBelanja?.belanja57?.deviasiNominal || 0; valB = b.rincianJenisBelanja?.belanja57?.deviasiNominal || 0; }
        else { valA = a.rincianJenisBelanja?.belanja57?.persenDeviasi || 0; valB = b.rincianJenisBelanja?.belanja57?.persenDeviasi || 0; }
      } else {
        // MATRIKS
        if (sortField === 'rpd') { valA = a.rpdTotal || 0; valB = b.rpdTotal || 0; }
        else if (sortField === 'realisasi') { valA = a.realisasiTotal || 0; valB = b.realisasiTotal || 0; }
        else if (sortField === 'deviasiRp') { valA = a.deviasiNominalTotal || 0; valB = b.deviasiNominalTotal || 0; }
        else {
          // Default: bandingkan deviasi maksimum per jenis belanja yang aktif
          const r51A = a.rincianJenisBelanja?.belanja51;
          const r52A = a.rincianJenisBelanja?.belanja52;
          const r53A = a.rincianJenisBelanja?.belanja53;
          const r57A = a.rincianJenisBelanja?.belanja57;
          valA = Math.max(
            ((r51A?.rpd || 0) > 0 || (r51A?.realisasi || 0) > 0) ? (r51A?.persenDeviasi || 0) : 0,
            ((r52A?.rpd || 0) > 0 || (r52A?.realisasi || 0) > 0) ? (r52A?.persenDeviasi || 0) : 0,
            ((r53A?.rpd || 0) > 0 || (r53A?.realisasi || 0) > 0) ? (r53A?.persenDeviasi || 0) : 0,
            ((r57A?.rpd || 0) > 0 || (r57A?.realisasi || 0) > 0) ? (r57A?.persenDeviasi || 0) : 0
          );

          const r51B = b.rincianJenisBelanja?.belanja51;
          const r52B = b.rincianJenisBelanja?.belanja52;
          const r53B = b.rincianJenisBelanja?.belanja53;
          const r57B = b.rincianJenisBelanja?.belanja57;
          valB = Math.max(
            ((r51B?.rpd || 0) > 0 || (r51B?.realisasi || 0) > 0) ? (r51B?.persenDeviasi || 0) : 0,
            ((r52B?.rpd || 0) > 0 || (r52B?.realisasi || 0) > 0) ? (r52B?.persenDeviasi || 0) : 0,
            ((r53B?.rpd || 0) > 0 || (r53B?.realisasi || 0) > 0) ? (r53B?.persenDeviasi || 0) : 0,
            ((r57B?.rpd || 0) > 0 || (r57B?.realisasi || 0) > 0) ? (r57B?.persenDeviasi || 0) : 0
          );
        }
      }

      return sortDirection === 'desc' ? valB - valA : valA - valB;
    });
  }, [deviasiRecords, selectedPeriode, selectedKl, selectedKlasifikasi, selectedSeverity, searchTerm, activeTab, sortField, sortDirection]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    if (pageSize === -1) return filteredRecords;
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredRecords.length / pageSize);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalBaris = filteredRecords.length;
    const uniqueSatkers = new Set(filteredRecords.map(r => r.kodeSatker));
    const totalSatker = uniqueSatkers.size;

    const totalRpd = filteredRecords.reduce((sum, r) => sum + (r.rpdTotal || 0), 0);
    const totalRealisasi = filteredRecords.reduce((sum, r) => sum + (r.realisasiTotal || 0), 0);
    const totalDeviasiNominal = filteredRecords.reduce((sum, r) => sum + (r.deviasiNominalTotal || 0), 0);
    
    const avgPersenDeviasi = totalBaris > 0
      ? Number((filteredRecords.reduce((sum, r) => sum + (r.persenDeviasiTotal || 0), 0) / totalBaris).toFixed(2))
      : 0;

    // Per jenis belanja summary
    const sumRpd51 = filteredRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja51?.rpd || 0), 0);
    const sumReal51 = filteredRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja51?.realisasi || 0), 0);
    const sumDev51 = filteredRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja51?.deviasiNominal || 0), 0);

    const sumRpd52 = filteredRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja52?.rpd || 0), 0);
    const sumReal52 = filteredRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja52?.realisasi || 0), 0);
    const sumDev52 = filteredRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja52?.deviasiNominal || 0), 0);

    const sumRpd53 = filteredRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja53?.rpd || 0), 0);
    const sumReal53 = filteredRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja53?.realisasi || 0), 0);
    const sumDev53 = filteredRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja53?.deviasiNominal || 0), 0);

    const sumRpd57 = filteredRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja57?.rpd || 0), 0);
    const sumReal57 = filteredRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja57?.realisasi || 0), 0);
    const sumDev57 = filteredRecords.reduce((sum, r) => sum + (r.rincianJenisBelanja?.belanja57?.deviasiNominal || 0), 0);

    return {
      totalSatker,
      totalBaris,
      totalRpd,
      totalRealisasi,
      totalDeviasiNominal,
      avgPersenDeviasi,
      belanja51: { rpd: sumRpd51, real: sumReal51, dev: sumDev51 },
      belanja52: { rpd: sumRpd52, real: sumReal52, dev: sumDev52 },
      belanja53: { rpd: sumRpd53, real: sumReal53, dev: sumDev53 },
      belanja57: { rpd: sumRpd57, real: sumReal57, dev: sumDev57 }
    };
  }, [filteredRecords]);

  // Chart Data: RPD vs Realisasi per Jenis Belanja
  const belanjaChartData = useMemo(() => {
    return [
      {
        name: '51 Pegawai',
        Rencana: Number((metrics.belanja51.rpd / 1_000_000_000).toFixed(2)),
        Realisasi: Number((metrics.belanja51.real / 1_000_000_000).toFixed(2)),
        Deviasi: Number((metrics.belanja51.dev / 1_000_000_000).toFixed(2))
      },
      {
        name: '52 Barang',
        Rencana: Number((metrics.belanja52.rpd / 1_000_000_000).toFixed(2)),
        Realisasi: Number((metrics.belanja52.real / 1_000_000_000).toFixed(2)),
        Deviasi: Number((metrics.belanja52.dev / 1_000_000_000).toFixed(2))
      },
      {
        name: '53 Modal',
        Rencana: Number((metrics.belanja53.rpd / 1_000_000_000).toFixed(2)),
        Realisasi: Number((metrics.belanja53.real / 1_000_000_000).toFixed(2)),
        Deviasi: Number((metrics.belanja53.dev / 1_000_000_000).toFixed(2))
      },
      {
        name: '57 Bansos',
        Rencana: Number((metrics.belanja57.rpd / 1_000_000_000).toFixed(2)),
        Realisasi: Number((metrics.belanja57.real / 1_000_000_000).toFixed(2)),
        Deviasi: Number((metrics.belanja57.dev / 1_000_000_000).toFixed(2))
      }
    ];
  }, [metrics]);

  const handleExport = () => {
    exportDeviasiHal3ToExcel(filteredRecords, `Monitoring_Deviasi_Hal3_OMSPAN_${selectedPeriode === 'ALL' ? 'Semua_Periode' : `Periode_${selectedPeriode}`}.xlsx`);
  };

  const formatRupiah = (num: number) => {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
  };

  const handleHeaderSort = (field: 'rpd' | 'realisasi' | 'deviasiRp' | 'persenDeviasi' | 'kodeSatker' | 'periodeAngka' | 'klasifikasi' | 'noRevisi' | 'tglPosting') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Top Banner & Action Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Monitoring RPD Halaman III DIPA Satker
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Pemantauan Rencana Penarikan Dana (RPD) vs Realisasi SP2D per Periode Bulan &amp; Jenis Belanja (51, 52, 53, 57).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rencana RPD */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Total Rencana RPD
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
            {formatRupiah(metrics.totalRpd)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total dari <strong>{metrics.totalBaris}</strong> baris ({metrics.totalSatker} Satker unik)
          </p>
        </div>

        {/* Total Realisasi SP2D */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Total Realisasi SP2D
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {formatRupiah(metrics.totalRealisasi)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pencairan SP2D periode terpilih
          </p>
        </div>

        {/* Total Deviasi Rupiah */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Total Deviasi (Rp)
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
            {formatRupiah(metrics.totalDeviasiNominal)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Akumulasi selisih nominal |Realisasi - RPD|
          </p>
        </div>

        {/* Rata-rata % Deviasi */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Rata-rata % Deviasi
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
            {metrics.avgPersenDeviasi.toFixed(2)}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Batas deviasi normal: ≤ 5.00%
          </p>
        </div>
      </div>

      {/* RADAR & DAFTAR SATKER DEVIASI TINGGI (KHUSUS KPPN / ADMIN MONITORING DENGAN AKSES PROTEKSI) */}
      <div className={`rounded-3xl border-2 transition-all overflow-hidden shadow-md ${
        isUnlocked
          ? 'bg-gradient-to-br from-rose-50/70 via-white to-amber-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20 border-rose-200 dark:border-rose-900/60'
          : (isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200')
      }`}>
        {/* Header Bar */}
        <div className={`p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          isRadarExpanded && isUnlocked ? 'border-b border-rose-200/60 dark:border-rose-900/40 pb-5' : ''
        }`}>
          <div className="flex items-start gap-3.5 flex-1">
            <div className={`p-3 rounded-2xl shadow-lg shrink-0 ${
              isUnlocked 
                ? 'bg-rose-600 text-white shadow-rose-600/30' 
                : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
            }`}>
              {isUnlocked ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : <Shield className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  RADAR PENGAWASAN INTERNAL KPPN 026
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  isUnlocked 
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                }`}>
                  {isUnlocked ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Akses Radar Terbuka ({alertStats.countAny} Satker Terdeteksi)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Khusus Petugas KPPN (Terkunci)</span>
                    </>
                  )}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Radar Satker Deviasi Tinggi &amp; Sorotan Perhatian Khusus
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                {isUnlocked
                  ? 'Pemantauan deviasi per jenis belanja (>10%) pada akun 51 Pegawai, 52 Barang, 53 Modal, atau 57 Bansos untuk langkah pembinaan taktis KPPN.'
                  : 'Penilaian deviasi dihitung secara independen per jenis belanja (51, 52, 53, 57). Buka Radar Pengawasan untuk memantau rincian indikator.'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isUnlocked && (
              <button
                type="button"
                onClick={handleLockRadar}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 text-slate-500 dark:text-slate-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Kunci kembali akses radar"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kunci Akses</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleRadar}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                isUnlocked 
                  ? (isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700' 
                      : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300')
                  : 'bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-rose-600/20'
              }`}
            >
              {isUnlocked ? (
                <>
                  {isRadarExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span>{isRadarExpanded ? 'Sembunyikan Radar' : 'Buka Radar Satker'}</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Buka Radar Pengawasan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Radar Body Content (Only rendered when expanded and unlocked) */}
        {isRadarExpanded && isUnlocked && (
          <div className="p-5 sm:p-6 space-y-5 animate-in fade-in duration-200">

          {/* Quick Filter Pill Buttons with Live Counters (Per Jenis Belanja) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* Semua Perhatian Khusus */}
            <button
              type="button"
              onClick={() => {
                setSelectedSeverity(selectedSeverity === 'ALERT_ANY' ? 'ALL' : 'ALERT_ANY');
                setCurrentPage(1);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedSeverity === 'ALERT_ANY'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30'
                  : 'bg-white dark:bg-slate-800/80 border-rose-200 dark:border-rose-900/60 hover:border-rose-400 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-80 flex items-center justify-between">
                <span>Semua Perhatian</span>
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-black font-mono">{alertStats.countAny}</span>
                <span className="text-[10px] font-bold opacity-75">&gt; 10% per akun</span>
              </div>
            </button>

            {/* Belanja 51 Pegawai > 10% */}
            <button
              type="button"
              onClick={() => {
                setSelectedSeverity(selectedSeverity === 'ALERT_51' ? 'ALL' : 'ALERT_51');
                setCurrentPage(1);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedSeverity === 'ALERT_51'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-80 flex items-center justify-between">
                <span>Akun 51 Pegawai</span>
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-black font-mono">{alertStats.count51}</span>
                <span className="text-[10px] font-bold opacity-75">51 &gt; 10%</span>
              </div>
            </button>

            {/* Belanja 52 Barang > 10% */}
            <button
              type="button"
              onClick={() => {
                setSelectedSeverity(selectedSeverity === 'ALERT_52' ? 'ALL' : 'ALERT_52');
                setCurrentPage(1);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedSeverity === 'ALERT_52'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-80 flex items-center justify-between">
                <span>Akun 52 Barang</span>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-black font-mono">{alertStats.count52}</span>
                <span className="text-[10px] font-bold opacity-75">52 &gt; 10%</span>
              </div>
            </button>

            {/* Belanja 53 Modal > 10% */}
            <button
              type="button"
              onClick={() => {
                setSelectedSeverity(selectedSeverity === 'ALERT_53' ? 'ALL' : 'ALERT_53');
                setCurrentPage(1);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedSeverity === 'ALERT_53'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-80 flex items-center justify-between">
                <span>Akun 53 Modal</span>
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-black font-mono">{alertStats.count53}</span>
                <span className="text-[10px] font-bold opacity-75">53 &gt; 10%</span>
              </div>
            </button>

            {/* Belanja 57 Bansos > 10% */}
            <button
              type="button"
              onClick={() => {
                setSelectedSeverity(selectedSeverity === 'ALERT_57' ? 'ALL' : 'ALERT_57');
                setCurrentPage(1);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedSeverity === 'ALERT_57'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-80 flex items-center justify-between">
                <span>Akun 57 Bansos</span>
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-black font-mono">{alertStats.count57}</span>
                <span className="text-[10px] font-bold opacity-75">57 &gt; 10%</span>
              </div>
            </button>

            {/* Terkendali / Aman */}
            <button
              type="button"
              onClick={() => {
                setSelectedSeverity(selectedSeverity === 'SAFE' ? 'ALL' : 'SAFE');
                setCurrentPage(1);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedSeverity === 'SAFE'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-emerald-400 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-80 flex items-center justify-between">
                <span>Deviasi Terkendali</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-black font-mono">{alertStats.countSafe}</span>
                <span className="text-[10px] font-bold opacity-75">Semua Akun ≤ 5%</span>
              </div>
            </button>
          </div>

          {/* Highlighted Satker Cards Grid (Large, Legible, Easy to Tap/Inspect) */}
          {showRadarCards && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Menampilkan <strong>{Math.min(6, topHighDeviasiSatkers.length)}</strong> satker teratas dengan deviasi tertinggi per akun belanja (dari total {topHighDeviasiSatkers.length} satker dalam filter):
                </span>
                {selectedSeverity !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSeverity('ALL');
                      setCurrentPage(1);
                    }}
                    className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                  >
                    Tampilkan Semua Satker
                  </button>
                )}
              </div>

              {topHighDeviasiSatkers.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-800/80 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <div className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                    Tidak Ada Satker dengan Deviasi Tinggi pada Filter Ini
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Seluruh penarikan dana sesuai dengan perencanaan atau berada di bawah ambang batas deviasi 10%.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {topHighDeviasiSatkers.slice(0, 6).map((r) => {
                    const r51 = r.rincianJenisBelanja?.belanja51;
                    const r52 = r.rincianJenisBelanja?.belanja52;
                    const r53 = r.rincianJenisBelanja?.belanja53;
                    const r57 = r.rincianJenisBelanja?.belanja57;

                    const has51 = ((r51?.rpd || 0) > 0 || (r51?.realisasi || 0) > 0);
                    const has52 = ((r52?.rpd || 0) > 0 || (r52?.realisasi || 0) > 0);
                    const has53 = ((r53?.rpd || 0) > 0 || (r53?.realisasi || 0) > 0);
                    const has57 = ((r57?.rpd || 0) > 0 || (r57?.realisasi || 0) > 0);

                    const p51 = has51 ? Number(r51?.persenDeviasi || 0) : 0;
                    const p52 = has52 ? Number(r52?.persenDeviasi || 0) : 0;
                    const p53 = has53 ? Number(r53?.persenDeviasi || 0) : 0;
                    const p57 = has57 ? Number(r57?.persenDeviasi || 0) : 0;

                    const maxAccountDev = Math.max(p51, p52, p53, p57);
                    const isExceeded = maxAccountDev > 10;

                    const highAccountsList: string[] = [];
                    if (has51 && p51 > 10) highAccountsList.push(`51 (${p51.toFixed(1)}%)`);
                    if (has52 && p52 > 10) highAccountsList.push(`52 (${p52.toFixed(1)}%)`);
                    if (has53 && p53 > 10) highAccountsList.push(`53 (${p53.toFixed(1)}%)`);
                    if (has57 && p57 > 10) highAccountsList.push(`57 (${p57.toFixed(1)}%)`);

                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRecordDetail(r)}
                        className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                      >
                        {/* Card Header: Satker Title & Periode */}
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px]">
                              {r.periodeFormatted || `Periode ${r.periodeAngka || r.periodeBulan}`}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-black border ${
                              isExceeded
                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300'
                            }`}>
                              {highAccountsList.length > 0 ? `Perhatian: Akun ${highAccountsList[0]}` : `Deviasi Terkendali`}
                            </span>
                          </div>

                          <h4 className="font-black text-sm text-slate-900 dark:text-white mt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                            {r.namaSatker}
                          </h4>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            Kode Satker: <strong className="text-indigo-600 dark:text-indigo-400">{r.kodeSatker}</strong>
                            {r.kementerianLembaga && <span> • {r.kementerianLembaga.slice(0, 20)}</span>}
                          </div>
                        </div>

                        {/* Account Deviasi Breakdown Pills */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Status Deviasi per Akun Belanja:
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                            {/* 51 */}
                            <div className={`py-1 px-0.5 rounded-lg font-bold border ${
                              !has51
                                ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200/50 dark:border-slate-800'
                                : p51 > 10
                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300'
                                : p51 > 5
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                            }`}>
                              <div>51 Peg</div>
                              <div className="text-[11px]">{has51 ? `${p51.toFixed(1)}%` : '-'}</div>
                            </div>

                            {/* 52 */}
                            <div className={`py-1 px-0.5 rounded-lg font-bold border ${
                              !has52
                                ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200/50 dark:border-slate-800'
                                : p52 > 10
                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300'
                                : p52 > 5
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                            }`}>
                              <div>52 Brg</div>
                              <div className="text-[11px]">{has52 ? `${p52.toFixed(1)}%` : '-'}</div>
                            </div>

                            {/* 53 */}
                            <div className={`py-1 px-0.5 rounded-lg font-bold border ${
                              !has53
                                ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200/50 dark:border-slate-800'
                                : p53 > 10
                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300'
                                : p53 > 5
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                            }`}>
                              <div>53 Mod</div>
                              <div className="text-[11px]">{has53 ? `${p53.toFixed(1)}%` : '-'}</div>
                            </div>

                            {/* 57 */}
                            <div className={`py-1 px-0.5 rounded-lg font-bold border ${
                              !has57
                                ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200/50 dark:border-slate-800'
                                : p57 > 10
                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300'
                                : p57 > 5
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                            }`}>
                              <div>57 Ban</div>
                              <div className="text-[11px]">{has57 ? `${p57.toFixed(1)}%` : '-'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Deviasi Rupiah & Button */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <div className="text-[10px] text-slate-400">Akun Perhatian Utama:</div>
                            <div className="font-mono font-extrabold text-rose-600 dark:text-rose-400">
                              {highAccountsList.length > 0 ? highAccountsList.join(', ') : 'Terkendali'}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecordDetail(r);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>Rincian</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>

      {/* Rincian RPD & Realisasi per Jenis Belanja (51, 52, 53, 57) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Perbandingan Rencana &amp; Realisasi per Akun Belanja
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Belanja Pegawai (51), Belanja Barang (52), Belanja Modal (53), dan Belanja Bansos (57).
            </p>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 51 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black text-indigo-600 dark:text-indigo-400">
              <span>Belanja Pegawai (51)</span>
              <span className="font-mono">51</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between">
              <span>Rencana:</span>
              <strong className="font-mono">{formatRupiah(metrics.belanja51.rpd)}</strong>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between">
              <span>Realisasi:</span>
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatRupiah(metrics.belanja51.real)}</strong>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
              <span>Deviasi Rp:</span>
              <strong className="font-mono text-rose-600 dark:text-rose-400">{formatRupiah(metrics.belanja51.dev)}</strong>
            </div>
          </div>

          {/* 52 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black text-indigo-600 dark:text-indigo-400">
              <span>Belanja Barang (52)</span>
              <span className="font-mono">52</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between">
              <span>Rencana:</span>
              <strong className="font-mono">{formatRupiah(metrics.belanja52.rpd)}</strong>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between">
              <span>Realisasi:</span>
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatRupiah(metrics.belanja52.real)}</strong>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
              <span>Deviasi Rp:</span>
              <strong className="font-mono text-rose-600 dark:text-rose-400">{formatRupiah(metrics.belanja52.dev)}</strong>
            </div>
          </div>

          {/* 53 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black text-indigo-600 dark:text-indigo-400">
              <span>Belanja Modal (53)</span>
              <span className="font-mono">53</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between">
              <span>Rencana:</span>
              <strong className="font-mono">{formatRupiah(metrics.belanja53.rpd)}</strong>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between">
              <span>Realisasi:</span>
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatRupiah(metrics.belanja53.real)}</strong>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
              <span>Deviasi Rp:</span>
              <strong className="font-mono text-rose-600 dark:text-rose-400">{formatRupiah(metrics.belanja53.dev)}</strong>
            </div>
          </div>

          {/* 57 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black text-indigo-600 dark:text-indigo-400">
              <span>Belanja Bansos (57)</span>
              <span className="font-mono">57</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between">
              <span>Rencana:</span>
              <strong className="font-mono">{formatRupiah(metrics.belanja57.rpd)}</strong>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between">
              <span>Realisasi:</span>
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatRupiah(metrics.belanja57.real)}</strong>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
              <span>Deviasi Rp:</span>
              <strong className="font-mono text-rose-600 dark:text-rose-400">{formatRupiah(metrics.belanja57.dev)}</strong>
            </div>
          </div>
        </div>

        {/* Chart Visualization */}
        <div className="h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={belanjaChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.5} />
              <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
              <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} unit=" M" />
              <RechartsTooltip
                formatter={(val: any) => [`Rp ${val} Miliar`, '']}
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Rencana" fill="#6366f1" radius={[6, 6, 0, 0]} name="Rencana RPD (Miliar)" />
              <Bar dataKey="Realisasi" fill="#10b981" radius={[6, 6, 0, 0]} name="Realisasi SP2D (Miliar)" />
              <Bar dataKey="Deviasi" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Deviasi Rp (Miliar)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter & View Mode Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
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
            📋 Matriks Lengkap (51, 52, 53, 57)
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

        {/* Filter Row: Search & Periode Dropdown & Status Deviasi & Klasifikasi Satker */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode/nama/KPPN/blokir..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter Status / Sorotan Deviasi per Jenis Belanja */}
          <div className="sm:col-span-3">
            <select
              value={selectedSeverity}
              onChange={(e) => {
                setSelectedSeverity(e.target.value as SeverityFilterType);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-rose-700 dark:text-rose-400 font-bold"
            >
              <option value="ALL">🔍 Semua Status Deviasi</option>
              <option value="ALERT_ANY">🚨 Ada Akun Belanja &gt; 10%</option>
              <option value="ALERT_51">🏢 Deviasi 51 Pegawai &gt; 10%</option>
              <option value="ALERT_52">📦 Deviasi 52 Barang &gt; 10%</option>
              <option value="ALERT_53">🏗️ Deviasi 53 Modal &gt; 10%</option>
              <option value="ALERT_57">🤝 Deviasi 57 Bansos &gt; 10%</option>
              <option value="SAFE">✅ Seluruh Akun Aman / Terkendali (≤5%)</option>
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
              className={`w-full py-2.5 px-3 rounded-2xl border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                selectedKlasifikasi === 'FULL_BLOKIR'
                  ? 'border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700'
                  : selectedKlasifikasi === 'NON_FULL_BLOKIR'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <option value="ALL">🏷️ Semua Klasifikasi (Kolom Y)</option>
              <option value="FULL_BLOKIR">🔒 Full Blokir ({klasifikasiStats.countFullBlokir})</option>
              <option value="NON_FULL_BLOKIR">🔓 Non Full Blokir ({klasifikasiStats.countNonFullBlokir})</option>
              <option value="BLU">🏦 Badan Layanan Umum (BLU)</option>
              <option value="NON_BLU">🏛️ Non-BLU</option>
              {klasifikasiList.length > 0 && <option disabled>──────────</option>}
              {klasifikasiList.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Filter Periode Bulan (Kolom F pada Excel) */}
          <div className="sm:col-span-2">
            <select
              value={selectedPeriode}
              onChange={(e) => {
                setSelectedPeriode(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">-- K/L ({klList.length}) --</option>
              {klList.map(kl => (
                <option key={kl} value={kl}>{kl.slice(0, 20)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Tags for Klasifikasi Satker */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3" /> Quick Filter Blokir:
          </span>
          <button
            type="button"
            onClick={() => { setSelectedKlasifikasi('ALL'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedKlasifikasi === 'ALL'
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Semua ({deviasiRecords.length})
          </button>
          <button
            type="button"
            onClick={() => { setSelectedKlasifikasi('FULL_BLOKIR'); setCurrentPage(1); }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              selectedKlasifikasi === 'FULL_BLOKIR'
                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60 hover:bg-rose-100'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            Full Blokir ({klasifikasiStats.countFullBlokir})
          </button>
          <button
            type="button"
            onClick={() => { setSelectedKlasifikasi('NON_FULL_BLOKIR'); setCurrentPage(1); }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              selectedKlasifikasi === 'NON_FULL_BLOKIR'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Non Full Blokir ({klasifikasiStats.countNonFullBlokir})
          </button>
          <button
            type="button"
            onClick={() => { setSelectedKlasifikasi('BLU'); setCurrentPage(1); }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              selectedKlasifikasi === 'BLU'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-100'
            }`}
          >
            <Building2 className="w-3 h-3" />
            Satker BLU ({klasifikasiStats.countBlu})
          </button>
        </div>

        {/* Filter Reset if active */}
        {(searchTerm || selectedPeriode !== 'ALL' || selectedKl !== 'ALL' || selectedKlasifikasi !== 'ALL' || selectedSeverity !== 'ALL') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">
              Menampilkan <strong>{filteredRecords.length}</strong> dari <strong>{deviasiRecords.length}</strong> baris data.
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedPeriode('ALL');
                setSelectedKl('ALL');
                setSelectedKlasifikasi('ALL');
                setSelectedSeverity('ALL');
                setCurrentPage(1);
              }}
              className="text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* Monitoring Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Tabel Monitoring RPD Halaman III DIPA Satker
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeTab === 'TOTAL' && 'Menampilkan Total RPD, Realisasi, Deviasi Nominal, dan % Deviasi seluruh akun.'}
              {activeTab === '51' && 'Menampilkan RPD, Realisasi, Deviasi Rp, dan % Deviasi untuk Belanja Pegawai (51).'}
              {activeTab === '52' && 'Menampilkan RPD, Realisasi, Deviasi Rp, dan % Deviasi untuk Belanja Barang (52).'}
              {activeTab === '53' && 'Menampilkan RPD, Realisasi, Deviasi Rp, dan % Deviasi untuk Belanja Modal (53).'}
              {activeTab === '57' && 'Menampilkan RPD, Realisasi, Deviasi Rp, dan % Deviasi untuk Belanja Bansos (57).'}
              {activeTab === 'MATRIKS' && 'Matriks Lengkap Rencana, Realisasi, Deviasi Rp, dan % Deviasi (51, 52, 53, 57).'}
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
          {activeTab !== 'MATRIKS' ? (
            <table className="w-full text-left text-xs min-w-[1000px]">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-3 text-center w-12">No</th>
                  <th
                    className="py-3.5 px-4 min-w-[260px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    onClick={() => handleHeaderSort('kodeSatker')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Satuan Kerja</span>
                      {sortField === 'kodeSatker' && (sortDirection === 'desc' ? <ChevronDown className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />)}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-3 min-w-[110px] text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    onClick={() => handleHeaderSort('periodeAngka')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Periode</span>
                      {sortField === 'periodeAngka' && (sortDirection === 'desc' ? <ChevronDown className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />)}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-3 min-w-[140px] text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300"
                    onClick={() => handleHeaderSort('klasifikasi')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Klasifikasi (Kolom Y)</span>
                      {sortField === 'klasifikasi' && (sortDirection === 'desc' ? <ChevronDown className="w-3.5 h-3.5 text-amber-600" /> : <ChevronUp className="w-3.5 h-3.5 text-amber-600" />)}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 text-right min-w-[150px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-indigo-900 dark:text-indigo-300"
                    onClick={() => handleHeaderSort('rpd')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>
                        {activeTab === 'TOTAL' ? 'Rencana RPD Total' : `Rencana ${activeTab}`} (Rp)
                      </span>
                      {sortField === 'rpd' && (sortDirection === 'desc' ? <ChevronDown className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />)}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 text-right min-w-[150px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-emerald-900 dark:text-emerald-300"
                    onClick={() => handleHeaderSort('realisasi')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>
                        {activeTab === 'TOTAL' ? 'Realisasi SP2D Total' : `Realisasi ${activeTab}`} (Rp)
                      </span>
                      {sortField === 'realisasi' && (sortDirection === 'desc' ? <ChevronDown className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronUp className="w-3.5 h-3.5 text-emerald-600" />)}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 text-right min-w-[150px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-rose-900 dark:text-rose-300"
                    onClick={() => handleHeaderSort('deviasiRp')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>
                        {activeTab === 'TOTAL' ? 'Deviasi Nominal' : `Deviasi ${activeTab}`} (Rp)
                      </span>
                      {sortField === 'deviasiRp' && (sortDirection === 'desc' ? <ChevronDown className="w-3.5 h-3.5 text-rose-600" /> : <ChevronUp className="w-3.5 h-3.5 text-rose-600" />)}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-3 text-center min-w-[110px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    onClick={() => handleHeaderSort('persenDeviasi')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>% Deviasi</span>
                      {sortField === 'persenDeviasi' && (sortDirection === 'desc' ? <ChevronDown className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />)}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-3 text-center min-w-[90px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    onClick={() => handleHeaderSort('noRevisi')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Revisi</span>
                      {sortField === 'noRevisi' && (sortDirection === 'desc' ? <ChevronDown className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Tidak ada data yang cocok dengan kriteria filter atau pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r, idx) => {
                    const globalIdx = (currentPage - 1) * (pageSize > 0 ? pageSize : 0) + idx + 1;

                    // Compute values based on tab
                    let rowRpd = r.rpdTotal;
                    let rowReal = r.realisasiTotal;
                    let rowDev = r.deviasiNominalTotal;
                    let rowPersen = r.persenDeviasiTotal;

                    if (activeTab === '51') {
                      rowRpd = r.rincianJenisBelanja?.belanja51?.rpd || 0;
                      rowReal = r.rincianJenisBelanja?.belanja51?.realisasi || 0;
                      rowDev = r.rincianJenisBelanja?.belanja51?.deviasiNominal || 0;
                      rowPersen = r.rincianJenisBelanja?.belanja51?.persenDeviasi || 0;
                    } else if (activeTab === '52') {
                      rowRpd = r.rincianJenisBelanja?.belanja52?.rpd || 0;
                      rowReal = r.rincianJenisBelanja?.belanja52?.realisasi || 0;
                      rowDev = r.rincianJenisBelanja?.belanja52?.deviasiNominal || 0;
                      rowPersen = r.rincianJenisBelanja?.belanja52?.persenDeviasi || 0;
                    } else if (activeTab === '53') {
                      rowRpd = r.rincianJenisBelanja?.belanja53?.rpd || 0;
                      rowReal = r.rincianJenisBelanja?.belanja53?.realisasi || 0;
                      rowDev = r.rincianJenisBelanja?.belanja53?.deviasiNominal || 0;
                      rowPersen = r.rincianJenisBelanja?.belanja53?.persenDeviasi || 0;
                    } else if (activeTab === '57') {
                      rowRpd = r.rincianJenisBelanja?.belanja57?.rpd || 0;
                      rowReal = r.rincianJenisBelanja?.belanja57?.realisasi || 0;
                      rowDev = r.rincianJenisBelanja?.belanja57?.deviasiNominal || 0;
                      rowPersen = r.rincianJenisBelanja?.belanja57?.persenDeviasi || 0;
                    }

                    return (
                      <tr
                        key={r.id}
                        className="transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                        onClick={() => setSelectedRecordDetail(r)}
                      >
                        {/* No */}
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400">
                          {globalIdx}
                        </td>

                        {/* Satker */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1">
                              {r.namaSatker}
                            </div>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            <span>Kode: <strong className="text-indigo-600 dark:text-indigo-400">{r.kodeSatker}</strong></span>
                            {r.kodeKppn && <span>• KPPN: {r.kodeKppn}</span>}
                            {r.kodeEselon1 && <span>• Eselon: {r.kodeEselon1}</span>}
                            {/* Sub-account alert tags */}
                            {(((r.rincianJenisBelanja?.belanja51?.rpd || 0) > 0 || (r.rincianJenisBelanja?.belanja51?.realisasi || 0) > 0) && (r.rincianJenisBelanja?.belanja51?.persenDeviasi || 0) > 10) && (
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                                51: {r.rincianJenisBelanja?.belanja51?.persenDeviasi?.toFixed(1)}%
                              </span>
                            )}
                            {(((r.rincianJenisBelanja?.belanja52?.rpd || 0) > 0 || (r.rincianJenisBelanja?.belanja52?.realisasi || 0) > 0) && (r.rincianJenisBelanja?.belanja52?.persenDeviasi || 0) > 10) && (
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                                52: {r.rincianJenisBelanja?.belanja52?.persenDeviasi?.toFixed(1)}%
                              </span>
                            )}
                            {(((r.rincianJenisBelanja?.belanja53?.rpd || 0) > 0 || (r.rincianJenisBelanja?.belanja53?.realisasi || 0) > 0) && (r.rincianJenisBelanja?.belanja53?.persenDeviasi || 0) > 10) && (
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                                53: {r.rincianJenisBelanja?.belanja53?.persenDeviasi?.toFixed(1)}%
                              </span>
                            )}
                            {(((r.rincianJenisBelanja?.belanja57?.rpd || 0) > 0 || (r.rincianJenisBelanja?.belanja57?.realisasi || 0) > 0) && (r.rincianJenisBelanja?.belanja57?.persenDeviasi || 0) > 10) && (
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                                57: {r.rincianJenisBelanja?.belanja57?.persenDeviasi?.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Periode */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs">
                            {r.periodeFormatted || `Periode ${r.periodeAngka || r.periodeBulan}`}
                          </span>
                        </td>

                        {/* Klasifikasi Satker (Kolom Y) */}
                        <td className="py-3.5 px-3 text-center">
                          {renderKlasifikasiBadge(r.klasifikasiSatker)}
                        </td>

                        {/* Rencana RPD */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                          {formatRupiah(rowRpd)}
                        </td>

                        {/* Realisasi SP2D */}
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                          {formatRupiah(rowReal)}
                        </td>

                        {/* Deviasi Nominal */}
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                          {formatRupiah(rowDev)}
                        </td>

                        {/* % Deviasi */}
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

                        {/* No. Revisi */}
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
          ) : (
            /* Matriks Lengkap OMSPAN Table (51, 52, 53, 57 side by side with Kolom Y Klasifikasi) */
            <table className="w-full text-left text-xs min-w-[1550px]">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th rowSpan={2} className="py-3 px-2 text-center w-10 border-r border-slate-200 dark:border-slate-700">No</th>
                  <th rowSpan={2} className="py-3 px-3 min-w-[210px] border-r border-slate-200 dark:border-slate-700">Satker</th>
                  <th rowSpan={2} className="py-3 px-2 text-center w-16 border-r border-slate-200 dark:border-slate-700">Bln</th>
                  <th rowSpan={2} className="py-3 px-3 text-center min-w-[140px] border-r border-slate-200 dark:border-slate-700 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300">
                    Klasifikasi (Y)
                  </th>
                  <th colSpan={4} className="py-2 px-2 text-center bg-indigo-50/80 dark:bg-indigo-950/40 border-r border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300">
                    Rencana (RPD)
                  </th>
                  <th colSpan={4} className="py-2 px-2 text-center bg-emerald-50/80 dark:bg-emerald-950/40 border-r border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-300">
                    Penyerapan (Realisasi)
                  </th>
                  <th colSpan={4} className="py-2 px-2 text-center bg-rose-50/80 dark:bg-rose-950/40 border-r border-slate-200 dark:border-slate-700 text-rose-700 dark:text-rose-300">
                    Deviasi (Rp)
                  </th>
                  <th colSpan={4} className="py-2 px-2 text-center bg-amber-50/80 dark:bg-amber-950/40 border-r border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-300">
                    % Deviasi
                  </th>
                  <th rowSpan={2} className="py-3 px-2 text-center w-14">Revisi</th>
                </tr>
                <tr className="border-t border-slate-200 dark:border-slate-700 text-[9px] font-mono">
                  {/* Rencana */}
                  <th className="py-2 px-2 text-right bg-indigo-50/30 dark:bg-indigo-950/20">51</th>
                  <th className="py-2 px-2 text-right bg-indigo-50/30 dark:bg-indigo-950/20">52</th>
                  <th className="py-2 px-2 text-right bg-indigo-50/30 dark:bg-indigo-950/20">53</th>
                  <th className="py-2 px-2 text-right bg-indigo-50/30 dark:bg-indigo-950/20 border-r border-slate-200 dark:border-slate-700">57</th>
                  {/* Realisasi */}
                  <th className="py-2 px-2 text-right bg-emerald-50/30 dark:bg-emerald-950/20">51</th>
                  <th className="py-2 px-2 text-right bg-emerald-50/30 dark:bg-emerald-950/20">52</th>
                  <th className="py-2 px-2 text-right bg-emerald-50/30 dark:bg-emerald-950/20">53</th>
                  <th className="py-2 px-2 text-right bg-emerald-50/30 dark:bg-emerald-950/20 border-r border-slate-200 dark:border-slate-700">57</th>
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
                {paginatedRecords.map((r, idx) => {
                  const globalIdx = (currentPage - 1) * (pageSize > 0 ? pageSize : 0) + idx + 1;
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
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
                      {/* Rencana */}
                      <td className="py-2.5 px-2 text-right font-mono">{formatRupiah(r.rincianJenisBelanja?.belanja51?.rpd || 0)}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{formatRupiah(r.rincianJenisBelanja?.belanja52?.rpd || 0)}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{formatRupiah(r.rincianJenisBelanja?.belanja53?.rpd || 0)}</td>
                      <td className="py-2.5 px-2 text-right font-mono border-r border-slate-200 dark:border-slate-800">{formatRupiah(r.rincianJenisBelanja?.belanja57?.rpd || 0)}</td>
                      {/* Realisasi */}
                      <td className="py-2.5 px-2 text-right font-mono text-emerald-600 font-bold">{formatRupiah(r.rincianJenisBelanja?.belanja51?.realisasi || 0)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-emerald-600 font-bold">{formatRupiah(r.rincianJenisBelanja?.belanja52?.realisasi || 0)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-emerald-600 font-bold">{formatRupiah(r.rincianJenisBelanja?.belanja53?.realisasi || 0)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-emerald-600 font-bold border-r border-slate-200 dark:border-slate-800">{formatRupiah(r.rincianJenisBelanja?.belanja57?.realisasi || 0)}</td>
                      {/* Deviasi Rp */}
                      <td className="py-2.5 px-2 text-right font-mono text-rose-600">{formatRupiah(r.rincianJenisBelanja?.belanja51?.deviasiNominal || 0)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-rose-600">{formatRupiah(r.rincianJenisBelanja?.belanja52?.deviasiNominal || 0)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-rose-600">{formatRupiah(r.rincianJenisBelanja?.belanja53?.deviasiNominal || 0)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-rose-600 border-r border-slate-200 dark:border-slate-800">{formatRupiah(r.rincianJenisBelanja?.belanja57?.deviasiNominal || 0)}</td>
                      {/* % Deviasi */}
                      <td className="py-2.5 px-2 text-center font-mono">{(r.rincianJenisBelanja?.belanja51?.persenDeviasi || 0).toFixed(2)}%</td>
                      <td className="py-2.5 px-2 text-center font-mono">{(r.rincianJenisBelanja?.belanja52?.persenDeviasi || 0).toFixed(2)}%</td>
                      <td className="py-2.5 px-2 text-center font-mono">{(r.rincianJenisBelanja?.belanja53?.persenDeviasi || 0).toFixed(2)}%</td>
                      <td className="py-2.5 px-2 text-center font-mono border-r border-slate-200 dark:border-slate-800">{(r.rincianJenisBelanja?.belanja57?.persenDeviasi || 0).toFixed(2)}%</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-500">
                        {r.noRevisiTerakhir !== undefined && r.noRevisiTerakhir !== '' ? `Rev ${r.noRevisiTerakhir}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {pageSize !== -1 && totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> (Total {filteredRecords.length} Baris)
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
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
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

      {/* Modal Detail Rincian Satker */}
      {selectedRecordDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-start justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200">
                    {selectedRecordDetail.periodeFormatted || `Periode ${selectedRecordDetail.periodeAngka || selectedRecordDetail.periodeBulan}`}
                  </span>
                  {selectedRecordDetail.klasifikasiSatker && (
                    <span className="text-[10px]">
                      {renderKlasifikasiBadge(selectedRecordDetail.klasifikasiSatker)}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black mt-2">
                  [{selectedRecordDetail.kodeSatker}] {selectedRecordDetail.namaSatker}
                </h3>
                <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3 mt-1.5">
                  <span>KPPN: <strong>{selectedRecordDetail.kodeKppn || '026'}</strong></span>
                  {selectedRecordDetail.kodeEselon1 && <span>• Eselon: <strong>{selectedRecordDetail.kodeEselon1}</strong></span>}
                  {selectedRecordDetail.kementerianLembaga && <span>• K/L: <strong>{selectedRecordDetail.kementerianLembaga}</strong></span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecordDetail(null)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Full Blokir Notification if applicable */}
              {selectedRecordDetail.klasifikasiSatker && (
                selectedRecordDetail.klasifikasiSatker.toUpperCase().includes('FULL BLOKIR') &&
                !selectedRecordDetail.klasifikasiSatker.toUpperCase().startsWith('NON')
              ) && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-rose-900 dark:text-rose-200 block font-black">Status Satker: FULL BLOKIR (Kolom Y)</strong>
                    <span className="text-rose-700 dark:text-rose-300">
                      Seluruh pagu pada DIPA satker ini berstatus blokir anggaran atau belum dapat ditarik sampai revisi DIPA / buka blokir diproses.
                    </span>
                  </div>
                </div>
              )}
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Total Rencana RPD</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {formatRupiah(selectedRecordDetail.rpdTotal)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Total Realisasi SP2D</div>
                  <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatRupiah(selectedRecordDetail.realisasiTotal)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-center">
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">% Deviasi Total</div>
                  <div className="text-sm font-black text-indigo-950 dark:text-indigo-200 mt-0.5">
                    {selectedRecordDetail.persenDeviasiTotal.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Rincian per Jenis Belanja (51, 52, 53, 57) */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5">
                  Rincian Penarikan per Akun Belanja (OMSPAN)
                </h4>
                <div className="space-y-2.5 text-xs">
                  {/* Belanja Pegawai 51 */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-slate-100">51 - Belanja Pegawai</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Rencana: <strong className="text-slate-700 dark:text-slate-300">{formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja51?.rpd || 0)}</strong> • Realisasi: <strong className="text-emerald-600">{formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja51?.realisasi || 0)}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-rose-600">Deviasi: {formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja51?.deviasiNominal || 0)}</div>
                      <div className="text-[10px] font-bold text-slate-500 font-mono">{(selectedRecordDetail.rincianJenisBelanja?.belanja51?.persenDeviasi || 0).toFixed(2)}%</div>
                    </div>
                  </div>

                  {/* Belanja Barang 52 */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-slate-100">52 - Belanja Barang</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Rencana: <strong className="text-slate-700 dark:text-slate-300">{formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja52?.rpd || 0)}</strong> • Realisasi: <strong className="text-emerald-600">{formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja52?.realisasi || 0)}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-rose-600">Deviasi: {formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja52?.deviasiNominal || 0)}</div>
                      <div className="text-[10px] font-bold text-slate-500 font-mono">{(selectedRecordDetail.rincianJenisBelanja?.belanja52?.persenDeviasi || 0).toFixed(2)}%</div>
                    </div>
                  </div>

                  {/* Belanja Modal 53 */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-slate-100">53 - Belanja Modal</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Rencana: <strong className="text-slate-700 dark:text-slate-300">{formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja53?.rpd || 0)}</strong> • Realisasi: <strong className="text-emerald-600">{formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja53?.realisasi || 0)}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-rose-600">Deviasi: {formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja53?.deviasiNominal || 0)}</div>
                      <div className="text-[10px] font-bold text-slate-500 font-mono">{(selectedRecordDetail.rincianJenisBelanja?.belanja53?.persenDeviasi || 0).toFixed(2)}%</div>
                    </div>
                  </div>

                  {/* Belanja Bansos 57 */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-slate-100">57 - Belanja Bansos</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Rencana: <strong className="text-slate-700 dark:text-slate-300">{formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja57?.rpd || 0)}</strong> • Realisasi: <strong className="text-emerald-600">{formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja57?.realisasi || 0)}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-rose-600">Deviasi: {formatRupiah(selectedRecordDetail.rincianJenisBelanja?.belanja57?.deviasiNominal || 0)}</div>
                      <div className="text-[10px] font-bold text-slate-500 font-mono">{(selectedRecordDetail.rincianJenisBelanja?.belanja57?.persenDeviasi || 0).toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extra Metadata OMSPAN */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Tanggal Posting</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRecordDetail.tanggalPosting || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">No Revisi Terakhir</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRecordDetail.noRevisiTerakhir || '-'}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecordDetail(null)}
                className="px-5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PASSWORD UNLOCK RADAR DEVIASI KPPN */}
      {showRadarUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    Verifikasi Petugas KPPN
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Akses Radar Pengawasan Deviasi Satker
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRadarUnlockModal(false);
                  setRadarUnlockPassword('');
                  setRadarUnlockError(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Radar Satker Deviasi Tinggi berisi sorotan dan deteksi dini per jenis belanja khusus untuk bahan pengawasan dan pembinaan internal KPPN 026. Masukkan password pengelola untuk membuka tampilan.
            </p>

            <form onSubmit={handleVerifyRadarPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password Admin / KPPN
                </label>
                <div className="relative">
                  <input
                    type={showRadarPasswordText ? 'text' : 'password'}
                    value={radarUnlockPassword}
                    onChange={(e) => {
                      setRadarUnlockPassword(e.target.value);
                      if (radarUnlockError) setRadarUnlockError(null);
                    }}
                    placeholder="Masukkan password admin / pengelola..."
                    autoFocus
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRadarPasswordText(!showRadarPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showRadarPasswordText ? <EyeOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  </button>
                </div>
                {radarUnlockError && (
                  <p className="text-xs text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {radarUnlockError}
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRadarUnlockModal(false);
                    setRadarUnlockPassword('');
                    setRadarUnlockError(null);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Buka Radar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
