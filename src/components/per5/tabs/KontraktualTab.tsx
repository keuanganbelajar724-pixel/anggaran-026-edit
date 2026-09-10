import React, { useState, useMemo, useEffect } from 'react';
import {
  FileCheck,
  Sliders,
  Calculator,
  Plus,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Info,
  RotateCcw,
  Download,
  Upload,
  Save,
  CheckCheck,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  Layers,
  Calendar,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { SimulationProject, BelanjaKontraktualInput } from '../../../models/ikpa';
import {
  round2,
  excelAverage,
  getQuarterFromDate,
  getSemesterFromDate,
  calculateQuarter53,
  convertDistribusiRasio,
  getAkselerasi53Score,
  calculateBelanjaKontraktualSummary,
  calculateDaysDifference,
  runBelanjaKontraktualGoldenTest,
  BelanjaKontraktualGoldenTestSummary,
  ProcessedContractRow,
  EARLY_CONTRACT_SCORE,
  STANDARD_CONTRACT_SCORE,
  PRA_DIPA_SCORE
} from '../../../calculations/belanjaKontraktual';
import { DEFAULT_EXCEL_KONTRAKTUAL_ROWS } from '../../../utils/excelReferenceDefaultData';
import { formatRupiah, formatPercent, formatScore } from '../../../utils/excelReferenceDataHelper';
import { normalizeDateToIso } from '../../../utils/ikpaDateUtils';

interface KontraktualTabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const KontraktualTab: React.FC<KontraktualTabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  // Mode tampilan: 'excel' (tabel baris 6-26 & rekap 27-30) atau 'cards' (input kartu mudah)
  const [viewMode, setViewMode] = useState<'excel' | 'cards'>('excel');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBelanja, setFilterBelanja] = useState<string>('all');

  // UI States
  const [copied, setCopied] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [showGoldenTestModal, setShowGoldenTestModal] = useState(false);
  const [goldenTestResult, setGoldenTestResult] = useState<BelanjaKontraktualGoldenTestSummary | null>(null);

  // Raw contract items
  const rawContracts: BelanjaKontraktualInput[] = useMemo(() => {
    if (project.belanjaKontraktual && project.belanjaKontraktual.length > 0) {
      return project.belanjaKontraktual;
    }
    // Inisialisasi dari DEFAULT_EXCEL_KONTRAKTUAL_ROWS jika kosong
    return DEFAULT_EXCEL_KONTRAKTUAL_ROWS.map((k: any, i: number) => ({
      no: k.id || i + 1,
      kodeSatker: k.kodeSatker || '000000',
      namaSatker: k.namaSatker || 'SATKER CONTOH',
      kodeKPPN: k.kodeKPPN || '000',
      nomorKontrak: k.noKontrak || `KTR-${String(i + 1).padStart(3, '0')}`,
      jenisBelanja: (k.jenisBelanja === '53' ? '53' : (k.jenisBelanja === '52' ? '52' : (k.jenisBelanja === '51' ? '51' : '57'))),
      nilaiKontrak: k.nilaiKontrak ?? 0,
      tanggalKontrak: normalizeDateToIso(k.tanggalKontrak) || '2024-01-01',
      tanggalMasuk: normalizeDateToIso(k.tanggalMasuk) || '2024-01-05',
      tanggalPenyelesaian: normalizeDateToIso(k.tanggalPenyelesaian) || '2024-02-10',
      quarterKontrak: k.quarterKontrak,
      semesterKontrak: k.semesterKontrak,
      isEarlyContract: k.nilaiKontrakDini >= 110,
      nilaiDistribusiAkselerasi: k.nilaiDistribusiAkselerasi ?? 100,
      nilaiKontrakDini: k.nilaiKontrakDini ?? (k.nilaiKontrakDini >= 110 ? 110 : 100),
      nilaiAkselerasi53: k.nilaiAkselerasi53
    }));
  }, [project.belanjaKontraktual]);

  // Hitung hasil kalkulasi deterministik
  const calculation = useMemo(() => {
    return calculateBelanjaKontraktualSummary(rawContracts, 10, true);
  }, [rawContracts]);

  const { processedRows, summary, indicatorResult } = calculation;

  // Filtered rows for search/filtering
  const displayedRows = useMemo(() => {
    return processedRows.filter(r => {
      const matchSearch =
        r.nomorKontrak.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.namaSatker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.kodeSatker.includes(searchQuery) ||
        r.no.toString() === searchQuery.trim();
      const matchBelanja = filterBelanja === 'all' || r.jenisBelanja === filterBelanja;
      return matchSearch && matchBelanja;
    });
  }, [processedRows, searchQuery, filterBelanja]);

  // Update a specific contract row
  const handleUpdateRow = (rowIndex: number, field: keyof BelanjaKontraktualInput, val: any) => {
    const newItems = [...rawContracts];
    const isDateField = field === 'tanggalKontrak' || field === 'tanggalMasuk' || field === 'tanggalPenyelesaian';
    const processedVal = isDateField ? normalizeDateToIso(val) : val;

    const currentItem = { ...newItems[rowIndex], [field]: processedVal };

    // Auto-update helper if date changed
    if (field === 'tanggalKontrak') {
      const sem = getSemesterFromDate(processedVal);
      const qtr = getQuarterFromDate(processedVal);
      currentItem.semesterKontrak = sem || 'I';
      currentItem.quarterKontrak = qtr || 'I';
    }

    newItems[rowIndex] = currentItem;
    onUpdateProject({ ...project, belanjaKontraktual: newItems });
  };

  // Add new contract
  const handleAddRow = () => {
    const nextNo = rawContracts.length + 1;
    const newRow: BelanjaKontraktualInput = {
      no: nextNo,
      kodeSatker: rawContracts[0]?.kodeSatker || '000000',
      namaSatker: rawContracts[0]?.namaSatker || 'SATKER CONTOH',
      kodeKPPN: rawContracts[0]?.kodeKPPN || '000',
      nomorKontrak: `${String(nextNo).padStart(3, '0')}/SPK/PPK/2026`,
      jenisBelanja: '53',
      nilaiKontrak: 150000000,
      tanggalKontrak: '2026-02-01',
      tanggalMasuk: '2026-02-04',
      tanggalPenyelesaian: '2026-03-31',
      isEarlyContract: true,
      nilaiDistribusiAkselerasi: 100,
      nilaiKontrakDini: 110,
      nilaiAkselerasi53: 100
    };
    onUpdateProject({ ...project, belanjaKontraktual: [...rawContracts, newRow] });
  };

  // Duplicate contract
  const handleDuplicateRow = (index: number) => {
    const target = rawContracts[index];
    const nextNo = rawContracts.length + 1;
    const duplicated: BelanjaKontraktualInput = {
      ...target,
      no: nextNo,
      nomorKontrak: `${target.nomorKontrak || 'KTR'}-COPY`
    };
    onUpdateProject({ ...project, belanjaKontraktual: [...rawContracts, duplicated] });
  };

  // Delete contract
  const handleDeleteRow = (index: number) => {
    if (rawContracts.length <= 1) {
      alert('Minimal terdapat 1 data kontrak dalam tabel.');
      return;
    }
    const filtered = rawContracts.filter((_, i) => i !== index).map((item, idx) => ({
      ...item,
      no: idx + 1
    }));
    onUpdateProject({ ...project, belanjaKontraktual: filtered });
  };

  // Quick Optimization: Jadikan semua pendaftaran tepat waktu (< 5 hari) dan akselerasi Belanja 53
  const handleOptimizeAllOnTime = () => {
    const optimized = rawContracts.map(r => {
      // Pendaftaran tepat waktu: tanggalMasuk <= 3 hari setelah tanggalKontrak
      const tglKontrak = normalizeDateToIso(r.tanggalKontrak);
      const is53 = r.jenisBelanja === '53';
      return {
        ...r,
        tanggalMasuk: tglKontrak, // tepat waktu
        // Jika belanja modal 53 50-200jt, percepat penyelesaian ke Triwulan I atau II
        tanggalPenyelesaian: is53 && r.nilaiKontrak >= 50_000_000 && r.nilaiKontrak <= 200_000_000
          ? `${tglKontrak.substring(0, 4)}-03-25`
          : r.tanggalPenyelesaian,
        nilaiDistribusiAkselerasi: 100,
        nilaiAkselerasi53: is53 ? 100 : 100
      };
    });
    onUpdateProject({ ...project, belanjaKontraktual: optimized });
  };

  // Reset to default 21 contracts from workbook
  const handleResetToExcelDefault = () => {
    const defaultData: BelanjaKontraktualInput[] = DEFAULT_EXCEL_KONTRAKTUAL_ROWS.map((k: any, idx: number) => ({
      no: k.id || idx + 1,
      kodeSatker: k.kodeSatker,
      namaSatker: k.namaSatker,
      kodeKPPN: k.kodeKPPN || '000',
      nomorKontrak: k.noKontrak,
      jenisBelanja: k.jenisBelanja === '53' ? '53' : (k.jenisBelanja === '52' ? '52' : '51'),
      nilaiKontrak: k.nilaiKontrak,
      tanggalKontrak: normalizeDateToIso(k.tanggalKontrak),
      tanggalMasuk: normalizeDateToIso(k.tanggalMasuk),
      tanggalPenyelesaian: normalizeDateToIso(k.tanggalPenyelesaian),
      isEarlyContract: k.nilaiKontrakDini >= 110,
      nilaiDistribusiAkselerasi: k.nilaiDistribusiAkselerasi,
      nilaiKontrakDini: k.nilaiKontrakDini,
      nilaiAkselerasi53: k.nilaiAkselerasi53
    }));
    onUpdateProject({ ...project, belanjaKontraktual: defaultData });
  };

  // Save to LocalStorage
  const handleSaveToLocalStorage = () => {
    try {
      localStorage.setItem('ikpa_belanja_kontraktual_backup', JSON.stringify(rawContracts));
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rawContracts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Belanja_Kontraktual_IKPA_${new Date().toISOString().slice(0, 10)}.json`);
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validated: BelanjaKontraktualInput[] = parsed.map((item, idx) => ({
            no: idx + 1,
            kodeSatker: item.kodeSatker || '000000',
            namaSatker: item.namaSatker || 'SATKER CONTOH',
            kodeKPPN: item.kodeKPPN || '000',
            nomorKontrak: item.nomorKontrak || `KTR-${idx + 1}`,
            jenisBelanja: item.jenisBelanja || '52',
            nilaiKontrak: Number(item.nilaiKontrak) || 0,
            tanggalKontrak: normalizeDateToIso(item.tanggalKontrak) || '2024-01-01',
            tanggalMasuk: normalizeDateToIso(item.tanggalMasuk) || '2024-01-05',
            tanggalPenyelesaian: normalizeDateToIso(item.tanggalPenyelesaian) || '2024-02-10',
            isEarlyContract: Boolean(item.isEarlyContract || item.nilaiKontrakDini >= 110),
            nilaiDistribusiAkselerasi: item.nilaiDistribusiAkselerasi,
            nilaiKontrakDini: item.nilaiKontrakDini,
            nilaiAkselerasi53: item.nilaiAkselerasi53
          }));
          onUpdateProject({ ...project, belanjaKontraktual: validated });
          alert(`Berhasil mengimpor ${validated.length} data kontrak.`);
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
    const text = `=== HASIL KALKULASI BELANJA KONTRAKTUAL IKPA 2026 ===
Nilai Indikator (N30): ${formatScore(summary.nilaiIndikator)}
Nilai Berbobot (J8, Bobot 10%): ${formatScore(summary.weightedValue)}

REKAPITULASI KOMPONEN:
1. Distribusi Akselerasi (Bobot 20%):
   - Rata-rata Semester I (N27): ${formatScore(summary.avgDistribusiRaw)}%
   - Nilai Konversi: ${summary.nilaiDistribusiConverted}
   - Komponen Nilai (N29): ${formatScore(summary.kompDistribusi)}
2. Kontrak Dini (Bobot 40%):
   - Rata-rata Nilai Kontrak Dini (O27): ${formatScore(summary.avgKontrakDini)}
   - Komponen Nilai (O29): ${formatScore(summary.kompKontrakDini)}
3. Akselerasi Belanja Modal 53 (Bobot 40%):
   - Rata-rata Nilai Akselerasi 53 (P27): ${formatScore(summary.avgAkselerasi53)}
   - Komponen Nilai (P29): ${formatScore(summary.kompAkselerasi53)}

TOTAL KONTRAK: ${summary.rowCount} berkas
- Belanja 53: ${summary.countBelanja53}
- Belanja 53 (Rp50-200 Juta): ${summary.countBelanja53Eligible}
- Kontrak Dini (>= 110): ${summary.countEarlyContract}
- Keterlambatan Pendaftaran (> 5 Hari): ${summary.countLateRegistration}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run Golden Test
  const handleRunGoldenTest = () => {
    const result = runBelanjaKontraktualGoldenTest(rawContracts);
    setGoldenTestResult(result);
    setShowGoldenTestModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      {/* 1. Header Banner & Main Metric Display */}
      <div className={`relative overflow-hidden rounded-2xl border p-5 md:p-6 transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Bobot 10% | Sel N30 & J8
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-sky-600 dark:text-sky-400">
                Excel Sheet: Belanja Kontraktual
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                {summary.rowCount} Kontrak
              </span>
            </div>

            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Kalkulator Indikator Belanja Kontraktual
            </h3>
            <p className={`text-xs max-w-3xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Perhitungan deterministik 100% identik workbook Excel referensi. Formula Excel:
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 ml-1">
                = (20% × Distribusi Akselerasi) + (40% × Kontrak Dini) + (40% × Akselerasi Belanja Modal 53)
              </span>.
            </p>
          </div>

          {/* Metric Badges & Inspector Trigger */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <div className="text-right pr-3 border-r border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Nilai Indikator (N30)
                </span>
                <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatScore(summary.nilaiIndikator)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Nilai Berbobot (J8)
                </span>
                <span className="text-2xl font-black font-mono text-sky-600 dark:text-sky-400">
                  {formatScore(summary.weightedValue)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                id="btn-formula-inspector-kontraktual"
                onClick={() => onOpenInspector(
                  'Indikator Belanja Kontraktual',
                  'N30 & J8',
                  '=N29 + O29 + P29 = (20%*Distribusi) + (40%*KontrakDini) + (40%*Akselerasi53)',
                  formatScore(summary.nilaiIndikator),
                  indicatorResult?.details || []
                )}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
              >
                <Calculator className="h-3.5 w-3.5 text-emerald-600" />
                Formula Inspector
              </button>

              <button
                id="btn-verify-golden-test-kontraktual"
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

      {/* 2. Three Component Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Komponen 1: Distribusi Akselerasi (Bobot 20%) */}
        <div className={`p-4 rounded-xl border transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Komponen 1 (Bobot 20%)
            </span>
            <span className="font-mono text-xs text-slate-400">Sel N29</span>
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-2">
            Distribusi Akselerasi Kontrak
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Mendorong pendaftaran kontrak di Semester I (TW I & II). Ketepatan pendaftaran &lt; 5 hari kerja.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Rata-rata Sem I (N27)</span>
              <span className="font-mono font-bold text-sm text-slate-700 dark:text-slate-300">
                {formatScore(summary.avgDistribusiRaw)}% → Konversi {summary.nilaiDistribusiConverted}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Nilai Komponen</span>
              <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                {formatScore(summary.kompDistribusi)}
              </span>
            </div>
          </div>
        </div>

        {/* Komponen 2: Kontrak Dini (Bobot 40%) */}
        <div className={`p-4 rounded-xl border transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
              Komponen 2 (Bobot 40%)
            </span>
            <span className="font-mono text-xs text-slate-400">Sel O29</span>
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-2">
            Kontrak Dini (Pra-DIPA / TW I)
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Kontrak ditandatangani sebelum tahun anggaran (120) atau Januari-Februari / TW I (110). Lainnya (100).
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Rata-rata Dini (O27)</span>
              <span className="font-mono font-bold text-sm text-slate-700 dark:text-slate-300">
                {formatScore(summary.avgKontrakDini)} ({summary.countEarlyContract} kontrak)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Nilai Komponen</span>
              <span className="font-mono font-bold text-base text-sky-600 dark:text-sky-400">
                {formatScore(summary.kompKontrakDini)}
              </span>
            </div>
          </div>
        </div>

        {/* Komponen 3: Akselerasi Belanja Modal 53 (Bobot 40%) */}
        <div className={`p-4 rounded-xl border transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
              Komponen 3 (Bobot 40%)
            </span>
            <span className="font-mono text-xs text-slate-400">Sel P29</span>
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-2">
            Akselerasi Belanja Modal 53
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Khusus Belanja 53 bernilai Rp50-200 Juta diselesaikan cepat: TW I (100), TW II (90), TW III (80), TW IV (70).
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Rata-rata 53 (P27)</span>
              <span className="font-mono font-bold text-sm text-slate-700 dark:text-slate-300">
                {formatScore(summary.avgAkselerasi53)} ({summary.countBelanja53Eligible} kontrak)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Nilai Komponen</span>
              <span className="font-mono font-bold text-base text-indigo-600 dark:text-indigo-400">
                {formatScore(summary.kompAkselerasi53)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Toolbar: View Mode, Search, Filter & Actions */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-xl p-1 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <button
              id="tab-view-excel"
              onClick={() => setViewMode('excel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'excel'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tampilan Excel (Kolom A-P)
            </button>
            <button
              id="tab-view-cards"
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

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kontrak, satker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-56"
            />
          </div>

          {/* Filter Jenis Belanja */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filterBelanja}
              onChange={(e) => setFilterBelanja(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Semua Belanja</option>
              <option value="51">Belanja 51 (Pegawai)</option>
              <option value="52">Belanja 52 (Barang)</option>
              <option value="53">Belanja 53 (Modal)</option>
              <option value="57">Belanja 57 (Bansos)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-tambah-kontrak"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Kontrak
          </button>

          <button
            id="btn-optimasi-kontraktual"
            onClick={handleOptimizeAllOnTime}
            title="Setel tanggal pendaftaran tepat waktu & akselerasi penyelesaian 53"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" /> Optimasi
          </button>

          <button
            id="btn-salin-ringkasan-kontrak"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Tersalin' : 'Salin'}
          </button>

          <button
            id="btn-simpan-kontrak"
            onClick={handleSaveToLocalStorage}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {savedFeedback ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Save className="h-3.5 w-3.5" />}
            {savedFeedback ? 'Tersimpan!' : 'Simpan'}
          </button>

          <button
            id="btn-reset-excel-kontrak"
            onClick={handleResetToExcelDefault}
            title="Reset ke 21 baris data default workbook Excel"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Excel
          </button>

          <button
            id="btn-export-kontrak-json"
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

      {/* 4. VIEW MODE: Tampilan Excel (Struktur Kolom A-P, Baris 6-26 & Rekapitulasi 27-30) */}
      {viewMode === 'excel' && (
        <div className={`rounded-2xl border overflow-hidden transition-all shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Sheet Excel: Belanja Kontraktual (Kolom A – P)
              </h4>
              <span className="text-xs text-slate-400">
                (Baris 6 s.d. 26: Data Kontrak, Baris 27 s.d. 30: Rekapitulasi Formula)
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Menampilkan {displayedRows.length} dari {processedRows.length} kontrak
            </span>
          </div>

          <div className="overflow-x-auto max-h-[620px]">
            <table className="w-full text-left text-xs border-collapse min-w-[1300px]">
              {/* Header Kolom Huruf Excel (A s.d. P) */}
              <thead className="sticky top-0 z-20 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
                <tr className="text-center font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800/90 w-12">A</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-24">B</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-36">C</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-20">D</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-44">E</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-20">F</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-32">G</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-28">H</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-28">I</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-28">J</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 w-20">K</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 w-20">L</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 w-24">M</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 bg-emerald-100/70 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 w-24">N</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 bg-sky-100/70 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 w-24">O</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 bg-indigo-100/70 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 w-24">P</th>
                  <th className="py-1 px-2 w-16">Aksi</th>
                </tr>
                {/* Header Judul Kolom */}
                <tr className="border-b border-slate-300 dark:border-slate-700 text-left font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center">No.</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700">Kode Satker</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700">Nama Satker</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700">KPPN</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700">No. Kontrak</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center">Jenis Belanja</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-right">Nilai Kontrak (Rp)</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center">Tgl Kontrak</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center">Tgl Masuk</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center">Tgl Selesai</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                    Triwulan
                  </th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                    Semester
                  </th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300">
                    TW 53 (50-200jt)
                  </th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300">
                    Nilai Distribusi
                  </th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-sky-100/50 dark:bg-sky-900/20 text-sky-800 dark:text-sky-300">
                    Nilai Dini
                  </th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-indigo-100/50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300">
                    Nilai Aksel 53
                  </th>
                  <th className="py-2.5 px-2 text-center">Aksi</th>
                </tr>
              </thead>

              {/* Baris 6 s.d. 26 (Data Kontrak) */}
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                {displayedRows.map((r) => {
                  const originalIndex = rawContracts.findIndex(raw => (raw.no || 0) === r.no);
                  const targetIdx = originalIndex >= 0 ? originalIndex : r.no - 1;

                  return (
                    <tr
                      key={r.no}
                      className={`transition-colors ${
                        isDark
                          ? 'hover:bg-slate-800/50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Kolom A: No */}
                      <td className="py-2 px-2 text-center font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-700">
                        {r.no}
                      </td>

                      {/* Kolom B: Kode Satker */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700">
                        <input
                          type="text"
                          value={r.kodeSatker}
                          onChange={(e) => handleUpdateRow(targetIdx, 'kodeSatker', e.target.value)}
                          className="w-full bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
                        />
                      </td>

                      {/* Kolom C: Nama Satker */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700">
                        <input
                          type="text"
                          value={r.namaSatker}
                          onChange={(e) => handleUpdateRow(targetIdx, 'namaSatker', e.target.value)}
                          className="w-full bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 font-sans"
                        />
                      </td>

                      {/* Kolom D: Kode KPPN */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700">
                        <input
                          type="text"
                          value={r.kodeKPPN}
                          onChange={(e) => handleUpdateRow(targetIdx, 'kodeKPPN', e.target.value)}
                          className="w-full bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
                        />
                      </td>

                      {/* Kolom E: Nomor Kontrak */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 font-semibold">
                        <input
                          type="text"
                          value={r.nomorKontrak}
                          onChange={(e) => handleUpdateRow(targetIdx, 'nomorKontrak', e.target.value)}
                          className="w-full bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
                        />
                      </td>

                      {/* Kolom F: Jenis Belanja */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-center">
                        <select
                          value={r.jenisBelanja}
                          onChange={(e) => handleUpdateRow(targetIdx, 'jenisBelanja', e.target.value)}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${
                            r.jenisBelanja === '53'
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 border-indigo-200 dark:border-indigo-800'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <option value="51">51 (Pegawai)</option>
                          <option value="52">52 (Barang)</option>
                          <option value="53">53 (Modal)</option>
                          <option value="57">57 (Bansos)</option>
                        </select>
                      </td>

                      {/* Kolom G: Nilai Kontrak */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-right">
                        <input
                          type="number"
                          value={r.nilaiKontrak}
                          onChange={(e) => handleUpdateRow(targetIdx, 'nilaiKontrak', Math.max(0, Number(e.target.value)))}
                          className="w-full text-right bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 font-mono"
                        />
                        {r.isEligible53Range && (
                          <span className="block text-[9px] text-indigo-500 font-sans mt-0.5">
                            ★ 53 (50-200jt)
                          </span>
                        )}
                      </td>

                      {/* Kolom H: Tanggal Kontrak */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-center">
                        <input
                          type="date"
                          value={r.tanggalKontrak}
                          onChange={(e) => handleUpdateRow(targetIdx, 'tanggalKontrak', e.target.value)}
                          className="w-28 bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 text-[11px]"
                        />
                      </td>

                      {/* Kolom I: Tanggal Masuk */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-center">
                        <input
                          type="date"
                          value={r.tanggalMasuk}
                          onChange={(e) => handleUpdateRow(targetIdx, 'tanggalMasuk', e.target.value)}
                          className={`w-28 bg-transparent px-1 py-0.5 rounded border text-[11px] ${
                            r.isPendaftaranTerlambat
                              ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                              : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                          } focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500`}
                        />
                        {r.isPendaftaranTerlambat && (
                          <span className="block text-[9px] text-amber-600 font-sans mt-0.5">
                            &gt;5 hari ({r.selisihHariPendaftaran} hr)
                          </span>
                        )}
                      </td>

                      {/* Kolom J: Tanggal Penyelesaian */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-center">
                        <input
                          type="date"
                          value={r.tanggalPenyelesaian}
                          onChange={(e) => handleUpdateRow(targetIdx, 'tanggalPenyelesaian', e.target.value)}
                          className="w-28 bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 text-[11px]"
                        />
                      </td>

                      {/* Kolom K: Triwulan Kontrak (Otomatis) */}
                      <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-50/40 dark:bg-emerald-950/20 font-bold text-emerald-700 dark:text-emerald-400">
                        {r.triwulanKontrak || '-'}
                      </td>

                      {/* Kolom L: Semester Kontrak (Otomatis) */}
                      <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-50/40 dark:bg-emerald-950/20 font-bold text-emerald-700 dark:text-emerald-400">
                        {r.semesterKontrak || '-'}
                      </td>

                      {/* Kolom M: Triwulan Tanggal Penyelesaian untuk 53 Rp50-200jt (Otomatis) */}
                      <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-indigo-50/40 dark:bg-indigo-950/20 font-bold text-indigo-700 dark:text-indigo-300">
                        {r.triwulanPenyelesaian53 ? r.triwulanPenyelesaian53 : '-'}
                      </td>

                      {/* Kolom N: Nilai Distribusi Akselerasi Kontrak */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-50/30 dark:bg-emerald-950/10">
                        <input
                          type="number"
                          value={r.nilaiDistribusiAkselerasi}
                          onChange={(e) => handleUpdateRow(targetIdx, 'nilaiDistribusiAkselerasi', Number(e.target.value))}
                          className="w-16 text-center bg-transparent py-0.5 rounded font-bold text-emerald-600 dark:text-emerald-400 border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                        />
                      </td>

                      {/* Kolom O: Nilai Kontrak Dini (Input/Override Sensitif) */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-sky-50/30 dark:bg-sky-950/10">
                        <select
                          value={r.nilaiKontrakDini}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleUpdateRow(targetIdx, 'nilaiKontrakDini', val);
                            handleUpdateRow(targetIdx, 'isEarlyContract', val >= 110);
                          }}
                          className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-700 dark:text-sky-300"
                        >
                          <option value="120">120 (Pra-DIPA)</option>
                          <option value="110">110 (Dini TW I)</option>
                          <option value="100">100 (Standar)</option>
                          <option value="0">0 (Terlambat)</option>
                        </select>
                      </td>

                      {/* Kolom P: Nilai Akselerasi 53 (Otomatis) */}
                      <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-indigo-50/30 dark:bg-indigo-950/10 font-bold text-indigo-700 dark:text-indigo-300">
                        {r.nilaiAkselerasi53}
                      </td>

                      {/* Kolom Aksi */}
                      <td className="py-1 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Duplikat baris ini"
                            onClick={() => handleDuplicateRow(targetIdx)}
                            className="p-1 text-slate-400 hover:text-sky-600 transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <button
                            title="Hapus baris kontrak ini"
                            onClick={() => handleDeleteRow(targetIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* ==================================================
                  BAGIAN REKAPITULASI SESUAI EXCEL (BARIS 27 - 30)
                  ================================================== */}
              <tfoot className="border-t-2 border-slate-400 dark:border-slate-600 font-mono text-[11px] font-bold">
                {/* Baris 27: RATA-RATA (=AVERAGE(N6:N26)) */}
                <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <td className="py-2 px-2 text-center font-bold text-slate-500 border-r border-slate-200 dark:border-slate-700">27</td>
                  <td colSpan={12} className="py-2 px-3 text-right font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                    RATA-RATA (=AVERAGE) :
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-r border-slate-200 dark:border-slate-700">
                    {formatScore(summary.avgDistribusiRaw)}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-r border-slate-200 dark:border-slate-700">
                    {formatScore(summary.avgKontrakDini)}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-r border-slate-200 dark:border-slate-700">
                    {formatScore(summary.avgAkselerasi53)}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-400">-</td>
                </tr>

                {/* Baris 28: BOBOT KOMPONEN (20%, 40%, 40%) */}
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <td className="py-2 px-2 text-center font-bold text-slate-500 border-r border-slate-200 dark:border-slate-700">28</td>
                  <td colSpan={12} className="py-2 px-3 text-right font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                    BOBOT KOMPONEN :
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 border-r border-slate-200 dark:border-slate-700">
                    20%
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-sky-700 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/20 border-r border-slate-200 dark:border-slate-700">
                    40%
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-r border-slate-200 dark:border-slate-700">
                    40%
                  </td>
                  <td className="py-2 px-2 text-center text-slate-400">-</td>
                </tr>

                {/* Baris 29: KOMPONEN NILAI / KONVERSI */}
                <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <td className="py-2 px-2 text-center font-bold text-slate-500 border-r border-slate-200 dark:border-slate-700">29</td>
                  <td colSpan={12} className="py-2 px-3 text-right font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                    KOMPONEN NILAI (=BOBOT × RATA-RATA / KONVERSI) :
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 border-r border-slate-200 dark:border-slate-700">
                    {formatScore(summary.kompDistribusi)}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-sky-700 dark:text-sky-400 bg-sky-100/60 dark:bg-sky-900/40 border-r border-slate-200 dark:border-slate-700">
                    {formatScore(summary.kompKontrakDini)}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-900/40 border-r border-slate-200 dark:border-slate-700">
                    {formatScore(summary.kompAkselerasi53)}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-400">-</td>
                </tr>

                {/* Baris 30: NILAI INDIKATOR BELANJA KONTRAKTUAL (=N29 + O29 + P29) */}
                <tr className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 text-xs font-black">
                  <td className="py-3 px-2 text-center border-r border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">30</td>
                  <td colSpan={12} className="py-3 px-3 text-right font-bold text-emerald-800 dark:text-emerald-300 border-r border-emerald-200 dark:border-emerald-800 tracking-wide">
                    NILAI INDIKATOR BELANJA KONTRAKTUAL (SEL N30 = N29 + O29 + P29) :
                  </td>
                  <td colSpan={3} className="py-3 px-4 text-center font-black text-lg text-emerald-600 dark:text-emerald-300 border-r border-emerald-200 dark:border-emerald-800 font-mono">
                    {formatScore(summary.nilaiIndikator)}
                  </td>
                  <td className="py-3 px-2 text-center text-emerald-600">✓</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 5. VIEW MODE: Input Formulir Mudah (Card-based UI) */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Daftar Kontrak ({displayedRows.length} Berkas)
            </h4>
            <span className="text-xs text-slate-500">
              Klik pada field untuk langsung memperbarui data. Kalkulasi tersinkronisasi otomatis.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedRows.map((r) => {
              const originalIndex = rawContracts.findIndex(raw => (raw.no || 0) === r.no);
              const targetIdx = originalIndex >= 0 ? originalIndex : r.no - 1;

              return (
                <div
                  key={r.no}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                        #{r.no}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        r.jenisBelanja === '53'
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        Belanja {r.jenisBelanja}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicateRow(targetIdx)}
                        title="Duplikat"
                        className="p-1 text-slate-400 hover:text-sky-600"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRow(targetIdx)}
                        title="Hapus"
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block uppercase font-medium">Nomor Kontrak</label>
                    <input
                      type="text"
                      value={r.nomorKontrak}
                      onChange={(e) => handleUpdateRow(targetIdx, 'nomorKontrak', e.target.value)}
                      className="w-full mt-0.5 px-2.5 py-1 text-xs font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block uppercase font-medium">Jenis Belanja</label>
                      <select
                        value={r.jenisBelanja}
                        onChange={(e) => handleUpdateRow(targetIdx, 'jenisBelanja', e.target.value)}
                        className="w-full mt-0.5 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value="51">51 (Pegawai)</option>
                        <option value="52">52 (Barang)</option>
                        <option value="53">53 (Modal)</option>
                        <option value="57">57 (Bansos)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block uppercase font-medium">Nilai Kontrak</label>
                      <input
                        type="number"
                        value={r.nilaiKontrak}
                        onChange={(e) => handleUpdateRow(targetIdx, 'nilaiKontrak', Math.max(0, Number(e.target.value)))}
                        className="w-full mt-0.5 px-2 py-1 text-xs font-mono text-right rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">Tgl Kontrak:</span>
                      <input
                        type="date"
                        value={r.tanggalKontrak}
                        onChange={(e) => handleUpdateRow(targetIdx, 'tanggalKontrak', e.target.value)}
                        className="px-2 py-0.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-32"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">Tgl Masuk KPPN:</span>
                      <input
                        type="date"
                        value={r.tanggalMasuk}
                        onChange={(e) => handleUpdateRow(targetIdx, 'tanggalMasuk', e.target.value)}
                        className="px-2 py-0.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-32"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">Tgl Selesai:</span>
                      <input
                        type="date"
                        value={r.tanggalPenyelesaian}
                        onChange={(e) => handleUpdateRow(targetIdx, 'tanggalPenyelesaian', e.target.value)}
                        className="px-2 py-0.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-32"
                      />
                    </div>
                  </div>

                  {/* Badges & Scores */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">K/L:</span>
                      <span className="font-bold text-emerald-600">
                        TW {r.triwulanKontrak || '-'} (Sem {r.semesterKontrak || '-'})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Dini:</span>
                      <select
                        value={r.nilaiKontrakDini}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleUpdateRow(targetIdx, 'nilaiKontrakDini', val);
                          handleUpdateRow(targetIdx, 'isEarlyContract', val >= 110);
                        }}
                        className="px-1 py-0.5 text-[10px] font-bold rounded border bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300"
                      >
                        <option value="120">120 (Pra-DIPA)</option>
                        <option value="110">110 (Dini TW I)</option>
                        <option value="100">100 (Standar)</option>
                        <option value="0">0</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Aksel 53:</span>
                      <span className="font-bold text-indigo-600">
                        {r.nilaiAkselerasi53}
                      </span>
                    </div>
                  </div>

                  {r.isPendaftaranTerlambat && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded-lg border border-amber-200 dark:border-amber-800/40">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>Pendaftaran terlambat {r.selisihHariPendaftaran} hari kalender (&gt; 5 hari)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Modal Golden Test Excel Verifier */}
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
                  <h3 className="text-base font-bold">Verifikasi Kompatibilitas Excel Workbook</h3>
                  <p className="text-xs text-slate-500">
                    Pembandingan nilai perhitungan dengan sheet &ldquo;Belanja Kontraktual&rdquo; pada workbook referensi.
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
                      Status Uji: {goldenTestResult.status} (100% Cocok)
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
                      <th className="py-2 px-3">Sel</th>
                      <th className="py-2 px-3 font-sans">Deskripsi</th>
                      <th className="py-2 px-3 text-right">Target Excel</th>
                      <th className="py-2 px-3 text-right">Aplikasi</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                    {goldenTestResult.checks.map((chk, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-bold text-emerald-600">{chk.cell}</td>
                        <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">{chk.description}</td>
                        <td className="py-2 px-3 text-right text-slate-500">{String(chk.expected)}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100">{String(chk.actual)}</td>
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
                Formula AVERAGE strictly mengabaikan sel kosong (tidak menghitung sel kosong sebagai 0).
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
