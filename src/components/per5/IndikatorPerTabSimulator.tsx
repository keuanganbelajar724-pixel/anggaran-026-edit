import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  Coins,
  CreditCard,
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Percent,
  Sliders,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
  HelpCircle,
  Plus,
  Trash2,
  RotateCcw,
  ShieldCheck,
  Zap,
  Building,
  ArrowUpDown,
  FileSpreadsheet,
  Download,
  Upload,
  Printer,
  Copy,
  Edit2,
  Save
} from 'lucide-react';
import { SatkerIKPA, AppTheme, PerhitunganIkpaExcelReference } from '../../types';
import { SimulationProject } from '../../models/ikpa';
import { calculateIKPA } from '../../calculations/ikpa';
import { getWorkbookSampleProject } from '../../calculations/sampleWorkbookData';
import { sanitizeProjectDates } from '../../utils/ikpaDateUtils';
import {
  getAllProjects,
  getProjectById,
  saveProject,
  deleteProject,
  duplicateProject,
  getActiveProjectId,
  setActiveProjectId,
  createEmptyProject
} from '../../storage/indexedDb';

import { FormulaInspectorModal } from './formulaInspectorModal';
import { InterfaceTab } from './tabs/InterfaceTab';
import { DashboardTab } from './tabs/DashboardTab';
import { RevisiDipaTab } from './tabs/RevisiDipaTab';
import { DeviasiHal3Tab } from './tabs/DeviasiHal3Tab';
import { PenyerapanTab } from './tabs/PenyerapanTab';
import { KontraktualTab } from './tabs/KontraktualTab';
import { TagihanTab } from './tabs/TagihanTab';
import { UpTupTab } from './tabs/UpTupTab';
import { CapaianOutputTab } from './tabs/CapaianOutputTab';
import { DispensasiTab } from './tabs/DispensasiTab';
import { SkenarioTab } from './tabs/SkenarioTab';

export type MasterSimulatorTab =
  | 'interface'
  | 'dashboard'
  | 'revisi-dipa'
  | 'deviasi-hal3'
  | 'penyerapan'
  | 'kontraktual'
  | 'tagihan'
  | 'up-tup'
  | 'capaian-output'
  | 'dispensasi-spm'
  | 'skenario';

interface IndikatorPerTabSimulatorProps {
  satkers?: SatkerIKPA[];
  selectedSatkerId?: string;
  onSelectSatker?: (satkerId: string) => void;
  onApplyScoreToMainSimulator?: (indicatorId: string, score: number) => void;
  activeExcelReference?: PerhitunganIkpaExcelReference;
  theme: AppTheme;
  initialTab?: MasterSimulatorTab;
}

