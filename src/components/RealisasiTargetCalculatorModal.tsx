import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Target, 
  Percent, 
  Coins, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Search, 
  X, 
  Sliders, 
  Sparkles, 
  Share2, 
  FileText, 
  Building2, 
  TrendingUp, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { 
  EvaluatedSatkerRealisasi, 
  TriwulanKey, 
  TargetTriwulanRule, 
  formatRupiah, 
  formatRupiahCompact,
  SatkerBelanjaDetail
} from '../utils/targetTriwulanProcessor';

interface RealisasiTargetCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  satkers: EvaluatedSatkerRealisasi[];
  initialSatkerId?: string | null;
  triwulan: TriwulanKey;
  activeRule: TargetTriwulanRule;
  isDark?: boolean;
}

export const RealisasiTargetCalculatorModal: React.FC<RealisasiTargetCalculatorModalProps> = ({
  isOpen,
  onClose,
  satkers,
  initialSatkerId,
  triwulan,
  activeRule,
  isDark = false
}) => {
  // Tab: 'CALCULATOR' (single satker focus) or 'ALL_DEFICITS' (ranking of all satkers with deficits)
  const [activeTab, setActiveTab] = useState<'CALCULATOR' | 'ALL_DEFICITS'>('CALCULATOR');

  // Selected Satker ID
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (initialSatkerId && satkers.some(s => s.id === initialSatkerId)) {
      return initialSatkerId;
    }
    // Default to the first satker that has a deficit, or the first satker
    const firstDeficit = satkers.find(s => s.totalKekuranganNominal > 0);
    return firstDeficit ? firstDeficit.id : (satkers[0]?.id || '');
  });

  // Satker dropdown filter search
  const [satkerSearchQuery, setSatkerSearchQuery] = useState('');
  const [onlyShowDeficit, setOnlyShowDeficit] = useState(false);

  // SPM Simulator State
  const [simJenis, setSimJenis] = useState<'modal' | 'barang' | 'pegawai' | 'bansos'>('modal');
  const [simNominal, setSimNominal] = useState<string>('');

  // Copy notification state
  const [copied, setCopied] = useState(false);

  // Table search for Tab 2
  const [allDeficitsSearch, setAllDeficitsSearch] = useState('');

  // Synchronize when initialSatkerId changes
  React.useEffect(() => {
    if (initialSatkerId && satkers.some(s => s.id === initialSatkerId)) {
      setSelectedId(initialSatkerId);
      setActiveTab('CALCULATOR');
    }
  }, [initialSatkerId, satkers]);

  // Current evaluated satker
  const currentSatker = useMemo(() => {
    return satkers.find(s => s.id === selectedId) || satkers[0] || null;
  }, [satkers, selectedId]);

  // Filtered satkers for dropdown selector
  const dropdownSatkerList = useMemo(() => {
    return satkers.filter(s => {
      if (onlyShowDeficit && s.totalKekuranganNominal <= 0) return false;
      if (!satkerSearchQuery.trim()) return true;
      const q = satkerSearchQuery.toLowerCase();
      return (
        s.kodeSatker.toLowerCase().includes(q) ||
        s.namaSatker.toLowerCase().includes(q) ||
        (s.kementerianLembaga && s.kementerianLembaga.toLowerCase().includes(q))
      );
    });
  }, [satkers, onlyShowDeficit, satkerSearchQuery]);

  // Index of current satker in full list for prev/next
  const currentIndex = useMemo(() => {
    return satkers.findIndex(s => s.id === selectedId);
  }, [satkers, selectedId]);

  const handlePrevSatker = () => {
    if (currentIndex > 0) {
      setSelectedId(satkers[currentIndex - 1].id);
      setSimNominal('');
    }
  };

  const handleNextSatker = () => {
    if (currentIndex < satkers.length - 1) {
      setSelectedId(satkers[currentIndex + 1].id);
      setSimNominal('');
    }
  };

  // Calculate weighted target for current satker
  const satkerTargetMetrics = useMemo(() => {
    if (!currentSatker) return null;

    const p = currentSatker.pegawai;
    const b = currentSatker.barang;
    const m = currentSatker.modal;
    const s = currentSatker.bansos;

    const targetPegawaiRp = p.hasPagu ? Math.round((p.pagu * p.targetPersen) / 100) : 0;
    const targetBarangRp = b.hasPagu ? Math.round((b.pagu * b.targetPersen) / 100) : 0;
    const targetModalRp = m.hasPagu ? Math.round((m.pagu * m.targetPersen) / 100) : 0;
    const targetBansosRp = s.hasPagu ? Math.round((s.pagu * s.targetPersen) / 100) : 0;

    const totalTargetRp = targetPegawaiRp + targetBarangRp + targetModalRp + targetBansosRp;
    const weightedTargetPersen = currentSatker.totalPagu > 0 
      ? Number(((totalTargetRp / currentSatker.totalPagu) * 100).toFixed(2))
      : 0;

    const kekuranganNominal = currentSatker.totalKekuranganNominal;
    const isCompliant = currentSatker.overallStatus === 'SESUAI';
    const surplusRp = !isCompliant ? 0 : Math.max(0, currentSatker.totalRealisasi - totalTargetRp);

    return {
      totalTargetRp,
      weightedTargetPersen,
      targetPegawaiRp,
      targetBarangRp,
      targetModalRp,
      targetBansosRp,
      kekuranganNominal,
      isCompliant,
      surplusRp
    };
  }, [currentSatker]);

  // Simulation calculation
  const simulationResult = useMemo(() => {
    if (!currentSatker || !satkerTargetMetrics) return null;

    const nominalValue = parseFloat(simNominal.replace(/[^0-9]/g, '')) || 0;
    if (nominalValue <= 0) return null;

    const targetDetail: SatkerBelanjaDetail = currentSatker[simJenis];
    if (!targetDetail.hasPagu) return null;

    const newRealisasi = targetDetail.realisasi + nominalValue;
    const newPersen = targetDetail.pagu > 0 
      ? Number(((newRealisasi / targetDetail.pagu) * 100).toFixed(2))
      : 0;
    const targetNominal = Math.round((targetDetail.pagu * targetDetail.targetPersen) / 100);
    const newKekuranganRp = Math.max(0, targetNominal - newRealisasi);
    const isNowPass = newPersen >= targetDetail.targetPersen;

    // Total satker after simulation
    const newTotalRealisasi = currentSatker.totalRealisasi + nominalValue;
    const newTotalPersen = currentSatker.totalPagu > 0
      ? Number(((newTotalRealisasi / currentSatker.totalPagu) * 100).toFixed(2))
      : 0;

    return {
      nominalValue,
      simJenis,
      labelJenis: targetDetail.label,
      oldRealisasi: targetDetail.realisasi,
      oldPersen: targetDetail.persen,
      targetPersen: targetDetail.targetPersen,
      newRealisasi,
      newPersen,
      oldKekuranganRp: targetDetail.kekuranganNominal,
      newKekuranganRp,
      isNowPass,
      persenIncrease: Number((newPersen - targetDetail.persen).toFixed(2)),
      newTotalRealisasi,
      newTotalPersen
    };
  }, [currentSatker, satkerTargetMetrics, simJenis, simNominal]);

  // List of all satkers with deficit sorted from largest to smallest
  const allSatkersWithDeficit = useMemo(() => {
    return satkers
      .filter(s => {
        if (!allDeficitsSearch.trim()) return true;
        const q = allDeficitsSearch.toLowerCase();
        return (
          s.kodeSatker.toLowerCase().includes(q) ||
          s.namaSatker.toLowerCase().includes(q) ||
          (s.kementerianLembaga && s.kementerianLembaga.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.totalKekuranganNominal - a.totalKekuranganNominal);
  }, [satkers, allDeficitsSearch]);

  // Generate WhatsApp message for the current satker
  const waMessage = useMemo(() => {
    if (!currentSatker || !satkerTargetMetrics) return '';

    const p = currentSatker.pegawai;
    const b = currentSatker.barang;
    const m = currentSatker.modal;
    const s = currentSatker.bansos;

    let itemsText = '';
    if (p.hasPagu) {
      const pTargetRp = satkerTargetMetrics.targetPegawaiRp;
      const statusStr = p.status === 'MEMENUHI' ? '✅ Sesuai' : `❌ Kurang ${formatRupiah(p.kekuranganNominal)}`;
      itemsText += `• Belanja Pegawai : Target ${p.targetPersen}% (${formatRupiahCompact(pTargetRp)}) | Realisasi: ${p.persen}% | ${statusStr}\n`;
    }
    if (b.hasPagu) {
      const bTargetRp = satkerTargetMetrics.targetBarangRp;
      const statusStr = b.status === 'MEMENUHI' ? '✅ Sesuai' : `❌ Kurang ${formatRupiah(b.kekuranganNominal)}`;
      itemsText += `• Belanja Barang  : Target ${b.targetPersen}% (${formatRupiahCompact(bTargetRp)}) | Realisasi: ${b.persen}% | ${statusStr}\n`;
    }
    if (m.hasPagu) {
      const mTargetRp = satkerTargetMetrics.targetModalRp;
      const statusStr = m.status === 'MEMENUHI' ? '✅ Sesuai' : `❌ Kurang ${formatRupiah(m.kekuranganNominal)}`;
      itemsText += `• Belanja Modal   : Target ${m.targetPersen}% (${formatRupiahCompact(mTargetRp)}) | Realisasi: ${m.persen}% | ${statusStr}\n`;
    }
    if (s.hasPagu) {
      const sTargetRp = satkerTargetMetrics.targetBansosRp;
      const statusStr = s.status === 'MEMENUHI' ? '✅ Sesuai' : `❌ Kurang ${formatRupiah(s.kekuranganNominal)}`;
      itemsText += `• Belanja Bansos  : Target ${s.targetPersen}% (${formatRupiahCompact(sTargetRp)}) | Realisasi: ${s.persen}% | ${statusStr}\n`;
    }

    const deficitSummary = currentSatker.totalKekuranganNominal > 0
      ? `🚨 *TOTAL KEKURANGAN NOMINAL YANG WAJIB DIREALISASIKAN:* \n👉 *${formatRupiah(currentSatker.totalKekuranganNominal)}*`
      : `✅ *STATUS: TELAH MEMENUHI SELURUH TARGET TRIWULAN ${triwulan.toUpperCase()}!*`;

    return `*PEMBERITAHUAN KEBUTUHAN REALISASI ANGGARAN TRIWULAN ${triwulan.toUpperCase()}*
KPPN SEMARANG I

Yth. KPA / PPK / Bendahara Pengeluaran
*${currentSatker.namaSatker}* (Kode Satker: ${currentSatker.kodeSatker})
${currentSatker.kementerianLembaga || ''}

Berdasarkan Keputusan Direktur Jenderal Perbendaharaan mengenai Target Realisasi Anggaran ${triwulan}, berikut posisi capaian satker Anda:

📋 *TARGET RESMI PERSENTASE & NOMINAL:*
${itemsText}
📊 *RINGKASAN TOTAL DIPA:*
• Pagu Total       : ${formatRupiah(currentSatker.totalPagu)}
• Target Wajib     : ${satkerTargetMetrics.weightedTargetPersen}% (${formatRupiah(satkerTargetMetrics.totalTargetRp)})
• Realisasi Saat Ini: ${currentSatker.totalPersen}% (${formatRupiah(currentSatker.totalRealisasi)})

${deficitSummary}

${currentSatker.totalKekuranganNominal > 0 
  ? '⚠️ *Himbauan:* Mohon segera mempercepat pengajuan SPM (LS Kontraktual/UP/TUP/GUP) ke KPPN Semarang I sebelum batas akhir triwulan agar indikator kinerja pelaksanaan anggaran (IKPA) satker Anda tetap optimal.'
  : 'Terima kasih atas kerja sama dan kepatuhan dalam akselerasi penyerapan anggaran.'}

_Layanan KPPN Semarang I - Handal, Transparan, dan Bebas Biaya._`;
  }, [currentSatker, satkerTargetMetrics, triwulan]);

  const handleCopyWA = () => {
    navigator.clipboard.writeText(waMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-5xl rounded-3xl shadow-2xl border overflow-hidden max-h-[92vh] flex flex-col ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* TOP MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Tools Kebutuhan Target Satker
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
                  Target {triwulan} Langsung
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Hitung instan target persentase (%), nominal target DIPA (Rp), dan kekurangan nominal yang wajib direalisasikan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden sm:inline-flex p-1 rounded-xl border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setActiveTab('CALCULATOR')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'CALCULATOR'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Kalkulator Satker
              </button>
              <button
                onClick={() => setActiveTab('ALL_DEFICITS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'ALL_DEFICITS'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Daftar Kekurangan ({satkers.filter(s => s.totalKekuranganNominal > 0).length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MOBILE VIEW SWITCHER */}
        <div className="sm:hidden px-4 pt-3 flex border-b border-slate-100 dark:border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('CALCULATOR')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'CALCULATOR'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            Kalkulator Satker
          </button>
          <button
            onClick={() => setActiveTab('ALL_DEFICITS')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'ALL_DEFICITS'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            Daftar Kekurangan ({satkers.filter(s => s.totalKekuranganNominal > 0).length})
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'CALCULATOR' ? (
            <>
              {/* SATKER SELECTOR BAR */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                isDark ? 'bg-slate-850/90 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Satker Dropdown Search */}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-500" />
                      Pilih Satker:
                    </span>
                    <select
                      value={selectedId}
                      onChange={(e) => {
                        setSelectedId(e.target.value);
                        setSimNominal('');
                      }}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border outline-none truncate max-w-full ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-500' 
                          : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                      }`}
                    >
                      {dropdownSatkerList.map(s => {
                        const statusTag = s.overallStatus === 'SESUAI' ? '✅ Sesuai' : `❌ Kurang ${formatRupiahCompact(s.totalKekuranganNominal)}`;
                        return (
                          <option key={s.id} value={s.id}>
                            [{s.kodeSatker}] {s.namaSatker} ({statusTag})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Filter & Prev/Next Actions */}
                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={onlyShowDeficit}
                        onChange={(e) => setOnlyShowDeficit(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Hanya yang Belum Sesuai
                    </label>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={handlePrevSatker}
                        disabled={currentIndex <= 0}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Satker Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[11px] font-mono px-1.5 text-slate-400">
                        {currentIndex + 1}/{satkers.length}
                      </span>
                      <button
                        onClick={handleNextSatker}
                        disabled={currentIndex >= satkers.length - 1}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Satker Berikutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CURRENT SATKER HERO CARD */}
              {currentSatker && satkerTargetMetrics && (
                <div className="space-y-4">
                  {/* Satker Info Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-sm bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 px-2.5 py-0.5 rounded-lg border border-emerald-300/60">
                        {currentSatker.kodeSatker}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                        {currentSatker.namaSatker}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        currentSatker.paguCluster === 'JUMBO'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : currentSatker.paguCluster === 'BESAR'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : currentSatker.paguCluster === 'SEDANG'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {currentSatker.clusterLabel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-xs">
                      {currentSatker.kementerianLembaga}
                    </div>
                  </div>

                  {/* 4 CARDS: TARGET % LANGSUNG & NOMINAL KEKURANGAN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Card 1: Target Triwulan Langsung */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      isDark ? 'bg-slate-850/80 border-slate-800' : 'bg-emerald-50/50 border-emerald-200/80'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-emerald-600" />
                          Target {triwulan} DJPb
                        </span>
                        <span className="text-[10px] bg-emerald-200/70 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded font-bold">
                          Resmi
                        </span>
                      </div>
                      <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                        {satkerTargetMetrics.weightedTargetPersen}%
                      </div>
                      <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Target Pegawai:</span>
                          <span className="font-bold">{activeRule.pegawai}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Target Barang:</span>
                          <span className="font-bold">{activeRule.barang}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Target Modal:</span>
                          <span className="font-bold">{activeRule.modal}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Target Bansos:</span>
                          <span className="font-bold">{activeRule.bansos}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Nominal Target DIPA */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      isDark ? 'bg-slate-850/80 border-slate-800' : 'bg-sky-50/50 border-sky-200/80'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-semibold text-sky-800 dark:text-sky-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-sky-600" />
                          Target Nominal (Rp)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Pagu × Target
                        </span>
                      </div>
                      <div className="text-xl font-black text-sky-700 dark:text-sky-400 mt-1">
                        {formatRupiahCompact(satkerTargetMetrics.totalTargetRp)}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate" title={formatRupiah(satkerTargetMetrics.totalTargetRp)}>
                        {formatRupiah(satkerTargetMetrics.totalTargetRp)}
                      </div>
                      <div className="mt-3 pt-2 border-t border-sky-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 flex justify-between">
                        <span>Total Pagu DIPA:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {formatRupiahCompact(currentSatker.totalPagu)}
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Realisasi Saat Ini */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      isDark ? 'bg-slate-850/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          Realisasi Saat Ini
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          currentSatker.totalPersen >= satkerTargetMetrics.weightedTargetPersen
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {currentSatker.totalPersen}%
                        </span>
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                        {formatRupiahCompact(currentSatker.totalRealisasi)}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate" title={formatRupiah(currentSatker.totalRealisasi)}>
                        {formatRupiah(currentSatker.totalRealisasi)}
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 flex justify-between">
                        <span>Sisa Pagu DIPA:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {formatRupiahCompact(currentSatker.totalSisa)}
                        </span>
                      </div>
                    </div>

                    {/* Card 4: KURANG DARI NOMINAL TARGET (HIGHLIGHT EMAS / MERAH) */}
                    <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                      currentSatker.totalKekuranganNominal > 0
                        ? isDark
                          ? 'bg-rose-950/40 border-rose-800/80'
                          : 'bg-rose-50 border-rose-300 shadow-sm'
                        : isDark
                          ? 'bg-emerald-950/40 border-emerald-800/80'
                          : 'bg-emerald-50 border-emerald-300 shadow-sm'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className={`flex items-center gap-1.5 ${
                          currentSatker.totalKekuranganNominal > 0 
                            ? 'text-rose-800 dark:text-rose-300' 
                            : 'text-emerald-800 dark:text-emerald-300'
                        }`}>
                          {currentSatker.totalKekuranganNominal > 0 ? (
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                          {currentSatker.totalKekuranganNominal > 0 ? 'Kurang Dari Target' : 'Target Tercapai!'}
                        </span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                          currentSatker.totalKekuranganNominal > 0
                            ? 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100'
                            : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                        }`}>
                          {currentSatker.totalKekuranganNominal > 0 ? 'Defisit' : 'Surplus'}
                        </span>
                      </div>

                      {currentSatker.totalKekuranganNominal > 0 ? (
                        <>
                          <div className="text-xl font-black text-rose-700 dark:text-rose-300 mt-1">
                            {formatRupiahCompact(currentSatker.totalKekuranganNominal)}
                          </div>
                          <div className="text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5 truncate" title={formatRupiah(currentSatker.totalKekuranganNominal)}>
                            {formatRupiah(currentSatker.totalKekuranganNominal)}
                          </div>
                          <div className="mt-3 pt-2 border-t border-rose-200/60 dark:border-rose-900/60 text-[11px] text-rose-700 dark:text-rose-300 font-semibold flex items-center justify-between">
                            <span>Wajib Dicairkan Segera</span>
                            <span className="text-xs font-black">
                              {currentSatker.belumMemenuhiList.length} Belanja Tertinggal
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                            +{formatRupiahCompact(satkerTargetMetrics.surplusRp)}
                          </div>
                          <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                            Surplus {formatRupiah(satkerTargetMetrics.surplusRp)}
                          </div>
                          <div className="mt-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-between">
                            <span>Semua Target Terpenuhi</span>
                            <span className="text-xs font-black">100% Sesuai</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* BREAKDOWN TABEL 4 JENIS BELANJA (TARGET % vs KURANG RP) */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h4 className="text-xs sm:text-sm font-extrabold flex items-center gap-2">
                        <Coins className="w-4 h-4 text-emerald-500" />
                        Rincian 4 Jenis Belanja: Target Persentase & Kekurangan Nominal
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Evaluasi Per Jenis DIPA
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                            isDark ? 'bg-slate-850 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            <th className="py-2.5 px-3">Jenis Belanja</th>
                            <th className="py-2.5 px-3 text-right">Pagu DIPA</th>
                            <th className="py-2.5 px-3 text-center bg-emerald-500/5">
                              Target % Langsung
                            </th>
                            <th className="py-2.5 px-3 text-right bg-emerald-500/5">
                              Target Nominal (Rp)
                            </th>
                            <th className="py-2.5 px-3 text-right">Realisasi (Rp)</th>
                            <th className="py-2.5 px-2 text-center">Capaian (%)</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-right bg-rose-500/5 font-extrabold text-rose-600">
                              Kurang Berapa (Rp)
                            </th>
                            <th className="py-2.5 px-2 text-center">Aksi Simulasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {[
                            { key: 'pegawai' as const, detail: currentSatker.pegawai, targetNominal: satkerTargetMetrics.targetPegawaiRp },
                            { key: 'barang' as const, detail: currentSatker.barang, targetNominal: satkerTargetMetrics.targetBarangRp },
                            { key: 'modal' as const, detail: currentSatker.modal, targetNominal: satkerTargetMetrics.targetModalRp },
                            { key: 'bansos' as const, detail: currentSatker.bansos, targetNominal: satkerTargetMetrics.targetBansosRp },
                          ].map(({ key, detail, targetNominal }) => {
                            if (!detail.hasPagu) {
                              return (
                                <tr key={detail.label} className="text-slate-400 bg-slate-50/40 dark:bg-slate-900/30">
                                  <td className="py-2.5 px-3 font-semibold">{detail.label}</td>
                                  <td colSpan={7} className="py-2.5 px-3 text-center italic text-[11px]">
                                    Tidak ada alokasi pagu pada DIPA satker ini
                                  </td>
                                  <td className="py-2.5 px-2 text-center">-</td>
                                </tr>
                              );
                            }

                            const isPass = detail.status === 'MEMENUHI';
                            return (
                              <tr 
                                key={detail.label} 
                                className={`transition-colors ${
                                  !isPass ? 'bg-rose-50/20 dark:bg-rose-950/10' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                                }`}
                              >
                                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                                  {detail.label}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                                  {formatRupiahCompact(detail.pagu)}
                                </td>
                                <td className="py-2.5 px-3 text-center font-black bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                                  {detail.targetPersen}%
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold bg-emerald-500/5 text-emerald-800 dark:text-emerald-300">
                                  {formatRupiahCompact(targetNominal)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                                  {formatRupiahCompact(detail.realisasi)}
                                </td>
                                <td className="py-2.5 px-2 text-center font-black">
                                  <span className={`px-2 py-0.5 rounded text-[11px] ${
                                    isPass 
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}>
                                    {detail.persen}%
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isPass
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}>
                                    {isPass ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                    {isPass ? 'Memenuhi' : 'Belum'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-black bg-rose-500/5">
                                  {detail.kekuranganNominal > 0 ? (
                                    <div className="text-rose-600 dark:text-rose-400">
                                      {formatRupiah(detail.kekuranganNominal)}
                                      <div className="text-[10px] font-normal text-rose-500">
                                        kurang {Math.abs(detail.gapPersen)}% lagi
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                                      Tercapai (+{detail.gapPersen}%)
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  <button
                                    onClick={() => {
                                      setSimJenis(key);
                                      if (detail.kekuranganNominal > 0) {
                                        setSimNominal(detail.kekuranganNominal.toString());
                                      }
                                    }}
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 hover:text-emerald-800 transition-colors"
                                    title="Simulasikan pencairan jenis belanja ini"
                                  >
                                    Simulasikan
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SIMULATOR INTERAKTIF SPM PENCAIRAN */}
                  <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isDark ? 'bg-slate-850/90 border-slate-800' : 'bg-gradient-to-br from-emerald-50/60 to-sky-50/60 border-emerald-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          Simulasi Pencairan SPM Baru Satker
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Uji dampak pengajuan SPM baru: berapa persen realisasi akan naik dan apakah satker langsung memenuhi target triwulan.
                        </p>
                      </div>

                      {currentSatker.totalKekuranganNominal > 0 && (
                        <button
                          onClick={() => {
                            // Find which expense has highest deficit
                            const def = currentSatker.belumMemenuhiList[0];
                            if (def) {
                              const matchKey = def.jenis.includes('Modal') ? 'modal'
                                : def.jenis.includes('Barang') ? 'barang'
                                : def.jenis.includes('Pegawai') ? 'pegawai' : 'bansos';
                              setSimJenis(matchKey as any);
                              setSimNominal(def.kekuranganRp.toString());
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Isi Otomatis Kebutuhan Minimal
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Pilih Jenis Belanja */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          Jenis Belanja yang Dicairkan:
                        </label>
                        <select
                          value={simJenis}
                          onChange={(e) => setSimJenis(e.target.value as any)}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="modal" disabled={!currentSatker.modal.hasPagu}>
                            Belanja Modal {currentSatker.modal.hasPagu ? `(Target ${activeRule.modal}%)` : '(Tidak Ada Pagu)'}
                          </option>
                          <option value="barang" disabled={!currentSatker.barang.hasPagu}>
                            Belanja Barang {currentSatker.barang.hasPagu ? `(Target ${activeRule.barang}%)` : '(Tidak Ada Pagu)'}
                          </option>
                          <option value="pegawai" disabled={!currentSatker.pegawai.hasPagu}>
                            Belanja Pegawai {currentSatker.pegawai.hasPagu ? `(Target ${activeRule.pegawai}%)` : '(Tidak Ada Pagu)'}
                          </option>
                          <option value="bansos" disabled={!currentSatker.bansos.hasPagu}>
                            Belanja Bansos {currentSatker.bansos.hasPagu ? `(Target ${activeRule.bansos}%)` : '(Tidak Ada Pagu)'}
                          </option>
                        </select>
                      </div>

                      {/* Input Nominal SPM */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          Nominal Rencana SPM (Rp):
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Contoh: 500000000"
                            value={simNominal ? Number(simNominal.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              setSimNominal(raw);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border outline-none ${
                              isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          {simNominal && (
                            <button
                              onClick={() => setSimNominal('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {/* Quick Nominal Chips */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {[50_000_000, 100_000_000, 500_000_000, 1_000_000_000].map(val => (
                            <button
                              key={val}
                              onClick={() => setSimNominal(val.toString())}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 text-slate-600 dark:text-slate-300"
                            >
                              +{formatRupiahCompact(val)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hasil Simulasi Seketika */}
                      <div className={`p-3 rounded-xl border flex flex-col justify-center ${
                        simulationResult
                          ? simulationResult.isNowPass
                            ? 'bg-emerald-100/70 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                            : 'bg-amber-100/70 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                          : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                      }`}>
                        {simulationResult ? (
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between font-bold">
                              <span>Realisasi Baru:</span>
                              <span className="text-sm font-black font-mono">
                                {simulationResult.newPersen}% (+{simulationResult.persenIncrease}%)
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span>Nominal Realisasi:</span>
                              <span className="font-mono font-semibold">
                                {formatRupiahCompact(simulationResult.newRealisasi)}
                              </span>
                            </div>
                            <div className="pt-1.5 mt-1 border-t border-current/20 flex items-center justify-between">
                              <span className="font-bold">Status:</span>
                              {simulationResult.isNowPass ? (
                                <span className="inline-flex items-center gap-1 font-black text-emerald-700 dark:text-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  TARGET TERCAPAI!
                                </span>
                              ) : (
                                <span className="font-bold text-amber-800 dark:text-amber-300">
                                  Masih kurang {formatRupiahCompact(simulationResult.newKekuranganRp)}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-[11px] py-2">
                            Masukkan nominal SPM di sebelah kiri untuk melihat proyeksi capaian baru.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* WHATSAPP ACTION CARD */}
                  <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark ? 'bg-slate-850/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Format Salin WhatsApp Satker
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Siap kirim ke KPA / PPK / Bendahara satker untuk konfirmasi target persen dan kekurangan nominal.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleCopyWA}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        copied
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Teks Tersalin!' : 'Salin Pesan WhatsApp'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* TAB 2: DAFTAR SEMUA SATKER YANG MASIH KURANG DARI TARGET */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Peringkat Satker dengan Kekurangan Nominal Terbesar
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Daftar seluruh satker yang realisasinya belum memenuhi target Triwulan {triwulan}, diurutkan dari defisit nominal terbesar.
                  </p>
                </div>

                {/* Search in All Deficits */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari kode atau nama satker..."
                    value={allDeficitsSearch}
                    onChange={(e) => setAllDeficitsSearch(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className={`rounded-2xl border overflow-hidden shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="overflow-x-auto max-h-[55vh]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                        isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3">Satker & K/L</th>
                        <th className="py-2.5 px-3 text-right">Pagu DIPA</th>
                        <th className="py-2.5 px-3 text-center">Target (%)</th>
                        <th className="py-2.5 px-3 text-right">Target Nominal</th>
                        <th className="py-2.5 px-3 text-right">Realisasi Saat Ini</th>
                        <th className="py-2.5 px-3 text-right font-extrabold text-rose-600">Kurang Berapa (Rp)</th>
                        <th className="py-2.5 px-3">Belanja Tertinggal</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {allSatkersWithDeficit.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                            Tidak ada satker yang memiliki kekurangan target pada kriteria pencarian ini.
                          </td>
                        </tr>
                      ) : (
                        allSatkersWithDeficit.map((s, idx) => {
                          const targetNominal = Math.round(
                            (s.pegawai.hasPagu ? (s.pegawai.pagu * s.pegawai.targetPersen) / 100 : 0) +
                            (s.barang.hasPagu ? (s.barang.pagu * s.barang.targetPersen) / 100 : 0) +
                            (s.modal.hasPagu ? (s.modal.pagu * s.modal.targetPersen) / 100 : 0) +
                            (s.bansos.hasPagu ? (s.bansos.pagu * s.bansos.targetPersen) / 100 : 0)
                          );
                          const weightedTarget = s.totalPagu > 0 ? Number(((targetNominal / s.totalPagu) * 100).toFixed(1)) : 0;

                          return (
                            <tr 
                              key={s.id}
                              className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${
                                s.id === selectedId ? 'bg-emerald-50/30 dark:bg-emerald-950/20 font-semibold' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 max-w-[220px]">
                                <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {s.namaSatker}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                                  <span className="font-mono font-bold text-emerald-600">{s.kodeSatker}</span>
                                  <span>•</span>
                                  <span className="truncate">{s.clusterLabel}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                                {formatRupiahCompact(s.totalPagu)}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-emerald-700 dark:text-emerald-400">
                                {weightedTarget}%
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                                {formatRupiahCompact(targetNominal)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold">
                                <div>{formatRupiahCompact(s.totalRealisasi)}</div>
                                <div className="text-[10px] text-slate-400">{s.totalPersen}%</div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                {s.totalKekuranganNominal > 0 ? (
                                  formatRupiah(s.totalKekuranganNominal)
                                ) : (
                                  <span className="text-emerald-600 text-[11px]">Tercapai</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex flex-wrap gap-1 max-w-[180px]">
                                  {s.belumMemenuhiList.map(b => (
                                    <span key={b.jenis} className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                      {b.jenis.replace('Belanja ', '')}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedId(s.id);
                                    setActiveTab('CALCULATOR');
                                    setSimNominal('');
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
                                >
                                  Hitung
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-500" />
            <span>Target resmi mengacu pada aturan Triwulan {triwulan} Ditjen Perbendaharaan.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
