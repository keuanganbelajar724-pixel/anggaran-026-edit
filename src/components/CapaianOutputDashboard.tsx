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
  onSelectSatker?: (satker: SatkerIKPA) => void;
  onOpenReminder: (satker: SatkerIKPA) => void;
  onGoToUpload?: () => void;
  theme?: AppTheme;
  dashboardConfig?: DashboardConfig;
}

export const CapaianOutputDashboard: React.FC<CapaianOutputDashboardProps> = ({
  satkers,
  onSelectSatker,
  onOpenReminder,
  onGoToUpload,
  theme = 'light',
  dashboardConfig
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter satkers yang memang memiliki data Capaian Output SAKTI (terisolasi dari IKPA)
  const satkersWithOutput = satkers.filter(s => s.hasCapaianOutputData === true);
  const hasAnyOutput = satkersWithOutput.length > 0;

  // Statistics & Classification
  const isSatkerBelum = (s: SatkerIKPA) => 
    s.statusCapaianOutput === 'Belum Terlaporkan' || 
    s.indikator.capaianOutput === 0;

  const totalSatker = satkersWithOutput.length;
  const satkerBelum = satkersWithOutput.filter(s => isSatkerBelum(s));
  const satkerSudah = satkersWithOutput.filter(s => !isSatkerBelum(s));

  const percentSudah = totalSatker > 0 ? ((satkerSudah.length / totalSatker) * 100).toFixed(1) : '0';
  const percentBelum = totalSatker > 0 ? ((satkerBelum.length / totalSatker) * 100).toFixed(1) : '0';

  // Filtering & Sorting (Satker belum menyampaikan / 0% diposisikan paling atas)
  const filteredSatkers = satkersWithOutput.filter(s => {
    const isBelum = isSatkerBelum(s);
    const isSudah = !isBelum;

    // Status Filter
    if (filterStatus === 'BELUM' && !isBelum) return false;
    if (filterStatus === 'SUDAH' && !isSudah) return false;

    // Search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = s.namaSatker.toLowerCase().includes(q);
      const matchKode = s.kodeSatker.toLowerCase().includes(q);
      if (!matchName && !matchKode) return false;
    }

    return true;
  }).sort((a, b) => {
    const aBelum = isSatkerBelum(a);
    const bBelum = isSatkerBelum(b);

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

      {/* Empty State Banner if no Capaian Output file uploaded */}
      {!hasAnyOutput ? (
        <div className={`p-8 sm:p-12 rounded-3xl border text-center shadow-lg space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto border shadow-inner ${
            isDark ? 'bg-slate-800/80 text-sky-400 border-slate-700' : 'bg-sky-50 text-sky-600 border-sky-200'
          }`}>
            <FileCheck className="w-10 h-10" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
              MODUL CAPAIAN OUTPUT TERISOLASI
            </span>
            <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Belum Ada Data Capaian Output SAKTI
            </h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Dashboard ini dirancang terpisah secara independen. Data dari file Excel IKPA tidak akan mencemari dashboard ini. Untuk memantau status penyampaian konfirmasi data Capaian Output, silakan unggah file Excel Capaian Output SAKTI pada menu Admin.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {onGoToUpload && (
              <button
                onClick={onGoToUpload}
                className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Upload File Excel Capaian Output SAKTI &rarr;</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>

      {/* KPI Cards (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
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

        {/* Sudah Upload / Menyampaikan */}
        <div 
          onClick={() => setFilterStatus(filterStatus === 'SUDAH' ? 'ALL' : 'SUDAH')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'SUDAH' 
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500 shadow-md' 
              : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">SUDAH MENYAMPAIKAN (&gt;0%)</span>
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

        {/* Belum Upload / Belum Menyampaikan */}
        <div 
          onClick={() => setFilterStatus(filterStatus === 'BELUM' ? 'ALL' : 'BELUM')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'BELUM' 
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500 shadow-md' 
              : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className="font-extrabold text-rose-600 dark:text-rose-400">BELUM MENYAMPAIKAN (0% DATA)</span>
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
              🔴 Belum Menyampaikan ({satkerBelum.length})
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
                <th className="py-3.5 px-4 w-12 text-center">NO</th>
                <th className="py-3.5 px-4">KODE &amp; SATUAN KERJA</th>
                <th className="py-3.5 px-4 text-center">STATUS PENYAMPAIAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredSatkers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center">
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
                  const isBelum = isSatkerBelum(satker);
                  const isSudah = !isBelum;

                  return (
                    <tr 
                      key={satker.id} 
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isBelum ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-4 px-4 font-mono font-semibold text-slate-400 text-center">{idx + 1}</td>
                      
                      <td className="py-4 px-4">
                        <div 
                          className={`font-extrabold text-sm ${
                            isDark ? 'text-white' : 'text-sky-900'
                          }`}
                        >
                          {satker.namaSatker}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono mt-1">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Kode:</span>
                          <span className={`px-2 py-0.5 rounded-md font-extrabold border ${
                            isDark ? 'bg-sky-950/80 text-sky-300 border-sky-700/80 shadow-xs' : 'bg-slate-200 text-slate-800 border-slate-300'
                          }`}>
                            {satker.kodeSatker}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {isSudah ? (
                          <span className={`inline-flex items-center gap-1.5 border px-3 py-1.5 rounded-full text-xs font-bold ${
                            isDark 
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Sudah Menyampaikan
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 border px-3.5 py-1.5 rounded-full text-xs font-extrabold animate-pulse ${
                            isDark 
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800' 
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}>
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                            Belum Menyampaikan
                          </span>
                        )}
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
              const isBelum = isSatkerBelum(satker);
              const isSudah = !isBelum;

              return (
                <div key={satker.id} className={`p-4 space-y-3 ${isBelum ? 'bg-rose-50/20' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        #{idx + 1} • {satker.kodeSatker}
                      </span>
                      <div 
                        className="font-extrabold text-sky-900 dark:text-sky-300 text-sm mt-1 text-left block leading-tight"
                      >
                        {satker.namaSatker}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSudah ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Sudah Menyampaikan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold animate-pulse">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Belum Menyampaikan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      </>
      )}

    </div>
  );
};
