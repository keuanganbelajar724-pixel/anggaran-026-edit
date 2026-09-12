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
  HelpCircle,
  FileText,
  Building,
  Clock,
  Coins,
  Target,
  AlertTriangle,
  Table,
  Check,
  ChevronRight
} from 'lucide-react';
import { SimulationProject, IndicatorResult, DEFAULT_WEIGHTS } from '../../../models/ikpa';
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
  shortTitle: string;
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
  // Bespoke Box (Kotak) Styling
  cardContainer: string;
  numberPill: string;
  cellBadge: string;
  statPodBg: string;
  scoreText: string;
  weightedText: string;
  btnCalculate: string;
  iconBg: string;
  trackBg: string;
  lightRowBg: string;
  icon: any;
}

export const INDICATORS_CONFIG: IndicatorMeta[] = [
  {
    key: 'revisiDIPA',
    no: 1,
    title: 'Revisi DIPA',
    shortTitle: 'Revisi DIPA',
    aspek: 'Kualitas Perencanaan',
    tabId: 'revisi-dipa',
    excelColumn: 'G6',
    excelCell: 'G6',
    sourceSheet: 'Revisi DIPA',
    sourceCell: 'M15',
    excelFormula: "=IF('Revisi DIPA'!M15 > 100, 100, 'Revisi DIPA'!M15)",
    description: 'Maks. 1x revisi pagu tetap per semester (14 jenis pengecualian revisi)',
    themeColor: 'text-indigo-700 dark:text-indigo-300',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
    progressColor: 'bg-indigo-600 dark:bg-indigo-500',
    borderAccent: 'border-l-4 border-l-indigo-500',
    cardContainer: 'border-indigo-200/90 dark:border-indigo-800/60 bg-gradient-to-b from-indigo-50/50 via-white to-white dark:from-indigo-950/25 dark:via-slate-900 dark:to-slate-900',
    numberPill: 'bg-indigo-600 text-white',
    cellBadge: 'bg-indigo-100/80 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700',
    statPodBg: 'bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50',
    scoreText: 'text-indigo-950 dark:text-white',
    weightedText: 'text-indigo-600 dark:text-indigo-400',
    btnCalculate: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/20',
    iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300',
    trackBg: 'bg-indigo-100 dark:bg-indigo-950',
    lightRowBg: 'hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20',
    icon: FileText
  },
  {
    key: 'deviasiHalIII',
    no: 2,
    title: 'Deviasi Halaman III DIPA',
    shortTitle: 'Deviasi Hal III',
    aspek: 'Kualitas Perencanaan',
    tabId: 'deviasi-hal3',
    excelColumn: 'H6',
    excelCell: 'H6',
    sourceSheet: 'Deviasi Hal III DIPA',
    sourceCell: 'AB16',
    excelFormula: "='Deviasi Hal III DIPA'!AB16",
    description: 'Kesesuaian realisasi anggaran thd RPD bulanan per jenis belanja (toleransi ≤5%)',
    themeColor: 'text-sky-700 dark:text-sky-300',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300',
    progressColor: 'bg-sky-600 dark:bg-sky-500',
    borderAccent: 'border-l-4 border-l-sky-500',
    cardContainer: 'border-sky-200/90 dark:border-sky-800/60 bg-gradient-to-b from-sky-50/50 via-white to-white dark:from-sky-950/25 dark:via-slate-900 dark:to-slate-900',
    numberPill: 'bg-sky-600 text-white',
    cellBadge: 'bg-sky-100/80 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200 border-sky-200 dark:border-sky-700',
    statPodBg: 'bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50',
    scoreText: 'text-sky-950 dark:text-white',
    weightedText: 'text-sky-600 dark:text-sky-400',
    btnCalculate: 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs shadow-sky-600/20',
    iconBg: 'bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300',
    trackBg: 'bg-sky-100 dark:bg-sky-950',
    lightRowBg: 'hover:bg-sky-50/40 dark:hover:bg-sky-950/20',
    icon: Calendar
  },
  {
    key: 'penyerapan',
    no: 3,
    title: 'Penyerapan Anggaran',
    shortTitle: 'Penyerapan',
    aspek: 'Kualitas Pelaksanaan',
    tabId: 'penyerapan',
    excelColumn: 'I6',
    excelCell: 'I6',
    sourceSheet: 'Penyerapan Anggaran',
    sourceCell: 'Q71',
    excelFormula: "='Penyerapan Anggaran'!Q71",
    description: 'Tingkat penyerapan anggaran thd target triwulanan masing-masing jenis belanja',
    themeColor: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    progressColor: 'bg-emerald-600 dark:bg-emerald-500',
    borderAccent: 'border-l-4 border-l-emerald-500',
    cardContainer: 'border-emerald-200/90 dark:border-emerald-800/60 bg-gradient-to-b from-emerald-50/50 via-white to-white dark:from-emerald-950/25 dark:via-slate-900 dark:to-slate-900',
    numberPill: 'bg-emerald-600 text-white',
    cellBadge: 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700',
    statPodBg: 'bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50',
    scoreText: 'text-emerald-950 dark:text-white',
    weightedText: 'text-emerald-600 dark:text-emerald-400',
    btnCalculate: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300',
    trackBg: 'bg-emerald-100 dark:bg-emerald-950',
    lightRowBg: 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20',
    icon: TrendingUp
  },
  {
    key: 'belanjaKontraktual',
    no: 4,
    title: 'Belanja Kontraktual',
    shortTitle: 'Kontraktual',
    aspek: 'Kualitas Pelaksanaan',
    tabId: 'kontraktual',
    excelColumn: 'J6',
    excelCell: 'J6',
    sourceSheet: 'Belanja Kontraktual',
    sourceCell: 'N30',
    excelFormula: "='Belanja Kontraktual'!N30",
    description: 'Ketepatan pendaftaran kontrak ≤5 HK, akselerasi belanja modal 53, & kontrak dini',
    themeColor: 'text-amber-800 dark:text-amber-300',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    progressColor: 'bg-amber-600 dark:bg-amber-500',
    borderAccent: 'border-l-4 border-l-amber-500',
    cardContainer: 'border-amber-200/90 dark:border-amber-800/60 bg-gradient-to-b from-amber-50/50 via-white to-white dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900',
    numberPill: 'bg-amber-600 text-white',
    cellBadge: 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-200 dark:border-amber-700',
    statPodBg: 'bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50',
    scoreText: 'text-amber-950 dark:text-white',
    weightedText: 'text-amber-700 dark:text-amber-400',
    btnCalculate: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs shadow-amber-600/20',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300',
    trackBg: 'bg-amber-100 dark:bg-amber-950',
    lightRowBg: 'hover:bg-amber-50/40 dark:hover:bg-amber-950/20',
    icon: Building
  },
  {
    key: 'penyelesaianTagihan',
    no: 5,
    title: 'Penyelesaian Tagihan',
    shortTitle: 'Tagihan LS',
    aspek: 'Kualitas Pelaksanaan',
    tabId: 'tagihan',
    excelColumn: 'K6',
    excelCell: 'K6',
    sourceSheet: 'Penyelesaian Tagihan',
    sourceCell: 'R6',
    excelFormula: "='Penyelesaian Tagihan'!R6",
    description: 'Ketepatan penerbitan SPM-LS Kontraktual non belanja pegawai (≤17 HK BAST)',
    themeColor: 'text-violet-700 dark:text-violet-300',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300',
    progressColor: 'bg-violet-600 dark:bg-violet-500',
    borderAccent: 'border-l-4 border-l-violet-500',
    cardContainer: 'border-violet-200/90 dark:border-violet-800/60 bg-gradient-to-b from-violet-50/50 via-white to-white dark:from-violet-950/25 dark:via-slate-900 dark:to-slate-900',
    numberPill: 'bg-violet-600 text-white',
    cellBadge: 'bg-violet-100/80 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200 border-violet-200 dark:border-violet-700',
    statPodBg: 'bg-violet-50/70 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/50',
    scoreText: 'text-violet-950 dark:text-white',
    weightedText: 'text-violet-600 dark:text-violet-400',
    btnCalculate: 'bg-violet-600 hover:bg-violet-700 text-white shadow-xs shadow-violet-600/20',
    iconBg: 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300',
    trackBg: 'bg-violet-100 dark:bg-violet-950',
    lightRowBg: 'hover:bg-violet-50/40 dark:hover:bg-violet-950/20',
    icon: Clock
  },
  {
    key: 'pengelolaanUPTUP',
    no: 6,
    title: 'Pengelolaan UP dan TUP',
    shortTitle: 'UP & TUP KKP',
    aspek: 'Kualitas Pelaksanaan',
    tabId: 'up-tup',
    excelColumn: 'L6',
    excelCell: 'L6',
    sourceSheet: 'Pengelolaan UP TUP KKP',
    sourceCell: 'N8',
    excelFormula: "='Pengelolaan UP TUP KKP'!N8",
    description: 'Ketepatan revolving GUP disebulankan, setoran sisa TUP, & persentase KKP',
    themeColor: 'text-teal-700 dark:text-teal-300',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300',
    progressColor: 'bg-teal-600 dark:bg-teal-500',
    borderAccent: 'border-l-4 border-l-teal-500',
    cardContainer: 'border-teal-200/90 dark:border-teal-800/60 bg-gradient-to-b from-teal-50/50 via-white to-white dark:from-teal-950/25 dark:via-slate-900 dark:to-slate-900',
    numberPill: 'bg-teal-600 text-white',
    cellBadge: 'bg-teal-100/80 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 border-teal-200 dark:border-teal-700',
    statPodBg: 'bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/50',
    scoreText: 'text-teal-950 dark:text-white',
    weightedText: 'text-teal-600 dark:text-teal-400',
    btnCalculate: 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs shadow-teal-600/20',
    iconBg: 'bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-300',
    trackBg: 'bg-teal-100 dark:bg-teal-950',
    lightRowBg: 'hover:bg-teal-50/40 dark:hover:bg-teal-950/20',
    icon: Coins
  },
  {
    key: 'capaianOutput',
    no: 7,
    title: 'Capaian Output',
    shortTitle: 'Capaian Output',
    aspek: 'Kualitas Hasil',
    tabId: 'capaian-output',
    excelColumn: 'M6',
    excelCell: 'M6',
    sourceSheet: 'Capaian Output',
    sourceCell: 'AD8',
    excelFormula: "='Capaian Output'!AD8",
    description: 'Capaian rincian output (70%) & ketepatan pelaporan bulanan tepat waktu (30%)',
    themeColor: 'text-purple-700 dark:text-purple-300',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
    progressColor: 'bg-purple-600 dark:bg-purple-500',
    borderAccent: 'border-l-4 border-l-purple-500',
    cardContainer: 'border-purple-200/90 dark:border-purple-800/60 bg-gradient-to-b from-purple-50/50 via-white to-white dark:from-purple-950/25 dark:via-slate-900 dark:to-slate-900',
    numberPill: 'bg-purple-600 text-white',
    cellBadge: 'bg-purple-100/80 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border-purple-200 dark:border-purple-700',
    statPodBg: 'bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50',
    scoreText: 'text-purple-950 dark:text-white',
    weightedText: 'text-purple-600 dark:text-purple-400',
    btnCalculate: 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs shadow-purple-600/20',
    iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300',
    trackBg: 'bg-purple-100 dark:bg-purple-950',
    lightRowBg: 'hover:bg-purple-50/40 dark:hover:bg-purple-950/20',
    icon: Target
  }
];

