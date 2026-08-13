import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  CheckCircle2
} from 'lucide-react';
import { KegiatanSosialisasi, SocializationLink, AppTheme, DashboardConfig } from '../types';

interface SocializationPortalViewProps {
  kegiatanList?: KegiatanSosialisasi[];
  theme?: AppTheme;
  dashboardConfig?: DashboardConfig;
  onGoToAdmin?: () => void;
  isAdminAuthenticated?: boolean;
}

export const SocializationPortalView: React.FC<SocializationPortalViewProps> = ({
  kegiatanList = [],
  theme = 'light',
  dashboardConfig,
  onGoToAdmin,
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
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [clickedLinkIds, setClickedLinkIds] = useState<Record<string, number>>({});

  const currentEvent = activeEvents.find(k => k.id === selectedEventId) || activeEvents[0];

  const handleCopyPortalLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLinkClick = (link: SocializationLink) => {
    setClickedLinkIds(prev => ({
      ...prev,
      [link.id]: (prev[link.id] || 0) + 1
    }));
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  // Icon selector helper
  const renderLinkIcon = (type?: string, isHighlight?: boolean) => {
    const className = `w-6 h-6 shrink-0 ${isHighlight ? 'animate-bounce' : ''}`;
    switch (type) {
      case 'presence':
        return <ClipboardCheck className={`${className} text-emerald-400`} />;
      case 'zoom':
        return <Video className={`${className} text-sky-400`} />;
      case 'pdf':
      case 'drive':
        return <FileText className={`${className} text-indigo-400`} />;
      case 'form':
        return <ClipboardCheck className={`${className} text-amber-400`} />;
      case 'certificate':
        return <Award className={`${className} text-yellow-400`} />;
      case 'whatsapp':
        return <MessageSquare className={`${className} text-emerald-400`} />;
      case 'youtube':
        return <Video className={`${className} text-rose-400`} />;
      default:
        return <Globe className={`${className} text-sky-400`} />;
    }
  };

  // Quick SVG QR Code Generator component (Generates a clean QR visual)
  const renderQrVisual = (textUrl: string) => {
    return (
      <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-slate-900 inline-block text-center">
        <img 
          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(textUrl)}`} 
          alt="QR Code Akses Sosialisasi"
          className="w-56 h-56 mx-auto rounded-lg object-contain"
          onError={(e) => {
            // Fallback visual if offline
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <p className="text-[11px] font-black font-mono text-slate-800 mt-2 tracking-wider uppercase">
          SCAN QR CODE MATERI SOSIALISASI
        </p>
      </div>
    );
  };

  const customTexts = dashboardConfig?.customTexts;
  const badgeText = customTexts?.portalLinkBadge || 'PORTAL AKSES SAKTI & TAUTAN SOSIALISASI';
  const titleText = customTexts?.portalLinkTitle || 'Akses Cepat Materi, Presensi & Zoom Sosialisasi';
  const subtitleText = customTexts?.portalLinkSubtitle || 'Satu pintasan resmi KPPN Semarang I untuk seluruh tautan kegiatan sosialisasi, bimtek, presensi online, materi paparan, dan sertifikat.';

  // Filter links by search query
  const filteredLinks = currentEvent?.links.filter(link => {
    if (link.isActive === false) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      link.judulLink.toLowerCase().includes(query) ||
      (link.deskripsi && link.deskripsi.toLowerCase().includes(query)) ||
      (link.badge && link.badge.toLowerCase().includes(query))
    );
  }) || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Top Banner & Header */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-xl transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-slate-800/80 text-white' 
          : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-indigo-900/50 text-white'
      }`}>
        {/* Glow Decor */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none"></div>

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
                onClick={handleCopyPortalLink}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Tersalin!' : 'Bagikan Link Portal'}</span>
              </button>

              <button
                onClick={() => setShowQrModal(true)}
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl border border-white/20 transition-all cursor-pointer backdrop-blur-md"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>Tampilkan QR Code</span>
              </button>

              {isAdminAuthenticated && (
                <button
                  onClick={onGoToAdmin}
                  className="inline-flex items-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-white font-extrabold px-3.5 py-2 rounded-xl border border-indigo-400/40 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Atur Kegiatan (Admin)</span>
                </button>
              )}
            </div>

          </div>

          {/* Quick Info Box / Event Counter */}
          <div className="bg-slate-900/80 border border-slate-700/80 p-4 sm:p-5 rounded-2xl backdrop-blur-md text-center min-w-[200px] shrink-0 space-y-2">
            <Building2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-xl font-black text-white">{activeEvents.length} Kegiatan</div>
            <p className="text-[11px] text-slate-400 font-medium">Sosialisasi Aktif Saat Ini</p>
          </div>
        </div>
      </div>

      {/* Active Events Tab Selector if multiple events */}
      {activeEvents.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 px-3 uppercase tracking-wider">
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
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
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
      {currentEvent ? (
        <div className={`p-6 rounded-3xl border shadow-lg space-y-4 transition-all ${
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
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari link, materi, presensi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs rounded-xl pl-9 pr-3 py-2 border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
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
            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 leading-relaxed">
              {currentEvent.deskripsi}
            </p>
          )}

          {/* Link Tree Buttons List */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Daftar Link &amp; Akses Pintasan ({filteredLinks.length})</span>
              <span className="text-[11px] font-normal text-slate-400">Klik tombol untuk membuka tautan</span>
            </h3>

            {filteredLinks.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 space-y-2">
                <Info className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-300">Belum Ada Link yang Tersedia</p>
                <p className="text-xs text-slate-500">Silakan hubungi panitia sosialisasi KPPN Semarang I atau periksa kata kunci pencarian Anda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredLinks.map((link) => {
                  const clickCount = (clickedLinkIds[link.id] || 0) + (link.clickCount || 0);

                  return (
                    <motion.button
                      key={link.id}
                      whileHover={{ scale: 1.01, y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleLinkClick(link)}
                      className={`group relative text-left w-full p-4 sm:p-5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-4 border shadow-md ${
                        link.isHighlight
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white border-emerald-400 shadow-emerald-900/20 ring-2 ring-emerald-400/40'
                          : isDark
                          ? 'bg-slate-800/90 hover:bg-slate-800 text-slate-100 border-slate-700/80 shadow-black/20'
                          : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Icon Box */}
                        <div className={`p-3 rounded-xl shrink-0 flex items-center justify-center ${
                          link.isHighlight 
                            ? 'bg-white/20 text-white backdrop-blur-md' 
                            : isDark 
                            ? 'bg-slate-900 text-emerald-400 border border-slate-700' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {renderLinkIcon(link.iconType, link.isHighlight)}
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`font-black text-sm sm:text-base tracking-tight truncate ${
                              link.isHighlight ? 'text-white' : 'text-slate-900 dark:text-white'
                            }`}>
                              {link.judulLink}
                            </h4>

                            {link.badge && (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                link.isHighlight
                                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60'
                              }`}>
                                {link.badge}
                              </span>
                            )}
                          </div>

                          {link.deskripsi && (
                            <p className={`text-xs truncate ${
                              link.isHighlight ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'
                            }`}>
                              {link.deskripsi}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Action Arrow & Click Tag */}
                      <div className="flex items-center gap-2 shrink-0">
                        {clickCount > 0 && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono hidden sm:inline ${
                            link.isHighlight ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'
                          }`}>
                            {clickCount}x dibuka
                          </span>
                        )}

                        <div className={`p-2 rounded-xl transition-all group-hover:translate-x-1 ${
                          link.isHighlight 
                            ? 'bg-white text-slate-950' 
                            : isDark 
                            ? 'bg-slate-700 text-slate-200 group-hover:bg-emerald-600 group-hover:text-white' 
                            : 'bg-slate-100 text-slate-700 group-hover:bg-emerald-600 group-hover:text-white'
                        }`}>
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <Info className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">Belum Ada Kegiatan Sosialisasi yang Aktif</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Saat ini tidak ada jadwal sosialisasi yang dipublikasikan. Silakan kembali lagi nanti atau hubungi Admin KPPN Semarang I untuk mengaktifkan jadwal kegiatan.
          </p>
          {isAdminAuthenticated && (
            <button
              onClick={onGoToAdmin}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Kelola &amp; Aktifkan Kegiatan di Panel Admin &rarr;</span>
            </button>
          )}
        </div>
      )}

      {/* QR Code Modal Display for Presentation Screen */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full text-xl cursor-pointer"
              >
                ✕
              </button>

              <div className="space-y-1">
                <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 px-3 py-0.5 rounded-full text-[10px] font-black uppercase">
                  TAMPILAN MONITOR PROYEKTOR / ZOOM
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Scan QR Code Materi Sosialisasi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Arahkan kamera smartphone ke gambar di bawah untuk langsung membuka portal link ini.
                </p>
              </div>

              {renderQrVisual(window.location.href)}

              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={handleCopyPortalLink}
                  className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold py-2.5 rounded-xl text-xs hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Link Tersalin!' : 'Salin URL Portal'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
