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
  AlertTriangle,
  Bookmark, 
  Layers, 
  Calendar, 
  Tag, 
  SlidersHorizontal, 
  ChevronRight, 
  X, 
  Save, 
  RotateCcw,
  RotateCw,
  Clock,
  Building2,
  FileCheck,
  Share2,
  Info,
  CheckCircle,
  HelpCircle,
  Maximize2,
  LayoutGrid,
  Columns,
  Send,
  Mail
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
import { 
  INITIAL_PERATURAN_LIST, 
  SAMPLE_PERATURAN_LIST, 
  DUMMY_REGULATION_IDS 
} from '../data/initialPeraturanData';
import { safeLocalStorageSet } from '../utils/safeStorage';
import { useToast } from './ToastNotification';
import { ModernConfirmModal, ConfirmModalState } from './ModernConfirmModal';
import { PaginationControl } from './PaginationControl';

interface PeraturanPerbendaharaanTabProps {
  isAdminAuthenticated: boolean;
  currentUser?: AppUser | null;
  theme: AppTheme;
  dashboardConfig?: DashboardConfig;
  onUpdateDashboardConfig?: (newConfig: DashboardConfig) => void;
  onNavigateTab?: (tab: NavigationTab) => void;
}

// Utility to convert regulation document URLs into embeddable viewer links
export const getPeraturanEmbedInfo = (url?: string) => {
  if (!url || !url.trim()) return null;
  const clean = url.trim();

  // Google Drive File preview conversion
  const driveMatch = clean.match(/drive\.google\.com\/file\/d\/([^\/\?]+)/);
  if (driveMatch && driveMatch[1]) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      type: 'drive' as const,
      label: 'Pratinjau PDF Dokumen Resmi (Google Drive)'
    };
  }

  // Google Drive open?id= or uc?id=
  const driveIdMatch = clean.match(/drive\.google\.com\/(?:open|uc)\?id=([^\&]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveIdMatch[1]}/preview`,
      type: 'drive' as const,
      label: 'Pratinjau PDF Dokumen Resmi (Google Drive)'
    };
  }

  // If already embedded docs/drive URL
  if (clean.includes('docs.google.com/viewer') || clean.includes('drive.google.com')) {
    return {
      embedUrl: clean,
      type: 'drive' as const,
      label: 'Pratinjau PDF Dokumen Resmi'
    };
  }

  // JDIH or Direct PDF: Wrap with Google Docs Viewer for seamless iframe embedding without CORS blocking
  if (clean.toLowerCase().endsWith('.pdf') || clean.includes('jdih.kemenkeu.go.id')) {
    return {
      embedUrl: `https://docs.google.com/viewer?url=${encodeURIComponent(clean)}&embedded=true`,
      type: 'pdf' as const,
      label: 'Pratinjau PDF Dokumen Resmi (JDIH Kemenkeu RI)'
    };
  }

  return {
    embedUrl: `https://docs.google.com/viewer?url=${encodeURIComponent(clean)}&embedded=true`,
    type: 'general' as const,
    label: 'Pratinjau Dokumen Regulasi'
  };
};

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

  // Local state for regulations list (Initialized empty so user can fill in real regulations)
  const [peraturanList, setPeraturanList] = useState<PeraturanPerbendaharaanItem[]>(() => {
    try {
      const dummyCleared = localStorage.getItem('kppn_peraturan_dummy_cleared_v3');
      if (!dummyCleared) {
        localStorage.setItem('kppn_peraturan_dummy_cleared_v3', 'true');
        // Clear cached dummy regulations
        const raw = localStorage.getItem('kppn_peraturan_list');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.every(p => DUMMY_REGULATION_IDS.has(p.id))) {
            localStorage.removeItem('kppn_peraturan_list');
            return [];
          }
        }
        localStorage.removeItem('kppn_peraturan_list');
        return [];
      }
    } catch {}

    if (dashboardConfig?.peraturanPerbendaharaanList && dashboardConfig.peraturanPerbendaharaanList.length > 0) {
      if (dashboardConfig.peraturanPerbendaharaanList.every(p => DUMMY_REGULATION_IDS.has(p.id))) {
        return [];
      }
      return dashboardConfig.peraturanPerbendaharaanList;
    }
    try {
      const saved = localStorage.getItem('kppn_peraturan_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (parsed.every(p => DUMMY_REGULATION_IDS.has(p.id))) {
            return [];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading saved regulations:', e);
    }
    return INITIAL_PERATURAN_LIST;
  });

  // Sync with dashboardConfig updates
  useEffect(() => {
    if (dashboardConfig?.peraturanPerbendaharaanList) {
      if (dashboardConfig.peraturanPerbendaharaanList.every(p => DUMMY_REGULATION_IDS.has(p.id))) {
        // If config has old dummy items, set empty
        setPeraturanList([]);
        return;
      }
      setPeraturanList(dashboardConfig.peraturanPerbendaharaanList);
    }
  }, [dashboardConfig?.peraturanPerbendaharaanList]);

  // View state: 'public' (preview tampilan satker) vs 'admin_manage' (kelola regulasi)
  const [viewMode, setViewMode] = useState<'public' | 'admin_manage'>('public');

  // Display layout: 'split' (Split preview like Pengumuman - default!) vs 'grid' (Card grid)
  const [displayLayout, setDisplayLayout] = useState<'split' | 'grid'>('split');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [selectedTopik, setSelectedTopik] = useState<string>('ALL');
  const [selectedTahun, setSelectedTahun] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'terbaru' | 'terlama' | 'nomor' | 'populer'>('terbaru');

  // Selected Peraturan for the persistent Right-Column Preview Panel (like Pengumuman!)
  const [selectedPeraturan, setSelectedPeraturan] = useState<PeraturanPerbendaharaanItem | null>(null);

  // Sub-preview tab inside Right Column: 'dokumen' | 'ringkasan' | 'sakti'
  const [activePreviewSubTab, setActivePreviewSubTab] = useState<'dokumen' | 'ringkasan' | 'sakti'>('dokumen');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination for Left Column list
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

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

  // Available unique topics across all regulations
  const allTopikOptions = useMemo(() => {
    const set = new Set<string>();
    peraturanList.forEach(item => {
      item.topik?.forEach(t => set.add(t));
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
      if (selectedTopik !== 'ALL' && !item.topik?.includes(selectedTopik)) return false;
      // Year filter
      if (selectedTahun !== 'ALL' && item.tahun !== parseInt(selectedTahun, 10)) return false;
      // Status filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchNomor = item.nomor?.toLowerCase().includes(q);
        const matchJudul = item.judul?.toLowerCase().includes(q);
        const matchRingkasan = item.ringkasan?.toLowerCase().includes(q);
        const matchTahun = item.tahun?.toString().includes(q);
        const matchPenyusun = item.penyusun?.toLowerCase().includes(q);
        const matchTopik = item.topik?.some(t => t.toLowerCase().includes(q));
        const matchModul = item.saktiModulTerkait?.some(m => m.toLowerCase().includes(q));
        if (!matchNomor && !matchJudul && !matchRingkasan && !matchTahun && !matchPenyusun && !matchTopik && !matchModul) {
          return false;
        }
      }

      return true;
    });
  }, [peraturanList, selectedKategori, selectedTopik, selectedTahun, selectedStatus, searchQuery]);

  // Sorting
  const sortedList = useMemo(() => {
    return [...filteredList].sort((a, b) => {
      if (sortBy === 'populer') {
        if (a.palingSeringDicari && !b.palingSeringDicari) return -1;
        if (!a.palingSeringDicari && b.palingSeringDicari) return 1;
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.tahun - a.tahun;
      }
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
      return 0;
    });
  }, [filteredList, sortBy]);

  // Automatically keep selectedPeraturan in sync with first item if null or filtered out
  useEffect(() => {
    if (sortedList.length > 0) {
      if (!selectedPeraturan || !sortedList.some(item => item.id === selectedPeraturan.id)) {
        setSelectedPeraturan(sortedList[0]);
      }
    } else {
      setSelectedPeraturan(null);
    }
  }, [sortedList, selectedPeraturan]);

  // Paginated slice for Left Column
  const paginatedList = useMemo(() => {
    if (pageSize <= 0) return sortedList;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedList.slice(startIndex, startIndex + pageSize);
  }, [sortedList, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedKategori, selectedTopik, selectedTahun, selectedStatus, sortBy]);

  // Save changes to state, localStorage & Cloud
  const savePeraturanList = (newList: PeraturanPerbendaharaanItem[]) => {
    setPeraturanList(newList);
    safeLocalStorageSet('kppn_peraturan_list', JSON.stringify(newList));
    if (onUpdateDashboardConfig) {
      const updatedConfig: DashboardConfig = {
        ...(dashboardConfig || {}),
        peraturanPerbendaharaanList: newList,
        updateDates: {
          ...(dashboardConfig?.updateDates || {}),
          peraturan: new Date().toISOString()
        }
      } as DashboardConfig;
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
    });
  };

  // Download PDF file helper
  const handleDownloadPdf = (item: PeraturanPerbendaharaanItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!item.fileUrl) {
      if (item.jdihUrl) {
        window.open(item.jdihUrl, '_blank');
      } else {
        showToast('Tautan dokumen resmi belum tersedia.', 'warning');
      }
      return;
    }
    const link = document.createElement('a');
    link.href = item.fileUrl;
    link.target = '_blank';
    link.download = `${item.nomor.replace(/[\/\s]/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Membuka unduhan: ${item.nomor}`, 'info');
  };

  // Share Regulation to WhatsApp
  const handleShareWhatsApp = (item: PeraturanPerbendaharaanItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const docUrl = item.fileUrl || item.jdihUrl || window.location.href;
    const text = `*INFO REGULASI PERBENDAHARAAN - KPPN SEMARANG I*\n\n📜 *${item.nomor}*\n📖 ${item.judul}\n📅 Tahun: ${item.tahun} | Status: ${item.status}\n\n🔗 Akses Dokumen: ${docUrl}\n\n_Disampaikan melalui Portal Pintar KPPN Semarang I_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    showToast('Membuka WhatsApp untuk berbagi regulasi', 'info');
  };

  // Share Regulation to Telegram
  const handleShareTelegram = (item: PeraturanPerbendaharaanItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const docUrl = item.fileUrl || item.jdihUrl || window.location.href;
    const text = `*INFO REGULASI PERBENDAHARAAN - KPPN SEMARANG I*\n\n📜 *${item.nomor}*\n📖 ${item.judul}\n📅 Tahun: ${item.tahun} | Status: ${item.status}\n\n_Disampaikan melalui Portal Pintar KPPN Semarang I_`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(docUrl)}&text=${encodeURIComponent(text)}`, '_blank');
    showToast('Membuka Telegram untuk berbagi regulasi', 'info');
  };

  // Admin: Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
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
    setTopikInput('');
    setIsFormModalOpen(true);
  };

  // Admin: Open Edit Modal
  const handleOpenEditModal = (item: PeraturanPerbendaharaanItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setFormData({
      ...item,
      poinPenting: item.poinPenting && item.poinPenting.length > 0 ? [...item.poinPenting] : ['']
    });
    setTopikInput(item.topik ? item.topik.join(', ') : '');
    setIsFormModalOpen(true);
  };

  // Admin: Save Form Data
  const handleSaveFormData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomor || !formData.judul) {
      showToast('Nomor dan Judul Regulasi wajib diisi!', 'warning');
      return;
    }

    const topicsArray = topikInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const filteredPoints = (formData.poinPenting || []).filter(p => p.trim().length > 0);

    const itemToSave: PeraturanPerbendaharaanItem = {
      id: editingItem ? editingItem.id : `reg-${Date.now()}`,
      nomor: formData.nomor.trim(),
      tahun: Number(formData.tahun) || new Date().getFullYear(),
      judul: formData.judul.trim(),
      kategori: (formData.kategori as KategoriPeraturan) || 'PMK',
      topik: topicsArray.length > 0 ? topicsArray : ['Perbendaharaan'],
      tanggalDitetapkan: formData.tanggalDitetapkan,
      tanggalBerlaku: formData.tanggalBerlaku,
      status: (formData.status as StatusPeraturan) || 'Berlaku',
      keteranganStatus: formData.keteranganStatus || '',
      ringkasan: formData.ringkasan || '',
      poinPenting: filteredPoints.length > 0 ? filteredPoints : ['Ketentuan pelaksanaan perbendaharaan dan kepatuhan anggaran.'],
      fileUrl: formData.fileUrl || '',
      jdihUrl: formData.jdihUrl || '',
      penyusun: formData.penyusun || 'Kementerian Keuangan RI',
      isFeatured: !!formData.isFeatured,
      palingSeringDicari: !!formData.palingSeringDicari,
      implikasiSatker: formData.implikasiSatker || {},
      saktiModulTerkait: formData.saktiModulTerkait || ['Pembayaran']
    };

    let updatedList: PeraturanPerbendaharaanItem[];
    if (editingItem) {
      updatedList = peraturanList.map(item => item.id === editingItem.id ? itemToSave : item);
      showToast(`Regulasi ${itemToSave.nomor} berhasil diperbarui!`, 'success');
    } else {
      updatedList = [itemToSave, ...peraturanList];
      showToast(`Regulasi baru ${itemToSave.nomor} berhasil ditambahkan!`, 'success');
    }

    savePeraturanList(updatedList);
    setSelectedPeraturan(itemToSave);
    setIsFormModalOpen(false);
  };

  // Admin: Delete handler
  const handleDeleteItem = (item: PeraturanPerbendaharaanItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Regulasi',
      message: `Apakah Anda yakin ingin menghapus data regulasi "${item.nomor}: ${item.judul}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Regulasi',
      cancelText: 'Batal',
      variant: 'danger',
      onConfirm: () => {
        const updated = peraturanList.filter(p => p.id !== item.id);
        savePeraturanList(updated);
        showToast(`Regulasi ${item.nomor} telah dihapus.`, 'info');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Admin: Kosongkan Seluruh Data Regulasi (Wipe / Clear)
  const handleClearAllRegulations = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Kosongkan Seluruh Katalog Regulasi',
      message: 'Apakah Anda yakin ingin menghapus seluruh data regulasi saat ini? Daftar regulasi akan menjadi kosong sehingga Anda dapat mengisinya sendiri dari awal sesuai regulasi resmi.',
      confirmText: 'Ya, Kosongkan Semua',
      cancelText: 'Batal',
      variant: 'danger',
      onConfirm: () => {
        savePeraturanList([]);
        setSelectedPeraturan(null);
        showToast('Seluruh data regulasi berhasil dikosongkan. Silakan isi data secara mandiri.', 'info');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Admin: Muat Contoh Template Regulasi (Optional)
  const handleLoadSampleRegulations = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Muat Contoh Regulasi Standar',
      message: 'Apakah Anda ingin memuat contoh regulasi perbendaharaan standar (PMK dan PER-DJPb) sebagai referensi? Anda tetap dapat mengedit atau menghapusnya kapan saja.',
      confirmText: 'Ya, Muat Contoh',
      cancelText: 'Batal',
      variant: 'warning',
      onConfirm: () => {
        savePeraturanList(SAMPLE_PERATURAN_LIST);
        if (SAMPLE_PERATURAN_LIST.length > 0) {
          setSelectedPeraturan(SAMPLE_PERATURAN_LIST[0]);
        }
        showToast('Contoh regulasi perbendaharaan berhasil dimuat.', 'success');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Category pill style generator
  const getCategoryBadgeClass = (kat: KategoriPeraturan | string) => {
    switch (kat) {
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

  // Embed info for currently selected item
  const selectedEmbedInfo = selectedPeraturan ? getPeraturanEmbedInfo(selectedPeraturan.fileUrl || selectedPeraturan.jdihUrl) : null;

  return (
    <div className="space-y-6">
      
      {/* ============================================================== */}
      {/* HEADER BANNER */}
      {/* ============================================================== */}
      <div className={`p-6 sm:p-8 rounded-3xl border text-white shadow-xl relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-slate-800' 
          : 'bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-950 border-slate-800'
      }`}>
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direktori Hukum &amp; Regulasi Perbendaharaan RI • KPPN Semarang I</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Peraturan Perbendaharaan &amp; Keuangan Negara
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed font-medium">
              Akses cepat regulasi resmi pelaksanaan APBN, PMK Standar Biaya Masukan (SBM), tata cara pembayaran, pertanggungjawaban UP, serta pratinjau dokumen PDF langsung tanpa perlu mengunduh.
            </p>
          </div>

          {/* Right Header Toolbar: Mode & Layout Toggles */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* View Layout Toggle: Split Preview vs Card Grid */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-inner">
              <button
                type="button"
                onClick={() => setDisplayLayout('split')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  displayLayout === 'split'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tampilan Belah dengan Pratinjau Dokumen Langsung (seperti Pengumuman)"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Pratinjau Belah</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayLayout('grid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  displayLayout === 'grid'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tampilan Kisi / Grid Kartu"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid Kartu</span>
              </button>
            </div>

            {/* Admin Switcher */}
            {isRealAdmin && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'public' ? 'admin_manage' : 'public')}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                    viewMode === 'admin_manage'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{viewMode === 'admin_manage' ? 'Selesai Kelola' : 'Kelola (Admin)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="px-3.5 py-2 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Regulasi</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Header Stats Pills */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/50 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Regulasi</span>
            <div className="text-lg sm:text-xl font-black text-white mt-0.5">{peraturanList.length} <span className="text-xs font-medium text-slate-400">Aturan</span></div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">PMK Terkini</span>
            <div className="text-lg sm:text-xl font-black text-emerald-300 mt-0.5">
              {peraturanList.filter(p => p.kategori === 'PMK').length} <span className="text-xs font-medium text-slate-400">Regulasi</span>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">PER DJPb / Juknis</span>
            <div className="text-lg sm:text-xl font-black text-blue-300 mt-0.5">
              {peraturanList.filter(p => p.kategori === 'PER-DJPb' || p.kategori === 'JUKNIS').length} <span className="text-xs font-medium text-slate-400">Juknis</span>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Status Berlaku</span>
            <div className="text-lg sm:text-xl font-black text-amber-300 mt-0.5">
              {peraturanList.filter(p => p.status === 'Berlaku').length} <span className="text-xs font-medium text-slate-400">Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ADMIN CONTROLS STRIP (IF IN ADMIN_MANAGE MODE) */}
      {/* ============================================================== */}
      {isRealAdmin && viewMode === 'admin_manage' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Mode Kelola Regulasi Perbendaharaan (Admin)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Anda dapat menambahkan PMK/PER baru, mengedit nomor dan judul, memperbarui tautan dokumen PDF, atau mereset data.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenCreateModal}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Baru</span>
            </button>
            {peraturanList.length > 0 && (
              <button
                onClick={handleClearAllRegulations}
                className="px-3.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/80 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Kosongkan seluruh data regulasi agar Anda dapat mengisinya sendiri"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Semua Data</span>
              </button>
            )}
            <button
              onClick={handleLoadSampleRegulations}
              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Muat contoh regulasi standar PMK & PER sebagai referensi"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Muat Contoh</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE A: TAMPILAN BELAH / SPLIT PREVIEW (PERSIS FITUR PENGUMUMAN)     */}
      {/* ========================================================================= */}
      {displayLayout === 'split' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ------------------------------------------------------------- */}
          {/* LEFT COLUMN: LIST PERATURAN DENGAN FILTER & SEARCH (5 COLS)  */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Search Box & Category Filters Card */}
            <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-4 rounded-2xl border space-y-3 shadow-xs`}>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold" />
                <input
                  type="text"
                  placeholder="Cari nomor, judul, tahun, kata kunci..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-xs rounded-xl pl-9 pr-3 py-2 border font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-500'
                  }`}
                />
              </div>

              {/* Category Pills (Semua, PMK, PER-DJPb, PP/UU, dll) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
                {['ALL', 'PMK', 'PER-DJPb', 'PP / UU', 'KEP / SE', 'JUKNIS'].map((cat) => {
                  const count = cat === 'ALL' 
                    ? peraturanList.length 
                    : peraturanList.filter(p => p.kategori === cat).length;
                  const isActive = selectedKategori === cat;

                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedKategori(cat);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>{cat === 'ALL' ? 'Semua' : cat}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Secondary Filter Dropdowns (Tahun, Status, Urutan) */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
                {/* Tahun */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tahun:</label>
                  <select
                    value={selectedTahun}
                    onChange={(e) => setSelectedTahun(e.target.value)}
                    className={`w-full p-1.5 rounded-lg border text-xs font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="ALL">Semua Tahun</option>
                    {allTahunOptions.map(th => (
                      <option key={th} value={th.toString()}>{th}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status:</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className={`w-full p-1.5 rounded-lg border text-xs font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="Berlaku">Berlaku</option>
                    <option value="Mengubah">Mengubah</option>
                    <option value="Dicabut">Dicabut</option>
                  </select>
                </div>

                {/* Urutan */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Urutkan:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className={`w-full p-1.5 rounded-lg border text-xs font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="terbaru">Terbaru</option>
                    <option value="populer">Paling Dicari</option>
                    <option value="nomor">Nomor Aturan</option>
                    <option value="terlama">Terlama</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Quick Topic Chips (SBM, Uang Persediaan, Deviasi Hal III, dll) */}
            {allTopikOptions.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1 shrink-0">Topik:</span>
                <button
                  onClick={() => setSelectedTopik('ALL')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
                    selectedTopik === 'ALL'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Semua
                </button>
                {allTopikOptions.slice(0, 7).map(topik => (
                  <button
                    key={topik}
                    onClick={() => setSelectedTopik(topik)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
                      selectedTopik === topik
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    #{topik}
                  </button>
                ))}
              </div>
            )}

            {/* Items List (Cards with Active Selection & Instant Preview Button) */}
            <div className="space-y-3">
              {peraturanList.length === 0 ? (
                <div className={`p-8 sm:p-10 rounded-3xl border text-center space-y-3 shadow-xs ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-300 text-slate-600'
                }`}>
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit mx-auto">
                    <Scale className="w-10 h-10" />
                  </div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white">
                    Katalog Regulasi Masih Kosong
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Data dummy telah dinonaktifkan agar Anda dapat mengisi regulasi resmi secara mandiri.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    {isRealAdmin && (
                      <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Regulasi Sekarang</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : paginatedList.length === 0 ? (
                <div className={`p-8 rounded-2xl border text-center space-y-2 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <Scale className="w-10 h-10 mx-auto text-slate-400" />
                  <p className="font-bold text-sm">Tidak ada regulasi yang sesuai pencarian</p>
                  <p className="text-xs text-slate-500">Coba ubah kata kunci atau bersihkan filter di atas.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedKategori('ALL');
                      setSelectedTopik('ALL');
                      setSelectedTahun('ALL');
                      setSelectedStatus('ALL');
                    }}
                    className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                paginatedList.map((item) => {
                  const isSelected = selectedPeraturan?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedPeraturan(item);
                        setActivePreviewSubTab('dokumen');
                      }}
                      className={`p-4 rounded-2xl border border-l-4 transition-all cursor-pointer space-y-2.5 relative overflow-hidden ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 border-l-emerald-600 ring-2 ring-emerald-500/50 shadow-md'
                          : isDark
                          ? 'bg-slate-900 border-slate-800 border-l-slate-700 hover:border-slate-700'
                          : 'bg-white border-slate-300 border-l-slate-400 hover:border-slate-400 shadow-xs'
                      }`}
                    >
                      {/* Top Badges Row */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Category Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getCategoryBadgeClass(item.kategori)}`}>
                            {item.kategori}
                          </span>

                          {/* Status Badge */}
                          {getStatusBadge(item.status)}

                          {/* Sering Dicari Badge */}
                          {item.palingSeringDicari && (
                            <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-0.5 border border-amber-500 shadow-2xs">
                              <Sparkles className="w-3 h-3 fill-current" />
                              <span>Sering Dicari</span>
                            </span>
                          )}
                        </div>

                        {/* Year Badge */}
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Tahun {item.tahun}</span>
                        </span>
                      </div>

                      {/* Regulation Number (Bold) */}
                      <h4 className={`text-sm font-black leading-snug ${
                        isSelected 
                          ? 'text-emerald-950 dark:text-emerald-200' 
                          : isDark ? 'text-white' : 'text-slate-950'
                      }`}>
                        {item.nomor}
                      </h4>

                      {/* Title & Short Excerpt */}
                      <p className={`text-xs line-clamp-2 leading-relaxed font-bold ${
                        isSelected
                          ? 'text-slate-900 dark:text-slate-200'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {item.judul}
                      </p>

                      {/* Actions Row on Item Card */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-800/60">
                        {/* Direct Preview Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPeraturan(item);
                            setActivePreviewSubTab('dokumen');
                          }}
                          className={`px-2.5 py-1 rounded-xl font-black text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          }`}
                          title="Tampilkan Pratinjau Dokumen di Kolom Kanan"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Pratinjau Langsung</span>
                        </button>

                        {/* Secondary Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleCopyCitation(item, e)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                            title="Salin Dasar Hukum"
                          >
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDownloadPdf(item, e)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                            title="Unduh Berkas PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Admin Edit & Delete buttons */}
                          {isRealAdmin && viewMode === 'admin_manage' && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditModal(item, e)}
                                className="p-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 transition-colors"
                                title="Edit Regulasi"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteItem(item, e)}
                                className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 transition-colors"
                                title="Hapus Regulasi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <span className={`text-[11px] font-bold flex items-center gap-0.5 ml-1 ${
                            isSelected
                              ? 'text-emerald-700 dark:text-emerald-300 font-black'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            <span>{isSelected ? 'Aktif' : ''}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Control */}
            <PaginationControl
              currentPage={currentPage}
              totalItems={sortedList.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="Regulasi"
              isDark={isDark}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            />

          </div>

          {/* ------------------------------------------------------------- */}
          {/* RIGHT COLUMN: DIRECT LIVE PREVIEW PANEL (7 COLS - PERSIS PENGUMUMAN) */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-7" id="peraturan-preview-panel">
            {selectedPeraturan ? (
              <div className={`rounded-3xl border shadow-xl flex flex-col overflow-hidden sticky top-20 transition-all ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
              }`}>
                
                {/* Header: Compact, Informative & Clear */}
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 space-y-3 shrink-0">
                  
                  {/* Top Badges & Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getCategoryBadgeClass(selectedPeraturan.kategori)}`}>
                        {selectedPeraturan.kategori}
                      </span>
                      {getStatusBadge(selectedPeraturan.status)}
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                        Tahun {selectedPeraturan.tahun}
                      </span>
                      {selectedPeraturan.palingSeringDicari && (
                        <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px] border border-amber-500 flex items-center gap-1 shadow-2xs">
                          <Sparkles className="w-3 h-3 fill-current" />
                          <span>Sering Dicari</span>
                        </span>
                      )}
                    </div>

                    {/* Action Toolbar */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Direct External Link to JDIH */}
                      {(selectedPeraturan.jdihUrl || selectedPeraturan.fileUrl) && (
                        <a
                          href={selectedPeraturan.jdihUrl || selectedPeraturan.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                          title="Buka Dokumen di Tab Baru (JDIH Kemenkeu)"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">Tab Baru</span>
                        </a>
                      )}

                      {/* Download PDF button */}
                      <button
                        type="button"
                        onClick={(e) => handleDownloadPdf(selectedPeraturan, e)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="Unduh Berkas PDF Resmi"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Unduh Berkas</span>
                      </button>

                      {/* Copy Citation Button */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyCitation(selectedPeraturan, e)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Salin Dasar Hukum"
                      >
                        {copiedId === selectedPeraturan.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[11px] font-bold text-emerald-600 hidden sm:inline">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-600" />
                            <span className="hidden sm:inline">Salin</span>
                          </>
                        )}
                      </button>

                      {/* Share WhatsApp */}
                      <button
                        type="button"
                        onClick={(e) => handleShareWhatsApp(selectedPeraturan, e)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Bagikan Regulasi via WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">WhatsApp</span>
                      </button>

                      {/* Share Telegram */}
                      <button
                        type="button"
                        onClick={(e) => handleShareTelegram(selectedPeraturan, e)}
                        className="px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Bagikan Regulasi via Telegram"
                      >
                        <Send className="w-3.5 h-3.5 rotate-[-20deg]" />
                        <span className="hidden md:inline">Telegram</span>
                      </button>

                      {/* Fullscreen Expansion Button */}
                      <button
                        type="button"
                        onClick={() => setIsFullscreenPreview(true)}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Buka Pratinjau Layar Penuh"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div>
                    <h3 className={`text-base sm:text-lg font-black leading-snug ${isDark ? 'text-white' : 'text-slate-950'}`}>
                      {selectedPeraturan.nomor}
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                      {selectedPeraturan.judul}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Penerbit: <strong className="text-slate-800 dark:text-slate-200">{selectedPeraturan.penyusun || 'Kementerian Keuangan RI'}</strong></span>
                      </span>
                      {selectedPeraturan.tanggalBerlaku && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Mulai Berlaku: {selectedPeraturan.tanggalBerlaku}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Sub-Tab Switcher: Pratinjau Dokumen vs Ringkasan & Poin Satker vs Ketentuan SAKTI */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-black">
                      <button
                        type="button"
                        onClick={() => setActivePreviewSubTab('dokumen')}
                        className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                          activePreviewSubTab === 'dokumen'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Pratinjau Dokumen (PDF)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActivePreviewSubTab('ringkasan')}
                        className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                          activePreviewSubTab === 'ringkasan'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Ringkasan &amp; Poin Satker</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActivePreviewSubTab('sakti')}
                        className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                          activePreviewSubTab === 'sakti'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Ketentuan &amp; Modul SAKTI</span>
                      </button>
                    </div>

                    {/* Reload iframe button */}
                    {activePreviewSubTab === 'dokumen' && (
                      <button
                        type="button"
                        onClick={() => setIframeKey(k => k + 1)}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
                        title="Muat Ulang Pratinjau Dokumen (Refresh)"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold hidden md:inline">Segarkan</span>
                      </button>
                    )}
                  </div>

                </div>

                {/* Status Notice Banner if status description or summary note exists */}
                {selectedPeraturan.keteranganStatus && (
                  <div className="px-4 py-2.5 bg-emerald-500/10 dark:bg-emerald-950/20 border-b border-emerald-300/40 dark:border-emerald-900/40 flex items-start justify-between gap-3 text-xs text-slate-800 dark:text-slate-200">
                    <div className="flex items-start gap-2 min-w-0">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="line-clamp-2 leading-relaxed font-bold">
                        <strong className="text-emerald-950 dark:text-emerald-300">Catatan Regulasi: </strong>
                        {selectedPeraturan.keteranganStatus}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePreviewSubTab('ringkasan')}
                      className="shrink-0 text-[11px] font-black text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Lihat Ringkasan &rarr;
                    </button>
                  </div>
                )}

                {/* Main Body: Active Sub-tab View */}
                <div className="p-3 sm:p-4 bg-slate-100/70 dark:bg-slate-950/60">
                  
                  {/* SUB-TAB 1: EMBEDDED DOCUMENT PREVIEW (PDF / DRIVE / JDIH) */}
                  {activePreviewSubTab === 'dokumen' && (
                    <div className="space-y-2">
                      <div className="relative w-full h-[620px] sm:h-[700px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-inner flex flex-col">
                        
                        {/* Sub-header inside iframe viewer box */}
                        <div className="px-3.5 py-2 bg-slate-900 text-white flex items-center justify-between text-xs border-b border-slate-800 shrink-0">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="font-extrabold text-[11px] text-slate-200 truncate">
                              Pratinjau PDF Dokumen Resmi: {selectedPeraturan.nomor}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {(selectedPeraturan.jdihUrl || selectedPeraturan.fileUrl) && (
                              <a
                                href={selectedPeraturan.jdihUrl || selectedPeraturan.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3 text-emerald-400" />
                                <span>Buka di JDIH / Tab Baru</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Iframe View Frame */}
                        <div className="flex-1 w-full h-full relative bg-slate-900">
                          {selectedEmbedInfo ? (
                            <iframe
                              key={iframeKey}
                              src={selectedEmbedInfo.embedUrl}
                              className="w-full h-full border-0 bg-white"
                              title={`Pratinjau ${selectedPeraturan.nomor}`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-300 space-y-3">
                              <FileText className="w-12 h-12 text-emerald-500" />
                              <p className="font-black text-sm">Dokumen Regulasi Siap Diakses</p>
                              <p className="text-xs text-slate-400 max-w-sm">Tautan dokumen resmi dapat dibuka langsung melalui JDIH Kemenkeu RI atau diunduh ke komputer Anda.</p>
                              <div className="flex items-center gap-2 pt-2">
                                {selectedPeraturan.jdihUrl && (
                                  <a
                                    href={selectedPeraturan.jdihUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    <span>Buka di JDIH Kemenkeu RI</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Helper Footer Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Pratinjau langsung interaktif. Dokumen dapat dibaca, di-zoom, dan dicetak tanpa unduh file.</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDownloadPdf(selectedPeraturan, e)}
                          className="font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Unduh File Asli (.PDF)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: RINGKASAN & POIN SATKER (STRUCTURED BREAKDOWN) */}
                  {activePreviewSubTab === 'ringkasan' && (
                    <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-sm space-y-6">
                      {/* Letterhead */}
                      <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-4 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black">
                            <Scale className="w-7 h-7" />
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              KEMENTERIAN KEUANGAN RI • DITJEN PERBENDAHARAAN
                            </div>
                            <div className="text-sm font-black text-slate-900 dark:text-white">
                              RINGKASAN &amp; PEDOMAN REGULASI SATKER MITRA KPPN
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              KPPN SEMARANG I (KODE 026)
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ringkasan Umum */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <Info className="w-4 h-4" />
                          <span>Ringkasan Pokok Regulasi</span>
                        </h4>
                        <div className={`p-4 rounded-xl border text-xs sm:text-sm font-bold leading-relaxed ${
                          isDark ? 'bg-slate-800/60 border-slate-700 text-slate-200' : 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                        }`}>
                          {selectedPeraturan.ringkasan || 'Tidak ada ringkasan teks khusus.'}
                        </div>
                      </div>

                      {/* Poin-Poin Penting untuk Satker */}
                      {selectedPeraturan.poinPenting && selectedPeraturan.poinPenting.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Poin-Poin Kunci &amp; Kewajiban Satker</span>
                          </h4>
                          <div className="grid grid-cols-1 gap-2.5">
                            {selectedPeraturan.poinPenting.map((poin, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-bold leading-relaxed ${
                                  isDark ? 'bg-slate-800/40 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                                }`}
                              >
                                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span>{poin}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Implikasi Satker Berdasarkan Pejabat (KPA, PPK, PPSPM, Bendahara) */}
                      {selectedPeraturan.implikasiSatker && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                            <Layers className="w-4 h-4" />
                            <span>Panduan Implikasi Per Jabatan Perbendaharaan</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {selectedPeraturan.implikasiSatker.kpa && (
                              <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20">
                                <span className="font-black text-purple-800 dark:text-purple-300 block mb-1">
                                  Kuasa Pengguna Anggaran (KPA):
                                </span>
                                <span className="text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
                                  {selectedPeraturan.implikasiSatker.kpa}
                                </span>
                              </div>
                            )}

                            {selectedPeraturan.implikasiSatker.ppk && (
                              <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20">
                                <span className="font-black text-blue-800 dark:text-blue-300 block mb-1">
                                  Pejabat Pembuat Komitmen (PPK):
                                </span>
                                <span className="text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
                                  {selectedPeraturan.implikasiSatker.ppk}
                                </span>
                              </div>
                            )}

                            {selectedPeraturan.implikasiSatker.ppspm && (
                              <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                                <span className="font-black text-emerald-800 dark:text-emerald-300 block mb-1">
                                  Pejabat Penandatangan SPM (PPSPM):
                                </span>
                                <span className="text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
                                  {selectedPeraturan.implikasiSatker.ppspm}
                                </span>
                              </div>
                            )}

                            {selectedPeraturan.implikasiSatker.bendahara && (
                              <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
                                <span className="font-black text-amber-800 dark:text-amber-300 block mb-1">
                                  Bendahara Pengeluaran / Penerimaan:
                                </span>
                                <span className="text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
                                  {selectedPeraturan.implikasiSatker.bendahara}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bottom Action in Ringkasan */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setActivePreviewSubTab('dokumen')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-md"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Buka Pratinjau Berkas PDF Lengkap</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCopyCitation(selectedPeraturan, e)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Salin Dasar Hukum Lengkap</span>
                        </button>
                      </div>

                    </div>
                  )}

                  {/* SUB-TAB 3: KETENTUAN & MODUL SAKTI */}
                  {activePreviewSubTab === 'sakti' && (
                    <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-sm space-y-6">
                      
                      {/* SAKTI Modules */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                          <Layers className="w-4 h-4" />
                          <span>Keterkaitan Modul Aplikasi SAKTI</span>
                        </h4>
                        <div className="flex flex-wrap items-center gap-2">
                          {(selectedPeraturan.saktiModulTerkait || ['Pembayaran', 'Komitmen']).map(modul => (
                            <span
                              key={modul}
                              className="px-3.5 py-1.5 rounded-xl font-black text-xs bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-800 shadow-2xs flex items-center gap-1.5"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                              <span>Modul {modul}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Topik Terkait */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <Tag className="w-4 h-4" />
                          <span>Topik &amp; Kata Kunci Terkait</span>
                        </h4>
                        <div className="flex flex-wrap items-center gap-2">
                          {(selectedPeraturan.topik || []).map(t => (
                            <span
                              key={t}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Status History */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>Riwayat &amp; Status Peraturan</span>
                        </h4>
                        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-bold leading-relaxed space-y-1">
                          <div>Status Keberlakuan: <strong>{selectedPeraturan.status}</strong></div>
                          {selectedPeraturan.keteranganStatus && (
                            <div className="text-slate-700 dark:text-slate-300 mt-1">{selectedPeraturan.keteranganStatus}</div>
                          )}
                          {selectedPeraturan.tanggalDitetapkan && (
                            <div className="text-slate-500 mt-1">Ditetapkan: {selectedPeraturan.tanggalDitetapkan}</div>
                          )}
                        </div>
                      </div>

                      {/* Citation Template Ready to Copy */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Copy className="w-4 h-4" />
                          <span>Format Kutipan Siap Pakai (Untuk Nota Dinas / Uraian SPM)</span>
                        </h4>
                        <div className="p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold flex items-center justify-between gap-3">
                          <span className="truncate">{selectedPeraturan.nomor} tentang {selectedPeraturan.judul}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyCitation(selectedPeraturan, e)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Salin</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className={`p-10 sm:p-14 rounded-3xl border text-center space-y-3 shadow-xs ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-300 text-slate-500'
              }`}>
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 w-fit mx-auto">
                  <FileText className="w-10 h-10 opacity-70" />
                </div>
                <h4 className="font-black text-base text-slate-800 dark:text-slate-200">
                  {peraturanList.length === 0 ? 'Ruang Pratinjau Dokumen Siap Digunakan' : 'Pilih Regulasi untuk Menampilkan Pratinjau'}
                </h4>
                <p className="text-xs max-w-sm mx-auto leading-relaxed">
                  {peraturanList.length === 0
                    ? 'Setelah Anda menambahkan regulasi baru, dokumen PDF dan lembar ringkasannya akan langsung muncul di panel ini (seperti fitur Pengumuman).'
                    : 'Pilih salah satu peraturan di kolom kiri untuk membaca naskah resmi PDF, ringkasan pokok, dan implikasi SAKTI secara langsung.'}
                </p>
                {peraturanList.length === 0 && isRealAdmin && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleOpenCreateModal}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Tambah Regulasi Pertama</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW MODE B: TAMPILAN KISI / GRID KARTU (ALTERNATIVE VIEW)                */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Search & Filters Bar for Grid */}
          <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-4 sm:p-5 rounded-3xl border shadow-xs space-y-3`}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold" />
              <input
                type="text"
                placeholder="Cari regulasi: ketik nomor (PMK 62, PER-5), judul, tahun, kata kunci..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full text-xs sm:text-sm rounded-2xl pl-11 pr-4 py-3 border font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-500'
                }`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
                {['ALL', 'PMK', 'PER-DJPb', 'PP / UU', 'KEP / SE', 'JUKNIS'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedKategori(cat);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer ${
                      selectedKategori === cat
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua Kategori' : cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <select
                  value={selectedTahun}
                  onChange={(e) => setSelectedTahun(e.target.value)}
                  className={`p-1.5 rounded-xl border text-xs font-bold ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="ALL">Semua Tahun</option>
                  {allTahunOptions.map(th => (
                    <option key={th} value={th.toString()}>{th}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={`p-1.5 rounded-xl border text-xs font-bold ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
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

          {/* Cards Grid */}
          {sortedList.length === 0 ? (
            <div className={`p-10 sm:p-14 rounded-3xl border text-center space-y-3 shadow-xs ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-300 text-slate-600'
            }`}>
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit mx-auto">
                <Scale className="w-10 h-10" />
              </div>
              <h4 className="font-black text-base text-slate-900 dark:text-white">
                {peraturanList.length === 0 ? 'Katalog Regulasi Masih Kosong' : 'Tidak Ada Regulasi yang Sesuai Filter'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {peraturanList.length === 0
                  ? 'Data dummy telah dinonaktifkan agar Anda dapat mengisi regulasi resmi secara mandiri.'
                  : 'Coba ubah kata kunci pencarian atau bersihkan filter di atas.'}
              </p>
              {peraturanList.length === 0 && isRealAdmin && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Regulasi Sekarang</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedList.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 hover:shadow-lg relative overflow-hidden ${
                    isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getCategoryBadgeClass(item.kategori)}`}>
                        {item.kategori}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>

                    <h3 className={`text-base font-black leading-snug ${isDark ? 'text-white' : 'text-slate-950'}`}>
                      {item.nomor}
                    </h3>

                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                      {item.judul}
                    </p>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed font-medium">
                      {item.ringkasan}
                    </p>

                    {/* Topics */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {(item.topik || []).slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPeraturan(item);
                        setDisplayLayout('split');
                        setActivePreviewSubTab('dokumen');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Satker</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleCopyCitation(item, e)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                        title="Salin Dasar Hukum"
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDownloadPdf(item, e)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                        title="Unduh PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* FULLSCREEN PREVIEW MODAL                                        */}
      {/* ============================================================== */}
      {isFullscreenPreview && selectedPeraturan && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-2 sm:p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col flex-1 shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3 truncate">
                <Scale className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <h4 className="text-sm font-black truncate">{selectedPeraturan.nomor}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{selectedPeraturan.judul}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {(selectedPeraturan.jdihUrl || selectedPeraturan.fileUrl) && (
                  <a
                    href={selectedPeraturan.jdihUrl || selectedPeraturan.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Buka di Tab Baru</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={(e) => handleDownloadPdf(selectedPeraturan, e)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullscreenPreview(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 transition-colors cursor-pointer"
                  title="Tutup Layar Penuh"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Iframe View Frame */}
            <div className="flex-1 w-full h-full relative bg-slate-950">
              {selectedEmbedInfo ? (
                <iframe
                  src={selectedEmbedInfo.embedUrl}
                  className="w-full h-full border-0 bg-white"
                  title={`Pratinjau Layar Penuh ${selectedPeraturan.nomor}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="h-full flex items-center justify-center p-8 text-center text-white">
                  <p className="text-sm">Dokumen tidak dapat dimuat di penampil iframe.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADMIN ADD / EDIT FORM MODAL                                    */}
      {/* ============================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden my-8 animate-scale-up ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-950'
          }`}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {editingItem ? 'Edit Data Regulasi Perbendaharaan' : 'Tambah Regulasi Perbendaharaan Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Form input katalog regulasi, link PDF, dan implikasi bagi pejabat satker.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFormData} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black mb-1">Kategori Regulasi:</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as KategoriPeraturan })}
                    className={`w-full p-2 rounded-xl border text-xs font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="PMK">PMK (Peraturan Menteri Keuangan)</option>
                    <option value="PER-DJPb">PER-DJPb (Peraturan Dirjen Perbendaharaan)</option>
                    <option value="PP / UU">PP / UU (Peraturan Pemerintah / UU)</option>
                    <option value="KEP / SE">KEP / SE (Surat Edaran)</option>
                    <option value="JUKNIS">Juknis Pelaksanaan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black mb-1">Nomor Regulasi (*):</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PMK No. 39 Tahun 2024"
                    value={formData.nomor}
                    onChange={(e) => setFormData({ ...formData, nomor: e.target.value })}
                    className={`w-full p-2 rounded-xl border text-xs font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black mb-1">Tahun Terbit:</label>
                  <input
                    type="number"
                    value={formData.tahun}
                    onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value, 10) || new Date().getFullYear() })}
                    className={`w-full p-2 rounded-xl border text-xs font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black mb-1">Judul / Tentang Regulasi (*):</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Standar Biaya Masukan (SBM) Tahun Anggaran 2025"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className={`w-full p-2 rounded-xl border text-xs font-bold ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black mb-1">Status Keberlakuan:</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusPeraturan })}
                    className={`w-full p-2 rounded-xl border text-xs font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="Berlaku">Berlaku</option>
                    <option value="Mengubah">Mengubah</option>
                    <option value="Dicabut">Dicabut</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black mb-1">Instansi Penerbit:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kementerian Keuangan RI / Ditjen Perbendaharaan"
                    value={formData.penyusun}
                    onChange={(e) => setFormData({ ...formData, penyusun: e.target.value })}
                    className={`w-full p-2 rounded-xl border text-xs font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black mb-1">URL File PDF (Pratinjau / Download):</label>
                  <input
                    type="url"
                    placeholder="https://jdih.kemenkeu.go.id/.../file.pdf atau link Google Drive"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    className={`w-full p-2 rounded-xl border text-xs font-mono font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black mb-1">URL JDIH Kemenkeu RI (Halaman Web):</label>
                  <input
                    type="url"
                    placeholder="https://jdih.kemenkeu.go.id/in/dokumen/peraturan/..."
                    value={formData.jdihUrl}
                    onChange={(e) => setFormData({ ...formData, jdihUrl: e.target.value })}
                    className={`w-full p-2 rounded-xl border text-xs font-mono font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black mb-1">Ringkasan Regulasi:</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan ringkasan materi muatan pokok regulasi ini..."
                  value={formData.ringkasan}
                  onChange={(e) => setFormData({ ...formData, ringkasan: e.target.value })}
                  className={`w-full p-2 rounded-xl border text-xs font-bold ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-black mb-1">Topik / Tag Kata Kunci (Pisahkan dengan koma):</label>
                <input
                  type="text"
                  placeholder="Contoh: Standar Biaya Masukan (SBM), Honorarium, Perjalanan Dinas"
                  value={topikInput}
                  onChange={(e) => setTopikInput(e.target.value)}
                  className={`w-full p-2 rounded-xl border text-xs font-bold ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={formData.palingSeringDicari}
                    onChange={(e) => setFormData({ ...formData, palingSeringDicari: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>Tandai sebagai "Sering Dicari Satker"</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>Regulasi Unggulan</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Regulasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CONFIRMATION MODAL                                             */}
      {/* ============================================================== */}
      <ModernConfirmModal
        modal={confirmModal}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDark={isDark}
      />

    </div>
  );
};
