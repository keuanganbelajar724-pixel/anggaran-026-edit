import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  Sparkles,
  Info,
  Filter,
  X,
  Save,
  Tag,
  BookOpen,
  Pin,
  Clock,
  Code2,
  FileCode,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import {
  UraianSpmSaktiItem,
  DokumenPendukungSpmItem,
  KategoriPembayaranSpm,
  AppTheme
} from '../types';
import {
  INITIAL_URAIAN_SPM_SAKTI_LIST,
  KATEGORI_PEMBAYARAN_OPTIONS,
  getCategoryTheme
} from '../data/initialUraianSpmData';
import { ModernConfirmModal, ConfirmModalState } from './ModernConfirmModal';
import { useToast } from './ToastNotification';
import { PaginationControl } from './PaginationControl';

interface UraianSpmSaktiViewProps {
  isAdmin?: boolean;
  theme?: AppTheme;
  uraianList?: UraianSpmSaktiItem[];
  onSaveList?: (newList: UraianSpmSaktiItem[], successMessage?: string) => void;
  onResetPreset?: () => void;
}

export const UraianSpmSaktiView: React.FC<UraianSpmSaktiViewProps> = ({
  isAdmin = false,
  theme = 'light',
  uraianList = INITIAL_URAIAN_SPM_SAKTI_LIST,
  onSaveList,
  onResetPreset
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [selectedSifat, setSelectedSifat] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Expanded row items (for quick inline view of supporting documents if any exist)
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});

  // Modals
  const [detailModalItem, setDetailModalItem] = useState<UraianSpmSaktiItem | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  // Admin Add / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<UraianSpmSaktiItem | null>(null);

  // Form fields
  const [formKodeSpp, setFormKodeSpp] = useState<string>('');
  const [formJenisSpm, setFormJenisSpm] = useState<string>('');
  const [formKategori, setFormKategori] = useState<KategoriPembayaranSpm>('BELANJA_BARANG');
  const [formSifat, setFormSifat] = useState<string>('Pembayaran Langsung (LS)');
  const [formJenisBelanja, setFormJenisBelanja] = useState<string>('52 (Belanja Barang)');
  const [formFormatBaku, setFormFormatBaku] = useState<string>('');
  const [formContohUraian, setFormContohUraian] = useState<string>('');
  const [formPlaceholderGuide, setFormPlaceholderGuide] = useState<string>('');
  const [formKeterangan, setFormKeterangan] = useState<string>('');
  const [formIsPinned, setFormIsPinned] = useState<boolean>(false);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formDokumen, setFormDokumen] = useState<DokumenPendukungSpmItem[]>([]);

  // Helper to render template text with placeholders [ ... ] highlighted in cute amber badges
  const renderHighlightedFormat = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span
            key={i}
            className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md font-bold text-amber-950 bg-amber-200/90 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-mono text-xs"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Copy Uraian Helper
  const handleCopyUraian = (item: UraianSpmSaktiItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(item.contohUraian);
    setCopiedId(item.id);
    showToast({
      type: 'success',
      title: 'Uraian SPM Disalin',
      message: `Contoh uraian untuk [Kode ${item.kodeSpp}] disalin ke clipboard (${item.contohUraian.length} karakter).`
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Toggle Row Expand
  const toggleRowExpand = (id: string) => {
    setExpandedRowIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Sifat Pembayaran options
  const sifatOptions = useMemo(() => {
    const set = new Set<string>();
    uraianList.forEach(item => {
      if (item.sifatPembayaran) set.add(item.sifatPembayaran);
    });
    return Array.from(set).sort();
  }, [uraianList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return uraianList.filter(item => {
      // Category filter
      if (selectedKategori !== 'ALL' && item.kategoriPembayaran !== selectedKategori) {
        return false;
      }
      // Sifat filter
      if (selectedSifat !== 'ALL' && item.sifatPembayaran !== selectedSifat) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchKode = item.kodeSpp.toLowerCase().includes(q);
        const matchJenis = item.jenisSpm.toLowerCase().includes(q);
        const matchFormat = item.formatBakuUraian.toLowerCase().includes(q);
        const matchContoh = item.contohUraian.toLowerCase().includes(q);
        const matchBelanja = (item.jenisBelanja || '').toLowerCase().includes(q);
        const matchKeterangan = (item.keterangan || item.tipsKppn || '').toLowerCase().includes(q);
        const matchDokumen = item.dokumenPendukung?.some(d =>
          d.namaDokumen.toLowerCase().includes(q) || (d.keterangan || '').toLowerCase().includes(q)
        );

        return matchKode || matchJenis || matchFormat || matchContoh || matchBelanja || matchKeterangan || matchDokumen;
      }
      return true;
    });
  }, [uraianList, selectedKategori, selectedSifat, searchQuery]);

  // Paginated List
  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Handle Admin Open Add Modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormKodeSpp('');
    setFormJenisSpm('');
    setFormKategori('BELANJA_BARANG');
    setFormSifat('Pembayaran Langsung (LS)');
    setFormJenisBelanja('52 (Belanja Barang)');
    setFormFormatBaku('Pembayaran Belanja ... sesuai SPK/Kuitansi No. [No Kuitansi] DIPA TA [TA]');
    setFormContohUraian('Pembayaran Belanja ... Satker ... Berdasarkan Kuitansi No. ... tanggal ... DIPA TA 2026.');
    setFormPlaceholderGuide('[Nama Satker] = Nama Satker; [TA] = Tahun Anggaran; [No Kuitansi] = Nomor Kuitansi.');
    setFormKeterangan('');
    setFormIsPinned(false);
    setFormIsActive(true);
    setFormDokumen([]); // Default empty per user instruction
    setIsFormModalOpen(true);
  };

  // Handle Admin Open Edit Modal
  const handleOpenEditModal = (item: UraianSpmSaktiItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setFormKodeSpp(item.kodeSpp);
    setFormJenisSpm(item.jenisSpm);
    setFormKategori(item.kategoriPembayaran);
    setFormSifat(item.sifatPembayaran);
    setFormJenisBelanja(item.jenisBelanja || '');
    setFormFormatBaku(item.formatBakuUraian);
    setFormContohUraian(item.contohUraian);
    setFormPlaceholderGuide(item.placeholderGuide || '');
    setFormKeterangan(item.keterangan || item.tipsKppn || '');
    setFormIsPinned(!!item.isPinned);
    setFormIsActive(item.isActive !== false);
    setFormDokumen(item.dokumenPendukung ? [...item.dokumenPendukung] : []);
    setIsFormModalOpen(true);
  };

  // Add / Remove Dokumen in Form
  const handleAddDokumenRow = () => {
    setFormDokumen(prev => [
      ...prev,
      { namaDokumen: '', format: 'PDF', wajib: true, keterangan: '' }
    ]);
  };

  const handleRemoveDokumenRow = (index: number) => {
    setFormDokumen(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateDokumenField = (index: number, field: keyof DokumenPendukungSpmItem, value: any) => {
    setFormDokumen(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Save Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKodeSpp.trim() || !formJenisSpm.trim() || !formFormatBaku.trim()) {
      showToast({
        type: 'warning',
        title: 'Form Belum Lengkap',
        message: 'Kode SPP, Jenis SPM, dan Format Baku Uraian wajib diisi.'
      });
      return;
    }

    const cleanDokumen = formDokumen
      .filter(d => d.namaDokumen.trim().length > 0)
      .map(d => ({
        ...d,
        namaDokumen: d.namaDokumen.trim(),
        keterangan: d.keterangan?.trim()
      }));

    if (editingItem) {
      // Update
      const updatedList = uraianList.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            kodeSpp: formKodeSpp.trim(),
            jenisSpm: formJenisSpm.trim(),
            kategoriPembayaran: formKategori,
            sifatPembayaran: formSifat.trim(),
            jenisBelanja: formJenisBelanja.trim(),
            formatBakuUraian: formFormatBaku.trim(),
            contohUraian: formContohUraian.trim(),
            placeholderGuide: formPlaceholderGuide.trim(),
            keterangan: formKeterangan.trim(),
            isPinned: formIsPinned,
            isActive: formIsActive,
            dokumenPendukung: cleanDokumen,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });

      if (onSaveList) {
        onSaveList(updatedList, `Format Uraian SPM [Kode ${formKodeSpp}] berhasil diperbarui.`);
      }
    } else {
      // Create new
      const newItem: UraianSpmSaktiItem = {
        id: `spm-custom-${Date.now()}`,
        kodeSpp: formKodeSpp.trim(),
        jenisSpm: formJenisSpm.trim(),
        kategoriPembayaran: formKategori,
        sifatPembayaran: formSifat.trim(),
        jenisBelanja: formJenisBelanja.trim(),
        formatBakuUraian: formFormatBaku.trim(),
        contohUraian: formContohUraian.trim(),
        placeholderGuide: formPlaceholderGuide.trim(),
        karakterMaks: 255,
        keterangan: formKeterangan.trim(),
        isPinned: formIsPinned,
        isActive: formIsActive,
        order: uraianList.length + 1,
        createdAt: new Date().toISOString(),
        dokumenPendukung: cleanDokumen
      };

      const newList = [newItem, ...uraianList];
      if (onSaveList) {
        onSaveList(newList, `Format Uraian SPM baru [Kode ${formKodeSpp}] berhasil ditambahkan.`);
      }
    }

    setIsFormModalOpen(false);
    setEditingItem(null);
  };

  // Handle Delete Single Item
  const handleDeleteItem = (item: UraianSpmSaktiItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Acuan Uraian SPM',
      message: `Apakah Anda yakin ingin menghapus acuan SPM [Kode ${item.kodeSpp}] "${item.jenisSpm}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Hapus Format',
      cancelText: 'Batal',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: async () => {
        const newList = uraianList.filter(u => u.id !== item.id);
        if (onSaveList) {
          onSaveList(newList, `Acuan SPM [Kode ${item.kodeSpp}] berhasil dihapus.`);
        }
      }
    });
  };

  // Handle Reset to Preset (with empty documents per user instruction)
  const handleResetPreset = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Muat Preset Acuan Standar SPM',
      message: `Tindakan ini akan memuat kembali 24 format acuan baku uraian SPM resmi SAKTI (UP/TUP, Gaji, PPNPN, Kontraktual, dsb) dengan format uraian dan jenis pembayaran standar. Dokumen pendukung wajib dikosongkan sementara. Lanjutkan?`,
      confirmText: 'Muat Preset Resmi',
      cancelText: 'Batal',
      variant: 'warning',
      iconType: 'reset',
      onConfirm: async () => {
        if (onResetPreset) {
          onResetPreset();
        } else if (onSaveList) {
          onSaveList(INITIAL_URAIAN_SPM_SAKTI_LIST, 'Berhasil memuat acuan standar baku SPM SAKTI.');
        }
      }
    });
  };

  // Handle Clear All Dokumen Pendukung Across All Items (Admin quick action)
  const handleClearAllDocuments = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Kosongkan Dokumen Pendukung',
      message: `Apakah Anda ingin mengosongkan seluruh pengaturan dokumen pendukung wajib pada 24+ format SPM sementara waktu untuk menunggu koordinasi? Format uraian, jenis belanja, dan sifat pembayaran tetap aman.`,
      confirmText: 'Kosongkan Dokumen',
      cancelText: 'Batal',
      variant: 'warning',
      iconType: 'reset',
      onConfirm: async () => {
        const cleared = uraianList.map(item => ({
          ...item,
          dokumenPendukung: []
        }));
        if (onSaveList) {
          onSaveList(cleared, 'Pengaturan dokumen pendukung wajib berhasil dikosongkan sementara.');
        }
      }
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Kode SPP', 'Jenis SPM', 'Kategori', 'Sifat Pembayaran', 'Akun Belanja', 'Format Baku Uraian', 'Contoh Uraian', 'Batas Karakter', 'Dokumen Pendukung Wajib', 'Keterangan'];
    const rows = filteredList.map(item => [
      `"${item.kodeSpp}"`,
      `"${item.jenisSpm.replace(/"/g, '""')}"`,
      `"${item.kategoriPembayaran}"`,
      `"${item.sifatPembayaran || ''}"`,
      `"${(item.jenisBelanja || '').replace(/"/g, '""')}"`,
      `"${item.formatBakuUraian.replace(/"/g, '""')}"`,
      `"${item.contohUraian.replace(/"/g, '""')}"`,
      `"${item.contohUraian.length} / 255"`,
      `"${(item.dokumenPendukung || []).map(d => d.namaDokumen).join('; ').replace(/"/g, '""')}"`,
      `"${(item.keterangan || item.tipsKppn || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Acuan_Format_Uraian_SPM_SAKTI_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      type: 'success',
      title: 'Data Diekspor',
      message: `${filteredList.length} format uraian SPM berhasil diekspor ke CSV.`
    });
  };

  // Helper badge for format dokumen
  const getFormatBadge = (fmt?: string) => {
    switch (fmt) {
      case 'TTE':
        return <span className="px-2 py-0.5 text-xs font-black rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-300">TTE</span>;
      case 'PDF':
        return <span className="px-2 py-0.5 text-xs font-black rounded-md bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border border-rose-300">PDF</span>;
      case 'ADK':
        return <span className="px-2 py-0.5 text-xs font-black rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-300">ADK</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-black rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300">{fmt || 'ASLI'}</span>;
    }
  };

  // Helper color for Kode SPP badge
  const getKodeBadgeGradient = (kode: string, kategori: string) => {
    if (kode.startsWith('3') || kategori === 'UANG_PERSEDIAAN_TUP') {
      return 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm shadow-orange-500/25 border-amber-400';
    }
    if (kategori === 'BELANJA_PEGAWAI') {
      return 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/25 border-purple-400';
    }
    if (kategori === 'PPNPN') {
      return 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-sm shadow-pink-500/25 border-pink-400';
    }
    if (kategori === 'PERJALANAN_DINAS') {
      return 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-500/25 border-sky-400';
    }
    if (kategori === 'BELANJA_MODAL') {
      return 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/25 border-emerald-400';
    }
    if (kategori === 'BELANJA_BARANG') {
      return 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-sm shadow-blue-500/25 border-blue-400';
    }
    if (kategori === 'RESTITUSI_PAJAK') {
      return 'bg-gradient-to-br from-rose-600 to-red-600 text-white shadow-sm shadow-rose-500/25 border-rose-400';
    }
    if (kategori === 'PENGESAHAN_HIBAH_BLU') {
      return 'bg-gradient-to-br from-teal-600 to-cyan-700 text-white shadow-sm shadow-teal-500/25 border-teal-400';
    }
    return 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-sm border-indigo-400';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* =========================================================================
          HERO BANNER: COLORFUL GRADIENT, METRICS, & SAKTI GUIDELINES
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white shadow-xl shadow-indigo-500/20 p-6 sm:p-7 border border-indigo-500/30">
        {/* Glow ambient decorations */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-white/15 text-cyan-200 border border-white/20 backdrop-blur-md">
              <BookOpen className="w-4 h-4 text-cyan-300" />
              <span>STANDARISASI URAIAN SPM PADA APLIKASI SAKTI</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Format Uraian SPM SAKTI &amp; Dokumen Pendukung
            </h3>
            <p className="text-sm sm:text-base text-blue-100 max-w-3xl leading-relaxed font-medium">
              Acuan baku penyusunan uraian Surat Perintah Membayar (SPM) pada aplikasi SAKTI (maksimal 255 karakter). Jenis belanja, sifat pembayaran, dan format uraian telah terstandarisasi. Dokumen pendukung dikosongkan sementara menunggu koordinasi lanjutan.
            </p>
          </div>

          {/* Quick Counter Badges with Color Accents */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">
            <div className="px-4 py-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-sm text-center min-w-[105px]">
              <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono block">
                {uraianList.length}
              </span>
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                Format SPM
              </span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-sm text-center min-w-[105px]">
              <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono block">
                ≤ 255
              </span>
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                Maks Karakter
              </span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-sm text-center min-w-[105px]">
              <span className="text-sm font-black text-rose-200 block py-1">
                Dikosongkan
              </span>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                Dokumen Wajib
              </span>
            </div>
          </div>
        </div>

        {/* Informational Banner Note */}
        <div className="relative z-10 mt-5 pt-4 border-t border-white/20 flex items-start gap-2.5 text-xs sm:text-sm text-blue-100">
          <Info className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
          <span>
            <strong>Petunjuk Satker:</strong> Klik tombol <span className="bg-white/25 text-yellow-300 font-black px-2 py-0.5 rounded text-xs border border-white/30">Salin</span> pada kolom contoh uraian untuk langsung menyalin teks ke clipboard. Bagian tanda kurung siku <span className="bg-amber-300 text-slate-950 font-mono font-black px-1.5 py-0.5 rounded text-xs">[ ... ]</span> telah disorot warna kuning agar satker mudah menyesuaikan dengan data transaksi masing-masing.
          </span>
        </div>
      </div>

      {/* =========================================================================
          ACTION TOOLBAR & SEARCH BAR
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm">
        {/* Left: Admin Actions & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={handleOpenAddModal}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Format Uraian SPM</span>
              </button>

              <button
                onClick={handleResetPreset}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs sm:text-sm font-black px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                title="Muat kembali seluruh 24 format acuan standar resmi SAKTI"
              >
                <Sparkles className="w-4 h-4" />
                <span>⚡ Muat Standar SAKTI</span>
              </button>

              <button
                onClick={handleClearAllDocuments}
                className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs sm:text-sm font-black px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                title="Kosongkan seluruh checklist dokumen pendukung wajib"
              >
                <Clock className="w-4 h-4" />
                <span>Kosongkan Dokumen Pendukung</span>
              </button>
            </>
          )}

          <button
            onClick={handleExportCSV}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-black px-3.5 py-2.5 rounded-xl flex items-center gap-2 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
            title="Download daftar format uraian SPM ke file CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>
        </div>

        {/* Right: Search & Sifat Bayar Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[260px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari kode SPP, jenis SPM, format, akun belanja..."
              className={`w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-xl border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 font-bold'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs`}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sifat Filter */}
          <select
            value={selectedSifat}
            onChange={(e) => {
              setSelectedSifat(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-black focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          >
            <option value="ALL">Semua Sifat Bayar</option>
            {sifatOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* =========================================================================
          COLORFUL CATEGORY FILTER CHIPS
          ========================================================================= */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
        {KATEGORI_PEMBAYARAN_OPTIONS.map(opt => {
          const count = opt.value === 'ALL'
            ? uraianList.length
            : uraianList.filter(u => u.kategoriPembayaran === opt.value).length;

          const isActive = selectedKategori === opt.value;

          return (
            <button
              key={opt.value}
              onClick={() => {
                setSelectedKategori(opt.value);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? opt.activeColor
                  : opt.inactiveColor
              }`}
            >
              <span>{opt.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-black ${
                isActive ? 'bg-white/25 text-white' : opt.countBg
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          MAIN TABLE: VIBRANT, COLORFUL & USER-FRIENDLY
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 via-slate-100 to-indigo-50/50 dark:from-slate-800 dark:via-slate-800 dark:to-indigo-950/40 text-slate-800 dark:text-slate-200 uppercase tracking-wider text-xs sm:text-sm font-black border-b-2 border-slate-300 dark:border-slate-700">
                <th className="py-4 px-3.5 w-24 text-center">Kode</th>
                <th className="py-4 px-4 min-w-[220px]">Jenis SPM &amp; Sifat Bayar</th>
                <th className="py-4 px-4 min-w-[360px]">Format Baku Uraian &amp; Contoh Siap Salin</th>
                <th className="py-4 px-4 min-w-[220px]">Dokumen Pendukung Wajib</th>
                <th className="py-4 px-3.5 min-w-[170px]">Keterangan</th>
                <th className="py-4 px-3 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <Search className="w-9 h-9 text-slate-300 dark:text-slate-600" />
                      <p className="font-black text-base text-slate-700 dark:text-slate-300">
                        Tidak ada format uraian SPM yang sesuai kriteria pencarian.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedKategori('ALL');
                          setSelectedSifat('ALL');
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 font-black hover:underline cursor-pointer"
                      >
                        Reset Filter &amp; Pencarian
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedList.map((item) => {
                  const isExpanded = !!expandedRowIds[item.id];
                  const charCount = item.contohUraian.length;
                  const isCharSafe = charCount <= 255;
                  const isCopied = copiedId === item.id;
                  const themeConfig = getCategoryTheme(item.kategoriPembayaran);
                  const docsCount = (item.dokumenPendukung || []).length;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors ${
                        themeConfig.rowBorder
                      } ${item.isPinned ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}`}
                    >
                      {/* 1. Kode SPP with rich vibrant gradient */}
                      <td className="py-4 px-3.5 text-center align-top">
                        <div className="flex flex-col items-center gap-1.5">
                          <span
                            className={`inline-block px-3 py-1.5 rounded-2xl text-sm sm:text-base font-black font-mono border ${getKodeBadgeGradient(
                              item.kodeSpp,
                              item.kategoriPembayaran
                            )}`}
                          >
                            {item.kodeSpp}
                          </span>
                          {item.isPinned && (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                              title="Format Prioritas"
                            >
                              <Pin className="w-3 h-3 text-amber-600" />
                              Prioritas
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Jenis SPM & Sifat Bayar */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-2">
                          <p className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                            {item.jenisSpm}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`px-2.5 py-1 text-xs font-black rounded-xl ${themeConfig.sifatBadge}`}>
                              {item.sifatPembayaran}
                            </span>
                            {item.jenisBelanja && (
                              <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                                {item.jenisBelanja}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Format Baku & Contoh Siap Salin */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-3">
                          {/* Format Baku Box */}
                          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 dark:from-slate-800 dark:via-slate-850 dark:to-indigo-950/30 border-2 border-indigo-200/90 dark:border-indigo-800/70 shadow-xs text-xs sm:text-sm leading-relaxed text-slate-900 dark:text-slate-100 select-all">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                                <FileCode className="w-3.5 h-3.5 text-indigo-200" />
                                Format Baku Template:
                              </span>
                            </div>
                            <div className="font-mono text-slate-900 dark:text-slate-100">
                              {renderHighlightedFormat(item.formatBakuUraian)}
                            </div>
                          </div>

                          {/* Contoh Konkret Box with Copy Button & Counter */}
                          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-sky-50/60 to-indigo-50/50 dark:from-blue-950/50 dark:via-slate-900 dark:to-indigo-950/30 border-2 border-blue-400/80 dark:border-blue-600/80 shadow-xs text-xs sm:text-sm leading-relaxed text-slate-900 dark:text-slate-100 relative">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
                                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                                Contoh Siap Salin:
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                                    isCharSafe
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                                      : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  {charCount} / 255 Karakter
                                </span>
                                <button
                                  onClick={(e) => handleCopyUraian(item, e)}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                                    isCopied
                                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/25'
                                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25'
                                  }`}
                                  title="Salin contoh uraian ini ke clipboard"
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{isCopied ? 'Tersalin!' : 'Salin'}</span>
                                </button>
                              </div>
                            </div>
                            <p className="font-bold text-slate-900 dark:text-slate-100 leading-normal select-all">
                              {item.contohUraian}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 4. Dokumen Pendukung Wajib (Empty state per user request) */}
                      <td className="py-4 px-4 align-top">
                        {docsCount === 0 ? (
                          <div className="flex flex-col items-start gap-1 py-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80 shadow-xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>Menunggu Koordinasi</span>
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                              Dikosongkan sementara
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                                {docsCount} Dokumen Wajib
                              </span>
                              <button
                                onClick={() => toggleRowExpand(item.id)}
                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>{isExpanded ? 'Tutup' : 'Lihat'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            <ul className="space-y-1.5">
                              {(item.dokumenPendukung || []).slice(0, isExpanded ? undefined : 2).map((doc, dIdx) => (
                                <li key={dIdx} className="flex items-start gap-1.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                                  <span className="text-emerald-500 shrink-0 font-bold mt-0.5">✓</span>
                                  <span className="leading-tight flex-1">
                                    {doc.namaDokumen}
                                    {doc.format && (
                                      <span className="ml-1.5 inline-block">
                                        {getFormatBadge(doc.format)}
                                      </span>
                                    )}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>

                      {/* 5. Keterangan */}
                      <td className="py-4 px-3.5 align-top">
                        {item.keterangan ? (
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                            <p className="line-clamp-4 hover:line-clamp-none transition-all">{item.keterangan}</p>
                          </div>
                        ) : (
                          <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-bold block text-center">
                            —
                          </span>
                        )}
                      </td>

                      {/* 6. Aksi */}
                      <td className="py-4 px-3 text-center align-top">
                        <div className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => setDetailModalItem(item)}
                            className="w-full bg-gradient-to-r from-slate-100 to-blue-50 dark:from-slate-800 dark:to-slate-800 hover:from-blue-600 hover:to-indigo-600 hover:text-white text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 font-black text-xs sm:text-sm py-2 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Buka rincian juknis lengkap"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>

                          {isAdmin && (
                            <div className="flex items-center gap-1.5 w-full">
                              <button
                                onClick={(e) => handleOpenEditModal(item, e)}
                                className="flex-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                title="Ubah format SPM"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={(e) => handleDeleteItem(item, e)}
                                className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold py-1.5 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                                title="Hapus format"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
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
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              totalItems={totalItems}
              pageSizeOptions={[5, 10, 25, 50]}
            />
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL DETAIL LENGKAP ACUAN SPM & DOKUMEN PENDUKUNG (FOR SATKER & ADMIN)
          ========================================================================= */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-300 dark:border-slate-700 shadow-2xl p-6 sm:p-7 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-black font-mono border ${getKodeBadgeGradient(
                      detailModalItem.kodeSpp,
                      detailModalItem.kategoriPembayaran
                    )}`}
                  >
                    KODE SPP: {detailModalItem.kodeSpp}
                  </span>
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                    {detailModalItem.sifatPembayaran}
                  </span>
                  {detailModalItem.jenisBelanja && (
                    <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {detailModalItem.jenisBelanja}
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-1">
                  {detailModalItem.jenisSpm}
                </h3>
              </div>

              <button
                onClick={() => setDetailModalItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Sections */}
            <div className="space-y-6">
              
              {/* Section 1: Format Baku */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  <span>1. Format Baku Uraian pada Aplikasi SAKTI</span>
                </h4>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 dark:from-slate-800 dark:via-slate-850 dark:to-indigo-950/30 border-2 border-indigo-200 dark:border-indigo-800/80 text-xs sm:text-sm font-mono select-all text-slate-900 dark:text-slate-100 leading-relaxed shadow-xs">
                  {renderHighlightedFormat(detailModalItem.formatBakuUraian)}
                </div>
                {detailModalItem.placeholderGuide && (
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 bg-amber-50/70 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-300 dark:border-amber-800 leading-relaxed">
                    💡 <strong>Panduan Isian Placeholder:</strong> {detailModalItem.placeholderGuide}
                  </p>
                )}
              </div>

              {/* Section 2: Contoh Uraian Siap Salin */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>2. Contoh Uraian Siap Pakai</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs sm:text-sm font-mono font-black px-2.5 py-1 rounded-lg border ${
                        detailModalItem.contohUraian.length <= 255
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {detailModalItem.contohUraian.length} / 255 Karakter
                    </span>
                    <button
                      onClick={(e) => handleCopyUraian(detailModalItem, e)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Salin Uraian</span>
                    </button>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-sky-50/60 to-indigo-50/50 dark:from-blue-950/50 dark:via-slate-900 dark:to-indigo-950/30 border-2 border-blue-400 dark:border-blue-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed select-all shadow-xs">
                  {detailModalItem.contohUraian}
                </div>
              </div>

              {/* Section 3: Dokumen Pendukung yang Wajib Dilampirkan */}
              <div className="space-y-2.5">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>3. Dokumen Pendukung Wajib SAKTI</span>
                </h4>
                
                {(detailModalItem.dokumenPendukung || []).length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800/80 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-amber-900 dark:text-amber-200 text-sm">
                        Daftar Dokumen Pendukung Dikosongkan Sementara
                      </p>
                      <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                        Daftar dokumen pendukung wajib saat ini dikosongkan sementara menunggu koordinasi teknis lebih lanjut. Satker dapat berkonsultasi langsung dengan CSO/FO KPPN Semarang I untuk kelengkapan berkas lampiran.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    {(detailModalItem.dokumenPendukung || []).map((doc, idx) => (
                      <div key={idx} className="p-3.5 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 text-xs sm:text-sm">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {doc.namaDokumen}
                            </p>
                            {doc.keterangan && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {doc.keterangan}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {doc.wajib !== false ? (
                            <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              WAJIB
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Opsional
                            </span>
                          )}
                          {getFormatBadge(doc.format)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 4: Keterangan */}
              {detailModalItem.keterangan && (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm space-y-1.5">
                  <div className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-200 text-xs sm:text-sm uppercase">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Keterangan Tambahan:</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {detailModalItem.keterangan}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL ADMIN: FORM TAMBAH / EDIT FORMAT URAIAN SPM
          ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-slate-300 dark:border-slate-700 shadow-2xl p-6 sm:p-7 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {editingItem ? 'Edit Acuan Format Uraian SPM' : 'Tambah Acuan Format Uraian SPM Baru'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Definisikan kode SPP, jenis pembayaran, format uraian baku (maks 255 karakter), serta checklist dokumen pendukung jika ada.
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-5 text-xs sm:text-sm">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-black text-slate-800 dark:text-slate-200 mb-1.5">
                    Kode SPP SAKTI *
                  </label>
                  <input
                    type="text"
                    required
                    value={formKodeSpp}
                    onChange={(e) => setFormKodeSpp(e.target.value)}
                    placeholder="misal: 111, 211, 311"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-black text-slate-800 dark:text-slate-200 mb-1.5">
                    Jenis SPM / Pembayaran *
                  </label>
                  <input
                    type="text"
                    required
                    value={formJenisSpm}
                    onChange={(e) => setFormJenisSpm(e.target.value)}
                    placeholder="misal: SPM Non Gaji Kontraktual (Termin Pengadaan)"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-black text-slate-800 dark:text-slate-200 mb-1.5">
                    Kategori Pembayaran
                  </label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as KategoriPembayaranSpm)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {KATEGORI_PEMBAYARAN_OPTIONS.filter(o => o.value !== 'ALL').map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-800 dark:text-slate-200 mb-1.5">
                    Sifat Pembayaran
                  </label>
                  <input
                    type="text"
                    value={formSifat}
                    onChange={(e) => setFormSifat(e.target.value)}
                    placeholder="misal: Pembayaran Langsung (LS)"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-800 dark:text-slate-200 mb-1.5">
                    Akun / Jenis Belanja
                  </label>
                  <input
                    type="text"
                    value={formJenisBelanja}
                    onChange={(e) => setFormJenisBelanja(e.target.value)}
                    placeholder="misal: 53 (Belanja Modal)"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-800 dark:text-slate-200 mb-1.5">
                  Format Baku Uraian (Pola / Template Acuan) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formFormatBaku}
                  onChange={(e) => setFormFormatBaku(e.target.value)}
                  placeholder="Pembayaran Termin ke-[X] Kontrak Pengadaan [Nama Pekerjaan] sesuai BAST No. [No BAST] tgl [Tgl] DIPA Satker [Nama Satker]"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-black text-slate-800 dark:text-slate-200">
                    Contoh Uraian Siap Pakai (Maks 255 Karakter) *
                  </label>
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    formContohUraian.length <= 255
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                  }`}>
                    {formContohUraian.length} / 255 Karakter
                  </span>
                </div>
                <textarea
                  rows={2}
                  required
                  value={formContohUraian}
                  onChange={(e) => setFormContohUraian(e.target.value)}
                  placeholder="Tuliskan contoh konkret yang bisa langsung disalin satker..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
                {formContohUraian.length > 255 && (
                  <p className="text-rose-600 dark:text-rose-400 text-xs font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Peringatan: Panjang uraian melebihi batas 255 karakter SAKTI! Mohon persingkat agar tidak tertolak sistem.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-black text-slate-800 dark:text-slate-200 mb-1.5">
                  Panduan Isian Placeholder (Tanda [ ... ])
                </label>
                <input
                  type="text"
                  value={formPlaceholderGuide}
                  onChange={(e) => setFormPlaceholderGuide(e.target.value)}
                  placeholder="[Nama Satker] = Nama Satker; [TA] = Tahun Anggaran; [No BAST] = Nomor BAST."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Dokumen Pendukung Dynamic Builder */}
              <div className="space-y-2.5 border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-slate-800 dark:text-slate-200">
                    Dokumen Pendukung Wajib yang Diunggah pada SAKTI ({formDokumen.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddDokumenRow}
                    className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tambah Baris Dokumen</span>
                  </button>
                </div>

                {formDokumen.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    Dokumen pendukung dikosongkan sementara. Klik tombol "+ Tambah Baris Dokumen" jika ada dokumen wajib yang ingin ditambahkan.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {formDokumen.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                        <input
                          type="text"
                          value={doc.namaDokumen}
                          onChange={(e) => handleUpdateDokumenField(idx, 'namaDokumen', e.target.value)}
                          placeholder="Nama dokumen pendukung..."
                          className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium"
                        />
                        <select
                          value={doc.format || 'PDF'}
                          onChange={(e) => handleUpdateDokumenField(idx, 'format', e.target.value)}
                          className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm font-bold w-24"
                        >
                          <option value="PDF">PDF</option>
                          <option value="TTE">TTE</option>
                          <option value="ADK">ADK</option>
                          <option value="ASLI/FISIK">ASLI</option>
                        </select>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={doc.wajib !== false}
                            onChange={(e) => handleUpdateDokumenField(idx, 'wajib', e.target.checked)}
                            className="rounded"
                          />
                          Wajib
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveDokumenRow(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-black text-slate-800 dark:text-slate-200 mb-1.5">
                  Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Keterangan tambahan jika diperlukan (dikosongkan terlebih dahulu jika belum ada)..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200 font-bold">
                  <input
                    type="checkbox"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="rounded"
                  />
                  <span>Sematkan di Atas (Prioritas)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200 font-bold">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded"
                  />
                  <span>Status Aktif</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Format Uraian SPM</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <ModernConfirmModal
          modal={confirmModal}
          onClose={() => setConfirmModal(null)}
          isDark={isDark}
        />
      )}
    </div>
  );
};
