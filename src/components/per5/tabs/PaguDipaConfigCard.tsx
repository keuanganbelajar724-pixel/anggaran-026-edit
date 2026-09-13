import React, { useState, useEffect } from 'react';
import {
  Coins,
  Percent,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  Calculator,
  BookOpen,
  Info
} from 'lucide-react';
import { SimulationProject, DeviasiHalIIIInput, DeviasiHal3Row } from '../../../models/ikpa';
import { round2, calculateBudgetProportion, DEFAULT_WORKBOOK_PROPORTIONS } from '../../../calculations/deviasiHalIII';
import { formatRupiah } from '../../../utils/excelReferenceDataHelper';

export const getQuarterForPeriod = (periode: string): 1 | 2 | 3 | 4 => {
  const p = parseInt(periode, 10);
  if (p >= 1 && p <= 3) return 1;
  if (p >= 4 && p <= 6) return 2;
  if (p >= 7 && p <= 9) return 3;
  return 4;
};

export const getQuarterMonths = (quarter: 1 | 2 | 3 | 4): string[] => {
  switch (quarter) {
    case 1: return ['01', '02', '03'];
    case 2: return ['04', '05', '06'];
    case 3: return ['07', '08', '09'];
    case 4: return ['10', '11', '12'];
  }
};

export const QUARTER_LABELS: Record<1 | 2 | 3 | 4, { title: string; subtitle: string; monthsLabel: string }> = {
  1: { title: 'Triwulan I', subtitle: 'Cut-off TW I (Akhir Maret)', monthsLabel: 'Bulan 01, 02, 03' },
  2: { title: 'Triwulan II', subtitle: 'Cut-off TW II (Akhir Juni)', monthsLabel: 'Bulan 04, 05, 06' },
  3: { title: 'Triwulan III', subtitle: 'Cut-off TW III (Akhir September)', monthsLabel: 'Bulan 07, 08, 09' },
  4: { title: 'Triwulan IV', subtitle: 'Cut-off TW IV (Akhir Desember)', monthsLabel: 'Bulan 10, 11, 12' },
};

interface QuarterDataState {
  mode: 'percent' | 'nominal';
  pagu51: string;
  pagu52: string;
  pagu53: string;
  pagu57: string;
  prop51: string;
  prop52: string;
  prop53: string;
  prop57: string;
}

interface PaguDipaConfigCardProps {
  project: SimulationProject;
  rows: DeviasiHal3Row[];
  rawInputs: DeviasiHalIIIInput[];
  onApplyQuarterProportions: (
    quarter: 1 | 2 | 3 | 4,
    p51: number,
    p52: number,
    p53: number,
    p57: number,
    nominals?: { pagu51: number; pagu52: number; pagu53: number; pagu57: number }
  ) => void;
  onApplyProportionsToAll: (
    p51: number,
    p52: number,
    p53: number,
    p57: number,
    nominals?: { pagu51: number; pagu52: number; pagu53: number; pagu57: number }
  ) => void;
  onApplyOmSpanPreset247161: () => void;
  onOpenLogicModal: () => void;
  isDark?: boolean;
}

