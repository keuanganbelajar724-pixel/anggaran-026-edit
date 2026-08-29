import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
  LayoutGrid
} from 'lucide-react';
import { BuletinConfig } from '../../../types';
import { playPageFlipSound, playChimeSound } from '../../../utils/buletinSoundEffects';

interface BuletinPresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
  renderPageContent: (pageNum: number) => React.ReactNode;
  activePages: Array<{ num: number; title: string; section: string }>;
  initialPage?: number;
  soundEnabled?: boolean;
}

export const BuletinPresentationMode: React.FC<BuletinPresentationModeProps> = ({
  isOpen,
  onClose,
  renderPageContent,
  activePages,
  initialPage = 1,
  soundEnabled = true
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [slideIntervalSec, setSlideIntervalSec] = useState<number>(8);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [showThumbs, setShowThumbs] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(soundEnabled);

  const timerRef = useRef<any>(null);
  const progressTimerRef = useRef<any>(null);

  // Initialize page index
  useEffect(() => {
    if (isOpen) {
      const idx = activePages.findIndex(p => p.num === initialPage);
      setCurrentPageIndex(idx >= 0 ? idx : 0);
      setProgressPercent(0);
      setIsPlaying(true);
    }
  }, [isOpen, initialPage, activePages]);

  // Slideshow progress & auto advance
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    const intervalMs = slideIntervalSec * 1000;
    const stepMs = 50;
    const stepIncrement = (stepMs / intervalMs) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgressPercent(prev => {
        if (prev >= 100) {
          return 0;
        }
        return prev + stepIncrement;
      });
    }, stepMs);

    timerRef.current = setInterval(() => {
      setCurrentPageIndex(prev => {
        const next = (prev + 1) % activePages.length;
        playPageFlipSound(soundOn);
        return next;
      });
      setProgressPercent(0);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isOpen, isPlaying, slideIntervalSec, activePages.length, soundOn]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activePages.length]);

  const handleNext = () => {
    setCurrentPageIndex(prev => (prev + 1) % activePages.length);
    setProgressPercent(0);
    playPageFlipSound(soundOn);
  };

  const handlePrev = () => {
    setCurrentPageIndex(prev => (prev - 1 + activePages.length) % activePages.length);
    setProgressPercent(0);
    playPageFlipSound(soundOn);
  };

  if (!isOpen) return null;

  const currentPage = activePages[currentPageIndex] || activePages[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none overflow-hidden animate-in fade-in duration-300">
      {/* Top Countdown Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all ease-linear"
          style={{ width: `${isPlaying ? progressPercent : 0}%` }}
        />
      </div>

      {/* Top Control Bar */}
      <div className="px-6 py-3 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between text-white z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow">
            {currentPageIndex + 1}
          </div>
          <div>
            <h3 className="text-sm font-black text-white truncate max-w-md">
              {currentPage.title}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Rubrik: {currentPage.section} • Halaman {currentPageIndex + 1} dari {activePages.length}
            </span>
          </div>
        </div>

        {/* Center Player Controls */}
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Halaman Sebelumnya (Panah Kiri)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl font-bold transition-all ${
              isPlaying
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isPlaying ? 'Jeda Slideshow (Spasi)' : 'Mulai Putar Slideshow (Spasi)'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={handleNext}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Halaman Berikutnya (Panah Kanan)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Interval Selector */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <select
              value={slideIntervalSec}
              onChange={e => setSlideIntervalSec(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-amber-300 text-xs rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value={5}>5 detik</option>
              <option value={8}>8 detik</option>
              <option value={12}>12 detik</option>
              <option value={15}>15 detik</option>
              <option value={20}>20 detik</option>
            </select>
          </div>

          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`p-1.5 rounded-xl transition-colors ${
              soundOn ? 'text-amber-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
            }`}
            title={soundOn ? 'Suara Kertas Aktif' : 'Suara Kertas Mati'}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowThumbs(!showThumbs)}
            className={`p-1.5 rounded-xl transition-colors ${
              showThumbs ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            title="Buka / Tutup Daftar Slide"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Keluar (Esc)</span>
          </button>
        </div>
      </div>

      {/* Main Slide Stage */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
        {/* Previous button floating */}
        <button
          onClick={handlePrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700 shadow-2xl backdrop-blur-sm transition-all hover:scale-105"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Page Container */}
        <div className="h-full max-h-[88vh] aspect-[1/1.414] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800 relative animate-in fade-in zoom-in-95 duration-300 flex flex-col">
          <div className="flex-1 overflow-hidden relative">
            {renderPageContent(currentPage.num)}
          </div>
        </div>

        {/* Next button floating */}
        <button
          onClick={handleNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700 shadow-2xl backdrop-blur-sm transition-all hover:scale-105"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Optional Slide Thumbnails Drawer */}
      {showThumbs && (
        <div className="h-28 bg-slate-950 border-t border-slate-800 p-3 flex items-center gap-3 overflow-x-auto z-20">
          {activePages.map((page, idx) => (
            <div
              key={page.num}
              onClick={() => {
                setCurrentPageIndex(idx);
                setProgressPercent(0);
                playPageFlipSound(soundOn);
              }}
              className={`h-full aspect-[1/1.414] rounded-lg p-1.5 border flex flex-col justify-between cursor-pointer shrink-0 transition-all ${
                idx === currentPageIndex
                  ? 'bg-amber-400 text-slate-950 border-amber-400 scale-105 shadow-lg'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="font-mono text-[9px] font-black">
                Hal {(idx + 1).toString().padStart(2, '0')}
              </div>
              <div className="text-[8px] font-bold truncate leading-tight">
                {page.title}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
