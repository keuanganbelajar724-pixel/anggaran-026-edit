import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Briefcase,
  CheckCircle2,
  DollarSign,
  Layers,
  PieChart as PieChartIcon,
  ShieldCheck,
  TrendingDown,
  TrendingUp
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
  computeScaleSegmentation,
  formatNumber,
  formatRupiah,
  ScaleSegmentItem
} from '../../../utils/kontrakCalculations';

interface KontrakScaleViewProps {
  records: KontrakMonitoringRecord[];
  isDark?: boolean;
}

export const KontrakScaleView: React.FC<KontrakScaleViewProps> = ({
  records,
  isDark = false
}) => {
  const [selectedSegment, setSelectedSegment] = useState<string>('ALL');

  const { segments, totalNilaiAll } = useMemo(() => {
    return computeScaleSegmentation(records);
  }, [records]);

  // Chart data: Nominal comparison
  const chartDataNominal = useMemo(() => {
    return segments.map(s => ({
      name: s.name.replace('Pengadaan ', '').replace('Proyek Skala ', ''),
      range: s.rangeLabel,
      Pagu: s.totalNilai / 1000000000, // in Billions
      Pembayaran: s.totalPembayaran / 1000000000,
      Sisa: s.totalSisa / 1000000000,
      serapan: s.persenSerapan
    }));
  }, [segments]);

  // Chart data: Count comparison
  const chartDataCount = useMemo(() => {
    return segments.map(s => ({
      name: s.name.replace('Pengadaan ', '').replace('Proyek Skala ', ''),
      count: s.count,
      terlambat: s.terlambatCount,
      color: s.color
    }));
  }, [segments]);

  // Top strategic projects (> 2.5 Miliar)
  const megaProjects = useMemo(() => {
    return records
      .filter(r => r.nilai_kontrak >= 2500000000)
      .sort((a, b) => b.nilai_kontrak - a.nilai_kontrak);
  }, [records]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* BANNER HEADER */}
      <div
        className={`p-5 rounded-3xl border shadow-sm ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border-purple-900/60'
            : 'bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/70 border-indigo-200/80 shadow-indigo-500/5'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Segmentasi Skala Nilai Pengadaan &amp; Proyek Strategis
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  KLASIFIKASI PBJ
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pemetaan profil kontrak berdasarkan standar tingkatan nilai: Mikro (&lt;50 Jt), Kecil Non-Tender (50-200 Jt), Menengah UMKM (200 Jt-2,5 M), dan Proyek Strategis (&gt;2,5 M).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300">
              Total Pagu: {formatRupiah(totalNilaiAll)}
            </span>
          </div>
        </div>
      </div>

      {/* 4 CARDS FOR EACH TIER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {segments.map(seg => (
          <div
            key={seg.key}
            className={`p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {seg.name}
              </span>
              <span
                style={{ backgroundColor: `${seg.color}20`, color: seg.color }}
                className="px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono"
              >
                {seg.rangeLabel}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <strong className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {formatNumber(seg.count)}
              </strong>
              <span className="text-xs text-slate-400 font-medium">kontrak</span>
            </div>

            <div className="mt-2 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Total Nilai:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                  {formatRupiah(seg.totalNilai)}
                </span>
              </div>

              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Porsi Anggaran:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {seg.persenDariTotalNilai.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Serapan Bayar:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {seg.persenSerapan.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Tingkat Terlambat:</span>
                <span className={`font-mono font-bold ${seg.terlambatCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {seg.terlambatCount} ({seg.terlambatRate.toFixed(1)}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2">
                <div
                  style={{ width: `${Math.min(100, seg.persenSerapan)}%`, backgroundColor: seg.color }}
                  className="h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2 CHARTS: NOMINAL VS JUMLAH KONTRAK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Nominal Nilai Kontrak vs Pembayaran per Skala */}
        <div
          className={`p-5 rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Perbandingan Nilai Kontrak vs Realisasi Bayar (Miliar Rp)</span>
          </h4>
          <p className="text-[11px] text-slate-400 mb-4">
            Besaran pagu komitmen kontraktual dan pembayaran berdasarkan 4 tingkatan skala
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataNominal} margin={{ left: 10, right: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={11} tickFormatter={v => `${v}M`} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `${formatRupiah(val * 1000000000)}`,
                    name
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Pagu" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Pembayaran" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Komposisi Jumlah Kontrak per Skala */}
        <div
          className={`p-5 rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
            <PieChartIcon className="w-4 h-4 text-indigo-600" />
            <span>Proporsi Frekuensi Jumlah Kontrak</span>
          </h4>
          <p className="text-[11px] text-slate-400 mb-4">
            Sebaran volume transaksi pengadaan barang/jasa menurut skala nilai
          </p>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataCount}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {chartDataCount.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `${formatNumber(val)} kontrak (${((val / records.length) * 100).toFixed(1)}%)`,
                    name
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '10px' }}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* PROYEK SKALA BESAR & STRATEGIS (> 2.5 MILIAR) */}
      <div
        className={`p-5 rounded-3xl border shadow-sm space-y-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" />
              <span>Proyek Skala Besar &amp; Strategis (&gt; Rp 2,5 Miliar) ({megaProjects.length} Kontrak)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paket pengadaan vital dengan nilai material tinggi yang membutuhkan mitigasi risiko fiskal dan pengawalan serapan secara berkala.
            </p>
          </div>
        </div>

        {megaProjects.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Tidak ada kontrak dengan nilai di atas Rp 2,5 Miliar pada batch data ini.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3">Satker &amp; No. Kontrak</th>
                  <th className="p-3">Penyedia / Supplier</th>
                  <th className="p-3">Masa Kontrak</th>
                  <th className="p-3 text-right">Nilai Kontrak</th>
                  <th className="p-3 text-right">Realisasi Bayar</th>
                  <th className="p-3 text-right">Sisa Kontrak</th>
                  <th className="p-3 text-center">Status Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {megaProjects.map((r, idx) => {
                  const serapan = r.nilai_kontrak > 0 ? (r.nilai_pembayaran / r.nilai_kontrak) * 100 : 0;
                  return (
                    <tr
                      key={`${r.kode_satker}-${r.nomor_kontrak}-${idx}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      <td className="p-3 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {r.deskripsi_satker}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 truncate">
                          {r.kode_satker} • No: {r.nomor_kontrak}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {r.uraian_kontrak}
                        </div>
                      </td>

                      <td className="p-3 max-w-[200px]">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {r.nama_supplier}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          COA: {r.kode_coa}
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        <div>{r.tanggal_mulai}</div>
                        <div className="text-slate-400">s.d. {r.tanggal_selesai}</div>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {formatRupiah(r.nilai_kontrak)}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatRupiah(r.nilai_pembayaran)}
                        <span className="text-[10px] block text-slate-400 font-normal">
                          {serapan.toFixed(1)}%
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        {formatRupiah(r.sisa_kontrak)}
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            r.status_progress_kontrak === 'SELESAI TEPAT WAKTU'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : r.status_progress_kontrak.includes('TERLAMBAT')
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {r.status_progress_kontrak}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
