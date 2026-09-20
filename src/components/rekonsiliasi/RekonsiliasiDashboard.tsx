import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileText,
  History,
  ShieldCheck,
  Building2,
  ChevronDown,
  Info,
  Layers,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  FileCheck,
  AlertCircle,
  Printer,
  MousePointerClick,
  X
} from 'lucide-react';
import {
  MonitoringRekonsiliasiRecord,
  MonitoringRekonsiliasiUploadBatch,
  RekonsiliasiBatchSummary,
  MasterSatker,
  RekonsiliasiAuditLog,
  PrioritasKategoriType
} from '../../types';
import {
  parseMonitoringRekonsiliasiWorkbook,
  formatPeriodeRekonsiliasi,
  generateSampleMonitoringKepatuhanExcel,
  ParseRekonsiliasiResult
} from '../../utils/rekonsiliasiExcelParser';
import {
  exportRekapRekonsiliasiExcel,
  exportRekapRekonsiliasiPDF
} from '../../utils/rekonsiliasiExportHelper';
import { DetailSatkerRekonsiliasiModal } from './DetailSatkerRekonsiliasiModal';
import { RiwayatUploadRekonsiliasiModal } from './RiwayatUploadRekonsiliasiModal';
import { RekonsiliasiAuditLogModal } from './RekonsiliasiAuditLogModal';

interface RekonsiliasiDashboardProps {
  records: MonitoringRekonsiliasiRecord[];
  uploads: MonitoringRekonsiliasiUploadBatch[];
  masterSatkers?: MasterSatker[];
  isAdminAuthenticated: boolean;
  isDark: boolean;
  onUpdateRecords: (
    newRecords: MonitoringRekonsiliasiRecord[],
    newUploads: MonitoringRekonsiliasiUploadBatch[]
  ) => void;
}

export type KpiFilterType =
  | 'ALL'
  | 'REKON_SELESAI'
  | 'REKON_BELUM'
  | 'TODOLIST_SELESAI'
  | 'TODOLIST_BELUM'
  | 'SUDAH_TUTUP'
  | 'BELUM_TUTUP'
  | 'ADA_SP2S'
  | 'ADA_SP3S'
  | 'ADA_DISPENSASI';

export const getKpiFilterLabel = (type: KpiFilterType): string => {
  switch (type) {
    case 'REKON_SELESAI': return 'Rekonsiliasi Selesai (SHR / Sama)';
    case 'REKON_BELUM': return 'Rekonsiliasi Belum Selesai (TDK / Selisih)';
    case 'TODOLIST_SELESAI': return 'Todolist Selesai (Bersih / 0)';
    case 'TODOLIST_BELUM': return 'Todolist Belum Selesai (Masih Ada Data)';
    case 'SUDAH_TUTUP': return 'Sudah Tutup Periode Permanen';
    case 'BELUM_TUTUP': return 'Belum Tutup Periode SAKTI';
    case 'ADA_SP2S': return 'Menerima Surat Peringatan II (SP2S)';
    case 'ADA_SP3S': return 'Menerima Surat Peringatan III (SP3S)';
    case 'ADA_DISPENSASI': return 'Mengajukan Surat Dispensasi';
    default: return 'Semua Satker Terdaftar';
  }
};

