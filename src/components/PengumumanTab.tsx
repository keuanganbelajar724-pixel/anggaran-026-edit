import React, { useState } from 'react';
import { Announcement, AppTheme, DashboardConfig } from '../types';
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
  Download
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
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`,
      type: 'youtube' as const,
      label: 'Video YouTube Interaktif'
    };
  }

  // Google Drive File preview conversion (/view -> /preview)
  const driveMatch = clean.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
  if (driveMatch && driveMatch[1]) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      type: 'drive' as const,
      label: 'Pratinjau PDF (Google Drive)'
    };
  }

  // Google Drive Folder
  const driveFolderMatch = clean.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([^\?\/]+)/);
  if (driveFolderMatch && driveFolderMatch[1]) {
    return {
      embedUrl: `https://drive.google.com/embeddedfolderview?id=${driveFolderMatch[1]}#grid`,
      type: 'drive_folder' as const,
      label: 'Folder Google Drive'
    };
  }

  // Google Docs / Sheets / Slides / Forms
  if (clean.includes('docs.google.com')) {
    let docUrl = clean;
    if (docUrl.includes('/edit')) {
      docUrl = docUrl.replace(/\/edit.*$/, '/preview');
    } else if (docUrl.includes('/view')) {
      docUrl = docUrl.replace(/\/view.*$/, '/preview');
    }
    return {
      embedUrl: docUrl,
      type: 'docs' as const,
      label: 'Google Docs / Form'
    };
  }

  // General URL
  return {
    embedUrl: clean,
    type: clean.toLowerCase().endsWith('.pdf') ? ('pdf' as const) : ('general' as const),
    label: 'Pratinjau Dokumen Eksternal'
  };
};

