import React, { useState, useMemo } from 'react';
import {
  GajiSatkerBulanan,
  GajiIndukSummary
} from '../../types';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import {
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Users,
  Check,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Activity,
  PhoneCall,
  Zap,
  Clock,
  Coins,
  CheckCircle2
} from 'lucide-react';

interface GajiIndukAdminAnalyticsProps {
  aggregatedData: GajiSatkerBulanan[];
  summary: GajiIndukSummary;
  periode: string;
  isDark?: boolean;
  onFilterStatusChange: (status: 'SEMUA' | 'SUDAH' | 'BELUM' | 'BERUBAH') => void;
}

const formatRupiahGaji = (num: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num || 0);
};

export const GajiIndukAdminAnalytics: React.FC<GajiIndukAdminAnalyticsProps> = ({
  aggregatedData,
  summary,
  periode,
  isDark = false,
  onFilterStatusChange
}) => {
  const [copiedWA, setCopiedWA] = useState(false);
  const [copiedSatkerWA, setCopiedSatkerWA] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'komposisi' | 'skala' | 'fluktuasi' | 'watchlist'>('status');

  const bgCard = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const bgSubtle = isDark ? 'bg-slate-800/60' : 'bg-slate-50';

  const persentasePenyampaian = summary.totalSatkerWajib > 0
    ? Math.round((summary.sudahKirim / summary.totalSatkerWajib) * 100)
    : 0;

  // 1. Data Donut Status Pengiriman
  const dataDonutStatus = useMemo(() => [
    { name: 'Sudah Mengirim', value: summary.sudahKirim, color: '#10b981' },
    { name: 'Belum Mengirim', value: summary.belumKirim, color: '#ef4444' }
  ], [summary]);

  // 2. Data Bar Komposisi PNS vs PPPK
  const dataKomposisiGaji = useMemo(() => [
    {
      name: 'PNS',
      satker: summary.pnsWajib,
      spmTerbit: summary.pnsTotalSpm,
      nominal: summary.pnsTotalPembayaran
    },
    {
      name: 'PPPK / P3K',
      satker: summary.pppkWajib,
      spmTerbit: summary.pppkTotalSpm,
      nominal: summary.pppkTotalPembayaran
    }
  ], [summary]);

  // 3. Analisis Distribusi Skala Pembayaran Nominal Gaji
  const dataSkalaNominal = useMemo(() => {
    let mikro = 0; // < 50 Jt
    let kecil = 0; // 50 Jt - 250 Jt
    let menengah = 0; // 250 Jt - 1 M
    let besar = 0; // > 1 M

    aggregatedData.forEach(s => {
      const bayar = s.totalPembayaran || 0;
      if (bayar > 0) {
        if (bayar < 50000000) mikro++;
        else if (bayar <= 250000000) kecil++;
        else if (bayar <= 1000000000) menengah++;
        else besar++;
      }
    });

    return [
      { rentang: '< Rp 50 Jt', label: 'Skala Mikro', satker: mikro, color: '#94a3b8' },
      { rentang: 'Rp 50 - 250 Jt', label: 'Skala Kecil', satker: kecil, color: '#3b82f6' },
      { rentang: 'Rp 250 Jt - 1 M', label: 'Skala Menengah', satker: menengah, color: '#8b5cf6' },
      { rentang: '> Rp 1 Miliar', label: 'Skala Besar', satker: besar, color: '#10b981' }
    ];
  }, [aggregatedData]);

  // 4. Analisis Fluktuasi SPM Antarbulan & Satker Ekstrem
  const { satkerFluktuasiCount, topFluktuasiList } = useMemo(() => {
    const fluktuasi = aggregatedData.filter(s => s.arahPerubahan === 'NAIK' || s.arahPerubahan === 'TURUN');
    
    // Sort by absolute selisihSpm terbesar
    const sorted = [...fluktuasi].sort((a, b) => {
      const diffA = Math.abs(a.selisihSpm || 0);
      const diffB = Math.abs(b.selisihSpm || 0);
      return diffB - diffA;
    });

    return {
      satkerFluktuasiCount: fluktuasi.length,
      topFluktuasiList: sorted.slice(0, 6)
    };
  }, [aggregatedData]);

  // 5. Watchlist Satker Belum Mengajukan SPM
  const satkerBelumList = useMemo(() => {
    return aggregatedData
      .filter(s => s.statusPengiriman === 'BELUM_MENGIRIM')
      .slice(0, 6);
  }, [aggregatedData]);

  // 6. Siklus Kesiapan SP2D
  const kesiapanSp2d = useMemo(() => {
    let sp2dAda = 0;
    let spmAdaSp2dBelum = 0;
    let belumSpm = 0;

    aggregatedData.forEach(s => {
      if (s.statusSp2dSummary === 'SP2D ADA') sp2dAda++;
      else if (s.statusSp2dSummary === 'SP2D BELUM ADA' || s.statusSp2dSummary === 'SPM ADA') spmAdaSp2dBelum++;
      else belumSpm++;
    });

    return { sp2dAda, spmAdaSp2dBelum, belumSpm };
  }, [aggregatedData]);

  // Handle Copy WA Broadcast
  const handleCopyWA = () => {
    const text = `*PEMERINTAH KOTA SEMARANG / KPPN SEMARANG I*
*PENGINGAT PENYAMPAIAN SPM GAJI INDUK PNS & PPPK*
Periode: ${periode}
Update: ${new Date().toLocaleDateString('id-ID')}

Yth. Pejabat Penandatangan SPM (PPSPM) & Bendahara Gaji Satker Mitra KPPN Semarang I,

Diberitahukan monitoring penyampaian SPM Gaji Induk:
- Total Satker Wajib: ${summary.totalSatkerWajib} Satker
- Sudah Mengajukan SPM: ${summary.sudahKirim} Satker (${persentasePenyampaian}%)
- Belum Mengajukan: ${summary.belumKirim} Satker

Mengingat batas waktu penerbitan SP2D Gaji Induk tepat waktu sebelum awal bulan berkenaan, kami himbau satker yang belum mengajukan SPM Gaji agar segera memproses pengajuan SPM melalui aplikasi SAKTI.

Terima kasih.
_Seksi Pencairan Dana (PD) / Seksi Vera KPPN Semarang I_`;

    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  // Handle Copy WA Personal ke Satker
  const handleCopyPersonalWA = (satker: GajiSatkerBulanan) => {
    const text = `*PEMBERITAHUAN SPM GAJI INDUK KPPN SEMARANG I*
Yth. Pejabat Penandatangan SPM (PPSPM) Satker ${satker.namaSatker} (${satker.kodeSatker}),

Berdasarkan monitoring Aplikasi SAKTI KPPN Semarang I Periode ${periode}, satker Anda tercatat *BELUM MENGAJUKAN SPM GAJI INDUK* (${satker.jenisGaji}).
Guna memastikan hak pembayaran gaji pegawai terbit tepat waktu pada awal bulan tanpa kendala penolakan sistem, mohon untuk segera mengunggah ADK SPM Gaji ke KPPN hari ini.

Terima kasih atas kerja samanya.
_Seksi Pencairan Dana (PD) KPPN Semarang I_`;

    navigator.clipboard.writeText(text);
    setCopiedSatkerWA(satker.kodeSatker);
    setTimeout(() => setCopiedSatkerWA(null), 2500);
  };

  return (
    <div className={`p-6 rounded-3xl border shadow-sm ${bgCard} space-y-6 relative overflow-hidden transition-all duration-300`}>
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Analisis Admin */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wide uppercase bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-xs">
              🏛️ Mode Analisis Internal KPPN
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Periode: {periode}
            </span>
            <span className={`text-xs ${textMuted}`}>
              • Populasi Wajib: <strong>{summary.totalSatkerWajib} Satker</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Pusat Analisis &amp; Diagram Monitoring SPM Gaji Induk
          </h2>
          <p className={`text-xs sm:text-sm ${textMuted} mt-0.5 max-w-3xl`}>
            Pantau kepatuhan satker dalam pengajuan SPM Gaji Induk tepat waktu, rincian perbandingan PNS vs PPPK, 
            skala belanja pegawai, serta deteksi fluktuasi jumlah SPM antarbulan.
          </p>
        </div>

        {/* Tab & WA Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('status')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'status'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Rasio Pengajuan</span>
            </button>
            <button
              onClick={() => setActiveTab('komposisi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'komposisi'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>PNS vs PPPK</span>
            </button>
            <button
              onClick={() => setActiveTab('skala')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'skala'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Skala Nominal</span>
            </button>
            <button
              onClick={() => setActiveTab('fluktuasi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'fluktuasi'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Fluktuasi ({satkerFluktuasiCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'watchlist'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Belum SPM ({summary.belumKirim})</span>
            </button>
          </div>

          <button
            onClick={handleCopyWA}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Salin template broadcast WhatsApp untuk pengingat SPM Gaji Induk"
          >
            {copiedWA ? <Check className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
            <span>{copiedWA ? 'Tersalin!' : 'Pesan WA Broadcast'}</span>
          </button>
        </div>
      </div>

      {/* Row Ringkasan KPI Analitis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div 
          onClick={() => onFilterStatusChange('SUDAH')}
          className={`p-4 rounded-2xl border ${bgSubtle} border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-400 transition-colors`}
        >
          <div className={`text-xs font-bold ${textMuted}`}>Tingkat Pengajuan SPM</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {persentasePenyampaian}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary.sudahKirim} dari {summary.totalSatkerWajib} Satker
          </div>
        </div>

        <div 
          onClick={() => onFilterStatusChange('BELUM')}
          className={`p-4 rounded-2xl border ${bgSubtle} border-slate-200 dark:border-slate-800 cursor-pointer hover:border-rose-400 transition-colors`}
        >
          <div className={`text-xs font-bold ${textMuted}`}>Belum Mengajukan SPM</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
            {summary.belumKirim} Satker
          </div>
          <div className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Perlu Segera Diingatkan</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${bgSubtle} border-slate-200 dark:border-slate-800`}>
          <div className={`text-xs font-bold ${textMuted}`}>Total SPM Gaji Terbit</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {summary.totalSpm} SPM
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1 truncate">
            {formatRupiahGaji(summary.totalPembayaran)}
          </div>
        </div>

        <div 
          onClick={() => onFilterStatusChange('BERUBAH')}
          className={`p-4 rounded-2xl border ${bgSubtle} border-slate-200 dark:border-slate-800 cursor-pointer hover:border-amber-400 transition-colors`}
        >
          <div className={`text-xs font-bold ${textMuted}`}>Perubahan Jumlah SPM</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
            {satkerFluktuasiCount} Satker
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Fluktuasi mutasi / pegawai baru
          </div>
        </div>
      </div>

      {/* CONTENT TAB 1: RASIO PENGAJUAN (Donut Chart & Siklus SP2D) */}
      {activeTab === 'status' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-between">
            <div className="w-full text-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Rasio Satker Sudah vs Belum Mengajukan SPM
              </h3>
              <p className="text-xs text-slate-400">
                Populasi {summary.totalSatkerWajib} Satker yang memiliki kewajiban gaji
              </p>
            </div>

            <div className="relative w-48 h-48 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataDonutStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dataDonutStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{persentasePenyampaian}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Terkirim</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 text-center text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => onFilterStatusChange('SUDAH')}
                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div>{summary.sudahKirim} Satker</div>
                <div className="text-[10px] font-normal text-emerald-600">Sudah Mengirim</div>
              </button>
              <button
                onClick={() => onFilterStatusChange('BELUM')}
                className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div>{summary.belumKirim} Satker</div>
                <div className="text-[10px] font-normal text-rose-600">Belum Mengirim</div>
              </button>
            </div>
          </div>

          {/* Siklus Kesiapan Penerbitan SP2D Tepat Waktu */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Monitoring Siklus Penerbitan SP2D Tepat Waktu (Tanggal 1)</span>
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Memastikan seluruh SP2D Gaji terbit tepat waktu untuk tanggal 1 awal bulan berkenaan
              </p>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">SP2D Sudah Terbit</div>
                      <div className="text-[10px] text-slate-400">Siap dicairkan bank persepsi</div>
                    </div>
                  </div>
                  <span className="text-lg font-black text-emerald-600">{kesiapanSp2d.sp2dAda} Satker</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">SPM Masuk (Menunggu SP2D)</div>
                      <div className="text-[10px] text-slate-400">Dalam proses verifikasi &amp; approver</div>
                    </div>
                  </div>
                  <span className="text-lg font-black text-amber-600">{kesiapanSp2d.spmAdaSp2dBelum} Satker</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Belum Mengajukan SPM</div>
                      <div className="text-[10px] text-slate-400">Terancam terlambat terima gaji</div>
                    </div>
                  </div>
                  <span className="text-lg font-black text-rose-600">{kesiapanSp2d.belumSpm} Satker</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200">
              <strong>Seksi Pencairan Dana (PD):</strong> Pastikan seluruh nomor SPP dan SPM telah terkirim ke KPPN dan tidak tersangkut di status draft validator satker.
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TAB 2: KOMPOSISI PNS / PPPK */}
      {activeTab === 'komposisi' && (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Perbandingan Populasi &amp; Volume SPM Gaji PNS vs PPPK
              </h3>
              <p className="text-xs text-slate-400">
                Rincian jumlah satker dan volume penerbitan SPM menurut kelompok aparatur
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-600">Gaji Induk PNS</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {summary.pnsWajib} <span className="text-xs text-slate-400 font-normal">Satker Wajib</span>
              </div>
              <div className="text-xs text-slate-500 mt-2 space-y-1">
                <div>Sudah Mengajukan: <strong>{summary.pnsSudah} Satker</strong></div>
                <div>Total SPM Terbit: <strong>{summary.pnsTotalSpm} SPM</strong></div>
                <div className="text-emerald-600 font-bold">Nominal: {formatRupiahGaji(summary.pnsTotalPembayaran)}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-600">Gaji Induk PPPK / P3K</span>
                <Users className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {summary.pppkWajib} <span className="text-xs text-slate-400 font-normal">Satker Wajib</span>
              </div>
              <div className="text-xs text-slate-500 mt-2 space-y-1">
                <div>Sudah Mengajukan: <strong>{summary.pppkSudah} Satker</strong></div>
                <div>Total SPM Terbit: <strong>{summary.pppkTotalSpm} SPM</strong></div>
                <div className="text-emerald-600 font-bold">Nominal: {formatRupiahGaji(summary.pppkTotalPembayaran)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TAB 3: SKALA NOMINAL BELANJA PEGAWAI */}
      {activeTab === 'skala' && (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Distribusi Satker Menurut Skala Nominal Gaji Induk (Akun 51)
            </h3>
            <p className="text-xs text-slate-400">
              Pengelompokan satker berdasarkan besaran total pembayaran gaji per bulan
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataSkalaNominal} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="rentang" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Bar dataKey="satker" name="Jumlah Satker" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {dataSkalaNominal.map((entry, index) => (
                    <Cell key={`skala-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {dataSkalaNominal.map((s, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center">
                <div className="text-xs font-bold text-slate-500">{s.label}</div>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{s.satker} Satker</div>
                <div className="text-[10px] text-slate-400">{s.rentang}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT TAB 4: FLUKTUASI SPM GAJI ANTARBULAN */}
      {activeTab === 'fluktuasi' && (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-500" />
                <span>Analisis Fluktuasi Jumlah SPM Antarbulan</span>
              </h3>
              <p className="text-xs text-slate-400">
                Deteksi satker yang mengalami lonjakan atau pengurangan penerbitan SPM dibanding bulan lalu
              </p>
            </div>
            <button
              onClick={() => onFilterStatusChange('BERUBAH')}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer"
            >
              Filter Tabel: Berubah
            </button>
          </div>

          {topFluktuasiList.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-xl">
              Belum terdeteksi satker dengan fluktuasi jumlah SPM pada periode ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {topFluktuasiList.map((satker, idx) => {
                const diff = satker.selisihSpm || 0;
                const isNaik = diff > 0;
                return (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span className="truncate max-w-[180px]" title={satker.namaSatker}>{satker.namaSatker}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        isNaik ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isNaik ? `+${diff} SPM (Naik)` : `${diff} SPM (Turun)`}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Jumlah SPM: <strong>{satker.jumlahSpm} SPM</strong> (Bulan lalu: {satker.jumlahSpmBulanLalu ?? '-'} SPM)
                    </div>
                    <div className="text-xs font-bold text-emerald-600">
                      {formatRupiahGaji(satker.totalPembayaran)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTENT TAB 5: WATCHLIST SATKER BELUM MENGAJUKAN */}
      {activeTab === 'watchlist' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-rose-600" />
                <span>Satker yang Belum Mengajukan SPM Gaji Induk</span>
              </h4>
              <span className="text-[11px] text-rose-600 font-semibold">
                Batas Pengajuan: Segera Sebelum Cut-Off
              </span>
            </div>

            {satkerBelumList.length === 0 ? (
              <div className="p-4 text-center text-xs text-emerald-600 font-bold bg-white dark:bg-slate-900 rounded-xl">
                🎉 Luar biasa! Seluruh satker wajib telah berhasil mengajukan SPM Gaji Induk.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {satkerBelumList.map((satker, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-2 hover:border-rose-400 transition-all"
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
                      <div className="text-[11px] text-slate-500 mt-1">
                        Jenis: <strong className="text-slate-800 dark:text-slate-200">{satker.jenisGaji}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyPersonalWA(satker)}
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Salin template WhatsApp pengingat untuk satker ini"
                    >
                      {copiedSatkerWA === satker.kodeSatker ? <Check className="w-3 h-3" /> : <PhoneCall className="w-3 h-3" />}
                      <span>{copiedSatkerWA === satker.kodeSatker ? 'Pesan Disalin!' : 'Kirim Pengingat WA'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Catatan Kaki Analisis Admin */}
      <div className={`p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Prospek Gaji Induk:</strong> Kepatuhan pengajuan SPM Gaji berada di <strong>{persentasePenyampaian}%</strong>. Hubungi segera <strong>{summary.belumKirim} satker</strong> yang belum mengajukan agar hak gaji ASN/PPPK cair tepat waktu tanggal 1.
          </span>
        </div>
      </div>
    </div>
  );
};
