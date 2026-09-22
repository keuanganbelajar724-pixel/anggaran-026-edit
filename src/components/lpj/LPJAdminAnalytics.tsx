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
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Building2,
  Check,
  Sparkles,
  ArrowRight,
  BarChart3,
  PieChart as PieIcon,
  MessageSquare,
  Landmark,
  Coins,
  Clock,
  PhoneCall,
  Zap,
  DollarSign
} from 'lucide-react';
import { MonitoringLPJRecord, LPJBatchSummary } from '../../types';
import { formatRupiah } from '../../utils/lpjExcelParser';

interface LPJAdminAnalyticsProps {
  records: MonitoringLPJRecord[];
  summary: LPJBatchSummary;
  periode: string;
  isDark: boolean;
  onFilterJenisChange: (jenis: string) => void;
  onFilterStatusChange: (status: string) => void;
}

export const LPJAdminAnalytics: React.FC<LPJAdminAnalyticsProps> = ({
  records,
  summary,
  periode,
  isDark,
  onFilterJenisChange,
  onFilterStatusChange
}) => {
  const [copiedWA, setCopiedWA] = useState(false);
  const [copiedSatkerWA, setCopiedSatkerWA] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'komposisi' | 'verifikasi' | 'saldo' | 'watchlist'>('komposisi');

  const bgCard = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const bgSubtle = isDark ? 'bg-slate-800/60' : 'bg-slate-50';

  const persenPengeluaran = summary.bendaharaPengeluaranCount > 0
    ? Math.round((summary.pengeluaranSudahKirim / summary.bendaharaPengeluaranCount) * 100)
    : 0;
  const persenPenerimaan = summary.bendaharaPenerimaanCount > 0
    ? Math.round((summary.penerimaanSudahKirim / summary.bendaharaPenerimaanCount) * 100)
    : 0;
  const persenBlu = summary.bendaharaBluCount > 0
    ? Math.round((summary.bluSudahKirim / summary.bendaharaBluCount) * 100)
    : 0;

  // 1. Data Komposisi Jenis LPJ
  const dataJenisLPJ = useMemo(() => [
    {
      name: 'Pengeluaran',
      sudah: summary.pengeluaranSudahKirim,
      belum: summary.pengeluaranBelumKirim,
      total: summary.bendaharaPengeluaranCount,
      persen: persenPengeluaran,
      color: '#3b82f6'
    },
    {
      name: 'Penerimaan',
      sudah: summary.penerimaanSudahKirim,
      belum: summary.penerimaanBelumKirim,
      total: summary.bendaharaPenerimaanCount,
      persen: persenPenerimaan,
      color: '#8b5cf6'
    },
    {
      name: 'BLU',
      sudah: summary.bluSudahKirim,
      belum: summary.bluBelumKirim,
      total: summary.bendaharaBluCount,
      persen: persenBlu,
      color: '#f59e0b'
    }
  ], [summary, persenPengeluaran, persenPenerimaan, persenBlu]);

  // 2. Data Donut Kepatuhan Keseluruhan
  const dataDonutKepatuhan = useMemo(() => [
    { name: 'Sudah Mengirim', value: summary.sudahKirim, color: '#10b981' },
    { name: 'Belum Mengirim', value: summary.belumKirim, color: '#ef4444' }
  ], [summary]);

  // 3. Data Status Verifikasi
  const verifikasiCounts = useMemo(() => {
    let terverifikasi = 0;
    let menunggu = 0;
    let ditolak = 0;
    let belum = 0;

    records.forEach(r => {
      if (r.statusVerifikasi === 'TERVERIFIKASI' || r.statusVerifikasi === 'DISETUJUI') terverifikasi++;
      else if (r.statusVerifikasi === 'MENUNGGU_VERIFIKASI') menunggu++;
      else if (r.statusVerifikasi === 'DITOLAK') ditolak++;
      else belum++;
    });

    return [
      { name: 'Terverifikasi (BAR Selesai)', value: terverifikasi, color: '#10b981' },
      { name: 'Menunggu Verifikasi KPPN', value: menunggu, color: '#f59e0b' },
      { name: 'Perlu Revisi / Tolakan FO', value: ditolak, color: '#ef4444' },
      { name: 'Belum Kirim Dokumen', value: belum, color: '#94a3b8' }
    ];
  }, [records]);

  // 4. Analisis Total Saldo Kas di Bendahara & Watchlist Saldo Tinggi
  const saldoAnalysis = useMemo(() => {
    let totalKas = 0;
    let totalBank = 0;
    let totalTunai = 0;
    let satkerAdaSelisih = 0;

    // Satker dengan saldo kas tinggi (> Rp 50 Juta)
    const saldoTinggiList: MonitoringLPJRecord[] = [];

    records.forEach(r => {
      const kas = r.totalSaldoKas || 0;
      totalKas += kas;
      totalBank += (r.saldoRekeningBank || 0);
      totalTunai += (r.saldoKasTunai || 0);

      if (r.statusKlopKas === 'SELISIH' || (r.selisihKas && r.selisihKas !== 0)) {
        satkerAdaSelisih++;
      }

      if (kas > 50000000) {
        saldoTinggiList.push(r);
      }
    });

    saldoTinggiList.sort((a, b) => (b.totalSaldoKas || 0) - (a.totalSaldoKas || 0));

    return {
      totalKas,
      totalBank,
      totalTunai,
      satkerAdaSelisih,
      topSaldoKas: saldoTinggiList.slice(0, 5)
    };
  }, [records]);

  // 5. Watchlist Satker Belum Mengirim
  const satkerBelumList = useMemo(() => {
    return records
      .filter(r => r.statusPengiriman === 'BELUM_KIRIM')
      .slice(0, 6);
  }, [records]);

  // Handle Copy WA Broadcast
  const handleCopyWA = () => {
    const text = `*PEMERINTAH KOTA SEMARANG / KPPN SEMARANG I*
*MONITORING KEPATUHAN LPJ BENDAHARA (SAKTI)*
Periode: ${periode}
Update: ${new Date().toLocaleDateString('id-ID')}

Yth. Bendahara Pengeluaran, Penerimaan & BLU Satker Mitra KPPN Semarang I,

Diberitahukan perkembangan penyampaian LPJ Bendahara:
- Bendahara Pengeluaran: ${summary.pengeluaranSudahKirim}/${summary.bendaharaPengeluaranCount} Satker (${persenPengeluaran}%)
- Bendahara Penerimaan: ${summary.penerimaanSudahKirim}/${summary.bendaharaPenerimaanCount} Satker (${persenPenerimaan}%)
- LPJ BLU: ${summary.bluSudahKirim}/${summary.bendaharaBluCount} Satker (${persenBlu}%)
- Total Kepatuhan: ${summary.persenKepatuhan}%

Batas akhir penyampaian LPJ adalah tanggal 10 bulan berikutnya. Mohon satker yang belum mengirim atau memerlukan konfirmasi rekening kas untuk segera menuntaskan.

Terima kasih.
_Seksi Verifikasi dan Akuntansi (Vera) KPPN Semarang I_`;

    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  // Handle Copy WA Personal ke Satker
  const handleCopyPersonalWA = (satker: MonitoringLPJRecord) => {
    const text = `*PEMBERITAHUAN LPJ BENDAHARA KPPN SEMARANG I*
Yth. Bendahara ${satker.jenisBendahara || 'Pengeluaran'} Satker ${satker.namaSatker} (${satker.kodeSatker}),

Berdasarkan monitoring Aplikasi SAKTI KPPN Semarang I Periode ${periode}, berkas LPJ Bendahara Anda tercatat *BELUM DIKIRIM*.
Mohon segera memproses upload dan cetak LPJ SAKTI sebelum batas waktu tanggal 10 agar terhindar dari sanksi penundaan penerbitan SPM/SP2D.

Terima kasih.
_Seksi Vera KPPN Semarang I_`;

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
            <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wide uppercase bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs">
              🏛️ Mode Analisis Internal KPPN
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Periode: {periode}
            </span>
            <span className={`text-xs ${textMuted}`}>
              • Total Berkas LPJ: <strong>{summary.totalSatker} Berkas</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Pusat Analisis &amp; Diagram Kepatuhan LPJ Bendahara
          </h2>
          <p className={`text-xs sm:text-sm ${textMuted} mt-0.5 max-w-3xl`}>
            Pantau perbandingan kepatuhan per jenis bendahara, verifikasi berkas oleh Front Officer, 
            tata kelola saldo kas mengendap di rekening bendahara, dan deteksi dini keterlambatan tanggal 10.
          </p>
        </div>

        {/* Tab & WA Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('komposisi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'komposisi'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Komposisi Bendahara</span>
            </button>
            <button
              onClick={() => setActiveTab('verifikasi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'verifikasi'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verifikasi Berkas</span>
            </button>
            <button
              onClick={() => setActiveTab('saldo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'saldo'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Saldo Kas ({formatRupiah(saldoAnalysis.totalKas)})</span>
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
              <span>Satker Belum ({summary.belumKirim})</span>
            </button>
          </div>

          <button
            onClick={handleCopyWA}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Salin template broadcast WhatsApp untuk LPJ Bendahara"
          >
            {copiedWA ? <Check className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
            <span>{copiedWA ? 'Tersalin!' : 'Pesan WA Broadcast'}</span>
          </button>
        </div>
      </div>

      {/* Row Metrik Analitis Ringkas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div 
          onClick={() => onFilterStatusChange('SUDAH_KIRIM')}
          className={`p-4 rounded-2xl border ${bgSubtle} border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-400 transition-colors`}
        >
          <div className={`text-xs font-bold ${textMuted}`}>Tingkat Kepatuhan LPJ</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {summary.persenKepatuhan}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary.sudahKirim} dari {summary.totalSatker} Berkas Masuk
          </div>
        </div>

        <div 
          onClick={() => onFilterJenisChange('PENGELUARAN')}
          className={`p-4 rounded-2xl border ${bgSubtle} border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-400 transition-colors`}
        >
          <div className={`text-xs font-bold ${textMuted}`}>Bendahara Pengeluaran</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {summary.pengeluaranSudahKirim} <span className="text-xs text-slate-400 font-normal">/ {summary.bendaharaPengeluaranCount}</span>
          </div>
          <div className="text-[11px] text-blue-600 font-bold mt-1">
            {persenPengeluaran}% Kepatuhan
          </div>
        </div>

        <div 
          onClick={() => onFilterJenisChange('PENERIMAAN')}
          className={`p-4 rounded-2xl border ${bgSubtle} border-slate-200 dark:border-slate-800 cursor-pointer hover:border-purple-400 transition-colors`}
        >
          <div className={`text-xs font-bold ${textMuted}`}>Bendahara Penerimaan &amp; BLU</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {summary.penerimaanSudahKirim + summary.bluSudahKirim} <span className="text-xs text-slate-400 font-normal">/ {summary.bendaharaPenerimaanCount + summary.bendaharaBluCount}</span>
          </div>
          <div className="text-[11px] text-purple-600 font-bold mt-1">
            {summary.bendaharaPenerimaanCount + summary.bendaharaBluCount > 0
              ? `${Math.round(((summary.penerimaanSudahKirim + summary.bluSudahKirim) / (summary.bendaharaPenerimaanCount + summary.bendaharaBluCount)) * 100)}% Kepatuhan`
              : '100% Kepatuhan'}
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('saldo')}
          className={`p-4 rounded-2xl border ${bgSubtle} border-slate-200 dark:border-slate-800 cursor-pointer hover:border-amber-400 transition-colors`}
        >
          <div className={`text-xs font-bold ${textMuted}`}>Total Saldo Kas Terpantau</div>
          <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5 truncate">
            {formatRupiah(saldoAnalysis.totalKas)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Klop Kas &amp; Bank SAKTI</span>
          </div>
        </div>
      </div>

      {/* CONTENT TAB 1: KOMPOSISI BENDAHARA */}
      {activeTab === 'komposisi' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar Chart Kepatuhan per Jenis Bendahara */}
          <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Perbandingan Kepatuhan per Jenis Bendahara
                </h3>
                <p className="text-xs text-slate-400">
                  Rincian berkas yang telah dikirimkan vs belum disampaikan ke KPPN Semarang I
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Sudah Kirim</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Belum Kirim</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataJenisLPJ} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Bar dataKey="sudah" name="Sudah Kirim" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="belum" name="Belum Kirim" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart Kepatuhan Keseluruhan */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-between">
            <div className="w-full text-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Rasio Kepatuhan LPJ
              </h3>
              <p className="text-xs text-slate-400">
                Dari {summary.totalSatker} berkas kewajiban satker mitra
              </p>
            </div>

            <div className="relative w-48 h-48 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataDonutKepatuhan}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dataDonutKepatuhan.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{summary.persenKepatuhan}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Kepatuhan</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 text-center text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => onFilterStatusChange('SUDAH_KIRIM')}
                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div>{summary.sudahKirim} Berkas</div>
                <div className="text-[10px] font-normal text-emerald-600">Sudah Kirim</div>
              </button>
              <button
                onClick={() => onFilterStatusChange('BELUM_KIRIM')}
                className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div>{summary.belumKirim} Berkas</div>
                <div className="text-[10px] font-normal text-rose-600">Belum Kirim</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TAB 2: VERIFIKASI BERKAS */}
      {activeTab === 'verifikasi' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              Status Verifikasi &amp; Validasi Dokumen LPJ oleh Front Officer KPPN
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Rekapitulasi berkas yang telah dinyatakan lengkap dan diterbitkan Berita Acara Rekonsiliasi (BAR) LPJ
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {verifikasiCounts.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">{item.name}</span>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  </div>
                  <div className="text-2xl font-black mt-1 text-slate-900 dark:text-white">
                    {item.value} <span className="text-xs text-slate-400 font-normal">Berkas</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {summary.totalSatker ? `${Math.round((item.value / summary.totalSatker) * 100)}% dari total` : '0%'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TAB 3: SALDO KAS BENDAHARA */}
      {activeTab === 'saldo' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                <Coins className="w-4 h-4 text-emerald-500" />
                <span>Total Saldo Kas Terpantau</span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {formatRupiah(saldoAnalysis.totalKas)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Akumulasi seluruh rekening bendahara SAKTI
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                <Landmark className="w-4 h-4 text-blue-500" />
                <span>Saldo Rekening Bank</span>
              </div>
              <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                {formatRupiah(saldoAnalysis.totalBank)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Tersimpan resmi di rekening bank persepsi
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span>Saldo Brankas Tunai</span>
              </div>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                {formatRupiah(saldoAnalysis.totalTunai)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Uang tunai brankas (maks. Rp 50 Juta per satker)
              </div>
            </div>
          </div>

          {/* Watchlist Top Saldo Kas Mengendap */}
          {saldoAnalysis.topSaldoKas.length > 0 && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Daftar Satker dengan Saldo Kas Akhir Bulan Tertinggi (&gt; Rp 50 Juta)</span>
                </h4>
                <span className="text-[11px] text-slate-400">Uji keabsahan UP/TUP dan kepatuhan penyetoran</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {saldoAnalysis.topSaldoKas.map((satker, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span className="truncate max-w-[180px]" title={satker.namaSatker}>{satker.namaSatker}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">{satker.kodeSatker}</span>
                    </div>
                    <div className="text-sm font-black text-emerald-600 mt-1">
                      {formatRupiah(satker.totalSaldoKas || 0)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
                      <span>Bank: {formatRupiah(satker.saldoRekeningBank || 0)}</span>
                      <span>Tunai: {formatRupiah(satker.saldoKasTunai || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENT TAB 4: WATCHLIST SATKER BELUM MENGIRIM */}
      {activeTab === 'watchlist' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-rose-600" />
                <span>Satker Mitra yang Belum Menyampaikan LPJ Bendahara</span>
              </h4>
              <span className="text-[11px] text-rose-600 font-semibold">
                Batas Akhir: Tanggal 10
              </span>
            </div>

            {satkerBelumList.length === 0 ? (
              <div className="p-4 text-center text-xs text-emerald-600 font-bold bg-white dark:bg-slate-900 rounded-xl">
                🎉 Luar biasa! Seluruh satker telah berhasil mengirimkan LPJ Bendahara.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {satkerBelumList.map((satker) => (
                  <div
                    key={satker.id}
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
                        Jenis: <strong className="text-slate-800 dark:text-slate-200">{satker.jenisBendahara || 'Pengeluaran'}</strong>
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
            <strong>Tips Vera:</strong> Tingkat kepatuhan LPJ saat ini berada di <strong>{summary.persenKepatuhan}%</strong>. Satker yang belum mengirim dapat langsung dihubungi melalui tombol <em>Kirim Pengingat WA</em> pada tab <em>Satker Belum</em>.
          </span>
        </div>
      </div>
    </div>
  );
};
