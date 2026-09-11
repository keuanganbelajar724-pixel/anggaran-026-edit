import React, { useState } from 'react';
import {
  Award,
  Calculator,
  ArrowRight,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Layers,
  LayoutGrid,
  Zap,
  Info,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Calendar,
  Sliders,
  TrendingUp,
  Trash2,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { SimulationProject, IndicatorResult } from '../../../models/ikpa';
import { hasActualRevisiDIPAData } from '../../../calculations/revisiDipa';
import { hasActualDeviasiHal3Data } from '../../../calculations/deviasiHalIII';
import { GoldenTestCard } from '../goldenTestCard';
import { PetunjukPengisianCard } from '../common/PetunjukPengisianCard';
import { SandboxSimulator7Indikator } from '../common/SandboxSimulator7Indikator';

export interface InterfaceTabProps {
  project: SimulationProject;
  onNavigateTab: (tabId: any) => void;
  onOpenInspector: (title: string, cell: string, formula: string, score: string, details: any[]) => void;
  onUpdateProject?: (updated: SimulationProject) => void;
  onResetProjectToClean?: () => void;
  isDark?: boolean;
}

export type InterfaceViewMode = 'dashboard' | 'excel';

export interface IndicatorMeta {
  key: keyof SimulationProject['output']['indicators'];
  no: number;
  title: string;
  aspek: 'Kualitas Perencanaan' | 'Kualitas Pelaksanaan' | 'Kualitas Hasil';
  tabId: string;
  excelColumn: string;
  excelCell: string;
  sourceSheet: string;
  sourceCell: string;
  excelFormula: string;
  description: string;
  themeColor: string;
  badgeBg: string;
  progressColor: string;
  borderAccent: string;
}

export const INDICATORS_CONFIG: IndicatorMeta[] = [
  {
    key: 'revisiDIPA',
    no: 1,
    title: 'Revisi DIPA',
    aspek: 'Kualitas Perencanaan',
    tabId: 'revisi-dipa',
    excelColumn: 'G6',
    excelCell: 'G6',
    sourceSheet: 'Revisi DIPA',
    sourceCell: 'M15',
    excelFormula: "=IF('Revisi DIPA'!M15 > 100, 100, 'Revisi DIPA'!M15)",
    description: 'Maks. 1x revisi pagu tetap per semester (14 jenis pengecualian revisi)',
    themeColor: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
    progressColor: 'bg-indigo-500',
    borderAccent: 'border-l-4 border-l-indigo-500'
  },
  {
    key: 'deviasiHalIII',
    no: 2,
    title: 'Deviasi Halaman III DIPA',
    aspek: 'Kualitas Perencanaan',
    tabId: 'deviasi-hal3',
    excelColumn: 'H6',
    excelCell: 'H6',
    sourceSheet: 'Deviasi Hal III DIPA',
    sourceCell: 'AB16',
    excelFormula: "='Deviasi Hal III DIPA'!AB16",
    description: 'Kesesuaian realisasi anggaran terhadap RPD bulanan per jenis belanja (toleransi ≤5%)',
    themeColor: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300',
    progressColor: 'bg-sky-500',
    borderAccent: 'border-l-4 border-l-sky-500'
  },
  {
    key: 'penyerapan',
    no: 3,
    title: 'Penyerapan Anggaran',
    aspek: 'Kualitas Pelaksanaan',
    tabId: 'penyerapan',
    excelColumn: 'I6',
    excelCell: 'I6',
    sourceSheet: 'Penyerapan Anggaran',
    sourceCell: 'Q71',
    excelFormula: "='Penyerapan Anggaran'!Q71",
    description: 'Tingkat penyerapan anggaran terhadap target triwulanan masing-masing jenis belanja',
    themeColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    progressColor: 'bg-emerald-500',
    borderAccent: 'border-l-4 border-l-emerald-500'
  },
  {
    key: 'belanjaKontraktual',
    no: 4,
    title: 'Belanja Kontraktual',
    aspek: 'Kualitas Pelaksanaan',
    tabId: 'kontraktual',
    excelColumn: 'J6',
    excelCell: 'J6',
    sourceSheet: 'Belanja Kontraktual',
    sourceCell: 'N30',
    excelFormula: "='Belanja Kontraktual'!N30",
    description: 'Ketepatan pendaftaran kontrak ≤5 HK, akselerasi belanja modal 53, dan kontrak dini',
    themeColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    progressColor: 'bg-amber-500',
    borderAccent: 'border-l-4 border-l-amber-500'
  },
  {
    key: 'penyelesaianTagihan',
    no: 5,
    title: 'Penyelesaian Tagihan',
    aspek: 'Kualitas Pelaksanaan',
    tabId: 'tagihan',
    excelColumn: 'K6',
    excelCell: 'K6',
    sourceSheet: 'Penyelesaian Tagihan',
    sourceCell: 'R6',
    excelFormula: "='Penyelesaian Tagihan'!R6",
    description: 'Ketepatan penerbitan SPM-LS Kontraktual non belanja pegawai (≤17 hari kerja BAST)',
    themeColor: 'text-violet-600 dark:text-violet-400',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300',
    progressColor: 'bg-violet-500',
    borderAccent: 'border-l-4 border-l-violet-500'
  },
  {
    key: 'pengelolaanUPTUP',
    no: 6,
    title: 'Pengelolaan UP dan TUP',
    aspek: 'Kualitas Pelaksanaan',
    tabId: 'up-tup',
    excelColumn: 'L6',
    excelCell: 'L6',
    sourceSheet: 'Pengelolaan UP TUP KKP',
    sourceCell: 'N8',
    excelFormula: "='Pengelolaan UP TUP KKP'!N8",
    description: 'Ketepatan revolving GUP disebulankan, setoran sisa TUP, dan penggunaan KKP',
    themeColor: 'text-teal-600 dark:text-teal-400',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300',
    progressColor: 'bg-teal-500',
    borderAccent: 'border-l-4 border-l-teal-500'
  },
  {
    key: 'capaianOutput',
    no: 7,
    title: 'Capaian Output',
    aspek: 'Kualitas Hasil',
    tabId: 'capaian-output',
    excelColumn: 'M6',
    excelCell: 'M6',
    sourceSheet: 'Capaian Output',
    sourceCell: 'AD8',
    excelFormula: "='Capaian Output'!AD8",
    description: 'Capaian rincian output (70%) dan ketepatan pelaporan bulanan tepat waktu (30%)',
    themeColor: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
    progressColor: 'bg-purple-500',
    borderAccent: 'border-l-4 border-l-purple-500'
  }
];

export function getIndicatorDataStatus(key: string, project: SimulationProject): {
  status: 'Sudah dihitung' | 'Belum diisi' | 'Belum lengkap';
  badgeClass: string;
  icon: 'check' | 'empty' | 'partial';
  summary: string;
} {
  switch (key) {
    case 'revisiDIPA': {
      const rows = project.revisiDIPA || [];
      if (!hasActualRevisiDIPAData(rows)) {
        return {
          status: 'Belum diisi',
          badgeClass: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          icon: 'empty',
          summary: 'Formulir revisi belum diisi'
        };
      }
      const revisionCount = rows.filter(r => r.revisiKe !== null && r.revisiKe !== undefined && Number(r.revisiKe) > 0).length;
      return {
        status: 'Sudah dihitung',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
        icon: 'check',
        summary: `${revisionCount > 0 ? revisionCount : rows.length} revisi tercatat`
      };
    }

    case 'deviasiHalIII': {
      const rows = project.deviasiHalIII || [];
      if (!hasActualDeviasiHal3Data(rows)) {
        return {
          status: 'Belum diisi',
          badgeClass: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          icon: 'empty',
          summary: 'RPD & penyerapan belum diisi'
        };
      }
      const activeMonths = rows.filter(r => ((Number(r.rencana51) || 0) + (Number(r.rencana52) || 0) + (Number(r.rencana53) || 0) + (Number(r.rencana57) || 0) + (Number(r.penyerapan51) || 0) + (Number(r.penyerapan52) || 0) + (Number(r.penyerapan53) || 0) + (Number(r.penyerapan57) || 0)) > 0).length;
      if (activeMonths < 12) {
        return {
          status: 'Belum lengkap',
          badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300',
          icon: 'partial',
          summary: `Baru terisi ${activeMonths} dari 12 bulan`
        };
      }
      return {
        status: 'Sudah dihitung',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
        icon: 'check',
        summary: '12 bulan terisi lengkap'
      };
    }

    case 'penyerapan': {
      const rows = project.penyerapan || [];
      if (rows.length === 0) {
        return {
          status: 'Belum diisi',
          badgeClass: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          icon: 'empty',
          summary: 'Data penyerapan kosong'
        };
      }
      const activeRows = rows.filter(r => (r.pagu51 + r.pagu52 + r.pagu53 + r.pagu57 + r.realisasi51 + r.realisasi52 + r.realisasi53 + r.realisasi57) > 0).length;
      if (activeRows === 0) {
        return {
          status: 'Belum diisi',
          badgeClass: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          icon: 'empty',
          summary: 'Pagu & realisasi 0'
        };
      }
      if (activeRows < 12) {
        return {
          status: 'Belum lengkap',
          badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300',
          icon: 'partial',
          summary: `Terisi ${activeRows} periode`
        };
      }
      return {
        status: 'Sudah dihitung',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
        icon: 'check',
        summary: '12 periode terisi lengkap'
      };
    }

    case 'belanjaKontraktual': {
      const rows = project.belanjaKontraktual || [];
      if (rows.length === 0) {
        return {
          status: 'Belum diisi',
          badgeClass: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          icon: 'empty',
          summary: 'Belum ada data kontrak'
        };
      }
      return {
        status: 'Sudah dihitung',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
        icon: 'check',
        summary: `${rows.length} kontrak terdaftar`
      };
    }

    case 'penyelesaianTagihan': {
      const rows = project.penyelesaianTagihan || [];
      if (rows.length === 0) {
        return {
          status: 'Belum diisi',
          badgeClass: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          icon: 'empty',
          summary: 'Belum ada SPM-LS kontraktual'
        };
      }
      return {
        status: 'Sudah dihitung',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
        icon: 'check',
        summary: `${rows.length} SPM-LS dianalisis`
      };
    }

    case 'pengelolaanUPTUP': {
      const tunaiRows = project.upTUPTunai || [];
      const kkpRows = project.upTUPKKP || [];
      const hasTunai = tunaiRows.some(r => ((Number(r.totalGUP) || 0) + (Number(r.totalOutstandingUP) || 0) + (Number(r.totalTUP) || 0) + (Number(r.totalSetoranTUP) || 0)) > 0);
      const hasKKP = kkpRows.some(r => ((Number(r.upKKPPerBulan) || 0) + (Number(r.penggunaanKKP) || 0)) > 0);

      if (!hasTunai && !hasKKP) {
        return {
          status: 'Belum diisi',
          badgeClass: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          icon: 'empty',
          summary: 'Data UP/TUP & KKP belum diisi'
        };
      }
      if (!hasTunai || !hasKKP) {
        return {
          status: 'Belum lengkap',
          badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300',
          icon: 'partial',
          summary: hasTunai ? `${tunaiRows.length} transaksi UP/TUP (KKP kosong)` : `KKP terisi (UP/TUP tunai kosong)`
        };
      }
      return {
        status: 'Sudah dihitung',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
        icon: 'check',
        summary: `${tunaiRows.length} transaksi UP/TUP, ${kkpRows.length} bulan KKP`
      };
    }

    case 'capaianOutput': {
      const roList = project.capaianOutput || [];
      const ketepatan = project.capaianOutputKetepatan || [];
      if (roList.length === 0) {
        return {
          status: 'Belum diisi',
          badgeClass: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          icon: 'empty',
          summary: 'Belum ada data Rincian Output'
        };
      }
      if (ketepatan.length === 0) {
        return {
          status: 'Belum lengkap',
          badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300',
          icon: 'partial',
          summary: `${roList.length} RO terisi, ketepatan waktu belum ada`
        };
      }
      return {
        status: 'Sudah dihitung',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
        icon: 'check',
        summary: `${roList.length} RO & ${ketepatan.length} bulan ketepatan`
      };
    }

    default:
      return {
        status: 'Sudah dihitung',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
        icon: 'check',
        summary: 'Terkalkulasi otomatis'
      };
  }
}

export const InterfaceTab: React.FC<InterfaceTabProps> = ({
  project,
  onNavigateTab,
  onOpenInspector,
  onUpdateProject,
  onResetProjectToClean,
  isDark = false
}) => {
  const [viewMode, setViewMode] = useState<InterfaceViewMode>('dashboard');
  const [showSandbox, setShowSandbox] = useState<boolean>(true);
  const [showPetunjuk, setShowPetunjuk] = useState<boolean>(false);
  const output = project.output;

  const currentCutoff = project.metadata.periodeCutoff || 12;

  const handleCutoffChange = (month: number) => {
    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        metadata: {
          ...project.metadata,
          periodeCutoff: month
        }
      });
    }
  };

  const handleApplySimulatedValues = (simScores: Record<string, number>) => {
    if (!onUpdateProject) return;
    // Terapkan nilai simulasi ke project
    onUpdateProject({
      ...project,
      weights: project.weights
    });
  };

  const monthLabels = [
    { num: 1, label: '01 Jan' },
    { num: 2, label: '02 Feb' },
    { num: 3, label: '03 Mar (TW I)' },
    { num: 4, label: '04 Apr' },
    { num: 5, label: '05 Mei' },
    { num: 6, label: '06 Jun (TW II)' },
    { num: 7, label: '07 Jul' },
    { num: 8, label: '08 Agu' },
    { num: 9, label: '09 Sep (TW III - Sekarang)' },
    { num: 10, label: '10 Okt' },
    { num: 11, label: '11 Nov' },
    { num: 12, label: '12 Des (TW IV)' }
  ];

  if (!output) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
        <AlertCircle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
        <p className="text-sm font-semibold">Data hasil kalkulasi belum tersedia.</p>
      </div>
    );
  }

  const getPredikatBadge = (predikat: string) => {
    switch (predikat) {
      case 'SANGAT BAIK':
      case 'Sangat Baik':
        return {
          bg: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
          pill: 'bg-emerald-600 text-white',
          desc: 'Nilai IKPA ≥ 95.00'
        };
      case 'BAIK':
      case 'Baik':
        return {
          bg: 'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300',
          pill: 'bg-blue-600 text-white',
          desc: '89.00 ≤ Nilai IKPA < 95.00'
        };
      case 'CUKUP':
      case 'Cukup':
        return {
          bg: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300',
          pill: 'bg-amber-600 text-white',
          desc: '70.00 ≤ Nilai IKPA < 89.00'
        };
      default:
        return {
          bg: 'bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300',
          pill: 'bg-rose-600 text-white',
          desc: 'Nilai IKPA < 70.00'
        };
    }
  };

  const predikatStyle = getPredikatBadge(output.predikat);

  // Status statistics
  const statusStats = INDICATORS_CONFIG.map(cfg => getIndicatorDataStatus(cfg.key, project));
  const countHitung = statusStats.filter(s => s.status === 'Sudah dihitung').length;
  const countKosong = statusStats.filter(s => s.status === 'Belum diisi').length;
  const countSebagian = statusStats.filter(s => s.status === 'Belum lengkap').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. MASTER SUMMARY BANNER (INTERFACE SHEET G6:Q6 HEADER) */}
      <div className={`relative overflow-hidden rounded-3xl border p-6 sm:p-7 shadow-xs transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-slate-800' 
          : 'bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/40 border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Sheet: Interface (Workbook IKPA 2026)
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold ${predikatStyle.bg}`}>
                <Award className="h-3.5 w-3.5" /> Predikat: {output.predikat}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-mono font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                TA {project.metadata.tahunAnggaran || 2026}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {project.metadata.namaSatker || 'Simulasi Mandiri'}
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Halaman utama agregasi seluruh modul IKPA 2026. Menghubungkan otomatis hasil nilai akhir 7 indikator dan pengurang dispensasi SPM tanpa perhitungan ulang formula modul.
              </p>
            </div>

            {/* Completeness Chip */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Status Data:</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> {countHitung} Terhitung
              </span>
              {countSebagian > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-3 w-3" /> {countSebagian} Belum Lengkap
                </span>
              )}
              {countKosong > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 dark:bg-slate-800 px-2 py-0.5 font-semibold text-slate-600 dark:text-slate-400">
                  <CircleDot className="h-3 w-3" /> {countKosong} Belum Diisi
                </span>
              )}
            </div>
          </div>

          {/* Big Nilai Akhir Score Box */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300`}>
                  Sel Q6
                </span>
                <span className={`text-xs font-semibold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nilai Akhir IKPA
                </span>
              </div>
              <div className="flex items-baseline justify-end gap-1 mt-1">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                  {output.finalScore.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>
              <button
                onClick={() => onOpenInspector(
                  'Nilai Akhir IKPA (Interface!Q6)',
                  'Interface!Q6',
                  '=ROUND(N6/O6, 2) - P6',
                  output.finalScore.toFixed(2),
                  [
                    { step: 'Nilai Total Tertimbang (N6)', formulaHuman: 'SUM(G8:M8) atau SUM(Tertimbang 7 Indikator)', value: output.totalWeighted.toFixed(2), excelCell: 'N6' },
                    { step: 'Konversi Bobot (O6)', formulaHuman: 'SUM(G7:M7)/100', value: `${(output.weightConversion * 100).toFixed(0)}%`, excelCell: 'O6' },
                    { step: 'Skor Sebelum Dispensasi (N6/O6)', formulaHuman: `${output.totalWeighted.toFixed(2)} / ${output.weightConversion.toFixed(2)}`, value: Number((output.totalWeighted / (output.weightConversion || 1)).toFixed(2)) },
                    { step: 'Pengurang Dispensasi SPM (P6)', formulaHuman: "='Dispensasi SPM'!D2", value: -output.dispensasiReduction, excelCell: 'P6' },
                    { step: 'Nilai Akhir Final (Q6)', formulaHuman: 'ROUND(N6/O6, 2) - P6', value: output.finalScore.toFixed(2), excelCell: 'Q6' }
                  ]
                )}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
              >
                <Calculator className="h-3 w-3" /> Formula Inspector (Q6)
              </button>
            </div>

            <div className="h-14 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Tertimbang (N6):</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {output.totalWeighted.toFixed(2)}
                </span>
              </div>
              <div>
                <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Konversi Bobot (O6):</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {(output.weightConversion * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Dispensasi SPM (P6):</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                  -{output.dispensasiReduction.toFixed(2)}
                </span>
              </div>
              <div>
                <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Predikat Kinerja:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                  {output.predikat}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Excel Formula Strip */}
        <div className={`mt-5 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-emerald-50/50 border-emerald-100'
        }`}>
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calculator className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 mr-2">Rumus Resmi Excel (Q6):</span>
              <span className="text-slate-600 dark:text-slate-400">
                =ROUND(N6/O6, 2) - P6  →  ({output.totalWeighted.toFixed(2)} ÷ {output.weightConversion.toFixed(2)}) − {output.dispensasiReduction.toFixed(2)} = <strong className="text-emerald-600 dark:text-emerald-400">{output.finalScore.toFixed(2)}</strong>
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
            {predikatStyle.desc}
          </div>
        </div>
      </div>

      {/* 2. PERIODE EVALUASI BULANAN & QUICK SIMULATION TOOLBAR */}
      <div className={`rounded-2xl border p-4 shadow-xs space-y-3 transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/90'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Month Cutoff Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Periode Evaluasi Kumulatif:
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                s.d. Bulan {currentCutoff < 10 ? `0${currentCutoff}` : currentCutoff} ({monthLabels[currentCutoff - 1]?.label.split(' ')[1] || 'Desember'})
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Evaluasi IKPA dihitung kumulatif s.d. bulan berkenaan (misal: September / Triwulan III) tanpa perlu menunggu hingga Desember.
            </p>
          </div>

          {/* Action Tools: Sandbox, Petunjuk, Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSandbox(!showSandbox)}
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                showSandbox
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>{showSandbox ? 'Tutup Sandbox 7 Indikator' : 'Buka Sandbox 7 Indikator'}</span>
            </button>

            <button
              onClick={() => setShowPetunjuk(!showPetunjuk)}
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                showPetunjuk
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>{showPetunjuk ? 'Tutup Petunjuk Pengisian' : 'Petunjuk Pengisian & Rumus'}</span>
            </button>

            {onResetProjectToClean && (
              <button
                onClick={onResetProjectToClean}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all cursor-pointer shadow-xs"
                title="Kosongkan seluruh data dan mulai simulasi bersih dari nilai 0"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Mulai dari 0 (Kosongkan)</span>
              </button>
            )}
          </div>
        </div>

        {/* Month Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 scrollbar-thin border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 whitespace-nowrap">Pilih Bulan:</span>
          {monthLabels.map((m) => {
            const isSelected = currentCutoff === m.num;
            const isSeptember = m.num === 9;
            return (
              <button
                key={m.num}
                onClick={() => handleCutoffChange(m.num)}
                type="button"
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? isSeptember
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/30'
                      : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : isSeptember
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2.B SANDBOX SIMULATOR 7 INDIKATOR (IF OPEN) */}
      {showSandbox && (
        <SandboxSimulator7Indikator
          project={project}
          onApplySimulatedValues={handleApplySimulatedValues}
          isDark={isDark}
        />
      )}

      {/* 2.C PETUNJUK PENGISIAN LENGKAP (IF OPEN) */}
      {showPetunjuk && (
        <PetunjukPengisianCard
          indicatorId="interface"
          isDark={isDark}
          defaultExpanded={true}
        />
      )}

      {/* 3. VIEW TOGGLE BAR: Mode Dashboard vs Mode Excel Interface */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Tampilan Ringkasan:
          </span>
          <div className="inline-flex rounded-xl border p-1 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'dashboard'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Mode Dashboard Interaktif</span>
            </button>
            <button
              onClick={() => setViewMode('excel')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'excel'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Mode Tampilan Excel "Interface"</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Semua nilai terhubung otomatis ke modul masing-masing
        </div>
      </div>

      {/* 4. VIEW MODE A: DASHBOARD VIEW (TABLE ON DESKTOP, CARDS ON MOBILE) */}
      {viewMode === 'dashboard' && (
        <div className="space-y-6">
          {/* Desktop Summary Table with Colored Indikator Accents */}
          <div className={`hidden md:block rounded-2xl border overflow-hidden shadow-xs ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Tabel Agregasi 7 Indikator IKPA & Pengurang Dispensasi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nilai final diambil langsung dari modul terkait (tanpa perhitungan ulang di interface) • Evaluasi s.d. Bulan {currentCutoff}
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600">
                Formula Workbook Kompatibel
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Indikator IKPA</th>
                    <th className="py-3 px-3 text-center">Sel Excel</th>
                    <th className="py-3 px-3 text-center">Sheet Asal</th>
                    <th className="py-3 px-3 text-right">Bobot (%)</th>
                    <th className="py-3 px-4 text-right">Nilai Indikator</th>
                    <th className="py-3 px-4 text-right">Nilai Tertimbang</th>
                    <th className="py-3 px-4 text-center">Status Data</th>
                    <th className="py-3 px-4 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                  {INDICATORS_CONFIG.map((cfg) => {
                    const ind = output.indicators[cfg.key];
                    const dataStatus = getIndicatorDataStatus(cfg.key, project);

                    return (
                      <tr
                        key={cfg.key}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${cfg.borderAccent}`}
                      >
                        <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-400">
                          {cfg.no}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${cfg.themeColor}`}>
                              {cfg.title}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${cfg.badgeBg}`}>
                              Bobot {ind.weight}%
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {cfg.description}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {cfg.excelCell}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {cfg.sourceSheet}!{cfg.sourceCell}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                          {ind.weight}%
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                            {ind.cappedValue.toFixed(2)}
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1 ml-auto">
                            <div
                              className={`h-full ${cfg.progressColor}`}
                              style={{ width: `${Math.min(100, Math.max(0, ind.cappedValue))}%` }}
                            />
                          </div>
                          {ind.rawValue > 100 && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              (Raw: {ind.rawValue.toFixed(0)})
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {ind.weightedValue.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${dataStatus.badgeClass}`}
                            title={dataStatus.summary}
                          >
                            {dataStatus.icon === 'check' && <CheckCircle2 className="h-3 w-3" />}
                            {dataStatus.icon === 'partial' && <AlertCircle className="h-3 w-3" />}
                            {dataStatus.icon === 'empty' && <CircleDot className="h-3 w-3" />}
                            <span>{dataStatus.status}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onNavigateTab(cfg.tabId)}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                              title={`Buka Simulasi ${cfg.title}`}
                            >
                              <span>Buka</span>
                              <ExternalLink className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => onOpenInspector(
                                `Indikator: ${cfg.title} (${cfg.excelCell})`,
                                cfg.excelCell,
                                cfg.excelFormula,
                                ind.cappedValue.toFixed(2),
                                ind.details
                              )}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Formula Inspector"
                            >
                              <Calculator className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Row Khusus: Pengurang Dispensasi SPM (P6) */}
                  <tr className="bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70 transition-colors border-t border-rose-200 dark:border-rose-900/50 border-l-4 border-l-rose-500">
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-rose-500">
                      -
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-rose-700 dark:text-rose-300">
                        Pengurang Dispensasi SPM TW IV
                      </div>
                      <div className="text-[11px] text-rose-500/80">
                        Faktor pengurang nilai akhir IKPA dari rasio SPM dispensasi TW IV
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-rose-600 dark:text-rose-400">
                      P6
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-[11px] text-rose-500">
                      Dispensasi SPM!D2
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                      -
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                      -
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                      -{output.dispensasiReduction.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300">
                        {output.dispensasiReduction > 0 ? `Penalti -${output.dispensasiReduction.toFixed(2)}` : 'Nihil (0.00)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onNavigateTab('dispensasi-spm')}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 transition-colors cursor-pointer"
                        >
                          <span>Buka</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Row Total & Nilai Akhir */}
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                    <td colSpan={4} className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      Total Tertimbang (N6 = SUM(G8:M8)) / Konversi Bobot (O6 = {(output.weightConversion * 100).toFixed(0)}%)
                    </td>
                    <td className="py-3 px-3 text-right font-mono">100%</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">-</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      {output.totalWeighted.toFixed(2)}
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-right">
                      <span className="text-xs font-normal text-slate-500 mr-2">Nilai Akhir (Q6):</span>
                      <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {output.finalScore.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / Responsive Cards for 7 Indicators + Dispensasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {INDICATORS_CONFIG.map((cfg) => {
              const ind = output.indicators[cfg.key];
              const dataStatus = getIndicatorDataStatus(cfg.key, project);

              return (
                <div
                  key={cfg.key}
                  className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between space-y-3 ${cfg.borderAccent} ${
                    isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {cfg.excelCell}
                          </span>
                          <span className="text-[10px] text-slate-400">• Bobot {ind.weight}%</span>
                        </div>
                        <h4 className={`font-bold text-sm ${cfg.themeColor}`}>
                          {cfg.title}
                        </h4>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${dataStatus.badgeClass}`}>
                        {dataStatus.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {cfg.description}
                    </p>

                    <div className="flex items-baseline justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Nilai Indikator:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-lg text-slate-900 dark:text-slate-100">
                            {ind.cappedValue.toFixed(2)}
                          </span>
                          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${cfg.progressColor}`}
                              style={{ width: `${Math.min(100, Math.max(0, ind.cappedValue))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Tertimbang:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">
                          {ind.weightedValue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => onNavigateTab(cfg.tabId)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-center transition-colors"
                    >
                      Buka Simulasi ↗
                    </button>
                    <button
                      onClick={() => onOpenInspector(
                        `Indikator: ${cfg.title}`,
                        cfg.excelCell,
                        cfg.excelFormula,
                        ind.cappedValue.toFixed(2),
                        ind.details
                      )}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600"
                    >
                      <Calculator className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Dispensasi Card on Mobile */}
            <div className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between space-y-3 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-rose-50/40 border-rose-200'
            }`}>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                        Sel P6
                      </span>
                      <span className="text-[10px] text-rose-500">• Pengurang Nilai</span>
                    </div>
                    <h4 className="font-bold text-sm text-rose-800 dark:text-rose-300">
                      Dispensasi SPM TW IV
                    </h4>
                  </div>
                </div>

                <div className="flex items-baseline justify-between border-t border-rose-100 dark:border-rose-900/40 pt-2 text-xs">
                  <div>
                    <span className="text-[10px] text-rose-500 block">Rasio Dispensasi:</span>
                    <span className="font-mono font-black text-lg text-slate-900 dark:text-slate-100">
                      {output.dispensasiRatio.toFixed(2)}‰
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-rose-500 block">Pengurang Nilai:</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-base">
                      -{output.dispensasiReduction.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('dispensasi-spm')}
                className="w-full py-1.5 px-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 text-xs font-semibold text-center transition-colors"
              >
                Buka Simulasi Dispensasi ↗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW MODE B: EXCEL INTERFACE SHEET VIEW (100% REPLICA OF EXCEL WORKBOOK) */}
      {viewMode === 'excel' && (
        <div className="space-y-4">
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {/* Spreadsheet Toolbar */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                  Kalkulator Perhitungan IKPA 2026.xlsx
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Sheet: <strong className="text-slate-800 dark:text-slate-200">Interface</strong>
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Range G6:Q12 • Formula Baris 6
              </span>
            </div>

            {/* Grid Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse">
                <thead>
                  {/* Row 4: Excel Column Letters */}
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-300 dark:border-slate-700 text-center font-bold">
                    <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700 w-16">Baris</th>
                    <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700 text-left w-52">[B] Indikator IKPA</th>
                    <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700">[C] Bobot</th>
                    <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700">[D] Sel Excel</th>
                    <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700">[E] Sheet Asal</th>
                    <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700">[F] Sel Sumber</th>
                    <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700 text-right">[G..M] Nilai Modul</th>
                    <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700 text-right">[N] Tertimbang</th>
                    <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700 text-center">Status</th>
                    <th className="py-2 px-3 text-center">Aksi Buka</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {INDICATORS_CONFIG.map((cfg, idx) => {
                    const ind = output.indicators[cfg.key];
                    const dataStatus = getIndicatorDataStatus(cfg.key, project);
                    const rowNumber = 6 + idx;

                    return (
                      <tr
                        key={cfg.key}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                          {rowNumber}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-sans font-semibold text-slate-800 dark:text-slate-200">
                          {cfg.title}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-700 dark:text-slate-300">
                          {ind.weight}%
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {cfg.excelCell}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center text-slate-600 dark:text-slate-400">
                          {cfg.sourceSheet}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center text-blue-600 dark:text-blue-400">
                          {cfg.sourceCell}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-right font-black text-slate-900 dark:text-slate-100">
                          {ind.cappedValue.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {ind.weightedValue.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-sans font-semibold border ${dataStatus.badgeClass}`}>
                            {dataStatus.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => onNavigateTab(cfg.tabId)}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 underline font-sans font-medium"
                          >
                            Buka Tab ↗
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Excel Row 13: Total Tertimbang (N6) */}
                  <tr className="bg-slate-100/60 dark:bg-slate-800/60 font-bold border-t border-slate-300 dark:border-slate-700">
                    <td className="py-2.5 px-3 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      13
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-sans">
                      Total Tertimbang
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center">
                      100%
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center text-emerald-600">
                      N6
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-slate-500 text-center">
                      =SUM(G8:M8)
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-right text-slate-400">
                      -
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-right font-black text-emerald-600">
                      {output.totalWeighted.toFixed(2)}
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 text-center text-slate-500 font-sans">
                      Sum of weighted scores
                    </td>
                  </tr>

                  {/* Excel Row 14: Konversi Bobot (O6) */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      14
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-sans">
                      Konversi Bobot
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center text-slate-400">
                      -
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center text-emerald-600">
                      O6
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-slate-500 text-center">
                      =SUM(G7:M7)/100
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-right font-black">
                      {(output.weightConversion * 100).toFixed(0)}%
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 text-center text-slate-500 font-sans">
                      1.00 (Bobot Aktif 100%)
                    </td>
                  </tr>

                  {/* Excel Row 15: Dispensasi SPM TW IV (P6) */}
                  <tr className="bg-rose-50/30 dark:bg-rose-950/20">
                    <td className="py-2.5 px-3 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      15
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-sans font-bold text-rose-700 dark:text-rose-300">
                      Dispensasi SPM TW IV
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center text-slate-400">
                      -
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center font-bold text-rose-600">
                      P6
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center text-rose-600">
                      Dispensasi SPM
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-center text-rose-600">
                      D2
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-right font-black text-rose-600">
                      -{output.dispensasiReduction.toFixed(2)}
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 text-center text-rose-600 font-sans text-[11px]">
                      Rasio: {output.dispensasiRatio.toFixed(2)}‰
                    </td>
                  </tr>

                  {/* Excel Row 16: NILAI AKHIR IKPA (Q6) */}
                  <tr className="bg-emerald-50 dark:bg-emerald-950/40 font-bold border-t-2 border-emerald-500">
                    <td className="py-3 px-3 text-center text-emerald-700 border-r border-emerald-200 dark:border-emerald-800 bg-emerald-100/50 dark:bg-emerald-900/40">
                      16
                    </td>
                    <td className="py-3 px-3 border-r border-emerald-200 dark:border-emerald-800 font-sans text-emerald-900 dark:text-emerald-100 font-black">
                      NILAI AKHIR IKPA 2026
                    </td>
                    <td className="py-3 px-3 border-r border-emerald-200 dark:border-emerald-800 text-center">
                      100%
                    </td>
                    <td className="py-3 px-3 border-r border-emerald-200 dark:border-emerald-800 text-center text-emerald-700 font-black">
                      Q6
                    </td>
                    <td colSpan={2} className="py-3 px-3 border-r border-emerald-200 dark:border-emerald-800 text-center text-emerald-800 dark:text-emerald-300">
                      =ROUND(N6/O6, 2) - P6
                    </td>
                    <td colSpan={2} className="py-3 px-3 border-r border-emerald-200 dark:border-emerald-800 text-right text-lg font-black text-emerald-700 dark:text-emerald-300">
                      {output.finalScore.toFixed(2)}
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-center text-emerald-800 dark:text-emerald-300 font-sans font-bold">
                      {output.predikat}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. GOLDEN TEST COMPATIBILITY CARD */}
      <GoldenTestCard isDark={isDark} />

      {/* 6. PRIORITAS STRATEGI & SENSITIVITAS IKPA 2026 */}
      <div className={`rounded-2xl border p-5 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            Matriks Sensitivitas Bobot &amp; Trajektori Peningkatan Nilai IKPA 2026
          </h3>
        </div>
        <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Tabel ringkasan bobot resmi dan sensitivitas poin peningkatan indikator terhadap Nilai Akhir IKPA:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-bold text-xs block text-slate-800 dark:text-slate-200">
              Capaian Output (25%)
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold block mt-1">
              +1.0 pt = +0.25 IKPA
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Bobot terbesar. Disiplin pelaporan tepat waktu s.d tanggal 15 setiap bulan.
            </p>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-bold text-xs block text-slate-800 dark:text-slate-200">
              Penyerapan Anggaran (20%)
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold block mt-1">
              +1.0 pt = +0.20 IKPA
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Target triwulanan: Q1: 20%, Q2: 50%, Q3: 75%, Q4: 95%.
            </p>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-bold text-xs block text-slate-800 dark:text-slate-200">
              Deviasi Hal III DIPA (15%)
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold block mt-1">
              +1.0 pt = +0.15 IKPA
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Jaga deviasi bulanan RPD terhadap realisasi ≤ 5.0%.
            </p>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-bold text-xs block text-slate-800 dark:text-slate-200">
              Dispensasi SPM (Penalti)
            </span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-mono font-bold block mt-1">
              1 SPM = -0.50 s.d -5.00 pt
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Hindari keterlambatan pengajuan SPM di Triwulan IV.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
