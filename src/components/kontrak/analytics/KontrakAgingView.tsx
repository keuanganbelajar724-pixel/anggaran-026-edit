import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Calendar,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  Hourglass,
  Info,
  Search,
  ShieldAlert,
  Sparkles,
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
  AgingAndDeadlineAnalysis,
  computeAgingAndDeadlineAnalysis,
  formatNumber,
  formatRupiah
} from '../../../utils/kontrakCalculations';

interface KontrakAgingViewProps {
  records: KontrakMonitoringRecord[];
  isDark?: boolean;
}

export const KontrakAgingView: React.FC<KontrakAgingViewProps> = ({
  records,
  isDark = false
}) => {
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'OVERDUE' | 'CRITICAL' | 'WARNING'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Analysis result
  const aging: AgingAndDeadlineAnalysis = useMemo(() => {
    return computeAgingAndDeadlineAnalysis(records);
  }, [records]);

  // Filter urgent attention list
  const filteredList = useMemo(() => {
    return aging.urgentAttentionList.filter(item => {
      // Urgency filter
      if (urgencyFilter === 'OVERDUE' && item.urgencyLevel !== 'CRITICAL_OVERDUE') return false;
      if (urgencyFilter === 'CRITICAL' && item.urgencyLevel !== 'HIGH_15_DAYS') return false;
      if (urgencyFilter === 'WARNING' && item.urgencyLevel !== 'MEDIUM_30_DAYS') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const r = item.record;
        const match =
          r.nomor_kontrak.toLowerCase().includes(q) ||
          r.kode_satker.toLowerCase().includes(q) ||
          r.deskripsi_satker.toLowerCase().includes(q) ||
          r.nama_supplier.toLowerCase().includes(q) ||
          r.uraian_kontrak.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [aging, urgencyFilter, searchQuery]);

  const handleCopyWa = (item: AgingAndDeadlineAnalysis['urgentAttentionList'][0], index: number) => {
    const r = item.record;
    let statusText = '';
    if (item.urgencyLevel === 'CRITICAL_OVERDUE') {
      statusText = `🚨 KONTRAK LEWAT BATAS AKHIR (LEWAT ${Math.abs(item.daysRemaining)} HARI)`;
    } else if (item.urgencyLevel === 'HIGH_15_DAYS') {
      statusText = `⏳ JATUH TEMPO KRITIS (SISA ${item.daysRemaining} HARI LAGI)`;
    } else {
      statusText = `⚠️ PERINGATAN JATUH TEMPO (SISA ${item.daysRemaining} HARI LAGI)`;
    }

    const text =
      `*PEMBERITAHUAN MONITORING KONTRAK KPPN SEMARANG I*\n\n` +
      `Kepada Yth. PPK Satker: *${r.deskripsi_satker}* (${r.kode_satker})\n\n` +
      `Berdasarkan pantauan sistem SPAN/SAKTI KPPN Semarang I, kontrak berikut memerlukan perhatian segera:\n` +
      `• *Status:* ${statusText}\n` +
      `• *Nomor Kontrak:* ${r.nomor_kontrak}\n` +
      `• *Rekanan/Supplier:* ${r.nama_supplier}\n` +
      `• *Tanggal Selesai:* ${r.tanggal_selesai}\n` +
      `• *Nilai Kontrak:* ${formatRupiah(r.nilai_kontrak)}\n` +
      `• *Realisasi Bayar:* ${formatRupiah(r.nilai_pembayaran)}\n` +
      `• *Sisa Belum Cair:* *${formatRupiah(r.sisa_kontrak)}*\n` +
      `• *Uraian:* ${r.uraian_kontrak}\n\n` +
      `Mohon segera menyelesaikan administrasi BAST, kelengkapan berkas, dan mengajukan SPM LS Kontraktual ke KPPN Semarang I sebelum batas waktu berakhir.\n\n` +
      `_Pesan otomatis monitoring data kontrak KPPN 026 Semarang I._`;

    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleExportCsv = () => {
    const headers = [
      'No',
      'Kode Satker',
      'Nama Satker',
      'Nomor Kontrak',
      'Supplier',
      'Tanggal Mulai',
      'Tanggal Selesai',
      'Durasi (Hari)',
      'Sisa Hari',
      'Status Urgensi',
      'Nilai Kontrak',
      'Nilai Pembayaran',
      'Sisa Kontrak',
      'Uraian Kontrak'
    ];

    const rows = filteredList.map((item, idx) => {
      const r = item.record;
      return [
        idx + 1,
        `"${r.kode_satker}"`,
        `"${r.deskripsi_satker.replace(/"/g, '""')}"`,
        `"${r.nomor_kontrak.replace(/"/g, '""')}"`,
        `"${r.nama_supplier.replace(/"/g, '""')}"`,
        r.tanggal_mulai,
        r.tanggal_selesai,
        item.durationDays,
        item.daysRemaining,
        item.urgencyLevel,
        r.nilai_kontrak,
        r.nilai_pembayaran,
        r.sisa_kontrak,
        `"${r.uraian_kontrak.replace(/"/g, '""')}"`
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Jatuh_Tempo_Kontrak_KPPN_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* BANNER HEADER */}
      <div
        className={`p-5 rounded-3xl border shadow-sm ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-900/60'
            : 'bg-gradient-to-r from-amber-50/70 via-white to-indigo-50/70 border-amber-200/80 shadow-amber-500/5'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Hourglass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Analisis Aging, Durasi &amp; Early Warning Jatuh Tempo Kontrak
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  MONITORING WAKTU
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Peringatan dini sisa waktu pelaksanaan kontrak, deteksi kontrak lewat batas akhir yang belum lunas, dan diagnostik lead time pengerjaan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Ref Tanggal: {aging.referenceDate}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4 SCORECARDS AGING */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Rata-rata Durasi */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">RATA-RATA DURASI</span>
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl sm:text-3xl font-mono font-black text-indigo-600 dark:text-indigo-400">
              {aging.avgDurationDays}
            </strong>
            <span className="text-xs text-slate-400 font-bold">Hari Kalender</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Min: {aging.minDurationDays} hari • Max: {aging.maxDurationDays} hari
          </span>
        </div>

        {/* Card 2: Kontrak Overdue */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
            isDark ? 'bg-slate-900 border-rose-950' : 'bg-white border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">LEWAT BATAS AKHIR</span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl sm:text-3xl font-mono font-black text-rose-600 block">
            {formatNumber(aging.overdueCount)}
          </strong>
          <div className="flex items-center gap-1.5 text-[11px] text-rose-600 mt-1">
            <span className="font-bold">Sisa: {formatRupiah(aging.overdueSisa)}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Tanggal selesai terlewati tapi sisa &gt; Rp 0
          </span>
        </div>

        {/* Card 3: Jatuh Tempo < 15 Hari */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
            isDark ? 'bg-slate-900 border-amber-950' : 'bg-white border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">KRITIS &lt; 15 HARI</span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl sm:text-3xl font-mono font-black text-amber-600 block">
            {formatNumber(aging.criticalCount)}
          </strong>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-600 mt-1">
            <span className="font-bold">Sisa: {formatRupiah(aging.criticalSisa)}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Jatuh tempo dalam 1 s.d. 14 hari ke depan
          </span>
        </div>

        {/* Card 4: Waspada 15 - 30 Hari */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">WASPADA (15 - 30 HARI)</span>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl sm:text-3xl font-mono font-black text-blue-600 dark:text-blue-400 block">
            {formatNumber(aging.warningCount)}
          </strong>
          <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 mt-1">
            <span className="font-bold">Sisa: {formatRupiah(aging.warningSisa)}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Jatuh tempo 15 - 30 hari ke depan
          </span>
        </div>
      </div>

      {/* 2 DIAGRAM VISUALISASI AGING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Distribusi Masa Pelaksanaan Kontrak */}
        <div
          className={`p-5 rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Distribusi Masa Pelaksanaan Kontrak</span>
          </h4>
          <p className="text-[11px] text-slate-400 mb-4">
            Pengelompokan durasi hari pengerjaan (dari tanggal mulai ke tanggal selesai)
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aging.durationBrackets} margin={{ left: 10, right: 30, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={45} />
                <YAxis fontSize={11} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `${formatNumber(val)} kontrak`,
                    'Jumlah Kontrak'
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {aging.durationBrackets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Komposisi Countdown Jatuh Tempo */}
        <div
          className={`p-5 rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h4 className="font-extrabold text-xs sm:text-sm mb-1 flex items-center gap-1.5">
            <Hourglass className="w-4 h-4 text-amber-600" />
            <span>Countdown Status Jatuh Tempo &amp; Pelunasan</span>
          </h4>
          <p className="text-[11px] text-slate-400 mb-4">
            Perbandingan kontrak lunas, on-track, waspada, kritis, dan overdue
          </p>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aging.countdownChartData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {aging.countdownChartData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `${formatNumber(val)} kontrak`,
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

      {/* DAFTAR KONTRAK PRIORITAS TINDAKAN SEGERA */}
      <div
        className={`p-5 rounded-3xl border shadow-sm space-y-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <span>Daftar Kontrak Memerlukan Tindakan Cepat ({filteredList.length} Kontrak)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kontrak yang sudah lewat tanggal selesai atau jatuh tempo dalam waktu dekat dengan sisa dana belum cair.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Quick filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setUrgencyFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                urgencyFilter === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Semua Urgent ({aging.urgentAttentionList.length})
            </button>
            <button
              onClick={() => setUrgencyFilter('OVERDUE')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                urgencyFilter === 'OVERDUE'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              <AlertOctagon className="w-3 h-3" />
              <span>Lewat Batas ({aging.overdueCount})</span>
            </button>
            <button
              onClick={() => setUrgencyFilter('CRITICAL')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                urgencyFilter === 'CRITICAL'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              <Hourglass className="w-3 h-3" />
              <span>Kritis &lt; 15 Hari ({aging.criticalCount})</span>
            </button>
            <button
              onClick={() => setUrgencyFilter('WARNING')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                urgencyFilter === 'WARNING'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Waspada 15-30 Hari ({aging.warningCount})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari satker, rekanan, nomor kontrak..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table of urgent contracts */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3">Satker &amp; No. Kontrak</th>
                <th className="p-3">Rekanan / Supplier</th>
                <th className="p-3">Tgl Selesai &amp; Status Sisa Waktu</th>
                <th className="p-3 text-right">Nilai Kontrak</th>
                <th className="p-3 text-right">Sisa Belum Cair</th>
                <th className="p-3 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ditemukan data kontrak yang memenuhi kriteria filter urgency ini.
                  </td>
                </tr>
              ) : (
                filteredList.slice(0, 50).map((item, idx) => {
                  const r = item.record;
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

                      <td className="p-3 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          {r.tanggal_selesai}
                        </div>
                        {item.urgencyLevel === 'CRITICAL_OVERDUE' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 mt-1">
                            <AlertOctagon className="w-3 h-3" />
                            <span>LEWAT {Math.abs(item.daysRemaining)} HARI</span>
                          </span>
                        ) : item.urgencyLevel === 'HIGH_15_DAYS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 mt-1">
                            <Hourglass className="w-3 h-3" />
                            <span>SISA {item.daysRemaining} HARI LAGI</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>SISA {item.daysRemaining} HARI LAGI</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatRupiah(r.nilai_kontrak)}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {formatRupiah(r.sisa_kontrak)}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Cair: {r.nilai_kontrak > 0 ? ((r.nilai_pembayaran / r.nilai_kontrak) * 100).toFixed(0) : 0}%
                        </span>
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleCopyWa(item, idx)}
                          title="Salin template WhatsApp untuk konfirmasi ke Satker"
                          className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-bold transition-all border border-emerald-200 dark:border-emerald-800 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedIndex === idx ? 'Tersalin!' : 'WA Satker'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
