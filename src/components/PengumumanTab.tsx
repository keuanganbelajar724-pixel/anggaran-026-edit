import React, { useState, useEffect } from 'react';
import { Announcement, AppTheme, DashboardConfig } from '../types';
import { PaginationControl } from './PaginationControl';
import { 
  Megaphone, 
  Pin, 
  Calendar, 
  User, 
  Search, 
  Info, 
  Building2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Paperclip,
  ClipboardList,
  Eye,
  X,
  AlertTriangle,
  PlayCircle,
  FileText,
  ShieldAlert,
  Maximize2,
  Download,
  Copy,
  Check,
  RotateCw,
  Printer,
  BookOpen
} from 'lucide-react';

interface PengumumanTabProps {
  announcements: Announcement[];
  theme?: AppTheme;
  dashboardConfig?: DashboardConfig;
}

// Utility to convert links into embeddable preview URLs
export const getEmbedInfo = (url?: string) => {
  if (!url || !url.trim()) return null;
  const clean = url.trim();

  // YouTube match
  const ytMatch = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0`,
      type: 'youtube' as const,
      label: 'Video YouTube Interaktif'
    };
  }

  // Google Drive File preview conversion (/view, /edit -> /preview)
  const driveMatch = clean.match(/drive\.google\.com\/file\/d\/([^\/\?]+)/);
  if (driveMatch && driveMatch[1]) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      type: 'drive' as const,
      label: 'Pratinjau PDF / Dokumen (Google Drive)'
    };
  }

  // Google Drive open?id= or uc?id=
  const driveIdMatch = clean.match(/drive\.google\.com\/(?:open|uc)\?id=([^\&]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveIdMatch[1]}/preview`,
      type: 'drive' as const,
      label: 'Pratinjau PDF / Dokumen (Google Drive)'
    };
  }

  // Google Drive Folder
  const driveFolderMatch = clean.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([^\?\/]+)/);
  if (driveFolderMatch && driveFolderMatch[1]) {
    return {
      embedUrl: `https://drive.google.com/embeddedfolderview?id=${driveFolderMatch[1]}#grid`,
      type: 'drive_folder' as const,
      label: 'Folder Berkas Google Drive'
    };
  }

  // Google Docs / Sheets / Slides / Forms
  if (clean.includes('docs.google.com')) {
    let docUrl = clean;
    if (docUrl.includes('/forms/')) {
      if (!docUrl.includes('embedded=true')) {
        docUrl = docUrl.replace(/\/viewform.*$/, '/viewform?embedded=true');
        if (!docUrl.includes('embedded=true')) {
          docUrl = docUrl + (docUrl.includes('?') ? '&embedded=true' : '?embedded=true');
        }
      }
      return {
        embedUrl: docUrl,
        type: 'docs' as const,
        label: 'Formulir Interaktif (Google Form)'
      };
    }
    
    if (docUrl.includes('/edit')) {
      docUrl = docUrl.replace(/\/edit.*$/, '/preview');
    } else if (docUrl.includes('/view')) {
      docUrl = docUrl.replace(/\/view.*$/, '/preview');
    }
    return {
      embedUrl: docUrl,
      type: 'docs' as const,
      label: 'Dokumen Google Docs / Sheet'
    };
  }

  // Direct PDF
  if (clean.toLowerCase().endsWith('.pdf')) {
    return {
      embedUrl: clean,
      type: 'pdf' as const,
      label: 'Dokumen PDF'
    };
  }

  // General URL
  return {
    embedUrl: clean,
    type: 'general' as const,
    label: 'Pratinjau Tautan Eksternal'
  };
};

