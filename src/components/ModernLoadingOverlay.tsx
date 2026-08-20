import React from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Cpu } from 'lucide-react';

interface ModernLoadingOverlayProps {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  progress?: number; // 0 to 100 optional
  isDark?: boolean;
  statusLogs?: string[];
}

export const ModernLoadingOverlay: React.FC<ModernLoadingOverlayProps> = ({
  isVisible,
  title = 'Memproses Data...',
  subtitle = 'Mohon tunggu sebentar, sistem sedang mengolah informasi.',
  progress,
  isDark = false,
  statusLogs = [],
}) => {
  if (!isVisible) return null;

  const content = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md rounded-3xl p-8 shadow-2xl border text-center overflow-hidden transition-all transform scale-100 ${
          isDark
            ? 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-slate-950/90'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/30'
        }`}
      >
        {/* Top ambient radial light */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Spinner Core */}
        <div className="relative flex items-center justify-center my-4">
          {/* Outer Pulsing Ring */}
          <div className="absolute w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/20 animate-ping opacity-75" />
          
          {/* Dual Rotating Orbit Rings */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-cyan-400 animate-spin" />
            <div className="absolute inset-1.5 rounded-full border-4 border-transparent border-b-purple-500 border-l-blue-500 animate-spin-reverse opacity-80" />
            
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-inner">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5 mt-4">
          <h3 className="text-xl font-black tracking-tight">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Progress Bar if numerical percentage provided */}
        {typeof progress === 'number' && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold px-1">
              <span className="text-slate-500 dark:text-slate-400">Progres Pengolahan</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-black">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700/80">
              <div
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full shadow-md transition-all duration-300"
              />
            </div>
          </div>
        )}

        {/* Log snippet preview if available */}
        {statusLogs.length > 0 && (
          <div className="mt-5 p-3 rounded-2xl bg-slate-950/80 text-emerald-400 text-[11px] font-mono text-left max-h-24 overflow-y-auto border border-slate-800 shadow-inner">
            {statusLogs.slice(-3).map((log, i) => (
              <div key={i} className="truncate opacity-90">
                {log}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
          <Cpu className="w-3.5 h-3.5 text-indigo-500" />
          <span>KPPN Semarang I System Engine</span>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
