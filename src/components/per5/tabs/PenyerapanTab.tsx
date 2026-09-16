import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Sliders,
  Calculator,
  RotateCcw,
  Eraser,
  Download,
  Upload,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Info,
  Layers,
  Save,
  CheckCheck,
  Table as TableIcon,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Zap,
  Sparkles,
  ShieldCheck,
  Plus,
  Trash2,
  Settings2,
  Target
} from 'lucide-react';
import {
  SimulationProject,
  PenyerapanInput,
  PenyerapanPeriod,
  IndicatorResult
} from '../../../models/ikpa';
import { validatePenyerapan } from '../../../utils/indikatorValidation';
import { IndikatorValidationBanner } from '../common/IndikatorValidationBanner';
import { IndikatorCalculateButton } from '../common/IndikatorCalculateButton';
import { PetunjukPengisianCard } from '../common/PetunjukPengisianCard';
import {
  round2,
  TARGETS,
  DEFAULT_QUARTER_TARGETS,
  getQuarterFromPeriod,
  calculateNetBudget,
  calculateTargets,
  calculateTargetNominal,
  calculateAchievement,
  calculateBudgetProportions,
  calculateNkpa,
  calculatePeriodScore,
  calculateIndicatorScore,
  calculatePenyerapanAnggaran,
  runPenyerapanGoldenTest,
  PenyerapanGoldenTestSummary
} from '../../../calculations/penyerapan';
import { DEFAULT_EXCEL_PENYERAPAN_PERIODS } from '../../../utils/excelReferenceDefaultData';
import {
  formatRupiah,
  formatPercent,
  formatScore,
  BULAN_NAMES,
  parseRupiahAmount,
  parseTargetPercent
} from '../../../utils/excelReferenceDataHelper';