export const RekonsiliasiDashboard: React.FC<RekonsiliasiDashboardProps> = ({
  records,
  uploads,
  masterSatkers = [],
  isAdminAuthenticated,
  isDark,
  onUpdateRecords
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Theme styling helpers
  const bgCard = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const bgSubtle = isDark ? 'bg-slate-800/60' : 'bg-slate-50';

  // State: Riwayat audit logs internal
  const [auditLogs, setAuditLogs] = useState<RekonsiliasiAuditLog[]>(() => {
    const saved = localStorage.getItem('kppn_rekonsiliasi_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Error parsing audit logs:', e);
      }
    }
    return [];
  });

  const addAuditLog = (
    aksi: RekonsiliasiAuditLog['aksi'],
    detail: string,
    status: RekonsiliasiAuditLog['status'] = 'SUCCESS',
    periode?: string,
    affectedCount?: number
  ) => {
    const newLog: RekonsiliasiAuditLog = {
      id: `audit-rekon-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user: isAdminAuthenticated ? 'Admin KPPN' : 'Petugas Satker',
      role: isAdminAuthenticated ? 'ADMIN' : 'SATKER',
      aksi,
      detail,
      status,
      periode,
      affectedCount
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev.slice(0, 99)];
      try {
        localStorage.setItem('kppn_rekonsiliasi_audit_logs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // State: Periode aktif (default ke periode terbaru atau "2026-09")
  const availablePeriodes = useMemo(() => {
    const periods = new Set<string>();
    records.forEach(r => {
      if (r.periode) periods.add(r.periode);
    });
    uploads.forEach(u => {
      if (u.periode) periods.add(u.periode);
    });
    if (periods.size === 0) {
      periods.add('2026-09');
    }
    return Array.from(periods).sort().reverse();
  }, [records, uploads]);

  const [selectedPeriode, setSelectedPeriode] = useState<string>(() => {
    return availablePeriodes[0] || '2026-09';
  });

  // Sinkronkan selectedPeriode jika availablePeriodes berubah
  useEffect(() => {
    if (!availablePeriodes.includes(selectedPeriode) && availablePeriodes.length > 0) {
      setSelectedPeriode(availablePeriodes[0]);
    }
  }, [availablePeriodes, selectedPeriode]);

  // Filter records sesuai periode terpilih
  const currentPeriodRecords = useMemo(() => {
    return records.filter(r => r.periode === selectedPeriode);
  }, [records, selectedPeriode]);

  // Cari batch upload aktif untuk periode terpilih
  const currentBatch = useMemo(() => {
    return uploads.find(u => u.periode === selectedPeriode) || uploads[0];
  }, [uploads, selectedPeriode]);

  // Summary Metrics Kalkulasi untuk Periode Terpilih
  const summary: RekonsiliasiBatchSummary = useMemo(() => {
    const res: RekonsiliasiBatchSummary = {
      totalSatker: currentPeriodRecords.length,
      rekonsiliasiSelesai: 0,
      rekonsiliasiBelumSelesai: 0,
      rekonsiliasiUnknown: 0,
      todolistSelesai: 0,
      todolistBelumSelesai: 0,
      todolistUnknown: 0,
      sudahTutupPeriode: 0,
      belumTutupPeriode: 0,
      tutupPeriodeUnknown: 0,
      adaSp2s: 0,
      tidakAdaSp2s: 0,
      adaSp3s: 0,
      belumAdaSp3s: 0,
      adaDispensasi: 0,
      perluTindakan: 0,
      perluPemantauan: 0,
      selesai: 0
    };

    currentPeriodRecords.forEach(r => {
      // Rekonsiliasi
      if (r.rekonsiliasiStatus === 'SELESAI') res.rekonsiliasiSelesai++;
      else if (r.rekonsiliasiStatus === 'BELUM_SELESAI') res.rekonsiliasiBelumSelesai++;
      else res.rekonsiliasiUnknown++;

      // Todolist
      if (r.todolistStatus === 'SELESAI') res.todolistSelesai++;
      else if (r.todolistStatus === 'BELUM_SELESAI') res.todolistBelumSelesai++;
      else res.todolistUnknown++;

      // Tutup Periode
      if (r.tutupPeriodeStatus === 'SUDAH_TUTUP') res.sudahTutupPeriode++;
      else if (r.tutupPeriodeStatus === 'BELUM_TUTUP') res.belumTutupPeriode++;
      else res.tutupPeriodeUnknown++;

      // SP2S
      if (r.sp2sStatus === 'ADA') res.adaSp2s++;
      else res.tidakAdaSp2s++;

      // SP3S
      if (r.sp3sStatus === 'ADA') res.adaSp3s++;
      else res.belumAdaSp3s++;

      // Dispensasi
      if (r.dispensasi && r.dispensasi !== '-') res.adaDispensasi++;

      // Kategori Prioritas
      if (r.prioritasKategori === 'PERLU_TINDAKAN') res.perluTindakan++;
      else if (r.prioritasKategori === 'PERLU_PEMANTAUAN') res.perluPemantauan++;
      else res.selesai++;
    });

    return res;
  }, [currentPeriodRecords]);

  // Filtering State
  const [kpiFilter, setKpiFilter] = useState<KpiFilterType>('ALL');
  const [quickFilter, setQuickFilter] = useState<
    'SEMUA' | 'BELUM_REKON' | 'MASIH_TODOLIST' | 'BELUM_TUTUP' | 'PERLU_TINDAKAN' | 'ADA_DOKUMEN'
  >('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatusSatker, setFilterStatusSatker] = useState('SEMUA');
  const [filterRekonsiliasi, setFilterRekonsiliasi] = useState('SEMUA');
  const [filterTodolist, setFilterTodolist] = useState('SEMUA');
  const [filterTutupPeriode, setFilterTutupPeriode] = useState('SEMUA');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals state
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<MonitoringRekonsiliasiRecord | null>(null);
  const [showRiwayatModal, setShowRiwayatModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showPdfExportModal, setShowPdfExportModal] = useState(false);
  const [uploadNoticeModal, setUploadNoticeModal] = useState<{
    isOpen: boolean;
    title: string;
    batch?: MonitoringRekonsiliasiUploadBatch;
    message?: string;
    isError?: boolean;
  }>({ isOpen: false, title: '' });

  // Filtered Records calculation
  const filteredRecords = useMemo(() => {
    return currentPeriodRecords.filter(r => {
      // 0. KPI Interactive Card Filter
      if (kpiFilter === 'REKON_SELESAI' && r.rekonsiliasiStatus !== 'SELESAI') return false;
      if (kpiFilter === 'REKON_BELUM' && r.rekonsiliasiStatus !== 'BELUM_SELESAI') return false;
      if (kpiFilter === 'TODOLIST_SELESAI' && r.todolistStatus !== 'SELESAI') return false;
      if (kpiFilter === 'TODOLIST_BELUM' && r.todolistStatus !== 'BELUM_SELESAI') return false;
      if (kpiFilter === 'SUDAH_TUTUP' && r.tutupPeriodeStatus !== 'SUDAH_TUTUP') return false;
      if (kpiFilter === 'BELUM_TUTUP' && r.tutupPeriodeStatus !== 'BELUM_TUTUP') return false;
      if (kpiFilter === 'ADA_SP2S' && r.sp2sStatus !== 'ADA') return false;
      if (kpiFilter === 'ADA_SP3S' && r.sp3sStatus !== 'ADA') return false;
      if (kpiFilter === 'ADA_DISPENSASI' && (!r.dispensasi || r.dispensasi === '-')) return false;

      // 1. Quick Filter Pills
      if (quickFilter === 'BELUM_REKON' && r.rekonsiliasiStatus !== 'BELUM_SELESAI') return false;
      if (quickFilter === 'MASIH_TODOLIST' && r.todolistStatus !== 'BELUM_SELESAI') return false;
      if (quickFilter === 'BELUM_TUTUP' && r.tutupPeriodeStatus !== 'BELUM_TUTUP') return false;
      if (quickFilter === 'PERLU_TINDAKAN' && r.prioritasKategori !== 'PERLU_TINDAKAN') return false;
      if (quickFilter === 'ADA_DOKUMEN' && r.sp2sStatus !== 'ADA' && r.sp3sStatus !== 'ADA' && r.dispensasi === '-') return false;

      // 2. Status Satker filter
      if (filterStatusSatker !== 'SEMUA') {
        if (r.statusSatker.toUpperCase() !== filterStatusSatker) return false;
      }

      // 3. Rekonsiliasi dropdown filter
      if (filterRekonsiliasi !== 'SEMUA') {
        if (filterRekonsiliasi === 'SELESAI' && r.rekonsiliasiStatus !== 'SELESAI') return false;
        if (filterRekonsiliasi === 'BELUM_SELESAI' && r.rekonsiliasiStatus !== 'BELUM_SELESAI') return false;
        if (filterRekonsiliasi === 'UNKNOWN' && r.rekonsiliasiStatus !== 'UNKNOWN') return false;
      }

      // 4. Todolist dropdown filter
      if (filterTodolist !== 'SEMUA') {
        if (filterTodolist === 'SELESAI' && r.todolistStatus !== 'SELESAI') return false;
        if (filterTodolist === 'BELUM_SELESAI' && r.todolistStatus !== 'BELUM_SELESAI') return false;
        if (filterTodolist === 'UNKNOWN' && r.todolistStatus !== 'UNKNOWN') return false;
      }

      // 5. Tutup Periode dropdown filter
      if (filterTutupPeriode !== 'SEMUA') {
        if (filterTutupPeriode === 'BELUM_TUTUP' && r.tutupPeriodeStatus !== 'BELUM_TUTUP') return false;
        if (filterTutupPeriode === 'SUDAH_TUTUP' && r.tutupPeriodeStatus !== 'SUDAH_TUTUP') return false;
      }

      // 6. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchKode = r.kodeSatker.toLowerCase().includes(q);
        const matchNama = r.namaSatker.toLowerCase().includes(q);
        const matchNoKppn = r.noKppnSatker.toLowerCase().includes(q);
        const matchKppn = r.kodeKppn.toLowerCase().includes(q);
        const matchSp2s = r.sp2sNomor.toLowerCase().includes(q);
        const matchSp3s = r.sp3sNomor.toLowerCase().includes(q);
        if (!matchKode && !matchNama && !matchNoKppn && !matchKppn && !matchSp2s && !matchSp3s) {
          return false;
        }
      }

      return true;
    });
  }, [
    currentPeriodRecords,
    kpiFilter,
    quickFilter,
    filterStatusSatker,
    filterRekonsiliasi,
    filterTodolist,
    filterTutupPeriode,
    searchQuery
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [kpiFilter, quickFilter, searchQuery, filterStatusSatker, filterRekonsiliasi, filterTodolist, filterTutupPeriode, selectedPeriode]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;

  // Handler: Upload File Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input agar bisa upload file yang sama jika diinginkan
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const parseResult = parseMonitoringRekonsiliasiWorkbook(
          workbook,
          file.name,
          isAdminAuthenticated ? 'Admin KPPN' : 'User ANGKASA'
        );

        // Pertahankan records dari periode lain, perbarui/tambahkan records periode ini
        const otherPeriodRecords = records.filter(r => r.periode !== parseResult.batch.periode);
        const newRecords = [...parseResult.records, ...otherPeriodRecords];

        // Perbarui batch uploads (replace jika ada batch periode yang sama atau prepend)
        const otherUploads = uploads.filter(u => u.periode !== parseResult.batch.periode);
        const newUploads = [parseResult.batch, ...otherUploads];

        onUpdateRecords(newRecords, newUploads);
        setSelectedPeriode(parseResult.batch.periode);

        addAuditLog(
          'IMPORT_SUCCESS',
          `Berhasil impor file "${file.name}" dengan ${parseResult.records.length} data Satker periode ${parseResult.batch.periode}.`,
          'SUCCESS',
          parseResult.batch.periode,
          parseResult.records.length
        );

        setUploadNoticeModal({
          isOpen: true,
          title: 'Upload Monitoring Kepatuhan Berhasil',
          batch: parseResult.batch,
          isError: false
        });
      } catch (err: any) {
        console.error('Error parsing Excel Rekonsiliasi:', err);
        const errorMessage = err?.message || 'Terjadi kesalahan saat memproses file Excel.';

        addAuditLog(
          'IMPORT_FAILED',
          `Gagal impor file "${file.name}": ${errorMessage}`,
          'ERROR'
        );

        setUploadNoticeModal({
          isOpen: true,
          title: 'Gagal Membaca File Excel',
          message: errorMessage,
          isError: true
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handler: Muat Data Uji Contoh 127 Satker Langsung (Acceptance Test Verification)
  const handleLoadSampleTestData = () => {
    try {
      const sampleExcelBytes = generateSampleMonitoringKepatuhanExcel(masterSatkers);
      const workbook = XLSX.read(sampleExcelBytes, { type: 'array' });
      const parseResult = parseMonitoringRekonsiliasiWorkbook(
        workbook,
        'Monitoring Kepatuhan Satker_2026-09-20 06-38.xlsx',
        'Data Uji Sistem'
      );

      const otherPeriodRecords = records.filter(r => r.periode !== parseResult.batch.periode);
      const newRecords = [...parseResult.records, ...otherPeriodRecords];
      const otherUploads = uploads.filter(u => u.periode !== parseResult.batch.periode);
      const newUploads = [parseResult.batch, ...otherUploads];

      onUpdateRecords(newRecords, newUploads);
      setSelectedPeriode(parseResult.batch.periode);

      addAuditLog(
        'IMPORT_SUCCESS',
        'Memuat data uji contoh 127 Satker (Acceptance Test) periode 2026-09.',
        'SUCCESS',
        '2026-09',
        127
      );

      setUploadNoticeModal({
        isOpen: true,
        title: 'Data Uji Contoh 127 Satker Berhasil Dimuat',
        batch: parseResult.batch,
        isError: false
      });
    } catch (err: any) {
      console.error('Error loading sample test data:', err);
      alert('Gagal memuat data uji contoh: ' + (err?.message || 'Unknown error'));
    }
  };

  // Handler: Unduh File Contoh Excel Asli
  const handleDownloadSampleExcel = () => {
    const sampleExcelBytes = generateSampleMonitoringKepatuhanExcel(masterSatkers);
    const blob = new Blob([sampleExcelBytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Monitoring Kepatuhan Satker_2026-09-20 06-38.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addAuditLog('EXPORT', 'Mengunduh file template/contoh "Monitoring Kepatuhan Satker_2026-09-20 06-38.xlsx"');
  };

  // Handler: Delete batch
  const handleDeleteBatch = (batchId: string) => {
    const targetBatch = uploads.find(u => u.id === batchId);
    if (!targetBatch) return;

    const remainingUploads = uploads.filter(u => u.id !== batchId);
    const remainingRecords = records.filter(r => r.uploadId !== batchId && r.periode !== targetBatch.periode);

    onUpdateRecords(remainingRecords, remainingUploads);

    addAuditLog(
      'DELETE_BATCH',
      `Menghapus batch upload "${targetBatch.filename}" periode ${targetBatch.periode}.`,
      'WARNING',
      targetBatch.periode,
      targetBatch.jumlahData
    );

    if (remainingUploads.length > 0) {
      setSelectedPeriode(remainingUploads[0].periode);
    }
  };

  // Find PIC helper from masterSatkers
  const getPicForSatker = (kodeSatker: string) => {
    return masterSatkers.find(m => m.kodeSatker === kodeSatker);
  };

  // Toggle KPI card filter
  const handleToggleKpiFilter = (type: KpiFilterType) => {
    setKpiFilter(prev => (prev === type ? 'ALL' : type));
  };

  // Export Active Filter to PDF
  const handleExportActivePDF = () => {
    let title = 'REKAPITULASI MONITORING KEPATUHAN SATKER';
    let filterLabel = 'Semua Satker Terdaftar';
    let themeColor: [number, number, number] = [37, 99, 235]; // Blue
    let filenamePrefix = 'Rekap-Rekonsiliasi';

    if (kpiFilter === 'REKON_BELUM') {
      title = 'DAFTAR SATKER BELUM SELESAI REKONSILIASI';
      filterLabel = 'Status Rekonsiliasi: Belum Selesai (TDK / Selisih)';
      themeColor = [225, 29, 72];
      filenamePrefix = 'Satker-Belum-Rekonsiliasi';
    } else if (kpiFilter === 'REKON_SELESAI') {
      title = 'DAFTAR SATKER REKONSILIASI SELESAI (SHR / SAMA)';
      filterLabel = 'Status Rekonsiliasi: Selesai';
      themeColor = [16, 185, 129];
      filenamePrefix = 'Satker-Rekon-Selesai';
    } else if (kpiFilter === 'TODOLIST_BELUM') {
      title = 'DAFTAR SATKER DENGAN TODOLIST BELUM SELESAI';
      filterLabel = 'Status Todolist: Masih Ada Data Belum Diselesaikan';
      themeColor = [225, 29, 72];
      filenamePrefix = 'Satker-Todolist-Belum';
    } else if (kpiFilter === 'TODOLIST_SELESAI') {
      title = 'DAFTAR SATKER TODOLIST SELESAI (BERSIH)';
      filterLabel = 'Status Todolist: Bersih (0 Data)';
      themeColor = [16, 185, 129];
      filenamePrefix = 'Satker-Todolist-Selesai';
    } else if (kpiFilter === 'BELUM_TUTUP') {
      title = 'DAFTAR SATKER BELUM TUTUP PERIODE SAKTI';
      filterLabel = 'Status Tutup Periode: Belum Tutup Permanen';
      themeColor = [217, 119, 6];
      filenamePrefix = 'Satker-Belum-Tutup-Periode';
    } else if (kpiFilter === 'SUDAH_TUTUP') {
      title = 'DAFTAR SATKER SUDAH TUTUP PERIODE SAKTI';
      filterLabel = 'Status Tutup Periode: Sudah Tutup Permanen';
      themeColor = [16, 185, 129];
      filenamePrefix = 'Satker-Sudah-Tutup-Periode';
    } else if (kpiFilter === 'ADA_SP2S') {
      title = 'DAFTAR SATKER PENERIMA SURAT PERINGATAN II (SP2S)';
      filterLabel = 'Dokumen: Ada Surat Peringatan II (SP2S)';
      themeColor = [79, 70, 229];
      filenamePrefix = 'Satker-Penerima-SP2S';
    } else if (kpiFilter === 'ADA_SP3S') {
      title = 'DAFTAR SATKER PENERIMA SURAT PERINGATAN III (SP3S)';
      filterLabel = 'Dokumen: Ada Surat Peringatan III (SP3S)';
      themeColor = [147, 51, 234];
      filenamePrefix = 'Satker-Penerima-SP3S';
    } else if (kpiFilter === 'ADA_DISPENSASI') {
      title = 'DAFTAR SATKER PENGAJUAN SURAT DISPENSASI';
      filterLabel = 'Dokumen: Ada Surat Dispensasi';
      themeColor = [8, 145, 178];
      filenamePrefix = 'Satker-Dispensasi';
    }

    exportRekapRekonsiliasiPDF(filteredRecords, summary, selectedPeriode, {
      customTitle: title,
      filterLabel: `${filterLabel} (Total ${filteredRecords.length} Satker)`,
      themeColor,
      filenamePrefix
    });

    addAuditLog('EXPORT', `Mengekspor PDF data aktif (${filteredRecords.length} Satker) filter: ${getKpiFilterLabel(kpiFilter)}`);
  };

  // Export Specific Category to PDF
  const handleExportSpecificCategoryPDF = (type: KpiFilterType | 'PERLU_TINDAKAN') => {
    let targetRecords: MonitoringRekonsiliasiRecord[] = [];
    let title = '';
    let filterLabel = '';
    let themeColor: [number, number, number] = [37, 99, 235];
    let filenamePrefix = 'Rekap';

    switch (type) {
      case 'REKON_BELUM':
        targetRecords = currentPeriodRecords.filter(r => r.rekonsiliasiStatus === 'BELUM_SELESAI');
        title = 'DAFTAR SATKER BELUM SELESAI REKONSILIASI';
        filterLabel = `Status Rekon: Belum Selesai (TDK / Selisih) | Total: ${targetRecords.length} Satker`;
        themeColor = [225, 29, 72];
        filenamePrefix = 'Satker-Belum-Rekon';
        break;
      case 'REKON_SELESAI':
        targetRecords = currentPeriodRecords.filter(r => r.rekonsiliasiStatus === 'SELESAI');
        title = 'DAFTAR SATKER REKONSILIASI SELESAI';
        filterLabel = `Status Rekon: Selesai (SHR / Sama) | Total: ${targetRecords.length} Satker`;
        themeColor = [16, 185, 129];
        filenamePrefix = 'Satker-Rekon-Selesai';
        break;
      case 'TODOLIST_BELUM':
        targetRecords = currentPeriodRecords.filter(r => r.todolistStatus === 'BELUM_SELESAI');
        title = 'DAFTAR SATKER DENGAN TODOLIST BELUM SELESAI';
        filterLabel = `Status Todolist: Masih Ada Data | Total: ${targetRecords.length} Satker`;
        themeColor = [225, 29, 72];
        filenamePrefix = 'Satker-Todolist-Belum';
        break;
      case 'TODOLIST_SELESAI':
        targetRecords = currentPeriodRecords.filter(r => r.todolistStatus === 'SELESAI');
        title = 'DAFTAR SATKER TODOLIST SELESAI (BERSIH)';
        filterLabel = `Status Todolist: Bersih (0 Data) | Total: ${targetRecords.length} Satker`;
        themeColor = [16, 185, 129];
        filenamePrefix = 'Satker-Todolist-Selesai';
        break;
      case 'BELUM_TUTUP':
        targetRecords = currentPeriodRecords.filter(r => r.tutupPeriodeStatus === 'BELUM_TUTUP');
        title = 'DAFTAR SATKER BELUM TUTUP PERIODE SAKTI';
        filterLabel = `Status: Belum Tutup Permanen | Total: ${targetRecords.length} Satker`;
        themeColor = [217, 119, 6];
        filenamePrefix = 'Satker-Belum-Tutup-Periode';
        break;
      case 'SUDAH_TUTUP':
        targetRecords = currentPeriodRecords.filter(r => r.tutupPeriodeStatus === 'SUDAH_TUTUP');
        title = 'DAFTAR SATKER SUDAH TUTUP PERIODE SAKTI';
        filterLabel = `Status: Sudah Tutup Permanen | Total: ${targetRecords.length} Satker`;
        themeColor = [16, 185, 129];
        filenamePrefix = 'Satker-Sudah-Tutup-Periode';
        break;
      case 'ADA_SP2S':
        targetRecords = currentPeriodRecords.filter(r => r.sp2sStatus === 'ADA');
        title = 'DAFTAR SATKER PENERIMA SURAT PERINGATAN II (SP2S)';
        filterLabel = `Dokumen: Ada SP2S | Total: ${targetRecords.length} Satker`;
        themeColor = [79, 70, 229];
        filenamePrefix = 'Satker-Penerima-SP2S';
        break;
      case 'ADA_SP3S':
        targetRecords = currentPeriodRecords.filter(r => r.sp3sStatus === 'ADA');
        title = 'DAFTAR SATKER PENERIMA SURAT PERINGATAN III (SP3S)';
        filterLabel = `Dokumen: Ada SP3S | Total: ${targetRecords.length} Satker`;
        themeColor = [147, 51, 234];
        filenamePrefix = 'Satker-Penerima-SP3S';
        break;
      case 'ADA_DISPENSASI':
        targetRecords = currentPeriodRecords.filter(r => r.dispensasi && r.dispensasi !== '-');
        title = 'DAFTAR SATKER DENGAN SURAT DISPENSASI';
        filterLabel = `Dokumen: Ada Dispensasi | Total: ${targetRecords.length} Satker`;
        themeColor = [8, 145, 178];
        filenamePrefix = 'Satker-Dispensasi';
        break;
      case 'PERLU_TINDAKAN':
        targetRecords = currentPeriodRecords.filter(r => r.prioritasKategori === 'PERLU_TINDAKAN');
        title = 'DAFTAR SATKER PRIORITAS PERLU TINDAK LANJUT SEGERA';
        filterLabel = `Prioritas: Perlu Tindakan Segera | Total: ${targetRecords.length} Satker`;
        themeColor = [225, 29, 72];
        filenamePrefix = 'Satker-Perlu-Tindakan';
        break;
      default:
        targetRecords = currentPeriodRecords;
        title = 'REKAPITULASI MONITORING KEPATUHAN SATKER';
        filterLabel = `Seluruh Satker Terdaftar | Total: ${targetRecords.length} Satker`;
        themeColor = [37, 99, 235];
        filenamePrefix = 'Rekap-Seluruh-Satker';
        break;
    }

    exportRekapRekonsiliasiPDF(targetRecords, summary, selectedPeriode, {
      customTitle: title,
      filterLabel,
      themeColor,
      filenamePrefix
    });

    addAuditLog('EXPORT', `Mengekspor PDF kategori "${title}" (${targetRecords.length} Satker)`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className={`p-6 rounded-2xl border ${bgCard} shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4`}>
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                📊 Rekonsiliasi & Kepatuhan Satker
              </h2>
              {/* Periode Switcher Dropdown */}
              <div className="relative inline-flex items-center">
                <select
                  value={selectedPeriode}
                  onChange={(e) => setSelectedPeriode(e.target.value)}
                  className={`pl-3 pr-8 py-1 rounded-lg font-bold text-xs border appearance-none cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-blue-400'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}
                >
                  {availablePeriodes.map((p) => (
                    <option key={p} value={p}>
                      Periode: {formatPeriodeRekonsiliasi(p)} ({p})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 pointer-events-none text-blue-500" />
              </div>
            </div>
            <p className={`text-xs ${textMuted} mt-1 flex items-center gap-2 flex-wrap`}>
              <span>Monitoring kepatuhan Satker berbasis SAKTI KPPN Semarang I</span>
              {currentBatch && (
                <>
                  <span>•</span>
                  <span>File: <strong>{currentBatch.filename}</strong></span>
                  <span>•</span>
                  <span>Update: {new Date(currentBatch.uploadedAt).toLocaleString('id-ID')}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Header Action Buttons: PDF Export with filters, Excel, Riwayat & Audit */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tombol Utama: Cetak PDF Rekap Kepatuhan */}
          <button
            onClick={() => setShowPdfExportModal(true)}
            disabled={currentPeriodRecords.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            title="Cetak Laporan PDF Sesuai Kriteria Filter atau Kategori Spesifik"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF Sesuai Filter...</span>
          </button>

          {/* Export Rekap Multi-Sheet Excel */}
          <button
            onClick={() => exportRekapRekonsiliasiExcel(currentPeriodRecords, summary, selectedPeriode)}
            disabled={currentPeriodRecords.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors"
            title="Export Rekap Multi-Sheet Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </button>

          {/* Muat Data Contoh / Acceptance Test */}
          <button
            onClick={handleLoadSampleTestData}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isDark
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
            }`}
            title="Muat 127 Satker sesuai contoh file (91 Rekon Selesai, 36 Belum, 63 Todolist Selesai, 64 Belum)"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Data Contoh (127)</span>
            <span className="sm:hidden">Contoh</span>
          </button>

          {/* Unduh Template / File Contoh */}
          <button
            onClick={handleDownloadSampleExcel}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isDark
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
            }`}
            title="Unduh file Excel asli contoh Monitoring Kepatuhan Satker"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unduh Contoh Excel</span>
          </button>

          {/* Riwayat Batch */}
          <button
            onClick={() => setShowRiwayatModal(true)}
            className={`p-2 rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'
            }`}
            title="Riwayat Batch Upload"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Audit Log */}
          <button
            onClick={() => setShowAuditModal(true)}
            className={`p-2 rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'
            }`}
            title="Log Audit Aktivitas"
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </button>
        </div>
      </div>

      {/* Ringkasan KPI Dashboard (10 Matriks Kepatuhan) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            Ringkasan Indikator Kepatuhan ({formatPeriodeRekonsiliasi(selectedPeriode)})
          </h3>
          <span className={`text-xs ${textMuted}`}>
            Total Terdaftar: <strong>{summary.totalSatker} Satker</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {/* 1. Total Satker */}
          <button
            type="button"
            onClick={() => handleToggleKpiFilter('ALL')}
            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${
              kpiFilter === 'ALL'
                ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/70 dark:bg-blue-950/50 shadow-sm'
                : `${bgCard} hover:border-blue-300 dark:hover:border-blue-800`
            }`}
            title="Klik untuk menampilkan seluruh Satker"
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${textMuted}`}>Total Satker</span>
              <MousePointerClick className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-black mt-1 text-blue-600 dark:text-blue-400">
              {summary.totalSatker}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className={`text-[11px] ${textMuted}`}>Satker Terdata</span>
              {kpiFilter === 'ALL' && (
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">
                  Aktif
                </span>
              )}
            </div>
          </button>

          {/* 2. Rekonsiliasi Selesai */}
          <button
            type="button"
            onClick={() => handleToggleKpiFilter('REKON_SELESAI')}
            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${
              kpiFilter === 'REKON_SELESAI'
                ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/50 shadow-sm'
                : `${bgCard} hover:border-emerald-300 dark:hover:border-emerald-800`
            }`}
            title="Klik untuk memfilter: Rekonsiliasi Selesai (SHR)"
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${textMuted}`}>Rekon Selesai</span>
              <MousePointerClick className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
              {summary.rekonsiliasiSelesai}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className={`text-[11px] ${textMuted}`}>
                {summary.totalSatker ? `${((summary.rekonsiliasiSelesai / summary.totalSatker) * 100).toFixed(1)}%` : '0%'}
              </span>
              {kpiFilter === 'REKON_SELESAI' ? (
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                  Aktif
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 font-semibold opacity-0 group-hover:opacity-100">
                  Filter
                </span>
              )}
            </div>
          </button>

          {/* 3. Rekonsiliasi Belum Selesai */}
          <button
            type="button"
            onClick={() => handleToggleKpiFilter('REKON_BELUM')}
            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${
              kpiFilter === 'REKON_BELUM'
                ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/70 dark:bg-rose-950/50 shadow-sm'
                : `${bgCard} hover:border-rose-300 dark:hover:border-rose-800`
            }`}
            title="Klik untuk memfilter: Rekonsiliasi Belum Selesai (TDK / Selisih)"
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${textMuted}`}>Rekon Belum</span>
              <MousePointerClick className="w-3.5 h-3.5 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-black mt-1 text-rose-600 dark:text-rose-400">
              {summary.rekonsiliasiBelumSelesai}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className={`text-[11px] ${textMuted}`}>
                {summary.totalSatker ? `${((summary.rekonsiliasiBelumSelesai / summary.totalSatker) * 100).toFixed(1)}%` : '0%'}
              </span>
              {kpiFilter === 'REKON_BELUM' ? (
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded">
                  Aktif
                </span>
              ) : (
                <span className="text-[10px] text-rose-600 font-semibold opacity-0 group-hover:opacity-100">
                  Filter
                </span>
              )}
            </div>
          </button>

          {/* 4. Todolist Selesai */}
          <button
            type="button"
            onClick={() => handleToggleKpiFilter('TODOLIST_SELESAI')}
            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${
              kpiFilter === 'TODOLIST_SELESAI'
                ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/50 shadow-sm'
                : `${bgCard} hover:border-emerald-300 dark:hover:border-emerald-800`
            }`}
            title="Klik untuk memfilter: Todolist Selesai (0 Data)"
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${textMuted}`}>Todolist Selesai</span>
              <MousePointerClick className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
              {summary.todolistSelesai}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className={`text-[11px] ${textMuted}`}>
                {summary.totalSatker ? `${((summary.todolistSelesai / summary.totalSatker) * 100).toFixed(1)}%` : '0%'}
              </span>
              {kpiFilter === 'TODOLIST_SELESAI' ? (
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                  Aktif
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 font-semibold opacity-0 group-hover:opacity-100">
                  Filter
                </span>
              )}
            </div>
          </button>

          {/* 5. Todolist Belum Selesai */}
          <button
            type="button"
            onClick={() => handleToggleKpiFilter('TODOLIST_BELUM')}
            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${
              kpiFilter === 'TODOLIST_BELUM'
                ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/70 dark:bg-rose-950/50 shadow-sm'
                : `${bgCard} hover:border-rose-300 dark:hover:border-rose-800`
            }`}
            title="Klik untuk memfilter: Todolist Belum Selesai (Masih Ada Data)"
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${textMuted}`}>Todolist Belum</span>
              <MousePointerClick className="w-3.5 h-3.5 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-black mt-1 text-rose-600 dark:text-rose-400">
              {summary.todolistBelumSelesai}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className={`text-[11px] ${textMuted}`}>
                {summary.totalSatker ? `${((summary.todolistBelumSelesai / summary.totalSatker) * 100).toFixed(1)}%` : '0%'}
              </span>
              {kpiFilter === 'TODOLIST_BELUM' ? (
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded">
                  Aktif
                </span>
              ) : (
                <span className="text-[10px] text-rose-600 font-semibold opacity-0 group-hover:opacity-100">
                  Filter
                </span>
              )}
            </div>
          </button>

          {/* 6. Sudah Tutup Periode */}
          <button
            type="button"
            onClick={() => handleToggleKpiFilter('SUDAH_TUTUP')}
            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${
              kpiFilter === 'SUDAH_TUTUP'
                ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/50 shadow-sm'
                : `${bgCard} hover:border-emerald-300 dark:hover:border-emerald-800`
            }`}
            title="Klik untuk memfilter: Sudah Tutup Periode Permanen"
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${textMuted}`}>Sudah Tutup</span>
              <MousePointerClick className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
              {summary.sudahTutupPeriode}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className={`text-[11px] ${textMuted}`}>Tutup Permanen</span>
              {kpiFilter === 'SUDAH_TUTUP' ? (
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                  Aktif
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 font-semibold opacity-0 group-hover:opacity-100">
                  Filter
                </span>
              )}
            </div>
          </button>

          {/* 7. Belum Tutup Periode */}
          <button
            type="button"
            onClick={() => handleToggleKpiFilter('BELUM_TUTUP')}
            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${
              kpiFilter === 'BELUM_TUTUP'
                ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/70 dark:bg-amber-950/50 shadow-sm'
                : `${bgCard} hover:border-amber-300 dark:hover:border-amber-800`
            }`}
            title="Klik untuk memfilter: Belum Tutup Periode"
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${textMuted}`}>Belum Tutup</span>
              <MousePointerClick className="w-3.5 h-3.5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-black mt-1 text-amber-600 dark:text-amber-400">
              {summary.belumTutupPeriode}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className={`text-[11px] ${textMuted}`}>Belum Tutup</span>
              {kpiFilter === 'BELUM_TUTUP' ? (
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                  Aktif
                </span>
              ) : (
                <span className="text-[10px] text-amber-600 font-semibold opacity-0 group-hover:opacity-100">
                  Filter
                </span>
              )}
            </div>
          </button>

          {/* 8. Ada SP2S */}
          <button
            type="button"
            onClick={() => handleToggleKpiFilter('ADA_SP2S')}
            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${
              kpiFilter === 'ADA_SP2S'
                ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-sm'
                : `${bgCard} hover:border-indigo-300 dark:hover:border-indigo-800`
            }`}
            title="Klik untuk memfilter: Ada Surat Peringatan II (SP2S)"
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${textMuted}`}>Ada SP2S</span>
              <MousePointerClick className="w-3.5 h-3.5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-black mt-1 text-indigo-600 dark:text-indigo-400">
              {summary.adaSp2s}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className={`text-[11px] ${textMuted}`}>Peringatan II</span>
              {kpiFilter === 'ADA_SP2S' ? (
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded">
                  Aktif
                </span>
              ) : (
                <span className="text-[10px] text-indigo-600 font-semibold opacity-0 group-hover:opacity-100">
                  Filter
                </span>
              )}
            </div>
          </button>

          {/* 9. Ada SP3S */}
          <button
            type="button"
            onClick={() => handleToggleKpiFilter('ADA_SP3S')}
            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${
              kpiFilter === 'ADA_SP3S'
                ? 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-50/70 dark:bg-purple-950/50 shadow-sm'
                : `${bgCard} hover:border-purple-300 dark:hover:border-purple-800`
            }`}
            title="Klik untuk memfilter: Ada Surat Peringatan III (SP3S)"
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${textMuted}`}>Ada SP3S</span>
              <MousePointerClick className="w-3.5 h-3.5 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-black mt-1 text-purple-600 dark:text-purple-400">
              {summary.adaSp3s}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className={`text-[11px] ${textMuted}`}>Peringatan III</span>
              {kpiFilter === 'ADA_SP3S' ? (
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 rounded">
                  Aktif
                </span>
              ) : (
                <span className="text-[10px] text-purple-600 font-semibold opacity-0 group-hover:opacity-100">
                  Filter
                </span>
              )}
            </div>
          </button>

          {/* 10. Ada Dispensasi */}
          <button
            type="button"
            onClick={() => handleToggleKpiFilter('ADA_DISPENSASI')}
            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${
              kpiFilter === 'ADA_DISPENSASI'
                ? 'border-cyan-500 ring-2 ring-cyan-500/30 bg-cyan-50/70 dark:bg-cyan-950/50 shadow-sm'
                : `${bgCard} hover:border-cyan-300 dark:hover:border-cyan-800`
            }`}
            title="Klik untuk memfilter: Ada Surat Dispensasi"
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${textMuted}`}>Ada Dispensasi</span>
              <MousePointerClick className="w-3.5 h-3.5 text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-black mt-1 text-cyan-600 dark:text-cyan-400">
              {summary.adaDispensasi}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className={`text-[11px] ${textMuted}`}>Dispensasi</span>
              {kpiFilter === 'ADA_DISPENSASI' ? (
                <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/60 px-1.5 py-0.5 rounded">
                  Aktif
                </span>
              ) : (
                <span className="text-[10px] text-cyan-600 font-semibold opacity-0 group-hover:opacity-100">
                  Filter
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Banner Filter Aktif dengan Opsi Cetak Khusus Filter Ini */}
        {kpiFilter !== 'ALL' && (
          <div className="mt-3 flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 shadow-sm flex-wrap gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-blue-950 dark:text-blue-100 block">
                  Filter Aktif: {getKpiFilterLabel(kpiFilter)}
                </span>
                <span className="text-[11px] text-blue-700 dark:text-blue-300">
                  Menampilkan <strong>{filteredRecords.length}</strong> dari total {summary.totalSatker} Satker
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleExportActivePDF}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                title="Cetak PDF khusus data yang sedang difilter ini"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak PDF Filter Ini ({filteredRecords.length} Satker)
              </button>
              <button
                type="button"
                onClick={() => setKpiFilter('ALL')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Reset Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🚨 KARTU PRIORITAS: PERLU TINDAK LANJUT */}
      <div className={`p-5 rounded-2xl border ${
        isDark ? 'bg-rose-950/20 border-rose-900/60' : 'bg-rose-50/70 border-rose-200'
      }`}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-600 text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                🚨 PERLU TINDAK LANJUT / PEMANTAUAN KEPATUHAN
              </h4>
              <p className="text-xs text-rose-700/80 dark:text-rose-300/80">
                Satker dengan kewajiban rekonsiliasi, todolist, atau tutup periode yang belum tuntas
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-sm">
            Total Perlu Tindakan: {summary.perluTindakan} Satker
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          {/* Card 1: Belum Rekonsiliasi */}
          <button
            onClick={() => setQuickFilter('BELUM_REKON')}
            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${
              quickFilter === 'BELUM_REKON'
                ? 'border-rose-600 ring-2 ring-rose-500/20 bg-rose-100/80 dark:bg-rose-900/40'
                : isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-rose-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                1. Belum Rekonsiliasi (TDK)
              </span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                {summary.rekonsiliasiBelumSelesai}
              </span>
            </div>
            <p className={`text-[11px] ${textMuted} mt-1`}>
              Masih terdapat selisih rekonsiliasi yang belum disesuaikan.
            </p>
          </button>

          {/* Card 2: Masih Todolist */}
          <button
            onClick={() => setQuickFilter('MASIH_TODOLIST')}
            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${
              quickFilter === 'MASIH_TODOLIST'
                ? 'border-rose-600 ring-2 ring-rose-500/20 bg-rose-100/80 dark:bg-rose-900/40'
                : isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-rose-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                2. Masih Ada Todolist
              </span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                {summary.todolistBelumSelesai}
              </span>
            </div>
            <p className={`text-[11px] ${textMuted} mt-1`}>
              Daftar pekerjaan/todolist di modul SAKTI belum diselesaikan.
            </p>
          </button>

          {/* Card 3: Belum Tutup Periode */}
          <button
            onClick={() => setQuickFilter('BELUM_TUTUP')}
            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${
              quickFilter === 'BELUM_TUTUP'
                ? 'border-amber-600 ring-2 ring-amber-500/20 bg-amber-100/80 dark:bg-amber-900/40'
                : isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-rose-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                3. Belum Tutup Periode
              </span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                {summary.belumTutupPeriode}
              </span>
            </div>
            <p className={`text-[11px] ${textMuted} mt-1`}>
              Belum melakukan tutup permanen GLP periode {selectedPeriode}.
            </p>
          </button>
        </div>
      </div>

      {/* Main Content Area: Quick Filters, Search & Table */}
      <div className={`p-6 rounded-2xl border ${bgCard} shadow-sm space-y-4`}>
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setQuickFilter('SEMUA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              quickFilter === 'SEMUA'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua Satker ({currentPeriodRecords.length})
          </button>
          <button
            onClick={() => setQuickFilter('BELUM_REKON')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              quickFilter === 'BELUM_REKON'
                ? 'bg-rose-600 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Belum Rekonsiliasi ({summary.rekonsiliasiBelumSelesai})
          </button>
          <button
            onClick={() => setQuickFilter('MASIH_TODOLIST')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              quickFilter === 'MASIH_TODOLIST'
                ? 'bg-rose-600 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Masih Todolist ({summary.todolistBelumSelesai})
          </button>
          <button
            onClick={() => setQuickFilter('BELUM_TUTUP')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              quickFilter === 'BELUM_TUTUP'
                ? 'bg-amber-600 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Belum Tutup Periode ({summary.belumTutupPeriode})
          </button>
          <button
            onClick={() => setQuickFilter('PERLU_TINDAKAN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              quickFilter === 'PERLU_TINDAKAN'
                ? 'bg-rose-700 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Perlu Tindakan ({summary.perluTindakan})
          </button>
          <button
            onClick={() => setQuickFilter('ADA_DOKUMEN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              quickFilter === 'ADA_DOKUMEN'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Ada Dokumen / SP2S / SP3S ({summary.adaSp2s + summary.adaSp3s + summary.adaDispensasi})
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Kode, Nama Satker, No KPPN, SP2S..."
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border transition-colors ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
              } outline-none`}
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Status Satker */}
            <select
              value={filterStatusSatker}
              onChange={(e) => setFilterStatusSatker(e.target.value)}
              className={`px-2.5 py-2 rounded-xl border cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="SEMUA">Status: Semua</option>
              <option value="AKTIF">Status: Aktif</option>
              <option value="NONAKTIF">Status: Nonaktif</option>
            </select>

            {/* Rekonsiliasi */}
            <select
              value={filterRekonsiliasi}
              onChange={(e) => setFilterRekonsiliasi(e.target.value)}
              className={`px-2.5 py-2 rounded-xl border cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="SEMUA">Rekon: Semua</option>
              <option value="SELESAI">Rekon: Selesai</option>
              <option value="BELUM_SELESAI">Rekon: Belum (TDK)</option>
            </select>

            {/* Todolist */}
            <select
              value={filterTodolist}
              onChange={(e) => setFilterTodolist(e.target.value)}
              className={`px-2.5 py-2 rounded-xl border cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="SEMUA">Todolist: Semua</option>
              <option value="SELESAI">Todolist: Selesai</option>
              <option value="BELUM_SELESAI">Todolist: Belum Selesai</option>
            </select>

            {/* Tutup Periode */}
            <select
              value={filterTutupPeriode}
              onChange={(e) => setFilterTutupPeriode(e.target.value)}
              className={`px-2.5 py-2 rounded-xl border cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="SEMUA">Tutup: Semua</option>
              <option value="BELUM_TUTUP">Belum Tutup</option>
              <option value="SUDAH_TUTUP">Sudah Tutup</option>
            </select>

            {/* Reset Filters */}
            {(quickFilter !== 'SEMUA' || searchQuery || filterStatusSatker !== 'SEMUA' || filterRekonsiliasi !== 'SEMUA' || filterTodolist !== 'SEMUA' || filterTutupPeriode !== 'SEMUA') && (
              <button
                onClick={() => {
                  setQuickFilter('SEMUA');
                  setSearchQuery('');
                  setFilterStatusSatker('SEMUA');
                  setFilterRekonsiliasi('SEMUA');
                  setFilterTodolist('SEMUA');
                  setFilterTutupPeriode('SEMUA');
                }}
                className={`px-2.5 py-2 rounded-xl border font-semibold ${
                  isDark ? 'bg-slate-800 border-slate-700 text-rose-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-rose-600 hover:bg-slate-200'
                }`}
                title="Reset Semua Filter"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className={`border-b ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100/90 border-slate-200 text-slate-700'} font-bold`}>
              <tr>
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3 w-20 text-center">No KPPN</th>
                <th className="p-3 w-24">Kode Satker</th>
                <th className="p-3 min-w-[220px]">Nama Satker</th>
                <th className="p-3 min-w-[170px]">Rekonsiliasi</th>
                <th className="p-3 min-w-[160px]">Todolist</th>
                <th className="p-3 min-w-[180px]">Tutup Periode</th>
                <th className="p-3 min-w-[120px]">SP2S</th>
                <th className="p-3 min-w-[120px]">SP3S</th>
                <th className="p-3 w-20 text-center">Dispensasi</th>
                <th className="p-3 w-28 text-center">Prioritas</th>
                <th className="p-3 w-16 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-sm">Tidak ada data Satker yang sesuai filter.</p>
                    <p className="text-xs mt-1">Gunakan tombol "Muat Data Contoh" atau unggah file Excel monitoring.</p>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, idx) => {
                  const master = getPicForSatker(r.kodeSatker);
                  const isPerluTindakan = r.prioritasKategori === 'PERLU_TINDAKAN';
                  return (
                    <tr
                      key={r.id || `${r.kodeSatker}-${idx}`}
                      className={`hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors ${
                        isPerluTindakan && quickFilter === 'PERLU_TINDAKAN'
                          ? isDark ? 'bg-rose-950/10' : 'bg-rose-50/30'
                          : ''
                      }`}
                    >
                      {/* No */}
                      <td className="p-3 text-center font-medium text-slate-400">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* No KPPN Satker (Col B) */}
                      <td className="p-3 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                        {r.noKppnSatker}
                      </td>

                      {/* Kode Satker (Col C) */}
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {r.kodeSatker}
                      </td>

                      {/* Nama Satker */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                          {r.namaSatker}
                        </div>
                        <div className={`text-[11px] ${textMuted} flex items-center gap-2 mt-0.5`}>
                          <span>KPPN: {r.kodeKppn}</span>
                          <span>•</span>
                          <span className={r.statusSatker === 'AKTIF' ? 'text-emerald-600 font-semibold' : 'text-amber-600'}>
                            {r.statusSatker}
                          </span>
                          {master?.namaPic && (
                            <>
                              <span>•</span>
                              <span>PIC: {master.namaPic}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Rekonsiliasi */}
                      <td className="p-3">
                        {r.rekonsiliasiStatus === 'SELESAI' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Sudah Sama</span>
                          </span>
                        ) : r.rekonsiliasiStatus === 'BELUM_SELESAI' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Selisih (TDK)</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">{r.rekonsiliasiRaw}</span>
                        )}
                        <p className={`text-[10px] ${textMuted} truncate max-w-[160px]`} title={r.rekonsiliasiRaw}>
                          {r.rekonsiliasiRaw}
                        </p>
                      </td>

                      {/* Todolist */}
                      <td className="p-3">
                        {r.todolistStatus === 'SELESAI' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Selesai</span>
                          </span>
                        ) : r.todolistStatus === 'BELUM_SELESAI' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Masih Ada</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">{r.todolistRaw}</span>
                        )}
                        <p className={`text-[10px] ${textMuted} truncate max-w-[150px]`} title={r.todolistRaw}>
                          {r.todolistRaw}
                        </p>
                      </td>

                      {/* Tutup Periode */}
                      <td className="p-3">
                        {r.tutupPeriodeStatus === 'SUDAH_TUTUP' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Sudah Tutup</span>
                          </span>
                        ) : r.tutupPeriodeStatus === 'BELUM_TUTUP' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>Belum Tutup</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">{r.tutupPeriodeRaw}</span>
                        )}
                        <p className={`text-[10px] ${textMuted} truncate max-w-[170px]`} title={r.tutupPeriodeRaw}>
                          {r.tutupPeriodeRaw}
                        </p>
                      </td>

                      {/* SP2S */}
                      <td className="p-3">
                        {r.sp2sStatus === 'ADA' ? (
                          <div>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{r.sp2sNomor}</span>
                            <p className={`text-[10px] ${textMuted}`}>{r.sp2sTanggal}</p>
                          </div>
                        ) : (
                          <span className={`text-[11px] ${textMuted}`}>Tidak Ada</span>
                        )}
                      </td>

                      {/* SP3S */}
                      <td className="p-3">
                        {r.sp3sStatus === 'ADA' ? (
                          <div>
                            <span className="font-semibold text-purple-600 dark:text-purple-400">{r.sp3sNomor}</span>
                            <p className={`text-[10px] ${textMuted}`}>{r.sp3sTanggal}</p>
                          </div>
                        ) : (
                          <span className={`text-[11px] ${textMuted}`}>Belum Ada</span>
                        )}
                      </td>

                      {/* Dispensasi */}
                      <td className="p-3 text-center">
                        {r.dispensasi && r.dispensasi !== '-' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            {r.dispensasi}
                          </span>
                        ) : (
                          <span className={`text-[11px] ${textMuted}`}>-</span>
                        )}
                      </td>

                      {/* Prioritas Status Faktual */}
                      <td className="p-3 text-center">
                        {r.prioritasKategori === 'PERLU_TINDAKAN' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                            🔴 Tindakan
                          </span>
                        )}
                        {r.prioritasKategori === 'PERLU_PEMANTAUAN' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                            🟡 Pantau
                          </span>
                        )}
                        {r.prioritasKategori === 'SELESAI' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                            🟢 Selesai
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedRecordForDetail(r);
                            addAuditLog('VIEW_DETAIL', `Melihat detail kepatuhan Satker ${r.namaSatker} (${r.kodeSatker})`);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'hover:bg-slate-800 text-blue-400' : 'hover:bg-slate-100 text-blue-600'
                          }`}
                          title="Lihat Detail Satker"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs">
          <div className={textMuted}>
            Menampilkan <strong>{filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> -{' '}
            <strong>{Math.min(currentPage * pageSize, filteredRecords.length)}</strong> dari{' '}
            <strong>{filteredRecords.length}</strong> Satker
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={textMuted}>Baris:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded-lg border cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className={`p-1.5 rounded-lg border disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-semibold">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className={`p-1.5 rounded-lg border disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Detail Satker */}
      {selectedRecordForDetail && (
        <DetailSatkerRekonsiliasiModal
          record={selectedRecordForDetail}
          masterSatker={getPicForSatker(selectedRecordForDetail.kodeSatker)}
          isDark={isDark}
          onClose={() => setSelectedRecordForDetail(null)}
        />
      )}

      {/* Modal: Riwayat Upload */}
      {showRiwayatModal && (
        <RiwayatUploadRekonsiliasiModal
          uploads={uploads}
          currentPeriode={selectedPeriode}
          isAdminAuthenticated={isAdminAuthenticated}
          isDark={isDark}
          onSelectPeriode={(p) => setSelectedPeriode(p)}
          onDeleteBatch={handleDeleteBatch}
          onClose={() => setShowRiwayatModal(false)}
        />
      )}

      {/* Modal: Audit Log */}
      {showAuditModal && (
        <RekonsiliasiAuditLogModal
          logs={auditLogs}
          isDark={isDark}
          onClose={() => setShowAuditModal(false)}
        />
      )}

      {/* Modal: Upload Result Notice / Error Notice */}
      {uploadNoticeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`relative w-full max-w-lg rounded-2xl p-6 shadow-2xl border ${bgCard}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${
                uploadNoticeModal.isError
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
              }`}>
                {uploadNoticeModal.isError ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-base">{uploadNoticeModal.title}</h4>
                <p className={`text-xs ${textMuted}`}>
                  {uploadNoticeModal.isError ? 'Terjadi kendala saat validasi format' : 'File Excel telah berhasil diproses'}
                </p>
              </div>
            </div>

            {uploadNoticeModal.isError ? (
              <div className={`p-4 rounded-xl border mb-4 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900`}>
                {uploadNoticeModal.message}
              </div>
            ) : uploadNoticeModal.batch ? (
              <div className={`p-4 rounded-xl border mb-4 text-xs space-y-2 ${bgSubtle}`}>
                <div className="flex justify-between">
                  <span className={textMuted}>Nama File:</span>
                  <span className="font-semibold">{uploadNoticeModal.batch.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className={textMuted}>Waktu Upload:</span>
                  <span className="font-semibold">{new Date(uploadNoticeModal.batch.uploadedAt).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className={textMuted}>Jumlah Sheet:</span>
                  <span className="font-semibold">{uploadNoticeModal.batch.sheetsCount || 1} ({uploadNoticeModal.batch.sheetNames?.join(', ') || 'Data'})</span>
                </div>
                <div className="flex justify-between">
                  <span className={textMuted}>Jumlah Data Satker:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{uploadNoticeModal.batch.jumlahData} Satker</span>
                </div>
                <div className="flex justify-between">
                  <span className={textMuted}>Periode Data:</span>
                  <span className="font-bold">{formatPeriodeRekonsiliasi(uploadNoticeModal.batch.periode)} ({uploadNoticeModal.batch.periode})</span>
                </div>
                {uploadNoticeModal.batch.downloadWaktuInfo && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-400 italic">
                    Sumber: {uploadNoticeModal.batch.downloadWaktuInfo}
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end">
              <button
                onClick={() => setUploadNoticeModal({ isOpen: false, title: '' })}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cetak PDF Rekap Kepatuhan Sesuai Filter & Kategori */}
      {showPdfExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`relative w-full max-w-xl rounded-2xl p-6 shadow-2xl border ${bgCard} space-y-4 animate-in zoom-in-95`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-500/20">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Cetak Laporan Kepatuhan PDF</h3>
                  <p className={`text-xs ${textMuted}`}>Pilih cetak hasil filter aktif atau kategori kepatuhan spesifik</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfExportModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Option 1: Cetak Sesuai Tampilan Filter Aktif */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Pilihan Rekomendasi (Sesuai Tampilan)
                </span>
                <span className="text-sm font-extrabold text-blue-950 dark:text-blue-100 block mt-0.5">
                  Cetak Data Tampilan Aktif ({filteredRecords.length} Satker)
                </span>
                <span className={`text-xs ${textMuted} block mt-0.5`}>
                  Filter: {getKpiFilterLabel(kpiFilter)} {searchQuery ? `| Cari: "${searchQuery}"` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleExportActivePDF();
                  setShowPdfExportModal(false);
                }}
                disabled={filteredRecords.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 transition-all shrink-0 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Data Ini
              </button>
            </div>

            {/* Option 2: Cetak Kategori Spesifik */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Atau Cetak Berdasarkan Kategori Kepatuhan Spesifik:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {/* 1. Seluruh Satker */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportSpecificCategoryPDF('ALL');
                    setShowPdfExportModal(false);
                  }}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 text-left transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold block">1. Seluruh Satker Terdaftar</span>
                    <span className={`text-[11px] ${textMuted}`}>Rekap lengkap semua satker</span>
                  </div>
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    {summary.totalSatker}
                  </span>
                </button>

                {/* 2. Belum Rekon */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportSpecificCategoryPDF('REKON_BELUM');
                    setShowPdfExportModal(false);
                  }}
                  className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:border-rose-500 hover:bg-rose-50/40 dark:hover:bg-rose-950/30 text-left transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">2. Belum Rekon (TDK)</span>
                    <span className={`text-[11px] ${textMuted}`}>Satker belum selesai rekon</span>
                  </div>
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                    {summary.rekonsiliasiBelumSelesai}
                  </span>
                </button>

                {/* 3. Rekon Selesai */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportSpecificCategoryPDF('REKON_SELESAI');
                    setShowPdfExportModal(false);
                  }}
                  className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 text-left transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">3. Rekon Selesai (SHR)</span>
                    <span className={`text-[11px] ${textMuted}`}>Satker status SHR / Sama</span>
                  </div>
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                    {summary.rekonsiliasiSelesai}
                  </span>
                </button>

                {/* 4. Todolist Belum */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportSpecificCategoryPDF('TODOLIST_BELUM');
                    setShowPdfExportModal(false);
                  }}
                  className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:border-rose-500 hover:bg-rose-50/40 dark:hover:bg-rose-950/30 text-left transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">4. Todolist Belum Selesai</span>
                    <span className={`text-[11px] ${textMuted}`}>Masih ada todolist</span>
                  </div>
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                    {summary.todolistBelumSelesai}
                  </span>
                </button>

                {/* 5. Todolist Selesai */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportSpecificCategoryPDF('TODOLIST_SELESAI');
                    setShowPdfExportModal(false);
                  }}
                  className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 text-left transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">5. Todolist Selesai</span>
                    <span className={`text-[11px] ${textMuted}`}>Todolist bersih (0 data)</span>
                  </div>
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                    {summary.todolistSelesai}
                  </span>
                </button>

                {/* 6. Belum Tutup Periode */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportSpecificCategoryPDF('BELUM_TUTUP');
                    setShowPdfExportModal(false);
                  }}
                  className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/30 text-left transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">6. Belum Tutup Periode</span>
                    <span className={`text-[11px] ${textMuted}`}>Belum tutup permanen</span>
                  </div>
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                    {summary.belumTutupPeriode}
                  </span>
                </button>

                {/* 7. Perlu Tindakan Segera */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportSpecificCategoryPDF('PERLU_TINDAKAN');
                    setShowPdfExportModal(false);
                  }}
                  className="p-3 rounded-xl border border-red-300 dark:border-red-900 hover:border-red-600 hover:bg-red-50/40 dark:hover:bg-red-950/30 text-left transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 block">7. Perlu Tindak Lanjut</span>
                    <span className={`text-[11px] ${textMuted}`}>Prioritas tinggi KPPN</span>
                  </div>
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300">
                    {summary.perluTindakan}
                  </span>
                </button>

                {/* 8. Ada SP2S */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportSpecificCategoryPDF('ADA_SP2S');
                    setShowPdfExportModal(false);
                  }}
                  className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 text-left transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">8. Menerima SP2S</span>
                    <span className={`text-[11px] ${textMuted}`}>Surat Peringatan II</span>
                  </div>
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                    {summary.adaSp2s}
                  </span>
                </button>

                {/* 9. Ada SP3S */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportSpecificCategoryPDF('ADA_SP3S');
                    setShowPdfExportModal(false);
                  }}
                  className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 hover:border-purple-500 hover:bg-purple-50/40 dark:hover:bg-purple-950/30 text-left transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block">9. Menerima SP3S</span>
                    <span className={`text-[11px] ${textMuted}`}>Surat Peringatan III</span>
                  </div>
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                    {summary.adaSp3s}
                  </span>
                </button>

                {/* 10. Ada Dispensasi */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportSpecificCategoryPDF('ADA_DISPENSASI');
                    setShowPdfExportModal(false);
                  }}
                  className="p-3 rounded-xl border border-cyan-200 dark:border-cyan-900/60 hover:border-cyan-500 hover:bg-cyan-50/40 dark:hover:bg-cyan-950/30 text-left transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 block">10. Ada Dispensasi</span>
                    <span className={`text-[11px] ${textMuted}`}>Surat Dispensasi SAKTI</span>
                  </div>
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300">
                    {summary.adaDispensasi}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowPdfExportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
