import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  BarChart3,
  PieChart as PieIcon,
  MessageSquare,
  Zap,
  PhoneCall,
  Activity,
  Layers,
  Award
} from 'lucide-react';
import {
  MonitoringRekonsiliasiRecord,
  RekonsiliasiBatchSummary,
  KpiFilterType
} from '../../types';

interface RekonsiliasiAdminAnalyticsProps {
  records: MonitoringRekonsiliasiRecord[];
  summary: RekonsiliasiBatchSummary;
  periode: string;
  isDark: boolean;
  onFilterChange: (filter: KpiFilterType) => void;
  activeFilter: KpiFilterType;
}

export const RekonsiliasiAdminAnalytics: React.FC<RekonsiliasiAdminAnalyticsProps> = ({
  records,
  summary,
  periode,
  isDark,
  onFilterChange,
  activeFilter
}) => {
  const [copiedWA, setCopiedWA] = useState(false);
  const [copiedSatkerWA, setCopiedSatkerWA] = useState<string | null>(null);
  const [chartTab, setChartTab] = useState<'3pilar' | 'bottleneck' | 'kl_distribusi' | 'resiko'>('3pilar');

  const bgCard = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const bgSubtle = isDark ? 'bg-slate-800/60' : 'bg-slate-50';

  // Persentase Kepatuhan 3 Pilar Utama
  const pctRekon = summary.totalSatker ? Math.round((summary.rekonsiliasiSelesai / summary.totalSatker) * 100) : 0;
  const pctTodolist = summary.totalSatker ? Math.round((summary.todolistSelesai / summary.totalSatker) * 100) : 0;
  const pctTutup = summary.totalSatker ? Math.round((summary.sudahTutupPeriode / summary.totalSatker) * 100) : 0;
  const indeksKomposit = Math.round((pctRekon * 0.4) + (pctTodolist * 0.4) + (pctTutup * 0.2));

  // 1. Data Donut untuk 3 Pilar
  const dataPilarRekon = useMemo(() => [
    { name: 'Rekon Selesai (SHR)', value: summary.rekonsiliasiSelesai, color: '#10b981' },
    { name: 'Rekon Belum (TDK)', value: summary.rekonsiliasiBelumSelesai, color: '#ef4444' }
  ], [summary]);

  const dataPilarTodolist = useMemo(() => [
    { name: 'Todolist Selesai (0)', value: summary.todolistSelesai, color: '#10b981' },
    { name: 'Ada Todolist', value: summary.todolistBelumSelesai, color: '#f59e0b' }
  ], [summary]);

  const dataPilarTutup = useMemo(() => [
    { name: 'Sudah Tutup', value: summary.sudahTutupPeriode, color: '#10b981' },
    { name: 'Belum Tutup', value: summary.belumTutupPeriode, color: '#6366f1' }
  ], [summary]);

  // 2. Data Analisis Bottleneck (Di mana Satker Terhambat?)
  const dataBottleneck = useMemo(() => [
    {
      kategori: 'Belum Rekon (TDK)',
      jumlah: summary.rekonsiliasiBelumSelesai,
      filter: 'REKON_BELUM' as KpiFilterType,
      color: '#ef4444'
    },
    {
      kategori: 'Masih Ada Todolist',
      jumlah: summary.todolistBelumSelesai,
      filter: 'TODOLIST_BELUM' as KpiFilterType,
      color: '#f59e0b'
    },
    {
      kategori: 'Belum Tutup Periode',
      jumlah: summary.belumTutupPeriode,
      filter: 'BELUM_TUTUP' as KpiFilterType,
      color: '#6366f1'
    },
    {
      kategori: 'Terbit Sanksi SP2S',
      jumlah: summary.adaSp2s || 0,
      filter: 'ADA_SP2S' as KpiFilterType,
      color: '#dc2626'
    },
    {
      kategori: 'Ada Dispensasi',
      jumlah: summary.adaDispensasi || 0,
      filter: 'ADA_DISPENSASI' as KpiFilterType,
      color: '#8b5cf6'
    }
  ], [summary]);

  // 3. Distribusi Kendala per Rumpun K/L
  const dataKLDistribusi = useMemo(() => {
    const klMap: { [key: string]: { namaKL: string; rekonBelum: number; todolistBelum: number; belumTutup: number; total: number } } = {};

    records.forEach(r => {
      const prefix = (r.noKppnSatker || '').substring(0, 3);
      let klName = 'Lain-lain';

      if (prefix === '025' || r.namaSatker.includes('AGAMA') || r.namaSatker.includes('KEMENAG') || r.namaSatker.includes('MADRASAH') || r.namaSatker.includes('MTSN') || r.namaSatker.includes('MAN ')) {
        klName = 'Kemenag';
      } else if (prefix === '060' || r.namaSatker.includes('POLRES') || r.namaSatker.includes('POLDA') || r.namaSatker.includes('POLRI') || r.namaSatker.includes('KEPOLISIAN')) {
        klName = 'Polri';
      } else if (prefix === '012' || r.namaSatker.includes('KUMHAM') || r.namaSatker.includes('LAPAS') || r.namaSatker.includes('RUTAN') || r.namaSatker.includes('BAPAS') || r.namaSatker.includes('IMIGRASI')) {
        klName = 'Kemenkumham';
      } else if (prefix === '018' || r.namaSatker.includes('KESEHATAN') || r.namaSatker.includes('RSUP') || r.namaSatker.includes('POLTEKKES') || r.namaSatker.includes('BBPK')) {
        klName = 'Kemenkes';
      } else if (prefix === '023' || r.namaSatker.includes('PAJAK') || r.namaSatker.includes('BEA CUKAI') || r.namaSatker.includes('KPPN') || r.namaSatker.includes('KPKNL')) {
        klName = 'Kemenkeu';
      } else if (prefix === '005' || r.namaSatker.includes('PENGADILAN') || r.namaSatker.includes('MAHKAMAH')) {
        klName = 'Mahkamah Agung';
      } else if (prefix === '022' || r.namaSatker.includes('PERHUBUNGAN') || r.namaSatker.includes('DISTRIK NAVIGASI') || r.namaSatker.includes('KSOP')) {
        klName = 'Kemenhub';
      } else if (r.namaSatker.includes('UNIVERSITAS') || r.namaSatker.includes('UNDIP') || r.namaSatker.includes('UNNES') || r.namaSatker.includes('POLINES') || r.namaSatker.includes('DIKTI')) {
        klName = 'Kemendikbud';
      } else if (prefix === '033' || r.namaSatker.includes('BPN') || r.namaSatker.includes('PERTANAHAN')) {
        klName = 'Kementerian ATR/BPN';
      }

      if (!klMap[klName]) {
        klMap[klName] = { namaKL: klName, rekonBelum: 0, todolistBelum: 0, belumTutup: 0, total: 0 };
      }

      klMap[klName].total += 1;
      if (r.rekonsiliasiStatus === 'BELUM_SELESAI') klMap[klName].rekonBelum += 1;
      if (r.todolistStatus === 'BELUM_SELESAI') klMap[klName].todolistBelum += 1;
      if (r.tutupPeriodeStatus === 'BELUM_TUTUP') klMap[klName].belumTutup += 1;
    });

    return Object.values(klMap)
      .sort((a, b) => (b.rekonBelum + b.todolistBelum) - (a.rekonBelum + a.todolistBelum))
      .slice(0, 8);
  }, [records]);

  // 4. Matriks Risiko Satker & Top 5 Satker Paling Kritis
  const { riskMatrix, topKritisSatker } = useMemo(() => {
    const tinggi: MonitoringRekonsiliasiRecord[] = [];
    const sedang: MonitoringRekonsiliasiRecord[] = [];
    const rendah: MonitoringRekonsiliasiRecord[] = [];

    records.forEach(r => {
      const isRekonBelum = r.rekonsiliasiStatus === 'BELUM_SELESAI';
      const isTodolistBelum = r.todolistStatus === 'BELUM_SELESAI';
      const isBelumTutup = r.tutupPeriodeStatus === 'BELUM_TUTUP';

      if (isRekonBelum && isTodolistBelum && isBelumTutup) {
        tinggi.push(r);
      } else if (isRekonBelum || isTodolistBelum || isBelumTutup) {
        sedang.push(r);
      } else {
        rendah.push(r);
      }
    });

    // Top 5 satker kritis yang perlu penanganan segera
    const topKritis = [...tinggi]
      .slice(0, 5);

    return { riskMatrix: { tinggi, sedang, rendah }, topKritisSatker: topKritis };
  }, [records]);

  // Handle copy text WA tindak lanjut broadcast
  const handleCopyWA = () => {
    const text = `*PEMERINTAH KOTA SEMARANG / KPPN SEMARANG I*
*PEMANTAUAN KEPATUHAN REKONSILIASI & TUTUP PERIODE SAKTI*
Periode: ${periode}
Update: ${new Date().toLocaleDateString('id-ID')}

Yth. Kuasa Pengguna Anggaran & Operator Satker Mitra KPPN Semarang I,

Diberitahukan ringkasan kepatuhan SAKTI sbb:
1. Satker Belum Rekonsiliasi (TDK): ${summary.rekonsiliasiBelumSelesai} Satker
2. Satker Masih Ada Todolist: ${summary.todolistBelumSelesai} Satker
3. Satker Belum Tutup Periode: ${summary.belumTutupPeriode} Satker

Mohon satker yang masih memiliki selisih rekon dan data todolist segera menuntaskan sebelum batas akhir agar tidak dikenakan sanksi SP2S / penolakan SPM.

Terima kasih.
_Seksi Verifikasi dan Akuntansi (Vera) KPPN Semarang I_`;

    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  // Handle Copy WA Personal ke Satker
  const handleCopyPersonalWA = (satker: MonitoringRekonsiliasiRecord) => {
    const text = `*PEMBERITAHUAN KEPATUHAN REKONSILIASI SAKTI KPPN SEMARANG I*
Yth. Pengelola Keuangan Satker ${satker.namaSatker} (${satker.kodeSatker}),

Berdasarkan monitoring Aplikasi SAKTI KPPN Semarang I Periode ${periode}, satker Anda tercatat:
- Rekonsiliasi: ${satker.rekonsiliasiStatus === 'SELESAI' ? '✅ Selesai (SHR)' : '❌ Belum Selesai (TDK)'}
- Todolist SAKTI: ${satker.todolistStatus === 'SELESAI' ? '✅ Bersih (0)' : '⚠️ Masih Ada Transaksi Todolist'}
- Tutup Periode GLP: ${satker.tutupPeriodeStatus === 'SUDAH_TUTUP' ? '✅ Sudah Tutup' : '❌ Belum Tutup Periode'}

Mohon bantuan Bapak/Ibu untuk segera menyelesaikan proses di modul terkait sebelum batas waktu agar nilai IKPA tetap maksimal dan tidak terkena sanksi SP2S. Terima kasih.
_Seksi Vera KPPN Semarang I_`;

    navigator.clipboard.writeText(text);
    setCopiedSatkerWA(satker.kodeSatker);
    setTimeout(() => setCopiedSatkerWA(null), 2500);
  };

  return (
    <div className={`p-6 rounded-3xl border shadow-sm ${bgCard} space-y-6 relative overflow-hidden transition-all duration-300`}>
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Analisis Admin */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wide uppercase bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
              🏛️ Mode Analisis Internal KPPN
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Periode {periode}
            </span>
            <span className={`text-xs ${textMuted}`}>
              • Total Populasi: <strong>{summary.totalSatker} Satker</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Pusat Analisis &amp; Diagram Kepatuhan SAKTI KPPN
          </h2>
          <p className={`text-xs sm:text-sm ${textMuted} mt-0.5 max-w-3xl`}>
            Pantau 3 pilar kepatuhan SAKTI, titik bottleneck kendala satker, matriks risiko, 
            serta daftar satker prioritas intervensi Seksi Verifikasi &amp; Akuntansi.
          </p>
        </div>

        {/* Action: Copy WA Broadcast & Switch View Tabs */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setChartTab('3pilar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartTab === '3pilar'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>3 Pilar SAKTI</span>
            </button>
            <button
              onClick={() => setChartTab('bottleneck')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartTab === 'bottleneck'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Titik Hambatan</span>
            </button>
            <button
              onClick={() => setChartTab('kl_distribusi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartTab === 'kl_distribusi'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Distribusi K/L</span>
            </button>
            <button
              onClick={() => setChartTab('resiko')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartTab === 'resiko'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Matriks Risiko ({riskMatrix.tinggi.length})</span>
            </button>
          </div>

          <button
            onClick={handleCopyWA}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Salin template pengumuman kepatuhan untuk broadcast WhatsApp"
          >
            {copiedWA ? <Check className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
            <span>{copiedWA ? 'Tersalin!' : 'Pesan WA Broadcast'}</span>
          </button>
        </div>
      </div>

      {/* Baris Ringkasan Analitis Indeks Kepatuhan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Indeks Komposit */}
        <div className={`p-4 rounded-2xl border ${bgSubtle} border-slate-200 dark:border-slate-800 flex items-center justify-between`}>
          <div>
            <div className={`text-xs font-bold ${textMuted}`}>Indeks Kepatuhan Komposit</div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {indeksKomposit}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-blue-500" />
              <span>Rekon 40% + Todo 40% + Tutup 20%</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm">
            {indeksKomposit >= 90 ? 'A+' : indeksKomposit >= 80 ? 'A' : indeksKomposit >= 60 ? 'B' : 'C'}
          </div>
        </div>

        {/* Tingkat Rekon */}
        <div 
          onClick={() => onFilterChange('REKON_SELESAI')}
          className={`p-4 rounded-2xl border ${bgSubtle} border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-400 transition-colors`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${textMuted}`}>Tingkat Rekon (SHR)</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              {pctRekon}%
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {summary.rekonsiliasiSelesai} <span className="text-xs text-slate-400 font-normal">/ {summary.totalSatker}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctRekon}%` }} />
          </div>
        </div>

        {/* Tingkat Todolist */}
        <div 
          onClick={() => onFilterChange('TODOLIST_BELUM')}
          className={`p-4 rounded-2xl border ${bgSubtle} border-slate-200 dark:border-slate-800 cursor-pointer hover:border-amber-400 transition-colors`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${textMuted}`}>Todolist Selesai (0)</span>
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
              {pctTodolist}%
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {summary.todolistSelesai} <span className="text-xs text-slate-400 font-normal">/ {summary.totalSatker}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctTodolist}%` }} />
          </div>
        </div>

        {/* Prioritas Kritis */}
        <div 
          onClick={() => setChartTab('resiko')}
          className={`p-4 rounded-2xl border ${bgSubtle} border-slate-200 dark:border-slate-800 cursor-pointer hover:border-rose-400 transition-colors`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${textMuted}`}>Satker Kritis (3 Kendala)</span>
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full">
              Intervensi
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {riskMatrix.tinggi.length} <span className="text-xs text-slate-400 font-normal">Satker</span>
          </div>
          <div className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Perlu pendampingan Seksi Vera</span>
          </div>
        </div>
      </div>

      {/* CONTENT TAB 1: 3 PILAR SAKTI (Donut Charts) */}
      {chartTab === '3pilar' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Donut 1: Rekonsiliasi */}
            <div className={`p-5 rounded-2xl border ${bgSubtle} border-slate-200 dark:border-slate-800 flex flex-col items-center justify-between`}>
              <div className="w-full text-center">
                <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  1. Pilar Rekonsiliasi SAKTI
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Status Sama / Selisih (SHR vs TDK)
                </p>
              </div>

              <div className="relative w-48 h-48 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataPilarRekon}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dataPilarRekon.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{pctRekon}%</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Selesai</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 text-center text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => onFilterChange('REKON_SELESAI')}
                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <div>{summary.rekonsiliasiSelesai} Satker</div>
                  <div className="text-[10px] font-normal text-emerald-600">Selesai (SHR)</div>
                </button>
                <button
                  onClick={() => onFilterChange('REKON_BELUM')}
                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <div>{summary.rekonsiliasiBelumSelesai} Satker</div>
                  <div className="text-[10px] font-normal text-rose-600">Belum (TDK)</div>
                </button>
              </div>
            </div>

            {/* Donut 2: Todolist */}
            <div className={`p-5 rounded-2xl border ${bgSubtle} border-slate-200 dark:border-slate-800 flex flex-col items-center justify-between`}>
              <div className="w-full text-center">
                <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  2. Pilar Todolist SAKTI
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Daftar Pekerjaan Belum Ditindaklanjuti
                </p>
              </div>

              <div className="relative w-48 h-48 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataPilarTodolist}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dataPilarTodolist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{pctTodolist}%</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Bersih</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 text-center text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => onFilterChange('TODOLIST_SELESAI')}
                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <div>{summary.todolistSelesai} Satker</div>
                  <div className="text-[10px] font-normal text-emerald-600">Todolist 0</div>
                </button>
                <button
                  onClick={() => onFilterChange('TODOLIST_BELUM')}
                  className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <div>{summary.todolistBelumSelesai} Satker</div>
                  <div className="text-[10px] font-normal text-amber-600">Ada Todolist</div>
                </button>
              </div>
            </div>

            {/* Donut 3: Tutup Periode */}
            <div className={`p-5 rounded-2xl border ${bgSubtle} border-slate-200 dark:border-slate-800 flex flex-col items-center justify-between`}>
              <div className="w-full text-center">
                <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  3. Pilar Tutup Periode GLP
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Kesiapan Pelaporan Tutup Permanen
                </p>
              </div>

              <div className="relative w-48 h-48 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataPilarTutup}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dataPilarTutup.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{pctTutup}%</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tutup</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 text-center text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => onFilterChange('SUDAH_TUTUP')}
                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <div>{summary.sudahTutupPeriode} Satker</div>
                  <div className="text-[10px] font-normal text-emerald-600">Sudah Tutup</div>
                </button>
                <button
                  onClick={() => onFilterChange('BELUM_TUTUP')}
                  className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <div>{summary.belumTutupPeriode} Satker</div>
                  <div className="text-[10px] font-normal text-indigo-600">Belum Tutup</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TAB 2: TITIK HAMBATAN / BOTTLENECK (Horizontal Bar Chart) */}
      {chartTab === 'bottleneck' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-500" />
                  <span>Pemetaan Titik Hambatan (Bottleneck) Penyelesaian SAKTI</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Klik pada bar indikator untuk langsung memfilter satker dengan kendala terkait pada tabel data
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                Penyebab Terbanyak: {summary.belumTutupPeriode >= summary.todolistBelumSelesai ? 'Belum Tutup Periode GLP' : 'Ada Transaksi Todolist'}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={dataBottleneck}
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="kategori" tick={{ fontSize: 11 }} width={140} />
                  <RechartsTooltip />
                  <Bar
                    dataKey="jumlah"
                    name="Jumlah Satker"
                    radius={[0, 6, 6, 0]}
                    onClick={(entry: any) => {
                      if (entry?.filter) {
                        onFilterChange(entry.filter as KpiFilterType);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {dataBottleneck.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Filter Badges */}
            <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-bold text-slate-500">Filter Cepat:</span>
              {dataBottleneck.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onFilterChange(item.filter)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-300 hover:text-blue-600 font-semibold text-[11px] transition-all cursor-pointer"
                >
                  {item.kategori}: <strong>{item.jumlah}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TAB 3: DISTRIBUSI K/L (Stacked Bar Chart) */}
      {chartTab === 'kl_distribusi' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Distribusi Satker dengan Kendala per Kelompok Kementerian / Lembaga
                </h3>
                <p className="text-xs text-slate-400">
                  Menampilkan 8 rumpun K/L dengan jumlah kendala terbanyak di KPPN Semarang I
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Belum Rekon</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Ada Todolist</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500 inline-block" /> Belum Tutup</span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataKLDistribusi} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="namaKL" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Bar dataKey="rekonBelum" name="Belum Rekon" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="todolistBelum" name="Ada Todolist" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="belumTutup" name="Belum Tutup" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TAB 4: MATRIKS RISIKO & WATCHLIST SATKER KRITIS */}
      {chartTab === 'resiko' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tier 1: Resiko Tinggi (Merah) */}
            <div className="p-5 rounded-2xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-rose-600 text-white flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Prioritas I - Kritis
                </span>
                <span className="text-xl font-black text-rose-700 dark:text-rose-300">
                  {riskMatrix.tinggi.length} Satker
                </span>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-200">
                Satker dengan <strong>3 kendala sekaligus</strong> (Belum Rekon + Ada Todolist + Belum Tutup Periode).
              </p>
              <div className="text-[11px] text-rose-700 dark:text-rose-300 bg-white/60 dark:bg-rose-900/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/60">
                <strong>Rekomendasi Tindakan:</strong> Terbitkan Surat Peringatan (SP2S), hubungi langsung Operator GLP &amp; KPA via WhatsApp, dan jadwalkan klinik bimbingan teknis.
              </div>
              <button
                onClick={() => onFilterChange('REKON_BELUM')}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Tampilkan Satker Kritis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tier 2: Resiko Sedang (Kuning) */}
            <div className="p-5 rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-amber-600 text-white flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Prioritas II - Waspada
                </span>
                <span className="text-xl font-black text-amber-700 dark:text-amber-300">
                  {riskMatrix.sedang.length} Satker
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Satker dengan <strong>1 atau 2 kendala</strong> (misal rekon sudah SHR tetapi masih menyisakan todolist modul piutang/persediaan).
              </p>
              <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-white/60 dark:bg-amber-900/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60">
                <strong>Rekomendasi Tindakan:</strong> Kirim broadcast reminder pembersihan todolist dan persiapan tutup permanen GLP sebelum cut-off.
              </div>
              <button
                onClick={() => onFilterChange('TODOLIST_BELUM')}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Tampilkan Satker Waspada</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tier 3: Resiko Rendah / Tertib (Hijau) */}
            <div className="p-5 rounded-2xl border border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-emerald-600 text-white flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Prioritas III - Prima
                </span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                  {riskMatrix.rendah.length} Satker
                </span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-200">
                Satker tertib yang telah menyelesaikan rekonsiliasi, todolist 0, dan sudah melakukan tutup periode permanen.
              </p>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-white/60 dark:bg-emerald-900/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                <strong>Rekomendasi Tindakan:</strong> Berikan apresiasi kepatuhan dan pertahankan nilai IKPA aspek pelaporan pertanggungjawaban 100%.
              </div>
              <button
                onClick={() => onFilterChange('SUDAH_TUTUP')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Tampilkan Satker Tertib</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Top 5 Satker Prioritas Intervensi */}
          {topKritisSatker.length > 0 && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  <span>Daftar Cepat Satker Kritis Membutuhkan Intervensi Langsung</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  Menampilkan {topKritisSatker.length} satker paling memerlukan asistensi
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {topKritisSatker.map((satker) => (
                  <div
                    key={satker.id}
                    className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col justify-between space-y-2 hover:border-rose-400 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                        <span className="truncate max-w-[200px]" title={satker.namaSatker}>
                          {satker.namaSatker}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 font-mono">
                          {satker.kodeSatker}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-semibold">
                          Belum Rekon
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-semibold">
                          Ada Todolist
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-semibold">
                          Belum Tutup
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyPersonalWA(satker)}
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Salin template WhatsApp pengingat untuk satker ini"
                    >
                      {copiedSatkerWA === satker.kodeSatker ? <Check className="w-3 h-3" /> : <PhoneCall className="w-3 h-3" />}
                      <span>{copiedSatkerWA === satker.kodeSatker ? 'Pesan Disalin!' : 'Kirim WA Satker'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Catatan Kaki Analisis Admin */}
      <div className={`p-4 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Proyeksi IKPA Seksi Vera:</strong> Rekonsiliasi mencapai <strong>{pctRekon}%</strong>. Selesaikan <strong>{summary.rekonsiliasiBelumSelesai} satker</strong> lagi untuk mengunci nilai sempurna aspek penyusunan dan rekonsiliasi laporan keuangan.
          </span>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-bold">
          <span>Filter Aktif:</span>
          <span className="px-2.5 py-0.5 rounded bg-blue-600 text-white text-[11px]">
            {activeFilter}
          </span>
        </div>
      </div>
    </div>
  );
};
