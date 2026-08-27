import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Sparkles,
  Save,
  RotateCcw,
  Copy,
  Layers,
  HelpCircle,
  Video,
  X,
  FileSpreadsheet,
  Link as LinkIcon,
  Tag,
  Clock,
  Eye,
  CheckSquare,
  Square,
  Upload,
  ArrowUpDown,
  Pin
} from 'lucide-react';
import {
  JuknisBlangkoItem,
  KnowledgeItem,
  KnowledgeCategory,
  KnowledgeStep,
  AppTheme,
  DashboardConfig
} from '../../types';
import { INITIAL_JUKNIS_BLANGKO_LIST, JUKNIS_APPLICATION_CATEGORIES } from '../../data/initialJuknisData';
import { INITIAL_KNOWLEDGE_ITEMS } from '../../data/initialKnowledgeData';
import { ModernConfirmModal, ConfirmModalState } from '../ModernConfirmModal';
import { useToast } from '../ToastNotification';
import { db, doc, onSnapshot, setDoc } from '../../lib/firebase';

interface KelolaPengetahuanJuknisSectionProps {
  theme?: AppTheme;
  dashboardConfig: DashboardConfig;
  onUpdateDashboardConfig: (newConfig: DashboardConfig) => void;
  isAdminAuthenticated: boolean;
}

