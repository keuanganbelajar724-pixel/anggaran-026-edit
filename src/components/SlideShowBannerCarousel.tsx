import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Sparkles,
  Settings
} from 'lucide-react';
import { SlideShowConfig, SlideShowBannerItem } from '../types';
import { normalizeImageUrl, getAlternativeImageUrl } from '../utils/imageUrlHelper';

interface SlideShowBannerCarouselProps {
  config?: SlideShowConfig;
  activeTab?: string;
  isDark?: boolean;
  onOpenAdminSlideShow?: () => void;
  isAdmin?: boolean;
}

export const SlideShowBannerCarousel: React.FC<SlideShowBannerCarouselProps> = ({
  config,
  activeTab = 'dashboard',
  isDark = false,
  onOpenAdminSlideShow,
  isAdmin = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter slides that are active and match current tab (or 'ALL')
  const activeSlides = useMemo(() => {
    if (!config || !config.isEnabled || !Array.isArray(config.slides)) return [];
    
    // Check if carousel itself is enabled for this tab
    if (Array.isArray(config.showOnTabs) && config.showOnTabs.length > 0) {
      const isTabAllowed = config.showOnTabs.includes('ALL') || config.showOnTabs.includes(activeTab);
      if (!isTabAllowed) return [];
    }

    return config.slides
      .filter((s) => {
        if (!s.isActive) return false;
        if (!s.targetTabs || s.targetTabs.length === 0 || s.targetTabs.includes('ALL')) return true;
        return s.targetTabs.includes(activeTab);
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [config, activeTab]);

  // Reset index if out of range
  useEffect(() => {
    if (currentIndex >= activeSlides.length) {
      setCurrentIndex(0);
    }
  }, [activeSlides.length, currentIndex]);

  // Auto-play timer with smooth rotation
  useEffect(() => {
    if (!config?.autoPlay || activeSlides.length <= 1 || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.max(2, config.intervalSeconds || 5) * 1000;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [config?.autoPlay, config?.intervalSeconds, activeSlides.length, isHovered]);

  // If no active slides or disabled, render nothing
  if (!config?.isEnabled || activeSlides.length === 0) {
    return null;
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  return (
    <div
      className="relative mb-3 sm:mb-4 group select-none animate-fadeIn"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer Banner Card with Rounded Border & Gradient Accent */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-950 shadow-xl shadow-slate-950/15 transition-all duration-300">
        
        {/* Height container with responsive fluid proportion (Optimized for widescreen infographics and flyers) */}
        <div className="relative w-full h-[220px] sm:h-[290px] md:h-[360px] lg:h-[420px] xl:h-[460px]">
          
          {/* Layered Cross-Fade Slides */}
          {activeSlides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            const hasTextContent = Boolean(
              slide.title?.trim() ||
              slide.subtitle?.trim() ||
              slide.eventDate?.trim() ||
              slide.eventTime?.trim() ||
              slide.eventLocation?.trim()
            );

            const isContainMode = slide.imageFit !== 'cover';

            const handleBannerClick = () => {
              if (!hasTextContent && slide.linkUrl) {
                window.open(slide.linkUrl, '_blank', 'noopener,noreferrer');
              }
            };

            return (
              <div
                key={slide.id || idx}
                onClick={handleBannerClick}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                } ${!hasTextContent && slide.linkUrl ? 'cursor-pointer' : ''}`}
                aria-hidden={!isActive}
              >
                {/* Background Image / Flyer */}
                {slide.imageUrl ? (
                  <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950 flex items-center justify-center">
                    {/* Ambient Glow Backdrop: Blurs edges so aspect ratio differences look seamless */}
                    {isContainMode && (
                      <img
                        src={normalizeImageUrl(slide.imageUrl)}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-110 pointer-events-none"
                      />
                    )}

                    {/* Crisp Foreground Flyer: Never Cropped (object-contain by default) */}
                    <img
                      src={normalizeImageUrl(slide.imageUrl)}
                      alt={slide.title || 'Banner Slide'}
                      className={`relative z-0 w-full h-full ${
                        isContainMode ? 'object-contain' : 'object-cover'
                      } object-center transition-transform duration-1000 ease-out ${
                        isActive ? 'scale-100' : 'scale-[1.02]'
                      }`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const altUrl = getAlternativeImageUrl(slide.imageUrl);
                        if (altUrl && target.src !== altUrl) {
                          target.src = altUrl;
                        } else {
                          target.style.display = 'none';
                        }
                      }}
                    />

                    {/* Dynamic Gradient Overlay: Only applied when text exists to maintain crisp poster visual */}
                    {hasTextContent ? (
                      <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-950/25 dark:from-slate-950/95 dark:via-slate-950/75 dark:to-slate-950/35 pointer-events-none" />
                    ) : null}
                  </div>
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950" />
                )}

                {/* Foreground Content Container */}
                <div className={`relative z-10 w-full h-full p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-between ${
                  !hasTextContent ? 'pointer-events-none' : ''
                }`}>
                  
                  {/* Top Bar: Badge (Only rendered if badge exists or admin button) */}
                  <div className="flex items-center justify-between gap-3 pointer-events-auto">
                    <div className="flex items-center gap-2">
                      {slide.badge && (
                        <span className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-black tracking-wider uppercase bg-amber-400 text-slate-950 shadow-md ring-1 ring-amber-400/50">
                          <Sparkles className="w-3.5 h-3.5" />
                          {slide.badge}
                        </span>
                      )}
                    </div>

                    {/* Admin Quick Edit Button */}
                    {isAdmin && onOpenAdminSlideShow && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAdminSlideShow();
                        }}
                        className="text-[11px] sm:text-xs font-bold text-amber-300 hover:text-amber-200 bg-slate-950/80 hover:bg-slate-900/95 px-3 py-1.5 rounded-full border border-amber-400/40 backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                        title="Kelola Slide Show di Admin Panel"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Edit Slide</span>
                      </button>
                    )}
                  </div>

                  {/* Middle: Title, Subtitle, & Event Information (Rendered when text is provided) */}
                  {hasTextContent && (
                    <div className="my-auto max-w-4xl space-y-2 sm:space-y-3 text-left">
                      {slide.title && (
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white tracking-tight drop-shadow-lg leading-tight">
                          {slide.title}
                        </h2>
                      )}

                      {slide.subtitle && (
                        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-200/90 font-medium leading-relaxed drop-shadow max-w-3xl line-clamp-3">
                          {slide.subtitle}
                        </p>
                      )}

                      {/* Event Metadata (Date, Time, Location / Zoom) */}
                      {(slide.eventDate || slide.eventTime || slide.eventLocation) && (
                        <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs sm:text-sm text-slate-200 font-semibold">
                          {slide.eventDate && (
                            <div className="inline-flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
                              <Calendar className="w-3.5 h-3.5 text-amber-400" />
                              <span>{slide.eventDate}</span>
                            </div>
                          )}

                          {slide.eventTime && (
                            <div className="inline-flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
                              <Clock className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{slide.eventTime}</span>
                            </div>
                          )}

                          {slide.eventLocation && (
                            <div className="inline-flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
                              <Video className="w-3.5 h-3.5 text-blue-400" />
                              <span className="truncate max-w-[220px] sm:max-w-xs md:max-w-sm">{slide.eventLocation}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom Bar: Action Button */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <div>
                      {slide.linkUrl && hasTextContent && (
                        <a
                          href={slide.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span>{slide.linkLabel || 'Buka Informasi'}</span>
                          <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                        </a>
                      )}
                    </div>
                    <div />
                  </div>

                </div>
              </div>
            );
          })}

          {/* Navigation Dots Indicator (Minimalist & Smooth, only shown if > 1 slide) */}
          {activeSlides.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-lg">
              {activeSlides.map((slide, idx) => (
                <button
                  key={slide.id || idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 cursor-pointer ${
                    currentIndex === idx
                      ? 'w-6 sm:w-7 bg-amber-400 shadow-xs shadow-amber-400/50'
                      : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Pindah ke slide ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Left Arrow Navigation Button */}
          {activeSlides.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-950/60 hover:bg-slate-900/90 text-white flex items-center justify-center backdrop-blur-md border border-white/15 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 duration-200"
              aria-label="Slide Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          {/* Right Arrow Navigation Button */}
          {activeSlides.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-950/60 hover:bg-slate-900/90 text-white flex items-center justify-center backdrop-blur-md border border-white/15 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 duration-200"
              aria-label="Slide Selanjutnya"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
