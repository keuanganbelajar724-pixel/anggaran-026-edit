import React, { useState, useMemo, useEffect } from 'react';
import {
  Target,
  Clock,
  Calculator,
  RotateCcw,
  Eraser,
  Download,
  Upload,
  Copy,
  Check,
  CheckCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Search,
  Filter,
  Eye,
  ArrowRight,
  TrendingUp,
  XCircle,
  Calendar
} from 'lucide-react';
import { SimulationProject, CapaianOutputInput, CapaianOutputKetepatanInput, IndicatorResult } from '../../../models/ikpa';
import { validateCapaianOutput } from '../../../utils/indikatorValidation';
import { IndikatorValidationBanner } from '../common/IndikatorValidationBanner';
import { IndikatorCalculateButton } from '../common/IndikatorCalculateButton';
import { PetunjukPengisianCard } from '../common/PetunjukPengisianCard';
import {
  calculateCapaianOutputDetailed,
  calculateSingleRO,
  calculateSingleKetepatan,
  buildDefault12MonthsKetepatan,
  runCapaianOutputGoldenTests,
  CapaianOutputGoldenReport,
  roundExcel2
} from '../../../calculations/capaianOutput';
import {
  DEFAULT_EXCEL_CAPUT_RO_ROWS,
  DEFAULT_EXCEL_KETEPATAN_ROWS
} from '../../../utils/excelReferenceDefaultData';

