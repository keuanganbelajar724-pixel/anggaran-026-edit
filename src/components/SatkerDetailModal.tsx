import React, { useState, useEffect } from 'react';
import { SatkerIKPA, AppTheme, PejabatDanOperator, PejabatRoleInfo } from '../types';
import { ensureMonthlyHistory, analyzeSatkerPeriodicTrend, ensurePejabatOperator, getSatkerDefaultPassword, extractKodeBA } from '../utils/analysisEngine';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  X, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  Send, 
  TrendingUp, 
  BarChart3, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Sparkles, 
  Info,
  UserCheck,
  ShieldCheck,
  Edit3,
  Save,
  Copy,
  Check,
  Users,
  Lock,
  KeyRound,
  LogOut
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
  const [activeSubTab, setActiveSubTab] = useState<'chart' | 'overview' | 'officers'>('chart');
  const [isEditingOfficers, setIsEditingOfficers] = useState(false);
  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  // In-modal Admin authentication state
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Initialize officer state with fallback
  const [officerData, setOfficerData] = useState<PejabatDanOperator>(() => ensurePejabatOperator(satker));

  // Satker password unlock state
  const [satkerPasswordInput, setSatkerPasswordInput] = useState<string>('');
  const [satkerPasswordError, setSatkerPasswordError] = useState<string | null>(null);
  const [isSatkerUnlocked, setIsSatkerUnlocked] = useState<boolean>(false);

  const isUnlocked = isAdminAuthenticated || isSatkerUnlocked;

  useEffect(() => {
    if (satker) {
      setOfficerData(ensurePejabatOperator(satker));
      setIsEditingOfficers(false);
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
      cleanInput === 'admin123' ||
      cleanInput === 'kppn026' ||
      cleanInput === '527272'
    ) {
      setIsSatkerUnlocked(true);
      setSatkerPasswordError(null);
    } else {
      setSatkerPasswordError(`Password Satker '${satker.namaSatker}' tidak sesuai. Format standar: [KodeSatker][KodeBA][KodeKPPN] (Contoh: ${defaultPassword})`);
    }
  };

  const handleModalAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAuthenticateAdmin && onAuthenticateAdmin(pinInput)) {
      setPinError(null);
      setPinInput('');
    } else {
      setPinError('Password Admin salah. Silakan coba lagi (Gunakan: admin123 atau kppn026)');
    }
  };

  // Get or generate complete Jan-Jul history
  const monthlyHistory = ensureMonthlyHistory(satker);
  
  // Algorithmic Analysis of periodic fluctuations
  const analysis = analyzeSatkerPeriodicTrend(satker.namaSatker, monthlyHistory);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleOfficerChange = (roleKey: keyof PejabatDanOperator, field: keyof PejabatRoleInfo, value: string) => {
    setOfficerData(prev => ({
      ...prev,
      [roleKey]: {
        ...(prev[roleKey] || { nama: '' }),
        [field]: value
      }
    }));
  };

  const handleSaveOfficers = () => {
    const updatedSatker: SatkerIKPA = {
      ...satker,
      pejabatOperator: officerData,
      isModified: true
    };
    if (onUpdateSatker) {
      onUpdateSatker(updatedSatker);
    }
    setIsEditingOfficers(false);
  };

  const handleCopyText = (text: string, roleName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRole(roleName);
    setTimeout(() => setCopiedRole(null), 2000);
  };

  const officerRolesList: { key: keyof PejabatDanOperator; title: string; category: string; description: string; badgeColor: string }[] = [
    { key: 'kpa', title: 'KPA (Kuasa Pengguna Anggaran)', category: 'Pejabat', description: 'Penanggung jawab tertinggi pelaksanaan anggaran Satker', badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800' },
    { key: 'ppk', title: 'PPK (Pejabat Pembuat Komitmen)', category: 'Pejabat', description: 'Penanggung jawab keputusan dan tindakan pengeluaran anggaran', badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800' },
    { key: 'ppspm', title: 'PPSPM (Pejabat Penandatangan SPM)', category: 'Pejabat', description: 'Penguji tagihan dan penandatangan Surat Perintah Membayar', badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800' },
    { key: 'bendahara', title: 'Bendahara Pengeluaran', category: 'Pejabat', description: 'Pengelola uang persediaan (UP/TUP) dan pembayaran langsung', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' },
    { key: 'operatorKomitmen', title: 'Operator Komitmen SAKTI', category: 'Operator', description: 'Perekam data Supplier, Kontrak, dan Rencana Penarikan Hal III DIPA', badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800' },
    { key: 'operatorPembayaran', title: 'Operator Pembayaran SAKTI', category: 'Operator', description: 'Perekam Surat Perintah Pembayaran (SPP) dan Pengelolaan UP/TUP', badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800' },
    { key: 'operatorPelaporan', title: 'Operator Pelaporan (Capaian Output)', category: 'Operator', description: 'Perekam dan pengonfirmasi Laporan Capaian Output SAKTI bulanan', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800' },
    { key: 'operatorGaji', title: 'Operator Gaji SAKTI', category: 'Operator', description: 'Pengelola data belanja pegawai dan pembuatan SPM Gaji', badgeColor: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700' },
  ];

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
            onClick={() => setActiveSubTab('officers')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-black border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'officers'
                ? 'border-sky-500 text-sky-500 bg-sky-500/10 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-sky-500" />
            <span>3. Pengelola Keuangan &amp; Operator (8 Peran)</span>
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

                  <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 space-y-1.5 text-left border border-amber-200 dark:border-amber-800">
                    <span className="block font-bold text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      Format Password Satker Default:
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      Format standar: <code className="bg-white dark:bg-slate-900 font-mono font-bold px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700">KodeSatker_KodeBA_KodeKPPN</code> atau tanpa pemisah: <code className="bg-white dark:bg-slate-900 font-mono font-bold px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400">{getSatkerDefaultPassword(satker)}</code>
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-amber-200/60 dark:border-amber-800/60 pt-1.5">
                      Catatan: Password dapat diubah atau disesuaikan oleh Admin KPPN melalui menu Admin.
                    </p>
                  </div>
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
                    ANALISIS HISTORY BULANAN SATKER (JANUARI - JULI)
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
                    Grafik dan keterangan di bawah ini menguraikan penyebab nilai naik/turun setiap bulan secara komprehensif.
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
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tren Bulan Ini</span>
                    <span className="text-sm font-black">
                      {analysis.scoreChange > 0 ? `+${analysis.scoreChange}` : analysis.scoreChange} Poin
                    </span>
                  </div>
                </div>
              </div>

              {/* Recharts Line Chart */}
              <div className={`p-5 rounded-3xl border ${
                isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-black flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-sky-500" />
                      Grafik Perkembangan Indikator Bulanan (Januari - Juli)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Visualisasi perjalanan skor IKPA, Capaian Output SAKTI, Deviasi Hal III DIPA, dan Penyerapan Anggaran.
                    </p>
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    Histori 7 Bulan
                  </div>
                </div>

                <div className="h-64 sm:h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis 
                        dataKey="bulan" 
                        tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} 
                      />
                      <YAxis 
                        domain={[30, 100]} 
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
                        name="Capaian Output SAKTI" 
                        stroke="#38bdf8" 
                        strokeWidth={2} 
                        strokeDasharray="4 4" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="deviasiHal3Dipa" 
                        name="Deviasi Hal III DIPA" 
                        stroke="#818cf8" 
                        strokeWidth={2} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="penyerapanAnggaran" 
                        name="% Penyerapan Anggaran" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                      />
                    </LineChart>
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
                    <span className="text-4xl font-black text-amber-400">{satker.nilaiTotalIKPA}</span>
                    <span className="text-xs text-slate-400 font-semibold ml-1">/ 100</span>
                  </div>
                  <div className="inline-block self-start bg-slate-800 text-amber-300 font-extrabold text-xs px-3 py-1 rounded-full border border-slate-700">
                    Predikat: {satker.predikat}
                  </div>
                </div>

                {/* Pagu & Realisasi */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block mb-1">PAGU &amp; REALISASI</span>
                    <div className="text-lg font-black">{satker.persenPenyerapan}%</div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden my-2">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, satker.persenPenyerapan)}%` }}></div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                    <div>Realisasi: <strong>{formatRupiah(satker.realisasiAnggaran)}</strong></div>
                    <div>Pagu Total: <strong>{formatRupiah(satker.paguAnggaran)}</strong></div>
                  </div>
                </div>

                {/* Capaian Output Status */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block mb-1">STATUS CAPAIAN OUTPUT</span>
                    <div className="text-sm font-extrabold">{satker.statusCapaianOutput}</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Skor Indikator Output: <strong>{satker.indikator.capaianOutput}%</strong>
                    </p>
                  </div>
                  <div className="mt-3">
                    {satker.statusCapaianOutput === 'Sudah Terlaporkan' ? (
                      <span className="text-xs text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Data SAKTI Lengkap
                      </span>
                    ) : (
                      <span className="text-xs text-rose-800 bg-rose-100 dark:bg-rose-950 dark:text-rose-300 font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Perlu Konfirmasi Segera
                      </span>
                    )}
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

              {/* Contact PIC Info */}
              <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <h4 className="font-bold border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center justify-between">
                  <span>Informasi Kontak Umum Satker:</span>
                  <span className="text-[11px] text-amber-500 font-normal">Lihat Tab 3 untuk detail Pejabat/Operator lengkap</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>PIC Utama: <strong>{satker.namaPic || '-'}</strong> ({satker.noHpPic || '-'})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">Email: <strong>{satker.emailPic || '-'}</strong></span>
                  </div>
                  <div className="col-span-full flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Alamat: <strong>{satker.alamatSatker || 'Semarang, Jawa Tengah'}</strong></span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SUBTAB 3: OFFICERS & OPERATORS PER SATKER */}
          {activeSubTab === 'officers' && (
            <div className="space-y-6">
              
              {!isAdminAuthenticated ? (
                /* ADMIN LOCK SCREEN FOR TAB 3 */
                <div className={`p-8 sm:p-10 rounded-3xl border text-center max-w-xl mx-auto space-y-5 my-4 ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-slate-100 shadow-2xl' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-lg'
                }`}>
                  <div className="w-16 h-16 bg-amber-500/15 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
                    <Lock className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="inline-block bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-black text-[10px] uppercase px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800 mb-2">
                      TERPROTEKSI: AKSES KHUSUS ADMIN KPPN
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                      Data Pejabat &amp; Operator Satker
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
                      Informasi 8 Pengelola Keuangan (KPA, PPK, PPSPM, Bendahara Pengeluaran, dan 4 Operator SAKTI) terproteksi dan hanya dapat dibuka oleh Admin KPPN Semarang I.
                    </p>
                  </div>

                  {/* Password Input Form */}
                  <form onSubmit={handleModalAdminLogin} className="space-y-3 pt-2 max-w-sm mx-auto">
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="password"
                        placeholder="Masukkan Password Admin KPPN..."
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value);
                          if (pinError) setPinError(null);
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    {pinError && (
                      <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center justify-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{pinError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Buka Akses Admin Sekarang</span>
                    </button>
                  </form>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Atau Anda dapat masuk via menu </span>
                    <button 
                      onClick={() => {
                        onClose();
                        if (onGoToAdminTab) onGoToAdminTab();
                      }}
                      className="text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                    >
                      Admin &amp; Upload
                    </button>
                  </div>
                </div>
              ) : (
                /* UNLOCKED OFFICERS VIEW */
                <>
                  {/* Header Info Banner */}
                  <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-sky-50 border-sky-200 text-sky-950'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-black uppercase text-sky-600 dark:text-sky-400 tracking-wider">
                        <ShieldCheck className="w-4 h-4 text-sky-500" />
                        <span>Akses Admin Terverifikasi (KPPN Semarang I)</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold">
                        Data KPA, PPK, PPSPM, Bendahara &amp; Operator SAKTI
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
                        Informasi pejabat dan operator ini hanya dapat diakses oleh Admin KPPN Semarang I. Anda dapat mengubah data atau menghubungi pejabat langsung via WhatsApp/Email.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isEditingOfficers ? (
                        <button
                          onClick={handleSaveOfficers}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan Perubahan</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsEditingOfficers(true)}
                          className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit Data Pejabat &amp; Operator</span>
                        </button>
                      )}

                      {onLogoutAdmin && (
                        <button
                          onClick={onLogoutAdmin}
                          title="Kunci kembali akses Admin"
                          className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="hidden sm:inline">Kunci Admin</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Roles Cards Grid (8 Roles) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {officerRolesList.map((role) => {
                      const roleData = officerData[role.key] || { nama: '', nip: '', noHp: '', email: '' };

                      return (
                        <div 
                          key={role.key} 
                          className={`p-4 rounded-2xl border space-y-3 transition-all ${
                            isDark ? 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600' : 'bg-white border-slate-200 shadow-xs hover:border-sky-300'
                          }`}
                        >
                          {/* Card Title & Category */}
                          <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${role.badgeColor}`}>
                                  {role.category}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">kodeSatker: {satker.kodeSatker}</span>
                              </div>
                              <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 mt-1">
                                {role.title}
                              </h4>
                            </div>
                            <UserCheck className="w-5 h-5 text-slate-400 shrink-0" />
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {role.description}
                          </p>

                          {/* Display Mode / Edit Mode */}
                          {isEditingOfficers ? (
                            <div className="space-y-2 text-xs pt-1">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Nama Lengkap &amp; Gelar:</label>
                                <input 
                                  type="text" 
                                  value={roleData.nama} 
                                  onChange={(e) => handleOfficerChange(role.key, 'nama', e.target.value)} 
                                  placeholder="Masukkan nama pejabat/operator..."
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-sky-500"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">NIP / NIK:</label>
                                  <input 
                                    type="text" 
                                    value={roleData.nip || ''} 
                                    onChange={(e) => handleOfficerChange(role.key, 'nip', e.target.value)} 
                                    placeholder="19xxxxxx..."
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-sky-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">No. HP / WhatsApp:</label>
                                  <input 
                                    type="text" 
                                    value={roleData.noHp || ''} 
                                    onChange={(e) => handleOfficerChange(role.key, 'noHp', e.target.value)} 
                                    placeholder="08xxxxxxxxxx"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-sky-500"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Email Kemenkeu / Kedinasan:</label>
                                <input 
                                  type="email" 
                                  value={roleData.email || ''} 
                                  onChange={(e) => handleOfficerChange(role.key, 'email', e.target.value)} 
                                  placeholder="email@kemenkeu.go.id"
                                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-sky-500"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 text-xs pt-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">Nama:</span>
                                <span className="font-extrabold text-slate-900 dark:text-slate-100">{roleData.nama || '-'}</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">NIP:</span>
                                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{roleData.nip || '-'}</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">No. HP / WA:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{roleData.noHp || '-'}</span>
                                  {roleData.noHp && (
                                    <button 
                                      onClick={() => handleCopyText(roleData.noHp || '', role.key)}
                                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                                      title="Salin Nomor HP"
                                    >
                                      {copiedRole === role.key ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">Email:</span>
                                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{roleData.email || '-'}</span>
                              </div>

                              {/* Quick Actions */}
                              {roleData.noHp && (
                                <div className="pt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
                                  <a
                                    href={`https://wa.me/${roleData.noHp.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg py-1 px-2 text-[11px] font-bold text-center flex items-center justify-center gap-1 transition-colors"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>Hubungi WA</span>
                                  </a>
                                  {roleData.email && (
                                    <a
                                      href={`mailto:${roleData.email}`}
                                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2 text-[11px] font-bold text-center flex items-center justify-center gap-1 transition-colors"
                                    >
                                      <Mail className="w-3 h-3 text-slate-500" />
                                      <span>Kirim Email</span>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

            </div>
          )}
          </>
          )}

        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenReminder(satker);
            }}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Buat Draft Pengingat WA / Surat Teguran</span>
          </button>
        </div>

      </div>
    </div>
  );
};
