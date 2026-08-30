import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Filter, 
  Search, 
  Sparkles, 
  Printer, 
  Eye, 
  Layers, 
  BookOpen, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle, 
  PieChart as PieIcon, 
  BarChart3, 
  Building2, 
  Calendar, 
  UserCheck, 
  FileText, 
  ExternalLink, 
  Palette, 
  RefreshCw, 
  ChevronRight, 
  Award, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight, 
  Info,
  SlidersHorizontal,
  ChevronDown,
  Trash2,
  RotateCcw,
  Edit3,
  Plus,
  X,
  Save,
  AlertTriangle
} from 'lucide-react';
import { 
  RealisasiBelanjaRecord, 
  RealisasiBelanjaSummary, 
  BuletinConfig, 
  SatkerIKPA, 
  AppTheme,
  DashboardConfig,
  MyIntressRecord,
  MyIntressSummary
} from '../../types';
import { 
  processRealisasiBelanjaExcel, 
  computeRealisasiBelanjaSummary, 
  processMyIntressExcel,
  computeMyIntressSummary,
  formatRupiahShort, 
  formatRupiahFull, 
  generateCanvaBulkCreateCSV, 
  exportRealisasiBelanjaToExcel,
  getJenisBelanjaInfo 
} from '../../utils/realisasiBelanjaProcessor';
import { 
  safeLocalStorageSet, 
  safeLocalStorageGet,
  saveLargeDataset,
  getLargeDataset,
  removeLargeDataset
} from '../../utils/safeStorage';
import { useToast } from '../ToastNotification';
import { db, doc, setDoc, getDoc, onSnapshot } from '../../lib/firebase';
import { INITIAL_REALISASI_BELANJA } from '../../data/initialRealisasiBelanja';
import { INITIAL_MY_INTRESS_DATA } from '../../data/initialMyIntressData';

import { BuletinMagazineLayout } from './BuletinMagazineLayout';
import { BuletinDataStudioEditor } from './BuletinDataStudioEditor';
import { generateCompletePrintReadyBuletinConfig } from '../../utils/buletinTreasuryEngine';
import { SintesaSatkerDetailModal } from './SintesaSatkerDetailModal';
import { SintesaRecordEditModal } from './SintesaRecordEditModal';
import { MyIntressAnalysisView } from './MyIntressAnalysisView';
import { RealisasiReconciliationView } from './RealisasiReconciliationView';

interface BuletinWartaSectionProps {
  theme?: AppTheme;
  isDark?: boolean;
  satkers?: SatkerIKPA[];
  dashboardConfig?: DashboardConfig;
  onUpdateDashboardConfig?: (newConfig: DashboardConfig) => void;
  isAdminAuthenticated?: boolean;
}

const STORAGE_KEY_REALISASI = 'kppn_realisasi_belanja_records';
const STORAGE_KEY_MY_INTRESS = 'kppn_my_intress_records';
const STORAGE_KEY_BULETIN_CFG = 'kppn_buletin_config';

const DEFAULT_BULETIN_CONFIG: BuletinConfig = generateCompletePrintReadyBuletinConfig();

