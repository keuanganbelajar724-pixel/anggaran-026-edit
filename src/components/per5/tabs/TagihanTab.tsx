import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eraser,
  Download,
  Upload,
  Copy,
  Check,
  Calculator,
  Info,
  Layers,
  HelpCircle,
  ExternalLink,
  Save,
  CheckCheck,
  XCircle,
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  Sparkles,
  Calendar,
  Filter,
  FileText
} from 'lucide-react';
import { SimulationProject, PenyelesaianTagihanRow } from '../../../models/ikpa';
import { validateTagihan } from '../../../utils/indikatorValidation';
import { IndikatorValidationBanner } from '../common/IndikatorValidationBanner';
import { IndikatorCalculateButton } from '../common/IndikatorCalculateButton';
import { PetunjukPengisianCard } from '../common/PetunjukPengisianCard';
import {
  THRESHOLD_HARI_EFEKTIF,
  differenceInCalendarDays,
  calculateEffectiveDays,
  calculateStatus,
  countOnTime,
  countLate,
  calculateBillingCompletionScore,
  calculateHolidayDays,
  processTagihanRows,
  calculatePenyelesaianTagihan,
  runPenyelesaianTagihanGoldenTest,
  PenyelesaianTagihanGoldenTestSummary,
  ProcessedTagihanRow
} from '../../../calculations/penyelesaianTagihan';
import { DEFAULT_EXCEL_TAGIHAN_ROWS } from '../../../utils/excelReferenceDefaultData';
import { formatScore, formatRupiah } from '../../../utils/excelReferenceDataHelper';
import { normalizeDateToIso } from '../../../utils/ikpaDateUtils';

