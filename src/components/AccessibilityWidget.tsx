import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Droplet, 
  Sun, 
  EyeOff, 
  AlignLeft, 
  AlignCenter, 
  AlignJustify, 
  AlignRight,
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
} from 'lucide-react';
import { 
  AccessibilitySettings, 
  DEFAULT_ACCESSIBILITY_SETTINGS, 
  AccessibilityProfile, 
  AccessibilityLanguage,
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

const I18N = {
  id: {
    menuTitle: 'Menu Aksesibilitas',
    langActive: 'Bahasa Indonesia (Aktif)',
    langId: '🇮🇩 Bahasa Indonesia (Resmi KPPN)',
    langEn: '🇬🇧 English (International)',
    profileTitle: 'Profil Aksesibilitas Cepat',
    profiles: {
      none: 'Standar / Normal',
      vision: 'Disabilitas Netra / Low Vision',
      dyslexia: 'Ramah Disleksia (Font Khusus)',
      focus: 'Ramah Fokus & ADHD',
      sensitivity: 'Sensitif Cahaya / Fotofobia',
      motor: 'Keterbatasan Motorik'
    },
    tiles: {
      screenReader: 'Moda Suara',
      increaseFont: 'Perbesar Teks',
      decreaseFont: 'Perkecil Teks',
      saturation: 'Kejenuhan',
      contrast: 'Kontras+',
      hideImages: 'Sembunyikan Gambar',
      textAlign: 'Rata Tulisan',
      dyslexia: 'Ramah Disleksia',
      lineHeight: 'Tinggi Garis',
      pauseAnimations: 'Animasi Dijeda',
      bigCursor: 'Kursor Besar',
      letterSpacing: 'Spasi Teks',
      underlineLinks: 'Garis Bawahi',
      highlightHeadings: 'Sorot Judul',
      readingGuide: 'Penggaris Baca'
    },
    states: {
      on: 'ON',
      off: 'OFF',
      active: 'AKTIF',
      inactive: 'Mati',
      paused: 'JEDA',
      playing: 'Jalan',
      big: 'BESAR',
      standard: 'Standar',
      normal: 'Normal',
      relaxed: 'Renggang',
      loose: 'Luas',
      wide: 'Lebar',
      extraWide: 'Ekstra Lebar',
      left: 'Kiri',
      center: 'Tengah',
      justify: 'Rata Tengah-Kiri',
      right: 'Kanan'
    },
    footer: {
      resetBtn: 'Atur Ulang Semua Pengaturan Aksesibilitas',
      movePosition: 'Pindahkan Posisi Widget',
      positions: {
        'top-left': 'Ke Posisi Atas dan Kiri',
        'top-right': 'Ke Posisi Atas dan Kanan',
        'bottom-left': 'Ke Posisi Bawah dan Kiri (Default)',
        'bottom-right': 'Ke Posisi Bawah dan Kanan'
      },
      tag: '- Widget Aksesibilitas KPPN Semarang I v2.5 -'
    },
    readingGuideBanner: '📖 Penggaris Baca Aktif',
    widgetTrigger: 'Aksesibilitas',
    toast: {
      resetTitle: 'Aksesibilitas Direset',
      resetMsg: 'Semua pengaturan visual dan kenyamanan dikembalikan ke standar normal.',
      profileTitle: 'Profil Diaktifkan',
      profileMsg: 'berhasil diterapkan ke seluruh antarmuka.',
      langSwitchedTitle: 'Bahasa Diubah',
      langSwitchedMsg: 'Antarmuka aksesibilitas beralih ke Bahasa Indonesia.'
    },
    speech: {
      opened: 'Menu Aksesibilitas KPPN Semarang I dibuka.',
      soundModeOn: 'Moda suara pembaca layar aktif. Arahkan kursor ke tulisan mana saja untuk mendengarkan.',
      textSize: (p: number) => `Ukuran teks ${p} persen`
    }
  },
  en: {
    menuTitle: 'Accessibility Menu',
    langActive: 'English (Active)',
    langId: '🇮🇩 Bahasa Indonesia (Official)',
    langEn: '🇬🇧 English (International)',
    profileTitle: 'Quick Accessibility Profiles',
    profiles: {
      none: 'Standard / Normal',
      vision: 'Low Vision / Impairment',
      dyslexia: 'Dyslexia Friendly (Special Font)',
      focus: 'Focus & ADHD Friendly',
      sensitivity: 'Light Sensitivity / Photophobia',
      motor: 'Motor Skills Support'
    },
    tiles: {
      screenReader: 'Screen Reader',
      increaseFont: 'Increase Text',
      decreaseFont: 'Decrease Text',
      saturation: 'Saturation',
      contrast: 'Contrast+',
      hideImages: 'Hide Images',
      textAlign: 'Text Align',
      dyslexia: 'Dyslexia Font',
      lineHeight: 'Line Height',
      pauseAnimations: 'Pause Animations',
      bigCursor: 'Big Cursor',
      letterSpacing: 'Text Spacing',
      underlineLinks: 'Underline Links',
      highlightHeadings: 'Highlight Titles',
      readingGuide: 'Reading Guide'
    },
    states: {
      on: 'ON',
      off: 'OFF',
      active: 'ACTIVE',
      inactive: 'Off',
      paused: 'PAUSED',
      playing: 'Playing',
      big: 'BIG',
      standard: 'Standard',
      normal: 'Normal',
      relaxed: 'Relaxed',
      loose: 'Loose',
      wide: 'Wide',
      extraWide: 'Extra Wide',
      left: 'Left',
      center: 'Center',
      justify: 'Justify',
      right: 'Right'
    },
    footer: {
      resetBtn: 'Reset All Accessibility Settings',
      movePosition: 'Change Widget Position',
      positions: {
        'top-left': 'Move to Top-Left Position',
        'top-right': 'Move to Top-Right Position',
        'bottom-left': 'Move to Bottom-Left Position (Default)',
        'bottom-right': 'Move to Bottom-Right Position'
      },
      tag: '- KPPN Semarang I Accessibility Widget v2.5 -'
    },
    readingGuideBanner: '📖 Reading Guide Active',
    widgetTrigger: 'Accessibility',
    toast: {
      resetTitle: 'Accessibility Reset',
      resetMsg: 'All visual and comfort settings have been restored to default standard.',
      profileTitle: 'Profile Activated',
      profileMsg: 'has been successfully applied to the interface.',
      langSwitchedTitle: 'Language Changed',
      langSwitchedMsg: 'Accessibility interface is now set to English.'
    },
    speech: {
      opened: 'Accessibility Menu opened.',
      soundModeOn: 'Screen reader voice mode active. Hover over any text to listen.',
      textSize: (p: number) => `Text size ${p} percent`
    }
  }
};

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

  const lang = settings.language || 'id';
  const t = I18N[lang] || I18N.id;

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

  // Switch Language
  const handleSelectLanguage = (newLang: AccessibilityLanguage) => {
    updateSettings({ language: newLang });
    setShowLangMenu(false);
    
    const targetT = I18N[newLang];
    addToast({
      type: 'success',
      title: targetT.toast.langSwitchedTitle,
      message: targetT.toast.langSwitchedMsg
    });
    speakText(newLang === 'en' ? 'English activated' : 'Bahasa Indonesia diaktifkan', settings.speechRate, newLang);
  };

  // Keyboard shortcut: Ctrl + U or Cmd + U
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        setIsOpen(prev => {
          const next = !prev;
          if (next) {
            speakText(t.speech.opened, settings.speechRate, lang);
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
  }, [isOpen, lang, t]);

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
          speakText(text, settings.speechRate, lang);
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
  }, [settings.screenReaderVoice, settings.speechRate, lang]);

  // Reset all
  const handleResetAll = () => {
    const fresh = { ...DEFAULT_ACCESSIBILITY_SETTINGS, language: settings.language, widgetPosition: settings.widgetPosition };
    setSettings(fresh);
    saveAccessibilitySettings(fresh);
    stopSpeech();
    addToast({
      type: 'info',
      title: t.toast.resetTitle,
      message: t.toast.resetMsg
    });
  };

  // Font Size Handlers
  const handleIncreaseFont = () => {
    const next = Math.min(150, settings.fontSizePercent + 10);
    updateSettings({ fontSizePercent: next });
    speakText(t.speech.textSize(next), settings.speechRate, lang);
  };

  const handleDecreaseFont = () => {
    const next = Math.max(90, settings.fontSizePercent - 10);
    updateSettings({ fontSizePercent: next });
    speakText(t.speech.textSize(next), settings.speechRate, lang);
  };

  // Profile Presets
  const handleSelectProfile = (profile: AccessibilityProfile) => {
    const updated = applyProfilePreset(profile, settings);
    setSettings(updated);
    saveAccessibilitySettings(updated);
    setShowProfileMenu(false);
    
    const profName = t.profiles[profile] || profile;

    addToast({
      type: 'success',
      title: t.toast.profileTitle,
      message: `${profName} ${t.toast.profileMsg}`
    });
    speakText(profName, settings.speechRate, lang);
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
      speakText(t.speech.soundModeOn, settings.speechRate, lang);
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
              {t.readingGuideBanner}
            </span>
          </div>
        </div>
      )}

      {/* 2. FLOATING TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`${t.menuTitle} (CTRL+U)`}
        title={`${t.menuTitle} (CTRL + U)`}
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
          <span>{t.widgetTrigger}</span>
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono">
            Ctrl+U
          </span>
        </div>
      </button>

      {/* 3. MODAL DRAWER SLIDE-OVER */}
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
            {/* TOP HEADER */}
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
                    {t.menuTitle}
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
                    <span>{t.langActive}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showLangMenu ? 'rotate-90' : ''}`} />
                </button>

                {showLangMenu && (
                  <div className="mt-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl space-y-1 text-xs font-medium animate-fadeIn">
                    <button 
                      onClick={() => handleSelectLanguage('id')}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        lang === 'id' 
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>{t.langId}</span>
                      {lang === 'id' && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                    <button 
                      onClick={() => handleSelectLanguage('en')}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        lang === 'en' 
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>{t.langEn}</span>
                      {lang === 'en' && <Check className="w-4 h-4 text-blue-600" />}
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
                    <span>{t.profileTitle}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-90' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className="mt-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl space-y-1 text-xs animate-fadeIn">
                    {[
                      { id: 'none', label: t.profiles.none, icon: ShieldCheck },
                      { id: 'vision', label: t.profiles.vision, icon: Glasses },
                      { id: 'dyslexia', label: t.profiles.dyslexia, icon: BookOpen },
                      { id: 'focus', label: t.profiles.focus, icon: Compass },
                      { id: 'sensitivity', label: t.profiles.sensitivity, icon: Sun },
                      { id: 'motor', label: t.profiles.motor, icon: MousePointer }
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

            {/* MAIN 15 INTERACTIVE TILES GRID */}
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
                <span className="text-[11px] font-bold leading-tight">{t.tiles.screenReader}</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.screenReaderVoice ? t.states.active : t.states.inactive}
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
                <span className="text-[11px] font-bold leading-tight">{t.tiles.increaseFont}</span>
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
                <span className="text-[11px] font-bold leading-tight">{t.tiles.decreaseFont}</span>
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
                <span className="text-[11px] font-bold leading-tight">{t.tiles.saturation}</span>
                <span className="text-[9px] opacity-75 capitalize font-mono truncate w-full text-center">
                  {settings.saturation === 'default' ? t.states.normal : settings.saturation}
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
                <span className="text-[11px] font-bold leading-tight">{t.tiles.contrast}</span>
                <span className="text-[9px] opacity-75 capitalize font-mono truncate w-full text-center">
                  {settings.contrast === 'default' ? t.states.normal : settings.contrast.replace('high-', '')}
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
                <span className="text-[11px] font-bold leading-tight">{t.tiles.hideImages}</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.hideImages ? t.states.on : t.states.off}
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
                   settings.textAlign === 'right' ? <AlignRight className="w-6 h-6" /> :
                   <AlignLeft className="w-6 h-6" />}
                </div>
                <span className="text-[11px] font-bold leading-tight">{t.tiles.textAlign}</span>
                <span className="text-[9px] opacity-75 capitalize font-mono">
                  {settings.textAlign === 'default' ? t.states.standard : settings.textAlign}
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
                <span className="text-[11px] font-bold leading-tight">{t.tiles.dyslexia}</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.dyslexiaFont ? t.states.on : t.states.off}
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
                <span className="text-[11px] font-bold leading-tight">{t.tiles.lineHeight}</span>
                <span className="text-[9px] opacity-75 capitalize font-mono">
                  {settings.lineHeight === 'default' ? t.states.standard : settings.lineHeight === 'relaxed' ? t.states.relaxed : t.states.loose}
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
                <span className="text-[11px] font-bold leading-tight">{t.tiles.pauseAnimations}</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.pauseAnimations ? t.states.paused : t.states.playing}
                </span>
              </button>

              {/* TILE 11: KURSOR BESAR */}
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
                <span className="text-[11px] font-bold leading-tight">{t.tiles.bigCursor}</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.bigCursor ? t.states.big : t.states.standard}
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
                <span className="text-[11px] font-bold leading-tight">{t.tiles.letterSpacing}</span>
                <span className="text-[9px] opacity-75 capitalize font-mono">
                  {settings.letterSpacing === 'default' ? t.states.standard : settings.letterSpacing === 'wide' ? t.states.wide : t.states.extraWide}
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
                <span className="text-[11px] font-bold leading-tight">{t.tiles.underlineLinks}</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.underlineLinks ? t.states.on : t.states.off}
                </span>
              </button>

              {/* TILE 14: SOROT JUDUL */}
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
                <span className="text-[11px] font-bold leading-tight">{t.tiles.highlightHeadings}</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.highlightHeadings ? t.states.on : t.states.off}
                </span>
              </button>

              {/* TILE 15: PENGGARIS BACA */}
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
                <span className="text-[11px] font-bold leading-tight">{t.tiles.readingGuide}</span>
                <span className="text-[9px] opacity-75 font-mono">
                  {settings.readingGuide ? t.states.on : t.states.off}
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
                <span>{t.footer.resetBtn}</span>
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
                    <span>{t.footer.movePosition}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showPositionMenu ? 'rotate-90' : ''}`} />
                </button>

                {showPositionMenu && (
                  <div className="mt-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm space-y-2 text-xs">
                    {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as WidgetPosition[]).map((pos) => {
                      const isChecked = settings.widgetPosition === pos;
                      return (
                        <label 
                          key={pos} 
                          className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <span className={isChecked ? 'font-black text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}>
                            {t.footer.positions[pos]}
                          </span>
                          <input
                            type="radio"
                            name="widgetPos"
                            checked={isChecked}
                            onChange={() => updateSettings({ widgetPosition: pos })}
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
                {t.footer.tag}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
