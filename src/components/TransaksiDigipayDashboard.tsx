import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag,
  CreditCard,
  Building2,
  TrendingUp,
  Search,
  Download,
  Calendar,
  Layers,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Trophy,
  Award,
  Wallet,
  Receipt,
  Store,
  Landmark,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  X,
  CalendarDays,
  RotateCcw,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Phone,
  UserCheck,
  Save,
  PhoneCall,
  Info,
  ChevronRight,
  Send,
  Edit3
} from 'lucide-react';
import { DigipayRecord, MasterSatker, DigipaySatkerSummary } from '../types';
import { aggregateDigipayRecords } from '../data/initialDigipayData';
import {
  exportDigipayToExcel,
  downloadDigipayTemplate,
  extractMonthFromRecord,
  INDONESIAN_MONTHS,
  isRecordMatchingFilter,
  getMonthInfoFromPeriodKey
} from '../utils/modularExcelProcessors';
import { verifySatkerPassword, getSatkerDefaultPassword, resolveKodeBA } from '../utils/satkerSecurity';
import { PaginationControl } from './PaginationControl';

interface TransaksiDigipayDashboardProps {
  records: DigipayRecord[];
  masterSatkers?: MasterSatker[];
  lastUpdateDate?: string;
  theme?: 'light' | 'dark';
  dashboardConfig?: any;
  onNavigateToAdmin?: () => void;
  onGoToAdmin?: () => void;
  onApplyRecords?: (newRecords: DigipayRecord[]) => void;
  onSaveMasterSatker?: (satker: MasterSatker) => void;
  isAdminAuthenticated?: boolean;
}

