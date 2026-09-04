import { SlideShowConfig } from '../types';

export const INITIAL_SLIDESHOW_CONFIG: SlideShowConfig = {
  isEnabled: true,
  autoPlay: true,
  intervalSeconds: 6,
  aspectRatioMode: 'responsive',
  showOnTabs: ['ALL'],
  pauseOnHover: true,
  slides: [
    {
      id: 'slide-1787504389920',
      title: '',
      subtitle: '',
      badge: '',
      imageUrl: 'https://lh3.googleusercontent.com/d/1-A24n4dOjL5SkhPcuFHhsTF929lN476O',
      imageFit: 'contain',
      eventDate: '',
      eventTime: '',
      eventLocation: '',
      linkUrl: '',
      linkLabel: 'Buka Tautan / Gabung Acara',
      targetTabs: ['ALL'],
      isActive: true,
      order: 1,
      createdAt: '2026-08-23T16:59:49.920Z'
    },
    {
      id: 'slide-1787504452222',
      title: '',
      subtitle: '',
      badge: '',
      imageUrl: 'https://lh3.googleusercontent.com/d/1uzQOR8nfAITnObIYEYzD3bGMZPoSiJjJ',
      imageFit: 'contain',
      eventDate: '',
      eventTime: '',
      eventLocation: '',
      linkUrl: '',
      linkLabel: 'Buka Tautan / Gabung Acara',
      targetTabs: ['ALL'],
      isActive: true,
      order: 2,
      createdAt: '2026-08-23T17:00:52.222Z'
    }
  ]
};

export function sanitizeSlideShowConfig(config?: Partial<SlideShowConfig> | null): SlideShowConfig {
  if (!config) return INITIAL_SLIDESHOW_CONFIG;
  
  const rawSlides = Array.isArray(config.slides) ? config.slides : [];
  
  // Filter out any legacy obsolete/dummy slides or mock unsplash slides
  const cleanSlides = rawSlides.filter(s => {
    if (!s) return false;
    if (s.id === 'slide-ramadhan-1446h') return false;
    if (s.id === 'slide-akselerasi-ikpa-utama') return false;
    if (s.id === 'slide-revolving-up-tup') return false;
    if ((s.title || '').toLowerCase().includes('ramadhan')) return false;
    if ((s.imageUrl || '').includes('591604466107')) return false;
    if ((s.imageUrl || '').includes('unsplash.com')) return false;
    return true;
  });

  return {
    isEnabled: config.isEnabled !== undefined ? config.isEnabled : INITIAL_SLIDESHOW_CONFIG.isEnabled,
    autoPlay: config.autoPlay !== undefined ? config.autoPlay : INITIAL_SLIDESHOW_CONFIG.autoPlay,
    intervalSeconds: config.intervalSeconds || INITIAL_SLIDESHOW_CONFIG.intervalSeconds,
    aspectRatioMode: config.aspectRatioMode || INITIAL_SLIDESHOW_CONFIG.aspectRatioMode,
    showOnTabs: config.showOnTabs || INITIAL_SLIDESHOW_CONFIG.showOnTabs,
    pauseOnHover: config.pauseOnHover !== undefined ? config.pauseOnHover : INITIAL_SLIDESHOW_CONFIG.pauseOnHover,
    slides: cleanSlides.length > 0 ? cleanSlides : INITIAL_SLIDESHOW_CONFIG.slides
  };
}
