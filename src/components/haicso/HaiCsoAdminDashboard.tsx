import React, { useState, useMemo } from 'react';
import {
  Ticket,
  Upload,
  Calendar,
  Filter,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Users,
  Mail,
  Building2,
  FileSpreadsheet,
  Settings,
  History,
  BarChart3,
  PieChart as PieChartIcon,
  Eye,
  Trash2,
  ArrowUpDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Layers,
  Sparkles,
  Save,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  HAICSOTicket,
  HAICSOUploadBatch,
  HAICSODashboardSettings,
  HAICSOStatsSummary,
  HAICSOTriwulan,
  MasterSatker
} from '../../types';
import {
  computeHaiCsoSummary,
  computeUserTicketFrequency,
  computeEmailTicketFrequency,
  computeSatkerTicketSummary,
  parseHaiCsoWorkbook,
  mergeHaiCsoTicketsDeduplicated,
  generateSampleHaiCsoExcelBytes,
  generateInitialHaiCsoData
} from '../../utils/haiCsoExcelParser';
import {
  exportHaiCsoAdminPDF,
  exportHaiCsoSatkerPDF
} from '../../utils/haiCsoExportHelper';
import { HaiCsoTicketDetailModal } from './HaiCsoTicketDetailModal';
import { HaiCsoDrilldownModal, HaiCsoDrilldownType } from './HaiCsoDrilldownModal';

interface HaiCsoAdminDashboardProps {
  tickets: HAICSOTicket[];
  batches: HAICSOUploadBatch[];
  settings: HAICSODashboardSettings;
  masterSatkers?: MasterSatker[];
  onUpdateTickets: (newTickets: HAICSOTicket[], newBatches: HAICSOUploadBatch[]) => void;
  onUpdateSettings: (newSettings: HAICSODashboardSettings) => void;
  isDark?: boolean;
  viewMode?: 'full' | 'upload_only' | 'monitoring_only';
  defaultSubTab?: 'monitoring' | 'upload' | 'history' | 'settings';
}

const STATUS_COLORS: Record<string, string> = {
  'Selesai': '#10b981', // emerald-500
  'Menunggu konfirmasi/respons Satker': '#f59e0b', // amber-500
  'Menunggu konfirmasi/respon KPPN': '#3b82f6', // blue-500
  'Kirim ke HAI': '#8b5cf6' // purple-500
};

