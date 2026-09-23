import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Award,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  Ghost,
  Hourglass,
  Layers,
  PieChart as PieChartIcon,
  Search,
  ShieldAlert,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { KontrakMonitoringRecord, KontrakQualityReport, KontrakSummary } from '../../types';
import {
  computeCoaAnalysis,
  computeDataQualityReport,
  computeSatkerAnalysis,
  computeSupplierAnalysis,
  computeTriwulanAnalysis,
  formatNumber,
  formatRupiah
} from '../../utils/kontrakCalculations';
import { KontrakAgingView } from './analytics/KontrakAgingView';
import { KontrakScaleView } from './analytics/KontrakScaleView';
import { KontrakCommodityView } from './analytics/KontrakCommodityView';
import { KontrakDormantView } from './analytics/KontrakDormantView';
import { KontrakBurnRateView } from './analytics/KontrakBurnRateView';

interface KontrakAdminAnalyticsProps {
  records: KontrakMonitoringRecord[];
  summary: KontrakSummary;
  isDark?: boolean;
  onSelectSatker?: (kodeSatker: string) => void;
}

const PROGRESS_COLORS: Record<string, string> = {
  'SELESAI TEPAT WAKTU': '#10b981', // Emerald
  'BELUM SELESAI': '#f59e0b', // Amber
  'BELUM SELESAI TERLAMBAT TERMIN': '#f97316', // Orange
  'BELUM SELESAI TERLAMBAT': '#ef4444', // Red
  'SELESAI TERLAMBAT': '#8b5cf6' // Violet
};

