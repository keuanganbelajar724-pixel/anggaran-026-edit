import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Search, 
  FileSpreadsheet, 
  FileDown, 
  Building2, 
  ShieldCheck, 
  Send, 
  Info, 
  ArrowRight,
  Lock
} from 'lucide-react';
import { 
  DispensasiIKPARecord, 
  DispensasiIKPAStatus, 
  JenisDispensasiIKPA, 
  SatkerIKPA, 
  AppTheme, 
  AppUser 
} from '../types';
import { 
  getLabelJenisDispensasi, 
  getLabelStatusDispensasi, 
  exportDispensasiToExcel, 
  exportDispensasiToPDF 
} from '../utils/dispensasiExportHelper';

interface DispensasiIKPADashboardProps {
  records: DispensasiIKPARecord[];
  satkers: SatkerIKPA[];
  onSaveRecords?: (records: DispensasiIKPARecord[]) => void;
  isAdminAuthenticated?: boolean;
  currentUser?: AppUser | null;
  onGoToAdmin?: () => void;
  theme?: AppTheme;
  isDashboardActive?: boolean;
  onToggleDashboardActive?: (active: boolean) => void;
}

export const DispensasiIKPADashboard: React.FC<DispensasiIKPADashboardProps> = ({
  records = [],
  satkers = [],
  isAdminAuthenticated = false,
  currentUser,
  onGoToAdmin,
  theme = 'light',
  isDashboardActive = true,
  onToggleDashboardActive
}) => {
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterJenis, setFilterJenis] = useState<string>('ALL');
  const [selectedSatkerFilter, setSelectedSatkerFilter] = useState<string>('ALL');

  // Quick stats matching the 4 stages
  const stats = useMemo(() => {
    const total = records.length;
    const disetujui = records.filter(r => r.status === 'DISETUJUI').length;
    const diterimaKppn = records.filter(r => r.status === 'VERIFIKASI_KPPN' || r.status === 'DIAJUKAN_CSO').length;
    const posisiKanwil = records.filter(r => r.status === 'VERIFIKASI_KANWIL').length;
    const posisiKanpus = records.filter(r => r.status === 'DIAJUKAN_PUSAT').length;
    const ditolak = records.filter(r => r.status === 'DITOLAK').length;

    return { total, disetujui, diterimaKppn, posisiKanwil, posisiKanpus, ditolak };
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchQuery = 
          record.namaSatker.toLowerCase().includes(q) ||
          record.kodeSatker.includes(q) ||
          record.nomorTiket.toLowerCase().includes(q) ||
          record.nomorSurat.toLowerCase().includes(q) ||
          (record.alasanDispensasi && record.alasanDispensasi.toLowerCase().includes(q));
        if (!matchQuery) return false;
      }

      if (selectedSatkerFilter !== 'ALL' && record.kodeSatker !== selectedSatkerFilter) {
        return false;
      }

      if (filterStatus !== 'ALL') {
        if (filterStatus === 'PROSES') {
          if (record.status === 'DISETUJUI' || record.status === 'DITOLAK') return false;
        } else if (filterStatus === 'VERIFIKASI_KPPN') {
          if (record.status !== 'VERIFIKASI_KPPN' && record.status !== 'DIAJUKAN_CSO') return false;
        } else if (record.status !== filterStatus) {
          return false;
        }
      }

      if (filterJenis !== 'ALL' && record.jenisDispensasi !== filterJenis) {
        return false;
      }

      return true;
    });
  }, [records, searchQuery, selectedSatkerFilter, filterStatus, filterJenis]);

  // Status badge helper (Clean: Diterima KPPN, Posisi Kanwil, Posisi Kanpus, Disetujui, Ditolak)
  const renderStatusBadge = (status: DispensasiIKPAStatus) => {
    switch (status) {
      case 'DISETUJUI':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Disetujui
          </span>
        );
      case 'VERIFIKASI_KANWIL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Posisi Kanwil
          </span>
        );
      case 'DIAJUKAN_PUSAT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs">
            <Send className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Posisi Kanpus
          </span>
        );
      case 'DITOLAK':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 shadow-xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Ditolak
          </span>
        );
      case 'PERBAIKAN_DOKUMEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-300 dark:border-orange-700/60 shadow-xs">
            <AlertCircle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            Perbaikan Dokumen
          </span>
        );
      case 'DIAJUKAN_CSO':
      case 'VERIFIKASI_KPPN':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-700/60 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Diterima KPPN
          </span>
        );
    }
  };

  // 4 Clean Timeline Steps:
  // 1. Diterima KPPN -> 2. Posisi Kanwil -> 3. Posisi Kanpus -> 4. Disetujui / Ditolak (oleh Kantor Pusat)
  const renderTimelineSteps = (record: DispensasiIKPARecord) => {
    const isKanwilReached = record.status === 'VERIFIKASI_KANWIL' || record.status === 'DIAJUKAN_PUSAT' || record.status === 'DISETUJUI' || record.status === 'DITOLAK';
    const isKanpusReached = record.status === 'DIAJUKAN_PUSAT' || record.status === 'DISETUJUI' || record.status === 'DITOLAK';
    const isFinalDone = record.status === 'DISETUJUI' || record.status === 'DITOLAK';

    const steps = [
      { 
        label: 'Diterima KPPN', 
        done: true, 
        active: record.status === 'DIAJUKAN_CSO' || record.status === 'VERIFIKASI_KPPN'
      },
      { 
        label: 'Posisi Kanwil', 
        done: isKanwilReached, 
        active: record.status === 'VERIFIKASI_KANWIL' 
      },
      { 
        label: 'Posisi Kanpus', 
        done: isKanpusReached, 
        active: record.status === 'DIAJUKAN_PUSAT' 
      },
      { 
        label: record.status === 'DITOLAK' ? 'Ditolak' : 'Disetujui', 
        done: isFinalDone, 
        active: false, 
        isFinal: true, 
        isRejected: record.status === 'DITOLAK' 
      }
    ];

    return (
      <div className="flex items-center gap-1 sm:gap-2 w-full max-w-md py-1">
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center flex-1">
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                  step.done
                    ? step.isRejected
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-emerald-600 text-white shadow-xs'
                    : step.active
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 animate-pulse font-bold'
                      : isDark
                        ? 'bg-slate-800 text-slate-500 border border-slate-700'
                        : 'bg-slate-200 text-slate-500'
                }`}
                title={step.label}
              >
                {step.done ? (
                  step.isRejected ? '✕' : '✓'
                ) : (
                  idx + 1
                )}
              </div>
              <span className={`text-[9px] mt-1 text-center font-bold truncate max-w-[75px] ${
                step.done 
                  ? step.isRejected ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  : step.active 
                    ? 'text-amber-600 dark:text-amber-400 font-extrabold'
                    : 'text-slate-400 dark:text-slate-500'
              }`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-0.5 flex-1 -mt-3.5 ${
                steps[idx + 1].done || step.done
                  ? 'bg-emerald-500 dark:bg-emerald-600'
                  : isDark ? 'bg-slate-800' : 'bg-slate-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Check if Module is Deactivated for Satker
  if (!isAdminAuthenticated && isDashboardActive === false) {
    return (
      <div className={`p-8 sm:p-12 text-center rounded-3xl border shadow-md max-w-xl mx-auto my-12 space-y-5 animate-fadeIn ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            Akses Ditutup Sementara
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Modul Pengajuan Dispensasi IKPA Dinonaktifkan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            Layanan monitoring dispensasi IKPA saat ini sedang dinonaktifkan sementara oleh Admin KPPN Semarang I. Segala permohonan dispensasi dikoordinasikan langsung melalui kanal resmi CSO KPPN.
          </p>
        </div>
        {onGoToAdmin && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onGoToAdmin}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Masuk sebagai Admin KPPN</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Bar: Clean Action Toolbar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800 shadow-md' 
          : 'bg-white border-slate-200/90 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Status Pengajuan Dispensasi IKPA Satker
              </h2>
              {isDashboardActive === false && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                  🔴 Nonaktif di Satker
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Pantau status posisi surat permohonan dispensasi (Diterima KPPN &rarr; Posisi Kanwil &rarr; Posisi Kanpus &rarr; Keputusan Final Kantor Pusat)
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin Toggle for Satker Access */}
          {isAdminAuthenticated && onToggleDashboardActive && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Akses Satker:
              </span>
              <button
                type="button"
                onClick={() => onToggleDashboardActive(!isDashboardActive)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 shadow-2xs ${
                  isDashboardActive !== false
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
                title="Klik untuk mengaktifkan atau menonaktifkan tampilan dashboard untuk Satker"
              >
                <span>{isDashboardActive !== false ? '🟢 Aktif' : '🔴 Nonaktif'}</span>
              </button>
            </div>
          )}

          {isAdminAuthenticated && (
            <button
              type="button"
              onClick={onGoToAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs"
              title="Buka Pusat Kendali Dokumen CSO di Control Admin Super"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Pusat Dokumen CSO (Admin)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => exportDispensasiToExcel(filteredRecords)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs transition-all"
            title="Download Rekap Dispensasi ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={() => exportDispensasiToPDF(filteredRecords, filterStatus !== 'ALL' ? getLabelStatusDispensasi(filterStatus) : 'Semua Status')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs transition-all"
            title="Download Laporan Dispensasi ke PDF (.pdf)"
          >
            <FileDown className="w-3.5 h-3.5 text-rose-600" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: 4 Stages Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <div 
          onClick={() => setFilterStatus('ALL')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'ALL'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Pengajuan</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {stats.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-semibold">Semua Permohonan</div>
        </div>

        <div 
          onClick={() => setFilterStatus('VERIFIKASI_KPPN')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'VERIFIKASI_KPPN'
              ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/50 dark:bg-sky-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Diterima KPPN</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 mt-0.5">
            {stats.diterimaKppn}
          </div>
          <div className="text-[10px] text-sky-600/80 dark:text-sky-400/80 mt-1 font-semibold">Meneruskan Berkas</div>
        </div>

        <div 
          onClick={() => setFilterStatus('VERIFIKASI_KANWIL')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'VERIFIKASI_KANWIL'
              ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/50 dark:bg-purple-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Posisi Kanwil</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
            {stats.posisiKanwil}
          </div>
          <div className="text-[10px] text-purple-600/80 dark:text-purple-400/80 mt-1 font-semibold">Meneruskan Rekomendasi</div>
        </div>

        <div 
          onClick={() => setFilterStatus('DIAJUKAN_PUSAT')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'DIAJUKAN_PUSAT'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50 dark:bg-amber-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Send className="w-3.5 h-3.5" />
            <span>Posisi Kanpus</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
            {stats.posisiKanpus}
          </div>
          <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1 font-semibold">Verifikasi Kantor Pusat</div>
        </div>

        <div 
          onClick={() => setFilterStatus('DISETUJUI')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'DISETUJUI'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Disetujui</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {stats.disetujui}
          </div>
          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-semibold">Disetujui Kantor Pusat</div>
        </div>

        <div 
          onClick={() => setFilterStatus('DITOLAK')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'DITOLAK'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50 dark:bg-rose-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Ditolak</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
            {stats.ditolak}
          </div>
          <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-1 font-semibold">Ditolak Kantor Pusat</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`p-3 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center gap-3 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan Satker, Kode (6 digit), Nomor Tiket, No Surat, atau Alasan Dispensasi..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="VERIFIKASI_KPPN">Diterima KPPN</option>
            <option value="VERIFIKASI_KANWIL">Posisi Kanwil</option>
            <option value="DIAJUKAN_PUSAT">Posisi Kanpus</option>
            <option value="DISETUJUI">Disetujui</option>
            <option value="DITOLAK">Ditolak</option>
            <option value="PERBAIKAN_DOKUMEN">Perbaikan Dokumen</option>
          </select>

          {/* Jenis Filter */}
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Jenis Dispensasi</option>
            <option value="DEVIASI_HAL3">Deviasi Halaman III DIPA</option>
            <option value="DISPENSASI_SPM">Dispensasi SPM Terlambat</option>
            <option value="KONTRAKTUAL">Pendaftaran Data Kontrak</option>
            <option value="CAPAIAN_OUTPUT">Capaian Output</option>
            <option value="UP_TUP">Pengelolaan UP / TUP</option>
            <option value="LAINNYA">Lainnya / Force Majeure</option>
          </select>

          {/* Satker Filter */}
          <select
            value={selectedSatkerFilter}
            onChange={(e) => setSelectedSatkerFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer max-w-[200px] truncate"
          >
            <option value="ALL">Semua Satker ({satkers.length})</option>
            {satkers.map(s => (
              <option key={s.kodeSatker} value={s.kodeSatker}>
                {s.kodeSatker} - {s.namaSatker}
              </option>
            ))}
          </select>

          {(searchQuery || filterStatus !== 'ALL' || filterJenis !== 'ALL' || selectedSatkerFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('ALL');
                setFilterJenis('ALL');
                setSelectedSatkerFilter('ALL');
              }}
              className="text-xs text-rose-500 hover:text-rose-600 font-bold px-2 py-1"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Menampilkan {filteredRecords.length} berkas pengajuan dispensasi
          </span>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-500" />
            <span>KPPN &amp; Kanwil meneruskan berkas. Keputusan persetujuan ditetapkan oleh Kantor Pusat DJPb.</span>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <Scale className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Belum Ada Pengajuan Dispensasi yang Sesuai
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Tidak ada data pengajuan dispensasi dengan filter pencarian ini. Pengajuan baru disampaikan melalui kanal resmi CSO KPPN Semarang I.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecords.map((record) => (
              <div 
                key={record.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                } shadow-xs space-y-3.5`}
              >
                {/* Top Card Info */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {record.nomorTiket}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {record.tanggalPengajuan}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                      {record.namaSatker}
                    </h4>
                    <div className="text-[11px] font-semibold text-slate-500">
                      Kode: <strong className="text-indigo-600 dark:text-indigo-400">{record.kodeSatker}</strong> • {record.kementerianLembaga || '-'}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {renderStatusBadge(record.status)}
                  </div>
                </div>

                {/* Jenis Dispensasi Pill & Nomor Surat */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      {getLabelJenisDispensasi(record.jenisDispensasi)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Surat Satker: <strong>{record.nomorSurat}</strong>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-2">
                    &ldquo;{record.alasanDispensasi}&rdquo;
                  </p>
                </div>

                {/* Visual Timeline Tracker: 4 Tahap */}
                <div className="pt-1">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Progress Posisi &amp; Verifikasi:
                  </div>
                  {renderTimelineSteps(record)}
                </div>

                {/* Catatan Arahan KPPN jika ada */}
                {record.catatanAdmin && (
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200 space-y-0.5">
                    <div className="font-bold flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-blue-500" />
                      <span>Catatan / Keterangan KPPN:</span>
                    </div>
                    <p className="leading-relaxed">{record.catatanAdmin}</p>
                  </div>
                )}

                {/* Footer Info (Satker Code & Status) */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px] sm:max-w-[280px]">
                      {record.namaSatker} ({record.kodeSatker})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    {record.status === 'DISETUJUI' ? 'Persetujuan Selesai' : record.status === 'DITOLAK' ? 'Keputusan Selesai' : 'Dalam Penanganan'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
