import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  ExternalLink, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  FileDown, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Copy, 
  Check, 
  Send
} from 'lucide-react';
import { 
  DispensasiIKPARecord, 
  DispensasiIKPAStatus, 
  SatkerIKPA, 
  AppTheme, 
  AppUser 
} from '../../types';
import { 
  getLabelJenisDispensasi, 
  getLabelStatusDispensasi, 
  exportDispensasiToExcel, 
  exportDispensasiToPDF 
} from '../../utils/dispensasiExportHelper';
import { AjukanDispensasiModal } from '../dispensasi/AjukanDispensasiModal';
import { UpdateStatusDispensasiModal } from '../dispensasi/UpdateStatusDispensasiModal';

interface DispensasiAdminCsoSectionProps {
  records: DispensasiIKPARecord[];
  satkers: SatkerIKPA[];
  onSaveRecords: (records: DispensasiIKPARecord[]) => void;
  currentUser?: AppUser | null;
  theme?: AppTheme;
  isDashboardActive?: boolean;
  onToggleDashboardActive?: (active: boolean) => void;
}

export const DispensasiAdminCsoSection: React.FC<DispensasiAdminCsoSectionProps> = ({
  records = [],
  satkers = [],
  onSaveRecords,
  currentUser,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterJenis, setFilterJenis] = useState<string>('ALL');
  const [selectedSatkerFilter, setSelectedSatkerFilter] = useState<string>('ALL');

  // Modals
  const [isAjukanModalOpen, setIsAjukanModalOpen] = useState<boolean>(false);
  const [selectedRecordForUpdate, setSelectedRecordForUpdate] = useState<DispensasiIKPARecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        if (filterStatus === 'VERIFIKASI_KPPN') {
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

  // Add new submission by admin from CSO incoming
  const handleAddNewDispensasi = (newRecordData: Omit<DispensasiIKPARecord, 'id' | 'nomorTiket' | 'updatedAt'>) => {
    const today = new Date();
    const yearStr = today.getFullYear();
    const randomSeq = String(records.length + 1).padStart(3, '0');
    const newRecord: DispensasiIKPARecord = {
      ...newRecordData,
      id: `disp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nomorTiket: `DISP-${yearStr}-${randomSeq}`,
      updatedAt: today.toISOString(),
      updatedBy: currentUser?.displayName || 'Admin CSO KPPN'
    };

    const updated = [newRecord, ...records];
    onSaveRecords(updated);
    setIsAjukanModalOpen(false);
  };

  // Update existing record
  const handleUpdateRecord = (updatedRecord: DispensasiIKPARecord) => {
    const updated = records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
    onSaveRecords(updated);
    setSelectedRecordForUpdate(null);
  };

  // Delete record
  const handleDeleteRecord = (id: string, nomorTiket: string) => {
    if (window.confirm(`Yakin ingin menghapus arsip pengajuan ${nomorTiket}?`)) {
      const updated = records.filter(r => r.id !== id);
      onSaveRecords(updated);
    }
  };

  // Inline toggle for the 4 stages
  const handleToggleStage = (
    record: DispensasiIKPARecord, 
    stage: 'kppn' | 'kanwil' | 'kanpus' | 'final'
  ) => {
    let nextStatus = record.status;
    const tahapan = record.checklistTahapan || {};
    const nowStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    if (stage === 'final') {
      nextStatus = record.status === 'DISETUJUI' ? 'DIAJUKAN_PUSAT' : 'DISETUJUI';
    } else if (stage === 'kanpus') {
      nextStatus = record.status === 'DIAJUKAN_PUSAT' ? 'VERIFIKASI_KANWIL' : 'DIAJUKAN_PUSAT';
    } else if (stage === 'kanwil') {
      nextStatus = record.status === 'VERIFIKASI_KANWIL' ? 'VERIFIKASI_KPPN' : 'VERIFIKASI_KANWIL';
    } else if (stage === 'kppn') {
      nextStatus = 'VERIFIKASI_KPPN';
    }

    const isKanwil = nextStatus === 'VERIFIKASI_KANWIL' || nextStatus === 'DIAJUKAN_PUSAT' || nextStatus === 'DISETUJUI' || nextStatus === 'DITOLAK';
    const isKanpus = nextStatus === 'DIAJUKAN_PUSAT' || nextStatus === 'DISETUJUI' || nextStatus === 'DITOLAK';
    const isFinal = nextStatus === 'DISETUJUI' || nextStatus === 'DITOLAK';

    const updatedTahapan = {
      ...tahapan,
      csoDiterima: true,
      kanwilVerifikasi: isKanwil,
      kanwilTanggal: isKanwil ? (tahapan.kanwilTanggal || nowStr) : undefined,
      pusatDiajukan: isKanpus,
      pusatTanggal: isKanpus ? (tahapan.pusatTanggal || nowStr) : undefined,
      keputusanFinal: isFinal,
      keputusanTanggal: isFinal ? (tahapan.keputusanTanggal || nowStr) : undefined
    };

    handleUpdateRecord({
      ...record,
      status: nextStatus,
      checklistTahapan: updatedTahapan,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.displayName || 'Admin KPPN'
    });
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderStatusBadge = (status: DispensasiIKPAStatus) => {
    switch (status) {
      case 'DISETUJUI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Disetujui
          </span>
        );
      case 'VERIFIKASI_KANWIL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Posisi Kanwil
          </span>
        );
      case 'DIAJUKAN_PUSAT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs">
            <Send className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Posisi Kanpus
          </span>
        );
      case 'DITOLAK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 shadow-xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Ditolak
          </span>
        );
      case 'PERBAIKAN_DOKUMEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-300 dark:border-orange-700/60 shadow-xs">
            <AlertCircle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            Perbaikan Dokumen
          </span>
        );
      case 'DIAJUKAN_CSO':
      case 'VERIFIKASI_KPPN':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-700/60 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Diterima KPPN
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className={`p-6 rounded-3xl border ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-slate-800' 
          : 'bg-gradient-to-r from-amber-50 via-orange-50 to-indigo-50 border-amber-200/80'
      } shadow-md`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/40 mb-1">
                <ShieldCheck className="w-3 h-3" />
                MODUL ADMIN SUPER (CONTROL CENTER)
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Monitoring Dispensasi IKPA &amp; Dokumen CSO
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Pengawasan tautan dokumen permohonan dispensasi (KPPN &amp; Kanwil meneruskan berkas, verifikasi keputusan final oleh Kantor Pusat DJPb).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="https://s.id/MonitoringPenyesuaianIKPA"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 cursor-pointer shadow-xs transition-all"
              title="Buka laporan live Google Data Studio DJPb di tab baru"
            >
              <ExternalLink className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Buka s.id/MonitoringPenyesuaianIKPA ↗</span>
            </a>

            <button
              type="button"
              onClick={() => exportDispensasiToExcel(filteredRecords)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-xs transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>

            <button
              type="button"
              onClick={() => exportDispensasiToPDF(filteredRecords, filterStatus !== 'ALL' ? getLabelStatusDispensasi(filterStatus) : 'Semua Status')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-xs transition-all"
            >
              <FileDown className="w-4 h-4 text-rose-600" />
              <span>Ekspor PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAjukanModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-md shadow-indigo-600/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Rekam Pengajuan CSO Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Banner Informasi Link Monitoring DJPb Resmi (s.id/MonitoringPenyesuaianIKPA) */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isDark 
          ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 border-amber-800/40' 
          : 'bg-gradient-to-r from-amber-50/70 via-white to-indigo-50/70 border-amber-200/80'
      } shadow-xs`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                Live Monitoring Penyesuaian IKPA DJPb
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                Google Data Studio DJPb
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kebijakan pemilik laporan Google Data Studio membatasi embed langsung di situs luar. Buka langsung dashboard resmi dengan memilih filter <strong>KPPN: 026 - SEMARANG I</strong>.
            </p>
          </div>
        </div>
        <a
          href="https://s.id/MonitoringPenyesuaianIKPA"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-md shadow-amber-500/20 transition-all shrink-0 cursor-pointer active:scale-95"
          title="Buka laporan s.id/MonitoringPenyesuaianIKPA di tab baru"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Buka s.id/MonitoringPenyesuaianIKPA ↗</span>
        </a>
      </div>

      <div className="space-y-6">
        {/* KPI Cards: 4 Stages */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => setFilterStatus('ALL')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'ALL'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Pengajuan</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-semibold">Semua Permohonan</div>
        </div>

        <div 
          onClick={() => setFilterStatus('VERIFIKASI_KPPN')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'VERIFIKASI_KPPN'
              ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/50 dark:bg-sky-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Diterima KPPN</span>
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-0.5">{stats.diterimaKppn}</div>
          <div className="text-[10px] text-sky-600/80 mt-1 font-semibold">Meneruskan Berkas</div>
        </div>

        <div 
          onClick={() => setFilterStatus('VERIFIKASI_KANWIL')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'VERIFIKASI_KANWIL'
              ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/50 dark:bg-purple-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Posisi Kanwil</span>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{stats.posisiKanwil}</div>
          <div className="text-[10px] text-purple-600/80 mt-1 font-semibold">Meneruskan Rekomendasi</div>
        </div>

        <div 
          onClick={() => setFilterStatus('DIAJUKAN_PUSAT')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'DIAJUKAN_PUSAT'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50 dark:bg-amber-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Send className="w-3.5 h-3.5" />
            <span>Posisi Kanpus</span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{stats.posisiKanpus}</div>
          <div className="text-[10px] text-amber-600/80 mt-1 font-semibold">Verifikasi Kantor Pusat</div>
        </div>

        <div 
          onClick={() => setFilterStatus('DISETUJUI')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'DISETUJUI'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Disetujui</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.disetujui}</div>
          <div className="text-[10px] text-emerald-600/80 mt-1 font-semibold">Disetujui Kantor Pusat</div>
        </div>

        <div 
          onClick={() => setFilterStatus('DITOLAK')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'DITOLAK'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/50 dark:bg-rose-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Ditolak</span>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{stats.ditolak}</div>
          <div className="text-[10px] text-rose-600/80 mt-1 font-semibold">Ditolak Kantor Pusat</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-3.5 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center gap-3 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Satker, Kode (6 digit), Nomor Tiket, No Surat, atau Alasan Dispensasi..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

      {/* Main Monitoring Table */}
      {filteredRecords.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <Scale className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Tidak Ada Berkas Dispensasi Ditemukan
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Belum ada pengajuan dengan filter ini. Anda dapat merekam permohonan baru yang masuk dari CSO KPPN.
          </p>
          <button
            type="button"
            onClick={() => setIsAjukanModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          >
            <Plus className="w-4 h-4" />
            Rekam Pengajuan CSO
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`text-[11px] font-black uppercase tracking-wider ${
              isDark ? 'bg-slate-900 text-slate-400 border-b border-slate-800' : 'bg-slate-100 text-slate-600 border-b border-slate-200'
            }`}>
              <tr>
                <th className="px-3.5 py-3 text-center w-12">No</th>
                <th className="px-3.5 py-3">Tiket &amp; Satker Pemohon</th>
                <th className="px-3.5 py-3">Jenis &amp; Perihal Surat</th>
                <th className="px-3.5 py-3">Link Dokumen CSO (Drive)</th>
                <th className="px-3.5 py-3">Checklist 4 Posisi Tahapan</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800 bg-slate-950' : 'divide-slate-200 bg-white'}`}>
              {filteredRecords.map((record, index) => {
                const isKanwil = record.status === 'VERIFIKASI_KANWIL' || record.status === 'DIAJUKAN_PUSAT' || record.status === 'DISETUJUI' || record.status === 'DITOLAK';
                const isKanpus = record.status === 'DIAJUKAN_PUSAT' || record.status === 'DISETUJUI' || record.status === 'DITOLAK';
                const isFinal = record.status === 'DISETUJUI' || record.status === 'DITOLAK';

                return (
                  <tr 
                    key={record.id}
                    className={`hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors ${
                      record.status === 'DISETUJUI' ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                    }`}
                  >
                    {/* 1. No */}
                    <td className="px-3.5 py-3 text-center font-bold text-slate-500">
                      {index + 1}
                    </td>

                    {/* 2. Tiket & Satker (No phone number) */}
                    <td className="px-3.5 py-3 max-w-[240px]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono font-black text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {record.nomorTiket}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {record.tanggalPengajuan}
                        </span>
                      </div>
                      <div className="font-black text-slate-900 dark:text-white line-clamp-1">
                        {record.namaSatker}
                      </div>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                        Kode: {record.kodeSatker}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {record.kementerianLembaga || '-'}
                      </div>
                    </td>

                    {/* 3. Jenis Dispensasi & Uraian */}
                    <td className="px-3.5 py-3 max-w-[240px]">
                      <span className="inline-block text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 mb-1">
                        {getLabelJenisDispensasi(record.jenisDispensasi)}
                      </span>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        Surat: {record.nomorSurat}
                      </div>
                      <div className="text-[10px] text-slate-500 italic line-clamp-2 mt-0.5" title={record.alasanDispensasi}>
                        &ldquo;{record.alasanDispensasi}&rdquo;
                      </div>
                    </td>

                    {/* 4. Link Dokumen CSO (Drive) */}
                    <td className="px-3.5 py-3 max-w-[200px]">
                      {record.linkDokumenCso ? (
                        <div className="space-y-1.5">
                          <a
                            href={record.linkDokumenCso}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all shadow-xs"
                            title="Buka Dokumen Pengajuan CSO (Google Drive / Cloud Berkas)"
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[120px]">Buka Dokumen CSO</span>
                          </a>

                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(record.linkDokumenCso, record.id)}
                              className="inline-flex items-center gap-1 hover:text-indigo-600 font-semibold"
                            >
                              {copiedId === record.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500">Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Salin Tautan</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Link belum dilampirkan</span>
                      )}
                    </td>

                    {/* 5. Checklist 4 Tahapan: KPPN -> Kanwil -> Kanpus -> Putusan */}
                    <td className="px-3.5 py-3 min-w-[230px]">
                      <div className="space-y-1 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
                        {/* Tahap 1: KPPN */}
                        <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600">
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => handleToggleStage(record, 'kppn')}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            1. Diterima KPPN
                          </span>
                        </label>

                        {/* Tahap 2: Kanwil */}
                        <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600">
                          <input
                            type="checkbox"
                            checked={isKanwil}
                            onChange={() => handleToggleStage(record, 'kanwil')}
                            className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                          />
                          <span className={`font-semibold ${isKanwil ? 'text-purple-700 dark:text-purple-300 font-bold' : 'text-slate-400'}`}>
                            2. Posisi Kanwil DJPb
                          </span>
                        </label>

                        {/* Tahap 3: Kantor Pusat */}
                        <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600">
                          <input
                            type="checkbox"
                            checked={isKanpus}
                            onChange={() => handleToggleStage(record, 'kanpus')}
                            className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                          />
                          <span className={`font-semibold ${isKanpus ? 'text-amber-700 dark:text-amber-300 font-bold' : 'text-slate-400'}`}>
                            3. Posisi Kantor Pusat DJPb
                          </span>
                        </label>

                        {/* Tahap 4: Keputusan Final (Kantor Pusat) */}
                        <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600">
                          <input
                            type="checkbox"
                            checked={isFinal}
                            onChange={() => handleToggleStage(record, 'final')}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                          />
                          <span className={`font-semibold ${isFinal ? (record.status === 'DISETUJUI' ? 'text-emerald-700 dark:text-emerald-300 font-black' : 'text-rose-700 dark:text-rose-300 font-black') : 'text-slate-400'}`}>
                            4. Putusan Akhir ({record.status === 'DISETUJUI' ? 'Disetujui' : record.status === 'DITOLAK' ? 'Ditolak' : 'Proses'})
                          </span>
                        </label>
                      </div>
                    </td>

                    {/* 6. Status Badge */}
                    <td className="px-3.5 py-3 text-center">
                      {renderStatusBadge(record.status)}
                    </td>

                    {/* 7. Action Button */}
                    <td className="px-3.5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedRecordForUpdate(record)}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 transition-colors cursor-pointer"
                          title="Update Status Posisi &amp; Catatan"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(record.id, record.nomorTiket)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-300 transition-colors cursor-pointer"
                          title="Hapus Permohonan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
        </div>

      {/* Modal: Tambah Rekam Pengajuan CSO Baru */}
      <AjukanDispensasiModal
        isOpen={isAjukanModalOpen}
        onClose={() => setIsAjukanModalOpen(false)}
        onSubmit={handleAddNewDispensasi}
        satkers={satkers}
        isDark={isDark}
      />

      {/* Modal: Update Status & Checklist Detail */}
      <UpdateStatusDispensasiModal
        isOpen={!!selectedRecordForUpdate}
        onClose={() => setSelectedRecordForUpdate(null)}
        record={selectedRecordForUpdate}
        onUpdate={handleUpdateRecord}
        isDark={isDark}
      />
    </div>
  );
};