export const KelolaPengetahuanJuknisSection: React.FC<KelolaPengetahuanJuknisSectionProps> = ({
  theme = 'light',
  dashboardConfig,
  onUpdateDashboardConfig,
  isAdminAuthenticated
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();

  // Active Admin Sub-Tab: 'juknis_table' (Direktori Blangko & Juknis) vs 'knowledge_articles' (Artikel & Petunjuk Interaktif)
  const [activeSubTab, setActiveSubTab] = useState<'juknis_table' | 'knowledge_articles'>('juknis_table');

  // =========================================================================
  // 1. STATE & SYNC UNTUK JUKNIS BLANGKO (TABEL DIREKTORI)
  // =========================================================================
  const [juknisList, setJuknisList] = useState<JuknisBlangkoItem[]>(() => {
    try {
      const saved = localStorage.getItem('kppn_juknis_blangko_items');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed parsing local juknis items', e);
    }
    if (dashboardConfig.juknisBlangkoList && Array.isArray(dashboardConfig.juknisBlangkoList)) {
      return dashboardConfig.juknisBlangkoList;
    }
    return INITIAL_JUKNIS_BLANGKO_LIST;
  });

  // Save Juknis changes helper
  const saveJuknisList = (newList: JuknisBlangkoItem[], notifyToast = true) => {
    setJuknisList(newList);
    try {
      localStorage.setItem('kppn_juknis_blangko_items', JSON.stringify(newList));
    } catch (e) {
      console.warn('Error saving juknis to localStorage', e);
    }
    onUpdateDashboardConfig({
      ...dashboardConfig,
      juknisBlangkoList: newList
    });
    try {
      setDoc(doc(db, 'settings', 'juknis_directory'), {
        items: newList,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => console.warn('Firebase save juknis notice:', err));
    } catch (e) {
      console.warn('Firebase save juknis notice:', e);
    }
    if (notifyToast) {
      showToast({
        type: 'success',
        title: 'Data Juknis Diperbarui',
        message: newList.length === 0 ? 'Semua blangko & juknis telah dikosongkan.' : `${newList.length} data blangko/juknis berhasil disimpan.`
      });
    }
  };

  // Firebase Realtime Listener for Juknis
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'juknis_directory'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.items !== undefined && Array.isArray(data.items)) {
            setJuknisList(data.items);
            try {
              localStorage.setItem('kppn_juknis_blangko_items', JSON.stringify(data.items));
            } catch (e) {
              console.warn(e);
            }
          }
        }
      }, (err) => {
        console.warn('Firebase juknis sync err:', err);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Firebase error juknis:', e);
    }
  }, []);

  // Filter & Search Juknis
  const [searchJuknis, setSearchJuknis] = useState<string>('');
  const [filterJuknisCategory, setFilterJuknisCategory] = useState<string>('ALL');
  const [selectedJuknisIds, setSelectedJuknisIds] = useState<string[]>([]);

  // Modal State for Juknis Form
  const [isJuknisModalOpen, setIsJuknisModalOpen] = useState<boolean>(false);
  const [editingJuknis, setEditingJuknis] = useState<JuknisBlangkoItem | null>(null);
  const [juknisFormNama, setJuknisFormNama] = useState<string>('');
  const [juknisFormKategori, setJuknisFormKategori] = useState<string>('APLIKASI GAJI WEB');
  const [juknisFormCustomKategori, setJuknisFormCustomKategori] = useState<string>('');
  const [juknisFormTahun, setJuknisFormTahun] = useState<string>('2024');
  const [juknisFormLink, setJuknisFormLink] = useState<string>('https://sakti.kemenkeu.go.id');
  const [juknisFormFormat, setJuknisFormFormat] = useState<'PDF' | 'DOCX' | 'XLSX' | 'ZIP' | 'LINK' | 'CSV'>('PDF');
  const [juknisFormKeterangan, setJuknisFormKeterangan] = useState<string>('');
  const [juknisFormIsActive, setJuknisFormIsActive] = useState<boolean>(true);

  // Open Juknis Add Modal
  const handleOpenAddJuknis = () => {
    setEditingJuknis(null);
    setJuknisFormNama('');
    setJuknisFormKategori('APLIKASI GAJI WEB');
    setJuknisFormCustomKategori('');
    setJuknisFormTahun('2024');
    setJuknisFormLink('https://sakti.kemenkeu.go.id');
    setJuknisFormFormat('PDF');
    setJuknisFormKeterangan('');
    setJuknisFormIsActive(true);
    setIsJuknisModalOpen(true);
  };

  // Open Juknis Edit Modal
  const handleOpenEditJuknis = (item: JuknisBlangkoItem) => {
    setEditingJuknis(item);
    setJuknisFormNama(item.namaBlangko);
    if (JUKNIS_APPLICATION_CATEGORIES.includes(item.kategoriAplikasi)) {
      setJuknisFormKategori(item.kategoriAplikasi);
      setJuknisFormCustomKategori('');
    } else {
      setJuknisFormKategori('CUSTOM');
      setJuknisFormCustomKategori(item.kategoriAplikasi);
    }
    setJuknisFormTahun(item.tahunRilis || '-');
    setJuknisFormLink(item.linkDownload || '');
    setJuknisFormFormat(item.fileFormat || 'PDF');
    setJuknisFormKeterangan(item.keterangan || '');
    setJuknisFormIsActive(item.isActive !== false);
    setIsJuknisModalOpen(true);
  };

  // Save Juknis Form
  const handleSaveJuknis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!juknisFormNama.trim()) {
      alert('Nama Blangko / Judul Juknis wajib diisi!');
      return;
    }

    const finalCategory = juknisFormKategori === 'CUSTOM'
      ? (juknisFormCustomKategori.trim() || 'JUKNIS LAINNYA')
      : juknisFormKategori;

    if (editingJuknis) {
      // Update
      const updated: JuknisBlangkoItem = {
        ...editingJuknis,
        namaBlangko: juknisFormNama.trim(),
        kategoriAplikasi: finalCategory.toUpperCase(),
        tahunRilis: juknisFormTahun.trim() || '-',
        linkDownload: juknisFormLink.trim() || 'https://sakti.kemenkeu.go.id',
        fileFormat: juknisFormFormat,
        keterangan: juknisFormKeterangan.trim(),
        isActive: juknisFormIsActive,
        updatedAt: new Date().toISOString()
      };
      const newList = juknisList.map(j => j.id === editingJuknis.id ? updated : j);
      saveJuknisList(newList);
    } else {
      // Create
      const newItem: JuknisBlangkoItem = {
        id: 'jb-' + Date.now(),
        namaBlangko: juknisFormNama.trim(),
        kategoriAplikasi: finalCategory.toUpperCase(),
        tahunRilis: juknisFormTahun.trim() || '-',
        linkDownload: juknisFormLink.trim() || 'https://sakti.kemenkeu.go.id',
        fileFormat: juknisFormFormat,
        keterangan: juknisFormKeterangan.trim(),
        isActive: juknisFormIsActive,
        order: juknisList.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const newList = [newItem, ...juknisList];
      saveJuknisList(newList);
    }

    setIsJuknisModalOpen(false);
  };

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  // Delete Single Juknis
  const handleDeleteJuknis = (id: string) => {
    const item = juknisList.find(j => j.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Format / Juknis',
      message: `Apakah Anda yakin ingin menghapus "${item?.namaBlangko || 'item ini'}" dari direktori juknis?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        const newList = juknisList.filter(j => j.id !== id);
        saveJuknisList(newList);
      }
    });
  };

  // Batch Delete Juknis
  const handleBatchDeleteJuknis = () => {
    if (selectedJuknisIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Massal Format / Juknis',
      message: `Apakah Anda yakin ingin menghapus ${selectedJuknisIds.length} juknis terpilih sekaligus?`,
      confirmText: `Hapus ${selectedJuknisIds.length} Juknis`,
      cancelText: 'Batal',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        const newList = juknisList.filter(j => !selectedJuknisIds.includes(j.id));
        saveJuknisList(newList);
        setSelectedJuknisIds([]);
      }
    });
  };

  // Clear All Juknis
  const handleClearAllJuknis = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus SEMUA Format & Juknis',
      message: `Apakah Anda yakin ingin mengosongkan dan MENGHAPUS SEMUA ${juknisList.length} data blangko/juknis? Seluruh isi tabel direktori akan dihapus.`,
      confirmText: 'Ya, Kosongkan Semua',
      cancelText: 'Batal',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        saveJuknisList([]);
        setSelectedJuknisIds([]);
      }
    });
  };

  // Reset to Default Preset Juknis
  const handleResetToPresetJuknis = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Muat Preset Juknis Resmi Kemenkeu',
      message: 'Tindakan ini akan memuat seluruh daftar blangko dan juknis standar lengkap (DIGIT, MonSAKTI, TBS, Gaji Web, GPP Desktop, PPNPN, Digipay Satu, TTE SAKTI, dsb). Lanjutkan?',
      confirmText: 'Ya, Muat Preset Lengkap',
      cancelText: 'Batal',
      variant: 'info',
      iconType: 'sparkles',
      onConfirm: () => {
        saveJuknisList(INITIAL_JUKNIS_BLANGKO_LIST);
        showToast({
          type: 'success',
          title: 'Preset Berhasil Dimuat',
          message: `${INITIAL_JUKNIS_BLANGKO_LIST.length} format & juknis resmi telah diterapkan.`
        });
      }
    });
  };

  // =========================================================================
  // 2. STATE & SYNC UNTUK ARTIKEL PENGETAHUAN INTERAKTIF
  // =========================================================================
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>(() => {
    try {
      const saved = localStorage.getItem('kppn_knowledge_items');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error parsing knowledge items', e);
    }
    return INITIAL_KNOWLEDGE_ITEMS;
  });

  // Firebase Realtime Listener for Knowledge Base
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'knowledge_base'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.items !== undefined && Array.isArray(data.items)) {
            setKnowledgeList(data.items);
            try {
              localStorage.setItem('kppn_knowledge_items', JSON.stringify(data.items));
            } catch (e) {
              console.warn(e);
            }
          }
        }
      }, (err) => {
        console.warn('Firebase knowledge sync err:', err);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Firebase error knowledge listener:', e);
    }
  }, []);

  const saveKnowledgeList = (newList: KnowledgeItem[]) => {
    setKnowledgeList(newList);
    try {
      localStorage.setItem('kppn_knowledge_items', JSON.stringify(newList));
    } catch (e) {
      console.warn('Error saving knowledge list', e);
    }
    try {
      setDoc(doc(db, 'settings', 'knowledge_base'), {
        items: newList,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => console.warn('Firebase error knowledge base:', err));
    } catch (e) {
      console.warn('Firebase error knowledge base', e);
    }
    showToast({
      type: 'success',
      title: 'Artikel Pengetahuan Diperbarui',
      message: newList.length === 0 ? 'Semua artikel pengetahuan telah dikosongkan.' : `${newList.length} artikel interaktif berhasil diperbarui.`
    });
  };

  // Clear All Knowledge Articles
  const handleClearAllArticles = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus SEMUA Artikel Pengetahuan',
      message: `Apakah Anda yakin ingin MENGHAPUS SEMUA ${knowledgeList.length} artikel petunjuk pengetahuan? Modul petunjuk interaktif akan menjadi kosong.`,
      confirmText: 'Ya, Kosongkan Semua',
      cancelText: 'Batal',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        saveKnowledgeList([]);
      }
    });
  };

  // Reset to Default Preset Knowledge Articles
  const handleResetToPresetArticles = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Muat Preset Artikel Panduan SAKTI',
      message: 'Muat kembali artikel panduan standar resmi KPPN Semarang I? Data artikel yang ada saat ini akan digantikan dengan preset awal.',
      confirmText: 'Ya, Muat Preset',
      cancelText: 'Batal',
      variant: 'info',
      iconType: 'sparkles',
      onConfirm: () => {
        saveKnowledgeList(INITIAL_KNOWLEDGE_ITEMS);
      }
    });
  };

  // Modal State for Knowledge Article
  const [isArticleModalOpen, setIsArticleModalOpen] = useState<boolean>(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeItem | null>(null);
  const [artTitle, setArtTitle] = useState<string>('');
  const [artCategory, setArtCategory] = useState<KnowledgeCategory>('JUKNIS_SAKTI');
  const [artSummary, setArtSummary] = useState<string>('');
  const [artContentMarkdown, setArtContentMarkdown] = useState<string>('');
  const [artVideoUrl, setArtVideoUrl] = useState<string>('');
  const [artDownloadUrl, setArtDownloadUrl] = useState<string>('');
  const [artReferenceUrl, setArtReferenceUrl] = useState<string>('');
  const [artAuthor, setArtAuthor] = useState<string>('Seksi MSKI KPPN Semarang I');
  const [artIsPinned, setArtIsPinned] = useState<boolean>(false);
  const [artTags, setArtTags] = useState<string>('SAKTI, Juknis, IKPA');
  const [artSteps, setArtSteps] = useState<KnowledgeStep[]>([]);

  // Search Knowledge
  const [searchKnowledge, setSearchKnowledge] = useState<string>('');
  const [filterKnowledgeCategory, setFilterKnowledgeCategory] = useState<string>('ALL');

  const handleOpenAddArticle = () => {
    setEditingArticle(null);
    setArtTitle('');
    setArtCategory('JUKNIS_SAKTI');
    setArtSummary('');
    setArtContentMarkdown('');
    setArtVideoUrl('');
    setArtDownloadUrl('');
    setArtReferenceUrl('');
    setArtAuthor('Seksi MSKI KPPN Semarang I');
    setArtIsPinned(false);
    setArtTags('SAKTI, Juknis, Panduan');
    setArtSteps([
      { stepNumber: 1, title: 'Langkah Pertama', description: 'Uraian detail instruksi...', importantNotes: 'Catatan penting' }
    ]);
    setIsArticleModalOpen(true);
  };

  const handleOpenEditArticle = (item: KnowledgeItem) => {
    setEditingArticle(item);
    setArtTitle(item.title);
    setArtCategory(item.category);
    setArtSummary(item.summary);
    setArtContentMarkdown(item.contentMarkdown || '');
    setArtVideoUrl(item.videoUrl || '');
    setArtDownloadUrl(item.downloadUrl || '');
    setArtReferenceUrl(item.referenceUrl || '');
    setArtAuthor(item.author || 'Seksi MSKI KPPN Semarang I');
    setArtIsPinned(item.isPinned || false);
    setArtTags(item.tags ? item.tags.join(', ') : '');
    setArtSteps(item.steps ? [...item.steps] : []);
    setIsArticleModalOpen(true);
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle.trim()) {
      alert('Judul petunjuk pengetahuan wajib diisi!');
      return;
    }

    const tagArray = artTags.split(',').map(t => t.trim()).filter(Boolean);

    if (editingArticle) {
      const updated: KnowledgeItem = {
        ...editingArticle,
        title: artTitle.trim(),
        category: artCategory,
        summary: artSummary.trim(),
        contentMarkdown: artContentMarkdown,
        videoUrl: artVideoUrl.trim(),
        downloadUrl: artDownloadUrl.trim(),
        referenceUrl: artReferenceUrl.trim(),
        author: artAuthor.trim(),
        isPinned: artIsPinned,
        tags: tagArray,
        steps: artSteps,
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
      };
      const newList = knowledgeList.map(k => k.id === editingArticle.id ? updated : k);
      saveKnowledgeList(newList);
    } else {
      const newItem: KnowledgeItem = {
        id: 'kn-' + Date.now(),
        title: artTitle.trim(),
        category: artCategory,
        summary: artSummary.trim(),
        contentMarkdown: artContentMarkdown,
        videoUrl: artVideoUrl.trim(),
        downloadUrl: artDownloadUrl.trim(),
        referenceUrl: artReferenceUrl.trim(),
        author: artAuthor.trim(),
        isPinned: artIsPinned,
        tags: tagArray,
        steps: artSteps,
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
      };
      const newList = [newItem, ...knowledgeList];
      saveKnowledgeList(newList);
    }

    setIsArticleModalOpen(false);
  };

  const handleDeleteArticle = (id: string) => {
    const item = knowledgeList.find(k => k.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Artikel Petunjuk',
      message: `Hapus petunjuk "${item?.title || 'ini'}"?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        const newList = knowledgeList.filter(k => k.id !== id);
        saveKnowledgeList(newList);
      }
    });
  };

  // Group Juknis by Application Category
  const filteredJuknis = juknisList.filter(item => {
    if (filterJuknisCategory !== 'ALL' && item.kategoriAplikasi !== filterJuknisCategory) return false;
    if (!searchJuknis.trim()) return true;
    const q = searchJuknis.toLowerCase();
    return (
      item.namaBlangko.toLowerCase().includes(q) ||
      item.kategoriAplikasi.toLowerCase().includes(q) ||
      (item.tahunRilis && item.tahunRilis.toLowerCase().includes(q)) ||
      (item.keterangan && item.keterangan.toLowerCase().includes(q))
    );
  });

  // Unique categories list
  const uniqueCategories: string[] = Array.from(new Set(juknisList.map(j => j.kategoriAplikasi))).filter((cat): cat is string => Boolean(cat));

  // Grouping map
  const groupedJuknis = uniqueCategories.reduce((acc, cat) => {
    const items = filteredJuknis.filter(j => j.kategoriAplikasi === cat);
    if (items.length > 0) {
      acc[cat] = items;
    }
    return acc;
  }, {} as Record<string, JuknisBlangkoItem[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Confirmation Modal */}
      {confirmModal && (
        <ModernConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          variant={confirmModal.variant}
          iconType={confirmModal.iconType}
          onConfirm={async () => {
            await confirmModal.onConfirm();
            setConfirmModal(null);
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Main Admin Section Header */}
      <div className={`p-6 sm:p-7 rounded-3xl border shadow-xl transition-all duration-300 ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-gradient-to-r from-cyan-900 via-sky-900 to-indigo-900 border-slate-700 text-white'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-white/10 text-cyan-200 border border-white/15">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>MODUL ADMIN: KELOLA PENGETAHUAN &amp; JUKNIS SAKTI</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Pusat Manajemen Direktori Format, Juknis &amp; Petunjuk SAKTI
            </h2>
            <p className="text-xs sm:text-sm text-cyan-100/90 max-w-3xl leading-relaxed">
              Kelola tabel kumpulan format/blangko resmi Kemenkeu (tata letak tabel biru berjenjang) dan artikel interaktif petunjuk teknis pelaksanaan anggaran.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[100px]">
              <span className="text-xl font-black text-amber-300 font-mono block">
                {juknisList.length}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-200">
                Format/Juknis
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[100px]">
              <span className="text-xl font-black text-cyan-300 font-mono block">
                {knowledgeList.length}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-200">
                Artikel Edukasi
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/15">
          <button
            onClick={() => setActiveSubTab('juknis_table')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeSubTab === 'juknis_table'
                ? 'bg-cyan-400 text-slate-950 shadow-lg font-black ring-2 ring-white/50'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>1. Direktori Format &amp; Juknis Resmi (Tabel)</span>
            <span className="bg-slate-950 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {juknisList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('knowledge_articles')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeSubTab === 'knowledge_articles'
                ? 'bg-cyan-400 text-slate-950 shadow-lg font-black ring-2 ring-white/50'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Artikel &amp; Petunjuk Interaktif (Knowledge Base)</span>
            <span className="bg-slate-950 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {knowledgeList.length}
            </span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: DIREKTORI FORMAT & JUKNIS RESMI (TABEL BLUEPRINT)
          ========================================================================= */}
      {activeSubTab === 'juknis_table' && (
        <div className="space-y-5">
          
          {/* Action Toolbar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleOpenAddJuknis}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Format / Juknis Baru</span>
              </button>

              <button
                onClick={handleResetToPresetJuknis}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-black px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                title="Muat seluruh 39+ format juknis standar Ditjen Perbendaharaan"
              >
                <Sparkles className="w-4 h-4" />
                <span>⚡ Muat Preset Juknis Kemenkeu</span>
              </button>

              {selectedJuknisIds.length > 0 && (
                <button
                  onClick={handleBatchDeleteJuknis}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-black px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer animate-pulse"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus ({selectedJuknisIds.length}) Terpilih</span>
                </button>
              )}

              {juknisList.length > 0 && (
                <button
                  onClick={handleClearAllJuknis}
                  className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-black px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  title="Hapus semua baris data juknis"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Semua Juknis ({juknisList.length})</span>
                </button>
              )}
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchJuknis}
                  onChange={(e) => setSearchJuknis(e.target.value)}
                  placeholder="Cari blangko/juknis..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <select
                value={filterJuknisCategory}
                onChange={(e) => setFilterJuknisCategory(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 max-w-[200px]"
              >
                <option value="ALL">Semua Kategori ({juknisList.length})</option>
                {uniqueCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container in Official Ditjen Perbendaharaan Style */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider border-b border-cyan-500">
                    <th className="py-3 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedJuknisIds.length > 0 && selectedJuknisIds.length === filteredJuknis.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedJuknisIds(filteredJuknis.map(j => j.id));
                          } else {
                            setSelectedJuknisIds([]);
                          }
                        }}
                        className="rounded cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4 text-slate-950 font-black">NAMA BLANGKO / PETUNJUK TEKNIS</th>
                    <th className="py-3 px-4 text-center w-28 text-slate-950 font-black">TAHUN RILIS</th>
                    <th className="py-3 px-4 text-center w-40 text-slate-950 font-black">LINK DOWNLOAD</th>
                    <th className="py-3 px-4 text-center w-28 text-slate-950 font-black">AKSI ADMIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {Object.keys(groupedJuknis).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 font-bold">
                        <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        Belum ada blangko atau juknis yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(groupedJuknis).map(([categoryName, items]) => (
                      <React.Fragment key={categoryName}>
                        {/* Group Header Row (Yellow Banner like the original document) */}
                        <tr className="bg-yellow-300 dark:bg-yellow-500 text-blue-900 dark:text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wide border-t-2 border-b-2 border-yellow-400 dark:border-yellow-600">
                          <td colSpan={5} className="py-2.5 px-4 text-center">
                            ⭐ {categoryName} ({items.length} Berkas)
                          </td>
                        </tr>

                        {/* Items under this Category */}
                        {items.map((item, idx) => {
                          const isSelected = selectedJuknisIds.includes(item.id);
                          return (
                            <tr
                              key={item.id}
                              className={`transition-colors duration-150 ${
                                isSelected
                                  ? 'bg-cyan-50 dark:bg-cyan-950/30'
                                  : idx % 2 === 0
                                  ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                  : 'bg-slate-50/70 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <td className="py-2.5 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedJuknisIds(prev => [...prev, item.id]);
                                    } else {
                                      setSelectedJuknisIds(prev => prev.filter(id => id !== item.id));
                                    }
                                  }}
                                  className="rounded cursor-pointer"
                                />
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="font-extrabold text-slate-900 dark:text-slate-100">
                                  {item.namaBlangko}
                                </div>
                                {item.keterangan && (
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {item.keterangan}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center font-bold font-mono text-slate-700 dark:text-slate-300">
                                {item.tahunRilis || '-'}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <a
                                  href={item.linkDownload || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] shadow-xs transition-all uppercase tracking-wider"
                                >
                                  <span>DOWNLOAD DISINI</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditJuknis(item)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                                    title="Edit Juknis"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteJuknis(item.id)}
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-600 transition-all cursor-pointer"
                                    title="Hapus Juknis"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: KELOLA ARTIKEL & PETUNJUK INTERAKTIF (KNOWLEDGE BASE)
          ========================================================================= */}
      {activeSubTab === 'knowledge_articles' && (
        <div className="space-y-5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleOpenAddArticle}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Artikel / Petunjuk Baru</span>
              </button>

              <button
                onClick={handleResetToPresetArticles}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer border border-slate-300 dark:border-slate-700"
                title="Muat kembali preset artikel petunjuk SAKTI"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>⚡ Muat Preset Panduan</span>
              </button>

              {knowledgeList.length > 0 && (
                <button
                  onClick={handleClearAllArticles}
                  className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-black px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  title="Hapus semua artikel petunjuk"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Semua Artikel ({knowledgeList.length})</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchKnowledge}
                  onChange={(e) => setSearchKnowledge(e.target.value)}
                  placeholder="Cari artikel..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={filterKnowledgeCategory}
                onChange={(e) => setFilterKnowledgeCategory(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="JUKNIS_SAKTI">📘 Juknis SAKTI Official</option>
                <option value="LAYANAN_PD_KONTRAK">📜 Layanan Seksi PD & Kontrak</option>
                <option value="PELAPORAN_SAKTI">📊 SAKTI Pelaporan & Output</option>
                <option value="ADMINISTRATOR_SAKTI">🔑 Admin & User SAKTI</option>
                <option value="VIDEO_TUTORIAL">🎥 Video Tutorial</option>
                <option value="TOOLS_CSV">📁 Tools CSV SAKTI</option>
              </select>
            </div>
          </div>

          {/* Grid Articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledgeList
              .filter(item => {
                if (filterKnowledgeCategory !== 'ALL' && item.category !== filterKnowledgeCategory) return false;
                if (!searchKnowledge.trim()) return true;
                const q = searchKnowledge.toLowerCase();
                return item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q);
              })
              .map(item => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {item.category}
                      </span>
                      {item.isPinned && (
                        <span className="text-[10px] font-black text-amber-500 flex items-center gap-1">
                          <Pin className="w-3 h-3" /> PINNED
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                    <span>{item.author}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditArticle(item)}
                        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 font-bold transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(item.id)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 font-bold transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT JUKNIS BLANGKO (TABEL ITEM)
          ========================================================================= */}
      {isJuknisModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden my-8">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="font-black text-base">
                  {editingJuknis ? 'Edit Format / Juknis' : 'Tambah Format / Juknis Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsJuknisModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJuknis} className="p-6 space-y-4 text-xs font-bold text-slate-800 dark:text-slate-200">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Nama Blangko / Petunjuk Teknis *
                </label>
                <input
                  type="text"
                  required
                  value={juknisFormNama}
                  onChange={(e) => setJuknisFormNama(e.target.value)}
                  placeholder="Contoh: Panduan Pendaftaran Aplikasi DIGIT"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Kategori Aplikasi / Header Grup *
                  </label>
                  <select
                    value={juknisFormKategori}
                    onChange={(e) => setJuknisFormKategori(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {JUKNIS_APPLICATION_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="CUSTOM">+ Kategori Baru (Ketik Manual)...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Tahun Rilis
                  </label>
                  <input
                    type="text"
                    value={juknisFormTahun}
                    onChange={(e) => setJuknisFormTahun(e.target.value)}
                    placeholder="2024 / 2023 / -"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {juknisFormKategori === 'CUSTOM' && (
                <div>
                  <label className="block text-[11px] font-black uppercase text-cyan-600 mb-1">
                    Nama Kategori Grup Baru
                  </label>
                  <input
                    type="text"
                    value={juknisFormCustomKategori}
                    onChange={(e) => setJuknisFormCustomKategori(e.target.value)}
                    placeholder="Contoh: APLIKASI KEMENKEU PRIME"
                    className="w-full p-2.5 rounded-xl border border-cyan-400 dark:border-cyan-600 bg-cyan-50/50 dark:bg-cyan-950/30 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Link Download / URL File *
                  </label>
                  <input
                    type="url"
                    required
                    value={juknisFormLink}
                    onChange={(e) => setJuknisFormLink(e.target.value)}
                    placeholder="https://drive.google.com/... atau https://sakti.kemenkeu.go.id"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Format File
                  </label>
                  <select
                    value={juknisFormFormat}
                    onChange={(e) => setJuknisFormFormat(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="PDF">PDF</option>
                    <option value="DOCX">Word (DOCX)</option>
                    <option value="XLSX">Excel (XLSX)</option>
                    <option value="CSV">CSV / ADK</option>
                    <option value="ZIP">ZIP / RAR</option>
                    <option value="LINK">Link Web</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Keterangan Singkat (Opsional)
                </label>
                <input
                  type="text"
                  value={juknisFormKeterangan}
                  onChange={(e) => setJuknisFormKeterangan(e.target.value)}
                  placeholder="Catatan tambahan petunjuk atau sasaran pengguna..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsJuknisModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Data Juknis</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT ARTIKEL PENGETAHUAN INTERAKTIF
          ========================================================================= */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <h3 className="font-black text-base">
                  {editingArticle ? 'Edit Petunjuk Pengetahuan' : 'Buat Petunjuk Pengetahuan Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsArticleModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="p-6 space-y-4 text-xs font-bold overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Judul Petunjuk / Artikel *
                </label>
                <input
                  type="text"
                  required
                  value={artTitle}
                  onChange={(e) => setArtTitle(e.target.value)}
                  placeholder="Contoh: Tata Cara Pendaftaran Kontrak SAKTI Batas 5 HK"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Kategori Petunjuk
                  </label>
                  <select
                    value={artCategory}
                    onChange={(e) => setArtCategory(e.target.value as KnowledgeCategory)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="JUKNIS_SAKTI">📘 Juknis SAKTI Official</option>
                    <option value="LAYANAN_PD_KONTRAK">📜 Layanan Seksi PD & Kontrak</option>
                    <option value="PELAPORAN_SAKTI">📊 SAKTI Pelaporan & Output</option>
                    <option value="ADMINISTRATOR_SAKTI">🔑 Admin & User SAKTI</option>
                    <option value="VIDEO_TUTORIAL">🎥 Video Tutorial</option>
                    <option value="TOOLS_CSV">📁 Tools CSV SAKTI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Penulis / Seksi Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    value={artAuthor}
                    onChange={(e) => setArtAuthor(e.target.value)}
                    placeholder="Seksi MSKI / Seksi PD"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Ringkasan Eksekutif
                </label>
                <textarea
                  rows={2}
                  value={artSummary}
                  onChange={(e) => setArtSummary(e.target.value)}
                  placeholder="Ringkasan poin penting..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Isi Lengkap (Markdown Support)
                </label>
                <textarea
                  rows={4}
                  value={artContentMarkdown}
                  onChange={(e) => setArtContentMarkdown(e.target.value)}
                  placeholder="Isi panduan lengkap dengan formatting markdown..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Link Video YouTube (Opsional)
                  </label>
                  <input
                    type="url"
                    value={artVideoUrl}
                    onChange={(e) => setArtVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Link Unduh File/Juknis PDF
                  </label>
                  <input
                    type="url"
                    value={artDownloadUrl}
                    onChange={(e) => setArtDownloadUrl(e.target.value)}
                    placeholder="https://sakti.kemenkeu.go.id"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="artPinCheck"
                  checked={artIsPinned}
                  onChange={(e) => setArtIsPinned(e.target.checked)}
                  className="rounded cursor-pointer"
                />
                <label htmlFor="artPinCheck" className="text-xs font-black cursor-pointer text-slate-800 dark:text-slate-200">
                  Sematkan di Paling Atas (Pinned / Prioritas Satker)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Artikel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Confirmation Modal for Delete & Reset Actions */}
      <ModernConfirmModal
        modal={confirmModal}
        onClose={() => setConfirmModal(null)}
        isDark={isDark}
      />
    </div>
  );
};