export const PengumumanTab: React.FC<PengumumanTabProps> = ({
  announcements,
  theme = 'light',
  dashboardConfig
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);
  
  // Active announcements only (filter out isActive === false)
  const activeAnnouncements = announcements.filter(a => a.isActive !== false);

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(
    activeAnnouncements.length > 0 ? activeAnnouncements[0] : null
  );

  // Active sub-preview source inside the Right Column: 'doc' | 'survey' | 'text'
  const [activePreviewTab, setActivePreviewTab] = useState<'doc' | 'survey' | 'text'>('doc');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Synchronize initial preview tab when selected announcement changes
  useEffect(() => {
    if (selectedAnnouncement) {
      if (selectedAnnouncement.linkUrl || selectedAnnouncement.attachmentUrl) {
        setActivePreviewTab('doc');
      } else if (selectedAnnouncement.surveyUrl) {
        setActivePreviewTab('survey');
      } else {
        setActivePreviewTab('text');
      }
      setIframeKey(prev => prev + 1);
    }
  }, [selectedAnnouncement?.id]);

  // Modal Previewer State (for optional Fullscreen expansion)
  const [previewData, setPreviewData] = useState<{
    url: string;
    title: string;
    label?: string;
  } | null>(null);

  // Handler for selecting announcement
  const handleSelectAnnouncement = (item: Announcement) => {
    setSelectedAnnouncement(item);
    // Smooth scroll on mobile if stacked
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        const previewEl = document.getElementById('announcement-preview-panel');
        if (previewEl) {
          previewEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  // Download Helpers
  const handleDownloadAnnouncementText = (ann: Announcement) => {
    const docText = `===================================================================
PENGUMUMAN / SURAT EDARAN OFFICIAL
KPPN SEMARANG I - PEMBINAAN & MONITORING KEBAIKAN PERBENDAHARAAN
===================================================================

JUDUL         : ${ann.title}
KATEGORI      : ${ann.category}
TANGGAL       : ${ann.date}
DITERBITKAN   : ${ann.author}
TINGKAT       : ${ann.isUrgent ? 'URGENT / PALING PENTING' : (ann.category === 'Penting' || ann.isPinned ? 'PENTING' : 'NORMAL')}

-------------------------------------------------------------------
ISI PENGUMUMAN / INSTRUKSI SATKER:
-------------------------------------------------------------------
${ann.content}

-------------------------------------------------------------------
LAMPIRAN BERKAS & TAUTAN RESMI:
${(ann.linkUrl || ann.attachmentUrl) ? `• Dokumen Lampiran: ${ann.linkLabel || ann.attachmentLabel || 'Dokumen PDF / Berkas'} (${ann.linkUrl || ann.attachmentUrl})` : '• Tidak ada lampiran berkas.'}
${ann.surveyUrl ? `• Formulir / Tautan Survei: ${ann.surveyLabel || 'Form Survei'} (${ann.surveyUrl})` : ''}

===================================================================
KPPN Semarang I - Pengolahan Data & Layanan Informasi Satker
===================================================================
`;

    const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = ann.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
    link.download = `[Pengumuman_KPPN]_${safeTitle}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAttachmentFile = (fileUrl: string, fileName?: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    if (fileName) {
      const safeFileName = fileName.replace(/[^a-zA-Z0-9_\.-]/g, '_');
      link.download = safeFileName;
    } else {
      link.download = 'Lampiran_Pengumuman_KPPN';
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const categories = ['ALL', 'Penting', 'Batas Waktu', 'Surat Edaran', 'Jadwal', 'Sistem'];

  // Filtering
  const filteredAnnouncements = activeAnnouncements.filter(a => {
    if (selectedCategory !== 'ALL' && a.category !== selectedCategory) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchContent = a.content.toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }
    return true;
  });

  // Sort: 1. Urgent, 2. Pinned, 3. Date/Original Order
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  // Find Hero Spotlight Announcement
  const heroAnnouncement = activeAnnouncements.find(a => a.isHeroSpotlight);

  const isDark = theme === 'dark';

  // Active URLs for the selected announcement
  const attachmentUrl = selectedAnnouncement?.linkUrl || selectedAnnouncement?.attachmentUrl;
  const attachmentLabel = selectedAnnouncement?.linkLabel || selectedAnnouncement?.attachmentLabel || 'Dokumen PDF / Lampiran';
  const surveyUrl = selectedAnnouncement?.surveyUrl;
  const surveyLabel = selectedAnnouncement?.surveyLabel || 'Form Survei / Registrasi';

  // Active preview target URL
  const currentPreviewUrl = activePreviewTab === 'survey' ? surveyUrl : attachmentUrl;
  const currentPreviewEmbedInfo = currentPreviewUrl ? getEmbedInfo(currentPreviewUrl) : null;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className={`${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border-slate-800' 
          : 'bg-gradient-to-r from-slate-900 via-amber-900 to-amber-950'
      } p-6 sm:p-8 rounded-3xl border text-white shadow-xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
              {dashboardConfig?.customTexts?.pengumumanBadge || 'Papan Pengumuman & Surat Edaran KPPN Semarang I (026)'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {dashboardConfig?.customTexts?.pengumumanTitle || 'Pusat Informasi & Pengumuman Satker'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed font-medium">
              {dashboardConfig?.customTexts?.pengumumanSubtitle || 'Akses langsung petunjuk teknis terbaru, jadwal batas waktu Capaian Output, Surat Edaran resmi, serta pratinjau dokumen PDF & video tutorial tanpa perlu mengunduh.'}
            </p>
          </div>

          <div className="shrink-0 bg-slate-800/90 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mitra KPPN</div>
              <div className="text-lg font-black text-white">Kode KPPN: 026</div>
              <div className="text-[11px] text-amber-400 font-medium">Layanan Perbendaharaan</div>
            </div>
          </div>
        </div>
      </div>

      {/* HERO SPOTLIGHT BANNER / PENGUMUMAN UTAMA (Layar Paling Atas jika diseting Admin) */}
      {heroAnnouncement && (
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden transition-all ${
          isDark 
            ? 'bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-900 border-amber-500/50 text-white ring-2 ring-amber-500/30' 
            : 'bg-gradient-to-br from-amber-500/15 via-white to-amber-50/60 border-amber-400 text-slate-950 ring-2 ring-amber-400/20'
        }`}>
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            
            {/* Spotlight Header Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-rose-600 text-white px-3.5 py-1.5 rounded-full text-xs font-black shadow-md uppercase tracking-wider animate-pulse">
                <Sparkles className="w-4 h-4 fill-white" />
                <span>📢 PENGUMUMAN UTAMA / HIGHLIGHT KPPN SEMARANG I</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                <Calendar className="w-3.5 h-3.5" />
                <span>{heroAnnouncement.date}</span>
                <span className="opacity-40">•</span>
                <User className="w-3.5 h-3.5" />
                <span>{heroAnnouncement.author}</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white leading-tight">
              {heroAnnouncement.title}
            </h3>

            {/* Content Display Mode: Full or Compact */}
            {heroAnnouncement.heroDisplayMode === 'full' ? (
              <div className={`p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium ${
                isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-white/90 border-amber-200 text-slate-900 shadow-sm'
              }`}>
                {heroAnnouncement.content}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed font-medium">
                {heroAnnouncement.content}
              </p>
            )}

            {/* Quick Action Preview Buttons on Hero Banner */}
            {(heroAnnouncement.linkUrl || heroAnnouncement.attachmentUrl || heroAnnouncement.surveyUrl) && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                
                {/* Main Link Preview */}
                {(heroAnnouncement.linkUrl || heroAnnouncement.attachmentUrl) && (
                  <button
                    onClick={() => setPreviewData({
                      url: heroAnnouncement.linkUrl || heroAnnouncement.attachmentUrl!,
                      title: heroAnnouncement.title,
                      label: heroAnnouncement.linkLabel || heroAnnouncement.attachmentLabel || 'Dokumen PDF / Video Tutorial'
                    })}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-amber-600/30 cursor-pointer transition-all transform hover:-translate-y-0.5"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{heroAnnouncement.linkLabel || heroAnnouncement.attachmentLabel || 'Pratinjau Dokumen / Video Langsung (Tanpa Download)'}</span>
                    <Maximize2 className="w-3.5 h-3.5 opacity-80" />
                  </button>
                )}

                {/* Direct Open Link */}
                {(heroAnnouncement.linkUrl || heroAnnouncement.attachmentUrl) && (
                  <a
                    href={heroAnnouncement.linkUrl || heroAnnouncement.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-4 h-4 text-amber-600" />
                    <span>Buka Link Asli (Tab Baru)</span>
                  </a>
                )}

                {/* Survey Link */}
                {heroAnnouncement.surveyUrl && (
                  <a
                    href={heroAnnouncement.surveyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-colors"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>{heroAnnouncement.surveyLabel || 'Isi Form Registrasi / Survei'}</span>
                  </a>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* Main Grid Layout: List on Left, Detail Reading View on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Announcements List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Category Filter */}
          <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-4 rounded-2xl border space-y-3 shadow-xs`}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold" />
              <input
                type="text"
                placeholder="Cari kata kunci pengumuman..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full text-xs rounded-xl pl-9 pr-3 py-2 border font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-500'
                }`}
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer font-bold ${
                    selectedCategory === cat
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Announcement Item Cards */}
          <div className="space-y-3">
            {sortedAnnouncements.length === 0 ? (
              <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-8 text-center rounded-2xl border text-slate-500 text-xs`}>
                <Info className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                Belum ada pengumuman aktif untuk kategori ini.
              </div>
            ) : (
              (pageSize <= 0 ? sortedAnnouncements : sortedAnnouncements.slice((currentPage - 1) * pageSize, currentPage * pageSize)).map((item) => {
                const isSelected = selectedAnnouncement?.id === item.id;
                const itemLink = item.linkUrl || item.attachmentUrl;
                
                // Determine importance level
                const isPalingPenting = !!item.isUrgent;
                const isPenting = !isPalingPenting && (item.category === 'Penting' || item.category === 'Batas Waktu' || item.isPinned);

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAnnouncement(item)}
                    className={`p-4 rounded-2xl border border-l-4 transition-all cursor-pointer space-y-2.5 relative overflow-hidden ${
                      isPalingPenting
                        ? isSelected
                          ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-600 border-l-rose-700 ring-2 ring-rose-500 shadow-md'
                          : isDark
                          ? 'bg-rose-950/50 border-rose-500/80 border-l-rose-500 hover:bg-rose-950/70'
                          : 'bg-rose-50 border-rose-300 border-l-rose-600 hover:bg-rose-100/70 shadow-xs'
                        : isPenting
                        ? isSelected
                          ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-500 border-l-amber-600 ring-2 ring-amber-500 shadow-md'
                          : isDark
                          ? 'bg-amber-950/40 border-amber-500/60 border-l-amber-500 hover:bg-amber-950/60'
                          : 'bg-amber-50 border-amber-300 border-l-amber-500 hover:bg-amber-100/70 shadow-xs'
                        : isSelected
                        ? 'bg-slate-100 dark:bg-slate-800/90 border-slate-400 border-l-slate-600 dark:border-slate-600 ring-2 ring-slate-400 dark:ring-slate-500 shadow-md'
                        : isDark
                        ? 'bg-slate-900 border-slate-800 border-l-slate-700 hover:border-slate-700'
                        : 'bg-white border-slate-300 border-l-slate-400 hover:border-slate-400 shadow-xs'
                    }`}
                  >
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        
                        {/* Urgent / Paling Penting Badge */}
                        {item.isUrgent ? (
                          <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                            <ShieldAlert className="w-3 h-3" />
                            <span>🚨 PALING PENTING</span>
                          </span>
                        ) : (item.category === 'Penting' || item.category === 'Batas Waktu') ? (
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-amber-500">
                            <AlertTriangle className="w-3 h-3" />
                            <span>⚠️ PENTING</span>
                          </span>
                        ) : null}

                        {/* Category Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          item.category === 'Penting' ? 'bg-rose-100 text-rose-950 border-rose-300' :
                          item.category === 'Batas Waktu' ? 'bg-amber-200 text-amber-950 border-amber-400' :
                          item.category === 'Surat Edaran' ? 'bg-sky-100 text-sky-950 border-sky-300' :
                          'bg-slate-100 text-slate-900 border-slate-300'
                        }`}>
                          {item.category}
                        </span>

                        {/* Pinned Badge */}
                        {item.isPinned && (
                          <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-0.5 border border-amber-600">
                            <Pin className="w-3 h-3 fill-current" />
                            <span>PIN</span>
                          </span>
                        )}

                      </div>

                      <span className={`text-[11px] font-bold flex items-center gap-1 ${
                        isPalingPenting ? 'text-rose-700 dark:text-rose-300' :
                        isPenting ? 'text-amber-800 dark:text-amber-300' :
                        'text-slate-500 dark:text-slate-400'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {item.date}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className={`text-sm font-black line-clamp-2 leading-snug ${
                      isPalingPenting ? 'text-rose-950 dark:text-rose-100' :
                      isPenting ? 'text-amber-950 dark:text-amber-100' :
                      isDark ? 'text-white' : 'text-slate-950'
                    }`}>
                      {item.title}
                    </h4>

                    {/* Content Excerpt */}
                    <p className={`text-xs line-clamp-2 leading-relaxed font-medium ${
                      isPalingPenting ? 'text-rose-900/90 dark:text-rose-200/90' :
                      isPenting ? 'text-amber-900/90 dark:text-amber-200/90' :
                      'text-slate-700 dark:text-slate-300'
                    }`}>
                      {item.content}
                    </p>

                    {/* Quick Preview & Download Link Badge on Item */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      {itemLink ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAnnouncement(item);
                            setActivePreviewTab('doc');
                          }}
                          className={`px-2.5 py-1 rounded-xl font-black text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer border ${
                            isSelected
                              ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                              : isPalingPenting
                              ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700'
                              : isPenting
                              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                          }`}
                          title="Tampilkan Pratinjau Dokumen di Kolom Kanan"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Pratinjau Langsung</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAnnouncement(item);
                            setActivePreviewTab('text');
                          }}
                          className="px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Baca Naskah</span>
                        </button>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAnnouncementText(item);
                          }}
                          className="px-2.5 py-1 rounded-xl font-extrabold text-[11px] bg-slate-100 hover:bg-amber-500 hover:text-slate-950 dark:bg-slate-800 dark:hover:bg-amber-500 dark:hover:text-slate-950 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Unduh Surat / Pengumuman (.TXT)"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh</span>
                        </button>

                        <span className={`text-[11px] font-bold flex items-center gap-1 ${
                          isSelected
                            ? 'text-amber-600 dark:text-amber-400 font-black'
                            : isPalingPenting ? 'text-rose-700 dark:text-rose-300' :
                            isPenting ? 'text-amber-700 dark:text-amber-400' :
                            'text-slate-600 dark:text-slate-400'
                        }`}>
                          <span>{isSelected ? 'Aktif' : 'Detail'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Control for Announcements */}
          <PaginationControl
            currentPage={currentPage}
            totalItems={sortedAnnouncements.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="Pengumuman"
            isDark={isDark}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          />

        </div>

        {/* Right Column: Direct Live Document Preview Panel */}
        <div className="lg:col-span-7" id="announcement-preview-panel">
          {selectedAnnouncement ? (
            <div className={`rounded-3xl border shadow-xl flex flex-col overflow-hidden sticky top-20 transition-all ${
              selectedAnnouncement.isUrgent
                ? 'border-rose-400 dark:border-rose-900 bg-rose-50/40 dark:bg-slate-900 ring-2 ring-rose-500/20'
                : (selectedAnnouncement.category === 'Penting' || selectedAnnouncement.category === 'Batas Waktu' || selectedAnnouncement.isPinned)
                ? 'border-amber-400/80 dark:border-amber-800/80 bg-amber-50/40 dark:bg-slate-900 ring-2 ring-amber-400/20'
                : isDark
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-slate-300'
            }`}>
              
              {/* Header: Compact, Informative & Non-repetitive */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 space-y-3 shrink-0">
                
                {/* Badges & Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedAnnouncement.isUrgent ? (
                      <span className="bg-rose-600 text-white font-black px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 shadow-xs animate-pulse">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        🚨 PALING PENTING
                      </span>
                    ) : (selectedAnnouncement.category === 'Penting' || selectedAnnouncement.category === 'Batas Waktu') ? (
                      <span className="bg-amber-400 text-slate-950 border border-amber-500 font-black px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 shadow-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        ⚠️ PENTING
                      </span>
                    ) : null}

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                      selectedAnnouncement.category === 'Penting' ? 'bg-rose-100 text-rose-950 border-rose-300' :
                      selectedAnnouncement.category === 'Batas Waktu' ? 'bg-amber-200 text-amber-950 border-amber-400' :
                      selectedAnnouncement.category === 'Surat Edaran' ? 'bg-sky-100 text-sky-950 border-sky-300' :
                      'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                    }`}>
                      {selectedAnnouncement.category}
                    </span>

                    {selectedAnnouncement.isPinned && (
                      <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px] border border-amber-600">
                        <Pin className="w-3 h-3 fill-current" />
                        Disematkan
                      </span>
                    )}
                  </div>

                  {/* Top Action Toolbar */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Direct External Link */}
                    {currentPreviewUrl && (
                      <a
                        href={currentPreviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        title="Buka Dokumen di Tab Baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                        <span className="hidden sm:inline">Tab Baru</span>
                      </a>
                    )}

                    {/* Download Attachment or TXT */}
                    {attachmentUrl ? (
                      <button
                        onClick={() => handleDownloadAttachmentFile(attachmentUrl, attachmentLabel)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="Unduh File Lampiran Resmi"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Unduh Berkas</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDownloadAnnouncementText(selectedAnnouncement)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="Unduh Naskah Pengumuman (.TXT)"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Unduh (.TXT)</span>
                      </button>
                    )}

                    {/* Fullscreen Expansion Modal */}
                    {currentPreviewUrl && (
                      <button
                        onClick={() => setPreviewData({
                          url: currentPreviewUrl,
                          title: selectedAnnouncement.title,
                          label: activePreviewTab === 'survey' ? surveyLabel : attachmentLabel
                        })}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Buka Pratinjau Layar Penuh"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Announcement Title */}
                <div>
                  <h3 className={`text-base sm:text-lg font-black leading-snug line-clamp-2 ${
                    selectedAnnouncement.isUrgent ? 'text-rose-950 dark:text-rose-100' :
                    isDark ? 'text-white' : 'text-slate-950'
                  }`}>
                    {selectedAnnouncement.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Oleh: <strong className="text-slate-800 dark:text-slate-200">{selectedAnnouncement.author}</strong></span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{selectedAnnouncement.date}</span>
                    </span>
                  </div>
                </div>

                {/* Tab Switcher: Switch between Attachment Preview, Survey Form, and Complete Text */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-black">
                    {/* Tab 1: Attachment Document */}
                    {attachmentUrl && (
                      <button
                        onClick={() => setActivePreviewTab('doc')}
                        className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                          activePreviewTab === 'doc'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Pratinjau Dokumen</span>
                      </button>
                    )}

                    {/* Tab 2: Survey Form */}
                    {surveyUrl && (
                      <button
                        onClick={() => setActivePreviewTab('survey')}
                        className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                          activePreviewTab === 'survey'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>Formulir Survei</span>
                      </button>
                    )}

                    {/* Tab 3: Official Text Reader */}
                    <button
                      onClick={() => setActivePreviewTab('text')}
                      className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                        activePreviewTab === 'text'
                          ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Naskah Lengkap</span>
                    </button>
                  </div>

                  {/* Reload iframe button */}
                  {(activePreviewTab === 'doc' || activePreviewTab === 'survey') && currentPreviewUrl && (
                    <button
                      onClick={() => setIframeKey(k => k + 1)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
                      title="Muat Ulang Pratinjau (Refresh)"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold hidden md:inline">Segarkan</span>
                    </button>
                  )}
                </div>

              </div>

              {/* Notice Banner if content note exists and currently viewing attachment */}
              {activePreviewTab !== 'text' && selectedAnnouncement.content && (
                <div className="px-4 py-2.5 bg-amber-500/10 dark:bg-amber-950/20 border-b border-amber-300/40 dark:border-amber-900/40 flex items-start justify-between gap-3 text-xs text-slate-800 dark:text-slate-200">
                  <div className="flex items-start gap-2 min-w-0">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="line-clamp-2 leading-relaxed font-medium">
                      <strong className="text-amber-950 dark:text-amber-300">Catatan: </strong>
                      {selectedAnnouncement.content}
                    </p>
                  </div>
                  <button
                    onClick={() => setActivePreviewTab('text')}
                    className="shrink-0 text-[11px] font-black text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Buka Naskah &rarr;
                  </button>
                </div>
              )}

              {/* Main Body: Direct Live Preview */}
              <div className="p-3 sm:p-4 bg-slate-100/70 dark:bg-slate-950/60">
                
                {/* 1. EMBEDDED DOCUMENT PREVIEW (PDF / DRIVE / YOUTUBE / DOCS) */}
                {activePreviewTab === 'doc' && attachmentUrl && (
                  <div className="space-y-2">
                    <div className="relative w-full h-[620px] sm:h-[700px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-inner flex flex-col">
                      {/* Sub header inside iframe box */}
                      <div className="px-3.5 py-2 bg-slate-900 text-white flex items-center justify-between text-xs border-b border-slate-800 shrink-0">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="font-extrabold text-[11px] text-slate-200 truncate">
                            {currentPreviewEmbedInfo?.label || 'Pratinjau Dokumen'}: {attachmentLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3 text-amber-400" />
                            <span>Buka di Drive / Tab Baru</span>
                          </a>
                        </div>
                      </div>

                      {/* Iframe View */}
                      <div className="flex-1 w-full h-full relative bg-slate-900">
                        {currentPreviewEmbedInfo ? (
                          <iframe
                            key={iframeKey}
                            src={currentPreviewEmbedInfo.embedUrl}
                            className="w-full h-full border-0 bg-white"
                            title={selectedAnnouncement.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-300 space-y-3">
                            <FileText className="w-12 h-12 text-amber-500" />
                            <p className="font-black text-sm">Dokumen Siap Dibuka</p>
                            <p className="text-xs text-slate-400 max-w-sm">Tautan lampiran dapat dibuka langsung melalui tab terpisah atau diunduh ke perangkat.</p>
                            <a
                              href={attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Buka Dokumen Lampiran</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Helper Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Pratinjau langsung interaktif. Dokumen dapat dibaca, di-zoom, dan dicetak tanpa unduh file.</span>
                      </span>
                      <button
                        onClick={() => handleDownloadAttachmentFile(attachmentUrl, attachmentLabel)}
                        className="font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Unduh File Asli</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. EMBEDDED SURVEY / GOOGLE FORM PREVIEW */}
                {activePreviewTab === 'survey' && surveyUrl && (
                  <div className="space-y-2">
                    <div className="relative w-full h-[620px] sm:h-[700px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-inner flex flex-col">
                      <div className="px-3.5 py-2 bg-emerald-950 text-white flex items-center justify-between text-xs border-b border-emerald-900 shrink-0">
                        <div className="flex items-center gap-2 truncate">
                          <ClipboardList className="w-4 h-4 text-emerald-400" />
                          <span className="font-extrabold text-[11px] text-emerald-100 truncate">
                            {surveyLabel}
                          </span>
                        </div>
                        <a
                          href={surveyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white text-[10px] font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 text-emerald-300" />
                          <span>Buka di Tab Baru</span>
                        </a>
                      </div>

                      <div className="flex-1 w-full h-full relative bg-white">
                        <iframe
                          key={iframeKey}
                          src={currentPreviewEmbedInfo?.embedUrl || surveyUrl}
                          className="w-full h-full border-0 bg-white"
                          title="Formulir Survei Satker"
                          allowFullScreen
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Satker dapat langsung mengisi formulir pendaftaran / survei di atas tanpa keluar dari aplikasi.</span>
                    </div>
                  </div>
                )}

                {/* 3. OFFICIAL ANNOUNCEMENT READER VIEW (For Text or Announcements without document link) */}
                {(activePreviewTab === 'text' || (!attachmentUrl && !surveyUrl)) && (
                  <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-sm space-y-6">
                    
                    {/* Official Letterhead Header */}
                    <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-5 space-y-3 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-black">
                            <Building2 className="w-7 h-7" />
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              KEMENTERIAN KEUANGAN RI • DITJEN PERBENDAHARAAN
                            </div>
                            <div className="text-sm font-black text-slate-900 dark:text-white">
                              KPPN SEMARANG I (KODE 026)
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Seksi Manajemen Satker dan Kepatuhan Internal (MSKI)
                            </div>
                          </div>
                        </div>

                        {/* Top Utility Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyText(selectedAnnouncement.content)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedText ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-black">Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin Teks</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDownloadAnnouncementText(selectedAnnouncement)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            title="Unduh Naskah Pengumuman"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh (.TXT)</span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                        <div><strong>Kategori:</strong> {selectedAnnouncement.category}</div>
                        <div><strong>Tanggal:</strong> {selectedAnnouncement.date}</div>
                        <div><strong>Diterbitkan:</strong> {selectedAnnouncement.author}</div>
                        <div><strong>Status:</strong> {selectedAnnouncement.isUrgent ? 'Sangat Segera' : 'Penting'}</div>
                      </div>
                    </div>

                    {/* Official Letter Body Text */}
                    <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed whitespace-pre-line text-slate-900 dark:text-slate-100 font-normal space-y-4">
                      {selectedAnnouncement.content ? (
                        selectedAnnouncement.content
                      ) : (
                        <p className="italic text-slate-500">Tidak ada naskah tambahan. Silakan buka lampiran dokumen di tab Pratinjau Dokumen.</p>
                      )}
                    </div>

                    {/* Attachment Links Box if Available */}
                    {(attachmentUrl || surveyUrl) && (
                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 space-y-3">
                        <div className="text-xs font-black text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                          <Paperclip className="w-4 h-4 text-amber-600" />
                          <span>Tautan Lampiran &amp; Berkas Resmi Terkait:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {attachmentUrl && (
                            <button
                              onClick={() => setActivePreviewTab('doc')}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Buka {attachmentLabel}</span>
                            </button>
                          )}
                          {surveyUrl && (
                            <button
                              onClick={() => setActivePreviewTab('survey')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                              <span>Buka {surveyLabel}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-12 text-center rounded-3xl border text-slate-500 text-xs flex flex-col items-center justify-center space-y-3 min-h-[400px]`}>
              <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl">
                <Megaphone className="w-8 h-8" />
              </div>
              <p className={`font-black text-sm ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
                {activeAnnouncements.length === 0 ? 'Belum Ada Pengumuman Aktif' : 'Silakan Pilih Pengumuman'}
              </p>
              <p className="max-w-md text-slate-600 dark:text-slate-400 font-medium">
                {activeAnnouncements.length === 0 
                  ? 'Belum ada pengumuman aktif. Pengumuman atau Surat Edaran baru yang dipublikasikan Admin akan tampil di sini.' 
                  : 'Silakan pilih salah satu pengumuman di sebelah kiri untuk melihat pratinjau dokumen langsung di sini.'}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* FULL SCREEN / MODAL PREVIEW OVERLAY VIEWER */}
      {previewData && (() => {
        const embedInfo = getEmbedInfo(previewData.url);

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
            <div className={`w-full max-w-5xl h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}>
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900 shrink-0">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {embedInfo?.label || 'Pratinjau Dokumen'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold truncate hidden sm:inline">
                      {previewData.label}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black truncate text-slate-950 dark:text-white">
                    {previewData.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownloadAttachmentFile(previewData.url, previewData.label || previewData.title)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    title="Unduh Berkas Lampiran"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Unduh Berkas</span>
                  </button>

                  <a
                    href={previewData.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Buka Tab Baru / Google Drive</span>
                  </a>

                  <button
                    onClick={() => setPreviewData(null)}
                    className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Tutup Pratinjau"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content Body: Iframe Viewer */}
              <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                {embedInfo ? (
                  <iframe
                    src={embedInfo.embedUrl}
                    className="w-full h-full border-0"
                    title="Pratinjau Dokumen / Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-center p-8 text-slate-400 space-y-3">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                    <p className="font-bold text-sm">Tidak dapat memuat tautan pratinjau otomatis.</p>
                    <a
                      href={previewData.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 hover:underline"
                    >
                      Klik di sini untuk membuka di Google Drive / Tab Baru <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Modal Footer Helper Notice */}
              <div className="p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
                <span className="font-medium flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Pratinjau langsung tanpa perlu mengunduh file ke perangkat.</span>
                </span>
                <button
                  onClick={() => setPreviewData(null)}
                  className="font-black text-slate-900 dark:text-white hover:underline cursor-pointer"
                >
                  Tutup Pratinjau [X]
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