export const PaguDipaConfigCard: React.FC<PaguDipaConfigCardProps> = ({
  rows,
  rawInputs,
  onApplyQuarterProportions,
  onApplyProportionsToAll,
  onApplyOmSpanPreset247161,
  onOpenLogicModal,
  isDark = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showQuarterGuide, setShowQuarterGuide] = useState<boolean>(false);
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(1);
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  // Inisialisasi data tiap triwulan dari data rawInputs yang ada
  const getQuarterValuesFromInputs = (q: 1 | 2 | 3 | 4): QuarterDataState => {
    const months = getQuarterMonths(q);
    const found = rawInputs.find(r => months.includes(r.periode));
    
    // Default fallback proporsi
    const def51 = DEFAULT_WORKBOOK_PROPORTIONS[51];
    const def52 = DEFAULT_WORKBOOK_PROPORTIONS[52];
    const def53 = DEFAULT_WORKBOOK_PROPORTIONS[53];
    const def57 = DEFAULT_WORKBOOK_PROPORTIONS[57];

    if (found) {
      const p51 = found.pagu51 || 0;
      const p52 = found.pagu52 || 0;
      const p53 = found.pagu53 || 0;
      const p57 = found.pagu57 || 0;
      const hasNominals = (p51 + p52 + p53 + p57) > 0;

      return {
        mode: hasNominals ? 'nominal' : 'percent',
        pagu51: p51 > 0 ? formatRupiah(p51) : '0',
        pagu52: p52 > 0 ? formatRupiah(p52) : '0',
        pagu53: p53 > 0 ? formatRupiah(p53) : '0',
        pagu57: p57 > 0 ? formatRupiah(p57) : '0',
        prop51: found.proporsi51 !== undefined ? String(found.proporsi51) : String(def51),
        prop52: found.proporsi52 !== undefined ? String(found.proporsi52) : String(def52),
        prop53: found.proporsi53 !== undefined ? String(found.proporsi53) : String(def53),
        prop57: found.proporsi57 !== undefined ? String(found.proporsi57) : String(def57),
      };
    }

    // Jika belum ada di TW ini, coba cek dari TW sebelumnya
    if (q > 1) {
      for (let prevQ = q - 1; prevQ >= 1; prevQ--) {
        const prevMonths = getQuarterMonths(prevQ as 1 | 2 | 3 | 4);
        const prevFound = rawInputs.find(r => prevMonths.includes(r.periode));
        if (prevFound) {
          const p51 = prevFound.pagu51 || 0;
          const p52 = prevFound.pagu52 || 0;
          const p53 = prevFound.pagu53 || 0;
          const p57 = prevFound.pagu57 || 0;
          const hasNom = (p51 + p52 + p53 + p57) > 0;
          return {
            mode: hasNom ? 'nominal' : 'percent',
            pagu51: p51 > 0 ? formatRupiah(p51) : '0',
            pagu52: p52 > 0 ? formatRupiah(p52) : '0',
            pagu53: p53 > 0 ? formatRupiah(p53) : '0',
            pagu57: p57 > 0 ? formatRupiah(p57) : '0',
            prop51: prevFound.proporsi51 !== undefined ? String(prevFound.proporsi51) : String(def51),
            prop52: prevFound.proporsi52 !== undefined ? String(prevFound.proporsi52) : String(def52),
            prop53: prevFound.proporsi53 !== undefined ? String(prevFound.proporsi53) : String(def53),
            prop57: prevFound.proporsi57 !== undefined ? String(prevFound.proporsi57) : String(def57),
          };
        }
      }
    }

    return {
      mode: 'percent',
      pagu51: '0',
      pagu52: '0',
      pagu53: '0',
      pagu57: '0',
      prop51: String(def51),
      prop52: String(def52),
      prop53: String(def53),
      prop57: String(def57),
    };
  };

  const [quartersData, setQuartersData] = useState<Record<1 | 2 | 3 | 4, QuarterDataState>>({
    1: getQuarterValuesFromInputs(1),
    2: getQuarterValuesFromInputs(2),
    3: getQuarterValuesFromInputs(3),
    4: getQuarterValuesFromInputs(4),
  });

  // Sinkronkan saat rawInputs berubah dari luar
  useEffect(() => {
    setQuartersData({
      1: getQuarterValuesFromInputs(1),
      2: getQuarterValuesFromInputs(2),
      3: getQuarterValuesFromInputs(3),
      4: getQuarterValuesFromInputs(4),
    });
  }, [rawInputs]);

  const currentQData = quartersData[selectedQuarter];

  // Helper parser
  const parseNum = (str: string) => Number(str.replace(/\D/g, '')) || 0;
  const num51 = parseNum(currentQData.pagu51);
  const num52 = parseNum(currentQData.pagu52);
  const num53 = parseNum(currentQData.pagu53);
  const num57 = parseNum(currentQData.pagu57);
  const totalNominal = num51 + num52 + num53 + num57;

  // Hitung proporsi otomatis jika di mode nominal
  const derivedProp = calculateBudgetProportion(num51, num52, num53, num57);

  // Persen proporsi aktif saat ini
  const nProp51 = parseFloat(currentQData.prop51.replace(',', '.')) || 0;
  const nProp52 = parseFloat(currentQData.prop52.replace(',', '.')) || 0;
  const nProp53 = parseFloat(currentQData.prop53.replace(',', '.')) || 0;
  const nProp57 = parseFloat(currentQData.prop57.replace(',', '.')) || 0;
  const totalPercent = round2(nProp51 + nProp52 + nProp53 + nProp57);

  // Perhitungan Akumulasi Rencana Penarikan Dana Triwulanan (Kolom B:E di Tabel)
  const quarterMonths = getQuarterMonths(selectedQuarter);
  const rowsInSelectedQuarter = rawInputs.filter(r => quarterMonths.includes(r.periode));
  const sumRencana51 = rowsInSelectedQuarter.reduce((acc, r) => acc + (r.rencana51 || 0), 0);
  const sumRencana52 = rowsInSelectedQuarter.reduce((acc, r) => acc + (r.rencana52 || 0), 0);
  const sumRencana53 = rowsInSelectedQuarter.reduce((acc, r) => acc + (r.rencana53 || 0), 0);
  const sumRencana57 = rowsInSelectedQuarter.reduce((acc, r) => acc + (r.rencana57 || 0), 0);
  const totalRencanaSelectedQuarter = sumRencana51 + sumRencana52 + sumRencana53 + sumRencana57;

  // Persentase proporsi jika dihitung dari Rencana Belanja Triwulan ini
  const planProp51 = totalRencanaSelectedQuarter > 0 ? round2((sumRencana51 / totalRencanaSelectedQuarter) * 100) : 0;
  const planProp52 = totalRencanaSelectedQuarter > 0 ? round2((sumRencana52 / totalRencanaSelectedQuarter) * 100) : 0;
  const planProp53 = totalRencanaSelectedQuarter > 0 ? round2((sumRencana53 / totalRencanaSelectedQuarter) * 100) : 0;
  const planProp57 = totalRencanaSelectedQuarter > 0 ? round2(Math.max(0, 100 - (planProp51 + planProp52 + planProp53))) : 0;

  const handleApplyFromQuarterPlan = () => {
    if (totalRencanaSelectedQuarter === 0) {
      alert(`Belum ada data nominal Rencana Belanja (Kolom B:E) yang diisi pada baris ${QUARTER_LABELS[selectedQuarter].monthsLabel}. Silakan lengkapi rencana penarikan dana di tabel terlebih dahulu.`);
      return;
    }
    updateCurrentQuarter({
      mode: 'percent',
      prop51: String(planProp51),
      prop52: String(planProp52),
      prop53: String(planProp53),
      prop57: String(planProp57),
    });
    triggerFeedback(`Berhasil menghitung proporsi dari total rencana belanja ${QUARTER_LABELS[selectedQuarter].title}: 51=${planProp51}%, 52=${planProp52}%, 53=${planProp53}%, 57=${planProp57}%. Klik 'Terapkan ke ${QUARTER_LABELS[selectedQuarter].title}' untuk memperbarui tabel.`);
  };

  const updateCurrentQuarter = (patch: Partial<QuarterDataState>) => {
    setQuartersData(prev => ({
      ...prev,
      [selectedQuarter]: {
        ...prev[selectedQuarter],
        ...patch
      }
    }));
  };

  const handleNominalChange = (field: 'pagu51' | 'pagu52' | 'pagu53' | 'pagu57', rawVal: string) => {
    const clean = rawVal.replace(/\D/g, '');
    const num = clean === '' ? 0 : Number(clean);
    updateCurrentQuarter({
      [field]: clean === '' ? '' : formatRupiah(num)
    });
  };

  const triggerFeedback = (msg: string) => {
    setAppliedFeedback(msg);
    setTimeout(() => setAppliedFeedback(null), 3500);
  };

  // Terapkan ke Triwulan Aktif
  const handleApplyToCurrentQuarter = () => {
    let final51 = nProp51;
    let final52 = nProp52;
    let final53 = nProp53;
    let final57 = nProp57;
    let nominals = undefined;

    if (currentQData.mode === 'nominal') {
      if (totalNominal === 0) {
        alert('Total nominal pagu triwulan masih 0. Masukkan minimal satu nilai pagu.');
        return;
      }
      final51 = derivedProp.proporsi51;
      final52 = derivedProp.proporsi52;
      final53 = derivedProp.proporsi53;
      final57 = derivedProp.proporsi57;
      nominals = {
        pagu51: num51,
        pagu52: num52,
        pagu53: num53,
        pagu57: num57
      };
      updateCurrentQuarter({
        prop51: String(final51),
        prop52: String(final52),
        prop53: String(final53),
        prop57: String(final57),
      });
    }

    onApplyQuarterProportions(selectedQuarter, final51, final52, final53, final57, nominals);
    triggerFeedback(`Proporsi pagu berhasil diterapkan ke ${QUARTER_LABELS[selectedQuarter].title} (${QUARTER_LABELS[selectedQuarter].monthsLabel})!`);
  };

  // Terapkan ke Semua Triwulan (TW I - IV)
  const handleApplyToAllQuarters = () => {
    let final51 = nProp51;
    let final52 = nProp52;
    let final53 = nProp53;
    let final57 = nProp57;
    let nominals = undefined;

    if (currentQData.mode === 'nominal') {
      if (totalNominal === 0) {
        alert('Total nominal pagu masih 0. Masukkan minimal satu nilai pagu.');
        return;
      }
      final51 = derivedProp.proporsi51;
      final52 = derivedProp.proporsi52;
      final53 = derivedProp.proporsi53;
      final57 = derivedProp.proporsi57;
      nominals = {
        pagu51: num51,
        pagu52: num52,
        pagu53: num53,
        pagu57: num57
      };
    }

    // Update semua state internal
    const replicatedQuarter: QuarterDataState = {
      mode: currentQData.mode,
      pagu51: currentQData.pagu51,
      pagu52: currentQData.pagu52,
      pagu53: currentQData.pagu53,
      pagu57: currentQData.pagu57,
      prop51: String(final51),
      prop52: String(final52),
      prop53: String(final53),
      prop57: String(final57),
    };

    setQuartersData({
      1: { ...replicatedQuarter },
      2: { ...replicatedQuarter },
      3: { ...replicatedQuarter },
      4: { ...replicatedQuarter },
    });

    onApplyProportionsToAll(final51, final52, final53, final57, nominals);
    triggerFeedback('Proporsi pagu berhasil diterapkan serentak ke semua Triwulan (Bulan 01 s.d. 12)!');
  };

  // Salin dari Triwulan Sebelumnya
  const handleCopyFromPreviousQuarter = () => {
    if (selectedQuarter <= 1) return;
    const prevQ = (selectedQuarter - 1) as 1 | 2 | 3 | 4;
    const prevData = quartersData[prevQ];
    updateCurrentQuarter({
      mode: prevData.mode,
      pagu51: prevData.pagu51,
      pagu52: prevData.pagu52,
      pagu53: prevData.pagu53,
      pagu57: prevData.pagu57,
      prop51: prevData.prop51,
      prop52: prevData.prop52,
      prop53: prevData.prop53,
      prop57: prevData.prop57,
    });
    triggerFeedback(`Data dari ${QUARTER_LABELS[prevQ].title} berhasil disalin ke ${QUARTER_LABELS[selectedQuarter].title}. Silakan sesuaikan akun belanja yang berubah.`);
  };

  return (
    <div
      className={`rounded-2xl border transition-all shadow-xs ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Header Card */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Pengaturan Pagu DIPA & Bobot Proporsi per Triwulan (Cut-Off TW I s.d. IV)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono">
                Cut-Off Triwulanan
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Revisi DIPA Hal III dilakukan per triwulan. Anda dapat mengatur komposisi pagu berbeda tiap triwulan atau menyamakan sepanjang tahun.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Panduan Pengisian Tiap Triwulan */}
          <button
            onClick={() => setShowQuarterGuide(!showQuarterGuide)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
              showQuarterGuide
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            title="Panduan langkah demi langkah cara mengisi proporsi tiap triwulan agar tidak salah"
          >
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Panduan Pengisian Tiap TW
          </button>

          {/* Tombol Pentung Edukasi Logika Rumus */}
          <button
            onClick={onOpenLogicModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold transition-colors cursor-pointer"
            title="Penjelasan logika OM-SPAN & kenapa proporsi pagu berbeda antar satker"
          >
            <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Kenapa Berbeda? (Logika Rumus)
          </button>

          {/* Toggle Expand / Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle Expand Card"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body Card */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Feedback Banner */}
          {appliedFeedback && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4" />
              {appliedFeedback}
            </div>
          )}

          {/* Panduan Pengisian Tiap Triwulan */}
          {showQuarterGuide && (
            <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-white dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900 shadow-sm animate-fade-in space-y-4 text-xs">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-indigo-100 dark:border-indigo-800/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-indigo-950 dark:text-indigo-200">
                      Panduan Lengkap: Cara Pengisian Proporsi Pagu Tiap Triwulan Agar Tidak Salah
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Memahami asal persentase bobot proporsi dan alur kerja cut-off per triwulan di OM-SPAN
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuarterGuide(false)}
                  className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold cursor-pointer"
                >
                  Tutup Panduan ✕
                </button>
              </div>

              {/* 3 Kotak Inti Penjelasan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Asal Usul Angka */}
                <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-indigo-100 dark:border-indigo-800/40 space-y-1.5">
                  <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">1</span>
                    Dari Mana Asal Angka % Ini?
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    Persentase Kolom R:U adalah <strong>Bobot Penimbang (Weight)</strong>. Angka ini berasal dari <strong>Total Rencana Belanja Jenis Tertentu di Triwulan tersebut</strong> dibagi <strong>Total Seluruh Rencana Belanja Triwulan tersebut</strong> (atau komposisi Pagu DIPA).
                  </p>
                  <div className="p-1.5 rounded bg-indigo-50/60 dark:bg-indigo-950/40 text-[10px] font-mono text-indigo-900 dark:text-indigo-300 border border-indigo-200/50">
                    % Proporsi 51 = (Rencana 51 TW ÷ Total Rencana TW) × 100%
                  </div>
                </div>

                {/* 2. Mengapa Per Triwulan? */}
                <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-indigo-100 dark:border-indigo-800/40 space-y-1.5">
                  <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-black">2</span>
                    Mengapa Harus per Triwulan?
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    Sesuai Perdirjen Perbendaharaan, pemutakhiran RPD Halaman III DIPA dilakukan paling lambat hari kerja ke-10 awal triwulan (cut-off). Oleh karena itu, OM-SPAN mengunci proporsi yang <strong>seragam untuk 3 bulan dalam 1 triwulan</strong>, namun bisa berubah di triwulan berikutnya bila ada revisi.
                  </p>
                </div>

                {/* 3. Aturan Emas 100% */}
                <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-indigo-100 dark:border-indigo-800/40 space-y-1.5">
                  <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">3</span>
                    Aturan Wajib: Total Harus 100%
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    Jumlah total proporsi <strong>(51 + 52 + 53 + 57) wajib tepat 100,00%</strong>. Karena deviasi tertimbang bulanan dihitung dari: <em>% Deviasi × % Proporsi</em>. Jika total proporsi di bawah 100%, nilai IKPA akan terdistorsi (bias).
                  </p>
                </div>
              </div>

              {/* Alur Kerja Pengisian Praktis */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 space-y-2">
                <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5 text-xs">
                  <Info className="w-4 h-4 text-indigo-600" />
                  Alur Praktis Pengisian Tiap Triwulan di Aplikasi Ini:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <div className="font-black text-purple-700 dark:text-purple-300">Langkah 1: TW I (Bln 01-03)</div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Pilih tab TW I. Isi Rencana B:E di tabel, lalu klik tombol <strong>"Gunakan Proporsi Rencana TW Ini"</strong> atau ketik langsung angka dari OM-SPAN. Klik <strong>"Terapkan ke Triwulan I"</strong>.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <div className="font-black text-purple-700 dark:text-purple-300">Langkah 2: TW II (Bln 04-06)</div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Pilih tab TW II. Jika ada revisi cut-off TW II, hitung ulang proporsi rencana TW II. Jika komposisi pagu/rencana tidak berubah, cukup klik <strong>"Salin dari TW 1"</strong> lalu terapkan.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <div className="font-black text-purple-700 dark:text-purple-300">Langkah 3: TW III (Bln 07-09)</div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Pilih tab TW III. Sesuaikan jika ada revisi cut-off TW III (Juli), atau klik <strong>"Salin dari TW 2"</strong> bila komposisi rencana belanja tetap. Klik terapkan ke TW III.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <div className="font-black text-purple-700 dark:text-purple-300">Langkah 4: TW IV (Bln 10-12)</div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Pilih tab TW IV. Sesuaikan jika ada revisi batas akhir triwulan III (Oktober), atau klik <strong>"Salin dari TW 3"</strong>. Klik terapkan ke TW IV.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 1. Selector Tab 4 Triwulan */}
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {([1, 2, 3, 4] as const).map(q => {
                const qInfo = QUARTER_LABELS[q];
                const qD = quartersData[q];
                const isActive = selectedQuarter === q;
                
                // Parse proporsi untuk ditampilkan di badge
                const p51Val = qD.mode === 'nominal' ? calculateBudgetProportion(parseNum(qD.pagu51), parseNum(qD.pagu52), parseNum(qD.pagu53), parseNum(qD.pagu57)).proporsi51 : parseFloat(qD.prop51.replace(',', '.')) || 0;
                const p52Val = qD.mode === 'nominal' ? calculateBudgetProportion(parseNum(qD.pagu51), parseNum(qD.pagu52), parseNum(qD.pagu53), parseNum(qD.pagu57)).proporsi52 : parseFloat(qD.prop52.replace(',', '.')) || 0;
                const p53Val = qD.mode === 'nominal' ? calculateBudgetProportion(parseNum(qD.pagu51), parseNum(qD.pagu52), parseNum(qD.pagu53), parseNum(qD.pagu57)).proporsi53 : parseFloat(qD.prop53.replace(',', '.')) || 0;
                const p57Val = qD.mode === 'nominal' ? calculateBudgetProportion(parseNum(qD.pagu51), parseNum(qD.pagu52), parseNum(qD.pagu53), parseNum(qD.pagu57)).proporsi57 : parseFloat(qD.prop57.replace(',', '.')) || 0;

                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSelectedQuarter(q)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 ring-2 ring-purple-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-xs font-black ${isActive ? 'text-purple-900 dark:text-purple-200' : 'text-slate-800 dark:text-slate-200'}`}>
                        {qInfo.title}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        TW {q}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                      {qInfo.monthsLabel}
                    </p>
                    <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-800/80 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                      <div className="flex justify-between">
                        <span>51: {p51Val.toFixed(2)}%</span>
                        <span>52: {p52Val.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>53: {p53Val.toFixed(2)}%</span>
                        <span>57: {p57Val.toFixed(2)}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Sub-Header Triwulan Terpilih & Switch Mode */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                    {QUARTER_LABELS[selectedQuarter].title} — {QUARTER_LABELS[selectedQuarter].subtitle}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Berlaku untuk baris periode: <span className="font-bold text-slate-700 dark:text-slate-300">{QUARTER_LABELS[selectedQuarter].monthsLabel}</span>
                  </p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="inline-flex rounded-xl p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 self-start">
                <button
                  type="button"
                  onClick={() => updateCurrentQuarter({ mode: 'percent' })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentQData.mode === 'percent'
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5 text-purple-600" />
                  Input % Proporsi Langsung
                </button>
                <button
                  type="button"
                  onClick={() => updateCurrentQuarter({ mode: 'nominal' })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentQData.mode === 'nominal'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  Input Nominal Pagu DIPA (Rp)
                </button>
              </div>
            </div>

            {/* Fitur Hitung Otomatis dari Rencana Triwulan (Kolom B:E) */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                totalRencanaSelectedQuarter > 0
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50'
                  : 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${totalRencanaSelectedQuarter > 0 ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                      Rencana Penarikan Dana {QUARTER_LABELS[selectedQuarter].title} ({QUARTER_LABELS[selectedQuarter].monthsLabel}):
                    </span>
                  </div>
                  {totalRencanaSelectedQuarter > 0 ? (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                      <span>Total: <strong>Rp {formatRupiah(totalRencanaSelectedQuarter)}</strong></span>
                      <span className="text-indigo-700 dark:text-indigo-300 font-bold">| 51: {formatRupiah(sumRencana51)} ({planProp51.toFixed(2)}%)</span>
                      <span className="text-indigo-700 dark:text-indigo-300 font-bold">| 52: {formatRupiah(sumRencana52)} ({planProp52.toFixed(2)}%)</span>
                      <span className="text-indigo-700 dark:text-indigo-300 font-bold">| 53: {formatRupiah(sumRencana53)} ({planProp53.toFixed(2)}%)</span>
                      <span className="text-indigo-700 dark:text-indigo-300 font-bold">| 57: {formatRupiah(sumRencana57)} ({planProp57.toFixed(2)}%)</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Belum ada nilai rencana belanja di Kolom B:E untuk bulan {QUARTER_LABELS[selectedQuarter].monthsLabel}. Anda bisa menginput rencana belanja di tabel terlebih dahulu atau mengisi langsung persen/nominal di bawah.
                    </p>
                  )}
                </div>

                {totalRencanaSelectedQuarter > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyFromQuarterPlan}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer self-start lg:self-center"
                    title="Gunakan persentase proporsi yang dihitung dari total rencana belanja triwulan ini"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    Gunakan Proporsi Rencana TW Ini
                  </button>
                )}
              </div>
            </div>

            {/* Form Input: Mode Persen Langsung */}
            {currentQData.mode === 'percent' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* 51 */}
                  <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/50 space-y-1">
                    <label className="text-[11px] font-bold text-purple-950 dark:text-purple-200 block">
                      % 51 Pegawai (Kolom R)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentQData.prop51}
                        onChange={e => updateCurrentQuarter({ prop51: e.target.value })}
                        placeholder="Contoh: 45.75"
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-purple-900 dark:text-purple-100 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      />
                      <span className="absolute right-2.5 top-1.5 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  {/* 52 */}
                  <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/50 space-y-1">
                    <label className="text-[11px] font-bold text-purple-950 dark:text-purple-200 block">
                      % 52 Barang (Kolom S)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentQData.prop52}
                        onChange={e => updateCurrentQuarter({ prop52: e.target.value })}
                        placeholder="Contoh: 41.98"
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-purple-900 dark:text-purple-100 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      />
                      <span className="absolute right-2.5 top-1.5 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  {/* 53 */}
                  <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/50 space-y-1">
                    <label className="text-[11px] font-bold text-purple-950 dark:text-purple-200 block">
                      % 53 Modal (Kolom T)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentQData.prop53}
                        onChange={e => updateCurrentQuarter({ prop53: e.target.value })}
                        placeholder="Contoh: 12.27"
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-purple-900 dark:text-purple-100 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      />
                      <span className="absolute right-2.5 top-1.5 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  {/* 57 */}
                  <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/50 space-y-1">
                    <label className="text-[11px] font-bold text-purple-950 dark:text-purple-200 block">
                      % 57 Bansos (Kolom U)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentQData.prop57}
                        onChange={e => updateCurrentQuarter({ prop57: e.target.value })}
                        placeholder="Contoh: 0.00"
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-purple-900 dark:text-purple-100 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      />
                      <span className="absolute right-2.5 top-1.5 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total Bobot Proporsi:</span>
                  <span
                    className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-md ${
                      Math.abs(totalPercent - 100) < 0.1
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {totalPercent.toFixed(2)}%
                  </span>
                  {Math.abs(totalPercent - 100) >= 0.1 && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Idealnya total proporsi 100,00%
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Form Input: Mode Nominal Pagu DIPA */}
            {currentQData.mode === 'nominal' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Pagu 51 */}
                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-amber-950 dark:text-amber-200">
                        Pagu 51 Pegawai (Rp)
                      </label>
                      <span className="text-[10px] font-bold font-mono text-purple-700 dark:text-purple-300">
                        {derivedProp.proporsi51.toFixed(2)}%
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="text"
                        value={currentQData.pagu51}
                        onChange={e => handleNominalChange('pagu51', e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Pagu 52 */}
                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-amber-950 dark:text-amber-200">
                        Pagu 52 Barang (Rp)
                      </label>
                      <span className="text-[10px] font-bold font-mono text-purple-700 dark:text-purple-300">
                        {derivedProp.proporsi52.toFixed(2)}%
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="text"
                        value={currentQData.pagu52}
                        onChange={e => handleNominalChange('pagu52', e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Pagu 53 */}
                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-amber-950 dark:text-amber-200">
                        Pagu 53 Modal (Rp)
                      </label>
                      <span className="text-[10px] font-bold font-mono text-purple-700 dark:text-purple-300">
                        {derivedProp.proporsi53.toFixed(2)}%
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="text"
                        value={currentQData.pagu53}
                        onChange={e => handleNominalChange('pagu53', e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Pagu 57 */}
                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-amber-950 dark:text-amber-200">
                        Pagu 57 Bansos (Rp)
                      </label>
                      <span className="text-[10px] font-bold font-mono text-purple-700 dark:text-purple-300">
                        {derivedProp.proporsi57.toFixed(2)}%
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="text"
                        value={currentQData.pagu57}
                        onChange={e => handleNominalChange('pagu57', e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-100/50 dark:bg-amber-950/30 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Total Pagu DIPA {QUARTER_LABELS[selectedQuarter].title}:</span>
                    <span className="font-mono font-black text-amber-900 dark:text-amber-200">
                      {formatRupiah(totalNominal)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Proporsi otomatis dihitung: <span className="font-mono font-bold text-purple-700 dark:text-purple-300">51: {derivedProp.proporsi51.toFixed(2)}% | 52: {derivedProp.proporsi52.toFixed(2)}% | 53: {derivedProp.proporsi53.toFixed(2)}% | 57: {derivedProp.proporsi57.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Tombol Terapkan ke Triwulan Terpilih */}
                <button
                  type="button"
                  onClick={handleApplyToCurrentQuarter}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  title={`Terapkan ke bulan-bulan di ${QUARTER_LABELS[selectedQuarter].title} (${QUARTER_LABELS[selectedQuarter].monthsLabel})`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Terapkan ke {QUARTER_LABELS[selectedQuarter].title} ({QUARTER_LABELS[selectedQuarter].monthsLabel})
                </button>

                {/* Tombol Terapkan ke Semua Triwulan */}
                <button
                  type="button"
                  onClick={handleApplyToAllQuarters}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold transition-colors cursor-pointer"
                  title="Gunakan jika pagu satker tetap sama sepanjang tahun tanpa perubahan antar triwulan"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Terapkan ke Semua Triwulan (TW I - IV)
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Salin dari Triwulan Sebelumnya jika Q > 1 */}
                {selectedQuarter > 1 && (
                  <button
                    type="button"
                    onClick={handleCopyFromPreviousQuarter}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
                    title={`Salin data dari ${QUARTER_LABELS[(selectedQuarter - 1) as 1 | 2 | 3 | 4].title}`}
                  >
                    Salin dari TW {selectedQuarter - 1}
                  </button>
                )}

                {/* Preset OM-SPAN Satker 247161 */}
                <button
                  type="button"
                  onClick={onApplyOmSpanPreset247161}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold transition-colors cursor-pointer"
                  title="Terapkan data contoh satker 247161 dari screenshot OM-SPAN (Proporsi: 45.75%, 41.98%, 12.27%)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Contoh OM-SPAN (Satker 247161)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