interface PenyerapanTabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const PenyerapanTab: React.FC<PenyerapanTabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  // Mode tampilan: 'excel' (tabel 12 periode lengkap) atau 'simple' (kartu input bulanan)
  const [viewMode, setViewMode] = useState<'excel' | 'simple'>('excel');

  // Filter bulan aktif untuk Mode Input Sederhana (0 = Jan, 11 = Des)
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(0);

  // State What-If local simulation slider (+% percepatan realisasi belanja 52 & 53)
  const [whatIfBoostPct, setWhatIfBoostPct] = useState<number>(0);

  // UI state
  const [copied, setCopied] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [showGoldenTestModal, setShowGoldenTestModal] = useState(false);
  const [auditSelectedPeriode, setAuditSelectedPeriode] = useState<string>('01');
  const [auditSelectedBelanja, setAuditSelectedBelanja] = useState<'51' | '52' | '53' | '57'>('51');
  const [isValidationConfirmed, setIsValidationConfirmed] = useState(false);
  const [showTargetSetting, setShowTargetSetting] = useState(false);

  // Draft input untuk string nominal rupiah & target agar pengetikan tidak terganggu re-render angka
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>({});

  // Active quarter targets (gabungan standar PER-5 dan kustom/dispensasi)
  const activeQuarterTargets = useMemo(() => {
    return {
      1: { ...(project.penyerapanQuarterTargets?.[1] || DEFAULT_QUARTER_TARGETS[1]) },
      2: { ...(project.penyerapanQuarterTargets?.[2] || DEFAULT_QUARTER_TARGETS[2]) },
      3: { ...(project.penyerapanQuarterTargets?.[3] || DEFAULT_QUARTER_TARGETS[3]) },
      4: { ...(project.penyerapanQuarterTargets?.[4] || DEFAULT_QUARTER_TARGETS[4]) }
    };
  }, [project.penyerapanQuarterTargets]);

  const hasCustomQuarterTargets = useMemo(() => {
    return !!project.penyerapanQuarterTargets && Object.keys(project.penyerapanQuarterTargets).length > 0;
  }, [project.penyerapanQuarterTargets]);

  // 1. Ambil baris data dari project atau inisialisasi kosong (blank slate)
  const rawInputs: PenyerapanInput[] = useMemo(() => {
    if (project.penyerapan !== undefined && Array.isArray(project.penyerapan)) {
      return project.penyerapan;
    }
    return [];
  }, [project.penyerapan]);

  // Validasi otomatis data input Penyerapan Anggaran
  const validationIssues = useMemo(() => {
    return validatePenyerapan(rawInputs);
  }, [rawInputs]);

  // 2. Terapkan simulasi What-If jika slider digeser
  const effectiveInputs: PenyerapanInput[] = useMemo(() => {
    if (whatIfBoostPct === 0) return rawInputs;
    const factor = 1 + whatIfBoostPct / 100;
    return rawInputs.map(r => {
      const netto52 = Math.max(0, r.pagu52 - r.blokir52);
      const netto53 = Math.max(0, r.pagu53 - r.blokir53);
      return {
        ...r,
        realisasi52: Math.min(netto52, Math.round(r.realisasi52 * factor)),
        realisasi53: Math.min(netto53, Math.round(r.realisasi53 * factor))
      };
    });
  }, [rawInputs, whatIfBoostPct]);

  // 3. Eksekusi perhitungan deterministik menggunakan calculation engine
  const calculationOutput = useMemo(() => {
    return calculatePenyerapanAnggaran(
      effectiveInputs,
      20,
      true,
      project.metadata?.periodeCutoff || 12,
      project.penyerapanQuarterTargets
    );
  }, [effectiveInputs, project.metadata?.periodeCutoff, project.penyerapanQuarterTargets]);

  const periods = calculationOutput?.periods || [];
  const result: IndicatorResult = calculationOutput?.result || {
    rawValue: 0,
    cappedValue: 0,
    weight: 20,
    weightedValue: 0,
    isActive: true,
    details: [],
    metadata: { periods: [], count: 0 }
  };
  const warnings = calculationOutput?.warnings || [];

  // Nilai ringkasan triwulan:
  // TW I = Q17 (periode '03')
  // TW II = Q35 (periode '06')
  // TW III = Q53 (periode '09')
  // TW IV = Q71 (periode '12')
  const scoreTW1 = periods.find(p => p.periode === '03')?.nilaiIndikator ?? 0;
  const scoreTW2 = periods.find(p => p.periode === '06')?.nilaiIndikator ?? 0;
  const scoreTW3 = periods.find(p => p.periode === '09')?.nilaiIndikator ?? 0;
  const scoreTW4 = periods.find(p => p.periode === '12')?.nilaiIndikator ?? 0;
  const finalScore = periods.length > 0 ? (periods[periods.length - 1]?.nilaiIndikator ?? 0) : 0;

  // Handler update field baris
  const handleUpdateRowField = (idx: number, field: keyof PenyerapanInput, value: number) => {
    const updated = [...rawInputs];
    updated[idx] = {
      ...updated[idx],
      [field]: Math.max(0, Number(value) || 0)
    };
    onUpdateProject({
      ...project,
      penyerapan: updated
    });
  };

  // Handler commit draft string ke number (mendukung ribuan/jutaan/milyaran dengan titik atau angka utuh)
  const handleCommitDraft = (key: string, idx: number, field: keyof PenyerapanInput) => {
    if (draftInputs[key] !== undefined) {
      const num = parseRupiahAmount(draftInputs[key]);
      handleUpdateRowField(idx, field, num);
      const next = { ...draftInputs };
      delete next[key];
      setDraftInputs(next);
    }
  };

  // Handler commit draft target persentase (mendukung koma atau titik desimal: contoh 15, 15%, 15,5%)
  const handleCommitTargetDraft = (key: string, idx: number, field: keyof PenyerapanInput) => {
    if (draftInputs[key] !== undefined) {
      const val = parseTargetPercent(draftInputs[key]);
      const updated = [...rawInputs];
      updated[idx] = {
        ...updated[idx],
        [field]: val
      };
      onUpdateProject({
        ...project,
        penyerapan: updated
      });
      const next = { ...draftInputs };
      delete next[key];
      setDraftInputs(next);
    }
  };

  // Deteksi apakah ada nilai yang terpotong desimal akibat pembacaan titik sebelumnya (misal 916.718 alih-alih 916.718.000)
  const truncatedStats = useMemo(() => {
    let count = 0;
    const isTruncated = (val: number | undefined) => typeof val === 'number' && val > 0 && val < 100000 && !Number.isInteger(val);
    rawInputs.forEach(r => {
      (['51', '52', '53', '57'] as const).forEach(b => {
        if (isTruncated(r[`pagu${b}`])) count++;
        if (isTruncated(r[`blokir${b}`])) count++;
        if (isTruncated(r[`realisasi${b}`])) count++;
      });
    });
    return { hasTruncated: count > 0, count };
  }, [rawInputs]);

  // Perbaiki otomatis seluruh nilai terpotong ke nilai rupiah utuh (x 1.000.000)
  const handleFixTruncatedNumbers = () => {
    const isTruncated = (val: number | undefined) => typeof val === 'number' && val > 0 && val < 100000 && !Number.isInteger(val);
    const fixVal = (val: number | undefined) => {
      if (typeof val !== 'number') return 0;
      return isTruncated(val) ? Math.round(val * 1000000) : val;
    };

    const fixed = rawInputs.map(r => ({
      ...r,
      pagu51: fixVal(r.pagu51),
      pagu52: fixVal(r.pagu52),
      pagu53: fixVal(r.pagu53),
      pagu57: fixVal(r.pagu57),
      blokir51: fixVal(r.blokir51),
      blokir52: fixVal(r.blokir52),
      blokir53: fixVal(r.blokir53),
      blokir57: fixVal(r.blokir57),
      realisasi51: fixVal(r.realisasi51),
      realisasi52: fixVal(r.realisasi52),
      realisasi53: fixVal(r.realisasi53),
      realisasi57: fixVal(r.realisasi57)
    }));

    setDraftInputs({});
    onUpdateProject({
      ...project,
      penyerapan: fixed
    });
  };

  // Reset override target periode tertentu ke standar triwulan
  const handleResetRowTarget = (idx: number, field: keyof PenyerapanInput) => {
    const updated = [...rawInputs];
    updated[idx] = {
      ...updated[idx],
      [field]: undefined
    };
    onUpdateProject({
      ...project,
      penyerapan: updated
    });
  };

  // Update target triwulanan di awal / global dispensasi
  const handleUpdateQuarterTarget = (quarter: number, belanja: '51' | '52' | '53' | '57', valPercent: number) => {
    const current = {
      1: { ...(project.penyerapanQuarterTargets?.[1] || DEFAULT_QUARTER_TARGETS[1]) },
      2: { ...(project.penyerapanQuarterTargets?.[2] || DEFAULT_QUARTER_TARGETS[2]) },
      3: { ...(project.penyerapanQuarterTargets?.[3] || DEFAULT_QUARTER_TARGETS[3]) },
      4: { ...(project.penyerapanQuarterTargets?.[4] || DEFAULT_QUARTER_TARGETS[4]) }
    };
    current[quarter as 1 | 2 | 3 | 4] = {
      ...current[quarter as 1 | 2 | 3 | 4],
      [belanja]: Math.max(0, valPercent / 100)
    };
    onUpdateProject({
      ...project,
      penyerapanQuarterTargets: current
    });
  };

  // Reset seluruh target triwulanan ke standar awal DJPb PER-5/PB/2024
  const handleResetQuarterTargets = () => {
    onUpdateProject({
      ...project,
      penyerapanQuarterTargets: undefined
    });
  };

  // Tambah 1 baris periode baru (berurutan)
  const handleAddPeriodRow = () => {
    const nextNum = rawInputs.length + 1;
    const nextPeriodStr = String(nextNum).padStart(2, '0');
    const prevRow = rawInputs.length > 0 ? rawInputs[rawInputs.length - 1] : null;
    const newRow: PenyerapanInput = {
      periode: nextPeriodStr,
      pagu51: prevRow ? prevRow.pagu51 : 0,
      pagu52: prevRow ? prevRow.pagu52 : 0,
      pagu53: prevRow ? prevRow.pagu53 : 0,
      pagu57: prevRow ? prevRow.pagu57 : 0,
      blokir51: 0,
      blokir52: 0,
      blokir53: 0,
      blokir57: 0,
      target51: undefined,
      target52: undefined,
      target53: undefined,
      target57: undefined,
      realisasi51: 0,
      realisasi52: 0,
      realisasi53: 0,
      realisasi57: 0
    };
    onUpdateProject({
      ...project,
      penyerapan: [...rawInputs, newRow]
    });
  };

  // Mulai hanya 1 Bulan saja (Bulan 01)
  const handleStartMonth1Only = () => {
    const month1: PenyerapanInput[] = [
      {
        periode: '01',
        pagu51: 0,
        pagu52: 0,
        pagu53: 0,
        pagu57: 0,
        blokir51: 0,
        blokir52: 0,
        blokir53: 0,
        blokir57: 0,
        target51: undefined,
        target52: undefined,
        target53: undefined,
        target57: undefined,
        realisasi51: 0,
        realisasi52: 0,
        realisasi53: 0,
        realisasi57: 0
      }
    ];
    setDraftInputs({});
    onUpdateProject({
      ...project,
      penyerapan: month1,
      activeIndicators: {
        ...project.activeIndicators,
        penyerapan: true
      }
    });
    setSelectedMonthIdx(0);
  };

  // Mulai kosong dulu (0 baris)
  const handleStartEmpty = () => {
    setDraftInputs({});
    onUpdateProject({
      ...project,
      penyerapan: [],
      activeIndicators: {
        ...project.activeIndicators,
        penyerapan: false
      }
    });
    setSelectedMonthIdx(0);
  };

  // Tambah Triwulan I (Periode 01, 02, 03)
  const handleAddTriwulan1 = () => {
    const existing = new Set(rawInputs.map(r => String(r.periode).padStart(2, '0')));
    const rowsToAdd: PenyerapanInput[] = [];
    const prevRow = rawInputs.length > 0 ? rawInputs[rawInputs.length - 1] : null;
    for (let i = 1; i <= 3; i++) {
      const pStr = String(i).padStart(2, '0');
      if (!existing.has(pStr)) {
        rowsToAdd.push({
          periode: pStr,
          pagu51: prevRow ? prevRow.pagu51 : 0,
          pagu52: prevRow ? prevRow.pagu52 : 0,
          pagu53: prevRow ? prevRow.pagu53 : 0,
          pagu57: prevRow ? prevRow.pagu57 : 0,
          blokir51: 0, blokir52: 0, blokir53: 0, blokir57: 0,
          target51: undefined, target52: undefined, target53: undefined, target57: undefined,
          realisasi51: 0, realisasi52: 0, realisasi53: 0, realisasi57: 0
        });
      }
    }
    const combined = [...rawInputs, ...rowsToAdd].sort((a, b) => parseInt(a.periode, 10) - parseInt(b.periode, 10));
    onUpdateProject({
      ...project,
      penyerapan: combined,
      activeIndicators: {
        ...project.activeIndicators,
        penyerapan: true
      }
    });
  };

  // Tambah Semester I (Periode 01 s.d. 06)
  const handleAddSemester1 = () => {
    const existing = new Set(rawInputs.map(r => String(r.periode).padStart(2, '0')));
    const rowsToAdd: PenyerapanInput[] = [];
    const prevRow = rawInputs.length > 0 ? rawInputs[rawInputs.length - 1] : null;
    for (let i = 1; i <= 6; i++) {
      const pStr = String(i).padStart(2, '0');
      if (!existing.has(pStr)) {
        rowsToAdd.push({
          periode: pStr,
          pagu51: prevRow ? prevRow.pagu51 : 0,
          pagu52: prevRow ? prevRow.pagu52 : 0,
          pagu53: prevRow ? prevRow.pagu53 : 0,
          pagu57: prevRow ? prevRow.pagu57 : 0,
          blokir51: 0, blokir52: 0, blokir53: 0, blokir57: 0,
          target51: undefined, target52: undefined, target53: undefined, target57: undefined,
          realisasi51: 0, realisasi52: 0, realisasi53: 0, realisasi57: 0
        });
      }
    }
    const combined = [...rawInputs, ...rowsToAdd].sort((a, b) => parseInt(a.periode, 10) - parseInt(b.periode, 10));
    onUpdateProject({
      ...project,
      penyerapan: combined,
      activeIndicators: {
        ...project.activeIndicators,
        penyerapan: true
      }
    });
  };

  // Tambah 12 Bulan Lengkap (Periode 01 s.d. 12)
  const handleAdd12Months = () => {
    const existing = new Set(rawInputs.map(r => String(r.periode).padStart(2, '0')));
    const rowsToAdd: PenyerapanInput[] = [];
    const prevRow = rawInputs.length > 0 ? rawInputs[rawInputs.length - 1] : null;
    for (let i = 1; i <= 12; i++) {
      const pStr = String(i).padStart(2, '0');
      if (!existing.has(pStr)) {
        rowsToAdd.push({
          periode: pStr,
          pagu51: prevRow ? prevRow.pagu51 : 0,
          pagu52: prevRow ? prevRow.pagu52 : 0,
          pagu53: prevRow ? prevRow.pagu53 : 0,
          pagu57: prevRow ? prevRow.pagu57 : 0,
          blokir51: 0, blokir52: 0, blokir53: 0, blokir57: 0,
          target51: undefined, target52: undefined, target53: undefined, target57: undefined,
          realisasi51: 0, realisasi52: 0, realisasi53: 0, realisasi57: 0
        });
      }
    }
    const combined = [...rawInputs, ...rowsToAdd].sort((a, b) => parseInt(a.periode, 10) - parseInt(b.periode, 10));
    onUpdateProject({
      ...project,
      penyerapan: combined,
      activeIndicators: {
        ...project.activeIndicators,
        penyerapan: true
      }
    });
  };

  // Hapus satu baris periode - dapat menghapus seluruh baris sampai 0 baris (N/A)
  const handleDeletePeriodRow = (idx: number) => {
    const updated = rawInputs.filter((_, i) => i !== idx);
    onUpdateProject({
      ...project,
      penyerapan: updated,
      activeIndicators: {
        ...project.activeIndicators,
        penyerapan: updated.length > 0 ? (project.activeIndicators?.penyerapan ?? true) : false
      }
    });
    if (selectedMonthIdx >= updated.length) {
      setSelectedMonthIdx(Math.max(0, updated.length - 1));
    }
  };

  // Toggle apakah indikator Penyerapan Anggaran diperhitungkan (20%) atau Tidak Diperhitungkan (N/A)
  const handleToggleActiveIndicator = () => {
    const isCurrentlyActive = (project.activeIndicators?.penyerapan !== false) && rawInputs.length > 0;
    if (isCurrentlyActive) {
      onUpdateProject({
        ...project,
        activeIndicators: {
          ...project.activeIndicators,
          penyerapan: false
        }
      });
    } else {
      const rowsToUse = rawInputs.length > 0 ? rawInputs : DEFAULT_EXCEL_PENYERAPAN_PERIODS.slice(0, 12).map((r: any) => ({
        periode: r.periode,
        pagu51: r.pagu51 ?? 0,
        pagu52: r.pagu52 ?? 0,
        pagu53: r.pagu53 ?? 0,
        pagu57: r.pagu57 ?? 0,
        blokir51: r.blokir51 ?? 0,
        blokir52: r.blokir52 ?? 0,
        blokir53: r.blokir53 ?? 0,
        blokir57: r.blokir57 ?? 0,
        target51: r.target51,
        target52: r.target52,
        target53: r.target53,
        target57: r.target57,
        realisasi51: r.realisasi51 ?? 0,
        realisasi52: r.realisasi52 ?? 0,
        realisasi53: r.realisasi53 ?? 0,
        realisasi57: r.realisasi57 ?? 0
      }));
      onUpdateProject({
        ...project,
        penyerapan: rowsToUse,
        activeIndicators: {
          ...project.activeIndicators,
          penyerapan: true
        }
      });
    }
  };

  // Kosongkan seluruh nilai pagu & baris ke 0 baris
  const handleClearForm = () => {
    if (window.confirm('Kosongkan formulir Penyerapan Anggaran (0 baris)? Seluruh baris periode akan dihapus dan indikator ini akan dijadikan N/A (tidak diperhitungkan).')) {
      onUpdateProject({
        ...project,
        penyerapan: [],
        activeIndicators: {
          ...project.activeIndicators,
          penyerapan: false
        }
      });
      setWhatIfBoostPct(0);
      setDraftInputs({});
    }
  };

  // Reset ke workbook Excel
  const handleResetToWorkbook = () => {
    if (window.confirm('Muat template 12 periode Penyerapan Anggaran dari default workbook "Kalkulator Perhitungan IKPA 2026.xlsx"?')) {
      const defaultRows: PenyerapanInput[] = DEFAULT_EXCEL_PENYERAPAN_PERIODS.slice(0, 12).map((r: any) => ({
        periode: r.periode,
        pagu51: r.pagu51 ?? 0,
        pagu52: r.pagu52 ?? 0,
        pagu53: r.pagu53 ?? 0,
        pagu57: r.pagu57 ?? 0,
        blokir51: r.blokir51 ?? 0,
        blokir52: r.blokir52 ?? 0,
        blokir53: r.blokir53 ?? 0,
        blokir57: r.blokir57 ?? 0,
        target51: r.target51,
        target52: r.target52,
        target53: r.target53,
        target57: r.target57,
        realisasi51: r.realisasi51 ?? 0,
        realisasi52: r.realisasi52 ?? 0,
        realisasi53: r.realisasi53 ?? 0,
        realisasi57: r.realisasi57 ?? 0
      }));
      onUpdateProject({
        ...project,
        penyerapan: defaultRows,
        activeIndicators: {
          ...project.activeIndicators,
          penyerapan: true
        }
      });
      setWhatIfBoostPct(0);
      setDraftInputs({});
    }
  };

  // Simpan ke local storage
  const handleSaveToLocalStorage = () => {
    try {
      localStorage.setItem('ikpa_2026_penyerapan_data', JSON.stringify(rawInputs));
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 3000);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };

  // Salin TSV ke clipboard untuk langsung ditempel ke Microsoft Excel
  const handleCopyTsv = () => {
    const headers = [
      'Periode',
      'Pagu 51', 'Pagu 52', 'Pagu 53', 'Pagu 57',
      'Blokir 51', 'Blokir 52', 'Blokir 53', 'Blokir 57',
      'Pagu Netto 51', 'Pagu Netto 52', 'Pagu Netto 53', 'Pagu Netto 57',
      'Target 51', 'Target 52', 'Target 53', 'Target 57',
      'Nominal Target 51', 'Nominal Target 52', 'Nominal Target 53', 'Nominal Target 57',
      'Realisasi 51', 'Realisasi 52', 'Realisasi 53', 'Realisasi 57',
      '% Capaian 51', '% Capaian 52', '% Capaian 53', '% Capaian 57',
      'Proporsi 51', 'Proporsi 52', 'Proporsi 53', 'Proporsi 57',
      'NKPA 51', 'NKPA 52', 'NKPA 53', 'NKPA 57',
      'Nilai Periode (P)', 'Nilai Kumulatif (Q)'
    ];

    const rowsTsv = periods.map(p => [
      p.periode,
      p.pagu51, p.pagu52, p.pagu53, p.pagu57,
      p.blokir51, p.blokir52, p.blokir53, p.blokir57,
      p.paguNetto51, p.paguNetto52, p.paguNetto53, p.paguNetto57,
      `${(p.target51 * 100).toFixed(0)}%`, `${(p.target52 * 100).toFixed(0)}%`, `${(p.target53 * 100).toFixed(0)}%`, `${(p.target57 * 100).toFixed(0)}%`,
      p.targetNominal51, p.targetNominal52, p.targetNominal53, p.targetNominal57,
      p.realisasi51, p.realisasi52, p.realisasi53, p.realisasi57,
      p.achievement51.toFixed(2), p.achievement52.toFixed(2), p.achievement53.toFixed(2), p.achievement57.toFixed(2),
      p.proportion51.toFixed(2), p.proportion52.toFixed(2), p.proportion53.toFixed(2), p.proportion57.toFixed(2),
      p.nkpa51.toFixed(2), p.nkpa52.toFixed(2), p.nkpa53.toFixed(2), p.nkpa57.toFixed(2),
      p.nilaiPeriode.toFixed(2), p.nilaiIndikator.toFixed(2)
    ].join('\t'));

    const tsvContent = [headers.join('\t'), ...rowsTsv].join('\n');
    navigator.clipboard.writeText(tsvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Ekspor JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rawInputs, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `penyerapan_anggaran_ikpa_2026_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  // Impor JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed)) {
          onUpdateProject({
            ...project,
            penyerapan: parsed
          });
          alert(`Berhasil mengimpor ${parsed.length} baris periode data Penyerapan Anggaran!`);
        } else {
          alert('Format file JSON tidak valid. Memerlukan array data periode.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Golden Test runner state
  const [goldenTestSummary, setGoldenTestSummary] = useState<PenyerapanGoldenTestSummary | null>(null);
  const handleRunGoldenTest = () => {
    const summary = runPenyerapanGoldenTest();
    setGoldenTestSummary(summary);
    setShowGoldenTestModal(true);
  };

  // Data audit periode aktif
  const currentAuditPeriod = periods.find(p => p.periode === auditSelectedPeriode) || periods[0];
  const auditData = useMemo(() => {
    if (!currentAuditPeriod) return null;
    const b = auditSelectedBelanja;
    const pagu = currentAuditPeriod[`pagu${b}` as keyof PenyerapanPeriod] as number;
    const blokir = currentAuditPeriod[`blokir${b}` as keyof PenyerapanPeriod] as number;
    const paguNetto = currentAuditPeriod[`paguNetto${b}` as keyof PenyerapanPeriod] as number;
    const target = currentAuditPeriod[`target${b}` as keyof PenyerapanPeriod] as number;
    const targetNominal = currentAuditPeriod[`targetNominal${b}` as keyof PenyerapanPeriod] as number;
    const realisasi = currentAuditPeriod[`realisasi${b}` as keyof PenyerapanPeriod] as number;
    const achievement = currentAuditPeriod[`achievement${b}` as keyof PenyerapanPeriod] as number;
    const proportion = currentAuditPeriod[`proportion${b}` as keyof PenyerapanPeriod] as number;
    const nkpa = currentAuditPeriod[`nkpa${b}` as keyof PenyerapanPeriod] as number;

    return {
      belanja: b,
      pagu,
      blokir,
      paguNetto,
      target,
      targetNominal,
      realisasi,
      achievement,
      proportion,
      nkpa,
      nilaiPeriode: currentAuditPeriod.nilaiPeriode,
      nilaiIndikator: currentAuditPeriod.nilaiIndikator
    };
  }, [currentAuditPeriod, auditSelectedBelanja]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOP BANNER & FORMULA INSPECTOR */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border p-5 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Bobot 20% | Sel Q71
            </span>
            <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
              4 Jenis Belanja (51, 52, 53, 57)
            </span>
            <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
              Target Kumulatif Triwulan
            </span>
          </div>
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Kalkulator Penyerapan Anggaran
          </h3>
          <p className={`text-xs max-w-3xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Perhitungan deterministik 100% konsisten dengan buku kerja Excel referensi. Menghitung pagu netto, nominal target triwulanan, capaian maksimal 100%, proporsi pagu terpadu, Nilai Kinerja Penyerapan Anggaran (NKPA), dan nilai kumulatif berkala anchor (Maret, Juni, September, Desember).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
              Nilai Final (Q71)
            </span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {finalScore.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Bobot 20%: {(result?.weightedValue ?? 0).toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <IndikatorCalculateButton
              indicatorKey="penyerapanAnggaran"
              indicatorName="Penyerapan Anggaran"
              weight={20}
              indicatorResult={result}
              validationIssues={validationIssues}
              satkerName={project.metadata?.namaSatker || project.name}
              isDark={isDark}
            />

            <button
              onClick={() => onOpenInspector(
                'Indikator Penyerapan Anggaran',
                'Q71',
                '=AVERAGE($P$17, $P$35, $P$53, P71)',
                finalScore.toFixed(2),
                result.details
              )}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
            >
              <Calculator className="h-4 w-4 text-emerald-600" />
              Formula Inspector
            </button>
            <button
              onClick={handleRunGoldenTest}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition-colors"
            >
              <ShieldCheck className="h-4 w-4" />
              Uji 16 Golden Tests
            </button>
          </div>
        </div>
      </div>

      {/* Banner Validasi Data Input */}
      <IndikatorValidationBanner
        indicatorName="Penyerapan Anggaran"
        issues={validationIssues}
        isConfirmed={isValidationConfirmed}
        onToggleConfirm={() => setIsValidationConfirmed(!isValidationConfirmed)}
        isDark={isDark}
      />

      {/* Petunjuk Pengisian & Cara Menggunakan */}
      <PetunjukPengisianCard
        indicatorId="penyerapan"
        isDark={isDark}
        defaultExpanded={true}
      />

      {/* Status Penilaian Indikator (Diperhitungkan / N/A) */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
        (project.activeIndicators?.penyerapan !== false && rawInputs.length > 0)
          ? (isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs')
          : (isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-amber-50/90 border-amber-200 text-amber-900 shadow-xs')
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={`p-2 rounded-xl mt-0.5 sm:mt-0 ${
            (project.activeIndicators?.penyerapan !== false && rawInputs.length > 0)
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-amber-500/15 text-amber-600'
          }`}>
            {(project.activeIndicators?.penyerapan !== false && rawInputs.length > 0) ? (
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
                (project.activeIndicators?.penyerapan !== false && rawInputs.length > 0)
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
              }`}>
                {(project.activeIndicators?.penyerapan !== false && rawInputs.length > 0)
                  ? '✓ DIPERHITUNGKAN (Bobot 20%)'
                  : '⊘ TIDAK DIPERHITUNGKAN / N/A (Bobot 0%)'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {(project.activeIndicators?.penyerapan !== false && rawInputs.length > 0)
                ? `Terdapat ${rawInputs.length} baris periode aktif. Indikator ini diperhitungkan dalam total IKPA.`
                : 'Indikator ini tidak memiliki data periode aktif (0 baris) atau dinonaktifkan. Nilai akhir IKPA satker dinormalkan via Konversi Bobot (O6) sehingga tidak mengurangi nilai akhir.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleToggleActiveIndicator}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow-2xs cursor-pointer ${
              (project.activeIndicators?.penyerapan !== false && rawInputs.length > 0)
                ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300'
                : 'border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {(project.activeIndicators?.penyerapan !== false && rawInputs.length > 0)
              ? 'Jadikan N/A (Nonaktifkan)'
              : 'Aktifkan Kembali Indikator'}
          </button>
        </div>
      </div>

      {/* 2. WARNING JIKA BLOKIR > PAGU */}
      {warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800/80 p-4 text-xs flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-900 dark:text-amber-300">Peringatan Validasi Input:</span>
            <ul className="mt-1 list-disc list-inside space-y-0.5 text-amber-800 dark:text-amber-400">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 2b. ALERT RECOVERY JIKA TERDETEKSI NILAI TERPOTONG DESIMAL */}
      {truncatedStats.hasTruncated && (
        <div className="rounded-2xl border border-amber-400 bg-amber-50/90 dark:bg-amber-950/50 dark:border-amber-700/80 p-4 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3 max-w-3xl">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950 dark:text-amber-200">
                Terdeteksi Nilai Anggaran Terpotong Desimal ({truncatedStats.count} sel)
              </div>
              <p className="mt-0.5 text-amber-900 dark:text-amber-300 leading-relaxed">
                Ditemukan nilai pecahan (seperti <code>916.718</code> alih-alih <code>916.718.000</code>) akibat pembacaan titik sebelumnya. 
                Sistem kini sudah mendukung format ribuan/jutaan penuh. Anda dapat langsung mengetik ulang angka ribuan dengan titik, atau klik tombol di samping untuk otomatis mengembalikan angka terpotong ke nilai rupiah utuh.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFixTruncatedNumbers}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            Perbaiki Otomatis ke Rupiah Utuh (x1.000.000)
          </button>
        </div>
      )}

      {/* 3. RINGKASAN TRIWULAN (SECTION 26) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
            Triwulan I (Q17)
          </span>
          <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">
            {scoreTW1.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Anchor Maret (P17)
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
            Triwulan II (Q35)
          </span>
          <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">
            {scoreTW2.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            AVERAGE(P17, P35)
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
            Triwulan III (Q53)
          </span>
          <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">
            {scoreTW3.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            AVERAGE(P17, P35, P53)
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
            Triwulan IV (Q71)
          </span>
          <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">
            {scoreTW4.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            AVERAGE(P17, P35, P53, P71)
          </span>
        </div>

        <div className={`col-span-2 sm:col-span-1 p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/20`}>
          <span className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-semibold block">
            Nilai Akhir (Q71)
          </span>
          <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {finalScore.toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block">
            Basis Sheet Interface I6
          </span>
        </div>
      </div>

      {/* 4. WHAT-IF BOOSTER SIMULATION */}
      <div className={`rounded-2xl border p-4 shadow-xs ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-600" />
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                What-If Analysis: Percepatan Realisasi Belanja Barang & Modal (52 & 53)
              </h4>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Uji coba simulasi percepatan penyerapan belanja barang dan modal hingga +{whatIfBoostPct}% untuk mengejar target triwulanan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={whatIfBoostPct}
              onChange={e => setWhatIfBoostPct(Number(e.target.value))}
              className="w-32 accent-emerald-600"
            />
            <span className="font-mono font-bold text-xs w-10 text-emerald-600 dark:text-emerald-400">
              +{whatIfBoostPct}%
            </span>
            {whatIfBoostPct > 0 && (
              <button
                onClick={() => setWhatIfBoostPct(0)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Reset What-If
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4.5. PENGATURAN TARGET TRIWULANAN & DISPENSASI (ATURAN AWAL) */}
      <div className={`rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div 
          onClick={() => setShowTargetSetting(!showTargetSetting)}
          className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Pengaturan Target Triwulanan (Standar PER-5 / Dispensasi)
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  hasCustomQuarterTargets
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                }`}>
                  {hasCustomQuarterTargets ? '⚡ Target Kustom / Ada Dispensasi' : '✓ Standar DJPb PER-5'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Target acuan triwulan: TW I (20/15/10/25%) • TW II (50/50/40/50%) • TW III (75/70/70/75%) • TW IV (95/90/90/95%). Klik untuk atur dispensasi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasCustomQuarterTargets && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetQuarterTargets();
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Reset ke Standar PER-5
              </button>
            )}
            <button
              type="button"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showTargetSetting ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showTargetSetting && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
              💡 <strong>Aturan Awal & Dispensasi:</strong> Target triwulanan berikut berlaku sebagai standar otomatis untuk seluruh bulan pada triwulan terkait. Jika satker menerima surat dispensasi/relaksasi target, Anda dapat mengubah persentase di bawah ini untuk seluruh triwulan, atau langsung mengubah target periode tertentu pada kolom <strong>Target % (Dispensasi)</strong> di tabel periode.
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className={`border-b font-bold ${isDark ? 'bg-slate-800/80 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                    <th className="px-3 py-2 text-left w-36">Triwulan</th>
                    <th className="px-3 py-2 text-left w-40">Periode Bulan</th>
                    <th className="px-3 py-2 text-right">Belanja Pegawai (51)</th>
                    <th className="px-3 py-2 text-right">Belanja Barang (52)</th>
                    <th className="px-3 py-2 text-right">Belanja Modal (53)</th>
                    <th className="px-3 py-2 text-right">Belanja Bansos (57)</th>
                    <th className="px-3 py-2 text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                  {[
                    { q: 1, label: 'Triwulan I', months: '01 s.d. 03 (Jan - Mar)' },
                    { q: 2, label: 'Triwulan II', months: '04 s.d. 06 (Apr - Jun)' },
                    { q: 3, label: 'Triwulan III', months: '07 s.d. 09 (Jul - Sep)' },
                    { q: 4, label: 'Triwulan IV', months: '10 s.d. 12 (Okt - Des)' },
                  ].map(row => {
                    const qTargets = activeQuarterTargets[row.q as 1 | 2 | 3 | 4];
                    const defaultQ = DEFAULT_QUARTER_TARGETS[row.q];
                    const isCustomQ = (qTargets[51] !== defaultQ[51]) ||
                                      (qTargets[52] !== defaultQ[52]) ||
                                      (qTargets[53] !== defaultQ[53]) ||
                                      (qTargets[57] !== defaultQ[57]);

                    return (
                      <tr key={row.q} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/60'}>
                        <td className="px-3 py-2.5 font-bold font-sans text-slate-800 dark:text-slate-200">
                          {row.label}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 font-sans text-[11px]">
                          {row.months}
                        </td>
                        {(['51', '52', '53', '57'] as const).map(b => {
                          const val = Math.round(qTargets[b] * 100);
                          return (
                            <td key={b} className="px-2 py-1.5 text-right">
                              <div className="inline-flex items-center gap-1 justify-end">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="1"
                                  value={val}
                                  onChange={e => handleUpdateQuarterTarget(row.q, b, Number(e.target.value) || 0)}
                                  className="w-16 text-right rounded border px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 focus:outline-none focus:border-indigo-500"
                                />
                                <span className="text-slate-400 font-sans text-xs">%</span>
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center font-sans">
                          {isCustomQ ? (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                              Dispensasi
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                              Standar
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 5. TOOLBAR: VIEW MODES & DATA ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* View Switcher */}
        <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
          <button
            onClick={() => setViewMode('excel')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors cursor-pointer ${
              viewMode === 'excel'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" />
            Tampilan Tabel ({rawInputs.length} Periode)
          </button>
          <button
            onClick={() => setViewMode('simple')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors cursor-pointer ${
              viewMode === 'simple'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Mode Ringkas ({rawInputs.length} Periode)
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Row Addition Buttons */}
          <button
            onClick={handleAddPeriodRow}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Tambah baris periode bulan berikutnya"
          >
            <Plus className="h-3.5 w-3.5" />
            + Tambah Baris ({rawInputs.length < 12 ? BULAN_NAMES[rawInputs.length] : `Bulan ${rawInputs.length + 1}`})
          </button>

          {rawInputs.length < 3 && (
            <button
              onClick={handleAddTriwulan1}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-100 shadow-xs transition-colors cursor-pointer"
              title="Tambah baris Triwulan I sekaligus (Bulan 01 s.d. 03)"
            >
              + Triwulan I (3 Bln)
            </button>
          )}

          {rawInputs.length < 6 && (
            <button
              onClick={handleAddSemester1}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors cursor-pointer"
              title="Tambah baris Semester I sekaligus (Bulan 01 s.d. 06)"
            >
              + Semester I (6 Bln)
            </button>
          )}

          {rawInputs.length < 12 && (
            <button
              onClick={handleAdd12Months}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors cursor-pointer"
              title="Lengkapi sampai 12 Bulan Penuh"
            >
              + 12 Bulan Penuh
            </button>
          )}

          <button
            onClick={handleCopyTsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
            {copied ? 'Tersalin!' : 'Salin Tabel (TSV Excel)'}
          </button>

          <button
            onClick={() => setShowAuditPanel(!showAuditPanel)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors ${
              showAuditPanel
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
            Mode Audit Excel
          </button>

          <button
            onClick={handleSaveToLocalStorage}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
          >
            {savedFeedback ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Save className="h-3.5 w-3.5 text-slate-500" />}
            {savedFeedback ? 'Tersimpan!' : 'Simpan Lokal'}
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Ekspor JSON
          </button>

          <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs cursor-pointer transition-colors">
            <Upload className="h-3.5 w-3.5 text-slate-500" />
            Impor JSON
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={handleResetToWorkbook}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
            title="Muat template 12 periode lengkap dari Excel"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            Reset Default Excel
          </button>

          <button
            onClick={handleClearForm}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 shadow-xs transition-colors"
            title="Kosongkan seluruh baris ke 0 baris"
          >
            <Eraser className="h-3.5 w-3.5 text-rose-500" />
            Kosongkan (0 Baris)
          </button>
        </div>
      </div>

      {/* 5.5. PRESET RENTANG PERIODE SIMULASI PENYERAPAN */}
      <div className={`rounded-2xl border p-4 shadow-xs ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-gradient-to-r from-emerald-50/80 via-sky-50/50 to-white border-emerald-200/80'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Preset Rentang Periode Simulasi
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white font-mono">
                {rawInputs.length} Bulan Aktif
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Mulai bertahap dari <strong>Bulan 1</strong>, mulai <strong>kosong (0 baris)</strong>, atau isi seluruh bulan untuk simulasi penyerapan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleStartMonth1Only}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Mulai dari Bulan 01 (Januari) saja"
            >
              <Sparkles className="h-3.5 w-3.5" />
              🌟 Mulai Bulan 1 Dulu
            </button>

            <button
              onClick={handleStartEmpty}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Kosongkan seluruh baris menjadi 0 baris"
            >
              <Eraser className="h-3.5 w-3.5 text-slate-500" />
              🧹 Mulai Kosong Dulu
            </button>

            <button
              onClick={handleAddTriwulan1}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Triwulan I (01-03)
            </button>

            <button
              onClick={handleAdd12Months}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              12 Bulan Penuh
            </button>
          </div>
        </div>
      </div>

      {/* Banner jika saat ini 12 bulan tapi belum ada realisasi */}
      {rawInputs.length === 12 && rawInputs.every(r => r.realisasi51 === 0 && r.pagu51 === 0) && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/40 dark:border-emerald-800 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-extrabold text-emerald-950 dark:text-emerald-200 text-sm">
                Tabel Terbuka 12 Bulan
              </span>
              <p className="text-emerald-800 dark:text-emerald-300 text-xs mt-0.5">
                Ingin mulai dari <strong>Bulan 1 saja</strong> agar lebih mudah menghitung dan mengisi data bertahap?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleStartMonth1Only}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-xs cursor-pointer"
            >
              🌟 Ubah ke Bulan 1 Saja
            </button>
            <button
              onClick={handleStartEmpty}
              className="px-3 py-1.5 rounded-xl border border-emerald-400 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-200 font-bold text-xs cursor-pointer hover:bg-emerald-100/50"
            >
              Mulai Kosong (0 Baris)
            </button>
          </div>
        </div>
      )}

      {/* 6. MODE AUDIT PANEL (SECTION 27) */}
      {showAuditPanel && auditData && (
        <div className={`rounded-2xl border p-5 space-y-4 shadow-sm ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50/40 border-emerald-200'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-emerald-600" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Audit Perhitungan Langkah-Demi-Langkah Excel
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Periode:</span>
                <select
                  value={auditSelectedPeriode}
                  onChange={e => setAuditSelectedPeriode(e.target.value)}
                  className="rounded-lg border px-2 py-1 font-semibold dark:bg-slate-800 dark:border-slate-700"
                >
                  {periods.map(p => (
                    <option key={p.periode} value={p.periode}>
                      Periode {p.periode} ({BULAN_NAMES[parseInt(p.periode, 10) - 1]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500">Jenis Belanja:</span>
                <div className="flex rounded-lg bg-slate-200 dark:bg-slate-800 p-0.5">
                  {(['51', '52', '53', '57'] as const).map(b => (
                    <button
                      key={b}
                      onClick={() => setAuditSelectedBelanja(b)}
                      className={`px-2.5 py-1 rounded-md font-mono font-bold text-xs transition-colors ${
                        auditSelectedBelanja === b
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] font-sans text-slate-400 uppercase font-bold block">
                1. Pagu Netto Belanja {auditData.belanja}
              </span>
              <div className="text-slate-700 dark:text-slate-300">
                Pagu DIPA: Rp{formatRupiah(auditData.pagu)}
              </div>
              <div className="text-slate-700 dark:text-slate-300">
                Blokir: Rp{formatRupiah(auditData.blokir)}
              </div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                Netto: Rp{formatRupiah(auditData.paguNetto)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] font-sans text-slate-400 uppercase font-bold block">
                2. Target & Realisasi
              </span>
              <div className="text-slate-700 dark:text-slate-300">
                Target %: {(auditData.target * 100).toFixed(0)}%
              </div>
              <div className="text-slate-700 dark:text-slate-300">
                Target Nom: Rp{formatRupiah(auditData.targetNominal)}
              </div>
              <div className="font-bold text-blue-600 dark:text-blue-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                Realisasi: Rp{formatRupiah(auditData.realisasi)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] font-sans text-slate-400 uppercase font-bold block">
                3. % Capaian & Proporsi
              </span>
              <div className="text-slate-700 dark:text-slate-300">
                % Capaian: {auditData.achievement.toFixed(2)}% (Maks 100%)
              </div>
              <div className="text-slate-700 dark:text-slate-300">
                Proporsi: {auditData.proportion.toFixed(2)}%
              </div>
              <div className="font-bold text-purple-600 dark:text-purple-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                NKPA: {auditData.nkpa.toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] font-sans text-slate-400 uppercase font-bold block">
                4. Skor Periode & Kumulatif
              </span>
              <div className="text-slate-700 dark:text-slate-300">
                Nilai Periode (P): {auditData.nilaiPeriode.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                = SUM(NKPA 51 + 52 + 53 + 57)
              </div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                Nilai Kumulatif (Q): {auditData.nilaiIndikator.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. VIEW MODE 1: TAMPILAN EXCEL / TABEL */}
      {viewMode === 'excel' && (
        periods.length === 0 ? (
          <div className={`p-10 text-center rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  Belum Ada Baris Periode Penyerapan Anggaran
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Settingan awal dimulai dari keadaan bersih (0 baris). Satker dapat menambahkan baris periode secara mandiri sesuai realisasi berjalan tanpa harus langsung mengisi hingga Desember.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                <button
                  onClick={handleAddPeriodRow}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  + Tambah Periode Pertama (Bulan 01)
                </button>
                <button
                  onClick={handleAddTriwulan1}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold text-xs cursor-pointer"
                >
                  + Tambah Triwulan I (01 s.d. 03)
                </button>
                <button
                  onClick={handleAddSemester1}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs cursor-pointer"
                >
                  + Tambah Semester I (01 s.d. 06)
                </button>
                <button
                  onClick={handleResetToWorkbook}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Muat Template Excel (12 Bulan)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Struktur Buku Kerja Excel: Penyerapan Anggaran ({periods.length} Periode Terdaftar)
                </h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Sel berbingkai adalah input pengguna (Pagu, Blokir, Realisasi). Sel lainnya dihitung secara otomatis dan deterministik.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500/20 border border-amber-500"></span>
                  Input Pagu & Blokir
                </span>
                <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500/20 border border-indigo-500"></span>
                  Target % (Dispensasi)
                </span>
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-blue-500/20 border border-blue-500"></span>
                  Input Realisasi
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/20 border border-emerald-500"></span>
                  Otomatis (P & Q)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className={`border-b font-bold ${
                  isDark ? 'bg-slate-800/80 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <tr>
                    <th rowSpan={2} className="px-3 py-3 border-r border-slate-200 dark:border-slate-700 text-center w-16">
                      Periode (A)
                    </th>
                    <th colSpan={4} className="px-3 py-2 text-center border-r border-slate-200 dark:border-slate-700 bg-amber-500/10">
                      Pagu DIPA (B:E)
                    </th>
                    <th colSpan={4} className="px-3 py-2 text-center border-r border-slate-200 dark:border-slate-700 bg-amber-500/5">
                      Blokir (F:I)
                    </th>
                    <th colSpan={4} className="px-3 py-2 text-center border-r border-slate-200 dark:border-slate-700 bg-slate-500/10">
                      Pagu Netto (J:M)
                    </th>
                    <th colSpan={4} className="px-3 py-2 text-center border-r border-slate-200 dark:border-slate-700 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                      Target % (Dispensasi)
                    </th>
                    <th colSpan={4} className="px-3 py-2 text-center border-r border-slate-200 dark:border-slate-700 bg-blue-500/10">
                      Realisasi Anggaran
                    </th>
                    <th colSpan={4} className="px-3 py-2 text-center border-r border-slate-200 dark:border-slate-700 bg-purple-500/10">
                      % Capaian thd Target
                    </th>
                    <th colSpan={4} className="px-3 py-2 text-center border-r border-slate-200 dark:border-slate-700 bg-teal-500/10">
                      NKPA Belanja
                    </th>
                    <th rowSpan={2} className="px-3 py-3 text-right border-r border-slate-200 dark:border-slate-700 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono">
                      P (Periode)
                    </th>
                    <th rowSpan={2} className="px-3 py-3 text-right bg-emerald-600 text-white font-mono font-black">
                      Q (Kumulatif)
                    </th>
                    <th rowSpan={2} className="px-2 py-3 text-center border-l border-slate-200 dark:border-slate-700 w-14 text-slate-500">
                      Aksi
                    </th>
                  </tr>
                  <tr className="border-t border-slate-200 dark:border-slate-700 text-[11px] font-mono">
                    {/* Pagu */}
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">51</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">52</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">53</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">57</th>
                    {/* Blokir */}
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">51</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">52</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">53</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">57</th>
                    {/* Netto */}
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">51</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">52</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">53</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">57</th>
                    {/* Target % */}
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700 bg-indigo-50/40 text-indigo-700 dark:text-indigo-300">51</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700 bg-indigo-50/40 text-indigo-700 dark:text-indigo-300">52</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700 bg-indigo-50/40 text-indigo-700 dark:text-indigo-300">53</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700 bg-indigo-50/40 text-indigo-700 dark:text-indigo-300">57</th>
                    {/* Realisasi */}
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">51</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">52</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">53</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">57</th>
                    {/* % Capaian */}
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">51</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">52</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">53</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">57</th>
                    {/* NKPA */}
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">51</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">52</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">53</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700">57</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {periods.map((r, idx) => {
                    const isAnchorTW = idx === 2 || idx === 5 || idx === 8 || idx === 11;

                    return (
                      <tr
                        key={r.periode}
                        className={`${
                          isAnchorTW
                            ? isDark ? 'bg-emerald-950/20 hover:bg-emerald-950/30' : 'bg-emerald-50/50 hover:bg-emerald-50/70'
                            : isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Periode */}
                        <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 font-sans font-bold text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded-md ${
                            isAnchorTW
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {r.periode}
                          </span>
                        </td>

                        {/* Pagu 51, 52, 53, 57 */}
                        {(['51', '52', '53', '57'] as const).map(b => {
                          const key = `pagu_${idx}_${b}`;
                          const field = `pagu${b}` as keyof PenyerapanInput;
                          const val = r[field as keyof PenyerapanPeriod] as number;
                          return (
                            <td key={b} className="px-1 py-1 text-right border-r border-slate-200 dark:border-slate-700">
                              <input
                                type="text"
                                value={draftInputs[key] !== undefined ? draftInputs[key] : (val === 0 ? '0' : val.toLocaleString('id-ID'))}
                                onChange={e => setDraftInputs({ ...draftInputs, [key]: e.target.value })}
                                onBlur={() => handleCommitDraft(key, idx, field)}
                                onFocus={e => e.target.select()}
                                placeholder="0"
                                className="w-24 sm:w-28 min-w-[95px] text-right rounded border px-1.5 py-0.5 text-[11px] font-mono bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 focus:outline-none focus:border-amber-500"
                              />
                            </td>
                          );
                        })}

                        {/* Blokir 51, 52, 53, 57 */}
                        {(['51', '52', '53', '57'] as const).map(b => {
                          const key = `blokir_${idx}_${b}`;
                          const field = `blokir${b}` as keyof PenyerapanInput;
                          const val = r[field as keyof PenyerapanPeriod] as number;
                          return (
                            <td key={b} className="px-1 py-1 text-right border-r border-slate-200 dark:border-slate-700">
                              <input
                                type="text"
                                value={draftInputs[key] !== undefined ? draftInputs[key] : (val > 0 ? val.toLocaleString('id-ID') : '0')}
                                onChange={e => setDraftInputs({ ...draftInputs, [key]: e.target.value })}
                                onBlur={() => handleCommitDraft(key, idx, field)}
                                onFocus={e => e.target.select()}
                                placeholder="0"
                                className="w-20 sm:w-24 min-w-[80px] text-right rounded border px-1.5 py-0.5 text-[11px] font-mono bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:border-slate-400"
                              />
                            </td>
                          );
                        })}

                        {/* Pagu Netto 51, 52, 53, 57 (Otomatis) */}
                        {(['51', '52', '53', '57'] as const).map(b => {
                          const netto = r[`paguNetto${b}` as keyof PenyerapanPeriod] as number;
                          return (
                            <td key={b} className="px-2 py-1 text-right border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                              {formatRupiah(netto)}
                            </td>
                          );
                        })}

                        {/* Target % 51, 52, 53, 57 (Aturan Awal / Dispensasi) */}
                        {(['51', '52', '53', '57'] as const).map(b => {
                          const key = `target_${idx}_${b}`;
                          const field = `target${b}` as keyof PenyerapanInput;
                          const isOverridden = rawInputs[idx]?.[field] !== undefined && rawInputs[idx]?.[field] !== null;
                          const targetVal = r[`target${b}` as keyof PenyerapanPeriod] as number;
                          const targetNominal = r[`targetNominal${b}` as keyof PenyerapanPeriod] as number;
                          const displayVal = draftInputs[key] !== undefined
                            ? draftInputs[key]
                            : `${Math.round(targetVal * 100)}`;

                          return (
                            <td key={b} className="px-1.5 py-1 text-right border-r border-slate-200 dark:border-slate-700">
                              <div className="relative inline-flex items-center justify-end group">
                                <input
                                  type="text"
                                  value={displayVal}
                                  title={`Target ${b}: ${(targetVal * 100).toFixed(1)}% (Nominal Target: Rp${formatRupiah(targetNominal)})${isOverridden ? ' [Dispensasi Khusus Periode]' : ' [Standar Triwulan]'}`}
                                  onChange={e => setDraftInputs({ ...draftInputs, [key]: e.target.value })}
                                  onBlur={() => handleCommitTargetDraft(key, idx, field)}
                                  onFocus={e => e.target.select()}
                                  className={`w-14 text-right rounded border px-1 py-0.5 text-[10px] font-mono focus:outline-none transition-colors ${
                                    isOverridden
                                      ? 'bg-amber-100/90 border-amber-400 text-amber-900 dark:bg-amber-950/60 dark:border-amber-600 dark:text-amber-200 font-bold focus:border-amber-500'
                                      : 'bg-indigo-50/50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900 dark:text-indigo-300 focus:border-indigo-500'
                                  }`}
                                />
                                <span className="text-[9px] text-slate-400 ml-0.5">%</span>
                                {isOverridden && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetRowTarget(idx, field)}
                                    title="Kembalikan ke target triwulanan standar"
                                    className="hidden group-hover:inline-flex absolute -top-1.5 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-3.5 h-3.5 items-center justify-center text-[9px] font-bold shadow-xs cursor-pointer z-10"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Realisasi 51, 52, 53, 57 */}
                        {(['51', '52', '53', '57'] as const).map(b => {
                          const key = `realisasi_${idx}_${b}`;
                          const field = `realisasi${b}` as keyof PenyerapanInput;
                          const val = r[field as keyof PenyerapanPeriod] as number;
                          return (
                            <td key={b} className="px-1 py-1 text-right border-r border-slate-200 dark:border-slate-700">
                              <input
                                type="text"
                                value={draftInputs[key] !== undefined ? draftInputs[key] : (val === 0 ? '0' : val.toLocaleString('id-ID'))}
                                onChange={e => setDraftInputs({ ...draftInputs, [key]: e.target.value })}
                                onBlur={() => handleCommitDraft(key, idx, field)}
                                onFocus={e => e.target.select()}
                                placeholder="0"
                                className="w-24 sm:w-28 min-w-[95px] text-right rounded border px-1.5 py-0.5 text-[11px] font-mono bg-blue-50/50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-300 font-medium focus:outline-none focus:border-blue-500"
                              />
                            </td>
                          );
                        })}

                        {/* % Capaian 51, 52, 53, 57 */}
                        {(['51', '52', '53', '57'] as const).map(b => {
                          const ach = r[`achievement${b}` as keyof PenyerapanPeriod] as number;
                          return (
                            <td key={b} className="px-2 py-1 text-right border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                              {ach.toFixed(2)}%
                            </td>
                          );
                        })}

                        {/* NKPA 51, 52, 53, 57 */}
                        {(['51', '52', '53', '57'] as const).map(b => {
                          const nkpa = r[`nkpa${b}` as keyof PenyerapanPeriod] as number;
                          return (
                            <td key={b} className="px-2 py-1 text-right border-r border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200">
                              {nkpa.toFixed(2)}
                            </td>
                          );
                        })}

                        {/* Nilai Periode (P) */}
                        <td className="px-3 py-1 text-right border-r border-slate-200 dark:border-slate-700 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/5">
                          {r.nilaiPeriode.toFixed(2)}
                        </td>

                        {/* Nilai Kumulatif (Q) */}
                        <td className="px-3 py-1 text-right font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                          {r.nilaiIndikator.toFixed(2)}
                        </td>

                        {/* Aksi Hapus */}
                        <td className="px-2 py-1 text-center border-l border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => handleDeletePeriodRow(idx)}
                            title={`Hapus baris Periode ${r.periode}`}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Row Management Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Terdaftar <strong>{periods.length}</strong> periode ({periods.length < 12 ? `Bulan 01 s.d. ${periods[periods.length - 1]?.periode}` : '12 Bulan Penuh'}).
              </span>
              <button
                onClick={handleAddPeriodRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Tambah Baris Periode ({periods.length < 12 ? BULAN_NAMES[periods.length] : `Bulan ${periods.length + 1}`})
              </button>
            </div>
          </div>
        )
      )}

      {/* 8. VIEW MODE 2: MODE INPUT MUDAH / RINGKAS (SECTION 25) */}
      {viewMode === 'simple' && (
        periods.length === 0 ? (
          <div className={`p-10 text-center rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  Belum Ada Data Periode Penyerapan Anggaran
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Settingan awal dimulai dari formulir bersih (0 baris). Satker dapat menambahkan periode secara mandiri sesuai realisasi berjalan.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                <button
                  onClick={handleAddPeriodRow}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  + Tambah Periode Pertama (Bulan 01)
                </button>
                <button
                  onClick={handleAddTriwulan1}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold text-xs cursor-pointer"
                >
                  + Tambah Triwulan I (01 s.d. 03)
                </button>
                <button
                  onClick={handleResetToWorkbook}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Muat Template Excel (12 Bulan)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Month selector tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {periods.map((p, idx) => {
                const isSelected = selectedMonthIdx === idx;
                const isAnchor = idx === 2 || idx === 5 || idx === 8 || idx === 11;
                const monthName = idx < BULAN_NAMES.length ? BULAN_NAMES[idx] : `Bulan ${idx + 1}`;
                return (
                  <button
                    key={p.periode}
                    onClick={() => setSelectedMonthIdx(idx)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isDark
                          ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-mono text-[10px] uppercase opacity-75">
                      Bln {p.periode}
                    </span>
                    <span>{monthName}</span>
                    {isAnchor && (
                      <span className={`text-[9px] px-1 rounded-sm ${isSelected ? 'bg-emerald-700' : 'bg-emerald-500/20 text-emerald-600'}`}>
                        Akhir TW
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                onClick={handleAddPeriodRow}
                className="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-dashed border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center gap-1 shrink-0 cursor-pointer"
                title="Tambah baris periode berikutnya"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Periode Baru</span>
              </button>
            </div>

            {/* Active Period Card with 4 Belanja Blocks */}
            {(() => {
              const safeIdx = Math.min(selectedMonthIdx, periods.length - 1);
              const curP = periods[safeIdx];
              if (!curP) return null;
              const curIdx = safeIdx;
              const targetCfg = TARGETS[curP.periode] || TARGETS['12'];
              const monthTitle = curIdx < BULAN_NAMES.length ? BULAN_NAMES[curIdx] : `Bulan ${curIdx + 1}`;

              return (
                <div className={`rounded-2xl border p-5 space-y-6 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 font-mono font-bold text-xs text-emerald-600">
                          Periode {curP.periode}
                        </span>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                          {monthTitle} 2026
                        </h4>
                        <button
                          onClick={() => handleDeletePeriodRow(curIdx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer ml-2"
                          title="Hapus periode aktif ini"
                        >
                          <Trash2 className="w-3 h-3" />
                          Hapus Periode
                        </button>
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Target Triwulan: Pegawai (51) {(targetCfg[51]*100).toFixed(0)}%, Barang (52) {(targetCfg[52]*100).toFixed(0)}%, Modal (53) {(targetCfg[53]*100).toFixed(0)}%, Transfer (57) {(targetCfg[57]*100).toFixed(0)}%
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="text-right">
                        <span className="text-[10px] font-sans text-slate-400 block uppercase">Nilai Periode (P)</span>
                        <span className="font-bold text-base text-slate-800 dark:text-slate-200">
                          {curP.nilaiPeriode.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right pl-4 border-l border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-sans text-slate-400 block uppercase">Nilai Kumulatif (Q)</span>
                        <span className="font-black text-xl text-emerald-600 dark:text-emerald-400">
                          {curP.nilaiIndikator.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Cards for 51, 52, 53, 57 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { code: '51' as const, label: 'Belanja Pegawai (51)', color: 'border-blue-200 dark:border-blue-900' },
                      { code: '52' as const, label: 'Belanja Barang (52)', color: 'border-emerald-200 dark:border-emerald-900' },
                      { code: '53' as const, label: 'Belanja Modal (53)', color: 'border-purple-200 dark:border-purple-900' },
                      { code: '57' as const, label: 'Belanja Transfer (57)', color: 'border-amber-200 dark:border-amber-900' }
                    ].map(b => {
                      const code = b.code;
                      const pagu = curP[`pagu${code}` as keyof PenyerapanPeriod] as number;
                      const blokir = curP[`blokir${code}` as keyof PenyerapanPeriod] as number;
                      const netto = curP[`paguNetto${code}` as keyof PenyerapanPeriod] as number;
                      const target = curP[`target${code}` as keyof PenyerapanPeriod] as number;
                      const targetNom = curP[`targetNominal${code}` as keyof PenyerapanPeriod] as number;
                      const realisasi = curP[`realisasi${code}` as keyof PenyerapanPeriod] as number;
                      const ach = curP[`achievement${code}` as keyof PenyerapanPeriod] as number;
                      const prop = curP[`proportion${code}` as keyof PenyerapanPeriod] as number;
                      const nkpa = curP[`nkpa${code}` as keyof PenyerapanPeriod] as number;

                      const keyPagu = `pagu_${curIdx}_${code}`;
                      const keyBlokir = `blokir_${curIdx}_${code}`;
                      const keyTarget = `target_${curIdx}_${code}`;
                      const keyReal = `realisasi_${curIdx}_${code}`;
                      const isOverridden = rawInputs[curIdx]?.[`target${code}` as keyof PenyerapanInput] !== undefined && rawInputs[curIdx]?.[`target${code}` as keyof PenyerapanInput] !== null;

                      return (
                        <div key={code} className={`rounded-2xl border p-4 space-y-3.5 ${
                          isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50/70 border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-700">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                              {b.label}
                            </span>
                            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                              isOverridden
                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              Target: {(target * 100).toFixed(0)}% {isOverridden && '(Dispensasi)'}
                            </span>
                          </div>

                          {/* Input Fields */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1 font-semibold">PAGU DIPA</label>
                              <input
                                type="text"
                                value={draftInputs[keyPagu] !== undefined ? draftInputs[keyPagu] : (pagu === 0 ? '0' : pagu.toLocaleString('id-ID'))}
                                onChange={e => setDraftInputs({ ...draftInputs, [keyPagu]: e.target.value })}
                                onBlur={() => handleCommitDraft(keyPagu, curIdx, `pagu${code}` as keyof PenyerapanInput)}
                                onFocus={e => e.target.select()}
                                placeholder="0"
                                className="w-full text-right rounded-lg border px-2 py-1 font-mono text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1 font-semibold">BLOKIR</label>
                              <input
                                type="text"
                                value={draftInputs[keyBlokir] !== undefined ? draftInputs[keyBlokir] : (blokir > 0 ? blokir.toLocaleString('id-ID') : '0')}
                                onChange={e => setDraftInputs({ ...draftInputs, [keyBlokir]: e.target.value })}
                                onBlur={() => handleCommitDraft(keyBlokir, curIdx, `blokir${code}` as keyof PenyerapanInput)}
                                onFocus={e => e.target.select()}
                                placeholder="0"
                                className="w-full text-right rounded-lg border px-2 py-1 font-mono text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:outline-none focus:border-slate-400"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] text-indigo-500 font-semibold block">TARGET (%)</label>
                                {isOverridden && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetRowTarget(curIdx, `target${code}` as keyof PenyerapanInput)}
                                    className="text-[9px] text-rose-500 hover:underline cursor-pointer"
                                    title="Reset ke target triwulan standar"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                value={draftInputs[keyTarget] !== undefined ? draftInputs[keyTarget] : `${Math.round(target * 100)}`}
                                onChange={e => setDraftInputs({ ...draftInputs, [keyTarget]: e.target.value })}
                                onBlur={() => handleCommitTargetDraft(keyTarget, curIdx, `target${code}` as keyof PenyerapanInput)}
                                onFocus={e => e.target.select()}
                                className={`w-full text-right rounded-lg border px-2 py-1 font-mono text-xs focus:outline-none ${
                                  isOverridden
                                    ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-200 font-bold focus:border-amber-500'
                                    : 'bg-indigo-50/50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-300 font-bold focus:border-indigo-500'
                                }`}
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-blue-500 font-semibold block mb-1">REALISASI</label>
                              <input
                                type="text"
                                value={draftInputs[keyReal] !== undefined ? draftInputs[keyReal] : (realisasi === 0 ? '0' : realisasi.toLocaleString('id-ID'))}
                                onChange={e => setDraftInputs({ ...draftInputs, [keyReal]: e.target.value })}
                                onBlur={() => handleCommitDraft(keyReal, curIdx, `realisasi${code}` as keyof PenyerapanInput)}
                                onFocus={e => e.target.select()}
                                placeholder="0"
                                className="w-full text-right rounded-lg border px-2 py-1 font-mono text-xs bg-blue-50/50 border-blue-300 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300 font-bold focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>

                          {/* Calculated indicators */}
                          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-center font-mono text-[11px]">
                            <div className="bg-white dark:bg-slate-800/80 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                              <span className="text-[9px] font-sans text-slate-400 block">Pagu Netto</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300" title={`Target Nominal: Rp${formatRupiah(targetNom)}`}>
                                Rp{formatRupiah(netto)}
                              </span>
                            </div>

                            <div className="bg-white dark:bg-slate-800/80 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                              <span className="text-[9px] font-sans text-slate-400 block">% Capaian</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {ach.toFixed(2)}%
                              </span>
                            </div>

                            <div className="bg-white dark:bg-slate-800/80 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                              <span className="text-[9px] font-sans text-slate-400 block">Proporsi</span>
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                {prop.toFixed(2)}%
                              </span>
                            </div>

                            <div className="bg-white dark:bg-slate-800/80 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                              <span className="text-[9px] font-sans text-slate-400 block">NKPA</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {nkpa.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )
      )}

      {/* 9. MODAL 16 GOLDEN TESTS (SECTION 29) */}
      {showGoldenTestModal && goldenTestSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl border shadow-2xl flex flex-col ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Hasil Verifikasi 16 Golden Tests Penyerapan Anggaran
                  </h3>
                  <p className="text-xs text-slate-500">
                    Memvalidasi formula deterministik terhadap spesifikasi buku kerja Excel IKPA 2026.
                  </p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                goldenTestSummary.passed
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
              }`}>
                {goldenTestSummary.passedCount} / {goldenTestSummary.totalTests} LULUS
              </span>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-2.5 flex-1 font-mono text-xs">
              {goldenTestSummary.results.map(t => (
                <div
                  key={t.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                    t.passed
                      ? isDark ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : isDark ? 'bg-rose-950/20 border-rose-800/40 text-rose-300' : 'bg-rose-50/60 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{t.id}</span>
                      <span className="font-sans text-[11px]">{t.description}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Expected: {JSON.stringify(t.expected)} | Actual: {JSON.stringify(t.actual)}
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                    t.passed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}>
                    {t.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                onClick={() => setShowGoldenTestModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
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
