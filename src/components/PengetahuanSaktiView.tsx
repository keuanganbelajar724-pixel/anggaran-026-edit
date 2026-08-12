import React, { useState, useEffect } from 'react';
import { ModernConfirmModal, ConfirmModalState } from './ModernConfirmModal';
import { useToast } from './ToastNotification';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Download, 
  Video, 
  ChevronDown, 
  ChevronUp, 
  Pin, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  X, 
  Save, 
  Tag, 
  Clock, 
  User, 
  Share2, 
  Copy,
  Youtube,
  Link as LinkIcon
} from 'lucide-react';
import { KnowledgeItem, KnowledgeCategory, KnowledgeStep, AppTheme, DashboardConfig } from '../types';
import { INITIAL_KNOWLEDGE_ITEMS } from '../data/initialKnowledgeData';
import { db, doc, onSnapshot, setDoc } from '../lib/firebase';

interface PengetahuanSaktiViewProps {
  isAdminAuthenticated: boolean;
  onAuthenticateAdmin?: (pin: string) => boolean;
  theme: AppTheme;
  dashboardConfig?: DashboardConfig;
}

export const PengetahuanSaktiView: React.FC<PengetahuanSaktiViewProps> = ({
  isAdminAuthenticated,
  onAuthenticateAdmin,
  theme,
  dashboardConfig
}) => {
  const isDark = theme === 'dark';

  // State
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>(() => {
    const saved = localStorage.getItem('kppn_knowledge_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.warn('Error parsing knowledge items:', e);
      }
    }
    return INITIAL_KNOWLEDGE_ITEMS;
  });

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('kppn_knowledge_items', JSON.stringify(knowledgeList));
    } catch (e) {
      console.warn('Error saving knowledge items:', e);
    }
  }, [knowledgeList]);

  // Sync to Firebase Firestore if available
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'knowledge_base'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            setKnowledgeList(data.items);
            localStorage.setItem('kppn_knowledge_items', JSON.stringify(data.items));
          }
        }
      }, (err) => {
        console.warn('Firebase knowledge sync notice:', err);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Firebase setup notice:', e);
    }
  }, []);

  const saveKnowledgeToFirebase = (newList: KnowledgeItem[]) => {
    setKnowledgeList(newList);
    localStorage.setItem('kppn_knowledge_items', JSON.stringify(newList));
    try {
      setDoc(doc(db, 'settings', 'knowledge_base'), {
        items: newList,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Firebase save knowledge error:', e);
    }
  };

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'ALL'>('ALL');
  const [expandedItemId, setExpandedItemId] = useState<string | null>('kn-001'); // Expand first item by default

  // Admin Modal Add/Edit State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);

  // Form State for Add/Edit
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<KnowledgeCategory>('LAYANAN_PD_KONTRAK');
  const [formSummary, setFormSummary] = useState<string>('');
  const [formContentMarkdown, setFormContentMarkdown] = useState<string>('');
  const [formVideoUrl, setFormVideoUrl] = useState<string>('');
  const [formDownloadUrl, setFormDownloadUrl] = useState<string>('');
  const [formReferenceUrl, setFormReferenceUrl] = useState<string>('');
  const [formAuthor, setFormAuthor] = useState<string>('Seksi Pencairan Dana (PD) KPPN Semarang I');
  const [formIsPinned, setFormIsPinned] = useState<boolean>(false);
  const [formTags, setFormTags] = useState<string>('');
  const [formSteps, setFormSteps] = useState<KnowledgeStep[]>([]);

  // Open Modal for Create
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormCategory('LAYANAN_PD_KONTRAK');
    setFormSummary('');
    setFormContentMarkdown('');
    setFormVideoUrl('');
    setFormDownloadUrl('');
    setFormReferenceUrl('');
    setFormAuthor('Tim Pembina Keuangan KPPN Semarang I');
    setFormIsPinned(false);
    setFormTags('SAKTI, Juknis, Perbendaharaan');
    setFormSteps([
      { stepNumber: 1, title: 'Langkah Pertama', description: 'Penjelasan detail langkah pertama...', importantNotes: 'Catatan penting jika ada...' }
    ]);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormSummary(item.summary);
    setFormContentMarkdown(item.contentMarkdown || '');
    setFormVideoUrl(item.videoUrl || '');
    setFormDownloadUrl(item.downloadUrl || '');
    setFormReferenceUrl(item.referenceUrl || '');
    setFormAuthor(item.author || 'Tim Pembina Keuangan KPPN Semarang I');
    setFormIsPinned(item.isPinned || false);
    setFormTags(item.tags ? item.tags.join(', ') : '');
    setFormSteps(item.steps ? [...item.steps] : []);
    setIsModalOpen(true);
  };

  // Save Modal Item
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Judul petunjuk/artikel wajib diisi.');
      return;
    }

    const tagArray = formTags.split(',').map(t => t.trim()).filter(Boolean);

    if (editingItem) {
      // Update
      const updated: KnowledgeItem = {
        ...editingItem,
        title: formTitle,
        category: formCategory,
        summary: formSummary,
        contentMarkdown: formContentMarkdown,
        videoUrl: formVideoUrl,
        downloadUrl: formDownloadUrl,
        referenceUrl: formReferenceUrl,
        author: formAuthor,
        isPinned: formIsPinned,
        tags: tagArray,
        steps: formSteps,
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
      };
      const newList = knowledgeList.map(k => k.id === editingItem.id ? updated : k);
      saveKnowledgeToFirebase(newList);
    } else {
      // Create
      const newItem: KnowledgeItem = {
        id: 'kn-' + Date.now(),
        title: formTitle,
        category: formCategory,
        summary: formSummary,
        contentMarkdown: formContentMarkdown,
        videoUrl: formVideoUrl,
        downloadUrl: formDownloadUrl,
        referenceUrl: formReferenceUrl,
        author: formAuthor,
        isPinned: formIsPinned,
        tags: tagArray,
        steps: formSteps,
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
      };
      const newList = [newItem, ...knowledgeList];
      saveKnowledgeToFirebase(newList);
    }

    setIsModalOpen(false);
  };

  const { showToast } = useToast();
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  // Delete Item
  const handleDeleteItem = (id: string) => {
    const target = knowledgeList.find(k => k.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Petunjuk Pengetahuan',
      message: `Apakah Anda yakin ingin menghapus artikel/petunjuk "${target?.title || 'ini'}"? Data yang dihapus tidak dapat dikembalikan.`,
      confirmText: 'Ya, Hapus Artikel',
      cancelText: 'Batal',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () => {
        const newList = knowledgeList.filter(k => k.id !== id);
        saveKnowledgeToFirebase(newList);
        showToast({
          type: 'success',
          title: 'Pengetahuan Dihapus',
          message: 'Artikel petunjuk berhasil dihapus dari daftar.'
        });
      }
    });
  };

  // Toggle Pin
  const handleTogglePin = (id: string) => {
    const newList = knowledgeList.map(k => k.id === id ? { ...k, isPinned: !k.isPinned } : k);
    saveKnowledgeToFirebase(newList);
  };

  // Filtered List
  const filteredList = knowledgeList.filter(item => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(q))) ||
      (item.steps && item.steps.some(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)))
    );
  });

  // Sort Pinned first
  const sortedList = [...filteredList].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const getCategoryBadge = (cat: KnowledgeCategory) => {
    switch (cat) {
      case 'LAYANAN_PD_KONTRAK':
        return { label: 'Layanan Seksi PD & Kontrak', color: 'bg-emerald-100/90 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800 font-extrabold' };
      case 'JUKNIS_SAKTI':
        return { label: 'Juknis SAKTI Official', color: 'bg-sky-100/90 text-sky-950 border-sky-300 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800 font-extrabold' };
      case 'PELAPORAN_SAKTI':
        return { label: 'SAKTI Pelaporan & Output', color: 'bg-purple-100/90 text-purple-950 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800 font-extrabold' };
      case 'ADMINISTRATOR_SAKTI':
        return { label: 'SAKTI Administrator & User', color: 'bg-amber-100/90 text-amber-950 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 font-extrabold' };
      case 'VIDEO_TUTORIAL':
        return { label: 'Video Tutorial YouTube / Hai DJPb', color: 'bg-rose-100/90 text-rose-950 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 font-extrabold' };
      case 'TOOLS_CSV':
        return { label: 'Tools & Format CSV SAKTI', color: 'bg-indigo-100/90 text-indigo-950 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800 font-extrabold' };
      default:
        return { label: 'Panduan & Edukasi', color: 'bg-slate-200/90 text-slate-950 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-extrabold' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Hero Header */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden transition-all duration-300 ${
        isDark ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border-slate-800 text-slate-100' : 'bg-gradient-to-br from-white via-indigo-50/70 to-emerald-50/70 border-slate-300 text-slate-950'
      }`}>
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-950 dark:bg-indigo-600/10 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800/80 px-3.5 py-1 rounded-full text-xs font-black tracking-wide">
              <BookOpen className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
              <span>PUSAT PENGETAHUAN &amp; JUKNIS SAKTI KPPN SEMARANG I (026)</span>
            </div>

            {isAdminAuthenticated && (
              <button
                onClick={handleOpenCreateModal}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Pengetahuan / Juknis Baru</span>
              </button>
            )}
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
              Pusat Edukasi &amp; Petunjuk Teknis Operasional SAKTI
            </h2>
            <p className="text-slate-900 dark:text-slate-200 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed font-bold">
              Akses cepat petunjuk teknis resmi pendaftaran kontrak, pencairan dana, SAKTI pelaporan, penanganan error, video bimbingan teknis, serta format CSV pendukung untuk seluruh Satker Mitra KPPN Semarang I.
            </p>
          </div>

          {/* Quick Category Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-300 dark:border-slate-800 text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
              }`}
            >
              Semua Referensi ({knowledgeList.length})
            </button>
            <button
              onClick={() => setSelectedCategory('LAYANAN_PD_KONTRAK')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                selectedCategory === 'LAYANAN_PD_KONTRAK'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
              }`}
            >
              📜 Layanan Seksi PD &amp; Kontrak
            </button>
            <button
              onClick={() => setSelectedCategory('JUKNIS_SAKTI')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                selectedCategory === 'JUKNIS_SAKTI'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
              }`}
            >
              📘 Juknis SAKTI Official
            </button>
            <button
              onClick={() => setSelectedCategory('PELAPORAN_SAKTI')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                selectedCategory === 'PELAPORAN_SAKTI'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
              }`}
            >
              📊 SAKTI Pelaporan &amp; Output
            </button>
            <button
              onClick={() => setSelectedCategory('ADMINISTRATOR_SAKTI')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                selectedCategory === 'ADMINISTRATOR_SAKTI'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
              }`}
            >
              🔑 Admin &amp; User SAKTI
            </button>
            <button
              onClick={() => setSelectedCategory('VIDEO_TUTORIAL')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                selectedCategory === 'VIDEO_TUTORIAL'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
              }`}
            >
              🎥 Video Tutorial YouTube
            </button>
            <button
              onClick={() => setSelectedCategory('TOOLS_CSV')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                selectedCategory === 'TOOLS_CSV'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
              }`}
            >
              📁 Tools CSV SAKTI
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 font-extrabold" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari petunjuk teknis, kata kunci (misal: Kontrak, Supplier, OTP, LPJ, Capaian Output, Admin)..."
          className={`w-full pl-11 pr-4 py-3 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-400 text-slate-950 placeholder-slate-600 font-extrabold'
          } shadow-sm text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-700 hover:text-slate-950 dark:hover:text-slate-200 font-extrabold"
          >
            Bersihkan
          </button>
        )}
      </div>

      {/* Knowledge Cards Grid / Accordion List */}
      <div className="space-y-4">
        {sortedList.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-300 dark:border-slate-800 p-8 space-y-3">
            <HelpCircle className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base font-black text-slate-950 dark:text-slate-200">
              Tidak Ada Petunjuk Teknis yang Cocok
            </h3>
            <p className="text-xs text-slate-800 dark:text-slate-400 font-bold max-w-md mx-auto">
              Coba kata kunci pencarian lain atau pilih kategori referensi di atas.
            </p>
          </div>
        ) : (
          sortedList.map((item) => {
            const badge = getCategoryBadge(item.category);
            const isExpanded = expandedItemId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-3xl border transition-all duration-200 ${
                  isExpanded
                    ? isDark ? 'bg-slate-900 border-indigo-500/50 shadow-xl ring-1 ring-indigo-500/30' : 'bg-white border-indigo-500 shadow-xl ring-2 ring-indigo-500/10'
                    : isDark ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-300 hover:border-slate-400 shadow-sm'
                } overflow-hidden`}
              >
                {/* Header Row */}
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                      {item.isPinned && (
                        <span className="bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 border border-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Pin className="w-3 h-3 text-amber-700 fill-amber-700" />
                          <span>PANDUAN UNGGULAN</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdminAuthenticated && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(item.id);
                            }}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                              item.isPinned ? 'text-amber-600 bg-amber-100 dark:bg-amber-950/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                            title={item.isPinned ? 'Lepas Sematan' : 'Sematkan ke Atas'}
                          >
                            <Pin className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(item);
                            }}
                            className="p-1.5 rounded-lg text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-950/50 text-xs font-bold transition-all"
                            title="Edit Petunjuk Ini"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item.id);
                            }}
                            className="p-1.5 rounded-lg text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-xs font-bold transition-all"
                            title="Hapus Petunjuk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                          isExpanded
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-slate-200 hover:bg-slate-300'
                        }`}
                      >
                        <span>{isExpanded ? 'Sembunyikan Langkah' : 'Buka Panduan Lengkap'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h3 
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                      className="text-lg sm:text-xl font-black text-slate-950 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                    >
                      {item.title}
                    </h3>
                    <p className="text-slate-900 dark:text-slate-200 text-xs sm:text-sm mt-1.5 leading-relaxed font-bold">
                      {item.summary}
                    </p>
                  </div>

                  {/* Tags & Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-900 dark:text-slate-300 border-t border-slate-300 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 font-black text-slate-950 dark:text-slate-200">
                        <User className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" />
                        {item.author}
                      </span>
                      <span className="flex items-center gap-1 font-black text-slate-950 dark:text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" />
                        {item.date}
                      </span>
                    </div>

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag, idx) => (
                          <span key={idx} className="bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono font-black">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Detailed Steps & Links */}
                {isExpanded && (
                  <div className={`p-6 border-t ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-300'
                  } space-y-6 animate-fade-in`}>

                    {/* Step-by-Step Workflow List */}
                    {item.steps && item.steps.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 font-black text-slate-950 dark:text-white text-sm uppercase tracking-wide">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                          <span>Tahapan &amp; Langkah Eksekusi Operasional SAKTI ({item.steps.length} Langkah):</span>
                        </div>

                        <div className="space-y-3">
                          {item.steps.map((step) => (
                            <div
                              key={step.stepNumber}
                              className={`p-4 rounded-2xl border transition-all ${
                                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
                              } space-y-2`}
                            >
                              <div className="flex items-start gap-3">
                                <span className="bg-indigo-600 text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                                  {step.stepNumber}
                                </span>
                                <div className="space-y-1 flex-1">
                                  <h4 className="font-black text-slate-950 dark:text-white text-xs sm:text-sm">
                                    {step.title}
                                  </h4>
                                  <p className="text-slate-900 dark:text-slate-200 text-xs sm:text-sm leading-relaxed font-bold">
                                    {step.description}
                                  </p>
                                  {step.importantNotes && (
                                    <div className="bg-amber-100 dark:bg-amber-950/60 border border-amber-400 dark:border-amber-800 p-2.5 rounded-xl text-[11px] sm:text-xs text-amber-950 dark:text-amber-200 font-extrabold flex items-start gap-2 mt-2">
                                      <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                                      <span><strong>Catatan Penting:</strong> {step.importantNotes}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Markdown / Content Text if present */}
                    {item.contentMarkdown && (
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-300 dark:border-slate-800 text-xs leading-relaxed text-slate-950 dark:text-slate-200 space-y-2">
                        <div className="font-black text-slate-950 dark:text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                          <span>Detail Ringkasan Petunjuk Teknis:</span>
                        </div>
                        <div className="whitespace-pre-line font-mono text-[11px] sm:text-xs bg-slate-100 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-950 dark:text-slate-100 font-extrabold leading-relaxed">
                          {item.contentMarkdown}
                        </div>
                      </div>
                    )}

                    {/* External Link & Download Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      {item.referenceUrl && (
                        <a
                          href={item.referenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Buka Portal Referensi Resmi SAKTI</span>
                        </a>
                      )}

                      {item.videoUrl && (
                        <a
                          href={item.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        >
                          <Youtube className="w-4 h-4" />
                          <span>Tonton Video Tutorial SAKTI Official</span>
                        </a>
                      )}

                      {item.downloadUrl && (
                        <a
                          href={item.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Unduh File Juknis / Format CSV</span>
                        </a>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit Knowledge Item */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full p-6 space-y-6 my-8 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 px-2.5 py-0.5 rounded-full">
                  ADMIN KPPN KNOWLEDGE EDITOR
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {editingItem ? 'Edit Petunjuk Teknis SAKTI' : 'Tambah Petunjuk Teknis & Pengetahuan Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 text-xs">
              
              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block font-black text-slate-950 dark:text-slate-200">
                    Judul Petunjuk Teknis / Panduan *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Contoh: Panduan Mendaftarkan Kontrak pada SAKTI..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 font-bold text-xs placeholder-slate-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-black text-slate-950 dark:text-slate-200">
                    Kategori Referensi *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as KnowledgeCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 font-bold text-xs"
                  >
                    <option value="LAYANAN_PD_KONTRAK">📜 Layanan Seksi PD &amp; Kontrak</option>
                    <option value="JUKNIS_SAKTI">📘 Juknis SAKTI Official</option>
                    <option value="PELAPORAN_SAKTI">📊 SAKTI Pelaporan &amp; Output</option>
                    <option value="ADMINISTRATOR_SAKTI">🔑 Admin &amp; User SAKTI</option>
                    <option value="VIDEO_TUTORIAL">🎥 Video Tutorial YouTube</option>
                    <option value="TOOLS_CSV">📁 Tools CSV SAKTI</option>
                    <option value="PANDUAN_CUSTOM">💡 Panduan Custom Admin</option>
                  </select>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1">
                <label className="block font-black text-slate-950 dark:text-slate-200">
                  Ringkasan Panduan (1-2 Kalimat Pendek)
                </label>
                <textarea
                  rows={2}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Ringkasan singkat isi petunjuk teknis yang akan muncul di kartu..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 font-bold text-xs placeholder-slate-500"
                />
              </div>

              {/* Steps Management */}
              <div className="space-y-3 bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-300 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-950 dark:text-slate-200 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                    Langkah-Langkah Workflow Operasional:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormSteps([
                        ...formSteps,
                        {
                          stepNumber: formSteps.length + 1,
                          title: `Langkah ${formSteps.length + 1}`,
                          description: '',
                          importantNotes: ''
                        }
                      ]);
                    }}
                    className="bg-indigo-600 text-white text-[11px] font-black px-3 py-1 rounded-lg hover:bg-indigo-500 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Langkah</span>
                  </button>
                </div>

                {formSteps.map((step, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-black bg-indigo-100 text-indigo-950 px-2 py-0.5 rounded border border-indigo-200">
                        Langkah #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formSteps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 }));
                          setFormSteps(updated);
                        }}
                        className="text-rose-700 dark:text-rose-400 hover:text-rose-900 text-[10px] font-black cursor-pointer"
                      >
                        Hapus Langkah Ini
                      </button>
                    </div>

                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => {
                        const copy = [...formSteps];
                        copy[idx].title = e.target.value;
                        setFormSteps(copy);
                      }}
                      placeholder="Judul langkah (misal: Perekaman Header Supplier)..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 font-extrabold text-xs placeholder-slate-500"
                    />

                    <textarea
                      rows={2}
                      value={step.description}
                      onChange={(e) => {
                        const copy = [...formSteps];
                        copy[idx].description = e.target.value;
                        setFormSteps(copy);
                      }}
                      placeholder="Penjelasan detail langkah ini..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 font-bold text-xs placeholder-slate-500"
                    />

                    <input
                      type="text"
                      value={step.importantNotes || ''}
                      onChange={(e) => {
                        const copy = [...formSteps];
                        copy[idx].importantNotes = e.target.value;
                        setFormSteps(copy);
                      }}
                      placeholder="Catatan penting/warning (opsional)..."
                      className="w-full px-3 py-1.5 rounded-lg border border-amber-400 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 text-xs font-black placeholder-amber-800/60"
                    />
                  </div>
                ))}
              </div>

              {/* URLs & Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-black text-slate-950 dark:text-slate-200 mb-1">
                    URL Video YouTube (Opsional):
                  </label>
                  <input
                    type="url"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 font-mono font-bold text-xs placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-950 dark:text-slate-200 mb-1">
                    URL File Download/Juknis PDF:
                  </label>
                  <input
                    type="url"
                    value={formDownloadUrl}
                    onChange={(e) => setFormDownloadUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 font-mono font-bold text-xs placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-950 dark:text-slate-200 mb-1">
                    URL Portal Referensi Resmi:
                  </label>
                  <input
                    type="url"
                    value={formReferenceUrl}
                    onChange={(e) => setFormReferenceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 font-mono font-bold text-xs placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Author, Tags, & Pin */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-black text-slate-950 dark:text-slate-200 mb-1">
                    Penulis / Unit Penyusun:
                  </label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="Seksi PD KPPN Semarang I..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 font-bold text-xs placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-950 dark:text-slate-200 mb-1">
                    Tag / Kata Kunci (Dipisah Koma):
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="Kontrak, Supplier, SAKTI..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 font-mono font-bold text-xs placeholder-slate-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPinned}
                      onChange={(e) => setFormIsPinned(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-black text-slate-950 dark:text-slate-200">
                      Sematkan di Atas (Unggulan)
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-black text-slate-800 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingItem ? 'Simpan Perubahan' : 'Terbitkan Pengetahuan Baru'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modern Confirmation Modal */}
      <ModernConfirmModal
        modal={confirmModal}
        onClose={() => setConfirmModal(null)}
        isDark={isDark}
      />

    </div>
  );
};