interface TagihanTabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const TagihanTab: React.FC<TagihanTabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  // Mode Tampilan: 'excel' (Tabel spreadsheet kolom A-S) atau 'cards' (Formulir Kartu Mudah)
  const [viewMode, setViewMode] = useState<'excel' | 'cards'>('excel');

  // Mode Hari Libur: 'manual' (default untuk kompatibilitas Excel) atau 'auto' (otomatis hitung akhir pekan)
  const [holidayMode, setHolidayMode] = useState<'manual' | 'auto'>('manual');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // UI States
  const [copied, setCopied] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [showGoldenTestModal, setShowGoldenTestModal] = useState(false);
  const [goldenTestResult, setGoldenTestResult] = useState<PenyelesaianTagihanGoldenTestSummary | null>(null);
  const [isValidationConfirmed, setIsValidationConfirmed] = useState(false);

  // Selected Row for Audit Detail Modal
  const [selectedAuditRow, setSelectedAuditRow] = useState<ProcessedTagihanRow | null>(null);

  // Raw rows from project (default 0 baris agar Satker dapat menambah mandiri tanpa beban mengisi banyak)
  const rawRows: PenyelesaianTagihanRow[] = useMemo(() => {
    if (project.penyelesaianTagihan !== undefined && Array.isArray(project.penyelesaianTagihan)) {
      return project.penyelesaianTagihan.map((r: any, idx: number) => ({
        no: r.no || idx + 1,
        identitasTagihan: r.identitasTagihan || r.satker || r.nomorSP2D || `Tagihan #${r.no || idx + 1}`,
        keterangan: r.keterangan || 'SPM-LS Kontraktual Non Belanja Pegawai',
        jenisTagihan: r.jenisTagihan || 'SPM-LS Kontraktual',
        nomorSPP: r.nomorSPP || r.nomorSPM || `SPP-${String(idx + 1).padStart(3, '0')}`,
        tanggalSPP: normalizeDateToIso(r.tanggalSPP || r.tanggalSPM) || null,
        tanggalTagihan: normalizeDateToIso(r.tanggalTagihan || r.tanggalBAST) || null,
        tanggalDokumenPendukung: normalizeDateToIso(r.tanggalDokumenPendukung || r.tanggalBAPP || r.tanggalBAST) || null,
        tanggalPenyampaian: normalizeDateToIso(r.tanggalPenyampaian || r.tanggalKonversiADK) || null,
        tanggalMulai: normalizeDateToIso(r.tanggalMulai || r.tanggalMulaiPerhitungan || r.tanggalBAST) || null,
        tanggalKonversi: normalizeDateToIso(r.tanggalKonversi || r.tanggalKonversiADK || r.tanggalSPM) || null,
        selisihHari: r.selisihHari ?? null,
        hariLibur: r.hariLibur ?? r.jumlahHariLibur ?? 0,
        jumlahHariEfektif: r.jumlahHariEfektif ?? r.jumlahHariFinal ?? null,
        status: (r.status || 'TEPAT') as "TEPAT" | "TERLAMBAT" | "BELUM LENGKAP",
        keteranganHasil: r.keteranganHasil || '',
        satker: r.satker,
        nomorSPM: r.nomorSPM || r.nomorSPP,
        tanggalSPM: normalizeDateToIso(r.tanggalSPM || r.tanggalSPP) || null,
        nomorSP2D: r.nomorSP2D,
        tanggalSP2D: normalizeDateToIso(r.tanggalSP2D) || null,
        nilaiSP2D: r.nilaiSP2D,
        tanggalBAST: normalizeDateToIso(r.tanggalBAST) || null,
        tanggalBAPP: normalizeDateToIso(r.tanggalBAPP) || null,
        tanggalMulaiPerhitungan: normalizeDateToIso(r.tanggalMulai || r.tanggalMulaiPerhitungan) || null,
        tanggalKonversiADK: normalizeDateToIso(r.tanggalKonversi || r.tanggalKonversiADK) || null,
        jumlahHariLibur: r.hariLibur ?? r.jumlahHariLibur ?? 0
      }));
    }

    return [];
  }, [project.penyelesaianTagihan]);

  // Perhitungan deterministik
  const calculation = useMemo(() => {
    return processTagihanRows(rawRows);
  }, [rawRows]);

  const { processedRows, summary } = calculation;

  // Validasi otomatis data Penyelesaian Tagihan
  const validationIssues = useMemo(() => {
    return validateTagihan(rawRows);
  }, [rawRows]);

  // Indicator result with step details for inspector
  const indicatorResult = useMemo(() => {
    return calculatePenyelesaianTagihan(rawRows, 10, true);
  }, [rawRows]);

  // Filtered rows for search/filtering
  const displayedRows = useMemo(() => {
    return processedRows.filter(r => {
      const matchSearch =
        r.nomorSPP.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.identitasTagihan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.keterangan && r.keterangan.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.no.toString() === searchQuery.trim();
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [processedRows, searchQuery, filterStatus]);

  // Handle row updates
  const handleUpdateRow = (rowIndex: number, field: keyof PenyelesaianTagihanRow, val: any) => {
    const newItems = [...rawRows];
    const isDateField = field === 'tanggalSPP' || field === 'tanggalTagihan' || field === 'tanggalDokumenPendukung' ||
                        field === 'tanggalPenyampaian' || field === 'tanggalMulai' || field === 'tanggalKonversi';
    const processedVal = isDateField ? (normalizeDateToIso(val) || null) : val;

    const currentItem = { ...newItems[rowIndex], [field]: processedVal };

    // Auto calculate holidays if auto mode is active
    if (holidayMode === 'auto' && (field === 'tanggalMulai' || field === 'tanggalKonversi')) {
      const autoHolidays = calculateHolidayDays(
        field === 'tanggalMulai' ? processedVal : currentItem.tanggalMulai,
        field === 'tanggalKonversi' ? processedVal : currentItem.tanggalKonversi
      );
      currentItem.hariLibur = autoHolidays;
      currentItem.jumlahHariLibur = autoHolidays;
    }

    newItems[rowIndex] = currentItem;
    onUpdateProject({ ...project, penyelesaianTagihan: newItems });
  };

  // Add new row
  const handleAddRow = () => {
    const nextNo = rawRows.length + 1;
    const newRow: PenyelesaianTagihanRow = {
      no: nextNo,
      identitasTagihan: `Tagihan #${nextNo}`,
      keterangan: 'SPM-LS Kontraktual Non Belanja Pegawai',
      jenisTagihan: 'SPM-LS Kontraktual',
      nomorSPP: `SPP-${String(nextNo).padStart(3, '0')}/PPK/2026`,
      tanggalSPP: '2026-04-05',
      tanggalTagihan: '2026-04-01',
      tanggalDokumenPendukung: '2026-04-01',
      tanggalPenyampaian: '2026-04-15',
      tanggalMulai: '2026-04-01',
      tanggalKonversi: '2026-04-15',
      selisihHari: 14,
      hariLibur: 2,
      jumlahHariEfektif: 12,
      status: 'TEPAT',
      keteranganHasil: 'Tepat Waktu (12 hari <= 17)',
      nilaiSP2D: 100000000
    };
    onUpdateProject({ ...project, penyelesaianTagihan: [...rawRows, newRow] });
  };

  // Duplicate row
  const handleDuplicateRow = (index: number) => {
    const target = rawRows[index];
    const nextNo = rawRows.length + 1;
    const duplicated: PenyelesaianTagihanRow = {
      ...target,
      no: nextNo,
      nomorSPP: `${target.nomorSPP}-COPY`
    };
    onUpdateProject({ ...project, penyelesaianTagihan: [...rawRows, duplicated] });
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    if (rawRows.length <= 1) {
      alert('Minimal terdapat 1 data tagihan dalam tabel.');
      return;
    }
    const filtered = rawRows.filter((_, i) => i !== index).map((item, idx) => ({
      ...item,
      no: idx + 1
    }));
    onUpdateProject({ ...project, penyelesaianTagihan: filtered });
  };

  // Optimize: Set all conversion dates to be strictly <= 17 effective days
  const handleOptimizeAllOnTime = () => {
    const optimized = rawRows.map(r => {
      const tglMulai = r.tanggalMulai || '2026-04-01';
      // Tambah 14 hari kalender dari tanggal mulai agar selisih kalender 14 hari <= 17
      const p = tglMulai.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      let tglKonversi = r.tanggalKonversi || tglMulai;
      if (p) {
        const d = new Date(Date.UTC(Number(p[1]), Number(p[2]) - 1, Number(p[3])));
        d.setUTCDate(d.getUTCDate() + 14);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        tglKonversi = `${y}-${m}-${day}`;
      }

      return {
        ...r,
        tanggalMulai: tglMulai,
        tanggalKonversi: tglKonversi,
        hariLibur: r.hariLibur ?? 0
      };
    });
    onUpdateProject({ ...project, penyelesaianTagihan: optimized });
  };

  // Reset to default 26 rows from workbook
  const handleResetToExcelDefault = () => {
    const defaultData: PenyelesaianTagihanRow[] = DEFAULT_EXCEL_TAGIHAN_ROWS.map((r: any, idx: number) => ({
      no: r.id || idx + 1,
      identitasTagihan: r.noSp2d || `Tagihan #${r.id}`,
      keterangan: 'SPM-LS Kontraktual Non Belanja Pegawai',
      jenisTagihan: 'SPM-LS Kontraktual',
      nomorSPP: r.noSpm || `SPP-${r.id}`,
      tanggalSPP: normalizeDateToIso(r.tanggalSpm),
      tanggalTagihan: normalizeDateToIso(r.tanggalBast),
      tanggalDokumenPendukung: normalizeDateToIso(r.tanggalBast),
      tanggalPenyampaian: normalizeDateToIso(r.tanggalKonversiAdk),
      tanggalMulai: normalizeDateToIso(r.tanggalMulaiPerhitungan),
      tanggalKonversi: normalizeDateToIso(r.tanggalKonversiAdk),
      selisihHari: r.selisihHari,
      hariLibur: r.jumlahHariLibur ?? 0,
      jumlahHariEfektif: r.jumlahHariFinal,
      status: (r.status || 'TEPAT') as "TEPAT" | "TERLAMBAT",
      keteranganHasil: r.status === 'TEPAT' ? 'Tepat Waktu (<= 17 hari)' : 'Terlambat (> 17 hari)',
      satker: r.satker,
      nomorSPM: r.noSpm,
      tanggalSPM: normalizeDateToIso(r.tanggalSpm),
      nomorSP2D: r.noSp2d,
      tanggalSP2D: normalizeDateToIso(r.tanggalSp2d),
      nilaiSP2D: r.nilaiSp2d,
      tanggalBAST: normalizeDateToIso(r.tanggalBast),
      tanggalBAPP: normalizeDateToIso(r.tanggalBapp),
      tanggalMulaiPerhitungan: normalizeDateToIso(r.tanggalMulaiPerhitungan),
      tanggalKonversiADK: normalizeDateToIso(r.tanggalKonversiAdk),
      jumlahHariLibur: r.jumlahHariLibur
    }));
    onUpdateProject({ ...project, penyelesaianTagihan: defaultData });
  };

  // Kosongkan seluruh data tagihan ke 0
  const handleClearForm = () => {
    if (window.confirm('Kosongkan formulir Penyelesaian Tagihan? Seluruh baris data tagihan (SPM-LS) akan dihapus.')) {
      onUpdateProject({ ...project, penyelesaianTagihan: [] });
    }
  };

  // Save to LocalStorage
  const handleSaveToLocalStorage = () => {
    try {
      localStorage.setItem('ikpa_penyelesaian_tagihan_backup', JSON.stringify(rawRows));
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rawRows, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Penyelesaian_Tagihan_IKPA_${new Date().toISOString().slice(0, 10)}.json`);
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
          const validated: PenyelesaianTagihanRow[] = parsed.map((item, idx) => ({
            no: idx + 1,
            identitasTagihan: item.identitasTagihan || item.satker || item.nomorSP2D || `Tagihan #${idx + 1}`,
            keterangan: item.keterangan || 'SPM-LS Kontraktual Non Belanja Pegawai',
            jenisTagihan: item.jenisTagihan || 'SPM-LS Kontraktual',
            nomorSPP: item.nomorSPP || item.nomorSPM || `SPP-${idx + 1}`,
            tanggalSPP: normalizeDateToIso(item.tanggalSPP || item.tanggalSPM) || null,
            tanggalTagihan: normalizeDateToIso(item.tanggalTagihan || item.tanggalBAST) || null,
            tanggalDokumenPendukung: normalizeDateToIso(item.tanggalDokumenPendukung || item.tanggalBAPP || item.tanggalBAST) || null,
            tanggalPenyampaian: normalizeDateToIso(item.tanggalPenyampaian || item.tanggalKonversiADK) || null,
            tanggalMulai: normalizeDateToIso(item.tanggalMulai || item.tanggalMulaiPerhitungan) || null,
            tanggalKonversi: normalizeDateToIso(item.tanggalKonversi || item.tanggalKonversiADK) || null,
            selisihHari: item.selisihHari ?? null,
            hariLibur: item.hariLibur ?? item.jumlahHariLibur ?? 0,
            jumlahHariEfektif: item.jumlahHariEfektif ?? item.jumlahHariFinal ?? null,
            status: item.status || 'TEPAT',
            keteranganHasil: item.keteranganHasil || ''
          }));
          onUpdateProject({ ...project, penyelesaianTagihan: validated });
          alert(`Berhasil mengimpor ${validated.length} data tagihan.`);
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
    const text = `=== HASIL KALKULASI PENYELESAIAN TAGIHAN IKPA 2026 ===
Nilai Indikator (R6): ${formatScore(summary.nilaiIndikator)}
Nilai Berbobot (K8, Bobot 10%): ${formatScore(summary.weightedValue)}

REKAPITULASI STATUS (COUNTIF):
- Jumlah Tepat Waktu (Q4): ${summary.jumlahTepatWaktu} tagihan
- Jumlah Terlambat (R4): ${summary.jumlahTerlambat} tagihan
- Total Tagihan (S4): ${summary.totalTagihan} tagihan
- Rasio Ketepatan: ${summary.totalTagihan > 0 ? ((summary.jumlahTepatWaktu / summary.totalTagihan) * 100).toFixed(2) : '0.00'}%

KETENTUAN FORMULA:
- L = K - J (Selisih Hari Kalender)
- N = L - M (Jumlah Hari Efektif)
- O = IF(N <= 17, "TEPAT", "TERLAMBAT")
- R6 = Q4 / S4 * 100 (Threshold tepat 17 hari)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run Golden Test
  const handleRunGoldenTest = () => {
    const result = runPenyelesaianTagihanGoldenTest(rawRows);
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
                Bobot 10% | Sel R6 & K8
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-sky-600 dark:text-sky-400">
                Excel Sheet: Penyelesaian Tagihan
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                Threshold: ≤ 17 Hari Kerja/Efektif
              </span>
            </div>

            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Kalkulator Indikator Penyelesaian Tagihan
            </h3>
            <p className={`text-xs max-w-3xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Ruang lingkup: <strong className="text-slate-700 dark:text-slate-300">SPM-LS Kontraktual Non Belanja Pegawai</strong>.
              Formula deterministik:
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 ml-1">
                L = K - J | N = L - M | O = IF(N&le;17, &quot;TEPAT&quot;, &quot;TERLAMBAT&quot;) | R6 = Q4/S4*100
              </span>.
            </p>
          </div>

          {/* Metric Badges & Inspector Trigger */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <div className="text-right pr-3 border-r border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Nilai Indikator (R6)
                </span>
                <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatScore(summary.nilaiIndikator)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Nilai Berbobot (K8)
                </span>
                <span className="text-2xl font-black font-mono text-sky-600 dark:text-sky-400">
                  {formatScore(summary.weightedValue)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <IndikatorCalculateButton
                indicatorKey="penyelesaianTagihan"
                indicatorName="Penyelesaian Tagihan"
                weight={10}
                indicatorResult={indicatorResult}
                validationIssues={validationIssues}
                satkerName={project.metadata?.namaSatker || project.name}
                isDark={isDark}
              />

              <button
                id="btn-formula-inspector-tagihan"
                onClick={() => onOpenInspector(
                  'Indikator Penyelesaian Tagihan',
                  'R6 & K8',
                  '=Q4/S4*100 = COUNTIF(TEPAT) / (COUNTIF(TEPAT) + COUNTIF(TERLAMBAT)) * 100',
                  formatScore(summary.nilaiIndikator),
                  indicatorResult?.details || []
                )}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
              >
                <Calculator className="h-3.5 w-3.5 text-emerald-600" />
                Formula Inspector
              </button>

              <button
                id="btn-verify-golden-test-tagihan"
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

      {/* Banner Validasi Data Input */}
      <IndikatorValidationBanner
        indicatorName="Penyelesaian Tagihan"
        issues={validationIssues}
        isConfirmed={isValidationConfirmed}
        onToggleConfirm={() => setIsValidationConfirmed(!isValidationConfirmed)}
        isDark={isDark}
      />

      {/* Petunjuk Pengisian & Cara Menggunakan */}
      <PetunjukPengisianCard
        indicatorId="tagihan"
        isDark={isDark}
        defaultExpanded={true}
      />

      {/* 2. Summary Cards (Item 23 & 24) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* TEPAT WAKTU (Q4) */}
        <div className={`p-4 rounded-xl border transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              TEPAT WAKTU (Q4)
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 block">
              {summary.jumlahTepatWaktu}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Hari Efektif ≤ 17 hari
            </span>
          </div>
        </div>

        {/* TERLAMBAT (R4) */}
        <div className={`p-4 rounded-xl border transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
              TERLAMBAT (R4)
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 block">
              {summary.jumlahTerlambat}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Hari Efektif &gt; 17 hari
            </span>
          </div>
        </div>

        {/* TOTAL TAGIHAN (S4) */}
        <div className={`p-4 rounded-xl border transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
              TOTAL TAGIHAN (S4)
            </span>
            <span className="font-mono text-xs text-slate-400">=Q4+R4</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-sky-600 dark:text-sky-400 block">
              {summary.totalTagihan}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              SPM LS Kontraktual
            </span>
          </div>
        </div>

        {/* RASIO & NILAI (R6) */}
        <div className={`p-4 rounded-xl border transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
              NILAI INDIKATOR (R6)
            </span>
            <span className="font-mono text-xs text-slate-400">=Q4/S4*100</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 block">
              {formatScore(summary.nilaiIndikator)}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {summary.totalTagihan > 0 ? ((summary.jumlahTepatWaktu / summary.totalTagihan) * 100).toFixed(2) : '0.00'}% Tepat
            </span>
          </div>
        </div>
      </div>

      {/* 3. Toolbar: View Mode, Holiday Mode, Search, Filter & Actions */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-xl p-1 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <button
              id="tab-view-excel-tagihan"
              onClick={() => setViewMode('excel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'excel'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tampilan Excel (Kolom A-S)
            </button>
            <button
              id="tab-view-cards-tagihan"
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

          {/* Holiday Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Hari Libur:</span>
            <button
              onClick={() => setHolidayMode('manual')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                holidayMode === 'manual'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Gunakan nilai input manual sesuai workbook Excel"
            >
              Manual (Excel)
            </button>
            <button
              onClick={() => setHolidayMode('auto')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                holidayMode === 'auto'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Hitung otomatis akhir pekan & libur"
            >
              Otomatis
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SPP, tagihan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 sm:w-48"
            />
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Semua Status</option>
              <option value="TEPAT">Hanya TEPAT (≤ 17 hr)</option>
              <option value="TERLAMBAT">Hanya TERLAMBAT (&gt; 17 hr)</option>
              <option value="BELUM LENGKAP">Belum Lengkap</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-tambah-tagihan"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Tagihan
          </button>

          <button
            id="btn-optimasi-tagihan"
            onClick={handleOptimizeAllOnTime}
            title="Setel tanggal konversi semua tagihan agar tepat waktu (≤ 17 hari)"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" /> Optimasi
          </button>

          <button
            id="btn-salin-ringkasan-tagihan"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Tersalin' : 'Salin'}
          </button>

          <button
            id="btn-simpan-tagihan"
            onClick={handleSaveToLocalStorage}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {savedFeedback ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Save className="h-3.5 w-3.5" />}
            {savedFeedback ? 'Tersimpan!' : 'Simpan'}
          </button>

          <button
            id="btn-reset-excel-tagihan"
            onClick={handleResetToExcelDefault}
            title="Reset ke 26 baris data default workbook Excel"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Excel
          </button>

          <button
            id="btn-clear-tagihan"
            onClick={handleClearForm}
            title="Kosongkan seluruh baris data tagihan"
            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 px-2.5 py-1.5 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300"
          >
            <Eraser className="h-3.5 w-3.5 text-rose-500" /> Kosongkan Formulir
          </button>

          <button
            id="btn-export-tagihan-json"
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

      {/* 4. VIEW MODE: Tampilan Excel (Kolom A s.d. S, Baris 4 s.d. 29 & Summary Q4, R4, S4, R6) */}
      {viewMode === 'excel' && (
        <div className={`rounded-2xl border overflow-hidden transition-all shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Sheet Excel: Penyelesaian Tagihan (Kolom A – S)
              </h4>
              <span className="text-xs text-slate-400">
                (Baris 4 s.d. 29: Transaksi SPM-LS, Summary: Q4, R4, S4, R6)
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Menampilkan {displayedRows.length} dari {processedRows.length} tagihan
            </span>
          </div>

          <div className="overflow-x-auto max-h-[620px]">
            <table className="w-full text-left text-xs border-collapse min-w-[1400px]">
              {/* Header Kolom Huruf Excel (A s.d. S) */}
              <thead className="sticky top-0 z-20 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
                <tr className="text-center font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800/90 w-12">A</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-32">B</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-44">C</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-32">D</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-36">E</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-28">F</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-28">G</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-28">H</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-28">I</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 w-28">J</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 w-28">K</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300 w-20">L</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 w-20">M</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 w-24">N</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 bg-emerald-100/70 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 w-24">O</th>
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 w-36">P</th>
                  <th className="py-1 px-2 w-16">Aksi</th>
                </tr>
                {/* Header Judul Kolom */}
                <tr className="border-b border-slate-300 dark:border-slate-700 text-left font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center">No.</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700">Nomor/Nama Tagihan</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700">Keterangan</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700">Jenis Tagihan</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700">Nomor SPP</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center">Tgl SPP</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center">Tgl Tagihan</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center">Tgl BAST/BAPP</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center">Tgl Penyampaian</th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                    Tgl Mulai (J)
                  </th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                    Tgl Konversi (K)
                  </th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-sky-50/70 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300">
                    Selisih (L=K-J)
                  </th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
                    Hari Libur (M)
                  </th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300">
                    Hari Efektif (N=L-M)
                  </th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300">
                    Status (O)
                  </th>
                  <th className="py-2.5 px-2 border-r border-slate-200 dark:border-slate-700">Keterangan Hasil</th>
                  <th className="py-2.5 px-2 text-center">Aksi</th>
                </tr>
              </thead>

              {/* Baris 4 s.d. 29 (Data Transaksi Tagihan) */}
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                {displayedRows.map((r) => {
                  const originalIndex = rawRows.findIndex(raw => (raw.no || 0) === r.no);
                  const targetIdx = originalIndex >= 0 ? originalIndex : r.no - 1;

                  return (
                    <tr
                      key={r.no}
                      className={`transition-colors ${
                        r.status === 'TERLAMBAT'
                          ? 'bg-rose-50/30 dark:bg-rose-950/10 hover:bg-rose-50/60'
                          : isDark
                          ? 'hover:bg-slate-800/50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Kolom A: No */}
                      <td className="py-2 px-2 text-center font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-700">
                        {r.no}
                      </td>

                      {/* Kolom B: Identitas Tagihan */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700">
                        <input
                          type="text"
                          value={r.identitasTagihan}
                          onChange={(e) => handleUpdateRow(targetIdx, 'identitasTagihan', e.target.value)}
                          className="w-full bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
                        />
                      </td>

                      {/* Kolom C: Keterangan */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 font-sans text-[11px]">
                        <input
                          type="text"
                          value={r.keterangan}
                          onChange={(e) => handleUpdateRow(targetIdx, 'keterangan', e.target.value)}
                          className="w-full bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
                        />
                      </td>

                      {/* Kolom D: Jenis Tagihan */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                        <input
                          type="text"
                          value={r.jenisTagihan}
                          onChange={(e) => handleUpdateRow(targetIdx, 'jenisTagihan', e.target.value)}
                          className="w-full bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
                        />
                      </td>

                      {/* Kolom E: Nomor SPP */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 font-semibold">
                        <input
                          type="text"
                          value={r.nomorSPP}
                          onChange={(e) => handleUpdateRow(targetIdx, 'nomorSPP', e.target.value)}
                          className="w-full bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
                        />
                      </td>

                      {/* Kolom F: Tanggal SPP */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-center">
                        <input
                          type="date"
                          value={r.tanggalSPP || ''}
                          onChange={(e) => handleUpdateRow(targetIdx, 'tanggalSPP', e.target.value)}
                          className="w-28 bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 text-[11px]"
                        />
                      </td>

                      {/* Kolom G: Tanggal Tagihan */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-center">
                        <input
                          type="date"
                          value={r.tanggalTagihan || ''}
                          onChange={(e) => handleUpdateRow(targetIdx, 'tanggalTagihan', e.target.value)}
                          className="w-28 bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 text-[11px]"
                        />
                      </td>

                      {/* Kolom H: Tanggal Dokumen Pendukung */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-center">
                        <input
                          type="date"
                          value={r.tanggalDokumenPendukung || ''}
                          onChange={(e) => handleUpdateRow(targetIdx, 'tanggalDokumenPendukung', e.target.value)}
                          className="w-28 bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 text-[11px]"
                        />
                      </td>

                      {/* Kolom I: Tanggal Penyampaian */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-center">
                        <input
                          type="date"
                          value={r.tanggalPenyampaian || ''}
                          onChange={(e) => handleUpdateRow(targetIdx, 'tanggalPenyampaian', e.target.value)}
                          className="w-28 bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 text-[11px]"
                        />
                      </td>

                      {/* Kolom J: Tanggal Mulai (Input Kunci) */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-50/40 dark:bg-emerald-950/20">
                        <input
                          type="date"
                          value={r.tanggalMulai || ''}
                          onChange={(e) => handleUpdateRow(targetIdx, 'tanggalMulai', e.target.value)}
                          className="w-28 bg-transparent px-1 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 font-semibold text-emerald-800 dark:text-emerald-300 text-[11px]"
                        />
                      </td>

                      {/* Kolom K: Tanggal Konversi (Input Kunci) */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-emerald-50/40 dark:bg-emerald-950/20">
                        <input
                          type="date"
                          value={r.tanggalKonversi || ''}
                          onChange={(e) => handleUpdateRow(targetIdx, 'tanggalKonversi', e.target.value)}
                          className={`w-28 bg-transparent px-1 py-0.5 rounded border text-[11px] font-semibold ${
                            r.isDateReversed
                              ? 'border-rose-400 bg-rose-50 text-rose-700'
                              : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                          } focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 text-emerald-800 dark:text-emerald-300`}
                        />
                        {r.isDateReversed && (
                          <span className="block text-[9px] text-rose-600 font-sans mt-0.5 font-normal">
                            Konversi &lt; Mulai
                          </span>
                        )}
                      </td>

                      {/* Kolom L: Selisih Hari Kalender (=K - J) */}
                      <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-sky-50/40 dark:bg-sky-950/20 font-bold text-sky-700 dark:text-sky-300">
                        {r.selisihHari !== null ? r.selisihHari : '-'}
                      </td>

                      {/* Kolom M: Hari Libur */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-amber-50/40 dark:bg-amber-950/20">
                        <input
                          type="number"
                          min="0"
                          value={r.hariLibur}
                          onChange={(e) => handleUpdateRow(targetIdx, 'hariLibur', Math.max(0, Number(e.target.value)))}
                          className="w-14 text-center bg-transparent py-0.5 rounded font-bold text-amber-700 dark:text-amber-300 border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                        />
                      </td>

                      {/* Kolom N: Hari Efektif (=L - M) */}
                      <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-center bg-indigo-50/40 dark:bg-indigo-950/20 font-bold text-indigo-700 dark:text-indigo-300">
                        {r.jumlahHariEfektif !== null ? r.jumlahHariEfektif : '-'}
                      </td>

                      {/* Kolom O: Status (=IF(N<=17,"TEPAT","TERLAMBAT")) */}
                      <td className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-700 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'TEPAT'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : r.status === 'TERLAMBAT'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {r.status === 'TEPAT' && <Check className="h-3 w-3" />}
                          {r.status === 'TERLAMBAT' && <AlertTriangle className="h-3 w-3" />}
                          {r.status}
                        </span>
                      </td>

                      {/* Kolom P: Keterangan Hasil */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700 font-sans text-slate-600 dark:text-slate-400">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate max-w-[120px]">{r.keteranganHasil}</span>
                          <button
                            onClick={() => setSelectedAuditRow(r)}
                            title="Audit Detail Perhitungan Baris Ini"
                            className="text-[10px] text-sky-600 hover:underline shrink-0"
                          >
                            Detail
                          </button>
                        </div>
                      </td>

                      {/* Kolom Aksi */}
                      <td className="py-1 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Duplikat baris tagihan ini"
                            onClick={() => handleDuplicateRow(targetIdx)}
                            className="p-1 text-slate-400 hover:text-sky-600 transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <button
                            title="Hapus baris tagihan ini"
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

                {displayedRows.length === 0 && (
                  <tr>
                    <td colSpan={17} className="py-12 px-4 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                            Belum Ada Baris Tagihan SPM-LS
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Settingan awal bersih (0 baris). Satker dapat menambahkan baris tagihan satu per satu secara mandiri tanpa harus merasa berkewajiban mengisi puluhan baris data.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                          <button
                            onClick={handleAddRow}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            + Tambah Baris Tagihan
                          </button>
                          <button
                            onClick={handleResetToExcelDefault}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs cursor-pointer"
                          >
                            Muat 26 Contoh Data Excel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* ==================================================
                  SUMMARY & REKAPITULASI SESUAI EXCEL (Q4, R4, S4, R6)
                  ================================================== */}
              <tfoot className="border-t-2 border-slate-400 dark:border-slate-600 font-mono text-[11px] font-bold">
                {/* Baris Summary Q4, R4, S4 */}
                <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <td colSpan={10} className="py-2.5 px-3 text-right font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
                    REKAPITULASI TRANSAKSI :
                  </td>
                  <td colSpan={2} className="py-2 px-2 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-r border-slate-200 dark:border-slate-700">
                    TEPAT (Q4) = {summary.jumlahTepatWaktu}
                  </td>
                  <td colSpan={2} className="py-2 px-2 text-center font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-r border-slate-200 dark:border-slate-700">
                    TERLAMBAT (R4) = {summary.jumlahTerlambat}
                  </td>
                  <td colSpan={2} className="py-2 px-2 text-center font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-r border-slate-200 dark:border-slate-700">
                    TOTAL (S4 = Q4+R4) = {summary.totalTagihan}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-400">-</td>
                </tr>

                {/* Baris Formula R6: NILAI INDIKATOR = Q4/S4*100 */}
                <tr className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 text-xs font-black">
                  <td colSpan={10} className="py-3 px-3 text-right font-bold text-emerald-800 dark:text-emerald-300 border-r border-emerald-200 dark:border-emerald-800 tracking-wide">
                    NILAI PENYELESAIAN TAGIHAN (SEL R6 = Q4 / S4 × 100) :
                  </td>
                  <td colSpan={6} className="py-3 px-4 text-center font-black text-lg text-emerald-600 dark:text-emerald-300 border-r border-emerald-200 dark:border-emerald-800 font-mono">
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
              Daftar Tagihan SPM-LS ({displayedRows.length} Berkas)
            </h4>
            <span className="text-xs text-slate-500">
              Input tanggal mulai & konversi di bawah. Selisih hari & status ketepatan waktu dikalkulasi deterministik.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedRows.map((r) => {
              const originalIndex = rawRows.findIndex(raw => (raw.no || 0) === r.no);
              const targetIdx = originalIndex >= 0 ? originalIndex : r.no - 1;

              return (
                <div
                  key={r.no}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    r.status === 'TERLAMBAT'
                      ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-slate-900/90'
                      : isDark
                      ? 'bg-slate-900/80 border-slate-800'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                        #{r.no}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {r.nomorSPP}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedAuditRow(r)}
                        title="Audit Detail"
                        className="text-xs text-sky-600 font-semibold hover:underline px-1"
                      >
                        Audit
                      </button>
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

                  {/* Identitas Tagihan & Jenis */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block uppercase font-medium">Nomor SPP</label>
                      <input
                        type="text"
                        value={r.nomorSPP}
                        onChange={(e) => handleUpdateRow(targetIdx, 'nomorSPP', e.target.value)}
                        className="w-full mt-0.5 px-2 py-1 text-xs font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block uppercase font-medium">Jenis Tagihan</label>
                      <input
                        type="text"
                        value={r.jenisTagihan}
                        onChange={(e) => handleUpdateRow(targetIdx, 'jenisTagihan', e.target.value)}
                        className="w-full mt-0.5 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  {/* Input Tanggal Kunci: Tanggal Mulai (J) & Tanggal Konversi (K) */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase font-bold">
                          Tanggal Mulai (J)
                        </label>
                        <input
                          type="date"
                          value={r.tanggalMulai || ''}
                          onChange={(e) => handleUpdateRow(targetIdx, 'tanggalMulai', e.target.value)}
                          className="w-full mt-0.5 px-2 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase font-bold">
                          Tanggal Konversi (K)
                        </label>
                        <input
                          type="date"
                          value={r.tanggalKonversi || ''}
                          onChange={(e) => handleUpdateRow(targetIdx, 'tanggalKonversi', e.target.value)}
                          className={`w-full mt-0.5 px-2 py-1 text-xs font-mono rounded-lg border bg-white dark:bg-slate-800 ${
                            r.isDateReversed ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Hari Libur (M) */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[11px] text-slate-500">Hari Libur (M):</span>
                      <input
                        type="number"
                        min="0"
                        value={r.hariLibur}
                        onChange={(e) => handleUpdateRow(targetIdx, 'hariLibur', Math.max(0, Number(e.target.value)))}
                        className="w-20 px-2 py-0.5 text-xs font-mono text-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  {/* Hasil Kalkulasi Otomatis (L, N, O) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Selisih Kalender (L=K-J):</span>
                      <span className="font-bold text-sky-600">
                        {r.selisihHari !== null ? `${r.selisihHari} hari` : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Hari Efektif (N=L-M):</span>
                      <span className="font-bold text-indigo-600">
                        {r.jumlahHariEfektif !== null ? `${r.jumlahHariEfektif} hari` : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-400">Status (O):</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        r.status === 'TEPAT'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : r.status === 'TERLAMBAT'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {r.status === 'TEPAT' && <Check className="h-3 w-3" />}
                        {r.status === 'TERLAMBAT' && <AlertTriangle className="h-3 w-3" />}
                        {r.status}
                      </span>
                    </div>
                  </div>

                  {r.isDateReversed && (
                    <div className="flex items-center gap-1 text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-1.5 rounded-lg border border-rose-200 dark:border-rose-800/40">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>Tanggal konversi lebih awal daripada tanggal mulai.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Modal Audit Detail Perhitungan Baris (Item 25 & 26) */}
      {selectedAuditRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-sky-500/10 p-2 text-sky-600">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Audit Perhitungan Tagihan #{selectedAuditRow.no}</h3>
                  <p className="text-xs text-slate-500">
                    Formula Excel: L = K - J | N = L - M | Status = IF(N &le; 17, &quot;TEPAT&quot;, &quot;TERLAMBAT&quot;)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAuditRow(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between font-sans">
                  <span className="text-slate-400">Nomor SPP:</span>
                  <span className="font-bold">{selectedAuditRow.nomorSPP}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal Mulai (J):</span>
                  <span>{selectedAuditRow.tanggalMulai || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal Konversi (K):</span>
                  <span>{selectedAuditRow.tanggalKonversi || '-'}</span>
                </div>
                <div className="flex justify-between text-sky-600 font-bold border-t border-slate-200 dark:border-slate-700 pt-1.5">
                  <span>Selisih Hari Kalender (L = K - J):</span>
                  <span>{selectedAuditRow.selisihHari} hari</span>
                </div>
                <div className="flex justify-between text-amber-600 font-bold">
                  <span>Hari Libur (M):</span>
                  <span>{selectedAuditRow.hariLibur} hari</span>
                </div>
                <div className="flex justify-between text-indigo-600 font-bold border-t border-slate-200 dark:border-slate-700 pt-1.5">
                  <span>Jumlah Hari Efektif (N = L - M):</span>
                  <span>{selectedAuditRow.jumlahHariEfektif} hari</span>
                </div>
              </div>

              {/* Ketentuan Status */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                selectedAuditRow.status === 'TEPAT'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50'
              }`}>
                <div>
                  <span className="text-[11px] block font-sans text-slate-500">
                    Hasil Status Ketepatan Waktu:
                  </span>
                  <span className="font-bold font-sans text-xs">
                    {selectedAuditRow.status === 'TEPAT'
                      ? `Karena ${selectedAuditRow.jumlahHariEfektif} hari efektif <= 17 hari`
                      : `Karena ${selectedAuditRow.jumlahHariEfektif} hari efektif > 17 hari`}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-lg font-bold text-xs ${
                  selectedAuditRow.status === 'TEPAT'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}>
                  {selectedAuditRow.status}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedAuditRow(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs hover:opacity-90"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Golden Test Excel Verifier (Item 31) */}
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
                    Pengujian otomatis 8 test cases wajib sheet &ldquo;Penyelesaian Tagihan&rdquo; workbook referensi.
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
                      <th className="py-2 px-3 font-sans">Skenario Formula</th>
                      <th className="py-2 px-3 text-right">Target</th>
                      <th className="py-2 px-3 text-right">Aplikasi</th>
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
                        <td className="py-2 px-3 text-right text-slate-500">{JSON.stringify(chk.expected)}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100">{JSON.stringify(chk.actual)}</td>
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
                Formula ketepatan waktu strictly menggunakan threshold &le; 17 hari kerja.
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
