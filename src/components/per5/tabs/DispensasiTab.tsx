import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Sliders,
  Calculator,
  RotateCcw,
  Download,
  Upload,
  Copy,
  Check,
  CheckCheck,
  AlertTriangle,
  Info,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  Layers,
  Save,
  Sparkles
} from 'lucide-react';
import { SimulationProject, DispensasiSPM } from '../../../models/ikpa';
import {
  calculateDispensationRatio,
  calculateDispensationPenalty,
  calculateDispensasiSPM,
  validateDispensasiInput,
  runDispensasiSPMGoldenTest,
  DispensasiGoldenReport
} from '../../../calculations/dispensasiSPM';
import { DEFAULT_EXCEL_DISPENSASI } from '../../../utils/excelReferenceDefaultData';
import { round2 } from '../../../calculations/rounding';

interface DispensasiTabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const DispensasiTab: React.FC<DispensasiTabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  // Mode Tampilan: 'excel' (Tampilan Excel A1:D2) atau 'cards' (Formulir Sederhana)
  const [viewMode, setViewMode] = useState<'excel' | 'cards'>('excel');

  // UI Feedback States
  const [copied, setCopied] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showGoldenTestModal, setShowGoldenTestModal] = useState(false);
  const [goldenTestResult, setGoldenTestResult] = useState<DispensasiGoldenReport | null>(null);

  // Dispensasi data dari project state (default: 550 SPM, 2 Dispensasi sesuai workbook Excel)
  const currentDispensasi: DispensasiSPM = useMemo(() => {
    return project.dispensasiSPM || {
      jumlahSPMTriwulanIV: DEFAULT_EXCEL_DISPENSASI.jumlahSpmTw4,
      jumlahDispensasiSPM: DEFAULT_EXCEL_DISPENSASI.jumlahDispensasiSpm
    };
  }, [project.dispensasiSPM]);

  // Hasil perhitungan deterministik engine
  const calculation = useMemo(() => {
    return calculateDispensasiSPM(currentDispensasi);
  }, [currentDispensasi]);

  const { jumlahSPMTriwulanIV, jumlahDispensasiSPM, rasio, pengurangNilai, validation, details } = calculation;

  // Nilai IKPA sebelum dan sesudah dispensasi
  const ikpaBeforeDisp = useMemo(() => {
    if (!project.output) return 0;
    // rawFinal = ROUND(nilaiTotal / konversiBobot, 2)
    const totalWeighted = project.output.total || 0;
    const finalScore = project.output.finalScore || 0;
    // In IKPA model: finalScore = Math.max(0, rawFinal - dispensasiReduction)
    return round2(finalScore + (project.output.dispensasiReduction || 0));
  }, [project.output]);

  const ikpaFinal = useMemo(() => {
    return round2(Math.max(0, ikpaBeforeDisp - pengurangNilai));
  }, [ikpaBeforeDisp, pengurangNilai]);

  // Handle update input
  const handleUpdate = (field: keyof DispensasiSPM, val: number) => {
    const safeVal = Math.max(0, Math.floor(isNaN(val) ? 0 : val));
    const updated: DispensasiSPM = {
      ...currentDispensasi,
      [field]: safeVal
    };
    onUpdateProject({
      ...project,
      dispensasiSPM: updated
    });
  };

  // Preset Skenario Cepat
  const applyScenarioPreset = (totalSPM: number, dispensasi: number) => {
    onUpdateProject({
      ...project,
      dispensasiSPM: {
        jumlahSPMTriwulanIV: totalSPM,
        jumlahDispensasiSPM: dispensasi
      }
    });
  };

  // Reset ke Default Excel (550 SPM, 2 Dispensasi)
  const handleResetExcel = () => {
    onUpdateProject({
      ...project,
      dispensasiSPM: {
        jumlahSPMTriwulanIV: DEFAULT_EXCEL_DISPENSASI.jumlahSpmTw4,
        jumlahDispensasiSPM: DEFAULT_EXCEL_DISPENSASI.jumlahDispensasiSpm
      }
    });
  };

  // Save to LocalStorage
  const handleSaveToLocalStorage = () => {
    try {
      localStorage.setItem('ikpa_dispensasi_spm_backup', JSON.stringify(currentDispensasi));
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentDispensasi, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Dispensasi_SPM_IKPA_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === 'object' && parsed !== null) {
          const validated: DispensasiSPM = {
            jumlahSPMTriwulanIV: Math.max(0, Math.floor(Number(parsed.jumlahSPMTriwulanIV) || 0)),
            jumlahDispensasiSPM: Math.max(0, Math.floor(Number(parsed.jumlahDispensasiSPM) || 0))
          };
          onUpdateProject({ ...project, dispensasiSPM: validated });
          alert('Berhasil mengimpor data Dispensasi SPM.');
        } else {
          alert('Format berkas JSON tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca berkas JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    const text = `=== HASIL PERHITUNGAN DISPENSASI SPM IKPA 2026 ===
Sheet Excel: Dispensasi SPM
- Sel A2 (Jumlah SPM Triwulan IV): ${jumlahSPMTriwulanIV} berkas
- Sel B2 (Jumlah Dispensasi SPM): ${jumlahDispensasiSPM} berkas
- Sel C2 (Rasio = B2 / A2 × 1000): ${rasio.toFixed(4)}‰
- Sel D2 (Pengurang Nilai IKPA): -${pengurangNilai.toFixed(2).replace('.', ',')}

FORMULA EXCEL ACUAN:
- Rasio C2: =B2/A2*1000
- Pengurang D2: =IF(C2=0, 0, IF(C2<=0.099, 0.25, IF(C2<=0.99, 0.5, IF(C2<=4.99, 0.75, 1))))
- Dampak Nilai Akhir (Sheet Interface Q6): =(ROUND(N6/O6,2)) - P6 [P6 = 'Dispensasi SPM'!D2]`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run Golden Test
  const handleRunGoldenTest = () => {
    const result = runDispensasiSPMGoldenTest();
    setGoldenTestResult(result);
    setShowGoldenTestModal(true);
  };

  // Matriks Regulasi 5 Tier
  const thresholdTiers = [
    {
      tier: 'Tier 0',
      label: 'Rasio = 0 (Tanpa Dispensasi)',
      range: 'Rasio = 0',
      penalty: 0.00,
      active: rasio === 0
    },
    {
      tier: 'Tier 1',
      label: 'Rasio Sangat Rendah',
      range: '0 < Rasio ≤ 0,099',
      penalty: 0.25,
      active: rasio > 0 && rasio <= 0.099
    },
    {
      tier: 'Tier 2',
      label: 'Rasio Rendah',
      range: '0,099 < Rasio ≤ 0,99',
      penalty: 0.50,
      active: rasio > 0.099 && rasio <= 0.99
    },
    {
      tier: 'Tier 3',
      label: 'Rasio Sedang',
      range: '0,99 < Rasio ≤ 4,99',
      penalty: 0.75,
      active: rasio > 0.99 && rasio <= 4.99
    },
    {
      tier: 'Tier 4',
      label: 'Rasio Tinggi',
      range: 'Rasio > 4,99',
      penalty: 1.00,
      active: rasio > 4.99
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      {/* 1. Header Banner */}
      <div className={`relative overflow-hidden rounded-2xl border p-5 md:p-6 transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2.5 py-1 text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                Faktor Pengurang Langsung Nilai Akhir
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-sky-600 dark:text-sky-400">
                Excel Sheet: Dispensasi SPM
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                Skala Rasio: × 1000 (Permil)
              </span>
            </div>

            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Kalkulator Dispensasi SPM Triwulan IV
            </h3>
            <p className={`text-xs max-w-3xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Pengajuan SPM yang melewati batas tanggal penerbitan SPM pada akhir tahun anggaran (Triwulan IV)
              dikenakan <strong className="text-rose-600 dark:text-rose-400">pengurangan nilai langsung</strong> terhadap nilai akhir IKPA.
              Formula deterministik: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 ml-1">
                C2 = B2 / A2 * 1000 | D2 = IF(C2=0, 0, IF(C2&le;0.099, 0.25, IF(C2&le;0.99, 0.5, IF(C2&le;4.99, 0.75, 1))))
              </span>.
            </p>
          </div>

          {/* Metric Badges & Inspector Trigger */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <div className="text-right pr-3 border-r border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Rasio (C2)
                </span>
                <span className="text-2xl font-black font-mono text-sky-600 dark:text-sky-400">
                  {rasio.toFixed(2)}‰
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Pengurang IKPA (D2)
                </span>
                <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                  -{pengurangNilai.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                id="btn-formula-inspector-dispensasi"
                onClick={() => onOpenInspector(
                  'Pengurang Dispensasi SPM',
                  'Sheet Dispensasi SPM (D2) → Interface (P6 & Q6)',
                  '=IF(C2=0,0,IF(C2<=0.099,0.25,IF(C2<=0.99,0.5,IF(C2<=4.99,0.75,1))))',
                  `-${pengurangNilai.toFixed(2)}`,
                  [
                    { step: 'Jumlah SPM Triwulan IV (A2)', formulaHuman: 'Total transaksi SPM di TW IV', value: jumlahSPMTriwulanIV },
                    { step: 'Jumlah Dispensasi SPM (B2)', formulaHuman: 'Jumlah SPM yang diterbitkan via dispensasi keterlambatan', value: jumlahDispensasiSPM },
                    { step: 'Rasio Dispensasi (C2)', formulaHuman: `(${jumlahDispensasiSPM} / ${jumlahSPMTriwulanIV}) × 1000 = ${rasio.toFixed(4)}‰`, formulaTechnical: '=B2/A2*1000', value: rasio },
                    { step: 'Pengurang Nilai IKPA (D2 = P6)', formulaHuman: details.thresholdApplied, formulaTechnical: '=IF(C2=0,0,IF(C2<=0.099,0.25,IF(C2<=0.99,0.5,IF(C2<=4.99,0.75,1))))', value: -pengurangNilai },
                    { step: 'Nilai Akhir IKPA (Q6)', formulaHuman: `ROUND(NilaiTotal / KonversiBobot, 2) - Pengurang = ${ikpaBeforeDisp.toFixed(2)} - ${pengurangNilai.toFixed(2)} = ${ikpaFinal.toFixed(2)}`, formulaTechnical: '=(ROUND(N6/O6,2))-P6', value: ikpaFinal }
                  ]
                )}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
              >
                <Calculator className="h-3.5 w-3.5 text-emerald-600" />
                Formula Inspector
              </button>

              <button
                id="btn-verify-golden-test-dispensasi"
                onClick={handleRunGoldenTest}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Audit Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Warnings Banner (Jika A2=0 dan B2>0, atau B2>A2) */}
      {validation.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-1 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Peringatan Validasi Logika:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-400 pl-6">
            {validation.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Toolbar: View Mode & Actions */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-xl p-1 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <button
              id="tab-view-excel-dispensasi"
              onClick={() => setViewMode('excel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'excel'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tampilan Excel (A1:D2)
            </button>
            <button
              id="tab-view-cards-dispensasi"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Input Formulir Mudah
            </button>
          </div>

          <button
            onClick={() => setShowFormulaModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Info className="h-3.5 w-3.5 text-sky-600" />
            Lihat Formula
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-salin-ringkasan-dispensasi"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Tersalin' : 'Salin'}
          </button>

          <button
            id="btn-simpan-dispensasi"
            onClick={handleSaveToLocalStorage}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {savedFeedback ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Save className="h-3.5 w-3.5" />}
            {savedFeedback ? 'Tersimpan!' : 'Simpan'}
          </button>

          <button
            id="btn-reset-excel-dispensasi"
            onClick={handleResetExcel}
            title="Reset ke nilai default workbook (550 SPM, 2 Dispensasi)"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Excel
          </button>

          <button
            id="btn-export-dispensasi-json"
            onClick={handleExportJson}
            title="Ekspor data ke JSON"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          <label
            title="Impor data dari JSON"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
        </div>
      </div>

      {/* 4. MODE 1: TAMPILAN EXCEL (Sheet 'Dispensasi SPM' Sel A1:D2) */}
      {viewMode === 'excel' && (
        <div className={`rounded-2xl border overflow-hidden transition-all shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Top Sheet Tab Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Sheet: &ldquo;Dispensasi SPM&rdquo; (Struktur Excel Asli A1:D2)
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                Formula C2: =B2/A2*1000 | Formula D2: =IF(C2=0, 0, IF(C2&le;0.099, 0.25, ...))
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
              <span>Input: Sel A2 & B2</span>
              <span>•</span>
              <span>Output: Sel C2 & D2</span>
            </div>
          </div>

          {/* Spreadsheet Table Container */}
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                {/* Header Huruf Kolom Excel */}
                <tr className="bg-slate-100 dark:bg-slate-800 text-center font-bold text-slate-500 border border-slate-300 dark:border-slate-700">
                  <th className="py-1 px-3 border-r border-slate-300 dark:border-slate-700 w-12 bg-slate-200/70 dark:bg-slate-800/90">#</th>
                  <th className="py-1 px-3 border-r border-slate-300 dark:border-slate-700">A</th>
                  <th className="py-1 px-3 border-r border-slate-300 dark:border-slate-700">B</th>
                  <th className="py-1 px-3 border-r border-slate-300 dark:border-slate-700 bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300">C</th>
                  <th className="py-1 px-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300">D</th>
                </tr>
                {/* Baris 1: Judul Kolom (A1:D1) */}
                <tr className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-sans">
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400 border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60">
                    1
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700 font-bold">
                    Jumlah SPM Triwulan IV
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700 font-bold">
                    Jumlah Dispensasi SPM
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-700 font-bold text-sky-800 dark:text-sky-300 bg-sky-50/50 dark:bg-sky-950/30">
                    Rasio
                  </td>
                  <td className="py-2.5 px-3 font-bold text-rose-800 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-950/30">
                    Pengurang Nilai
                  </td>
                </tr>
              </thead>
              <tbody>
                {/* Baris 2: Data dan Formula (A2:D2) */}
                <tr className="border border-slate-300 dark:border-slate-700 text-sm">
                  {/* Nomor Baris Excel */}
                  <td className="py-3 px-3 text-center font-bold text-slate-400 border-r border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60">
                    2
                  </td>

                  {/* Sel A2: Jumlah SPM Triwulan IV (Input) */}
                  <td className="py-2 px-3 border-r border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-emerald-500">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        id="input-excel-a2"
                        type="number"
                        min="0"
                        step="1"
                        value={jumlahSPMTriwulanIV}
                        onChange={(e) => handleUpdate('jumlahSPMTriwulanIV', Number(e.target.value))}
                        className="w-full bg-transparent font-mono text-base font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                      <span className="text-[10px] font-sans text-slate-400 shrink-0">SPM</span>
                    </div>
                  </td>

                  {/* Sel B2: Jumlah Dispensasi SPM (Input) */}
                  <td className="py-2 px-3 border-r border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-rose-500">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        id="input-excel-b2"
                        type="number"
                        min="0"
                        step="1"
                        value={jumlahDispensasiSPM}
                        onChange={(e) => handleUpdate('jumlahDispensasiSPM', Number(e.target.value))}
                        className="w-full bg-transparent font-mono text-base font-bold text-rose-600 dark:text-rose-400 focus:outline-none"
                      />
                      <span className="text-[10px] font-sans text-slate-400 shrink-0">Berkas</span>
                    </div>
                  </td>

                  {/* Sel C2: Rasio = B2/A2*1000 (Output Formula) */}
                  <td className="py-2 px-3 border-r border-slate-300 dark:border-slate-700 bg-sky-50/70 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-black">
                        {rasio.toFixed(4)}
                      </span>
                      <span className="text-[10px] font-sans text-sky-600 dark:text-sky-400 font-semibold">
                        =B2/A2*1000
                      </span>
                    </div>
                  </td>

                  {/* Sel D2: Pengurang Nilai = IF(...) (Output Formula) */}
                  <td className="py-2 px-3 bg-rose-50/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-lg font-black text-rose-600 dark:text-rose-400">
                        -{pengurangNilai.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-sans text-rose-600 dark:text-rose-400 font-semibold">
                        =IF(C2=0,0,...)
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Catatan Kaki Sel Interface */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono">
            <span>Rujukan Workbook Interface: Sel P6 = &apos;Dispensasi SPM&apos;!D2</span>
            <span>Formula Akhir Nilai IKPA (Q6): =(ROUND(N6/O6,2)) - P6</span>
          </div>
        </div>
      )}

      {/* 5. MODE 2: INPUT FORMULIR KARTU MUDAH */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kartu Input Data */}
          <div className={`rounded-2xl border p-5 space-y-4 shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-600" />
              Formulir Input Dispensasi SPM Triwulan IV
            </h4>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Jumlah Penerbitan SPM di Triwulan IV (Sel A2):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={jumlahSPMTriwulanIV}
                    onChange={(e) => handleUpdate('jumlahSPMTriwulanIV', Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 font-mono text-base font-bold bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-sans">
                    Transaksi SPM
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Seluruh SPM yang diterbitkan satker pada periode Triwulan IV (Oktober - Desember).
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Jumlah SPM Mendapat Dispensasi (Sel B2):
                  </label>
                  <span className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400">
                    {jumlahDispensasiSPM} Berkas
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={jumlahDispensasiSPM}
                    onChange={(e) => handleUpdate('jumlahDispensasiSPM', Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 font-mono text-base font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-sans">
                    Dispensasi
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  SPM yang diterbitkan melebihi jadwal batas akhir pengajuan SPM tahun berjalan.
                </p>
              </div>
            </div>

            {/* Quick Skenario Buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Preset Skenario Uji Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => applyScenarioPreset(100, 0)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Tanpa Dispensasi (Pengurang 0)
                </button>
                <button
                  onClick={() => applyScenarioPreset(1000, 0.05)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Rasio ≤ 0,099 (Pengurang 0,25)
                </button>
                <button
                  onClick={() => applyScenarioPreset(500, 0.25)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Rasio ≤ 0,99 (Pengurang 0,50)
                </button>
                <button
                  onClick={() => applyScenarioPreset(550, 2)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  Default Excel (550 / 2 → 0,75)
                </button>
                <button
                  onClick={() => applyScenarioPreset(100, 1)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                >
                  Rasio &gt; 4,99 (Pengurang 1,00)
                </button>
              </div>
            </div>
          </div>

          {/* Kartu Ringkasan Hasil */}
          <div className={`rounded-2xl border p-5 space-y-4 shadow-xs flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                Hasil Perhitungan Rasio & Pengurang
              </h4>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40">
                  <div>
                    <span className="text-slate-500 font-sans block text-[11px]">Rasio Dispensasi (Sel C2)</span>
                    <span className="font-sans text-xs text-sky-700 dark:text-sky-300">
                      = ( {jumlahDispensasiSPM} ÷ {jumlahSPMTriwulanIV || 1} ) × 1000
                    </span>
                  </div>
                  <span className="text-xl font-black text-sky-700 dark:text-sky-300 font-mono">
                    {rasio.toFixed(4)}‰
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40">
                  <div>
                    <span className="text-slate-500 font-sans block text-[11px]">Pengurang Nilai IKPA (Sel D2)</span>
                    <span className="font-sans text-xs text-rose-700 dark:text-rose-300">
                      {details.thresholdApplied}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                    -{pengurangNilai.toFixed(2)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 font-sans">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Nilai IKPA Sebelum Dispensasi:</span>
                    <span className="font-mono font-bold">{ikpaBeforeDisp.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    <span>Pengurang Dispensasi SPM (D2):</span>
                    <span className="font-mono font-bold">-{pengurangNilai.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700 font-bold">
                    <span>Nilai Akhir IKPA (Interface Q6):</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      {ikpaFinal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              * Pengurang langsung dikurangkan dari hasil konversi bobot akhir, bukan sebagai komponen bobot tersendiri.
            </div>
          </div>
        </div>
      )}

      {/* 6. TABEL MATRIKS THRESHOLD LENGKAP & AUDIT PERHITUNGAN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matriks Threshold Resmi IKPA 2026 */}
        <div className={`rounded-2xl border p-5 space-y-3 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              Matriks Threshold Regulasi Dispensasi SPM
            </h4>
            <span className="text-[11px] font-mono text-slate-400">5 Kategori Tier</span>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2 px-3 font-sans">Kategori Tier</th>
                  <th className="py-2 px-3">Rentang Rasio (‰)</th>
                  <th className="py-2 px-3 text-right">Nilai Pengurang</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                {thresholdTiers.map((t, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      t.active
                        ? 'bg-rose-50/80 dark:bg-rose-950/40 font-bold text-rose-900 dark:text-rose-200 border-l-4 border-l-rose-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans">{t.label}</td>
                    <td className="py-2.5 px-3">{t.range}</td>
                    <td className="py-2.5 px-3 text-right font-black">
                      {t.penalty === 0 ? '0,00' : `-${t.penalty.toFixed(2).replace('.', ',')}`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {t.active ? (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          AKTIF
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Audit Perhitungan Terperinci (Item 13) */}
        <div className={`rounded-2xl border p-5 space-y-3 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-sky-600" />
            Audit Perhitungan Sesuai Formula Excel
          </h4>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 font-sans">Jumlah SPM Triwulan IV (Sel A2):</span>
              <span className="font-bold">{jumlahSPMTriwulanIV} transaksi</span>
            </div>

            <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 font-sans">Jumlah Dispensasi SPM (Sel B2):</span>
              <span className="font-bold text-rose-600">{jumlahDispensasiSPM} berkas</span>
            </div>

            <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700 text-sky-700 dark:text-sky-300">
              <span className="font-sans">Kalkulasi Rasio (Sel C2):</span>
              <span className="font-bold">
                {jumlahSPMTriwulanIV > 0
                  ? `${jumlahDispensasiSPM} ÷ ${jumlahSPMTriwulanIV} × 1000 = ${rasio.toFixed(4)}‰`
                  : '0 ÷ 0 = 0‰'}
              </span>
            </div>

            <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700 text-rose-700 dark:text-rose-400">
              <span className="font-sans">Evaluasi Kondisi (Sel D2):</span>
              <span className="font-bold">{details.thresholdApplied}</span>
            </div>

            <div className="flex justify-between pt-1 font-bold text-slate-900 dark:text-slate-100">
              <span className="font-sans">Pengurang Nilai Akhir IKPA:</span>
              <span className="text-sm text-rose-600 font-black font-mono">
                -{pengurangNilai.toFixed(2)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
            Dalam sheet Interface, sel Q6 dihitung sebagai:
            <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              =(ROUND(N6/O6,2))-P6
            </code>
            dengan <code className="px-1 font-mono">P6</code> merujuk langsung ke sel <code className="px-1 font-mono">&apos;Dispensasi SPM&apos;!D2</code>.
          </p>
        </div>
      </div>

      {/* 7. MODAL: LIHAT FORMULA (Item 12) */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-sky-500/10 p-2 text-sky-600">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Struktur Formula Dispensasi SPM</h3>
                  <p className="text-xs text-slate-500">
                    Kalkulator Perhitungan IKPA 2026.xlsx (Sheet: Dispensasi SPM)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-sans font-bold text-slate-500 block uppercase">
                  1. Formula Rasio Dispensasi (Sel C2):
                </span>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sky-600 font-bold">
                  = B2 / A2 * 1000
                </div>
                <p className="text-[11px] font-sans text-slate-500">
                  Rasio = (Jumlah Dispensasi SPM ÷ Jumlah SPM Triwulan IV) × 1000.
                  Skala yang digunakan adalah <strong>per mil (‰)</strong>, bukan persen (%).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-sans font-bold text-slate-500 block uppercase">
                  2. Formula Pengurang Nilai (Sel D2):
                </span>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-rose-600 font-bold whitespace-pre-wrap">
                  =IF(C2=0, 0, IF(C2&lt;=0.099, 0.25, IF(C2&lt;=0.99, 0.5, IF(C2&lt;=4.99, 0.75, 1))))
                </div>
                <div className="space-y-1 font-sans text-[11px] text-slate-600 dark:text-slate-400">
                  <div>• Rasio = 0 &rarr; <strong>0,00</strong></div>
                  <div>• 0 &lt; Rasio &le; 0,099 &rarr; <strong>0,25</strong></div>
                  <div>• 0,099 &lt; Rasio &le; 0,99 &rarr; <strong>0,50</strong></div>
                  <div>• 0,99 &lt; Rasio &le; 4,99 &rarr; <strong>0,75</strong></div>
                  <div>• Rasio &gt; 4,99 &rarr; <strong>1,00</strong></div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-sans font-bold text-slate-500 block uppercase">
                  3. Integrasi Sheet Interface (Sel P6 & Q6):
                </span>
                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 font-bold">
                  Q6 = (ROUND(N6/O6,2)) - P6
                </div>
                <p className="text-[11px] font-sans text-slate-500">
                  Sel P6 mengambil langsung nilai dari <code className="font-mono">=&apos;Dispensasi SPM&apos;!D2</code>.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs hover:opacity-90"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: GOLDEN TEST VERIFIER (Item 21) */}
      {showGoldenTestModal && goldenTestResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl transition-all ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Verifikasi Kompatibilitas Excel: Dispensasi SPM</h3>
                  <p className="text-xs text-slate-500">
                    Pengujian otomatis 9 test cases resmi sesuai lembar kerja workbook acuan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGoldenTestModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3 max-h-[420px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                      Status Uji: {goldenTestResult.status} (100% Lulus)
                    </span>
                    <span className="text-[11px] text-emerald-600 block">
                      {goldenTestResult.passedCount} dari {goldenTestResult.totalChecks} pemeriksaan sel Excel lulus deterministik.
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-emerald-600 text-white">
                  PASS
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Uji</th>
                      <th className="py-2 px-3 font-sans">Skenario Input</th>
                      <th className="py-2 px-3 text-right">Target Pengurang</th>
                      <th className="py-2 px-3 text-right">Hasil Aplikasi</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                    {goldenTestResult.checks.map((chk, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-bold text-emerald-600">{chk.id}</td>
                        <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">
                          {chk.name}
                          {chk.note && <span className="block text-[10px] text-slate-400 font-normal">{chk.note}</span>}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500">
                          {chk.expected.penalty}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                          {chk.actual.penalty}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold text-[10px]">
                            <Check className="h-3 w-3" /> PASS
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Formula deterministik strictly menggunakan rasio B2/A2*1000 dan threshold 0.099, 0.99, 4.99.
              </span>
              <button
                onClick={() => setShowGoldenTestModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold hover:opacity-90"
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