export const DISPENSASI_CONFIG = {
  key: 'dispensasi-spm' as const,
  no: 8,
  title: 'Dispensasi SPM TW IV',
  shortTitle: 'Dispensasi SPM',
  aspek: 'Faktor Pengurang' as const,
  tabId: 'dispensasi-spm',
  excelColumn: 'P6',
  excelCell: 'P6',
  sourceSheet: 'Dispensasi SPM',
  sourceCell: 'D2',
  excelFormula: "='Dispensasi SPM'!D2",
  description: 'Pengurang nilai akibat keterlambatan / dispensasi SPM di Triwulan IV (-0.50 s.d -5.00 pt)',
  themeColor: 'text-rose-700 dark:text-rose-300',
  badgeBg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
  progressColor: 'bg-rose-600 dark:bg-rose-500',
  borderAccent: 'border-l-4 border-l-rose-500',
  cardContainer: 'border-rose-200/90 dark:border-rose-800/60 bg-gradient-to-b from-rose-50/50 via-white to-white dark:from-rose-950/25 dark:via-slate-900 dark:to-slate-900',
  numberPill: 'bg-rose-600 text-white',
  cellBadge: 'bg-rose-100/80 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border-rose-200 dark:border-rose-700',
  statPodBg: 'bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50',
  scoreText: 'text-rose-950 dark:text-white',
  weightedText: 'text-rose-600 dark:text-rose-400',
  btnCalculate: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs shadow-rose-600/20',
  iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300',
  trackBg: 'bg-rose-100 dark:bg-rose-950',
  lightRowBg: 'hover:bg-rose-50/40 dark:hover:bg-rose-950/20',
  icon: AlertTriangle
};

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
  const [displayStyle, setDisplayStyle] = useState<'cards' | 'table' | 'both'>('cards');
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
          bg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:text-emerald-200 dark:bg-emerald-950/40',
          pill: 'bg-emerald-600 text-white',
          desc: 'Nilai IKPA ≥ 95.00'
        };
      case 'BAIK':
      case 'Baik':
        return {
          bg: 'bg-blue-500/15 text-blue-800 border-blue-500/30 dark:text-blue-200 dark:bg-blue-950/40',
          pill: 'bg-blue-600 text-white',
          desc: '89.00 ≤ Nilai IKPA < 95.00'
        };
      case 'CUKUP':
      case 'Cukup':
        return {
          bg: 'bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-200 dark:bg-amber-950/40',
          pill: 'bg-amber-600 text-white',
          desc: '70.00 ≤ Nilai IKPA < 89.00'
        };
      default:
        return {
          bg: 'bg-rose-500/15 text-rose-800 border-rose-500/30 dark:text-rose-200 dark:bg-rose-950/40',
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
          : 'bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/40 border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
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
                Halaman agregasi resmi seluruh modul IKPA 2026. Menghubungkan otomatis hasil nilai akhir 7 indikator dan pengurang dispensasi SPM tanpa perhitungan ulang formula modul.
              </p>
            </div>

            {/* Completeness Chip */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Status Data:</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-0.5 font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" /> {countHitung} Terhitung
              </span>
              {countSebagian > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2.5 py-0.5 font-bold text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <AlertCircle className="h-3.5 w-3.5" /> {countSebagian} Belum Lengkap
                </span>
              )}
              {countKosong > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 font-semibold text-slate-600 dark:text-slate-400">
                  <CircleDot className="h-3.5 w-3.5" /> {countKosong} Belum Diisi
                </span>
              )}
            </div>
          </div>

          {/* Enhanced Scoreboard with Themed Metric Pods */}
          <div className="flex flex-wrap items-stretch gap-3 sm:gap-4 shrink-0">
            {/* Main Score Pod (Q6) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-teal-500/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30 border-2 border-emerald-500/30 text-right min-w-[190px] flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    Sel Q6
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Nilai Akhir IKPA
                  </span>
                </div>
                <div className="flex items-baseline justify-end gap-1.5 mt-2">
                  <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                    {output.finalScore.toFixed(2)}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
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
                className="mt-3 inline-flex items-center justify-end gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer"
              >
                <Calculator className="h-3.5 w-3.5" /> Formula Inspector (Q6)
              </button>
            </div>

            {/* 4 Pods for N6, O6, P6, Predikat */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs min-w-[240px]">
              {/* N6 Total Tertimbang */}
              <div className="p-3 rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/70 dark:bg-sky-950/30 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-sky-800 dark:text-sky-300 uppercase tracking-wider block">
                  Total Tertimbang (N6)
                </span>
                <div className="mt-1">
                  <span className="font-mono font-black text-xl text-sky-900 dark:text-sky-100">
                    {output.totalWeighted.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 block mt-0.5">
                    Σ 7 Indikator
                  </span>
                </div>
              </div>

              {/* O6 Konversi Bobot */}
              <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/70 dark:bg-indigo-950/30 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider block">
                  Konversi Bobot (O6)
                </span>
                <div className="mt-1">
                  <span className="font-mono font-black text-xl text-indigo-900 dark:text-indigo-100">
                    {(output.weightConversion * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block mt-0.5">
                    Total bobot aktif
                  </span>
                </div>
              </div>

              {/* P6 Dispensasi SPM */}
              <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/70 dark:bg-rose-950/30 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
                  Dispensasi SPM (P6)
                </span>
                <div className="mt-1">
                  <span className="font-mono font-black text-xl text-rose-700 dark:text-rose-300">
                    -{output.dispensasiReduction.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-0.5">
                    Pengurang TW IV
                  </span>
                </div>
              </div>

              {/* Predikat Kinerja */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${predikatStyle.bg}`}>
                <span className="text-[11px] font-semibold uppercase tracking-wider block">
                  Predikat Kinerja
                </span>
                <div className="mt-1">
                  <span className="font-sans font-black text-lg block leading-tight">
                    {output.predikat}
                  </span>
                  <span className="text-[10px] opacity-80 block mt-0.5">
                    {predikatStyle.desc}
                  </span>
                </div>
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
      <div className="flex flex-wrap items-center justify-between gap-3 p-1">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border p-1 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'excel'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Mode Format Excel Resmi (G6:Q16)</span>
            </button>
          </div>

          {/* Sub-selector for Dashboard: Cards vs Table vs Both */}
          {viewMode === 'dashboard' && (
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2">Tata Letak:</span>
              <button
                type="button"
                onClick={() => setDisplayStyle('cards')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  displayStyle === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Tampilkan 8 Kotak Simulasi Berwarna"
              >
                <LayoutGrid className="h-3.5 w-3.5 text-emerald-600" />
                <span>8 Kotak Uji Coba</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayStyle('table')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  displayStyle === 'table'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Tampilkan Tabel Agregasi Lengkap"
              >
                <Table className="h-3.5 w-3.5 text-blue-600" />
                <span>Tabel Ringkasan</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayStyle('both')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  displayStyle === 'both'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Tampilkan Kotak dan Tabel Sekaligus"
              >
                <Layers className="h-3.5 w-3.5 text-purple-600" />
                <span>Keduanya</span>
              </button>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>7 Indikator &amp; 1 Pengurang Terintegrasi Otomatis</span>
        </div>
      </div>

      {/* 4. VIEW MODE A: DASHBOARD VIEW */}
      {viewMode === 'dashboard' && (
        <div className="space-y-6">
          {/* A.1 GRID 8 KOTAK INDIKATOR SIMULASI BERWARNA (TERBAIK UNTUK UJI COBA & HITUNG) */}
          {(displayStyle === 'cards' || displayStyle === 'both') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      8 Kotak Simulasi &amp; Uji Coba IKPA 2026
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Pewarnaan tematik per indikator untuk mempermudah perhitungan, simulasi nilai, dan verifikasi rumus workbook.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Total 100% Bobot
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {INDICATORS_CONFIG.map((cfg) => {
                  const ind = output.indicators[cfg.key] || {
                    rawValue: 0,
                    cappedValue: 0,
                    weight: project.weights?.[cfg.key] ?? DEFAULT_WEIGHTS[cfg.key] ?? 0,
                    weightedValue: 0,
                    isActive: true,
                    details: []
                  };
                  const dataStatus = getIndicatorDataStatus(cfg.key, project);
                  const IconComp = cfg.icon;

                  return (
                    <div
                      key={cfg.key}
                      className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between space-y-3.5 transition-all duration-200 hover:shadow-md ${cfg.cardContainer}`}
                    >
                      {/* Top Badges Header */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {/* Number Pill */}
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${cfg.numberPill}`}>
                              {cfg.no}
                            </span>
                            {/* Excel Cell Pill */}
                            <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold border ${cfg.cellBadge}`} title={`Sel di sheet Interface: ${cfg.excelCell}`}>
                              Sel {cfg.excelCell}
                            </span>
                            {/* Weight Pill */}
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${cfg.badgeBg}`}>
                              Bobot {ind.weight}%
                            </span>
                          </div>

                          {/* Status Pill */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${dataStatus.badgeClass}`}
                            title={dataStatus.summary}
                          >
                            {dataStatus.icon === 'check' && <CheckCircle2 className="h-3 w-3" />}
                            {dataStatus.icon === 'partial' && <AlertCircle className="h-3 w-3" />}
                            {dataStatus.icon === 'empty' && <CircleDot className="h-3 w-3" />}
                            <span>{dataStatus.status}</span>
                          </span>
                        </div>

                        {/* Title & Sheet Source with Icon */}
                        <div className="flex items-start gap-2 pt-0.5">
                          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${cfg.iconBg}`}>
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className={`font-bold text-sm tracking-tight leading-snug ${cfg.themeColor}`}>
                              {cfg.title}
                            </h4>
                            <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              Sumber: {cfg.sourceSheet}!{cfg.sourceCell}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {cfg.description}
                        </p>
                      </div>

                      {/* Stat Pod: Score & Weighted Score */}
                      <div className="space-y-3">
                        <div className={`p-3 rounded-xl border ${cfg.statPodBg} space-y-2`}>
                          <div className="flex items-baseline justify-between">
                            <div>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                                Nilai Indikator
                              </span>
                              <div className="flex items-baseline gap-1 mt-0.5">
                                <span className={`text-2xl font-black font-mono tracking-tight ${cfg.scoreText}`}>
                                  {ind.cappedValue.toFixed(2)}
                                </span>
                                <span className="text-[11px] font-medium text-slate-400">/ 100</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                                Tertimbang
                              </span>
                              <div className={`text-base font-black font-mono mt-0.5 ${cfg.weightedText}`}>
                                {ind.weightedValue.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Themed Progress Bar */}
                          <div>
                            <div className={`w-full h-2 rounded-full overflow-hidden ${cfg.trackBg}`}>
                              <div
                                className={`h-full transition-all duration-300 ${cfg.progressColor}`}
                                style={{ width: `${Math.min(100, Math.max(0, ind.cappedValue))}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                              <span>0</span>
                              {ind.rawValue > 100 && (
                                <span className="text-amber-600 dark:text-amber-400 font-bold">
                                  Raw: {ind.rawValue.toFixed(1)} (Cap 100)
                                </span>
                              )}
                              <span>Target: 100</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => onNavigateTab(cfg.tabId)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${cfg.btnCalculate}`}
                            title={`Buka lembar kerja perhitungan ${cfg.title}`}
                          >
                            <span>Hitung / Simulasi</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenInspector(
                              `Indikator ${cfg.no}: ${cfg.title} (${cfg.excelCell})`,
                              cfg.excelCell,
                              cfg.excelFormula,
                              ind.cappedValue.toFixed(2),
                              ind.details
                            )}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 transition-all cursor-pointer shadow-xs"
                            title="Buka Formula Inspector Excel"
                          >
                            <Calculator className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 8th Kotak: PENGURANG DISPENSASI SPM TW IV (SEL P6) */}
                <div
                  className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between space-y-3.5 transition-all duration-200 hover:shadow-md ${DISPENSASI_CONFIG.cardContainer}`}
                >
                  {/* Top Header */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${DISPENSASI_CONFIG.numberPill}`}>
                          {DISPENSASI_CONFIG.no}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold border ${DISPENSASI_CONFIG.cellBadge}`}>
                          Sel {DISPENSASI_CONFIG.excelCell}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold border bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300">
                          Pengurang Akhir
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300">
                        {output.dispensasiReduction > 0 ? (
                          <>
                            <AlertTriangle className="h-3 w-3" />
                            <span>Ada Penalti</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Nihil (Aman)</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 pt-0.5">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${DISPENSASI_CONFIG.iconBg}`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className={`font-bold text-sm tracking-tight leading-snug ${DISPENSASI_CONFIG.themeColor}`}>
                          {DISPENSASI_CONFIG.title}
                        </h4>
                        <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          Sumber: {DISPENSASI_CONFIG.sourceSheet}!{DISPENSASI_CONFIG.sourceCell}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {DISPENSASI_CONFIG.description}
                    </p>
                  </div>

                  {/* Stat Pod */}
                  <div className="space-y-3">
                    <div className={`p-3 rounded-xl border ${DISPENSASI_CONFIG.statPodBg} space-y-2`}>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                            Rasio Dispensasi
                          </span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100">
                              {output.dispensasiRatio.toFixed(2)}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500">‰</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                            Pengurang Skor (P6)
                          </span>
                          <div className={`text-base font-black font-mono mt-0.5 ${DISPENSASI_CONFIG.scoreText}`}>
                            -{output.dispensasiReduction.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Warning bar */}
                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-700 dark:text-rose-300 font-medium">
                        {output.dispensasiReduction > 0
                          ? `Penalti langsung memotong ${output.dispensasiReduction.toFixed(2)} poin nilai akhir IKPA.`
                          : 'Tidak ada pengajuan SPM dispensasi pada Triwulan IV (Nihil penalti).'}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => onNavigateTab('dispensasi-spm')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${DISPENSASI_CONFIG.btnCalculate}`}
                        title="Buka simulasi Dispensasi SPM"
                      >
                        <span>Hitung Dispensasi</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenInspector(
                          'Pengurang Dispensasi SPM (P6)',
                          'Interface!P6',
                          "='Dispensasi SPM'!D2",
                          (-output.dispensasiReduction).toFixed(2),
                          [
                            { step: 'Rasio SPM Dispensasi TW IV', formulaHuman: 'SPM Dispensasi / Total SPM TW IV', value: `${output.dispensasiRatio.toFixed(2)}‰` },
                            { step: 'Faktor Pengurang Nilai Akhir (P6)', formulaHuman: 'Dihitung berdasarkan matriks penalti Per-5', value: -output.dispensasiReduction, excelCell: 'P6' }
                          ]
                        )}
                        className="p-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-white/80 dark:bg-slate-800 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer shadow-xs"
                        title="Buka Formula Inspector Dispensasi"
                      >
                        <Calculator className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* A.2 TABEL LENGKAP DENGAN AKSEN WARNA INDIKATOR */}
          {(displayStyle === 'table' || displayStyle === 'both') && (
            <div className={`rounded-2xl border overflow-hidden shadow-xs ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Table className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      Tabel Agregasi 7 Indikator IKPA &amp; Pengurang Dispensasi
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Nilai final diambil langsung dari modul terkait (tanpa perhitungan ulang di interface) • Evaluasi s.d. Bulan {currentCutoff}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
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
                      const ind = output.indicators[cfg.key] || {
                        rawValue: 0,
                        cappedValue: 0,
                        weight: project.weights?.[cfg.key] ?? DEFAULT_WEIGHTS[cfg.key] ?? 0,
                        weightedValue: 0,
                        isActive: true,
                        details: []
                      };
                      const dataStatus = getIndicatorDataStatus(cfg.key, project);
                      const IconComp = cfg.icon;

                      return (
                        <tr
                          key={cfg.key}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${cfg.lightRowBg}`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${cfg.numberPill}`}>
                              {cfg.no}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-1.5 rounded-lg shrink-0 ${cfg.iconBg}`}>
                                <IconComp className="h-3.5 w-3.5" />
                              </div>
                              <div>
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
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs border ${cfg.cellBadge}`}>
                              {cfg.excelCell}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {cfg.sourceSheet}!{cfg.sourceCell}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                            {ind.weight}%
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className={`font-mono font-black text-sm ${cfg.scoreText}`}>
                              {ind.cappedValue.toFixed(2)}
                            </div>
                            {/* Mini Progress Bar */}
                            <div className={`w-16 h-1 rounded-full overflow-hidden mt-1 ml-auto ${cfg.trackBg}`}>
                              <div
                                className={`h-full ${cfg.progressColor}`}
                                style={{ width: `${Math.min(100, Math.max(0, ind.cappedValue))}%` }}
                              />
                            </div>
                            {ind.rawValue > 100 && (
                              <div className="text-[10px] text-amber-600 font-mono mt-0.5">
                                (Raw: {ind.rawValue.toFixed(0)})
                              </div>
                            )}
                          </td>
                          <td className={`py-3.5 px-4 text-right font-mono font-black ${cfg.weightedText}`}>
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
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${cfg.btnCalculate}`}
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
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                    <tr className="bg-rose-50/50 dark:bg-rose-950/25 hover:bg-rose-50/70 transition-colors border-t border-rose-200 dark:border-rose-900/50 border-l-4 border-l-rose-500">
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-rose-600 text-white">
                          -
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg shrink-0 bg-rose-500/15 text-rose-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-rose-800 dark:text-rose-200">
                              Pengurang Dispensasi SPM TW IV
                            </div>
                            <div className="text-[11px] text-rose-600/80">
                              Faktor pengurang nilai akhir IKPA dari rasio SPM dispensasi TW IV
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-xs bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-900/60 dark:text-rose-200">
                          P6
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-[11px] text-rose-600 dark:text-rose-400">
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
                    <tr className="bg-slate-100/90 dark:bg-slate-800/90 font-bold border-t-2 border-slate-300 dark:border-slate-700">
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
          )}
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
                    const ind = output.indicators[cfg.key] || {
                      rawValue: 0,
                      cappedValue: 0,
                      weight: project.weights?.[cfg.key] ?? DEFAULT_WEIGHTS[cfg.key] ?? 0,
                      weightedValue: 0,
                      isActive: true,
                      details: []
                    };
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
          <div className={`p-3.5 rounded-xl border transition-all ${
            isDark
              ? 'bg-teal-950/25 border-teal-800/60'
              : 'bg-teal-50/70 border-teal-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-teal-900 dark:text-teal-200">
                Capaian Output (25%)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300">
                Sel M6
              </span>
            </div>
            <span className="text-xs text-teal-700 dark:text-teal-300 font-mono font-bold block mt-1">
              +1.0 pt = +0.25 IKPA
            </span>
            <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 mt-1 leading-relaxed">
              Bobot terbesar. Disiplin pelaporan tepat waktu s.d tanggal 15 setiap bulan.
            </p>
          </div>

          <div className={`p-3.5 rounded-xl border transition-all ${
            isDark
              ? 'bg-emerald-950/25 border-emerald-800/60'
              : 'bg-emerald-50/70 border-emerald-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                Penyerapan Anggaran (20%)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                Sel J6
              </span>
            </div>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-mono font-bold block mt-1">
              +1.0 pt = +0.20 IKPA
            </span>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-1 leading-relaxed">
              Target triwulanan: Q1: 20%, Q2: 50%, Q3: 75%, Q4: 95%.
            </p>
          </div>

          <div className={`p-3.5 rounded-xl border transition-all ${
            isDark
              ? 'bg-sky-950/25 border-sky-800/60'
              : 'bg-sky-50/70 border-sky-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-sky-900 dark:text-sky-200">
                Deviasi Hal III DIPA (15%)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300">
                Sel H6
              </span>
            </div>
            <span className="text-xs text-sky-700 dark:text-sky-300 font-mono font-bold block mt-1">
              +1.0 pt = +0.15 IKPA
            </span>
            <p className="text-[11px] text-sky-800/80 dark:text-sky-300/80 mt-1 leading-relaxed">
              Jaga deviasi bulanan RPD terhadap realisasi ≤ 5.0%.
            </p>
          </div>

          <div className={`p-3.5 rounded-xl border transition-all ${
            isDark
              ? 'bg-rose-950/25 border-rose-800/60'
              : 'bg-rose-50/70 border-rose-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-rose-900 dark:text-rose-200">
                Dispensasi SPM (Penalti)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                Sel P6
              </span>
            </div>
            <span className="text-xs text-rose-700 dark:text-rose-300 font-mono font-bold block mt-1">
              1 SPM = -0.50 s.d -5.00 pt
            </span>
            <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-1 leading-relaxed">
              Hindari keterlambatan pengajuan SPM di Triwulan IV.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
