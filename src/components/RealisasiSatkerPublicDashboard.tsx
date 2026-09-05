import React, { useState, useMemo } from 'react';
import {
  EvaluatedSatkerRealisasi,
  TriwulanKey,
  TargetTriwulanRule,
} from '../utils/targetTriwulanProcessor';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Shield,
  HelpCircle,
  X,
  ChevronRight,
  Filter,
  Copy,
  Check,
  ArrowUpDown,
  FileSpreadsheet,
  Lock
} from 'lucide-react';

interface RealisasiSatkerPublicDashboardProps {
  evaluatedList: EvaluatedSatkerRealisasi[];
  triwulan: TriwulanKey;
  activeRule: TargetTriwulanRule;
  updateDate?: string;
  isDark?: boolean;
  isAdminAuthenticated?: boolean;
  onOpenAdminAuth?: () => void;
  onSwitchToInternal?: () => void;
}

export const RealisasiSatkerPublicDashboard: React.FC<RealisasiSatkerPublicDashboardProps> = ({
  evaluatedList,
  triwulan,
  activeRule,
  updateDate,
  isDark = false,
  isAdminAuthenticated = false,
  onOpenAdminAuth,
  onSwitchToInternal
}) => {
  // Search query (Satker name or code)
  const [searchQuery, setSearchQuery] = useState('');
  // Filter by compliance status: ALL | MEMILIKI_KURANG | SEMUA_MEMENUHI
  const [complianceFilter, setComplianceFilter] = useState<'ALL' | 'MEMILIKI_KURANG' | 'SEMUA_MEMENUHI'>('ALL');
  // Specific expenditure filter: ALL | 51_KURANG | 52_KURANG | 53_KURANG | 57_KURANG
  const [specificFilter, setSpecificFilter] = useState<'ALL' | '51_KURANG' | '52_KURANG' | '53_KURANG' | '57_KURANG'>('ALL');
  // Selected Satker for Focus Pin Card
  const [focusedSatkerId, setFocusedSatkerId] = useState<string>('');
  // Copied satker id state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Sort By
  const [sortField, setSortField] = useState<'kode' | 'nama' | 'kurangCount' | 'gapMax'>('kurangCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filtered Satkers
  const filteredSatkers = useMemo(() => {
    return evaluatedList.filter(s => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = s.kodeSatker.toLowerCase().includes(q);
        const matchName = s.namaSatker.toLowerCase().includes(q);
        const matchKl = s.kementerianLembaga?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchKl) return false;
      }

      // Compliance Filter
      const hasDeficitType = s.pegawai.status === 'BELUM_MEMENUHI' ||
        s.barang.status === 'BELUM_MEMENUHI' ||
        s.modal.status === 'BELUM_MEMENUHI' ||
        s.bansos.status === 'BELUM_MEMENUHI';

      if (complianceFilter === 'MEMILIKI_KURANG' && !hasDeficitType) return false;
      if (complianceFilter === 'SEMUA_MEMENUHI' && hasDeficitType) return false;

      // Specific pillar filter
      if (specificFilter === '51_KURANG' && s.pegawai.status !== 'BELUM_MEMENUHI') return false;
      if (specificFilter === '52_KURANG' && s.barang.status !== 'BELUM_MEMENUHI') return false;
      if (specificFilter === '53_KURANG' && s.modal.status !== 'BELUM_MEMENUHI') return false;
      if (specificFilter === '57_KURANG' && s.bansos.status !== 'BELUM_MEMENUHI') return false;

      return true;
    }).sort((a, b) => {
      if (sortField === 'kode') {
        return sortOrder === 'asc' 
          ? a.kodeSatker.localeCompare(b.kodeSatker)
          : b.kodeSatker.localeCompare(a.kodeSatker);
      }
      if (sortField === 'nama') {
        return sortOrder === 'asc'
          ? a.namaSatker.localeCompare(b.namaSatker)
          : b.namaSatker.localeCompare(a.namaSatker);
      }
      if (sortField === 'kurangCount') {
        const countA = (a.pegawai.status === 'BELUM_MEMENUHI' ? 1 : 0) +
          (a.barang.status === 'BELUM_MEMENUHI' ? 1 : 0) +
          (a.modal.status === 'BELUM_MEMENUHI' ? 1 : 0) +
          (a.bansos.status === 'BELUM_MEMENUHI' ? 1 : 0);
        const countB = (b.pegawai.status === 'BELUM_MEMENUHI' ? 1 : 0) +
          (b.barang.status === 'BELUM_MEMENUHI' ? 1 : 0) +
          (b.modal.status === 'BELUM_MEMENUHI' ? 1 : 0) +
          (b.bansos.status === 'BELUM_MEMENUHI' ? 1 : 0);
        return sortOrder === 'asc' ? countA - countB : countB - countA;
      }
      if (sortField === 'gapMax') {
        const minGapA = Math.min(
          a.pegawai.hasPagu ? a.pegawai.gapPersen : 999,
          a.barang.hasPagu ? a.barang.gapPersen : 999,
          a.modal.hasPagu ? a.modal.gapPersen : 999,
          a.bansos.hasPagu ? a.bansos.gapPersen : 999
        );
        const minGapB = Math.min(
          b.pegawai.hasPagu ? b.pegawai.gapPersen : 999,
          b.barang.hasPagu ? b.barang.gapPersen : 999,
          b.modal.hasPagu ? b.modal.gapPersen : 999,
          b.bansos.hasPagu ? b.bansos.gapPersen : 999
        );
        return sortOrder === 'asc' ? minGapA - minGapB : minGapB - minGapA;
      }
      return 0;
    });
  }, [evaluatedList, searchQuery, complianceFilter, specificFilter, sortField, sortOrder]);

  // Aggregate Stats (Percentage only, zero nominal, zero total)
  const stats = useMemo(() => {
    let satkerWithDeficitCount = 0;
    let satkerAllCompliantCount = 0;
    let deficit51Count = 0;
    let deficit52Count = 0;
    let deficit53Count = 0;
    let deficit57Count = 0;

    evaluatedList.forEach(s => {
      const hasDeficit = s.pegawai.status === 'BELUM_MEMENUHI' ||
        s.barang.status === 'BELUM_MEMENUHI' ||
        s.modal.status === 'BELUM_MEMENUHI' ||
        s.bansos.status === 'BELUM_MEMENUHI';

      if (hasDeficit) satkerWithDeficitCount++;
      else satkerAllCompliantCount++;

      if (s.pegawai.status === 'BELUM_MEMENUHI') deficit51Count++;
      if (s.barang.status === 'BELUM_MEMENUHI') deficit52Count++;
      if (s.modal.status === 'BELUM_MEMENUHI') deficit53Count++;
      if (s.bansos.status === 'BELUM_MEMENUHI') deficit57Count++;
    });

    return {
      totalSatker: evaluatedList.length,
      satkerWithDeficitCount,
      satkerAllCompliantCount,
      deficit51Count,
      deficit52Count,
      deficit53Count,
      deficit57Count
    };
  }, [evaluatedList]);

  // Focused Satker Object
  const focusedSatker = useMemo(() => {
    if (!focusedSatkerId) return null;
    return evaluatedList.find(s => s.id === focusedSatkerId) || null;
  }, [evaluatedList, focusedSatkerId]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredSatkers.length / pageSize) || 1;
  const paginatedSatkers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSatkers.slice(start, start + pageSize);
  }, [filteredSatkers, currentPage, pageSize]);

  // Copy Satker Status (Without any nominals)
  const handleCopySatkerStatus = (satker: EvaluatedSatkerRealisasi, e: React.MouseEvent) => {
    e.stopPropagation();
    const deficitItems: string[] = [];
    const compliantItems: string[] = [];

    if (satker.pegawai.hasPagu) {
      if (satker.pegawai.status === 'BELUM_MEMENUHI') {
        deficitItems.push(`- Belanja Pegawai (51): ${satker.pegawai.persen}% (Target ${satker.pegawai.targetPersen}%, Kurang ${Math.abs(satker.pegawai.gapPersen)}%)`);
      } else {
        compliantItems.push(`- Belanja Pegawai (51): ${satker.pegawai.persen}% (Target ${satker.pegawai.targetPersen}% ✅ Memenuhi)`);
      }
    }
    if (satker.barang.hasPagu) {
      if (satker.barang.status === 'BELUM_MEMENUHI') {
        deficitItems.push(`- Belanja Barang (52): ${satker.barang.persen}% (Target ${satker.barang.targetPersen}%, Kurang ${Math.abs(satker.barang.gapPersen)}%)`);
      } else {
        compliantItems.push(`- Belanja Barang (52): ${satker.barang.persen}% (Target ${satker.barang.targetPersen}% ✅ Memenuhi)`);
      }
    }
    if (satker.modal.hasPagu) {
      if (satker.modal.status === 'BELUM_MEMENUHI') {
        deficitItems.push(`- Belanja Modal (53): ${satker.modal.persen}% (Target ${satker.modal.targetPersen}%, Kurang ${Math.abs(satker.modal.gapPersen)}%)`);
      } else {
        compliantItems.push(`- Belanja Modal (53): ${satker.modal.persen}% (Target ${satker.modal.targetPersen}% ✅ Memenuhi)`);
      }
    }
    if (satker.bansos.hasPagu) {
      if (satker.bansos.status === 'BELUM_MEMENUHI') {
        deficitItems.push(`- Belanja Bansos (57): ${satker.bansos.persen}% (Target ${satker.bansos.targetPersen}%, Kurang ${Math.abs(satker.bansos.gapPersen)}%)`);
      } else {
        compliantItems.push(`- Belanja Bansos (57): ${satker.bansos.persen}% (Target ${satker.bansos.targetPersen}% ✅ Memenuhi)`);
      }
    }

    const text = `📢 *MONITORING TARGET REALISASI TRIWULAN (${triwulan})*
Satker: [${satker.kodeSatker}] ${satker.namaSatker}
K/L: ${satker.kementerianLembaga || '-'}

📌 *Target Per Jenis Belanja:*
Target B. Pegawai: ${activeRule.pegawai}% | B. Barang: ${activeRule.barang}% | B. Modal: ${activeRule.modal}% | B. Bansos: ${activeRule.bansos}%

${deficitItems.length > 0 ? `🚨 *Jenis Belanja Kurang dari Target:*\n${deficitItems.join('\n')}\n` : '✅ *Seluruh jenis belanja yang dialokasikan telah memenuhi target!*\n'}
${compliantItems.length > 0 ? `✨ *Jenis Belanja Sudah Memenuhi Target:*\n${compliantItems.join('\n')}\n` : ''}
💡 *Rekomendasi:*
Mohon segera percepat penyampaian SPM, proses BAST kontraktual, dan akselerasi serapan pada jenis belanja yang masih belum memenuhi target sebelum batas akhir triwulan.
_Layanan KPPN Semarang I - Handal & Transparan_`;

    navigator.clipboard.writeText(text);
    setCopiedId(satker.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Helper renderer for percentage pillar badge
  const renderPillarBadge = (pillar: EvaluatedSatkerRealisasi['pegawai'], label: string) => {
    if (!pillar.hasPagu) {
      return (
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
          <div className="text-[10px] font-bold text-slate-400">{label}</div>
          <div className="text-xs font-semibold text-slate-400 mt-0.5">-</div>
          <div className="text-[9px] text-slate-400">Tidak ada DIPA</div>
        </div>
      );
    }

    const isBelow = pillar.status === 'BELUM_MEMENUHI';
    const gap = pillar.gapPersen;

    return (
      <div className={`p-2.5 rounded-xl border text-center transition-all ${
        isBelow
          ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
      }`}>
        <div className="text-[10px] font-extrabold uppercase tracking-wide opacity-80">
          {label}
        </div>
        <div className="text-sm font-black mt-0.5 flex items-center justify-center gap-1">
          <span>{pillar.persen}%</span>
        </div>
        <div className="text-[10px] font-bold mt-0.5">
          {isBelow ? (
            <span className="text-rose-600 dark:text-rose-400">
              Kurang {Math.abs(gap)}%
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400">
              +{gap}% (Lolos)
            </span>
          )}
        </div>
        <div className="text-[9px] opacity-70 mt-0.5">
          Target: {pillar.targetPersen}%
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER KHUSUS SATKER */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border-slate-800' 
          : 'bg-gradient-to-br from-white via-sky-50/30 to-emerald-50/40 border-sky-200/80 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300/60">
                <Shield className="w-3.5 h-3.5" />
                Mode Portal Satker (Aman & Terlindungi)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Evaluasi: {triwulan}
              </span>
              {updateDate && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Data per: {updateDate}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2.5 tracking-tight">
              Monitoring Kepatuhan Target Realisasi Satker
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Tampilan khusus satker yang berfokus pada <span className="font-bold text-slate-800 dark:text-slate-200">persentase capaian per jenis belanja</span> (51 Pegawai, 52 Barang, 53 Modal, dan 57 Bansos). 
              Untuk menjaga kerahasiaan dan integritas, <span className="font-bold text-emerald-600 dark:text-emerald-400">seluruh nominal DIPA dan angka akumulasi total tidak ditampilkan</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isAdminAuthenticated ? (
              onSwitchToInternal && (
                <button
                  onClick={onSwitchToInternal}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-2 shadow-xs"
                  title="Kembali ke Dashboard Analisis Internal KPPN"
                >
                  <span>🏛️ Kembali ke Internal KPPN</span>
                </button>
              )
            ) : onOpenAdminAuth ? (
              <button
                onClick={onOpenAdminAuth}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
                title="Khusus Admin KPPN Semarang I - Perlu autentikasi PIN/Password"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Akses Admin KPPN</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* TARGET RULES INFO STRIP */}
        <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold">
            <Info className="w-4 h-4 text-sky-500 shrink-0" />
            <span>Target Evaluasi {triwulan} per Jenis Belanja:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-lg font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              51 Pegawai: {activeRule.pegawai}%
            </span>
            <span className="px-3 py-1 rounded-lg font-bold bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/20">
              52 Barang: {activeRule.barang}%
            </span>
            <span className="px-3 py-1 rounded-lg font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
              53 Modal: {activeRule.modal}%
            </span>
            <span className="px-3 py-1 rounded-lg font-bold bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-500/20">
              57 Bansos: {activeRule.bansos}%
            </span>
          </div>
        </div>
      </div>

      {/* QUICK STATS CHIPS (PERCENTAGE & COUNT ONLY, ZERO NOMINAL) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => {
            setComplianceFilter('ALL');
            setSpecificFilter('ALL');
            setCurrentPage(1);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            complianceFilter === 'ALL' && specificFilter === 'ALL'
              ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 ring-2 ring-sky-400/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-500">Semua Satker</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {stats.totalSatker}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Seluruh DIPA</div>
        </button>

        <button
          onClick={() => {
            setComplianceFilter('MEMILIKI_KURANG');
            setSpecificFilter('ALL');
            setCurrentPage(1);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            complianceFilter === 'MEMILIKI_KURANG' && specificFilter === 'ALL'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 ring-2 ring-rose-400/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-200'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Ada Belanja Kurang
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {stats.satkerWithDeficitCount}
          </div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">Perlu akselerasi</div>
        </button>

        <button
          onClick={() => {
            setSpecificFilter('51_KURANG');
            setCurrentPage(1);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            specificFilter === '51_KURANG'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-200'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            51 Pegawai Kurang
          </div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {stats.deficit51Count}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">&lt; {activeRule.pegawai}%</div>
        </button>

        <button
          onClick={() => {
            setSpecificFilter('52_KURANG');
            setCurrentPage(1);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            specificFilter === '52_KURANG'
              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-200'
          }`}
        >
          <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
            52 Barang Kurang
          </div>
          <div className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">
            {stats.deficit52Count}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">&lt; {activeRule.barang}%</div>
        </button>

        <button
          onClick={() => {
            setSpecificFilter('53_KURANG');
            setCurrentPage(1);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            specificFilter === '53_KURANG'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-200'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
            53 Modal Kurang
          </div>
          <div className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1">
            {stats.deficit53Count}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">&lt; {activeRule.modal}%</div>
        </button>

        <button
          onClick={() => {
            setComplianceFilter('SEMUA_MEMENUHI');
            setSpecificFilter('ALL');
            setCurrentPage(1);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            complianceFilter === 'SEMUA_MEMENUHI' && specificFilter === 'ALL'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-200'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Lengkap Sesuai
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.satkerAllCompliantCount}
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Semua jenis lolos</div>
        </button>
      </div>

      {/* SEARCH AND FOCUS SATKER FINDER */}
      <div className={`p-4.5 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Satker Search */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ketik Kode Satker (contoh: 651234) atau Nama Satker Anda..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full pl-9 pr-8 py-2.5 rounded-xl text-xs font-medium border outline-none transition-all ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-sky-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-500 focus:bg-white'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Selector Dropdown for Focus Satker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
              Fokus Satker Saya:
            </span>
            <select
              value={focusedSatkerId}
              onChange={(e) => setFocusedSatkerId(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold outline-none max-w-[280px] sm:max-w-[340px] truncate ${
                focusedSatkerId
                  ? 'bg-sky-50 border-sky-300 text-sky-900 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-200'
                  : isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="">-- Pilih Satker untuk Kartu Fokus --</option>
              {evaluatedList.map(s => {
                const deficitCount = (s.pegawai.status === 'BELUM_MEMENUHI' ? 1 : 0) +
                  (s.barang.status === 'BELUM_MEMENUHI' ? 1 : 0) +
                  (s.modal.status === 'BELUM_MEMENUHI' ? 1 : 0) +
                  (s.bansos.status === 'BELUM_MEMENUHI' ? 1 : 0);
                return (
                  <option key={s.id} value={s.id}>
                    [{s.kodeSatker}] {s.namaSatker} {deficitCount > 0 ? `(🚨 ${deficitCount} Jenis Belanja Kurang)` : '(✅ Memenuhi)'}
                  </option>
                );
              })}
            </select>

            {focusedSatkerId && (
              <button
                onClick={() => setFocusedSatkerId('')}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Tutup kartu fokus"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* FOCUSED SATKER CARD */}
        {focusedSatker && (
          <div className={`mt-4 p-5 rounded-2xl border transition-all animate-in fade-in duration-200 ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-gradient-to-r from-sky-50/70 via-white to-sky-50/40 border-sky-200'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-700">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300/60">
                    {focusedSatker.kodeSatker}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {focusedSatker.namaSatker}
                  </h3>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Kementerian/Lembaga: <span className="font-semibold text-slate-700 dark:text-slate-300">{focusedSatker.kementerianLembaga || '-'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => handleCopySatkerStatus(focusedSatker, e)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  {copiedId === focusedSatker.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === focusedSatker.id ? 'Tersalin!' : 'Salin Status Satker'}</span>
                </button>
              </div>
            </div>

            {/* 4 Pillar Badges of Focused Satker */}
            <div className="mt-4">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                <span>Rincian Persentase Serapan vs Target {triwulan}:</span>
                <span className="text-[10px] text-slate-400">(Hanya persentase jenis belanja ber-DIPA)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {renderPillarBadge(focusedSatker.pegawai, '51 - Belanja Pegawai')}
                {renderPillarBadge(focusedSatker.barang, '52 - Belanja Barang')}
                {renderPillarBadge(focusedSatker.modal, '53 - Belanja Modal')}
                {renderPillarBadge(focusedSatker.bansos, '57 - Belanja Bansos')}
              </div>
            </div>

            {/* Rekap Defisit Khusus Satker */}
            {focusedSatker.belumMemenuhiList && focusedSatker.belumMemenuhiList.length > 0 ? (
              <div className="mt-4 p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-200">
                <span className="font-extrabold block mb-1">
                  🚨 Perhatian Khusus Akselerasi:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {focusedSatker.belumMemenuhiList.map(item => (
                    <li key={item.jenis}>
                      <span className="font-bold">{item.jenis}</span>: saat ini masih kurang <span className="font-extrabold">{Math.abs(item.gap)}%</span> dari target triwulan.
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong className="font-extrabold">Selamat!</strong> Seluruh jenis belanja yang dialokasikan pada DIPA satker Anda telah memenuhi atau melampaui target evaluasi {triwulan}. Pertahankan performa untuk triwulan berikutnya.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TABLE DATA PERSENTASE SATKER (TANPA TOTAL & TANPA NOMINAL) */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm transition-all ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Table Filter & Counter Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{filteredSatkers.length}</span> satker
            {specificFilter !== 'ALL' && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px]">
                Filter Aktif: {specificFilter.replace('_', ' ')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Urutkan:</span>
            <select
              value={sortField}
              onChange={(e: any) => setSortField(e.target.value)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold outline-none ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="kurangCount">Jumlah Jenis Belanja Kurang</option>
              <option value="gapMax">Deviasi Tertinggal Terbesar</option>
              <option value="kode">Kode Satker</option>
              <option value="nama">Nama Satker</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Ganti arah urutan"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'bg-slate-850 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[240px]">Satker & K/L</th>
                <th className="py-3 px-3 text-center min-w-[130px]">
                  51 Pegawai
                  <span className="block text-[9px] text-slate-400 normal-case font-normal">(Target: {activeRule.pegawai}%)</span>
                </th>
                <th className="py-3 px-3 text-center min-w-[130px]">
                  52 Barang
                  <span className="block text-[9px] text-slate-400 normal-case font-normal">(Target: {activeRule.barang}%)</span>
                </th>
                <th className="py-3 px-3 text-center min-w-[130px]">
                  53 Modal
                  <span className="block text-[9px] text-slate-400 normal-case font-normal">(Target: {activeRule.modal}%)</span>
                </th>
                <th className="py-3 px-3 text-center min-w-[130px]">
                  57 Bansos
                  <span className="block text-[9px] text-slate-400 normal-case font-normal">(Target: {activeRule.bansos}%)</span>
                </th>
                <th className="py-3 px-4 min-w-[200px]">Jenis Belanja yang Kurang</th>
                <th className="py-3 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedSatkers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada data satker yang sesuai dengan kriteria filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedSatkers.map((s, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const hasCopied = copiedId === s.id;

                  // List of deficits
                  const deficits = s.belumMemenuhiList || [];
                  const isAllCompliant = deficits.length === 0;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => setFocusedSatkerId(s.id)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                        focusedSatkerId === s.id ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                      }`}
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {globalIdx}
                      </td>

                      {/* Satker & KL */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {s.namaSatker}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-200 dark:border-sky-800">
                            {s.kodeSatker}
                          </span>
                          <span className="truncate max-w-[200px] text-[10px]">
                            {s.kementerianLembaga || '-'}
                          </span>
                        </div>
                      </td>

                      {/* 51 Belanja Pegawai */}
                      <td className="py-3 px-3 text-center">
                        {!s.pegawai.hasPagu ? (
                          <span className="text-slate-400 text-[11px]">-</span>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {s.pegawai.persen}%
                            </div>
                            <div className="text-[10px] mt-0.5">
                              {s.pegawai.status === 'BELUM_MEMENUHI' ? (
                                <span className="font-extrabold text-rose-600 dark:text-rose-400">
                                  Kurang {Math.abs(s.pegawai.gapPersen)}%
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  ✅ Memenuhi
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 52 Belanja Barang */}
                      <td className="py-3 px-3 text-center">
                        {!s.barang.hasPagu ? (
                          <span className="text-slate-400 text-[11px]">-</span>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {s.barang.persen}%
                            </div>
                            <div className="text-[10px] mt-0.5">
                              {s.barang.status === 'BELUM_MEMENUHI' ? (
                                <span className="font-extrabold text-rose-600 dark:text-rose-400">
                                  Kurang {Math.abs(s.barang.gapPersen)}%
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  ✅ Memenuhi
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 53 Belanja Modal */}
                      <td className="py-3 px-3 text-center">
                        {!s.modal.hasPagu ? (
                          <span className="text-slate-400 text-[11px]">-</span>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {s.modal.persen}%
                            </div>
                            <div className="text-[10px] mt-0.5">
                              {s.modal.status === 'BELUM_MEMENUHI' ? (
                                <span className="font-extrabold text-rose-600 dark:text-rose-400">
                                  Kurang {Math.abs(s.modal.gapPersen)}%
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  ✅ Memenuhi
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 57 Belanja Bansos */}
                      <td className="py-3 px-3 text-center">
                        {!s.bansos.hasPagu ? (
                          <span className="text-slate-400 text-[11px]">-</span>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {s.bansos.persen}%
                            </div>
                            <div className="text-[10px] mt-0.5">
                              {s.bansos.status === 'BELUM_MEMENUHI' ? (
                                <span className="font-extrabold text-rose-600 dark:text-rose-400">
                                  Kurang {Math.abs(s.bansos.gapPersen)}%
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  ✅ Memenuhi
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Jenis Belanja yang Kurang */}
                      <td className="py-3 px-4">
                        {isAllCompliant ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Seluruh Belanja Memenuhi Target
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {deficits.map(d => (
                              <span
                                key={d.jenis}
                                className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                              >
                                <span>{d.jenis}</span>
                                <span className="text-rose-600 dark:text-rose-400">({d.gap}%)</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleCopySatkerStatus(s, e)}
                            className={`p-1.5 rounded-lg border text-xs transition-colors ${
                              hasCopied
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                            title="Salin status persentase belanja satker ini"
                          >
                            {hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Halaman <span className="font-bold text-slate-800 dark:text-slate-200">{currentPage}</span> dari <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Sebelumnya
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER PRIVACY & INTEGRITY NOTICE */}
      <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
        isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
      }`}>
        <Shield className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Kebijakan Perlindungan Informasi & Kerahasiaan Data Satker:
          </p>
          <p>
            Mode Satker ini mematuhi standar privasi dengan murni menyajikan persentase kinerja jenis belanja sesuai Peraturan Direktur Jenderal Perbendaharaan. Nominal DIPA, rincian pagu, dan angka kekurangan dalam mata uang Rupiah sengaja tidak ditampilkan dalam portal satker guna menjaga objektivitas dan mencegah perbandingan nominal antar satuan kerja.
          </p>
        </div>
      </div>
    </div>
  );
};