export const IndikatorPerTabSimulator: React.FC<IndikatorPerTabSimulatorProps> = ({
  satkers = [],
  selectedSatkerId,
  onSelectSatker,
  onApplyScoreToMainSimulator,
  theme,
  initialTab = 'interface'
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<MasterSimulatorTab>(
    initialTab === 'dashboard' ? 'interface' : initialTab
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab === 'dashboard' ? 'interface' : initialTab);
    }
  }, [initialTab]);

  const [projects, setProjects] = useState<SimulationProject[]>([]);
  const [activeProject, setActiveProject] = useState<SimulationProject>(() => {
    return createEmptyProject('Simulasi Mandiri (Mulai dari 0)');
  });
  const [baselineProject, setBaselineProject] = useState<SimulationProject>(() => {
    return createEmptyProject('Kondisi Awal (Mulai dari 0)');
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formula Inspector state
  const [inspectorState, setInspectorState] = useState<{
    isOpen: boolean;
    title: string;
    cell: string;
    formula: string;
    score: string;
    details: any[];
  }>({
    isOpen: false,
    title: '',
    cell: '',
    formula: '',
    score: '',
    details: []
  });

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load projects from IndexedDB / Storage on mount
  useEffect(() => {
    async function loadData() {
      try {
        const storedProjects = await getAllProjects();
        // Filter out automatic sample workbook project so user starts with a clean slate (0)
        const cleanProjects = storedProjects.filter(p => p.id !== 'proj_sample_workbook_2026');

        if (cleanProjects.length > 0) {
          const sanitizedProjects = cleanProjects.map(p => {
            const sanitized = sanitizeProjectDates(p);
            // If project has no ROs, ensure capaianOutput is clean at 0
            if (!sanitized.capaianOutput || sanitized.capaianOutput.length === 0) {
              sanitized.capaianOutputKetepatan = [];
            }
            // Clear hardcoded KPPN SEMARANG I and 411792 if present on generic simulation
            if (sanitized.metadata.namaSatker === 'KPPN SEMARANG I' || sanitized.metadata.kodeSatker === '411792') {
              sanitized.metadata.namaSatker = 'Simulasi Mandiri';
              sanitized.metadata.kodeSatker = '';
              sanitized.metadata.kodeKPPN = '';
            }
            sanitized.output = calculateIKPA(sanitized);
            return sanitized;
          });
          setProjects(sanitizedProjects);
          const activeId = getActiveProjectId();
          const current = sanitizedProjects.find(p => p.id === activeId) || sanitizedProjects[0];
          current.output = calculateIKPA(current);
          setActiveProject(current);
          const baseline = sanitizedProjects.find(p => p.isBaseline) || sanitizedProjects[0];
          baseline.output = calculateIKPA(baseline);
          setBaselineProject(baseline);
        } else {
          // Initialize with zero project (all inputs at 0)
          const cleanZero = createEmptyProject('Simulasi Mandiri (Mulai dari 0)');
          await saveProject(cleanZero);
          setProjects([cleanZero]);
          setActiveProject(cleanZero);
          setBaselineProject(cleanZero);
          setActiveProjectId(cleanZero.id);
        }
      } catch (err) {
        console.error('Failed to load projects from storage:', err);
      }
    }
    loadData();
  }, []);

  // Handle Project update
  const handleUpdateProject = (updated: SimulationProject) => {
    const sanitized = sanitizeProjectDates(updated);
    const recomputed: SimulationProject = {
      ...sanitized,
      updatedAt: new Date().toISOString()
    };
    recomputed.output = calculateIKPA(recomputed);
    setActiveProject(recomputed);

    // Save to IndexedDB
    saveProject(recomputed).then(() => {
      setProjects(prev => prev.map(p => p.id === recomputed.id ? recomputed : p));
    }).catch(err => {
      console.warn('Auto-save error:', err);
    });
  };

  // Switch active project
  const handleSelectProject = (id: string) => {
    const target = projects.find(p => p.id === id);
    if (target) {
      target.output = calculateIKPA(target);
      setActiveProject(target);
      setActiveProjectId(id);
      showNotification(`Memuat skenario: ${target.name}`, 'info');
    }
  };

  // Create new project
  const handleCreateNewProject = async () => {
    const name = `Simulasi ${projects.length + 1}`;
    const newProj = createEmptyProject(name, false);
    await saveProject(newProj);
    setProjects(prev => [...prev, newProj]);
    setActiveProject(newProj);
    setActiveProjectId(newProj.id);
    showNotification(`Skenario baru dibuat: ${name}`);
  };

  // Duplicate project
  const handleDuplicateProject = async () => {
    const copyName = `${activeProject.name} (Salinan)`;
    const duplicated = await duplicateProject(activeProject.id, copyName);
    if (duplicated) {
      setProjects(prev => [...prev, duplicated]);
      setActiveProject(duplicated);
      setActiveProjectId(duplicated.id);
      showNotification(`Berhasil menduplikasi skenario: ${copyName}`);
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string) => {
    if (projects.length <= 1) {
      showNotification('Tidak dapat menghapus skenario satu-satunya.', 'error');
      return;
    }
    await deleteProject(id);
    const remaining = projects.filter(p => p.id !== id);
    setProjects(remaining);
    const nextActive = remaining[0];
    nextActive.output = calculateIKPA(nextActive);
    setActiveProject(nextActive);
    setActiveProjectId(nextActive.id);
    showNotification('Skenario berhasil dihapus.');
  };

  // Reset all simulation data to 0 (clean slate)
  const handleResetToZero = async () => {
    const cleanZero = createEmptyProject('Simulasi Mandiri (Mulai dari 0)');
    await saveProject(cleanZero);
    setProjects(prev => {
      const filtered = prev.filter(p => p.id !== cleanZero.id && p.id !== 'proj_sample_workbook_2026');
      return [cleanZero, ...filtered];
    });
    setActiveProject(cleanZero);
    setBaselineProject(cleanZero);
    setActiveProjectId(cleanZero.id);
    showNotification('Simulasi berhasil di-reset: seluruh data & indikator kembali ke 0.', 'success');
  };

  // Reset to sample workbook
  const handleLoadSampleWorkbook = async () => {
    const sample = getWorkbookSampleProject();
    sample.name = 'Data Referensi Workbook 2026';
    sample.output = calculateIKPA(sample);
    await saveProject(sample);
    setProjects(prev => {
      const exists = prev.find(p => p.id === sample.id);
      return exists ? prev.map(p => p.id === sample.id ? sample : p) : [...prev, sample];
    });
    setActiveProject(sample);
    setBaselineProject(sample);
    setActiveProjectId(sample.id);
    showNotification('Berhasil memuat data referensi Workbook Excel 2026.', 'info');
  };

  // Mode Toggle: Excel Compatible vs Validation
  const toggleCalculationMode = () => {
    const nextMode = activeProject.calculationMode === 'excel_compatible' ? 'validation' : 'excel_compatible';
    const updated: SimulationProject = {
      ...activeProject,
      calculationMode: nextMode
    };
    handleUpdateProject(updated);
    showNotification(
      nextMode === 'excel_compatible'
        ? 'Mode beralih ke: Excel Compatible (Default 100% Formula Workbook)'
        : 'Mode beralih ke: Standard / Validation Mode',
      'info'
    );
  };

  // Rename current project
  const handleSaveName = () => {
    if (editedName.trim()) {
      handleUpdateProject({ ...activeProject, name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeProject, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `simulasi_ikpa_2026_${activeProject.name.replace(/\s+/g, '_')}.json`);
    dlAnchor.click();
    showNotification('Skenario simulasi diekspor sebagai JSON.');
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as SimulationProject;
        parsed.id = 'proj_' + Date.now();
        parsed.name = `${parsed.name || 'Imported'} (Impor)`;
        parsed.output = calculateIKPA(parsed);
        await saveProject(parsed);
        setProjects(prev => [...prev, parsed]);
        setActiveProject(parsed);
        setActiveProjectId(parsed.id);
        showNotification('Skenario simulasi berhasil diimpor!');
      } catch (err) {
        showNotification('Format file JSON tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!activeProject.output) return;
    const output = activeProject.output;
    const lines = [
      'Indikator IKPA,Bobot (%),Nilai Kinerja (Raw),Nilai Akhir (Capped),Nilai Tertimbang',
      `Revisi DIPA,${output.indicators.revisiDIPA.weight},${output.indicators.revisiDIPA.rawValue},${output.indicators.revisiDIPA.cappedValue},${output.indicators.revisiDIPA.weightedValue}`,
      `Deviasi Halaman III DIPA,${output.indicators.deviasiHalIII.weight},${output.indicators.deviasiHalIII.rawValue},${output.indicators.deviasiHalIII.cappedValue},${output.indicators.deviasiHalIII.weightedValue}`,
      `Penyerapan Anggaran,${output.indicators.penyerapan.weight},${output.indicators.penyerapan.rawValue},${output.indicators.penyerapan.cappedValue},${output.indicators.penyerapan.weightedValue}`,
      `Belanja Kontraktual,${output.indicators.belanjaKontraktual.weight},${output.indicators.belanjaKontraktual.rawValue},${output.indicators.belanjaKontraktual.cappedValue},${output.indicators.belanjaKontraktual.weightedValue}`,
      `Penyelesaian Tagihan,${output.indicators.penyelesaianTagihan.weight},${output.indicators.penyelesaianTagihan.rawValue},${output.indicators.penyelesaianTagihan.cappedValue},${output.indicators.penyelesaianTagihan.weightedValue}`,
      `Pengelolaan UP dan TUP,${output.indicators.pengelolaanUPTUP.weight},${output.indicators.pengelolaanUPTUP.rawValue},${output.indicators.pengelolaanUPTUP.cappedValue},${output.indicators.pengelolaanUPTUP.weightedValue}`,
      `Capaian Output,${output.indicators.capaianOutput.weight},${output.indicators.capaianOutput.rawValue},${output.indicators.capaianOutput.cappedValue},${output.indicators.capaianOutput.weightedValue}`,
      '',
      `Pengurang Dispensasi SPM TW IV,-,-,-,-${output.dispensasiReduction}`,
      `Total Tertimbang,-,-,-,${output.totalWeighted}`,
      `Konversi Bobot,-,-,-,${(output.weightConversion * 100).toFixed(0)}%`,
      `NILAI AKHIR IKPA,-,-,-,${output.finalScore}`,
      `PREDIKAT KINERJA,-,-,-,${output.predikat}`
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', csvContent);
    dlAnchor.setAttribute('download', `laporan_ikpa_2026_${activeProject.name.replace(/\s+/g, '_')}.csv`);
    dlAnchor.click();
    showNotification('Laporan CSV berhasil diunduh.');
  };

  // Open Formula Inspector
  const handleOpenInspector = (title: string, cell: string, formula: string, score: string, details: any[]) => {
    setInspectorState({
      isOpen: true,
      title,
      cell,
      formula,
      score,
      details
    });
  };

  const tabsConfig: { id: MasterSimulatorTab; label: string; icon: any; badge?: string }[] = [
    { id: 'interface', label: 'Interface (Ringkasan)', icon: ShieldCheck, badge: 'Utama' },
    { id: 'revisi-dipa', label: '1. Revisi DIPA', icon: FileText, badge: '10%' },
    { id: 'deviasi-hal3', label: '2. Deviasi Hal III', icon: Calendar, badge: '15%' },
    { id: 'penyerapan', label: '3. Penyerapan', icon: TrendingUp, badge: '20%' },
    { id: 'kontraktual', label: '4. Kontraktual', icon: Building, badge: '10%' },
    { id: 'tagihan', label: '5. Penyelesaian Tagihan', icon: Clock, badge: '10%' },
    { id: 'up-tup', label: '6. Pengelolaan UP/TUP', icon: Coins, badge: '10%' },
    { id: 'capaian-output', label: '7. Capaian Output', icon: Target, badge: '25%' },
    { id: 'dispensasi-spm', label: 'Dispensasi SPM', icon: AlertTriangle, badge: 'Minus' },
    { id: 'skenario', label: 'Perbandingan Skenario', icon: Layers }
  ];

  return (
    <div className={`space-y-6 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* 1. MASTER HEADER: Identitas Satker, Manajemen Skenario, Mode Switch, dan Tools */}
      <div className={`rounded-2xl border p-5 shadow-xs transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          {/* Skenario Selector & Project Name */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-600">
                MASTER SIMULATOR IKPA 2026
              </span>
              <span className="rounded-md bg-blue-500/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-blue-600">
                100% Logika Excel Workbook
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    className="rounded-xl border px-3 py-1 text-base font-bold dark:bg-slate-800 dark:border-slate-700"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {activeProject.name}
                  </h1>
                  <button
                    onClick={() => {
                      setEditedName(activeProject.name);
                      setIsEditingName(true);
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Ubah Nama Skenario"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>Skenario: <strong className="text-slate-700 dark:text-slate-200">{activeProject.metadata.namaSatker || 'Simulasi Mandiri'}</strong></span>
              {activeProject.metadata.kodeSatker && (
                <>
                  <span>•</span>
                  <span>Kode Satker: <strong className="font-mono text-slate-700 dark:text-slate-200">{activeProject.metadata.kodeSatker}</strong></span>
                </>
              )}
              {activeProject.metadata.kodeKPPN && (
                <>
                  <span>•</span>
                  <span>KPPN: <strong className="font-mono text-slate-700 dark:text-slate-200">{activeProject.metadata.kodeKPPN}</strong></span>
                </>
              )}
              <span>•</span>
              <span>TA: <strong className="font-mono text-slate-700 dark:text-slate-200">{activeProject.metadata.tahunAnggaran || 2026}</strong></span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Terbuka untuk Seluruh Satker</span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mode Toggle Switch */}
            <button
              onClick={toggleCalculationMode}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-xs transition-colors ${
                activeProject.calculationMode === 'excel_compatible'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-300 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Ganti Mode Kalkulasi"
            >
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
              Mode: {activeProject.calculationMode === 'excel_compatible' ? 'Excel Compatible' : 'Validation'}
            </button>

            {/* Skenario Dropdown */}
            <select
              value={activeProject.id}
              onChange={e => handleSelectProject(e.target.value)}
              className="rounded-xl border px-3 py-2 text-xs font-semibold dark:bg-slate-800 dark:border-slate-700 font-sans shadow-xs"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isBaseline ? '(Baseline)' : ''}
                </option>
              ))}
            </select>

            {/* Project Management Buttons */}
            <button
              onClick={handleCreateNewProject}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
              title="Buat Skenario Baru"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-600" /> Baru
            </button>

            <button
              onClick={handleDuplicateProject}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
              title="Duplikasi Skenario"
            >
              <Copy className="h-3.5 w-3.5 text-blue-600" /> Duplikasi
            </button>

            <button
              onClick={handleResetToZero}
              className="inline-flex items-center gap-1 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shadow-xs"
              title="Kosongkan seluruh data simulasi menjadi 0 (Mulai dari 0)"
            >
              <RotateCcw className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /> Reset ke 0
            </button>

            <button
              onClick={handleLoadSampleWorkbook}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
              title="Muat Data Contoh Workbook Excel 2026 (Sebagai Referensi)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Muat Contoh Workbook
            </button>

            {/* Export & Import Tools */}
            <button
              onClick={handleExportJson}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Ekspor Proyek JSON"
            >
              <Download className="h-4 w-4" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Impor Proyek JSON"
            >
              <Upload className="h-4 w-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJson}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={handleExportCsv}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Ekspor Laporan CSV"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Cetak Laporan Simulasi"
            >
              <Printer className="h-4 w-4" />
            </button>

            {projects.length > 1 && (
              <button
                onClick={() => handleDeleteProject(activeProject.id)}
                className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                title="Hapus Skenario Aktif"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Notification Bar */}
        {notification && (
          <div className={`mt-3 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
              : notification.type === 'error'
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
          }`}>
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {notification.message}
          </div>
        )}
      </div>

      {/* 2. DEDICATED NAVIGATION TABS (10 TABS) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 scrollbar-thin">
        {tabsConfig.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : isDark
                    ? 'bg-slate-900/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`rounded-md px-1.5 py-0.2 text-[10px] font-mono ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB VIEW CONTENT */}
      <div>
        {(activeTab === 'interface' || activeTab === 'dashboard') && (
          <InterfaceTab
            project={activeProject}
            onNavigateTab={(t) => setActiveTab(t === 'dashboard' ? 'interface' : t)}
            onOpenInspector={handleOpenInspector}
            onUpdateProject={handleUpdateProject}
            onResetProjectToClean={handleResetToZero}
            isDark={isDark}
          />
        )}

        {activeTab === 'revisi-dipa' && (
          <RevisiDipaTab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'deviasi-hal3' && (
          <DeviasiHal3Tab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'penyerapan' && (
          <PenyerapanTab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'kontraktual' && (
          <KontraktualTab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'tagihan' && (
          <TagihanTab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'up-tup' && (
          <UpTupTab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'capaian-output' && (
          <CapaianOutputTab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'dispensasi-spm' && (
          <DispensasiTab
            project={activeProject}
            onUpdateProject={handleUpdateProject}
            onOpenInspector={handleOpenInspector}
            isDark={isDark}
          />
        )}

        {activeTab === 'skenario' && (
          <SkenarioTab
            baselineProject={baselineProject}
            currentProject={activeProject}
            onApplyScenario={handleUpdateProject}
            isDark={isDark}
          />
        )}
      </div>

      {/* 4. FORMULA INSPECTOR MODAL */}
      <FormulaInspectorModal
        isOpen={inspectorState.isOpen}
        onClose={() => setInspectorState(prev => ({ ...prev, isOpen: false }))}
        title={inspectorState.title}
        excelCell={inspectorState.cell}
        excelFormula={inspectorState.formula}
        scoreFormatted={inspectorState.score}
        details={inspectorState.details}
        isDark={isDark}
      />
    </div>
  );
};
