import React, { useState, useMemo } from 'react';
import {
  EvaluatedSatkerRealisasi,
  TriwulanKey,
  TargetTriwulanRule,
  formatRupiah,
  formatRupiahCompact
} from '../utils/targetTriwulanProcessor';
import {
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Calculator,
  Copy,
  Check,
  Building2,
  HelpCircle,
  X,
  ArrowUpRight,
  Flame,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

interface RealisasiPilarAnalyticsViewProps {
  evaluatedList: EvaluatedSatkerRealisasi[];
  triwulan: TriwulanKey;
  activeRule: TargetTriwulanRule;
  onSelectSatker: (satker: EvaluatedSatkerRealisasi) => void;
  onOpenCalculator: (satkerId: string) => void;
  isDark?: boolean;
}

type PilarType = 'ALL' | '51' | '52' | '53' | '57';
type StatusConditionType = 'ALL' | 'KURANG' | 'BERLEBIH';

export const RealisasiPilarAnalyticsView: React.FC<RealisasiPilarAnalyticsViewProps> = ({
  evaluatedList,
  triwulan,
  activeRule,
  onSelectSatker,
  onOpenCalculator,
  isDark = false
}) => {
  // Selected Pilar
  const [selectedPilar, setSelectedPilar] = useState<PilarType>('ALL');
  // Selected Status Condition: ALL | KURANG | BERLEBIH
  const [statusCondition, setStatusCondition] = useState<StatusConditionType>('KURANG');
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  // Sorting
  const [sortBy, setSortBy] = useState<'GAP_ASC' | 'DEFISIT_DESC' | 'PAGU_DESC' | 'PERSEN_ASC' | 'PERSEN_DESC'>('DEFISIT_DESC');
  // Copied Row Id
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Helper to extract specific pilar data
  const getPilarDetail = (satker: EvaluatedSatkerRealisasi, pilar: PilarType) => {
    if (pilar === '51') return { detail: satker.pegawai, code: '51', name: 'Belanja Pegawai', target: activeRule.pegawai };
    if (pilar === '52') return { detail: satker.barang, code: '52', name: 'Belanja Barang', target: activeRule.barang };
    if (pilar === '53') return { detail: satker.modal, code: '53', name: 'Belanja Modal', target: activeRule.modal };
    if (pilar === '57') return { detail: satker.bansos, code: '57', name: 'Belanja Bansos', target: activeRule.bansos };
    return null;
  };

  // Compute Aggregate Stats per Pilar
  const pilarMetrics = useMemo(() => {
    const calc = (type: 'pegawai' | 'barang' | 'modal' | 'bansos', targetPct: number) => {
      let totalSatkerWithPagu = 0;
      let kurangCount = 0;
      let berlebihCount = 0;
      let totalPagu = 0;
      let totalReal = 0;
      let totalDefisitRp = 0;
      let totalSurplusRp = 0;

      evaluatedList.forEach(s => {
        const p = s[type];
        if (p.hasPagu) {
          totalSatkerWithPagu++;
          totalPagu += p.pagu;
          totalReal += p.realisasi;

          if (p.status === 'BELUM_MEMENUHI') {
            kurangCount++;
            totalDefisitRp += p.kekuranganNominal;
          } else if (p.status === 'MEMENUHI') {
            berlebihCount++;
            const targetRp = (p.pagu * targetPct) / 100;
            if (p.realisasi > targetRp) {
              totalSurplusRp += (p.realisasi - targetRp);
            }
          }
        }
      });

      const avgPersen = totalPagu > 0 ? Math.round((totalReal / totalPagu) * 10000) / 100 : 0;

      return {
        totalSatkerWithPagu,
        kurangCount,
        berlebihCount,
        totalPagu,
        totalReal,
        avgPersen,
        totalDefisitRp,
        totalSurplusRp,
        targetPct
      };
    };

    return {
      '51': calc('pegawai', activeRule.pegawai),
      '52': calc('barang', activeRule.barang),
      '53': calc('modal', activeRule.modal),
      '57': calc('bansos', activeRule.bansos),
    };
  }, [evaluatedList, activeRule]);

  // Filtered List
  const filteredList = useMemo(() => {
    return evaluatedList.filter(s => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = s.kodeSatker.toLowerCase().includes(q);
        const matchName = s.namaSatker.toLowerCase().includes(q);
        const matchKl = s.kementerianLembaga?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchKl) return false;
      }

      // If specific pilar selected
      if (selectedPilar !== 'ALL') {
        const p = getPilarDetail(s, selectedPilar);
        if (!p || !p.detail.hasPagu) return false;

        if (statusCondition === 'KURANG' && p.detail.status !== 'BELUM_MEMENUHI') return false;
        if (statusCondition === 'BERLEBIH' && p.detail.status !== 'MEMENUHI') return false;
      } else {
        // ALL pilars mode
        if (statusCondition === 'KURANG') {
          const hasAnyKurang = s.pegawai.status === 'BELUM_MEMENUHI' ||
            s.barang.status === 'BELUM_MEMENUHI' ||
            s.modal.status === 'BELUM_MEMENUHI' ||
            s.bansos.status === 'BELUM_MEMENUHI';
          if (!hasAnyKurang) return false;
        } else if (statusCondition === 'BERLEBIH') {
          const hasAnyKurang = s.pegawai.status === 'BELUM_MEMENUHI' ||
            s.barang.status === 'BELUM_MEMENUHI' ||
            s.modal.status === 'BELUM_MEMENUHI' ||
            s.bansos.status === 'BELUM_MEMENUHI';
          if (hasAnyKurang) return false; // purely compliant
        }
      }

      return true;
    }).sort((a, b) => {
      if (selectedPilar !== 'ALL') {
        const pa = getPilarDetail(a, selectedPilar)!.detail;
        const pb = getPilarDetail(b, selectedPilar)!.detail;

        if (sortBy === 'DEFISIT_DESC') return pb.kekuranganNominal - pa.kekuranganNominal;
        if (sortBy === 'GAP_ASC') return pa.gapPersen - pb.gapPersen;
        if (sortBy === 'PAGU_DESC') return pb.pagu - pa.pagu;
        if (sortBy === 'PERSEN_ASC') return pa.persen - pb.persen;
        if (sortBy === 'PERSEN_DESC') return pb.persen - pa.persen;
      } else {
        if (sortBy === 'DEFISIT_DESC') return b.totalKekuranganNominal - a.totalKekuranganNominal;
        if (sortBy === 'GAP_ASC') return a.gapPersenLangsung - b.gapPersenLangsung;
        if (sortBy === 'PAGU_DESC') return b.totalPagu - a.totalPagu;
        if (sortBy === 'PERSEN_ASC') return a.totalPersen - b.totalPersen;
        if (sortBy === 'PERSEN_DESC') return b.totalPersen - a.totalPersen;
      }
      return 0;
    });
  }, [evaluatedList, selectedPilar, statusCondition, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Handle Copy WA for specific pillar
  const handleCopyWa = (satker: EvaluatedSatkerRealisasi, e: React.MouseEvent) => {
    e.stopPropagation();

    let targetText = '';
    if (selectedPilar !== 'ALL') {
      const p = getPilarDetail(satker, selectedPilar)!;
      targetText = `Yth. KPA / PPK Satker [${satker.kodeSatker}] ${satker.namaSatker},

Berdasarkan monitoring kepatuhan target realisasi ${triwulan} KPPN Semarang I:
📌 *Fokus Analisis: ${p.name} (Akun ${p.code})*
- Pagu DIPA: ${formatRupiah(p.detail.pagu)}
- Target Triwulan: ${p.target}% (${formatRupiah((p.detail.pagu * p.target) / 100)})
- Realisasi Saat Ini: ${p.detail.persen}% (${formatRupiah(p.detail.realisasi)})
${p.detail.status === 'BELUM_MEMENUHI' 
  ? `🚨 *Status:* KURANG dari target sebesar *${Math.abs(p.detail.gapPersen)}%* (Kekurangan: *${formatRupiah(p.detail.kekuranganNominal)}*)\n\nMohon segera mengajukan SPM (LS / GUP) sebelum batas akhir triwulan.`
  : `✅ *Status:* TELAH MEMENUHI target triwulan (+${p.detail.gapPersen}% di atas target). Terima kasih atas kinerjanya.`
}`;
    } else {
      const listKurang: string[] = [];
      if (satker.pegawai.status === 'BELUM_MEMENUHI') listKurang.push(`• 51 Pegawai: ${satker.pegawai.persen}% (Target ${activeRule.pegawai}%, Kurang ${formatRupiah(satker.pegawai.kekuranganNominal)})`);
      if (satker.barang.status === 'BELUM_MEMENUHI') listKurang.push(`• 52 Barang: ${satker.barang.persen}% (Target ${activeRule.barang}%, Kurang ${formatRupiah(satker.barang.kekuranganNominal)})`);
      if (satker.modal.status === 'BELUM_MEMENUHI') listKurang.push(`• 53 Modal: ${satker.modal.persen}% (Target ${activeRule.modal}%, Kurang ${formatRupiah(satker.modal.kekuranganNominal)})`);
      if (satker.bansos.status === 'BELUM_MEMENUHI') listKurang.push(`• 57 Bansos: ${satker.bansos.persen}% (Target ${activeRule.bansos}%, Kurang ${formatRupiah(satker.bansos.kekuranganNominal)})`);

      targetText = `Yth. KPA / PPK Satker [${satker.kodeSatker}] ${satker.namaSatker},

Monitoring evaluasi target per jenis belanja ${triwulan} KPPN Semarang I:
Total Pagu DIPA: ${formatRupiah(satker.totalPagu)}
Realisasi Total: ${satker.totalPersen}% (${formatRupiah(satker.totalRealisasi)})

${listKurang.length > 0 ? `🚨 *Jenis Belanja yang Belum Memenuhi Target:*\n${listKurang.join('\n')}\n\nTotal kekurangan nominal untuk mencapai seluruh target: *${formatRupiah(satker.totalKekuranganNominal)}*` : '✅ Seluruh jenis belanja telah memenuhi target triwulan.'}

Mohon segera mengakselerasi penyampaian SPM ke KPPN.`;
    }

    navigator.clipboard.writeText(targetText);
    setCopiedId(satker.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-5">
      {/* 4 PILAR SUMMARY HERO CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 51 Belanja Pegawai Card */}
        <div
          onClick={() => {
            setSelectedPilar('51');
            setCurrentPage(1);
          }}
          className={`p-4.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
            selectedPilar === '51'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300'
              : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              51 - Belanja Pegawai
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Target: {activeRule.pegawai}%
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {pilarMetrics['51'].avgPersen}%
            </span>
            <span className="text-xs text-slate-500">
              {pilarMetrics['51'].totalSatkerWithPagu} Satker DIPA
            </span>
          </div>

          {/* Kurang vs Berlebih Ratio */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Kurang Target:
              </span>
              <span className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
                {pilarMetrics['51'].kurangCount} Satker
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                Defisit: {formatRupiahCompact(pilarMetrics['51'].totalDefisitRp)}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Memenuhi / Lebih:
              </span>
              <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                {pilarMetrics['51'].berlebihCount} Satker
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                Surplus: {formatRupiahCompact(pilarMetrics['51'].totalSurplusRp)}
              </span>
            </div>
          </div>
        </div>

        {/* 52 Belanja Barang Card */}
        <div
          onClick={() => {
            setSelectedPilar('52');
            setCurrentPage(1);
          }}
          className={`p-4.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
            selectedPilar === '52'
              ? 'ring-2 ring-blue-500 bg-blue-50/60 dark:bg-blue-950/40 border-blue-300'
              : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
              52 - Belanja Barang
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              Target: {activeRule.barang}%
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {pilarMetrics['52'].avgPersen}%
            </span>
            <span className="text-xs text-slate-500">
              {pilarMetrics['52'].totalSatkerWithPagu} Satker DIPA
            </span>
          </div>

          {/* Kurang vs Berlebih Ratio */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Kurang Target:
              </span>
              <span className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
                {pilarMetrics['52'].kurangCount} Satker
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                Defisit: {formatRupiahCompact(pilarMetrics['52'].totalDefisitRp)}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Memenuhi / Lebih:
              </span>
              <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                {pilarMetrics['52'].berlebihCount} Satker
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                Surplus: {formatRupiahCompact(pilarMetrics['52'].totalSurplusRp)}
              </span>
            </div>
          </div>
        </div>

        {/* 53 Belanja Modal Card */}
        <div
          onClick={() => {
            setSelectedPilar('53');
            setCurrentPage(1);
          }}
          className={`p-4.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
            selectedPilar === '53'
              ? 'ring-2 ring-amber-500 bg-amber-50/60 dark:bg-amber-950/40 border-amber-300'
              : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              53 - Belanja Modal
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Target: {activeRule.modal}%
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {pilarMetrics['53'].avgPersen}%
            </span>
            <span className="text-xs text-slate-500">
              {pilarMetrics['53'].totalSatkerWithPagu} Satker DIPA
            </span>
          </div>

          {/* Kurang vs Berlebih Ratio */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Kurang Target:
              </span>
              <span className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
                {pilarMetrics['53'].kurangCount} Satker
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                Defisit: {formatRupiahCompact(pilarMetrics['53'].totalDefisitRp)}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Memenuhi / Lebih:
              </span>
              <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                {pilarMetrics['53'].berlebihCount} Satker
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                Surplus: {formatRupiahCompact(pilarMetrics['53'].totalSurplusRp)}
              </span>
            </div>
          </div>
        </div>

        {/* 57 Belanja Bansos Card */}
        <div
          onClick={() => {
            setSelectedPilar('57');
            setCurrentPage(1);
          }}
          className={`p-4.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
            selectedPilar === '57'
              ? 'ring-2 ring-purple-500 bg-purple-50/60 dark:bg-purple-950/40 border-purple-300'
              : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
              57 - Belanja Bansos
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              Target: {activeRule.bansos}%
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {pilarMetrics['57'].avgPersen}%
            </span>
            <span className="text-xs text-slate-500">
              {pilarMetrics['57'].totalSatkerWithPagu} Satker DIPA
            </span>
          </div>

          {/* Kurang vs Berlebih Ratio */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Kurang Target:
              </span>
              <span className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
                {pilarMetrics['57'].kurangCount} Satker
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                Defisit: {formatRupiahCompact(pilarMetrics['57'].totalDefisitRp)}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Memenuhi / Lebih:
              </span>
              <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                {pilarMetrics['57'].berlebihCount} Satker
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                Surplus: {formatRupiahCompact(pilarMetrics['57'].totalSurplusRp)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SELECTION BAR */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Pilar Selection Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1">Fokus Belanja:</span>
            <button
              onClick={() => {
                setSelectedPilar('ALL');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPilar === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Semua Pilar (Komparasi)
            </button>
            <button
              onClick={() => {
                setSelectedPilar('51');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPilar === '51'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200/50'
              }`}
            >
              51 Pegawai ({activeRule.pegawai}%)
            </button>
            <button
              onClick={() => {
                setSelectedPilar('52');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPilar === '52'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 hover:bg-blue-100 border border-blue-200/50'
              }`}
            >
              52 Barang ({activeRule.barang}%)
            </button>
            <button
              onClick={() => {
                setSelectedPilar('53');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPilar === '53'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200/50'
              }`}
            >
              53 Modal ({activeRule.modal}%)
            </button>
            <button
              onClick={() => {
                setSelectedPilar('57');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPilar === '57'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 hover:bg-purple-100 border border-purple-200/50'
              }`}
            >
              57 Bansos ({activeRule.bansos}%)
            </button>
          </div>

          {/* Condition Filter: KURANG vs BERLEBIH vs ALL */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <div className="inline-flex p-0.5 rounded-xl border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => {
                  setStatusCondition('KURANG');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  statusCondition === 'KURANG'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-600 hover:text-rose-700'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                🚨 Kurang dari Target
              </button>
              <button
                onClick={() => {
                  setStatusCondition('BERLEBIH');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  statusCondition === 'BERLEBIH'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-600 hover:text-emerald-700'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                ✨ Memenuhi / Berlebih
              </button>
              <button
                onClick={() => {
                  setStatusCondition('ALL');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusCondition === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Semua
              </button>
            </div>
          </div>
        </div>

        {/* Sub Row: Search & Sort */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode atau nama satker..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full pl-9 pr-4 py-1.5 rounded-xl text-xs font-medium border outline-none ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="DEFISIT_DESC">Kekurangan / Gap Terbesar (Rp)</option>
              <option value="GAP_ASC">Deviasi Persen Paling Minus (%)</option>
              <option value="PAGU_DESC">Pagu Anggaran Terbesar</option>
              <option value="PERSEN_ASC">Persen Serapan Terendah</option>
              <option value="PERSEN_DESC">Persen Serapan Tertinggi</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE VIEW ANALISIS 51-57 */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm transition-all ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">
            Ditemukan <strong className="text-slate-900 dark:text-white font-black">{filteredList.length}</strong> satker untuk kriteria{' '}
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              {selectedPilar === 'ALL' ? 'Semua Pilar' : `Pilar ${selectedPilar}`}
            </span>{' '}
            ({statusCondition === 'KURANG' ? '🚨 Belum Memenuhi Target' : statusCondition === 'BERLEBIH' ? '✨ Memenuhi / Melampaui' : 'Semua Kondisi'})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'bg-slate-850 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[240px]">Satker & K/L</th>

                {selectedPilar === 'ALL' ? (
                  <>
                    <th className="py-3 px-3 text-center">
                      51 Pegawai
                      <span className="block text-[9px] text-slate-400 font-normal">Target {activeRule.pegawai}%</span>
                    </th>
                    <th className="py-3 px-3 text-center">
                      52 Barang
                      <span className="block text-[9px] text-slate-400 font-normal">Target {activeRule.barang}%</span>
                    </th>
                    <th className="py-3 px-3 text-center">
                      53 Modal
                      <span className="block text-[9px] text-slate-400 font-normal">Target {activeRule.modal}%</span>
                    </th>
                    <th className="py-3 px-3 text-center">
                      57 Bansos
                      <span className="block text-[9px] text-slate-400 font-normal">Target {activeRule.bansos}%</span>
                    </th>
                    <th className="py-3 px-4 text-right">Total Defisit Rp</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-4 text-right">Pagu Alokasi DIPA</th>
                    <th className="py-3 px-4 text-right">Target Nominal</th>
                    <th className="py-3 px-4 text-right">Realisasi & % Serapan</th>
                    <th className="py-3 px-4 text-right">Deviasi & Kekurangan</th>
                    <th className="py-3 px-3 text-center">Status Pilar</th>
                  </>
                )}
                <th className="py-3 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={selectedPilar === 'ALL' ? 8 : 7} className="py-12 text-center text-slate-400">
                    Tidak ada data satker yang sesuai dengan kriteria filter pilar dan status ini.
                  </td>
                </tr>
              ) : (
                paginatedList.map((s, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const hasCopied = copiedId === s.id;

                  if (selectedPilar !== 'ALL') {
                    const p = getPilarDetail(s, selectedPilar)!;
                    const detail = p.detail;
                    const targetRp = (detail.pagu * p.target) / 100;
                    const isKurang = detail.status === 'BELUM_MEMENUHI';

                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${
                          isKurang ? 'bg-rose-50/10' : ''
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
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                              {s.kodeSatker}
                            </span>
                            <span className="truncate max-w-[200px] text-[10px]">
                              {s.kementerianLembaga || '-'}
                            </span>
                          </div>
                        </td>

                        {/* Pagu Pilar */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {formatRupiahCompact(detail.pagu)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Sisa: {formatRupiahCompact(detail.sisaPagu)}
                          </div>
                        </td>

                        {/* Target Nominal */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="font-extrabold text-blue-600 dark:text-blue-400">
                            {p.target}%
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {formatRupiahCompact(targetRp)}
                          </div>
                        </td>

                        {/* Realisasi Saat Ini */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className={`font-black ${detail.persen >= p.target ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {detail.persen}%
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            {formatRupiahCompact(detail.realisasi)}
                          </div>
                        </td>

                        {/* Deviasi & Kekurangan */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {isKurang ? (
                            <div>
                              <div className="font-extrabold text-rose-600 dark:text-rose-400">
                                Kurang {formatRupiahCompact(detail.kekuranganNominal)}
                              </div>
                              <div className="text-[10px] text-rose-500 font-semibold">
                                Gap: {detail.gapPersen}%
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                +{detail.gapPersen}% (Lolos)
                              </div>
                              <div className="text-[10px] text-emerald-500 font-medium">
                                Surplus {formatRupiahCompact(Math.max(0, detail.realisasi - targetRp))}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Status Pilar */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isKurang ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              Kurang
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Memenuhi
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {isKurang && (
                              <button
                                onClick={() => onOpenCalculator(s.id)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 text-xs"
                                title="Kalkulator SPM Satker"
                              >
                                <Calculator className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleCopyWa(s, e)}
                              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                hasCopied
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                              title="Salin pesan WA khusus pilar ini"
                            >
                              {hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => onSelectSatker(s)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
                              title="Detail DIPA Satker"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // ALL PILARS COMPARISON ROW
                  const renderPillarCell = (pillar: EvaluatedSatkerRealisasi['pegawai'], label: string) => {
                    if (!pillar.hasPagu) {
                      return <span className="text-slate-300 dark:text-slate-600">-</span>;
                    }
                    const isDeficit = pillar.status === 'BELUM_MEMENUHI';
                    return (
                      <div className="text-center">
                        <span className={`font-bold ${isDeficit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {pillar.persen}%
                        </span>
                        <div className="text-[10px]">
                          {isDeficit ? (
                            <span className="text-rose-500 font-semibold">(-{Math.abs(pillar.gapPersen)}%)</span>
                          ) : (
                            <span className="text-emerald-500 font-semibold">(+{pillar.gapPersen}%)</span>
                          )}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
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
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                            {s.kodeSatker}
                          </span>
                          <span className="truncate max-w-[200px] text-[10px]">
                            {s.kementerianLembaga || '-'}
                          </span>
                        </div>
                      </td>

                      {/* 51 */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {renderPillarCell(s.pegawai, '51')}
                      </td>

                      {/* 52 */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {renderPillarCell(s.barang, '52')}
                      </td>

                      {/* 53 */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {renderPillarCell(s.modal, '53')}
                      </td>

                      {/* 57 */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {renderPillarCell(s.bansos, '57')}
                      </td>

                      {/* Total Defisit Rp */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {s.totalKekuranganNominal > 0 ? (
                          <div className="font-extrabold text-rose-600 dark:text-rose-400">
                            Kurang {formatRupiahCompact(s.totalKekuranganNominal)}
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-extrabold text-[11px]">
                            ✅ Seluruh Target Lolos
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenCalculator(s.id)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 text-xs"
                            title="Kalkulator SPM Satker"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleCopyWa(s, e)}
                            className={`p-1.5 rounded-lg border text-xs transition-colors ${
                              hasCopied
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                            title="Salin pesan WA kebutuhan belanja satker"
                          >
                            {hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => onSelectSatker(s)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
                            title="Detail DIPA Satker"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
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
    </div>
  );
};
