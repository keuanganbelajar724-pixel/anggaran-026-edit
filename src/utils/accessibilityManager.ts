import { AccessibilitySettings, DEFAULT_ACCESSIBILITY_SETTINGS, AccessibilityProfile } from '../types/accessibility';

const STORAGE_KEY = 'kppn_accessibility_settings_v2';

export function loadAccessibilitySettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_ACCESSIBILITY_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error loading accessibility settings:', e);
  }
  return { ...DEFAULT_ACCESSIBILITY_SETTINGS };
}

export function saveAccessibilitySettings(settings: AccessibilitySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applyAccessibilityToDOM(settings);
  } catch (e) {
    console.error('Error saving accessibility settings:', e);
  }
}

// Helper to speak text aloud using Web Speech API
export function speakText(text: string, rate: number = 1.0, lang: 'id' | 'en' = 'id') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // Stop ongoing speech
    const cleanText = text.trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;
    utterance.lang = lang === 'en' ? 'en-US' : 'id-ID';

    // Find voice matching language
    const voices = window.speechSynthesis.getVoices();
    if (lang === 'en') {
      const enVoice = voices.find(v => v.lang.startsWith('en') || v.name.toLowerCase().includes('english'));
      if (enVoice) utterance.voice = enVoice;
    } else {
      const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia'));
      if (idVoice) utterance.voice = idVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

// Apply settings directly to HTML document and dynamic style tag
export function applyAccessibilityToDOM(settings: AccessibilitySettings): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  // 1. Font Size Scaling
  if (settings.fontSizePercent !== 100) {
    root.style.fontSize = `${settings.fontSizePercent}%`;
  } else {
    root.style.fontSize = '';
  }

  // 2. Class Toggle List
  const classList = root.classList;

  // Dyslexia font
  if (settings.dyslexiaFont) {
    classList.add('a11y-dyslexia-font');
  } else {
    classList.remove('a11y-dyslexia-font');
  }

  // Text Alignment
  classList.remove('a11y-align-left', 'a11y-align-center', 'a11y-align-justify', 'a11y-align-right');
  if (settings.textAlign !== 'default') {
    classList.add(`a11y-align-${settings.textAlign}`);
  }

  // Line Height
  classList.remove('a11y-line-relaxed', 'a11y-line-loose');
  if (settings.lineHeight === 'relaxed') classList.add('a11y-line-relaxed');
  if (settings.lineHeight === 'loose') classList.add('a11y-line-loose');

  // Letter Spacing
  classList.remove('a11y-spacing-wide', 'a11y-spacing-extra-wide');
  if (settings.letterSpacing === 'wide') classList.add('a11y-spacing-wide');
  if (settings.letterSpacing === 'extra-wide') classList.add('a11y-spacing-extra-wide');

  // Saturation & Color Inversion
  classList.remove('a11y-grayscale', 'a11y-high-sat', 'a11y-low-sat', 'a11y-invert');
  if (settings.saturation === 'grayscale') classList.add('a11y-grayscale');
  if (settings.saturation === 'high-contrast') classList.add('a11y-high-sat');
  if (settings.saturation === 'low-saturation') classList.add('a11y-low-sat');
  if (settings.saturation === 'invert') classList.add('a11y-invert');

  // Contrast Mode
  classList.remove('a11y-contrast-high-dark', 'a11y-contrast-high-light', 'a11y-contrast-monochrome');
  if (settings.contrast === 'high-dark') classList.add('a11y-contrast-high-dark');
  if (settings.contrast === 'high-light') classList.add('a11y-contrast-high-light');
  if (settings.contrast === 'monochrome') classList.add('a11y-contrast-monochrome');

  // Hide Images
  if (settings.hideImages) {
    classList.add('a11y-hide-images');
  } else {
    classList.remove('a11y-hide-images');
  }

  // Underline Links
  if (settings.underlineLinks) {
    classList.add('a11y-underline-links');
  } else {
    classList.remove('a11y-underline-links');
  }

  // Highlight Headings
  if (settings.highlightHeadings) {
    classList.add('a11y-highlight-headings');
  } else {
    classList.remove('a11y-highlight-headings');
  }

  // Pause Animations
  if (settings.pauseAnimations) {
    classList.add('a11y-pause-animations');
  } else {
    classList.remove('a11y-pause-animations');
  }

  // Big Cursor
  if (settings.bigCursor) {
    classList.add('a11y-big-cursor');
  } else {
    classList.remove('a11y-big-cursor');
  }

  // Ensure Global Injected CSS tag exists
  injectAccessibilityCSS();
}

