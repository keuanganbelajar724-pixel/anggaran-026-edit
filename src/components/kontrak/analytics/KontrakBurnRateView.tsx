import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  Flame,
  Layers,
  Sparkles,
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
import { KontrakMonitoringRecord } from '../../../types';
import {
  computeBurnRateEstimate,
  computeCrossSatkerSuppliers,
  CrossSatkerSupplierItem,
  formatNumber,
  formatRupiah
} from '../../../utils/kontrakCalculations';

interface KontrakBurnRateViewProps {
  records: KontrakMonitoringRecord[];
  isDark?: boolean;
}

export const KontrakBurnRateView: React.FC<KontrakBurnRateViewProps> = ({
  records,
  isDark = false
}) => {
  const [targetDate, setTargetDate] = useState<string>('2026-12-15');
  const [refDate, setRefDate] = useState<string>('2026-09-23');

  // Burn-Rate Estimation
  const burnRate = useMemo(() => {
    return computeBurnRateEstimate(records, targetDate, refDate);
  }, [records, targetDate, refDate]);

  // Cross-Satker Suppliers
  const crossSuppliers: CrossSatkerSupplierItem[] = useMemo(() => {
    return computeCrossSatkerSuppliers(records);
  }, [records]);

  // Chart data for Satkers contributing to remaining funds
  const satkerChartData = useMemo(() => {
    return burnRate.topContributingSatkers.map(s => ({
      name: s.namaSatker.length > 20 ? s.namaSatker.slice(0, 18) + '..' : s.namaSatker,
      kode: s.kodeSatker,
      sisaMiliar: s.sisa / 1000000000,
      percent: s.percentOfTotalSisa
    }));
  }, [burnRate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* BANNER HEADER */}
      <div
        className={`p-5 rounded-3xl border shadow-sm ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-emerald-900/60'
            : 'bg-gradient-to-r from-emerald-50/70 via-white to-cyan-50/70 border-emerald-200/80 shadow-emerald-500/5'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Proyeksi Kebutuhan Kas (Burn-Rate) &amp; Rekanan Lintas Satker
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  FISCAL PLANNING
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simulasi kecepatan pencairan SPM kontraktual menuju cut-off akhir tahun dan analisis konsentrasi rekanan multikontrak di wilayah KPPN Semarang I.
              </p>
            </div>
          </div>

          {/* Interactive Date Preset Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-bold hidden sm:inline">Target Cut-Off:</span>
            <button
              onClick={() => setTargetDate('2026-11-30')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                targetDate === '2026-11-30'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              30 Nov 2026
            </button>
            <button
              onClick={() => setTargetDate('2026-12-15')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                targetDate === '2026-12-15'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              15 Des 2026 (Rekomendasi)
            </button>
            <button
              onClick={() => setTargetDate('2026-12-23')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                targetDate === '2026-12-23'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              23 Des 2026
            </button>
          </div>
        </div>
      </div>

      {/* 4 SCORECARDS BURN RATE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sisa Belum Cair */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">TOTAL SISA BELUM CAIR</span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-xl sm:text-2xl font-mono font-black text-amber-600 dark:text-amber-400 block truncate">
            {formatRupiah(burnRate.totalSisaToDisburse)}
          </strong>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Target pencairan s.d. {burnRate.targetCutoffDate}
          </span>
        </div>

        {/* Card 2: Sisa Waktu */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">SISA WAKTU EFEKTIF</span>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl sm:text-3xl font-mono font-black text-blue-600 dark:text-blue-400">
              {burnRate.remainingWeeks}
            </strong>
            <span className="text-xs text-slate-400 font-bold">Minggu</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Setara {burnRate.remainingWorkDays} hari kerja perbankan
          </span>
        </div>

        {/* Card 3: Target Burn-Rate Mingguan */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
            isDark ? 'bg-slate-900 border-emerald-950' : 'bg-white border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              BURN-RATE / MINGGU
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-xl sm:text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 block truncate">
            {formatRupiah(burnRate.requiredWeeklyBurnRate)}
          </strong>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Rata-rata SPM LS per minggu harus terbit
          </span>
        </div>

        {/* Card 4: Target Burn-Rate Harian */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">BURN-RATE / HARI KERJA</span>
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-xl sm:text-2xl font-mono font-black text-cyan-600 dark:text-cyan-400 block truncate">
            {formatRupiah(burnRate.requiredDailyBurnRate)}
          </strong>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Kebutuhan likuiditas SP2D harian
          </span>
        </div>
      </div>

      {/* TOP SATKER BEBAN SISA */}
      <div
        className={`p-5 rounded-3xl border shadow-sm ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>Top 10 Satker Penyumbang Sisa Kontrak Terbesar Menuju Cut-Off</span>
        </h4>
        <p className="text-[11px] text-slate-400 mb-4">
          Satker yang memegang porsi sisa anggaran terbesar dan wajib dimonitor akselerasi penyampaian SPM-nya
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={satkerChartData} margin={{ left: 10, right: 30, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={50} />
              <YAxis fontSize={11} tickFormatter={v => `${v}M`} />
              <Tooltip
                formatter={(val: any) => [
                  `${formatRupiah(val * 1000000000)}`,
                  'Sisa Belum Cair'
                ]}
                contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
              />
              <Bar dataKey="sisaMiliar" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* REKANAN MULTIKONTRAK LINTAS SATKER */}
      <div
        className={`p-5 rounded-3xl border shadow-sm space-y-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              <span>Rekanan Multikontrak Lintas Satker ({crossSuppliers.length} Rekanan Teridentifikasi)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Penyedia yang memegang kontrak di lebih dari 1 Satker di wilayah KPPN Semarang I. Evaluasi kemampuan kapasitas kerja rekanan.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3">Nama Rekanan / Penyedia</th>
                <th className="p-3 text-center">Jml Kontrak</th>
                <th className="p-3 text-center">Jml Satker</th>
                <th className="p-3">Satker yang Ditangani</th>
                <th className="p-3 text-right">Total Nilai Kontrak</th>
                <th className="p-3 text-right">Sisa Belum Cair</th>
                <th className="p-3 text-center">Status Resiko</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {crossSuppliers.slice(0, 30).map((sup, idx) => (
                <tr
                  key={`${sup.supplier}-${idx}`}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </td>

                  <td className="p-3 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                    {sup.supplier}
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {sup.totalKontrak}
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {sup.satkerCount} Satker
                  </td>

                  <td className="p-3 max-w-sm">
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                      {sup.satkerList.slice(0, 2).join(', ')}
                      {sup.satkerList.length > 2 && ` (+${sup.satkerList.length - 2} satker lain)`}
                    </div>
                  </td>

                  <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {formatRupiah(sup.totalNilai)}
                  </td>

                  <td className="p-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                    {formatRupiah(sup.totalSisa)}
                  </td>

                  <td className="p-3 text-center whitespace-nowrap">
                    {sup.terlambatCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{sup.terlambatCount} KTR TERLAMBAT</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <span>LANCAR</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
