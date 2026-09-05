import React, { useState, useMemo } from 'react';
import { 
  AlertOctagon, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Calculator, 
  Copy, 
  Check, 
  ArrowUpRight, 
  TrendingUp, 
  Building2, 
  Layers, 
  DollarSign, 
  Percent, 
  Flame, 
  Search,
  SlidersHorizontal,
  ExternalLink,
  Briefcase
} from 'lucide-react';
import { 
  EvaluatedSatkerRealisasi, 
  TriwulanKey, 
  TargetTriwulanRule, 
  formatRupiah, 
  formatRupiahCompact 
} from '../utils/targetTriwulanProcessor';

interface RealisasiDefisitMatrixViewProps {
  evaluatedList: EvaluatedSatkerRealisasi[];
  triwulan: TriwulanKey;
  activeRule: TargetTriwulanRule;
  onSelectSatker: (satker: EvaluatedSatkerRealisasi) => void;
  onOpenCalculator: (satkerId: string) => void;
  isDark?: boolean;
}

export const RealisasiDefisitMatrixView: React.FC<RealisasiDefisitMatrixViewProps> = ({
  evaluatedList,
  triwulan,
  activeRule,
  onSelectSatker,
  onOpenCalculator,
  isDark = false
}) => {
  const [activeGroup, setActiveGroup] = useState<'ALL' | 'KRITIS' | 'QUICK_WINS' | 'MODAL' | 'CHAMPION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Group satkers into strategic operational buckets
  const groupedData = useMemo(() => {
    const kritis: EvaluatedSatkerRealisasi[] = [];
    const quickWins: EvaluatedSatkerRealisasi[] = [];
    const modalTertinggal: EvaluatedSatkerRealisasi[] = [];
    const champions: EvaluatedSatkerRealisasi[] = [];

    evaluatedList.forEach(s => {
      const isCompliant = s.overallStatus === 'SESUAI';

      if (isCompliant) {
        champions.push(s);
      } else {
        // Not compliant
        const isKritis = s.paguCluster === 'JUMBO' || s.totalKekuranganNominal >= 500_000_000;
        const isQuickWin = s.totalKekuranganNominal > 0 && (s.totalKekuranganNominal < 50_000_000 || Math.abs(s.gapPersenLangsung) < 5);
        const hasModalIssue = s.modal.hasPagu && s.modal.status === 'BELUM_MEMENUHI';

        if (isKritis) {
          kritis.push(s);
        } else if (isQuickWin) {
          quickWins.push(s);
        } else if (hasModalIssue) {
          modalTertinggal.push(s);
        } else {
          // Default to quick wins or kritis based on nominal
          if (s.totalKekuranganNominal >= 150_000_000) {
            kritis.push(s);
          } else {
            quickWins.push(s);
          }
        }
      }
    });

    // Sort
    kritis.sort((a, b) => b.totalKekuranganNominal - a.totalKekuranganNominal);
    quickWins.sort((a, b) => a.totalKekuranganNominal - b.totalKekuranganNominal);
    modalTertinggal.sort((a, b) => b.modal.kekuranganNominal - a.modal.kekuranganNominal);
    champions.sort((a, b) => b.totalPersen - a.totalPersen);

    // Sums
    const sumDefisit = (list: EvaluatedSatkerRealisasi[]) => list.reduce((acc, s) => acc + s.totalKekuranganNominal, 0);

    return {
      kritis: {
        list: kritis,
        count: kritis.length,
        totalDefisitRp: sumDefisit(kritis),
        label: 'Defisit Prioritas Kritis',
        tagline: 'Kurang > Rp 500 Juta atau Pagu Jumbo Belum Sesuai',
        color: 'rose'
      },
      quickWins: {
        list: quickWins,
        count: quickWins.length,
        totalDefisitRp: sumDefisit(quickWins),
        label: 'Quick Wins (Akselerasi Cepat)',
        tagline: 'Kurang < Rp 50 Juta atau butuh < 5% lagi untuk Lulus',
        color: 'amber'
      },
      modal: {
        list: modalTertinggal,
        count: modalTertinggal.length,
        totalDefisitRp: modalTertinggal.reduce((acc, s) => acc + s.modal.kekuranganNominal, 0),
        label: 'Atensi Belanja Modal',
        tagline: 'Satker dengan kendala penyerapan Belanja Modal Fisik/Kontrak',
        color: 'blue'
      },
      champions: {
        list: champions,
        count: champions.length,
        totalDefisitRp: 0,
        label: 'Champion (Lulus Target)',
        tagline: 'Satker yang telah memenuhi seluruh target triwulanan',
        color: 'emerald'
      }
    };
  }, [evaluatedList]);

  // Determine current active list based on activeGroup and search
  const currentList = useMemo(() => {
    let baseList: EvaluatedSatkerRealisasi[] = [];
    if (activeGroup === 'ALL') {
      baseList = [
        ...groupedData.kritis.list,
        ...groupedData.quickWins.list,
        ...groupedData.modal.list,
        ...groupedData.champions.list
      ];
    } else if (activeGroup === 'KRITIS') {
      baseList = groupedData.kritis.list;
    } else if (activeGroup === 'QUICK_WINS') {
      baseList = groupedData.quickWins.list;
    } else if (activeGroup === 'MODAL') {
      baseList = groupedData.modal.list;
    } else if (activeGroup === 'CHAMPION') {
      baseList = groupedData.champions.list;
    }

    if (!searchQuery.trim()) return baseList;
    const q = searchQuery.toLowerCase();
    return baseList.filter(s => 
      s.kodeSatker.toLowerCase().includes(q) ||
      s.namaSatker.toLowerCase().includes(q) ||
      (s.kementerianLembaga && s.kementerianLembaga.toLowerCase().includes(q))
    );
  }, [groupedData, activeGroup, searchQuery]);

  // Handle Copy quick WhatsApp reminder for a satker
  const handleCopyWa = (satker: EvaluatedSatkerRealisasi, e: React.MouseEvent) => {
    e.stopPropagation();
    
    let text = `*PEMBERITAHUAN KEBUTUHAN TARGET ANGGARAN ${triwulan.toUpperCase()}*\n`;
    text += `Satker: *${satker.namaSatker}* (${satker.kodeSatker})\n`;
    text += `Target Komposit Satker : *${satker.targetPersenLangsung}%* (${formatRupiahCompact(satker.targetNominalTotal)})\n`;
    text += `Realisasi Saat Ini      : *${satker.totalPersen}%* (${formatRupiahCompact(satker.totalRealisasi)})\n`;

    if (satker.totalKekuranganNominal > 0) {
      text += `🚨 *KEKURANGAN REALISASI TARGET : ${formatRupiah(satker.totalKekuranganNominal)} (Gap: ${satker.gapPersenLangsung}%)*\n\n`;
      text += `Rincian per Jenis Belanja:\n`;
      if (satker.pegawai.hasPagu) text += `• B. Pegawai : ${satker.pegawai.persen}% (Target ${satker.pegawai.targetPersen}%) ${satker.pegawai.status === 'MEMENUHI' ? '✅' : `❌ Kurang ${formatRupiah(satker.pegawai.kekuranganNominal)}`}\n`;
      if (satker.barang.hasPagu) text += `• B. Barang  : ${satker.barang.persen}% (Target ${satker.barang.targetPersen}%) ${satker.barang.status === 'MEMENUHI' ? '✅' : `❌ Kurang ${formatRupiah(satker.barang.kekuranganNominal)}`}\n`;
      if (satker.modal.hasPagu) text += `• B. Modal   : ${satker.modal.persen}% (Target ${satker.modal.targetPersen}%) ${satker.modal.status === 'MEMENUHI' ? '✅' : `❌ Kurang ${formatRupiah(satker.modal.kekuranganNominal)}`}\n`;
      if (satker.bansos.hasPagu) text += `• B. Bansos  : ${satker.bansos.persen}% (Target ${satker.bansos.targetPersen}%) ${satker.bansos.status === 'MEMENUHI' ? '✅' : `❌ Kurang ${formatRupiah(satker.bansos.kekuranganNominal)}`}\n`;
      text += `\nMohon segera mengajukan SPM ke KPPN Semarang I sebelum batas akhir triwulan.`;
    } else {
      text += `✅ *STATUS: TELAH MEMENUHI TARGET TRIWULAN ${triwulan.toUpperCase()}!*\nTerima kasih atas kepatuhan akselerasi penyerapan anggaran.`;
    }

    navigator.clipboard.writeText(text);
    setCopiedId(satker.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* 4 STRATEGIC ACTION QUADRANTS BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Quadrant 1: Kritis */}
        <div 
          onClick={() => setActiveGroup('KRITIS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            activeGroup === 'KRITIS' 
              ? 'ring-2 ring-rose-500 shadow-md bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800' 
              : isDark 
                ? 'bg-slate-900/80 border-slate-800 hover:border-rose-800/80' 
                : 'bg-white border-slate-200 hover:border-rose-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              1. Defisit Kritis
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
              {groupedData.kritis.count} Satker
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-rose-700 dark:text-rose-300">
            {formatRupiahCompact(groupedData.kritis.totalDefisitRp)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
            Kurang &gt; Rp 500Jt / Pagu Jumbo
          </p>
          <div className="mt-2.5 pt-2 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between text-[10px] font-bold text-rose-600 dark:text-rose-400">
            <span>Dampak Serapan Tertinggi</span>
            <span>Pilih Grup →</span>
          </div>
        </div>

        {/* Quadrant 2: Quick Wins */}
        <div 
          onClick={() => setActiveGroup('QUICK_WINS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            activeGroup === 'QUICK_WINS' 
              ? 'ring-2 ring-amber-500 shadow-md bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800' 
              : isDark 
                ? 'bg-slate-900/80 border-slate-800 hover:border-amber-800/80' 
                : 'bg-white border-slate-200 hover:border-amber-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <Flame className="w-4 h-4 text-amber-500" />
              2. Quick Wins
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              {groupedData.quickWins.count} Satker
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-amber-700 dark:text-amber-300">
            {formatRupiahCompact(groupedData.quickWins.totalDefisitRp)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
            Kurang &lt; Rp 50Jt atau Gap &lt; 5%
          </p>
          <div className="mt-2.5 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-[10px] font-bold text-amber-600 dark:text-amber-400">
            <span>Potensi Cepat Lulus Target</span>
            <span>Pilih Grup →</span>
          </div>
        </div>

        {/* Quadrant 3: Belanja Modal */}
        <div 
          onClick={() => setActiveGroup('MODAL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            activeGroup === 'MODAL' 
              ? 'ring-2 ring-blue-500 shadow-md bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' 
              : isDark 
                ? 'bg-slate-900/80 border-slate-800 hover:border-blue-800/80' 
                : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <Briefcase className="w-4 h-4 text-blue-500" />
              3. Atensi Modal
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {groupedData.modal.count} Satker
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-blue-700 dark:text-blue-300">
            {formatRupiahCompact(groupedData.modal.totalDefisitRp)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
            Belanja Modal belum memenuhi {activeRule.modal}%
          </p>
          <div className="mt-2.5 pt-2 border-t border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400">
            <span>Percepatan SPM Kontrak</span>
            <span>Pilih Grup →</span>
          </div>
        </div>

        {/* Quadrant 4: Champion */}
        <div 
          onClick={() => setActiveGroup('CHAMPION')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            activeGroup === 'CHAMPION' 
              ? 'ring-2 ring-emerald-500 shadow-md bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' 
              : isDark 
                ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-800/80' 
                : 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              4. Champion
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              {groupedData.champions.count} Satker
            </span>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-700 dark:text-emerald-300">
            100% Memenuhi
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
            Seluruh 4 pilar belanja tercapai
          </p>
          <div className="mt-2.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span>Performa Sangat Baik</span>
            <span>Pilih Grup →</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
            Tampilkan:
          </span>
          <button
            onClick={() => setActiveGroup('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeGroup === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Semua Satker ({evaluatedList.length})
          </button>
          <button
            onClick={() => setActiveGroup('KRITIS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeGroup === 'KRITIS'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            <AlertOctagon className="w-3 h-3" />
            Defisit Kritis ({groupedData.kritis.count})
          </button>
          <button
            onClick={() => setActiveGroup('QUICK_WINS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeGroup === 'QUICK_WINS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            <Flame className="w-3 h-3" />
            Quick Wins ({groupedData.quickWins.count})
          </button>
          <button
            onClick={() => setActiveGroup('MODAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeGroup === 'MODAL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
            }`}
          >
            <Briefcase className="w-3 h-3" />
            Atensi Modal ({groupedData.modal.count})
          </button>
          <button
            onClick={() => setActiveGroup('CHAMPION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeGroup === 'CHAMPION'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Champion ({groupedData.champions.count})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari satker dalam grup ini..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none font-medium ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-emerald-500' 
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500 focus:bg-white'
            }`}
          />
        </div>
      </div>

      {/* SATKER CARDS GRID */}
      {currentList.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border text-slate-400 text-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          Tidak ada satker yang cocok dengan kriteria filter pencarian dalam grup ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {currentList.map(s => {
            const isCompliant = s.overallStatus === 'SESUAI';
            const progressToTarget = s.targetPersenLangsung > 0 
              ? Math.min(100, Math.round((s.totalPersen / s.targetPersenLangsung) * 100))
              : 100;
            const hasCopied = copiedId === s.id;

            return (
              <div
                key={s.id}
                onClick={() => onSelectSatker(s)}
                className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group hover:shadow-md ${
                  !isCompliant && s.totalKekuranganNominal >= 500_000_000
                    ? isDark ? 'bg-slate-900 border-rose-900/50 hover:border-rose-700' : 'bg-white border-rose-200/90 hover:border-rose-300'
                    : isCompliant
                      ? isDark ? 'bg-slate-900 border-emerald-900/40 hover:border-emerald-700' : 'bg-white border-emerald-200/80 hover:border-emerald-300'
                      : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                          {s.kodeSatker}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          s.paguCluster === 'JUMBO'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : s.paguCluster === 'BESAR'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {s.clusterLabel}
                        </span>
                      </div>
                      <h3 className="font-bold text-xs mt-1.5 text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
                        {s.namaSatker}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {s.kementerianLembaga || '-'}
                      </p>
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0 text-right">
                      {isCompliant ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
                          <CheckCircle2 className="w-3 h-3" />
                          Lulus
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300/40">
                          <AlertOctagon className="w-3 h-3" />
                          Belum Sesuai
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CORE TARGET & DEFICIT BOX */}
                  <div className={`mt-3.5 p-3 rounded-xl border text-xs ${
                    isCompliant
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50'
                  }`}>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Target Langsung:</span>
                        <div className="font-extrabold text-slate-800 dark:text-slate-200">
                          🎯 {s.targetPersenLangsung}%
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {formatRupiahCompact(s.targetNominalTotal)}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Realisasi Saat Ini:</span>
                        <div className={`font-extrabold ${s.totalPersen >= s.targetPersenLangsung ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}`}>
                          📊 {s.totalPersen}%
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {formatRupiahCompact(s.totalRealisasi)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar towards Target */}
                    <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span className="text-slate-500">Capaian Menuju Target:</span>
                        <span className={progressToTarget >= 100 ? 'text-emerald-600' : 'text-rose-600'}>
                          {progressToTarget}% tercapai
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            progressToTarget >= 100 ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${progressToTarget}%` }}
                        />
                      </div>
                    </div>

                    {/* DEFICIT ROW */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {isCompliant ? 'Status Capaian:' : 'Kurang Nominal Target:'}
                      </span>
                      {isCompliant ? (
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                          {s.surplusNominal > 0 ? `+${formatRupiah(s.surplusNominal)} (Surplus)` : 'Tepat Target'}
                        </span>
                      ) : (
                        <div className="text-right">
                          <span className="font-extrabold text-rose-600 dark:text-rose-400 text-xs block">
                            Kurang {formatRupiah(s.totalKekuranganNominal)}
                          </span>
                          <span className="text-[10px] text-rose-500 font-semibold">
                            Gap: {s.gapPersenLangsung}% langsung
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4 PILLARS MINI SUMMARY */}
                  <div className="mt-3 grid grid-cols-4 gap-1 text-center">
                    {/* Pegawai */}
                    <div className={`p-1.5 rounded-lg text-[10px] ${
                      !s.pegawai.hasPagu ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-400'
                      : s.pegawai.status === 'MEMENUHI'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/60'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-200/60'
                    }`}>
                      <span className="block text-[9px] text-slate-400">Peg</span>
                      {s.pegawai.hasPagu ? `${s.pegawai.persen}%` : '-'}
                    </div>

                    {/* Barang */}
                    <div className={`p-1.5 rounded-lg text-[10px] ${
                      !s.barang.hasPagu ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-400'
                      : s.barang.status === 'MEMENUHI'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/60'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-200/60'
                    }`}>
                      <span className="block text-[9px] text-slate-400">Bar</span>
                      {s.barang.hasPagu ? `${s.barang.persen}%` : '-'}
                    </div>

                    {/* Modal */}
                    <div className={`p-1.5 rounded-lg text-[10px] ${
                      !s.modal.hasPagu ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-400'
                      : s.modal.status === 'MEMENUHI'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/60'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-200/60'
                    }`}>
                      <span className="block text-[9px] text-slate-400">Mod</span>
                      {s.modal.hasPagu ? `${s.modal.persen}%` : '-'}
                    </div>

                    {/* Bansos */}
                    <div className={`p-1.5 rounded-lg text-[10px] ${
                      !s.bansos.hasPagu ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-400'
                      : s.bansos.status === 'MEMENUHI'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/60'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-200/60'
                    }`}>
                      <span className="block text-[9px] text-slate-400">Ban</span>
                      {s.bansos.hasPagu ? `${s.bansos.persen}%` : '-'}
                    </div>
                  </div>
                </div>

                {/* BOTTOM ACTION TOOLBAR */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCalculator(s.id);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-xs"
                    title="Buka kalkulator target & simulasi SPM satker ini"
                  >
                    <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Hitung Target</span>
                  </button>

                  <button
                    onClick={(e) => handleCopyWa(s, e)}
                    className={`p-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      hasCopied
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                    title="Salin pesan WA kebutuhan target satker"
                  >
                    {hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onSelectSatker(s)}
                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    title="Lihat rincian lengkap DIPA satker"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
