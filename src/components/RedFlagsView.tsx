import React, { useState } from 'react';
import { SatkerIKPA, AppTheme, DashboardConfig } from '../types';
import { PaginationControl } from './PaginationControl';
import { 
  AlertTriangle, 
  Send, 
  Clock, 
  TrendingDown, 
  FileWarning, 
  PhoneCall, 
  Mail, 
  CheckCircle2, 
  Eye,
  ShieldAlert,
  ListFilter,
  Calendar
} from 'lucide-react';

interface RedFlagsViewProps {
  satkers: SatkerIKPA[];
  onOpenReminder: (satker: SatkerIKPA) => void;
  onSelectSatker: (satker: SatkerIKPA) => void;
  onOpenBulkReminder: (targetSatkers: SatkerIKPA[]) => void;
  onGoToUpload?: () => void;
  theme?: AppTheme;
  dashboardConfig?: DashboardConfig;
}

export const RedFlagsView: React.FC<RedFlagsViewProps> = ({
  satkers,
  onOpenReminder,
  onSelectSatker,
  onOpenBulkReminder,
  onGoToUpload,
  theme = 'light',
  dashboardConfig
}) => {
  const isDark = theme === 'dark';
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'OUTPUT' | 'IKPA_LOW' | 'PENYERAPAN' | 'DEVIASI'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  // Filter Problematic Satkers ONLY from satkers that have actual IKPA data
  const satkersWithIKPA = satkers.filter(s => s.hasIKPAData === true || (s.hasIKPAData !== false && (s.nilaiTotalIKPA > 0 || s.paguAnggaran > 0)));
  const hasCaputData = satkers.some(s => s.hasCapaianOutputData === true);

  const satkerBelumOutput = hasCaputData 
    ? satkersWithIKPA.filter(s => s.hasCapaianOutputData === true && (s.statusCapaianOutput !== 'Sudah Terlaporkan' || (s.indikator && s.indikator.capaianOutput === 0)))
    : [];
  const satkerIKPALow = satkersWithIKPA.filter(s => s.nilaiTotalIKPA < 87.5);
  const satkerPenyerapanRendah = satkersWithIKPA.filter(s => s.indikator.penyerapanAnggaran < 85);
  const satkerDeviasiTinggi = satkersWithIKPA.filter(s => s.indikator.deviasiHal3Dipa < 85);

  let displayedSatkers: SatkerIKPA[] = [];
  if (satkersWithIKPA.length === 0) {
    displayedSatkers = [];
  } else if (activeCategory === 'OUTPUT') {
    displayedSatkers = satkerBelumOutput;
  } else if (activeCategory === 'IKPA_LOW') {
    displayedSatkers = satkerIKPALow;
  } else if (activeCategory === 'PENYERAPAN') {
    displayedSatkers = satkerPenyerapanRendah;
  } else if (activeCategory === 'DEVIASI') {
    displayedSatkers = satkerDeviasiTinggi;
  } else {
    // Unique list of satkers with at least 1 issue
    const idSet = new Set<string>();
    displayedSatkers = satkersWithIKPA.filter(s => {
      const hasOutputIssue = hasCaputData && (s.statusCapaianOutput !== 'Sudah Terlaporkan' || (s.indikator && s.indikator.capaianOutput === 0));
      const hasIssue = s.nilaiTotalIKPA < 87.5 || hasOutputIssue || s.indikator.penyerapanAnggaran < 85 || s.indikator.deviasiHal3Dipa < 85;
      if (hasIssue && !idSet.has(s.id)) {
        idSet.add(s.id);
        return true;
      }
      return false;
    });
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Alert Banner */}
      <div className="bg-rose-900 border border-rose-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 bg-rose-950/80 text-rose-200 border border-rose-700/80 px-3 py-1 rounded-full text-xs font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                {dashboardConfig?.customTexts?.redflagsBadge || 'EVALUASI PERHATIAN KHUSUS KPPN SEMARANG I'}
              </div>
              <div className="inline-flex items-center gap-1.5 bg-rose-950/80 text-rose-200 border border-rose-700/80 px-3 py-1 rounded-full text-xs font-bold">
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                <span>Data Diperbarui: <strong className="text-white">{dashboardConfig?.updateDates?.redflags || '07 Agustus 2026 - 09:00 WIB'}</strong></span>
              </div>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {dashboardConfig?.customTexts?.redflagsTitle || 'Satker Berisiko Menurunkan IKPA & Belum Capaian Output'}
            </h2>
            <p className="text-rose-200 text-xs sm:text-sm mt-1 max-w-2xl">
              {dashboardConfig?.customTexts?.redflagsSubtitle || 'Daftar Satker yang membutuhkan pembinaan langsung, intervensi cepat, dan teguran resmi untuk mencegah penurunan kinerja anggaran.'}
            </p>
          </div>

          {displayedSatkers.length > 0 && (
            <button
              onClick={() => onOpenBulkReminder(displayedSatkers)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 self-start md:self-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Pengingat Masal ({displayedSatkers.length} Satker)</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs by Risk Category */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        <button
          onClick={() => {
            setActiveCategory('ALL');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeCategory === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-700'
              : isDark
              ? 'bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800/80'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Semua Satker Red Flag</div>
          <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{satkersWithIKPA.filter(s => s.nilaiTotalIKPA < 87.5 || s.statusCapaianOutput !== 'Sudah Terlaporkan' || (s.indikator && s.indikator.capaianOutput === 0) || s.persenPenyerapan < 70 || s.indikator.deviasiHal3Dipa < 75).length}</div>
          <div className="text-[11px] opacity-80 mt-1">Gagal Target / Belum Output</div>
        </button>

        <button
          onClick={() => {
            setActiveCategory('OUTPUT');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeCategory === 'OUTPUT'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-400'
              : isDark
              ? 'bg-slate-900 text-rose-300 border-rose-900/60 hover:bg-slate-800'
              : 'bg-white text-rose-900 border-rose-200 hover:bg-rose-50'
          }`}
        >
          <div className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">Capaian Output Belum</div>
          <div className="text-2xl font-black text-rose-500">{satkerBelumOutput.length}</div>
          <div className="text-[11px] opacity-80 mt-1">Bobot IKPA 25% Berisiko</div>
        </button>

        <button
          onClick={() => {
            setActiveCategory('IKPA_LOW');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeCategory === 'IKPA_LOW'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400'
              : isDark
              ? 'bg-slate-900 text-amber-300 border-amber-900/60 hover:bg-slate-800'
              : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'
          }`}
        >
          <div className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">Nilai IKPA &lt; 87.50</div>
          <div className="text-2xl font-black text-amber-500">{satkerIKPALow.length}</div>
          <div className="text-[11px] opacity-80 mt-1">Predikat Cukup / Perlu Perhatian</div>
        </button>

        <button
          onClick={() => {
            setActiveCategory('PENYERAPAN');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeCategory === 'PENYERAPAN'
              ? 'bg-sky-700 text-white border-sky-700 shadow-md ring-2 ring-sky-400'
              : isDark
              ? 'bg-slate-900 text-sky-300 border-sky-900/60 hover:bg-slate-800'
              : 'bg-white text-sky-900 border-sky-200 hover:bg-sky-50'
          }`}
        >
          <div className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">Penyerapan &lt; 70%</div>
          <div className="text-2xl font-black text-sky-500">{satkerPenyerapanRendah.length}</div>
          <div className="text-[11px] opacity-80 mt-1">Realisasi Pagu Lambat</div>
        </button>

        <button
          onClick={() => {
            setActiveCategory('DEVIASI');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeCategory === 'DEVIASI'
              ? 'bg-purple-700 text-white border-purple-700 shadow-md ring-2 ring-purple-400'
              : isDark
              ? 'bg-slate-900 text-purple-300 border-purple-900/60 hover:bg-slate-800'
              : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-50'
          }`}
        >
          <div className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">Deviasi Hal III Tinggi</div>
          <div className="text-2xl font-black text-purple-500">{satkerDeviasiTinggi.length}</div>
          <div className="text-[11px] opacity-80 mt-1">Miskalkulasi RPD DIPA</div>
        </button>

      </div>

      {/* Satker List Cards */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedSatkers.length === 0 ? (
            <div className={`col-span-full p-12 rounded-2xl border text-center ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {satkersWithIKPA.length === 0 
                  ? 'Belum Ada Data Evaluasi IKPA (0 Satker)' 
                  : 'Luar biasa! Tidak ada Satker pada kategori masalah ini.'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {satkersWithIKPA.length === 0 
                  ? 'Tab Perlu Perhatian terhubung langsung dengan Dashboard IKPA (8 Indikator). Silakan unggah File Excel IKPA di menu Admin untuk memuat evaluasi dan deteksi risiko kinerja.'
                  : 'Seluruh Satker mitra KPPN Semarang I dalam kelompok ini telah memenuhi kualifikasi target.'}
              </p>
              {satkersWithIKPA.length === 0 && onGoToUpload && (
                <div className="pt-4">
                  <button
                    onClick={onGoToUpload}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Upload File Excel IKPA &rarr;</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            (pageSize <= 0 ? displayedSatkers : displayedSatkers.slice((currentPage - 1) * pageSize, currentPage * pageSize)).map((satker) => (
              <div 
                key={satker.id}
                className={`${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl' : 'bg-white border-rose-200 text-slate-800 shadow-xs'
                } rounded-2xl border hover:shadow-md transition-all p-5 flex flex-col justify-between`}
              >
                <div>
                  {/* Satker Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded-md border ${
                          isDark ? 'bg-sky-950/80 text-sky-300 border-sky-700/80' : 'bg-slate-900 text-amber-300'
                        }`}>
                          {satker.kodeSatker}
                        </span>
                        <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-400'}`}>
                          {satker.unitEselon1 || 'Satker KPPN SMG I'}
                        </span>
                      </div>
                      <h3 className={`text-base font-extrabold mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {satker.namaSatker}
                      </h3>
                    </div>

                    {/* Score Tag */}
                    <div className="text-right shrink-0">
                      <div className={`text-2xl font-black ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                        {satker.nilaiTotalIKPA}
                      </div>
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block border ${
                        isDark ? 'text-rose-300 bg-rose-950/80 border-rose-800' : 'text-rose-800 bg-rose-100 border-rose-200'
                      }`}>
                        {satker.predikat}
                      </div>
                    </div>
                  </div>

                  {/* KL & Contact */}
                  <p className={`text-xs font-medium mb-3 truncate ${isDark ? 'text-amber-200/90' : 'text-slate-600'}`}>
                    {satker.kementerianLembaga}
                  </p>

                  {/* Key Risk Highlights */}
                  <div className={`rounded-xl p-3 border mb-4 space-y-1.5 ${
                    isDark ? 'bg-rose-950/40 border-rose-900/60 text-rose-200' : 'bg-rose-50/80 border-rose-100 text-rose-800'
                  }`}>
                    <div className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-rose-300' : 'text-rose-900'}`}>
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Detail Kendala Satker:</span>
                    </div>
                    <ul className={`text-xs space-y-1 pl-4 list-disc ${isDark ? 'text-rose-200/90' : 'text-rose-800'}`}>
                      {satker.statusCapaianOutput !== 'Sudah Terlaporkan' && (
                        <li className={`font-semibold ${isDark ? 'text-rose-300' : 'text-rose-900'}`}>
                          Capaian Output: Status <span className="underline">{satker.statusCapaianOutput}</span> (Nilai: {satker.indikator.capaianOutput}%)
                        </li>
                      )}
                      {satker.persenPenyerapan < 70 && (
                        <li className="font-medium">
                          Penyerapan Anggaran Lambat: <strong className={isDark ? 'text-amber-300' : 'text-rose-900'}>{satker.persenPenyerapan}%</strong> (Sisa Pagu: {formatRupiah(satker.paguAnggaran - satker.realisasiAnggaran)})
                        </li>
                      )}
                      {satker.indikator.deviasiHal3Dipa < 75 && (
                        <li>
                          Deviasi Hal III DIPA Tinggi (Skor Indikator: {satker.indikator.deviasiHal3Dipa})
                        </li>
                      )}
                      {satker.issues.map((iss, i) => (
                        <li key={i}>{iss}</li>
                      ))}
                    </ul>
                  </div>

                  {/* PIC Info */}
                  <div className={`text-xs border-t pt-3 mb-4 flex flex-wrap items-center justify-between gap-2 ${
                    isDark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <PhoneCall className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                      <span className="font-semibold">{satker.namaPic || 'PIC Keuangan'}</span>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-400'}>({satker.noHpPic || '-'})</span>
                    </div>
                    <div className={`flex items-center gap-1 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{satker.emailPic || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className={`flex items-center gap-2 border-t pt-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <button
                    onClick={() => onSelectSatker(satker)}
                    className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail Indikator</span>
                  </button>

                  <button
                    onClick={() => onOpenReminder(satker)}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Pengingat</span>
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Pagination Control for Red Flags Satkers */}
        <PaginationControl
          currentPage={currentPage}
          totalItems={displayedSatkers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="Satker Red Flag"
          isDark={isDark}
          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        />
      </div>

    </div>
  );
};
