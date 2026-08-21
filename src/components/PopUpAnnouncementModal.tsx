import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Calendar,
  CheckCircle,
  FileText,
  HelpCircle,
  Clock,
  ShieldCheck,
  BellRing
} from 'lucide-react';
import { PopUpAnnouncementConfig, AppTheme } from '../types';

interface PopUpAnnouncementModalProps {
  config?: PopUpAnnouncementConfig;
  theme?: AppTheme;
  onClose?: () => void;
  onNavigateToTab?: (tabName: string) => void;
}

export const PopUpAnnouncementModal: React.FC<PopUpAnnouncementModalProps> = ({
  config,
  theme = 'light',
  onClose,
  onNavigateToTab
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!config || !config.isEnabled) {
      setIsOpen(false);
      return;
    }

    // Check if dismissed in localStorage for this specific announcement id or today
    const storageKey = `kppn026_popup_dismissed_${config.id || 'default'}`;
    const dismissedDate = localStorage.getItem(storageKey);
    const todayStr = new Date().toISOString().slice(0, 10);

    if (dismissedDate === todayStr) {
      setIsOpen(false);
      return;
    }

    // Small delay to smoothly show after dashboard render
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [config]);

  const handleClose = () => {
    if (dontShowToday && config) {
      const storageKey = `kppn026_popup_dismissed_${config.id || 'default'}`;
      localStorage.setItem(storageKey, new Date().toISOString().slice(0, 10));
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen || !config || !config.isEnabled) return null;

  // Category Theme Badges
  const getCategoryBadge = () => {
    switch (config.category) {
      case 'Batas Waktu':
        return {
          bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
          icon: <Clock className="w-3.5 h-3.5" />
        };
      case 'Surat Edaran':
        return {
          bg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
          icon: <FileText className="w-3.5 h-3.5" />
        };
      case 'Jadwal':
        return {
          bg: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30',
          icon: <Calendar className="w-3.5 h-3.5" />
        };
      case 'Sistem':
        return {
          bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
          icon: <ShieldCheck className="w-3.5 h-3.5" />
        };
      default:
        return {
          bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
          icon: <Megaphone className="w-3.5 h-3.5" />
        };
    }
  };

  const badgeStyle = getCategoryBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div 
        className={`relative w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border transition-all transform scale-100 ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Gradient Bar */}
        <div className="h-2.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 w-full" />

        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer z-10"
          title="Tutup Pengumuman"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Banner Image if provided */}
        {config.bannerImageUrl && (
          <div className="w-full h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden relative border-b border-slate-100 dark:border-slate-800">
            <img 
              src={config.bannerImageUrl} 
              alt={config.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                // hide broken image
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="p-6 sm:p-7 space-y-4">
          
          {/* Header Tag / Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${badgeStyle.bg}`}>
              {badgeStyle.icon}
              {config.badge || 'PENGUMUMAN RESMI KPPN SEMARANG I'}
            </span>

            {config.category && (
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                {config.category}
              </span>
            )}
          </div>

          {/* Title & Subtitle */}
          <div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-snug">
              {config.title}
            </h3>
            {config.subtitle && (
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
                {config.subtitle}
              </p>
            )}
          </div>

          {/* Body Content */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
            {config.content}
          </div>

          {/* Action Links Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
            {config.linkUrl && (
              <a
                href={config.linkUrl}
                target="_blank"
                rel="noreferrer"
                onClick={handleClose}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm py-3 px-4 rounded-xl text-center flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>{config.linkLabel || 'Buka Tautan / Dokumen'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {config.secondaryLinkUrl && (
              <a
                href={config.secondaryLinkUrl}
                target="_blank"
                rel="noreferrer"
                onClick={handleClose}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm py-3 px-4 rounded-xl text-center flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{config.secondaryLinkLabel || 'Pelajari Lebih Lanjut'}</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            )}

            <button
              type="button"
              onClick={handleClose}
              className={`${config.linkUrl ? 'sm:w-auto px-5' : 'w-full'} py-3 rounded-xl font-bold text-xs sm:text-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-center`}
            >
              Saya Mengerti
            </button>
          </div>

          {/* Footer "Jangan Tampilkan Lagi Hari Ini" */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>Jangan tampilkan lagi pop-up ini hari ini</span>
            </label>

            <span className="font-mono text-[10px]">KPPN Semarang I (026)</span>
          </div>

        </div>
      </div>
    </div>
  );
};
