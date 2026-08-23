import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  ZoomIn, 
  ZoomOut, 
  Droplet, 
  Sun, 
  EyeOff, 
  AlignLeft, 
  AlignCenter, 
  AlignJustify, 
  Type, 
  MoveHorizontal, 
  Hourglass, 
  MousePointer, 
  Underline, 
  Info, 
  RotateCcw, 
  Settings, 
  X, 
  Check, 
  ChevronRight, 
  Globe, 
  Sparkles, 
  ShieldCheck, 
  Glasses, 
  BookOpen, 
  Compass, 
  HelpCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { 
  AccessibilitySettings, 
  DEFAULT_ACCESSIBILITY_SETTINGS, 
  AccessibilityProfile, 
  TextAlignment, 
  SaturationMode, 
  ContrastMode, 
  WidgetPosition 
} from '../types/accessibility';
import { 
  loadAccessibilitySettings, 
  saveAccessibilitySettings, 
  applyAccessibilityToDOM, 
  speakText, 
  stopSpeech, 
  applyProfilePreset 
} from '../utils/accessibilityManager';
import { useToast } from './ToastNotification';

export const AccessibilityWidget: React.FC = () => {
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(() => loadAccessibilitySettings());
  const [isHoverSpeaking, setIsHoverSpeaking] = useState<boolean>(false);
  const [showPositionMenu, setShowPositionMenu] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ y: number }>({ y: 0 });

  const panelRef = useRef<HTMLDivElement>(null);

  // Apply on mount
  useEffect(() => {
    applyAccessibilityToDOM(settings);
  }, []);

  // Sync settings helper
  const updateSettings = (partial: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    saveAccessibilitySettings(updated);
  };

  // Keyboard shortcut: Ctrl + U or Cmd + U
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        setIsOpen(prev => {
          const next = !prev;
          if (next) {
            speakText('Menu Aksesibilitas KPPN Semarang I dibuka.');
          }
          return next;
        });
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Reading Guide Ruler Mouse Movement Listener
  useEffect(() => {
    if (!settings.readingGuide) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [settings.readingGuide]);

  // Hover Speech Reader when screenReaderVoice is active
  useEffect(() => {
    if (!settings.screenReaderVoice) return;

    let timeoutId: any = null;
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest('.a11y-widget-container')) return;

      const text = target.innerText || target.getAttribute('aria-label') || target.getAttribute('title') || target.getAttribute('alt');
      if (text && text.length > 2 && text.length < 300) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setIsHoverSpeaking(true);
          speakText(text, settings.speechRate);
        }, 350);
      }
    };

    const handleMouseOut = () => {
      clearTimeout(timeoutId);
      setIsHoverSpeaking(false);
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [settings.screenReaderVoice, settings.speechRate]);

  // Reset all
  const handleResetAll = () => {
    const fresh = { ...DEFAULT_ACCESSIBILITY_SETTINGS, widgetPosition: settings.widgetPosition };
    setSettings(fresh);
    saveAccessibilitySettings(fresh);
    stopSpeech();
    addToast({
      type: 'info',
      title: 'Aksesibilitas Direset',
      message: 'Semua pengaturan visual dan kenyamanan dikembalikan ke standar normal.'
    });
  };

  // Font Size Handlers
  const handleIncreaseFont = () => {
    const next = Math.min(150, settings.fontSizePercent + 10);
    updateSettings({ fontSizePercent: next });
    speakText(`Ukuran teks ${next} persen`);
  };

  const handleDecreaseFont = () => {
    const next = Math.max(90, settings.fontSizePercent - 10);
    updateSettings({ fontSizePercent: next });
    speakText(`Ukuran teks ${next} persen`);
  };

  // Profile Presets
  const handleSelectProfile = (profile: AccessibilityProfile) => {
    const updated = applyProfilePreset(profile, settings);
    setSettings(updated);
    saveAccessibilitySettings(updated);
    setShowProfileMenu(false);
    
    const profileNames: Record<AccessibilityProfile, string> = {
      none: 'Profil Standar',
      vision: 'Profil Penglihatan Rendah (Low Vision)',
      dyslexia: 'Profil Ramah Disleksia',
      focus: 'Profil Ramah Fokus & ADHD',
      sensitivity: 'Profil Sensitif Cahaya',
      motor: 'Profil Keterbatasan Motorik'
    };

    addToast({
      type: 'success',
      title: 'Profil Diaktifkan',
      message: `${profileNames[profile]} berhasil diterapkan ke seluruh antarmuka.`
    });
    speakText(profileNames[profile]);
  };

  // Position Class for Floating Trigger Button
  const getPositionClasses = () => {
    switch (settings.widgetPosition) {
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'top-left':
        return 'top-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'bottom-left':
      default:
        return 'bottom-6 left-6';
    }
  };

  // Tile 1: Sound / Screen Reader
  const toggleScreenReader = () => {
    const next = !settings.screenReaderVoice;
    updateSettings({ screenReaderVoice: next });
    if (next) {
      speakText('Moda suara pembaca layar aktif. Arahkan kursor ke tulisan mana saja untuk mendengarkan.');
    } else {
      stopSpeech();
    }
  };

  // Tile 4: Saturation Cycle
  const cycleSaturation = () => {
    const modes: SaturationMode[] = ['default', 'grayscale', 'high-contrast', 'low-saturation', 'invert'];
    const currentIdx = modes.indexOf(settings.saturation);
    const next = modes[(currentIdx + 1) % modes.length];
    updateSettings({ saturation: next });
  };

  // Tile 5: Contrast Cycle
  const cycleContrast = () => {
    const modes: ContrastMode[] = ['default', 'high-dark', 'high-light', 'monochrome'];
    const currentIdx = modes.indexOf(settings.contrast);
    const next = modes[(currentIdx + 1) % modes.length];
    updateSettings({ contrast: next });
  };

  // Tile 7: Text Alignment Cycle
  const cycleTextAlign = () => {
    const alignments: TextAlignment[] = ['default', 'left', 'center', 'justify', 'right'];
    const currentIdx = alignments.indexOf(settings.textAlign);
    const next = alignments[(currentIdx + 1) % alignments.length];
    updateSettings({ textAlign: next });
  };

  // Tile 9: Line Height Cycle
  const cycleLineHeight = () => {
    const heights: ('default' | 'relaxed' | 'loose')[] = ['default', 'relaxed', 'loose'];
    const currentIdx = heights.indexOf(settings.lineHeight);
    const next = heights[(currentIdx + 1) % heights.length];
    updateSettings({ lineHeight: next });
  };

  // Tile 12: Letter Spacing Cycle
  const cycleLetterSpacing = () => {
    const spacings: ('default' | 'wide' | 'extra-wide')[] = ['default', 'wide', 'extra-wide'];
    const currentIdx = spacings.indexOf(settings.letterSpacing);
    const next = spacings[(currentIdx + 1) % spacings.length];
    updateSettings({ letterSpacing: next });
  };

  // Active Count
  const countActiveModifiers = () => {
    let count = 0;
    if (settings.fontSizePercent !== 100) count++;
    if (settings.dyslexiaFont) count++;
    if (settings.textAlign !== 'default') count++;
    if (settings.lineHeight !== 'default') count++;
    if (settings.letterSpacing !== 'default') count++;
    if (settings.saturation !== 'default') count++;
    if (settings.contrast !== 'default') count++;
    if (settings.hideImages) count++;
    if (settings.underlineLinks) count++;
    if (settings.highlightHeadings) count++;
    if (settings.pauseAnimations) count++;
    if (settings.bigCursor) count++;
    if (settings.readingGuide) count++;
    if (settings.screenReaderVoice) count++;
    return count;
  };

  const activeCount = countActiveModifiers();

  return (
    <div className="a11y-widget-container font-sans">
      {/* 1. FLOATING READING GUIDE RULER (Follows Cursor when active) */}
      {settings.readingGuide && (
        <div 
          className="fixed left-0 right-0 pointer-events-none z-[99998] transition-transform duration-75"
          style={{ top: `${mousePos.y}px` }}
        >
          <div className="h-10 bg-amber-400/20 border-y-2 border-amber-500 shadow-lg shadow-amber-500/20 backdrop-invert-0 flex items-center justify-end px-4">
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase shadow-xs">
              📖 Penggaris Baca Aktif
            </span>
          </div>
        </div>
      )}

      {/* 2. FLOATING TRIGGER BUTTON (PULSING WHEELCHAIR/ACCESSIBILITY ICON) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Buka Menu Aksesibilitas (CTRL+U)"
        title="Menu Aksesibilitas (Tekan CTRL + U)"
        className={`fixed z-[99990] ${getPositionClasses()} group flex items-center gap-2.5 p-3 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 text-white shadow-2xl shadow-blue-500/40 hover:scale-110 hover:shadow-blue-500/60 active:scale-95 transition-all duration-300 border-2 border-white/80 cursor-pointer`}
      >
        {/* Universal Accessibility Icon */}
        <div className="w-8 h-8 flex items-center justify-center relative">
          <svg 
            className="w-7 h-7 fill-current drop-shadow-md group-hover:rotate-12 transition-transform duration-300" 
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="4" r="2" />
            <path d="M19 13v-2c-1.54.02-3.09-.75-4.07-1.83l-1.29-1.43c-.17-.19-.38-.34-.61-.45-.01 0-.01-.01-.02-.01H13c-.35-.2-.75-.3-1.19-.26-.74.07-1.39.52-1.68 1.18L8.6 13.92C8.36 14.47 8.5 15.11 8.96 15.5l1.6 1.34V22h2v-4.5l-1.35-1.12.98-3.07c.88.89 2.05 1.54 3.37 1.68V22h2v-7.07c.84-.13 1.63-.51 2.27-1.09.11-.1.19-.21.26-.33.24-.37.37-.81.37-1.26v-.25z"/>
          </svg>

          {/* Active indicator dot */}
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-white animate-bounce">
              {activeCount}
            </span>
          )}
        </div>

        {/* Hover Label with Shortcut */}
        <div className="hidden group-hover:flex items-center gap-1.5 pr-2 text-xs font-black tracking-wide whitespace-nowrap animate-fadeIn">
          <span>Aksesibilitas</span>
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono">
            Ctrl+U
          </span>
        </div>
      </button>

      {/* 3. MODAL DRAWER SLIDE-OVER (ACCESSIBILITY MENU) */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex justify-start animate-fadeIn">
          {/* Backdrop */}
          <div 
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Side Drawer Content */}
          <div 
            ref={panelRef}
            className="relative z-10 w-full max-w-[360px] sm:max-w-[400px] h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xl flex flex-col justify-between overflow-y-auto border-r border-slate-200 dark:border-slate-800 animate-slideRight"
          >
            {/* TOP HEADER (Solid Blue Gradient matching screenshot) */}
            <div className="p-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-xl">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <circle cx="12" cy="4" r="2" />
                    <path d="M19 13v-2c-1.54.02-3.09-.75-4.07-1.83l-1.29-1.43c-.17-.19-.38-.34-.61-.45-.01 0-.01-.01-.02-.01H13c-.35-.2-.75-.3-1.19-.26-.74.07-1.39.52-1.68 1.18L8.6 13.92C8.36 14.47 8.5 15.11 8.96 15.5l1.6 1.34V22h2v-4.5l-1.35-1.12.98-3.07c.88.89 2.05 1.54 3.37 1.68V22h2v-7.07c.84-.13 1.63-.51 2.27-1.09.11-.1.19-.21.26-.33.24-.37.37-.81.37-1.26v-.25z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                    Menu Aksesibilitas
                    <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                      CTRL+U
                    </span>
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup Menu (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TOP DROPDOWNS BAR */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50 dark:bg-slate-800/40">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowLangMenu(!showLangMenu);
                    setShowProfileMenu(false);
                    setShowPositionMenu(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-xs hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Bahasa Indonesia (Aktif)</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showLangMenu ? 'rotate-90' : ''}`} />
                </button>

                {showLangMenu && (
                  <div className="mt-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl space-y-1 text-xs font-medium animate-fadeIn">
                    <button 
                      onClick={() => setShowLangMenu(false)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-between"
                    >
                      <span>🇮🇩 Bahasa Indonesia (Resmi KPPN)</span>
                      <Check className="w-4 h-4 text-blue-600" />
                    </button>
                    <button 
                      onClick={() => {
                        setShowLangMenu(false);
                        addToast({ type: 'info', title: 'English Mode', message: 'English accessibility hints active.' });
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-between"
                    >
                      <span>🇬🇧 English (International)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Accessibility Profile Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowLangMenu(false);
                    setShowPositionMenu(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-xs hover:border-blue-500 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Profil Aksesibilitas Cepat</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-90' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className="mt-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl space-y-1 text-xs animate-fadeIn">
                    {[
                      { id: 'none', label: 'Standar / Normal', icon: ShieldCheck },
                      { id: 'vision', label: 'Disabilitas Netra / Low Vision', icon: Glasses },
                      { id: 'dyslexia', label: 'Ramah Disleksia (Font Khusus)', icon: BookOpen },
                      { id: 'focus', label: 'Ramah Fokus & ADHD', icon: Compass },
                      { id: 'sensitivity', label: 'Sensitif Cahaya / Fotofobia', icon: Sun },
                      { id: 'motor', label: 'Keterbatasan Motorik', icon: MousePointer }
                    ].map((prof) => {
                      const Icon = prof.icon;
                      const isSelected = settings.profile === prof.id;
                      return (
                        <button
                          key={prof.id}
                          onClick={() => handleSelectProfile(prof.id as AccessibilityProfile)}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-blue-600 text-white font-bold' 
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{prof.label}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* MAIN 14 INTERACTIVE TILES GRID (Matching Screenshot) */}
            <div className="p-3 grid grid-cols-3 gap-2 flex-1">
              {/* TILE 1: MODA SUARA */}
              <button
                type="button"
                onClick={toggleScreenReader}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs ${
                  settings.screenReaderVoice 
                    ? 'bg-blue-600 text-white border-blue-500 font-bold ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {settings.screenReaderVoice ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6 text-slate-500 dark:text-slate-400" />}
                </div>
                <span className="text-[11px] font-bold leading-tight">Moda Suara</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.screenReaderVoice ? 'AKTIF' : 'Mati'}
                </span>
              </button>

              {/* TILE 2: PERBESAR TEKS */}
              <button
                type="button"
                onClick={handleIncreaseFont}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs ${
                  settings.fontSizePercent > 100 
                    ? 'bg-blue-600 text-white border-blue-500 font-bold ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center font-black text-xl">
                  T<span className="text-base">T</span>
                </div>
                <span className="text-[11px] font-bold leading-tight">Perbesar Teks</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.fontSizePercent}%
                </span>
              </button>

              {/* TILE 3: PERKECIL TEKS */}
              <button
                type="button"
                onClick={handleDecreaseFont}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs ${
                  settings.fontSizePercent < 100 
                    ? 'bg-blue-600 text-white border-blue-500 font-bold ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center font-black text-sm">
                  t<span className="text-xs">t</span>
                </div>
                <span className="text-[11px] font-bold leading-tight">Perkecil Teks</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.fontSizePercent}%
                </span>
              </button>

              {/* TILE 4: KEJENUHAN (SATURASI) */}
              <button
                type="button"
                onClick={cycleSaturation}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs ${
                  settings.saturation !== 'default' 
                    ? 'bg-blue-600 text-white border-blue-500 font-bold ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <Droplet className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold leading-tight">Kejenuhan</span>
                <span className="text-[9px] opacity-75 capitalize font-mono truncate w-full text-center">
                  {settings.saturation === 'default' ? 'Normal' : settings.saturation}
                </span>
              </button>

              {/* TILE 5: KONTRAS+ */}
              <button
                type="button"
                onClick={cycleContrast}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs ${
                  settings.contrast !== 'default' 
                    ? 'bg-blue-600 text-white border-blue-500 font-bold ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <Sun className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold leading-tight">Kontras+</span>
                <span className="text-[9px] opacity-75 capitalize font-mono truncate w-full text-center">
                  {settings.contrast === 'default' ? 'Normal' : settings.contrast.replace('high-', '')}
                </span>
              </button>

              {/* TILE 6: SEMBUNYIKAN GAMBAR */}
              <button
                type="button"
                onClick={() => updateSettings({ hideImages: !settings.hideImages })}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs ${
                  settings.hideImages 
                    ? 'bg-blue-600 text-white border-blue-500 font-bold ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <EyeOff className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold leading-tight">Sembunyikan Gambar</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.hideImages ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* TILE 7: RATA TULISAN */}
              <button
                type="button"
                onClick={cycleTextAlign}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs ${
                  settings.textAlign !== 'default' 
                    ? 'bg-blue-600 text-white border-blue-500 font-bold ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {settings.textAlign === 'center' ? <AlignCenter className="w-6 h-6" /> : 
                   settings.textAlign === 'justify' ? <AlignJustify className="w-6 h-6" /> : 
                   <AlignLeft className="w-6 h-6" />}
                </div>
                <span className="text-[11px] font-bold leading-tight">Rata Tulisan</span>
                <span className="text-[9px] opacity-75 capitalize font-mono">
                  {settings.textAlign === 'default' ? 'Standar' : settings.textAlign}
                </span>
              </button>

              {/* TILE 8: RAMAH DISLEKSIA */}
              <button
                type="button"
                onClick={() => updateSettings({ dyslexiaFont: !settings.dyslexiaFont })}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs ${
                  settings.dyslexiaFont 
                    ? 'bg-blue-600 text-white border-blue-500 font-bold ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center font-black text-xl font-serif">
                  Df
                </div>
                <span className="text-[11px] font-bold leading-tight">Ramah Disleksia</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.dyslexiaFont ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* TILE 9: TINGGI GARIS */}
              <button
                type="button"
                onClick={cycleLineHeight}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs ${
                  settings.lineHeight !== 'default' 
                    ? 'bg-blue-600 text-white border-blue-500 font-bold ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center font-black">
                  ≡
                </div>
                <span className="text-[11px] font-bold leading-tight">Tinggi Garis</span>
                <span className="text-[9px] opacity-75 capitalize font-mono">
                  {settings.lineHeight}
                </span>
              </button>

              {/* TILE 10: ANIMASI DIJEDA */}
              <button
                type="button"
                onClick={() => updateSettings({ pauseAnimations: !settings.pauseAnimations })}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs ${
                  settings.pauseAnimations 
                    ? 'bg-blue-600 text-white border-blue-500 font-bold ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <Hourglass className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold leading-tight">Animasi Dijeda</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.pauseAnimations ? 'JEDA' : 'Jalan'}
                </span>
              </button>

              {/* TILE 11: KURSOR BESAR & PENGGARIS BACA */}
              <button
                type="button"
                onClick={() => {
                  const nextCursor = !settings.bigCursor;
                  updateSettings({ bigCursor: nextCursor, readingGuide: nextCursor });
                }}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs ${
                  settings.bigCursor 
                    ? 'bg-blue-600 text-white border-blue-500 font-bold ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <MousePointer className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold leading-tight">Kursor Besar</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.bigCursor ? 'BESAR' : 'Standar'}
                </span>
              </button>

              {/* TILE 12: SPASI TEKS */}
              <button
                type="button"
                onClick={cycleLetterSpacing}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs ${
                  settings.letterSpacing !== 'default' 
                    ? 'bg-blue-600 text-white border-blue-500 font-bold ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <MoveHorizontal className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold leading-tight">Spasi Teks</span>
                <span className="text-[9px] opacity-75 capitalize font-mono">
                  {settings.letterSpacing}
                </span>
              </button>

              {/* TILE 13: GARIS BAWAHI TAUTAN */}
              <button
                type="button"
                onClick={() => updateSettings({ underlineLinks: !settings.underlineLinks })}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs ${
                  settings.underlineLinks 
                    ? 'bg-blue-600 text-white border-blue-500 font-bold ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <Underline className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold leading-tight">Garis Bawahi</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.underlineLinks ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* TILE 14: KETERANGAN ALAT & JUDUL */}
              <button
                type="button"
                onClick={() => updateSettings({ highlightHeadings: !settings.highlightHeadings })}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs ${
                  settings.highlightHeadings 
                    ? 'bg-blue-600 text-white border-blue-500 font-bold ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <Info className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold leading-tight">Sorot Judul</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.highlightHeadings ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* TILE 15: PENGGARIS BACA TOGGLE */}
              <button
                type="button"
                onClick={() => updateSettings({ readingGuide: !settings.readingGuide })}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer shadow-xs ${
                  settings.readingGuide 
                    ? 'bg-blue-600 text-white border-blue-500 font-bold ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center font-black">
                  📖
                </div>
                <span className="text-[11px] font-bold leading-tight">Penggaris Baca</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.readingGuide ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* ACTION & CONTROLS FOOTER */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50 dark:bg-slate-900 shrink-0">
              {/* Reset All Button */}
              <button
                type="button"
                onClick={handleResetAll}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Atur Ulang Semua Pengaturan Aksesibilitas</span>
              </button>

              {/* Move Widget Menu */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowPositionMenu(!showPositionMenu)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <span>Pindahkan Posisi Widget</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showPositionMenu ? 'rotate-90' : ''}`} />
                </button>

                {showPositionMenu && (
                  <div className="mt-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm space-y-2 text-xs">
                    {[
                      { id: 'top-left', label: 'Ke Posisi Atas dan Kiri' },
                      { id: 'top-right', label: 'Ke Posisi Atas dan Kanan' },
                      { id: 'bottom-left', label: 'Ke Posisi Bawah dan Kiri (Default)' },
                      { id: 'bottom-right', label: 'Ke Posisi Bawah dan Kanan' }
                    ].map((pos) => {
                      const isChecked = settings.widgetPosition === pos.id;
                      return (
                        <label 
                          key={pos.id} 
                          className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <span className={isChecked ? 'font-black text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}>
                            {pos.label}
                          </span>
                          <input
                            type="radio"
                            name="widgetPos"
                            checked={isChecked}
                            onChange={() => updateSettings({ widgetPosition: pos.id as WidgetPosition })}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Version Tag */}
              <div className="pt-2 text-center text-[10px] text-slate-400 font-mono">
                - Widget Aksesibilitas KPPN Semarang I v2.5 -
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
