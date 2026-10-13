import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  GripHorizontal,
  Info
} from 'lucide-react';

interface LLATRegulationDisclaimerWidgetProps {
  onOpenRejectedModal?: () => void;
  className?: string;
}

export const LLATRegulationDisclaimerWidget: React.FC<LLATRegulationDisclaimerWidgetProps> = ({
  className = ''
}) => {
  // Modes: 'expanded' | 'collapsed' | 'pill'
  const [displayMode, setDisplayMode] = useState<'expanded' | 'collapsed' | 'pill'>('expanded');
  const [mounted, setMounted] = useState<boolean>(false);

  // Position state for free dragging across the screen
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });

  useEffect(() => {
    setMounted(true);

    // Initial position centered at top
    if (typeof window !== 'undefined') {
      const width = Math.min(window.innerWidth * 0.94, 620);
      const initialLeft = Math.max(12, (window.innerWidth - width) / 2);
      setPos({ x: initialLeft, y: 16 });
    }

    try {
      const saved = sessionStorage.getItem('kppn_llat_disclaimer_mode');
      if (saved === 'pill' || saved === 'collapsed' || saved === 'expanded') {
        setDisplayMode(saved as any);
      }
    } catch {
      // ignore
    }

    const handleExpandWidget = () => {
      setDisplayMode('expanded');
    };

    window.addEventListener('kppn_expand_llat_disclaimer_widget', handleExpandWidget);
    return () => {
      window.removeEventListener('kppn_expand_llat_disclaimer_widget', handleExpandWidget);
    };
  }, []);

  // Drag listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      const widgetWidth = widgetRef.current?.offsetWidth || 300;
      const widgetHeight = widgetRef.current?.offsetHeight || 100;
      const maxX = Math.max(10, window.innerWidth - widgetWidth - 12);
      const maxY = Math.max(10, window.innerHeight - widgetHeight - 12);

      setPos({
        x: Math.max(10, Math.min(maxX, dragStartRef.current.initialX + dx)),
        y: Math.max(10, Math.min(maxY, dragStartRef.current.initialY + dy))
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.startX;
      const dy = touch.clientY - dragStartRef.current.startY;
      const widgetWidth = widgetRef.current?.offsetWidth || 300;
      const widgetHeight = widgetRef.current?.offsetHeight || 100;
      const maxX = Math.max(10, window.innerWidth - widgetWidth - 12);
      const maxY = Math.max(10, window.innerHeight - widgetHeight - 12);

      setPos({
        x: Math.max(10, Math.min(maxX, dragStartRef.current.initialX + dx)),
        y: Math.max(10, Math.min(maxY, dragStartRef.current.initialY + dy))
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const startDrag = (clientX: number, clientY: number, target: EventTarget | null) => {
    // Prevent dragging when clicking buttons
    if (target && (target as HTMLElement).closest('button')) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: pos?.x ?? Math.max(12, (window.innerWidth - 620) / 2),
      initialY: pos?.y ?? 16
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startDrag(e.clientX, e.clientY, e.target);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }
  };

  const handleSetMode = (mode: 'expanded' | 'collapsed' | 'pill') => {
    setDisplayMode(mode);
    try {
      sessionStorage.setItem('kppn_llat_disclaimer_mode', mode);
    } catch {
      // ignore
    }
  };

  const handleDismissToPill = () => {
    handleSetMode('pill');
  };

  if (!mounted) return null;

  // Mount directly to document.body so it stays fixed to viewport on scroll
  return createPortal(
    <>
      {/* Keyframe animations for real blinking and glowing border */}
      <style>{`
        @keyframes intenseBlink {
          0%, 100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.9)); }
          50% { opacity: 0.18; transform: scale(0.96); filter: drop-shadow(0 0 1px rgba(239, 68, 68, 0.2)); }
        }
        @keyframes borderPulseWarning {
          0%, 100% { border-color: rgba(245, 158, 11, 0.95); box-shadow: 0 8px 30px rgba(245, 158, 11, 0.4); }
          50% { border-color: rgba(239, 68, 68, 0.75); box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2); }
        }
        .animate-intense-blink {
          animation: intenseBlink 0.85s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-border-warning {
          animation: borderPulseWarning 1.2s ease-in-out infinite;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* FLOATING DRAGGABLE WIDGET (BISA DIGESER-GESER, KEDAP-KEDIP, TRANSPARAN)   */}
      {/* ========================================================================= */}
      <div 
        ref={widgetRef}
        style={{
          position: 'fixed',
          left: pos ? `${pos.x}px` : '50%',
          top: pos ? `${pos.y}px` : '16px',
          transform: pos ? 'none' : 'translateX(-50%)',
          width: 'min(94vw, 620px)',
          zIndex: 9999,
          touchAction: 'none'
        }}
        className={`pointer-events-auto transition-shadow select-none ${className} ${
          isDragging ? 'cursor-grabbing opacity-90 scale-[1.01]' : ''
        }`}
      >
        {/* MODE A: PILL / TOP BADGE (Ketika sudah ditutup, bisa digeser dan diklik untuk buka kembali) */}
        {displayMode === 'pill' && (
          <div 
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="flex justify-center cursor-grab active:cursor-grabbing animate-fade-in"
          >
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50/75 hover:bg-amber-100/90 dark:bg-slate-900/75 dark:hover:bg-slate-800/90 text-amber-950 dark:text-amber-200 font-black text-xs shadow-xl border-2 border-amber-400 dark:border-amber-500 backdrop-blur-md ring-2 ring-amber-400/50">
              {/* Kedap-kedip nyata */}
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-intense-blink shrink-0" />
              
              <button
                type="button"
                onClick={() => handleSetMode('expanded')}
                className="flex items-center gap-1.5 cursor-pointer hover:underline text-[11px] font-black"
                title="Buka kembali Pengingat PER-9/PB/2026"
              >
                <span>⚠️ Bukan Acuan Utama: Crosscheck PER-9/PB/2026</span>
                <span className="text-[9px] px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full font-black flex items-center gap-0.5 shadow-2xs">
                  Buka <ChevronDown className="w-3 h-3" />
                </span>
              </button>

              <div className="text-amber-600/70 dark:text-amber-400/70 text-[10px] pl-1 border-l border-amber-300 dark:border-amber-700">
                ✥ Geser
              </div>
            </div>
          </div>
        )}

        {/* MODE B: COLLAPSED BAR */}
        {displayMode === 'collapsed' && (
          <div 
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="bg-amber-50/65 dark:bg-slate-900/65 text-slate-800 dark:text-slate-100 backdrop-blur-xl border-2 border-amber-400/85 dark:border-amber-500/80 rounded-2xl shadow-2xl px-4 py-2.5 flex items-center justify-between gap-3 animate-fade-in animate-border-warning cursor-grab active:cursor-grabbing"
          >
            <div 
              className="flex items-center gap-2.5 flex-1 min-w-0"
              onClick={() => handleSetMode('expanded')}
            >
              <div className="w-3 h-3 rounded-full bg-amber-500 animate-intense-blink shrink-0" />
              <div className="truncate">
                <span className="text-xs font-black text-amber-950 dark:text-amber-200 block truncate">
                  Bukan Acuan Utama — Harap Selalu Crosscheck ke PER-9/PB/2026
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleSetMode('expanded')}
                className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded-lg text-[10px] font-black flex items-center gap-1 hover:bg-amber-300 transition-colors shadow-2xs cursor-pointer"
              >
                <span>Buka</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={handleDismissToPill}
                className="p-1 text-slate-600 hover:text-rose-600 dark:text-slate-300 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* MODE C: EXPANDED POPUP (BISA DIGESER-GESER, TRANSPARAN, KEDAP-KEDIP, TANPA JAM CUTOFF, HANYA 1 TOMBOL TUTUP) */}
        {displayMode === 'expanded' && (
          <div 
            className="bg-amber-50/60 dark:bg-slate-950/65 text-slate-800 dark:text-slate-100 backdrop-blur-xl border-2 border-amber-400/90 dark:border-amber-500/90 rounded-2xl shadow-2xl p-4 sm:p-4.5 space-y-3 animate-border-warning animate-fade-in ring-2 ring-amber-400/30"
          >
            {/* Top Draggable Handle Bar */}
            <div 
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="flex items-center justify-between text-[10px] font-bold text-amber-800/80 dark:text-amber-300/80 cursor-grab active:cursor-grabbing pb-1 -mt-1 border-b border-amber-300/30"
              title="Klik dan tahan untuk menggeser kotak ini ke mana saja di layar"
            >
              <div className="flex items-center gap-1">
                <GripHorizontal className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>✥ Tekan &amp; Geser Kotak Ini</span>
              </div>
              <span className="text-[9px] bg-amber-200/60 dark:bg-amber-900/40 px-2 py-0.5 rounded font-mono">
                Bisa digeser bebas
              </span>
            </div>

            {/* Header: Kedap-Kedip Jelas & To The Point */}
            <div 
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="flex items-start justify-between gap-3 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-start gap-2.5">
                {/* Lampu Kedap-Kedip Berkedip */}
                <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-sm animate-intense-blink">
                    <AlertTriangle className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Badge Berkedip Terus */}
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs animate-intense-blink flex items-center gap-1">
                      ⚠️ PERHATIAN
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100/90 dark:bg-blue-950/90 text-blue-900 dark:text-blue-200 text-[10px] font-black border border-blue-400/40">
                      PER-9/PB/2026
                    </span>
                  </div>

                  {/* Kalimat To The Point */}
                  <h3 className="text-sm font-black text-amber-950 dark:text-amber-100 mt-1 leading-snug tracking-tight">
                    BUKAN SEBAGAI ACUAN UTAMA — HARAP SELALU CROSSCHECK KEBENARAN
                  </h3>
                </div>
              </div>

              {/* Close & Fold buttons */}
              <div className="flex items-center gap-1 shrink-0 -mr-1">
                <button
                  type="button"
                  onClick={() => handleSetMode('collapsed')}
                  className="p-1 text-slate-600 hover:text-slate-950 dark:text-slate-300 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Lipat baris"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDismissToPill}
                  className="p-1 text-slate-600 hover:text-rose-600 dark:text-slate-300 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Tutup (dapat dibuka kembali kapan saja)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Isi Pesan: To The Point, Tanpa Mention Cutoff Jam 15 atau Jam 17 */}
            <div className="p-3 rounded-xl bg-amber-500/15 dark:bg-amber-400/10 border border-amber-400/50 space-y-1.5 text-xs">
              <p className="font-extrabold text-amber-950 dark:text-amber-200 text-[13px] leading-snug">
                Kalender ini hanya instrumen simulasi &amp; visualisasi internal.
              </p>
              <p className="text-slate-800 dark:text-slate-200 text-[11px] leading-relaxed">
                Seluruh batas waktu pengajuan SPM, pendaftaran kontrak, dan ketentuan tolakan <strong>wajib selalu dikonfirmasi &amp; dicek ke naskah resmi PER-9/PB/2026</strong>.
              </p>
            </div>

            {/* Petunjuk Singkat */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-700 dark:text-slate-300 font-medium px-1">
              <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Instruksi: Silakan klik tombol di bawah atau tanda [✕] jika sudah membaca.</span>
            </div>

            {/* Action Bar: CUKUP SATU TOMBOL 'TUTUP JIKA SUDAH DIBACA' SAJA (Tanpa panduan pasal atau matriks tolakan) */}
            <div className="pt-1.5 border-t border-amber-400/30">
              <button
                type="button"
                onClick={handleDismissToPill}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                title="Tutup pesan ini agar leluasa melihat kalender"
              >
                <X className="w-4 h-4 stroke-[3]" />
                <span className="tracking-wide">Tutup jika sudah dibaca</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
};

/**
 * Top Notice Banner Component (kept minimal so no extra clutter)
 */
export const LLATHeaderNoticeBanner: React.FC<{
  onOpenDetails?: () => void;
}> = () => {
  return null;
};
