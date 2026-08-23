export type AccessibilityProfile = 
  | 'none'
  | 'vision'        // Penglihatan Rendah / Low Vision
  | 'dyslexia'      // Ramah Disleksia
  | 'focus'         // Ramah Fokus / ADHD
  | 'sensitivity'   // Sensitif Cahaya / Fotofobia
  | 'motor';        // Keterbatasan Motorik

export type TextAlignment = 'default' | 'left' | 'center' | 'justify' | 'right';
export type SaturationMode = 'default' | 'grayscale' | 'high-contrast' | 'low-saturation' | 'invert';
export type ContrastMode = 'default' | 'high-dark' | 'high-light' | 'monochrome';
export type WidgetPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

export interface AccessibilitySettings {
  profile: AccessibilityProfile;
  // Font & Sizing
  fontSizePercent: number; // 90, 100, 110, 120, 130, 140, 150
  dyslexiaFont: boolean;
  textAlign: TextAlignment;
  lineHeight: 'default' | 'relaxed' | 'loose';
  letterSpacing: 'default' | 'wide' | 'extra-wide';
  
  // Visual & Color
  saturation: SaturationMode;
  contrast: ContrastMode;
  hideImages: boolean;
  underlineLinks: boolean;
  highlightHeadings: boolean;
  
  // Motion & Guides
  pauseAnimations: boolean;
  bigCursor: boolean;
  readingGuide: boolean;
  readingMask: boolean;
  
  // Voice & Screen Reader
  screenReaderVoice: boolean;
  speechRate: number; // 0.8 to 1.4
  
  // Widget Preferences
  widgetPosition: WidgetPosition;
  soundFeedback: boolean;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  profile: 'none',
  fontSizePercent: 100,
  dyslexiaFont: false,
  textAlign: 'default',
  lineHeight: 'default',
  letterSpacing: 'default',
  saturation: 'default',
  contrast: 'default',
  hideImages: false,
  underlineLinks: false,
  highlightHeadings: false,
  pauseAnimations: false,
  bigCursor: false,
  readingGuide: false,
  readingMask: false,
  screenReaderVoice: false,
  speechRate: 1.0,
  widgetPosition: 'bottom-left',
  soundFeedback: true
};
