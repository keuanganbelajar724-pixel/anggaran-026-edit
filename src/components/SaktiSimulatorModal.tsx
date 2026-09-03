import React, { useState, useEffect } from 'react';
import { DiagnostikCaputROItem } from '../types';
import { 
  SAKTI_REFERENSI_LIST, 
  generateSaktiTemplateByRef, 
  diagnoseRO 
} from '../utils/diagnostikCaputProcessor';
import { 
  Sliders, 
  X, 
  Check, 
  Copy, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Cpu, 
  Info,
  ArrowRight,
  TrendingUp,
  Percent
} from 'lucide-react';

interface SaktiSimulatorModalProps {
  ro: DiagnostikCaputROItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyChanges?: (updatedRO: DiagnostikCaputROItem) => void;
  isDark?: boolean;
}

export const SaktiSimulatorModal: React.FC<SaktiSimulatorModalProps> = ({
  ro,
  isOpen,
  onClose,
  onApplyChanges,
  isDark = false
}) => {
  // Input parameters state
  const [tpcro, setTpcro] = useState<number>(100);
  const [pcro, setPcro] = useState<number>(0);
  const [tvro, setTvro] = useState<number>(1);
  const [rvro, setRvro] = useState<number>(0);
  const [pagu, setPagu] = useState<number>(100000000);
  const [realisasi, setRealisasi] = useState<number>(0);
  const [persenPpa, setPersenPpa] = useState<number>(0);
  const [selectedRef, setSelectedRef] = useState<string>('99');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Sync with initial RO data
  useEffect(() => {
    if (ro) {
      setTpcro(ro.targetProgres);
      setPcro(ro.realisasiProgres);
      setTvro(ro.volumeTarget || 1);
      setRvro(ro.volumeRealisasi || 0);
      setPagu(ro.paguAnggaran || 100000000);
      setRealisasi(ro.realisasiAnggaran || 0);
      setPersenPpa(ro.persenPenyerapan || 0);
      setSelectedRef(ro.selectedReferensiSakti || '99');
    }
  }, [ro]);

  if (!isOpen || !ro) return null;

  // Real-time recalculation using diagnoseRO engine
  const simulatedRO = diagnoseRO({
    id: ro.id,
    kodeSatker: ro.kodeSatker,
    namaSatker: ro.namaSatker,
    kodeProgram: ro.kodeProgram,
    namaProgram: ro.namaProgram,
    kodeKegiatan: ro.kodeKegiatan,
    namaKegiatan: ro.namaKegiatan,
    kodeKro: ro.kodeKro,
    namaKro: ro.namaKro,
    kodeRo: ro.kodeRo,
    namaRo: ro.namaRo,
    volumeTarget: tvro,
    volumeRealisasi: rvro,
    targetProgres: tpcro,
    realisasiProgres: pcro,
    paguAnggaran: pagu,
    realisasiAnggaran: realisasi,
    persenPenyerapan: persenPpa,
    selectedRefCode: selectedRef
  });

  // Generate dynamic narrative
  const narrative = generateSaktiTemplateByRef(selectedRef, {
    kodeRo: ro.kodeRo,
    namaRo: ro.namaRo,
    pcro: pcro,
    tpcro: tpcro,
    ppa: persenPpa,
    rvro: rvro,
    tvro: tvro,
    nilaiZ: simulatedRO.nilaiKomponenRo
  });

  // Handle Preset Scenarios
  const applyPreset = (type: 'EFISIENSI' | 'MENDALUI_SPJ' | 'PERIODIK' | 'BAST_FINAL' | 'OPTIMAL_100') => {
    switch (type) {
      case 'EFISIENSI':
        setPcro(100);
        setTpcro(100);
        setRvro(tvro);
        setPersenPpa(82.5);
        setSelectedRef('01');
        break;
      case 'MENDALUI_SPJ':
        setPcro(85);
        setTpcro(80);
        setRvro(Math.floor(tvro * 0.8));
        setPersenPpa(45);
        setSelectedRef('02');
        break;
      case 'PERIODIK':
        setPcro(30);
        setTpcro(60);
        setRvro(Math.floor(tvro * 0.3));
        setPersenPpa(65);
        setSelectedRef('05');
        break;
      case 'BAST_FINAL':
        setPcro(100);
        setTpcro(100);
        setRvro(0);
        setPersenPpa(90);
        setSelectedRef('07');
        break;
      case 'OPTIMAL_100':
        setPcro(100);
        setTpcro(100);
        setRvro(tvro);
        setPersenPpa(100);
        setSelectedRef('01');
        break;
    }
  };

  const handleCopyNarrative = () => {
    navigator.clipboard.writeText(narrative);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleApplyToRO = () => {
    if (onApplyChanges) {
      onApplyChanges({
        ...simulatedRO,
        selectedReferensiSakti: selectedRef,
        templateKeteranganSakti: narrative
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div 
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark 
            ? 'bg-slate-900 border-slate-700 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">
                  Simulasi &amp; Kalkulator SAKTI (What-If Analysis)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300">
                  {ro.kodeRo}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-lg mt-0.5">
                {ro.namaRo}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Quick Presets Bar */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Skenario Simulasi Cepat (Preset Juknis):</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => applyPreset('OPTIMAL_100')}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all cursor-pointer"
              >
                ✅ Target 100% Tercapai Penuh
              </button>
              <button
                onClick={() => applyPreset('EFISIENSI')}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-cyan-300 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all cursor-pointer"
              >
                💡 Ref 01: Efisiensi Belanja
              </button>
              <button
                onClick={() => applyPreset('MENDALUI_SPJ')}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all cursor-pointer"
              >
                📄 Ref 02: Fisik Mendahului SPJ
              </button>
              <button
                onClick={() => applyPreset('PERIODIK')}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-all cursor-pointer"
              >
                ⏳ Ref 05: Penilaian Periodik
              </button>
              <button
                onClick={() => applyPreset('BAST_FINAL')}
                className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all cursor-pointer"
              >
                📋 Ref 07: Menunggu BAST
              </button>
            </div>
          </div>

          {/* SIMULATION GAUGE & METRICS RESULT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Live Kolom Z Card */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
              simulatedRO.nilaiKomponenRo >= 100 
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' 
                : simulatedRO.nilaiKomponenRo >= 60 
                  ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' 
                  : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Nilai Caput (Kolom Z)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/80 dark:bg-slate-900/80 shadow-xs">
                  {simulatedRO.diagnosaSeverity}
                </span>
              </div>
              <div className="my-3 text-center">
                <div className={`text-4xl font-black ${
                  simulatedRO.nilaiKomponenRo >= 100 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : simulatedRO.nilaiKomponenRo >= 60 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {simulatedRO.nilaiKomponenRo.toFixed(2)}
                  <span className="text-sm font-semibold text-slate-400"> / 100</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Formula: (PCRO / TPCRO) × 100%
                </span>
              </div>
              <div className="pt-2 border-t border-current/10 text-[11px] flex justify-between font-mono">
                <span>Deviasi Target:</span>
                <strong className={simulatedRO.gapKinerja > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {simulatedRO.gapKinerja > 0 ? `-${simulatedRO.gapKinerja.toFixed(2)}%` : '+0.00%'}
                </strong>
              </div>
            </div>

            {/* SAKTI Validation Status Card */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
              simulatedRO.validasiSaktiStatus?.includes('Ditolak')
                ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                : simulatedRO.validasiSaktiCode !== '00'
                  ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">Validasi SAKTI 2026</span>
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/80">
                  Kode {simulatedRO.validasiSaktiCode}
                </span>
              </div>
              <div className="my-2 space-y-1">
                <strong className="block text-sm font-black leading-tight">
                  {simulatedRO.validasiSaktiStatus}
                </strong>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {simulatedRO.validasiSaktiCode === '00'
                    ? '✅ Seluruh variabel validasi SAKTI terpenuhi dengan baik.'
                    : simulatedRO.validasiSaktiStatus?.includes('Ditolak')
                      ? '🚨 Data ini akan ditolak oleh sistem SAKTI sebelum perbaikan dilakukan.'
                      : '⚠️ Berfungsi sebagai early warning; lengkapi Kode Referensi & Keterangan.'}
                </p>
              </div>
              <div className="pt-2 border-t border-current/10 text-[10px] font-mono">
                GAP PCRO - PPA: <strong>{simulatedRO.gapPpa > 0 ? `+${simulatedRO.gapPpa.toFixed(1)}%` : `${simulatedRO.gapPpa.toFixed(1)}%`}</strong>
              </div>
            </div>

            {/* Recommended Action Card */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rekomendasi Referensi</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300">
                  Ref {selectedRef}
                </span>
              </div>
              <div className="my-2 space-y-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                  {SAKTI_REFERENSI_LIST.find(r => r.kode === selectedRef)?.judul}
                </p>
                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                  {SAKTI_REFERENSI_LIST.find(r => r.kode === selectedRef)?.deskripsiJuknis}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-indigo-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
                <span>Status Siap Kirim SAKTI</span>
              </div>
            </div>
          </div>

          {/* SLIDERS & CONTROLS SECTION */}
          <div className={`p-5 rounded-2xl border space-y-5 ${
            isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50/70 border-slate-200'
          }`}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <span>Parameter Variabel SAKTI (Geser Slider untuk Simulasi):</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Kolom Q: Realisasi Progres (PCRO %) */}
              <div className="space-y-2 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between">
                  <label htmlFor="sim-pcro-slider" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kolom Q: Realisasi Progres (PCRO)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      id="sim-pcro-number"
                      aria-label="Realisasi Progres PCRO dalam persen"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={pcro}
                      onChange={(e) => setPcro(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-16 px-2 py-0.5 text-xs font-mono font-bold text-right rounded border bg-transparent"
                    />
                    <span className="text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
                <input
                  id="sim-pcro-slider"
                  aria-label="Geser Realisasi Progres PCRO"
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={pcro}
                  onChange={(e) => setPcro(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Kolom Y: Target Progres (TPCRO %) */}
              <div className="space-y-2 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between">
                  <label htmlFor="sim-tpcro-slider" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kolom Y: Target Progres (TPCRO)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      id="sim-tpcro-number"
                      aria-label="Target Progres TPCRO dalam persen"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={tpcro}
                      onChange={(e) => setTpcro(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-16 px-2 py-0.5 text-xs font-mono font-bold text-right rounded border bg-transparent"
                    />
                    <span className="text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
                <input
                  id="sim-tpcro-slider"
                  aria-label="Geser Target Progres TPCRO"
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={tpcro}
                  onChange={(e) => setTpcro(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Kolom P: Realisasi Volume (RVRO) */}
              <div className="space-y-2 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between">
                  <label htmlFor="sim-rvro-slider" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kolom P: Realisasi Volume (RVRO)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      id="sim-rvro-number"
                      aria-label="Realisasi Volume RVRO"
                      type="number"
                      min={0}
                      max={tvro * 2 || 100}
                      value={rvro}
                      onChange={(e) => setRvro(Math.max(0, Number(e.target.value)))}
                      className="w-16 px-2 py-0.5 text-xs font-mono font-bold text-right rounded border bg-transparent"
                    />
                    <span className="text-xs font-bold text-slate-400">vol</span>
                  </div>
                </div>
                <input
                  id="sim-rvro-slider"
                  aria-label="Geser Realisasi Volume RVRO"
                  type="range"
                  min={0}
                  max={Math.max(tvro, 10)}
                  step={1}
                  value={rvro}
                  onChange={(e) => setRvro(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0 vol</span>
                  <span>Target: {tvro} vol (Kolom X)</span>
                </div>
              </div>

              {/* Penyerapan Anggaran (PPA %) */}
              <div className="space-y-2 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between">
                  <label htmlFor="sim-ppa-slider" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Penyerapan Anggaran (PPA %)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      id="sim-ppa-number"
                      aria-label="Penyerapan Anggaran PPA dalam persen"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={persenPpa}
                      onChange={(e) => setPersenPpa(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-16 px-2 py-0.5 text-xs font-mono font-bold text-right rounded border bg-transparent"
                    />
                    <span className="text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
                <input
                  id="sim-ppa-slider"
                  aria-label="Geser Penyerapan Anggaran PPA"
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={persenPpa}
                  onChange={(e) => setPersenPpa(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Dropdown Referensi SAKTI */}
            <div className="space-y-1.5 pt-2">
              <label htmlFor="sim-ref-select" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilih Kode Referensi SAKTI untuk Simulasi Ini:
              </label>
              <select
                id="sim-ref-select"
                value={selectedRef}
                onChange={(e) => setSelectedRef(e.target.value)}
                className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none cursor-pointer ${
                  isDark 
                    ? 'bg-slate-900 border-indigo-900/80 text-cyan-300 focus:border-cyan-400' 
                    : 'bg-white border-indigo-200 text-indigo-900 focus:border-indigo-500'
                }`}
              >
                {SAKTI_REFERENSI_LIST.map(ref => (
                  <option key={ref.kode} value={ref.kode} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                    {ref.kode}) {ref.judul}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DYNAMIC SAKTI NARRATIVE PREVIEW */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Hasil Template Keterangan SAKTI Otomatis ({narrative.length} / 2.000 Karakter):</span>
              </span>
              <button
                onClick={handleCopyNarrative}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-cyan-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{isCopied ? 'Tersalin!' : 'Salin Narasi'}</span>
              </button>
            </div>

            <div className={`p-4 rounded-2xl border font-sans text-xs leading-relaxed ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              {narrative}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-xs text-slate-500">
            Nilai Simulasi Kolom Z: <strong className="font-mono text-indigo-600 dark:text-cyan-400">{simulatedRO.nilaiKomponenRo.toFixed(2)}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleApplyToRO}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Hasil Simulasi ke RO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
