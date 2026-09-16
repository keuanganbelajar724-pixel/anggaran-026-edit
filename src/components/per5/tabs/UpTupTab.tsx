import React, { useState, useMemo, useEffect } from 'react';
import {
  Coins,
  CreditCard,
  Sliders,
  Calculator,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eraser,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  Activity,
  Sparkles,
  Check,
  Download,
  Copy,
  Calendar,
  Info,
  Edit2
} from 'lucide-react';
import { SimulationProject, UPTUPTunaiInput, UPTUPKKPInput, IndicatorResult } from '../../../models/ikpa';
import { normalizeDateToIso } from '../../../utils/ikpaDateUtils';
import {
  calculateUPTUPTunai,
  ProcessedUPTunaiRow,
  getCalendarDaysDiff,
  calculateAutoDaysInMonth,
  determineAutoStatus,
  getPreviousRelevantTransaction,
  getDaysInMonthFromDateString
} from '../../../calculations/upTupTunai';
import { calculateUPKKP, ProcessedKKPMonthRow, KKP_TARGET_PERCENT } from '../../../calculations/upTupKKP';
import {
  calculateUPTUPCombinedRaw,
  calculateUPTUPCombinedFinal,
  validateUPTUPAgainstExcel,
  CompatibilityTestItem
} from '../../../calculations/pengelolaanUPTUP';
import { round2, formatRupiah, formatScore } from '../../../calculations/rounding';
import { DEFAULT_EXCEL_UP_TUNAI_ROWS, DEFAULT_EXCEL_UP_KKP_ROWS } from '../../../utils/excelReferenceDefaultData';
import { validateUpTup } from '../../../utils/indikatorValidation';
import { IndikatorValidationBanner } from '../common/IndikatorValidationBanner';
import { IndikatorCalculateButton } from '../common/IndikatorCalculateButton';
import { PetunjukPengisianCard } from '../common/PetunjukPengisianCard';
import { RupiahInput } from '../common/RupiahInput';
import { UpTupLogicModal } from './UpTupLogicModal';

interface UpTupTabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

/**
 * Konversi tanggal ISO (YYYY-MM-DD) ke serial number Excel (Epoch 1899-12-30)
 */
function toExcelSerial(isoDate: string): number {
  if (!isoDate) return 0;
  const parts = isoDate.split('T')[0].split('-');
  if (parts.length !== 3) return 0;
  const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  const epoch = new Date(Date.UTC(1899, 11, 30));
  const diff = Math.round((d.getTime() - epoch.getTime()) / (24 * 60 * 60 * 1000));
  return diff > 0 ? diff : 0;
}

/**
 * Konversi serial number Excel ke tanggal ISO (YYYY-MM-DD)
 */
function fromExcelSerial(serial: number): string {
  if (!serial || serial <= 0) return '';
  const epoch = new Date(Date.UTC(1899, 11, 30));
  const d = new Date(epoch.getTime() + serial * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

/**
 * Format angka gaya Excel Indonesia (titik ribuan, koma desimal)
 * Memastikan tampilan identik dengan Excel resmi (contoh: 47,07; 41,8; 100; 89,47)
 */
function formatExcelNum(val: number | null | undefined, maxDecimals = 2, dashIfZero = false): string {
  if (val === null || val === undefined) return '-';
  if (dashIfZero && val === 0) return '-';
  if (isNaN(val)) return '-';
  return val.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals
  });
}

/**
 * Format nominal rupiah bulat gaya Excel (e.g. 300000000 -> 300.000.000, 0 -> -)
 */
function formatExcelCurrency(val: number | null | undefined, dashIfZero = true): string {
  if (val === null || val === undefined) return '-';
  if (dashIfZero && val === 0) return '-';
  return val.toLocaleString('id-ID');
}

/**
 * Format tanggal tampilan lembar kerja Excel:
 * - 'dmy' (Default): "30/01/2024", "06/02/2024" (identik dengan format Excel di gambar pengguna)
 * - 'serial': "45321", "45328" (nomor seri Excel)
 * - 'calendar': "2024-01-30" (ISO)
 */