export const KontrakAdminAnalytics: React.FC<KontrakAdminAnalyticsProps> = ({
  records,
  summary,
  isDark = false,
  onSelectSatker
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    | 'charts'
    | 'aging'
    | 'scale'
    | 'commodity'
    | 'dormant'
    | 'burnrate'
    | 'risk'
    | 'satker'
    | 'triwulan'
    | 'supplier'
    | 'coa'
    | 'top10'
    | 'quality'
    | 'recommendations'
  >('charts');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedBroadcast, setCopiedBroadcast] = useState<string | null>(null);

  // Compute reports
  const qualityReport: KontrakQualityReport = useMemo(
    () => computeDataQualityReport(records),
    [records]
  );
  const satkerAnalysis = useMemo(() => computeSatkerAnalysis(records), [records]);
  const triwulanAnalysis = useMemo(() => computeTriwulanAnalysis(records), [records]);
  const supplierAnalysis = useMemo(() => computeSupplierAnalysis(records), [records]);
  const coaAnalysis = useMemo(() => computeCoaAnalysis(records), [records]);

  // Risk Matrix Classification
  const riskMatrix = useMemo(() => {
    const highRisk = records.filter(
      r =>
        r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT' ||
        (r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' && r.sisa_kontrak >= 25000000)
    );
    const mediumRisk = records.filter(
      r =>
        (r.status_progress_kontrak === 'BELUM SELESAI TERLAMBAT TERMIN' && r.sisa_kontrak < 25000000) ||
        r.status_progress_kontrak === 'SELESAI TERLAMBAT'
    );
    const lowRisk = records.filter(r => r.status_progress_kontrak === 'BELUM SELESAI');
    const safe = records.filter(r => r.status_progress_kontrak === 'SELESAI TEPAT WAKTU');

    const totalSisaHighRisk = highRisk.reduce((acc, r) => acc + r.sisa_kontrak, 0);

    return {
      highRisk,
      mediumRisk,
      lowRisk,
      safe,
      totalSisaHighRisk,
      chartData: [
        { name: 'Resiko Tinggi (Lewat Batas)', count: highRisk.length, color: '#ef4444' },
        { name: 'Resiko Sedang (Termin/Terlambat)', count: mediumRisk.length, color: '#f97316' },
        { name: 'Resiko Rendah (Belum Selesai)', count: lowRisk.length, color: '#f59e0b' },
        { name: 'Aman (Selesai Tepat Waktu)', count: safe.length, color: '#10b981' }
      ]
    };
  }, [records]);

  // Coa Grouping: 53 (Modal) vs 52 (Barang) vs Lainnya
  const coaTypeData = useMemo(() => {
    let modalNilai = 0;
    let modalCount = 0;
    let barangNilai = 0;
    let barangCount = 0;
    let lainnyaNilai = 0;
    let lainnyaCount = 0;

    records.forEach(r => {
      const coaPrefix = (r.kode_coa || '').trim().slice(0, 2);
      if (coaPrefix === '53') {
        modalNilai += r.nilai_kontrak;
        modalCount++;
      } else if (coaPrefix === '52') {
        barangNilai += r.nilai_kontrak;
        barangCount++;
      } else {
        lainnyaNilai += r.nilai_kontrak;
        lainnyaCount++;
      }
    });

    return [
      { name: 'Belanja Modal (Akun 53)', count: modalCount, nilai: modalNilai, color: '#3b82f6' },
      { name: 'Belanja Barang (Akun 52)', count: barangCount, nilai: barangNilai, color: '#10b981' },
      { name: 'Belanja Lainnya', count: lainnyaCount, nilai: lainnyaNilai, color: '#8b5cf6' }
    ];
  }, [records]);

  // Top 10 Satkers with NRK Mismatch (SESUAIKAN DENGAN NRK SPAN)
  const satkerNrkMismatchTop = useMemo(() => {
    return [...satkerAnalysis]
      .filter(s => s.nrkPerluPenyesuaian > 0)
      .sort((a, b) => b.nrkPerluPenyesuaian - a.nrkPerluPenyesuaian)
      .slice(0, 10);
  }, [satkerAnalysis]);

  // KPPN Executive Compliance Metrics
  const complianceScore = useMemo(() => {
    if (records.length === 0) return '100.0';
    const score =
      ((summary.selesaiTepatWaktu * 1.0 +
        summary.totalBelumSelesai * 0.75 +
        summary.selesaiTerlambat * 0.4) /
        records.length) *
      100;
    return Math.min(100, Math.max(0, score)).toFixed(1);
  }, [records, summary]);

  const nrkAlignmentRate = useMemo(() => {
    if (records.length === 0) return '100.0';
    return (
      ((records.length - summary.nrkPerluPenyesuaian) / records.length) *
      100
    ).toFixed(1);
  }, [records, summary]);

  // Copy helper
  const handleCopyText = (text: string, identifier: string | number) => {
    navigator.clipboard.writeText(text);
    if (typeof identifier === 'number') {
      setCopiedIndex(identifier);
      setTimeout(() => setCopiedIndex(null), 2500);
    } else {
      setCopiedBroadcast(identifier);
      setTimeout(() => setCopiedBroadcast(null), 2500);
    }
  };

  // Chart 1 & 2: Status Progress data
  const progressChartData = useMemo(() => {
    const counts: Record<string, number> = {
      'SELESAI TEPAT WAKTU': 0,
      'BELUM SELESAI': 0,
      'BELUM SELESAI TERLAMBAT TERMIN': 0,
      'BELUM SELESAI TERLAMBAT': 0,
      'SELESAI TERLAMBAT': 0
    };
    records.forEach(r => {
      if (counts[r.status_progress_kontrak] !== undefined) {
        counts[r.status_progress_kontrak]++;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      color: PROGRESS_COLORS[name] || '#94a3b8'
    }));
  }, [records]);

  // Chart 3: Status NRK
  const nrkChartData = useMemo(() => {
    let sesuai = 0;
    let sesuaikan = 0;
    records.forEach(r => {
      if (r.status_nrk === 'SESUAI') sesuai++;
      else if (r.status_nrk === 'SESUAIKAN DENGAN NRK SPAN') sesuaikan++;
    });
    return [
      { name: 'SESUAI', count: sesuai, color: '#3b82f6' },
      { name: 'SESUAIKAN DENGAN NRK SPAN', count: sesuaikan, color: '#f59e0b' }
    ];
  }, [records]);

  // Chart 4: Pembayaran vs Sisa
  const financialChartData = useMemo(() => {
    return [
      {
        name: 'Finansial Kontrak',
        Pembayaran: summary.totalNilaiPembayaran,
        Sisa: summary.totalSisaKontrak
      }
    ];
  }, [summary]);

  // Chart 5: Triwulan Chart
  const triwulanChartData = useMemo(() => {
    return triwulanAnalysis.map(tw => ({
      name: tw.triwulan,
      totalKontrak: tw.totalKontrak,
      nilaiKontrak: tw.totalNilaiKontrak / 1000000, // in Millions
      pembayaran: tw.totalPembayaran / 1000000,
      sisa: tw.totalSisaKontrak / 1000000
    }));
  }, [triwulanAnalysis]);

  // Chart 6 & 7: Top Satker
  const topSatkerCount = useMemo(() => {
    return [...satkerAnalysis].sort((a, b) => b.totalKontrak - a.totalKontrak).slice(0, 10);
  }, [satkerAnalysis]);

  const topSatkerNilai = useMemo(() => {
    return [...satkerAnalysis].sort((a, b) => b.totalNilaiKontrak - a.totalNilaiKontrak).slice(0, 10);
  }, [satkerAnalysis]);

  const topSatkerSisa = useMemo(() => {
    return [...satkerAnalysis].sort((a, b) => b.totalSisaKontrak - a.totalSisaKontrak).slice(0, 10);
  }, [satkerAnalysis]);

  // Top 10 Suppliers
  const topSuppliers = useMemo(() => {
    return [...supplierAnalysis].slice(0, 10);
  }, [supplierAnalysis]);

  // Top 10 COA
  const topCoa = useMemo(() => {
    return [...coaAnalysis].slice(0, 10);
  }, [coaAnalysis]);

  // Top 10 Contracts (Nilai, Sisa, Pembayaran)
  const top10Nilai = useMemo(() => {
    return [...records].sort((a, b) => b.nilai_kontrak - a.nilai_kontrak).slice(0, 10);
  }, [records]);

  const top10Sisa = useMemo(() => {
    return [...records].sort((a, b) => b.sisa_kontrak - a.sisa_kontrak).slice(0, 10);
  }, [records]);

  const top10Pembayaran = useMemo(() => {
    return [...records].sort((a, b) => b.nilai_pembayaran - a.nilai_pembayaran).slice(0, 10);
  }, [records]);

  return (
    <div className="space-y-6">
      {/* KPPN EXECUTIVE TREASURY SCORECARD */}
      <div
        className={`p-5 rounded-3xl border shadow-sm ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/40 border-slate-700'
            : 'bg-gradient-to-r from-emerald-50/70 via-white to-blue-50/70 border-emerald-100 shadow-emerald-500/5'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Ringkasan Kepatuhan &amp; Analisis Manajerial Kontrak KPPN
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  EXPERT KPPN
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Indikator kunci evaluasi pengadaan, keselarasan data SPAN vs SAKTI, dan mitigasi risiko fiskal.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              Total Kontrak: {formatNumber(records.length)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* KPI 1: Compliance Score */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Skor Kepatuhan Kontrak
              </span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <strong className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {complianceScore}%
              </strong>
              <span className="text-[11px] text-slate-400 font-medium">dari 100%</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Tepat Waktu: {formatNumber(summary.selesaiTepatWaktu)} • Terlambat: {formatNumber(summary.totalTerlambat)}
            </p>
          </div>

          {/* KPI 2: Keselarasan NRK SPAN-SAKTI */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Kesesuaian NRK SPAN
              </span>
              <FileCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <strong className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                {nrkAlignmentRate}%
              </strong>
              <span className="text-[11px] text-slate-400 font-medium">Valid</span>
            </div>
            <p className="text-[10px] text-amber-600 font-medium mt-1">
              {formatNumber(summary.nrkPerluPenyesuaian)} kontrak perlu disesuaikan ke SPAN
            </p>
          </div>

          {/* KPI 3: Resiko Fiskal Sisa Terlambat */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Resiko Sisa Terlambat
              </span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <strong className="text-xl font-black font-mono text-rose-600 dark:text-rose-400 truncate">
                {formatRupiah(riskMatrix.totalSisaHighRisk)}
              </strong>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {formatNumber(riskMatrix.highRisk.length)} kontrak resiko tinggi perlu percepatan
            </p>
          </div>

          {/* KPI 4: Rasio Penyerapan Finansial */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Rasio Penyerapan Pembayaran
              </span>
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <strong className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
                {summary.persenRealisasiPembayaran?.toFixed(1) || '0.0'}%
              </strong>
              <span className="text-[11px] text-slate-400 font-medium">cair</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Sisa belum cair: {formatRupiah(summary.totalSisaKontrak)}
            </p>
          </div>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('charts')}
          className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'charts'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>📊 12 Diagram Recharts Expert</span>
        </button>

        <button
          onClick={() => setActiveSubTab('aging')}
          className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'aging'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Hourglass className="w-4 h-4 text-amber-500" />
          <span>⏱️ Aging &amp; Jatuh Tempo</span>
        </button>

        <button
          onClick={() => setActiveSubTab('scale')}
          className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'scale'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4 text-indigo-500" />
          <span>💼 Skala &amp; Segmentasi PBJ</span>
        </button>

        <button
          onClick={() => setActiveSubTab('commodity')}
          className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'commodity'
              ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Tag className="w-4 h-4 text-teal-500" />
          <span>🏷️ Komoditas &amp; Jenis Belanja</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dormant')}
          className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'dormant'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Ghost className="w-4 h-4 text-rose-500" />
          <span>👻 Kontrak Dorman (Nol SP2D)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('burnrate')}
          className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'burnrate'
              ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4 text-cyan-500" />
          <span>🔮 Proyeksi Kas &amp; Rekanan</span>
        </button>

        <button
          onClick={() => setActiveSubTab('risk')}
          className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'risk'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <AlertOctagon className="w-4 h-4 text-rose-500" />
          <span>⚠️ Matriks Resiko ({riskMatrix.highRisk.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('satker')}
          className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'satker'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Analisis Satker ({satkerAnalysis.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('triwulan')}
          className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'triwulan'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Analisis Triwulan</span>
        </button>

        <button
          onClick={() => setActiveSubTab('supplier')}
          className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'supplier'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Analisis Supplier ({supplierAnalysis.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('coa')}
          className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'coa'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Analisis Akun COA ({coaAnalysis.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('top10')}
          className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'top10'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Top 10 Kontrak</span>
        </button>

        <button
          onClick={() => setActiveSubTab('quality')}
          className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'quality'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Audit Kualitas ({qualityReport.nrkPerluPenyesuaian + qualityReport.nomorKontrakDuplikat})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('recommendations')}
          className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'recommendations'
              ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-teal-500" />
          <span>📢 Rekomendasi &amp; Broadcast WA</span>
        </button>
      </div>

      {/* 1. VIEW: 10 GRAFIK ANALITIS */}
      {activeSubTab === 'charts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Bar Chart Status Progress Kontrak */}
            <div
              className={`p-5 rounded-3xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>1. Distribusi Status Progress Kontrak</span>
              </h4>
              <p className="text-[11px] text-slate-400 mb-4">
                Sesuai 5 kategori status progress pada kolom S Excel sumber
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progressChartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" fontSize={11} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={160}
                      fontSize={9}
                      tickFormatter={val => (val.length > 22 ? val.slice(0, 20) + '..' : val)}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${formatNumber(val)} kontrak`, 'Jumlah']}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                      {progressChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Donut Chart Komposisi Progress */}
            <div
              className={`p-5 rounded-3xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-emerald-600" />
                <span>2. Komposisi Persentase Status Progress</span>
              </h4>
              <p className="text-[11px] text-slate-400 mb-4">
                Proporsi kontrak selesai vs belum selesai vs terlambat
              </p>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={progressChartData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {progressChartData.map((entry, index) => (
                        <Cell key={`cell-pie-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${formatNumber(val)} (${((val / records.length) * 100).toFixed(1)}%)`,
                        name
                      ]}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Status NRK SPAN vs SAKTI */}
            <div
              className={`p-5 rounded-3xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>3. Status Kesesuaian NRK (Kolom H)</span>
              </h4>
              <p className="text-[11px] text-slate-400 mb-4">
                SESUAI vs SESUAIKAN DENGAN NRK SPAN
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nrkChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={11} />
                    <Tooltip
                      formatter={(val: any) => [`${formatNumber(val)} kontrak`, 'Jumlah']}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {nrkChartData.map((entry, index) => (
                        <Cell key={`nrk-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Pembayaran vs Sisa */}
            <div
              className={`p-5 rounded-3xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>4. Perbandingan Nilai Pembayaran vs Sisa Kontrak</span>
              </h4>
              <p className="text-[11px] text-slate-400 mb-4">
                Total Pembayaran: {summary.persenRealisasiPembayaran?.toFixed(1)}% | Sisa:{' '}
                {summary.persenSisaKontrak?.toFixed(1)}%
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis
                      tickFormatter={val => `Rp ${(val / 1000000000).toFixed(1)} M`}
                      fontSize={10}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatRupiah(val), '']}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Pembayaran" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Sisa" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Distribusi per Triwulan */}
            <div
              className={`p-5 rounded-3xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>5. Distribusi Kontrak per Triwulan (Tanggal Kontrak)</span>
              </h4>
              <p className="text-[11px] text-slate-400 mb-4">
                Jumlah kontrak yang dibuat pada Tw I, Tw II, Tw III, Tw IV
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={triwulanChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip
                      formatter={(val: any) => [`${formatNumber(val)} kontrak`, 'Total']}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Bar dataKey="totalKontrak" fill="#0d9488" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: Top 10 Satker Terbanyak Kontrak */}
            <div
              className={`p-5 rounded-3xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>6. Top 10 Satker dengan Jumlah Kontrak Terbanyak</span>
              </h4>
              <p className="text-[11px] text-slate-400 mb-4">Satker paling aktif dalam pengadaan kontraktual</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSatkerCount} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" fontSize={11} />
                    <YAxis dataKey="kodeSatker" type="category" width={60} fontSize={10} />
                    <Tooltip
                      formatter={(val: any, _, item: any) => [
                        `${val} kontrak (${item.payload.namaSatker})`,
                        'Total'
                      ]}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Bar dataKey="totalKontrak" fill="#059669" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 7: Top 10 Satker Nilai Terbesar */}
            <div
              className={`p-5 rounded-3xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span>7. Top 10 Satker dengan Nilai Kontrak Terbesar</span>
              </h4>
              <p className="text-[11px] text-slate-400 mb-4">Berdasarkan total pagu nilai kontrak</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSatkerNilai} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      type="number"
                      tickFormatter={v => `${(v / 1000000000).toFixed(0)}M`}
                      fontSize={10}
                    />
                    <YAxis dataKey="kodeSatker" type="category" width={60} fontSize={10} />
                    <Tooltip
                      formatter={(val: any, _, item: any) => [
                        `${formatRupiah(val)} (${item.payload.namaSatker})`,
                        'Nilai Kontrak'
                      ]}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Bar dataKey="totalNilaiKontrak" fill="#2563eb" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 8: Top 10 Satker Sisa Terbesar */}
            <div
              className={`p-5 rounded-3xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>8. Top 10 Satker dengan Sisa Kontrak Terbesar</span>
              </h4>
              <p className="text-[11px] text-slate-400 mb-4">
                Perlu akselerasi pembayaran sebelum batas akhir
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSatkerSisa} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      type="number"
                      tickFormatter={v => `${(v / 1000000000).toFixed(0)}M`}
                      fontSize={10}
                    />
                    <YAxis dataKey="kodeSatker" type="category" width={60} fontSize={10} />
                    <Tooltip
                      formatter={(val: any, _, item: any) => [
                        `${formatRupiah(val)} (${item.payload.namaSatker})`,
                        'Sisa Kontrak'
                      ]}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Bar dataKey="totalSisaKontrak" fill="#d97706" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 9: Top 10 Supplier */}
            <div
              className={`p-5 rounded-3xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>9. Top 10 Supplier Terbesar</span>
              </h4>
              <p className="text-[11px] text-slate-400 mb-4">Penyedia barang dan jasa dengan kontrak terbanyak</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSuppliers} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      type="number"
                      tickFormatter={v => `${(v / 1000000000).toFixed(0)}M`}
                      fontSize={10}
                    />
                    <YAxis
                      dataKey="supplier"
                      type="category"
                      width={120}
                      fontSize={9}
                      tickFormatter={s => (s.length > 18 ? s.slice(0, 16) + '..' : s)}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatRupiah(val), 'Total Nilai']}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Bar dataKey="totalNilaiKontrak" fill="#4f46e5" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 10: Distribusi per Kode COA */}
            <div
              className={`p-5 rounded-3xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>10. Distribusi Kontrak per Kode COA (Akun)</span>
              </h4>
              <p className="text-[11px] text-slate-400 mb-4">Pengelompokan akun belanja kontraktual</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCoa} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="coa" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip
                      formatter={(val: any) => [`${formatNumber(val)} kontrak`, 'Jumlah']}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Bar dataKey="totalKontrak" fill="#9333ea" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 11: Distribusi Belanja Modal (53) vs Belanja Barang (52) */}
            <div
              className={`p-5 rounded-3xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-blue-600" />
                <span>11. Komposisi Jenis Belanja (Modal 53 vs Barang 52)</span>
              </h4>
              <p className="text-[11px] text-slate-400 mb-4">
                Porsi nilai nominal belanja modal infrastruktur/aset vs belanja barang operasional
              </p>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={coaTypeData}
                      dataKey="nilai"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {coaTypeData.map((entry, index) => (
                        <Cell key={`cell-coa-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${formatRupiah(val)} (${((val / Math.max(1, summary.totalNilaiKontrak)) * 100).toFixed(1)}%)`,
                        name
                      ]}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 12: Top 10 Satker dengan NRK Mismatch */}
            <div
              className={`p-5 rounded-3xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>12. Top 10 Satker dengan NRK Perlu Penyesuaian</span>
              </h4>
              <p className="text-[11px] text-slate-400 mb-4">
                Satker dengan jumlah perbedaan NRK SPAN vs SAKTI tertinggi untuk target pembinaan
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={satkerNrkMismatchTop} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" fontSize={10} />
                    <YAxis dataKey="kodeSatker" type="category" width={60} fontSize={10} />
                    <Tooltip
                      formatter={(val: any, _, item: any) => [
                        `${val} kontrak (${item.payload.namaSatker})`,
                        'NRK Perlu Penyesuaian'
                      ]}
                      contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Bar dataKey="nrkPerluPenyesuaian" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. VIEW: AGING & JATUH TEMPO */}
      {activeSubTab === 'aging' && (
        <KontrakAgingView records={records} isDark={isDark} />
      )}

      {/* 3. VIEW: SKALA & SEGMENTASI NILAI PBJ */}
      {activeSubTab === 'scale' && (
        <KontrakScaleView records={records} isDark={isDark} />
      )}

      {/* 4. VIEW: INTELLIGENCE KOMODITAS & JENIS PENGADAAN */}
      {activeSubTab === 'commodity' && (
        <KontrakCommodityView records={records} isDark={isDark} />
      )}

      {/* 5. VIEW: KONTRAK DORMAN (NOL REALISASI SP2D) */}
      {activeSubTab === 'dormant' && (
        <KontrakDormantView records={records} isDark={isDark} />
      )}

      {/* 6. VIEW: PROYEKSI KAS & REKANAN LINTAS SATKER */}
      {activeSubTab === 'burnrate' && (
        <KontrakBurnRateView records={records} isDark={isDark} />
      )}

      {/* 7. VIEW: ANALISIS PER SATKER */}
      {activeSubTab === 'satker' && (
        <div
          className={`p-5 rounded-3xl border shadow-sm overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-extrabold text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Analisis Data Kontrak per Satuan Kerja ({satkerAnalysis.length} Satker)</span>
              </h4>
              <p className="text-xs text-slate-500">
                Klik baris satker untuk memfilter seluruh kontrak satker tersebut.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`border-b font-extrabold ${
                    isDark ? 'bg-slate-800/80 text-slate-200' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3">Nama Satker</th>
                  <th className="py-2.5 px-3 text-center">Total Kontrak</th>
                  <th className="py-2.5 px-3 text-right">Nilai Kontrak</th>
                  <th className="py-2.5 px-3 text-right">Pembayaran</th>
                  <th className="py-2.5 px-3 text-right">Sisa</th>
                  <th className="py-2.5 px-3 text-center">Selesai</th>
                  <th className="py-2.5 px-3 text-center">Belum Selesai</th>
                  <th className="py-2.5 px-3 text-center">Terlambat</th>
                  <th className="py-2.5 px-3 text-center">NRK Mismatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {satkerAnalysis.map((s, idx) => (
                  <tr
                    key={s.kodeSatker}
                    onClick={() => onSelectSatker && onSelectSatker(s.kodeSatker)}
                    className="hover:bg-emerald-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {s.kodeSatker}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {s.namaSatker}
                    </td>
                    <td className="py-2 px-3 text-center font-bold">{s.totalKontrak}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      {formatRupiah(s.totalNilaiKontrak)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                      {formatRupiah(s.totalPembayaran)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-amber-600">
                      {formatRupiah(s.totalSisaKontrak)}
                    </td>
                    <td className="py-2 px-3 text-center text-emerald-600 font-bold">{s.selesai}</td>
                    <td className="py-2 px-3 text-center text-amber-600 font-bold">{s.belumSelesai}</td>
                    <td className="py-2 px-3 text-center">
                      {s.terlambat > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                          {s.terlambat}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {s.nrkPerluPenyesuaian > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          {s.nrkPerluPenyesuaian}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. VIEW: ANALISIS PER TRIWULAN */}
      {activeSubTab === 'triwulan' && (
        <div
          className={`p-5 rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h4 className="font-extrabold text-sm mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Rekapitulasi Kontrak Berdasarkan Triwulan (Tanggal Kontrak)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {triwulanAnalysis.map(tw => (
              <div
                key={tw.triwulan}
                className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                    {tw.label}
                  </h5>
                  <span className="text-xs font-mono font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border">
                    {tw.totalKontrak} Kontrak
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nilai Kontrak:</span>
                    <strong className="font-mono">{formatRupiah(tw.totalNilaiKontrak)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pembayaran:</span>
                    <strong className="font-mono text-emerald-600">{formatRupiah(tw.totalPembayaran)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sisa Kontrak:</span>
                    <strong className="font-mono text-amber-600">{formatRupiah(tw.totalSisaKontrak)}</strong>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Selesai / Terlambat:</span>
                    <strong className="font-mono">
                      {tw.selesai} / <span className="text-rose-600">{tw.terlambat}</span>
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. VIEW: ANALISIS SUPPLIER */}
      {activeSubTab === 'supplier' && (
        <div
          className={`p-5 rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h4 className="font-extrabold text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Rekapitulasi Kontrak per Penyedia / Rekanan ({supplierAnalysis.length} Supplier)</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`border-b font-extrabold ${
                    isDark ? 'bg-slate-800/80 text-slate-200' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Nama Penyedia / Supplier</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Kontrak</th>
                  <th className="py-2.5 px-3 text-right">Total Nilai Kontrak</th>
                  <th className="py-2.5 px-3 text-right">Total Pembayaran</th>
                  <th className="py-2.5 px-3 text-right">Total Sisa</th>
                  <th className="py-2.5 px-3 text-center">Belum Selesai</th>
                  <th className="py-2.5 px-3 text-center">Terlambat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {supplierAnalysis.slice(0, 50).map((sp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {sp.supplier}
                    </td>
                    <td className="py-2 px-3 text-center font-bold">{sp.totalKontrak}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      {formatRupiah(sp.totalNilaiKontrak)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                      {formatRupiah(sp.totalPembayaran)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-amber-600">
                      {formatRupiah(sp.totalSisaKontrak)}
                    </td>
                    <td className="py-2 px-3 text-center text-amber-600 font-bold">{sp.belumSelesai}</td>
                    <td className="py-2 px-3 text-center">
                      {sp.terlambat > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                          {sp.terlambat}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. VIEW: ANALISIS COA */}
      {activeSubTab === 'coa' && (
        <div
          className={`p-5 rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h4 className="font-extrabold text-sm mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Rekapitulasi Kontrak per Kode Akun COA ({coaAnalysis.length} Akun)</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`border-b font-extrabold ${
                    isDark ? 'bg-slate-800/80 text-slate-200' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <th className="py-2.5 px-3">Kode COA</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Kontrak</th>
                  <th className="py-2.5 px-3 text-right">Nilai Kontrak</th>
                  <th className="py-2.5 px-3 text-right">Nilai Pembayaran</th>
                  <th className="py-2.5 px-3 text-right">Sisa Kontrak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {coaAnalysis.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {c.coa}
                    </td>
                    <td className="py-2 px-3 text-center font-bold">{c.totalKontrak}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      {formatRupiah(c.totalNilaiKontrak)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                      {formatRupiah(c.totalPembayaran)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-amber-600">
                      {formatRupiah(c.totalSisaKontrak)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. VIEW: TOP 10 KONTRAK */}
      {activeSubTab === 'top10' && (
        <div className="space-y-6">
          {/* Top 10 Nilai Kontrak */}
          <div
            className={`p-5 rounded-3xl border shadow-sm ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <h4 className="font-extrabold text-sm mb-3 flex items-center gap-2 text-blue-600">
              <Award className="w-4 h-4" />
              <span>10 Kontrak dengan Nilai Terbesar</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b font-extrabold opacity-75">
                    <th className="py-2 px-3">No</th>
                    <th className="py-2 px-3">Nomor Kontrak</th>
                    <th className="py-2 px-3">Satker</th>
                    <th className="py-2 px-3">Supplier</th>
                    <th className="py-2 px-3 text-right">Nilai Kontrak</th>
                    <th className="py-2 px-3 text-right">Pembayaran</th>
                    <th className="py-2 px-3 text-right">Sisa</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {top10Nilai.map((k, idx) => (
                    <tr key={k.id || idx}>
                      <td className="py-2 px-3 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold">{k.nomor_kontrak}</td>
                      <td className="py-2 px-3">{k.deskripsi_satker}</td>
                      <td className="py-2 px-3">{k.nama_supplier}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-blue-600">
                        {formatRupiah(k.nilai_kontrak)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-600">
                        {formatRupiah(k.nilai_pembayaran)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-amber-600">
                        {formatRupiah(k.sisa_kontrak)}
                      </td>
                      <td className="py-2 px-3 font-bold text-[10px]">{k.status_progress_kontrak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 10 Sisa Kontrak Terbesar */}
          <div
            className={`p-5 rounded-3xl border shadow-sm ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <h4 className="font-extrabold text-sm mb-3 flex items-center gap-2 text-amber-600">
              <Clock className="w-4 h-4" />
              <span>10 Kontrak dengan Sisa Pembayaran Terbesar</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b font-extrabold opacity-75">
                    <th className="py-2 px-3">No</th>
                    <th className="py-2 px-3">Nomor Kontrak</th>
                    <th className="py-2 px-3">Satker</th>
                    <th className="py-2 px-3">Supplier</th>
                    <th className="py-2 px-3 text-right">Nilai Kontrak</th>
                    <th className="py-2 px-3 text-right">Pembayaran</th>
                    <th className="py-2 px-3 text-right">Sisa Kontrak</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {top10Sisa.map((k, idx) => (
                    <tr key={k.id || idx}>
                      <td className="py-2 px-3 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold">{k.nomor_kontrak}</td>
                      <td className="py-2 px-3">{k.deskripsi_satker}</td>
                      <td className="py-2 px-3">{k.nama_supplier}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatRupiah(k.nilai_kontrak)}</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-600">
                        {formatRupiah(k.nilai_pembayaran)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-600">
                        {formatRupiah(k.sisa_kontrak)}
                      </td>
                      <td className="py-2 px-3 font-bold text-[10px]">{k.status_progress_kontrak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. VIEW: DATA QUALITY REPORT */}
      {activeSubTab === 'quality' && (
        <div
          className={`p-5 rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <h4 className="font-extrabold text-sm">Panel Kualitas Data &amp; Anomali (Quality Warnings)</h4>
              <p className="text-xs text-slate-500">
                Peringatan anomali tidak mengubah data resmi sumber, melainkan sebagai bahan asistensi KPPN.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                Status NRK Perlu Penyesuaian
              </span>
              <strong className="text-2xl font-mono text-amber-700 dark:text-amber-400 block mt-1">
                {qualityReport.nrkPerluPenyesuaian}
              </strong>
              <p className="text-[11px] text-slate-500 mt-1">
                Status H: SESUAIKAN DENGAN NRK SPAN (SPAN vs SAKTI berbeda)
              </p>
            </div>

            <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Nomor Kontrak Duplikat
              </span>
              <strong className="text-2xl font-mono text-slate-800 dark:text-slate-100 block mt-1">
                {qualityReport.nomorKontrakDuplikat}
              </strong>
              <p className="text-[11px] text-slate-500 mt-1">Kombinasi Satker + Nomor Kontrak yang sama</p>
            </div>

            <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Nilai Kontrak Nol
              </span>
              <strong className="text-2xl font-mono text-slate-800 dark:text-slate-100 block mt-1">
                {qualityReport.nilaiKontrakNol}
              </strong>
              <p className="text-[11px] text-slate-500 mt-1">Kontrak dengan nilai nominal Rp 0</p>
            </div>

            <div className="p-4 rounded-2xl border bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">
                Pembayaran Melebihi Kontrak
              </span>
              <strong className="text-2xl font-mono text-rose-700 dark:text-rose-400 block mt-1">
                {qualityReport.pembayaranMelebihiKontrak}
              </strong>
              <p className="text-[11px] text-slate-500 mt-1">Nilai Pembayaran &gt; Nilai Kontrak</p>
            </div>

            <div className="p-4 rounded-2xl border bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">
                Sisa Kontrak Negatif
              </span>
              <strong className="text-2xl font-mono text-rose-700 dark:text-rose-400 block mt-1">
                {qualityReport.sisaKontrakNegatif}
              </strong>
              <p className="text-[11px] text-slate-500 mt-1">Kolom R &lt; Rp 0</p>
            </div>

            <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Tanggal Selesai &lt; Mulai
              </span>
              <strong className="text-2xl font-mono text-slate-800 dark:text-slate-100 block mt-1">
                {qualityReport.tanggalSelesaiSebelumMulai}
              </strong>
              <p className="text-[11px] text-slate-500 mt-1">Inkonsistensi urutan tanggal pelaksanaan</p>
            </div>
          </div>
        </div>
      )}

      {/* 8. VIEW: MATRIKS RESIKO & KETERLAMBATAN */}
      {activeSubTab === 'risk' && (
        <div className="space-y-6">
          {/* Matriks 4 Tingkat Resiko */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-3xl border bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  🔴 Resiko Tinggi (Kritis)
                </span>
                <AlertOctagon className="w-5 h-5 text-rose-600" />
              </div>
              <strong className="text-3xl font-black font-mono text-rose-700 dark:text-rose-300 block">
                {formatNumber(riskMatrix.highRisk.length)}
              </strong>
              <p className="text-xs font-bold text-rose-800 dark:text-rose-300 mt-1">
                Sisa: {formatRupiah(riskMatrix.totalSisaHighRisk)}
              </p>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Belum selesai lewat due date / sisa &gt; 25jt
              </span>
            </div>

            <div className="p-4 rounded-3xl border bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  🟠 Resiko Sedang
                </span>
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <strong className="text-3xl font-black font-mono text-amber-700 dark:text-amber-300 block">
                {formatNumber(riskMatrix.mediumRisk.length)}
              </strong>
              <span className="text-[11px] text-slate-500 block mt-2">
                Terlambat termin / selesai melewati jadwal
              </span>
            </div>

            <div className="p-4 rounded-3xl border bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                  🟡 Resiko Rendah (On Progress)
                </span>
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <strong className="text-3xl font-black font-mono text-blue-700 dark:text-blue-300 block">
                {formatNumber(riskMatrix.lowRisk.length)}
              </strong>
              <span className="text-[11px] text-slate-500 block mt-2">
                Belum selesai dalam batas waktu wajar
              </span>
            </div>

            <div className="p-4 rounded-3xl border bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  🟢 Aman (Tepat Waktu)
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <strong className="text-3xl font-black font-mono text-emerald-700 dark:text-emerald-300 block">
                {formatNumber(riskMatrix.safe.length)}
              </strong>
              <span className="text-[11px] text-slate-500 block mt-2">
                Selesai 100% tepat waktu sesuai SPAN/SAKTI
              </span>
            </div>
          </div>

          {/* Tabel Kontrak Resiko Tinggi untuk Intervensi KPPN */}
          <div
            className={`p-5 rounded-3xl border shadow-sm ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="font-extrabold text-sm flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                  <span>Daftar Kontrak Resiko Tinggi untuk Tindak Lanjut Asistensi KPPN</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Kontrak dengan status terlambat atau termin tertunda dengan sisa pagu besar. Hubungi Satker segera.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                {riskMatrix.highRisk.length} Kontrak Kritis
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b font-extrabold ${
                      isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Nomor Kontrak</th>
                    <th className="py-2.5 px-3">Satker</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Nilai Kontrak</th>
                    <th className="py-2.5 px-3 text-right">Sisa Kontrak</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {riskMatrix.highRisk.slice(0, 20).map((r, idx) => {
                    const waText = `Halo Bapak/Ibu Satker ${r.kode_satker} (${r.deskripsi_satker}), mohon konfirmasi progres kontrak ${r.nomor_kontrak} dengan rekanan ${r.nama_supplier}. Nilai Kontrak: ${formatRupiah(r.nilai_kontrak)}, Sisa: ${formatRupiah(r.sisa_kontrak)}, Jatuh Tempo: ${r.tanggal_selesai}. Saat ini berstatus: ${r.status_progress_kontrak}. Mohon akselerasi penyelesaian BAST dan pengajuan SPM ke KPPN. Terima kasih.`;

                    return (
                      <tr key={r.id || idx} className="hover:bg-rose-50/40 dark:hover:bg-slate-800/60">
                        <td className="py-2 px-3 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {r.nomor_kontrak}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                          <span className="font-mono font-bold block">{r.kode_satker}</span>
                          <span className="text-[11px] text-slate-500 truncate block max-w-xs">
                            {r.deskripsi_satker}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                          {r.nama_supplier}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-rose-600">
                          {r.tanggal_selesai}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {formatRupiah(r.nilai_kontrak)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-rose-600">
                          {formatRupiah(r.sisa_kontrak)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            {r.status_progress_kontrak}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleCopyText(waText, idx)}
                            title="Salin teks WhatsApp peringatan untuk Satker"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">Disalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin WA</span>
                              </>
                            )}
                          </button>
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

      {/* 9. VIEW: REKOMENDASI & BROADCAST WA KPPN */}
      {activeSubTab === 'recommendations' && (
        <div className="space-y-6">
          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-5 rounded-3xl border shadow-sm space-y-3 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                1. Asistensi Penyesuaian NRK ({summary.nrkPerluPenyesuaian} Kontrak)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Terdapat {summary.nrkPerluPenyesuaian} kontrak dengan status &ldquo;SESUAIKAN DENGAN NRK SPAN&rdquo;.
                Satker wajib menyamakan nomor register kontrak di modul komitmen SAKTI agar tidak terjadi penolakan SPM termin berikutnya.
              </p>
            </div>

            <div
              className={`p-5 rounded-3xl border shadow-sm space-y-3 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                2. Percepatan BAST &amp; SPM Kontrak Terlambat ({summary.totalTerlambat} Kontrak)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sebanyak {summary.totalTerlambat} kontrak mengalami keterlambatan termin atau jatuh tempo akhir.
                KPPN disarankan mengundang Satker terkait untuk monitoring kendala fisik penyedia di lapangan.
              </p>
            </div>

            <div
              className={`p-5 rounded-3xl border shadow-sm space-y-3 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                3. Optimalisasi Penyerapan Belanja Modal ({coaTypeData[0].count} Kontrak)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Total belanja modal mencapai {formatRupiah(coaTypeData[0].nilai)}.
                KPPN perlu memastikan pengajuan SPM kontraktual termin terakhir tidak menumpuk di akhir tahun anggaran.
              </p>
            </div>
          </div>

          {/* Broadcast Templates */}
          <div
            className={`p-5 rounded-3xl border shadow-sm space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Template Siar WhatsApp Pembinaan KPPN ke Satker</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Salin teks broadcast di bawah untuk dikirimkan melalui grup koordinasi Satker KPPN.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Template A: Pembinaan NRK */}
              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Template A: Penyesuaian NRK SPAN
                  </strong>
                  <button
                    onClick={() =>
                      handleCopyText(
                        `Yth. Kuasa Pengguna Anggaran (KPA) / PPK Satuan Kerja Lingkup KPPN,\n\nBerdasarkan monitoring data kontrak SPAN/SAKTI terkini, kami mengimbau seluruh Satker untuk mengecek kesesuaian Nomor Register Kontrak (NRK) pada modul komitmen SAKTI dengan SPAN. Terdapat data kontrak yang berstatus "SESUAIKAN DENGAN NRK SPAN" yang berpotensi menghambat penerbitan SP2D. Mohon segera lakukan penyesuaian sebelum batas akhir pengajuan SPM.\n\nTerima kasih atas kerja samanya.\nSeksi Pencairan Dana - KPPN`,
                        'broadcast_nrk'
                      )
                    }
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-100"
                  >
                    {copiedBroadcast === 'broadcast_nrk' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Teks</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                  {`Yth. KPA / PPK Satker Lingkup KPPN,

Berdasarkan monitoring data kontrak SPAN/SAKTI terkini, kami mengimbau seluruh Satker untuk mengecek kesesuaian Nomor Register Kontrak (NRK) pada modul komitmen SAKTI dengan SPAN. Terdapat data kontrak yang berstatus "SESUAIKAN DENGAN NRK SPAN" yang berpotensi menghambat penerbitan SP2D.

Terima kasih.\nSeksi Pencairan Dana - KPPN`}
                </p>
              </div>

              {/* Template B: Akselerasi Termin Kontrak */}
              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Template B: Akselerasi BAST &amp; SPM Termin
                  </strong>
                  <button
                    onClick={() =>
                      handleCopyText(
                        `Yth. Para Pejabat Pembuat Komitmen (PPK) Satker Mitra KPPN,\n\nSehubungan dengan monitoring pelaksanaan kontrak tahun anggaran berjalan, mohon percepatan penyelesaian Berita Acara Serah Terima (BAST) dan penerbitan SPM atas kontrak-kontrak yang telah mendekati atau melewati tanggal penyelesaian (due date) agar tidak terjadi penumpukan tagihan. Hubungi FO KPPN jika membutuhkan asistensi komitmen.\n\nSalam,\nKPPN`,
                        'broadcast_termin'
                      )
                    }
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-100"
                  >
                    {copiedBroadcast === 'broadcast_termin' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Teks</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                  {`Yth. Para PPK Satker Mitra KPPN,

Sehubungan dengan monitoring pelaksanaan kontrak tahun anggaran berjalan, mohon percepatan penyelesaian Berita Acara Serah Terima (BAST) dan penerbitan SPM atas kontrak-kontrak yang telah mendekati atau melewati tanggal penyelesaian (due date) agar tidak terjadi penumpukan tagihan.

Salam,\nKPPN`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
