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
  Info,
  Layers,
  Save,
  CheckCheck,
  Table as TableIcon,
  HelpCircle,
  TrendingDown,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Zap,
  Sparkles,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';
import {
  SimulationProject,
  DeviasiHalIIIInput,
  DeviasiHal3Row
} from '../../../models/ikpa';
import { validateDeviasiHal3 } from '../../../utils/indikatorValidation';
import { IndikatorValidationBanner } from '../common/IndikatorValidationBanner';
import { IndikatorCalculateButton } from '../common/IndikatorCalculateButton';
import { PetunjukPengisianCard } from '../common/PetunjukPengisianCard';
import {
  round2,
  calculateDeviasiHal3,
  calculateNominalDeviation,
  calculateDeviationPercent,
  calculateBudgetProportion,
  calculateWeightedDeviation,
  calculateTotalDeviation,
  calculateCumulativeDeviation,
  calculateIkpa,
  runDeviasiHal3GoldenTest,
  DEFAULT_WORKBOOK_PROPORTIONS
} from '../../../calculations/deviasiHalIII';
import { DEFAULT_EXCEL_DEV_HAL3_ROWS } from '../../../utils/excelReferenceDefaultData';
import { formatRupiah, formatPercent, formatScore, BULAN_NAMES } from '../../../utils/excelReferenceDataHelper';
import { DeviasiHal3LogicModal } from './DeviasiHal3LogicModal';
import { PaguDipaConfigCard, getQuarterForPeriod, getQuarterMonths } from './PaguDipaConfigCard';
import { AmbangBatasDeviasiCard } from './AmbangBatasDeviasiCard';

interface DeviasiHal3TabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