function injectAccessibilityCSS() {
  const STYLE_ID = 'kppn-a11y-dynamic-styles';
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    /* DYSLEXIA FONT */
    .a11y-dyslexia-font, 
    .a11y-dyslexia-font body, 
    .a11y-dyslexia-font button, 
    .a11y-dyslexia-font input, 
    .a11y-dyslexia-font select, 
    .a11y-dyslexia-font p, 
    .a11y-dyslexia-font span, 
    .a11y-dyslexia-font h1, 
    .a11y-dyslexia-font h2, 
    .a11y-dyslexia-font h3, 
    .a11y-dyslexia-font h4 {
      font-family: 'Comic Sans MS', 'Trebuchet MS', 'Verdana', sans-serif !important;
      letter-spacing: 0.05em !important;
      word-spacing: 0.12em !important;
    }

    /* TEXT ALIGNMENT */
    .a11y-align-left p, .a11y-align-left div:not(.a11y-widget-container *) { text-align: left !important; }
    .a11y-align-center p, .a11y-align-center div:not(.a11y-widget-container *) { text-align: center !important; }
    .a11y-align-justify p, .a11y-align-justify div:not(.a11y-widget-container *) { text-align: justify !important; }
    .a11y-align-right p, .a11y-align-right div:not(.a11y-widget-container *) { text-align: right !important; }

    /* LINE HEIGHT */
    .a11y-line-relaxed p, .a11y-line-relaxed span, .a11y-line-relaxed div:not(.a11y-widget-container *) {
      line-height: 1.85 !important;
    }
    .a11y-line-loose p, .a11y-line-loose span, .a11y-line-loose div:not(.a11y-widget-container *) {
      line-height: 2.3 !important;
    }

    /* LETTER SPACING */
    .a11y-spacing-wide p, .a11y-spacing-wide span, .a11y-spacing-wide h1, .a11y-spacing-wide h2, .a11y-spacing-wide h3 {
      letter-spacing: 0.08em !important;
    }
    .a11y-spacing-extra-wide p, .a11y-spacing-extra-wide span, .a11y-spacing-extra-wide h1, .a11y-spacing-extra-wide h2, .a11y-spacing-extra-wide h3 {
      letter-spacing: 0.18em !important;
    }

    /* SATURATION & FILTERS (Excluded for widget itself) */
    .a11y-grayscale body > :not(.a11y-widget-container) {
      filter: grayscale(100%) !important;
    }
    .a11y-high-sat body > :not(.a11y-widget-container) {
      filter: saturate(200%) contrast(115%) !important;
    }
    .a11y-low-sat body > :not(.a11y-widget-container) {
      filter: saturate(50%) !important;
    }
    .a11y-invert body > :not(.a11y-widget-container) {
      filter: invert(100%) hue-rotate(180deg) !important;
    }

    /* CONTRAST MODES */
    .a11y-contrast-high-dark {
      background-color: #000000 !important;
      color: #ffff00 !important;
    }
    .a11y-contrast-high-dark body > :not(.a11y-widget-container) {
      filter: contrast(130%) brightness(110%);
    }
    .a11y-contrast-high-light body > :not(.a11y-widget-container) {
      filter: contrast(140%) brightness(95%);
    }
    .a11y-contrast-monochrome body > :not(.a11y-widget-container) {
      filter: grayscale(100%) contrast(180%) !important;
    }

    /* HIDE IMAGES */
    .a11y-hide-images img:not(.a11y-widget-container *),
    .a11y-hide-images svg:not(.a11y-widget-container *):not(.lucide),
    .a11y-hide-images [style*="background-image"]:not(.a11y-widget-container *) {
      visibility: hidden !important;
      opacity: 0 !important;
    }

    /* UNDERLINE LINKS & HIGHLIGHT BUTTONS */
    .a11y-underline-links a,
    .a11y-underline-links button:not(.a11y-widget-container *) {
      text-decoration: underline 2px solid #2563eb !important;
      text-underline-offset: 4px !important;
    }

    /* HIGHLIGHT HEADINGS */
    .a11y-highlight-headings h1,
    .a11y-highlight-headings h2,
    .a11y-highlight-headings h3,
    .a11y-highlight-headings h4 {
      background-color: rgba(254, 240, 138, 0.35) !important;
      outline: 2px dashed #ca8a04 !important;
      outline-offset: 2px !important;
      border-radius: 4px !important;
    }

    /* PAUSE ANIMATIONS */
    .a11y-pause-animations *,
    .a11y-pause-animations *::before,
    .a11y-pause-animations *::after {
      animation-play-state: paused !important;
      transition: none !important;
    }

    /* BIG CURSOR */
    .a11y-big-cursor,
    .a11y-big-cursor * {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="%232563eb" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 7 18 3-7 7-3L3 3z"/></svg>'), auto !important;
    }
  `;
}

// Preset Profiles Handler
export function applyProfilePreset(profile: AccessibilityProfile, current: AccessibilitySettings): AccessibilitySettings {
  const reset = { ...DEFAULT_ACCESSIBILITY_SETTINGS, widgetPosition: current.widgetPosition };

  switch (profile) {
    case 'vision':
      return {
        ...reset,
        profile: 'vision',
        fontSizePercent: 120,
        contrast: 'high-dark',
        underlineLinks: true,
        highlightHeadings: true,
        bigCursor: true
      };
    case 'dyslexia':
      return {
        ...reset,
        profile: 'dyslexia',
        dyslexiaFont: true,
        fontSizePercent: 110,
        lineHeight: 'relaxed',
        letterSpacing: 'wide'
      };
    case 'focus':
      return {
        ...reset,
        profile: 'focus',
        pauseAnimations: true,
        readingGuide: true,
        highlightHeadings: true
      };
    case 'sensitivity':
      return {
        ...reset,
        profile: 'sensitivity',
        saturation: 'low-saturation',
        contrast: 'high-dark',
        pauseAnimations: true
      };
    case 'motor':
      return {
        ...reset,
        profile: 'motor',
        fontSizePercent: 120,
        bigCursor: true,
        underlineLinks: true
      };
    case 'none':
    default:
      return reset;
  }
}