export const BuletinWartaSection: React.FC<BuletinWartaSectionProps> = ({
  theme = 'light',
  isDark = false,
  satkers = [],
  dashboardConfig,
  isAdminAuthenticated = false
}) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sub-tabs in Buletin section
  const [activeSubTab, setActiveSubTab] = useState<'analisis' | 'my-intress' | 'rekonsiliasi' | 'desain-buletin' | 'canva-ekspor'>('analisis');

  // Realisasi Belanja SINTESA Data state (Default to full 5,196 SINTESA records)
  const [records, setRecords] = useState<RealisasiBelanjaRecord[]>(() => {
    try {
      const raw = safeLocalStorageGet(STORAGE_KEY_REALISASI);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error loading cached realisasi belanja:', e);
    }
    return INITIAL_REALISASI_BELANJA || [];
  });

  // Load persistent full datasets from IndexedDB on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const rawLocal = safeLocalStorageGet(STORAGE_KEY_REALISASI);
        if (rawLocal !== null) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed) && parsed.length === 0) {
            if (isMounted) setRecords([]);
          } else {
            const idbRecords = await getLargeDataset<RealisasiBelanjaRecord[]>(STORAGE_KEY_REALISASI);
            if (isMounted && Array.isArray(idbRecords) && idbRecords.length > 0) {
              setRecords(idbRecords);
            }
          }
        } else {
          const idbRecords = await getLargeDataset<RealisasiBelanjaRecord[]>(STORAGE_KEY_REALISASI);
          if (isMounted && Array.isArray(idbRecords) && idbRecords.length > 0) {
            setRecords(idbRecords);
          }
        }
      } catch (err) {
        console.warn('Error loading SINTESA records from IndexedDB:', err);
      }

      try {
        const rawIntressLocal = safeLocalStorageGet(STORAGE_KEY_MY_INTRESS);
        if (rawIntressLocal !== null) {
          const parsed = JSON.parse(rawIntressLocal);
          if (Array.isArray(parsed) && parsed.length === 0) {
            if (isMounted) setIntressRecords([]);
          } else {
            const idbIntress = await getLargeDataset<MyIntressRecord[]>(STORAGE_KEY_MY_INTRESS);
            if (isMounted && Array.isArray(idbIntress) && idbIntress.length > 0) {
              setIntressRecords(idbIntress);
            }
          }
        } else {
          const idbIntress = await getLargeDataset<MyIntressRecord[]>(STORAGE_KEY_MY_INTRESS);
          if (isMounted && Array.isArray(idbIntress) && idbIntress.length > 0) {
            setIntressRecords(idbIntress);
          }
        }
      } catch (err) {
        console.warn('Error loading MyIntress records from IndexedDB:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const [activeFileName, setActiveFileName] = useState<string>('Data Realisasi Belanja SINTESA Kemenkeu');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // MY INTRESS Data state (Default to 127 satkers)
  const [intressRecords, setIntressRecords] = useState<MyIntressRecord[]>(() => {
    try {
      const raw = safeLocalStorageGet(STORAGE_KEY_MY_INTRESS);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error loading cached my intress:', e);
    }
    return INITIAL_MY_INTRESS_DATA || [];
  });

  const [intressFileName, setIntressFileName] = useState<string>('Data Realisasi Belanja My InTress (127 Satker)');
  const [intressWaktuUnduh, setIntressWaktuUnduh] = useState<string>('24/10/2024 10:28:44');
  const [isIntressProcessing, setIsIntressProcessing] = useState<boolean>(false);

  // Compute My InTress Summary
  const intressSummary = useMemo(() => {
    if (intressRecords.length === 0) return null;
    return computeMyIntressSummary(intressRecords);
  }, [intressRecords]);

  // Modal and Record Editing States
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<RealisasiBelanjaRecord | null>(null);
  const [isAddingNewRecord, setIsAddingNewRecord] = useState<boolean>(false);

  // View Mode: 'satker_summary' | 'all_rows' | 'kementerian_matrix' | 'sumberdana_kro'
  const [tableViewMode, setTableViewMode] = useState<'satker_summary' | 'all_rows' | 'kementerian_matrix' | 'sumberdana_kro'>('satker_summary');

  // Selected Satker for Deep Drilldown Modal
  const [selectedSatkerKode, setSelectedSatkerKode] = useState<string | null>(null);

  // Filter States
  const [searchSatker, setSearchSatker] = useState<string>('');
  const [filterJenisBelanja, setFilterJenisBelanja] = useState<string>('ALL');
  const [filterKementerian, setFilterKementerian] = useState<string>('ALL');
  const [filterSatker, setFilterSatker] = useState<string>('ALL');
  const [filterSumberdana, setFilterSumberdana] = useState<string>('ALL');
  const [filterKewenangan, setFilterKewenangan] = useState<string>('ALL');
  const [filterRealisasiLevel, setFilterRealisasiLevel] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Buletin Config state
  const [buletinConfig, setBuletinConfig] = useState<BuletinConfig>(() => {
    try {
      const raw = safeLocalStorageGet(STORAGE_KEY_BULETIN_CFG);
      if (raw) return { ...DEFAULT_BULETIN_CONFIG, ...JSON.parse(raw) };
    } catch (e) {
      console.warn('Error loading cached buletin config:', e);
    }
    return DEFAULT_BULETIN_CONFIG;
  });

  // Real-time synchronization for Buletin Configuration across devices
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'buletin_config'), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && typeof data === 'object') {
            setBuletinConfig(prev => ({
              ...prev,
              ...data
            }));
            safeLocalStorageSet(STORAGE_KEY_BULETIN_CFG, JSON.stringify(data));
          }
        }
      }, (err) => {
        console.warn('Notice listening to remote buletin config:', err);
      });
      return () => unsub();
    } catch {
      // Ignore
    }
  }, []);

  // Real-time synchronization for SINTESA Realisasi & My InTress across web & devices
  useEffect(() => {
    let isMounted = true;

    // 1. Initial Fetch from Firestore
    getDoc(doc(db, 'data', 'my_intress')).then(snap => {
      if (!isMounted) return;
      if (snap.exists()) {
        const data = snap.data();
        if (data.isEmpty === true || (Array.isArray(data.list) && data.list.length === 0)) {
          setIntressRecords([]);
          setIntressFileName(data.activeFileName || 'Data My InTress Kosong');
          safeLocalStorageSet(STORAGE_KEY_MY_INTRESS, '[]');
          removeLargeDataset(STORAGE_KEY_MY_INTRESS);
        } else if (Array.isArray(data.list) && data.list.length > 0) {
          setIntressRecords(data.list);
          if (data.activeFileName) setIntressFileName(data.activeFileName);
          if (data.waktuUnduh) setIntressWaktuUnduh(data.waktuUnduh);
          safeLocalStorageSet(STORAGE_KEY_MY_INTRESS, JSON.stringify(data.list));
          saveLargeDataset(STORAGE_KEY_MY_INTRESS, data.list);
        }
      }
    }).catch(err => console.warn('Notice fetching my_intress from Firestore:', err));

    getDoc(doc(db, 'data', 'sintesa_realisasi')).then(snap => {
      if (!isMounted) return;
      if (snap.exists()) {
        const data = snap.data();
        if (data.isEmpty === true || (Array.isArray(data.list) && data.list.length === 0)) {
          setRecords([]);
          setActiveFileName(data.activeFileName || 'Data Realisasi Belanja Kosong');
          safeLocalStorageSet(STORAGE_KEY_REALISASI, '[]');
          removeLargeDataset(STORAGE_KEY_REALISASI);
        } else if (Array.isArray(data.list) && data.list.length > 0) {
          setRecords(data.list);
          if (data.activeFileName) setActiveFileName(data.activeFileName);
          safeLocalStorageSet(STORAGE_KEY_REALISASI, JSON.stringify(data.list));
          saveLargeDataset(STORAGE_KEY_REALISASI, data.list);
        }
      }
    }).catch(err => console.warn('Notice fetching sintesa_realisasi from Firestore:', err));

    // 2. Real-time Listeners
    const unsubMyIntress = onSnapshot(doc(db, 'data', 'my_intress'), (snapshot) => {
      if (!isMounted) return;
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.isEmpty === true || (Array.isArray(data.list) && data.list.length === 0)) {
          setIntressRecords([]);
          setIntressFileName(data.activeFileName || 'Data My InTress Kosong');
          safeLocalStorageSet(STORAGE_KEY_MY_INTRESS, '[]');
          removeLargeDataset(STORAGE_KEY_MY_INTRESS);
        } else if (Array.isArray(data.list) && data.list.length > 0) {
          setIntressRecords(data.list);
          if (data.activeFileName) setIntressFileName(data.activeFileName);
          if (data.waktuUnduh) setIntressWaktuUnduh(data.waktuUnduh);
          safeLocalStorageSet(STORAGE_KEY_MY_INTRESS, JSON.stringify(data.list));
          saveLargeDataset(STORAGE_KEY_MY_INTRESS, data.list);
        }
      }
    }, (err) => console.warn('Notice listening to my_intress:', err));

    const unsubSintesa = onSnapshot(doc(db, 'data', 'sintesa_realisasi'), (snapshot) => {
      if (!isMounted) return;
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.isEmpty === true || (Array.isArray(data.list) && data.list.length === 0)) {
          setRecords([]);
          setActiveFileName(data.activeFileName || 'Data Realisasi Belanja Kosong');
          safeLocalStorageSet(STORAGE_KEY_REALISASI, '[]');
          removeLargeDataset(STORAGE_KEY_REALISASI);
        } else if (Array.isArray(data.list) && data.list.length > 0) {
          setRecords(data.list);
          if (data.activeFileName) setActiveFileName(data.activeFileName);
          safeLocalStorageSet(STORAGE_KEY_REALISASI, JSON.stringify(data.list));
          saveLargeDataset(STORAGE_KEY_REALISASI, data.list);
        }
      }
    }, (err) => console.warn('Notice listening to sintesa_realisasi:', err));

    return () => {
      isMounted = false;
      unsubMyIntress();
      unsubSintesa();
    };
  }, []);

  // Calculate Overall Summary (Total Dataset)
  const overallSummary = useMemo(() => {
    if (records.length === 0) return null;
    return computeRealisasiBelanjaSummary(records);
  }, [records]);

  // Check if any filter is actively applied
  const isFilterActive = useMemo(() => {
    return Boolean(
      searchSatker.trim() !== '' ||
      filterJenisBelanja !== 'ALL' ||
      filterKementerian !== 'ALL' ||
      filterSatker !== 'ALL' ||
      filterSumberdana !== 'ALL' ||
      filterKewenangan !== 'ALL' ||
      filterRealisasiLevel !== 'ALL'
    );
  }, [searchSatker, filterJenisBelanja, filterKementerian, filterSatker, filterSumberdana, filterKewenangan, filterRealisasiLevel]);

  // Unique K/L, Satkers, Sumber Dana, and Kewenangan for filter dropdowns
  const uniqueKementerians = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach(r => {
      if (r.kementerianKode && r.kementerianUraian) {
        map.set(r.kementerianKode, `${r.kementerianKode} - ${r.kementerianUraian}`);
      }
    });
    return Array.from(map.entries())
      .map(([kode, label]) => ({ kode, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [records]);

  const uniqueSatkers = useMemo(() => {
    const map = new Map<string, { kode: string; nama: string; kementerian: string }>();
    records.forEach(r => {
      if (r.satkerKode && !map.has(r.satkerKode)) {
        map.set(r.satkerKode, {
          kode: r.satkerKode,
          nama: r.satkerUraian,
          kementerian: r.kementerianUraian
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [records]);

  const uniqueSumberdanas = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.sumberdanaUraian) set.add(r.sumberdanaUraian);
    });
    return Array.from(set).sort();
  }, [records]);

  const uniqueKewenangans = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.kewenanganUraian) set.add(r.kewenanganUraian);
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Search text across multiple SINTESA dimensions
      if (searchSatker) {
        const q = searchSatker.toLowerCase();
        const matchKode = r.satkerKode.toLowerCase().includes(q);
        const matchNama = r.satkerUraian.toLowerCase().includes(q);
        const matchAkun = (r.akunKode && r.akunKode.toLowerCase().includes(q)) || (r.akunUraian && r.akunUraian.toLowerCase().includes(q));
        const matchKem = (r.kementerianUraian && r.kementerianUraian.toLowerCase().includes(q)) || (r.kementerianKode && r.kementerianKode.includes(q));
        const matchProg = r.programUraian && r.programUraian.toLowerCase().includes(q);
        const matchKeg = r.kegiatanUraian && r.kegiatanUraian.toLowerCase().includes(q);
        const matchKro = (r.outputKroKode && r.outputKroKode.toLowerCase().includes(q)) || (r.outputKroUraian && r.outputKroUraian.toLowerCase().includes(q));
        const matchSD = r.sumberdanaUraian && r.sumberdanaUraian.toLowerCase().includes(q);

        if (!matchKode && !matchNama && !matchAkun && !matchKem && !matchProg && !matchKeg && !matchKro && !matchSD) {
          return false;
        }
      }

      // Filter Jenis Belanja
      if (filterJenisBelanja !== 'ALL' && r.jenisBelanjaKode !== filterJenisBelanja) {
        return false;
      }

      // Filter K/L
      if (filterKementerian !== 'ALL' && r.kementerianKode !== filterKementerian) {
        return false;
      }

      // Filter Satker
      if (filterSatker !== 'ALL' && r.satkerKode !== filterSatker) {
        return false;
      }

      // Filter Sumber Dana (supports exact or partial match e.g. SBSN, RM, PNBP)
      if (filterSumberdana !== 'ALL') {
        const sdVal = (r.sumberdanaUraian || '').toLowerCase();
        const fVal = filterSumberdana.toLowerCase();
        if (sdVal !== fVal && !sdVal.includes(fVal)) {
          return false;
        }
      }

      // Filter Kewenangan
      if (filterKewenangan !== 'ALL' && r.kewenanganUraian !== filterKewenangan) {
        return false;
      }

      // Filter Realisasi Level
      if (filterRealisasiLevel === 'UNDER_50' && r.persenRealisasi >= 50) return false;
      if (filterRealisasiLevel === '50_TO_80' && (r.persenRealisasi < 50 || r.persenRealisasi > 80)) return false;
      if (filterRealisasiLevel === 'OVER_80' && r.persenRealisasi < 80) return false;
      if (filterRealisasiLevel === 'HUNDRED' && r.persenRealisasi < 99.99) return false;

      return true;
    });
  }, [records, searchSatker, filterJenisBelanja, filterKementerian, filterSatker, filterSumberdana, filterKewenangan, filterRealisasiLevel]);

  // Active Summary (computed dynamically on filtered records)
  const activeSummary = useMemo(() => {
    if (filteredRecords.length === 0) return null;
    return computeRealisasiBelanjaSummary(filteredRecords);
  }, [filteredRecords]);

  // Formatted Description of Active Filters
  const activeFilterDescription = useMemo(() => {
    const parts: string[] = [];
    if (searchSatker.trim()) parts.push(`Kata Kunci: "${searchSatker.trim()}"`);
    if (filterSumberdana !== 'ALL') parts.push(`Sumber Dana: ${filterSumberdana}`);
    if (filterKementerian !== 'ALL') {
      const kMatch = uniqueKementerians.find(k => k.kode === filterKementerian);
      parts.push(`K/L: ${kMatch ? kMatch.label : filterKementerian}`);
    }
    if (filterSatker !== 'ALL') {
      const sMatch = uniqueSatkers.find(s => s.kode === filterSatker);
      parts.push(`Satker: ${sMatch ? sMatch.nama : filterSatker}`);
    }
    if (filterJenisBelanja !== 'ALL') {
      const jNames: Record<string, string> = { '51': '51 - Pegawai', '52': '52 - Barang', '53': '53 - Modal', '57': '57 - Bansos' };
      parts.push(`Belanja: ${jNames[filterJenisBelanja] || filterJenisBelanja}`);
    }
    if (filterKewenangan !== 'ALL') parts.push(`Kewenangan: ${filterKewenangan}`);
    if (filterRealisasiLevel !== 'ALL') {
      const lvlNames: Record<string, string> = {
        UNDER_50: 'Realisasi < 50%',
        '50_TO_80': 'Realisasi 50% - 80%',
        OVER_80: 'Realisasi > 80%',
        HUNDRED: 'Realisasi 100%'
      };
      parts.push(lvlNames[filterRealisasiLevel] || filterRealisasiLevel);
    }
    return parts.join(' • ');
  }, [searchSatker, filterSumberdana, filterKementerian, filterSatker, filterJenisBelanja, filterKewenangan, filterRealisasiLevel, uniqueKementerians, uniqueSatkers]);

  // Aggregated Satkers for Satker Mode
  const aggregatedSatkers = useMemo(() => {
    const map = new Map<string, {
      satkerKode: string;
      satkerUraian: string;
      kementerianKode: string;
      kementerianUraian: string;
      kewenanganUraian: string;
      paguDipa: number;
      realisasi: number;
      sisaPagu: number;
      persenRealisasi: number;
      totalBaris: number;
      breakdownJenis: Record<string, { pagu: number; realisasi: number }>;
    }>();

    filteredRecords.forEach(r => {
      if (!map.has(r.satkerKode)) {
        map.set(r.satkerKode, {
          satkerKode: r.satkerKode,
          satkerUraian: r.satkerUraian,
          kementerianKode: r.kementerianKode,
          kementerianUraian: r.kementerianUraian,
          kewenanganUraian: r.kewenanganUraian || 'Kantor Daerah',
          paguDipa: 0,
          realisasi: 0,
          sisaPagu: 0,
          persenRealisasi: 0,
          totalBaris: 0,
          breakdownJenis: {
            '51': { pagu: 0, realisasi: 0 },
            '52': { pagu: 0, realisasi: 0 },
            '53': { pagu: 0, realisasi: 0 },
            '57': { pagu: 0, realisasi: 0 },
          }
        });
      }

      const item = map.get(r.satkerKode)!;
      item.paguDipa += r.paguDipa;
      item.realisasi += r.realisasi;
      item.totalBaris += 1;

      const jKode = r.jenisBelanjaKode || '52';
      if (item.breakdownJenis[jKode]) {
        item.breakdownJenis[jKode].pagu += r.paguDipa;
        item.breakdownJenis[jKode].realisasi += r.realisasi;
      }
    });

    const list = Array.from(map.values()).map(s => ({
      ...s,
      sisaPagu: Math.max(0, s.paguDipa - s.realisasi),
      persenRealisasi: s.paguDipa > 0 ? (s.realisasi / s.paguDipa) * 100 : 0
    }));

    return list.sort((a, b) => b.paguDipa - a.paguDipa);
  }, [filteredRecords]);

  // Aggregated Kementerian for K/L Matrix Mode
  const aggregatedKementerians = useMemo(() => {
    const map = new Map<string, {
      kode: string;
      nama: string;
      satkerCount: Set<string>;
      paguDipa: number;
      realisasi: number;
      sisaPagu: number;
      persenRealisasi: number;
    }>();

    filteredRecords.forEach(r => {
      const key = r.kementerianKode || '000';
      if (!map.has(key)) {
        map.set(key, {
          kode: key,
          nama: r.kementerianUraian || 'Kementerian / Lembaga',
          satkerCount: new Set<string>(),
          paguDipa: 0,
          realisasi: 0,
          sisaPagu: 0,
          persenRealisasi: 0
        });
      }

      const item = map.get(key)!;
      item.satkerCount.add(r.satkerKode);
      item.paguDipa += r.paguDipa;
      item.realisasi += r.realisasi;
    });

    return Array.from(map.values()).map(k => ({
      ...k,
      totalSatker: k.satkerCount.size,
      sisaPagu: Math.max(0, k.paguDipa - k.realisasi),
      persenRealisasi: k.paguDipa > 0 ? (k.realisasi / k.paguDipa) * 100 : 0
    })).sort((a, b) => b.paguDipa - a.paguDipa);
  }, [filteredRecords]);

  // Aggregated Sumber Dana for Sumber Dana Mode
  const aggregatedSumberdanas = useMemo(() => {
    const map = new Map<string, {
      sumberdana: string;
      paguDipa: number;
      realisasi: number;
      sisaPagu: number;
      persenRealisasi: number;
      totalBaris: number;
    }>();

    filteredRecords.forEach(r => {
      const sd = r.sumberdanaUraian || 'RM (Rupiah Murni)';
      if (!map.has(sd)) {
        map.set(sd, {
          sumberdana: sd,
          paguDipa: 0,
          realisasi: 0,
          sisaPagu: 0,
          persenRealisasi: 0,
          totalBaris: 0
        });
      }
      const item = map.get(sd)!;
      item.paguDipa += r.paguDipa;
      item.realisasi += r.realisasi;
      item.totalBaris += 1;
    });

    return Array.from(map.values()).map(s => ({
      ...s,
      sisaPagu: Math.max(0, s.paguDipa - s.realisasi),
      persenRealisasi: s.paguDipa > 0 ? (s.realisasi / s.paguDipa) * 100 : 0
    })).sort((a, b) => b.paguDipa - a.paguDipa);
  }, [filteredRecords]);

  // Records for selected satker in Drilldown modal
  const selectedSatkerRecords = useMemo(() => {
    if (!selectedSatkerKode) return [];
    return records.filter(r => r.satkerKode === selectedSatkerKode);
  }, [records, selectedSatkerKode]);

  const selectedSatkerInfo = useMemo(() => {
    if (!selectedSatkerKode) return null;
    const recs = selectedSatkerRecords;
    if (recs.length === 0) return null;
    const first = recs[0];
    const totalPagu = recs.reduce((acc, r) => acc + r.paguDipa, 0);
    const totalRealisasi = recs.reduce((acc, r) => acc + r.realisasi, 0);
    const persen = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;
    return {
      satkerKode: first.satkerKode,
      satkerUraian: first.satkerUraian,
      kementerianKode: first.kementerianKode,
      kementerianUraian: first.kementerianUraian,
      kewenanganUraian: first.kewenanganUraian,
      totalPagu,
      totalRealisasi,
      sisaPagu: Math.max(0, totalPagu - totalRealisasi),
      persen,
      records: recs
    };
  }, [selectedSatkerKode, selectedSatkerRecords]);

  // Filtered Summary
  const filteredSummary = useMemo(() => {
    if (filteredRecords.length === 0) return null;
    return computeRealisasiBelanjaSummary(filteredRecords);
  }, [filteredRecords]);

  // Pagination for all_rows or satker_summary
  const totalItemsCount = tableViewMode === 'satker_summary' 
    ? aggregatedSatkers.length 
    : tableViewMode === 'kementerian_matrix'
    ? aggregatedKementerians.length
    : tableViewMode === 'sumberdana_kro'
    ? aggregatedSumberdanas.length
    : filteredRecords.length;

  const totalPages = Math.ceil(totalItemsCount / itemsPerPage) || 1;

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const paginatedSatkers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return aggregatedSatkers.slice(start, start + itemsPerPage);
  }, [aggregatedSatkers, currentPage, itemsPerPage]);

  // Handle Excel Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsProcessing(true);

    try {
      const result = await processRealisasiBelanjaExcel(file);
      setRecords(result.records);
      setActiveFileName(result.fileName);
      setCurrentPage(1);

      // Save complete dataset to IndexedDB (zero truncation)
      await saveLargeDataset(STORAGE_KEY_REALISASI, result.records);
      safeLocalStorageSet(STORAGE_KEY_REALISASI, JSON.stringify(result.records));

      try {
        await setDoc(doc(db, 'data', 'sintesa_realisasi'), {
          list: result.records,
          isEmpty: false,
          activeFileName: result.fileName,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Error syncing SINTESA upload to Firebase:', e);
      }

      addToast({
        title: 'Upload Realisasi Belanja Berhasil',
        message: `Berhasil memproses ${result.totalRows.toLocaleString('id-ID')} baris data realisasi dari ${file.name}.`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error processing realisasi belanja Excel:', err);
      addToast({
        title: 'Gagal Memproses Excel',
        message: err?.message || 'Pastikan file Excel berformat OM-SPAN / SAKTI Inquiry Data yang valid.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save Buletin Config
  const handleSaveBuletinConfig = async () => {
    const updated = {
      ...buletinConfig,
      updatedAt: new Date().toISOString()
    };
    setBuletinConfig(updated);
    safeLocalStorageSet(STORAGE_KEY_BULETIN_CFG, JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'settings', 'buletin_config'), updated, { merge: true });
    } catch (err) {
      console.warn('Notice saving buletin config:', err);
    }

    addToast({
      title: 'Pengaturan Buletin Disimpan',
      message: 'Format edisi, judul, dan layout buletin berhasil diperbarui.',
      type: 'success'
    });
  };

  // Clear all realisasi data
  const handleClearAllData = async () => {
    setRecords([]);
    await removeLargeDataset(STORAGE_KEY_REALISASI);
    safeLocalStorageSet(STORAGE_KEY_REALISASI, JSON.stringify([]));
    setActiveFileName('Data Realisasi Belanja Kosong');
    setSelectedSatkerKode(null);
    setShowClearConfirmModal(false);
    setCurrentPage(1);

    try {
      await setDoc(doc(db, 'data', 'sintesa_realisasi'), {
        list: [],
        isEmpty: true,
        activeFileName: 'Data Realisasi Belanja Kosong',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Error syncing clear SINTESA to Firebase:', e);
    }

    addToast({
      title: 'Data Realisasi Dikosongkan',
      message: 'Seluruh baris data realisasi belanja telah dikosongkan. Anda dapat mengunggah file Excel baru atau memulihkan data bawaan kapan saja.',
      type: 'info'
    });
  };

  // Reset / Restore default 5,196 SINTESA data
  const handleResetDefaultData = async () => {
    const defaultRecs = INITIAL_REALISASI_BELANJA || [];
    setRecords(defaultRecs);
    await saveLargeDataset(STORAGE_KEY_REALISASI, defaultRecs);
    safeLocalStorageSet(STORAGE_KEY_REALISASI, JSON.stringify(defaultRecs));
    setActiveFileName('Data Realisasi Belanja SINTESA Kemenkeu');
    setSelectedSatkerKode(null);
    setShowClearConfirmModal(false);
    setCurrentPage(1);

    try {
      await setDoc(doc(db, 'data', 'sintesa_realisasi'), {
        list: defaultRecs,
        isEmpty: false,
        activeFileName: 'Data Realisasi Belanja SINTESA Kemenkeu',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Error syncing reset SINTESA to Firebase:', e);
    }

    addToast({
      title: 'Data Asli SINTESA Dipulihkan',
      message: `Memuat ulang ${defaultRecs.length.toLocaleString('id-ID')} baris data SINTESA lengkap (20 K/L & 127 Satker).`,
      type: 'success'
    });
  };

  // Upload My InTress Excel
  const handleUploadMyIntressExcel = async (file: File) => {
    setIsIntressProcessing(true);
    try {
      const result = await processMyIntressExcel(file);
      setIntressRecords(result.records);
      setIntressFileName(result.fileName);
      if (result.waktuUnduh) setIntressWaktuUnduh(result.waktuUnduh);
      await saveLargeDataset(STORAGE_KEY_MY_INTRESS, result.records);
      safeLocalStorageSet(STORAGE_KEY_MY_INTRESS, JSON.stringify(result.records));

      try {
        await setDoc(doc(db, 'data', 'my_intress'), {
          list: result.records,
          isEmpty: false,
          activeFileName: result.fileName,
          waktuUnduh: result.waktuUnduh || '',
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Error syncing My InTress upload to Firebase:', e);
      }

      addToast({
        title: 'Upload My InTress Berhasil',
        message: `Berhasil memproses ${result.records.length} satker dari file ${file.name}.`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error processing My InTress Excel:', err);
      addToast({
        title: 'Gagal Memproses Excel My InTress',
        message: err?.message || 'Pastikan file Excel berformat laporan Realisasi Belanja Satker My InTress yang valid.',
        type: 'error'
      });
    } finally {
      setIsIntressProcessing(false);
    }
  };

  // Reset / Restore default My InTress Data (127 Satker)
  const handleResetDefaultMyIntress = async () => {
    const defaultData = INITIAL_MY_INTRESS_DATA || [];
    setIntressRecords(defaultData);
    await saveLargeDataset(STORAGE_KEY_MY_INTRESS, defaultData);
    safeLocalStorageSet(STORAGE_KEY_MY_INTRESS, JSON.stringify(defaultData));
    setIntressFileName('Data Realisasi Belanja My InTress (127 Satker)');
    setIntressWaktuUnduh('24/10/2024 10:28:44');

    try {
      await setDoc(doc(db, 'data', 'my_intress'), {
        list: defaultData,
        isEmpty: false,
        activeFileName: 'Data Realisasi Belanja My InTress (127 Satker)',
        waktuUnduh: '24/10/2024 10:28:44',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Error syncing reset My InTress to Firebase:', e);
    }

    addToast({
      title: 'Data My InTress Dipulihkan',
      message: `Memuat ulang ${defaultData.length} satker per jenis belanja dari data My InTress.`,
      type: 'success'
    });
  };

  // Clear all My InTress data
  const handleClearMyIntress = async () => {
    setIntressRecords([]);
    await removeLargeDataset(STORAGE_KEY_MY_INTRESS);
    safeLocalStorageSet(STORAGE_KEY_MY_INTRESS, JSON.stringify([]));
    setIntressFileName('Data My InTress Kosong');

    try {
      await setDoc(doc(db, 'data', 'my_intress'), {
        list: [],
        isEmpty: true,
        activeFileName: 'Data My InTress Kosong',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Error syncing clear My InTress to Firebase:', e);
    }

    addToast({
      title: 'Data My InTress Dikosongkan',
      message: 'Seluruh data My InTress telah dikosongkan.',
      type: 'info'
    });
  };

  // Sync My InTress data to Buletin
  const handleSyncMyIntressToBuletin = async () => {
    if (!intressSummary || intressRecords.length === 0) {
      addToast({
        title: 'Tidak Ada Data My InTress',
        message: 'Silakan muat data My InTress terlebih dahulu.',
        type: 'warning'
      });
      return;
    }

    const updatedConfig: BuletinConfig = {
      ...buletinConfig,
      realisasiAkun: {
        ...buletinConfig.realisasiAkun,
        belanjaPegawai: { pagu: intressSummary.paguPegawai51, realisasi: intressSummary.realPegawai51, persen: intressSummary.persenPegawai51 },
        belanjaBarang: { pagu: intressSummary.paguBarang52, realisasi: intressSummary.realBarang52, persen: intressSummary.persenBarang52 },
        belanjaModal: { pagu: intressSummary.paguModal53, realisasi: intressSummary.realModal53, persen: intressSummary.persenModal53 },
        belanjaBansos: { pagu: intressSummary.paguBansos57, realisasi: intressSummary.realBansos57, persen: intressSummary.persenBansos57 },
      },
      updatedAt: new Date().toISOString()
    };

    setBuletinConfig(updatedConfig);
    safeLocalStorageSet(STORAGE_KEY_BULETIN_CFG, JSON.stringify(updatedConfig));
    try {
      await setDoc(doc(db, 'settings', 'buletin_config'), updatedConfig, { merge: true });
    } catch (err) {
      console.warn('Notice saving buletin config from My InTress:', err);
    }

    addToast({
      title: 'Sinkronisasi My InTress ke Buletin Berhasil',
      message: 'Data belanja 51, 52, 53, 57 My InTress berhasil disinkronkan ke konfigurasi Buletin.',
      type: 'success'
    });
  };

  // Sync realisasi analytics data directly to Buletin & Warta config
  const handleSyncToBuletin = async () => {
    const summaryToUse = (isFilterActive && activeSummary) ? activeSummary : overallSummary;
    const recordsToUse = (isFilterActive && filteredRecords.length > 0) ? filteredRecords : records;

    if (!summaryToUse || recordsToUse.length === 0) {
      addToast({
        title: 'Tidak Ada Data Realisasi',
        message: 'Silakan muat atau sesuaikan filter data realisasi belanja SINTESA terlebih dahulu.',
        type: 'warning'
      });
      return;
    }

    // Generate top 10 satkers table from active summary
    const satkerPaguBesar = (summaryToUse.topSatkers || []).slice(0, 10).map((s) => {
      const ikpaMatch = satkers.find(st => st.kodeSatker === s.kodeSatker);
      return {
        kode: s.kodeSatker,
        nama: s.namaSatker,
        pagu: s.pagu,
        realisasi: s.realisasi,
        persen: s.persen,
        ikpa: ikpaMatch ? (ikpaMatch.nilaiTotalIKPA || 95.0) : 95.0,
        status: s.persen >= 80 ? 'Sangat Baik' : s.persen >= 50 ? 'Baik' : 'Perlu Akselerasi'
      };
    });

    // Generate modal breakdown (Akun 53) from active records
    const modalRecords = recordsToUse.filter(r => r.jenisBelanjaKode === '53' || String(r.akunKode).startsWith('53'));
    const totalPaguModal = modalRecords.reduce((a, b) => a + b.paguDipa, 0);
    const realisasiModal = modalRecords.reduce((a, b) => a + b.realisasi, 0);
    const persenModal = totalPaguModal > 0 ? (realisasiModal / totalPaguModal) * 100 : 0;

    const daftarProyek = modalRecords.slice(0, 6).map((m, idx) => ({
      namaPaket: m.kegiatanUraian || m.outputKroUraian || m.akunUraian || `Paket Belanja Modal ${idx + 1}`,
      satker: m.satkerUraian,
      pagu: m.paguDipa,
      progres: `${m.persenRealisasi.toFixed(1)}%`,
      status: m.persenRealisasi >= 80 ? 'Optimal' : m.persenRealisasi >= 50 ? 'On Track' : 'Akselerasi'
    }));

    const filterNote = isFilterActive && filterSumberdana !== 'ALL' ? ` [Sumber Dana: ${filterSumberdana}]` : isFilterActive ? ' [Data Terfilter]' : '';

    const updatedConfig: BuletinConfig = {
      ...buletinConfig,
      coverHighlight1: `Pagu Total: ${formatRupiahShort(summaryToUse.totalPagu)} | Realisasi: ${summaryToUse.persenRealisasiTotal.toFixed(2)}%${filterNote}`,
      coverHighlight2: `Terdiri dari ${summaryToUse.totalSatkerCount} Satker di ${summaryToUse.breakdownKementerian.length} K/L (${summaryToUse.totalRows.toLocaleString('id-ID')} baris data)`,
      satkerPaguBesarTable: satkerPaguBesar,
      belanjaModalProyek: {
        judul: `Monitoring Proyek Strategis & Belanja Modal (Akun 53)${filterNote}`,
        totalPaguModal: totalPaguModal > 0 ? totalPaguModal : (buletinConfig.belanjaModalProyek?.totalPaguModal || 0),
        realisasiModal: realisasiModal > 0 ? realisasiModal : (buletinConfig.belanjaModalProyek?.realisasiModal || 0),
        persenModal: totalPaguModal > 0 ? persenModal : (buletinConfig.belanjaModalProyek?.persenModal || 0),
        daftarProyek: daftarProyek.length > 0 ? daftarProyek : (buletinConfig.belanjaModalProyek?.daftarProyek || []),
        rekomendasi: isFilterActive && filterSumberdana !== 'ALL'
          ? `Percepatan penyerapan dana ${filterSumberdana} pada satker terkait dengan pemantauan jadwal termin SPM-LS dan penyelesaian fisik proyek.`
          : `Percepatan penyerapan anggaran belanja modal dengan monitoring ketat pengajuan SPM-LS dan penyelesaian BAST termin tepat waktu.`
      },
      updatedAt: new Date().toISOString()
    };

    setBuletinConfig(updatedConfig);
    safeLocalStorageSet(STORAGE_KEY_BULETIN_CFG, JSON.stringify(updatedConfig));

    try {
      await setDoc(doc(db, 'settings', 'buletin_config'), updatedConfig, { merge: true });
    } catch (err) {
      console.warn('Notice saving buletin config:', err);
    }

    addToast({
      title: 'Sinkronisasi ke Buletin Berhasil',
      message: isFilterActive
        ? `Data realisasi terfilter (${activeFilterDescription || filterSumberdana}) berhasil disinkronkan ke Buletin & Warta.`
        : `Data belanja ${overallSummary.totalSatkerCount} Satker & ${overallSummary.totalRows.toLocaleString('id-ID')} baris SINTESA otomatis diperbarui di seluruh halaman Buletin & Warta.`,
      type: 'success'
    });
  };

  // Save / Update a single SINTESA record
  const handleSaveEditedRecord = (edited: RealisasiBelanjaRecord) => {
    const isExisting = records.some(r => r.id === edited.id);
    let updatedList: RealisasiBelanjaRecord[];

    const pagu = Number(edited.paguDipa) || 0;
    const real = Number(edited.realisasi) || 0;
    const sisa = Math.max(0, pagu - real);
    const persen = pagu > 0 ? (real / pagu) * 100 : 0;
    const jenisInfo = getJenisBelanjaInfo(edited.akunKode);

    const cleanRecord: RealisasiBelanjaRecord = {
      ...edited,
      paguDipa: pagu,
      realisasi: real,
      sisaPagu: sisa,
      persenRealisasi: persen,
      jenisBelanjaKode: jenisInfo.kode,
      jenisBelanjaUraian: jenisInfo.nama
    };

    if (isExisting) {
      updatedList = records.map(r => r.id === edited.id ? cleanRecord : r);
    } else {
      updatedList = [cleanRecord, ...records];
    }

    setRecords(updatedList);
    safeLocalStorageSet(STORAGE_KEY_REALISASI, JSON.stringify(updatedList.slice(0, 1000)));
    setEditingRecord(null);
    setIsAddingNewRecord(false);

    addToast({
      title: isExisting ? 'Baris Data Diperbarui' : 'Baris Data Ditambahkan',
      message: `Satker ${cleanRecord.satkerUraian} (Akun ${cleanRecord.akunKode}) berhasil disimpan.`,
      type: 'success'
    });
  };

  // Delete a single SINTESA record
  const handleDeleteRecord = (id: string) => {
    const updatedList = records.filter(r => r.id !== id);
    setRecords(updatedList);
    safeLocalStorageSet(STORAGE_KEY_REALISASI, JSON.stringify(updatedList.slice(0, 1000)));
    addToast({
      title: 'Baris Data Dihapus',
      message: 'Baris data SINTESA berhasil dihapus.',
      type: 'info'
    });
  };

  // Download Canva Bulk Create CSV
  const handleDownloadCanvaCSV = () => {
    const csvContent = generateCanvaBulkCreateCSV(
      overallSummary || filteredSummary,
      buletinConfig,
      satkers,
      dashboardConfig?.juknisList || []
    );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Canva_BulkCreate_Buletin_${buletinConfig.bulanTahun.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      title: 'Dataset Canva Berhasil Diunduh',
      message: 'File CSV siap dihubungkan ke fitur Canva "Bulk Create" (Buat Banyak).',
      type: 'success'
    });
  };

  // Print / Save PDF of the Buletin
  const handlePrintBuletin = () => {
    window.print();
  };

  // Theme color styles for Buletin preview
  const themeStyles = useMemo(() => {
    switch (buletinConfig.temaWarna) {
      case 'emerald':
        return {
          primaryBg: 'bg-emerald-900 text-white',
          headerBg: 'from-emerald-950 via-emerald-900 to-teal-900',
          accentBorder: 'border-emerald-500',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          subHeaderBg: 'bg-emerald-50 text-emerald-950',
          cardBorder: 'border-emerald-200',
          accentText: 'text-emerald-700'
        };
      case 'indigo':
        return {
          primaryBg: 'bg-indigo-900 text-white',
          headerBg: 'from-indigo-950 via-indigo-900 to-purple-900',
          accentBorder: 'border-indigo-500',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          subHeaderBg: 'bg-indigo-50 text-indigo-950',
          cardBorder: 'border-indigo-200',
          accentText: 'text-indigo-700'
        };
      case 'burgundy':
        return {
          primaryBg: 'bg-rose-950 text-white',
          headerBg: 'from-rose-950 via-rose-900 to-red-950',
          accentBorder: 'border-rose-500',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          subHeaderBg: 'bg-rose-50 text-rose-950',
          cardBorder: 'border-rose-200',
          accentText: 'text-rose-700'
        };
      case 'gold':
        return {
          primaryBg: 'bg-amber-950 text-white',
          headerBg: 'from-amber-950 via-yellow-950 to-slate-950',
          accentBorder: 'border-amber-400',
          badgeBg: 'bg-amber-400/25 text-amber-300 border-amber-400/50',
          subHeaderBg: 'bg-amber-50 text-amber-950',
          cardBorder: 'border-amber-200',
          accentText: 'text-amber-700'
        };
      default: // navy
        return {
          primaryBg: 'bg-slate-900 text-white',
          headerBg: 'from-slate-950 via-blue-950 to-indigo-950',
          accentBorder: 'border-amber-400',
          badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
          subHeaderBg: 'bg-blue-50 text-slate-900',
          cardBorder: 'border-blue-200',
          accentText: 'text-blue-700'
        };
    }
  }, [buletinConfig.temaWarna]);

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Main Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 text-white shadow-xl border border-blue-900/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                Modul Eksklusif Admin
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                OM-SPAN / SAKTI Realisasi Belanja
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30">
                🎨 Format Canva Ready
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>📰 17. Buletin & Warta KPPN</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pusat pengolahan data Excel realisasi belanja APBN, analisis filter multidimensi, serta generator otomatis Buletin Perbendaharaan resmi dengan format majalah A4 yang terintegrasi langsung dengan <strong>Canva Bulk Create</strong> dan ekspor cetak PDF.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isProcessing ? 'Memproses...' : 'Upload Excel Realisasi'}</span>
            </button>

            <button
              onClick={handleDownloadCanvaCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Canva Dataset</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
          {/* Tab 1: SINTESA */}
          <button
            onClick={() => setActiveSubTab('analisis')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'analisis'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/40'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>1. SINTESA (Inquiry Detail)</span>
            {records.length > 0 && (
              <span className="bg-blue-400/30 text-blue-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {records.length.toLocaleString('id-ID')} Baris
              </span>
            )}
          </button>

          {/* Tab 2: MY INTRESS */}
          <button
            onClick={() => setActiveSubTab('my-intress')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'my-intress'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>2. MY INTRESS (Per Jenis Belanja)</span>
            {intressRecords.length > 0 && (
              <span className="bg-emerald-400/30 text-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {intressRecords.length} Satker
              </span>
            )}
          </button>

          {/* Tab 3: REKONSILIASI */}
          <button
            onClick={() => setActiveSubTab('rekonsiliasi')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'rekonsiliasi'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/40'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <span>3. Sumber Perbedaan Data (Rekon)</span>
            <span className="bg-amber-400 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black">
              ANALISIS SATKER
            </span>
          </button>

          {/* Tab 4: DESAIN BULETIN A4 */}
          <button
            onClick={() => setActiveSubTab('desain-buletin')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'desain-buletin'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-purple-400/40'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>4. Studio Desain Buletin A4</span>
            <span className="bg-amber-400 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black">
              PRINT READY
            </span>
          </button>

          {/* Tab 5: CANVA EKSPOR */}
          <button
            onClick={() => setActiveSubTab('canva-ekspor')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'canva-ekspor'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30 ring-2 ring-pink-400/40'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>5. Canva (Bulk Create)</span>
            <span className="bg-pink-400/30 text-pink-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Canva CSV
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: ANALISIS & FILTER REALISASI BELANJA EXCEL                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'analisis' && (
        <div className="space-y-6">
          {/* Active File Banner & Action Toolbar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4.5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {activeFileName}
                  </h4>
                  {records.length > 0 ? (
                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                      Aktif ({records.length.toLocaleString('id-ID')} baris SINTESA)
                    </span>
                  ) : (
                    <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                      Data Kosong
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {records.length > 0 
                    ? `Terdiri dari ${overallSummary?.totalSatkerCount || 0} Satker dari ${overallSummary?.breakdownKementerian.length || 0} Kementerian/Lembaga (Format Akurat Kolom B s.d. AQ)`
                    : 'Belum ada data belanja. Anda dapat mengunggah file Excel atau memulihkan dataset bawaan SINTESA.'}
                </p>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sync to Buletin Button */}
              {records.length > 0 && (
                <button
                  onClick={handleSyncToBuletin}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white shadow-xs transition-all cursor-pointer"
                  title="Update rangkuman data realisasi belanja langsung ke konfigurasi Buletin & Warta"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sinkronkan ke Buletin</span>
                </button>
              )}

              {/* Tambah Baris Manual */}
              <button
                onClick={() => {
                  setEditingRecord(null);
                  setIsAddingNewRecord(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                title="Tambah baris transaksi belanja baru secara manual"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>

              {/* Download Excel */}
              {records.length > 0 && (
                <button
                  onClick={() => exportRealisasiBelanjaToExcel(filteredRecords)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  title="Download data SINTESA terfilter dalam format Excel lengkap"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Download Excel</span>
                </button>
              )}

              {/* Ganti File Excel */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Excel</span>
              </button>

              {/* Pulihkan Data Default jika kosong atau berbeda */}
              {records.length < (INITIAL_REALISASI_BELANJA?.length || 0) && (
                <button
                  onClick={handleResetDefaultData}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                  title="Pulihkan dataset asli SINTESA (5.196 baris lengkap)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Pulihkan Data Asli</span>
                </button>
              )}

              {/* Kosongkan Data Button */}
              {records.length > 0 && (
                <button
                  onClick={() => setShowClearConfirmModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
                  title="Kosongkan seluruh data realisasi belanja"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Dataset Switcher / Companion Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Sumber Data:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-blue-600 text-white shadow-xs">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>SINTESA Kemenkeu (5.196 Baris)</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveSubTab('my-intress')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Buka Data My InTress ({intressRecords.length} Satker) →</span>
              </button>

              <button
                onClick={() => setActiveSubTab('rekonsiliasi')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Cek Sumber Perbedaan Data →</span>
              </button>
            </div>
          </div>

          {/* Active Filter Notification Bar */}
          {isFilterActive && (
            <div className="p-3.5 rounded-2xl bg-linear-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  <Filter className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Filter Aktif:
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                      {activeFilterDescription || (filterSumberdana !== 'ALL' ? `Sumber Dana: ${filterSumberdana}` : 'Kustom')}
                    </span>
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      • {filteredRecords.length.toLocaleString('id-ID')} baris ({aggregatedSatkers.length} Satker)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Seluruh 4 Card Ringkasan, Grafik Jenis Belanja, dan Peringkat Satker di bawah otomatis menyesuaikan filter ini.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={handleSyncToBuletin}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Sinkronkan data terfilter ini langsung ke Buletin & Warta"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sinkronkan ke Buletin</span>
                </button>
                <button
                  onClick={() => {
                    setSearchSatker('');
                    setFilterJenisBelanja('ALL');
                    setFilterKementerian('ALL');
                    setFilterSatker('ALL');
                    setFilterSumberdana('ALL');
                    setFilterKewenangan('ALL');
                    setFilterRealisasiLevel('ALL');
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filter</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Metrics Cards (Dynamic based on Filter) */}
          {activeSummary ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Pagu DIPA */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs relative overflow-hidden">
                {isFilterActive && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-blue-600 text-[9px] font-black text-white rounded-bl-lg uppercase tracking-wider">
                    Terfilter
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Total Pagu DIPA {isFilterActive && '(Terfilter)'}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-xs">
                    Rp
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {formatRupiahShort(activeSummary.totalPagu)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {formatRupiahFull(activeSummary.totalPagu)}
                  </div>
                  {isFilterActive && overallSummary && overallSummary.totalPagu > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Porsi dari Total Pagu:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {((activeSummary.totalPagu / overallSummary.totalPagu) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Realisasi Belanja */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs relative overflow-hidden">
                {isFilterActive && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-600 text-[9px] font-black text-white rounded-bl-lg uppercase tracking-wider">
                    Terfilter
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Total Realisasi Belanja
                  </span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {activeSummary.persenRealisasiTotal.toFixed(2)}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                    {formatRupiahShort(activeSummary.totalRealisasi)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {formatRupiahFull(activeSummary.totalRealisasi)}
                  </div>
                  {isFilterActive && overallSummary && overallSummary.totalRealisasi > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Porsi dari Total Realisasi:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {((activeSummary.totalRealisasi / overallSummary.totalRealisasi) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Sisa Pagu Anggaran */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-amber-200/80 dark:border-amber-900/50 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Sisa Pagu Anggaran
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {(100 - activeSummary.persenRealisasiTotal).toFixed(2)}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xl font-black text-amber-700 dark:text-amber-400">
                    {formatRupiahShort(activeSummary.totalSisa)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {formatRupiahFull(activeSummary.totalSisa)}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Efisiensi / Sisa:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {(100 - activeSummary.persenRealisasiTotal).toFixed(1)}% belum terserap
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Satker & Baris Terfilter */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-purple-200/80 dark:border-purple-900/50 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Cakupan Data Terfilter
                  </span>
                  <Building2 className="w-4 h-4 text-purple-600" />
                </div>
                <div className="mt-2">
                  <div className="text-xl font-black text-purple-700 dark:text-purple-300">
                    {activeSummary.totalSatkerCount} Satker
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {activeSummary.breakdownKementerian.length} K/L • {activeSummary.totalRows.toLocaleString('id-ID')} Baris Data
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Dari total KPPN:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {overallSummary ? `${((activeSummary.totalSatkerCount / Math.max(1, overallSummary.totalSatkerCount)) * 100).toFixed(0)}% Satker` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Tidak Ada Data yang Cocok dengan Filter</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Kombinasi pencarian atau filter yang Anda pilih tidak menghasilkan baris belanja. Silakan klik tombol di bawah untuk menyetel ulang.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchSatker('');
                  setFilterJenisBelanja('ALL');
                  setFilterKementerian('ALL');
                  setFilterSatker('ALL');
                  setFilterSumberdana('ALL');
                  setFilterKewenangan('ALL');
                  setFilterRealisasiLevel('ALL');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer transition-colors"
              >
                Reset Semua Filter
              </button>
            </div>
          )}

          {/* Breakdown per Jenis Belanja (51, 52, 53, 57) - Dynamic to activeSummary */}
          {activeSummary && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-blue-600" />
                    <span>Realisasi per Jenis Belanja APBN (Akun 51, 52, 53, 57)</span>
                    {isFilterActive && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                        {filterSumberdana !== 'ALL' ? `SD: ${filterSumberdana}` : 'Terfilter'}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Rincian alokasi Pagu dan Realisasi untuk Belanja Pegawai (51), Barang (52), Modal (53), dan Bansos (57).
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Target Triwulan Berjalan: ≥ 50%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeSummary.breakdownJenisBelanja.map(item => (
                  <div 
                    key={item.kode}
                    onClick={() => {
                      setFilterJenisBelanja(filterJenisBelanja === item.kode ? 'ALL' : item.kode);
                      setCurrentPage(1);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      filterJenisBelanja === item.kode
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                        : 'border-slate-100 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-750'
                    } space-y-2`}
                    title={`Klik untuk memfilter rincian hanya Akun ${item.kode}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.nama}
                      </span>
                      <span 
                        className="text-xs font-black px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: `${item.color}20`, color: item.color }}
                      >
                        {item.persen.toFixed(2)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, item.persen)}%`, backgroundColor: item.color }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span>Real: {formatRupiahShort(item.realisasi)}</span>
                      <span>Pagu: {formatRupiahShort(item.pagu)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multidimensional Filter Bar with Quick Presets */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span>Filter Multidimensi SINTESA Kemenkeu</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pencarian presisi lintas K/L (B), Satker (P), Program (V), Kegiatan (X), KRO (Z), Akun (AA), dan Sumber Dana (AD)
                </p>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                Menampilkan <strong>{filteredRecords.length.toLocaleString('id-ID')}</strong> dari {records.length.toLocaleString('id-ID')} baris ({aggregatedSatkers.length} Satker)
              </span>
            </div>

            {/* Quick Filter Chips: Sumber Dana */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  ⚡ Filter Cepat Sumber Dana (Kolom AD):
                </span>
                {filterSumberdana !== 'ALL' && (
                  <button 
                    onClick={() => { setFilterSumberdana('ALL'); setCurrentPage(1); }}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    Tampilkan Semua Sumber Dana
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => { setFilterSumberdana('ALL'); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterSumberdana === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Semua Sumber Dana ({records.length})
                </button>
                
                {/* Specific High-Value Presets */}
                {['SBSN', 'RM', 'PNBP', 'BLU'].map((sdKey) => {
                  const matchCount = records.filter(r => (r.sumberDanaKode || '').toUpperCase().includes(sdKey) || (r.sumberDanaUraian || '').toUpperCase().includes(sdKey)).length;
                  if (matchCount === 0) return null;
                  const isSelected = filterSumberdana.toUpperCase() === sdKey;
                  return (
                    <button
                      key={sdKey}
                      onClick={() => {
                        setFilterSumberdana(isSelected ? 'ALL' : sdKey);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/30'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{sdKey === 'SBSN' ? '🕌 SBSN (Syariah)' : sdKey === 'RM' ? '🏛️ Rupiah Murni (RM)' : sdKey === 'PNBP' ? '📊 PNBP' : '🏥 BLU'}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>
                        {matchCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Filter Chips: Jenis Belanja */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                ⚡ Filter Cepat Jenis Belanja (Akun):
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { kode: 'ALL', label: 'Semua Akun' },
                  { kode: '51', label: '51 - Pegawai' },
                  { kode: '52', label: '52 - Barang' },
                  { kode: '53', label: '53 - Modal (Proyek)' },
                  { kode: '57', label: '57 - Bansos' }
                ].map((jb) => {
                  const isSelected = filterJenisBelanja === jb.kode;
                  return (
                    <button
                      key={jb.kode}
                      onClick={() => {
                        setFilterJenisBelanja(jb.kode);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/30'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {jb.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Filter Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-2">
              {/* Search Satker / Akun / KRO / Program */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-500">Pencarian Kata Kunci SINTESA</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari Satker / Akun / KRO / Program / SD..."
                    value={searchSatker}
                    onChange={(e) => { setSearchSatker(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-8.5 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Kementerian / Lembaga (20 K/L) */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-500">Kementerian / Lembaga (Kolom B)</label>
                <select
                  value={filterKementerian}
                  onChange={(e) => { setFilterKementerian(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white truncate"
                >
                  <option value="ALL">Semua Kementerian / Lembaga (20 K/L)</option>
                  {uniqueKementerians.map(k => (
                    <option key={k.kode} value={k.kode}>{k.label}</option>
                  ))}
                </select>
              </div>

              {/* Satuan Kerja (127 Satker) */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-500">Satuan Kerja (Kolom P)</label>
                <select
                  value={filterSatker}
                  onChange={(e) => { setFilterSatker(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white truncate"
                >
                  <option value="ALL">Semua Satker ({uniqueSatkers.length} Satker)</option>
                  {uniqueSatkers.map(s => (
                    <option key={s.kode} value={s.kode}>{s.kode} - {s.nama}</option>
                  ))}
                </select>
              </div>

              {/* Sumber Dana (Kolom AD) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Sumber Dana (Kolom AD)</label>
                <select
                  value={filterSumberdana}
                  onChange={(e) => { setFilterSumberdana(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white truncate"
                >
                  <option value="ALL">Semua Sumber Dana</option>
                  {uniqueSumberdanas.map(sd => (
                    <option key={sd} value={sd}>{sd}</option>
                  ))}
                </select>
              </div>

              {/* Jenis Belanja */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Jenis Belanja (Akun)</label>
                <select
                  value={filterJenisBelanja}
                  onChange={(e) => { setFilterJenisBelanja(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="ALL">Semua Jenis</option>
                  <option value="51">51 - Pegawai</option>
                  <option value="52">52 - Barang</option>
                  <option value="53">53 - Modal</option>
                  <option value="57">57 - Bansos</option>
                </select>
              </div>

              {/* Kewenangan */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Kewenangan</label>
                <select
                  value={filterKewenangan}
                  onChange={(e) => { setFilterKewenangan(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white truncate"
                >
                  <option value="ALL">Semua Kewenangan</option>
                  {uniqueKewenangans.map(kw => (
                    <option key={kw} value={kw}>{kw}</option>
                  ))}
                </select>
              </div>

              {/* Tingkat Realisasi */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Status Penyerapan</label>
                <select
                  value={filterRealisasiLevel}
                  onChange={(e) => { setFilterRealisasiLevel(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="ALL">Semua Tingkat</option>
                  <option value="UNDER_50">Rendah (&lt; 50%)</option>
                  <option value="50_TO_80">Sedang (50% - 80%)</option>
                  <option value="OVER_80">Tinggi (&gt; 80%)</option>
                  <option value="HUNDRED">Optimal (100%)</option>
                </select>
              </div>
            </div>

            {/* Clear Filter Button */}
            {isFilterActive && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <div className="text-xs text-slate-500">
                  Filter aktif: {searchSatker && `"${searchSatker}" `}
                  {filterKementerian !== 'ALL' && `[K/L: ${filterKementerian}] `}
                  {filterSatker !== 'ALL' && `[Satker: ${filterSatker}] `}
                  {filterSumberdana !== 'ALL' && `[SD: ${filterSumberdana}] `}
                  {filterJenisBelanja !== 'ALL' && `[Belanja: ${filterJenisBelanja}] `}
                  {filterKewenangan !== 'ALL' && `[Kewenangan: ${filterKewenangan}] `}
                  {filterRealisasiLevel !== 'ALL' && `[Penyerapan: ${filterRealisasiLevel}] `}
                </div>
                <button
                  onClick={() => {
                    setSearchSatker('');
                    setFilterJenisBelanja('ALL');
                    setFilterKementerian('ALL');
                    setFilterSatker('ALL');
                    setFilterSumberdana('ALL');
                    setFilterKewenangan('ALL');
                    setFilterRealisasiLevel('ALL');
                    setCurrentPage(1);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>↺ Reset Semua Filter</span>
                </button>
              </div>
            )}
          </div>

          {/* Top 5 & Bottom 5 Satker Leaderboard (Dynamic to activeSummary) */}
          {activeSummary && activeSummary.topSatkers.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 5 */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Top Satker Realisasi Tertinggi</span>
                    {isFilterActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        Terfilter ({activeSummary.topSatkers.length} Satker)
                      </span>
                    )}
                  </h4>
                  <span className="text-[11px] text-slate-400">Peringkat 1 s.d. 5</span>
                </div>

                <div className="space-y-2">
                  {activeSummary.topSatkers.slice(0, 5).map((s, idx) => (
                    <div 
                      key={s.kodeSatker} 
                      onClick={() => setSelectedSatkerKode(s.kodeSatker)}
                      className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 cursor-pointer transition-colors"
                      title="Klik untuk melihat rincian belanja Satker ini"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {s.namaSatker}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Kode: {s.kodeSatker} • Real: {formatRupiahShort(s.realisasi)} (Pagu: {formatRupiahShort(s.pagu)})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                          {s.persen.toFixed(2)}%
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom 5 */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-rose-200/80 dark:border-rose-900/50 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Satker Perlu Akselerasi Penyerapan</span>
                    {isFilterActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                        Terfilter
                      </span>
                    )}
                  </h4>
                  <span className="text-[11px] text-slate-400">Peringkat Terbawah</span>
                </div>

                <div className="space-y-2">
                  {activeSummary.bottomSatkers.slice(0, 5).map((s, idx) => (
                    <div 
                      key={s.kodeSatker} 
                      onClick={() => setSelectedSatkerKode(s.kodeSatker)}
                      className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between text-xs hover:bg-rose-100/60 dark:hover:bg-rose-900/40 cursor-pointer transition-colors"
                      title="Klik untuk melihat rincian belanja Satker ini"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                          !
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {s.namaSatker}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Kode: {s.kodeSatker} • Sisa: {formatRupiahShort(Math.max(0, s.pagu - s.realisasi))} (Real: {formatRupiahShort(s.realisasi)})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs font-black text-rose-700 dark:text-rose-400">
                          {s.persen.toFixed(2)}%
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-rose-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Table Mode View Switcher & Interactive Data Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>Struktur &amp; Rincian Data Realisasi Belanja SINTESA</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih mode tampilan untuk melihat data secara teragregasi per Satker, rincian 5.196 baris, atau matriks per K/L.
                </p>
              </div>

              {/* View Mode Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl">
                <button
                  onClick={() => { setTableViewMode('satker_summary'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tableViewMode === 'satker_summary'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  🏢 1. Agregasi per Satker ({aggregatedSatkers.length})
                </button>
                <button
                  onClick={() => { setTableViewMode('all_rows'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tableViewMode === 'all_rows'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  📑 2. Rincian Baris SINTESA ({filteredRecords.length.toLocaleString('id-ID')})
                </button>
                <button
                  onClick={() => { setTableViewMode('kementerian_matrix'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tableViewMode === 'kementerian_matrix'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  🏛️ 3. Matriks 20 K/L ({aggregatedKementerians.length})
                </button>
                <button
                  onClick={() => { setTableViewMode('sumberdana_kro'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tableViewMode === 'sumberdana_kro'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  💰 4. Sumber Dana (AD) ({aggregatedSumberdanas.length})
                </button>
              </div>
            </div>

            {/* TAB VIEW 1: AGREGASI PER SATKER */}
            {tableViewMode === 'satker_summary' && (
              <div className="space-y-3">
                {paginatedSatkers.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 space-y-2">
                    <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-sm">Tidak ada Satuan Kerja yang sesuai dengan filter.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-3">No</th>
                          <th className="py-3 px-3">Kode &amp; Satuan Kerja (Kolom O &amp; P)</th>
                          <th className="py-3 px-3">Kementerian / Lembaga (Kolom B)</th>
                          <th className="py-3 px-3">Kewenangan</th>
                          <th className="py-3 px-3 text-right">Pagu DIPA (Rp)</th>
                          <th className="py-3 px-3 text-right">Realisasi (Rp)</th>
                          <th className="py-3 px-3 text-center">Capaian (%)</th>
                          <th className="py-3 px-3 text-right">Sisa Pagu (Rp)</th>
                          <th className="py-3 px-3 text-center">Aksi / Rincian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {paginatedSatkers.map((s, idx) => {
                          const rowNum = (currentPage - 1) * itemsPerPage + idx + 1;
                          return (
                            <tr key={s.satkerKode} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-slate-400">{rowNum}</td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900 dark:text-white truncate max-w-[250px]">
                                  {s.satkerUraian}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Kode: {s.satkerKode} • {s.totalBaris} baris SINTESA
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                                  {s.kementerianUraian}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Kode K/L: {s.kementerianKode}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                  {s.kewenanganUraian}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 dark:text-white">
                                {formatRupiahFull(s.paguDipa)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                {formatRupiahFull(s.realisasi)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                                  s.persenRealisasi >= 80
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : s.persenRealisasi >= 50
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}>
                                  {s.persenRealisasi.toFixed(2)}%
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                                {formatRupiahFull(s.sisaPagu)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => setSelectedSatkerKode(s.satkerKode)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Detail SINTESA</span>
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
            )}

            {/* TAB VIEW 2: RINCIAN LENGKAP BARIS DATA SINTESA (5.196 BARIS) */}
            {tableViewMode === 'all_rows' && (
              <div className="space-y-3">
                {paginatedRecords.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 space-y-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
                    <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Tidak ada baris data yang sesuai dengan filter</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Coba sesuaikan filter pencarian, atau klik tombol di bawah untuk memulihkan dataset asli SINTESA.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        onClick={handleResetDefaultData}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Muat 5.196 Baris SINTESA</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-3 w-10">No</th>
                          <th className="py-3 px-3 min-w-[200px]">Satuan Kerja &amp; K/L (O, P, B)</th>
                          <th className="py-3 px-3 min-w-[200px]">Program &amp; Kegiatan (V &amp; X)</th>
                          <th className="py-3 px-3 min-w-[160px]">Output KRO (Y &amp; Z)</th>
                          <th className="py-3 px-3 min-w-[180px]">Akun 6-Digit (AA &amp; AB)</th>
                          <th className="py-3 px-3 min-w-[150px]">Eselon I &amp; Kewenangan (C &amp; E)</th>
                          <th className="py-3 px-3 text-center">Sumber Dana (AD)</th>
                          <th className="py-3 px-3 text-right min-w-[110px]">Pagu (AP)</th>
                          <th className="py-3 px-3 text-right min-w-[110px]">Realisasi (AQ)</th>
                          <th className="py-3 px-3 text-center">Capaian</th>
                          <th className="py-3 px-3 text-center w-16">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedRecords.map((r, idx) => {
                          const rowNum = (currentPage - 1) * itemsPerPage + idx + 1;
                          const jenisInfo = getJenisBelanjaInfo(r.akunKode);

                          return (
                            <tr key={r.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                              <td className="py-3 px-3 font-semibold text-slate-400 align-top">{rowNum}</td>
                              
                              {/* Satker & K/L */}
                              <td className="py-3 px-3 align-top whitespace-normal break-words">
                                <div className="font-bold text-slate-900 dark:text-white leading-snug">
                                  {r.satkerUraian}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono mt-1">
                                  Satker: {r.satkerKode} • K/L: {r.kementerianUraian}
                                </div>
                              </td>

                              {/* Program & Kegiatan */}
                              <td className="py-3 px-3 align-top whitespace-normal break-words">
                                <div className="font-bold text-slate-800 dark:text-slate-200 leading-snug">
                                  {r.programUraian || '-'}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                                  {r.kegiatanUraian || '-'}
                                </div>
                              </td>

                              {/* Output KRO */}
                              <td className="py-3 px-3 align-top whitespace-normal break-words">
                                <div className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                                  {r.outputKroUraian || '-'}
                                </div>
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold mt-1">
                                  KRO: {r.outputKroKode || '-'}
                                </div>
                              </td>

                              {/* Akun 6-digit & Uraian */}
                              <td className="py-3 px-3 align-top whitespace-normal break-words">
                                <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white">
                                  <span 
                                    className="w-2 h-2 rounded-full shrink-0" 
                                    style={{ backgroundColor: jenisInfo.color }}
                                  />
                                  <span>{r.akunKode}</span>
                                </div>
                                <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 leading-snug">
                                  {r.akunUraian}
                                </div>
                              </td>

                              {/* Eselon I & Kewenangan */}
                              <td className="py-3 px-3 align-top whitespace-normal break-words text-[11px]">
                                <div className="font-semibold text-purple-700 dark:text-purple-300">
                                  {r.eselonIUraian || '-'}
                                </div>
                                <div className="text-slate-500 mt-0.5">
                                  {r.kewenanganUraian || 'Kantor Daerah'}
                                </div>
                              </td>

                              {/* Sumber Dana */}
                              <td className="py-3 px-3 align-top text-center">
                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                                  {r.sumberdanaUraian || 'RM'}
                                </span>
                              </td>

                              {/* Pagu */}
                              <td className="py-3 px-3 align-top text-right font-mono font-medium text-slate-900 dark:text-white">
                                {formatRupiahFull(r.paguDipa)}
                              </td>

                              {/* Realisasi */}
                              <td className="py-3 px-3 align-top text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                {formatRupiahFull(r.realisasi)}
                              </td>

                              {/* Capaian */}
                              <td className="py-3 px-3 align-top text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  r.persenRealisasi >= 80
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : r.persenRealisasi >= 50
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}>
                                  {r.persenRealisasi.toFixed(1)}%
                                </span>
                              </td>

                              {/* Aksi */}
                              <td className="py-3 px-3 align-top text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingRecord(r);
                                      setIsAddingNewRecord(false);
                                    }}
                                    className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                    title="Edit Baris"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRecord(r.id)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                    title="Hapus Baris"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB VIEW 3: MATRIKS KEMENTERIAN / LEMBAGA (20 K/L) */}
            {tableViewMode === 'kementerian_matrix' && (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-3">No</th>
                        <th className="py-3 px-3">Kode K/L</th>
                        <th className="py-3 px-3">Kementerian / Lembaga (Kolom B)</th>
                        <th className="py-3 px-3 text-center">Jumlah Satker</th>
                        <th className="py-3 px-3 text-right">Pagu DIPA (Rp)</th>
                        <th className="py-3 px-3 text-right">Realisasi (Rp)</th>
                        <th className="py-3 px-3 text-center">Capaian (%)</th>
                        <th className="py-3 px-3 text-right">Sisa Pagu (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {aggregatedKementerians.map((k, idx) => (
                        <tr key={k.kode} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{k.kode}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{k.nama}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              {k.totalSatker} Satker
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 dark:text-white">
                            {formatRupiahFull(k.paguDipa)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {formatRupiahFull(k.realisasi)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-black ${
                              k.persenRealisasi >= 80
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : k.persenRealisasi >= 50
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {k.persenRealisasi.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                            {formatRupiahFull(k.sisaPagu)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB VIEW 4: SUMBER DANA & OUTPUT KRO */}
            {tableViewMode === 'sumberdana_kro' && (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-3">No</th>
                        <th className="py-3 px-3">Sumber Dana (Kolom AD)</th>
                        <th className="py-3 px-3 text-center">Jumlah Baris Rincian</th>
                        <th className="py-3 px-3 text-right">Pagu DIPA (Rp)</th>
                        <th className="py-3 px-3 text-right">Realisasi (Rp)</th>
                        <th className="py-3 px-3 text-center">Capaian (%)</th>
                        <th className="py-3 px-3 text-right">Sisa Pagu (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {aggregatedSumberdanas.map((sd, idx) => (
                        <tr key={sd.sumberdana} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{sd.sumberdana}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{sd.totalBaris}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 dark:text-white">
                            {formatRupiahFull(sd.paguDipa)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {formatRupiahFull(sd.realisasi)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-black ${
                              sd.persenRealisasi >= 80
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : sd.persenRealisasi >= 50
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {sd.persenRealisasi.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                            {formatRupiahFull(sd.sisaPagu)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-200"
                >
                  ← Sebelumnya
                </button>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-slate-500">{totalPages} Halaman</span>
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-200"
                >
                  Berikutnya →
                </button>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* COMPREHENSIVE POPUP MODAL: RINCIAN DETAIL BELANJA SATKER SINTESA         */}
          {/* ========================================================================= */}
          {selectedSatkerInfo && (
            <SintesaSatkerDetailModal
              satkerInfo={selectedSatkerInfo}
              onClose={() => setSelectedSatkerKode(null)}
              onEditRecord={(record) => {
                setEditingRecord(record);
                setIsAddingNewRecord(false);
              }}
              onDeleteRecord={handleDeleteRecord}
              onAddNewRecord={() => {
                setEditingRecord(null);
                setIsAddingNewRecord(true);
              }}
            />
          )}

          {/* ========================================================================= */}
          {/* POPUP MODAL: FORM TAMBAH / EDIT BARIS DATA SINTESA                        */}
          {/* ========================================================================= */}
          {(isAddingNewRecord || !!editingRecord) && (
            <SintesaRecordEditModal
              isOpen={isAddingNewRecord || !!editingRecord}
              onClose={() => {
                setEditingRecord(null);
                setIsAddingNewRecord(false);
              }}
              onSave={handleSaveEditedRecord}
              initialRecord={editingRecord}
              defaultSatkerKode={selectedSatkerInfo?.satkerKode || ''}
              defaultSatkerUraian={selectedSatkerInfo?.satkerUraian || ''}
              defaultKemKode={selectedSatkerInfo?.kementerianKode || ''}
              defaultKemUraian={selectedSatkerInfo?.kementerianUraian || ''}
            />
          )}

          {/* ========================================================================= */}
          {/* CONFIRMATION MODAL: KOSONGKAN SEMUA DATA REALISASI BELANJA               */}
          {/* ========================================================================= */}
          {showClearConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      Kosongkan Semua Data Realisasi?
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Tindakan ini akan mengosongkan seluruh <strong>{records.length.toLocaleString('id-ID')} baris data</strong> realisasi belanja. Anda dapat mengunggah file Excel baru atau memulihkan data asli SINTESA kapan saja.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setShowClearConfirmModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleClearAllData}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Kosongkan Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: DATA & ANALISIS REALISASI BELANJA MY INTRESS                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'my-intress' && (
        <div className="space-y-6">
          <MyIntressAnalysisView
            theme={theme}
            isDark={isDark}
            records={intressRecords}
            intressRecords={intressRecords}
            summary={intressSummary}
            intressSummary={intressSummary}
            activeFileName={intressFileName}
            waktuUnduh={intressWaktuUnduh}
            isProcessing={isIntressProcessing}
            onUploadExcel={handleUploadMyIntressExcel}
            onResetDefaultData={handleResetDefaultMyIntress}
            onResetDefault={handleResetDefaultMyIntress}
            onClearAllData={handleClearMyIntress}
            onClearData={handleClearMyIntress}
            onSyncToBuletin={handleSyncMyIntressToBuletin}
            onNavigateToReconciliation={() => setActiveSubTab('rekonsiliasi')}
            onNavigateToSintesa={() => setActiveSubTab('analisis')}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: REKONSILIASI & SUMBER PERBEDAAN DATA SINTESA VS MY INTRESS    */}
      {/* ========================================================================= */}
      {activeSubTab === 'rekonsiliasi' && (
        <div className="space-y-6">
          <RealisasiReconciliationView
            theme={theme}
            isDark={isDark}
            sintesaRecords={records}
            intressRecords={intressRecords}
            myIntressRecords={intressRecords}
            sintesaFileName={activeFileName}
            intressFileName={intressFileName}
            onNavigateToSintesa={() => setActiveSubTab('analisis')}
            onNavigateToMyIntress={() => setActiveSubTab('my-intress')}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: STUDIO DESAIN & PREVIEW BULETIN A4 (PRINT READY)              */}
      {/* ========================================================================= */}
      {activeSubTab === 'desain-buletin' && (
        <div className="space-y-8">
          {/* Complete Buletin Data Studio Editor */}
          <BuletinDataStudioEditor
            buletinConfig={buletinConfig}
            onUpdateBuletinConfig={(newConfig) => {
              setBuletinConfig(newConfig);
              safeLocalStorageSet(STORAGE_KEY_BULETIN_CFG, JSON.stringify(newConfig));
            }}
            overallSummary={overallSummary}
            satkers={satkers}
          />

          {/* ============================================================ */}
          {/* LIVE A4 BULETIN PREVIEW (MAGAZINE LAYOUT)                   */}
          {/* ============================================================ */}
          <div id="buletin-live-preview-section" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Pratinjau Visual Majalah &amp; Warta Resmi KPPN Semarang I (20 Halaman Standar A4)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Otomatis sinkron dengan hasil isian Data Studio, unggahan foto, dan rekapitulasi data riil APBN.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSaveBuletinConfig}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan ke Cloud</span>
                </button>
                <button
                  onClick={handlePrintBuletin}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Ekspor PDF A4</span>
                </button>
              </div>
            </div>

            {/* Render Modern Magazine Layout */}
            <BuletinMagazineLayout
              buletinConfig={buletinConfig}
              overallSummary={overallSummary}
              satkers={satkers}
              themeStyles={themeStyles}
              onUpdateBuletinConfig={(newConfig) => {
                setBuletinConfig(newConfig);
                safeLocalStorageSet(STORAGE_KEY_BULETIN_CFG, JSON.stringify(newConfig));
              }}
              onEditField={(fieldKey) => {
                const editorElement = document.getElementById('buletin-data-studio-editor');
                if (editorElement) {
                  editorElement.scrollIntoView({ behavior: 'smooth' });
                }
                addToast(`Silakan perbarui data untuk "${fieldKey}" di panel editor di atas.`, 'info');
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: INTEGRASI & PANDUAN CANVA (BULK CREATE & TEMPLATE)            */}
      {/* ========================================================================= */}
      {activeSubTab === 'canva-ekspor' && (
        <div className="space-y-6">
          {/* Main Canva Info Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-pink-950 via-purple-950 to-indigo-950 text-white border border-pink-500/30 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                C
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Integrasi Otomatis Canva: Bulk Create &amp; A4 Newsletter
                </h3>
                <p className="text-xs text-pink-200">
                  Cara termudah mendesain buletin di Canva tanpa perlu mengetik ulang angka dan nama satker satu per satu!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-2">
                <span className="text-xs font-black text-pink-300 uppercase">Langkah 1: Download CSV</span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Klik tombol <strong>Download Canva CSV</strong> di bawah. File CSV ini sudah memetakan semua variabel (Total Pagu, Realisasi %, Top Satker, dll.).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-2">
                <span className="text-xs font-black text-purple-300 uppercase">Langkah 2: Buka Canva</span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Buka template buletin/majalah/newsletter A4 di Canva, lalu cari menu <strong>Apps (Aplikasi) &gt; "Bulk Create" (Buat Banyak)</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-2">
                <span className="text-xs font-black text-indigo-300 uppercase">Langkah 3: Hubungkan Data</span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Upload file CSV tadi, lalu klik kanan teks di Canva &gt; pilih <strong>"Connect Data"</strong> (Hubungkan Data). Canva akan otomatis mengisi seluruh halaman!
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10">
              <button
                onClick={handleDownloadCanvaCSV}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-white text-slate-950 hover:bg-slate-100 shadow-lg transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-pink-600" />
                <span>Unduh Dataset Canva CSV Sekarang</span>
              </button>

              <a
                href={buletinConfig.canvaTemplateUrl || 'https://www.canva.com/templates/?query=newsletter+annual+report+a4'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-pink-600 hover:bg-pink-700 text-white shadow-lg transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka Template Newsletter di Canva ↗</span>
              </a>
            </div>
          </div>

          {/* Detailed Guide & Canva Variable Mapping Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>Daftar Variabel Data yang Siap Dihubungkan ke Canva</span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Nama Variabel (Canva Tag)</th>
                    <th className="py-2.5 px-3">Keterangan Isi Data</th>
                    <th className="py-2.5 px-3">Contoh Nilai Terkini</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono text-[11px]">
                  <tr>
                    <td className="py-2 px-3 font-bold text-pink-600">{'{{Edisi_Buletin}}'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-sans">Nomor Edisi &amp; Volume Warta</td>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{buletinConfig.edisi}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-pink-600">{'{{Total_Pagu_Short}}'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-sans">Total Pagu DIPA (Singkat M/T)</td>
                    <td className="py-2 px-3 font-bold text-blue-600">{formatRupiahShort(overallSummary?.totalPagu || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-pink-600">{'{{Total_Realisasi_Short}}'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-sans">Total Realisasi Anggaran (Singkat M/T)</td>
                    <td className="py-2 px-3 font-bold text-emerald-600">{formatRupiahShort(overallSummary?.totalRealisasi || 0)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-pink-600">{'{{Persen_Realisasi_Total}}'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-sans">Persentase Penyerapan Belanja Total</td>
                    <td className="py-2 px-3 font-bold text-emerald-600">{(overallSummary?.persenRealisasiTotal || 0).toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-pink-600">{'{{Top_Satker_1_Nama}}'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-sans">Nama Satker Terbaik Peringkat 1</td>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{overallSummary?.topSatkers[0]?.namaSatker || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-pink-600">{'{{Highlight_Tips_SAKTI_1}}'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-sans">Tips Juknis SAKTI Rubrik Edukasi</td>
                    <td className="py-2 px-3 font-sans text-[10px] text-slate-600 dark:text-slate-300 truncate max-w-[240px]">{buletinConfig.tipsSaktiCustom?.[0] || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
