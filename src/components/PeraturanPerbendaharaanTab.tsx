import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scale, 
  Search, 
  Filter, 
  BookOpen, 
  FileText, 
  ExternalLink, 
  Download, 
  Copy, 
  Check, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Bookmark, 
  Layers, 
  Calendar, 
  Tag, 
  SlidersHorizontal, 
  ChevronRight, 
  X, 
  Save, 
  RotateCcw,
  Clock,
  Building2,
  FileCheck,
  Share2,
  Info,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { 
  PeraturanPerbendaharaanItem, 
  KategoriPeraturan, 
  StatusPeraturan, 
  AppTheme, 
  DashboardConfig, 
  AppUser, 
  NavigationTab 
} from '../types';
import { INITIAL_PERATURAN_LIST } from '../data/initialPeraturanData';
import { safeLocalStorageSet } from '../utils/safeStorage';
import { useToast } from './ToastNotification';
import { ModernConfirmModal, ConfirmModalState } from './ModernConfirmModal';
import { PaginationControl } from './PaginationControl';

interface PeraturanPerbendaharaanTabProps {
  isAdminAuthenticated: boolean;
  currentUser?: AppUser | null;
  theme: AppTheme;
  dashboardConfig: DashboardConfig;
  onUpdateDashboardConfig?: (newConfig: DashboardConfig) => void;
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const PeraturanPerbendaharaanTab: React.FC<PeraturanPerbendaharaanTabProps> = ({
  isAdminAuthenticated,
  currentUser,
  theme,
  dashboardConfig,
  onUpdateDashboardConfig,
  onNavigateTab
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const isTamu = currentUser?.role === 'tamu';
  const isRealAdmin = isAdminAuthenticated && !isTamu;

  // Local state for regulations list
  const [peraturanList, setPeraturanList] = useState<PeraturanPerbendaharaanItem[]>(() => {
    if (dashboardConfig.peraturanPerbendaharaanList && dashboardConfig.peraturanPerbendaharaanList.length > 0) {
      return dashboardConfig.peraturanPerbendaharaanList;
    }
    try {
      const saved = localStorage.getItem('kppn_peraturan_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading saved regulations:', e);
    }
    return INITIAL_PERATURAN_LIST;
  });

  // Sync with dashboardConfig updates
  useEffect(() => {
    if (dashboardConfig.peraturanPerbendaharaanList && dashboardConfig.peraturanPerbendaharaanList.length > 0) {
      setPeraturanList(dashboardConfig.peraturanPerbendaharaanList);
    }
  }, [dashboardConfig.peraturanPerbendaharaanList]);

  // View state: 'public' (preview tampilan satker) vs 'admin_manage' (kelola regulasi)
  const [viewMode, setViewMode] = useState<'public' | 'admin_manage'>('public');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [selectedTopik, setSelectedTopik] = useState<string>('ALL');
  const [selectedTahun, setSelectedTahun] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'terbaru' | 'terlama' | 'nomor' | 'populer'>('terbaru');
  const [displayLayout, setDisplayLayout] = useState<'grid' | 'list'>('grid');

  // Preview Modal State
  const [selectedItemForPreview, setSelectedItemForPreview] = useState<PeraturanPerbendaharaanItem | null>(null);
  const [previewActiveTab, setPreviewActiveTab] = useState<'ringkasan' | 'sakti' | 'dokumen'>('ringkasan');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Admin Form Modal State (Add / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PeraturanPerbendaharaanItem | null>(null);
  const [formData, setFormData] = useState<Partial<PeraturanPerbendaharaanItem>>({
    nomor: '',
    tahun: new Date().getFullYear(),
    judul: '',
    kategori: 'PMK',
    topik: [],
    status: 'Berlaku',
    keteranganStatus: '',
    ringkasan: '',
    poinPenting: [''],
    fileUrl: '',
    jdihUrl: '',
    penyusun: 'Kementerian Keuangan RI / Ditjen Perbendaharaan',
    isFeatured: false,
    palingSeringDicari: false,
    implikasiSatker: {
      kpa: '',
      ppk: '',
      ppspm: '',
      bendahara: ''
    },
    saktiModulTerkait: ['Pembayaran']
  });

  // Topik input buffer for form
  const [topikInput, setTopikInput] = useState('');

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Ya',
    cancelText: 'Batal',
    variant: 'danger',
    onConfirm: () => {}
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Available unique topics across all regulations
  const allTopikOptions = useMemo(() => {
    const set = new Set<string>();
    peraturanList.forEach(item => {
      item.topik.forEach(t => set.add(t));
    });
    return Array.from(set).sort();
  }, [peraturanList]);

  // Available unique years
  const allTahunOptions = useMemo(() => {
    const set = new Set<number>();
    peraturanList.forEach(item => set.add(item.tahun));
    return Array.from(set).sort((a, b) => b - a);
  }, [peraturanList]);

  // Filtering and Sorting logic
  const filteredList = useMemo(() => {
    return peraturanList.filter(item => {
      // Category filter
      if (selectedKategori !== 'ALL' && item.kategori !== selectedKategori) return false;
      // Topic filter
      if (selectedTopik !== 'ALL' && !item.topik.includes(selectedTopik)) return false;
      // Year filter
      if (selectedTahun !== 'ALL' && item.tahun.toString() !== selectedTahun) return false;
      // Status filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNomor = item.nomor.toLowerCase().includes(q);
        const matchJudul = item.judul.toLowerCase().includes(q);
        const matchRingkasan = item.ringkasan.toLowerCase().includes(q);
        const matchTopik = item.topik.some(t => t.toLowerCase().includes(q));
        const matchPoin = item.poinPenting.some(p => p.toLowerCase().includes(q));
        const matchPenyusun = (item.penyusun || '').toLowerCase().includes(q);
        if (!matchNomor && !matchJudul && !matchRingkasan && !matchTopik && !matchPoin && !matchPenyusun) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'terbaru') {
        if (b.tahun !== a.tahun) return b.tahun - a.tahun;
        return (b.tanggalDitetapkan || '').localeCompare(a.tanggalDitetapkan || '');
      }
      if (sortBy === 'terlama') {
        if (a.tahun !== b.tahun) return a.tahun - b.tahun;
        return (a.tanggalDitetapkan || '').localeCompare(b.tanggalDitetapkan || '');
      }
      if (sortBy === 'nomor') {
        return a.nomor.localeCompare(b.nomor);
      }
      if (sortBy === 'populer') {
        if (a.palingSeringDicari && !b.palingSeringDicari) return -1;
        if (!a.palingSeringDicari && b.palingSeringDicari) return 1;
        return b.tahun - a.tahun;
      }
      return 0;
    });
  }, [peraturanList, selectedKategori, selectedTopik, selectedTahun, selectedStatus, searchQuery, sortBy]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedKategori, selectedTopik, selectedTahun, selectedStatus, sortBy]);

  // Save changes to state, localStorage & Cloud
  const savePeraturanList = (newList: PeraturanPerbendaharaanItem[]) => {
    setPeraturanList(newList);
    safeLocalStorageSet('kppn_peraturan_list', JSON.stringify(newList));
    if (onUpdateDashboardConfig) {
      const updatedConfig: DashboardConfig = {
        ...dashboardConfig,
        peraturanPerbendaharaanList: newList,
        updateDates: {
          ...dashboardConfig.updateDates,
          peraturan: new Date().toISOString()
        }
      };
      onUpdateDashboardConfig(updatedConfig);
    }
  };

  // Copy citation helper
  const handleCopyCitation = (item: PeraturanPerbendaharaanItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const citation = `${item.nomor} tentang ${item.judul}`;
    navigator.clipboard.writeText(citation).then(() => {
      setCopiedId(item.id);
      showToast(`Kutipan dasar hukum disalin: "${item.nomor}"`, 'success');
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => {
      showToast('Gagal menyalin teks ke clipboard.', 'error');
    });
  };

  // Open Form Modal for Create
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      nomor: '',
      tahun: new Date().getFullYear(),
      judul: '',
      kategori: 'PMK',
      topik: ['Pelaksanaan Anggaran'],
      status: 'Berlaku',
      keteranganStatus: '',
      ringkasan: '',
      poinPenting: [''],
      fileUrl: '',
      jdihUrl: '',
      penyusun: 'Kementerian Keuangan RI / Ditjen Perbendaharaan',
      isFeatured: false,
      palingSeringDicari: false,
      implikasiSatker: {
        kpa: '',
        ppk: '',
        ppspm: '',
        bendahara: ''
      },
      saktiModulTerkait: ['Pembayaran']
    });
    setTopikInput('');
    setIsFormModalOpen(true);
  };

  // Open Form Modal for Edit
  const handleOpenEditModal = (item: PeraturanPerbendaharaanItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setFormData({
      ...item,
      poinPenting: item.poinPenting.length > 0 ? [...item.poinPenting] : ['']
    });
    setTopikInput('');
    setIsFormModalOpen(true);
  };

  // Save form handler
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomor || !formData.judul || !formData.tahun) {
      showToast('Nomor, Judul, dan Tahun wajib diisi!', 'warning');
      return;
    }

    const cleanPoin = (formData.poinPenting || []).filter(p => p.trim() !== '');

    if (editingItem) {
      // Update existing
      const updatedList = peraturanList.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            ...(formData as PeraturanPerbendaharaanItem),
            poinPenting: cleanPoin.length > 0 ? cleanPoin : ['Belum ada poin penting spesifik']
          };
        }
        return item;
      });
      savePeraturanList(updatedList);
      showToast(`Regulasi ${formData.nomor} berhasil diperbarui!`, 'success');
    } else {
      // Create new
      const newItem: PeraturanPerbendaharaanItem = {
        id: `reg-${Date.now()}`,
        nomor: formData.nomor || '',
        tahun: Number(formData.tahun) || new Date().getFullYear(),
        judul: formData.judul || '',
        kategori: formData.kategori || 'PMK',
        topik: formData.topik && formData.topik.length > 0 ? formData.topik : ['Umum'],
        tanggalDitetapkan: formData.tanggalDitetapkan || '',
        tanggalBerlaku: formData.tanggalBerlaku || '',
        status: formData.status || 'Berlaku',
        keteranganStatus: formData.keteranganStatus || '',
        ringkasan: formData.ringkasan || '',
        poinPenting: cleanPoin.length > 0 ? cleanPoin : ['Ketentuan berlaku sebagaimana tercantum dalam dokumen resmi.'],
        fileUrl: formData.fileUrl || '',
        jdihUrl: formData.jdihUrl || '',
        penyusun: formData.penyusun || 'Kementerian Keuangan RI',
        isFeatured: !!formData.isFeatured,
        palingSeringDicari: !!formData.palingSeringDicari,
        implikasiSatker: formData.implikasiSatker,
        saktiModulTerkait: formData.saktiModulTerkait || ['Pembayaran']
      };
      savePeraturanList([newItem, ...peraturanList]);
      showToast(`Regulasi baru "${newItem.nomor}" berhasil ditambahkan!`, 'success');
    }

    setIsFormModalOpen(false);
  };

  // Delete handler
  const handleDeleteItem = (item: PeraturanPerbendaharaanItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Regulasi',
      message: `Apakah Anda yakin ingin menghapus data regulasi "${item.nomor}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Regulasi',
      cancelText: 'Batal',
      variant: 'danger',
      onConfirm: () => {
        const filtered = peraturanList.filter(i => i.id !== item.id);
        savePeraturanList(filtered);
        if (selectedItemForPreview?.id === item.id) {
          setSelectedItemForPreview(null);
        }
        showToast(`Regulasi "${item.nomor}" berhasil dihapus.`, 'info');
      }
    });
  };

  // Reset to default
  const handleResetToDefault = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Kembalikan Regulasi Bawaan',
      message: 'Apakah Anda yakin ingin mengembalikan seluruh daftar peraturan perbendaharaan ke data standar resmi KPPN Semarang I? Perubahan kustom akan ditimpa.',
      confirmText: 'Ya, Kembalikan',
      cancelText: 'Batal',
      variant: 'warning',
      onConfirm: () => {
        savePeraturanList(INITIAL_PERATURAN_LIST);
        showToast('Daftar regulasi berhasil dikembalikan ke standar awal!', 'success');
      }
    });
  };

  // Category badge style generator
  const getCategoryBadgeClass = (kategori: KategoriPeraturan) => {
    switch (kategori) {
      case 'PMK':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'PER-DJPb':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'PP / UU':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'KEP / SE':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'JUKNIS':
      default:
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-300 dark:border-teal-800';
    }
  };

  // Status badge style generator
  const getStatusBadge = (status: StatusPeraturan) => {
    switch (status) {
      case 'Berlaku':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Berlaku
          </span>
        );
      case 'Mengubah':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-300 dark:border-amber-800 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Mengubah
          </span>
        );
      case 'Dicabut':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-300 dark:border-rose-800 shadow-2xs line-through opacity-70">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Dicabut
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* HERO / HEADER SECTION */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black tracking-wide uppercase">
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direktori Hukum & Regulasi Perbendaharaan RI</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex flex-wrap items-center gap-2">
              <span>Peraturan Perbendaharaan Terkini</span>
              <span className="text-amber-400 text-lg sm:text-2xl font-bold">(Satker KPPN)</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Pusat referensi dan preview regulasi resmi pengelolaan keuangan negara: Undang-Undang, Peraturan Pemerintah, PMK, PER/SE Dirjen Perbendaharaan, Standar Biaya Masukan (SBM), dan petunjuk teknis pelaksanaan APBN.
            </p>
          </div>

          {/* Action / View Switch Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {isRealAdmin && (
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-inner">
                <button
                  type="button"
                  onClick={() => setViewMode('public')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'public'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Satker</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('admin_manage')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'admin_manage'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Kelola (Admin)</span>
                </button>
              </div>
            )}

            {isRealAdmin && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30 border border-emerald-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Regulasi</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Regulasi</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{peraturanList.length} <span className="text-xs font-medium text-slate-400">Aturan</span></div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">PMK Terkini</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5">
              {peraturanList.filter(p => p.kategori === 'PMK').length} <span className="text-xs font-medium text-slate-400">Regulasi</span>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">PER DJPb / Juknis</span>
            <div className="text-xl sm:text-2xl font-black text-blue-300 mt-0.5">
              {peraturanList.filter(p => p.kategori === 'PER-DJPb' || p.kategori === 'JUKNIS').length} <span className="text-xs font-medium text-slate-400">Juknis</span>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Status Berlaku</span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
              {peraturanList.filter(p => p.status === 'Berlaku').length} <span className="text-xs font-medium text-slate-400">Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ADMIN CONTROLS BAR (IF IN ADMIN_MANAGE MODE) */}
      {/* ============================================================== */}
      {isRealAdmin && viewMode === 'admin_manage' && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-indigo-950 dark:text-indigo-200">
                Mode Kelola Regulasi Perbendaharaan (Hak Akses Admin)
              </h3>
              <p className="text-xs text-indigo-700 dark:text-indigo-400">
                Anda dapat menambah, menyunting, mengubah status berlaku, atau menghapus daftar peraturan perbendaharaan yang tampil di Satker.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Standar</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baru</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SEARCH, FILTER & TOOLBAR */}
      {/* ============================================================== */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm space-y-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Top Row: Search Input + Sort + Layout Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari regulasi: ketik nomor (PMK 62, PER-5), judul, tahun, kata kunci (UP, SBM, KKP, SAKTI)..."
              className={`w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm border transition-all outline-none ${
                isDark 
                  ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Urutkan Peraturan"
                className={`py-2 px-3 pr-8 rounded-xl text-xs font-bold border transition-all cursor-pointer outline-none appearance-none ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-white border-slate-300 text-slate-700'
                }`}
              >
                <option value="terbaru">Tahun Terbaru</option>
                <option value="terlama">Tahun Terlama</option>
                <option value="nomor">Urut Nomor (A-Z)</option>
                <option value="populer">Paling Sering Dicari</option>
              </select>
              <SlidersHorizontal className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Layout Toggle */}
            <div className={`flex items-center p-1 rounded-xl border ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setDisplayLayout('grid')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  displayLayout === 'grid'
                    ? (isDark ? 'bg-slate-700 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs')
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Tampilan Grid Kartu"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDisplayLayout('list')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  displayLayout === 'list'
                    ? (isDark ? 'bg-slate-700 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs')
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Tampilan Daftar Ringkas"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Second Row: Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Kategori:
          </span>
          {(['ALL', 'PMK', 'PER-DJPb', 'PP / UU', 'KEP / SE'] as const).map((kat) => {
            const isSelected = selectedKategori === kat;
            const count = kat === 'ALL' 
              ? peraturanList.length 
              : peraturanList.filter(i => i.kategori === kat).length;

            return (
              <button
                key={kat}
                type="button"
                onClick={() => setSelectedKategori(kat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-400/40'
                    : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>{kat === 'ALL' ? 'Semua Kategori' : kat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-emerald-700 text-emerald-100' : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Third Row: Topic Quick Pills & Year/Status Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Topic Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto max-w-2xl py-0.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Topik:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTopik('ALL')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                selectedTopik === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : isDark ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            {allTopikOptions.slice(0, 8).map((topik) => (
              <button
                key={topik}
                type="button"
                onClick={() => setSelectedTopik(topik === selectedTopik ? 'ALL' : topik)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate max-w-[150px] ${
                  selectedTopik === topik
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isDark ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
                title={topik}
              >
                {topik}
              </button>
            ))}
          </div>

          {/* Year & Status Dropdowns */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Year */}
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              aria-label="Pilih Tahun Regulasi"
              className={`py-1 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer outline-none ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              <option value="ALL">Semua Tahun</option>
              {allTahunOptions.map(th => (
                <option key={th} value={th.toString()}>Tahun {th}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Pilih Status Regulasi"
              className={`py-1 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer outline-none ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              <option value="ALL">Semua Status</option>
              <option value="Berlaku">Berlaku</option>
              <option value="Mengubah">Mengubah</option>
              <option value="Dicabut">Dicabut</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* REGULATION ITEMS DISPLAY (GRID OR LIST) */}
      {/* ============================================================== */}
      {filteredList.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${
          isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <Scale className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200 mb-1">
            Tidak Ada Regulasi yang Cocok
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Tidak ditemukan regulasi perbendaharaan yang sesuai dengan filter atau kata kunci pencarian Anda. Silakan reset filter untuk melihat semua data.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedKategori('ALL');
              setSelectedTopik('ALL');
              setSelectedTahun('ALL');
              setSelectedStatus('ALL');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-md"
          >
            Reset Semua Filter Pencarian
          </button>
        </div>
      ) : displayLayout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {paginatedItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItemForPreview(item)}
              className={`group relative rounded-2xl border p-5 transition-all flex flex-col justify-between cursor-pointer ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-600/60 hover:shadow-xl hover:shadow-emerald-950/20'
                  : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-100'
              }`}
            >
              {/* Highlight / Paling Sering Dicari Badge */}
              {item.palingSeringDicari && (
                <div className="absolute -top-2.5 right-4 z-10 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Sering Dicari Satker</span>
                </div>
              )}

              <div>
                {/* Top Row: Category + Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${getCategoryBadgeClass(item.kategori)}`}>
                    {item.kategori}
                  </span>
                  <div>{getStatusBadge(item.status)}</div>
                </div>

                {/* Regulation Number & Year */}
                <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {item.nomor}
                </h3>

                {/* Full Title */}
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {item.judul}
                </p>

                {/* Summary */}
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-3 leading-relaxed">
                  {item.ringkasan}
                </p>

                {/* Topics / Tags */}
                <div className="flex flex-wrap items-center gap-1 mt-3">
                  {item.topik.slice(0, 3).map((tpk, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      #{tpk}
                    </span>
                  ))}
                  {item.topik.length > 3 && (
                    <span className="text-[10px] font-bold text-slate-400">
                      +{item.topik.length - 3} lainnya
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItemForPreview(item);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Satker</span>
                </button>

                <div className="flex items-center gap-1">
                  {/* Copy citation */}
                  <button
                    type="button"
                    onClick={(e) => handleCopyCitation(item, e)}
                    title="Salin Kutipan Dasar Hukum"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {/* External JDIH Link */}
                  {item.jdihUrl && (
                    <a
                      href={item.jdihUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Buka Dokumen di JDIH Kemenkeu (Resmi)"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {/* Admin edit/delete buttons if in admin mode */}
                  {isRealAdmin && viewMode === 'admin_manage' && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(item, e)}
                        title="Edit Regulasi"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(item, e)}
                        title="Hapus Regulasi"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table / List View */
        <div className={`overflow-x-auto rounded-2xl border shadow-sm ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-black uppercase tracking-wider text-[11px] ${
              isDark ? 'bg-slate-800/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <tr>
                <th className="py-3.5 px-4">Kategori & Status</th>
                <th className="py-3.5 px-4 min-w-[180px]">Nomor & Tahun</th>
                <th className="py-3.5 px-4 min-w-[280px]">Judul & Ringkasan</th>
                <th className="py-3.5 px-4">Topik</th>
                <th className="py-3.5 px-4 text-center">Aksi & Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {paginatedItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedItemForPreview(item)}
                  className={`transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider inline-block ${getCategoryBadgeClass(item.kategori)}`}>
                        {item.kategori}
                      </span>
                      <div>{getStatusBadge(item.status)}</div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                    <div>{item.nomor}</div>
                    <span className="text-[11px] font-normal text-slate-500">Tahun {item.tahun}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{item.judul}</div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.ringkasan}</p>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {item.topik.slice(0, 2).map((tpk, idx) => (
                        <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {tpk}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedItemForPreview(item)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleCopyCitation(item, e)}
                        title="Salin Kutipan Dasar Hukum"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {isRealAdmin && viewMode === 'admin_manage' && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditModal(item, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteItem(item, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <PaginationControl
        currentPage={currentPage}
        totalItems={filteredList.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        itemLabel="Regulasi"
        isDark={isDark}
      />

      {/* ============================================================== */}
      {/* INTERACTIVE DOCUMENT PREVIEW MODAL (PREVIEW SATKER) */}
      {/* ============================================================== */}
      {selectedItemForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className={`rounded-3xl border shadow-2xl max-w-3xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh] ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800 relative">
              <button
                type="button"
                onClick={() => setSelectedItemForPreview(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2 pr-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${getCategoryBadgeClass(selectedItemForPreview.kategori)}`}>
                    {selectedItemForPreview.kategori}
                  </span>
                  {getStatusBadge(selectedItemForPreview.status)}
                  <span className="text-[11px] text-slate-400 font-bold">
                    Tahun {selectedItemForPreview.tahun}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {selectedItemForPreview.nomor}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 font-semibold leading-relaxed">
                  {selectedItemForPreview.judul}
                </p>
              </div>

              {/* Modal Tabs Navigation */}
              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setPreviewActiveTab('ringkasan')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    previewActiveTab === 'ringkasan'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ringkasan & Poin Satker</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewActiveTab('sakti')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    previewActiveTab === 'sakti'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Implikasi & Modul SAKTI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewActiveTab('dokumen')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    previewActiveTab === 'dokumen'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Dokumen & JDIH</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              {previewActiveTab === 'ringkasan' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Status Note if any */}
                  {selectedItemForPreview.keteranganStatus && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <span className="font-bold block text-xs">Catatan Keberlakuan Regulasi:</span>
                        <p className="text-xs mt-0.5 leading-relaxed">{selectedItemForPreview.keteranganStatus}</p>
                      </div>
                    </div>
                  )}

                  {/* Executive Summary */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                      Ringkasan Eksekutif Peraturan
                    </h4>
                    <div className={`p-4 rounded-2xl border leading-relaxed ${
                      isDark ? 'bg-slate-800/60 border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      {selectedItemForPreview.ringkasan}
                    </div>
                  </div>

                  {/* Poin Kunci Pokok Implementasi Satker */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Poin Kunci & Kewajiban Penting Satker
                    </h4>
                    <div className="space-y-2">
                      {selectedItemForPreview.poinPenting.map((poin, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                            isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-200'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{poin}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Topik Terkait */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-500" />
                      Topik & Tag Perbendaharaan
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedItemForPreview.topik.map((tpk, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                        >
                          #{tpk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {previewActiveTab === 'sakti' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Modul SAKTI Terkait */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                      Modul Aplikasi SAKTI yang Terdampak
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedItemForPreview.saktiModulTerkait || ['Pembayaran']).map((modul, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          Modul {modul}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Implikasi Satker Berdasarkan Peran Pejabat */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      Panduan Tindakan per Pejabat Satker
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* KPA */}
                      <div className={`p-3.5 rounded-2xl border ${
                        isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 block mb-1">
                          👑 Kuasa Pengguna Anggaran (KPA)
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {selectedItemForPreview.implikasiSatker?.kpa || 'Melakukan pengawasan manajerial dan penetapan pejabat perbendaharaan.'}
                        </p>
                      </div>

                      {/* PPK */}
                      <div className={`p-3.5 rounded-2xl border ${
                        isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-[11px] font-black text-sky-600 dark:text-sky-400 block mb-1">
                          📝 Pejabat Pembuat Komitmen (PPK)
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {selectedItemForPreview.implikasiSatker?.ppk || 'Menguji tagihan, batas waktu SPP 5 hari kerja, dan pendaftaran kontrak 3 hari kerja.'}
                        </p>
                      </div>

                      {/* PPSPM */}
                      <div className={`p-3.5 rounded-2xl border ${
                        isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 block mb-1">
                          🛡️ Pejabat Penguji & SPM (PPSPM)
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {selectedItemForPreview.implikasiSatker?.ppspm || 'Verifikasi keabsahan dokumen, tanda tangan TTE SAKTI, dan penyampaian SPM ke KPPN.'}
                        </p>
                      </div>

                      {/* Bendahara */}
                      <div className={`p-3.5 rounded-2xl border ${
                        isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 block mb-1">
                          💰 Bendahara Pengeluaran
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {selectedItemForPreview.implikasiSatker?.bendahara || 'Revolving UP 100% per 30 hari, pembukuan BKU, dan penyampaian LPJ sebelum tgl 10.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {previewActiveTab === 'dokumen' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Ready Citation Box */}
                  <div className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-emerald-50/70 border-emerald-200'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        Kutipan Siap Pakai (Nota Dinas / SPM / Surat):
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCitation(selectedItemForPreview, e)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        {copiedId === selectedItemForPreview.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === selectedItemForPreview.id ? 'Tersalin' : 'Salin Kutipan'}</span>
                      </button>
                    </div>
                    <p className="text-xs font-mono bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 select-all">
                      {selectedItemForPreview.nomor} tentang {selectedItemForPreview.judul}
                    </p>
                  </div>

                  {/* Official Links */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                      Tautan Dokumen Resmi
                    </h4>

                    {selectedItemForPreview.jdihUrl && (
                      <a
                        href={selectedItemForPreview.jdihUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                          isDark ? 'bg-slate-800/80 border-slate-700 hover:border-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-600 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                            JDIH
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              Laman JDIH Kementerian Keuangan RI
                            </span>
                            <span className="block text-[11px] text-slate-500 truncate max-w-sm">
                              {selectedItemForPreview.jdihUrl}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                      </a>
                    )}

                    {selectedItemForPreview.fileUrl && (
                      <a
                        href={selectedItemForPreview.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                          isDark ? 'bg-slate-800/80 border-slate-700 hover:border-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-600 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                            PDF
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              Unduh Dokumen PDF Resmi
                            </span>
                            <span className="block text-[11px] text-slate-500 truncate max-w-sm">
                              Naskah asli Peraturan Perbendaharaan
                            </span>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-4 sm:p-5 border-t flex flex-wrap items-center justify-between gap-3 ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[11px] text-slate-400">
                Penerbit: <strong className="text-slate-600 dark:text-slate-300">{selectedItemForPreview.penyusun || 'Kementerian Keuangan RI'}</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleCopyCitation(selectedItemForPreview, e)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Dasar Hukum</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedItemForPreview(null)}
                  className="px-4 py-1.5 rounded-xl text-xs font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all cursor-pointer"
                >
                  Tutup Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADMIN ADD / EDIT FORM MODAL */}
      {/* ============================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className={`rounded-3xl border shadow-2xl max-w-2xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh] ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">
                  {editingItem ? 'Edit Regulasi Perbendaharaan' : 'Tambah Regulasi Perbendaharaan Baru'}
                </h3>
                <p className="text-xs text-indigo-300">
                  Data ini akan langsung disinkronkan ke Cloud dan tampil pada dashboard Satker.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Row 1: Nomor, Tahun & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nomor Regulasi <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nomor || ''}
                    onChange={(e) => setFormData({ ...formData, nomor: e.target.value })}
                    placeholder="Contoh: PMK No. 62 Tahun 2023 / PER-5/PB/2024"
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tahun <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.tahun || new Date().getFullYear()}
                    onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) || new Date().getFullYear() })}
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Row 2: Judul Lengkap */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Judul Lengkap Peraturan <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.judul || ''}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Contoh: Perencanaan Anggaran, Pelaksanaan Anggaran, serta Akuntansi dan Pelaporan Keuangan..."
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Row 3: Kategori & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Kategori Dokumen:
                  </label>
                  <select
                    value={formData.kategori || 'PMK'}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="PMK">PMK (Peraturan Menteri Keuangan)</option>
                    <option value="PER-DJPb">PER-DJPb (Peraturan Dirjen Perbendaharaan)</option>
                    <option value="PP / UU">PP / UU (Peraturan Pemerintah / UU)</option>
                    <option value="KEP / SE">KEP / SE (Keputusan / Surat Edaran)</option>
                    <option value="JUKNIS">JUKNIS (Petunjuk Teknis)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Status Keberlakuan:
                  </label>
                  <select
                    value={formData.status || 'Berlaku'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Berlaku">Berlaku Penuh</option>
                    <option value="Mengubah">Mengubah Peraturan Lain</option>
                    <option value="Dicabut">Dicabut / Tidak Berlaku</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Ringkasan Eksekutif */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Ringkasan Pokok Pengaturan:
                </label>
                <textarea
                  rows={3}
                  value={formData.ringkasan || ''}
                  onChange={(e) => setFormData({ ...formData, ringkasan: e.target.value })}
                  placeholder="Jelaskan intisari tujuan dan ruang lingkup peraturan ini..."
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Row 5: Poin Kunci Satker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Poin Kunci & Kewajiban Satker:
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, poinPenting: [...(formData.poinPenting || []), ''] })}
                    className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Poin</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {(formData.poinPenting || ['']).map((poin, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={poin}
                        onChange={(e) => {
                          const updated = [...(formData.poinPenting || [])];
                          updated[idx] = e.target.value;
                          setFormData({ ...formData, poinPenting: updated });
                        }}
                        placeholder="Contoh: Pengajuan SPM-GUP wajib dilakukan sebelum batas 30 hari..."
                        className={`flex-1 p-2 rounded-xl border text-xs outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                      {(formData.poinPenting || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (formData.poinPenting || []).filter((_, i) => i !== idx);
                            setFormData({ ...formData, poinPenting: updated });
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 6: Tautan Dokumen (JDIH & PDF) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Link Laman JDIH Kemenkeu:
                  </label>
                  <input
                    type="url"
                    value={formData.jdihUrl || ''}
                    onChange={(e) => setFormData({ ...formData, jdihUrl: e.target.value })}
                    placeholder="https://jdih.kemenkeu.go.id/..."
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Link File PDF (Download):
                  </label>
                  <input
                    type="url"
                    value={formData.fileUrl || ''}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    placeholder="https://jdih.kemenkeu.go.id/download/..."
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formData.palingSeringDicari}
                    onChange={(e) => setFormData({ ...formData, palingSeringDicari: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Beri Lencana "Sering Dicari Satker"
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Regulasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Confirm Modal */}
      <ModernConfirmModal
        state={confirmModal}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDark={isDark}
      />
    </div>
  );
};