export const DeviasiHal3Tab: React.FC<DeviasiHal3TabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  // Mode tampilan: 'excel' (tabel kolom A s.d. AB) atau 'simple' (kartu input bulanan)
  const [viewMode, setViewMode] = useState<'excel' | 'simple'>('excel');

  // Filter bulan aktif untuk Mode Input Sederhana
  const [selectedSimpleMonthIdx, setSelectedSimpleMonthIdx] = useState<number>(0);

  // State What-If local simulation slider
  const [whatIfReductionPct, setWhatIfReductionPct] = useState<number>(0);

  // State UI
  const [copied, setCopied] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [showGoldenTestModal, setShowGoldenTestModal] = useState(false);
  const [auditSelectedPeriode, setAuditSelectedPeriode] = useState<string>('01');
  const [auditSelectedBelanja, setAuditSelectedBelanja] = useState<'51' | '52' | '53' | '57'>('51');
  const [isValidationConfirmed, setIsValidationConfirmed] = useState(false);
  const [showLogicModal, setShowLogicModal] = useState<boolean>(false);

  // Draft input untuk string nominal rupiah agar pengetikan tidak terganggu re-render angka
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>({});

  // 1. Ambil baris data dari project (default kosong agar Satker dapat menambah mandiri)
  const rawInputs: (DeviasiHalIIIInput | DeviasiHal3Row)[] = useMemo(() => {
    if (project.deviasiHalIII !== undefined && Array.isArray(project.deviasiHalIII)) {
      return project.deviasiHalIII;
    }
    return [];
  }, [project.deviasiHalIII]);

  // Ambang batas deviasi maksimal (normalnya 5.0% berdasarkan PER-5/PB/2022)
  const ambangBatas = project.ambangBatasDeviasiHal3 ?? project.metadata?.ambangBatasDeviasiHal3 ?? 5.0;

  // 2. Hitung baris secara deterministik dengan calculation engine
  const calculation = useMemo(() => {
    return calculateDeviasiHal3(rawInputs, 15, true, 12, ambangBatas);
  }, [rawInputs, ambangBatas]);

  const rows: DeviasiHal3Row[] = calculation.rows;
  const result = calculation.result;

  // Validasi otomatis input data Deviasi Halaman III DIPA
  const validationIssues = useMemo(() => {
    return validateDeviasiHal3(rawInputs);
  }, [rawInputs]);

  // Nilai ringkasan
  const finalScore = result.cappedValue;
  const finalWeighted = result.weightedValue;
  const lastRow = rows[rows.length - 1];
  const finalCumulativeDeviation = lastRow ? lastRow.rataRataDeviasiKumulatif : 0;

  // Hitung total sel yang memperoleh dispensasi manual (override deviasi tertimbang / nilai IKPA)
  const totalDispensasiActive = useMemo(() => {
    return rows.reduce((acc, r) => {
      return (
        acc +
        (r.isDispensasi51 ? 1 : 0) +
        (r.isDispensasi52 ? 1 : 0) +
        (r.isDispensasi53 ? 1 : 0) +
        (r.isDispensasi57 ? 1 : 0) +
        (r.isDispensasiNilaiIKPA ? 1 : 0)
      );
    }, 0);
  }, [rows]);

  // Handler update field nominal (Rencana / Penyerapan)
  const handleUpdateField = (
    index: number,
    field: keyof DeviasiHalIIIInput,
    numValue: number
  ) => {
    if (index < 0 || index >= rawInputs.length) return;
    const updated = [...rawInputs];
    const targetRow = { ...updated[index], [field]: Math.max(0, numValue) };
    updated[index] = targetRow;

    // Perlakuan Khusus Periode 06 jika mengubah rencana C10 atau D10
    if (targetRow.periode === '06' && (field === 'rencana52' || field === 'rencana53')) {
      if (field === 'rencana52') {
        // G10 = C10 - 2.000.000.000
        targetRow.penyerapan52 = Math.max(0, targetRow.rencana52 - 2000000000);
      }
      if (field === 'rencana53') {
        // H10 = D10 - 10.000.000
        targetRow.penyerapan53 = Math.max(0, targetRow.rencana53 - 10000000);
      }
    }

    // Perlakuan Periode 12: Jika baris Periode 11 (November) diubah dan Periode 12 ada, sinkronkan
    if (targetRow.periode === '11') {
      const decIdx = updated.findIndex(r => r.periode === '12');
      if (decIdx >= 0) {
        const dec = { ...updated[decIdx] };
        dec.rencana51 = targetRow.rencana51;
        dec.rencana52 = targetRow.rencana52;
        dec.rencana53 = targetRow.rencana53;
        dec.rencana57 = targetRow.rencana57;
        dec.penyerapan51 = targetRow.penyerapan51;
        dec.penyerapan52 = targetRow.penyerapan52;
        dec.penyerapan53 = targetRow.penyerapan53;
        dec.penyerapan57 = targetRow.penyerapan57;
        updated[decIdx] = dec;
      }
    }

    onUpdateProject({
      ...project,
      deviasiHalIII: updated
    });
  };

  // Handler input change dengan parsing angka bersih dan format titik instan
  const handleInputChange = (
    key: string,
    index: number,
    field: keyof DeviasiHalIIIInput,
    rawText: string
  ) => {
    const cleanNumber = rawText.replace(/\D/g, '');
    const val = cleanNumber === '' ? 0 : Number(cleanNumber);
    const formattedDraft = cleanNumber === '' ? '' : formatRupiah(val);
    setDraftInputs(prev => ({ ...prev, [key]: formattedDraft }));
    handleUpdateField(index, field, val);
  };

  const handleInputBlur = (key: string) => {
    setDraftInputs(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  // Handler update deviasi tertimbang manual (Dispensasi)
  const handleUpdateDeviasiTertimbang = (
    index: number,
    field: 'overrideDeviasiTertimbang51' | 'overrideDeviasiTertimbang52' | 'overrideDeviasiTertimbang53' | 'overrideDeviasiTertimbang57',
    numValue: number | null
  ) => {
    if (index < 0 || index >= rawInputs.length) return;
    const updated = [...rawInputs];
    const targetRow = { ...updated[index] };
    if (numValue === null || isNaN(numValue)) {
      delete (targetRow as any)[field];
    } else {
      (targetRow as any)[field] = Math.max(0, round2(numValue));
    }
    updated[index] = targetRow;

    onUpdateProject({
      ...project,
      deviasiHalIII: updated
    });
  };

  const handleResetDeviasiTertimbang = (
    index: number,
    field: 'overrideDeviasiTertimbang51' | 'overrideDeviasiTertimbang52' | 'overrideDeviasiTertimbang53' | 'overrideDeviasiTertimbang57'
  ) => {
    handleUpdateDeviasiTertimbang(index, field, null);
  };

  const handleDeviasiTertimbangInputChange = (
    key: string,
    index: number,
    field: 'overrideDeviasiTertimbang51' | 'overrideDeviasiTertimbang52' | 'overrideDeviasiTertimbang53' | 'overrideDeviasiTertimbang57',
    rawText: string
  ) => {
    setDraftInputs(prev => ({ ...prev, [key]: rawText }));
    const clean = rawText.replace(',', '.').trim();
    if (clean === '') {
      handleUpdateDeviasiTertimbang(index, field, null);
    } else {
      const num = parseFloat(clean);
      if (!isNaN(num)) {
        handleUpdateDeviasiTertimbang(index, field, num);
      }
    }
  };

  // Handler update ambang batas deviasi maksimal (normal 5.0% atau relaksasi dispensasi)
  const handleUpdateThreshold = (newThreshold: number) => {
    onUpdateProject({
      ...project,
      ambangBatasDeviasiHal3: newThreshold,
      metadata: {
        ...project.metadata,
        ambangBatasDeviasiHal3: newThreshold
      }
    });
  };

  // Handler update nilai IKPA manual (Dispensasi Kolom AB)
  const handleUpdateNilaiIKPA = (
    index: number,
    numValue: number | null
  ) => {
    if (index < 0 || index >= rawInputs.length) return;
    const updated = [...rawInputs];
    const targetRow = { ...updated[index] };
    if (numValue === null || isNaN(numValue)) {
      delete (targetRow as any).overrideNilaiIKPA;
    } else {
      targetRow.overrideNilaiIKPA = Math.min(100, Math.max(0, round2(numValue)));
    }
    updated[index] = targetRow;

    onUpdateProject({
      ...project,
      deviasiHalIII: updated
    });
  };

  const handleResetNilaiIKPA = (index: number) => {
    handleUpdateNilaiIKPA(index, null);
  };

  const handleNilaiIKPAInputChange = (
    key: string,
    index: number,
    rawText: string
  ) => {
    setDraftInputs(prev => ({ ...prev, [key]: rawText }));
    const clean = rawText.replace(',', '.').trim();
    if (clean === '') {
      handleUpdateNilaiIKPA(index, null);
    } else {
      const num = parseFloat(clean);
      if (!isNaN(num)) {
        handleUpdateNilaiIKPA(index, num);
      }
    }
  };

  // Handler update proporsi pagu per baris (Kolom R, S, T, U)
  const handleUpdateProporsi = (
    index: number,
    field: 'proporsi51' | 'proporsi52' | 'proporsi53' | 'proporsi57',
    numValue: number
  ) => {
    if (index < 0 || index >= rawInputs.length) return;
    const updated = [...rawInputs];
    const targetRow = { ...updated[index], [field]: Math.max(0, round2(numValue)) };
    updated[index] = targetRow;

    onUpdateProject({
      ...project,
      deviasiHalIII: updated
    });
  };

  const handleProporsiInputChange = (
    key: string,
    index: number,
    field: 'proporsi51' | 'proporsi52' | 'proporsi53' | 'proporsi57',
    rawText: string
  ) => {
    setDraftInputs(prev => ({ ...prev, [key]: rawText }));
    const clean = rawText.replace(',', '.').trim();
    if (clean !== '') {
      const num = parseFloat(clean);
      if (!isNaN(num)) {
        handleUpdateProporsi(index, field, num);
      }
    }
  };

  // Preset dispensasi cepat untuk Februari dan Maret (0.00% untuk 51, 52, 53)
  const handleApplyDispensasiFebMar = () => {
    const updated = [...rawInputs];
    let appliedCount = 0;
    ['02', '03'].forEach(period => {
      const idx = updated.findIndex(r => r.periode === period);
      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          overrideDeviasiTertimbang51: 0,
          overrideDeviasiTertimbang52: 0,
          overrideDeviasiTertimbang53: 0
        };
        appliedCount++;
      }
    });

    if (appliedCount > 0) {
      onUpdateProject({
        ...project,
        deviasiHalIII: updated
      });
    }
  };

  // Reset seluruh dispensasi override kembali ke formula standar otomatis
  const handleResetAllDispensasi = () => {
    const updated = rawInputs.map(r => {
      const copy = { ...r };
      delete (copy as any).overrideDeviasiTertimbang51;
      delete (copy as any).overrideDeviasiTertimbang52;
      delete (copy as any).overrideDeviasiTertimbang53;
      delete (copy as any).overrideDeviasiTertimbang57;
      delete (copy as any).overrideNilaiIKPA;
      return copy;
    });
    onUpdateProject({
      ...project,
      ambangBatasDeviasiHal3: 5.0,
      metadata: {
        ...project.metadata,
        ambangBatasDeviasiHal3: 5.0
      },
      deviasiHalIII: updated
    });
  };

  // Tambah baris 1 bulan berikutnya (misal jika 0 baris -> tambah Bulan 01, jika 1 baris -> Bulan 02, dst)
  const existingPeriodNums = rawInputs
    .map(r => parseInt(r.periode, 10))
    .filter(n => !isNaN(n));
  const nextMonthNum = existingPeriodNums.length > 0 ? Math.max(...existingPeriodNums) + 1 : 1;
  const nextMonthLabel = nextMonthNum <= 12 ? `Bulan ${String(nextMonthNum).padStart(2, '0')}` : 'Maksimal 12 Bulan';

  // Ambil referensi proporsi & pagu terakhir untuk diwariskan ke baris baru
  const lastRowRef = rawInputs.length > 0 ? rawInputs[rawInputs.length - 1] : undefined;

  // Dapatkan proporsi dan pagu awal untuk suatu bulan sesuai triwulan (TW I s.d. IV)
  const getProportionsForNewMonth = (monthPeriod: string) => {
    const q = getQuarterForPeriod(monthPeriod);
    const qMonths = getQuarterMonths(q);
    // 1. Cek apakah di triwulan yang sama sudah ada baris yang diset
    const inQuarter = rawInputs.find(r => qMonths.includes(r.periode));
    if (inQuarter) {
      return {
        pagu51: inQuarter.pagu51 ?? 0,
        pagu52: inQuarter.pagu52 ?? 0,
        pagu53: inQuarter.pagu53 ?? 0,
        pagu57: inQuarter.pagu57 ?? 0,
        proporsi51: inQuarter.proporsi51 !== undefined ? inQuarter.proporsi51 : DEFAULT_WORKBOOK_PROPORTIONS[51],
        proporsi52: inQuarter.proporsi52 !== undefined ? inQuarter.proporsi52 : DEFAULT_WORKBOOK_PROPORTIONS[52],
        proporsi53: inQuarter.proporsi53 !== undefined ? inQuarter.proporsi53 : DEFAULT_WORKBOOK_PROPORTIONS[53],
        proporsi57: inQuarter.proporsi57 !== undefined ? inQuarter.proporsi57 : DEFAULT_WORKBOOK_PROPORTIONS[57]
      };
    }
    // 2. Cek apakah ada baris terakhir yang ada
    if (lastRowRef) {
      return {
        pagu51: lastRowRef.pagu51 ?? 0,
        pagu52: lastRowRef.pagu52 ?? 0,
        pagu53: lastRowRef.pagu53 ?? 0,
        pagu57: lastRowRef.pagu57 ?? 0,
        proporsi51: lastRowRef.proporsi51 !== undefined ? lastRowRef.proporsi51 : DEFAULT_WORKBOOK_PROPORTIONS[51],
        proporsi52: lastRowRef.proporsi52 !== undefined ? lastRowRef.proporsi52 : DEFAULT_WORKBOOK_PROPORTIONS[52],
        proporsi53: lastRowRef.proporsi53 !== undefined ? lastRowRef.proporsi53 : DEFAULT_WORKBOOK_PROPORTIONS[53],
        proporsi57: lastRowRef.proporsi57 !== undefined ? lastRowRef.proporsi57 : DEFAULT_WORKBOOK_PROPORTIONS[57]
      };
    }
    // 3. Fallback default
    return {
      pagu51: 0,
      pagu52: 0,
      pagu53: 0,
      pagu57: 0,
      proporsi51: DEFAULT_WORKBOOK_PROPORTIONS[51],
      proporsi52: DEFAULT_WORKBOOK_PROPORTIONS[52],
      proporsi53: DEFAULT_WORKBOOK_PROPORTIONS[53],
      proporsi57: DEFAULT_WORKBOOK_PROPORTIONS[57]
    };
  };

  // Terapkan proporsi (dan nominal pagu) khusus untuk triwulan tertentu (Cut-Off TW I s.d. IV)
  const handleApplyQuarterProportions = (
    quarter: 1 | 2 | 3 | 4,
    p51: number,
    p52: number,
    p53: number,
    p57: number,
    nominals?: { pagu51: number; pagu52: number; pagu53: number; pagu57: number }
  ) => {
    const qMonths = getQuarterMonths(quarter);

    // Jika belum ada data sama sekali di tabel, buat baris untuk bulan-bulan di triwulan ini
    if (rawInputs.length === 0) {
      const initialRows: DeviasiHalIIIInput[] = qMonths.map(m => ({
        periode: m,
        rencana51: 0,
        rencana52: 0,
        rencana53: 0,
        rencana57: 0,
        penyerapan51: 0,
        penyerapan52: 0,
        penyerapan53: 0,
        penyerapan57: 0,
        proporsi51: p51,
        proporsi52: p52,
        proporsi53: p53,
        proporsi57: p57,
        ...(nominals ? {
          pagu51: nominals.pagu51,
          pagu52: nominals.pagu52,
          pagu53: nominals.pagu53,
          pagu57: nominals.pagu57
        } : {})
      }));
      onUpdateProject({
        ...project,
        deviasiHalIII: initialRows
      });
      return;
    }

    const hasAnyInQuarter = rawInputs.some(r => qMonths.includes(r.periode));
    let updated: DeviasiHalIIIInput[] = [];

    if (!hasAnyInQuarter) {
      // Jika baris triwulan ini belum ada di tabel, tambahkan baris bulan-bulannya
      const newQuarterRows: DeviasiHalIIIInput[] = qMonths.map(m => ({
        periode: m,
        rencana51: 0,
        rencana52: 0,
        rencana53: 0,
        rencana57: 0,
        penyerapan51: 0,
        penyerapan52: 0,
        penyerapan53: 0,
        penyerapan57: 0,
        proporsi51: p51,
        proporsi52: p52,
        proporsi53: p53,
        proporsi57: p57,
        ...(nominals ? {
          pagu51: nominals.pagu51,
          pagu52: nominals.pagu52,
          pagu53: nominals.pagu53,
          pagu57: nominals.pagu57
        } : {})
      }));
      updated = [...rawInputs, ...newQuarterRows].sort((a, b) => parseInt(a.periode, 10) - parseInt(b.periode, 10));
    } else {
      // Perbarui hanya baris yang berada di dalam triwulan ini
      updated = rawInputs.map(r => {
        if (qMonths.includes(r.periode)) {
          return {
            ...r,
            proporsi51: p51,
            proporsi52: p52,
            proporsi53: p53,
            proporsi57: p57,
            ...(nominals ? {
              pagu51: nominals.pagu51,
              pagu52: nominals.pagu52,
              pagu53: nominals.pagu53,
              pagu57: nominals.pagu57
            } : {})
          };
        }
        return r;
      });
    }

    onUpdateProject({
      ...project,
      deviasiHalIII: updated
    });
  };

  // Terapkan proporsi (dan nominal pagu) ke semua baris periode (TW I s.d. IV)
  const handleApplyProportionsToAll = (
    p51: number,
    p52: number,
    p53: number,
    p57: number,
    nominals?: { pagu51: number; pagu52: number; pagu53: number; pagu57: number }
  ) => {
    if (rawInputs.length === 0) {
      const initialRow: DeviasiHalIIIInput = {
        periode: '01',
        rencana51: 0,
        rencana52: 0,
        rencana53: 0,
        rencana57: 0,
        penyerapan51: 0,
        penyerapan52: 0,
        penyerapan53: 0,
        penyerapan57: 0,
        proporsi51: p51,
        proporsi52: p52,
        proporsi53: p53,
        proporsi57: p57,
        ...(nominals ? {
          pagu51: nominals.pagu51,
          pagu52: nominals.pagu52,
          pagu53: nominals.pagu53,
          pagu57: nominals.pagu57
        } : {})
      };
      onUpdateProject({
        ...project,
        deviasiHalIII: [initialRow]
      });
      return;
    }

    const updated = rawInputs.map(r => ({
      ...r,
      proporsi51: p51,
      proporsi52: p52,
      proporsi53: p53,
      proporsi57: p57,
      ...(nominals ? {
        pagu51: nominals.pagu51,
        pagu52: nominals.pagu52,
        pagu53: nominals.pagu53,
        pagu57: nominals.pagu57
      } : {})
    }));
    onUpdateProject({
      ...project,
      deviasiHalIII: updated
    });
  };

  // Handler preset data satker 247161 dari screenshot OM-SPAN
  const handleApplyOmSpanPreset247161 = () => {
    const p51 = 45.75;
    const p52 = 41.98;
    const p53 = 12.27;
    const p57 = 0.0;

    const row01: DeviasiHalIIIInput = {
      periode: '01',
      rencana51: 1360767000,
      rencana52: 524526060,
      rencana53: 0,
      rencana57: 0,
      penyerapan51: 1220727139,
      penyerapan52: 330040,
      penyerapan53: 0,
      penyerapan57: 0,
      proporsi51: p51,
      proporsi52: p52,
      proporsi53: p53,
      proporsi57: p57
    };

    let updatedRows: DeviasiHalIIIInput[] = [];
    if (rawInputs.length <= 1) {
      updatedRows = [row01];
    } else {
      updatedRows = rawInputs.map(r => {
        if (r.periode === '01') return row01;
        return {
          ...r,
          proporsi51: p51,
          proporsi52: p52,
          proporsi53: p53,
          proporsi57: p57
        };
      });
    }

    setDraftInputs({});
    onUpdateProject({
      ...project,
      deviasiHalIII: updatedRows
    });
  };

  const handleAddMonthRow = () => {
    if (nextMonthNum > 12) {
      alert('Tabel sudah mencapai batas maksimum 12 periode (Desember).');
      return;
    }
    const nextPeriode = String(nextMonthNum).padStart(2, '0');
    const initProps = getProportionsForNewMonth(nextPeriode);
    const newRow: DeviasiHalIIIInput = {
      periode: nextPeriode,
      pagu51: initProps.pagu51,
      pagu52: initProps.pagu52,
      pagu53: initProps.pagu53,
      pagu57: initProps.pagu57,
      rencana51: 0,
      rencana52: 0,
      rencana53: 0,
      rencana57: 0,
      penyerapan51: 0,
      penyerapan52: 0,
      penyerapan53: 0,
      penyerapan57: 0,
      proporsi51: initProps.proporsi51,
      proporsi52: initProps.proporsi52,
      proporsi53: initProps.proporsi53,
      proporsi57: initProps.proporsi57
    };
    onUpdateProject({
      ...project,
      deviasiHalIII: [...rawInputs, newRow]
    });
  };

  // Tambah Triwulan I (Bulan 01 s.d. 03) sekaligus
  const handleAddQuarter1 = () => {
    const months = ['01', '02', '03'];
    const existingPeriods = new Set(rawInputs.map(r => r.periode));
    const toAdd: DeviasiHalIIIInput[] = [];
    months.forEach(m => {
      if (!existingPeriods.has(m)) {
        const initProps = getProportionsForNewMonth(m);
        toAdd.push({
          periode: m,
          pagu51: initProps.pagu51,
          pagu52: initProps.pagu52,
          pagu53: initProps.pagu53,
          pagu57: initProps.pagu57,
          rencana51: 0,
          rencana52: 0,
          rencana53: 0,
          rencana57: 0,
          penyerapan51: 0,
          penyerapan52: 0,
          penyerapan53: 0,
          penyerapan57: 0,
          proporsi51: initProps.proporsi51,
          proporsi52: initProps.proporsi52,
          proporsi53: initProps.proporsi53,
          proporsi57: initProps.proporsi57
        });
      }
    });
    const combined = [...rawInputs, ...toAdd].sort((a, b) => parseInt(a.periode, 10) - parseInt(b.periode, 10));
    onUpdateProject({
      ...project,
      deviasiHalIII: combined
    });
  };

  // Tambah 12 Bulan lengkap (01 s.d. 12)
  const handleAddAll12Months = () => {
    const all12: DeviasiHalIIIInput[] = Array.from({ length: 12 }, (_, i) => {
      const p = String(i + 1).padStart(2, '0');
      const existing = rawInputs.find(r => r.periode === p);
      if (existing) return existing;
      const initProps = getProportionsForNewMonth(p);
      return {
        periode: p,
        pagu51: initProps.pagu51,
        pagu52: initProps.pagu52,
        pagu53: initProps.pagu53,
        pagu57: initProps.pagu57,
        rencana51: 0,
        rencana52: 0,
        rencana53: 0,
        rencana57: 0,
        penyerapan51: 0,
        penyerapan52: 0,
        penyerapan53: 0,
        penyerapan57: 0,
        proporsi51: initProps.proporsi51,
        proporsi52: initProps.proporsi52,
        proporsi53: initProps.proporsi53,
        proporsi57: initProps.proporsi57
      };
    });
    onUpdateProject({
      ...project,
      deviasiHalIII: all12
    });
  };

  // Mulai hanya 1 Bulan dulu (Bulan 01 - Januari)
  const handleStartMonth1Only = () => {
    const initProps = getProportionsForNewMonth('01');
    const month1: DeviasiHalIIIInput[] = [
      {
        periode: '01',
        pagu51: initProps.pagu51,
        pagu52: initProps.pagu52,
        pagu53: initProps.pagu53,
        pagu57: initProps.pagu57,
        rencana51: 0,
        rencana52: 0,
        rencana53: 0,
        rencana57: 0,
        penyerapan51: 0,
        penyerapan52: 0,
        penyerapan53: 0,
        penyerapan57: 0,
        proporsi51: initProps.proporsi51,
        proporsi52: initProps.proporsi52,
        proporsi53: initProps.proporsi53,
        proporsi57: initProps.proporsi57
      }
    ];
    setDraftInputs({});
    onUpdateProject({
      ...project,
      deviasiHalIII: month1
    });
  };

  // Mulai bersih / kosong dulu (0 baris)
  const handleStartEmpty = () => {
    setDraftInputs({});
    onUpdateProject({
      ...project,
      deviasiHalIII: []
    });
  };

  // Hapus baris tertentu
  const handleDeleteRow = (index: number) => {
    const updated = rawInputs.filter((_, i) => i !== index);
    onUpdateProject({
      ...project,
      deviasiHalIII: updated
    });
  };

  // Reset data ke default workbook referensi (12 periode)
  const handleResetDefault = () => {
    const defaultData: DeviasiHal3Row[] = DEFAULT_EXCEL_DEV_HAL3_ROWS.map((r: any) => ({
      periode: r.periode,
      rencana51: r.rencana51 ?? 0,
      rencana52: r.rencana52 ?? 0,
      rencana53: r.rencana53 ?? 0,
      rencana57: r.rencana57 ?? 0,
      penyerapan51: r.realisasi51 ?? r.penyerapan51 ?? 0,
      penyerapan52: r.realisasi52 ?? r.penyerapan52 ?? 0,
      penyerapan53: r.realisasi53 ?? r.penyerapan53 ?? 0,
      penyerapan57: r.realisasi57 ?? r.penyerapan57 ?? 0,
      deviasi51: 0,
      deviasi52: 0,
      deviasi53: 0,
      deviasi57: 0,
      persenDeviasi51: 0,
      persenDeviasi52: 0,
      persenDeviasi53: 0,
      persenDeviasi57: 0,
      proporsi51: DEFAULT_WORKBOOK_PROPORTIONS[51],
      proporsi52: DEFAULT_WORKBOOK_PROPORTIONS[52],
      proporsi53: DEFAULT_WORKBOOK_PROPORTIONS[53],
      proporsi57: DEFAULT_WORKBOOK_PROPORTIONS[57],
      deviasiTertimbang51: 0,
      deviasiTertimbang52: 0,
      deviasiTertimbang53: 0,
      deviasiTertimbang57: 0,
      deviasiSeluruhJenisBelanja: 0,
      rataRataDeviasiKumulatif: 0,
      nilaiIKPA: 0
    }));

    setDraftInputs({});
    onUpdateProject({
      ...project,
      deviasiHalIII: defaultData
    });
  };

  // Kosongkan seluruh data rencana & realisasi ke 0 baris (bersih)
  const handleClearForm = () => {
    if (window.confirm('Kosongkan formulir Deviasi Halaman III DIPA? Formulir akan disetel menjadi 0 baris sehingga Anda dapat menambah baris secara mandiri.')) {
      setDraftInputs({});
      onUpdateProject({
        ...project,
        deviasiHalIII: []
      });
    }
  };

  // Simpan ke project & berikan feedback
  const handleSaveToProject = () => {
    onUpdateProject({
      ...project,
      deviasiHalIII: rows
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  // Salin tabel ke TSV untuk ditempel ke Excel
  const handleCopyTSV = () => {
    const headers = [
      'A:Periode',
      'B:Rencana 51', 'C:Rencana 52', 'D:Rencana 53', 'E:Rencana 57',
      'F:Penyerapan 51', 'G:Penyerapan 52', 'H:Penyerapan 53', 'I:Penyerapan 57',
      'J:Deviasi 51', 'K:Deviasi 52', 'L:Deviasi 53', 'M:Deviasi 57',
      'N:% Deviasi 51', 'O:% Deviasi 52', 'P:% Deviasi 53', 'Q:% Deviasi 57',
      'R:% Proporsi 51', 'S:% Proporsi 52', 'T:% Proporsi 53', 'U:% Proporsi 57',
      'V:% Tertimbang 51', 'W:% Tertimbang 52', 'X:% Tertimbang 53', 'Y:% Tertimbang 57',
      'Z:% Deviasi Seluruh J.Bel',
      'AA:% Rata-Rata Deviasi Kumulatif',
      'AB:Nilai IKPA'
    ];

    const dataLines = rows.map(r => [
      r.periode,
      r.rencana51, r.rencana52, r.rencana53, r.rencana57,
      r.penyerapan51, r.penyerapan52, r.penyerapan53, r.penyerapan57,
      r.deviasi51, r.deviasi52, r.deviasi53, r.deviasi57,
      r.persenDeviasi51, r.persenDeviasi52, r.persenDeviasi53, r.persenDeviasi57,
      r.proporsi51, r.proporsi52, r.proporsi53, r.proporsi57,
      r.deviasiTertimbang51, r.deviasiTertimbang52, r.deviasiTertimbang53, r.deviasiTertimbang57,
      r.deviasiSeluruhJenisBelanja,
      r.rataRataDeviasiKumulatif,
      r.nilaiIKPA
    ].join('\t'));

    const tsvContent = [headers.join('\t'), ...dataLines].join('\n');
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Ekspor file JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(rows, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const satkerLabel = project.metadata?.namaSatker || project.name || 'satker';
    a.download = `deviasi_hal3_${satkerLabel.replace(/\s+/g, '_')}_2026.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Impor file JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onUpdateProject({
            ...project,
            deviasiHalIII: parsed
          });
        }
      } catch (err) {
        console.error('Gagal mengimpor file JSON:', err);
      }
    };
    reader.readAsText(file);
  };

  // What-If local simulation: mendekatkan penyerapan ke rencana
  const handleApplyWhatIf = () => {
    if (whatIfReductionPct === 0) return;
    const factor = (100 - whatIfReductionPct) / 100;
    const newRows = rows.map((r, i) => {
      // Periode 12 disinkronkan setelahnya
      if (i === 11) return r;
      return {
        ...r,
        penyerapan51: Math.round(r.rencana51 + (r.penyerapan51 - r.rencana51) * factor),
        penyerapan52: Math.round(r.rencana52 + (r.penyerapan52 - r.rencana52) * factor),
        penyerapan53: Math.round(r.rencana53 + (r.penyerapan53 - r.rencana53) * factor),
        penyerapan57: Math.round(r.rencana57 + (r.penyerapan57 - r.rencana57) * factor)
      };
    });

    // Sinkronkan periode 12 dari periode 11
    if (newRows[10] && newRows[11]) {
      newRows[11].penyerapan51 = newRows[10].penyerapan51;
      newRows[11].penyerapan52 = newRows[10].penyerapan52;
      newRows[11].penyerapan53 = newRows[10].penyerapan53;
      newRows[11].penyerapan57 = newRows[10].penyerapan57;
    }

    onUpdateProject({ ...project, deviasiHalIII: newRows });
  };

  // Data row audit terpilih
  const auditRow = useMemo(() => {
    return rows.find(r => r.periode === auditSelectedPeriode) || rows[0];
  }, [rows, auditSelectedPeriode]);

  const auditDataBelanja = useMemo(() => {
    if (!auditRow) return null;
    const isMaret = auditRow.periode === '03';
    let rencana = 0;
    let penyerapan = 0;
    let deviasi = 0;
    let persenDeviasi = 0;
    let proporsi = 0;
    let tertimbang = 0;
    let label = '51 (Belanja Pegawai)';
    let isMaretZeroed = false;

    let isDispensasi = false;
    let autoTertimbang = 0;

    if (auditSelectedBelanja === '51') {
      rencana = auditRow.rencana51;
      penyerapan = auditRow.penyerapan51;
      deviasi = auditRow.deviasi51;
      persenDeviasi = auditRow.persenDeviasi51;
      proporsi = auditRow.proporsi51;
      tertimbang = auditRow.deviasiTertimbang51;
      isDispensasi = !!auditRow.isDispensasi51;
      autoTertimbang = auditRow.autoDeviasiTertimbang51 ?? 0;
      label = 'Belanja Pegawai (51)';
      isMaretZeroed = isMaret;
    } else if (auditSelectedBelanja === '52') {
      rencana = auditRow.rencana52;
      penyerapan = auditRow.penyerapan52;
      deviasi = auditRow.deviasi52;
      persenDeviasi = auditRow.persenDeviasi52;
      proporsi = auditRow.proporsi52;
      tertimbang = auditRow.deviasiTertimbang52;
      isDispensasi = !!auditRow.isDispensasi52;
      autoTertimbang = auditRow.autoDeviasiTertimbang52 ?? 0;
      label = 'Belanja Barang (52)';
      isMaretZeroed = isMaret;
    } else if (auditSelectedBelanja === '53') {
      rencana = auditRow.rencana53;
      penyerapan = auditRow.penyerapan53;
      deviasi = auditRow.deviasi53;
      persenDeviasi = auditRow.persenDeviasi53;
      proporsi = auditRow.proporsi53;
      tertimbang = auditRow.deviasiTertimbang53;
      isDispensasi = !!auditRow.isDispensasi53;
      autoTertimbang = auditRow.autoDeviasiTertimbang53 ?? 0;
      label = 'Belanja Modal (53)';
    } else {
      rencana = auditRow.rencana57;
      penyerapan = auditRow.penyerapan57;
      deviasi = auditRow.deviasi57;
      persenDeviasi = auditRow.persenDeviasi57;
      proporsi = auditRow.proporsi57;
      tertimbang = auditRow.deviasiTertimbang57;
      isDispensasi = !!auditRow.isDispensasi57;
      autoTertimbang = auditRow.autoDeviasiTertimbang57 ?? 0;
      label = 'Bantuan Sosial (57)';
    }

    return {
      label,
      rencana,
      penyerapan,
      deviasi,
      persenDeviasi,
      proporsi,
      tertimbang,
      isDispensasi,
      autoTertimbang,
      isMaretZeroed,
      isMaret
    };
  }, [auditRow, auditSelectedBelanja]);

  // Automated golden test results
  const goldenReport = useMemo(() => {
    return runDeviasiHal3GoldenTest();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      {/* 1. Header Ringkasan & Skor */}
      <div
        className={`rounded-2xl border p-5 transition-all shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                Bobot 15% | Sel H6 & Sel AB16
              </span>
              <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                12 Periode (01 s.d. 12)
              </span>
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
                Belanja 51, 52, 53, 57
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Deviasi Halaman III DIPA 2026
            </h2>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Perhitungan deterministik keselarasan antara Rencana Penarikan Dana (RPD) bulanan Halaman III DIPA
              dengan realisasi belanja negara. Sesuai workbook acuan resmi, deviasi tertimbang 51 & 52 Maret bernilai 0 (S-119/PB.2/2024),
              dan penilaian kumulatif dihitung sampai periode November (Desember = November).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Metrik Nilai Akhir IKPA */}
            <div
              className={`px-4 py-2.5 rounded-xl border text-right min-w-[120px] ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] text-slate-400 uppercase font-bold block tracking-wider">
                Nilai IKPA (AB16)
              </span>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {finalScore.toFixed(2)}
              </div>
            </div>

            {/* Metrik % Rata-rata Kumulatif */}
            <div
              className={`px-4 py-2.5 rounded-xl border text-right min-w-[120px] ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] text-slate-400 uppercase font-bold block tracking-wider">
                Rata Kumulatif (AA16)
              </span>
              <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                {finalCumulativeDeviation.toFixed(2)}%
              </div>
            </div>

            {/* Metrik Nilai Berbobot */}
            <div
              className={`px-4 py-2.5 rounded-xl border text-right min-w-[110px] ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] text-slate-400 uppercase font-bold block tracking-wider">
                Berbobot (15%)
              </span>
              <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                {finalWeighted.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Aksi Header */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <IndikatorCalculateButton
              indicatorKey="deviasiHalIII"
              indicatorName="Deviasi Halaman III DIPA"
              weight={15}
              indicatorResult={result}
              validationIssues={validationIssues}
              satkerName={project.metadata?.namaSatker || project.name}
              isDark={isDark}
            />

            <button
              onClick={() =>
                onOpenInspector(
                  'Indikator Deviasi Halaman III DIPA',
                  'AB16 / H6',
                  '=IF(AA16<=5, 100, 100-AA16)',
                  finalScore.toFixed(2),
                  result.details || []
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Calculator className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Formula Inspector
            </button>

            <button
              onClick={() => setShowAuditPanel(!showAuditPanel)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                showAuditPanel
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              {showAuditPanel ? 'Tutup Audit Perhitungan' : 'Lihat Detail Perhitungan'}
            </button>

            <button
              onClick={() => setShowGoldenTestModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              14 Golden Tests ({goldenReport.passedCount}/14 Pass)
            </button>
          </div>

          <div className="flex items-center gap-2">
            {savedFeedback && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
                <Check className="h-3.5 w-3.5" /> Tersimpan ke simulasi!
              </span>
            )}
            <button
              onClick={handleSaveToProject}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              Simpan ke Project
            </button>
          </div>
        </div>
      </div>

      {/* Banner Validasi Data Input */}
      <IndikatorValidationBanner
        indicatorName="Deviasi Halaman III DIPA"
        issues={validationIssues}
        isConfirmed={isValidationConfirmed}
        onToggleConfirm={() => setIsValidationConfirmed(!isValidationConfirmed)}
        isDark={isDark}
      />

      {/* Petunjuk Pengisian & Cara Menggunakan */}
      <PetunjukPengisianCard
        indicatorId="deviasi-hal3"
        isDark={isDark}
        defaultExpanded={true}
      />

      {/* Pengaturan Pagu DIPA & Bobot Proporsi per Triwulan (Cut-Off TW I s.d. IV) */}
      <PaguDipaConfigCard
        project={project}
        rows={rows}
        rawInputs={rawInputs as DeviasiHalIIIInput[]}
        onApplyQuarterProportions={handleApplyQuarterProportions}
        onApplyProportionsToAll={handleApplyProportionsToAll}
        onApplyOmSpanPreset247161={handleApplyOmSpanPreset247161}
        onOpenLogicModal={() => setShowLogicModal(true)}
        isDark={isDark}
      />

      {/* Aturan Regulasi PER-5/PB/2022 & Isian Khusus Dispensasi Ambang Batas Nilai Maksimal */}
      <AmbangBatasDeviasiCard
        currentThreshold={ambangBatas}
        onUpdateThreshold={handleUpdateThreshold}
        isDark={isDark}
      />

      {/* 2. Audit Perhitungan Panel (Collapsible) */}
      {showAuditPanel && (
        <div
          className={`rounded-2xl border p-5 transition-all animate-fade-in ${
            isDark ? 'bg-slate-900/90 border-blue-900/40' : 'bg-blue-50/60 border-blue-200'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-blue-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Audit & Cross-Check Formula Excel Per Periode & Jenis Belanja
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verifikasi perhitungan matematika dari nilai Rencana ke Penyerapan, Deviasi Nominal, % Deviasi, Proporsi, Deviasi Tertimbang, hingga Nilai IKPA.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-semibold px-2 text-slate-600 dark:text-slate-300">Periode:</span>
                <select
                  value={auditSelectedPeriode}
                  onChange={e => setAuditSelectedPeriode(e.target.value)}
                  className="bg-transparent font-mono font-bold focus:outline-hidden text-blue-600 dark:text-blue-400 cursor-pointer"
                >
                  {rows.map(r => (
                    <option key={r.periode} value={r.periode} className="dark:bg-slate-800">
                      Periode {r.periode} ({BULAN_NAMES[Number(r.periode) - 1]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 text-xs">
                {(['51', '52', '53', '57'] as const).map(b => (
                  <button
                    key={b}
                    onClick={() => setAuditSelectedBelanja(b)}
                    className={`px-2 py-1 rounded-md font-mono font-bold transition-colors ${
                      auditSelectedBelanja === b
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Belanja {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {auditDataBelanja && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Step 1 & 2: Rencana & Penyerapan */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  1. Rencana & Penyerapan ({auditDataBelanja.label})
                </span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rencana (RPD):</span>
                    <span className="font-mono font-semibold">Rp {formatRupiah(auditDataBelanja.rencana)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Penyerapan (Realisasi):</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      Rp {formatRupiah(auditDataBelanja.penyerapan)}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700 font-mono">
                  Kolom B..E (Rencana) vs F..I (Penyerapan)
                </div>
              </div>

              {/* Step 3: Deviasi Nominal & % Deviasi */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  2. Deviasi Nominal & % Deviasi
                </span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Deviasi Nominal (ABS):</span>
                    <span className="font-mono font-semibold">Rp {formatRupiah(auditDataBelanja.deviasi)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">% Deviasi (Cap 100%):</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {auditDataBelanja.persenDeviasi.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700 font-mono">
                  =MIN(ROUND(ABS(F-B)/B*100, 2), 100)
                </div>
              </div>

              {/* Step 4: Proporsi Pagu & Deviasi Tertimbang */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  3. Deviasi Tertimbang
                </span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">% Proporsi Pagu:</span>
                    <span className="font-mono font-semibold">{auditDataBelanja.proporsi.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">% Deviasi Tertimbang:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {auditDataBelanja.tertimbang.toFixed(2)}%
                    </span>
                  </div>
                </div>
                {auditDataBelanja.isDispensasi ? (
                  <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold pt-1 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span>Dispensasi Aktif (Formula Otomatis: {auditDataBelanja.autoTertimbang.toFixed(2)}%)</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-black uppercase">Dispensasi</span>
                  </div>
                ) : auditDataBelanja.isMaretZeroed ? (
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-700">
                    Khusus Maret 0% per S-119/PB.2/2024
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700 font-mono">
                    =ROUND(%Deviasi * %Proporsi / 100, 2)
                  </div>
                )}
              </div>

              {/* Step 5: Total Bulan, Kumulatif & Nilai IKPA */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  4. Kumulatif & Nilai IKPA Bulan
                </span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Deviasi (Z):</span>
                    <span className="font-mono font-semibold">{auditRow?.deviasiSeluruhJenisBelanja.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rata Kumulatif (AA):</span>
                    <span className="font-mono font-semibold">{auditRow?.rataRataDeviasiKumulatif.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nilai IKPA (AB):</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {auditRow?.nilaiIKPA.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700 font-mono">
                  {auditRow?.isDispensasiNilaiIKPA
                    ? `Dispensasi Manual: ${auditRow.nilaiIKPA.toFixed(2)} (Otomatis: ${auditRow.autoNilaiIKPA?.toFixed(2)})`
                    : auditRow?.periode === '12'
                    ? 'AA16 = AA15 (Desember = November)'
                    : `=IF(AA<=${ambangBatas.toFixed(1)}, 100, 100-AA)`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Toolbar Mode Tampilan & Utilitas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Toggle Mode Excel vs Mode Sederhana */}
        <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start">
          <button
            onClick={() => setViewMode('excel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'excel'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Mode Tampilan Excel (Kolom A s.d. AB)
          </button>
          <button
            onClick={() => setViewMode('simple')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'simple'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            Mode Input Sederhana & What-If
          </button>
        </div>

        {/* Utilitas: Reset, TSV, JSON */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyTSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Salin tabel dalam format TSV untuk langsung di-paste ke Microsoft Excel"
          >
            {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
            {copied ? 'Tersalin ke Clipboard!' : 'Salin Tabel (TSV)'}
          </button>

          {/* Action Row Management Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleAddMonthRow}
              disabled={nextMonthNum > 12}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer ${
                nextMonthNum > 12
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
              title="Tambah baris periode bulan berikutnya secara mandiri"
            >
              <Plus className="h-3.5 w-3.5" />
              + Tambah {nextMonthLabel}
            </button>

            <button
              onClick={handleAddQuarter1}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors cursor-pointer"
              title="Tambah baris Triwulan I (Bulan 01 s.d. 03)"
            >
              <Plus className="h-3.5 w-3.5" />
              + Triwulan I (3 Bulan)
            </button>

            <button
              onClick={handleAddAll12Months}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Tambah seluruh 12 periode bulan (Januari s.d. Desember)"
            >
              <Plus className="h-3.5 w-3.5" />
              + 12 Bulan Lengkap
            </button>
          </div>

          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Ekspor JSON
          </button>

          <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
            <Upload className="h-3.5 w-3.5 text-slate-500" />
            Impor JSON
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleResetDefault}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
            title="Kembalikan nilai ke data standar workbook referensi"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Muat Data Standar (12 Bulan)
          </button>

          <button
            onClick={handleClearForm}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
            title="Kosongkan seluruh baris menjadi 0 baris"
          >
            <Eraser className="h-3.5 w-3.5 text-rose-500" />
            Kosongkan Formulir (0 Baris)
          </button>
        </div>
      </div>

      {/* 3.5. PRESET RENTANG PERIODE SIMULASI */}
      <div className={`rounded-2xl border p-4 shadow-xs ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-gradient-to-r from-emerald-50/80 via-sky-50/50 to-white border-emerald-200/80'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Preset Rentang Periode Simulasi (Pilih Cara Mulai)
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white font-mono">
                {rows.length} Bulan Aktif
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Bisa mulai dari <strong>Bulan 1 saja</strong>, mulai <strong>kosong (0 baris)</strong>, atau langsung 12 bulan. Tambah baris bulan selanjutnya kapan saja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleStartMonth1Only}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Mulai simulasi dari Bulan 01 (Januari) saja"
            >
              <Sparkles className="h-3.5 w-3.5" />
              🌟 Mulai Bulan 1 Dulu
            </button>

            <button
              onClick={handleStartEmpty}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Kosongkan tabel menjadi 0 baris untuk input bertahap"
            >
              <Eraser className="h-3.5 w-3.5 text-slate-500" />
              🧹 Mulai Kosong Dulu
            </button>

            <button
              onClick={handleAddQuarter1}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Isi periode Triwulan I (Bulan 01 s.d. 03)"
            >
              Triwulan I (01-03)
            </button>

            <button
              onClick={handleAddAll12Months}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Isi seluruh 12 periode bulan"
            >
              12 Bulan Penuh
            </button>
          </div>
        </div>
      </div>

      {/* Banner Notifikasi jika saat ini 12 bulan tapi belum ada input riil */}
      {rows.length === 12 && rows.every(r => r.rencana51 === 0 && r.penyerapan51 === 0) && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/40 dark:border-emerald-800 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-extrabold text-emerald-950 dark:text-emerald-200 text-sm">
                Tabel Terbuka 12 Bulan (Kosong)
              </span>
              <p className="text-emerald-800 dark:text-emerald-300 text-xs mt-0.5">
                Ingin mulai dari <strong>Bulan 1 saja</strong> agar lebih fokus dan mudah menghitung?
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

      {/* 4. Tampilan Mode Excel (Kolom A s.d. AB) */}
      {viewMode === 'excel' && (
        rows.length === 0 ? (
          <div className={`p-10 text-center rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  Tabel Masih Kosong (0 Baris)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Silakan pilih untuk mulai dari <strong>Bulan 1 dulu</strong> atau menambah baris sesuai periode yang ingin diuji coba.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                <button
                  onClick={handleStartMonth1Only}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  🌟 Mulai Bulan 1 Dulu
                </button>
                <button
                  onClick={handleAddQuarter1}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 hover:bg-sky-100 font-bold text-xs cursor-pointer"
                >
                  + Triwulan I (01 s.d. 03)
                </button>
                <button
                  onClick={handleAddAll12Months}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
                >
                  + 12 Bulan Lengkap
                </button>
              </div>
            </div>
          </div>
        ) : (
        <div
          className={`rounded-2xl border overflow-hidden shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Matriks Tabel Deviasi Halaman III DIPA Sesuai Struktur Kolom Workbook Excel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kolom putih (B s.d. I) merupakan input nominal. Kolom V:Y (% Deviasi Tertimbang) dapat diedit langsung jika satker memperoleh dispensasi.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {totalDispensasiActive > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500 text-white font-black text-xs shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{totalDispensasiActive} Dispensasi Aktif</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResetAllDispensasi}
                    className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 font-bold text-[11px] transition-colors cursor-pointer"
                    title="Hapus semua penyesuaian dispensasi dan kembalikan ke perhitungan otomatis"
                  >
                    Reset Semua Auto
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleApplyDispensasiFebMar}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-700 font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                title="Terapkan dispensasi 0.00% untuk Belanja 51, 52, 53 pada Bulan 02 (Februari) dan Bulan 03 (Maret) sekaligus"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Dispensasi Cepat Feb &amp; Mar (0%)</span>
              </button>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-bold font-mono">
                Maret V7 &amp; W7 = 0
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 font-bold font-mono">
                AA16 = AA15
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[700px] border-t border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              {/* Excel Column Letters Headers */}
              <thead
                className={`sticky top-0 z-20 font-semibold border-b ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {/* Tingkat 1: Grup Kolom dengan Warna Jelas & Kontras Tinggi */}
                <tr className="text-[11px] text-center border-b border-slate-700">
                  <th className="px-3 py-2 border-r-2 border-slate-600 bg-slate-900 text-slate-100 font-extrabold sticky left-0 z-30 shadow-xs">
                    A
                  </th>
                  <th colSpan={4} className="px-2 py-2 border-r-2 border-emerald-900 bg-emerald-700 text-white font-black shadow-xs tracking-wider">
                    B:E — RENCANA HALAMAN III DIPA (INPUT)
                  </th>
                  <th colSpan={4} className="px-2 py-2 border-r-2 border-sky-900 bg-sky-700 text-white font-black shadow-xs tracking-wider">
                    F:I — REALISASI PENYERAPAN (INPUT)
                  </th>
                  <th colSpan={4} className="px-2 py-2 border-r-2 border-slate-800 bg-slate-700 text-white font-bold shadow-xs">
                    J:M — DEVIASI NOMINAL (ABS)
                  </th>
                  <th colSpan={4} className="px-2 py-2 border-r-2 border-indigo-900 bg-indigo-700 text-white font-bold shadow-xs">
                    N:Q — % DEVIASI (CAP 100)
                  </th>
                  <th colSpan={4} className="px-2 py-2 border-r-2 border-purple-900 bg-purple-700 text-white font-bold shadow-xs">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>R:U — % PROPORSI PAGU</span>
                      <button
                        type="button"
                        onClick={() => setShowLogicModal(true)}
                        className="p-0.5 rounded hover:bg-purple-600 text-purple-200 hover:text-white transition-colors cursor-pointer"
                        title="Klik untuk melihat penjelasan logika & rumus Proporsi Pagu"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                  <th colSpan={4} className="px-2 py-2 border-r-2 border-amber-900 bg-amber-700 text-white font-bold shadow-xs">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>V:Y — % DEVIASI TERTIMBANG</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-white font-black tracking-wider uppercase" title="Dapat diedit langsung jika satker memperoleh dispensasi">
                        Dapat Diedit
                      </span>
                    </div>
                  </th>
                  <th className="px-3 py-2 border-r-2 border-orange-900 bg-orange-700 text-white font-black shadow-xs">
                    Z: TOTAL
                  </th>
                  <th className="px-3 py-2 border-r-2 border-teal-900 bg-teal-700 text-white font-black shadow-xs">
                    AA: RATA KUM
                  </th>
                  <th className="px-3 py-2 bg-emerald-800 text-white font-black shadow-xs">
                    AB: NILAI IKPA
                  </th>
                  <th rowSpan={2} className="px-2 py-2 border-l border-slate-700 bg-slate-800 text-slate-300 font-bold w-12 text-center">
                    Aksi
                  </th>
                </tr>

                {/* Tingkat 2: Nama Sub-Kolom */}
                <tr className="text-[10px] text-center font-mono">
                  <th className="px-2.5 py-2 border-r-2 border-slate-600 bg-slate-800 text-slate-200 font-bold sticky left-0 z-30">
                    Periode
                  </th>
                  
                  {/* B:E Rencana */}
                  <th className="px-2 py-2 text-right border-r border-emerald-800 bg-emerald-800/90 text-emerald-100 min-w-[115px]">B: 51 Pegawai</th>
                  <th className="px-2 py-2 text-right border-r border-emerald-800 bg-emerald-800/90 text-emerald-100 min-w-[115px]">C: 52 Barang</th>
                  <th className="px-2 py-2 text-right border-r border-emerald-800 bg-emerald-800/90 text-emerald-100 min-w-[115px]">D: 53 Modal</th>
                  <th className="px-2 py-2 text-right border-r-2 border-emerald-950 bg-emerald-800/90 text-emerald-100 min-w-[95px]">E: 57 Bansos</th>

                  {/* F:I Penyerapan */}
                  <th className="px-2 py-2 text-right border-r border-sky-800 bg-sky-800/90 text-sky-100 min-w-[115px]">F: 51 Pegawai</th>
                  <th className="px-2 py-2 text-right border-r border-sky-800 bg-sky-800/90 text-sky-100 min-w-[115px]">G: 52 Barang</th>
                  <th className="px-2 py-2 text-right border-r border-sky-800 bg-sky-800/90 text-sky-100 min-w-[115px]">H: 53 Modal</th>
                  <th className="px-2 py-2 text-right border-r-2 border-sky-950 bg-sky-800/90 text-sky-100 min-w-[95px]">I: 57 Bansos</th>

                  {/* J:M Deviasi Nominal */}
                  <th className="px-2 py-2 text-right border-r border-slate-700 bg-slate-800 text-slate-300 min-w-[100px]">J: 51</th>
                  <th className="px-2 py-2 text-right border-r border-slate-700 bg-slate-800 text-slate-300 min-w-[100px]">K: 52</th>
                  <th className="px-2 py-2 text-right border-r border-slate-700 bg-slate-800 text-slate-300 min-w-[100px]">L: 53</th>
                  <th className="px-2 py-2 text-right border-r-2 border-slate-900 bg-slate-800 text-slate-300 min-w-[80px]">M: 57</th>

                  {/* N:Q % Deviasi */}
                  <th className="px-2 py-2 text-right border-r border-indigo-800 bg-indigo-800/90 text-indigo-100 min-w-[65px]">N: %51</th>
                  <th className="px-2 py-2 text-right border-r border-indigo-800 bg-indigo-800/90 text-indigo-100 min-w-[65px]">O: %52</th>
                  <th className="px-2 py-2 text-right border-r border-indigo-800 bg-indigo-800/90 text-indigo-100 min-w-[65px]">P: %53</th>
                  <th className="px-2 py-2 text-right border-r-2 border-indigo-950 bg-indigo-800/90 text-indigo-100 min-w-[65px]">Q: %57</th>

                  {/* R:U % Proporsi Pagu */}
                  <th className="px-2 py-2 text-right border-r border-purple-800 bg-purple-800/90 text-purple-100 min-w-[65px]">R: 51%</th>
                  <th className="px-2 py-2 text-right border-r border-purple-800 bg-purple-800/90 text-purple-100 min-w-[65px]">S: 52%</th>
                  <th className="px-2 py-2 text-right border-r border-purple-800 bg-purple-800/90 text-purple-100 min-w-[65px]">T: 53%</th>
                  <th className="px-2 py-2 text-right border-r-2 border-purple-950 bg-purple-800/90 text-purple-100 min-w-[65px]">U: 57%</th>

                  {/* V:Y % Deviasi Tertimbang */}
                  <th className="px-2 py-2 text-right border-r border-amber-800 bg-amber-800/90 text-amber-100 min-w-[80px]" title="Kolom V: % Deviasi Tertimbang 51 (Bisa diedit jika ada dispensasi)">
                    <div className="flex items-center justify-end gap-1">
                      <span>V: 51</span>
                      <Edit3 className="w-2.5 h-2.5 text-amber-300" />
                    </div>
                  </th>
                  <th className="px-2 py-2 text-right border-r border-amber-800 bg-amber-800/90 text-amber-100 min-w-[80px]" title="Kolom W: % Deviasi Tertimbang 52 (Bisa diedit jika ada dispensasi)">
                    <div className="flex items-center justify-end gap-1">
                      <span>W: 52</span>
                      <Edit3 className="w-2.5 h-2.5 text-amber-300" />
                    </div>
                  </th>
                  <th className="px-2 py-2 text-right border-r border-amber-800 bg-amber-800/90 text-amber-100 min-w-[80px]" title="Kolom X: % Deviasi Tertimbang 53 (Bisa diedit jika ada dispensasi)">
                    <div className="flex items-center justify-end gap-1">
                      <span>X: 53</span>
                      <Edit3 className="w-2.5 h-2.5 text-amber-300" />
                    </div>
                  </th>
                  <th className="px-2 py-2 text-right border-r-2 border-amber-950 bg-amber-800/90 text-amber-100 min-w-[80px]" title="Kolom Y: % Deviasi Tertimbang 57 (Bisa diedit jika ada dispensasi)">
                    <div className="flex items-center justify-end gap-1">
                      <span>Y: 57</span>
                      <Edit3 className="w-2.5 h-2.5 text-amber-300" />
                    </div>
                  </th>

                  {/* Z, AA, AB */}
                  <th className="px-2.5 py-2 text-right border-r-2 border-orange-950 bg-orange-800/90 text-orange-100 min-w-[80px]">Z: Total</th>
                  <th className="px-2.5 py-2 text-right border-r-2 border-teal-950 bg-teal-800/90 text-teal-100 min-w-[85px]">AA: Rata Kum</th>
                  <th className="px-3 py-2 text-right min-w-[95px] font-black bg-emerald-900 text-emerald-100" title={`Kolom AB: Nilai IKPA =IF(AA<=${ambangBatas.toFixed(1)}, 100, 100-AA). Tersedia isian khusus dispensasi`}>
                    <div className="flex items-center justify-end gap-1">
                      <span>AB: Nilai</span>
                      <Edit3 className="w-2.5 h-2.5 text-emerald-300" />
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                {rows.map((r, idx) => {
                  const excelRowNumber = idx + 5; // row 5 sampai 16
                  const isMaret = r.periode === '03';
                  const isDesember = r.periode === '12';

                  return (
                    <tr
                      key={r.periode}
                      className={`transition-colors ${
                        isMaret
                          ? isDark ? 'bg-amber-950/20 hover:bg-amber-950/30' : 'bg-amber-50/50 hover:bg-amber-50'
                          : isDesember
                          ? isDark ? 'bg-blue-950/20 hover:bg-blue-950/30' : 'bg-blue-50/50 hover:bg-blue-50'
                          : isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Kolom A: Periode */}
                      <td className="px-2.5 py-2 font-sans font-bold border-r-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 sticky left-0 z-10 whitespace-nowrap shadow-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[9px] font-mono">{excelRowNumber}</span>
                          <span className="text-slate-900 dark:text-white font-extrabold">Bulan {r.periode}</span>
                          {isMaret && (
                            <span className="text-[9px] px-1 py-0.2 rounded-sm bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold" title="Maret V7=0 & W7=0 S-119/PB.2/2024">
                              Maret
                            </span>
                          )}
                          {isDesember && (
                            <span className="text-[9px] px-1 py-0.2 rounded-sm bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold" title="Desember = November (AA16=AA15)">
                              Des
                            </span>
                          )}
                        </div>
                      </td>

                      {/* B: Rencana 51 */}
                      <td className="px-1.5 py-1 text-right border-r border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/25">
                        <input
                          type="text"
                          value={draftInputs[`r51_${idx}`] !== undefined ? draftInputs[`r51_${idx}`] : formatRupiah(r.rencana51)}
                          onChange={e => handleInputChange(`r51_${idx}`, idx, 'rencana51', e.target.value)}
                          onBlur={() => handleInputBlur(`r51_${idx}`)}
                          className="w-full text-right px-2 py-1 rounded-md border-2 border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-emerald-50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 shadow-xs"
                        />
                      </td>

                      {/* C: Rencana 52 */}
                      <td className="px-1.5 py-1 text-right border-r border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/25">
                        <input
                          type="text"
                          value={draftInputs[`r52_${idx}`] !== undefined ? draftInputs[`r52_${idx}`] : formatRupiah(r.rencana52)}
                          onChange={e => handleInputChange(`r52_${idx}`, idx, 'rencana52', e.target.value)}
                          onBlur={() => handleInputBlur(`r52_${idx}`)}
                          className="w-full text-right px-2 py-1 rounded-md border-2 border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-emerald-50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 shadow-xs"
                        />
                      </td>

                      {/* D: Rencana 53 */}
                      <td className="px-1.5 py-1 text-right border-r border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/25">
                        <input
                          type="text"
                          value={draftInputs[`r53_${idx}`] !== undefined ? draftInputs[`r53_${idx}`] : formatRupiah(r.rencana53)}
                          onChange={e => handleInputChange(`r53_${idx}`, idx, 'rencana53', e.target.value)}
                          onBlur={() => handleInputBlur(`r53_${idx}`)}
                          className="w-full text-right px-2 py-1 rounded-md border-2 border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-emerald-50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 shadow-xs"
                        />
                      </td>

                      {/* E: Rencana 57 */}
                      <td className="px-1.5 py-1 text-right border-r-2 border-emerald-600 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/25">
                        <input
                          type="text"
                          value={draftInputs[`r57_${idx}`] !== undefined ? draftInputs[`r57_${idx}`] : (r.rencana57 > 0 ? formatRupiah(r.rencana57) : '')}
                          placeholder="-"
                          onChange={e => handleInputChange(`r57_${idx}`, idx, 'rencana57', e.target.value)}
                          onBlur={() => handleInputBlur(`r57_${idx}`)}
                          className="w-full text-right px-2 py-1 rounded-md border-2 border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-emerald-50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 placeholder-slate-400 shadow-xs"
                        />
                      </td>

                      {/* F: Penyerapan 51 */}
                      <td className="px-1.5 py-1 text-right border-r border-slate-200 dark:border-slate-700 bg-sky-50/50 dark:bg-sky-950/25">
                        <input
                          type="text"
                          value={draftInputs[`y51_${idx}`] !== undefined ? draftInputs[`y51_${idx}`] : formatRupiah(r.penyerapan51)}
                          onChange={e => handleInputChange(`y51_${idx}`, idx, 'penyerapan51', e.target.value)}
                          onBlur={() => handleInputBlur(`y51_${idx}`)}
                          className="w-full text-right px-2 py-1 rounded-md border-2 border-sky-400 dark:border-sky-600 bg-white dark:bg-slate-900 text-xs font-black text-sky-950 dark:text-sky-50 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 shadow-xs"
                        />
                      </td>

                      {/* G: Penyerapan 52 */}
                      <td className="px-1.5 py-1 text-right border-r border-slate-200 dark:border-slate-700 bg-sky-50/50 dark:bg-sky-950/25">
                        <input
                          type="text"
                          value={draftInputs[`y52_${idx}`] !== undefined ? draftInputs[`y52_${idx}`] : formatRupiah(r.penyerapan52)}
                          onChange={e => handleInputChange(`y52_${idx}`, idx, 'penyerapan52', e.target.value)}
                          onBlur={() => handleInputBlur(`y52_${idx}`)}
                          className="w-full text-right px-2 py-1 rounded-md border-2 border-sky-400 dark:border-sky-600 bg-white dark:bg-slate-900 text-xs font-black text-sky-950 dark:text-sky-50 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 shadow-xs"
                        />
                      </td>

                      {/* H: Penyerapan 53 */}
                      <td className="px-1.5 py-1 text-right border-r border-slate-200 dark:border-slate-700 bg-sky-50/50 dark:bg-sky-950/25">
                        <input
                          type="text"
                          value={draftInputs[`y53_${idx}`] !== undefined ? draftInputs[`y53_${idx}`] : formatRupiah(r.penyerapan53)}
                          onChange={e => handleInputChange(`y53_${idx}`, idx, 'penyerapan53', e.target.value)}
                          onBlur={() => handleInputBlur(`y53_${idx}`)}
                          className="w-full text-right px-2 py-1 rounded-md border-2 border-sky-400 dark:border-sky-600 bg-white dark:bg-slate-900 text-xs font-black text-sky-950 dark:text-sky-50 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 shadow-xs"
                        />
                      </td>

                      {/* I: Penyerapan 57 */}
                      <td className="px-1.5 py-1 text-right border-r-2 border-sky-600 dark:border-sky-600 bg-sky-50/50 dark:bg-sky-950/25">
                        <input
                          type="text"
                          value={draftInputs[`y57_${idx}`] !== undefined ? draftInputs[`y57_${idx}`] : (r.penyerapan57 > 0 ? formatRupiah(r.penyerapan57) : '')}
                          placeholder="-"
                          onChange={e => handleInputChange(`y57_${idx}`, idx, 'penyerapan57', e.target.value)}
                          onBlur={() => handleInputBlur(`y57_${idx}`)}
                          className="w-full text-right px-2 py-1 rounded-md border-2 border-sky-400 dark:border-sky-600 bg-white dark:bg-slate-900 text-xs font-black text-sky-950 dark:text-sky-50 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 placeholder-slate-400 shadow-xs"
                        />
                      </td>

                      {/* J: Deviasi 51 */}
                      <td className="px-2.5 py-1.5 text-right border-r border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 font-bold">
                        {formatRupiah(r.deviasi51)}
                      </td>

                      {/* K: Deviasi 52 */}
                      <td className="px-2.5 py-1.5 text-right border-r border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 font-bold">
                        {formatRupiah(r.deviasi52)}
                      </td>

                      {/* L: Deviasi 53 */}
                      <td className="px-2.5 py-1.5 text-right border-r border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 font-bold">
                        {formatRupiah(r.deviasi53)}
                      </td>

                      {/* M: Deviasi 57 */}
                      <td className="px-2.5 py-1.5 text-right border-r-2 border-slate-400 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 font-bold">
                        {r.deviasi57 > 0 ? formatRupiah(r.deviasi57) : '-'}
                      </td>

                      {/* N: % Deviasi 51 */}
                      <td className="px-2.5 py-1.5 text-right border-r border-slate-200 dark:border-slate-700 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 font-black">
                        {r.persenDeviasi51.toFixed(2)}%
                      </td>

                      {/* O: % Deviasi 52 */}
                      <td className="px-2.5 py-1.5 text-right border-r border-slate-200 dark:border-slate-700 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 font-black">
                        {r.persenDeviasi52.toFixed(2)}%
                      </td>

                      {/* P: % Deviasi 53 */}
                      <td className="px-2.5 py-1.5 text-right border-r border-slate-200 dark:border-slate-700 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 font-black">
                        {r.persenDeviasi53.toFixed(2)}%
                      </td>

                      {/* Q: % Deviasi 57 */}
                      <td className="px-2.5 py-1.5 text-right border-r-2 border-indigo-400 dark:border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 font-black">
                        {r.persenDeviasi57 > 0 ? `${r.persenDeviasi57.toFixed(2)}%` : '0,00%'}
                      </td>

                      {/* R: % Proporsi 51 */}
                      <td className="px-1.5 py-1 text-right border-r border-slate-200 dark:border-slate-700 bg-purple-50/40 dark:bg-purple-950/20 text-purple-950 dark:text-purple-100 font-bold text-xs font-mono">
                        <div className="flex items-center justify-end gap-0.5">
                          <input
                            type="text"
                            value={draftInputs[`p51_${idx}`] !== undefined ? draftInputs[`p51_${idx}`] : r.proporsi51.toFixed(2)}
                            onChange={e => handleProporsiInputChange(`p51_${idx}`, idx, 'proporsi51', e.target.value)}
                            onBlur={() => handleInputBlur(`p51_${idx}`)}
                            className="w-13 text-right px-1 py-0.5 rounded text-xs font-mono font-bold border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-purple-950 dark:text-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
                            title={`Proporsi Pagu Belanja 51 Periode ${r.periode} (${r.proporsi51.toFixed(2)}%). Dapat disesuaikan bila terjadi perubahan pagu DIPA.`}
                          />
                          <span className="text-[10px] text-purple-400 font-bold">%</span>
                        </div>
                      </td>

                      {/* S: % Proporsi 52 */}
                      <td className="px-1.5 py-1 text-right border-r border-slate-200 dark:border-slate-700 bg-purple-50/40 dark:bg-purple-950/20 text-purple-950 dark:text-purple-100 font-bold text-xs font-mono">
                        <div className="flex items-center justify-end gap-0.5">
                          <input
                            type="text"
                            value={draftInputs[`p52_${idx}`] !== undefined ? draftInputs[`p52_${idx}`] : r.proporsi52.toFixed(2)}
                            onChange={e => handleProporsiInputChange(`p52_${idx}`, idx, 'proporsi52', e.target.value)}
                            onBlur={() => handleInputBlur(`p52_${idx}`)}
                            className="w-13 text-right px-1 py-0.5 rounded text-xs font-mono font-bold border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-purple-950 dark:text-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
                            title={`Proporsi Pagu Belanja 52 Periode ${r.periode} (${r.proporsi52.toFixed(2)}%). Dapat disesuaikan bila terjadi perubahan pagu DIPA.`}
                          />
                          <span className="text-[10px] text-purple-400 font-bold">%</span>
                        </div>
                      </td>

                      {/* T: % Proporsi 53 */}
                      <td className="px-1.5 py-1 text-right border-r border-slate-200 dark:border-slate-700 bg-purple-50/40 dark:bg-purple-950/20 text-purple-950 dark:text-purple-100 font-bold text-xs font-mono">
                        <div className="flex items-center justify-end gap-0.5">
                          <input
                            type="text"
                            value={draftInputs[`p53_${idx}`] !== undefined ? draftInputs[`p53_${idx}`] : r.proporsi53.toFixed(2)}
                            onChange={e => handleProporsiInputChange(`p53_${idx}`, idx, 'proporsi53', e.target.value)}
                            onBlur={() => handleInputBlur(`p53_${idx}`)}
                            className="w-13 text-right px-1 py-0.5 rounded text-xs font-mono font-bold border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-purple-950 dark:text-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
                            title={`Proporsi Pagu Belanja 53 Periode ${r.periode} (${r.proporsi53.toFixed(2)}%). Dapat disesuaikan bila terjadi perubahan pagu DIPA.`}
                          />
                          <span className="text-[10px] text-purple-400 font-bold">%</span>
                        </div>
                      </td>

                      {/* U: % Proporsi 57 */}
                      <td className="px-1.5 py-1 text-right border-r-2 border-purple-400 dark:border-purple-600 bg-purple-50/40 dark:bg-purple-950/20 text-purple-950 dark:text-purple-100 font-bold text-xs font-mono">
                        <div className="flex items-center justify-end gap-0.5">
                          <input
                            type="text"
                            value={draftInputs[`p57_${idx}`] !== undefined ? draftInputs[`p57_${idx}`] : (r.proporsi57 > 0 ? r.proporsi57.toFixed(2) : '0.00')}
                            onChange={e => handleProporsiInputChange(`p57_${idx}`, idx, 'proporsi57', e.target.value)}
                            onBlur={() => handleInputBlur(`p57_${idx}`)}
                            className="w-13 text-right px-1 py-0.5 rounded text-xs font-mono font-bold border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-purple-950 dark:text-purple-100 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
                            title={`Proporsi Pagu Belanja 57 Periode ${r.periode} (${r.proporsi57.toFixed(2)}%). Dapat disesuaikan bila terjadi perubahan pagu DIPA.`}
                          />
                          <span className="text-[10px] text-purple-400 font-bold">%</span>
                        </div>
                      </td>

                      {/* V: % Deviasi Tertimbang 51 */}
                      <td className={`px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700 transition-colors ${
                        r.isDispensasi51
                          ? 'bg-amber-100/80 dark:bg-amber-950/60'
                          : isMaret
                          ? 'bg-amber-200/50 dark:bg-amber-950/40'
                          : 'bg-amber-50/40 dark:bg-amber-950/20'
                      }`}>
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center justify-end gap-1 w-full">
                            <input
                              type="text"
                              value={
                                draftInputs[`dt51_${idx}`] !== undefined
                                  ? draftInputs[`dt51_${idx}`]
                                  : r.deviasiTertimbang51.toFixed(2)
                              }
                              onChange={e => handleDeviasiTertimbangInputChange(`dt51_${idx}`, idx, 'overrideDeviasiTertimbang51', e.target.value)}
                              onBlur={() => handleInputBlur(`dt51_${idx}`)}
                              className={`w-14 text-right px-1 py-0.5 rounded text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs transition-all ${
                                r.isDispensasi51
                                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 font-black'
                                  : isMaret
                                  ? 'border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200'
                                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                              }`}
                              title={
                                r.isDispensasi51
                                  ? `Dispensasi aktif: ${r.deviasiTertimbang51.toFixed(2)}%. Rumus otomatis: ${r.autoDeviasiTertimbang51?.toFixed(2)}%.`
                                  : isMaret
                                  ? 'Khusus Bulan Maret: Deviasi tertimbang Belanja 51 otomatis 0.00% sesuai regulasi S-119/PB.2/2024.'
                                  : `Deviasi tertimbang 51. Rumus otomatis: ${r.autoDeviasiTertimbang51?.toFixed(2)}%.`
                              }
                            />
                            <span className="text-[10px] text-slate-400 font-bold">%</span>
                          </div>
                          {isMaret && !r.isDispensasi51 && (
                            <span
                              className="text-[8px] font-mono text-amber-700 dark:text-amber-300 font-bold"
                              title="Sesuai S-119/PB.2/2024: Deviasi tertimbang Belanja 51 di bulan Maret dinolkan (0%)"
                            >
                              S-119 (0%)
                            </span>
                          )}
                          {r.isDispensasi51 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className="px-1 py-0.2 rounded text-[7px] font-black bg-amber-500 text-white uppercase tracking-wider shadow-2xs leading-tight"
                                title="Nilai ini disesuaikan karena satker mendapat dispensasi"
                              >
                                Dispensasi
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResetDeviasiTertimbang(idx, 'overrideDeviasiTertimbang51');
                                }}
                                className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800 transition-colors cursor-pointer shadow-2xs leading-tight"
                                title={`Dispensasi aktif: ${r.deviasiTertimbang51.toFixed(2)}%. Klik Auto untuk mereset ke formula otomatis (${r.autoDeviasiTertimbang51?.toFixed(2)}%)`}
                              >
                                Auto
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* W: % Deviasi Tertimbang 52 */}
                      <td className={`px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700 transition-colors ${
                        r.isDispensasi52
                          ? 'bg-amber-100/80 dark:bg-amber-950/60'
                          : isMaret
                          ? 'bg-amber-200/50 dark:bg-amber-950/40'
                          : 'bg-amber-50/40 dark:bg-amber-950/20'
                      }`}>
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center justify-end gap-1 w-full">
                            <input
                              type="text"
                              value={
                                draftInputs[`dt52_${idx}`] !== undefined
                                  ? draftInputs[`dt52_${idx}`]
                                  : r.deviasiTertimbang52.toFixed(2)
                              }
                              onChange={e => handleDeviasiTertimbangInputChange(`dt52_${idx}`, idx, 'overrideDeviasiTertimbang52', e.target.value)}
                              onBlur={() => handleInputBlur(`dt52_${idx}`)}
                              className={`w-14 text-right px-1 py-0.5 rounded text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs transition-all ${
                                r.isDispensasi52
                                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 font-black'
                                  : isMaret
                                  ? 'border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200'
                                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                              }`}
                              title={
                                r.isDispensasi52
                                  ? `Dispensasi aktif: ${r.deviasiTertimbang52.toFixed(2)}%. Rumus otomatis: ${r.autoDeviasiTertimbang52?.toFixed(2)}%.`
                                  : isMaret
                                  ? 'Khusus Bulan Maret: Deviasi tertimbang Belanja 52 otomatis 0.00% sesuai regulasi S-119/PB.2/2024.'
                                  : `Deviasi tertimbang 52. Rumus otomatis: ${r.autoDeviasiTertimbang52?.toFixed(2)}%.`
                              }
                            />
                            <span className="text-[10px] text-slate-400 font-bold">%</span>
                          </div>
                          {isMaret && !r.isDispensasi52 && (
                            <span
                              className="text-[8px] font-mono text-amber-700 dark:text-amber-300 font-bold"
                              title="Sesuai S-119/PB.2/2024: Deviasi tertimbang Belanja 52 di bulan Maret dinolkan (0%)"
                            >
                              S-119 (0%)
                            </span>
                          )}
                          {r.isDispensasi52 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className="px-1 py-0.2 rounded text-[7px] font-black bg-amber-500 text-white uppercase tracking-wider shadow-2xs leading-tight"
                                title="Nilai ini disesuaikan karena satker mendapat dispensasi"
                              >
                                Dispensasi
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResetDeviasiTertimbang(idx, 'overrideDeviasiTertimbang52');
                                }}
                                className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800 transition-colors cursor-pointer shadow-2xs leading-tight"
                                title={`Dispensasi aktif: ${r.deviasiTertimbang52.toFixed(2)}%. Klik Auto untuk mereset ke formula otomatis (${r.autoDeviasiTertimbang52?.toFixed(2)}%)`}
                              >
                                Auto
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* X: % Deviasi Tertimbang 53 */}
                      <td className={`px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-700 transition-colors ${
                        r.isDispensasi53
                          ? 'bg-amber-100/80 dark:bg-amber-950/60'
                          : 'bg-amber-50/40 dark:bg-amber-950/20'
                      }`}>
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center justify-end gap-1 w-full">
                            <input
                              type="text"
                              value={
                                draftInputs[`dt53_${idx}`] !== undefined
                                  ? draftInputs[`dt53_${idx}`]
                                  : r.deviasiTertimbang53.toFixed(2)
                              }
                              onChange={e => handleDeviasiTertimbangInputChange(`dt53_${idx}`, idx, 'overrideDeviasiTertimbang53', e.target.value)}
                              onBlur={() => handleInputBlur(`dt53_${idx}`)}
                              className={`w-14 text-right px-1 py-0.5 rounded text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs transition-all ${
                                r.isDispensasi53
                                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 font-black'
                                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                              }`}
                              title={`Deviasi tertimbang 53. Rumus otomatis: ${r.autoDeviasiTertimbang53?.toFixed(2)}%. Diedit manual jika ada dispensasi.`}
                            />
                            <span className="text-[10px] text-slate-400 font-bold">%</span>
                          </div>
                          {r.isDispensasi53 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className="px-1 py-0.2 rounded text-[7px] font-black bg-amber-500 text-white uppercase tracking-wider shadow-2xs leading-tight"
                                title="Nilai ini disesuaikan karena satker mendapat dispensasi"
                              >
                                Dispensasi
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResetDeviasiTertimbang(idx, 'overrideDeviasiTertimbang53');
                                }}
                                className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800 transition-colors cursor-pointer shadow-2xs leading-tight"
                                title={`Dispensasi aktif: ${r.deviasiTertimbang53.toFixed(2)}%. Klik Auto untuk mereset ke formula otomatis (${r.autoDeviasiTertimbang53?.toFixed(2)}%)`}
                              >
                                Auto
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Y: % Deviasi Tertimbang 57 */}
                      <td className={`px-2 py-1.5 text-right border-r-2 border-amber-400 dark:border-amber-600 transition-colors ${
                        r.isDispensasi57
                          ? 'bg-amber-100/80 dark:bg-amber-950/60'
                          : 'bg-amber-50/40 dark:bg-amber-950/20'
                      }`}>
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center justify-end gap-1 w-full">
                            <input
                              type="text"
                              value={
                                draftInputs[`dt57_${idx}`] !== undefined
                                  ? draftInputs[`dt57_${idx}`]
                                  : (r.deviasiTertimbang57 > 0 ? r.deviasiTertimbang57.toFixed(2) : '0.00')
                              }
                              onChange={e => handleDeviasiTertimbangInputChange(`dt57_${idx}`, idx, 'overrideDeviasiTertimbang57', e.target.value)}
                              onBlur={() => handleInputBlur(`dt57_${idx}`)}
                              className={`w-14 text-right px-1 py-0.5 rounded text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs transition-all ${
                                r.isDispensasi57
                                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 font-black'
                                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                              }`}
                              title={`Deviasi tertimbang 57. Rumus otomatis: ${r.autoDeviasiTertimbang57?.toFixed(2)}%. Diedit manual jika ada dispensasi.`}
                            />
                            <span className="text-[10px] text-slate-400 font-bold">%</span>
                          </div>
                          {r.isDispensasi57 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className="px-1 py-0.2 rounded text-[7px] font-black bg-amber-500 text-white uppercase tracking-wider shadow-2xs leading-tight"
                                title="Nilai ini disesuaikan karena satker mendapat dispensasi"
                              >
                                Dispensasi
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResetDeviasiTertimbang(idx, 'overrideDeviasiTertimbang57');
                                }}
                                className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800 transition-colors cursor-pointer shadow-2xs leading-tight"
                                title={`Dispensasi aktif: ${r.deviasiTertimbang57.toFixed(2)}%. Klik Auto untuk mereset ke formula otomatis (${r.autoDeviasiTertimbang57?.toFixed(2)}%)`}
                              >
                                Auto
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Z: % Deviasi Seluruh Jenis Belanja */}
                      <td className="px-3 py-1.5 text-right border-r-2 border-orange-500 font-black text-orange-950 dark:text-orange-100 bg-orange-100/80 dark:bg-orange-950/40">
                        {r.deviasiSeluruhJenisBelanja.toFixed(2)}%
                      </td>

                      {/* AA: % Rata-Rata Deviasi Kumulatif */}
                      <td className="px-3 py-1.5 text-right border-r-2 border-teal-500 font-black text-teal-950 dark:text-teal-100 bg-teal-100/80 dark:bg-teal-950/40">
                        {r.rataRataDeviasiKumulatif.toFixed(2)}%
                      </td>

                      {/* AB: Nilai IKPA */}
                      <td className={`px-2 py-1.5 text-right transition-colors ${
                        r.isDispensasiNilaiIKPA
                          ? 'bg-amber-100/80 dark:bg-amber-950/60'
                          : 'bg-emerald-100/50 dark:bg-emerald-950/40'
                      }`}>
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center justify-end gap-1 w-full">
                            <input
                              type="text"
                              value={
                                draftInputs[`nikpa_${idx}`] !== undefined
                                  ? draftInputs[`nikpa_${idx}`]
                                  : r.nilaiIKPA.toFixed(2)
                              }
                              onChange={e => handleNilaiIKPAInputChange(`nikpa_${idx}`, idx, e.target.value)}
                              onBlur={() => handleInputBlur(`nikpa_${idx}`)}
                              className={`w-16 text-right px-1 py-0.5 rounded text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs transition-all ${
                                r.isDispensasiNilaiIKPA
                                  ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 font-black'
                                  : 'border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 font-black'
                              }`}
                              title={`Nilai IKPA Kolom AB. Rumus normal: =IF(AA<=${ambangBatas.toFixed(1)}, 100, 100-AA). Otomatis: ${r.autoNilaiIKPA !== undefined ? r.autoNilaiIKPA.toFixed(2) : r.nilaiIKPA.toFixed(2)}. Diedit manual jika ada dispensasi.`}
                            />
                          </div>
                          {r.isDispensasiNilaiIKPA && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className="px-1 py-0.2 rounded text-[7px] font-black bg-amber-500 text-white uppercase tracking-wider shadow-2xs leading-tight"
                                title="Nilai IKPA disesuaikan manual karena satker mendapat dispensasi"
                              >
                                Dispensasi
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResetNilaiIKPA(idx);
                                }}
                                className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800 transition-colors cursor-pointer shadow-2xs leading-tight"
                                title={`Dispensasi aktif: ${r.nilaiIKPA.toFixed(2)}. Klik Auto untuk mereset ke formula reguler (${r.autoNilaiIKPA?.toFixed(2)})`}
                              >
                                Auto
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Aksi: Hapus Baris */}
                      <td className="px-2 py-1.5 text-center border-l border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          title={`Hapus baris Periode ${r.periode}`}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={29} className="py-12 px-4 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                            Belum Ada Baris Periode Bulan
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Settingan awal bersih (0 baris). Satker dapat menambahkan baris bulan secara mandiri sesuai progres yang ingin disimulasikan tanpa merasa berkewajiban mengisi sampai Desember.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                          <button
                            onClick={handleAddMonthRow}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            + Tambah {nextMonthLabel}
                          </button>
                          <button
                            onClick={handleAddQuarter1}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            + Tambah Triwulan I (3 Bulan)
                          </button>
                          <button
                            onClick={handleResetDefault}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs cursor-pointer"
                          >
                            Muat 12 Bulan Excel
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
        )
      )}

      {/* 5. Mode Input Sederhana & What-If Simulation */}
      {viewMode === 'simple' && (
        <div className="space-y-6 animate-fade-in">
          {/* Slider What-If */}
          <div
            className={`rounded-2xl border p-5 shadow-xs ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-lg">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    What-If Simulation: Pengetatan Deviasi RPD
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Simulasikan peningkatan kepatuhan penarikan dana dengan mempersempit selisih antara realisasi dan rencana sebesar {whatIfReductionPct}%.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={whatIfReductionPct}
                    onChange={e => setWhatIfReductionPct(Number(e.target.value))}
                    className="w-36 accent-emerald-600 cursor-pointer"
                  />
                  <span className="font-mono font-black text-sm w-12 text-emerald-600 dark:text-emerald-400 text-right">
                    {whatIfReductionPct}%
                  </span>
                </div>
                <button
                  onClick={handleApplyWhatIf}
                  disabled={whatIfReductionPct === 0}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors shadow-xs"
                >
                  Terapkan Simulasi
                </button>
              </div>
            </div>
          </div>

          {/* Pemilih Bulan Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {rows.map((r, i) => (
              <button
                key={r.periode}
                onClick={() => setSelectedSimpleMonthIdx(i)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex flex-col items-center gap-0.5 ${
                  selectedSimpleMonthIdx === i
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className="text-[10px] opacity-75">{BULAN_NAMES[i]}</span>
                <span className="font-mono font-bold text-xs">{r.periode}</span>
                <span className={`text-[10px] font-mono ${selectedSimpleMonthIdx === i ? 'text-emerald-100' : 'text-emerald-600'}`}>
                  {r.nilaiIKPA.toFixed(1)}
                </span>
              </button>
            ))}
          </div>

          {/* Kartu Input Bulan Terpilih */}
          {(() => {
            const activeRow = rows[selectedSimpleMonthIdx] || rows[0];
            const isMaret = activeRow.periode === '03';
            const isDesember = activeRow.periode === '12';

            return (
              <div
                className={`rounded-2xl border p-6 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      Periode {activeRow.periode} — Bulan {BULAN_NAMES[selectedSimpleMonthIdx]} 2026
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Silakan isi rencana (RPD) dan penyerapan (realisasi) pada kolom di bawah.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Deviasi Kumulatif (AA)
                      </span>
                      <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                        {activeRow.rataRataDeviasiKumulatif.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Nilai IKPA Bulan (AB)
                        </span>
                        {activeRow.isDispensasiNilaiIKPA && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-amber-500 text-white uppercase tracking-wider">
                            Dispensasi
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={
                            draftInputs[`nikpa_simple_${selectedSimpleMonthIdx}`] !== undefined
                              ? draftInputs[`nikpa_simple_${selectedSimpleMonthIdx}`]
                              : activeRow.nilaiIKPA.toFixed(2)
                          }
                          onChange={e => handleNilaiIKPAInputChange(`nikpa_simple_${selectedSimpleMonthIdx}`, selectedSimpleMonthIdx, e.target.value)}
                          onBlur={() => handleInputBlur(`nikpa_simple_${selectedSimpleMonthIdx}`)}
                          className={`w-24 text-right px-2 py-0.5 rounded-lg text-lg font-mono font-black border focus:outline-none focus:ring-2 ${
                            activeRow.isDispensasiNilaiIKPA
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100 focus:ring-amber-500'
                              : 'border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500'
                          }`}
                          title={`Nilai IKPA Kolom AB. Otomatis: ${activeRow.autoNilaiIKPA !== undefined ? activeRow.autoNilaiIKPA.toFixed(2) : activeRow.nilaiIKPA.toFixed(2)}`}
                        />
                        {activeRow.isDispensasiNilaiIKPA && (
                          <button
                            type="button"
                            onClick={() => handleResetNilaiIKPA(selectedSimpleMonthIdx)}
                            className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800 transition-colors cursor-pointer"
                            title="Reset Nilai IKPA ke formula otomatis"
                          >
                            Auto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isMaret && (
                  <div className="my-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>
                      <strong>Pengecualian Khusus Maret:</strong> Deviasi tertimbang belanja 51 dan 52 bulan Maret di-hardcode 0 sesuai S-119/PB.2/2024.
                    </span>
                  </div>
                )}

                {isDesember && (
                  <div className="my-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>
                      <strong>Aturan Khusus Desember:</strong> Penilaian IKPA hanya sampai November, sehingga nilai kumulatif AA16 sama dengan AA15 ({rows[10]?.rataRataDeviasiKumulatif.toFixed(2)}%).
                    </span>
                  </div>
                )}

                {/* Grid 4 Jenis Belanja */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  {/* Belanja 51 */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        Belanja Pegawai (51)
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
                        Prop: {activeRow.proporsi51.toFixed(1)}%
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase block mb-1">
                          Rencana (RPD)
                        </label>
                        <input
                          type="text"
                          value={draftInputs[`r51_${selectedSimpleMonthIdx}`] !== undefined ? draftInputs[`r51_${selectedSimpleMonthIdx}`] : formatRupiah(activeRow.rencana51)}
                          onChange={e => handleInputChange(`r51_${selectedSimpleMonthIdx}`, selectedSimpleMonthIdx, 'rencana51', e.target.value)}
                          onBlur={() => handleInputBlur(`r51_${selectedSimpleMonthIdx}`)}
                          className="w-full text-right px-2.5 py-1.5 rounded-lg border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-slate-900 font-mono font-bold text-xs text-slate-900 dark:text-emerald-100 focus:outline-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-sky-800 dark:text-sky-300 font-bold uppercase block mb-1">
                          Penyerapan (Realisasi)
                        </label>
                        <input
                          type="text"
                          value={draftInputs[`y51_${selectedSimpleMonthIdx}`] !== undefined ? draftInputs[`y51_${selectedSimpleMonthIdx}`] : formatRupiah(activeRow.penyerapan51)}
                          onChange={e => handleInputChange(`y51_${selectedSimpleMonthIdx}`, selectedSimpleMonthIdx, 'penyerapan51', e.target.value)}
                          onBlur={() => handleInputBlur(`y51_${selectedSimpleMonthIdx}`)}
                          className="w-full text-right px-2.5 py-1.5 rounded-lg border-2 border-sky-400 dark:border-sky-600 bg-sky-50/40 dark:bg-slate-900 font-mono font-bold text-sky-950 dark:text-sky-100 text-xs focus:outline-sky-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1 font-mono">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Deviasi:</span>
                        <span>Rp {formatRupiah(activeRow.deviasi51)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">% Deviasi:</span>
                        <span className="text-blue-600 dark:text-blue-400">{activeRow.persenDeviasi51.toFixed(2)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-500 flex items-center gap-1">
                          <span>Tertimbang:</span>
                          {activeRow.isDispensasi51 && (
                            <span className="px-1 py-0.2 rounded bg-amber-500 text-white text-[8px] font-black uppercase">
                              Dispensasi
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={
                              draftInputs[`dt51_${selectedSimpleMonthIdx}`] !== undefined
                                ? draftInputs[`dt51_${selectedSimpleMonthIdx}`]
                                : activeRow.deviasiTertimbang51.toFixed(2)
                            }
                            onChange={e => handleDeviasiTertimbangInputChange(`dt51_${selectedSimpleMonthIdx}`, selectedSimpleMonthIdx, 'overrideDeviasiTertimbang51', e.target.value)}
                            onBlur={() => handleInputBlur(`dt51_${selectedSimpleMonthIdx}`)}
                            className="w-14 text-right px-1 py-0.5 rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 font-bold text-[11px] text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            title="Edit persentase jika ada dispensasi"
                          />
                          <span className="text-[10px] text-slate-400 font-bold">%</span>
                          {activeRow.isDispensasi51 && (
                            <button
                              type="button"
                              onClick={() => handleResetDeviasiTertimbang(selectedSimpleMonthIdx, 'overrideDeviasiTertimbang51')}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 dark:bg-amber-900 dark:text-amber-100 transition-colors"
                            >
                              Auto
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Belanja 52 */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        Belanja Barang (52)
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
                        Prop: {activeRow.proporsi52.toFixed(1)}%
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase block mb-1">
                          Rencana (RPD)
                        </label>
                        <input
                          type="text"
                          value={draftInputs[`r52_${selectedSimpleMonthIdx}`] !== undefined ? draftInputs[`r52_${selectedSimpleMonthIdx}`] : formatRupiah(activeRow.rencana52)}
                          onChange={e => handleInputChange(`r52_${selectedSimpleMonthIdx}`, selectedSimpleMonthIdx, 'rencana52', e.target.value)}
                          onBlur={() => handleInputBlur(`r52_${selectedSimpleMonthIdx}`)}
                          className="w-full text-right px-2.5 py-1.5 rounded-lg border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-slate-900 font-mono font-bold text-xs text-slate-900 dark:text-emerald-100 focus:outline-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-sky-800 dark:text-sky-300 font-bold uppercase block mb-1">
                          Penyerapan (Realisasi)
                        </label>
                        <input
                          type="text"
                          value={draftInputs[`y52_${selectedSimpleMonthIdx}`] !== undefined ? draftInputs[`y52_${selectedSimpleMonthIdx}`] : formatRupiah(activeRow.penyerapan52)}
                          onChange={e => handleInputChange(`y52_${selectedSimpleMonthIdx}`, selectedSimpleMonthIdx, 'penyerapan52', e.target.value)}
                          onBlur={() => handleInputBlur(`y52_${selectedSimpleMonthIdx}`)}
                          className="w-full text-right px-2.5 py-1.5 rounded-lg border-2 border-sky-400 dark:border-sky-600 bg-sky-50/40 dark:bg-slate-900 font-mono font-bold text-sky-950 dark:text-sky-100 text-xs focus:outline-sky-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1 font-mono">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Deviasi:</span>
                        <span>Rp {formatRupiah(activeRow.deviasi52)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">% Deviasi:</span>
                        <span className="text-blue-600 dark:text-blue-400">{activeRow.persenDeviasi52.toFixed(2)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-500 flex items-center gap-1">
                          <span>Tertimbang:</span>
                          {activeRow.isDispensasi52 && (
                            <span className="px-1 py-0.2 rounded bg-amber-500 text-white text-[8px] font-black uppercase">
                              Dispensasi
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={
                              draftInputs[`dt52_${selectedSimpleMonthIdx}`] !== undefined
                                ? draftInputs[`dt52_${selectedSimpleMonthIdx}`]
                                : activeRow.deviasiTertimbang52.toFixed(2)
                            }
                            onChange={e => handleDeviasiTertimbangInputChange(`dt52_${selectedSimpleMonthIdx}`, selectedSimpleMonthIdx, 'overrideDeviasiTertimbang52', e.target.value)}
                            onBlur={() => handleInputBlur(`dt52_${selectedSimpleMonthIdx}`)}
                            className="w-14 text-right px-1 py-0.5 rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 font-bold text-[11px] text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            title="Edit persentase jika ada dispensasi"
                          />
                          <span className="text-[10px] text-slate-400 font-bold">%</span>
                          {activeRow.isDispensasi52 && (
                            <button
                              type="button"
                              onClick={() => handleResetDeviasiTertimbang(selectedSimpleMonthIdx, 'overrideDeviasiTertimbang52')}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 dark:bg-amber-900 dark:text-amber-100 transition-colors"
                            >
                              Auto
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Belanja 53 */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        Belanja Modal (53)
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
                        Prop: {activeRow.proporsi53.toFixed(1)}%
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase block mb-1">
                          Rencana (RPD)
                        </label>
                        <input
                          type="text"
                          value={draftInputs[`r53_${selectedSimpleMonthIdx}`] !== undefined ? draftInputs[`r53_${selectedSimpleMonthIdx}`] : formatRupiah(activeRow.rencana53)}
                          onChange={e => handleInputChange(`r53_${selectedSimpleMonthIdx}`, selectedSimpleMonthIdx, 'rencana53', e.target.value)}
                          onBlur={() => handleInputBlur(`r53_${selectedSimpleMonthIdx}`)}
                          className="w-full text-right px-2.5 py-1.5 rounded-lg border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-slate-900 font-mono font-bold text-xs text-slate-900 dark:text-emerald-100 focus:outline-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-sky-800 dark:text-sky-300 font-bold uppercase block mb-1">
                          Penyerapan (Realisasi)
                        </label>
                        <input
                          type="text"
                          value={draftInputs[`y53_${selectedSimpleMonthIdx}`] !== undefined ? draftInputs[`y53_${selectedSimpleMonthIdx}`] : formatRupiah(activeRow.penyerapan53)}
                          onChange={e => handleInputChange(`y53_${selectedSimpleMonthIdx}`, selectedSimpleMonthIdx, 'penyerapan53', e.target.value)}
                          onBlur={() => handleInputBlur(`y53_${selectedSimpleMonthIdx}`)}
                          className="w-full text-right px-2.5 py-1.5 rounded-lg border-2 border-sky-400 dark:border-sky-600 bg-sky-50/40 dark:bg-slate-900 font-mono font-bold text-sky-950 dark:text-sky-100 text-xs focus:outline-sky-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1 font-mono">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Deviasi:</span>
                        <span>Rp {formatRupiah(activeRow.deviasi53)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">% Deviasi:</span>
                        <span className="text-blue-600 dark:text-blue-400">{activeRow.persenDeviasi53.toFixed(2)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-500 flex items-center gap-1">
                          <span>Tertimbang:</span>
                          {activeRow.isDispensasi53 && (
                            <span className="px-1 py-0.2 rounded bg-amber-500 text-white text-[8px] font-black uppercase">
                              Dispensasi
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={
                              draftInputs[`dt53_${selectedSimpleMonthIdx}`] !== undefined
                                ? draftInputs[`dt53_${selectedSimpleMonthIdx}`]
                                : activeRow.deviasiTertimbang53.toFixed(2)
                            }
                            onChange={e => handleDeviasiTertimbangInputChange(`dt53_${selectedSimpleMonthIdx}`, selectedSimpleMonthIdx, 'overrideDeviasiTertimbang53', e.target.value)}
                            onBlur={() => handleInputBlur(`dt53_${selectedSimpleMonthIdx}`)}
                            className="w-14 text-right px-1 py-0.5 rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 font-bold text-[11px] text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            title="Edit persentase jika ada dispensasi"
                          />
                          <span className="text-[10px] text-slate-400 font-bold">%</span>
                          {activeRow.isDispensasi53 && (
                            <button
                              type="button"
                              onClick={() => handleResetDeviasiTertimbang(selectedSimpleMonthIdx, 'overrideDeviasiTertimbang53')}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 dark:bg-amber-900 dark:text-amber-100 transition-colors"
                            >
                              Auto
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Belanja 57 */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        Bantuan Sosial (57)
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold">
                        Prop: {activeRow.proporsi57 > 0 ? `${activeRow.proporsi57.toFixed(1)}%` : '0%'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase block mb-1">
                          Rencana (RPD)
                        </label>
                        <input
                          type="text"
                          value={draftInputs[`r57_${selectedSimpleMonthIdx}`] !== undefined ? draftInputs[`r57_${selectedSimpleMonthIdx}`] : (activeRow.rencana57 > 0 ? formatRupiah(activeRow.rencana57) : '')}
                          placeholder="Rp 0"
                          onChange={e => handleInputChange(`r57_${selectedSimpleMonthIdx}`, selectedSimpleMonthIdx, 'rencana57', e.target.value)}
                          onBlur={() => handleInputBlur(`r57_${selectedSimpleMonthIdx}`)}
                          className="w-full text-right px-2.5 py-1.5 rounded-lg border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-slate-900 font-mono font-bold text-xs text-slate-900 dark:text-emerald-100 focus:outline-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-sky-800 dark:text-sky-300 font-bold uppercase block mb-1">
                          Penyerapan (Realisasi)
                        </label>
                        <input
                          type="text"
                          value={draftInputs[`y57_${selectedSimpleMonthIdx}`] !== undefined ? draftInputs[`y57_${selectedSimpleMonthIdx}`] : (activeRow.penyerapan57 > 0 ? formatRupiah(activeRow.penyerapan57) : '')}
                          placeholder="Rp 0"
                          onChange={e => handleInputChange(`y57_${selectedSimpleMonthIdx}`, selectedSimpleMonthIdx, 'penyerapan57', e.target.value)}
                          onBlur={() => handleInputBlur(`y57_${selectedSimpleMonthIdx}`)}
                          className="w-full text-right px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 dark:bg-slate-900 font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-xs focus:outline-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1 font-mono">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Deviasi:</span>
                        <span>{activeRow.deviasi57 > 0 ? `Rp ${formatRupiah(activeRow.deviasi57)}` : '-'}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">% Deviasi:</span>
                        <span className="text-blue-600 dark:text-blue-400">{activeRow.persenDeviasi57.toFixed(2)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-500 flex items-center gap-1">
                          <span>Tertimbang:</span>
                          {activeRow.isDispensasi57 && (
                            <span className="px-1 py-0.2 rounded bg-amber-500 text-white text-[8px] font-black uppercase">
                              Dispensasi
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={
                              draftInputs[`dt57_${selectedSimpleMonthIdx}`] !== undefined
                                ? draftInputs[`dt57_${selectedSimpleMonthIdx}`]
                                : activeRow.deviasiTertimbang57.toFixed(2)
                            }
                            onChange={e => handleDeviasiTertimbangInputChange(`dt57_${selectedSimpleMonthIdx}`, selectedSimpleMonthIdx, 'overrideDeviasiTertimbang57', e.target.value)}
                            onBlur={() => handleInputBlur(`dt57_${selectedSimpleMonthIdx}`)}
                            className="w-14 text-right px-1 py-0.5 rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 font-bold text-[11px] text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            title="Edit persentase jika ada dispensasi"
                          />
                          <span className="text-[10px] text-slate-400 font-bold">%</span>
                          {activeRow.isDispensasi57 && (
                            <button
                              type="button"
                              onClick={() => handleResetDeviasiTertimbang(selectedSimpleMonthIdx, 'overrideDeviasiTertimbang57')}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 dark:bg-amber-900 dark:text-amber-100 transition-colors"
                            >
                              Auto
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 6. Modal 14 Golden Tests */}
      {showGoldenTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div
            className={`w-full max-w-3xl rounded-2xl border p-6 shadow-2xl max-h-[90vh] flex flex-col ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Automated Golden Tests Deviasi Halaman III (TEST 1 s.d. TEST 14)
                </h3>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Status: {goldenReport.passedCount} / {goldenReport.totalTests} PASS
              </span>
            </div>

            <div className="overflow-y-auto py-4 space-y-2 flex-1 text-xs">
              {goldenReport.results.map(t => (
                <div
                  key={t.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                    t.passed
                      ? isDark
                        ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-200'
                        : 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                      : isDark
                      ? 'bg-rose-950/20 border-rose-900/40 text-rose-200'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px]">
                        {t.id}
                      </span>
                      <span className="font-semibold">{t.description}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Expected: {String(t.expected)} | Actual: {String(t.actual)}
                    </div>
                  </div>
                  <span
                    className={`font-mono font-black text-xs px-2 py-0.5 rounded-md ${
                      t.passed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {t.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowGoldenTestModal(false)}
                className="rounded-xl bg-slate-900 dark:bg-slate-800 text-white px-5 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Penjelasan Logika OM-SPAN Deviasi Hal III & Proporsi Pagu */}
      <DeviasiHal3LogicModal
        isOpen={showLogicModal}
        onClose={() => setShowLogicModal(false)}
        isDark={isDark}
      />
    </div>
  );
};