export const PengumumanTab: React.FC<PengumumanTabProps> = ({
  announcements,
  theme = 'light',
  dashboardConfig
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Active announcements only (filter out isActive === false)
  const activeAnnouncements = announcements.filter(a => a.isActive !== false);

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(
    activeAnnouncements.length > 0 ? activeAnnouncements[0] : null
  );

  // Modal Previewer State
  const [previewData, setPreviewData] = useState<{
    url: string;
    title: string;
    label?: string;
  } | null>(null);

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
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs rounded-xl pl-9 pr-3 py-2 border font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-500'
                }`}
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
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
              sortedAnnouncements.map((item) => {
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
                            setPreviewData({
                              url: itemLink,
                              title: item.title,
                              label: item.linkLabel || item.attachmentLabel || 'Pratinjau PDF / Video'
                            });
                          }}
                          className={`px-2.5 py-1 rounded-xl font-black text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer border ${
                            isPalingPenting
                              ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700'
                              : isPenting
                              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Pratinjau</span>
                        </button>
                      ) : <div />}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAnnouncementText(item);
                          }}
                          className="px-2.5 py-1 rounded-xl font-extrabold text-[11px] bg-slate-100 hover:bg-amber-500 hover:text-slate-950 dark:bg-slate-800 dark:hover:bg-amber-500 dark:hover:text-slate-950 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Unduh Surat / Pengumuman"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh</span>
                        </button>

                        <span className={`text-[11px] font-bold flex items-center gap-1 ${
                          isPalingPenting ? 'text-rose-700 dark:text-rose-300' :
                          isPenting ? 'text-amber-700 dark:text-amber-400' :
                          'text-slate-600 dark:text-slate-400'
                        }`}>
                          <span>Detail</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Column: Detail View */}
        <div className="lg:col-span-7">
          {selectedAnnouncement ? (
            <div className={`p-6 sm:p-8 rounded-3xl border border-l-8 shadow-xl space-y-6 sticky top-24 ${
              selectedAnnouncement.isUrgent
                ? 'border-rose-500 border-l-rose-600 bg-rose-50/70 dark:bg-rose-950/40 text-slate-950 dark:text-slate-100 ring-2 ring-rose-500/30'
                : (selectedAnnouncement.category === 'Penting' || selectedAnnouncement.category === 'Batas Waktu' || selectedAnnouncement.isPinned)
                ? 'border-amber-400 border-l-amber-500 bg-amber-50/70 dark:bg-amber-950/30 text-slate-950 dark:text-slate-100 ring-2 ring-amber-400/30'
                : isDark
                ? 'bg-slate-900 border-slate-800 border-l-slate-600 text-slate-100'
                : 'bg-white border-slate-300 border-l-slate-400 text-slate-900'
            }`}>
              
              {/* Header */}
              <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  
                  {selectedAnnouncement.isUrgent ? (
                    <span className="bg-rose-600 text-white font-black px-3 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-sm animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      🚨 PALING PENTING / URGENT
                    </span>
                  ) : (selectedAnnouncement.category === 'Penting' || selectedAnnouncement.category === 'Batas Waktu') ? (
                    <span className="bg-amber-400 text-slate-950 border border-amber-500 font-black px-3 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-sm">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      ⚠️ PENTING
                    </span>
                  ) : null}

                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                    selectedAnnouncement.category === 'Penting' ? 'bg-rose-100 text-rose-950 border-rose-300' :
                    selectedAnnouncement.category === 'Batas Waktu' ? 'bg-amber-200 text-amber-950 border-amber-400' :
                    selectedAnnouncement.category === 'Surat Edaran' ? 'bg-sky-100 text-sky-950 border-sky-300' :
                    'bg-slate-100 text-slate-900 border-slate-300'
                  }`}>
                    {selectedAnnouncement.category}
                  </span>

                  {selectedAnnouncement.isPinned && (
                    <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-xs border border-amber-600">
                      <Pin className="w-3 h-3 fill-current" />
                      Disematkan Admin
                    </span>
                  )}
                </div>

                <h3 className={`text-xl sm:text-2xl font-black leading-tight ${
                  selectedAnnouncement.isUrgent ? 'text-rose-950 dark:text-rose-100' :
                  (selectedAnnouncement.category === 'Penting' || selectedAnnouncement.category === 'Batas Waktu' || selectedAnnouncement.isPinned) ? 'text-amber-950 dark:text-amber-100' :
                  isDark ? 'text-white' : 'text-slate-950'
                }`}>
                  {selectedAnnouncement.title}
                </h3>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-amber-600" />
                      <span>Diterbitkan oleh: <strong className="text-slate-950 dark:text-slate-200">{selectedAnnouncement.author}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>Tanggal: <strong className="text-slate-950 dark:text-slate-200">{selectedAnnouncement.date}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadAnnouncementText(selectedAnnouncement)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    title="Unduh Naskah Pengumuman Resmi (.TXT)"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Pengumuman (.TXT)</span>
                  </button>
                </div>
              </div>
          

          {/* Content Body */}
          <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200 font-medium">
            {selectedAnnouncement.content}
          </div>

          {/* Interactive Preview Box for Main Link & Attachment */}
          {(selectedAnnouncement.linkUrl || selectedAnnouncement.attachmentUrl || selectedAnnouncement.surveyUrl) && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-amber-600" />
                Lampiran Tautan &amp; Unduh Berkas Dokumen
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Main Link / PDF Preview & Download Button */}
                {(selectedAnnouncement.linkUrl || selectedAnnouncement.attachmentUrl) && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-black text-slate-950 dark:text-white truncate">
                          {selectedAnnouncement.linkLabel || selectedAnnouncement.attachmentLabel || 'Dokumen PDF / Video Tutorial'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">Pratinjau &amp; Download Langsung</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setPreviewData({
                          url: (selectedAnnouncement.linkUrl || selectedAnnouncement.attachmentUrl)!,
                          title: selectedAnnouncement.title,
                          label: selectedAnnouncement.linkLabel || selectedAnnouncement.attachmentLabel
                        })}
                        className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => handleDownloadAttachmentFile((selectedAnnouncement.linkUrl || selectedAnnouncement.attachmentUrl)!, selectedAnnouncement.linkLabel || selectedAnnouncement.attachmentLabel)}
                        className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Unduh File Lampiran"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Unduh</span>
                      </button>

                      <a
                        href={selectedAnnouncement.linkUrl || selectedAnnouncement.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                        title="Buka di Tab Baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Survey Link */}
                {selectedAnnouncement.surveyUrl && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 font-bold shrink-0">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-black text-slate-950 dark:text-white truncate">
                          {selectedAnnouncement.surveyLabel || 'Isi Form Registrasi / Survei'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">Formulir Interaktif Satker</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setPreviewData({
                          url: selectedAnnouncement.surveyUrl!,
                          title: selectedAnnouncement.title,
                          label: selectedAnnouncement.surveyLabel || 'Form Survei / Registrasi'
                        })}
                        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Form</span>
                      </button>

                      <a
                        href={selectedAnnouncement.surveyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                        title="Buka di Tab Baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Footer Notice */}
          <div className="bg-amber-100/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/50 p-4 rounded-2xl text-xs text-slate-950 dark:text-amber-200 space-y-1">
            <span className="font-black text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-700" />
              Konfirmasi &amp; Pertanyaan Satker:
            </span>
            <p className="font-bold text-slate-950 dark:text-amber-200">
              Jika Satker memerlukan bantuan teknis mengenai pengumuman ini, silakan hubungi Seksi MSKI / Pembina Keuangan KPPN Semarang I via Helpdesk SAKTI.
            </p>
          </div>

        </div>
      ) : (
            <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'} p-12 text-center rounded-3xl border text-slate-500 text-xs flex flex-col items-center justify-center space-y-3`}>
              <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl">
                <Megaphone className="w-8 h-8" />
              </div>
              <p className={`font-black text-sm ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
                {activeAnnouncements.length === 0 ? 'Belum Ada Pengumuman Aktif' : 'Silakan Pilih Pengumuman'}
              </p>
              <p className="max-w-md text-slate-600 dark:text-slate-400 font-medium">
                {activeAnnouncements.length === 0 
                  ? 'Belum ada pengumuman aktif. Pengumuman atau Surat Edaran baru yang dipublikasikan Admin akan tampil di sini.' 
                  : 'Silakan pilih salah satu pengumuman di sebelah kiri untuk membaca rincian pesan dan melakukan pratinjau dokumen.'}
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
