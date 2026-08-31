import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Eye, 
  FileText, 
  BarChart3, 
  Laptop, 
  Smartphone, 
  Tablet, 
  Filter, 
  RefreshCw, 
  Download, 
  Printer, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Calendar, 
  Clock, 
  Search, 
  Sparkles, 
  Info, 
  Trash2, 
  Layers, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight, 
  SlidersHorizontal,
  Code,
  Globe,
  Compass,
  Cpu,
  RotateCcw,
  Radio,
  ExternalLink,
  Check
} from 'lucide-react';
import { 
  getTrafficAnalytics, 
  trackPageView, 
  isCurrentDeviceTester, 
  setDeviceTesterStatus, 
  getExcludeTesterPreference, 
  setExcludeTesterPreference, 
  getOrCreateDeviceId, 
  parseDeviceDetails, 
  resetTrafficData 
} from '../../utils/trafficTracker';
import { TrafficAnalyticsData, VisitorLogEntry } from '../../types';
import { useToast } from '../ToastNotification';
import { ModernConfirmModal, ConfirmModalState } from '../ModernConfirmModal';

interface TrafikPengunjungSectionProps {
  isDark?: boolean;
}

export const TrafikPengunjungSection: React.FC<TrafikPengunjungSectionProps> = ({ isDark = false }) => {
  const { addToast } = useToast();
  
  const [excludeTester, setExcludeTester] = useState<boolean>(getExcludeTesterPreference());
  const [isTesterDevice, setIsTesterDevice] = useState<boolean>(isCurrentDeviceTester());
  const [trafficData, setTrafficData] = useState<TrafficAnalyticsData>(() => getTrafficAnalytics({ excludeTester: getExcludeTesterPreference() }));
  const [chartRange, setChartRange] = useState<'7' | '14' | '30'>('7');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'Desktop' | 'Mobile' | 'Tablet'>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const currentDevDetails = useMemo(() => parseDeviceDetails(), []);
  const currentDeviceId = useMemo(() => getOrCreateDeviceId(), []);

  // Load analytics whenever filter changes
  useEffect(() => {
    const updated = getTrafficAnalytics({ excludeTester });
    setTrafficData(updated);
  }, [excludeTester]);

  // Reload data
  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const updated = getTrafficAnalytics({ excludeTester });
      setTrafficData(updated);
      setIsRefreshing(false);
      addToast({
        type: 'success',
        title: 'Data Trafik Dimutakhirkan',
        message: 'Statistik pengunjung dan tayangan halaman berhasil dikalibrasi secara realtime.'
      });
    }, 250);
  };

  const handleToggleExcludeTester = (val: boolean) => {
    setExcludeTester(val);
    setExcludeTesterPreference(val);
    const updated = getTrafficAnalytics({ excludeTester: val });
    setTrafficData(updated);
    addToast({
      type: 'info',
      title: val ? 'Mode Saring Penguji Aktif' : 'Mode Semua Trafik Aktif',
      message: val 
        ? 'Aktivitas pengujian programmer/admin disaring dari statistik riil satker.'
        : 'Menampilkan seluruh statistik termasuk aktivitas pengujian programmer.'
    });
  };

  const handleToggleTesterDevice = () => {
    const nextVal = !isTesterDevice;
    setIsTesterDevice(nextVal);
    setDeviceTesterStatus(nextVal);
    const updated = getTrafficAnalytics({ excludeTester });
    setTrafficData(updated);
    addToast({
      type: nextVal ? 'warning' : 'success',
      title: nextVal ? 'Perangkat Ini Ditandai Sebagai Tester/Admin' : 'Perangkat Ini Ditandai Normal',
      message: nextVal
        ? 'Aktivitas browsing dari laptop/komputer ini tidak akan menambah statistik riil Satker.'
        : 'Perangkat ini kini diperlakukan sebagai pengunjung Satker umum.'
    });
  };

  // Filtered History for Charts
  const historySlice = useMemo(() => {
    const days = parseInt(chartRange, 10);
    return trafficData.dailyHistory.slice(-days);
  }, [trafficData.dailyHistory, chartRange]);

  const maxViewsInHistory = useMemo(() => {
    if (historySlice.length === 0) return 10;
    return Math.max(...historySlice.map(h => h.pageviews), 10);
  }, [historySlice]);

  const maxHourlyViews = useMemo(() => {
    return Math.max(...trafficData.hourlyToday.map(h => h.views), 1);
  }, [trafficData.hourlyToday]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return trafficData.recentLogs.filter(log => {
      const matchSearch = 
        log.page.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.browser.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.os.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.satkerNama && log.satkerNama.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.satkerKode && log.satkerKode.includes(searchTerm));
      
      const matchDevice = deviceFilter === 'all' || log.deviceType === deviceFilter;

      return matchSearch && matchDevice;
    });
  }, [trafficData.recentLogs, searchTerm, deviceFilter]);

  // Export CSV
  const handleExportCSV = () => {
    try {
      const headers = ['Timestamp', 'Tanggal', 'Waktu', 'Perangkat', 'Sistem Operasi', 'Browser', 'Resolusi', 'Halaman Diakses', 'Status Pengunjung', 'Tipe Tester', 'Kode Satker', 'Nama Satker'];
      const rows = trafficData.recentLogs.map(l => [
        `"${l.timestamp}"`,
        `"${l.date}"`,
        `"${l.time}"`,
        `"${l.deviceType}"`,
        `"${l.os}"`,
        `"${l.browser}"`,
        `"${l.screenResolution}"`,
        `"${l.page}"`,
        `"${l.isNewVisitor ? 'Pengunjung Baru' : 'Pengunjung Berulang'}"`,
        `"${l.isTester ? 'Penguji/Programmer' : 'Satker Riil'}"`,
        `"${l.satkerKode || '-'}"`,
        `"${l.satkerNama || '-'}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Laporan_Trafik_Pengunjung_KPPN026_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
        type: 'success',
        title: 'Ekspor Berhasil',
        message: 'Laporan log trafik berhasil diunduh dalam format CSV.'
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Ekspor Gagal',
        message: 'Gagal mengekspor data trafik.'
      });
    }
  };

  const handleResetAllTraffic = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset & Mulai Ulang Data Trafik Riil?',
      message: 'Tindakan ini akan mengosongkan seluruh riwayat kunjungan dan memulai pencatatan trafik riil dari angka 0. Sangat disarankan dilakukan sebelum link dashboard disebarkan resmi ke seluruh Satker.',
      confirmText: 'Ya, Reset dari Nol (0)',
      variant: 'danger',
      onConfirm: () => {
        resetTrafficData();
        refreshData();
        addToast({
          type: 'info',
          title: 'Trafik Berhasil Direset ke 0',
          message: 'Pencatatan statistik trafik pengunjung murni dimulai dari angka 0 dan siap disebarkan ke Satker.'
        });
      }
    });
  };

  const totalDevicesRecorded = (trafficData.deviceStats.desktop + trafficData.deviceStats.mobile + trafficData.deviceStats.tablet) || 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800 text-slate-100' 
          : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/25 shrink-0">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    Statistik &amp; Infografis Trafik Pengunjung
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Telemetri Riil Aktif
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Monitoring volume kunjungan harian, tayangan halaman riil, deteksi perangkat satker, dan log akses realtime KPPN Semarang I.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-sm ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <RefreshCw className={`w-4 h-4 text-sky-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Memperbarui...' : 'Segarkan Data'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-sm ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Printer className="w-4 h-4 text-purple-500" />
              <span>Cetak Laporan</span>
            </button>

            <button
              onClick={handleResetAllTraffic}
              title="Reset seluruh statistik dari nol sebelum sebar link"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset dari 0</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP 5 INFOGRAPHIC KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* CARD 1: Pengunjung Hari Ini */}
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02] relative overflow-hidden group ${
          isDark 
            ? 'bg-[#0f172a] border-slate-800 text-white' 
            : 'bg-[#0f172a] border-slate-800 text-white'
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all" />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3.5">
            <Users className="w-7 h-7" />
          </div>
          <span className="text-xs font-semibold text-slate-300 tracking-wide mb-1">
            Pengunjung Hari Ini
          </span>
          <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {trafficData.summary.pengunjungHariIni.toLocaleString('id-ID')}
          </span>
          <span className="mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Perangkat Unik
          </span>
        </div>

        {/* CARD 2: Views Hari Ini */}
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02] relative overflow-hidden group ${
          isDark 
            ? 'bg-[#0f172a] border-slate-800 text-white' 
            : 'bg-[#0f172a] border-slate-800 text-white'
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3.5">
            <FileText className="w-7 h-7" />
          </div>
          <span className="text-xs font-semibold text-slate-300 tracking-wide mb-1">
            Views Hari Ini
          </span>
          <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {trafficData.summary.viewsHariIni.toLocaleString('id-ID')}
          </span>
          <span className="mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Tayangan Halaman
          </span>
        </div>

        {/* CARD 3: Pengunjung 7 Hari */}
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02] relative overflow-hidden group ${
          isDark 
            ? 'bg-[#0f172a] border-slate-800 text-white' 
            : 'bg-[#0f172a] border-slate-800 text-white'
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all" />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3.5">
            <TrendingUp className="w-7 h-7" />
          </div>
          <span className="text-xs font-semibold text-slate-300 tracking-wide mb-1">
            Pengunjung 7 Hari
          </span>
          <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {trafficData.summary.pengunjung7Hari.toLocaleString('id-ID')}
          </span>
          <span className="mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            1 Minggu Terakhir
          </span>
        </div>

        {/* CARD 4: Total Pengunjung */}
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02] relative overflow-hidden group ${
          isDark 
            ? 'bg-[#0f172a] border-slate-800 text-white' 
            : 'bg-[#0f172a] border-slate-800 text-white'
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all" />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 mb-3.5">
            <BarChart3 className="w-7 h-7" />
          </div>
          <span className="text-xs font-semibold text-slate-300 tracking-wide mb-1">
            Total Pengunjung
          </span>
          <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {trafficData.summary.totalPengunjung.toLocaleString('id-ID')}
          </span>
          <span className="mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Akumulasi Pengunjung
          </span>
        </div>

        {/* CARD 5: Total Views */}
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02] relative overflow-hidden group ${
          isDark 
            ? 'bg-[#0f172a] border-slate-800 text-white' 
            : 'bg-[#0f172a] border-slate-800 text-white'
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all" />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3.5">
            <Eye className="w-7 h-7" />
          </div>
          <span className="text-xs font-semibold text-slate-300 tracking-wide mb-1">
            Total Views
          </span>
          <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {trafficData.summary.totalViews.toLocaleString('id-ID')}
          </span>
          <span className="mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Total Seluruh Halaman
          </span>
        </div>
      </div>

      {/* SPECIAL PROGRAMMER / TESTER DETECTION & FILTER PANEL */}
      <div className={`p-6 sm:p-7 rounded-3xl border shadow-xl transition-all relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/30 text-slate-100' 
          : 'bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/80 border-indigo-200 text-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/30">
                <Code className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Sistem Deteksi Perangkat &amp; Filter Pengembang (Anti-Tester Skewing)
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Setiap pengunjung diidentifikasi melalui sidik jari perangkat digital. 
              Untuk mencegah pengujian &amp; refresh berulang oleh pengembang/admin menggelembungkan data riil satker, filter penguji aktif secara default sehingga angka statistik di atas murni mencatat kunjungan Satker riil.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span>ID Perangkat Ini: <strong className="text-indigo-600 dark:text-indigo-400">{currentDeviceId.slice(0, 18)}...</strong></span>
              <span>•</span>
              <span>Tipe: <strong>{currentDevDetails.deviceType} ({currentDevDetails.os})</strong></span>
              <span>•</span>
              <span>Browser: <strong>{currentDevDetails.browser}</strong></span>
              <span>•</span>
              <span>Status Perangkat: <strong className={isTesterDevice ? 'text-amber-500' : 'text-emerald-500'}>{isTesterDevice ? 'Tester / Developer' : 'Satker Normal'}</strong></span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 shrink-0">
            {/* Toggle Exclude Tester */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 w-full sm:w-auto shadow-sm ${
              isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-indigo-100'
            }`}>
              <div className="space-y-0.5">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Saring Penguji / Tester</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {excludeTester ? 'Hanya hitung Satker riil' : 'Tampilkan semua termasuk tester'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleExcludeTester(!excludeTester)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  excludeTester ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    excludeTester ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle Current Device as Tester */}
            <button
              onClick={handleToggleTesterDevice}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer shadow-sm w-full sm:w-auto justify-center ${
                isTesterDevice 
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 font-extrabold shadow-amber-500/20' 
                  : isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isTesterDevice ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-slate-950" />
                  <span>Perangkat Ini: TESTER AKTIF</span>
                </>
              ) : (
                <>
                  <Code className="w-4 h-4 text-indigo-500" />
                  <span>Tandai Perangkat Ini sbg Tester</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DAILY TREND CHART (2 COLS) */}
        <div className={`lg:col-span-2 p-6 sm:p-8 rounded-3xl border shadow-xl flex flex-col justify-between ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Tren Kunjungan &amp; Tayangan Harian
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perbandingan volume Pengunjung Unik vs Total Pageviews harian Satker.
              </p>
            </div>

            {/* Range Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
              <button
                onClick={() => setChartRange('7')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chartRange === '7'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setChartRange('14')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chartRange === '14'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                14 Hari
              </button>
              <button
                onClick={() => setChartRange('30')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chartRange === '30'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                30 Hari
              </button>
            </div>
          </div>

          {/* Bar / Column Chart Visualizer */}
          <div className="relative pt-6 pb-2">
            {historySlice.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                <BarChart3 className="w-10 h-10 mb-2 opacity-40 text-indigo-500" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Menunggu Kunjungan Pertama Satker</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">Grafik telemetri akan terisi secara realtime saat tautan disebarkan dan Satker mulai membuka dashboard.</p>
              </div>
            ) : (
              <div className="h-64 sm:h-72 w-full flex items-end justify-between gap-1.5 sm:gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                {historySlice.map((rec, idx) => {
                  const viewsHeightPercent = Math.max(8, (rec.pageviews / maxViewsInHistory) * 100);
                  const visitorsHeightPercent = Math.max(8, (rec.uniqueVisitors / maxViewsInHistory) * 100);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer">
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 bg-slate-950 text-white text-[11px] p-2.5 rounded-xl shadow-2xl border border-slate-700 whitespace-nowrap -translate-y-2 group-hover:translate-y-0">
                        <div className="font-bold text-sky-400">{rec.displayDate}</div>
                        <div>👥 Pengunjung: <strong>{rec.uniqueVisitors}</strong></div>
                        <div>📄 Tayangan: <strong>{rec.pageviews}</strong></div>
                      </div>

                      {/* Dual Bars */}
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        {/* Views Bar (Indigo) */}
                        <div 
                          style={{ height: `${viewsHeightPercent}%` }} 
                          className="w-full max-w-[14px] bg-gradient-to-t from-indigo-600 to-sky-400 rounded-t-md transition-all duration-500 group-hover:brightness-125 shadow-xs"
                        />
                        {/* Visitors Bar (Emerald) */}
                        <div 
                          style={{ height: `${visitorsHeightPercent}%` }} 
                          className="w-full max-w-[14px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-md transition-all duration-500 group-hover:brightness-125 shadow-xs"
                        />
                      </div>

                      {/* X-axis Label */}
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-2 truncate w-full text-center">
                        {rec.displayDate.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend & Summary */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-2">
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-slate-600 dark:text-slate-300">Views / Tayangan Halaman</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-300">Pengunjung Unik (Satker)</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                {historySlice.length > 0 ? (
                  <>Rata-rata: <strong>{Number.isFinite(Math.round(historySlice.reduce((a, b) => a + (b.uniqueVisitors || 0), 0) / (historySlice.length || 1))) ? Math.round(historySlice.reduce((a, b) => a + (b.uniqueVisitors || 0), 0) / (historySlice.length || 1)) : 0}</strong> Pengunjung / Hari</>
                ) : (
                  <span>Belum ada data historis</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* HOURLY DISTRIBUTION TODAY (1 COL) */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl flex flex-col justify-between ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Jam Sibuk Kunjungan Hari Ini
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribusi 24 Jam WIB (Puncak aktivitas Satker).
            </p>
          </div>

          {/* Hourly Visualizer Bars */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {trafficData.hourlyToday.filter(h => parseInt(h.hour, 10) >= 6 && parseInt(h.hour, 10) <= 22).map((item, idx) => {
              const percent = Math.min(100, Math.max(0, (item.views / maxHourlyViews) * 100));
              const isPeak = item.views >= maxHourlyViews * 0.7 && item.views > 0;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500 dark:text-slate-400">{item.label} WIB</span>
                    <span className="font-bold flex items-center gap-1.5">
                      {isPeak && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-400 text-slate-950">
                          🔥 Puncak
                        </span>
                      )}
                      <span>{item.views} Views</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${percent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPeak 
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500' 
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 mt-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Pola akses tercatat secara realtime sesuai jam operasional satker membuka dashboard.</span>
          </div>
        </div>
      </div>

      {/* DEVICE & PLATFORM INFOGRAPHICS + TOP PAGES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CARD 1: Perangkat yang Digunakan */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-sky-500/10 text-sky-500 rounded-2xl">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black tracking-tight">Kategori Perangkat</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Desktop vs Mobile vs Tablet</p>
            </div>
          </div>

          {(() => {
            const total = totalDevicesRecorded || 1;
            const pDesktop = totalDevicesRecorded > 0 ? Math.round((trafficData.deviceStats.desktop / total) * 100) : 0;
            const pMobile = totalDevicesRecorded > 0 ? Math.round((trafficData.deviceStats.mobile / total) * 100) : 0;
            const pTablet = totalDevicesRecorded > 0 ? (100 - pDesktop - pMobile) : 0;

            return (
              <div className="space-y-4">
                {/* Desktop */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                      <Laptop className="w-4 h-4 text-blue-500" /> Desktop / PC / Laptop
                    </span>
                    <span>{pDesktop}% ({trafficData.deviceStats.desktop.toLocaleString('id-ID')})</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div style={{ width: `${pDesktop}%` }} className="h-full bg-blue-500 rounded-full" />
                  </div>
                </div>

                {/* Mobile */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                      <Smartphone className="w-4 h-4 text-emerald-500" /> Smartphone / Mobile
                    </span>
                    <span>{pMobile}% ({trafficData.deviceStats.mobile.toLocaleString('id-ID')})</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div style={{ width: `${pMobile}%` }} className="h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>

                {/* Tablet */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                      <Tablet className="w-4 h-4 text-purple-500" /> Tablet / iPad
                    </span>
                    <span>{pTablet}% ({trafficData.deviceStats.tablet.toLocaleString('id-ID')})</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div style={{ width: `${pTablet}%` }} className="h-full bg-purple-500 rounded-full" />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* CARD 2: Browser & Sistem Operasi */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-2xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black tracking-tight">Browser &amp; OS Populer</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Distribusi platform pengunjung</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Top Web Browser</span>
              <div className="mt-2 space-y-2">
                {trafficData.deviceStats.browserList.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">Belum ada data browser</div>
                ) : (
                  trafficData.deviceStats.browserList.slice(0, 3).map((b, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{b.name}</span>
                      <span className="font-bold text-indigo-500">{Number.isFinite(b.percentage) ? b.percentage : 0}% ({b.count || 0})</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sistem Operasi</span>
              <div className="mt-2 space-y-2">
                {trafficData.deviceStats.osList.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">Belum ada data OS</div>
                ) : (
                  trafficData.deviceStats.osList.slice(0, 3).map((os, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{os.name}</span>
                      <span className="font-bold text-emerald-500">{Number.isFinite(os.percentage) ? os.percentage : 0}% ({os.count || 0})</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Halaman / Modul Paling Populer */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black tracking-tight">Halaman Terpopuler</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fitur yang paling sering dibuka Satker</p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {trafficData.topPages.length === 0 ? (
              <div className="text-xs text-slate-400 italic text-center py-6">Belum ada riwayat tayangan halaman</div>
            ) : (
              trafficData.topPages.slice(0, 5).map((page, idx) => (
                <div key={idx} className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="space-y-0.5 max-w-[70%]">
                    <div className="font-bold truncate">{page.title}</div>
                    <div className="text-[10px] text-slate-400">{page.count.toLocaleString('id-ID')} tayangan</div>
                  </div>
                  <span className="font-black px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs">
                    {page.percentage}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* LIVE TRAFFIC LOGS TABLE */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Log Aktivitas &amp; Aliran Kunjungan Terkini (Real-time Feed)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan {filteredLogs.length} entri riwayat kunjungan riil yang tercatat di portal.
            </p>
          </div>

          {/* Table Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Satker / Halaman..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Device Filter */}
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value as any)}
              className={`px-3 py-1.5 text-xs rounded-xl border font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-200' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">Semua Perangkat</option>
              <option value="Desktop">💻 Desktop Saja</option>
              <option value="Mobile">📱 Mobile Saja</option>
              <option value="Tablet">📟 Tablet Saja</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className={`text-[11px] font-black uppercase tracking-wider ${
              isDark ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-100 text-slate-600'
            }`}>
              <tr>
                <th className="px-4 py-3.5">Waktu Akses</th>
                <th className="px-4 py-3.5">Perangkat &amp; Platform</th>
                <th className="px-4 py-3.5">Browser</th>
                <th className="px-4 py-3.5">Halaman / Fitur</th>
                <th className="px-4 py-3.5">Satker / Identitas</th>
                <th className="px-4 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium">
                    Belum ada log kunjungan riil yang tercatat. Kunjungan akan otomatis muncul saat pengguna menjelajahi menu.
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 30).map((log, idx) => (
                  <tr key={log.id || idx} className={`transition-colors ${
                    isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                  }`}>
                    {/* Waktu */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold">{log.time} WIB</div>
                      <div className="text-[10px] text-slate-400">{log.date}</div>
                    </td>

                    {/* Perangkat & Platform */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {log.deviceType === 'Desktop' ? (
                          <Laptop className="w-4 h-4 text-blue-500" />
                        ) : log.deviceType === 'Mobile' ? (
                          <Smartphone className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Tablet className="w-4 h-4 text-purple-500" />
                        )}
                        <div>
                          <div className="font-semibold">{log.deviceType}</div>
                          <div className="text-[10px] text-slate-400">{log.os} • {log.screenResolution}</div>
                        </div>
                      </div>
                    </td>

                    {/* Browser */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{log.browser}</span>
                    </td>

                    {/* Halaman */}
                    <td className="px-4 py-3">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{log.page}</span>
                    </td>

                    {/* Satker Context */}
                    <td className="px-4 py-3">
                      {log.satkerNama ? (
                        <div>
                          <div className="font-bold truncate max-w-[180px]">{log.satkerNama}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Kode: {log.satkerKode}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pengunjung Umum</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {log.isTester ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950">
                          Tester / Dev
                        </span>
                      ) : log.isNewVisitor ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Baru
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          Berulang
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADMIN FOOTER */}
      <div className={`p-4 sm:p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
        isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>Statistik ini bersifat internal (Admin Only) dan menggunakan data telemetri 100% riil tanpa rekayasa.</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          KPPN 026 Semarang I Analytics v2.0
        </div>
      </div>

      {/* CONFIRM MODAL */}
      <ModernConfirmModal
        state={confirmModal}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDark={isDark}
      />
    </div>
  );
};