interface CapaianOutputTabProps {
  project: SimulationProject;
  onUpdateProject: (updated: SimulationProject) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  isDark?: boolean;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const CapaianOutputTab: React.FC<CapaianOutputTabProps> = ({
  project,
  onUpdateProject,
  onOpenInspector,
  isDark = false
}) => {
  // Mode Tampilan: 'excel' (Tampilan Workbook Kolom A-R & X-Y) atau 'cards' (Input Interaktif)
  const [viewMode, setViewMode] = useState<'excel' | 'cards'>('excel');
  const [activeSubTab, setActiveSubTab] = useState<'ro' | 'ketepatan' | 'rekap'>('ro');

  // Filter & Search state
  const [searchRO, setSearchRO] = useState('');
  const [filterBulan, setFilterBulan] = useState<number | 'all'>('all');
  const [filterKonfirmasi, setFilterKonfirmasi] = useState<'all' | 'terkonfirmasi' | 'tidak terkonfirmasi'>('all');

  // UI Feedback States
  const [copied, setCopied] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showGoldenTestModal, setShowGoldenTestModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [goldenTestResult, setGoldenTestResult] = useState<CapaianOutputGoldenReport | null>(null);

  // Form tambah RO baru
  const [newRO, setNewRO] = useState<Partial<CapaianOutputInput>>({
    bulan: 12,
    ro: '',
    uraianRO: '',
    target: 1,
    satuan: 'Layanan',
    realisasiRO: 1,
    persenProgress: 100,
    statusKonfirmasi: 'terkonfirmasi',
    targetPCRO: 100
  });

  const roRows = project.capaianOutput || [];
  
  // Pastikan selalu tersedia 12 bulan ketepatan pelaporan (Periode 01 s.d. 12)
  const ketepatanRows = useMemo(() => {
    const raw = project.capaianOutputKetepatan;
    if (raw && raw.length === 12) {
      return raw;
    }
    return buildDefault12MonthsKetepatan(
      raw,
      'Tepat Waktu',
      project.metadata?.kodeSatker || '',
      (project.metadata?.namaSatker && project.metadata.namaSatker !== 'Simulasi Mandiri') ? project.metadata.namaSatker : ''
    );
  }, [project.capaianOutputKetepatan, project.metadata?.kodeSatker, project.metadata?.namaSatker]);

  const appliedWeight = project.weights?.capaianOutput ?? 25;

  // Auto-sync 12 bulan ketepatan ke project jika data belum ada atau kurang dari 12
  useEffect(() => {
    if (!project.capaianOutputKetepatan || project.capaianOutputKetepatan.length < 12) {
      const full12 = buildDefault12MonthsKetepatan(
        project.capaianOutputKetepatan,
        'Tepat Waktu',
        project.metadata?.kodeSatker || '',
        (project.metadata?.namaSatker && project.metadata.namaSatker !== 'Simulasi Mandiri') ? project.metadata.namaSatker : ''
      );
      onUpdateProject({
        ...project,
        capaianOutputKetepatan: full12
      });
    }
  }, [project.capaianOutputKetepatan?.length]);

  // Auto-sync Satker identity and KPPN 026 to RO rows if missing
  useEffect(() => {
    const metaKodeSatker = project.metadata?.kodeSatker;
    const metaNamaSatker = (project.metadata?.namaSatker && project.metadata.namaSatker !== 'Simulasi Mandiri')
      ? project.metadata.namaSatker
      : '';
    const metaKodeKPPN = project.metadata?.kodeKPPN || '026';

    if (!roRows || roRows.length === 0) return;

    let hasChange = false;
    const updatedROs = roRows.map(r => {
      const newSatker = (!r.satker || r.satker === '6350') ? (metaKodeSatker || r.satker) : r.satker;
      const newNama = !r.namaSatker ? (metaNamaSatker || r.namaSatker) : r.namaSatker;
      const newKppn = (!r.kppn || r.kppn === '12') ? (metaKodeKPPN || '026') : r.kppn;

      if (r.satker !== newSatker || r.namaSatker !== newNama || r.kppn !== newKppn) {
        hasChange = true;
        return {
          ...r,
          satker: newSatker,
          namaSatker: newNama,
          kppn: newKppn
        };
      }
      return r;
    });

    if (hasChange) {
      onUpdateProject({
        ...project,
        capaianOutput: updatedROs
      });
    }
  }, [project.metadata?.kodeSatker, project.metadata?.namaSatker, project.metadata?.kodeKPPN, roRows.length]);

  // Hasil kalkulasi komprehensif
  const report = useMemo(() => {
    return calculateCapaianOutputDetailed(roRows, ketepatanRows, appliedWeight);
  }, [roRows, ketepatanRows, appliedWeight]);

  const [isValidationConfirmed, setIsValidationConfirmed] = useState(false);

  // Validasi otomatis input Capaian Output
  const validationIssues = useMemo(() => {
    return validateCapaianOutput(roRows, ketepatanRows);
  }, [roRows, ketepatanRows]);

  // Objek hasil indikator standar
  const indicatorResult: IndicatorResult = useMemo(() => {
    return project.output?.indicators.capaianOutput || {
      weight: appliedWeight,
      rawValue: report.ad8NilaiFinal,
      cappedValue: report.ad8NilaiFinal,
      weightedValue: report.nilaiTerbobot,
      isActive: true,
      details: [
        { step: 'Ketepatan Laporan (30%)', formulaHuman: `30% * ${report.ab6AvgKetepatan.toFixed(2)}`, value: report.ad6KontribusiKetepatan.toFixed(2) },
        { step: 'Capaian RO (70%)', formulaHuman: `70% * ${report.ab7AvgCapaianRO.toFixed(2)}`, value: report.ad7KontribusiCapaianRO.toFixed(2) },
        { step: 'Nilai Akhir (AD8)', formulaHuman: 'AD6 + AD7', value: report.ad8NilaiFinal.toFixed(2) }
      ]
    };
  }, [project.output, appliedWeight, report]);

  // Handler update baris RO
  const handleUpdateRO = (index: number, field: keyof CapaianOutputInput, val: any) => {
    const newRows = [...roRows];
    newRows[index] = { ...newRows[index], [field]: val };
    onUpdateProject({ ...project, capaianOutput: newRows });
  };

  // Handler update baris Ketepatan (selalu aman 12 bulan)
  const handleUpdateKetepatan = (index: number, field: keyof CapaianOutputKetepatanInput, val: any) => {
    const base = ketepatanRows.length === 12
      ? [...ketepatanRows]
      : buildDefault12MonthsKetepatan(ketepatanRows, 'Tepat Waktu', project.metadata?.kodeSatker, project.metadata?.namaSatker);
    base[index] = { ...base[index], [field]: val };
    onUpdateProject({ ...project, capaianOutputKetepatan: base });
  };

  // Toggle cepat status ketepatan bulan
  const toggleKetepatan = (index: number) => {
    const base = ketepatanRows.length === 12
      ? [...ketepatanRows]
      : buildDefault12MonthsKetepatan(ketepatanRows, 'Tepat Waktu', project.metadata?.kodeSatker, project.metadata?.namaSatker);
    const current = base[index]?.ketepatan;
    const next = current === 'Tepat Waktu' ? 'Tidak Tepat Waktu' : 'Tepat Waktu';
    base[index] = { ...base[index], ketepatan: next };
    onUpdateProject({ ...project, capaianOutputKetepatan: base });
  };

  // Setel semua ketepatan 100% tepat waktu (12 bulan)
  const handleMakeAllTimely = () => {
    const base = buildDefault12MonthsKetepatan(
      ketepatanRows,
      'Tepat Waktu',
      project.metadata?.kodeSatker,
      project.metadata?.namaSatker
    );
    const newKetepatan = base.map(k => ({
      ...k,
      ketepatan: 'Tepat Waktu' as const
    }));
    onUpdateProject({ ...project, capaianOutputKetepatan: newKetepatan });
  };

  // Setel semua ketepatan tidak tepat waktu / terlambat (12 bulan)
  const handleMakeAllLate = () => {
    const base = buildDefault12MonthsKetepatan(
      ketepatanRows,
      'Tidak Tepat Waktu',
      project.metadata?.kodeSatker,
      project.metadata?.namaSatker
    );
    const newKetepatan = base.map(k => ({
      ...k,
      ketepatan: 'Tidak Tepat Waktu' as const
    }));
    onUpdateProject({ ...project, capaianOutputKetepatan: newKetepatan });
  };

  // Setel semua RO 100% terkonfirmasi
  const handleMakeAllConfirmed = () => {
    const newROList = roRows.map(r => ({
      ...r,
      statusKonfirmasi: 'terkonfirmasi' as const
    }));
    onUpdateProject({ ...project, capaianOutput: newROList });
  };

  // Tambah RO baru
  const handleAddRO = () => {
    if (!newRO.ro && !newRO.uraianRO) return;
    const nextNo = roRows.length > 0 ? Math.max(...roRows.map(r => r.no || 0)) + 1 : 1;
    const item: CapaianOutputInput = {
      no: nextNo,
      satker: project.metadata?.kodeSatker || '',
      namaSatker: (project.metadata?.namaSatker && project.metadata.namaSatker !== 'Simulasi Mandiri') ? project.metadata.namaSatker : '',
      kppn: project.metadata?.kodeKPPN || '026',
      bulan: Number(newRO.bulan) || 12,
      program: newRO.program || 'JA',
      kegiatan: newRO.kegiatan || '6350',
      kro: newRO.kro || 'ABI',
      ro: newRO.ro || `RO.${nextNo}`,
      uraianRO: newRO.uraianRO || 'Layanan Internal',
      target: Number(newRO.target) || 0,
      satuan: newRO.satuan || 'Dokumen',
      realisasiRO: Number(newRO.realisasiRO) || 0,
      persenProgress: Number(newRO.persenProgress) || 0,
      statusKonfirmasi: newRO.statusKonfirmasi || 'terkonfirmasi',
      targetPCRO: Number(newRO.targetPCRO) || 0
    };
    onUpdateProject({ ...project, capaianOutput: [...roRows, item] });
    setShowAddModal(false);
    setNewRO({
      bulan: 12,
      ro: '',
      uraianRO: '',
      target: 0,
      satuan: 'Layanan',
      realisasiRO: 0,
      persenProgress: 0,
      statusKonfirmasi: 'terkonfirmasi',
      targetPCRO: 0
    });
  };

  // Hapus baris RO
  const handleDeleteRO = (index: number) => {
    const newRows = roRows.filter((_, i) => i !== index);
    onUpdateProject({ ...project, capaianOutput: newRows });
  };

  // Reset ke Data Default Workbook Excel
  const handleResetToDefault = () => {
    if (!window.confirm('Reset seluruh data Capaian Output ke data referensi awal workbook Excel 2026?')) return;

    const defaultRO: CapaianOutputInput[] = DEFAULT_EXCEL_CAPUT_RO_ROWS.map((c: any) => ({
      no: c.id,
      satker: c.satker || '',
      namaSatker: c.namaSatker || '',
      kppn: c.kppn || '',
      bulan: c.bulan || 12,
      program: c.program || '',
      kegiatan: c.kegiatan || '',
      kro: c.kro || '',
      ro: c.ro || '',
      uraianRO: c.uraianRo || '',
      target: c.target ?? 1,
      satuan: c.satuan || 'Dokumen',
      realisasiRO: c.realisasiRo ?? 1,
      persenProgress: c.persenProgress ?? 100,
      statusKonfirmasi: c.statusKonfirmasi === 'terkonfirmasi' ? 'terkonfirmasi' : 'tidak terkonfirmasi',
      targetPCRO: c.targetPcro ?? 90.86
    }));

    const defaultKetepatan: CapaianOutputKetepatanInput[] = DEFAULT_EXCEL_KETEPATAN_ROWS.map((kt: any) => ({
      no: kt.no,
      satker: kt.satker || '',
      namaSatker: kt.namaSatker || '',
      bulan: kt.bulan || '01',
      ketepatan: kt.ketepatan === 'Tepat Waktu' ? 'Tepat Waktu' : 'Tidak Tepat Waktu'
    }));

    onUpdateProject({
      ...project,
      capaianOutput: defaultRO,
      capaianOutputKetepatan: defaultKetepatan
    });
  };

  // Kosongkan seluruh rincian output dan ketepatan ke 0
  const handleClearForm = () => {
    if (window.confirm('Kosongkan formulir Capaian Output? Seluruh rincian output (RO) dan data ketepatan pelaporan akan dihapus.')) {
      onUpdateProject({
        ...project,
        capaianOutput: [],
        capaianOutputKetepatan: []
      });
    }
  };

  // Jalankan Golden Test
  const handleRunGoldenTest = () => {
    const res = runCapaianOutputGoldenTests();
    setGoldenTestResult(res);
    setShowGoldenTestModal(true);
  };

  // Copy ringkasan
  const handleCopySummary = () => {
    const summaryText = `[Kalkulator IKPA 2026 - Modul Capaian Output]
Nilai Akhir Capaian Output (AD8): ${report.ad8NilaiFinal.toFixed(2)}
Bobot Indikator: ${appliedWeight}% (Tertinggi)
Nilai Terbobot: ${report.nilaiTerbobot.toFixed(2)}

Komponen:
1. Ketepatan Waktu Pelaporan (AB6): ${report.ab6AvgKetepatan.toFixed(2)} (Bobot 30%) → Kontribusi AD6: ${report.ad6KontribusiKetepatan.toFixed(2)}
2. Capaian Rincian Output (AB7): ${report.ab7AvgCapaianRO.toFixed(2)} (Bobot 70%) → Kontribusi AD7: ${report.ad7KontribusiCapaianRO.toFixed(2)}
Formula: AD8 = (0.30 * AVERAGE(Y5:Y16)) + (0.70 * AVERAGE(R5:R63)) = ${report.ad8NilaiFinal.toFixed(2)}
Status RO: ${report.confirmedROCount}/${report.totalROCount} Terkonfirmasi
Status Ketepatan: ${report.tepatWaktuCount}/${report.totalKetepatanCount} Bulan Tepat Waktu`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export JSON
  const handleExportJSON = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      indicator: 'Capaian Output IKPA 2026',
      roRows,
      ketepatanRows,
      calculation: report
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capaian_output_ikpa_2026_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered RO list
  const filteredRO = useMemo(() => {
    return report.processedRO.filter(r => {
      const matchSearch =
        searchRO === '' ||
        (r.ro && r.ro.toLowerCase().includes(searchRO.toLowerCase())) ||
        (r.uraianRO && r.uraianRO.toLowerCase().includes(searchRO.toLowerCase())) ||
        (r.kro && r.kro.toLowerCase().includes(searchRO.toLowerCase()));

      const matchBulan = filterBulan === 'all' || r.bulan === filterBulan;
      const matchKonfirmasi =
        filterKonfirmasi === 'all' ||
        (filterKonfirmasi === 'terkonfirmasi' ? r.isConfirmed : !r.isConfirmed);

      return matchSearch && matchBulan && matchKonfirmasi;
    });
  }, [report.processedRO, searchRO, filterBulan, filterKonfirmasi]);

  return (
    <div className="space-y-6 animate-fade-in" id="capaian-output-module">
      {/* 1. TOP SUMMARY CARD SESUAI USER PROMPT */}
      <div className={`rounded-2xl border p-6 shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Kotak Utama Capaian Output (Prompt Specification) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-center">
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-700 dark:text-emerald-400 uppercase">
              CAPAIAN OUTPUT
            </span>
            <div className="mt-2 text-5xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-300">
              {report.ad8NilaiFinal.toFixed(2).replace('.', ',')}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 font-mono">
                Sel AD8 = SUM(AD6:AD7)
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-200 font-mono">
                Bobot IKPA: {appliedWeight}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Nilai Terbobot IKPA: <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{report.nilaiTerbobot.toFixed(2).replace('.', ',')}</span>
            </p>
          </div>

          {/* Rincian Komponen (Ketepatan 30% & Capaian 70%) Sesuai Format Prompt */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ketepatan Waktu</span>
                </div>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                  {report.ab6AvgKetepatan.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Bobot: 30% (Sel AC6)</span>
                <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                  Kontribusi: {report.ad6KontribusiKetepatan.toFixed(2).replace('.', ',')} (AD6)
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Capaian Output (RO)</span>
                </div>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                  {report.ab7AvgCapaianRO.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Bobot: 70% (Sel AC7)</span>
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  Kontribusi: {report.ad7KontribusiCapaianRO.toFixed(2).replace('.', ',')} (AD7)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Hub */}
          <div className="lg:col-span-3 flex flex-col gap-2 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
            <IndikatorCalculateButton
              indicatorKey="capaianOutput"
              indicatorName="Capaian Output"
              weight={appliedWeight}
              indicatorResult={indicatorResult}
              validationIssues={validationIssues}
              satkerName={project.metadata?.namaSatker || project.name}
              isDark={isDark}
            />

            <button
              onClick={() => onOpenInspector(
                'Indikator Capaian Output (Sheet Capaian Output)',
                'AD8',
                '= (0.30 * AVERAGE(Y5:Y16)) + (0.70 * AVERAGE(R5:R63))',
                report.ad8NilaiFinal.toFixed(2),
                project.output?.indicators.capaianOutput?.details || []
              )}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            >
              <Calculator className="h-4 w-4 text-emerald-600" />
              Formula Inspector (AD8)
            </button>

            <button
              onClick={handleRunGoldenTest}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-2xs"
            >
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Verifikasi Golden Test (8 Kasus)
            </button>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={handleCopySummary}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Tersalin' : 'Salin Data'}
              </button>

              <button
                onClick={handleResetToDefault}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Excel
              </button>

              <button
                onClick={handleClearForm}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 px-2 py-1.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                title="Kosongkan seluruh data RO dan ketepatan"
              >
                <Eraser className="h-3.5 w-3.5 text-rose-500" />
                Kosongkan Formulir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Validasi Data Input */}
      <IndikatorValidationBanner
        indicatorName="Capaian Output"
        issues={validationIssues}
        isConfirmed={isValidationConfirmed}
        onToggleConfirm={() => setIsValidationConfirmed(!isValidationConfirmed)}
        isDark={isDark}
      />

      {/* Petunjuk Pengisian & Cara Menggunakan */}
      <PetunjukPengisianCard
        indicatorId="capaian-output"
        isDark={isDark}
        defaultExpanded={true}
      />

      {/* 2. MODE SWITCHER & SUB-TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveSubTab('ro')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'ro'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Target className="h-4 w-4" />
            Capaian Rincian Output (Bobot 70%)
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
              {report.totalROCount} RO
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('ketepatan')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'ketepatan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Clock className="h-4 w-4" />
            Ketepatan Waktu Pelaporan (Bobot 30%)
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
              {report.tepatWaktuCount}/12 Bulan
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('rekap')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
              activeSubTab === 'rekap'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            Rekapitulasi Workbook (AB6:AD8)
          </button>
        </div>

        {/* View Mode Switcher: Excel vs Cards */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('excel')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'excel'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              Tampilan Excel
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              Input Interaktif
            </button>
          </div>

          <button
            onClick={handleExportJSON}
            title="Download Cadangan JSON"
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3. KONTEN TAB: SUBTAB RO */}
      {activeSubTab === 'ro' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari RO atau nama..."
                  value={searchRO}
                  onChange={e => setSearchRO(e.target.value)}
                  className="w-48 pl-8 pr-3 py-1.5 rounded-lg border text-xs dark:bg-slate-800 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={filterBulan}
                onChange={e => setFilterBulan(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="rounded-lg border px-2.5 py-1.5 text-xs dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="all">Semua Bulan (1-12)</option>
                {MONTH_NAMES.map((m, idx) => (
                  <option key={idx} value={idx + 1}>Bulan {idx + 1} - {m}</option>
                ))}
              </select>

              <select
                value={filterKonfirmasi}
                onChange={e => setFilterKonfirmasi(e.target.value as any)}
                className="rounded-lg border px-2.5 py-1.5 text-xs dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="all">Semua Konfirmasi</option>
                <option value="terkonfirmasi">Terkonfirmasi ({report.confirmedROCount})</option>
                <option value="tidak terkonfirmasi">Belum Terkonfirmasi ({report.unconfirmedROCount})</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMakeAllConfirmed}
                className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
              >
                Setel Semua Terkonfirmasi
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Baris RO
              </button>
            </div>
          </div>

          {/* TABLE VIEW (EXCEL STYLE) */}
          {viewMode === 'excel' ? (
            <div className={`rounded-2xl border overflow-hidden shadow-xs ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Tabel Capaian Rincian Output (Sheet Capaian Output Kolom A:R)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    Formula R = ROUND(IF(Q &gt; 100, 100, Q), 2) | Rata-rata AB7 = AVERAGE(R5:R63) = {report.ab7AvgCapaianRO.toFixed(2)}
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 font-semibold">
                  Menampilkan {filteredRO.length} dari {report.totalROCount} baris
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b font-semibold ${
                    isDark ? 'bg-slate-800/80 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    <tr>
                      <th className="px-3 py-2.5 text-center font-mono">A (No)</th>
                      <th className="px-3 py-2.5 font-mono">E (Bln)</th>
                      <th className="px-3 py-2.5 font-mono">I (RO)</th>
                      <th className="px-3 py-2.5 font-sans min-w-[200px]">J (Uraian Rincian Output)</th>
                      <th className="px-3 py-2.5 text-right font-mono">K (Target)</th>
                      <th className="px-3 py-2.5 text-right font-mono">M (RVRO)</th>
                      <th className="px-3 py-2.5 text-right font-mono">N (PCRO %)</th>
                      <th className="px-3 py-2.5 text-center font-mono">O (Konfirmasi)</th>
                      <th className="px-3 py-2.5 text-right font-mono">P (Tgt PCRO)</th>
                      <th className="px-3 py-2.5 text-right font-mono bg-emerald-50/50 dark:bg-emerald-950/20">Q (Nilai)</th>
                      <th className="px-3 py-2.5 text-right font-mono bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-bold">R (Akhir)</th>
                      <th className="px-2 py-2.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {filteredRO.map((r) => {
                      const origIndex = roRows.findIndex(item => item.no === r.no);
                      return (
                        <tr
                          key={r.no}
                          className={`transition-colors ${
                            !r.isConfirmed
                              ? 'bg-rose-50/40 dark:bg-rose-950/10'
                              : isDark
                              ? 'hover:bg-slate-800/40'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="px-3 py-2 text-center text-slate-500">{r.no}</td>
                          <td className="px-3 py-2 font-semibold">
                            <input
                              type="number"
                              min={1}
                              max={12}
                              value={r.bulan}
                              onChange={e => handleUpdateRO(origIndex, 'bulan', Number(e.target.value))}
                              className="w-12 text-center rounded border px-1 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                            />
                          </td>
                          <td className="px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400">
                            {r.ro || `RO.${r.no}`}
                          </td>
                          <td className="px-3 py-2 font-sans">
                            <span className="line-clamp-1" title={r.uraianRO}>
                              {r.uraianRO || 'Layanan Administrasi'}
                            </span>
                            {r.warning && (
                              <span className="block text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                ⚠ {r.warning}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={r.target}
                              onChange={e => handleUpdateRO(origIndex, 'target', Number(e.target.value))}
                              className="w-20 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700 font-semibold"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={r.realisasiRO}
                              onChange={e => handleUpdateRO(origIndex, 'realisasiRO', Number(e.target.value))}
                              className="w-20 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-semibold"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step="any"
                              value={r.persenProgress}
                              onChange={e => handleUpdateRO(origIndex, 'persenProgress', Number(e.target.value))}
                              className="w-16 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700 font-semibold"
                            />
                          </td>
                          <td className="px-3 py-2 text-center font-sans">
                            <select
                              value={r.statusKonfirmasi}
                              onChange={e => handleUpdateRO(origIndex, 'statusKonfirmasi', e.target.value as any)}
                              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                                r.isConfirmed
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                              }`}
                            >
                              <option value="terkonfirmasi">Terkonfirmasi</option>
                              <option value="tidak terkonfirmasi">Tidak Terkonfirmasi (0)</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={r.targetPCRO}
                              onChange={e => handleUpdateRO(origIndex, 'targetPCRO', Number(e.target.value))}
                              className="w-16 text-right rounded border px-1.5 py-0.5 text-[11px] dark:bg-slate-800 dark:border-slate-700"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-300 bg-emerald-50/30 dark:bg-emerald-950/10" title={r.branch}>
                            {r.q.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-900/20" title={`Cabang Formula: ${r.branch}`}>
                            {r.r.toFixed(2)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              onClick={() => handleDeleteRO(origIndex)}
                              title="Hapus baris ini"
                              className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className={`border-t font-semibold ${
                    isDark ? 'bg-slate-800/80 text-slate-200' : 'bg-slate-100 text-slate-800'
                  }`}>
                    <tr>
                      <td colSpan={10} className="px-4 py-3 text-right font-bold uppercase tracking-wider text-xs">
                        Rata-rata Capaian Output (AB7 = AVERAGE(R5:R63)):
                      </td>
                      <td className="px-3 py-3 text-right font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                        {report.ab7AvgCapaianRO.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            /* CARDS / INTERACTIVE INPUT VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRO.map((r) => {
                const origIndex = roRows.findIndex(item => item.no === r.no);
                return (
                  <div
                    key={r.no}
                    className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                      !r.isConfirmed
                        ? 'border-rose-300 bg-rose-50/30 dark:bg-rose-950/10'
                        : isDark
                        ? 'border-slate-800 bg-slate-900'
                        : 'border-slate-200 bg-white shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {r.ro || `RO.${r.no}`}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Bulan {r.bulan}
                        </span>
                      </div>
                      <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1 line-clamp-2">
                        {r.uraianRO || 'Layanan Operasional Satker'}
                      </h5>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Target (K)</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{r.target} {r.satuan}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Realisasi (M)</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{r.realisasiRO}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Progres (N)</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{r.persenProgress}%</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Tgt PCRO (P)</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{r.targetPCRO}%</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Nilai Capaian (R):</span>
                          <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                            {r.r.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, r.r)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => handleUpdateRO(
                          origIndex,
                          'statusKonfirmasi',
                          r.isConfirmed ? 'tidak terkonfirmasi' : 'terkonfirmasi'
                        )}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                          r.isConfirmed
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {r.isConfirmed ? '✓ Terkonfirmasi' : '✕ Tidak Terkonfirmasi'}
                      </button>

                      <button
                        onClick={() => handleDeleteRO(origIndex)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. KONTEN TAB: SUBTAB KETEPATAN WAKTU */}
      {activeSubTab === 'ketepatan' && (
        <div className="space-y-4">
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Status Ketepatan Waktu Pelaporan Bulanan (12 Periode)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Formula: Y = IF(X = &quot;Tepat Waktu&quot;, 100, 0). Rata-rata AB6 = AVERAGE(Y5:Y16) = {report.ab6AvgKetepatan.toFixed(2)}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleMakeAllTimely}
                className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 transition-colors"
                title="Setel semua 12 bulan menjadi Tepat Waktu (nilai 100 per bulan)"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Setel Semua 12 Bulan Tepat Waktu (100)
              </button>

              <button
                onClick={handleMakeAllLate}
                className="rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 shadow-xs flex items-center gap-1.5 transition-colors"
                title="Setel semua 12 bulan menjadi Tidak Tepat Waktu (nilai 0 per bulan)"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                Setel Semua Terlambat (0)
              </button>
            </div>
          </div>

          <div className={`rounded-2xl border overflow-hidden shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b font-semibold ${
                  isDark ? 'bg-slate-800/80 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <tr>
                    <th className="px-4 py-3 font-mono text-center">Periode</th>
                    <th className="px-4 py-3">Nama Bulan</th>
                    <th className="px-4 py-3">Batas Waktu Laporan</th>
                    <th className="px-4 py-3 font-mono text-center">Kolom X (Status Ketepatan)</th>
                    <th className="px-4 py-3 font-mono text-right">Kolom Y (Nilai Skor)</th>
                    <th className="px-4 py-3 text-center">Tindakan Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {(report.processedKetepatan && report.processedKetepatan.length > 0
                    ? report.processedKetepatan
                    : ketepatanRows.map(k => calculateSingleKetepatan(k))
                  ).map((k, idx) => (
                    <tr
                      key={idx}
                      className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'}
                    >
                      <td className="px-4 py-2.5 text-center font-bold text-slate-500">
                        {k.bulan}
                      </td>
                      <td className="px-4 py-2.5 font-sans font-medium text-slate-900 dark:text-slate-100">
                        {MONTH_NAMES[Number(k.bulan) - 1] || `Bulan ${k.bulan}`}
                      </td>
                      <td className="px-4 py-2.5 font-sans text-slate-500">
                        Tgl 15 {MONTH_NAMES[Number(k.bulan) % 12]}
                      </td>
                      <td className="px-4 py-2.5 text-center font-sans">
                        <select
                          value={k.x}
                          onChange={e => handleUpdateKetepatan(idx, 'ketepatan', e.target.value as any)}
                          className={`rounded-md px-3 py-1 text-xs font-semibold border ${
                            k.isTepatWaktu
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                          }`}
                        >
                          <option value="Tepat Waktu">Tepat Waktu</option>
                          <option value="Tidak Tepat Waktu">Tidak Tepat Waktu</option>
                        </select>
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-sm">
                        <span className={k.isTepatWaktu ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {k.y}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => toggleKetepatan(idx)}
                          className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          {k.isTepatWaktu ? 'Setel Terlambat' : 'Setel Tepat Waktu'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className={`border-t font-semibold ${
                  isDark ? 'bg-slate-800/80 text-slate-200' : 'bg-slate-100 text-slate-800'
                }`}>
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-bold uppercase tracking-wider text-xs">
                      Rata-rata Ketepatan Waktu (AB6 = AVERAGE(Y5:Y16)):
                    </td>
                    <td className="px-4 py-3 text-right font-black text-sm text-blue-600 dark:text-blue-400 font-mono">
                      {report.ab6AvgKetepatan.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. KONTEN TAB: SUBTAB REKAPITULASI WORKBOOK (AB6:AD8) */}
      {activeSubTab === 'rekap' && (
        <div className="space-y-6">
          <div className={`rounded-2xl border p-6 shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
              Rekapitulasi Sheet &quot;Capaian Output&quot; (Sel AB6:AD8)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Struktur dan formula perhitungan deterministik mengikuti workbook resmi Kementerian Keuangan:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b font-semibold ${
                  isDark ? 'bg-slate-800/80 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <tr>
                    <th className="px-4 py-3 font-mono">Baris</th>
                    <th className="px-4 py-3 font-sans">Komponen Indikator</th>
                    <th className="px-4 py-3 font-mono text-right">Nilai Rata-rata (AB)</th>
                    <th className="px-4 py-3 font-mono text-center">Bobot (AC)</th>
                    <th className="px-4 py-3 font-mono text-right">Kontribusi Skor (AD)</th>
                    <th className="px-4 py-3 font-mono">Formula Excel Technical</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {/* Baris 6 */}
                  <tr className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'}>
                    <td className="px-4 py-3 font-bold text-slate-500">6</td>
                    <td className="px-4 py-3 font-sans font-medium">Ketepatan Waktu Pelaporan Capaian Output</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {report.ab6AvgKetepatan.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">30% (0.30)</td>
                    <td className="px-4 py-3 text-right font-black text-blue-600 dark:text-blue-400 text-sm">
                      {report.ad6KontribusiKetepatan.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      =AC6*AB6 / =0.30*AVERAGE(Y5:Y16)
                    </td>
                  </tr>

                  {/* Baris 7 */}
                  <tr className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'}>
                    <td className="px-4 py-3 font-bold text-slate-500">7</td>
                    <td className="px-4 py-3 font-sans font-medium">Capaian Rincian Output (RO) Terdaftar</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {report.ab7AvgCapaianRO.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">70% (0.70)</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {report.ad7KontribusiCapaianRO.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      =AC7*AB7 / =0.70*AVERAGE(R5:R63)
                    </td>
                  </tr>

                  {/* Baris 8 (FINAL) */}
                  <tr className="bg-emerald-50/70 dark:bg-emerald-950/30 font-bold border-t-2 border-emerald-500/30">
                    <td className="px-4 py-3 font-bold text-emerald-800 dark:text-emerald-300">8</td>
                    <td className="px-4 py-3 font-sans text-emerald-900 dark:text-emerald-200">
                      NILAI AKHIR CAPAIAN OUTPUT (KOMPONEN IKPA)
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">-</td>
                    <td className="px-4 py-3 text-center text-emerald-700 dark:text-emerald-300">100%</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-700 dark:text-emerald-300 text-base">
                      {report.ad8NilaiFinal.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-emerald-800 dark:text-emerald-300">
                      =SUM(AD6:AD7)
                    </td>
                  </tr>

                  {/* Bobot IKPA (M8) */}
                  <tr className="bg-slate-100/70 dark:bg-slate-800/70">
                    <td className="px-4 py-3 font-bold text-slate-500">M8</td>
                    <td className="px-4 py-3 font-sans font-medium">Nilai Terbobot pada Total IKPA Satker</td>
                    <td className="px-4 py-3 text-right text-slate-400">-</td>
                    <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{appliedWeight}%</td>
                    <td className="px-4 py-3 text-right font-black text-indigo-600 dark:text-indigo-400 text-base">
                      {report.nilaiTerbobot.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      =ROUND(AD8 * {appliedWeight}% / 100, 2)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL TAMBAH BARIS RO BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h4 className="text-base font-bold mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Tambah Rincian Output (RO) Baru
            </h4>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Kode RO</label>
                  <input
                    type="text"
                    placeholder="misal: '001 atau RO.01"
                    value={newRO.ro}
                    onChange={e => setNewRO({ ...newRO, ro: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Periode Bulan</label>
                  <select
                    value={newRO.bulan}
                    onChange={e => setNewRO({ ...newRO, bulan: Number(e.target.value) })}
                    className="w-full rounded-lg border px-3 py-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={idx} value={idx + 1}>Bulan {idx + 1} - {m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Uraian Rincian Output</label>
                <input
                  type="text"
                  placeholder="Nama output layanan..."
                  value={newRO.uraianRO}
                  onChange={e => setNewRO({ ...newRO, uraianRO: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Target (K)</label>
                  <input
                    type="number"
                    min={0}
                    value={newRO.target}
                    onChange={e => setNewRO({ ...newRO, target: Number(e.target.value) })}
                    className="w-full rounded-lg border px-3 py-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Realisasi (M)</label>
                  <input
                    type="number"
                    min={0}
                    value={newRO.realisasiRO}
                    onChange={e => setNewRO({ ...newRO, realisasiRO: Number(e.target.value) })}
                    className="w-full rounded-lg border px-3 py-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Progres % (N)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newRO.persenProgress}
                    onChange={e => setNewRO({ ...newRO, persenProgress: Number(e.target.value) })}
                    className="w-full rounded-lg border px-3 py-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Target PCRO % (P)</label>
                  <input
                    type="number"
                    min={0}
                    value={newRO.targetPCRO}
                    onChange={e => setNewRO({ ...newRO, targetPCRO: Number(e.target.value) })}
                    className="w-full rounded-lg border px-3 py-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Status Konfirmasi (O)</label>
                  <select
                    value={newRO.statusKonfirmasi}
                    onChange={e => setNewRO({ ...newRO, statusKonfirmasi: e.target.value as any })}
                    className="w-full rounded-lg border px-3 py-2 text-xs dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="terkonfirmasi">Terkonfirmasi</option>
                    <option value="tidak terkonfirmasi">Tidak Terkonfirmasi</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleAddRO}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
              >
                Simpan Baris RO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL GOLDEN TEST VERIFICATION */}
      {showGoldenTestModal && goldenTestResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 shadow-xl max-h-[85vh] overflow-y-auto ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Verifikasi Hasil Golden Test Capaian Output
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit deterministik terhadap 8 skenario pengujian workbook resmi
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                goldenTestResult.allPassed
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {goldenTestResult.passedTests} / {goldenTestResult.totalTests} LULUS
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              {goldenTestResult.results.map((r) => (
                <div
                  key={r.id}
                  className={`p-3.5 rounded-xl border flex flex-col gap-1.5 ${
                    r.passed
                      ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20'
                      : 'border-rose-200 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {r.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-600" />
                      )}
                      {r.id}: {r.name}
                    </span>
                    <span className={`font-mono text-xs font-bold ${
                      r.passed ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                    }`}>
                      {r.passed ? 'PASSED (Diff 0.00)' : `FAILED (Diff ${r.diff})`}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    {r.details}
                  </p>
                  <div className="mt-1 flex items-center gap-4 text-[10px] font-mono text-slate-500">
                    <span>AD8 Aktual: <strong className="text-slate-800 dark:text-slate-200">{r.actualAD8.toFixed(2)}</strong></span>
                    <span>AD8 Ekspektasi: <strong className="text-slate-800 dark:text-slate-200">{r.expectedAD8.toFixed(2)}</strong></span>
                    <span>AD6 (Ketepatan): {r.actualAD6.toFixed(2)}</span>
                    <span>AD7 (Capaian): {r.actualAD7.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowGoldenTestModal(false)}
                className="rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white px-5 py-2 text-xs font-semibold hover:opacity-90"
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
