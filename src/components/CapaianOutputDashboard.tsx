import React, { useState } from 'react';
import { SatkerIKPA, AppTheme, DashboardConfig } from '../types';
import { 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Send, 
  Building2, 
  TrendingUp, 
  Filter, 
  Award,
  Sparkles,
  PieChart,
  ArrowUpRight,
  Zap,
  Info,
  Calendar
} from 'lucide-react';

interface CapaianOutputDashboardProps {
  satkers: SatkerIKPA[];
  onSelectSatker: (satker: SatkerIKPA) => void;
  onOpenReminder: (satker: SatkerIKPA) => void;
  theme?: AppTheme;
  dashboardConfig?: DashboardConfig;
}

export const CapaianOutputDashboard: React.FC<CapaianOutputDashboardProps> = ({
  satkers,
  onSelectSatker,
  onOpenReminder,
  theme = 'light',
  dashboardConfig
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterKL, setFilterKL] = useState<string>('ALL');

  // Statistics
  const totalSatker = satkers.length;
  const satkerSudah = satkers.filter(s => s.statusCapaianOutput === 'Sudah Terlaporkan' && s.indikator.capaianOutput > 0);
  const satkerBelum = satkers.filter(s => s.statusCapaianOutput === 'Belum Terlaporkan' || s.indikator.capaianOutput === 0);
  const satkerTerlambat = satkers.filter(s => s.statusCapaianOutput === 'Terlambat');

  const percentSudah = totalSatker > 0 ? ((satkerSudah.length / totalSatker) * 100).toFixed(1) : '0';
  const percentBelum = totalSatker > 0 ? ((satkerBelum.length / totalSatker) * 100).toFixed(1) : '0';

  const avgCapaian = totalSatker > 0 
    ? (satkers.reduce((acc, curr) => acc + curr.indikator.capaianOutput, 0) / totalSatker).toFixed(2)
    : '0';

  // Extract unique KL
  const uniqueKL = Array.from(new Set(satkers.map(s => s.kementerianLembaga))).filter(Boolean);

  // Filtering & Sorting (Satker belum menyampaikan / 0% diposisikan paling atas)
  const filteredSatkers = satkers.filter(s => {
    // Status Filter
    if (filterStatus === 'BELUM' && !(s.statusCapaianOutput === 'Belum Terlaporkan' || s.indikator.capaianOutput === 0)) return false;
    if (filterStatus === 'SUDAH' && !(s.statusCapaianOutput === 'Sudah Terlaporkan' && s.indikator.capaianOutput > 0)) return false;
    if (filterStatus === 'TERLAMBAT' && s.statusCapaianOutput !== 'Terlambat') return false;

    // KL Filter
    if (filterKL !== 'ALL' && s.kementerianLembaga !== filterKL) return false;

    // Search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = s.namaSatker.toLowerCase().includes(q);
      const matchKode = s.kodeSatker.toLowerCase().includes(q);
      const matchKL = s.kementerianLembaga.toLowerCase().includes(q);
      if (!matchName && !matchKode && !matchKL) return false;
    }

    return true;
  }).sort((a, b) => {
    const aBelum = a.statusCapaianOutput === 'Belum Terlaporkan' || a.indikator.capaianOutput === 0;
    const bBelum = b.statusCapaianOutput === 'Belum Terlaporkan' || b.indikator.capaianOutput === 0;

    if (aBelum && !bBelum) return -1;
    if (!aBelum && bBelum) return 1;

    if (a.indikator.capaianOutput !== b.indikator.capaianOutput) {
      return a.indikator.capaianOutput - b.indikator.capaianOutput;
    }

    return a.nilaiTotalIKPA - b.nilaiTotalIKPA;
  });

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      
      {/* Top Banner Notice - Capaian Output SAKTI */}
      <div className={`${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 border-slate-800' 
          : 'bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900'
      } p-6 sm:p-8 rounded-3xl border text-white shadow-xl relative overflow-hidden space-y-4`}>
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                {dashboardConfig?.customTexts?.capaianOutputBadge || 'Monitoring SAKTI Real-Time • KPPN Semarang I (026)'}
              </div>
              <div className="inline-flex items-center gap-1.5 bg-slate-900/80 text-sky-200 border border-sky-500/30 px-3 py-1 rounded-full text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Data Diperbarui: <strong className="text-white">{dashboardConfig?.updateDates?.capaianOutput || 'Periode Juli 2026 (Diperbarui 07 Aug 2026)'}</strong></span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {dashboardConfig?.customTexts?.capaianOutputTitle || 'Dashboard Khusus Capaian Output SAKTI'}
            </h2>
            <p className="text-sky-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {dashboardConfig?.customTexts?.capaianOutputSubtitle || 'Fokus pengawasan pengiriman & konfirmasi data Capaian Output bulan berjalan. Mencegah penurunan skor IKPA akibat keterlambatan atau data 0%.'}
            </p>
          </div>

          {/* Quick Progress Dial */}
          <div className="shrink-0 bg-slate-900/80 border border-sky-500/30 p-5 rounded-2xl flex items-center gap-5 shadow-inner">
            <div>
              <div className="text-[11px] font-extrabold text-sky-300 uppercase tracking-wider">Penyampaian Wilayah 026</div>
              <div className="text-3xl font-black text-white flex items-baseline gap-1">
                {percentSudah}%
                <span className="text-xs font-normal text-sky-300">terlaporkan</span>
              </div>
              <div className="w-48 bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-gradient-to-r from-sky-400 to-emerald-400 h-full transition-all duration-500" 
                  style={{ width: `${percentSudah}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Satker */}
        <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-5 rounded-2xl border shadow-xs`}>
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>TOTAL SATKER TERDAFTAR</span>
            <div className="p-2 bg-sky-50 dark:bg-sky-950 text-sky-600 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalSatker}</span>
            <span className="text-xs font-semibold text-slate-500">Satker KPPN 026</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between">
            <span>Kode KPPN:</span>
            <span className="font-bold text-sky-600">Semarang I (026)</span>
          </div>
        </div>

        {/* Sudah Upload */}
        <div 
          onClick={() => setFilterStatus(filterStatus === 'SUDAH' ? 'ALL' : 'SUDAH')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'SUDAH' 
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500 shadow-md' 
              : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">SUDAH TERLAPORKAN (&gt;0%)</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{satkerSudah.length}</span>
            <span className="text-xs font-bold text-emerald-600">({percentSudah}%)</span>
          </div>
          <div className="mt-3 text-xs text-emerald-700 dark:text-emerald-400 border-t border-emerald-100 dark:border-emerald-900/50 pt-2 flex justify-between font-semibold">
            <span>Status Output:</span>
            <span>✓ Sudah Terkirim</span>
          </div>
        </div>

        {/* Belum Upload / 0% */}
        <div 
          onClick={() => setFilterStatus(filterStatus === 'BELUM' ? 'ALL' : 'BELUM')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'BELUM' 
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500 shadow-md' 
              : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className="font-extrabold text-rose-600 dark:text-rose-400">BELUM UPLOAD (0% DATA)</span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{satkerBelum.length}</span>
            <span className="text-xs font-bold text-rose-600">({percentBelum}%)</span>
          </div>
          <div className="mt-3 text-xs text-rose-700 dark:text-rose-400 border-t border-rose-100 dark:border-rose-900/50 pt-2 flex justify-between font-semibold">
            <span>Risiko IKPA:</span>
            <span className="bg-rose-200 dark:bg-rose-950 text-rose-900 dark:text-rose-200 px-1.5 py-0.5 rounded text-[10px]">Teguran WA</span>
          </div>
        </div>

        {/* Rata-Rata Capaian Output */}
        <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-5 rounded-2xl border shadow-xs`}>
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>RATA-RATA NILAI CAPAIAN</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600">{avgCapaian}%</span>
            <span className="text-xs font-semibold text-indigo-500">Nilai Rata-rata</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between">
            <span>Target Capaian:</span>
            <span className="font-bold text-emerald-600">100.00%</span>
          </div>
        </div>

      </div>

      {/* Filter & Controls Bar */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs`}>
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Satker atau Kode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full text-xs rounded-xl pl-9 pr-3 py-2.5 border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          
          {/* Status Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Semua ({totalSatker})
            </button>
            <button
              onClick={() => setFilterStatus('BELUM')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'BELUM' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              🔴 Belum ({satkerBelum.length})
            </button>
            <button
              onClick={() => setFilterStatus('SUDAH')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'SUDAH' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              🟢 Sudah ({satkerSudah.length})
            </button>
          </div>

          {/* KL Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterKL}
              onChange={(e) => setFilterKL(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL">Semua K/L</option>
              {uniqueKL.map(kl => (
                <option key={kl} value={kl}>{kl}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Main Table */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl border shadow-xl overflow-hidden`}>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight flex items-center gap-2`}>
              <FileCheck className="w-5 h-5 text-sky-600" />
              Monitoring Detail Penyampaian Capaian Output SAKTI Satker
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Menampilkan {filteredSatkers.length} dari total {satkers.length} Satker KPPN Semarang I (026).
            </p>
          </div>
        </div>

        {/* Main Table (Desktop View) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`${isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-50 text-slate-600'} text-xs font-extrabold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider`}>
                <th className="py-3.5 px-4">No</th>
                <th className="py-3.5 px-4">Kode & Satuan Kerja</th>
                <th className="py-3.5 px-4">Kementerian / Lembaga</th>
                <th className="py-3.5 px-4 text-center">Status Penyampaian</th>
                <th className="py-3.5 px-4">Progress Visual Output (% Data)</th>
                <th className="py-3.5 px-4 text-center">Aksi Pengingat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredSatkers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="max-w-md mx-auto space-y-2">
                      <Info className="w-10 h-10 mx-auto text-slate-400" />
                      <p className={`font-extrabold text-base ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {satkers.length === 0 ? 'Belum Ada Data Satker (0 Satker)' : 'Tidak Ada Data Satker'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {satkers.length === 0
                          ? 'Silakan unggah file Excel Capaian Output SAKTI Anda di menu Admin & Upload Excel.'
                          : 'Tidak ada Satker yang sesuai dengan kriteria filter saat ini.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSatkers.map((satker, idx) => {
                  const isBelum = satker.statusCapaianOutput === 'Belum Terlaporkan' || satker.indikator.capaianOutput === 0;
                  const isSudah = satker.statusCapaianOutput === 'Sudah Terlaporkan' && satker.indikator.capaianOutput > 0;

                  return (
                    <tr 
                      key={satker.id} 
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isBelum ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-4 px-4 font-mono font-semibold text-slate-400">{idx + 1}</td>
                      
                      <td className="py-4 px-4">
                        <button 
                          onClick={() => onSelectSatker(satker)}
                          className={`text-left font-extrabold hover:underline cursor-pointer block text-sm ${
                            isDark ? 'text-white' : 'text-sky-800'
                          }`}
                        >
                          {satker.namaSatker}
                        </button>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono mt-1">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Kode:</span>
                          <span className={`px-2 py-0.5 rounded-md font-extrabold border ${
                            isDark ? 'bg-sky-950/80 text-sky-300 border-sky-700/80 shadow-xs' : 'bg-slate-200 text-slate-800 border-slate-300'
                          }`}>
                            {satker.kodeSatker}
                          </span>
                        </div>
                      </td>

                      <td className={`py-4 px-4 font-medium max-w-xs truncate ${
                        isDark ? 'text-amber-200/90' : 'text-slate-700'
                      }`}>
                        {satker.kementerianLembaga}
                      </td>

                      <td className="py-4 px-4 text-center">
                        {isSudah ? (
                          <span className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-[11px] font-bold ${
                            isDark 
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Sudah Terlaporkan
                          </span>
                        ) : satker.statusCapaianOutput === 'Terlambat' ? (
                          <span className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-[11px] font-bold ${
                            isDark 
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800' 
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}>
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            Terlambat
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-[11px] font-extrabold animate-pulse ${
                            isDark 
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800' 
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}>
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                            Belum Upload (0%)
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 min-w-[200px]">
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className={isBelum ? 'text-rose-600' : 'text-emerald-600'}>
                            {satker.indikator.capaianOutput}% Output
                          </span>
                          <span className="text-[10px] text-slate-400">Target 100%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              isBelum 
                                ? 'bg-rose-500' 
                                : satker.indikator.capaianOutput < 80 
                                ? 'bg-amber-500' 
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${satker.indikator.capaianOutput}%` }}
                          ></div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => onOpenReminder(satker)}
                          className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Kirim Pengingat</span>
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout (Visible on small screens) */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredSatkers.length === 0 ? (
            <div className="py-10 px-4 text-center text-slate-400">
              <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Tidak ada Satker yang sesuai dengan kriteria filter saat ini.
            </div>
          ) : (
            filteredSatkers.map((satker, idx) => {
              const isBelum = satker.statusCapaianOutput === 'Belum Terlaporkan' || satker.indikator.capaianOutput === 0;
              const isSudah = satker.statusCapaianOutput === 'Sudah Terlaporkan' && satker.indikator.capaianOutput > 0;

              return (
                <div key={satker.id} className={`p-4 space-y-3 ${isBelum ? 'bg-rose-50/20' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        #{idx + 1} • {satker.kodeSatker}
                      </span>
                      <button 
                        onClick={() => onSelectSatker(satker)}
                        className="font-extrabold text-sky-700 dark:text-sky-400 text-sm mt-1 text-left block leading-tight hover:underline cursor-pointer"
                      >
                        {satker.namaSatker}
                      </button>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{satker.kementerianLembaga}</p>
                    </div>

                    <div className="shrink-0">
                      {isSudah ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Sudah
                        </span>
                      ) : satker.statusCapaianOutput === 'Terlambat' ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Terlambat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold animate-pulse">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Belum
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className={isBelum ? 'text-rose-600' : 'text-emerald-600'}>
                        Progress Capaian Output SAKTI: {satker.indikator.capaianOutput}%
                      </span>
                      <span className="text-[10px] text-slate-400">Target 100%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isBelum ? 'bg-rose-500' : satker.indikator.capaianOutput < 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${satker.indikator.capaianOutput}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onSelectSatker(satker)}
                      className="flex-1 py-2.5 px-3 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-slate-700 text-center min-h-[42px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Detail SAKTI</span>
                    </button>
                    <button
                      onClick={() => onOpenReminder(satker)}
                      className="flex-1 py-2.5 px-3 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-center min-h-[42px] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim WA</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
