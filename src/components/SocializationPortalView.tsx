import React, { useState } from 'react';
import { 
  Link2, 
  ExternalLink, 
  Search, 
  Calendar, 
  MapPin, 
  Clock, 
  QrCode, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  Video, 
  ClipboardCheck, 
  Award, 
  HelpCircle, 
  Share2, 
  FolderDown, 
  Globe, 
  MessageSquare, 
  Zap, 
  Building2, 
  Info,
  CheckCircle2,
  ArrowRight,
  Filter,
  Layers
} from 'lucide-react';
import { KegiatanSosialisasi, SocializationLink, AppTheme, DashboardConfig } from '../types';

interface SocializationPortalViewProps {
  kegiatanList?: KegiatanSosialisasi[];
  theme?: AppTheme;
  dashboardConfig?: DashboardConfig;
  onGoToAdmin?: () => void;
  onGoToPresensi?: () => void;
  isAdminAuthenticated?: boolean;
}

export const SocializationPortalView: React.FC<SocializationPortalViewProps> = ({
  kegiatanList = [],
  theme = 'light',
  dashboardConfig,
  onGoToAdmin,
  onGoToPresensi,
  isAdminAuthenticated = false
}) => {
  const isDark = theme === 'dark';
  
  // Filter active events
  const activeEvents = kegiatanList.filter(k => k.isActive);
  
  // Selected Event State (defaults to featured or first active event)
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    const featured = activeEvents.find(k => k.isFeatured);
    if (featured) return featured.id;
    return activeEvents[0]?.id || '';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [activeQrModalUrl, setActiveQrModalUrl] = useState<{ url: string; title: string } | null>(null);
  const [clickedLinkIds, setClickedLinkIds] = useState<Record<string, number>>({});

  const currentEvent = activeEvents.find(k => k.id === selectedEventId) || activeEvents[0];

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleLinkClick = (link: SocializationLink) => {
    setClickedLinkIds(prev => ({
      ...prev,
      [link.id]: (prev[link.id] || 0) + 1
    }));
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  // Icon selector helper with styling & vibrant background badges matching the screenshot
  const renderLinkIconBox = (type?: string, isHighlight?: boolean) => {
    switch (type) {
      case 'presence':
        return (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full sm:rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 flex items-center justify-center shrink-0 shadow-xs">
            <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
      case 'zoom':
        return (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full sm:rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-700 flex items-center justify-center shrink-0 shadow-xs">
            <Video className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
      case 'pdf':
      case 'drive':
        return (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full sm:rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
      case 'form':
        return (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full sm:rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center justify-center shrink-0 shadow-xs">
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
      case 'certificate':
        return (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full sm:rounded-2xl bg-yellow-100 dark:bg-yellow-950/80 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
      case 'whatsapp':
        return (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full sm:rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
      case 'youtube':
        return (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full sm:rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 flex items-center justify-center shrink-0 shadow-xs">
            <Video className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
      default:
        return (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        );
    }
  };

  const customTexts = dashboardConfig?.customTexts;
  const badgeText = customTexts?.portalLinkBadge || 'PORTAL AKSES SAKTI & TAUTAN SOSIALISASI';
  const titleText = customTexts?.portalLinkTitle || 'Akses Cepat Materi, Presensi & Zoom Sosialisasi';
  const subtitleText = customTexts?.portalLinkSubtitle || 'Satu pintasan resmi KPPN Semarang I untuk seluruh tautan kegiatan sosialisasi, bimtek, presensi online, materi paparan, dan sertifikat.';

  // Categories definition
  const categories = [
    { id: 'ALL', label: 'Semua Link', icon: Layers },
    { id: 'presence', label: 'Presensi', icon: ClipboardCheck },
    { id: 'zoom', label: 'Zoom & Video', icon: Video },
    { id: 'pdf', label: 'Materi & PDF', icon: FileText },
    { id: 'form', label: 'Form & Evaluasi', icon: HelpCircle },
    { id: 'certificate', label: 'Sertifikat', icon: Award },
    { id: 'whatsapp', label: 'Grup WA', icon: MessageSquare }
  ];

  // Filter links by search query & category
  const filteredLinks = currentEvent?.links.filter(link => {
    if (link.isActive === false) return false;
    
    // Category filter
    if (selectedCategory !== 'ALL') {
      if (selectedCategory === 'pdf' && (link.iconType === 'pdf' || link.iconType === 'drive')) {
        // match
      } else if (link.iconType !== selectedCategory) {
        return false;
      }
    }

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      link.judulLink.toLowerCase().includes(query) ||
      (link.deskripsi && link.deskripsi.toLowerCase().includes(query)) ||
      (link.badge && link.badge.toLowerCase().includes(query))
    );
  }) || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Top Banner & Header */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 border-slate-800/80 text-white' 
          : 'bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 border-indigo-900/50 text-white'
      }`}>
        {/* Glow Decors */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 rounded-full bg-sky-500/20 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                {badgeText}
              </span>
              <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2.5 py-1 rounded-full text-xs font-bold">
                KPPN Semarang I (026)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white">
              {titleText}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {subtitleText}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs">
              <button
                onClick={() => handleCopyLink(window.location.href, 'portal-main')}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                {copiedLinkId === 'portal-main' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLinkId === 'portal-main' ? 'Link Tersalin!' : 'Bagikan Link Portal'}</span>
              </button>

              <button
                onClick={() => setActiveQrModalUrl({ url: window.location.href, title: 'Portal Link Sosialisasi KPPN Semarang I' })}
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer backdrop-blur-md"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>Tampilkan QR Code</span>
              </button>

              {isAdminAuthenticated && (
                <button
                  onClick={onGoToAdmin}
                  className="inline-flex items-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-white font-extrabold px-3.5 py-2.5 rounded-xl border border-indigo-400/40 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Atur Kegiatan (Admin)</span>
                </button>
              )}
            </div>

          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-900/90 border border-slate-700/80 p-5 rounded-2xl backdrop-blur-md text-center min-w-[210px] shrink-0 space-y-2 shadow-xl">
            <Building2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-2xl font-black text-white">{activeEvents.length} Kegiatan</div>
            <p className="text-[11px] text-slate-300 font-semibold">Sosialisasi Aktif Saat Ini</p>
            <div className="pt-1 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-700/60 inline-block">
              {currentEvent?.links.length || 0} Link Terverifikasi
            </div>
          </div>
        </div>
      </div>

      {/* Active Events Tab Selector if multiple events */}
      {activeEvents.length > 1 && (
        <div className={`p-2 rounded-2xl border flex flex-wrap items-center gap-2 ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <span className="text-xs font-black text-slate-400 px-3 uppercase tracking-wider">
            Pilih Kegiatan:
          </span>
          {activeEvents.map(event => {
            const isSelected = event.id === selectedEventId;
            return (
              <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md font-black'
                    : isDark 
                    ? 'text-slate-300 hover:bg-slate-800' 
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{event.judulKegiatan}</span>
                {event.isFeatured && (
                  <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full text-[9px] font-black">Utama</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Current Selected Event Detail Header */}
      {currentEvent && (
        <div className={`p-6 sm:p-7 rounded-3xl border shadow-lg space-y-4 transition-all ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-100'
        }`}>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  KEGIATAN SOSIALISASI AKTIF
                </span>
                {currentEvent.isFeatured && (
                  <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                    ⭐ Featured Event
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentEvent.judulKegiatan}
              </h2>

              {currentEvent.subJudul && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">
                  {currentEvent.subJudul}
                </p>
              )}
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari link, zoom, materi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs rounded-xl pl-9 pr-3 py-2.5 border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Event Metadata Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {currentEvent.tanggal && (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span>{currentEvent.tanggal}</span>
              </div>
            )}

            {currentEvent.jam && (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Clock className="w-4 h-4 text-sky-500" />
                <span>{currentEvent.jam}</span>
              </div>
            )}

            {currentEvent.lokasi && (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>{currentEvent.lokasi}</span>
              </div>
            )}
          </div>

          {currentEvent.deskripsi && (
            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 leading-relaxed">
              {currentEvent.deskripsi}
            </p>
          )}

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-black shadow-sm'
                      : isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Modern Bio-Link Capsule Pill Rows matching the uploaded design */}
          <div className="space-y-3.5 pt-2 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                <span>Daftar Tautan Resmi ({filteredLinks.length})</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">Klik tombol untuk langsung membuka link</span>
            </div>

            {filteredLinks.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 space-y-2">
                <Info className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-300">Belum Ada Link yang Sesuai</p>
                <p className="text-xs text-slate-500">Coba ubah filter kategori atau periksa kembali kata kunci pencarian Anda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLinks.map((link) => {
                  const isCopied = copiedLinkId === link.id;

                  return (
                    <div
                      key={link.id}
                      onClick={() => handleLinkClick(link)}
                      className={`w-full relative rounded-full p-2.5 sm:p-3 sm:px-5 border-2 transition-all flex items-center justify-between gap-3 sm:gap-4 shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                        link.isHighlight
                          ? 'bg-white dark:bg-slate-900 border-teal-500 ring-2 ring-teal-500/30 shadow-teal-900/10'
                          : isDark
                          ? 'bg-slate-900/90 hover:bg-slate-850 border-teal-500/60 shadow-black/30'
                          : 'bg-white hover:bg-teal-50/30 border-teal-600/50 shadow-slate-100'
                      }`}
                    >
                      {/* Left: Round icon/avatar with distinct color */}
                      <div className="shrink-0">
                        {renderLinkIconBox(link.iconType, link.isHighlight)}
                      </div>

                      {/* Center: Title & Optional Description */}
                      <div className="flex-1 text-center px-2 min-w-0">
                        <h4 className={`font-extrabold text-sm sm:text-base tracking-tight truncate ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {link.judulLink}
                        </h4>
                        {link.deskripsi && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block mt-0.5 font-medium">
                            {link.deskripsi}
                          </p>
                        )}
                      </div>

                      {/* Right: Pill Badge (e.g. Free, Baru, Zoom, Wajib) & Quick Actions */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {link.badge && (
                          <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                            link.badge.toLowerCase() === 'free' || link.badge.toLowerCase() === 'gratis'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : link.isHighlight
                              ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                              : 'bg-teal-600 text-white shadow-xs'
                          }`}>
                            {link.badge}
                          </span>
                        )}
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(link.url, link.id);
                          }}
                          className={`p-2 rounded-full border transition-all cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                          }`}
                          title="Salin Link"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveQrModalUrl({ url: link.url, title: link.judulLink });
                          }}
                          className={`p-2 rounded-full border transition-all cursor-pointer ${
                            isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                              : 'bg-slate-100 hover:bg-slate-200 text-amber-700 border-slate-200'
                          }`}
                          title="Tampilkan QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* QR CODE MODAL */}
      {activeQrModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl border-4 border-slate-900"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-black text-teal-600 uppercase tracking-wider">KPPN SEMARANG I</span>
              <h4 className="text-sm font-black text-slate-900 leading-tight">{activeQrModalUrl.title}</h4>
            </div>

            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 inline-block shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(activeQrModalUrl.url)}`} 
                alt="QR Code"
                className="w-48 h-48 mx-auto object-contain"
              />
            </div>

            <p className="text-[11px] text-slate-500 font-mono break-all line-clamp-2">
              {activeQrModalUrl.url}
            </p>

            <button
              onClick={() => setActiveQrModalUrl(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Tutup QR Code
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
