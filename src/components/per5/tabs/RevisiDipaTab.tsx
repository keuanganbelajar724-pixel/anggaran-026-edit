import React, { useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
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
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2
} from 'lucide-react';
import { SimulationProject, RevisiDIPAInput, RevisionDipaRow } from '../../../models/ikpa';
import {
  VALID_REVISION_CODES,
  VALID_REVISION_CODE_MAP,
  parseRevisionCodes,
  checkRevisionCodes,
  calculateRevisionEligibility,
  calculateSemesterIKPA,
  calculateFinalRevisionScore,
  calculateRevisiDIPA,
  runRevisiDipaGoldenTest,
  GoldenTestVerificationResult,
  REVISI_DIPA_GOLDEN_INPUTS
} from '../../../calculations/revisiDipa';
import { formatRupiah } from '../../../utils/excelReferenceDataHelper';
import { normalizeDateToIso } from '../../../utils/ikpaDateUtils';
import { validateRevisiDIPA } from '../../../utils/indikatorValidation';
import { IndikatorValidationBanner } from '../common/IndikatorValidationBanner';
import { IndikatorCalculateButton } from '../common/IndikatorCalculateButton';
import { PetunjukPengisianCard } from '../common/PetunjukPengisianCard';

interface RevisiDipaTabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const RevisiDipaTab: React.FC<RevisiDipaTabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  // Ambil data baris revisiDIPA dari project (0 baris default jika kosong)
  const rawInputs: RevisiDIPAInput[] = useMemo(() => {
    if (project.revisiDIPA !== undefined && Array.isArray(project.revisiDIPA)) {
      return project.revisiDIPA;
    }
    return [];
  }, [project.revisiDIPA]);

  // Hitung tabel periode deterministik sesuai formula Excel
  const calculatedRows: RevisionDipaRow[] = useMemo(() => {
    return calculateSemesterIKPA(rawInputs);
  }, [rawInputs]);

  // Hitung hasil indikator lengkap
  const indicatorResult = useMemo(() => {
    return calculateRevisiDIPA(calculatedRows, 10, true);
  }, [calculatedRows]);

  const sem1Count = calculatedRows.filter(r => r.no <= 6 && r.diperhitungkan === 'diperhitungkan').length;
  const sem2Count = calculatedRows.filter(r => r.no > 6 && r.diperhitungkan === 'diperhitungkan').length;
  const lastSem1 = [...calculatedRows].filter(r => r.no <= 6).pop();
  const lastSem2 = [...calculatedRows].filter(r => r.no > 6).pop();
  const l9Value = lastSem1 ? lastSem1.nilaiIndikator : 110;
  const l15Value = lastSem2 ? lastSem2.nilaiIndikator : 50;
  const m15Value = calculatedRows.length > 0 ? calculatedRows[calculatedRows.length - 1].nilaiIKPA : 0;
  const finalScore = calculateFinalRevisionScore(calculatedRows);

  // State draft input untuk nilai rupiah agar nyaman diketik tanpa re-format mendadak
  const [draftPaguSebelum, setDraftPaguSebelum] = useState<Record<number, string>>({});
  const [draftPaguMenjadi, setDraftPaguMenjadi] = useState<Record<number, string>>({});

  // State toast dan feedback UI
  const [copied, setCopied] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [goldenTestResult, setGoldenTestResult] = useState<GoldenTestVerificationResult | null>(null);
  const [show14ReferenceModal, setShow14ReferenceModal] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(true);
  const [isValidationConfirmed, setIsValidationConfirmed] = useState(false);

  // Validasi otomatis input data Revisi DIPA
  const validationIssues = useMemo(() => {
    return validateRevisiDIPA(rawInputs);
  }, [rawInputs]);

  // Tambah 1 baris revisi berikutnya
  const handleAddRow = () => {
    const nextNo = rawInputs.length + 1;
    const periode = String(nextNo).padStart(2, '0');
    const isSem1 = nextNo <= 6;
    const newRow: RevisiDIPAInput = {
      no: nextNo,
      periode,
      revisiKe: null,
      tanggalRevisi: null,
      kodeJenisRevisi: '',
      paguDipaSebelum: null,
      paguDipaMenjadi: null,
      paguSebelum: null,
      paguMenjadi: null,
      jenisRevisi14: '-',
      empatBelasJenis: '-',
      keterangan: isSem1 ? 'Semester I' : 'Semester II'
    };
    onUpdateProject({
      ...project,
      revisiDIPA: [...rawInputs, newRow]
    });
  };

  // Tambah Semester I (6 baris)
  const handleAddSemester1 = () => {
    const sem1Rows: RevisiDIPAInput[] = Array.from({ length: 6 }, (_, i) => {
      const no = i + 1;
      const existing = rawInputs.find(r => r.no === no);
      if (existing) return existing;
      return {
        no,
        periode: String(no).padStart(2, '0'),
        revisiKe: null,
        tanggalRevisi: null,
        kodeJenisRevisi: '',
        paguDipaSebelum: null,
        paguDipaMenjadi: null,
        paguSebelum: null,
        paguMenjadi: null,
        jenisRevisi14: '-',
        empatBelasJenis: '-',
        keterangan: 'Semester I'
      };
    });
    const rest = rawInputs.filter(r => r.no > 6);
    onUpdateProject({
      ...project,
      revisiDIPA: [...sem1Rows, ...rest].sort((a, b) => a.no - b.no)
    });
  };

  // Tambah 12 Baris Lengkap (Sem I & Sem II)
  const handleAdd12Rows = () => {
    const all12: RevisiDIPAInput[] = Array.from({ length: 12 }, (_, i) => {
      const no = i + 1;
      const existing = rawInputs.find(r => r.no === no);
      if (existing) return existing;
      return {
        no,
        periode: String(no).padStart(2, '0'),
        revisiKe: null,
        tanggalRevisi: null,
        kodeJenisRevisi: '',
        paguDipaSebelum: null,
        paguDipaMenjadi: null,
        paguSebelum: null,
        paguMenjadi: null,
        jenisRevisi14: '-',
        empatBelasJenis: '-',
        keterangan: i < 6 ? 'Semester I' : 'Semester II'
      };
    });
    onUpdateProject({
      ...project,
      revisiDIPA: all12
    });
  };

  // Hapus baris - dapat menghapus seluruh baris sampai 0 baris (N/A)
  const handleDeleteRow = (index: number) => {
    const updated = rawInputs.filter((_, i) => i !== index).map((r, i) => ({
      ...r,
      no: i + 1,
      periode: String(i + 1).padStart(2, '0'),
      keterangan: i < 6 ? 'Semester I' : 'Semester II'
    }));
    onUpdateProject({
      ...project,
      revisiDIPA: updated,
      activeIndicators: {
        ...project.activeIndicators,
        revisiDIPA: updated.length > 0 ? (project.activeIndicators?.revisiDIPA ?? true) : false
      }
    });
  };

  // Toggle apakah indikator Revisi DIPA diperhitungkan (10%) atau Tidak Diperhitungkan (N/A)
  const handleToggleActiveIndicator = () => {
    const isCurrentlyActive = (project.activeIndicators?.revisiDIPA !== false) && rawInputs.length > 0;
    if (isCurrentlyActive) {
      onUpdateProject({
        ...project,
        activeIndicators: {
          ...project.activeIndicators,
          revisiDIPA: false
        }
      });
    } else {
      const rowsToUse = rawInputs.length > 0 ? rawInputs : (calculateSemesterIKPA(REVISI_DIPA_GOLDEN_INPUTS as any) as any);
      onUpdateProject({
        ...project,
        revisiDIPA: rowsToUse,
        activeIndicators: {
          ...project.activeIndicators,
          revisiDIPA: true
        }
      });
    }
  };

  // Update baris spesifik
  const handleUpdateRow = (
    index: number,
    updates: Partial<RevisiDIPAInput & RevisionDipaRow>
  ) => {
    if (index < 0 || index >= rawInputs.length) return;
    const updated = rawInputs.map((r, i) => {
      if (i !== index) return r;
      const merged = { ...r, ...updates };
      // Pastikan sinkronisasi nama properti
      if (updates.paguSebelum !== undefined) {
        merged.paguDipaSebelum = updates.paguSebelum;
      }
      if (updates.paguMenjadi !== undefined) {
        merged.paguDipaMenjadi = updates.paguMenjadi;
      }
      if (updates.empatBelasJenis !== undefined) {
        merged.jenisRevisi14 = updates.empatBelasJenis;
      }
      return merged;
    });

    onUpdateProject({
      ...project,
      revisiDIPA: updated as any
    });
  };

  // Reset baris tertentu ke kondisi tidak ada revisi ("-")
  const handleClearRow = (index: number) => {
    handleUpdateRow(index, {
      revisiKe: null,
      tanggalRevisi: null,
      kodeJenisRevisi: '',
      paguSebelum: null,
      paguMenjadi: null,
      empatBelasJenis: '-'
    });
  };

  // Reset seluruh tabel ke Data Standar Workbook Excel (Golden Data)
  const handleResetToGolden = () => {
    if (window.confirm('Reset seluruh data Revisi DIPA ke data standar Excel resmi (Kalkulator Perhitungan IKPA 2026)?')) {
      const resetRows = calculateSemesterIKPA(REVISI_DIPA_GOLDEN_INPUTS as any);
      onUpdateProject({
        ...project,
        revisiDIPA: resetRows as any,
        activeIndicators: {
          ...project.activeIndicators,
          revisiDIPA: true
        }
      });
      setGoldenTestResult(null);
    }
  };

  // Kosongkan seluruh tabel formulir Revisi DIPA
  const handleClearTable = () => {
    if (window.confirm('Kosongkan formulir Revisi DIPA? Seluruh baris riwayat revisi akan dihapus dan indikator ini akan dijadikan N/A (tidak diperhitungkan).')) {
      onUpdateProject({
        ...project,
        revisiDIPA: [],
        activeIndicators: {
          ...project.activeIndicators,
          revisiDIPA: false
        }
      });
      setGoldenTestResult(null);
    }
  };

  // Export data tabel ke file JSON lokal
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(calculatedRows, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const satkerLabel = project.metadata?.namaSatker || project.name || 'satker';
    a.download = `revisi_dipa_${satkerLabel}_2026.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import data tabel dari file JSON lokal
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const newRows = calculateSemesterIKPA(parsed);
          onUpdateProject({
            ...project,
            revisiDIPA: newRows as any
          });
          alert('Berhasil mengimpor data Revisi DIPA dari file JSON!');
        } else {
          alert('Format JSON tidak valid atau bukan berupa array baris revisi.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON: format file rusak atau tidak valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Salin seluruh tabel ke Clipboard format TSV (dapat langsung di-paste ke Microsoft Excel)
  const handleCopyTableToExcel = () => {
    const headers = [
      'No',
      'Periode',
      'Revisi Ke',
      'Tanggal Revisi',
      'Kode Jenis Revisi',
      'Pagu DIPA Sebelum',
      'Pagu DIPA Menjadi',
      '14 Jenis Revisi?',
      'Apakah diperhitungkan dalam Indikator Revisi DIPA',
      'Jumlah Revisi yang diperhitungkan',
      'Keterangan',
      'Nilai Indikator',
      'Nilai IKPA'
    ];

    const rowsTsv = calculatedRows.map(r => [
      r.no,
      r.periode,
      r.revisiKe ?? '',
      r.tanggalRevisi ?? '',
      r.kodeJenisRevisi ?? '',
      r.paguSebelum ?? '',
      r.paguMenjadi ?? '',
      r.empatBelasJenis,
      r.diperhitungkan,
      r.jumlahDiperhitungkan,
      r.keterangan,
      r.nilaiIndikator,
      r.nilaiIKPA
    ].join('\t'));

    const fullTsv = [headers.join('\t'), ...rowsTsv].join('\n');
    navigator.clipboard.writeText(fullTsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Jalankan Golden Test dan tampilkan modal hasil verifikasi
  const handleRunGoldenTest = () => {
    const res = runRevisiDipaGoldenTest();
    setGoldenTestResult(res);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-800 dark:text-slate-100">
      {/* 1. Header Summary Card: REVISI DIPA */}
      <div className={`rounded-2xl border p-5 shadow-xs transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Bobot 10% • Sel M15 / G6
              </span>
              <span className="rounded-md bg-blue-500/10 dark:bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                Excel Compatible Mode
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              REVISI DIPA
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Modul perhitungan indikator Revisi DIPA sesuai workbook resmi <em>Kalkulator Perhitungan IKPA 2026</em>.
              Revisi dihitung jika memenuhi dua syarat: bertanda 14 jenis (<code className="font-mono font-bold">H=&quot;ya&quot;</code>) dan <strong>Pagu Tetap</strong> (<code className="font-mono font-bold">F===G</code>).
            </p>
          </div>

          {/* 3 Metrik Ringkasan Utama */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Metrik 1: Nilai IKPA Final */}
            <div className={`p-3 rounded-xl border min-w-[130px] ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Nilai IKPA (G6)
              </div>
              <div className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                {finalScore.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">
                M15: {m15Value.toFixed(2)} {m15Value > 100 ? '(Capped 100)' : ''}
              </div>
            </div>

            {/* Metrik 2: Semester I Count */}
            <div className={`p-3 rounded-xl border min-w-[130px] ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Revisi Sem. I (J9)
              </div>
              <div className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-100">
                {sem1Count} <span className="text-xs font-normal text-slate-400">revisi</span>
              </div>
              <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Nilai L9: {l9Value}
              </div>
            </div>

            {/* Metrik 3: Semester II Count */}
            <div className={`p-3 rounded-xl border min-w-[130px] ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Revisi Sem. II (J15)
              </div>
              <div className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-100">
                {sem2Count} <span className="text-xs font-normal text-slate-400">revisi</span>
              </div>
              <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                Nilai L15: {l15Value}
              </div>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <IndikatorCalculateButton
              indicatorKey="revisiDIPA"
              indicatorName="Revisi DIPA"
              weight={10}
              indicatorResult={indicatorResult}
              validationIssues={validationIssues}
              satkerName={project.metadata?.namaSatker || project.name}
              isDark={isDark}
            />

            <button
              onClick={() => onOpenInspector(
                'Indikator Revisi DIPA (G6)',
                'G6',
                '=IF(\'Revisi DIPA\'!M15>100; 100; \'Revisi DIPA\'!M15)',
                finalScore.toFixed(2),
                indicatorResult.details
              )}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
            >
              <Calculator className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Formula Inspector
            </button>

            <button
              onClick={() => setShow14ReferenceModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer transition-colors"
            >
              <Info className="h-3.5 w-3.5" />
              Daftar 14 Jenis Revisi
            </button>

            <button
              onClick={handleRunGoldenTest}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Uji Golden Test (M4–M15)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyTableToExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-2xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Tersalin ke Clipboard!' : 'Salin Tabel (Excel TSV)'}
            </button>

            <button
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              title="Unduh data tabel dalam format JSON"
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
              <Upload className="h-3.5 w-3.5" />
              Import JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>

            <button
              onClick={handleResetToGolden}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium cursor-pointer transition-colors"
              title="Kembalikan nilai ke contoh data standar workbook Excel"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Standar Excel
            </button>

            <button
              onClick={handleClearTable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-medium cursor-pointer transition-colors"
              title="Kosongkan seluruh baris formulir Revisi DIPA"
            >
              <Eraser className="h-3.5 w-3.5" />
              Kosongkan Formulir
            </button>
          </div>
        </div>
      </div>

      {/* Banner Validasi Data Input */}
      <IndikatorValidationBanner
        indicatorName="Revisi DIPA"
        issues={validationIssues}
        isConfirmed={isValidationConfirmed}
        onToggleConfirm={() => setIsValidationConfirmed(!isValidationConfirmed)}
        isDark={isDark}
      />

      {/* Petunjuk Pengisian & Cara Menggunakan */}
      <PetunjukPengisianCard
        indicatorId="revisi-dipa"
        isDark={isDark}
        defaultExpanded={true}
      />

      {/* Status Penilaian Indikator (Diperhitungkan / N/A) */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
        (project.activeIndicators?.revisiDIPA !== false && rawInputs.length > 0)
          ? (isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs')
          : (isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-amber-50/90 border-amber-200 text-amber-900 shadow-xs')
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={`p-2 rounded-xl mt-0.5 sm:mt-0 ${
            (project.activeIndicators?.revisiDIPA !== false && rawInputs.length > 0)
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-amber-500/15 text-amber-600'
          }`}>
            {(project.activeIndicators?.revisiDIPA !== false && rawInputs.length > 0) ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Status Penilaian Indikator:
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                (project.activeIndicators?.revisiDIPA !== false && rawInputs.length > 0)
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
              }`}>
                {(project.activeIndicators?.revisiDIPA !== false && rawInputs.length > 0)
                  ? '✓ DIPERHITUNGKAN (Bobot 10%)'
                  : '⊘ TIDAK DIPERHITUNGKAN / N/A (Bobot 0%)'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {(project.activeIndicators?.revisiDIPA !== false && rawInputs.length > 0)
                ? `Terdapat ${rawInputs.length} baris riwayat data revisi aktif. Indikator ini diperhitungkan dalam total IKPA.`
                : 'Indikator ini tidak memiliki data baris riwayat revisi atau dinonaktifkan. Nilai akhir IKPA satker dinormalkan via Konversi Bobot (O6) sehingga tidak mengurangi nilai akhir.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleToggleActiveIndicator}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow-2xs cursor-pointer ${
              (project.activeIndicators?.revisiDIPA !== false && rawInputs.length > 0)
                ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300'
                : 'border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {(project.activeIndicators?.revisiDIPA !== false && rawInputs.length > 0)
              ? 'Jadikan N/A (Nonaktifkan)'
              : 'Aktifkan Kembali Indikator'}
          </button>
        </div>
      </div>

      {/* Modal / Hasil Golden Test Banner */}
      {goldenTestResult && (
        <div className={`p-4 rounded-2xl border ${
          goldenTestResult.passed
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              {goldenTestResult.passed ? (
                <CheckCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              )}
              Hasil Verifikasi Golden Test Workbook: {goldenTestResult.passed ? 'SEMUA LULUS (PASS)' : 'ADA KETIDAKSESUAIAN (FAIL)'}
            </div>
            <button
              onClick={() => setGoldenTestResult(null)}
              className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
            >
              Tutup
            </button>
          </div>
          <p className="text-xs mb-3">
            Target M15 = 80.00 • Final Revisi DIPA (G6) = {goldenTestResult.finalScore.toFixed(2)} (Expected: {goldenTestResult.expectedFinalScore.toFixed(2)})
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5 font-mono text-[11px]">
            {goldenTestResult.rowResults.map(r => (
              <div
                key={r.cellM}
                className={`p-1.5 rounded-lg border text-center ${
                  r.passed
                    ? 'bg-white/80 dark:bg-slate-800/80 border-emerald-300 dark:border-emerald-700'
                    : 'bg-rose-100 dark:bg-rose-950 border-rose-400 text-rose-700'
                }`}
              >
                <div className="font-bold text-slate-500 text-[10px]">{r.cellM}</div>
                <div className="font-bold">{r.actualM}</div>
                <div className="text-[9px] text-slate-400">Exp: {r.expectedM}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. TABEL PERIODE DENGAN STRUKTUR HARUS PERSIS SESUAI EXCEL */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Tabel Periode Revisi DIPA (Kolom A s.d. M)
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {calculatedRows.length} Baris
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              title="Tambah 1 baris revisi berikutnya"
            >
              <Plus className="w-3.5 h-3.5" />
              + Tambah Baris (No. {rawInputs.length + 1})
            </button>
            <button
              onClick={handleAddSemester1}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
              title="Tambah Semester I (Periode 01 s.d. 06)"
            >
              <Plus className="w-3.5 h-3.5" />
              + Semester I (6 Baris)
            </button>
            <button
              onClick={handleAdd12Rows}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-xs transition-colors cursor-pointer"
              title="Lengkapi sampai 12 periode (Semester I & II)"
            >
              + 12 Baris Lengkap
            </button>
            <button
              onClick={handleClearTable}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-medium text-xs transition-colors cursor-pointer"
              title="Kosongkan seluruh baris formulir"
            >
              <Eraser className="w-3.5 h-3.5" />
              Kosongkan
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header Columns A s.d. M */}
            <thead className={`border-b font-semibold text-[11px] ${
              isDark ? 'bg-slate-800/80 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              <tr>
                <th className="px-2.5 py-3 text-center border-r border-slate-200 dark:border-slate-800 w-10">
                  A<br/><span className="text-[10px] font-normal text-slate-500">No.</span>
                </th>
                <th className="px-2.5 py-3 text-center border-r border-slate-200 dark:border-slate-800 w-16">
                  B<br/><span className="text-[10px] font-normal text-slate-500">Periode</span>
                </th>
                <th className="px-2.5 py-3 border-r border-slate-200 dark:border-slate-800 w-20">
                  C<br/><span className="text-[10px] font-normal text-slate-500">Revisi Ke</span>
                </th>
                <th className="px-2.5 py-3 border-r border-slate-200 dark:border-slate-800 min-w-[125px]">
                  D<br/><span className="text-[10px] font-normal text-slate-500">Tanggal Revisi</span>
                </th>
                <th className="px-2.5 py-3 border-r border-slate-200 dark:border-slate-800 min-w-[150px]">
                  E<br/><span className="text-[10px] font-normal text-slate-500">Kode Jenis Revisi</span>
                </th>
                <th className="px-2.5 py-3 border-r border-slate-200 dark:border-slate-800 min-w-[140px] text-right">
                  F<br/><span className="text-[10px] font-normal text-slate-500">Pagu DIPA Sebelum</span>
                </th>
                <th className="px-2.5 py-3 border-r border-slate-200 dark:border-slate-800 min-w-[140px] text-right">
                  G<br/><span className="text-[10px] font-normal text-slate-500">Pagu DIPA Menjadi</span>
                </th>
                <th className="px-2.5 py-3 border-r border-slate-200 dark:border-slate-800 text-center w-24">
                  H<br/><span className="text-[10px] font-normal text-slate-500">14 Jenis Revisi?</span>
                </th>
                <th className="px-3 py-3 border-r border-slate-200 dark:border-slate-800 min-w-[145px] text-center">
                  I<br/><span className="text-[10px] font-normal text-slate-500">Apakah Diperhitungkan?</span>
                </th>
                <th className="px-2.5 py-3 border-r border-slate-200 dark:border-slate-800 text-center w-20">
                  J<br/><span className="text-[10px] font-normal text-slate-500">Jml Revisi</span>
                </th>
                <th className="px-2.5 py-3 border-r border-slate-200 dark:border-slate-800 text-center w-24">
                  K<br/><span className="text-[10px] font-normal text-slate-500">Keterangan</span>
                </th>
                <th className="px-2.5 py-3 border-r border-slate-200 dark:border-slate-800 text-center w-20">
                  L<br/><span className="text-[10px] font-normal text-slate-500">Nilai Indikator</span>
                </th>
                <th className="px-2.5 py-3 text-center w-20">
                  M<br/><span className="text-[10px] font-normal text-slate-500">Nilai IKPA</span>
                </th>
                <th className="px-2.5 py-3 text-center border-l border-slate-200 dark:border-slate-800 w-12">
                  Aksi
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {calculatedRows.map((r, idx) => {
                const targetIdx = rawInputs.findIndex(item => item.no === r.no);
                const effectiveIdx = targetIdx !== -1 ? targetIdx : idx;
                const codeCheck = checkRevisionCodes(r.kodeJenisRevisi);
                const isSem1Header = idx === 0 && r.no <= 6;
                const isSem2Header = r.no > 6 && (idx === 0 || calculatedRows[idx - 1]?.no <= 6);
                const isPaguMatch = r.paguSebelum !== null && r.paguMenjadi !== null && r.paguSebelum === r.paguMenjadi && r.paguSebelum > 0;
                const isCounted = r.diperhitungkan === 'diperhitungkan';

                return (
                  <React.Fragment key={r.no ?? idx}>
                    {/* Section Header Semester I */}
                    {isSem1Header && (
                      <tr className="bg-emerald-500/10 dark:bg-emerald-950/40 border-y border-emerald-500/20">
                        <td colSpan={14} className="px-3 py-1.5 font-sans font-bold text-xs text-emerald-800 dark:text-emerald-300">
                          SEMESTER I (Periode 01 – 06) • Basis Kumulatif J4:J9 • Nilai IKPA M4:M9 = L
                        </td>
                      </tr>
                    )}

                    {/* Section Header Semester II */}
                    {isSem2Header && (
                      <tr className="bg-blue-500/10 dark:bg-blue-950/40 border-y border-blue-500/20">
                        <td colSpan={14} className="px-3 py-1.5 font-sans font-bold text-xs text-blue-800 dark:text-blue-300">
                          SEMESTER II (Periode 07 – 12) • Basis Kumulatif J10:J15 (Dimulai Ulang dari Periode 07) • Nilai IKPA M = AVERAGE($L$9, L)
                        </td>
                      </tr>
                    )}

                    <tr className={`transition-colors font-mono ${
                      isCounted
                        ? (isDark ? 'bg-emerald-950/20 hover:bg-emerald-950/30' : 'bg-emerald-50/40 hover:bg-emerald-50/70')
                        : (isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80')
                    }`}>
                      {/* A. No (Otomatis) */}
                      <td className="px-2.5 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-slate-500">
                        {r.no}
                      </td>

                      {/* B. Periode (Otomatis "01"-"12") */}
                      <td className="px-2.5 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100">
                        {r.periode}
                      </td>

                      {/* C. Revisi Ke (Input Angka Positif >= 0) */}
                      <td className="px-2.5 py-2 border-r border-slate-200 dark:border-slate-800">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={r.revisiKe !== null && r.revisiKe !== undefined ? Math.max(0, Math.abs(r.revisiKe)) : ''}
                          onKeyDown={(e) => {
                            // Blokir pengetikan tanda minus, plus, eksponensial, atau titik desimal
                            if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E' || e.key === '.') {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              handleUpdateRow(effectiveIdx, { revisiKe: null });
                            } else {
                              const parsed = parseInt(raw, 10);
                              if (!isNaN(parsed)) {
                                handleUpdateRow(effectiveIdx, { revisiKe: Math.max(0, Math.abs(parsed)) });
                              }
                            }
                          }}
                          placeholder="contoh: 1"
                          title="Nomor urut revisi DIPA (contoh: 1, 2, dst. atau kosongkan jika belum ada revisi)"
                          className="w-full text-center px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        />
                      </td>

                      {/* D. Tanggal Revisi (Input Date Picker) */}
                      <td className="px-2.5 py-2 border-r border-slate-200 dark:border-slate-800">
                        <input
                          type="date"
                          value={r.tanggalRevisi ? normalizeDateToIso(r.tanggalRevisi) : ''}
                          onChange={(e) => {
                            const val = e.target.value ? normalizeDateToIso(e.target.value) : null;
                            handleUpdateRow(effectiveIdx, { tanggalRevisi: val });
                          }}
                          className="w-full px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-[11px]"
                        />
                      </td>

                      {/* E. Kode Jenis Revisi (Input dengan Dukungan Multi-Kode SAKTI & Bantuan Otomatis 14 Jenis) */}
                      <td className="px-2.5 py-2 border-r border-slate-200 dark:border-slate-800">
                        <input
                          type="text"
                          value={r.kodeJenisRevisi || ''}
                          onChange={(e) => {
                            const newCodesStr = e.target.value;
                            const check = checkRevisionCodes(newCodesStr);
                            let nextH = r.empatBelasJenis;
                            if (check.hasAny14) {
                              nextH = 'ya';
                            } else if (check.codes.length > 0) {
                              nextH = 'tidak';
                            } else if (check.codes.length === 0 && (!r.revisiKe || String(r.revisiKe).trim() === '')) {
                              nextH = '-';
                            }

                            handleUpdateRow(effectiveIdx, {
                              kodeJenisRevisi: newCodesStr,
                              empatBelasJenis: nextH
                            });
                          }}
                          placeholder="contoh: 217, 315 atau 212"
                          title="Bisa diisi lebih dari satu kode (misal: 217, 315). Jika memuat minimal salah satu dari 14 jenis pembatasan, Kolom H otomatis terdeteksi 'ya'."
                          className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-mono"
                        />
                        {/* Assistive UI Badge untuk Kode E (Multi-Kode SAKTI / SPAN) */}
                        {r.kodeJenisRevisi && r.kodeJenisRevisi.trim() !== '' && (
                          <div className="mt-1 font-sans text-[10px] space-y-1">
                            {/* Badges per-kode */}
                            <div className="flex flex-wrap items-center gap-1">
                              {codeCheck.descriptions.map((d, dIdx) => (
                                <span
                                  key={dIdx}
                                  title={`${d.kode}: ${d.uraian} (${d.is14 ? 'Masuk 14 Jenis Pembatasan IKPA' : 'Bukan 14 Jenis / Bebas Kewenangan KPA'})`}
                                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                                    d.is14
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {d.is14 ? '✓ ' : 'ℹ '}
                                  {d.kode}
                                  <span className="font-normal opacity-85 hidden sm:inline">
                                    : {d.uraian.length > 20 ? d.uraian.slice(0, 18) + '…' : d.uraian}
                                  </span>
                                </span>
                              ))}
                            </div>

                            {/* Status Kombinasi */}
                            {codeCheck.hasAny14 ? (
                              <div className="flex items-center justify-between gap-1 text-emerald-700 dark:text-emerald-400">
                                <span className="inline-flex items-center gap-0.5 truncate font-medium" title={codeCheck.descriptions.map(d => `${d.kode}: ${d.uraian}`).join(', ')}>
                                  ✓ Memuat 14 Jenis ({codeCheck.matchedCodes.join(', ')}) ➔ Kolom H=&quot;ya&quot;
                                </span>
                                {r.empatBelasJenis !== 'ya' && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRow(effectiveIdx, { empatBelasJenis: 'ya' })}
                                    className="underline text-[9px] cursor-pointer hover:text-emerald-900 ml-1 shrink-0"
                                    title="Pilih 'ya' pada Kolom H"
                                  >
                                    Set H=&apos;ya&apos;
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1 text-amber-700 dark:text-amber-400">
                                <span className="truncate font-medium">ℹ Bebas dari 14 jenis pembatasan</span>
                                {r.empatBelasJenis !== 'tidak' && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRow(effectiveIdx, { empatBelasJenis: 'tidak' })}
                                    className="underline text-[9px] cursor-pointer hover:text-amber-900 ml-1 shrink-0"
                                    title="Pilih 'tidak' pada Kolom H"
                                  >
                                    Set H=&apos;tidak&apos;
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* F. Pagu DIPA Sebelum (Input Rupiah) */}
                      <td className="px-2.5 py-2 border-r border-slate-200 dark:border-slate-800 text-right">
                        <input
                          type="text"
                          value={draftPaguSebelum[effectiveIdx] !== undefined ? draftPaguSebelum[effectiveIdx] : (r.paguSebelum !== null ? formatRupiah(r.paguSebelum) : '')}
                          onFocus={() => {
                            setDraftPaguSebelum(prev => ({ ...prev, [effectiveIdx]: r.paguSebelum !== null ? String(r.paguSebelum) : '' }));
                          }}
                          onChange={(e) => {
                            setDraftPaguSebelum(prev => ({ ...prev, [effectiveIdx]: e.target.value }));
                          }}
                          onBlur={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '');
                            const num = raw === '' ? null : Number(raw);
                            setDraftPaguSebelum(prev => {
                              const next = { ...prev };
                              delete next[effectiveIdx];
                              return next;
                            });
                            handleUpdateRow(effectiveIdx, { paguSebelum: num });
                          }}
                          placeholder="Rp 0"
                          className="w-full text-right px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        />
                      </td>

                      {/* G. Pagu DIPA Menjadi (Input Rupiah) */}
                      <td className="px-2.5 py-2 border-r border-slate-200 dark:border-slate-800 text-right">
                        <input
                          type="text"
                          value={draftPaguMenjadi[effectiveIdx] !== undefined ? draftPaguMenjadi[effectiveIdx] : (r.paguMenjadi !== null ? formatRupiah(r.paguMenjadi) : '')}
                          onFocus={() => {
                            setDraftPaguMenjadi(prev => ({ ...prev, [effectiveIdx]: r.paguMenjadi !== null ? String(r.paguMenjadi) : '' }));
                          }}
                          onChange={(e) => {
                            setDraftPaguMenjadi(prev => ({ ...prev, [effectiveIdx]: e.target.value }));
                          }}
                          onBlur={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '');
                            const num = raw === '' ? null : Number(raw);
                            setDraftPaguMenjadi(prev => {
                              const next = { ...prev };
                              delete next[effectiveIdx];
                              return next;
                            });
                            handleUpdateRow(effectiveIdx, { paguMenjadi: num });
                          }}
                          placeholder="Rp 0"
                          className="w-full text-right px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                        />
                        {/* Equality Status (F === G) */}
                        {r.paguSebelum !== null && r.paguMenjadi !== null && r.paguSebelum > 0 && (
                          <div className="mt-0.5 text-[9px] font-sans text-right">
                            {r.paguSebelum === r.paguMenjadi ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">F===G (Tetap)</span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">F!==G (Berubah)</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* H. 14 Jenis Revisi? (Pilihan "ya", "tidak", "-") */}
                      <td className="px-2.5 py-2 border-r border-slate-200 dark:border-slate-800 text-center">
                        <select
                          value={r.empatBelasJenis}
                          onChange={(e) => {
                            const val = e.target.value as "ya" | "tidak" | "-";
                            handleUpdateRow(effectiveIdx, { empatBelasJenis: val });
                          }}
                          className={`w-full text-center px-2 py-1 rounded border text-xs font-sans font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                            r.empatBelasJenis === 'ya'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                              : r.empatBelasJenis === 'tidak'
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          <option value="-">-</option>
                          <option value="ya">ya</option>
                          <option value="tidak">tidak</option>
                        </select>
                      </td>

                      {/* I. Apakah Diperhitungkan dalam Indikator Revisi DIPA (Otomatis Persis Excel) */}
                      <td className="px-2.5 py-2 border-r border-slate-200 dark:border-slate-800 text-center font-sans">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          isCounted
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {isCounted ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              diperhitungkan
                            </>
                          ) : (
                            'tidak diperhitungkan'
                          )}
                        </span>
                      </td>

                      {/* J. Jumlah Revisi yang Diperhitungkan (Otomatis Kumulatif Excel) */}
                      <td className="px-2.5 py-2 border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-800 dark:text-slate-100">
                        {r.jumlahDiperhitungkan}
                      </td>

                      {/* K. Keterangan (Semester I / Semester II) */}
                      <td className="px-2.5 py-2 border-r border-slate-200 dark:border-slate-800 text-center font-sans text-[11px] text-slate-600 dark:text-slate-400">
                        {r.keterangan}
                      </td>

                      {/* L. Nilai Indikator (Otomatis 110, 100, 50 - Tanpa Cap) */}
                      <td className={`px-2.5 py-2 border-r border-slate-200 dark:border-slate-800 text-center font-bold text-xs ${
                        r.nilaiIndikator === 110
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                          : r.nilaiIndikator === 100
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {r.nilaiIndikator}
                      </td>

                      {/* M. Nilai IKPA (Otomatis Sem I = L, Sem II = AVERAGE($L$9, L)) */}
                      <td className={`px-2.5 py-2 text-center font-black text-xs ${
                        r.nilaiIKPA >= 100
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}>
                        {r.nilaiIKPA}
                      </td>

                      {/* Aksi: Hapus Baris */}
                      <td className="px-2.5 py-2 text-center border-l border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => handleDeleteRow(effectiveIdx)}
                          title={`Hapus baris No. ${r.no} (${r.periode})`}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {calculatedRows.length === 0 && (
                <tr>
                  <td colSpan={14} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          Belum Ada Baris Riwayat Revisi DIPA
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
                          Settingan awal bersih (0 baris). Satker dapat menambahkan baris revisi secara bertahap saat revisi terjadi tanpa kewajiban mengisi 12 periode langsung.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-2 font-sans">
                        <button
                          onClick={handleAddRow}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          + Tambah Baris Pertama
                        </button>
                        <button
                          onClick={handleAddSemester1}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          + Tambah Semester I (6 Baris)
                        </button>
                        <button
                          onClick={handleResetToGolden}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs cursor-pointer"
                        >
                          Muat Standar Excel (12 Baris)
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Panel "Audit Perhitungan" */}
      <div className={`rounded-2xl border shadow-xs transition-all overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div
          onClick={() => setShowAuditPanel(!showAuditPanel)}
          className="px-5 py-4 flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800 select-none"
        >
          <div className="flex items-center gap-2.5">
            <Calculator className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Audit Perhitungan Indikator Revisi DIPA
            </h3>
            <span className="text-xs text-slate-400">
              (Rincian formula & verifikasi logika per periode)
            </span>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1">
            {showAuditPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showAuditPanel && (
          <div className="p-5 space-y-4 text-xs leading-relaxed">
            {/* 5 Kartu Rangkuman Audit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="font-sans text-[10px] uppercase font-semibold text-slate-400">1. Syarat Diperhitungkan</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">H=&quot;ya&quot; AND F===G</div>
                <div className="font-sans text-[11px] text-slate-500 mt-0.5">14 jenis & pagu tetap</div>
              </div>

              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="font-sans text-[10px] uppercase font-semibold text-slate-400">2. Revisi Sem. I (J9)</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">{sem1Count} kali</div>
                <div className="font-sans text-[11px] text-slate-500 mt-0.5">Nilai L9: {l9Value}</div>
              </div>

              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="font-sans text-[10px] uppercase font-semibold text-slate-400">3. Revisi Sem. II (J15)</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">{sem2Count} kali</div>
                <div className="font-sans text-[11px] text-slate-500 mt-0.5">Nilai L15: {l15Value} (reset dari 07)</div>
              </div>

              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="font-sans text-[10px] uppercase font-semibold text-slate-400">4. Nilai M15 (Tabel)</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">{m15Value.toFixed(2)}</div>
                <div className="font-sans text-[11px] text-slate-500 mt-0.5">AVERAGE(L9, L15)</div>
              </div>

              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="font-sans text-[10px] uppercase font-semibold text-slate-400">5. Final Dashboard (G6)</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-1 text-base">{finalScore.toFixed(2)}</div>
                <div className="font-sans text-[11px] text-slate-500 mt-0.5">MIN(100, M15)</div>
              </div>
            </div>

            {/* Audit Logika Tabel Detail Baris per Baris */}
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left font-sans text-xs">
                <thead className={isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}>
                  <tr>
                    <th className="px-3 py-2">Periode</th>
                    <th className="px-3 py-2">Pagu Sebelum (F)</th>
                    <th className="px-3 py-2">Pagu Menjadi (G)</th>
                    <th className="px-3 py-2">14 Jenis (H)</th>
                    <th className="px-3 py-2">Status Diperhitungkan (I)</th>
                    <th className="px-3 py-2">Penjelasan / Alasan Audit</th>
                    <th className="px-3 py-2 text-center">Kumulatif (J)</th>
                    <th className="px-3 py-2 text-center">Nilai L</th>
                    <th className="px-3 py-2 text-center">Nilai M</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {calculatedRows.map((r, i) => {
                    const isCounted = r.diperhitungkan === 'diperhitungkan';
                    let reason = '';
                    if (r.empatBelasJenis === '-') {
                      reason = 'Tidak ada revisi pada periode ini (H="-")';
                    } else if (r.empatBelasJenis === 'tidak') {
                      reason = 'Kode revisi ditandai tidak termasuk 14 jenis (H="tidak")';
                    } else if (r.paguSebelum !== r.paguMenjadi) {
                      reason = `Pagu DIPA berubah (F!==G: Rp ${formatRupiah(r.paguSebelum || 0)} vs Rp ${formatRupiah(r.paguMenjadi || 0)})`;
                    } else {
                      reason = `Memenuhi syarat: 14 jenis (H="ya") dan Pagu Tetap (F===G = Rp ${formatRupiah(r.paguSebelum || 0)})`;
                    }

                    return (
                      <tr key={i} className={isCounted ? 'bg-emerald-500/5' : ''}>
                        <td className="px-3 py-1.5 font-bold">Periode {r.periode}</td>
                        <td className="px-3 py-1.5">{r.paguSebelum !== null ? formatRupiah(r.paguSebelum) : '-'}</td>
                        <td className="px-3 py-1.5">{r.paguMenjadi !== null ? formatRupiah(r.paguMenjadi) : '-'}</td>
                        <td className="px-3 py-1.5 font-bold">{r.empatBelasJenis}</td>
                        <td className="px-3 py-1.5 font-sans">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isCounted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'text-slate-400'
                          }`}>
                            {r.diperhitungkan}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 font-sans text-slate-600 dark:text-slate-400 text-[11px]">
                          {reason}
                        </td>
                        <td className="px-3 py-1.5 text-center font-bold">{r.jumlahDiperhitungkan}</td>
                        <td className="px-3 py-1.5 text-center font-bold text-emerald-600 dark:text-emerald-400">{r.nilaiIndikator}</td>
                        <td className="px-3 py-1.5 text-center font-bold">{r.nilaiIKPA}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. Modal Daftar 14 Jenis Revisi Master Reference */}
      {show14ReferenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold">Daftar 14 Jenis Revisi yang Diakui (Master IKPA 2026)</h3>
              </div>
              <button
                onClick={() => setShow14ReferenceModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Berdasarkan petunjuk teknis IKPA 2026, jenis revisi berikut diklasifikasikan sebagai 14 jenis revisi.
              Jika usulan revisi Anda masuk ke salah satu dari kode berikut dan <strong>tidak mengubah pagu DIPA (pagu tetap)</strong>, maka dapat ditandai <code className="font-mono font-bold text-emerald-600">H=&quot;ya&quot;</code> agar tidak mengurangi nilai indikator Revisi DIPA.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
              {VALID_REVISION_CODES.map(kode => (
                <div
                  key={kode}
                  className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                    isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400">
                    {kode}
                  </span>
                  <span className="font-sans text-[11px] leading-snug">
                    {VALID_REVISION_CODE_MAP[kode]}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShow14ReferenceModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer transition-colors"
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