export const TransaksiDigipayDashboard: React.FC<TransaksiDigipayDashboardProps> = ({
  records = [],
  masterSatkers = [],
  lastUpdateDate,
  theme = 'light',
  dashboardConfig,
  onNavigateToAdmin,
  onGoToAdmin,
  onApplyRecords,
  onSaveMasterSatker,
  isAdminAuthenticated = false
}) => {
  const isDark = theme === 'dark';
  const handleGoToAdmin = onGoToAdmin || onNavigateToAdmin;

  // Monthly Period filter state
  const [filterMode, setFilterMode] = useState<'CUMULATIVE' | 'SINGLE'>('CUMULATIVE');
  const [selectedMonth, setSelectedMonth] = useState<string>('Agustus 2026');

  // Sub-view state
  const [activeSubTab, setActiveSubTab] = useState<'rekap' | 'va' | 'kkp' | 'ekosistem'>('rekap');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [bankFilter, setBankFilter] = useState<string>('ALL');
  const [rankSortBy, setRankSortBy] = useState<'count' | 'nominal'>('count');
  
  // Selected Satker for Detailed Modal
  const [selectedSatkerSummary, setSelectedSatkerSummary] = useState<DigipaySatkerSummary | null>(null);

  // Security and Password Verification State for Satker Details
  const [unlockedSatkerKodes, setUnlockedSatkerKodes] = useState<Set<string>>(new Set());
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Contact / PIC Info State
  const [contactFormData, setContactFormData] = useState<{
    namaPic: string;
    noHpPic: string;
    jabatanPic: string;
  }>({
    namaPic: '',
    noHpPic: '',
    jabatanPic: 'Operator Pembayaran / Digipay'
  });
  const [isEditingContact, setIsEditingContact] = useState<boolean>(false);
  const [contactSaveFeedback, setContactSaveFeedback] = useState<string | null>(null);
  const [selectedDetailTab, setSelectedDetailTab] = useState<'transaksi' | 'kontak' | 'vendor'>('transaksi');
  const [detailFilterType, setDetailFilterType] = useState<'ALL' | 'VA' | 'KKP'>('ALL');
  const [detailSearch, setDetailSearch] = useState<string>('');

  // Pagination for tables
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Format Currency
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Find matching Master Satker record for the selected satker
  const currentMasterSatker = useMemo(() => {
    if (!selectedSatkerSummary) return null;
    return masterSatkers.find(m => m.kodeSatker === selectedSatkerSummary.kodeSatker) || null;
  }, [selectedSatkerSummary, masterSatkers]);

  // Sync contact data whenever selected Satker changes
  useEffect(() => {
    if (selectedSatkerSummary) {
      setPasswordInput('');
      setPasswordError(null);
      setShowPassword(false);
      setIsEditingContact(false);
      setContactSaveFeedback(null);
      setSelectedDetailTab('transaksi');
      setDetailFilterType('ALL');
      setDetailSearch('');

      const master = masterSatkers.find(m => m.kodeSatker === selectedSatkerSummary.kodeSatker);
      const existingPhone = master?.noHpPic || 
                            master?.pejabatOperator?.operatorPembayaran?.noHp || 
                            master?.pejabatOperator?.bendahara?.noHp || 
                            '';
      const existingNama = master?.namaPic || 
                           master?.pejabatOperator?.operatorPembayaran?.nama || 
                           master?.pejabatOperator?.bendahara?.nama || 
                           '';
      const existingJabatan = master?.pejabatOperator?.operatorPembayaran?.nama ? 'Operator Pembayaran' : 
                              master?.pejabatOperator?.bendahara?.nama ? 'Bendahara Pengeluaran' : 
                              'PIC Digipay / Operator';

      setContactFormData({
        namaPic: existingNama,
        noHpPic: existingPhone,
        jabatanPic: existingJabatan
      });
    }
  }, [selectedSatkerSummary, masterSatkers]);

  // Check if detail is currently unlocked for selected Satker
  const isSelectedSatkerUnlocked = useMemo(() => {
    if (!selectedSatkerSummary) return false;
    if (isAdminAuthenticated) return true;
    return unlockedSatkerKodes.has(selectedSatkerSummary.kodeSatker);
  }, [selectedSatkerSummary, isAdminAuthenticated, unlockedSatkerKodes]);

  // Verify Satker Password
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSatkerSummary) return;

    const targetSatker = currentMasterSatker || {
      kodeSatker: selectedSatkerSummary.kodeSatker,
      kementerianLembaga: selectedSatkerSummary.kementerianLembaga,
      kodeBa: resolveKodeBA({ kementerianLembaga: selectedSatkerSummary.kementerianLembaga, kodeSatker: selectedSatkerSummary.kodeSatker })
    };

    const isMatch = verifySatkerPassword(targetSatker, passwordInput, isAdminAuthenticated);

    if (isMatch) {
      setUnlockedSatkerKodes(prev => new Set([...prev, selectedSatkerSummary.kodeSatker]));
      setPasswordError(null);
    } else {
      setPasswordError('Password Satker tidak sesuai. Silakan masukkan password resmi Satker Anda (contoh: [KodeSatker]_[KodeBA]) atau gunakan PIN Admin KPPN.');
    }
  };

  // Lock Satker back
  const handleLockSatker = () => {
    if (!selectedSatkerSummary) return;
    setUnlockedSatkerKodes(prev => {
      const next = new Set(prev);
      next.delete(selectedSatkerSummary.kodeSatker);
      return next;
    });
    setPasswordInput('');
    setPasswordError(null);
  };

  // Save PIC / Contact phone number for this Satker
  const handleSaveContact = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedSatkerSummary) return;

    const cleanPhone = contactFormData.noHpPic.trim();
    const cleanNama = contactFormData.namaPic.trim();

    if (currentMasterSatker) {
      const updatedMaster: MasterSatker = {
        ...currentMasterSatker,
        namaPic: cleanNama || currentMasterSatker.namaPic,
        noHpPic: cleanPhone || currentMasterSatker.noHpPic,
        pejabatOperator: {
          ...currentMasterSatker.pejabatOperator,
          operatorPembayaran: {
            nama: cleanNama || currentMasterSatker.pejabatOperator?.operatorPembayaran?.nama || 'Operator Digipay',
            noHp: cleanPhone || currentMasterSatker.pejabatOperator?.operatorPembayaran?.noHp || ''
          }
        },
        updatedAt: new Date().toISOString()
      };

      if (onSaveMasterSatker) {
        onSaveMasterSatker(updatedMaster);
      } else {
        // Fallback local update
        try {
          const saved = localStorage.getItem('kppn_master_satkers');
          if (saved) {
            const list: MasterSatker[] = JSON.parse(saved);
            const nextList = list.map(m => m.kodeSatker === updatedMaster.kodeSatker ? updatedMaster : m);
            localStorage.setItem('kppn_master_satkers', JSON.stringify(nextList));
          }
        } catch {
          // Ignore
        }
      }
    }

    setIsEditingContact(false);
    setContactSaveFeedback('Kontak PIC & Pejabat Satker berhasil diperbarui secara aman.');
    setTimeout(() => {
      setContactSaveFeedback(null);
    }, 4000);
  };

  // Available unique months from dataset
  const availableMonths = useMemo(() => {
    const monthsFound = new Set<string>();
    records.forEach(r => {
      const m = extractMonthFromRecord(r);
      if (m) monthsFound.add(m);
    });

    // Ensure standard 2026 months are available in selector
    INDONESIAN_MONTHS.forEach(m => {
      monthsFound.add(`${m} 2026`);
    });

    return Array.from(monthsFound).sort((a, b) => {
      const [mA, yA] = a.split(' ');
      const [mB, yB] = b.split(' ');
      const yrA = parseInt(yA || '2026', 10);
      const yrB = parseInt(yB || '2026', 10);
      if (yrA !== yrB) return yrA - yrB;
      const idxA = INDONESIAN_MONTHS.indexOf(mA);
      const idxB = INDONESIAN_MONTHS.indexOf(mB);
      return idxA - idxB;
    });
  }, [records]);

  // Latest detected month in data
  const latestDetectedMonth = useMemo(() => {
    let highestIdx = -1;
    let highestMonth = 'Agustus 2026';
    records.forEach(r => {
      const m = extractMonthFromRecord(r);
      if (m) {
        const info = getMonthInfoFromPeriodKey(m);
        if (info && info.monthIndex > highestIdx) {
          highestIdx = info.monthIndex;
          highestMonth = m;
        }
      }
    });
    return highestMonth;
  }, [records]);

  // Filter records by Selected Month & Mode
  const monthFilteredRecords = useMemo(() => {
    return records.filter(r => {
      return isRecordMatchingFilter(r, filterMode, selectedMonth);
    });
  }, [records, filterMode, selectedMonth]);

  // Summaries per Satker (computed on filtered records)
  const satkerSummaries = useMemo(() => {
    return aggregateDigipayRecords(monthFilteredRecords);
  }, [monthFilteredRecords]);

  // Total Statistics
  const stats = useMemo(() => {
    const totalTransactions = monthFilteredRecords.length;
    const totalNominal = monthFilteredRecords.reduce((acc, r) => acc + (r.nominalTransaksi || 0), 0);

    const vaRecords = monthFilteredRecords.filter(r => r.tipePembayaran === 'VA');
    const totalVA = vaRecords.length;
    const nominalVA = vaRecords.reduce((acc, r) => acc + (r.nominalTransaksi || 0), 0);

    const kkpRecords = monthFilteredRecords.filter(r => r.tipePembayaran === 'KKP');
    const totalKKP = kkpRecords.length;
    const nominalKKP = kkpRecords.reduce((acc, r) => acc + (r.nominalTransaksi || 0), 0);

    const uniqueSatkersWithTx = satkerSummaries.length;
    const totalMasterCount = masterSatkers.filter(m => m.isActive !== false).length || 125;

    // Unique vendors
    const vendorSet = new Set<string>();
    monthFilteredRecords.forEach(r => {
      if (r.namaVendor) vendorSet.add(r.namaVendor.trim());
    });

    return {
      totalTransactions,
      totalNominal,
      totalVA,
      nominalVA,
      totalKKP,
      nominalKKP,
      uniqueSatkersWithTx,
      totalMasterCount,
      uniqueVendorsCount: vendorSet.size
    };
  }, [monthFilteredRecords, satkerSummaries, masterSatkers]);

  // Unique Banks in data
  const availableBanks = useMemo(() => {
    const banks = new Set<string>();
    monthFilteredRecords.forEach(r => {
      if (r.namaBank) banks.add(r.namaBank.trim());
    });
    return Array.from(banks);
  }, [monthFilteredRecords]);

  // Filtered Satker Summaries
  const filteredSummaries = useMemo(() => {
    return satkerSummaries.filter(s => {
      const matchSearch =
        searchQuery === '' ||
        s.kodeSatker.includes(searchQuery) ||
        s.namaSatker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.kementerianLembaga && s.kementerianLembaga.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === 'ALL' ||
        s.statusKeaktifan === statusFilter;

      const matchBank =
        bankFilter === 'ALL' ||
        (s.bankTerbanyak && s.bankTerbanyak.toLowerCase().includes(bankFilter.toLowerCase()));

      return matchSearch && matchStatus && matchBank;
    }).sort((a, b) => {
      if (rankSortBy === 'count') {
        return b.totalSemuaTransaksi - a.totalSemuaTransaksi || b.totalSemuaNominal - a.totalSemuaNominal;
      } else {
        return b.totalSemuaNominal - a.totalSemuaNominal || b.totalSemuaTransaksi - a.totalSemuaTransaksi;
      }
    });
  }, [satkerSummaries, searchQuery, statusFilter, bankFilter, rankSortBy]);

  // Top 3 Satkers
  const topSatkers = useMemo(() => {
    const list = [...satkerSummaries].sort((a, b) => {
      if (rankSortBy === 'count') {
        return b.totalSemuaTransaksi - a.totalSemuaTransaksi || b.totalSemuaNominal - a.totalSemuaNominal;
      } else {
        return b.totalSemuaNominal - a.totalSemuaNominal || b.totalSemuaTransaksi - a.totalSemuaTransaksi;
      }
    });
    return list.slice(0, 3);
  }, [satkerSummaries, rankSortBy]);

  // Filtered Raw Records for VA / KKP tabs
  const filteredRawRecords = useMemo(() => {
    const targetType = activeSubTab === 'va' ? 'VA' : activeSubTab === 'kkp' ? 'KKP' : null;
    return monthFilteredRecords.filter(r => {
      if (targetType && r.tipePembayaran !== targetType) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.kodeSatker.includes(q) ||
        r.namaSatker.toLowerCase().includes(q) ||
        (r.namaVendor && r.namaVendor.toLowerCase().includes(q)) ||
        (r.noTransaksi && r.noTransaksi.toLowerCase().includes(q)) ||
        (r.uraianBarang && r.uraianBarang.toLowerCase().includes(q))
      );
    }).sort((a, b) => (b.nominalTransaksi || 0) - (a.nominalTransaksi || 0));
  }, [monthFilteredRecords, activeSubTab, searchQuery]);

  // Ecosystem Vendor Breakdown
  const topVendors = useMemo(() => {
    const vMap = new Map<string, { nama: string; totalTx: number; totalNom: number; satkers: Set<string> }>();
    monthFilteredRecords.forEach(r => {
      if (!r.namaVendor) return;
      const v = r.namaVendor.trim();
      const existing = vMap.get(v) || { nama: v, totalTx: 0, totalNom: 0, satkers: new Set() };
      existing.totalTx += 1;
      existing.totalNom += r.nominalTransaksi || 0;
      existing.satkers.add(r.kodeSatker);
      vMap.set(v, existing);
    });
    return Array.from(vMap.values()).sort((a, b) => b.totalNom - a.totalNom).slice(0, 8);
  }, [monthFilteredRecords]);

  // Ecosystem Bank Breakdown
  const bankBreakdown = useMemo(() => {
    const bMap = new Map<string, { nama: string; totalTx: number; totalNom: number }>();
    monthFilteredRecords.forEach(r => {
      const b = r.namaBank || 'Bank Lainnya';
      const existing = bMap.get(b) || { nama: b, totalTx: 0, totalNom: 0 };
      existing.totalTx += 1;
      existing.totalNom += r.nominalTransaksi || 0;
      bMap.set(b, existing);
    });
    return Array.from(bMap.values()).sort((a, b) => b.totalNom - a.totalNom);
  }, [monthFilteredRecords]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. HERO HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 p-6 sm:p-8 text-white shadow-2xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
              <span>DIGIPAY SATU KEMENKEU • KPPN SEMARANG I</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Monitoring Transaksi Digipay
              <span className="text-xs sm:text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
                VA &amp; KKP Terpadu
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Pemantauan transaksi digitalisasi belanja operasional Satuan Kerja melalui modul pembayaran <strong>Virtual Account (VA CMS)</strong> dan <strong>Kartu Kredit Pemerintah (KKP)</strong> terintegrasi ekosistem marketplace Digipay Satu Kemenkeu.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Periode Aktif: <strong className="text-amber-300">{selectedMonth === 'ALL' ? 'Semua Bulan (Kumulatif)' : selectedMonth}</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Update: <strong>{dashboardConfig?.updateDates?.transaksiDigipay || lastUpdateDate || '07 Agustus 2026 - 09:00 WIB'}</strong>
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-row md:flex-col gap-2.5 sm:self-start">
            <button
              onClick={() => exportDigipayToExcel(
                monthFilteredRecords,
                'Rekapitulasi_Transaksi_Digipay_KPPN026.xlsx',
                selectedMonth === 'ALL' ? 'Semua Bulan (Kumulatif)' : selectedMonth
              )}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export Rekap Excel ({monthFilteredRecords.length})</span>
            </button>
            <button
              onClick={downloadDigipayTemplate}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span>Template Format Excel</span>
            </button>
            {handleGoToAdmin && (
              <button
                onClick={handleGoToAdmin}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Upload Excel Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 📅 EXCLUSIVE MONTHLY FILTER CONTROLS BAR (DUAL MODE: KUMULATIF S.D. BULAN & BULAN TUNGGAL) */}
      <div className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-3.5 ${
        isDark ? 'bg-slate-900/90 border-indigo-900/50 shadow-lg' : 'bg-white border-indigo-200 shadow-md shadow-indigo-500/5'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Filter Periode & Bulan Transaksi Digipay
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                  Sesuai Data Excel
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dapat memilih <strong>Kumulatif s.d. Bulan Terakhir</strong> (Januari s.d. Bulan Terpilih) atau <strong>Per Bulan Tunggal</strong>
              </p>
            </div>
          </div>

          {/* Mode Switcher & Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mode Switcher Toggle */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/70 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterMode('CUMULATIVE')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterMode === 'CUMULATIVE'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                }`}
              >
                <span>📊 Kumulatif (s.d. Bulan)</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('SINGLE')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterMode === 'SINGLE'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                }`}
              >
                <span>📅 Per Bulan Tunggal</span>
              </button>
            </div>

            {/* Dropdown Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="py-2 px-3.5 rounded-2xl border-2 border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {filterMode === 'CUMULATIVE' ? `s.d. ${m} (Kumulatif)` : `Bulan ${m} Saja`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 mr-1">
            {filterMode === 'CUMULATIVE' ? 'Pilih Batas Bulan Kumulatif:' : 'Pilih Bulan Tunggal:'}
          </span>
          {availableMonths.map(m => {
            const isSelected = selectedMonth === m;
            const isLatest = m === latestDetectedMonth;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMonth(m)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{filterMode === 'CUMULATIVE' ? `s.d. ${m}` : m}</span>
                {isLatest && filterMode === 'CUMULATIVE' && (
                  <span className="text-[9px] px-1 py-0.2 bg-amber-400 text-slate-950 font-black rounded-sm">
                    Upload Terakhir
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Filter Indicator Tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>
              Sedang Menampilkan:{' '}
              <strong>
                {filterMode === 'CUMULATIVE'
                  ? `Laporan Kumulatif Transaksi Digipay s.d. ${selectedMonth}`
                  : `Laporan Transaksi Digipay Bulan ${selectedMonth} Saja`}
              </strong>{' '}
              ({stats.totalTransactions} Transaksi • {formatRupiah(stats.totalNominal)} Belanja • {stats.uniqueSatkersWithTx} Satker Aktif)
            </span>
          </div>
          <button
            type="button"
            onClick={() => exportDigipayToExcel(
              monthFilteredRecords,
              `Rekapitulasi_Digipay_${filterMode === 'CUMULATIVE' ? 'sd_' : ''}${selectedMonth.replace(/\s+/g, '_')}.xlsx`,
              selectedMonth
            )}
            className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Excel Rekap
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Transaksi Digipay */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Transaksi Digipay
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.totalTransactions} <span className="text-sm font-semibold text-slate-500">Transaksi</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold">
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                VA: {stats.totalVA}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                KKP: {stats.totalKKP}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Nominal Belanja */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Nominal Belanja (Rp)
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
              {formatRupiah(stats.totalNominal)}
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between font-medium">
              <span>VA: {formatRupiah(stats.nominalVA)}</span>
              <span>KKP: {formatRupiah(stats.nominalKKP)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Satker Terlibat */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Satker Aktif Digipay
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.uniqueSatkersWithTx} <span className="text-sm font-semibold text-slate-500">/ {stats.totalMasterCount} Satker</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (stats.uniqueSatkersWithTx / stats.totalMasterCount) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                {((stats.uniqueSatkersWithTx / stats.totalMasterCount) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Vendor & Merchant UMKM */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Vendor UMKM Terdaftar
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.uniqueVendorsCount} <span className="text-sm font-semibold text-slate-500">Mitra UMKM</span>
            </div>
            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ekosistem UMKM Lokal Semarang</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PODIUM / APRESIASI TOP 3 SATKER DIGIPAY TERBANYAK */}
      <div className={`p-6 sm:p-7 rounded-3xl border ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-gradient-to-br from-white to-slate-50 border-slate-200/80 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider mb-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>Peringkat 1, 2, &amp; 3 Transaksi Digipay Terbanyak</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Apresiasi Satuan Kerja Pelopor Digitalisasi Belanja
            </h2>
          </div>

          {/* Toggle Sort: By Count vs By Nominal */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start">
            <button
              onClick={() => setRankSortBy('count')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                rankSortBy === 'count'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              📈 Jumlah Transaksi
            </button>
            <button
              onClick={() => setRankSortBy('nominal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                rankSortBy === 'nominal'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              💰 Nominal Rupiah
            </button>
          </div>
        </div>

        {/* Top 3 Cards Grid / Empty State */}
        {topSatkers.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Belum Ada Data Transaksi Digipay
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Dashboard siap menampilkan monitoring dan peringkat transaksi Digipay (VA &amp; KKP). Silakan unggah laporan transaksi Excel melalui menu Admin Panel.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {handleGoToAdmin && (
                <button
                  type="button"
                  onClick={handleGoToAdmin}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  <span>Buka Admin Upload Digipay</span>
                </button>
              )}
              <button
                type="button"
                onClick={downloadDigipayTemplate}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Unduh Format Template</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
            {topSatkers.map((satker, idx) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;

              const badgeColor = isFirst
                ? 'from-amber-400 to-amber-600 text-slate-950 ring-amber-400/40'
                : isSecond
                ? 'from-slate-300 to-slate-400 text-slate-950 ring-slate-400/40'
                : 'from-amber-700 to-amber-900 text-white ring-amber-700/40';

              const borderColor = isFirst
                ? 'border-amber-400/60 dark:border-amber-500/40'
                : isSecond
                ? 'border-slate-300/80 dark:border-slate-700'
                : 'border-amber-700/40 dark:border-amber-900/50';

              return (
                <div
                  key={satker.kodeSatker}
                  className={`relative p-5 rounded-2xl border transition-all hover:shadow-lg flex flex-col justify-between ${borderColor} ${
                    isDark ? 'bg-slate-950/70' : 'bg-white'
                  }`}
                >
                  {/* Badge Rank */}
                  <div className="flex items-start justify-between gap-3">
                    <div className={`px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r ${badgeColor} shadow-md ring-2 flex items-center gap-1.5`}>
                      <Award className="w-3.5 h-3.5" />
                      <span>Peringkat {idx + 1}</span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      {satker.kodeSatker}
                    </span>
                  </div>

                  {/* Satker Name & KL */}
                  <div className="mt-4 mb-4">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2" title={satker.namaSatker}>
                      {satker.namaSatker}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {satker.kementerianLembaga}
                    </p>
                  </div>

                  {/* Key Numbers */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Total Belanja:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatRupiah(satker.totalSemuaNominal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Total Frekuensi:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {satker.totalSemuaTransaksi} Transaksi
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                      <span>VA: <strong>{satker.totalTransaksiVA}x</strong> ({formatRupiah(satker.totalNominalVA)})</span>
                      <span>KKP: <strong>{satker.totalTransaksiKKP}x</strong></span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 flex items-center">
                    <button
                      onClick={() => setSelectedSatkerSummary(satker)}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Lihat Rincian Transaksi</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. SUB-TAB SWITCHER & FILTER CONTROLS */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Sub tabs */}
          <div className="flex items-center overflow-x-auto gap-2 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700">
            <button
              onClick={() => { setActiveSubTab('rekap'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'rekap'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>1. Rekapitulasi Per Satker</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black">
                {satkerSummaries.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveSubTab('va'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'va'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>2. Pembayaran VA (Virtual Account)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black">
                {stats.totalVA}
              </span>
            </button>

            <button
              onClick={() => { setActiveSubTab('kkp'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'kkp'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>3. Pembayaran KKP Digipay</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black">
                {stats.totalKKP}
              </span>
            </button>

            <button
              onClick={() => { setActiveSubTab('ekosistem'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'ekosistem'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>4. Ekosistem Vendor &amp; Bank</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Cari kode/nama satker/vendor..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 shadow-sm"
            />
          </div>
        </div>

        {/* Secondary filters for Rekap Tab */}
        {activeSubTab === 'rekap' && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Status:</span>
            </div>
            {['ALL', 'Sangat Aktif', 'Aktif', 'Perlu Akselerasi'].map(st => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                {st === 'ALL' ? 'Semua Status' : st}
              </button>
            ))}

            {availableBanks.length > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Bank:</span>
                <select
                  value={bankFilter}
                  onChange={(e) => { setBankFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs rounded-lg px-2.5 py-1 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">Semua Bank</option>
                  {availableBanks.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {(searchQuery || statusFilter !== 'ALL' || bankFilter !== 'ALL' || selectedMonth !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setBankFilter('ALL');
                  setSelectedMonth('ALL');
                  setCurrentPage(1);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                title="Reset Semua Filter &amp; Bulan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5. MAIN CONTENT TABLE / CARDS BASED ON ACTIVE SUB-TAB */}
      {activeSubTab === 'rekap' && (
        <div className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 text-center w-12">No</th>
                  <th className="py-3.5 px-4 w-28">Kode</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Nama Satuan Kerja</th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Pembayaran VA</th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Pembayaran KKP</th>
                  <th className="py-3.5 px-4 text-right min-w-[160px]">
                    <div className="flex items-center justify-end gap-1">
                      <span>Total Belanja (Rp)</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Status Keaktifan</th>
                  <th className="py-3.5 px-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <ShoppingBag className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
                      <p className="font-semibold">Tidak ditemukan data transaksi Digipay yang cocok dengan pencarian.</p>
                    </td>
                  </tr>
                ) : (
                  filteredSummaries
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((s, idx) => {
                      const rowNum = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr
                          key={s.kodeSatker}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                            {rowNum}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                              {s.kodeSatker}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {s.namaSatker}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {s.kementerianLembaga}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-black text-blue-600 dark:text-blue-400">
                              {s.totalTransaksiVA}x
                            </span>
                            <div className="text-[11px] text-slate-500">
                              {formatRupiah(s.totalNominalVA)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-black text-purple-600 dark:text-purple-400">
                              {s.totalTransaksiKKP}x
                            </span>
                            <div className="text-[11px] text-slate-500">
                              {formatRupiah(s.totalNominalKKP)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                              {formatRupiah(s.totalSemuaNominal)}
                            </div>
                            <div className="text-[11px] font-bold text-slate-500">
                              {s.totalSemuaTransaksi} Transaksi
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                              s.statusKeaktifan === 'Sangat Aktif'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : s.statusKeaktifan === 'Aktif'
                                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}>
                              {s.statusKeaktifan}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => setSelectedSatkerSummary(s)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                              title="Lihat Detail Transaksi"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Detail</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <PaginationControl
            currentPage={currentPage}
            totalItems={filteredSummaries.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="Satker"
            isDark={isDark}
            className="p-4 border-t border-slate-200 dark:border-slate-800"
          />
        </div>
      )}

      {/* 6. RAW TRANSACTIONS LIST FOR TAB VA OR TAB KKP */}
      {(activeSubTab === 'va' || activeSubTab === 'kkp') && (
        <div className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
              {activeSubTab === 'va' ? (
                <>
                  <Receipt className="w-4 h-4 text-blue-500" />
                  <span>Daftar Transaksi Belanja via Virtual Account (VA CMS)</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-purple-500" />
                  <span>Daftar Transaksi Belanja via Kartu Kredit Pemerintah (KKP)</span>
                </>
              )}
            </div>
            <span className="text-xs font-bold text-slate-500">
              Total {filteredRawRecords.length} Invoice / Pesanan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[130px]">No Order / ID</th>
                  <th className="py-3.5 px-4 min-w-[110px]">Tanggal</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Satuan Kerja</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Rekanan / Vendor UMKM</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Bank Mitra</th>
                  <th className="py-3.5 px-4 text-right min-w-[140px]">Nominal (Rp)</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Uraian Pengadaan / Belanja</th>
                  <th className="py-3.5 px-4 text-center min-w-[170px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRawRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold">Tidak ada data transaksi yang sesuai.</p>
                    </td>
                  </tr>
                ) : (
                  (pageSize <= 0 ? filteredRawRecords : filteredRawRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize))
                    .map((r, idx) => {
                      const rowNum = (currentPage - 1) * (pageSize > 0 ? pageSize : 0) + idx + 1;
                      const statusText = r.statusTransaksi || 'Selesai';
                      const isNegative = statusText.toLowerCase().includes('batal') || statusText.toLowerCase().includes('gagal');
                      const isPending = statusText.toLowerCase().includes('proses') || statusText.toLowerCase().includes('pending') || statusText.toLowerCase().includes('menunggu');

                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                            {rowNum}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                            {r.noTransaksi || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {r.tglTransaksi}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {r.namaSatker}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {r.kodeSatker}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {r.namaVendor || 'Merchant UMKM'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">
                            {r.namaBank}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(r.nominalTransaksi)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                            <span className="line-clamp-2" title={r.uraianBarang}>
                              {r.uraianBarang || 'Pengadaan barang/jasa operasional'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${
                              isNegative
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isNegative ? 'bg-rose-500' : isPending ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} />
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <PaginationControl
            currentPage={currentPage}
            totalItems={filteredRawRecords.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="Transaksi"
            isDark={isDark}
            className="p-4 border-t border-slate-200 dark:border-slate-800"
          />
        </div>
      )}

      {/* 7. EKOSISTEM VENDOR & BANK MITRA TAB */}
      {activeSubTab === 'ekosistem' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendor UMKM Teraktif */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Mitra Vendor UMKM Teraktif (Digipay Satu)
              </h3>
            </div>
            <div className="space-y-3">
              {topVendors.map((v, idx) => (
                <div
                  key={v.nama}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {v.nama}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Melayani {v.satkers.size} Satuan Kerja • {v.totalTx} Transaksi
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(v.totalNom)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sebaran Bank Mitra */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Landmark className="w-5 h-5 text-indigo-500" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Sebaran Transaksi Perbankan Mitra Himbara
              </h3>
            </div>
            <div className="space-y-4">
              {bankBreakdown.map((b) => {
                const percent = stats.totalNominal > 0 ? (b.totalNom / stats.totalNominal) * 100 : 0;
                return (
                  <div key={b.nama} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{b.nama}</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(b.totalNom)} ({percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 text-right">
                      {b.totalTx} Transaksi Berhasil
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL DETAIL TRANSAKSI & KONTAK SATKER TERPILIH (DILINDUNGI PASSWORD) */}
      {selectedSatkerSummary && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-3xl rounded-3xl border shadow-2xl my-4 sm:my-6 overflow-hidden flex flex-col max-h-[94vh] transition-colors duration-300 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between relative shrink-0">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-xs bg-indigo-500 text-white font-black px-2.5 py-0.5 rounded-lg shadow-xs">
                    KODE SATKER: {selectedSatkerSummary.kodeSatker}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {selectedSatkerSummary.statusKeaktifan}
                  </span>
                  {isSelectedSatkerUnlocked && (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-md border border-emerald-500/30">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Terotentikasi Aman
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                  {selectedSatkerSummary.namaSatker}
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedSatkerSummary.kementerianLembaga}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isSelectedSatkerUnlocked && !isAdminAuthenticated && (
                  <button
                    onClick={handleLockSatker}
                    className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer"
                    title="Kunci kembali akses satker ini"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Kunci Akses</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedSatkerSummary(null)}
                  className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {!isSelectedSatkerUnlocked ? (
              /* SCREEN 1: PASSWORD LOCK AUTHENTICATION SCREEN */
              <div className="p-6 sm:p-8 overflow-y-auto max-w-lg mx-auto w-full space-y-5">
                <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl text-center space-y-4 ${
                  isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className="w-16 h-16 bg-amber-500/15 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Lock className="w-8 h-8" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-3 py-1 rounded-full text-xs font-bold mb-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      AKSES DILINDUNGI PASSWORD SATKER
                    </div>
                    <h3 className="text-xl font-black tracking-tight">
                      Otentikasi Password Satker
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Detail rincian transaksi belanja, faktur rekanan vendor, serta data kontak nomor HP PIC Satker <strong>{selectedSatkerSummary.namaSatker} ({selectedSatkerSummary.kodeSatker})</strong> dilindungi password demi menjaga keamanan dan kerahasiaan data dari Satker lain.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyPassword} className="space-y-4 text-left pt-2">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                        Password / PIN Satker:
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Masukkan password satker..."
                          value={passwordInput}
                          onChange={(e) => {
                            setPasswordInput(e.target.value);
                            if (passwordError) setPasswordError(null);
                          }}
                          className={`w-full text-xs font-mono rounded-xl pl-10 pr-10 py-3 border transition-all ${
                            isDark
                              ? 'bg-slate-950 border-slate-800 text-white focus:border-amber-500'
                              : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                          }`}
                          required
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {passwordError && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{passwordError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Buka Detail &amp; Kontak Satker</span>
                    </button>
                  </form>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-left">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Password default sama seperti Dashboard IKPA: <strong>[KodeSatker]_[KodeBA]</strong></span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* SCREEN 2: UNLOCKED CONTENT (TRANSACTIONS, SECURE CONTACT MANAGEMENT & VENDOR ECOSYSTEM) */
              <>
                {/* Navigation SubTabs Inside Modal */}
                <div className={`px-4 sm:px-6 pt-3 pb-0 border-b flex items-center gap-2 sm:gap-3 overflow-x-auto shrink-0 ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/80 border-slate-200'
                }`}>
                  <button
                    onClick={() => setSelectedDetailTab('transaksi')}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-black border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                      selectedDetailTab === 'transaksi'
                        ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10 rounded-t-xl'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Receipt className="w-4 h-4 text-indigo-500" />
                    <span>1. Rincian Transaksi Belanja ({records.filter(r => r.kodeSatker === selectedSatkerSummary.kodeSatker).length})</span>
                  </button>

                  <button
                    onClick={() => setSelectedDetailTab('kontak')}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-black border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                      selectedDetailTab === 'kontak'
                        ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10 rounded-t-xl'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span>2. Kontak PIC &amp; Pejabat Satker</span>
                    {contactFormData.noHpPic && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedDetailTab('vendor')}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-black border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                      selectedDetailTab === 'vendor'
                        ? 'border-amber-500 text-amber-500 bg-amber-500/10 rounded-t-xl'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Store className="w-4 h-4 text-amber-500" />
                    <span>3. Rekanan Vendor &amp; Bank Mitra</span>
                  </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
                  
                  {/* Feedback Banner if contact saved */}
                  {contactSaveFeedback && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs flex items-center justify-between gap-3 animate-fade-in shadow-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold">{contactSaveFeedback}</span>
                      </div>
                      <button
                        onClick={() => setContactSaveFeedback(null)}
                        className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* SUBTAB 1: TRANSAKSI */}
                  {selectedDetailTab === 'transaksi' && (
                    <div className="space-y-5">
                      {/* Stats Summary Modal */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                          <span className="text-[11px] text-slate-500 font-semibold">Total Belanja:</span>
                          <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                            {formatRupiah(selectedSatkerSummary.totalSemuaNominal)}
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                          <span className="text-[11px] text-slate-500 font-semibold">Total Transaksi:</span>
                          <div className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 mt-1">
                            {selectedSatkerSummary.totalSemuaTransaksi} Transaksi
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                          <span className="text-[11px] text-slate-500 font-semibold">Virtual Account:</span>
                          <div className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1">
                            {selectedSatkerSummary.totalTransaksiVA}x ({formatRupiah(selectedSatkerSummary.totalNominalVA)})
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                          <span className="text-[11px] text-slate-500 font-semibold">KKP Digipay:</span>
                          <div className="text-sm font-black text-purple-600 dark:text-purple-400 mt-1">
                            {selectedSatkerSummary.totalTransaksiKKP}x ({formatRupiah(selectedSatkerSummary.totalNominalKKP)})
                          </div>
                        </div>
                      </div>

                      {/* Filters & Search within Modal */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                          <button
                            onClick={() => setDetailFilterType('ALL')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                              detailFilterType === 'ALL'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                            }`}
                          >
                            Semua ({records.filter(r => r.kodeSatker === selectedSatkerSummary.kodeSatker).length})
                          </button>
                          <button
                            onClick={() => setDetailFilterType('VA')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                              detailFilterType === 'VA'
                                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                            }`}
                          >
                            VA ({selectedSatkerSummary.totalTransaksiVA})
                          </button>
                          <button
                            onClick={() => setDetailFilterType('KKP')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                              detailFilterType === 'KKP'
                                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                            }`}
                          >
                            KKP ({selectedSatkerSummary.totalTransaksiKKP})
                          </button>
                        </div>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Cari no invoice/vendor/barang..."
                            value={detailSearch}
                            onChange={(e) => setDetailSearch(e.target.value)}
                            className={`text-xs rounded-xl pl-9 pr-3 py-2 border w-full sm:w-64 transition-all ${
                              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                          />
                        </div>
                      </div>

                      {/* List Transactions of This Satker */}
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {records
                          .filter(r => r.kodeSatker === selectedSatkerSummary.kodeSatker)
                          .filter(r => {
                            if (detailFilterType === 'VA') return r.tipePembayaran === 'VA';
                            if (detailFilterType === 'KKP') return r.tipePembayaran === 'KKP';
                            return true;
                          })
                          .filter(r => {
                            if (!detailSearch.trim()) return true;
                            const query = detailSearch.toLowerCase();
                            return (
                              r.noTransaksi.toLowerCase().includes(query) ||
                              r.namaVendor.toLowerCase().includes(query) ||
                              r.uraianBarang.toLowerCase().includes(query) ||
                              r.namaBank.toLowerCase().includes(query)
                            );
                          })
                          .map(r => (
                            <div
                              key={r.id}
                              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-indigo-500/40 transition-all"
                            >
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                    r.tipePembayaran === 'VA'
                                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                      : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                                  }`}>
                                    {r.tipePembayaran === 'VA' ? 'Virtual Account' : 'KKP Digipay'}
                                  </span>
                                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {r.noTransaksi}
                                  </span>
                                  <span className="text-slate-400">• {r.tglTransaksi}</span>
                                </div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {r.namaVendor} <span className="text-slate-500 font-normal">({r.namaBank})</span>
                                </div>
                                <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                                  {r.uraianBarang}
                                </div>
                              </div>
                              <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                                <div className="text-slate-400 text-[10px]">Nominal Belanja:</div>
                                <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                                  {formatRupiah(r.nominalTransaksi)}
                                </div>
                              </div>
                            </div>
                          ))}
                        
                        {records.filter(r => r.kodeSatker === selectedSatkerSummary.kodeSatker).length === 0 && (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            Belum ada riwayat transaksi Digipay tercatat untuk Satker ini pada periode filter.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 2: KONTAK & PIC SATKER (SECURE EDIT & VIEW) */}
                  {selectedDetailTab === 'kontak' && (
                    <div className="space-y-6">
                      <div className={`p-5 rounded-3xl border ${
                        isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-emerald-50/60 border-emerald-200'
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <UserCheck className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                Kontak Resmi PIC / Operator Satker
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Data kontak ini digunakan oleh KPPN Semarang I untuk koordinasi dan pendampingan transaksi Digipay.
                              </p>
                            </div>
                          </div>

                          {contactFormData.noHpPic && (
                            <a
                              href={`https://wa.me/${contactFormData.noHpPic.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-sm shrink-0"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Chat WhatsApp</span>
                            </a>
                          )}
                        </div>

                        {/* Form input / update */}
                        <form onSubmit={handleSaveContact} className="mt-5 space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Nama PIC / Petugas Satker:
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: Bpk. Bambang Sutrisno"
                                value={contactFormData.namaPic}
                                onChange={(e) => setContactFormData({ ...contactFormData, namaPic: e.target.value })}
                                className={`w-full text-xs rounded-xl px-3.5 py-2.5 border transition-all ${
                                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Nomor Handphone / WhatsApp Satker:
                              </label>
                              <div className="relative">
                                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Contoh: 081234567890"
                                  value={contactFormData.noHpPic}
                                  onChange={(e) => setContactFormData({ ...contactFormData, noHpPic: e.target.value })}
                                  className={`w-full text-xs font-mono rounded-xl pl-10 pr-3.5 py-2.5 border transition-all ${
                                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Peran / Jabatan di Satuan Kerja:
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: Operator Pembayaran / Bendahara Pengeluaran / PPK"
                              value={contactFormData.jabatanPic}
                              onChange={(e) => setContactFormData({ ...contactFormData, jabatanPic: e.target.value })}
                              className={`w-full text-xs rounded-xl px-3.5 py-2.5 border transition-all ${
                                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              Tersimpan aman &amp; tersinkronisasi dengan Database KPPN
                            </span>
                            <button
                              type="submit"
                              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                            >
                              <Save className="w-4 h-4" />
                              <span>Simpan Kontak Satker</span>
                            </button>
                          </div>
                        </form>
                      </div>

                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          <strong>Perlindungan Privasi:</strong> Kontak nomor HP di atas hanya dapat dilihat dan diubah setelah memasukkan password resmi Satker ini. Satker lain tidak memiliki akses untuk melihat maupun memodifikasi informasi kontak Anda.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB 3: REKANAN VENDOR & BANK MITRA */}
                  {selectedDetailTab === 'vendor' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-2xl border ${
                          isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                            <Store className="w-4 h-4 text-indigo-500" />
                            <span>Rekanan Vendor yang Digunakan:</span>
                          </h4>
                          <div className="space-y-2">
                            {Array.from(new Set(records.filter(r => r.kodeSatker === selectedSatkerSummary.kodeSatker).map(r => r.namaVendor))).map(vendor => {
                              const vendorTx = records.filter(r => r.kodeSatker === selectedSatkerSummary.kodeSatker && r.namaVendor === vendor);
                              const totalNom = vendorTx.reduce((sum, r) => sum + r.nominalTransaksi, 0);
                              return (
                                <div key={vendor} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{vendor}</span>
                                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatRupiah(totalNom)} ({vendorTx.length}x)</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className={`p-4 rounded-2xl border ${
                          isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                            <Landmark className="w-4 h-4 text-indigo-500" />
                            <span>Bank Mitra yang Digunakan:</span>
                          </h4>
                          <div className="space-y-2">
                            {Array.from(new Set(records.filter(r => r.kodeSatker === selectedSatkerSummary.kodeSatker).map(r => r.namaBank))).map(bank => {
                              const bankTx = records.filter(r => r.kodeSatker === selectedSatkerSummary.kodeSatker && r.namaBank === bank);
                              const totalNom = bankTx.reduce((sum, r) => sum + r.nominalTransaksi, 0);
                              return (
                                <div key={bank} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{bank}</span>
                                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{bankTx.length} Transaksi ({formatRupiah(totalNom)})</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Modal Footer Actions */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Sesi aman aktif untuk Satker <strong>{selectedSatkerSummary.kodeSatker}</strong></span>
                  </div>
                  <button
                    onClick={() => setSelectedSatkerSummary(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs cursor-pointer shadow-sm transition-all"
                  >
                    Tutup Rincian
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