function formatDisplayDate(val: any, mode: 'dmy' | 'serial' | 'calendar' = 'dmy'): string {
  if (!val || val === '-') return '-';
  const iso = normalizeDateToIso(val);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return String(val || '-');
  if (mode === 'serial') return String(toExcelSerial(iso));
  if (mode === 'calendar') return iso;
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export const UpTupTab: React.FC<UpTupTabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  const tunaiRows = project.upTUPTunai || [];
  const kkpRows = project.upTUPKKP || [];

  // Auto-sync Kode Satker, Nama Satker, dan Kode KPPN (026) dari metadata login Satker jika kolom masih kosong
  useEffect(() => {
    const metaKodeSatker = project.metadata?.kodeSatker;
    const metaNamaSatker = (project.metadata?.namaSatker && project.metadata.namaSatker !== 'Simulasi Mandiri')
      ? project.metadata.namaSatker
      : '';
    const metaKodeKPPN = project.metadata?.kodeKPPN || '026';

    if (!tunaiRows || tunaiRows.length === 0) return;

    let hasChange = false;
    const updatedRows = tunaiRows.map(r => {
      const newKode = r.kodeSatker || metaKodeSatker || '';
      const newNama = r.namaSatker || metaNamaSatker || '';
      const newKppn = r.kodeKPPN || metaKodeKPPN || '026';

      if (r.kodeSatker !== newKode || r.namaSatker !== newNama || r.kodeKPPN !== newKppn) {
        hasChange = true;
        return {
          ...r,
          kodeSatker: newKode,
          namaSatker: newNama,
          kodeKPPN: newKppn
        };
      }
      return r;
    });

    if (hasChange) {
      onUpdateProject({
        ...project,
        upTUPTunai: updatedRows
      });
    }
  }, [project.metadata?.kodeSatker, project.metadata?.namaSatker, project.metadata?.kodeKPPN, tunaiRows.length]);

  // Active section inside the UP TUP module
  const [activeSection, setActiveSection] = useState<'tunai' | 'kkp' | 'simulator' | 'diagnosis'>('tunai');

  // Excel Worksheet display options: default 'dmy' (DD/MM/YYYY) seperti di workbook resmi
  const [dateFormatMode, setDateFormatMode] = useState<'dmy' | 'serial' | 'calendar'>('dmy');
  const [copySuccess, setCopySuccess] = useState(false);

  // Local state for inline text date editing
  const [dateInputDrafts, setDateInputDrafts] = useState<Record<number, string>>({});

  // Active cell tracker for Excel Formula Bar (Default H6 dengan rumus =G6-G5 persis seperti di gambar pengguna!)
  const [activeCell, setActiveCell] = useState<{
    coord: string; // e.g. "H6"
    rowIdx: number;
    colKey: string;
    formula: string;
    isFormula: boolean;
  }>({
    coord: 'H6',
    rowIdx: 1, // Row index 1 = Row 6 di Excel (Data No 2)
    colKey: 'H',
    formula: '=G6-G5',
    isFormula: true
  });

  // Excel Audit modal
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditResult, setAuditResult] = useState<ReturnType<typeof validateUPTUPAgainstExcel> | null>(null);

  // Modal penjelasan logika perhitungan Total Hari Sebulan (31, 28, 35, 38, 30 hari)
  const [showLogicExplainerModal, setShowLogicExplainerModal] = useState(false);

  // Cutoff Periode Evaluasi KKP: 'auto' (default: periode berjalan terakhir yang berisi realisasi > 0), atau angka 1..12
  const [kkpCutoffMode, setKkpCutoffMode] = useState<'auto' | number>('auto');

  // Cari periode terakhir yang memiliki nilai transaksi / realisasi KKP > 0
  const latestFilledKkpPeriod = useMemo(() => {
    let last = 1;
    kkpRows.forEach((r, idx) => {
      if (Number(r.penggunaanKKP ?? 0) > 0) {
        last = idx + 1;
      }
    });
    return last;
  }, [kkpRows]);

  const effectiveKkpCutoff = useMemo(() => {
    if (kkpCutoffMode === 'auto') {
      return latestFilledKkpPeriod;
    }
    return kkpCutoffMode;
  }, [kkpCutoffMode, latestFilledKkpPeriod]);

  // Active calculations
  const tunaiResult = useMemo(() => calculateUPTUPTunai(tunaiRows), [tunaiRows]);
  const kkpResult = useMemo(() => calculateUPKKP(kkpRows, effectiveKkpCutoff), [kkpRows, effectiveKkpCutoff]);
  const kkpYearEndResult = useMemo(() => calculateUPKKP(kkpRows, 12), [kkpRows]);

  const valTunai = tunaiResult.rawValue; // Q28
  const valKKP = kkpResult.rawValue; // Nilai KKP pada periode cutoff aktif (misal Periode 04 = 110.00)
  const valKKPYearEnd = kkpYearEndResult.rawValue; // J16 (akhir tahun penuh)
  const rawCombined = calculateUPTUPCombinedRaw(valTunai, valKKP); // N7
  const finalCombined = calculateUPTUPCombinedFinal(valTunai, valKKP); // N8

  const [isValidationConfirmed, setIsValidationConfirmed] = useState(false);

  // Validasi otomatis data UP dan TUP Tunai & KKP
  const validationIssues = useMemo(() => {
    return validateUpTup(tunaiRows, kkpRows);
  }, [tunaiRows, kkpRows]);

  // Objek hasil indikator standar untuk kalkulasi & modal breakdown
  const indicatorResult: IndicatorResult = useMemo(() => {
    return project.output?.indicators.pengelolaanUPTUP || {
      weight: 10,
      rawValue: rawCombined,
      cappedValue: finalCombined,
      weightedValue: round2((finalCombined * 10) / 100),
      isActive: true,
      details: [
        { step: 'Komponen UP & TUP Tunai (Q28)', formulaHuman: '90% * Nilai Tunai', value: formatScore(valTunai) },
        { step: `Komponen UP KKP (s.d. Periode ${String(effectiveKkpCutoff).padStart(2, '0')})`, formulaHuman: '10% * Nilai KKP', value: formatScore(valKKP) },
        { step: 'Nilai Akhir Indikator (N8)', formulaHuman: 'ROUND(IF(N7>100, 100, (90%*Tunai)+(10%*KKP)), 2)', value: formatScore(finalCombined) }
      ]
    };
  }, [project.output, rawCombined, finalCombined, valTunai, valKKP, effectiveKkpCutoff]);

  // What-If Simulator state
  const [simKkpPeriod, setSimKkpPeriod] = useState<number>(12);
  const [simKkpUsage, setSimKkpUsage] = useState<number>(300000000);

  const [simGupPrevDate, setSimGupPrevDate] = useState<string>('2024-11-20');
  const [simGupDate, setSimGupDate] = useState<string>('2024-12-09');
  const [simGupAmount, setSimGupAmount] = useState<number>(60000000);
  const [simGupOutstanding, setSimGupOutstanding] = useState<number>(60000000);
  const [simGupDaysInMonth, setSimGupDaysInMonth] = useState<number>(30);

  const [simTupPagu, setSimTupPagu] = useState<number>(500000000);
  const [simTupSetoran, setSimTupSetoran] = useState<number>(50000000);

  // State untuk melacak baris mana yang sedang diedit manual kolom M (Total Hari Sebulan)
  const [editingDaysRow, setEditingDaysRow] = useState<number | null>(null);

  // Handlers for Tunai data updates
  const handleUpdateTunaiRow = (index: number, field: keyof UPTUPTunaiInput, val: any) => {
    const newRows = [...tunaiRows];
    let processedVal = val;
    if (field === 'tanggal') {
      processedVal = normalizeDateToIso(val);
    }
    newRows[index] = { ...newRows[index], [field]: processedVal };

    // Jika tanggal atau jenis diubah, perbarui otomatis selisih hari, status, dan hari sebulan
    if (field === 'tanggal' || field === 'jenis') {
      for (let i = index; i < newRows.length; i++) {
        let selisih = 0;
        if (i > 0 && newRows[i].jenis !== 'UP' && newRows[i].jenis !== 'TUP') {
          const prev = getPreviousRelevantTransaction(newRows, i);
          if (prev?.tanggal && newRows[i].tanggal) {
            selisih = getCalendarDaysDiff(prev.tanggal, newRows[i].tanggal);
          }
        }
        // Pertahankan angka khusus OM-SPAN (misal 35, 38, 40, 41) jika sudah terisi
        const existingDays = newRows[i].totalHariSebulan;
        const isOmSpanDays = existingDays === 35 || existingDays === 38 || existingDays === 40 || existingDays === 41;
        newRows[i] = {
          ...newRows[i],
          selisihHariKalender: selisih,
          // Otomatis tentukan status (<= 30 hari TEPAT WAKTU, > 30 hari TERLAMBAT, UP/TUP '-')
          status: determineAutoStatus(newRows[i].jenis, selisih, i),
          // Total hari sebulan otomatis (pertahankan jika angka khusus OM-SPAN)
          totalHariSebulan: isOmSpanDays ? existingDays : calculateAutoDaysInMonth(newRows, i)
        };
      }
    }

    onUpdateProject({ ...project, upTUPTunai: newRows });
  };

  // Auto-sinkronisasi Total Hari Sebulan OM-SPAN untuk baris yang masih menggunakan hari kalender baku (misal baris ke-6 bernilai 31, disesuaikan ke 38)
  useEffect(() => {
    if (!tunaiRows || tunaiRows.length === 0) return;
    let needsFix = false;
    for (let i = 0; i < tunaiRows.length; i++) {
      const r = tunaiRows[i];
      const expectedDays = calculateAutoDaysInMonth(tunaiRows, i);
      if (expectedDays === 38 && (r.totalHariSebulan === 31 || r.totalHariSebulan === 30)) {
        needsFix = true;
        break;
      }
      if (expectedDays === 35 && (r.totalHariSebulan === 28 || r.totalHariSebulan === 30)) {
        needsFix = true;
        break;
      }
    }
    if (needsFix) {
      const fixed = tunaiRows.map((r, i) => {
        const expectedDays = calculateAutoDaysInMonth(tunaiRows, i);
        if (expectedDays === 38 && (r.totalHariSebulan === 31 || r.totalHariSebulan === 30)) {
          return { ...r, totalHariSebulan: 38 };
        }
        if (expectedDays === 35 && (r.totalHariSebulan === 28 || r.totalHariSebulan === 30)) {
          return { ...r, totalHariSebulan: 35 };
        }
        return r;
      });
      onUpdateProject({ ...project, upTUPTunai: fixed });
    }
  }, [tunaiRows, project, onUpdateProject]);

  const handleSyncAllDaysInMonth = (forceStandardCalendar = false) => {
    const updated = tunaiRows.map((r, i) => {
      let selisih = 0;
      if (i > 0 && r.jenis !== 'UP' && r.jenis !== 'TUP') {
        const prev = getPreviousRelevantTransaction(tunaiRows, i);
        if (prev?.tanggal && r.tanggal) {
          selisih = getCalendarDaysDiff(prev.tanggal, r.tanggal);
        } else {
          selisih = r.selisihHariKalender;
        }
      }
      
      const totalHari = forceStandardCalendar
        ? (i === 0 || r.jenis === 'UP' || r.jenis === 'TUP' ? 0 : getDaysInMonthFromDateString(r.tanggal || ''))
        : calculateAutoDaysInMonth(tunaiRows, i);

      return {
        ...r,
        selisihHariKalender: selisih,
        status: determineAutoStatus(r.jenis, selisih, i),
        totalHariSebulan: totalHari
      };
    });
    onUpdateProject({ ...project, upTUPTunai: updated });
  };

  const handleAddTunaiRow = () => {
    const lastRow = tunaiRows[tunaiRows.length - 1];
    const nextNo = (lastRow?.no || tunaiRows.length) + 1;
    const effKodeSatker = project.metadata?.kodeSatker || lastRow?.kodeSatker || '';
    const effNamaSatker = (project.metadata?.namaSatker && project.metadata.namaSatker !== 'Simulasi Mandiri')
      ? project.metadata.namaSatker
      : (lastRow?.namaSatker || '');
    const effKodeKPPN = project.metadata?.kodeKPPN || lastRow?.kodeKPPN || '026';

    const todayIso = new Date().toISOString().split('T')[0];
    let selisih = 0;
    if (lastRow?.tanggal) {
      selisih = getCalendarDaysDiff(lastRow.tanggal, todayIso);
    }

    const newRow: UPTUPTunaiInput = {
      no: nextNo,
      kodeSatker: effKodeSatker,
      namaSatker: effNamaSatker,
      kodeKPPN: effKodeKPPN,
      sumberDana: 'RM',
      jenis: 'GUP',
      tanggal: todayIso,
      selisihHariKalender: selisih,
      totalGUP: 0,
      totalOutstandingUP: lastRow?.totalOutstandingUP || 0,
      totalHariSebulan: 30,
      totalTUP: 0,
      totalSetoranTUP: 0,
      status: determineAutoStatus('GUP', selisih, tunaiRows.length)
    };
    const updatedWithNew = [...tunaiRows, newRow];
    newRow.totalHariSebulan = calculateAutoDaysInMonth(updatedWithNew, updatedWithNew.length - 1);
    onUpdateProject({ ...project, upTUPTunai: updatedWithNew });
  };

  const handleDeleteTunaiRow = (index: number) => {
    const updated = tunaiRows.filter((_, i) => i !== index).map((r, i) => ({ ...r, no: i + 1 }));
    const hasKKPActive = kkpRows.some(k => (Number(k.upKKPPerBulan) || 0) > 0 || (Number(k.penggunaanKKP) || 0) > 0);
    const stillHasData = updated.length > 0 || hasKKPActive;
    onUpdateProject({
      ...project,
      upTUPTunai: updated,
      activeIndicators: {
        ...project.activeIndicators,
        pengelolaanUPTUP: stillHasData ? (project.activeIndicators?.pengelolaanUPTUP ?? true) : false
      }
    });
  };

  // Toggle apakah indikator Pengelolaan UP dan TUP diperhitungkan (10%) atau Tidak Diperhitungkan (N/A)
  const handleToggleActiveIndicator = () => {
    const hasTunai = tunaiRows.length > 0;
    const hasKKP = kkpRows.some(k => (Number(k.upKKPPerBulan) || 0) > 0 || (Number(k.penggunaanKKP) || 0) > 0);
    const isCurrentlyActive = (project.activeIndicators?.pengelolaanUPTUP !== false) && (hasTunai || hasKKP);
    if (isCurrentlyActive) {
      onUpdateProject({
        ...project,
        activeIndicators: {
          ...project.activeIndicators,
          pengelolaanUPTUP: false
        }
      });
    } else {
      onUpdateProject({
        ...project,
        activeIndicators: {
          ...project.activeIndicators,
          pengelolaanUPTUP: true
        }
      });
    }
  };

  const handleResetToWorkbookTemplate = () => {
    const defaultKodeSatker = project.metadata?.kodeSatker || '';
    const defaultNamaSatker = (project.metadata?.namaSatker && project.metadata.namaSatker !== 'Simulasi Mandiri')
      ? project.metadata.namaSatker
      : '';
    const defaultKodeKPPN = project.metadata?.kodeKPPN || '026';

    const templateTunai: UPTUPTunaiInput[] = DEFAULT_EXCEL_UP_TUNAI_ROWS.map((u: any) => ({
      no: u.id,
      kodeSatker: defaultKodeSatker || u.kodeSatker || '',
      namaSatker: defaultNamaSatker || u.namaSatker || '',
      kodeKPPN: defaultKodeKPPN || u.kodeKPPN || '026',
      sumberDana: u.sumberDana || 'RM',
      jenis: u.jenis,
      tanggal: u.tanggal,
      selisihHariKalender: u.selisihHariKalender,
      totalGUP: u.totalGu,
      totalOutstandingUP: u.totalOutstandingUp,
      totalHariSebulan: u.totalHariSebulan,
      totalTUP: u.totalTup,
      totalSetoranTUP: u.totalSetoranTup,
      status: u.status
    }));

    const templateKKP: UPTUPKKPInput[] = DEFAULT_EXCEL_UP_KKP_ROWS.map((kp: any) => ({
      periode: kp.periode,
      kodeSatker: defaultKodeSatker || kp.kodeSatker || '',
      namaSatker: defaultNamaSatker || kp.namaSatker || '',
      kodeKPPN: defaultKodeKPPN || kp.kodeKPPN || '026',
      upKKPPerBulan: kp.upKkpPerBulan,
      penggunaanKKP: kp.penggunaanKkp
    }));

    onUpdateProject({
      ...project,
      upTUPTunai: templateTunai,
      upTUPKKP: templateKKP,
      activeIndicators: {
        ...project.activeIndicators,
        pengelolaanUPTUP: true
      }
    });

    setActiveCell({
      coord: 'J5',
      rowIdx: 2,
      colKey: 'J',
      formula: '300000000',
      isFormula: false
    });
  };

  // Kosongkan seluruh data transaksi UP Tunai dan KKP
  const handleClearForm = () => {
    if (window.confirm('Kosongkan formulir Pengelolaan UP dan TUP? Seluruh baris transaksi UP Tunai dan data penggunaan KKP akan dihapus/di-nol-kan dan indikator ini akan dijadikan N/A (tidak diperhitungkan).')) {
      const defaultKodeSatker = project.metadata?.kodeSatker || '';
      const defaultNamaSatker = (project.metadata?.namaSatker && project.metadata.namaSatker !== 'Simulasi Mandiri')
        ? project.metadata.namaSatker
        : '';
      const defaultKodeKPPN = project.metadata?.kodeKPPN || '026';

      const emptyKKP: UPTUPKKPInput[] = Array.from({ length: 12 }, (_, i) => ({
        periode: String(i + 1).padStart(2, '0'),
        kodeSatker: defaultKodeSatker,
        namaSatker: defaultNamaSatker,
        kodeKPPN: defaultKodeKPPN,
        upKKPPerBulan: 0,
        penggunaanKKP: 0
      }));

      onUpdateProject({
        ...project,
        upTUPTunai: [],
        upTUPKKP: emptyKKP,
        activeIndicators: {
          ...project.activeIndicators,
          pengelolaanUPTUP: false
        }
      });
    }
  };

  // Handlers for KKP data updates
  const handleUpdateKkpUsage = (periodIndex: number, usage: number) => {
    const newKkp = [...kkpRows];
    if (newKkp[periodIndex]) {
      newKkp[periodIndex] = { ...newKkp[periodIndex], penggunaanKKP: Math.max(0, usage) };
      onUpdateProject({ ...project, upTUPKKP: newKkp });
    }
  };

  const handleUpdateKkpPaguPerBulan = (val: number) => {
    const positiveVal = Math.max(0, val);
    const newKkp = kkpRows.map(r => ({ ...r, upKKPPerBulan: positiveVal }));
    onUpdateProject({ ...project, upTUPKKP: newKkp });
  };

  const handleLoadSample651011 = () => {
    const sampleRealizations: Record<number, number> = {
      1: 0,
      2: 11377742,
      3: 32723244,
      4: 47150035,
      5: 62541583,
      6: 71595768,
      7: 81997452,
      8: 81997452,
      9: 81997452,
      10: 81997452,
      11: 81997452,
      12: 81997452,
    };
    const newKkp = kkpRows.map((r, idx) => ({
      ...r,
      kodeSatker: '651011',
      namaSatker: 'BIDPROPAM POLDA JATENG',
      upKKPPerBulan: 14000000,
      penggunaanKKP: sampleRealizations[idx + 1] ?? 0
    }));
    onUpdateProject({ ...project, upTUPKKP: newKkp });
  };

  // Run audit test
  const handleRunAudit = () => {
    const res = validateUPTUPAgainstExcel();
    setAuditResult(res);
    setShowAuditModal(true);
  };

  // Copy table TSV for Excel pasting
  const handleCopyTableToExcel = () => {
    const headers = [
      'No', 'Kode Satker', 'Nama Satker', 'Kode KPPN', 'Sumber Dana', 'Jenis', 'Tanggal',
      'Selisih Hari Kalender', 'Total Gu', 'Total Outstanding UP', 'Persen', 'Status',
      'Total hari Sebulan', 'Persen GUP Disebulankan', 'Total TUP', 'Total Setoran TUP',
      'Nilai Ketepatan Waktu', 'Nilai Persentase GUP Disebulankan', 'Nilai Setoran TUP'
    ].join('\t');

    const body = tunaiResult.processedRows.map(r => {
      return [
        r.no,
        r.kodeSatker,
        r.namaSatker,
        r.kodeKPPN,
        r.sumberDana,
        r.jenis,
        formatDisplayDate(r.tanggal, dateFormatMode),
        r.selisihHariKalender || '-',
        r.totalGU,
        r.totalOutstandingUP,
        r.persen > 0 ? r.persen.toFixed(2) : '-',
        r.status,
        r.totalHariSebulan,
        r.persenGupDisebulankan !== null ? r.persenGupDisebulankan.toFixed(2) : '-',
        r.totalTUP,
        r.totalSetoranTUP,
        r.nilaiKetepatanWaktu,
        r.nilaiPersentaseGupDisebulankan !== null ? r.nilaiPersentaseGupDisebulankan.toFixed(2) : '-',
        r.nilaiSetoranTup.toFixed(2)
      ].join('\t');
    }).join('\n');

    const footers = [
      `\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tNilai Komponen\t${tunaiResult.nilaiKetepatanWaktu.toFixed(2)}\t${tunaiResult.nilaiGupDisebulankan.toFixed(2)}\t${tunaiResult.nilaiSetoranTup.toFixed(2)}`,
      `\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tNilai UP TUP Tunai\t${valTunai.toFixed(2)}`
    ].join('\n');

    const fullTsv = `${headers}\n${body}\n${footers}`;
    navigator.clipboard.writeText(fullTsv).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // What-if simulator calculations
  const simGupDays = useMemo(() => {
    return getCalendarDaysDiff(simGupPrevDate, simGupDate);
  }, [simGupPrevDate, simGupDate]);

  const simGupPersen = useMemo(() => {
    if (simGupOutstanding <= 0) return 0;
    return round2((simGupAmount / simGupOutstanding) * 100);
  }, [simGupAmount, simGupOutstanding]);

  const simGupDisebulankan = useMemo(() => {
    if (simGupDays <= 0) return 100;
    const raw = (simGupPersen * simGupDaysInMonth) / simGupDays;
    return round2(Math.min(100, raw));
  }, [simGupPersen, simGupDaysInMonth, simGupDays]);

  const simGupStatus = simGupDays <= 30 ? 'TEPAT WAKTU' : 'TERLAMBAT';
  const simGupScoreKetepatan = simGupStatus === 'TEPAT WAKTU' ? 100 : 0;

  const simTupPersenSetoran = useMemo(() => {
    if (simTupPagu <= 0) return 0;
    return round2((simTupSetoran / simTupPagu) * 100);
  }, [simTupSetoran, simTupPagu]);

  const simTupScore = useMemo(() => {
    if (simTupSetoran === 0 || simTupPagu <= 0) return 100;
    return round2(100 - (simTupSetoran / simTupPagu * 100));
  }, [simTupSetoran, simTupPagu]);

  const simKkpTargetNominal = useMemo(() => {
    const pBulan = kkpRows[0]?.upKKPPerBulan || 20000000;
    const pTahun = pBulan * 12;
    const targetPct = KKP_TARGET_PERCENT[simKkpPeriod] || 0.125;
    return pTahun * targetPct;
  }, [kkpRows, simKkpPeriod]);

  const simKkpScore = useMemo(() => {
    if (simKkpUsage === 0) return 0;
    if (simKkpUsage >= simKkpTargetNominal) return 110;
    return 100;
  }, [simKkpUsage, simKkpTargetNominal]);

  // Diagnosis data
  const lateTransactions = tunaiResult.processedRows.filter(r => r.status === 'TERLAMBAT');
  const achievedKkpMonths = kkpResult.processedMonths.filter(m => m.isAchieved);

  return (
    <div className="space-y-6 animate-fade-in" id="uptup-tab-container">
      {/* 1. Header Summary Card (Indikator 6 IKPA) */}
      <div className={`rounded-2xl border p-5 shadow-xs transition-all ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Indikator 6 IKPA • Bobot 10%
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Sel Excel: N8
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                PER-5/PB/2024 Slide 30-34
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              Detail Indikator UP dan TUP Tunai &amp; KKP
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Tabel spreadsheet interaktif dengan struktur sel A s.d. S persis seperti workbook Excel resmi.
              Kolom Putih dapat diisi Satker, sedangkan Kolom Hijau otomatis terisi sesuai formula PER-5/PB/2024.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <IndikatorCalculateButton
              indicatorKey="pengelolaanUPTUP"
              indicatorName="Pengelolaan UP dan TUP"
              weight={10}
              indicatorResult={indicatorResult}
              validationIssues={validationIssues}
              satkerName={project.metadata?.namaSatker || project.name}
              isDark={isDark}
            />

            <button
              onClick={() => onOpenInspector(
                'Indikator Pengelolaan UP dan TUP',
                'N8',
                '=ROUND(IF(N7>100, 100, IF(N6=0, (90%*N5/90%), (N5*90%)+(10%*N6))), 2)',
                finalCombined.toFixed(2),
                project.output?.indicators.pengelolaanUPTUP?.details || []
              )}
              className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs"
              id="uptup-formula-inspector-btn"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Formula Inspector</span>
            </button>

            <button
              onClick={handleRunAudit}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
              id="uptup-excel-audit-btn"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Uji Kesesuaian Excel (21 Poin)</span>
            </button>
          </div>
        </div>

        {/* 4 Key Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Nilai UP/TUP Tunai (Q28)</span>
              <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                Bobot 90%
              </span>
            </span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {formatScore(valTunai)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1 flex justify-between">
              <span>Ketepatan: {formatScore(tunaiResult.nilaiKetepatanWaktu)}</span>
              <span>GUP: {formatScore(tunaiResult.nilaiGupDisebulankan)}</span>
              <span>TUP: {formatScore(tunaiResult.nilaiSetoranTup)}</span>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Nilai UP KKP (J16)</span>
              <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded">
                Bobot 10%
              </span>
            </span>
            <div className="text-xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1.5">
              {formatScore(valKKP)}
              {valKKP >= 100 && (
                <span className="text-[9px] font-sans font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600">
                  {valKKP === 110 ? 'Reward 110' : 'Aktif 100'}
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1 flex justify-between">
              <span>Pagu/Bln: {formatRupiah(kkpRows[0]?.upKKPPerBulan || 20000000)}</span>
              <span>Capai: {achievedKkpMonths.length}/12 Bln</span>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Nilai Gabungan (N7)</span>
              <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">
                Uncapped
              </span>
            </span>
            <div className="text-xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
              {formatScore(rawCombined)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              (90% × {formatScore(valTunai)}) + (10% × {formatScore(valKKP)})
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
              <span>Nilai Akhir Indikator (N8)</span>
              <span className="font-mono text-[10px] text-emerald-800 dark:text-emerald-200 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded">
                Capped 100
              </span>
            </span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {formatScore(finalCombined)}
            </div>
            <div className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-mono mt-1 flex justify-between">
              <span>Nilai Berbobot (10%):</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatScore(round2((finalCombined * 10) / 100))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Validasi Data Input */}
      <IndikatorValidationBanner
        indicatorName="Pengelolaan UP dan TUP"
        issues={validationIssues}
        isConfirmed={isValidationConfirmed}
        onToggleConfirm={() => setIsValidationConfirmed(!isValidationConfirmed)}
        isDark={isDark}
      />

      {/* Petunjuk Pengisian & Cara Menggunakan */}
      <PetunjukPengisianCard
        indicatorId="up-tup"
        isDark={isDark}
        defaultExpanded={true}
      />

      {/* Status Penilaian Indikator (Diperhitungkan / N/A) */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
        (project.activeIndicators?.pengelolaanUPTUP !== false && (tunaiRows.length > 0 || kkpRows.some(k => (Number(k.upKKPPerBulan) || 0) > 0 || (Number(k.penggunaanKKP) || 0) > 0)))
          ? (isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs')
          : (isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-amber-50/90 border-amber-200 text-amber-900 shadow-xs')
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={`p-2 rounded-xl mt-0.5 sm:mt-0 ${
            (project.activeIndicators?.pengelolaanUPTUP !== false && (tunaiRows.length > 0 || kkpRows.some(k => (Number(k.upKKPPerBulan) || 0) > 0 || (Number(k.penggunaanKKP) || 0) > 0)))
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-amber-500/15 text-amber-600'
          }`}>
            {(project.activeIndicators?.pengelolaanUPTUP !== false && (tunaiRows.length > 0 || kkpRows.some(k => (Number(k.upKKPPerBulan) || 0) > 0 || (Number(k.penggunaanKKP) || 0) > 0))) ? (
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
                (project.activeIndicators?.pengelolaanUPTUP !== false && (tunaiRows.length > 0 || kkpRows.some(k => (Number(k.upKKPPerBulan) || 0) > 0 || (Number(k.penggunaanKKP) || 0) > 0)))
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
              }`}>
                {(project.activeIndicators?.pengelolaanUPTUP !== false && (tunaiRows.length > 0 || kkpRows.some(k => (Number(k.upKKPPerBulan) || 0) > 0 || (Number(k.penggunaanKKP) || 0) > 0)))
                  ? '✓ DIPERHITUNGKAN (Bobot 10%)'
                  : '⊘ TIDAK DIPERHITUNGKAN / N/A (Bobot 0%)'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {(project.activeIndicators?.pengelolaanUPTUP !== false && (tunaiRows.length > 0 || kkpRows.some(k => (Number(k.upKKPPerBulan) || 0) > 0 || (Number(k.penggunaanKKP) || 0) > 0)))
                ? `Terdapat ${tunaiRows.length} transaksi UP Tunai aktif dan data KKP. Indikator ini diperhitungkan dalam total IKPA.`
                : 'Indikator ini tidak memiliki transaksi UP/KKP atau dinonaktifkan. Nilai akhir IKPA satker dinormalkan via Konversi Bobot (O6) sehingga tidak mengurangi nilai akhir.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleToggleActiveIndicator}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow-2xs cursor-pointer ${
              (project.activeIndicators?.pengelolaanUPTUP !== false && (tunaiRows.length > 0 || kkpRows.some(k => (Number(k.upKKPPerBulan) || 0) > 0 || (Number(k.penggunaanKKP) || 0) > 0)))
                ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300'
                : 'border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {(project.activeIndicators?.pengelolaanUPTUP !== false && (tunaiRows.length > 0 || kkpRows.some(k => (Number(k.upKKPPerBulan) || 0) > 0 || (Number(k.penggunaanKKP) || 0) > 0)))
              ? 'Jadikan N/A (Nonaktifkan)'
              : 'Aktifkan Kembali Indikator'}
          </button>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSection('tunai')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'tunai'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            id="uptup-tab-tunai-btn"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Tabel Excel UP &amp; TUP Tunai (Kolom A-S)</span>
          </button>

          <button
            onClick={() => setActiveSection('kkp')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'kkp'
                ? 'bg-purple-600 text-white shadow-xs'
                : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            id="uptup-tab-kkp-btn"
          >
            <CreditCard className="w-4 h-4" />
            <span>UP KKP (12 Periode • Slide 32-34)</span>
          </button>

          <button
            onClick={() => setActiveSection('simulator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'simulator'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            id="uptup-tab-simulator-btn"
          >
            <Sliders className="w-4 h-4" />
            <span>Simulator "Jika" (What-If)</span>
          </button>

          <button
            onClick={() => setActiveSection('diagnosis')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'diagnosis'
                ? 'bg-blue-600 text-white shadow-xs'
                : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            id="uptup-tab-diagnosis-btn"
          >
            <Activity className="w-4 h-4" />
            <span>Diagnosis &amp; Rekomendasi</span>
          </button>
        </div>

        {activeSection === 'tunai' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Format Toggle */}
            <div className="flex items-center rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                onClick={() => setDateFormatMode('dmy')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  dateFormatMode === 'dmy'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Format tanggal standar Excel resmi: DD/MM/YYYY (contoh: 30/01/2024)"
              >
                DD/MM/YYYY (30/01/2024)
              </button>
              <button
                onClick={() => setDateFormatMode('calendar')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  dateFormatMode === 'calendar'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Format standar ISO: YYYY-MM-DD"
              >
                Kalender (YYYY-MM-DD)
              </button>
              <button
                onClick={() => setDateFormatMode('serial')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  dateFormatMode === 'serial'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Nomor Seri Excel (contoh: 45321)"
              >
                Serial Excel (45321)
              </button>
            </div>

            <button
              onClick={handleCopyTableToExcel}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
              title="Salin tabel ke clipboard (dapat langsung dipaste ke Microsoft Excel)"
            >
              {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copySuccess ? 'Tersalin!' : 'Salin Excel'}</span>
            </button>

            <button
              onClick={handleResetToWorkbookTemplate}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
              title="Reset ke data template 22 baris Excel acuan"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              <span>Reset 22 Baris Acuan</span>
            </button>

            <button
              onClick={handleClearForm}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 flex items-center gap-1 cursor-pointer"
              title="Kosongkan seluruh data transaksi UP Tunai dan target KKP"
            >
              <Eraser className="w-3.5 h-3.5 text-rose-500" />
              <span>Kosongkan Formulir</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: TABEL EXCEL DETAIL INDIKATOR UP DAN TUP TUNAI                  */}
      {/* ========================================================================= */}
      {activeSection === 'tunai' && (
        <div className="space-y-3">
          {/* Excel Formula Bar Interactive (Persis seperti tampilan Excel di gambar pengguna) */}
          <div className={`rounded-xl border p-2 flex items-center gap-2 shadow-xs font-mono text-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-300'
          }`}>
            {/* Name Box (Koordinat Sel, e.g. J5) */}
            <div className={`w-16 px-2.5 py-1 rounded-md text-center font-bold border ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800 shadow-2xs'
            }`}>
              {activeCell.coord}
            </div>

            {/* Formula Controls: Cancel (X), Accept (Check), Function (fx) */}
            <div className="flex items-center gap-1 text-slate-400 border-r border-slate-300 dark:border-slate-700 pr-2">
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] font-bold text-rose-500"
                title="Batal"
              >
                ✕
              </button>
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] font-bold text-emerald-600"
                title="Terapkan"
              >
                ✓
              </button>
              <span className="font-serif italic font-bold text-slate-500 px-1 text-xs">
                fx
              </span>
            </div>

            {/* Formula / Value Text Display */}
            <div className="flex-1 overflow-x-auto whitespace-nowrap px-2 py-0.5 text-slate-800 dark:text-slate-200 font-mono text-xs">
              {activeCell.formula}
            </div>

            <button
              onClick={handleAddTunaiRow}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-sans font-bold flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
              id="uptup-add-row-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris</span>
            </button>
          </div>

          {/* Banner Informasi Logika OM-SPAN */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/25 p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
              <div>
                <span className="font-bold">Logika Perhitungan OM-SPAN Otomatis:</span>{' '}
                <span className="text-emerald-800 dark:text-emerald-300">
                  Status otomatis diisi <strong>TEPAT WAKTU</strong> jika selisih ≤ 30 hari. Total hari sebulan otomatis menyesuaikan siklus revolving OM-SPAN (misal <strong>35 hari</strong> pada baris 4, <strong>38 hari</strong> pada baris 5 dan 6, serta <strong>30 hari</strong> pada baris berikutnya) sehingga persentase GUP terhitung <strong>100%</strong> dan nilai IKPA maksimal. Seluruh baris transaksi Anda tetap aman tanpa ter-reset.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLogicExplainerModal(true)}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-102 self-end md:self-auto"
              title="Klik untuk melihat panduan & logika perhitungan hari OM-SPAN (kenapa muncul 31, 28, 35, 38, dan 30 hari)"
            >
              <AlertCircle className="w-4 h-4 text-amber-100" />
              <span>Logika Perhitungan (31, 28, 35, 38 Hari)</span>
            </button>
          </div>

          {/* Excel Spreadsheet Container */}
          <div className={`rounded-xl border overflow-hidden shadow-sm ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
          }`}>
            {/* Sheet Title Bar */}
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-sans tracking-wide">
                  Detail Indikator UP dan TUP Tunai
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-sans font-medium flex items-center gap-1 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Tersimpan Otomatis
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSyncAllDaysInMonth(false)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-[11px] font-sans font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                  title="Sinkronkan status ketepatan waktu otomatis (<= 30 hari TEPAT WAKTU, > 30 hari TERLAMBAT) dengan mempertahankan angka OM-SPAN (seperti 35 & 38)"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-600" />
                  <span>Sinkronkan Status (Logika OM-SPAN)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSyncAllDaysInMonth(true)}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-sans font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                  title="Hitung ulang total hari sebulan berdasarkan kalender murni PER-5 (Jan=31, Feb=28, Mar=31, dst.)"
                >
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Kalender Baku</span>
                </button>

                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {tunaiResult.processedRows.length} Baris Transaksi
                </span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[700px] scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse font-mono">
                {/* Row 1: Excel Column Letter Headers (A s.d. S) */}
                <thead className={`border-b text-[10px] uppercase tracking-wider select-none ${
                  isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-200/80 text-slate-600 border-slate-300'
                }`}>
                  <tr>
                    <th className="w-10 px-2 py-1 text-center font-normal border-r border-slate-300 dark:border-slate-800"></th>
                    <th className="px-2 py-1 text-center border-r border-slate-300 dark:border-slate-800 font-semibold">A</th>
                    <th className="px-2 py-1 text-center border-r border-slate-300 dark:border-slate-800 font-semibold">B</th>
                    <th className="px-2 py-1 text-center border-r border-slate-300 dark:border-slate-800 font-semibold">C</th>
                    <th className="px-2 py-1 text-center border-r border-slate-300 dark:border-slate-800 font-semibold">D</th>
                    <th className="px-2 py-1 text-center border-r border-slate-300 dark:border-slate-800 font-semibold">E</th>
                    <th className="px-2 py-1 text-center border-r border-slate-300 dark:border-slate-800 font-semibold">F</th>
                    <th className="px-2 py-1 text-center border-r border-slate-300 dark:border-slate-800 font-semibold">G</th>
                    {/* Kolom Hijau */}
                    <th className="px-2 py-1 text-center border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold">H</th>
                    <th className="px-2 py-1 text-center border-r border-slate-300 dark:border-slate-800 font-semibold">I</th>
                    <th className="px-2 py-1 text-center border-r border-slate-300 dark:border-slate-800 font-semibold">J</th>
                    {/* Kolom Hijau */}
                    <th className="px-2 py-1 text-center border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold">K</th>
                    <th className="px-2 py-1 text-center border-r border-slate-300 dark:border-slate-800 font-semibold">L</th>
                    <th className="px-2 py-1 text-center border-r border-slate-300 dark:border-slate-800 font-semibold">M</th>
                    {/* Kolom Hijau */}
                    <th className="px-2 py-1 text-center border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold">N</th>
                    {/* Kolom Hijau */}
                    <th className="px-2 py-1 text-center border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold">O</th>
                    <th className="px-2 py-1 text-center border-r border-slate-300 dark:border-slate-800 font-semibold">P</th>
                    {/* Kolom Hijau */}
                    <th className="px-2 py-1 text-center border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold">Q</th>
                    {/* Kolom Hijau */}
                    <th className="px-2 py-1 text-center border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold">R</th>
                    {/* Kolom Hijau */}
                    <th className="px-2 py-1 text-center border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold">S</th>
                    <th className="w-10 px-2 py-1 text-center font-normal">Aksi</th>
                  </tr>

                  {/* Row 2: Header Titles (Persis nama kolom di Excel) */}
                  <tr className={`border-b text-[11px] font-bold font-sans ${
                    isDark ? 'bg-slate-900/90 text-slate-200 border-slate-800' : 'bg-slate-100 text-slate-800 border-slate-300'
                  }`}>
                    <th className="px-2 py-2.5 text-center text-slate-400 font-mono border-r border-slate-300 dark:border-slate-800">2</th>
                    <th className="px-2.5 py-2.5 border-r border-slate-300 dark:border-slate-800 whitespace-nowrap">No.</th>
                    <th className="px-2.5 py-2.5 border-r border-slate-300 dark:border-slate-800 whitespace-nowrap">Kode Satker</th>
                    <th className="px-2.5 py-2.5 border-r border-slate-300 dark:border-slate-800 whitespace-nowrap">Nama Satker</th>
                    <th className="px-2.5 py-2.5 border-r border-slate-300 dark:border-slate-800 whitespace-nowrap">Kode KPPN</th>
                    <th className="px-2.5 py-2.5 border-r border-slate-300 dark:border-slate-800 whitespace-nowrap">Sumber Dana</th>
                    <th className="px-2.5 py-2.5 border-r border-slate-300 dark:border-slate-800 whitespace-nowrap">Jenis</th>
                    <th className="px-2.5 py-2.5 border-r border-slate-300 dark:border-slate-800 whitespace-nowrap">Tanggal</th>
                    {/* H (Hijau) */}
                    <th className="px-2.5 py-2.5 text-center border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 whitespace-nowrap">
                      Selisih Hari Kalender
                    </th>
                    <th className="px-3 py-2.5 text-right border-r border-slate-300 dark:border-slate-800 whitespace-nowrap">Total Gu</th>
                    <th className="px-3 py-2.5 text-right border-r border-slate-300 dark:border-slate-800 whitespace-nowrap">Total Outstanding UP</th>
                    {/* K (Hijau) */}
                    <th className="px-2.5 py-2.5 text-right border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 whitespace-nowrap">
                      Persen
                    </th>
                    <th className="px-3 py-2.5 text-center border-r border-slate-300 dark:border-slate-800 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 cursor-help" title="Status Ketepatan Waktu: Otomatis TEPAT WAKTU jika selisih <= 30 hari, dan TERLAMBAT jika selisih > 30 hari. Anda juga dapat memilih manual melalui dropdown.">
                        <span>Status</span>
                        <Info className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                      </div>
                    </th>
                    <th className="px-2.5 py-2.5 text-center border-r border-slate-300 dark:border-slate-800 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setShowLogicExplainerModal(true)}
                        className="flex items-center justify-center gap-1.5 w-full cursor-pointer group select-none"
                        title="Klik tombol pentung ini untuk melihat panduan & penjelasan logika perhitungan hari (31, 28, 35, 38, 30 hari)"
                      >
                        <span className="group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Total hari Sebulan</span>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 transition-transform group-hover:scale-110 shadow-2xs">
                          <AlertCircle className="w-3 h-3" />
                        </span>
                      </button>
                    </th>
                    {/* N (Hijau) */}
                    <th className="px-2.5 py-2.5 text-right border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 whitespace-nowrap">
                      Persen GUP Disebulankan
                    </th>
                    {/* O (Hijau) */}
                    <th className="px-3 py-2.5 text-right border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 whitespace-nowrap">
                      Total TUP
                    </th>
                    <th className="px-3 py-2.5 text-right border-r border-slate-300 dark:border-slate-800 whitespace-nowrap">Total Setoran TUP</th>
                    {/* Q (Hijau) */}
                    <th className="px-2.5 py-2.5 text-center border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 whitespace-nowrap">
                      Nilai Ketepatan Waktu
                    </th>
                    {/* R (Hijau) */}
                    <th className="px-2.5 py-2.5 text-right border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 whitespace-nowrap">
                      Nilai Persentase GUP Disebulankan
                    </th>
                    {/* S (Hijau) */}
                    <th className="px-2.5 py-2.5 text-right border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 whitespace-nowrap">
                      Nilai Setoran TUP
                    </th>
                    <th className="px-2 py-2.5 text-center"></th>
                  </tr>
                </thead>

                {/* Table Body (Data Rows 3..24 di Excel) */}
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-[11px]">
                  {tunaiResult.processedRows.map((r, idx) => {
                    const excelRowNumber = idx + 3; // Row 1 = Title, Row 2 = Header, Row 3 = Data No 1
                    const isRowLate = r.status === 'TERLAMBAT';

                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isRowLate
                            ? 'bg-rose-50/40 dark:bg-rose-950/20'
                            : isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Excel Row Number */}
                        <td className={`px-2 py-1.5 text-center select-none text-slate-400 border-r border-slate-300 dark:border-slate-800 ${
                          isDark ? 'bg-slate-900/60' : 'bg-slate-100/70'
                        }`}>
                          {excelRowNumber}
                        </td>

                        {/* A: No */}
                        <td
                          onClick={() => setActiveCell({ coord: `A${excelRowNumber}`, rowIdx: idx, colKey: 'A', formula: String(r.no), isFormula: false })}
                          className={`px-2.5 py-1.5 text-center border-r border-slate-300 dark:border-slate-800 cursor-pointer ${
                            activeCell.coord === `A${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          {r.no}
                        </td>

                        {/* B: Kode Satker (Kolom Putih) */}
                        <td
                          onClick={() => setActiveCell({ coord: `B${excelRowNumber}`, rowIdx: idx, colKey: 'B', formula: r.kodeSatker || project.metadata?.kodeSatker || '', isFormula: false })}
                          className={`px-2.5 py-1.5 border-r border-slate-300 dark:border-slate-800 cursor-pointer ${
                            activeCell.coord === `B${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          <input
                            type="text"
                            value={r.kodeSatker || project.metadata?.kodeSatker || ''}
                            onChange={e => handleUpdateTunaiRow(idx, 'kodeSatker', e.target.value)}
                            className="w-16 bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-[11px] font-mono font-medium text-slate-800 dark:text-slate-100"
                            placeholder={project.metadata?.kodeSatker || "-"}
                          />
                        </td>

                        {/* C: Nama Satker (Kolom Putih) */}
                        <td
                          onClick={() => setActiveCell({ coord: `C${excelRowNumber}`, rowIdx: idx, colKey: 'C', formula: r.namaSatker || (project.metadata?.namaSatker !== 'Simulasi Mandiri' ? project.metadata?.namaSatker : '') || '', isFormula: false })}
                          className={`px-2.5 py-1.5 border-r border-slate-300 dark:border-slate-800 cursor-pointer ${
                            activeCell.coord === `C${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          <input
                            type="text"
                            value={r.namaSatker || (project.metadata?.namaSatker !== 'Simulasi Mandiri' ? project.metadata?.namaSatker : '') || ''}
                            onChange={e => handleUpdateTunaiRow(idx, 'namaSatker', e.target.value)}
                            className="w-36 bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-[11px] font-medium text-slate-800 dark:text-slate-100 truncate"
                            placeholder={project.metadata?.namaSatker || "-"}
                            title={r.namaSatker || project.metadata?.namaSatker || ''}
                          />
                        </td>

                        {/* D: Kode KPPN (Kolom Putih) */}
                        <td
                          onClick={() => setActiveCell({ coord: `D${excelRowNumber}`, rowIdx: idx, colKey: 'D', formula: r.kodeKPPN || project.metadata?.kodeKPPN || '026', isFormula: false })}
                          className={`px-2.5 py-1.5 border-r border-slate-300 dark:border-slate-800 cursor-pointer ${
                            activeCell.coord === `D${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          <input
                            type="text"
                            value={r.kodeKPPN || project.metadata?.kodeKPPN || '026'}
                            onChange={e => handleUpdateTunaiRow(idx, 'kodeKPPN', e.target.value)}
                            className="w-14 bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-[11px] font-mono font-medium text-slate-800 dark:text-slate-100"
                            placeholder="026"
                          />
                        </td>

                        {/* E: Sumber Dana (Kolom Putih) */}
                        <td
                          onClick={() => setActiveCell({ coord: `E${excelRowNumber}`, rowIdx: idx, colKey: 'E', formula: r.sumberDana || 'RM', isFormula: false })}
                          className={`px-2.5 py-1.5 border-r border-slate-300 dark:border-slate-800 cursor-pointer ${
                            activeCell.coord === `E${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          <select
                            value={r.sumberDana}
                            onChange={e => handleUpdateTunaiRow(idx, 'sumberDana', e.target.value)}
                            className="bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-[11px] font-bold cursor-pointer"
                          >
                            <option value="RM">RM</option>
                            <option value="PNBP">PNBP</option>
                            <option value="BLU">BLU</option>
                            <option value="PLN">PLN</option>
                          </select>
                        </td>

                        {/* F: Jenis (Kolom Putih) */}
                        <td
                          onClick={() => setActiveCell({ coord: `F${excelRowNumber}`, rowIdx: idx, colKey: 'F', formula: r.jenis, isFormula: false })}
                          className={`px-2.5 py-1.5 font-bold border-r border-slate-300 dark:border-slate-800 cursor-pointer ${
                            activeCell.coord === `F${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          <select
                            value={r.jenis}
                            onChange={e => handleUpdateTunaiRow(idx, 'jenis', e.target.value)}
                            className="bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-[11px] font-bold cursor-pointer"
                          >
                            <option value="UP">UP</option>
                            <option value="GUP">GUP</option>
                            <option value="GUP NIHIL">GUP NIHIL</option>
                            <option value="TUP">TUP</option>
                            <option value="SETORAN TUP">SETORAN TUP</option>
                            <option value="GTUP NIHIL">GTUP NIHIL</option>
                          </select>
                        </td>

                        {/* G: Tanggal (DD/MM/YYYY vs Serial vs Kalender) */}
                        <td
                          onClick={() => setActiveCell({
                            coord: `G${excelRowNumber}`,
                            rowIdx: idx,
                            colKey: 'G',
                            formula: formatDisplayDate(r.tanggal, dateFormatMode),
                            isFormula: false
                          })}
                          className={`px-2.5 py-1.5 border-r border-slate-300 dark:border-slate-800 cursor-pointer ${
                            activeCell.coord === `G${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          {dateFormatMode === 'dmy' ? (
                            <div className="flex items-center justify-between gap-1 group">
                              <input
                                type="text"
                                value={dateInputDrafts[idx] !== undefined ? dateInputDrafts[idx] : formatDisplayDate(r.tanggal, 'dmy')}
                                onFocus={() => {
                                  setDateInputDrafts(prev => ({ ...prev, [idx]: formatDisplayDate(r.tanggal, 'dmy') }));
                                }}
                                onChange={e => {
                                  const val = e.target.value;
                                  setDateInputDrafts(prev => ({ ...prev, [idx]: val }));
                                }}
                                onBlur={e => {
                                  const val = e.target.value.trim();
                                  setDateInputDrafts(prev => {
                                    const next = { ...prev };
                                    delete next[idx];
                                    return next;
                                  });
                                  if (val && val !== '-') {
                                    const parsedIso = normalizeDateToIso(val);
                                    if (parsedIso) {
                                      handleUpdateTunaiRow(idx, 'tanggal', parsedIso);
                                    }
                                  }
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                placeholder="DD/MM/YYYY"
                                className="w-20 bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-[11px] font-mono tracking-tight font-medium text-slate-800 dark:text-slate-100"
                              />
                              <input
                                type="date"
                                value={normalizeDateToIso(r.tanggal)}
                                onChange={e => {
                                  if (e.target.value) {
                                    handleUpdateTunaiRow(idx, 'tanggal', e.target.value);
                                  }
                                }}
                                className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity cursor-pointer p-0 border-none bg-transparent"
                                title="Pilih tanggal dari kalender"
                              />
                            </div>
                          ) : dateFormatMode === 'serial' ? (
                            <div className="flex items-center justify-between gap-1 group">
                              <span className="font-mono font-medium text-[11px] text-slate-800 dark:text-slate-100">
                                {toExcelSerial(r.tanggal) || '-'}
                              </span>
                              <input
                                type="date"
                                value={normalizeDateToIso(r.tanggal)}
                                onChange={e => handleUpdateTunaiRow(idx, 'tanggal', e.target.value)}
                                className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity cursor-pointer p-0 border-none bg-transparent"
                                title="Pilih tanggal di kalender"
                              />
                            </div>
                          ) : (
                            <input
                              type="date"
                              value={normalizeDateToIso(r.tanggal)}
                              onChange={e => handleUpdateTunaiRow(idx, 'tanggal', e.target.value)}
                              className="bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-[11px] w-28"
                            />
                          )}
                        </td>

                        {/* H: Selisih Hari Kalender (KOLOM HIJAU - Rumus Otomatis) */}
                        <td
                          onClick={() => setActiveCell({
                            coord: `H${excelRowNumber}`,
                            rowIdx: idx,
                            colKey: 'H',
                            formula: idx === 0 ? '-' : `=G${excelRowNumber}-G${excelRowNumber - 1}`,
                            isFormula: true
                          })}
                          className={`px-2.5 py-1.5 text-center border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold cursor-pointer ${
                            activeCell.coord === `H${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          {idx === 0 ? '-' : r.selisihHariKalender}
                        </td>

                        {/* I: Total Gu (Kolom Putih) */}
                        <td
                          onClick={() => setActiveCell({
                            coord: `I${excelRowNumber}`,
                            rowIdx: idx,
                            colKey: 'I',
                            formula: String(r.totalGU),
                            isFormula: false
                          })}
                          className={`px-3 py-1.5 text-right border-r border-slate-300 dark:border-slate-800 cursor-pointer ${
                            activeCell.coord === `I${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          <RupiahInput
                            value={r.totalGU}
                            onChange={val => handleUpdateTunaiRow(idx, 'totalGUP', val)}
                            className="w-28 text-right bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-[11px] font-medium"
                          />
                        </td>

                        {/* J: Total Outstanding UP (Kolom Putih) */}
                        <td
                          onClick={() => setActiveCell({
                            coord: `J${excelRowNumber}`,
                            rowIdx: idx,
                            colKey: 'J',
                            formula: String(r.totalOutstandingUP),
                            isFormula: false
                          })}
                          className={`px-3 py-1.5 text-right border-r border-slate-300 dark:border-slate-800 cursor-pointer ${
                            activeCell.coord === `J${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          <RupiahInput
                            value={r.totalOutstandingUP}
                            onChange={val => handleUpdateTunaiRow(idx, 'totalOutstandingUP', val)}
                            className="w-28 text-right bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-[11px] font-medium"
                          />
                        </td>

                        {/* K: Persen (KOLOM HIJAU - Rumus Otomatis) */}
                        <td
                          onClick={() => setActiveCell({
                            coord: `K${excelRowNumber}`,
                            rowIdx: idx,
                            colKey: 'K',
                            formula: r.persen > 0 ? `=(I${excelRowNumber}/J${excelRowNumber})*100` : '-',
                            isFormula: true
                          })}
                          className={`px-2.5 py-1.5 text-right border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-semibold cursor-pointer ${
                            activeCell.coord === `K${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          {r.persen > 0 ? formatExcelNum(r.persen) : '-'}
                        </td>

                        {/* L: Status (Otomatis: <= 30 hari TEPAT WAKTU, > 30 hari TERLAMBAT, dapat diubah manual) */}
                        <td
                          onClick={() => setActiveCell({
                            coord: `L${excelRowNumber}`,
                            rowIdx: idx,
                            colKey: 'L',
                            formula: r.status,
                            isFormula: false
                          })}
                          className={`px-2 py-1.5 text-center border-r border-slate-300 dark:border-slate-800 font-sans cursor-pointer ${
                            activeCell.coord === `L${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <select
                              value={r.status}
                              onChange={e => handleUpdateTunaiRow(idx, 'status', e.target.value)}
                              className={`bg-transparent border-none p-0 text-[10px] font-bold focus:outline-none focus:ring-0 cursor-pointer ${
                                r.status === 'TEPAT WAKTU'
                                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                                  : r.status === 'TERLAMBAT'
                                  ? 'text-rose-600 dark:text-rose-400 font-black'
                                  : 'text-slate-400'
                              }`}
                              title={
                                r.jenis === 'UP' || r.jenis === 'TUP' || idx === 0
                                  ? 'UP/TUP tidak dinilai ketepatan waktu (-)'
                                  : `Selisih: ${r.selisihHariKalender} hari. Sesuai aturan: <= 30 hari Tepat Waktu, > 30 hari Terlambat. Anda juga dapat memilih manual melalui dropdown ini.`
                              }
                            >
                              <option value="-">-</option>
                              <option value="TEPAT WAKTU">TEPAT WAKTU</option>
                              <option value="TERLAMBAT">TERLAMBAT</option>
                            </select>

                            {/* Tombol Auto jika status saat ini berbeda dari formula otomatis */}
                            {r.jenis !== 'UP' && r.jenis !== 'TUP' && idx > 0 && r.status !== determineAutoStatus(r.jenis, r.selisihHariKalender, idx) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateTunaiRow(idx, 'status', determineAutoStatus(r.jenis, r.selisihHariKalender, idx));
                                }}
                                className="px-1 py-0.5 rounded text-[9px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/60 transition-colors"
                                title={`Nilai diubah manual. Klik untuk mereset ke otomatis (${determineAutoStatus(r.jenis, r.selisihHariKalender, idx)})`}
                              >
                                Auto
                              </button>
                            )}
                          </div>
                        </td>

                        {/* M: Total hari Sebulan (Kolom Otomatis dengan Tombol Ubah Manual) */}
                        <td
                          onClick={() => setActiveCell({
                            coord: `M${excelRowNumber}`,
                            rowIdx: idx,
                            colKey: 'M',
                            formula: String(r.totalHariSebulan),
                            isFormula: false
                          })}
                          className={`px-1.5 py-1 text-center border-r border-slate-300 dark:border-slate-800 cursor-pointer ${
                            activeCell.coord === `M${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {editingDaysRow === idx ? (
                              <input
                                type="number"
                                autoFocus
                                value={r.totalHariSebulan}
                                onChange={e => handleUpdateTunaiRow(idx, 'totalHariSebulan', Number(e.target.value))}
                                onBlur={() => setEditingDaysRow(null)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') setEditingDaysRow(null);
                                }}
                                className="w-10 text-center bg-white dark:bg-slate-800 border border-emerald-500 rounded px-1 py-0.5 text-[11px] font-bold shadow-xs focus:outline-none"
                              />
                            ) : (
                              <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-100 min-w-[20px]">
                                {r.totalHariSebulan}
                              </span>
                            )}

                            {/* Tombol Ubah Manual */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingDaysRow(editingDaysRow === idx ? null : idx);
                              }}
                              className={`p-1 rounded text-[10px] transition-colors ${
                                editingDaysRow === idx
                                  ? 'bg-emerald-500 text-white font-bold'
                                  : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                              }`}
                              title={editingDaysRow === idx ? 'Selesai ubah' : 'Ubah jumlah hari sebulan secara manual'}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            {/* Badge OM-SPAN atau Tombol Kembalikan ke Kalender Baku */}
                            {(r.totalHariSebulan === 35 || r.totalHariSebulan === 38 || r.totalHariSebulan === 40 || r.totalHariSebulan === 41) ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowLogicExplainerModal(true);
                                }}
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-0.5 cursor-pointer transition-colors"
                                title="Nilai resmi cetakan OM-SPAN. Klik untuk melihat penjelasan logika perhitungan."
                              >
                                <span>OM-SPAN</span>
                                <AlertCircle className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400" />
                              </button>
                            ) : r.totalHariSebulan !== calculateAutoDaysInMonth(tunaiRows, idx) ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateTunaiRow(idx, 'totalHariSebulan', calculateAutoDaysInMonth(tunaiRows, idx));
                                }}
                                className="px-1 py-0.5 rounded text-[9px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/60 transition-colors"
                                title={`Kembalikan ke hitungan kalender otomatis (${calculateAutoDaysInMonth(tunaiRows, idx)} hari)`}
                              >
                                Auto
                              </button>
                            ) : null}
                          </div>
                        </td>

                        {/* N: Persen GUP Disebulankan (KOLOM HIJAU - Rumus Otomatis) */}
                        <td
                          onClick={() => setActiveCell({
                            coord: `N${excelRowNumber}`,
                            rowIdx: idx,
                            colKey: 'N',
                            formula: r.persenGupDisebulankan !== null ? `=MIN(100; (K${excelRowNumber}*M${excelRowNumber})/H${excelRowNumber})` : '-',
                            isFormula: true
                          })}
                          className={`px-2.5 py-1.5 text-right border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold cursor-pointer ${
                            activeCell.coord === `N${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          {r.persenGupDisebulankan !== null ? formatExcelNum(r.persenGupDisebulankan) : '-'}
                        </td>

                        {/* O: Total TUP (KOLOM HIJAU - Rumus Otomatis) */}
                        <td
                          onClick={() => setActiveCell({
                            coord: `O${excelRowNumber}`,
                            rowIdx: idx,
                            colKey: 'O',
                            formula: String(r.totalTUP),
                            isFormula: true
                          })}
                          className={`px-3 py-1.5 text-right border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 cursor-pointer ${
                            activeCell.coord === `O${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          {r.totalTUP > 0 ? formatExcelCurrency(r.totalTUP) : '0'}
                        </td>

                        {/* P: Total Setoran TUP (Kolom Putih) */}
                        <td
                          onClick={() => setActiveCell({
                            coord: `P${excelRowNumber}`,
                            rowIdx: idx,
                            colKey: 'P',
                            formula: String(r.totalSetoranTUP),
                            isFormula: false
                          })}
                          className={`px-3 py-1.5 text-right border-r border-slate-300 dark:border-slate-800 cursor-pointer ${
                            activeCell.coord === `P${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          {r.jenis === 'SETORAN TUP' || r.jenis === 'GTUP NIHIL' ? (
                            <RupiahInput
                              value={r.totalSetoranTUP}
                              onChange={val => handleUpdateTunaiRow(idx, 'totalSetoranTUP', val)}
                              className="w-28 text-right bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-[11px] font-bold text-amber-700 dark:text-amber-400"
                            />
                          ) : (
                            <span className="text-slate-400">Rp. 0</span>
                          )}
                        </td>

                        {/* Q: Nilai Ketepatan Waktu (KOLOM HIJAU - Rumus Otomatis) */}
                        <td
                          onClick={() => setActiveCell({
                            coord: `Q${excelRowNumber}`,
                            rowIdx: idx,
                            colKey: 'Q',
                            formula: `=IF(L${excelRowNumber}="-"; "-"; IF(L${excelRowNumber}="TEPAT WAKTU"; 100; 0))`,
                            isFormula: true
                          })}
                          className={`px-2.5 py-1.5 text-center border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold cursor-pointer ${
                            activeCell.coord === `Q${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          {r.nilaiKetepatanWaktu === '-' ? '-' : r.nilaiKetepatanWaktu}
                        </td>

                        {/* R: Nilai Persentase GUP Disebulankan (KOLOM HIJAU - Rumus Otomatis) */}
                        <td
                          onClick={() => setActiveCell({
                            coord: `R${excelRowNumber}`,
                            rowIdx: idx,
                            colKey: 'R',
                            formula: r.nilaiPersentaseGupDisebulankan !== null ? `=IF(N${excelRowNumber}="-"; "-"; N${excelRowNumber})` : '-',
                            isFormula: true
                          })}
                          className={`px-2.5 py-1.5 text-right border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-semibold cursor-pointer ${
                            activeCell.coord === `R${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          {r.nilaiPersentaseGupDisebulankan !== null ? formatExcelNum(r.nilaiPersentaseGupDisebulankan) : '-'}
                        </td>

                        {/* S: Nilai Setoran TUP (KOLOM HIJAU - Rumus Otomatis) */}
                        <td
                          onClick={() => setActiveCell({
                            coord: `S${excelRowNumber}`,
                            rowIdx: idx,
                            colKey: 'S',
                            formula: `=IF(P${excelRowNumber}=0; 100; 100 - (P${excelRowNumber}/O${excelRowNumber}*100))`,
                            isFormula: true
                          })}
                          className={`px-2.5 py-1.5 text-right border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-semibold cursor-pointer ${
                            activeCell.coord === `S${excelRowNumber}` ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          {formatExcelNum(r.nilaiSetoranTup)}
                        </td>

                        {/* Aksi */}
                        <td className="px-2 py-1.5 text-center">
                          <button
                            onClick={() => handleDeleteTunaiRow(idx)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Table Footers (Row 25 & Row 26 persis di screenshot Excel) */}
                <tfoot className="border-t-2 border-slate-300 dark:border-slate-700 font-mono text-xs">
                  {/* Row 25: Nilai Komponen */}
                  <tr className="bg-slate-50 dark:bg-slate-900 font-bold border-b border-slate-200 dark:border-slate-800">
                    <td className="px-2 py-2 text-center text-slate-400 border-r border-slate-300 dark:border-slate-800">25</td>
                    <td colSpan={15} className="px-3 py-2 text-right font-sans text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-800">
                      Nilai Komponen
                    </td>
                    {/* Q25: Ketepatan (Kolom Hijau) */}
                    <td
                      onClick={() => setActiveCell({ coord: 'Q25', rowIdx: 24, colKey: 'Q', formula: '=ROUND(AVERAGE(Q3:Q24); 2)', isFormula: true })}
                      className={`px-2.5 py-2 text-center border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-black cursor-pointer ${
                        activeCell.coord === 'Q25' ? 'ring-2 ring-emerald-500' : ''
                      }`}
                    >
                      {formatExcelNum(tunaiResult.nilaiKetepatanWaktu)}
                    </td>
                    {/* R25: GUP Disebulankan (Kolom Hijau) */}
                    <td
                      onClick={() => setActiveCell({ coord: 'R25', rowIdx: 24, colKey: 'R', formula: '=ROUND(AVERAGE(R3:R24); 2)', isFormula: true })}
                      className={`px-2.5 py-2 text-right border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-black cursor-pointer ${
                        activeCell.coord === 'R25' ? 'ring-2 ring-emerald-500' : ''
                      }`}
                    >
                      {formatExcelNum(tunaiResult.nilaiGupDisebulankan)}
                    </td>
                    {/* S25: Setoran TUP (Kolom Hijau) */}
                    <td
                      onClick={() => setActiveCell({ coord: 'S25', rowIdx: 24, colKey: 'S', formula: '=ROUND(AVERAGE(S3:S24); 2)', isFormula: true })}
                      className={`px-2.5 py-2 text-right border-r border-emerald-300 dark:border-emerald-800 bg-[#e2f0d9] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-black cursor-pointer ${
                        activeCell.coord === 'S25' ? 'ring-2 ring-emerald-500' : ''
                      }`}
                    >
                      {formatExcelNum(tunaiResult.nilaiSetoranTup)}
                    </td>
                    <td></td>
                  </tr>

                  {/* Row 26: Nilai UP TUP Tunai */}
                  <tr className="bg-[#d9ead3] dark:bg-emerald-950/50 border-b border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100 font-black">
                    <td className="px-2 py-2 text-center text-slate-400 border-r border-slate-300 dark:border-slate-800">26</td>
                    <td colSpan={15} className="px-3 py-2 text-right font-sans text-xs uppercase tracking-wide border-r border-slate-300 dark:border-slate-800">
                      Nilai UP TUP Tunai
                    </td>
                    {/* Q26: Nilai UP TUP Tunai */}
                    <td
                      colSpan={3}
                      onClick={() => setActiveCell({ coord: 'Q26', rowIdx: 25, colKey: 'Q', formula: '=(50%*Q25)+(25%*R25)+(25%*S25)', isFormula: true })}
                      className={`px-3 py-2 text-left border-r border-emerald-300 dark:border-emerald-800 font-mono text-sm cursor-pointer ${
                        activeCell.coord === 'Q26' ? 'ring-2 ring-emerald-500' : ''
                      }`}
                    >
                      <span className="text-base underline font-black mr-2">{formatExcelNum(valTunai)}</span>
                      <span className="text-[11px] font-normal text-emerald-800 dark:text-emerald-300 font-sans">
                        = (50% × {formatExcelNum(tunaiResult.nilaiKetepatanWaktu)}) + (25% × {formatExcelNum(tunaiResult.nilaiGupDisebulankan)}) + (25% × {formatExcelNum(tunaiResult.nilaiSetoranTup)})
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Catatan Sesuai Format Gambar Excel */}
          <div className={`p-4 rounded-xl border font-sans text-xs space-y-1.5 ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <span className="font-bold block text-slate-900 dark:text-slate-100">Catatan:</span>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300 dark:border-slate-700 shadow-2xs"></span>
              <span><strong>Kolom Putih</strong> dapat diisi oleh Satker</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-[#e2f0d9] border border-emerald-400"></span>
              <span><strong>Kolom Hijau</strong> otomatis terisi sesuai rumus perhitungan IKPA</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: UP KKP (12 PERIODE)                                           */}
      {/* ========================================================================= */}
      {activeSection === 'kkp' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Pagu UP KKP Satker per Bulan (Kolom E)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Nilai 1 Tahun dihitung otomatis (Kolom F = E × 12). Target bertahap: TW I = 1%, TW II = 5%, TW III = 9%, TW IV = 12,5%.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Pagu/Bulan: Rp</label>
                <RupiahInput
                  prefix=""
                  value={kkpRows[0]?.upKKPPerBulan ?? 14000000}
                  onChange={val => handleUpdateKkpPaguPerBulan(val)}
                  placeholder="0"
                  className="w-36 rounded-xl border px-3 py-1.5 text-xs font-mono font-bold dark:bg-slate-800 dark:border-slate-700 text-right bg-white dark:text-slate-100 shadow-xs"
                />
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 font-mono text-xs font-bold whitespace-nowrap">
                Pagu 1 Thn: {formatRupiah((kkpRows[0]?.upKKPPerBulan ?? 14000000) * 12)}
              </div>
              <button
                type="button"
                onClick={handleLoadSample651011}
                className="px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-700/60 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs font-medium transition-all shadow-xs"
                title="Muat contoh data riil OM-SPAN Satker 651011 (Bidpropam Polda Jateng: Pagu Rp 14.000.000, Realisasi bertahap dari Periode 01 s.d. 07)"
              >
                Muat Contoh OM-SPAN Satker 651011
              </button>
            </div>
          </div>

          {/* 12 Months Table */}
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Target &amp; Realisasi Penggunaan KKP 12 Periode (Slide 32 &amp; 34)
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                    Evaluasi s.d. Periode {String(effectiveKkpCutoff).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Nilai Bulanan (I): =IF(H=0, 0, IF(H&gt;=G, 110, 100)). Nilai UP KKP (J): AVERAGE bertahap dari I7, I10, I13, In.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                    Periode Evaluasi:
                  </label>
                  <select
                    value={kkpCutoffMode}
                    onChange={e => {
                      const val = e.target.value;
                      setKkpCutoffMode(val === 'auto' ? 'auto' : Number(val));
                    }}
                    className="text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-1.5 shadow-xs"
                    title="Pilih periode cutoff evaluasi s.d. bulan tertentu"
                  >
                    <option value="auto">
                      Otomatis: Periode Berjalan ({String(latestFilledKkpPeriod).padStart(2, '0')})
                    </option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>
                        Periode {String(m).padStart(2, '0')} {m === 3 ? '(TW I)' : m === 6 ? '(TW II)' : m === 9 ? '(TW III)' : m === 12 ? '(Akhir Tahun / J16)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-[11px] text-slate-400 block uppercase font-medium">
                      Nilai KKP (s.d. Periode {String(effectiveKkpCutoff).padStart(2, '0')})
                    </span>
                  </div>
                  <div className="flex items-baseline justify-end gap-2">
                    <span className="text-xl font-black font-mono text-purple-600 dark:text-purple-400">
                      {formatScore(valKKP)}
                    </span>
                    {effectiveKkpCutoff < 12 && (
                      <span className="text-[10px] text-slate-400 font-mono" title="Proyeksi Nilai J16 jika TW berikutnya tidak ada realisasi (0)">
                        (J16: {formatScore(valKKPYearEnd)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'bg-slate-800/80 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  <tr>
                    <th className="px-3 py-3 text-center">Bulan</th>
                    <th className="px-3 py-3 text-center">Target %</th>
                    <th className="px-4 py-3 text-right">Target Nominal (G)</th>
                    <th className="px-4 py-3 text-right">Realisasi KKP (H)</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-3 py-3 text-center bg-purple-500/5 text-purple-700 dark:text-purple-300 font-mono">Nilai Bln (I)</th>
                    <th className="px-4 py-3 text-right bg-purple-500/10 text-purple-900 dark:text-purple-200 font-mono font-black">Nilai KKP (J)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {kkpResult.processedMonths.map((m, idx) => {
                    const periodNum = idx + 1;
                    const isKeyQuarterMonth = idx === 2 || idx === 5 || idx === 8 || idx === 11;
                    const isCutoffMonth = periodNum === effectiveKkpCutoff;
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isCutoffMonth
                            ? isDark ? 'bg-purple-900/30 ring-1 ring-inset ring-purple-500/50' : 'bg-purple-100/50 ring-1 ring-inset ring-purple-300'
                            : isKeyQuarterMonth
                            ? isDark ? 'bg-purple-950/20' : 'bg-purple-50/40'
                            : isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="px-3 py-2.5 text-center font-bold font-sans flex items-center justify-center gap-1.5">
                          <span>Periode {m.periode}</span>
                          {isCutoffMonth && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-600 text-white font-mono font-bold shadow-xs">
                              Aktif
                            </span>
                          )}
                          {isKeyQuarterMonth && !isCutoffMonth && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono">
                              Triwulan
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center font-semibold text-slate-600 dark:text-slate-400">
                          {(m.targetPersen * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-slate-700 dark:text-slate-300">
                          {formatRupiah(m.targetPenggunaanKKP)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <RupiahInput
                            value={m.penggunaanKKP}
                            onChange={val => handleUpdateKkpUsage(idx, val)}
                            className="w-36 text-right rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-[11px] font-bold bg-white dark:bg-slate-800"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center font-sans">
                          {m.penggunaanKKP === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              Nihil (0)
                            </span>
                          ) : m.isAchieved ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center gap-0.5">
                              <Check className="w-3 h-3" /> Target Capai (110)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                              Ada Transaksi (100)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center bg-purple-500/5 font-black">
                          <span className={
                            m.nilaiBulanan === 110
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : m.nilaiBulanan === 100
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }>
                            {m.nilaiBulanan}
                          </span>
                        </td>
                        <td className={`px-4 py-2.5 text-right font-black text-xs font-mono ${
                          isCutoffMonth
                            ? 'bg-purple-600 text-white font-black rounded-sm'
                            : 'bg-purple-500/10 text-purple-900 dark:text-purple-200'
                        }`}>
                          {formatScore(m.nilaiUPKKP)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: SIMULATOR "JIKA" (WHAT-IF ANALYSIS)                           */}
      {/* ========================================================================= */}
      {activeSection === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulator 1: KKP */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Simulator Penggunaan KKP</h4>
                <p className="text-[11px] text-slate-400">Uji skenario realisasi KKP per bulan</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">Pilih Periode:</label>
                <select
                  value={simKkpPeriod}
                  onChange={e => setSimKkpPeriod(Number(e.target.value))}
                  className="w-full rounded-xl border px-3 py-2 text-xs font-semibold dark:bg-slate-800 dark:border-slate-700"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>
                      Periode {String(m).padStart(2, '0')} (Target: {(KKP_TARGET_PERCENT[m] * 100).toFixed(1)}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Target Periode {simKkpPeriod}:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(simKkpTargetNominal)}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">Rencana Penggunaan KKP (Rp):</label>
                <RupiahInput
                  value={simKkpUsage}
                  onChange={val => setSimKkpUsage(val)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-800 text-right"
                />
              </div>

              <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span>Status Capaian:</span>
                  <span className="font-bold font-sans text-purple-700 dark:text-purple-300">
                    {simKkpUsage >= simKkpTargetNominal ? '✓ Capai Target' : 'Belum Capai Target'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Nilai Bulanan (I):</span>
                  <span className="font-black text-sm text-purple-700 dark:text-purple-300">
                    {simKkpScore} {simKkpScore === 110 && '(Bonus Reward)'}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-purple-200 dark:border-purple-800/40">
                  <span>Kekurangan/Surplus:</span>
                  <span className={simKkpUsage >= simKkpTargetNominal ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {formatRupiah(simKkpUsage - simKkpTargetNominal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Simulator 2: GUP Revolving */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Simulator Revolving GUP</h4>
                <p className="text-[11px] text-slate-400">Uji selisih hari &amp; GUP disebulankan</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">GUP Sebelumnya:</label>
                  <input
                    type="date"
                    value={simGupPrevDate}
                    onChange={e => setSimGupPrevDate(e.target.value)}
                    className="w-full rounded-xl border px-2 py-1.5 text-xs font-mono dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">GUP Rencana:</label>
                  <input
                    type="date"
                    value={simGupDate}
                    onChange={e => setSimGupDate(e.target.value)}
                    className="w-full rounded-xl border px-2 py-1.5 text-xs font-mono dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">Nominal GUP:</label>
                  <RupiahInput
                    value={simGupAmount}
                    onChange={val => setSimGupAmount(val)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-2 py-1.5 text-xs font-mono text-right bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">Outstanding UP:</label>
                  <RupiahInput
                    value={simGupOutstanding}
                    onChange={val => setSimGupOutstanding(val)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-2 py-1.5 text-xs font-mono text-right bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span>Selisih Hari (H):</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">{simGupDays} Hari</span>
                </div>
                <div className="flex justify-between">
                  <span>Status Ketepatan:</span>
                  <span className={`font-bold font-sans ${simGupStatus === 'TEPAT WAKTU' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {simGupStatus} ({simGupScoreKetepatan})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>% GUP Disebulankan (N):</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">{simGupDisebulankan.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Simulator 3: Setoran TUP */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Simulator Setoran TUP</h4>
                <p className="text-[11px] text-slate-400">Formula = 100 - (Setoran / Total TUP × 100)</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">Total Pagu TUP (Rp):</label>
                <RupiahInput
                  value={simTupPagu}
                  onChange={val => setSimTupPagu(val)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-mono text-right bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1">Rencana Setoran TUP (Sisa TUP):</label>
                <RupiahInput
                  value={simTupSetoran}
                  onChange={val => setSimTupSetoran(val)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-mono text-right bg-white dark:bg-slate-800 text-amber-600 font-bold"
                />
              </div>

              <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span>Persen Disetor (%):</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300">{simTupPersenSetoran.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Nilai Setoran TUP (S):</span>
                  <span className="font-black text-base text-blue-700 dark:text-blue-300">
                    {simTupScore.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-blue-200 dark:border-blue-800/40">
                  Semakin kecil setoran TUP (penyerapan riil TUP tinggi), skor semakin mendekati 100.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: DIAGNOSIS & REKOMENDASI                                       */}
      {/* ========================================================================= */}
      {activeSection === 'diagnosis' && (
        <div className="space-y-4">
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Diagnosis Kinerja Pengelolaan UP &amp; TUP Satker
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Item 1: Ketepatan Waktu GUP */}
              <div className={`p-4 rounded-xl border ${
                lateTransactions.length > 0
                  ? 'border-rose-200 bg-rose-50/30 dark:bg-rose-950/20 dark:border-rose-900/40'
                  : 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20 dark:border-emerald-900/40'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  {lateTransactions.length > 0 ? (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span className={lateTransactions.length > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}>
                    Ketepatan Waktu GUP (Skor: {formatScore(tunaiResult.nilaiKetepatanWaktu)})
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {lateTransactions.length > 0
                    ? `Terdapat ${lateTransactions.length} transaksi berstatus TERLAMBAT (selisih hari > 30 hari kalender). Hal ini memotong rata-rata skor ketepatan waktu menjadi ${formatScore(tunaiResult.nilaiKetepatanWaktu)}.`
                    : 'Semua transaksi revolving GUP tepat waktu (selisih hari ≤ 30 hari). Skor ketepatan waktu sempurna 100,00.'}
                </p>
              </div>

              {/* Item 2: Revolving GUP Disebulankan */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 font-bold text-xs mb-1 text-slate-800 dark:text-slate-200">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>Rata-rata GUP Disebulankan: {formatScore(tunaiResult.nilaiGupDisebulankan)}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {tunaiResult.nilaiGupDisebulankan >= 90
                    ? 'Revolving dana UP optimal. Kecepatan dan besaran pertanggungjawaban GUP dalam ritme 30 hari tercapai baik.'
                    : 'Percepat pengajuan SPM GUP agar revolving dana kas mendekati 100% per 30 hari kalender.'}
                </p>
              </div>

              {/* Item 3: Pertanggungjawaban TUP */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 font-bold text-xs mb-1 text-slate-800 dark:text-slate-200">
                  <Coins className="w-4 h-4 text-blue-500" />
                  <span>Kinerja Setoran TUP: {formatScore(tunaiResult.nilaiSetoranTup)}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {tunaiResult.nilaiSetoranTup >= 95
                    ? 'Penggunaan TUP sangat efektif dengan setoran sisa kas TUP yang sangat minim (penyerapan riil tinggi).'
                    : 'Terdapat setoran sisa TUP yang cukup besar. Pertimbangkan estimasi kebutuhan rincian TUP yang lebih presisi.'}
                </p>
              </div>

              {/* Item 4: Kinerja UP KKP */}
              <div className={`p-4 rounded-xl border ${
                valKKP >= 100
                  ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20 dark:border-emerald-900/40'
                  : 'border-amber-200 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-900/40'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span className="text-slate-800 dark:text-slate-200">
                    Nilai KKP Periode 12: {formatScore(valKKP)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {valKKP >= 110
                    ? 'Target KKP tercapai konsisten dan mendapatkan reward bonus 110. Ini mendongkrak skor akhir indikator!'
                    : valKKP > 0
                    ? `KKP aktif digunakan (${achievedKkpMonths.length} bulan capai target). Dorong penggunaan KKP hingga target triwulanan tercapai agar meraih reward 110.`
                    : 'Tidak ada transaksi KKP. Bobot dialihkan 100% ke UP Tunai.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. AUDIT / REGRESSION TEST MODAL                                         */}
      {/* ========================================================================= */}
      {showAuditModal && auditResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-2xl max-h-[85vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Audit Kompatibilitas Excel (21 Poin Kritis)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verifikasi otomatis dengan dataset acuan resmi PER-5/PB/2024
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-black text-sm text-emerald-800 dark:text-emerald-300">
                  {auditResult.allPassed ? 'SEMUA 21/21 POIN LULUS AUDIT DENGAN PRESISI 100%' : 'BEBERAPA POIN TIDAK SESUAI'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                {auditResult.passedCount} / {auditResult.totalCount} Passed
              </span>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1 font-mono text-xs">
              {auditResult.items.map((it, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    it.pass
                      ? 'border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/40'
                      : 'border-rose-200 bg-rose-50/40 dark:bg-rose-950/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px]">
                        {it.field}
                      </span>
                      <span className="font-sans font-semibold text-slate-800 dark:text-slate-200">
                        {it.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      Exp: <span className="font-bold text-slate-700 dark:text-slate-300">{it.expected}</span>
                    </span>
                    <span className="text-slate-500">
                      Act: <span className="font-bold text-slate-700 dark:text-slate-300">{it.actual}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      it.pass ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {it.pass ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL PENJELASAN LOGIKA TOTAL HARI SEBULAN OM-SPAN */}
      <UpTupLogicModal
        isOpen={showLogicExplainerModal}
        onClose={() => setShowLogicExplainerModal(false)}
        isDark={!!isDark}
      />
    </div>
  );
};
