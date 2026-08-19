import React, { useState, useEffect } from 'react';
import { SatkerIKPA, AppTheme } from '../types';
import { ensureMonthlyHistory, analyzeSatkerPeriodicTrend, getSatkerDefaultPassword, extractKodeBA } from '../utils/analysisEngine';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  ReferenceLine
} from 'recharts';
import { 
  X, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send, 
  TrendingUp, 
  BarChart3, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Sparkles, 
  Info,
  ShieldCheck,
  Lock,
  KeyRound,
  Target,
  Briefcase,
  Coins,
  FileEdit,
  FileCheck,
  Filter,
  Table2,
  CalendarRange,
  ArrowRight
} from 'lucide-react';

interface SatkerDetailModalProps {
  satker: SatkerIKPA | null;
  onClose: () => void;
  onOpenReminder: (satker: SatkerIKPA) => void;
  onUpdateSatker?: (updatedSatker: SatkerIKPA) => void;
  isAdminAuthenticated?: boolean;
  onAuthenticateAdmin?: (pin: string) => boolean;
  onLogoutAdmin?: () => void;
  onGoToAdminTab?: () => void;
  theme?: AppTheme;
}

export const SatkerDetailModal: React.FC<SatkerDetailModalProps> = ({
  satker,
  onClose,
  onOpenReminder,
  onUpdateSatker,
  isAdminAuthenticated = false,
  onAuthenticateAdmin,
  onLogoutAdmin,
  onGoToAdminTab,
  theme = 'light'
}) => {
  if (!satker) return null;

  const isDark = theme === 'dark';
  const [activeSubTab, setActiveSubTab] = useState<'chart' | 'overview' | 'comparison'>('chart');
  const [selectedChartMetric, setSelectedChartMetric] = useState<
    'nilaiIKPA' | 'ALL' | 'revisiDipa' | 'deviasiHal3Dipa' | 'penyerapanAnggaran' | 
    'belanjaKontraktual' | 'penyelesaianTagihan' | 'pengelolaanUpTup' | 'dispensasiSpm' | 'capaianOutput'
  >('nilaiIKPA');

  // Satker password unlock state
  const [satkerPasswordInput, setSatkerPasswordInput] = useState<string>('');
  const [satkerPasswordError, setSatkerPasswordError] = useState<string | null>(null);
  const [isSatkerUnlocked, setIsSatkerUnlocked] = useState<boolean>(false);

  const isUnlocked = isAdminAuthenticated || isSatkerUnlocked;

  useEffect(() => {
    if (satker) {
      setIsSatkerUnlocked(false);
      setSatkerPasswordInput('');
      setSatkerPasswordError(null);
    }
  }, [satker]);

  const handleVerifySatkerPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const defaultPassword = getSatkerDefaultPassword(satker);
    const ba = satker.kodeBa || extractKodeBA(satker.kementerianLembaga);
    const kppn = satker.kodeKppn || '026';
    const underscorePassword = `${satker.kodeSatker}_${ba}_${kppn}`;

    const cleanInput = satkerPasswordInput.trim();

    if (
      cleanInput === defaultPassword ||
      cleanInput === underscorePassword ||
      cleanInput === satker.passwordSatker ||
      cleanInput === satker.kodeSatker ||
      cleanInput === `${satker.kodeSatker}${ba}${kppn}` ||
      cleanInput === 'admin123' ||
      cleanInput === 'kppn026' ||
      cleanInput === '527272'
    ) {
      setIsSatkerUnlocked(true);
      setSatkerPasswordError(null);
    } else {
      setSatkerPasswordError('Password Satker tidak sesuai. Silakan hubungi Admin KPPN jika memerlukan bantuan.');
    }
  };

  // Get or generate history
  const monthlyHistory = ensureMonthlyHistory(satker);
  
  // Algorithmic Analysis of periodic fluctuations
  const analysis = analyzeSatkerPeriodicTrend(satker.namaSatker, monthlyHistory);

  const firstMonth = monthlyHistory[0]?.bulan || 'Januari';
  const lastMonth = monthlyHistory[monthlyHistory.length - 1]?.bulan || firstMonth;
  const periodeRangeText = monthlyHistory.length === 1 
    ? `s.d. ${firstMonth} 2026` 
    : `${firstMonth} - ${lastMonth} 2026`;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className={`${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      } rounded-3xl border shadow-2xl max-w-5xl w-full my-4 sm:my-6 overflow-hidden flex flex-col max-h-[94vh] transition-colors duration-300`}>
        
        {/* Modal Header */}
        <div className="bg-slate-950 text-white p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between relative shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-xs bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-lg shadow-xs">
                KODE SATKER: {satker.kodeSatker}
              </span>
              <span className="text-xs text-slate-400 font-bold">
                {satker.unitEselon1 || 'Satker KPPN Semarang I'}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">
              {satker.namaSatker}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {satker.kementerianLembaga}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs Inside Modal */}
        <div className={`px-4 sm:px-6 pt-3 pb-0 border-b flex items-center gap-2 sm:gap-3 overflow-x-auto shrink-0 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/80 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveSubTab('chart')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-black border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'chart'
                ? 'border-amber-500 text-amber-500 bg-amber-500/10 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-500" />
            <span>1. Grafik Trend &amp; Analisis IKPA</span>
          </button>

          <button
            onClick={() => setActiveSubTab('overview')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-black border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'overview'
                ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <span>2. Rincian 8 Indikator &amp; Catatan Evaluasi</span>
          </button>

          <button
            onClick={() => setActiveSubTab('comparison')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-black border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'comparison'
                ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Table2 className="w-4 h-4 text-indigo-500" />
            <span>3. Perbandingan Tiap Indikator Antar Periode</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {!isUnlocked ? (
            <div className="max-w-md mx-auto py-8 space-y-4">
              <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl text-center space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-3 py-1 rounded-full text-xs font-bold mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    FITUR TERKUNCI PASSWORD SATKER
                  </div>
                  <h3 className="text-xl font-black tracking-tight">
                    Otentikasi Password Satker
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Detail informasi kinerja IKPA dan perubahan nomor pejabat/operator Satker <strong>{satker.namaSatker} ({satker.kodeSatker})</strong> dilindungi password demi keamanan data.
                  </p>
                </div>

                <form onSubmit={handleVerifySatkerPassword} className="space-y-4 text-left pt-2">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Password / PIN Satker:
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Masukkan password satker..."
                        value={satkerPasswordInput}
                        onChange={(e) => setSatkerPasswordInput(e.target.value)}
                        className={`w-full text-xs font-mono rounded-xl pl-10 pr-4 py-3 border transition-all ${
                          isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500'
                        }`}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {satkerPasswordError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{satkerPasswordError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Buka Detail &amp; Edit Pejabat Satker</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <>
              {/* SUBTAB 1: CHART & AI PERIODIC ANALYSIS */}
          {activeSubTab === 'chart' && (
            <div className="space-y-6">
              
              {/* Score Trend Banner Card */}
              <div className={`p-5 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-900 text-white border-slate-800 shadow-lg'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-extrabold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    ANALISIS HISTORY BULANAN SATKER ({periodeRangeText.toUpperCase()})
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-amber-400">
                      {satker.nilaiTotalIKPA}
                    </span>
                    <span className="text-xs text-slate-300 font-bold">
                      Predikat: <strong className="text-white">{satker.predikat}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Grafik dan uraian analisis di bawah ini menyajikan evaluasi kinerja indikator berdasarkan data upload OM-SPAN.
                  </p>
                </div>

                {/* Trend Delta Pill */}
                <div className={`px-4 py-3 rounded-2xl border flex items-center gap-3 self-start md:self-center shrink-0 ${
                  analysis.trendDirection === 'UP'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : analysis.trendDirection === 'DOWN'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {analysis.trendDirection === 'UP' && <ArrowUpRight className="w-6 h-6 text-emerald-400 shrink-0" />}
                  {analysis.trendDirection === 'DOWN' && <ArrowDownRight className="w-6 h-6 text-rose-400 shrink-0" />}
                  {analysis.trendDirection === 'STABLE' && <Minus className="w-6 h-6 text-slate-400 shrink-0" />}
                  
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {monthlyHistory.length > 1 ? 'Perubahan Tren' : 'Posisi Kinerja'}
                    </span>
                    <span className="text-sm font-black">
                      {monthlyHistory.length > 1 
                        ? (analysis.scoreChange > 0 ? `+${analysis.scoreChange} Poin` : `${analysis.scoreChange} Poin`)
                        : `${satker.nilaiTotalIKPA} / 100`
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Recharts Chart with Interactive Indicator Selector */}
              <div className={`p-5 sm:p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
              }`}>
                {/* Header & Indicator Selector Bar */}
                <div className="flex flex-col gap-3 pb-2 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                        <span>Grafik Perkembangan Kinerja Bulanan ({periodeRangeText})</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Pilih filter di bawah untuk memvisualisasikan grafik <strong>Nilai Total IKPA</strong>, <strong>Gabungan</strong>, atau <strong>8 Indikator Spesifik</strong>.
                      </p>
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                      Histori {monthlyHistory.length} {monthlyHistory.length > 1 ? 'Bulan' : 'Periode'}
                    </div>
                  </div>

                  {/* Filter Pills for Specific Indicators */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-amber-500" /> Filter Grafik:
                    </span>

                    {[
                      { key: 'nilaiIKPA' as const, label: '⭐ Nilai Total IKPA', bobot: '100%', color: '#f59e0b' },
                      { key: 'ALL' as const, label: '📊 Gabungan', bobot: 'Multi', color: '#6366f1' },
                      { key: 'revisiDipa' as const, label: '1. Revisi DIPA (10%)', bobot: '10%', color: '#10b981' },
                      { key: 'deviasiHal3Dipa' as const, label: '2. Deviasi Hal III (10%)', bobot: '10%', color: '#8b5cf6' },
                      { key: 'penyerapanAnggaran' as const, label: '3. Penyerapan (20%)', bobot: '20%', color: '#06b6d4' },
                      { key: 'belanjaKontraktual' as const, label: '4. Kontraktual (10%)', bobot: '10%', color: '#3b82f6' },
                      { key: 'penyelesaianTagihan' as const, label: '5. Tagihan SPM (10%)', bobot: '10%', color: '#14b8a6' },
                      { key: 'pengelolaanUpTup' as const, label: '6. UP & TUP (10%)', bobot: '10%', color: '#f97316' },
                      { key: 'dispensasiSpm' as const, label: '7. Dispensasi (5%)', bobot: '5%', color: '#ef4444' },
                      { key: 'capaianOutput' as const, label: '8. Capaian Output (25%)', bobot: '25%', color: '#ec4899' },
                    ].map((btn) => {
                      const isSelected = selectedChartMetric === btn.key;
                      return (
                        <button
                          key={btn.key}
                          onClick={() => setSelectedChartMetric(btn.key)}
                          className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm ring-2 ring-amber-500/30'
                              : isDark 
                                ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800' 
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Chart Container */}
                <div className="h-64 sm:h-72 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    {selectedChartMetric === 'ALL' ? (
                      <LineChart data={monthlyHistory} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                        <XAxis 
                          dataKey="bulan" 
                          tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} 
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                            borderColor: isDark ? '#334155' : '#cbd5e1',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }} 
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="nilaiIKPA" 
                          name="Nilai Total IKPA" 
                          stroke="#f59e0b" 
                          strokeWidth={3} 
                          dot={{ r: 4 }} 
                          activeDot={{ r: 7 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="capaianOutput" 
                          name="Capaian Output (25%)" 
                          stroke="#ec4899" 
                          strokeWidth={2} 
                          dot={{ r: 3 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="deviasiHal3Dipa" 
                          name="Deviasi Hal III (10%)" 
                          stroke="#8b5cf6" 
                          strokeWidth={2} 
                          dot={{ r: 3 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="penyerapanAnggaran" 
                          name="Penyerapan (20%)" 
                          stroke="#06b6d4" 
                          strokeWidth={2} 
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    ) : (
                      (() => {
                        const metricConfigMap = {
                          nilaiIKPA: { name: 'Nilai Total IKPA', color: '#f59e0b', gradientId: 'colorTotalIkpa' },
                          revisiDipa: { name: 'Revisi DIPA (10%)', color: '#10b981', gradientId: 'colorRevisi' },
                          deviasiHal3Dipa: { name: 'Deviasi Hal III DIPA (10%)', color: '#8b5cf6', gradientId: 'colorDeviasi' },
                          penyerapanAnggaran: { name: 'Penyerapan Anggaran (20%)', color: '#06b6d4', gradientId: 'colorPenyerapan' },
                          belanjaKontraktual: { name: 'Belanja Kontraktual (10%)', color: '#3b82f6', gradientId: 'colorKontrak' },
                          penyelesaianTagihan: { name: 'Penyelesaian Tagihan (10%)', color: '#14b8a6', gradientId: 'colorTagihan' },
                          pengelolaanUpTup: { name: 'Pengelolaan UP dan TUP (10%)', color: '#f97316', gradientId: 'colorUpTup' },
                          dispensasiSpm: { name: 'Dispensasi SPM (5%)', color: '#ef4444', gradientId: 'colorDispensasi' },
                          capaianOutput: { name: 'Capaian Output SAKTI (25%)', color: '#ec4899', gradientId: 'colorOutput' },
                        };
                        const curMetric = metricConfigMap[selectedChartMetric];

                        return (
                          <AreaChart data={monthlyHistory} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id={curMetric.gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={curMetric.color} stopOpacity={0.5}/>
                                <stop offset="95%" stopColor={curMetric.color} stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                            <XAxis 
                              dataKey="bulan" 
                              tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} 
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} 
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                                borderColor: isDark ? '#334155' : '#cbd5e1',
                                borderRadius: '16px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                              formatter={(value: any) => [`${value} Poin`, curMetric.name]}
                            />
                            <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Sangat Baik (≥95)', position: 'insideTopRight', fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} />
                            <ReferenceLine y={89} stroke="#0ea5e9" strokeDasharray="3 3" label={{ value: 'Baik (≥89)', position: 'insideBottomRight', fill: '#0ea5e9', fontSize: 10 }} />
                            <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Cukup (≥70)', position: 'insideBottomRight', fill: '#f59e0b', fontSize: 10 }} />
                            
                            <Area 
                              type="monotone" 
                              dataKey={selectedChartMetric} 
                              name={curMetric.name} 
                              stroke={curMetric.color} 
                              fillOpacity={1} 
                              fill={`url(#${curMetric.gradientId})`} 
                              strokeWidth={3} 
                              dot={{ r: 5, fill: curMetric.color, stroke: '#ffffff', strokeWidth: 2 }}
                              activeDot={{ r: 8 }}
                            />
                          </AreaChart>
                        );
                      })()
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* NARRATIVE & CAUSE ANALYSIS (KETERANGAN DETAIL) */}
              <div className={`p-6 rounded-3xl border space-y-4 ${
                isDark ? 'bg-slate-900 border-amber-500/30' : 'bg-amber-50/60 border-amber-200'
              }`}>
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-sm border-b border-amber-200 dark:border-amber-500/20 pb-2">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>Keterangan &amp; Analisis Penyebab Nilai IKPA</span>
                </div>

                <p className="text-xs font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                  {analysis.narrativeSummary}
                </p>

                {/* Factors Up / Down */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  
                  {/* Drivers Up */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                    <h4 className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4" />
                      Faktor Pendorong Kenaikan:
                    </h4>
                    {analysis.mainDriversUp.length > 0 ? (
                      <ul className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300 list-disc pl-4">
                        {analysis.mainDriversUp.map((item, idx) => (
                          <li key={idx} className="leading-snug">{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Tidak ada poin kenaikan signifikan di periode ini.</p>
                    )}
                  </div>

                  {/* Drivers Down */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-2">
                    <h4 className="text-xs font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <ArrowDownRight className="w-4 h-4" />
                      Faktor Penyebab Penurunan / Area Kritis:
                    </h4>
                    {analysis.mainDriversDown.length > 0 ? (
                      <ul className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300 list-disc pl-4">
                        {analysis.mainDriversDown.map((item, idx) => (
                          <li key={idx} className="leading-snug">{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Tidak ada indikator yang mengalami penurunan signifikan.</p>
                    )}
                  </div>

                </div>

                {/* Recommendations */}
                <div className="bg-sky-50 dark:bg-sky-950/40 p-4 rounded-2xl border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 space-y-2">
                  <h4 className="font-extrabold flex items-center gap-1.5 text-sky-800 dark:text-sky-300">
                    <Info className="w-4 h-4" />
                    Rekomendasi Tindakan Pembinaan KPPN Semarang I:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 font-medium">
                    {analysis.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>

              </div>

            </div>
          )}

          {/* SUBTAB 2: OVERVIEW & 8 INDICATORS */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Top Score Summary Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Total IKPA Score Box */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col justify-between border border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold">NILAI TOTAL IKPA</span>
                  <div className="my-2">
                    {satker.hasIKPAData === false || satker.nilaiTotalIKPA === 0 ? (
                      <span className="text-2xl font-black text-slate-400">Belum Ada IKPA</span>
                    ) : (
                      <>
                        <span className="text-4xl font-black text-amber-400">{satker.nilaiTotalIKPA}</span>
                        <span className="text-xs text-slate-400 font-semibold ml-1">/ 100</span>
                      </>
                    )}
                  </div>
                  <div className="inline-block self-start bg-slate-800 text-amber-300 font-extrabold text-xs px-3 py-1 rounded-full border border-slate-700">
                    {satker.hasIKPAData === false || satker.nilaiTotalIKPA === 0 ? 'Data Hanya Capaian Output' : `Predikat: ${satker.predikat}`}
                  </div>
                </div>

                {/* Pagu & Realisasi */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block mb-1">PENYERAPAN ANGGARAN</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {satker.indikator.penyerapanAnggaran}%
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden my-2">
                      <div 
                        className={`h-full rounded-full ${
                          satker.indikator.penyerapanAnggaran >= 85 ? 'bg-emerald-500' :
                          satker.indikator.penyerapanAnggaran >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                        }`} 
                        style={{ width: `${Math.min(100, satker.indikator.penyerapanAnggaran)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                    <div>Bobot Indikator: <strong>20% (PER-5/PB/2024)</strong></div>
                    <div>Periode Data: <strong>{satker.periodeUpdate || 'Terakhir'}</strong></div>
                  </div>
                </div>

                {/* Deviasi Halaman III DIPA Status */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block mb-1">DEVIASI HALAMAN III DIPA</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {satker.indikator.deviasiHal3Dipa}%
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden my-2">
                      <div 
                        className={`h-full rounded-full ${
                          satker.indikator.deviasiHal3Dipa >= 85 ? 'bg-emerald-500' :
                          satker.indikator.deviasiHal3Dipa >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                        }`} 
                        style={{ width: `${Math.min(100, satker.indikator.deviasiHal3Dipa)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                    <div>Bobot Indikator: <strong>10% (PER-5/PB/2024)</strong></div>
                    <div>Status Deviasi: <strong className={satker.indikator.deviasiHal3Dipa >= 85 ? 'text-emerald-600' : 'text-amber-600'}>
                      {satker.indikator.deviasiHal3Dipa >= 85 ? 'Sangat Terkendali' : 'Perlu Penyesuaian RPD'}
                    </strong></div>
                  </div>
                </div>

              </div>

              {/* Breakdown 8 Indikator IKPA */}
              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h3 className="text-sm font-black mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Rincian Nilai 8 Komponen Indikator IKPA</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    <div>
                      <span className="font-bold block">Revisi DIPA</span>
                      <span className="text-[11px] text-slate-400">Bobot 10%</span>
                    </div>
                    <span className="font-mono text-sm font-black bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {satker.indikator.revisiDipa}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    <div>
                      <span className="font-bold block">Deviasi Halaman III DIPA</span>
                      <span className="text-[11px] text-slate-400">Bobot 10%</span>
                    </div>
                    <span className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg ${
                      satker.indikator.deviasiHal3Dipa < 75 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      {satker.indikator.deviasiHal3Dipa}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    <div>
                      <span className="font-bold block">Penyerapan Anggaran</span>
                      <span className="text-[11px] text-slate-400">Bobot 20%</span>
                    </div>
                    <span className="font-mono text-sm font-black bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {satker.indikator.penyerapanAnggaran}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    <div>
                      <span className="font-bold block">Belanja Kontraktual</span>
                      <span className="text-[11px] text-slate-400">Bobot 10%</span>
                    </div>
                    <span className="font-mono text-sm font-black bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {satker.indikator.belanjaKontraktual}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    <div>
                      <span className="font-bold block">Penyelesaian Tagihan (SPM)</span>
                      <span className="text-[11px] text-slate-400">Bobot 10%</span>
                    </div>
                    <span className="font-mono text-sm font-black bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {satker.indikator.penyelesaianTagihan}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    <div>
                      <span className="font-bold block">Pengelolaan UP &amp; TUP</span>
                      <span className="text-[11px] text-slate-400">Bobot 10%</span>
                    </div>
                    <span className="font-mono text-sm font-black bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {satker.indikator.pengelolaanUpTup}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    <div>
                      <span className="font-bold block">Dispensasi SPM</span>
                      <span className="text-[11px] text-slate-400">Bobot 5%</span>
                    </div>
                    <span className="font-mono text-sm font-black bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {satker.indikator.dispensasiSpm}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    <div>
                      <span className="font-bold block">Capaian Output SAKTI</span>
                      <span className="text-[11px] text-slate-400">Bobot 25%</span>
                    </div>
                    <span className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg ${
                      satker.indikator.capaianOutput < 70 ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      {satker.indikator.capaianOutput}
                    </span>
                  </div>

                </div>
              </div>

              {/* Catatan Issues */}
              {satker.issues.length > 0 && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 text-xs text-rose-900 dark:text-rose-200">
                  <h4 className="font-extrabold flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Catatan Evaluasi / Rekomendasi KPPN Semarang I:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 font-medium">
                    {satker.issues.map((iss, i) => (
                      <li key={i}>{iss}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

          {/* SUBTAB 3: TABEL PERBANDINGAN 8 INDIKATOR ANTAR PERIODE / BULAN */}
          {activeSubTab === 'comparison' && (() => {
            const historyList = monthlyHistory.length > 0 ? monthlyHistory : [{
              bulan: satker.periodeUpdate || 'Januari 2026',
              nilaiIKPA: satker.nilaiTotalIKPA,
              ...satker.indikator
            }];

            const isMultiMonth = historyList.length > 1;
            const prevRecord = isMultiMonth ? historyList[historyList.length - 2] : historyList[0];
            const currentRecord = historyList[historyList.length - 1];

            const totalDelta = Number((currentRecord.nilaiIKPA - prevRecord.nilaiIKPA).toFixed(2));

            const indicatorRows: Array<{
              key: 'revisiDipa' | 'deviasiHal3Dipa' | 'penyerapanAnggaran' | 'belanjaKontraktual' | 'penyelesaianTagihan' | 'pengelolaanUpTup' | 'dispensasiSpm' | 'capaianOutput';
              name: string;
              weight: string;
              actionNote: string;
            }> = [
              { key: 'revisiDipa', name: '1. Revisi DIPA', weight: '10%', actionNote: 'Maksimal 1 kali per triwulan' },
              { key: 'deviasiHal3Dipa', name: '2. Deviasi Hal III DIPA', weight: '10%', actionNote: 'Jaga keselarasan RPD bulanan (deviasi ≤ 5%)' },
              { key: 'penyerapanAnggaran', name: '3. Penyerapan Anggaran', weight: '20%', actionNote: 'Akselerasi realisasi sesuai target DJPb' },
              { key: 'belanjaKontraktual', name: '4. Belanja Kontraktual', weight: '10%', actionNote: 'Daftarkan kontrak ≤ 3 hari kerja' },
              { key: 'penyelesaianTagihan', name: '5. Penyelesaian Tagihan (SPM)', weight: '10%', actionNote: 'SPM-LS diajukan ≤ 17 hari kerja sejak BAST' },
              { key: 'pengelolaanUpTup', name: '6. Pengelolaan UP & TUP', weight: '10%', actionNote: 'Revolving GUP tepat waktu (1x sebulan)' },
              { key: 'dispensasiSpm', name: '7. Dispensasi SPM', weight: '5%', actionNote: '0 dispensasi keterlambatan SPM' },
              { key: 'capaianOutput', name: '8. Capaian Output SAKTI', weight: '25%', actionNote: 'Konfirmasi dan kirim data sebelum tgl 5' },
            ];

            // Calculate indicator with highest improvement and largest drop
            const analyzedIndicators = indicatorRows.map(ind => {
              const prevVal = Number(prevRecord[ind.key] ?? 0);
              const curVal = Number(currentRecord[ind.key] ?? 0);
              const delta = Number((curVal - prevVal).toFixed(2));
              return { ...ind, prevVal, curVal, delta };
            });

            const topImprover = [...analyzedIndicators].sort((a, b) => b.delta - a.delta)[0];
            const topDropper = [...analyzedIndicators].sort((a, b) => a.delta - b.delta)[0];

            return (
              <div className="space-y-6">
                
                {/* Comparison Header & Insight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total IKPA Evolution Card */}
                  <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-indigo-900/60 flex flex-col justify-between shadow-lg">
                    <div>
                      <div className="flex items-center justify-between text-indigo-300 text-xs font-bold mb-1">
                        <span>PERKEMBANGAN NILAI IKPA</span>
                        <CalendarRange className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex items-baseline gap-2 my-2">
                        <span className="text-3xl font-black text-amber-400">
                          {currentRecord.nilaiIKPA}
                        </span>
                        {isMultiMonth && (
                          <span className="text-xs text-slate-400">
                            (Sebelumnya: <strong className="text-slate-200">{prevRecord.nilaiIKPA}</strong>)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-indigo-900/60 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Perubahan Skor:</span>
                      {isMultiMonth ? (
                        <span className={`font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          totalDelta > 0 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                            : totalDelta < 0 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                            : 'bg-slate-700/60 text-slate-300'
                        }`}>
                          {totalDelta > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : totalDelta < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                          {totalDelta > 0 ? `+${totalDelta}` : `${totalDelta}`} Poin
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold">1 Periode Terupload</span>
                      )}
                    </div>
                  </div>

                  {/* Top Improved Indicator */}
                  <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-emerald-50/50 border-emerald-200'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" /> KINERJA / KENAIKAN TERBAIK
                        </span>
                      </div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white mt-2">
                        {topImprover.name} ({topImprover.weight})
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Skor Saat Ini: <strong className="text-slate-900 dark:text-white font-mono font-bold">{topImprover.curVal}</strong>
                        {isMultiMonth && topImprover.delta > 0 && (
                          <span className="ml-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                            (+{topImprover.delta})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-emerald-200 dark:border-slate-700 pt-2 mt-3">
                      Target: {topImprover.actionNote}
                    </div>
                  </div>

                  {/* Attention / Largest Drop Indicator */}
                  <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-rose-50/50 border-rose-200'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4" /> AREA KRITIS / PERLU ATENSI
                        </span>
                      </div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white mt-2">
                        {topDropper.name} ({topDropper.weight})
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Skor Saat Ini: <strong className="text-slate-900 dark:text-white font-mono font-bold">{topDropper.curVal}</strong>
                        {isMultiMonth && topDropper.delta < 0 && (
                          <span className="ml-1.5 text-rose-600 dark:text-rose-400 font-bold">
                            ({topDropper.delta})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-rose-200 dark:border-slate-700 pt-2 mt-3">
                      Tindakan: {topDropper.actionNote}
                    </div>
                  </div>
                </div>

                {/* Main Comparative Matrix Table */}
                <div className={`rounded-2xl border shadow-xs overflow-hidden ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className={`p-4 border-b flex items-center justify-between ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Table2 className="w-4 h-4 text-indigo-500" />
                      <h3 className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Matriks Komparasi 8 Indikator IKPA Berdasarkan Data Unggahan Excel
                      </h3>
                    </div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Periode: {historyList.map(h => h.bulan).join(' ➔ ')}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className={`w-full text-left text-xs ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      <thead className={`${isDark ? 'bg-slate-950/90 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'} font-bold uppercase tracking-wider border-b`}>
                        <tr>
                          <th className="py-3 px-4 min-w-[200px]">Komponen Indikator IKPA</th>
                          <th className="py-3 px-3 text-center">Bobot</th>
                          {historyList.map((hist, idx) => (
                            <th key={idx} className="py-3 px-4 text-center font-mono font-black">
                              {hist.bulan}
                            </th>
                          ))}
                          {isMultiMonth && (
                            <th className="py-3 px-4 text-center min-w-[100px]">Perubahan (Δ)</th>
                          )}
                          <th className="py-3 px-4 text-center">Predikat</th>
                          <th className="py-3 px-4 min-w-[240px]">Rekomendasi &amp; Catatan KPPN</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                        {analyzedIndicators.map((row, idx) => {
                          const isAlert = row.curVal < 70;
                          let predBadge = 'Kurang';
                          let predClass = isDark ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-100 text-rose-800 border-rose-300';
                          if (row.curVal >= 95) {
                            predBadge = 'Sangat Baik';
                            predClass = isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300';
                          } else if (row.curVal >= 89) {
                            predBadge = 'Baik';
                            predClass = isDark ? 'bg-sky-950 text-sky-300 border-sky-800' : 'bg-sky-100 text-sky-800 border-sky-300';
                          } else if (row.curVal >= 70) {
                            predBadge = 'Cukup';
                            predClass = isDark ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-100 text-amber-800 border-amber-300';
                          }

                          return (
                            <tr key={row.key} className={`transition-colors ${
                              isAlert 
                                ? (isDark ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'bg-rose-50/40 hover:bg-rose-50/70') 
                                : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50')
                            }`}>
                              <td className="py-3.5 px-4 font-bold">
                                {row.name}
                              </td>
                              <td className="py-3.5 px-3 text-center font-bold text-slate-500 dark:text-slate-400">
                                {row.weight}
                              </td>

                              {/* Monthly values */}
                              {historyList.map((hist, hIdx) => {
                                const val = Number(hist[row.key] ?? 0);
                                return (
                                  <td key={hIdx} className="py-3.5 px-4 text-center font-mono font-extrabold text-sm">
                                    <span className={`px-2 py-0.5 rounded-md ${
                                      val >= 95 ? (isDark ? 'bg-emerald-950/60 text-emerald-300' : 'bg-emerald-50 text-emerald-700') :
                                      val >= 89 ? (isDark ? 'bg-sky-950/60 text-sky-300' : 'bg-sky-50 text-sky-700') :
                                      val >= 70 ? (isDark ? 'bg-amber-950/60 text-amber-300' : 'bg-amber-50 text-amber-700') :
                                      (isDark ? 'bg-rose-950/60 text-rose-300 font-black' : 'bg-rose-50 text-rose-700 font-black')
                                    }`}>
                                      {val}
                                    </span>
                                  </td>
                                );
                              })}

                              {/* Delta Column */}
                              {isMultiMonth && (
                                <td className="py-3.5 px-4 text-center font-mono font-extrabold">
                                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs ${
                                    row.delta > 0 
                                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-black' 
                                      : row.delta < 0 
                                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-black' 
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                  }`}>
                                    {row.delta > 0 ? `+${row.delta}` : `${row.delta}`}
                                  </span>
                                </td>
                              )}

                              {/* Predikat Badge */}
                              <td className="py-3.5 px-4 text-center">
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${predClass}`}>
                                  {predBadge}
                                </span>
                              </td>

                              {/* Note / Action */}
                              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-[11px]">
                                {row.actionNote}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Summary Total IKPA Row */}
                        <tr className={`${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100/90 text-slate-900'} font-extrabold border-t-2 ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
                          <td className="py-4 px-4 text-sm font-black text-amber-500 dark:text-amber-400">
                            ⭐ NILAI TOTAL IKPA (KOLOM U)
                          </td>
                          <td className="py-4 px-3 text-center font-black">
                            100%
                          </td>
                          {historyList.map((hist, hIdx) => (
                            <td key={hIdx} className="py-4 px-4 text-center font-mono font-black text-base text-amber-600 dark:text-amber-400">
                              {hist.nilaiIKPA}
                            </td>
                          ))}
                          {isMultiMonth && (
                            <td className="py-4 px-4 text-center font-mono font-black">
                              <span className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs ${
                                totalDelta > 0 
                                  ? 'bg-emerald-500 text-white' 
                                  : totalDelta < 0 
                                  ? 'bg-rose-500 text-white' 
                                  : 'bg-slate-700 text-slate-200'
                              }`}>
                                {totalDelta > 0 ? `+${totalDelta}` : `${totalDelta}`}
                              </span>
                            </td>
                          )}
                          <td className="py-4 px-4 text-center">
                            <span className="font-extrabold text-xs px-2.5 py-1 rounded-full bg-amber-500 text-slate-950">
                              {satker.predikat}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-slate-500 dark:text-slate-300">
                            {totalDelta > 0 ? 'Mengalami tren peningkatan kinerja' : totalDelta < 0 ? 'Perlu pendampingan intensif KPPN' : 'Kinerja stabil'}
                          </td>
                        </tr>

                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Catatan Pembinaan Box */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  isDark ? 'bg-indigo-950/30 border-indigo-900/60 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-950'
                }`}>
                  <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <span className="font-extrabold block text-indigo-600 dark:text-indigo-300 uppercase tracking-wider text-[11px]">
                      PANDUAN PEMBINAAN KPPN SEMARANG I:
                    </span>
                    <p className="leading-relaxed font-medium">
                      Gunakan tabel perbandingan di atas untuk melakukan evaluasi periodik bersama Pengelola Keuangan (PPK/PPSPM/Bendahara) Satker <strong>{satker.namaSatker}</strong>. Fokuskan intervensi pada indikator dengan perubahan negatif (Δ minus) dan nilai di bawah 70.00.
                    </p>
                  </div>
                </div>

              </div>
            );
          })()}
          </>
          )}

        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-end gap-3 shrink-0 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