export const HaiCsoAdminDashboard: React.FC<HaiCsoAdminDashboardProps> = ({
  tickets,
  batches,
  settings,
  masterSatkers = [],
  onUpdateTickets,
  onUpdateSettings,
  isDark = false,
  viewMode = 'full',
  defaultSubTab
}) => {
  const initialSubTab = defaultSubTab || (viewMode === 'upload_only' ? 'upload' : 'monitoring');
  const [activeSubTab, setActiveSubTab] = useState<'monitoring' | 'upload' | 'history' | 'settings'>(initialSubTab);

  // Global Action Notification Banner
  const [globalNotice, setGlobalNotice] = useState<{
    show: boolean;
    type: 'success' | 'warning' | 'info';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  // In-Component Confirmation Modal for Safe Action Handling
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    actionType: 'delete_batch' | 'clear_all' | 'reset_sample';
    targetBatchId?: string;
  } | null>(null);

  // Filter States
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [filterTriwulan, setFilterTriwulan] = useState<string>('ALL');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterFeedback, setFilterFeedback] = useState<string>('ALL');
  const [filterEmail, setFilterEmail] = useState<string>('ALL');
  const [filterUser, setFilterUser] = useState<string>('ALL');
  const [filterSatker, setFilterSatker] = useState<string>('ALL');
  const [filterKodeSatker, setFilterKodeSatker] = useState<string>('');
  const [filterCso, setFilterCso] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Frequency tab state: 'user' | 'email'
  const [frequencyTab, setFrequencyTab] = useState<'user' | 'email'>('user');

  // Modal & Selection State
  const [selectedTicket, setSelectedTicket] = useState<HAICSOTicket | null>(null);
  const [drilldownType, setDrilldownType] = useState<HaiCsoDrilldownType | null>(null);

  // Pagination for main table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Upload Draft State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'replace' | 'merge'>('replace');
  const [parsedPreview, setParsedPreview] = useState<{
    batch: HAICSOUploadBatch;
    records: HAICSOTicket[];
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);

  // Settings State Form
  const [settingsActive, setSettingsActive] = useState<boolean>(settings.is_active);
  const [settingsTarget, setSettingsTarget] = useState<number>(settings.target_selesai_persen || 95);
  const [settingsNotes, setSettingsNotes] = useState<string>(settings.catatan_kppn || '');
  const [settingsSavedNotice, setSettingsSavedNotice] = useState<boolean>(false);

  // Extract distinct filter options
  const distinctYears = useMemo(() => {
    const s = new Set<number>();
    tickets.forEach(t => { if (t.tahun) s.add(t.tahun); });
    return Array.from(s).sort((a, b) => b - a);
  }, [tickets]);

  const distinctUsers = useMemo(() => {
    const s = new Set<string>();
    tickets.forEach(t => { if (t.nama_pengguna) s.add(t.nama_pengguna.trim()); });
    return Array.from(s).sort();
  }, [tickets]);

  const distinctEmails = useMemo(() => {
    const s = new Set<string>();
    tickets.forEach(t => { if (t.email) s.add(t.email.trim().toLowerCase()); });
    return Array.from(s).sort();
  }, [tickets]);

  const distinctSatkers = useMemo(() => {
    const s = new Set<string>();
    tickets.forEach(t => { if (t.nama_satker) s.add(t.nama_satker.trim()); });
    return Array.from(s).sort();
  }, [tickets]);

  const distinctCsos = useMemo(() => {
    const s = new Set<string>();
    tickets.forEach(t => { if (t.cso) s.add(t.cso.trim()); });
    return Array.from(s).sort();
  }, [tickets]);

  // Simultaneous Multi-Criteria Filtering
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // 1. Tahun
      if (filterYear !== 'ALL' && String(t.tahun) !== filterYear) return false;

      // 2. Triwulan (Triwulan I, II, III, IV dihitung dari Tanggal Tiket)
      if (filterTriwulan !== 'ALL' && t.triwulan !== filterTriwulan) return false;

      // 3. Rentang Tanggal
      if (filterStartDate) {
        const ticketDate = t.tanggal_tiket.substring(0, 10);
        if (ticketDate < filterStartDate) return false;
      }
      if (filterEndDate) {
        const ticketDate = t.tanggal_tiket.substring(0, 10);
        if (ticketDate > filterEndDate) return false;
      }

      // 4. Status Utama
      if (filterStatus !== 'ALL') {
        const s = (t.status || '').toLowerCase();
        const target = filterStatus.toLowerCase();
        if (target === 'selesai' && !s.includes('selesai')) return false;
        if (target === 'menunggu satker' && !s.includes('respons satker') && !s.includes('respon satker')) return false;
        if (target === 'menunggu kppn' && !s.includes('respon kppn') && !s.includes('respons kppn')) return false;
        if (target === 'kirim ke hai' && !s.includes('kirim ke hai') && !s.includes('hai')) return false;
      }

      // 5. Status Feedback
      if (filterFeedback !== 'ALL') {
        const fb = (t.status_feedback || '').toLowerCase();
        if (filterFeedback === 'BELUM' && !fb.includes('belum')) return false;
        if (filterFeedback === 'SUDAH' && !fb.includes('sudah')) return false;
      }

      // 6. Email Pengguna
      if (filterEmail !== 'ALL' && (t.email || '').toLowerCase() !== filterEmail.toLowerCase()) {
        return false;
      }

      // 7. Pengguna
      if (filterUser !== 'ALL' && (t.nama_pengguna || '').trim() !== filterUser) {
        return false;
      }

      // 8. Satker
      if (filterSatker !== 'ALL' && (t.nama_satker || '').trim() !== filterSatker) {
        return false;
      }

      // 9. Kode Satker
      if (filterKodeSatker && !t.kode_satker.includes(filterKodeSatker.trim())) {
        return false;
      }

      // 10. CSO
      if (filterCso !== 'ALL' && (t.cso || '').trim() !== filterCso) {
        return false;
      }

      // 11. Search Query (No Ref, Subjek, Nama, Email)
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          t.nomor_referensi.toLowerCase().includes(q) ||
          t.subjek.toLowerCase().includes(q) ||
          t.nama_pengguna.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.nama_satker.toLowerCase().includes(q) ||
          t.kode_satker.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    tickets,
    filterYear,
    filterTriwulan,
    filterStartDate,
    filterEndDate,
    filterStatus,
    filterFeedback,
    filterEmail,
    filterUser,
    filterSatker,
    filterKodeSatker,
    filterCso,
    searchQuery
  ]);

  // Statistics Summary of Filtered Data
  const summary = useMemo(() => {
    return computeHaiCsoSummary(filteredTickets);
  }, [filteredTickets]);

  // Selected Email Specific Stats Badge if Email filter is active
  const selectedEmailStats = useMemo(() => {
    if (filterEmail === 'ALL') return null;
    const emailTickets = tickets.filter(t => (t.email || '').toLowerCase() === filterEmail.toLowerCase());
    const selesai = emailTickets.filter(t => (t.status || '').toLowerCase().includes('selesai')).length;
    const belum = emailTickets.length - selesai;
    const menungguSatker = emailTickets.filter(t => (t.status || '').toLowerCase().includes('respons satker')).length;
    const belumFeedback = emailTickets.filter(t => (t.status_feedback || '').toLowerCase().includes('belum')).length;

    return {
      email: filterEmail,
      total: emailTickets.length,
      selesai,
      belum,
      menungguSatker,
      belumFeedback
    };
  }, [tickets, filterEmail]);

  // Frequency Summaries
  const userFrequency = useMemo(() => {
    return computeUserTicketFrequency(filteredTickets);
  }, [filteredTickets]);

  const emailFrequency = useMemo(() => {
    return computeEmailTicketFrequency(filteredTickets);
  }, [filteredTickets]);

  const satkerSummary = useMemo(() => {
    return computeSatkerTicketSummary(filteredTickets);
  }, [filteredTickets]);

  // Chart Data A: Jumlah Tiket per Triwulan
  const quarterChartData = useMemo(() => {
    const quarters: Record<HAICSOTriwulan, { total: number; selesai: number; belumSelesai: number }> = {
      'Triwulan I': { total: 0, selesai: 0, belumSelesai: 0 },
      'Triwulan II': { total: 0, selesai: 0, belumSelesai: 0 },
      'Triwulan III': { total: 0, selesai: 0, belumSelesai: 0 },
      'Triwulan IV': { total: 0, selesai: 0, belumSelesai: 0 }
    };

    filteredTickets.forEach(t => {
      const q = t.triwulan;
      if (quarters[q]) {
        quarters[q].total++;
        if ((t.status || '').toLowerCase().includes('selesai')) {
          quarters[q].selesai++;
        } else {
          quarters[q].belumSelesai++;
        }
      }
    });

    return [
      { name: 'Triwulan I (Q1)', total: quarters['Triwulan I'].total, selesai: quarters['Triwulan I'].selesai, belumSelesai: quarters['Triwulan I'].belumSelesai },
      { name: 'Triwulan II (Q2)', total: quarters['Triwulan II'].total, selesai: quarters['Triwulan II'].selesai, belumSelesai: quarters['Triwulan II'].belumSelesai },
      { name: 'Triwulan III (Q3)', total: quarters['Triwulan III'].total, selesai: quarters['Triwulan III'].selesai, belumSelesai: quarters['Triwulan III'].belumSelesai },
      { name: 'Triwulan IV (Q4)', total: quarters['Triwulan IV'].total, selesai: quarters['Triwulan IV'].selesai, belumSelesai: quarters['Triwulan IV'].belumSelesai }
    ];
  }, [filteredTickets]);

  // Chart Data B: Distribusi Status Tiket (Pie)
  const statusPieData = useMemo(() => {
    return [
      { name: 'Selesai', value: summary.selesaiCount, color: '#10b981' },
      { name: 'Menunggu Respons Satker', value: summary.menungguSatkerCount, color: '#f59e0b' },
      { name: 'Menunggu Respon KPPN', value: summary.menungguKppnCount, color: '#3b82f6' },
      { name: 'Kirim ke HAI', value: summary.kirimHaiCount, color: '#8b5cf6' }
    ].filter(item => item.value > 0);
  }, [summary]);

  // Chart Data C: Tren Tiket per Bulan (Jan - Des)
  const monthlyChartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const counts = new Array(12).fill(0);

    filteredTickets.forEach(t => {
      if (t.bulan >= 1 && t.bulan <= 12) {
        counts[t.bulan - 1]++;
      }
    });

    return monthNames.map((name, i) => ({
      bulan: name,
      tiket: counts[i]
    }));
  }, [filteredTickets]);

  // Chart Data D: Top 10 Pengguna Pengirim Tiket
  const topUsersChartData = useMemo(() => {
    return userFrequency.slice(0, 10).map(u => ({
      nama: u.nama_pengguna.length > 14 ? u.nama_pengguna.substring(0, 14) + '...' : u.nama_pengguna,
      tiket: u.totalTiket,
      selesai: u.selesai,
      menunggu: u.menungguSatker
    }));
  }, [userFrequency]);

  // Chart Data E: Top 10 Satker Tiket Terbanyak
  const topSatkersChartData = useMemo(() => {
    return satkerSummary.slice(0, 10).map(s => ({
      satker: s.nama_satker.length > 18 ? s.nama_satker.substring(0, 18) + '...' : s.nama_satker,
      kode: s.kode_satker,
      total: s.totalTiket,
      selesai: s.selesai
    }));
  }, [satkerSummary]);

  // Pagination for main table
  const totalPages = Math.ceil(filteredTickets.length / pageSize) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  // Reset Filters Helper
  const handleResetFilters = () => {
    setFilterYear('ALL');
    setFilterTriwulan('ALL');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterStatus('ALL');
    setFilterFeedback('ALL');
    setFilterEmail('ALL');
    setFilterUser('ALL');
    setFilterSatker('ALL');
    setFilterKodeSatker('');
    setFilterCso('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Helper to apply filter from drilldown modal
  const handleApplyDrilldownFilter = (filterType: string, value: string) => {
    setCurrentPage(1);
    if (filterType === 'status') {
      setFilterStatus(value);
    } else if (filterType === 'feedback') {
      setFilterFeedback(value);
    } else if (filterType === 'user') {
      setFilterUser(value);
    } else if (filterType === 'email') {
      setFilterEmail(value);
    } else if (filterType === 'satker') {
      setFilterSatker(value);
    } else if (filterType === 'reset') {
      handleResetFilters();
    }
  };

  // Analisis Satker Bertiket vs Belum Pernah Buat Tiket
  const satkerAnalysis = useMemo(() => {
    const withTicketCodes = new Set<string>();
    const withTicketNames = new Set<string>();
    tickets.forEach(t => {
      if (t.kode_satker) withTicketCodes.add(t.kode_satker.trim());
      if (t.nama_satker) withTicketNames.add(t.nama_satker.trim().toLowerCase());
    });

    const sourceMaster = masterSatkers && masterSatkers.length > 0 ? masterSatkers : [];
    const belumBertiket = sourceMaster.filter(m => {
      const code = (m.kodeSatker || '').trim();
      const name = (m.namaSatker || '').trim().toLowerCase();
      return !withTicketCodes.has(code) && !withTicketNames.has(name);
    });

    return {
      totalMaster: sourceMaster.length,
      bertiketCount: summary.totalSatkers,
      belumBertiketCount: belumBertiket.length,
      belumBertiketList: belumBertiket
    };
  }, [tickets, masterSatkers, summary.totalSatkers]);

  // PDF Export Handlers
  const handleDownloadAdminPDF = () => {
    const activeFiltersList = [
      filterYear !== 'ALL' ? `Tahun: ${filterYear}` : null,
      filterTriwulan !== 'ALL' ? `${filterTriwulan}` : null,
      filterStatus !== 'ALL' ? `Status: ${filterStatus}` : null,
      filterFeedback !== 'ALL' ? `Feedback: ${filterFeedback}` : null,
      filterEmail !== 'ALL' ? `Email: ${filterEmail}` : null,
      filterSatker !== 'ALL' ? `Satker: ${filterSatker}` : null
    ].filter(Boolean).join(', ');

    exportHaiCsoAdminPDF(filteredTickets, summary, {
      customTitle: 'MONITORING TIKET HAICSO - KPPN SEMARANG I',
      filterLabel: activeFiltersList || 'Semua Data',
      filename: `Monitoring_Tiket_HAICSO_Admin_${new Date().toISOString().substring(0, 10)}.pdf`
    });
  };

  const handleDownloadBelumSelesaiPDF = () => {
    const belumSelesaiTickets = filteredTickets.filter(t => !(t.status || '').toLowerCase().includes('selesai'));
    exportHaiCsoSatkerPDF(belumSelesaiTickets, {
      customTitle: 'MONITORING TIKET HAICSO',
      customSubtitle: 'DAFTAR TIKET BELUM SELESAI (MEMERLUKAN TINDAK LANJUT KPPN / SATKER)',
      periodeLabel: filterYear !== 'ALL' ? `Tahun ${filterYear}` : 'Tahun 2026',
      filename: `Tiket_HAICSO_Belum_Selesai_${new Date().toISOString().substring(0, 10)}.pdf`
    });
  };

  const handleDownloadSampleExcel = () => {
    const bytes = generateSampleHaiCsoExcelBytes();
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Contoh_Format_Tiket_HAICSO.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Upload File Parsing Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setUploadError(null);
    setIsProcessingUpload(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const parseResult = parseHaiCsoWorkbook(workbook, file.name, 'Admin KPPN');

        if (parseResult.records.length === 0) {
          setUploadError('Tidak ditemukan record tiket yang valid pada file Excel. Pastikan sheet bernama "Data" atau memiliki struktur kolom HAICSO.');
          setParsedPreview(null);
        } else {
          setParsedPreview({
            batch: parseResult.batch,
            records: parseResult.records
          });
        }
      } catch (err: any) {
        console.error('Error parsing HAICSO Excel:', err);
        setUploadError(`Gagal membaca file Excel: ${err?.message || 'Format tidak didukung'}`);
        setParsedPreview(null);
      } finally {
        setIsProcessingUpload(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Commit Upload to Database
  const handleCommitUpload = () => {
    if (!parsedPreview) return;

    if (uploadMode === 'replace') {
      const finalTickets = parsedPreview.records;
      const finalBatches = [parsedPreview.batch];
      onUpdateTickets(finalTickets, finalBatches);

      // Save to server API backend for persistent storage
      fetch('/api/haicso/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch: parsedPreview.batch,
          tickets: parsedPreview.records,
          replace: true
        })
      }).catch(e => console.warn('Server upload sync fallback:', e));

      setGlobalNotice({
        show: true,
        type: 'success',
        message: `Upload berhasil! Data lama digantikan dengan ${finalTickets.length} tiket baru dari file.`
      });
    } else {
      // Merge and de-duplicate based on ticket_reference
      const { merged, insertedCount, updatedCount } = mergeHaiCsoTicketsDeduplicated(
        tickets,
        parsedPreview.records
      );

      const newBatches = [parsedPreview.batch, ...batches.filter(b => b.id !== parsedPreview.batch.id)];
      onUpdateTickets(merged, newBatches);

      // Save to server API backend for persistent storage
      fetch('/api/haicso/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch: parsedPreview.batch,
          tickets: parsedPreview.records,
          replace: false
        })
      }).catch(e => console.warn('Server upload sync fallback:', e));

      setGlobalNotice({
        show: true,
        type: 'success',
        message: `Upload berhasil! ${insertedCount} tiket baru ditambahkan, ${updatedCount} tiket diperbarui.`
      });
    }

    setTimeout(() => setGlobalNotice({ show: false, type: 'info', message: '' }), 4000);
    setUploadFile(null);
    setParsedPreview(null);
    if (viewMode === 'upload_only') {
      setActiveSubTab('history');
    } else {
      setActiveSubTab('monitoring');
    }
  };

  // Save Settings Handler
  const handleSaveSettings = () => {
    const updatedSettings: HAICSODashboardSettings = {
      ...settings,
      is_active: settingsActive,
      target_selesai_persen: settingsTarget,
      catatan_kppn: settingsNotes,
      updated_at: new Date().toISOString()
    };

    onUpdateSettings(updatedSettings);

    // Sync to server API
    fetch('/api/haicso/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSettings)
    }).catch(e => console.warn('Settings server sync fallback:', e));

    setSettingsSavedNotice(true);
    setTimeout(() => setSettingsSavedNotice(false), 3000);
  };

  // Delete batch handler with in-app confirmation modal
  const handleDeleteBatch = (batchId: string) => {
    const target = batches.find(b => b.id === batchId);
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Batch Upload HAICSO?',
      message: `Apakah Anda yakin ingin menghapus batch "${target?.file_name || batchId}"? Seluruh rekaman tiket terkait batch ini akan dihapus dari sistem.`,
      confirmText: 'Ya, Hapus Batch',
      actionType: 'delete_batch',
      targetBatchId: batchId
    });
  };

  // Clear all HAICSO data handler
  const handleClearAllHaiCso = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Kosongkan Seluruh Data HAICSO?',
      message: `Apakah Anda yakin ingin menghapus seluruh tiket HAICSO (${tickets.length} tiket) dan ${batches.length} riwayat batch upload? Seluruh data contoh akan dihapus total sehingga Anda dapat mengunggah file data asli dari awal. Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Kosongkan Seluruh Data',
      actionType: 'clear_all'
    });
  };

  // Reset to initial sample data
  const handleResetSampleHaiCso = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Muat Ulang Data Simulasi HAICSO?',
      message: 'Apakah Anda ingin memuat kembali data contoh/simulasi HAICSO lengkap (325 tiket)? Data yang ada saat ini akan digantikan dengan data simulasi default.',
      confirmText: 'Ya, Muat Data Simulasi',
      actionType: 'reset_sample'
    });
  };

  // Execute confirmed modal action
  const executeModalConfirm = async () => {
    if (!confirmModal) return;

    if (confirmModal.actionType === 'delete_batch' && confirmModal.targetBatchId) {
      const batchId = confirmModal.targetBatchId;
      const target = batches.find(b => b.id === batchId);
      const updatedBatches = batches.filter(b => b.id !== batchId);
      let updatedTickets: HAICSOTicket[] = [];
      if (updatedBatches.length === 0) {
        updatedTickets = [];
      } else {
        updatedTickets = tickets.filter(t => t.upload_batch_id !== batchId);
      }

      onUpdateTickets(updatedTickets, updatedBatches);
      try {
        localStorage.setItem('kppn_haicso_tickets', JSON.stringify(updatedTickets));
        localStorage.setItem('kppn_haicso_batches', JSON.stringify(updatedBatches));
        await fetch(`/api/haicso/batch/${batchId}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Batch delete server error:', e);
      }

      setGlobalNotice({
        show: true,
        type: 'success',
        message: `Batch "${target?.file_name || batchId}" dan seluruh tiket terkait berhasil dihapus.`
      });
      setTimeout(() => setGlobalNotice({ show: false, type: 'info', message: '' }), 4000);
    } else if (confirmModal.actionType === 'clear_all') {
      onUpdateTickets([], []);
      try {
        localStorage.setItem('kppn_haicso_tickets', JSON.stringify([]));
        localStorage.setItem('kppn_haicso_batches', JSON.stringify([]));
        await fetch('/api/haicso/all', { method: 'DELETE' });
      } catch (e) {
        console.warn('Clear all HAICSO error:', e);
      }

      setGlobalNotice({
        show: true,
        type: 'success',
        message: 'Seluruh basis data HAICSO berhasil dikosongkan! Anda dapat langsung mengunggah file data asli di tab "Upload Excel".'
      });
      setTimeout(() => setGlobalNotice({ show: false, type: 'info', message: '' }), 4500);
      setActiveSubTab('upload');
    } else if (confirmModal.actionType === 'reset_sample') {
      try {
        const initial = generateInitialHaiCsoData(masterSatkers);
        onUpdateTickets(initial.records, [initial.batch]);
        localStorage.setItem('kppn_haicso_tickets', JSON.stringify(initial.records));
        localStorage.setItem('kppn_haicso_batches', JSON.stringify([initial.batch]));
        await fetch('/api/haicso/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batch: initial.batch,
            tickets: initial.records,
            replace: true
          })
        }).catch(e => console.warn('Reset sample server sync:', e));

        setGlobalNotice({
          show: true,
          type: 'success',
          message: 'Data contoh simulasi HAICSO (325 tiket) berhasil dimuat kembali!'
        });
        setTimeout(() => setGlobalNotice({ show: false, type: 'info', message: '' }), 4000);
      } catch (e) {
        console.warn('Reset sample error:', e);
      }
    }

    setConfirmModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      {viewMode === 'monitoring_only' ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Monitoring & Analisis Tiket HAICSO</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {tickets.length} Tiket
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Pemantauan kepatuhan penyelesaian tiket, feedback satker, dan capaian IKU Layanan KPPN
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadBelumSelesaiPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Belum Selesai</span>
            </button>

            <button
              onClick={handleDownloadAdminPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Lengkap</span>
            </button>
          </div>
        </div>
      ) : (
        /* Subtabs Navigation Bar (For Admin Upload & Settings Panel) */
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {viewMode !== 'upload_only' && (
              <button
                onClick={() => setActiveSubTab('monitoring')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeSubTab === 'monitoring'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Monitoring & Analisis</span>
              </button>
            )}

            <button
              onClick={() => setActiveSubTab('upload')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeSubTab === 'upload'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Excel</span>
            </button>

            <button
              onClick={() => setActiveSubTab('history')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeSubTab === 'history'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Riwayat Upload ({batches.length})</span>
            </button>

            {viewMode !== 'upload_only' && (
              <button
                onClick={() => setActiveSubTab('settings')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeSubTab === 'settings'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Pengaturan Dashboard</span>
              </button>
            )}
          </div>

          {/* Global Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {tickets.length > 0 ? (
              <button
                onClick={handleClearAllHaiCso}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 transition-colors shadow-2xs cursor-pointer"
                title="Kosongkan seluruh data tiket dan batch untuk upload data asli"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Data HAICSO</span>
              </button>
            ) : (
              <button
                onClick={handleResetSampleHaiCso}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 transition-colors shadow-2xs cursor-pointer"
                title="Muat kembali data contoh/simulasi HAICSO lengkap (325 tiket)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Data Simulasi</span>
              </button>
            )}

            <button
              onClick={handleDownloadSampleExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Unduh contoh template excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Contoh Excel</span>
            </button>

            {viewMode !== 'upload_only' && (
              <>
                <button
                  onClick={handleDownloadBelumSelesaiPDF}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF Belum Selesai</span>
                </button>

                <button
                  onClick={handleDownloadAdminPDF}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Lengkap</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* GLOBAL ACTION NOTICE BANNER */}
      {globalNotice.show && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-all shadow-sm ${
          globalNotice.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : globalNotice.type === 'warning'
            ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
            : 'bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {globalNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <span>{globalNotice.message}</span>
          </div>
          <button
            onClick={() => setGlobalNotice({ show: false, type: 'info', message: '' })}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 1: MONITORING & ANALISIS */}
      {/* ========================================================================= */}
      {activeSubTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Top 10 Interactive Statistics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* 1. Total Tiket */}
            <button
              type="button"
              onClick={() => setDrilldownType('total_tiket')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-500/60 transition-all duration-200 text-left cursor-pointer group relative overflow-hidden"
              title="Klik untuk melihat rincian seluruh tiket"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Tiket
                </span>
                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Rincian ↗
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {summary.totalTickets}
                </span>
                <span className="text-[11px] text-slate-500">Tiket</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                <span>Klik untuk lihat semua tiket</span>
              </div>
            </button>

            {/* 2. Selesai */}
            <button
              type="button"
              onClick={() => setDrilldownType('selesai')}
              className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-500/70 transition-all duration-200 text-left cursor-pointer group relative overflow-hidden"
              title="Klik untuk melihat rincian tiket yang sudah selesai"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  Selesai (IKU)
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                  Rincian ↗
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  {summary.selesaiCount}
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  ({summary.persenSelesai}%)
                </span>
              </div>
              <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>Target IKU: {settings.target_selesai_persen || 90}%</span>
              </div>
            </button>

            {/* 3. Menunggu Respons Satker */}
            <button
              type="button"
              onClick={() => setDrilldownType('menunggu_satker')}
              className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-500/70 transition-all duration-200 text-left cursor-pointer group relative overflow-hidden"
              title="Klik untuk melihat mana saja tiket yang menunggu konfirmasi satker"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                  Menunggu Satker
                </span>
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 group-hover:underline">
                  Rincian ↗
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">
                  {summary.menungguSatkerCount}
                </span>
                <span className="text-[11px] text-slate-500">Tiket</span>
              </div>
              <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span>Perlu respon / data satker</span>
              </div>
            </button>

            {/* 4. Belum Ada Feedback */}
            <button
              type="button"
              onClick={() => setDrilldownType('belum_feedback')}
              className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-sm hover:shadow-md hover:border-rose-400 dark:hover:border-rose-500/70 transition-all duration-200 text-left cursor-pointer group relative overflow-hidden"
              title="Klik untuk melihat mana saja tiket yang belum feedback"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                  Belum Feedback
                </span>
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 group-hover:underline">
                  Rincian ↗
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">
                  {summary.belumFeedbackCount}
                </span>
                <span className="text-[11px] text-slate-500">Tiket</span>
              </div>
              <div className="mt-2 text-[10px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <span>Satker belum isi ulasan</span>
              </div>
            </button>

            {/* 5. Menunggu Respon KPPN */}
            <button
              type="button"
              onClick={() => setDrilldownType('menunggu_kppn')}
              className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500/70 transition-all duration-200 text-left cursor-pointer group relative overflow-hidden"
              title="Klik untuk melihat mana saja tiket yang sedang diproses KPPN"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                  Menunggu KPPN
                </span>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                  Rincian ↗
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">
                  {summary.menungguKppnCount}
                </span>
                <span className="text-[11px] text-slate-500">Tiket</span>
              </div>
              <div className="mt-2 text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <span>Antrean tindak lanjut FO/CSO</span>
              </div>
            </button>

            {/* 6. Kirim ke HAI */}
            <button
              type="button"
              onClick={() => setDrilldownType('kirim_hai')}
              className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 shadow-sm hover:shadow-md hover:border-purple-400 dark:hover:border-purple-500/70 transition-all duration-200 text-left cursor-pointer group relative overflow-hidden"
              title="Klik untuk melihat mana saja tiket yang dieskalasi ke HAI Pusat"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
                  Kirim ke HAI
                </span>
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 group-hover:underline">
                  Rincian ↗
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">
                  {summary.kirimHaiCount}
                </span>
                <span className="text-[11px] text-slate-500">Tiket</span>
              </div>
              <div className="mt-2 text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <span>Eskalasi kantor pusat</span>
              </div>
            </button>

            {/* 7. Total Pengguna */}
            <button
              type="button"
              onClick={() => setDrilldownType('total_pengguna')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-500/60 transition-all duration-200 text-left cursor-pointer group relative overflow-hidden"
              title="Klik untuk melihat daftar pemohon / pengguna tiket"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Pengguna
                </span>
                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Daftar ↗
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {summary.totalUsers}
                </span>
                <span className="text-[11px] text-slate-500">Orang</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                <span>Pemohon aktif berkonsultasi</span>
              </div>
            </button>

            {/* 8. Total Email */}
            <button
              type="button"
              onClick={() => setDrilldownType('total_email')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500/60 transition-all duration-200 text-left cursor-pointer group relative overflow-hidden"
              title="Klik untuk melihat daftar akun email pengirim tiket"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Email
                </span>
                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Daftar ↗
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {summary.totalEmails}
                </span>
                <span className="text-[11px] text-slate-500">Akun</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                <span>Akun email terdaftar</span>
              </div>
            </button>

            {/* 9. Satker Bertiket */}
            <button
              type="button"
              onClick={() => setDrilldownType('satker_bertiket')}
              className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-500/70 transition-all duration-200 text-left cursor-pointer group relative overflow-hidden"
              title="Klik untuk melihat daftar satker yang memiliki tiket"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  Satker Bertiket
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                  Daftar ↗
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {summary.totalSatkers}
                </span>
                <span className="text-[11px] text-slate-500">Satker</span>
              </div>
              <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>Satker yang pernah niket</span>
              </div>
            </button>

            {/* 10. Satker Belum Bertiket */}
            <button
              type="button"
              onClick={() => setDrilldownType('satker_belum_tiket')}
              className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 shadow-sm hover:shadow-md hover:border-rose-400 dark:hover:border-rose-500/70 transition-all duration-200 text-left cursor-pointer group relative overflow-hidden"
              title="Klik untuk melihat analisis satker yang belum pernah membuat tiket"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                  Belum Buat Tiket
                </span>
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 group-hover:underline">
                  Analisis ↗
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">
                  {satkerAnalysis.belumBertiketCount}
                </span>
                <span className="text-[11px] text-slate-500">Satker</span>
              </div>
              <div className="mt-2 text-[10px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <span>Belum pernah niket (0 tiket)</span>
              </div>
            </button>
          </div>

          {/* IKU Indicator Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Indikator Kinerja Utama (IKU) KPPN</span>
              </div>
              <h3 className="text-lg font-extrabold text-white">
                Monitoring Penyelesaian Tiket Layanan HAICSO
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Penyelesaian tiket secara tuntas dan pemberian feedback satker berdampak langsung terhadap capaian indeks kepuasan layanan dan IKU KPPN Semarang I.
              </p>
            </div>

            <div className="flex items-center gap-6 divide-x divide-slate-700/80">
              <div className="text-center px-3">
                <span className="text-xs text-emerald-400 font-semibold block">Tiket Selesai</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {summary.persenSelesai}%
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {summary.selesaiCount} dari {summary.totalTickets} tiket
                </span>
              </div>

              <div className="text-center pl-6">
                <span className="text-xs text-amber-400 font-semibold block">Belum Selesai</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-400">
                  {summary.persenBelumSelesai}%
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {summary.totalBelumSelesai} tiket tersisa
                </span>
              </div>
            </div>
          </div>

          {/* Email Specific Stats Badge if Email filter is selected */}
          {selectedEmailStats && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="font-bold">Statistik Khusus Email: {selectedEmailStats.email}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                <span>Total Tiket: <strong>{selectedEmailStats.total}</strong></span>
                <span className="text-emerald-700 dark:text-emerald-400">Selesai: <strong>{selectedEmailStats.selesai}</strong></span>
                <span className="text-amber-700 dark:text-amber-400">Belum Selesai: <strong>{selectedEmailStats.belum}</strong></span>
                <span className="text-rose-700 dark:text-rose-400">Belum Feedback: <strong>{selectedEmailStats.belumFeedback}</strong></span>
              </div>
            </div>
          )}

          {/* Simultaneous Comprehensive Filters Panel */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                <Filter className="w-4 h-4 text-amber-500" />
                <span>Filter Data Simultan (Multi-Kriteria)</span>
              </div>
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 transition-colors"
              >
                Reset Semua Filter
              </button>
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              {/* 1. Tahun */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Tahun Tiket</label>
                <select
                  value={filterYear}
                  onChange={e => { setFilterYear(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="ALL">Semua Tahun</option>
                  {distinctYears.map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>

              {/* 2. Triwulan (Triwulan I - IV) */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Triwulan (Dasar Tanggal Tiket)
                </label>
                <select
                  value={filterTriwulan}
                  onChange={e => { setFilterTriwulan(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="ALL">Semua Triwulan</option>
                  <option value="Triwulan I">Triwulan I (Jan - Mar)</option>
                  <option value="Triwulan II">Triwulan II (Apr - Jun)</option>
                  <option value="Triwulan III">Triwulan III (Jul - Sep)</option>
                  <option value="Triwulan IV">Triwulan IV (Okt - Des)</option>
                </select>
              </div>

              {/* 3. Rentang Tanggal Mulai */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={e => { setFilterStartDate(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* 4. Rentang Tanggal Selesai */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={e => { setFilterEndDate(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* 5. Status Utama */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Status Utama</label>
                <select
                  value={filterStatus}
                  onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="ALL">Semua Status Utama</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Menunggu Satker">Menunggu konfirmasi/respons Satker</option>
                  <option value="Menunggu KPPN">Menunggu konfirmasi/respon KPPN</option>
                  <option value="Kirim ke HAI">Kirim ke HAI</option>
                </select>
              </div>

              {/* 6. Status Feedback */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Status Feedback</label>
                <select
                  value={filterFeedback}
                  onChange={e => { setFilterFeedback(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="ALL">Semua Status Feedback</option>
                  <option value="SUDAH">Sudah ada feedback</option>
                  <option value="BELUM">Belum ada feedback</option>
                </select>
              </div>

              {/* 7. Email Pengguna */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Email Pengguna</label>
                <select
                  value={filterEmail}
                  onChange={e => { setFilterEmail(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="ALL">Semua Email Pengguna</option>
                  {distinctEmails.map(email => (
                    <option key={email} value={email}>{email}</option>
                  ))}
                </select>
              </div>

              {/* 8. Pengguna */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Nama Pengguna</label>
                <select
                  value={filterUser}
                  onChange={e => { setFilterUser(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="ALL">Semua Pengguna</option>
                  {distinctUsers.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>

              {/* 9. Satker */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Satuan Kerja</label>
                <select
                  value={filterSatker}
                  onChange={e => { setFilterSatker(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="ALL">Semua Satuan Kerja</option>
                  {distinctSatkers.map(satker => (
                    <option key={satker} value={satker}>{satker}</option>
                  ))}
                </select>
              </div>

              {/* 10. Kode Satker */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Kode Satker (6 Digit)</label>
                <input
                  type="text"
                  value={filterKodeSatker}
                  onChange={e => { setFilterKodeSatker(e.target.value); setCurrentPage(1); }}
                  placeholder="Misal: 409552"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* 11. Petugas CSO */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Petugas CSO</label>
                <select
                  value={filterCso}
                  onChange={e => { setFilterCso(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="ALL">Semua CSO</option>
                  {distinctCsos.map(cso => (
                    <option key={cso} value={cso}>{cso}</option>
                  ))}
                </select>
              </div>

              {/* 12. Pencarian Bebas */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Cari No Ref / Subjek</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Cari kata kunci..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>
          </div>

          {/* Visual Analytics Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart A: Jumlah Tiket per Triwulan */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Jumlah Tiket per Triwulan (Dasar Tanggal Tiket)
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Distribusi tiket berdasarkan triwulan pembuatan tiket
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quarterChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="selesai" name="Selesai" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="belumSelesai" name="Belum Selesai" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart B: Distribusi Status Tiket */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Distribusi Status Tiket
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Persentase dan komposisi status seluruh tiket
              </p>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart C: Tren Tiket per Bulan */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Tren Jumlah Tiket per Bulan (Tahun 2026)
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Volume tiket layanan HAICSO yang masuk dari Satker setiap bulan
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="bulan" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="tiket" name="Jumlah Tiket" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart D: Top 10 Pengguna */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Top 10 Pengguna Pengirim Tiket Terbanyak
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Frekuensi pengiriman tiket terbanyak berdasarkan pemohon
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topUsersChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" fontSize={11} />
                    <YAxis type="category" dataKey="nama" fontSize={10} width={90} />
                    <Tooltip />
                    <Bar dataKey="tiket" name="Total Tiket" fill="#d97706" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Frekuensi Pengiriman Tiket Section ("Siapa mengirim berapa kali?") */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>Frekuensi Pengiriman Tiket Satker</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Analisis intensitas pengiriman tiket per pengguna dan per email satker
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setFrequencyTab('user')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    frequencyTab === 'user'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Per Pengguna ({userFrequency.length})
                </button>
                <button
                  onClick={() => setFrequencyTab('email')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    frequencyTab === 'email'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Per Email ({emailFrequency.length})
                </button>
              </div>
            </div>

            {/* Frequency Table */}
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              {frequencyTab === 'user' ? (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">No</th>
                      <th className="py-2.5 px-3">Nama Pengguna</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Satuan Kerja</th>
                      <th className="py-2.5 px-3 text-center">Total Tiket</th>
                      <th className="py-2.5 px-3 text-center text-emerald-600">Selesai</th>
                      <th className="py-2.5 px-3 text-center text-amber-600">Menunggu Satker</th>
                      <th className="py-2.5 px-3 text-center text-rose-600">Belum Feedback</th>
                      <th className="py-2.5 px-3 text-center w-20">Filter</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {userFrequency.map((u, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-center text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3 font-semibold">{u.nama_pengguna}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">{u.email || '-'}</td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 line-clamp-1">{u.nama_satker}</td>
                        <td className="py-2 px-3 text-center font-bold text-amber-700 dark:text-amber-400">{u.totalTiket} kali</td>
                        <td className="py-2 px-3 text-center font-semibold text-emerald-600">{u.selesai}</td>
                        <td className="py-2 px-3 text-center font-semibold text-amber-600">{u.menungguSatker}</td>
                        <td className="py-2 px-3 text-center font-semibold text-rose-600">{u.belumFeedback}</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => { setFilterUser(u.nama_pengguna); setCurrentPage(1); }}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 text-slate-700 dark:text-slate-300"
                          >
                            Pilih
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">No</th>
                      <th className="py-2.5 px-3">Email Pengguna</th>
                      <th className="py-2.5 px-3">Nama Pemohon</th>
                      <th className="py-2.5 px-3">Satuan Kerja</th>
                      <th className="py-2.5 px-3 text-center">Frekuensi Tiket</th>
                      <th className="py-2.5 px-3 text-center text-emerald-600">Selesai</th>
                      <th className="py-2.5 px-3 text-center text-amber-600">Belum Selesai</th>
                      <th className="py-2.5 px-3 text-center text-rose-600">Belum Feedback</th>
                      <th className="py-2.5 px-3 text-center w-20">Filter</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {emailFrequency.map((e, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-center text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100">{e.email}</td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{e.nama_pengguna}</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400 line-clamp-1">{e.nama_satker}</td>
                        <td className="py-2 px-3 text-center font-bold text-amber-700 dark:text-amber-400">{e.totalTiket} kali</td>
                        <td className="py-2 px-3 text-center font-semibold text-emerald-600">{e.selesai}</td>
                        <td className="py-2 px-3 text-center font-semibold text-amber-600">{e.belumSelesai}</td>
                        <td className="py-2 px-3 text-center font-semibold text-rose-600">{e.belumFeedback}</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => { setFilterEmail(e.email); setCurrentPage(1); }}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 text-slate-700 dark:text-slate-300"
                          >
                            Pilih
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Analisis per Satker Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Analisis Tiket Berdasarkan Satuan Kerja</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rekapitulasi total tiket, selesai, dan yang masih menunggu respon satker
              </p>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">No</th>
                    <th className="py-2.5 px-3">Nama Satker</th>
                    <th className="py-2.5 px-3 text-center w-20">Kode</th>
                    <th className="py-2.5 px-3 text-center">Total Tiket</th>
                    <th className="py-2.5 px-3 text-center text-emerald-600">Selesai</th>
                    <th className="py-2.5 px-3 text-center text-amber-600">Menunggu Satker</th>
                    <th className="py-2.5 px-3 text-center text-rose-600">Belum Feedback</th>
                    <th className="py-2.5 px-3 text-center text-blue-600">Menunggu KPPN</th>
                    <th className="py-2.5 px-3 text-center text-purple-600">Kirim HAI</th>
                    <th className="py-2.5 px-3 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {satkerSummary.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-center text-slate-500">{i + 1}</td>
                      <td className="py-2 px-3 font-semibold">{s.nama_satker}</td>
                      <td className="py-2 px-3 text-center font-mono">{s.kode_satker}</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900 dark:text-slate-100">{s.totalTiket}</td>
                      <td className="py-2 px-3 text-center font-semibold text-emerald-600">{s.selesai}</td>
                      <td className="py-2 px-3 text-center font-semibold text-amber-600">{s.menungguSatker}</td>
                      <td className="py-2 px-3 text-center font-semibold text-rose-600">{s.belumFeedback}</td>
                      <td className="py-2 px-3 text-center font-semibold text-blue-600">{s.menungguKppn}</td>
                      <td className="py-2 px-3 text-center font-semibold text-purple-600">{s.kirimHai}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => { setFilterSatker(s.nama_satker); setCurrentPage(1); }}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-700 dark:text-slate-300"
                        >
                          Filter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Main Full Data Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Daftar Rinci Seluruh Tiket HAICSO
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ditemukan <strong>{filteredTickets.length}</strong> tiket sesuai kriteria filter aktif
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-3 text-center w-10">No</th>
                    <th className="py-3 px-3">Satuan Kerja</th>
                    <th className="py-3 px-3 text-center w-16">Kode</th>
                    <th className="py-3 px-3">Pemohon & Email</th>
                    <th className="py-3 px-3">Tanggal Tiket</th>
                    <th className="py-3 px-3">No. Referensi</th>
                    <th className="py-3 px-3">Subjek</th>
                    <th className="py-3 px-3 text-center">Status Utama</th>
                    <th className="py-3 px-3 text-center">Feedback</th>
                    <th className="py-3 px-3">CSO</th>
                    <th className="py-3 px-3 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {paginatedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-slate-400">
                        Tidak ada tiket yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedTickets.map((t, idx) => {
                      const itemIndex = (currentPage - 1) * pageSize + idx + 1;
                      const isSelesai = (t.status || '').toLowerCase().includes('selesai');
                      const isMenungguSatker = (t.status || '').toLowerCase().includes('respons satker');
                      const isMenungguKppn = (t.status || '').toLowerCase().includes('respon kppn');
                      const isKirimHai = (t.status || '').toLowerCase().includes('hai');
                      const isBelumFeedback = (t.status_feedback || '').toLowerCase().includes('belum');

                      return (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 text-center text-slate-500">{itemIndex}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{t.nama_satker}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                              {t.kode_satker || '-'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-900 dark:text-slate-100">{t.nama_pengguna}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{t.email}</div>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] whitespace-nowrap text-slate-600 dark:text-slate-400">
                            {t.tanggal_tiket}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                            {t.nomor_referensi}
                          </td>
                          <td className="py-2.5 px-3 max-w-xs">
                            <p className="line-clamp-2 text-slate-700 dark:text-slate-300">{t.subjek}</p>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isSelesai
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : isMenungguSatker
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : isMenungguKppn
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isBelumFeedback
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                              }`}
                            >
                              {t.status_feedback}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {t.cso || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => setSelectedTicket(t)}
                              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Lihat rincian lengkap"
                            >
                              <Eye className="w-4 h-4 text-amber-500" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: UPLOAD EXCEL */}
      {/* ========================================================================= */}
      {activeSubTab === 'upload' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-500" />
                <span>Upload & Normalisasi Data Tiket HAICSO</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Upload file Excel ekspor dari portal HAICSO (Sheet <code>Data</code>). Sistem secara otomatis menggabungkan struktur 3-baris per tiket menjadi 1 record tiket terpadu, menghitung triwulan berdasarkan tanggal tiket, dan melakukan de-duplikasi berdasarkan No. Referensi Tiket.
              </p>
            </div>
            <button
              onClick={handleDownloadSampleExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Contoh Excel</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-2xl p-8 text-center transition-colors">
            <input
              type="file"
              accept=".xlsx, .xls"
              id="haicso-excel-upload"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="haicso-excel-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {uploadFile ? uploadFile.name : 'Klik untuk memilih file Excel Tiket HAICSO (.xlsx)'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Format resmi ekspor HAICSO (Header Row 6: NO, Nama Email, Tanggal, No Ref Subjek, Status, CSO, Detail)
                </p>
              </div>
              <span className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all mt-1">
                Pilih File Excel
              </span>
            </label>
          </div>

          {/* Error Notice */}
          {uploadError && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessingUpload && (
            <div className="p-8 text-center text-xs text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
              <span>Sedang memproses dan menormalisasi 3-baris record tiket HAICSO...</span>
            </div>
          )}

          {/* Pre-Import Validation & Acceptance Preview */}
          {parsedPreview && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Validasi Pre-Import Berhasil! ({parsedPreview.batch.total_records} Tiket Ditemukan)</span>
                </h4>
                <button
                  onClick={handleCommitUpload}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan & Terapkan ke Database</span>
                </button>
              </div>

              {/* Mode Penerapan Data */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-2">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                  Pilih Cara Penerapan ke Database:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    uploadMode === 'replace'
                      ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-sm text-blue-900 dark:text-blue-200 font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900/50'
                  }`}>
                    <input
                      type="radio"
                      name="uploadMode"
                      checked={uploadMode === 'replace'}
                      onChange={() => setUploadMode('replace')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold">Gantikan Seluruh Data Lama</div>
                      <div className="text-[11px] opacity-80 font-normal mt-0.5">
                        Bersihkan data simulasi/lama dan jadikan {parsedPreview.batch.total_records} tiket ini sebagai satu-satunya data aktif.
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    uploadMode === 'merge'
                      ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-sm text-blue-900 dark:text-blue-200 font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900/50'
                  }`}>
                    <input
                      type="radio"
                      name="uploadMode"
                      checked={uploadMode === 'merge'}
                      onChange={() => setUploadMode('merge')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold">Gabungkan (Merge Data)</div>
                      <div className="text-[11px] opacity-80 font-normal mt-0.5">
                        Tambahkan tiket baru dan perbarui tiket lama yang memiliki Nomor Referensi sama.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">Total Tiket Ditemukan:</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {parsedPreview.batch.total_records} Tiket
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">Status Selesai:</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {parsedPreview.batch.selesai_count} Tiket
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">Menunggu Satker:</span>
                  <span className="text-lg font-bold text-amber-600">
                    {parsedPreview.batch.menunggu_satker_count} Tiket
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 block">Belum Ada Feedback:</span>
                  <span className="text-lg font-bold text-rose-600">
                    {parsedPreview.batch.belum_feedback_count} Tiket
                  </span>
                </div>
              </div>

              {/* Preview 5 rows table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-semibold text-slate-600">
                    <tr>
                      <th className="py-2 px-3">No</th>
                      <th className="py-2 px-3">Satker</th>
                      <th className="py-2 px-3">Pemohon</th>
                      <th className="py-2 px-3">Tanggal</th>
                      <th className="py-2 px-3">No Ref</th>
                      <th className="py-2 px-3">Subjek</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedPreview.records.slice(0, 5).map((t, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold">{t.nama_satker}</td>
                        <td className="py-2 px-3">{t.nama_pengguna} ({t.email})</td>
                        <td className="py-2 px-3">{t.tanggal_tiket}</td>
                        <td className="py-2 px-3 font-mono font-bold">{t.nomor_referensi}</td>
                        <td className="py-2 px-3 max-w-xs truncate">{t.subjek}</td>
                        <td className="py-2 px-3 font-bold">{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: RIWAYAT UPLOAD */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                <span>Riwayat Batch Upload Excel HAICSO</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar file Excel yang pernah diunggah beserta statistik rekonsiliasi tiket
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {batches.length} Batch ({tickets.length} Tiket)
              </span>

              {tickets.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearAllHaiCso}
                  className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Kosongkan seluruh data tiket HAICSO agar siap upload data asli"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan Seluruh Data HAICSO</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetSampleHaiCso}
                  className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Muat kembali data contoh/simulasi HAICSO lengkap (325 tiket)"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Muat Data Simulasi</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Batch ID</th>
                  <th className="py-2.5 px-3">Nama File</th>
                  <th className="py-2.5 px-3">Waktu Upload</th>
                  <th className="py-2.5 px-3">Rentang Tanggal</th>
                  <th className="py-2.5 px-3 text-center">Total Tiket</th>
                  <th className="py-2.5 px-3 text-center">Selesai</th>
                  <th className="py-2.5 px-3 text-center">Menunggu Satker</th>
                  <th className="py-2.5 px-3">Pengunggah</th>
                  <th className="py-2.5 px-3 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="max-w-md mx-auto space-y-2">
                        <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                          Basis Data HAICSO Kosong
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Seluruh batch dan tiket telah dibersihkan. Anda sekarang dapat beralih ke subtab <strong>"Upload Excel"</strong> untuk mengunggah berkas data asli Anda.
                        </p>
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveSubTab('upload')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Buka Form Upload Excel</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleResetSampleHaiCso}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Muat Data Simulasi (325 Tiket)</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  batches.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono font-bold text-amber-700 dark:text-amber-400">{b.id}</td>
                      <td className="py-2 px-3 font-semibold">{b.file_name}</td>
                      <td className="py-2 px-3 text-slate-500">{new Date(b.upload_date).toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-slate-500">{b.period_start} s.d {b.period_end}</td>
                      <td className="py-2 px-3 text-center font-bold">{b.total_records}</td>
                      <td className="py-2 px-3 text-center text-emerald-600 font-bold">{b.selesai_count}</td>
                      <td className="py-2 px-3 text-center text-amber-600 font-bold">{b.menunggu_satker_count}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{b.uploaded_by}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteBatch(b.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                          title="Hapus batch ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: PENGATURAN DASHBOARD */}
      {/* ========================================================================= */}
      {activeSubTab === 'settings' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              <span>Pengaturan Dashboard Monitoring Tiket HAICSO</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Atur status aktif/nonaktif tab dashboard pada sisi pengguna Satker serta target IKU KPPN.
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Status Visibilitas Dashboard Satker
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {settingsActive
                  ? 'AKTIF: Tab "Monitoring Tiket HAICSO" ditampilkan pada Dashboard Satker'
                  : 'NONAKTIF: Tab disembunyikan dari seluruh pengguna Satker'}
              </p>
            </div>
            <button
              onClick={() => setSettingsActive(!settingsActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settingsActive ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settingsActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Target IKU */}
          <div className="space-y-1.5 text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Target Penyelesaian Tiket Selesai (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={settingsTarget}
              onChange={e => setSettingsTarget(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
            <p className="text-[11px] text-slate-500">Standar target indikator IKU KPPN (e.g. 95%)</p>
          </div>

          {/* Catatan KPPN */}
          <div className="space-y-1.5 text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Catatan / Arahan Tindak Lanjut KPPN
            </label>
            <textarea
              rows={3}
              value={settingsNotes}
              onChange={e => setSettingsNotes(e.target.value)}
              placeholder="Tuliskan catatan arahan resmi bagi satuan kerja..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSaveSettings}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all"
            >
              Simpan Pengaturan
            </button>

            {settingsSavedNotice && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Pengaturan berhasil disimpan ke database!
              </span>
            )}
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <HaiCsoTicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* Interactive Drilldown Modal for Detailed Metrics */}
      {drilldownType && (
        <HaiCsoDrilldownModal
          type={drilldownType}
          onClose={() => setDrilldownType(null)}
          tickets={tickets}
          masterSatkers={masterSatkers}
          onSelectTicket={(ticket) => setSelectedTicket(ticket)}
          onApplyFilter={handleApplyDrilldownFilter}
          isDark={isDark}
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-2xl shrink-0 ${
                confirmModal.actionType === 'reset_sample'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
              }`}>
                {confirmModal.actionType === 'reset_sample' ? (
                  <RefreshCw className="w-5 h-5" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {confirmModal.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeModalConfirm}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
                  confirmModal.actionType === 'reset_sample'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                }`}
              >
                {confirmModal.actionType === 'reset_sample' ? (
                  <RefreshCw className="w-3.5 h-3.5" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{confirmModal.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
