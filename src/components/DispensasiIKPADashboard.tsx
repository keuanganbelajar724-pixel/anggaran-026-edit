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
  PlusCircle,
  BookOpen
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
import { getIndikatorDispensasiConfig } from '../data/kriteriaDispensasiData';
import { AjukanDispensasiModal } from './dispensasi/AjukanDispensasiModal';
import { KriteriaND1423Modal } from './dispensasi/KriteriaND1423Modal';

interface DispensasiIKPADashboardProps {
  records: DispensasiIKPARecord[];
  satkers: SatkerIKPA[];
  onSaveRecords?: (records: DispensasiIKPARecord[]) => void;
  isAdminAuthenticated?: boolean;
  currentUser?: AppUser | null;
  onGoToAdmin?: () => void;
  theme?: AppTheme;
}

export const DispensasiIKPADashboard: React.FC<DispensasiIKPADashboardProps> = ({
  records = [],
  satkers = [],
  onSaveRecords,
  isAdminAuthenticated = false,
  currentUser,
  onGoToAdmin,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterJenis, setFilterJenis] = useState<string>('ALL');
  const [selectedSatkerFilter, setSelectedSatkerFilter] = useState<string>('ALL');
  const [isAjukanModalOpen, setIsAjukanModalOpen] = useState<boolean>(false);
  const [isKriteriaModalOpen, setIsKriteriaModalOpen] = useState<boolean>(false);
  const [submissionSuccessToast, setSubmissionSuccessToast] = useState<string | null>(null);

  // Add new submission by Satker or Admin
  const handleAddNewDispensasi = (newRecordData: Omit<DispensasiIKPARecord, 'id' | 'nomorTiket' | 'updatedAt'>) => {
    const today = new Date();
    const yearStr = today.getFullYear();
    const randomSeq = String(records.length + 1).padStart(3, '0');
    const newRecord: DispensasiIKPARecord = {
      ...newRecordData,
      id: `disp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nomorTiket: `DISP-${yearStr}-${randomSeq}`,
      updatedAt: today.toISOString(),
      updatedBy: currentUser?.displayName || (isAdminAuthenticated ? 'Admin CSO KPPN' : `Satker ${newRecordData.kodeSatker}`)
    };

    const updated = [newRecord, ...records];
    if (onSaveRecords) {
      onSaveRecords(updated);
    }
    setIsAjukanModalOpen(false);
    setSubmissionSuccessToast(`Permohonan dispensasi berhasil dikirim dengan Nomor Tiket ${newRecord.nomorTiket}.`);
    setTimeout(() => {
      setSubmissionSuccessToast(null);
    }, 6000);
  };

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
  // 1. Diterima KPPN -> 2. Posisi Kanwil -> 3. Posisi Kanpus -> 4. Disetujui / Ditolak
  const renderTimelineSteps = (record: DispensasiIKPARecord) => {
    const tahapan = record.checklistTahapan || {};
    const isKppn = tahapan.csoDiterima !== undefined 
      ? tahapan.csoDiterima 
      : true;
    const isKanwil = tahapan.kanwilVerifikasi !== undefined 
      ? tahapan.kanwilVerifikasi 
      : (record.status === 'VERIFIKASI_KANWIL' || record.status === 'DIAJUKAN_PUSAT' || record.status === 'DISETUJUI');
    const isKanpus = tahapan.pusatDiajukan !== undefined 
      ? tahapan.pusatDiajukan 
      : (record.status === 'DIAJUKAN_PUSAT' || record.status === 'DISETUJUI');
    const isFinal = tahapan.keputusanFinal !== undefined 
      ? tahapan.keputusanFinal 
      : (record.status === 'DISETUJUI' || record.status === 'DITOLAK');

    const isRejected = record.status === 'DITOLAK';
    const isApproved = record.status === 'DISETUJUI';

    const steps = [
      { 
        label: 'Diterima KPPN', 
        done: isKppn, 
        active: (record.status === 'DIAJUKAN_CSO' || record.status === 'VERIFIKASI_KPPN') && !isRejected && !isApproved
      },
      { 
        label: 'Posisi Kanwil', 
        done: isKanwil, 
        active: record.status === 'VERIFIKASI_KANWIL' && !isRejected && !isApproved
      },
      { 
        label: 'Posisi Kanpus', 
        done: isKanpus, 
        active: record.status === 'DIAJUKAN_PUSAT' && !isRejected && !isApproved
      },
      { 
        label: isRejected ? 'Ditolak' : 'Disetujui', 
        done: isApproved ? true : (isRejected ? isFinal : false), 
        active: false, 
        isFinal: true, 
        isRejected: isRejected 
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
                step.done && (steps[idx + 1].done || steps[idx + 1].active)
                  ? 'bg-emerald-500 dark:bg-emerald-600'
                  : isDark ? 'bg-slate-800' : 'bg-slate-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

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
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Pantau status posisi surat permohonan dispensasi (Diterima KPPN &rarr; Posisi Kanwil &rarr; Posisi Kanpus &rarr; Keputusan Final Kantor Pusat)
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tombol Ajukan Permohonan Dispensasi Baru (Bisa untuk Satker maupun Admin) */}
          <button
            type="button"
            onClick={() => setIsAjukanModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            title="Kirim permohonan dispensasi/penyesuaian IKPA resmi sesuai ND-1423/PB.2/2026"
          >
            <PlusCircle className="w-4 h-4 text-amber-200" />
            <span>Ajukan Dispensasi</span>
          </button>

          {/* Tombol Pedoman Kriteria ND-1423 */}
          <button
            type="button"
            onClick={() => setIsKriteriaModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 cursor-pointer shadow-2xs transition-all"
            title="Pedoman Matriks Kriteria Penyesuaian IKPA (ND-1423/PB.2/2026)"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Kriteria ND-1423 (8 Indikator)</span>
          </button>

          {isAdminAuthenticated && (
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem('kppn_target_admin_tab', 'dispensasi-cso');
                if (onGoToAdmin) onGoToAdmin();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs"
              title="Buka Pusat Kendali Dokumen CSO & Monitoring Admin Super"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Kendali Dokumen CSO (Admin)</span>
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

      {/* Success Notification Alert */}
      {submissionSuccessToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 text-xs shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold">{submissionSuccessToast}</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Surat permohonan Anda telah tercatat di antrean CSO KPPN Semarang I dan dapat dipantau perkembangannya pada tabel di bawah.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmissionSuccessToast(null)}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

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
            <option value="ALL">Semua Jenis Dispensasi (8 Indikator)</option>
            <option value="PENYERAPAN_ANGGARAN">⭐ 3. Penyerapan Anggaran (ND-1423)</option>
            <option value="REVISI_DIPA">1. Revisi DIPA (ND-1423)</option>
            <option value="DEVIASI_HAL3">2. Deviasi Halaman III DIPA</option>
            <option value="KONTRAKTUAL">4. Belanja Kontraktual</option>
            <option value="PENYELESAIAN_TAGIHAN">5. Penyelesaian Tagihan</option>
            <option value="UP_TUP">6. Pengelolaan UP / TUP</option>
            <option value="DISPENSASI_SPM">7. Dispensasi SPM Terlambat</option>
            <option value="CAPAIAN_OUTPUT">8. Capaian Output</option>
            <option value="LAINNYA">9. Lainnya / Force Majeure</option>
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
            {filteredRecords.map((record) => {
              const cfg = getIndikatorDispensasiConfig(record.jenisDispensasi);
              const isDitolak = record.status === 'DITOLAK';
              const isDisetujui = record.status === 'DISETUJUI';

              return (
                <div 
                  key={record.id}
                  className={`rounded-3xl border-2 transition-all overflow-hidden ${cfg.cardBorder} ${cfg.cardBg} shadow-sm hover:shadow-xl hover:-translate-y-0.5 duration-200 flex flex-col`}
                >
                  {/* Top Colored Accent Gradient Bar */}
                  <div className={`h-2.5 w-full bg-gradient-to-r ${cfg.cardGradientBar} shadow-xs`} />

                  {/* Card Content with subtle header tint */}
                  <div className={`p-5 space-y-3.5 flex-1 flex flex-col justify-between ${cfg.cardHeaderBg}`}>
                    <div className="space-y-3.5">
                      {/* Top Card Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${cfg.cardGradientBar} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md mt-0.5 ring-2 ring-white/80 dark:ring-slate-800`}>
                            {cfg.nomor}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-white/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs">
                                {record.nomorTiket}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500">
                                {record.tanggalPengajuan}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1 line-clamp-1">
                              {record.namaSatker}
                            </h4>
                            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              Kode: <strong className="text-indigo-600 dark:text-indigo-400">{record.kodeSatker}</strong> • {record.kementerianLembaga || '-'}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {renderStatusBadge(record.status)}
                        </div>
                      </div>

                      {/* Jenis Dispensasi Pill & Nomor Surat */}
                      <div className={`p-3.5 rounded-2xl ${cfg.innerBoxBg} ${cfg.quoteLeftBorder} space-y-2 text-xs shadow-xs transition-all`}>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[11px] font-black px-3 py-1 rounded-full shadow-xs ${cfg.warnaBadge}`}>
                              {cfg.nomor}. {cfg.nama}
                            </span>
                            {record.kriteriaKode && (
                              <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 shadow-2xs">
                                Kriteria {record.kriteriaKode}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500">
                            Surat: <strong>{record.nomorSurat}</strong> ({record.tanggalSurat})
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-800 dark:text-slate-200 font-medium italic line-clamp-2 leading-relaxed bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-black/5 dark:border-white/5">
                          &ldquo;{record.alasanDispensasi}&rdquo;
                        </p>
                      </div>

                      {/* Visual Timeline Tracker: 4 Tahap */}
                      <div className="pt-1 bg-white/60 dark:bg-slate-900/60 p-3 rounded-2xl border border-black/5 dark:border-white/5 shadow-2xs">
                        <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>Progress Posisi &amp; Verifikasi:</span>
                          {record.status === 'DITOLAK' && (
                            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400">
                              Status: Ditolak
                            </span>
                          )}
                        </div>
                        {renderTimelineSteps(record)}
                      </div>

                      {/* Catatan Arahan KPPN jika ada */}
                      {record.catatanAdmin && (
                        <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-colors shadow-2xs ${
                          isDitolak
                            ? 'bg-rose-50/95 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100 ring-1 ring-rose-400/20'
                            : isDisetujui
                              ? 'bg-emerald-50/95 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-400/20'
                              : 'bg-amber-50/95 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 ring-1 ring-amber-400/20'
                        }`}>
                          <div className="font-extrabold flex items-center gap-1.5">
                            {isDitolak ? (
                              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                            ) : isDisetujui ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            )}
                            <span className="text-[11px] uppercase tracking-wider font-black">
                              {isDitolak ? 'Catatan / Alasan Penolakan KPPN:' : isDisetujui ? 'Catatan / Arahan Persetujuan KPPN:' : 'Catatan / Keterangan KPPN:'}
                            </span>
                          </div>
                          <p className="leading-relaxed pl-5 font-medium">{record.catatanAdmin}</p>
                        </div>
                      )}
                    </div>

                    {/* Footer Info (Satker Code & Status) */}
                    <div className="pt-2.5 mt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className={`w-3.5 h-3.5 ${cfg.accentIconColor} shrink-0`} />
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px] sm:max-w-[280px]">
                          {record.namaSatker} ({record.kodeSatker})
                        </span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        isDisetujui
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isDitolak
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {record.status === 'DISETUJUI' ? 'Persetujuan Selesai' : record.status === 'DITOLAK' ? 'Keputusan Selesai' : 'Dalam Penanganan'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Formulir Pengajuan Permohonan Dispensasi IKPA */}
      <AjukanDispensasiModal
        isOpen={isAjukanModalOpen}
        onClose={() => setIsAjukanModalOpen(false)}
        onSubmit={handleAddNewDispensasi}
        satkers={satkers}
        currentSatkerKode={undefined}
        isDark={isDark}
      />

      {/* Modal: Pedoman Kriteria ND-1423/PB.2/2026 */}
      <KriteriaND1423Modal
        isOpen={isKriteriaModalOpen}
        onClose={() => setIsKriteriaModalOpen(false)}
        isDark={isDark}
      />
    </div>
  );
};
